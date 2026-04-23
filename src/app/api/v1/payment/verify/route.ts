import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Generate a unique reference ID.
 */
function generateRefId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `GPG-${timestamp}-${random}`
}

/**
 * Fire webhook to merchant URL with HMAC-SHA256 signature.
 */
async function fireWebhook(
  merchant: { webhookUrl: string; webhookSecret: string | null; id: string },
  payment: {
    id: string
    authority: string
    amountToman: number
    amountGold: number
    goldGrams: number
    status: string
    feeToman: number
    feeGold: number
    cardPan: string | null
    paidAt: Date | null
    verifiedAt: Date | null
    refId: string | null
  },
  event: string
) {
  const payload = JSON.stringify({
    event,
    data: {
      id: payment.id,
      authority: payment.authority,
      ref_id: payment.refId,
      amount_toman: payment.amountToman,
      amount_gold: payment.amountGold,
      gold_grams: payment.goldGrams,
      fee_toman: payment.feeToman,
      fee_gold: payment.feeGold,
      status: payment.status,
      card_pan: payment.cardPan,
      paid_at: payment.paidAt?.toISOString(),
      verified_at: payment.verifiedAt?.toISOString(),
    },
    timestamp: new Date().toISOString(),
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Gateway-Event': event,
  }

  if (merchant.webhookSecret) {
    const signature = crypto
      .createHmac('sha256', merchant.webhookSecret)
      .update(payload)
      .digest('hex')
    headers['X-Webhook-Signature'] = `sha256=${signature}`
  }

  let response: Response | null = null
  let statusCode = 0
  let responseBody = ''

  try {
    response = await fetch(merchant.webhookUrl, {
      method: 'POST',
      headers,
      body: payload,
      signal: AbortSignal.timeout(10_000),
    })
    statusCode = response.status
    responseBody = await response.text().catch(() => '')
  } catch {
    statusCode = 0
  }

  await db.webhookLog.create({
    data: {
      paymentId: payment.id,
      merchantId: merchant.id,
      url: merchant.webhookUrl,
      method: 'POST',
      payload,
      response: responseBody || null,
      statusCode,
      success: statusCode >= 200 && statusCode < 300,
      attempts: 1,
    },
  })
}

/**
 * Create a Transaction record in the database.
 */
async function createTransactionRecord(params: {
  userId?: string
  type: string
  amountFiat: number
  amountGold: number
  fee: number
  goldPrice?: number | null
  status: string
  referenceId: string
  description?: string
}) {
  try {
    await db.transaction.create({
      data: {
        userId: params.userId || 'system',
        type: params.type,
        amountFiat: params.amountFiat,
        amountGold: params.amountGold,
        fee: params.fee,
        goldPrice: params.goldPrice,
        status: params.status,
        referenceId: params.referenceId,
        description: params.description,
      },
    })
  } catch (error) {
    console.error('[Payment Verify] Transaction record creation error:', error)
  }
}

/**
 * Basic risk check: flag duplicate card PAN usage.
 */
async function checkCardRisk(
  cardPan: string | null | undefined,
  merchantId: string
): Promise<{ score: number; flags: string[] }> {
  const flags: string[] = []
  let score = 0

  if (!cardPan) return { score, flags }

  /* Count how many payments used this card in the last 24h */
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentCardPayments = await db.gatewayPayment.count({
    where: {
      cardPan,
      status: 'paid',
      paidAt: { gte: oneDayAgo },
    },
  })

  if (recentCardPayments >= 10) {
    score += 40
    flags.push('high_card_velocity')
  } else if (recentCardPayments >= 5) {
    score += 20
    flags.push('elevated_card_velocity')
  }

  return { score, flags }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  POST Handler                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * POST /api/v1/payment/verify
 * Verify and complete a payment.
 *
 * Body: { authority, paymentMethod, goldPercent?, status?, card_pan?, ref_id? }
 *
 * Payment methods:
 *  - toman: mark as paid (simulated ZarinPal integration)
 *  - gold:  deduct from user's GoldWallet
 *  - mixed: deduct gold portion + mark toman portion as pending
 *
 * Returns: { success, ref_id, paid_amount, paid_gold }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      authority,
      paymentMethod,
      goldPercent,
      status,
      card_pan,
      ref_id,
      userId,
    } = body as Record<string, unknown>

    /* ── Validate authority ── */
    if (!authority || typeof authority !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'شناسه تراکنش (authority) الزامی است',
          error_code: -1,
        },
        { status: 400 }
      )
    }

    /* ── Find payment with merchant ── */
    const payment = await db.gatewayPayment.findUnique({
      where: { authority },
      include: { merchant: true },
    })

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: 'تراکنش یافت نشد',
          error_code: -2,
        },
        { status: 404 }
      )
    }

    /* ── Already verified ── */
    if (payment.status === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'این تراکنش قبلاً تأیید شده است',
        data: {
          authority: payment.authority,
          ref_id: payment.refId,
          paid_amount: payment.amountToman,
          paid_gold: payment.goldGrams,
          status: 'paid',
        },
      })
    }

    /* ── Check expiry ── */
    if (new Date() > payment.expiresAt) {
      await db.gatewayPayment.update({
        where: { authority },
        data: { status: 'expired' },
      })

      return NextResponse.json(
        {
          success: false,
          message: 'تراکنش منقضی شده است. لطفاً تراکنش جدید ایجاد کنید',
          error_code: -3,
        },
        { status: 400 }
      )
    }

    /* ── Payment cancelled by gateway / user ── */
    if (status === 'NOK') {
      await db.gatewayPayment.update({
        where: { authority },
        data: { status: 'expired' },
      })

      return NextResponse.json(
        {
          success: false,
          message: 'تراکنش توسط کاربر یا درگاه لغو شد',
          error_code: -4,
        },
        { status: 400 }
      )
    }

    /* ── Resolve payment method ── */
    const method = (paymentMethod as string) || payment.paymentMethod || 'toman'
    const resolvedUserId = (userId as string) || payment.userId || null

    let paidAmountToman = 0
    let paidAmountGold = 0
    let txDescription = ''
    const now = new Date()
    const refId = (ref_id as string) || generateRefId()

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*  TOMAN PAYMENT — simulated (real ZarinPal integration is separate)     */
    /* ═══════════════════════════════════════════════════════════════════════ */
    if (method === 'toman') {
      /* ── Risk check: card velocity ── */
      const { score: cardRiskScore, flags: cardRiskFlags } = await checkCardRisk(
        card_pan as string | null,
        payment.merchantId
      )

      if (cardRiskScore >= 40) {
        await db.riskEvent.create({
          data: {
            paymentId: payment.id,
            userId: resolvedUserId,
            merchantId: payment.merchantId,
            eventType: 'high_card_velocity',
            riskScore: cardRiskScore,
            details: JSON.stringify({ flags: cardRiskFlags, card_pan: card_pan }),
            isResolved: false,
          },
        })
      }

      paidAmountToman = payment.amountToman

      /* Update payment */
      await db.gatewayPayment.update({
        where: { authority },
        data: {
          status: 'paid',
          refId,
          cardPan: (card_pan as string) || payment.cardPan || null,
          userId: resolvedUserId,
          paidAt: now,
          verifiedAt: now,
        },
      })

      txDescription = `پرداخت واحد طلاییی — ${payment.description || payment.merchant.businessName}`

      /* Create Transaction record */
      await createTransactionRecord({
        userId: resolvedUserId || undefined,
        type: 'gateway_payment_toman',
        amountFiat: paidAmountToman,
        amountGold: 0,
        fee: payment.feeToman,
        goldPrice: payment.goldPriceAtPay,
        status: 'completed',
        referenceId: refId,
        description: txDescription,
      })
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*  GOLD PAYMENT — deduct from user's GoldWallet                          */
    /* ═══════════════════════════════════════════════════════════════════════ */
    else if (method === 'gold') {
      if (!resolvedUserId) {
        return NextResponse.json(
          {
            success: false,
            message: 'برای پرداخت طلایی، شناسه کاربر الزامی است',
            error_code: -5,
          },
          { status: 400 }
        )
      }

      const goldToDeduct = payment.goldGrams

      /* Check user's gold wallet */
      const goldWallet = await db.goldWallet.findUnique({
        where: { userId: resolvedUserId },
      })

      if (!goldWallet) {
        return NextResponse.json(
          {
            success: false,
            message: 'کیف پول طلای کاربر یافت نشد',
            error_code: -6,
          },
          { status: 404 }
        )
      }

      const availableGold = goldWallet.goldGrams - goldWallet.frozenGold

      if (availableGold < goldToDeduct) {
        return NextResponse.json(
          {
            success: false,
            message: `موجودی طلا کافی نیست. موجودی قابل استفاده: ${availableGold.toFixed(4)} گرم`,
            error_code: -7,
          },
          { status: 400 }
        )
      }

      /* Get latest gold price */
      const latestGoldPrice = await db.goldPrice.findFirst({
        orderBy: { createdAt: 'desc' },
      })

      /* Deduct gold from wallet */
      await db.goldWallet.update({
        where: { userId: resolvedUserId },
        data: {
          goldGrams: { decrement: goldToDeduct },
        },
      })

      paidAmountGold = goldToDeduct

      /* Update payment */
      await db.gatewayPayment.update({
        where: { authority },
        data: {
          status: 'paid',
          refId,
          userId: resolvedUserId,
          paidAt: now,
          verifiedAt: now,
          goldPriceAtPay: latestGoldPrice?.buyPrice || payment.goldPriceAtPay,
        },
      })

      txDescription = `پرداخت طلایی — ${payment.description || payment.merchant.businessName}`

      /* Create Transaction record */
      await createTransactionRecord({
        userId: resolvedUserId,
        type: 'gateway_payment_gold',
        amountFiat: 0,
        amountGold: paidAmountGold,
        fee: payment.feeGold,
        goldPrice: latestGoldPrice?.buyPrice,
        status: 'completed',
        referenceId: refId,
        description: txDescription,
      })
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*  MIXED PAYMENT — deduct gold portion + mark toman portion              */
    /* ═══════════════════════════════════════════════════════════════════════ */
    else if (method === 'mixed') {
      if (!resolvedUserId) {
        return NextResponse.json(
          {
            success: false,
            message: 'برای پرداخت ترکیبی، شناسه کاربر الزامی است',
            error_code: -5,
          },
          { status: 400 }
        )
      }

      /* Resolve gold/toman split */
      const goldPct = Number(goldPercent) || 50 // default 50/50 split
      const totalTomanEquivalent = payment.amountToman

      const goldPortionToman = totalTomanEquivalent * (goldPct / 100)
      const tomanPortion = totalTomanEquivalent - goldPortionToman

      /* Get latest gold price for conversion */
      const latestGoldPrice = await db.goldPrice.findFirst({
        orderBy: { createdAt: 'desc' },
      })

      const goldPricePerGram = latestGoldPrice?.buyPrice || 35_000_000
      const goldGramsToDeduct = goldPortionToman / goldPricePerGram

      /* Check gold wallet balance */
      const goldWallet = await db.goldWallet.findUnique({
        where: { userId: resolvedUserId },
      })

      if (!goldWallet) {
        return NextResponse.json(
          {
            success: false,
            message: 'کیف پول طلای کاربر یافت نشد',
            error_code: -6,
          },
          { status: 404 }
        )
      }

      const availableGold = goldWallet.goldGrams - goldWallet.frozenGold

      if (availableGold < goldGramsToDeduct) {
        return NextResponse.json(
          {
            success: false,
            message: `موجودی طلا کافی نیست. موجودی قابل استفاده: ${availableGold.toFixed(4)} گرم — مورد نیاز: ${goldGramsToDeduct.toFixed(4)} گرم`,
            error_code: -7,
          },
          { status: 400 }
        )
      }

      /* Deduct gold portion from wallet */
      await db.goldWallet.update({
        where: { userId: resolvedUserId },
        data: {
          goldGrams: { decrement: goldGramsToDeduct },
        },
      })

      paidAmountToman = tomanPortion
      paidAmountGold = goldGramsToDeduct

      /* Update payment */
      await db.gatewayPayment.update({
        where: { authority },
        data: {
          status: 'paid',
          refId,
          userId: resolvedUserId,
          cardPan: (card_pan as string) || payment.cardPan || null,
          paidAt: now,
          verifiedAt: now,
          goldPriceAtPay: goldPricePerGram,
          goldGrams: goldGramsToDeduct,
          amountGold: goldGramsToDeduct,
          amountToman: tomanPortion,
        },
      })

      txDescription = `پرداخت ترکیبی (${goldPct}% طلا) — ${payment.description || payment.merchant.businessName}`

      /* Create Transaction record for gold portion */
      await createTransactionRecord({
        userId: resolvedUserId,
        type: 'gateway_payment_mixed_gold',
        amountFiat: 0,
        amountGold: goldGramsToDeduct,
        fee: payment.feeGold * (goldPct / 100),
        goldPrice: goldPricePerGram,
        status: 'completed',
        referenceId: `${refId}-GOLD`,
        description: `${txDescription} (بخش طلایی)`,
      })

      /* Create Transaction record for toman portion */
      await createTransactionRecord({
        userId: resolvedUserId || undefined,
        type: 'gateway_payment_mixed_toman',
        amountFiat: tomanPortion,
        amountGold: 0,
        fee: payment.feeToman * ((100 - goldPct) / 100),
        goldPrice: goldPricePerGram,
        status: 'completed',
        referenceId: `${refId}-TOMAN`,
        description: `${txDescription} (بخش واحد طلاییی)`,
      })
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*  UNKNOWN METHOD                                                          */
    /* ═══════════════════════════════════════════════════════════════════════ */
    else {
      return NextResponse.json(
        {
          success: false,
          message: `روش پرداخت "${method}" پشتیبانی نمی‌شود`,
          error_code: -8,
        },
        { status: 400 }
      )
    }

    /* ── Update merchant totals ── */
    await db.merchant.update({
      where: { id: payment.merchantId },
      data: {
        totalSales: { increment: paidAmountToman },
        totalSalesGold: { increment: paidAmountGold },
        pendingSettle: {
          increment: Math.max(0, paidAmountToman - payment.feeToman),
        },
        pendingSettleGold: {
          increment: Math.max(0, paidAmountGold - payment.feeGold),
        },
      },
    })

    /* ── Fetch updated payment for webhook ── */
    const updatedPayment = await db.gatewayPayment.findUnique({
      where: { authority },
    })

    if (!updatedPayment) {
      return NextResponse.json(
        {
          success: false,
          message: 'خطا در بازیابی تراکنش پس از تأیید',
          error_code: -98,
        },
        { status: 500 }
      )
    }

    /* ── Fire webhook to merchant ── */
    if (payment.merchant.webhookUrl) {
      fireWebhook(payment.merchant, updatedPayment, 'payment.verified').catch(
        (err) => {
          console.error('[Payment Verify] Webhook fire error:', err)
        }
      )
    }

    /* ── Return success ── */
    return NextResponse.json({
      success: true,
      message: 'پرداخت با موفقیت تأیید شد',
      data: {
        authority: updatedPayment.authority,
        ref_id: updatedPayment.refId,
        paid_amount: paidAmountToman,
        paid_gold: paidAmountGold,
        payment_method: method,
        status: updatedPayment.status,
        card_pan: updatedPayment.cardPan,
        verified_at: updatedPayment.verifiedAt,
        paid_at: updatedPayment.paidAt,
      },
    })
  } catch (error) {
    console.error('[Payment Verify] Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطای داخلی سرور. لطفاً دوباره تلاش کنید',
        error_code: -99,
      },
      { status: 500 }
    )
  }
}

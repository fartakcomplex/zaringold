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
  return `GPG-WP-${timestamp}-${random}`
}

/**
 * Fire webhook to merchant about wallet payment event.
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
  event: string = 'payment.wallet_paid'
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
      payment_source: 'gold_wallet',
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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  POST Handler                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * POST /api/v1/wallet/pay
 * Pay from user's gold wallet for a gateway payment.
 *
 * Body: { userId, authority, amount_gold, paymentMethod }
 *
 * Flow:
 *  1. Validate inputs
 *  2. Fetch payment and verify it's pending
 *  3. Check gold wallet balance
 *  4. Deduct gold from GoldWallet (atomic)
 *  5. Update GatewayPayment status to 'paid'
 *  6. Create Transaction record
 *  7. Update merchant totals
 *  8. Fire webhook
 *
 * Returns: { success, ref_id, gold_deducted }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, authority, amount_gold, paymentMethod } = body as Record<string, unknown>

    /* ── Validate required fields ── */
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'شناسه کاربر (userId) الزامی است',
          error_code: -1,
        },
        { status: 400 }
      )
    }

    if (!authority || typeof authority !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'شناسه تراکنش (authority) الزامی است',
          error_code: -2,
        },
        { status: 400 }
      )
    }

    if (!amount_gold || Number(amount_gold) <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'مقدار طلای پرداختی باید بیشتر از صفر باشد',
          error_code: -3,
        },
        { status: 400 }
      )
    }

    const goldToDeduct = Number(amount_gold)
    const method = (paymentMethod as string) || 'gold'

    /* ── Fetch payment with merchant info ── */
    const payment = await db.gatewayPayment.findUnique({
      where: { authority },
      include: { merchant: true },
    })

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: 'تراکنش با این شناسه یافت نشد',
          error_code: -4,
        },
        { status: 404 }
      )
    }

    /* ── Check payment status ── */
    if (payment.status === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'این تراکنش قبلاً پرداخت شده است',
        data: {
          authority: payment.authority,
          ref_id: payment.refId,
          gold_deducted: payment.goldGrams,
          status: 'paid',
        },
      })
    }

    if (payment.status === 'expired') {
      return NextResponse.json(
        {
          success: false,
          message: 'تراکنش منقضی شده است. لطفاً تراکنش جدید ایجاد کنید',
          error_code: -5,
        },
        { status: 400 }
      )
    }

    if (payment.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          message: `تراکنش با وضعیت "${payment.status}" قابل پرداخت نیست`,
          error_code: -6,
        },
        { status: 400 }
      )
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
          error_code: -5,
        },
        { status: 400 }
      )
    }

    /* ── Validate gold amount matches or doesn't exceed required ── */
    if (method === 'gold' && goldToDeduct > payment.goldGrams + 0.001) {
      // Allow small tolerance
      return NextResponse.json(
        {
          success: false,
          message: `مقدار طلای درخواستی (${goldToDeduct} گرم) بیشتر از مقدار تراکنش (${payment.goldGrams} گرم) است`,
          error_code: -7,
        },
        { status: 400 }
      )
    }

    /* ── Check user's gold wallet ── */
    const goldWallet = await db.goldWallet.findUnique({
      where: { userId },
    })

    if (!goldWallet) {
      return NextResponse.json(
        {
          success: false,
          message: 'کیف پول طلای کاربر یافت نشد. ابتدا کیف پول طلای خود را فعال کنید',
          error_code: -8,
        },
        { status: 404 }
      )
    }

    /* Check if user is frozen */
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isFrozen: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'حساب کاربری غیرفعال است',
          error_code: -9,
        },
        { status: 403 }
      )
    }

    if (user.isFrozen) {
      return NextResponse.json(
        {
          success: false,
          message: 'حساب کاربری مسدود شده است. لطفاً با پشتیبانی تماس بگیرید',
          error_code: -10,
        },
        { status: 403 }
      )
    }

    const availableGold = goldWallet.goldGrams - goldWallet.frozenGold

    if (availableGold < goldToDeduct) {
      return NextResponse.json(
        {
          success: false,
          message: `موجودی طلا کافی نیست. موجودی قابل استفاده: ${availableGold.toFixed(4)} گرم — مورد نیاز: ${goldToDeduct.toFixed(4)} گرم`,
          error_code: -11,
          data: {
            available_gold: availableGold,
            required_gold: goldToDeduct,
            shortfall: goldToDeduct - availableGold,
          },
        },
        { status: 400 }
      )
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*  Execute Payment (Atomic deduction)                                      */
    /* ═══════════════════════════════════════════════════════════════════════ */

    const now = new Date()
    const refId = generateRefId()

    /* Get latest gold price */
    const latestGoldPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })
    const goldPriceAtPay = latestGoldPrice?.buyPrice || payment.goldPriceAtPay || 35_000_000

    /* Deduct gold from wallet */
    await db.goldWallet.update({
      where: { userId },
      data: {
        goldGrams: { decrement: goldToDeduct },
      },
    })

    /* Update payment status */
    const updatedPayment = await db.gatewayPayment.update({
      where: { authority },
      data: {
        status: 'paid',
        refId,
        userId,
        paymentMethod: method,
        paidAt: now,
        verifiedAt: now,
        goldPriceAtPay,
        goldGrams: goldToDeduct,
        amountGold: goldToDeduct,
      },
    })

    /* ── Create Transaction record ── */
    try {
      await db.transaction.create({
        data: {
          userId,
          type: 'wallet_pay_gold',
          amountFiat: 0,
          amountGold: -goldToDeduct, // negative = outflow
          fee: payment.feeGold,
          goldPrice: goldPriceAtPay,
          status: 'completed',
          referenceId: refId,
          description: `پرداخت از کیف پول طلا — ${payment.description || payment.merchant.businessName}`,
        },
      })
    } catch (txError) {
      console.error('[Wallet Pay] Transaction record error:', txError)
    }

    /* ── Update merchant totals ── */
    await db.merchant.update({
      where: { id: payment.merchantId },
      data: {
        totalSales: { increment: payment.amountToman },
        totalSalesGold: { increment: goldToDeduct },
        pendingSettle: {
          increment: Math.max(0, payment.amountToman - payment.feeToman),
        },
        pendingSettleGold: {
          increment: Math.max(0, goldToDeduct - payment.feeGold),
        },
      },
    })

    /* ── Fire webhook ── */
    if (payment.merchant.webhookUrl) {
      fireWebhook(payment.merchant, updatedPayment, 'payment.wallet_paid').catch(
        (err) => {
          console.error('[Wallet Pay] Webhook fire error:', err)
        }
      )
    }

    /* ── Log risk event if high amount ── */
    if (goldToDeduct >= 10) {
      await db.riskEvent.create({
        data: {
          paymentId: payment.id,
          userId,
          merchantId: payment.merchantId,
          eventType: 'wallet_high_value_payment',
          riskScore: 15,
          details: JSON.stringify({
            gold_deducted: goldToDeduct,
            gold_price_at_pay: goldPriceAtPay,
            toman_equivalent: goldToDeduct * goldPriceAtPay,
            payment_method: method,
          }),
          isResolved: false,
        },
      })
    }

    /* ── Return success ── */
    return NextResponse.json({
      success: true,
      message: 'پرداخت از کیف پول طلا با موفقیت انجام شد',
      data: {
        authority: updatedPayment.authority,
        ref_id: updatedPayment.refId,
        gold_deducted: goldToDeduct,
        gold_price_at_pay: goldPriceAtPay,
        toman_equivalent: goldToDeduct * goldPriceAtPay,
        fee_gold: payment.feeGold,
        net_gold: goldToDeduct - payment.feeGold,
        payment_method: method,
        status: updatedPayment.status,
        paid_at: updatedPayment.paidAt,
        verified_at: updatedPayment.verifiedAt,
        wallet_balance_after: availableGold - goldToDeduct,
      },
    })
  } catch (error) {
    console.error('[Wallet Pay] Error:', error)
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

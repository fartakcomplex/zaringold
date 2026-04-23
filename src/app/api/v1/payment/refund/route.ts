import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Validate API key using SHA-256 hash and return merchant if valid.
 */
async function validateApiKey(apiKey: string) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 8) return null

  const hash = crypto.createHash('sha256').update(apiKey.trim()).digest('hex')
  const keyRecord = await db.apiKey.findUnique({
    where: { keyHash: hash, isActive: true },
    include: { merchant: true },
  })

  if (!keyRecord || !keyRecord.merchant.isActive) return null
  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) return null

  await db.apiKey.update({
    where: { id: keyRecord.id },
    data: { lastUsedAt: new Date() },
  })

  return keyRecord.merchant
}

/**
 * Generate a unique reference ID for the refund.
 */
function generateRefundRefId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `GPG-REF-${timestamp}-${random}`
}

/**
 * Fire webhook to merchant about refund event.
 */
async function fireWebhook(
  merchant: { webhookUrl: string; webhookSecret: string | null; id: string },
  refund: {
    id: string
    paymentId: string
    amountToman: number
    amountGold: number
    status: string
    reason: string
  },
  event: string = 'payment.refunded'
) {
  const payload = JSON.stringify({
    event,
    data: {
      refund_id: refund.id,
      payment_id: refund.paymentId,
      amount_toman: refund.amountToman,
      amount_gold: refund.amountGold,
      status: refund.status,
      reason: refund.reason,
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
      paymentId: refund.paymentId,
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
 * Calculate refund risk score.
 * Flags: multiple refunds in short time, high refund ratio, large amount.
 */
async function calculateRefundRisk(
  merchantId: string,
  paymentId: string,
  amountToman: number
): Promise<{ score: number; flags: string[] }> {
  const flags: string[] = []
  let score = 0

  /* Check recent refund frequency (last 24h) */
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentRefunds = await db.gatewayRefund.count({
    where: {
      merchantId,
      createdAt: { gte: oneDayAgo },
    },
  })

  if (recentRefunds >= 10) {
    score += 30
    flags.push('high_refund_frequency')
  } else if (recentRefunds >= 5) {
    score += 15
    flags.push('elevated_refund_frequency')
  }

  /* High amount refund */
  if (amountToman > 50_000_000) {
    score += 20
    flags.push('high_refund_amount')
  }

  /* Check if same payment was refunded before (suspicious) */
  const previousRefunds = await db.gatewayRefund.count({
    where: { paymentId },
  })
  if (previousRefunds >= 1) {
    score += 25
    flags.push('repeat_refund_same_payment')
  }

  return { score: Math.min(score, 100), flags }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  POST Handler                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * POST /api/v1/payment/refund
 * Process a refund (full or partial) for a paid payment.
 *
 * Body: { merchant_key, payment_id, amount_toman?, amount_gold?, reason, refund_method }
 * Returns: refund status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchant_key,
      api_key,
      payment_id,
      authority,
      amount_toman,
      amount_gold,
      reason,
      refund_method,
    } = body as Record<string, unknown>

    /* ── Validate API key ── */
    const rawKey = (merchant_key || api_key) as string | undefined
    if (!rawKey) {
      return NextResponse.json(
        {
          success: false,
          message: 'کلید API (merchant_key) الزامی است',
          error_code: -1,
        },
        { status: 400 }
      )
    }

    const merchant = await validateApiKey(rawKey)
    if (!merchant) {
      return NextResponse.json(
        {
          success: false,
          message: 'کلید API نامعتبر، غیرفعال یا منقضی شده است',
          error_code: -2,
        },
        { status: 401 }
      )
    }

    /* ── Find payment (by payment_id or authority) ── */
    const payment = await db.gatewayPayment.findFirst({
      where: {
        OR: [
          payment_id ? { id: payment_id as string } : {},
          authority ? { authority: authority as string } : {},
        ],
      },
    })

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: 'تراکنش یافت نشد',
          error_code: -3,
        },
        { status: 404 }
      )
    }

    /* ── Ownership check ── */
    if (payment.merchantId !== merchant.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'این تراکنش متعلق به کسب‌وکار شما نیست',
          error_code: -4,
        },
        { status: 403 }
      )
    }

    /* ── Only paid payments can be refunded ── */
    if (payment.status !== 'paid') {
      return NextResponse.json(
        {
          success: false,
          message: `تراکنش با وضعیت "${payment.status}" قابل استرداد نیست. فقط تراکنش‌های پرداخت‌شده قابل استرداد هستند`,
          error_code: -5,
        },
        { status: 400 }
      )
    }

    /* ── Check for existing pending/processing refunds ── */
    const existingActiveRefund = await db.gatewayRefund.findFirst({
      where: {
        paymentId: payment.id,
        status: { in: ['pending', 'processing'] },
      },
    })

    if (existingActiveRefund) {
      return NextResponse.json(
        {
          success: false,
          message: 'قبلاً درخواست استرداد فعال برای این تراکنش وجود دارد. لطفاً منتظر بررسی بمانید',
          error_code: -6,
        },
        { status: 409 }
      )
    }

    /* ── Resolve refund amounts (default to full amount) ── */
    const refundToman = Number(amount_toman) || 0
    const refundGold = Number(amount_gold) || 0
    const isFullRefund = refundToman === 0 && refundGold === 0

    const resolvedRefundToman = isFullRefund ? payment.amountToman : refundToman
    const resolvedRefundGold = isFullRefund ? payment.goldGrams : refundGold

    /* ── Validate refund doesn't exceed original amount ── */
    if (resolvedRefundToman > payment.amountToman) {
      return NextResponse.json(
        {
          success: false,
          message: `مبلغ استرداد واحد طلاییی (${resolvedRefundToman.toLocaleString('fa-IR')} واحد طلایی) بیشتر از مبلغ پرداختی (${payment.amountToman.toLocaleString('fa-IR')} واحد طلایی) است`,
          error_code: -7,
        },
        { status: 400 }
      )
    }

    if (resolvedRefundGold > payment.goldGrams) {
      return NextResponse.json(
        {
          success: false,
          message: `مقدار استرداد طلایی (${resolvedRefundGold} گرم) بیشتر از مقدار پرداختی (${payment.goldGrams} گرم) است`,
          error_code: -7,
        },
        { status: 400 }
      )
    }

    /* ── At least one refund amount must be positive ── */
    if (resolvedRefundToman <= 0 && resolvedRefundGold <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'حداقل یکی از مبالغ استرداد (واحد طلایی یا طلایی) باید بیشتر از صفر باشد',
          error_code: -8,
        },
        { status: 400 }
      )
    }

    /* ── Risk assessment ── */
    const { score: riskScore, flags: riskFlags } = await calculateRefundRisk(
      merchant.id,
      payment.id,
      resolvedRefundToman
    )

    const refundStatus = riskScore >= 50 ? 'pending' : 'pending'

    /* ── Create GatewayRefund record ── */
    const refund = await db.gatewayRefund.create({
      data: {
        paymentId: payment.id,
        merchantId: merchant.id,
        amountToman: resolvedRefundToman,
        amountGold: resolvedRefundGold,
        reason: (reason as string) || 'بدون دلیل مشخص',
        refundMethod: (refund_method as string) || 'original',
        status: refundStatus,
      },
    })

    /* ── Log risk event if elevated ── */
    if (riskScore >= 20) {
      await db.riskEvent.create({
        data: {
          paymentId: payment.id,
          merchantId: merchant.id,
          eventType: 'refund_risk',
          riskScore,
          details: JSON.stringify({
            flags: riskFlags,
            refund_toman: resolvedRefundToman,
            refund_gold: resolvedRefundGold,
            reason: reason,
            refund_method: refund_method,
          }),
          isResolved: false,
        },
      })
    }

    /* ── Create Transaction record for the refund ── */
    try {
      const refId = generateRefundRefId()
      await db.transaction.create({
        data: {
          userId: payment.userId || 'system',
          type: 'gateway_refund',
          amountFiat: -resolvedRefundToman, // negative for refund
          amountGold: -resolvedRefundGold,
          fee: 0,
          goldPrice: payment.goldPriceAtPay,
          status: 'pending',
          referenceId: refId,
          description: `استرداد — ${payment.description || payment.merchant.businessName} — ${reason || 'بدون دلیل'}`,
        },
      })
    } catch (txError) {
      console.error('[Payment Refund] Transaction record error:', txError)
    }

    /* ── Fire webhook notification ── */
    if (merchant.webhookUrl) {
      fireWebhook(merchant, refund, 'payment.refunded').catch((err) => {
        console.error('[Payment Refund] Webhook fire error:', err)
      })
    }

    /* ── Return success ── */
    return NextResponse.json({
      success: true,
      message: isFullRefund
        ? 'درخواست استرداد کامل با موفقیت ثبت شد'
        : 'درخواست استرداد جزئی با موفقیت ثبت شد',
      data: {
        refund_id: refund.id,
        payment_id: refund.paymentId,
        amount_toman: refund.amountToman,
        amount_gold: refund.amountGold,
        reason: refund.reason,
        refund_method: refund.refundMethod,
        status: refund.status,
        is_full_refund: isFullRefund,
        risk_score: riskScore >= 20 ? riskScore : undefined,
        risk_flags: riskFlags.length > 0 ? riskFlags : undefined,
        created_at: refund.createdAt,
        message:
          riskScore >= 50
            ? 'این درخواست به دلیل ریسک بالا نیاز به بررسی دستی دارد'
            : undefined,
      },
    })
  } catch (error) {
    console.error('[Payment Refund] Error:', error)
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

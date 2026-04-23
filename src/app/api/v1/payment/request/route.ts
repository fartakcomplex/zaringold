import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const PAYMENT_EXPIRY_SECONDS = 15 * 60 // 15 minutes
const MAX_AMOUNT_TOMAN = 500_000_000
const MIN_AMOUNT_TOMAN = 1_000
const MIN_AMOUNT_GOLD = 0.001
const RAPID_PAYMENT_WINDOW_MS = 60_000 // 1 minute
const RAPID_PAYMENT_THRESHOLD = 5

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

  /* Check key expiry */
  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) return null

  /* Touch lastUsedAt */
  await db.apiKey.update({
    where: { id: keyRecord.id },
    data: { lastUsedAt: new Date() },
  })

  return keyRecord.merchant
}

/**
 * Basic risk scoring:
 *  - Check for rapid payment creation from same merchant
 *  - Detect duplicate amounts in short window
 * Returns a risk score between 0 and 100.
 */
async function calculateRiskScore(merchantId: string, amountToman: number): Promise<{
  score: number
  flags: string[]
}> {
  const flags: string[] = []
  let score = 0

  const windowStart = new Date(Date.now() - RAPID_PAYMENT_WINDOW_MS)

  /* ── Rapid payment detection ── */
  const recentPayments = await db.gatewayPayment.count({
    where: {
      merchantId,
      createdAt: { gte: windowStart },
    },
  })

  if (recentPayments >= RAPID_PAYMENT_THRESHOLD) {
    score += 30
    flags.push('rapid_payments')
  }

  /* ── Duplicate same-amount payments in short window ── */
  if (amountToman > 0) {
    const duplicateAmountPayments = await db.gatewayPayment.count({
      where: {
        merchantId,
        amountToman,
        createdAt: { gte: windowStart },
      },
    })

    if (duplicateAmountPayments >= 3) {
      score += 20
      flags.push('duplicate_amounts')
    }
  }

  /* ── High-amount transaction ── */
  if (amountToman > 100_000_000) {
    score += 15
    flags.push('high_amount')
  }

  /* ── Check merchant risk score ── */
  const merchant = await db.merchant.findUnique({
    where: { id: merchantId },
    select: { riskScore: true },
  })

  if (merchant && merchant.riskScore > 50) {
    score += 10
    flags.push('elevated_merchant_risk')
  }

  return { score: Math.min(score, 100), flags }
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
  },
  event: string = 'payment.created'
) {
  const payload = JSON.stringify({
    event,
    data: {
      id: payment.id,
      authority: payment.authority,
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

  /* Compute HMAC-SHA256 signature if secret exists */
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
    headers['X-Webhook-Secret'] = merchant.webhookSecret
  }

  let response: Response | null = null
  let statusCode = 0
  let responseBody = ''

  try {
    response = await fetch(merchant.webhookUrl, {
      method: 'POST',
      headers,
      body: payload,
      signal: AbortSignal.timeout(10_000), // 10s timeout
    })
    statusCode = response.status
    responseBody = await response.text().catch(() => '')
  } catch {
    statusCode = 0
  }

  /* Log webhook delivery attempt */
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
 * POST /api/v1/payment/request
 * Create a new payment request (used by merchants via API key).
 *
 * Body: { merchant_key, amount, currency, callback_url, description,
 *         customer_phone, metadata }
 * Returns: { authority, payment_url }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchant_key,
      api_key,
      amount,
      currency,
      callback_url,
      description,
      customer_phone,
      customer_email,
      customer_name,
      amount_toman,
      amount_gold,
      payment_method,
      metadata,
    } = body as Record<string, unknown>

    /* ── Validate API key (support both merchant_key and api_key) ── */
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

    /* ── Resolve payment method and amounts ── */
    const method = (payment_method as string) || 'toman'
    const resolvedCurrency = (currency as string) || 'toman'

    let amountToman = Number(amount_toman) || 0
    let amountGold = Number(amount_gold) || 0

    /* Support `amount` field with `currency` for convenience */
    if (!amountToman && !amountGold && Number(amount) > 0) {
      if (resolvedCurrency === 'gold') {
        amountGold = Number(amount)
      } else {
        amountToman = Number(amount)
      }
    }

    /* ── Validate amounts based on payment method ── */
    if (method === 'toman') {
      if (!amountToman || amountToman < MIN_AMOUNT_TOMAN) {
        return NextResponse.json(
          {
            success: false,
            message: `مبلغ باید حداقل ${MIN_AMOUNT_TOMAN.toLocaleString('fa-IR')} واحد طلایی باشد`,
            error_code: -3,
          },
          { status: 400 }
        )
      }
      if (amountToman > MAX_AMOUNT_TOMAN) {
        return NextResponse.json(
          {
            success: false,
            message: `حداکثر مبلغ تراکنش ${MAX_AMOUNT_TOMAN.toLocaleString('fa-IR')} واحد طلایی است`,
            error_code: -4,
          },
          { status: 400 }
        )
      }
    }

    if (method === 'gold') {
      if (!amountGold || amountGold < MIN_AMOUNT_GOLD) {
        return NextResponse.json(
          {
            success: false,
            message: `مقدار طلا باید حداقل ${MIN_AMOUNT_GOLD} گرم باشد`,
            error_code: -3,
          },
          { status: 400 }
        )
      }
    }

    if (method === 'mixed') {
      if (!amountToman || amountToman < MIN_AMOUNT_TOMAN) {
        return NextResponse.json(
          {
            success: false,
            message: 'بخش واحد طلاییی پرداخت ترکیبی باید حداقل ۱,۰۰۰ واحد طلایی باشد',
            error_code: -3,
          },
          { status: 400 }
        )
      }
      if (!amountGold || amountGold < MIN_AMOUNT_GOLD) {
        return NextResponse.json(
          {
            success: false,
            message: 'بخش طلایی پرداخت ترکیبی باید حداقل ۰.۰۰۱ گرم باشد',
            error_code: -3,
          },
          { status: 400 }
        )
      }
    }

    /* ── Validate callback URL if provided ── */
    if (callback_url && typeof callback_url === 'string') {
      try {
        new URL(callback_url)
      } catch {
        return NextResponse.json(
          {
            success: false,
            message: 'آدرس بازگشت (callback_url) نامعتبر است',
            error_code: -5,
          },
          { status: 400 }
        )
      }
    }

    /* ── Risk scoring ── */
    const { score: riskScore, flags: riskFlags } = await calculateRiskScore(
      merchant.id,
      amountToman
    )

    /* ── Generate unique authority token ── */
    const authority = crypto.randomBytes(16).toString('hex')

    /* Ensure uniqueness (collision safety) */
    const existingAuth = await db.gatewayPayment.findUnique({
      where: { authority },
    })
    if (existingAuth) {
      // Extremely unlikely, but handle it
      return NextResponse.json(
        {
          success: false,
          message: 'خطای داخلی. لطفاً دوباره تلاش کنید',
          error_code: -98,
        },
        { status: 500 }
      )
    }

    /* ── Calculate merchant fee ── */
    const feeToman =
      method === 'toman' || method === 'mixed'
        ? Math.min(
            Math.max(amountToman * merchant.feeRate, merchant.minFee),
            merchant.maxFee
          )
        : 0

    const feeGold =
      method === 'gold' || method === 'mixed'
        ? amountGold * merchant.feeRate
        : 0

    /* ── Get gold price if payment involves gold ── */
    let goldPriceAtPay: number | undefined
    if (method === 'gold' || method === 'mixed') {
      const goldPrice = await db.goldPrice.findFirst({
        orderBy: { createdAt: 'desc' },
      })
      goldPriceAtPay = goldPrice?.buyPrice
    }

    /* ── Calculate expiry ── */
    const expiresAt = new Date(Date.now() + PAYMENT_EXPIRY_SECONDS * 1000)

    /* ── Create GatewayPayment record ── */
    const payment = await db.gatewayPayment.create({
      data: {
        authority,
        merchantId: merchant.id,
        amountToman,
        amountGold,
        goldGrams: amountGold,
        feeToman,
        feeGold,
        paymentMethod: method,
        status: 'pending',
        description: (description as string) || null,
        callbackUrl: (callback_url as string) || null,
        customerName: (customer_name as string) || null,
        customerPhone: (customer_phone as string) || null,
        customerEmail: (customer_email as string) || null,
        goldPriceAtPay: goldPriceAtPay || null,
        metadata: JSON.stringify(metadata || {}),
        expiresAt,
      },
    })

    /* ── Log risk event if score is elevated ── */
    if (riskScore >= 20) {
      await db.riskEvent.create({
        data: {
          paymentId: payment.id,
          merchantId: merchant.id,
          eventType: 'payment_request_risk',
          riskScore,
          details: JSON.stringify({
            flags: riskFlags,
            amountToman,
            amountGold,
            paymentMethod: method,
          }),
          isResolved: false,
        },
      })
    }

    /* ── Fire webhook if configured (payment.created event) ── */
    if (merchant.webhookUrl) {
      fireWebhook(merchant, payment, 'payment.created').catch((err) => {
        console.error('[Payment Request] Webhook fire error:', err)
      })
    }

    /* ── Return success response ── */
    return NextResponse.json({
      success: true,
      message: 'درگاه پرداخت با موفقیت ایجاد شد',
      data: {
        authority: payment.authority,
        payment_url: `/checkout/${payment.authority}`,
        amount_toman: payment.amountToman,
        amount_gold: payment.amountGold,
        gold_grams: payment.goldGrams,
        fee_toman: payment.feeToman,
        fee_gold: payment.feeGold,
        net_toman: payment.amountToman - payment.feeToman,
        net_gold: payment.goldGrams - payment.feeGold,
        payment_method: payment.paymentMethod,
        gold_price_at_pay: payment.goldPriceAtPay,
        expires_at: payment.expiresAt,
        expires_in: PAYMENT_EXPIRY_SECONDS,
        risk_score: riskScore >= 20 ? riskScore : undefined,
        risk_flags: riskFlags.length > 0 ? riskFlags : undefined,
      },
    })
  } catch (error) {
    console.error('[Payment Request] Error:', error)
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

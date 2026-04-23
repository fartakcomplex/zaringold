import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/v1/payment/details?authority=xxx
 * Fetch payment details by authority token
 * Returns: merchant info, amount, description, status, gold price, expiry
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authority = searchParams.get('authority')

    /* ── Validate authority param ── */
    if (!authority || typeof authority !== 'string' || authority.length < 4) {
      return NextResponse.json(
        {
          success: false,
          message: 'شناسه تراکنش (authority) الزامی است و باید حداقل ۴ کاراکتر باشد',
          error_code: -1,
        },
        { status: 400 }
      )
    }

    /* ── Fetch payment with merchant and latest gold price ── */
    const payment = await db.gatewayPayment.findUnique({
      where: { authority },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            website: true,
            brandingColor: true,
            isVerified: true,
          },
        },
        refunds: {
          select: {
            id: true,
            amountToman: true,
            amountGold: true,
            status: true,
            createdAt: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: 'تراکنش با این شناسه یافت نشد',
          error_code: -2,
        },
        { status: 404 }
      )
    }

    /* ── Fetch latest gold price ── */
    let goldPrice: { buy: number; sell: number; market: number } | null = null
    if (payment.paymentMethod === 'gold' || payment.paymentMethod === 'mixed') {
      const latestGold = await db.goldPrice.findFirst({
        orderBy: { createdAt: 'desc' },
      })
      if (latestGold) {
        goldPrice = {
          buy: latestGold.buyPrice,
          sell: latestGold.sellPrice,
          market: latestGold.marketPrice,
        }
      }
    }

    /* ── Calculate time remaining until expiry ── */
    const now = new Date()
    const expiresAt = new Date(payment.expiresAt)
    const isExpired = now > expiresAt
    const remainingMs = Math.max(0, expiresAt.getTime() - now.getTime())
    const remainingSeconds = Math.ceil(remainingMs / 1000)

    /* ── Determine human-readable status in Persian ── */
    const statusMap: Record<string, string> = {
      pending: 'در انتظار پرداخت',
      paid: 'پرداخت شده',
      failed: 'ناموفق',
      expired: 'منقضی شده',
      refunded: 'استرداد شده',
      settled: 'تسویه شده',
    }

    /* ── Calculate total refunded amounts ── */
    const totalRefundedToman = payment.refunds.reduce(
      (sum, r) => (r.status === 'completed' ? sum + r.amountToman : sum),
      0
    )
    const totalRefundedGold = payment.refunds.reduce(
      (sum, r) => (r.status === 'completed' ? sum + r.amountGold : sum),
      0
    )

    /* ── Parse metadata safely ── */
    let parsedMetadata: Record<string, unknown> = {}
    try {
      parsedMetadata = JSON.parse(payment.metadata)
    } catch {
      parsedMetadata = {}
    }

    /* ── Auto-expire if past expiry and still pending ── */
    if (isExpired && payment.status === 'pending') {
      await db.gatewayPayment.update({
        where: { authority },
        data: { status: 'expired' },
      })
      payment.status = 'expired'
    }

    /* ── Build response ── */
    return NextResponse.json({
      success: true,
      message: 'جزئیات تراکنش دریافت شد',
      data: {
        authority: payment.authority,
        status: payment.status,
        status_label: statusMap[payment.status] || payment.status,
        amount: {
          toman: payment.amountToman,
          gold: payment.amountGold,
          gold_grams: payment.goldGrams,
          fee_toman: payment.feeToman,
          fee_gold: payment.feeGold,
          net_toman: payment.amountToman - payment.feeToman,
          net_gold: payment.goldGrams - payment.feeGold,
        },
        payment_method: payment.paymentMethod,
        description: payment.description,
        gold_price_at_pay: payment.goldPriceAtPay,
        current_gold_price: goldPrice,
        ref_id: payment.refId,
        card_pan: payment.cardPan,
        customer: {
          phone: payment.customerPhone,
          email: payment.customerEmail,
          name: payment.customerName,
        },
        merchant: {
          id: payment.merchant.id,
          business_name: payment.merchant.businessName,
          logo: payment.merchant.logo,
          website: payment.merchant.website,
          branding_color: payment.merchant.brandingColor,
          is_verified: payment.merchant.isVerified,
        },
        refund: {
          total_refunded_toman: totalRefundedToman,
          total_refunded_gold: totalRefundedGold,
          total_refunds: payment.refunds.length,
          history: payment.refunds,
        },
        metadata: parsedMetadata,
        expiry: {
          is_expired: isExpired,
          expires_at: payment.expiresAt,
          remaining_seconds: remainingSeconds,
          formatted_time: formatRemainingTime(remainingSeconds),
        },
        timestamps: {
          created_at: payment.createdAt,
          paid_at: payment.paidAt,
          verified_at: payment.verifiedAt,
          settled_at: payment.settledAt,
        },
      },
    })
  } catch (error) {
    console.error('[Payment Details] Error:', error)
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

/**
 * Format remaining seconds into human-readable Persian string
 */
function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return 'منقضی شده'

  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60

  if (minutes >= 1) {
    return `${minutes} دقیقه و ${secs} ثانیه`
  }
  return `${secs} ثانیه`
}

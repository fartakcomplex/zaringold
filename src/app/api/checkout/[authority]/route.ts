import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ═══════════════════════════════════════════════════════════════════════ */
/*  GET /api/checkout/[authority] — Fetch payment checkout details       */
/* ═══════════════════════════════════════════════════════════════════════ */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ authority: string }> }
) {
  try {
    const { authority } = await params

    if (!authority) {
      return NextResponse.json(
        { success: false, message: 'شناسه پرداخت الزامی است' },
        { status: 400 }
      )
    }

    /* ── Find gateway payment by authority ── */
    const payment = await db.gatewayPayment.findUnique({
      where: { authority },
      include: {
        merchant: {
          select: {
            businessName: true,
            logo: true,
            brandingColor: true,
            website: true,
            isVerified: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'تراکنش یافت نشد' },
        { status: 404 }
      )
    }

    /* ── Check if payment is already paid/expired ── */
    if (payment.status === 'paid') {
      return NextResponse.json({
        success: true,
        data: {
          ...buildResponse(payment),
          isPaid: true,
        },
      })
    }

    if (payment.status === 'expired') {
      return NextResponse.json({
        success: true,
        data: {
          ...buildResponse(payment),
          isExpired: true,
        },
      })
    }

    /* ── Check expiry ── */
    const now = new Date()
    const isExpired = payment.expiresAt && now > new Date(payment.expiresAt)

    if (isExpired) {
      await db.gatewayPayment.update({
        where: { authority },
        data: { status: 'expired' },
      })

      return NextResponse.json({
        success: true,
        data: {
          ...buildResponse(payment),
          isExpired: true,
        },
      })
    }

    /* ── Fetch latest gold price for gold equivalent ── */
    const latestGoldPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    const goldPrice = latestGoldPrice?.buyPrice || 8_900_000
    const goldGrams = goldPrice > 0 ? payment.amountToman / goldPrice : 0

    /* ── Calculate remaining time in seconds ── */
    const remainingSeconds = payment.expiresAt
      ? Math.max(0, Math.floor((new Date(payment.expiresAt).getTime() - now.getTime()) / 1000))
      : 900 // default 15 min

    return NextResponse.json({
      success: true,
      data: {
        ...buildResponse(payment),
        goldEquivalent: {
          goldGrams: Math.round(goldGrams * 1000) / 1000,
          goldPrice,
          goldPriceGrams: Math.round(goldPrice / 1000), // price per gram for display
        },
        remainingSeconds,
        isExpired: false,
        isPaid: false,
      },
    })
  } catch (error) {
    console.error('Checkout details error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات پرداخت' },
      { status: 500 }
    )
  }
}

/* ── Helper: Build base response object ── */
function buildResponse(payment: any) {
  return {
    authority: payment.authority,
    amountToman: payment.amountToman,
    amountGold: payment.amountGold,
    goldGrams: payment.goldGrams,
    feeToman: payment.feeToman,
    feeGold: payment.feeGold,
    paymentMethod: payment.paymentMethod,
    status: payment.status,
    description: payment.description,
    customerName: payment.customerName,
    customerPhone: payment.customerPhone,
    customerEmail: payment.customerEmail,
    callbackUrl: payment.callbackUrl,
    goldPriceAtPay: payment.goldPriceAtPay,
    createdAt: payment.createdAt,
    expiresAt: payment.expiresAt,
    merchant: {
      businessName: payment.merchant?.businessName || 'فروشگاه',
      logo: payment.merchant?.logo,
      brandingColor: payment.merchant?.brandingColor || '#D4AF37',
      website: payment.merchant?.website,
      isVerified: payment.merchant?.isVerified || false,
    },
  }
}

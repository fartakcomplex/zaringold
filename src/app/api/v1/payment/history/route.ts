import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'

/**
 * Helper: Validate API key and return merchant
 */
async function validateApiKey(apiKey: string) {
  const hash = crypto.createHash('sha256').update(apiKey).digest('hex')
  const keyRecord = await db.apiKey.findUnique({
    where: { keyHash: hash, isActive: true },
    include: { merchant: true },
  })
  if (!keyRecord || !keyRecord.merchant.isActive) return null
  await db.apiKey.update({ where: { id: keyRecord.id }, data: { lastUsedAt: new Date() } })
  return keyRecord.merchant
}

/**
 * GET /api/v1/payment/history
 * Merchant payment history with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const api_key = searchParams.get('api_key')
    const status = searchParams.get('status')
    const payment_method = searchParams.get('payment_method')
    const from_date = searchParams.get('from_date')
    const to_date = searchParams.get('to_date')
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20

    /* ── Validate API key ── */
    if (!api_key) {
      return NextResponse.json(
        { success: false, message: 'کلید API الزامی است' },
        { status: 400 }
      )
    }

    const merchant = await validateApiKey(api_key)
    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'کلید API نامعتبر یا غیرفعال است' },
        { status: 401 }
      )
    }

    /* ── Build where clause ── */
    const where: Record<string, unknown> = { merchantId: merchant.id }

    if (status) where.status = status
    if (payment_method) where.paymentMethod = payment_method

    if (from_date || to_date) {
      const createdAt: Record<string, Date> = {}
      if (from_date) createdAt.gte = new Date(from_date)
      if (to_date) createdAt.lte = new Date(to_date)
      where.createdAt = createdAt
    }

    /* ── Pagination ── */
    const skip = (page - 1) * limit

    const [payments, total] = await Promise.all([
      db.gatewayPayment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.gatewayPayment.count({ where }),
    ])

    /* ── Summary stats ── */
    const summary = await db.gatewayPayment.aggregate({
      where: { merchantId: merchant.id, status: 'paid' },
      _sum: { amountToman: true, goldGrams: true, feeToman: true, feeGold: true },
      _count: true,
    })

    return NextResponse.json({
      success: true,
      data: {
        payments: payments.map((p) => ({
          id: p.id,
          authority: p.authority,
          amount_toman: p.amountToman,
          amount_gold: p.amountGold,
          gold_grams: p.goldGrams,
          fee_toman: p.feeToman,
          fee_gold: p.feeGold,
          payment_method: p.paymentMethod,
          status: p.status,
          ref_id: p.refId,
          customer_name: p.customerName,
          customer_phone: p.customerPhone,
          card_pan: p.cardPan,
          description: p.description,
          paid_at: p.paidAt,
          created_at: p.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        summary: {
          totalPaid: summary._sum.amountToman || 0,
          totalGold: summary._sum.goldGrams || 0,
          totalFees: summary._sum.feeToman || 0,
          totalFeesGold: summary._sum.feeGold || 0,
          paidCount: summary._count,
        },
      },
    })
  } catch (error) {
    console.error('Payment history error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تاریخچه پرداخت‌ها' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/gateway/payments
 * List user's gateway payments (authenticated)
 * Return paginated list of payments
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || undefined
    const merchantId = searchParams.get('merchantId') || undefined

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = { userId }
    if (status) {
      where.status = status
    }
    if (merchantId) {
      where.merchantId = merchantId
    }

    const [payments, total] = await Promise.all([
      db.externalPayment.findMany({
        where,
        include: {
          merchant: {
            select: {
              id: true,
              businessName: true,
              website: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.externalPayment.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    const paymentList = payments.map((p) => ({
      id: p.id,
      merchantId: p.merchantId,
      merchant: p.merchant,
      amountGrams: p.amountGrams,
      amountFiat: p.amountFiat,
      feeGrams: p.feeGrams,
      goldPrice: p.goldPrice,
      description: p.description,
      merchantOrderId: p.merchantOrderId,
      status: p.status,
      expiresAt: p.expiresAt,
      paidAt: p.paidAt,
      cancelledAt: p.cancelledAt,
      createdAt: p.createdAt,
    }))

    return NextResponse.json({
      success: true,
      payments: paymentList,
      total,
      page,
      totalPages,
    })
  } catch (error) {
    console.error('Gateway payments list error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست پرداخت‌ها' },
      { status: 500 }
    )
  }
}

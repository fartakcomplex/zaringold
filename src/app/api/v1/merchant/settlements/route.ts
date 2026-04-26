import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/v1/merchant/settlements
 * List settlements for a merchant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const merchant = await db.merchant.findUnique({ where: { userId } })
    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'پذیرنده یافت نشد' },
        { status: 404 }
      )
    }

    /* ── Build where clause ── */
    const where: Record<string, unknown> = { merchantId: merchant.id }
    if (status) where.status = status
    if (type) where.type = type

    const skip = (page - 1) * limit

    const [settlements, total] = await Promise.all([
      db.settlement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.settlement.count({ where }),
    ])

    /* ── Summary ── */
    const summary = await db.settlement.aggregate({
      where: { merchantId: merchant.id, status: 'completed' },
      _sum: { amountToman: true, amountGold: true, feeToman: true },
      _count: true,
    })

    const pendingSummary = await db.settlement.aggregate({
      where: { merchantId: merchant.id, status: 'pending' },
      _sum: { amountToman: true, amountGold: true },
      _count: true,
    })

    return NextResponse.json({
      success: true,
      data: {
        settlements: settlements.map((s) => ({
          id: s.id,
          amount_toman: s.amountToman,
          amount_gold: s.amountGold,
          fee_toman: s.feeToman,
          type: s.type,
          period_start: s.periodStart,
          period_end: s.periodEnd,
          status: s.status,
          iban: s.iban,
          transaction_ref: s.transactionRef,
          processed_at: s.processedAt,
          created_at: s.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        summary: {
          totalSettled: summary._sum.amountToman || 0,
          totalSettledGold: summary._sum.amountGold || 0,
          totalFees: summary._sum.feeToman || 0,
          settledCount: summary._count,
          pendingAmount: pendingSummary._sum.amountToman || 0,
          pendingGold: pendingSummary._sum.amountGold || 0,
          pendingCount: pendingSummary._count,
        },
      },
    })
  } catch (error) {
    console.error('Settlements list error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست تسویه‌حساب‌ها' },
      { status: 500 }
    )
  }
}

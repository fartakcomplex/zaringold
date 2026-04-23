import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/v1/merchant/dashboard
 * Dashboard stats: today sales, monthly, success rate, etc.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

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

    /* ── Date ranges ── */
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    /* ── Parallel queries ── */
    const [
      todayPayments,
      monthPayments,
      lastMonthPayments,
      recentPayments,
      recentRefunds,
      recentSettlements,
      totalRefundsCount,
      activeQrCodes,
    ] = await Promise.all([
      // Today payments
      db.gatewayPayment.findMany({
        where: { merchantId: merchant.id, createdAt: { gte: todayStart } },
      }),
      // This month payments
      db.gatewayPayment.findMany({
        where: { merchantId: merchant.id, createdAt: { gte: monthStart } },
      }),
      // Last month payments
      db.gatewayPayment.findMany({
        where: { merchantId: merchant.id, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
      // Recent 10 payments
      db.gatewayPayment.findMany({
        where: { merchantId: merchant.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Recent refunds
      db.gatewayRefund.findMany({
        where: { merchantId: merchant.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Recent settlements
      db.settlement.findMany({
        where: { merchantId: merchant.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Total refunds count
      db.gatewayRefund.count({
        where: { merchantId: merchant.id },
      }),
      // Active QR codes
      db.qrCode.count({
        where: { merchantId: merchant.id, isActive: true },
      }),
    ])

    /* ── Today stats ── */
    const todayPaid = todayPayments.filter((p) => p.status === 'paid')
    const todaySalesToman = todayPaid.reduce((s, p) => s + p.amountToman, 0)
    const todaySalesGold = todayPaid.reduce((s, p) => s + p.goldGrams, 0)
    const todayCount = todayPaid.length

    /* ── Month stats ── */
    const monthPaid = monthPayments.filter((p) => p.status === 'paid')
    const monthSalesToman = monthPaid.reduce((s, p) => s + p.amountToman, 0)
    const monthSalesGold = monthPaid.reduce((s, p) => s + p.goldGrams, 0)
    const monthCount = monthPaid.length

    /* ── Last month stats ── */
    const lastMonthPaid = lastMonthPayments.filter((p) => p.status === 'paid')
    const lastMonthSalesToman = lastMonthPaid.reduce((s, p) => s + p.amountToman, 0)

    /* ── Growth rate ── */
    const growthRate = lastMonthSalesToman > 0
      ? ((monthSalesToman - lastMonthSalesToman) / lastMonthSalesToman) * 100
      : monthSalesToman > 0 ? 100 : 0

    /* ── All-time stats ── */
    const totalPayments = todayPayments.length + monthPayments.length + lastMonthPayments.length
    const successRate = totalPayments > 0
      ? (monthPaid.length / monthPayments.length) * 100
      : 0

    /* ── Average order value ── */
    const avgOrder = monthPaid.length > 0 ? monthSalesToman / monthPaid.length : 0

    return NextResponse.json({
      success: true,
      data: {
        today: {
          salesToman: todaySalesToman,
          salesGold: todaySalesGold,
          count: todayCount,
        },
        monthly: {
          salesToman: monthSalesToman,
          salesGold: monthSalesGold,
          count: monthCount,
          lastMonthSalesToman: lastMonthSalesToman,
          growthRate: Math.round(growthRate * 100) / 100,
        },
        allTime: {
          totalSales: merchant.totalSales,
          totalSalesGold: merchant.totalSalesGold,
          totalSettled: merchant.totalSettled,
          totalSettledGold: merchant.totalSettledGold,
          pendingSettle: merchant.pendingSettle,
          pendingSettleGold: merchant.pendingSettleGold,
        },
        stats: {
          successRate: Math.round(successRate * 100) / 100,
          avgOrder: Math.round(avgOrder),
          refundCount: totalRefundsCount,
          activeQrCodes,
        },
        recentPayments: recentPayments.map((p) => ({
          id: p.id,
          authority: p.authority,
          amountToman: p.amountToman,
          goldGrams: p.goldGrams,
          status: p.status,
          paymentMethod: p.paymentMethod,
          customerName: p.customerName,
          createdAt: p.createdAt,
        })),
        recentRefunds: recentRefunds.map((r) => ({
          id: r.id,
          amountToman: r.amountToman,
          reason: r.reason,
          status: r.status,
          createdAt: r.createdAt,
        })),
        recentSettlements: recentSettlements.map((s) => ({
          id: s.id,
          amountToman: s.amountToman,
          amountGold: s.amountGold,
          status: s.status,
          type: s.type,
          createdAt: s.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('Merchant dashboard error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت آمار داشبورد' },
      { status: 500 }
    )
  }
}

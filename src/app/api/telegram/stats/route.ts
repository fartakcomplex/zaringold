import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: Dashboard stats for admin ──
export async function GET() {
  try {
    const [
      totalLinkedUsers,
      totalAlerts,
      activeAlerts,
      totalInvoices,
      totalInvoicesAmount,
      paidInvoices,
      totalB2BCustomers,
      activeSubscriptions,
    ] = await Promise.all([
      db.telegramUser.count(),
      db.telegramAlert.count(),
      db.telegramAlert.count({ where: { isActive: true } }),
      db.telegramInvoice.count(),
      db.telegramInvoice.aggregate({ _sum: { finalPrice: true } }),
      db.telegramInvoice.count({ where: { status: 'paid' } }),
      db.telegramB2BCustomer.count(),
      db.telegramSubscription.count({ where: { isActive: true } }),
    ])

    // Recent linked users (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentLinkedUsers = await db.telegramUser.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
    })

    // B2B users count
    const b2bUsers = await db.telegramUser.count({
      where: { isB2B: true },
    })

    // Total support messages
    const totalSupportMessages = await db.telegramSupportMessage.count()

    // Alerts by type breakdown
    const alertsByType = await db.telegramAlert.groupBy({
      by: ['alertType'],
      _count: true,
    })

    // Invoices by status breakdown
    const invoicesByStatus = await db.telegramInvoice.groupBy({
      by: ['status'],
      _count: true,
    })

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalLinkedUsers,
          recentLinkedUsers,
          b2bUsers,
          totalAlerts,
          activeAlerts,
          totalInvoices,
          paidInvoices,
          totalB2BCustomers,
          activeSubscriptions,
          totalSupportMessages,
        },
        financials: {
          totalInvoicesAmount: totalInvoicesAmount._sum.finalPrice || 0,
        },
        alertsBreakdown: alertsByType.map((a) => ({
          type: a.alertType,
          count: a._count,
        })),
        invoicesBreakdown: invoicesByStatus.map((i) => ({
          status: i.status,
          count: i._count,
        })),
      },
    })
  } catch (error) {
    console.error('Telegram stats GET error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت آمار داشبورد' },
      { status: 500 }
    )
  }
}

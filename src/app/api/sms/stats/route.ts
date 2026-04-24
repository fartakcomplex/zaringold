import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalSent, totalDelivered, totalFailed, todayLogs, blacklistCount, activeCampaigns] =
      await Promise.all([
        db.smsLog.count(),
        db.smsLog.count({ where: { status: 'delivered' } }),
        db.smsLog.count({ where: { status: 'failed' } }),
        db.smsLog.findMany({ where: { createdAt: { gte: today } }, select: { cost: true } }),
        db.smsBlacklist.count(),
        db.smsCampaign.count({ where: { status: { in: ['draft', 'scheduled', 'sending'] } } }),
      ])

    const todaySent = todayLogs.length
    const todayCost = todayLogs.reduce((sum, l) => sum + l.cost, 0)
    const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0'

    // Last 7 days daily counts
    const recentActivity: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const d2 = new Date(d)
      d2.setDate(d2.getDate() + 1)
      const count = await db.smsLog.count({ where: { createdAt: { gte: d, lt: d2 } } })
      recentActivity.push({ date: d.toISOString().split('T')[0], count })
    }

    return NextResponse.json({
      success: true,
      data: {
        totalSent,
        totalDelivered,
        totalFailed,
        deliveryRate: Number(deliveryRate),
        todaySent,
        todayCost,
        activeCampaigns,
        blacklistCount,
        recentActivity,
        topRecipients: [],
      },
    })
  } catch (error) {
    console.error('[SMS Stats GET]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت آمار پیامکی' },
      { status: 500 }
    )
  }
}

import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET: Dashboard stats
export async function GET() {
  try {
    const now = new Date()
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    )
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Total counts
    const totalSent = await db.emailLog.count({
      where: {
        status: { in: ['delivered', 'opened', 'clicked'] },
      },
    })

    const totalOpened = await db.emailLog.count({
      where: { status: { in: ['opened', 'clicked'] } },
    })

    const totalClicked = await db.emailLog.count({
      where: { status: 'clicked' },
    })

    const totalBounced = await db.emailLog.count({
      where: { status: 'bounced' },
    })

    const totalFailed = await db.emailLog.count({
      where: { status: 'failed' },
    })

    // Today counts
    const todaySent = await db.emailLog.count({
      where: {
        createdAt: { gte: todayStart },
        status: { in: ['delivered', 'opened', 'clicked'] },
      },
    })

    const todayOpened = await db.emailLog.count({
      where: {
        createdAt: { gte: todayStart },
        status: { in: ['opened', 'clicked'] },
      },
    })

    // Open and click rates
    const openRate =
      totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0
    const clickRate =
      totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0

    // Campaigns by type
    const campaignsByType = await db.emailCampaign.groupBy({
      by: ['type'],
      _count: { id: true },
    })

    const typeBreakdown: Record<string, number> = {}
    for (const item of campaignsByType) {
      typeBreakdown[item.type] = item._count.id
    }

    // Active campaigns (scheduled/sending)
    const activeCampaigns = await db.emailCampaign.count({
      where: { status: { in: ['scheduled', 'sending'] } },
    })

    // Blacklist count
    const blacklistCount = await db.emailBlacklist.count()

    // Recent activity (last 7 days) - daily breakdown
    const recentLogs = await db.emailLog.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        createdAt: true,
        status: true,
      },
    })

    const dailyActivity: Record<
      string,
      { sent: number; opened: number; clicked: number; bounced: number }
    > = {}

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().split('T')[0]
      dailyActivity[key] = { sent: 0, opened: 0, clicked: 0, bounced: 0 }
    }

    for (const log of recentLogs) {
      const key = log.createdAt.toISOString().split('T')[0]
      if (dailyActivity[key]) {
        if (log.status === 'delivered') dailyActivity[key].sent++
        if (log.status === 'opened') {
          dailyActivity[key].sent++
          dailyActivity[key].opened++
        }
        if (log.status === 'clicked') {
          dailyActivity[key].sent++
          dailyActivity[key].opened++
          dailyActivity[key].clicked++
        }
        if (log.status === 'bounced') dailyActivity[key].bounced++
      }
    }

    // Total campaigns count
    const totalCampaigns = await db.emailCampaign.count()

    // Total logs
    const totalLogs = await db.emailLog.count()

    return NextResponse.json({
      success: true,
      data: {
        totalSent,
        totalOpened,
        totalClicked,
        totalBounced,
        totalFailed,
        openRate,
        clickRate,
        todaySent,
        todayOpened,
        campaignsByType: typeBreakdown,
        recentActivity: dailyActivity,
        activeCampaigns,
        blacklistCount,
        totalCampaigns,
        totalLogs,
      },
    })
  } catch (error) {
    console.error('Error fetching email stats:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت آمار ایمیل' },
      { status: 500 }
    )
  }
}

import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const DEMO_USER_ID = '1'

// ─── GET: Creator statistics ───
export async function GET() {
  try {
    // Get creator profile
    let profile = await db.creatorProfile.findUnique({
      where: { userId: DEMO_USER_ID },
    })

    if (!profile) {
      profile = await db.creatorProfile.create({
        data: { userId: DEMO_USER_ID },
      })
    }

    // Get total gold earned
    const goldAgg = await db.creatorReward.aggregate({
      where: { userId: DEMO_USER_ID, isActive: true },
      _sum: { goldMg: true },
      _count: { id: true },
    })
    const totalGoldEarned = goldAgg._sum.goldMg || 0
    const totalRewards = goldAgg._count.id

    // Get breakdown by tier
    const tierBreakdown = await db.creatorReward.groupBy({
      by: ['tier'],
      where: { userId: DEMO_USER_ID, isActive: true },
      _sum: { goldMg: true },
      _count: { id: true },
    })

    const tierStats: Record<string, { goldMg: number; count: number }> = {}
    for (const tb of tierBreakdown) {
      tierStats[tb.tier] = {
        goldMg: tb._sum.goldMg || 0,
        count: tb._count.id,
      }
    }

    // Get breakdown by platform
    const platformBreakdown = await db.creatorSubmission.groupBy({
      by: ['platform'],
      where: { userId: DEMO_USER_ID },
      _count: { id: true },
      _avg: { aiScore: true },
      _sum: { rewardMg: true, estimatedViews: true },
    })

    const platformStats = platformBreakdown.map((pb) => ({
      platform: pb.platform,
      totalPosts: pb._count.id,
      averageScore: pb._avg.aiScore ? parseFloat(pb._avg.aiScore.toFixed(1)) : 0,
      totalRewardMg: pb._sum.rewardMg || 0,
      totalEstimatedViews: pb._sum.estimatedViews || 0,
    }))

    // Get submission status breakdown
    const statusBreakdown = await db.creatorSubmission.groupBy({
      by: ['status'],
      where: { userId: DEMO_USER_ID },
      _count: { id: true },
    })

    const statusStats = statusBreakdown.map((sb) => ({
      status: sb.status,
      count: sb._count.id,
    }))

    // Get monthly chart data (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlySubmissions = await db.creatorSubmission.findMany({
      where: {
        userId: DEMO_USER_ID,
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        createdAt: true,
        aiScore: true,
        rewardMg: true,
        status: true,
      },
    })

    // Group by month
    const monthlyData: Record<string, { submissions: number; goldEarned: number; avgScore: number; approved: number }> = {}
    for (const sub of monthlySubmissions) {
      const monthKey = sub.createdAt.toISOString().substring(0, 7) // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { submissions: 0, goldEarned: 0, avgScore: 0, approved: 0 }
      }
      monthlyData[monthKey].submissions += 1
      monthlyData[monthKey].goldEarned += sub.rewardMg
      monthlyData[monthKey].avgScore += sub.aiScore
      if (sub.status === 'approved') monthlyData[monthKey].approved += 1
    }

    const chartData = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        submissions: data.submissions,
        goldEarned: parseFloat(data.goldEarned.toFixed(2)),
        averageScore: data.submissions > 0 ? parseFloat((data.avgScore / data.submissions).toFixed(1)) : 0,
        approved: data.approved,
      }))

    // Get score trend (last 10 submissions)
    const scoreTrend = await db.creatorSubmission.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { createdAt: 'asc' },
      take: 10,
      select: { createdAt: true, aiScore: true, platform: true },
    })

    // Calculate approval rate
    const totalSubmissions = await db.creatorSubmission.count({
      where: { userId: DEMO_USER_ID },
    })
    const approvedSubmissions = await db.creatorSubmission.count({
      where: { userId: DEMO_USER_ID, status: 'approved' },
    })
    const approvalRate = totalSubmissions > 0 ? ((approvedSubmissions / totalSubmissions) * 100).toFixed(1) : '0'

    // Estimated fiat value (using approximate gold price in IRR per mg)
    const approximateGoldPricePerMgIRR = 3500000 // ~3.5M IRR per mg
    const estimatedFiatValue = totalGoldEarned * approximateGoldPricePerMgIRR

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalGoldEarned,
          totalRewards,
          totalPosts: profile.totalPosts,
          approvedPosts: profile.approvedPosts,
          totalViews: profile.totalViews,
          totalEstimatedFiatIRR: estimatedFiatValue,
          approvalRate: parseFloat(approvalRate),
          currentLevel: profile.level,
          currentScore: profile.score,
          rank: profile.rank,
        },
        tierBreakdown: tierStats,
        platformBreakdown: platformStats,
        statusBreakdown: statusStats,
        monthlyChartData: chartData,
        scoreTrend,
        referralStats: {
          clicks: profile.referralClicks,
          signups: profile.referralSignups,
          purchases: profile.referralPurchases,
        },
      },
    })
  } catch (error) {
    console.error('[Creator Stats GET]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch creator statistics' },
      { status: 500 }
    )
  }
}

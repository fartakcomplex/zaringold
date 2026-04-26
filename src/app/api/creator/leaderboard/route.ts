import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// ─── GET: Creator leaderboard ───
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'weekly' // weekly, monthly, allTime
    const metric = searchParams.get('metric') || 'score' // score, goldEarned, views
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Calculate date threshold based on period
    const now = new Date()
    let dateFilter: Date | undefined

    if (period === 'weekly') {
      // Start of current week (Saturday in Iran, but we'll use Monday for simplicity)
      const dayOfWeek = now.getDay()
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday as start
      dateFilter = new Date(now)
      dateFilter.setDate(now.getDate() - diff)
      dateFilter.setHours(0, 0, 0, 0)
    } else if (period === 'monthly') {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), 1)
    }
    // allTime: no date filter

    // Get top creators from CreatorProfile
    // Note: In a real app, we'd use date-filtered submission data
    const profiles = await db.creatorProfile.findMany({
      where: {
        isBanned: false,
      },
      orderBy: {
        [metric === 'goldEarned' ? 'totalGoldEarned' : metric === 'views' ? 'totalViews' : 'score']: 'desc',
      },
      take: limit,
    })

    // If period is not allTime, also compute from submissions
    let leaderboardData

    if (dateFilter) {
      // Get period-specific submission data
      const periodSubmissions = await db.creatorSubmission.findMany({
        where: {
          createdAt: { gte: dateFilter },
          status: { in: ['approved', 'ai_review'] },
        },
        select: {
          userId: true,
          aiScore: true,
          rewardMg: true,
          estimatedViews: true,
          _count: { select: { id: true } },
        },
      })

      // Aggregate by user
      const userAgg: Record<string, { totalScore: number; totalGold: number; totalViews: number; totalPosts: number }> = {}
      for (const sub of periodSubmissions) {
        if (!userAgg[sub.userId]) {
          userAgg[sub.userId] = { totalScore: 0, totalGold: 0, totalViews: 0, totalPosts: 0 }
        }
        userAgg[sub.userId].totalScore += sub.aiScore
        userAgg[sub.userId].totalGold += sub.rewardMg
        userAgg[sub.userId].totalViews += sub.estimatedViews
        userAgg[sub.userId].totalPosts += 1
      }

      // Combine with profile data and rank
      leaderboardData = profiles
        .map((profile, index) => {
          const agg = userAgg[profile.userId] || { totalScore: 0, totalGold: 0, totalViews: 0, totalPosts: 0 }
          return {
            rank: index + 1,
            creatorId: profile.id,
            userId: profile.userId,
            level: profile.level,
            overallScore: profile.score,
            overallGoldEarned: profile.totalGoldEarned,
            overallViews: profile.totalViews,
            overallPosts: profile.totalPosts,
            periodScore: agg.totalScore,
            periodGoldEarned: parseFloat(agg.totalGold.toFixed(2)),
            periodViews: agg.totalViews,
            periodPosts: agg.totalPosts,
          }
        })
        .sort((a, b) => {
          if (metric === 'goldEarned') return b.periodGoldEarned - a.periodGoldEarned
          if (metric === 'views') return b.periodViews - a.periodViews
          return b.periodScore - a.periodScore
        })
        .map((item, index) => ({ ...item, rank: index + 1 }))
    } else {
      leaderboardData = profiles.map((profile, index) => ({
        rank: index + 1,
        creatorId: profile.id,
        userId: profile.userId,
        level: profile.level,
        overallScore: profile.score,
        overallGoldEarned: profile.totalGoldEarned,
        overallViews: profile.totalViews,
        overallPosts: profile.totalPosts,
        periodScore: profile.score,
        periodGoldEarned: profile.totalGoldEarned,
        periodViews: profile.totalViews,
        periodPosts: profile.totalPosts,
      }))
    }

    // Get current user's rank
    const currentUserProfile = await db.creatorProfile.findUnique({
      where: { userId: '1' },
    })

    let currentUserRank = null
    if (currentUserProfile) {
      const allProfiles = await db.creatorProfile.count({
        where: {
          isBanned: false,
          [metric === 'goldEarned' ? 'totalGoldEarned' : metric === 'views' ? 'totalViews' : 'score']: { gt: currentUserProfile[metric === 'goldEarned' ? 'totalGoldEarned' : metric === 'views' ? 'totalViews' : 'score'] },
        },
      })
      currentUserRank = allProfiles + 1
    }

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: leaderboardData,
        period,
        metric,
        currentUserRank,
        totalCreators: await db.creatorProfile.count({ where: { isBanned: false } }),
      },
    })
  } catch (error) {
    console.error('[Creator Leaderboard GET]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}

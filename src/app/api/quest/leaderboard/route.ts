import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: Quest Leaderboard ──
// Weekly/monthly top 20 by XP earned from quests. Sort by total quest XP.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'weekly' // weekly or monthly

    // Calculate date range
    const now = new Date()
    let startDate: Date

    if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else {
      // Weekly: start from beginning of this week (Saturday in Persian calendar = Friday in some calculations)
      // Using ISO week: Monday as start
      const dayOfWeek = now.getDay()
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      startDate = new Date(now)
      startDate.setDate(now.getDate() - daysToMonday)
      startDate.setHours(0, 0, 0, 0)
    }

    // Aggregate XP earned from quest reward transactions in the period
    const leaderboardData = await db.questRewardTransaction.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startDate },
      },
      _sum: {
        xpEarned: true,
        goldMg: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          xpEarned: 'desc',
        },
      },
      take: 20,
    })

    // Attach user info for each entry
    const leaderboard = await Promise.all(
      leaderboardData.map(async (entry, index) => {
        const user = await db.user.findUnique({
          where: { id: entry.userId },
          select: {
            id: true,
            fullName: true,
            avatar: true,
            gamification: {
              select: {
                level: true,
                currentStreak: true,
              },
            },
          },
        })

        return {
          rank: index + 1,
          userId: entry.userId,
          fullName: user?.fullName || 'کاربر ناشناس',
          avatar: user?.avatar || null,
          level: user?.gamification?.level || 1,
          streak: user?.gamification?.currentStreak || 0,
          totalXp: entry._sum.xpEarned || 0,
          totalGoldMg: Math.round((entry._sum.goldMg || 0) * 1000) / 1000,
          missionsCompleted: entry._count.id,
        }
      })
    )

    // Get current user's rank (including beyond top 20)
    const userId = '1'
    const allEntries = await db.questRewardTransaction.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startDate },
      },
      _sum: {
        xpEarned: true,
      },
      orderBy: {
        _sum: {
          xpEarned: 'desc',
        },
      },
    })

    const userRank = allEntries.findIndex((e) => e.userId === userId) + 1

    return NextResponse.json({
      success: true,
      data: {
        period,
        startDate: startDate.toISOString(),
        leaderboard,
        myRank: userRank > 0 ? userRank : null,
        myXp: allEntries.find((e) => e.userId === userId)?._sum.xpEarned || 0,
      },
    })
  } catch (error) {
    console.error('Quest leaderboard error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load leaderboard' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ------------------------------------------------------------------ */
/*  GET /api/admin/gamification — Gamification overview stats         */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    // Total users with gamification data
    const totalUsersWithGamification = await db.userGamification.count()

    // Total XP distributed
    const xpStats = await db.userGamification.aggregate({
      _sum: { xp: true },
      _avg: { xp: true, level: true },
      _max: { xp: true, level: true, currentStreak: true, longestStreak: true },
    })

    // Total achievements
    const totalAchievements = await db.achievement.count()
    const totalAchievementsEarned = await db.userAchievement.count()

    // Total check-ins
    const checkinStats = await db.checkIn.aggregate({
      _count: { id: true },
      _sum: { xpEarned: true, rewardValue: true },
    })

    // Prediction game stats
    const predictionStats = await db.pricePrediction.aggregate({
      _count: { id: true },
      _sum: { xpEarned: true },
    })

    const correctPredictions = await db.pricePrediction.count({ where: { isCorrect: true } })
    const totalPredictions = await db.pricePrediction.count()
    const predictionAccuracy = totalPredictions > 0
      ? Math.round((correctPredictions / totalPredictions) * 100)
      : 0

    // Leaderboard - top 10 by XP
    const leaderboard = await db.userGamification.findMany({
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            fullName: true,
            avatar: true,
          },
        },
      },
      orderBy: { xp: 'desc' },
    })

    // Prediction leaderboard - top 10 by score
    const predictionLeaderboard = await db.userGamification.findMany({
      where: { predictionScore: { gt: 0 } },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            fullName: true,
            avatar: true,
          },
        },
      },
      orderBy: { predictionScore: 'desc' },
    })

    // Streak leaderboard - top 10
    const streakLeaderboard = await db.userGamification.findMany({
      where: { currentStreak: { gt: 0 } },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            fullName: true,
            avatar: true,
          },
        },
      },
      orderBy: { currentStreak: 'desc' },
    })

    // Top achievements by number of earners
    const topAchievements = await db.achievement.findMany({
      take: 10,
      include: {
        _count: {
          select: { earnedBy: true },
        },
      },
      orderBy: {
        earnedBy: { _count: 'desc' },
      },
    })

    // Level distribution
    const allGamification = await db.userGamification.findMany({
      select: { level: true },
    })

    const levelDistribution: Record<number, number> = {}
    for (const g of allGamification) {
      levelDistribution[g.level] = (levelDistribution[g.level] || 0) + 1
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsersWithGamification,
          totalXPDistributed: xpStats._sum.xp || 0,
          averageXP: Math.round(xpStats._avg.xp || 0),
          averageLevel: Math.round((xpStats._avg.level || 0) * 10) / 10,
          maxLevel: xpStats._max.level || 0,
          maxXP: xpStats._max.xp || 0,
          maxCurrentStreak: xpStats._max.currentStreak || 0,
          maxLongestStreak: xpStats._max.longestStreak || 0,
        },
        achievements: {
          totalAvailable: totalAchievements,
          totalEarned: totalAchievementsEarned,
          topAchievements,
        },
        checkIns: {
          totalCheckIns: checkinStats._count.id,
          totalXPEarned: checkinStats._sum.xpEarned || 0,
          totalRewardsFiat: checkinStats._sum.rewardValue || 0,
        },
        predictionGame: {
          totalPredictions,
          correctPredictions,
          accuracy: predictionAccuracy,
          totalXPEarned: predictionStats._sum.xpEarned || 0,
        },
        leaderboards: {
          xp: leaderboard,
          prediction: predictionLeaderboard,
          streak: streakLeaderboard,
        },
        levelDistribution,
      },
      message: 'آمار گیمیفیکیشن دریافت شد',
    })
  } catch (error) {
    console.error('Admin get gamification error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت آمار گیمیفیکیشن' },
      { status: 500 }
    )
  }
}

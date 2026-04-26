import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Level calculation: level = floor(sqrt(xp/100)) + 1
function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

// Streak multiplier based on consecutive days
function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 5.0
  if (streak >= 14) return 3.0
  if (streak >= 7) return 2.0
  if (streak >= 3) return 1.5
  return 1.0
}

// ── GET: Quest Dashboard ──
// Returns user XP, level, total gold earned from quests, missions completed today/total,
// current streak, streak bonus multiplier, recent rewards, available missions count
export async function GET() {
  try {
    const userId = '1' // Demo user

    // Get or create gamification profile
    let gamification = await db.userGamification.findUnique({
      where: { userId },
    })

    if (!gamification) {
      gamification = await db.userGamification.create({
        data: { userId },
      })
    }

    const xp = gamification.xp
    const level = calculateLevel(xp)
    const streak = gamification.currentStreak
    const multiplier = getStreakMultiplier(streak)

    // Calculate level progress
    const currentLevelXp = (level - 1) * (level - 1) * 100
    const nextLevelXp = level * level * 100
    const progressXp = xp - currentLevelXp
    const totalXpNeeded = nextLevelXp - currentLevelXp
    const levelProgress = totalXpNeeded > 0 ? Math.min((progressXp / totalXpNeeded) * 100, 100) : 100

    // Total gold earned from quest reward transactions
    const goldAgg = await db.questRewardTransaction.aggregate({
      where: { userId },
      _sum: { goldMg: true },
    })
    const totalGoldEarned = goldAgg._sum.goldMg ?? 0

    // Total XP earned from quest reward transactions
    const xpAgg = await db.questRewardTransaction.aggregate({
      where: { userId },
      _sum: { xpEarned: true },
    })
    const totalQuestXp = xpAgg._sum.xpEarned ?? 0

    // Missions completed today (Tehran timezone)
    const now = new Date()
    const tehranOffset = 3.5 * 60 * 60000
    const tehranTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + tehranOffset)
    const todayStart = new Date(tehranTime.getFullYear(), tehranTime.getMonth(), tehranTime.getDate())

    const completedToday = await db.userMission.count({
      where: {
        userId,
        status: { in: ['completed', 'claimed'] },
        completedAt: { gte: todayStart },
      },
    })

    // Total missions completed (all-time)
    const totalCompleted = await db.userMission.count({
      where: {
        userId,
        status: { in: ['completed', 'claimed'] },
      },
    })

    // Available missions count (active missions not yet completed today)
    const activeMissions = await db.mission.count({
      where: { isActive: true },
    })

    const userCompletedToday = await db.userMission.findMany({
      where: {
        userId,
        status: { in: ['completed', 'claimed'] },
        completedAt: { gte: todayStart },
      },
      select: { missionId: true },
    })
    const completedMissionIds = new Set(userCompletedToday.map(m => m.missionId))

    // For daily missions, user can redo them each day; count only unique non-daily completed
    const dailyCompletedIds = new Set<string>()
    const nonDailyCompletedIds = new Set<string>()

    for (const um of userCompletedToday) {
      const mission = await db.mission.findUnique({
        where: { id: um.missionId },
        select: { category: true },
      })
      if (mission?.category === 'daily') {
        dailyCompletedIds.add(um.missionId)
      } else {
        nonDailyCompletedIds.add(um.missionId)
      }
    }

    const availableCount = activeMissions - nonDailyCompletedIds.size - dailyCompletedIds.size

    // Recent rewards (last 10)
    const recentRewards = await db.questRewardTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Missions in progress
    const inProgressCount = await db.userMission.count({
      where: {
        userId,
        status: 'in_progress',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        xp,
        level,
        levelProgress: Math.round(levelProgress * 100) / 100,
        totalGoldEarned: Math.round(totalGoldEarned * 1000) / 1000,
        totalQuestXp,
        completedToday,
        totalCompleted,
        currentStreak: streak,
        longestStreak: gamification.longestStreak,
        streakBonusMultiplier: multiplier,
        recentRewards,
        availableMissions: Math.max(availableCount, 0),
        inProgress: inProgressCount,
      },
    })
  } catch (error) {
    console.error('Quest dashboard error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load quest dashboard' },
      { status: 500 }
    )
  }
}

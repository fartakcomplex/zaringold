import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Streak multiplier: day1=1x, day3=1.5x, day7=2x, day14=3x, day30=5x
function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 5.0
  if (streak >= 14) return 3.0
  if (streak >= 7) return 2.0
  if (streak >= 3) return 1.5
  return 1.0
}

// Helper to get today's date string in Tehran timezone
function getTehranToday(): string {
  const now = new Date()
  const tehranOffset = 3.5 * 60 * 60000
  const tehranTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + tehranOffset)
  return tehranTime.toISOString().split('T')[0]
}

// ── GET: Current streak info ──
export async function GET() {
  try {
    const userId = '1' // Demo user

    let gamification = await db.userGamification.findUnique({
      where: { userId },
    })

    if (!gamification) {
      gamification = await db.userGamification.create({
        data: { userId },
      })
    }

    const streak = gamification.currentStreak
    const multiplier = getStreakMultiplier(streak)

    // Calculate next milestone
    const milestones = [
      { days: 3, multiplier: 1.5, label: '3-day streak (1.5x)' },
      { days: 7, multiplier: 2.0, label: '7-day streak (2x)' },
      { days: 14, multiplier: 3.0, label: '14-day streak (3x)' },
      { days: 30, multiplier: 5.0, label: '30-day streak (5x)' },
    ]

    const nextMilestone = milestones.find((m) => streak < m.days) || null
    const daysToNext = nextMilestone ? nextMilestone.days - streak : 0

    // Check if streak was incremented today
    const todayStr = getTehranToday()
    let streakDoneToday = false

    if (gamification.lastCheckInAt) {
      const tehranOffset = 3.5 * 60 * 60000
      const lastTehran = new Date(
        gamification.lastCheckInAt.getTime() +
          gamification.lastCheckInAt.getTimezoneOffset() * 60000 +
          tehranOffset
      )
      streakDoneToday = lastTehran.toISOString().split('T')[0] === todayStr
    }

    return NextResponse.json({
      success: true,
      data: {
        currentStreak: streak,
        longestStreak: gamification.longestStreak,
        multiplier,
        streakDoneToday,
        nextMilestone,
        daysToNext,
        milestones: milestones.map((m) => ({
          ...m,
          achieved: streak >= m.days,
        })),
      },
    })
  } catch (error) {
    console.error('Quest streak GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load streak info' },
      { status: 500 }
    )
  }
}

// ── POST: Increment streak ──
// Validates not already done today. Calculates streak multiplier.
export async function POST() {
  try {
    const userId = '1' // Demo user

    let gamification = await db.userGamification.findUnique({
      where: { userId },
    })

    if (!gamification) {
      gamification = await db.userGamification.create({
        data: { userId },
      })
    }

    // Check if already done today
    const todayStr = getTehranToday()
    let streakDoneToday = false

    if (gamification.lastCheckInAt) {
      const tehranOffset = 3.5 * 60 * 60000
      const lastTehran = new Date(
        gamification.lastCheckInAt.getTime() +
          gamification.lastCheckInAt.getTimezoneOffset() * 60000 +
          tehranOffset
      )
      streakDoneToday = lastTehran.toISOString().split('T')[0] === todayStr
    }

    if (streakDoneToday) {
      const currentMultiplier = getStreakMultiplier(gamification.currentStreak)
      return NextResponse.json({
        success: false,
        message: 'Streak already incremented today',
        data: {
          currentStreak: gamification.currentStreak,
          multiplier: currentMultiplier,
          streakDoneToday: true,
        },
      })
    }

    // Check if streak is broken
    let newStreak = gamification.currentStreak + 1

    if (gamification.lastCheckInAt) {
      const tehranOffset = 3.5 * 60 * 60000
      const lastTehran = new Date(
        gamification.lastCheckInAt.getTime() +
          gamification.lastCheckInAt.getTimezoneOffset() * 60000 +
          tehranOffset
      )
      const lastStr = lastTehran.toISOString().split('T')[0]

      // Get yesterday string
      const now = new Date()
      const tehranTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + tehranOffset)
      const yesterday = new Date(tehranTime)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      if (lastStr !== yesterdayStr) {
        newStreak = 1 // Reset streak
      }
    }

    const newLongest = Math.max(newStreak, gamification.longestStreak)
    const newMultiplier = getStreakMultiplier(newStreak)

    // Check if multiplier increased — award bonus
    const oldMultiplier = getStreakMultiplier(gamification.currentStreak)
    let bonusXp = 0
    let bonusGold = 0
    let multiplierIncreased = false

    if (newMultiplier > oldMultiplier) {
      multiplierIncreased = true
      bonusXp = Math.floor(50 * newMultiplier)
      bonusGold = Math.round(0.01 * newMultiplier * 1000) / 1000

      // Create a streak reward transaction
      await db.questRewardTransaction.create({
        data: {
          userId,
          source: 'streak',
          goldMg: bonusGold,
          xpEarned: bonusXp,
          description: `Streak milestone: ${newStreak} days (${newMultiplier}x multiplier)`,
          descriptionFa: `رکورد استریک: ${newStreak} روز (ضریب ${newMultiplier}x)`,
          multiplier: newMultiplier,
        },
      })
    }

    // Update gamification
    const newXp = gamification.xp + bonusXp

    await db.userGamification.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastCheckInAt: new Date(),
        xp: newXp,
      },
    })

    // Add bonus gold if multiplier increased (skip if goldWallet doesn't exist)
    if (bonusGold > 0) {
      try {
        await db.goldWallet.upsert({
          where: { userId },
          update: { goldGrams: { increment: bonusGold } },
          create: { userId, goldGrams: bonusGold },
        })
      } catch {
        // goldWallet may not exist, skip gold reward
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        multiplier: newMultiplier,
        multiplierIncreased,
        bonusXp,
        bonusGold,
      },
    })
  } catch (error) {
    console.error('Quest streak POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to increment streak' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100
}

// ── GET: Get or create UserGamification profile ──
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

    // Get or create gamification profile
    let gamification = await db.userGamification.findUnique({
      where: { userId },
    })

    if (!gamification) {
      gamification = await db.userGamification.create({
        data: { userId },
      })
    }

    // Recalculate level from XP
    const level = calculateLevel(gamification.xp)
    const currentLevelXp = xpForLevel(level)
    const nextLevelXp = xpForLevel(level + 1)
    const progressXp = gamification.xp - currentLevelXp
    const totalXpNeeded = nextLevelXp - currentLevelXp
    const levelProgress = totalXpNeeded > 0 ? Math.min((progressXp / totalXpNeeded) * 100, 100) : 100

    // Count earned badges
    const earnedBadges = await db.userAchievement.count({
      where: { userId },
    })

    // Get rank (position by XP)
    const rankResult = await db.userGamification.count({
      where: {
        xp: { gt: gamification.xp },
      },
    })
    const rank = rankResult + 1

    // Update level if changed
    if (gamification.level !== level) {
      await db.userGamification.update({
        where: { userId },
        data: { level },
      })
    }

    return NextResponse.json({
      success: true,
      gamification: {
        xp: gamification.xp,
        level,
        levelProgress: Math.round(levelProgress * 100) / 100,
        currentStreak: gamification.currentStreak,
        longestStreak: gamification.longestStreak,
        badges: earnedBadges,
        rank,
        checkInCount: gamification.checkInCount,
        predictionScore: gamification.predictionScore,
        referralCount: gamification.referralCount,
        lastCheckInAt: gamification.lastCheckInAt,
      },
    })
  } catch (error) {
    console.error('Gamification profile error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت پروفایل بازی‌سازی' },
      { status: 500 }
    )
  }
}

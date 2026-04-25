import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: All achievements + user earned status ──
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

    // Get all visible achievements
    const achievements = await db.achievement.findMany({
      where: { isHidden: false },
      orderBy: { sortOrder: 'asc' },
    })

    // Get user's earned achievements
    const userAchievements = await db.userAchievement.findMany({
      where: { userId },
      select: {
        achievementId: true,
        earnedAt: true,
      },
    })

    const earnedMap = new Map<string, Date>()
    for (const ua of userAchievements) {
      earnedMap.set(ua.achievementId, ua.earnedAt)
    }

    const result = achievements.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      description: a.description,
      icon: a.icon,
      category: a.category,
      xpReward: a.xpReward,
      goldRewardMg: a.goldRewardMg,
      earned: earnedMap.has(a.id),
      earnedAt: earnedMap.get(a.id)?.toISOString() || null,
    }))

    return NextResponse.json({
      success: true,
      achievements: result,
      total: result.length,
      earned: userAchievements.length,
    })
  } catch (error) {
    console.error('Achievements list error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست دستاوردها' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: Quest-related badges ──
// Filters Achievement by category "quest", includes user's earned badges
export async function GET() {
  try {
    const userId = '1' // Demo user

    // Get all quest category achievements
    const questAchievements = await db.achievement.findMany({
      where: { category: 'quest' },
      orderBy: { sortOrder: 'asc' },
    })

    // Get user's earned quest badges
    const earnedBadges = await db.userAchievement.findMany({
      where: {
        userId,
        achievement: { category: 'quest' },
      },
      include: {
        achievement: true,
      },
      orderBy: { earnedAt: 'desc' },
    })

    const earnedIds = new Set(earnedBadges.map((b) => b.achievementId))

    // Merge: all quest achievements with earned status
    const allBadges = questAchievements.map((achievement) => ({
      id: achievement.id,
      slug: achievement.slug,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      xpReward: achievement.xpReward,
      goldRewardMg: achievement.goldRewardMg,
      isHidden: achievement.isHidden,
      isEarned: earnedIds.has(achievement.id),
      earnedAt: earnedBadges.find((b) => b.achievementId === achievement.id)?.earnedAt ?? null,
    }))

    // Separate earned vs locked
    const earned = allBadges.filter((b) => b.isEarned)
    const locked = allBadges.filter((b) => !b.isHidden && !b.isEarned)
    const hidden = allBadges.filter((b) => b.isHidden && !b.isEarned)

    return NextResponse.json({
      success: true,
      data: {
        total: questAchievements.length,
        earned: earned.length,
        locked: locked.length,
        hidden: hidden.length,
        earnedBadges: earned,
        availableBadges: locked,
        recentEarned: earnedBadges.slice(0, 5).map((b) => ({
          id: b.achievement.id,
          slug: b.achievement.slug,
          title: b.achievement.title,
          icon: b.achievement.icon,
          earnedAt: b.earnedAt,
          xpReward: b.achievement.xpReward,
          goldRewardMg: b.achievement.goldRewardMg,
        })),
      },
    })
  } catch (error) {
    console.error('Quest badges error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load quest badges' },
      { status: 500 }
    )
  }
}

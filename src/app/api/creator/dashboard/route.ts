import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const DEMO_USER_ID = '1'

// ─── GET: Creator Dashboard ───
export async function GET() {
  try {
    // Get or create profile
    let profile = await db.creatorProfile.findUnique({
      where: { userId: DEMO_USER_ID },
    })

    if (!profile) {
      profile = await db.creatorProfile.create({
        data: { userId: DEMO_USER_ID },
      })
    }

    // Get submission counts by status
    const submissionCounts = await db.creatorSubmission.groupBy({
      by: ['status'],
      where: { userId: DEMO_USER_ID },
      _count: { status: true },
    })

    const countMap: Record<string, number> = {
      pending: 0,
      ai_review: 0,
      approved: 0,
      rejected: 0,
      revision: 0,
    }
    for (const sc of submissionCounts) {
      countMap[sc.status] = sc._count.status
    }

    // Get recent 5 submissions
    const recentSubmissions = await db.creatorSubmission.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        campaign: {
          select: { id: true, title: true, rewardMg: true, tier: true },
        },
      },
    })

    // Get recent 5 rewards
    const recentRewards = await db.creatorReward.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        submission: {
          select: { id: true, platform: true, postUrl: true },
        },
      },
    })

    // Calculate total gold earned
    const goldAgg = await db.creatorReward.aggregate({
      where: { userId: DEMO_USER_ID, isActive: true },
      _sum: { goldMg: true },
    })
    const totalGoldEarned = goldAgg._sum.goldMg || 0

    // Get current level info
    const levels = ['beginner', 'bronze', 'silver', 'gold', 'diamond', 'elite']
    const currentLevelIndex = levels.indexOf(profile.level)
    const nextLevel = currentLevelIndex < levels.length - 1 ? levels[currentLevelIndex + 1] : null

    // Thresholds for next level (simulated)
    const levelThresholds: Record<string, number> = {
      beginner: 0,
      bronze: 100,
      silver: 500,
      gold: 1500,
      diamond: 5000,
      elite: 15000,
    }
    const currentThreshold = levelThresholds[profile.level] || 0
    const nextThreshold = nextLevel ? levelThresholds[nextLevel] : profile.score

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          userId: profile.userId,
          level: profile.level,
          score: profile.score,
          rank: profile.rank,
          bio: profile.bio,
          joinedAt: profile.joinedAt,
        },
        stats: {
          totalGoldEarned,
          totalPosts: profile.totalPosts,
          approvedPosts: profile.approvedPosts,
          rejectedPosts: profile.rejectedPosts,
          pendingPosts: profile.pendingPosts,
          totalViews: profile.totalViews,
          referralClicks: profile.referralClicks,
          referralSignups: profile.referralSignups,
          referralPurchases: profile.referralPurchases,
          submissionCounts: countMap,
        },
        levelProgress: {
          currentLevel: profile.level,
          nextLevel,
          currentScore: profile.score,
          currentThreshold,
          nextThreshold,
          progress: nextLevel
            ? Math.min(100, Math.round(((profile.score - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
            : 100,
        },
        recentSubmissions,
        recentRewards,
      },
    })
  } catch (error) {
    console.error('[Creator Dashboard GET]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: Learning path missions ──
// Returns grouped lessons with completion status for category="learning_path"
export async function GET() {
  try {
    const userId = '1' // Demo user

    // Get all learning path missions
    const learningMissions = await db.mission.findMany({
      where: {
        category: 'learning_path',
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    // Get user's progress on each learning mission
    const missionsWithProgress = await Promise.all(
      learningMissions.map(async (mission) => {
        const userMission = await db.userMission.findFirst({
          where: { userId, missionId: mission.id },
          orderBy: { createdAt: 'desc' },
        })

        return {
          id: mission.id,
          title: mission.title,
          titleFa: mission.titleFa,
          description: mission.description,
          descriptionFa: mission.descriptionFa,
          type: mission.type,
          rewardXp: mission.rewardXp,
          rewardGoldMg: mission.rewardGoldMg,
          targetPage: mission.targetPage,
          requiredCount: mission.requiredCount,
          rulesJson: mission.rulesJson,
          userProgress: userMission
            ? {
                id: userMission.id,
                progress: userMission.progress,
                status: userMission.status,
                xpEarned: userMission.xpEarned,
                goldEarned: userMission.goldEarned,
                trackedTime: userMission.trackedTime,
                scrollDepth: userMission.scrollDepth,
                completedAt: userMission.completedAt,
                claimedAt: userMission.claimedAt,
              }
            : null,
          isCompleted: userMission?.status === 'completed' || userMission?.status === 'claimed',
          isClaimed: userMission?.status === 'claimed',
        }
      })
    )

    // Group into lessons
    const lessons = missionsWithProgress.map((mission, index) => ({
      lessonNumber: index + 1,
      ...mission,
    }))

    // Calculate overall learning path progress
    const completedCount = lessons.filter((l) => l.isCompleted).length
    const claimedCount = lessons.filter((l) => l.isClaimed).length
    const totalCount = lessons.length
    const overallProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    // Total rewards available and earned
    const totalXpAvailable = learningMissions.reduce((sum, m) => sum + m.rewardXp, 0)
    const totalGoldAvailable = learningMissions.reduce((sum, m) => sum + m.rewardGoldMg, 0)
    const totalXpEarned = lessons.reduce((sum, l) => sum + (l.userProgress?.xpEarned || 0), 0)
    const totalGoldEarned = lessons.reduce((sum, l) => sum + (l.userProgress?.goldEarned || 0), 0)

    // Determine the next uncompleted lesson
    const nextLesson = lessons.find((l) => !l.isCompleted) || null

    return NextResponse.json({
      success: true,
      data: {
        lessons,
        nextLesson,
        progress: {
          completedCount,
          claimedCount,
          totalCount,
          overallProgress,
          totalXpAvailable,
          totalGoldAvailable: Math.round(totalGoldAvailable * 1000) / 1000,
          totalXpEarned,
          totalGoldEarned: Math.round(totalGoldEarned * 1000) / 1000,
        },
      },
    })
  } catch (error) {
    console.error('Quest learning paths error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load learning paths' },
      { status: 500 }
    )
  }
}

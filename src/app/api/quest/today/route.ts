import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: Today's available missions (daily category) ──
export async function GET() {
  try {
    const userId = '1'

    const dailyMissions = await db.mission.findMany({
      where: {
        isActive: true,
        category: 'daily',
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    // Batch fetch user missions
    const missionIds = dailyMissions.map((m) => m.id)
    const todayUserMissions = missionIds.length > 0
      ? await db.userMission.findMany({
          where: {
            userId,
            missionId: { in: missionIds },
          },
          orderBy: { createdAt: 'desc' },
        })
      : []

    // Map: missionId -> latest UserMission
    const userMissionMap = new Map<string, (typeof todayUserMissions)[number]>()
    for (const um of todayUserMissions) {
      const existing = userMissionMap.get(um.missionId)
      if (!existing) {
        userMissionMap.set(um.missionId, um)
      }
    }

    const missionsWithProgress = dailyMissions.map((mission) => {
      const um = userMissionMap.get(mission.id)
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
        progress: um ? um.progress : 0,
        status: um ? um.status : 'not_started',
        userMissionId: um?.id ?? null,
        trackedTime: um?.trackedTime ?? 0,
        scrollDepth: um?.scrollDepth ?? 0,
        interactions: um?.interactions ?? 0,
      }
    })

    const completedToday = todayUserMissions.filter(
      (um) => um.status === 'completed' || um.status === 'claimed'
    ).length

    const claimedToday = todayUserMissions.filter(
      (um) => um.status === 'claimed'
    ).length

    return NextResponse.json({
      success: true,
      data: {
        totalDailyMissions: dailyMissions.length,
        completedToday,
        claimedToday,
        remainingToday: dailyMissions.length - completedToday,
        missions: missionsWithProgress,
      },
    })
  } catch (error) {
    console.error('Quest today error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load today missions' },
      { status: 500 }
    )
  }
}

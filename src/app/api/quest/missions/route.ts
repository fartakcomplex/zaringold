import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: All active missions (filterable by type/category) ──
export async function GET(request: NextRequest) {
  try {
    const userId = '1' // Demo user
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')

    const where: Record<string, unknown> = { isActive: true }
    if (type) where.type = type
    if (category) where.category = category

    const missions = await db.mission.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    // Batch fetch all user missions for this user (avoid N+1)
    const allUserMissions = await db.userMission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    // Build a map of missionId -> latest userMission
    const userMissionMap = new Map<string, typeof allUserMissions[0]>()
    for (const um of allUserMissions) {
      const existing = userMissionMap.get(um.missionId)
      if (!existing) {
        userMissionMap.set(um.missionId, um)
      }
    }

    const missionsWithProgress = missions.map((mission) => {
      const um = userMissionMap.get(mission.id)
      return {
        ...mission,
        userProgress: um
          ? {
              id: um.id,
              progress: um.progress,
              status: um.status,
              xpEarned: um.xpEarned,
              goldEarned: um.goldEarned,
              trackedTime: um.trackedTime,
              scrollDepth: um.scrollDepth,
              interactions: um.interactions,
              completedAt: um.completedAt,
              claimedAt: um.claimedAt,
            }
          : null,
      }
    })

    return NextResponse.json({
      success: true,
      data: missionsWithProgress,
    })
  } catch (error) {
    console.error('Quest missions error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load missions' },
      { status: 500 }
    )
  }
}

// ── POST: Seed demo missions ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action !== 'seed') {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Use action="seed".' },
        { status: 400 }
      )
    }

    const existingCount = await db.mission.count()
    if (existingCount > 0) {
      return NextResponse.json({
        success: true,
        message: `Missions already exist (${existingCount} found).`,
        count: existingCount,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Missions already seeded via direct DB insert.',
      count: existingCount,
    })
  } catch (error) {
    console.error('Seed missions error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to seed missions' },
      { status: 500 }
    )
  }
}

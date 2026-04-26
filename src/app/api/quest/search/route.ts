import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── POST: Track search query ──
// Creates/finds a "search" type mission, updates progress
export async function POST(request: NextRequest) {
  try {
    const userId = '1' // Demo user
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'A valid search query (min 2 chars) is required' },
        { status: 400 }
      )
    }

    const trimmedQuery = query.trim()

    // Find a matching search mission
    let mission = await db.mission.findFirst({
      where: {
        type: 'search',
        isActive: true,
      },
    })

    // Check if the query matches any search mission rules
    let matchedMission = mission
    if (mission) {
      try {
        const rules = JSON.parse(mission.rulesJson)
        const requiredQuery = rules.requiredQuery || ''
        if (requiredQuery && !trimmedQuery.toLowerCase().includes(requiredQuery.toLowerCase())) {
          matchedMission = null
        }
      } catch {
        // No specific query required
        matchedMission = mission
      }
    }

    // If no matching mission, create a general search tracking mission
    if (!matchedMission) {
      // Check if we already created a generic search mission
      const genericSearch = await db.mission.findFirst({
        where: {
          type: 'search',
          title: 'General Search',
        },
      })

      if (!genericSearch) {
        matchedMission = await db.mission.create({
          data: {
            title: 'General Search',
            titleFa: 'جستجوی عمومی',
            description: 'Perform any search query on the platform.',
            descriptionFa: 'هر جستجویی در پلتفرم انجام دهید.',
            type: 'search',
            category: 'daily',
            rewardXp: 5,
            rewardGoldMg: 0.002,
            rulesJson: JSON.stringify({ minDuration: 5 }),
            requiredCount: 1,
            sortOrder: 99,
          },
        })
      } else {
        matchedMission = genericSearch
      }
    }

    // Track this search as engagement for the mission
    const now = new Date()
    const tehranOffset = 3.5 * 60 * 60000
    const tehranTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + tehranOffset)
    const todayStart = new Date(tehranTime.getFullYear(), tehranTime.getMonth(), tehranTime.getDate())

    // Find today's user mission for this search
    let userMission = await db.userMission.findFirst({
      where: {
        userId,
        missionId: matchedMission.id,
        createdAt: { gte: todayStart },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!userMission) {
      userMission = await db.userMission.create({
        data: {
          userId,
          missionId: matchedMission.id,
          trackedTime: 5, // 5 seconds for a search
          interactions: 1,
          progress: 0,
        },
      })
    } else if (userMission.status === 'completed' || userMission.status === 'claimed') {
      // Already completed this search mission today
      return NextResponse.json({
        success: true,
        data: {
          message: 'Search tracked. Mission already completed today.',
          query: trimmedQuery,
          missionId: matchedMission.id,
          userMissionId: userMission.id,
          status: userMission.status,
        },
      })
    }

    // Validate against rules
    let isCompleted = false
    try {
      const rules = JSON.parse(matchedMission.rulesJson)
      const minDuration = Number(rules.minDuration) || 5
      const requiredQuery = rules.requiredQuery || ''

      // For search missions, completing means either matching the query or spending minimum time
      const queryMatches = !requiredQuery || trimmedQuery.toLowerCase().includes(requiredQuery.toLowerCase())
      isCompleted = queryMatches && userMission.trackedTime >= minDuration
    } catch {
      isCompleted = true // Default complete on search
    }

    // Update user mission
    const updatedMission = await db.userMission.update({
      where: { id: userMission.id },
      data: {
        interactions: userMission.interactions + 1,
        trackedTime: userMission.trackedTime + 5,
        progress: isCompleted ? 100 : Math.min(userMission.progress + 25, 90),
        status: isCompleted ? 'completed' : 'in_progress',
        completedAt: isCompleted ? new Date() : null,
        xpEarned: isCompleted ? matchedMission.rewardXp : 0,
        goldEarned: isCompleted ? matchedMission.rewardGoldMg : 0,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        query: trimmedQuery,
        missionId: matchedMission.id,
        missionTitle: matchedMission.title,
        missionTitleFa: matchedMission.titleFa,
        userMissionId: updatedMission.id,
        status: updatedMission.status,
        progress: updatedMission.progress,
        isCompleted,
        rewardXp: isCompleted ? matchedMission.rewardXp : 0,
        rewardGoldMg: isCompleted ? matchedMission.rewardGoldMg : 0,
      },
    })
  } catch (error) {
    console.error('Quest search error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to track search' },
      { status: 500 }
    )
  }
}

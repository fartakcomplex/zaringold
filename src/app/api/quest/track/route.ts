import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── POST: Track user engagement for a mission ──
// Validates against mission rulesJson, auto-completes if rules met
export async function POST(request: NextRequest) {
  try {
    const userId = '1' // Demo user
    const body = await request.json()
    const { missionId, trackedTime, scrollDepth, interactions } = body

    if (!missionId) {
      return NextResponse.json(
        { success: false, message: 'missionId is required' },
        { status: 400 }
      )
    }

    // Validate numeric fields
    const time = Math.max(0, Math.min(Number(trackedTime) || 0, 86400)) // Max 24 hours
    const scroll = Math.max(0, Math.min(Number(scrollDepth) || 0, 100)) // 0-100
    const interact = Math.max(0, Math.floor(Number(interactions) || 0))

    // Get the mission
    const mission = await db.mission.findUnique({
      where: { id: missionId },
    })

    if (!mission || !mission.isActive) {
      return NextResponse.json(
        { success: false, message: 'Mission not found or inactive' },
        { status: 404 }
      )
    }

    // Check max completions per user
    const completedCount = await db.userMission.count({
      where: {
        userId,
        missionId,
        status: { in: ['completed', 'claimed'] },
      },
    })

    if (completedCount >= mission.maxCompletionsPerUser) {
      return NextResponse.json(
        { success: false, message: 'Mission max completions reached' },
        { status: 400 }
      )
    }

    // Get or create today's UserMission for daily missions, or latest for others
    let userMission: {
      id: string
      progress: number
      status: string
      trackedTime: number
      scrollDepth: number
      interactions: number
    } | null = null

    if (mission.category === 'daily') {
      // Find today's user mission
      const now = new Date()
      const tehranOffset = 3.5 * 60 * 60000
      const tehranTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + tehranOffset)
      const todayStart = new Date(tehranTime.getFullYear(), tehranTime.getMonth(), tehranTime.getDate())

      userMission = await db.userMission.findFirst({
        where: {
          userId,
          missionId,
          createdAt: { gte: todayStart },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (!userMission) {
        userMission = await db.userMission.create({
          data: {
            userId,
            missionId,
            trackedTime: time,
            scrollDepth: scroll,
            interactions: interact,
            progress: 0,
          },
        })
      }
    } else {
      // For non-daily missions, find the latest in_progress one
      userMission = await db.userMission.findFirst({
        where: {
          userId,
          missionId,
          status: 'in_progress',
        },
        orderBy: { createdAt: 'desc' },
      })

      if (!userMission) {
        userMission = await db.userMission.create({
          data: {
            userId,
            missionId,
            trackedTime: time,
            scrollDepth: scroll,
            interactions: interact,
            progress: 0,
          },
        })
      }
    }

    // Don't update already completed/claimed missions
    if (userMission.status === 'completed' || userMission.status === 'claimed') {
      return NextResponse.json({
        success: true,
        data: {
          userMissionId: userMission.id,
          status: userMission.status,
          message: 'Mission already completed',
        },
      })
    }

    // Accumulate tracking data (take max of scroll depth, sum time and interactions)
    const updatedTrackedTime = userMission.trackedTime + time
    const updatedScrollDepth = Math.max(userMission.scrollDepth, scroll)
    const updatedInteractions = userMission.interactions + interact

    // Parse rules and validate
    let isCompleted = false
    try {
      const rules = JSON.parse(mission.rulesJson)

      const minDuration = Number(rules.minDuration) || 0
      const minScroll = Number(rules.minScroll) || 0
      const minInteractions = Number(rules.minInteractions) || 0
      const requiredPages = Number(rules.requiredPages) || 0

      // Check if all rules are met
      const timeMet = updatedTrackedTime >= minDuration
      const scrollMet = updatedScrollDepth >= minScroll
      const interactMet = updatedInteractions >= minInteractions
      const pagesMet = requiredPages <= 0 || updatedInteractions >= requiredPages

      isCompleted = timeMet && scrollMet && interactMet && pagesMet
    } catch {
      // If rulesJson is not valid JSON, auto-complete on any tracking
      isCompleted = updatedTrackedTime > 0
    }

    // Calculate progress percentage
    let progress = 0
    try {
      const rules = JSON.parse(mission.rulesJson)
      const minDuration = Number(rules.minDuration) || 60
      const progressPercent = Math.min((updatedTrackedTime / minDuration) * 100, 100)
      progress = Math.floor(progressPercent)
    } catch {
      progress = updatedTrackedTime > 0 ? 100 : 0
    }

    // Update user mission
    const updatedMission = await db.userMission.update({
      where: { id: userMission.id },
      data: {
        trackedTime: updatedTrackedTime,
        scrollDepth: updatedScrollDepth,
        interactions: updatedInteractions,
        progress: isCompleted ? 100 : progress,
        status: isCompleted ? 'completed' : 'in_progress',
        completedAt: isCompleted ? new Date() : null,
        xpEarned: isCompleted ? mission.rewardXp : 0,
        goldEarned: isCompleted ? mission.rewardGoldMg : 0,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        userMissionId: updatedMission.id,
        status: updatedMission.status,
        progress: updatedMission.progress,
        trackedTime: updatedTrackedTime,
        scrollDepth: updatedScrollDepth,
        interactions: updatedInteractions,
        isCompleted,
        rewardXp: isCompleted ? mission.rewardXp : 0,
        rewardGoldMg: isCompleted ? mission.rewardGoldMg : 0,
        missionTitle: mission.title,
        missionTitleFa: mission.titleFa,
      },
    })
  } catch (error) {
    console.error('Quest track error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to track engagement' },
      { status: 500 }
    )
  }
}

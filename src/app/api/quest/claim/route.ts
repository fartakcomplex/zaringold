import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Level calculation
function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

// Streak multiplier
function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 5.0
  if (streak >= 14) return 3.0
  if (streak >= 7) return 2.0
  if (streak >= 3) return 1.5
  return 1.0
}

// ── POST: Claim mission reward ──
// Marks userMission as claimed, creates QuestRewardTransaction, updates UserGamification XP
export async function POST(request: NextRequest) {
  try {
    const userId = '1' // Demo user
    const body = await request.json()
    const { userMissionId } = body

    if (!userMissionId) {
      return NextResponse.json(
        { success: false, message: 'userMissionId is required' },
        { status: 400 }
      )
    }

    // Get the user mission
    const userMission = await db.userMission.findUnique({
      where: { id: userMissionId },
      include: { mission: true },
    })

    if (!userMission) {
      return NextResponse.json(
        { success: false, message: 'User mission not found' },
        { status: 404 }
      )
    }

    if (userMission.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      )
    }

    if (userMission.status !== 'completed') {
      return NextResponse.json(
        { success: false, message: 'Mission is not completed yet' },
        { status: 400 }
      )
    }

    // Get or create gamification profile for streak multiplier
    let gamification = await db.userGamification.findUnique({
      where: { userId },
    })

    if (!gamification) {
      gamification = await db.userGamification.create({
        data: { userId },
      })
    }

    const multiplier = getStreakMultiplier(gamification.currentStreak)

    // Calculate rewards with multiplier
    const baseXp = userMission.mission.rewardXp
    const baseGold = userMission.mission.rewardGoldMg
    const finalXp = Math.floor(baseXp * multiplier)
    const finalGold = Math.round(baseGold * multiplier * 1000) / 1000

    // Mark user mission as claimed
    await db.userMission.update({
      where: { id: userMissionId },
      data: {
        status: 'claimed',
        claimedAt: new Date(),
        xpEarned: finalXp,
        goldEarned: finalGold,
      },
    })

    // Create reward transaction
    const rewardTx = await db.questRewardTransaction.create({
      data: {
        userId,
        missionId: userMission.missionId,
        source: 'mission',
        goldMg: finalGold,
        xpEarned: finalXp,
        description: `Completed: ${userMission.mission.title}`,
        descriptionFa: `تکمیل مأموریت: ${userMission.mission.titleFa || userMission.mission.title}`,
        multiplier,
      },
    })

    // Update user gamification XP
    const newXp = gamification.xp + finalXp
    const newLevel = calculateLevel(newXp)

    await db.userGamification.update({
      where: { userId },
      data: {
        xp: newXp,
        level: newLevel,
      },
    })

    // Add gold to wallet
    if (finalGold > 0) {
      await db.goldWallet.upsert({
        where: { userId },
        update: { goldGrams: { increment: finalGold } },
        create: { userId, goldGrams: finalGold },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        claimed: true,
        userMissionId,
        reward: {
          baseXp,
          baseGold,
          multiplier,
          finalXp,
          finalGold,
        },
        gamification: {
          newXp,
          newLevel,
          streak: gamification.currentStreak,
        },
        transaction: rewardTx,
      },
    })
  } catch (error) {
    console.error('Quest claim error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to claim reward' },
      { status: 500 }
    )
  }
}

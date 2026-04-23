import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: User's cashback rewards ──
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') // Optional filter: pending, claimed, expired

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { userId }
    if (status) {
      where.status = status
    }

    const rewards = await db.cashbackReward.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Calculate totals
    const totalRewards = rewards.length
    const totalClaimed = rewards.filter((r) => r.status === 'claimed').length
    const totalPending = rewards.filter((r) => r.status === 'pending').length
    const totalValueFiat = rewards
      .filter((r) => r.status === 'pending' && r.rewardType === 'fiat')
      .reduce((sum, r) => sum + r.rewardValue, 0)
    const totalValueGold = rewards
      .filter((r) => r.status === 'pending' && r.rewardType === 'gold')
      .reduce((sum, r) => sum + r.rewardValue, 0)

    // Check for expired rewards and update them
    const now = new Date()
    for (const reward of rewards) {
      if (reward.status === 'pending' && reward.expiresAt && reward.expiresAt < now) {
        await db.cashbackReward.update({
          where: { id: reward.id },
          data: { status: 'expired' },
        })
        reward.status = 'expired'
      }
    }

    return NextResponse.json({
      success: true,
      rewards: rewards.map((r) => ({
        id: r.id,
        title: r.title,
        rewardType: r.rewardType,
        rewardValue: r.rewardValue,
        status: r.status,
        expiresAt: r.expiresAt?.toISOString() || null,
        claimedAt: r.claimedAt?.toISOString() || null,
        createdAt: r.createdAt.toISOString(),
      })),
      summary: {
        total: totalRewards,
        claimed: totalClaimed,
        pending: totalPending,
        totalPendingFiat: Math.round(totalValueFiat),
        totalPendingGold: Math.round(totalValueGold * 1000) / 1000,
      },
    })
  } catch (error) {
    console.error('Cashback list error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست کش‌بک‌ها' },
      { status: 500 }
    )
  }
}

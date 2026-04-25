import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── POST: Claim a cashback reward ──
export async function POST(request: NextRequest) {
  try {
    const { rewardId, userId } = await request.json()

    if (!rewardId || !userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه جایزه و شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    // Find the reward
    const reward = await db.cashbackReward.findUnique({
      where: { id: rewardId },
    })

    if (!reward) {
      return NextResponse.json(
        { success: false, message: 'جایزه یافت نشد' },
        { status: 404 }
      )
    }

    if (reward.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'این جایزه متعلق به شما نیست' },
        { status: 403 }
      )
    }

    if (reward.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'این جایزه قبلاً دریافت یا منقضی شده است' },
        { status: 400 }
      )
    }

    // Check expiry
    if (reward.expiresAt && reward.expiresAt < new Date()) {
      await db.cashbackReward.update({
        where: { id: rewardId },
        data: { status: 'expired' },
      })
      return NextResponse.json(
        { success: false, message: 'مهلت دریافت این جایزه به پایان رسیده است' },
        { status: 400 }
      )
    }

    // Apply reward to wallet
    if (reward.rewardType === 'fiat') {
      await db.wallet.upsert({
        where: { userId },
        update: { balance: { increment: reward.rewardValue } },
        create: { userId, balance: reward.rewardValue },
      })
    } else if (reward.rewardType === 'gold') {
      await db.goldWallet.upsert({
        where: { userId },
        update: { goldGrams: { increment: reward.rewardValue } },
        create: { userId, goldGrams: reward.rewardValue },
      })
    }

    // Update reward status
    await db.cashbackReward.update({
      where: { id: rewardId },
      data: {
        status: 'claimed',
        claimedAt: new Date(),
      },
    })

    const rewardLabel =
      reward.rewardType === 'fiat'
        ? `${reward.rewardValue.toLocaleString('fa-IR')} واحد طلایی`
        : `${reward.rewardValue} گرم طلا`

    return NextResponse.json({
      success: true,
      message: `جایزه ${rewardLabel} با موفقیت به کیف پول شما اضافه شد`,
      claimedReward: {
        id: reward.id,
        title: reward.title,
        rewardType: reward.rewardType,
        rewardValue: reward.rewardValue,
        claimedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Cashback claim error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت جایزه' },
      { status: 500 }
    )
  }
}

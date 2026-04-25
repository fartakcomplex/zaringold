import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GET /api/v1/wallet/cashback                                                */
/*  Return user's cashback balance and claim history                          */
/*  Query: ?userId=xxx                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'شناسه کاربر الزامی است',
          error_code: -1,
        },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, isFrozen: true, isActive: true },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'کاربر یافت نشد',
          error_code: -2,
        },
        { status: 404 }
      )
    }

    // Fetch all cashback rewards for this user
    const rewards = await db.cashbackReward.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    // Auto-expire past-due pending rewards
    const now = new Date()
    const expiredUpdates: Promise<unknown>[] = []
    for (const reward of rewards) {
      if (reward.status === 'pending' && reward.expiresAt && reward.expiresAt < now) {
        expiredUpdates.push(
          db.cashbackReward.update({
            where: { id: reward.id },
            data: { status: 'expired' },
          })
        )
        reward.status = 'expired'
      }
    }
    if (expiredUpdates.length > 0) {
      await Promise.all(expiredUpdates)
    }

    // Calculate balance breakdown
    const pendingRewards = rewards.filter((r) => r.status === 'pending')
    const pendingFiatTotal = pendingRewards
      .filter((r) => r.rewardType === 'fiat')
      .reduce((sum, r) => sum + r.rewardValue, 0)
    const pendingGoldTotal = pendingRewards
      .filter((r) => r.rewardType === 'gold')
      .reduce((sum, r) => sum + r.rewardValue, 0)

    const claimedRewards = rewards.filter((r) => r.status === 'claimed')
    const claimedFiatTotal = claimedRewards
      .filter((r) => r.rewardType === 'fiat')
      .reduce((sum, r) => sum + r.rewardValue, 0)
    const claimedGoldTotal = claimedRewards
      .filter((r) => r.rewardType === 'gold')
      .reduce((sum, r) => sum + r.rewardValue, 0)

    return NextResponse.json({
      success: true,
      data: {
        balance: {
          pending_fiat: Math.round(pendingFiatTotal),
          pending_gold: Math.round(pendingGoldTotal * 10000) / 10000,
          claimed_fiat: Math.round(claimedFiatTotal),
          claimed_gold: Math.round(claimedGoldTotal * 10000) / 10000,
        },
        summary: {
          total_rewards: rewards.length,
          pending: pendingRewards.length,
          claimed: claimedRewards.length,
          expired: rewards.filter((r) => r.status === 'expired').length,
        },
        history: rewards.map((r) => ({
          id: r.id,
          title: r.title,
          reward_type: r.rewardType,
          reward_value: r.rewardValue,
          status: r.status,
          expires_at: r.expiresAt?.toISOString() ?? null,
          claimed_at: r.claimedAt?.toISOString() ?? null,
          created_at: r.createdAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    console.error('[Cashback Wallet] GET error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطای داخلی سرور در دریافت اطلاعات کش‌بک',
        error_code: -99,
      },
      { status: 500 }
    )
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  POST /api/v1/wallet/cashback                                               */
/*  Claim a cashback reward — move from CashbackReward to Wallet              */
/*  Body: { userId, rewardId }                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, rewardId } = body as {
      userId?: string
      rewardId?: string
    }

    // ── Validate required fields ──
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'شناسه کاربر الزامی است',
          error_code: -1,
        },
        { status: 400 }
      )
    }

    if (!rewardId || typeof rewardId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'شناسه جایزه الزامی است',
          error_code: -2,
        },
        { status: 400 }
      )
    }

    // ── Verify user exists and is active ──
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, isFrozen: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'کاربر یافت نشد یا حساب غیرفعال است',
          error_code: -3,
        },
        { status: 403 }
      )
    }

    if (user.isFrozen) {
      return NextResponse.json(
        {
          success: false,
          message: 'حساب کاربری مسدود شده است. لطفاً با پشتیبانی تماس بگیرید',
          error_code: -4,
        },
        { status: 403 }
      )
    }

    // ── Fetch the reward ──
    const reward = await db.cashbackReward.findUnique({
      where: { id: rewardId },
    })

    if (!reward) {
      return NextResponse.json(
        {
          success: false,
          message: 'جایزه یافت نشد',
          error_code: -5,
        },
        { status: 404 }
      )
    }

    // ── Ownership check ──
    if (reward.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'این جایزه متعلق به شما نیست',
          error_code: -6,
        },
        { status: 403 }
      )
    }

    // ── Status check ──
    if (reward.status !== 'pending') {
      const statusMessage: Record<string, string> = {
        claimed: 'این جایزه قبلاً دریافت شده است',
        expired: 'این جایزه منقضی شده است',
      }
      return NextResponse.json(
        {
          success: false,
          message: statusMessage[reward.status] || 'این جایزه قابل دریافت نیست',
          error_code: -7,
        },
        { status: 400 }
      )
    }

    // ── Expiry check ──
    if (reward.expiresAt && reward.expiresAt < new Date()) {
      await db.cashbackReward.update({
        where: { id: rewardId },
        data: { status: 'expired' },
      })
      return NextResponse.json(
        {
          success: false,
          message: 'مهلت دریافت این جایزه به پایان رسیده است',
          error_code: -8,
        },
        { status: 400 }
      )
    }

    // ── Apply reward to the appropriate wallet ──
    const refId = crypto.randomUUID()

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

    // ── Mark reward as claimed ──
    const claimedAt = new Date()
    await db.cashbackReward.update({
      where: { id: rewardId },
      data: {
        status: 'claimed',
        claimedAt,
      },
    })

    // ── Create a transaction record ──
    await db.transaction.create({
      data: {
        userId,
        type: reward.rewardType === 'fiat' ? 'cashback_claim_fiat' : 'cashback_claim_gold',
        amountFiat: reward.rewardType === 'fiat' ? reward.rewardValue : 0,
        amountGold: reward.rewardType === 'gold' ? reward.rewardValue : 0,
        fee: 0,
        status: 'completed',
        referenceId: refId,
        description: `دریافت کش‌بک: ${reward.title}`,
      },
    })

    // ── Format the reward label for the response ──
    const rewardLabel =
      reward.rewardType === 'fiat'
        ? `${Math.round(reward.rewardValue).toLocaleString('fa-IR')} واحد طلایی`
        : `${reward.rewardValue.toFixed(4)} گرم طلا`

    return NextResponse.json({
      success: true,
      message: `جایزه ${rewardLabel} با موفقیت به کیف پول شما اضافه شد`,
      data: {
        id: reward.id,
        title: reward.title,
        reward_type: reward.rewardType,
        reward_value: reward.rewardValue,
        reward_label: rewardLabel,
        claimed_at: claimedAt.toISOString(),
        reference_id: refId,
      },
    })
  } catch (error) {
    console.error('[Cashback Wallet] POST error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطای داخلی سرور در دریافت جایزه',
        error_code: -99,
      },
      { status: 500 }
    )
  }
}

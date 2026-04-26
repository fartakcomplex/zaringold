import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GET /api/v1/wallet/balance                                                */
/*  Return all wallet balances for a user                                     */
/*  Query: ?userId=xxx                                                        */
/*  Response: { toman, gold, cashback }                                      */
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

    /* ── Verify user exists ── */
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

    /* ── Fetch toman wallet ── */
    const tomanWallet = await db.wallet.findUnique({
      where: { userId },
    })

    /* ── Fetch gold wallet ── */
    const goldWallet = await db.goldWallet.findUnique({
      where: { userId },
    })

    /* ── Fetch cashback summary ── */
    const now = new Date()
    const cashbackRewards = await db.cashbackReward.findMany({
      where: { userId },
      select: {
        rewardType: true,
        rewardValue: true,
        status: true,
        expiresAt: true,
      },
    })

    // Auto-expire past-due pending rewards
    const expiredUpdates: Promise<unknown>[] = []
    for (const reward of cashbackRewards) {
      if (reward.status === 'pending' && reward.expiresAt && reward.expiresAt < now) {
        expiredUpdates.push(
          db.cashbackReward.update({
            where: { id: reward.id }, // id not selected — use raw approach
            data: { status: 'expired' },
          })
        )
      }
    }

    // Use a direct query approach for expiry to avoid type mismatch
    if (expiredUpdates.length > 0) {
      await db.cashbackReward.updateMany({
        where: {
          userId,
          status: 'pending',
          expiresAt: { lt: now },
        },
        data: { status: 'expired' },
      })
    }

    // Recalculate after potential expiry updates
    const allCashbackRewards = await db.cashbackReward.findMany({
      where: { userId },
      select: {
        rewardType: true,
        rewardValue: true,
        status: true,
      },
    })

    const pendingCashback = allCashbackRewards.filter((r) => r.status === 'pending')
    const pendingFiat = pendingCashback
      .filter((r) => r.rewardType === 'fiat')
      .reduce((sum, r) => sum + r.rewardValue, 0)
    const pendingGold = pendingCashback
      .filter((r) => r.rewardType === 'gold')
      .reduce((sum, r) => sum + r.rewardValue, 0)

    const totalCashback = allCashbackRewards.length
    const totalClaimed = allCashbackRewards.filter((r) => r.status === 'claimed').length

    /* ── Fetch latest gold price for value estimation ── */
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    const goldBuyPrice = latestPrice?.buyPrice || 0
    const goldSellPrice = latestPrice?.sellPrice || 0

    /* ── Calculate available (non-frozen) amounts ── */
    const tomanBalance = tomanWallet?.balance ?? 0
    const tomanFrozen = tomanWallet?.frozenBalance ?? 0
    const tomanAvailable = tomanBalance - tomanFrozen

    const goldGrams = goldWallet?.goldGrams ?? 0
    const goldFrozen = goldWallet?.frozenGold ?? 0
    const goldAvailable = goldGrams - goldFrozen

    /* ── Build response ── */
    return NextResponse.json({
      success: true,
      data: {
        /* Toman wallet */
        toman: {
          balance: Math.round(tomanBalance),
          frozen: Math.round(tomanFrozen),
          available: Math.round(tomanAvailable),
        },

        /* Gold wallet */
        gold: {
          grams: Math.round(goldGrams * 10000) / 10000,
          frozen: Math.round(goldFrozen * 10000) / 10000,
          available: Math.round(goldAvailable * 10000) / 10000,
          estimated_value_toman: goldBuyPrice > 0
            ? Math.round(goldAvailable * goldBuyPrice)
            : 0,
        },

        /* Cashback summary */
        cashback: {
          pending: pendingCashback.length,
          total: totalCashback,
          claimed: totalClaimed,
          pending_fiat: Math.round(pendingFiat),
          pending_gold: Math.round(pendingGold * 10000) / 10000,
        },

        /* Market context */
        market: {
          gold_buy_price: goldBuyPrice,
          gold_sell_price: goldSellPrice,
          price_timestamp: latestPrice?.createdAt?.toISOString() ?? null,
        },

        /* Account status */
        account: {
          is_active: user.isActive,
          is_frozen: user.isFrozen,
        },
      },
    })
  } catch (error) {
    console.error('[Wallet Balance] GET error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطای داخلی سرور در دریافت موجودی',
        error_code: -99,
      },
      { status: 500 }
    )
  }
}

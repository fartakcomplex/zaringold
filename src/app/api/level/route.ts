import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { LEVELS, LEVEL_ORDER, type UserLevel } from '@/lib/level-system'

/**
 * GET /api/level?userId=xxx
 * Returns current user level info, progress, and next level requirements
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userLevel: true,
        levelUpgradedAt: true,
        kyc: { select: { status: true } },
        profile: { select: { nationalId: true } },
        wallet: { select: { balance: true } },
        goldWallet: { select: { goldGrams: true } },
        transactions: {
          where: { status: 'completed', type: { in: ['gold_buy', 'gold_sell'] } },
          select: { id: true },
        },
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const currentLevel = user.userLevel as UserLevel
    const levelInfo = LEVELS[currentLevel]
    const currentIdx = LEVEL_ORDER.indexOf(currentLevel)
    const nextLevel = currentIdx < LEVEL_ORDER.length - 1 ? LEVELS[LEVEL_ORDER[currentIdx + 1]] : null

    // Calculate progress for diamond
    let diamondProgress = null
    if (currentLevel === 'gold' || currentLevel === 'diamond') {
      const transactionCount = user.transactions.length
      const fiatBalance = user.wallet?.balance ?? 0
      const goldBalance = user.goldWallet?.goldGrams ?? 0
      const diamondReq = LEVELS.diamond

      diamondProgress = {
        transactions: {
          current: transactionCount,
          required: diamondReq.minTransactions,
          percent: Math.min(100, Math.round((transactionCount / diamondReq.minTransactions) * 100)),
        },
        fiatBalance: {
          current: fiatBalance,
          required: diamondReq.minFiatBalance,
          percent: Math.min(100, Math.round((fiatBalance / diamondReq.minFiatBalance) * 100)),
        },
        goldBalance: {
          current: goldBalance,
          required: diamondReq.minGoldBalance,
          percent: Math.min(100, Math.round((goldBalance / diamondReq.minGoldBalance) * 100)),
        },
        overallPercent: Math.min(100, Math.round(
          ((Math.min(1, transactionCount / diamondReq.minTransactions) +
            Math.min(1, fiatBalance / diamondReq.minFiatBalance) +
            Math.min(1, goldBalance / diamondReq.minGoldBalance)) / 3) * 100
        )),
      }
    }

    return NextResponse.json({
      success: true,
      currentLevel,
      levelInfo: {
        key: levelInfo.key,
        labelFa: levelInfo.labelFa,
        labelEn: levelInfo.labelEn,
        icon: levelInfo.icon,
        color: levelInfo.color,
        gradient: levelInfo.gradient,
        description: levelInfo.description,
        unlockedFeatures: levelInfo.unlockedFeatures,
      },
      nextLevel: nextLevel ? {
        key: nextLevel.key,
        labelFa: nextLevel.labelFa,
        labelEn: nextLevel.labelEn,
        icon: nextLevel.icon,
        requirements: nextLevel.requirements,
      } : null,
      progress: {
        levelIndex: currentIdx,
        totalLevels: LEVEL_ORDER.length,
        percent: Math.round((currentIdx / (LEVEL_ORDER.length - 1)) * 100),
      },
      diamondProgress,
      stats: {
        transactionCount: user.transactions.length,
        fiatBalance: user.wallet?.balance ?? 0,
        goldBalance: user.goldWallet?.goldGrams ?? 0,
        kycStatus: user.kyc?.status ?? 'none',
        hasProfile: !!user.profile?.nationalId,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Level GET error:', error)
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 })
  }
}

/**
 * POST /api/level
 * Evaluates and potentially upgrades user level
 * Called after: profile completion, KYC approval, purchase, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userLevel: true,
        fullName: true,
        kyc: { select: { status: true } },
        profile: { select: { nationalId: true } },
        wallet: { select: { balance: true } },
        goldWallet: { select: { goldGrams: true } },
        transactions: {
          where: { status: 'completed', type: 'gold_buy' },
          select: { id: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const currentLevel = user.userLevel as UserLevel
    let newLevel: UserLevel = currentLevel

    // Check bronze: profile completed (has fullName + nationalId)
    if (currentLevel === 'none') {
      const hasName = user.fullName && user.fullName.trim().length > 0
      const hasNationalId = user.profile?.nationalId && user.profile.nationalId.trim().length > 0
      if (hasName && hasNationalId) {
        newLevel = 'bronze'
      }
    }

    // Check silver: KYC approved
    if (newLevel === 'bronze' && user.kyc?.status === 'approved') {
      newLevel = 'silver'
    }

    // Check gold: at least 1 gold purchase
    if (newLevel === 'silver' && user.transactions.length >= 1) {
      newLevel = 'gold'
    }

    // Check diamond: activity + balance thresholds
    if (newLevel === 'gold') {
      const txFiat = user.wallet?.balance ?? 0
      const txGold = user.goldWallet?.goldGrams ?? 0
      const txCount = user.transactions.length
      if (txCount >= 10 && txFiat >= 100000000 && txGold >= 1.0) {
        newLevel = 'diamond'
      }
    }

    // If level changed, update database
    if (newLevel !== currentLevel) {
      await db.user.update({
        where: { id: userId },
        data: {
          userLevel: newLevel,
          levelUpgradedAt: new Date(),
        },
      })

      // Create notification
      const newLevelInfo = LEVELS[newLevel]
      await db.notification.create({
        data: {
          userId,
          title: `تبریک! شما به سطح ${newLevelInfo.labelFa} رسیدید! 🎉`,
          body: `${newLevelInfo.icon} سطح شما از ${LEVELS[currentLevel].labelFa} به ${newLevelInfo.labelFa} ارتقا یافت. امکانات جدید فعال شد!`,
          type: 'level_up',
        },
      })

      return NextResponse.json({
        success: true,
        upgraded: true,
        previousLevel: currentLevel,
        newLevel,
        levelInfo: LEVELS[newLevel],
        message: `تبریک! به سطح ${newLevelInfo.labelFa} رسیدید!`,
      })
    }

    return NextResponse.json({
      success: true,
      upgraded: false,
      currentLevel: newLevel,
      levelInfo: LEVELS[newLevel],
    })
  } catch (error) {
    console.error('Level POST error:', error)
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 })
  }
}

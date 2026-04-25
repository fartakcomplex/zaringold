import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserAccess } from '@/lib/access'
import crypto from 'crypto'

// POST: contribute fiat to a saving goal (buys gold)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId, amountFiat } = await request.json()

    if (!userId || !amountFiat || amountFiat <= 0) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و مبلغ واریز الزامی است' },
        { status: 400 }
      )
    }

    const goal = await db.savingGoal.findUnique({ where: { id } })
    if (!goal) {
      return NextResponse.json(
        { success: false, message: 'هدف پس‌انداز یافت نشد' },
        { status: 404 }
      )
    }

    if (goal.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'هدف پس‌انداز فعال نیست' },
        { status: 400 }
      )
    }

    // Check fiat balance
    const wallet = await db.wallet.findUnique({ where: { userId } })
    if (!wallet || wallet.balance < amountFiat) {
      return NextResponse.json(
        { success: false, message: 'موجودی واحد طلایی کافی نیست' },
        { status: 400 }
      )
    }

    // Get latest gold price
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    if (!latestPrice) {
      return NextResponse.json(
        { success: false, message: 'قیمت طلا در دسترس نیست' },
        { status: 400 }
      )
    }

    const buyPrice = latestPrice.buyPrice
    const access = await getUserAccess(userId)
    const feeRate = access.buyFeeRate
    const fee = amountFiat * feeRate
    const netAmount = amountFiat - fee
    const grams = netAmount / buyPrice

    if (grams <= 0) {
      return NextResponse.json(
        { success: false, message: 'مبلغ برای خرید طلا کافی نیست' },
        { status: 400 }
      )
    }

    // Deduct fiat
    await db.wallet.update({
      where: { userId },
      data: { balance: { decrement: amountFiat } },
    })

    // Add gold to user's gold wallet
    const goldWallet = await db.goldWallet.upsert({
      where: { userId },
      update: { goldGrams: { increment: grams } },
      create: { userId, goldGrams: grams },
    })

    // Update goal progress
    const newCurrentGrams = Number((goal.currentGrams + grams).toFixed(6))
    const newCurrentAmountFiat = Number((goal.currentAmountFiat + amountFiat).toFixed(0))
    const progressPercent = goal.targetGrams > 0
      ? Math.min(100, Number(((newCurrentGrams / goal.targetGrams) * 100).toFixed(1)))
      : 0

    const updatedGoal = await db.savingGoal.update({
      where: { id },
      data: {
        currentGrams: newCurrentGrams,
        currentAmountFiat: newCurrentAmountFiat,
        monthlyContribution: Number((goal.monthlyContribution + amountFiat).toFixed(0)),
        status: newCurrentGrams >= goal.targetGrams ? 'completed' : 'active',
      },
    })

    // Create transaction record
    await db.transaction.create({
      data: {
        userId,
        type: 'goal_contribute',
        amountFiat,
        amountGold: grams,
        fee,
        goldPrice: buyPrice,
        status: 'completed',
        referenceId: crypto.randomUUID(),
        description: `واریز به هدف پس‌انداز «${goal.title}» — ${grams.toFixed(6)} گرم طلا`,
      },
    })

    return NextResponse.json({
      success: true,
      message: newCurrentGrams >= goal.targetGrams
        ? `تبریک! هدف پس‌انداز «${goal.title}» تکمیل شد! 🎉`
        : `واریز ${grams.toFixed(6)} گرم طلا به هدف پس‌انداز «${goal.title}»`,
      goal: updatedGoal,
      gramsAdded: Number(grams.toFixed(6)),
      fee: Number(fee.toFixed(0)),
      progressPercent,
      newGoldBalance: Number(goldWallet.goldGrams.toFixed(6)),
    })
  } catch (error) {
    console.error('Contribute to goal error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در واریز به هدف پس‌انداز' },
      { status: 500 }
    )
  }
}

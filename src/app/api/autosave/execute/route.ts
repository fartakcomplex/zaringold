import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserAccess } from '@/lib/access'
import crypto from 'crypto'

// POST: Execute an auto buy plan manually (for testing)
export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json()

    if (!planId) {
      return NextResponse.json(
        { success: false, message: 'شناسه طرح الزامی است' },
        { status: 400 }
      )
    }

    const plan = await db.autoBuyPlan.findUnique({ where: { id: planId } })
    if (!plan) {
      return NextResponse.json(
        { success: false, message: 'طرح خرید خودکار یافت نشد' },
        { status: 404 }
      )
    }

    if (!plan.isActive) {
      return NextResponse.json(
        { success: false, message: 'این طرح غیرفعال است' },
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
    const access = await getUserAccess(plan.userId)
    const feeRate = access.buyFeeRate
    const fee = plan.amountFiat * feeRate
    const netAmount = plan.amountFiat - fee
    const grams = netAmount / buyPrice

    if (grams <= 0) {
      return NextResponse.json(
        { success: false, message: 'مبلغ برای خرید طلا کافی نیست' },
        { status: 400 }
      )
    }

    // Check fiat balance
    const wallet = await db.wallet.findUnique({ where: { userId: plan.userId } })
    if (!wallet || wallet.balance < plan.amountFiat) {
      await db.autoBuyPlan.update({
        where: { id: planId },
        data: { failedCount: { increment: 1 } },
      })
      return NextResponse.json(
        { success: false, message: 'موجودی واحد طلایی کافی نیست' },
        { status: 400 }
      )
    }

    // Deduct fiat
    await db.wallet.update({
      where: { userId: plan.userId },
      data: { balance: { decrement: plan.amountFiat } },
    })

    // Add gold
    const goldWallet = await db.goldWallet.upsert({
      where: { userId: plan.userId },
      update: { goldGrams: { increment: grams } },
      create: { userId: plan.userId, goldGrams: grams },
    })

    // Create transaction record
    await db.transaction.create({
      data: {
        userId: plan.userId,
        type: 'auto_buy',
        amountFiat: plan.amountFiat,
        amountGold: grams,
        fee,
        goldPrice: buyPrice,
        status: 'completed',
        referenceId: crypto.randomUUID(),
        description: `خرید خودکار ${grams.toFixed(6)} گرم طلا`,
      },
    })

    // Update plan stats
    const now = new Date()
    let nextExecuteAt: Date | null = null
    if (plan.frequency === 'daily') {
      nextExecuteAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    } else if (plan.frequency === 'weekly') {
      nextExecuteAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    } else {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, plan.dayOfMonth)
      nextExecuteAt = nextMonth
    }

    const updatedPlan = await db.autoBuyPlan.update({
      where: { id: planId },
      data: {
        lastExecutedAt: now,
        nextExecuteAt,
        totalExecutions: { increment: 1 },
        totalSpent: { increment: plan.amountFiat },
        totalGoldBought: { increment: grams },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'خرید خودکار با موفقیت انجام شد',
      grams: Number(grams.toFixed(6)),
      fee: Number(fee.toFixed(0)),
      plan: updatedPlan,
      newGoldBalance: Number(goldWallet.goldGrams.toFixed(6)),
    })
  } catch (error) {
    console.error('Execute auto buy plan error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اجرای طرح خرید خودکار' },
      { status: 500 }
    )
  }
}

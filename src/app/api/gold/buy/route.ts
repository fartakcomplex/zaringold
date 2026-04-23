import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserAccess } from '@/lib/access'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { userId, amountFiat } = await request.json()

    if (!userId || !amountFiat || amountFiat <= 0) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و مبلغ الزامی است' },
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
    const totalPaid = amountFiat
    const netAmount = amountFiat - fee
    const grams = netAmount / buyPrice

    if (grams <= 0) {
      return NextResponse.json(
        { success: false, message: 'مبلغ برای خرید طلا کافی نیست' },
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

    // Deduct fiat
    await db.wallet.update({
      where: { userId },
      data: { balance: { decrement: amountFiat } },
    })

    // Add gold
    const goldWallet = await db.goldWallet.upsert({
      where: { userId },
      update: { goldGrams: { increment: grams } },
      create: { userId, goldGrams: grams },
    })

    // Create transaction record
    await db.transaction.create({
      data: {
        userId,
        type: 'gold_buy',
        amountFiat: totalPaid,
        amountGold: grams,
        fee,
        goldPrice: buyPrice,
        status: 'completed',
        referenceId: crypto.randomUUID(),
        description: `خرید ${grams.toFixed(6)} گرم طلا`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'خرید طلا با موفقیت انجام شد',
      grams: Number(grams.toFixed(6)),
      fee: Number(fee.toFixed(0)),
      totalPaid,
      newGoldBalance: Number(goldWallet.goldGrams.toFixed(6)),
    })
  } catch (error) {
    console.error('Buy gold error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در خرید طلا' },
      { status: 500 }
    )
  }
}

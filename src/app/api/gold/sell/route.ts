import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserAccess } from '@/lib/access'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { userId, goldGrams } = await request.json()

    if (!userId || !goldGrams || goldGrams <= 0) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و مقدار طلا الزامی است' },
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

    const sellPrice = latestPrice.sellPrice
    const access = await getUserAccess(userId)
    const feeRate = access.sellFeeRate
    const fiatAmount = goldGrams * sellPrice
    const fee = fiatAmount * feeRate
    const netAmount = fiatAmount - fee

    // Check gold balance
    const goldWallet = await db.goldWallet.findUnique({ where: { userId } })
    if (!goldWallet || goldWallet.goldGrams < goldGrams) {
      return NextResponse.json(
        { success: false, message: 'موجودی طلای کافی نیست' },
        { status: 400 }
      )
    }

    // Deduct gold
    await db.goldWallet.update({
      where: { userId },
      data: { goldGrams: { decrement: goldGrams } },
    })

    // Add fiat
    const wallet = await db.wallet.upsert({
      where: { userId },
      update: { balance: { increment: netAmount } },
      create: { userId, balance: netAmount },
    })

    // Create transaction record
    await db.transaction.create({
      data: {
        userId,
        type: 'gold_sell',
        amountFiat: netAmount,
        amountGold: goldGrams,
        fee,
        goldPrice: sellPrice,
        status: 'completed',
        referenceId: crypto.randomUUID(),
        description: `فروش ${goldGrams.toFixed(6)} گرم طلا`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'فروش طلا با موفقیت انجام شد',
      fiatAmount: Number(fiatAmount.toFixed(0)),
      fee: Number(fee.toFixed(0)),
      netAmount: Number(netAmount.toFixed(0)),
      newFiatBalance: Number(wallet.balance.toFixed(0)),
    })
  } catch (error) {
    console.error('Sell gold error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در فروش طلا' },
      { status: 500 }
    )
  }
}

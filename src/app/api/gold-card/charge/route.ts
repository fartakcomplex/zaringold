import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/gold-card/charge
 * Body: { userId, goldGrams }
 * Charges card balance by converting gold grams to fiat
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, goldGrams } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    if (!goldGrams || goldGrams <= 0) {
      return NextResponse.json(
        { success: false, message: 'مقدار طلا باید بیشتر از صفر باشد' },
        { status: 400 }
      )
    }

    // Get card
    const card = await db.goldCard.findUnique({
      where: { userId },
    })

    if (!card) {
      return NextResponse.json(
        { success: false, message: 'کارت طلایی یافت نشد' },
        { status: 404 }
      )
    }

    if (card.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'کارت فعال نیست. لطفاً ابتدا کارت را فعال کنید.' },
        { status: 400 }
      )
    }

    // Get latest gold price
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    if (!latestPrice) {
      return NextResponse.json(
        { success: false, message: 'قیمت طلا در دسترس نیست. لطفاً بعداً تلاش کنید.' },
        { status: 400 }
      )
    }

    // Calculate fiat amount from gold grams
    const fiatAmount = goldGrams * latestPrice.buyPrice

    // Check user gold wallet balance
    const goldWallet = await db.goldWallet.findUnique({
      where: { userId },
    })

    if (!goldWallet || goldWallet.goldGrams < goldGrams) {
      return NextResponse.json(
        { success: false, message: 'موجودی کیف پول طلای شما کافی نیست' },
        { status: 400 }
      )
    }

    // Deduct gold from user wallet
    await db.goldWallet.update({
      where: { userId },
      data: { goldGrams: { decrement: goldGrams } },
    })

    // Add fiat to card balance and linked gold grams
    const updatedCard = await db.goldCard.update({
      where: { userId },
      data: {
        balanceFiat: { increment: fiatAmount },
        linkedGoldGram: { increment: goldGrams },
      },
    })

    // Create transaction record
    await db.goldCardTransaction.create({
      data: {
        cardId: card.id,
        userId,
        type: 'charge',
        amount: fiatAmount,
        goldGrams,
        description: `شارژ کارت از کیف پول طلا - ${goldGrams.toFixed(4)} گرم`,
        status: 'completed',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'کارت با موفقیت شارژ شد',
      chargedFiat: Number(fiatAmount.toFixed(0)),
      chargedGold: Number(goldGrams.toFixed(6)),
      newBalance: Number(updatedCard.balanceFiat.toFixed(0)),
      linkedGoldGram: Number(updatedCard.linkedGoldGram.toFixed(6)),
    })
  } catch (error) {
    console.error('Charge gold card error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در شارژ کارت' },
      { status: 500 }
    )
  }
}

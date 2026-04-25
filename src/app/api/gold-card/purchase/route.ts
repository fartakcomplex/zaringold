import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/gold-card/purchase
 * Body: { userId, amount, merchant, description }
 * Simulates a purchase with balance, limit, and status checks
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, amount, merchant, description } = await request.json()

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و مبلغ خرید الزامی است' },
        { status: 400 }
      )
    }

    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'نام فروشنده الزامی است' },
        { status: 400 }
      )
    }

    const card = await db.goldCard.findUnique({
      where: { userId },
    })

    if (!card) {
      return NextResponse.json(
        { success: false, message: 'کارت طلایی یافت نشد' },
        { status: 404 }
      )
    }

    // Check card status
    if (card.status !== 'active') {
      const statusMessages: Record<string, string> = {
        frozen: 'کارت مسدود موقت است و امکان خرید وجود ندارد',
        blocked: 'کارت مسدود شده و امکان خرید وجود ندارد',
        expired: 'کارت منقضی شده است',
      }
      return NextResponse.json(
        {
          success: false,
          message: statusMessages[card.status] || 'کارت فعال نیست',
        },
        { status: 400 }
      )
    }

    // Check sufficient balance
    const availableBalance = card.balanceFiat - card.spentToday
    if (availableBalance < amount) {
      return NextResponse.json(
        {
          success: false,
          message: 'موجودی کافی نیست',
          availableBalance: Number(availableBalance.toFixed(0)),
          requiredAmount: amount,
        },
        { status: 400 }
      )
    }

    // Check daily limit
    if (card.spentToday + amount > card.dailyLimit) {
      return NextResponse.json(
        {
          success: false,
          message: 'سقف خرید روزانه تکمیل شده است',
          spentToday: Number(card.spentToday.toFixed(0)),
          dailyLimit: Number(card.dailyLimit.toFixed(0)),
        },
        { status: 400 }
      )
    }

    // Check monthly limit
    if (card.spentThisMonth + amount > card.monthlyLimit) {
      return NextResponse.json(
        {
          success: false,
          message: 'سقف خرید ماهانه تکمیل شده است',
          spentThisMonth: Number(card.spentThisMonth.toFixed(0)),
          monthlyLimit: Number(card.monthlyLimit.toFixed(0)),
        },
        { status: 400 }
      )
    }

    // Deduct from balance and update spending counters
    const updatedCard = await db.goldCard.update({
      where: { userId },
      data: {
        balanceFiat: { decrement: amount },
        spentToday: { increment: amount },
        spentThisMonth: { increment: amount },
        lastUsedAt: new Date(),
      },
    })

    // Create transaction record
    const transaction = await db.goldCardTransaction.create({
      data: {
        cardId: card.id,
        userId,
        type: 'purchase',
        amount,
        goldGrams: 0,
        description: description || `خرید از ${merchant}`,
        merchant,
        status: 'completed',
      },
    })

    const remainingBalance = Math.max(0, updatedCard.balanceFiat - updatedCard.spentToday)
    const remainingDaily = Math.max(0, card.dailyLimit - updatedCard.spentToday)
    const remainingMonthly = Math.max(0, card.monthlyLimit - updatedCard.spentThisMonth)

    return NextResponse.json({
      success: true,
      message: 'خرید با موفقیت انجام شد',
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        merchant: transaction.merchant,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
      remainingBalance: Number(remainingBalance.toFixed(0)),
      remainingDaily: Number(remainingDaily.toFixed(0)),
      remainingMonthly: Number(remainingMonthly.toFixed(0)),
    })
  } catch (error) {
    console.error('Purchase error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در انجام خرید' },
      { status: 500 }
    )
  }
}

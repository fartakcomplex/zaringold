import { NextRequest, NextResponse } from 'next/server'
import { getLatestGoldPrice } from '@/lib/gold-prices'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    // Fetch micro-gold round-up profile and transactions in parallel
    const [roundUp, transactions, goldWallet] = await Promise.all([
      db.microGoldRoundUp.findUnique({ where: { userId } }),
      db.microGoldTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.goldWallet.findUnique({ where: { userId } }),
    ])

    return NextResponse.json({
      success: true,
      roundUp: roundUp
        ? {
            totalRounded: roundUp.totalRounded,
            totalGoldBought: parseFloat(roundUp.totalGoldBought.toFixed(4)),
            totalRoundUps: roundUp.totalRoundUps,
            isActive: roundUp.isActive,
          }
        : null,
      transactions,
      goldBalance: goldWallet ? parseFloat(goldWallet.goldGrams.toFixed(4)) : 0,
    })
  } catch (error) {
    console.error('Get micro-gold stats error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات خرید خرد طلا' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount } = body

    if (!userId || !amount) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و مبلغ الزامی است' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'مبلغ باید بیشتر از صفر باشد' },
        { status: 400 }
      )
    }

    if (amount > 10000000) {
      return NextResponse.json(
        { success: false, message: 'حداکثر مبلغ خرید خرد ۱۰ میلیون تومان است' },
        { status: 400 }
      )
    }

    // Get current gold price
    const latestPrice = await getLatestGoldPrice()

    const goldPrice = latestPrice.buyPrice // Use buy price for purchases

    // Calculate gold grams (amount in toman / price per gram)
    const goldGrams = amount / goldPrice

    if (goldGrams < 0.0001) {
      return NextResponse.json(
        { success: false, message: 'مبلغ وارد شده برای خرید طلا بسیار کم است' },
        { status: 400 }
      )
    }

    // Get or create micro-gold round-up profile
    let roundUp = await db.microGoldRoundUp.findUnique({ where: { userId } })

    if (!roundUp) {
      roundUp = await db.microGoldRoundUp.create({
        data: {
          userId,
        },
      })
    }

    // Create the micro-gold transaction
    await db.microGoldTransaction.create({
      data: {
        userId,
        roundUpId: roundUp.id,
        sourceAmount: amount,
        roundedAmount: amount,
        goldGrams,
        goldPrice,
        description: 'خرید خرد طلا',
      },
    })

    // Update the round-up profile
    await db.microGoldRoundUp.update({
      where: { id: roundUp.id },
      data: {
        totalRounded: { increment: amount },
        totalGoldBought: { increment: goldGrams },
        totalRoundUps: { increment: 1 },
      },
    })

    // Add gold to user's gold wallet
    const goldWallet = await db.goldWallet.findUnique({ where: { userId } })

    if (goldWallet) {
      await db.goldWallet.update({
        where: { userId },
        data: {
          goldGrams: { increment: goldGrams },
        },
      })
    } else {
      await db.goldWallet.create({
        data: {
          userId,
          goldGrams,
        },
      })
    }

    const newBalance = goldWallet
      ? parseFloat((goldWallet.goldGrams + goldGrams).toFixed(4))
      : parseFloat(goldGrams.toFixed(4))

    return NextResponse.json({
      success: true,
      goldGrams: parseFloat(goldGrams.toFixed(4)),
      newBalance,
      goldPrice,
    })
  } catch (error) {
    console.error('Micro-gold purchase error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در خرید خرد طلا' },
      { status: 500 }
    )
  }
}

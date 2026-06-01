import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const openOrders = await db.p2POrder.findMany({
      where: { status: 'open' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            userLevel: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      orders: openOrders,
    })
  } catch (error) {
    console.error('Get P2P orders error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت سفارش‌های P2P' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, goldGrams, pricePerGram, minAmount, maxAmount, paymentMethod, iban } = body

    if (!userId || !type || !goldGrams || !pricePerGram) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر، نوع سفارش، مقدار طلا و قیمت هر گرم الزامی است' },
        { status: 400 }
      )
    }

    if (!['buy', 'sell'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'نوع سفارش باید buy یا sell باشد' },
        { status: 400 }
      )
    }

    if (goldGrams <= 0.01) {
      return NextResponse.json(
        { success: false, message: 'حداقل مقدار طلا ۰.۰۱ گرم است' },
        { status: 400 }
      )
    }

    if (pricePerGram <= 0) {
      return NextResponse.json(
        { success: false, message: 'قیمت هر گرم باید بیشتر از صفر باشد' },
        { status: 400 }
      )
    }

    // For sell orders, check user has enough gold
    if (type === 'sell') {
      const goldWallet = await db.goldWallet.findUnique({ where: { userId } })

      if (!goldWallet || goldWallet.goldGrams < goldGrams) {
        const available = goldWallet ? goldWallet.goldGrams : 0
        return NextResponse.json(
          {
            success: false,
            message: `موجودی طلا کافی نیست. موجودی فعلی: ${available.toFixed(4)} گرم`,
          },
          { status: 400 }
        )
      }
    }

    // Order expires in 24 hours
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    // Create the P2P order
    const order = await db.p2POrder.create({
      data: {
        userId,
        type,
        goldGrams,
        pricePerGram,
        minAmount: minAmount ?? 0,
        maxAmount: maxAmount ?? 0,
        paymentMethod: paymentMethod || 'wallet',
        iban: iban || null,
        expiresAt,
        status: 'open',
      },
    })

    return NextResponse.json({
      success: true,
      order,
      message: `سفارش P2P ${type === 'buy' ? 'خرید' : 'فروش'} ${goldGrams.toFixed(4)} گرم با قیمت ${pricePerGram.toLocaleString()} تومان/گرم ثبت شد`,
    })
  } catch (error) {
    console.error('Create P2P order error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت سفارش P2P' },
      { status: 500 }
    )
  }
}

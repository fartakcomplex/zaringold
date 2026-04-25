import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/auto-trade/orders — List user's auto trade orders
 * POST /api/auto-trade/orders — Create new auto trade order
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { userId }
    if (status) where.status = status

    const skip = (page - 1) * limit

    const [orders, total] = await Promise.all([
      db.autoTradeOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.autoTradeOrder.count({ where }),
    ])

    // Get current price for reference
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })
    const currentPrice = latestPrice?.marketPrice || 0

    return NextResponse.json({
      success: true,
      data: {
        orders: orders.map((order) => ({
          ...order,
          currentPrice,
          distanceToTarget: order.orderType === 'buy'
            ? Number((((order.targetPrice - currentPrice) / currentPrice) * 100).toFixed(2))
            : Number((((currentPrice - order.targetPrice) / currentPrice) * 100).toFixed(2)),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        currentPrice,
      },
    })
  } catch (error) {
    console.error('[AutoTrade/Orders GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست سفارشات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      orderType,
      targetPrice,
      stopLoss,
      takeProfit,
      amountGrams,
      amountFiat,
    } = await request.json()

    // Validation
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    if (!orderType || !['buy', 'sell'].includes(orderType)) {
      return NextResponse.json(
        { success: false, error: 'نوع سفارش باید خرید یا فروش باشد' },
        { status: 400 }
      )
    }

    if (!targetPrice || targetPrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'قیمت هدف الزامی و باید بیشتر از صفر باشد' },
        { status: 400 }
      )
    }

    if (!amountFiat && !amountGrams) {
      return NextResponse.json(
        { success: false, error: 'مقدار واحد طلایی یا گرمی الزامی است' },
        { status: 400 }
      )
    }

    if (stopLoss && stopLoss <= 0) {
      return NextResponse.json(
        { success: false, error: 'حد ضرر باید بیشتر از صفر باشد' },
        { status: 400 }
      )
    }

    if (takeProfit && takeProfit <= 0) {
      return NextResponse.json(
        { success: false, error: 'حد سود باید بیشتر از صفر باشد' },
        { status: 400 }
      )
    }

    // Get current price
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })
    const currentPrice = latestPrice?.marketPrice || 0

    // Calculate amounts
    const resolvedAmountFiat = amountFiat || (amountGrams ? amountGrams * targetPrice : 0)
    const resolvedAmountGrams = amountGrams || (amountFiat ? amountFiat / targetPrice : 0)

    if (resolvedAmountFiat <= 0 || resolvedAmountGrams <= 0) {
      return NextResponse.json(
        { success: false, error: 'مبلغ یا مقدار طلا باید بیشتر از صفر باشد' },
        { status: 400 }
      )
    }

    // Check balance
    if (orderType === 'buy') {
      const wallet = await db.wallet.findUnique({ where: { userId } })
      if (!wallet || wallet.balance < resolvedAmountFiat) {
        return NextResponse.json(
          { success: false, error: 'موجودی واحد طلایی کافی نیست' },
          { status: 400 }
        )
      }
    } else {
      const goldWallet = await db.goldWallet.findUnique({ where: { userId } })
      if (!goldWallet || goldWallet.goldGrams < resolvedAmountGrams) {
        return NextResponse.json(
          { success: false, error: 'موجودی طلای کافی نیست' },
          { status: 400 }
        )
      }
    }

    // Prevent conflicting orders (buy and sell at same price for same user)
    const conflictingOrders = await db.autoTradeOrder.findMany({
      where: {
        userId,
        targetPrice,
        orderType: orderType === 'buy' ? 'sell' : 'buy',
        status: { in: ['pending_confirmation', 'active'] },
      },
    })

    if (conflictingOrders.length > 0) {
      return NextResponse.json(
        { success: false, error: 'سفارش معارض در این قیمت وجود دارد' },
        { status: 400 }
      )
    }

    // Freeze balance
    if (orderType === 'buy') {
      await db.wallet.update({
        where: { userId },
        data: { frozenBalance: { increment: resolvedAmountFiat } },
      })
    } else {
      await db.goldWallet.update({
        where: { userId },
        data: { frozenGold: { increment: resolvedAmountGrams } },
      })
    }

    // Create order
    const order = await db.autoTradeOrder.create({
      data: {
        userId,
        orderType,
        targetPrice,
        stopLoss: stopLoss || null,
        takeProfit: takeProfit || null,
        amountGrams: Number(resolvedAmountGrams.toFixed(6)),
        amountFiat: Math.round(resolvedAmountFiat),
        status: 'pending_confirmation',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        order: {
          ...order,
          currentPrice,
        },
        message: 'سفارش با موفقیت ایجاد شد. لطفاً آن را تأیید کنید.',
      },
    })
  } catch (error) {
    console.error('[AutoTrade/Orders POST] Error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد سفارش معامله خودکار' },
      { status: 500 }
    )
  }
}

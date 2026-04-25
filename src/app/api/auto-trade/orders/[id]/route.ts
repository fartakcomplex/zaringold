import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/auto-trade/orders/[id] — Get single order details
 * PUT /api/auto-trade/orders/[id] — Update order (cancel, modify)
 * DELETE /api/auto-trade/orders/[id] — Cancel order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const order = await db.autoTradeOrder.findUnique({
      where: { id },
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'سفارش یافت نشد' },
        { status: 404 }
      )
    }

    if (order.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'شما دسترسی به این سفارش را ندارید' },
        { status: 403 }
      )
    }

    // Get current price
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })
    const currentPrice = latestPrice?.marketPrice || 0

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        currentPrice,
        distanceToTarget: order.orderType === 'buy'
          ? Number((((order.targetPrice - currentPrice) / currentPrice) * 100).toFixed(2))
          : Number((((currentPrice - order.targetPrice) / currentPrice) * 100).toFixed(2)),
      },
    })
  } catch (error) {
    console.error('[AutoTrade/Orders/[id] GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اطلاعات سفارش' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, action, targetPrice, stopLoss, takeProfit } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const order = await db.autoTradeOrder.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'سفارش یافت نشد' },
        { status: 404 }
      )
    }

    if (order.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'شما دسترسی به این سفارش را ندارید' },
        { status: 403 }
      )
    }

    // Cancel order
    if (action === 'cancel') {
      if (!['pending_confirmation', 'active'].includes(order.status)) {
        return NextResponse.json(
          { success: false, error: 'فقط سفارش‌های در انتظار یا فعال قابل لغو هستند' },
          { status: 400 }
        )
      }

      // Unfreeze balance
      if (order.orderType === 'buy') {
        await db.wallet.update({
          where: { userId },
          data: { frozenBalance: { decrement: order.amountFiat } },
        })
      } else {
        await db.goldWallet.update({
          where: { userId },
          data: { frozenGold: { decrement: order.amountGrams } },
        })
      }

      const updated = await db.autoTradeOrder.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancelReason: 'لغو توسط کاربر',
        },
      })

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'سفارش با موفقیت لغو شد',
      })
    }

    // Modify order (only pending_confirmation orders)
    if (action === 'modify') {
      if (order.status !== 'pending_confirmation') {
        return NextResponse.json(
          { success: false, error: 'فقط سفارش‌های در انتظار تأیید قابل ویرایش هستند' },
          { status: 400 }
        )
      }

      const updateData: Record<string, unknown> = {}
      if (targetPrice && targetPrice > 0) updateData.targetPrice = targetPrice
      if (stopLoss !== undefined) updateData.stopLoss = stopLoss > 0 ? stopLoss : null
      if (takeProfit !== undefined) updateData.takeProfit = takeProfit > 0 ? takeProfit : null

      // Recalculate amounts if target price changed
      if (targetPrice && targetPrice !== order.targetPrice) {
        updateData.amountGrams = order.orderType === 'buy'
          ? Number((order.amountFiat / targetPrice).toFixed(6))
          : order.amountGrams
        updateData.amountFiat = order.orderType === 'sell'
          ? Math.round(order.amountGrams * targetPrice)
          : order.amountFiat
      }

      const updated = await db.autoTradeOrder.update({
        where: { id },
        data: updateData,
      })

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'سفارش با موفقیت ویرایش شد',
      })
    }

    return NextResponse.json(
      { success: false, error: 'عملیات نامعتبر' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[AutoTrade/Orders/[id] PUT] Error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بروزرسانی سفارش' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const order = await db.autoTradeOrder.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'سفارش یافت نشد' },
        { status: 404 }
      )
    }

    if (order.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'شما دسترسی به این سفارش را ندارید' },
        { status: 403 }
      )
    }

    if (!['pending_confirmation', 'active'].includes(order.status)) {
      return NextResponse.json(
        { success: false, error: 'فقط سفارش‌های قابل لغو قابل حذف هستند' },
        { status: 400 }
      )
    }

    // Unfreeze balance
    if (order.orderType === 'buy') {
      await db.wallet.update({
        where: { userId },
        data: { frozenBalance: { decrement: order.amountFiat } },
      })
    } else {
      await db.goldWallet.update({
        where: { userId },
        data: { frozenGold: { decrement: order.amountGrams } },
      })
    }

    await db.autoTradeOrder.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelReason: 'حذف توسط کاربر',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'سفارش با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('[AutoTrade/Orders/[id] DELETE] Error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در حذف سفارش' },
      { status: 500 }
    )
  }
}

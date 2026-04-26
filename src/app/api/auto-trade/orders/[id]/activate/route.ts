import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/auto-trade/orders/[id]/activate — Activate a pending order
 * Simulates 2FA confirmation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await request.json()

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

    if (order.status !== 'pending_confirmation') {
      return NextResponse.json(
        { success: false, error: `سفارش در وضعیت "${order.status}" قابل تأیید نیست. فقط سفارش‌های در انتظار تأیید قابل فعال‌سازی هستند.` },
        { status: 400 }
      )
    }

    // Check if order has expired
    if (order.expiresAt && order.expiresAt < new Date()) {
      // Unfreeze balance before expiring
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
          status: 'expired',
          cancelReason: 'مهلت سفارش به پایان رسیده بود',
        },
      })

      return NextResponse.json(
        { success: false, error: 'مهلت سفارش منقضی شده است' },
        { status: 400 }
      )
    }

    // Activate order (simulates 2FA confirmation)
    const updated = await db.autoTradeOrder.update({
      where: { id },
      data: {
        status: 'active',
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'سفارش با موفقیت فعال شد و در انتظار اجراست',
    })
  } catch (error) {
    console.error('[AutoTrade/Orders/[id]/activate POST] Error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در فعال‌سازی سفارش' },
      { status: 500 }
    )
  }
}

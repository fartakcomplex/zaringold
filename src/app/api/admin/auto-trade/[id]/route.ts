import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ------------------------------------------------------------------ */
/*  PUT /api/admin/auto-trade/[id] — Cancel or update order status    */
/* ------------------------------------------------------------------ */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, cancelReason } = body

    if (!status || !['pending_confirmation', 'active', 'executed', 'cancelled', 'expired'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'وضعیت نامعتبر' },
        { status: 400 }
      )
    }

    const existing = await db.autoTradeOrder.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'سفارش پیدا نشد' },
        { status: 404 }
      )
    }

    // Don't allow modifying already executed orders
    if (existing.status === 'executed') {
      return NextResponse.json(
        { success: false, message: 'سفارش اجرا شده قابل تغییر نیست' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = { status }

    if (status === 'cancelled') {
      updateData.cancelReason = cancelReason || 'لغو توسط ادمین'
    }

    if (status === 'executed') {
      updateData.executedAt = new Date()
    }

    if (status === 'cancelled' || status === 'expired') {
      updateData.triggeredAt = new Date()
    }

    const order = await db.autoTradeOrder.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            fullName: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: order,
      message: `وضعیت سفارش به "${status === 'cancelled' ? 'لغو شده' : status === 'executed' ? 'اجرا شده' : status === 'active' ? 'فعال' : status === 'expired' ? 'منقضی' : 'در انتظار تایید'}" تغییر کرد`,
    })
  } catch (error) {
    console.error('Admin update auto-trade error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی سفارش' },
      { status: 500 }
    )
  }
}

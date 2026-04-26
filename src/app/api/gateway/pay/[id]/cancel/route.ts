import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/gateway/pay/[id]/cancel
 * User cancels payment
 * - Update ExternalPayment status to "cancelled"
 * - Unfreeze any frozen gold
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentId } = await params
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    // Find payment
    const payment = await db.externalPayment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'پرداخت یافت نشد' },
        { status: 404 }
      )
    }

    // Verify payment belongs to user
    if (payment.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'این پرداخت متعلق به شما نیست' },
        { status: 403 }
      )
    }

    // Check payment status — only pending can be cancelled
    if (payment.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: `فقط پرداخت‌های در انتظار قابل لغو هستند. وضعیت فعلی: ${payment.status}` },
        { status: 400 }
      )
    }

    // Check if expired
    if (payment.expiresAt < new Date()) {
      await db.externalPayment.update({
        where: { id: paymentId },
        data: { status: 'expired' },
      })
      return NextResponse.json(
        { success: false, message: 'مهلت پرداخت منقضی شده است و لغو آن ممکن نیست' },
        { status: 400 }
      )
    }

    // Update payment status to cancelled
    const now = new Date()
    await db.externalPayment.update({
      where: { id: paymentId },
      data: {
        status: 'cancelled',
        cancelledAt: now,
      },
    })

    // Note: In this implementation we don't freeze gold at create time,
    // so there's no frozen gold to unfreeze. Gold is deducted at execute time.
    // If a freeze mechanism is added later, unfreezing should happen here.

    return NextResponse.json({
      success: true,
      message: 'پرداخت با موفقیت لغو شد',
      payment: {
        id: payment.id,
        status: 'cancelled',
        cancelledAt: now,
      },
    })
  } catch (error) {
    console.error('Payment cancel error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در لغو پرداخت' },
      { status: 500 }
    )
  }
}

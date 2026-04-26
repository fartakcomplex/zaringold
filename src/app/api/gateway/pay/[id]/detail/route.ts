import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/gateway/pay/[id]/detail
 * Get payment details for user (authenticated)
 * Check that payment belongs to user or is accessible
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentId } = await params
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    // Find payment
    const payment = await db.externalPayment.findUnique({
      where: { id: paymentId },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
            website: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'پرداخت یافت نشد' },
        { status: 404 }
      )
    }

    // Only the payment's user or admin can view details
    const requestingUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!requestingUser) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    const isAdmin = ['admin', 'super_admin'].includes(requestingUser.role)
    if (!isAdmin && payment.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'شما دسترسی به این پرداخت ندارید' },
        { status: 403 }
      )
    }

    // Check if expired
    let currentStatus = payment.status
    if (payment.status === 'pending' && payment.expiresAt < new Date()) {
      await db.externalPayment.update({
        where: { id: paymentId },
        data: { status: 'expired' },
      })
      currentStatus = 'expired'
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        merchantId: payment.merchantId,
        merchant: payment.merchant,
        amountGrams: payment.amountGrams,
        amountFiat: payment.amountFiat,
        feeGrams: payment.feeGrams,
        goldPrice: payment.goldPrice,
        description: payment.description,
        merchantOrderId: payment.merchantOrderId,
        status: currentStatus,
        callbackSent: payment.callbackSent,
        expiresAt: payment.expiresAt,
        paidAt: payment.paidAt,
        cancelledAt: payment.cancelledAt,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
    })
  } catch (error) {
    console.error('Payment detail error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت جزئیات پرداخت' },
      { status: 500 }
    )
  }
}

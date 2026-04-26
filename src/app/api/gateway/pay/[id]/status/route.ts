import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateMerchant } from '@/lib/gateway-helpers'

/**
 * GET /api/gateway/pay/[id]/status
 * Check payment status (external — merchant verifies)
 * Auth via apiKey header + apiSecret query param
 * Returns full payment details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = request.nextUrl
    const apiSecret = searchParams.get('apiSecret') || searchParams.get('secret')

    // Authenticate merchant
    const { merchant, error } = await authenticateMerchant(request, apiSecret || undefined)
    if (error) return error

    const merchantData = merchant as { id: string }

    // Find payment
    const payment = await db.externalPayment.findUnique({
      where: { id },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
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

    // Only the merchant who created this payment can check status
    if (payment.merchantId !== merchantData.id) {
      return NextResponse.json(
        { success: false, message: 'شما دسترسی به این پرداخت ندارید' },
        { status: 403 }
      )
    }

    // Check if expired
    if (payment.status === 'pending' && payment.expiresAt < new Date()) {
      await db.externalPayment.update({
        where: { id },
        data: { status: 'expired' },
      })
      payment.status = 'expired'
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        merchantOrderId: payment.merchantOrderId,
        amountGrams: payment.amountGrams,
        amountFiat: payment.amountFiat,
        feeGrams: payment.feeGrams,
        goldPrice: payment.goldPrice,
        description: payment.description,
        status: payment.status,
        callbackSent: payment.callbackSent,
        callbackStatus: payment.callbackStatus,
        expiresAt: payment.expiresAt,
        paidAt: payment.paidAt,
        cancelledAt: payment.cancelledAt,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
    })
  } catch (error) {
    console.error('Payment status error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بررسی وضعیت پرداخت' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendMerchantWebhook } from '@/lib/gateway-helpers'
import crypto from 'crypto'

/**
 * POST /api/gateway/pay/[id]/execute
 * User confirms payment (authenticated user)
 * - Deduct gold from user's GoldWallet
 * - Create a Transaction record
 * - Update ExternalPayment status to "paid"
 * - Update Merchant stats
 * - Send callback to merchant webhook URL
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
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
            callbackUrl: true,
            feePercent: true,
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

    // Verify payment belongs to user
    if (payment.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'این پرداخت متعلق به شما نیست' },
        { status: 403 }
      )
    }

    // Check payment status
    if (payment.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: `پرداخت قبلاً ${payment.status === 'paid' ? 'انجام' : payment.status === 'cancelled' ? 'لغو' : 'منقضی'} شده است` },
        { status: 400 }
      )
    }

    // Check expiry
    if (payment.expiresAt < new Date()) {
      await db.externalPayment.update({
        where: { id: paymentId },
        data: { status: 'expired' },
      })
      return NextResponse.json(
        { success: false, message: 'مهلت پرداخت منقضی شده است' },
        { status: 400 }
      )
    }

    // Check user's gold wallet
    const goldWallet = await db.goldWallet.findUnique({
      where: { userId },
    })

    if (!goldWallet) {
      return NextResponse.json(
        { success: false, message: 'کیف طلای کاربر یافت نشد' },
        { status: 400 }
      )
    }

    const totalRequired = payment.amountGrams + payment.feeGrams
    const availableGold = goldWallet.goldGrams - goldWallet.frozenGold

    if (availableGold < totalRequired) {
      return NextResponse.json(
        { success: false, message: `موجودی طلای کافی نیست. مورد نیاز: ${totalRequired.toFixed(6)} گرم، موجودی: ${availableGold.toFixed(6)} گرم` },
        { status: 400 }
      )
    }

    // Execute payment in a transaction-like flow
    const now = new Date()

    // 1. Deduct gold from wallet
    await db.goldWallet.update({
      where: { userId },
      data: {
        goldGrams: { decrement: payment.amountGrams + payment.feeGrams },
      },
    })

    // 2. Update payment status
    await db.externalPayment.update({
      where: { id: paymentId },
      data: {
        status: 'paid',
        paidAt: now,
      },
    })

    // 3. Create transaction record
    const referenceId = crypto.randomUUID()
    await db.transaction.create({
      data: {
        userId,
        type: 'gateway_payment',
        amountFiat: payment.amountFiat,
        amountGold: payment.amountGrams,
        fee: payment.feeGrams,
        goldPrice: payment.goldPrice,
        status: 'completed',
        referenceId,
        description: `پرداخت به ${payment.merchant.businessName} — سفارش ${payment.merchantOrderId}`,
      },
    })

    // 4. Update merchant stats
    await db.merchant.update({
      where: { id: payment.merchantId },
      data: {
        totalPayments: { increment: 1 },
        totalVolume: { increment: payment.amountFiat },
      },
    })

    // 5. Send webhook (fire and forget)
    sendMerchantWebhook(payment.merchant.callbackUrl, {
      paymentId: payment.id,
      merchantOrderId: payment.merchantOrderId,
      status: 'paid',
      amountGrams: payment.amountGrams,
      amountFiat: payment.amountFiat,
      paidAt: now.toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'پرداخت با موفقیت انجام شد',
      payment: {
        id: payment.id,
        merchantOrderId: payment.merchantOrderId,
        amountGrams: payment.amountGrams,
        amountFiat: payment.amountFiat,
        feeGrams: payment.feeGrams,
        status: 'paid',
        paidAt: now,
        referenceId,
      },
    })
  } catch (error) {
    console.error('Payment execute error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اجرای پرداخت' },
      { status: 500 }
    )
  }
}

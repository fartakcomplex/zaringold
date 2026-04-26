import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateMerchant } from '@/lib/gateway-helpers'
import crypto from 'crypto'

/**
 * POST /api/gateway/pay/create
 * Create a payment request (external — called by merchant server)
 * Auth via apiKey header and apiSecret in body
 * Required: amountGrams (or amountFiat + goldPrice), merchantOrderId
 * Optional: callbackUrl (uses merchant default), description, userId
 * Returns: payment URL and payment ID
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      apiSecret,
      amountGrams,
      amountFiat,
      goldPrice,
      merchantOrderId,
      callbackUrl,
      description,
      userId: bodyUserId,
    } = body

    // Authenticate merchant
    const { merchant, error } = await authenticateMerchant(request, apiSecret)
    if (error) return error

    const merchantData = merchant as {
      id: string
      userId: string
      businessName: string
      callbackUrl: string
      feePercent: number
      isActive: boolean
    }

    // Validate required fields
    if (!merchantOrderId || !merchantOrderId.trim()) {
      return NextResponse.json(
        { success: false, message: 'شماره سفارش پذیرنده الزامی است' },
        { status: 400 }
      )
    }

    // Calculate amounts
    let finalAmountGrams = amountGrams
    let finalAmountFiat = amountFiat || 0
    let finalGoldPrice = goldPrice || 0

    if (!finalAmountGrams || finalAmountGrams <= 0) {
      // Must provide amountFiat + goldPrice
      if (!finalAmountFiat || finalAmountFiat <= 0 || !finalGoldPrice || finalGoldPrice <= 0) {
        return NextResponse.json(
          { success: false, message: 'مقدار طلای مورد نیاز یا مبلغ واحد طلایی + قیمت طلا الزامی است' },
          { status: 400 }
        )
      }
      finalAmountGrams = finalAmountFiat / finalGoldPrice
    } else {
      // amountGrams provided, need goldPrice for fiat conversion
      if (!finalGoldPrice || finalGoldPrice <= 0) {
        // Try to get latest price
        const latestPrice = await db.goldPrice.findFirst({
          orderBy: { createdAt: 'desc' },
        })
        if (latestPrice) {
          finalGoldPrice = latestPrice.marketPrice
        } else {
          finalGoldPrice = 0
        }
      }
      if (finalGoldPrice > 0) {
        finalAmountFiat = finalAmountGrams * finalGoldPrice
      }
    }

    // Calculate fee
    const feeGrams = finalAmountGrams * (merchantData.feePercent / 100)

    // Set expiry (30 minutes from now)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    // Create ExternalPayment
    const payment = await db.externalPayment.create({
      data: {
        merchantId: merchantData.id,
        userId: bodyUserId || merchantData.userId, // If userId provided, payment goes to that user
        amountGrams: finalAmountGrams,
        amountFiat: finalAmountFiat,
        feeGrams,
        goldPrice: finalGoldPrice,
        description: description?.trim() || '',
        merchantOrderId: merchantOrderId.trim(),
        status: 'pending',
        expiresAt,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    // Construct payment URL for user
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    const paymentUrl = `${baseUrl}/pay/${payment.id}`

    return NextResponse.json({
      success: true,
      message: 'درخواست پرداخت با موفقیت ایجاد شد',
      payment: {
        id: payment.id,
        merchantOrderId: payment.merchantOrderId,
        amountGrams: payment.amountGrams,
        amountFiat: payment.amountFiat,
        feeGrams: payment.feeGrams,
        goldPrice: payment.goldPrice,
        status: payment.status,
        expiresAt: payment.expiresAt,
        paymentUrl,
        createdAt: payment.createdAt,
      },
    })
  } catch (error) {
    console.error('Payment create error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد درخواست پرداخت' },
      { status: 500 }
    )
  }
}

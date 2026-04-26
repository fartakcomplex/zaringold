import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function randomDigits(length: number): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString()
  }
  return result
}

/**
 * POST /api/gold-card/request
 * Body: { userId }
 * Issues a new GoldCard if user KYC is approved
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    // Check if user already has a card
    const existingCard = await db.goldCard.findUnique({
      where: { userId },
    })

    if (existingCard) {
      return NextResponse.json(
        { success: false, message: 'شما قبلاً یک کارت طلایی دارید' },
        { status: 400 }
      )
    }

    // Check KYC status
    const kyc = await db.kYCRequest.findUnique({
      where: { userId },
    })

    if (!kyc || kyc.status !== 'approved') {
      return NextResponse.json(
        { success: false, message: 'احراز هویت (KYC) شما تأیید نشده است. لطفاً ابتدا احراز هویت را تکمیل کنید.' },
        { status: 400 }
      )
    }

    // Check user exists and is active
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: 'کاربر فعال نیست' },
        { status: 400 }
      )
    }

    const now = new Date()
    const expiryDate = new Date(now)
    expiryDate.setFullYear(now.getFullYear() + 3)

    // Generate card number: 6219-86XX-XXXX-XXXX
    const cardNumber = `6219-86${randomDigits(4)}-${randomDigits(4)}-${randomDigits(4)}`
    const cvv = randomDigits(3)
    const pin = '1234'

    const card = await db.goldCard.create({
      data: {
        userId,
        cardNumber,
        cvv,
        expiryMonth: expiryDate.getMonth() + 1,
        expiryYear: expiryDate.getFullYear(),
        pin,
        cardType: 'virtual',
        status: 'active',
        balanceFiat: 0,
        linkedGoldGram: 0,
        dailyLimit: 50_000_000, // 50M toman
        monthlyLimit: 500_000_000, // 500M toman
        spentToday: 0,
        spentThisMonth: 0,
        design: 'gold-gradient',
        issuedAt: now,
        expiresAt: expiryDate,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'کارت طلایی شما با موفقیت صادر شد',
      card: {
        id: card.id,
        cardNumber: card.cardNumber,
        cvv: card.cvv,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        cardType: card.cardType,
        status: card.status,
        design: card.design,
        issuedAt: card.issuedAt,
        expiresAt: card.expiresAt,
      },
    })
  } catch (error) {
    console.error('Request gold card error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در صدور کارت طلایی' },
      { status: 500 }
    )
  }
}

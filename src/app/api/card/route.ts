import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

/**
 * POST /api/card
 * صدور کارت طلایی مجازی برای کاربر
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    if (!token) {
      return NextResponse.json({ success: false, message: 'توکن ارسال نشده' }, { status: 401 })
    }

    const session = await db.userSession.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
      include: { user: { select: { id: true, fullName: true, phone: true, isActive: true, isFrozen: true, isVerified: true } } },
    })

    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'لطفاً وارد حساب کاربری خود شوید' }, { status: 401 })
    }

    if (!session.user.isActive || session.user.isFrozen) {
      return NextResponse.json({ success: false, message: 'حساب کاربری فعال نیست' }, { status: 403 })
    }

    // بررسی کارت موجود
    const existingCard = await db.goldCard.findFirst({ where: { userId: session.userId } })
    if (existingCard) {
      return NextResponse.json({
        success: true,
        message: 'کارت شما قبلاً صادر شده',
        card: sanitizeCard(existingCard),
      })
    }

    // تولید شماره کارت: 6277 XXXX XXXX XXXX (BIN زرین گلد — فقط عددی)
    const userId = session.userId
    const cardNumber = generateNumericCardNumber(userId)

    const cvv = String(crypto.randomInt(100, 999))
    const now = new Date()
    const expiryMonth = now.getMonth() + 1
    const expiryYear = now.getFullYear() + 5

    const holderName = session.user.fullName || session.user.phone

    const card = await db.goldCard.create({
      data: {
        userId,
        cardNumber,
        cvv,
        expiryMonth,
        expiryYear,
        holderName,
        cardType: 'virtual',
        status: 'active',
        designTheme: 'gold-dark',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'کارت طلایی مجازی شما صادر شد! 🎉',
      card: sanitizeCard(card),
    })
  } catch (error) {
    console.error('Card issue error:', error)
    return NextResponse.json({ success: false, message: 'خطای داخلی سرور' }, { status: 500 })
  }
}

/**
 * GET /api/card
 * دریافت اطلاعات کارت کاربر
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    if (!token) {
      return NextResponse.json({ success: false, message: 'توکن ارسال نشده' }, { status: 401 })
    }

    const session = await db.userSession.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
      select: { userId: true },
    })

    if (!session) {
      return NextResponse.json({ success: false, message: 'لطفاً وارد حساب کاربری خود شوید' }, { status: 401 })
    }

    let card = await db.goldCard.findFirst({ where: { userId: session.userId } })

    if (!card) {
      return NextResponse.json({ success: true, hasCard: false, card: null })
    }

    return NextResponse.json({ success: true, hasCard: true, card: sanitizeCard(card) })
  } catch (error) {
    console.error('Card get error:', error)
    return NextResponse.json({ success: false, message: 'خطای داخلی سرور' }, { status: 500 })
  }
}

/**
 * PATCH /api/card
 * تغییر تنظیمات کارت (فریز/آنفریز، محدودیت‌ها)
 */
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    if (!token) {
      return NextResponse.json({ success: false, message: 'توکن ارسال نشده' }, { status: 401 })
    }

    const session = await db.userSession.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
      select: { userId: true },
    })

    if (!session) {
      return NextResponse.json({ success: false, message: 'لطفاً وارد حساب کاربری خود شوید' }, { status: 401 })
    }

    const body = await request.json()
    const { action, onlineEnabled, contactlessEnabled, dailyLimit, monthlyLimit, designTheme } = body

    const card = await db.goldCard.findFirst({ where: { userId: session.userId } })
    if (!card) {
      return NextResponse.json({ success: false, message: 'کارت یافت نشد' }, { status: 404 })
    }

    let updatedCard
    switch (action) {
      case 'freeze':
        updatedCard = await db.goldCard.update({
          where: { id: card.id },
          data: { status: card.status === 'frozen' ? 'active' : 'frozen' },
        })
        return NextResponse.json({
          success: true,
          message: updatedCard.status === 'frozen' ? 'کارت مسدود (فریز) شد' : 'کارت فعال شد',
          card: sanitizeCard(updatedCard),
        })
      case 'settings':
        updatedCard = await db.goldCard.update({
          where: { id: card.id },
          data: {
            ...(onlineEnabled !== undefined ? { onlineEnabled } : {}),
            ...(contactlessEnabled !== undefined ? { contactlessEnabled } : {}),
            ...(dailyLimit !== undefined ? { dailyLimit } : {}),
            ...(monthlyLimit !== undefined ? { monthlyLimit } : {}),
            ...(designTheme !== undefined ? { designTheme } : {}),
          },
        })
        return NextResponse.json({
          success: true,
          message: 'تنظیمات کارت بروزرسانی شد',
          card: sanitizeCard(updatedCard),
        })
      default:
        return NextResponse.json({ success: false, message: 'عملیات نامعتبر' }, { status: 400 })
    }
  } catch (error) {
    console.error('Card update error:', error)
    return NextResponse.json({ success: false, message: 'خطای داخلی سرور' }, { status: 500 })
  }
}

/** حذف اطلاعات حساس از کارت */
function sanitizeCard(card: any) {
  const num = card.cardNumber || ''
  return {
    ...card,
    // CVV is never sent to client in GET
    cvv: undefined,
    maskedNumber: `${num.slice(0, 4)} **** **** ${num.slice(-4)}`,
    formattedNumber: formatCardNumber(num),
    expiry: `${String(card.expiryMonth).padStart(2, '0')}/${String(card.expiryYear).slice(-2)}`,
  }
}

/** فرمت‌کردن شماره کارت: XXXX XXXX XXXX XXXX */
function formatCardNumber(num: string): string {
  return num.replace(/(.{4})/g, '$1 ').trim()
}

/**
 * تولید شماره کارت ۱۶ رقمی کاملاً عددی از شناسه کاربر
 * BIN: 6277 (زرین گلد) + ۱۲ رقم یکتا از هش SHA-256
 * هر بایت هش (0-255) تبدیل به ۳ رقم می‌شود → ۱۲ رقم از ۴ بایت
 */
function generateNumericCardNumber(userId: string): string {
  const hash = crypto.createHash('sha256').update(userId).digest('hex')
  let numeric = ''
  for (let i = 0; i < hash.length - 1; i += 2) {
    const byte = parseInt(hash.substring(i, i + 2), 16) // 0-255
    numeric += byte.toString().padStart(3, '0')
  }
  return '6277' + numeric.slice(0, 12)
}

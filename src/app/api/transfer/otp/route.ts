import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/transfer/otp
 * ارسال کد تأیید ۴ رقمی به شماره موبایل کاربر برای انتقال طلا
 *
 * Flow:
 *   1. احراز هویت از توکن
 *   2. تولید کد ۴ رقمی (در dev: 1234)
 *   3. ذخیره در OTPCode با purpose='gold_transfer'
 *   4. ارسال SMS (یا بازگشت devCode در محیط توسعه)
 */
export async function POST(request: NextRequest) {
  try {
    // ── احراز هویت ──
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    if (!token) {
      return NextResponse.json({ success: false, message: 'توکن ارسال نشده' }, { status: 401 })
    }

    const session = await db.userSession.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
      include: {
        user: {
          select: { id: true, phone: true, fullName: true, isActive: true, isFrozen: true },
        },
      },
    })

    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'لطفاً وارد حساب کاربری خود شوید' }, { status: 401 })
    }
    if (!session.user.isActive || session.user.isFrozen) {
      return NextResponse.json({ success: false, message: 'حساب کاربری فعال نیست' }, { status: 403 })
    }

    const userId = session.userId
    const phone = session.user.phone

    // ── Rate limiting: حداکثر ۳ OTP در ۵ دقیقه ──
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    const recentOtps = await db.oTPCode.count({
      where: {
        userId,
        purpose: 'gold_transfer',
        createdAt: { gt: fiveMinAgo },
      },
    })

    if (recentOtps >= 3) {
      return NextResponse.json(
        { success: false, message: 'تعداد درخواست کد تأیید بیش از حد مجاز است. لطفاً ۵ دقیقه دیگر تلاش کنید.' },
        { status: 429 }
      )
    }

    // ── باطل کردن کدهای قبلی فعال ──
    await db.oTPCode.updateMany({
      where: {
        userId,
        purpose: 'gold_transfer',
        verified: false,
        expiresAt: { gt: new Date() },
      },
      data: { verified: true }, // mark as consumed/invalid
    })

    // ── تولید کد ۴ رقمی ──
    const code = String(Math.floor(1000 + Math.random() * 9000))
    if (process.env.NODE_ENV === 'development') {
      console.log(`[transfer-otp] DEV OTP for user ${userId}: ${code}`)
    }

    // ── ذخیره OTP ──
    await db.oTPCode.create({
      data: {
        userId,
        phone,
        code,
        purpose: 'gold_transfer',
        expiresAt: new Date(Date.now() + 2 * 60 * 1000), // ۲ دقیقه اعتبار
        maxAttempts: 3,
      },
    })

    // ── ارسال SMS (در production) ──
    if (process.env.NODE_ENV !== 'development') {
      try {
        const smsConfig = await db.smsConfig.findFirst()
        if (smsConfig?.apiKey) {
          const { createSMSProvider } = await import('@/lib/sms')
          const sms = createSMSProvider({
            provider: smsConfig.provider,
            apiKey: smsConfig.apiKey,
            senderNumber: smsConfig.senderNumber,
            otpTemplate: smsConfig.otpTemplate,
          })
          await sms.sendOTP(phone, code)
        }
      } catch (smsError) {
        console.error('SMS send error (non-blocking):', smsError)
        // OTP still saved, just SMS failed — admin can check logs
      }
    }

    // ── مخفی کردن شماره موبایل ──
    const maskedPhone = phone ? `****${phone.slice(-4)}` : ''

    return NextResponse.json({
      success: true,
      message: `کد تأیید ۴ رقمی به شماره ${maskedPhone} ارسال شد`,
      maskedPhone,
      expiresIn: 120, // seconds
    })
  } catch (error) {
    console.error('Transfer OTP send error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ارسال کد تأیید. لطفاً دوباره تلاش کنید' },
      { status: 500 }
    )
  }
}

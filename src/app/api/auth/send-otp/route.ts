import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { success: false, message: 'شماره موبایل الزامی است' },
        { status: 400 }
      )
    }

    const normalizedPhone = phone.replace(/^(\+98|0)/, '98')

    // Check if user exists and is admin
    const existingUser = await db.user.findUnique({
      where: { phone: normalizedPhone },
      select: { id: true, role: true },
    })

    const isAdmin = existingUser?.role === 'admin' || existingUser?.role === 'super_admin'

    // In dev mode, always use 123456
    const isDev = process.env.NODE_ENV === 'development'
    const code = isDev ? '123456' : String(Math.floor(100000 + Math.random() * 900000))

    // Create OTP record with 2-minute expiry
    const otp = await db.oTPCode.create({
      data: {
        phone: normalizedPhone,
        code,
        purpose: 'login',
        expiresAt: new Date(Date.now() + 2 * 60 * 1000),
        maxAttempts: 5,
        userId: existingUser?.id || null,
      },
    })

    // TODO: Replace mock OTP with real SMS
    // To enable real SMS sending, uncomment the following lines:
    //
    // import { getSMSProvider } from '@/lib/sms';
    // const smsConfig = await db.smsConfig.findFirst();
    // if (smsConfig?.apiKey) {
    //   const sms = createSMSProvider({
    //     provider: smsConfig.provider,
    //     apiKey: smsConfig.apiKey,
    //     senderNumber: smsConfig.senderNumber,
    //     otpTemplate: smsConfig.otpTemplate,
    //   });
    //   await sms.sendOTP(normalizedPhone, code);
    // }

    // SECURITY: Do NOT reveal whether user exists, their role, or admin status.
    // Return the same response regardless of whether user exists or not.
    return NextResponse.json({
      success: true,
      message: 'کد ارسال شد',
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ارسال کد تایید' },
      { status: 500 }
    )
  }
}

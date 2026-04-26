import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'
import { verifyPassword } from '@/lib/password'

export async function POST(request: NextRequest) {
  try {
    const { phone, code, password } = await request.json()

    if (!phone || !code) {
      return NextResponse.json(
        { success: false, message: 'شماره موبایل و کد تایید الزامی است' },
        { status: 400 }
      )
    }

    const normalizedPhone = phone.replace(/^(\+98|0)/, '98')

    // Find the latest OTP for this phone
    const otp = await db.oTPCode.findFirst({
      where: { phone: normalizedPhone, verified: false },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp) {
      return NextResponse.json(
        { success: false, message: 'کد تاییدی یافت نشد' },
        { status: 404 }
      )
    }

    // Check expiry
    if (new Date() > otp.expiresAt) {
      return NextResponse.json(
        { success: false, message: 'کد تایید منقضی شده است' },
        { status: 400 }
      )
    }

    // Check attempts
    if (otp.attempts >= otp.maxAttempts) {
      return NextResponse.json(
        { success: false, message: 'تعداد دفعات وارد کردن کد بیش از حد مجاز است' },
        { status: 400 }
      )
    }

    // Increment attempts
    await db.oTPCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    })

    // Validate code
    if (otp.code !== code) {
      return NextResponse.json(
        { success: false, message: 'کد تایید اشتباه است' },
        { status: 400 }
      )
    }

    // Mark OTP as verified
    await db.oTPCode.update({
      where: { id: otp.id },
      data: { verified: true },
    })

    // Find or create user
    let user = await db.user.findUnique({
      where: { phone: normalizedPhone },
    })

    const isNewUser = !user

    // If user exists and is admin/super_admin, verify password
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      if (!user.password) {
        return NextResponse.json(
          { success: false, message: 'رمز عبور تنظیم نشده است. لطفاً با مدیر سیستم تماس بگیرید.' },
          { status: 400 }
        )
      }

      if (!password) {
        return NextResponse.json(
          { success: false, message: 'رمز عبور برای ورود مدیران الزامی است' },
          { status: 400 }
        )
      }

      const isValid = await verifyPassword(password, user.password)
      if (!isValid) {
        return NextResponse.json(
          { success: false, message: 'رمز عبور اشتباه است' },
          { status: 401 }
        )
      }
    }

    if (!user) {
      // Generate referral code
      const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase()

      user = await db.user.create({
        data: {
          phone: normalizedPhone,
          isVerified: true,
          referralCode,
          lastLoginAt: new Date(),
        },
      })

      // Create wallet and gold wallet for new user
      await db.wallet.create({
        data: { userId: user.id },
      })

      await db.goldWallet.create({
        data: { userId: user.id },
      })
    } else {
      // Check if user is active
      if (!user.isActive || user.isFrozen) {
        return NextResponse.json(
          { success: false, message: 'حساب کاربری غیرفعال یا مسدود شده است' },
          { status: 403 }
        )
      }

      user = await db.user.update({
        where: { id: user.id },
        data: { isVerified: true, lastLoginAt: new Date() },
      })
    }

    // Generate session token
    const token = crypto.randomUUID()

    await db.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        device: request.headers.get('user-agent') || 'unknown',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      },
    })

    // Audit log for admin logins
    if (user.role === 'admin' || user.role === 'super_admin') {
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'admin_otp_login',
          details: `Admin login via OTP+Password from IP: ${request.headers.get('x-forwarded-for') || 'unknown'}`,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    }

    // Build response with token cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        referralCode: user.referralCode,
      },
      token,
      isNewUser,
    })

    // ⚡ Set session cookie
    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    // ⚡ Super Admin shield bypass — all security shields whitelisted
    if (user.role === 'super_admin') {
      response.cookies.set('shield_bypass', 'super_admin_immune', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تایید کد' },
      { status: 500 }
    )
  }
}

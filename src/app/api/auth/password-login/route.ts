import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'
import { hashPassword, verifyPassword } from '@/lib/password'

/**
 * POST /api/auth/password-login
 * General password login — works for all users (not just admins).
 */
export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json()

    if (!phone || !password) {
      return NextResponse.json(
        { success: false, message: 'شماره موبایل و رمز عبور الزامی است' },
        { status: 400 }
      )
    }

    // Normalize phone
    const normalizedPhone = phone.replace(/^(\+98|0)/, '98')

    // Find user
    const user = await db.user.findUnique({
      where: { phone: normalizedPhone },
    })

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
    const clientUA = request.headers.get('user-agent') || undefined

    if (!user) {
      // Audit log: auth failure — user not found
      await db.auditLog.create({
        data: {
          action: 'auth_failure',
          details: `Password login failed — user not found for phone: ${normalizedPhone}`,
          ip: clientIp,
          userAgent: clientUA,
        },
      }).catch(() => {})
      return NextResponse.json(
        { success: false, message: 'کاربری با این شماره یافت نشد' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive || user.isFrozen) {
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'auth_failure',
          details: `Password login failed — account inactive or frozen, phone: ${normalizedPhone}`,
          ip: clientIp,
          userAgent: clientUA,
        },
      }).catch(() => {})
      return NextResponse.json(
        { success: false, message: 'حساب کاربری غیرفعال یا مسدود شده است' },
        { status: 403 }
      )
    }

    // If user has no password set, reject
    if (!user.password) {
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'auth_failure',
          details: `Password login failed — no password set, phone: ${normalizedPhone}`,
          ip: clientIp,
          userAgent: clientUA,
        },
      }).catch(() => {})
      return NextResponse.json(
        { success: false, message: 'رمز عبور تنظیم نشده است. لطفاً ابتدا از طریق OTP وارد شوید' },
        { status: 400 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'auth_failure',
          details: `Password login failed — wrong password, phone: ${normalizedPhone}`,
          ip: clientIp,
          userAgent: clientUA,
        },
      }).catch(() => {})
      return NextResponse.json(
        { success: false, message: 'رمز عبور اشتباه است' },
        { status: 401 }
      )
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        isVerified: true,
      },
    })

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

    // Audit log: success
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'auth_success',
        details: `Password login successful, phone: ${normalizedPhone}`,
        ip: clientIp,
        userAgent: clientUA,
      },
    })

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
        isVerified: user.isVerified,
        userLevel: user.userLevel || 'none',
      },
      token,
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
    console.error('Password login error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ورود به سیستم' },
      { status: 500 }
    )
  }
}

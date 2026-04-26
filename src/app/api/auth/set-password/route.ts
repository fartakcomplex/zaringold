import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/password'

// Simple in-memory rate limiter for set-password endpoint
const setPasswordAttempts = new Map<string, { count: number; resetAt: number }>()
const SET_PASSWORD_RATE_MAX = 5 // 5 attempts per 15 minutes
const SET_PASSWORD_RATE_WINDOW_MS = 15 * 60 * 1000

function isSetPasswordRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = setPasswordAttempts.get(ip)

  if (!entry || now > entry.resetAt) {
    setPasswordAttempts.set(ip, { count: 1, resetAt: now + SET_PASSWORD_RATE_WINDOW_MS })
    return false
  }

  entry.count++
  return entry.count > SET_PASSWORD_RATE_MAX
}

/**
 * POST /api/auth/set-password
 * Sets a password for an existing user.
 * REQUIRES: Valid session token (must be logged in)
 * - Admin/super_admin can set password for any user
 * - Regular users must provide their current password to change it
 * Body: { phone?: string, newPassword: string, oldPassword?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (isSetPasswordRateLimited(ip)) {
      console.warn(`[SECURITY] Set-password rate limited for IP: ${ip}`)
      return NextResponse.json(
        { success: false, message: 'تعداد تلاش‌ها بیش از حد مجاز است. لطفاً بعداً تلاش کنید.' },
        { status: 429 }
      )
    }

    // Require session token — must be logged in
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'احراز هویت نشده. لطفاً ابتدا وارد شوید.' },
        { status: 401 }
      )
    }

    // Find session and validate it
    const session = await db.userSession.findUnique({
      where: { token },
      include: { user: { select: { id: true, role: true, isActive: true, isFrozen: true } } },
    })

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'جلسه نامعتبر است یا منقضی شده. لطفاً دوباره وارد شوید.' },
        { status: 401 }
      )
    }

    // Check session expiry
    if (new Date() > session.expiresAt) {
      return NextResponse.json(
        { success: false, message: 'جلسه منقضی شده. لطفاً دوباره وارد شوید.' },
        { status: 401 }
      )
    }

    // Check user is active
    if (!session.user.isActive || session.user.isFrozen) {
      return NextResponse.json(
        { success: false, message: 'حساب کاربری غیرفعال یا مسدود شده است.' },
        { status: 403 }
      )
    }

    const { phone, newPassword, oldPassword } = await request.json()

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { success: false, message: 'رمز عبور جدید الزامی است' },
        { status: 400 }
      )
    }

    // Minimum password length: 8 characters (upgraded from 4)
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'رمز عبور باید حداقل ۸ کاراکتر باشد' },
        { status: 400 }
      )
    }

    // Maximum password length
    if (newPassword.length > 128) {
      return NextResponse.json(
        { success: false, message: 'رمز عبور نباید بیش از ۱۲۸ کاراکتر باشد' },
        { status: 400 }
      )
    }

    const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin'
    let targetUser

    // Admin can set password for another user by phone
    if (isAdmin && phone) {
      const normalizedPhone = phone.replace(/^(\+98|0)/, '98')
      targetUser = await db.user.findUnique({
        where: { phone: normalizedPhone },
      })

      if (!targetUser) {
        return NextResponse.json(
          { success: false, message: 'کاربری با این شماره یافت نشد' },
          { status: 404 }
        )
      }
    } else {
      // Regular user can only change their own password
      targetUser = await db.user.findUnique({
        where: { id: session.userId },
      })

      if (!targetUser) {
        return NextResponse.json(
          { success: false, message: 'کاربر یافت نشد' },
          { status: 404 }
        )
      }

      // Non-admin must provide their old password
      if (!oldPassword) {
        return NextResponse.json(
          { success: false, message: 'رمز عبور فعلی الزامی است' },
          { status: 400 }
        )
      }

      if (!targetUser.password) {
        return NextResponse.json(
          { success: false, message: 'رمز عبور فعلی تنظیم نشده است. لطفاً از طریق مدیریت رمز عبور اقدام کنید.' },
          { status: 400 }
        )
      }

      const isOldPasswordValid = await verifyPassword(oldPassword, targetUser.password)
      if (!isOldPasswordValid) {
        console.warn(`[SECURITY] Failed password change attempt for user ${targetUser.id} — wrong old password, IP: ${ip}`)
        return NextResponse.json(
          { success: false, message: 'رمز عبور فعلی اشتباه است' },
          { status: 401 }
        )
      }
    }

    // Hash and set new password
    const hashedPassword = await hashPassword(newPassword)

    await db.user.update({
      where: { id: targetUser.id },
      data: { password: hashedPassword },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'set_password',
        details: isAdmin && phone
          ? `Admin changed password for user ${targetUser.id} (${targetUser.phone})`
          : 'User changed their own password',
        ip,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'رمز عبور با موفقیت تنظیم شد',
    })
  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تنظیم رمز عبور' },
      { status: 500 }
    )
  }
}

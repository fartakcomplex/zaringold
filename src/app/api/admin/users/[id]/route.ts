import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'

/* ------------------------------------------------------------------ */
/*  GET /api/admin/users/[id] — Get single user details               */
/* ------------------------------------------------------------------ */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await db.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        goldWallet: true,
        kyc: { select: { status: true } },
        gamification: { select: { xp: true, level: true, currentStreak: true, longestStreak: true, totalBadges: true } },
        profile: true,
        _count: {
          select: {
            transactions: true,
            referrals: true,
            socialPosts: true,
            creatorSubmissions: true,
            checkIns: true,
            pricePredictions: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Admin get user error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات کاربر' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /api/admin/users/[id] — Update user fields (admin-only)       */
/* ------------------------------------------------------------------ */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    // Validate user exists
    const user = await db.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    const { phone, password, fullName, email, role, isVerified, isActive, isFrozen } = body

    // Build update data (only include provided fields)
    const data: Record<string, unknown> = {}

    // Phone
    if (phone !== undefined && phone !== user.phone) {
      const normalized = phone.replace(/^(\+98|0)/, '98').trim()
      if (!/^98\d{10}$/.test(normalized)) {
        return NextResponse.json(
          { success: false, message: 'فرمت شماره موبایل نامعتبر است' },
          { status: 400 }
        )
      }
      const phoneExists = await db.user.findFirst({ where: { phone: normalized, id: { not: id } } })
      if (phoneExists) {
        return NextResponse.json(
          { success: false, message: 'این شماره موبایل قبلاً ثبت شده است' },
          { status: 409 }
        )
      }
      data.phone = normalized
    }

    // Email
    if (email !== undefined) {
      const emailVal = email?.trim() || null
      if (emailVal) {
        const emailExists = await db.user.findFirst({ where: { email: emailVal.toLowerCase(), id: { not: id } } })
        if (emailExists) {
          return NextResponse.json(
            { success: false, message: 'این ایمیل قبلاً ثبت شده است' },
            { status: 409 }
          )
        }
        data.email = emailVal.toLowerCase()
      } else {
        data.email = null
      }
    }

    // Password
    if (password !== undefined && password?.trim()) {
      data.password = await hashPassword(password.trim())
    }

    // Simple text fields
    if (fullName !== undefined) data.fullName = fullName?.trim() || null
    if (role !== undefined && ['user', 'admin', 'super_admin'].includes(role)) data.role = role
    if (isVerified !== undefined) data.isVerified = Boolean(isVerified)
    if (isActive !== undefined) data.isActive = Boolean(isActive)
    if (isFrozen !== undefined) data.isFrozen = Boolean(isFrozen)

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, message: 'هیچ فیلدی برای بروزرسانی ارسال نشده است' },
        { status: 400 }
      )
    }

    const updated = await db.user.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      success: true,
      message: 'اطلاعات کاربر بروزرسانی شد',
      user: {
        id: updated.id,
        phone: updated.phone,
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role,
        isVerified: updated.isVerified,
        isActive: updated.isActive,
        isFrozen: updated.isFrozen,
        referralCode: updated.referralCode,
      },
    })
  } catch (error) {
    console.error('Admin update user error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی اطلاعات کاربر' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/admin/users/[id] — Soft-delete user (admin-only)      */
/* ------------------------------------------------------------------ */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await db.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    // Prevent deleting super_admin
    if (user.role === 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'امکان حذف مدیر ارشد وجود ندارد' },
        { status: 403 }
      )
    }

    // Freeze and deactivate instead of hard delete
    await db.user.update({
      where: { id },
      data: {
        isActive: false,
        isFrozen: true,
        fullName: `[حذف شده] ${user.fullName || user.phone}`,
      },
    })

    // Delete all sessions
    await db.userSession.deleteMany({ where: { userId: id } })

    return NextResponse.json({
      success: true,
      message: 'کاربر غیرفعال و مسدود شد',
    })
  } catch (error) {
    console.error('Admin delete user error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف کاربر' },
      { status: 500 }
    )
  }
}

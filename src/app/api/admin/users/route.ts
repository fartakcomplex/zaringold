import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { randomBytes } from 'crypto'

/* ------------------------------------------------------------------ */
/*  GET /api/admin/users — List all users (admin-only)              */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { fullName: { contains: search } },
        { email: { contains: search } },
      ]
    }
    if (role) {
      where.role = role
    }
    if (status === 'frozen') {
      where.isFrozen = true
    } else if (status === 'inactive') {
      where.isActive = false
    } else if (status === 'unverified') {
      where.isVerified = false
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          phone: true,
          email: true,
          fullName: true,
          isVerified: true,
          isActive: true,
          isFrozen: true,
          role: true,
          avatar: true,
          userLevel: true,
          lastLoginAt: true,
          createdAt: true,
          wallet: { select: { balance: true, frozenBalance: true } },
          goldWallet: { select: { goldGrams: true, frozenGold: true } },
          _count: { select: { transactions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Admin get users error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست کاربران' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/users — Create new user (admin-only)           */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password, fullName, email, role, isVerified } = body

    // Validate required fields
    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { success: false, message: 'شماره موبایل الزامی است' },
        { status: 400 }
      )
    }

    // Normalize phone
    const normalized = phone.replace(/^(\+98|0)/, '98').trim()
    if (!/^98\d{10}$/.test(normalized)) {
      return NextResponse.json(
        { success: false, message: 'فرمت شماره موبایل نامعتبر است (مثال: 09123456789)' },
        { status: 400 }
      )
    }

    // Check phone uniqueness
    const existing = await db.user.findFirst({ where: { phone: normalized } })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'این شماره موبایل قبلاً ثبت شده است' },
        { status: 409 }
      )
    }

    // Check email uniqueness if provided
    if (email?.trim()) {
      const emailVal = email.trim().toLowerCase()
      const emailExists = await db.user.findFirst({ where: { email: emailVal } })
      if (emailExists) {
        return NextResponse.json(
          { success: false, message: 'این ایمیل قبلاً ثبت شده است' },
          { status: 409 }
        )
      }
    }

    // Validate role
    const validRoles = ['user', 'admin', 'super_admin', 'support_admin', 'finance_admin', 'support_agent', 'viewer']
    const userRole = validRoles.includes(role) ? role : 'user'

    // Hash password (default: random secure password if not provided)
    const finalPassword = password?.trim() || randomBytes(16).toString('hex')
    const hashedPassword = await hashPassword(finalPassword)

    // Generate unique referral code
    let referralCode = 'ZG' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()
    let codeExists = await db.user.findFirst({ where: { referralCode } })
    while (codeExists) {
      referralCode = 'ZG' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()
      codeExists = await db.user.findFirst({ where: { referralCode } })
    }

    // Create user
    const user = await db.user.create({
      data: {
        phone: normalized,
        password: hashedPassword,
        fullName: fullName?.trim() || null,
        email: email?.trim()?.toLowerCase() || null,
        role: userRole,
        isVerified: isVerified === true,
        isActive: true,
        isFrozen: false,
        referralCode,
      },
    })

    // Auto-create wallet and gold wallet
    await db.wallet.create({
      data: { userId: user.id, balance: 0, frozenBalance: 0 },
    })
    await db.goldWallet.create({
      data: { userId: user.id, goldGrams: 0, frozenGold: 0 },
    })

    // Auto-create gamification
    await db.userGamification.create({
      data: {
        userId: user.id,
        xp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
      },
    })

    return NextResponse.json({
      success: true,
      message: `کاربر ${user.fullName || user.phone} با نقش "${validRoles.includes(role) ? role : 'کاربر عادی'} ایجاد شد`,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        referralCode: user.referralCode,
        createdAt: user.createdAt,
        generatedPassword: !password?.trim() ? finalPassword : undefined,
      },
    })
  } catch (error) {
    console.error('Admin create user error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد کاربر' },
      { status: 500 }
    )
  }
}

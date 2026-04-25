import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/auth/me?userId=xxx
 * Returns fresh user data from the database.
 * Used by the client to validate/refresh the session.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
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
        referralCode: true,
        wallet: { select: { balance: true, frozenBalance: true } },
        goldWallet: { select: { goldGrams: true, frozenGold: true } },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    if (!user.isActive || user.isFrozen) {
      return NextResponse.json(
        {
          success: false,
          message: 'حساب کاربری غیرفعال یا مسدود شده است',
          action: 'logout',
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.fullName,
        isVerified: user.isVerified,
        isActive: user.isActive,
        avatar: user.avatar,
        referralCode: user.referralCode,
        role: user.role,
      },
      wallet: user.wallet,
      goldWallet: user.goldWallet,
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بررسی وضعیت کاربر' },
      { status: 500 }
    )
  }
}

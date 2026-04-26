import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/security/auth-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 })
    }

    const userId = auth.user.id

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { profile: true, kyc: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        referralCode: user.referralCode,
        isVerified: user.isVerified,
        isFrozen: user.isFrozen,
        profile: user.profile || null,
        kycStatus: user.kyc?.status || 'none',
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت پروفایل' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 })
    }

    const body = await request.json()
    const { fullName, email, nationalId, iban, province, city, address, postalCode } = body
    const userId = auth.user.id

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    // Update user fields
    await db.user.update({
      where: { id: userId },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(email !== undefined && { email }),
      },
    })

    // Update or create profile
    const profileFields: Record<string, string> = {}
    if (nationalId !== undefined) profileFields.nationalId = nationalId
    if (iban !== undefined) profileFields.iban = iban
    if (province !== undefined) profileFields.province = province
    if (city !== undefined) profileFields.city = city
    if (address !== undefined) profileFields.address = address
    if (postalCode !== undefined) profileFields.postalCode = postalCode

    if (Object.keys(profileFields).length > 0) {
      await db.profile.upsert({
        where: { userId },
        update: profileFields,
        create: { userId, ...profileFields },
      })
    }

    const updatedUser = await db.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    return NextResponse.json({
      success: true,
      message: 'پروفایل با موفقیت بروزرسانی شد',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی پروفایل' },
      { status: 500 }
    )
  }
}

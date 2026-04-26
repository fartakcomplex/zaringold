import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

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
    const body = await request.json()
    const { userId, fullName, email, nationalId, iban, province, city, address, postalCode } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

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

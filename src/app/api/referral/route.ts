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
      select: { referralCode: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    const referrals = await db.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: { id: true, phone: true, fullName: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalRewarded = referrals
      .filter((r) => r.status === 'claimed')
      .reduce((sum, r) => sum + r.rewardAmount, 0)

    return NextResponse.json({
      success: true,
      referralCode: user.referralCode,
      totalInvited: referrals.length,
      totalRewarded,
      referrals: referrals.map((r) => ({
        id: r.id,
        rewardType: r.rewardType,
        rewardAmount: r.rewardAmount,
        status: r.status,
        claimedAt: r.claimedAt,
        referredUser: r.referred,
        createdAt: r.createdAt,
      })),
    })
  } catch (error) {
    console.error('Get referral info error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات دعوت' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, invitedPhone } = await request.json()

    if (!userId || !invitedPhone) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و شماره دعوت‌شده الزامی است' },
        { status: 400 }
      )
    }

    const normalizedInvitedPhone = invitedPhone.replace(/^(\+98|0)/, '98')

    // Check invited user exists
    const invitedUser = await db.user.findUnique({
      where: { phone: normalizedInvitedPhone },
    })

    if (!invitedUser) {
      return NextResponse.json(
        { success: false, message: 'کاربر دعوت‌شده یافت نشد' },
        { status: 404 }
      )
    }

    // Check referral already exists
    const existingReferral = await db.referral.findUnique({
      where: { referredId: invitedUser.id },
    })

    if (existingReferral) {
      return NextResponse.json(
        { success: false, message: 'این کاربر قبلاً دعوت شده است' },
        { status: 400 }
      )
    }

    // Cannot refer yourself
    if (userId === invitedUser.id) {
      return NextResponse.json(
        { success: false, message: 'نمی‌توانید خودتان را دعوت کنید' },
        { status: 400 }
      )
    }

    const rewardAmount = 500000 // 500,000 IRR referral bonus

    const referral = await db.referral.create({
      data: {
        referrerId: userId,
        referredId: invitedUser.id,
        rewardType: 'cash',
        rewardAmount,
        status: 'pending',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'کد دعوت با موفقیت اعمال شد',
      referral: {
        id: referral.id,
        rewardAmount: referral.rewardAmount,
        status: referral.status,
      },
    })
  } catch (error) {
    console.error('Apply referral error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اعمال کد دعوت' },
      { status: 500 }
    )
  }
}

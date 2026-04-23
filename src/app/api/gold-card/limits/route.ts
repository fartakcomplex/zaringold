import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const MAX_DAILY_LIMIT = 200_000_000 // 200M toman
const MAX_MONTHLY_LIMIT = 2_000_000_000 // 2B toman

/**
 * POST /api/gold-card/limits
 * Body: { userId, dailyLimit, monthlyLimit }
 * Updates card spending limits
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, dailyLimit, monthlyLimit } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    if (dailyLimit === undefined && monthlyLimit === undefined) {
      return NextResponse.json(
        { success: false, message: 'حداقل یکی از سقف‌های روزانه یا ماهانه باید مشخص شود' },
        { status: 400 }
      )
    }

    const card = await db.goldCard.findUnique({
      where: { userId },
      include: {
        user: {
          select: { role: true },
        },
      },
    })

    if (!card) {
      return NextResponse.json(
        { success: false, message: 'کارت طلایی یافت نشد' },
        { status: 404 }
      )
    }

    const isDiamond = card.design === 'diamond'
    const isSuperAdmin = card.user.role === 'super_admin'
    const hasSpecialAccess = isDiamond || isSuperAdmin

    // Validate limits
    if (dailyLimit !== undefined) {
      if (dailyLimit < 0) {
        return NextResponse.json(
          { success: false, message: 'سقف روزانه نمی‌تواند منفی باشد' },
          { status: 400 }
        )
      }
      if (!hasSpecialAccess && dailyLimit > MAX_DAILY_LIMIT) {
        return NextResponse.json(
          { success: false, message: `سقف روزانه نمی‌تواند بیشتر از ${MAX_DAILY_LIMIT.toLocaleString('fa-IR')} واحد طلایی باشد` },
          { status: 400 }
        )
      }
    }

    if (monthlyLimit !== undefined) {
      if (monthlyLimit < 0) {
        return NextResponse.json(
          { success: false, message: 'سقف ماهانه نمی‌تواند منفی باشد' },
          { status: 400 }
        )
      }
      if (!hasSpecialAccess && monthlyLimit > MAX_MONTHLY_LIMIT) {
        return NextResponse.json(
          { success: false, message: `سقف ماهانه نمی‌تواند بیشتر از ${MAX_MONTHLY_LIMIT.toLocaleString('fa-IR')} واحد طلایی باشد` },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: { dailyLimit?: number; monthlyLimit?: number } = {}
    if (dailyLimit !== undefined) updateData.dailyLimit = dailyLimit
    if (monthlyLimit !== undefined) updateData.monthlyLimit = monthlyLimit

    const updatedCard = await db.goldCard.update({
      where: { userId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'سقف کارت با موفقیت بروزرسانی شد',
      card: {
        dailyLimit: updatedCard.dailyLimit,
        monthlyLimit: updatedCard.monthlyLimit,
      },
    })
  } catch (error) {
    console.error('Update limits error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی سقف کارت' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserAccess } from '@/lib/access'

// GET: list user's saving goals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const goals = await db.savingGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, goals })
  } catch (error) {
    console.error('Get saving goals error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اهداف پس‌انداز' },
      { status: 500 }
    )
  }
}

// POST: create new saving goal
export async function POST(request: NextRequest) {
  try {
    const { userId, title, description, icon, targetAmountFiat, deadline } = await request.json()

    if (!userId || !title || !targetAmountFiat || targetAmountFiat <= 0) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر، عنوان و مبلغ هدف الزامی است' },
        { status: 400 }
      )
    }

    // Get latest gold price to calculate target grams
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    const buyPrice = latestPrice?.buyPrice ?? 0
    const access = await getUserAccess(userId)
    const feeRate = access.buyFeeRate
    const netAmount = targetAmountFiat * (1 - feeRate)
    const targetGrams = buyPrice > 0 ? netAmount / buyPrice : 0

    const goal = await db.savingGoal.create({
      data: {
        userId,
        title,
        description: description || null,
        icon: icon || 'target',
        targetAmountFiat,
        targetGrams,
        deadline: deadline ? new Date(deadline) : null,
        status: 'active',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'هدف پس‌انداز با موفقیت ایجاد شد',
      goal,
    })
  } catch (error) {
    console.error('Create saving goal error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد هدف پس‌انداز' },
      { status: 500 }
    )
  }
}

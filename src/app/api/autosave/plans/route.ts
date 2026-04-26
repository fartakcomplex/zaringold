import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: list user's auto buy plans
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

    const plans = await db.autoBuyPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, plans })
  } catch (error) {
    console.error('Get auto buy plans error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت طرح‌های خرید خودکار' },
      { status: 500 }
    )
  }
}

// POST: create new auto buy plan
export async function POST(request: NextRequest) {
  try {
    const { userId, amountFiat, frequency, dayOfMonth } = await request.json()

    if (!userId || !amountFiat || amountFiat <= 0) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و مبلغ الزامی است' },
        { status: 400 }
      )
    }

    if (!frequency || !['daily', 'weekly', 'monthly'].includes(frequency)) {
      return NextResponse.json(
        { success: false, message: 'فرکانس نامعتبر است' },
        { status: 400 }
      )
    }

    const validDay = frequency === 'monthly' ? (dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 28 ? dayOfMonth : 1) : 1

    const plan = await db.autoBuyPlan.create({
      data: {
        userId,
        amountFiat,
        frequency,
        dayOfMonth: validDay,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'طرح خرید خودکار با موفقیت ایجاد شد',
      plan,
    })
  } catch (error) {
    console.error('Create auto buy plan error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد طرح خرید خودکار' },
      { status: 500 }
    )
  }
}

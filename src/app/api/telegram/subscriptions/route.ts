import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: List subscriptions ──
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const telegramUserId = searchParams.get('telegramUserId')

    if (!telegramUserId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر تلگرام الزامی است' },
        { status: 400 }
      )
    }

    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { telegramUserId }
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const subscriptions = await db.telegramSubscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: subscriptions.map((s) => ({
        id: s.id,
        type: s.type,
        schedule: s.schedule,
        isActive: s.isActive,
        lastSentAt: s.lastSentAt?.toISOString() || null,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      total: subscriptions.length,
    })
  } catch (error) {
    console.error('Telegram subscriptions GET error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست اشتراک‌ها' },
      { status: 500 }
    )
  }
}

// ── POST: Create or update subscription ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegramUserId, type, schedule } = body

    if (!telegramUserId || !type) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر تلگرام و نوع اشتراک الزامی است' },
        { status: 400 }
      )
    }

    // Verify TelegramUser exists
    const telegramUser = await db.telegramUser.findUnique({
      where: { id: telegramUserId },
    })

    if (!telegramUser) {
      return NextResponse.json(
        { success: false, message: 'کاربر تلگرام یافت نشد' },
        { status: 404 }
      )
    }

    // Upsert subscription (same user + same type = update)
    const subscription = await db.telegramSubscription.upsert({
      where: {
        id: `${telegramUserId}-${type}`,
      },
      update: {
        schedule: schedule || 'daily',
        isActive: true,
      },
      create: {
        telegramUserId,
        type,
        schedule: schedule || 'daily',
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: subscription.id,
        type: subscription.type,
        schedule: subscription.schedule,
        isActive: subscription.isActive,
        createdAt: subscription.createdAt,
      },
    })
  } catch (error) {
    console.error('Telegram subscriptions POST error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد اشتراک' },
      { status: 500 }
    )
  }
}

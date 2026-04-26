import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: List alerts for a user ──
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

    const alerts = await db.telegramAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: alerts.map((a) => ({
        id: a.id,
        alertType: a.alertType,
        assetType: a.assetType,
        condition: a.condition,
        targetPrice: a.targetPrice,
        isActive: a.isActive,
        isTriggered: a.isTriggered,
        triggeredAt: a.triggeredAt?.toISOString() || null,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      total: alerts.length,
    })
  } catch (error) {
    console.error('Telegram alerts GET error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست هشدارها' },
      { status: 500 }
    )
  }
}

// ── POST: Create new alert ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegramUserId, alertType, assetType, condition, targetPrice } = body

    if (!telegramUserId || !alertType || !assetType || !condition || targetPrice === undefined) {
      return NextResponse.json(
        { success: false, message: 'تمام فیلدهای الزامی باید پر شوند' },
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

    // Check for duplicate alert
    const existingAlert = await db.telegramAlert.findFirst({
      where: {
        telegramUserId,
        alertType,
        assetType,
        condition,
        targetPrice,
      },
    })

    if (existingAlert) {
      return NextResponse.json(
        { success: false, message: 'این هشدار قبلاً ثبت شده است' },
        { status: 409 }
      )
    }

    const alert = await db.telegramAlert.create({
      data: {
        telegramUserId,
        alertType: alertType || 'price',
        assetType: assetType || 'gold18',
        condition: condition || 'above',
        targetPrice,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: alert.id,
        alertType: alert.alertType,
        assetType: alert.assetType,
        condition: alert.condition,
        targetPrice: alert.targetPrice,
        isActive: alert.isActive,
        createdAt: alert.createdAt,
      },
    })
  } catch (error) {
    console.error('Telegram alerts POST error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد هشدار جدید' },
      { status: 500 }
    )
  }
}

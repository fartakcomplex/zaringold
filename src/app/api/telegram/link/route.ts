import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── POST: Link Telegram account to user ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegramId, chatId, username, phone } = body

    if (!telegramId || !chatId) {
      return NextResponse.json(
        { success: false, message: 'شناسه تلگرام و چت آیدی الزامی است' },
        { status: 400 }
      )
    }

    let userId = body.userId

    // If no userId provided, try to find user by phone
    if (!userId && phone) {
      const user = await db.user.findUnique({
        where: { phone },
      })
      if (user) {
        userId = user.id
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر یا شماره تلفن الزامی است' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    // Check if telegramId is already linked to another user
    const existingByTelegramId = await db.telegramUser.findUnique({
      where: { telegramId },
    })

    if (existingByTelegramId && existingByTelegramId.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'این حساب تلگرام قبلاً به کاربر دیگری متصل شده است' },
        { status: 409 }
      )
    }

    // Upsert TelegramUser record
    const telegramUser = await db.telegramUser.upsert({
      where: {
        userId: userId,
      },
      update: {
        telegramId,
        chatId,
        username: username || null,
        lastActivityAt: new Date(),
      },
      create: {
        userId,
        telegramId,
        chatId,
        username: username || null,
        firstName: user.fullName || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: telegramUser.id,
        telegramId: telegramUser.telegramId,
        chatId: telegramUser.chatId,
        username: telegramUser.username,
        firstName: telegramUser.firstName,
        isB2B: telegramUser.isB2B,
        createdAt: telegramUser.createdAt,
      },
    })
  } catch (error) {
    console.error('Telegram link error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اتصال حساب تلگرام' },
      { status: 500 }
    )
  }
}

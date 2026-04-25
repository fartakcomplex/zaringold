import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── POST: Admin broadcast message to all linked Telegram users ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, parseMode } = body

    if (!message) {
      return NextResponse.json(
        { success: false, message: 'متن پیام الزامی است' },
        { status: 400 }
      )
    }

    const token = process.env.TELEGRAM_BOT_TOKEN

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'توکن ربات تلگرام تنظیم نشده است' },
        { status: 500 }
      )
    }

    // Fetch all TelegramUser records with chatId
    const users = await db.telegramUser.findMany({
      select: {
        id: true,
        chatId: true,
        telegramId: true,
        username: true,
        firstName: true,
      },
    })

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'هیچ کاربر متصل تلگرامی یافت نشد' },
        { status: 404 }
      )
    }

    const payload: Record<string, unknown> = {
      text: message,
    }

    if (parseMode) {
      payload.parse_mode = parseMode
    }

    // Send to each user and track results
    const results: Array<{ userId: string; telegramId: number; username: string | null; success: boolean; error?: string }> = []
    let successCount = 0
    let failCount = 0

    for (const user of users) {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...payload,
              chat_id: user.chatId,
            }),
          }
        )

        const result = await response.json()

        if (result.ok) {
          successCount++
          results.push({
            userId: user.id,
            telegramId: user.telegramId,
            username: user.username,
            success: true,
          })
        } else {
          failCount++
          results.push({
            userId: user.id,
            telegramId: user.telegramId,
            username: user.username,
            success: false,
            error: result.description || 'خطای ناشناخته',
          })
        }
      } catch (err) {
        failCount++
        results.push({
          userId: user.id,
          telegramId: user.telegramId,
          username: user.username,
          success: false,
          error: err instanceof Error ? err.message : 'خطای ناشناخته',
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: users.length,
        successCount,
        failCount,
        results,
      },
    })
  } catch (error) {
    console.error('Telegram broadcast error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ارسال پیام همگانی' },
      { status: 500 }
    )
  }
}

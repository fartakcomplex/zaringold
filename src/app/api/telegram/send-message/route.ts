import { NextRequest, NextResponse } from 'next/server'

// ── POST: Admin endpoint to send message to a specific user via Telegram ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chatId, message, parseMode } = body

    if (!chatId || !message) {
      return NextResponse.json(
        { success: false, message: 'چت آیدی و متن پیام الزامی است' },
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

    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text: message,
    }

    if (parseMode) {
      payload.parse_mode = parseMode
    }

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    const result = await response.json()

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `خطا در ارسال پیام تلگرام: ${result.description || 'خطای ناشناخته'}`,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        messageId: result.result?.message_id,
        chatId: result.result?.chat?.id,
        date: result.result?.date,
      },
    })
  } catch (error) {
    console.error('Telegram send-message error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ارسال پیام تلگرام' },
      { status: 500 }
    )
  }
}

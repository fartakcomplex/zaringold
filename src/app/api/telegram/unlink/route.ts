import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── POST: Unlink Telegram account ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    // Check if TelegramUser exists
    const telegramUser = await db.telegramUser.findUnique({
      where: { userId },
    })

    if (!telegramUser) {
      return NextResponse.json(
        { success: false, message: 'حساب تلگرامی برای این کاربر یافت نشد' },
        { status: 404 }
      )
    }

    // Delete TelegramUser (cascades to alerts, subscriptions, invoices, customers)
    await db.telegramUser.delete({
      where: { userId },
    })

    return NextResponse.json({
      success: true,
      message: 'حساب تلگرام با موفقیت قطع شد',
    })
  } catch (error) {
    console.error('Telegram unlink error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در قطع ارتباط حساب تلگرام' },
      { status: 500 }
    )
  }
}

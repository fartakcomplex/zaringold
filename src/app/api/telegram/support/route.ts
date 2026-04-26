import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: List support messages for a user ──
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

    const ticketId = searchParams.get('ticketId')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '30', 10)

    const where: Record<string, unknown> = { telegramUserId }
    if (ticketId) {
      where.ticketId = ticketId
    }

    const [messages, total] = await Promise.all([
      db.telegramSupportMessage.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.telegramSupportMessage.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: messages.map((m) => ({
        id: m.id,
        ticketId: m.ticketId,
        messageText: m.messageText,
        photoUrl: m.photoUrl,
        isAdmin: m.isAdmin,
        createdAt: m.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Telegram support GET error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت پیام‌های پشتیبانی' },
      { status: 500 }
    )
  }
}

// ── POST: Send support message ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegramUserId, ticketId, messageText, photoUrl } = body

    if (!telegramUserId || !messageText) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر تلگرام و متن پیام الزامی است' },
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

    // If ticketId not provided, generate a new one
    const finalTicketId = ticketId || `TKT-${Date.now()}`

    const message = await db.telegramSupportMessage.create({
      data: {
        telegramUserId,
        ticketId: finalTicketId,
        messageText,
        photoUrl: photoUrl || null,
        isAdmin: false,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        ticketId: message.ticketId,
        messageText: message.messageText,
        photoUrl: message.photoUrl,
        isAdmin: message.isAdmin,
        createdAt: message.createdAt,
      },
    })
  } catch (error) {
    console.error('Telegram support POST error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ارسال پیام پشتیبانی' },
      { status: 500 }
    )
  }
}

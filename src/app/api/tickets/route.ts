import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const tickets = await db.supportTicket.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1, // Only first message for list view
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      tickets,
    })
  } catch (error) {
    console.error('Get tickets error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تیکت‌ها' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, subject, category, message } = await request.json()

    if (!userId || !subject) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و موضوع الزامی است' },
        { status: 400 }
      )
    }

    const ticket = await db.supportTicket.create({
      data: {
        userId,
        subject,
        category: category || 'general',
        messages: message
          ? {
              create: {
                senderId: userId,
                content: message,
                isAdmin: false,
              },
            }
          : undefined,
      },
      include: { messages: true },
    })

    return NextResponse.json({
      success: true,
      message: 'تیکت با موفقیت ایجاد شد',
      ticket,
    })
  } catch (error) {
    console.error('Create ticket error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد تیکت' },
      { status: 500 }
    )
  }
}

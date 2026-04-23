import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const ticket = await db.supportTicket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'تیکت یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      ticket,
    })
  } catch (error) {
    console.error('Get ticket error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تیکت' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { senderId, content, isAdmin } = await request.json()

    if (!senderId || !content) {
      return NextResponse.json(
        { success: false, message: 'فرستنده و متن پیام الزامی است' },
        { status: 400 }
      )
    }

    // Verify ticket exists
    const ticket = await db.supportTicket.findUnique({
      where: { id },
    })

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'تیکت یافت نشد' },
        { status: 404 }
      )
    }

    // Create message
    const message = await db.ticketMessage.create({
      data: {
        ticketId: id,
        senderId,
        content,
        isAdmin: isAdmin || false,
      },
    })

    // Update ticket status
    await db.supportTicket.update({
      where: { id },
      data: {
        status: isAdmin ? 'answered' : 'open',
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'پیام ارسال شد',
      ticketMessage: message,
    })
  } catch (error) {
    console.error('Add ticket message error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ارسال پیام' },
      { status: 500 }
    )
  }
}

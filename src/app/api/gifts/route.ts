import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: list user's sent and received gifts
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

    const [sent, received] = await Promise.all([
      db.giftTransfer.findMany({
        where: { senderId: userId },
        include: {
          receiver: {
            select: { id: true, fullName: true, phone: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.giftTransfer.findMany({
        where: { receiverId: userId },
        include: {
          sender: {
            select: { id: true, fullName: true, phone: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      success: true,
      sent,
      received,
      totalSentGifts: sent.length,
      totalReceivedGifts: received.length,
      totalSentMg: sent.reduce((sum, g) => sum + g.goldMg, 0),
      totalReceivedMg: received.reduce((sum, g) => sum + g.goldMg, 0),
    })
  } catch (error) {
    console.error('Get gifts error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست هدایا' },
      { status: 500 }
    )
  }
}

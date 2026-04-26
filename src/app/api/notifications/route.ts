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

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    const unreadCount = notifications.filter((n) => !n.isRead).length

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اعلان‌ها' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { notificationId } = await request.json()

    if (!notificationId) {
      return NextResponse.json(
        { success: false, message: 'شناسه اعلان الزامی است' },
        { status: 400 }
      )
    }

    await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })

    return NextResponse.json({
      success: true,
      message: 'اعلان به عنوان خوانده شده علامت‌گذاری شد',
    })
  } catch (error) {
    console.error('Mark notification error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی اعلان' },
      { status: 500 }
    )
  }
}

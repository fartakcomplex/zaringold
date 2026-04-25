import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/gold-card/freeze
 * Body: { userId }
 * Toggles card status between active ↔ frozen
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const card = await db.goldCard.findUnique({
      where: { userId },
    })

    if (!card) {
      return NextResponse.json(
        { success: false, message: 'کارت طلایی یافت نشد' },
        { status: 404 }
      )
    }

    // Only allow freeze/unfreeze on active or frozen cards
    if (card.status === 'blocked') {
      return NextResponse.json(
        { success: false, message: 'کارت مسدود شده و قابل تغییر نیست' },
        { status: 400 }
      )
    }

    if (card.status === 'expired') {
      return NextResponse.json(
        { success: false, message: 'کارت منقضی شده و قابل تغییر نیست' },
        { status: 400 }
      )
    }

    const newStatus = card.status === 'active' ? 'frozen' : 'active'

    const updatedCard = await db.goldCard.update({
      where: { userId },
      data: { status: newStatus },
    })

    const statusMessage =
      newStatus === 'frozen'
        ? 'کارت طلایی با موفقیت مسدود موقت شد'
        : 'کارت طلایی با موفقیت فعال شد'

    return NextResponse.json({
      success: true,
      message: statusMessage,
      status: updatedCard.status,
    })
  } catch (error) {
    console.error('Freeze gold card error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تغییر وضعیت کارت' },
      { status: 500 }
    )
  }
}

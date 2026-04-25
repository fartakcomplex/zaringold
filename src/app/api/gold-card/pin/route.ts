import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/gold-card/pin
 * Body: { userId, oldPin, newPin }
 * Verifies old PIN and updates to new PIN (must be 4 digits)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, oldPin, newPin } = await request.json()

    if (!userId || !oldPin || !newPin) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر، رمز فعلی و رمز جدید الزامی است' },
        { status: 400 }
      )
    }

    // Validate PIN format (exactly 4 digits)
    if (!/^\d{4}$/.test(newPin)) {
      return NextResponse.json(
        { success: false, message: 'رمز جدید باید دقیقاً ۴ رقم باشد' },
        { status: 400 }
      )
    }

    // Prevent reusing same PIN
    if (oldPin === newPin) {
      return NextResponse.json(
        { success: false, message: 'رمز جدید نباید با رمز فعلی یکسان باشد' },
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

    // Verify old PIN
    if (card.pin !== oldPin) {
      return NextResponse.json(
        { success: false, message: 'رمز فعلی اشتباه است' },
        { status: 400 }
      )
    }

    // Update PIN
    await db.goldCard.update({
      where: { userId },
      data: { pin: newPin },
    })

    return NextResponse.json({
      success: true,
      message: 'رمز کارت با موفقیت تغییر کرد',
    })
  } catch (error) {
    console.error('Change PIN error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تغییر رمز کارت' },
      { status: 500 }
    )
  }
}

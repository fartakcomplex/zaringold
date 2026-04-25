import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

// ── POST: Add XP to user ──
export async function POST(request: NextRequest) {
  try {
    const { userId, amount, reason } = await request.json()

    if (!userId || amount === undefined || amount === null) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و مقدار XP الزامی است' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'مقدار XP باید بیشتر از صفر باشد' },
        { status: 400 }
      )
    }

    // Get or create gamification profile
    let gamification = await db.userGamification.findUnique({
      where: { userId },
    })

    if (!gamification) {
      gamification = await db.userGamification.create({
        data: { userId },
      })
    }

    const newXp = gamification.xp + amount
    const oldLevel = calculateLevel(gamification.xp)
    const newLevel = calculateLevel(newXp)
    const leveledUp = newLevel > oldLevel

    await db.userGamification.update({
      where: { userId },
      data: {
        xp: newXp,
        level: newLevel,
      },
    })

    return NextResponse.json({
      success: true,
      message: leveledUp
        ? `تبریک! شما به سطح ${newLevel} ارتقا یافتید`
        : `${amount} XP اضافه شد`,
      xp: {
        added: amount,
        total: newXp,
        oldLevel,
        newLevel,
        leveledUp,
        reason: reason || null,
      },
    })
  } catch (error) {
    console.error('XP add error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در افزودن XP' },
      { status: 500 }
    )
  }
}

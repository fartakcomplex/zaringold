import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: General leaderboard by XP ──
export async function GET(_request: NextRequest) {
  try {
    const leaders = await db.userGamification.findMany({
      orderBy: [
        { xp: 'desc' },
        { currentStreak: 'desc' },
      ],
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            avatar: true,
          },
        },
      },
    })

    const leaderboard = leaders.map((g, index) => ({
      rank: index + 1,
      userId: g.userId,
      fullName: g.user.fullName || g.user.phone?.replace(/(\d{4})\d{4}(\d{3})/, '$1****$2') || 'ناشناس',
      avatar: g.user.avatar,
      xp: g.xp,
      level: g.level,
      streak: g.currentStreak,
      badges: g.totalBadges,
      checkIns: g.checkInCount,
    }))

    return NextResponse.json({
      success: true,
      leaderboard,
      totalParticipants: leaders.length,
    })
  } catch (error) {
    console.error('General leaderboard error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت جدول رده‌بندی' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: Prediction game leaderboard ──
export async function GET(_request: NextRequest) {
  try {
    const leaders = await db.userGamification.findMany({
      where: {
        predictionScore: { gt: 0 },
      },
      orderBy: [
        { predictionScore: 'desc' },
        { xp: 'desc' },
      ],
      take: 10,
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
      score: g.predictionScore,
      xp: g.xp,
      level: g.level,
      correctPredictions: g.predictionScore,
    }))

    return NextResponse.json({
      success: true,
      leaderboard,
      totalParticipants: leaders.length,
    })
  } catch (error) {
    console.error('Prediction leaderboard error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت جدول رده‌بندی پیش‌بینی‌ها' },
      { status: 500 }
    )
  }
}

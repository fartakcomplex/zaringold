import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: Reward history ──
// Paginated QuestRewardTransaction list with totals
export async function GET(request: NextRequest) {
  try {
    const userId = '1' // Demo user
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20))
    const source = searchParams.get('source') // mission, streak, leaderboard, special_event

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = { userId }
    if (source) where.source = source

    // Get total count and aggregates
    const [total, totalXpResult, totalGoldResult] = await Promise.all([
      db.questRewardTransaction.count({ where }),
      db.questRewardTransaction.aggregate({
        where,
        _sum: { xpEarned: true },
      }),
      db.questRewardTransaction.aggregate({
        where,
        _sum: { goldMg: true },
      }),
    ])

    const totalXp = totalXpResult._sum.xpEarned || 0
    const totalGold = totalGoldResult._sum.goldMg || 0

    // Get paginated transactions
    const transactions = await db.questRewardTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    // Aggregate by source for summary
    const sourceBreakdown = await db.questRewardTransaction.groupBy({
      by: ['source'],
      where: { userId },
      _sum: {
        xpEarned: true,
        goldMg: true,
      },
      _count: {
        id: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        totals: {
          totalXp,
          totalGoldMg: Math.round(totalGold * 1000) / 1000,
          totalTransactions: total,
        },
        sourceBreakdown: sourceBreakdown.map((s) => ({
          source: s.source,
          count: s._count.id,
          xpEarned: s._sum.xpEarned || 0,
          goldMg: Math.round((s._sum.goldMg || 0) * 1000) / 1000,
        })),
      },
    })
  } catch (error) {
    console.error('Quest rewards error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load reward history' },
      { status: 500 }
    )
  }
}

import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const DEMO_USER_ID = '1'

// ─── GET: Creator rewards history ───
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const tier = searchParams.get('tier') || undefined
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: Record<string, unknown> = { userId: DEMO_USER_ID }

    if (tier) {
      where.tier = tier
    }

    // Get total count and sum
    const [total, goldAgg] = await Promise.all([
      db.creatorReward.count({ where }),
      db.creatorReward.aggregate({
        where,
        _sum: { goldMg: true },
      }),
    ])

    const totalGoldMg = goldAgg._sum.goldMg || 0

    // Get rewards
    const rewards = await db.creatorReward.findMany({
      where,
      orderBy: { [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        submission: {
          select: {
            id: true,
            platform: true,
            postUrl: true,
            aiScore: true,
            status: true,
            createdAt: true,
          },
        },
      },
    })

    // Tier breakdown
    const tierBreakdown = await db.creatorReward.groupBy({
      by: ['tier'],
      where: { userId: DEMO_USER_ID, isActive: true },
      _sum: { goldMg: true },
      _count: { id: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        rewards,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        summary: {
          totalGoldMg: parseFloat(totalGoldMg.toFixed(2)),
          totalRewards: total,
          estimatedFiatIRR: parseFloat((totalGoldMg * 3500000).toFixed(0)), // approximate value
          tierBreakdown: tierBreakdown.map((tb) => ({
            tier: tb.tier,
            goldMg: parseFloat((tb._sum.goldMg || 0).toFixed(2)),
            count: tb._count.id,
          })),
        },
      },
    })
  } catch (error) {
    console.error('[Creator Rewards GET]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rewards' },
      { status: 500 }
    )
  }
}

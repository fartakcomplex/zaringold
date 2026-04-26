import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const DEMO_USER_ID = '1'

// ─── GET: Get user's submissions with optional status filter ───
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const platform = searchParams.get('platform') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: Record<string, unknown> = { userId: DEMO_USER_ID }

    if (status) {
      where.status = status
    }

    if (platform) {
      where.platform = platform
    }

    // Get total count
    const total = await db.creatorSubmission.count({ where })

    // Get submissions
    const submissions = await db.creatorSubmission.findMany({
      where,
      orderBy: { [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        campaign: {
          select: { id: true, title: true, titleFa: true, tier: true, rewardMg: true },
        },
        rewards: {
          select: { id: true, goldMg: true, tier: true, reason: true, createdAt: true },
        },
      },
    })

    // Aggregate stats
    const stats = await db.creatorSubmission.aggregate({
      where: { userId: DEMO_USER_ID },
      _count: { id: true },
      _sum: { aiScore: true, rewardMg: true, estimatedViews: true },
      _avg: { aiScore: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        submissions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          total: stats._count.id,
          averageScore: stats._avg.aiScore ? parseFloat(stats._avg.aiScore.toFixed(1)) : 0,
          totalRewardMg: stats._sum.rewardMg || 0,
          totalEstimatedViews: stats._sum.estimatedViews || 0,
        },
      },
    })
  } catch (error) {
    console.error('[Creator Submissions GET]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

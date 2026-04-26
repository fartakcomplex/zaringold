import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/security/auth-guard';

// ─── GET: All submissions for admin review (paginated, filterable) ───
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const platform = searchParams.get('platform') || undefined
    const tier = searchParams.get('tier') || undefined
    const isFlagged = searchParams.get('isFlagged')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const search = searchParams.get('search') || undefined

    // Build where clause
    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (platform) {
      where.platform = platform
    }

    if (isFlagged === 'true') {
      where.isFlagged = true
    }

    if (search) {
      where.OR = [
        { postUrl: { contains: search } },
        { userId: { contains: search } },
      ]
    }

    // Filter by campaign tier if specified
    if (tier) {
      where.campaign = { tier }
    }

    // Get total count
    const total = await db.creatorSubmission.count({ where })

    // Get submissions with creator and campaign info
    const submissions = await db.creatorSubmission.findMany({
      where,
      orderBy: { [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        creator: {
          select: {
            id: true,
            level: true,
            score: true,
            totalPosts: true,
            approvedPosts: true,
            isBanned: true,
          },
        },
        campaign: {
          select: {
            id: true,
            title: true,
            tier: true,
            rewardMg: true,
          },
        },
        rewards: {
          select: {
            id: true,
            goldMg: true,
            tier: true,
            reason: true,
          },
        },
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

    // Status summary
    const statusSummary = await db.creatorSubmission.groupBy({
      by: ['status'],
      _count: { status: true },
    })

    // Flagged count
    const flaggedCount = await db.creatorSubmission.count({
      where: { isFlagged: true },
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
        filters: {
          statusSummary: statusSummary.map((s) => ({
            status: s.status,
            count: s._count.status,
          })),
          flaggedCount,
        },
      },
    })
  } catch (error) {
    console.error('[Admin Creator Submissions GET]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

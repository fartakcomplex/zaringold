import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/security/auth-guard';

/* ------------------------------------------------------------------ */
/*  GET /api/admin/social — List all social posts                     */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const postType = searchParams.get('postType') || undefined
    const search = searchParams.get('search') || undefined

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (postType) {
      where.postType = postType
    }

    if (search) {
      where.OR = [
        { content: { contains: search } },
        { user: { phone: { contains: search } } },
        { user: { fullName: { contains: search } } },
      ]
    }

    const [posts, total] = await Promise.all([
      db.socialPost.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              fullName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.socialPost.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    // Summary stats
    const summary = await db.socialPost.aggregate({
      _sum: { likes: true },
      _count: { id: true },
    })

    const tradeCount = await db.socialPost.count({ where: { postType: 'trade' } })
    const anonymousCount = await db.socialPost.count({ where: { isAnonymous: true } })

    return NextResponse.json({
      success: true,
      data: posts,
      total,
      page,
      totalPages,
      summary: {
        totalPosts: summary._count.id,
        totalLikes: summary._sum.likes || 0,
        tradePosts: tradeCount,
        anonymousPosts: anonymousCount,
      },
      message: 'لیست پست‌های اجتماعی دریافت شد',
    })
  } catch (error) {
    console.error('Admin get social error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست پست‌ها' },
      { status: 500 }
    )
  }
}

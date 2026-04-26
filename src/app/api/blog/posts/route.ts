import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ------------------------------------------------------------------ */
/*  GET /api/blog/posts — List published posts (public)               */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || undefined
    const categorySlug = searchParams.get('category') || undefined
    const tagSlug = searchParams.get('tag') || undefined
    const featured = searchParams.get('featured')

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      status: 'published',
      publishedAt: { not: null },
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
      ]
    }

    if (categorySlug) {
      where.category = { slug: categorySlug, isActive: true }
    }

    if (tagSlug) {
      where.tags = {
        some: {
          tag: { slug: tagSlug },
        },
      }
    }

    if (featured !== null && featured !== undefined) {
      where.isFeatured = featured === 'true'
    }

    const [posts, total] = await Promise.all([
      db.blogPost.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImage: true,
          readTime: true,
          viewCount: true,
          isFeatured: true,
          publishedAt: true,
          createdAt: true,
          category: {
            select: { id: true, name: true, slug: true, color: true },
          },
          tags: {
            select: {
              tag: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.blogPost.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      posts,
      total,
      page,
      totalPages,
    })
  } catch (error) {
    console.error('Public get blog posts error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست مقالات' },
      { status: 500 }
    )
  }
}

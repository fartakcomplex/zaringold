import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ------------------------------------------------------------------ */
/*  GET /api/blog/categories — List active categories (public)        */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    const categories = await db.blogCategory.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        color: true,
        icon: true,
        _count: {
          select: {
            posts: {
              where: {
                status: 'published',
                publishedAt: { not: null },
              },
            },
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({
      success: true,
      categories: categories.map((cat) => ({
        ...cat,
        postCount: cat._count.posts,
      })),
    })
  } catch (error) {
    console.error('Public get blog categories error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت دسته‌بندی‌ها' },
      { status: 500 }
    )
  }
}

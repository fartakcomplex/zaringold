import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/security/auth-guard';

/* ------------------------------------------------------------------ */
/*  Slug & Read Time Helpers                                           */
/* ------------------------------------------------------------------ */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function calculateReadTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, '')
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

/* ------------------------------------------------------------------ */
/*  Auth Helper                                                        */
/* ------------------------------------------------------------------ */
async function checkAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const session = await db.userSession.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!session?.user || !['admin', 'super_admin'].includes(session.user.role)) {
    return null
  }
  return session.user
}

/* ------------------------------------------------------------------ */
/*  GET /api/admin/blog/posts — List all posts                        */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const user = await checkAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined
    const categoryId = searchParams.get('categoryId') || undefined
    const isFeatured = searchParams.get('isFeatured')

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (isFeatured !== null && isFeatured !== undefined) {
      where.isFeatured = isFeatured === 'true'
    }

    const [posts, total] = await Promise.all([
      db.blogPost.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true, color: true } },
          author: { select: { id: true, fullName: true, phone: true } },
          tags: {
            include: {
              tag: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
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
    console.error('Admin get blog posts error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست مقالات' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/blog/posts — Create a new post                    */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const user = await checkAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      categoryId,
      status,
      seoTitle,
      seoDesc,
      readTime,
      isFeatured,
      tagIds,
    } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, message: 'عنوان مقاله الزامی است' },
        { status: 400 }
      )
    }

    const finalSlug = slug?.trim() || generateSlug(title)

    // Check slug uniqueness
    const existingSlug = await db.blogPost.findUnique({ where: { slug: finalSlug } })
    if (existingSlug) {
      return NextResponse.json(
        { success: false, message: 'این slug قبلاً استفاده شده است' },
        { status: 409 }
      )
    }

    const finalReadTime = readTime || calculateReadTime(content || '')
    const isPublished = status === 'published'
    const publishedAt = isPublished ? new Date() : null

    const post = await db.blogPost.create({
      data: {
        title: title.trim(),
        slug: finalSlug,
        content: content || '',
        excerpt: excerpt || '',
        featuredImage: featuredImage || null,
        categoryId: categoryId || null,
        status: status || 'draft',
        seoTitle: seoTitle || null,
        seoDesc: seoDesc || null,
        readTime: finalReadTime,
        isFeatured: isFeatured === true,
        publishedAt,
        authorId: user.id,
        tags: {
          create: (tagIds || []).map((tagId: string) => ({
            tag: { connect: { id: tagId } },
          })),
        },
      },
      include: {
        category: { select: { id: true, name: true, slug: true, color: true } },
        author: { select: { id: true, fullName: true, phone: true } },
        tags: {
          include: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'مقاله با موفقیت ایجاد شد',
      post,
    })
  } catch (error) {
    console.error('Admin create blog post error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد مقاله' },
      { status: 500 }
    )
  }
}

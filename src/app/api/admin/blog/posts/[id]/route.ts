import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
/*  GET /api/admin/blog/posts/[id] — Get single post                  */
/* ------------------------------------------------------------------ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const post = await db.blogPost.findUnique({
      where: { id },
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

    if (!post) {
      return NextResponse.json(
        { success: false, message: 'مقاله یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      post,
    })
  } catch (error) {
    console.error('Admin get blog post error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت مقاله' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /api/admin/blog/posts/[id] — Update post                      */
/* ------------------------------------------------------------------ */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await db.blogPost.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'مقاله یافت نشد' },
        { status: 404 }
      )
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

    // Check slug uniqueness if slug changed
    if (slug && slug !== existing.slug) {
      const existingSlug = await db.blogPost.findUnique({ where: { slug } })
      if (existingSlug) {
        return NextResponse.json(
          { success: false, message: 'این slug قبلاً استفاده شده است' },
          { status: 409 }
        )
      }
    }

    const finalSlug = slug || (title ? generateSlug(title) : existing.slug)
    const finalReadTime = readTime || calculateReadTime(content || existing.content)
    const isPublished = status === 'published'

    // If status changes from draft to published and publishedAt is null, set it
    let publishedAt = existing.publishedAt
    if (isPublished && existing.status !== 'published' && !existing.publishedAt) {
      publishedAt = new Date()
    }
    // If status changes back to draft, clear publishedAt
    if (status === 'draft') {
      publishedAt = null
    }

    // Handle tags: delete old, create new
    if (tagIds !== undefined) {
      await db.blogPostTag.deleteMany({ where: { postId: id } })
    }

    const post = await db.blogPost.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(finalSlug !== undefined ? { slug: finalSlug } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(excerpt !== undefined ? { excerpt } : {}),
        ...(featuredImage !== undefined ? { featuredImage: featuredImage || null } : {}),
        ...(categoryId !== undefined ? { categoryId: categoryId || null } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(seoTitle !== undefined ? { seoTitle: seoTitle || null } : {}),
        ...(seoDesc !== undefined ? { seoDesc: seoDesc || null } : {}),
        readTime: finalReadTime,
        ...(isFeatured !== undefined ? { isFeatured } : {}),
        ...(publishedAt !== existing.publishedAt ? { publishedAt } : {}),
        ...(tagIds !== undefined
          ? {
              tags: {
                create: tagIds.map((tagId: string) => ({
                  tag: { connect: { id: tagId } },
                })),
              },
            }
          : {}),
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
      message: 'مقاله با موفقیت بروزرسانی شد',
      post,
    })
  } catch (error) {
    console.error('Admin update blog post error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی مقاله' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/admin/blog/posts/[id] — Delete post                   */
/* ------------------------------------------------------------------ */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await db.blogPost.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'مقاله یافت نشد' },
        { status: 404 }
      )
    }

    await db.blogPost.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'مقاله با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('Admin delete blog post error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف مقاله' },
      { status: 500 }
    )
  }
}

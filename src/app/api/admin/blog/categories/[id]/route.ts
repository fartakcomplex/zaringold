import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/security/auth-guard';

/* ------------------------------------------------------------------ */
/*  Slug Helper                                                        */
/* ------------------------------------------------------------------ */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
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
/*  GET /api/admin/blog/categories/[id] — Get single category         */
/* ------------------------------------------------------------------ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const user = await checkAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const category = await db.blogCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      category,
    })
  } catch (error) {
    console.error('Admin get blog category error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت دسته‌بندی' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /api/admin/blog/categories/[id] — Update category             */
/* ------------------------------------------------------------------ */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const user = await checkAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await db.blogCategory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, slug, description, color, icon, sortOrder, isActive } = body

    // Check slug uniqueness if slug changed
    if (slug && slug !== existing.slug) {
      const existingSlug = await db.blogCategory.findUnique({ where: { slug } })
      if (existingSlug) {
        return NextResponse.json(
          { success: false, message: 'این slug قبلاً استفاده شده است' },
          { status: 409 }
        )
      }
    }

    const finalSlug = slug || (name ? generateSlug(name) : existing.slug)

    const category = await db.blogCategory.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(finalSlug !== undefined ? { slug: finalSlug } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(icon !== undefined ? { icon } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'دسته‌بندی با موفقیت بروزرسانی شد',
      category,
    })
  } catch (error) {
    console.error('Admin update blog category error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی دسته‌بندی' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/admin/blog/categories/[id] — Delete category          */
/* ------------------------------------------------------------------ */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const user = await checkAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await db.blogCategory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      )
    }

    // Set categoryId to null on posts that belong to this category
    await db.blogPost.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    })

    await db.blogCategory.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'دسته‌بندی با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('Admin delete blog category error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف دسته‌بندی' },
      { status: 500 }
    )
  }
}

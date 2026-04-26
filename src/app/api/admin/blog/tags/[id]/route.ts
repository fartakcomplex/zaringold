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
/*  GET /api/admin/blog/tags/[id] — Get single tag                    */
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

    const tag = await db.blogTag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    })

    if (!tag) {
      return NextResponse.json(
        { success: false, message: 'برچسب یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      tag,
    })
  } catch (error) {
    console.error('Admin get blog tag error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت برچسب' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /api/admin/blog/tags/[id] — Update tag                        */
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

    const existing = await db.blogTag.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'برچسب یافت نشد' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, slug } = body

    // Check name uniqueness if name changed
    if (name && name !== existing.name) {
      const existingName = await db.blogTag.findUnique({ where: { name: name.trim() } })
      if (existingName) {
        return NextResponse.json(
          { success: false, message: 'این نام برچسب قبلاً وجود دارد' },
          { status: 409 }
        )
      }
    }

    // Check slug uniqueness if slug changed
    const finalSlug = slug || (name ? generateSlug(name) : existing.slug)
    if (finalSlug !== existing.slug) {
      const existingSlug = await db.blogTag.findUnique({ where: { slug: finalSlug } })
      if (existingSlug) {
        return NextResponse.json(
          { success: false, message: 'این slug قبلاً استفاده شده است' },
          { status: 409 }
        )
      }
    }

    const tag = await db.blogTag.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(finalSlug !== undefined ? { slug: finalSlug } : {}),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'برچسب با موفقیت بروزرسانی شد',
      tag,
    })
  } catch (error) {
    console.error('Admin update blog tag error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی برچسب' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/admin/blog/tags/[id] — Delete tag                     */
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

    const existing = await db.blogTag.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'برچسب یافت نشد' },
        { status: 404 }
      )
    }

    // BlogPostTag entries will be cascade deleted
    await db.blogTag.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'برچسب با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('Admin delete blog tag error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف برچسب' },
      { status: 500 }
    )
  }
}

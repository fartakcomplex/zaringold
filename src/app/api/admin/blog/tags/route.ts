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
/*  GET /api/admin/blog/tags — List all tags                          */
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
    const search = searchParams.get('search') || undefined

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
      ]
    }

    const tags = await db.blogTag.findMany({
      where,
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      tags,
    })
  } catch (error) {
    console.error('Admin get blog tags error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست برچسب‌ها' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/blog/tags — Create a new tag                      */
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
    const { name, slug } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: 'نام برچسب الزامی است' },
        { status: 400 }
      )
    }

    const finalSlug = slug?.trim() || generateSlug(name)

    // Check name uniqueness
    const existingName = await db.blogTag.findUnique({ where: { name: name.trim() } })
    if (existingName) {
      return NextResponse.json(
        { success: false, message: 'این نام برچسب قبلاً وجود دارد' },
        { status: 409 }
      )
    }

    // Check slug uniqueness
    const existingSlug = await db.blogTag.findUnique({ where: { slug: finalSlug } })
    if (existingSlug) {
      return NextResponse.json(
        { success: false, message: 'این slug قبلاً استفاده شده است' },
        { status: 409 }
      )
    }

    const tag = await db.blogTag.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'برچسب با موفقیت ایجاد شد',
      tag,
    })
  } catch (error) {
    console.error('Admin create blog tag error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد برچسب' },
      { status: 500 }
    )
  }
}

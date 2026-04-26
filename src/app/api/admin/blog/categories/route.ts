import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
/*  GET /api/admin/blog/categories — List all categories              */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const user = await checkAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await db.blogCategory.findMany({
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({
      success: true,
      categories,
    })
  } catch (error) {
    console.error('Admin get blog categories error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست دسته‌بندی‌ها' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/blog/categories — Create a new category           */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const user = await checkAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, description, color, icon, sortOrder, isActive } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: 'نام دسته‌بندی الزامی است' },
        { status: 400 }
      )
    }

    const finalSlug = slug?.trim() || generateSlug(name)

    // Check slug uniqueness
    const existingSlug = await db.blogCategory.findUnique({ where: { slug: finalSlug } })
    if (existingSlug) {
      return NextResponse.json(
        { success: false, message: 'این slug قبلاً استفاده شده است' },
        { status: 409 }
      )
    }

    const category = await db.blogCategory.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description?.trim() || null,
        color: color || '#D4AF37',
        icon: icon || 'BookOpen',
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        isActive: isActive !== false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'دسته‌بندی با موفقیت ایجاد شد',
      category,
    })
  } catch (error) {
    console.error('Admin create blog category error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد دسته‌بندی' },
      { status: 500 }
    )
  }
}

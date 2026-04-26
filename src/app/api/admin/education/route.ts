import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ------------------------------------------------------------------ */
/*  GET /api/admin/education — List all lessons                       */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category') || undefined
    const type = searchParams.get('type') || undefined
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (category) {
      where.category = category
    }

    if (type) {
      where.type = type
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { titleFa: { contains: search } },
        { description: { contains: search } },
        { descriptionFa: { contains: search } },
      ]
    }

    const [lessons, total] = await Promise.all([
      db.educationLesson.findMany({
        where,
        include: {
          _count: {
            select: {
              favorites: true,
              progresses: true,
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      db.educationLesson.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    // Summary stats
    const totalLessons = await db.educationLesson.count()
    const activeLessons = await db.educationLesson.count({ where: { isActive: true } })
    const totalViews = await db.educationLesson.aggregate({ _sum: { views: true } })
    const totalFavorites = await db.userFavoriteLesson.count()
    const totalCompleted = await db.userLessonProgress.count({ where: { isCompleted: true } })

    return NextResponse.json({
      success: true,
      data: lessons,
      total,
      page,
      totalPages,
      summary: {
        totalLessons,
        activeLessons,
        totalViews: totalViews._sum.views || 0,
        totalFavorites,
        totalCompleted,
      },
      message: 'لیست دروس آموزشی دریافت شد',
    })
  } catch (error) {
    console.error('Admin get education error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست دروس' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/education — Create a new lesson                   */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      titleFa,
      description,
      descriptionFa,
      type,
      category,
      url,
      content,
      contentFa,
      thumbnail,
      duration,
      sortOrder,
      isActive,
      isPremium,
    } = body

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: 'عنوان درس الزامی است' },
        { status: 400 }
      )
    }

    if (!['video', 'article'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'نوع درس نامعتبر (video, article)' },
        { status: 400 }
      )
    }

    if (!['technical_analysis', 'economy', 'buying_tips', 'risk_management'].includes(category)) {
      return NextResponse.json(
        { success: false, message: 'دسته‌بندی نامعتبر' },
        { status: 400 }
      )
    }

    const lesson = await db.educationLesson.create({
      data: {
        title: title.trim(),
        titleFa: titleFa?.trim() || '',
        description: description?.trim() || '',
        descriptionFa: descriptionFa?.trim() || '',
        type,
        category,
        url: url || '',
        content: content || '',
        contentFa: contentFa || '',
        thumbnail: thumbnail || null,
        duration: duration ? Number(duration) : 0,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        isActive: isActive !== false,
        isPremium: isPremium === true,
      },
    })

    return NextResponse.json({
      success: true,
      data: lesson,
      message: 'درس آموزشی با موفقیت ایجاد شد',
    })
  } catch (error) {
    console.error('Admin create education error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد درس آموزشی' },
      { status: 500 }
    )
  }
}

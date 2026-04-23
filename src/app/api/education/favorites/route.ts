import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/education/favorites — List user's favorite lessons
 * POST /api/education/favorites — Toggle favorite (add/remove)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const favorites = await db.userFavoriteLesson.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            titleFa: true,
            description: true,
            descriptionFa: true,
            type: true,
            category: true,
            thumbnail: true,
            duration: true,
            views: true,
            isPremium: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get progress for each lesson
    const lessonIds = favorites.map((f) => f.lessonId)
    const progresses = lessonIds.length > 0
      ? await db.userLessonProgress.findMany({
          where: { userId, lessonId: { in: lessonIds } },
        })
      : []

    const progressMap = new Map(
      progresses.map((p) => [p.lessonId, { progress: p.progress, isCompleted: p.isCompleted }])
    )

    const lessonsWithProgress = favorites.map((f) => ({
      ...f.lesson,
      isFavorite: true,
      favoritedAt: f.createdAt,
      userProgress: progressMap.get(f.lessonId)?.progress || 0,
      isCompleted: progressMap.get(f.lessonId)?.isCompleted || false,
    }))

    return NextResponse.json({
      success: true,
      data: {
        lessons: lessonsWithProgress,
        count: lessonsWithProgress.length,
      },
    })
  } catch (error) {
    console.error('[Education/Favorites GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست علاقه‌مندی‌ها' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, lessonId } = await request.json()

    if (!userId || !lessonId) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر و درس الزامی است' },
        { status: 400 }
      )
    }

    // Check if lesson exists
    const lesson = await db.educationLesson.findUnique({ where: { id: lessonId } })
    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'درس یافت نشد' },
        { status: 404 }
      )
    }

    // Check if already favorited
    const existing = await db.userFavoriteLesson.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    })

    if (existing) {
      // Remove from favorites
      await db.userFavoriteLesson.delete({
        where: { id: existing.id },
      })
      return NextResponse.json({
        success: true,
        message: 'از علاقه‌مندی‌ها حذف شد',
        isFavorite: false,
      })
    } else {
      // Add to favorites
      await db.userFavoriteLesson.create({
        data: { userId, lessonId },
      })
      return NextResponse.json({
        success: true,
        message: 'به علاقه‌مندی‌ها اضافه شد',
        isFavorite: true,
      })
    }
  } catch (error) {
    console.error('[Education/Favorites POST] Error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در تغییر وضعیت علاقه‌مندی' },
      { status: 500 }
    )
  }
}

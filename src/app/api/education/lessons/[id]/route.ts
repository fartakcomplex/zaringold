import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/education/lessons/[id] — Get single lesson with user progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const lesson = await db.educationLesson.findUnique({
      where: { id },
    })

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'درس یافت نشد' },
        { status: 404 }
      )
    }

    // Increment view count
    await db.educationLesson.update({
      where: { id },
      data: { views: { increment: 1 } },
    })

    // Get user's favorite status and progress
    let isFavorite = false
    let userProgress: { progress: number; isCompleted: boolean } | null = null

    if (userId) {
      const [favorite, progress] = await Promise.all([
        db.userFavoriteLesson.findUnique({
          where: { userId_lessonId: { userId, lessonId: id } },
          select: { id: true },
        }),
        db.userLessonProgress.findUnique({
          where: { userId_lessonId: { userId, lessonId: id } },
        }),
      ])

      isFavorite = !!favorite
      if (progress) {
        userProgress = {
          progress: progress.progress,
          isCompleted: progress.isCompleted,
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...lesson,
        views: lesson.views + 1,
        isFavorite,
        userProgress,
      },
    })
  } catch (error) {
    console.error('[Education/Lessons/[id] GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اطلاعات درس' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/education/progress — Update lesson progress (0-100)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, lessonId, progress } = await request.json()

    if (!userId || !lessonId) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر و درس الزامی است' },
        { status: 400 }
      )
    }

    // Validate progress
    const progressValue = Math.min(100, Math.max(0, parseInt(progress, 10) || 0))
    const isCompleted = progressValue >= 100

    // Check if lesson exists
    const lesson = await db.educationLesson.findUnique({ where: { id: lessonId } })
    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'درس یافت نشد' },
        { status: 404 }
      )
    }

    // Upsert progress
    const updated = await db.userLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {
        progress: progressValue,
        isCompleted,
      },
      create: {
        userId,
        lessonId,
        progress: progressValue,
        isCompleted,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        progress: updated.progress,
        isCompleted: updated.isCompleted,
        lessonId,
      },
      message: isCompleted ? 'درس با موفقیت تکمیل شد!' : `پیشرفت به ${progressValue}% به‌روزرسانی شد`,
    })
  } catch (error) {
    console.error('[Education/Progress POST] Error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در ثبت پیشرفت درس' },
      { status: 500 }
    )
  }
}

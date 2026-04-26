import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ------------------------------------------------------------------ */
/*  PUT /api/admin/education/[id] — Update a lesson                   */
/* ------------------------------------------------------------------ */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.educationLesson.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'درس پیدا نشد' },
        { status: 404 }
      )
    }

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

    const updateData: Record<string, unknown> = {}

    if (title !== undefined) updateData.title = String(title).trim()
    if (titleFa !== undefined) updateData.titleFa = String(titleFa).trim()
    if (description !== undefined) updateData.description = String(description).trim()
    if (descriptionFa !== undefined) updateData.descriptionFa = String(descriptionFa).trim()
    if (type !== undefined) updateData.type = type
    if (category !== undefined) updateData.category = category
    if (url !== undefined) updateData.url = String(url)
    if (content !== undefined) updateData.content = String(content)
    if (contentFa !== undefined) updateData.contentFa = String(contentFa)
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail || null
    if (duration !== undefined) updateData.duration = Number(duration)
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder)
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)
    if (isPremium !== undefined) updateData.isPremium = Boolean(isPremium)

    const lesson = await db.educationLesson.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: lesson,
      message: 'درس آموزشی با موفقیت بروزرسانی شد',
    })
  } catch (error) {
    console.error('Admin update education error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی درس' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/admin/education/[id] — Delete a lesson                */
/* ------------------------------------------------------------------ */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.educationLesson.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'درس پیدا نشد' },
        { status: 404 }
      )
    }

    await db.educationLesson.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'درس آموزشی با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('Admin delete education error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف درس' },
      { status: 500 }
    )
  }
}

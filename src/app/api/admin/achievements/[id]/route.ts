import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ------------------------------------------------------------------ */
/*  PUT /api/admin/achievements/[id] — Update an achievement          */
/* ------------------------------------------------------------------ */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.achievement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'دستاورد پیدا نشد' },
        { status: 404 }
      )
    }

    const { slug, title, description, icon, category, xpReward, goldRewardMg, sortOrder, isHidden } = body

    const updateData: Record<string, unknown> = {}

    if (slug !== undefined) {
      // Check slug uniqueness
      if (slug !== existing.slug) {
        const existingSlug = await db.achievement.findUnique({ where: { slug: String(slug).trim() } })
        if (existingSlug) {
          return NextResponse.json(
            { success: false, message: 'اسلاگ باید یکتا باشد' },
            { status: 409 }
          )
        }
      }
      updateData.slug = String(slug).trim()
    }
    if (title !== undefined) updateData.title = String(title).trim()
    if (description !== undefined) updateData.description = String(description).trim()
    if (icon !== undefined) updateData.icon = String(icon).trim()
    if (category !== undefined) updateData.category = String(category).trim()
    if (xpReward !== undefined) updateData.xpReward = Number(xpReward)
    if (goldRewardMg !== undefined) updateData.goldRewardMg = Number(goldRewardMg)
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder)
    if (isHidden !== undefined) updateData.isHidden = Boolean(isHidden)

    const achievement = await db.achievement.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: achievement,
      message: 'دستاورد با موفقیت بروزرسانی شد',
    })
  } catch (error) {
    console.error('Admin update achievement error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی دستاورد' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/admin/achievements/[id] — Delete an achievement       */
/* ------------------------------------------------------------------ */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.achievement.findUnique({
      where: { id },
      include: {
        _count: { select: { earnedBy: true } },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'دستاورد پیدا نشد' },
        { status: 404 }
      )
    }

    // Warn if users have earned this achievement
    const earnedCount = existing._count.earnedBy

    await db.achievement.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: earnedCount > 0
        ? `دستاورد حذف شد (${earnedCount} کاربر این دستاورد را کسب کرده بودند)`
        : 'دستاورد با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('Admin delete achievement error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف دستاورد' },
      { status: 500 }
    )
  }
}

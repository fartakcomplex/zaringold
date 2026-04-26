import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/security/auth-guard';

/* ------------------------------------------------------------------ */
/*  GET /api/admin/achievements — List all achievements               */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const achievements = await db.achievement.findMany({
      include: {
        _count: {
          select: { earnedBy: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({
      success: true,
      data: achievements,
      total: achievements.length,
      message: 'لیست دستاوردها دریافت شد',
    })
  } catch (error) {
    console.error('Admin get achievements error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست دستاوردها' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/achievements — Create a new achievement           */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { slug, title, description, icon, category, xpReward, goldRewardexport async function POST(!slug || !slug.trim(): NextRequest) {
    const auth = await requireAdmin(!slug || !slug.trim());
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

      return NextResponse.json(
        { success: false, message: 'اسلاگ الزامی است' },
        { status: 400 }
      )
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: 'عنوان الزامی است' },
        { status: 400 }
      )
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { success: false, message: 'توضیحات الزامی است' },
        { status: 400 }
      )
    }

    // Check slug uniqueness
    const existingSlug = await db.achievement.findUnique({ where: { slug: slug.trim() } })
    if (existingSlug) {
      return NextResponse.json(
        { success: false, message: 'اسلاگ باید یکتا باشد' },
        { status: 409 }
      )
    }

    const achievement = await db.achievement.create({
      data: {
        slug: slug.trim(),
        title: title.trim(),
        description: description.trim(),
        icon: icon?.trim() || 'trophy',
        category: category?.trim() || 'general',
        xpReward: xpReward ? Number(xpReward) : 0,
        goldRewardMg: goldRewardMg ? Number(goldRewardMg) : 0,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        isHidden: isHidden === true,
      },
    })

    return NextResponse.json({
      success: true,
      data: achievement,
      message: 'دستاورد جدید با موفقیت ایجاد شد',
    })
  } catch (error) {
    console.error('Admin create achievement error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد دستاورد' },
      { status: 500 }
    )
  }
}

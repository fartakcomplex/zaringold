import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/security/auth-guard';

/* ------------------------------------------------------------------ */
/*  PUT /api/admin/goals/[id] — Update goal status                     */
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

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['active', 'completed', 'paused'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'وضعیت نامعتبر (active, completed, paused)' },
        { status: 400 }
      )
    }

    const existing = await db.savingGoal.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'هدف پیدا نشد' },
        { status: 404 }
      )
    }

    const goal = await db.savingGoal.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            fullName: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: goal,
      message: `وضعیت هدف به "${status === 'active' ? 'فعال' : status === 'completed' ? 'تکمیل شده' : 'متوقف'}" تغییر کرد`,
    })
  } catch (error) {
    console.error('Admin update goal error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی هدف' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/admin/goals/[id] — Delete a goal                      */
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

    const { id } = await params

    const existing = await db.savingGoal.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'هدف پیدا نشد' },
        { status: 404 }
      )
    }

    await db.savingGoal.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'هدف با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('Admin delete goal error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف هدف' },
      { status: 500 }
    )
  }
}

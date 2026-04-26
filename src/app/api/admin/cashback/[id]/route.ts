import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/security/auth-guard';

/* ------------------------------------------------------------------ */
/*  PUT /api/admin/cashback/[id] — Update reward status               */
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

    if (!status || !['pending', 'approved', 'claimed', 'expired', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'وضعیت نامعتبر (pending, approved, claimed, expired, cancelled)' },
        { status: 400 }
      )
    }

    const existing = await db.cashbackReward.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'پاداش پیدا نشد' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = { status }
    if (status === 'claimed') {
      updateData.claimedAt = new Date()
    }

    const reward = await db.cashbackReward.update({
      where: { id },
      data: updateData,
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
      data: reward,
      message: `وضعیت پاداش به "${status === 'pending' ? 'در انتظار' : status === 'approved' ? 'تایید شده' : status === 'claimed' ? 'دریافت شده' : status === 'expired' ? 'منقضی' : 'لغو شده'}" تغییر کرد`,
    })
  } catch (error) {
    console.error('Admin update cashback error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی پاداش' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/admin/cashback/[id] — Delete a reward                 */
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

    const existing = await db.cashbackReward.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'پاداش پیدا نشد' },
        { status: 404 }
      )
    }

    await db.cashbackReward.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'پاداش با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('Admin delete cashback error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف پاداش' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/security/auth-guard';

/* ------------------------------------------------------------------ */
/*  PUT /api/admin/vip/[userId] — Extend/cancel subscription           */
/* ------------------------------------------------------------------ */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { userId } = await params
    const body = await request.json()
    const { action, days, plan } = body

    if (!action || !['extend', 'cancel', 'upgrade'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'عمل نامعتبر (extend, cancel, upgrade)' },
        { status: 400 }
      )
    }

    // Find existing subscription
    let subscription = await db.vIPSubscription.findUnique({ where: { userId } })

    if (action === 'cancel') {
      if (!subscription) {
        return NextResponse.json(
          { success: false, message: 'اشتراک VIP برای این کاربر یافت نشد' },
          { status: 404 }
        )
      }

      subscription = await db.vIPSubscription.update({
        where: { userId },
        data: { isActive: false, autoRenew: false },
        include: {
          user: { select: { id: true, phone: true, fullName: true } },
        },
      })

      return NextResponse.json({
        success: true,
        data: subscription,
        message: 'اشتراک VIP با موفقیت لغو شد',
      })
    }

    if (action === 'extend') {
      if (!days || days <= 0) {
        return NextResponse.json(
          { success: false, message: 'تعداد روزها باید مثبت باشد' },
          { status: 400 }
        )
      }

      if (!subscription) {
        return NextResponse.json(
          { success: false, message: 'اشتراک VIP برای این کاربر یافت نشد. ابتدا اشتراک ایجاد کنید.' },
          { status: 404 }
        )
      }

      const newExpiry = new Date(
        Math.max(subscription.expiresAt.getTime(), Date.now()) + days * 24 * 60 * 60 * 1000
      )

      subscription = await db.vIPSubscription.update({
        where: { userId },
        data: {
          expiresAt: newExpiry,
          isActive: true,
        },
        include: {
          user: { select: { id: true, phone: true, fullName: true } },
        },
      })

      return NextResponse.json({
        success: true,
        data: subscription,
        message: `اشتراک VIP به مدت ${days} روز تمدید شد`,
      })
    }

    if (action === 'upgrade') {
      if (!plan || !['silver', 'gold', 'black'].includes(plan)) {
        return NextResponse.json(
          { success: false, message: 'پلن نامعتبر (silver, gold, black)' },
          { status: 400 }
        )
      }

      const planDurations: Record<string, number> = {
        silver: 30,
        gold: 30,
        black: 30,
      }

      const expiresAt = new Date(Date.now() + (planDurations[plan] || 30) * 24 * 60 * 60 * 1000)

      if (subscription) {
        subscription = await db.vIPSubscription.update({
          where: { userId },
          data: { plan, expiresAt, isActive: true, autoRenew: false },
          include: {
            user: { select: { id: true, phone: true, fullName: true } },
          },
        })
      } else {
        subscription = await db.vIPSubscription.create({
          data: { userId, plan, expiresAt, isActive: true, autoRenew: false },
          include: {
            user: { select: { id: true, phone: true, fullName: true } },
          },
        })
      }

      return NextResponse.json({
        success: true,
        data: subscription,
        message: `اشتراک VIP به پلن ${plan === 'silver' ? 'نقره‌ای' : plan === 'gold' ? 'طلایی' : 'مشکی'} ارتقا یافت`,
      })
    }

    return NextResponse.json(
      { success: false, message: 'عمل نامعتبر' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Admin update VIP error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی اشتراک VIP' },
      { status: 500 }
    )
  }
}

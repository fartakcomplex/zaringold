import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserAccess } from '@/lib/access'

// ── GET: VIP status (Super admin = Diamond always) ──
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    // Check access — super admin always gets Diamond
    const access = await getUserAccess(userId)

    if (access.isSuperAdmin) {
      return NextResponse.json({
        success: true,
        isVip: true,
        plan: 'diamond',
        planLabel: 'الماس 💎',
        isActive: true,
        expiresAt: null,
        daysRemaining: Infinity,
        isSuperAdmin: true,
        startedAt: null,
        autoRenew: true,
        features: [
          'کارمزد صفر معاملات',
          'تحلیل هوشمند AI',
          'سیگنال‌های طلایی',
          'تحلیل پیشرفته بازار',
          'پشتیبانی اختصاصی ۲۴/۷',
          'حساب‌مدیر ویژه',
          'هدیه ماهانه طلا',
          'دسترسی زودهنگام به امکانات',
          'نرخ تبدیل ویژه',
          'بدون محدودیت هشدار',
          'بدون محدودیت ارسال',
          'بدون محدودیت هدیه',
          'کش‌بک ۱۰ برابری',
        ],
        message: 'پلن الماس — سوپر ادمین',
      })
    }

    // For other users, check VIP subscription
    const subscription = await db.vIPSubscription.findUnique({
      where: { userId },
    })

    if (!subscription) {
      return NextResponse.json({
        success: true,
        isVip: false,
        plan: null,
        planLabel: null,
        isActive: false,
        expiresAt: null,
        daysRemaining: 0,
        message: 'اشتراک VIP فعالی یافت نشد',
      })
    }

    // Check if expired
    const now = new Date()
    const isExpired = subscription.expiresAt < now

    if (isExpired && subscription.isActive) {
      await db.vIPSubscription.update({
        where: { userId },
        data: { isActive: false },
      })
    }

    const isActive = !isExpired && subscription.isActive
    const expiresAt = subscription.expiresAt
    const daysRemaining = isActive
      ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0

    const planLabels: Record<string, string> = {
      silver: 'نقره‌ای',
      gold: 'طلایی',
      black: 'بلک',
    }

    return NextResponse.json({
      success: true,
      isVip: isActive,
      plan: subscription.plan,
      planLabel: planLabels[subscription.plan] || subscription.plan,
      isActive,
      expiresAt: expiresAt.toISOString(),
      daysRemaining,
      startedAt: subscription.startedAt.toISOString(),
      autoRenew: subscription.autoRenew,
      zeroFees: access.zeroFees,
      buyFeeRate: access.buyFeeRate,
      sellFeeRate: access.sellFeeRate,
      maxAlerts: access.maxAlerts,
      maxGiftGrams: access.maxGiftGrams,
      cashbackMultiplier: access.cashbackMultiplier,
    })
  } catch (error) {
    console.error('VIP status error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت وضعیت VIP' },
      { status: 500 }
    )
  }
}

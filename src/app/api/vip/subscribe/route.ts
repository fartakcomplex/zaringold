import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const VIP_PLANS: Record<string, { label: string; durationDays: number }> = {
  silver: { label: 'نقره‌ای', durationDays: 30 },
  gold: { label: 'طلایی', durationDays: 30 },
  black: { label: 'بلک', durationDays: 30 },
}

// ── POST: Subscribe to VIP plan ──
export async function POST(request: NextRequest) {
  try {
    const { userId, plan } = await request.json()

    if (!userId || !plan) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و پلن الزامی است' },
        { status: 400 }
      )
    }

    const planConfig = VIP_PLANS[plan]
    if (!planConfig) {
      return NextResponse.json(
        { success: false, message: 'پلن نامعتبر. پلن‌های مجاز: silver, gold, black' },
        { status: 400 }
      )
    }

    // Check user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    const now = new Date()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + planConfig.durationDays)

    // Create or update VIP subscription
    const subscription = await db.vIPSubscription.upsert({
      where: { userId },
      update: {
        plan,
        startedAt: now,
        expiresAt,
        isActive: true,
      },
      create: {
        userId,
        plan,
        expiresAt,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: `اشتراک VIP پلن ${planConfig.label} با موفقیت فعال شد`,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        planLabel: planConfig.label,
        startedAt: subscription.startedAt.toISOString(),
        expiresAt: subscription.expiresAt.toISOString(),
        isActive: subscription.isActive,
        daysRemaining: planConfig.durationDays,
      },
    })
  } catch (error) {
    console.error('VIP subscribe error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در فعال‌سازی اشتراک VIP' },
      { status: 500 }
    )
  }
}

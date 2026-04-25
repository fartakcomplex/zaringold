import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ── Helpers ── */

function addInterval(date: Date, interval: string): Date {
  const next = new Date(date)
  switch (interval) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      break
    case 'weekly':
      next.setDate(next.getDate() + 7)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      break
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1)
      break
  }
  return next
}

/**
 * POST /api/v1/subscription/subscribe
 * Customer subscribes to a plan
 * Body: { userId, subscriptionId, paymentMethod }
 * Deducts from wallet or creates pending payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, subscriptionId, paymentMethod } = body

    if (!userId || !subscriptionId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و طرح اشتراک الزامی است' },
        { status: 400 }
      )
    }

    // Validate subscription plan exists and is active
    const plan = await db.subscription.findUnique({
      where: { id: subscriptionId },
    })
    if (!plan) {
      return NextResponse.json(
        { success: false, message: 'طرح اشتراک یافت نشد' },
        { status: 404 }
      )
    }
    if (!plan.isActive) {
      return NextResponse.json(
        { success: false, message: 'طرح اشتراک غیرفعال است' },
        { status: 400 }
      )
    }

    // Check max charges on the plan
    if (plan.maxCharges > 0 && plan.totalCharges >= plan.maxCharges) {
      return NextResponse.json(
        { success: false, message: 'حداکثر تعداد پرداخت این طرح تکمیل شده است' },
        { status: 400 }
      )
    }

    // Check if user already subscribed
    const existing = await db.subscriptionCustomer.findUnique({
      where: {
        subscriptionId_userId: { subscriptionId, userId },
      },
    })
    if (existing && existing.status === 'active') {
      return NextResponse.json(
        { success: false, message: 'شما قبلاً در این طرح اشتراک دارید' },
        { status: 400 }
      )
    }

    // Determine payment method
    const method = paymentMethod || 'toman'

    // Process initial payment (deduct from wallet)
    if (method === 'toman' && plan.amountToman > 0) {
      const wallet = await db.wallet.findUnique({ where: { userId } })
      if (!wallet) {
        return NextResponse.json(
          { success: false, message: 'کیف پول یافت نشد' },
          { status: 404 }
        )
      }
      if (wallet.balance < plan.amountToman) {
        return NextResponse.json(
          { success: false, message: 'موجودی کیف پول کافی نیست' },
          { status: 400 }
        )
      }
      // Deduct from wallet
      await db.wallet.update({
        where: { userId },
        data: { balance: { decrement: plan.amountToman } },
      })
    } else if (method === 'gold' && plan.amountGold > 0) {
      const goldWallet = await db.goldWallet.findUnique({ where: { userId } })
      if (!goldWallet) {
        return NextResponse.json(
          { success: false, message: 'کیف پول طلا یافت نشد' },
          { status: 404 }
        )
      }
      if (goldWallet.goldGrams < plan.amountGold) {
        return NextResponse.json(
          { success: false, message: 'موجودی طلای کافی نیست' },
          { status: 400 }
        )
      }
      await db.goldWallet.update({
        where: { userId },
        data: { goldGrams: { decrement: plan.amountGold } },
      })
    }

    // Calculate trial end date
    const now = new Date()
    const trialEndsAt = plan.trialDays > 0
      ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
      : null

    // First charge date is after trial period
    const firstChargeDate = trialEndsAt
      ? addInterval(trialEndsAt, plan.interval)
      : addInterval(now, plan.interval)

    // Create customer subscription
    const customer = await db.subscriptionCustomer.create({
      data: {
        subscriptionId,
        userId,
        status: 'active',
        trialEndsAt,
        nextChargeAt: firstChargeDate,
        totalCharged: 0,
      },
    })

    // Create initial charge record
    await db.subscriptionCharge.create({
      data: {
        subscriptionId,
        customerId: customer.id,
        amountToman: plan.amountToman,
        amountGold: plan.amountGold,
        status: 'completed',
        chargedAt: now,
      },
    })

    // Update subscription counters
    await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        totalCharges: { increment: 1 },
        subscriberCount: { increment: 1 },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'اشتراک با موفقیت ثبت شد',
      data: {
        id: customer.id,
        subscriptionId,
        status: 'active',
        trialEndsAt,
        nextChargeAt: firstChargeDate,
        planName: plan.planName,
        amountToman: plan.amountToman,
        amountGold: plan.amountGold,
        currency: plan.currency,
        interval: plan.interval,
        paymentMethod: method,
      },
    })
  } catch (error) {
    console.error('Subscription subscribe error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت اشتراک' },
      { status: 500 }
    )
  }
}

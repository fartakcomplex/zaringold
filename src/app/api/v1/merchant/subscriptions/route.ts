import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ── Helpers ── */

const VALID_CURRENCIES = ['toman', 'gold', 'mixed']
const VALID_INTERVALS = ['daily', 'weekly', 'monthly', 'yearly']

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
 * POST /api/v1/merchant/subscriptions
 * Create a new subscription plan
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, planName, description, amountToman, amountGold, currency, interval, trialDays, maxCharges } = body

    if (!userId || !planName) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و نام طرح الزامی است' },
        { status: 400 }
      )
    }

    // Validate merchant
    const merchant = await db.merchant.findUnique({ where: { userId } })
    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'پذیرنده یافت نشد' },
        { status: 404 }
      )
    }
    if (!merchant.isActive) {
      return NextResponse.json(
        { success: false, message: 'حساب پذیرنده غیرفعال است' },
        { status: 403 }
      )
    }

    // Validate fields
    const cur = currency || 'toman'
    const intv = interval || 'monthly'
    if (!VALID_CURRENCIES.includes(cur)) {
      return NextResponse.json(
        { success: false, message: `ارز باید یکی از ${VALID_CURRENCIES.join('، ')} باشد` },
        { status: 400 }
      )
    }
    if (!VALID_INTERVALS.includes(intv)) {
      return NextResponse.json(
        { success: false, message: `بازه باید یکی از ${VALID_INTERVALS.join('، ')} باشد` },
        { status: 400 }
      )
    }

    const toman = Number(amountToman) || 0
    const gold = Number(amountGold) || 0

    if (cur === 'toman' && toman <= 0) {
      return NextResponse.json(
        { success: false, message: 'مبلغ واحد طلایی برای ارز واحد طلاییی الزامی است' },
        { status: 400 }
      )
    }
    if (cur === 'gold' && gold <= 0) {
      return NextResponse.json(
        { success: false, message: 'مبلغ طلا برای ارز طلا الزامی است' },
        { status: 400 }
      )
    }
    if (cur === 'mixed' && toman <= 0 && gold <= 0) {
      return NextResponse.json(
        { success: false, message: 'حداقل یکی از مبالغ (واحد طلایی یا طلا) باید بزرگتر از صفر باشد' },
        { status: 400 }
      )
    }

    const trial = Math.max(0, Number(trialDays) || 0)
    const max = Math.max(0, Number(maxCharges) || 0)

    const now = new Date()
    const nextCharge = addInterval(now, intv)

    const subscription = await db.subscription.create({
      data: {
        merchantId: merchant.id,
        planName: planName.trim(),
        description: (description || '').trim(),
        amountToman: toman,
        amountGold: gold,
        currency: cur,
        interval: intv,
        trialDays: trial,
        maxCharges: max,
        isActive: true,
        nextChargeAt: nextCharge,
        totalCharges: 0,
        subscriberCount: 0,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'طرح اشتراک با موفقیت ایجاد شد',
      data: {
        id: subscription.id,
        planName: subscription.planName,
        description: subscription.description,
        amountToman: subscription.amountToman,
        amountGold: subscription.amountGold,
        currency: subscription.currency,
        interval: subscription.interval,
        trialDays: subscription.trialDays,
        maxCharges: subscription.maxCharges,
        isActive: subscription.isActive,
        nextChargeAt: subscription.nextChargeAt,
        totalCharges: subscription.totalCharges,
        subscriberCount: subscription.subscriberCount,
        subscribeUrl: `/subscription/${subscription.id}/subscribe`,
        createdAt: subscription.createdAt,
      },
    })
  } catch (error) {
    console.error('Subscription create error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد طرح اشتراک' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/merchant/subscriptions?userId=xxx
 * List all subscription plans for a merchant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const merchant = await db.merchant.findUnique({ where: { userId } })
    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'پذیرنده یافت نشد' },
        { status: 404 }
      )
    }

    const skip = (page - 1) * limit

    const [subscriptions, total] = await Promise.all([
      db.subscription.findMany({
        where: { merchantId: merchant.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { customers: true, charges: true } },
        },
      }),
      db.subscription.count({ where: { merchantId: merchant.id } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        subscriptions: subscriptions.map((s) => ({
          id: s.id,
          planName: s.planName,
          description: s.description,
          amountToman: s.amountToman,
          amountGold: s.amountGold,
          currency: s.currency,
          interval: s.interval,
          trialDays: s.trialDays,
          maxCharges: s.maxCharges,
          isActive: s.isActive,
          nextChargeAt: s.nextChargeAt,
          totalCharges: s.totalCharges,
          subscriberCount: s._count.customers,
          chargeCount: s._count.charges,
          subscribeUrl: `/subscription/${s.id}/subscribe`,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Subscription list error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست طرح‌های اشتراک' },
      { status: 500 }
    )
  }
}

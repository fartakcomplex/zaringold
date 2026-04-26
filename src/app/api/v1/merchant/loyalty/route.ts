import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ── Valid program types ── */
const VALID_TYPES = ['gold_cashback', 'milestone', 'recurring']

/* ── JSON key helpers for LoanSetting storage ── */

function programsKey(merchantId: string) {
  return `loyalty_programs_${merchantId}`
}

function rewardsKey(merchantId: string) {
  return `loyalty_rewards_${merchantId}`
}

function statsKey(merchantId: string) {
  return `loyalty_stats_${merchantId}`
}

function feeKey(merchantId: string) {
  return `merchant_fee_config_${merchantId}`
}

/* ── Read/write JSON from LoanSetting ── */

async function getSetting(key: string): Promise<string | null> {
  const row = await db.loanSetting.findUnique({ where: { key } })
  return row?.value ?? null
}

async function upsertSetting(key: string, value: string, description?: string) {
  await db.loanSetting.upsert({
    where: { key },
    update: { value, updatedAt: new Date() },
    create: { key, value, description },
  })
}

/* ── Seed demo data if merchant has none ── */

async function seedDemoData(merchantId: string) {
  const existing = await getSetting(programsKey(merchantId))
  if (existing) return

  const now = new Date().toISOString()
  const demoPrograms = [
    {
      id: 'demo_1',
      name: 'کش‌بک طلایی ۲٪',
      type: 'gold_cashback',
      isActive: true,
      cashbackPercent: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_2',
      name: 'جایزه ۱۰ پرداخت',
      type: 'milestone',
      isActive: true,
      milestonePayments: 10,
      rewardMg: 50,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_3',
      name: 'پاداش ۳۰ روزه',
      type: 'recurring',
      isActive: false,
      recurringDays: 30,
      rewardMg: 25,
      createdAt: now,
      updatedAt: now,
    },
  ]

  const demoRewards = [
    { id: 'r1', userId: 'u_demo_1', userName: 'علی محمدی', type: 'gold_cashback', amountMg: 12.5, programName: 'کش‌بک طلایی ۲٪', date: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'r2', userId: 'u_demo_2', userName: 'سارا احمدی', type: 'gold_cashback', amountMg: 8.3, programName: 'کش‌بک طلایی ۲٪', date: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: 'r3', userId: 'u_demo_1', userName: 'علی محمدی', type: 'milestone', amountMg: 50, programName: 'جایزه ۱۰ پرداخت', date: new Date(Date.now() - 86400000 * 10).toISOString() },
    { id: 'r4', userId: 'u_demo_3', userName: 'رضا کریمی', type: 'gold_cashback', amountMg: 15.7, programName: 'کش‌بک طلایی ۲٪', date: new Date(Date.now() - 86400000 * 1).toISOString() },
    { id: 'r5', userId: 'u_demo_4', userName: 'مریم حسینی', type: 'recurring', amountMg: 25, programName: 'پاداش ۳۰ روزه', date: new Date(Date.now() - 86400000 * 30).toISOString() },
  ]

  await Promise.all([
    upsertSetting(programsKey(merchantId), JSON.stringify(demoPrograms), 'Loyalty programs for merchant'),
    upsertSetting(rewardsKey(merchantId), JSON.stringify(demoRewards), 'Loyalty rewards history for merchant'),
    upsertSetting(statsKey(merchantId), JSON.stringify({
      totalRewardsMg: 111.5,
      totalUsersRewarded: 4,
      averageRewardMg: 22.3,
      mostPopularProgram: 'کش‌بک طلایی ۲٪',
    }), 'Loyalty campaign stats for merchant'),
  ])
}

/**
 * POST /api/v1/merchant/loyalty
 * Create a new loyalty program
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, type, cashbackPercent, milestonePayments, rewardMg, recurringDays } = body

    if (!userId || !name || !type) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر، نام برنامه و نوع الزامی است' },
        { status: 400 }
      )
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, message: `نوع باید یکی از ${VALID_TYPES.join('، ')} باشد` },
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

    // Type-specific validation
    if (type === 'gold_cashback' && (cashbackPercent == null || Number(cashbackPercent) <= 0)) {
      return NextResponse.json(
        { success: false, message: 'درصد کش‌بک باید بزرگتر از صفر باشد' },
        { status: 400 }
      )
    }
    if (type === 'milestone' && (milestonePayments == null || Number(milestonePayments) <= 0 || rewardMg == null || Number(rewardMg) <= 0)) {
      return NextResponse.json(
        { success: false, message: 'تعداد پرداخت‌ها و مقدار پاداش (میلی‌گرم) الزامی است' },
        { status: 400 }
      )
    }
    if (type === 'recurring' && (recurringDays == null || Number(recurringDays) <= 0 || rewardMg == null || Number(rewardMg) <= 0)) {
      return NextResponse.json(
        { success: false, message: 'تعداد روزها و مقدار پاداش (میلی‌گرم) الزامی است' },
        { status: 400 }
      )
    }

    // Read existing programs
    const raw = await getSetting(programsKey(merchant.id))
    const programs: Array<Record<string, unknown>> = raw ? JSON.parse(raw) : []

    const newProgram = {
      id: `prog_${Date.now()}`,
      name: name.trim(),
      type,
      isActive: true,
      cashbackPercent: type === 'gold_cashback' ? Number(cashbackPercent) : undefined,
      milestonePayments: type === 'milestone' ? Number(milestonePayments) : undefined,
      rewardMg: (type === 'milestone' || type === 'recurring') ? Number(rewardMg) : undefined,
      recurringDays: type === 'recurring' ? Number(recurringDays) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    programs.push(newProgram)
    await upsertSetting(programsKey(merchant.id), JSON.stringify(programs))

    return NextResponse.json({
      success: true,
      message: 'برنامه وفاداری با موفقیت ایجاد شد',
      data: newProgram,
    })
  } catch (error) {
    console.error('Loyalty program create error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد برنامه وفاداری' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/merchant/loyalty?userId=xxx
 * List merchant's loyalty programs, rewards history, and stats
 */
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

    const merchant = await db.merchant.findUnique({ where: { userId } })
    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'پذیرنده یافت نشد' },
        { status: 404 }
      )
    }

    // Seed demo data if needed
    await seedDemoData(merchant.id)

    const [programsRaw, rewardsRaw, statsRaw] = await Promise.all([
      getSetting(programsKey(merchant.id)),
      getSetting(rewardsKey(merchant.id)),
      getSetting(statsKey(merchant.id)),
    ])

    const programs = programsRaw ? JSON.parse(programsRaw) : []
    const rewards = rewardsRaw ? JSON.parse(rewardsRaw) : []
    const stats = statsRaw ? JSON.parse(statsRaw) : {
      totalRewardsMg: 0,
      totalUsersRewarded: 0,
      averageRewardMg: 0,
      mostPopularProgram: '-',
    }

    return NextResponse.json({
      success: true,
      data: { programs, rewards, stats },
    })
  } catch (error) {
    console.error('Loyalty list error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات وفاداری' },
      { status: 500 }
    )
  }
}

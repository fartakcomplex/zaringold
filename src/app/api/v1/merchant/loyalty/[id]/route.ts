import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ── JSON key helpers ── */

function programsKey(merchantId: string) {
  return `loyalty_programs_${merchantId}`
}

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

/**
 * PATCH /api/v1/merchant/loyalty/[id]?userId=xxx
 * Toggle program active/inactive or update settings
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const raw = await getSetting(programsKey(merchant.id))
    if (!raw) {
      return NextResponse.json(
        { success: false, message: 'برنامه‌ای یافت نشد' },
        { status: 404 }
      )
    }

    const programs: Array<Record<string, unknown>> = JSON.parse(raw)
    const idx = programs.findIndex((p) => p.id === id)
    if (idx === -1) {
      return NextResponse.json(
        { success: false, message: 'برنامه مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { action, name, cashbackPercent, milestonePayments, rewardMg, recurringDays } = body

    if (action === 'toggle_active') {
      programs[idx].isActive = !programs[idx].isActive
    }

    // Support field updates
    if (name) programs[idx].name = name.trim()
    if (cashbackPercent !== undefined) programs[idx].cashbackPercent = Number(cashbackPercent)
    if (milestonePayments !== undefined) programs[idx].milestonePayments = Number(milestonePayments)
    if (rewardMg !== undefined) programs[idx].rewardMg = Number(rewardMg)
    if (recurringDays !== undefined) programs[idx].recurringDays = Number(recurringDays)
    programs[idx].updatedAt = new Date().toISOString()

    await upsertSetting(programsKey(merchant.id), JSON.stringify(programs))

    return NextResponse.json({
      success: true,
      message: action === 'toggle_active'
        ? (programs[idx].isActive ? 'برنامه فعال شد' : 'برنامه غیرفعال شد')
        : 'برنامه بروزرسانی شد',
      data: programs[idx],
    })
  } catch (error) {
    console.error('Loyalty patch error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی برنامه وفاداری' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/merchant/loyalty/[id]?userId=xxx
 * Delete a loyalty program
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const raw = await getSetting(programsKey(merchant.id))
    if (!raw) {
      return NextResponse.json(
        { success: false, message: 'برنامه‌ای یافت نشد' },
        { status: 404 }
      )
    }

    const programs: Array<Record<string, unknown>> = JSON.parse(raw)
    const filtered = programs.filter((p) => p.id !== id)

    if (filtered.length === programs.length) {
      return NextResponse.json(
        { success: false, message: 'برنامه مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    await upsertSetting(programsKey(merchant.id), JSON.stringify(filtered))

    return NextResponse.json({
      success: true,
      message: 'برنامه وفاداری حذف شد',
    })
  } catch (error) {
    console.error('Loyalty delete error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف برنامه وفاداری' },
      { status: 500 }
    )
  }
}

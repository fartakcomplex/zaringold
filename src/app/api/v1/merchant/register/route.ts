import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/v1/merchant/register
 * Register a merchant for a user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, businessName, businessType, website, description, iban, settlementType, settlementFreq, webhookUrl } = body

    if (!userId || !businessName) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و نام کسب‌وکار الزامی است' },
        { status: 400 }
      )
    }

    /* ── Check user exists ── */
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    /* ── Check if merchant already exists ── */
    const existing = await db.merchant.findUnique({ where: { userId } })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'این کاربر قبلاً ثبت‌نام پذیرنده شده است' },
        { status: 409 }
      )
    }

    /* ── Validate settlementType ── */
    const validSettlementTypes = ['toman', 'gold', 'mixed']
    const resolvedSettlementType = settlementType || 'toman'
    if (!validSettlementTypes.includes(resolvedSettlementType)) {
      return NextResponse.json(
        { success: false, message: 'نوع تسویه باید یکی از مقادیر: toman, gold, mixed باشد' },
        { status: 400 }
      )
    }

    /* ── Validate settlementFreq ── */
    const validSettlementFreqs = ['daily', 'weekly', 'monthly', 'manual']
    const resolvedSettlementFreq = settlementFreq || 'daily'
    if (!validSettlementFreqs.includes(resolvedSettlementFreq)) {
      return NextResponse.json(
        { success: false, message: 'دوره تسویه باید یکی از مقادیر: daily, weekly, monthly, manual باشد' },
        { status: 400 }
      )
    }

    /* ── Validate businessType ── */
    const validBusinessTypes = ['online', 'mobile_app', 'service_web', 'physical']
    if (businessType && !validBusinessTypes.includes(businessType)) {
      return NextResponse.json(
        { success: false, message: 'نوع کسب‌وکار نامعتبر است' },
        { status: 400 }
      )
    }

    /* ── Create merchant ── */
    const merchant = await db.merchant.create({
      data: {
        userId,
        businessName,
        businessType: businessType || 'online',
        website: website || null,
        description: description || null,
        iban: iban || null,
        settlementType: resolvedSettlementType,
        settlementFreq: resolvedSettlementFreq,
        webhookUrl: webhookUrl || null,
        webhookSecret: webhookUrl ? `whsec_${Date.now()}_${Math.random().toString(36).slice(2)}` : null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'پذیرنده با موفقیت ثبت‌نام شد',
      data: {
        id: merchant.id,
        businessName: merchant.businessName,
        kycStatus: merchant.kycStatus,
        isActive: merchant.isActive,
      },
    })
  } catch (error) {
    console.error('Merchant register error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت‌نام پذیرنده' },
      { status: 500 }
    )
  }
}

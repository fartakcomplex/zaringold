import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/v1/merchant/profile
 * Get merchant profile by userId
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

    const merchant = await db.merchant.findUnique({
      where: { userId },
      include: {
        apiKeys: {
          where: { isActive: true },
          select: { id: true, keyPrefix: true, keyType: true, name: true, lastUsedAt: true, createdAt: true },
        },
        _count: {
          select: {
            payments: true,
            refunds: true,
            settlements: true,
            invoices: true,
            qrCodes: true,
          },
        },
      },
    })

    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'پذیرنده یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: merchant.id,
        businessName: merchant.businessName,
        businessType: merchant.businessType,
        website: merchant.website,
        logo: merchant.logo,
        description: merchant.description,
        iban: merchant.iban ? `${merchant.iban.slice(0, 6)}****${merchant.iban.slice(-4)}` : null,
        settlementType: merchant.settlementType,
        settlementFreq: merchant.settlementFreq,
        feeRate: merchant.feeRate,
        isActive: merchant.isActive,
        isVerified: merchant.isVerified,
        kycStatus: merchant.kycStatus,
        totalSales: merchant.totalSales,
        totalSalesGold: merchant.totalSalesGold,
        totalSettled: merchant.totalSettled,
        totalSettledGold: merchant.totalSettledGold,
        pendingSettle: merchant.pendingSettle,
        pendingSettleGold: merchant.pendingSettleGold,
        riskScore: merchant.riskScore,
        webhookUrl: merchant.webhookUrl,
        brandingColor: merchant.brandingColor,
        activeApiKeys: merchant.apiKeys.length,
        createdAt: merchant.createdAt,
        counts: merchant._count,
      },
    })
  } catch (error) {
    console.error('Merchant profile error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات پذیرنده' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/merchant/profile
 * Update merchant settings (webhookUrl, settlementType, settlementFrequency, brandingColor)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, webhookUrl, settlementType, settlementFrequency, brandingColor } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    /* ── Verify user exists ── */
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    /* ── Find merchant ── */
    const merchant = await db.merchant.findUnique({ where: { userId } })
    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'پذیرنده یافت نشد' },
        { status: 404 }
      )
    }

    /* ── Build update data ── */
    const updateData: Record<string, unknown> = {}
    if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl || null
    if (settlementType !== undefined) {
      if (!['toman', 'gold', 'mixed'].includes(settlementType)) {
        return NextResponse.json(
          { success: false, message: 'نوع تسویه باید یکی از مقادیر: toman, gold, mixed باشد' },
          { status: 400 }
        )
      }
      updateData.settlementType = settlementType
    }
    if (settlementFrequency !== undefined) {
      if (!['daily', 'weekly', 'monthly', 'manual'].includes(settlementFrequency)) {
        return NextResponse.json(
          { success: false, message: 'فرکانس تسویه باید یکی از مقادیر: daily, weekly, monthly, manual باشد' },
          { status: 400 }
        )
      }
      updateData.settlementFreq = settlementFrequency
    }
    if (brandingColor !== undefined) {
      if (brandingColor && !/^#[0-9A-Fa-f]{6}$/.test(brandingColor)) {
        return NextResponse.json(
          { success: false, message: 'رنگ برند باید فرمت هگزادسیمال معتبر باشد (مثلاً #D4AF37)' },
          { status: 400 }
        )
      }
      updateData.brandingColor = brandingColor
    }

    /* ── Update merchant ── */
    const updated = await db.merchant.update({
      where: { id: merchant.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'تنظیمات پذیرنده با موفقیت به‌روزرسانی شد',
      data: {
        id: updated.id,
        webhookUrl: updated.webhookUrl,
        settlementType: updated.settlementType,
        settlementFreq: updated.settlementFreq,
        brandingColor: updated.brandingColor,
      },
    })
  } catch (error) {
    console.error('Merchant profile update error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی تنظیمات پذیرنده' },
      { status: 500 }
    )
  }
}

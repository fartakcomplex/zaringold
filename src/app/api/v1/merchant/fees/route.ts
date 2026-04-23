import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ── Fee tier definitions ── */

const FEE_TIERS = [
  { key: 'basic', nameFa: 'پایه', nameEn: 'Basic', rate: 1.5, color: '#94A3B8' },
  { key: 'pro', nameFa: 'حرفه‌ای', nameEn: 'Pro', rate: 1.0, color: '#D4AF37' },
  { key: 'diamond', nameFa: 'الماسی', nameEn: 'Diamond', rate: 0.5, color: '#38BDF8' },
  { key: 'special', nameFa: 'ویژه', nameEn: 'Special', rate: 0, color: '#A855F7' },
]

/* ── Helpers ── */

function feeConfigKey(merchantId: string) {
  return `merchant_fee_config_${merchantId}`
}

function feeRequestsKey(merchantId: string) {
  return `merchant_fee_requests_${merchantId}`
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
 * GET /api/v1/merchant/fees?userId=xxx
 * Get merchant's current fee structure
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

    // Get custom fee config if exists
    const configRaw = await getSetting(feeConfigKey(merchant.id))
    const customConfig = configRaw ? JSON.parse(configRaw) : null

    // Determine current tier based on merchant's feeRate
    let currentTier = FEE_TIERS[0]
    for (const tier of FEE_TIERS) {
      if (Math.abs(merchant.feeRate * 100 - tier.rate) < 0.01) {
        currentTier = tier
        break
      }
    }

    // Fee request history
    const requestsRaw = await getSetting(feeRequestsKey(merchant.id))
    const feeRequests = requestsRaw ? JSON.parse(requestsRaw) : []

    return NextResponse.json({
      success: true,
      data: {
        currentTier,
        allTiers: FEE_TIERS,
        merchantFeeRate: merchant.feeRate,
        merchantMinFee: merchant.minFee,
        merchantMaxFee: merchant.maxFee,
        customConfig,
        feeRequests,
        settlementFee: customConfig?.settlementFee ?? 50000, // Default 50K toman
        instantSettlementFee: customConfig?.instantSettlementFee ?? 100000, // Default 100K toman
      },
    })
  } catch (error) {
    console.error('Fee get error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات کارمزد' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/merchant/fees
 * Request fee tier change or update custom config (requires admin approval for tier changes)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, requestedTier, customFeeRate, settlementFee, instantSettlementFee } = body

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و نوع عملیات الزامی است' },
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

    if (action === 'request_tier_change') {
      if (!requestedTier) {
        return NextResponse.json(
          { success: false, message: 'سطح کارمزد مورد نظر الزامی است' },
          { status: 400 }
        )
      }

      const tier = FEE_TIERS.find((t) => t.key === requestedTier)
      if (!tier) {
        return NextResponse.json(
          { success: false, message: 'سطح کارمزد نامعتبر است' },
          { status: 400 }
        )
      }

      // Check if already on this tier
      if (Math.abs(merchant.feeRate * 100 - tier.rate) < 0.01) {
        return NextResponse.json(
          { success: false, message: 'شما از قبل در این سطح هستید' },
          { status: 400 }
        )
      }

      // Save fee change request
      const requestsRaw = await getSetting(feeRequestsKey(merchant.id))
      const feeRequests: Array<Record<string, unknown>> = requestsRaw ? JSON.parse(requestsRaw) : []

      const newRequest = {
        id: `freq_${Date.now()}`,
        fromTier: merchant.feeRate * 100,
        toTier: tier.rate,
        toTierKey: tier.key,
        toTierName: tier.nameFa,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }

      feeRequests.unshift(newRequest)
      await upsertSetting(feeRequestsKey(merchant.id), JSON.stringify(feeRequests))

      return NextResponse.json({
        success: true,
        message: 'درخواست تغییر سطح کارمزد ثبت شد و در انتظار تأیید مدیر است',
        data: newRequest,
      })
    }

    if (action === 'update_settlement_fees') {
      const sFee = Number(settlementFee) || 0
      const iFee = Number(instantSettlementFee) || 0

      if (sFee < 0 || iFee < 0) {
        return NextResponse.json(
          { success: false, message: 'کارمزد تسویه نمی‌تواند منفی باشد' },
          { status: 400 }
        )
      }

      const configRaw = await getSetting(feeConfigKey(merchant.id))
      const config = configRaw ? JSON.parse(configRaw) : {}

      config.settlementFee = sFee
      config.instantSettlementFee = iFee
      config.updatedAt = new Date().toISOString()

      await upsertSetting(feeConfigKey(merchant.id), JSON.stringify(config))

      return NextResponse.json({
        success: true,
        message: 'تنظیمات کارمزد تسویه بروزرسانی شد',
        data: config,
      })
    }

    if (action === 'update_custom_fee') {
      const newRate = Number(customFeeRate)
      if (isNaN(newRate) || newRate < 0 || newRate > 5) {
        return NextResponse.json(
          { success: false, message: 'نرخ کارمزد باید بین ۰ تا ۵ درصد باشد' },
          { status: 400 }
        )
      }

      await db.merchant.update({
        where: { id: merchant.id },
        data: { feeRate: newRate / 100 },
      })

      return NextResponse.json({
        success: true,
        message: 'نرخ کارمزد سفارشی بروزرسانی شد',
        data: { feeRate: newRate / 100, feePercent: newRate },
      })
    }

    return NextResponse.json(
      { success: false, message: 'نوع عملیات نامعتبر است' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Fee post error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت درخواست کارمزد' },
      { status: 500 }
    )
  }
}

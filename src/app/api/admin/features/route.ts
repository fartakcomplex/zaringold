import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/security/auth-guard';

/* ------------------------------------------------------------------ */
/*  Default feature flags & settings                                   */
/* ------------------------------------------------------------------ */

const DEFAULT_FEATURE_FLAGS: Record<string, { value: string; description: string }> = {
  feature_smart_buy: { value: 'true', description: 'خرید هوشمند AI' },
  feature_autosave: { value: 'true', description: 'خرید خودکار طلا' },
  feature_roundup: { value: 'true', description: 'سرگردانی خرد سرمایه‌گذاری' },
  feature_goals: { value: 'true', description: 'اهداف پس‌انداز' },
  feature_gifts: { value: 'true', description: 'هدیه طلایی' },
  feature_family_wallet: { value: 'true', description: 'کیف پول خانوادگی' },
  feature_social_feed: { value: 'true', description: 'فید اجتماعی' },
  feature_prediction_game: { value: 'true', description: 'بازی پیش‌بینی قیمت' },
  feature_ai_coach: { value: 'true', description: 'مربی هوشمند مالی' },
  feature_vip: { value: 'true', description: 'عضویت ویژه' },
  feature_cashback: { value: 'true', description: 'کش‌بک' },
  feature_education: { value: 'true', description: 'آموزشگاه' },
  feature_auto_trade: { value: 'false', description: 'معامله خودکار' },
  feature_creator_club: { value: 'true', description: 'کلوپ خالقان' },
  feature_gold_quest: { value: 'true', description: 'ماموریت طلایی' },
  feature_telegram_bot: { value: 'true', description: 'ربات تلگرام' },
  feature_emergency_sell: { value: 'true', description: 'فروش اضطراری' },
  setting_cashback_percent: { value: '2', description: 'درصد کش‌بک' },
  setting_vip_prices: {
    value: JSON.stringify({ silver: 49000, gold: 129000, black: 399000 }),
    description: 'قیمت اشتراک VIP (واحد طلایی)',
  },
  setting_spread_percent: { value: '1.5', description: 'اسپرد طلا (درصد)' },
  setting_min_trade_amount: { value: '50000', description: 'حداقل مبلغ معامله (واحد طلایی)' },
  setting_referral_reward: { value: '10000', description: 'پاداش دعوت (واحد طلایی)' },
  setting_gift_fee_percent: { value: '0.5', description: 'کارمزد انتقال هدیه (درصد)' },
  setting_prediction_xp: { value: '50', description: 'پاداش XP پیش‌بینی' },
  setting_checkin_rewards: {
    value: JSON.stringify({
      day1: { xp: 10, fiat: 0 },
      day3: { xp: 20, fiat: 5000 },
      day7: { xp: 50, fiat: 15000 },
      day14: { xp: 100, fiat: 30000 },
      day30: { xp: 250, fiat: 100000 },
    }),
    description: 'پاداش‌های چک‌این روزانه',
  },
}

/* ------------------------------------------------------------------ */
/*  GET /api/admin/features — Return all feature flags & settings      */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    // Get all existing settings from DB
    const dbSettings = await db.loanSetting.findMany({
      where: {
        OR: [
          { key: { startsWith: 'feature_' } },
          { key: { startsWith: 'setting_' } },
        ],
      },
    })

    // Build map from DB
    const dbMap = new Map<string, { value: string; description: string | null }>()
    for (const s of dbSettings) {
      dbMap.set(s.key, { value: s.value, description: s.description })
    }

    // Merge defaults with DB values
    const features: Record<string, unknown>[] = []
    const settings: Record<string, unknown>[] = []

    for (const [key, defaults] of Object.entries(DEFAULT_FEATURE_FLAGS)) {
      const dbEntry = dbMap.get(key)
      const value = dbEntry?.value ?? defaults.value
      const description = dbEntry?.description ?? defaults.description
      const parsedValue = value === 'true' ? true : value === 'false' ? false : !isNaN(Number(value)) ? Number(value) : value

      const entry = {
        key,
        value: parsedValue,
        rawValue: value,
        description,
      }

      if (key.startsWith('feature_')) {
        features.push(entry)
      } else {
        settings.push(entry)
      }
    }

    // Also include any DB entries not in defaults
    for (const s of dbSettings) {
      if (!DEFAULT_FEATURE_FLAGS[s.key]) {
        const entry = {
          key: s.key,
          value: s.value,
          rawValue: s.value,
          description: s.description,
        }
        if (s.key.startsWith('feature_')) {
          features.push(entry)
        } else {
          settings.push(entry)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { features, settings },
      message: 'تنظیمات فیچرها و ماژول‌ها با موفقیت دریافت شد',
    })
  } catch (error) {
    console.error('Admin get features error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تنظیمات فیچرها' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /api/admin/features — Update feature flags & settings          */
/* ------------------------------------------------------------------ */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return NextResponse.json(
        { success: false, message: 'فرمت نامعتبر - settings باید یک آبجکت باشد' },
        { status: 400 }
      )
    }

    const updatedKeys: string[] = []

    // Upsert each setting
    for (const [key, rawValue] of Object.entries(settings)) {
      const strValue = String(rawValue)

      // Validate value type for feature flags (should be boolean-ish)
      if (key.startsWith('feature_') && strValue !== 'true' && strValue !== 'false') {
        return NextResponse.json(
          { success: false, message: `مقدار ${key} باید true یا false باشد` },
          { status: 400 }
        )
      }

      // Validate numeric settings
      if (key === 'setting_cashback_percent' || key === 'setting_spread_percent' || key === 'setting_gift_fee_percent') {
        const num = Number(strValue)
        if (isNaN(num) || num < 0 || num > 100) {
          return NextResponse.json(
            { success: false, message: `${key} باید عددی بین ۰ تا ۱۰۰ باشد` },
            { status: 400 }
          )
        }
      }

      if (key === 'setting_min_trade_amount' || key === 'setting_referral_reward' || key === 'setting_prediction_xp') {
        const num = Number(strValue)
        if (isNaN(num) || num < 0) {
          return NextResponse.json(
            { success: false, message: `${key} باید عدد مثبت باشد` },
            { status: 400 }
          )
        }
      }

      const description = DEFAULT_FEATURE_FLAGS[key]?.description

      await db.loanSetting.upsert({
        where: { key },
        update: { value: strValue },
        create: { key, value: strValue, description: description ?? null },
      })

      updatedKeys.push(key)
    }

    return NextResponse.json({
      success: true,
      data: { updatedKeys },
      message: `${updatedKeys.length} تنظیمات با موفقیت بروزرسانی شد`,
    })
  } catch (error) {
    console.error('Admin update features error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی تنظیمات' },
      { status: 500 }
    )
  }
}

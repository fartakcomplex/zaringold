import { NextResponse } from 'next/server'

// ─── GET: Dashboard Stats ──────────────────────────────────────────────
export async function GET() {
  try {
    const stats = {
      totalSent: 12450,
      delivered: 11820,
      failed: 630,
      pending: 200,
      todayCost: 187500,
      todaySent: 342,
      deliveryRate: 94.9,
      failRate: 5.1,
      costPerSms: 45,
      monthlyBudget: 5000000,
      monthlySpent: 2340000,
      chartData: [
        { day: 'شنبه', count: 450 },
        { day: 'یکشنبه', count: 380 },
        { day: 'دوشنبه', count: 520 },
        { day: 'سه‌شنبه', count: 290 },
        { day: 'چهارشنبه', count: 610 },
        { day: 'پنجشنبه', count: 440 },
        { day: 'جمعه', count: 320 },
      ],
      topSegments: [
        { name: 'all', label: 'همه کاربران', count: 2400 },
        { name: 'active', label: 'کاربران فعال', count: 1800 },
        { name: 'vip', label: 'VIP', count: 450 },
        { name: 'new_users', label: 'کاربران جدید', count: 320 },
        { name: 'kyc_verified', label: 'احراز شده', count: 1200 },
        { name: 'gold_holders', label: 'داران طلای آبشده', count: 890 },
      ],
    }

    return NextResponse.json({
      success: true,
      message: 'آمار داشبورد پیامکی',
      data: stats,
    })
  } catch (error) {
    console.error('[SMS Stats GET]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت آمار پیامکی' },
      { status: 500 }
    )
  }
}

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
        { day: 'سه‌شنبه', count: 310 },
        { day: 'چهارشنبه', count: 480 },
        { day: 'پنجشنبه', count: 290 },
        { day: 'جمعه', count: 150 },
      ],
      topSegments: [
        { name: 'all', count: 2400 },
        { name: 'active', count: 1800 },
        { name: 'vip', count: 450 },
        { name: 'new', count: 320 },
      ],
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('[SMS Stats GET]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت آمار پیامکی' },
      { status: 500 }
    )
  }
}

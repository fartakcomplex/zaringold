import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Seed data: sample economic events relevant to gold markets
function getSeedEvents() {
  const now = new Date()

  return [
    {
      title: 'FOMC Interest Rate Decision',
      titleFa: 'تصمیم نرخ بهره فدرال رزرو',
      country: 'US',
      impact: 'high',
      eventDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      forecastValue: '5.25%',
      previousValue: '5.25%',
      goldImpact: 'bearish',
      description: 'تصمیم کمیته بازار آزاد فدرال درباره نرخ بهره. افزایش نرخ بهره معمولاً فشار نزولی بر طلا دارد.',
    },
    {
      title: 'Non-Farm Payrolls (NFP)',
      titleFa: 'اشتغال غیرکشاورزی آمریکا',
      country: 'US',
      impact: 'high',
      eventDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      forecastValue: '180K',
      previousValue: '175K',
      goldImpact: 'mixed',
      description: 'اعداد بالاتر از حد انتظار معمولاً دلار را تقویت و طلا را تضعیف می‌کند.',
    },
    {
      title: 'Consumer Price Index (CPI)',
      titleFa: 'شاخص قیمت مصرف‌کننده',
      country: 'US',
      impact: 'high',
      eventDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      forecastValue: '3.2%',
      previousValue: '3.3%',
      goldImpact: 'bullish',
      description: 'تورم بالاتر از انتظار تقاضا برای طلا به عنوان پناهگاه امن را افزایش می‌دهد.',
    },
    {
      title: 'ECB Interest Rate Decision',
      titleFa: 'تصمیم نرخ بهره بانک مرکزی اروپا',
      country: 'EU',
      impact: 'high',
      eventDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      forecastValue: '4.00%',
      previousValue: '4.00%',
      goldImpact: 'neutral',
      description: 'تصمیم بانک مرکزی اروپا درباره نرخ بهره. تأثیر مستقیم بر یورو و به طور غیرمستقیم بر طلا.',
    },
    {
      title: 'GDP Growth Rate',
      titleFa: 'نرخ رشد تولید ناخالص داخلی',
      country: 'US',
      impact: 'medium',
      eventDate: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000),
      forecastValue: '2.1%',
      previousValue: '2.4%',
      goldImpact: 'bearish',
      description: 'رشد اقتصادی قوی‌تر از انتظار، تقاضا برای دارایی‌های امن مانند طلا را کاهش می‌دهد.',
    },
    {
      title: 'Retail Sales',
      titleFa: 'فروش خرده‌فروشی',
      country: 'US',
      impact: 'medium',
      eventDate: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000),
      forecastValue: '0.4%',
      previousValue: '0.6%',
      goldImpact: 'bearish',
      description: 'افزایش فروش خرده‌فروشی نشان‌دهنده قدرت اقتصاد و معمولاً منفی برای طلا.',
    },
    {
      title: 'Unemployment Claims',
      titleFa: 'ادعای بیکاری',
      country: 'US',
      impact: 'medium',
      eventDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      forecastValue: '220K',
      previousValue: '215K',
      goldImpact: 'bullish',
      description: 'افزایش ادعای بیکاری نگرانی‌های اقتصادی را افزایش داده و تقاضا برای طلا را بالا می‌برد.',
    },
    {
      title: 'PMI Manufacturing',
      titleFa: 'شاخص مدیران خرید صنعت',
      country: 'US',
      impact: 'medium',
      eventDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000),
      forecastValue: '49.8',
      previousValue: '49.2',
      goldImpact: 'mixed',
      description: 'PMI زیر ۵۰ نشان‌دهنده انقباض صنعت است و می‌تواند از طلا حمایت کند.',
    },
    {
      title: 'Iran Gold Coin Price Update',
      titleFa: 'بروزرسانی قیمت سکه طلا ایران',
      country: 'IR',
      impact: 'high',
      eventDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      forecastValue: '25,500,000',
      previousValue: '25,200,000',
      goldImpact: 'bullish',
      description: 'تغییرات قیمت سکه و طلای ایران تحت تأثیر نرخ ارز و سیاست‌های بانک مرکزی.',
    },
    {
      title: 'Crude Oil Inventories',
      titleFa: 'موجودی نفت خام',
      country: 'US',
      impact: 'low',
      eventDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      forecastValue: '-1.2M',
      previousValue: '-2.5M',
      goldImpact: 'neutral',
      description: 'تغییرات موجودی نفت می‌تواند بر بازارهای جهانی تأثیر بگذارد.',
    },
  ]
}

export async function GET() {
  try {
    // Check if any events exist
    let events = await db.economicEvent.findMany({
      where: {
        eventDate: { gte: new Date() },
      },
      orderBy: { eventDate: 'asc' },
    })

    // If no upcoming events, seed with sample data
    if (events.length === 0) {
      const seedData = getSeedEvents()

      await db.economicEvent.createMany({
        data: seedData.map((event) => ({
          ...event,
          actualValue: null,
        })),
      })

      events = await db.economicEvent.findMany({
        orderBy: { eventDate: 'asc' },
      })
    }

    // Group events by impact level
    const highImpact = events.filter((e) => e.impact === 'high')
    const mediumImpact = events.filter((e) => e.impact === 'medium')
    const lowImpact = events.filter((e) => e.impact === 'low')

    // Gold impact summary
    const bullishEvents = events.filter(
      (e) => e.goldImpact === 'bullish' && new Date(e.eventDate) >= new Date()
    )
    const bearishEvents = events.filter(
      (e) => e.goldImpact === 'bearish' && new Date(e.eventDate) >= new Date()
    )

    return NextResponse.json({
      success: true,
      events,
      summary: {
        total: events.length,
        highImpact: highImpact.length,
        mediumImpact: mediumImpact.length,
        lowImpact: lowImpact.length,
        bullishCount: bullishEvents.length,
        bearishCount: bearishEvents.length,
        sentiment:
          bullishEvents.length > bearishEvents.length
            ? 'bullish'
            : bearishEvents.length > bullishEvents.length
              ? 'bearish'
              : 'neutral',
      },
    })
  } catch (error) {
    console.error('Economic calendar error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تقویم اقتصادی' },
      { status: 500 }
    )
  }
}

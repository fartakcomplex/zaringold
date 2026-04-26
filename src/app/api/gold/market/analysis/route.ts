import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get latest price
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    // Get recent price history (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const priceHistory = await db.priceHistory.findMany({
      where: {
        timestamp: { gte: thirtyDaysAgo },
      },
      orderBy: { timestamp: 'asc' },
      take: 720,
    })

    // Calculate statistics
    const prices = priceHistory.map((p) => p.price)
    const high24h = prices.length > 0 ? Math.max(...prices) : latestPrice?.buyPrice ?? 0
    const low24h = prices.length > 0 ? Math.min(...prices) : latestPrice?.sellPrice ?? 0
    const avgPrice = prices.length > 0
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : latestPrice?.marketPrice ?? 0
    const currentPrice = latestPrice?.marketPrice ?? avgPrice
    const changePercent = avgPrice > 0
      ? Number((((currentPrice - avgPrice) / avgPrice) * 100).toFixed(2))
      : 0

    // Calculate RSI-like indicator (simplified)
    let gains = 0
    let losses = 0
    const recentPrices = prices.slice(-14)
    for (let i = 1; i < recentPrices.length; i++) {
      const diff = recentPrices[i] - recentPrices[i - 1]
      if (diff > 0) gains += diff
      else losses += Math.abs(diff)
    }
    const avgGain = gains / 14
    const avgLoss = losses / 14 || 1
    const rs = avgGain / avgLoss
    const rsi = Number((100 - 100 / (1 + rs)).toFixed(1))

    // Generate support/resistance levels
    const spread = high24h - low24h
    const support = Math.round(low24h + spread * 0.2)
    const resistance = Math.round(high24h - spread * 0.2)

    // Mock economic calendar
    const economicCalendar = [
      { event: 'انتشار نرخ تورم آمریکا', impact: 'high', date: '۲ ساعت بعد' },
      { event: 'بیانات رئیس فدرال رزرو', impact: 'high', date: '۵ ساعت بعد' },
      { event: 'آمار بیکاری اروپا', impact: 'medium', date: '明天' },
      { event: 'انتشار شاخص PMI چین', impact: 'medium', date: '后天' },
      { event: 'جلسه بانک مرکزی انگلستان', impact: 'low', date: '۳ روز بعد' },
      { event: 'آمار تولید ناخالص داخلی ژاپن', impact: 'medium', date: '۴ روز بعد' },
    ]

    // Mock market news
    const marketNews = [
      {
        id: 1,
        title: 'افزایش ۲.۳ درصدی قیمت طلا در بازار جهانی',
        source: 'رویترز',
        time: '۲ ساعت پیش',
        category: 'جهانی',
      },
      {
        id: 2,
        title: 'بانک مرکزی: سکه تمام به ۲۸ میلیون و ۵۰۰ هزار واحد طلایی رسید',
        source: 'ایسنا',
        time: '۳ ساعت پیش',
        category: 'داخلی',
      },
      {
        id: 3,
        title: 'پیش‌بینی کارشناسان: روند صعودی طلا تا پایان سال',
        source: 'دنیای اقتصاد',
        time: '۵ ساعت پیش',
        category: 'تحلیل',
      },
      {
        id: 4,
        title: 'اثر تعرفه‌های گمرکی جدید بر قیمت طلای آب‌شده',
        source: 'تحلیل‌گران',
        time: '۸ ساعت پیش',
        category: 'قوانین',
      },
      {
        id: 5,
        title: 'افت ۰.۵ درصدی نرخ دلار، تأثیر بر بازار طلای ایران',
        source: 'صرافی‌ها',
        time: '۱۰ ساعت پیش',
        category: 'ارزی',
      },
      {
        id: 6,
        title: 'رکورد جدید اونس جهانی طلا: ۲,۶۸۰ دلار',
        source: 'بلومبرگ',
        time: '۱۲ ساعت پیش',
        category: 'جهانی',
      },
      {
        id: 7,
        title: 'افزایش تقاضای فیزیکی طلا در بازار آسیا',
        source: 'گلدمان ساکس',
        time: '۱ روز پیش',
        category: 'جهانی',
      },
    ]

    // Price comparison (gold, silver, dollar)
    const comparisons = [
      {
        name: 'طلای آب‌شده',
        price: currentPrice,
        unit: 'واحد طلایی/گرم',
        change: changePercent,
      },
      {
        name: 'نقره',
        price: Math.round(currentPrice * 0.011),
        unit: 'واحد طلایی/گرم',
        change: Number((changePercent * 0.8).toFixed(2)),
      },
      {
        name: 'دلار آمریکا',
        price: Math.round(currentPrice / 85000),
        unit: 'واحد طلایی',
        change: Number((changePercent * -0.5).toFixed(2)),
      },
      {
        name: 'اونس جهانی',
        price: Math.round(currentPrice * 0.03215 / 850),
        unit: 'دلار',
        change: Number((changePercent * 1.2).toFixed(2)),
      },
    ]

    // Moving averages (7-day and 30-day simplified)
    const prices7d = prices.slice(-7)
    const ma7 = prices7d.length > 0
      ? Math.round(prices7d.reduce((a, b) => a + b, 0) / prices7d.length)
      : currentPrice
    const ma30 = avgPrice

    return NextResponse.json({
      success: true,
      currentPrice,
      high24h,
      low24h,
      avgPrice,
      changePercent,
      rsi,
      support,
      resistance,
      ma7,
      ma30,
      economicCalendar,
      marketNews,
      comparisons,
      priceHistory: priceHistory.map((p) => ({
        timestamp: p.timestamp.toISOString(),
        price: p.price,
        open: p.openPrice,
        high: p.highPrice,
        low: p.lowPrice,
        close: p.closePrice,
        volume: p.volume,
      })),
    })
  } catch (error) {
    console.error('Market analysis error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات بازار' },
      { status: 500 },
    )
  }
}

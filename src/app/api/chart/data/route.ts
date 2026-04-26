import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Timeframe to interval mapping (in minutes)
const TIMEFRAME_MAP: Record<string, number> = {
  '1m': 1,
  '5m': 5,
  '15m': 15,
  '1h': 60,
  '4h': 240,
  '1D': 1440,
  '1W': 10080,
}

// Number of historical data points to generate for each timeframe
const TIMEFRAME_HISTORY: Record<string, number> = {
  '1m': 500,
  '5m': 500,
  '15m': 400,
  '1h': 350,
  '4h': 300,
  '1D': 250,
  '1W': 150,
}

/**
 * Generate realistic OHLCV candlestick data
 */
function generateMockCandles(
  timeframe: string,
  count: number,
  basePrice: number
): Array<{
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}> {
  const candles: Array<{
    time: number
    open: number
    high: number
    low: number
    close: number
    volume: number
  }> = []

  const intervalMs = (TIMEFRAME_MAP[timeframe] || 60) * 60 * 1000
  let currentPrice = basePrice
  const now = new Date()

  // Add some trend + noise
  let trendDirection = 1
  let trendStrength = 0.0003

  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * intervalMs).getTime()

    // Random walk with trend
    const noise = (Math.random() - 0.5) * basePrice * 0.004
    const trend = trendDirection * trendStrength * basePrice
    const change = noise + trend

    currentPrice = Math.max(basePrice * 0.85, currentPrice + change)

    const open = currentPrice
    const close = open + (Math.random() - 0.48) * basePrice * 0.003
    const wickUp = Math.random() * basePrice * 0.002
    const wickDown = Math.random() * basePrice * 0.002
    const high = Math.max(open, close) + wickUp
    const low = Math.min(open, close) - wickDown

    const volume = Math.round((Math.random() * 800 + 200) * 1000)

    candles.push({
      time,
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
      volume,
    })

    // Occasionally change trend
    if (Math.random() < 0.02) {
      trendDirection *= -1
      trendStrength = Math.random() * 0.0005 + 0.0001
    }
  }

  return candles
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '1h'
    const limit = parseInt(searchParams.get('limit') || '500', 10)

    // Validate timeframe
    const validTimeframes = ['1m', '5m', '15m', '1h', '4h', '1D', '1W']
    if (!validTimeframes.includes(timeframe)) {
      return NextResponse.json(
        { success: false, error: `Timeframe نامعتبر. مقادیر مجاز: ${validTimeframes.join(', ')}` },
        { status: 400 }
      )
    }

    // Get base price from latest gold price
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })
    const basePrice = latestPrice?.marketPrice || 35000000

    // Try to get data from PriceHistory
    const historyCount = Math.min(limit, TIMEFRAME_HISTORY[timeframe] || 500)
    const intervalMinutes = TIMEFRAME_MAP[timeframe] || 60
    const cutoffTime = new Date(
      Date.now() - historyCount * intervalMinutes * 60 * 1000
    )

    const priceHistory = await db.priceHistory.findMany({
      where: {
        timestamp: { gte: cutoffTime },
        interval: timeframe,
      },
      orderBy: { timestamp: 'asc' },
      take: limit,
    })

    let candles: Array<{
      time: number
      open: number
      high: number
      low: number
      close: number
      volume: number
    }>

    if (priceHistory.length > 10) {
      // Use real data from PriceHistory
      candles = priceHistory.map((p) => ({
        time: p.timestamp.getTime(),
        open: p.openPrice,
        high: p.highPrice,
        low: p.lowPrice,
        close: p.closePrice,
        volume: p.volume,
      }))
    } else {
      // Generate mock data
      candles = generateMockCandles(timeframe, Math.min(limit, historyCount), basePrice)
    }

    return NextResponse.json({
      success: true,
      data: {
        timeframe,
        candles,
        count: candles.length,
      },
    })
  } catch (error) {
    console.error('[Chart/Data] Error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت داده‌های نمودار' },
      { status: 500 }
    )
  }
}

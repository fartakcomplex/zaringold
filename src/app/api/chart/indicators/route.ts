import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const TIMEFRAME_MAP: Record<string, number> = {
  '1m': 1,
  '5m': 5,
  '15m': 15,
  '1h': 60,
  '4h': 240,
  '1D': 1440,
  '1W': 10080,
}

/**
 * RSI calculation (14-period default)
 */
function calculateRSI(closes: number[], period = 14): Array<{ time: number; value: number }> {
  if (closes.length < period + 1) return []

  const rsiValues: Array<{ time: number; value: number }> = []
  const gains: number[] = []
  const losses: number[] = []

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? Math.abs(diff) : 0)
  }

  // First RSI uses simple average
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period

  for (let i = period; i < gains.length; i++) {
    // Smoothed average
    avgGain = (avgGain * (period - 1) + gains[i]) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    const rsi = 100 - 100 / (1 + rs)
    rsiValues.push({ time: Date.now() - (gains.length - i) * 3600000, value: Number(rsi.toFixed(2)) })
  }

  return rsiValues
}

/**
 * EMA calculation
 */
function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = []
  const multiplier = 2 / (period + 1)

  // First EMA is SMA
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += data[i]
  }
  ema.push(sum / period)

  for (let i = period; i < data.length; i++) {
    const value = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]
    ema.push(Number(value.toFixed(2)))
  }

  return ema
}

/**
 * MACD calculation (12, 26, 9)
 */
function calculateMACD(closes: number[]): {
  macdLine: Array<{ time: number; value: number }>
  signalLine: Array<{ time: number; value: number }>
  histogram: Array<{ time: number; value: number }>
} {
  if (closes.length < 26) {
    return { macdLine: [], signalLine: [], histogram: [] }
  }

  const ema12 = calculateEMA(closes, 12)
  const ema26 = calculateEMA(closes, 26)

  const macdLine: Array<{ time: number; value: number }> = []
  const macdValues: number[] = []

  for (let i = 0; i < ema12.length; i++) {
    const ema26Index = i + (12 - 26)
    if (ema26Index >= 0 && ema26Index < ema26.length) {
      const val = Number((ema12[i] - ema26[ema26Index]).toFixed(2))
      macdValues.push(val)
      macdLine.push({ time: Date.now() - (closes.length - 12 - i) * 3600000, value: val })
    }
  }

  // Signal line (9-period EMA of MACD)
  const signalEma = calculateEMA(macdValues, 9)
  const signalLine: Array<{ time: number; value: number }> = []
  const histogram: Array<{ time: number; value: number }> = []

  for (let i = 0; i < signalEma.length; i++) {
    const macdIndex = i + (macdValues.length - signalEma.length)
    const macdVal = macdValues[macdIndex] || 0
    const signalVal = signalEma[i]
    signalLine.push({ time: macdLine[macdIndex]?.time || Date.now(), value: signalVal })
    histogram.push({ time: macdLine[macdIndex]?.time || Date.now(), value: Number((macdVal - signalVal).toFixed(2)) })
  }

  return { macdLine, signalLine, histogram }
}

/**
 * Bollinger Bands calculation (20-period, 2 std dev)
 */
function calculateBollingerBands(closes: number[], period = 20, stdDev = 2): {
  upper: Array<{ time: number; value: number }>
  middle: Array<{ time: number; value: number }>
  lower: Array<{ time: number; value: number }>
} {
  if (closes.length < period) {
    return { upper: [], middle: [], lower: [] }
  }

  const upper: Array<{ time: number; value: number }> = []
  const middle: Array<{ time: number; value: number }> = []
  const lower: Array<{ time: number; value: number }> = []

  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1)
    const mean = slice.reduce((a, b) => a + b, 0) / period
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period
    const std = Math.sqrt(variance)

    const time = Date.now() - (closes.length - 1 - i) * 3600000
    upper.push({ time, value: Number((mean + stdDev * std).toFixed(2)) })
    middle.push({ time, value: Number(mean.toFixed(2)) })
    lower.push({ time, value: Number((mean - stdDev * std).toFixed(2)) })
  }

  return { upper, middle, lower }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '1h'
    const indicator = searchParams.get('indicator') || 'rsi'

    const validTimeframes = ['1m', '5m', '15m', '1h', '4h', '1D', '1W']
    const validIndicators = ['rsi', 'macd', 'ema', 'bollinger']

    if (!validTimeframes.includes(timeframe)) {
      return NextResponse.json(
        { success: false, error: `Timeframe نامعتبر` },
        { status: 400 }
      )
    }

    if (!validIndicators.includes(indicator)) {
      return NextResponse.json(
        { success: false, error: `اندیکاتور نامعتبر. مقادیر مجاز: ${validIndicators.join(', ')}` },
        { status: 400 }
      )
    }

    // Get price history
    const intervalMinutes = TIMEFRAME_MAP[timeframe] || 60
    const cutoffTime = new Date(Date.now() - 200 * intervalMinutes * 60 * 1000)

    const priceHistory = await db.priceHistory.findMany({
      where: {
        timestamp: { gte: cutoffTime },
      },
      orderBy: { timestamp: 'asc' },
      take: 300,
    })

    // If not enough data, generate mock closes
    let closes: number[]
    if (priceHistory.length > 30) {
      closes = priceHistory.map((p) => p.closePrice)
    } else {
      const basePrice = (await db.goldPrice.findFirst({
        orderBy: { createdAt: 'desc' },
      }))?.marketPrice || 35000000

      closes = []
      let price = basePrice
      for (let i = 0; i < 200; i++) {
        price += (Math.random() - 0.48) * basePrice * 0.003
        price = Math.max(basePrice * 0.85, price)
        closes.push(Math.round(price))
      }
    }

    let result: Record<string, unknown> = {}

    switch (indicator) {
      case 'rsi': {
        const rsi = calculateRSI(closes)
        result = { indicator: 'RSI', period: 14, data: rsi }
        break
      }
      case 'macd': {
        const macd = calculateMACD(closes)
        result = {
          indicator: 'MACD',
          params: { fast: 12, slow: 26, signal: 9 },
          ...macd,
        }
        break
      }
      case 'ema': {
        const ema9 = calculateEMA(closes, 9)
        const ema21 = calculateEMA(closes, 21)
        const ema50 = calculateEMA(closes, 50)
        const offset = closes.length - ema9.length

        result = {
          indicator: 'EMA',
          ema9: ema9.map((v, i) => ({ time: Date.now() - (ema9.length - 1 - i) * 3600000, value: v })),
          ema21: ema21.map((v, i) => ({ time: Date.now() - (ema21.length - 1 - i) * 3600000, value: v })),
          ema50: ema50.map((v, i) => ({ time: Date.now() - (ema50.length - 1 - i) * 3600000, value: v })),
        }
        break
      }
      case 'bollinger': {
        const bb = calculateBollingerBands(closes, 20, 2)
        result = {
          indicator: 'Bollinger Bands',
          params: { period: 20, stdDev: 2 },
          ...bb,
        }
        break
      }
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[Chart/Indicators] Error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در محاسبه اندیکاتورها' },
      { status: 500 }
    )
  }
}

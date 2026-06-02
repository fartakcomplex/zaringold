import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/* ═══════════════════════════════════════════════════════════════ */
/*  Technical Indicator Helpers                                   */
/* ═══════════════════════════════════════════════════════════════ */

/** Simple Moving Average over `period` data points */
function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((sum, p) => sum + p, 0) / period;
}

/** RSI (Relative Strength Index) using Wilder's smoothing */
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50; // neutral default

  let gains = 0;
  let losses = 0;

  // Initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Subsequent smoothing
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/** MACD (Moving Average Convergence Divergence) */
function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number | null; signal: number | null; histogram: number | null } {
  const closePrices = prices.map((p) => p);

  if (closePrices.length < slowPeriod + signalPeriod) {
    return { macd: null, signal: null, histogram: null };
  }

  // Calculate EMA helper
  const ema = (data: number[], period: number): number[] => {
    const result: number[] = [];
    const multiplier = 2 / (period + 1);
    result[0] = data[0];
    for (let i = 1; i < data.length; i++) {
      result[i] = (data[i] - result[i - 1]) * multiplier + result[i - 1];
    }
    return result;
  };

  const fastEMA = ema(closePrices, fastPeriod);
  const slowEMA = ema(closePrices, slowPeriod);

  const macdLine: number[] = [];
  for (let i = 0; i < closePrices.length; i++) {
    macdLine.push(fastEMA[i] - slowEMA[i]);
  }

  const signalLine = ema(macdLine, signalPeriod);

  const lastIndex = macdLine.length - 1;
  const macdVal = macdLine[lastIndex];
  const signalVal = signalLine[lastIndex];

  return {
    macd: Math.round(macdVal * 100) / 100,
    signal: Math.round(signalVal * 100) / 100,
    histogram: Math.round((macdVal - signalVal) * 100) / 100,
  };
}

/** Bollinger Bands (20-period, 2 std dev) */
function calculateBollinger(
  prices: number[],
  period: number = 20,
  stdMultiplier: number = 2
): { upper: number | null; middle: number | null; lower: number | null } {
  if (prices.length < period) return { upper: null, middle: null, lower: null };

  const slice = prices.slice(-period);
  const sma = slice.reduce((sum, p) => sum + p, 0) / period;

  const variance =
    slice.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
  const std = Math.sqrt(variance);

  return {
    upper: Math.round((sma + stdMultiplier * std) * 100) / 100,
    middle: Math.round(sma * 100) / 100,
    lower: Math.round((sma - stdMultiplier * std) * 100) / 100,
  };
}

/** Determine overall trend from MAs */
function determineTrend(
  ma20: number | null,
  ma50: number | null,
  currentPrice: number
): string {
  if (!ma20 || !ma50) return 'neutral';

  if (currentPrice > ma20 && ma20 > ma50) return 'bullish';
  if (currentPrice < ma20 && ma20 < ma50) return 'bearish';
  if (currentPrice > ma20) return 'slightly_bullish';
  if (currentPrice < ma20) return 'slightly_bearish';
  return 'neutral';
}

/** Generate a simple trading signal from RSI + MACD + Bollinger */
function generateSignal(
  rsi: number,
  macdHistogram: number | null,
  bollinger: { upper: number | null; middle: number | null; lower: number | null },
  currentPrice: number
): { signal: string; strength: string; reasons: string[] } {
  const reasons: string[] = [];

  // RSI signals
  if (rsi < 30) reasons.push('RSI در منطقه اشباع فروش');
  else if (rsi > 70) reasons.push('RSI در منطقه اشباع خرید');

  // MACD signals
  if (macdHistogram !== null) {
    if (macdHistogram > 0) reasons.push('MACD هیستوگرام مثبت');
    else reasons.push('MACD هیستوگرام منفی');
  }

  // Bollinger signals
  if (bollinger.lower && currentPrice <= bollinger.lower) {
    reasons.push('قیمت نزدیک باند پایینی بولینگر');
  } else if (bollinger.upper && currentPrice >= bollinger.upper) {
    reasons.push('قیمت نزدیک باند بالایی بولینگر');
  }

  // Determine signal
  const bullishCount = reasons.filter(
    (r) =>
      r.includes('اشباع فروش') ||
      r.includes('مثبت') ||
      r.includes('باند پایینی')
  ).length;

  const bearishCount = reasons.filter(
    (r) =>
      r.includes('اشباع خرید') ||
      r.includes('منفی') ||
      r.includes('باند بالایی')
  ).length;

  if (bullishCount >= 2) {
    return { signal: 'buy', strength: 'strong', reasons };
  } else if (bearishCount >= 2) {
    return { signal: 'sell', strength: 'strong', reasons };
  } else if (bullishCount > bearishCount) {
    return { signal: 'buy', strength: 'weak', reasons };
  } else if (bearishCount > bullishCount) {
    return { signal: 'sell', strength: 'weak', reasons };
  }

  return { signal: 'hold', strength: 'neutral', reasons };
}

/* ═══════════════════════════════════════════════════════════════ */
/*  GET /api/technical-analysis — Gold technical indicators        */
/* ═══════════════════════════════════════════════════════════════ */
export async function GET() {
  try {
    // Fetch enough price history for all indicators (need at least 50 data points)
    const priceHistory = await prisma.priceHistory.findMany({
      orderBy: { timestamp: 'asc' },
      take: 100,
    });

    if (priceHistory.length < 5) {
      return NextResponse.json({
        rsi: 50,
        macd: { macd: 0, signal: 0, histogram: 0 },
        ma20: null,
        ma50: null,
        bollinger: { upper: null, middle: null, lower: null },
        trend: 'neutral',
        signal: { signal: 'hold', strength: 'neutral', reasons: ['داده‌های کافی در دسترس نیست'] },
        dataPoints: priceHistory.length,
        updatedAt: new Date().toISOString(),
      });
    }

    // Extract close prices array
    const closePrices = priceHistory.map((p) => p.closePrice);

    // Calculate all indicators
    const rsi = calculateRSI(closePrices, 14);
    const macd = calculateMACD(closePrices);
    const ma20 = calculateSMA(closePrices, 20);
    const ma50 = calculateSMA(closePrices, 50);
    const bollinger = calculateBollinger(closePrices, 20, 2);

    const currentPrice = closePrices[closePrices.length - 1];
    const trend = determineTrend(ma20, ma50, currentPrice);
    const signalResult = generateSignal(rsi, macd.histogram, bollinger, currentPrice);

    return NextResponse.json({
      rsi: Math.round(rsi * 100) / 100,
      macd,
      ma20: ma20 ? Math.round(ma20) : null,
      ma50: ma50 ? Math.round(ma50) : null,
      bollinger,
      trend,
      signal: signalResult,
      currentPrice,
      dataPoints: closePrices.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[GET /api/technical-analysis] Error:', error);
    return NextResponse.json(
      { error: 'خطا در محاسبه شاخص‌های تکنیکال' },
      { status: 500 }
    );
  }
}

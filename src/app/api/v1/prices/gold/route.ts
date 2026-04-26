import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GET /api/v1/prices/gold                                                   */
/*  Get current gold price for payment calculations                          */
/*                                                                            */
/*  Returns: { buy, sell, market, ounce, timestamp, gold_per_toman }          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export async function GET() {
  try {
    /* ── Fetch latest gold price ── */
    const latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    if (!latestPrice) {
      return NextResponse.json(
        {
          success: false,
          message: 'اطلاعات قیمت طلا در حال حاضر موجود نیست',
          error_code: -1,
        },
        { status: 404 }
      )
    }

    /* ── Also get price from 24h ago for change comparison ── */
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const previousPrice = await db.goldPrice.findFirst({
      where: { createdAt: { lte: yesterday } },
      orderBy: { createdAt: 'desc' },
    })

    /* ── Calculate 24h change ── */
    let changePercent = 0
    let changeAmount = 0
    let changeDirection: 'up' | 'down' | 'neutral' = 'neutral'

    if (previousPrice) {
      changeAmount = latestPrice.buyPrice - previousPrice.buyPrice
      changePercent =
        previousPrice.buyPrice > 0
          ? (changeAmount / previousPrice.buyPrice) * 100
          : 0
      changeDirection =
        changeAmount > 0 ? 'up' : changeAmount < 0 ? 'down' : 'neutral'
    }

    /* ── Calculate gold_per_toman: how many grams of gold per toman ── */
    const goldPerToman = latestPrice.buyPrice > 0 ? 1 / latestPrice.buyPrice : 0

    /* ── Calculate toman per gram (inverse, already in buyPrice) ── */
    const tomanPerGram = latestPrice.buyPrice

    /* ── Get 7-day price history for charting ── */
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const priceHistory = await db.goldPrice.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: 'asc' },
    })

    /* ── Get 30-day high/low ── */
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const thirtyDayPrices = await db.goldPrice.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { buyPrice: true, sellPrice: true, marketPrice: true },
    })

    let thirtyDayHigh = 0
    let thirtyDayLow = Infinity
    let thirtyDayAvg = 0

    if (thirtyDayPrices.length > 0) {
      thirtyDayHigh = Math.max(...thirtyDayPrices.map((p) => p.buyPrice))
      thirtyDayLow = Math.min(...thirtyDayPrices.map((p) => p.buyPrice))
      thirtyDayAvg =
        thirtyDayPrices.reduce((sum, p) => sum + p.buyPrice, 0) /
        thirtyDayPrices.length
    } else {
      thirtyDayLow = 0
      thirtyDayAvg = latestPrice.buyPrice
    }

    /* ── Build response ── */
    return NextResponse.json({
      success: true,
      data: {
        /* Core prices */
        buy: latestPrice.buyPrice,
        sell: latestPrice.sellPrice,
        market: latestPrice.marketPrice,
        ounce: latestPrice.ouncePrice,
        spread: latestPrice.spread,

        /* Derived values */
        gold_per_toman: goldPerToman,
        toman_per_gram: tomanPerGram,

        /* Metadata */
        currency: latestPrice.currency,
        is_manual: latestPrice.isManual,
        timestamp: latestPrice.createdAt,
        updated_at: latestPrice.createdAt,

        /* 24h change */
        change: {
          amount: Math.round(changeAmount),
          percent: Math.round(changePercent * 100) / 100,
          direction: changeDirection,
        },

        /* 30-day statistics */
        stats_30d: {
          high: thirtyDayHigh,
          low: thirtyDayLow,
          average: Math.round(thirtyDayAvg),
          data_points: thirtyDayPrices.length,
        },

        /* 7-day history */
        history: priceHistory.map((p) => ({
          buy: p.buyPrice,
          sell: p.sellPrice,
          market: p.marketPrice,
          timestamp: p.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('[Gold Price] Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطای داخلی سرور در دریافت قیمت طلا',
        error_code: -99,
      },
      { status: 500 }
    )
  }
}

import { db } from '@/lib/db'
import { getLatestGoldPrice } from '@/lib/gold-prices'
import { NextRequest, NextResponse } from 'next/server';

// CORS headers for cross-origin embedding
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'public, max-age=60, s-maxage=60',
};

/* ═══════════════════════════════════════════════════════════════ */
/*  OPTIONS /api/widget — Handle CORS preflight                    */
/* ═══════════════════════════════════════════════════════════════ */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/* ═══════════════════════════════════════════════════════════════ */
/*  GET /api/widget — Gold price data for embed widget           */
/* ═══════════════════════════════════════════════════════════════ */
export async function GET(request: NextRequest) {
  try {
    // Get latest gold price
    const latestPrice = await getLatestGoldPrice();

    const marketPrice = latestPrice.marketPrice;
    const buyPrice = latestPrice.buyPrice;
    const sellPrice = latestPrice.sellPrice;

    // Get previous price for 24h change calculation
    const previousPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
      skip: 1,
    });

    const previousMarketPrice = previousPrice?.marketPrice ?? marketPrice;
    const change24h =
      previousMarketPrice !== 0
        ? ((marketPrice - previousMarketPrice) / previousMarketPrice) * 100
        : 0;

    // Get recent price history for the widget (last 24 entries)
    const history = await db.priceHistory.findMany({
      orderBy: { timestamp: 'desc' },
      take: 24,
      select: {
        price: true,
        timestamp: true,
        highPrice: true,
        lowPrice: true,
      },
    });

    // Reverse so oldest is first
    const historyData = history.reverse().map((h) => ({
      price: h.price,
      high: h.highPrice,
      low: h.lowPrice,
      time: h.timestamp.toISOString(),
    }));

    const response = NextResponse.json(
      {
        price: marketPrice,
        buy: buyPrice,
        sell: sellPrice,
        change24h: Math.round(change24h * 100) / 100,
        currency: 'IRR',
        history: historyData,
        updatedAt: latestPrice.createdAt.toISOString(),
      },
      { headers: corsHeaders }
    );

    return response;
  } catch (error) {
    console.error('[GET /api/widget] Error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات ابزارک' },
      { status: 500, headers: corsHeaders }
    );
  }
}

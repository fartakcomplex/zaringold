import { NextResponse } from 'next/server'
import { fetchGoldPrices, formatGoldPricesForFrontend } from '@/lib/gold-prices'

/**
 * GET /api/gold/realtime
 * Returns real-time gold and coin prices from multiple sources
 * Sources: AlanChand API → Web Search fallback → Static fallback
 * 
 * Query params:
 * - refresh: "true" to force refresh cache
 * - format: "raw" for raw numbers, "formatted" (default) for Persian formatted
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'
    const format = searchParams.get('format') || 'formatted'

    const prices = await fetchGoldPrices(forceRefresh)

    if (format === 'raw') {
      return NextResponse.json({
        success: true,
        source: prices.source,
        updatedAt: prices.updatedAt,
        prices: {
          geram18: prices.geram18,
          geram24: prices.geram24,
          sekkehEmami: prices.sekkehEmami,
          sekkehBahar: prices.sekkehBahar,
          nimSekkeh: prices.nimSekkeh,
          robSekkeh: prices.robSekkeh,
          sekkehGerami: prices.sekkehGerami,
          ounceUsd: prices.ounceUsd,
          dollar: prices.dollar,
        },
      })
    }

    // Default: return formatted prices for frontend
    const formatted = formatGoldPricesForFrontend(prices)

    return NextResponse.json({
      success: true,
      source: prices.source,
      updatedAt: prices.updatedAt,
      ...formatted,
    })
  } catch (error) {
    console.error('[GoldRealtime] Error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت قیمت طلا' },
      { status: 500 }
    )
  }
}

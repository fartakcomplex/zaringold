import { NextResponse } from 'next/server'

/**
 * GET /api/chart/comparison
 * Returns mock comparison data for gold vs USD and BTC
 */

function generateComparisonData(
  baseValue: number,
  count: number,
  volatility: number
): Array<{ time: number; value: number; change: number }> {
  const data: Array<{ time: number; value: number; change: number }> = []
  let value = baseValue

  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(Date.now() - i * 24 * 60 * 60 * 1000).getTime()
    const prevValue = value
    value += (Math.random() - 0.48) * baseValue * volatility
    value = Math.max(baseValue * 0.7, value)
    const change = Number((((value - prevValue) / prevValue) * 100).toFixed(2))

    data.push({
      time,
      value: Math.round(value),
      change,
    })
  }

  return data
}

export async function GET() {
  try {
    // Gold comparison (per gram 18k in Toman)
    const gold = generateComparisonData(35000000, 90, 0.003)

    // USD/IRR (Toman per USD)
    const usd = generateComparisonData(95000, 90, 0.002)

    // BTC/USD
    const btc = generateComparisonData(105000, 90, 0.015)

    // Summary stats
    const goldChange = gold.length > 1
      ? Number((((gold[gold.length - 1].value - gold[0].value) / gold[0].value) * 100).toFixed(2))
      : 0

    const usdChange = usd.length > 1
      ? Number((((usd[usd.length - 1].value - usd[0].value) / usd[0].value) * 100).toFixed(2))
      : 0

    const btcChange = btc.length > 1
      ? Number((((btc[btc.length - 1].value - btc[0].value) / btc[0].value) * 100).toFixed(2))
      : 0

    return NextResponse.json({
      success: true,
      data: {
        gold: {
          name: 'طلای ۱۸ عیار',
          unit: 'واحد طلایی/گرم',
          currentPrice: gold[gold.length - 1]?.value || 35000000,
          changePercent: goldChange,
          data: gold,
        },
        usd: {
          name: 'دلار آمریکا',
          unit: 'واحد طلایی',
          currentPrice: usd[usd.length - 1]?.value || 95000,
          changePercent: usdChange,
          data: usd,
        },
        btc: {
          name: 'بیت‌کوین',
          unit: 'دلار',
          currentPrice: btc[btc.length - 1]?.value || 105000,
          changePercent: btcChange,
          data: btc,
        },
        period: '90 روز',
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[Chart/Comparison] Error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت داده‌های مقایسه' },
      { status: 500 }
    )
  }
}

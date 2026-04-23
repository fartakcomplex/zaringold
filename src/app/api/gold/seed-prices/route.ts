import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    const basePrice = 34900000
    const now = new Date()

    // Generate 30 days of hourly price data
    const priceRecords: Array<{
      price: number
      openPrice: number
      highPrice: number
      lowPrice: number
      closePrice: number
      timestamp: Date
      interval: string
    }> = []

    let currentPrice = basePrice - 2000000 // Start 2M lower 30 days ago

    for (let day = 29; day >= 0; day--) {
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date(now.getTime() - (day * 24 + hour) * 60 * 60 * 1000)

        // Simulate price movement
        const change = (Math.random() - 0.45) * 200000 // Slight upward bias
        currentPrice = Math.max(currentPrice + change, 30000000)
        currentPrice = Math.min(currentPrice, 40000000)

        const openPrice = currentPrice
        const variation = (Math.random() - 0.5) * 100000
        const highPrice = openPrice + Math.abs(variation)
        const lowPrice = openPrice - Math.abs(variation) * 0.5
        const closePrice = openPrice + variation

        priceRecords.push({
          price: closePrice,
          openPrice,
          highPrice,
          lowPrice,
          closePrice,
          timestamp,
          interval: '1h',
        })
      }
    }

    // Delete existing price history
    await db.priceHistory.deleteMany()

    // Bulk create price history
    await db.priceHistory.createMany({
      data: priceRecords,
    })

    // Create current gold price based on latest simulated price
    const latestClose = priceRecords[priceRecords.length - 1].closePrice
    const buyPrice = Math.round(latestClose * 1.005)
    const sellPrice = Math.round(latestClose * 0.995)

    // Upsert latest price
    await db.goldPrice.create({
      data: {
        buyPrice,
        sellPrice,
        marketPrice: Math.round(latestClose),
        ouncePrice: Math.round(latestClose * 10),
        spread: buyPrice - sellPrice,
        currency: 'IRR',
        isManual: false,
      },
    })

    return NextResponse.json({
      success: true,
      count: priceRecords.length,
      message: `${priceRecords.length} رکورد قیمت ایجاد شد`,
    })
  } catch (error) {
    console.error('Seed prices error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد داده‌های نمونه' },
      { status: 500 }
    )
  }
}

import { NextRequest } from 'next/server'
import { fetchGoldPrices, createPriceTick } from '@/lib/gold-prices'

// Interval configuration in milliseconds
const PRICE_TICK_INTERVAL = 5_000   // 5 seconds (real prices don't change as fast)
const HEARTBEAT_INTERVAL = 15_000  // 15 seconds
const REFRESH_BASE_INTERVAL = 15 * 60 * 1000  // Refresh base prices every 15 minutes (match cache TTL)

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Helper: send a single SSE data line
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // Helper: send an SSE comment (heartbeat)
      function sendHeartbeat() {
        controller.enqueue(encoder.encode(': ping\n\n'))
      }

      // Fetch initial prices (use cache — don't force refresh on every connection)
      let basePrices = await fetchGoldPrices(false)
      let previousBuy = basePrices.geram18
      let refreshTimer = Date.now()

      // Send initial event (raw data for useRealGoldPrice hook compatibility)
      send({
        geram18: basePrices.geram18,
        geram24: basePrices.geram24,
        sekkehEmami: basePrices.sekkehEmami,
        sekkehBahar: basePrices.sekkehBahar,
        nimSekkeh: basePrices.nimSekkeh,
        robSekkeh: basePrices.robSekkeh,
        sekkehGerami: basePrices.sekkehGerami,
        ounceUsd: basePrices.ounceUsd,
        dollar: basePrices.dollar,
        change: 0,
        direction: 'stable' as const,
        timestamp: Math.floor(Date.now() / 1000),
        isLive: true,
        source: basePrices.source,
        updatedAt: basePrices.updatedAt,
      })

      // Start the price tick interval
      const priceInterval = setInterval(async () => {
        try {
          // Refresh base prices periodically from real sources
          if (Date.now() - refreshTimer > REFRESH_BASE_INTERVAL) {
            const fresh = await fetchGoldPrices(false)
            if (fresh) {
              basePrices = fresh
              refreshTimer = Date.now()
            }
          }

          // Generate tick with small fluctuation around real base
          const { prices, changePercent } = createPriceTick(basePrices)
          
          const direction: 'up' | 'down' | 'stable' =
            changePercent > 0.0001 ? 'up' : changePercent < -0.0001 ? 'down' : 'stable'

          // Send raw data for hook compatibility
          send({
            geram18: prices.geram18,
            geram24: prices.geram24,
            sekkehEmami: prices.sekkehEmami,
            sekkehBahar: prices.sekkehBahar,
            nimSekkeh: prices.nimSekkeh,
            robSekkeh: prices.robSekkeh,
            sekkehGerami: prices.sekkehGerami,
            ounceUsd: prices.ounceUsd,
            dollar: prices.dollar,
            change: changePercent,
            direction,
            timestamp: Math.floor(Date.now() / 1000),
            isLive: true,
            source: prices.source,
            updatedAt: prices.updatedAt,
          })

          previousBuy = prices.geram18
        } catch (err) {
          console.error('[GoldPriceStream] Tick error:', err)
        }
      }, PRICE_TICK_INTERVAL)

      // Start the heartbeat interval
      const heartbeatInterval = setInterval(() => {
        sendHeartbeat()
      }, HEARTBEAT_INTERVAL)

      // Clean up intervals when the client disconnects
      function cleanup() {
        clearInterval(priceInterval)
        clearInterval(heartbeatInterval)
        try {
          controller.close()
        } catch {
          // Controller may already be closed
        }
      }

      // Listen for client abort (connection close)
      request.signal.addEventListener('abort', cleanup, { once: true })
    },
  })

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://zaringold.ir', 'https://www.zaringold.ir'];
  const origin = request.headers.get('origin') || '';
  const headers: Record<string, string> = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Cache-Control, EventSource',
  };
  if (allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }

  return new Response(stream, { headers })
}

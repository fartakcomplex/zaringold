'use client'

import {useState, useEffect, useCallback, useRef} from 'react'

// ─── Types ───────────────────────────────────────────────────────────

export interface CoinPrice {
  name: string
  price: number       // Raw price in toman
  priceFormatted: string
  change: number      // Percentage change
  direction: 'up' | 'down' | 'stable'
}

export interface RealtimeGoldPrices {
  geram18: number
  geram24: number
  sekkehEmami: number
  sekkehBahar: number
  nimSekkeh: number
  robSekkeh: number
  sekkehGerami: number
  ounceUsd: number
  dollar: number
  source: string
  updatedAt: string
}

export interface GoldPriceHookState {
  prices: RealtimeGoldPrices | null
  coinPrices: CoinPrice[]
  isLoading: boolean
  isLive: boolean
  source: string
  lastUpdate: string | null
  error: string | null
  refresh: () => void
}

// ─── Format helpers ──────────────────────────────────────────────────

function fmtPersian(n: number): string {
  return new Intl.NumberFormat('fa-IR').format(n)
}

function formatChange(pct: number): string {
  if (pct > 0) return `+${pct.toFixed(1)}٪`
  if (pct < 0) return `${pct.toFixed(1)}٪`
  return '۰٪'
}

// ─── Static defaults (shown before API loads) ────────────────────────

const DEFAULT_PRICES: RealtimeGoldPrices = {
  geram18: 24_500_000,
  geram24: 32_670_000,
  sekkehEmami: 198_000_000,
  sekkehBahar: 192_000_000,
  nimSekkeh: 106_000_000,
  robSekkeh: 61_000_000,
  sekkehGerami: 31_000_000,
  ounceUsd: 3_150,
  dollar: 95_000,
  source: 'default',
  updatedAt: '',
}

// ─── Main Hook ───────────────────────────────────────────────────────

// ─── Helper: Extract raw number from SSE data (could be raw number or formatted object) ──
function extractPrice(val: unknown, fallback: number): number {
  if (typeof val === 'number' && !isNaN(val) && val > 0) return val
  if (typeof val === 'object' && val !== null) {
    const obj = val as { priceRaw?: number; price?: string | number }
    if (typeof obj.priceRaw === 'number' && !isNaN(obj.priceRaw) && obj.priceRaw > 0) return obj.priceRaw
    if (typeof obj.price === 'number' && !isNaN(obj.price) && obj.price > 0) return obj.price
    if (typeof obj.price === 'string') {
      const parsed = Number(obj.price.replace(/[^0-9.-]/g, ''))
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
  }
  return fallback
}

export function useRealGoldPrice(): GoldPriceHookState {
  const [prices, setPrices] = useState<RealtimeGoldPrices | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const prevEmamiRef = useRef<number>(DEFAULT_PRICES.sekkehEmami)
  const sseRef = useRef<EventSource | null>(null)

  const fetchPrices = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/gold/realtime?format=raw')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      if (data.success && data.prices) {
        const rp = data.prices
        setPrices({
          geram18: extractPrice(rp.geram18, DEFAULT_PRICES.geram18),
          geram24: extractPrice(rp.geram24, DEFAULT_PRICES.geram24),
          sekkehEmami: extractPrice(rp.sekkehEmami, DEFAULT_PRICES.sekkehEmami),
          sekkehBahar: extractPrice(rp.sekkehBahar, DEFAULT_PRICES.sekkehBahar),
          nimSekkeh: extractPrice(rp.nimSekkeh, DEFAULT_PRICES.nimSekkeh),
          robSekkeh: extractPrice(rp.robSekkeh, DEFAULT_PRICES.robSekkeh),
          sekkehGerami: extractPrice(rp.sekkehGerami, DEFAULT_PRICES.sekkehGerami),
          ounceUsd: extractPrice(rp.ounceUsd, DEFAULT_PRICES.ounceUsd),
          dollar: extractPrice(rp.dollar, DEFAULT_PRICES.dollar),
          source: data.source || 'unknown',
          updatedAt: data.updatedAt || new Date().toISOString(),
        })
        setIsLive(true)
      }
    } catch (err) {
      console.warn('[useRealGoldPrice] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  // Connect to SSE for real-time updates
  useEffect(() => {
    let es: EventSource | null = null

    try {
      es = new EventSource('/api/gold/price/stream')

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.geram18) {
            setPrices((prev) => {
              const p = prev || DEFAULT_PRICES
              const newData: RealtimeGoldPrices = {
                geram18: extractPrice(data.geram18, p.geram18),
                geram24: extractPrice(data.geram24, p.geram24),
                sekkehEmami: extractPrice(data.sekkehEmami, p.sekkehEmami),
                sekkehBahar: extractPrice(data.sekkehBahar, p.sekkehBahar),
                nimSekkeh: extractPrice(data.nimSekkeh, p.nimSekkeh),
                robSekkeh: extractPrice(data.robSekkeh, p.robSekkeh),
                sekkehGerami: extractPrice(data.sekkehGerami, p.sekkehGerami),
                ounceUsd: extractPrice(data.ounceUsd, p.ounceUsd),
                dollar: extractPrice(data.dollar, p.dollar),
                source: (typeof data.source === 'string' ? data.source : p.source) || 'sse',
                updatedAt: data.updatedAt || p.updatedAt || new Date().toISOString(),
              }
              return newData
            })
            setIsLive(true)
          }
        } catch {
          // Ignore parse errors
        }
      }

      es.onerror = () => {
        // SSE disconnected — don't crash, just stop live updates
        setIsLive(false)
      }

      sseRef.current = es
    } catch {
      // EventSource not available
    }

    return () => {
      es?.close()
      sseRef.current = null
    }
  }, [])

  // Build coin prices array from raw prices
  const coinPrices: CoinPrice[] = prices
    ? [
        { name: 'سکه امامی', price: prices.sekkehEmami, priceFormatted: fmtPersian(prices.sekkehEmami), change: 0, direction: 'stable' },
        { name: 'نیم سکه', price: prices.nimSekkeh, priceFormatted: fmtPersian(prices.nimSekkeh), change: 0, direction: 'stable' },
        { name: 'ربع سکه', price: prices.robSekkeh, priceFormatted: fmtPersian(prices.robSekkeh), change: 0, direction: 'stable' },
        { name: 'سکه گرمی', price: prices.sekkehGerami, priceFormatted: fmtPersian(prices.sekkehGerami), change: 0, direction: 'stable' },
      ]
    : [
        { name: 'سکه امامی', price: DEFAULT_PRICES.sekkehEmami, priceFormatted: fmtPersian(DEFAULT_PRICES.sekkehEmami), change: 0, direction: 'stable' },
        { name: 'نیم سکه', price: DEFAULT_PRICES.nimSekkeh, priceFormatted: fmtPersian(DEFAULT_PRICES.nimSekkeh), change: 0, direction: 'stable' },
        { name: 'ربع سکه', price: DEFAULT_PRICES.robSekkeh, priceFormatted: fmtPersian(DEFAULT_PRICES.robSekkeh), change: 0, direction: 'stable' },
        { name: 'سکه گرمی', price: DEFAULT_PRICES.sekkehGerami, priceFormatted: fmtPersian(DEFAULT_PRICES.sekkehGerami), change: 0, direction: 'stable' },
      ]

  // Add change direction based on previous values
  if (prices) {
    for (const coin of coinPrices) {
      if (coin.name === 'سکه امامی' && prevEmamiRef.current !== coin.price) {
        const diff = ((coin.price - prevEmamiRef.current) / prevEmamiRef.current) * 100
        coin.change = Number(diff.toFixed(2))
        coin.direction = diff > 0.001 ? 'up' : diff < -0.001 ? 'down' : 'stable'
      }
    }
    prevEmamiRef.current = prices.sekkehEmami
  }

  return {
    prices: prices || DEFAULT_PRICES,
    coinPrices,
    isLoading,
    isLive,
    source: prices?.source || 'default',
    lastUpdate: prices?.updatedAt || null,
    error,
    refresh: fetchPrices,
  }
}

// ─── Source Label Helper ─────────────────────────────────────────────

export function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    alanchand: 'الان‌چند',
    'web-search': 'جستجوی وب',
    'static-fallback': 'آخرین قیمت ثبت‌شده',
    sse: 'زنده',
    default: 'پیش‌فرض',
  }
  return labels[source] || source
}

export function getSourceColor(source: string): string {
  const colors: Record<string, string> = {
    alanchand: 'text-emerald-500',
    'web-search': 'text-amber-500',
    'static-fallback': 'text-muted-foreground',
    sse: 'text-emerald-400',
    default: 'text-muted-foreground',
  }
  return colors[source] || 'text-muted-foreground'
}

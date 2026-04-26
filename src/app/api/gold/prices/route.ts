import { NextResponse } from 'next/server';

const DEFAULT_GOLD_PRICE = 8_900_000;

/* ═══════════════════════════════════════════════════════════════ */
/*  GET /api/gold/prices — Gold price for conversion               */
/* ═══════════════════════════════════════════════════════════════ */
export async function GET() {
  // In production, fetch from live price source
  return NextResponse.json({
    buyPrice: DEFAULT_GOLD_PRICE,
    sellPrice: DEFAULT_GOLD_PRICE - 25_000,
    marketPrice: DEFAULT_GOLD_PRICE,
    ouncePrice: 2_650_000_000,
    spread: 25_000,
    updatedAt: new Date().toISOString(),
  });
}

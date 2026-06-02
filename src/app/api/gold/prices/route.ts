import { NextResponse } from 'next/server';
import { fetchGoldPrices } from '@/lib/gold-prices';

/**
 * GET /api/gold/prices — Unified gold price endpoint
 * Fetches real-time prices from the multi-source price engine.
 * Returns buy/sell prices compatible with the legacy format.
 */
export async function GET() {
  try {
    const prices = await fetchGoldPrices(false);
    
    // Calculate buy/sell spread from geram18 price
    const spread = Math.round(prices.geram18 * 0.003); // 0.3% spread
    const buyPrice = prices.geram18 + Math.round(spread / 2);
    const sellPrice = prices.geram18 - Math.round(spread / 2);
    
    return NextResponse.json({
      buyPrice,
      sellPrice,
      marketPrice: prices.geram18,
      ouncePrice: prices.ounceUsd * prices.dollar * 10, // Ounce in Toman
      spread,
      geram18: prices.geram18,
      geram24: prices.geram24,
      sekkehEmami: prices.sekkehEmami,
      sekkehBahar: prices.sekkehBahar,
      nimSekkeh: prices.nimSekkeh,
      robSekkeh: prices.robSekkeh,
      sekkehGerami: prices.sekkehGerami,
      ounceUsd: prices.ounceUsd,
      dollar: prices.dollar,
      source: prices.source,
      updatedAt: prices.updatedAt,
    });
  } catch (error) {
    console.error('[GoldPrices API] Error:', error);
    return NextResponse.json(
      { 
        buyPrice: 21_900_000, 
        sellPrice: 21_850_000, 
        marketPrice: 21_900_000,
        source: 'error-fallback',
        updatedAt: new Date().toISOString() 
      },
      { status: 200 } // Always return 200 with fallback
    );
  }
}

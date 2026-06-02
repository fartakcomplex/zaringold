import { NextResponse } from 'next/server';
import { getLiveGoldPrice } from '@/lib/gold-prices';

/**
 * GET /api/gold/prices — Unified gold price endpoint
 * Returns all gold prices including Iranian coin prices.
 * Uses getLiveGoldPrice() which auto-syncs from live sources.
 */
export async function GET() {
  try {
    const prices = await getLiveGoldPrice();
    
    return NextResponse.json({
      // Core buy/sell/market
      buyPrice: prices.buyPrice,
      sellPrice: prices.sellPrice,
      marketPrice: prices.marketPrice,
      ouncePrice: prices.ouncePrice,
      spread: prices.spread,
      // Full Iranian gold prices
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
      success: true,
    });
  } catch (error) {
    console.error('[GoldPrices API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'خطا در دریافت قیمت طلا',
      },
      { status: 500 }
    );
  }
}

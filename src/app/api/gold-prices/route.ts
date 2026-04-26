import { NextResponse } from "next/server";

interface GoldPrice {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  change: number;
  changePercent: number;
  icon: string;
  sparkline: number[];
}

function generateSparkline(base: number, points: number = 20): number[] {
  const data: number[] = [];
  let current = base * 0.97;
  for (let i = 0; i < points; i++) {
    current += (Math.random() - 0.45) * base * 0.005;
    current = Math.max(current, base * 0.95);
    data.push(Math.round(current));
  }
  data[points - 1] = base;
  return data;
}

function getGoldPrices(): GoldPrice[] {
  const basePrices = [
    { id: "gold-18k", name: "طلای ۱۸ عیار", nameEn: "18K Gold", base: 4250000, icon: "🥇" },
    { id: "gold-24k", name: "طلای ۲۴ عیار", nameEn: "24K Gold", base: 5650000, icon: "🏆" },
    { id: "coin-bahar", name: "سکه بهار آزادی", nameEn: "Bahar Azadi", base: 32500000, icon: "🪙" },
    { id: "coin-half", name: "نیم سکه", nameEn: "Half Coin", base: 18500000, icon: "🪙" },
    { id: "coin-quarter", name: "ربع سکه", nameEn: "Quarter Coin", base: 11200000, icon: "🪙" },
    { id: "geram-gold", name: "طلای یک گرمی", nameEn: "1 Gram Gold", base: 4350000, icon: "✨" },
  ];

  return basePrices.map((item) => {
    const fluctuation = (Math.random() - 0.45) * item.base * 0.008;
    const price = Math.round(item.base + fluctuation);
    const change = Math.round(fluctuation);
    const changePercent = parseFloat(((change / item.base) * 100).toFixed(2));
    return {
      ...item,
      price,
      change,
      changePercent,
      sparkline: generateSparkline(price),
    };
  });
}

export async function GET() {
  try {
    const prices = getGoldPrices();
    return NextResponse.json({
      success: true,
      data: prices,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch gold prices" },
      { status: 500 }
    );
  }
}

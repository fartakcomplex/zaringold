import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export interface Target {
  id: string;
  targetPrice: number;
  direction: 'above' | 'below';
  createdAt: string;
  hit: boolean;
  hitAt?: string;
}

export async function GET() {
  try {
    // Get latest gold price
    let latestPrice = await db.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latestPrice) {
      latestPrice = await db.goldPrice.create({
        data: {
          buyPrice: 35000000,
          sellPrice: 34800000,
          marketPrice: 34900000,
          ouncePrice: 2500000000,
          spread: 200000,
        },
      });
    }

    const currentPrice = latestPrice.marketPrice;

    // Generate mock targets based on current price ±5%
    const now = new Date().toISOString();
    const targets: Target[] = [
      {
        id: 't1',
        targetPrice: Math.round(currentPrice * 1.03),
        direction: 'above',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        hit: false,
      },
      {
        id: 't2',
        targetPrice: Math.round(currentPrice * 0.97),
        direction: 'below',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        hit: false,
      },
      {
        id: 't3',
        targetPrice: Math.round(currentPrice * 1.05),
        direction: 'above',
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        hit: false,
      },
      {
        id: 't4',
        targetPrice: Math.round(currentPrice * 0.96),
        direction: 'below',
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        hit: false,
      },
      {
        id: 't5',
        targetPrice: Math.round(currentPrice * 1.02),
        direction: 'above',
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        hit: true,
        hitAt: new Date(Date.now() - 3600000 * 0.5).toISOString(),
      },
      {
        id: 't6',
        targetPrice: Math.round(currentPrice * 1.015),
        direction: 'above',
        createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
        hit: true,
        hitAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ];

    // Generate mock price history for the last 24 hours
    const history: Array<{ price: number; hit: boolean; timestamp: string }> = [];
    for (let i = 24; i >= 0; i--) {
      const variation = (Math.random() - 0.5) * 0.02;
      history.push({
        price: Math.round(currentPrice * (1 + variation)),
        hit: false,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      currentPrice,
      targets,
      history,
    });
  } catch (error) {
    console.error('Price missile API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}

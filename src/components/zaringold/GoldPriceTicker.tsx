'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TickerItem {
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

function formatCompactPrice(price: number): string {
  if (price >= 1000000) {
    return new Intl.NumberFormat('fa-IR', {
      maximumFractionDigits: 0,
    }).format(price / 1000) + 'K';
  }
  return new Intl.NumberFormat('fa-IR').format(price);
}

export default function GoldPriceTicker() {
  const [items, setItems] = useState<TickerItem[]>([
    { name: 'طلای ۱۸ عیار', price: 8750000, change: 120000, changePercent: 1.39 },
    { name: 'طلای ۲۴ عیار', price: 11600000, change: -85000, changePercent: -0.73 },
    { name: 'سکه بهار آزادی', price: 35200000, change: 450000, changePercent: 1.3 },
    { name: 'نیم سکه', price: 20100000, change: -120000, changePercent: -0.59 },
    { name: 'ربع سکه', price: 12900000, change: 180000, changePercent: 1.42 },
  ]);

  return (
    <div className="border-t border-gold/10 bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 overflow-hidden">
        <div className="flex items-center gap-6 animate-[ticker-scroll_30s_linear_infinite] whitespace-nowrap">
          {items.map((item, i) => {
            const isPositive = item.change >= 0;
            return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground font-medium">{item.name}</span>
                <span className="font-bold text-foreground">
                  {formatCompactPrice(item.price)}
                </span>
                {isPositive ? (
                  <TrendingUp className="w-3 h-3 text-positive" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-negative" />
                )}
                <span
                  className={`font-medium ${
                    isPositive ? 'text-positive' : 'text-negative'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {item.changePercent.toLocaleString('fa-IR')}٪
                </span>
                {i < items.length - 1 && (
                  <span className="text-gold/30 mr-2">|</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

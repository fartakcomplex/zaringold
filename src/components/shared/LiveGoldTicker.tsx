'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GoldPriceData {
  buyPrice: number;
  sellPrice: number;
  marketPrice: number;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatToman(n: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(n));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function LiveGoldTicker() {
  const { t, dir } = useTranslation();
  const [price, setPrice] = useState<GoldPriceData | null>(null);
  const [prevBuy, setPrevBuy] = useState<number | null>(null);
  const [prevSell, setPrevSell] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPrices = async () => {
    try {
      const res = await fetch('/api/gold/prices');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();

      const newBuy = data.buyPrice ?? data.prices?.buy ?? 0;
      const newSell = data.sellPrice ?? data.prices?.sell ?? 0;

      // Detect change and trigger pulse
      if (prevBuy !== null && prevBuy !== newBuy) {
        setPulseKey((k) => k + 1);
      }
      if (prevSell !== null && prevSell !== newSell) {
        setPulseKey((k) => k + 1);
      }

      setPrevBuy(newBuy);
      setPrevSell(newSell);

      setPrice({
        buyPrice: newBuy,
        sellPrice: newSell,
        marketPrice: data.marketPrice ?? data.prices?.market ?? 0,
        updatedAt: data.updatedAt ?? new Date().toISOString(),
      });
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    intervalRef.current = setInterval(fetchPrices, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buyDirection = prevBuy !== null && price
    ? (price.buyPrice > prevBuy ? 'up' : price.buyPrice < prevBuy ? 'down' : 'neutral')
    : 'neutral';
  const sellDirection = prevSell !== null && price
    ? (price.sellPrice > prevSell ? 'up' : price.sellPrice < prevSell ? 'down' : 'neutral')
    : 'neutral';

  if (loading) {
    return (
      <div
        dir={dir}
        className="flex items-center justify-center gap-2 rounded-full border border-gold/15 bg-gradient-to-l from-gold/8 via-gold/4 to-transparent px-3 py-1 text-xs text-muted-foreground"
      >
        <Loader2 className="size-3 animate-spin text-gold/60" />
        <span>{t('landing.pricesLoading')}</span>
      </div>
    );
  }

  if (error || !price) return null;

  return (
    <div
      dir={dir}
      className={cn(
        'flex items-center gap-2.5 rounded-full border border-gold/20 bg-gradient-to-l from-gold/10 via-gold/5 to-gold/[0.03] px-3 py-1 shadow-sm shadow-gold/[0.06] transition-all',
        pulseKey > 0 && 'animate-[pulse_0.6s_ease-in-out]',
      )}
      key={pulseKey}
    >
      {/* Live indicator */}
      <span className="relative inline-block size-2 shrink-0 rounded-full bg-emerald-500">
        <span className="absolute inset-0 inline-block size-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
      </span>
      <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
        {t('common.live')}
      </span>

      {/* Buy price */}
      <div className="flex items-center gap-1">
        <TrendingUp className={cn(
          'size-3 shrink-0 transition-colors',
          buyDirection === 'up' ? 'text-emerald-500' : buyDirection === 'down' ? 'text-red-500' : 'text-muted-foreground'
        )} />
        <span className="text-[10px] text-muted-foreground hidden sm:inline">{t('price.buy')}:</span>
        <span className={cn(
          'text-xs font-semibold tabular-nums transition-colors',
          buyDirection === 'up' ? 'text-emerald-500' : buyDirection === 'down' ? 'text-red-500' : 'text-foreground'
        )}>
          {formatToman(price.buyPrice)}
        </span>
        {buyDirection === 'up' && <span className="text-emerald-400 text-[8px]">▲</span>}
        {buyDirection === 'down' && <span className="text-red-400 text-[8px]">▼</span>}
      </div>

      <div className="h-3 w-px bg-border/50" />

      {/* Sell price */}
      <div className="flex items-center gap-1">
        <TrendingDown className={cn(
          'size-3 shrink-0 transition-colors',
          sellDirection === 'up' ? 'text-emerald-500' : sellDirection === 'down' ? 'text-red-500' : 'text-muted-foreground'
        )} />
        <span className="text-[10px] text-muted-foreground hidden sm:inline">{t('price.sell')}:</span>
        <span className={cn(
          'text-xs font-semibold tabular-nums transition-colors',
          sellDirection === 'up' ? 'text-emerald-500' : sellDirection === 'down' ? 'text-red-500' : 'text-foreground'
        )}>
          {formatToman(price.sellPrice)}
        </span>
        {sellDirection === 'up' && <span className="text-emerald-400 text-[8px]">▲</span>}
        {sellDirection === 'down' && <span className="text-red-400 text-[8px]">▼</span>}
      </div>
    </div>
  );
}

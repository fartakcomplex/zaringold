'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Coins,
  CircleDot,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatToman, formatNumber, cn } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface SSEPriceData {
  buy: number;
  sell: number;
  change: number;
  direction: 'up' | 'down' | 'stable';
  timestamp: number;
  coins: {
    full: number;
    half: number;
    quarter: number;
    grami: number;
  };
}

type CoinKey = keyof SSEPriceData['coins'];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const COIN_META: { key: CoinKey; label: string; icon: string }[] = [
  { key: 'full', label: 'سکه تمام', icon: '🪙' },
  { key: 'half', label: 'نیم سکه', icon: '🥈' },
  { key: 'quarter', label: 'ربع سکه', icon: '🥉' },
  { key: 'grami', label: 'سکه گرمی', icon: '✨' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Animation Variants                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const priceFlashVariants = {
  up: {
    backgroundColor: ['transparent', 'oklch(0.7 0.15 145 / 12%)', 'transparent'],
    transition: { duration: 0.6 },
  },
  down: {
    backgroundColor: ['transparent', 'oklch(0.6 0.2 25 / 12%)', 'transparent'],
    transition: { duration: 0.6 },
  },
  stable: {},
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper: format Persian timestamp                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatPersianTimestamp(unixSeconds: number): string {
  return new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(unixSeconds * 1000));
}

function formatPersianRelative(unixSeconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 10) return 'لحظاتی پیش';
  if (diff < 60) return `${diff} ثانیه پیش`;
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
  return `${Math.floor(diff / 3600)} ساعت پیش`;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function WidgetSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-16 flex-1 rounded-lg" />
          <Skeleton className="h-16 flex-1 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="mx-auto h-3 w-40" />
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Direction Icon                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function DirectionIcon({ direction }: { direction: 'up' | 'down' | 'stable' }) {
  if (direction === 'up') {
    return <TrendingUp className="size-3.5 text-emerald-500" />;
  }
  if (direction === 'down') {
    return <TrendingDown className="size-3.5 text-red-500" />;
  }
  return <Minus className="size-3.5 text-muted-foreground" />;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component: RealtimePriceWidget                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function RealtimePriceWidget() {
  /* ── State ── */
  const [priceData, setPriceData] = useState<SSEPriceData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [flashDirection, setFlashDirection] = useState<'up' | 'down' | 'stable'>('stable');
  const [coinFlash, setCoinFlash] = useState<Record<CoinKey, 'up' | 'down' | 'stable'>>({
    full: 'stable',
    half: 'stable',
    quarter: 'stable',
    grami: 'stable',
  });
  const [relativeTime, setRelativeTime] = useState('');

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPricesRef = useRef<SSEPriceData | null>(null);
  const prevCoinPricesRef = useRef<Record<CoinKey, number>>({
    full: 0,
    half: 0,
    quarter: 0,
    grami: 0,
  });

  /* ── Relative time updater ── */
  useEffect(() => {
    if (!priceData) return;
    const updateRelative = () => {
      setRelativeTime(formatPersianRelative(priceData.timestamp));
    };
    updateRelative();
    const interval = setInterval(updateRelative, 10000);
    return () => clearInterval(interval);
  }, [priceData]);

  /* ── SSE Connection (plain function inside useEffect to avoid self-reference lint error) ── */
  useEffect(() => {
    let isMounted = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let es: EventSource | null = null;

    function connect() {
      if (es) {
        es.close();
        es = null;
      }

      es = new EventSource('/api/gold/price/stream');
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!isMounted) return;
        setIsConnected(true);
      };

      es.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data: SSEPriceData = JSON.parse(event.data);
          if (data.buy == null || data.sell == null) return;

          if (prevPricesRef.current) {
            if (data.buy > prevPricesRef.current.buy) {
              setFlashDirection('up');
            } else if (data.buy < prevPricesRef.current.buy) {
              setFlashDirection('down');
            } else {
              setFlashDirection('stable');
            }
          }

          const newCoinFlash: Record<CoinKey, 'up' | 'down' | 'stable'> = {
            full: 'stable', half: 'stable', quarter: 'stable', grami: 'stable',
          };
          (Object.keys(data.coins) as CoinKey[]).forEach((key) => {
            const prev = prevCoinPricesRef.current[key];
            if (prev > 0) {
              if (data.coins[key] > prev) newCoinFlash[key] = 'up';
              else if (data.coins[key] < prev) newCoinFlash[key] = 'down';
            }
          });
          setCoinFlash(newCoinFlash);

          prevPricesRef.current = data;
          prevCoinPricesRef.current = { ...data.coins };
          setPriceData(data);
        } catch {
          // Ignore heartbeat / non-JSON
        }
      };

      es.onerror = () => {
        if (!isMounted) return;
        setIsConnected(false);
        if (es) { es.close(); es = null; }
        eventSourceRef.current = null;
        reconnectTimer = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (es) { es.close(); es = null; }
      eventSourceRef.current = null;
    };
  }, []);

  /* ── Loading state ── */
  if (!priceData) {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <WidgetSkeleton />
      </motion.div>
    );
  }

  /* ── Coin display items ── */
  const coinItems = COIN_META.map((meta) => ({
    key: meta.key,
    label: meta.label,
    icon: meta.icon,
    price: priceData.coins[meta.key],
  }));

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="card-gold-border card-glass-premium overflow-hidden">
        {/* ── Header ── */}
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Coins className="size-4 text-gold" />
              قیمت لحظه‌ای سکه
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'pulse-ring relative inline-block size-2.5 rounded-full',
                  isConnected ? 'bg-emerald-500' : 'bg-gray-400',
                )}
              >
                {isConnected && (
                  <span className="absolute inset-0 inline-block size-2.5 animate-ping rounded-full bg-emerald-400 opacity-75" />
                )}
              </span>
              <span
                className={cn(
                  'text-xs font-medium',
                  isConnected
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground',
                )}
              >
                {isConnected ? 'زنده' : 'آفلاین'}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ── Buy & Sell Prices ── */}
          <motion.div
            key={`flash-${flashDirection}-${priceData.timestamp}`}
            variants={priceFlashVariants}
            animate={flashDirection}
            className="flex gap-3 rounded-xl border border-border/50 p-3"
          >
            <div className="flex flex-1 items-center gap-2.5 rounded-lg bg-emerald-50/60 px-3 py-2.5 dark:bg-emerald-950/20">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  قیمت خرید
                </p>
                <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatToman(priceData.buy)}
                </p>
              </div>
            </div>

            <div className="flex flex-1 items-center gap-2.5 rounded-lg bg-red-50/60 px-3 py-2.5 dark:bg-red-950/20">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40">
                <TrendingDown className="size-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-red-700 dark:text-red-400">
                  قیمت فروش
                </p>
                <p className="text-sm font-bold tabular-nums text-red-600 dark:text-red-400">
                  {formatToman(priceData.sell)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Change Badge ── */}
          <div className="flex items-center justify-center">
            <Badge
              variant="outline"
              className={cn(
                'gap-1 text-xs font-semibold tabular-nums',
                priceData.direction === 'up' &&
                  'border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400',
                priceData.direction === 'down' &&
                  'border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400',
                priceData.direction === 'stable' &&
                  'border-border bg-muted text-muted-foreground',
              )}
            >
              <DirectionIcon direction={priceData.direction} />
              {priceData.change > 0 ? '+' : ''}
              {formatNumber(priceData.change)}٪
            </Badge>
          </div>

          {/* ── 4 Coin Types Grid ── */}
          <div className="grid grid-cols-2 gap-2">
            <AnimatePresence mode="popLayout">
              {coinItems.map((coin, index) => (
                <motion.div
                  key={coin.key}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.06, duration: 0.3 }}
                >
                  <motion.div
                    key={`coin-flash-${coin.key}-${coin.price}`}
                    variants={priceFlashVariants}
                    animate={coinFlash[coin.key]}
                    className="flex flex-col gap-1.5 rounded-lg border border-border/40 p-3 transition-colors hover:bg-muted/40 hover:border-gold/20"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{coin.icon}</span>
                      <span className="text-xs font-semibold text-foreground">
                        {coin.label}
                      </span>
                    </div>
                    <p className="text-[13px] font-bold tabular-nums gold-gradient-text">
                      {formatToman(coin.price)}
                    </p>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ── Last Updated Timestamp ── */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <CircleDot className="size-3 text-muted-foreground/60" />
            <p className="text-[11px] text-muted-foreground">
              آخرین بروزرسانی:{' '}
              <span className="font-medium tabular-nums text-muted-foreground/80">
                {relativeTime}
              </span>
              <span className="mx-1 text-muted-foreground/40">|</span>
              <span className="tabular-nums text-muted-foreground/60">
                {formatPersianTimestamp(priceData.timestamp)}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

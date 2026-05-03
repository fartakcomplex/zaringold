
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {TrendingUp, TrendingDown, Activity, RefreshCw, ChevronDown, ChevronUp, Clock, ArrowUpRight, ArrowDownLeft, BarChart3, Loader2, AlertTriangle, Zap, Gem, DollarSign, Radio, Eye, EyeOff} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {Separator} from '@/components/ui/separator';
import {useAppStore} from '@/lib/store';
import {useQuickAction} from '@/hooks/useQuickAction';
import {formatToman, formatNumber, formatPrice, getTimeAgo, cn} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types & Interfaces                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface GoldPrices {
  gold18: number;
  gold24: number;
  mesghal: number;
  ounce: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  buyPrice: number;
  sellPrice: number;
  updatedAt: string;
}

interface SparklinePoint {
  time: string;
  price: number;
}

type PriceDirection = 'up' | 'down' | 'neutral';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants & Mock Data                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

const REFRESH_INTERVAL_MS = 30_000;
const FLASH_DURATION_MS = 1_500;

const MOCK_PRICES: GoldPrices = {
  gold18: 4_250_000,
  gold24: 5_660_000,
  mesghal: 18_200_000,
  ounce: 2_650,
  changePercent: 1.24,
  high24h: 4_300_000,
  low24h: 4_180_000,
  buyPrice: 4_235_000,
  sellPrice: 4_265_000,
  updatedAt: new Date().toISOString(),
};

function generateSparklineData(): SparklinePoint[] {
  const points: SparklinePoint[] = [];
  let price = 4_180_000;
  for (let i = 24; i >= 0; i--) {
    const d = new Date();
    d.setHours(d.getHours() - i);
    price += (Math.random() - 0.45) * 30_000;
    points.push({
      time: new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(d),
      price: Math.round(price),
    });
  }
  return points;
}

const MOCK_SPARKLINE: SparklinePoint[] = generateSparklineData();

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Animation Variants                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

const containerVariants: any = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const priceFlashUp = {
  initial: { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
  animate: { backgroundColor: 'transparent' },
};

const priceFlashDown = {
  initial: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  animate: { backgroundColor: 'transparent' },
};

const itemVariants: any = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

const expandedGridVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const expandedGridItem: any = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Animated Number Counter Hook                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function useAnimatedNumber(target: number, duration: number = 600) {
  const [displayValue, setDisplayValue] = useState(target);
  const prevTarget = useRef(target);
  const animationRef = useRef<number | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      prevTarget.current = target;
      return;
    }
    if (prevTarget.current === target) return;
    const startValue = prevTarget.current;
    const diff = target - startValue;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + diff * eased));
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        prevTarget.current = target;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [target, duration]);

  return displayValue;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SVG Sparkline Generator                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SparklineChart({
  data,
  width = 280,
  height = 64,
  isPositive = true,
}: {
  data: SparklinePoint[];
  width?: number;
  height?: number;
  isPositive?: boolean;
}) {
  if (data.length < 2) return null;

  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;
  const padding = 4;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * chartW,
    y: padding + chartH - ((d.price - minPrice) / range) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${height - padding} L${padding},${height - padding} Z`;

  const strokeColor = isPositive ? '#22c55e' : '#ef4444';
  const fillColor = isPositive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkGrad)" />
      <motion.path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />
      {/* End dot */}
      <motion.circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={3}
        fill={strokeColor}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.4, 1] }}
        transition={{ duration: 0.5, delay: 1 }}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CompactSkeleton() {
  return (
    <Card className="overflow-hidden border-gold/10">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function ExpandedSkeleton() {
  return (
    <Card className="overflow-hidden border-gold/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Price */}
        <div className="flex flex-col items-center gap-2 py-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-28" />
        </div>
        {/* Sparkline */}
        <Skeleton className="mx-auto h-16 w-full max-w-xs" />
        {/* Price Cards Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-3">
              <Skeleton className="mb-2 h-3 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
        {/* High/Low bar */}
        <Skeleton className="h-2 w-full rounded-full" />
        {/* Footer */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Error State                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ErrorState({
  onRetry,
  message,
}: {
  onRetry: () => void;
  message?: string;
}) {
  return (
    <Card className="overflow-hidden border-red-200 dark:border-red-900/40">
      <CardContent className="flex flex-col items-center gap-3 p-6">
        <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="size-5 text-red-500" />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {message || 'خطا در دریافت قیمت‌ها'}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-gold/30 text-gold hover:bg-gold/5"
          onClick={onRetry}
        >
          <RefreshCw className="size-3.5" />
          تلاش مجدد
        </Button>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Refresh Indicator                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function RefreshIndicator({ isRefreshing }: { isRefreshing: boolean }) {
  return (
    <motion.div
      className="flex size-7 items-center justify-center rounded-lg"
      animate={isRefreshing ? { rotate: 360 } : {}}
      transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
    >
      <RefreshCw
        className={cn(
          'size-3.5 transition-colors',
          isRefreshing ? 'text-gold' : 'text-muted-foreground'
        )}
      />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Price Change Badge                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ChangeBadge({ percent }: { percent: number }) {
  const isPositive = percent >= 0;
  return (
    <motion.div
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums',
        isPositive
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
      )}
      animate={
        isPositive
          ? { scale: [1, 1.05, 1] }
          : { scale: [1, 1.05, 1] }
      }
      transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
    >
      {isPositive ? (
        <TrendingUp className="size-3" />
      ) : (
        <TrendingDown className="size-3" />
      )}
      {isPositive ? '+' : ''}
      {formatNumber(Math.round(percent * 100) / 100)}٪
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Price Card (Expanded Mode Item)                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PriceCard({
  label,
  value,
  icon,
  unit,
  colorClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  unit?: string;
  colorClass?: string;
}) {
  return (
    <motion.div
      variants={expandedGridItem}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br p-3.5 transition-all hover:border-gold/20 hover:shadow-sm',
        colorClass || 'from-card to-card'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="absolute -top-4 -left-4 size-16 rounded-full bg-gold/5 blur-2xl" />
      <div className="relative flex items-start gap-2.5">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-base font-bold tabular-nums tracking-tight text-foreground">
            {formatNumber(value)}
            {unit && <span className="mr-1 text-[10px] font-normal text-muted-foreground">{unit}</span>}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  24h High/Low Bar                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function HighLowBar({ high, low, current }: { high: number; low: number; current: number }) {
  const range = high - low || 1;
  const position = ((current - low) / range) * 100;
  const clampedPosition = Math.max(2, Math.min(98, position));

  return (
    <div id="lp-alerts" className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-medium text-emerald-600 dark:text-emerald-400">
          <ArrowDownLeft className="mr-0.5 inline-block size-2.5" />
          کمترین: {formatToman(low)}
        </span>
        <span className="font-medium text-red-500 dark:text-red-400">
          بیشترین: {formatToman(high)}
          <ArrowUpRight className="ml-0.5 inline-block size-2.5" />
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gradient-to-l from-red-200 via-amber-100 to-emerald-200 dark:from-red-900/40 dark:via-amber-900/30 dark:to-emerald-900/40">
        <motion.div
          className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-gold shadow-md dark:border-gray-800"
          initial={{ left: `${clampedPosition}%` }}
          animate={{ left: `${clampedPosition}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Countdown Timer (next refresh)                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CountdownTimer({ lastRefresh, interval }: { lastRefresh: Date; interval: number }) {
  const [secondsLeft, setSecondsLeft] = useState(() => Math.floor(interval / 1000));

  // Use lastRefresh timestamp as key trigger — when it changes, reset via key
  const refreshKey = lastRefresh.getTime();
  const keyRef = useRef(refreshKey);
  const [key, setKey] = useState(refreshKey);

  if (keyRef.current !== refreshKey) {
    keyRef.current = refreshKey;
    const elapsed = (Date.now() - lastRefresh.getTime()) / 1000;
    setSecondsLeft(Math.max(0, Math.floor(interval / 1000 - elapsed)));
    setKey(refreshKey);
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? Math.floor(interval / 1000) : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [interval]);

  return (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <Clock className="size-2.5" />
      بروزرسانی بعدی: {formatNumber(secondsLeft)} ثانیه
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Spread Indicator                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SpreadIndicator({ buy, sell }: { buy: number; sell: number }) {
  const spread = sell - buy;
  const spreadPercent = ((spread / sell) * 100).toFixed(2);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
      <div id="lp-buy" className="flex items-center gap-2 flex-1">
        <ArrowDownLeft className="size-3.5 text-emerald-500" />
        <div>
          <p className="text-[10px] text-muted-foreground">قیمت خرید</p>
          <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatToman(buy)}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <Separator orientation="vertical" className="h-6" />
        <span className="text-[9px] font-medium text-muted-foreground">
          اسپرد: {formatNumber(Number(spreadPercent))}٪
        </span>
        <Separator orientation="vertical" className="h-6" />
      </div>
      <div id="lp-sell" className="flex items-center gap-2 flex-1 justify-end">
        <div className="text-left">
          <p className="text-[10px] text-muted-foreground">قیمت فروش</p>
          <p className="text-sm font-bold tabular-nums text-red-500 dark:text-red-400">
            {formatToman(sell)}
          </p>
        </div>
        <ArrowUpRight className="size-3.5 text-red-500" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Compact Mode                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CompactView({
  prices,
  priceDirection,
  animatedPrice,
  isRefreshing,
  onToggle,
  lastRefreshTime,
}: {
  prices: GoldPrices;
  priceDirection: PriceDirection;
  animatedPrice: number;
  isRefreshing: boolean;
  onToggle: () => void;
  lastRefreshTime: Date;
}) {
  const isPositive = prices.changePercent >= 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show">
      <Card className="overflow-hidden border-gold/10 shadow-sm hover:border-gold/20 transition-colors">
        <CardContent className="p-0">
          <div className="relative overflow-hidden">
            {/* Gold gradient background */}
            <div className="absolute inset-0 bg-gradient-to-l from-gold/8 via-gold/4 to-transparent dark:from-gold/12 dark:via-gold/6" />
            <div className="relative flex items-center justify-between p-4">
              {/* Left: Icon & Label */}
              <div className="flex items-center gap-3">
                <motion.div
                  className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 dark:from-gold/30 dark:to-gold/10"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
                >
                  <Gem className="size-5 text-gold" />
                </motion.div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">طلای ۱۸ عیار</p>
                  <div className="flex items-center gap-1.5">
                    <motion.span
                      key={`price-${animatedPrice}`}
                      className="text-lg font-bold tabular-nums text-foreground sm:text-xl"
                      initial={
                        priceDirection === 'up'
                          ? { color: '#22c55e' }
                          : priceDirection === 'down'
                          ? { color: '#ef4444' }
                          : {}
                      }
                      animate={{ color: 'var(--foreground)' }}
                      transition={{ duration: FLASH_DURATION_MS / 1000 }}
                    >
                      {formatToman(animatedPrice)}
                    </motion.span>
                    <span className="text-[10px] text-muted-foreground">هر گرم</span>
                  </div>
                </div>
              </div>

              {/* Center: Change badge */}
              <motion.div
                className="hidden sm:block"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <ChangeBadge percent={prices.changePercent} />
              </motion.div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                {/* Live indicator */}
                <motion.div
                  className="hidden sm:flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Radio className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">زنده</span>
                </motion.div>

                {/* Refresh indicator */}
                <RefreshIndicator isRefreshing={isRefreshing} />

                {/* Toggle button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-gold hover:bg-gold/5"
                  onClick={onToggle}
                  aria-label="تغییر حالت نمایش"
                >
                  <ChevronDown className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile change badge + timestamp */}
          <div className="flex items-center justify-between border-t border-border/50 px-4 py-2">
            <div className="flex items-center gap-2">
              <small className="block">
                <ChangeBadge percent={prices.changePercent} />
              </small>
            </div>
            <CountdownTimer lastRefresh={lastRefreshTime} interval={REFRESH_INTERVAL_MS} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Expanded Mode                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ExpandedView({
  prices,
  priceDirection,
  animatedPrice,
  sparklineData,
  isRefreshing,
  onToggle,
  onRefresh,
  lastRefreshTime,
}: {
  prices: GoldPrices;
  priceDirection: PriceDirection;
  animatedPrice: number;
  sparklineData: SparklinePoint[];
  isRefreshing: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  lastRefreshTime: Date;
}) {
  const isPositive = prices.changePercent >= 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show">
      <Card className="overflow-hidden border-gold/10 shadow-sm">
        {/* Header */}
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gold/10">
                <BarChart3 className="size-4 text-gold" />
              </div>
              <CardTitle className="text-sm font-bold">قیمت‌های لحظه‌ای طلا</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Radio className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">زنده</span>
              </motion.div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground hover:text-gold"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn('size-3', isRefreshing && 'animate-spin')} />
                بروزرسانی
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-gold"
                onClick={onToggle}
                aria-label="تغییر حالت نمایش"
              >
                <ChevronUp className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Main Price Display */}
          <div className="flex flex-col items-center gap-2 py-3">
            <p className="text-xs font-medium text-muted-foreground">طلای ۱۸ عیار (هر گرم)</p>
            <motion.div
              className="flex items-center gap-2"
              key={`main-price-${animatedPrice}`}
              initial={
                priceDirection === 'up'
                  ? { scale: 1.03, color: '#22c55e' }
                  : priceDirection === 'down'
                  ? { scale: 1.03, color: '#ef4444' }
                  : {}
              }
              animate={{ scale: 1, color: 'var(--foreground)' }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-3xl font-bold tabular-nums sm:text-4xl">
                {formatToman(animatedPrice)}
              </span>
            </motion.div>
            <ChangeBadge percent={prices.changePercent} />
          </div>

          {/* Sparkline */}
          <div id="lp-chart" className="flex justify-center">
            <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
              <SparklineChart
                data={sparklineData}
                width={280}
                height={64}
                isPositive={isPositive}
              />
              <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <Activity className="size-2.5" />
                روند ۲۴ ساعته
              </div>
            </div>
          </div>

          {/* Spread */}
          <SpreadIndicator buy={prices.buyPrice} sell={prices.sellPrice} />

          {/* Price Cards Grid */}
          <motion.div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            variants={expandedGridVariants}
            initial="hidden"
            animate="show"
          >
            <PriceCard
              label="طلای ۱۸ عیار"
              value={prices.gold18}
              icon={<Gem className="size-4" />}
              unit="گرم طلا/گرم"
              colorClass="from-amber-50/50 to-amber-100/20 dark:from-amber-950/20 dark:to-amber-900/10"
            />
            <PriceCard
              label="طلای ۲۴ عیار"
              value={prices.gold24}
              icon={<Zap className="size-4" />}
              unit="گرم طلا/گرم"
              colorClass="from-yellow-50/50 to-yellow-100/20 dark:from-yellow-950/20 dark:to-yellow-900/10"
            />
            <PriceCard
              label="مثقال طلا"
              value={prices.mesghal}
              icon={<Activity className="size-4" />}
              unit="گرم طلا"
              colorClass="from-orange-50/50 to-orange-100/20 dark:from-orange-950/20 dark:to-orange-900/10"
            />
            <PriceCard
              label="اونس جهانی"
              value={prices.ounce}
              icon={<DollarSign className="size-4" />}
              unit="دلار"
              colorClass="from-emerald-50/50 to-emerald-100/20 dark:from-emerald-950/20 dark:to-emerald-900/10"
            />
            <PriceCard
              label="بیشترین ۲۴ ساعت"
              value={prices.high24h}
              icon={<TrendingUp className="size-4" />}
              unit="گرم طلا"
              colorClass="from-green-50/50 to-green-100/20 dark:from-green-950/20 dark:to-green-900/10"
            />
            <PriceCard
              label="کمترین ۲۴ ساعت"
              value={prices.low24h}
              icon={<TrendingDown className="size-4" />}
              unit="گرم طلا"
              colorClass="from-red-50/50 to-red-100/20 dark:from-red-950/20 dark:to-red-900/10"
            />
          </motion.div>

          {/* 24h High/Low Bar */}
          <HighLowBar high={prices.high24h} low={prices.low24h} current={prices.gold18} />

          {/* Footer: Last update time + Countdown */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-t border-border/50 pt-3">
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Clock className="size-2.5" />
              آخرین بروزرسانی: {getTimeAgo(prices.updatedAt)}
            </span>
            <CountdownTimer lastRefresh={lastRefreshTime} interval={REFRESH_INTERVAL_MS} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component: LiveGoldWidget                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function LiveGoldWidget() {
  const storeGoldPrice = useAppStore((s) => s.goldPrice);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [prices, setPrices] = useState<GoldPrices>(MOCK_PRICES);
  const [sparklineData, setSparklineData] = useState<SparklinePoint[]>(MOCK_SPARKLINE);
  const [priceDirection, setPriceDirection] = useState<PriceDirection>('neutral');
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const animatedPrice = useAnimatedNumber(prices.gold18, 500);

  /* ── Fetch Prices ── */
  const fetchPrices = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    setIsRefreshing(true);
    setHasError(false);

    try {
      // Try to fetch from API
      const res = await fetch('/api/gold/prices');
      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      if (data?.buyPrice && data?.sellPrice) {
        // Merge API data with mock extended data
        setPrices((prev) => {
          const newGold18 = data.buyPrice || prev.gold18;
          const oldPrice = prev.gold18;
          const direction: PriceDirection =
            newGold18 > oldPrice ? 'up' : newGold18 < oldPrice ? 'down' : 'neutral';
          setPriceDirection(direction);

          return {
            gold18: newGold18,
            gold24: Math.round(newGold18 * (24 / 18)),
            mesghal: Math.round(newGold18 * 4.331),
            ounce: data.ouncePrice || prev.ounce,
            changePercent: prev.changePercent + (Math.random() - 0.48) * 0.3,
            high24h: Math.max(prev.high24h, newGold18),
            low24h: Math.min(prev.low24h, newGold18),
            buyPrice: data.buyPrice || prev.buyPrice,
            sellPrice: data.sellPrice || prev.sellPrice,
            updatedAt: data.updatedAt || new Date().toISOString(),
          };
        });
        setLastRefreshTime(new Date());
      } else {
        throw new Error('Invalid data');
      }
    } catch {
      // Fallback: use store data or simulate small changes on mock
      if (storeGoldPrice?.buyPrice && storeGoldPrice?.sellPrice) {
        setPrices((prev) => {
          const newGold18 = storeGoldPrice.buyPrice;
          const oldPrice = prev.gold18;
          const direction: PriceDirection =
            newGold18 > oldPrice ? 'up' : newGold18 < oldPrice ? 'down' : 'neutral';
          setPriceDirection(direction);

          return {
            ...prev,
            gold18: newGold18,
            gold24: Math.round(newGold18 * (24 / 18)),
            mesghal: Math.round(newGold18 * 4.331),
            ounce: storeGoldPrice.ouncePrice || prev.ounce,
            buyPrice: storeGoldPrice.buyPrice,
            sellPrice: storeGoldPrice.sellPrice,
            updatedAt: storeGoldPrice.updatedAt || new Date().toISOString(),
          };
        });
        setLastRefreshTime(new Date());
      } else {
        // Simulate small price changes on mock data
        setPrices((prev) => {
          const change = (Math.random() - 0.47) * 25_000;
          const newGold18 = Math.max(3_500_000, prev.gold18 + change);
          const direction: PriceDirection = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
          setPriceDirection(direction);

          return {
            ...prev,
            gold18: Math.round(newGold18),
            gold24: Math.round(newGold18 * (24 / 18)),
            mesghal: Math.round(newGold18 * 4.331),
            buyPrice: Math.round(newGold18 * 0.9965),
            sellPrice: Math.round(newGold18 * 1.0035),
            changePercent: prev.changePercent + (Math.random() - 0.48) * 0.15,
            high24h: Math.max(prev.high24h, Math.round(newGold18)),
            low24h: Math.min(prev.low24h, Math.round(newGold18)),
            updatedAt: new Date().toISOString(),
          };
        });

        // Also update sparkline
        setSparklineData((prev) => {
          const newPoint: SparklinePoint = {
            time: new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
            price: prices.gold18 + (Math.random() - 0.47) * 25_000,
          };
          const updated = [...prev, newPoint];
          if (updated.length > 25) updated.shift();
          return updated;
        });
        setLastRefreshTime(new Date());
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [storeGoldPrice, prices.gold18]);

  /* ── Initial Load ── */
  useEffect(() => {
    fetchPrices(true);
  }, []);

  /* ── Auto-refresh Interval ── */
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchPrices(false);
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchPrices]);

  /* ── Toggle Mode ── */
  const toggleMode = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  /* ── Loading States ── */
  if (isLoading && !isRefreshing) {
    return isExpanded ? <ExpandedSkeleton /> : <CompactSkeleton />;
  }

  /* ── Error State ── */
  if (hasError) {
    return <ErrorState onRetry={() => fetchPrices(true)} message={errorMessage} />;
  }

  /* ── Render ── */
  return (
    <AnimatePresence mode="wait">
      {isExpanded ? (
        <ExpandedView
          key="expanded"
          prices={prices}
          priceDirection={priceDirection}
          animatedPrice={animatedPrice}
          sparklineData={sparklineData}
          isRefreshing={isRefreshing}
          onToggle={toggleMode}
          onRefresh={() => fetchPrices(false)}
          lastRefreshTime={lastRefreshTime}
        />
      ) : (
        <CompactView
          key="compact"
          prices={prices}
          priceDirection={priceDirection}
          animatedPrice={animatedPrice}
          isRefreshing={isRefreshing}
          onToggle={toggleMode}
          lastRefreshTime={lastRefreshTime}
        />
      )}
    </AnimatePresence>
  );
}

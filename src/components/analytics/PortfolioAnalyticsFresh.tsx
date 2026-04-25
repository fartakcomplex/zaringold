'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Award,
  CalendarDays,
  Activity,
  RefreshCw,
  Shield,
  Wallet,
  Zap,
  Banknote,
  Repeat,
  Lock,
  Gem,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import { formatToman, formatGrams, formatNumber, formatPrice, cn } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                           */
/* ═══════════════════════════════════════════════════════════════ */

interface AnalyticsData {
  goldGrams: number;
  frozenGold: number;
  fiatBalance: number;
  currentGoldValue: number;
  frozenGoldValue: number;
  totalPortfolioValue: number;
  currentBuyPrice: number;
  currentSellPrice: number;
  avgBuyPrice: number;
  priceSpread: string;
  investedAmount: number;
  totalROI: number;
  monthlyGrowth: number;
  unrealizedProfit: number;
  isProfit: boolean;
  growthHistory: Array<{ month: string; value: number }>;
  portfolioHistory: Array<{ date: string; value: number }>;
  riskScore: number;
  bestBuyDay: string;
  goldRatio: number;
  fiatRatio: number;
  totalBuyCount: number;
  totalSellCount: number;
  totalAutoSaveGold: number;
  activeAutoSavePlans: number;
  recentTransactions: Array<{
    id: string;
    type: string;
    amountGold: number;
    amountFiat: number;
    fee: number;
    status: string;
    createdAt: string;
  }>;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Constants                                                       */
/* ═══════════════════════════════════════════════════════════════ */

const persianDays: Record<string, string> = {
  saturday: 'شنبه',
  sunday: 'یکشنبه',
  monday: 'دوشنبه',
  tuesday: 'سه‌شنبه',
  wednesday: 'چهارشنبه',
  thursday: 'پنج‌شنبه',
  friday: 'جمعه',
};

const txTypeLabels: Record<string, string> = {
  buy: 'خرید',
  sell: 'فروش',
  gold_buy: 'خرید طلا',
  gold_sell: 'فروش طلا',
  auto_buy: 'خرید خودکار',
  gift_received: 'هدیه دریافت‌شده',
  goal_contribute: 'واریز به هدف',
  deposit: 'واریز',
  withdraw: 'برداشت',
};

const txTypeColors: Record<string, string> = {
  buy: 'text-emerald-500',
  sell: 'text-red-500',
  gold_buy: 'text-emerald-500',
  gold_sell: 'text-red-500',
  auto_buy: 'text-sky-500',
  gift_received: 'text-purple-500',
  goal_contribute: 'text-amber-500',
  deposit: 'text-emerald-500',
  withdraw: 'text-red-500',
};

/* ═══════════════════════════════════════════════════════════════ */
/*  Sub-components                                                 */
/* ═══════════════════════════════════════════════════════════════ */

/** Simple SVG sparkline */
function Sparkline({ data, color = '#D4AF37', width = 80, height = 32 }: {
  data: number[]; color?: string; width?: number; height?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((val, i) => {
    const x = i * step;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

/** Donut chart for allocation */
function AllocationDonut({ goldRatio, fiatRatio }: { goldRatio: number; fiatRatio: number }) {
  const size = 88;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 38;
  const innerR = 26;

  const total = goldRatio + fiatRatio || 1;
  const goldAngle = (goldRatio / total) * 360;
  const goldEndRad = ((-90 + goldAngle) * Math.PI) / 180;
  const goldStartRad = (-90 * Math.PI) / 180;

  const goldX1 = cx + outerR * Math.cos(goldStartRad);
  const goldY1 = cy + outerR * Math.sin(goldStartRad);
  const goldX2 = cx + outerR * Math.cos(goldEndRad);
  const goldY2 = cy + outerR * Math.sin(goldEndRad);
  const goldIX2 = cx + innerR * Math.cos(goldEndRad);
  const goldIY2 = cy + innerR * Math.sin(goldEndRad);
  const goldIX1 = cx + innerR * Math.cos(goldStartRad);
  const goldIY1 = cy + innerR * Math.sin(goldStartRad);
  const goldLarge = goldAngle > 180 ? 1 : 0;

  const fiatStartRad = goldEndRad;
  const fiatAngle = (fiatRatio / total) * 360;
  const fiatEndRad = ((-90 + goldAngle + fiatAngle) * Math.PI) / 180;
  const fiatX1 = cx + outerR * Math.cos(fiatStartRad);
  const fiatY1 = cy + outerR * Math.sin(fiatStartRad);
  const fiatX2 = cx + outerR * Math.cos(fiatEndRad);
  const fiatY2 = cy + outerR * Math.sin(fiatEndRad);
  const fiatIX2 = cx + innerR * Math.cos(fiatEndRad);
  const fiatIY2 = cy + innerR * Math.sin(fiatEndRad);
  const fiatIX1 = cx + innerR * Math.cos(fiatStartRad);
  const fiatIY1 = cy + innerR * Math.sin(fiatStartRad);
  const fiatLarge = fiatAngle > 180 ? 1 : 0;

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-[88px] shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <path
            d={`M ${goldX1} ${goldY1} A ${outerR} ${outerR} 0 ${goldLarge} 1 ${goldX2} ${goldY2} L ${goldIX2} ${goldIY2} A ${innerR} ${innerR} 0 ${goldLarge} 0 ${goldIX1} ${goldIY1} Z`}
            fill="#D4AF37"
          />
          <path
            d={`M ${fiatX1} ${fiatY1} A ${outerR} ${outerR} 0 ${fiatLarge} 1 ${fiatX2} ${fiatY2} L ${fiatIX2} ${fiatIY2} A ${innerR} ${innerR} 0 ${fiatLarge} 0 ${fiatIX1} ${fiatIY1} Z`}
            fill="#6b7280"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Gem className="size-4 text-gold" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-gold" />
          <span className="text-xs text-muted-foreground">طلا</span>
          <span className="text-xs font-bold text-gold tabular-nums">{formatNumber(goldRatio)}٪</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-gray-400" />
          <span className="text-xs text-muted-foreground">طلایی</span>
          <span className="text-xs font-bold tabular-nums">{formatNumber(fiatRatio)}٪</span>
        </div>
      </div>
    </div>
  );
}

/** Area chart for portfolio history */
function PortfolioChart({ data }: { data: Array<{ date: string; value: number }> }) {
  if (data.length < 2) return null;

  const chartW = 600;
  const chartH = 200;
  const padLeft = 32;
  const padRight = 12;
  const padTop = 8;
  const padBottom = 24;
  const innerW = chartW - padLeft - padRight;
  const innerH = chartH - padTop - padBottom;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const toX = (i: number) => padLeft + (i / (data.length - 1)) * innerW;
  const toY = (v: number) => padTop + innerH - ((v - minVal) / range) * innerH;

  const linePoints = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ');
  const areaPath = `M${toX(0)},${toY(data[0].value)} ` +
    data.slice(1).map((d, i) => `L${toX(i + 1)},${toY(d.value)}`).join(' ') +
    ` L${toX(data.length - 1)},${padTop + innerH} L${toX(0)},${padTop + innerH} Z`;

  const yTicks = [minVal, minVal + range / 2, maxVal];
  const xIndices = [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <svg viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
      <defs>
        <linearGradient id="portfolioGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25} />
          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
        </linearGradient>
      </defs>
      {yTicks.map((v, i) => (
        <text key={i} x={padLeft - 4} y={toY(v) + 3} textAnchor="end" className="fill-muted-foreground/60" style={{ fontSize: '9px' }}>
          {Math.round(v / 1_000_000)}
        </text>
      ))}
      {xIndices.map((idx) => (
        <text key={idx} x={toX(idx)} y={chartH - 4} textAnchor="middle" className="fill-muted-foreground/60" style={{ fontSize: '9px' }}>
          {data[idx].date.slice(-5)}
        </text>
      ))}
      <path d={areaPath} fill="url(#portfolioGrad2)" />
      <polyline fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={linePoints} />
      <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1].value)} r="4" fill="#D4AF37" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

/** Bar chart for monthly growth */
function GrowthChart({ data }: { data: Array<{ month: string; value: number }> }) {
  if (data.length === 0) return null;

  const chartW = 600;
  const chartH = 160;
  const padLeft = 36;
  const padRight = 12;
  const padTop = 8;
  const padBottom = 24;
  const innerW = chartW - padLeft - padRight;
  const innerH = chartH - padTop - padBottom;

  const values = data.map((d) => d.value);
  const maxAbsVal = Math.max(...values.map(Math.abs), 1);
  const barWidth = Math.min(24, (innerW / data.length) * 0.6);
  const barGap = innerW / data.length;

  const zeroY = padTop + innerH / 2;

  return (
    <svg viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
      <line x1={padLeft} y1={zeroY} x2={chartW - padRight} y2={zeroY} stroke="currentColor" className="text-muted-foreground/20" strokeWidth="1" />
      {data.map((d, i) => {
        const x = padLeft + barGap * i + (barGap - barWidth) / 2;
        const isPositive = d.value >= 0;
        const barH = (Math.abs(d.value) / maxAbsVal) * (innerH / 2);
        const y = isPositive ? zeroY - barH : zeroY;
        const fill = isPositive ? '#10b981' : '#ef4444';
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={Math.max(barH, 1)} rx={3} ry={3} fill={fill} fillOpacity={0.8} />
            <text x={x + barWidth / 2} y={chartH - 4} textAnchor="middle" className="fill-muted-foreground/60" style={{ fontSize: '9px' }}>
              {d.month.slice(0, 3)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                               */
/* ═══════════════════════════════════════════════════════════════ */

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
      <Skeleton className="h-[240px] w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Component                                                 */
/* ═══════════════════════════════════════════════════════════════ */

export default function PortfolioAnalyticsFresh() {
  const { user } = useAppStore();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const userId = user?.id;
      const res = await fetch(`/api/analytics/portfolio${userId ? `?userId=${userId}` : ''}`);
      const resData = await res.json();

      if (resData.success && resData.analytics) {
        setData(resData.analytics as AnalyticsData);
      } else {
        setError(resData.message || 'خطا در دریافت اطلاعات');
      }
    } catch {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  /* ── Loading ── */
  if (loading) {
    return <LoadingSkeleton />;
  }

  /* ── Error ── */
  if (error && !data) {
    return (
      <Card className="border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20">
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <Activity className="size-10 text-red-400" />
          <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchAnalytics()} className="mt-1">
            <RefreshCw className="size-3.5 me-1.5" />
            تلاش مجدد
          </Button>
        </CardContent>
      </Card>
    );
  }

  /* ── No data fallback ── */
  if (!data) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-3 py-16">
          <Award className="size-12 text-gold/50" />
          <p className="text-sm text-muted-foreground">داده‌ای برای نمایش وجود ندارد</p>
          <p className="text-xs text-muted-foreground/70">لطفاً ابتدا خرید طلا انجام دهید</p>
          <Button variant="outline" size="sm" onClick={() => fetchAnalytics()} className="mt-2">
            <RefreshCw className="size-3.5 me-1.5" />
            بروزرسانی
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isProfit = data.isProfit;
  const isPositiveROI = data.totalROI >= 0;
  const isPositiveMonthly = data.monthlyGrowth >= 0;

  const riskConfig = (() => {
    const s = data.riskScore;
    if (s <= 3) return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'کم‌ریسک' };
    if (s <= 6) return { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'ریسک متوسط' };
    return { color: 'text-red-500', bg: 'bg-red-500/10', label: 'پرریسک' };
  })();

  return (
    <div className="space-y-5">

      {/* ══════════ HERO HEADER ══════════ */}
      <Card className="glass-gold overflow-hidden" id="pa-overview">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber-500/10 border border-gold/30 shadow-lg shadow-gold/10">
              <Award className="size-7 text-gold" />
            </div>

            {/* Main info */}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">ارزش کل پرتفوی شما</p>
              <p className="mt-1 text-2xl font-extrabold gold-gradient-text tabular-nums sm:text-3xl">
                {formatNumber(data.totalPortfolioValue)}
                <span className="text-sm font-medium text-muted-foreground me-1"> گرم طلا</span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Coins className="size-3 text-gold" />
                  <span>{formatGrams(data.goldGrams)} طلا</span>
                </div>
                <span className="text-border">|</span>
                <div className="flex items-center gap-1">
                  <Wallet className="size-3" />
                  <span>{formatToman(data.fiatBalance)}</span>
                </div>
                {data.frozenGold > 0 && (
                  <>
                    <span className="text-border">|</span>
                    <div className="flex items-center gap-1">
                      <Lock className="size-3 text-amber-500" />
                      <span>{formatGrams(data.frozenGold)} مسدود</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Refresh */}
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-gold"
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
            >
              <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
            </Button>
          </div>

          {/* P/L Banner */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-background/60 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              {isProfit ? (
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
                  <TrendingUp className="size-4 text-emerald-500" />
                </div>
              ) : (
                <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10">
                  <TrendingDown className="size-4 text-red-500" />
                </div>
              )}
              <div>
                <p className="text-[10px] text-muted-foreground">سود/زیان محقق‌نشده</p>
                <p className={cn('text-sm font-bold tabular-nums', isProfit ? 'text-emerald-500' : 'text-red-500')}>
                  {isProfit ? '+' : ''}{formatToman(data.unrealizedProfit)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-gold/10">
                <Activity className="size-4 text-gold" />
              </div>
              <div className="text-end">
                <p className="text-[10px] text-muted-foreground">بازدهی کل</p>
                <p className={cn('text-sm font-bold tabular-nums', isPositiveROI ? 'text-emerald-500' : 'text-red-500')}>
                  {isPositiveROI ? '+' : ''}{formatNumber(data.totalROI)}٪
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/10">
                <BarChart3 className="size-4 text-sky-500" />
              </div>
              <div className="text-end">
                <p className="text-[10px] text-muted-foreground">رشد ماهانه</p>
                <p className={cn('text-sm font-bold tabular-nums', isPositiveMonthly ? 'text-emerald-500' : 'text-red-500')}>
                  {isPositiveMonthly ? '+' : ''}{formatNumber(data.monthlyGrowth)}٪
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══════════ STATS GRID ══════════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {/* Avg Buy Price */}
        <Card className="card-spotlight hover-lift-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                <Coins className="size-4.5 text-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground">میانگین خرید</p>
                <p className="mt-1 text-base font-bold tabular-nums">{formatToman(data.avgBuyPrice)}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/70">هر گرم ۱۸ عیار</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Sell Price */}
        <Card className="card-spotlight hover-lift-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <Zap className="size-4.5 text-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground">قیمت فعلی فروش</p>
                <p className="mt-1 text-base font-bold tabular-nums text-emerald-500">{formatToman(data.currentSellPrice)}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/70">اسپرد: {data.priceSpread}٪</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invested Amount */}
        <Card className="card-spotlight hover-lift-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10">
                <Banknote className="size-4.5 text-sky-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground">مبلغ سرمایه‌گذاری</p>
                <p className="mt-1 text-base font-bold tabular-nums">{formatPrice(data.investedAmount)}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/70">{data.totalBuyCount} خرید</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Score */}
        <Card className="card-spotlight hover-lift-sm overflow-hidden" id="pa-risk">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', riskConfig.bg)}>
                <Shield className={cn('size-4.5', riskConfig.color)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground">امتیاز ریسک</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={cn('text-base font-bold tabular-nums', riskConfig.color)}>{formatNumber(data.riskScore)}</span>
                  <span className="text-[10px] text-muted-foreground">از ۱۰</span>
                </div>
                <Progress value={data.riskScore * 10} className="mt-1.5 h-1.5" />
                <p className={cn('mt-0.5 text-[10px] font-medium', riskConfig.color)}>{riskConfig.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Best Buy Day */}
        <Card className="card-spotlight hover-lift-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                <CalendarDays className="size-4.5 text-purple-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground">بهترین روز خرید</p>
                <p className="mt-1 text-base font-bold text-purple-500">{persianDays[data.bestBuyDay] || data.bestBuyDay}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/70">کمترین قیمت هفته</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auto-Save Gold */}
        <Card className="card-spotlight hover-lift-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                <Repeat className="size-4.5 text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground">خرید خودکار</p>
                <p className="mt-1 text-base font-bold tabular-nums">{formatGrams(data.totalAutoSaveGold)}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/70">{data.activeAutoSavePlans} پلن فعال</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Growth with Sparkline */}
        <Card className="card-spotlight hover-lift-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', isPositiveMonthly ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
                {isPositiveMonthly ? <TrendingUp className="size-4.5 text-emerald-500" /> : <TrendingDown className="size-4.5 text-red-500" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground">رشد ماهانه</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={cn('text-base font-bold tabular-nums', isPositiveMonthly ? 'text-emerald-500' : 'text-red-500')}>
                    {isPositiveMonthly ? '+' : ''}{formatNumber(data.monthlyGrowth)}٪
                  </span>
                  {data.growthHistory && (
                    <Sparkline data={data.growthHistory.map((h) => h.value)} color={isPositiveMonthly ? '#10b981' : '#ef4444'} />
                  )}
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground/70">میانگین ۶ ماه</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Allocation */}
        <Card className="card-spotlight hover-lift-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                <BarChart3 className="size-4.5 text-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground">ترکیب دارایی</p>
                <div className="mt-2">
                  <AllocationDonut goldRatio={data.goldRatio} fiatRatio={data.fiatRatio} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ══════════ PORTFOLIO HISTORY CHART ══════════ */}
      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-gold" />
              <h3 className="text-sm font-bold">تاریخچه پرتفوی</h3>
            </div>
            <Badge variant="secondary" className="text-[10px] font-normal">
              ۳۰ روز اخیر
            </Badge>
          </div>
          <div className="h-[220px] sm:h-[260px]">
            {data.portfolioHistory && data.portfolioHistory.length > 1 ? (
              <PortfolioChart data={data.portfolioHistory} />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">داده‌ای موجود نیست</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ══════════ GROWTH + ALLOCATION ROW ══════════ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" id="pa-allocation">
        {/* Monthly Growth Chart */}
        <Card className="overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-500" />
              <h3 className="text-sm font-bold">رشد ماهانه طلا</h3>
            </div>
            <div className="h-[180px]">
              {data.growthHistory && data.growthHistory.length > 0 ? (
                <GrowthChart data={data.growthHistory} />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">داده‌ای موجود نیست</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card className="overflow-hidden" id="pa-performance">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <Info className="size-4 text-sky-500" />
              <h3 className="text-sm font-bold">خلاصه عملکرد</h3>
            </div>
            <div className="space-y-3">
              {/* Total ROI */}
              <div className="flex items-center justify-between rounded-xl bg-background/60 p-3">
                <span className="text-xs text-muted-foreground">بازدهی کل سرمایه‌گذاری</span>
                <span className={cn('text-sm font-bold tabular-nums', isPositiveROI ? 'text-emerald-500' : 'text-red-500')}>
                  {isPositiveROI ? '+' : ''}{formatNumber(data.totalROI)}٪
                </span>
              </div>
              {/* Monthly Growth */}
              <div className="flex items-center justify-between rounded-xl bg-background/60 p-3">
                <span className="text-xs text-muted-foreground">رشد ماهانه</span>
                <span className={cn('text-sm font-bold tabular-nums', isPositiveMonthly ? 'text-emerald-500' : 'text-red-500')}>
                  {isPositiveMonthly ? '+' : ''}{formatNumber(data.monthlyGrowth)}٪
                </span>
              </div>
              {/* Spread */}
              <div className="flex items-center justify-between rounded-xl bg-background/60 p-3">
                <span className="text-xs text-muted-foreground">اسپرد خرید/فروش</span>
                <span className="text-sm font-bold tabular-nums text-amber-500">{data.priceSpread}٪</span>
              </div>
              {/* Total buys */}
              <div className="flex items-center justify-between rounded-xl bg-background/60 p-3">
                <span className="text-xs text-muted-foreground">تعداد معاملات خرید</span>
                <span className="text-sm font-bold tabular-nums">{formatNumber(data.totalBuyCount)}</span>
              </div>
              {/* Total sells */}
              <div className="flex items-center justify-between rounded-xl bg-background/60 p-3">
                <span className="text-xs text-muted-foreground">تعداد معاملات فروش</span>
                <span className="text-sm font-bold tabular-nums">{formatNumber(data.totalSellCount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ══════════ RECENT TRANSACTIONS ══════════ */}
      {data.recentTransactions && data.recentTransactions.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="size-4 text-gold" />
                <h3 className="text-sm font-bold">آخرین تراکنش‌ها</h3>
              </div>
              <Badge variant="secondary" className="text-[10px] font-normal">
                {data.recentTransactions.length} تراکنش
              </Badge>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {data.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-xl bg-background/40 p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex size-8 items-center justify-center rounded-lg', tx.amountGold > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
                      {tx.amountGold > 0 ? <TrendingUp className="size-3.5 text-emerald-500" /> : <TrendingDown className="size-3.5 text-red-500" />}
                    </div>
                    <div>
                      <p className={cn('text-xs font-medium', txTypeColors[tx.type] || 'text-foreground')}>
                        {txTypeLabels[tx.type] || tx.type}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-end">
                    {tx.amountGold > 0 && (
                      <p className="text-xs font-medium tabular-nums">{formatGrams(tx.amountGold)}</p>
                    )}
                    {tx.amountFiat > 0 && (
                      <p className={cn('text-[10px] tabular-nums', txTypeColors[tx.type])}>
                        {formatToman(tx.amountFiat)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

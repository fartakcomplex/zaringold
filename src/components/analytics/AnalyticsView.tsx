'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Crown,
  Medal,
  Star,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Gem,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import { cn, formatNumber, formatToman, formatGrams, formatPrice } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface PortfolioSegment {
  name: string;
  value: number;
  color: string;
}

interface ReturnData {
  period: string;
  returnPct: number;
  returnAmount: number;
}

interface RankData {
  rank: number;
  level: string;
  totalUsers: number;
  percentile: number;
}

interface ProfitSummary {
  totalProfit: number;
  totalProfitPct: number;
  todayProfit: number;
  todayProfitPct: number;
  bestDay: number;
  worstDay: number;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Donut Chart (Pure CSS)                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function DonutChart({ segments, centerLabel, size = 180 }: {
  segments: PortfolioSegment[];
  centerLabel: string;
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  const gradientStops = segments.reduce<{ cumulative: number; stops: string[] }>(
    (acc, seg) => {
      const start = acc.cumulative;
      const end = acc.cumulative + (seg.value / total) * 100;
      acc.stops.push(`${seg.color} ${start}% ${end}%`);
      acc.cumulative = end;
      return acc;
    },
    { cumulative: 0, stops: [] },
  ).stops;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Donut ring using conic-gradient */}
      <div
        className="rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${gradientStops.join(', ')})`,
          WebkitMask: 'radial-gradient(circle, transparent 58%, black 60%)',
          mask: 'radial-gradient(circle, transparent 58%, black 60%)',
        }}
      />
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] font-medium text-muted-foreground">سبد شما</span>
        <span className="text-sm font-bold text-foreground">{centerLabel}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeletons                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Skeleton className="size-44 rounded-full" />
            <div className="flex-1 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-3 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16 ms-auto" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AnalyticsView() {
  const { user, goldWallet, fiatWallet, goldPrice, addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<PortfolioSegment[]>([]);
  const [returns, setReturns] = useState<ReturnData[]>([]);
  const [rank, setRank] = useState<RankData>({ rank: 42, level: 'طلا', totalUsers: 15000, percentile: 97 });
  const [profit, setProfit] = useState<ProfitSummary>({
    totalProfit: 0,
    totalProfitPct: 0,
    todayProfit: 0,
    todayProfitPct: 0,
    bestDay: 0,
    worstDay: 0,
  });
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const userId = user?.id || 'dev-super-admin';

  /* ── Fetch analytics data ── */
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/wallet?userId=${userId}`);
      const data = await res.json();

      if (data.success) {
        const fi = data.fiat?.balance ?? fiatWallet.balance;
        const gg = data.gold?.grams ?? goldWallet.goldGrams;
        const bp = goldPrice?.buyPrice ?? 34_000_000;
        const goldValue = gg * bp;
        const totalValue = fi + goldValue;

        const segments: PortfolioSegment[] = [
          { name: 'طلای آب‌شده', value: goldValue, color: '#D4AF37' },
          { name: 'موجودی ریالی', value: fi, color: '#64748b' },
        ];
        if (totalValue > 0) {
          setPortfolio(segments);
        }

        // Mock return data
        const returnData: ReturnData[] = [
          { period: '7d', returnPct: 1.8, returnAmount: Math.round(totalValue * 0.018) },
          { period: '30d', returnPct: 5.4, returnAmount: Math.round(totalValue * 0.054) },
          { period: '90d', returnPct: 12.1, returnAmount: Math.round(totalValue * 0.121) },
        ];
        setReturns(returnData);

        // Mock profit summary
        setProfit({
          totalProfit: Math.round(totalValue * 0.085),
          totalProfitPct: 8.5,
          todayProfit: Math.round(totalValue * 0.003),
          todayProfitPct: 0.3,
          bestDay: Math.round(totalValue * 0.012),
          worstDay: -Math.round(totalValue * 0.005),
        });
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      // Fallback mock data
      setPortfolio([
        { name: 'طلای آب‌شده', value: 65, color: '#D4AF37' },
        { name: 'موجودی ریالی', value: 25, color: '#64748b' },
        { name: 'سپرده طلا', value: 10, color: '#A78BFA' },
      ]);
      setReturns([
        { period: '7d', returnPct: 1.8, returnAmount: 612000 },
        { period: '30d', returnPct: 5.4, returnAmount: 1836000 },
        { period: '90d', returnPct: 12.1, returnAmount: 4114000 },
      ]);
      setProfit({
        totalProfit: 2890000,
        totalProfitPct: 8.5,
        todayProfit: 102000,
        todayProfitPct: 0.3,
        bestDay: 408000,
        worstDay: -170000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, fiatWallet.balance, goldWallet.goldGrams, goldPrice?.buyPrice]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const selectedReturn = returns.find((r) => r.period === period) || returns[1];

  const rankIcon = rank.rank <= 10 ? Crown : rank.rank <= 50 ? Trophy : rank.rank <= 100 ? Medal : Star;
  const rankColor = rank.rank <= 10 ? 'text-yellow-500' : rank.rank <= 50 ? 'text-amber-500' : rank.rank <= 100 ? 'text-orange-500' : 'text-slate-400';
  const rankBg = rank.rank <= 10 ? 'bg-yellow-500/10' : rank.rank <= 50 ? 'bg-amber-500/10' : rank.rank <= 100 ? 'bg-orange-500/10' : 'bg-slate-500/10';

  if (isLoading) return <AnalyticsSkeleton />;

  return (
    <div className="space-y-4 p-4">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#D4AF37]/10">
          <BarChart3 className="size-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">تحلیل‌های پیشرفته</h1>
          <p className="text-xs text-muted-foreground">عملکرد سبد سرمایه‌گذاری شما</p>
        </div>
      </div>

      {/* ── Return Cards (7d / 30d / 90d) ── */}
      <div className="grid grid-cols-3 gap-3">
        {(['7d', '30d', '90d'] as const).map((p) => {
          const rd = returns.find((r) => r.period === p);
          if (!rd) return null;
          const isActive = period === p;
          const isPositive = rd.returnPct >= 0;
          return (
            <Card
              key={p}
              className={cn(
                'cursor-pointer overflow-hidden transition-all duration-300',
                isActive
                  ? 'border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/5'
                  : 'border-transparent hover:border-border',
              )}
              onClick={() => setPeriod(p)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {p === '7d' ? '۷ روزه' : p === '30d' ? '۳۰ روزه' : '۹۰ روزه'}
                  </span>
                  {isPositive ? (
                    <ArrowUpRight className="size-3.5 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="size-3.5 text-red-500" />
                  )}
                </div>
                <p className={cn(
                  'text-lg font-black tabular-nums',
                  isPositive ? 'text-emerald-500' : 'text-red-500',
                )}>
                  {isPositive ? '+' : ''}{formatNumber(rd.returnPct)}%
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">
                  {formatToman(rd.returnAmount)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Portfolio Donut Chart ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <PieChartIcon className="size-4 text-[#D4AF37]" />
            توزیع سبد
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] font-medium">
            {selectedReturn.period === '7d' ? '۷ روز اخیر' : selectedReturn.period === '30d' ? '۳۰ روز اخیر' : '۹۰ روز اخیر'}
          </Badge>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
            <DonutChart
              segments={portfolio}
              centerLabel={portfolio.length > 0 ? `${portfolio[0]?.value > 100 ? formatPrice(portfolio[0].value) : formatNumber(portfolio[0].value)}` : '۰'}
            />
            <div className="flex-1 space-y-3 w-full sm:max-w-[200px]">
              {portfolio.map((seg, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="text-sm font-medium text-foreground flex-1">{seg.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {seg.value > 100 ? formatPrice(seg.value) : `${formatNumber(seg.value)}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Profit/Loss Summary ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Activity className="size-4 text-[#D4AF37]" />
            خلاصه سود و زیان
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Total profit */}
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4">
              <p className="text-xs font-medium text-emerald-600/80 mb-1">سود کل</p>
              <p className="text-lg font-black text-emerald-500 tabular-nums">
                +{formatNumber(profit.totalProfitPct)}%
              </p>
              <p className="text-[11px] text-muted-foreground tabular-nums mt-1">
                {formatToman(profit.totalProfit)}
              </p>
            </div>
            {/* Today profit */}
            <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-4">
              <p className="text-xs font-medium text-blue-600/80 mb-1">سود امروز</p>
              <p className="text-lg font-black text-blue-500 tabular-nums">
                +{formatNumber(profit.todayProfitPct)}%
              </p>
              <p className="text-[11px] text-muted-foreground tabular-nums mt-1">
                {formatToman(profit.todayProfit)}
              </p>
            </div>
            {/* Best day */}
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4">
              <p className="text-xs font-medium text-amber-600/80 mb-1">بهترین روز</p>
              <p className="text-lg font-black text-amber-500 tabular-nums flex items-center gap-1">
                <ArrowUpRight className="size-3.5" />
                {formatToman(profit.bestDay)}
              </p>
            </div>
            {/* Worst day */}
            <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4">
              <p className="text-xs font-medium text-red-600/80 mb-1">بدترین روز</p>
              <p className="text-lg font-black text-red-500 tabular-nums flex items-center gap-1">
                <ArrowDownRight className="size-3.5" />
                {formatToman(Math.abs(profit.worstDay))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Rank Badge ── */}
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className={cn('flex size-14 items-center justify-center rounded-2xl', rankBg)}>
              <RankIcon className={cn('size-7', rankColor)} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground flex items-center gap-2">
                رتبه شما در بین کاربران
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 border-[#D4AF37]/20">
                  <Target className="size-3 ms-1" />
                  رتبه {formatNumber(rank.rank)}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  سطح {rank.level}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                از {formatNumber(rank.totalUsers)} کاربر، از {formatNumber(rank.percentile)}% آن‌ها عملکرد بهتری دارید
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>رتبه {formatNumber(rank.rank)}</span>
              <span>رتبه {formatNumber(Math.max(rank.rank - 10, 1))}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-l from-[#D4AF37] to-[#F5D76E] transition-all duration-1000"
                style={{ width: `${Math.min(rank.percentile, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Monthly Performance ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="size-4 text-[#D4AF37]" />
            عملکرد ماهانه
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="space-y-3">
            {[
              { month: 'فروردین', pct: 3.2, amount: 1150000 },
              { month: 'اردیبهشت', pct: -1.5, amount: -540000 },
              { month: 'خرداد', pct: 2.8, amount: 1010000 },
              { month: 'تیر', pct: 4.1, amount: 1475000 },
              { month: 'مرداد', pct: 0.9, amount: 324000 },
              { month: 'شهریور', pct: 2.1, amount: 756000 },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">{m.month}</span>
                <div className="flex-1 h-6 rounded-lg bg-muted/50 overflow-hidden relative">
                  <div
                    className={cn(
                      'absolute inset-y-0 start-0 rounded-lg transition-all duration-700',
                      m.pct >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20',
                    )}
                    style={{ width: `${Math.abs(m.pct) * 15}%` }}
                  />
                  <div
                    className={cn(
                      'absolute inset-y-0 start-0 rounded-lg',
                      m.pct >= 0 ? 'bg-emerald-500/40' : 'bg-red-500/40',
                    )}
                    style={{ width: `${Math.abs(m.pct) * 8}%` }}
                  />
                </div>
                <span className={cn(
                  'text-xs font-bold tabular-nums w-14 text-end',
                  m.pct >= 0 ? 'text-emerald-500' : 'text-red-500',
                )}>
                  {m.pct >= 0 ? '+' : ''}{m.pct}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* Separate named component to avoid hoisting issues with conditional assignment */
function RankIcon({ className }: { className?: string }) {
  return <Trophy className={className} />;
}

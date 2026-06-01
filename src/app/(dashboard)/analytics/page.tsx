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
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Brain,
  Users,
  Gem,
  Wallet,
  Zap,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import { cn, formatNumber, formatToman, formatPrice } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface PortfolioSegment {
  name: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}

interface ReturnData {
  period: string;
  periodLabel: string;
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

interface LeaderboardEntry {
  rank: number;
  name: string;
  goldGrams: number;
  change: number;
  avatar: string;
}

interface MonthlyData {
  month: string;
  pct: number;
  amount: number;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SVG Donut Chart Component                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SVGDonutChart({ segments, centerLabel, size = 180 }: {
  segments: PortfolioSegment[];
  centerLabel: string;
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 22;
  const center = size / 2;

  const arcs = segments.reduce<Array<{
    color: string;
    pct: number;
    arcLength: number;
    startRad: number;
    endRad: number;
  }>>((acc, seg) => {
    const pct = total > 0 ? seg.value / total : 0;
    const angle = pct * 360;
    const arcLength = pct * circumference;
    const startAngle = acc.length === 0 ? -90 : acc[acc.length - 1].endRad * (180 / Math.PI);
    const endAngle = startAngle + angle;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    acc.push({ color: seg.color, pct, arcLength, startRad, endRad });
    return acc;
  }, []);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-0">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        {arcs.map((arc, i) => {
          const x1 = center + radius * Math.cos(arc.startRad);
          const y1 = center + radius * Math.sin(arc.startRad);
          const x2 = center + radius * Math.cos(arc.endRad);
          const y2 = center + radius * Math.sin(arc.endRad);
          const largeArc = arc.pct > 0.5 ? 1 : 0;

          if (arc.arcLength < 1) return null;

          return (
            <path
              key={i}
              d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-medium text-muted-foreground">ارزش سبد</span>
        <span className="text-sm font-black text-foreground">{centerLabel}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SVG Bar Chart Component                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SVGBarChart({ data }: { data: MonthlyData[] }) {
  const maxVal = Math.max(...data.map(d => Math.abs(d.pct)), 1);
  const chartWidth = 320;
  const chartHeight = 160;
  const barWidth = 32;
  const gap = (chartWidth - data.length * barWidth) / (data.length + 1);
  const zeroY = chartHeight / 2;

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" dir="rtl">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((pct, i) => (
        <React.Fragment key={i}>
          <line
            x1={0}
            y1={chartHeight * pct}
            x2={chartWidth}
            y2={chartHeight * pct}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-muted/15"
            strokeDasharray="4,4"
          />
        </React.Fragment>
      ))}
      {/* Zero line */}
      <line
        x1={0}
        y1={zeroY}
        x2={chartWidth}
        y2={zeroY}
        stroke="currentColor"
        strokeWidth="1"
        className="text-muted/30"
      />
      {/* Bars */}
      {data.map((d, i) => {
        const barH = (Math.abs(d.pct) / maxVal) * (chartHeight / 2 - 10);
        const x = gap + i * (barWidth + gap);
        const y = d.pct >= 0 ? zeroY - barH : zeroY;
        const color = d.pct >= 0 ? '#10b981' : '#ef4444';
        const fillColor = d.pct >= 0 ? '#10b981' : '#ef4444';
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={4}
              fill={fillColor}
              opacity={0.7}
              className="transition-all duration-500"
            />
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.min(barH, 4)}
              rx={2}
              fill={fillColor}
              className="transition-all duration-500"
            />
            <text
              x={x + barWidth / 2}
              y={d.pct >= 0 ? y - 4 : y + barH + 12}
              textAnchor="middle"
              fill={color}
              fontSize="9"
              fontWeight="700"
              className="tabular-nums"
            >
              {d.pct >= 0 ? '+' : ''}{d.pct}%
            </text>
            <text
              x={x + barWidth / 2}
              y={chartHeight - 2}
              textAnchor="middle"
              fill="currentColor"
              fontSize="8"
              className="text-muted-foreground"
            >
              {d.month}
            </text>
          </g>
        );
      })}
    </svg>
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
      <Card><CardContent className="p-6"><Skeleton className="h-48 w-full rounded-xl" /></CardContent></Card>
      <Card><CardContent className="p-6"><Skeleton className="h-64 w-full rounded-xl" /></CardContent></Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Rank Icon                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

function RankIcon({ className }: { className?: string }) {
  return <Trophy className={className} />;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Data                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'علی محمدی', goldGrams: 152.3, change: 3.2, avatar: '🥇' },
  { rank: 2, name: 'سارا احمدی', goldGrams: 128.7, change: 2.8, avatar: '🥈' },
  { rank: 3, name: 'رضا کریمی', goldGrams: 115.4, change: -1.1, avatar: '🥉' },
  { rank: 4, name: 'مریم حسینی', goldGrams: 98.2, change: 4.5, avatar: '4' },
  { rank: 5, name: 'حسین رضایی', goldGrams: 87.6, change: 1.9, avatar: '5' },
  { rank: 6, name: 'فاطمه نوری', goldGrams: 76.1, change: -0.5, avatar: '6' },
  { rank: 7, name: 'امیر طاهری', goldGrams: 65.8, change: 2.3, avatar: '7' },
];

const MONTHLY_PERFORMANCE: MonthlyData[] = [
  { month: 'فروردین', pct: 3.2, amount: 1150000 },
  { month: 'اردیبهشت', pct: -1.5, amount: -540000 },
  { month: 'خرداد', pct: 2.8, amount: 1010000 },
  { month: 'تیر', pct: 4.1, amount: 1475000 },
  { month: 'مرداد', pct: 0.9, amount: 324000 },
  { month: 'شهریور', pct: 2.1, amount: 756000 },
  { month: 'مهر', pct: -0.8, amount: -288000 },
  { month: 'آبان', pct: 3.5, amount: 1260000 },
];

const AI_INSIGHTS = [
  {
    icon: <Brain className="size-4 text-[#D4AF37]" />,
    title: 'تحلیل هوشمند بازار',
    text: 'بر اساس الگوریتم‌های تحلیل تکنیکال، روند فعلی طلا صعودی است. شاخص RSI در محدوده ۵۸ قرار دارد که نشان‌دهنده قدرت خریداران است. توصیه می‌شود در اصلاحات قیمت خرید انجام شود.',
    type: 'bullish' as const,
  },
  {
    icon: <Zap className="size-4 text-amber-500" />,
    title: 'رویداد مهم اقتصادی',
    text: 'جلسه FOMC فدرال رزرو در هفته آینده برگزار می‌شود. انتظار می‌رود نرخ بهره ثابت بماند که می‌تواند باعث افزایش قیمت طلا شود.',
    type: 'neutral' as const,
  },
  {
    icon: <Clock className="size-4 text-emerald-500" />,
    title: 'فرصت خرید',
    text: 'فاصله قیمت فعلی با میانگین متحرک ۵۰ روزه ۲.۳٪ است. این فاصله نشان می‌دهد در صورت اصلاح قیمت، فرصت مناسبی برای خرید وجود دارد.',
    type: 'opportunity' as const,
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AdvancedAnalyticsPage() {
  const { user, goldWallet, fiatWallet, goldPrice, addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<PortfolioSegment[]>([]);
  const [returns, setReturns] = useState<ReturnData[]>([]);
  const [rank, setRank] = useState<RankData>({ rank: 42, level: 'طلا', totalUsers: 15000, percentile: 97 });
  const [profit, setProfit] = useState<ProfitSummary>({
    totalProfit: 0, totalProfitPct: 0, todayProfit: 0, todayProfitPct: 0, bestDay: 0, worstDay: 0,
  });
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const userId = user?.id || 'dev-super-admin';

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/analytics?userId=${userId}`);
      const data = await res.json();

      if (data.success) {
        const p = data.portfolio;
        const r = data.returns;
        const s = data.stats;
        const totalValue = (p.goldGrams || 0) * (p.currentPricePerGram || 0) + (p.fiatBalance || 0);

        const segments: PortfolioSegment[] = [
          { name: 'طلای آب‌شده', value: (p.goldGrams || 0) * (p.currentPricePerGram || 0), color: '#D4AF37', icon: <Gem className="size-3" /> },
          { name: 'موجودی ریالی', value: p.fiatBalance || 0, color: '#64748b', icon: <Wallet className="size-3" /> },
          ...(p.frozenValueToman > 0 ? [{ name: 'طلای مسدود', value: p.frozenValueToman, color: '#A78BFA', icon: <Target className="size-3" /> }] : []),
        ];
        setPortfolio(segments);

        setReturns([
          { period: '7d', periodLabel: '۷ روزه', returnPct: r.return7d, returnAmount: 0 },
          { period: '30d', periodLabel: '۳۰ روزه', returnPct: r.return30d, returnAmount: 0 },
          { period: '90d', periodLabel: '۹۰ روزه', returnPct: r.return90d, returnAmount: 0 },
        ]);

        setProfit({
          totalProfit: r.profitLoss,
          totalProfitPct: r.profitLossPercent,
          todayProfit: totalValue * 0.003,
          todayProfitPct: 0.3,
          bestDay: totalValue * 0.012,
          worstDay: -totalValue * 0.005,
        });

        setRank({
          rank: s.rank,
          level: 'طلا',
          totalUsers: s.totalGoldHolders || 15000,
          percentile: s.topPercentile,
        });
      }
    } catch {
      // Fallback to mock data
      setPortfolio([
        { name: 'طلای آب‌شده', value: 45_000_000, color: '#D4AF37', icon: <Gem className="size-3" /> },
        { name: 'موجودی ریالی', value: 15_000_000, color: '#64748b', icon: <Wallet className="size-3" /> },
        { name: 'سپرده طلا', value: 8_000_000, color: '#A78BFA', icon: <Target className="size-3" /> },
      ]);
      setReturns([
        { period: '7d', periodLabel: '۷ روزه', returnPct: 1.8, returnAmount: 612000 },
        { period: '30d', periodLabel: '۳۰ روزه', returnPct: 5.4, returnAmount: 1836000 },
        { period: '90d', periodLabel: '۹۰ روزه', returnPct: 12.1, returnAmount: 4114000 },
      ]);
      setProfit({ totalProfit: 2890000, totalProfitPct: 8.5, todayProfit: 102000, todayProfitPct: 0.3, bestDay: 408000, worstDay: -170000 });
      setRank({ rank: 42, level: 'طلا', totalUsers: 15000, percentile: 97 });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const selectedReturn = returns.find((r) => r.period === period) || returns[1];
  const totalPortfolioValue = portfolio.reduce((s, seg) => s + seg.value, 0);

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
          <h1 className="text-lg font-bold text-foreground">داشبورد تحلیل پیشرفته</h1>
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
                  <span className="text-xs font-medium text-muted-foreground">{rd.periodLabel}</span>
                  {isPositive ? (
                    <ArrowUpRight className="size-3.5 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="size-3.5 text-red-500" />
                  )}
                </div>
                <p className={cn('text-lg font-black tabular-nums', isPositive ? 'text-emerald-500' : 'text-red-500')}>
                  {isPositive ? '+' : ''}{formatNumber(rd.returnPct)}%
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">
                  {rd.returnAmount > 0 ? formatToman(rd.returnAmount) : ''}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Portfolio Donut Chart (SVG) ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <PieChartIcon className="size-4 text-[#D4AF37]" />
            توزیع سبد سرمایه‌گذاری
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] font-medium">
            {selectedReturn.periodLabel}
          </Badge>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
            <SVGDonutChart
              segments={portfolio}
              centerLabel={totalPortfolioValue > 0 ? formatPrice(totalPortfolioValue) : '۰'}
            />
            <div className="flex-1 space-y-3 w-full sm:max-w-[200px]">
              {portfolio.map((seg, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="text-sm font-medium text-foreground flex-1">{seg.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {totalPortfolioValue > 0 ? `${((seg.value / totalPortfolioValue) * 100).toFixed(1)}٪` : '0٪'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Profit/Loss Analysis ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Activity className="size-4 text-[#D4AF37]" />
            تحلیل سود و زیان
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          {/* Gold price change since purchase */}
          <div className={cn(
            'rounded-xl p-4 mb-4 border',
            profit.totalProfitPct >= 0
              ? 'bg-emerald-500/5 border-emerald-500/10'
              : 'bg-red-500/5 border-red-500/10',
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">تغییر قیمت طلا از زمان خرید</p>
                <div className="flex items-center gap-2">
                  {profit.totalProfitPct >= 0 ? (
                    <ArrowUpRight className="size-5 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="size-5 text-red-500" />
                  )}
                  <p className={cn('text-2xl font-black tabular-nums', profit.totalProfitPct >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                    {profit.totalProfitPct >= 0 ? '+' : ''}{formatNumber(profit.totalProfitPct)}%
                  </p>
                </div>
              </div>
              <div className="text-start">
                <p className="text-[10px] text-muted-foreground">مبلغ</p>
                <p className={cn('text-sm font-bold tabular-nums', profit.totalProfitPct >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                  {profit.totalProfit >= 0 ? '+' : ''}{formatToman(Math.abs(profit.totalProfit))}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-4">
              <p className="text-xs font-medium text-blue-600/80 mb-1">سود امروز</p>
              <p className="text-lg font-black text-blue-500 tabular-nums">
                +{formatNumber(profit.todayProfitPct)}%
              </p>
              <p className="text-[11px] text-muted-foreground tabular-nums mt-1">
                {formatToman(profit.todayProfit)}
              </p>
            </div>
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4">
              <p className="text-xs font-medium text-amber-600/80 mb-1">بهترین روز</p>
              <p className="text-lg font-black text-amber-500 tabular-nums flex items-center gap-1 justify-center">
                <ArrowUpRight className="size-3.5" />
                {formatToman(profit.bestDay)}
              </p>
            </div>
            <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4">
              <p className="text-xs font-medium text-red-600/80 mb-1">بدترین روز</p>
              <p className="text-lg font-black text-red-500 tabular-nums flex items-center gap-1 justify-center">
                <ArrowDownRight className="size-3.5" />
                {formatToman(Math.abs(profit.worstDay))}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4">
              <p className="text-xs font-medium text-emerald-600/80 mb-1">سود کل</p>
              <p className="text-lg font-black text-emerald-500 tabular-nums">
                {profit.totalProfit >= 0 ? '+' : ''}{formatNumber(profit.totalProfitPct)}%
              </p>
              <p className="text-[11px] text-muted-foreground tabular-nums mt-1">
                {formatToman(profit.totalProfit)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Monthly Performance Bar Chart (SVG) ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="size-4 text-[#D4AF37]" />
            عملکرد ماهانه
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] font-medium">
            ۸ ماه اخیر
          </Badge>
        </CardHeader>
        <CardContent className="pb-6">
          <SVGBarChart data={MONTHLY_PERFORMANCE} />
        </CardContent>
      </Card>

      {/* ── Leaderboard: Top Gold Holders ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Users className="size-4 text-[#D4AF37]" />
            جدول رتبه‌بندی دارایی طلا
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] font-medium">
            برترین‌ها
          </Badge>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-2 max-h-80 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {MOCK_LEADERBOARD.map((entry) => (
              <div
                key={entry.rank}
                className={cn(
                  'flex items-center gap-3 rounded-xl p-3 transition-colors',
                  entry.rank <= 3 ? 'bg-[#D4AF37]/5 border border-[#D4AF37]/10' : 'hover:bg-muted/50',
                )}
              >
                <div className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                  entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-600' :
                  entry.rank === 2 ? 'bg-slate-300/20 text-slate-500' :
                  entry.rank === 3 ? 'bg-amber-700/20 text-amber-700' :
                  'bg-muted text-muted-foreground',
                )}>
                  {typeof entry.avatar === 'string' && entry.avatar.length === 1 ? entry.rank : entry.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{entry.name}</p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">
                    {formatNumber(entry.goldGrams)} گرم طلا
                  </p>
                </div>
                <div className={cn(
                  'text-xs font-bold tabular-nums',
                  entry.change >= 0 ? 'text-emerald-500' : 'text-red-500',
                )}>
                  {entry.change >= 0 ? '+' : ''}{entry.change}٪
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── AI Market Insights ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Brain className="size-4 text-[#D4AF37]" />
            تحلیل هوشمند بازار
          </CardTitle>
          <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 border-[#D4AF37]/20 text-[10px]">
            AI
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3 pb-6">
          {AI_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                'rounded-xl border p-4 transition-colors',
                insight.type === 'bullish' ? 'bg-emerald-500/5 border-emerald-500/10' :
                insight.type === 'opportunity' ? 'bg-blue-500/5 border-blue-500/10' :
                'bg-amber-500/5 border-amber-500/10',
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {insight.icon}
                <p className="text-sm font-bold text-foreground">{insight.title}</p>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{insight.text}</p>
            </div>
          ))}
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
                از {formatNumber(rank.totalUsers)} کاربر، از {formatNumber(rank.percentile)}٪ آن‌ها عملکرد بهتری دارید
              </p>
            </div>
          </div>
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
    </div>
  );
}

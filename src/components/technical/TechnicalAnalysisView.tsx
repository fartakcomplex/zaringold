'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Signal,
  Gauge,
  Layers,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  MoveRight,
  Info,
  LineChart,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { formatToman, formatNumber, cn } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types & Constants                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

type SignalType = 'buy' | 'sell' | 'hold';
type TrendDirection = 'up' | 'down' | 'sideways';

interface IndicatorData {
  rsi: number;
  macdSignal: string; // 'bullish' | 'bearish' | 'neutral'
  macdValue: number;
  macdHistogram: number;
  ma20: number;
  ma50: number;
  ma200: number;
  bollingerWidth: number;
  bollingerUpper: number;
  bollingerLower: number;
  signal: SignalType;
  trend: TrendDirection;
  strength: number; // 0-100
}

interface PriceBar {
  price: number;
  isUp: boolean;
  time: string;
}

const SIGNAL_CONFIG: Record<SignalType, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  buy: { label: 'خرید', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: ArrowUpRight },
  sell: { label: 'فروش', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30', icon: ArrowDownRight },
  hold: { label: 'نگهداری', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30', icon: Minus },
};

const TREND_CONFIG: Record<TrendDirection, { label: string; color: string; icon: React.ElementType }> = {
  up: { label: 'صعودی', color: 'text-emerald-500', icon: ArrowUp },
  down: { label: 'نزولی', color: 'text-red-500', icon: ArrowDown },
  sideways: { label: 'عرضی', color: 'text-amber-500', icon: MoveRight },
};

/* Generate mock price bars */
function generatePriceBars(count: number): PriceBar[] {
  let basePrice = 33900000;
  const bars: PriceBar[] = [];
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * 300000;
    const newPrice = Math.max(30000000, basePrice + change);
    const isUp = newPrice >= basePrice;
    bars.push({
      price: newPrice,
      isUp,
      time: `${formatNumber(8 + Math.floor(i / 4))}:${formatNumber(String((i % 4) * 15).padStart(2, '0'))}`,
    });
    basePrice = newPrice;
  }
  return bars;
}

/* Generate mock indicators */
function generateIndicators(): IndicatorData {
  const rsi = 40 + Math.random() * 30; // 40-70 range
  const macdValue = (Math.random() - 0.4) * 500000;
  const macdHistogram = (Math.random() - 0.45) * 300000;
  const ma20 = 33500000 + Math.random() * 800000;
  const ma50 = 33200000 + Math.random() * 1000000;
  const ma200 = 32800000 + Math.random() * 1500000;
  const bollingerWidth = 2 + Math.random() * 4; // percentage
  const bollingerUpper = ma20 * (1 + bollingerWidth / 100);
  const bollingerLower = ma20 * (1 - bollingerWidth / 100);

  const signal: SignalType = rsi > 65 ? 'sell' : rsi < 35 ? 'buy' : 'hold';
  const trend: TrendDirection = ma20 > ma50 ? 'up' : ma20 < ma50 ? 'down' : 'sideways';
  const strength = Math.round(rsi);

  return {
    rsi: Math.round(rsi * 10) / 10,
    macdSignal: macdHistogram > 0 ? 'bullish' : macdHistogram < -100000 ? 'bearish' : 'neutral',
    macdValue: Math.round(macdValue),
    macdHistogram: Math.round(macdHistogram),
    ma20: Math.round(ma20),
    ma50: Math.round(ma50),
    ma200: Math.round(ma200),
    bollingerWidth: Math.round(bollingerWidth * 10) / 10,
    bollingerUpper: Math.round(bollingerUpper),
    bollingerLower: Math.round(bollingerLower),
    signal,
    trend,
    strength,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Price Chart (Div-based bars)                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PriceChart({ bars }: { bars: PriceBar[] }) {
  if (!bars.length) return null;

  const minPrice = Math.min(...bars.map((b) => b.price));
  const maxPrice = Math.max(...bars.map((b) => b.price));
  const range = maxPrice - minPrice || 1;
  const chartHeight = 200;

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-[#1e1e1e] p-4">
      {/* Y-axis labels */}
      <div className="absolute top-2 left-2 flex flex-col justify-between h-[200px] text-[9px] tabular-nums text-muted-foreground/60">
        <span>{formatNumber(Math.round(maxPrice / 1000000))}M</span>
        <span>{formatNumber(Math.round((minPrice + range / 2) / 1000000))}M</span>
        <span>{formatNumber(Math.round(minPrice / 1000000))}M</span>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-[2px] h-[200px] mr-10">
        {bars.map((bar, i) => {
          const height = ((bar.price - minPrice) / range) * (chartHeight - 10) + 10;
          const color = bar.isUp ? '#22c55e' : '#ef4444';
          return (
            <div
              key={i}
              className="flex-1 min-w-[3px] rounded-t-[2px] transition-all duration-300 hover:opacity-80"
              style={{
                height: `${height}px`,
                backgroundColor: color,
              }}
              title={`${bar.time}: ${formatToman(bar.price)}`}
            />
          );
        })}
      </div>

      {/* Simple moving average line overlay */}
      <svg
        className="absolute inset-0 pointer-events-none mr-10"
        width="100%"
        height={chartHeight}
        style={{ top: '16px' }}
      >
        {(() => {
          const ma20 = [];
          for (let i = 0; i < bars.length; i++) {
            if (i < 5) {
              ma20.push(null);
            } else {
              const slice = bars.slice(Math.max(0, i - 5), i + 1);
              ma20.push(slice.reduce((s, b) => s + b.price, 0) / slice.length);
            }
          }
          const validPoints = ma20.filter((p) => p !== null);
          if (validPoints.length < 2) return null;
          const validMin = Math.min(...validPoints.map(Number));
          const validRange = (Math.max(...validPoints.map(Number)) - validMin) || 1;
          const points = ma20
            .map((p, i) => {
              if (p === null) return null;
              const x = (i / (bars.length - 1)) * 100;
              const y = chartHeight - 5 - ((Number(p) - validMin) / validRange) * (chartHeight - 20);
              return `${x}%,${y}`;
            })
            .filter(Boolean)
            .join(' ');
          return <polyline points={points} fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />;
        })()}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Indicator Card                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function IndicatorCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  status,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  status: 'positive' | 'negative' | 'neutral';
}) {
  const statusColor = status === 'positive' ? 'text-emerald-500' : status === 'negative' ? 'text-red-500' : 'text-amber-500';

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="size-5" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground">{title}</p>
        <p className="text-sm font-black tabular-nums" style={{ color }}>{value}</p>
        <p className={cn('text-[10px] font-semibold', statusColor)}>{subtitle}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main TechnicalAnalysisView Component                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function TechnicalAnalysisView() {
  const { addToast } = useAppStore();

  /* ── State ── */
  const [bars, setBars] = useState<PriceBar[]>([]);
  const [indicators, setIndicators] = useState<IndicatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [lastUpdate, setLastUpdate] = useState<string>('');

  /* ── Load Data ── */
  const loadData = () => {
    setLoading(true);
    const barCount = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : timeRange === '7d' ? 42 : 60;
    setTimeout(() => {
      setBars(generatePriceBars(barCount));
      setIndicators(generateIndicators());
      setLastUpdate(new Date().toLocaleTimeString('fa-IR'));
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    // Load data on time range change
    const timer = setTimeout(() => {
      setLoading(true);
      const barCount = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : timeRange === '7d' ? 42 : 60;
      setBars(generatePriceBars(barCount));
      setIndicators(generateIndicators());
      setLastUpdate(new Date().toLocaleTimeString('fa-IR'));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [timeRange]);

  return (
    <div className="space-y-5 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5">
          <Activity className="size-5 text-[#D4AF37]" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">تحلیل فنی</h1>
          <p className="text-xs text-muted-foreground">شاخص‌های تکنیکال بازار طلا</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          className="gap-1.5 border-border text-xs"
        >
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
          بروز
        </Button>
      </div>

      {/* Signal & Trend */}
      {loading ? (
        <Skeleton className="h-20 w-full rounded-xl" />
      ) : indicators && (
        <Card className="overflow-hidden border-[#D4AF37]/30 bg-gradient-to-l from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Main Signal */}
                <div className={cn(
                  'flex items-center gap-2 rounded-xl border px-4 py-2.5',
                  SIGNAL_CONFIG[indicators.signal].bg,
                )}>
                  {(() => {
                    const SignalIcon = SIGNAL_CONFIG[indicators.signal].icon;
                    return <SignalIcon className="size-5" style={{ color: SIGNAL_CONFIG[indicators.signal].color === 'text-emerald-500' ? '#22c55e' : SIGNAL_CONFIG[indicators.signal].color === 'text-red-500' ? '#ef4444' : '#f59e0b' }} />;
                  })()}
                  <div>
                    <p className="text-[10px] text-muted-foreground">سیگنال</p>
                    <p className={cn('text-base font-black', SIGNAL_CONFIG[indicators.signal].color)}>
                      {SIGNAL_CONFIG[indicators.signal].label}
                    </p>
                  </div>
                </div>

                {/* Trend Direction */}
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5">
                  {(() => {
                    const TrendIcon = TREND_CONFIG[indicators.trend].icon;
                    return <TrendIcon className="size-5" style={{ color: TREND_CONFIG[indicators.trend].color === 'text-emerald-500' ? '#22c55e' : TREND_CONFIG[indicators.trend].color === 'text-red-500' ? '#ef4444' : '#f59e0b' }} />;
                  })()}
                  <div>
                    <p className="text-[10px] text-muted-foreground">روند</p>
                    <p className={cn('text-base font-black', TREND_CONFIG[indicators.trend].color)}>
                      {TREND_CONFIG[indicators.trend].label}
                    </p>
                  </div>
                </div>
              </div>

              {/* Strength */}
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">قدرت</p>
                <p className="text-2xl font-black tabular-nums text-[#D4AF37]">{formatNumber(indicators.strength)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Chart */}
      <Card className="overflow-hidden border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-[#D4AF37]" />
            <CardTitle className="text-sm font-bold">نمودار قیمت</CardTitle>
          </div>
          <div className="flex gap-1">
            {['1h', '24h', '7d', '30d'].map((range) => (
              <Button
                key={range}
                size="sm"
                variant={timeRange === range ? 'default' : 'ghost'}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'text-[10px] px-2',
                  timeRange === range
                    ? 'bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]'
                    : 'text-muted-foreground',
                )}
              >
                {range === '1h' ? '۱ ساعت' : range === '24h' ? '۲۴ ساعت' : range === '7d' ? '۷ روز' : '۳۰ روز'}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[232px] w-full rounded-lg" />
          ) : (
            <PriceChart bars={bars} />
          )}
          {lastUpdate && (
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              آخرین بروزرسانی: {lastUpdate}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Technical Indicators Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : indicators && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Gauge className="size-4 text-[#D4AF37]" />
            <h2 className="text-sm font-bold text-foreground">شاخص‌های فنی</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* RSI */}
            <IndicatorCard
              title="شاخص قدرت نسبی (RSI)"
              value={formatNumber(indicators.rsi)}
              subtitle={
                indicators.rsi > 70 ? 'اشباع خرید' :
                indicators.rsi < 30 ? 'اشباع فروش' :
                'منطقه خنثی'
              }
              icon={Gauge}
              color="#D4AF37"
              status={
                indicators.rsi > 70 ? 'negative' :
                indicators.rsi < 30 ? 'positive' :
                'neutral'
              }
            />

            {/* MACD */}
            <IndicatorCard
              title="MACD"
              value={
                indicators.macdSignal === 'bullish' ? 'صعودی' :
                indicators.macdSignal === 'bearish' ? 'نزولی' :
                'خنثی'
              }
              subtitle={`هیستوگرام: ${formatNumber(Math.abs(indicators.macdHistogram))}`}
              icon={Signal}
              color={
                indicators.macdSignal === 'bullish' ? '#22c55e' :
                indicators.macdSignal === 'bearish' ? '#ef4444' :
                '#f59e0b'
              }
              status={
                indicators.macdSignal === 'bullish' ? 'positive' :
                indicators.macdSignal === 'bearish' ? 'negative' :
                'neutral'
              }
            />

            {/* MA20 */}
            <IndicatorCard
              title="میانگین متحرک ۲۰ روزه (MA20)"
              value={formatToman(indicators.ma20)}
              subtitle={
                bars[bars.length - 1]?.price > indicators.ma20 ? 'بالای MA20 ↑' : 'زیر MA20 ↓'
              }
              icon={LineChart}
              color="#60A5FA"
              status={bars[bars.length - 1]?.price > indicators.ma20 ? 'positive' : 'negative'}
            />

            {/* MA50 */}
            <IndicatorCard
              title="میانگین متحرک ۵۰ روزه (MA50)"
              value={formatToman(indicators.ma50)}
              subtitle={
                indicators.ma20 > indicators.ma50 ? 'MA20 > MA50 صعودی' : 'MA20 < MA50 نزولی'
              }
              icon={Layers}
              color="#A78BFA"
              status={indicators.ma20 > indicators.ma50 ? 'positive' : 'negative'}
            />
          </div>

          {/* Bollinger Bands */}
          <Card className="overflow-hidden border-border">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Layers className="size-4 text-[#D4AF37]" />
              <CardTitle className="text-sm font-bold">باندهای بولینگر</CardTitle>
              <Badge variant="outline" className="ml-auto border-[#D4AF37]/30 text-[#D4AF37] text-[10px]">
                عرض: {formatNumber(indicators.bollingerWidth)}٪
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Bollinger Band Visualization */}
                <div className="relative h-16 rounded-lg bg-[#1e1e1e] overflow-hidden">
                  {/* Upper band */}
                  <div
                    className="absolute top-0 w-full border-b border-dashed border-red-500/40"
                    style={{ height: '20%' }}
                  >
                    <span className="absolute top-0.5 right-2 text-[9px] text-red-400/60 tabular-nums">
                      بالایی: {formatNumber(Math.round(indicators.bollingerUpper / 1000000))}M
                    </span>
                  </div>
                  {/* Middle (MA20) */}
                  <div
                    className="absolute w-full border-t border-dashed border-[#D4AF37]/60"
                    style={{ top: '45%' }}
                  >
                    <span className="absolute -top-3 right-2 text-[9px] text-[#D4AF37]/60 tabular-nums">
                      MA20: {formatNumber(Math.round(indicators.ma20 / 1000000))}M
                    </span>
                  </div>
                  {/* Lower band */}
                  <div
                    className="absolute bottom-0 w-full border-t border-dashed border-emerald-500/40"
                    style={{ height: '20%' }}
                  >
                    <span className="absolute bottom-0.5 right-2 text-[9px] text-emerald-400/60 tabular-nums">
                      پایینی: {formatNumber(Math.round(indicators.bollingerLower / 1000000))}M
                    </span>
                  </div>
                  {/* Current price dot */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 size-3 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.5)]"
                    style={{ top: '43%' }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-border bg-background p-2">
                    <p className="text-[9px] text-muted-foreground">باند بالایی</p>
                    <p className="text-xs font-bold tabular-nums text-red-400">{formatToman(indicators.bollingerUpper)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-2">
                    <p className="text-[9px] text-muted-foreground">میانگین</p>
                    <p className="text-xs font-bold tabular-nums text-[#D4AF37]">{formatToman(indicators.ma20)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-2">
                    <p className="text-[9px] text-muted-foreground">باند پایینی</p>
                    <p className="text-xs font-bold tabular-nums text-emerald-400">{formatToman(indicators.bollingerLower)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Disclaimer */}
      <Card className="overflow-hidden border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              این تحلیل صرفاً بر اساس شاخص‌های تکنیکال می‌باشد و توصیه سرمایه‌گذاری نیست.
              همیشه قبل از معامله، تحلیل بنیادی و مدیریت ریسک را در نظر بگیرید.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

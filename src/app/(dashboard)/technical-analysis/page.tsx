'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { cn, formatNumber, formatToman } from '@/lib/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Target,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  MinusCircle,
  RefreshCw,
  Zap,
  LineChart,
  Layers,
  Gauge,
  CandlestickChart,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════ */
/*  Types & Mock Data                                             */
/* ═══════════════════════════════════════════════════════════════ */

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IndicatorData {
  value: number;
  values?: number[];
}

type TimePeriod = '1D' | '1W' | '1M' | '3M' | '1Y';

function generateCandleData(count: number, basePrice: number, volatility: number): CandleData[] {
  const data: CandleData[] = [];
  let price = basePrice;
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * volatility;
    const open = price;
    const close = Math.max(price + change, basePrice * 0.7);
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    price = close;
    const d = new Date(Date.now() - (count - i) * 3600000);
    data.push({ time: `${d.getMonth() + 1}/${d.getDate()}`, open, high, low, close: Math.max(close, 1), volume: Math.floor(Math.random() * 1000000 + 500000) });
  }
  return data;
}

function calculateEMA(prices: number[], period: number): number[] {
  const result: number[] = [];
  const mult = 2 / (period + 1);
  result[0] = prices[0];
  for (let i = 1; i < prices.length; i++) {
    result[i] = (prices[i] - result[i - 1]) * mult + result[i - 1];
  }
  return result;
}

function calculateRSI(values: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period) { rsi.push(50); continue; }
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = values[j] - values[j - 1];
      if (diff > 0) gains += diff; else losses += Math.abs(diff);
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - 100 / (1 + rs));
  }
  return rsi;
}

function calculateBollinger(prices: number[], period: number = 20, mult: number = 2): { upper: number[]; middle: number[]; lower: number[] } {
  const upper: number[] = [], middle: number[] = [], lower: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) { upper.push(prices[i]); middle.push(prices[i]); lower.push(prices[i]); continue; }
    const slice = prices.slice(i - period + 1, i + 1);
    const sma = slice.reduce((s, v) => s + v, 0) / period;
    const std = Math.sqrt(slice.reduce((s, v) => s + Math.pow(v - sma, 2), 0) / period);
    middle.push(sma);
    upper.push(sma + mult * std);
    lower.push(sma - mult * std);
  }
  return { upper, middle, lower };
}

function calculateMACD(prices: number[], fast = 12, slow = 26, signal = 9): { macd: number[]; signal: number[]; histogram: number[] } {
  const fastEma = calculateEMA(prices, fast);
  const slowEma = calculateEMA(prices, slow);
  const macdLine = fastEma.map((v, i) => v - slowEma[i]);
  const signalLine = calculateEMA(macdLine, signal);
  const histogram = macdLine.map((v, i) => v - signalLine[i]);
  return { macd: macdLine, signal: signalLine, histogram };
}

const PERIODS: { key: TimePeriod; label: string; count: number; vol: number }[] = [
  { key: '1D', label: '۱ روز', count: 24, vol: 200000 },
  { key: '1W', label: '۱ هفته', count: 42, vol: 500000 },
  { key: '1M', label: '۱ ماه', count: 60, vol: 800000 },
  { key: '3M', label: '۳ ماه', count: 90, vol: 1200000 },
  { key: '1Y', label: '۱ سال', count: 120, vol: 2000000 },
];

/* ═══════════════════════════════════════════════════════════════ */
/*  SVG Candlestick Chart                                         */
/* ═══════════════════════════════════════════════════════════════ */

function CandlestickChartSVG({ data, showBollinger, showMA20, showMA50, bollinger, ema20, sma200 }: {
  data: CandleData[]; showBollinger: boolean; showMA20: boolean; showMA50: boolean;
  bollinger: { upper: number[]; middle: number[]; lower: number[] };
  ema20: number[]; sma200: number[];
}) {
  const width = 700;
  const height = 280;
  const padding = { top: 10, right: 60, bottom: 30, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const prices = data.flatMap(d => [d.high, d.low]);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;
  const yScale = (v: number) => padding.top + chartH - ((v - minP) / range) * chartH;
  const candleW = Math.max(chartW / data.length - 2, 3);
  const gap = chartW / data.length;

  // Support/Resistance
  const support = minP + range * 0.2;
  const resistance = maxP - range * 0.15;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = padding.top + chartH * (1 - pct);
        const val = minP + range * pct;
        return (
          <g key={pct}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" strokeWidth="0.3" className="text-muted-foreground/20" />
            <text x={width - padding.right + 4} y={y + 3} fill="currentColor" className="text-[8px] text-muted-foreground/50" fontSize="8">{formatNumber(val)}</text>
          </g>
        );
      })}

      {/* Support line */}
      <line x1={padding.left} y1={yScale(support)} x2={width - padding.right} y2={yScale(support)} stroke="#22C55E" strokeWidth="0.5" strokeDasharray="4 2" opacity="0.5" />
      <text x={padding.left + 2} y={yScale(support) - 3} fill="#22C55E" fontSize="7" opacity="0.7">حمایت {formatNumber(support)}</text>

      {/* Resistance line */}
      <line x1={padding.left} y1={yScale(resistance)} x2={width - padding.right} y2={yScale(resistance)} stroke="#EF4444" strokeWidth="0.5" strokeDasharray="4 2" opacity="0.5" />
      <text x={padding.left + 2} y={yScale(resistance) - 3} fill="#EF4444" fontSize="7" opacity="0.7">مقاومت {formatNumber(resistance)}</text>

      {/* Bollinger Bands */}
      {showBollinger && (
        <g opacity="0.3">
          <polygon points={data.map((_, i) => `${padding.left + i * gap},${yScale(bollinger.upper[i])}`).join(' ') + ' ' + data.slice().reverse().map((_, i) => `${padding.left + (data.length - 1 - i) * gap},${yScale(bollinger.lower[data.length - 1 - i])}`).join(' ')} fill="#D4AF37" />
          <polyline points={data.map((_, i) => `${padding.left + i * gap},${yScale(bollinger.upper[i])}`).join(' ')} fill="none" stroke="#D4AF37" strokeWidth="0.8" />
          <polyline points={data.map((_, i) => `${padding.left + i * gap},${yScale(bollinger.lower[i])}`).join(' ')} fill="none" stroke="#D4AF37" strokeWidth="0.8" />
        </g>
      )}

      {/* EMA 20 */}
      {showMA20 && ema20.length > 0 && (
        <polyline points={ema20.map((v, i) => `${padding.left + i * gap},${yScale(v)}`).join(' ')} fill="none" stroke="#3B82F6" strokeWidth="1.2" opacity="0.8" />
      )}

      {/* SMA 200 */}
      {showMA50 && sma200.length > 0 && (
        <polyline points={sma200.map((v, i) => `${padding.left + i * gap},${yScale(v)}`).join(' ')} fill="none" stroke="#EF4444" strokeWidth="1.2" opacity="0.6" strokeDasharray="3 2" />
      )}

      {/* Candles */}
      {data.map((candle, i) => {
        const x = padding.left + i * gap;
        const isGreen = candle.close >= candle.open;
        const bodyTop = yScale(Math.max(candle.open, candle.close));
        const bodyBottom = yScale(Math.min(candle.open, candle.close));
        const bodyH = Math.max(bodyBottom - bodyTop, 1);
        return (
          <g key={i}>
            {/* Wick */}
            <line x1={x + candleW / 2} y1={yScale(candle.high)} x2={x + candleW / 2} y2={yScale(candle.low)} stroke={isGreen ? '#22C55E' : '#EF4444'} strokeWidth="0.8" />
            {/* Body */}
            <rect x={x} y={bodyTop} width={candleW} height={bodyH} fill={isGreen ? '#22C55E' : '#EF4444'} rx="0.5" />
          </g>
        );
      })}

      {/* X labels (show every Nth) */}
      {data.filter((_, i) => i % Math.max(Math.floor(data.length / 6), 1) === 0).map((c, i) => {
        const idx = data.indexOf(c);
        return <text key={i} x={padding.left + idx * gap + candleW / 2} y={height - 5} fill="currentColor" className="text-[7px] text-muted-foreground/40" fontSize="7" textAnchor="middle">{c.time}</text>;
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Volume Bars                                                  */
/* ═══════════════════════════════════════════════════════════════ */

function VolumeBarsSVG({ data }: { data: CandleData[] }) {
  const width = 700;
  const height = 60;
  const padding = { left: 10, right: 60, bottom: 5, top: 5 };
  const chartW = width - padding.left - padding.right;
  const maxVol = Math.max(...data.map(d => d.volume));
  const gap = chartW / data.length;
  const barW = Math.max(gap - 2, 2);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const h = (d.volume / maxVol) * (height - padding.top - padding.bottom);
        const x = padding.left + i * gap;
        const isGreen = d.close >= d.open;
        return <rect key={i} x={x} y={height - padding.bottom - h} width={barW} height={h} fill={isGreen ? '#22C55E' : '#EF4444'} opacity="0.5" rx="0.5" />;
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  RSI Chart                                                    */
/* ═══════════════════════════════════════════════════════════════ */

function RSIChartSVG({ rsi }: { rsi: number[] }) {
  const width = 700;
  const height = 100;
  const padding = { left: 10, right: 60, bottom: 5, top: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const gap = chartW / rsi.length;

  const yScale = (v: number) => padding.top + (1 - v / 100) * chartH;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Overbought zone */}
      <rect x={padding.left} y={yScale(100)} width={chartW} height={yScale(70) - yScale(100)} fill="#EF4444" opacity="0.08" />
      <line x1={padding.left} y1={yScale(70)} x2={width - padding.right} y2={yScale(70)} stroke="#EF4444" strokeWidth="0.5" strokeDasharray="3 2" opacity="0.4" />
      <text x={width - padding.right + 2} y={yScale(70) + 3} fill="#EF4444" fontSize="7" opacity="0.6">۷۰</text>

      {/* Oversold zone */}
      <rect x={padding.left} y={yScale(30)} width={chartW} height={yScale(0) - yScale(30)} fill="#22C55E" opacity="0.08" />
      <line x1={padding.left} y1={yScale(30)} x2={width - padding.right} y2={yScale(30)} stroke="#22C55E" strokeWidth="0.5" strokeDasharray="3 2" opacity="0.4" />
      <text x={width - padding.right + 2} y={yScale(30) + 3} fill="#22C55E" fontSize="7" opacity="0.6">۳۰</text>

      {/* Middle line */}
      <line x1={padding.left} y1={yScale(50)} x2={width - padding.right} y2={yScale(50)} stroke="currentColor" strokeWidth="0.3" className="text-muted-foreground/20" />

      {/* RSI line */}
      <polyline points={rsi.map((v, i) => `${padding.left + i * gap},${yScale(v)}`).join(' ')} fill="none" stroke="#A855F7" strokeWidth="1.5" />

      {/* Labels */}
      <text x={width - padding.right + 2} y={yScale(rsi[rsi.length - 1]) + 3} fill="#A855F7" fontSize="8" fontWeight="bold">{rsi[rsi.length - 1].toFixed(1)}</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  MACD Chart                                                   */
/* ═══════════════════════════════════════════════════════════════ */

function MACDChartSVG({ macd, signal, histogram }: { macd: number[]; signal: number[]; histogram: number[] }) {
  const width = 700;
  const height = 100;
  const padding = { left: 10, right: 60, bottom: 5, top: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const gap = chartW / histogram.length;
  const barW = Math.max(gap - 2, 2);

  const allVals = [...macd, ...signal, ...histogram];
  const maxV = Math.max(...allVals.map(Math.abs)) || 1;
  const midY = padding.top + chartH / 2;
  const yScale = (v: number) => midY - (v / maxV) * (chartH / 2);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Zero line */}
      <line x1={padding.left} y1={midY} x2={width - padding.right} y2={midY} stroke="currentColor" strokeWidth="0.3" className="text-muted-foreground/30" />

      {/* Histogram bars */}
      {histogram.map((v, i) => {
        const h = Math.abs(v / maxV) * (chartH / 2);
        return <rect key={i} x={padding.left + i * gap} y={v >= 0 ? midY - h : midY} width={barW} height={Math.max(h, 1)} fill={v >= 0 ? '#22C55E' : '#EF4444'} opacity="0.4" rx="0.5" />;
      })}

      {/* MACD line */}
      <polyline points={macd.map((v, i) => `${padding.left + i * gap},${yScale(v)}`).join(' ')} fill="none" stroke="#3B82F6" strokeWidth="1.2" />

      {/* Signal line */}
      <polyline points={signal.map((v, i) => `${padding.left + i * gap},${yScale(v)}`).join(' ')} fill="none" stroke="#EF4444" strokeWidth="1.2" strokeDasharray="2 1" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Page                                                    */
/* ═══════════════════════════════════════════════════════════════ */

export default function TechnicalAnalysisPage() {
  const { goldPrice, addToast } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>('1M');
  const [showBollinger, setShowBollinger] = useState(true);
  const [showMA20, setShowMA20] = useState(true);
  const [showMA50, setShowMA50] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');

  const basePrice = goldPrice?.buyPrice ?? 35_200_000;

  const { candles, ema20, rsiValues, bollingerBands, macdData, sma200 } = useMemo(() => {
    const pConfig = PERIODS.find(p => p.key === period) || PERIODS[2];
    const cData = generateCandleData(pConfig.count, basePrice, pConfig.vol);
    const closes = cData.map(d => d.close);

    const ema20 = calculateEMA(closes, 20);
    const sma200 = closes.map((_, i) => {
      if (i < 49) return closes[i];
      const slice = closes.slice(i - 49, i + 1);
      return slice.reduce((s, v) => s + v, 0) / 50;
    });
    const rsi = calculateRSI(closes);
    const bb = calculateBollinger(closes);
    const macd = calculateMACD(closes);

    return { candles: cData, ema20, rsiValues: rsi, bollingerBands: bb, macdData: macd, sma200 };
  }, [period, basePrice]);

  // Analysis summary
  const analysis = useMemo(() => {
    const currentRSI = rsiValues[rsiValues.length - 1];
    const lastMacd = macdData.histogram[macdData.histogram.length - 1];
    const lastCandle = candles[candles.length - 1];
    const firstCandle = candles[0];
    const priceChange = ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100;
    const ema20Val = ema20[ema20.length - 1];

    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let trendLabel: string = 'خنثی';
    let trendIcon = <MinusCircle className="size-5 text-gray-400" />;

    const bullishSignals = [];
    const bearishSignals = [];

    if (lastCandle.close > ema20Val) bullishSignals.push('قیمت بالاتر از EMA ۲۰');
    else bearishSignals.push('قیمت زیر EMA ۲۰');

    if (currentRSI < 30) bullishSignals.push('RSI اشباع فروش');
    else if (currentRSI > 70) bearishSignals.push('RSI اشباع خرید');

    if (lastMacd > 0) bullishSignals.push('MACD مثبت');
    else bearishSignals.push('MACD منفی');

    if (lastCandle.close > bollingerBands.middle[bollingerBands.middle.length - 1]) bullishSignals.push('بالای باند میانی بولینگر');
    else bearishSignals.push('زیر باند میانی بولینگر');

    if (priceChange > 0) bullishSignals.push(`روند صعودی (${priceChange.toFixed(1)}%)`);
    else if (priceChange < 0) bearishSignals.push(`روند نزولی (${Math.abs(priceChange).toFixed(1)}%)`);

    if (bullishSignals.length > bearishSignals.length + 1) {
      trend = 'bullish'; trendLabel = 'صعودی'; trendIcon = <ArrowUpCircle className="size-5 text-emerald-500" />;
    } else if (bearishSignals.length > bullishSignals.length + 1) {
      trend = 'bearish'; trendLabel = 'نزولی'; trendIcon = <ArrowDownCircle className="size-5 text-red-500" />;
    }

    return { trend, trendLabel, trendIcon, priceChange, currentRSI, lastMacd, bullishSignals, bearishSignals };
  }, [candles, ema20, rsiValues, macdData, bollingerBands]);

  useEffect(() => { setTimeout(() => setLoading(false), 500); }, []);

  if (loading) {
    return <div className="space-y-4 p-4">{[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#D4AF37]/10">
          <BarChart3 className="size-5 text-[#D4AF37]" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold">تحلیل تکنیکال حرفه‌ای</h1>
          <p className="text-xs text-muted-foreground">شاخص‌های فنی و تحلیل روند طلای ۱۸ عیار</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => addToast('داده‌ها به‌روزرسانی شد', 'success')} className="text-xs text-muted-foreground">
          <RefreshCw className="size-3.5" />
        </Button>
      </div>

      {/* Current Price & Trend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-card border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">قیمت فعلی</p>
            <p className="text-sm font-black tabular-nums">{formatToman(candles[candles.length - 1].close)}</p>
            <p className="text-[9px] text-muted-foreground">تومان/گرم</p>
          </CardContent>
        </Card>
        <Card className={cn('bg-card border-border/50', analysis.priceChange >= 0 ? 'border-emerald-500/20' : 'border-red-500/20')}>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">تغییر دوره</p>
            <p className={cn('text-sm font-black tabular-nums', analysis.priceChange >= 0 ? 'text-emerald-500' : 'text-red-500')}>
              {analysis.priceChange >= 0 ? '+' : ''}{analysis.priceChange.toFixed(2)}%
            </p>
            <p className="text-[9px] text-muted-foreground">{PERIODS.find(p => p.key === period)?.label}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-3 text-center">
            {analysis.trendIcon}
            <p className="text-sm font-bold mt-1">{analysis.trendLabel}</p>
            <p className="text-[9px] text-muted-foreground">روند غالب</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Period Selector */}
      <div className="flex gap-1.5">
        {PERIODS.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)} className={cn(
            'flex-1 py-2 rounded-lg text-[11px] font-medium transition-all',
            period === p.key ? 'bg-[#D4AF37] text-[#1a1a1a]' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Indicator Toggles */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { key: 'bb', label: 'باندهای بولینگر', state: showBollinger, toggle: () => setShowBollinger(!showBollinger), color: 'bg-[#D4AF37]' },
          { key: 'ema20', label: 'EMA ۲۰', state: showMA20, toggle: () => setShowMA20(!showMA20), color: 'bg-blue-500' },
          { key: 'sma200', label: 'SMA ۲۰۰', state: showMA50, toggle: () => setShowMA50(!showMA50), color: 'bg-red-500' },
        ]).map(ind => (
          <button key={ind.key} onClick={ind.toggle} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] transition-all', ind.state ? 'border-border bg-card' : 'border-border/50 bg-muted/30 text-muted-foreground')}>
            <div className={cn('size-2 rounded-full', ind.state ? ind.color : 'bg-muted')} />
            {ind.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-muted/50 h-10">
          <TabsTrigger value="chart" className="flex-1 text-xs"><LineChart className="size-3.5 me-1" /> نمودار</TabsTrigger>
          <TabsTrigger value="indicators" className="flex-1 text-xs"><Gauge className="size-3.5 me-1" /> شاخص‌ها</TabsTrigger>
          <TabsTrigger value="analysis" className="flex-1 text-xs"><Target className="size-3.5 me-1" /> تحلیل</TabsTrigger>
        </TabsList>

        {/* Chart Tab */}
        <TabsContent value="chart" className="mt-3 space-y-2">
          {/* Candlestick */}
          <Card className="bg-card border-border/50 overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">نمودار شمعی</span>
                <div className="flex gap-3">
                  {showBollinger && <Badge variant="outline" className="text-[8px] border-[#D4AF37]/30 text-[#D4AF37]">بولینگر</Badge>}
                  {showMA20 && <Badge variant="outline" className="text-[8px] border-blue-500/30 text-blue-400">EMA 20</Badge>}
                  {showMA50 && <Badge variant="outline" className="text-[8px] border-red-500/30 text-red-400">SMA 200</Badge>}
                </div>
              </div>
              <CandlestickChartSVG data={candles} showBollinger={showBollinger} showMA20={showMA20} showMA50={showMA50} bollinger={bollingerBands} ema20={ema20} sma200={sma200} />
            </CardContent>
          </Card>

          {/* Volume */}
          <Card className="bg-card border-border/50 overflow-hidden">
            <CardContent className="p-3">
              <span className="text-xs font-bold mb-2 block">حجم معاملات</span>
              <VolumeBarsSVG data={candles} />
            </CardContent>
          </Card>

          {/* RSI */}
          <Card className="bg-card border-border/50 overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">RSI (۱۴)</span>
                <Badge className={cn('text-[9px]', analysis.currentRSI > 70 ? 'bg-red-500/10 text-red-500 border-red-500/20' : analysis.currentRSI < 30 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20')}>
                  {analysis.currentRSI.toFixed(1)}
                </Badge>
              </div>
              <RSIChartSVG rsi={rsiValues} />
            </CardContent>
          </Card>

          {/* MACD */}
          <Card className="bg-card border-border/50 overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">MACD</span>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[8px] border-blue-500/30 text-blue-400">MACD</Badge>
                  <Badge variant="outline" className="text-[8px] border-red-500/30 text-red-400">Signal</Badge>
                </div>
              </div>
              <MACDChartSVG macd={macdData.macd} signal={macdData.signal} histogram={macdData.histogram} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Indicators Tab */}
        <TabsContent value="indicators" className="mt-3">
          <div className="space-y-3">
            {/* RSI Card */}
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><Activity className="size-4 text-purple-400" /><span className="text-sm font-bold">RSI (شاخص قدرت نسبی)</span></div>
                  <span className={cn('text-lg font-black tabular-nums', analysis.currentRSI > 70 ? 'text-red-500' : analysis.currentRSI < 30 ? 'text-emerald-500' : 'text-purple-400')}>{analysis.currentRSI.toFixed(1)}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${analysis.currentRSI}%`, backgroundColor: analysis.currentRSI > 70 ? '#EF4444' : analysis.currentRSI < 30 ? '#22C55E' : '#A855F7' }} />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>اشباع فروش (۳۰)</span>
                  <span>خنثی (۵۰)</span>
                  <span>اشباع خرید (۷۰)</span>
                </div>
              </CardContent>
            </Card>

            {/* MACD Card */}
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3"><Layers className="size-4 text-blue-400" /><span className="text-sm font-bold">MACD</span></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <p className="text-[9px] text-muted-foreground">MACD</p>
                    <p className={cn('text-sm font-bold tabular-nums', macdData.macd[macdData.macd.length - 1] >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                      {macdData.macd[macdData.macd.length - 1].toFixed(0)}
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <p className="text-[9px] text-muted-foreground">Signal</p>
                    <p className="text-sm font-bold tabular-nums">{macdData.signal[macdData.signal.length - 1].toFixed(0)}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <p className="text-[9px] text-muted-foreground">Histogram</p>
                    <p className={cn('text-sm font-bold tabular-nums', macdData.histogram[macdData.histogram.length - 1] >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                      {macdData.histogram[macdData.histogram.length - 1] >= 0 ? '+' : ''}{macdData.histogram[macdData.histogram.length - 1].toFixed(0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Moving Averages */}
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3"><LineChart className="size-4 text-[#D4AF37]" /><span className="text-sm font-bold">میانگین‌های متحرک</span></div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-blue-500 rounded" />
                      <span className="text-xs">EMA ۲۰</span>
                    </div>
                    <span className="text-xs font-bold tabular-nums">{formatToman(Math.round(ema20[ema20.length - 1]))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-red-500 rounded" style={{ borderStyle: 'dashed' }} />
                      <span className="text-xs">SMA ۲۰۰</span>
                    </div>
                    <span className="text-xs font-bold tabular-nums">{formatToman(Math.round(sma200[sma200.length - 1]))}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">قیمت فعلی</span>
                    <span className="text-xs font-bold tabular-nums">{formatToman(Math.round(candles[candles.length - 1].close))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bollinger Bands */}
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3"><Zap className="size-4 text-[#D4AF37]" /><span className="text-sm font-bold">باندهای بولینگر</span></div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">باند بالایی</span>
                    <span className="text-xs font-bold tabular-nums">{formatToman(Math.round(bollingerBands.upper[bollingerBands.upper.length - 1]))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">باند میانی (SMA 20)</span>
                    <span className="text-xs font-bold tabular-nums">{formatToman(Math.round(bollingerBands.middle[bollingerBands.middle.length - 1]))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">باند پایینی</span>
                    <span className="text-xs font-bold tabular-nums">{formatToman(Math.round(bollingerBands.lower[bollingerBands.lower.length - 1]))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="mt-3">
          <div className="space-y-3">
            {/* Trend Summary */}
            <Card className={cn('border', analysis.trend === 'bullish' ? 'border-emerald-500/20 bg-emerald-500/[0.03]' : analysis.trend === 'bearish' ? 'border-red-500/20 bg-red-500/[0.03]' : 'border-border')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {analysis.trendIcon}
                  <div>
                    <p className="text-sm font-bold">خلاصه تحلیل</p>
                    <p className="text-xs text-muted-foreground">بر اساس ترکیب شاخص‌های فنی</p>
                  </div>
                </div>
                <div className={cn('text-xl font-black', analysis.trend === 'bullish' ? 'text-emerald-500' : analysis.trend === 'bearish' ? 'text-red-500' : 'text-gray-400')}>
                  {analysis.trendLabel}
                </div>
              </CardContent>
            </Card>

            {/* Bullish Signals */}
            {analysis.bullishSignals.length > 0 && (
              <Card className="bg-card border-emerald-500/15">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3"><ArrowUpCircle className="size-4 text-emerald-500" /><span className="text-sm font-bold text-emerald-500">سیگنال‌های صعودی</span></div>
                  <div className="space-y-2">
                    {analysis.bullishSignals.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {s}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bearish Signals */}
            {analysis.bearishSignals.length > 0 && (
              <Card className="bg-card border-red-500/15">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3"><ArrowDownCircle className="size-4 text-red-500" /><span className="text-sm font-bold text-red-500">سیگنال‌های نزولی</span></div>
                  <div className="space-y-2">
                    {analysis.bearishSignals.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {s}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Disclaimer */}
            <Card className="border-amber-500/15 bg-amber-500/[0.02]">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    تحلیل تکنیکال صرفاً جنبه آموزشی و اطلاع‌رسانی دارد و توصیه سرمایه‌گذاری نیست. تصمیم‌گیری بر اساس این داده‌ها با ریسک همراه است.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

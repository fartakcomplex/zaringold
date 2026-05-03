
/* ═══════════════════════════════════════════════════════════════════════════ */
/*  AdvancedGoldChart — TradingView-Level Gold Candlestick Chart             */
/*  Built with lightweight-charts v5 for Zarrin Gold (Mili Gold)              */
/* ═══════════════════════════════════════════════════════════════════════════ */

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {createChart, ColorType, CrosshairMode, type IChartApi, type ISeriesApi, type CandlestickData, type LineData, type HistogramData, type Time, type DeepPartial, type ChartOptions, CandlestickSeries, LineSeries, HistogramSeries} from 'lightweight-charts';
import {motion, AnimatePresence} from 'framer-motion';
import {TrendingUp, TrendingDown, ChevronDown, ChevronUp, Maximize2, Minimize2, Activity, BarChart3, Layers, GitCompareArrows, Loader2, X, Info} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {Switch} from '@/components/ui/switch';
import {Separator} from '@/components/ui/separator';
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel} from '@/components/ui/dropdown-menu';
import {useAppStore} from '@/lib/store';
import {useTranslation} from '@/lib/i18n';
import {useQuickAction} from '@/hooks/useQuickAction';
import {formatNumber, formatToman, cn} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1D' | '1W';

interface OHLCVCandle {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IndicatorConfig {
  rsi: boolean;
  macd: boolean;
  ema: boolean;
  bollinger: boolean;
}

interface ComparisonConfig {
  enabled: boolean;
  usd: boolean;
  btc: boolean;
}

interface LegendData {
  o: number;
  h: number;
  l: number;
  c: number;
  volume: number;
  change: number;
  changePercent: number;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const GOLD_COLOR = '#D4AF37';
const GOLD_COLOR_LIGHT = 'rgba(212, 175, 55, 0.6)';
const BULL_COLOR = '#22c55e';
const BEAR_COLOR = '#ef4444';
const GRID_COLOR_DARK = 'rgba(255, 255, 255, 0.06)';
const GRID_COLOR_LIGHT = 'rgba(0, 0, 0, 0.06)';
const TEXT_COLOR_DARK = '#8B8B8B';
const TEXT_COLOR_LIGHT = '#6B7280';

const TIMEFRAMES: { value: Timeframe; label: string; labelEn: string }[] = [
  { value: '1m', label: '۱ دقیقه', labelEn: '1m' },
  { value: '5m', label: '۵ دقیقه', labelEn: '5m' },
  { value: '15m', label: '۱۵ دقیقه', labelEn: '15m' },
  { value: '1h', label: '۱ ساعته', labelEn: '1H' },
  { value: '4h', label: '۴ ساعته', labelEn: '4H' },
  { value: '1D', label: 'روزانه', labelEn: '1D' },
  { value: '1W', label: 'هفتگی', labelEn: '1W' },
];

const TIMEFRAME_MS: Record<Timeframe, number> = {
  '1m': 60_000,
  '5m': 300_000,
  '15m': 900_000,
  '1h': 3_600_000,
  '4h': 14_400_000,
  '1D': 86_400_000,
  '1W': 604_800_000,
};

const GOLD_BASE_PRICE = 3_750_000; // Toman per gram (realistic Iranian gold price)

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Technical Indicator Calculations                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

/** Calculate Exponential Moving Average (EMA) */
function calcEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(data.length).fill(null);
  if (data.length < period) return result;

  const multiplier = 2 / (period + 1);

  // Start with SMA for the first value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  result[period - 1] = sum / period;

  for (let i = period; i < data.length; i++) {
    const prev = result[i - 1];
    if (prev !== null && prev !== undefined) {
      result[i] = (data[i] - prev) * multiplier + prev;
    }
  }

  return result;
}

/** Calculate RSI (Relative Strength Index) */
function calcRSI(closes: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return result;

  let gainSum = 0;
  let lossSum = 0;

  // Initial SMA-based values
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gainSum += change;
    else lossSum += Math.abs(change);
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = 100 - 100 / (1 + rs);
    }
  }

  return result;
}

/** Calculate MACD (Moving Average Convergence Divergence) */
function calcMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9,
): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const macdLine: (number | null)[] = new Array(closes.length).fill(null);
  const signalLine: (number | null)[] = new Array(closes.length).fill(null);
  const histogramLine: (number | null)[] = new Array(closes.length).fill(null);

  const fastEMA = calcEMA(closes, fastPeriod);
  const slowEMA = calcEMA(closes, slowPeriod);

  // Calculate MACD line = fast EMA - slow EMA
  const macdValues: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      const val = fastEMA[i]! - slowEMA[i]!;
      macdLine[i] = val;
      macdValues.push(val);
    } else {
      macdValues.push(0);
    }
  }

  // Calculate signal line = EMA of MACD line
  const validMacdStart = macdValues.findIndex((_, idx) => macdLine[idx] !== null);
  if (validMacdStart === -1) return { macd: macdLine, signal: signalLine, histogram: histogramLine };

  const macdForSignal = macdLine.slice(validMacdStart).map((v) => v ?? 0);
  const signalEMA = calcEMA(macdForSignal, signalPeriod);

  // Merge signal back
  for (let i = 0; i < signalEMA.length; i++) {
    signalLine[validMacdStart + i] = signalEMA[i];
  }

  // Calculate histogram = MACD - signal
  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] !== null && signalLine[i] !== null) {
      histogramLine[i] = macdLine[i]! - signalLine[i]!;
    }
  }

  return { macd: macdLine, signal: signalLine, histogram: histogramLine };
}

/** Calculate Bollinger Bands */
function calcBollinger(
  closes: number[],
  period: number = 20,
  stdDev: number = 2,
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const upper: (number | null)[] = new Array(closes.length).fill(null);
  const middle: (number | null)[] = new Array(closes.length).fill(null);
  const lower: (number | null)[] = new Array(closes.length).fill(null);

  if (closes.length < period) return { upper, middle, lower };

  for (let i = period - 1; i < closes.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += closes[j];
    }
    const sma = sum / period;
    middle[i] = sma;

    let varianceSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      varianceSum += (closes[j] - sma) ** 2;
    }
    const std = Math.sqrt(varianceSum / period);
    upper[i] = sma + stdDev * std;
    lower[i] = sma - stdDev * std;
  }

  return { upper, middle, lower };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Data Generator                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function generateMockOHLCV(count: number, timeframe: Timeframe): OHLCVCandle[] {
  const candles: OHLCVCandle[] = [];
  const intervalMs = TIMEFRAME_MS[timeframe];

  // Use deterministic seed for consistent data per timeframe
  const seedMap: Record<Timeframe, number> = {
    '1m': 100, '5m': 200, '15m': 300, '1h': 400, '4h': 500, '1D': 600, '1W': 700,
  };
  let seed = seedMap[timeframe];
  const pseudoRandom = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return seed / 2147483647;
  };

  let currentPrice = GOLD_BASE_PRICE;
  const now = Math.floor(Date.now() / 1000);
  const intervalSec = Math.floor(intervalMs / 1000);

  for (let i = 0; i < count; i++) {
    const time = (now - (count - i) * intervalSec) as Time;

    // Sine wave + random walk for realistic movement
    const trend = Math.sin(i / (count * 0.15)) * GOLD_BASE_PRICE * 0.04;
    const noise = (pseudoRandom() - 0.5) * GOLD_BASE_PRICE * 0.015;
    const momentum = (pseudoRandom() - 0.48) * GOLD_BASE_PRICE * 0.005;

    const open = currentPrice;
    const direction = pseudoRandom() > 0.47 ? 1 : -1;
    const bodySize = Math.abs(noise) + Math.abs(momentum);
    const close = open + direction * bodySize;
    const high = Math.max(open, close) + pseudoRandom() * GOLD_BASE_PRICE * 0.008;
    const low = Math.min(open, close) - pseudoRandom() * GOLD_BASE_PRICE * 0.008;

    // Volume correlates with price movement
    const volumeBase = 50 + pseudoRandom() * 200;
    const volumeSpike = Math.abs(close - open) / GOLD_BASE_PRICE * 500;
    const volume = Math.round(volumeBase + volumeSpike);

    candles.push({
      time,
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
      volume,
    });

    currentPrice = close + trend * 0.001;
    // Clamp price to realistic range
    currentPrice = Math.max(3_000_000, Math.min(4_500_000, currentPrice));
  }

  return candles;
}

/** Generate mock comparison data (normalized percentage change) */
function generateComparisonData(
  goldData: OHLCVCandle[],
  asset: 'usd' | 'btc',
): { time: Time; value: number }[] {
  const basePrices = {
    usd: 60000, // USD/IRR approximation (simplified)
    btc: 65000, // BTC/USD approximation
  };
  const volatilities = { usd: 0.003, btc: 0.025 };

  let seed = asset === 'usd' ? 999 : 888;
  const pseudoRandom = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return seed / 2147483647;
  };

  let price = basePrices[asset];
  const basePrice = price;
  const vol = volatilities[asset];

  return goldData.map((candle) => {
    const change = (pseudoRandom() - 0.48) * vol;
    price *= 1 + change;
    // Normalize to percentage change from first candle
    const pctChange = ((price - basePrice) / basePrice) * 100;
    return { time: candle.time, value: parseFloat(pctChange.toFixed(4)) };
  });
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ChartSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>
      {/* Legend skeleton */}
      <div className="flex items-center gap-4 px-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
      {/* Chart skeleton */}
      <div className="mx-4 flex h-[400px] items-end gap-[2px] rounded-lg bg-muted/30 p-4">
        {Array.from({ length: 40 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-sm"
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface AdvancedGoldChartProps {
  /** Override the default chart height in px */
  height?: number;
  /** If true, show the chart in compact mode (no header, smaller controls) */
  compact?: boolean;
  /** Initial timeframe */
  defaultTimeframe?: Timeframe;
}

export default function AdvancedGoldChart({
  height = 480,
  compact = false,
  defaultTimeframe = '1h',
}: AdvancedGoldChartProps) {
  const { t, locale } = useTranslation();
  const { goldPrice } = useAppStore();
  const isRTL = locale === 'fa';

  /* ── Refs ── */
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
   
  const candleSeriesRef = useRef<any>(null);
   
  const volumeSeriesRef = useRef<any>(null);
   
  const ema9SeriesRef = useRef<any>(null);
   
  const ema21SeriesRef = useRef<any>(null);
   
  const ema50SeriesRef = useRef<any>(null);
   
  const bollingerUpperRef = useRef<any>(null);
   
  const bollingerMiddleRef = useRef<any>(null);
   
  const bollingerLowerRef = useRef<any>(null);
   
  const priceLineRef = useRef<any>(null);
  const rsiPaneRef = useRef<HTMLDivElement>(null);
  const macdPaneRef = useRef<HTMLDivElement>(null);

  // RSI sub-chart
  const rsiChartRef = useRef<IChartApi | null>(null);
   
  const rsiSeriesRef = useRef<any>(null);

  // MACD sub-chart
  const macdChartRef = useRef<IChartApi | null>(null);
   
  const macdLineSeriesRef = useRef<any>(null);
   
  const macdSignalSeriesRef = useRef<any>(null);
   
  const macdHistSeriesRef = useRef<any>(null);

  // Comparison sub-chart
  const compChartRef = useRef<IChartApi | null>(null);
   
  const compGoldSeriesRef = useRef<any>(null);
   
  const compUsdSeriesRef = useRef<any>(null);
   
  const compBtcSeriesRef = useRef<any>(null);

  /* ── State ── */
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>(defaultTimeframe);
  const [indicators, setIndicators] = useState<IndicatorConfig>({
    rsi: false,
    macd: false,
    ema: false,
    bollinger: false,
  });
  const [comparison, setComparison] = useState<ComparisonConfig>({
    enabled: false,
    usd: true,
    btc: true,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [legendData, setLegendData] = useState<LegendData | null>(null);
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived: number of candles to generate based on timeframe
  const candleCount = useMemo(() => {
    const map: Record<Timeframe, number> = {
      '1m': 500,
      '5m': 500,
      '15m': 400,
      '1h': 400,
      '4h': 300,
      '1D': 300,
      '1W': 200,
    };
    return map[timeframe];
  }, [timeframe]);

  /* ── Data ── */
  const [candles, setCandles] = useState<OHLCVCandle[]>([]);

  /* ── Fetch or generate data ── */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try API first
      try {
        const res = await fetch(
          `/api/chart/data?timeframe=${timeframe}&limit=${candleCount}`,
        );
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            const mapped: OHLCVCandle[] = json.data.map(
              (d: Record<string, number | string>) => ({
                time: d.time as Time,
                open: Number(d.open),
                high: Number(d.high),
                low: Number(d.low),
                close: Number(d.close),
                volume: Number(d.volume),
              }),
            );
            setCandles(mapped);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // API failed, fall through to mock data
      }

      // Fallback: generate mock data
      const mockData = generateMockOHLCV(candleCount, timeframe);
      setCandles(mockData);
    } catch (err) {
      setError('خطا در بارگذاری داده‌ها');
    } finally {
      setIsLoading(false);
    }
  }, [timeframe, candleCount]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Compute legend ── */
  useEffect(() => {
    if (candles.length < 2) return;
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    const change = last.close - prev.close;
    const changePercent = (change / prev.close) * 100;

    setLegendData({
      o: last.open,
      h: last.high,
      l: last.low,
      c: last.close,
      volume: last.volume,
      change,
      changePercent,
    });
  }, [candles]);

  /* ── Computed indicators from candle data ── */
  const indicatorData = useMemo(() => {
    if (candles.length < 2) return null;
    const closes = candles.map((c) => c.close);
    const times = candles.map((c) => c.time);

    const ema9 = calcEMA(closes, 9);
    const ema21 = calcEMA(closes, 21);
    const ema50 = calcEMA(closes, 50);
    const rsi = calcRSI(closes, 14);
    const macd = calcMACD(closes, 12, 26, 9);
    const bollinger = calcBollinger(closes, 20, 2);

    return {
      ema9: ema9.map((v, i) =>
        v !== null ? { time: times[i], value: v } : null,
      ) as LineData[],
      ema21: ema21.map((v, i) =>
        v !== null ? { time: times[i], value: v } : null,
      ) as LineData[],
      ema50: ema50.map((v, i) =>
        v !== null ? { time: times[i], value: v } : null,
      ) as LineData[],
      rsi: rsi.map((v, i) =>
        v !== null ? { time: times[i], value: v } : null,
      ) as LineData[],
      macdLine: macd.macd.map((v, i) =>
        v !== null ? { time: times[i], value: v } : null,
      ) as LineData[],
      macdSignal: macd.signal.map((v, i) =>
        v !== null ? { time: times[i], value: v } : null,
      ) as LineData[],
      macdHistogram: macd.histogram.map((v, i) =>
        v !== null
          ? { time: times[i], value: v, color: v >= 0 ? BULL_COLOR : BEAR_COLOR }
          : null,
      ) as HistogramData[],
      bollingerUpper: bollinger.upper.map((v, i) =>
        v !== null ? { time: times[i], value: v } : null,
      ) as LineData[],
      bollingerMiddle: bollinger.middle.map((v, i) =>
        v !== null ? { time: times[i], value: v } : null,
      ) as LineData[],
      bollingerLower: bollinger.lower.map((v, i) =>
        v !== null ? { time: times[i], value: v } : null,
      ) as LineData[],
    };
  }, [candles]);

  /* ── Comparison data ── */
  const comparisonData = useMemo(() => {
    if (!comparison.enabled || candles.length < 2) return null;
    const goldBase = candles[0].close;
    const goldPct = candles.map((c) => ({
      time: c.time,
      value: parseFloat((((c.close - goldBase) / goldBase) * 100).toFixed(4)),
    }));

    const usdData = comparison.usd
      ? generateComparisonData(candles, 'usd')
      : null;
    const btcData = comparison.btc
      ? generateComparisonData(candles, 'btc')
      : null;

    return { goldPct, usdData, btcData };
  }, [candles, comparison]);

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  Chart Theme Helper                                                      */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const getChartColors = useCallback(() => {
    // Charts always use dark theme (TradingView style)
    return {
      background: 'transparent',
      gridColor: GRID_COLOR_DARK,
      textColor: TEXT_COLOR_DARK,
      borderColor: 'rgba(255,255,255,0.08)',
    };
  }, []);

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  Create / Update Main Chart                                             */
  /* ═══════════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    if (!chartContainerRef.current || candles.length === 0) return;

    const colors = getChartColors();

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    // Clear all sub-series refs
    candleSeriesRef.current = null;
    volumeSeriesRef.current = null;
    ema9SeriesRef.current = null;
    ema21SeriesRef.current = null;
    ema50SeriesRef.current = null;
    bollingerUpperRef.current = null;
    bollingerMiddleRef.current = null;
    bollingerLowerRef.current = null;
    priceLineRef.current = null;

    // Calculate dynamic height based on indicators
    const extraPaneHeight = (indicators.rsi ? 120 : 0) + (indicators.macd ? 120 : 0);
    const compHeight = comparison.enabled ? 150 : 0;
    const totalHeight = height + extraPaneHeight + compHeight;

    const chartOptions: DeepPartial<ChartOptions> = {
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.textColor,
        fontSize: 11,
      },
      grid: {
        vertLines: { color: colors.gridColor },
        horzLines: { color: colors.gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(212, 175, 55, 0.4)',
          width: 1,
          style: 2, // DashedLine
          labelBackgroundColor: '#1e1e2d',
        },
        horzLine: {
          color: 'rgba(212, 175, 55, 0.4)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#1e1e2d',
        },
      },
      rightPriceScale: {
        borderColor: colors.borderColor,
        scaleMargins: {
          top: 0.05,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: colors.borderColor,
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 8,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    };

    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height: totalHeight,
    });

    chartRef.current = chart;

    /* ── Candlestick Series ── */
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: BULL_COLOR,
      downColor: BEAR_COLOR,
      borderUpColor: BULL_COLOR,
      borderDownColor: BEAR_COLOR,
      wickUpColor: BULL_COLOR,
      wickDownColor: BEAR_COLOR,
    });
    candleSeries.setData(candles as CandlestickData[]);
    candleSeriesRef.current = candleSeries;

    /* ── Volume Series ── */
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    const volumeData: HistogramData[] = candles.map((c) => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open
        ? 'rgba(34, 197, 94, 0.25)'
        : 'rgba(239, 68, 68, 0.25)',
    }));
    volumeSeries.setData(volumeData);
    volumeSeriesRef.current = volumeSeries;

    /* ── Current Price Line ── */
    const lastCandle = candles[candles.length - 1];
    if (lastCandle) {
      const priceLine = candleSeries.createPriceLine({
        price: lastCandle.close,
        color: GOLD_COLOR,
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: '',
      });
      priceLineRef.current = priceLine;
    }

    /* ── EMA Lines (if enabled) ── */
    if (indicators.ema && indicatorData) {
      // EMA 9 - Gold
      const ema9Filtered = indicatorData.ema9.filter(Boolean) as LineData[];
      if (ema9Filtered.length > 0) {
        const s9 = chart.addSeries(LineSeries, {
          color: '#FFD700',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        s9.setData(ema9Filtered);
        ema9SeriesRef.current = s9;
      }

      // EMA 21 - Cyan
      const ema21Filtered = indicatorData.ema21.filter(Boolean) as LineData[];
      if (ema21Filtered.length > 0) {
        const s21 = chart.addSeries(LineSeries, {
          color: '#06b6d4',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        s21.setData(ema21Filtered);
        ema21SeriesRef.current = s21;
      }

      // EMA 50 - Magenta
      const ema50Filtered = indicatorData.ema50.filter(Boolean) as LineData[];
      if (ema50Filtered.length > 0) {
        const s50 = chart.addSeries(LineSeries, {
          color: '#d946ef',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        s50.setData(ema50Filtered);
        ema50SeriesRef.current = s50;
      }
    }

    /* ── Bollinger Bands (if enabled) ── */
    if (indicators.bollinger && indicatorData) {
      const upperFiltered = indicatorData.bollingerUpper.filter(Boolean) as LineData[];
      const middleFiltered = indicatorData.bollingerMiddle.filter(Boolean) as LineData[];
      const lowerFiltered = indicatorData.bollingerLower.filter(Boolean) as LineData[];

      if (upperFiltered.length > 0) {
        const sUpper = chart.addSeries(LineSeries, {
          color: 'rgba(168, 162, 255, 0.6)',
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        sUpper.setData(upperFiltered);
        bollingerUpperRef.current = sUpper;
      }

      if (middleFiltered.length > 0) {
        const sMiddle = chart.addSeries(LineSeries, {
          color: 'rgba(168, 162, 255, 0.4)',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        sMiddle.setData(middleFiltered);
        bollingerMiddleRef.current = sMiddle;
      }

      if (lowerFiltered.length > 0) {
        const sLower = chart.addSeries(LineSeries, {
          color: 'rgba(168, 162, 255, 0.6)',
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        sLower.setData(lowerFiltered);
        bollingerLowerRef.current = sLower;
      }
    }

    /* ── RSI Sub-Chart ── */
    if (rsiPaneRef.current && indicators.rsi && indicatorData) {
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
      }

      const rsiChart = createChart(rsiPaneRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: TEXT_COLOR_DARK,
          fontSize: 10,
        },
        grid: {
          vertLines: { color: colors.gridColor },
          horzLines: { color: colors.gridColor },
        },
        rightPriceScale: {
          borderColor: colors.borderColor,
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: { visible: false },
        crosshair: {
          mode: CrosshairMode.Normal,
          horzLine: { visible: false },
          vertLine: { color: 'rgba(212,175,55,0.2)', labelBackgroundColor: '#1e1e2d' },
        },
        handleScroll: false,
        handleScale: false,
        width: rsiPaneRef.current.clientWidth,
        height: 120,
      });

      const rsiFiltered = indicatorData.rsi.filter(Boolean) as LineData[];
      if (rsiFiltered.length > 0) {
        const rsiSeries = rsiChart.addSeries(LineSeries, {
          color: '#a78bfa',
          lineWidth: 2 as const,
          priceLineVisible: false,
          lastValueVisible: true,
          crosshairMarkerVisible: false,
        });
        rsiSeries.setData(rsiFiltered);
        rsiSeriesRef.current = rsiSeries;

        // RSI overbought/oversold reference lines
        rsiSeries.createPriceLine({
          price: 70,
          color: 'rgba(239, 68, 68, 0.5)',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'OB',
        });
        rsiSeries.createPriceLine({
          price: 30,
          color: 'rgba(34, 197, 94, 0.5)',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'OS',
        });
      }

      rsiChartRef.current = rsiChart;
    } else if (rsiChartRef.current && !indicators.rsi) {
      rsiChartRef.current.remove();
      rsiChartRef.current = null;
    }

    /* ── MACD Sub-Chart ── */
    if (macdPaneRef.current && indicators.macd && indicatorData) {
      if (macdChartRef.current) {
        macdChartRef.current.remove();
        macdChartRef.current = null;
      }

      const macdChart = createChart(macdPaneRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: TEXT_COLOR_DARK,
          fontSize: 10,
        },
        grid: {
          vertLines: { color: colors.gridColor },
          horzLines: { color: colors.gridColor },
        },
        rightPriceScale: {
          borderColor: colors.borderColor,
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: { visible: false },
        crosshair: {
          mode: CrosshairMode.Normal,
          horzLine: { visible: false },
          vertLine: { color: 'rgba(212,175,55,0.2)', labelBackgroundColor: '#1e1e2d' },
        },
        handleScroll: false,
        handleScale: false,
        width: macdPaneRef.current.clientWidth,
        height: 120,
      });

      // MACD Histogram
      const histFiltered = indicatorData.macdHistogram.filter(Boolean) as HistogramData[];
      if (histFiltered.length > 0) {
        const histSeries = macdChart.addSeries(HistogramSeries, {
          priceLineVisible: false,
          lastValueVisible: false,
        });
        histSeries.setData(histFiltered);
        macdHistSeriesRef.current = histSeries;
      }

      // MACD Line
      const macdFiltered = indicatorData.macdLine.filter(Boolean) as LineData[];
      if (macdFiltered.length > 0) {
        const ml = macdChart.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 2 as const,
          priceLineVisible: false,
          lastValueVisible: true,
          crosshairMarkerVisible: false,
        });
        ml.setData(macdFiltered);
        macdLineSeriesRef.current = ml;
      }

      // Signal Line
      const sigFiltered = indicatorData.macdSignal.filter(Boolean) as LineData[];
      if (sigFiltered.length > 0) {
        const sl = macdChart.addSeries(LineSeries, {
          color: '#f97316',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        sl.setData(sigFiltered);
        macdSignalSeriesRef.current = sl;
      }

      macdChartRef.current = macdChart;
    } else if (macdChartRef.current && !indicators.macd) {
      macdChartRef.current.remove();
      macdChartRef.current = null;
    }

    /* ── Sync sub-chart time ranges with main chart ── */
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range) {
        rsiChartRef.current
          ?.timeScale()
          .setVisibleLogicalRange(range);
        macdChartRef.current
          ?.timeScale()
          .setVisibleLogicalRange(range);
      }
    });

    // Fit content
    chart.timeScale().fitContent();

    /* ── Resize Handler ── */
    const handleResize = () => {
      if (!chartContainerRef.current) return;
      const w = chartContainerRef.current.clientWidth;
      chart.applyOptions({ width: w });
      rsiChartRef.current?.applyOptions({ width: w });
      macdChartRef.current?.applyOptions({ width: w });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      rsiChartRef.current?.remove();
      macdChartRef.current?.remove();
      chartRef.current = null;
      rsiChartRef.current = null;
      macdChartRef.current = null;
    };
  }, [candles, indicators, height, comparison.enabled, getChartColors]);

  /* ── Comparison Chart ── */
  useEffect(() => {
    const compContainer = document.getElementById('comparison-pane');
    if (!compContainer) return;

    if (!comparison.enabled || !comparisonData) {
      if (compChartRef.current) {
        compChartRef.current.remove();
        compChartRef.current = null;
      }
      return;
    }

    if (compChartRef.current) {
      compChartRef.current.remove();
      compChartRef.current = null;
    }

    const colors = getChartColors();

    const compChart = createChart(compContainer, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: TEXT_COLOR_DARK,
        fontSize: 10,
      },
      grid: {
        vertLines: { color: colors.gridColor },
        horzLines: { color: colors.gridColor },
      },
      rightPriceScale: {
        borderColor: colors.borderColor,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: { visible: false },
      crosshair: {
        mode: CrosshairMode.Normal,
        horzLine: { visible: false },
        vertLine: { color: 'rgba(212,175,55,0.2)', labelBackgroundColor: '#1e1e2d' },
      },
      handleScroll: false,
      handleScale: false,
      width: compContainer.clientWidth,
      height: 150,
    });

    // Gold percentage
    const goldPctSeries = compChart.addSeries(LineSeries, {
      color: GOLD_COLOR,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: false,
    });
    goldPctSeries.setData(comparisonData.goldPct);
    compGoldSeriesRef.current = goldPctSeries;

    // USD comparison
    if (comparisonData.usdData) {
      const usdSeries = compChart.addSeries(LineSeries, {
        color: '#22d3ee',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: false,
      });
      usdSeries.setData(comparisonData.usdData);
      compUsdSeriesRef.current = usdSeries;
    }

    // BTC comparison
    if (comparisonData.btcData) {
      const btcSeries = compChart.addSeries(LineSeries, {
        color: '#f97316',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: false,
      });
      btcSeries.setData(comparisonData.btcData);
      compBtcSeriesRef.current = btcSeries;
    }

    // Sync with main chart
    chartRef.current?.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range) {
        compChart.timeScale().setVisibleLogicalRange(range);
      }
    });

    const resizeObs = new ResizeObserver(() => {
      const w = compContainer.clientWidth;
      compChart.applyOptions({ width: w });
    });
    resizeObs.observe(compContainer);

    compChartRef.current = compChart;

    return () => {
      resizeObs.disconnect();
      compChart.remove();
      compChartRef.current = null;
    };
  }, [comparison, comparisonData, getChartColors]);

  /* ── Update current price line when candles update ── */
  useEffect(() => {
    if (
      candleSeriesRef.current &&
      priceLineRef.current &&
      candles.length > 0
    ) {
      const lastPrice = candles[candles.length - 1].close;
      try {
        candleSeriesRef.current.removePriceLine(priceLineRef.current);
      } catch {
        // ignore if already removed
      }
      priceLineRef.current = candleSeriesRef.current.createPriceLine({
        price: lastPrice,
        color: GOLD_COLOR,
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: '',
      });
    }
  }, [candles]);

  /* ── Toggle indicator helpers ── */
  const toggleIndicator = useCallback((key: keyof IndicatorConfig) => {
    setIndicators((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleComparison = useCallback((key: keyof ComparisonConfig) => {
    setComparison((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  /* ── Quick Actions ── */
  useQuickAction('open:ac-timeframe', () => setShowIndicatorMenu(true));
  useQuickAction('open:ac-compare', () => toggleComparison('enabled'));

  /* ── Format number helper (no comma for chart, Persian formatted for UI) ── */
  const fmtPrice = (n: number) => {
    if (locale === 'fa') {
      return new Intl.NumberFormat('fa-IR').format(n);
    }
    return n.toLocaleString();
  };

  const fmtChange = (n: number) => {
    const sign = n >= 0 ? '+' : '';
    if (locale === 'fa') {
      return `${sign}${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(n)}`;
    }
    return `${sign}${n.toFixed(2)}%`;
  };

  /* ── Indicator menu items ── */
  const indicatorMenuItems = [
    {
      key: 'ema' as keyof IndicatorConfig,
      label: isRTL ? 'EMA (۹, ۲۱, ۵۰)' : 'EMA (9, 21, 50)',
      description: isRTL ? 'میانگین متحرک نمایی' : 'Exponential Moving Average',
      color: '#FFD700',
    },
    {
      key: 'rsi' as keyof IndicatorConfig,
      label: 'RSI (14)',
      description: isRTL ? 'شاخص قدرت نسبی' : 'Relative Strength Index',
      color: '#a78bfa',
    },
    {
      key: 'macd' as keyof IndicatorConfig,
      label: 'MACD (12, 26, 9)',
      description: isRTL ? 'واگرایی/همگرایی میانگین متحرک' : 'Moving Avg Convergence Divergence',
      color: '#3b82f6',
    },
    {
      key: 'bollinger' as keyof IndicatorConfig,
      label: isRTL ? 'باندهای بولینگر' : 'Bollinger Bands',
      description: isRTL ? 'باندهای بولینگر (۲۰, ۲)' : 'Bollinger Bands (20, 2)',
      color: 'rgba(168, 162, 255, 0.6)',
    },
  ];

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                 */
  /* ═══════════════════════════════════════════════════════════════════════ */

  if (error) {
    return (
      <Card className="overflow-hidden border-red-500/20">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
            <X className="size-6 text-red-500" />
          </div>
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="gap-1.5"
          >
            {t('common.refresh')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      id="ac-chart"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-border/50',
        'bg-gradient-to-b from-[#0d0e1a] via-[#11122b] to-[#0d0e1a]',
        'dark:shadow-lg dark:shadow-black/20',
        isFullscreen && 'fixed inset-0 z-50 rounded-none border-0',
      )}
      dir="ltr"
    >
      {/* ═══ Header Bar ═══ */}
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-3 py-2 sm:px-4">
          {/* Left: Title + Price */}
          <div className="flex items-center gap-3" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-[#D4AF37]/10">
                <Activity className="size-3.5 text-[#D4AF37]" />
              </div>
              <span className="text-sm font-bold text-white">
                {isRTL ? 'طلا ۱۸ عیار' : 'Gold 18K'}
              </span>
            </div>

            {legendData && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tabular-nums text-white">
                  {formatToman(legendData.c)}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'gap-0.5 border-0 px-1.5 py-0 text-[11px] font-medium tabular-nums',
                    legendData.change >= 0
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-red-500/15 text-red-400',
                  )}
                >
                  {legendData.change >= 0 ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {fmtChange(legendData.changePercent)}
                </Badge>
              </div>
            )}
          </div>

          {/* Center: Timeframe Buttons */}
          <div className="flex items-center gap-1 rounded-lg bg-white/5 p-0.5" id="ac-timeframe">
            {TIMEFRAMES.map((tf) => (
              <Button
                key={tf.value}
                variant="ghost"
                size="sm"
                onClick={() => setTimeframe(tf.value)}
                className={cn(
                  'h-7 rounded-md px-2.5 text-[11px] font-semibold transition-all',
                  timeframe === tf.value
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37] shadow-sm'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-300',
                )}
              >
                {isRTL ? tf.label : tf.labelEn}
              </Button>
            ))}
          </div>

          {/* Right: Controls */}
          <div id="ac-indicators" className="flex items-center gap-1.5">
            {/* Indicator Toggle Menu */}
            <DropdownMenu
              open={showIndicatorMenu}
              onOpenChange={setShowIndicatorMenu}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 gap-1.5 rounded-md px-2.5 text-[11px] font-medium',
                    Object.values(indicators).some(Boolean)
                      ? 'bg-[#D4AF37]/15 text-[#D4AF37]'
                      : 'text-gray-400 hover:bg-white/5',
                  )}
                >
                  <Layers className="size-3.5" />
                  {isRTL ? 'اندیکاتورها' : 'Indicators'}
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 border-white/10 bg-[#1a1b2e] p-1"
              >
                <DropdownMenuLabel className="text-xs font-semibold text-gray-300">
                  {isRTL ? 'اندیکاتورهای فنی' : 'Technical Indicators'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {indicatorMenuItems.map((item) => (
                  <DropdownMenuItem
                    key={item.key}
                    onClick={() => toggleIndicator(item.key)}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-gray-300 focus:bg-white/5 focus:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="size-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <p className="text-xs font-medium">{item.label}</p>
                        <p className="text-[10px] text-gray-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={indicators[item.key]}
                      onCheckedChange={() => toggleIndicator(item.key)}
                      className="data-[state=checked]:bg-[#D4AF37] scale-75"
                    />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Comparison Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleComparison('enabled')}
                  className={cn(
                    'h-7 gap-1.5 rounded-md px-2.5 text-[11px] font-medium',
                    comparison.enabled
                      ? 'bg-[#D4AF37]/15 text-[#D4AF37]'
                      : 'text-gray-400 hover:bg-white/5',
                  )}
                >
                  <GitCompareArrows className="size-3.5" />
                  {isRTL ? 'مقایسه' : 'Compare'}
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="border-white/10 bg-[#1a1b2e] text-[11px] text-gray-300"
              >
                {isRTL ? 'مقایسه با دلار و بیت‌کوین' : 'Compare with USD & BTC'}
              </TooltipContent>
            </Tooltip>

            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-7 w-7 rounded-md p-0 text-gray-400 hover:bg-white/5 hover:text-gray-300"
            >
              {isFullscreen ? (
                <Minimize2 className="size-3.5" />
              ) : (
                <Maximize2 className="size-3.5" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ═══ OHLCV Legend ═══ */}
      {!compact && legendData && (
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-white/5 px-3 py-1.5 sm:px-4"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium uppercase text-gray-500">
              O
            </span>
            <span className="text-[11px] font-medium tabular-nums text-gray-300">
              {fmtPrice(legendData.o)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium uppercase text-gray-500">
              H
            </span>
            <span className="text-[11px] font-medium tabular-nums text-gray-300">
              {fmtPrice(legendData.h)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium uppercase text-gray-500">
              L
            </span>
            <span className="text-[11px] font-medium tabular-nums text-gray-300">
              {fmtPrice(legendData.l)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium uppercase text-gray-500">
              C
            </span>
            <span
              className={cn(
                'text-[11px] font-semibold tabular-nums',
                legendData.change >= 0 ? 'text-emerald-400' : 'text-red-400',
              )}
            >
              {fmtPrice(legendData.c)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium uppercase text-gray-500">
              Vol
            </span>
            <span className="text-[11px] font-medium tabular-nums text-gray-400">
              {formatNumber(legendData.volume)}
            </span>
          </div>

          {/* Active indicators legend */}
          {indicators.ema && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600">EMA</span>
              <span className="flex items-center gap-0.5 text-[10px]">
                <span
                  className="inline-block size-1.5 rounded-full"
                  style={{ backgroundColor: '#FFD700' }}
                />
                9
              </span>
              <span className="flex items-center gap-0.5 text-[10px]">
                <span
                  className="inline-block size-1.5 rounded-full"
                  style={{ backgroundColor: '#06b6d4' }}
                />
                21
              </span>
              <span className="flex items-center gap-0.5 text-[10px]">
                <span
                  className="inline-block size-1.5 rounded-full"
                  style={{ backgroundColor: '#d946ef' }}
                />
                50
              </span>
            </div>
          )}
          {indicators.bollinger && (
            <div className="flex items-center gap-1">
              <span
                className="inline-block size-1.5 rounded-full"
                style={{ backgroundColor: 'rgba(168, 162, 255, 0.6)' }}
              />
              <span className="text-[10px] text-gray-600">BB(20,2)</span>
            </div>
          )}

          {/* Live indicator */}
          <motion.div
            className="ml-auto flex items-center gap-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-medium text-emerald-400">
              {isRTL ? 'زنده' : 'Live'}
            </span>
          </motion.div>
        </div>
      )}

      {/* ═══ Chart Container ═══ */}
      <div className="relative">
        {isLoading && <ChartSkeleton />}

        <AnimatePresence>
          {!isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Main Chart */}
              <div
                ref={chartContainerRef}
                className="w-full"
                style={{ minHeight: height }}
              />

              {/* Indicator label overlays */}
              {indicators.ema && (
                <div className="absolute top-2 left-3 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <span className="size-2 rounded-full" style={{ backgroundColor: '#FFD700' }} />
                    <span className="text-[10px] text-gray-400">EMA 9</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="size-2 rounded-full" style={{ backgroundColor: '#06b6d4' }} />
                    <span className="text-[10px] text-gray-400">EMA 21</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="size-2 rounded-full" style={{ backgroundColor: '#d946ef' }} />
                    <span className="text-[10px] text-gray-400">EMA 50</span>
                  </div>
                </div>
              )}
              {indicators.bollinger && (
                <div className="absolute top-2 right-3 flex items-center gap-1">
                  <span className="size-2 rounded-full" style={{ backgroundColor: 'rgba(168, 162, 255, 0.6)' }} />
                  <span className="text-[10px] text-gray-400">BB(20,2)</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ RSI Pane ═══ */}
      <AnimatePresence>
        {indicators.rsi && !isLoading && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 120, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="flex items-center justify-between px-3 pt-1.5">
              <span className="text-[10px] font-semibold uppercase text-[#a78bfa]">
                RSI (14)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-500">
                  70 — {isRTL ? 'اشباع خرید' : 'Overbought'}
                </span>
                <span className="text-[9px] text-gray-500">
                  30 — {isRTL ? 'اشباع فروش' : 'Oversold'}
                </span>
              </div>
            </div>
            <div ref={rsiPaneRef} className="w-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MACD Pane ═══ */}
      <AnimatePresence>
        {indicators.macd && !isLoading && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 120, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="flex items-center justify-between px-3 pt-1.5">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold uppercase text-[#3b82f6]">
                  MACD
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-0.5">
                    <span className="size-1.5 rounded-full bg-[#3b82f6]" />
                    <span className="text-[9px] text-gray-500">
                      (12, 26)
                    </span>
                  </span>
                  <span className="flex items-center gap-0.5">
                    <span className="size-1.5 rounded-full bg-[#f97316]" />
                    <span className="text-[9px] text-gray-500">Signal (9)</span>
                  </span>
                </div>
              </div>
            </div>
            <div ref={macdPaneRef} className="w-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Comparison Pane ═══ */}
      <AnimatePresence>
        {comparison.enabled && !isLoading && (
          <motion.div
            id="ac-compare"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 150, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="flex items-center justify-between px-3 pt-1.5">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold uppercase text-[#D4AF37]">
                  {isRTL ? 'مقایسه درصدی' : '% Comparison'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5">
                    <span className="size-1.5 rounded-full bg-[#D4AF37]" />
                    <span className="text-[9px] text-gray-500">
                      {isRTL ? 'طلا' : 'Gold'}
                    </span>
                  </span>
                  {comparison.usd && (
                    <span className="flex items-center gap-0.5">
                      <span className="size-1.5 rounded-full bg-[#22d3ee]" />
                      <span className="text-[9px] text-gray-500">USD</span>
                    </span>
                  )}
                  {comparison.btc && (
                    <span className="flex items-center gap-0.5">
                      <span className="size-1.5 rounded-full bg-[#f97316]" />
                      <span className="text-[9px] text-gray-500">BTC</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-1">
                  <input
                    type="checkbox"
                    checked={comparison.usd}
                    onChange={() => toggleComparison('usd')}
                    className="size-3 accent-[#22d3ee]"
                  />
                  <span className="text-[9px] text-gray-500">USD</span>
                </label>
                <label className="flex cursor-pointer items-center gap-1">
                  <input
                    type="checkbox"
                    checked={comparison.btc}
                    onChange={() => toggleComparison('btc')}
                    className="size-3 accent-[#f97316]"
                  />
                  <span className="text-[9px] text-gray-500">BTC</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Compact Controls (shown when compact=true) ═══ */}
      {compact && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-white/5 px-3 py-2">
          {TIMEFRAMES.map((tf) => (
            <Button
              key={tf.value}
              variant="ghost"
              size="sm"
              onClick={() => setTimeframe(tf.value)}
              className={cn(
                'h-6 rounded px-2 text-[10px] font-semibold',
                timeframe === tf.value
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                  : 'text-gray-500 hover:text-gray-300',
              )}
            >
              {tf.labelEn}
            </Button>
          ))}
          <Separator orientation="vertical" className="mx-1 h-4 bg-white/10" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleIndicator('ema')}
            className={cn(
              'h-6 rounded px-2 text-[10px]',
              indicators.ema ? 'text-[#FFD700]' : 'text-gray-500',
            )}
          >
            EMA
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleIndicator('rsi')}
            className={cn(
              'h-6 rounded px-2 text-[10px]',
              indicators.rsi ? 'text-[#a78bfa]' : 'text-gray-500',
            )}
          >
            RSI
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleIndicator('macd')}
            className={cn(
              'h-6 rounded px-2 text-[10px]',
              indicators.macd ? 'text-[#3b82f6]' : 'text-gray-500',
            )}
          >
            MACD
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleIndicator('bollinger')}
            className={cn(
              'h-6 rounded px-2 text-[10px]',
              indicators.bollinger ? 'text-purple-400' : 'text-gray-500',
            )}
          >
            BB
          </Button>
        </div>
      )}
    </motion.div>
  );
}

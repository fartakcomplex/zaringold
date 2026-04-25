'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  RefreshCw,
  Clock,
  Sparkles,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Newspaper,
  BarChart3,
  Loader2,
  ChevronUp,
  ChevronDown,
  ShieldAlert,
  Zap,
  Info,
  Globe,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/lib/store';
import { formatToman, formatNumber } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

type TrendDirection = 'up' | 'down' | 'sideways';
type SentimentType = 'positive' | 'negative' | 'neutral';

interface TrendPeriod {
  direction: TrendDirection;
  confidence: number;
  description: string;
  support: number;
  resistance: number;
}

interface TrendAnalysis {
  shortTerm: TrendPeriod;
  midTerm: TrendPeriod;
}

interface SentimentFactor {
  label: string;
  impact: SentimentType;
  weight: number;
}

interface MarketSentiment {
  overall: SentimentType;
  score: number;
  fearGreedIndex: number;
  factors: SentimentFactor[];
}

interface NewsItem {
  id: string;
  title: string;
  description: string;
  sentiment: SentimentType;
  time: string;
  source: string;
}

interface NewsSummary {
  summary: string;
  news: NewsItem[];
  lastUpdated: string;
}

interface MarketAnalysisData {
  trendAnalysis: TrendAnalysis;
  sentiment: MarketSentiment;
  newsSummary: NewsSummary;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CSS Animation Keyframes                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CSS_ANIMATIONS = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(28px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes itemIn {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes iconPop {
  from { opacity: 0; transform: scale(0) rotate(-90deg); }
  to { opacity: 1; transform: scale(1) rotate(0deg); }
}
@keyframes needleRotate {
  from { transform: rotate(var(--needle-start)); }
  to { transform: rotate(var(--needle-end)); }
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}
.animate-card-in {
  animation: cardIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.animate-item-in {
  animation: itemIn 0.35s ease-out forwards;
}
.animate-icon-pop {
  animation: iconPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.animate-delay-0 { animation-delay: 0s; opacity: 0; }
.animate-delay-1 { animation-delay: 0.08s; opacity: 0; }
.animate-delay-2 { animation-delay: 0.16s; opacity: 0; }
.animate-delay-3 { animation-delay: 0.24s; opacity: 0; }
.animate-delay-4 { animation-delay: 0.32s; opacity: 0; }
.animate-delay-5 { animation-delay: 0.4s; opacity: 0; }
.animate-delay-6 { animation-delay: 0.5s; opacity: 0; }
.animate-delay-7 { animation-delay: 0.6s; opacity: 0; }
.animate-delay-8 { animation-delay: 0.7s; opacity: 0; }
.animate-delay-9 { animation-delay: 0.8s; opacity: 0; }
.animate-delay-10 { animation-delay: 0.9s; opacity: 0; }

.animate-icon-delay { animation-delay: 0.15s; opacity: 0; }
`;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Data                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const mockAnalysis: MarketAnalysisData = {
  trendAnalysis: {
    shortTerm: {
      direction: 'up',
      confidence: 72,
      description:
        'روند کوتاه‌مدت طلا صعودی است. میانگین متحرک ۵ روزه بالاتر از میانگین ۲۰ روزه قرار دارد و حجم معاملات در روزهای اخیر افزایش یافته. عبور قیمت از مقاومت ۱.۲ گرم طلا با قدرت انجام شده که نشان‌دهنده تقاضای بالا در بازار است.',
      support: 4200000,
      resistance: 4450000,
    },
    midTerm: {
      direction: 'up',
      confidence: 65,
      description:
        'روند میان‌مدت طلا صعودی اما با احتیاط است. فشار تورمی جهانی و کاهش احتمالی نرخ بهره آمریکا از عوامل حمایتی هستند. با این حال، نوسانات نرخ ارز داخلی و سیاست‌های بانک مرکزی ممکن است مسیر رشد را محدود کنند.',
      support: 4000000,
      resistance: 4600000,
    },
  },
  sentiment: {
    overall: 'positive',
    score: 42,
    fearGreedIndex: 68,
    factors: [
      { label: 'تورم جهانی', impact: 'positive', weight: 25 },
      { label: 'نرخ بهره آمریکا', impact: 'negative', weight: 20 },
      { label: 'تنش‌های ژئوپلیتیکی', impact: 'positive', weight: 20 },
      { label: 'قدرت دلار', impact: 'neutral', weight: 15 },
      { label: 'تقاضای بانک‌های مرکزی', impact: 'positive', weight: 10 },
      { label: 'وضعیت اقتصاد ایران', impact: 'negative', weight: 10 },
    ],
  },
  newsSummary: {
    summary:
      'بازار طلا در هفته گذشته با رشد قابل توجهی مواجه بود. افزایش تقاضای جهانی طلا و کاهش ارزش دلار آمریکا از عوامل اصلی این رشد بودند. در بازار داخلی، قیمت سکه تمام بهار آزادی نیز با افزایش ۱.۸ درصدی مواجه شد. کارشناسان پیش‌بینی می‌کنند که با توجه به سیاست‌های احتمالی فدرال رزرو، روند صعودی طلا ادامه یابد.',
    news: [
      {
        id: 'n1',
        title: 'افزایش قیمت طلا در بازار جهانی به بالاترین سطح ۳ ماهه',
        description:
          'قیمت اونس طلا با ۱.۲ درصد افزایش به ۲,۶۸۵ دلار رسید که بالاترین سطح در ۳ ماه اخیر است. تحلیلگران دلیل اصلی این رشد را کاهش ارزش دلار و افزایش تنش‌های ژئوپلیتیکی می‌دانند.',
        sentiment: 'positive',
        time: '۱ ساعت پیش',
        source: 'رویترز',
      },
      {
        id: 'n2',
        title: 'فدرال رزرو احتمال کاهش نرخ بهره را مطرح کرد',
        description:
          'بهترین مقامات فدرال رزرو در سخنرانی اخیر خود، احتمال کاهش نرخ بهره در جلسات آینده را مطرح کردند. این امر می‌تواند باعث افزایش بیشتر قیمت طلا شود.',
        sentiment: 'positive',
        time: '۳ ساعت پیش',
        source: 'بلومبرگ',
      },
      {
        id: 'n3',
        title: 'بانک‌های مرکزی جهان خرید طلا را ادامه می‌دهند',
        description:
          'بر اساس گزارش شورای جهانی طلا، بانک‌های مرکزی در سه ماهه سوم ۴۸۵ تن طلا خریداری کرده‌اند. چین و هند بزرگترین خریداران بودند.',
        sentiment: 'positive',
        time: '۵ ساعت پیش',
        source: 'شورای جهانی طلا',
      },
      {
        id: 'n4',
        title: 'هشدار درباره نوسانات بازار ارز ایران',
        description:
          'کارشناسان اقتصادی نسبت به نوسانات شدید بازار ارز ایران هشدار دادند و تأکید کردند که این نوسانات می‌تواند بر قیمت طلا و سکه تأثیر مستقیم داشته باشد.',
        sentiment: 'negative',
        time: '۸ ساعت پیش',
        source: 'دنیای اقتصاد',
      },
      {
        id: 'n5',
        title: 'رشد قیمت سکه تمام بهار آزادی',
        description:
          'سکه تمام بهار آزادی در معاملات امروز با ۱.۸ درصد افزایش به قیمت ۱ کیلوگرم طلا رسید. بازارسازان دلیل اصلی این رشد را تقاضای زیاد خریداران می‌دانند.',
        sentiment: 'neutral',
        time: '۱۰ ساعت پیش',
        source: 'خبرگزاری اقتصاد',
      },
    ],
    lastUpdated: new Date().toISOString(),
  },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper Functions                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getDirectionIcon(direction: TrendDirection) {
  switch (direction) {
    case 'up':
      return <ArrowUp className="size-5" />;
    case 'down':
      return <ArrowDown className="size-5" />;
    case 'sideways':
      return <ArrowUpDown className="size-5" />;
  }
}

function getDirectionLabel(direction: TrendDirection) {
  switch (direction) {
    case 'up':
      return 'صعودی';
    case 'down':
      return 'نزولی';
    case 'sideways':
      return 'افقی';
  }
}

function getDirectionColor(direction: TrendDirection) {
  switch (direction) {
    case 'up':
      return 'text-emerald-500';
    case 'down':
      return 'text-red-500';
    case 'sideways':
      return 'text-amber-500';
  }
}

function getDirectionBg(direction: TrendDirection) {
  switch (direction) {
    case 'up':
      return 'bg-emerald-500/10 border-emerald-500/20';
    case 'down':
      return 'bg-red-500/10 border-red-500/20';
    case 'sideways':
      return 'bg-amber-500/10 border-amber-500/20';
  }
}

function getSentimentIcon(sentiment: SentimentType, size = 24) {
  switch (sentiment) {
    case 'positive':
      return <TrendingUp style={{ width: size, height: size }} className="text-emerald-500" />;
    case 'negative':
      return <TrendingDown style={{ width: size, height: size }} className="text-red-500" />;
    case 'neutral':
      return <Minus style={{ width: size, height: size }} className="text-amber-500" />;
  }
}

function getSentimentLabel(sentiment: SentimentType) {
  switch (sentiment) {
    case 'positive':
      return 'مثبت';
    case 'negative':
      return 'منفی';
    case 'neutral':
      return 'خنثی';
  }
}

function getSentimentColor(sentiment: SentimentType) {
  switch (sentiment) {
    case 'positive':
      return 'text-emerald-500';
    case 'negative':
      return 'text-red-500';
    case 'neutral':
      return 'text-amber-500';
  }
}

function getSentimentBadgeClass(sentiment: SentimentType) {
  switch (sentiment) {
    case 'positive':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'negative':
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    case 'neutral':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  }
}

function getFearGreedLabel(index: number) {
  if (index >= 80) return 'ترس شدید خرید';
  if (index >= 60) return 'طمع';
  if (index >= 40) return 'خنثی';
  if (index >= 20) return 'ترس';
  return 'ترس شدید';
}

function getFearGreedColor(index: number) {
  if (index >= 80) return '#ef4444';
  if (index >= 60) return '#f59e0b';
  if (index >= 40) return '#D4AF37';
  if (index >= 20) return '#22c55e';
  return '#10b981';
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Animated Number Counter                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function AnimatedCounter({
  target,
  duration = 1200,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}: {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayValue(eased * target);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return (
    <span className={className}>
      {prefix}
      {formatNumber(Math.round(displayValue))}
      {suffix}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SVG Sentiment Gauge                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SentimentGauge({ value, size = 160 }: { value: number; size?: number }) {
  // value: -100 to +100, map to angle
  const clampedValue = Math.max(-100, Math.min(100, value));
  const targetAngle = ((clampedValue + 100) / 200) * 180; // 0 to 180 degrees

  const [animatedAngle, setAnimatedAngle] = useState(-90);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedAngle(targetAngle - 90);
    }, 300);
    return () => clearTimeout(timer);
  }, [targetAngle]);

  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size - strokeWidth;
  const circumference = Math.PI * radius; // half circle

  // Create arc path
  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const angleRad = ((angleDeg - 180) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    };
  };

  const start = polarToCartesian(cx, cy, radius, 0);
  const end = polarToCartesian(cx, cy, radius, targetAngle);

  const arcPath = (startAngle: number, endAngle: number) => {
    const s = polarToCartesian(cx, cy, radius, endAngle);
    const e = polarToCartesian(cx, cy, radius, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 0 ${e.x} ${e.y}`;
  };

  const gaugeColor =
    value >= 30 ? '#10b981' : value >= -30 ? '#f59e0b' : '#ef4444';

  // Needle position
  const needleEnd = polarToCartesian(cx, cy - 4, radius - 8, targetAngle);

  return (
    <div className="relative" style={{ width: size, height: size * 0.7 }}>
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        {/* Background arc */}
        <path
          d={arcPath(0, 180)}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-muted/20"
        />

        {/* Gradient arc for negative to positive */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="65%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="gaugeActiveGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
          </linearGradient>
        </defs>

        {/* Filled arc */}
        <path
          d={arcPath(0, Math.max(1, targetAngle))}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={0}
          style={{
            transition: 'stroke-dasharray 1s ease-out',
          }}
        />

        {/* Needle - using CSS transform transition instead of motion.g */}
        <g
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transform: `rotate(${animatedAngle}deg)`,
            transition: 'transform 1s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <circle cx={cx} cy={cy} r={6} fill={gaugeColor} />
          <line
            x1={cx}
            y1={cy}
            x2={needleEnd.x}
            y2={needleEnd.y}
            stroke={gaugeColor}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </g>

        {/* Center circle */}
        <circle cx={cx} cy={cy} r={4} fill="currentColor" className="text-background" />
      </svg>

      {/* Labels */}
      <div className="absolute bottom-0 left-0 flex w-full justify-between px-2">
        <span className="text-[10px] font-medium text-red-500">-۱۰۰</span>
        <span className="text-[10px] font-medium text-amber-500">۰</span>
        <span className="text-[10px] font-medium text-emerald-500">+۱۰۰</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Fear & Greed Bar                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function FearGreedBar({ index }: { index: number }) {
  const color = getFearGreedColor(index);
  const label = getFearGreedLabel(index);

  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">شاخص ترس و طمع</span>
        <div className="flex items-center gap-1.5">
          <AnimatedCounter target={index} suffix="" className="text-sm font-bold tabular-nums" />
          <span className="text-xs text-muted-foreground">/ ۱۰۰</span>
        </div>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted/50">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, #10b981, ${color})`,
            width: animated ? `${Math.max(2, index)}%` : '0%',
            transition: 'width 1.2s ease-out',
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-emerald-500">طمع</span>
        <Badge
          variant="outline"
          className="text-[10px] px-2 py-0"
          style={{ borderColor: color, color }}
        >
          {label}
        </Badge>
        <span className="text-[10px] text-red-500">ترس</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeletons                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TrendCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-5 w-28" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SentimentCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-5 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex justify-center">
          <Skeleton className="h-32 w-40 rounded-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-6 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function NewsCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Separator />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-5 shrink-0 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-12 rounded-full" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FullSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="size-9 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TrendCardSkeleton />
        <SentimentCardSkeleton />
        <NewsCardSkeleton />
      </div>
      <div className="rounded-lg bg-muted/30 p-3">
        <Skeleton className="mx-auto h-4 w-80" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Error State                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="animate-fade-in-up flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 bg-red-50/50 p-8 dark:border-red-900/30 dark:bg-red-950/20">
      <div className="flex size-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
        <AlertCircle className="size-7 text-red-500" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-red-600 dark:text-red-400">خطا در دریافت اطلاعات</p>
        <p className="mt-1 text-xs text-muted-foreground">{message}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
        onClick={onRetry}
      >
        <RefreshCw className="size-3.5" />
        تلاش مجدد
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub Components                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ── Card 1: Trend Analysis ── */
function TrendAnalysisCard({ data }: { data: TrendAnalysis | null | undefined }) {
  const [shortAnimated, setShortAnimated] = useState(false);
  const [midAnimated, setMidAnimated] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShortAnimated(true), 500);
    const timer2 = setTimeout(() => setMidAnimated(true), 700);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!data) return null;
  return (
    <div className="animate-card-in animate-delay-1">
      <Card className="glass-gold h-full overflow-hidden card-spotlight">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gold/10">
              <Activity className="size-5 text-gold" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">تحلیل روند</CardTitle>
              <p className="text-[11px] text-muted-foreground">بررسی جهت و قدرت بازار</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Short Term */}
          <div className="animate-item-in animate-delay-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">کوتاه‌مدت</span>
                <span className="text-[10px] text-muted-foreground/70">(۱-۷ روز)</span>
              </div>
              <div
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${getDirectionBg(data.shortTerm.direction)}`}
              >
                <span className={getDirectionColor(data.shortTerm.direction)}>
                  {getDirectionIcon(data.shortTerm.direction)}
                </span>
                <span
                  className={`text-xs font-bold ${getDirectionColor(data.shortTerm.direction)}`}
                >
                  {getDirectionLabel(data.shortTerm.direction)}
                </span>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">سطح اطمینان</span>
                <AnimatedCounter
                  target={data.shortTerm.confidence}
                  suffix="٪"
                  className="font-bold tabular-nums text-foreground"
                />
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/50">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gold"
                  style={{
                    width: shortAnimated ? `${Math.max(2, data.shortTerm.confidence)}%` : '0%',
                    transition: 'width 1s ease-out',
                  }}
                />
              </div>
            </div>

            {/* Support / Resistance */}
            <div className="flex gap-3">
              <div className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 text-center dark:border-emerald-900/30 dark:bg-emerald-950/20">
                <p className="text-[10px] text-muted-foreground">حمایت</p>
                <p className="mt-0.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatToman(data.shortTerm.support)}
                </p>
              </div>
              <div className="flex-1 rounded-lg border border-red-200 bg-red-50/50 p-2.5 text-center dark:border-red-900/30 dark:bg-red-950/20">
                <p className="text-[10px] text-muted-foreground">مقاومت</p>
                <p className="mt-0.5 text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">
                  {formatToman(data.shortTerm.resistance)}
                </p>
              </div>
            </div>

            <p className="text-[11px] leading-6 text-muted-foreground">
              {data.shortTerm.description}
            </p>
          </div>

          <Separator />

          {/* Mid Term */}
          <div className="animate-item-in animate-delay-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">میان‌مدت</span>
                <span className="text-[10px] text-muted-foreground/70">(۱-۳ ماه)</span>
              </div>
              <div
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${getDirectionBg(data.midTerm.direction)}`}
              >
                <span className={getDirectionColor(data.midTerm.direction)}>
                  {getDirectionIcon(data.midTerm.direction)}
                </span>
                <span
                  className={`text-xs font-bold ${getDirectionColor(data.midTerm.direction)}`}
                >
                  {getDirectionLabel(data.midTerm.direction)}
                </span>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">سطح اطمینان</span>
                <AnimatedCounter
                  target={data.midTerm.confidence}
                  suffix="٪"
                  className="font-bold tabular-nums text-foreground"
                />
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/50">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gold"
                  style={{
                    width: midAnimated ? `${Math.max(2, data.midTerm.confidence)}%` : '0%',
                    transition: 'width 1s ease-out',
                  }}
                />
              </div>
            </div>

            {/* Support / Resistance */}
            <div className="flex gap-3">
              <div className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 text-center dark:border-emerald-900/30 dark:bg-emerald-950/20">
                <p className="text-[10px] text-muted-foreground">حمایت</p>
                <p className="mt-0.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatToman(data.midTerm.support)}
                </p>
              </div>
              <div className="flex-1 rounded-lg border border-red-200 bg-red-50/50 p-2.5 text-center dark:border-red-900/30 dark:bg-red-950/20">
                <p className="text-[10px] text-muted-foreground">مقاومت</p>
                <p className="mt-0.5 text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">
                  {formatToman(data.midTerm.resistance)}
                </p>
              </div>
            </div>

            <p className="text-[11px] leading-6 text-muted-foreground">
              {data.midTerm.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Card 2: Sentiment Analysis ── */
function SentimentAnalysisCard({ data }: { data: MarketSentiment | null | undefined }) {
  if (!data) return null;
  return (
    <div className="animate-card-in animate-delay-2">
      <Card className="glass-gold h-full overflow-hidden card-spotlight">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gold/10">
              <BarChart3 className="size-5 text-gold" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">تحلیل احساسات بازار</CardTitle>
              <p className="text-[11px] text-muted-foreground">سنجش وضعیت روانی بازار</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Overall Sentiment Icon */}
          <div className="animate-icon-pop animate-icon-delay flex flex-col items-center gap-2">
            <div
              className={`flex size-16 items-center justify-center rounded-2xl ${
                data.overall === 'positive'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : data.overall === 'negative'
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-amber-100 dark:bg-amber-900/30'
              }`}
            >
              {getSentimentIcon(data.overall, 32)}
            </div>
            <div className="text-center">
              <p className={`text-lg font-bold ${getSentimentColor(data.overall)}`}>
                {getSentimentLabel(data.overall)}
              </p>
              <p className="text-[11px] text-muted-foreground">وضعیت کلی بازار</p>
            </div>
          </div>

          {/* Sentiment Score Gauge */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">امتیاز احساسات</span>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {data.score > 0 ? '+' : ''}
                {formatNumber(data.score)}
              </span>
            </div>
            <SentimentGauge value={data.score} size={180} />
          </div>

          {/* Fear & Greed Index */}
          <FearGreedBar index={data.fearGreedIndex} />

          <Separator />

          {/* Contributing Factors */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Info className="size-3.5 text-gold" />
              <span className="text-xs font-semibold text-muted-foreground">عوامل تأثیرگذار</span>
            </div>
            <div className="space-y-2">
              {data.factors.map((factor, idx) => (
                <div
                  key={factor.label}
                  className={`animate-item-in ${idx < 10 ? `animate-delay-${Math.min(idx + 4, 10)}` : ''} flex items-center gap-3 rounded-lg border border-border/50 p-2.5 transition-colors hover:bg-muted/30`}
                >
                  <div
                    className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
                      factor.impact === 'positive'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : factor.impact === 'negative'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-amber-100 dark:bg-amber-900/30'
                    }`}
                  >
                    {factor.impact === 'positive' ? (
                      <TrendingUp className="size-3.5 text-emerald-500" />
                    ) : factor.impact === 'negative' ? (
                      <TrendingDown className="size-3.5 text-red-500" />
                    ) : (
                      <Minus className="size-3.5 text-amber-500" />
                    )}
                  </div>
                  <span className="flex-1 text-xs font-medium text-foreground">{factor.label}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 py-0 ${getSentimentBadgeClass(factor.impact)}`}
                  >
                    {getSentimentLabel(factor.impact)}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-left">
                    {formatNumber(factor.weight)}٪
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Card 3: News Summary ── */
function NewsSummaryCard({ data }: { data: NewsSummary | null | undefined }) {
  const [expanded, setExpanded] = useState(false);
  if (!data) return null;
  const visibleNews = expanded ? data.news : data.news.slice(0, 3);
  const hasMore = data.news.length > 3;

  return (
    <div className="animate-card-in animate-delay-3">
      <Card className="glass-gold h-full overflow-hidden card-spotlight">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gold/10">
                <Newspaper className="size-5 text-gold" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">خلاصه اخبار</CardTitle>
                <p className="text-[11px] text-muted-foreground">آخرین اخبار بازار طلا</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Globe className="size-3" />
              <span>AI</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* AI Summary */}
          <div className="animate-fade-in animate-delay-1 rounded-xl border border-gold/15 bg-gold/[0.03] p-3.5">
            <div className="mb-2 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-gold" />
              <span className="text-[11px] font-bold text-gold">خلاصه هوشمند</span>
            </div>
            <p className="text-[11px] leading-6 text-muted-foreground">{data.summary}</p>
          </div>

          <Separator />

          {/* News Items */}
          <div className="space-y-3">
            {visibleNews.map((item, idx) => (
              <article
                key={item.id}
                className={`animate-item-in ${idx < 10 ? `animate-delay-${Math.min(idx + 2, 10)}` : ''} group cursor-pointer rounded-lg border border-border/50 p-3 transition-all hover:border-gold/20 hover:bg-gold/[0.02] hover-lift-sm`}
              >
                <div className="flex gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {getSentimentIcon(item.sentiment, 16)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold leading-relaxed text-foreground group-hover:text-gold transition-colors">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-[11px] leading-5 text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 ${getSentimentBadgeClass(item.sentiment)}`}
                      >
                        {getSentimentLabel(item.sentiment)}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{item.source}</span>
                      <span className="text-[10px] text-muted-foreground/50">·</span>
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-gold">
                        <Clock className="size-2.5" />
                        {item.time}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1.5 text-xs text-gold hover:bg-gold/5 hover:text-gold"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="size-3.5" />
                  نمایش کمتر
                </>
              ) : (
                <>
                  <ChevronDown className="size-3.5" />
                  مشاهده بیشتر ({data.news.length - 3} خبر)
                </>
              )}
            </Button>
          )}

          {/* Last Updated */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/60">
            <Clock className="size-3" />
            <span>آخرین بروزرسانی: </span>
            <span className="tabular-nums">
              {new Intl.DateTimeFormat('fa-IR', {
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(data.lastUpdated))}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AIMarketAnalysis() {
  const [data, setData] = useState<MarketAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Fetch Analysis Data ── */
  const fetchAnalysis = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch('/api/market/analysis');
      const json = await res.json();

      if (json.success && json.data) {
        setData(json.data);
      } else {
        // Fallback to mock data
        setData(mockAnalysis);
      }
      setLastRefresh(new Date());
    } catch {
      // On error, still use mock data
      setData(mockAnalysis);
      setLastRefresh(new Date());
      if (!data) {
        setError('خطا در دریافت اطلاعات. در حال نمایش داده‌های محلی...');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [data]);

  /* ── Initial Fetch + Auto Refresh ── */
  useEffect(() => {
    fetchAnalysis();

    // Auto-refresh every 5 minutes
    refreshTimerRef.current = setInterval(() => {
      fetchAnalysis();
    }, 5 * 60 * 1000);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, []);

  /* ── Manual Refresh ── */
  const handleManualRefresh = () => {
    fetchAnalysis(true);
  };

  /* ── Render: Loading ── */
  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <style>{CSS_ANIMATIONS}</style>
        <FullSkeleton />
      </div>
    );
  }

  /* ── Render: Error with no data ── */
  if (error && !data) {
    return (
      <div>
        <style>{CSS_ANIMATIONS}</style>
        <ErrorState message={error} onRetry={() => fetchAnalysis(true)} />
      </div>
    );
  }

  if (!data) return null;

  /* ── Render: Main ── */
  return (
    <>
      <style>{CSS_ANIMATIONS}</style>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="animate-item-in animate-delay-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-gold/5">
              <Brain className="size-5 text-gold" />
            </div>
            <div>
              <h2 className="text-lg font-bold">تحلیل هوشمند بازار</h2>
              <p className="text-xs text-muted-foreground">
                تحلیل AI از روند، احساسات و اخبار بازار طلا
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 border-gold/30 text-gold text-[10px]">
              <Sparkles className="size-3" />
              AI
            </Badge>
            <Button
              variant="outline"
              size="icon"
              className="size-9 border-gold/20 hover:bg-gold/5"
              onClick={handleManualRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`size-4 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </div>

        {/* ── Quick Stats Bar ── */}
        <div className="animate-item-in animate-delay-1 grid grid-cols-3 gap-3">
          {/* Overall Trend */}
          <div className="flex items-center gap-2.5 rounded-xl border border-border/50 p-3">
            <div
              className={`flex size-9 items-center justify-center rounded-lg ${
                data?.trendAnalysis?.shortTerm?.direction === 'up'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : data?.trendAnalysis?.shortTerm?.direction === 'down'
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-amber-100 dark:bg-amber-900/30'
              }`}
            >
              {getDirectionIcon(data?.trendAnalysis?.shortTerm?.direction)}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">روند فعلی</p>
              <p
                className={`text-sm font-bold ${getDirectionColor(data?.trendAnalysis?.shortTerm?.direction)}`}
              >
                {getDirectionLabel(data?.trendAnalysis?.shortTerm?.direction)}
              </p>
            </div>
          </div>

          {/* Sentiment Score */}
          <div className="flex items-center gap-2.5 rounded-xl border border-border/50 p-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gold/10">
              <Zap className="size-5 text-gold" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">امتیاز احساسات</p>
              <p className="text-sm font-bold tabular-nums text-foreground">
                {data?.sentiment?.score > 0 ? '+' : ''}
                {formatNumber(data?.sentiment?.score ?? 0)}
              </p>
            </div>
          </div>

          {/* Fear & Greed */}
          <div className="flex items-center gap-2.5 rounded-xl border border-border/50 p-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gold/10">
              <Activity className="size-5 text-gold" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">شاخص ترس و طمع</p>
              <p
                className="text-sm font-bold tabular-nums"
                style={{ color: getFearGreedColor(data?.sentiment?.fearGreedIndex ?? 50) }}
              >
                {formatNumber(data?.sentiment?.fearGreedIndex ?? 50)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Main Cards Grid ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <TrendAnalysisCard data={data?.trendAnalysis} />
          <SentimentAnalysisCard data={data?.sentiment} />
          <NewsSummaryCard data={data?.newsSummary} />
        </div>

        {/* ── Footer: Disclaimer ── */}
        <div className="animate-fade-in animate-delay-7 flex flex-col items-center gap-2 rounded-xl border border-amber-200/50 bg-amber-50/30 px-4 py-3 dark:border-amber-900/20 dark:bg-amber-950/10">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="size-3.5" />
            <span className="text-[11px] font-semibold">
              این تحلیل جنبه آموزشی دارد و توصیه سرمایه‌گذاری نیست
            </span>
          </div>
          <p className="text-center text-[10px] text-muted-foreground">
            اطلاعات ارائه شده توسط هوش مصنوعی تولید شده و ممکن است با واقعیت بازار تفاوت داشته باشد.
            پیش از هرگونه تصمیم سرمایه‌گذاری، با مشاوران مالی مجرب مشورت کنید.
          </p>
          {lastRefresh && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
              <Clock className="size-2.5" />
              <span>
                بروزرسانی خودکار هر ۵ دقیقه · آخرین بروزرسانی:{' '}
                {new Intl.DateTimeFormat('fa-IR', {
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(lastRefresh)}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

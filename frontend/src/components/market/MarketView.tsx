
import {Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis} from '@/lib/recharts-compat';
import React, { useState, useEffect, useMemo } from 'react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {TrendingUp, TrendingDown, Activity, BarChart3, Newspaper, CalendarDays, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, Info, Shield, Target, Zap, Clock, Globe, DollarSign, Loader2, RefreshCw} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Separator} from '@/components/ui/separator';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Skeleton} from '@/components/ui/skeleton';
import {useAppStore} from '@/lib/store';
import {usePageEvent} from '@/hooks/use-page-event';
import {useRealGoldPrice, getSourceLabel, getSourceColor} from '@/hooks/useRealGoldPrice';
import {cn} from '@/lib/utils';
import {useTranslation} from '@/lib/i18n';
import {formatToman} from '@/lib/helpers';

import {formatPrice, formatNumber, formatGrams} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Animation Variants                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Data — RSI, Moving Averages, Support/Resistance                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function generateRSIData(dateLocale: string) {
  const data = [];
  let rsi = 50;
  for (let i = 30; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = new Intl.DateTimeFormat(dateLocale, {
      month: 'short',
      day: 'numeric',
    }).format(d);
    rsi = Math.max(15, Math.min(85, rsi + (Math.random() - 0.48) * 12));
    data.push({
      date: label,
      rsi: Math.round(rsi * 10) / 10,
    });
  }
  return data;
}

function generateMovingAverageData(dateLocale: string, keys: { price: string; ma7: string; ma21: string; ma50: string }) {
  const data = [];
  let price = 34000000;
  for (let i = 30; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = new Intl.DateTimeFormat(dateLocale, {
      month: 'short',
      day: 'numeric',
    }).format(d);
    price += (Math.random() - 0.45) * 400000;
    const ma7 = price + (Math.random() - 0.5) * 300000;
    const ma21 = price + (Math.random() - 0.5) * 600000;
    const ma50 = price + (Math.random() - 0.5) * 1000000;
    data.push({
      date: label,
      [keys.price]: Math.round(price),
      [keys.ma7]: Math.round(ma7),
      [keys.ma21]: Math.round(ma21),
      [keys.ma50]: Math.round(ma50),
    });
  }
  return data;
}

interface SupportResistanceLevel {
  label: string;
  price: number;
  type: 'support' | 'resistance' | 'current';
  strength: 'strong' | 'medium' | 'weak';
}

function generateSupportResistance(): SupportResistanceLevel[] {
  return [
    { label: 'حمایت ۳', price: 32500000, type: 'support', strength: 'weak' },
    { label: 'حمایت ۲', price: 33200000, type: 'support', strength: 'medium' },
    { label: 'حمایت ۱', price: 33800000, type: 'support', strength: 'strong' },
    { label: 'قیمت فعلی', price: 34500000, type: 'current', strength: 'strong' },
    { label: 'مقاومت ۱', price: 35100000, type: 'resistance', strength: 'strong' },
    { label: 'مقاومت ۲', price: 35800000, type: 'resistance', strength: 'medium' },
    { label: 'مقاومت ۳', price: 36500000, type: 'resistance', strength: 'weak' },
  ];
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Data — Market News (Persian)                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  time: string;
  impact: 'high' | 'medium' | 'low';
  sentiment: 'positive' | 'negative' | 'neutral';
}

const MOCK_NEWS: NewsItem[] = [
  {
    id: 'n1',
    title: 'افزایش تقاضای جهانی طلا در سه ماهه سوم',
    summary: 'بر اساس گزارش شورای جهانی طلا، تقاضای جهانی طلا در سه ماهه سوم ۲.۵ درصد نسبت به مدت مشابه سال قبل افزایش یافته است.',
    source: 'خبرگزاری اقتصاد',
    time: '۲ ساعت پیش',
    impact: 'high',
    sentiment: 'positive',
  },
  {
    id: 'n2',
    title: 'تصمیم فدرال رزرو درباره نرخ بهره',
    summary: 'فدرال رزرو آمریکا نرخ بهره را بدون تغییر نگه داشت. تحلیلگران پیش‌بینی می‌کنند که در جلسه بعدی احتمال کاهش نرخ وجود دارد.',
    source: 'رویترز فارسی',
    time: '۴ ساعت پیش',
    impact: 'high',
    sentiment: 'neutral',
  },
  {
    id: 'n3',
    title: 'رشد قیمت سکه در بازار آزاد',
    summary: 'سکه تمام بهار آزادی در معاملات امروز بازار آزاد با افزایش ۱.۲ درصدی به قیمت ۸.۱۳ گرم طلا رسید.',
    source: 'کانال طلا و سکه',
    time: '۵ ساعت پیش',
    impact: 'medium',
    sentiment: 'positive',
  },
  {
    id: 'n4',
    title: 'کاهش ارزش دلار بر تقاضای طلا تأثیر گذاشت',
    summary: 'با کاهش ۰.۳ درصدی شاخص دلار در بازارهای جهانی، قیمت اونس طلا ۰.۸ درصد رشد کرد و به مرز ۲,۳۵۰ دلار نزدیک شد.',
    source: 'ایرنا',
    time: '۷ ساعت پیش',
    impact: 'medium',
    sentiment: 'positive',
  },
  {
    id: 'n5',
    title: 'هشدار کارشناسان درباره نوسانات بازار طلا',
    summary: 'کارشناسان بازار سرمایه هشدار دادند که با نزدیک شدن به انتخابات آمریکا، نوسانات بازار طلا ممکن است تشدید شود.',
    source: 'دنیای اقتصاد',
    time: '۱ روز پیش',
    impact: 'low',
    sentiment: 'negative',
  },
  {
    id: 'n6',
    title: 'خرید گسترده طلا توسط بانک‌های مرکزی',
    summary: 'بانک‌های مرکزی جهان در ۶ ماه اول سال ۲۰۲۴ بیش از ۴۸۵ تن طلا خریداری کردند که رکورد تاریخی محسوب می‌شود.',
    source: 'خبرگزاری طلای جهان',
    time: '۱ روز پیش',
    impact: 'high',
    sentiment: 'positive',
  },
  {
    id: 'n7',
    title: 'تحلیل فنی: سطوح کلیدی طلا برای هفته آینده',
    summary: 'تحلیلگران فنی معتقدند طلا در صورت عبور از مقاومت ۱۰.۱۸ گرم طلا می‌تواند تا ۱۰.۴۴ گرم طلا رشد کند.',
    source: 'تحلیل‌گر',
    time: '۲ روز پیش',
    impact: 'medium',
    sentiment: 'positive',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Data — Economic Calendar                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface CalendarEvent {
  id: string;
  title: string;
  country: string;
  date: string;
  time: string;
  impact: 'high' | 'medium' | 'low';
  previous: string;
  forecast: string;
  actual?: string;
}

const MOCK_CALENDAR: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'شاخص CPI آمریکا',
    country: 'آمریکا',
    date: '۱۴۰۳/۰۸/۱۵',
    time: '۱۴:۳۰',
    impact: 'high',
    previous: '۳.۲٪',
    forecast: '۳.۱٪',
  },
  {
    id: 'e2',
    title: 'نرخ بهره فدرال رزرو',
    country: 'آمریکا',
    date: '۱۴۰۳/۰۸/۱۸',
    time: '۲۰:۰۰',
    impact: 'high',
    previous: '۵.۵٪',
    forecast: '۵.۵٪',
  },
  {
    id: 'e3',
    title: 'تولید صنعتی اروپا',
    country: 'اروپا',
    date: '۱۴۰۳/۰۸/۱۲',
    time: '۱۱:۰۰',
    impact: 'medium',
    previous: '-۰.۳٪',
    forecast: '+۰.۱٪',
  },
  {
    id: 'e4',
    title: 'سفارشات کالاهای بادوام آمریکا',
    country: 'آمریکا',
    date: '۱۴۰۳/۰۸/۲۰',
    time: '۱۵:۰۰',
    impact: 'medium',
    previous: '+۲.۱٪',
    forecast: '+۱.۵٪',
  },
  {
    id: 'e5',
    title: 'شاخص PMI تولید چین',
    country: 'چین',
    date: '۱۴۰۳/۰۸/۱۰',
    time: '۰۳:۰۰',
    impact: 'medium',
    previous: '۵۰.۸',
    forecast: '۵۱.۲',
  },
  {
    id: 'e6',
    title: 'تورم مصرف‌کننده بریتانیا',
    country: 'بریتانیا',
    date: '۱۴۰۳/۰۸/۱۳',
    time: '۰۹:۰۰',
    impact: 'high',
    previous: '۴.۰٪',
    forecast: '۳.۸٪',
  },
  {
    id: 'e7',
    title: 'گزارش اشتغال NFP آمریکا',
    country: 'آمریکا',
    date: '۱۴۰۳/۰۸/۲۲',
    time: '۱۴:۳۰',
    impact: 'high',
    previous: '۱۸۷ هزار',
    forecast: '۱۷۰ هزار',
    actual: '۱۷۵ هزار',
  },
  {
    id: 'e8',
    title: 'نرخ بیکاری ژاپن',
    country: 'ژاپن',
    date: '۱۴۰۳/۰۸/۱۱',
    time: '۰۱:۳۰',
    impact: 'low',
    previous: '۲.۶٪',
    forecast: '۲.۵٪',
  },
  {
    id: 'e9',
    title: 'مزایده طلای بانک مرکزی',
    country: 'ایران',
    date: '۱۴۰۳/۰۸/۱۶',
    time: '۱۰:۰۰',
    impact: 'high',
    previous: '۳,۴۲۰,۰۰۰',
    forecast: '---',
  },
  {
    id: 'e10',
    title: 'جلسه اوپک پلاس',
    country: 'سازمان اوپک',
    date: '۱۴۰۳/۰۸/۲۵',
    time: '۱۸:۰۰',
    impact: 'medium',
    previous: '---',
    forecast: '---',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Data — Comparison Chart (Gold vs Silver vs Currency)                */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface ComparisonDataPoint {
  date: string;
  [key: string]: string | number;
}

function generateComparisonData(dateLocale: string): ComparisonDataPoint[] {
  const data: ComparisonDataPoint[] = [];
  let gold = 33000000;
  let silver = 850000;
  let dollar = 62000;

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = new Intl.DateTimeFormat(dateLocale, {
      month: 'short',
      day: 'numeric',
    }).format(d);

    gold += (Math.random() - 0.45) * 400000;
    silver += (Math.random() - 0.46) * 15000;
    dollar += (Math.random() - 0.48) * 500;

    data.push({
      date: label,
      طلا: Math.round(gold / 1000000 * 100) / 100,
      نقره: Math.round(silver / 1000),
      دلار: Math.round(dollar),
    });
  }
  return data;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Custom Tooltip for Charts                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function RSITooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  const { t } = useTranslation();
  if (!active || !payload || !payload.length) return null;
  const rsiVal = payload[0].value;
  let rsiLabel = t('market.neutral');
  let rsiColor = 'text-amber-500';
  if (rsiVal > 70) { rsiLabel = t('market.overbought'); rsiColor = 'text-red-500'; }
  else if (rsiVal < 30) { rsiLabel = t('market.oversold'); rsiColor = 'text-emerald-500'; }
  else if (rsiVal > 55) { rsiLabel = t('market.bullish'); rsiColor = 'text-emerald-500'; }
  else if (rsiVal < 45) { rsiLabel = t('market.bearish'); rsiColor = 'text-red-500'; }

  return (
    <div className="rounded-lg border border-gold/20 bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-gold">{formatNumber(rsiVal)}</p>
      <p className={`text-xs ${rsiColor}`}>{rsiLabel}</p>
    </div>
  );
}

function MATooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-gold/20 bg-card px-3 py-2 shadow-lg min-w-[140px]">
      <p className="mb-1.5 text-xs text-muted-foreground">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {formatToman(entry.value)}
        </p>
      ))}
    </div>
  );
}

function ComparisonTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-gold/20 bg-card px-3 py-2 shadow-lg min-w-[160px]">
      <p className="mb-1.5 text-xs text-muted-foreground">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper Functions                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getImpactColor(impact: 'high' | 'medium' | 'low') {
  switch (impact) {
    case 'high':
      return 'badge-danger-red';
    case 'medium':
      return 'badge-warning-amber';
    case 'low':
      return 'badge-success-green';
  }
}

function getImpactLabel(impact: 'high' | 'medium' | 'low', t: (key: string) => string) {
  switch (impact) {
    case 'high': return t('market.high');
    case 'medium': return t('market.medium');
    case 'low': return t('market.low');
  }
}

function getSentimentIcon(sentiment: 'positive' | 'negative' | 'neutral') {
  switch (sentiment) {
    case 'positive':
      return <TrendingUp className="size-3.5 text-emerald-500" />;
    case 'negative':
      return <TrendingDown className="size-3.5 text-red-500" />;
    case 'neutral':
      return <Activity className="size-3.5 text-amber-500" />;
  }
}

function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    'آمریکا': '🇺🇸',
    'اروپا': '🇪🇺',
    'چین': '🇨🇳',
    'بریتانیا': '🇬🇧',
    'ژاپن': '🇯🇵',
    'ایران': '🇮🇷',
    'سازمان اوپک': '🛢️',
  };
  return flags[country] || '🌍';
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeletons                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function IndicatorsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] md:h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

function NewsSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CalendarSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ComparisonSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[320px] md:h-[400px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub Components                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ── Trend Summary Cards ── */
function TrendSummaryCards() {
  const { goldPrice } = useAppStore();
  const { t } = useTranslation();
  const currentRSI = 58.3;
  const rsiSignal = currentRSI > 70 ? t('market.overbought') : currentRSI < 30 ? t('market.oversold') : currentRSI > 55 ? t('market.bullish') : t('market.bearish');
  const rsiColor = currentRSI > 70 ? 'text-red-500' : currentRSI < 30 ? 'text-emerald-500' : currentRSI > 55 ? 'text-emerald-500' : 'text-red-500';

  const priceVsMA = goldPrice?.buyPrice ? ((goldPrice.buyPrice - 34200000) / 34200000 * 100) : 0.8;
  const isAboveMA = priceVsMA > 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:gap-5 lg:grid-cols-4">
      {/* RSI Card */}
      <Card className="overflow-hidden card-gold-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold/10">
              <Activity className="size-5 text-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">{t('market.rsiIndex')}</p>
              <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">
                {formatNumber(currentRSI)}
              </p>
              <p className={`text-xs font-medium ${rsiColor}`}>{rsiSignal}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Moving Average Card */}
      <Card className="overflow-hidden card-gold-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
              <ArrowUpDown className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">{t('market.movingAverage')}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                {isAboveMA ? (
                  <ArrowUp className="size-3.5 text-emerald-500" />
                ) : (
                  <ArrowDown className="size-3.5 text-red-500" />
                )}
                <span className={`text-lg font-bold tabular-nums ${isAboveMA ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {isAboveMA ? '+' : ''}{formatNumber(Math.round(priceVsMA * 10) / 10)}٪
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Strength Card */}
      <Card className="overflow-hidden card-gold-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
              <Zap className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">{t('market.trendStrength')}</p>
              <p className="mt-0.5 text-xl font-bold text-foreground">{t('market.medium')}</p>
              <p className="text-[10px] text-muted-foreground">ADX: {formatNumber(28.5)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volatility Card */}
      <Card className="overflow-hidden card-gold-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/40">
              <Shield className="size-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">{t('market.volatility')}</p>
              <p className="mt-0.5 text-xl font-bold text-foreground">{t('market.normal')}</p>
              <p className="text-[10px] text-muted-foreground">Bollinger: {formatNumber(1.2)}٪</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── RSI Chart ── */
function RSIChartSection({ data }: { data: Array<{ date: string; rsi: number }> }) {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('14d');
  const filteredData = timeRange === '7d' ? data.slice(-7) : data.slice(-14);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <Activity className="size-4 text-gold" />
          {t('market.rsiTitle')}
        </CardTitle>
        <div className="flex gap-1.5">
          {[
            { key: '7d', label: t('chart.7d') },
            { key: '14d', label: t('market.14days') },
          ].map((range) => (
            <Button
              key={range.key}
              size="sm"
              variant={timeRange === range.key ? 'default' : 'outline'}
              className={
                timeRange === range.key
                  ? 'bg-gold text-gold-dark hover:bg-gold/90 text-xs'
                  : 'text-xs'
              }
              onClick={() => setTimeRange(range.key)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pb-6 pt-2">
        <div className="h-[220px] md:h-[300px] w-full chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="rsiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.08 85 / 15%)" vertical={false} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" strokeOpacity={0.5} />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="5 5" strokeOpacity={0.5} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'oklch(0.52 0.01 85)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: 'oklch(0.52 0.01 85)' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<RSITooltip />} />
              <Line
                type="monotone"
                dataKey="rsi"
                stroke="#D4AF37"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: '#D4AF37', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-center gap-6 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">{t('market.overbought70')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-gold" />
            <span className="text-muted-foreground">RSI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">{t('market.oversold30')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Moving Averages Chart ── */
function MovingAverageChartSection({ data }: { data: Array<Record<string, number | string>> }) {
  const { t } = useTranslation();
  const priceKey = t('market.price');
  const ma7Key = t('market.ma7');
  const ma21Key = t('market.ma21');
  const ma50Key = t('market.ma50');

  const [showMA, setShowMA] = useState<Record<string, boolean>>({
    ma7: true,
    ma21: true,
    ma50: true,
  });

  const maConfig = [
    { id: 'ma7', label: ma7Key, dataKey: ma7Key, color: '#D4AF37' },
    { id: 'ma21', label: ma21Key, dataKey: ma21Key, color: '#22c55e' },
    { id: 'ma50', label: ma50Key, dataKey: ma50Key, color: '#ef4444' },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <BarChart3 className="size-4 text-gold" />
          {t('market.movingAverages')}
        </CardTitle>
        <div className="flex flex-wrap gap-1.5">
          {maConfig.map((ma) => (
            <Button
              key={ma.id}
              size="sm"
              variant={showMA[ma.id] ? 'default' : 'outline'}
              className="text-xs"
              style={showMA[ma.id] ? { backgroundColor: ma.color, color: '#fff', borderColor: ma.color } : { borderColor: ma.color, color: ma.color }}
              onClick={() => setShowMA((prev) => ({ ...prev, [ma.id]: !prev[ma.id] }))}
            >
              {ma.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pb-6 pt-2">
        <div className="h-[280px] md:h-[360px] lg:h-[400px] w-full chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.08 85 / 15%)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'oklch(0.52 0.01 85)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'oklch(0.52 0.01 85)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`}
                width={45}
              />
              <Tooltip content={<MATooltip />} />
              <Line
                type="monotone"
                dataKey={priceKey}
                stroke="#D4AF37"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#D4AF37', stroke: '#fff', strokeWidth: 2 }}
              />
              {showMA['ma7'] && (
                <Line type="monotone" dataKey={ma7Key} stroke="#D4AF37" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              )}
              {showMA['ma21'] && (
                <Line type="monotone" dataKey={ma21Key} stroke="#22c55e" strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
              )}
              {showMA['ma50'] && (
                <Line type="monotone" dataKey={ma50Key} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="8 4" dot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Support / Resistance Levels ── */
function SupportResistanceSection({ levels }: { levels: SupportResistanceLevel[] }) {
  const { t } = useTranslation();
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <Target className="size-4 text-gold" />
          {t('market.supportResistance')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {levels.map((level, idx) => {
            const isCurrent = level.type === 'current';
            const isSupport = level.type === 'support';
            const isResistance = level.type === 'resistance';

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
                  isCurrent
                    ? 'border border-gold/30 bg-gold/5'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isCurrent
                      ? 'bg-gold/20 text-gold'
                      : isSupport
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                  }`}
                >
                  {isSupport ? <ArrowUp className="size-3.5" /> : isResistance ? <ArrowDown className="size-3.5" /> : <Activity className="size-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isCurrent ? 'text-gold' : 'text-foreground'}`}>
                      {level.label}
                    </span>
                    {isCurrent && (
                      <Badge className="badge-gold text-[10px]">{t('market.current')}</Badge>
                    )}
                    {!isCurrent && isSupport && (
                      <Badge className="badge-success-green text-[10px]">{t('market.support')}</Badge>
                    )}
                    {!isCurrent && isResistance && (
                      <Badge className="badge-danger-red text-[10px]">{t('market.resistance')}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{t('market.strength')}: {level.strength === 'strong' ? t('market.strong') : level.strength === 'medium' ? t('market.medium') : t('market.weak')}</span>
                  </div>
                </div>
                <span className={`text-sm font-bold tabular-nums ${isCurrent ? 'text-gold' : isSupport ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {formatToman(level.price)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── News Feed ── */
function NewsFeedSection() {
  const { t, locale } = useTranslation();
  const [news, setNews] = useState<NewsItem[]>(MOCK_NEWS);
  const [blogPosts, setBlogPosts] = useState<Array<{
    id: string;
    title: string;
    excerpt: string;
    category: { name: string; color: string } | null;
    publishedAt: string;
    slug: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(4);
  const { setPage, setBlogPostSlug } = useAppStore();

  useEffect(() => {
    async function fetchBlogPosts() {
      try {
        const res = await fetch('/api/blog/posts?limit=10');
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const list = data.posts || data || [];
        if (Array.isArray(list) && list.length > 0) {
          setBlogPosts(list);
          const dateLocale = locale === 'fa' ? 'fa-IR' : 'en-US';
          const blogNews: NewsItem[] = list.slice(0, 5).map((post: any, idx: number) => ({
            id: `blog-${post.id}`,
            title: post.title,
            summary: post.excerpt || '',
            source: post.category?.name || 'Zarrin Gold Blog',
            time: (() => {
              try {
                return new Intl.DateTimeFormat(dateLocale, { month: 'short', day: 'numeric' }).format(new Date(post.publishedAt));
              } catch {
                return post.publishedAt;
              }
            })(),
            impact: idx === 0 ? 'high' as const : (idx < 3 ? 'medium' as const : 'low' as const),
            sentiment: (['positive', 'neutral', 'positive', 'positive', 'neutral'] as const)[idx % 5],
            slug: post.slug,
          }));
          const merged: NewsItem[] = [];
          const maxLen = Math.max(blogNews.length, MOCK_NEWS.length);
          for (let i = 0; i < maxLen; i++) {
            if (i < blogNews.length) merged.push(blogNews[i]);
            if (i < MOCK_NEWS.length) merged.push(MOCK_NEWS[i]);
          }
          setNews(merged);
        }
      } catch {
        setNews(MOCK_NEWS);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogPosts();
  }, [locale]);

  const visible = news.slice(0, visibleCount);
  const hasMore = visibleCount < news.length;

  if (loading) return <NewsSkeleton />;

  const handleClick = (item: NewsItem) => {
    if ('slug' in item && (item as any).slug) {
      setBlogPostSlug((item as any).slug);
      setPage('landing');
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <Newspaper className="size-4 text-gold" />
          {t('market.goldMarketNews')}
        </CardTitle>
        <Badge className="badge-gold text-xs">
          {formatNumber(news.length)} {t('market.news')}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visible.map((item) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => handleClick(item)}
              className="group cursor-pointer rounded-xl border border-border/50 p-4 transition-all hover:border-gold/20 hover:shadow-sm hover:bg-gold/[0.02] hover-lift-sm"
            >
              <div className="flex gap-3">
                <div className="mt-0.5 shrink-0">{getSentimentIcon(item.sentiment)}</div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold leading-relaxed text-foreground group-hover:text-gold transition-colors">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {item.summary}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className={`${getImpactColor(item.impact)} text-[10px] px-2 py-0`}>
                      {getImpactLabel(item.impact, t)}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{item.source}</span>
                    <span className="text-[10px] text-muted-foreground/60">·</span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-gold">
                      <Clock className="size-2.5" />
                      {item.time}
                    </span>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
        {hasMore && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-gold border-gold/30 hover:bg-gold/5"
              onClick={() => setVisibleCount((prev) => prev + 3)}
            >
              {t('common.viewAll')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Economic Calendar ── */
function EconomicCalendarSection({ events }: { events: CalendarEvent[] }) {
  const { t } = useTranslation();
  const [filterImpact, setFilterImpact] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const filtered = filterImpact === 'all' ? events : events.filter((e) => e.impact === filterImpact);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <CalendarDays className="size-4 text-gold" />
          تقویم اقتصادی
        </CardTitle>
        <div className="flex gap-1.5">
          {[
            { key: 'all' as const, label: t('common.all') },
            { key: 'high' as const, label: t('market.high') },
            { key: 'medium' as const, label: t('market.medium') },
            { key: 'low' as const, label: t('market.low') },
          ].map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filterImpact === f.key ? 'default' : 'outline'}
              className={
                filterImpact === f.key
                  ? 'bg-gold text-gold-dark hover:bg-gold/90 text-xs'
                  : 'text-xs'
              }
              onClick={() => setFilterImpact(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[500px] space-y-2 overflow-y-auto">
          {filtered.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-2 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-4 table-row-hover-gold"
            >
              {/* Flag + Date/Time */}
              <div className="flex items-center gap-2 sm:w-36 shrink-0">
                <span className="text-lg">{getCountryFlag(event.country)}</span>
                <div>
                  <p className="text-xs font-medium text-foreground">{event.date}</p>
                  <p className="text-[10px] text-muted-foreground">{event.time}</p>
                </div>
              </div>

              <Separator orientation="vertical" className="hidden h-8 sm:block" />

              {/* Event Title */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{event.title}</p>
                <p className="text-[10px] text-muted-foreground">{event.country}</p>
              </div>

              {/* Impact Badge */}
              <Badge className={`${getImpactColor(event.impact)} text-[10px] shrink-0`}>
                {getImpactLabel(event.impact, t)}
              </Badge>

              {/* Previous */}
              <div className="hidden sm:block shrink-0">
                <p className="text-[10px] text-muted-foreground">قبلی</p>
                <p className="text-xs font-medium tabular-nums text-foreground">{event.previous}</p>
              </div>

              {/* Forecast */}
              <div className="hidden sm:block shrink-0">
                <p className="text-[10px] text-muted-foreground">پیش‌بینی</p>
                <p className="text-xs font-medium tabular-nums text-gold">{event.forecast}</p>
              </div>

              {/* Actual */}
              {event.actual && (
                <div className="hidden sm:block shrink-0">
                  <p className="text-[10px] text-muted-foreground">واقعی</p>
                  <p className="text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{event.actual}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Comparison Chart ── */
function ComparisonChartSection({ data }: { data: ComparisonDataPoint[] }) {
  const [activeSeries, setActiveSeries] = useState<Record<string, boolean>>({
    طلا: true,
    نقره: true,
    دلار: true,
  });
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <Globe className="size-4 text-gold" />
          مقایسه قیمت طلا، نقره و دلار
        </CardTitle>
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: 'طلا', color: '#D4AF37' },
            { key: 'نقره', color: '#9CA3AF' },
            { key: 'دلار', color: '#22c55e' },
          ].map((s) => (
            <Button
              key={s.key}
              size="sm"
              variant={activeSeries[s.key] ? 'default' : 'outline'}
              className="text-xs"
              style={activeSeries[s.key] ? { backgroundColor: s.color, color: s.key === 'نقره' ? '#000' : '#fff', borderColor: s.color } : { borderColor: s.color, color: s.color }}
              onClick={() => setActiveSeries((prev) => ({ ...prev, [s.key]: !prev[s.key] }))}
            >
              {s.key}
            </Button>
          ))}
          <Separator orientation="vertical" className="hidden h-6 sm:block mx-1" />
          <Button
            size="sm"
            variant={chartType === 'area' ? 'default' : 'outline'}
            className={chartType === 'area' ? 'bg-gold text-gold-dark hover:bg-gold/90 text-xs' : 'text-xs'}
            onClick={() => setChartType('area')}
          >
            سطحی
          </Button>
          <Button
            size="sm"
            variant={chartType === 'bar' ? 'default' : 'outline'}
            className={chartType === 'bar' ? 'bg-gold text-gold-dark hover:bg-gold/90 text-xs' : 'text-xs'}
            onClick={() => setChartType('bar')}
          >
            ستونی
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-6 pt-2">
        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-2.5 rounded-full bg-[#D4AF37]" /> طلا: میلیون گرم طلا</span>
          <span className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-2.5 rounded-full bg-[#9CA3AF]" /> نقره: هزار گرم طلا</span>
          <span className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-2.5 rounded-full bg-[#22c55e]" /> دلار: گرم طلا</span>
        </div>

        <div className="h-[320px] md:h-[400px] lg:h-[450px] w-full chart-container">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="silverAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9CA3AF" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#9CA3AF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dollarAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.08 85 / 15%)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'oklch(0.52 0.01 85)' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'oklch(0.52 0.01 85)' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<ComparisonTooltip />} />
                {activeSeries['طلا'] && (
                  <Area type="monotone" dataKey="طلا" stroke="#D4AF37" strokeWidth={2.5} fill="url(#goldAreaGrad)" dot={false} />
                )}
                {activeSeries['نقره'] && (
                  <Area type="monotone" dataKey="نقره" stroke="#9CA3AF" strokeWidth={2} fill="url(#silverAreaGrad)" dot={false} />
                )}
                {activeSeries['دلار'] && (
                  <Area type="monotone" dataKey="دلار" stroke="#22c55e" strokeWidth={2} fill="url(#dollarAreaGrad)" dot={false} />
                )}
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.08 85 / 15%)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'oklch(0.52 0.01 85)' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'oklch(0.52 0.01 85)' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<ComparisonTooltip />} />
                {activeSeries['طلا'] && (
                  <Bar dataKey="طلا" fill="#D4AF37" radius={[2, 2, 0, 0]} opacity={0.8} />
                )}
                {activeSeries['نقره'] && (
                  <Bar dataKey="نقره" fill="#9CA3AF" radius={[2, 2, 0, 0]} opacity={0.7} />
                )}
                {activeSeries['دلار'] && (
                  <Bar dataKey="دلار" fill="#22c55e" radius={[2, 2, 0, 0]} opacity={0.7} />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Market Overview Bar ── */
function MarketOverviewBar() {
  const { prices: realPrices, isLive, source: priceSource, isLoading: pricesLoading, refresh } = useRealGoldPrice();

  const fmtFa = (n: number) => new Intl.NumberFormat('fa-IR').format(n);

  const overviewData = [
    {
      label: 'طلای ۱۸ عیار',
      value: realPrices.geram18 ? `${fmtFa(realPrices.geram18)} گرم طلا` : '---',
      change: '+۱.۲٪',
      isUp: true,
    },
    {
      label: 'سکه امامی',
      value: realPrices.sekkehEmami ? `${fmtFa(realPrices.sekkehEmami)} گرم طلا` : '---',
      change: '+۰.۸٪',
      isUp: true,
    },
    {
      label: 'اونس جهانی',
      value: realPrices.ounceUsd ? `$${fmtFa(realPrices.ounceUsd)}` : '---',
      change: '+۰.۵٪',
      isUp: true,
    },
    {
      label: 'دلار',
      value: realPrices.dollar ? `${fmtFa(realPrices.dollar)} گرم طلا` : '---',
      change: '-۰.۳٪',
      isUp: false,
    },
  ];

  return (
    <Card className="overflow-hidden card-gold-border bg-gradient-to-l from-gold/5 via-card to-gold/5">
      <CardContent className="p-4">
        {/* Header row: title + live indicator + refresh */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">بازار</span>
            {isLive && (
              <span className="flex items-center gap-1">
                <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">زنده</span>
              </span>
            )}
            <span className={`text-[10px] ${getSourceColor(priceSource)}`}>
              ({getSourceLabel(priceSource)})
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-gold"
            onClick={refresh}
            disabled={pricesLoading}
          >
            {pricesLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            بروزرسانی
          </Button>
        </div>
        {/* Price items */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          {overviewData.map((item, idx) => (
            <React.Fragment key={item.label}>
              <div className="flex flex-col items-center gap-0.5 text-center">
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
                <span className="text-sm font-bold tabular-nums text-gold-gradient">{item.value}</span>
                <span className={`text-xs font-medium tabular-nums ${item.isUp ? 'text-success-gradient' : 'text-danger-gradient'}`}>
                  {item.isUp ? <ArrowUp className="inline size-3 mb-0.5" /> : <ArrowDown className="inline size-3 mb-0.5" />}
                  {item.change}
                </span>
              </div>
              {idx < overviewData.length - 1 && (
                <Separator orientation="vertical" className="hidden h-10 sm:block" />
              )}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main MarketView Component                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function MarketView() {
  const { goldPrice, priceHistory, addToast } = useAppStore();
  const { t, locale } = useTranslation();

  /* ── Loading State ── */
  const [isLoading, setIsLoading] = useState(true);
  const [activeMarketTab, setActiveMarketTab] = useState('indicators');

  /* ── Generated Data ── */
  const [rsiData, setRsiData] = useState<Array<{ date: string; rsi: number }>>([]);
  const [maData, setMaData] = useState<Array<Record<string, number | string>>>([]);
  const [supportResistance, setSupportResistance] = useState<SupportResistanceLevel[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonDataPoint[]>([]);

  /* ── Quick Action Event Listeners ── */
  usePageEvent('refresh', () => { addToast('داده‌ها به‌روزرسانی شد', 'success'); });

  /* ── Generate Mock Data on Mount ── */
  useEffect(() => {
    const dateLocale = locale === 'fa' ? 'fa-IR' : 'en-US';
    const maKeys = {
      price: t('market.price'),
      ma7: t('market.ma7'),
      ma21: t('market.ma21'),
      ma50: t('market.ma50'),
    };

    const timer = setTimeout(() => {
      setRsiData(generateRSIData(dateLocale));
      setMaData(generateMovingAverageData(dateLocale, maKeys));
      setSupportResistance(generateSupportResistance());
      setComparisonData(generateComparisonData(dateLocale));
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [locale, t]);

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                  */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <motion.div
      className="mx-auto max-w-6xl space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ──────────────────────────────────────────────────────── */}
      {/*  Market Overview Bar                                     */}
      {/* ──────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <MarketOverviewBar />
      </motion.div>

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Main Content Tabs                                       */}
      {/* ──────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeMarketTab} onValueChange={setActiveMarketTab} className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-4 sm:w-auto sm:inline-grid">
            <TabsTrigger value="indicators" className={cn("text-xs sm:text-sm gap-1.5", activeMarketTab === "indicators" && "tab-active-gold")}>
              <Activity className="size-3.5 hidden sm:block" />
              شاخص‌ها
            </TabsTrigger>
            <TabsTrigger value="news" className={cn("text-xs sm:text-sm gap-1.5", activeMarketTab === "news" && "tab-active-gold")}>
              <Newspaper className="size-3.5 hidden sm:block" />
              اخبار
            </TabsTrigger>
            <TabsTrigger value="calendar" className={cn("text-xs sm:text-sm gap-1.5", activeMarketTab === "calendar" && "tab-active-gold")}>
              <CalendarDays className="size-3.5 hidden sm:block" />
              تقویم اقتصادی
            </TabsTrigger>
            <TabsTrigger value="comparison" className={cn("text-xs sm:text-sm gap-1.5", activeMarketTab === "comparison" && "tab-active-gold")}>
              <Globe className="size-3.5 hidden sm:block" />
              مقایسه قیمت
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Technical Indicators ── */}
          <TabsContent value="indicators" className="mt-6 space-y-6">
            {isLoading ? (
              <IndicatorsSkeleton />
            ) : (
              <>
                {/* Summary Cards */}
                <TrendSummaryCards />

                {/* RSI + Moving Averages Row */}
                <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
                  <RSIChartSection data={rsiData} />
                  <MovingAverageChartSection data={maData} />
                </div>

                {/* Support / Resistance */}
                <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
                  <SupportResistanceSection levels={supportResistance} />
                  {/* Market Analysis Info */}
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base font-bold">
                        <Info className="size-4 text-gold" />
                        تحلیل کلی بازار
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            <TrendingUp className="size-4 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">روند صعودی کوتاه‌مدت</p>
                            <p className="text-xs text-muted-foreground">شاخص RSI بالای ۵۰ و میانگین ۷ روزه بالاتر از ۲۱ روزه، نشان‌دهنده ادامه روند صعودی در کوتاه‌مدت است.</p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            <Shield className="size-4 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">سطح مقاومت مهم</p>
                            <p className="text-xs text-muted-foreground">سطح ۳۵,۱۰۰,۰۰۰ یک مقاومت کلیدی محسوب می‌شود. عبور از این سطح می‌تواند سیگنال خرید قوی باشد.</p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            <Zap className="size-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">هشدار نوسان</p>
                            <p className="text-xs text-muted-foreground">با توجه به تقارب با ۳۵,۱۰۰,۰۰۰ و نوسانات اخیر، ریسک نزول کوتاه‌مدت وجود دارد.</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Tab: News ── */}
          <TabsContent value="news" className="mt-6 space-y-6">
            <NewsFeedSection />
          </TabsContent>

          {/* ── Tab: Economic Calendar ── */}
          <TabsContent value="calendar" className="mt-6 space-y-6">
            <EconomicCalendarSection events={MOCK_CALENDAR} />
          </TabsContent>

          {/* ── Tab: Comparison ── */}
          <TabsContent value="comparison" className="mt-6 space-y-6">
            {isLoading ? (
              <ComparisonSkeleton />
            ) : (
              <ComparisonChartSection data={comparisonData} />
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

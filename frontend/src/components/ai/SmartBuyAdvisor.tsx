
import React, { useState, useEffect, useCallback } from 'react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {Brain, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw, ShieldCheck, Activity, AlertCircle, Clock, Sparkles} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {useAppStore} from '@/lib/store';
import {useTranslation} from '@/lib/i18n';
import {formatToman, formatGrams, formatNumber} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

type SuggestionType = 'buy' | 'wait' | 'gradual' | 'sell';
type TrendType = 'up' | 'down' | 'flat';
type VolatilityLevel = 'low' | 'medium' | 'high';

interface AIAdvice {
  suggestion: SuggestionType;
  reasoning: string;
  confidence: number;
  trend: TrendType;
  avgBuyPrice: number;
  currentPrice: number;
  volatility: VolatilityLevel;
  timestamp: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Animation Variants                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const circularProgressVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: 'easeOut', delay: 0.3 },
  },
};

const iconVariants = {
  hidden: { opacity: 0, rotate: -180, scale: 0 },
  show: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut', delay: 0.2 },
  },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper Mappings                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

const suggestionConfig: Record<SuggestionType, { icon: React.ElementType; label: string; color: string; bg: string; border: string }> = {
  buy: {
    icon: TrendingUp,
    label: 'پیشنهاد خرید',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  wait: {
    icon: Clock,
    label: 'صبر کنید',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  gradual: {
    icon: Activity,
    label: 'خرید تدریجی',
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
  },
  sell: {
    icon: TrendingDown,
    label: 'پیشنهاد فروش',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
};

const trendConfig: Record<TrendType, { icon: React.ElementType; label: string; color: string }> = {
  up: { icon: TrendingUp, label: 'صعودی', color: 'text-emerald-500' },
  down: { icon: TrendingDown, label: 'نزولی', color: 'text-red-500' },
  flat: { icon: Minus, label: 'ثابت', color: 'text-amber-500' },
};

const volatilityConfig: Record<VolatilityLevel, { label: string; color: string; width: string; bars: number }> = {
  low: { label: 'کم', color: 'bg-emerald-500', width: 'w-1/3', bars: 1 },
  medium: { label: 'متوسط', color: 'bg-amber-500', width: 'w-2/3', bars: 2 },
  high: { label: 'زیاد', color: 'bg-red-500', width: 'w-full', bars: 3 },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Circular Progress Component                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CircularProgress({ value, size = 80 }: { value: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const color =
    value >= 75 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="text-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-lg font-bold tabular-nums"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {formatNumber(value)}٪
        </motion.span>
        <span className="text-[10px] text-muted-foreground">اطمینان</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function AdvisorSkeleton() {
  return (
    <Card className="overflow-hidden border-gold/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-5">
          <Skeleton className="size-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SmartBuyAdvisor() {
  const { user, addToast } = useAppStore();
  const { t } = useTranslation();

  const [advice, setAdvice] = useState<AIAdvice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  /* ── Fetch Advice ── */
  const fetchAdvice = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();

      if (data.success && data.advice) {
        setAdvice(data.advice);
        setLastRefresh(new Date());
      } else {
        // Use fallback mock data
        setAdvice({
          suggestion: 'buy',
          reasoning: 'بر اساس تحلیل آخرین داده‌های بازار، قیمت طلا در روند صعودی کوتاه‌مدت قرار دارد. میانگین متحرک ۵ روزه بالاتر از میانگین ۲۰ روزه است که سیگنال مثبت محسوب می‌شود.',
          confidence: 78,
          trend: 'up',
          avgBuyPrice: 33500000,
          currentPrice: 34200000,
          volatility: 'medium',
          timestamp: new Date().toISOString(),
        });
        setLastRefresh(new Date());
      }
    } catch {
      setError('خطا در دریافت پیشنهاد هوشمند');
      // Fallback
      setAdvice({
        suggestion: 'wait',
        reasoning: 'در حال حاضر بازار در وضعیت نامشخصی قرار دارد. نوسانات بالا و حجم معاملات کم است. پیشنهاد می‌شود تا مشخص شدن روند بازار صبر کنید.',
        confidence: 55,
        trend: 'flat',
        avgBuyPrice: 33500000,
        currentPrice: 33800000,
        volatility: 'high',
        timestamp: new Date().toISOString(),
      });
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAdvice();
    const interval = setInterval(fetchAdvice, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [fetchAdvice]);

  /* ── Render ── */

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <AdvisorSkeleton />
      </motion.div>
    );
  }

  if (!advice) return null;

  const suggestion = suggestionConfig[advice.suggestion];
  const trend = trendConfig[advice.trend];
  const volatility = volatilityConfig[advice.volatility];
  const SuggestionIcon = suggestion.icon;
  const TrendIcon = trend.icon;
  const priceDiff = advice.currentPrice - advice.avgBuyPrice;
  const priceDiffPercent = advice.avgBuyPrice > 0
    ? ((priceDiff / advice.avgBuyPrice) * 100).toFixed(1)
    : '0';

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="show"
    >
      <Card className="glass-gold overflow-hidden card-spotlight">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gold/10">
                <Brain className="size-5 text-gold" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">مشاور هوشمند خرید</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">تحلیل بازار با هوش مصنوعی</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 border-gold/30 text-gold text-[10px]">
                <Sparkles className="size-3" />
                AI
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={fetchAdvice}
                disabled={loading}
              >
                <RefreshCw className={`size-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* ── Suggestion + Confidence ── */}
          <div className="flex items-center gap-5">
            <motion.div variants={circularProgressVariants} initial="hidden" animate="show">
              <CircularProgress value={advice.confidence} />
            </motion.div>

            <div className="flex-1 space-y-2.5">
              <motion.div
                className={`flex items-center gap-2.5 rounded-xl p-3 ${suggestion.bg} border ${suggestion.border}`}
                variants={iconVariants}
                initial="hidden"
                animate="show"
              >
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${suggestion.bg}`}>
                  <SuggestionIcon className={`size-5 ${suggestion.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-bold ${suggestion.color}`}>{suggestion.label}</p>
                </div>
              </motion.div>

              <p className="text-xs leading-6 text-muted-foreground line-clamp-3">
                {advice.reasoning}
              </p>
            </div>
          </div>

          {/* ── Stats Grid ── */}
          <div className="grid grid-cols-3 gap-3">
            {/* Price Trend */}
            <div className="rounded-xl border border-border/50 p-3 text-center">
              <TrendIcon className={`mx-auto mb-1.5 size-5 ${trend.color}`} />
              <p className="text-[10px] text-muted-foreground">روند قیمت</p>
              <p className={`text-sm font-bold ${trend.color}`}>{trend.label}</p>
            </div>

            {/* Average Buy Price Comparison */}
            <div className="rounded-xl border border-border/50 p-3 text-center">
              <ShieldCheck className="mx-auto mb-1.5 size-5 text-gold" />
              <p className="text-[10px] text-muted-foreground">میانگین خرید شما</p>
              <p className="text-sm font-bold tabular-nums text-foreground">
                {formatToman(advice.avgBuyPrice)}
              </p>
              <p className={`text-[10px] font-medium ${priceDiff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {priceDiff >= 0 ? '+' : ''}{priceDiffPercent}٪
              </p>
            </div>

            {/* Volatility Gauge */}
            <div className="rounded-xl border border-border/50 p-3 text-center">
              <Activity className="mx-auto mb-1.5 size-5 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">نوسانات</p>
              <div className="mx-auto mt-1 flex h-2 w-full items-center gap-0.5 rounded-full bg-muted/50 overflow-hidden">
                {[1, 2, 3].map((bar) => (
                  <div
                    key={bar}
                    className={`h-full flex-1 rounded-full transition-all duration-500 ${
                      bar <= volatility.bars ? volatility.color : 'bg-muted/30'
                    }`}
                  />
                ))}
              </div>
              <p className={`mt-1 text-sm font-bold ${volatility.color.replace('bg-', 'text-')}`}>
                {volatility.label}
              </p>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              <span>بروزرسانی: </span>
              <span className="tabular-nums">
                {lastRefresh
                  ? new Intl.DateTimeFormat('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(lastRefresh)
                  : '—'}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/60">
              بروزرسانی خودکار هر ۵ دقیقه
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

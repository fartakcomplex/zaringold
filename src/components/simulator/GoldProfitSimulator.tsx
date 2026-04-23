'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
// recharts removed — using CSS-based chart alternatives
import {
  TrendingUp,
  Coins,
  PiggyBank,
  Banknote,
  Share2,
  ArrowUpLeft,
  ArrowDownRight,
  Sparkles,
  Timer,
  BarChart3,
  Check,
  Copy,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from '@/lib/i18n';
import { useQuickAction } from '@/hooks/useQuickAction';
import { useAppStore } from '@/lib/store';
import { formatNumber, formatToman, formatGrams } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CURRENT_PRICE = 3_500_000; // toman per gram
const BANK_RATE_ANNUAL = 0.23;
const INFLATION_RATE_ANNUAL = 0.35;

const QUICK_AMOUNTS = [
  { label: '۱M', value: 1_000_000 },
  { label: '۵M', value: 5_000_000 },
  { label: '۱۰M', value: 10_000_000 },
  { label: '۵۰M', value: 50_000_000 },
  { label: '۱۰۰M', value: 100_000_000 },
  { label: '۵۰۰M', value: 500_000_000 },
];

const TIME_OPTIONS = [
  { label: '۱ ماه', months: 1 },
  { label: '۳ ماه', months: 3 },
  { label: '۶ ماه', months: 6 },
  { label: '۱ سال', months: 12 },
  { label: '۲ سال', months: 24 },
  { label: '۳ سال', months: 36 },
  { label: '۵ سال', months: 60 },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Seeded Random Number Generator (deterministic per session)               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Price History Generator                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface PricePoint {
  month: number;
  price: number;
}

function generatePriceHistory(months: number, seed: number = 42): PricePoint[] {
  const rng = createSeededRandom(seed);
  const monthlyVolatility = 0.03;
  const monthlyDrift = 0.015;
  const prices: PricePoint[] = [{ month: 0, price: CURRENT_PRICE }];

  for (let i = 1; i <= months; i++) {
    const randomReturn = (rng() - 0.5) * 2 * monthlyVolatility + monthlyDrift;
    const prevPrice = prices[i - 1].price;
    prices.push({ month: i, price: prevPrice * (1 + randomReturn) });
  }

  // Reverse so prices[0] is the start (months ago) and prices[months] is now
  return prices.reverse().map((p, idx) => ({ month: idx, price: p.price }));
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Chart Data Generator                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface ChartDataPoint {
  month: number;
  gold: number;
  bank: number;
  inflation: number;
  label: string;
}

function generateChartData(
  investment: number,
  months: number,
  priceHistory: PricePoint[],
): ChartDataPoint[] {
  const startPrice = priceHistory[0]?.price ?? CURRENT_PRICE;
  const gramsBought = investment / startPrice;
  const bankMonthly = 1 + BANK_RATE_ANNUAL / 12;
  const inflationMonthly = 1 + INFLATION_RATE_ANNUAL / 12;

  return priceHistory.map((p, idx) => {
    const goldValue = gramsBought * p.price;
    const bankValue = investment * Math.pow(bankMonthly, idx);
    const inflationValue = investment / Math.pow(inflationMonthly, idx);

    return {
      month: idx,
      gold: Math.round(goldValue),
      bank: Math.round(bankValue),
      inflation: Math.round(inflationValue),
      label: idx === 0 ? t_chart_label_now() : t_chart_label_month(idx),
    };
  });
}

// Standalone label functions (avoid hook issues inside pure functions)
function t_chart_label_now() {
  return typeof window !== 'undefined'
    ? new Intl.DateTimeFormat('fa-IR', { month: 'short', year: '2-digit' }).format(new Date())
    : 'الان';
}

function t_chart_label_month(monthsAgo: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return new Intl.DateTimeFormat('fa-IR', { month: 'short', year: '2-digit' }).format(d);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Animated Counter Hook                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function useAnimatedCounter(target: number, duration: number = 800, enabled: boolean = true) {
  const [displayValue, setDisplayValue] = useState(enabled ? 0 : target);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    startTimeRef.current = 0;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, enabled]);

  return displayValue;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Animation Variants                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

const fadeSlideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CSS-Based Growth Chart Component                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CSSGrowthChart({ data, investmentAmount }: { data: ChartDataPoint[]; investmentAmount: number }) {
  const maxVal = Math.max(...data.map((d) => Math.max(d.gold, d.bank, d.inflation)), 1);
  const latestGold = data[data.length - 1]?.gold ?? 0;
  const latestBank = data[data.length - 1]?.bank ?? 0;
  const latestInflation = data[data.length - 1]?.inflation ?? 0;
  return (
    <div className="space-y-4">
      <div className="relative h-px w-full bg-border/50">
        <div className="absolute -top-2 left-0 text-[9px] text-muted-foreground">سرمایه اولیه: {formatToman(investmentAmount)}</div>
      </div>
      <div className="space-y-1">
        {data.slice(-8).map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-[10px] text-right text-muted-foreground">{item.label}</span>
            <div className="flex-1 h-2.5 rounded-full bg-muted/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold to-amber-500"
                style={{ width: `${(item.gold / maxVal) * 100}%`, transition: 'width 0.5s ease' }}
                title={`طلا: ${formatToman(item.gold)}`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2">
        <div className="rounded-lg bg-gold/10 p-2 text-center">
          <span className="text-[10px] text-muted-foreground">طلا</span>
          <p className="text-xs font-bold text-gold">{formatToman(latestGold)}</p>
          <p className="text-[9px] text-emerald-500">+{((latestGold - investmentAmount) / investmentAmount * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-2 text-center">
          <span className="text-[10px] text-muted-foreground">بانک</span>
          <p className="text-xs font-bold text-gray-600 dark:text-gray-300">{formatToman(latestBank)}</p>
          <p className="text-[9px] text-emerald-500">+{((latestBank - investmentAmount) / investmentAmount * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2 text-center">
          <span className="text-[10px] text-muted-foreground">تورم</span>
          <p className="text-xs font-bold text-red-500">{formatToman(latestInflation)}</p>
          <p className="text-[9px] text-red-400">-{((investmentAmount - latestInflation) / investmentAmount * 100).toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Gold Coin SVG                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function GoldCoinEmoji() {
  return (
    <motion.div
      className="relative inline-flex items-center justify-center"
      animate={{ rotateY: [0, 360] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
    >
      <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-700 text-5xl shadow-[0_0_40px_rgba(212,175,55,0.4)] sm:size-24 sm:text-6xl">
        🪙
      </div>
      {/* Glow ring */}
      <div className="absolute inset-0 animate-ping rounded-full bg-gold/10" style={{ animationDuration: '3s' }} />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function GoldProfitSimulator() {
  const { t } = useTranslation();
  const { setPage, addToast } = useAppStore();

  /* ── State ── */
  const [investmentAmount, setInvestmentAmount] = useState(50_000_000);
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [copied, setCopied] = useState(false);

  /* ── Mark interacted when user changes values ── */
  const handleAmountChange = useCallback((val: number) => {
    setInvestmentAmount(val);
    setHasInteracted(true);
  }, []);

  const handleMonthSelect = useCallback((months: number) => {
    setSelectedMonths(months);
    setHasInteracted(true);
  }, []);

  /* ── Price History (stable per months) ── */
  const priceHistory = useMemo(
    () => generatePriceHistory(selectedMonths, 42),
    [selectedMonths],
  );

  /* ── Simulation Calculations ── */
  const simulation = useMemo(() => {
    const startPrice = priceHistory[0]?.price ?? CURRENT_PRICE;
    const endPrice = priceHistory[priceHistory.length - 1]?.price ?? CURRENT_PRICE;
    const gramsBought = investmentAmount / startPrice;
    const currentValue = gramsBought * endPrice;
    const netProfit = currentValue - investmentAmount;
    const profitPercent = investmentAmount > 0 ? (netProfit / investmentAmount) * 100 : 0;

    // Bank deposit return
    const bankReturn =
      investmentAmount * Math.pow(1 + BANK_RATE_ANNUAL / 12, selectedMonths) - investmentAmount;

    // Inflation loss (purchasing power loss)
    const inflationLoss =
      investmentAmount - investmentAmount / Math.pow(1 + INFLATION_RATE_ANNUAL / 12, selectedMonths);

    const betterThanBank = Math.abs(netProfit - bankReturn);

    return {
      gramsBought,
      currentValue,
      netProfit,
      profitPercent,
      bankReturn,
      inflationLoss,
      betterThanBank,
      startPrice,
      endPrice,
    };
  }, [investmentAmount, selectedMonths, priceHistory]);

  /* ── Chart Data ── */
  const chartData = useMemo(
    () => generateChartData(investmentAmount, selectedMonths, priceHistory),
    [investmentAmount, selectedMonths, priceHistory],
  );

  /* ── Animated Counters ── */
  const animatedGold = useAnimatedCounter(Math.round(simulation.gramsBought * 100), 700, hasInteracted);
  const animatedCurrentValue = useAnimatedCounter(Math.round(simulation.currentValue), 900, hasInteracted);
  const animatedProfit = useAnimatedCounter(Math.round(simulation.netProfit), 900, hasInteracted);
  const animatedBetterThanBank = useAnimatedCounter(Math.round(simulation.betterThanBank), 800, hasInteracted);

  /* ── Derived display values ── */
  const displayGrams = hasInteracted ? (animatedGold / 100).toFixed(2) : '—';
  const isProfit = simulation.netProfit >= 0;
  const profitColor = isProfit ? 'text-emerald-500' : 'text-red-500';

  /* ── Comparison percentages for bars ── */
  const goldReturnPercent = simulation.profitPercent;
  const bankReturnPercent =
    (Math.pow(1 + BANK_RATE_ANNUAL / 12, selectedMonths) - 1) * 100;
  const cashReturnPercent =
    -(Math.pow(1 + INFLATION_RATE_ANNUAL / 12, selectedMonths) - 1) * 100;
  const maxReturn = Math.max(
    Math.abs(goldReturnPercent),
    Math.abs(bankReturnPercent),
    Math.abs(cashReturnPercent),
    1,
  );

  /* ── Share Handler ── */
  const handleShare = useCallback(async () => {
    const profitEmoji = isProfit ? '📈' : '📉';
    const text =
      `${profitEmoji} اگه ${selectedMonths} ماه پیش طلا می‌خریدم...\n\n` +
      `💰 سرمایه: ${formatToman(investmentAmount)}\n` +
      `🪙 طلای خریده شده: ${formatGrams(simulation.gramsBought)}\n` +
      `💵 ارزش فعلی: ${formatToman(Math.round(simulation.currentValue))}\n` +
      `${isProfit ? '🟢' : '🔴'} سود/زیان: ${formatToman(Math.round(simulation.netProfit))} (${simulation.profitPercent.toFixed(1)}%)\n` +
      `🏦 سود سپرده بانکی: ${formatToman(Math.round(simulation.bankReturn))}\n\n` +
      `🔗 زرین گلد — سرمایه‌گذاری هوشمند طلا`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      addToast(t('simulator.shareSuccess'), 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      addToast(t('simulator.shareError'), 'error');
    }
  }, [selectedMonths, investmentAmount, simulation, isProfit, addToast, t]);

  /* ── Quick Action: Share ── */
  useQuickAction('click:ps-share', handleShare);

  /* ── Format label for slider ── */
  const formatSliderLabel = useCallback((value: number) => {
    return formatToman(value);
  }, []);

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                  */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <motion.div
      className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  Section 1: Hero Header                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="relative text-center">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-gold/[0.07] blur-3xl" />
        </div>

        <div className="flex flex-col items-center gap-4">
          <GoldCoinEmoji />

          <div>
            <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
              <span className="gold-gradient-text">{t('simulator.heroTitle')}</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t('simulator.heroSubtitle')}
            </p>
          </div>

          <Badge variant="outline" className="gap-1.5 border-gold/30 bg-gold/5 text-gold">
            <Sparkles className="size-3" />
            {t('simulator.heroBadge')}
          </Badge>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  Section 2: Input Controls                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div id="ps-simulator" variants={itemVariants}>
        <Card className="glass-gold card-spotlight overflow-hidden border-gold/20">
          <CardContent className="space-y-6 p-5 sm:p-7">
            {/* Investment Amount Slider */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Coins className="size-4 text-gold" />
                  {t('simulator.investmentAmount')}
                </label>
                <span className="text-base font-bold tabular-nums gold-gradient-text">
                  {formatToman(investmentAmount)}
                </span>
              </div>

              <Slider
                value={[investmentAmount]}
                onValueChange={(val) => handleAmountChange(val[0])}
                min={1_000_000}
                max={500_000_000}
                step={1_000_000}
                className="mb-4 [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-gold [&_[data-slot=slider-range]]:to-amber-500 [&_[data-slot=slider-thumb]]:border-gold [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:bg-gold [&_[data-slot=slider-thumb]]:shadow-[0_0_12px_rgba(212,175,55,0.5)] [&_[data-slot=slider-track]]:bg-gold/10"
              />

              {/* Quick Select Buttons */}
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((amount) => (
                  <button
                    key={amount.value}
                    onClick={() => handleAmountChange(amount.value)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                      investmentAmount === amount.value
                        ? 'border-gold/50 bg-gold/15 text-gold shadow-sm shadow-gold/20'
                        : 'border-border/50 bg-muted/30 text-muted-foreground hover:border-gold/30 hover:bg-gold/5 hover:text-gold'
                    }`}
                  >
                    {amount.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

            {/* Time Period Chips */}
            <div>
              <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Timer className="size-4 text-gold" />
                {t('simulator.timePeriod')}
              </label>
              <div className="flex flex-wrap gap-2">
                {TIME_OPTIONS.map((option) => (
                  <button
                    key={option.months}
                    onClick={() => handleMonthSelect(option.months)}
                    className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-all ${
                      selectedMonths === option.months
                        ? 'border-gold/50 bg-gold/15 text-gold shadow-sm shadow-gold/20'
                        : 'border-border/50 bg-muted/30 text-muted-foreground hover:border-gold/30 hover:bg-gold/5 hover:text-gold'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  Section 3: Animated Results Dashboard                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div id="ps-result">
        <motion.div
          key={`${investmentAmount}-${selectedMonths}`}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          exit="hidden"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {/* Card 1: Gold Bought */}
          <motion.div variants={itemVariants}>
            <Card className="group overflow-hidden border-gold/20 bg-gradient-to-br from-gold/[0.04] via-card to-amber-900/[0.02] transition-shadow hover:shadow-lg hover:shadow-gold/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                    <Coins className="size-6 text-gold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('simulator.goldBought')}
                    </p>
                    <p className="mt-1 text-xl font-bold tabular-nums gold-gradient-text">
                      {hasInteracted ? `${displayGrams} ${t('simulator.gramsUnit')}` : '—'}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t('simulator.atPrice')} {formatToman(Math.round(simulation.startPrice))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2: Current Value */}
          <motion.div variants={itemVariants}>
            <Card className="group overflow-hidden border-border/60 transition-shadow hover:shadow-lg hover:shadow-gold/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <TrendingUp className="size-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('simulator.currentValue')}
                    </p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                      {hasInteracted ? formatToman(animatedCurrentValue) : '—'}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t('simulator.atCurrentPrice')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 3: Net Profit */}
          <motion.div
            variants={itemVariants}
            className={isProfit
              ? ''
              : ''
            }
          >
            <Card
              className={`group overflow-hidden transition-shadow hover:shadow-lg ${
                isProfit
                  ? 'border-emerald-200 bg-emerald-50/30 hover:shadow-emerald-500/5 dark:border-emerald-900/50 dark:bg-emerald-950/10'
                  : 'border-red-200 bg-red-50/30 hover:shadow-red-500/5 dark:border-red-900/50 dark:bg-red-950/10'
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${
                      isProfit
                        ? 'bg-emerald-100 dark:bg-emerald-900/40'
                        : 'bg-red-100 dark:bg-red-900/40'
                    }`}
                  >
                    {isProfit ? (
                      <ArrowUpLeft className="size-6 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="size-6 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('simulator.netProfit')}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`text-xl font-bold tabular-nums ${profitColor}`}>
                        {hasInteracted ? formatToman(Math.abs(animatedProfit)) : '—'}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs font-bold ${
                          isProfit
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : 'border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400'
                        }`}
                      >
                        {isProfit ? '+' : ''}
                        {simulation.profitPercent.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 4: Better Than Bank */}
          <motion.div variants={itemVariants}>
            <Card className="group overflow-hidden border-amber-200 bg-amber-50/30 transition-shadow hover:shadow-lg hover:shadow-amber-500/5 dark:border-amber-900/50 dark:bg-amber-950/10">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                    <PiggyBank className="size-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('simulator.betterThanBank')}
                    </p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                      {hasInteracted ? formatToman(animatedBetterThanBank) : '—'}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t('simulator.comparedTo')} {formatToman(Math.round(simulation.bankReturn))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  Section 4: Growth Chart                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div id="ps-compare" variants={itemVariants}>
        <Card className="overflow-hidden border-gold/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <BarChart3 className="size-4 text-gold" />
              {t('simulator.chartTitle')}
            </CardTitle>
            {/* Chart Legend */}
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-full bg-gold" />
                <span className="text-xs text-muted-foreground">{t('simulator.legendGold')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-full bg-gray-400" />
                <span className="text-xs text-muted-foreground">{t('simulator.legendBank')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-full bg-red-400" />
                <span className="text-xs text-muted-foreground">{t('simulator.legendInflation')}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-6 pt-2">
            <div className="w-full sm:min-h-[300px]">
              <CSSGrowthChart data={chartData} investmentAmount={investmentAmount} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  Section 5: Comparison Bars                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <Card className="glass-gold card-spotlight overflow-hidden border-gold/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <TrendingUp className="size-4 text-gold" />
              {t('simulator.comparisonTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Gold investment bar */}
            <ComparisonBar
              icon={<Coins className="size-4 text-gold" />}
              label={t('simulator.goldInvestment')}
              percentage={goldReturnPercent}
              maxPercentage={maxReturn}
              barColor="bg-gradient-to-l from-gold to-amber-500"
              textColor="text-gold"
            />

            {/* Bank deposit bar */}
            <ComparisonBar
              icon={<PiggyBank className="size-4 text-gray-400" />}
              label={t('simulator.bankDeposit')}
              percentage={bankReturnPercent}
              maxPercentage={maxReturn}
              barColor="bg-gradient-to-l from-gray-400 to-gray-500"
              textColor="text-gray-500 dark:text-gray-400"
              sublabel={`${t('simulator.annualRate')} ۲۳٪`}
            />

            {/* Cash (inflation) bar */}
            <ComparisonBar
              icon={<Banknote className="size-4 text-red-400" />}
              label={t('simulator.cashUnderMattress')}
              percentage={cashReturnPercent}
              maxPercentage={maxReturn}
              barColor="bg-gradient-to-l from-red-400 to-red-500"
              textColor="text-red-500 dark:text-red-400"
              sublabel={`${t('simulator.inflationRate')} ۳۵٪`}
              isNegative
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  Section 6: Share & CTA                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants} id="ps-share">
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Share Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={handleShare}
            className="flex-1 gap-2 border-gold/30 bg-gold/5 text-gold transition-all hover:border-gold/50 hover:bg-gold/10"
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied ? t('simulator.copied') : t('simulator.shareResult')}
          </Button>

          {/* Start Investing CTA */}
          <Button
            size="lg"
            onClick={() => setPage('trade')}
            className="flex-1 gap-2 bg-gradient-to-l from-gold via-amber-500 to-gold font-bold text-gray-950 shadow-lg shadow-gold/20 transition-all hover:brightness-110 hover:shadow-gold/30 active:scale-[0.98]"
          >
            <Coins className="size-4" />
            {t('simulator.startInvesting')}
          </Button>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  Footer Disclaimer                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.p variants={itemVariants} className="pb-4 text-center text-[11px] text-muted-foreground/60">
        {t('simulator.disclaimer')}
      </motion.p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Comparison Bar Sub-Component                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface ComparisonBarProps {
  icon: React.ReactNode;
  label: string;
  percentage: number;
  maxPercentage: number;
  barColor: string;
  textColor: string;
  sublabel?: string;
  isNegative?: boolean;
}

function ComparisonBar({
  icon,
  label,
  percentage,
  maxPercentage,
  barColor,
  textColor,
  sublabel,
  isNegative = false,
}: ComparisonBarProps) {
  const barWidth = Math.min(Math.abs(percentage) / maxPercentage, 1) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-foreground">{label}</span>
          {sublabel && (
            <span className="text-[10px] text-muted-foreground">({sublabel})</span>
          )}
        </div>
        <span className={`text-sm font-bold tabular-nums ${textColor}`}>
          {isNegative ? '' : '+'}
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/50">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
    </div>
  );
}

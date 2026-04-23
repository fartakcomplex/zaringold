'use client';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from '@/lib/recharts-compat';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  PiggyBank,
  Coins,
  TrendingUp,
  CalendarClock,
  Plus,
  Pause,
  Play,
  Trash2,
  Sparkles,
  Shield,
  ArrowUpRight,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/lib/store';
import { usePageEvent } from '@/hooks/use-page-event';
import {
  formatToman,
  formatGrams,
  formatNumber,
} from '@/lib/helpers';

import {
  formatPrice,
} from '@/lib/helpers';

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
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

type Frequency = 'daily' | 'weekly' | 'monthly';
type DurationType = 'unlimited' | 'custom';

interface SavingsPlan {
  id: string;
  amount: number;
  frequency: Frequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  durationMonths: number | null; // null = unlimited
  totalInvested: number;
  goldGrams: number;
  purchasesCount: number;
  progress: number; // 0-100
  status: 'active' | 'paused';
  createdAt: string;
  nextPurchase: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Data                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MOCK_PLANS: SavingsPlan[] = [
  {
    id: 'sp-1',
    amount: 1000000,
    frequency: 'monthly',
    dayOfMonth: 1,
    durationMonths: 12,
    totalInvested: 5000000,
    goldGrams: 0.145,
    purchasesCount: 5,
    progress: 42,
    status: 'active',
    createdAt: '۱۴۰۳/۰۴/۱۵',
    nextPurchase: '۱۴۰۳/۰۹/۰۱',
  },
  {
    id: 'sp-2',
    amount: 500000,
    frequency: 'weekly',
    dayOfWeek: 3,
    durationMonths: 6,
    totalInvested: 7500000,
    goldGrams: 0.218,
    purchasesCount: 15,
    progress: 58,
    status: 'active',
    createdAt: '۱۴۰۳/۰۵/۰۱',
    nextPurchase: '۱۴۰۳/۰۸/۲۲',
  },
  {
    id: 'sp-3',
    amount: 2000000,
    frequency: 'daily',
    durationMonths: null,
    totalInvested: 28000000,
    goldGrams: 0.812,
    purchasesCount: 14,
    progress: 0,
    status: 'paused',
    createdAt: '۱۴۰۳/۰۶/۱۰',
    nextPurchase: '---',
  },
];

const PERSIAN_WEEK_DAYS = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
];

const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const PRESET_AMOUNTS = [
  { value: 500000, label: '۵۰۰ هزار' },
  { value: 1000000, label: '۱ میلیون' },
  { value: 2000000, label: '۲ میلیون' },
  { value: 5000000, label: '۵ میلیون' },
];

const FREQUENCY_OPTIONS: { value: Frequency; label: string; description: string }[] = [
  { value: 'daily', label: 'روزانه', description: 'هر روز' },
  { value: 'weekly', label: 'هفتگی', description: 'هر هفته یک بار' },
  { value: 'monthly', label: 'ماهانه', description: 'هر ماه یک بار' },
];

const DURATION_OPTIONS: { value: DurationType; label: string; months: number | null }[] = [
  { value: 'unlimited', label: 'نامحدود', months: null },
  { value: 'custom', label: '۳ ماه', months: 3 },
  { value: 'custom', label: '۶ ماه', months: 6 },
  { value: 'custom', label: '۱۲ ماه', months: 12 },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Chart Data Generator                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function generateChartData(amount: number, frequency: Frequency): Array<{ month: string; invested: number }> {
  const data: Array<{ month: string; invested: number }> = [];
  let cumulative = 0;

  const freqMultiplier = frequency === 'daily' ? 30 : frequency === 'weekly' ? 4 : 1;

  for (let i = 0; i < 12; i++) {
    cumulative += amount * freqMultiplier;
    data.push({
      month: PERSIAN_MONTH_NAMES[i],
      invested: cumulative,
    });
  }
  return data;
}

function generateProjectionData(): Array<{ month: string; totalToman: number; goldGrams: number }> {
  return Array.from({ length: 12 }, (_, i) => {
    const month = new Date(Date.now() + i * 30 * 86400000);
    const baseAmount = 500000;
    const totalSaved = baseAmount * (i + 1);
    const estimatedGold = totalSaved / 39500000;
    return {
      month: month.toLocaleDateString('fa-IR', { month: 'short' }),
      totalToman: totalSaved,
      goldGrams: Math.round(estimatedGold * 1000) / 1000,
    };
  });
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Custom Tooltip for Chart                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SavingsChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-gold/20 bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-gold">{formatToman(payload[0].value)}</p>
      <p className="text-[10px] text-muted-foreground">مجموع سرمایه‌گذاری</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeletons                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function HeroSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <Skeleton className="size-16 rounded-2xl" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-5 w-72" />
    </div>
  );
}

function PlanConfigSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 flex-1 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 flex-1 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 flex-1 rounded-lg" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-28" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ActivePlansSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-36" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-2 w-full rounded-full" />
              <div className="mt-3 flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeletonCard() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper Functions                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getFrequencyLabel(freq: Frequency): string {
  switch (freq) {
    case 'daily':
      return 'روزانه';
    case 'weekly':
      return 'هفتگی';
    case 'monthly':
      return 'ماهانه';
  }
}

function getDayLabel(plan: SavingsPlan): string {
  if (plan.frequency === 'daily') return 'هر روز';
  if (plan.frequency === 'weekly' && plan.dayOfWeek !== undefined) {
    return PERSIAN_WEEK_DAYS[plan.dayOfWeek] + 'ها';
  }
  if (plan.frequency === 'monthly' && plan.dayOfMonth !== undefined) {
    return `${formatNumber(plan.dayOfMonth)}ام هر ماه`;
  }
  return '';
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SavingsView() {
  const { goldPrice, addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  /* ── Plan Configuration State ── */
  const [amount, setAmount] = useState<string>('1000000');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(1);
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState<number>(1);
  const [durationType, setDurationType] = useState<DurationType>('unlimited');
  const [customMonths, setCustomMonths] = useState<number>(12);

  /* ── Active Plans State ── */
  const [activePlans, setActivePlans] = useState<SavingsPlan[]>([]);

  /* ── Quick Action Event Listeners ── */
  usePageEvent('deposit', () => { addToast('واریز به حساب پس‌انداز', 'info'); });
  usePageEvent('withdraw', () => { addToast('برداشت از حساب پس‌انداز', 'info'); });
  usePageEvent('profit', () => { addToast('سود پس‌انداز', 'info'); });

  /* ── Loading Simulation ── */
  useEffect(() => {
    const timer = setTimeout(() => {
      setActivePlans(MOCK_PLANS);
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  /* ── Computed Values for Summary ── */
  const numericAmount = parseInt(amount) || 0;
  const freqMultiplier = frequency === 'daily' ? 30 : frequency === 'weekly' ? 4.33 : 1;
  const monthlyInvestment = Math.round(numericAmount * freqMultiplier);
  const estimatedGrams = goldPrice?.buyPrice ? monthlyInvestment / goldPrice.buyPrice : 0;
  const yearlyInvestment = monthlyInvestment * 12;
  const yearlyGrams = goldPrice?.buyPrice ? yearlyInvestment / goldPrice.buyPrice : 0;

  /* ── Chart Data ── */
  const chartData = useMemo(
    () => generateChartData(numericAmount, frequency),
    [numericAmount, frequency]
  );

  /* ── Aggregate Statistics ── */
  const totalSaved = activePlans.reduce((sum, p) => sum + p.totalInvested, 0);
  const totalGold = activePlans.reduce((sum, p) => sum + p.goldGrams, 0);
  const totalPurchases = activePlans.reduce((sum, p) => sum + p.purchasesCount, 0);
  const avgPrice =
    totalGold > 0
      ? Math.round(totalSaved / totalGold)
      : goldPrice?.buyPrice || 0;

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
      {/*  Hero Section                                          */}
      {/* ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <HeroSkeleton />
      ) : (
        <motion.div
          className="flex flex-col items-center gap-4 py-6 text-center sm:py-8"
          variants={itemVariants}
        >
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gold/10 shadow-lg shadow-gold/10">
            <PiggyBank className="size-8 text-gold" />
          </div>
          <div>
            <h2 className="gold-gradient-text text-2xl font-extrabold sm:text-3xl">
              پس‌انداز طلایی
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              با خرید خودکار و دوره‌ای طلا، سرمایه خود را به صورت هوشمند افزایش دهید.
              بدون نیاز به پیگیری روزانه، طلا به صورت خودکار برای شما خریداری می‌شود.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <div className="flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/5 px-3 py-1.5">
              <Shield className="size-3.5 text-gold" />
              <span className="text-xs font-medium text-gold">خرید خودکار</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/5 px-3 py-1.5">
              <Sparkles className="size-3.5 text-gold" />
              <span className="text-xs font-medium text-gold">بدون کارمزد اضافی</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/5 px-3 py-1.5">
              <TrendingUp className="size-3.5 text-gold" />
              <span className="text-xs font-medium text-gold">بهره‌وری از نوسانات</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Plan Configuration + Summary (2 col)                   */}
      {/* ──────────────────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 gap-6 lg:grid-cols-5"
        variants={itemVariants}
      >
        {/* ── Plan Configuration Card (3 cols) ── */}
        {isLoading ? (
          <div className="lg:col-span-3">
            <PlanConfigSkeleton />
          </div>
        ) : (
          <Card className="card-glass-premium overflow-hidden border-gold/20 lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Plus className="size-4 text-gold" />
                ایجاد برنامه پس‌انداز جدید
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* ── Amount Input ── */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">مبلغ هر دوره (گرم طلا)</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="مبلغ مورد نظر را وارد کنید"
                  className="text-left tabular-nums"
                  min={100000}
                  step={100000}
                />
                <div className="flex gap-2">
                  {PRESET_AMOUNTS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setAmount(String(preset.value))}
                      className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                        parseInt(amount) === preset.value
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-border bg-background text-muted-foreground hover:border-gold/30 hover:bg-gold/5'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="bg-border/50" />

              {/* ── Frequency Selector ── */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">فاصله خرید</label>
                <div className="grid grid-cols-3 gap-2">
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFrequency(opt.value)}
                      className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 transition-all ${
                        frequency === opt.value
                          ? 'border-gold bg-gold/10'
                          : 'border-border bg-background hover:border-gold/30 hover:bg-gold/5'
                      }`}
                    >
                      <CalendarClock
                        className={`size-5 ${frequency === opt.value ? 'text-gold' : 'text-muted-foreground'}`}
                      />
                      <span
                        className={`text-sm font-semibold ${frequency === opt.value ? 'text-gold' : 'text-foreground'}`}
                      >
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {opt.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Day Selector ── */}
              {(frequency === 'weekly' || frequency === 'monthly') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {frequency === 'weekly' ? 'روز هفته' : 'روز ماه'}
                  </label>
                  {frequency === 'weekly' ? (
                    <div className="flex flex-wrap gap-2">
                      {PERSIAN_WEEK_DAYS.map((day, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedDayOfWeek(idx)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                            selectedDayOfWeek === idx
                              ? 'border-gold bg-gold/10 text-gold'
                              : 'border-border bg-background text-muted-foreground hover:border-gold/30'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setSelectedDayOfMonth(day)}
                          className={`flex size-9 items-center justify-center rounded-lg border text-xs font-medium transition-all ${
                            selectedDayOfMonth === day
                              ? 'border-gold bg-gold/10 text-gold'
                              : 'border-border bg-background text-muted-foreground hover:border-gold/30'
                          }`}
                        >
                          {formatNumber(day)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Separator className="bg-border/50" />

              {/* ── Duration ── */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">مدت برنامه</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {DURATION_OPTIONS.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDurationType(opt.value);
                        if (opt.months) setCustomMonths(opt.months);
                      }}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                        durationType === opt.value &&
                        (opt.value === 'unlimited' || opt.months === customMonths)
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-border bg-background text-foreground hover:border-gold/30 hover:bg-gold/5'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Create Button ── */}
              <Button
                className="w-full bg-gold text-gold-dark hover:bg-gold/90"
                disabled={numericAmount < 100000}
              >
                <Plus className="ml-2 size-4" />
                ایجاد برنامه پس‌انداز
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Summary Card (2 cols) ── */}
        {isLoading ? (
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardContent className="p-5">
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6 lg:col-span-2">
            <Card className="overflow-hidden border-gold/20 bg-gradient-to-br from-gold/5 via-transparent to-gold/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Info className="size-4 text-gold" />
                  خلاصه برنامه
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Monthly Investment */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">سرمایه‌گذاری ماهانه</span>
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {formatToman(monthlyInvestment)}
                  </span>
                </div>
                <Separator className="bg-border/30" />

                {/* Estimated Monthly Gold */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">طلای ماهانه (تخمینی)</span>
                  <span className="text-sm font-bold tabular-nums gold-gradient-text">
                    {formatGrams(estimatedGrams)}
                  </span>
                </div>
                <Separator className="bg-border/30" />

                {/* Yearly Investment */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">مجموع یک ساله</span>
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {formatToman(yearlyInvestment)}
                  </span>
                </div>
                <Separator className="bg-border/30" />

                {/* Estimated Yearly Gold */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">طلای یک ساله (تخمینی)</span>
                  <span className="text-sm font-bold tabular-nums gold-gradient-text">
                    {formatGrams(yearlyGrams)}
                  </span>
                </div>
                <Separator className="bg-border/30" />

                {/* Frequency Info */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">دوره خرید</span>
                  <Badge variant="secondary" className="bg-gold/10 text-gold text-xs">
                    {getFrequencyLabel(frequency)}
                  </Badge>
                </div>
                <Separator className="bg-border/30" />

                {/* Duration Info */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">مدت</span>
                  <span className="text-sm font-medium text-foreground">
                    {durationType === 'unlimited'
                      ? 'نامحدود'
                      : `${formatNumber(customMonths)} ماه`}
                  </span>
                </div>

                {/* Info Box */}
                <div className="mt-2 rounded-xl border border-gold/15 bg-gold/5 p-3">
                  <div className="flex gap-2">
                    <Info className="mt-0.5 size-4 shrink-0 text-gold/70" />
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      تخمین بر اساس قیمت فعلی ({goldPrice ? formatToman(goldPrice.buyPrice) : '---'}) محاسبه شده است.
                      قیمت واقعی در زمان خرید ممکن است متفاوت باشد.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Card */}
            <Card className="overflow-hidden">
              <CardContent className="p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  مزایای پس‌انداز طلایی
                </h3>
                <ul className="space-y-2.5">
                  {[
                    'خرید خودکار در زمان‌های مشخص',
                    'متنوع‌سازی سرمایه با مبالغ خرد',
                    'بهینه‌سازی میانگین خرید (DCA)',
                    'قابلیت توقف و برداشت در هر لحظه',
                    'بدون کارمزد اضافی',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-gold" />
                      <span className="text-xs leading-relaxed text-muted-foreground">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Statistics Row                                        */}
      {/* ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={itemVariants}
        >
          {/* Total Saved */}
          <Card className="overflow-hidden border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                  <Coins className="size-5 text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">مجموع پس‌انداز</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">
                    {formatPrice(totalSaved)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">گرم طلا</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gold Earned */}
          <Card className="overflow-hidden border-gold/20 bg-gradient-to-br from-yellow-900/20 to-amber-900/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold/15">
                  <TrendingUp className="size-5 text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">طلای جمع‌آوری شده</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums gold-gradient-text">
                    {formatGrams(totalGold)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">طلا</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Price */}
          <Card className="overflow-hidden border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                  <ArrowUpRight className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">میانگین قیمت خرید</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">
                    {formatPrice(avgPrice)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">هر گرم</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Number of Purchases */}
          <Card className="overflow-hidden border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
                  <CalendarClock className="size-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">تعداد خریدها</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">
                    {formatNumber(totalPurchases)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">معامله موفق</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Active Plans List                                     */}
      {/* ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <ActivePlansSkeleton />
      ) : (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <PiggyBank className="size-4 text-gold" />
                برنامه‌های فعال
              </CardTitle>
              <Badge variant="secondary" className="bg-gold/10 text-gold text-xs">
                {formatNumber(activePlans.filter((p) => p.status === 'active').length)} فعال
              </Badge>
            </CardHeader>
            <CardContent>
              {activePlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
                    <PiggyBank className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    برنامه پس‌اندازی ندارید
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    با ایجاد اولین برنامه، پس‌انداز طلایی خود را شروع کنید
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activePlans.map((plan, idx) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                      className="rounded-xl border border-border/50 p-4 transition-all hover:border-gold/20 hover:bg-gold/[0.02]"
                    >
                      {/* Plan Header */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                            plan.status === 'active'
                              ? 'bg-gold/10'
                              : 'bg-muted'
                          }`}
                        >
                          <Coins
                            className={`size-5 ${plan.status === 'active' ? 'text-gold' : 'text-muted-foreground'}`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">
                              {formatToman(plan.amount)}
                            </span>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${
                                plan.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                              }`}
                            >
                              {plan.status === 'active' ? 'فعال' : 'متوقف'}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {getFrequencyLabel(plan.frequency)} · {getDayLabel(plan)}
                            {plan.durationMonths ? ` · ${formatNumber(plan.durationMonths)} ماه` : ' · نامحدود'}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {plan.durationMonths && plan.durationMonths > 0 && (
                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">پیشرفت</span>
                            <span className="font-medium tabular-nums text-gold">
                              {formatNumber(plan.progress)}٪
                            </span>
                          </div>
                          <Progress value={plan.progress} className="h-2 progress-gold" />
                        </div>
                      )}

                      {/* Plan Stats */}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground">سرمایه‌گذاری:</span>
                          <span className="font-medium tabular-nums text-foreground">
                            {formatPrice(plan.totalInvested)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground">طلای جمع‌آوری:</span>
                          <span className="font-medium tabular-nums gold-gradient-text">
                            {formatGrams(plan.goldGrams)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground">خرید بعدی:</span>
                          <span className="font-medium text-foreground">{plan.nextPurchase}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex gap-2">
                        {plan.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-gold/30 text-gold hover:bg-gold/10"
                            onClick={() =>
                              setActivePlans((prev) =>
                                prev.map((p) =>
                                  p.id === plan.id ? { ...p, status: 'paused' as const } : p
                                )
                              )
                            }
                          >
                            <Pause className="ml-1 size-3" />
                            توقف
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-emerald-300 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                            onClick={() =>
                              setActivePlans((prev) =>
                                prev.map((p) =>
                                  p.id === plan.id ? { ...p, status: 'active' as const } : p
                                )
                              )
                            }
                          >
                            <Play className="ml-1 size-3" />
                            فعال‌سازی
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-red-300 text-red-500 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50"
                          onClick={() =>
                            setActivePlans((prev) => prev.filter((p) => p.id !== plan.id))
                          }
                        >
                          <Trash2 className="ml-1 size-3" />
                          حذف
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Monthly Savings Chart (Bar Chart)                      */}
      {/* ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <ChartSkeletonCard />
      ) : (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <TrendingUp className="size-4 text-gold" />
                نمودار رشد پس‌انداز (۱۲ ماهه)
              </CardTitle>
              <Badge variant="secondary" className="bg-gold/10 text-gold text-xs">
                {getFrequencyLabel(frequency)} — {formatPrice(numericAmount)} گرم طلا
              </Badge>
            </CardHeader>
            <CardContent className="pb-6 pt-2">
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F0D060" />
                        <stop offset="50%" stopColor="#D4AF37" />
                        <stop offset="100%" stopColor="#B8960C" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.7 0.08 85 / 15%)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: 'oklch(0.52 0.01 85)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'oklch(0.52 0.01 85)' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) =>
                        v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : formatNumber(v)
                      }
                      width={50}
                    />
                    <Tooltip content={<SavingsChartTooltip />} />
                    <Bar dataKey="invested" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {chartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill="url(#barGradient)"
                          fillOpacity={0.5 + (index / 11) * 0.5}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-center justify-center gap-6 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block size-2 rounded-full bg-gold" />
                  <span className="text-muted-foreground">مجموع سرمایه‌گذاری تجمعی</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Savings Projection Calculator                           */}
      {/* ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <ChartSkeletonCard />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <Card className="card-gold-border overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <TrendingUp className="size-4 text-[#D4AF37]" />
                پیش‌بینی پس‌انداز
                <Badge variant="outline" className="mr-1 border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px]">
                  ۱۲ ماهه
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="chart-container h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={generateProjectionData()} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="projectionTomanGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="projectionGoldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.08 85 / 15%)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: 'oklch(0.52 0.01 85)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 10, fill: 'oklch(0.52 0.01 85)' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}M`}
                      width={45}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 10, fill: '#D4AF37' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => v.toFixed(3)}
                      width={45}
                    />
                    <Tooltip
                      content={({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color?: string }>; label?: string }) => {
                        if (!active || !payload || !payload.length) return null;
                        return (
                          <div className="rounded-lg border border-gold/20 bg-card px-3 py-2 shadow-lg">
                            <p className="mb-1 text-xs text-muted-foreground">{label}</p>
                            {payload.map((entry, idx) => (
                              <p key={idx} className="text-xs font-bold" style={{ color: entry.color }}>
                                {entry.dataKey === 'totalToman'
                                  ? `مبلغ: ${formatToman(entry.value)}`
                                  : `طلا: ${entry.value.toFixed(3)} گرم`}
                              </p>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="totalToman"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      fill="url(#projectionTomanGradient)"
                      dot={false}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="goldGrams"
                      stroke="#D4AF37"
                      strokeWidth={2}
                      fill="url(#projectionGoldGradient)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-center justify-center gap-6 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block size-2 rounded-full bg-[#94a3b8]" />
                  <span className="text-muted-foreground">مبلغ طلایی</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block size-2 rounded-full bg-[#D4AF37]" />
                  <span className="text-muted-foreground">طلای تخمینی (گرم)</span>
                </div>
              </div>
              <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-gold/15 bg-gold/[0.04] p-4 sm:flex-row sm:justify-center sm:gap-8">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">پس‌انداز ۱۲ ماهه:</p>
                  <p className="mt-1 text-sm font-bold tabular-nums text-foreground">۰.۱۵ گرم طلا</p>
                </div>
                <Separator orientation="vertical" className="hidden h-8 sm:block" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">ارزش تخمینی:</p>
                  <p className="mt-1 text-sm font-bold tabular-nums text-gold-gradient">~۰.۱۵ گرم طلا</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

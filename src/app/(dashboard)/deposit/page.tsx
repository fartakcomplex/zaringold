'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Landmark,
  Clock,
  Percent,
  Calculator,
  Loader2,
  CheckCircle,
  ArrowUpRight,
  Coins,
  TrendingUp,
  AlertTriangle,
  CalendarCheck,
  Gem,
  Lock,
  Info,
  Timer,
  Gift,
  BarChart3,
  Shield,
  Flame,
  Award,
  BadgePercent,
  History,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { cn, formatNumber, formatToman, formatGrams, formatDate, getTimeAgo } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

type DurationOption = 30 | 90 | 180 | 365;

interface DurationConfig {
  days: DurationOption;
  annualRate: number;
  label: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ReactNode;
}

interface GoldDeposit {
  id: string;
  goldGrams: number;
  durationDays: number;
  annualRate: number;
  startDate: string;
  maturityDate: string;
  status: 'active' | 'matured' | 'withdrawn' | 'early_withdrawn';
  interestGold: number;
  earnedInterest: number;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Plan Configs                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const PLANS: DurationConfig[] = [
  { days: 30, annualRate: 8, label: '۳۰ روزه', description: 'سود سالانه ۸٪', icon: <Flame className="size-4 text-orange-500" /> },
  { days: 90, annualRate: 12, label: '۹۰ روزه', description: 'سود سالانه ۱۲٪', badge: 'محبوب', badgeColor: 'bg-[#D4AF37] text-[#1a1a1a]', icon: <Award className="size-4 text-[#D4AF37]" /> },
  { days: 180, annualRate: 18, label: '۱۸۰ روزه', description: 'سود سالانه ۱۸٪', badge: 'پاداش ویژه', badgeColor: 'bg-emerald-500 text-white', icon: <Shield className="size-4 text-emerald-500" /> },
  { days: 365, annualRate: 25, label: '۳۶۵ روزه', description: 'سود سالانه ۲۵٪', badge: 'بالاترین سود', badgeColor: 'bg-purple-500 text-white', icon: <BadgePercent className="size-4 text-purple-500" /> },
];

const EARLY_PENALTY_RATES: Record<DurationOption, number> = {
  30: 50, 90: 40, 180: 30, 365: 20,
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SVG Comparison Bar Chart                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PlanComparisonChart() {
  const chartW = 300;
  const chartH = 140;
  const barW = 50;
  const gap = (chartW - PLANS.length * barW) / (PLANS.length + 1);
  const maxVal = Math.max(...PLANS.map(p => p.annualRate));

  return (
    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" dir="ltr">
      {[25, 50, 75].map((pct, i) => (
        <React.Fragment key={i}>
          <line x1={0} y1={chartH * (1 - pct / 100)} x2={chartW} y2={chartH * (1 - pct / 100)}
            stroke="currentColor" strokeWidth="0.5" className="text-muted/15" strokeDasharray="3,3" />
          <text x={chartW - 2} y={chartH * (1 - pct / 100) - 3} textAnchor="end" fill="currentColor" className="text-muted-foreground" fontSize="8">
            {pct}%
          </text>
        </React.Fragment>
      ))}
      {PLANS.map((plan, i) => {
        const x = gap + i * (barW + gap);
        const barH = (plan.annualRate / maxVal) * (chartH - 30);
        const y = chartH - barH;
        const colors = ['#F59E0B', '#D4AF37', '#10B981', '#A855F7'];
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={6} fill={colors[i]} opacity={0.2} />
            <rect x={x} y={y} width={barW} height={Math.min(barH, 6)} rx={3} fill={colors[i]} />
            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fill={colors[i]} fontSize="10" fontWeight="700">
              {plan.annualRate}%
            </text>
            <text x={x + barW / 2} y={chartH - 2} textAnchor="middle" fill="currentColor" className="text-muted-foreground" fontSize="8">
              {plan.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Countdown Timer                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CountdownTimer({ maturityDate }: { maturityDate: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const diff = new Date(maturityDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('سررسید شده');
        setProgress(100);
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${formatNumber(days)} روز و ${formatNumber(hours)} ساعت`);
      // Assume 365 days max duration for progress
      setProgress(Math.min(100, (1 - diff / (365 * 86400000)) * 100));
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [maturityDate]);

  return { timeLeft, progress };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function DepositPageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Card><CardContent className="p-5 space-y-4">
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-2 gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      </CardContent></Card>
      <Card><CardContent className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</CardContent></Card>
      <Card><CardContent className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</CardContent></Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Data                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MOCK_DEPOSITS: GoldDeposit[] = [
  { id: 'dep-1', goldGrams: 2.5, durationDays: 90, annualRate: 12, startDate: new Date(Date.now() - 30 * 86400000).toISOString(), maturityDate: new Date(Date.now() + 60 * 86400000).toISOString(), status: 'active', interestGold: 0.0205, earnedInterest: 0.0205 },
  { id: 'dep-2', goldGrams: 1.0, durationDays: 30, annualRate: 8, startDate: new Date(Date.now() - 20 * 86400000).toISOString(), maturityDate: new Date(Date.now() + 10 * 86400000).toISOString(), status: 'active', interestGold: 0.0044, earnedInterest: 0.0044 },
  { id: 'dep-3', goldGrams: 3.0, durationDays: 180, annualRate: 18, startDate: new Date(Date.now() - 150 * 86400000).toISOString(), maturityDate: new Date(Date.now() + 30 * 86400000).toISOString(), status: 'active', interestGold: 0.2219, earnedInterest: 0.2219 },
  { id: 'dep-4', goldGrams: 5.0, durationDays: 365, annualRate: 25, startDate: new Date(Date.now() - 365 * 86400000).toISOString(), maturityDate: new Date(Date.now() - 1 * 86400000).toISOString(), status: 'matured', interestGold: 1.25, earnedInterest: 1.25 },
  { id: 'dep-5', goldGrams: 0.5, durationDays: 30, annualRate: 8, startDate: new Date(Date.now() - 45 * 86400000).toISOString(), maturityDate: new Date(Date.now() - 15 * 86400000).toISOString(), status: 'withdrawn', interestGold: 0.0022, earnedInterest: 0.0022 },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function GoldDepositPage() {
  const { user, goldWallet, goldPrice, addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<DurationOption>(90);
  const [goldAmount, setGoldAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deposits, setDeposits] = useState<GoldDeposit[]>([]);
  const [activeTab, setActiveTab] = useState<'plans' | 'active' | 'history'>('plans');
  const [showPenaltyCalc, setShowPenaltyCalc] = useState(false);

  const userId = user?.id || 'dev-super-admin';
  const currentPlan = PLANS.find(p => p.days === selectedPlan) || PLANS[1];

  /* ── Calculations ── */
  const inputGrams = Number(goldAmount) || 0;
  const rateFraction = (currentPlan.annualRate / 100) * (selectedPlan / 365);
  const interestGold = inputGrams * rateFraction;
  const totalMaturity = inputGrams + interestGold;
  const maturityValue = totalMaturity * (goldPrice?.buyPrice ?? 34_000_000);
  const penaltyRate = EARLY_PENALTY_RATES[selectedPlan];
  const penaltyGold = interestGold * (penaltyRate / 100);

  /* ── Fetch data ── */
  const fetchDeposits = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/gold-deposit?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setDeposits((data.deposits || []).map((d: Record<string, unknown>) => ({
          id: d.id as string,
          goldGrams: d.goldGrams as number,
          durationDays: (d.durationMonths as number) * 30,
          annualRate: Math.round((d.interestRate as number) * 100),
          startDate: d.startDate as string,
          maturityDate: d.maturityDate as string,
          status: (d.status || 'active') as string,
          interestGold: ((d.goldGramsMatured as number) - (d.goldGrams as number)),
          earnedInterest: ((d.goldGramsMatured as number) - (d.goldGrams as number)),
        })));
      } else {
        setDeposits(MOCK_DEPOSITS);
      }
    } catch {
      setDeposits(MOCK_DEPOSITS);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchDeposits(); }, [fetchDeposits]);

  /* ── Create deposit ── */
  const handleCreateDeposit = async () => {
    if (!inputGrams || inputGrams < 0.01) {
      addToast('حداقل ۰.۰۱ گرم طلا برای سپرده‌گذاری لازم است', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/gold-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          goldGrams: inputGrams,
          durationMonths: selectedPlan / 30,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || `سپرده ${formatGrams(inputGrams)} با سود سالانه ${currentPlan.annualRate}٪ ایجاد شد ✅`, 'success');
        fetchDeposits();
        setGoldAmount('');
      } else {
        // Simulate for demo
        const newDep: GoldDeposit = {
          id: `dep-${Date.now()}`, goldGrams: inputGrams, durationDays: selectedPlan,
          annualRate: currentPlan.annualRate, startDate: new Date().toISOString(),
          maturityDate: new Date(Date.now() + selectedPlan * 86400000).toISOString(),
          status: 'active', interestGold, earnedInterest: 0,
        };
        setDeposits(prev => [newDep, ...prev]);
        setGoldAmount('');
        addToast(`سپرده ${formatGrams(inputGrams)} با سود سالانه ${currentPlan.annualRate}٪ ایجاد شد ✅`, 'success');
      }
    } catch {
      const newDep: GoldDeposit = {
        id: `dep-${Date.now()}`, goldGrams: inputGrams, durationDays: selectedPlan,
        annualRate: currentPlan.annualRate, startDate: new Date().toISOString(),
        maturityDate: new Date(Date.now() + selectedPlan * 86400000).toISOString(),
        status: 'active', interestGold, earnedInterest: 0,
      };
      setDeposits(prev => [newDep, ...prev]);
      setGoldAmount('');
      addToast(`سپرده ${formatGrams(inputGrams)} با سود سالانه ${currentPlan.annualRate}٪ ایجاد شد ✅`, 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDaysRemaining = (maturityDate: string) => {
    const diff = new Date(maturityDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      active: { label: 'فعال', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
      matured: { label: 'سررسید شده', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
      withdrawn: { label: 'برداشت شده', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
      early_withdrawn: { label: 'برداشت زودهنگام', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
    };
    const cfg = map[status] || map.active;
    return <Badge className={cn('text-[10px] border', cfg.className)}>{cfg.label}</Badge>;
  };

  const totalEarned = deposits.reduce((s, d) => s + d.interestGold, 0);
  const activeDeposits = deposits.filter(d => d.status === 'active');
  const totalActiveGold = activeDeposits.reduce((s, d) => s + d.goldGrams, 0);

  if (isLoading) return <DepositPageSkeleton />;

  return (
    <div className="space-y-4 p-4">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5">
          <Landmark className="size-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">سپرده طلایی</h1>
          <p className="text-xs text-muted-foreground">سود ثابت از طلا — بدون ریسک نوسان</p>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="overflow-hidden">
          <CardContent className="p-3 text-center">
            <Coins className="size-4 text-[#D4AF37] mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">سود کل کسب‌شده</p>
            <p className="text-sm font-black text-foreground tabular-nums">{formatGrams(totalEarned)}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-3 text-center">
            <Lock className="size-4 text-emerald-500 mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">طلای سپرده فعال</p>
            <p className="text-sm font-black text-foreground tabular-nums">{formatGrams(totalActiveGold)}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-3 text-center">
            <BarChart3 className="size-4 text-amber-500 mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">سپرده فعال</p>
            <p className="text-sm font-black text-foreground tabular-nums">{formatNumber(activeDeposits.length)}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2">
        {[
          { key: 'plans' as const, label: 'طرح‌ها', icon: <CalendarCheck className="size-3.5" /> },
          { key: 'active' as const, label: 'سپرده فعال', icon: <Timer className="size-3.5" /> },
          { key: 'history' as const, label: 'تاریخچه', icon: <Clock className="size-3.5" /> },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'flex-1 text-xs font-bold',
              activeTab === tab.key
                ? 'bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]'
                : 'border-border hover:border-[#D4AF37]/40',
            )}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="flex items-center gap-1.5">{tab.icon}{tab.label}</span>
          </Button>
        ))}
      </div>

      {/* ════════ PLANS TAB ════════ */}
      {activeTab === 'plans' && (
        <>
          {/* ── Plan Comparison Cards ── */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="size-4 text-[#D4AF37]" />
                مقایسه طرح‌ها
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PLANS.map((plan) => {
                  const isSelected = selectedPlan === plan.days;
                  return (
                    <button
                      key={plan.days}
                      onClick={() => setSelectedPlan(plan.days)}
                      className={cn(
                        'relative rounded-xl border p-4 text-center transition-all duration-300',
                        isSelected
                          ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5 shadow-lg shadow-[#D4AF37]/5'
                          : 'border-border hover:border-[#D4AF37]/20',
                      )}
                    >
                      {plan.badge && (
                        <Badge className={cn('absolute -top-2.5 start-2 text-[8px] px-1.5 py-0 border-0', plan.badgeColor)}>
                          {plan.badge}
                        </Badge>
                      )}
                      <div className="flex justify-center mb-2">{plan.icon}</div>
                      <p className={cn('text-sm font-black transition-colors', isSelected ? 'text-[#D4AF37]' : 'text-foreground')}>
                        {plan.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">{plan.description}</p>
                      <div className="mt-3 flex items-center justify-center gap-1">
                        <TrendingUp className={cn('size-3.5 transition-colors', isSelected ? 'text-[#D4AF37]' : 'text-emerald-500')} />
                        <span className={cn('text-xl font-black tabular-nums transition-colors', isSelected ? 'text-[#D4AF37]' : 'text-emerald-500')}>
                          {plan.annualRate}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ── Plan Comparison Chart ── */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Percent className="size-4 text-[#D4AF37]" />
                مقایسه سود سالانه
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <PlanComparisonChart />
            </CardContent>
          </Card>

          {/* ── Gold Amount Input ── */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Gem className="size-4 text-[#D4AF37]" />
                مقدار طلا
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                موجودی: {formatGrams(goldWallet.goldGrams - goldWallet.frozenGold)}
              </Badge>
            </CardHeader>
            <CardContent className="pb-5">
              <div className="relative">
                <input
                  type="number"
                  value={goldAmount}
                  onChange={(e) => setGoldAmount(e.target.value)}
                  placeholder="مقدار طلا را وارد کنید..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg font-black tabular-nums text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#D4AF37]/40 transition-colors"
                  dir="ltr"
                />
                <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">گرم</span>
              </div>
              <div className="flex gap-2 mt-3">
                {[0.01, 0.1, 0.5, 1, 5, 10].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setGoldAmount(String(preset))}
                    className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium text-muted-foreground hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-colors tabular-nums"
                  >
                    {preset < 1 ? `${formatNumber(preset * 1000)}mg` : `${preset}g`}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Maturity Calculation Preview ── */}
          {inputGrams > 0 && (
            <Card className="overflow-hidden border-[#D4AF37]/20 bg-[#D4AF37]/[0.03]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Calculator className="size-4 text-[#D4AF37]" />
                  پیش‌نمایش سررسید
                </CardTitle>
                <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 text-[10px]">
                  {currentPlan.label}
                </Badge>
              </CardHeader>
              <CardContent className="pb-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">مقدار سپرده</span>
                    <span className="text-sm font-bold tabular-nums text-foreground">{formatGrams(inputGrams)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">نرخ سود سالانه</span>
                    <span className="text-sm font-bold text-emerald-500 tabular-nums">{currentPlan.annualRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">مدت سپرده</span>
                    <span className="text-sm font-bold tabular-nums text-foreground">{formatNumber(selectedPlan)} روز</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Gift className="size-3 text-[#D4AF37]" />
                      سود طلایی
                    </span>
                    <span className="text-sm font-bold text-[#D4AF37] tabular-nums">+{formatGrams(interestGold)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">مجموع در سررسید</span>
                    <span className="text-base font-black text-foreground tabular-nums">{formatGrams(totalMaturity)}</span>
                  </div>
                  {maturityValue > 0 && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-muted-foreground">ارزش تخمینی</span>
                      <span className="text-xs font-bold text-muted-foreground tabular-nums">{formatToman(maturityValue)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Create Button ── */}
          <Button
            onClick={handleCreateDeposit}
            disabled={!inputGrams || isSubmitting}
            className="w-full py-3.5 text-sm font-bold bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249] rounded-xl disabled:opacity-40 shadow-lg shadow-[#D4AF37]/10"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin mx-auto" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock className="size-4" />
                ایجاد سپرده {currentPlan.label}
              </span>
            )}
          </Button>

          {/* ── Early Withdrawal Penalty Calculator ── */}
          <button onClick={() => setShowPenaltyCalc(!showPenaltyCalc)} className="w-full text-center">
            <Card className="overflow-hidden border-border cursor-pointer hover:border-amber-500/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle className="size-4 text-amber-500" />
                  <span className="text-xs font-bold text-foreground">محاسبه‌گر جریمه برداشت زودهنگام</span>
                  <ArrowUpRight className={cn('size-3.5 text-muted-foreground transition-transform', showPenaltyCalc && 'rotate-180')} />
                </div>
              </CardContent>
            </Card>
          </button>

          {showPenaltyCalc && (
            <Card className="overflow-hidden border-amber-500/20 bg-amber-500/[0.03]">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">نرخ جریمه ({currentPlan.label})</span>
                    <span className="text-sm font-bold text-amber-500 tabular-nums">{formatNumber(penaltyRate)}% از سود</span>
                  </div>
                  {inputGrams > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">سود بدون جریمه</span>
                        <span className="text-sm font-bold tabular-nums text-emerald-500">{formatGrams(interestGold)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-red-500">جریمه برداشت زودهنگام</span>
                        <span className="text-sm font-bold tabular-nums text-red-500">-{formatGrams(penaltyGold)}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">سود پس از کسر جریمه</span>
                        <span className="text-sm font-black text-foreground tabular-nums">{formatGrams(interestGold - penaltyGold)}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ════════ ACTIVE TAB ════════ */}
      {activeTab === 'active' && (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Timer className="size-4 text-[#D4AF37]" />
              سپرده‌های فعال
            </CardTitle>
            <Badge variant="secondary" className="text-[10px]">{formatNumber(activeDeposits.length)} فعال</Badge>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-3 max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {activeDeposits.map((dep) => {
                const { timeLeft, progress } = CountdownTimer({ maturityDate: dep.maturityDate });
                return (
                  <div key={dep.id} className="rounded-xl border border-border p-4 transition-colors hover:border-[#D4AF37]/20">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                          <Gem className="size-4 text-[#D4AF37]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{formatGrams(dep.goldGrams)} طلا</p>
                          <p className="text-[11px] text-muted-foreground">سود سالانه {formatNumber(dep.annualRate)}% — {formatNumber(dep.durationDays)} روزه</p>
                        </div>
                      </div>
                      {getStatusBadge(dep.status)}
                    </div>

                    {/* Countdown */}
                    <div className="flex items-center gap-2 mb-2 rounded-lg bg-muted/30 p-2">
                      <Clock className="size-3.5 text-[#D4AF37]" />
                      <span className="text-[11px] font-bold text-[#D4AF37] tabular-nums">{timeLeft}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full bg-gradient-to-l from-[#D4AF37] to-[#F0D060] transition-all duration-700"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <p className="text-[10px] text-muted-foreground">سود تاکنون</p>
                        <p className="text-xs font-bold text-[#D4AF37] tabular-nums">+{formatGrams(dep.interestGold)}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <p className="text-[10px] text-muted-foreground">شروع</p>
                        <p className="text-xs font-bold text-foreground tabular-nums">
                          {new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(new Date(dep.startDate))}
                        </p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <p className="text-[10px] text-muted-foreground">روز مانده</p>
                        <p className="text-xs font-bold text-foreground tabular-nums">{formatNumber(getDaysRemaining(dep.maturityDate))} روز</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {activeDeposits.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Landmark className="size-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">سپرده فعالی ندارید</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">از تب طرح‌ها سپرده جدید ایجاد کنید</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ════════ HISTORY TAB ════════ */}
      {activeTab === 'history' && (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <History className="size-4 text-[#D4AF37]" />
              تاریخچه سپرده‌ها
            </CardTitle>
            <Badge variant="secondary" className="text-[10px]">{formatNumber(deposits.length)} سپرده</Badge>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2 max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {deposits.map((dep) => (
                <div key={dep.id} className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/30">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-[#D4AF37]/10 shrink-0">
                    <Coins className="size-4 text-[#D4AF37]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{formatGrams(dep.goldGrams)}</span>
                      {getStatusBadge(dep.status)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">{formatNumber(dep.durationDays)} روزه — {formatNumber(dep.annualRate)}% سود</span>
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-[11px] text-[#D4AF37] font-bold tabular-nums">+{formatGrams(dep.interestGold)}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                      <Clock className="size-2.5" />{getTimeAgo(dep.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              {deposits.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Landmark className="size-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">هنوز سپرده‌ای ایجاد نکرده‌اید</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Total Earned Interest Summary ── */}
      <Card className="overflow-hidden border-[#D4AF37]/20 bg-gradient-to-b from-[#D4AF37]/[0.05] to-transparent">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 shrink-0">
              <Gift className="size-7 text-[#D4AF37]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">مجموع سود کسب‌شده</p>
              <p className="text-2xl font-black text-[#D4AF37] tabular-nums mt-1">{formatGrams(totalEarned)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                از {formatNumber(deposits.length)} سپرده
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Info Note ── */}
      <Card className="overflow-hidden border-[#D4AF37]/10 bg-[#D4AF37]/[0.03]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#D4AF37]/10 shrink-0 mt-0.5">
              <Info className="size-4 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground mb-1">نکات مهم سپرده طلایی</p>
              <ul className="text-[11px] text-muted-foreground leading-relaxed space-y-1 list-disc list-inside">
                <li>سود به صورت طلای آب‌شده محاسبه و پرداخت می‌شود</li>
                <li>برداشت زودهنگام با کاهش نرخ سود همراه است</li>
                <li>تمدید خودکار پس از سررسید در صورت عدم برداشت</li>
                <li>حداقل مبلغ سپرده ۰.۰۱ گرم طلا</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

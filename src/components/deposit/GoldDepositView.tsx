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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { cn, formatNumber, formatToman, formatGrams, formatDate } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

type DurationOption = 3 | 6 | 12;

interface DurationConfig {
  months: DurationOption;
  annualRate: number;
  label: string;
  description: string;
  bonus?: string;
}

interface GoldDeposit {
  id: string;
  goldGrams: number;
  durationMonths: number;
  annualRate: number;
  startGoldPrice: number;
  startDate: string;
  maturityDate: string;
  status: 'active' | 'matured' | 'withdrawn' | 'early_withdrawn';
  interestGold: number;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Duration Configs                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

const DURATIONS: DurationConfig[] = [
  { months: 3, annualRate: 12, label: '۳ ماهه', description: 'سود سالانه ۱۲٪' },
  { months: 6, annualRate: 15, label: '۶ ماهه', description: 'سود سالانه ۱۵٪', bonus: 'پاداش ویژه' },
  { months: 12, annualRate: 18, label: '۱۲ ماهه', description: 'سود سالانه ۱۸٪', bonus: 'بالاترین سود' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeletons                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function GoldDepositSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardContent className="p-5 space-y-4">
          <Skeleton className="h-5 w-36" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function GoldDepositView() {
  const { user, goldWallet, goldPrice, addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(6);
  const [goldAmount, setGoldAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deposits, setDeposits] = useState<GoldDeposit[]>([]);

  const userId = user?.id || 'dev-super-admin';

  const currentConfig = DURATIONS.find(d => d.months === selectedDuration) || DURATIONS[1];

  /* ── Maturity Calculation ── */
  const inputGrams = Number(goldAmount) || 0;
  const rateFraction = currentConfig.annualRate / 100 / 12 * selectedDuration;
  const interestGold = inputGrams * rateFraction;
  const totalMaturity = inputGrams + interestGold;
  const maturityValue = totalMaturity * (goldPrice?.buyPrice ?? 34_000_000);

  /* ── Fetch deposits ── */
  const fetchDeposits = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));

      setDeposits([
        {
          id: 'dep-1',
          goldGrams: 2.5,
          durationMonths: 6,
          annualRate: 15,
          startGoldPrice: 33_500_000,
          startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
          maturityDate: new Date(Date.now() + 150 * 86400000).toISOString(),
          status: 'active',
          interestGold: 0.1875,
        },
        {
          id: 'dep-2',
          goldGrams: 1.0,
          durationMonths: 3,
          annualRate: 12,
          startGoldPrice: 32_800_000,
          startDate: new Date(Date.now() - 60 * 86400000).toISOString(),
          maturityDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          status: 'active',
          interestGold: 0.03,
        },
        {
          id: 'dep-3',
          goldGrams: 3.0,
          durationMonths: 12,
          annualRate: 18,
          startGoldPrice: 31_000_000,
          startDate: new Date(Date.now() - 200 * 86400000).toISOString(),
          maturityDate: new Date(Date.now() - 165 * 86400000).toISOString(),
          status: 'matured',
          interestGold: 0.54,
        },
      ]);
    } catch (error) {
      console.error('Gold deposit fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  /* ── Create deposit ── */
  const handleCreateDeposit = async () => {
    if (!inputGrams || inputGrams < 0.01) {
      addToast('حداقل ۰.۰۱ گرم طلا برای سپرده‌گذاری لازم است', 'error');
      return;
    }
    if (inputGrams > goldWallet.goldGrams - goldWallet.frozenGold) {
      addToast('موجودی طلای شما کافی نیست', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newDeposit: GoldDeposit = {
        id: `dep-${Date.now()}`,
        goldGrams: inputGrams,
        durationMonths: selectedDuration,
        annualRate: currentConfig.annualRate,
        startGoldPrice: goldPrice?.buyPrice ?? 34_000_000,
        startDate: new Date().toISOString(),
        maturityDate: new Date(Date.now() + selectedDuration * 30 * 86400000).toISOString(),
        status: 'active',
        interestGold: interestGold,
      };

      setDeposits(prev => [newDeposit, ...prev]);
      setGoldAmount('');
      addToast(`سپرده ${formatGrams(inputGrams)} با سود سالانه ${formatNumber(currentConfig.annualRate)}٪ ایجاد شد ✅`, 'success');
    } catch {
      addToast('خطا در ایجاد سپرده', 'error');
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

  if (isLoading) return <GoldDepositSkeleton />;

  return (
    <div className="space-y-4 p-4">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#D4AF37]/10">
          <Landmark className="size-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">سپرده طلایی</h1>
          <p className="text-xs text-muted-foreground">سود ثابت از طلا — بدون ریسک نوسان</p>
        </div>
      </div>

      {/* ── Duration Selector ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <CalendarCheck className="size-4 text-[#D4AF37]" />
            مدت سپرده
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <div className="grid grid-cols-3 gap-2">
            {DURATIONS.map((d) => {
              const isSelected = selectedDuration === d.months;
              return (
                <button
                  key={d.months}
                  onClick={() => setSelectedDuration(d.months)}
                  className={cn(
                    'relative rounded-xl border p-4 text-center transition-all duration-300',
                    isSelected
                      ? 'border-[#D4AF37]/40 bg-[#D4AF37]/5 shadow-md shadow-[#D4AF37]/5'
                      : 'border-border hover:border-[#D4AF37]/20',
                  )}
                >
                  {d.bonus && (
                    <Badge className="absolute -top-2 start-2 text-[8px] bg-[#D4AF37] text-[#1a1a1a] border-0 px-1.5 py-0">
                      {d.bonus}
                    </Badge>
                  )}
                  <p className={cn(
                    'text-sm font-black transition-colors',
                    isSelected ? 'text-[#D4AF37]' : 'text-foreground',
                  )}>
                    {d.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{d.description}</p>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <TrendingUp className={cn(
                      'size-3.5 transition-colors',
                      isSelected ? 'text-[#D4AF37]' : 'text-emerald-500',
                    )} />
                    <span className={cn(
                      'text-lg font-black tabular-nums transition-colors',
                      isSelected ? 'text-[#D4AF37]' : 'text-emerald-500',
                    )}>
                      {formatNumber(d.annualRate)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
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
            <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
              گرم
            </span>
          </div>

          {/* Quick presets */}
          <div className="flex gap-2 mt-3">
            {[0.01, 0.1, 0.5, 1, 5].map((preset) => (
              <button
                key={preset}
                onClick={() => setGoldAmount(String(preset))}
                className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium text-muted-foreground hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-colors tabular-nums"
              >
                {preset < 1 ? `${preset * 1000} میلی‌گرم` : `${preset} گرم`}
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
              {currentConfig.label}
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
                <span className="text-sm font-bold text-emerald-500 tabular-nums">{formatNumber(currentConfig.annualRate)}%</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Coins className="size-3 text-[#D4AF37]" />
                  سود طلایی
                </span>
                <span className="text-sm font-bold text-[#D4AF37] tabular-nums">
                  +{formatGrams(interestGold)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">مجموع در سررسید</span>
                <span className="text-base font-black text-foreground tabular-nums">
                  {formatGrams(totalMaturity)}
                </span>
              </div>
              {maturityValue > 0 && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-muted-foreground">ارزش تخمینی</span>
                  <span className="text-xs font-bold text-muted-foreground tabular-nums">
                    {formatToman(maturityValue)}
                  </span>
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
            ایجاد سپرده {selectedDuration} ماهه
          </span>
        )}
      </Button>

      {/* ── Active Deposits ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Clock className="size-4 text-[#D4AF37]" />
            سپرده‌های فعال
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            {formatNumber(deposits.filter(d => d.status === 'active').length)} فعال
          </Badge>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-3">
            {deposits.map((dep) => (
              <div
                key={dep.id}
                className="rounded-xl border border-border p-4 transition-colors hover:border-[#D4AF37]/20"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                      <Gem className="size-4 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{formatGrams(dep.goldGrams)} طلا</p>
                      <p className="text-[11px] text-muted-foreground">
                        سود سالانه {formatNumber(dep.annualRate)}% — {dep.durationMonths} ماهه
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(dep.status)}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <p className="text-[10px] text-muted-foreground">سود تاکنون</p>
                    <p className="text-xs font-bold text-[#D4AF37] tabular-nums">
                      +{formatGrams(dep.interestGold)}
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <p className="text-[10px] text-muted-foreground">شروع</p>
                    <p className="text-xs font-bold text-foreground tabular-nums">
                      {new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(new Date(dep.startDate))}
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <p className="text-[10px] text-muted-foreground">
                      {dep.status === 'active' ? 'روز مانده' : 'سررسید'}
                    </p>
                    <p className="text-xs font-bold text-foreground tabular-nums">
                      {dep.status === 'active'
                        ? `${formatNumber(getDaysRemaining(dep.maturityDate))} روز`
                        : formatDate(dep.maturityDate)}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                {dep.status === 'active' && (
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-l from-[#D4AF37] to-[#F5D76E] transition-all duration-700"
                        style={{
                          width: `${Math.min(
                            100,
                            (1 - getDaysRemaining(dep.maturityDate) / (dep.durationMonths * 30)) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {deposits.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8">
                <Landmark className="size-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">هنوز سپرده‌ای ایجاد نکرده‌اید</p>
                <p className="text-xs text-muted-foreground/70 mt-1">مقدار طلا و مدت دلخواه را انتخاب کنید</p>
              </div>
            )}
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

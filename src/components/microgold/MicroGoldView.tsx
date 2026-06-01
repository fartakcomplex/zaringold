'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PiggyBank,
  Plus,
  History,
  Loader2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Coins,
  ArrowUpRight,
  Clock,
  CheckCircle,
  Settings,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import { cn, formatNumber, formatToman, formatGrams, getTimeAgo } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface MicroGoldSettings {
  isEnabled: boolean;
  roundUpAmount: number;
}

interface MicroGoldStats {
  totalRounded: number;
  totalGoldBought: number;
  totalTransactions: number;
  averageRoundUp: number;
}

interface MicroGoldTransaction {
  id: string;
  originalAmount: number;
  roundedAmount: number;
  goldGrams: number;
  createdAt: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeletons                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MicroGoldSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function MicroGoldView() {
  const { user, goldWallet, goldPrice, addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<MicroGoldSettings>({ isEnabled: false, roundUpAmount: 1000 });
  const [stats, setStats] = useState<MicroGoldStats>({
    totalRounded: 0,
    totalGoldBought: 0,
    totalTransactions: 0,
    averageRoundUp: 0,
  });
  const [transactions, setTransactions] = useState<MicroGoldTransaction[]>([]);
  const [isToggling, setIsToggling] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const userId = user?.id || 'dev-super-admin';
  const presets = [1000, 5000, 10000];

  /* ── Fetch data ── */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));

      setStats({
        totalRounded: Math.round(Math.random() * 500000 + 100000),
        totalGoldBought: parseFloat((Math.random() * 2 + 0.5).toFixed(4)),
        totalTransactions: Math.round(Math.random() * 50 + 15),
        averageRoundUp: Math.round(Math.random() * 3000 + 500),
      });

      setTransactions([
        { id: '1', originalAmount: 45000, roundedAmount: 50000, goldGrams: 0.0003, createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', originalAmount: 92000, roundedAmount: 100000, goldGrams: 0.0006, createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: '3', originalAmount: 147000, roundedAmount: 150000, goldGrams: 0.0009, createdAt: new Date(Date.now() - 14400000).toISOString() },
        { id: '4', originalAmount: 283000, roundedAmount: 290000, goldGrams: 0.0018, createdAt: new Date(Date.now() - 28800000).toISOString() },
        { id: '5', originalAmount: 674000, roundedAmount: 680000, goldGrams: 0.0041, createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: '6', originalAmount: 156000, roundedAmount: 160000, goldGrams: 0.0010, createdAt: new Date(Date.now() - 172800000).toISOString() },
      ]);
    } catch (error) {
      console.error('MicroGold fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Toggle round-up ── */
  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      setSettings(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
      addToast(
        !settings.isEnabled ? 'گرد‌کردن خرد فعال شد! ✨' : 'گرد‌کردن خرد غیرفعال شد',
        !settings.isEnabled ? 'success' : 'info',
      );
    } catch {
      addToast('خطا در تغییر تنظیمات', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  /* ── Save preset amount ── */
  const handleSelectPreset = (amount: number) => {
    setSelectedPreset(amount);
    setCustomAmount('');
    setSettings(prev => ({ ...prev, roundUpAmount: amount }));
  };

  const handleSaveCustomAmount = () => {
    const val = Number(customAmount);
    if (!val || val < 100) {
      addToast('حداقل مبلغ ۱۰۰ تومان', 'error');
      return;
    }
    setSelectedPreset(null);
    setSettings(prev => ({ ...prev, roundUpAmount: val }));
    addToast(`مبلغ گردکردن به ${formatToman(val)} تغییر کرد`, 'success');
  };

  if (isLoading) return <MicroGoldSkeleton />;

  return (
    <div className="space-y-4 p-4">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#D4AF37]/10">
          <PiggyBank className="size-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">خرید خرد طلا</h1>
          <p className="text-xs text-muted-foreground">خرید خودکار طلا با گرد‌کردن خرد</p>
        </div>
      </div>

      {/* ── Toggle Card ── */}
      <Card className="overflow-hidden border-[#D4AF37]/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex size-10 items-center justify-center rounded-xl transition-colors',
                settings.isEnabled ? 'bg-[#D4AF37]/15' : 'bg-muted',
              )}>
                <Sparkles className={cn(
                  'size-5 transition-colors',
                  settings.isEnabled ? 'text-[#D4AF37]' : 'text-muted-foreground',
                )} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">گرد‌کردن خرد</p>
                <p className="text-xs text-muted-foreground">
                  گرد‌کردن خریدها به {formatToman(settings.roundUpAmount)} و خرید طلا
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isToggling && <Loader2 className="size-4 animate-spin text-[#D4AF37]" />}
              <button
                onClick={handleToggle}
                disabled={isToggling}
                className="relative"
                aria-label={settings.isEnabled ? 'غیرفعال کردن' : 'فعال کردن'}
              >
                {settings.isEnabled ? (
                  <ToggleRight className="size-8 text-[#D4AF37]" />
                ) : (
                  <ToggleLeft className="size-8 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {settings.isEnabled && (
            <div className="mt-4 p-3 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/10">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="size-4 text-[#D4AF37]" />
                <span className="text-xs font-bold text-[#D4AF37]">خرید خرد فعال است!</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                هر خرید شما به نزدیک‌ترین {formatToman(settings.roundUpAmount)} گرد می‌شود و مابقی به صورت خودکار طلا خریداری می‌گردد.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Amount Presets ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Settings className="size-4 text-[#D4AF37]" />
            مبلغ گرد‌کردن
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">انتخاب مبلغ</Badge>
        </CardHeader>
        <CardContent className="pb-5">
          <div className="flex gap-2 mb-3">
            {presets.map((preset) => (
              <Button
                key={preset}
                variant={selectedPreset === preset ? 'default' : 'outline'}
                className={cn(
                  'flex-1 text-xs font-bold tabular-nums',
                  selectedPreset === preset
                    ? 'bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249] border-[#D4AF37]'
                    : 'border-border hover:border-[#D4AF37]/40',
                )}
                onClick={() => handleSelectPreset(preset)}
              >
                {formatNumber(preset)}
                <span className="text-[9px] font-normal ms-1 opacity-70">تومان</span>
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="مبلغ دلخواه..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#D4AF37]/40 transition-colors"
              dir="ltr"
            />
            <Button
              size="sm"
              onClick={handleSaveCustomAmount}
              className="bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]"
            >
              ذخیره
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="size-3.5 text-[#D4AF37]" />
              <span className="text-[11px] text-muted-foreground">مجموع گردشده</span>
            </div>
            <p className="text-base font-black tabular-nums text-foreground">
              {formatToman(stats.totalRounded)}
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="size-3.5 text-emerald-500" />
              <span className="text-[11px] text-muted-foreground">طلای خریده شده</span>
            </div>
            <p className="text-base font-black tabular-nums text-foreground">
              {formatGrams(stats.totalGoldBought)}
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <History className="size-3.5 text-blue-500" />
              <span className="text-[11px] text-muted-foreground">تعداد تراکنش</span>
            </div>
            <p className="text-base font-black tabular-nums text-foreground">
              {formatNumber(stats.totalTransactions)}
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="size-3.5 text-amber-500" />
              <span className="text-[11px] text-muted-foreground">میانگین هر بار</span>
            </div>
            <p className="text-base font-black tabular-nums text-foreground">
              {formatToman(stats.averageRoundUp)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Transaction History ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="size-4 text-[#D4AF37]" />
            تاریخچه گرد‌کردن
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            {formatNumber(transactions.length)} تراکنش
          </Badge>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-1">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/30"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#D4AF37]/10 shrink-0">
                  <Plus className="size-4 text-[#D4AF37]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      +{formatGrams(tx.goldGrams)} طلا
                    </span>
                    <Badge variant="secondary" className="text-[9px] font-medium">گرد‌کردن</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      خرید: {formatToman(tx.originalAmount)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">→</span>
                    <span className="text-[11px] text-[#D4AF37] tabular-nums font-medium">
                      {formatToman(tx.roundedAmount)}
                    </span>
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                    <Clock className="size-2.5" />
                    {getTimeAgo(tx.createdAt)}
                  </p>
                </div>
              </div>
            ))}

            {transactions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8">
                <PiggyBank className="size-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">هنوز تراکنشی ندارید</p>
                <p className="text-xs text-muted-foreground/70 mt-1">گرد‌کردن خرد را فعال کنید تا شروع شود</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Info Card ── */}
      <Card className="overflow-hidden border-[#D4AF37]/10 bg-[#D4AF37]/[0.03]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#D4AF37]/10 shrink-0 mt-0.5">
              <CheckCircle className="size-4 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground mb-1">خرید خرد چطور کار می‌کند؟</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                با فعال‌سازی این ویژگی، هر خرید شما به نزدیک‌ترین عدد بالاتر گرد می‌شود و مابه‌التفاوت به صورت خودکار
                به طلای آب‌شده تبدیل می‌شود. به این ترتیب بدون احساس، به مرور سرمایه طلایی خود را افزایش می‌دهید.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

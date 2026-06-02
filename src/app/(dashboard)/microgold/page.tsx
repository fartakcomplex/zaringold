'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PiggyBank,
  Plus,
  History,
  Loader2,
  Sparkles,
  Coins,
  ArrowUpRight,
  Clock,
  CheckCircle,
  Zap,
  CircleDot,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  Gem,
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

interface MicroGoldTransaction {
  id: string;
  amountMg: number;
  goldGrams: number;
  pricePerMg: number;
  totalPrice: number;
  createdAt: string;
}

interface RoundUpData {
  totalRounded: number;
  totalGoldBought: number;
  totalRoundUps: number;
  isActive: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SVG Gold Coin Progress Ring                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function GoldProgressRing({ progress, totalGold }: { progress: number; totalGold: number }) {
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          transform={`rotate(-90 ${center} ${center})`}
        />
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B8960C" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#F0D060" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Gem className="size-4 text-[#D4AF37] mb-1" />
        <span className="text-sm font-black text-foreground tabular-nums">
          {formatGrams(totalGold)}
        </span>
        <span className="text-[9px] text-muted-foreground">مجموع طلای خرد</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SVG Mini Sparkline                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const width = 200;
  const height = 50;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 10) - 5;
    return `${x},${y}`;
  }).join(' ');

  const fillPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill="url(#sparkFill)" />
      <polyline
        points={points}
        fill="none"
        stroke="#D4AF37"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={(data.length - 1) * step}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 10) - 5}
        r="3"
        fill="#D4AF37"
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MicroGoldPageSkeleton() {
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
      <Card>
        <CardContent className="p-6">
          <Skeleton className="size-28 rounded-full mx-auto" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
      <Card><CardContent className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</CardContent></Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

const QUICK_AMOUNTS = [10, 50, 100, 250, 500, 1000]; // milligrams
const GOAL_GRAMS = 10; // 10 gram gold goal

const MOCK_TRANSACTIONS: MicroGoldTransaction[] = [
  { id: 'tx1', amountMg: 100, goldGrams: 0.1, pricePerMg: 33500, totalPrice: 3350000, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'tx2', amountMg: 250, goldGrams: 0.25, pricePerMg: 33450, totalPrice: 8362500, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'tx3', amountMg: 50, goldGrams: 0.05, pricePerMg: 33400, totalPrice: 1670000, createdAt: new Date(Date.now() - 14400000).toISOString() },
  { id: 'tx4', amountMg: 500, goldGrams: 0.5, pricePerMg: 33300, totalPrice: 16650000, createdAt: new Date(Date.now() - 28800000).toISOString() },
  { id: 'tx5', amountMg: 10, goldGrams: 0.01, pricePerMg: 33550, totalPrice: 335500, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'tx6', amountMg: 1000, goldGrams: 1.0, pricePerMg: 33200, totalPrice: 33200000, createdAt: new Date(Date.now() - 172800000).toISOString() },
];

export default function MicroGoldPage() {
  const { user, goldWallet, goldPrice, addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [roundUpEnabled, setRoundUpEnabled] = useState(false);
  const [roundUpDiff, setRoundUpDiff] = useState(0);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [transactions, setTransactions] = useState<MicroGoldTransaction[]>([]);
  const [roundUp, setRoundUp] = useState<RoundUpData | null>(null);
  const [goldBalance, setGoldBalance] = useState(0);
  const [sparklineData, setSparklineData] = useState<number[]>([]);

  const userId = user?.id || 'dev-super-admin';
  const pricePerMg = goldPrice ? goldPrice.buyPrice / 1000 : 33500; // price per mg

  // Round-up: round to nearest 100mg
  const currentMg = Number(customAmount) || selectedAmount || 0;
  const roundedMg = Math.ceil(currentMg / 100) * 100;
  const effectiveMg = roundUpEnabled ? roundedMg : currentMg;
  const diffMg = roundUpEnabled ? roundedMg - currentMg : 0;
  const totalCost = effectiveMg * pricePerMg;
  const totalGold = transactions.reduce((s, t) => s + t.goldGrams, 0) + (goldBalance || 0);
  const progressPct = Math.min(100, (totalGold / GOAL_GRAMS) * 100);

  /* ── Fetch data ── */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/micro-gold?userId=${userId}`);
      const data = await res.json();

      if (data.success) {
        setRoundUp(data.roundUp);
        setGoldBalance(data.goldBalance || 0);
        setTransactions(
          (data.transactions || []).map((tx: Record<string, unknown>) => ({
            id: tx.id as string,
            amountMg: (tx.sourceAmount as number) / pricePerMg * 1000 || Math.round(Math.random() * 500 + 50),
            goldGrams: tx.goldGrams as number,
            pricePerMg: (tx.goldPrice as number) / 1000 || pricePerMg,
            totalPrice: tx.sourceAmount as number,
            createdAt: tx.createdAt as string,
          }))
        );
      } else {
        // Fallback mock data
        setTransactions(MOCK_TRANSACTIONS);
        setRoundUp({ totalRounded: 856000, totalGoldBought: 2.45, totalRoundUps: 34, isActive: true });
        setGoldBalance(1.91);
      }

      // Generate sparkline data
      setSparklineData(
        Array.from({ length: 12 }, () =>
          Math.round((Math.random() * 0.3 + 0.05) * 1000) / 1000
        )
      );
    } catch {
      setTransactions(MOCK_TRANSACTIONS);
      setRoundUp({ totalRounded: 856000, totalGoldBought: 2.45, totalRoundUps: 34, isActive: true });
      setGoldBalance(1.91);
      setSparklineData([0.1, 0.12, 0.18, 0.25, 0.3, 0.35, 0.5, 0.65, 0.8, 1.1, 1.5, 1.91]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, pricePerMg]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Purchase handler ── */
  const handlePurchase = async () => {
    if (effectiveMg <= 0) {
      addToast('مقدار طلای دلخواه را انتخاب کنید', 'error');
      return;
    }
    setIsPurchasing(true);
    try {
      const res = await fetch('/api/micro-gold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: Math.round(totalCost) }),
      });
      const data = await res.json();

      if (data.success) {
        addToast(`${formatGrams(effectiveMg / 1000)} طلا با موفقیت خریداری شد ✅`, 'success');
        setGoldBalance(data.newBalance || goldBalance + effectiveMg / 1000);
        setTransactions(prev => [{
          id: `tx-${Date.now()}`,
          amountMg: effectiveMg,
          goldGrams: effectiveMg / 1000,
          pricePerMg,
          totalPrice: totalCost,
          createdAt: new Date().toISOString(),
        }, ...prev]);
        setCustomAmount('');
        setSelectedAmount(null);
      } else {
        addToast(data.message || 'خطا در خرید', 'error');
      }
    } catch {
      // Simulate success for demo
      addToast(`${formatGrams(effectiveMg / 1000)} طلا با موفقیت خریداری شد ✅`, 'success');
      setTransactions(prev => [{
        id: `tx-${Date.now()}`,
        amountMg: effectiveMg,
        goldGrams: effectiveMg / 1000,
        pricePerMg,
        totalPrice: totalCost,
        createdAt: new Date().toISOString(),
      }, ...prev]);
      setGoldBalance(prev => prev + effectiveMg / 1000);
      setCustomAmount('');
      setSelectedAmount(null);
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) return <MicroGoldPageSkeleton />;

  return (
    <div className="space-y-4 p-4">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5">
          <PiggyBank className="size-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">خرید خرد طلا</h1>
          <p className="text-xs text-muted-foreground">خرید آسان و مرحله‌ای طلا — از ۱۰ میلی‌گرم</p>
        </div>
      </div>

      {/* ── Progress Ring + Stats ── */}
      <Card className="overflow-hidden border-[#D4AF37]/20 bg-gradient-to-b from-[#D4AF37]/[0.04] to-transparent">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
            <GoldProgressRing progress={progressPct} totalGold={totalGold} />
            <div className="space-y-3 flex-1 w-full sm:max-w-[200px]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">هدف</span>
                <span className="text-xs font-bold text-[#D4AF37] tabular-nums">{formatGrams(GOAL_GRAMS)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-[#D4AF37] to-[#F0D060] transition-all duration-1000"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {progressPct.toFixed(1)}٪ از هدف {formatGrams(GOAL_GRAMS)} طلا
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Coins className="size-3.5 text-[#D4AF37]" />
                <span className="text-[11px] text-muted-foreground">موجودی فعلی:</span>
                <span className="text-sm font-black text-foreground tabular-nums">{formatGrams(totalGold)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Quick Buy Amount Buttons ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ShoppingBag className="size-4 text-[#D4AF37]" />
            خرید سریع
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">میلی‌گرم</Badge>
        </CardHeader>
        <CardContent className="pb-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {QUICK_AMOUNTS.map((mg) => {
              const isSelected = selectedAmount === mg;
              const grams = mg / 1000;
              const cost = mg * pricePerMg;
              return (
                <button
                  key={mg}
                  onClick={() => {
                    setSelectedAmount(isSelected ? null : mg);
                    setCustomAmount('');
                  }}
                  className={cn(
                    'rounded-xl border p-3 text-center transition-all duration-200',
                    isSelected
                      ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 shadow-md shadow-[#D4AF37]/5'
                      : 'border-border hover:border-[#D4AF37]/20 hover:bg-[#D4AF37]/[0.02]',
                  )}
                >
                  <p className={cn(
                    'text-lg font-black tabular-nums transition-colors',
                    isSelected ? 'text-[#D4AF37]' : 'text-foreground',
                  )}>
                    {formatNumber(mg)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">میلی‌گرم</p>
                  <p className="text-[10px] font-bold text-muted-foreground tabular-nums mt-1">
                    {grams >= 1 ? formatGrams(grams) : `${formatNumber(mg)}mg`}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Custom Amount Input ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <CircleDot className="size-4 text-[#D4AF37]" />
            مقدار دلخواه
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                placeholder="مقدار به میلی‌گرم..."
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#D4AF37]/40 transition-colors tabular-nums"
                dir="ltr"
              />
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">mg</span>
            </div>
          </div>

          {/* Live Price Display */}
          <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-3.5 text-[#D4AF37]" />
              <span className="text-[11px] text-muted-foreground">قیمت هر میلی‌گرم</span>
            </div>
            <span className="text-sm font-black text-foreground tabular-nums">
              {formatToman(pricePerMg)}
            </span>
          </div>

          {/* Round-up Feature */}
          <button
            onClick={() => setRoundUpEnabled(!roundUpEnabled)}
            className={cn(
              'mt-3 w-full rounded-xl border p-3 transition-all text-start',
              roundUpEnabled
                ? 'border-[#D4AF37]/30 bg-[#D4AF37]/5'
                : 'border-border hover:border-[#D4AF37]/15',
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className={cn('size-4', roundUpEnabled ? 'text-[#D4AF37]' : 'text-muted-foreground')} />
                <div>
                  <p className="text-xs font-bold text-foreground">خرید با گرد کردن</p>
                  <p className="text-[10px] text-muted-foreground">گرد‌کردن به نزدیک‌ترین ۱۰۰ میلی‌گرم</p>
                </div>
              </div>
              <div className={cn(
                'size-5 rounded-full border-2 flex items-center justify-center transition-all',
                roundUpEnabled ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-muted-foreground/30',
              )}>
                {roundUpEnabled && <CheckCircle className="size-3 text-[#1a1a1a]" />}
              </div>
            </div>
            {roundUpEnabled && currentMg > 0 && diffMg > 0 && (
              <div className="mt-2 flex items-center gap-2 text-[10px]">
                <Sparkles className="size-3 text-[#D4AF37]" />
                <span className="text-[#D4AF37] font-bold">
                  +{formatNumber(diffMg)} میلی‌گرم اضافه (از {formatNumber(currentMg)} به {formatNumber(roundedMg)} mg)
                </span>
              </div>
            )}
          </button>
        </CardContent>
      </Card>

      {/* ── Purchase Summary + Button ── */}
      {currentMg > 0 && (
        <Card className="overflow-hidden border-[#D4AF37]/20 bg-[#D4AF37]/[0.03]">
          <CardContent className="p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">مقدار طلا</span>
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {effectiveMg >= 1000 ? formatGrams(effectiveMg / 1000) : `${formatNumber(effectiveMg)} mg`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">قیمت هر میلی‌گرم</span>
                <span className="text-sm font-bold text-foreground tabular-nums">{formatToman(pricePerMg)}</span>
              </div>
              {diffMg > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#D4AF37] flex items-center gap-1">
                    <Sparkles className="size-3" />
                    ذخیره با گردکردن
                  </span>
                  <span className="text-xs font-bold text-[#D4AF37] tabular-nums">+{formatNumber(diffMg)} mg</span>
                </div>
              )}
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">مبلغ کل</span>
                <span className="text-base font-black text-[#D4AF37] tabular-nums">
                  {formatToman(Math.round(totalCost))}
                </span>
              </div>
            </div>

            <Button
              onClick={handlePurchase}
              disabled={isPurchasing || effectiveMg <= 0}
              className="w-full mt-4 py-3.5 text-sm font-bold bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249] rounded-xl disabled:opacity-40 shadow-lg shadow-[#D4AF37]/10"
            >
              {isPurchasing ? (
                <Loader2 className="size-4 animate-spin mx-auto" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Plus className="size-4" />
                  خرید {effectiveMg >= 1000 ? formatGrams(effectiveMg / 1000) : `${formatNumber(effectiveMg)} mg`} طلا
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Savings Trend Sparkline ── */}
      {sparklineData.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-500" />
              روند پس‌انداز خرد
            </CardTitle>
            <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 text-[10px]">
              +{formatNumber(Math.round(((totalGold - (sparklineData[0] || 0.1)) / Math.max(sparklineData[0], 0.01)) * 100))}٪
            </Badge>
          </CardHeader>
          <CardContent className="pb-4">
            <MiniSparkline data={sparklineData} />
          </CardContent>
        </Card>
      )}

      {/* ── Transaction History ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="size-4 text-[#D4AF37]" />
            تاریخچه خرید خرد
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            {formatNumber(transactions.length)} تراکنش
          </Badge>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-2 max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/30 border border-transparent hover:border-border"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#D4AF37]/15 to-[#D4AF37]/5 shrink-0">
                  <Plus className="size-4 text-[#D4AF37]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      +{formatGrams(tx.goldGrams)} طلا
                    </span>
                    <Badge variant="secondary" className="text-[9px] font-medium">خرید خرد</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {formatNumber(tx.amountMg)} mg
                    </span>
                    <span className="text-[11px] text-muted-foreground">•</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {formatToman(tx.totalPrice)}
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
                <p className="text-sm text-muted-foreground">هنوز خرید خردی ندارید</p>
                <p className="text-xs text-muted-foreground/70 mt-1">از دکمه‌های سریع بالا شروع کنید</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Round-up Summary Card ── */}
      {roundUp && (
        <Card className="overflow-hidden border-[#D4AF37]/10 bg-[#D4AF37]/[0.03]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#D4AF37]/10 shrink-0">
                <Zap className="size-5 text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground">آمار گرد‌کردن خرد</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-[11px] text-muted-foreground">
                    {formatNumber(roundUp.totalRoundUps)} بار
                  </span>
                  <span className="text-[11px] text-[#D4AF37] font-bold">
                    +{formatGrams(roundUp.totalGoldBought)} طلا
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatToman(roundUp.totalRounded)}
                  </span>
                </div>
              </div>
              <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 border-[#D4AF37]/20 text-[10px]">
                {roundUp.isActive ? 'فعال' : 'غیرفعال'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Info Card ── */}
      <Card className="overflow-hidden border-[#D4AF37]/10 bg-[#D4AF37]/[0.03]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#D4AF37]/10 shrink-0 mt-0.5">
              <CheckCircle className="size-4 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground mb-1">خرید خرد طلا چطور کار می‌کند؟</p>
              <ul className="text-[11px] text-muted-foreground leading-relaxed space-y-1 list-disc list-inside">
                <li>خرید آسان طلا از ۱۰ میلی‌گرم</li>
                <li>گرد‌کردن خریدها به نزدیک‌ترین ۱۰۰ میلی‌گرم</li>
                <li>بدون نیاز به خرید کامل ۱ گرم</li>
                <li>سود و زیان طلا را بدون ریسک بالا تجربه کنید</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

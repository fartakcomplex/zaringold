'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  ArrowLeftRight,
  Info,
  TrendingUp,
  Sparkles,
  CircleDollarSign,
  Coins,
  RotateCcw,
  BadgeDollarSign,
  Gem,
  Scale,
  Percent,
  Receipt,
  Repeat,
  Tag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { formatToman, formatNumber, formatPrice, cn } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types & Constants                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

type GoldUnit = 'gram' | 'milligram' | 'mithqal' | 'ounce' | 'seke' | 'abbasi';

interface UnitInfo {
  id: GoldUnit;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  grams: number; // equivalent grams
  description: string;
}

interface KaratInfo {
  id: string;
  label: string;
  purity: number; // 0-1
  description: string;
}

const GOLD_UNITS: UnitInfo[] = [
  { id: 'gram', label: 'گرم', shortLabel: 'گرم', icon: Scale, grams: 1, description: 'واحد پایه طلای آب‌شده' },
  { id: 'milligram', label: 'میلی‌گرم', shortLabel: 'mg', icon: Sparkles, grams: 0.001, description: 'هزارم گرم' },
  { id: 'mithqal', label: 'مثقال', shortLabel: 'مثقال', icon: Gem, grams: 4.331, description: 'مثقال شرعی' },
  { id: 'seke', label: 'سکه تمام', shortLabel: 'سکه', icon: Coins, grams: 7.336, description: 'سکه بهار آزادی' },
  { id: 'abbasi', label: 'نیم سکه', shortLabel: 'نیم', icon: Gem, grams: 3.668, description: 'سکه نیم بهار' },
  { id: 'ounce', label: 'اونس', shortLabel: 'اونس', icon: BadgeDollarSign, grams: 31.1035, description: 'اونس جهانی' },
];

const KARATS: KaratInfo[] = [
  { id: '24k', label: '۲۴ عیار', purity: 1.0, description: 'طلای خالص (۹۹.۹٪)' },
  { id: '21k', label: '۲۱ عیار', purity: 0.875, description: 'طلای ایرانی (۸۷.۵٪)' },
  { id: '18k', label: '۱۸ عیار', purity: 0.75, description: 'طلای مهندسی (۷۵٪)' },
  { id: '14k', label: '۱۴ عیار', purity: 0.583, description: 'طلای ارزان‌تر (۵۸.۳٪)' },
];

const COMMISSION_RATE = 0.003; // 0.3%
const TAX_RATE = 0.009; // 0.9%

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main GoldCalculatorPage Component                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function GoldCalculatorPage() {
  const { addToast } = useAppStore();

  /* ── State ── */
  const [amount, setAmount] = useState<string>('');
  const [fromUnit, setFromUnit] = useState<GoldUnit>('gram');
  const [toUnit, setToUnit] = useState<GoldUnit>('seke');
  const [karat, setKarat] = useState<string>('24k');
  const [pricePerGram, setPricePerGram] = useState<number>(0);
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [priceLoading, setPriceLoading] = useState(true);
  const [result, setResult] = useState<{
    value: number;
    toman: number;
    breakdown: string;
    goldGrams: number;
  } | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  /* ── Fetch Prices ── */
  useEffect(() => {
    const fetchPrices = async () => {
      setPriceLoading(true);
      try {
        const res = await fetch('/api/gold/prices');
        const data = await res.json();
        if (data.success && data.prices?.market) {
          setPricePerGram(data.prices.market);
          setBuyPrice(data.prices.buy || Math.round(data.prices.market * 1.003));
          setSellPrice(data.prices.sell || Math.round(data.prices.market * 0.997));
        } else {
          setPricePerGram(33900000);
          setBuyPrice(34001700);
          setSellPrice(33898300);
        }
      } catch {
        setPricePerGram(33900000);
        setBuyPrice(34001700);
        setSellPrice(33898300);
      } finally {
        setPriceLoading(false);
      }
    };
    fetchPrices();
  }, []);

  /* ── Get current karat info ── */
  const currentKarat = KARATS.find(k => k.id === karat) || KARATS[0];

  /* ── Calculate ── */
  const handleCalculate = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0 || !pricePerGram) return;

    const fromInfo = GOLD_UNITS.find((u) => u.id === fromUnit);
    const toInfo = GOLD_UNITS.find((u) => u.id === toUnit);
    if (!fromInfo || !toInfo) return;

    // Convert amount from `fromUnit` to grams, apply karat purity
    const pureGrams = numAmount * fromInfo.grams * currentKarat.purity;
    // Convert grams to `toUnit`
    const valueInToUnit = pureGrams / (toInfo.grams * currentKarat.purity);
    // Calculate toman value
    const tomanValue = pureGrams * pricePerGram;

    const breakdown = `${formatNumber(numAmount)} ${fromInfo.label} (${currentKarat.label}) = ${formatNumber(Math.round(valueInToUnit * 10000) / 10000)} ${toInfo.label}`;

    setResult({ value: Math.round(valueInToUnit * 10000) / 10000, toman: Math.round(tomanValue), breakdown, goldGrams: pureGrams });
    setHasCalculated(true);
  };

  /* ── Swap Units ── */
  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setResult(null);
    setHasCalculated(false);
  };

  /* ── Reset ── */
  const handleReset = () => {
    setAmount('');
    setResult(null);
    setHasCalculated(false);
  };

  /* ── Computed buy/sell prices for current weight ── */
  const buySellData = useMemo(() => {
    if (!result || !buyPrice || !sellPrice) return null;
    const grams = result.goldGrams;
    const buy = Math.round(grams * buyPrice);
    const sell = Math.round(grams * sellPrice);
    const commission = Math.round(buy * COMMISSION_RATE);
    const tax = Math.round(buy * TAX_RATE);
    const netBuy = buy - commission - tax;
    return { buy, sell, commission, tax, netBuy, spread: buy - sell };
  }, [result, buyPrice, sellPrice]);

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5">
          <Calculator className="size-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">ماشین حساب طلا</h1>
          <p className="text-xs text-muted-foreground">تبدیل واحد، محاسبه عیار و قیمت</p>
        </div>
      </div>

      {/* ── Karat Selector ── */}
      <Card className="overflow-hidden border-[#D4AF37]/20 bg-[#D4AF37]/[0.03]">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Gem className="size-4 text-[#D4AF37]" />
          <CardTitle className="text-sm font-bold">عیار طلا</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {KARATS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => { setKarat(k.id); setHasCalculated(false); }}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border p-3 transition-all active:scale-95',
                  karat === k.id
                    ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]'
                    : 'border-border hover:border-[#D4AF37]/20 text-muted-foreground hover:text-foreground',
                )}
              >
                <span className="text-xs font-bold">{k.label}</span>
                <span className="text-[9px] text-muted-foreground">{k.description}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Unit Converter ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <ArrowLeftRight className="size-4 text-[#D4AF37]" />
          <CardTitle className="text-sm font-bold">تبدیل واحد</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">مقدار</Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="مثلاً ۵.۵"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setHasCalculated(false); }}
                className="border-border bg-background pr-12 text-left text-sm font-bold tabular-nums placeholder:text-muted-foreground/50 focus:border-[#D4AF37]"
                dir="ltr"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                عدد
              </span>
            </div>
          </div>

          {/* From / To Selectors */}
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label className="text-xs font-semibold text-foreground">از</Label>
              <Select value={fromUnit} onValueChange={(v) => { setFromUnit(v as GoldUnit); setHasCalculated(false); }}>
                <SelectTrigger className="border-border bg-background text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOLD_UNITS.map((unit) => {
                    const Icon = unit.icon;
                    return (
                      <SelectItem key={unit.id} value={unit.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="size-4 text-[#D4AF37]" />
                          <span>{unit.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleSwap}
              className="mb-0.5 shrink-0 border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              <ArrowLeftRight className="size-4" />
            </Button>

            <div className="flex-1 space-y-2">
              <Label className="text-xs font-semibold text-foreground">به</Label>
              <Select value={toUnit} onValueChange={(v) => { setToUnit(v as GoldUnit); setHasCalculated(false); }}>
                <SelectTrigger className="border-border bg-background text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOLD_UNITS.map((unit) => {
                    const Icon = unit.icon;
                    return (
                      <SelectItem key={unit.id} value={unit.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="size-4 text-[#D4AF37]" />
                          <span>{unit.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Current Rate Info */}
          {priceLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-2">
              <CircleDollarSign className="size-3.5 text-[#D4AF37]" />
              <span className="text-[11px] text-foreground/70">
                قیمت هر گرم {currentKarat.label}: <span className="font-bold text-[#D4AF37]">{formatToman(Math.round(pricePerGram * currentKarat.purity))}</span>
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleCalculate}
              className="flex-1 gap-1.5 bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]"
            >
              <Calculator className="size-4" />
              محاسبه
            </Button>
            <Button variant="outline" onClick={handleReset} className="gap-1.5 border-border">
              <RotateCcw className="size-4" />
              پاک کردن
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Result Display ── */}
      {hasCalculated && result && (
        <Card className="overflow-hidden border-[#D4AF37]/30 bg-gradient-to-b from-[#D4AF37]/10 to-transparent">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Sparkles className="size-4 text-[#D4AF37]" />
            <CardTitle className="text-sm font-bold">نتیجه محاسبه</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Breakdown */}
            <div className="rounded-lg border border-border bg-background p-3 text-center">
              <p className="text-sm font-semibold text-foreground">{result.breakdown}</p>
            </div>

            {/* Value Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-background p-3 text-center">
                <p className="text-[10px] text-muted-foreground">مقدار تبدیل شده</p>
                <p className="mt-1 text-sm font-black tabular-nums text-[#D4AF37]">
                  {formatNumber(result.value)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {GOLD_UNITS.find((u) => u.id === toUnit)?.label}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3 text-center">
                <p className="text-[10px] text-muted-foreground">معادل تومانی</p>
                <p className="mt-1 text-sm font-black tabular-nums text-foreground">
                  {formatPrice(result.toman)}
                </p>
                <p className="text-[10px] text-muted-foreground">تومان</p>
              </div>
            </div>

            {/* Gold Grams */}
            <div className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">گرم طلای {currentKarat.label}:</span>
                <span className="font-bold tabular-nums">{formatNumber(result.goldGrams)} گرم</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">گرم طلای خالص:</span>
                <span className="font-bold tabular-nums">{formatNumber(Math.round(result.goldGrams * currentKarat.purity * 10000) / 10000)} گرم</span>
              </div>
              <Separator className="my-2 bg-border" />
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-foreground">مجموع:</span>
                <span className="font-black tabular-nums text-[#D4AF37]">{formatToman(result.toman)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Buy/Sell Price Display ── */}
      {!priceLoading && (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Tag className="size-4 text-[#D4AF37]" />
              <CardTitle className="text-sm font-bold">قیمت خرید و فروش</CardTitle>
            </div>
            <Badge variant="secondary" className="text-[10px] font-medium">
              زنده
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
                <p className="text-[10px] text-emerald-600/80 font-medium">قیمت خرید (هر گرم)</p>
                <p className="mt-1 text-sm font-black tabular-nums text-emerald-500">{formatToman(buyPrice)}</p>
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
                <p className="text-[10px] text-red-600/80 font-medium">قیمت فروش (هر گرم)</p>
                <p className="mt-1 text-sm font-black tabular-nums text-red-500">{formatToman(sellPrice)}</p>
              </div>
            </div>

            {/* Spread */}
            <div className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">اسپرد (فاصله خرید و فروش):</span>
                <span className="font-bold tabular-nums text-amber-500">
                  {formatToman(buyPrice - sellPrice)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tax & Commission Calculator ── */}
      {hasCalculated && buySellData && (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Receipt className="size-4 text-[#D4AF37]" />
              <CardTitle className="text-sm font-bold">مالیات و کارمزد</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-2">
                  <Percent className="size-3.5 text-amber-500" />
                  <span className="text-muted-foreground">مالیات ({(TAX_RATE * 100).toFixed(1)}٪):</span>
                </div>
                <span className="font-bold tabular-nums text-amber-500">{formatPrice(buySellData.tax)}</span>
              </div>
              <div className="flex items-center justify-between text-xs rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-2">
                  <Receipt className="size-3.5 text-blue-500" />
                  <span className="text-muted-foreground">کارمزد ({(COMMISSION_RATE * 100).toFixed(1)}٪):</span>
                </div>
                <span className="font-bold tabular-nums text-blue-500">{formatPrice(buySellData.commission)}</span>
              </div>
              <Separator className="bg-border" />
              <div className="flex items-center justify-between text-xs rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3">
                <span className="font-bold text-foreground">قیمت نهایی خرید (شامل مالیات و کارمزد):</span>
                <span className="font-black tabular-nums text-[#D4AF37]">{formatPrice(buySellData.netBuy)}</span>
              </div>
            </div>

            {/* Buy vs Sell comparison */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="text-[10px] text-emerald-600/80 font-medium mb-1">شما می‌خرید با:</p>
                <p className="text-sm font-black tabular-nums text-emerald-500">{formatPrice(buySellData.buy)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">+ مالیات و کارمزد</p>
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-[10px] text-red-600/80 font-medium mb-1">شما می‌فروشید با:</p>
                <p className="text-sm font-black tabular-nums text-red-500">{formatPrice(buySellData.sell)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">بدون کسر کارمزد</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Unit Reference Table ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Repeat className="size-4 text-[#D4AF37]" />
          <CardTitle className="text-sm font-bold">جدول تبدیل واحدها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {GOLD_UNITS.map((unit) => {
              const Icon = unit.icon;
              return (
                <div
                  key={unit.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                      <Icon className="size-4 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{unit.label}</p>
                      <p className="text-[10px] text-muted-foreground">{unit.description}</p>
                    </div>
                  </div>
                  <div className="text-start">
                    <p className="text-xs font-bold tabular-nums text-[#D4AF37]">{unit.grams} گرم</p>
                    {pricePerGram > 0 && (
                      <p className="text-[10px] tabular-nums text-muted-foreground">
                        {formatToman(Math.round(unit.grams * pricePerGram * currentKarat.purity))}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

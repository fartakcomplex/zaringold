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
  ChevronDown,
  BadgeDollarSign,
  Gem,
  Scale,
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

type GoldUnit = 'gram' | 'seke' | 'abbasi' | 'mithqal' | 'ounce';

interface UnitInfo {
  id: GoldUnit;
  label: string;
  icon: React.ElementType;
  grams: number; // equivalent grams
  description: string;
}

const GOLD_UNITS: UnitInfo[] = [
  { id: 'gram', label: 'گرم', icon: Scale, grams: 1, description: 'واحد پایه طلای آب‌شده' },
  { id: 'seke', label: 'سکه تمام', icon: Coins, grams: 7.336, description: 'سکه بهار آزادی' },
  { id: 'abbasi', label: 'نیم سکه', icon: Gem, grams: 3.668, description: 'سکه نیم بهار' },
  { id: 'mithqal', label: 'مثقال', icon: Sparkles, grams: 4.331, description: 'مثقال شرعی' },
  { id: 'ounce', label: 'اونس', icon: BadgeDollarSign, grams: 31.1035, description: 'اونس جهانی' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main GoldCalculatorView Component                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function GoldCalculatorView() {
  const { addToast } = useAppStore();

  /* ── State ── */
  const [amount, setAmount] = useState<string>('');
  const [fromUnit, setFromUnit] = useState<GoldUnit>('gram');
  const [toUnit, setToUnit] = useState<GoldUnit>('seke');
  const [pricePerGram, setPricePerGram] = useState<number>(0);
  const [priceLoading, setPriceLoading] = useState(true);
  const [bubblePremium, setBubblePremium] = useState<number>(5); // default 5%
  const [result, setResult] = useState<{ value: number; toman: number; breakdown: string } | null>(null);
  const [showBubble, setShowBubble] = useState(false);
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
        } else {
          setPricePerGram(33900000);
        }
      } catch {
        setPricePerGram(33900000);
      } finally {
        setPriceLoading(false);
      }
    };
    fetchPrices();
  }, []);

  /* ── Convert Logic ── */
  const handleCalculate = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0 || !pricePerGram) return;

    const fromInfo = GOLD_UNITS.find((u) => u.id === fromUnit);
    const toInfo = GOLD_UNITS.find((u) => u.id === toUnit);
    if (!fromInfo || !toInfo) return;

    // Convert amount from `fromUnit` to grams first
    const gramsFrom = numAmount * fromInfo.grams;
    // Then convert grams to `toUnit`
    const valueInToUnit = gramsFrom / toInfo.grams;
    // Calculate toman value based on grams
    const tomanValue = gramsFrom * pricePerGram;

    const breakdown = `${formatNumber(numAmount)} ${fromInfo.label} = ${formatNumber(Math.round(valueInToUnit * 100) / 100)} ${toInfo.label}`;

    setResult({ value: Math.round(valueInToUnit * 10000) / 10000, toman: tomanValue, breakdown });
    setHasCalculated(true);
  };

  /* ── Swap Units ── */
  const handleSwap = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    setResult(null);
    setHasCalculated(false);
  };

  /* ── Reset ── */
  const handleReset = () => {
    setAmount('');
    setResult(null);
    setHasCalculated(false);
  };

  /* ── Bubble premium calculator result ── */
  const bubbleResult = useMemo(() => {
    if (!result || !showBubble) return null;
    const premium = result.toman * (bubblePremium / 100);
    return {
      basePrice: result.toman,
      premium: premium,
      totalWithPremium: result.toman + premium,
    };
  }, [result, showBubble, bubblePremium]);

  return (
    <div className="space-y-5 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5">
          <Calculator className="size-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">محاسبهگر طلا</h1>
          <p className="text-xs text-muted-foreground">تبدیل واحد‌های طلایی و محاسبه قیمت</p>
        </div>
      </div>

      {/* Unit Converter */}
      <Card className="overflow-hidden border-border">
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
                onChange={(e) => {
                  setAmount(e.target.value);
                  setHasCalculated(false);
                }}
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

            {/* Swap Button */}
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
                قیمت هر گرم: <span className="font-bold text-[#D4AF37]">{formatToman(pricePerGram)}</span>
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

      {/* Result Display */}
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
            <div className="grid grid-cols-2 gap-3">
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

            {/* Toman Breakdown */}
            <div className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">گرم طلای آب‌شده:</span>
                <span className="font-bold tabular-nums">
                  {formatNumber(Math.round(result.value * GOLD_UNITS.find((u) => u.id === toUnit)!.grams * 1000) / 1000)} گرم
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">قیمت هر گرم:</span>
                <span className="font-bold tabular-nums">{formatToman(pricePerGram)}</span>
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

      {/* Bubble Premium Calculator */}
      <Card className="overflow-hidden border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-[#D4AF37]" />
            <CardTitle className="text-sm font-bold">حباب محاسبه</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBubble(!showBubble)}
            className="text-xs text-muted-foreground"
          >
            {showBubble ? 'بستن' : 'محاسبه حباب'}
          </Button>
        </CardHeader>
        {showBubble && (
          <CardContent className="space-y-3">
            <p className="text-[11px] text-muted-foreground">
              حباب تفاوت قیمت بازاری سکه با ارزش ذاتی طلای آن است.
            </p>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">درصد حباب</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  value={bubblePremium}
                  onChange={(e) => setBubblePremium(parseFloat(e.target.value))}
                  className="flex-1 accent-[#D4AF37]"
                />
                <span className="w-14 text-center text-sm font-bold tabular-nums text-[#D4AF37]">
                  {bubblePremium}٪
                </span>
              </div>
            </div>

            {bubbleResult && (
              <div className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">ارزش ذاتی:</span>
                  <span className="font-bold tabular-nums">{formatPrice(bubbleResult.basePrice)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">مبلغ حباب ({bubblePremium}%):</span>
                  <span className="font-bold tabular-nums text-amber-500">{formatPrice(bubbleResult.premium)}</span>
                </div>
                <Separator className="bg-border" />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-foreground">قیمت با حباب:</span>
                  <span className="font-black tabular-nums text-[#D4AF37]">{formatPrice(bubbleResult.totalWithPremium)}</span>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Unit Reference */}
      <Card className="overflow-hidden border-border">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Info className="size-4 text-[#D4AF37]" />
          <CardTitle className="text-sm font-bold">جدول واحدها</CardTitle>
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
                  <div className="text-left">
                    <p className="text-xs font-bold tabular-nums text-[#D4AF37]">{unit.grams} گرم</p>
                    {pricePerGram > 0 && (
                      <p className="text-[10px] tabular-nums text-muted-foreground">
                        {formatToman(Math.round(unit.grams * pricePerGram))}
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

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { formatToman, formatGrams, formatNumber } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Calculator, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Gold type definitions                                              */
/* ------------------------------------------------------------------ */

interface GoldType {
  id: string;
  label: string;
  grams: number;
  icon: string;
}

const GOLD_TYPES: GoldType[] = [
  { id: 'raw', label: 'طلای خام', grams: 1.0, icon: 'Au' },
  { id: 'parsian', label: 'سکه پارسیان', grams: 8.13, icon: '🪙' },
  { id: 'bahar', label: 'سکه بهار آزادی', grams: 8.13, icon: '🪙' },
  { id: 'half', label: 'نیم سکه', grams: 4.06, icon: '½' },
  { id: 'quarter', label: 'ربع سکه', grams: 2.03, icon: '¼' },
  { id: 'gram1', label: 'سکه یک گرمی', grams: 1.0, icon: '۱' },
];

/* ------------------------------------------------------------------ */
/*  Component Props                                                    */
/* ------------------------------------------------------------------ */

interface GoldCalculatorProps {
  variant?: 'landing' | 'dashboard';
  onTrade?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Gold Calculator Component                                          */
/* ------------------------------------------------------------------ */

export default function GoldCalculator({
  variant = 'landing',
  onTrade,
}: GoldCalculatorProps) {
  const { goldPrice, setPage } = useAppStore();

  /* ── State ── */
  const [inputMode, setInputMode] = useState<'weight' | 'toman'>('weight');
  const [selectedType, setSelectedType] = useState('raw');
  const [inputValue, setInputValue] = useState('');

  /* ── Derived ── */
  const buyPricePerGram = goldPrice?.buyPrice ?? 0;
  const sellPricePerGram = goldPrice?.sellPrice ?? 0;
  const spreadPerGram = buyPricePerGram - sellPricePerGram;

  const currentType = useMemo(
    () => GOLD_TYPES.find((t) => t.id === selectedType) ?? GOLD_TYPES[0],
    [selectedType],
  );

  const numericInput = parseFloat(inputValue) || 0;

  /* ── Calculations ── */
  const calculations = useMemo(() => {
    if (buyPricePerGram === 0) {
      return { grams: 0, buyTotal: 0, sellTotal: 0, spread: 0, coins: 0 };
    }

    let grams: number;
    if (inputMode === 'weight') {
      // inputValue is in the unit of selected gold type
      grams = numericInput * currentType.grams;
    } else {
      // inputValue is in toman — derive grams
      grams = numericInput / buyPricePerGram;
    }

    const buyTotal = grams * buyPricePerGram;
    const sellTotal = grams * sellPricePerGram;
    const spread = grams * spreadPerGram;
    const coins = currentType.grams > 0 ? grams / currentType.grams : 0;

    return { grams, buyTotal, sellTotal, spread, coins };
  }, [inputMode, numericInput, currentType, buyPricePerGram, sellPricePerGram, spreadPerGram]);

  /* ── Display value (the "other" side of conversion) ── */
  const displayValue = useMemo(() => {
    if (inputMode === 'weight') {
      return calculations.buyTotal;
    }
    return calculations.grams;
  }, [inputMode, calculations]);

  const handleTrade = useCallback(() => {
    if (onTrade) {
      onTrade();
    } else if (variant === 'dashboard') {
      setPage('trade');
    }
  }, [onTrade, variant, setPage]);

  /* ── Input change handler ── */
  const handleInputChange = useCallback((val: string) => {
    // Allow only numbers and decimal point
    if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
      setInputValue(val);
    }
  }, []);

  /* ── Price per unit for selected type ── */
  const buyPricePerUnit = buyPricePerGram * currentType.grams;
  const sellPricePerUnit = sellPricePerGram * currentType.grams;

  return (
    <Card
      className={`relative overflow-hidden border transition-all duration-300 ${
        variant === 'landing'
          ? 'border-gold/20 bg-gradient-to-br from-gold/5 via-card to-gold/5 shadow-xl shadow-gold/5'
          : 'border-border/60 bg-card shadow-md'
      }`}
    >
      {/* ── Card header ── */}
      <div
        className={`flex items-center gap-3 px-5 pt-5 pb-3 ${
          variant === 'landing' ? 'sm:px-7 sm:pt-7' : ''
        }`}
      >
        <div
          className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-gold-light via-gold to-gold-dark shadow-md ${
            variant === 'landing' ? 'size-11' : 'size-9'
          }`}
        >
          <Calculator className={`text-gray-950 ${variant === 'landing' ? 'size-5' : 'size-4'}`} />
        </div>
        <div>
          <h3
            className={`font-bold text-foreground ${
              variant === 'landing' ? 'text-xl' : 'text-base'
            }`}
          >
            ماشین حساب طلا
          </h3>
          <p className="text-xs text-muted-foreground">
            {goldPrice
              ? `قیمت لحظه‌ای: ${formatToman(buyPricePerGram)}`
              : 'در انتظار قیمت...'}
          </p>
        </div>
      </div>

      <Separator className="mx-5 opacity-40" />

      <CardContent className={`p-5 ${variant === 'landing' ? 'sm:p-7' : ''}`}>
        {/* ── Gold type selector ── */}
        <div className="mb-4">
          <Label className="mb-2 block text-sm font-medium text-muted-foreground">
            نوع طلا
          </Label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOLD_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <span className="flex items-center gap-2">
                    <span className="inline-flex size-6 items-center justify-center rounded-md bg-gold/10 text-[10px] font-bold text-gold">
                      {type.icon}
                    </span>
                    <span>{type.label}</span>
                    <span className="text-muted-foreground">
                      ({formatGrams(type.grams)})
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Input mode toggle ── */}
        <div className="mb-4">
          <Label className="mb-2 block text-sm font-medium text-muted-foreground">
            حالت محاسبه
          </Label>
          <ToggleGroup
            type="single"
            value={inputMode}
            onValueChange={(val) => {
              if (val) {
                setInputMode(val as 'weight' | 'toman');
                setInputValue('');
              }
            }}
            className="w-full rounded-lg border border-border/60 bg-muted/30 p-1"
          >
            <ToggleGroupItem
              value="weight"
              className="flex-1 rounded-md px-4 py-2 text-sm font-medium data-[state=on]:bg-gradient-to-r data-[state=on]:from-gold-light data-[state=on]:via-gold data-[state=on]:to-gold-dark data-[state=on]:text-gray-950 data-[state=on]:shadow-sm"
            >
              <span className="ml-1.5">⚖️</span>
              گرم / واحد
            </ToggleGroupItem>
            <ToggleGroupItem
              value="toman"
              className="flex-1 rounded-md px-4 py-2 text-sm font-medium data-[state=on]:bg-gradient-to-r data-[state=on]:from-gold-light data-[state=on]:via-gold data-[state=on]:to-gold-dark data-[state=on]:text-gray-950 data-[state=on]:shadow-sm"
            >
              <span className="ml-1.5">💰</span>
              گرم طلا
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* ── Input field ── */}
        <div className="mb-5">
          <Label className="mb-2 block text-sm font-medium text-muted-foreground">
            {inputMode === 'weight'
              ? `مقدار (${currentType.label === 'طلای خام' ? 'گرم' : 'عدد'})`
              : 'مقدار (گرم طلا)'}
          </Label>
          <div className="relative">
            <Input
              type="text"
              inputMode="decimal"
              placeholder={
                inputMode === 'weight'
                  ? currentType.label === 'طلای خام'
                    ? 'مثلاً ۵.۵ گرم'
                    : 'مثلاً ۲ عدد'
                  : 'مثلاً ۱۰۰,۰۰۰,۰۰۰'
              }
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              className="pr-4 text-left text-lg font-semibold tabular-nums placeholder:text-sm placeholder:font-normal placeholder:text-muted-foreground/60"
              dir="ltr"
            />
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              {inputMode === 'weight'
                ? currentType.label === 'طلای خام'
                  ? 'گرم'
                  : 'عدد'
                : 'گرم طلا'}
            </div>
          </div>
        </div>

        {/* ── Results ── */}
        <div
          className={`space-y-3 rounded-xl border border-border/40 bg-muted/20 p-4 ${
            variant === 'landing' ? 'sm:p-5' : ''
          }`}
        >
          {/* Converted value */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowUpDown className="size-4 text-gold" />
              {inputMode === 'weight' ? 'ارزش خرید' : 'مقدار طلا'}
            </span>
            <span className="text-base font-bold tabular-nums" dir="ltr">
              {inputMode === 'weight'
                ? numericInput > 0
                  ? formatToman(Math.round(calculations.buyTotal))
                  : '---'
                : numericInput > 0
                  ? formatGrams(calculations.grams)
                  : '---'}
            </span>
          </div>

          <Separator className="opacity-30" />

          {/* Buy price per unit */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="size-4 text-emerald-500" />
              قیمت خرید (واحد)
            </span>
            <span className="text-sm font-semibold tabular-nums" dir="ltr">
              {formatToman(Math.round(buyPricePerUnit))}
            </span>
          </div>

          {/* Sell price per unit */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingDown className="size-4 text-red-400" />
              قیمت فروش (واحد)
            </span>
            <span className="text-sm font-semibold tabular-nums" dir="ltr">
              {formatToman(Math.round(sellPricePerUnit))}
            </span>
          </div>

          {/* Spread */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              اسپرد (تفاوت)
            </span>
            <Badge
              variant="outline"
              className="border-gold/20 bg-gold/5 font-medium tabular-nums text-gold"
              dir="ltr"
            >
              {formatNumber(Math.round(buyPricePerUnit - sellPricePerUnit))} T
            </Badge>
          </div>

          <Separator className="opacity-30" />

          {/* Total weight in grams */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">وزن کل</span>
            <span className="text-sm font-bold tabular-nums" dir="ltr">
              {numericInput > 0
                ? `${formatNumber(parseFloat(calculations.grams.toFixed(3)))} گرم`
                : '---'}
            </span>
          </div>

          {/* Number of coins (if not raw gold) */}
          {selectedType !== 'raw' && numericInput > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                معادل سکه
              </span>
              <span className="text-sm font-bold tabular-nums" dir="ltr">
                {formatNumber(parseFloat(calculations.coins.toFixed(2)))}{' '}
                {currentType.label}
              </span>
            </div>
          )}
        </div>

        {/* ── CTA Button ── */}
        <Button
          onClick={handleTrade}
          className="mt-5 w-full bg-gradient-to-r from-gold-light via-gold to-gold-dark font-bold text-gray-950 shadow-lg shadow-gold/20 transition-all hover:brightness-110 hover:shadow-gold/30 active:scale-[0.98]"
          size={variant === 'landing' ? 'lg' : 'default'}
        >
          {variant === 'landing' ? 'شروع معامله' : 'خرید طلا'}
        </Button>
      </CardContent>
    </Card>
  );
}

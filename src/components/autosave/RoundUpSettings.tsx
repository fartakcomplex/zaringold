'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  CircleDollarSign,
  ArrowRightLeft,
  Info,
  History,
  Sparkles,
  TrendingUp,
  Coins,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { formatToman, formatGrams, formatNumber } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                           */
/* ═══════════════════════════════════════════════════════════════ */

interface RoundUpHistory {
  id: string;
  originalAmount: number;
  roundedAmount: number;
  goldGrams: number;
  date: string;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Constants                                                       */
/* ═══════════════════════════════════════════════════════════════ */

const ROUND_UP_OPTIONS = [
  { value: 10000, label: '۰.۰۰۳ گرم طلا' },
  { value: 50000, label: '۰.۰۱۵ گرم طلا' },
  { value: 100000, label: '۰.۰۳ گرم طلا' },
];

const MOCK_HISTORY: RoundUpHistory[] = [
  { id: 'ru-1', originalAmount: 187000, roundedAmount: 13000, goldGrams: 0.00033, date: '۱۴۰۳/۰۸/۱۵ - ۱۴:۳۲' },
  { id: 'ru-2', originalAmount: 52000, roundedAmount: 8000, goldGrams: 0.0002, date: '۱۴۰۳/۰۸/۱۴ - ۰۹:۱۵' },
  { id: 'ru-3', originalAmount: 355000, roundedAmount: 5000, goldGrams: 0.00013, date: '۱۴۰۳/۰۸/۱۳ - ۱۸:۴۵' },
  { id: 'ru-4', originalAmount: 94000, roundedAmount: 6000, goldGrams: 0.00015, date: '۱۴۰۳/۰۸/۱۲ - ۱۱:۲۰' },
  { id: 'ru-5', originalAmount: 312000, roundedAmount: 8000, goldGrams: 0.0002, date: '۱۴۰۳/۰۸/۱۱ - ۱۵:۵۰' },
  { id: 'ru-6', originalAmount: 47000, roundedAmount: 3000, goldGrams: 0.00008, date: '۱۴۰۳/۰۸/۱۰ - ۰۸:۳۰' },
  { id: 'ru-7', originalAmount: 215000, roundedAmount: 15000, goldGrams: 0.00038, date: '۱۴۰۳/۰۸/۰۹ - ۲۰:۱۰' },
  { id: 'ru-8', originalAmount: 163000, roundedAmount: 7000, goldGrams: 0.00018, date: '۱۴۰۳/۰۸/۰۸ - ۱۲:۰۰' },
];

/* ═══════════════════════════════════════════════════════════════ */
/*  Animation Variants                                               */
/* ═══════════════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/* ═══════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                 */
/* ═══════════════════════════════════════════════════════════════ */

function RoundUpSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 py-4">
        <Skeleton className="size-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Card><CardContent className="p-5 space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </CardContent></Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Component                                                   */
/* ═══════════════════════════════════════════════════════════════ */

export default function RoundUpSettings() {
  const { t } = useTranslation();
  const { addToast } = useAppStore();

  const [enabled, setEnabled] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number>(50000);
  const [isLoading] = useState(false);

  /* ── Computed ── */
  const totalRoundedUp = MOCK_HISTORY.reduce((s, h) => s + h.roundedAmount, 0);
  const totalGoldFromRoundUp = MOCK_HISTORY.reduce((s, h) => s + h.goldGrams, 0);
  const estimatedMonthly = totalRoundedUp / MOCK_HISTORY.length * 30;

  /* ── Handle toggle ── */
  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    addToast(
      checked ? 'گرد کردن فعال شد' : 'گرد کردن غیرفعال شد',
      'success'
    );
  };

  if (isLoading) return <RoundUpSkeleton />;

  return (
    <motion.div className="mx-auto max-w-2xl space-y-6" variants={containerVariants} initial="hidden" animate="show">
      {/* ── Header ── */}
      <motion.div className="flex items-center gap-4 py-2" variants={itemVariants}>
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gold/10 shadow-lg shadow-gold/10">
          <CircleDollarSign className="size-7 text-gold" />
        </div>
        <div>
          <h2 className="gold-gradient-text text-xl font-extrabold">گرد کردن خرد طلا</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            با هر خرید، مبلغ باقیمانده تا مضرب بعدی تبدیل به طلا می‌شود
          </p>
        </div>
      </motion.div>

      {/* ── Enable Toggle ── */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-gold/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-gold" />
                <div>
                  <Label htmlFor="roundup-toggle" className="text-sm font-semibold">فعال‌سازی گرد کردن</Label>
                  <p className="text-xs text-muted-foreground">مبالغ خرد خرید را به طلا تبدیل کنید</p>
                </div>
              </div>
              <Switch
                id="roundup-toggle"
                checked={enabled}
                onCheckedChange={handleToggle}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden space-y-4"
          >
            {/* ── Round-up Option ── */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <ArrowRightLeft className="size-4 text-gold" />
                    مضرب گرد کردن
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {ROUND_UP_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedOption(opt.value)}
                        className={`rounded-xl border px-3 py-3 text-center text-sm font-medium transition-all ${
                          selectedOption === opt.value
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-border text-muted-foreground hover:border-gold/30 hover:bg-gold/5'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Visual Example */}
                  <div className="rounded-xl border border-gold/15 bg-gold/5 p-4">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Info className="size-3" />
                      مثال عملی
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="rounded-lg bg-muted px-3 py-1.5 text-sm font-bold tabular-nums">
                        {formatToman(87000)}
                      </span>
                      <ArrowRightLeft className="size-4 text-gold" />
                      <span className="rounded-lg bg-gold/10 px-3 py-1.5 text-sm font-bold text-gold">
                        {formatToman(13000)}
                      </span>
                      <Coins className="size-4 text-gold" />
                      <span className="text-xs text-gold">طلا</span>
                    </div>
                    <p className="mt-2 text-center text-[11px] text-muted-foreground">
                      خرید {formatToman(87000)} → مبلغ باقیمانده تا {formatToman(100000)} تبدیل به طلا می‌شود
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Estimated Savings ── */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden border-gold/20 bg-gradient-to-br from-gold/5 to-transparent">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-4 text-gold" />
                    <span className="text-sm font-bold text-foreground">آمار گرد کردن</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground">مجموع تبدیل شده</p>
                      <p className="mt-0.5 text-sm font-bold tabular-nums gold-gradient-text">{formatToman(totalRoundedUp)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground">طلای جمع شده</p>
                      <p className="mt-0.5 text-sm font-bold tabular-nums gold-gradient-text">{formatGrams(totalGoldFromRoundUp)}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gold/15 bg-gold/5 p-2 text-center">
                    <p className="text-[10px] text-muted-foreground">برآورد ماهانه</p>
                    <p className="mt-0.5 text-xs font-bold tabular-nums">{formatToman(estimatedMonthly)}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── History ── */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <History className="size-4 text-gold" />
                    تاریخچه تبدیل‌ها
                    <Badge variant="secondary" className="bg-gold/10 text-gold text-[10px] mr-auto">
                      {formatNumber(MOCK_HISTORY.length)} مورد
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {MOCK_HISTORY.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 items-center justify-center rounded-full bg-gold/10">
                            <Coins className="size-3.5 text-gold" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{formatToman(item.roundedAmount)} طلا</p>
                            <p className="text-[10px] text-muted-foreground">{formatGrams(item.goldGrams)}</p>
                          </div>
                        </div>
                        <span className="text-muted-foreground">{item.date}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Info Card (when disabled) ── */}
      {!enabled && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex gap-3">
                <Info className="mt-0.5 size-4 shrink-0 text-gold/70" />
                <div>
                  <p className="text-sm font-medium text-foreground">چگونه کار می‌کند؟</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    وقتی گرد کردن فعال باشد، با هر خرید طلا در زرین گلد، مبلغ باقیمانده تا نزدیک‌ترین مضرب
                    انتخاب‌شده به صورت خودکار خریداری شده و به کیف پول طلایی شما اضافه می‌شود.
                    مثلاً اگر مضرب ۰.۰۳ گرم باشد و شما ۰.۰۲۶ گرم طلا خرید کنید، ۰.۰۰۴ گرم باقیمانده
                    تبدیل به طلای خرد خواهد شد.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

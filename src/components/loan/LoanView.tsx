'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  Banknote,
  HandCoins,
  Calculator,
  Shield,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { usePageEvent } from '@/hooks/use-page-event';
import { useTranslation } from '@/lib/i18n';
import {
  formatNumber,
  formatDate,
  formatDateTime,
  formatPrice,
} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Animation Variants                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

type LoanStatus = 'active' | 'pending' | 'repaid' | 'rejected' | 'overdue' | 'defaulted';

interface ApiRepayment {
  id: string;
  loanId: string;
  amount: number;
  method: string;
  status: string;
  description?: string;
  createdAt: string;
}

interface ApiLoan {
  id: string;
  userId: string;
  amountRequested: number;
  goldCollateral: number;
  goldPriceAtLoan: number;
  ltvRatio: number;
  interestRate: number;
  durationDays: number;
  amountApproved: number | null;
  status: string;
  adminNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  dueDate: string | null;
  repaidAmount: number;
  penaltyAmount: number;
  createdAt: string;
  updatedAt: string;
  repayments: ApiRepayment[];
}

interface LoanItem {
  id: string;
  status: LoanStatus;
  collateralGold: number;
  loanGoldAmount: number;   // gold grams received
  interestGold: number;      // gold grams of interest
  totalRepayGold: number;    // total gold grams to repay
  repaidGold: number;        // gold grams repaid so far
  interestRate: number;
  dueDate: string;
  createdAt: string;
  durationDays: number;
  repayments: RepaymentRecord[];
}

interface RepaymentRecord {
  id: string;
  amount: number;
  date: string;
  status: string;
}

interface LoanSettings {
  minGold: number;
  maxDuration: number;
  ltvRatio: number;
  interestRate: number;
  maxLoanAmount: number;  // max loan in gold grams
}

type FilterTab = 'all' | 'active' | 'pending' | 'repaid';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const DEFAULT_SETTINGS: LoanSettings = {
  minGold: 1,
  maxDuration: 365,
  ltvRatio: 0.7,
  interestRate: 5,
  maxLoanAmount: 500,
};

const DURATION_OPTIONS = [
  { value: 30, label: '۱ ماه' },
  { value: 60, label: '۲ ماه' },
  { value: 90, label: '۳ ماه' },
  { value: 180, label: '۶ ماه' },
  { value: 365, label: '۱ سال' },
];

const STEPS = [
  { key: 'loan.step1', icon: '🔍' },
  { key: 'loan.step2', icon: '🧮' },
  { key: 'loan.step3', icon: '📋' },
  { key: 'loan.step4', icon: '💰' },
  { key: 'loan.step5', icon: '✅' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper: format gold grams for display                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatGoldGrams(grams: number): string {
  if (grams >= 1) {
    return `${formatNumber(grams)} گرم طلا`;
  }
  return `${formatNumber(grams * 1000)} میلی‌گرم طلا`;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper: Status badge & icon                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getStatusBadge(status: LoanStatus): { className: string; label: string } {
  const map: Record<LoanStatus, { className: string; label: string }> = {
    active: { className: 'badge-success-green', label: 'فعال' },
    pending: { className: 'badge-warning-amber', label: 'در انتظار بررسی' },
    repaid: { className: 'badge-gold', label: 'بازپرداخت شده' },
    rejected: { className: 'badge-danger-red', label: 'رد شده' },
    overdue: { className: 'badge-danger-red', label: 'سررسید شده' },
    defaulted: { className: 'badge-danger-red', label: 'نکول شده' },
  };
  return map[status] || map.pending;
}

function getStatusIcon(status: LoanStatus) {
  switch (status) {
    case 'active':
      return <CheckCircle className="size-4 text-emerald-500" />;
    case 'pending':
      return <Clock className="size-4 text-amber-500" />;
    case 'repaid':
      return <CheckCircle className="size-4 text-gold" />;
    case 'rejected':
      return <XCircle className="size-4 text-red-500" />;
    case 'overdue':
      return <AlertTriangle className="size-4 text-red-500" />;
    case 'defaulted':
      return <XCircle className="size-4 text-red-500" />;
    default:
      return <Info className="size-4 text-muted-foreground" />;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Transform raw API loan → display-friendly LoanItem (gold-only)           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function transformApiLoan(apiLoan: ApiLoan): LoanItem {
  const approvedGold = apiLoan.amountApproved ?? apiLoan.amountRequested;
  const interestRateDecimal = apiLoan.interestRate / 100;
  const interestGold = approvedGold * interestRateDecimal;
  const totalRepayGold = approvedGold + interestGold;

  return {
    id: apiLoan.id,
    status: apiLoan.status as LoanStatus,
    collateralGold: apiLoan.goldCollateral,
    loanGoldAmount: approvedGold,
    interestGold,
    totalRepayGold,
    repaidGold: apiLoan.repaidAmount,
    interestRate: interestRateDecimal,
    dueDate: apiLoan.dueDate ? formatDate(apiLoan.dueDate) : '---',
    createdAt: formatDate(apiLoan.createdAt),
    durationDays: apiLoan.durationDays,
    repayments: (apiLoan.repayments || []).map((r) => ({
      id: r.id,
      amount: r.amount,
      date: formatDateTime(r.createdAt),
      status: r.status,
    })),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function LoansListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-3 w-40 rounded bg-muted" />
              </div>
              <div className="h-8 w-20 rounded-lg bg-muted" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="space-y-1.5">
                  <div className="h-3 w-16 rounded bg-muted" />
                  <div className="h-4 w-20 rounded bg-muted" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  RepayDialog — Gold-only repayment                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function RepayDialog({
  open,
  onOpenChange,
  loan,
  walletGoldGrams,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: LoanItem | null;
  walletGoldGrams: number;
  onConfirm: (amount: number) => void;
}) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingGold = loan ? loan.totalRepayGold - loan.repaidGold : 0;
  const numericAmount = parseFloat(amount) || 0;
  const hasBalance = numericAmount <= walletGoldGrams;
  const isValid = numericAmount > 0 && numericAmount <= remainingGold && hasBalance;

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setAmount('');
        setIsSubmitting(false);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const handleConfirm = useCallback(() => {
    if (!isValid) return;
    setIsSubmitting(true);
    onConfirm(numericAmount);
  }, [isValid, numericAmount, onConfirm]);

  if (!loan) return null;

  const monthlyInstallment =
    loan.durationDays > 0
      ? remainingGold / Math.max(loan.durationDays / 30, 1)
      : remainingGold;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="card-glass-premium border-gold/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Banknote className="size-5 text-gold" />
            {t('loan.repay')}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t('loan.loanId')}: {loan.id.substring(0, 12)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Loan Summary — Gold Only */}
          <div className="space-y-2.5 rounded-xl border border-border/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t('loan.totalPayment')}
              </span>
              <span className="text-sm font-bold tabular-nums">
                {formatGoldGrams(loan.totalRepayGold)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t('loan.repaidAmount')}
              </span>
              <span className="text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatGoldGrams(loan.repaidGold)}
              </span>
            </div>
            <Separator className="bg-border/30" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">
                {t('loan.remainingAmount')}
              </span>
              <span className="text-sm font-bold tabular-nums gold-gradient-text">
                {formatGoldGrams(remainingGold)}
              </span>
            </div>
          </div>

          {/* Gold Wallet Balance */}
          <div className="flex items-center justify-between rounded-xl border border-gold/15 bg-gold/5 p-3">
            <span className="text-xs font-medium text-muted-foreground">
              موجودی طلای کیف پول
            </span>
            <span className="text-sm font-bold tabular-nums text-foreground">
              {formatGoldGrams(walletGoldGrams)}
            </span>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('loan.repayAmount')} (گرم طلا)
            </Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={remainingGold.toLocaleString('fa-IR')}
              className="input-gold-focus text-left tabular-nums"
              min={0.001}
              max={remainingGold}
              step={0.001}
            />
            {numericAmount > 0 && !hasBalance && (
              <p className="flex items-center gap-1 text-xs text-red-500">
                <AlertTriangle className="size-3" />
                موجودی طلای کیف پول کافی نیست
              </p>
            )}
            {numericAmount > remainingGold && (
              <p className="flex items-center gap-1 text-xs text-red-500">
                <AlertTriangle className="size-3" />
                مقدار نباید بیشتر از باقیمانده باشد
              </p>
            )}
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setAmount(String(Math.min(remainingGold, walletGoldGrams)))
              }
              className="flex-1 rounded-lg border border-gold/20 bg-gold/5 px-2 py-1.5 text-xs font-medium text-gold transition-colors hover:bg-gold/10"
            >
              پرداخت کل
            </button>
            <button
              type="button"
              onClick={() =>
                setAmount(
                  String(
                    Math.min(
                      Math.ceil(monthlyInstallment * 1000) / 1000,
                      walletGoldGrams,
                    ),
                  ),
                )
              }
              className="flex-1 rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-gold/20 hover:text-gold"
            >
              قسط ماهانه
            </button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || isSubmitting}
            className="btn-gold-gradient flex-1"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                در حال پردازش...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Banknote className="size-4" />
                {t('loan.repay')}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  LoanCalculatorTab — Gold-only calculator                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

function LoanCalculatorTab({
  goldWallet,
  settings,
  onApplyLoan,
}: {
  goldWallet: { goldGrams: number; frozenGold: number };
  settings: LoanSettings;
  onApplyLoan: (params: { goldCollateral: number; durationDays: number }) => void;
}) {
  const { t } = useTranslation();
  const { addToast } = useAppStore();

  const [goldCollateral, setGoldCollateral] = useState<number>(1);
  const [durationDays, setDurationDays] = useState<number>(90);

  const availableGold = Math.max(0, goldWallet.goldGrams - goldWallet.frozenGold);
  const maxGold = Math.max(availableGold, 100);

  /* ── Gold-only calculations ── */
  const loanGoldAmount = useMemo(
    () => goldCollateral * settings.ltvRatio,
    [goldCollateral, settings.ltvRatio],
  );

  const interestGold = useMemo(
    () => loanGoldAmount * (settings.interestRate / 100),
    [loanGoldAmount, settings.interestRate],
  );

  const totalRepayGold = useMemo(
    () => loanGoldAmount + interestGold,
    [loanGoldAmount, interestGold],
  );

  const goldProgressPercent = maxGold > 0 ? Math.min(100, (goldCollateral / maxGold) * 100) : 0;

  const benefits = [
    {
      icon: Shield,
      title: t('loan.benefit1'),
      desc: 'بدون نیاز به ضامن یا چک صیادی',
    },
    {
      icon: TrendingUp,
      title: t('loan.benefit2'),
      desc: `نرخ سود ${formatNumber(settings.interestRate)}٪ به صورت طلای خام`,
    },
    {
      icon: Clock,
      title: t('loan.benefit3'),
      desc: 'بازپرداخت انعطاف‌پذیر با طلای کیف پول',
    },
    {
      icon: Banknote,
      title: t('loan.benefit4'),
      desc: 'واریز آنی طلای وام به کیف پول',
    },
  ];

  const handleApply = useCallback(() => {
    if (goldCollateral < settings.minGold) {
      addToast(
        `حداقل طلای وثیقه باید ${formatNumber(settings.minGold)} گرم باشد`,
        'error',
      );
      return;
    }
    if (availableGold < goldCollateral) {
      addToast('طلای کافی در کیف پول ندارید', 'error');
      return;
    }
    if (loanGoldAmount > settings.maxLoanAmount) {
      addToast('مبلغ وام بیش از سقف مجاز سیستم است', 'error');
      return;
    }
    onApplyLoan({ goldCollateral, durationDays });
  }, [
    goldCollateral,
    settings.minGold,
    availableGold,
    loanGoldAmount,
    settings.maxLoanAmount,
    durationDays,
    addToast,
    onApplyLoan,
  ]);

  return (
    <div className="space-y-8">
      {/* ── How It Works Timeline ── */}
      <motion.div variants={itemVariants}>
        <div className="mb-6 flex items-center gap-2">
          <Info className="size-5 text-gold" />
          <h3 className="text-lg font-bold">{t('loan.howItWorks')}</h3>
        </div>
        <div className="relative">
          <div className="absolute start-5 top-6 bottom-6 w-px bg-gradient-to-b from-gold/40 via-gold/20 to-transparent sm:start-8" />
          <div className="space-y-6">
            {STEPS.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="flex items-start gap-4 sm:gap-5"
              >
                <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-gold/30 bg-background text-lg shadow-sm sm:size-12 sm:text-xl">
                  {step.icon}
                  <span className="absolute -bottom-0.5 -end-0.5 flex size-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-gold-dark shadow-sm sm:size-6 sm:text-xs">
                    {formatNumber(idx + 1)}
                  </span>
                </div>
                <div className="pt-2 sm:pt-3">
                  <p className="text-sm font-medium leading-relaxed text-foreground">
                    {t(step.key)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Benefits Grid ── */}
      <motion.div variants={itemVariants}>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="size-5 text-gold" />
          <h3 className="text-lg font-bold">{t('loan.benefits')}</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
            >
              <Card className="card-gold-border hover-lift-sm h-full">
                <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-gold/10">
                    <benefit.icon className="size-6 text-gold" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    {benefit.title}
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {benefit.desc}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Calculator Card ── */}
      <motion.div variants={itemVariants}>
        <Card className="card-glass-premium border-gold/20 overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Calculator className="size-5 text-gold" />
              {t('loan.calculator')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Available Gold Display */}
            <div className="flex items-center justify-between rounded-xl border border-gold/15 bg-gold/5 p-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-gold/10">
                  <HandCoins className="size-4 text-gold" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {t('loan.availableGold')}
                </span>
              </div>
              <span className="text-sm font-bold tabular-nums gold-gradient-text">
                {formatGoldGrams(availableGold)}
              </span>
            </div>

            {/* Frozen Gold */}
            {goldWallet.frozenGold > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted/50">
                    <Lock className="size-4 text-muted-foreground" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('loan.frozenGold')}
                  </span>
                </div>
                <span className="text-sm font-bold tabular-nums text-muted-foreground">
                  {formatGoldGrams(goldWallet.frozenGold)}
                </span>
              </div>
            )}

            {/* Gold Collateral Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {t('loan.collateralGold')}
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tabular-nums gold-gradient-text">
                    {formatNumber(goldCollateral)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    گرم طلا
                  </span>
                </div>
              </div>
              <Slider
                value={[goldCollateral]}
                onValueChange={(val) => setGoldCollateral(val[0])}
                min={0.1}
                max={maxGold}
                step={0.1}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>۰.۱ گرم</span>
                <span>{formatNumber(maxGold)} گرم</span>
              </div>

              {/* Gold Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    سهم از موجودی
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatNumber(goldCollateral)} / {formatNumber(availableGold)} گرم
                  </span>
                </div>
                <Progress value={goldProgressPercent} className="h-2" />
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Duration Select */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('loan.duration')}</Label>
              <Select
                value={String(durationDays)}
                onValueChange={(val) => setDurationDays(Number(val))}
              >
                <SelectTrigger className="input-gold-focus w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-border/50" />

            {/* LTV Display */}
            <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
              <span className="text-xs font-medium text-muted-foreground">
                {t('loan.ltv')}
              </span>
              <Badge className="badge-gold text-xs">
                {formatNumber(settings.ltvRatio * 100)}٪
              </Badge>
            </div>

            <Separator className="bg-border/50" />

            {/* ── Calculated Results — Gold Only ── */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold">نتیجه محاسبه</h4>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Loan Gold Amount */}
                <div className="rounded-xl border border-gold/15 bg-gradient-to-br from-gold/5 to-transparent p-4">
                  <p className="text-xs text-muted-foreground">
                    مبلغ وام دریافتی
                  </p>
                  <p className="mt-1 text-xl font-extrabold tabular-nums gold-gradient-text">
                    {formatNumber(loanGoldAmount)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    گرم طلا
                  </p>
                </div>

                {/* Interest Gold */}
                <div className="rounded-xl border border-border/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    سود وام
                  </p>
                  <p className="mt-1 text-xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">
                    {formatNumber(interestGold)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    گرم طلا
                  </p>
                </div>

                {/* Total Repay Gold */}
                <div className="rounded-xl border border-border/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    مجموع بازپرداخت
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                    {formatNumber(totalRepayGold)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    گرم طلا
                  </p>
                </div>

                {/* Net Gold Received */}
                <div className="rounded-xl border border-border/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    خالص دریافتی (پس از کسر سود)
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                    {formatNumber(loanGoldAmount - interestGold)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    گرم طلا
                  </p>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <Button
              onClick={handleApply}
              disabled={goldCollateral < settings.minGold || loanGoldAmount <= 0}
              className="btn-gold-gradient w-full py-6 text-base font-bold"
              size="lg"
            >
              <span className="flex items-center gap-2">
                <Banknote className="size-5" />
                {t('loan.apply')}
              </span>
            </Button>

            {/* Loan Settings Info */}
            <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Info className="size-4 text-muted-foreground" />
                <span className="text-xs font-bold text-muted-foreground">
                  شرایط وام طلایی
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    {t('loan.minGold')}
                  </p>
                  <p className="mt-1 text-sm font-bold tabular-nums">
                    {formatNumber(settings.minGold)} گرم
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    {t('loan.maxDuration')}
                  </p>
                  <p className="mt-1 text-sm font-bold tabular-nums">
                    {formatNumber(settings.maxDuration)} {t('loan.days')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    {t('loan.maxLtv')}
                  </p>
                  <p className="mt-1 text-sm font-bold tabular-nums">
                    {formatNumber(settings.ltvRatio * 100)}٪
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    سقف وام
                  </p>
                  <p className="mt-1 text-sm font-bold tabular-nums">
                    {formatNumber(settings.maxLoanAmount)} گرم
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MyLoansTab — Gold-only loan listing                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MyLoansTab({
  loans,
  isLoading,
  onSelectLoanForRepay,
}: {
  loans: LoanItem[];
  isLoading: boolean;
  onSelectLoanForRepay: (loan: LoanItem) => void;
}) {
  const { t } = useTranslation();
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const filteredLoans = useMemo(() => {
    let filtered: LoanItem[];
    switch (filterTab) {
      case 'active':
        filtered = loans.filter((l) => l.status === 'active');
        break;
      case 'pending':
        filtered = loans.filter((l) => l.status === 'pending');
        break;
      case 'repaid':
        filtered = loans.filter((l) => l.status === 'repaid');
        break;
      default:
        filtered = [...loans];
    }
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortDir === 'desc' ? dateB - dateA : dateA - dateB;
    });
    return filtered;
  }, [loans, filterTab, sortDir]);

  const filterTabs: { value: FilterTab; label: string; count: number }[] =
    useMemo(
      () => [
        { value: 'all', label: t('common.all'), count: loans.length },
        {
          value: 'active',
          label: 'فعال',
          count: loans.filter((l) => l.status === 'active').length,
        },
        {
          value: 'pending',
          label: 'در انتظار',
          count: loans.filter((l) => l.status === 'pending').length,
        },
        {
          value: 'repaid',
          label: 'بازپرداخت شده',
          count: loans.filter((l) => l.status === 'repaid').length,
        },
      ],
      [loans, t],
    );

  return (
    <div className="space-y-6">
      {/* Filter Tabs + Sort */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterTab(tab.value)}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium whitespace-nowrap transition-all ${
                filterTab === tab.value
                  ? 'border-gold bg-gold/10 text-gold shadow-sm shadow-gold/10'
                  : 'border-border bg-background text-muted-foreground hover:border-gold/30 hover:text-foreground'
              }`}
            >
              {tab.label}
              <span
                className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  filterTab === tab.value
                    ? 'bg-gold text-gold-dark'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {formatNumber(tab.count)}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-gold/30 hover:text-gold"
          title="مرتب‌سازی"
        >
          <ArrowUpDown className="size-4" />
        </button>
      </div>

      {/* Loans List */}
      {isLoading ? (
        <LoansListSkeleton />
      ) : filteredLoans.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-gold/10">
            <HandCoins className="size-8 text-gold" />
          </div>
          <p className="text-base font-bold text-foreground">
            {t('loan.noLoans')}
          </p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {t('loan.noLoansDesc')}
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {filteredLoans.map((loan, idx) => {
              const badgeInfo = getStatusBadge(loan.status);
              const progressPercent =
                loan.totalRepayGold > 0
                  ? Math.min(100, Math.round((loan.repaidGold / loan.totalRepayGold) * 100))
                  : 0;
              const remainingGold = Math.max(0, loan.totalRepayGold - loan.repaidGold);
              const isExpanded = expandedId === loan.id;

              return (
                <motion.div
                  key={loan.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Card className="card-gold-border hover-lift-sm overflow-hidden">
                    <CardContent className="p-4 sm:p-5">
                      {/* Loan Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                            {getStatusIcon(loan.status)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold tabular-nums">
                                #{loan.id.substring(0, 8)}
                              </span>
                              <Badge className={`${badgeInfo.className} text-[10px]`}>
                                {badgeInfo.label}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {t('loan.loanDate')}: {loan.createdAt}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {loan.status === 'active' && (
                            <Button
                              size="sm"
                              className="btn-gold-gradient text-xs"
                              onClick={() => onSelectLoanForRepay(loan)}
                            >
                              <Banknote className="ml-1 size-3" />
                              {t('loan.repay')}
                            </Button>
                          )}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : loan.id)}
                            className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-gold/30 hover:text-gold"
                          >
                            {isExpanded ? (
                              <ChevronUp className="size-4" />
                            ) : (
                              <ChevronDown className="size-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Loan Details Grid */}
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            وثیقه طلا
                          </p>
                          <p className="mt-0.5 text-sm font-bold tabular-nums gold-gradient-text">
                            {formatNumber(loan.collateralGold)} گرم طلا
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            مبلغ وام
                          </p>
                          <p className="mt-0.5 text-sm font-bold tabular-nums">
                            {formatNumber(loan.loanGoldAmount)} گرم طلا
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            {t('loan.interestRate')}
                          </p>
                          <p className="mt-0.5 text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">
                            {formatNumber(loan.interestRate * 100)}٪
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            مجموع بازپرداخت
                          </p>
                          <p className="mt-0.5 text-sm font-bold tabular-nums">
                            {formatNumber(loan.totalRepayGold)} گرم طلا
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {(loan.status === 'active' || loan.status === 'repaid') && (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              پیشرفت بازپرداخت
                            </span>
                            <span className="font-medium tabular-nums">
                              {formatNumber(loan.repaidGold)} / {formatNumber(loan.totalRepayGold)} گرم طلا
                            </span>
                          </div>
                          <Progress value={progressPercent} className="h-2.5" />
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">
                              {formatNumber(progressPercent)}٪
                            </span>
                            <span className="font-medium text-gold">
                              باقیمانده: {formatGoldGrams(remainingGold)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 border-t border-border/50 pt-4">
                              {/* Extended Info Grid */}
                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <div>
                                  <p className="text-[10px] text-muted-foreground">
                                    سود وام
                                  </p>
                                  <p className="mt-0.5 text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">
                                    {formatNumber(loan.interestGold)} گرم طلا
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-muted-foreground">
                                    بازپرداخت شده
                                  </p>
                                  <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                    {formatNumber(loan.repaidGold)} گرم طلا
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-muted-foreground">
                                    {t('loan.dueDate')}
                                  </p>
                                  <p className="mt-0.5 text-sm font-bold tabular-nums">
                                    {loan.dueDate}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-muted-foreground">
                                    مدت وام
                                  </p>
                                  <p className="mt-0.5 text-sm font-bold tabular-nums">
                                    {formatNumber(loan.durationDays)} {t('loan.days')}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-muted-foreground">
                                    باقیمانده
                                  </p>
                                  <p className="mt-0.5 text-sm font-bold tabular-nums gold-gradient-text">
                                    {formatNumber(remainingGold)} گرم طلا
                                  </p>
                                </div>
                              </div>

                              {/* Repayment History */}
                              {loan.repayments.length > 0 && (
                                <div className="mt-4">
                                  <p className="mb-2 text-xs font-bold text-muted-foreground">
                                    {t('loan.repaymentHistory')}
                                  </p>
                                  <div className="max-h-48 space-y-2 overflow-y-auto">
                                    {loan.repayments.map((rep) => (
                                      <div
                                        key={rep.id}
                                        className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/20 px-3 py-2"
                                      >
                                        <div className="flex items-center gap-2">
                                          <CheckCircle className="size-3.5 text-emerald-500" />
                                          <span className="text-xs tabular-nums text-muted-foreground">
                                            {rep.date}
                                          </span>
                                        </div>
                                        <span className="text-xs font-bold tabular-nums">
                                          {formatNumber(rep.amount)} گرم طلا
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main LoanView Component                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */



export default function LoanView() {
  const { t } = useTranslation();
  const { user, goldWallet, addToast } = useAppStore();

  const [settings, setSettings] = useState<LoanSettings>(DEFAULT_SETTINGS);
  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [activeTab, setActiveTab] = useState('calculator');

  // Repay dialog state
  const [repayDialogOpen, setRepayDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanItem | null>(null);

  /* ── Quick Action Event Listeners ── */
  usePageEvent('new-loan', () => { setActiveTab('calculator'); });
  usePageEvent('repay', () => {
    const activeLoan = loans.find((l) => l.status === 'active');
    if (activeLoan) {
      setSelectedLoan(activeLoan);
      setRepayDialogOpen(true);
    } else {
      addToast('وام فعالی برای بازپرداخت وجود ندارد', 'info');
    }
  });

  /* ── Fetch Settings ── */
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/loans/settings');
      if (res.ok) {
        const d = await res.json();
        if (d.settings) setSettings(d.settings);
      }
    } catch {
      // use defaults
    }
  }, []);

  /* ── Fetch Loans ── */
  const fetchLoans = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingLoans(true);
    try {
      const res = await fetch(`/api/loans?userId=${user.id}`);
      if (res.ok) {
        const d = await res.json();
        setLoans((d.loans || []).map(transformApiLoan));
      }
    } catch {
      // silent
    } finally {
      setIsLoadingLoans(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  /* ── Apply Loan ── */
  const handleApplyLoan = useCallback(
    async (params: { goldCollateral: number; durationDays: number }) => {
      if (!user?.id) return;
      setIsApplying(true);
      try {
        const loanGoldAmount = params.goldCollateral * settings.ltvRatio;
        const res = await fetch('/api/loans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            goldCollateral: params.goldCollateral,
            amountRequested: loanGoldAmount,
            durationDays: params.durationDays,
          }),
        });
        const data = await res.json();
        if (data.success) {
          addToast(data.message || 'درخواست وام ثبت شد', 'success');
          fetchLoans();
          setActiveTab('myLoans');
        } else {
          addToast(data.message || 'خطا در ثبت درخواست', 'error');
        }
      } catch {
        addToast('خطا در ارتباط با سرور', 'error');
      } finally {
        setIsApplying(false);
      }
    },
    [user?.id, settings.ltvRatio, addToast, fetchLoans],
  );

  /* ── Repay Loan ── */
  const handleRepay = useCallback(
    async (goldAmount: number) => {
      if (!user?.id || !selectedLoan) return;
      try {
        const res = await fetch(`/api/loans/${selectedLoan.id}/repay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            goldAmount: goldAmount,
          }),
        });
        const data = await res.json();
        if (data.success) {
          addToast(data.message || 'بازپرداخت موفق', 'success');
          setRepayDialogOpen(false);
          setSelectedLoan(null);
          fetchLoans();
        } else {
          addToast(data.message || 'خطا در بازپرداخت', 'error');
        }
      } catch {
        addToast('خطا در ارتباط با سرور', 'error');
      }
    },
    [user?.id, selectedLoan, addToast, fetchLoans],
  );

  /* ── Open Repay Dialog ── */
  const handleSelectLoanForRepay = useCallback((loan: LoanItem) => {
    setSelectedLoan(loan);
    setRepayDialogOpen(true);
  }, []);

  return (
    <div dir="rtl" className="min-h-screen">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8"
      >
        {/* ── Page Header ── */}
        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-gold/10 sm:size-14">
              <Banknote className="size-6 text-gold sm:size-7" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold sm:text-2xl">{t('loan.title')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('loan.subtitle')} — وام و بازپرداخت به صورت طلای خام
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Gold Wallet Summary Card ── */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="card-glass-premium border-gold/20">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gold/10">
                  <HandCoins className="size-5 text-gold" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">
                    موجودی طلای کیف پول
                  </p>
                  <p className="text-lg font-extrabold tabular-nums gold-gradient-text">
                    {formatNumber(goldWallet.goldGrams)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">گرم طلا</p>
                </div>
              </CardContent>
            </Card>
            <Card className="card-glass-premium border-gold/20">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gold/10">
                  <Lock className="size-5 text-gold" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">
                    {t('loan.frozenGold')}
                  </p>
                  <p className="text-lg font-extrabold tabular-nums text-muted-foreground">
                    {formatNumber(goldWallet.frozenGold)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">گرم طلا</p>
                </div>
              </CardContent>
            </Card>
            <Card className="card-glass-premium border-gold/20">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gold/10">
                  <TrendingUp className="size-5 text-gold" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">
                    طلای آزاد
                  </p>
                  <p className="text-lg font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatNumber(Math.max(0, goldWallet.goldGrams - goldWallet.frozenGold))}
                  </p>
                  <p className="text-[10px] text-muted-foreground">گرم طلا</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* ── Main Tabs ── */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 w-full sm:w-auto">
              <TabsTrigger value="calculator" className="tab-active-gold flex-1 gap-2 sm:flex-initial">
                <Calculator className="size-4" />
                {t('loan.calculator')}
              </TabsTrigger>
              <TabsTrigger value="myLoans" className="tab-active-gold flex-1 gap-2 sm:flex-initial">
                <HandCoins className="size-4" />
                {t('loan.myLoans')}
                {loans.length > 0 && (
                  <Badge className="badge-gold mr-1 text-[10px]">{formatNumber(loans.length)}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calculator">
              <LoanCalculatorTab
                goldWallet={goldWallet}
                settings={settings}
                onApplyLoan={handleApplyLoan}
              />
              {isApplying && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-gold/20 bg-background p-8 shadow-2xl">
                    <Loader2 className="size-8 animate-spin text-gold" />
                    <p className="text-sm font-medium">در حال ثبت درخواست وام...</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="myLoans">
              <MyLoansTab
                loans={loans}
                isLoading={isLoadingLoans}
                onSelectLoanForRepay={handleSelectLoanForRepay}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      {/* ── Repay Dialog ── */}
      <RepayDialog
        open={repayDialogOpen}
        onOpenChange={setRepayDialogOpen}
        loan={selectedLoan}
        walletGoldGrams={goldWallet.goldGrams}
        onConfirm={handleRepay}
      />
    </div>
  );
}

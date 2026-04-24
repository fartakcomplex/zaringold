'use client';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from '@/lib/recharts-compat';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  Wallet,
  Coins,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  TrendingDown,
  Gift,
  ArrowLeftRight,
  Receipt,
  AlertCircle,
  CheckCircle,
  Loader2,
  ShieldAlert,
  ChevronDown,
  Repeat,
  Zap,
  Activity,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import GoldGiftDialog from '@/components/gold/GoldGiftDialog';
import PaymentDialog from '@/components/payment/PaymentDialog';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { usePageEvent } from '@/hooks/use-page-event';
import {
  formatToman,
  formatGrams,
  formatNumber,
} from '@/lib/helpers';

import {
  formatPrice,
  formatDateTime,
  getTransactionTypeLabel,
  getTransactionStatusColor,
  getTransactionStatusLabel,
  cn,
} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Quick Deposit Amounts                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

const DEPOSIT_QUICK_AMOUNTS = [
  { value: 0.1, label: '۰.۱ گرم' },
  { value: 0.5, label: '۰.۵ گرم' },
  { value: 1, label: '۱ گرم' },
  { value: 5, label: '۵ گرم' },
];

const WITHDRAW_QUICK_AMOUNTS = [
  { value: 0.1, label: '۰.۱ گرم' },
  { value: 0.5, label: '۰.۵ گرم' },
  { value: 1, label: '۱ گرم' },
  { value: 5, label: '۵ گرم' },
];

const MONTHLY_SUMMARY = [
  { label: 'واریز', icon: 'deposit', amount: 0, positive: true, change: 0 },
  { label: 'برداشت', icon: 'withdraw', amount: 0, positive: false, change: 0 },
  { label: 'خرید طلا', icon: 'buy', amount: 0, positive: true, change: 0 },
  { label: 'فروش طلا', icon: 'sell', amount: 0, positive: true, change: 0 },
];

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
/*  Constants                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getDepositQuickAmounts(t: (k: string) => string, locale: string) {
  return [
    { value: 500000, label: locale === 'en' ? '500K' : '۵۰۰ هزار' },
    { value: 1000000, label: locale === 'en' ? '1M' : '۱ میلیون' },
    { value: 5000000, label: locale === 'en' ? '5M' : '۵ میلیون' },
    { value: 10000000, label: locale === 'en' ? '10M' : '۱۰ میلیون' },
  ];
}

function getWithdrawQuickAmounts(t: (k: string) => string, locale: string) {
  return [
    { value: 1000000, label: locale === 'en' ? '1M' : '۱ میلیون' },
    { value: 5000000, label: locale === 'en' ? '5M' : '۵ میلیون' },
    { value: 10000000, label: locale === 'en' ? '10M' : '۱۰ میلیون' },
    { value: 50000000, label: locale === 'en' ? '50M' : '۵۰ میلیون' },
  ];
}

function getTxFilterOptions(t: (k: string) => string) {
  return [
    { value: 'all', label: t('common.all') },
    { value: 'deposit', label: t('wallet.deposit') },
    { value: 'withdraw', label: t('wallet.withdraw') },
    { value: 'buy_gold,gold_buy', label: t('dashboard.buyGold') },
    { value: 'sell_gold,gold_sell', label: t('dashboard.sellGold') },
  ] as const;
}

const PIE_COLORS = ['#D4AF37', '#10b981']; // gold, emerald
const PAGE_SIZE = 8;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Data for Charts                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getMonthlySummary(t: (k: string) => string) {
  return [
    { label: t('wallet.monthDeposit'), amount: 45000000, change: 12.5, icon: 'deposit' as const, positive: true },
    { label: t('wallet.monthWithdraw'), amount: 18000000, change: -8.3, icon: 'withdraw' as const, positive: false },
    { label: t('dashboard.buyGold'), amount: 32000000, change: 24.1, icon: 'buy' as const, positive: true },
    { label: t('dashboard.sellGold'), amount: 12500000, change: -5.7, icon: 'sell' as const, positive: false },
  ];
}

const TX_BREAKDOWN = [
  { type: 'واریز', amount: 45000000, color: '#10b981' },
  { type: 'برداشت', amount: 18000000, color: '#ef4444' },
  { type: 'خرید طلا', amount: 32000000, color: '#D4AF37' },
  { type: 'فروش طلا', amount: 12500000, color: '#f59e0b' },
  { type: 'پاداش دعوت', amount: 3500000, color: '#8b5cf6' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Custom Pie Tooltip                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Bar Chart Tooltip                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function BarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { type: string; amount: number } }> }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground">{d.type}</p>
      <p className="text-sm font-bold tabular-nums text-foreground">{formatToman(d.amount)}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Custom Pie Tooltip                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground">{payload[0].name}</p>
      <p className="text-sm font-bold tabular-nums text-foreground">
        {formatToman(payload[0].value)}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Portfolio History Area Tooltip                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PortfolioHistoryTooltip({
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
    <div className="rounded-lg border border-gold/30 bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-gold">{label}</p>
      <p className="text-sm font-bold tabular-nums text-gold-gradient">
        {payload[0].value.toLocaleString('fa-IR')} گرم طلا
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Transaction Icon Helper                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TxIcon({ type }: { type: string }) {
  const iconMap: Record<string, React.ElementType> = {
    deposit: ArrowDownToLine,
    withdraw: ArrowUpFromLine,
    buy_gold: TrendingUp,
    gold_buy: TrendingUp,
    sell_gold: TrendingDown,
    gold_sell: TrendingDown,
    referral_reward: Gift,
    cashback: Coins,
    transfer: ArrowLeftRight,
  };
  const Icon = iconMap[type] || Receipt;

  const colorMap: Record<string, string> = {
    deposit: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    withdraw: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
    buy_gold: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    gold_buy: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    sell_gold: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    gold_sell: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    referral_reward: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    cashback: 'bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400',
    transfer: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400',
  };

  return (
    <div
      className={cn(
        'flex size-9 items-center justify-center rounded-lg',
        colorMap[type] || 'bg-muted text-muted-foreground',
      )}
    >
      <Icon className="size-4" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeletons                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PortfolioSkeleton() {
  return (
    <Card className="overflow-hidden border-gold/15 md:col-span-2">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="size-28 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function WalletTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="mb-4 h-8 w-40" />
        <Skeleton className="h-3 w-full" />
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
        <div className="mt-4 flex gap-3">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main WalletView Component                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function WalletView() {
  const {
    user,
    fiatWallet,
    goldWallet,
    goldPrice,
    transactions,
    setPage,
    setFiatWallet,
    setGoldWallet,
    setGoldPrice,
    setTransactions,
    addTransaction,
    addToast,
  } = useAppStore();
  const { t, locale } = useTranslation();

  /* ── State ── */
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fiat');
  const [txFilter, setTxFilter] = useState('all');
  const [txPage, setTxPage] = useState(1);

  // Payment gateway dialog
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Deposit dialog (internal/old)
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositSubmitting, setDepositSubmitting] = useState(false);

  // Withdraw dialog
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  // Gift dialog
  const [giftOpen, setGiftOpen] = useState(false);

  /* ── Quick Action Event Listeners ── */
  usePageEvent('deposit', () => setPaymentOpen(true));
  usePageEvent('withdraw', () => setWithdrawOpen(true));

  /* ── Computed Values ── */
  const fiatAvailable = fiatWallet.balance - fiatWallet.frozenBalance;
  const goldAvailable = goldWallet.goldGrams - goldWallet.frozenGold;
  const goldValue = goldWallet.goldGrams * (goldPrice?.buyPrice ?? 0);
  const totalPortfolio = fiatWallet.balance + goldValue;

  // Pie chart data
  const pieData = [
    { name: 'کیف پول طلایی', value: fiatWallet.balance },
    { name: 'ارزش طلای شما', value: goldValue },
  ];

  // Fiat progress percentage
  const fiatUsagePercent =
    fiatWallet.balance > 0
      ? Math.round((fiatWallet.frozenBalance / fiatWallet.balance) * 100)
      : 0;

  // Gold progress percentage
  const goldUsagePercent =
    goldWallet.goldGrams > 0
      ? Math.round((goldWallet.frozenGold / goldWallet.goldGrams) * 100)
      : 0;

  // Filtered transactions
  const filteredTransactions = txFilter === 'all'
    ? transactions
    : transactions.filter((tx) => {
        const filterTypes = txFilter.split(',');
        return filterTypes.includes(tx.type);
      });

  const totalFilteredPages = Math.ceil(filteredTransactions.length / PAGE_SIZE);
  const paginatedTransactions = filteredTransactions.slice(0, txPage * PAGE_SIZE);
  const hasMore = txPage * PAGE_SIZE < filteredTransactions.length;

  /* ── Data Fetching ── */
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const [walletRes, pricesRes, txRes] = await Promise.all([
        fetch(`/api/wallet?userId=${user.id}`),
        fetch('/api/gold/prices'),
        fetch(`/api/transactions?userId=${user.id}&limit=50`),
      ]);

      if (walletRes.ok) {
        const data = await walletRes.json();
        if (data.success) {
          setFiatWallet({
            balance: data.fiat?.balance ?? 0,
            frozenBalance: data.fiat?.frozenBalance ?? 0,
          });
          setGoldWallet({
            goldGrams: data.gold?.grams ?? 0,
            frozenGold: data.gold?.frozenGold ?? 0,
          });
        }
      }

      if (pricesRes.ok) {
        const data = await pricesRes.json();
        if (data.success) {
          setGoldPrice({
            buyPrice: data.prices?.buy ?? 0,
            sellPrice: data.prices?.sell ?? 0,
            marketPrice: data.prices?.market ?? 0,
            ouncePrice: data.prices?.ounce ?? 0,
            spread: data.prices?.spread ?? 0,
            updatedAt: data.prices?.updatedAt ?? new Date().toISOString(),
          });
        }
      }

      if (txRes.ok) {
        const data = await txRes.json();
        if (data.success) {
          setTransactions(data.transactions || []);
        }
      }
    } catch (error) {
      console.error('WalletView fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, setFiatWallet, setGoldWallet, setGoldPrice, setTransactions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset pagination when filter changes
  useEffect(() => {
    setTxPage(1);
  }, [txFilter]);

  /* ── Handlers ── */
  const handleDeposit = async () => {
    if (!user?.id || !depositAmount || Number(depositAmount) <= 0) return;
    setDepositSubmitting(true);
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount: Number(depositAmount) }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message, 'success');
        setDepositOpen(false);
        setDepositAmount('');
        addTransaction({
          id: Date.now().toString(),
          type: 'deposit',
          amountFiat: Number(depositAmount),
          amountGold: 0,
          fee: 0,
          status: 'success',
          referenceId: '',
          description: 'واریز به کیف پول',
          createdAt: new Date().toISOString(),
        });
        setFiatWallet({ ...fiatWallet, balance: fiatWallet.balance + Number(depositAmount) });
        fetchData();
      } else {
        addToast(data.message, 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setDepositSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user?.id || !withdrawAmount || Number(withdrawAmount) <= 0) return;
    setWithdrawSubmitting(true);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount: Number(withdrawAmount) }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message, 'success');
        setWithdrawOpen(false);
        setWithdrawAmount('');
        addTransaction({
          id: Date.now().toString(),
          type: 'withdraw',
          amountFiat: Number(withdrawAmount),
          amountGold: 0,
          fee: 0,
          status: 'pending',
          referenceId: '',
          description: 'درخواست برداشت',
          createdAt: new Date().toISOString(),
        });
        setFiatWallet({ ...fiatWallet, balance: fiatWallet.balance - Number(withdrawAmount) });
        fetchData();
      } else {
        addToast(data.message, 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                  */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <motion.div
      className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ──────────────────────────────────────────────────────── */}
      {/*  Portfolio Card                                         */}
      {/* ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <PortfolioSkeleton />
      ) : (
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="overflow-hidden border-gold/20 bg-gradient-to-l from-gold/[0.06] via-card to-gold/[0.06] ring-1 ring-gold/10">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
                {/* Portfolio Info */}
                <div className="text-center sm:text-right">
                  <p className="text-sm font-medium text-muted-foreground">ارزش کل پرتفوی</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums gold-gradient-text sm:text-4xl">
                    {formatToman(totalPortfolio)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground sm:justify-start">
                    <span>
                      طلایی: <span className="font-semibold text-foreground">{formatToman(fiatWallet.balance)}</span>
                    </span>
                    <Separator orientation="vertical" className="h-3" />
                    <span>
                      طلایی:{' '}
                      <span className="font-semibold gold-gradient-text">{formatGrams(goldWallet.goldGrams)}</span>
                    </span>
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="chart-container relative">
                  <div className="size-28 sm:size-32 md:size-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="mt-2 flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="size-2.5 rounded-full bg-gold" />
                      <span className="text-[10px] text-muted-foreground">طلایی</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="size-2.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-muted-foreground">طلایی</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Portfolio Breakdown Chart                               */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-gold/15">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Wallet className="size-4 text-gold" />
                ترکیب پرتفوی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="relative mx-auto h-[200px] w-[200px] md:h-[260px] md:w-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        animationBegin={0}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center text overlay */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-muted-foreground">ارزش کل</span>
                    <span className="text-sm font-bold tabular-nums gold-gradient-text">
                      {formatToman(totalPortfolio)}
                    </span>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-gold" />
                    <span className="text-xs text-muted-foreground">طلایی ({formatGrams(goldWallet.goldGrams)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-emerald-500" />
                    <span className="text-xs text-muted-foreground">طلایی ({formatToman(goldValue)})</span>
                  </div>
                </div>
                {/* Percentage bars */}
                <div className="flex w-full gap-4">
                  <div className="flex-1 rounded-lg bg-gold/5 p-3 text-center">
                    <p className="text-lg font-bold tabular-nums text-gold">
                      {totalPortfolio > 0 ? Math.round((fiatWallet.balance / totalPortfolio) * 100) : 0}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">سهم طلایی</p>
                  </div>
                  <div className="flex-1 rounded-lg bg-emerald-500/5 p-3 text-center">
                    <p className="text-lg font-bold tabular-nums text-emerald-500">
                      {totalPortfolio > 0 ? Math.round((goldValue / totalPortfolio) * 100) : 0}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">سهم طلایی</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Portfolio History Chart                                */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && (() => {
        // Generate 30 days of mock portfolio history data
        const portfolioHistory: Array<{ date: string; label: string; value: number }> = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const progress = (29 - i) / 29; // 0 → 1
          const trend = 50_000_000 + progress * 37_000_000; // ~50M → ~87M
          const noise = (Math.sin(i * 2.7) * 2_500_000) + (Math.cos(i * 1.3) * 1_500_000);
          const value = Math.round(trend + noise);
          const persianDate = new Intl.DateTimeFormat('fa-IR', {
            month: 'short',
            day: 'numeric',
          }).format(d);
          portfolioHistory.push({
            date: d.toISOString().slice(0, 10),
            label: persianDate,
            value,
          });
        }
        const allValues = portfolioHistory.map((d) => d.value);
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const avgValue = Math.round(allValues.reduce((a, b) => a + b, 0) / allValues.length);

        return (
          <motion.div variants={itemVariants}>
            <Card className="card-gold-border overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <TrendingUp className="size-4 text-gold" />
                    تاریخچه پرتفوی
                  </CardTitle>
                  <Badge className="badge-gold text-[10px] font-medium">
                    ۳۰ روز اخیر
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="chart-container h-[220px] w-full md:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={portfolioHistory}
                      margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 9, fill: 'oklch(0.52 0.01 85)' }}
                        axisLine={false}
                        tickLine={false}
                        interval={4}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: 'oklch(0.52 0.01 85)' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}`}
                        width={30}
                      />
                      <Tooltip
                        content={<PortfolioHistoryTooltip />}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#D4AF37"
                        strokeWidth={2}
                        fill="url(#goldGradient)"
                        animationDuration={1500}
                        animationEasing="ease-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Stats row */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="rounded-xl bg-muted/30 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">کمترین</p>
                    <p className="mt-0.5 text-sm font-bold tabular-nums text-gold-gradient">
                      {minValue.toLocaleString('fa-IR')}
                    </p>
                    <p className="text-[9px] text-muted-gold">گرم طلا</p>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">بیشترین</p>
                    <p className="mt-0.5 text-sm font-bold tabular-nums text-gold-gradient">
                      {maxValue.toLocaleString('fa-IR')}
                    </p>
                    <p className="text-[9px] text-muted-gold">گرم طلا</p>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">میانگین</p>
                    <p className="mt-0.5 text-sm font-bold tabular-nums text-gold-gradient">
                      {avgValue.toLocaleString('fa-IR')}
                    </p>
                    <p className="text-[9px] text-muted-gold">گرم طلا</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })()}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Monthly Spending/Income Summary                        */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && (
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Activity className="size-4 text-gold" />
                خلاصه عملکرد ماهانه
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {MONTHLY_SUMMARY.map((item) => {
                  const iconMap: Record<string, React.ElementType> = {
                    deposit: ArrowDownToLine,
                    withdraw: ArrowUpFromLine,
                    buy: TrendingUp,
                    sell: TrendingDown,
                  };
                  const Icon = iconMap[item.icon] || Receipt;
                  return (
                    <div key={item.label} className="rounded-xl border bg-muted/20 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <div
                          className={cn(
                            'flex size-8 items-center justify-center rounded-lg',
                            item.positive
                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
                          )}
                        >
                          <Icon className="size-4" />
                        </div>
                        <span className="text-[11px] text-muted-foreground">{item.label}</span>
                      </div>
                      <p className="text-base font-bold tabular-nums text-foreground">
                        {formatToman(item.amount)}
                      </p>
                      <p
                        className={cn(
                          'mt-1 text-[11px] font-medium',
                          item.change >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-500 dark:text-red-400',
                        )}
                      >
                        {item.change >= 0 ? '▲' : '▼'}{' '}
                        {Math.abs(item.change)}% نسبت به ماه قبل
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Transaction Breakdown                                   */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Receipt className="size-4 text-gold" />
                ترکیب تراکنش‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full md:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={TX_BREAKDOWN} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.08 85 / 15%)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'oklch(0.52 0.01 85)' }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="type" tick={{ fontSize: 11, fill: 'oklch(0.52 0.01 85)' }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="amount" radius={[0, 6, 6, 0]} animationDuration={1000}>
                      {TX_BREAKDOWN.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Recent Transactions Widget                             */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && (() => {
        const MOCK_RECENT_TX = [
          { id: 'tx-1', type: 'buy_gold', amountFiat: -5000000, amountGold: 0.142, status: 'success', createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), description: 'خرید طلا' },
          { id: 'tx-2', type: 'deposit', amountFiat: 10000000, amountGold: 0, status: 'success', createdAt: new Date(Date.now() - 5 * 3600000).toISOString(), description: 'واریز به کیف پول' },
          { id: 'tx-3', type: 'sell_gold', amountFiat: 3200000, amountGold: -0.091, status: 'success', createdAt: new Date(Date.now() - 12 * 3600000).toISOString(), description: 'فروش طلا' },
          { id: 'tx-4', type: 'referral_reward', amountFiat: 500000, amountGold: 0.014, status: 'success', createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), description: 'پاداش دعوت' },
          { id: 'tx-5', type: 'withdraw', amountFiat: -2000000, amountGold: 0, status: 'pending', createdAt: new Date(Date.now() - 48 * 3600000).toISOString(), description: 'درخواست برداشت' },
        ];

        return (
          <motion.div variants={itemVariants}>
            <Card className="card-gold-border overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Receipt className="size-4 text-gold" />
                  آخرین تراکنش‌ها
                </CardTitle>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setPage('transactions'); }}
                  className="text-xs font-medium text-gold hover:text-gold/80 transition-colors"
                >
                  مشاهده همه
                </a>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {MOCK_RECENT_TX.map((tx) => {
                    const isIncoming = tx.amountFiat > 0;
                    return (
                      <div
                        key={tx.id}
                        className="table-row-hover-gold flex items-center gap-3 rounded-lg p-3 transition-colors"
                      >
                        <TxIcon type={tx.type} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                          <p className="text-[11px] text-muted-gold">
                            {formatDateTime(tx.createdAt)}
                          </p>
                        </div>
                        <div className="text-left">
                          <p
                            className={cn(
                              'text-sm font-semibold tabular-nums',
                              isIncoming ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500',
                            )}
                          >
                            {isIncoming ? '+' : ''}{formatToman(Math.abs(tx.amountFiat))}
                          </p>
                          {tx.amountGold !== 0 && (
                            <p className="text-[10px] tabular-nums text-muted-foreground">
                              {tx.amountGold > 0 ? '+' : ''}{tx.amountGold.toFixed(3)} گرم
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })()}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Wallet Tabs                                            */}
      {/* ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <WalletTabSkeleton />
      ) : (
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="fiat" className={cn('text-sm', activeTab === 'fiat' && 'tab-active-gold')}>
                <Wallet className="ml-2 size-4" />
                کیف پول طلایی
              </TabsTrigger>
              <TabsTrigger value="gold" className={cn('text-sm', activeTab === 'gold' && 'tab-active-gold')}>
                <Coins className="ml-2 size-4" />
                کیف پول طلایی
              </TabsTrigger>
            </TabsList>

            {/* ════════════════ Fiat Wallet Tab ════════════════ */}
            <TabsContent value="fiat">
              <Card className="overflow-hidden border-border/50">
                <CardContent className="p-4 md:p-6">
                  {/* Balance */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">موجودی کل</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                      {formatToman(fiatWallet.balance)}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">میزان استفاده</span>
                      <span className="tabular-nums text-muted-foreground">{fiatUsagePercent}%</span>
                    </div>
                    <Progress value={fiatUsagePercent} className="h-2" />
                  </div>

                  {/* Frozen & Available */}
                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">موجودی مسدود</p>
                      <p className="mt-1 text-base font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                        {formatToman(fiatWallet.frozenBalance)}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
                      <p className="text-xs text-muted-foreground">موجودی آزاد</p>
                      <p className="mt-1 text-base font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatToman(Math.max(0, fiatAvailable))}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setPaymentOpen(true)}
                      className="flex-1 bg-gold text-gold-dark font-bold hover:bg-gold/90"
                    >
                      <CreditCard className="ml-2 size-4" />
                      درگاه پرداخت
                    </Button>
                    <Button
                      onClick={() => setWithdrawOpen(true)}
                      variant="outline"
                      className="flex-1 border-border font-bold"
                      disabled={fiatAvailable <= 0}
                    >
                      <ArrowUpFromLine className="ml-2 size-4" />
                      برداشت
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ════════════════ Gold Wallet Tab ════════════════ */}
            <TabsContent value="gold">
              <Card className="overflow-hidden border-gold/15 bg-gradient-to-br from-gold/[0.03] via-card to-gold/[0.01]">
                <CardContent className="p-4 md:p-6">
                  {/* Gold Balance */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">موجودی طلای شما</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums gold-gradient-text sm:text-3xl">
                      {formatGrams(goldWallet.goldGrams)}
                    </p>
                  </div>

                  {/* Gold Price & Value */}
                  {goldPrice && (
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                      <div className="rounded-lg bg-muted/50 px-3 py-1.5">
                        <span className="text-xs text-muted-foreground">قیمت هر گرم: </span>
                        <span className="text-xs font-semibold tabular-nums text-foreground">
                          {formatToman(goldPrice.buyPrice)}
                        </span>
                      </div>
                      <div className="rounded-lg bg-gold/10 px-3 py-1.5">
                        <span className="text-xs text-muted-foreground">ارزش طلای شما: </span>
                        <span className="text-xs font-bold tabular-nums gold-gradient-text">
                          {formatToman(goldValue)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">طلای مسدود</span>
                      <span className="tabular-nums text-muted-foreground">{goldUsagePercent}%</span>
                    </div>
                    <Progress value={goldUsagePercent} className="h-2" />
                  </div>

                  {/* Frozen & Available */}
                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">طلای مسدود</p>
                      <p className="mt-1 text-base font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                        {formatGrams(goldWallet.frozenGold)}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
                      <p className="text-xs text-muted-foreground">طلای آزاد</p>
                      <p className="mt-1 text-base font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatGrams(Math.max(0, goldAvailable))}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setPage('trade')}
                      className="flex-1 bg-gradient-to-l from-gold via-gold-light to-gold text-gold-dark font-bold shadow-lg shadow-gold/15 hover:from-gold-light hover:via-gold hover:to-gold-light"
                    >
                      <TrendingUp className="ml-2 size-4" />
                      خرید طلا
                    </Button>
                    <Button
                      onClick={() => setPage('trade')}
                      variant="outline"
                      className="flex-1 border-emerald-200 font-bold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                      disabled={goldAvailable <= 0}
                    >
                      <TrendingDown className="ml-2 size-4" />
                      فروش طلا
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Quick Actions                                          */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-gold/15">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Zap className="size-4 text-gold" />
                دسترسی سریع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Button
                  onClick={() => setPaymentOpen(true)}
                  className="flex h-auto flex-col items-center gap-2 bg-gold/10 py-4 text-gold hover:bg-gold/20"
                  variant="ghost"
                >
                  <CreditCard className="size-5" />
                  <span className="text-xs font-medium">درگاه پرداخت</span>
                </Button>
                <Button
                  onClick={() => setWithdrawOpen(true)}
                  className="flex h-auto flex-col items-center gap-2 py-4 hover:bg-red-50 dark:hover:bg-red-950/20"
                  variant="ghost"
                >
                  <ArrowUpFromLine className="size-5 text-red-500" />
                  <span className="text-xs font-medium">برداشت</span>
                </Button>
                <Button
                  onClick={() => setPage('trade')}
                  className="flex h-auto flex-col items-center gap-2 bg-gold/10 py-4 text-gold hover:bg-gold/20"
                  variant="ghost"
                >
                  <Repeat className="size-5" />
                  <span className="text-xs font-medium">فروش طلا</span>
                </Button>
                <Button
                  onClick={() => setPage('trade')}
                  className="flex h-auto flex-col items-center gap-2 bg-gradient-to-b from-gold/15 to-gold/5 py-4 text-gold-dark hover:from-gold/25 hover:to-gold/10"
                  variant="ghost"
                >
                  <Zap className="size-5" />
                  <span className="text-xs font-medium">خرید سریع</span>
                </Button>
                <Button
                  onClick={() => setGiftOpen(true)}
                  className="col-span-2 flex h-auto flex-col items-center gap-2 border border-gold/30 bg-gradient-to-b from-gold/10 to-gold/5 py-4 text-gold hover:from-gold/20 hover:to-gold/10 sm:col-span-1"
                  variant="ghost"
                >
                  <Gift className="size-5" />
                  <span className="text-xs font-medium">🎁 هدیه طلا</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Transaction History                                     */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && (
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Receipt className="size-4 text-gold" />
                تاریخچه تراکنش‌ها
              </CardTitle>
              <Select value={txFilter} onValueChange={setTxFilter}>
                <SelectTrigger className="w-36 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getTxFilterOptions(t).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {paginatedTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
                    <Receipt className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">تراکنشی یافت نشد</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    تراکنش‌های شما پس از اولین عملیات مالی نمایش داده می‌شود
                  </p>
                </div>
              ) : (
                <>
                  <div className="max-h-96 space-y-1 overflow-y-auto">
                    {paginatedTransactions.map((tx) => {
                      const isBuy =
                        tx.type === 'buy_gold' || tx.type === 'gold_buy';
                      const isSell =
                        tx.type === 'sell_gold' || tx.type === 'gold_sell';
                      const isIncoming =
                        tx.type === 'deposit' ||
                        tx.type === 'sell_gold' ||
                        tx.type === 'gold_sell' ||
                        tx.type === 'referral_reward' ||
                        tx.type === 'cashback';

                      return (
                        <div
                          key={tx.id}
                          className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50"
                        >
                          <TxIcon type={tx.type} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">
                                {getTransactionTypeLabel(
                                  tx.type === 'gold_buy'
                                    ? 'buy_gold'
                                    : tx.type === 'gold_sell'
                                      ? 'sell_gold'
                                      : tx.type,
                                )}
                              </p>
                              <Badge
                                variant="outline"
                                className={cn('text-[10px]', getTransactionStatusColor(tx.status))}
                              >
                                {getTransactionStatusLabel(tx.status)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(tx.createdAt)}
                            </p>
                          </div>
                          <div className="text-left">
                            <p
                              className={cn(
                                'text-sm font-semibold tabular-nums',
                                isIncoming
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-red-500 dark:text-red-400',
                              )}
                            >
                              {isIncoming ? '+' : '-'}
                              {tx.amountGold > 0 && tx.amountFiat === 0
                                ? formatGrams(tx.amountGold)
                                : formatPrice(tx.amountFiat)}
                            </p>
                            {tx.fee > 0 && (
                              <p className="text-[10px] tabular-nums text-muted-foreground">
                                کارمزد: {formatToman(tx.fee)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Load More */}
                  {hasMore && (
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTxPage((p) => p + 1)}
                        className="gap-2"
                      >
                        <ChevronDown className="size-4" />
                        نمایش بیشتر
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Deposit Dialog                                          */}
      {/* ──────────────────────────────────────────────────────── */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownToLine className="size-5 text-emerald-500" />
              واریز به کیف پول
            </DialogTitle>
            <DialogDescription>
              مبلغ مورد نظر را وارد کنید یا یکی از مبالغ پیشنهادی را انتخاب نمایید.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">مقدار (گرم طلا)</Label>
              <div className="relative">
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="مقدار را وارد کنید"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="text-left tabular-nums text-lg"
                  min={0}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  گرم طلا
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEPOSIT_QUICK_AMOUNTS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setDepositAmount(String(item.value))}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-all hover:border-gold/50 hover:bg-gold/5 active:scale-[0.96]',
                    Number(depositAmount) === item.value
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-border text-foreground',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {depositAmount && Number(depositAmount) > 0 && (
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">مبلغ واریز</p>
                <p className="text-lg font-bold tabular-nums gold-gradient-text">
                  {formatToman(Number(depositAmount))}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setDepositOpen(false); setDepositAmount(''); }}>
              انصراف
            </Button>
            <Button
              onClick={handleDeposit}
              disabled={!depositAmount || Number(depositAmount) <= 0 || depositSubmitting}
              className="bg-gold text-gold-dark hover:bg-gold/90"
            >
              {depositSubmitting ? (
                <>
                  <Loader2 className="ml-2 size-4 animate-spin" />
                  در حال پردازش...
                </>
              ) : (
                <>
                  <CheckCircle className="ml-2 size-4" />
                  تأیید واریز
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Withdraw Dialog                                         */}
      {/* ──────────────────────────────────────────────────────── */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpFromLine className="size-5 text-red-500" />
              برداشت از کیف پول
            </DialogTitle>
            <DialogDescription>
              مبلغ مورد نظر را برای برداشت وارد کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* KYC Warning */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  توجه: احراز هویت الزامی است
                </p>
                <p className="mt-0.5 text-xs text-amber-600/80 dark:text-amber-400/80">
                  برای برداشت وجه، ابتدا احراز هویت (KYC) خود را تکمیل کنید.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">مقدار (گرم طلا)</Label>
              <div className="relative">
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="مقدار را وارد کنید"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="text-left tabular-nums text-lg"
                  min={0}
                  max={fiatAvailable}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  گرم طلا
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {WITHDRAW_QUICK_AMOUNTS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setWithdrawAmount(String(item.value))}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-all hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-[0.96]',
                    Number(withdrawAmount) === item.value
                      ? 'border-red-300 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : 'border-border text-foreground',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Available Balance */}
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">موجودی قابل برداشت</span>
                <span className="text-xs font-semibold tabular-nums text-foreground">
                  {formatToman(Math.max(0, fiatAvailable))}
                </span>
              </div>
            </div>

            {withdrawAmount && Number(withdrawAmount) > 0 && (
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">مبلغ برداشت</p>
                <p
                  className={cn(
                    'text-lg font-bold tabular-nums',
                    Number(withdrawAmount) > fiatAvailable
                      ? 'text-red-500'
                      : 'text-foreground',
                  )}
                >
                  {formatToman(Number(withdrawAmount))}
                </p>
                {Number(withdrawAmount) > fiatAvailable && (
                  <p className="mt-1 flex items-center justify-center gap-1 text-xs text-red-500">
                    <AlertCircle className="size-3" />
                    مبلغ از موجودی قابل برداشت بیشتر است
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setWithdrawOpen(false); setWithdrawAmount(''); }}>
              انصراف
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={
                !withdrawAmount ||
                Number(withdrawAmount) <= 0 ||
                Number(withdrawAmount) > fiatAvailable ||
                withdrawSubmitting
              }
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {withdrawSubmitting ? (
                <>
                  <Loader2 className="ml-2 size-4 animate-spin" />
                  در حال پردازش...
                </>
              ) : (
                <>
                  <ArrowUpFromLine className="ml-2 size-4" />
                  تأیید برداشت
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gold Gift Dialog */}
      <GoldGiftDialog open={giftOpen} onOpenChange={setGiftOpen} triggerOnly />
      <PaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} />
    </motion.div>
  );
}


import {Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from '@/lib/recharts-compat';
import React, { useState, useEffect, useCallback } from 'react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {Receipt, ArrowDownToLine, ArrowUpFromLine, TrendingUp, TrendingDown, Gift, ArrowLeftRight, BadgeDollarSign, Settings, Loader2, ChevronLeft, ChevronRight, Filter, CalendarDays, Activity, DollarSign, Clock, Download, Copy, Check, Printer, Info} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {Separator} from '@/components/ui/separator';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Input} from '@/components/ui/input';
import {useAppStore} from '@/lib/store';
import {usePageEvent} from '@/hooks/use-page-event';
import {useTranslation} from '@/lib/i18n';
import {formatToman, formatGrams, formatNumber} from '@/lib/helpers';

import {formatPrice, formatDateTime, getTransactionTypeLabel, getTransactionStatusLabel, getTransactionStatusColor, getTransactionIcon, toPersianDigits, cn} from '@/lib/helpers';

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
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface TransactionItem {
  id: string;
  type: string;
  amountFiat: number;
  amountGold: number;
  fee: number;
  goldPrice?: number;
  status: string;
  referenceId: string;
  description?: string;
  createdAt: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const TYPE_FILTERS = [
  { value: 'all', label: 'همه' },
  { value: 'deposit', label: 'واریز' },
  { value: 'withdrawal', label: 'برداشت' },
  { value: 'buy_gold', label: 'خرید طلا' },
  { value: 'sell_gold', label: 'فروش طلا' },
  { value: 'referral_reward', label: 'جایزه' },
  { value: 'cashback', label: 'کش‌بک' },
] as const;

const PAGE_SIZE = 10;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CSV Export Helper                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function exportTransactionsCSV(txList: TransactionItem[]) {
  const BOM = '\uFEFF';
  const headers = ['نوع تراکنش', 'مقدار (گرم طلا)', 'مقدار طلای', 'کارمزد', 'وضعیت', 'تاریخ', 'توضیحات'];
  const rows = txList.map((tx) => [
    getTransactionTypeLabel(tx.type),
    String(tx.amountFiat || 0),
    String(tx.amountGold || 0),
    String(tx.fee || 0),
    getTransactionStatusLabel(tx.status),
    formatDateTime(tx.createdAt),
    tx.description || '',
  ]);

  const escapeCell = (val: string) => val.replace(/"/g, '""');
  const csvContent = BOM + [headers, ...rows]
    .map((row) => row.map((cell) => `"${escapeCell(cell)}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  link.href = url;
  link.download = `transactions-zarringold-${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Transaction Type Icon Helper                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TransactionTypeIcon({ type }: { type: string }) {
  const iconMap: Record<string, React.ElementType> = {
    deposit: ArrowDownToLine,
    withdrawal: ArrowUpFromLine,
    buy_gold: TrendingUp,
    sell_gold: TrendingDown,
    referral_reward: Gift,
    cashback: BadgeDollarSign,
    transfer: ArrowLeftRight,
    admin_adjustment: Settings,
  };
  const Icon = iconMap[type] || Receipt;

  const colorMap: Record<string, string> = {
    deposit: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    withdrawal: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
    buy_gold: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    sell_gold: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    referral_reward: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    cashback: 'bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400',
    transfer: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400',
    admin_adjustment: 'bg-gold/15 text-gold',
  };

  return (
    <div
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-xl',
        colorMap[type] || 'bg-muted text-muted-foreground',
      )}
    >
      <Icon className="size-5" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Copy Button Helper                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-gold/10 hover:text-gold"
      title={copied ? 'کپی شد!' : 'کپی'}
      type="button"
    >
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Transaction Detail Dialog                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const dialogContentVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.15 },
  },
};

const detailRowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.08 + i * 0.04, duration: 0.3 },
  }),
};

interface DetailRowItem {
  label: string;
  value: string | null;
  copyable?: boolean;
  mono?: boolean;
  highlight?: boolean;
  custom?: boolean;
}

function TransactionDetailDialog({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: TransactionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!transaction) return null;

  const isIncoming =
    transaction.type === 'deposit' ||
    transaction.type === 'sell_gold' ||
    transaction.type === 'referral_reward' ||
    transaction.type === 'cashback';

  const handlePrint = () => {
    window.print();
  };

  const detailItems: DetailRowItem[] = [
    {
      label: 'شناسه تراکنش',
      value: transaction.id,
      copyable: true,
      mono: true,
    },
    {
      label: 'نوع تراکنش',
      value: null,
      custom: true,
    },
    {
      label: 'مقدار (گرم طلا)',
      value:
        transaction.amountFiat > 0
          ? `${isIncoming ? '+' : '-'}${formatToman(transaction.amountFiat)}`
          : '\u2014',
      highlight: transaction.amountFiat > 0,
    },
    {
      label: 'مقدار طلا',
      value:
        transaction.amountGold > 0
          ? `${isIncoming ? '+' : '-'}${formatGrams(transaction.amountGold)}`
          : '\u2014',
      highlight: transaction.amountGold > 0,
    },
    {
      label: 'کارمزد',
      value: transaction.fee > 0 ? formatToman(transaction.fee) : 'بدون کارمزد',
    },
    {
      label: 'قیمت طلا در زمان معامله',
      value: transaction.goldPrice
        ? `${formatNumber(transaction.goldPrice)} گرم طلا`
        : '\u2014',
    },
    {
      label: 'وضعیت',
      value: null,
      custom: true,
    },
    {
      label: 'شماره پیگیری',
      value: transaction.referenceId || '\u2014',
      copyable: !!transaction.referenceId,
      mono: true,
    },
    {
      label: 'تاریخ و ساعت',
      value: formatDateTime(transaction.createdAt),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md print:hidden">
        <motion.div variants={dialogContentVariants} initial="hidden" animate="visible" exit="exit">
          {/* Header */}
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-gold/10">
              <TransactionTypeIcon type={transaction.type} />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              جزئیات تراکنش
            </DialogTitle>
            <DialogDescription className="mt-1">
              {getTransactionTypeLabel(transaction.type)}
            </DialogDescription>
          </DialogHeader>

          <Separator className="my-3 bg-border/50" />

          {/* Detail Rows */}
          <div className="space-y-0">
            {detailItems.map((item, i) => {
              if (item.custom && item.label === 'نوع تراکنش') {
                return (
                  <motion.div
                    key={item.label}
                    custom={i}
                    variants={detailRowVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center justify-between rounded-lg px-3 py-3 even:bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <Info className="size-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TransactionTypeIcon type={transaction.type} />
                      <span className="text-sm font-semibold text-foreground">
                        {getTransactionTypeLabel(transaction.type)}
                      </span>
                    </div>
                  </motion.div>
                );
              }

              if (item.custom && item.label === 'وضعیت') {
                return (
                  <motion.div
                    key={item.label}
                    custom={i}
                    variants={detailRowVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center justify-between rounded-lg px-3 py-3 even:bg-muted/30"
                  >
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs px-3 py-0.5',
                        getTransactionStatusColor(transaction.status),
                      )}
                    >
                      {getTransactionStatusLabel(transaction.status)}
                    </Badge>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={item.label}
                  custom={i}
                  variants={detailRowVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center justify-between rounded-lg px-3 py-3 even:bg-muted/30"
                >
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        item.highlight ? 'text-foreground font-bold' : 'text-foreground/80',
                        item.mono && 'font-mono text-xs',
                      )}
                    >
                      {item.value}
                    </span>
                    {item.copyable && item.value && item.value !== '\u2014' && (
                      <CopyButton text={item.value} />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <Separator className="my-3 bg-border/50" />

          {/* Footer with Print Button */}
          <DialogFooter className="flex-row justify-center gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={handlePrint}
              className="gap-2 bg-gold text-gold-dark hover:bg-gold/90"
            >
              <Printer className="size-4" />
              چاپ رسید
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeletons                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg p-2">
            <Skeleton className="size-10 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="text-left space-y-1.5">
              <Skeleton className="h-4 w-24 ml-auto" />
              <Skeleton className="h-3 w-16 ml-auto" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main TransactionsView Component                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function TransactionsView() {
  const { user, addToast } = useAppStore();
  const { t, locale } = useTranslation();

  /* -- State -- */
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  /* ── Quick Action Event Listeners ── */
  usePageEvent('filter', () => { addToast('فیلتر تراکنش‌ها', 'info'); });
  usePageEvent('search', () => { addToast('جستجو در تراکنش‌ها', 'info'); });
  usePageEvent('export', () => { addToast('خروجی تراکنش‌ها در حال آماده‌سازی...', 'info'); });

  /* -- Mock Volume Data -- */
  const mockVolumeData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }),
    volume: Math.floor(Math.random() * 50000000) + 10000000,
  }));

  /* -- Computed -- */
  const totalVolume = transactions.reduce((sum, tx) => sum + tx.amountFiat, 0);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonthCount = transactions.filter(
    (tx) => new Date(tx.createdAt) >= monthStart,
  ).length;

  /* -- Data Fetching -- */
  const fetchTransactions = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        userId: user.id,
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (typeFilter !== 'all') params.set('type', typeFilter);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setTransactions(data.transactions || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        addToast(data.message || 'خطا در دریافت تراکنش\u200cها', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, page, typeFilter, addToast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [typeFilter]);

  /* -- Render -- */
  return (
    <motion.div
      className="mx-auto max-w-4xl space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gold/10">
              <Receipt className="size-5 text-gold" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">تاریخچه تراکنش\u200cها</h1>
              <p className="text-sm text-muted-foreground">مشاهده و فیلتر تمامی تراکنش\u200cهای شما</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-gold/20 text-gold hover:bg-gold/10 hover:text-gold-dark"
            onClick={() => {
              if (transactions.length > 0) {
                exportTransactionsCSV(transactions);
                addToast('فایل CSV با موفقیت دانلود شد', 'success');
              } else {
                addToast('تراکنشی برای خروجی وجود ندارد', 'error');
              }
            }}
          >
            <Download className="size-4" />
            <span className="hidden sm:inline">خروجی CSV</span>
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-3" variants={itemVariants}>
          {/* Total Transactions */}
          <Card className="overflow-hidden border-border/50 transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                  <Activity className="size-5 text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">کل تراکنش\u200cها</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                    {formatNumber(total)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Volume */}
          <Card className="overflow-hidden border-gold/20 transition-shadow hover:shadow-md bg-gradient-to-br from-gold/[0.03] via-card to-gold/[0.01]">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/15">
                  <DollarSign className="size-5 text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">حجم کل</p>
                  <p className="mt-1 text-xl font-bold tabular-nums gold-gradient-text truncate">
                    {formatToman(totalVolume)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* This Month */}
          <Card className="overflow-hidden border-emerald-200 dark:border-emerald-900/50 transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                  <CalendarDays className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">این ماه</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatNumber(thisMonthCount)} تراکنش
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Transaction Volume Chart */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              📊 حجم معاملات
            </CardTitle>
            <Badge variant="secondary" className="text-xs bg-gold/10 text-gold">
              ۳۰ روز اخیر
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockVolumeData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldVolumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: number) => `${(value / 1000000).toFixed(0)}M`}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                    formatter={(value: number) => [formatToman(value), 'حجم معاملات']}
                    labelFormatter={(label: string) => label}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#D4AF37"
                    strokeWidth={2}
                    fill="url(#goldVolumeGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filter Bar */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              {/* Type Filter */}
              <div className="flex-1 space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Filter className="size-3.5" />
                  نوع تراکنش
                </label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_FILTERS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="flex-1 space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  از تاریخ
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="text-sm"
                  max={dateTo || undefined}
                />
              </div>

              {/* Date To */}
              <div className="flex-1 space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  تا تاریخ
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="text-sm"
                  min={dateFrom || undefined}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transaction List */}
      {isLoading ? (
        <ListSkeleton />
      ) : (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Clock className="size-4 text-gold" />
                لیست تراکنش\u200cها
                <Badge variant="secondary" className="text-xs bg-gold/10 text-gold">
                  {formatNumber(total)} مورد
                </Badge>
              </CardTitle>
              {totalPages > 1 && (
                <span className="text-xs text-muted-foreground">
                  صفحه {formatNumber(page)} از {formatNumber(totalPages)}
                </span>
              )}
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                /* -- Empty State -- */
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    <Receipt className="size-7 text-muted-foreground" />
                  </div>
                  <p className="text-base font-semibold text-muted-foreground">تراکنشی یافت نشد</p>
                  <p className="mt-1 max-w-xs text-sm text-muted-foreground/70">
                    هنوز هیچ تراکنشی ثبت نشده است. با اولین واریز یا معامله، تراکنش\u200cهای شما در اینجا نمایش داده می\u200cشود.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    {transactions.map((tx, index) => {
                      const isIncoming =
                        tx.type === 'deposit' ||
                        tx.type === 'sell_gold' ||
                        tx.type === 'referral_reward' ||
                        tx.type === 'cashback';

                      return (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex items-center gap-3 rounded-xl p-3 transition-colors cursor-pointer hover:bg-muted/50 active:bg-muted/80"
                          onClick={() => {
                            setSelectedTransaction(tx);
                            setDialogOpen(true);
                          }}
                        >
                          {/* Icon */}
                          <TransactionTypeIcon type={tx.type} />

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">
                                {getTransactionTypeLabel(tx.type)}
                              </p>
                              <Badge
                                variant="outline"
                                className={cn('text-[10px]', getTransactionStatusColor(tx.status))}
                              >
                                {getTransactionStatusLabel(tx.status)}
                              </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                              <span>{formatDateTime(tx.createdAt)}</span>
                              {tx.referenceId && (
                                <span className="font-mono text-[10px] opacity-60">
                                  #{tx.referenceId.slice(0, 8)}
                                </span>
                              )}
                            </div>
                            {tx.fee > 0 && (
                              <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                                کارمزد: {formatToman(tx.fee)}
                              </p>
                            )}
                          </div>

                          {/* Amount */}
                          <div className="text-left shrink-0">
                            <p
                              className={cn(
                                'text-sm font-bold tabular-nums',
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
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* -- Pagination -- */}
                  {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between border-t pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="gap-1.5"
                      >
                        <ChevronRight className="size-4" />
                        قبلی
                      </Button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={cn(
                                'flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-all',
                                page === pageNum
                                  ? 'bg-gold text-gold-dark shadow-sm'
                                  : 'text-muted-foreground hover:bg-muted',
                              )}
                            >
                              {formatNumber(pageNum)}
                            </button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="gap-1.5"
                      >
                        بعدی
                        <ChevronLeft className="size-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Transaction Detail Dialog */}
      <TransactionDetailDialog
        transaction={selectedTransaction}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </motion.div>
  );
}

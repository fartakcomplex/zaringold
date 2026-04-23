'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  AlertTriangle,
  Shield,
  Timer,
  Target,
  DollarSign,
  Loader2,
  Plus,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Filter,
  Calendar,
  History,
  Zap,
  Lock,
  Eye,
  BarChart3,
  ArrowLeftRight,
  Gem,
  Receipt,
  CircleDot,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppStore } from '@/lib/store';
import { useQuickAction } from '@/hooks/useQuickAction';
import {
  formatPrice,
  formatToman,
  formatNumber,
  formatGrams,
  formatDateTime,
  getTimeAgo,
  cn,
} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types & Interfaces                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

type OrderType = 'buy' | 'sell';
type OrderStatus = 'pending_confirmation' | 'active' | 'executed' | 'cancelled' | 'expired';
type ExpirationOption = '1h' | '4h' | '24h' | '1w' | 'gtc';

interface TradeOrder {
  id: string;
  orderType: OrderType;
  targetPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  amountFiat: number | null;
  amountGrams: number | null;
  status: OrderStatus;
  createdAt: string;
  expiresAt: string | null;
  executedPrice: number | null;
  executedGrams: number | null;
  executedFiat: number | null;
  fee: number;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const BUY_FEE_RATE = 0.005;
const SELL_FEE_RATE = 0.003;

const EXPIRATION_LABELS: Record<ExpirationOption, string> = {
  '1h': '۱ ساعت',
  '4h': '۴ ساعت',
  '24h': '۲۴ ساعت',
  '1w': '۱ هفته',
  gtc: 'بدون انقضا (GTC)',
};

const EXPIRATION_MS: Record<ExpirationOption, number | null> = {
  '1h': 3600_000,
  '4h': 14400_000,
  '24h': 86400_000,
  '1w': 604800_000,
  gtc: null,
};

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  pending_confirmation: {
    label: 'در انتظار تأیید',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
    icon: <PauseCircle className="size-3.5" />,
  },
  active: {
    label: 'فعال',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
    icon: <PlayCircle className="size-3.5" />,
  },
  executed: {
    label: 'اجرا شده',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40',
    icon: <CheckCircle className="size-3.5" />,
  },
  cancelled: {
    label: 'لغو شده',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800/60',
    icon: <XCircle className="size-3.5" />,
  },
  expired: {
    label: 'منقضی',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/40',
    icon: <AlertCircle className="size-3.5" />,
  },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Data                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MOCK_ORDERS: TradeOrder[] = [
  {
    id: 'AT-1001',
    orderType: 'buy',
    targetPrice: 4200000,
    stopLoss: 4100000,
    takeProfit: 4500000,
    amountFiat: 10000000,
    amountGrams: 2.38,
    status: 'active',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 82800000).toISOString(),
    executedPrice: null,
    executedGrams: null,
    executedFiat: null,
    fee: 50000,
  },
  {
    id: 'AT-1002',
    orderType: 'sell',
    targetPrice: 4500000,
    stopLoss: null,
    takeProfit: null,
    amountFiat: null,
    amountGrams: 1.5,
    status: 'active',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    expiresAt: new Date(Date.now() + 79200000).toISOString(),
    executedPrice: null,
    executedGrams: null,
    executedFiat: null,
    fee: 20250,
  },
  {
    id: 'AT-1003',
    orderType: 'buy',
    targetPrice: 4100000,
    stopLoss: 4000000,
    takeProfit: 4400000,
    amountFiat: 50000000,
    amountGrams: 12.2,
    status: 'executed',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    expiresAt: null,
    executedPrice: 4095000,
    executedGrams: 12.21,
    executedFiat: 50000000,
    fee: 250000,
  },
  {
    id: 'AT-1004',
    orderType: 'sell',
    targetPrice: 4600000,
    stopLoss: 4500000,
    takeProfit: 4750000,
    amountFiat: null,
    amountGrams: 3.0,
    status: 'cancelled',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    expiresAt: null,
    executedPrice: null,
    executedGrams: null,
    executedFiat: null,
    fee: 0,
  },
  {
    id: 'AT-1005',
    orderType: 'buy',
    targetPrice: 4300000,
    stopLoss: 4200000,
    takeProfit: 4600000,
    amountFiat: 20000000,
    amountGrams: 4.65,
    status: 'expired',
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    expiresAt: new Date(Date.now() - 518400000).toISOString(),
    executedPrice: null,
    executedGrams: null,
    executedFiat: null,
    fee: 0,
  },
  {
    id: 'AT-1006',
    orderType: 'sell',
    targetPrice: 4350000,
    stopLoss: null,
    takeProfit: 4500000,
    amountFiat: null,
    amountGrams: 2.0,
    status: 'executed',
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    expiresAt: null,
    executedPrice: 4355000,
    executedGrams: 2.0,
    executedFiat: 8710000,
    fee: 26130,
  },
  {
    id: 'AT-1007',
    orderType: 'buy',
    targetPrice: 4150000,
    stopLoss: 4050000,
    takeProfit: 4450000,
    amountFiat: 30000000,
    amountGrams: 7.23,
    status: 'active',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    expiresAt: new Date(Date.now() + 84600000).toISOString(),
    executedPrice: null,
    executedGrams: null,
    executedFiat: null,
    fee: 150000,
  },
  {
    id: 'AT-1008',
    orderType: 'buy',
    targetPrice: 4000000,
    stopLoss: null,
    takeProfit: 4300000,
    amountFiat: 15000000,
    amountGrams: 3.75,
    status: 'pending_confirmation',
    createdAt: new Date(Date.now() - 60000).toISOString(),
    expiresAt: null,
    executedPrice: null,
    executedGrams: null,
    executedFiat: null,
    fee: 75000,
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Animation Variants                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const slideIn = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25 } },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Countdown Timer Hook                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function useCountdown(targetDate: string | null): string {
  const computeInitial = useCallback((): string => {
    if (!targetDate) return '';
    const now = Date.now();
    const target = new Date(targetDate).getTime();
    const diff = target - now;
    if (diff <= 0) return 'منقضی شده';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    if (days > 0) return `${formatNumber(days)} روز ${formatNumber(hours)} ساعت`;
    if (hours > 0) return `${formatNumber(hours)} ساعت ${formatNumber(minutes)} دقیقه`;
    return `${formatNumber(minutes)} دقیقه ${formatNumber(seconds)} ثانیه`;
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState(computeInitial);

  useEffect(() => {
    if (!targetDate) return;

    const update = () => {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('منقضی شده');
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (days > 0) {
        setTimeLeft(`${formatNumber(days)} روز ${formatNumber(hours)} ساعت`);
      } else if (hours > 0) {
        setTimeLeft(`${formatNumber(hours)} ساعت ${formatNumber(minutes)} دقیقه`);
      } else {
        setTimeLeft(`${formatNumber(minutes)} دقیقه ${formatNumber(seconds)} ثانیه`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Status Badge                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        config.bgColor,
        config.color,
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeletons                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function OrderFormSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded" />
          <Skeleton className="h-5 w-40" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-11 flex-1 rounded-lg" />
          <Skeleton className="h-11 flex-1 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Separator />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Separator />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-11 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function OrdersTableSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
              <Skeleton className="size-8 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Risk Warning Banner                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function RiskWarningBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex-1">
        <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
          هشدار ریسک بازار
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700/80 dark:text-amber-400/70">
          معاملات خودکار با ریسک همراه است. ممکن است سفارش شما در قیمت مطلوب اجرا نشود.
          لطفاً حد ضرر و سود را با دقت تعیین کنید و تنها مبلغی که تحمل زیان آن را دارید وارد کنید.
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Order Preview Section                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function OrderPreview({
  orderType,
  targetPrice,
  amount,
  goldPrice,
}: {
  orderType: OrderType;
  targetPrice: number;
  amount: number;
  goldPrice: number;
}) {
  const estimatedGrams = targetPrice > 0 ? amount / targetPrice : 0;
  const fee = orderType === 'buy' ? amount * BUY_FEE_RATE : estimatedGrams * targetPrice * SELL_FEE_RATE;
  const total = orderType === 'buy' ? amount + fee : estimatedGrams * targetPrice - fee;

  return (
    <div className="space-y-2.5 rounded-xl border border-border/50 bg-muted/30 p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold text-foreground">
        <Eye className="size-3.5 text-gold" />
        پیش‌نمایش سفارش
      </p>
      <Separator />
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">نوع سفارش</span>
          <span
            className={cn(
              'font-semibold',
              orderType === 'buy'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-500 dark:text-red-400'
            )}
          >
            {orderType === 'buy' ? 'خرید' : 'فروش'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">قیمت هدف</span>
          <span className="font-semibold tabular-nums">{formatToman(targetPrice)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">مقدار</span>
          <span className="font-semibold tabular-nums">
            {orderType === 'buy' ? formatToman(amount) : formatGrams(amount)}
          </span>
        </div>
        {estimatedGrams > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">مقدار تخمینی</span>
            <span className="font-semibold tabular-nums text-gold">
              {formatGrams(estimatedGrams)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">کارمزد تخمینی</span>
          <span className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            {formatToman(Math.round(fee))}
          </span>
        </div>
        <Separator />
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold">مجموع تخمینی</span>
          <span className="font-bold tabular-nums text-gold">
            {formatToman(Math.round(total))}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Confirmation Dialog                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ConfirmationDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    orderType: OrderType;
    targetPrice: number;
    amount: number;
    stopLoss: number | null;
    takeProfit: number | null;
    expiration: ExpirationOption;
  } | null;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  if (!order) return null;

  const estimatedGrams =
    order.orderType === 'buy' && order.targetPrice > 0
      ? order.amount / order.targetPrice
      : order.amount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Shield className="size-5 text-gold" />
            تأیید سفارش معامله خودکار
          </DialogTitle>
          <DialogDescription className="text-xs">
            لطفاً جزئیات سفارش خود را بررسی و تأیید کنید
          </DialogDescription>
        </DialogHeader>

        {/* 2FA Simulation */}
        <div className="flex items-center gap-2 rounded-lg border border-gold/20 bg-gold/5 p-3">
          <Lock className="size-4 text-gold" />
          <span className="text-xs font-medium text-gold">
            تأیید دو مرحله‌ای شبیه‌سازی شده
          </span>
        </div>

        {/* Order Summary */}
        <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">نوع سفارش</span>
            <span
              className={cn(
                'text-sm font-bold',
                order.orderType === 'buy'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-500 dark:text-red-400'
              )}
            >
              {order.orderType === 'buy' ? 'خرید' : 'فروش'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">قیمت هدف</span>
            <span className="text-sm font-bold tabular-nums">{formatToman(order.targetPrice)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">مقدار</span>
            <span className="text-sm font-bold tabular-nums">
              {order.orderType === 'buy' ? formatToman(order.amount) : formatGrams(order.amount)}
            </span>
          </div>
          {estimatedGrams > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">مقدار تخمینی طلا</span>
              <span className="text-sm font-bold tabular-nums text-gold">
                {formatGrams(estimatedGrams)}
              </span>
            </div>
          )}
          {order.stopLoss != null && order.stopLoss > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">حد ضرر</span>
              <span className="text-sm font-bold tabular-nums text-red-500">
                {formatToman(order.stopLoss)}
              </span>
            </div>
          )}
          {order.takeProfit != null && order.takeProfit > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">حد سود</span>
              <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatToman(order.takeProfit)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">مدت اعتبار</span>
            <span className="text-sm font-bold">{EXPIRATION_LABELS[order.expiration]}</span>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
          <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
            با تأیید این سفارش، مبلغ مورد نظر تا رسیدن به قیمت هدف در حساب شما مسدود خواهد شد.
          </p>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            انصراف
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 gap-2 bg-gold text-gold-dark hover:bg-gold/90"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle className="size-4" />
            )}
            تأیید و ثبت سفارش
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Order Form Component                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function OrderForm({
  onSubmit,
  currentGoldPrice,
}: {
  onSubmit: (order: Omit<TradeOrder, 'id' | 'status' | 'createdAt' | 'expiresAt' | 'executedPrice' | 'executedGrams' | 'executedFiat' | 'fee'> & { expiration: ExpirationOption }) => void;
  currentGoldPrice: number;
}) {
  const [orderType, setOrderType] = useState<OrderType>('buy');
  const [targetPrice, setTargetPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [expiration, setExpiration] = useState<ExpirationOption>('24h');
  const [showPreview, setShowPreview] = useState(false);
  const [confirmOrder, setConfirmOrder] = useState<{
    orderType: OrderType;
    targetPrice: number;
    amount: number;
    stopLoss: number | null;
    takeProfit: number | null;
    expiration: ExpirationOption;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const targetPriceNum = Number(targetPrice) || 0;
  const amountNum = Number(amount) || 0;
  const stopLossNum = stopLoss ? Number(stopLoss) : null;
  const takeProfitNum = takeProfit ? Number(takeProfit) : null;

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!targetPrice || targetPriceNum <= 0) {
      newErrors.targetPrice = 'قیمت هدف الزامی است';
    } else if (orderType === 'buy' && targetPriceNum > currentGoldPrice * 1.1) {
      newErrors.targetPrice = 'قیمت هدف بیش از ۱۰٪ بالاتر از قیمت فعلی است';
    }

    if (!amount || amountNum <= 0) {
      newErrors.amount = 'مقدار الزامی است';
    } else if (orderType === 'buy' && amountNum < 500000) {
      newErrors.amount = 'حداقل مبلغ خرید ۰.۰۱۵ گرم طلا';
    } else if (orderType === 'sell' && amountNum < 0.01) {
      newErrors.amount = 'حداقل مقدار فروش ۰.۰۱ گرم';
    }

    if (stopLossNum && takeProfitNum && orderType === 'buy') {
      if (stopLossNum >= targetPriceNum) {
        newErrors.stopLoss = 'حد ضرر باید کمتر از قیمت هدف باشد';
      }
      if (takeProfitNum <= targetPriceNum) {
        newErrors.takeProfit = 'حد سود باید بیشتر از قیمت هدف باشد';
      }
    }

    if (stopLossNum && takeProfitNum && orderType === 'sell') {
      if (stopLossNum <= targetPriceNum) {
        newErrors.stopLoss = 'حد ضرر باید بیشتر از قیمت هدف باشد';
      }
      if (takeProfitNum >= targetPriceNum) {
        newErrors.takeProfit = 'حد سود باید کمتر از قیمت هدف باشد';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [targetPriceNum, amountNum, stopLossNum, takeProfitNum, orderType, currentGoldPrice]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;

    setConfirmOrder({
      orderType,
      targetPrice: targetPriceNum,
      amount: amountNum,
      stopLoss: stopLossNum,
      takeProfit: takeProfitNum,
      expiration,
    });
  }, [validate, orderType, targetPriceNum, amountNum, stopLossNum, takeProfitNum, expiration]);

  const handleConfirm = useCallback(async () => {
    if (!confirmOrder) return;
    setIsSubmitting(true);

    try {
      const estimatedGrams =
        confirmOrder.orderType === 'buy'
          ? confirmOrder.amount / confirmOrder.targetPrice
          : confirmOrder.amount;
      const fee =
        confirmOrder.orderType === 'buy'
          ? confirmOrder.amount * BUY_FEE_RATE
          : estimatedGrams * confirmOrder.targetPrice * SELL_FEE_RATE;

      const expMs = EXPIRATION_MS[confirmOrder.expiration];
      const expiresAt = expMs ? new Date(Date.now() + expMs).toISOString() : null;

      onSubmit({
        orderType: confirmOrder.orderType,
        targetPrice: confirmOrder.targetPrice,
        stopLoss: confirmOrder.stopLoss,
        takeProfit: confirmOrder.takeProfit,
        amountFiat: confirmOrder.orderType === 'buy' ? confirmOrder.amount : null,
        amountGrams: confirmOrder.orderType === 'sell' ? confirmOrder.amount : estimatedGrams,
        expiration: confirmOrder.expiration,
      });

      // Reset form
      setTargetPrice('');
      setAmount('');
      setStopLoss('');
      setTakeProfit('');
      setShowPreview(false);
      setConfirmOrder(null);
      setErrors({});
    } finally {
      setIsSubmitting(false);
    }
  }, [confirmOrder, onSubmit]);

  const isFormValid = targetPriceNum > 0 && amountNum > 0;

  return (
    <>
      <motion.div variants={itemVariants} initial="hidden" animate="show">
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gold/10">
                <ArrowLeftRight className="size-4 text-gold" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">سفارش معامله خودکار</CardTitle>
                <CardDescription className="text-[11px]">
                  سفارش خرید/فروش در قیمت مشخص با حد ضرر و سود
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Order Type Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={orderType === 'buy' ? 'default' : 'outline'}
                className={cn(
                  'flex-1 gap-2 transition-all',
                  orderType === 'buy'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30'
                    : 'hover:border-emerald-300'
                )}
                onClick={() => setOrderType('buy')}
              >
                <ArrowDownLeft className="size-4" />
                خرید طلا
              </Button>
              <Button
                type="button"
                variant={orderType === 'sell' ? 'default' : 'outline'}
                className={cn(
                  'flex-1 gap-2 transition-all',
                  orderType === 'sell'
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-200 dark:shadow-red-900/30'
                    : 'hover:border-red-300'
                )}
                onClick={() => setOrderType('sell')}
              >
                <ArrowUpRight className="size-4" />
                فروش طلا
              </Button>
            </div>

            {/* Target Price */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                قیمت هدف
                <span className="mr-1 text-muted-foreground">
                  ({orderType === 'buy' ? 'گرم طلا' : 'گرم طلا'})
                </span>
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder={orderType === 'buy' ? 'مثلاً ۴,۲۰۰,۰۰۰' : 'مثلاً ۴,۵۰۰,۰۰۰'}
                  value={targetPrice}
                  onChange={(e) => {
                    setTargetPrice(e.target.value);
                    if (errors.targetPrice) setErrors((prev) => ({ ...prev, targetPrice: '' }));
                  }}
                  className={cn(
                    'tabular-nums pr-10',
                    errors.targetPrice && 'border-red-500 focus-visible:ring-red-500/20'
                  )}
                />
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs text-muted-foreground">
                  گرم طلا
                </span>
              </div>
              {errors.targetPrice && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] text-red-500"
                >
                  {errors.targetPrice}
                </motion.p>
              )}
              {currentGoldPrice > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  قیمت فعلی بازار: {formatToman(currentGoldPrice)}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                مقدار
                <span className="mr-1 text-muted-foreground">
                  ({orderType === 'buy' ? 'گرم طلا' : 'گرم'})
                </span>
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder={orderType === 'buy' ? 'مثلاً ۱۰,۰۰۰,۰۰۰' : 'مثلاً ۲.۵'}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                  }}
                  className={cn(
                    'tabular-nums pr-10',
                    errors.amount && 'border-red-500 focus-visible:ring-red-500/20'
                  )}
                />
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs text-muted-foreground">
                  {orderType === 'buy' ? 'گرم طلا' : 'گرم'}
                </span>
              </div>
              {errors.amount && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] text-red-500"
                >
                  {errors.amount}
                </motion.p>
              )}
              {/* Quick amounts */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(orderType === 'buy'
                  ? [
                      { value: 1000000, label: '۱ میلیون' },
                      { value: 5000000, label: '۵ میلیون' },
                      { value: 10000000, label: '۱۰ میلیون' },
                      { value: 50000000, label: '۵۰ میلیون' },
                    ]
                  : [
                      { value: 0.5, label: '۰.۵ گرم' },
                      { value: 1, label: '۱ گرم' },
                      { value: 5, label: '۵ گرم' },
                      { value: 10, label: '۱۰ گرم' },
                    ]
                ).map((item) => (
                  <Button
                    key={item.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] border-gold/20 text-gold hover:bg-gold/5"
                    onClick={() => setAmount(String(item.value))}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Stop Loss */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Shield className="size-3 text-red-400" />
                حد ضرر (اختیاری)
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="قیمت حد ضرر"
                value={stopLoss}
                onChange={(e) => {
                  setStopLoss(e.target.value);
                  if (errors.stopLoss) setErrors((prev) => ({ ...prev, stopLoss: '' }));
                }}
                className={cn(
                  'tabular-nums',
                  errors.stopLoss && 'border-red-500 focus-visible:ring-red-500/20'
                )}
              />
              {errors.stopLoss && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] text-red-500"
                >
                  {errors.stopLoss}
                </motion.p>
              )}
            </div>

            {/* Take Profit */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Target className="size-3 text-emerald-400" />
                حد سود (اختیاری)
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="قیمت حد سود"
                value={takeProfit}
                onChange={(e) => {
                  setTakeProfit(e.target.value);
                  if (errors.takeProfit) setErrors((prev) => ({ ...prev, takeProfit: '' }));
                }}
                className={cn(
                  'tabular-nums',
                  errors.takeProfit && 'border-red-500 focus-visible:ring-red-500/20'
                )}
              />
              {errors.takeProfit && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] text-red-500"
                >
                  {errors.takeProfit}
                </motion.p>
              )}
            </div>

            {/* Expiration */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Timer className="size-3 text-gold" />
                مدت اعتبار سفارش
              </Label>
              <Select value={expiration} onValueChange={(v) => setExpiration(v as ExpirationOption)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(EXPIRATION_LABELS) as [ExpirationOption, string][]).map(
                    ([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Preview toggle */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full gap-1.5 text-xs text-muted-foreground hover:text-gold"
              onClick={() => setShowPreview((prev) => !prev)}
            >
              {showPreview ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              {showPreview ? 'بستن پیش‌نمایش' : 'مشاهده پیش‌نمایش'}
            </Button>

            <AnimatePresence>
              {showPreview && targetPriceNum > 0 && amountNum > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <OrderPreview
                    orderType={orderType}
                    targetPrice={targetPriceNum}
                    amount={amountNum}
                    goldPrice={currentGoldPrice}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={cn(
                'w-full gap-2 font-bold transition-all',
                orderType === 'buy'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-600/50'
                  : 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/50'
              )}
            >
              {orderType === 'buy' ? (
                <ArrowDownLeft className="size-4" />
              ) : (
                <ArrowUpRight className="size-4" />
              )}
              {orderType === 'buy' ? 'ثبت سفارش خرید' : 'ثبت سفارش فروش'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={!!confirmOrder}
        onOpenChange={(open) => !open && setConfirmOrder(null)}
        order={confirmOrder}
        onConfirm={handleConfirm}
        isLoading={isSubmitting}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Active Orders Card                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ActiveOrdersCard({
  orders,
  onCancel,
}: {
  orders: TradeOrder[];
  onCancel: (id: string) => void;
}) {
  const activeOrders = orders.filter(
    (o) => o.status === 'active' || o.status === 'pending_confirmation'
  );

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="show">
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <PlayCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">سفارش‌های فعال</CardTitle>
                <CardDescription className="text-[11px]">
                  سفارش‌های در انتظار اجرا
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-gold/10 text-gold text-[11px] font-bold tabular-nums"
            >
              {formatNumber(activeOrders.length)} سفارش
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
                <CircleDot className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                سفارش فعالی ندارید
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                با ثبت سفارش جدید، معاملات خودکار خود را شروع کنید
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {activeOrders.map((order, idx) => (
                  <ActiveOrderRow
                    key={order.id}
                    order={order}
                    index={idx}
                    onCancel={onCancel}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Active Order Row                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ActiveOrderRow({
  order,
  index,
  onCancel,
}: {
  order: TradeOrder;
  index: number;
  onCancel: (id: string) => void;
}) {
  const countdown = useCountdown(order.expiresAt);
  const isBuy = order.orderType === 'buy';

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group rounded-xl border border-border/50 bg-card p-3.5 transition-all hover:border-gold/20 hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div
          className={cn(
            'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg',
            isBuy
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
              : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
          )}
        >
          {isBuy ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
        </div>

        {/* Order Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-muted-foreground">#{order.id}</span>
            <StatusBadge status={order.status} />
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-1.5',
                isBuy
                  ? 'border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400'
                  : 'border-red-300 text-red-600 dark:border-red-700 dark:text-red-400'
              )}
            >
              {isBuy ? 'خرید' : 'فروش'}
            </Badge>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="text-xs">
              <span className="text-muted-foreground">هدف: </span>
              <span className="font-bold tabular-nums">{formatToman(order.targetPrice)}</span>
            </div>
            <div className="text-xs">
              <span className="text-muted-foreground">مقدار: </span>
              <span className="font-bold tabular-nums">
                {order.amountFiat ? formatToman(order.amountFiat) : formatGrams(order.amountGrams || 0)}
              </span>
            </div>
          </div>

          {/* SL/TP */}
          {(order.stopLoss || order.takeProfit) && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              {order.stopLoss && (
                <span className="flex items-center gap-1 text-[10px] text-red-500">
                  <Shield className="size-2.5" />
                  ضرر: {formatToman(order.stopLoss)}
                </span>
              )}
              {order.takeProfit && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                  <Target className="size-2.5" />
                  سود: {formatToman(order.takeProfit)}
                </span>
              )}
            </div>
          )}

          {/* Countdown */}
          <div className="mt-1.5 flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="size-2.5" />
              {countdown || 'بدون انقضا'}
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              {getTimeAgo(order.createdAt)}
            </span>
          </div>
        </div>

        {/* Cancel Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Ban className="size-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm">لغو سفارش #{order.id}</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                آیا از لغو این سفارش اطمینان دارید؟ این عمل قابل بازگشت نیست.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-xs">انصراف</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 text-xs text-white hover:bg-red-700"
                onClick={() => onCancel(order.id)}
              >
                لغو سفارش
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Order History Component                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function OrderHistory({
  orders,
  statusFilter,
  onFilterChange,
}: {
  orders: TradeOrder[];
  statusFilter: string;
  onFilterChange: (filter: string) => void;
}) {
  const completedOrders = orders.filter(
    (o) => o.status === 'executed' || o.status === 'cancelled' || o.status === 'expired'
  );

  const filteredOrders =
    statusFilter === 'all'
      ? completedOrders
      : completedOrders.filter((o) => o.status === statusFilter);

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="show">
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                <History className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">تاریخچه سفارش‌ها</CardTitle>
                <CardDescription className="text-[11px]">
                  سفارش‌های اجرا شده، لغو شده و منقضی
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="size-3.5 text-muted-foreground" />
            {[
              { key: 'all', label: 'همه' },
              { key: 'executed', label: 'اجرا شده' },
              { key: 'cancelled', label: 'لغو شده' },
              { key: 'expired', label: 'منقضی' },
            ].map((f) => (
              <Button
                key={f.key}
                type="button"
                variant={statusFilter === f.key ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-7 text-[10px]',
                  statusFilter === f.key
                    ? 'bg-gold text-gold-dark hover:bg-gold/90'
                    : 'text-muted-foreground'
                )}
                onClick={() => onFilterChange(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
                <Receipt className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                سفارشی یافت نشد
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                با تغییر فیلتر، سفارش‌های دیگر را بررسی کنید
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[11px]">شناسه</TableHead>
                      <TableHead className="text-[11px]">نوع</TableHead>
                      <TableHead className="text-[11px]">قیمت هدف</TableHead>
                      <TableHead className="text-[11px]">مقدار</TableHead>
                      <TableHead className="text-[11px]">وضعیت</TableHead>
                      <TableHead className="text-[11px]">قیمت اجرا</TableHead>
                      <TableHead className="text-[11px]">تاریخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order, idx) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group border-b border-border/30 transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="text-xs font-medium tabular-nums">
                          #{order.id}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px]',
                              order.orderType === 'buy'
                                ? 'border-emerald-300 text-emerald-600 dark:border-emerald-700'
                                : 'border-red-300 text-red-600 dark:border-red-700'
                            )}
                          >
                            {order.orderType === 'buy' ? 'خرید' : 'فروش'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-bold tabular-nums">
                          {formatToman(order.targetPrice)}
                        </TableCell>
                        <TableCell className="text-xs tabular-nums">
                          {order.amountFiat
                            ? formatToman(order.amountFiat)
                            : formatGrams(order.amountGrams || 0)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-xs tabular-nums">
                          {order.executedPrice ? formatToman(order.executedPrice) : '—'}
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-2 md:hidden">
                {filteredOrders.map((order, idx) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="rounded-xl border border-border/50 bg-card p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          #{order.id}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px]',
                            order.orderType === 'buy'
                              ? 'border-emerald-300 text-emerald-600'
                              : 'border-red-300 text-red-600'
                          )}
                        >
                          {order.orderType === 'buy' ? 'خرید' : 'فروش'}
                        </Badge>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">هدف: </span>
                        <span className="font-bold tabular-nums">{formatToman(order.targetPrice)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">مقدار: </span>
                        <span className="font-bold tabular-nums">
                          {order.amountFiat
                            ? formatToman(order.amountFiat)
                            : formatGrams(order.amountGrams || 0)}
                        </span>
                      </div>
                      {order.executedPrice && (
                        <div>
                          <span className="text-muted-foreground">اجرا: </span>
                          <span className="font-bold tabular-nums text-gold">
                            {formatToman(order.executedPrice)}
                          </span>
                        </div>
                      )}
                      {order.executedGrams && (
                        <div>
                          <span className="text-muted-foreground">گرم: </span>
                          <span className="font-bold tabular-nums">
                            {formatGrams(order.executedGrams)}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground/60">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Statistics Summary Cards                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StatsCards({ orders }: { orders: TradeOrder[] }) {
  const activeCount = orders.filter((o) => o.status === 'active').length;
  const executedCount = orders.filter((o) => o.status === 'executed').length;
  const totalExecutedFiat = orders
    .filter((o) => o.status === 'executed')
    .reduce((sum, o) => sum + (o.executedFiat || 0), 0);
  const totalExecutedGrams = orders
    .filter((o) => o.status === 'executed')
    .reduce((sum, o) => sum + (o.executedGrams || 0), 0);
  const totalFees = orders.reduce((sum, o) => sum + o.fee, 0);

  const stats = [
    {
      label: 'سفارش‌های فعال',
      value: formatNumber(activeCount),
      icon: <PlayCircle className="size-4 text-emerald-600 dark:text-emerald-400" />,
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
    },
    {
      label: 'سفارش‌های اجرا شده',
      value: formatNumber(executedCount),
      icon: <CheckCircle className="size-4 text-blue-600 dark:text-blue-400" />,
      bgColor: 'bg-blue-100 dark:bg-blue-900/40',
    },
    {
      label: 'حجم معاملات',
      value: formatPrice(totalExecutedFiat),
      icon: <BarChart3 className="size-4 text-gold" />,
      bgColor: 'bg-gold/10',
    },
    {
      label: 'طلا معامله شده',
      value: formatGrams(totalExecutedGrams),
      icon: <Gem className="size-4 text-amber-600 dark:text-amber-400" />,
      bgColor: 'bg-amber-100 dark:bg-amber-900/40',
    },
    {
      label: 'مجموع کارمزد',
      value: formatToman(totalFees),
      icon: <Receipt className="size-4 text-purple-600 dark:text-purple-400" />,
      bgColor: 'bg-purple-100 dark:bg-purple-900/40',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          variants={itemVariants}
          initial="hidden"
          animate="show"
          transition={{ delay: idx * 0.05 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="rounded-xl border border-border/50 bg-card p-3 transition-all hover:border-gold/20 hover:shadow-sm"
        >
          <div className="flex items-center gap-2">
            <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', stat.bgColor)}>
              {stat.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground truncate">{stat.label}</p>
              <p className="text-sm font-bold tabular-nums">{stat.value}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component: AutoTradingView                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AutoTradingView() {
  const goldPrice = useAppStore((s) => s.goldPrice);
  const [orders, setOrders] = useState<TradeOrder[]>(MOCK_ORDERS);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('form');
  const [historyFilter, setHistoryFilter] = useState('all');

  /* ── Quick Actions ── */
  useQuickAction('open:at-create', () => setActiveTab('form'));

  const currentBuyPrice = goldPrice?.buyPrice || 4_250_000;

  /* ── Fetch Orders ── */
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/auto-trade/orders');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setOrders(data);
          }
        }
      } catch {
        // Use mock data as fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  /* ── Simulate order status changes ── */
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prev) =>
        prev.map((order) => {
          // Check for expiration
          if (order.expiresAt && order.status === 'active') {
            const now = Date.now();
            const expiresAt = new Date(order.expiresAt).getTime();
            if (now >= expiresAt) {
              return { ...order, status: 'expired' as OrderStatus };
            }
          }
          return order;
        })
      );
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  /* ── Create Order Handler ── */
  const handleCreateOrder = useCallback(
    (orderData: Omit<TradeOrder, 'id' | 'createdAt' | 'fee' | 'status' | 'expiresAt' | 'executedPrice' | 'executedGrams' | 'executedFiat'> & { expiration: ExpirationOption }) => {
      const expMs = EXPIRATION_MS[orderData.expiration];
      const expiresAt = expMs ? new Date(Date.now() + expMs).toISOString() : null;
      const estimatedGrams =
        orderData.orderType === 'buy'
          ? (orderData.amountFiat || 0) / orderData.targetPrice
          : orderData.amountGrams || 0;
      const fee = orderData.orderType === 'buy'
          ? (orderData.amountFiat || 0) * BUY_FEE_RATE
          : estimatedGrams * orderData.targetPrice * SELL_FEE_RATE;

      const newOrder: TradeOrder = {
        id: `AT-${Date.now().toString().slice(-4)}`,
        orderType: orderData.orderType,
        targetPrice: orderData.targetPrice,
        stopLoss: orderData.stopLoss,
        takeProfit: orderData.takeProfit,
        amountFiat: orderData.amountFiat,
        amountGrams: orderData.amountGrams,
        status: 'active',
        createdAt: new Date().toISOString(),
        expiresAt,
        executedPrice: null,
        executedGrams: null,
        executedFiat: null,
        fee: Math.round(fee),
      };

      setOrders((prev) => [newOrder, ...prev]);
      setActiveTab('active');

      // Also try API
      fetch('/api/auto-trade/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      }).catch(() => {});
    },
    []
  );

  /* ── Cancel Order Handler ── */
  const handleCancelOrder = useCallback(async (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o))
    );

    try {
      await fetch(`/api/auto-trade/orders/${orderId}`, { method: 'DELETE' });
    } catch {
      // Fallback handled by state update
    }
  }, []);

  /* ── Loading State ── */
  if (isLoading) {
    return (
      <div className="space-y-4">
        <RiskWarningBanner />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <OrderFormSkeleton />
        <OrdersTableSkeleton />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Risk Warning */}
      <RiskWarningBanner />

      {/* Statistics */}
      <StatsCards orders={orders} />

      {/* Main Tabs */}
      <Tabs id="at-settings" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="form" className="gap-1.5 text-xs">
            <Plus className="size-3.5" />
            سفارش جدید
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-1.5 text-xs">
            <Zap className="size-3.5" />
            سفارش‌های فعال
            {orders.filter((o) => o.status === 'active' || o.status === 'pending_confirmation').length > 0 && (
              <Badge className="ml-1 size-4 items-center justify-center rounded-full bg-gold p-0 text-[9px] text-gold-dark">
                {orders.filter((o) => o.status === 'active' || o.status === 'pending_confirmation').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs">
            <History className="size-3.5" />
            تاریخچه
          </TabsTrigger>
        </TabsList>

        <TabsContent id="at-create" value="form" className="mt-4">
          <OrderForm onSubmit={handleCreateOrder} currentGoldPrice={currentBuyPrice} />
        </TabsContent>

        <TabsContent id="at-active" value="active" className="mt-4">
          <ActiveOrdersCard orders={orders} onCancel={handleCancelOrder} />
        </TabsContent>

        <TabsContent id="at-history" value="history" className="mt-4">
          <OrderHistory
            orders={orders}
            statusFilter={historyFilter}
            onFilterChange={setHistoryFilter}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}


import {Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis} from '@/lib/recharts-compat';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {TrendingUp, TrendingDown, ArrowUpDown, Info, CheckCircle, AlertCircle, Loader2, Clock, Receipt, ArrowDownToLine, ArrowUpFromLine, Bell, BellRing, Plus, Trash2, Edit3, ChevronLeft, ChevronRight, BarChart3, ArrowUp, ArrowDown, Activity, Scale, Timer, Hash, Zap} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {Switch} from '@/components/ui/switch';
import {Separator} from '@/components/ui/separator';
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {useAppStore} from '@/lib/store';
import {usePageEvent} from '@/hooks/use-page-event';
import {useTranslation} from '@/lib/i18n';
import {formatToman, formatGrams, formatNumber} from '@/lib/helpers';

import {formatPrice, getTimeAgo, formatDateTime, getTransactionTypeLabel, getTransactionStatusColor, getTransactionStatusLabel, cn} from '@/lib/helpers';

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

const BUY_QUICK_AMOUNTS = [
  { value: 500000, label: '۵۰۰ هزار' },
  { value: 1000000, label: '۱ میلیون' },
  { value: 5000000, label: '۵ میلیون' },
  { value: 10000000, label: '۱۰ میلیون' },
  { value: 50000000, label: '۵۰ میلیون' },
];

const SELL_QUICK_AMOUNTS = [
  { value: 0.01, label: '۰.۰۱ گرم' },
  { value: 0.1, label: '۰.۱ گرم' },
  { value: 0.5, label: '۰.۵ گرم' },
  { value: 1, label: '۱ گرم' },
  { value: 5, label: '۵ گرم' },
];

const QUICK_GRAM_AMOUNTS = [
  { value: 0.1, label: '۰.۱ گرم' },
  { value: 0.5, label: '۰.۵ گرم' },
  { value: 1, label: '۱ گرم' },
  { value: 5, label: '۵ گرم' },
  { value: 10, label: '۱۰ گرم' },
];

const BUY_FEE_RATE = 0.005; // 0.5%
const SELL_FEE_RATE = 0.003; // 0.3%

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Data                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface PriceAlert {
  id: string;
  targetPrice: number;
  direction: 'above' | 'below';
  type: 'buy' | 'sell';
  notification: 'push' | 'sms' | 'email';
  createdAt: string;
  active: boolean;
}

const MOCK_ALERTS: PriceAlert[] = [
  {
    id: 'alert-1',
    targetPrice: 3850000,
    direction: 'above',
    type: 'sell',
    notification: 'push',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    active: true,
  },
  {
    id: 'alert-2',
    targetPrice: 3600000,
    direction: 'below',
    type: 'buy',
    notification: 'sms',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    active: true,
  },
  {
    id: 'alert-3',
    targetPrice: 3900000,
    direction: 'above',
    type: 'sell',
    notification: 'email',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    active: true,
  },
];

interface OrderRecord {
  id: string;
  type: 'buy' | 'sell';
  amount: number; // grams for buy, grams for sell
  pricePerGram: number;
  total: number;
  fee: number;
  status: 'completed' | 'pending' | 'cancelled';
  date: string;
}

const MOCK_ORDERS: OrderRecord[] = [
  { id: 'ord-1', type: 'buy', amount: 2.5, pricePerGram: 3720000, total: 9300000, fee: 46500, status: 'completed', date: new Date(Date.now() - 0.5 * 86400000).toISOString() },
  { id: 'ord-2', type: 'sell', amount: 1.0, pricePerGram: 3690000, total: 3690000, fee: 11070, status: 'completed', date: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'ord-3', type: 'buy', amount: 0.5, pricePerGram: 3705000, total: 1852500, fee: 9263, status: 'pending', date: new Date(Date.now() - 1.5 * 86400000).toISOString() },
  { id: 'ord-4', type: 'sell', amount: 3.0, pricePerGram: 3710000, total: 11130000, fee: 33390, status: 'completed', date: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'ord-5', type: 'buy', amount: 5.0, pricePerGram: 3680000, total: 18400000, fee: 92000, status: 'completed', date: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'ord-6', type: 'sell', amount: 0.5, pricePerGram: 3750000, total: 1875000, fee: 5625, status: 'cancelled', date: new Date(Date.now() - 3.5 * 86400000).toISOString() },
  { id: 'ord-7', type: 'buy', amount: 1.0, pricePerGram: 3695000, total: 3695000, fee: 18475, status: 'completed', date: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 'ord-8', type: 'buy', amount: 10.0, pricePerGram: 3660000, total: 36600000, fee: 183000, status: 'completed', date: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'ord-9', type: 'sell', amount: 2.0, pricePerGram: 3730000, total: 7460000, fee: 22380, status: 'pending', date: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: 'ord-10', type: 'sell', amount: 1.5, pricePerGram: 3700000, total: 5550000, fee: 16650, status: 'cancelled', date: new Date(Date.now() - 7 * 86400000).toISOString() },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Transaction Icon Helper                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TradeTransactionIcon({ type }: { type: string }) {
  const isBuy = type === 'buy_gold' || type === 'gold_buy';
  return (
    <div
      className={cn(
        'flex size-9 items-center justify-center rounded-lg',
        isBuy
          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
          : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
      )}
    >
      {isBuy ? <ArrowDownToLine className="size-4" /> : <ArrowUpFromLine className="size-4" />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeletons                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PriceBarSkeleton() {
  return (
    <Card className="overflow-hidden border-gold/10">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-5 w-16" />
      </CardContent>
    </Card>
  );
}

function TradeCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-10 w-full" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-9 flex-1 rounded-lg" />
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-44" />
              </div>
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Market Depth Indicator                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MarketDepthIndicator({ buyPressure }: { buyPressure: number }) {
  return (
    <Card className="overflow-hidden border-gold/10">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-gold" />
            <span className="text-sm font-semibold text-foreground">احساسات بازار</span>
          </div>
          <span className="text-xs text-muted-foreground">خریداران در برابر فروشندگان</span>
          <motion.span
            className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="inline-block size-1.5 rounded-full bg-gold" />
            زنده
          </motion.span>
        </div>
        {/* Pressure Bar */}
        <div className="relative h-4 w-full overflow-hidden rounded-full bg-red-500/20">
          <motion.div
            className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-emerald-500 via-emerald-400 to-emerald-300"
            initial={{ width: 0 }}
            animate={{ width: `${buyPressure}%`, opacity: [0.85, 1, 0.85] }}
            transition={{ width: { duration: 1.2, ease: 'easeOut' }, opacity: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } }}
          />
          {/* Center marker */}
          <div className="absolute top-0 left-1/2 h-full w-0.5 -translate-x-1/2 bg-foreground/20" />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ArrowDownToLine className="size-3.5 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {formatNumber(buyPressure)}٪ خرید
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-red-500 dark:text-red-400">
              {formatNumber(100 - buyPressure)}٪ فروش
            </span>
            <ArrowUpFromLine className="size-3.5 text-red-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Price Alert Dialog                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PriceAlertDialog({
  alerts,
  onAdd,
  onRemove,
}: {
  alerts: PriceAlert[];
  onAdd: (alert: PriceAlert) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [alertType, setAlertType] = useState<'buy' | 'sell'>('buy');
  const [notification, setNotification] = useState<'push' | 'sms' | 'email'>('push');

  const handleAdd = () => {
    const price = Number(targetPrice);
    if (!price || price <= 0) return;
    onAdd({
      id: `alert-${Date.now()}`,
      targetPrice: price,
      direction,
      type: alertType,
      notification,
      createdAt: new Date().toISOString(),
      active: true,
    });
    setTargetPrice('');
    setDirection('above');
    setAlertType('buy');
    setNotification('push');
  };

  const notificationLabels: Record<string, string> = {
    push: 'اعلان پوش',
    sms: 'پیامک',
    email: 'ایمیل',
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-gold/30 text-gold hover:bg-gold/5 hover:text-gold">
          <BellRing className="size-3.5" />
          <span className="hidden sm:inline">هشدار قیمت</span>
          {alerts.length > 0 && (
            <Badge className="ml-1 size-5 items-center justify-center rounded-full bg-gold p-0 text-[10px] text-gold-dark">
              {formatNumber(alerts.length)}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="size-5 text-gold" />
            هشدار قیمت
          </DialogTitle>
          <DialogDescription>
            هشدار قیمت خود را تنظیم کنید تا در رسیدن به قیمت مطلوب مطلع شوید
          </DialogDescription>
        </DialogHeader>

        {/* Alert Form */}
        <div className="space-y-4 rounded-lg border border-border/50 bg-muted/30 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">قیمت هدف (گرم طلا)</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="مثلاً ۳,۸۰۰,۰۰۰"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="tabular-nums"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">نوع هشدار</Label>
              <Select value={alertType} onValueChange={(v) => setAlertType(v as 'buy' | 'sell')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">خرید — زیر قیمت هدف</SelectItem>
                  <SelectItem value="sell">فروش — بالای قیمت هدف</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">شرط</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as 'above' | 'below')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">قیمت بالاتر از هدف</SelectItem>
                  <SelectItem value="below">قیمت پایین‌تر از هدف</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">نوع اطلاع‌رسانی</Label>
              <Select value={notification} onValueChange={(v) => setNotification(v as 'push' | 'sms' | 'email')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="push">اعلان پوش</SelectItem>
                  <SelectItem value="sms">پیامک</SelectItem>
                  <SelectItem value="email">ایمیل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleAdd}
            disabled={!targetPrice || Number(targetPrice) <= 0}
            className="w-full gap-2 bg-gold text-gold-dark hover:bg-gold-light"
          >
            <Plus className="size-4" />
            ثبت هشدار
          </Button>
        </div>

        {/* Active Alerts List */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              هشدارهای فعال ({formatNumber(alerts.length)})
            </p>
            <div className="max-h-52 space-y-2 overflow-y-auto">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex size-8 items-center justify-center rounded-lg',
                        alert.type === 'buy'
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
                      )}
                    >
                      {alert.direction === 'above' ? (
                        <ArrowUp className="size-4" />
                      ) : (
                        <ArrowDown className="size-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatToman(alert.targetPrice)}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px]',
                            alert.direction === 'above'
                              ? 'border-emerald-500/30 text-emerald-600'
                              : 'border-red-500/30 text-red-500',
                          )}
                        >
                          {alert.direction === 'above' ? 'بالاتر' : 'پایین‌تر'}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px]',
                            alert.type === 'buy'
                              ? 'border-emerald-500/30 text-emerald-600'
                              : 'border-red-500/30 text-red-500',
                          )}
                        >
                          {alert.type === 'buy' ? 'خرید' : 'فروش'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Bell className="size-3" />
                        <span>{notificationLabels[alert.notification]}</span>
                        <span>·</span>
                        <span>{getTimeAgo(alert.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-red-500"
                    onClick={() => onRemove(alert.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Price Alerts Section                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface PriceAlertItem {
  id: string;
  targetPrice: number;
  direction: 'above' | 'below';
  notification: 'push' | 'email' | 'sms';
  createdAt: string;
  active: boolean;
}

const PRICE_ALERTS_MOCK: PriceAlertItem[] = [
  {
    id: 'pa-1',
    targetPrice: 35000000,
    direction: 'above',
    notification: 'push',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    active: true,
  },
  {
    id: 'pa-2',
    targetPrice: 32000000,
    direction: 'below',
    notification: 'email',
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    active: true,
  },
  {
    id: 'pa-3',
    targetPrice: 36500000,
    direction: 'above',
    notification: 'sms',
    createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    active: true,
  },
];

const NOTIFICATION_LABELS: Record<string, string> = {
  push: 'اعلان اپلیکیشن',
  email: 'ایمیل',
  sms: 'SMS',
};

function PriceAlertsSection() {
  const [alertItems, setAlertItems] = useState<PriceAlertItem[]>(PRICE_ALERTS_MOCK);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [notification, setNotification] = useState<'push' | 'email' | 'sms'>('push');

  const handleCreateAlert = () => {
    const price = Number(targetPrice);
    if (!price || price <= 0) return;
    const newAlert: PriceAlertItem = {
      id: `pa-${Date.now()}`,
      targetPrice: price,
      direction,
      notification,
      createdAt: new Date().toISOString(),
      active: true,
    };
    setAlertItems((prev) => [newAlert, ...prev]);
    setTargetPrice('');
    setDirection('above');
    setNotification('push');
    setDialogOpen(false);
  };

  const handleDeleteAlert = (id: string) => {
    setAlertItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleAlert = (id: string) => {
    setAlertItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: !item.active } : item)),
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <Bell className="size-4 text-gold" />
          هشدار قیمت
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="gap-1.5 bg-gold text-gold-dark hover:bg-gold-light"
            >
              <Plus className="size-3.5" />
              ایجاد هشدار
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BellRing className="size-5 text-gold" />
                ایجاد هشدار قیمت
              </DialogTitle>
              <DialogDescription>
                با تنظیم هشدار قیمت، در رسیدن به قیمت مطلوب مطلع شوید
              </DialogDescription>
            </DialogHeader>
            {/* Create Alert Form */}
            <div className="space-y-4">
              {/* Target Price Input */}
              <div className="space-y-2">
                <Label className="text-xs">قیمت هدف (گرم طلا)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="مثلاً ۳۵,۰۰۰,۰۰۰"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="tabular-nums"
                  min={0}
                />
              </div>
              {/* Condition Selector: Two Buttons */}
              <div className="space-y-2">
                <Label className="text-xs">شرط</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={direction === 'above' ? 'default' : 'outline'}
                    className={cn(
                      'flex-1 text-sm',
                      direction === 'above'
                        ? 'bg-gold text-gold-dark hover:bg-gold-light'
                        : '',
                    )}
                    onClick={() => setDirection('above')}
                  >
                    <ArrowUp className="ml-1.5 size-3.5" />
                    بالاتر از
                  </Button>
                  <Button
                    type="button"
                    variant={direction === 'below' ? 'default' : 'outline'}
                    className={cn(
                      'flex-1 text-sm',
                      direction === 'below'
                        ? 'bg-gold text-gold-dark hover:bg-gold-light'
                        : '',
                    )}
                    onClick={() => setDirection('below')}
                  >
                    <ArrowDown className="ml-1.5 size-3.5" />
                    پایین‌تر از
                  </Button>
                </div>
              </div>
              {/* Notification Type Selector: Three Buttons */}
              <div className="space-y-2">
                <Label className="text-xs">نوع اطلاع‌رسانی</Label>
                <div className="flex gap-2">
                  {(['push', 'email', 'sms'] as const).map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={notification === type ? 'default' : 'outline'}
                      className={cn(
                        'flex-1 text-xs',
                        notification === type
                          ? 'bg-gold text-gold-dark hover:bg-gold-light'
                          : '',
                      )}
                      onClick={() => setNotification(type)}
                    >
                      {NOTIFICATION_LABELS[type]}
                    </Button>
                  ))}
                </div>
              </div>
              {/* Submit Button */}
              <Button
                onClick={handleCreateAlert}
                disabled={!targetPrice || Number(targetPrice) <= 0}
                className="w-full gap-2 bg-gold text-gold-dark hover:bg-gold-light"
              >
                <Plus className="size-4" />
                ایجاد هشدار
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {alertItems.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
              <Bell className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              هشدار قیمت فعالی ندارید
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              با ایجاد هشدار، در رسیدن قیمت به مطلوب مطلع شوید
            </p>
          </div>
        ) : (
          /* Active Alerts List */
          <div className="space-y-2">
            {alertItems.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                  alert.active
                    ? 'border-border/50 bg-card'
                    : 'border-border/30 bg-muted/30 opacity-60',
                )}
              >
                {/* Bell Icon - Gold/Amber */}
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                  <Bell className="size-4" />
                </div>
                {/* Alert Description & Time */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      قیمت{' '}
                      {alert.direction === 'above' ? 'بالاتر از' : 'پایین‌تر از'}{' '}
                      {formatToman(alert.targetPrice)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    {/* Status Badge */}
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium',
                        alert.active
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                      )}
                    >
                      {alert.active ? 'فعال' : 'غیرفعال'}
                    </span>
                    <span>{NOTIFICATION_LABELS[alert.notification]}</span>
                    <span>·</span>
                    <span>{getTimeAgo(alert.createdAt)}</span>
                  </div>
                </div>
                {/* Toggle Switch + Delete Button */}
                <div className="flex shrink-0 items-center gap-2">
                  <Switch
                    checked={alert.active}
                    onCheckedChange={() => handleToggleAlert(alert.id)}
                    className="data-[state=checked]:bg-gold"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-red-500"
                    onClick={() => handleDeleteAlert(alert.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Order Book Depth Chart                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface OrderBookRow {
  price: number;
  volume: number;
  total: number;
}

const generateOrderBook = (): { bids: OrderBookRow[]; asks: OrderBookRow[] } => {
  const bids: OrderBookRow[] = [];
  const asks: OrderBookRow[] = [];
  let price = 39400000;
  for (let i = 0; i < 10; i++) {
    price -= Math.floor(Math.random() * 50000) + 10000;
    const volume = Math.floor(Math.random() * 5) + 1;
    bids.push({ price, volume, total: bids.reduce((s, b) => s + b.volume, 0) + volume });
  }
  price = 39600000;
  for (let i = 0; i < 10; i++) {
    price += Math.floor(Math.random() * 50000) + 10000;
    const volume = Math.floor(Math.random() * 5) + 1;
    asks.push({ price, volume, total: asks.reduce((s, a) => s + a.volume, 0) + volume });
  }
  return { bids: bids.reverse(), asks };
};

const ORDER_BOOK_DATA = generateOrderBook();

function OrderBookDepthChart() {
  const spread = ORDER_BOOK_DATA.asks[0].price - ORDER_BOOK_DATA.bids[ORDER_BOOK_DATA.bids.length - 1].price;
  const faNumber = new Intl.NumberFormat('fa-IR');
  const formatPriceAxis = (value: number) => {
    return faNumber.format(Math.round(value / 1000000)) + ' مث';
  };
  const formatTooltipPrice = (value: number) => {
    return faNumber.format(Math.round(value)) + ' گرم طلا';
  };

  // Combine asks + bids for the Y-axis domain
  const allPrices = [...ORDER_BOOK_DATA.bids, ...ORDER_BOOK_DATA.asks];
  const minY = allPrices[0]?.price ?? 0;
  const maxY = allPrices[allPrices.length - 1]?.price ?? 0;

  return (
    <Card className="card-glass-premium overflow-hidden h-[350px] md:h-[420px] lg:h-[480px]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <BarChart3 className="size-4 text-gold" />
          عمق بازار
        </CardTitle>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-[#22c55e]" />
            <span className="text-[10px] text-muted-foreground">خرید</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-[#ef4444]" />
            <span className="text-[10px] text-muted-foreground">فروش</span>
          </div>
          <Badge variant="outline" className="border-gold/30 text-[10px] text-gold">
            زنده
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="w-full h-[260px] md:h-[330px] lg:h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={null}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis
                type="number"
                tickFormatter={(v: number) => faNumber.format(v)}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                label={{
                  value: 'حجم تجمعی',
                  position: 'top',
                  style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))', textAnchor: 'middle' },
                }}
              />
              <YAxis
                type="number"
                domain={[minY, maxY]}
                tickFormatter={formatPriceAxis}
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'price') return [formatTooltipPrice(value), 'قیمت'];
                  return [faNumber.format(value), 'حجم تجمعی'];
                }}
              />
              {/* Bid bars (buy orders - green) */}
              {ORDER_BOOK_DATA.bids.map((entry, index) => (
                <Bar
                  key={`bid-${index}`}
                  dataKey="total"
                  data={[entry]}
                  stackId="b"
                  fill="#22c55e"
                  radius={[0, 4, 4, 0]}
                >
                  {[entry].map(() => (
                    <Cell key={`bid-cell-${index}`} fill="#22c55e" fillOpacity={0.4 + (index / ORDER_BOOK_DATA.bids.length) * 0.6} />
                  ))}
                </Bar>
              ))}
              {/* Ask bars (sell orders - red) */}
              {ORDER_BOOK_DATA.asks.map((entry, index) => (
                <Bar
                  key={`ask-${index}`}
                  dataKey="total"
                  data={[entry]}
                  stackId="a"
                  fill="#ef4444"
                  radius={[0, 4, 4, 0]}
                >
                  {[entry].map(() => (
                    <Cell key={`ask-cell-${index}`} fill="#ef4444" fillOpacity={0.6 + (index / ORDER_BOOK_DATA.asks.length) * 0.4} />
                  ))}
                </Bar>
              ))}
              {/* Center spread line */}
              <ReferenceLine
                x={0}
                stroke="#D4AF37"
                strokeWidth={2}
                strokeDasharray="4 2"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Spread summary */}
        <div className="mt-2 flex items-center justify-center">
          <p className="text-sm text-gold-gradient font-semibold">
            اسپرد: {spread.toLocaleString('fa-IR')} گرم طلا
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Order Book Widget (سفارشات بازار)                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
  depthPercent: number;
  isBest: boolean;
}

function generateOrderBookEntries(buyPrice: number, sellPrice: number): {
  buyOrders: OrderBookEntry[];
  sellOrders: OrderBookEntry[];
} {
  const buyOrders: OrderBookEntry[] = [];
  const sellOrders: OrderBookEntry[] = [];

  // Seed for consistent mock data
  const seed = 42;
  const pseudoRandom = (i: number) => {
    const x = Math.sin(seed + i * 9.1) * 10000;
    return x - Math.floor(x);
  };

  // Generate 10 buy orders: prices below buyPrice (closer = better)
  const buyQuantities = [1.8, 0.5, 2.1, 0.3, 1.2, 0.8, 2.5, 0.15, 1.6, 0.7];
  let buyAccumulated = 0;
  for (let i = 0; i < 10; i++) {
    const priceOffset = 1 + (i * 0.015) + pseudoRandom(i) * 0.005; // 1% to ~1.5%
    const price = Math.round(buyPrice * (1 - priceOffset) / 1000) * 1000;
    const quantity = buyQuantities[i] + (pseudoRandom(i + 20) * 0.3 - 0.15);
    const total = Math.round(price * quantity);
    buyAccumulated += quantity;
    buyOrders.push({
      price,
      quantity: Math.round(quantity * 1000) / 1000,
      total,
      depthPercent: 0, // calculated below
      isBest: i === 0,
    });
  }

  // Calculate depth percentages for buy orders
  const totalBuyVolume = buyAccumulated;
  let buyCumulative = 0;
  for (let i = 0; i < buyOrders.length; i++) {
    buyCumulative += buyOrders[i].quantity;
    buyOrders[i].depthPercent = (buyCumulative / totalBuyVolume) * 100;
  }

  // Generate 10 sell orders: prices above sellPrice (closer = better)
  const sellQuantities = [1.5, 0.9, 2.0, 0.4, 1.1, 0.6, 1.9, 0.25, 1.4, 0.8];
  let sellAccumulated = 0;
  for (let i = 0; i < 10; i++) {
    const priceOffset = 1 + (i * 0.015) + pseudoRandom(i + 50) * 0.005;
    const price = Math.round(sellPrice * (1 + priceOffset) / 1000) * 1000;
    const quantity = sellQuantities[i] + (pseudoRandom(i + 70) * 0.3 - 0.15);
    const total = Math.round(price * quantity);
    sellAccumulated += quantity;
    sellOrders.push({
      price,
      quantity: Math.round(quantity * 1000) / 1000,
      total,
      depthPercent: 0,
      isBest: i === 0,
    });
  }

  // Calculate depth percentages for sell orders
  const totalSellVolume = sellAccumulated;
  let sellCumulative = 0;
  for (let i = 0; i < sellOrders.length; i++) {
    sellCumulative += sellOrders[i].quantity;
    sellOrders[i].depthPercent = (sellCumulative / totalSellVolume) * 100;
  }

  return { buyOrders, sellOrders };
}

function OrderBookWidget({
  buyPrice,
  sellPrice,
}: {
  buyPrice: number;
  sellPrice: number;
}) {
  const { buyOrders, sellOrders } = generateOrderBookEntries(buyPrice, sellPrice);

  const spreadAmount = sellOrders[0].price - buyOrders[0].price;
  const spreadPercent = ((spreadAmount / buyPrice) * 100);
  const totalBuyVolume = buyOrders.reduce((s, o) => s + o.quantity, 0);
  const totalSellVolume = sellOrders.reduce((s, o) => s + o.quantity, 0);
  const totalVolume = totalBuyVolume + totalSellVolume;
  const buyDepthRatio = (totalBuyVolume / totalVolume) * 100;
  const sellDepthRatio = (totalSellVolume / totalVolume) * 100;

  return (
    <Card className="card-gold-border overflow-hidden">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          📊 دفتر سفارشات
        </CardTitle>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <Badge className="badge-gold bg-gold/10 text-gold">
            بلادرنگ
          </Badge>
        </motion.div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Column Headers */}
        <div className="grid grid-cols-1 gap-3 lg:gap-5 lg:grid-cols-2">
          {/* Buy Column Header */}
          <div className="flex items-center gap-2 px-2">
            <ArrowDownToLine className="size-3.5 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              سفارشات خرید
            </span>
            <span className="text-[10px] text-muted-foreground">({formatNumber(Math.round(totalBuyVolume))} گرم)</span>
          </div>
          {/* Sell Column Header */}
          <div className="flex items-center gap-2 px-2">
            <ArrowUpFromLine className="size-3.5 text-red-500" />
            <span className="text-xs font-bold text-red-500 dark:text-red-400">
              سفارشات فروش
            </span>
            <span className="text-[10px] text-muted-foreground">({formatNumber(Math.round(totalSellVolume))} گرم)</span>
          </div>
        </div>

        {/* Table Sub-headers */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="grid grid-cols-4 gap-1 border-b border-border/50 px-2 pb-2 text-[10px] text-muted-foreground">
            <span>قیمت (گرم طلا)</span>
            <span className="text-center">مقدار (گرم)</span>
            <span className="text-left">مجموع (گرم طلا)</span>
            <span className="text-center">عمق</span>
          </div>
          <div className="grid grid-cols-4 gap-1 border-b border-border/50 px-2 pb-2 text-[10px] text-muted-foreground">
            <span>قیمت (گرم طلا)</span>
            <span className="text-center">مقدار (گرم)</span>
            <span className="text-left">مجموع (گرم طلا)</span>
            <span className="text-center">عمق</span>
          </div>
        </div>

        {/* Order Rows */}
        <div className="grid grid-cols-1 gap-3 lg:gap-5 lg:grid-cols-2">
          {/* Buy Orders Column */}
          <div className="space-y-0.5">
            {buyOrders.map((order, index) => (
              <motion.div
                key={`buy-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className={cn(
                  'table-row-hover-gold relative grid grid-cols-4 gap-1 rounded-md px-2 py-1.5 transition-colors',
                  order.isBest && 'bg-emerald-50/80 dark:bg-emerald-950/30',
                )}
              >
                {/* Depth Background Bar */}
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 rounded-md bg-emerald-500/10 dark:bg-emerald-500/15"
                  style={{ width: `${order.depthPercent}%` }}
                />
                {/* Price */}
                <span
                  className={cn(
                    'relative z-10 text-xs font-medium tabular-nums',
                    order.isBest
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-emerald-600 dark:text-emerald-400',
                  )}
                >
                  {formatToman(order.price)}
                </span>
                {/* Quantity */}
                <span className="relative z-10 text-center text-xs tabular-nums text-gold dark:text-gold-light">
                  {order.quantity.toFixed(3)}
                </span>
                {/* Total */}
                <span className="relative z-10 text-left text-[11px] tabular-nums text-muted-foreground">
                  {formatToman(order.total)}
                </span>
                {/* Depth % */}
                <span className="relative z-10 text-center text-[10px] tabular-nums text-muted-foreground/70">
                  {order.depthPercent.toFixed(0)}٪
                </span>
              </motion.div>
            ))}
          </div>

          {/* Sell Orders Column */}
          <div className="space-y-0.5">
            {sellOrders.map((order, index) => (
              <motion.div
                key={`sell-${index}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className={cn(
                  'table-row-hover-gold relative grid grid-cols-4 gap-1 rounded-md px-2 py-1.5 transition-colors',
                  order.isBest && 'bg-red-50/80 dark:bg-red-950/30',
                )}
              >
                {/* Depth Background Bar */}
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 rounded-md bg-red-500/10 dark:bg-red-500/15"
                  style={{ width: `${order.depthPercent}%` }}
                />
                {/* Price */}
                <span
                  className={cn(
                    'relative z-10 text-xs font-medium tabular-nums',
                    order.isBest
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-red-500 dark:text-red-400',
                  )}
                >
                  {formatToman(order.price)}
                </span>
                {/* Quantity */}
                <span className="relative z-10 text-center text-xs tabular-nums text-gold dark:text-gold-light">
                  {order.quantity.toFixed(3)}
                </span>
                {/* Total */}
                <span className="relative z-10 text-left text-[11px] tabular-nums text-muted-foreground">
                  {formatToman(order.total)}
                </span>
                {/* Depth % */}
                <span className="relative z-10 text-center text-[10px] tabular-nums text-muted-foreground/70">
                  {order.depthPercent.toFixed(0)}٪
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Spread Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-lg border border-border/50 bg-muted/30 p-3"
        >
          <div className="mb-2 flex items-center justify-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">اسپرد:</span>
              <span className="font-bold tabular-nums text-gold dark:text-gold-light">
                {formatToman(spreadAmount)} گرم طلا
              </span>
            </div>
            <Separator orientation="vertical" className="h-3" />
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">اسپرد:</span>
              <span className="font-bold tabular-nums text-gold dark:text-gold-light">
                {spreadPercent.toFixed(2)}٪
              </span>
            </div>
          </div>
          {/* Visual Spread Bar */}
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-emerald-500 to-emerald-400/60" style={{ width: `${50 - (spreadPercent / 2)}%` }} />
            <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-500 to-red-400/60" style={{ width: `${50 - (spreadPercent / 2)}%` }} />
            {/* Gold center line */}
            <div className="absolute top-0 left-1/2 h-full w-1 -translate-x-1/2 rounded-full bg-gold/80" />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-sm bg-emerald-500" />
              خرید
            </span>
            <span className="font-medium tabular-nums text-gold">قیمت بازار</span>
            <span className="flex items-center gap-1">
              فروش
              <span className="inline-block size-2 rounded-sm bg-red-500" />
            </span>
          </div>
        </motion.div>

        {/* Depth Visualization Bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">عمق سفارشات</span>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block size-2 rounded-sm bg-emerald-500" />
                خرید {buyDepthRatio.toFixed(1)}٪
              </span>
              <span className="flex items-center gap-1">
                فروش {sellDepthRatio.toFixed(1)}٪
                <span className="inline-block size-2 rounded-sm bg-red-500" />
              </span>
            </div>
          </div>
          <div className="relative h-5 w-full overflow-hidden rounded-lg bg-muted">
            <motion.div
              className="absolute inset-y-0 right-0 rounded-r-lg bg-gradient-to-l from-emerald-500 via-emerald-400 to-emerald-300/80"
              initial={{ width: 0 }}
              animate={{ width: `${buyDepthRatio}%` }}
              transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute inset-y-0 left-0 rounded-l-lg bg-gradient-to-r from-red-500 via-red-400 to-red-300/80"
              initial={{ width: 0 }}
              animate={{ width: `${sellDepthRatio}%` }}
              transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
            />
            {/* Gold dividing line */}
            <div className="absolute top-0 left-1/2 z-10 h-full w-0.5 -translate-x-1/2 bg-gold" />
            {/* Center label */}
            <div className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded bg-background px-1.5 py-0.5 text-[9px] font-bold text-gold shadow-sm">
              قیمت فعلی
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Order History Panel                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function OrderHistoryPanel() {
  const [activeTab, setActiveTab] = useState<'all' | 'buy' | 'sell'>('all');

  const filteredOrders = MOCK_ORDERS.filter(
    (order) => activeTab === 'all' || order.type === activeTab,
  ).slice(0, 6);

  const statusLabels: Record<string, string> = {
    completed: 'تکمیل شده',
    pending: 'در انتظار',
    cancelled: 'لغو شده',
  };

  const statusColors: Record<string, string> = {
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Receipt className="size-4 text-gold" />
            سفارشات اخیر
          </CardTitle>
          <Badge variant="secondary" className="bg-gold/10 text-gold">
            {formatNumber(filteredOrders.length)} سفارش
          </Badge>
        </div>
        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'buy' | 'sell')}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1 text-xs">
              همه
            </TabsTrigger>
            <TabsTrigger value="buy" className="flex-1 gap-1 text-xs">
              <ArrowDownToLine className="size-3 text-emerald-500" />
              خرید
            </TabsTrigger>
            <TabsTrigger value="sell" className="flex-1 gap-1 text-xs">
              <ArrowUpFromLine className="size-3 text-red-500" />
              فروش
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
              <Receipt className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">سفارشی یافت نشد</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              سفارشات شما در این دسته‌بندی نمایش داده می‌شود
            </p>
          </div>
        ) : (
          <div>
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-3 border-b border-border/30 py-3 transition-colors last:border-0 hover:bg-muted/50"
              >
                {/* Type Icon */}
                <div
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                    order.type === 'buy'
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
                  )}
                >
                  {order.type === 'buy' ? (
                    <ArrowDownToLine className="size-4" />
                  ) : (
                    <ArrowUpFromLine className="size-4" />
                  )}
                </div>
                {/* Order Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatGrams(order.amount)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      × {formatToman(order.pricePerGram)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className={cn(
                      'font-medium tabular-nums',
                      order.type === 'buy'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-500 dark:text-red-400',
                    )}>
                      {formatToman(order.total)}
                    </span>
                    <span>کارمزد: {formatToman(order.fee)}</span>
                  </div>
                </div>
                {/* Status + Time */}
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                      statusColors[order.status],
                    )}
                  >
                    {statusLabels[order.status]}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {getTimeAgo(order.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mobile Quick Trade Bar (Fixed Bottom)                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MobileQuickTradeBar({
  buyPrice,
  sellPrice,
  onOpenBuy,
  onOpenSell,
}: {
  buyPrice: number;
  sellPrice: number;
  onOpenBuy: () => void;
  onOpenSell: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="h-2 bg-gradient-to-t from-border/50 to-transparent" />
      <div className="flex items-stretch gap-2 border-t border-border/60 bg-card/95 px-3 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-lg">
        <button
          onClick={onOpenBuy}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-emerald-500 via-emerald-400 to-emerald-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 active:scale-[0.97] transition-transform"
        >
          <ArrowDownToLine className="size-4" />
          <span>خرید</span>
          <span className="text-[11px] font-normal opacity-80">
            {formatToman(buyPrice)}
          </span>
        </button>
        <button
          onClick={onOpenSell}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border-2 border-red-400/60 bg-red-50 text-sm font-bold text-red-600 shadow-sm active:scale-[0.97] transition-transform dark:bg-red-950/40 dark:text-red-400"
        >
          <ArrowUpFromLine className="size-4" />
          <span>فروش</span>
          <span className="text-[11px] font-normal opacity-80">
            {formatToman(sellPrice)}
          </span>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mobile Quick Trade Sheet Content                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MobileQuickTradeSheet({
  mode,
  open,
  onOpenChange,
  buyPrice,
  sellPrice,
  balance,
  goldBalance,
  onConfirmBuy,
  onConfirmSell,
}: {
  mode: 'buy' | 'sell';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buyPrice: number;
  sellPrice: number;
  balance: number;
  goldBalance: number;
  onConfirmBuy: (amount: number) => void;
  onConfirmSell: (grams: number) => void;
}) {
  // Reset form when mode changes — use key-based reset pattern
  // We wrap in a container that uses mode as key to force re-mount
  const [amount, setAmount] = useState('');
  const [quickGram, setQuickGram] = useState<number | null>(null);

  const isBuy = mode === 'buy';
  const amountNum = Number(amount) || 0;
  const feeRate = isBuy ? 0.005 : 0.003;
  const fee = isBuy ? amountNum * feeRate : (sellPrice ? amountNum * sellPrice * feeRate : 0);
  const netAmount = amountNum - fee;
  const grams = isBuy ? (buyPrice ? netAmount / buyPrice : 0) : amountNum;
  const fiatResult = !isBuy ? (sellPrice ? amountNum * sellPrice : 0) : amountNum;
  const sellFeeVal = fiatResult * feeRate;
  const sellNet = fiatResult - sellFeeVal;
  const hasEnough = isBuy ? amountNum <= balance : amountNum <= goldBalance;

  const handleQuickGram = (g: number) => {
    if (isBuy && buyPrice) {
      const cost = Math.ceil(g * buyPrice);
      setAmount(String(cost));
      setQuickGram(g);
    } else {
      setAmount(String(g));
      setQuickGram(g);
    }
  };

  const handleConfirm = () => {
    if (amountNum <= 0 || !hasEnough) return;
    if (isBuy) {
      onConfirmBuy(amountNum);
    } else {
      onConfirmSell(amountNum);
    }
    setAmount('');
    setQuickGram(null);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <div
              className={cn(
                'flex size-9 items-center justify-center rounded-lg',
                isBuy
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
              )}
            >
              {isBuy ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
            </div>
            {isBuy ? 'خرید سریع طلا' : 'فروش سریع طلا'}
          </SheetTitle>
          <SheetDescription>
            {isBuy
              ? `قیمت خرید: ${formatToman(buyPrice)} گرم طلا / گرم`
              : `قیمت فروش: ${formatToman(sellPrice)} گرم طلا / گرم`}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          {/* Quick Gram Buttons */}
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              {isBuy ? 'خرید سریع بر اساس گرم:' : 'انتخاب مقدار (گرم):'}
            </p>
            <div className="scrollbar-gold flex gap-2 overflow-x-auto pb-1">
              {QUICK_GRAM_AMOUNTS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => handleQuickGram(item.value)}
                  className={cn(
                    'flex min-h-[44px] shrink-0 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-all active:scale-[0.96]',
                    quickGram === item.value
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-border text-foreground hover:border-gold/50 hover:bg-gold/5',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label className="text-xs">{isBuy ? 'مقدار (گرم طلا)' : 'مقدار (گرم)'}</Label>
            <div className="relative">
              <Input
                type="number"
                inputMode="numeric"
                placeholder={isBuy ? 'مبلغ مورد نظر' : 'مقدار طلا'}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setQuickGram(null);
                }}
                className="h-12 text-left tabular-nums text-base"
                min={0}
                step={isBuy ? undefined : '0.001'}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {isBuy ? 'گرم طلا' : 'گرم'}
              </span>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 rounded-lg border border-border/50 bg-muted/30 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isBuy ? 'طلا دریافت می‌کنید' : 'گرم طلا دریافت می‌کنید'}
              </span>
              <span
                className={cn(
                  'font-semibold tabular-nums',
                  isBuy ? 'text-gold-gradient' : 'text-emerald-600 dark:text-emerald-400',
                )}
              >
                {amountNum > 0
                  ? isBuy
                    ? formatGrams(grams)
                    : formatToman(Math.round(sellNet))
                  : '---'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                کارمزد ({isBuy ? '0.5' : '0.3'}%)
              </span>
              <span className="tabular-nums text-muted-foreground">
                {amountNum > 0
                  ? formatToman(Math.round(isBuy ? fee : sellFeeVal))
                  : '---'}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">موجودی</span>
              <span
                className={cn(
                  'font-semibold tabular-nums',
                  !hasEnough && amountNum > 0 ? 'text-red-500' : 'text-foreground',
                )}
              >
                {isBuy ? formatToman(balance) : formatGrams(goldBalance)}
              </span>
            </div>
          </div>

          {/* Confirm Button */}
          <Button
            onClick={handleConfirm}
            disabled={amountNum <= 0 || !hasEnough}
            className={cn(
              'min-h-[48px] w-full text-base font-bold',
              isBuy
                ? 'bg-gradient-to-l from-emerald-500 via-emerald-400 to-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'border-2 border-red-400/60 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
            )}
          >
            {isBuy ? (
              <>
                <TrendingUp className="ml-2 size-5" />
                تأیید خرید
              </>
            ) : (
              <>
                <TrendingDown className="ml-2 size-5" />
                تأیید فروش
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main TradeView Component                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function TradeView() {
  const { t, locale } = useTranslation();
  const {
    user,
    goldPrice,
    fiatWallet,
    goldWallet,
    transactions,
    setGoldPrice,
    setFiatWallet,
    setGoldWallet,
    addTransaction,
    addToast,
  } = useAppStore();

  /* ── Loading State ── */
  const [isLoading, setIsLoading] = useState(true);

  /* ── Buy State ── */
  const [buyAmount, setBuyAmount] = useState('');
  const [buySubmitting, setBuySubmitting] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [buySuccess, setBuySuccess] = useState(false);

  /* ── Sell State ── */
  const [sellAmount, setSellAmount] = useState('');
  const [sellSubmitting, setSellSubmitting] = useState(false);
  const [sellError, setSellError] = useState('');
  const [sellSuccess, setSellSuccess] = useState(false);

  /* ── Price Direction ── */
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);

  /* ── Mobile State ── */
  const [mobileTradeTab, setMobileTradeTab] = useState<'buy' | 'sell'>('buy');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [showMobileOrderBook, setShowMobileOrderBook] = useState(false);

  /* ── Price Flash Animation ── */
  const prevBuyPriceRef = useRef<number | null>(null);
  const [priceFlash, setPriceFlash] = useState<'green' | 'red' | null>(null);

  /* ── Price Alerts State ── */
  const [alerts, setAlerts] = useState<PriceAlert[]>(MOCK_ALERTS);

  /* ── Quick Action Event Listeners ── */
  usePageEvent('buy-gold', () => {
    setMobileTradeTab('buy');
    setMobileSheetOpen(true);
  });
  usePageEvent('sell-gold', () => {
    setMobileTradeTab('sell');
    setMobileSheetOpen(true);
  });
  usePageEvent('price-alert', () => {
    // Scroll to price alerts section on mobile — toggle order book off, alert section will be visible
    setShowMobileOrderBook(false);
  });

  /* ── Confirm Dialog State ── */
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'buy' | 'sell' | null>(null);

  /* ── Mock 24h Stats ── */
  const change24h = 1.2; // +1.2%
  const high24h = 3780000;
  const low24h = 3650000;

  /* ── Computed: Buy Calculations ── */
  const buyAmountNum = Number(buyAmount) || 0;
  const buyFee = buyAmountNum * BUY_FEE_RATE;
  const buyNetAmount = buyAmountNum - buyFee;
  const buyGrams = goldPrice?.buyPrice ? buyNetAmount / goldPrice.buyPrice : 0;
  const buyHasEnoughBalance = buyAmountNum <= fiatWallet.balance;

  /* ── Computed: Sell Calculations ── */
  const sellGramsNum = Number(sellAmount) || 0;
  const sellFiatAmount = goldPrice?.sellPrice ? sellGramsNum * goldPrice.sellPrice : 0;
  const sellFee = sellFiatAmount * SELL_FEE_RATE;
  const sellNetAmount = sellFiatAmount - sellFee;
  const sellHasEnoughGold = sellGramsNum <= goldWallet.goldGrams;

  /* ── Computed: Spread ── */
  const spreadPercent =
    goldPrice?.buyPrice && goldPrice?.sellPrice
      ? (((goldPrice.buyPrice - goldPrice.sellPrice) / goldPrice.buyPrice) * 100).toFixed(2)
      : '0.00';

  /* ── Computed: Recent Gold Trades ── */
  const recentGoldTrades = transactions.filter(
    (tx) => tx.type === 'buy_gold' || tx.type === 'sell_gold' || tx.type === 'gold_buy' || tx.type === 'gold_sell',
  );

  /* ── Data Fetching ── */
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const [pricesRes, walletRes] = await Promise.all([
        fetch('/api/gold/prices'),
        fetch(`/api/wallet?userId=${user.id}`),
      ]);

      if (pricesRes.ok) {
        const data = await pricesRes.json();
        if (data.success) {
          const prevBuy = goldPrice?.buyPrice;
          const newBuy = data.prices.buy;
          if (prevBuy && newBuy) {
            setPriceDirection(newBuy > prevBuy ? 'up' : newBuy < prevBuy ? 'down' : null);
          }
          setGoldPrice({
            buyPrice: data.prices.buy,
            sellPrice: data.prices.sell,
            marketPrice: data.prices.market,
            ouncePrice: data.prices.ounce,
            spread: data.prices.spread,
            updatedAt: data.prices.updatedAt,
          });
        }
      }

      if (walletRes.ok) {
        const data = await walletRes.json();
        if (data.success) {
          setFiatWallet({
            balance: data.fiat.balance,
            frozenBalance: data.fiat.frozenBalance,
          });
          setGoldWallet({
            goldGrams: data.gold.grams,
            frozenGold: data.gold.frozenGold,
          });
        }
      }
    } catch (error) {
      console.error('TradeView fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, goldPrice?.buyPrice, setGoldPrice, setFiatWallet, setGoldWallet]);

  // Price flash tracking
  useEffect(() => {
    if (goldPrice?.buyPrice && prevBuyPriceRef.current !== null) {
      if (goldPrice.buyPrice > prevBuyPriceRef.current) {
        setPriceFlash('green');
      } else if (goldPrice.buyPrice < prevBuyPriceRef.current) {
        setPriceFlash('red');
      }
      const timer = setTimeout(() => setPriceFlash(null), 800);
      return () => clearTimeout(timer);
    }
    if (goldPrice?.buyPrice) {
      prevBuyPriceRef.current = goldPrice.buyPrice;
    }
  }, [goldPrice?.buyPrice]);

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  // Refresh prices every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/gold/prices')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const prevBuy = goldPrice?.buyPrice;
            const newBuy = data.prices.buy;
            if (prevBuy && newBuy) {
              setPriceDirection(newBuy > prevBuy ? 'up' : newBuy < prevBuy ? 'down' : null);
            }
            setGoldPrice({
              buyPrice: data.prices.buy,
              sellPrice: data.prices.sell,
              marketPrice: data.prices.market,
              ouncePrice: data.prices.ounce,
              spread: data.prices.spread,
              updatedAt: data.prices.updatedAt,
            });
          }
        })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  /* ── Handlers ── */
  const openConfirmDialog = (action: 'buy' | 'sell') => {
    if (action === 'buy' && (buyAmountNum <= 0 || !buyHasEnoughBalance)) return;
    if (action === 'sell' && (sellGramsNum <= 0 || !sellHasEnoughGold)) return;
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  const handleConfirmTrade = async () => {
    setConfirmDialogOpen(false);
    if (confirmAction === 'buy') await handleBuy();
    else if (confirmAction === 'sell') await handleSell();
  };

  const handleBuy = async () => {
    if (!user?.id || buyAmountNum <= 0) return;
    setBuyError('');
    setBuySubmitting(true);
    try {
      const res = await fetch('/api/gold/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amountFiat: buyAmountNum }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('خرید طلا با موفقیت انجام شد', 'success');
        setBuySuccess(true);
        setBuyAmount('');
        // Update store
        addTransaction({
          id: Date.now().toString(),
          type: 'buy_gold',
          amountFiat: data.totalPaid,
          amountGold: data.grams,
          fee: data.fee,
          goldPrice: goldPrice?.buyPrice,
          status: 'success',
          referenceId: '',
          description: `خرید ${data.grams.toFixed(4)} گرم طلا`,
          createdAt: new Date().toISOString(),
        });
        setGoldWallet({ ...goldWallet, goldGrams: data.newGoldBalance });
        setFiatWallet({ ...fiatWallet, balance: fiatWallet.balance - data.totalPaid });
        setTimeout(() => {
          setBuySuccess(false);
          fetchData();
        }, 2000);
      } else {
        setBuyError(data.message);
      }
    } catch {
      setBuyError('خطا در ارتباط با سرور');
    } finally {
      setBuySubmitting(false);
    }
  };

  const handleSell = async () => {
    if (!user?.id || sellGramsNum <= 0) return;
    setSellError('');
    setSellSubmitting(true);
    try {
      const res = await fetch('/api/gold/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, goldGrams: sellGramsNum }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('فروش طلا با موفقیت انجام شد', 'success');
        setSellSuccess(true);
        setSellAmount('');
        addTransaction({
          id: Date.now().toString(),
          type: 'sell_gold',
          amountFiat: data.netAmount,
          amountGold: sellGramsNum,
          fee: data.fee,
          goldPrice: goldPrice?.sellPrice,
          status: 'success',
          referenceId: '',
          description: `فروش ${sellGramsNum.toFixed(4)} گرم طلا`,
          createdAt: new Date().toISOString(),
        });
        setGoldWallet({ ...goldWallet, goldGrams: goldWallet.goldGrams - sellGramsNum });
        setFiatWallet({ ...fiatWallet, balance: fiatWallet.balance + data.netAmount });
        setTimeout(() => {
          setSellSuccess(false);
          fetchData();
        }, 2000);
      } else {
        setSellError(data.message);
      }
    } catch {
      setSellError('خطا در ارتباط با سرور');
    } finally {
      setSellSubmitting(false);
    }
  };

  /* ── Alert Handlers ── */
  const handleAddAlert = (alert: PriceAlert) => {
    setAlerts((prev) => [...prev, alert]);
    addToast('هشدار قیمت با موفقیت ثبت شد', 'success');
  };

  const handleRemoveAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    addToast('هشدار قیمت حذف شد', 'info');
  };

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                  */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <motion.div
      className="mx-auto max-w-6xl space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ──────────────────────────────────────────────────────── */}
      {/*  Live Price Bar (Enhanced with 24h stats)               */}
      {/* ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <PriceBarSkeleton />
      ) : (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-gold/15 bg-gradient-to-l from-gold/5 via-card to-gold/5">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                {/* Main Price Row */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Prices */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    {/* Buy Price */}
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex items-center justify-center rounded-md p-1',
                          priceDirection === 'up'
                            ? 'bg-emerald-100 dark:bg-emerald-950'
                            : priceDirection === 'down'
                              ? 'bg-red-100 dark:bg-red-950'
                              : 'bg-muted',
                        )}
                      >
                        {priceDirection === 'up' ? (
                          <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
                        ) : priceDirection === 'down' ? (
                          <TrendingDown className="size-4 text-red-500 dark:text-red-400" />
                        ) : (
                          <ArrowUpDown className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">قیمت خرید</p>
                        <p className={cn(
                          'text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400 rounded px-1 transition-all',
                          priceFlash === 'green' && 'flash-green',
                          priceFlash === 'red' && 'flash-red',
                        )}>
                          {formatToman(goldPrice?.buyPrice ?? 0)}
                        </p>
                      </div>
                    </div>

                    {/* Sell Price */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center rounded-md bg-muted p-1">
                        <TrendingDown className="size-4 text-red-500 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">قیمت فروش</p>
                        <p className="text-sm font-bold tabular-nums text-red-500 dark:text-red-400">
                          {formatToman(goldPrice?.sellPrice ?? 0)}
                        </p>
                      </div>
                    </div>

                    <Separator orientation="vertical" className="hidden h-8 sm:block" />

                    {/* Spread */}
                    <div className="flex items-center gap-2">
                      <Info className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">اسپرد</p>
                        <p className="text-sm font-medium tabular-nums text-muted-foreground">
                          {spreadPercent}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Live Indicator + Alert Button */}
                  <div className="flex items-center gap-3">
                    <PriceAlertDialog alerts={alerts} onAdd={handleAddAlert} onRemove={handleRemoveAlert} />
                    {goldPrice?.updatedAt && (
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {getTimeAgo(goldPrice.updatedAt)}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 dark:bg-emerald-950">
                      <span className="gold-pulse inline-block size-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        زنده
                      </span>
                    </div>
                  </div>
                </div>

                {/* 24h Stats Row */}
                <Separator />
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                  {/* 24h Change */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 dark:bg-emerald-950">
                      <ArrowUp className="size-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        +{formatNumber(change24h)}%
                      </span>
                    </div>
                    <span className="text-muted-foreground">تغییر ۲۴ ساعته</span>
                  </div>

                  {/* 24h High */}
                  <div className="flex items-center gap-1.5">
                    <ArrowUp className="size-3 text-emerald-500" />
                    <span className="text-muted-foreground">بالاترین:</span>
                    <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatToman(high24h)}
                    </span>
                  </div>

                  {/* 24h Low */}
                  <div className="flex items-center gap-1.5">
                    <ArrowDown className="size-3 text-red-500" />
                    <span className="text-muted-foreground">پایین‌ترین:</span>
                    <span className="font-medium tabular-nums text-red-500 dark:text-red-400">
                      {formatToman(low24h)}
                    </span>
                  </div>

                  {/* Volume */}
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="border-gold/30 px-2 py-0.5 text-[10px] font-semibold text-gold">
                      <BarChart3 className="ml-1 size-3" />
                      حجم: {formatNumber(125000)} گرم
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Mobile Swipeable Buy/Sell Tabs                       */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && (
        <motion.div variants={itemVariants} className="md:hidden">
          <div className="relative mb-1">
            <div className="flex rounded-xl bg-muted/50 p-1">
              <button
                onClick={() => setMobileTradeTab('buy')}
                className={cn(
                  'relative z-10 flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg text-sm font-bold transition-colors',
                  mobileTradeTab === 'buy'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground',
                )}
              >
                <ArrowDownToLine className="size-4" />
                خرید
              </button>
              <button
                onClick={() => setMobileTradeTab('sell')}
                className={cn(
                  'relative z-10 flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg text-sm font-bold transition-colors',
                  mobileTradeTab === 'sell'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-muted-foreground',
                )}
              >
                <ArrowUpFromLine className="size-4" />
                فروش
              </button>
            </div>
            {/* Sliding gold indicator */}
            <motion.div
              className={cn(
                'absolute inset-y-1 rounded-lg bg-card shadow-sm',
                mobileTradeTab === 'buy'
                  ? 'border-b-2 border-emerald-500'
                  : 'border-b-2 border-red-500',
              )}
              animate={{
                x: mobileTradeTab === 'buy' ? '4px' : 'calc(50% - 2px)',
                width: 'calc(50% - 6px)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          </div>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Buy & Sell Cards                                       */}
      {/* ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <TradeCardsSkeleton />
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-2"
          variants={itemVariants}
        >
          {/* ════════════════ Buy Gold Card ════════════════ */}
          <div className={cn(mobileTradeTab === 'sell' && 'hidden md:block')}>
          <Card className="overflow-hidden border-gold/20 bg-gradient-to-br from-gold/[0.04] via-card to-gold/[0.02]">
            <CardContent className="p-6">
              {/* Header */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                    <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">خرید طلا</h3>
                    <p className="text-sm text-muted-foreground">مبلغ مورد نظر خود را وارد کنید</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="border-gold/30 text-[10px] text-gold">
                    قیمت لحظه‌ای
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    اسپرد: {spreadPercent}%
                  </Badge>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-4 space-y-2">
                <Label htmlFor="buy-amount">مقدار (گرم طلا)</Label>
                <div className="relative">
                  <Input
                    id="buy-amount"
                    type="number"
                    inputMode="numeric"
                    placeholder="مبلغ را وارد کنید"
                    value={buyAmount}
                    onChange={(e) => {
                      setBuyAmount(e.target.value);
                      setBuyError('');
                      setBuySuccess(false);
                    }}
                    className="input-gold-focus text-left tabular-nums text-base md:text-lg"
                    min={0}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    گرم طلا
                  </span>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="mb-5 flex flex-wrap gap-2">
                {BUY_QUICK_AMOUNTS.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      setBuyAmount(String(item.value));
                      setBuyError('');
                      setBuySuccess(false);
                    }}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-xs font-medium transition-all hover:border-gold/50 hover:bg-gold/5 active:scale-[0.96]',
                      Number(buyAmount) === item.value
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border text-foreground',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Quick Gram Buttons */}
              <div className="mb-5">
                <p className="mb-2 text-xs text-muted-foreground">خرید سریع بر اساس گرم:</p>
                <div className="scrollbar-gold flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
                  {QUICK_GRAM_AMOUNTS.map((item) => {
                    const gramCost = Math.ceil(item.value * (goldPrice?.buyPrice ?? 0));
                    return (
                      <button
                        key={item.value}
                        onClick={() => {
                          if (goldPrice?.buyPrice) {
                            setBuyAmount(String(gramCost));
                            setBuyError('');
                            setBuySuccess(false);
                          }
                        }}
                        className={cn(
                          'min-h-[36px] shrink-0 rounded-lg border px-3 py-2 text-xs font-medium transition-all hover:border-gold/50 hover:bg-gold/5 active:scale-[0.96] md:shrink',
                          Number(buyAmount) === gramCost
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-border text-foreground',
                        )}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator className="mb-4" />

              {/* Calculated Info */}
              <div className="mb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">طلا دریافت می‌کنید</span>
                  <span className="text-sm font-semibold tabular-nums gold-gradient-text">
                    {buyAmountNum > 0 && goldPrice?.buyPrice ? formatGrams(buyGrams) : '---'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">کارمزد (0.5%)</span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {buyAmountNum > 0 ? formatToman(Math.round(buyFee)) : '---'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">مبلغ نهایی</span>
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {buyAmountNum > 0 ? formatToman(buyAmountNum) : '---'}
                  </span>
                </div>
              </div>

              {/* Balance Info */}
              <div className="mb-4 rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">موجودی کیف پول</span>
                  <span
                    className={cn(
                      'text-xs font-semibold tabular-nums',
                      buyAmountNum > fiatWallet.balance ? 'text-red-500' : 'text-foreground',
                    )}
                  >
                    {formatToman(fiatWallet.balance)}
                  </span>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {buyError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-950/30"
                  >
                    <AlertCircle className="size-4 shrink-0 text-red-500" />
                    <span className="text-xs text-red-600 dark:text-red-400">{buyError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success */}
              <AnimatePresence>
                {buySuccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30"
                  >
                    <CheckCircle className="size-4 shrink-0 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      خرید طلا با موفقیت انجام شد!
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Buy Button */}
              <Button
                onClick={() => openConfirmDialog('buy')}
                disabled={buySubmitting || buyAmountNum <= 0 || !buyHasEnoughBalance || buySuccess}
                className="btn-success h-11 w-full bg-gradient-to-l from-emerald-500 via-emerald-400 to-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:via-emerald-300 hover:to-emerald-400 hover:shadow-emerald-500/30 disabled:opacity-50"
              >
                {buySubmitting ? (
                  <>
                    <Loader2 className="ml-2 size-4 animate-spin" />
                    در حال پردازش...
                  </>
                ) : (
                  <>
                    <TrendingUp className="ml-2 size-4" />
                    خرید طلا
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          </div>

          {/* ════════════════ Sell Gold Card ════════════════ */}
          <div className={cn(mobileTradeTab === 'buy' && 'hidden md:block')}>
          <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-card to-emerald-50/30 dark:border-emerald-900/50 dark:from-emerald-950/20 dark:to-emerald-950/10">
            <CardContent className="p-6">
              {/* Header */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                    <TrendingDown className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">فروش طلا</h3>
                    <p className="text-sm text-muted-foreground">مقدار طلای مورد نظر را وارد کنید</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="border-gold/30 text-[10px] text-gold">
                    قیمت لحظه‌ای
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    اسپرد: {spreadPercent}%
                  </Badge>
                </div>
              </div>

              {/* Grams Input */}
              <div className="mb-4 space-y-2">
                <Label htmlFor="sell-amount">مقدار (گرم)</Label>
                <div className="relative">
                  <Input
                    id="sell-amount"
                    type="number"
                    inputMode="numeric"
                    step="0.001"
                    placeholder="مقدار طلا را وارد کنید"
                    value={sellAmount}
                    onChange={(e) => {
                      setSellAmount(e.target.value);
                      setSellError('');
                      setSellSuccess(false);
                    }}
                    className="input-gold-focus text-left tabular-nums text-base md:text-lg"
                    min={0}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    گرم
                  </span>
                </div>
              </div>

              {/* Quick Trade Buttons (gold bordered) */}
              <div className="scrollbar-gold mb-5 flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
                {QUICK_GRAM_AMOUNTS.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      setSellAmount(String(item.value));
                      setSellError('');
                      setSellSuccess(false);
                    }}
                    className={cn(
                      'min-h-[36px] shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:border-gold/50 hover:bg-gold/5 active:scale-[0.96] md:shrink',
                      Number(sellAmount) === item.value
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-gold/30 text-foreground',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <Separator className="mb-4" />

              {/* Calculated Info */}
              <div className="mb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">گرم طلا دریافت می‌کنید</span>
                  <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {sellGramsNum > 0 && goldPrice?.sellPrice ? formatToman(Math.round(sellFiatAmount)) : '---'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">کارمزد (0.3%)</span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {sellGramsNum > 0 ? formatToman(Math.round(sellFee)) : '---'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">مبلغ نهایی</span>
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {sellGramsNum > 0 ? formatToman(Math.round(sellNetAmount)) : '---'}
                  </span>
                </div>
              </div>

              {/* Gold Balance Info */}
              <div className="mb-4 rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">موجودی طلا</span>
                  <span
                    className={cn(
                      'text-xs font-semibold tabular-nums',
                      sellGramsNum > goldWallet.goldGrams ? 'text-red-500' : 'text-foreground',
                    )}
                  >
                    {formatGrams(goldWallet.goldGrams)}
                  </span>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {sellError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-950/30"
                  >
                    <AlertCircle className="size-4 shrink-0 text-red-500" />
                    <span className="text-xs text-red-600 dark:text-red-400">{sellError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success */}
              <AnimatePresence>
                {sellSuccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30"
                  >
                    <CheckCircle className="size-4 shrink-0 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      فروش طلا با موفقیت انجام شد!
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sell All Button */}
              {goldWallet.goldGrams > 0 && (
                <button
                  onClick={() => {
                    setSellAmount(String(goldWallet.goldGrams));
                    setSellError('');
                    setSellSuccess(false);
                  }}
                  className="btn-ghost-gold mb-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium text-gold transition-colors"
                >
                  <Zap className="size-3.5" />
                  فروش کل موجودی ({formatGrams(goldWallet.goldGrams)})
                </button>
              )}

              {/* Sell Button */}
              <Button
                onClick={() => openConfirmDialog('sell')}
                disabled={sellSubmitting || sellGramsNum <= 0 || !sellHasEnoughGold || sellSuccess}
                className="btn-danger-outline h-11 w-full font-bold disabled:opacity-50"
              >
                {sellSubmitting ? (
                  <>
                    <Loader2 className="ml-2 size-4 animate-spin" />
                    در حال پردازش...
                  </>
                ) : (
                  <>
                    <TrendingDown className="ml-2 size-4" />
                    فروش طلا
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          </div>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Market Depth Indicator                                  */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && (
        <motion.div variants={itemVariants}>
          <MarketDepthIndicator buyPressure={60} />
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Order Book Depth Chart (Hidden on mobile by default)    */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && (
        <motion.div
          variants={itemVariants}
          className={cn(!showMobileOrderBook && 'hidden md:block')}
        >
          <OrderBookDepthChart />
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Mobile: Show Order Book Toggle Button                   */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && !showMobileOrderBook && (
        <Button
          variant="outline"
          onClick={() => setShowMobileOrderBook(true)}
          className="w-full gap-2 border-gold/30 text-gold md:hidden min-h-[44px]"
        >
          <BarChart3 className="size-4" />
          مشاهده دفترچه سفارشات و عمق بازار
          <ChevronLeft className="size-4" />
        </Button>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Order Book Widget (Hidden on mobile by default)         */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && goldPrice?.buyPrice && goldPrice?.sellPrice && (
        <motion.div
          variants={itemVariants}
          className={cn(!showMobileOrderBook && 'hidden md:block')}
        >
          <OrderBookWidget
            buyPrice={goldPrice.buyPrice}
            sellPrice={goldPrice.sellPrice}
          />
        </motion.div>
      )}


      {/* ──────────────────────────────────────────────────────── */}
      {/*  Bottom Tabs: Recent Trades / Order History              */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && (
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="trades" className="w-full">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="trades" className="flex-1 gap-1.5 sm:flex-initial">
                <Clock className="size-3.5" />
                معاملات اخیر شما
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex-1 gap-1.5 sm:flex-initial">
                <Receipt className="size-3.5" />
                سفارشات اخیر
              </TabsTrigger>
            </TabsList>

            {/* Recent Gold Trades Tab */}
            <TabsContent value="trades">
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <Clock className="size-4 text-gold" />
                    معاملات اخیر شما
                  </CardTitle>
                  {recentGoldTrades.length > 0 && (
                    <Badge variant="secondary" className="bg-gold/10 text-gold">
                      {formatNumber(recentGoldTrades.length)} معامله
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  {recentGoldTrades.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
                        <Receipt className="size-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">معامله‌ای ثبت نشده</p>
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        با اولین خرید یا فروش طلا، معاملات شما اینجا نمایش داده می‌شود
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-96 space-y-1 overflow-y-auto">
                      {recentGoldTrades.slice(0, 10).map((tx) => {
                        const isBuy =
                          tx.type === 'buy_gold' || tx.type === 'gold_buy';
                        return (
                          <div
                            key={tx.id}
                            className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50"
                          >
                            <TradeTransactionIcon type={tx.type} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground">
                                  {isBuy ? 'خرید طلا' : 'فروش طلا'}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={cn('text-[10px]', getTransactionStatusColor(tx.status))}
                                >
                                  {getTransactionStatusLabel(tx.status)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatToman(tx.amountFiat)}</span>
                                {tx.goldPrice && (
                                  <>
                                    <span>·</span>
                                    <span>{formatToman(tx.goldPrice)} / گرم</span>
                                  </>
                                )}
                                <span>·</span>
                                <span>{getTimeAgo(tx.createdAt)}</span>
                              </div>
                            </div>
                            <div className="text-left">
                              <p
                                className={cn(
                                  'text-sm font-semibold tabular-nums',
                                  isBuy ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
                                )}
                              >
                                {isBuy ? '-' : '+'}
                                {tx.amountGold > 0 ? formatGrams(tx.amountGold) : formatPrice(tx.amountFiat)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Order History Tab */}
            <TabsContent value="orders">
              <OrderHistoryPanel />
            </TabsContent>
          </Tabs>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Price Alerts Section                                    */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && (
        <motion.div variants={itemVariants}>
          <PriceAlertsSection />
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Mobile Bottom Safe Area Padding                         */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="h-20 md:hidden" />

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Mobile Quick Trade Bar (Fixed Bottom)                   */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && goldPrice?.buyPrice && goldPrice?.sellPrice && (
        <MobileQuickTradeBar
          buyPrice={goldPrice.buyPrice}
          sellPrice={goldPrice.sellPrice}
          onOpenBuy={() => {
            setMobileTradeTab('buy');
            setMobileSheetOpen(true);
          }}
          onOpenSell={() => {
            setMobileTradeTab('sell');
            setMobileSheetOpen(true);
          }}
        />
      )}

      {/* Mobile Quick Trade Sheet */}
      <MobileQuickTradeSheet
        key={mobileTradeTab}
        mode={mobileTradeTab}
        open={mobileSheetOpen}
        onOpenChange={setMobileSheetOpen}
        buyPrice={goldPrice?.buyPrice ?? 0}
        sellPrice={goldPrice?.sellPrice ?? 0}
        balance={fiatWallet.balance}
        goldBalance={goldWallet.goldGrams}
        onConfirmBuy={handleBuy}
        onConfirmSell={handleSell}
      />

      {/* ─── Trade Confirmation Dialog ─── */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmAction === 'buy' ? (
                <>
                  <TrendingUp className="size-5 text-emerald-500" />
                  تأیید خرید طلا
                </>
              ) : (
                <>
                  <TrendingDown className="size-5 text-red-500" />
                  تأیید فروش طلا
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'buy'
                ? 'آیا از خرید طلا مطمئن هستید؟ این عملیات غیرقابل بازگشت است.'
                : 'آیا از فروش طلا مطمئن هستید؟ این عملیات غیرقابل بازگشت است.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
            {confirmAction === 'buy' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">مبلغ پرداخت</span>
                  <span className="text-sm font-bold tabular-nums">{formatToman(buyAmountNum)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">مقدار طلای دریافتی</span>
                  <span className="text-sm font-bold tabular-nums gold-gradient-text">{buyGrams > 0 ? formatGrams(buyGrams) : '---'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">کارمزد</span>
                  <span className="text-sm tabular-nums">{formatToman(Math.round(buyFee))}</span>
                </div>
              </>
            )}
            {confirmAction === 'sell' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">مقدار طلای فروشی</span>
                  <span className="text-sm font-bold tabular-nums gold-gradient-text">{formatGrams(sellGramsNum)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">مبلغ دریافتی</span>
                  <span className="text-sm font-bold tabular-nums">{formatToman(Math.round(sellNetAmount))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">کارمزد</span>
                  <span className="text-sm tabular-nums">{formatToman(Math.round(sellFee))}</span>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              className="flex-1"
            >
              انصراف
            </Button>
            <Button
              onClick={handleConfirmTrade}
              className={cn(
                'flex-1 font-bold',
                confirmAction === 'buy'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                  : 'bg-red-500 hover:bg-red-400 text-white',
              )}
            >
              {confirmAction === 'buy' ? 'تأیید خرید' : 'تأیید فروش'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Keyboard Shortcuts Info ─── */}
      {!isLoading && (
        <motion.div variants={itemVariants} className="mt-2">
          <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
            <p className="mb-3 text-xs font-semibold text-muted-foreground">⌨️ میانبرهای صفحه کلید</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { key: 'Tab', desc: 'تغییر خرید/فروش' },
                { key: 'Enter', desc: 'تأیید معامله' },
                { key: 'Esc', desc: 'بستن مودال' },
                { key: '0-9', desc: 'ورود سریع مقدار' },
              ].map((shortcut) => (
                <div key={shortcut.key} className="flex items-center gap-2">
                  <kbd className="inline-flex size-7 items-center justify-center rounded border border-border bg-background px-1.5 text-[10px] font-mono font-medium text-muted-foreground">
                    {shortcut.key}
                  </kbd>
                  <span className="text-[11px] text-muted-foreground">{shortcut.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

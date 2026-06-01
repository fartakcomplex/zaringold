'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Minus,
  Loader2,
  Filter,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  AlertTriangle,
  Zap,
  Coins,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Eye,
  Gem,
  CircleDot,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { cn, formatNumber, formatToman, formatGrams, formatPrice, getTimeAgo } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

type OrderType = 'buy' | 'sell';
type FilterType = 'all' | 'buy' | 'sell';
type OrderStatus = 'open' | 'matched' | 'partial' | 'cancelled';

interface P2POrder {
  id: string;
  userId: string;
  userName: string;
  type: OrderType;
  goldGrams: number;
  pricePerGram: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  matchedWith?: string;
  matchedAt?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Status Config                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getStatusConfig(status: OrderStatus) {
  switch (status) {
    case 'open':
      return { label: 'باز', icon: CircleDot, bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    case 'matched':
      return { label: 'مطابقت شده', icon: CheckCircle, bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
    case 'partial':
      return { label: 'جزئی', icon: RefreshCw, bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    case 'cancelled':
      return { label: 'لغو شده', icon: XCircle, bg: 'bg-red-500/10 text-red-500 border-red-500/20' };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeletons                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function P2PSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardContent className="p-5 space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
              <Skeleton className="size-8 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function P2PExchangeView() {
  const { user, goldWallet, goldPrice, addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<P2POrder[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('buy');
  const [filter, setFilter] = useState<FilterType>('all');
  const [goldAmount, setGoldAmount] = useState('');
  const [pricePerGram, setPricePerGram] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  const userId = user?.id || 'dev-super-admin';
  const currentPrice = goldPrice?.buyPrice ?? 34_000_000;

  // Sync price to input
  useEffect(() => {
    if (!pricePerGram) {
      setPricePerGram(String(currentPrice));
    }
  }, [currentPrice, pricePerGram]);

  /* ── Computed ── */
  const inputGrams = Number(goldAmount) || 0;
  const inputPrice = Number(pricePerGram) || 0;
  const totalAmount = inputGrams * inputPrice;

  /* ── Fetch orders ── */
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));

      setOrders([
        {
          id: 'p2p-1', userId: 'user-A', userName: 'کاربر ۱۲۳۴', type: 'sell',
          goldGrams: 0.5, pricePerGram: 33_800_000, totalAmount: 16_900_000,
          status: 'open', createdAt: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          id: 'p2p-2', userId: 'user-B', userName: 'کاربر ۵۶۷۸', type: 'buy',
          goldGrams: 1.0, pricePerGram: 34_200_000, totalAmount: 34_200_000,
          status: 'open', createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'p2p-3', userId: 'user-C', userName: 'کاربر ۹۰۱۲', type: 'sell',
          goldGrams: 2.0, pricePerGram: 33_500_000, totalAmount: 67_000_000,
          status: 'open', createdAt: new Date(Date.now() - 5400000).toISOString(),
        },
        {
          id: 'p2p-4', userId: 'user-D', userName: 'کاربر ۳۴۵۶', type: 'buy',
          goldGrams: 0.25, pricePerGram: 34_500_000, totalAmount: 8_625_000,
          status: 'open', createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'p2p-5', userId: 'user-E', userName: 'کاربر ۷۸۹۰', type: 'sell',
          goldGrams: 3.0, pricePerGram: 33_900_000, totalAmount: 101_700_000,
          status: 'matched', createdAt: new Date(Date.now() - 10800000).toISOString(),
          matchedWith: 'user-F', matchedAt: new Date(Date.now() - 9000000).toISOString(),
        },
        {
          id: 'p2p-6', userId: 'user-F', userName: 'کاربر ۱۱۰۰', type: 'buy',
          goldGrams: 0.75, pricePerGram: 34_100_000, totalAmount: 25_575_000,
          status: 'matched', createdAt: new Date(Date.now() - 14400000).toISOString(),
          matchedWith: 'user-A', matchedAt: new Date(Date.now() - 12000000).toISOString(),
        },
        {
          id: 'p2p-7', userId: userId, userName: 'شما', type: 'sell',
          goldGrams: 0.5, pricePerGram: 34_000_000, totalAmount: 17_000_000,
          status: 'cancelled', createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error('P2P fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* ── Create Order ── */
  const handleCreateOrder = async () => {
    if (!inputGrams || inputGrams < 0.001) {
      addToast('حداقل ۰.۰۰۱ گرم طلا', 'error');
      return;
    }
    if (!inputPrice || inputPrice < 1000000) {
      addToast('قیمت هر گرم نباید کمتر از ۱,۰۰۰,۰۰۰ تومان باشد', 'error');
      return;
    }
    if (orderType === 'sell' && inputGrams > goldWallet.goldGrams - goldWallet.frozenGold) {
      addToast('موجودی طلای کافی ندارید', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const newOrder: P2POrder = {
        id: `p2p-${Date.now()}`,
        userId,
        userName: 'شما',
        type: orderType,
        goldGrams: inputGrams,
        pricePerGram: inputPrice,
        totalAmount: totalAmount,
        status: 'open',
        createdAt: new Date().toISOString(),
      };

      setOrders(prev => [newOrder, ...prev]);
      setGoldAmount('');
      addToast(`سفارش ${orderType === 'buy' ? 'خرید' : 'فروش'} ${formatGrams(inputGrams)} ثبت شد ✅`, 'success');
    } catch {
      addToast('خطا در ثبت سفارش', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Match Order ── */
  const handleMatchOrder = async (orderId: string) => {
    setIsMatching(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setOrders(prev =>
        prev.map(o =>
          o.id === orderId
            ? { ...o, status: 'matched' as OrderStatus, matchedWith: userId, matchedAt: new Date().toISOString() }
            : o,
        ),
      );

      const order = orders.find(o => o.id === orderId);
      if (order) {
        addToast(
          `سفارش ${formatGrams(order.goldGrams)} ${order.type === 'buy' ? 'خرید' : 'فروش'} مطابقت یافت ✅`,
          'success',
        );
      }
    } catch {
      addToast('خطا در مطابقت سفارش', 'error');
    } finally {
      setIsMatching(false);
    }
  };

  /* ── Cancel Order ── */
  const handleCancelOrder = async (orderId: string) => {
    try {
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o),
      );
      addToast('سفارش لغو شد', 'info');
    } catch {
      addToast('خطا در لغو سفارش', 'error');
    }
  };

  /* ── Filter & Sort ── */
  const filteredOrders = orders
    .filter(o => filter === 'all' || o.type === filter)
    .filter(o => o.status === 'open')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const myOrders = orders.filter(o => o.userId === userId).slice(0, 5);

  const openBuyCount = orders.filter(o => o.type === 'buy' && o.status === 'open').length;
  const openSellCount = orders.filter(o => o.type === 'sell' && o.status === 'open').length;

  if (isLoading) return <P2PSkeleton />;

  return (
    <div className="space-y-4 p-4">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#D4AF37]/10">
          <ArrowLeftRight className="size-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">بازار همتا به همتا</h1>
          <p className="text-xs text-muted-foreground">خرید و فروش مستقیم طلا با کاربران</p>
        </div>
      </div>

      {/* ── Market Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="overflow-hidden">
          <CardContent className="p-4 text-center">
            <TrendingUp className="size-4 text-emerald-500 mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">سفارش خرید</p>
            <p className="text-base font-black tabular-nums text-emerald-500">{formatNumber(openBuyCount)}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4 text-center">
            <TrendingDown className="size-4 text-red-500 mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">سفارش فروش</p>
            <p className="text-base font-black tabular-nums text-red-500">{formatNumber(openSellCount)}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4 text-center">
            <Coins className="size-4 text-[#D4AF37] mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">قیمت فعلی</p>
            <p className="text-xs font-black tabular-nums text-foreground">{formatToman(currentPrice)}</p>
            <p className="text-[9px] text-muted-foreground">هر گرم</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Create Order Form ── */}
      <Card className="overflow-hidden border-[#D4AF37]/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Plus className="size-4 text-[#D4AF37]" />
            ثبت سفارش
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            موجودی: {formatGrams(goldWallet.goldGrams)}
          </Badge>
        </CardHeader>
        <CardContent className="pb-5 space-y-4">
          {/* Buy/Sell Toggle */}
          <div className="flex gap-2">
            <Button
              variant={orderType === 'buy' ? 'default' : 'outline'}
              className={cn(
                'flex-1 text-xs font-bold',
                orderType === 'buy'
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'border-border hover:border-emerald-300',
              )}
              onClick={() => setOrderType('buy')}
            >
              <TrendingUp className="size-3.5 me-1" />
              خرید طلا
            </Button>
            <Button
              variant={orderType === 'sell' ? 'default' : 'outline'}
              className={cn(
                'flex-1 text-xs font-bold',
                orderType === 'sell'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'border-border hover:border-red-300',
              )}
              onClick={() => setOrderType('sell')}
            >
              <TrendingDown className="size-3.5 me-1" />
              فروش طلا
            </Button>
          </div>

          {/* Gold Amount */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">مقدار طلا (گرم)</label>
            <input
              type="number"
              value={goldAmount}
              onChange={(e) => setGoldAmount(e.target.value)}
              placeholder="مثلاً: 0.5"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm tabular-nums text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#D4AF37]/40 transition-colors"
              dir="ltr"
            />
            <div className="flex gap-1.5 mt-2">
              {[0.1, 0.5, 1, 5, 10].map((p) => (
                <button
                  key={p}
                  onClick={() => setGoldAmount(String(p))}
                  className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-colors tabular-nums"
                >
                  {p}g
                </button>
              ))}
            </div>
          </div>

          {/* Price per gram */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              قیمت هر گرم (تومان)
              <button
                onClick={() => setPricePerGram(String(currentPrice))}
                className="ms-2 text-[#D4AF37] hover:underline"
              >
                قیمت فعلی بازار
              </button>
            </label>
            <input
              type="number"
              value={pricePerGram}
              onChange={(e) => setPricePerGram(e.target.value)}
              placeholder="قیمت دلخواه..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm tabular-nums text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#D4AF37]/40 transition-colors"
              dir="ltr"
            />
          </div>

          {/* Total preview */}
          {inputGrams > 0 && inputPrice > 0 && (
            <div className="rounded-xl bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">مبلغ کل</span>
                <span className="text-sm font-black tabular-nums text-foreground">{formatToman(totalAmount)}</span>
              </div>
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleCreateOrder}
            disabled={!inputGrams || !inputPrice || isSubmitting}
            className={cn(
              'w-full py-3 text-sm font-bold rounded-xl disabled:opacity-40 shadow-lg',
              orderType === 'buy'
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/10'
                : 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/10',
            )}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin mx-auto" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                {orderType === 'buy' ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                ثبت سفارش {orderType === 'buy' ? 'خرید' : 'فروش'}
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── Filter + Open Orders ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Search className="size-4 text-[#D4AF37]" />
            سفارش‌های باز
          </CardTitle>
          <div className="flex gap-1.5">
            {([
              { key: 'all' as FilterType, label: 'همه' },
              { key: 'buy' as FilterType, label: 'خرید' },
              { key: 'sell' as FilterType, label: 'فروش' },
            ]).map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'text-[10px] h-6 px-2',
                  filter === f.key
                    ? 'bg-[#D4AF37] text-[#1a1a1a]'
                    : 'text-muted-foreground',
                )}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-2">
            {filteredOrders.map((order) => {
              const isOwnOrder = order.userId === userId;
              const canMatch = !isOwnOrder;

              return (
                <div
                  key={order.id}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                    order.type === 'buy'
                      ? 'border-emerald-500/15 hover:border-emerald-500/30'
                      : 'border-red-500/15 hover:border-red-500/30',
                  )}
                >
                  {/* Type icon */}
                  <div className={cn(
                    'flex size-9 items-center justify-center rounded-lg shrink-0',
                    order.type === 'buy'
                      ? 'bg-emerald-500/10'
                      : 'bg-red-500/10',
                  )}>
                    {order.type === 'buy' ? (
                      <TrendingUp className="size-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="size-4 text-red-500" />
                    )}
                  </div>

                  {/* Order details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-xs font-bold',
                        order.type === 'buy' ? 'text-emerald-500' : 'text-red-500',
                      )}>
                        {order.type === 'buy' ? 'خرید' : 'فروش'}
                      </span>
                      <span className="text-sm font-bold text-foreground">{formatGrams(order.goldGrams)} طلا</span>
                      {isOwnOrder && (
                        <Badge variant="secondary" className="text-[8px]">شما</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {formatToman(order.pricePerGram)}/گرم
                      </span>
                      <span className="text-[11px] text-muted-foreground">•</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        جمع: {formatToman(order.totalAmount)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                      <Clock className="size-2.5" />
                      {getTimeAgo(order.createdAt)}
                    </p>
                  </div>

                  {/* Action */}
                  {canMatch ? (
                    <Button
                      size="sm"
                      className="shrink-0 text-[10px] font-bold bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249] h-8 px-3"
                      onClick={() => handleMatchOrder(order.id)}
                      disabled={isMatching}
                    >
                      {isMatching ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        'مطابقت'
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 text-[10px] text-red-500 hover:bg-red-50 h-8 px-3"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      لغو
                    </Button>
                  )}
                </div>
              );
            })}

            {filteredOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8">
                <ArrowLeftRight className="size-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">سفارشی یافت نشد</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── My Orders History ── */}
      {myOrders.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="size-4 text-[#D4AF37]" />
              سفارش‌های من
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2">
              {myOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <div key={order.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <div className={cn(
                      'flex size-9 items-center justify-center rounded-lg shrink-0',
                      order.type === 'buy' ? 'bg-emerald-500/10' : 'bg-red-500/10',
                    )}>
                      {order.type === 'buy' ? (
                        <TrendingUp className="size-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="size-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          {order.type === 'buy' ? 'خرید' : 'فروش'} {formatGrams(order.goldGrams)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {formatToman(order.totalAmount)} — {getTimeAgo(order.createdAt)}
                      </p>
                    </div>
                    <Badge className={cn('text-[9px] border', statusConfig.bg)}>
                      <StatusIcon className="size-3 me-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Security Note ── */}
      <Card className="overflow-hidden border-[#D4AF37]/10 bg-[#D4AF37]/[0.03]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#D4AF37]/10 shrink-0 mt-0.5">
              <Shield className="size-4 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground mb-1">امنیت P2P</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                تمام معاملات P2P توسط سیستم گارانتی زرین‌گلد تأیید می‌شوند.
                طلا تا تأیید نهایی هر دو طرف در اسکرو (حساب امانی) نگهداری می‌شود.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

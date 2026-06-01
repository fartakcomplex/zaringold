'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { cn, formatNumber, formatToman, formatGrams, formatPrice, getTimeAgo } from '@/lib/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Star,
  Lock,
  Unlock,
  Scale,
  AlertOctagon,
  ChevronDown,
  Gavel,
  Wallet,
  Banknote,
  Building2,
  CreditCard,
  CircleDot,
  Users,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                        */
/* ═══════════════════════════════════════════════════════════════ */

type OrderType = 'buy' | 'sell';
type OrderStatus = 'open' | 'matched' | 'partial' | 'cancelled' | 'dispute';
type PaymentMethod = 'wallet' | 'bank_transfer' | 'card' | 'cash';
type MyOrderTab = 'open' | 'completed' | 'cancelled';

interface P2POrder {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: OrderType;
  goldGrams: number;
  pricePerGram: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  trustScore: number;
  completedTrades: number;
  escrowStatus: 'pending' | 'held' | 'released' | 'none';
  createdAt: string;
  expiresAt?: string;
  matchedWith?: string;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Helpers                                                      */
/* ═══════════════════════════════════════════════════════════════ */

function getStatusConfig(status: OrderStatus) {
  switch (status) {
    case 'open': return { label: 'باز', icon: CircleDot, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    case 'matched': return { label: 'انجام شده', icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' };
    case 'partial': return { label: 'جزئی', icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' };
    case 'cancelled': return { label: 'لغو شده', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' };
    case 'dispute': return { label: 'مناقشه', icon: AlertOctagon, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' };
  }
}

function getPaymentIcon(method: PaymentMethod) {
  switch (method) {
    case 'wallet': return <Wallet className="size-3.5 text-[#D4AF37]" />;
    case 'bank_transfer': return <Building2 className="size-3.5 text-blue-400" />;
    case 'card': return <CreditCard className="size-3.5 text-purple-400" />;
    case 'cash': return <Banknote className="size-3.5 text-green-400" />;
  }
}

function getPaymentLabel(method: PaymentMethod) {
  switch (method) {
    case 'wallet': return 'کیف پول';
    case 'bank_transfer': return 'انتقال بانکی';
    case 'card': return 'کارت به کارت';
    case 'cash': return 'نقدی';
  }
}

function TrustBadge({ score }: { score: number }) {
  const color = score >= 90 ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    : score >= 70 ? 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    : score >= 50 ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    : 'text-red-500 bg-red-500/10 border-red-500/20';
  return (
    <Badge className={cn('text-[9px] border gap-1', color)}>
      <Star className="size-2.5" />
      {score}
    </Badge>
  );
}

function getEscrowBadge(status: string) {
  switch (status) {
    case 'held': return <Badge className="text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1"><Lock className="size-2.5" /> امانی</Badge>;
    case 'released': return <Badge className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1"><Unlock className="size-2.5" /> آزاد</Badge>;
    case 'pending': return <Badge className="text-[9px] bg-gray-500/10 text-gray-500 border-gray-500/20 gap-1"><Clock className="size-2.5" /> در انتظار</Badge>;
    default: return null;
  }
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Mock Data                                                    */
/* ═══════════════════════════════════════════════════════════════ */

const MOCK_ORDERS: P2POrder[] = [
  { id: 'p2p-1', userId: 'u1', userName: 'علی محمدی', type: 'sell', goldGrams: 0.5, pricePerGram: 33_800_000, totalAmount: 16_900_000, paymentMethod: 'bank_transfer', status: 'open', trustScore: 95, completedTrades: 48, escrowStatus: 'none', createdAt: new Date(Date.now() - 900000).toISOString(), expiresAt: new Date(Date.now() + 82800000).toISOString() },
  { id: 'p2p-2', userId: 'u2', userName: 'سارا احمدی', type: 'buy', goldGrams: 1.0, pricePerGram: 34_200_000, totalAmount: 34_200_000, paymentMethod: 'wallet', status: 'open', trustScore: 88, completedTrades: 32, escrowStatus: 'none', createdAt: new Date(Date.now() - 1800000).toISOString(), expiresAt: new Date(Date.now() + 81900000).toISOString() },
  { id: 'p2p-3', userId: 'u3', userName: 'محمد رضایی', type: 'sell', goldGrams: 2.0, pricePerGram: 33_500_000, totalAmount: 67_000_000, paymentMethod: 'card', status: 'open', trustScore: 76, completedTrades: 19, escrowStatus: 'none', createdAt: new Date(Date.now() - 3600000).toISOString(), expiresAt: new Date(Date.now() + 80100000).toISOString() },
  { id: 'p2p-4', userId: 'u4', userName: 'فاطمه کریمی', type: 'buy', goldGrams: 0.25, pricePerGram: 34_500_000, totalAmount: 8_625_000, paymentMethod: 'cash', status: 'open', trustScore: 92, completedTrades: 41, escrowStatus: 'none', createdAt: new Date(Date.now() - 5400000).toISOString(), expiresAt: new Date(Date.now() + 78300000).toISOString() },
  { id: 'p2p-5', userId: 'u5', userName: 'حسین نوری', type: 'sell', goldGrams: 3.0, pricePerGram: 33_900_000, totalAmount: 101_700_000, paymentMethod: 'bank_transfer', status: 'open', trustScore: 65, completedTrades: 8, escrowStatus: 'none', createdAt: new Date(Date.now() - 7200000).toISOString(), expiresAt: new Date(Date.now() + 76500000).toISOString() },
  { id: 'p2p-6', userId: 'u6', userName: 'مریم هاشمی', type: 'buy', goldGrams: 5.0, pricePerGram: 34_100_000, totalAmount: 170_500_000, paymentMethod: 'wallet', status: 'open', trustScore: 98, completedTrades: 72, escrowStatus: 'none', createdAt: new Date(Date.now() - 10800000).toISOString(), expiresAt: new Date(Date.now() + 72900000).toISOString() },
  { id: 'p2p-7', userId: 'u7', userName: 'رضا میرزایی', type: 'sell', goldGrams: 0.1, pricePerGram: 34_300_000, totalAmount: 3_430_000, paymentMethod: 'card', status: 'open', trustScore: 80, completedTrades: 25, escrowStatus: 'none', createdAt: new Date(Date.now() - 14400000).toISOString(), expiresAt: new Date(Date.now() + 69300000).toISOString() },
  { id: 'p2p-me-1', userId: 'me', userName: 'شما', type: 'sell', goldGrams: 0.5, pricePerGram: 34_000_000, totalAmount: 17_000_000, paymentMethod: 'wallet', status: 'matched', trustScore: 85, completedTrades: 15, escrowStatus: 'released', createdAt: new Date(Date.now() - 86400000).toISOString(), matchedWith: 'u2' },
  { id: 'p2p-me-2', userId: 'me', userName: 'شما', type: 'buy', goldGrams: 1.5, pricePerGram: 33_700_000, totalAmount: 50_550_000, paymentMethod: 'bank_transfer', status: 'open', trustScore: 85, completedTrades: 15, escrowStatus: 'held', createdAt: new Date(Date.now() - 3600000).toISOString(), expiresAt: new Date(Date.now() + 80100000).toISOString() },
  { id: 'p2p-me-3', userId: 'me', userName: 'شما', type: 'sell', goldGrams: 0.3, pricePerGram: 34_200_000, totalAmount: 10_260_000, paymentMethod: 'card', status: 'cancelled', trustScore: 85, completedTrades: 15, escrowStatus: 'none', createdAt: new Date(Date.now() - 172800000).toISOString() },
];

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Page                                                    */
/* ═══════════════════════════════════════════════════════════════ */

export default function EnhancedP2PPage() {
  const { user, goldWallet, goldPrice, addToast } = useAppStore();
  const [orders, setOrders] = useState<P2POrder[]>(MOCK_ORDERS);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState<OrderType>('buy');
  const [goldAmount, setGoldAmount] = useState('');
  const [pricePerGram, setPricePerGram] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMatching, setIsMatching] = useState('');
  const [myTab, setMyTab] = useState<MyOrderTab>('open');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 999999999]);
  const [goldRange, setGoldRange] = useState<[number, number]>([0, 999]);
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [disputeDialog, setDisputeDialog] = useState<string | null>(null);

  const userId = user?.id || 'me';
  const currentPrice = goldPrice?.buyPrice ?? 34_000_000;

  useEffect(() => {
    if (!pricePerGram) setPricePerGram(String(currentPrice));
  }, [currentPrice, pricePerGram]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const inputGrams = Number(goldAmount) || 0;
  const inputPrice = Number(pricePerGram) || 0;
  const totalAmount = inputGrams * inputPrice;

  const openOrders = useMemo(() =>
    orders.filter(o => o.userId !== userId && o.status === 'open').filter(o =>
      filterType === 'all' || o.type === filterType
    ).filter(o =>
      paymentFilter === 'all' || o.paymentMethod === paymentFilter
    ).filter(o =>
      o.goldGrams >= goldRange[0] && o.goldGrams <= goldRange[1]
    ).filter(o =>
      o.pricePerGram >= priceRange[0] && o.pricePerGram <= priceRange[1]
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders, userId, filterType, paymentFilter, goldRange, priceRange]);

  const myOrders = useMemo(() =>
    orders.filter(o => o.userId === userId),
    [orders, userId]);

  const myOpenOrders = myOrders.filter(o => o.status === 'open');
  const myCompletedOrders = myOrders.filter(o => o.status === 'matched');
  const myCancelledOrders = myOrders.filter(o => o.status === 'cancelled');

  const openBuyCount = orders.filter(o => o.type === 'buy' && o.status === 'open' && o.userId !== userId).length;
  const openSellCount = orders.filter(o => o.type === 'sell' && o.status === 'open' && o.userId !== userId).length;

  const handleCreateOrder = async () => {
    if (!inputGrams || inputGrams < 0.01) { addToast('حداقل ۰.۰۱ گرم', 'error'); return; }
    if (!inputPrice || inputPrice < 1000000) { addToast('قیمت نامعتبر', 'error'); return; }
    if (orderType === 'sell' && inputGrams > goldWallet.goldGrams) { addToast('موجودی کافی نیست', 'error'); return; }

    setIsSubmitting(true);
    setTimeout(() => {
      const newOrder: P2POrder = {
        id: `p2p-${Date.now()}`, userId, userName: 'شما', type: orderType,
        goldGrams: inputGrams, pricePerGram: inputPrice, totalAmount,
        paymentMethod, status: 'open', trustScore: 85, completedTrades: 15,
        escrowStatus: 'none', createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };
      setOrders(prev => [newOrder, ...prev]);
      setGoldAmount('');
      addToast(`سفارش ${orderType === 'buy' ? 'خرید' : 'فروش'} ثبت شد ✅`, 'success');
      setIsSubmitting(false);
    }, 600);
  };

  const handleMatch = async (orderId: string) => {
    setIsMatching(orderId);
    setTimeout(() => {
      setOrders(prev => prev.map(o =>
        o.id === orderId
          ? { ...o, status: 'matched' as OrderStatus, matchedWith: userId, escrowStatus: 'held' as const }
          : o
      ));
      addToast('درخواست مطابقت ارسال شد. منتظر تأیید طرف مقابل باشید.', 'success');
      setIsMatching('');
    }, 800);
  };

  const handleDispute = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'dispute' as OrderStatus } : o));
    setDisputeDialog(null);
    addToast('درخواست مناقشه ثبت شد. تیم پشتیبانی بررسی خواهد کرد.', 'info');
  };

  if (loading) {
    return <div className="space-y-4 p-4">{[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#D4AF37]/10">
          <ArrowLeftRight className="size-5 text-[#D4AF37]" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold">معامله P2P طلا</h1>
          <p className="text-xs text-muted-foreground">خرید و فروش مستقیم با کاربران دیگر</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center">
          <TrendingUp className="size-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground">سفارش خرید</p>
          <p className="text-lg font-black tabular-nums text-emerald-500">{openBuyCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <TrendingDown className="size-4 text-red-500 mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground">سفارش فروش</p>
          <p className="text-lg font-black tabular-nums text-red-500">{openSellCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Coins className="size-4 text-[#D4AF37] mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground">قیمت فعلی</p>
          <p className="text-xs font-black tabular-nums">{formatToman(currentPrice)}</p>
          <p className="text-[9px] text-muted-foreground">هر گرم</p>
        </CardContent></Card>
      </div>

      {/* Tabs: OrderBook / MyOrders */}
      <Tabs defaultValue="orderbook" className="w-full">
        <TabsList className="w-full bg-muted/50 h-10">
          <TabsTrigger value="orderbook" className="flex-1 text-xs">
            <Users className="size-3.5 me-1" /> سفارش‌های بازار
          </TabsTrigger>
          <TabsTrigger value="create" className="flex-1 text-xs">
            <Plus className="size-3.5 me-1" /> ثبت سفارش
          </TabsTrigger>
          <TabsTrigger value="myorders" className="flex-1 text-xs">
            <Eye className="size-3.5 me-1" /> سفارش‌های من
          </TabsTrigger>
        </TabsList>

        {/* Order Book Tab */}
        <TabsContent value="orderbook" className="mt-3 space-y-3">
          {/* Filter toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn('text-[10px] h-7', showFilters ? 'bg-[#D4AF37] text-[#1a1a1a]' : 'border-border')}
            >
              <Filter className="size-3 me-1" /> فیلتر
            </Button>
            <div className="flex gap-1 flex-1">
              {(['all', 'buy', 'sell'] as const).map(f => (
                <button key={f} onClick={() => setFilterType(f)} className={cn(
                  'flex-1 py-1 rounded-lg text-[10px] font-medium transition-all',
                  filterType === f ? 'bg-[#D4AF37] text-[#1a1a1a]' : 'bg-muted text-muted-foreground'
                )}>
                  {f === 'all' ? 'همه' : f === 'buy' ? 'خرید' : 'فروش'}
                </button>
              ))}
            </div>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <Card className="bg-card border-border/50">
              <CardContent className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px]">روش پرداخت</Label>
                    <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value as PaymentMethod | 'all')} className="w-full mt-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
                      <option value="all">همه</option>
                      <option value="wallet">کیف پول</option>
                      <option value="bank_transfer">انتقال بانکی</option>
                      <option value="card">کارت به کارت</option>
                      <option value="cash">نقدی</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[10px]">حداقل گرم</Label>
                    <Input type="number" value={goldRange[0] || ''} onChange={e => setGoldRange([Number(e.target.value) || 0, goldRange[1]])} placeholder="۰" dir="ltr" className="mt-1 h-8 text-xs tabular-nums" />
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setFilterType('all'); setPaymentFilter('all'); setGoldRange([0, 999]); setPriceRange([0, 999999999]); }} className="w-full text-[10px]">
                  <RefreshCw className="size-3 me-1" /> بازنشانی فیلترها
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Order list */}
          <div className="space-y-2">
            {openOrders.map(order => (
              <Card key={order.id} className={cn(
                'border transition-colors overflow-hidden',
                order.type === 'buy' ? 'border-emerald-500/15 hover:border-emerald-500/30' : 'border-red-500/15 hover:border-red-500/30'
              )}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    {/* User avatar area */}
                    <div className={cn(
                      'flex size-10 items-center justify-center rounded-xl text-lg shrink-0',
                      order.type === 'buy' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    )}>
                      {order.type === 'buy' ? '🟢' : '🔴'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold">{order.userName}</span>
                        <TrustBadge score={order.trustScore} />
                        <Badge variant="outline" className="text-[8px]">
                          <CheckCircle className="size-2.5 me-0.5" />
                          {order.completedTrades} معامله
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn('text-xs font-bold', order.type === 'buy' ? 'text-emerald-500' : 'text-red-500')}>
                          {order.type === 'buy' ? 'خرید' : 'فروش'}
                        </span>
                        <span className="text-sm font-bold tabular-nums">{formatGrams(order.goldGrams)}</span>
                        <span className="text-[10px] text-muted-foreground">طلا</span>
                        <Separator orientation="vertical" className="h-3 mx-1" />
                        <span className="text-[11px] tabular-nums">{formatToman(order.pricePerGram)}/گرم</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {getPaymentIcon(order.paymentMethod)}
                        <span className="text-[10px] text-muted-foreground">{getPaymentLabel(order.paymentMethod)}</span>
                        <Separator orientation="vertical" className="h-3 mx-0.5" />
                        <span className="text-[10px] text-muted-foreground">{getTimeAgo(order.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <p className="text-sm font-bold tabular-nums">{formatToman(order.totalAmount)}</p>
                      <Button
                        size="sm" className="text-[10px] font-bold bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249] h-7 px-3"
                        onClick={() => handleMatch(order.id)}
                        disabled={isMatching === order.id}
                      >
                        {isMatching === order.id ? <Loader2 className="size-3 animate-spin" /> : 'مطابقت'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {openOrders.length === 0 && (
              <div className="flex flex-col items-center py-10">
                <ArrowLeftRight className="size-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">سفارشی یافت نشد</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Create Order Tab */}
        <TabsContent value="create" className="mt-3">
          <Card className="border-[#D4AF37]/20">
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-2">
                <Button variant={orderType === 'buy' ? 'default' : 'outline'} onClick={() => setOrderType('buy')} className={cn('flex-1 text-xs font-bold', orderType === 'buy' ? 'bg-emerald-500 text-white' : 'border-border')}>
                  <TrendingUp className="size-3.5 me-1" /> خرید طلا
                </Button>
                <Button variant={orderType === 'sell' ? 'default' : 'outline'} onClick={() => setOrderType('sell')} className={cn('flex-1 text-xs font-bold', orderType === 'sell' ? 'bg-red-500 text-white' : 'border-border')}>
                  <TrendingDown className="size-3.5 me-1" /> فروش طلا
                </Button>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">مقدار طلا (گرم)</Label>
                <Input type="number" value={goldAmount} onChange={e => setGoldAmount(e.target.value)} placeholder="مثلاً: 0.5" dir="ltr" className="mt-1.5 tabular-nums" />
                <div className="flex gap-1.5 mt-2">
                  {[0.1, 0.5, 1, 2, 5, 10].map(p => (
                    <button key={p} onClick={() => setGoldAmount(String(p))} className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-[10px] hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-colors tabular-nums">{p}g</button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  قیمت هر گرم (تومان)
                  <button onClick={() => setPricePerGram(String(currentPrice))} className="ms-2 text-[#D4AF37] hover:underline">قیمت بازار</button>
                </Label>
                <Input type="number" value={pricePerGram} onChange={e => setPricePerGram(e.target.value)} dir="ltr" className="mt-1.5 tabular-nums" />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">روش پرداخت</Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {([
                    { key: 'wallet' as PaymentMethod, label: 'کیف پول', icon: <Wallet className="size-4" /> },
                    { key: 'bank_transfer' as PaymentMethod, label: 'انتقال بانکی', icon: <Building2 className="size-4" /> },
                    { key: 'card' as PaymentMethod, label: 'کارت به کارت', icon: <CreditCard className="size-4" /> },
                    { key: 'cash' as PaymentMethod, label: 'نقدی', icon: <Banknote className="size-4" /> },
                  ]).map(m => (
                    <button key={m.key} onClick={() => setPaymentMethod(m.key)} className={cn(
                      'flex items-center gap-2 p-2.5 rounded-lg border text-xs transition-all',
                      paymentMethod === m.key ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-border hover:border-[#D4AF37]/30'
                    )}>
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {inputGrams > 0 && inputPrice > 0 && (
                <div className="rounded-xl bg-muted/30 p-3 space-y-1">
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">مقدار طلا</span><span className="font-bold tabular-nums">{formatGrams(inputGrams)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">قیمت هر گرم</span><span className="font-bold tabular-nums">{formatToman(inputPrice)}</span></div>
                  <Separator className="my-1" />
                  <div className="flex justify-between text-sm"><span className="font-bold">مبلغ کل</span><span className="font-black tabular-nums">{formatToman(totalAmount)}</span></div>
                </div>
              )}

              <Button onClick={handleCreateOrder} disabled={!inputGrams || !inputPrice || isSubmitting} className={cn('w-full py-3 text-sm font-bold rounded-xl', orderType === 'buy' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-red-500 text-white hover:bg-red-600')}>
                {isSubmitting ? <Loader2 className="size-4 animate-spin mx-auto" /> : <span className="flex items-center justify-center gap-2">{orderType === 'buy' ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />} ثبت سفارش</span>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Orders Tab */}
        <TabsContent value="myorders" className="mt-3">
          <div className="flex gap-1 mb-3">
            {(['open', 'completed', 'cancelled'] as const).map(tab => (
              <button key={tab} onClick={() => setMyTab(tab)} className={cn(
                'flex-1 py-2 rounded-lg text-[11px] font-medium transition-all',
                myTab === tab ? 'bg-[#D4AF37] text-[#1a1a1a]' : 'bg-muted text-muted-foreground'
              )}>
                {tab === 'open' ? 'باز' : tab === 'completed' ? 'انجام شده' : 'لغو شده'}
                <span className="ms-1">({(tab === 'open' ? myOpenOrders : tab === 'completed' ? myCompletedOrders : myCancelledOrders).length})</span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {(myTab === 'open' ? myOpenOrders : myTab === 'completed' ? myCompletedOrders : myCancelledOrders).map(order => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={cn('flex size-10 items-center justify-center rounded-xl shrink-0', order.type === 'buy' ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
                        {order.type === 'buy' ? <TrendingUp className="size-4 text-emerald-500" /> : <TrendingDown className="size-4 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-xs font-bold', order.type === 'buy' ? 'text-emerald-500' : 'text-red-500')}>
                            {order.type === 'buy' ? 'خرید' : 'فروش'} {formatGrams(order.goldGrams)}
                          </span>
                          <Badge className={cn('text-[9px] border', statusConfig.bg)}>
                            <StatusIcon className="size-2.5 me-0.5" />{statusConfig.label}
                          </Badge>
                          {order.escrowStatus === 'held' && getEscrowBadge('held')}
                          {order.escrowStatus === 'released' && getEscrowBadge('released')}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] tabular-nums">{formatToman(order.totalAmount)}</span>
                          <span className="text-[10px] text-muted-foreground">•</span>
                          <span className="text-[10px] text-muted-foreground">{getTimeAgo(order.createdAt)}</span>
                        </div>
                      </div>
                      {myTab === 'open' && (
                        <Button variant="ghost" size="sm" className="text-[10px] text-red-500 hover:bg-red-500/10 h-7 px-2" onClick={() => {
                          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' as OrderStatus } : o));
                          addToast('سفارش لغو شد', 'info');
                        }}>
                          لغو
                        </Button>
                      )}
                      {myTab === 'completed' && order.status !== 'dispute' && (
                        <Button variant="ghost" size="sm" className="text-[10px] text-orange-500 hover:bg-orange-500/10 h-7 px-2" onClick={() => setDisputeDialog(order.id)}>
                          <Gavel className="size-3 me-1" /> مناقشه
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {(myTab === 'open' ? myOpenOrders : myTab === 'completed' ? myCompletedOrders : myCancelledOrders).length === 0 && (
              <div className="flex flex-col items-center py-10">
                <Clock className="size-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">سفارشی یافت نشد</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Security Note */}
      <Card className="border-[#D4AF37]/10 bg-[#D4AF37]/[0.03]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#D4AF37]/10 shrink-0">
              <Shield className="size-4 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-xs font-bold mb-1">گارانتی معاملات P2P</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                تمام معاملات تحت نظر سیستم گارانتی زرین گلد انجام می‌شوند. طلا تا تأیید نهایی در حساب امانی نگهداری شده و در صورت بروز مشکل، مبلغ به صورت کامل بازگردانده می‌شود.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dispute Dialog */}
      <Dialog open={!!disputeDialog} onOpenChange={() => setDisputeDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <AlertOctagon className="size-4 text-orange-500" /> ثبت مناقشه
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">آیا مطمئن هستید که می‌خواهید برای این معامله مناقشه ثبت کنید؟</p>
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="size-4 text-amber-500 shrink-0" />
                <p className="text-[11px] text-muted-foreground">تیم پشتیبانی ظرف ۲۴ ساعت معامله را بررسی می‌کند.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDisputeDialog(null)} className="text-xs">انصراف</Button>
            <Button size="sm" onClick={() => disputeDialog && handleDispute(disputeDialog)} className="text-xs bg-orange-500 text-white hover:bg-orange-600">ثبت مناقشه</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

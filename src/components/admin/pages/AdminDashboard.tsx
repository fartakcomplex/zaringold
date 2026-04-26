'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { getTimeAgo, getTransactionTypeLabel } from '@/lib/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users, Shield, ArrowUpDown, CreditCard, TrendingUp, Activity,
  Clock, CheckCircle, XCircle, Zap, Eye, Server, Database, Wifi,
  DollarSign, Banknote, AlertTriangle, BarChart3, ArrowUpRight,
  ArrowDownRight, Crown, Circle, Bell, FileWarning, Info,
  ShieldCheck, Wallet, BadgeCheck, HourglassIcon,
  Cpu, HardDrive, MemoryStick, Globe, Layers, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AdminUser {
  id: string; phone: string; email: string | null; fullName: string | null;
  isVerified: boolean; isActive: boolean; isFrozen: boolean; role: string;
  createdAt: string; lastLoginAt?: string | null;
}
interface AdminKYC {
  id: string; userId: string; status: string; adminNote: string | null;
  createdAt: string; user: { phone: string; fullName: string | null };
}
interface AdminTx {
  id: string; type: string; amountFiat: number; amountGold: number;
  status: string; createdAt: string; user: { phone: string; fullName: string | null };
}
interface GoldPrices {
  buy: number; sell: number; market: number; ounce: number;
  spread: number; currency: string; isManual: boolean; updatedAt: string;
}
interface SystemAlert {
  id: string; type: 'warning' | 'info' | 'success' | 'error';
  title: string; message: string; createdAt: string; page?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'صبح بخیر';
  if (h >= 12 && h < 17) return 'ظهر بخیر';
  if (h >= 17 && h < 21) return 'عصر بخیر';
  return 'شب بخیر';
}

function getPersianToday(): string {
  return new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

const PERSIAN_DAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

function getLast7DaysData(): Array<{ label: string; date: Date; count: number }> {
  const days: Array<{ label: string; date: Date; count: number }> = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({ label: PERSIAN_DAYS[d.getDay()], date: d, count: 0 });
  }
  return days;
}

function formatPriceShort(price: number): string {
  if (price >= 1_000_000) {
    return `${(price / 1_000_000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیون`;
  }
  return price.toLocaleString('fa-IR');
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminDashboard() {
  const user = useAppStore(s => s.user);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [kycReqs, setKycReqs] = useState<AdminKYC[]>([]);
  const [transactions, setTransactions] = useState<AdminTx[]>([]);
  const [goldPrices, setGoldPrices] = useState<GoldPrices | null>(null);
  const [prevGoldPrice, setPrevGoldPrice] = useState<number | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [pendingLoans, setPendingLoans] = useState(0);
  const [loading, setLoading] = useState(true);
  const [systemInfo, setSystemInfo] = useState<{
    cpu: { cores: number; model: string; usage: number };
    memory: { total: number; used: number; free: number; percent: number; totalFormatted: string; usedFormatted: string; freeFormatted: string };
    disk: { total: number; free: number; percent: number; freeFormatted: string };
    uptime: { days: number; hours: number; minutes: number; formatted: string };
    node: string;
    platform: string;
    dbSize: string;
    pid: number;
  } | null>(null);

  /* ── Data Fetchers ── */
  const fetchDashboardData = useCallback(async () => {
    try {
      const [u, k, t, g, a, loansData, sysInfo] = await Promise.all([
        fetch('/api/admin/users?limit=200').then(r => r.ok ? r.json().then(d => Array.isArray(d.users) ? d.users : []) : []),
        fetch('/api/admin/kyc').then(r => r.ok ? r.json().then(d => Array.isArray(d) ? d : d.requests || []) : []),
        fetch('/api/admin/transactions?limit=200').then(r => r.ok ? r.json().then(d => Array.isArray(d.transactions) ? d.transactions : []) : []),
        fetch('/api/gold/prices').then(r => r.ok ? r.json().then(d => d.prices || null) : null),
        fetch('/api/admin/alerts').then(r => r.ok ? r.json().then(d => Array.isArray(d.alerts) ? d.alerts : []) : []),
        fetch('/api/admin/loans?status=pending').then(r => r.ok ? r.json().then(d => d.loans?.length || 0) : 0),
        fetch('/api/admin/system').then(r => r.ok ? r.json().then(d => d.data || null) : null),
      ]);
      setUsers(u); setKycReqs(k); setTransactions(t);
      if (g) {
        setPrevGoldPrice(prev => prev ?? g.market);
        setGoldPrices(g);
      }
      setAlerts(a);
      setPendingLoans(loansData);
      if (sysInfo) setSystemInfo(sysInfo);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  /* ── Auto-refresh gold prices every 30 seconds ── */
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await fetch('/api/gold/prices').then(r => r.ok ? r.json() : null);
        if (data?.prices) {
          setPrevGoldPrice(goldPrices?.market ?? data.prices.market);
          setGoldPrices(data.prices);
        }
      } catch { /* ignore */ }
    }, 30000);
    return () => clearInterval(interval);
  }, [goldPrices]);

  /* ── Derived data ── */
  const pendingKYC = kycReqs.filter(k => k.status === 'pending').length;
  const pendingWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending').length;

  const onlineUsers = users.filter(u => {
    if (!u.lastLoginAt) return false;
    return (Date.now() - new Date(u.lastLoginAt).getTime()) < 60 * 60 * 1000;
  }).length;

  /* ── Chart data: daily transaction counts last 7 days ── */
  const chartData = getLast7DaysData().map(day => {
    const count = transactions.filter(tx => {
      const txDate = new Date(tx.createdAt);
      return txDate.toDateString() === day.date.toDateString();
    }).length;
    return { ...day, count };
  });
  const maxChartValue = Math.max(...chartData.map(d => d.count), 1);

  /* ── Stats ── */
  const stats = [
    { label: 'کل کاربران', value: users.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/15' },
    { label: 'KYC معلق', value: pendingKYC, icon: Shield, color: 'text-amber-500', bg: 'bg-amber-500/15' },
    { label: 'تراکنش‌ها', value: transactions.length, icon: ArrowUpDown, color: 'text-emerald-500', bg: 'bg-emerald-500/15' },
    { label: 'برداشت معلق', value: pendingWithdrawals, icon: CreditCard, color: 'text-red-500', bg: 'bg-red-500/15' },
  ];

  /* ── Quick Actions ── */
  const quickActions = [
    { label: 'بررسی KYC', icon: Shield, page: 'kyc' as const, count: pendingKYC },
    { label: 'پردازش برداشت', icon: CreditCard, page: 'transactions' as const, count: pendingWithdrawals },
    { label: 'بروزرسانی قیمت', icon: TrendingUp, page: 'prices' as const },
    { label: 'مدیریت وام', icon: Banknote, page: 'loans' as const },
  ];

  /* ── Pending Tasks ── */
  const pendingTasks = [
    { label: 'KYC معلق', count: pendingKYC, page: 'kyc' as const, color: 'bg-amber-500', icon: FileWarning },
    { label: 'برداشت معلق', count: pendingWithdrawals, page: 'transactions' as const, color: 'bg-red-500', icon: Wallet },
    { label: 'وام معلق', count: pendingLoans, page: 'loans' as const, color: 'bg-blue-500', icon: Banknote },
  ];

  /* ── Alert icon / color map ── */
  const alertStyle: Record<string, { icon: typeof Info; color: string; bg: string; border: string }> = {
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    info:    { icon: Info,         color: 'text-blue-500',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
    success: { icon: CheckCircle,  color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    error:   { icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
  };

  const goldChange = prevGoldPrice && goldPrices ? goldPrices.market - prevGoldPrice : 0;
  const goldChangePercent = prevGoldPrice && prevGoldPrice > 0 ? (goldChange / prevGoldPrice) * 100 : 0;
  const isGoldUp = goldChange >= 0;

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ══════════════════════════════════════════════════════════════
          1. WELCOME SECTION
         ══════════════════════════════════════════════════════════════ */}
      <Card className="glass-gold overflow-hidden">
        <CardContent className="p-0">
          <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Gold decorative glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center border border-gold/20">
                <Crown className="size-7 text-gold" />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {getGreeting()}،{' '}
                  <span className="gold-gradient-text">
                    {user?.fullName || user?.phone || 'مدیر'}
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">{getPersianToday()}</p>
              </div>
            </div>

            {/* Online users indicator */}
            <div className="relative flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex size-2.5">
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                <span className="relative rounded-full size-2.5 bg-emerald-500" />
              </span>
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {onlineUsers.toLocaleString('fa-IR')} کاربر آنلاین
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════
          2. GOLD PRICE TICKER + PENDING TASKS ROW
         ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Gold Price Ticker */}
        <Card className="lg:col-span-2 ticker-gold-glow border-gold/25 hover-lift-sm">
          <CardContent className="p-0">
            <div className="relative px-5 py-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-gradient-to-br from-gold/25 to-gold/10 flex items-center justify-center">
                    <DollarSign className="size-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      قیمت لحظه‌ای طلا
                      {goldPrices?.isManual && (
                        <Badge variant="outline" className="text-[9px] border-gold/30 text-gold px-1.5">دستی</Badge>
                      )}
                    </h3>
                    {goldPrices && (
                      <p className="text-[10px] text-muted-foreground">
                        آخرین بروزرسانی: {new Date(goldPrices.updatedAt).toLocaleTimeString('fa-IR')}
                      </p>
                    )}
                  </div>
                </div>
                {goldPrices && (
                  <div className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                    isGoldUp ? 'text-emerald-600 bg-emerald-500/10' : 'text-red-600 bg-red-500/10'
                  )}>
                    {isGoldUp ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                    <span>{Math.abs(goldChangePercent).toFixed(2)}٪</span>
                  </div>
                )}
              </div>

              {/* Price Grid */}
              {goldPrices ? (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'قیمت خرید', value: goldPrices.buy, icon: ArrowDownRight, color: 'text-emerald-500' },
                    { label: 'قیمت فروش', value: goldPrices.sell, icon: ArrowUpRight, color: 'text-red-400' },
                    { label: 'قیمت بازار', value: goldPrices.market, icon: BarChart3, color: 'text-gold' },
                  ].map(item => (
                    <div key={item.label} className="text-center p-3 rounded-xl bg-muted/50 border border-border/50">
                      <div className="flex items-center justify-center gap-1 mb-1.5">
                        <item.icon className={cn('size-3.5', item.color)} />
                        <span className="text-[11px] text-muted-foreground">{item.label}</span>
                      </div>
                      <p className="text-sm font-bold gold-gradient-text tabular-nums">
                        {formatPriceShort(item.value)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">واحد داخلی</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
                  در حال بارگذاری...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks Summary */}
        <Card className="card-spotlight">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <HourglassIcon className="size-4 text-gold" />
              کارهای معلق
            </h3>
            <div className="space-y-2">
              {pendingTasks.map(task => {
                const Icon = task.icon;
                const hasPending = task.count > 0;
                return (
                  <button
                    key={task.label}
                    onClick={() => hasPending && useAppStore.getState().setAdminPage(task.page)}
                    disabled={!hasPending}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-xl transition-all',
                      hasPending
                        ? 'hover:bg-muted/60 cursor-pointer border border-border/50 hover:border-gold/20'
                        : 'opacity-40 cursor-default bg-muted/30'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('size-9 rounded-lg flex items-center justify-center', `${task.color}/15`)}>
                        <Icon className={cn('size-4', task.color.replace('bg-', 'text-'))} />
                      </div>
                      <span className="text-sm font-medium">{task.label}</span>
                    </div>
                    {hasPending && (
                      <Badge className={cn('text-[11px] font-bold px-2 py-0.5', task.color, 'text-white')}>
                        {task.count.toLocaleString('fa-IR')}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          3. STATS CARDS (existing)
         ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="card-spotlight hover-lift-sm">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                    <p className="text-2xl font-bold gold-gradient-text">{s.value.toLocaleString('fa-IR')}</p>
                  </div>
                  <div className={cn('size-11 rounded-xl flex items-center justify-center', s.bg)}>
                    <Icon className={cn('size-5', s.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          4. QUICK ACTIONS (existing)
         ══════════════════════════════════════════════════════════════ */}
      <Card className="glass-gold">
        <CardContent className="p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Zap className="size-4 text-gold" />
            اقدامات سریع
          </h3>
          <div className="flex flex-wrap gap-2">
            {quickActions.map(a => {
              const Icon = a.icon;
              return (
                <Button
                  key={a.label}
                  variant="outline"
                  size="sm"
                  onClick={() => useAppStore.getState().setAdminPage(a.page)}
                  className="border-gold/20 hover:bg-gold/10 hover:border-gold/40 text-gold transition-all"
                >
                  <Icon className="size-4 ml-1.5" />
                  {a.label}
                  {a.count ? (
                    <Badge className="mr-2 bg-gold/20 text-gold text-[10px] px-1.5">{a.count}</Badge>
                  ) : null}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════
          5. ACTIVITY CHART + ALERT FEED (new)
         ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Activity Chart */}
        <Card className="card-spotlight">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="size-4 text-gold" />
              تراکنش‌های ۷ روز اخیر
              <Badge variant="outline" className="border-gold/20 text-gold text-[10px] mr-auto">
                {transactions.length.toLocaleString('fa-IR')} تراکنش
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-44 px-1">
              {chartData.map((day, i) => {
                const height = maxChartValue > 0 ? (day.count / maxChartValue) * 100 : 0;
                const isToday = i === chartData.length - 1;
                return (
                  <div key={day.label} className="flex flex-col items-center gap-1.5 flex-1">
                    <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                      {day.count > 0 ? day.count.toLocaleString('fa-IR') : ''}
                    </span>
                    <div className="w-full flex justify-center" style={{ height: '120px' }}>
                      <div className="w-full max-w-[36px] rounded-t-lg overflow-hidden flex items-end" style={{ height: '100%' }}>
                        <div
                          className={cn(
                            'w-full rounded-t-lg transition-all duration-700 ease-out',
                            isToday
                              ? 'bg-gradient-to-t from-gold-dark via-gold to-gold-light'
                              : 'bg-gradient-to-t from-gold/40 via-gold/60 to-gold/30'
                          )}
                          style={{ height: `${Math.max(height, 4)}%` }}
                        />
                      </div>
                    </div>
                    <span className={cn(
                      'text-[10px]',
                      isToday ? 'font-bold text-gold' : 'text-muted-foreground'
                    )}>
                      {day.label.slice(0, 2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Alert / Notification Feed */}
        <Card className="card-spotlight">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="size-4 text-gold" />
              هشدارهای سیستم
              <Badge variant="outline" className="border-gold/20 text-gold text-[10px] mr-auto">
                {alerts.length} هشدار
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-80">
              <div className="space-y-2">
                {alerts.slice(0, 5).map(alert => {
                  const style = alertStyle[alert.type] || alertStyle.info;
                  const AlertIcon = style.icon;
                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-xl border transition-colors',
                        style.bg, style.border,
                        alert.page && 'cursor-pointer hover:bg-muted/40'
                      )}
                      onClick={() => alert.page && useAppStore.getState().setAdminPage(alert.page)}
                    >
                      <AlertIcon className={cn('size-4 mt-0.5 shrink-0', style.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold">{alert.title}</p>
                          <span className="text-[9px] text-muted-foreground mr-auto whitespace-nowrap">
                            {getTimeAgo(alert.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{alert.message}</p>
                      </div>
                    </div>
                  );
                })}
                {alerts.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="size-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">هیچ هشدار فعالی وجود ندارد</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            {alerts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-gold hover:bg-gold/10 text-xs"
                onClick={() => useAppStore.getState().setAdminPage('tickets')}
              >
                مشاهده همه هشدارها
                <ArrowUpRight className="size-3.5 mr-1.5 rotate-180" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          6. RECENT USERS + RECENT TRANSACTIONS (existing)
         ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Users */}
        <Card className="card-spotlight">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="size-4 text-gold" />
              آخرین کاربران
              <Badge variant="outline" className="border-gold/20 text-gold text-[10px] mr-auto">
                {users.length} نفر
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-80">
              <div className="space-y-2">
                {users.slice(0, 10).map(u => (
                  <div key={u.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-gold/15 flex items-center justify-center text-xs font-bold text-gold">
                        {(u.fullName || u.phone).charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.fullName || 'بدون نام'}</p>
                        <p className="text-[11px] text-muted-foreground" dir="ltr">{u.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn('text-[10px]', u.role !== 'user' && 'border-gold/30 text-gold')}>
                        {u.role === 'super_admin' ? 'مدیر ارشد' : u.role === 'admin' ? 'مدیر' : 'کاربر'}
                      </Badge>
                      {u.isVerified ? <CheckCircle className="size-3 text-emerald-500" /> : <Clock className="size-3 text-amber-500" />}
                    </div>
                  </div>
                ))}
                {users.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">کاربری یافت نشد</p>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="card-spotlight">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowUpDown className="size-4 text-gold" />
              آخرین تراکنش‌ها
              <Badge variant="outline" className="border-gold/20 text-gold text-[10px] mr-auto">
                {transactions.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-80">
              <div className="space-y-2">
                {transactions.slice(0, 10).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'size-9 rounded-full flex items-center justify-center',
                        tx.type === 'buy_gold' ? 'bg-emerald-500/15' : tx.type === 'sell_gold' ? 'bg-red-500/15' : 'bg-gold/15'
                      )}>
                        {tx.type === 'buy_gold' ? <TrendingUp className="size-4 text-emerald-500" /> :
                         tx.type === 'sell_gold' ? <TrendingUp className="size-4 text-red-500" /> :
                         <DollarSign className="size-4 text-gold" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{getTransactionTypeLabel(tx.type)}</p>
                        <p className="text-[11px] text-muted-foreground">{tx.user?.phone || '---'}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold">{tx.amountGold > 0 ? `${tx.amountGold.toFixed(4)} گرم` : tx.amountFiat > 0 ? formatPriceShort(tx.amountFiat) : '-'}</p>
                      <p className="text-[10px] text-muted-foreground">{getTimeAgo(tx.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">تراکنشی یافت نشد</p>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          8. SERVER RESOURCES MONITOR (new)
         ══════════════════════════════════════════════════════════════ */}
      {systemInfo && (
        <Card className="glass-gold overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Cpu className="size-4 text-gold" />
                منابع سرور
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Globe className="size-3" />
                <span>{systemInfo.node}</span>
                <span className="mx-1 opacity-30">|</span>
                <span>PID: {systemInfo.pid}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CPU Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-gold/10 flex items-center justify-center">
                      <Cpu className="size-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">پردازنده</p>
                      <p className="text-[10px] text-muted-foreground">{systemInfo.cpu.cores} هسته</p>
                    </div>
                  </div>
                  <span className={cn(
                    'text-sm font-bold tabular-nums',
                    systemInfo.cpu.usage > 80 ? 'text-red-500' :
                    systemInfo.cpu.usage > 50 ? 'text-amber-500' : 'text-emerald-500'
                  )}>
                    {systemInfo.cpu.usage}٪
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-1000',
                      systemInfo.cpu.usage > 80 ? 'bg-gradient-to-l from-red-500 to-red-400' :
                      systemInfo.cpu.usage > 50 ? 'bg-gradient-to-l from-amber-500 to-amber-400' :
                      'bg-gradient-to-l from-emerald-500 to-emerald-400'
                    )}
                    style={{ width: `${Math.min(systemInfo.cpu.usage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Memory Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <MemoryStick className="size-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">حافظه RAM</p>
                      <p className="text-[10px] text-muted-foreground">{systemInfo.memory.usedFormatted} / {systemInfo.memory.totalFormatted}</p>
                    </div>
                  </div>
                  <span className={cn(
                    'text-sm font-bold tabular-nums',
                    systemInfo.memory.percent > 80 ? 'text-red-500' :
                    systemInfo.memory.percent > 50 ? 'text-amber-500' : 'text-emerald-500'
                  )}>
                    {systemInfo.memory.percent}٪
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-1000',
                      systemInfo.memory.percent > 80 ? 'bg-gradient-to-l from-red-500 to-red-400' :
                      systemInfo.memory.percent > 50 ? 'bg-gradient-to-l from-amber-500 to-amber-400' :
                      'bg-gradient-to-l from-blue-500 to-blue-400'
                    )}
                    style={{ width: `${Math.min(systemInfo.memory.percent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Disk Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <HardDrive className="size-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">فضای دیسک</p>
                      <p className="text-[10px] text-muted-foreground">آزاد: {systemInfo.disk.freeFormatted}</p>
                    </div>
                  </div>
                  <span className={cn(
                    'text-sm font-bold tabular-nums',
                    systemInfo.disk.percent > 80 ? 'text-red-500' :
                    systemInfo.disk.percent > 50 ? 'text-amber-500' : 'text-emerald-500'
                  )}>
                    {systemInfo.disk.percent}٪
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-1000',
                      systemInfo.disk.percent > 80 ? 'bg-gradient-to-l from-red-500 to-red-400' :
                      systemInfo.disk.percent > 50 ? 'bg-gradient-to-l from-amber-500 to-amber-400' :
                      'bg-gradient-to-l from-purple-500 to-purple-400'
                    )}
                    style={{ width: `${Math.min(systemInfo.disk.percent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Uptime & DB Size */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Layers className="size-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">آپتایم سرور</p>
                    <p className="text-[10px] text-muted-foreground">{systemInfo.uptime.formatted}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Database className="size-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">حجم دیتابیس</p>
                    <p className="text-[10px] text-muted-foreground">{systemInfo.dbSize}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

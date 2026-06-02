'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  BellRing,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Coins,
  Sparkles,
  Edit3,
  Activity,
  BarChart3,
  AlertTriangle,
  Clock,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { cn, formatNumber, formatToman, getTimeAgo } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface PriceAlertItem {
  id: string;
  userId: string;
  type: string;
  condition: string;
  targetPrice: number;
  isActive: boolean;
  isTriggered: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TechnicalIndicator {
  name: string;
  value: string;
  signal: 'buy' | 'sell' | 'neutral';
  description: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Technical Indicators                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const TECHNICAL_INDICATORS: TechnicalIndicator[] = [
  { name: 'RSI (۱۴)', value: '۵۸.۳', signal: 'buy', description: 'شاخص قدرت نسبی — فاصله تا اشباع خرید' },
  { name: 'MACD', value: '+۱۲۵', signal: 'buy', description: 'همگرایی-واگرایی میانگین متحرک — سیگنال صعودی' },
  { name: 'EMA ۲۰', value: '۳۳,۸۵۰,۰۰۰', signal: 'buy', description: 'میانگین متحرک نمایی ۲۰ روزه — قیمت بالاتر' },
  { name: 'Bollinger', value: 'بالا', signal: 'neutral', description: 'باندهای بولینگر — قیمت نزدیک باند بالایی' },
  { name: 'Stochastic', value: '۷۲.۱', signal: 'neutral', description: 'استوکاستیک — منطقه خنثی' },
  { name: 'ADX', value: '۲۸.۴', signal: 'buy', description: 'شاخص میانگین جهت‌دار — روند صعودی قوی' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SVG Mini Gauge Component                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MiniGauge({ value, max, color, size = 60 }: { value: number; max: number; color: string; size?: number }) {
  const pct = Math.min(value / max, 1);
  const r = (size - 8) / 2;
  const circumference = Math.PI * r;
  const arcLength = pct * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size / 2 + 4} viewBox={`0 0 ${size} ${size / 2 + 4}`}>
      <path
        d={`M ${4} ${center} A ${r} ${r} 0 0 1 ${size - 4} ${center}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinecap="round"
        className="text-muted/20"
      />
      <path
        d={`M ${4} ${center} A ${r} ${r} 0 0 1 ${size - 4} ${center}`}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={`${arcLength} ${circumference}`}
        className="transition-all duration-700"
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SmartAlertsPage() {
  const { user, addToast } = useAppStore();
  const [alerts, setAlerts] = useState<PriceAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<PriceAlertItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [goldType, setGoldType] = useState<'gram' | 'coin' | 'mithqal'>('gram');
  const [direction, setDirection] = useState<'above' | 'below' | 'crosses'>('above');
  const [targetPrice, setTargetPrice] = useState('');

  /* ── Fetch Alerts ── */
  const fetchAlerts = useCallback(async () => {
    const uid = user?.id || 'dev-super-admin';
    try {
      setLoading(true);
      const res = await fetch(`/api/alerts?userId=${uid}`);
      const data = await res.json();
      if (data.success) {
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('[PriceAlerts] Fetch error:', err);
      // Mock data fallback
      setAlerts([
        { id: '1', userId: uid, type: 'buy', condition: 'above', targetPrice: 38000000, isActive: true, isTriggered: false, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
        { id: '2', userId: uid, type: 'sell', condition: 'below', targetPrice: 32000000, isActive: true, isTriggered: false, createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString() },
        { id: '3', userId: uid, type: 'buy', condition: 'above', targetPrice: 35000000, isActive: false, isTriggered: true, createdAt: new Date(Date.now() - 604800000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  /* ── Create/Update Alert ── */
  const handleSave = async () => {
    const uid = user?.id || 'dev-super-admin';
    const price = Number(targetPrice);
    if (!price || price < 1000000) {
      addToast('قیمت هدف باید حداقل ۱,۰۰۰,۰۰۰ تومان باشد', 'error');
      return;
    }
    setSubmitting(true);
    try {
      if (editingAlert) {
        // Update existing alert via DELETE + CREATE
        await fetch(`/api/alerts/${editingAlert.id}?userId=${uid}`, { method: 'DELETE' });
        const res = await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: uid,
            type: direction === 'above' ? 'sell' : 'buy',
            condition: direction === 'crosses' ? 'above' : direction,
            targetPrice: price,
          }),
        });
        const data = await res.json();
        if (data.success) {
          addToast('هشدار با موفقیت ویرایش شد', 'success');
        } else {
          addToast(data.message || 'خطا در ویرایش هشدار', 'error');
        }
      } else {
        const res = await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: uid,
            type: direction === 'above' ? 'sell' : 'buy',
            condition: direction === 'crosses' ? 'above' : direction,
            targetPrice: price,
          }),
        });
        const data = await res.json();
        if (data.success) {
          addToast('هشدار قیمت با موفقیت ایجاد شد', 'success');
        } else {
          addToast(data.message || 'خطا در ایجاد هشدار', 'error');
        }
      }
      setDialogOpen(false);
      setEditingAlert(null);
      resetForm();
      fetchAlerts();
    } catch {
      addToast('خطا در ذخیره هشدار', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete Alert ── */
  const handleDelete = async (id: string) => {
    const uid = user?.id || 'dev-super-admin';
    try {
      const res = await fetch(`/api/alerts/${id}?userId=${uid}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success || data.message) {
        addToast(data.message || 'هشدار حذف شد', 'info');
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      } else {
        addToast('خطا در حذف هشدار', 'error');
      }
    } catch {
      addToast('خطا در حذف هشدار', 'error');
    }
  };

  /* ── Edit Alert ── */
  const handleEdit = (alert: PriceAlertItem) => {
    setEditingAlert(alert);
    setTargetPrice(alert.targetPrice.toString());
    setDirection(alert.condition as 'above' | 'below' | 'crosses');
    setGoldType('gram');
    setDialogOpen(true);
  };

  const resetForm = () => {
    setTargetPrice('');
    setDirection('above');
    setGoldType('gram');
    setEditingAlert(null);
  };

  /* ── Categorized Alerts ── */
  const activeAlerts = alerts.filter((a) => a.isActive && !a.isTriggered);
  const triggeredAlerts = alerts.filter((a) => a.isTriggered);
  const expiredAlerts = alerts.filter((a) => !a.isActive && !a.isTriggered);

  /* ── Signal Color Helper ── */
  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'buy': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'sell': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    }
  };

  const getSignalLabel = (signal: string) => {
    switch (signal) {
      case 'buy': return 'خرید';
      case 'sell': return 'فروش';
      default: return 'خنثی';
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#D4AF37]/10">
            <BellRing className="size-5 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">هشدار قیمت هوشمند</h1>
            <p className="text-xs text-muted-foreground">از تغییرات قیمت طلا مطلع شوید</p>
          </div>
        </div>
        <Button
          onClick={() => { resetForm(); setDialogOpen(true); }}
          className="gap-1.5 bg-[#D4AF37] hover:bg-[#E5C249] text-[#1a1a1a]"
          size="sm"
        >
          <Plus className="size-4" />
          هشدار جدید
        </Button>
      </div>

      {/* ── Tabs: Alerts & Technical Analysis ── */}
      <Tabs defaultValue="alerts">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="alerts" className="text-xs">
            <Bell className="size-3.5 me-1" />
            هشدارها
          </TabsTrigger>
          <TabsTrigger value="technical" className="text-xs">
            <Activity className="size-3.5 me-1" />
            تحلیل تکنیکال
          </TabsTrigger>
        </TabsList>

        {/* ── Alerts Tab ── */}
        <TabsContent value="alerts" className="space-y-4 mt-4">
          {/* Active Alerts */}
          <Card className="overflow-hidden border-[#D4AF37]/15">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="size-4 text-amber-500" />
                هشدارهای فعال
                <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/20 text-[10px]">
                  {activeAlerts.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : activeAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="size-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">هشدار فعالی ندارید</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    با ایجاد هشدار، از تغییرات قیمت مطلع شوید
                  </p>
                </div>
              ) : (
                activeAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} onDelete={handleDelete} onEdit={handleEdit} status="active" />
                ))
              )}
            </CardContent>
          </Card>

          {/* Triggered Alerts (Green) */}
          {triggeredAlerts.length > 0 && (
            <Card className="overflow-hidden border-emerald-500/20 bg-emerald-500/[0.03]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="size-4" />
                  هشدارهای فعال‌شده
                  <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20 text-[10px]">
                    {triggeredAlerts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {triggeredAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} onDelete={handleDelete} onEdit={handleEdit} status="triggered" />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Expired/Inactive Alerts (Red) */}
          {expiredAlerts.length > 0 && (
            <Card className="overflow-hidden border-red-500/20 bg-red-500/[0.03]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                  <XCircle className="size-4" />
                  هشدارهای منقضی
                  <Badge className="bg-red-500/15 text-red-500 border-red-500/20 text-[10px]">
                    {expiredAlerts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {expiredAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} onDelete={handleDelete} onEdit={handleEdit} status="expired" />
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Technical Analysis Tab ── */}
        <TabsContent value="technical" className="space-y-4 mt-4">
          {/* Summary Gauge */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Gauge className="size-4 text-[#D4AF37]" />
                وضعیت کلی بازار
              </CardTitle>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                صعودی
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-6">
                <MiniGauge value={72} max={100} color="#10b981" size={80} />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-muted-foreground">سیگنال خرید:</span>
                    <span className="text-xs font-bold text-emerald-500">۴ شاخص</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-amber-500" />
                    <span className="text-xs text-muted-foreground">سیگنال خنثی:</span>
                    <span className="text-xs font-bold text-amber-500">۲ شاخص</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-red-500" />
                    <span className="text-xs text-muted-foreground">سیگنال فروش:</span>
                    <span className="text-xs font-bold text-red-500">۰ شاخص</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual Indicators */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="size-4 text-[#D4AF37]" />
                شاخص‌های تکنیکال
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {TECHNICAL_INDICATORS.map((ind, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-border/50 p-3 transition-colors hover:bg-muted/30"
                >
                  <div className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg border text-xs font-bold',
                    getSignalColor(ind.signal),
                  )}>
                    {ind.signal === 'buy' ? <ArrowUpRight className="size-4" /> :
                     ind.signal === 'sell' ? <ArrowDownRight className="size-4" /> :
                     <Activity className="size-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{ind.name}</span>
                      <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0', getSignalColor(ind.signal))}>
                        {getSignalLabel(ind.signal)}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{ind.description}</p>
                  </div>
                  <span className="text-xs font-bold tabular-nums text-foreground shrink-0">
                    {ind.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* RSI Detail Card */}
          <Card className="overflow-hidden border-emerald-500/20 bg-emerald-500/[0.03]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15">
                  <Activity className="size-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">RSI (شاخص قدرت نسبی)</p>
                  <p className="text-[10px] text-muted-foreground">محدوده: ۳۰ (اشباع فروش) — ۷۰ (اشباع خرید)</p>
                </div>
              </div>
              {/* RSI Bar */}
              <div className="relative h-4 rounded-full bg-muted overflow-hidden">
                <div className="absolute inset-y-0 start-[30%] end-0 bg-emerald-500/20" />
                <div className="absolute inset-y-0 start-[70%] end-0 bg-red-500/20" />
                <div
                  className="absolute top-0 start-[30%] h-full w-px bg-emerald-500/40"
                />
                <div
                  className="absolute top-0 start-[70%] h-full w-px bg-red-500/40"
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 size-4 rounded-full bg-emerald-500 border-2 border-background shadow-md transition-all duration-700"
                  style={{ left: '58.3%' }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                <span>۳۰</span>
                <span className="font-bold text-emerald-500">۵۸.۳ (فعلی)</span>
                <span>۷۰</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                مقدار RSI در محدوده صعودی قرار دارد. فاصله تا منطقه اشباع خرید ۱۱.۷ واحد است.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Create/Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Sparkles className="size-5 text-[#D4AF37]" />
              {editingAlert ? 'ویرایش هشدار' : 'هشدار قیمت جدید'}
            </DialogTitle>
            <DialogDescription>
              {editingAlert ? 'تغییرات هشدار قیمت را اعمال کنید' : 'هشدار هوشمند برای رصد قیمت طلا ایجاد کنید'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Gold type selector */}
            <div className="space-y-1.5">
              <Label>نوع طلا</Label>
              <Select value={goldType} onValueChange={(v) => setGoldType(v as 'gram' | 'coin' | 'mithqal')}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gram">
                    <span className="flex items-center gap-2">
                      <Coins className="size-4 text-[#D4AF37]" />
                      طلای آب‌شده (گرم)
                    </span>
                  </SelectItem>
                  <SelectItem value="coin">
                    <span className="flex items-center gap-2">
                      <Sparkles className="size-4 text-[#D4AF37]" />
                      سکه
                    </span>
                  </SelectItem>
                  <SelectItem value="mithqal">
                    <span className="flex items-center gap-2">
                      <Sparkles className="size-4 text-[#D4AF37]" />
                      مثقال
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Direction toggle - 3 options */}
            <div className="space-y-1.5">
              <Label>شرط هشدار</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('above')}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all',
                    direction === 'above'
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600'
                      : 'border-border hover:border-emerald-500/30 text-muted-foreground'
                  )}
                >
                  <TrendingUp className="size-4" />
                  بالاتر از
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('below')}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all',
                    direction === 'below'
                      ? 'border-red-500/50 bg-red-500/10 text-red-600'
                      : 'border-border hover:border-red-500/30 text-muted-foreground'
                  )}
                >
                  <TrendingDown className="size-4" />
                  پایین‌تر از
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('crosses')}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all',
                    direction === 'crosses'
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-600'
                      : 'border-border hover:border-amber-500/30 text-muted-foreground'
                  )}
                >
                  <Activity className="size-4" />
                  عبور از
                </button>
              </div>
            </div>

            {/* Target price input */}
            <div className="space-y-1.5">
              <Label>قیمت هدف (تومان)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="مثلاً ۴۰,۰۰۰,۰۰۰"
                  className="rounded-xl text-left tabular-nums pr-16"
                  dir="ltr"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  تومان
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDialogOpen(false); resetForm(); }}
              className="rounded-xl"
            >
              انصراف
            </Button>
            <Button
              onClick={handleSave}
              disabled={submitting || !targetPrice}
              className="gap-1.5 bg-[#D4AF37] hover:bg-[#E5C249] text-[#1a1a1a] rounded-xl"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {editingAlert ? 'ذخیره تغییرات' : 'ایجاد هشدار'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Alert Card Sub-component with color-coding                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function AlertCard({
  alert,
  onDelete,
  onEdit,
  status,
}: {
  alert: PriceAlertItem;
  onDelete: (id: string) => void;
  onEdit: (alert: PriceAlertItem) => void;
  status: 'active' | 'triggered' | 'expired';
}) {
  const isAbove = alert.condition === 'above';

  const statusStyles = {
    active: 'border-amber-500/20 bg-amber-500/[0.03] hover:border-[#D4AF37]/20',
    triggered: 'border-emerald-500/20 bg-emerald-500/[0.03]',
    expired: 'border-red-500/15 bg-red-500/[0.02] opacity-70',
  };

  const statusIcons = {
    active: <Bell className="size-4 text-amber-500" />,
    triggered: <CheckCircle className="size-4 text-emerald-500" />,
    expired: <XCircle className="size-4 text-red-400" />,
  };

  const statusBadge = {
    active: null,
    triggered: (
      <Badge className="bg-emerald-500/15 text-emerald-500 text-[9px] px-1.5 py-0 border-emerald-500/20">
        فعال‌شده
      </Badge>
    ),
    expired: (
      <Badge className="bg-red-500/15 text-red-500 text-[9px] px-1.5 py-0 border-red-500/20">
        منقضی
      </Badge>
    ),
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3 transition-all',
        statusStyles[status],
      )}
    >
      {/* Icon */}
      <div className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-xl',
        status === 'active' ? (isAbove ? 'bg-emerald-500/10' : 'bg-red-500/10') :
        status === 'triggered' ? 'bg-emerald-500/15' : 'bg-red-500/10',
      )}>
        {status === 'triggered' ? (
          <CheckCircle className="size-4 text-emerald-500" />
        ) : isAbove ? (
          <TrendingUp className="size-4 text-emerald-500" />
        ) : (
          <TrendingDown className="size-4 text-red-500" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {isAbove ? 'بالاتر از' : 'پایین‌تر از'}
          </span>
          <span className="text-sm font-bold tabular-nums text-[#D4AF37]">
            {formatNumber(alert.targetPrice)}
          </span>
          <span className="text-[10px] text-muted-foreground">تومان</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {statusBadge[status]}
          <span className="text-[10px] text-muted-foreground">
            {getTimeAgo(alert.createdAt)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {status === 'active' && (
          <button
            onClick={() => onEdit(alert)}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-colors"
            title="ویرایش"
          >
            <Edit3 className="size-3.5" />
          </button>
        )}
        <button
          onClick={() => onDelete(alert.id)}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
          title="حذف"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

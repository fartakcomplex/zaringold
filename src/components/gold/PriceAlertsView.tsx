'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import {
  Bell,
  BellRing,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Coins,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatToman(n: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(n));
}

function toPersianDigits(str: string): string {
  const p = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/\d/g, (d) => p[parseInt(d)]);
}

function getRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'همین الان';
  if (diffMin < 60) return toPersianDigits(`${diffMin} دقیقه پیش`);
  if (diffHr < 24) return toPersianDigits(`${diffHr} ساعت پیش`);
  if (diffDay < 7) return toPersianDigits(`${diffDay} روز پیش`);
  return toPersianDigits(new Date(dateStr).toLocaleDateString('fa-IR'));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PriceAlertsView() {
  const { user, addToast } = useAppStore();
  const { t, dir } = useTranslation();

  const [alerts, setAlerts] = useState<PriceAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [goldType, setGoldType] = useState<'gram' | 'coin'>('gram');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState('');

  /* ── Fetch Alerts ── */
  const fetchAlerts = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/alerts/price?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('[PriceAlerts] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  /* ── Create Alert ── */
  const handleCreate = async () => {
    if (!user?.id) return;
    const price = Number(targetPrice);
    if (!price || price < 1000000) {
      addToast('قیمت هدف باید حداقل ۱,۰۰۰,۰۰۰ تومان باشد', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/alerts/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          targetPrice: price,
          direction,
          goldType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message, 'success');
        setDialogOpen(false);
        setTargetPrice('');
        setDirection('above');
        setGoldType('gram');
        fetchAlerts();
      } else {
        addToast(data.message, 'error');
      }
    } catch {
      addToast('خطا در ایجاد هشدار', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete Alert ── */
  const handleDelete = async (id: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/alerts/price?id=${id}&userId=${user.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message, 'info');
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      } else {
        addToast(data.message, 'error');
      }
    } catch {
      addToast('خطا در حذف هشدار', 'error');
    }
  };

  /* ── Computed ── */
  const activeAlerts = alerts.filter((a) => a.isActive && !a.isTriggered);
  const triggeredAlerts = alerts.filter((a) => a.isTriggered);
  const inactiveAlerts = alerts.filter((a) => !a.isActive && !a.isTriggered);

  return (
    <div dir={dir} className="space-y-5 pb-20">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gold/15 flex items-center justify-center">
            <BellRing className="size-5 text-gold" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{t('dashboard.priceAlerts')}</h2>
            <p className="text-xs text-muted-foreground">{t('dashboard.priceAlertDesc')}</p>
          </div>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="gap-1.5 bg-gold hover:bg-gold/90 text-[#1a1a1a]"
          size="sm"
        >
          <Plus className="size-4" />
          {t('dashboard.addAlert')}
        </Button>
      </div>

      {/* ─── Active Alerts ─── */}
      <Card className="border-gold/15">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="size-4 text-gold" />
            هشدارهای فعال
            <Badge className="bg-gold/15 text-gold border-gold/20 text-[10px]">
              {activeAlerts.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
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
              <AlertCard
                key={alert.id}
                alert={alert}
                onDelete={handleDelete}
                dir={dir}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* ─── Triggered Alerts ─── */}
      {triggeredAlerts.length > 0 && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
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
              <AlertCard
                key={alert.id}
                alert={alert}
                onDelete={handleDelete}
                dir={dir}
                triggered
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* ─── Create Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="gold-gradient-text text-xl flex items-center gap-2">
              <Sparkles className="size-5 text-gold" />
              {t('dashboard.newAlertTitle')}
            </DialogTitle>
            <DialogDescription>{t('dashboard.newAlertDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Gold type selector */}
            <div className="space-y-1.5">
              <Label>نوع طلا</Label>
              <Select value={goldType} onValueChange={(v) => setGoldType(v as 'gram' | 'coin')}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gram">
                    <span className="flex items-center gap-2">
                      <Coins className="size-4 text-gold" />
                      طلای آب‌شده (گرم)
                    </span>
                  </SelectItem>
                  <SelectItem value="coin">
                    <span className="flex items-center gap-2">
                      <Sparkles className="size-4 text-gold" />
                      سکه
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Direction toggle */}
            <div className="space-y-1.5">
              <Label>شرط هشدار</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('above')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all',
                    direction === 'above'
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600'
                      : 'border-border hover:border-emerald-500/30 text-muted-foreground'
                  )}
                >
                  <TrendingUp className="size-4" />
                  بالاتر از قیمت
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('below')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all',
                    direction === 'below'
                      ? 'border-red-500/50 bg-red-500/10 text-red-600'
                      : 'border-border hover:border-red-500/30 text-muted-foreground'
                  )}
                >
                  <TrendingDown className="size-4" />
                  پایین‌تر از قیمت
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
              onClick={() => setDialogOpen(false)}
              className="rounded-xl"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting || !targetPrice}
              className="gap-1.5 bg-gold hover:bg-gold/90 text-[#1a1a1a] rounded-xl"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              ایجاد هشدار
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Alert Card Sub-component                                           */
/* ------------------------------------------------------------------ */

function AlertCard({
  alert,
  onDelete,
  dir,
  triggered,
}: {
  alert: PriceAlertItem;
  onDelete: (id: string) => void;
  dir: 'rtl' | 'ltr';
  triggered?: boolean;
}) {
  const isAbove = alert.condition === 'above';
  const isBuy = alert.type === 'buy';

  return (
    <div
      dir={dir}
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3 transition-all',
        triggered
          ? 'border-emerald-500/20 bg-emerald-500/5'
          : 'border-border/50 hover:border-gold/20 bg-card'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl',
          triggered
            ? 'bg-emerald-500/15'
            : isAbove
              ? 'bg-emerald-500/10'
              : 'bg-red-500/10'
        )}
      >
        {triggered ? (
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
          <span className="text-sm font-bold tabular-nums gold-gradient-text">
            {formatToman(alert.targetPrice)}
          </span>
          <span className="text-[10px] text-muted-foreground">تومان</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge
            variant="outline"
            className={cn(
              'text-[9px] px-1.5 py-0',
              isBuy
                ? 'border-emerald-500/20 text-emerald-500'
                : 'border-red-500/20 text-red-500'
            )}
          >
            {isBuy ? 'خرید' : 'فروش'}
          </Badge>
          {triggered && (
            <Badge className="bg-emerald-500/15 text-emerald-500 text-[9px] px-1.5 py-0 border-emerald-500/20">
              فعال‌شده
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground">
            {getRelativeTime(alert.createdAt)}
          </span>
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(alert.id)}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
        title="حذف"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

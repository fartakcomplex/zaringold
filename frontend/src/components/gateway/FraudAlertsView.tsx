
import React, { useState, useEffect, useCallback } from 'react';
import {cn} from '@/lib/utils';
import {getTimeAgo} from '@/lib/helpers';
import {useAppStore} from '@/lib/store';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {Switch} from '@/components/ui/switch';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {ShieldAlert, AlertTriangle, AlertCircle, CheckCircle2, Clock, Search, Filter, Eye, ChevronDown, ChevronUp, Zap, Activity, Ban, CreditCard, Bot, Store, Timer, RefreshCw} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RiskEvent {
  id: string;
  paymentId: string | null;
  userId: string | null;
  merchantId: string | null;
  eventType: string;
  riskScore: number;
  details: string | null;
  isResolved: boolean;
  resolveNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  riskLevel: 'high' | 'medium' | 'low';
}

interface FraudStats {
  total: number;
  unresolved: number;
  high: number;
  medium: number;
  low: number;
}

/* ------------------------------------------------------------------ */
/*  Event type config                                                  */
/* ------------------------------------------------------------------ */

const EVENT_TYPE_CONFIG: Record<
  string,
  { labelFa: string; icon: React.ElementType; color: string }
> = {
  rapid_payment: {
    labelFa: 'پرداخت سریع',
    icon: Zap,
    color: 'text-orange-400',
  },
  duplicate_card: {
    labelFa: 'کارت تکراری',
    icon: CreditCard,
    color: 'text-purple-400',
  },
  high_value: {
    labelFa: 'مبلغ بالا',
    icon: AlertTriangle,
    color: 'text-red-400',
  },
  bot_checkout: {
    labelFa: 'ربات',
    icon: Bot,
    color: 'text-cyan-400',
  },
  velocity_exceeded: {
    labelFa: 'سرعت تراکنش',
    icon: Timer,
    color: 'text-amber-400',
  },
  fake_merchant: {
    labelFa: 'فروشگاه مشکوک',
    icon: Store,
    color: 'text-rose-400',
  },
};

/* ------------------------------------------------------------------ */
/*  Risk score badge                                                   */
/* ------------------------------------------------------------------ */

function RiskScoreBadge({ score }: { score: number }) {
  const level =
    score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  const config = {
    high: {
      bg: 'bg-red-500/15 border-red-500/30',
      text: 'text-red-400',
      label: 'بالا',
    },
    medium: {
      bg: 'bg-amber-500/15 border-amber-500/30',
      text: 'text-amber-400',
      label: 'متوسط',
    },
    low: {
      bg: 'bg-emerald-500/15 border-emerald-500/30',
      text: 'text-emerald-400',
      label: 'پایین',
    },
  }[level];

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-bold px-2 py-0.5 border', config.bg, config.text)}
    >
      {score} — {config.label}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ isResolved }: { isResolved: boolean }) {
  return isResolved ? (
    <Badge className="bg-emerald-500/15 text-emerald-400 text-xs border border-emerald-500/30">
      <CheckCircle2 className="size-3 ml-1" />
      حل‌شده
    </Badge>
  ) : (
    <Badge className="bg-red-500/15 text-red-400 text-xs border border-red-500/30">
      <AlertCircle className="size-3 ml-1" />
      حل‌نشده
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  Event type badge                                                   */
/* ------------------------------------------------------------------ */

function EventTypeBadge({ type }: { type: string }) {
  const cfg = EVENT_TYPE_CONFIG[type];
  if (!cfg) {
    return <Badge variant="outline" className="text-xs">{type}</Badge>;
  }
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={cn('text-xs gap-1 border-border/50', cfg.color)}
    >
      <Icon className="size-3" />
      {cfg.labelFa}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="card-gold-border">
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={cn('size-10 rounded-full flex items-center justify-center', iconBg)}>
            <Icon className={cn('size-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Risk Event Row (expandable)                                        */
/* ------------------------------------------------------------------ */

function RiskEventRow({
  event,
  expanded,
  onToggle,
  onResolve,
}: {
  event: RiskEvent;
  expanded: boolean;
  onToggle: () => void;
  onResolve: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border transition-colors',
        event.isResolved
          ? 'border-border/50 bg-muted/20 opacity-70'
          : 'border-border bg-card hover:border-gold/30'
      )}
    >
      {/* Main row */}
      <div
        className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 cursor-pointer"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
      >
        {/* Event type + icon */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={cn(
              'size-9 rounded-lg flex items-center justify-center shrink-0',
              event.riskScore >= 70
                ? 'bg-red-500/15'
                : event.riskScore >= 40
                  ? 'bg-amber-500/15'
                  : 'bg-emerald-500/15'
            )}
          >
            <ShieldAlert
              className={cn(
                'size-4',
                event.riskScore >= 70
                  ? 'text-red-400'
                  : event.riskScore >= 40
                    ? 'text-amber-400'
                    : 'text-emerald-400'
              )}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <EventTypeBadge type={event.eventType} />
              <RiskScoreBadge score={event.riskScore} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {event.merchantId ? `فروشگاه: ${event.merchantId.slice(0, 8)}...` : '—'}
              </span>
              {event.userId && (
                <span className="text-xs text-muted-foreground">
                  کاربر: {event.userId.slice(0, 8)}...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side: timestamp + status */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="size-3" />
            {getTimeAgo(event.createdAt)}
          </span>
          <StatusBadge isResolved={event.isResolved} />

          {/* Expand toggle */}
          <div className="text-muted-foreground">
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4">
          <Separator className="mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">شناسه:</span>
              <p className="font-mono text-xs mt-0.5" dir="ltr">{event.id}</p>
            </div>
            {event.paymentId && (
              <div>
                <span className="text-muted-foreground text-xs">پرداخت:</span>
                <p className="font-mono text-xs mt-0.5" dir="ltr">{event.paymentId}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground text-xs">کاربر:</span>
              <p className="font-mono text-xs mt-0.5" dir="ltr">{event.userId || '—'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">فروشگاه:</span>
              <p className="font-mono text-xs mt-0.5" dir="ltr">{event.merchantId || '—'}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-muted-foreground text-xs">جزئیات:</span>
              <p className="text-xs mt-0.5 bg-muted/50 rounded-lg p-2 whitespace-pre-wrap">
                {event.details || 'بدون توضیحات'}
              </p>
            </div>
            {event.isResolved && event.resolveNote && (
              <div className="sm:col-span-2">
                <span className="text-muted-foreground text-xs">یادداشت حل:</span>
                <p className="text-xs mt-0.5 bg-emerald-500/5 rounded-lg p-2 border border-emerald-500/20 text-emerald-300">
                  {event.resolveNote}
                </p>
              </div>
            )}
            {event.isResolved && event.resolvedAt && (
              <div className="sm:col-span-2">
                <span className="text-muted-foreground text-xs">تاریخ حل:</span>
                <p className="text-xs mt-0.5">{getTimeAgo(event.resolvedAt)}</p>
              </div>
            )}
          </div>

          {/* Resolve action */}
          {!event.isResolved && (
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onResolve(event.id);
                }}
                className="bg-gold text-black hover:bg-gold/90 text-xs"
              >
                <CheckCircle2 className="size-3 ml-1" />
                حل رویداد
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component: FraudAlertsView                                    */
/* ------------------------------------------------------------------ */

export default function FraudAlertsView() {
  const { addToast } = useAppStore();
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [stats, setStats] = useState<FraudStats>({
    total: 0,
    unresolved: 0,
    high: 0,
    medium: 0,
    low: 0,
  });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('unresolved');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Resolve dialog
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolveTargetId, setResolveTargetId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');

  // Auto-resolve toggle
  const [autoResolve, setAutoResolve] = useState(false);

  /* ── Fetch events ── */
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (levelFilter !== 'all') params.set('level', levelFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (autoResolve) params.set('autoResolve', 'true');
      params.set('limit', '100');

      const res = await fetch(`/api/v1/admin/fraud?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        if (data.stats) setStats(data.stats);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [levelFilter, statusFilter, typeFilter, autoResolve]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (levelFilter !== 'all') params.set('level', levelFilter);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (typeFilter !== 'all') params.set('type', typeFilter);
        if (autoResolve) params.set('autoResolve', 'true');
        params.set('limit', '100');

        const res = await fetch(`/api/v1/admin/fraud?${params.toString()}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setEvents(data.events || []);
          if (data.stats) setStats(data.stats);
        }
      } catch {
        // ignore
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [levelFilter, statusFilter, typeFilter, autoResolve]);

  /* ── Toggle expand ── */
  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  /* ── Open resolve dialog ── */
  const handleOpenResolve = (id: string) => {
    setResolveTargetId(id);
    setResolveNote('');
    setResolveDialogOpen(true);
  };

  /* ── Submit resolve ── */
  const handleSubmitResolve = async () => {
    if (!resolveTargetId) return;
    try {
      const res = await fetch(`/api/v1/admin/fraud/${resolveTargetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: true, note: resolveNote || undefined }),
      });
      if (res.ok) {
        addToast('رویداد ریسک با موفقیت حل شد', 'success');
        setResolveDialogOpen(false);
        setResolveTargetId(null);
        fetchEvents();
      } else {
        const data = await res.json();
        addToast(data.error || 'خطا در حل رویداد', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
  };

  /* ── Client-side search filter ── */
  const filteredEvents = events.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.eventType.toLowerCase().includes(q) ||
      (e.details || '').toLowerCase().includes(q) ||
      (e.userId || '').toLowerCase().includes(q) ||
      (e.merchantId || '').toLowerCase().includes(q) ||
      (e.paymentId || '').toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q)
    );
  });

  /* ── Loading state ── */
  if (loading && events.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-red-500/15 flex items-center justify-center">
            <ShieldAlert className="size-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">هشدارهای تقلب</h1>
            <p className="text-xs text-muted-foreground">
              نظارت و مدیریت رویدادهای ریسک پلتفرم پرداخت
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchEvents}
          className="border-gold/30 text-gold hover:bg-gold/10"
        >
          <RefreshCw className="size-3 ml-1" />
          بروزرسانی
        </Button>
      </div>

      {/* ── Stats Overview ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Activity}
          label="کل رویدادها"
          value={stats.total}
          iconBg="bg-gold/15"
          iconColor="text-gold"
        />
        <StatCard
          icon={AlertTriangle}
          label="ریسک بالا (بیش از ۷۰)"
          value={stats.high}
          iconBg="bg-red-500/15"
          iconColor="text-red-400"
        />
        <StatCard
          icon={AlertCircle}
          label="ریسک متوسط (۴۰-۷۰)"
          value={stats.medium}
          iconBg="bg-amber-500/15"
          iconColor="text-amber-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="ریسک پایین (کمتر از ۴۰)"
          value={stats.low}
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-400"
        />
        <StatCard
          icon={Ban}
          label="حل‌نشده"
          value={stats.unresolved}
          iconBg="bg-orange-500/15"
          iconColor="text-orange-400"
        />
      </div>

      {/* ── Auto-resolve toggle ── */}
      <Card className="card-glass-premium border-gold/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Timer className="size-4 text-gold" />
            <div>
              <p className="text-sm font-medium">حل خودکار ریسک‌های پایین</p>
              <p className="text-xs text-muted-foreground">
                رویدادهای ریسک پایین بعد از ۲۴ ساعت به‌صورت خودکار حل می‌شوند
              </p>
            </div>
          </div>
          <Switch
            checked={autoResolve}
            onCheckedChange={(checked) => {
              setAutoResolve(checked);
              if (checked) {
                addToast('حل خودکار فعال شد', 'info');
                fetchEvents();
              }
            }}
          />
        </CardContent>
      </Card>

      {/* ── Filters ── */}
      <Card className="card-gold-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="size-4 text-gold" />
            فیلتر رویدادها
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو..."
                className="pr-9 input-gold-focus"
              />
            </div>

            {/* Risk Level */}
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="select-gold">
                <SelectValue placeholder="سطح ریسک" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه سطوح</SelectItem>
                <SelectItem value="high">ریسک بالا</SelectItem>
                <SelectItem value="medium">ریسک متوسط</SelectItem>
                <SelectItem value="low">ریسک پایین</SelectItem>
              </SelectContent>
            </Select>

            {/* Event Type */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="select-gold">
                <SelectValue placeholder="نوع رویداد" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه انواع</SelectItem>
                <SelectItem value="rapid_payment">پرداخت سریع</SelectItem>
                <SelectItem value="duplicate_card">کارت تکراری</SelectItem>
                <SelectItem value="high_value">مبلغ بالا</SelectItem>
                <SelectItem value="bot_checkout">ربات</SelectItem>
                <SelectItem value="velocity_exceeded">سرعت تراکنش</SelectItem>
                <SelectItem value="fake_merchant">فروشگاه مشکوک</SelectItem>
              </SelectContent>
            </Select>

            {/* Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="select-gold">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="resolved">حل‌شده</SelectItem>
                <SelectItem value="unresolved">حل‌نشده</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Events List ── */}
      <Card className="card-gold-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">
              رویدادهای اخیر
              <Badge variant="outline" className="text-xs mr-2 border-gold/30 text-gold">
                {filteredEvents.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Eye className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                برای مشاهده جزئیات کلیک کنید
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-3">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <RiskEventRow
                    key={event.id}
                    event={event}
                    expanded={expandedId === event.id}
                    onToggle={() => handleToggleExpand(event.id)}
                    onResolve={handleOpenResolve}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <ShieldAlert className="size-12 mx-auto text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    رویداد ریسکی یافت نشد
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    فیلترها را تغییر دهید یا بعداً بررسی کنید
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ── Resolve Dialog ── */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-400" />
              حل رویداد ریسک
            </DialogTitle>
            <DialogDescription>
              این رویداد را به‌عنوان حل‌شده علامت‌گذاری کنید. اختیاریاً یک یادداشت اضافه کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>یادداشت (اختیاری)</Label>
              <Textarea
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                placeholder="توضیحات بررسی..."
                rows={4}
                className="input-gold-focus"
              />
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1 btn-gold-gradient"
                onClick={handleSubmitResolve}
              >
                <CheckCircle2 className="size-4 ml-1" />
                تأیید حل
              </Button>
              <Button
                variant="outline"
                onClick={() => setResolveDialogOpen(false)}
              >
                انصراف
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

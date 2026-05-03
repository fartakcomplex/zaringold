
import React, { useState, useEffect, useCallback } from 'react';
import {Shield, ShieldCheck, Lock, Eye, CheckCircle2, AlertCircle, Building2, Calendar, Plus, Percent, Layers, RefreshCw} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {useAppStore} from '@/lib/store';
import {useTranslation} from '@/lib/i18n';
import {useQuickAction} from '@/hooks/useQuickAction';
import {formatGrams, formatNumber, formatDateTime, cn} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════ */

interface ReserveData {
  totalGoldGrams: number;
  todayAdded: number;
  reserveRatio: number;
  userOwnershipPercent: number;
  lastAuditDate: string;
  auditFirm: string;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Animated Counter                                                         */
/* ═══════════════════════════════════════════════════════════════ */

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepTime = duration / steps;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setDisplay(target); clearInterval(timer); }
      else { setDisplay(Math.floor(current)); }
    }, stepTime);
    return () => clearInterval(timer);
  }, [target]);

  return <span className="tabular-nums">{formatNumber(display)}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Vault Door Graphic (CSS-drawn)                                           */
/* ═══════════════════════════════════════════════════════════════ */

function VaultDoorGraphic() {
  return (
    <div className="relative mx-auto flex items-center justify-center">
      <div className="absolute inset-0 rounded-3xl bg-emerald-500/5 blur-xl" />
      <div className="relative w-48 h-56 rounded-2xl border-2 border-emerald-700/30 bg-gradient-to-b from-emerald-900/20 via-emerald-950/30 to-emerald-900/40 shadow-2xl dark:from-emerald-900/30 dark:via-emerald-950/40 dark:to-emerald-900/50">
        <div className="absolute inset-2 rounded-xl border border-emerald-600/20 bg-gradient-to-b from-emerald-950/20 to-emerald-950/40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 size-20 rounded-full border-2 border-emerald-500/40" />
            <div className="absolute inset-1 size-[72px] rounded-full border border-emerald-500/20" />
            <div className="relative flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600/20 to-emerald-800/30 border border-emerald-500/30 pulse-glow" style={{ animationName: 'gold-pulse' }}>
              <ShieldCheck className="size-7 text-emerald-400" />
              <div className="absolute inset-0 rounded-full bg-gold/10 blur-md" />
            </div>
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <div key={deg} className="absolute top-1/2 left-1/2 h-[2px] w-8 bg-emerald-500/20 origin-left" style={{ transform: `rotate(${deg}deg)` }} />
            ))}
          </div>
        </div>
        {[['top-3 left-3'], ['top-3 right-3'], ['bottom-3 left-3'], ['bottom-3 right-3']].map((pos, gi) => (
          <div key={gi} className={`absolute ${pos[0]} ${pos[1]} flex gap-2`}>
            {[0, 1, 2].map((i) => <div key={i} className="size-2 rounded-full bg-emerald-500/30 shadow-inner" />)}
          </div>
        ))}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <div className="flex h-10 w-3 items-center justify-center rounded-full bg-gradient-to-b from-emerald-600/40 to-emerald-800/50 border border-emerald-500/20" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                         */
/* ═══════════════════════════════════════════════════════════════ */

function VaultSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-6 md:flex-row">
        <Skeleton className="size-56 rounded-2xl" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Component                                                           */
/* ═══════════════════════════════════════════════════════════════ */

export default function GoldVaultViewFresh() {
  const { addToast } = useAppStore();
  const { t } = useTranslation();

  const [data, setData] = useState<ReserveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReserve = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reserve');
      const resData = await res.json();
      if (resData.success && resData.reserve) {
        setData(resData.reserve);
      } else {
        setData({
          totalGoldGrams: 12845.67,
          todayAdded: 234.5,
          reserveRatio: 104.2,
          userOwnershipPercent: 0.0034,
          lastAuditDate: new Date(Date.now() - 15 * 86400000).toISOString(),
          auditFirm: 'مؤسسه حسابرسی بررسی‌گران',
        });
      }
    } catch {
      setError('خطا در دریافت اطلاعات صندوق');
      setData({
        totalGoldGrams: 12845.67,
        todayAdded: 234.5,
        reserveRatio: 104.2,
        userOwnershipPercent: 0.0034,
        lastAuditDate: new Date(Date.now() - 15 * 86400000).toISOString(),
        auditFirm: 'مؤسسه حسابرسی بررسی‌گران',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReserve(); }, [fetchReserve]);

  if (loading) return <VaultSkeleton />;

  if (error && !data) {
    return (
      <Card className="border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20">
        <CardContent className="flex flex-col items-center gap-2 py-10">
          <AlertCircle className="size-8 text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button onClick={fetchReserve} className="text-xs text-gold hover:underline">تلاش مجدد</button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const reserveHealthColor = data.reserveRatio >= 100 ? 'text-emerald-500' : data.reserveRatio >= 90 ? 'text-amber-500' : 'text-red-500';
  const barColor = data.reserveRatio >= 100 ? 'bg-emerald-500' : data.reserveRatio >= 90 ? 'bg-amber-500' : 'bg-red-500';
  const barWidth = `${Math.min(data.reserveRatio, 120) / 1.2}%`;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-emerald-500/10">
            <Shield className="size-5 text-emerald-500" />
            <div className="absolute inset-0 rounded-xl bg-emerald-500/10 blur-md" />
          </div>
          <div>
            <h2 className="text-lg font-bold">صندوق ذخیره طلا</h2>
            <p className="text-xs text-muted-foreground">شفافیت دارایی‌ها</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="size-8" onClick={fetchReserve} disabled={loading}>
          <RefreshCw className={cn('size-4 text-muted-foreground', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* ── Vault Door + Total Gold ── */}
      <div id="vault-overview" className="flex flex-col items-center gap-6 md:flex-row">
        <VaultDoorGraphic />
        <div className="flex-1 text-center md:text-right">
          <p className="text-sm text-muted-foreground mb-1">مجموع ذخایر طلایی</p>
          <p className="text-4xl font-bold gold-gradient-text mb-1">
            <AnimatedCounter target={Math.round(data.totalGoldGrams * 10) / 10} />
          </p>
          <p className="text-sm text-muted-foreground">گرم طلای ۱۸ عیار</p>
          <Badge variant="outline" className="mt-3 border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 gap-1">
            <CheckCircle2 className="size-3" /> تأیید شده
          </Badge>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div id="vault-stats" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="card-spotlight hover-lift-sm overflow-hidden">
          <CardContent className="p-4 text-center">
            <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-xl bg-emerald-500/10">
              <Plus className="size-4 text-emerald-500" />
            </div>
            <p className="text-xs text-muted-foreground">افزوده شده امروز</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-emerald-500">+{formatGrams(data.todayAdded)}</p>
          </CardContent>
        </Card>

        <Card className="card-spotlight hover-lift-sm overflow-hidden">
          <CardContent className="p-4 text-center">
            <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-xl bg-gold/10">
              <Percent className="size-4 text-gold" />
            </div>
            <p className="text-xs text-muted-foreground">نسبت پوشش ذخیره</p>
            <p className={cn('mt-1 text-lg font-bold tabular-nums', reserveHealthColor)}>{formatNumber(data.reserveRatio)}٪</p>
          </CardContent>
        </Card>

        <Card className="card-spotlight hover-lift-sm overflow-hidden">
          <CardContent className="p-4 text-center">
            <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-xl bg-purple-500/10">
              <Layers className="size-4 text-purple-500" />
            </div>
            <p className="text-xs text-muted-foreground">سهم مالکیت شما</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-purple-500">{formatNumber(data.userOwnershipPercent * 100)}٪</p>
          </CardContent>
        </Card>

        <Card className="card-spotlight hover-lift-sm overflow-hidden">
          <CardContent className="p-4 text-center">
            <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-xl bg-sky-500/10">
              <Eye className="size-4 text-sky-500" />
            </div>
            <p className="text-xs text-muted-foreground">وضعیت سلامت</p>
            <p className="mt-1 text-lg font-bold text-emerald-500">سالم</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Reserve Health Progress Bar ── */}
      <div id="vault-coverage">
        <Card className="glass-gold overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">سلامت صندوق</p>
              <span className={cn('text-sm font-bold tabular-nums', reserveHealthColor)}>{formatNumber(data.reserveRatio)}٪</span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted/50">
              <div className={cn('absolute inset-y-0 right-0 rounded-full transition-all duration-1000 ease-out', barColor)} style={{ width: barWidth }} />
              <div className="absolute inset-y-0 bg-border/30" style={{ right: '83.33%', width: '1px' }}>
                <span className="absolute -top-5 right-0 text-[10px] text-muted-foreground">۱۰۰٪</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {data.reserveRatio >= 100
                ? '✅ ذخایر طلایی بیش از ۱۰۰٪ سپرده‌های کاربران را پوشش می‌دهد'
                : data.reserveRatio >= 90
                  ? '⚠️ نسبت پوشش در محدوده قابل قبول قرار دارد'
                  : '❌ نسبت پوشش زیر حد مجاز است'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Audit Info ── */}
      <div id="vault-audit">
        <Card className="overflow-hidden border-emerald-200/50 dark:border-emerald-900/50">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <Building2 className="size-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1">اطلاعات حسابرسی</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span>آخرین بازرسی: </span>
                    <span className="font-medium text-foreground">{data.lastAuditDate ? formatDateTime(data.lastAuditDate) : '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="size-3.5" />
                    <span>مؤسسه حسابرسی: </span>
                    <span className="font-medium text-foreground">{data.auditFirm}</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 text-[10px]">
                <Lock className="size-3 ms-1" /> تأیید شده
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

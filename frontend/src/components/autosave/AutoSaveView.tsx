
import React, { useState, useEffect, useCallback } from 'react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {PiggyBank, CalendarClock, Plus, Pause, Play, Trash2, Coins, Clock, TrendingUp, Sparkles, ArrowUpDown, CalendarDays} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Separator} from '@/components/ui/separator';
import {Skeleton} from '@/components/ui/skeleton';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from '@/components/ui/alert-dialog';
import {useAppStore} from '@/lib/store';
import {useTranslation} from '@/lib/i18n';
import {formatToman, formatGrams, formatNumber} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════ */
/*  Animation Variants                                               */
/* ═══════════════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                           */
/* ═══════════════════════════════════════════════════════════════ */

type Frequency = 'daily' | 'weekly' | 'monthly';

interface AutoSavePlan {
  id: string;
  amount: number;
  frequency: Frequency;
  dayOfMonth?: number;
  status: 'active' | 'paused';
  totalSpent: number;
  totalGoldBought: number;
  executionCount: number;
  nextExecution: string;
  createdAt: string;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Constants                                                       */
/* ═══════════════════════════════════════════════════════════════ */

const PRESET_AMOUNTS = [
  { value: 500000, label: '۵۰۰ هزار' },
  { value: 1000000, label: '۱ میلیون' },
  { value: 2000000, label: '۲ میلیون' },
  { value: 5000000, label: '۵ میلیون' },
];

const FREQUENCY_OPTIONS: { value: Frequency; label: string; icon: React.ReactNode }[] = [
  { value: 'daily', label: 'روزانه', icon: <Clock className="size-4" /> },
  { value: 'weekly', label: 'هفتگی', icon: <CalendarDays className="size-4" /> },
  { value: 'monthly', label: 'ماهانه', icon: <CalendarClock className="size-4" /> },
];

/* ═══════════════════════════════════════════════════════════════ */
/*  Helper Functions                                                 */
/* ═══════════════════════════════════════════════════════════════ */

function getFrequencyLabel(f: Frequency): string {
  const map: Record<Frequency, string> = { daily: 'روزانه', weekly: 'هفتگی', monthly: 'ماهانه' };
  return map[f];
}

function getMonthlyMultiplier(f: Frequency): number {
  switch (f) {
    case 'daily': return 30;
    case 'weekly': return 4.33;
    case 'monthly': return 1;
  }
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                 */
/* ═══════════════════════════════════════════════════════════════ */

function AutoSaveSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 py-6">
        <Skeleton className="size-16 rounded-2xl" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4"><div className="flex items-center gap-3"><Skeleton className="size-10 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-5 w-24" /></div></div></CardContent></Card>
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}><CardContent className="p-5 space-y-3"><div className="flex justify-between"><Skeleton className="h-5 w-32" /><Skeleton className="h-6 w-16" /></div><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-48" /></CardContent></Card>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Component                                                   */
/* ═══════════════════════════════════════════════════════════════ */

export default function AutoSaveView() {
  const { t } = useTranslation();
  const { user, goldPrice, addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<AutoSavePlan[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* ── Create form state ── */
  const [newAmount, setNewAmount] = useState<string>('1000000');
  const [newFrequency, setNewFrequency] = useState<Frequency>('monthly');
  const [newDayOfMonth, setNewDayOfMonth] = useState<number>(1);
  const [creating, setCreating] = useState(false);

  /* ── Fetch plans ── */
  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch(`/api/autosave/plans?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      } else {
        setPlans([]);
      }
    } catch {
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  /* ── Create plan ── */
  const handleCreate = async () => {
    const amount = parseInt(newAmount) || 0;
    if (amount < 10000) return;
    setCreating(true);
    try {
      const res = await fetch('/api/autosave/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          amount,
          frequency: newFrequency,
          dayOfMonth: newFrequency === 'monthly' ? newDayOfMonth : undefined,
        }),
      });
      if (res.ok) {
        addToast('برنامه خرید خودکار با موفقیت ایجاد شد', 'success');
        setCreateOpen(false);
        setNewAmount('1000000');
        setNewFrequency('monthly');
        setNewDayOfMonth(1);
        fetchPlans();
      } else {
        addToast('خطا در ایجاد برنامه', 'error');
      }
    } catch {
      addToast('خطای شبکه', 'error');
    } finally {
      setCreating(false);
    }
  };

  /* ── Toggle plan ── */
  const handleToggle = async (plan: AutoSavePlan) => {
    try {
      const res = await fetch(`/api/autosave/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: plan.status === 'active' ? 'paused' : 'active' }),
      });
      if (res.ok) {
        addToast(plan.status === 'active' ? 'برنامه متوقف شد' : 'برنامه فعال شد', 'success');
        fetchPlans();
      }
    } catch {
      addToast('خطای شبکه', 'error');
    }
  };

  /* ── Delete plan ── */
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/autosave/plans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleted: true }),
      });
      if (res.ok) {
        addToast('برنامه حذف شد', 'success');
        fetchPlans();
      }
    } catch {
      addToast('خطای شبکه', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Computed values for new plan summary ── */
  const numAmount = parseInt(newAmount) || 0;
  const monthlyEst = Math.round(numAmount * getMonthlyMultiplier(newFrequency));
  const estGrams = goldPrice?.buyPrice ? monthlyEst / goldPrice.buyPrice : 0;

  /* ═══════════════════════════════════════════════════════════════ */
  /*  Render                                                          */
  /* ═══════════════════════════════════════════════════════════════ */

  if (isLoading) return <AutoSaveSkeleton />;

  return (
    <motion.div className="mx-auto max-w-4xl space-y-6" variants={containerVariants} initial="hidden" animate="show">
      {/* ── Hero ── */}
      <motion.div className="flex flex-col items-center gap-3 py-4 text-center" variants={itemVariants}>
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gold/10 shadow-lg shadow-gold/10">
          <PiggyBank className="size-7 text-gold" />
        </div>
        <div>
          <h2 className="gold-gradient-text text-2xl font-extrabold">خرید خودکار طلا</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            بدون نیاز به پیگیری، طلای شما به صورت خودکار و دوره‌ای خریداری می‌شود
          </p>
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-3" variants={itemVariants}>
        <Card className="overflow-hidden border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                <Coins className="size-5 text-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">مجموع خرید</p>
                <p className="text-base font-bold tabular-nums text-foreground">
                  {formatToman(plans.reduce((s, p) => s + p.totalSpent, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-gold/20 bg-gradient-to-br from-gold/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/15">
                <TrendingUp className="size-5 text-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">طلای خریداری شده</p>
                <p className="text-base font-bold tabular-nums gold-gradient-text">
                  {formatGrams(plans.reduce((s, p) => s + p.totalGoldBought, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                <ArrowUpDown className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">دوره‌های اجرا</p>
                <p className="text-base font-bold tabular-nums text-foreground">
                  {formatNumber(plans.reduce((s, p) => s + p.executionCount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Create Button ── */}
      <motion.div variants={itemVariants}>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-gold text-gold-dark hover:bg-gold/90 btn-gold-shine" size="lg">
              <Plus className="ml-2 size-4" />
              ایجاد برنامه خرید خودکار
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="size-4 text-gold" />
                برنامه خرید خودکار جدید
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Amount */}
              <div className="space-y-2">
                <label className="text-sm font-medium">مبلغ هر دوره (گرم طلا)</label>
                <Input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="مبلغ مورد نظر"
                  className="text-left tabular-nums"
                  min={10000}
                  step={100000}
                />
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AMOUNTS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setNewAmount(String(p.value))}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-all ${
                        parseInt(newAmount) === p.value
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-border text-muted-foreground hover:border-gold/30 hover:bg-gold/5'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Frequency */}
              <div className="space-y-2">
                <label className="text-sm font-medium">فاصله خرید</label>
                <div className="grid grid-cols-3 gap-2">
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setNewFrequency(opt.value)}
                      className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 transition-all ${
                        newFrequency === opt.value
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-border text-muted-foreground hover:border-gold/30 hover:bg-gold/5'
                      }`}
                    >
                      {opt.icon}
                      <span className="text-sm font-semibold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Day of month (for monthly) */}
              {newFrequency === 'monthly' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">روز ماه</label>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <button
                        key={day}
                        onClick={() => setNewDayOfMonth(day)}
                        className={`flex size-8 items-center justify-center rounded-lg border text-xs font-medium transition-all ${
                          newDayOfMonth === day
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-border text-muted-foreground hover:border-gold/30'
                        }`}
                      >
                        {formatNumber(day)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="rounded-xl border border-gold/15 bg-gold/5 p-3">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">برآورد خرید ماهانه</span>
                    <span className="font-bold text-foreground">{formatToman(monthlyEst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">طلای ماهانه (تخمینی)</span>
                    <span className="font-bold gold-gradient-text">{formatGrams(estGrams)}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCreate}
                disabled={numAmount < 10000 || creating}
                className="w-full bg-gold text-gold-dark hover:bg-gold/90"
              >
                {creating ? 'در حال ایجاد...' : 'ایجاد برنامه'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* ── Plans List ── */}
      <motion.div variants={itemVariants} className="space-y-4">
        {plans.length === 0 ? (
          <Card className="overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-gold/10">
                <PiggyBank className="size-8 text-gold/60" />
              </div>
              <p className="text-sm font-semibold text-foreground">هنوز برنامه‌ای ایجاد نکرده‌اید</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                با ایجاد اولین برنامه خرید خودکار، بدون نیاز به پیگیری روزانه طلا جمع کنید
              </p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Card className="overflow-hidden transition-all hover:border-gold/20 hover:bg-gold/[0.02]">
                  <CardContent className="p-4 sm:p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${plan.status === 'active' ? 'bg-gold/10' : 'bg-muted'}`}>
                          <Coins className={`size-5 ${plan.status === 'active' ? 'text-gold' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{formatToman(plan.amount)}</span>
                            <Badge variant="secondary" className={`text-[10px] ${plan.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'}`}>
                              {plan.status === 'active' ? 'فعال' : 'متوقف'}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {getFrequencyLabel(plan.frequency)}
                            {plan.frequency === 'monthly' && plan.dayOfMonth ? ` · ${formatNumber(plan.dayOfMonth)}ام هر ماه` : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-muted/50 p-2 text-center">
                        <p className="text-[10px] text-muted-foreground">مجموع خرید</p>
                        <p className="mt-0.5 text-xs font-bold tabular-nums">{formatToman(plan.totalSpent)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2 text-center">
                        <p className="text-[10px] text-muted-foreground">طلای جمع شده</p>
                        <p className="mt-0.5 text-xs font-bold tabular-nums gold-gradient-text">{formatGrams(plan.totalGoldBought)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2 text-center">
                        <p className="text-[10px] text-muted-foreground">تعداد اجرا</p>
                        <p className="mt-0.5 text-xs font-bold tabular-nums">{formatNumber(plan.executionCount)}</p>
                      </div>
                    </div>

                    {/* Next execution */}
                    {plan.status === 'active' && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        <span>اجرای بعدی: {plan.nextExecution}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleToggle(plan)}
                      >
                        {plan.status === 'active' ? <Pause className="ml-1 size-3" /> : <Play className="ml-1 size-3" />}
                        {plan.status === 'active' ? 'توقف' : 'فعال‌سازی'}
                      </Button>
                      <AlertDialog open={deletingId === plan.id} onOpenChange={(open) => !open && setDeletingId(null)}>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="size-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف برنامه خرید خودکار</AlertDialogTitle>
                            <AlertDialogDescription>
                              آیا از حذف این برنامه مطمئن هستید؟ این عمل قابل بازگشت نیست.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(plan.id)} className="bg-destructive text-white hover:bg-destructive/90">
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  );
}

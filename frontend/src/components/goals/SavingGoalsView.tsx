
import React, { useState, useEffect, useCallback } from 'react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {Target, Plus, Coins, CalendarClock, Edit, Trash2, TrendingUp, Gift, Sparkles, Clock, ChevronLeft} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Separator} from '@/components/ui/separator';
import {Skeleton} from '@/components/ui/skeleton';
import {Label} from '@/components/ui/label';
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
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                           */
/* ═══════════════════════════════════════════════════════════════ */

interface SavingGoal {
  id: string;
  title: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  deadline?: string;
  currentGrams: number;
  targetGrams: number;
  createdAt: string;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Constants                                                       */
/* ═══════════════════════════════════════════════════════════════ */

const GOAL_PRESETS = [
  { title: 'عروسی', icon: '💍' },
  { title: 'خودرو', icon: '🚗' },
  { title: 'آیفون', icon: '📱' },
  { title: 'مسکن', icon: '🏠' },
  { title: 'سفر', icon: '✈️' },
  { title: 'سایر', icon: '⭐' },
];

const ICON_GRID = ['💍', '🚗', '📱', '🏠', '✈️', '🎓', '👶', '💍', '💰', '⭐', '🎯', '🎁', '💻', '🎮', '📸', '🏃'];

const MOCK_GOALS: SavingGoal[] = [
  {
    id: 'g-1',
    title: 'عروسی',
    icon: '💍',
    targetAmount: 50000000,
    currentAmount: 18500000,
    monthlyContribution: 2000000,
    deadline: '۱۴۰۴/۰۶/۱۵',
    currentGrams: 0.535,
    targetGrams: 1.446,
    createdAt: '۱۴۰۳/۰۴/۰۱',
  },
  {
    id: 'g-2',
    title: 'سفر اروپا',
    icon: '✈️',
    targetAmount: 30000000,
    currentAmount: 22000000,
    monthlyContribution: 3000000,
    deadline: '۱۴۰۴/۰۳/۰۱',
    currentGrams: 0.637,
    targetGrams: 0.867,
    createdAt: '۱۴۰۳/۰۲/۱۵',
  },
  {
    id: 'g-3',
    title: 'آیفون',
    icon: '📱',
    targetAmount: 80000000,
    currentAmount: 12000000,
    monthlyContribution: 1500000,
    currentGrams: 0.347,
    targetGrams: 2.314,
    createdAt: '۱۴۰۳/۰۷/۰۱',
  },
];

/* ═══════════════════════════════════════════════════════════════ */
/*  Helper Functions                                                 */
/* ═══════════════════════════════════════════════════════════════ */

function getDaysRemaining(deadline?: string): number | null {
  if (!deadline) return null;
  // Simple estimate from Persian date string
  const parts = deadline.split('/').map(Number);
  if (parts.length !== 3) return null;
  // Rough estimate: assume ~365 days per year
  const totalDays = (parts[0] * 365) + (parts[1] * 30) + parts[2];
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowTotal = nowYear * 365 + now.getMonth() * 30 + now.getDate();
  return Math.max(0, totalDays - nowTotal);
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                 */
/* ═══════════════════════════════════════════════════════════════ */

function GoalsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 py-6">
        <Skeleton className="size-16 rounded-2xl" />
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-80" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}><CardContent className="p-5 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-3 w-full rounded-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
        </CardContent></Card>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Progress Bar Component                                           */
/* ═══════════════════════════════════════════════════════════════ */

function GoldProgressBar({ value, className }: { value: number; className?: string }) {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <div className={`relative h-3 w-full overflow-hidden rounded-full bg-muted ${className || ''}`}>
      <motion.div
        className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-gold-dark via-gold to-gold-light"
        initial={{ width: 0 }}
        animate={{ width: `${clampedValue}%` }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
      />
      <div className="absolute inset-0 rounded-full bg-gradient-to-l from-gold-dark via-gold to-gold-light progress-gold opacity-60"
        style={{ width: `${clampedValue}%`, right: 0 }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Component                                                   */
/* ═══════════════════════════════════════════════════════════════ */

export default function SavingGoalsView() {
  const { t } = useTranslation();
  const { user, goldPrice, addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* ── Create form state ── */
  const [newTitle, setNewTitle] = useState('');
  const [newIcon, setNewIcon] = useState('⭐');
  const [newTarget, setNewTarget] = useState('');
  const [newMonthly, setNewMonthly] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [creating, setCreating] = useState(false);

  /* ── Contribute form state ── */
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributing, setContributing] = useState(false);

  /* ── Animated counters ── */
  const [animatedPercentages, setAnimatedPercentages] = useState<Record<string, number>>({});

  /* ── Fetch goals ── */
  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch(`/api/goals?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setGoals(data.goals || []);
      } else {
        setGoals(MOCK_GOALS);
      }
    } catch {
      setGoals(MOCK_GOALS);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  /* ── Animate percentages ── */
  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    goals.forEach((goal) => {
      const pct = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
      const timeout = setTimeout(() => {
        setAnimatedPercentages((prev) => ({ ...prev, [goal.id]: pct }));
      }, 400);
      timeouts.push(timeout);
    });
    return () => timeouts.forEach(clearTimeout);
  }, [goals]);

  /* ── Create goal ── */
  const handleCreate = async () => {
    const target = parseInt(newTarget) || 0;
    const monthly = parseInt(newMonthly) || 0;
    if (target < 100000 || !newTitle) return;
    setCreating(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          title: newTitle,
          icon: newIcon,
          targetAmount: target,
          monthlyContribution: monthly,
          deadline: newDeadline || undefined,
        }),
      });
      if (res.ok) {
        addToast('هدف پس‌انداز با موفقیت ایجاد شد', 'success');
        setCreateOpen(false);
        resetCreateForm();
        fetchGoals();
      } else {
        addToast('خطا در ایجاد هدف', 'error');
      }
    } catch {
      addToast('خطای شبکه', 'error');
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setNewTitle('');
    setNewIcon('⭐');
    setNewTarget('');
    setNewMonthly('');
    setNewDeadline('');
  };

  /* ── Contribute ── */
  const handleContribute = async () => {
    if (!selectedGoal || !contributeAmount) return;
    const amount = parseInt(contributeAmount) || 0;
    if (amount < 10000) return;
    setContributing(true);
    try {
      const res = await fetch(`/api/goals/${selectedGoal.id}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, amount }),
      });
      if (res.ok) {
        addToast('مبلغ با موفقیت به هدف اضافه شد', 'success');
        setContributeOpen(false);
        setContributeAmount('');
        setSelectedGoal(null);
        fetchGoals();
      } else {
        addToast('خطا در افزودن مبلغ', 'error');
      }
    } catch {
      addToast('خطای شبکه', 'error');
    } finally {
      setContributing(false);
    }
  };

  /* ── Delete goal ── */
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleted: true }),
      });
      if (res.ok) {
        addToast('هدف پس‌انداز حذف شد', 'success');
        fetchGoals();
      }
    } catch {
      addToast('خطای شبکه', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  /* ═══════════════════════════════════════════════════════════════ */
  /*  Render                                                          */
  /* ═══════════════════════════════════════════════════════════════ */

  if (isLoading) return <GoalsSkeleton />;

  return (
    <motion.div className="mx-auto max-w-4xl space-y-6" variants={containerVariants} initial="hidden" animate="show">
      {/* ── Hero ── */}
      <motion.div className="flex flex-col items-center gap-3 py-4 text-center" variants={itemVariants}>
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gold/10 shadow-lg shadow-gold/10">
          <Target className="size-7 text-gold" />
        </div>
        <div>
          <h2 className="gold-gradient-text text-2xl font-extrabold">اهداف پس‌انداز طلایی</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            برای رویاهای خود هدف تعیین کنید و قدم‌به‌قدم به آن نزدیک شوید
          </p>
        </div>
      </motion.div>

      {/* ── Create Button ── */}
      <motion.div variants={itemVariants}>
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetCreateForm(); }}>
          <DialogTrigger asChild>
            <Button className="w-full bg-gold text-gold-dark hover:bg-gold/90 btn-gold-shine" size="lg">
              <Plus className="ml-2 size-4" />
              ایجاد هدف جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Target className="size-4 text-gold" />
                هدف پس‌انداز جدید
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Title preset or custom */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">نام هدف</Label>
                <div className="grid grid-cols-3 gap-2">
                  {GOAL_PRESETS.map((preset) => (
                    <button
                      key={preset.title}
                      onClick={() => { setNewTitle(preset.title); setNewIcon(preset.icon); }}
                      className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-xs transition-all ${
                        newTitle === preset.title
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-border text-muted-foreground hover:border-gold/30 hover:bg-gold/5'
                      }`}
                    >
                      <span className="text-lg">{preset.icon}</span>
                      <span>{preset.title}</span>
                    </button>
                  ))}
                </div>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="یا نام دلخواه وارد کنید..."
                />
              </div>

              <Separator />

              {/* Icon Selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">آیکون</Label>
                <div className="grid grid-cols-8 gap-1.5">
                  {ICON_GRID.map((icon, idx) => (
                    <button
                      key={idx}
                      onClick={() => setNewIcon(icon)}
                      className={`flex size-9 items-center justify-center rounded-lg border text-base transition-all ${
                        newIcon === icon
                          ? 'border-gold bg-gold/10 scale-110'
                          : 'border-border hover:border-gold/30'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Target Amount */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">مبلغ هدف (گرم طلا)</Label>
                <Input
                  type="number"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="مثلاً ۵۰,۰۰۰,۰۰۰"
                  className="text-left tabular-nums"
                  min={100000}
                />
              </div>

              {/* Monthly Contribution */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">مبلغ ماهانه</Label>
                <Input
                  type="number"
                  value={newMonthly}
                  onChange={(e) => setNewMonthly(e.target.value)}
                  placeholder="مثلاً ۲,۰۰۰,۰۰۰"
                  className="text-left tabular-nums"
                  min={0}
                />
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">مهلت (اختیاری)</Label>
                <Input
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  placeholder="مثلاً ۱۴۰۴/۰۶/۱۵"
                />
              </div>

              {/* Summary */}
              {parseInt(newTarget) > 0 && goldPrice?.buyPrice && (
                <div className="rounded-xl border border-gold/15 bg-gold/5 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">گرم طلای مورد نیاز</span>
                    <span className="font-bold gold-gradient-text">{formatGrams(parseInt(newTarget) / goldPrice.buyPrice)}</span>
                  </div>
                  {parseInt(newMonthly) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تخمین ماه‌های باقیمانده</span>
                      <span className="font-bold">{formatNumber(Math.ceil(parseInt(newTarget) / parseInt(newMonthly)))} ماه</span>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={handleCreate}
                disabled={parseInt(newTarget) < 100000 || !newTitle || creating}
                className="w-full bg-gold text-gold-dark hover:bg-gold/90"
              >
                {creating ? 'در حال ایجاد...' : 'ایجاد هدف'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* ── Goals List ── */}
      <motion.div variants={itemVariants} className="space-y-4">
        {goals.length === 0 ? (
          <Card className="overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-gold/10">
                <Target className="size-8 text-gold/60" />
              </div>
              <p className="text-sm font-semibold text-foreground">هنوز هدفی ایجاد نکرده‌اید</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                با تعیین هدف، انگیزه بیشتری برای پس‌انداز پیدا خواهید کرد. هر قدم کوچکی شما را به رویاهایتان نزدیک‌تر می‌کند
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-gold/70 text-xs">
                <Sparkles className="size-3" />
                <span>شروع کنید، موفقیت در قدم‌های کوچک است</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {goals.map((goal, idx) => {
              const percentage = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
              const daysLeft = getDaysRemaining(goal.deadline);

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Card className="overflow-hidden transition-all hover:border-gold/20">
                    <CardContent className="p-4 sm:p-5">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-2xl">
                          {goal.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{goal.title}</span>
                            {goal.monthlyContribution > 0 && (
                              <Badge variant="secondary" className="bg-gold/10 text-gold text-[10px]">
                                ماهانه {formatToman(goal.monthlyContribution)}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            هدف: {formatToman(goal.targetAmount)}
                          </p>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="font-medium gold-gradient-text">
                            {formatGrams(goal.currentGrams)} / {formatGrams(goal.targetGrams)}
                          </span>
                          <motion.span
                            className="text-sm font-bold tabular-nums"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            key={animatedPercentages[goal.id]}
                          >
                            {animatedPercentages[goal.id] ?? 0}%
                          </motion.span>
                        </div>
                        <GoldProgressBar value={percentage} />
                      </div>

                      {/* Info row */}
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        {daysLeft !== null && (
                          <div className="flex items-center gap-1 rounded-lg bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground">
                            <Clock className="size-3" />
                            <span>{formatNumber(daysLeft)} روز مانده</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 rounded-lg bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground">
                          <Coins className="size-3" />
                          <span>{formatToman(goal.currentAmount)} جمع شده</span>
                        </div>
                        <div className="flex items-center gap-1 rounded-lg bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground">
                          <TrendingUp className="size-3" />
                          <span>{formatToman(goal.targetAmount - goal.currentAmount)} باقیمانده</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex items-center gap-2 border-t border-border/50 pt-3">
                        <Button
                          size="sm"
                          className="flex-1 bg-gold text-gold-dark hover:bg-gold/90"
                          onClick={() => { setSelectedGoal(goal); setContributeOpen(true); }}
                        >
                          <Coins className="ml-1 size-3" />
                          واریز به هدف
                        </Button>
                        <AlertDialog open={deletingId === goal.id} onOpenChange={(open) => !open && setDeletingId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="size-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف هدف پس‌انداز</AlertDialogTitle>
                              <AlertDialogDescription>
                                آیا از حذف هدف «{goal.title}» مطمئن هستید؟ موجودی جمع‌شده به کیف پول طلایی برمی‌گردد.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>انصراف</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(goal.id)} className="bg-destructive text-white hover:bg-destructive/90">
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </motion.div>

      {/* ── Contribute Dialog ── */}
      <Dialog open={contributeOpen} onOpenChange={(open) => { setContributeOpen(open); if (!open) { setSelectedGoal(null); setContributeAmount(''); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Gift className="size-4 text-gold" />
              واریز به هدف «{selectedGoal?.icon} {selectedGoal?.title}»
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">مبلغ واریز (گرم طلا)</Label>
              <Input
                type="number"
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)}
                placeholder="مبلغ مورد نظر"
                className="text-left tabular-nums"
                min={10000}
              />
              <div className="flex gap-2">
                {[100000, 500000, 1000000, 2000000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setContributeAmount(String(preset))}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-all ${
                      parseInt(contributeAmount) === preset
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border text-muted-foreground hover:border-gold/30'
                    }`}
                  >
                    {preset >= 1000000 ? `${formatNumber(preset / 1000000)}M` : `${formatNumber(preset / 1000)}K`}
                  </button>
                ))}
              </div>
            </div>
            {parseInt(contributeAmount) > 0 && goldPrice?.buyPrice && (
              <div className="rounded-xl border border-gold/15 bg-gold/5 p-3 text-xs text-center">
                <span className="text-muted-foreground">طلای تقریبی: </span>
                <span className="font-bold gold-gradient-text">{formatGrams(parseInt(contributeAmount) / goldPrice.buyPrice)}</span>
              </div>
            )}
            <Button
              onClick={handleContribute}
              disabled={parseInt(contributeAmount) < 10000 || contributing}
              className="w-full bg-gold text-gold-dark hover:bg-gold/90"
            >
              {contributing ? 'در حال واریز...' : 'واریز'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

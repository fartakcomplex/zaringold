'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { toPersianDigits, formatToman, getTimeAgo } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Target,
  PiggyBank,
  Search,
  Filter,
  Pencil,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  CheckCircle,
  PauseCircle,
  XCircle,
  Calendar,
  Coins,
  Repeat,
  User,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GoalUser {
  id: string;
  fullName: string | null;
  phone: string;
  avatar?: string | null;
}

interface SavingGoal {
  id: string;
  user: GoalUser;
  title: string;
  targetGrams: number;
  currentGrams: number;
  targetFiat: number;
  currentFiat: number;
  status: 'active' | 'completed' | 'paused' | 'expired';
  deadline: string | null;
  createdAt: string;
}

interface AutoSavePlan {
  id: string;
  user: GoalUser;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  totalExecutions: number;
  totalGoldBought: number;
  isActive: boolean;
  createdAt: string;
  nextExecution: string | null;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  active: { label: 'فعال', color: 'text-emerald-500', bg: 'bg-emerald-500/15', icon: CheckCircle },
  completed: { label: 'تکمیل شده', color: 'text-gold', bg: 'bg-gold/15', icon: CheckCircle },
  paused: { label: 'متوقف', color: 'text-gray-400', bg: 'bg-gray-400/15', icon: PauseCircle },
  expired: { label: 'منقضی', color: 'text-red-500', bg: 'bg-red-500/15', icon: XCircle },
};

const FREQUENCY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  daily: { label: 'روزانه', color: 'text-blue-500', bg: 'bg-blue-500/15' },
  weekly: { label: 'هفتگی', color: 'text-violet-500', bg: 'bg-violet-500/15' },
  monthly: { label: 'ماهانه', color: 'text-emerald-500', bg: 'bg-emerald-500/15' },
};

const MOCK_GOALS: SavingGoal[] = [
  { id: '1', user: { id: 'u1', fullName: 'علی محمدی', phone: '09121234567' }, title: 'پس‌انداز عروسی', targetGrams: 5, currentGrams: 3.2, targetFiat: 20000000, currentFiat: 12800000, status: 'active', deadline: '2025-12-30', createdAt: '2025-01-15T10:00:00Z' },
  { id: '2', user: { id: 'u2', fullName: 'مریم احمدی', phone: '09139876543' }, title: 'تهیه جهیزیه', targetGrams: 10, currentGrams: 10, targetFiat: 40000000, currentFiat: 40000000, status: 'completed', deadline: '2025-08-15', createdAt: '2024-08-15T10:00:00Z' },
  { id: '3', user: { id: 'u3', fullName: 'رضا کریمی', phone: '09151112233' }, title: 'سرمایه‌گذاری بلندمدت', targetGrams: 20, currentGrams: 7.5, targetFiat: 80000000, currentFiat: 30000000, status: 'active', deadline: '2026-06-01', createdAt: '2025-03-01T10:00:00Z' },
  { id: '4', user: { id: 'u4', fullName: 'زهرا نوری', phone: '09164445566' }, title: 'خرید خودرو', targetGrams: 50, currentGrams: 12, targetFiat: 200000000, currentFiat: 48000000, status: 'paused', deadline: '2026-12-01', createdAt: '2024-12-01T10:00:00Z' },
  { id: '5', user: { id: 'u5', fullName: 'حسین رحیمی', phone: '09177778889' }, title: 'پس‌انداز آموزش', targetGrams: 2, currentGrams: 0.5, targetFiat: 8000000, currentFiat: 2000000, status: 'expired', deadline: '2025-01-01', createdAt: '2024-07-01T10:00:00Z' },
  { id: '6', user: { id: 'u1', fullName: 'علی محمدی', phone: '09121234567' }, title: 'پس‌انداز سفر', targetGrams: 3, currentGrams: 1.8, targetFiat: 12000000, currentFiat: 7200000, status: 'active', deadline: '2025-09-15', createdAt: '2025-02-15T10:00:00Z' },
];

const MOCK_PLANS: AutoSavePlan[] = [
  { id: 'p1', user: { id: 'u1', fullName: 'علی محمدی', phone: '09121234567' }, amount: 500000, frequency: 'daily', totalExecutions: 45, totalGoldBought: 0.06, isActive: true, createdAt: '2025-01-01T10:00:00Z', nextExecution: '2025-06-15T08:00:00Z' },
  { id: 'p2', user: { id: 'u2', fullName: 'مریم احمدی', phone: '09139876543' }, amount: 2000000, frequency: 'weekly', totalExecutions: 22, totalGoldBought: 0.58, isActive: true, createdAt: '2024-12-01T10:00:00Z', nextExecution: '2025-06-16T08:00:00Z' },
  { id: 'p3', user: { id: 'u3', fullName: 'رضا کریمی', phone: '09151112233' }, amount: 5000000, frequency: 'monthly', totalExecutions: 6, totalGoldBought: 0.79, isActive: true, createdAt: '2024-12-01T10:00:00Z', nextExecution: '2025-07-01T08:00:00Z' },
  { id: 'p4', user: { id: 'u4', fullName: 'زهرا نوری', phone: '09164445566' }, amount: 1000000, frequency: 'weekly', totalExecutions: 8, totalGoldBought: 0.21, isActive: false, createdAt: '2025-01-15T10:00:00Z', nextExecution: null },
  { id: 'p5', user: { id: 'u6', fullName: 'سارا موسوی', phone: '09189998877' }, amount: 300000, frequency: 'daily', totalExecutions: 120, totalGoldBought: 0.16, isActive: true, createdAt: '2024-10-01T10:00:00Z', nextExecution: '2025-06-15T08:00:00Z' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminGoals() {
  const addToast = useAppStore((s) => s.addToast);

  /* ---- Goals State ---- */
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [goalSearch, setGoalSearch] = useState('');
  const [goalStatusFilter, setGoalStatusFilter] = useState('all');
  const [editGoal, setEditGoal] = useState<SavingGoal | null>(null);
  const [editGoalOpen, setEditGoalOpen] = useState(false);
  const [newGoalStatus, setNewGoalStatus] = useState('');
  const [deleteGoal, setDeleteGoal] = useState<SavingGoal | null>(null);
  const [deleteGoalSubmitting, setDeleteGoalSubmitting] = useState(false);
  const [goalPage, setGoalPage] = useState(1);

  /* ---- Plans State ---- */
  const [plans, setPlans] = useState<AutoSavePlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [planFilter, setPlanFilter] = useState('all');
  const [planPage, setPlanPage] = useState(1);

  const goalPerPage = 10;
  const planPerPage = 10;

  /* ---- Fetch Goals ---- */
  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/goals');
      if (res.ok) {
        const data = await res.json();
        setGoals(Array.isArray(data) ? data : data.goals || MOCK_GOALS);
      } else {
        setGoals(MOCK_GOALS);
      }
    } catch {
      setGoals(MOCK_GOALS);
    }
    setGoalsLoading(false);
  }, []);

  /* ---- Fetch Plans ---- */
  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/autosave-plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(Array.isArray(data) ? data : data.plans || MOCK_PLANS);
      } else {
        setPlans(MOCK_PLANS);
      }
    } catch {
      setPlans(MOCK_PLANS);
    }
    setPlansLoading(false);
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);
  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  /* ---- Goals Filter / Paginate ---- */
  const filteredGoals = goals.filter((g) => {
    const q = goalSearch.toLowerCase();
    const matchSearch =
      !q ||
      (g.user.fullName || '').toLowerCase().includes(q) ||
      g.user.phone.includes(q);
    const matchStatus = goalStatusFilter === 'all' || g.status === goalStatusFilter;
    return matchSearch && matchStatus;
  });

  const goalTotalPages = Math.max(1, Math.ceil(filteredGoals.length / goalPerPage));
  const paginatedGoals = filteredGoals.slice((goalPage - 1) * goalPerPage, goalPage * goalPerPage);

  /* ---- Plans Filter / Paginate ---- */
  const filteredPlans = plans.filter((p) => {
    if (planFilter === 'active') return p.isActive;
    if (planFilter === 'inactive') return !p.isActive;
    return true;
  });

  const planTotalPages = Math.max(1, Math.ceil(filteredPlans.length / planPerPage));
  const paginatedPlans = filteredPlans.slice((planPage - 1) * planPerPage, planPage * planPerPage);

  /* ---- Handlers ---- */
  const openEditGoalDialog = (goal: SavingGoal) => {
    setEditGoal(goal);
    setNewGoalStatus(goal.status);
    setEditGoalOpen(true);
  };

  const handleUpdateGoalStatus = async () => {
    if (!editGoal || !newGoalStatus) return;
    try {
      const res = await fetch(`/api/admin/goals/${editGoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newGoalStatus }),
      });
      if (res.ok) {
        addToast(`وضعیت هدف "${editGoal.title}" بروزرسانی شد`, 'success');
        setGoals((prev) => prev.map((g) => g.id === editGoal.id ? { ...g, status: newGoalStatus as SavingGoal['status'] } : g));
        setEditGoalOpen(false);
        setEditGoal(null);
      } else {
        addToast('خطا در بروزرسانی وضعیت هدف', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
  };

  const handleDeleteGoal = async () => {
    if (!deleteGoal) return;
    setDeleteGoalSubmitting(true);
    try {
      const res = await fetch(`/api/admin/goals/${deleteGoal.id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast(`هدف "${deleteGoal.title}" حذف شد`, 'success');
        setGoals((prev) => prev.filter((g) => g.id !== deleteGoal.id));
        setDeleteGoal(null);
      } else {
        addToast('خطا در حذف هدف', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setDeleteGoalSubmitting(false);
    }
  };

  const handleTogglePlan = async (plan: AutoSavePlan) => {
    try {
      const res = await fetch(`/api/admin/autosave-plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      if (res.ok) {
        addToast(plan.isActive ? 'پلن غیرفعال شد' : 'پلن فعال شد', 'success');
        setPlans((prev) => prev.map((p) => p.id === plan.id ? { ...p, isActive: !p.isActive } : p));
      } else {
        addToast('خطا در تغییر وضعیت پلن', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
  };

  /* ---- Render ---- */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-to-br from-gold/25 to-gold/10 flex items-center justify-center border border-gold/20">
          <Target className="size-5 text-gold" />
        </div>
        <div>
          <h2 className="text-lg font-bold">مدیریت اهداف و پس‌انداز</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            مشاهده و مدیریت اهداف پس‌انداز و پلن‌های خرید خودکار کاربران
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="goals" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 h-auto">
          <TabsTrigger value="goals" className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold text-sm">
            <Target className="size-4 ml-1.5" />
            اهداف پس‌انداز
            <Badge className="bg-gold/15 text-gold text-[10px] mr-1.5">
              {toPersianDigits(String(filteredGoals.length))}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="autosave" className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold text-sm">
            <PiggyBank className="size-4 ml-1.5" />
            پس‌انداز خودکار
            <Badge className="bg-gold/15 text-gold text-[10px] mr-1.5">
              {toPersianDigits(String(filteredPlans.length))}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ═══ Tab 1: Saving Goals ═══ */}
        <TabsContent value="goals" className="space-y-4">
          {/* Filters */}
          <Card className="glass-gold">
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={goalSearch}
                    onChange={(e) => { setGoalSearch(e.target.value); setGoalPage(1); }}
                    placeholder="جستجوی نام یا شماره تلفن کاربر..."
                    className="pr-9"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'active', 'completed', 'paused'].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={goalStatusFilter === s ? 'default' : 'outline'}
                      onClick={() => { setGoalStatusFilter(s); setGoalPage(1); }}
                      className={cn(
                        goalStatusFilter === s
                          ? 'bg-gold text-black font-bold'
                          : 'border-gold/20 text-muted-foreground hover:text-gold hover:bg-gold/10',
                        'text-xs'
                      )}
                    >
                      {s === 'all' ? 'همه' : STATUS_CONFIG[s]?.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goals Table */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">کاربر</TableHead>
                      <TableHead className="text-xs">عنوان هدف</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">هدف (گرم)</TableHead>
                      <TableHead className="text-xs min-w-[140px]">پیشرفت</TableHead>
                      <TableHead className="text-xs">وضعیت</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">مهلت</TableHead>
                      <TableHead className="text-xs text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {goalsLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={7}><Skeleton className="h-12 w-full" /></TableCell>
                          </TableRow>
                        ))
                      : paginatedGoals.map((goal) => {
                          const progress = goal.targetGrams > 0 ? (goal.currentGrams / goal.targetGrams) * 100 : 0;
                          const statusCfg = STATUS_CONFIG[goal.status] || STATUS_CONFIG.active;
                          const StatusIcon = statusCfg.icon;
                          return (
                            <TableRow key={goal.id} className="hover:bg-gold/5 transition-colors">
                              {/* User */}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="size-8 shrink-0 rounded-full bg-gold/15 flex items-center justify-center text-xs font-bold text-gold">
                                    {(goal.user.fullName || goal.user.phone).charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{goal.user.fullName || 'بدون نام'}</p>
                                    <p className="text-[10px] text-muted-foreground truncate" dir="ltr">{goal.user.phone}</p>
                                  </div>
                                </div>
                              </TableCell>
                              {/* Title */}
                              <TableCell className="text-sm font-medium">{goal.title}</TableCell>
                              {/* Target Grams */}
                              <TableCell className="hidden md:table-cell text-xs" dir="ltr">
                                <span className="gold-gradient-text font-bold">{toPersianDigits(goal.currentGrams.toFixed(1))}</span>
                                <span className="text-muted-foreground"> / {toPersianDigits(goal.targetGrams.toFixed(1))} گرم</span>
                              </TableCell>
                              {/* Progress */}
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={cn(
                                        'h-full rounded-full transition-all duration-500',
                                        progress >= 100 ? 'bg-gradient-to-l from-gold to-yellow-500' : 'bg-gold/60'
                                      )}
                                      style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground text-center" dir="ltr">
                                    {toPersianDigits(progress.toFixed(0))}٪ — {formatToman(goal.currentFiat)}
                                  </p>
                                </div>
                              </TableCell>
                              {/* Status */}
                              <TableCell>
                                <Badge className={cn('text-[10px]', statusCfg.bg, statusCfg.color)}>
                                  <StatusIcon className="size-3 ml-1" />
                                  {statusCfg.label}
                                </Badge>
                              </TableCell>
                              {/* Deadline */}
                              <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                                {goal.deadline ? (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    {new Date(goal.deadline).toLocaleDateString('fa-IR')}
                                  </div>
                                ) : '—'}
                              </TableCell>
                              {/* Actions */}
                              <TableCell>
                                <div className="flex items-center justify-center gap-0.5">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-7 text-muted-foreground hover:text-gold"
                                    onClick={() => openEditGoalDialog(goal)}
                                    title="تغییر وضعیت"
                                  >
                                    <Pencil className="size-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                    onClick={() => setDeleteGoal(goal)}
                                    title="حذف"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}

                    {!goalsLoading && paginatedGoals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <Target className="size-10 mx-auto mb-2 opacity-20" />
                          <p className="text-sm text-muted-foreground">هدفی یافت نشد</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Pagination */}
          {goalTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm" variant="outline" disabled={goalPage <= 1}
                onClick={() => setGoalPage((p) => p - 1)}
                className="border-gold/20 text-gold hover:bg-gold/10"
              >
                <ChevronRight className="size-4" /> قبلی
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {toPersianDigits(String(goalPage))} از {toPersianDigits(String(goalTotalPages))}
              </span>
              <Button
                size="sm" variant="outline" disabled={goalPage >= goalTotalPages}
                onClick={() => setGoalPage((p) => p + 1)}
                className="border-gold/20 text-gold hover:bg-gold/10"
              >
                بعدی <ChevronLeft className="size-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ═══ Tab 2: Auto Save Plans ═══ */}
        <TabsContent value="autosave" className="space-y-4">
          {/* Filters */}
          <Card className="glass-gold">
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="size-4 text-gold" />
                  <span className="text-sm font-medium">فیلتر:</span>
                </div>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'همه' },
                    { value: 'active', label: 'فعال' },
                    { value: 'inactive', label: 'غیرفعال' },
                  ].map((f) => (
                    <Button
                      key={f.value}
                      size="sm"
                      variant={planFilter === f.value ? 'default' : 'outline'}
                      onClick={() => { setPlanFilter(f.value); setPlanPage(1); }}
                      className={cn(
                        planFilter === f.value
                          ? 'bg-gold text-black font-bold'
                          : 'border-gold/20 text-muted-foreground hover:text-gold hover:bg-gold/10',
                        'text-xs'
                      )}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
                <div className="mr-auto">
                  <Badge className="bg-gold/15 text-gold text-xs">
                    {toPersianDigits(String(filteredPlans.length))} پلن
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plans Table */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">کاربر</TableHead>
                      <TableHead className="text-xs">مبلغ</TableHead>
                      <TableHead className="text-xs">تکرار</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">دفعات اجرا</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">طلای خریداری شده</TableHead>
                      <TableHead className="text-xs">وضعیت</TableHead>
                      <TableHead className="text-xs text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plansLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={7}><Skeleton className="h-12 w-full" /></TableCell>
                          </TableRow>
                        ))
                      : paginatedPlans.map((plan) => {
                          const freqCfg = FREQUENCY_CONFIG[plan.frequency] || FREQUENCY_CONFIG.daily;
                          return (
                            <TableRow key={plan.id} className="hover:bg-gold/5 transition-colors">
                              {/* User */}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="size-8 shrink-0 rounded-full bg-gold/15 flex items-center justify-center text-xs font-bold text-gold">
                                    {(plan.user.fullName || plan.user.phone).charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{plan.user.fullName || 'بدون نام'}</p>
                                    <p className="text-[10px] text-muted-foreground truncate" dir="ltr">{plan.user.phone}</p>
                                  </div>
                                </div>
                              </TableCell>
                              {/* Amount */}
                              <TableCell className="text-sm font-medium" dir="ltr">
                                {formatToman(plan.amount)}
                              </TableCell>
                              {/* Frequency */}
                              <TableCell>
                                <Badge className={cn('text-[10px]', freqCfg.bg, freqCfg.color)}>
                                  <Repeat className="size-3 ml-1" />
                                  {freqCfg.label}
                                </Badge>
                              </TableCell>
                              {/* Executions */}
                              <TableCell className="hidden md:table-cell text-xs" dir="ltr">
                                {toPersianDigits(String(plan.totalExecutions))} بار
                              </TableCell>
                              {/* Gold Bought */}
                              <TableCell className="hidden md:table-cell text-xs" dir="ltr">
                                <span className="gold-gradient-text font-bold">{toPersianDigits(plan.totalGoldBought.toFixed(3))}</span>
                                <span className="text-muted-foreground"> گرم</span>
                              </TableCell>
                              {/* Status */}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={plan.isActive}
                                    onCheckedChange={() => handleTogglePlan(plan)}
                                    className="data-[state=checked]:bg-gold"
                                  />
                                  <Badge className={cn(
                                    'text-[10px]',
                                    plan.isActive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-gray-400/15 text-gray-400'
                                  )}>
                                    {plan.isActive ? 'فعال' : 'غیرفعال'}
                                  </Badge>
                                </div>
                              </TableCell>
                              {/* Actions */}
                              <TableCell>
                                <div className="flex items-center justify-center">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-7 text-muted-foreground hover:text-gold"
                                    title="مشاهده جزئیات"
                                  >
                                    <Eye className="size-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}

                    {!plansLoading && paginatedPlans.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <PiggyBank className="size-10 mx-auto mb-2 opacity-20" />
                          <p className="text-sm text-muted-foreground">پلنی یافت نشد</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Pagination */}
          {planTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm" variant="outline" disabled={planPage <= 1}
                onClick={() => setPlanPage((p) => p - 1)}
                className="border-gold/20 text-gold hover:bg-gold/10"
              >
                <ChevronRight className="size-4" /> قبلی
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {toPersianDigits(String(planPage))} از {toPersianDigits(String(planTotalPages))}
              </span>
              <Button
                size="sm" variant="outline" disabled={planPage >= planTotalPages}
                onClick={() => setPlanPage((p) => p + 1)}
                className="border-gold/20 text-gold hover:bg-gold/10"
              >
                بعدی <ChevronLeft className="size-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ Edit Goal Dialog ═══ */}
      <Dialog open={editGoalOpen} onOpenChange={(open) => { if (!open) setEditGoal(null); setEditGoalOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-5 text-gold" />
              تغییر وضعیت هدف
            </DialogTitle>
            <DialogDescription>
              {editGoal ? `هدف: ${editGoal.title}` : ''}
            </DialogDescription>
          </DialogHeader>
          {editGoal && (
            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <User className="size-4 text-gold" />
                  <span className="text-sm font-medium">{editGoal.user.fullName || 'بدون نام'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>هدف: {toPersianDigits(editGoal.targetGrams.toFixed(1))} گرم</span>
                  <span>وضعیت فعلی: {STATUS_CONFIG[editGoal.status]?.label}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">وضعیت جدید</Label>
                <Select value={newGoalStatus} onValueChange={setNewGoalStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="completed">تکمیل شده</SelectItem>
                    <SelectItem value="paused">متوقف</SelectItem>
                    <SelectItem value="expired">منقضی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditGoalOpen(false)} className="border-gold/20 text-gold hover:bg-gold/10">
              انصراف
            </Button>
            <Button
              onClick={handleUpdateGoalStatus}
              className="bg-gradient-to-l from-gold to-yellow-500 text-black font-bold hover:from-gold/90 hover:to-yellow-500/90"
            >
              بروزرسانی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Goal Confirmation ═══ */}
      <AlertDialog open={!!deleteGoal} onOpenChange={(open) => { if (!open) setDeleteGoal(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="size-5 text-red-500" />
              حذف هدف پس‌انداز
            </AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف هدف <span className="font-bold text-foreground">"{deleteGoal?.title}"</span> مطمئن هستید؟
              این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-gold/20 text-gold hover:bg-gold/10">انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGoal}
              disabled={deleteGoalSubmitting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {deleteGoalSubmitting && <Loader2 className="size-4 ml-1.5 animate-spin" />}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

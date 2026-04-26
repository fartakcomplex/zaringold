'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  Flame,
  Gift,
  Trophy,
  Star,
  CheckCircle2,
  Lock,
  CalendarDays,
  Zap,
  Crown,
  Sparkles,
  PartyPopper,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { usePageEvent } from '@/hooks/use-page-event';
import { useTranslation } from '@/lib/i18n';
import { formatNumber } from '@/lib/helpers';

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

const pulseBtnVariants = {
  available: {
    scale: [1, 1.04, 1],
    boxShadow: [
      '0 0 0 0 oklch(0.75 0.15 85 / 40%)',
      '0 0 0 12px oklch(0.75 0.15 85 / 0%)',
      '0 0 0 0 oklch(0.75 0.15 85 / 0%)',
    ],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
  unavailable: {},
};

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                           */
/* ═══════════════════════════════════════════════════════════════ */

type DayState = 'claimed' | 'available' | 'locked';

interface DayReward {
  day: number;
  reward: string;
  rewardType: 'xp' | 'gold' | 'badge';
  state: DayState;
}

interface CheckInStatus {
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  weekDays: DayReward[];
  checkedInToday: boolean;
  todayReward: string;
  todayRewardType: 'xp' | 'gold' | 'badge';
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Constants                                                       */
/* ═══════════════════════════════════════════════════════════════ */

const MILESTONE_REWARDS = [
  { day: 7, reward: '۱۰۰ میلی‌گرم طلای رایگان', icon: <Gift className="size-5 text-gold" /> },
  { day: 14, reward: '۵۰۰ XP + نشان طلایی', icon: <Crown className="size-5 text-gold" /> },
  { day: 30, reward: '۵۰۰ میلی‌گرم طلای رایگان + ویژه‌نامه', icon: <Trophy className="size-5 text-gold" /> },
];

/* ═══════════════════════════════════════════════════════════════ */
/*  Confetti Particle                                               */
/* ═══════════════════════════════════════════════════════════════ */

function ConfettiBurst({ show }: { show: boolean }) {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 300,
    y: -(Math.random() * 200 + 50),
    rotate: Math.random() * 720,
    scale: Math.random() * 0.5 + 0.5,
    color: ['#D4AF37', '#F0D060', '#B8960C', '#FFD700', '#FFA500'][i % 5],
    delay: Math.random() * 0.3,
  }));

  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 0 }}
              animate={{
                opacity: [1, 1, 0],
                x: p.x,
                y: p.y,
                rotate: p.rotate,
                scale: [0, p.scale, p.scale],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, delay: p.delay, ease: 'easeOut' }}
              className="absolute size-2 rounded-sm"
              style={{ backgroundColor: p.color }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                 */
/* ═══════════════════════════════════════════════════════════════ */

function CheckInSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 py-4">
        <Skeleton className="size-16 rounded-2xl" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Card><CardContent className="p-5">
        <div className="flex gap-3 justify-center">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="size-16 rounded-xl" />
          ))}
        </div>
      </CardContent></Card>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4 space-y-2"><Skeleton className="h-3 w-12" /><Skeleton className="h-5 w-16" /></CardContent></Card>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Component                                                   */
/* ═══════════════════════════════════════════════════════════════ */

export default function DailyCheckIn() {
  const { t } = useTranslation();
  const { user, addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<CheckInStatus | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rewardDetailOpen, setRewardDetailOpen] = useState(false);
  const checkInBtnRef = useRef<HTMLDivElement>(null);

  /* ── Quick Action Event Listeners ── */
  usePageEvent('checkin', () => {
    checkInBtnRef.current?.querySelector('button')?.click();
  });
  usePageEvent('reward', () => setRewardDetailOpen(true));
  usePageEvent('streak', () => addToast('وضعیت استریک: ' + (status?.currentStreak || 0) + ' روز', 'info'));

  /* ── Build weekDays from streak data ── */
  const buildWeekDays = useCallback((streak: number, checkedToday: boolean): DayReward[] => {
    const rawWeek: { reward: string; rewardType: 'xp' | 'gold' | 'badge' }[] = [
      { reward: '۲۰ XP', rewardType: 'xp' },
      { reward: '۳۰ XP', rewardType: 'xp' },
      { reward: '۵۰ XP', rewardType: 'xp' },
      { reward: '۲۰ mg طلا', rewardType: 'gold' },
      { reward: '۱۰۰ XP', rewardType: 'xp' },
      { reward: '۳۰ mg طلا', rewardType: 'gold' },
      { reward: '۱۰۰ mg طلا', rewardType: 'gold' },
    ];
    const currentDay = checkedToday ? streak : streak + 1;
    return rawWeek.map((d, i) => ({
      day: i + 1,
      reward: d.reward,
      rewardType: d.rewardType,
      state: (i + 1 < currentDay ? 'claimed' : i + 1 === currentDay ? 'available' : 'locked') as DayState,
    }));
  }, []);

  /* ── Fetch status ── */
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/gamification/checkin/status?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        const streak = data.currentStreak ?? 0;
        const checked = data.checkedInToday ?? false;
        const nextReward = data.nextReward ?? { label: '۵۰ XP', type: 'xp' };
        setStatus({
          currentStreak: streak,
          longestStreak: data.longestStreak ?? streak,
          totalXP: (data.totalCheckIns ?? 0) * 50,
          checkedInToday: checked,
          todayReward: nextReward.label ?? '۵۰ XP',
          todayRewardType: (nextReward.type === 'gold' ? 'gold' : 'xp') as 'xp' | 'gold' | 'badge',
          weekDays: buildWeekDays(streak, checked),
        });
      } else {
        // Mock fallback
        setStatus({
          currentStreak: 3,
          longestStreak: 12,
          totalXP: 1450,
          checkedInToday: false,
          todayReward: '۵۰ XP',
          todayRewardType: 'xp',
          weekDays: [
            { day: 1, reward: '۲۰ XP', rewardType: 'xp', state: 'claimed' },
            { day: 2, reward: '۳۰ XP', rewardType: 'xp', state: 'claimed' },
            { day: 3, reward: '۵۰ XP', rewardType: 'xp', state: 'claimed' },
            { day: 4, reward: '۲۰ mg طلا', rewardType: 'gold', state: 'available' },
            { day: 5, reward: '۱۰۰ XP', rewardType: 'xp', state: 'locked' },
            { day: 6, reward: '۳۰ mg طلا', rewardType: 'gold', state: 'locked' },
            { day: 7, reward: '۱۰۰ mg طلا', rewardType: 'gold', state: 'locked' },
          ],
        });
      }
    } catch {
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, buildWeekDays]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  /* ── Handle check-in ── */
  const handleCheckIn = async () => {
    if (!status || status.checkedInToday) return;
    setCheckingIn(true);
    try {
      const res = await fetch('/api/gamification/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (res.ok) {
        setShowConfetti(true);
        addToast(`حضور ثبت شد! ${status.todayReward} دریافت کردید`, 'success');
        setTimeout(() => setShowConfetti(false), 1500);
        fetchStatus();
      } else {
        addToast('خطا در ثبت حضور', 'error');
      }
    } catch {
      addToast('خطای شبکه', 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  /* ═══════════════════════════════════════════════════════════════ */
  /*  Render                                                          */
  /* ═══════════════════════════════════════════════════════════════ */

  if (isLoading) return <CheckInSkeleton />;

  if (!status) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted mx-auto">
          <CalendarDays className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">اطلاعات حضور روزانه در دسترس نیست</p>
      </div>
    );
  }

  return (
    <motion.div className="mx-auto max-w-2xl space-y-6 relative" variants={containerVariants} initial="hidden" animate="show">
      <ConfettiBurst show={showConfetti} />

      {/* ── Hero ── */}
      <motion.div className="flex flex-col items-center gap-3 py-4 text-center" variants={itemVariants}>
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gold/10 shadow-lg shadow-gold/10">
          <CalendarDays className="size-7 text-gold" />
        </div>
        <div>
          <h2 className="gold-gradient-text text-2xl font-extrabold">حضور روزانه</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            هر روز حضور ثبت کنید و جوایز طلایی دریافت کنید
          </p>
        </div>
      </motion.div>

      {/* ── Check-in Button ── */}
      <motion.div className="flex justify-center" variants={itemVariants} ref={checkInBtnRef}>
        <motion.div
          variants={pulseBtnVariants}
          animate={!status.checkedInToday ? 'available' : 'unavailable'}
        >
          <Button
            size="lg"
            className={`relative h-16 w-56 rounded-2xl text-base font-bold shadow-lg transition-all ${
              status.checkedInToday
                ? 'bg-muted text-muted-foreground'
                : 'bg-gradient-to-l from-gold-dark via-gold to-gold-light text-gold-dark hover:shadow-gold/30'
            }`}
            disabled={status.checkedInToday || checkingIn}
            onClick={handleCheckIn}
          >
            {status.checkedInToday ? (
              <>
                <CheckCircle2 className="ml-2 size-5" />
                امروز ثبت شد ✓
              </>
            ) : checkingIn ? (
              'در حال ثبت...'
            ) : (
              <>
                <Zap className="ml-2 size-5" />
                ثبت حضور امروز
                <div className="absolute -top-2 -left-2 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold-dark">
                  {status.todayReward}
                </div>
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>

      {/* ── 7-Day Streak Calendar ── */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-gold/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Flame className="size-4 text-orange-500" />
              تقویم حضور هفتگی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {status.weekDays.map((day) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: day.day * 0.06 }}
                  className={`relative flex min-w-[72px] flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                    day.state === 'claimed'
                      ? 'border-gold/30 bg-gold/10'
                      : day.state === 'available'
                      ? 'border-gold bg-gold/5 glow-pulse-border'
                      : 'border-border bg-muted/30'
                  }`}
                >
                  {/* Day number */}
                  <span className={`text-xs font-medium ${
                    day.state === 'claimed' ? 'text-gold' : day.state === 'available' ? 'text-foreground font-bold' : 'text-muted-foreground'
                  }`}>
                    روز {formatNumber(day.day)}
                  </span>

                  {/* Icon */}
                  <div className={`flex size-8 items-center justify-center rounded-full ${
                    day.state === 'claimed' ? 'bg-gold/20' : day.state === 'available' ? 'bg-gold/10' : 'bg-muted'
                  }`}>
                    {day.state === 'claimed' ? (
                      <CheckCircle2 className="size-4 text-gold" />
                    ) : day.state === 'available' ? (
                      day.rewardType === 'gold' ? (
                        <Gift className="size-4 text-gold" />
                      ) : (
                        <Star className="size-4 text-gold" />
                      )
                    ) : (
                      <Lock className="size-3.5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Reward text */}
                  <span className={`text-[10px] text-center font-medium ${
                    day.state === 'claimed' ? 'text-gold' : day.state === 'available' ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {day.reward}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Stats Row ── */}
      <motion.div className="grid grid-cols-3 gap-4" variants={itemVariants}>
        {/* Current Streak */}
        <Card className="overflow-hidden border-border/50">
          <CardContent className="p-4 text-center">
            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <Flame className="size-5 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground">استریک فعلی</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">{formatNumber(status.currentStreak)}</p>
            <p className="text-[10px] text-muted-foreground">روز متوالی</p>
          </CardContent>
        </Card>

        {/* Longest Streak */}
        <Card className="overflow-hidden border-border/50">
          <CardContent className="p-4 text-center">
            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Trophy className="size-5 text-purple-500" />
            </div>
            <p className="text-xs text-muted-foreground">بیشترین استریک</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">{formatNumber(status.longestStreak)}</p>
            <p className="text-[10px] text-muted-foreground">روز متوالی</p>
          </CardContent>
        </Card>

        {/* Total XP */}
        <Card className="overflow-hidden border-gold/20 bg-gradient-to-br from-gold/5 to-transparent">
          <CardContent className="p-4 text-center">
            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl bg-gold/15">
              <Zap className="size-5 text-gold" />
            </div>
            <p className="text-xs text-muted-foreground">مجموع XP</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums gold-gradient-text">{formatNumber(status.totalXP)}</p>
            <p className="text-[10px] text-muted-foreground">امتیاز کسب شده</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Milestone Rewards ── */}
      <motion.div variants={itemVariants}>
        <Dialog open={rewardDetailOpen} onOpenChange={setRewardDetailOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer overflow-hidden transition-all hover:border-gold/30 hover:bg-gold/[0.02]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-gold" />
                    <span className="text-sm font-bold text-foreground">جوایز ویژه استریک‌ها</span>
                  </div>
                  <Badge variant="secondary" className="bg-gold/10 text-gold text-[10px]">
                    مشاهده جزئیات
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <PartyPopper className="size-4 text-gold" />
                جوایز ویژه استریک‌ها
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              {MILESTONE_REWARDS.map((milestone) => (
                <div
                  key={milestone.day}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    status.currentStreak >= milestone.day
                      ? 'border-gold/30 bg-gold/10'
                      : status.currentStreak >= milestone.day - 3
                      ? 'border-gold/15 bg-gold/5'
                      : 'border-border/50 bg-muted/30'
                  }`}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/10">
                    {milestone.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">روز {formatNumber(milestone.day)}</span>
                      {status.currentStreak >= milestone.day && (
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{milestone.reward}</p>
                  </div>
                </div>
              ))}
              <div className="rounded-xl border border-gold/15 bg-gold/5 p-3">
                <div className="flex gap-2">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-gold/70" />
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    با ثبت حضور هر روز، استریک شما افزایش می‌یابد. در روزهای ۷، ۱۴ و ۳۰ جوایز ویژه دریافت خواهید کرد.
                    اگر یک روز حضور ثبت نکنید، استریک صفر می‌شود.
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </motion.div>
  );
}

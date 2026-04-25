'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  Users,
  PiggyBank,
  Trophy,
  Copy,
  Check,
  Clock,
  Star,
  Crown,
  Medal,
  Gift,
  TrendingUp,
  Zap,
  ArrowUpRight,
  GiftIcon,
  Lock,
  CalendarCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppStore } from '@/lib/store';
import { usePageEvent } from '@/hooks/use-page-event';
import {
  formatToman,
  formatGrams,
  formatNumber,
  formatPrice,
} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Animation Variants                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Data                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Challenge {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  reward: string;
  rewardType: string;
  level: string;
}

const MOCK_CHALLENGES: Challenge[] = [
  {
    id: 'ch-1',
    title: 'خرید اول',
    current: 0,
    target: 1,
    unit: 'خرید',
    reward: '۰.۰۱۵ گرم طلا',
    rewardType: 'gold',
    level: 'مبتدی',
  },
  {
    id: 'ch-2',
    title: 'معاملهگر فعال',
    current: 3,
    target: 5,
    unit: 'معامله',
    reward: '۰.۰۱۰ گرم طلا',
    rewardType: 'gold',
    level: 'متوسط',
  },
  {
    id: 'ch-3',
    title: 'حجم بالا',
    current: 12000000,
    target: 20000000,
    unit: 'گرم طلا',
    reward: '۰.۰۵۰ گرم طلا',
    rewardType: 'gold',
    level: 'حرفه‌ای',
  },
];

interface RewardHistory {
  id: string;
  type: string;
  typeLabel: string;
  amount: string;
  date: string;
  status: 'success' | 'pending' | 'expired';
}

const MOCK_REWARDS: RewardHistory[] = [
  { id: 'r-1', type: 'referral', typeLabel: 'جایزه دعوت', amount: '۰.۰۰۱۵ گرم طلا', date: '۱۴۰۳/۰۸/۱۵', status: 'success' },
  { id: 'r-2', type: 'challenge', typeLabel: 'چالش هفتگی', amount: '۰.۰۱۰ گرم', date: '۱۴۰۳/۰۸/۱۲', status: 'success' },
  { id: 'r-3', type: 'savings_bonus', typeLabel: 'پاداش پس‌انداز', amount: '۰.۰۲۵ گرم', date: '۱۴۰۳/۰۸/۰۱', status: 'success' },
  { id: 'r-4', type: 'referral', typeLabel: 'جایزه دعوت', amount: '۰.۰۰۱۵ گرم طلا', date: '۱۴۰۳/۰۷/۲۸', status: 'success' },
  { id: 'r-5', type: 'commission', typeLabel: 'کمیسیون معاملات', amount: '۰.۰۰۴ گرم طلا', date: '۱۴۰۳/۰۷/۲۵', status: 'success' },
  { id: 'r-6', type: 'challenge', typeLabel: 'چالش هفتگی', amount: '۰.۰۰۵ گرم', date: '۱۴۰۳/۰۷/۲۰', status: 'success' },
  { id: 'r-7', type: 'referral', typeLabel: 'جایزه دعوت', amount: '۰.۰۰۱۵ گرم طلا', date: '۱۴۰۳/۰۷/۱۸', status: 'pending' },
  { id: 'r-8', type: 'savings_bonus', typeLabel: 'پاداش پس‌انداز', amount: '۰.۰۱۵ گرم', date: '۱۴۰۳/۰۷/۰۱', status: 'success' },
];

interface LeaderboardEntry {
  rank: number;
  name: string;
  referrals: number;
  totalEarned: string;
  isCurrentUser?: boolean;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'علی محمدی', referrals: 47, totalEarned: '۰.۸۵ گرم طلا' },
  { rank: 2, name: 'سارا احمدی', referrals: 38, totalEarned: '۰.۶۴ گرم طلا' },
  { rank: 3, name: 'رضا کریمی', referrals: 31, totalEarned: '۰.۵۲ گرم طلا' },
  { rank: 4, name: 'مریم حسینی', referrals: 24, totalEarned: '۰.۴۰ گرم طلا' },
  { rank: 5, name: 'محمد رضایی', referrals: 19, totalEarned: '۰.۲۹ گرم طلا' },
  { rank: 12, name: 'شما', referrals: 5, totalEarned: '۰.۰۵۵ گرم طلا', isCurrentUser: true },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeletons                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function HeroSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <Skeleton className="size-16 rounded-2xl" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-5 w-72" />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper Functions                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getStatusBadge(status: string) {
  switch (status) {
    case 'success':
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 text-[10px]">دریافت شده</Badge>;
    case 'pending':
      return <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 text-[10px]">در انتظار</Badge>;
    case 'expired':
      return <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 text-[10px]">منقضی</Badge>;
    default:
      return null;
  }
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="size-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="size-5 text-gray-400" />;
  if (rank === 3) return <Medal className="size-5 text-amber-700" />;
  return <span className="flex size-5 items-center justify-center text-xs font-bold text-muted-foreground">{formatNumber(rank)}</span>;
}

function getChallengeProgress(challenge: Challenge): number {
  if (challenge.target === 0) return 0;
  return Math.min(100, Math.round((challenge.current / challenge.target) * 100));
}

function formatChallengeProgress(challenge: Challenge): string {
  if (challenge.unit === 'گرم طلا') {
    return `${formatNumber(challenge.current)}/${formatNumber(challenge.target)} گرم طلا`;
  }
  return `${formatNumber(challenge.current)}/${formatNumber(challenge.target)} ${challenge.unit}`;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Countdown Timer                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ChallengeCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Calculate time until next Saturday midnight (Iran time approximation)
    const getNextReset = () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat
      const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
      const nextSat = new Date(now);
      nextSat.setDate(now.getDate() + daysUntilSaturday);
      nextSat.setHours(23, 59, 59, 999);
      return nextSat.getTime() - now.getTime();
    };

    const calculateTime = () => {
      const diff = getNextReset();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Clock className="size-4 text-gold" />
      <span className="text-xs text-muted-foreground">ریست بعدی:</span>
      <div className="flex items-center gap-1 text-xs font-bold tabular-nums text-gold">
        {timeLeft.days > 0 && (
          <>
            <span className="rounded bg-gold/10 px-1.5 py-0.5">{formatNumber(timeLeft.days)} روز</span>
            <span className="text-muted-foreground">:</span>
          </>
        )}
        <span className="rounded bg-gold/10 px-1.5 py-0.5">{formatNumber(timeLeft.hours)} ساعت</span>
        <span className="text-muted-foreground">:</span>
        <span className="rounded bg-gold/10 px-1.5 py-0.5">{formatNumber(timeLeft.minutes)} دقیقه</span>
        <span className="text-muted-foreground">:</span>
        <span className="rounded bg-gold/10 px-1.5 py-0.5">{formatNumber(timeLeft.seconds)} ثانیه</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function EarnView() {
  const { user, addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rewards');
  const [copied, setCopied] = useState(false);

  /* ── Quick Action Event Listeners ── */
  usePageEvent('tasks', () => { addToast('چالش‌ها و وظایف', 'info'); });

  const referralCode = user?.referralCode || 'ZRGOLD';
  const referralLink = `https://zarringold.ir/ref/${referralCode}`;

  /* ── Loading Simulation ── */
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  /* ── Copy referral link ── */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = referralLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                  */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <motion.div
      className="mx-auto max-w-6xl space-y-6 pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ──────────────────────────────────────────────────────── */}
      {/*  Hero Section                                          */}
      {/* ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <HeroSkeleton />
      ) : (
        <motion.div
          className="flex flex-col items-center gap-4 py-6 text-center sm:py-8"
          variants={itemVariants}
        >
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gold/10 shadow-lg shadow-gold/10">
            <Trophy className="size-8 text-gold" />
          </div>
          <div>
            <h2 className="gold-gradient-text text-2xl font-extrabold sm:text-3xl">
              کسب درآمد
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              راه‌های مختلف برای کسب درآمد و دریافت جوایز در زرین گلد
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <div className="flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/5 px-3 py-1.5">
              <Users className="size-3.5 text-gold" />
              <span className="text-xs font-medium text-gold">دعوت دوستان</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/5 px-3 py-1.5">
              <PiggyBank className="size-3.5 text-gold" />
              <span className="text-xs font-medium text-gold">پس‌انداز طلایی</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/5 px-3 py-1.5">
              <Zap className="size-3.5 text-gold" />
              <span className="text-xs font-medium text-gold">چالش‌های هفتگی</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Stats Cards                                           */}
      {/* ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          variants={itemVariants}
        >
          {/* Total Earnings */}
          <Card className="card-gold-border overflow-hidden bg-gradient-to-br from-yellow-900/20 to-amber-900/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold/15">
                  <TrendingUp className="size-5 text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">مجموع درآمد شما</p>
                  <p className="text-gold-gradient mt-0.5 text-lg font-bold tabular-nums">
                    {formatToman(2850000)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">گرم طلا</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rewards Received */}
          <Card className="card-gold-border overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                  <Gift className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">جوایز دریافتی</p>
                  <p className="text-gold-gradient mt-0.5 text-lg font-bold tabular-nums">
                    {formatNumber(23)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">جایزه موفق</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invited Friends */}
          <Card className="card-gold-border overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
                  <Users className="size-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">دوستان دعوت شده</p>
                  <p className="text-gold-gradient mt-0.5 text-lg font-bold tabular-nums">
                    {formatNumber(5)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">نفر فعال</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Methods to Earn — 3 Cards                              */}
      {/* ──────────────────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
        variants={itemVariants}
      >
        {/* ── Card 1: Referral ── */}
        <Card className="overflow-hidden border-gold/20 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Users className="size-5 text-gold" />
              دعوت از دوستان
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Benefits */}
            <div className="space-y-2">
              <div className="flex items-start gap-2 rounded-lg border border-gold/15 bg-gold/5 p-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/20">
                  <GiftIcon className="size-3 text-gold" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">پاداش ثبت‌نام</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    دریافت <span className="font-bold text-gold">۰.۰۰۱۵ گرم طلا</span> برای هر دوستی که ثبت‌نام کند
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-gold/15 bg-gold/5 p-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/20">
                  <TrendingUp className="size-3 text-gold" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">کمیسیون معاملات</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    <span className="font-bold text-gold">۰.۱٪</span> کمیسیون از معاملات دوستانتان به مدت ۳ ماه
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Referral Link */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">لینک دعوت شما</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 truncate rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-foreground tabular-nums" dir="ltr">
                  {referralLink}
                </div>
                <Button
                  size="sm"
                  variant={copied ? 'default' : 'outline'}
                  className={copied ? 'bg-gold text-gold-dark hover:bg-gold/90 shrink-0' : 'shrink-0 border-gold/30 text-gold hover:bg-gold/5'}
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Referral Code */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">کد دعوت شما</label>
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2">
                <span className="text-sm font-bold tracking-wider text-foreground tabular-nums" dir="ltr">
                  {referralCode}
                </span>
                <Badge variant="secondary" className="bg-gold/10 text-gold text-[10px]">
                  یکتا
                </Badge>
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Referral Statistics */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">آمار دعوت</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border/50 p-2.5 text-center">
                  <p className="text-lg font-bold tabular-nums text-foreground">{formatNumber(5)}</p>
                  <p className="text-[10px] text-muted-foreground">ثبت‌نام موفق</p>
                </div>
                <div className="rounded-lg border border-border/50 p-2.5 text-center">
                  <p className="text-lg font-bold tabular-nums text-foreground">{formatNumber(3)}</p>
                  <p className="text-[10px] text-muted-foreground">فعال</p>
                </div>
                <div className="rounded-lg border border-border/50 p-2.5 text-center">
                  <p className="text-lg font-bold tabular-nums gold-gradient-text">{formatToman(25000)}</p>
                  <p className="text-[10px] text-muted-foreground">پاداش نقدی</p>
                </div>
                <div className="rounded-lg border border-border/50 p-2.5 text-center">
                  <p className="text-lg font-bold tabular-nums gold-gradient-text">{formatGrams(0.085)}</p>
                  <p className="text-[10px] text-muted-foreground">کمیسیون طلا</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Card 2: Gold Savings ── */}
        <Card className="overflow-hidden border-gold/20 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <PiggyBank className="size-5 text-gold" />
              پس‌انداز طلایی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Monthly Bonus */}
            <div className="rounded-lg border border-gold/15 bg-gold/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Star className="size-4 text-gold" />
                <span className="text-sm font-semibold text-foreground">پاداش ماهانه</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                در طرح‌های پس‌انداز <span className="font-bold text-gold">۶ ماهه و بیشتر</span>، ماهانه{' '}
                <span className="font-bold text-gold">۰.۰۵٪</span> طلای اضافی به عنوان پاداش دریافت کنید.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="bg-gold/10 text-gold text-[10px]">
                  تا ۰.۶٪ در سال
                </Badge>
              </div>
            </div>

            {/* Streak Bonus */}
            <div className="rounded-lg border border-gold/15 bg-gold/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Zap className="size-4 text-gold" />
                <span className="text-sm font-semibold text-foreground">پاداش پیوستگی</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                برای <span className="font-bold text-gold">۳ ماه متوالی</span> و بیشتر پس‌انداز مستمر، ماهانه{' '}
                <span className="font-bold text-gold">۰.۰۲٪</span> طلای اضافی دریافت کنید.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 text-[10px]">
                  فعال
                </Badge>
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Progress to next bonus */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-foreground">پیشرفت به پاداش بعدی</p>
                <Badge variant="secondary" className="bg-gold/10 text-gold text-[10px]">
                  ۶ ماهه
                </Badge>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">ماه‌های سپری شده</span>
                  <span className="font-bold tabular-nums text-gold">
                    {formatNumber(4)}/{formatNumber(6)} ماه
                  </span>
                </div>
                <Progress value={(4 / 6) * 100} className="h-2.5" />
                <p className="text-[10px] text-muted-foreground">
                  {formatNumber(2)} ماه دیگر تا فعال شدن پاداش ۰.۰۵٪ ماهانه
                </p>
              </div>
            </div>

            {/* Streak indicator */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">وضعیت پیوستگی</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((m) => (
                  <div
                    key={m}
                    className="flex size-8 items-center justify-center rounded-lg border text-[10px] font-bold tabular-nums"
                    style={{
                      borderColor: m <= 4 ? 'rgba(212, 175, 55, 0.4)' : undefined,
                      backgroundColor: m <= 4 ? 'rgba(212, 175, 55, 0.1)' : undefined,
                      color: m <= 4 ? '#D4AF37' : undefined,
                    }}
                  >
                    {formatNumber(m)}
                  </div>
                ))}
                <span className="ms-1 text-[10px] text-muted-foreground">/۶ ماه</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-500">
                <ArrowUpRight className="size-3" />
                <span>۴ ماه پیوسته — عالی هستید!</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Card 3: Weekly Challenges ── */}
        <Card className="overflow-hidden border-gold/20 lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Trophy className="size-5 text-gold" />
                چالش‌های هفتگی
              </CardTitle>
              <Badge variant="secondary" className="bg-gold/10 text-gold text-[10px]">
                {formatNumber(MOCK_CHALLENGES.length)} فعال
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Countdown */}
            <div className="rounded-lg border border-gold/15 bg-gold/5 p-3">
              <ChallengeCountdown />
            </div>

            {/* Challenges List */}
            <div className="space-y-3">
              {MOCK_CHALLENGES.map((challenge) => {
                const progress = getChallengeProgress(challenge);
                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      'rounded-xl border border-border/50 p-3 transition-all hover:border-gold/20',
                      'hover-lift-sm',
                      progress === 100 && 'card-glass-premium'
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                          <Trophy className="size-3.5 text-gold" />
                        </div>
                        <div>
                          <p className={cn('text-xs font-bold', progress === 100 ? 'text-success-gradient' : 'text-foreground')}>{challenge.title}</p>
                          <p className="text-[10px] text-muted-foreground">{challenge.level}</p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'badge-gold text-[10px]',
                          progress === 100 && 'badge-success-green'
                        )}
                      >
                        {challenge.reward}
                      </Badge>
                    </div>

                    {/* Progress */}
                    <div className="mt-2.5">
                      <div className="mb-1 flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">
                          {formatChallengeProgress(challenge)}
                        </span>
                        <span className="font-bold tabular-nums text-gold">
                          {formatNumber(progress)}٪
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Reward info */}
                    <div className="mt-2 flex items-center gap-1.5">
                      <GiftIcon className="size-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        جایزه: <span className={cn('font-medium', progress === 100 ? 'text-success-gradient' : 'text-gold-gradient')}>{challenge.reward}</span>
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Daily Check-in                                        */}
      {/* ──────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="card-glass-premium overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <CalendarCheck className="size-5 text-gold" />
                چک‌این روزانه
              </CardTitle>
              <Badge variant="secondary" className="badge-gold text-[10px]">
                ۵ از ۷
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              هر روز وارد شوید و جایزه بگیرید
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const isChecked = day <= 5;
                const isToday = day === 6;
                return (
                  <motion.div
                    key={day}
                    className="flex flex-col items-center gap-1.5"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: day * 0.05 }}
                  >
                    <div
                      className={cn(
                        'flex size-12 items-center justify-center rounded-full border-2 sm:size-14',
                        isChecked && 'badge-success-green border-emerald-300 dark:border-emerald-600',
                        isToday && 'badge-gold border-[#D4AF37] pulse-ring',
                        !isChecked && !isToday && 'border-border/50 bg-muted/30'
                      )}
                    >
                      {isChecked ? (
                        <Check className="size-5 text-white sm:size-6" />
                      ) : isToday ? (
                        <Gift className="size-5 text-[#D4AF37] sm:size-6" />
                      ) : (
                        <Lock className="size-4 text-muted-foreground/50 sm:size-5" />
                      )}
                    </div>
                    <span className={cn(
                      'text-[10px] font-bold tabular-nums',
                      isChecked && 'text-emerald-600 dark:text-emerald-400',
                      isToday && 'text-gold',
                      !isChecked && !isToday && 'text-muted-foreground/50'
                    )}>
                      روز {formatNumber(day)}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {formatNumber(day * 100)} گرم
                    </span>
                  </motion.div>
                );
              })}
            </div>
            {(() => {
              const checkedIn = true;
              return (
                <div className="mt-4 flex items-center justify-center">
                  <Button
                    size="sm"
                    disabled={checkedIn}
                    className={cn(
                      'gap-2',
                      checkedIn ? 'btn-success' : 'btn-gold-gradient'
                    )}
                  >
                    {checkedIn ? (
                      <>
                        <Check className="size-4" />
                        امروز چک‌این شد
                      </>
                    ) : (
                      <>
                        <CalendarCheck className="size-4" />
                        چک‌این امروز
                      </>
                    )}
                  </Button>
                </div>
              );
            })()}
            <p className="mt-3 text-center text-[10px] text-muted-foreground">
              با چک‌این ۷ روز متوالی، <span className="font-bold text-gold">۱,۰۰۰ گرم طلای رایگان</span> دریافت کنید!
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Rewards History & Leaderboard (Tabs)                   */}
      {/* ──────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-0">
              <TabsList className="w-full sm:w-fit">
                <TabsTrigger value="rewards" className={cn('flex-1 sm:flex-none gap-1.5 text-xs', activeTab === 'rewards' && 'tab-active-gold')}>
                  <Gift className="size-3.5" />
                  تاریخچه جوایز
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className={cn('flex-1 sm:flex-none gap-1.5 text-xs', activeTab === 'leaderboard' && 'tab-active-gold')}>
                  <Crown className="size-3.5" />
                  جدول رتبه‌بندی
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* ── Rewards History Tab ── */}
            <TabsContent value="rewards">
              <CardContent className="pt-4">
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-medium text-muted-foreground">نوع</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">مبلغ</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">تاریخ</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">وضعیت</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_REWARDS.map((reward) => (
                        <TableRow key={reward.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                                {reward.type === 'referral' && <Users className="size-3.5 text-gold" />}
                                {reward.type === 'challenge' && <Trophy className="size-3.5 text-gold" />}
                                {reward.type === 'savings_bonus' && <PiggyBank className="size-3.5 text-gold" />}
                                {reward.type === 'commission' && <TrendingUp className="size-3.5 text-gold" />}
                              </div>
                              <span className="text-xs font-medium text-foreground">{reward.typeLabel}</span>
                            </div>
                          </TableCell>
                          <TableCell className={cn(
                            'text-xs font-bold tabular-nums',
                            reward.status === 'success' ? 'text-success-gradient' : 'text-gold-gradient'
                          )}>{reward.amount}</TableCell>
                          <TableCell className="text-xs text-muted-foreground tabular-nums">{reward.date}</TableCell>
                          <TableCell>{getStatusBadge(reward.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="space-y-2 md:hidden">
                  {MOCK_REWARDS.map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center gap-3 rounded-xl border border-border/50 p-3 hover-lift-sm"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                        {reward.type === 'referral' && <Users className="size-4 text-gold" />}
                        {reward.type === 'challenge' && <Trophy className="size-4 text-gold" />}
                        {reward.type === 'savings_bonus' && <PiggyBank className="size-4 text-gold" />}
                        {reward.type === 'commission' && <TrendingUp className="size-4 text-gold" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground">{reward.typeLabel}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{reward.date}</p>
                      </div>
                      <div className="text-end">
                        <p className={cn(
                          'text-xs font-bold tabular-nums',
                          reward.status === 'success' ? 'text-success-gradient' : 'text-gold-gradient'
                        )}>{reward.amount}</p>
                        <div className="mt-0.5">{getStatusBadge(reward.status)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </TabsContent>

            {/* ── Leaderboard Tab ── */}
            <TabsContent value="leaderboard">
              <CardContent className="pt-4">
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-medium text-muted-foreground w-16">رتبه</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">نام</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">تعداد دعوت</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">مجموع درآمد</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_LEADERBOARD.map((entry) => (
                        <TableRow
                          key={entry.rank}
                          className={cn(
                            'table-row-hover-gold',
                            entry.isCurrentUser && 'bg-gold/5 border-gold/20'
                          )}
                        >
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {entry.rank <= 3 ? (
                                <Badge variant="secondary" className="badge-gold gap-1 text-sm">
                                  {entry.rank === 1 && '🥇'}
                                  {entry.rank === 2 && '🥈'}
                                  {entry.rank === 3 && '🥉'}
                                </Badge>
                              ) : (
                                getRankIcon(entry.rank)
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs font-medium ${entry.isCurrentUser ? 'text-gold font-bold' : 'text-foreground'}`}>
                              {entry.name}
                            </span>
                            {entry.isCurrentUser && (
                              <Badge variant="secondary" className="ms-2 bg-gold/10 text-gold text-[9px]">
                                شما
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-bold tabular-nums text-foreground">
                            {formatNumber(entry.referrals)} نفر
                          </TableCell>
                          <TableCell className="text-xs font-bold tabular-nums gold-gradient-text">
                            {entry.totalEarned}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="space-y-2 md:hidden">
                  {MOCK_LEADERBOARD.map((entry) => (
                    <div
                      key={entry.rank}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3 hover-lift-sm',
                        entry.isCurrentUser ? 'border-gold/30 bg-gold/5' : 'border-border/50'
                      )}
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                        {entry.rank <= 3 ? (
                          <Badge variant="secondary" className="badge-gold gap-1 text-sm">
                            {entry.rank === 1 && '🥇'}
                            {entry.rank === 2 && '🥈'}
                            {entry.rank === 3 && '🥉'}
                          </Badge>
                        ) : (
                          getRankIcon(entry.rank)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-xs font-medium ${entry.isCurrentUser ? 'text-gold font-bold' : 'text-foreground'}`}>
                            {entry.name}
                          </p>
                          {entry.isCurrentUser && (
                            <Badge variant="secondary" className="bg-gold/10 text-gold text-[9px]">
                              شما
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {formatNumber(entry.referrals)} نفر دعوت
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="text-xs font-bold tabular-nums gold-gradient-text">
                          {entry.totalEarned}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Your Position Summary */}
                <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="size-4 text-gold" />
                    <span className="text-xs font-bold text-foreground">رتبه شما</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-lg font-bold tabular-nums text-gold">{formatNumber(12)}</p>
                      <p className="text-[10px] text-muted-foreground">رتبه کلی</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold tabular-nums text-foreground">{formatNumber(5)}</p>
                      <p className="text-[10px] text-muted-foreground">دعوت موفق</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold tabular-nums gold-gradient-text">{formatToman(185000)}</p>
                      <p className="text-[10px] text-muted-foreground">مجموع درآمد</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-center text-muted-foreground">
                    با دعوت <span className="font-bold text-gold">۷ نفر</span> دیگر، وارد ۵ نفر برتر شوید!
                  </p>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
    </motion.div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  Users,
  Gift,
  Clock,
  Copy,
  Check,
  Share2,
  ChevronLeft,
  Loader2,
  UserPlus,
  Smartphone,
  CheckCircle,
  HourglassIcon,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { usePageEvent } from '@/hooks/use-page-event';
import {
  formatToman,
  formatNumber,
  formatDateTime,
  cn,
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
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface ReferralEntry {
  id: string;
  rewardType: string;
  rewardAmount: number;
  status: string;
  claimedAt: string | null;
  referredUser: {
    id: string;
    phone: string;
    fullName: string | null;
    createdAt: string;
  } | null;
  createdAt: string;
}

interface ReferralData {
  referralCode: string;
  totalInvited: number;
  totalRewarded: number;
  referrals: ReferralEntry[];
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getReferralStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'در انتظار ثبت‌نام',
    registered: 'در انتظار احراز هویت',
    verified: 'تأیید شده',
    claimed: 'جایزه پرداخت شده',
  };
  return map[status] || status;
}

function getReferralStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    registered: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    verified: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    claimed: 'bg-gold/15 text-gold-dark dark:text-gold',
  };
  return map[status] || 'bg-muted text-muted-foreground';
}

function maskPhone(phone: string): string {
  if (phone.length < 4) return phone;
  return '****' + phone.slice(-4);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeletons                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ReferralSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-12 w-48 rounded-xl" />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg p-2">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Step Indicator                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

const STEPS = [
  {
    icon: Share2,
    title: 'اشتراک‌گذاری کد',
    desc: 'کد دعوت خود را با دوستانتان به اشتراک بگذارید',
  },
  {
    icon: UserPlus,
    title: 'ثبت‌نام دوست',
    desc: 'دوست شما با کد شما ثبت‌نام و احراز هویت می‌کند',
  },
  {
    icon: Gift,
    title: 'دریافت جایزه',
    desc: 'پس از تأیید، جایزه به کیف پول شما واریز می‌شود',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main ReferralView Component                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ReferralView() {
  const { user, addToast } = useAppStore();

  /* ── State ── */
  const [isLoading, setIsLoading] = useState(true);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  /* ── Quick Action Event Listeners ── */
  usePageEvent('invite', () => { handleShare(); });
  usePageEvent('stats', () => { addToast('آمار دعوت‌ها', 'info'); });

  /* ── Computed ── */
  const referralCode = referralData?.referralCode || user?.referralCode || '------';
  const fullCode = `ZRGOLD-${referralCode}`;
  const pendingCount = referralData?.referrals?.filter(
    (r) => r.status === 'pending' || r.status === 'registered',
  ).length || 0;

  /* ── Data Fetching ── */
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/referral?userId=${user.id}`);
      const data = await res.json();

      if (data.success) {
        setReferralData(data);
      }
      // Silently handle API errors — show the view with mock data instead of error toast
    } catch {
      // Silently handle network errors
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Handlers ── */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullCode);
      setCopied(true);
      addToast('کد دعوت کپی شد', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('خطا در کپی کد', 'error');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'دعوت به زرین گلد',
      text: `با کد دعوت من در زرین گلد ثبت‌نام کنید و جایزه دریافت کنید!\nکد دعوت: ${fullCode}`,
      url: typeof window !== 'undefined' ? window.location.origin : '',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShared(true);
        addToast('اشتراک‌گذاری موفق', 'success');
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        // User cancelled share — do nothing
        if ((err as Error).name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  /* ── Render ── */
  return (
    <motion.div
      className="mx-auto max-w-4xl space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ──────────────────────────────────────────────────────── */}
      {/*  Header                                                 */}
      {/* ──────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gold/10">
            <Users className="size-5 text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">دعوت از دوستان</h1>
            <p className="text-sm text-muted-foreground">با دعوت دوستانتان جایزه بگیرید</p>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <ReferralSkeleton />
      ) : (
        <>
          {/* ──────────────────────────────────────────────────── */}
          {/*  Referral Code Card                                  */}
          {/* ──────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="card-gold-border overflow-hidden bg-gradient-to-l from-gold/[0.06] via-card to-gold/[0.06]">
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  {/* Text */}
                  <div className="space-y-2">
                    <h2 className="text-lg font-bold text-foreground">کد دعوت شما</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      این کد را با دوستانتان به اشتراک بگذارید. از هر معامله آن‌ها جایزه دریافت خواهید کرد!
                    </p>
                  </div>

                  {/* Code & Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl border border-gold/30 bg-background/80 px-4 py-2.5 shadow-sm">
                        <span className="text-gold-gradient text-lg font-mono font-bold tracking-widest">
                          {fullCode}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="btn-gold-outline gap-1.5"
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <Check className="size-4 text-emerald-500" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                        {copied ? 'کپی شد!' : 'کپی کد'}
                      </Button>
                      <Button
                        size="sm"
                        className="btn-gold-gradient gap-1.5"
                        onClick={handleShare}
                      >
                        {shared ? (
                          <Check className="size-4" />
                        ) : (
                          <Share2 className="size-4" />
                        )}
                        {shared ? 'ارسال شد!' : 'اشتراک‌گذاری'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ──────────────────────────────────────────────────── */}
          {/*  Stats Cards                                        */}
          {/* ──────────────────────────────────────────────────── */}
          <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-3" variants={itemVariants}>
            {/* Successful Invites */}
            <Card className="card-gold-border overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                    <Users className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">دعوت‌های موفق</p>
                    <p className="text-gold-gradient mt-1 text-xl font-bold tabular-nums">
                      {formatNumber(referralData?.totalInvited ?? 0)} نفر
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Rewards */}
            <Card className="card-gold-border overflow-hidden transition-shadow hover:shadow-md bg-gradient-to-br from-gold/[0.03] via-card to-gold/[0.01]">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/15">
                    <Gift className="size-5 text-gold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">جایزه‌های دریافتی</p>
                    <p className="text-gold-gradient mt-1 text-xl font-bold tabular-nums truncate">
                      {formatToman(referralData?.totalRewarded ?? 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending */}
            <Card className="card-gold-border overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                    <Clock className="size-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">در انتظار تأیید</p>
                    <p className="text-gold-gradient mt-1 text-xl font-bold tabular-nums">
                      {formatNumber(pendingCount)} نفر
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ──────────────────────────────────────────────────── */}
          {/*  Referrals Table                                     */}
          {/* ──────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Smartphone className="size-4 text-gold" />
                  لیست دعوت‌ها
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(!referralData?.referrals || referralData.referrals.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-[#D4AF37]/10">
                      <Users className="text-gold-gradient size-6" />
                    </div>
                    <p className="text-sm font-medium text-foreground">هنوز کسی را دعوت نکرده‌اید</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      لینک دعوت خود را به اشتراک بگذارید و از هر معامله جایزه بگیرید
                    </p>
                    <Button
                      size="sm"
                      className="btn-gold-gradient mt-4 gap-1.5"
                      onClick={handleShare}
                    >
                      <Share2 className="size-4" />
                      اشتراک‌گذاری لینک دعوت
                    </Button>
                  </div>
                ) : (
                  <div className="max-h-96 space-y-2 overflow-y-auto">
                    {referralData.referrals.map((ref, index) => (
                      <motion.div
                        key={ref.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="table-row-hover-gold flex items-center gap-3 rounded-xl border p-3 transition-colors"
                      >
                        {/* Avatar placeholder */}
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-sm font-bold text-gold">
                          {ref.referredUser?.fullName?.charAt(0) || '?'}
                        </div>

                        {/* User Info */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {ref.referredUser?.fullName || 'کاربر'}
                          </p>
                          <p className="text-xs text-muted-foreground" dir="ltr">
                            {maskPhone(ref.referredUser?.phone || '')}
                          </p>
                        </div>

                        {/* Status & Reward */}
                        <div className="text-left shrink-0">
                          <Badge
                            variant="secondary"
                            className={cn('text-[10px] px-2 py-0.5', getReferralStatusColor(ref.status))}
                          >
                            {getReferralStatusLabel(ref.status)}
                          </Badge>
                          {ref.rewardAmount > 0 && (
                            <p className="badge-gold mt-1 inline-block rounded-full px-2 py-0.5 text-center text-[10px] font-semibold tabular-nums">
                              +{formatToman(ref.rewardAmount)}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ──────────────────────────────────────────────────── */}
          {/*  How It Works                                       */}
          {/* ──────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <CheckCircle className="size-4 text-gold" />
                  نحوه کارکرد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {STEPS.map((step, index) => {
                    const StepIcon = step.icon;
                    return (
                      <div
                        key={index}
                        className="relative flex flex-col items-center text-center"
                      >
                        {/* Connector line (not for last) */}
                        {index < STEPS.length - 1 && (
                          <div className="absolute left-0 top-5 hidden h-[2px] w-full bg-gradient-to-l from-gold/30 to-transparent sm:block" />
                        )}

                        <div className="relative z-10 flex size-12 items-center justify-center rounded-full bg-gold/10 ring-4 ring-background">
                          <StepIcon className="size-5 text-gold" />
                        </div>
                        <h3 className="mt-3 text-sm font-bold text-foreground">{step.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {step.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

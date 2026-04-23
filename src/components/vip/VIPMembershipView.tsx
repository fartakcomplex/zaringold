'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  Crown,
  Check,
  Star,
  Shield,
  Zap,
  Loader2,
  Gift,
  Clock,
  Sparkles,
  ChevronLeft,
  TrendingUp,
  Headphones,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { usePageEvent } from '@/hooks/use-page-event';
import { formatToman, formatNumber, formatDate, cn } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                        */
/* ═══════════════════════════════════════════════════════════════ */

interface VIPStatus {
  isVip: boolean;
  plan: string | null;
  planLabel: string | null;
  isActive: boolean;
  expiresAt: string | null;
  daysRemaining: number;
  autoRenew: boolean;
}

interface PlanInfo {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  gradient: string;
  border: string;
  textColor: string;
  badgeBg: string;
  features: { icon: React.ElementType; label: string }[];
  popular?: boolean;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Plan Data                                                    */
/* ═══════════════════════════════════════════════════════════════ */

const PLANS: PlanInfo[] = [
  {
    id: 'silver',
    name: 'نقره‌ای',
    price: 99000,
    priceLabel: '۰.۰۳ گرم طلا/ماه',
    gradient: 'from-gray-400 via-gray-300 to-gray-200',
    border: 'border-gray-300/50',
    textColor: 'text-gray-700 dark:text-gray-200',
    badgeBg: 'bg-gray-100 dark:bg-gray-800',
    features: [
      { icon: TrendingUp, label: 'کارمزد پایین‌تر معاملات' },
      { icon: BarChart3, label: 'تحلیل‌های پایه بازار' },
      { icon: Shield, label: 'اولویت در پشتیبانی' },
      { icon: Gift, label: 'کش‌بک دو برابر' },
    ],
  },
  {
    id: 'gold',
    name: 'طلایی',
    price: 199000,
    priceLabel: '۰.۰۶ گرم طلا/ماه',
    gradient: 'from-amber-500 via-yellow-400 to-amber-300',
    border: 'border-amber-400/50',
    textColor: 'text-amber-700 dark:text-amber-200',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/30',
    popular: true,
    features: [
      { icon: TrendingUp, label: 'کارمزد صفر معاملات' },
      { icon: Zap, label: 'سیگنال‌های هوشمند AI' },
      { icon: BarChart3, label: 'تحلیل‌های پیشرفته بازار' },
      { icon: Headphones, label: 'پشتیبانی اختصاصی' },
      { icon: Gift, label: 'کش‌بک سه برابر' },
      { icon: Star, label: 'پیش‌بینی قیمت روزانه' },
    ],
  },
  {
    id: 'black',
    name: 'مشکی',
    price: 499000,
    priceLabel: '۰.۱۵ گرم طلا/ماه',
    gradient: 'from-gray-900 via-gray-800 to-gray-700',
    border: 'border-gray-600/50',
    textColor: 'text-white',
    badgeBg: 'bg-gray-900',
    features: [
      { icon: Zap, label: 'بدون صف معاملات' },
      { icon: Star, label: 'تمام امکانات طلایی' },
      { icon: BarChart3, label: 'تحلیل AI اختصاصی' },
      { icon: Headphones, label: 'مدیر حساب اختصاصی' },
      { icon: Gift, label: 'هدیه ماهانه طلا' },
      { icon: Crown, label: 'دسترسی زودهنگام ویژگی‌ها' },
      { icon: TrendingUp, label: 'نرخ تبدیل ویژه' },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════ */
/*  Animation Variants                                           */
/* ═══════════════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ═══════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                             */
/* ═══════════════════════════════════════════════════════════════ */

function VIPSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <div className="flex flex-col items-center gap-3 py-6">
        <Skeleton className="size-16 rounded-2xl" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-32 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-96 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Component                                                    */
/* ═══════════════════════════════════════════════════════════════ */

export default function VIPMembershipView() {
  const { user, addToast } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<VIPStatus | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/vip/status?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setStatus(data);
      } else {
        setStatus({
          isVip: false,
          plan: null,
          planLabel: null,
          isActive: false,
          expiresAt: null,
          daysRemaining: 0,
          autoRenew: false,
        });
      }
    } catch {
      setStatus({
        isVip: false,
        plan: null,
        planLabel: null,
        isActive: false,
        expiresAt: null,
        daysRemaining: 0,
        autoRenew: false,
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSubscribe = async (planId: string) => {
    if (!user?.id) return;
    setSubscribing(planId);
    try {
      const res = await fetch('/api/vip/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, plan: planId }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('اشتراک VIP با موفقیت فعال شد! 🎉', 'success');
        fetchStatus();
      } else {
        addToast(data.message || 'خطا در فعال‌سازی اشتراک', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <VIPSkeleton />
      </motion.div>
    );
  }

  const currentPlanInfo = PLANS.find((p) => p.id === status?.plan);

  return (
    <motion.div
      className="mx-auto max-w-5xl space-y-6 pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col items-center gap-3 py-6 text-center">
        <motion.div
          className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border-2 border-amber-500/30"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Crown className="size-10 text-amber-500" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-extrabold gold-gradient-text">اشتراک VIP</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            با ارتقا به اشتراک VIP، از امکانات ویژه بهره‌مند شوید
          </p>
        </div>
      </motion.div>

      {/* ── Current Status Card ── */}
      {status && (
        <motion.div variants={itemVariants}>
          <Card className={cn(
            'overflow-hidden',
            status.isVip
              ? 'bg-gradient-to-l from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-300/50'
              : 'border-border'
          )}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'flex size-14 items-center justify-center rounded-xl',
                  status.isVip ? 'bg-gradient-to-br from-amber-500 to-yellow-400' : 'bg-muted'
                )}>
                  {status.isVip ? (
                    <Crown className="size-7 text-white" />
                  ) : (
                    <Crown className="size-7 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">
                      {status.isVip ? `اشتراک ${status.planLabel}` : 'بدون اشتراک VIP'}
                    </h3>
                    {status.isVip && (
                      <Badge className="bg-amber-500 text-white text-[10px]">
                        <Sparkles className="size-3 me-1" />
                        فعال
                      </Badge>
                    )}
                  </div>
                  {status.isVip ? (
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatNumber(status.daysRemaining)} روز مانده
                      </span>
                      {status.expiresAt && (
                        <span>تا {formatDate(status.expiresAt)}</span>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      ارتقا دهید و از امکانات ویژه بهره‌مند شوید
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Plan Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {PLANS.map((plan, index) => {
            const isActive = status?.plan === plan.id && status?.isVip;
            return (
              <motion.div
                key={plan.id}
                variants={itemVariants}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
              >
                <Card className={cn(
                  'relative overflow-hidden transition-all hover-lift-sm',
                  isActive ? `ring-2 ring-amber-500 ${plan.border}` : `border ${plan.border}`,
                  plan.popular && !isActive && 'ring-1 ring-amber-400/50'
                )}>
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute top-0 start-0 z-10">
                      <div className="bg-gradient-to-l from-amber-500 to-yellow-400 px-4 py-1 rounded-b-lg">
                        <span className="text-xs font-bold text-white">محبوب‌ترین</span>
                      </div>
                    </div>
                  )}

                  {/* Gradient header */}
                  <div className={cn('bg-gradient-to-l p-5', plan.gradient)}>
                    <div className="flex items-center gap-3">
                      <Crown className={cn('size-8', plan.id === 'black' ? 'text-amber-400' : 'text-white/90')} />
                      <div>
                        <h3 className={cn('text-xl font-extrabold', plan.textColor)}>
                          پلن {plan.name}
                        </h3>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className={cn('text-2xl font-black', plan.textColor)}>
                        {plan.priceLabel}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-4">
                    {/* Features */}
                    <div className="space-y-3">
                      {plan.features.map((feature, fi) => {
                        const FeatureIcon = feature.icon;
                        return (
                          <div key={fi} className="flex items-center gap-2.5">
                            <div className={cn(
                              'flex size-5 shrink-0 items-center justify-center rounded-full',
                              isActive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-muted'
                            )}>
                              {isActive ? (
                                <Check className="size-3 text-emerald-600" />
                              ) : (
                                <FeatureIcon className="size-3 text-muted-foreground" />
                              )}
                            </div>
                            <span className={cn(
                              'text-sm',
                              isActive ? 'text-muted-foreground line-through' : 'text-foreground'
                            )}>
                              {feature.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <Separator />

                    {/* Subscribe Button */}
                    <Button
                      className={cn(
                        'w-full',
                        isActive
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          : plan.id === 'black'
                            ? 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900'
                            : 'bg-gradient-to-l from-amber-500 to-yellow-400 text-gray-900 hover:from-amber-600 hover:to-yellow-500'
                      )}
                      onClick={() => !isActive && handleSubscribe(plan.id)}
                      disabled={isActive || subscribing === plan.id}
                    >
                      {subscribing === plan.id ? (
                        <>
                          <Loader2 className="size-4 me-2 animate-spin" />
                          در حال فعال‌سازی...
                        </>
                      ) : isActive ? (
                        <>
                          <Check className="size-4 me-2" />
                          اشتراک فعلی شما
                        </>
                      ) : (
                        <>
                          <Crown className="size-4 me-2" />
                          ارتقا به {plan.name}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Benefits Section ── */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-amber-300/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="size-4 text-amber-500" />
              مزایای اشتراک VIP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: <Zap className="size-4 text-amber-500" />, label: 'معاملات سریع‌تر' },
                { icon: <Shield className="size-4 text-amber-500" />, label: 'امنیت بالا' },
                { icon: <Gift className="size-4 text-amber-500" />, label: 'پاداش‌های ویژه' },
                { icon: <Headphones className="size-4 text-amber-500" />, label: 'پشتیبانی اختصاصی' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
                  {item.icon}
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

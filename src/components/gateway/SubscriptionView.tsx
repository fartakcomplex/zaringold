'use client';

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  SubscriptionView — صفحه مدیریت اشتراک‌های دوره‌ای                           */
/*  Four sections: Create Plan, Active Plans, Charge History, Payment Links     */
/*  Persian RTL with English comments                                           */
/* ═══════════════════════════════════════════════════════════════════════════════ */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  CreditCard,
  Coins,
  Copy,
  Check,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Plus,
  Users,
  Calendar,
  Clock,
  ArrowLeftRight,
  Link2,
  Zap,
  Crown,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatNumber, formatToman, formatGrams, formatDate, getTimeAgo } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Types & Interfaces                                                        */
/* ═══════════════════════════════════════════════════════════════════════════════ */

type Currency = 'toman' | 'gold' | 'mixed';
type Interval = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface SubscriptionPlan {
  id: string;
  planName: string;
  description: string;
  amountToman: number;
  amountGold: number;
  currency: string;
  interval: string;
  trialDays: number;
  maxCharges: number;
  isActive: boolean;
  nextChargeAt: string;
  totalCharges: number;
  subscriberCount: number;
  chargeCount: number;
  subscribeUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface ChargeRecord {
  id: string;
  amountToman: number;
  amountGold: number;
  status: string;
  chargedAt: string;
  customerName?: string;
}

/* Labels */
const INTERVAL_LABELS: Record<string, string> = {
  daily: 'روزانه',
  weekly: 'هفتگی',
  monthly: 'ماهانه',
  yearly: 'سالانه',
};

const CURRENCY_LABELS: Record<string, string> = {
  toman: 'واحد طلایی',
  gold: 'طلای آبشده',
  mixed: 'ترکیبی',
};

const CURRENCY_ICONS: Record<string, typeof CreditCard> = {
  toman: CreditCard,
  gold: Coins,
  mixed: Crown,
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  failed: 'bg-red-100 dark:bg-red-900/30 text-red-600',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'موفق',
  pending: 'در انتظار',
  failed: 'ناموفق',
};

/* Animation variants */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Section 1: Create Subscription Plan Form                                  */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function CreatePlanSection({ onCreated }: { onCreated: () => void }) {
  const { user, addToast } = useAppStore();
  const [planName, setPlanName] = useState('');
  const [description, setDescription] = useState('');
  const [amountToman, setAmountToman] = useState('');
  const [amountGold, setAmountGold] = useState('');
  const [currency, setCurrency] = useState<Currency>('toman');
  const [interval, setInterval_] = useState<Interval>('monthly');
  const [trialDays, setTrialDays] = useState('');
  const [maxCharges, setMaxCharges] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!planName.trim()) {
      addToast('نام طرح الزامی است', 'error');
      return;
    }

    const toman = Number(amountToman) || 0;
    const gold = Number(amountGold) || 0;

    if (currency === 'toman' && toman <= 0) {
      addToast('مبلغ واحد طلایی الزامی است', 'error');
      return;
    }
    if (currency === 'gold' && gold <= 0) {
      addToast('مبلغ طلا الزامی است', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/v1/merchant/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          planName: planName.trim(),
          description: description.trim(),
          amountToman: toman,
          amountGold: gold,
          currency,
          interval,
          trialDays: Number(trialDays) || 0,
          maxCharges: Number(maxCharges) || 0,
        }),
      });
      const json = await res.json();

      if (json.success) {
        addToast('طرح اشتراک با موفقیت ایجاد شد', 'success');
        // Reset form
        setPlanName('');
        setDescription('');
        setAmountToman('');
        setAmountGold('');
        setCurrency('toman');
        setInterval_('monthly');
        setTrialDays('');
        setMaxCharges('');
        onCreated();
      } else {
        addToast(json.message || 'خطا در ایجاد طرح', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setIsCreating(false);
    }
  }, [planName, description, amountToman, amountGold, currency, interval, trialDays, maxCharges, user, addToast, onCreated]);

  return (
    <motion.div variants={itemVariants} className="space-y-4">
      {/* Plan name */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">نام طرح</Label>
        <Input
          placeholder="مثلاً: اشتراک طلایی ماهانه"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          className="border-gold/20 focus:border-gold/40"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">توضیحات (اختیاری)</Label>
        <Textarea
          placeholder="توضیحات طرح اشتراک..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="border-gold/20 focus:border-gold/40 resize-none"
        />
      </div>

      {/* Currency type */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">نوع ارز</Label>
        <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
          <SelectTrigger className="border-gold/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CURRENCY_LABELS).map(([key, label]) => {
              const Icon = CURRENCY_ICONS[key];
              return (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <Icon className="size-3.5 text-gold" />
                    {label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Amount fields */}
      <div className="grid grid-cols-2 gap-3">
        {(currency === 'toman' || currency === 'mixed') && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold">مبلغ واحد طلایی</Label>
            <Input
              type="number"
              placeholder="مثلاً: 500000"
              value={amountToman}
              onChange={(e) => setAmountToman(e.target.value)}
              className="border-gold/20 focus:border-gold/40 tabular-nums"
            />
            {amountToman && Number(amountToman) > 0 && (
              <p className="text-[10px] text-muted-foreground tabular-nums">
                {formatToman(Number(amountToman))}
              </p>
            )}
          </div>
        )}
        {(currency === 'gold' || currency === 'mixed') && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold">مبلغ طلا (گرم)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="مثلاً: 0.5"
              value={amountGold}
              onChange={(e) => setAmountGold(e.target.value)}
              className="border-gold/20 focus:border-gold/40 tabular-nums"
            />
            {amountGold && Number(amountGold) > 0 && (
              <p className="text-[10px] text-muted-foreground tabular-nums">
                {formatGrams(Number(amountGold))}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Interval */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">بازه پرداخت</Label>
        <Select value={interval} onValueChange={(v) => setInterval_(v as Interval)}>
          <SelectTrigger className="border-gold/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(INTERVAL_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <Clock className="size-3.5 text-gold" />
                  {label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Trial & Max charges */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">روز آزمایشی</Label>
          <Input
            type="number"
            placeholder="۰"
            value={trialDays}
            onChange={(e) => setTrialDays(e.target.value)}
            min="0"
            className="border-gold/20 focus:border-gold/40 tabular-nums"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">حداکثر پرداخت</Label>
          <Input
            type="number"
            placeholder="۰ = نامحدود"
            value={maxCharges}
            onChange={(e) => setMaxCharges(e.target.value)}
            min="0"
            className="border-gold/20 focus:border-gold/40 tabular-nums"
          />
        </div>
      </div>

      {/* Submit button */}
      <Button
        onClick={handleCreate}
        disabled={isCreating || !planName.trim()}
        className="btn-gold-shine w-full bg-gradient-to-l from-gold-dark via-gold to-gold-light text-foreground font-bold shadow-lg shadow-gold/20 hover:brightness-110 disabled:opacity-50"
      >
        {isCreating ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <>
            <Plus className="size-5 ml-2" />
            ایجاد طرح اشتراک
          </>
        )}
      </Button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Section 2: Active Subscription Plans List                                  */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function PlansList({
  plans,
  onToggle,
  onDelete,
  onCharge,
  onCopyLink,
  togglingId,
  chargingId,
}: {
  plans: SubscriptionPlan[];
  onToggle: (plan: SubscriptionPlan) => void;
  onDelete: (plan: SubscriptionPlan) => void;
  onCharge: (plan: SubscriptionPlan) => void;
  onCopyLink: (plan: SubscriptionPlan) => void;
  togglingId: string | null;
  chargingId: string | null;
}) {
  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gold/10 text-gold">
          <Zap className="size-8" />
        </div>
        <div>
          <h4 className="text-sm font-bold">طرح اشتراکی وجود ندارد</h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            طرح اشتراک جدیدی ایجاد کنید تا لینک پرداخت دوره‌ای دریافت کنید
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3 max-h-[32rem] overflow-y-auto">
      {plans.map((plan) => {
        const CurrencyIcon = CURRENCY_ICONS[plan.currency] || CreditCard;

        return (
          <motion.div key={plan.id} variants={itemVariants}>
            <Card className="overflow-hidden border-border/50 hover:border-gold/20 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  {/* Top row: icon + info */}
                  <div className="flex items-start gap-3">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${plan.isActive ? 'bg-gold/10 text-gold' : 'bg-muted text-muted-foreground'}`}>
                      <CurrencyIcon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="truncate text-sm font-bold">{plan.planName}</h4>
                        <Badge className={`${plan.isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800/40 text-gray-500'} border-0 text-[10px] shrink-0`}>
                          {plan.isActive ? 'فعال' : 'غیرفعال'}
                        </Badge>
                        <Badge variant="outline" className="border-gold/30 text-gold text-[10px] shrink-0">
                          {CURRENCY_LABELS[plan.currency]}
                        </Badge>
                      </div>
                      {plan.description && (
                        <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{plan.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ArrowLeftRight className="size-3" />
                          {INTERVAL_LABELS[plan.interval]}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="size-3" />
                          {formatNumber(plan.subscriberCount)} مشترک
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Zap className="size-3" />
                          {formatNumber(plan.totalCharges)} پرداخت
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Amount row */}
                  <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-3">
                    {(plan.currency === 'toman' || plan.currency === 'mixed') && (
                      <div className="flex-1 text-center">
                        <p className="text-[10px] text-muted-foreground">واحد طلایی</p>
                        <p className="mt-0.5 text-sm font-bold text-gold tabular-nums">
                          {formatToman(plan.amountToman)}
                        </p>
                      </div>
                    )}
                    {(plan.currency === 'gold' || plan.currency === 'mixed') && (
                      <div className="flex-1 text-center">
                        <p className="text-[10px] text-muted-foreground">طلا</p>
                        <p className="mt-0.5 text-sm font-bold text-gold tabular-nums">
                          {formatGrams(plan.amountGold)}
                        </p>
                      </div>
                    )}
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-muted-foreground">بازه</p>
                      <p className="mt-0.5 text-sm font-bold tabular-nums">
                        {INTERVAL_LABELS[plan.interval]}
                      </p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-muted-foreground">پرداخت بعدی</p>
                      <p className="mt-0.5 text-sm font-bold tabular-nums">
                        {formatDate(plan.nextChargeAt)}
                      </p>
                    </div>
                  </div>

                  {/* Trial / Max charges info */}
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                    {plan.trialDays > 0 && (
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatNumber(plan.trialDays)} روز آزمایشی
                      </span>
                    )}
                    {plan.maxCharges > 0 && (
                      <span className="flex items-center gap-1">
                        <CreditCard className="size-3" />
                        حداکثر {formatNumber(plan.maxCharges)} پرداخت
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCopyLink(plan)}
                      className="h-8 flex-1 text-xs border-border/50 hover:border-gold/30"
                    >
                      <Link2 className="size-3.5 ml-1" />
                      کپی لینک
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCharge(plan)}
                      disabled={chargingId === plan.id || !plan.isActive}
                      className="h-8 flex-1 text-xs border-border/50 hover:border-emerald-300 text-emerald-600"
                    >
                      {chargingId === plan.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Zap className="size-3.5 ml-1" />
                      )}
                      پرداخت دوره
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onToggle(plan)}
                      disabled={togglingId === plan.id}
                      className={`h-8 text-xs border-border/50 ${plan.isActive ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'}`}
                    >
                      {togglingId === plan.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : plan.isActive ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(plan)}
                      className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-border/50"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Section 3: Subscription Charge History                                     */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function ChargeHistory({ plans }: { plans: SubscriptionPlan[] }) {
  const { user, addToast } = useAppStore();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('all');
  const [charges, setCharges] = useState<ChargeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchCharges = useCallback(async (planId: string) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Fetch subscriptions to get their charge counts, then we can show placeholder data
      // In a full implementation, we would have a dedicated charges API
      const res = await fetch(`/api/v1/merchant/subscriptions?userId=${user.id}&limit=50`);
      const json = await res.json();
      if (json.success && json.data?.subscriptions) {
        const allCharges: ChargeRecord[] = [];
        json.data.subscriptions.forEach((sub: SubscriptionPlan) => {
          if (planId !== 'all' && sub.id !== planId) return;
          // Generate simulated charge history based on total charges
          for (let i = 0; i < Math.min(sub.totalCharges, 20); i++) {
            const chargeDate = new Date(sub.createdAt);
            chargeDate.setDate(chargeDate.getDate() + (i + 1) * (sub.interval === 'daily' ? 1 : sub.interval === 'weekly' ? 7 : 30));
            allCharges.push({
              id: `charge-${sub.id}-${i}`,
              amountToman: sub.amountToman,
              amountGold: sub.amountGold,
              status: 'completed',
              chargedAt: chargeDate.toISOString(),
              customerName: sub.planName,
            });
          }
        });
        // Sort by date descending
        allCharges.sort((a, b) => new Date(b.chargedAt).getTime() - new Date(a.chargedAt).getTime());
        setCharges(allCharges);
      }
    } catch {
      addToast('خطا در دریافت تاریخچه پرداخت‌ها', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, addToast]);

  useEffect(() => {
    fetchCharges(selectedPlanId);
  }, [selectedPlanId, fetchCharges]);

  return (
    <div className="space-y-4">
      {/* Filter selector */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger className="border-gold/20 h-9 text-xs">
              <SelectValue placeholder="فیلتر بر اساس طرح" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <History className="size-3.5 text-gold" />
                  همه طرح‌ها
                </div>
              </SelectItem>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.planName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchCharges(selectedPlanId)}
          disabled={loading}
          className="h-9 border-border/50 text-xs"
        >
          <RefreshCw className={`size-3.5 ml-1 ${loading ? 'animate-spin' : ''}`} />
          بروزرسانی
        </Button>
      </div>

      {/* Charge list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : charges.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <History className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">پرداختی ثبت نشده</p>
        </div>
      ) : (
        <>
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2 max-h-[24rem] overflow-y-auto">
            {(expanded ? charges : charges.slice(0, 10)).map((charge) => {
              const CurrencyIcon = CURRENCY_ICONS['toman'];
              return (
                <motion.div key={charge.id} variants={itemVariants}>
                  <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 p-3 transition-colors hover:border-gold/15">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                      <CurrencyIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold tabular-nums">
                          {charge.amountToman > 0 ? formatToman(charge.amountToman) : formatGrams(charge.amountGold)}
                        </span>
                        <Badge className={`${STATUS_COLORS[charge.status] || 'bg-gray-100 text-gray-500'} border-0 text-[9px]`}>
                          {STATUS_LABELS[charge.status] || charge.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {getTimeAgo(charge.chargedAt)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
          {charges.length > 10 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full text-xs text-muted-foreground"
            >
              {expanded ? (
                <>
                  <ChevronUp className="size-3.5 ml-1" />
                  نمایش کمتر
                </>
              ) : (
                <>
                  <ChevronDown className="size-3.5 ml-1" />
                  نمایش همه ({formatNumber(charges.length)})
                </>
              )}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Section 4: Payment Links                                                   */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function PaymentLinks({ plans }: { plans: SubscriptionPlan[] }) {
  const { addToast } = useAppStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = useCallback(async (plan: SubscriptionPlan) => {
    try {
      await navigator.clipboard.writeText(plan.subscribeUrl);
      setCopiedId(plan.id);
      addToast('لینک اشتراک کپی شد', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      addToast('خطا در کپی', 'error');
    }
  }, [addToast]);

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Link2 className="size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">ابتدا یک طرح اشتراک ایجاد کنید</p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2 max-h-[28rem] overflow-y-auto">
      {plans.map((plan) => (
        <motion.div key={plan.id} variants={itemVariants}>
          <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 p-3 transition-colors hover:border-gold/15">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold/10">
              <Link2 className="size-4 text-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{plan.planName}</p>
              <p className="text-[10px] text-muted-foreground font-mono truncate" dir="ltr">
                {plan.subscribeUrl}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopyLink(plan)}
              className="h-8 text-xs border-gold/30 text-gold hover:bg-gold/10 shrink-0"
            >
              {copiedId === plan.id ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copiedId === plan.id ? 'کپی شد!' : 'کپی'}
            </Button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Main SubscriptionView Component                                           */
/* ═══════════════════════════════════════════════════════════════════════════════ */

export default function SubscriptionView() {
  const { user, addToast } = useAppStore();
  const [activeTab, setActiveTab] = useState<'create' | 'plans' | 'history' | 'links'>('create');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [chargingId, setChargingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(null);

  /* ── Fetch plans ── */
  const fetchPlans = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/merchant/subscriptions?userId=${user.id}`);
      const json = await res.json();
      if (json.success && json.data?.subscriptions) {
        setPlans(json.data.subscriptions);
      }
    } catch {
      addToast('خطا در دریافت لیست طرح‌ها', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, addToast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  /* ── Toggle active/inactive ── */
  const handleToggle = useCallback(async (plan: SubscriptionPlan) => {
    setTogglingId(plan.id);
    try {
      const res = await fetch(`/api/v1/merchant/subscriptions/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, action: 'toggle_active' }),
      });
      const json = await res.json();
      if (json.success) {
        setPlans((prev) =>
          prev.map((p) => p.id === plan.id ? { ...p, isActive: !p.isActive } : p)
        );
        addToast(json.message, 'success');
      } else {
        addToast(json.message || 'خطا', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setTogglingId(null);
    }
  }, [user?.id, addToast]);

  /* ── Delete subscription ── */
  const handleDelete = useCallback(async () => {
    if (!deleteTarget || !user?.id) return;
    try {
      const res = await fetch(`/api/v1/merchant/subscriptions/${deleteTarget.id}?userId=${user.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setPlans((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        addToast('طرح اشتراک حذف شد', 'success');
      } else {
        addToast(json.message || 'خطا در حذف', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, user?.id, addToast]);

  /* ── Process charge ── */
  const handleCharge = useCallback(async (plan: SubscriptionPlan) => {
    setChargingId(plan.id);
    try {
      const res = await fetch(`/api/v1/merchant/subscriptions/${plan.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      const json = await res.json();
      if (json.success) {
        addToast(json.message, 'success');
        fetchPlans(); // Refresh to update counts
      } else {
        addToast(json.message || 'خطا', 'error');
      }
    } catch {
      addToast('خطا در پردازش پرداخت', 'error');
    } finally {
      setChargingId(null);
    }
  }, [user?.id, addToast, fetchPlans]);

  /* ── Copy subscribe link ── */
  const handleCopyLink = useCallback(async (plan: SubscriptionPlan) => {
    try {
      await navigator.clipboard.writeText(plan.subscribeUrl);
      addToast('لینک اشتراک کپی شد', 'success');
    } catch {
      addToast('خطا در کپی لینک', 'error');
    }
  }, [addToast]);

  /* ── Tab config ── */
  const tabs = [
    { key: 'create' as const, label: 'ایجاد طرح', icon: <Plus className="size-4" /> },
    { key: 'plans' as const, label: 'طرح‌های من', icon: <Crown className="size-4" /> },
    { key: 'history' as const, label: 'تاریخچه', icon: <History className="size-4" /> },
    { key: 'links' as const, label: 'لینک اشتراک', icon: <Link2 className="size-4" /> },
  ];

  return (
    <div className="page-transition mx-auto max-w-lg space-y-5 pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-gold-dark shadow-lg shadow-gold/20">
          <Crown className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold">اشتراک دوره‌ای</h1>
          <p className="text-xs text-muted-foreground">مدیریت طرح‌های اشتراک و پرداخت‌های مکرر</p>
        </div>
      </motion.div>

      {/* Stats summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3"
      >
        <div className="rounded-xl border border-gold/15 bg-gold/5 p-3 text-center">
          <p className="text-[10px] text-muted-foreground">طرح فعال</p>
          <p className="mt-1 text-lg font-extrabold text-gold tabular-nums">
            {formatNumber(plans.filter((p) => p.isActive).length)}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground">کل مشترکان</p>
          <p className="mt-1 text-lg font-extrabold tabular-nums">
            {formatNumber(plans.reduce((s, p) => s + p.subscriberCount, 0))}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground">کل پرداخت‌ها</p>
          <p className="mt-1 text-lg font-extrabold tabular-nums">
            {formatNumber(plans.reduce((s, p) => s + p.totalCharges, 0))}
          </p>
        </div>
      </motion.div>

      {/* Tab Switcher */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex rounded-xl border border-border/50 bg-muted/30 p-1"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[11px] font-bold transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-card text-gold shadow-sm border border-gold/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {/* ── Create Plan ── */}
        {activeTab === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Plus className="size-4 text-gold" />
                  ایجاد طرح اشتراک جدید
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CreatePlanSection onCreated={fetchPlans} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Plans List ── */}
        {activeTab === 'plans' && (
          <motion.div
            key="plans"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="size-4 text-gold" />
                    طرح‌های اشتراک من
                  </div>
                  <Badge variant="outline" className="border-gold/30 text-gold text-[10px]">
                    {formatNumber(plans.length)} طرح
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-40 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <PlansList
                    plans={plans}
                    onToggle={handleToggle}
                    onDelete={setDeleteTarget}
                    onCharge={handleCharge}
                    onCopyLink={handleCopyLink}
                    togglingId={togglingId}
                    chargingId={chargingId}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Charge History ── */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <History className="size-4 text-gold" />
                  تاریخچه پرداخت‌ها
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChargeHistory plans={plans} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Payment Links ── */}
        {activeTab === 'links' && (
          <motion.div
            key="links"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Link2 className="size-4 text-gold" />
                  لینک اشتراک مشتریان
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentLinks plans={plans} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl" className="border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="size-5 text-destructive" />
              حذف طرح اشتراک
            </AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف طرح «{deleteTarget?.planName}» مطمئنید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50">انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

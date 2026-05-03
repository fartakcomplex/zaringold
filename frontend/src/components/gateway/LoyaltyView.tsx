
/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  LoyaltyView — Loyalty Engine & Fee Engine for Gold Payment Gateway          */
/*  Merchant-facing loyalty/rewards management + fee configuration              */
/*  Persian RTL with English comments                                           */
/* ═══════════════════════════════════════════════════════════════════════════════ */

import {useState, useCallback, useEffect} from 'react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Separator} from '@/components/ui/separator';
import {Skeleton} from '@/components/ui/skeleton';
import {Switch} from '@/components/ui/switch';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog';
import {Heart, Coins, Percent, Trophy, CalendarClock, Star, Gift, Users, TrendingUp, Loader2, Plus, Trash2, Eye, EyeOff, RefreshCw, Zap, Crown, Gem, Shield, DollarSign, ChevronDown, ChevronUp, Settings, Award, CheckCircle2, Clock} from 'lucide-react';
import {useAppStore} from '@/lib/store';
import {formatNumber, formatToman, formatGrams, getTimeAgo, formatDate} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Types & Interfaces                                                        */
/* ═══════════════════════════════════════════════════════════════════════════════ */

interface LoyaltyProgram {
  id: string;
  name: string;
  type: 'gold_cashback' | 'milestone' | 'recurring';
  isActive: boolean;
  cashbackPercent?: number;
  milestonePayments?: number;
  rewardMg?: number;
  recurringDays?: number;
  createdAt: string;
  updatedAt: string;
}

interface RewardRecord {
  id: string;
  userId: string;
  userName: string;
  type: string;
  amountMg: number;
  programName: string;
  date: string;
}

interface CampaignStats {
  totalRewardsMg: number;
  totalUsersRewarded: number;
  averageRewardMg: number;
  mostPopularProgram: string;
}

interface FeeTier {
  key: string;
  nameFa: string;
  nameEn: string;
  rate: number;
  color: string;
}

interface FeeData {
  currentTier: FeeTier;
  allTiers: FeeTier[];
  merchantFeeRate: number;
  merchantMinFee: number;
  merchantMaxFee: number;
  customConfig: Record<string, unknown> | null;
  feeRequests: Array<Record<string, unknown>>;
  settlementFee: number;
  instantSettlementFee: number;
}

/* ── Constants ── */

const PROGRAM_TYPE_LABELS: Record<string, string> = {
  gold_cashback: 'کش‌بک طلایی',
  milestone: 'جایزه رکورد',
  recurring: 'پاداش دوره‌ای',
};

const PROGRAM_TYPE_ICONS: Record<string, typeof Coins> = {
  gold_cashback: Percent,
  milestone: Trophy,
  recurring: CalendarClock,
};

const PROGRAM_TYPE_COLORS: Record<string, string> = {
  gold_cashback: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  milestone: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  recurring: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400',
};

const FEE_REQUEST_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'در انتظار تأیید', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  approved: { label: 'تأیید شده', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  rejected: { label: 'رد شده', color: 'bg-red-100 dark:bg-red-900/30 text-red-600' },
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
/*  Section 1: Create Loyalty Program Form                                     */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function CreateProgramForm({ onCreated }: { onCreated: () => void }) {
  const { user, addToast } = useAppStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<'gold_cashback' | 'milestone' | 'recurring'>('gold_cashback');
  const [cashbackPercent, setCashbackPercent] = useState('');
  const [milestonePayments, setMilestonePayments] = useState('');
  const [rewardMg, setRewardMg] = useState('');
  const [recurringDays, setRecurringDays] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      addToast('نام برنامه الزامی است', 'error');
      return;
    }

    // Type-specific validation
    if (type === 'gold_cashback' && (!cashbackPercent || Number(cashbackPercent) <= 0)) {
      addToast('درصد کش‌بک باید بزرگتر از صفر باشد', 'error');
      return;
    }
    if (type === 'milestone' && (!milestonePayments || Number(milestonePayments) <= 0 || !rewardMg || Number(rewardMg) <= 0)) {
      addToast('تعداد پرداخت‌ها و مقدار پاداش الزامی است', 'error');
      return;
    }
    if (type === 'recurring' && (!recurringDays || Number(recurringDays) <= 0 || !rewardMg || Number(rewardMg) <= 0)) {
      addToast('تعداد روزها و مقدار پاداش الزامی است', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/v1/merchant/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          name: name.trim(),
          type,
          cashbackPercent: type === 'gold_cashback' ? Number(cashbackPercent) : undefined,
          milestonePayments: type === 'milestone' ? Number(milestonePayments) : undefined,
          rewardMg: (type === 'milestone' || type === 'recurring') ? Number(rewardMg) : undefined,
          recurringDays: type === 'recurring' ? Number(recurringDays) : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        addToast('برنامه وفاداری با موفقیت ایجاد شد', 'success');
        setName('');
        setCashbackPercent('');
        setMilestonePayments('');
        setRewardMg('');
        setRecurringDays('');
        onCreated();
      } else {
        addToast(json.message || 'خطا در ایجاد برنامه', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setIsCreating(false);
    }
  }, [name, type, cashbackPercent, milestonePayments, rewardMg, recurringDays, user, addToast, onCreated]);

  const TypeIcon = PROGRAM_TYPE_ICONS[type];

  return (
    <motion.div variants={itemVariants} className="space-y-4">
      {/* Program name */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">نام برنامه</Label>
        <Input
          placeholder="مثلاً: کش‌بک طلایی ۳٪"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border-gold/20 focus:border-gold/40"
        />
      </div>

      {/* Program type */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">نوع برنامه</Label>
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
          <SelectTrigger className="border-gold/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PROGRAM_TYPE_LABELS).map(([key, label]) => {
              const Icon = PROGRAM_TYPE_ICONS[key];
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

      {/* Type-specific fields */}
      <AnimatePresence mode="wait">
        {type === 'gold_cashback' && (
          <motion.div
            key="cashback"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-2"
          >
            <Label className="text-sm font-semibold">درصد کش‌بک طلایی</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                placeholder="مثلاً: 2"
                value={cashbackPercent}
                onChange={(e) => setCashbackPercent(e.target.value)}
                className="border-gold/20 focus:border-gold/40 tabular-nums"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
            </div>
            {cashbackPercent && Number(cashbackPercent) > 0 && (
              <p className="text-[10px] text-muted-foreground">
                هر تراکنش موفق، {formatNumber(Number(cashbackPercent))}٪ از مبلغ به صورت طلای آبشده پاداش داده می‌شود
              </p>
            )}
          </motion.div>
        )}

        {type === 'milestone' && (
          <motion.div
            key="milestone"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="space-y-2">
              <Label className="text-sm font-semibold">تعداد پرداخت‌ها</Label>
              <Input
                type="number"
                min="1"
                placeholder="مثلاً: 10"
                value={milestonePayments}
                onChange={(e) => setMilestonePayments(e.target.value)}
                className="border-gold/20 focus:border-gold/40 tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">پاداش (میلی‌گرم)</Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="مثلاً: 50"
                value={rewardMg}
                onChange={(e) => setRewardMg(e.target.value)}
                className="border-gold/20 focus:border-gold/40 tabular-nums"
              />
            </div>
            {milestonePayments && rewardMg && (
              <p className="col-span-2 text-[10px] text-muted-foreground">
                بعد از هر {formatNumber(Number(milestonePayments))} پرداخت، {formatGrams(Number(rewardMg))} طلای آبشده پاداش
              </p>
            )}
          </motion.div>
        )}

        {type === 'recurring' && (
          <motion.div
            key="recurring"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="space-y-2">
              <Label className="text-sm font-semibold">تعداد روزها</Label>
              <Input
                type="number"
                min="1"
                placeholder="مثلاً: 30"
                value={recurringDays}
                onChange={(e) => setRecurringDays(e.target.value)}
                className="border-gold/20 focus:border-gold/40 tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">پاداش (میلی‌گرم)</Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="مثلاً: 25"
                value={rewardMg}
                onChange={(e) => setRewardMg(e.target.value)}
                className="border-gold/20 focus:border-gold/40 tabular-nums"
              />
            </div>
            {recurringDays && rewardMg && (
              <p className="col-span-2 text-[10px] text-muted-foreground">
                هر {formatNumber(Number(recurringDays))} روز فعالیت، {formatGrams(Number(rewardMg))} طلای آبشده پاداش
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <Button
        onClick={handleCreate}
        disabled={isCreating || !name.trim()}
        className="btn-gold-shine w-full bg-gradient-to-l from-gold-dark via-gold to-gold-light text-foreground font-bold shadow-lg shadow-gold/20 hover:brightness-110 disabled:opacity-50"
      >
        {isCreating ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <>
            <Plus className="size-5 ml-2" />
            ایجاد برنامه وفاداری
          </>
        )}
      </Button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Section 2: Active Programs List                                            */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function ProgramsList({
  programs,
  onToggle,
  onDelete,
  togglingId,
}: {
  programs: LoyaltyProgram[];
  onToggle: (program: LoyaltyProgram) => void;
  onDelete: (program: LoyaltyProgram) => void;
  togglingId: string | null;
}) {
  if (programs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gold/10 text-gold">
          <Heart className="size-8" />
        </div>
        <div>
          <h4 className="text-sm font-bold">برنامه وفاداری وجود ندارد</h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            برنامه وفاداری جدیدی ایجاد کنید تا مشتریان طلای پاداش بگیرند
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3 max-h-[32rem] overflow-y-auto">
      {programs.map((program) => {
        const TypeIcon = PROGRAM_TYPE_ICONS[program.type];
        const typeColorClass = PROGRAM_TYPE_COLORS[program.type];

        return (
          <motion.div key={program.id} variants={itemVariants}>
            <Card className="overflow-hidden border-border/50 hover:border-gold/20 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  {/* Top row */}
                  <div className="flex items-start gap-3">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${program.isActive ? typeColorClass : 'bg-muted text-muted-foreground'}`}>
                      <TypeIcon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="truncate text-sm font-bold">{program.name}</h4>
                        <Badge className={`${program.isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800/40 text-gray-500'} border-0 text-[10px] shrink-0`}>
                          {program.isActive ? 'فعال' : 'غیرفعال'}
                        </Badge>
                        <Badge variant="outline" className="border-gold/30 text-gold text-[10px] shrink-0">
                          {PROGRAM_TYPE_LABELS[program.type]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {getTimeAgo(program.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Program details */}
                  <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-3">
                    {program.type === 'gold_cashback' && program.cashbackPercent && (
                      <div className="flex-1 text-center">
                        <p className="text-[10px] text-muted-foreground">درصد کش‌بک</p>
                        <p className="mt-0.5 text-sm font-bold text-gold tabular-nums">
                          {formatNumber(program.cashbackPercent)}%
                        </p>
                      </div>
                    )}
                    {program.type === 'milestone' && (
                      <>
                        <div className="flex-1 text-center">
                          <p className="text-[10px] text-muted-foreground">تعداد پرداخت</p>
                          <p className="mt-0.5 text-sm font-bold tabular-nums">
                            {formatNumber(program.milestonePayments || 0)}
                          </p>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-[10px] text-muted-foreground">پاداش</p>
                          <p className="mt-0.5 text-sm font-bold text-gold tabular-nums">
                            {formatGrams(program.rewardMg || 0)}
                          </p>
                        </div>
                      </>
                    )}
                    {program.type === 'recurring' && (
                      <>
                        <div className="flex-1 text-center">
                          <p className="text-[10px] text-muted-foreground">بازه (روز)</p>
                          <p className="mt-0.5 text-sm font-bold tabular-nums">
                            {formatNumber(program.recurringDays || 0)}
                          </p>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-[10px] text-muted-foreground">پاداش</p>
                          <p className="mt-0.5 text-sm font-bold text-gold tabular-nums">
                            {formatGrams(program.rewardMg || 0)}
                          </p>
                        </div>
                      </>
                    )}
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-muted-foreground">وضعیت</p>
                      <p className={`mt-0.5 text-sm font-bold ${program.isActive ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                        {program.isActive ? '✓ فعال' : '✕ متوقف'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Switch
                        checked={program.isActive}
                        onCheckedChange={() => onToggle(program)}
                        disabled={togglingId === program.id}
                        className="data-[state=checked]:bg-gold"
                      />
                      <span className="text-[11px] text-muted-foreground">
                        {program.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onToggle(program)}
                      disabled={togglingId === program.id}
                      className={`h-8 text-xs border-border/50 ${program.isActive ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'}`}
                    >
                      {togglingId === program.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : program.isActive ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(program)}
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
/*  Section 3: Rewards History                                                 */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function RewardsHistory({
  rewards,
  programs,
}: {
  rewards: RewardRecord[];
  programs: LoyaltyProgram[];
}) {
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [expanded, setExpanded] = useState(false);

  const filteredRewards = filterProgram === 'all'
    ? rewards
    : rewards.filter((r) => r.programName === filterProgram);

  const displayedRewards = expanded ? filteredRewards : filteredRewards.slice(0, 8);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Select value={filterProgram} onValueChange={setFilterProgram}>
            <SelectTrigger className="border-gold/20 h-9 text-xs">
              <SelectValue placeholder="فیلتر بر اساس برنامه" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Gift className="size-3.5 text-gold" />
                  همه برنامه‌ها
                </div>
              </SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      {filteredRewards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Gift className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">پاداشی ثبت نشده</p>
        </div>
      ) : (
        <>
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2 max-h-[28rem] overflow-y-auto">
            {displayedRewards.map((reward) => {
              const typeColorClass = PROGRAM_TYPE_COLORS[reward.type] || PROGRAM_TYPE_COLORS.gold_cashback;
              return (
                <motion.div key={reward.id} variants={itemVariants}>
                  <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 p-3 transition-colors hover:border-gold/15">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${typeColorClass}`}>
                      <Coins className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{reward.userName}</span>
                        <Badge variant="outline" className="border-border/40 text-[9px] shrink-0">
                          {PROGRAM_TYPE_LABELS[reward.type] || reward.type}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {reward.programName} • {getTimeAgo(reward.date)}
                      </p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-sm font-bold text-gold tabular-nums">
                        {formatGrams(reward.amountMg)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
          {filteredRewards.length > 8 && (
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
                  نمایش همه ({formatNumber(filteredRewards.length)})
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
/*  Section 4: Campaign Stats                                                  */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function CampaignStatsSection({ stats }: { stats: CampaignStats }) {
  const statCards = [
    {
      label: 'مجموع پاداش‌ها',
      value: formatGrams(stats.totalRewardsMg),
      icon: Coins,
      color: 'text-gold',
      bgColor: 'bg-gold/5',
      borderColor: 'border-gold/15',
    },
    {
      label: 'کاربران پاداش‌گرفته',
      value: formatNumber(stats.totalUsersRewarded),
      icon: Users,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/10',
      borderColor: 'border-emerald-500/15',
    },
    {
      label: 'میانگین پاداش',
      value: formatGrams(stats.averageRewardMg),
      icon: TrendingUp,
      color: 'text-sky-500',
      bgColor: 'bg-sky-50 dark:bg-sky-900/10',
      borderColor: 'border-sky-500/15',
    },
    {
      label: 'محبوب‌ترین برنامه',
      value: stats.mostPopularProgram || '-',
      icon: Star,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/10',
      borderColor: 'border-amber-500/15',
    },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div key={card.label} variants={itemVariants}>
            <div className={`rounded-xl border ${card.borderColor} ${card.bgColor} p-4 text-center`}>
              <Icon className={`size-6 mx-auto mb-2 ${card.color}`} />
              <p className="text-[10px] text-muted-foreground">{card.label}</p>
              <p className={`mt-1 text-base font-extrabold ${card.color} tabular-nums`}>
                {card.value}
              </p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Section 5: Fee Configuration (Fee Engine Tab)                              */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function FeeConfiguration({ feeData }: { feeData: FeeData | null }) {
  const { user, addToast } = useAppStore();
  const [settlementFee, setSettlementFee] = useState('');
  const [instantFee, setInstantFee] = useState('');
  const [customRate, setCustomRate] = useState('');
  const [requestedTier, setRequestedTier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  // Initialize form values from fee data
  useEffect(() => {
    if (feeData) {
      setSettlementFee(String(feeData.settlementFee));
      setInstantFee(String(feeData.instantSettlementFee));
    }
  }, [feeData]);

  const handleRequestTierChange = useCallback(async () => {
    if (!requestedTier) {
      addToast('لطفاً سطح کارمزد را انتخاب کنید', 'error');
      return;
    }
    setIsSubmitting('tier');
    try {
      const res = await fetch('/api/v1/merchant/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          action: 'request_tier_change',
          requestedTier,
        }),
      });
      const json = await res.json();
      if (json.success) {
        addToast('درخواست تغییر سطح کارمزد ثبت شد', 'success');
        setRequestedTier('');
      } else {
        addToast(json.message || 'خطا', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setIsSubmitting(null);
    }
  }, [requestedTier, user, addToast]);

  const handleUpdateSettlementFees = useCallback(async () => {
    setIsSubmitting('settlement');
    try {
      const res = await fetch('/api/v1/merchant/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          action: 'update_settlement_fees',
          settlementFee: Number(settlementFee) || 0,
          instantSettlementFee: Number(instantFee) || 0,
        }),
      });
      const json = await res.json();
      if (json.success) {
        addToast('تنظیمات کارمزد تسویه بروزرسانی شد', 'success');
      } else {
        addToast(json.message || 'خطا', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setIsSubmitting(null);
    }
  }, [settlementFee, instantFee, user, addToast]);

  const handleUpdateCustomFee = useCallback(async () => {
    const rate = Number(customRate);
    if (isNaN(rate) || rate < 0 || rate > 5) {
      addToast('نرخ کارمزد باید بین ۰ تا ۵ درصد باشد', 'error');
      return;
    }
    setIsSubmitting('custom');
    try {
      const res = await fetch('/api/v1/merchant/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          action: 'update_custom_fee',
          customFeeRate: rate,
        }),
      });
      const json = await res.json();
      if (json.success) {
        addToast('نرخ کارمزد سفارشی بروزرسانی شد', 'success');
        setCustomRate('');
      } else {
        addToast(json.message || 'خطا', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setIsSubmitting(null);
    }
  }, [customRate, user, addToast]);

  if (!feeData) return null;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
      {/* Current tier display */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Crown className="size-4 text-gold" />
            سطح کارمزد فعلی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-muted/30 p-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gold/10 text-gold">
              <Gem className="size-7" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-extrabold text-gold">{feeData.currentTier.nameFa}</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                نرخ فعلی: <span className="font-bold text-foreground tabular-nums">{formatNumber(feeData.merchantFeeRate * 100)}%</span>
              </p>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-muted-foreground">حداقل کارمزد</p>
              <p className="text-sm font-bold tabular-nums">{formatToman(feeData.merchantMinFee)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">حداکثر کارمزد</p>
              <p className="text-sm font-bold tabular-nums">{formatToman(feeData.merchantMaxFee)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee tiers comparison */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Shield className="size-4 text-gold" />
            سطوح کارمزد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {feeData.allTiers.map((tier) => {
              const isCurrent = tier.key === feeData.currentTier.key;
              return (
                <div
                  key={tier.key}
                  className={`rounded-xl border p-3 text-center transition-all ${
                    isCurrent
                      ? 'border-gold/40 bg-gold/10 shadow-sm'
                      : 'border-border/40 bg-muted/20 hover:border-gold/15'
                  }`}
                >
                  <p className="text-xs font-bold" style={{ color: tier.color }}>
                    {tier.nameFa}
                  </p>
                  <p className="mt-1 text-lg font-extrabold tabular-nums" style={{ color: tier.color }}>
                    {formatNumber(tier.rate)}%
                  </p>
                  {isCurrent && (
                    <Badge className="mt-1.5 bg-gold/20 text-gold text-[9px] border-0">
                      فعلی
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Request tier change */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Award className="size-4 text-gold" />
            درخواست تغییر سطح کارمزد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={requestedTier} onValueChange={setRequestedTier}>
            <SelectTrigger className="border-gold/20 text-xs">
              <SelectValue placeholder="انتخاب سطح مورد نظر" />
            </SelectTrigger>
            <SelectContent>
              {feeData.allTiers
                .filter((t) => t.key !== feeData.currentTier.key)
                .map((tier) => (
                  <SelectItem key={tier.key} value={tier.key}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: tier.color }}>{tier.nameFa}</span>
                      <span className="text-muted-foreground">— {formatNumber(tier.rate)}%</span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleRequestTierChange}
            disabled={!requestedTier || isSubmitting === 'tier'}
            className="w-full bg-gold/15 text-gold hover:bg-gold/25 text-xs font-bold"
          >
            {isSubmitting === 'tier' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="size-4 ml-1" />
                ثبت درخواست (نیاز به تأیید مدیر)
              </>
            )}
          </Button>
          {feeData.feeRequests.length > 0 && (
            <div className="space-y-2 mt-3">
              <p className="text-[10px] text-muted-foreground font-semibold">درخواست‌های قبلی:</p>
              {feeData.feeRequests.slice(0, 3).map((req: Record<string, unknown>, i: number) => {
                const status = FEE_REQUEST_STATUS[String(req.status) as keyof typeof FEE_REQUEST_STATUS] || FEE_REQUEST_STATUS.pending;
                return (
                  <div key={String(req.id) || i} className="flex items-center gap-2 rounded-lg border border-border/30 p-2">
                    <Badge className={`${status.color} border-0 text-[9px]`}>
                      {status.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {formatNumber(Number(req.fromTier))}% → {formatNumber(Number(req.toTier))}% ({String(req.toTierName)})
                    </span>
                    <span className="text-[10px] text-muted-foreground mr-auto">
                      {getTimeAgo(String(req.createdAt))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settlement fees */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <DollarSign className="size-4 text-gold" />
            کارمزد تسویه
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">کارمزد تسویه عادی (واحد طلایی)</Label>
              <Input
                type="number"
                min="0"
                value={settlementFee}
                onChange={(e) => setSettlementFee(e.target.value)}
                className="border-gold/20 text-xs tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">کارمزد تسویه فوری (واحد طلایی)</Label>
              <Input
                type="number"
                min="0"
                value={instantFee}
                onChange={(e) => setInstantFee(e.target.value)}
                className="border-gold/20 text-xs tabular-nums"
              />
            </div>
          </div>
          <Button
            onClick={handleUpdateSettlementFees}
            disabled={isSubmitting === 'settlement'}
            className="w-full bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 text-xs font-bold"
          >
            {isSubmitting === 'settlement' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="size-4 ml-1" />
                ذخیره تنظیمات تسویه
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Custom fee override */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Settings className="size-4 text-gold" />
            کارمزد سفارشی فروشگاه
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">نرخ کارمزد سفارشی (%)</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                placeholder="مثلاً: 0.8"
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                className="border-gold/20 text-xs tabular-nums"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              نرخ فعلی: <span className="font-bold text-foreground tabular-nums">{formatNumber(feeData.merchantFeeRate * 100)}%</span>
            </p>
          </div>
          <Button
            onClick={handleUpdateCustomFee}
            disabled={!customRate || isSubmitting === 'custom'}
            className="w-full bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 text-xs font-bold"
          >
            {isSubmitting === 'custom' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="size-4 ml-1" />
                اعمال کارمزد سفارشی
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Main LoyaltyView Component                                                 */
/* ═══════════════════════════════════════════════════════════════════════════════ */

export default function LoyaltyView() {
  const { user, addToast } = useAppStore();
  const [activeTab, setActiveTab] = useState<'programs' | 'rewards' | 'stats' | 'fees'>('programs');
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [rewards, setRewards] = useState<RewardRecord[]>([]);
  const [stats, setStats] = useState<CampaignStats>({ totalRewardsMg: 0, totalUsersRewarded: 0, averageRewardMg: 0, mostPopularProgram: '-' });
  const [feeData, setFeeData] = useState<FeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LoyaltyProgram | null>(null);

  /* ── Fetch loyalty data ── */
  const fetchLoyaltyData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/merchant/loyalty?userId=${user.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPrograms(json.data.programs || []);
        setRewards(json.data.rewards || []);
        setStats(json.data.stats || { totalRewardsMg: 0, totalUsersRewarded: 0, averageRewardMg: 0, mostPopularProgram: '-' });
      }
    } catch {
      addToast('خطا در دریافت اطلاعات وفاداری', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, addToast]);

  /* ── Fetch fee data ── */
  const fetchFeeData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/v1/merchant/fees?userId=${user.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setFeeData(json.data);
      }
    } catch {
      // silent
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLoyaltyData();
    fetchFeeData();
  }, [fetchLoyaltyData, fetchFeeData]);

  /* ── Toggle program active/inactive ── */
  const handleToggle = useCallback(async (program: LoyaltyProgram) => {
    setTogglingId(program.id);
    try {
      const res = await fetch(`/api/v1/merchant/loyalty/${program.id}?userId=${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_active' }),
      });
      const json = await res.json();
      if (json.success) {
        setPrograms((prev) =>
          prev.map((p) => p.id === program.id ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() } : p)
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

  /* ── Delete program ── */
  const handleDelete = useCallback(async () => {
    if (!deleteTarget || !user?.id) return;
    try {
      const res = await fetch(`/api/v1/merchant/loyalty/${deleteTarget.id}?userId=${user.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setPrograms((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        addToast('برنامه وفاداری حذف شد', 'success');
      } else {
        addToast(json.message || 'خطا در حذف', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, user?.id, addToast]);

  /* ── Tab config ── */
  const tabs = [
    { key: 'programs' as const, label: 'برنامه‌ها', icon: <Heart className="size-4" /> },
    { key: 'rewards' as const, label: 'پاداش‌ها', icon: <Gift className="size-4" /> },
    { key: 'stats' as const, label: 'آمار', icon: <TrendingUp className="size-4" /> },
    { key: 'fees' as const, label: 'کارمزد', icon: <DollarSign className="size-4" /> },
  ];

  return (
    <div className="page-transition mx-auto max-w-3xl space-y-5 pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-gold to-gold-dark shadow-lg shadow-gold/20">
          <Heart className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold">وفاداری و کارمزد</h1>
          <p className="text-xs text-muted-foreground">مدیریت برنامه‌های وفاداری و تنظیمات کارمزد</p>
        </div>
      </motion.div>

      {/* Stats summary bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3"
      >
        <div className="rounded-xl border border-gold/15 bg-gold/5 p-3 text-center">
          <p className="text-[10px] text-muted-foreground">برنامه فعال</p>
          <p className="mt-1 text-lg font-extrabold text-gold tabular-nums">
            {formatNumber(programs.filter((p) => p.isActive).length)}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground">کل پاداش‌ها</p>
          <p className="mt-1 text-lg font-extrabold tabular-nums text-gold">
            {formatGrams(stats.totalRewardsMg)}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground">نرخ کارمزد</p>
          <p className="mt-1 text-lg font-extrabold tabular-nums">
            {feeData ? `${formatNumber(feeData.merchantFeeRate * 100)}%` : '-'}
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
        {/* ── Programs Tab ── */}
        {activeTab === 'programs' && (
          <motion.div
            key="programs"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Create form */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Plus className="size-4 text-gold" />
                  ایجاد برنامه وفاداری جدید
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CreateProgramForm onCreated={fetchLoyaltyData} />
              </CardContent>
            </Card>

            {/* Active programs list */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Zap className="size-4 text-gold" />
                  برنامه‌های وفاداری
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <ProgramsList
                    programs={programs}
                    onToggle={handleToggle}
                    onDelete={setDeleteTarget}
                    togglingId={togglingId}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Rewards Tab ── */}
        {activeTab === 'rewards' && (
          <motion.div
            key="rewards"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Gift className="size-4 text-gold" />
                  تاریخچه پاداش‌ها
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <RewardsHistory rewards={rewards} programs={programs} />
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Stats Tab ── */}
        {activeTab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="size-4 text-gold" />
                  آمار کمپین
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <CampaignStatsSection stats={stats} />
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Fees Tab ── */}
        {activeTab === 'fees' && (
          <motion.div
            key="fees"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {feeData ? (
              <FeeConfiguration feeData={feeData} />
            ) : (
              <Card className="border-border/50">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف برنامه وفاداری</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف برنامه «{deleteTarget?.name}» مطمئنید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

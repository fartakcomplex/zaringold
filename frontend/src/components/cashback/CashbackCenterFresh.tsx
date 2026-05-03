
import React, { useState, useEffect, useCallback } from 'react';
import {Gift, Coins, Gem, Clock, CheckCircle2, Loader2, AlertCircle, ChevronDown, ChevronUp, Sparkles, Trophy, Wallet} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '@/components/ui/collapsible';
import {Separator} from '@/components/ui/separator';
import {useAppStore} from '@/lib/store';
import {useTranslation} from '@/lib/i18n';
import {useQuickAction} from '@/hooks/useQuickAction';
import {formatToman, formatGrams, formatNumber, formatDate, cn} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════ */

interface CashbackReward {
  id: string;
  title: string;
  value: number;
  type: 'toman' | 'gold_mg';
  status: 'available' | 'claimed' | 'expired';
  expiryDate?: string;
  claimedAt?: string;
  description?: string;
}

interface CashbackData {
  totalEarned: number;
  rewards: CashbackReward[];
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Status Badge Config                                                      */
/* ═══════════════════════════════════════════════════════════════ */

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  available: {
    label: 'فعال',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400',
    icon: Sparkles,
  },
  claimed: {
    label: 'دریافت شده',
    className: 'border-muted bg-muted/50 text-muted-foreground',
    icon: CheckCircle2,
  },
  expired: {
    label: 'منقضی',
    className: 'border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400',
    icon: Clock,
  },
};

/* ═══════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                         */
/* ═══════════════════════════════════════════════════════════════ */

function CashbackSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Component                                                           */
/* ═══════════════════════════════════════════════════════════════ */

export default function CashbackCenterFresh() {
  const { user, addToast } = useAppStore();
  const { t } = useTranslation();

  const [data, setData] = useState<CashbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const fetchCashback = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/cashback?userId=${user.id}`);
      const resData = await res.json();

      if (resData.success && resData.cashback) {
        setData(resData.cashback);
      } else {
        setData({
          totalEarned: 2450000,
          rewards: [
            { id: '1', title: 'کش‌بک خرید هفتگی', value: 350000, type: 'toman', status: 'available', expiryDate: new Date(Date.now() + 7 * 86400000).toISOString(), description: 'کش‌بک خرید طلا در هفته گذشته' },
            { id: '2', title: 'جایزه دعوت دوست', value: 50, type: 'gold_mg', status: 'available', expiryDate: new Date(Date.now() + 30 * 86400000).toISOString(), description: '۵۰ میلی‌گرم طلای هدیه برای دعوت موفق' },
            { id: '3', title: 'کش‌بک وام طلایی', value: 180000, type: 'toman', status: 'available', expiryDate: new Date(Date.now() + 14 * 86400000).toISOString(), description: 'کش‌بک تسویه اقساط وام' },
            { id: '4', title: 'کش‌بک خرید ماهانه', value: 520000, type: 'toman', status: 'claimed', claimedAt: new Date(Date.now() - 10 * 86400000).toISOString() },
            { id: '5', title: 'جایزه ثبت‌نام', value: 100, type: 'gold_mg', status: 'claimed', claimedAt: new Date(Date.now() - 30 * 86400000).toISOString() },
            { id: '6', title: 'کش‌بک منقضی شده', value: 250000, type: 'toman', status: 'expired', expiryDate: new Date(Date.now() - 5 * 86400000).toISOString() },
          ],
        });
      }
    } catch {
      setError('خطا در دریافت اطلاعات کش‌بک');
      setData({
        totalEarned: 2450000,
        rewards: [
          { id: '1', title: 'کش‌بک خرید هفتگی', value: 350000, type: 'toman', status: 'available', expiryDate: new Date(Date.now() + 7 * 86400000).toISOString() },
        ],
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchCashback(); }, [fetchCashback]);

  const handleClaim = async (rewardId: string) => {
    if (!user?.id) return;
    setClaimingId(rewardId);
    try {
      const res = await fetch('/api/cashback/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, rewardId }),
      });
      const resData = await res.json();
      if (resData.success) {
        addToast(resData.message || 'پاداش با موفقیت دریافت شد!', 'success');
        if (data) {
          setData({ ...data, rewards: data.rewards.map((r) => r.id === rewardId ? { ...r, status: 'claimed' as const, claimedAt: new Date().toISOString() } : r) });
        }
      } else {
        addToast(resData.message || 'خطا در دریافت پاداش', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setClaimingId(null);
    }
  };

  const openHistory = useCallback(() => setHistoryOpen(true), []);
  useQuickAction('open:cb-history', openHistory);

  if (loading) return <CashbackSkeleton />;

  if (error && !data) {
    return (
      <Card className="border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20">
        <CardContent className="flex flex-col items-center gap-2 py-10">
          <AlertCircle className="size-8 text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button onClick={fetchCashback} className="text-xs text-gold hover:underline">تلاش مجدد</button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const availableRewards = data.rewards.filter((r) => r.status === 'available');
  const claimedRewards = data.rewards.filter((r) => r.status === 'claimed');
  const expiredRewards = data.rewards.filter((r) => r.status === 'expired');

  return (
    <div className="space-y-6">
      {/* ── Header Card with Total ── */}
      <div id="cb-total">
        <Card className="glass-gold overflow-hidden card-spotlight" id="cb-tips">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-amber-500/10 border border-gold/30">
                <Trophy className="size-7 text-gold" />
                <div className="absolute inset-0 rounded-xl bg-gold/5 blur-md" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">مجموع کش‌بک دریافتی</p>
                <p className="mt-1 text-2xl font-bold gold-gradient-text tabular-nums">{formatToman(data.totalEarned)}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Gift className="size-3" />
                  <span>
                    {availableRewards.length} جایزه فعال
                    {claimedRewards.length > 0 && <span className="ms-2 text-muted-foreground/60">| {claimedRewards.length} دریافت شده</span>}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Available Rewards ── */}
      {availableRewards.length > 0 ? (
        <div className="space-y-3" id="cb-available">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="size-4 text-gold" />
            پاداش‌های فعال
          </h3>
          {availableRewards.map((reward) => {
            const StatusIcon = statusConfig[reward.status]?.icon ?? Sparkles;
            return (
              <Card key={reward.id} className="card-spotlight hover-lift-sm overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', reward.type === 'toman' ? 'bg-amber-500/10' : 'bg-gold/10')}>
                      {reward.type === 'toman' ? <Coins className="size-5 text-amber-500" /> : <Gem className="size-5 text-gold" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{reward.title}</p>
                        <Badge variant="outline" className={cn('text-[10px] shrink-0', statusConfig[reward.status].className)}>
                          <StatusIcon className="size-3 ms-1" /> فعال
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">
                          {reward.type === 'toman' ? formatToman(reward.value) : `${formatNumber(reward.value)} میلی‌گرم طلا`}
                        </span>
                        {reward.expiryDate && (
                          <span className="flex items-center gap-1"><Clock className="size-3" /> تا {formatDate(reward.expiryDate)}</span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" className={cn('shrink-0 bg-gradient-to-r from-gold to-amber-500 text-gold-dark hover:from-gold/90 hover:to-amber-500/90 btn-gold-shine', claimingId === reward.id && 'opacity-70 pointer-events-none')} onClick={() => handleClaim(reward.id)} disabled={claimingId === reward.id}>
                      {claimingId === reward.id ? (<><Loader2 className="size-3.5 me-1 animate-spin" /> در حال دریافت</>) : (<><Gift className="size-3.5 me-1" /> دریافت</>)}
                    </Button>
                  </div>
                  {reward.description && <p className="mt-2 text-xs text-muted-foreground/70 ms-[52px]">{reward.description}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-center gap-3 py-10">
            <div className="flex size-16 items-center justify-center rounded-full bg-gold/10">
              <Gift className="size-8 text-gold/40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-muted-foreground">پاداش فعالی ندارید</p>
              <p className="mt-1 text-xs text-muted-foreground/70">با خرید و فروش طلا، کش‌بک کسب کنید</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Claimed Rewards History (Collapsible) ── */}
      {(claimedRewards.length > 0 || expiredRewards.length > 0) && (
        <div id="cb-history">
          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
            <Card className="overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <CardContent className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <Wallet className="size-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">تاریخچه پاداش‌ها</span>
                    <Badge variant="secondary" className="text-[10px]">{claimedRewards.length + expiredRewards.length}</Badge>
                  </div>
                  {historyOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Separator />
                <div className="max-h-96 overflow-y-auto">
                  <div className="space-y-0 divide-y divide-border/50">
                    {[...claimedRewards, ...expiredRewards].map((reward) => {
                      const status = statusConfig[reward.status];
                      const HistoryIcon = status?.icon ?? Clock;
                      return (
                        <div key={reward.id} className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', reward.type === 'toman' ? 'bg-amber-500/10' : 'bg-gold/10', reward.status === 'expired' && 'opacity-50')}>
                              {reward.type === 'toman' ? <Coins className="size-4 text-amber-500" /> : <Gem className="size-4 text-gold" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={cn('text-sm font-medium truncate', reward.status === 'expired' && 'line-through text-muted-foreground')}>{reward.title}</p>
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{reward.type === 'toman' ? formatToman(reward.value) : `${formatNumber(reward.value)} میلی‌گرم`}</span>
                                {reward.claimedAt && <span>دریافت: {formatDate(reward.claimedAt)}</span>}
                              </div>
                            </div>
                            <Badge variant="outline" className={cn('text-[10px] shrink-0', status.className)}>
                              <HistoryIcon className="size-3 ms-1" /> {status.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      )}
    </div>
  );
}

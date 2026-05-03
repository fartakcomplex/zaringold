
import React, { useState, useEffect, useCallback } from 'react';
import {useAppStore} from '@/lib/store';
import {toPersianDigits, formatToman, getTimeAgo} from '@/lib/helpers';
import {cn} from '@/lib/utils';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Skeleton} from '@/components/ui/skeleton';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Crown, Gift, Percent, Plus, Search, Filter, Calendar, Clock, CheckCircle, XCircle, Hourglass, Eye, Ban, Loader2, Coins, Sparkles, PartyPopper, Heart, GraduationCap, Star} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RewardUser {
  id: string;
  fullName: string | null;
  phone: string;
}

interface VIPSubscription {
  id: string;
  user: RewardUser;
  plan: 'silver' | 'gold' | 'black';
  startDate: string;
  expiryDate: string;
  autoRenew: boolean;
  status: 'active' | 'expired';
  createdAt: string;
}

interface CashbackReward {
  id: string;
  user: RewardUser;
  title: string;
  value: number;
  type: 'toman' | 'gold';
  status: 'pending' | 'claimed' | 'expired';
  createdAt: string;
  expiryDate: string;
}

interface GiftTransfer {
  id: string;
  sender: RewardUser;
  receiver: RewardUser;
  goldAmount: number;
  occasion: string;
  message: string;
  status: 'completed' | 'pending';
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  silver: { label: 'نقره‌ای', color: 'text-gray-400', bg: 'bg-gray-300/20', border: 'border-gray-400/30', icon: '🥈' },
  gold: { label: 'طلایی', color: 'text-gold', bg: 'bg-gold/15', border: 'border-gold/30', icon: '🥇' },
  black: { label: 'مشکی', color: 'text-zinc-300', bg: 'bg-zinc-700/30', border: 'border-zinc-600/30', icon: '⚫' },
};

const CASHBACK_STATUS: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  pending: { label: 'در انتظار', color: 'text-amber-500', bg: 'bg-amber-500/15', icon: Hourglass },
  claimed: { label: 'دریافت شده', color: 'text-emerald-500', bg: 'bg-emerald-500/15', icon: CheckCircle },
  expired: { label: 'منقضی', color: 'text-red-500', bg: 'bg-red-500/15', icon: XCircle },
};

const OCCASION_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Gift }> = {
  birthday: { label: 'تولد', color: 'text-pink-500', bg: 'bg-pink-500/15', icon: PartyPopper },
  wedding: { label: 'عروسی', color: 'text-rose-500', bg: 'bg-rose-500/15', icon: Heart },
  graduation: { label: 'فارغ‌التحصیلی', color: 'text-blue-500', bg: 'bg-blue-500/15', icon: GraduationCap },
  congratulation: { label: 'تبریک', color: 'text-gold', bg: 'bg-gold/15', icon: Star },
  new_year: { label: 'سال نو', color: 'text-emerald-500', bg: 'bg-emerald-500/15', icon: Sparkles },
  custom: { label: 'سفارشی', color: 'text-violet-500', bg: 'bg-violet-500/15', icon: Gift },
};

const MOCK_VIP: VIPSubscription[] = [
  { id: 'v1', user: { id: 'u1', fullName: 'علی محمدی', phone: '09121234567' }, plan: 'gold', startDate: '2025-01-01', expiryDate: '2026-01-01', autoRenew: true, status: 'active', createdAt: '2025-01-01T10:00:00Z' },
  { id: 'v2', user: { id: 'u2', fullName: 'مریم احمدی', phone: '09139876543' }, plan: 'black', startDate: '2025-03-15', expiryDate: '2026-03-15', autoRenew: true, status: 'active', createdAt: '2025-03-15T10:00:00Z' },
  { id: 'v3', user: { id: 'u3', fullName: 'رضا کریمی', phone: '09151112233' }, plan: 'silver', startDate: '2024-06-01', expiryDate: '2025-06-01', autoRenew: false, status: 'expired', createdAt: '2024-06-01T10:00:00Z' },
  { id: 'v4', user: { id: 'u4', fullName: 'زهرا نوری', phone: '09164445566' }, plan: 'gold', startDate: '2025-02-10', expiryDate: '2026-02-10', autoRenew: true, status: 'active', createdAt: '2025-02-10T10:00:00Z' },
  { id: 'v5', user: { id: 'u5', fullName: 'حسین رحیمی', phone: '09177778889' }, plan: 'silver', startDate: '2024-12-01', expiryDate: '2025-06-01', autoRenew: false, status: 'active', createdAt: '2024-12-01T10:00:00Z' },
];

const MOCK_CASHBACK: CashbackReward[] = [
  { id: 'c1', user: { id: 'u1', fullName: 'علی محمدی', phone: '09121234567' }, title: 'کش‌بک خرید طلا', value: 50000, type: 'toman', status: 'pending', createdAt: '2025-06-10T10:00:00Z', expiryDate: '2025-07-10' },
  { id: 'c2', user: { id: 'u2', fullName: 'مریم احمدی', phone: '09139876543' }, title: 'پاداش VIP', value: 15, type: 'gold', status: 'pending', createdAt: '2025-06-08T10:00:00Z', expiryDate: '2025-07-08' },
  { id: 'c3', user: { id: 'u3', fullName: 'رضا کریمی', phone: '09151112233' }, title: 'کش‌بک معاملاتی', value: 120000, type: 'toman', status: 'claimed', createdAt: '2025-05-20T10:00:00Z', expiryDate: '2025-06-20' },
  { id: 'c4', user: { id: 'u4', fullName: 'زهرا نوری', phone: '09164445566' }, title: 'کش‌بک هفتگی', value: 8, type: 'gold', status: 'claimed', createdAt: '2025-06-01T10:00:00Z', expiryDate: '2025-06-15' },
  { id: 'c5', user: { id: 'u5', fullName: 'حسین رحیمی', phone: '09177778889' }, title: 'کش‌بک خرید طلای آبشاری', value: 30000, type: 'toman', status: 'expired', createdAt: '2025-04-01T10:00:00Z', expiryDate: '2025-05-01' },
  { id: 'c6', user: { id: 'u1', fullName: 'علی محمدی', phone: '09121234567' }, title: 'پاداش دعوت از دوست', value: 25000, type: 'toman', status: 'claimed', createdAt: '2025-05-15T10:00:00Z', expiryDate: '2025-06-15' },
];

const MOCK_GIFTS: GiftTransfer[] = [
  { id: 'g1', sender: { id: 'u1', fullName: 'علی محمدی', phone: '09121234567' }, receiver: { id: 'u2', fullName: 'مریم احمدی', phone: '09139876543' }, goldAmount: 50, occasion: 'birthday', message: 'تولدت مبارک!', status: 'completed', createdAt: '2025-06-05T10:00:00Z' },
  { id: 'g2', sender: { id: 'u3', fullName: 'رضا کریمی', phone: '09151112233' }, receiver: { id: 'u4', fullName: 'زهرا نوری', phone: '09164445566' }, goldAmount: 100, occasion: 'wedding', message: 'شادکامی عروسی!', status: 'completed', createdAt: '2025-05-20T10:00:00Z' },
  { id: 'g3', sender: { id: 'u2', fullName: 'مریم احمدی', phone: '09139876543' }, receiver: { id: 'u5', fullName: 'حسین رحیمی', phone: '09177778889' }, goldAmount: 25, occasion: 'graduation', message: 'تبریک فارغ‌التحصیلی!', status: 'pending', createdAt: '2025-06-12T10:00:00Z' },
  { id: 'g4', sender: { id: 'u4', fullName: 'زهرا نوری', phone: '09164445566' }, receiver: { id: 'u1', fullName: 'علی محمدی', phone: '09121234567' }, goldAmount: 75, occasion: 'new_year', message: 'سال نو مبارک!', status: 'completed', createdAt: '2025-03-20T10:00:00Z' },
  { id: 'g5', sender: { id: 'u5', fullName: 'حسین رحیمی', phone: '09177778889' }, receiver: { id: 'u3', fullName: 'رضا کریمی', phone: '09151112233' }, goldAmount: 30, occasion: 'congratulation', message: 'تبریک! بهت خوش می‌گذره!', status: 'completed', createdAt: '2025-06-01T10:00:00Z' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminRewards() {
  const addToast = useAppStore((s) => s.addToast);

  /* ---- VIP State ---- */
  const [vipSubs, setVipSubs] = useState<VIPSubscription[]>([]);
  const [vipLoading, setVipLoading] = useState(true);
  const [vipPlanFilter, setVipPlanFilter] = useState('all');
  const [vipStatusFilter, setVipStatusFilter] = useState('all');
  const [extendSub, setExtendSub] = useState<VIPSubscription | null>(null);
  const [extendDays, setExtendDays] = useState('30');
  const [extendOpen, setExtendOpen] = useState(false);
  const [extendSubmitting, setExtendSubmitting] = useState(false);

  /* ---- Cashback State ---- */
  const [cashbacks, setCashbacks] = useState<CashbackReward[]>([]);
  const [cashbackLoading, setCashbackLoading] = useState(true);
  const [cashbackFilter, setCashbackFilter] = useState('all');
  const [createRewardOpen, setCreateRewardOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [newReward, setNewReward] = useState({ userId: '', title: '', value: '', type: 'toman' as 'toman' | 'gold', days: '30' });

  /* ---- Gifts State ---- */
  const [gifts, setGifts] = useState<GiftTransfer[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(true);
  const [giftFilter, setGiftFilter] = useState('all');

  /* ---- Fetch ---- */
  const fetchVIP = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/vip');
      if (res.ok) {
        const data = await res.json();
        setVipSubs(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : data.subscriptions || MOCK_VIP);
      } else {
        setVipSubs(MOCK_VIP);
      }
    } catch {
      setVipSubs(MOCK_VIP);
    }
    setVipLoading(false);
  }, []);

  const fetchCashback = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/cashback');
      if (res.ok) {
        const data = await res.json();
        setCashbacks(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : data.rewards || MOCK_CASHBACK);
      } else {
        setCashbacks(MOCK_CASHBACK);
      }
    } catch {
      setCashbacks(MOCK_CASHBACK);
    }
    setCashbackLoading(false);
  }, []);

  const fetchGifts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/gifts');
      if (res.ok) {
        const data = await res.json();
        setGifts(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : data.transfers || MOCK_GIFTS);
      } else {
        setGifts(MOCK_GIFTS);
      }
    } catch {
      setGifts(MOCK_GIFTS);
    }
    setGiftsLoading(false);
  }, []);

  useEffect(() => { fetchVIP(); }, [fetchVIP]);
  useEffect(() => { fetchCashback(); }, [fetchCashback]);
  useEffect(() => { fetchGifts(); }, [fetchGifts]);

  /* ---- Filtered Data ---- */
  const filteredVIP = vipSubs.filter((s) => {
    const matchPlan = vipPlanFilter === 'all' || s.plan === vipPlanFilter;
    const matchStatus = vipStatusFilter === 'all' || s.status === vipStatusFilter;
    return matchPlan && matchStatus;
  });

  const filteredCashback = cashbacks.filter((r) => {
    return cashbackFilter === 'all' || r.status === cashbackFilter;
  });

  const filteredGifts = gifts.filter((g) => {
    return giftFilter === 'all' || g.status === giftFilter;
  });

  /* ---- Handlers ---- */
  const handleExtendSubscription = async () => {
    if (!extendSub || !extendDays) return;
    setExtendSubmitting(true);
    try {
      const res = await fetch(`/api/admin/vip/${extendSub.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'extend', days: Number(extendDays) }),
      });
      if (res.ok) {
        addToast(`اشتراک ${PLAN_CONFIG[extendSub.plan]?.label} کاربر ${extendSub.user.fullName} تمدید شد`, 'success');
        setVipSubs((prev) =>
          prev.map((s) => s.id === extendSub.id ? {
            ...s,
            expiryDate: new Date(new Date(s.expiryDate).getTime() + Number(extendDays) * 86400000).toISOString().slice(0, 10),
          } : s)
        );
        setExtendOpen(false);
        setExtendSub(null);
      } else {
        addToast('خطا در تمدید اشتراک', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setExtendSubmitting(false);
    }
  };

  const handleCancelSubscription = async (sub: VIPSubscription) => {
    try {
      const res = await fetch(`/api/admin/vip/${sub.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      if (res.ok) {
        addToast(`اشتراک ${sub.user.fullName} لغو شد`, 'success');
        setVipSubs((prev) => prev.map((s) => s.id === sub.id ? { ...s, status: 'expired', autoRenew: false } : s));
      } else {
        addToast('خطا در لغو اشتراک', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
  };

  const handleCreateReward = async () => {
    if (!newReward.title || !newReward.value) {
      addToast('لطفاً تمام فیلدها را پر کنید', 'error');
      return;
    }
    setCreateSubmitting(true);
    try {
      const res = await fetch('/api/admin/cashback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newReward.userId || undefined,
          title: newReward.title,
          value: Number(newReward.value),
          rewardType: newReward.type,
          expiresInDays: Number(newReward.days),
        }),
      });
      if (res.ok) {
        addToast('جایزه جدید با موفقیت ایجاد شد', 'success');
        setCreateRewardOpen(false);
        setNewReward({ userId: '', title: '', value: '', type: 'toman', days: '30' });
        await fetchCashback();
      } else {
        addToast('خطا در ایجاد جایزه', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleClaimReward = async (reward: CashbackReward) => {
    try {
      const res = await fetch(`/api/admin/cashback/${reward.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'claimed' }) });
      if (res.ok) {
        addToast(`جایزه "${reward.title}" دریافت شد`, 'success');
        setCashbacks((prev) => prev.map((r) => r.id === reward.id ? { ...r, status: 'claimed' } : r));
      } else {
        addToast('خطا در تأیید جایزه', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
  };

  /* ---- Render ---- */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-gold/25 to-gold/10 flex items-center justify-center border border-gold/20">
            <Crown className="size-5 text-gold" />
          </div>
          <div>
            <h2 className="text-lg font-bold">مدیریت پاداش‌ها</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              اشتراک‌های VIP، جوایز کش‌بک و انتقالات هدیه
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-gold/15 text-gold text-xs">
            <Crown className="size-3 ml-1" />
            {toPersianDigits(String(vipSubs.filter((s) => s.status === 'active').length))} اشتراک فعال
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="vip" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 h-auto">
          <TabsTrigger value="vip" className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold text-sm">
            <Crown className="size-4 ml-1.5" />
            اشتراک‌های VIP
            <Badge className="bg-gold/15 text-gold text-[10px] mr-1.5">
              {toPersianDigits(String(filteredVIP.length))}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="cashback" className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold text-sm">
            <Percent className="size-4 ml-1.5" />
            جوایز کش‌بک
            <Badge className="bg-gold/15 text-gold text-[10px] mr-1.5">
              {toPersianDigits(String(filteredCashback.length))}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="gifts" className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold text-sm">
            <Gift className="size-4 ml-1.5" />
            انتقالات هدیه
            <Badge className="bg-gold/15 text-gold text-[10px] mr-1.5">
              {toPersianDigits(String(filteredGifts.length))}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ═══ Tab 1: VIP Subscriptions ═══ */}
        <TabsContent value="vip" className="space-y-4">
          {/* Filters */}
          <Card className="glass-gold">
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="size-4 text-gold" />
                  <span className="text-sm font-medium">فیلتر:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Plan filter */}
                  <Select value={vipPlanFilter} onValueChange={setVipPlanFilter}>
                    <SelectTrigger className="w-full sm:w-32 text-xs">
                      <SelectValue placeholder="طرح" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه طرح‌ها</SelectItem>
                      <SelectItem value="silver">نقره‌ای</SelectItem>
                      <SelectItem value="gold">طلایی</SelectItem>
                      <SelectItem value="black">مشکی</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* Status filter */}
                  <Select value={vipStatusFilter} onValueChange={setVipStatusFilter}>
                    <SelectTrigger className="w-full sm:w-32 text-xs">
                      <SelectValue placeholder="وضعیت" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                      <SelectItem value="active">فعال</SelectItem>
                      <SelectItem value="expired">منقضی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* VIP Table */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">کاربر</TableHead>
                      <TableHead className="text-xs">طرح</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">تاریخ شروع</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">تاریخ انقضا</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">تمدید خودکار</TableHead>
                      <TableHead className="text-xs">وضعیت</TableHead>
                      <TableHead className="text-xs text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vipLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={7}><Skeleton className="h-12 w-full" /></TableCell>
                          </TableRow>
                        ))
                      : filteredVIP.map((sub) => {
                          const planCfg = PLAN_CONFIG[sub.plan] || PLAN_CONFIG.silver;
                          return (
                            <TableRow key={sub.id} className="hover:bg-gold/5 transition-colors">
                              {/* User */}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    'size-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border',
                                    planCfg.bg, planCfg.border, planCfg.color
                                  )}>
                                    {planCfg.icon}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{sub.user.fullName || 'بدون نام'}</p>
                                    <p className="text-[10px] text-muted-foreground truncate" dir="ltr">{sub.user.phone}</p>
                                  </div>
                                </div>
                              </TableCell>
                              {/* Plan */}
                              <TableCell>
                                <Badge className={cn('text-[10px] font-bold', planCfg.bg, planCfg.color, planCfg.border, 'border')}>
                                  {planCfg.icon} {planCfg.label}
                                </Badge>
                              </TableCell>
                              {/* Start Date */}
                              <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                                {new Date(sub.startDate).toLocaleDateString('fa-IR')}
                              </TableCell>
                              {/* Expiry Date */}
                              <TableCell className="hidden md:table-cell text-xs">
                                <span className={cn(
                                  sub.status === 'active' ? 'text-foreground' : 'text-muted-foreground'
                                )}>
                                  {new Date(sub.expiryDate).toLocaleDateString('fa-IR')}
                                </span>
                              </TableCell>
                              {/* Auto Renew */}
                              <TableCell className="hidden sm:table-cell">
                                <Badge className={cn(
                                  'text-[10px]',
                                  sub.autoRenew ? 'bg-emerald-500/15 text-emerald-500' : 'bg-gray-400/15 text-gray-400'
                                )}>
                                  {sub.autoRenew ? 'بله' : 'خیر'}
                                </Badge>
                              </TableCell>
                              {/* Status */}
                              <TableCell>
                                <Badge className={cn(
                                  'text-[10px]',
                                  sub.status === 'active' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'
                                )}>
                                  {sub.status === 'active' ? 'فعال' : 'منقضی'}
                                </Badge>
                              </TableCell>
                              {/* Actions */}
                              <TableCell>
                                <div className="flex items-center justify-center gap-0.5">
                                  {sub.status === 'active' && (
                                    <>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="size-7 text-muted-foreground hover:text-gold"
                                        onClick={() => { setExtendSub(sub); setExtendDays('30'); setExtendOpen(true); }}
                                        title="تمدید اشتراک"
                                      >
                                        <Clock className="size-3.5" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="size-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                        onClick={() => handleCancelSubscription(sub)}
                                        title="لغو اشتراک"
                                      >
                                        <Ban className="size-3.5" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}

                    {!vipLoading && filteredVIP.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <Crown className="size-10 mx-auto mb-2 opacity-20" />
                          <p className="text-sm text-muted-foreground">اشتراک VIP یافت نشد</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Tab 2: Cashback Rewards ═══ */}
        <TabsContent value="cashback" className="space-y-4">
          {/* Header with Create */}
          <Card className="glass-gold">
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="size-4 text-gold" />
                  <span className="text-sm font-medium">فیلتر:</span>
                </div>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'همه' },
                    { value: 'pending', label: 'در انتظار' },
                    { value: 'claimed', label: 'دریافت شده' },
                    { value: 'expired', label: 'منقضی' },
                  ].map((f) => (
                    <Button
                      key={f.value}
                      size="sm"
                      variant={cashbackFilter === f.value ? 'default' : 'outline'}
                      onClick={() => setCashbackFilter(f.value)}
                      className={cn(
                        cashbackFilter === f.value
                          ? 'bg-gold text-black font-bold'
                          : 'border-gold/20 text-muted-foreground hover:text-gold hover:bg-gold/10',
                        'text-xs'
                      )}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
                <Button
                  size="sm"
                  onClick={() => setCreateRewardOpen(true)}
                  className="mr-auto bg-gradient-to-l from-gold to-yellow-500 text-black font-bold hover:from-gold/90 hover:to-yellow-500/90"
                >
                  <Plus className="size-4 ml-1.5" />
                  ایجاد جایزه
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cashback Table */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">کاربر</TableHead>
                      <TableHead className="text-xs">عنوان</TableHead>
                      <TableHead className="text-xs">مقدار</TableHead>
                      <TableHead className="text-xs">وضعیت</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">تاریخ ایجاد</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">انقضا</TableHead>
                      <TableHead className="text-xs text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashbackLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={7}><Skeleton className="h-12 w-full" /></TableCell>
                          </TableRow>
                        ))
                      : filteredCashback.map((reward) => {
                          const statusCfg = CASHBACK_STATUS[reward.status] || CASHBACK_STATUS.pending;
                          const StatusIcon = statusCfg.icon;
                          return (
                            <TableRow key={reward.id} className="hover:bg-gold/5 transition-colors">
                              {/* User */}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="size-8 shrink-0 rounded-full bg-gold/15 flex items-center justify-center text-xs font-bold text-gold">
                                    {(reward.user.fullName || reward.user.phone).charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{reward.user.fullName || 'بدون نام'}</p>
                                    <p className="text-[10px] text-muted-foreground truncate" dir="ltr">{reward.user.phone}</p>
                                  </div>
                                </div>
                              </TableCell>
                              {/* Title */}
                              <TableCell className="text-sm">{reward.title}</TableCell>
                              {/* Value */}
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Coins className={cn('size-3.5', reward.type === 'gold' ? 'text-gold' : 'text-emerald-500')} />
                                  <span className={cn('text-sm font-bold', reward.type === 'gold' ? 'gold-gradient-text' : '')}>
                                    {reward.type === 'gold'
                                      ? `${toPersianDigits(String(reward.value))} mg`
                                      : formatToman(reward.value)
                                    }
                                  </span>
                                </div>
                              </TableCell>
                              {/* Status */}
                              <TableCell>
                                <Badge className={cn('text-[10px]', statusCfg.bg, statusCfg.color)}>
                                  <StatusIcon className="size-3 ml-1" />
                                  {statusCfg.label}
                                </Badge>
                              </TableCell>
                              {/* Created At */}
                              <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                                {getTimeAgo(reward.createdAt)}
                              </TableCell>
                              {/* Expiry */}
                              <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="size-3" />
                                  {new Date(reward.expiryDate).toLocaleDateString('fa-IR')}
                                </div>
                              </TableCell>
                              {/* Actions */}
                              <TableCell>
                                <div className="flex items-center justify-center">
                                  {reward.status === 'pending' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="size-7 text-emerald-500 hover:bg-emerald-500/10 text-xs"
                                      onClick={() => handleClaimReward(reward)}
                                      title="تأیید و دریافت"
                                    >
                                      <CheckCircle className="size-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}

                    {!cashbackLoading && filteredCashback.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <Percent className="size-10 mx-auto mb-2 opacity-20" />
                          <p className="text-sm text-muted-foreground">جایزهای یافت نشد</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Tab 3: Gift Transfers ═══ */}
        <TabsContent value="gifts" className="space-y-4">
          {/* Filters */}
          <Card className="glass-gold">
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="size-4 text-gold" />
                  <span className="text-sm font-medium">فیلتر:</span>
                </div>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'همه' },
                    { value: 'completed', label: 'تکمیل شده' },
                    { value: 'pending', label: 'در انتظار' },
                  ].map((f) => (
                    <Button
                      key={f.value}
                      size="sm"
                      variant={giftFilter === f.value ? 'default' : 'outline'}
                      onClick={() => setGiftFilter(f.value)}
                      className={cn(
                        giftFilter === f.value
                          ? 'bg-gold text-black font-bold'
                          : 'border-gold/20 text-muted-foreground hover:text-gold hover:bg-gold/10',
                        'text-xs'
                      )}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gifts Table */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">فرستنده</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">دریافت‌کننده</TableHead>
                      <TableHead className="text-xs">مقدار طلا</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">مناسبت</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">پیام</TableHead>
                      <TableHead className="text-xs">وضعیت</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">تاریخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {giftsLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={7}><Skeleton className="h-12 w-full" /></TableCell>
                          </TableRow>
                        ))
                      : filteredGifts.map((gift) => {
                          const occCfg = OCCASION_CONFIG[gift.occasion] || OCCASION_CONFIG.custom;
                          const OccIcon = occCfg.icon;
                          return (
                            <TableRow key={gift.id} className="hover:bg-gold/5 transition-colors">
                              {/* Sender */}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="size-8 shrink-0 rounded-full bg-pink-500/15 flex items-center justify-center text-xs font-bold text-pink-500">
                                    {(gift.sender.fullName || gift.sender.phone).charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{gift.sender.fullName || 'بدون نام'}</p>
                                  </div>
                                </div>
                              </TableCell>
                              {/* Receiver */}
                              <TableCell className="hidden sm:table-cell">
                                <div className="flex items-center gap-2">
                                  <div className="size-8 shrink-0 rounded-full bg-emerald-500/15 flex items-center justify-center text-xs font-bold text-emerald-500">
                                    {(gift.receiver.fullName || gift.receiver.phone).charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{gift.receiver.fullName || 'بدون نام'}</p>
                                  </div>
                                </div>
                              </TableCell>
                              {/* Gold Amount */}
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Gift className="size-3.5 text-gold" />
                                  <span className="text-sm font-bold gold-gradient-text" dir="ltr">
                                    {toPersianDigits(String(gift.goldAmount))} mg
                                  </span>
                                </div>
                              </TableCell>
                              {/* Occasion */}
                              <TableCell className="hidden md:table-cell">
                                <Badge className={cn('text-[10px]', occCfg.bg, occCfg.color)}>
                                  <OccIcon className="size-3 ml-1" />
                                  {occCfg.label}
                                </Badge>
                              </TableCell>
                              {/* Message */}
                              <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[150px] truncate">
                                {gift.message || '—'}
                              </TableCell>
                              {/* Status */}
                              <TableCell>
                                <Badge className={cn(
                                  'text-[10px]',
                                  gift.status === 'completed' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'
                                )}>
                                  {gift.status === 'completed' ? 'تکمیل شده' : 'در انتظار'}
                                </Badge>
                              </TableCell>
                              {/* Date */}
                              <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                                {getTimeAgo(gift.createdAt)}
                              </TableCell>
                            </TableRow>
                          );
                        })}

                    {!giftsLoading && filteredGifts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <Gift className="size-10 mx-auto mb-2 opacity-20" />
                          <p className="text-sm text-muted-foreground">هدیه‌ای یافت نشد</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ Extend Subscription Dialog ═══ */}
      <Dialog open={extendOpen} onOpenChange={(open) => { if (!open) setExtendSub(null); setExtendOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="size-5 text-gold" />
              تمدید اشتراک VIP
            </DialogTitle>
            <DialogDescription>
              {extendSub
                ? `تمدید اشتراک ${PLAN_CONFIG[extendSub.plan]?.label} برای ${extendSub.user.fullName || 'کاربر'}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {extendSub && (
            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">طرح</span>
                  <Badge className={cn('text-[10px]', PLAN_CONFIG[extendSub.plan]?.bg, PLAN_CONFIG[extendSub.plan]?.color, PLAN_CONFIG[extendSub.plan]?.border, 'border')}>
                    {PLAN_CONFIG[extendSub.plan]?.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">تاریخ انقضای فعلی</span>
                  <span>{new Date(extendSub.expiryDate).toLocaleDateString('fa-IR')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">تعداد روز تمدید</Label>
                <Select value={extendDays} onValueChange={setExtendDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">{toPersianDigits('7')} روز (۱ هفته)</SelectItem>
                    <SelectItem value="14">{toPersianDigits('14')} روز (۲ هفته)</SelectItem>
                    <SelectItem value="30">{toPersianDigits('30')} روز (۱ ماه)</SelectItem>
                    <SelectItem value="90">{toPersianDigits('90')} روز (۳ ماه)</SelectItem>
                    <SelectItem value="180">{toPersianDigits('180')} روز (۶ ماه)</SelectItem>
                    <SelectItem value="365">{toPersianDigits('365')} روز (۱ سال)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setExtendOpen(false)} className="border-gold/20 text-gold hover:bg-gold/10">
              انصراف
            </Button>
            <Button
              onClick={handleExtendSubscription}
              disabled={extendSubmitting}
              className="bg-gradient-to-l from-gold to-yellow-500 text-black font-bold hover:from-gold/90 hover:to-yellow-500/90"
            >
              {extendSubmitting && <Loader2 className="size-4 ml-1.5 animate-spin" />}
              تمدید اشتراک
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Create Reward Dialog ═══ */}
      <Dialog open={createRewardOpen} onOpenChange={setCreateRewardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5 text-gold" />
              ایجاد جایزه جدید
            </DialogTitle>
            <DialogDescription>
              یک جایزه کش‌بک جدید برای کاربر ایجاد کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* User */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">شناسه کاربر (اختیاری)</Label>
              <Input
                dir="ltr"
                placeholder="ID کاربر..."
                value={newReward.userId}
                onChange={(e) => setNewReward((p) => ({ ...p, userId: e.target.value }))}
              />
              <p className="text-[11px] text-muted-foreground">در صورت خالی بودن، جایزه عمومی ایجاد می‌شود</p>
            </div>
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">عنوان جایزه</Label>
              <Input
                placeholder="مثال: کش‌بک خرید هفتگی"
                value={newReward.title}
                onChange={(e) => setNewReward((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            {/* Type & Value */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">نوع</Label>
                <Select value={newReward.type} onValueChange={(v) => setNewReward((p) => ({ ...p, type: v as 'toman' | 'gold' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="toman">واحد طلایی</SelectItem>
                    <SelectItem value="gold">طلای خرد (mg)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">مقدار</Label>
                <Input
                  type="number"
                  dir="ltr"
                  placeholder="مقدار..."
                  value={newReward.value}
                  onChange={(e) => setNewReward((p) => ({ ...p, value: e.target.value }))}
                />
              </div>
            </div>
            {/* Days */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">مهارت استفاده (روز)</Label>
              <Select value={newReward.days} onValueChange={(v) => setNewReward((p) => ({ ...p, days: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">۷ روز</SelectItem>
                  <SelectItem value="14">۱۴ روز</SelectItem>
                  <SelectItem value="30">۳۰ روز</SelectItem>
                  <SelectItem value="60">۶۰ روز</SelectItem>
                  <SelectItem value="90">۹۰ روز</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateRewardOpen(false)} className="border-gold/20 text-gold hover:bg-gold/10">
              انصراف
            </Button>
            <Button
              onClick={handleCreateReward}
              disabled={createSubmitting}
              className="bg-gradient-to-l from-gold to-yellow-500 text-black font-bold hover:from-gold/90 hover:to-yellow-500/90"
            >
              {createSubmitting && <Loader2 className="size-4 ml-1.5 animate-spin" />}
              ایجاد جایزه
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

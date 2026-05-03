
import React, { useState, useEffect, useCallback } from 'react';
import {useAppStore} from '@/lib/store';
import {toPersianDigits, formatToman, getTimeAgo} from '@/lib/helpers';
import {cn} from '@/lib/utils';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Label} from '@/components/ui/label';
import {Switch} from '@/components/ui/switch';
import {Separator} from '@/components/ui/separator';
import {Skeleton} from '@/components/ui/skeleton';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Textarea} from '@/components/ui/textarea';
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Trophy, Target, Flame, Star, Search, Plus, Pencil, Trash2, Loader2, Crown, TrendingUp, Users, Zap, Eye, EyeOff, ChevronLeft, ChevronRight, Medal, Swords, RotateCcw, Ban, Clock, CheckCircle, XCircle, ArrowUpCircle, ArrowDownCircle, Award, Sparkles} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GamificationStats {
  totalActiveUsers: number;
  totalXPDistributed: number;
  totalAchievementsEarned: number;
  averageStreak: number;
}

interface LeaderboardEntry {
  userId: string;
  fullName?: string | null;
  phone?: string;
  level: number;
  xp: number;
  streak: number;
  totalBadges: number;
}

interface PredictionStats {
  totalPredictions: number;
  averageAccuracy: number;
  topPredictor?: { fullName?: string; score: number };
}

interface CheckInEntry {
  userId: string;
  fullName?: string | null;
  phone?: string;
  checkedInAt: string;
  streak: number;
}

interface AchievementItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  goldRewardMg: number;
  sortOrder: number;
  isHidden: boolean;
  createdAt: string;
}

interface AchievementForm {
  slug: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  xpReward: string;
  goldRewardMg: string;
  sortOrder: string;
  isHidden: boolean;
}

interface QuestMission {
  id: string;
  title: string;
  titleFa: string;
  type: string;
  category: string;
  rewardXp: number;
  rewardGoldMg: number;
  isActive: boolean;
  isPremium: boolean;
  maxCompletionsPerUser: number;
  sortOrder: number;
}

interface AutoTradeItem {
  id: string;
  userId: string;
  user?: { fullName?: string | null; phone?: string };
  orderType: string;
  targetPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  amountGrams: number;
  amountFiat: number;
  status: string;
  executedPrice: number | null;
  triggeredAt: string | null;
  createdAt: string;
}

const EMPTY_ACHIEVEMENT: AchievementForm = {
  slug: '',
  title: '',
  description: '',
  icon: 'trophy',
  category: 'general',
  xpReward: '0',
  goldRewardMg: '0',
  sortOrder: '0',
  isHidden: false,
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ACHIEVEMENT_CATEGORY_LABELS: Record<string, string> = {
  general: 'عمومی',
  trading: 'معاملاتی',
  social: 'اجتماعی',
  saving: 'پس‌انداز',
  learning: 'یادگیری',
};

const ACHIEVEMENT_CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-blue-500/15 text-blue-600',
  trading: 'bg-emerald-500/15 text-emerald-600',
  social: 'bg-purple-500/15 text-purple-600',
  saving: 'bg-gold/15 text-gold',
  learning: 'bg-amber-500/15 text-amber-600',
};

const QUEST_TYPE_LABELS: Record<string, string> = {
  content: 'محتوا',
  explore: 'اکتشاف',
  search: 'جستجو',
  tool: 'ابزار',
  daily_return: 'بازگشت روزانه',
  social_share: 'اشتراک اجتماعی',
  profile: 'پروفایل',
  learning: 'مسیر یادگیری',
};

const QUEST_CATEGORY_LABELS: Record<string, string> = {
  daily: 'روزانه',
  weekly: 'هفتگی',
  special: 'ویژه',
  learning_path: 'مسیر یادگیری',
};

const QUEST_CATEGORY_COLORS: Record<string, string> = {
  daily: 'bg-blue-500/15 text-blue-600',
  weekly: 'bg-purple-500/15 text-purple-600',
  special: 'bg-gold/15 text-gold',
  learning_path: 'bg-emerald-500/15 text-emerald-600',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_confirmation: 'در انتظار تأیید',
  active: 'فعال',
  executed: 'اجرا شده',
  cancelled: 'لغو شده',
  expired: 'منقضی',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending_confirmation: 'bg-amber-500/15 text-amber-600',
  active: 'bg-blue-500/15 text-blue-600',
  executed: 'bg-emerald-500/15 text-emerald-600',
  cancelled: 'bg-gray-500/15 text-gray-500',
  expired: 'bg-red-500/15 text-red-600',
};

/* ------------------------------------------------------------------ */
/*  Icon helper                                                        */
/* ------------------------------------------------------------------ */

function getAchievementIcon(iconStr: string): React.ReactNode {
  const map: Record<string, React.ReactNode> = {
    trophy: <Trophy className="size-5" />,
    star: <Star className="size-5" />,
    medal: <Medal className="size-5" />,
    target: <Target className="size-5" />,
    flame: <Flame className="size-5" />,
    crown: <Crown className="size-5" />,
    zap: <Zap className="size-5" />,
    award: <Award className="size-5" />,
    sparkles: <Sparkles className="size-5" />,
  };
  return map[iconStr] || <Trophy className="size-5" />;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminGamification() {
  const addToast = useAppStore((s) => s.addToast);

  /* ── Data ── */
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [predictionStats, setPredictionStats] = useState<PredictionStats | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckInEntry[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [missions, setMissions] = useState<QuestMission[]>([]);
  const [autoTrades, setAutoTrades] = useState<AutoTradeItem[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── Achievement Filters ── */
  const [achSearch, setAchSearch] = useState('');

  /* ── Quest Filters ── */
  const [questTypeFilter, setQuestTypeFilter] = useState('all');
  const [questCatFilter, setQuestCatFilter] = useState('all');

  /* ── Auto Trade Filters ── */
  const [tradeStatusFilter, setTradeStatusFilter] = useState('all');
  const [tradeTypeFilter, setTradeTypeFilter] = useState('all');

  /* ── Dialogs ── */
  const [achDialogOpen, setAchDialogOpen] = useState(false);
  const [editingAch, setEditingAch] = useState<AchievementItem | null>(null);
  const [achForm, setAchForm] = useState<AchievementForm>(EMPTY_ACHIEVEMENT);
  const [achSubmitting, setAchSubmitting] = useState(false);

  const [deleteAch, setDeleteAch] = useState<AchievementItem | null>(null);
  const [deleteAchSubmitting, setDeleteAchSubmitting] = useState(false);

  const [deleteTrade, setDeleteTrade] = useState<AutoTradeItem | null>(null);
  const [deleteTradeSubmitting, setDeleteTradeSubmitting] = useState(false);

  /* ── Fetch Overview ── */
  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/gamification');
      if (res.ok) {
        const d = await res.json();
        const data = d.data || d;
        const lb = Array.isArray(data?.leaderboards?.xp) ? data.leaderboards.xp : [];
        setLeaderboard(lb.slice(0, 10));
        if (data?.predictionGame) {
          setPredictionStats({
            totalPredictions: data.predictionGame.totalPredictions || 0,
            averageAccuracy: data.predictionGame.accuracy || 0,
            topPredictor: lb[0]?.user?.fullName || lb[0]?.user?.phone || '',
          });
        }
        if (data?.overview) {
          setStats({
            totalActiveUsers: data.overview.totalUsersWithGamification || 0,
            totalXPDistributed: data.overview.totalXPDistributed || 0,
            totalAchievementsEarned: data.achievements?.totalEarned || 0,
            averageStreak: data.overview.averageLevel || 0,
          });
        }
      }
    } catch { /* ignore */ }
  }, []);

  const fetchStats = useCallback(async () => {
    // Stats are fetched in fetchOverview from /api/admin/gamification
  }, [leaderboard]);

  const fetchCheckIns = useCallback(async () => {
    try {
      const res = await fetch('/api/gamification/checkin/status');
      if (res.ok) {
        const d = await res.json();
        setRecentCheckIns(Array.isArray(d) ? d.slice(0, 10) : []);
      }
    } catch { /* ignore */ }
  }, []);

  /* ── Fetch Achievements ── */
  const fetchAchievements = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/achievements');
      if (res.ok) {
        const d = await res.json();
        const achList = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : d.achievements || [];
        setAchievements(achList);
      }
    } catch { /* ignore */ }
  }, []);

  /* ── Fetch Quest Missions ── */
  const fetchMissions = useCallback(async () => {
    try {
      const res = await fetch('/api/quest/missions');
      if (res.ok) {
        const d = await res.json();
        const mList = Array.isArray(d) ? d : d.missions || [];
        setMissions(mList);
      }
    } catch { /* ignore */ }
  }, []);

  /* ── Fetch Auto Trades ── */
  const fetchAutoTrades = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auto-trade');
      if (res.ok) {
        const d = await res.json();
        const tList = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : d.orders || [];
        setAutoTrades(tList);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([
        fetchOverview(),
        fetchCheckIns(),
        fetchAchievements(),
        fetchMissions(),
        fetchAutoTrades(),
      ]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fetchOverview, fetchCheckIns, fetchAchievements, fetchMissions, fetchAutoTrades]);

  useEffect(() => {
    if (leaderboard.length > 0) fetchStats();
  }, [leaderboard, fetchStats]);

  /* ── Achievement Filters ── */
  const filteredAchievements = achievements.filter((a) => {
    const q = achSearch.toLowerCase();
    return !q || a.title.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q);
  });

  /* ── Quest Filters ── */
  const filteredMissions = missions.filter((m) => {
    const matchType = questTypeFilter === 'all' || m.type === questTypeFilter;
    const matchCat = questCatFilter === 'all' || m.category === questCatFilter;
    return matchType && matchCat;
  });

  /* ── Auto Trade Filters ── */
  const filteredTrades = autoTrades.filter((t) => {
    const matchStatus = tradeStatusFilter === 'all' || t.status === tradeStatusFilter;
    const matchType = tradeTypeFilter === 'all' || t.orderType === tradeTypeFilter;
    return matchStatus && matchType;
  });

  /* ── Achievement Handlers ── */

  const openCreateAchievement = () => {
    setEditingAch(null);
    setAchForm(EMPTY_ACHIEVEMENT);
    setAchDialogOpen(true);
  };

  const openEditAchievement = (ach: AchievementItem) => {
    setEditingAch(ach);
    setAchForm({
      slug: ach.slug,
      title: ach.title,
      description: ach.description,
      icon: ach.icon,
      category: ach.category,
      xpReward: String(ach.xpReward),
      goldRewardMg: String(ach.goldRewardMg),
      sortOrder: String(ach.sortOrder),
      isHidden: ach.isHidden,
    });
    setAchDialogOpen(true);
  };

  const handleSaveAchievement = async () => {
    if (!achForm.slug.trim() || !achForm.title.trim()) {
      addToast('اسلاگ و عنوان الزامی هستند', 'error');
      return;
    }
    setAchSubmitting(true);
    try {
      const body = {
        slug: achForm.slug.trim(),
        title: achForm.title,
        description: achForm.description,
        icon: achForm.icon,
        category: achForm.category,
        xpReward: parseInt(achForm.xpReward) || 0,
        goldRewardMg: parseFloat(achForm.goldRewardMg) || 0,
        sortOrder: parseInt(achForm.sortOrder) || 0,
        isHidden: achForm.isHidden,
      };

      // We use the achievements endpoint
      const res = await fetch('/api/admin/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        addToast(editingAch ? 'دستاورد بروزرسانی شد' : 'دستاورد جدید ایجاد شد', 'success');
        setAchDialogOpen(false);
        setEditingAch(null);
        await fetchAchievements();
      } else {
        const d = await res.json().catch(() => ({}));
        addToast(d.message || 'خطا در ذخیره دستاورد', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setAchSubmitting(false);
    }
  };

  const handleDeleteAchievement = async () => {
    if (!deleteAch) return;
    setDeleteAchSubmitting(true);
    try {
      const res = await fetch(`/api/admin/achievements/${deleteAch.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        addToast('دستاورد حذف شد', 'success');
        setDeleteAch(null);
        await fetchAchievements();
      } else {
        addToast('خطا در حذف دستاورد', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setDeleteAchSubmitting(false);
    }
  };

  /* ── Quest Mission Handlers ── */
  const handleToggleMission = async (mission: QuestMission) => {
    try {
      const res = await fetch(`/api/admin/quest-missions/${mission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !mission.isActive }),
      });
      if (res.ok) {
        addToast(mission.isActive ? 'مأموریت غیرفعال شد' : 'مأموریت فعال شد', 'success');
        await fetchMissions();
      } else {
        addToast('خطا در تغییر وضعیت', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
  };

  /* ── Auto Trade Handlers ── */
  const handleCancelTrade = async () => {
    if (!deleteTrade) return;
    setDeleteTradeSubmitting(true);
    try {
      const res = await fetch(`/api/admin/auto-trade/${deleteTrade.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (res.ok) {
        addToast('سفارش لغو شد', 'success');
        setDeleteTrade(null);
        await fetchAutoTrades();
      } else {
        addToast('خطا در لغو سفارش', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setDeleteTradeSubmitting(false);
    }
  };

  /* ================================================================== */
  /*  Render                                                             */
  /* ================================================================== */
  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" dir="rtl" className="space-y-4">
        <TabsList className="bg-muted/50 w-full sm:w-auto grid grid-cols-4 overflow-x-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm gap-1">
            <TrendingUp className="size-3.5" />
            نمای کلی
          </TabsTrigger>
          <TabsTrigger value="achievements" className="text-xs sm:text-sm gap-1">
            <Trophy className="size-3.5" />
            دستاوردها
          </TabsTrigger>
          <TabsTrigger value="quests" className="text-xs sm:text-sm gap-1">
            <Target className="size-3.5" />
            مأموریت‌ها
          </TabsTrigger>
          <TabsTrigger value="autotrades" className="text-xs sm:text-sm gap-1">
            <RotateCcw className="size-3.5" />
            معاملات خودکار
          </TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/*  TAB 1: Gamification Overview                                */}
        {/* ============================================================ */}
        <TabsContent value="overview" className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <TrendingUp className="size-5 text-gold" />
            <h2 className="text-lg font-bold">نمای کلی گیمیفیکیشن</h2>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))
              : (
                <>
                  <Card className="glass-gold card-spotlight">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Users className="size-4 text-gold" />
                        <Badge className="bg-gold/15 text-gold text-[10px]">کاربران</Badge>
                      </div>
                      <p className="text-2xl font-bold gold-gradient-text">
                        {toPersianDigits(String(stats?.totalActiveUsers || 0))}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">کل کاربران فعال</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-gold card-spotlight">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Zap className="size-4 text-amber-500" />
                        <Badge className="bg-amber-500/15 text-amber-500 text-[10px]">XP</Badge>
                      </div>
                      <p className="text-2xl font-bold text-amber-500">
                        {toPersianDigits(String(stats?.totalXPDistributed || 0))}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">مجموع XP توزیع شده</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-gold card-spotlight">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Trophy className="size-4 text-purple-500" />
                        <Badge className="bg-purple-500/15 text-purple-500 text-[10px]">دستاورد</Badge>
                      </div>
                      <p className="text-2xl font-bold text-purple-500">
                        {toPersianDigits(String(stats?.totalAchievementsEarned || 0))}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">کل دستاوردها</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-gold card-spotlight">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Flame className="size-4 text-orange-500" />
                        <Badge className="bg-orange-500/15 text-orange-500 text-[10px]">استریک</Badge>
                      </div>
                      <p className="text-2xl font-bold text-orange-500">
                        {toPersianDigits(String(stats?.averageStreak || 0))}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">میانگین استریک</p>
                    </CardContent>
                  </Card>
                </>
              )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Leaderboard */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                  <Crown className="size-4 text-gold" />
                  جدول برترین‌ها (تاپ ۱۰)
                </h3>
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-9 w-full" />
                    ))}
                  </div>
                ) : leaderboard.length > 0 ? (
                  <ScrollArea className="max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs w-12">#</TableHead>
                          <TableHead className="text-xs">کاربر</TableHead>
                          <TableHead className="text-xs text-center">سطح</TableHead>
                          <TableHead className="text-xs text-center">XP</TableHead>
                          <TableHead className="text-xs text-center hidden sm:table-cell">استریک</TableHead>
                          <TableHead className="text-xs text-center hidden md:table-cell">نشان</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaderboard.map((entry, idx) => (
                          <TableRow key={entry.userId} className="hover:bg-gold/5 transition-colors">
                            <TableCell>
                              <span className={cn(
                                'text-sm font-bold',
                                idx === 0 && 'text-gold',
                                idx === 1 && 'text-gray-400',
                                idx === 2 && 'text-amber-700',
                              )}>
                                {toPersianDigits(String(idx + 1))}
                              </span>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm font-medium truncate">
                                {entry.fullName || entry.phone || 'کاربر'}
                              </p>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-[10px] border-gold/30 text-gold">
                                {toPersianDigits(String(entry.level))}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-xs font-medium tabular-nums">
                              {toPersianDigits(String(entry.xp))}
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground hidden sm:table-cell">
                              {toPersianDigits(String(entry.streak))}
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground hidden md:table-cell">
                              {toPersianDigits(String(entry.totalBadges))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Trophy className="size-8 mx-auto mb-2 opacity-20" />
                    داده‌ای موجود نیست
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prediction Stats + Check-ins */}
            <div className="space-y-4">
              {/* Prediction Game Stats */}
              <Card className="glass-gold">
                <CardContent className="p-4">
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                    <Target className="size-4 text-gold" />
                    آمار بازی پیش‌بینی
                  </h3>
                  {loading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground mb-1">کل پیش‌بینی‌ها</p>
                        <p className="text-lg font-bold text-gold">
                          {toPersianDigits(String(predictionStats?.totalPredictions || 0))}
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground mb-1">دقت میانگین</p>
                        <p className="text-lg font-bold text-emerald-500">
                          {toPersianDigits(`${predictionStats?.averageAccuracy || 0}`)}٪
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground mb-1">بهترین پیش‌بینی‌کننده</p>
                        <p className="text-sm font-bold truncate">
                          {predictionStats?.topPredictor?.fullName || '-'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {predictionStats?.topPredictor
                            ? `امتیاز: ${toPersianDigits(String(predictionStats.topPredictor.score))}`
                            : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Check-ins */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                    <Flame className="size-4 text-orange-500" />
                    آخرین چک‌این‌ها
                  </h3>
                  {loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-full" />
                      ))}
                    </div>
                  ) : recentCheckIns.length > 0 ? (
                    <ScrollArea className="max-h-64">
                      <div className="space-y-2">
                        {recentCheckIns.map((ci, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                              <div className="size-7 rounded-full bg-orange-500/15 flex items-center justify-center text-xs">
                                <Flame className="size-3.5 text-orange-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {ci.fullName || ci.phone || 'کاربر'}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {ci.checkedInAt ? getTimeAgo(ci.checkedInAt) : '-'}
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-orange-500/15 text-orange-500 text-[10px]">
                              {toPersianDigits(String(ci.streak))} روز
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      <Flame className="size-8 mx-auto mb-2 opacity-20" />
                      چک‌اینی ثبت نشده
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/*  TAB 2: Achievements Management                              */}
        {/* ============================================================ */}
        <TabsContent value="achievements" className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Trophy className="size-5 text-gold" />
              <h2 className="text-lg font-bold">مدیریت دستاوردها</h2>
              <Badge className="bg-gold/15 text-gold text-xs">
                {toPersianDigits(String(filteredAchievements.length))} دستاورد
              </Badge>
            </div>
            <Button
              size="sm"
              onClick={openCreateAchievement}
              className="bg-gradient-to-l from-gold to-yellow-500 text-black font-bold hover:from-gold/90 hover:to-yellow-500/90 shadow-md"
            >
              <Plus className="size-4 ml-1.5" />
              ایجاد دستاورد
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={achSearch}
              onChange={(e) => setAchSearch(e.target.value)}
              placeholder="جستجوی دستاورد..."
              className="pr-9"
            />
          </div>

          {/* Achievements Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : filteredAchievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAchievements.map((ach) => (
                <Card
                  key={ach.id}
                  className={cn(
                    'glass-gold card-spotlight transition-all hover:shadow-md',
                    ach.isHidden && 'opacity-60',
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-gold/15 flex items-center justify-center text-gold">
                          {getAchievementIcon(ach.icon)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold truncate">{ach.title}</h4>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">
                            {ach.description}
                          </p>
                        </div>
                      </div>
                      {ach.isHidden && (
                        <EyeOff className="size-4 text-muted-foreground shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={cn('text-[10px]', ACHIEVEMENT_CATEGORY_COLORS[ach.category] || 'bg-gray-500/15 text-gray-500')}>
                        {ACHIEVEMENT_CATEGORY_LABELS[ach.category] || ach.category}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs mb-3">
                      <span className="flex items-center gap-1 text-amber-500">
                        <Zap className="size-3" />
                        {toPersianDigits(String(ach.xpReward))} XP
                      </span>
                      <span className="flex items-center gap-1 text-gold">
                        <Crown className="size-3" />
                        {toPersianDigits(String(ach.goldRewardMg))} mg
                      </span>
                    </div>

                    <Separator className="mb-3" />

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        ترتیب: {toPersianDigits(String(ach.sortOrder))}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-muted-foreground hover:text-blue-500"
                          onClick={() => openEditAchievement(ach)}
                          title="ویرایش"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          onClick={() => setDeleteAch(ach)}
                          title="حذف"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-10">
                <Trophy className="size-10 mx-auto mb-2 opacity-20" />
                <p className="text-muted-foreground text-sm">دستاوردی یافت نشد</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/*  TAB 3: Quest Missions                                       */}
        {/* ============================================================ */}
        <TabsContent value="quests" className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Target className="size-5 text-gold" />
            <h2 className="text-lg font-bold">مأموریت‌های کوئست</h2>
            <Badge className="bg-gold/15 text-gold text-xs">
              {toPersianDigits(String(filteredMissions.length))} مأموریت
            </Badge>
          </div>

          {/* Filters */}
          <Card className="glass-gold">
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  value={questTypeFilter}
                  onValueChange={setQuestTypeFilter}
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="نوع مأموریت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="content">محتوا</SelectItem>
                    <SelectItem value="explore">اکتشاف</SelectItem>
                    <SelectItem value="search">جستجو</SelectItem>
                    <SelectItem value="tool">ابزار</SelectItem>
                    <SelectItem value="daily_return">بازگشت روزانه</SelectItem>
                    <SelectItem value="social_share">اشتراک اجتماعی</SelectItem>
                    <SelectItem value="profile">پروفایل</SelectItem>
                    <SelectItem value="learning">مسیر یادگیری</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={questCatFilter}
                  onValueChange={setQuestCatFilter}
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="دسته‌بندی" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="daily">روزانه</SelectItem>
                    <SelectItem value="weekly">هفتگی</SelectItem>
                    <SelectItem value="special">ویژه</SelectItem>
                    <SelectItem value="learning_path">مسیر یادگیری</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Missions Table */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[520px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">عنوان</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">نوع</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">دسته‌بندی</TableHead>
                      <TableHead className="text-xs text-center">پاداش</TableHead>
                      <TableHead className="text-xs text-center">وضعیت</TableHead>
                      <TableHead className="text-xs text-center hidden lg:table-cell">بیشینه</TableHead>
                      <TableHead className="text-xs text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading
                      ? Array.from({ length: 6 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={7}>
                              <Skeleton className="h-10 w-full" />
                            </TableCell>
                          </TableRow>
                        ))
                      : filteredMissions.map((mission) => (
                          <TableRow
                            key={mission.id}
                            className={cn(
                              'hover:bg-gold/5 transition-colors',
                              !mission.isActive && 'opacity-50',
                            )}
                          >
                            {/* Title */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate max-w-[180px]">
                                  {mission.titleFa || mission.title}
                                </p>
                                {mission.isPremium && (
                                  <Badge className="bg-gold/20 text-gold text-[10px] shrink-0">
                                    <Crown className="size-3 ml-0.5" />
                                  </Badge>
                                )}
                              </div>
                            </TableCell>

                            {/* Type */}
                            <TableCell className="hidden md:table-cell">
                              <Badge className="text-[10px] bg-muted/50">
                                {QUEST_TYPE_LABELS[mission.type] || mission.type}
                              </Badge>
                            </TableCell>

                            {/* Category */}
                            <TableCell className="hidden sm:table-cell">
                              <Badge className={cn('text-[10px]', QUEST_CATEGORY_COLORS[mission.category] || 'bg-gray-500/15 text-gray-500')}>
                                {QUEST_CATEGORY_LABELS[mission.category] || mission.category}
                              </Badge>
                            </TableCell>

                            {/* Rewards */}
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1 text-xs">
                                <span className="text-amber-500">
                                  {toPersianDigits(String(mission.rewardXp))} XP
                                </span>
                                {mission.rewardGoldMg > 0 && (
                                  <span className="text-gold">
                                    + {toPersianDigits(String(mission.rewardGoldMg))} mg
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Status */}
                            <TableCell className="text-center">
                              <Switch
                                checked={mission.isActive}
                                onCheckedChange={() => handleToggleMission(mission)}
                                className="data-[state=checked]:bg-emerald-500"
                              />
                            </TableCell>

                            {/* Max Completions */}
                            <TableCell className="text-center text-xs text-muted-foreground hidden lg:table-cell">
                              {mission.maxCompletionsPerUser > 0
                                ? toPersianDigits(String(mission.maxCompletionsPerUser))
                                : 'نامحدود'}
                            </TableCell>

                            {/* Actions */}
                            <TableCell>
                              <div className="flex items-center justify-center">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className={cn(
                                    'size-7',
                                    mission.isActive
                                      ? 'text-amber-500 hover:bg-amber-500/10'
                                      : 'text-emerald-500 hover:bg-emerald-500/10',
                                  )}
                                  onClick={() => handleToggleMission(mission)}
                                  title={mission.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                                >
                                  {mission.isActive ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}

                    {!loading && filteredMissions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10">
                          <Target className="size-10 mx-auto mb-2 opacity-20" />
                          <p className="text-muted-foreground text-sm">مأموریتی یافت نشد</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/*  TAB 4: Auto Trading Orders                                  */}
        {/* ============================================================ */}
        <TabsContent value="autotrades" className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <RotateCcw className="size-5 text-gold" />
            <h2 className="text-lg font-bold">معاملات خودکار</h2>
            <Badge className="bg-gold/15 text-gold text-xs">
              {toPersianDigits(String(filteredTrades.length))} سفارش
            </Badge>
          </div>

          {/* Filters */}
          <Card className="glass-gold">
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  value={tradeStatusFilter}
                  onValueChange={setTradeStatusFilter}
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                    <SelectItem value="pending_confirmation">در انتظار تأیید</SelectItem>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="executed">اجرا شده</SelectItem>
                    <SelectItem value="cancelled">لغو شده</SelectItem>
                    <SelectItem value="expired">منقضی</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={tradeTypeFilter}
                  onValueChange={setTradeTypeFilter}
                >
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="نوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="buy">خرید</SelectItem>
                    <SelectItem value="sell">فروش</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[520px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">کاربر</TableHead>
                      <TableHead className="text-xs">نوع</TableHead>
                      <TableHead className="text-xs text-center">مقدار (گرم)</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">قیمت هدف</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">حد ضرر</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">حد سود</TableHead>
                      <TableHead className="text-xs">وضعیت</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">تاریخ</TableHead>
                      <TableHead className="text-xs text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading
                      ? Array.from({ length: 6 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={9}>
                              <Skeleton className="h-10 w-full" />
                            </TableCell>
                          </TableRow>
                        ))
                      : filteredTrades.map((trade) => (
                          <TableRow
                            key={trade.id}
                            className="hover:bg-gold/5 transition-colors"
                          >
                            {/* User */}
                            <TableCell>
                              <p className="text-sm font-medium truncate max-w-[120px]">
                                {trade.user?.fullName || trade.user?.phone || 'کاربر'}
                              </p>
                            </TableCell>

                            {/* Type */}
                            <TableCell>
                              <Badge className={cn(
                                'text-[10px]',
                                trade.orderType === 'buy'
                                  ? 'bg-emerald-500/15 text-emerald-600'
                                  : 'bg-red-500/15 text-red-600',
                              )}>
                                {trade.orderType === 'buy' ? (
                                  <span className="flex items-center gap-1">
                                    <ArrowUpCircle className="size-3" />
                                    خرید
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <ArrowDownCircle className="size-3" />
                                    فروش
                                  </span>
                                )}
                              </Badge>
                            </TableCell>

                            {/* Amount */}
                            <TableCell className="text-center text-xs tabular-nums">
                              {toPersianDigits(trade.amountGrams.toFixed(3))}
                            </TableCell>

                            {/* Target Price */}
                            <TableCell className="text-xs text-muted-foreground hidden md:table-cell tabular-nums" dir="ltr">
                              {formatToman(trade.targetPrice)}
                            </TableCell>

                            {/* Stop Loss */}
                            <TableCell className="text-xs text-red-400 hidden lg:table-cell tabular-nums" dir="ltr">
                              {trade.stopLoss ? formatToman(trade.stopLoss) : '-'}
                            </TableCell>

                            {/* Take Profit */}
                            <TableCell className="text-xs text-emerald-400 hidden lg:table-cell tabular-nums" dir="ltr">
                              {trade.takeProfit ? formatToman(trade.takeProfit) : '-'}
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              <Badge className={cn('text-[10px]', ORDER_STATUS_COLORS[trade.status] || 'bg-gray-500/15 text-gray-500')}>
                                {ORDER_STATUS_LABELS[trade.status] || trade.status}
                              </Badge>
                            </TableCell>

                            {/* Date */}
                            <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                              {trade.createdAt ? getTimeAgo(trade.createdAt) : '-'}
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="text-center">
                              {(trade.status === 'pending_confirmation' || trade.status === 'active') && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-7 text-red-500 hover:bg-red-500/10"
                                  onClick={() => setDeleteTrade(trade)}
                                  title="لغو سفارش"
                                >
                                  <Ban className="size-3.5" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}

                    {!loading && filteredTrades.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10">
                          <RotateCcw className="size-10 mx-auto mb-2 opacity-20" />
                          <p className="text-muted-foreground text-sm">سفارشی یافت نشد</p>
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

      {/* ============================================================== */}
      {/*  CREATE / EDIT ACHIEVEMENT DIALOG                               */}
      {/* ============================================================== */}
      <Dialog open={achDialogOpen} onOpenChange={(open) => {
        if (!open) { setEditingAch(null); setAchForm(EMPTY_ACHIEVEMENT); }
        setAchDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-gold" />
              {editingAch ? 'ویرایش دستاورد' : 'ایجاد دستاورد جدید'}
            </DialogTitle>
            <DialogDescription>
              {editingAch ? `ویرایش ${editingAch.title}` : 'اطلاعات دستاورد جدید را وارد کنید'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="ach-slug" className="text-sm font-medium">
                اسلاگ (شناسه یکتا) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ach-slug"
                dir="ltr"
                value={achForm.slug}
                onChange={(e) => setAchForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="e.g., first_trade"
                disabled={!!editingAch}
              />
              {editingAch && (
                <p className="text-[10px] text-muted-foreground">اسلاگ قابل تغییر نیست</p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="ach-title" className="text-sm font-medium">
                عنوان <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ach-title"
                value={achForm.title}
                onChange={(e) => setAchForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="عنوان دستاورد"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="ach-desc" className="text-sm font-medium">توضیحات</Label>
              <Textarea
                id="ach-desc"
                value={achForm.description}
                onChange={(e) => setAchForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="توضیحات دستاورد"
                rows={3}
              />
            </div>

            {/* Icon + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ach-icon" className="text-sm font-medium">آیکون</Label>
                <Input
                  id="ach-icon"
                  dir="ltr"
                  value={achForm.icon}
                  onChange={(e) => setAchForm((f) => ({ ...f, icon: e.target.value }))}
                  placeholder="trophy, star, medal..."
                />
                <p className="text-[10px] text-muted-foreground">
                  مقادیر: trophy, star, medal, target, flame, crown, zap, award, sparkles
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">دسته‌بندی</Label>
                <Select
                  value={achForm.category}
                  onValueChange={(v) => setAchForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">عمومی</SelectItem>
                    <SelectItem value="trading">معاملاتی</SelectItem>
                    <SelectItem value="social">اجتماعی</SelectItem>
                    <SelectItem value="saving">پس‌انداز</SelectItem>
                    <SelectItem value="learning">یادگیری</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rewards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ach-xp" className="text-sm font-medium">پاداش XP</Label>
                <Input
                  id="ach-xp"
                  type="number"
                  dir="ltr"
                  value={achForm.xpReward}
                  onChange={(e) => setAchForm((f) => ({ ...f, xpReward: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ach-gold" className="text-sm font-medium">پاداش طلا (mg)</Label>
                <Input
                  id="ach-gold"
                  type="number"
                  dir="ltr"
                  value={achForm.goldRewardMg}
                  onChange={(e) => setAchForm((f) => ({ ...f, goldRewardMg: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label htmlFor="ach-sort" className="text-sm font-medium">ترتیب نمایش</Label>
              <Input
                id="ach-sort"
                type="number"
                dir="ltr"
                value={achForm.sortOrder}
                onChange={(e) => setAchForm((f) => ({ ...f, sortOrder: e.target.value }))}
                placeholder="0"
              />
            </div>

            <Separator />

            {/* Hidden Toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-1.5 cursor-pointer">
                <EyeOff className="size-3.5 text-muted-foreground" />
                مخفی (تا زمان کسب)
              </Label>
              <Switch
                checked={achForm.isHidden}
                onCheckedChange={(checked) =>
                  setAchForm((f) => ({ ...f, isHidden: checked }))
                }
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setAchDialogOpen(false)}
              className="border-gold/20 text-gold hover:bg-gold/10"
            >
              انصراف
            </Button>
            <Button
              onClick={handleSaveAchievement}
              disabled={achSubmitting}
              className="bg-gradient-to-l from-gold to-yellow-500 text-black font-bold hover:from-gold/90 hover:to-yellow-500/90"
            >
              {achSubmitting && <Loader2 className="size-4 ml-1.5 animate-spin" />}
              {editingAch ? 'بروزرسانی' : 'ایجاد دستاورد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/*  DELETE ACHIEVEMENT DIALOG                                     */}
      {/* ============================================================== */}
      <AlertDialog open={!!deleteAch} onOpenChange={(open) => !open && setDeleteAch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف دستاورد</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف دستاورد &laquo;{deleteAch?.title}&raquo; مطمئن هستید؟
              این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAchSubmitting}>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAchievement}
              disabled={deleteAchSubmitting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteAchSubmitting && <Loader2 className="size-4 ml-1.5 animate-spin" />}
              حذف دستاورد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================================== */}
      {/*  CANCEL AUTO TRADE DIALOG                                      */}
      {/* ============================================================== */}
      <AlertDialog open={!!deleteTrade} onOpenChange={(open) => !open && setDeleteTrade(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>لغو سفارش معامله خودکار</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از لغو این سفارش معامله خودکار مطمئن هستید؟
              این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTrade && (
            <div className="rounded-lg bg-muted/50 p-3 my-2 space-y-1">
              <p className="text-sm">
                <span className="text-muted-foreground">نوع:</span>{' '}
                <Badge className={cn(
                  'text-[10px] mr-1',
                  deleteTrade.orderType === 'buy'
                    ? 'bg-emerald-500/15 text-emerald-600'
                    : 'bg-red-500/15 text-red-600',
                )}>
                  {deleteTrade.orderType === 'buy' ? 'خرید' : 'فروش'}
                </Badge>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">مقدار:</span>{' '}
                {toPersianDigits(deleteTrade.amountGrams.toFixed(3))} گرم
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">قیمت هدف:</span>{' '}
                <span dir="ltr">{formatToman(deleteTrade.targetPrice)}</span>
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTradeSubmitting}>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelTrade}
              disabled={deleteTradeSubmitting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteTradeSubmitting && <Loader2 className="size-4 ml-1.5 animate-spin" />}
              لغو سفارش
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

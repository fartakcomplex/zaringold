'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Trophy,
  TrendingUp,
  TrendingDown,
  UserPlus,
  UserMinus,
  Copy,
  Star,
  Crown,
  Medal,
  Loader2,
  Eye,
  Shield,
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  Percent,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/lib/store';
import { cn, formatNumber, formatToman, formatGrams, formatPrice } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Trader {
  id: string;
  name: string;
  avatar?: string;
  rank: number;
  winRate: number;
  totalTrades: number;
  profitAmount: number;
  profitPct: number;
  followers: number;
  isFollowing: boolean;
  isCopyTrading: boolean;
  streak: number;
  avgGold: number;
  level: 'diamond' | 'gold' | 'silver' | 'bronze';
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper functions                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getLevelConfig(level: string) {
  switch (level) {
    case 'diamond':
      return { icon: <Crown className="size-4 text-cyan-400" />, label: 'الماسی', bg: 'bg-cyan-500/10', color: 'text-cyan-400' };
    case 'gold':
      return { icon: <Trophy className="size-4 text-[#D4AF37]" />, label: 'طلایی', bg: 'bg-[#D4AF37]/10', color: 'text-[#D4AF37]' };
    case 'silver':
      return { icon: <Medal className="size-4 text-slate-400" />, label: 'نقره‌ای', bg: 'bg-slate-500/10', color: 'text-slate-400' };
    default:
      return { icon: <Star className="size-4 text-amber-700" />, label: 'برنزی', bg: 'bg-amber-700/10', color: 'text-amber-700' };
  }
}

function getInitials(name: string) {
  const parts = name.split(' ');
  return parts.length > 1
    ? parts[0][0] + parts[parts.length - 1][0]
    : name.slice(0, 2);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeletons                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SocialTradingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-7 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SocialTradingView() {
  const { user, addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [sortBy, setSortBy] = useState<'rank' | 'winRate' | 'profit'>('rank');
  const [expandedTrader, setExpandedTrader] = useState<string | null>(null);
  const [isGlobalCopyTrading, setIsGlobalCopyTrading] = useState(false);

  const userId = user?.id || 'dev-super-admin';

  /* ── Mock traders ── */
  const MOCK_TRADERS: Trader[] = [
    { id: 't1', name: 'علی محمدی', rank: 1, winRate: 87.3, totalTrades: 342, profitAmount: 45600000, profitPct: 32.5, followers: 1245, isFollowing: true, isCopyTrading: false, streak: 12, avgGold: 0.85, level: 'diamond' },
    { id: 't2', name: 'سارا رضایی', rank: 2, winRate: 82.1, totalTrades: 218, profitAmount: 34200000, profitPct: 28.4, followers: 890, isFollowing: false, isCopyTrading: false, streak: 8, avgGold: 0.62, level: 'diamond' },
    { id: 't3', name: 'محمد حسینی', rank: 3, winRate: 79.5, totalTrades: 456, profitAmount: 28900000, profitPct: 24.1, followers: 756, isFollowing: true, isCopyTrading: true, streak: 5, avgGold: 1.2, level: 'gold' },
    { id: 't4', name: 'مریم کریمی', rank: 4, winRate: 76.8, totalTrades: 189, profitAmount: 21500000, profitPct: 21.3, followers: 534, isFollowing: false, isCopyTrading: false, streak: 3, avgGold: 0.45, level: 'gold' },
    { id: 't5', name: 'رضا احمدی', rank: 5, winRate: 74.2, totalTrades: 567, profitAmount: 18700000, profitPct: 18.7, followers: 423, isFollowing: false, isCopyTrading: false, streak: 7, avgGold: 0.33, level: 'gold' },
    { id: 't6', name: 'فاطمه موسوی', rank: 6, winRate: 71.5, totalTrades: 324, profitAmount: 15400000, profitPct: 15.9, followers: 312, isFollowing: false, isCopyTrading: false, streak: 2, avgGold: 0.58, level: 'silver' },
    { id: 't7', name: 'حسین نوری', rank: 7, winRate: 69.8, totalTrades: 234, profitAmount: 12800000, profitPct: 14.2, followers: 267, isFollowing: false, isCopyTrading: false, streak: 4, avgGold: 0.71, level: 'silver' },
    { id: 't8', name: 'زهرا صادقی', rank: 8, winRate: 67.3, totalTrades: 178, profitAmount: 10500000, profitPct: 12.5, followers: 198, isFollowing: false, isCopyTrading: false, streak: 1, avgGold: 0.92, level: 'silver' },
  ];

  /* ── Fetch data ── */
  const fetchTraders = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      setTraders(MOCK_TRADERS);
    } catch (error) {
      console.error('Social trading fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTraders();
  }, [fetchTraders]);

  /* ── Sort traders ── */
  const sortedTraders = [...traders].sort((a, b) => {
    if (sortBy === 'winRate') return b.winRate - a.winRate;
    if (sortBy === 'profit') return b.profitPct - a.profitPct;
    return a.rank - b.rank;
  });

  /* ── Handlers ── */
  const handleToggleFollow = (traderId: string) => {
    setTraders(prev =>
      prev.map(t =>
        t.id === traderId ? { ...t, isFollowing: !t.isFollowing, followers: t.isFollowing ? t.followers - 1 : t.followers + 1 } : t,
      ),
    );
    const trader = traders.find(t => t.id === traderId);
    if (trader) {
      addToast(
        trader.isFollowing ? `دنبال‌کردن ${trader.name} لغو شد` : `${trader.name} دنبال شد ✅`,
        trader.isFollowing ? 'info' : 'success',
      );
    }
  };

  const handleToggleCopyTrading = (traderId: string) => {
    setTraders(prev =>
      prev.map(t =>
        t.id === traderId ? { ...t, isCopyTrading: !t.isCopyTrading } : t,
      ),
    );
    const trader = traders.find(t => t.id === traderId);
    if (trader) {
      addToast(
        trader.isCopyTrading
          ? `کپی‌ترید ${trader.name} متوقف شد`
          : `کپی‌ترید ${trader.name} فعال شد 🔄`,
        trader.isCopyTrading ? 'info' : 'success',
      );
    }
  };

  const topStats = {
    avgWinRate: traders.length > 0 ? traders.reduce((s, t) => s + t.winRate, 0) / traders.length : 0,
    totalFollowers: traders.reduce((s, t) => s + t.followers, 0),
    avgProfit: traders.length > 0 ? traders.reduce((s, t) => s + t.profitPct, 0) / traders.length : 0,
  };

  if (isLoading) return <SocialTradingSkeleton />;

  return (
    <div className="space-y-4 p-4">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#D4AF37]/10">
          <Users className="size-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">معامله‌گری اجتماعی</h1>
          <p className="text-xs text-muted-foreground">از بهترین‌ها یاد بگیرید — معاملاتشان را کپی کنید</p>
        </div>
      </div>

      {/* ── Global Copy Trading Toggle ── */}
      <Card className="overflow-hidden border-[#D4AF37]/20 bg-[#D4AF37]/[0.03]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                <Copy className="size-4 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">کپی‌ترید خودکار</p>
                <p className="text-[11px] text-muted-foreground">معاملات تریدرهای دنبال‌شده کپی شود</p>
              </div>
            </div>
            <Switch
              checked={isGlobalCopyTrading}
              onCheckedChange={(checked) => {
                setIsGlobalCopyTrading(checked);
                addToast(checked ? 'کپی‌ترید خودکار فعال شد' : 'کپی‌ترید خودکار غیرفعال شد', checked ? 'success' : 'info');
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="overflow-hidden">
          <CardContent className="p-4 text-center">
            <Target className="size-4 text-[#D4AF37] mx-auto mb-1.5" />
            <p className="text-[10px] text-muted-foreground">میانگین نرخ برد</p>
            <p className="text-base font-black tabular-nums text-foreground">{formatNumber(topStats.avgWinRate)}%</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4 text-center">
            <Users className="size-4 text-blue-500 mx-auto mb-1.5" />
            <p className="text-[10px] text-muted-foreground">کل فالوورها</p>
            <p className="text-base font-black tabular-nums text-foreground">{formatNumber(topStats.totalFollowers)}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4 text-center">
            <TrendingUp className="size-4 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-[10px] text-muted-foreground">میانگین سود</p>
            <p className="text-base font-black tabular-nums text-foreground">+{formatNumber(topStats.avgProfit)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Sort Controls ── */}
      <div className="flex items-center gap-2">
        {[
          { key: 'rank' as const, label: 'رتبه' },
          { key: 'winRate' as const, label: 'نرخ برد' },
          { key: 'profit' as const, label: 'سود' },
        ].map((s) => (
          <Button
            key={s.key}
            variant={sortBy === s.key ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'text-xs',
              sortBy === s.key
                ? 'bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]'
                : 'border-border hover:border-[#D4AF37]/40',
            )}
            onClick={() => setSortBy(s.key)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {/* ── Leaderboard ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Trophy className="size-4 text-[#D4AF37]" />
            جدول رده‌بندی
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            {formatNumber(traders.length)} تریدر
          </Badge>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-2">
            {sortedTraders.map((trader) => {
              const levelConfig = getLevelConfig(trader.level);
              const isExpanded = expandedTrader === trader.id;

              return (
                <div key={trader.id} className="space-y-2">
                  {/* Main row */}
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3 transition-all cursor-pointer',
                      isExpanded ? 'border-[#D4AF37]/30 bg-[#D4AF37]/[0.03]' : 'border-border hover:border-[#D4AF37]/15',
                      trader.rank <= 3 && 'border-[#D4AF37]/20',
                    )}
                    onClick={() => setExpandedTrader(isExpanded ? null : trader.id)}
                  >
                    {/* Rank */}
                    <div className={cn(
                      'flex size-8 items-center justify-center rounded-lg shrink-0 text-xs font-black tabular-nums',
                      trader.rank === 1 ? 'bg-[#D4AF37] text-[#1a1a1a]' :
                      trader.rank === 2 ? 'bg-slate-300 text-slate-800' :
                      trader.rank === 3 ? 'bg-amber-600 text-white' :
                      'bg-muted text-muted-foreground',
                    )}>
                      {formatNumber(trader.rank)}
                    </div>

                    {/* Avatar + Name */}
                    <Avatar className="size-9 shrink-0 border border-border">
                      <AvatarFallback className={cn('text-xs font-bold', levelConfig.bg, levelConfig.color)}>
                        {getInitials(trader.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-foreground truncate">{trader.name}</p>
                        {levelConfig.icon}
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                        <span>{formatNumber(trader.totalTrades)} معامله</span>
                        <span>•</span>
                        <span className="text-[#D4AF37]">{formatNumber(trader.winRate)}% برد</span>
                      </p>
                    </div>

                    {/* Profit */}
                    <div className="text-end shrink-0">
                      <p className="text-sm font-bold tabular-nums text-emerald-500">
                        +{formatNumber(trader.profitPct)}%
                      </p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {formatPrice(trader.profitAmount)}
                      </p>
                    </div>

                    {/* Expand indicator */}
                    {isExpanded ? (
                      <ChevronUp className="size-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.02] p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <Target className="size-3.5 text-[#D4AF37]" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">نرخ برد</p>
                            <p className="text-sm font-bold tabular-nums text-foreground">{formatNumber(trader.winRate)}%</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="size-3.5 text-amber-500" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">استریک فعلی</p>
                            <p className="text-sm font-bold tabular-nums text-foreground">{formatNumber(trader.streak)} معامله</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="size-3.5 text-emerald-500" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">سود کل</p>
                            <p className="text-sm font-bold tabular-nums text-emerald-500">+{formatNumber(trader.profitPct)}%</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="size-3.5 text-blue-500" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">میانگین طلای هر معامله</p>
                            <p className="text-sm font-bold tabular-nums text-foreground">{formatGrams(trader.avgGold)}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Follower count */}
                      <div className="flex items-center gap-2">
                        <Users className="size-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatNumber(trader.followers)} فالوور
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant={trader.isFollowing ? 'outline' : 'default'}
                          size="sm"
                          className={cn(
                            'flex-1 text-xs font-bold',
                            trader.isFollowing
                              ? 'border-red-300 text-red-500 hover:bg-red-50'
                              : 'bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]',
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFollow(trader.id);
                          }}
                        >
                          {trader.isFollowing ? (
                            <span className="flex items-center justify-center gap-1">
                              <UserMinus className="size-3.5" />
                              لغو دنبال
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-1">
                              <UserPlus className="size-3.5" />
                              دنبال کردن
                            </span>
                          )}
                        </Button>
                        <Button
                          variant={trader.isCopyTrading ? 'default' : 'outline'}
                          size="sm"
                          className={cn(
                            'flex-1 text-xs font-bold',
                            trader.isCopyTrading
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                              : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50',
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCopyTrading(trader.id);
                          }}
                        >
                          <span className="flex items-center justify-center gap-1">
                            <Copy className="size-3.5" />
                            {trader.isCopyTrading ? 'کپی فعال ✅' : 'شروع کپی‌ترید'}
                          </span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

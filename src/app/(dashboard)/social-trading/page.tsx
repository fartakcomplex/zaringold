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
  Shield,
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  Percent,
  Search,
  Activity,
  Eye,
  Rss,
  Bookmark,
  ArrowLeftRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/lib/store';
import { cn, formatNumber, formatToman, formatPrice, formatGrams, getTimeAgo } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Trader {
  id: string;
  name: string;
  rank: number;
  winRate: number;
  totalTrades: number;
  profitAmount: number;
  profitPct: number;
  followers: number;
  isFollowing: boolean;
  isCopyTrading: boolean;
  copyPercentage: number;
  streak: number;
  avgGold: number;
  level: 'diamond' | 'gold' | 'silver' | 'bronze';
  recentTrades: { type: 'buy' | 'sell'; goldMg: number; price: number; time: string; profitPct?: number }[];
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper Functions                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getLevelConfig(level: string) {
  switch (level) {
    case 'diamond':
      return { icon: <Crown className="size-4 text-cyan-400" />, label: 'الماسی', bg: 'bg-cyan-500/10', color: 'text-cyan-400', border: 'border-cyan-500/20' };
    case 'gold':
      return { icon: <Trophy className="size-4 text-[#D4AF37]" />, label: 'طلایی', bg: 'bg-[#D4AF37]/10', color: 'text-[#D4AF37]', border: 'border-[#D4AF37]/20' };
    case 'silver':
      return { icon: <Medal className="size-4 text-slate-400" />, label: 'نقره‌ای', bg: 'bg-slate-500/10', color: 'text-slate-400', border: 'border-slate-500/20' };
    default:
      return { icon: <Star className="size-4 text-amber-700" />, label: 'برنزی', bg: 'bg-amber-700/10', color: 'text-amber-700', border: 'border-amber-700/20' };
  }
}

function getInitials(name: string) {
  const parts = name.split(' ');
  return parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SVG Win Rate Gauge                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function WinRateGauge({ winRate }: { winRate: number }) {
  const size = 60;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (winRate / 100) * circumference * 0.75; // 270 degree arc
  const offset = circumference * 0.75 - progress;
  const center = size / 2;

  const color = winRate >= 80 ? '#10B981' : winRate >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke="currentColor" strokeWidth={strokeWidth}
          className="text-muted/15"
          strokeDasharray={circumference * 0.75}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(135 ${center} ${center})`}
        />
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference * 0.75}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(135 ${center} ${center})`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-black tabular-nums" style={{ color }}>{formatNumber(winRate)}</span>
        <span className="text-[8px] text-muted-foreground">% برد</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Data                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MOCK_TRADERS: Trader[] = [
  {
    id: 't1', name: 'علی محمدی', rank: 1, winRate: 87.3, totalTrades: 342, profitAmount: 45600000, profitPct: 32.5, followers: 1245, isFollowing: true, isCopyTrading: false, copyPercentage: 10, streak: 12, avgGold: 0.85, level: 'diamond',
    recentTrades: [
      { type: 'buy', goldMg: 500, price: 33500000, time: new Date(Date.now() - 1800000).toISOString(), profitPct: 2.3 },
      { type: 'sell', goldMg: 200, price: 33800000, time: new Date(Date.now() - 7200000).toISOString(), profitPct: 1.8 },
    ],
  },
  {
    id: 't2', name: 'سارا رضایی', rank: 2, winRate: 82.1, totalTrades: 218, profitAmount: 34200000, profitPct: 28.4, followers: 890, isFollowing: false, isCopyTrading: false, copyPercentage: 5, streak: 8, avgGold: 0.62, level: 'diamond',
    recentTrades: [
      { type: 'buy', goldMg: 300, price: 33400000, time: new Date(Date.now() - 3600000).toISOString(), profitPct: 1.5 },
    ],
  },
  {
    id: 't3', name: 'محمد حسینی', rank: 3, winRate: 79.5, totalTrades: 456, profitAmount: 28900000, profitPct: 24.1, followers: 756, isFollowing: true, isCopyTrading: true, copyPercentage: 15, streak: 5, avgGold: 1.2, level: 'gold',
    recentTrades: [
      { type: 'buy', goldMg: 1000, price: 33200000, time: new Date(Date.now() - 5400000).toISOString(), profitPct: 3.1 },
      { type: 'sell', goldMg: 500, price: 33600000, time: new Date(Date.now() - 10800000).toISOString(), profitPct: 2.5 },
      { type: 'buy', goldMg: 250, price: 33300000, time: new Date(Date.now() - 18000000).toISOString() },
    ],
  },
  {
    id: 't4', name: 'مریم کریمی', rank: 4, winRate: 76.8, totalTrades: 189, profitAmount: 21500000, profitPct: 21.3, followers: 534, isFollowing: false, isCopyTrading: false, copyPercentage: 5, streak: 3, avgGold: 0.45, level: 'gold',
    recentTrades: [
      { type: 'sell', goldMg: 150, price: 33700000, time: new Date(Date.now() - 6000000).toISOString(), profitPct: 0.9 },
    ],
  },
  {
    id: 't5', name: 'رضا احمدی', rank: 5, winRate: 74.2, totalTrades: 567, profitAmount: 18700000, profitPct: 18.7, followers: 423, isFollowing: false, isCopyTrading: false, copyPercentage: 5, streak: 7, avgGold: 0.33, level: 'gold',
    recentTrades: [
      { type: 'buy', goldMg: 100, price: 33400000, time: new Date(Date.now() - 14400000).toISOString() },
    ],
  },
  {
    id: 't6', name: 'فاطمه موسوی', rank: 6, winRate: 71.5, totalTrades: 324, profitAmount: 15400000, profitPct: 15.9, followers: 312, isFollowing: false, isCopyTrading: false, copyPercentage: 5, streak: 2, avgGold: 0.58, level: 'silver',
    recentTrades: [
      { type: 'buy', goldMg: 400, price: 33100000, time: new Date(Date.now() - 21600000).toISOString(), profitPct: 1.2 },
    ],
  },
  {
    id: 't7', name: 'حسین نوری', rank: 7, winRate: 69.8, totalTrades: 234, profitAmount: 12800000, profitPct: 14.2, followers: 267, isFollowing: false, isCopyTrading: false, copyPercentage: 5, streak: 4, avgGold: 0.71, level: 'silver',
    recentTrades: [],
  },
  {
    id: 't8', name: 'زهرا صادقی', rank: 8, winRate: 67.3, totalTrades: 178, profitAmount: 10500000, profitPct: 12.5, followers: 198, isFollowing: false, isCopyTrading: false, copyPercentage: 5, streak: 1, avgGold: 0.92, level: 'silver',
    recentTrades: [
      { type: 'sell', goldMg: 600, price: 33900000, time: new Date(Date.now() - 28800000).toISOString(), profitPct: 2.1 },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SocialTradingPageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-3 w-16 mb-2" /><Skeleton className="h-7 w-20" /></CardContent></Card>)}</div>
      <Card><CardContent className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</CardContent></Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SocialTradingPage() {
  const { user, addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [sortBy, setSortBy] = useState<'rank' | 'winRate' | 'profit' | 'followers'>('rank');
  const [expandedTrader, setExpandedTrader] = useState<string | null>(null);
  const [isGlobalCopyTrading, setIsGlobalCopyTrading] = useState(false);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'feed' | 'following'>('leaderboard');
  const [searchQuery, setSearchQuery] = useState('');

  const userId = user?.id || 'dev-super-admin';

  /* ── Fetch data ── */
  const fetchTraders = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setTraders(MOCK_TRADERS);
    } catch {
      setTraders(MOCK_TRADERS);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchTraders(); }, [fetchTraders]);

  /* ── Filter & Sort ── */
  const filteredTraders = traders
    .filter(t => !searchQuery || t.name.includes(searchQuery))
    .sort((a, b) => {
      if (sortBy === 'winRate') return b.winRate - a.winRate;
      if (sortBy === 'profit') return b.profitPct - a.profitPct;
      if (sortBy === 'followers') return b.followers - a.followers;
      return a.rank - b.rank;
    });

  const followedTraders = traders.filter(t => t.isFollowing);
  const allRecentTrades = traders
    .flatMap(t => t.recentTrades.map(tr => ({ ...tr, traderName: t.name, traderLevel: t.level })))
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  /* ── Handlers ── */
  const handleToggleFollow = (traderId: string) => {
    setTraders(prev =>
      prev.map(t =>
        t.id === traderId ? { ...t, isFollowing: !t.isFollowing, followers: t.isFollowing ? t.followers - 1 : t.followers + 1 } : t,
      ),
    );
    const trader = traders.find(t => t.id === traderId);
    if (trader) {
      addToast(trader.isFollowing ? `دنبال‌کردن ${trader.name} لغو شد` : `${trader.name} دنبال شد ✅`, trader.isFollowing ? 'info' : 'success');
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
        trader.isCopyTrading ? `کپی‌ترید ${trader.name} متوقف شد` : `کپی‌ترید ${trader.name} فعال شد 🔄`,
        trader.isCopyTrading ? 'info' : 'success',
      );
    }
  };

  const handleChangeCopyPct = (traderId: string, pct: number) => {
    setTraders(prev => prev.map(t => t.id === traderId ? { ...t, copyPercentage: Math.max(1, Math.min(100, pct)) } : t));
  };

  const topStats = {
    avgWinRate: traders.length > 0 ? traders.reduce((s, t) => s + t.winRate, 0) / traders.length : 0,
    totalFollowers: traders.reduce((s, t) => s + t.followers, 0),
    avgProfit: traders.length > 0 ? traders.reduce((s, t) => s + t.profitPct, 0) / traders.length : 0,
  };

  if (isLoading) return <SocialTradingPageSkeleton />;

  return (
    <div className="space-y-4 p-4">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5">
          <Users className="size-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">معاملات اجتماعی</h1>
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
        <Card className="overflow-hidden"><CardContent className="p-3 text-center">
          <Target className="size-4 text-[#D4AF37] mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground">میانگین نرخ برد</p>
          <p className="text-sm font-black tabular-nums text-foreground">{formatNumber(topStats.avgWinRate)}%</p>
        </CardContent></Card>
        <Card className="overflow-hidden"><CardContent className="p-3 text-center">
          <Users className="size-4 text-blue-500 mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground">کل فالوورها</p>
          <p className="text-sm font-black tabular-nums text-foreground">{formatNumber(topStats.totalFollowers)}</p>
        </CardContent></Card>
        <Card className="overflow-hidden"><CardContent className="p-3 text-center">
          <TrendingUp className="size-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground">میانگین سود</p>
          <p className="text-sm font-black tabular-nums text-foreground">+{formatNumber(topStats.avgProfit)}%</p>
        </CardContent></Card>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2">
        {[
          { key: 'leaderboard' as const, label: 'رده‌بندی', icon: <Trophy className="size-3.5" /> },
          { key: 'feed' as const, label: 'فید معاملات', icon: <Rss className="size-3.5" /> },
          { key: 'following' as const, label: 'دنبال‌شده‌ها', icon: <Bookmark className="size-3.5" /> },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'flex-1 text-xs font-bold',
              activeTab === tab.key
                ? 'bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]'
                : 'border-border hover:border-[#D4AF37]/40',
            )}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="flex items-center gap-1.5">{tab.icon}{tab.label}</span>
          </Button>
        ))}
      </div>

      {/* ════════ LEADERBOARD TAB ════════ */}
      {activeTab === 'leaderboard' && (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی تریدر..."
              className="w-full rounded-xl border border-border bg-background ps-9 pe-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#D4AF37]/40 transition-colors"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { key: 'rank' as const, label: 'رتبه' },
              { key: 'winRate' as const, label: 'نرخ برد' },
              { key: 'profit' as const, label: 'سود' },
              { key: 'followers' as const, label: 'فالوور' },
            ].map((s) => (
              <Button
                key={s.key}
                variant={sortBy === s.key ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'text-xs',
                  sortBy === s.key ? 'bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]' : 'border-border hover:border-[#D4AF37]/40',
                )}
                onClick={() => setSortBy(s.key)}
              >
                {s.label}
              </Button>
            ))}
          </div>

          {/* Leaderboard */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Trophy className="size-4 text-[#D4AF37]" />
                جدول رده‌بندی
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">{formatNumber(filteredTraders.length)} تریدر</Badge>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-2 max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                {filteredTraders.map((trader) => {
                  const levelConfig = getLevelConfig(trader.level);
                  const isExpanded = expandedTrader === trader.id;
                  return (
                    <div key={trader.id} className="space-y-2">
                      <div
                        className={cn(
                          'flex items-center gap-3 rounded-xl border p-3 transition-all cursor-pointer',
                          isExpanded ? 'border-[#D4AF37]/30 bg-[#D4AF37]/[0.03]' : 'border-border hover:border-[#D4AF37]/15',
                          trader.rank <= 3 && 'border-[#D4AF37]/20',
                        )}
                        onClick={() => setExpandedTrader(isExpanded ? null : trader.id)}
                      >
                        <div className={cn(
                          'flex size-8 items-center justify-center rounded-lg shrink-0 text-xs font-black tabular-nums',
                          trader.rank === 1 ? 'bg-[#D4AF37] text-[#1a1a1a]' :
                          trader.rank === 2 ? 'bg-slate-300 text-slate-800' :
                          trader.rank === 3 ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground',
                        )}>
                          {formatNumber(trader.rank)}
                        </div>
                        <Avatar className="size-9 shrink-0 border border-border">
                          <AvatarFallback className={cn('text-xs font-bold', levelConfig.bg, levelConfig.color)}>{getInitials(trader.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-foreground truncate">{trader.name}</p>
                            {levelConfig.icon}
                            {trader.isCopyTrading && <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 text-[8px] px-1.5 py-0">کپی</Badge>}
                          </div>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                            <span>{formatNumber(trader.totalTrades)} معامله</span>
                            <span>•</span>
                            <span className="text-[#D4AF37]">{formatNumber(trader.winRate)}% برد</span>
                          </p>
                        </div>
                        <div className="text-end shrink-0">
                          <p className="text-sm font-bold tabular-nums text-emerald-500">+{formatNumber(trader.profitPct)}%</p>
                          <p className="text-[10px] text-muted-foreground tabular-nums">{formatPrice(trader.profitAmount)}</p>
                        </div>
                        {isExpanded ? <ChevronUp className="size-4 text-muted-foreground shrink-0" /> : <ChevronDown className="size-4 text-muted-foreground shrink-0" />}
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.02] p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <WinRateGauge winRate={trader.winRate} />
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Zap className="size-3.5 text-amber-500" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground">استریک فعلی</p>
                                  <p className="text-sm font-bold tabular-nums">{formatNumber(trader.streak)} معامله</p>
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
                                  <p className="text-[10px] text-muted-foreground">میانگین هر معامله</p>
                                  <p className="text-sm font-bold tabular-nums">{formatGrams(trader.avgGold)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Separator />
                          <div className="flex items-center gap-2">
                            <Users className="size-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{formatNumber(trader.followers)} فالوور</span>
                          </div>

                          {/* Copy % allocation */}
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-foreground flex items-center gap-2">
                              <ArrowLeftRight className="size-3.5 text-[#D4AF37]" />
                              سهم کپی‌ترید از پرتفوی
                            </p>
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min="1"
                                max="100"
                                value={trader.copyPercentage}
                                onChange={(e) => handleChangeCopyPct(trader.id, Number(e.target.value))}
                                className="flex-1 accent-[#D4AF37]"
                                dir="ltr"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 min-w-[40px] justify-center">
                                {formatNumber(trader.copyPercentage)}%
                              </Badge>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              variant={trader.isFollowing ? 'outline' : 'default'}
                              size="sm"
                              className={cn('flex-1 text-xs font-bold',
                                trader.isFollowing ? 'border-red-300 text-red-500 hover:bg-red-50' : 'bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]',
                              )}
                              onClick={(e) => { e.stopPropagation(); handleToggleFollow(trader.id); }}
                            >
                              {trader.isFollowing ? <span className="flex items-center gap-1"><UserMinus className="size-3.5" />لغو دنبال</span> : <span className="flex items-center gap-1"><UserPlus className="size-3.5" />دنبال کردن</span>}
                            </Button>
                            <Button
                              variant={trader.isCopyTrading ? 'default' : 'outline'}
                              size="sm"
                              className={cn('flex-1 text-xs font-bold',
                                trader.isCopyTrading ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50',
                              )}
                              onClick={(e) => { e.stopPropagation(); handleToggleCopyTrading(trader.id); }}
                            >
                              <span className="flex items-center gap-1">
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
        </>
      )}

      {/* ════════ FEED TAB ════════ */}
      {activeTab === 'feed' && (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="size-4 text-[#D4AF37]" />
              فید معاملات اخیر
            </CardTitle>
            <Badge variant="secondary" className="text-[10px]">زنده</Badge>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2 max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {allRecentTrades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Activity className="size-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">معامله‌ای ثبت نشده</p>
                </div>
              ) : (
                allRecentTrades.map((trade, i) => {
                  const levelCfg = getLevelConfig(trade.traderLevel);
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:border-[#D4AF37]/15 transition-colors">
                      <div className={cn('flex size-8 items-center justify-center rounded-lg shrink-0', trade.type === 'buy' ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
                        {trade.type === 'buy' ? <TrendingUp className="size-4 text-emerald-500" /> : <TrendingDown className="size-4 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">{trade.traderName}</span>
                          {levelCfg.icon}
                          <Badge className={cn('text-[8px] px-1.5 py-0', trade.type === 'buy' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500')}>
                            {trade.type === 'buy' ? 'خرید' : 'فروش'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {formatNumber(trade.goldMg)} mg • {formatToman(trade.price)}
                        </p>
                      </div>
                      <div className="text-end shrink-0">
                        {trade.profitPct && (
                          <p className={cn('text-xs font-bold tabular-nums', trade.profitPct > 0 ? 'text-emerald-500' : 'text-red-500')}>
                            {trade.profitPct > 0 ? '+' : ''}{trade.profitPct}%
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground">{getTimeAgo(trade.time)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ════════ FOLLOWING TAB ════════ */}
      {activeTab === 'following' && (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Bookmark className="size-4 text-[#D4AF37]" />
              تریدرهای دنبال‌شده
            </CardTitle>
            <Badge variant="secondary" className="text-[10px]">{formatNumber(followedTraders.length)} نفر</Badge>
          </CardHeader>
          <CardContent className="pb-4">
            {followedTraders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Eye className="size-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">هنوز کسی را دنبال نکرده‌اید</p>
                <p className="text-xs text-muted-foreground/70 mt-1">از تب رده‌بندی تریدرها را دنبال کنید</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                {followedTraders.map((trader) => {
                  const levelConfig = getLevelConfig(trader.level);
                  return (
                    <div key={trader.id} className="rounded-xl border border-border p-4 hover:border-[#D4AF37]/15 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn('flex size-8 items-center justify-center rounded-lg shrink-0 text-xs font-black', trader.rank === 1 ? 'bg-[#D4AF37] text-[#1a1a1a]' : 'bg-muted text-muted-foreground')}>
                          {formatNumber(trader.rank)}
                        </div>
                        <Avatar className="size-9 shrink-0 border border-border">
                          <AvatarFallback className={cn('text-xs font-bold', levelConfig.bg, levelConfig.color)}>{getInitials(trader.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-foreground">{trader.name}</p>
                            {levelConfig.icon}
                            {trader.isCopyTrading && <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 text-[8px] px-1.5 py-0">کپی فعال</Badge>}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] text-[#D4AF37] font-bold">{formatNumber(trader.winRate)}% برد</span>
                            <span className="text-[10px] text-muted-foreground">{formatNumber(trader.totalTrades)} معامله</span>
                          </div>
                        </div>
                        <div className="text-end">
                          <p className="text-sm font-bold tabular-nums text-emerald-500">+{formatNumber(trader.profitPct)}%</p>
                          <p className="text-[10px] text-muted-foreground">کپی: {trader.copyPercentage}%</p>
                        </div>
                      </div>

                      {/* Recent Trades */}
                      {trader.recentTrades.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground mb-1">آخرین معاملات:</p>
                          {trader.recentTrades.map((tr, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px]">
                              <Badge className={cn('text-[8px] px-1.5 py-0', tr.type === 'buy' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500')}>
                                {tr.type === 'buy' ? 'خرید' : 'فروش'}
                              </Badge>
                              <span className="tabular-nums">{formatNumber(tr.goldMg)} mg</span>
                              {tr.profitPct && <span className="text-emerald-500 font-bold">+{tr.profitPct}%</span>}
                              <span className="ms-auto text-muted-foreground">{getTimeAgo(tr.time)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs font-bold border-red-300 text-red-500 hover:bg-red-50"
                          onClick={() => handleToggleFollow(trader.id)}
                        >
                          <UserMinus className="size-3.5 me-1" />لغو دنبال
                        </Button>
                        <Button
                          variant={trader.isCopyTrading ? 'default' : 'outline'}
                          size="sm"
                          className={cn('flex-1 text-xs font-bold',
                            trader.isCopyTrading ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50',
                          )}
                          onClick={() => handleToggleCopyTrading(trader.id)}
                        >
                          <Copy className="size-3.5 me-1" />{trader.isCopyTrading ? 'توقف کپی' : 'شروع کپی'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { formatNumber, formatToman, formatGrams, cn } from '@/lib/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  PieChart,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Coins,
  DollarSign,
  Share2,
  BarChart3,
  Target,
  RefreshCw,
  Gem,
  ArrowUpDown,
  Eye,
  Copy,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Crown,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                        */
/* ═══════════════════════════════════════════════════════════════ */

interface PortfolioAsset {
  id: string;
  assetType: 'gold' | 'silver' | 'currency' | 'stock';
  assetName: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  icon: string;
  color: string;
}

interface PortfolioData {
  id: string;
  name: string;
  assets: PortfolioAsset[];
  totalValue: number;
  totalCost: number;
  dailyChange: number;
  weeklyChange: number;
  monthlyChange: number;
  yearlyChange: number;
  goldGramsEquiv: number;
  zarinGoldIndex: number;
  indexChange: number;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Mock Data                                                    */
/* ═══════════════════════════════════════════════════════════════ */

const MOCK_PORTFOLIO: PortfolioData = {
  id: 'pf-1',
  name: 'پرتفوی اصلی',
  assets: [
    { id: 'a1', assetType: 'gold', assetName: 'طلای ۱۸ عیار', quantity: 5.2, buyPrice: 33_500_000, currentPrice: 35_200_000, icon: '🥇', color: '#D4AF37' },
    { id: 'a2', assetType: 'gold', assetName: 'سکه بهار آزادی', quantity: 2, buyPrice: 42_000_000, currentPrice: 44_500_000, icon: '🪙', color: '#F0C040' },
    { id: 'a3', assetType: 'silver', assetName: 'نقره', quantity: 50, buyPrice: 850_000, currentPrice: 920_000, icon: '🥈', color: '#C0C0C0' },
    { id: 'a4', assetType: 'currency', assetName: 'دلار', quantity: 500, buyPrice: 58000, currentPrice: 61500, icon: '💵', color: '#22C55E' },
    { id: 'a5', assetType: 'currency', assetName: 'یورو', quantity: 300, buyPrice: 62500, currentPrice: 66500, icon: '💶', color: '#3B82F6' },
    { id: 'a6', assetType: 'stock', assetName: 'بورس (شاخص کل)', quantity: 100, buyPrice: 2200000, currentPrice: 2380000, icon: '📈', color: '#A855F7' },
  ],
  totalValue: 485_600_000,
  totalCost: 453_200_000,
  dailyChange: 1.2,
  weeklyChange: 3.8,
  monthlyChange: 7.1,
  yearlyChange: 24.5,
  goldGramsEquiv: 13.78,
  zarinGoldIndex: 2487.5,
  indexChange: 0.85,
};

const ASSET_PRESETS = [
  { assetType: 'gold' as const, assetName: 'طلای ۱۸ عیار', icon: '🥇', color: '#D4AF37', defaultPrice: 35200000 },
  { assetType: 'gold' as const, assetName: 'سکه بهار آزادی', icon: '🪙', color: '#F0C040', defaultPrice: 44500000 },
  { assetType: 'gold' as const, assetName: 'طلای ۲۴ عیار', icon: '✨', color: '#FFD700', defaultPrice: 46800000 },
  { assetType: 'silver' as const, assetName: 'نقره', icon: '🥈', color: '#C0C0C0', defaultPrice: 920000 },
  { assetType: 'currency' as const, assetName: 'دلار', icon: '💵', color: '#22C55E', defaultPrice: 61500 },
  { assetType: 'currency' as const, assetName: 'یورو', icon: '💶', color: '#3B82F6', defaultPrice: 66500 },
  { assetType: 'currency' as const, assetName: 'پوند', icon: '💷', color: '#F97316', defaultPrice: 78500 },
  { assetType: 'stock' as const, assetName: 'شاخص بورس', icon: '📈', color: '#A855F7', defaultPrice: 2380000 },
  { assetType: 'stock' as const, assetName: 'صندوق طلا', icon: '💎', color: '#EC4899', defaultPrice: 45000 },
];

const TIME_PERIODS = [
  { key: 'daily', label: 'روزانه', change: 1.2 },
  { key: 'weekly', label: 'هفتگی', change: 3.8 },
  { key: 'monthly', label: 'ماهانه', change: 7.1 },
  { key: 'yearly', label: 'سالانه', change: 24.5 },
];

/* ═══════════════════════════════════════════════════════════════ */
/*  SVG Donut Chart Component                                    */
/* ═══════════════════════════════════════════════════════════════ */

function DonutChart({ assets, totalValue }: { assets: PortfolioAsset[]; totalValue: number }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 75;
  const innerR = 50;
  const strokeWidth = outerR - innerR;
  const midR = (outerR + innerR) / 2;
  const circumference = 2 * Math.PI * midR;

  let accumulated = 0;

  const segments = assets.map((asset) => {
    const pct = (asset.quantity * asset.currentPrice) / totalValue;
    const dashLength = pct * circumference;
    const dashGap = circumference - dashLength;
    const offset = -(accumulated * circumference);
    accumulated += pct;
    return { ...asset, pct, dashLength, dashGap, offset };
  });

  return (
    <div className="relative mx-auto w-[140px] h-[140px] sm:w-[180px] sm:h-[180px]">
      <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={cx} cy={cy} r={midR}
          fill="none" stroke="currentColor" strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Segments */}
        {segments.map((seg) => (
          <circle
            key={seg.id}
            cx={cx} cy={cy} r={midR}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth - 4}
            strokeDasharray={`${seg.dashLength} ${seg.dashGap}`}
            strokeDashoffset={seg.offset}
            strokeLinecap="butt"
            className="transition-all duration-700"
          />
        ))}
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] text-muted-foreground">ارزش کل</span>
        <span className="text-sm font-black tabular-nums">{formatToman(totalValue)}</span>
        <span className="text-[9px] text-muted-foreground">تومان</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Performance Sparkline                                       */
/* ═══════════════════════════════════════════════════════════════ */

function Sparkline({ data, color, width = 120, height = 40 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" fill="none">
      <polyline points={points} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Page                                                    */
/* ═══════════════════════════════════════════════════════════════ */

export default function CustomPortfolioPage() {
  const { user, goldPrice, addToast } = useAppStore();
  const [portfolio, setPortfolio] = useState<PortfolioData>(MOCK_PORTFOLIO);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState('daily');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(ASSET_PRESETS[0]);
  const [newQuantity, setNewQuantity] = useState('');

  // Mock sparkline data per period
  const sparkData = useMemo(() => ({
    daily: Array.from({ length: 24 }, (_, i) => 100 + Math.sin(i * 0.3) * 3 + Math.random() * 2),
    weekly: Array.from({ length: 7 }, (_, i) => 100 + Math.sin(i * 0.5) * 5 + Math.random() * 3),
    monthly: Array.from({ length: 30 }, (_, i) => 100 + i * 0.2 + Math.sin(i * 0.2) * 4 + Math.random() * 2),
    yearly: Array.from({ length: 12 }, (_, i) => 100 + i * 1.5 + Math.sin(i * 0.4) * 6 + Math.random() * 3),
  }), []);

  const currentChange = TIME_PERIODS.find(p => p.key === activePeriod)?.change ?? 0;
  const profitLoss = portfolio.totalValue - portfolio.totalCost;
  const profitPct = (profitLoss / portfolio.totalCost) * 100;

  // Mock rebalance suggestions
  const rebalanceSuggestions = useMemo(() => {
    const idealAllocation = { gold: 50, silver: 10, currency: 25, stock: 15 };
    const currentAllocation: Record<string, number> = {};
    portfolio.assets.forEach(a => {
      currentAllocation[a.assetType] = (currentAllocation[a.assetType] || 0) + (a.quantity * a.currentPrice);
    });
    return Object.entries(idealAllocation).map(([type, idealPct]) => {
      const currentVal = currentAllocation[type] || 0;
      const currentPct = (currentVal / portfolio.totalValue) * 100;
      const diff = currentPct - idealPct;
      return { type, idealPct, currentPct: Math.round(currentPct * 10) / 10, diff: Math.round(diff * 10) / 10 };
    });
  }, [portfolio]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  const handleAddAsset = () => {
    const qty = Number(newQuantity);
    if (!qty || qty <= 0) {
      addToast('مقدار را وارد کنید', 'error');
      return;
    }
    const newAsset: PortfolioAsset = {
      id: `a-${Date.now()}`,
      assetType: selectedPreset.assetType,
      assetName: selectedPreset.assetName,
      quantity: qty,
      buyPrice: selectedPreset.defaultPrice,
      currentPrice: selectedPreset.defaultPrice,
      icon: selectedPreset.icon,
      color: selectedPreset.color,
    };
    setPortfolio(prev => ({
      ...prev,
      assets: [...prev.assets, newAsset],
      totalValue: prev.totalValue + qty * selectedPreset.defaultPrice,
      totalCost: prev.totalCost + qty * selectedPreset.defaultPrice,
    }));
    setAddDialogOpen(false);
    setNewQuantity('');
    addToast(`${selectedPreset.assetName} به پرتفوی اضافه شد ✅`, 'success');
  };

  const handleRemoveAsset = (id: string) => {
    const asset = portfolio.assets.find(a => a.id === id);
    if (!asset) return;
    setPortfolio(prev => ({
      ...prev,
      assets: prev.assets.filter(a => a.id !== id),
      totalValue: prev.totalValue - asset.quantity * asset.currentPrice,
      totalCost: prev.totalCost - asset.quantity * asset.buyPrice,
    }));
    addToast(`${asset.assetName} از پرتفوی حذف شد`, 'info');
  };

  const handleShare = () => {
    const link = `https://zarringold.ir/p/share/${portfolio.id}`;
    setShareLink(link);
    setShareDialogOpen(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#D4AF37]/10">
          <PieChart className="size-5 text-[#D4AF37]" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">پورتفولیو سفارشی</h1>
          <p className="text-xs text-muted-foreground">مدیریت دارایی‌ها و مقایسه با شاخص زرین گلد</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleShare} className="text-xs border-[#D4AF37]/30 text-[#D4AF37]">
          <Share2 className="size-3.5 me-1" /> اشتراک
        </Button>
      </div>

      {/* Total Value Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-[#D4AF37]/10 to-transparent border-[#D4AF37]/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="size-4 text-[#D4AF37]" />
              <span className="text-[11px] text-muted-foreground">ارزش کل (تومان)</span>
            </div>
            <p className="text-xl font-black tabular-nums">{formatToman(portfolio.totalValue)}</p>
            <div className={`flex items-center gap-1 mt-1 text-xs ${profitLoss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {profitLoss >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              <span>{profitLoss >= 0 ? '+' : ''}{formatToman(profitLoss)} ({profitPct.toFixed(1)}%)</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="size-4 text-yellow-500" />
              <span className="text-[11px] text-muted-foreground">معادل طلای ذخیره</span>
            </div>
            <p className="text-xl font-black tabular-nums">{formatGrams(portfolio.goldGramsEquiv)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">گرم طلای ۱۸ عیار</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Period Selector */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold">بازدهی پرتفوی</span>
            <div className="flex items-center gap-1.5">
              {TIME_PERIODS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setActivePeriod(p.key)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-[11px] font-medium transition-all',
                    activePeriod === p.key
                      ? 'bg-[#D4AF37] text-[#1a1a1a]'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-10">
              <Sparkline
                data={sparkData[activePeriod as keyof typeof sparkData]}
                color={currentChange >= 0 ? '#22C55E' : '#EF4444'}
              />
            </div>
            <div className={cn(
              'px-4 py-2 rounded-xl text-center',
              currentChange >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
            )}>
              <p className={cn('text-2xl font-black tabular-nums', currentChange >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                {currentChange >= 0 ? '+' : ''}{currentChange}%
              </p>
              <p className="text-[9px] text-muted-foreground">بازدهی</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ZarinGold Index Comparison */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crown className="size-4 text-[#D4AF37]" />
              <span className="text-sm font-bold">شاخص زرین گلد</span>
            </div>
            <Badge variant="secondary" className="text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20">
              <Sparkles className="size-3 me-1" /> زنده
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/30 p-3 text-center">
              <p className="text-lg font-black tabular-nums">{formatNumber(portfolio.zarinGoldIndex)}</p>
              <p className="text-[10px] text-muted-foreground">مقدار شاخص</p>
            </div>
            <div className={cn(
              'rounded-xl p-3 text-center',
              portfolio.indexChange >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
            )}>
              <p className={cn('text-lg font-black tabular-nums', portfolio.indexChange >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                {portfolio.indexChange >= 0 ? '+' : ''}{portfolio.indexChange}%
              </p>
              <p className="text-[10px] text-muted-foreground">تغییر شاخص</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-muted/20">
            <ArrowUpDown className="size-3.5 text-[#D4AF37]" />
            <span className="text-[11px] text-muted-foreground">
              پرتفوی شما {currentChange > portfolio.indexChange ? 'ب بهتر' : 'ضعیف‌تر'} از شاخص عمل کرده
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Assets / Chart / Rebalance */}
      <Tabs defaultValue="assets" className="w-full">
        <TabsList className="w-full bg-muted/50 h-10">
          <TabsTrigger value="assets" className="flex-1 text-xs">
            <Eye className="size-3.5 me-1" /> دارایی‌ها
          </TabsTrigger>
          <TabsTrigger value="allocation" className="flex-1 text-xs">
            <PieChart className="size-3.5 me-1" /> تخصیص
          </TabsTrigger>
          <TabsTrigger value="rebalance" className="flex-1 text-xs">
            <Target className="size-3.5 me-1" /> بازتخصیص
          </TabsTrigger>
        </TabsList>

        {/* Assets Tab */}
        <TabsContent value="assets">
          <Card className="bg-card border-border/50 mt-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold">دارایی‌های پرتفوی</CardTitle>
              <Button size="sm" onClick={() => setAddDialogOpen(true)} className="text-xs bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249] h-7">
                <Plus className="size-3.5 me-1" /> افزودن
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {portfolio.assets.map(asset => {
                const value = asset.quantity * asset.currentPrice;
                const cost = asset.quantity * asset.buyPrice;
                const change = ((asset.currentPrice - asset.buyPrice) / asset.buyPrice) * 100;
                const pct = (value / portfolio.totalValue) * 100;

                return (
                  <div key={asset.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-[#D4AF37]/20 transition-colors">
                    <div className="size-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: asset.color + '15' }}>
                      {asset.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold truncate">{asset.assetName}</span>
                        <Badge variant="outline" className="text-[8px] px-1.5">{pct.toFixed(1)}%</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {formatToman(value)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className={cn('text-[11px] font-medium tabular-nums', change >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost" size="sm"
                      className="shrink-0 text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                      onClick={() => handleRemoveAsset(asset.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allocation Tab */}
        <TabsContent value="allocation">
          <Card className="bg-card border-border/50 mt-3">
            <CardContent className="p-4">
              <DonutChart assets={portfolio.assets} totalValue={portfolio.totalValue} />
              <div className="mt-4 space-y-2">
                {portfolio.assets.map(asset => {
                  const value = asset.quantity * asset.currentPrice;
                  const pct = (value / portfolio.totalValue) * 100;
                  return (
                    <div key={asset.id} className="flex items-center gap-2">
                      <span className="text-base">{asset.icon}</span>
                      <span className="text-xs flex-1 truncate">{asset.assetName}</span>
                      <div className="w-24 h-2 rounded-full bg-muted overflow-hidden ml-2">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: asset.color }} />
                      </div>
                      <span className="text-[11px] font-medium tabular-nums w-10 text-left">{pct.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rebalance Tab */}
        <TabsContent value="rebalance">
          <Card className="bg-card border-border/50 mt-3">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Target className="size-4 text-[#D4AF37]" />
                <span className="text-sm font-bold">پیشنهاد بازتخصیص</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                برای کاهش ریسک و بهبود عملکرد، ترکیب دارایی‌های خود را به تخصیص ایده‌آل نزدیک کنید:
              </p>
              {rebalanceSuggestions.map(s => {
                const typeLabels: Record<string, string> = { gold: '🥇 طلا', silver: '🥈 نقره', currency: '💱 ارز', stock: '📈 بورس' };
                return (
                  <div key={s.type} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
                    <span className="text-sm w-20">{typeLabels[s.type]}</span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">فعلی: {s.currentPct}%</span>
                        <span className="text-[10px] text-muted-foreground">ایده‌آل: {s.idealPct}%</span>
                      </div>
                      <div className="relative w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div className="absolute inset-y-0 right-0 bg-[#D4AF37]/30 rounded-full" style={{ width: `${s.idealPct}%` }} />
                        <div className={cn(
                          'absolute inset-y-0 right-0 rounded-full transition-all',
                          Math.abs(s.diff) > 5 ? 'bg-red-500/60' : 'bg-emerald-500/60'
                        )} style={{ width: `${s.currentPct}%` }} />
                      </div>
                    </div>
                    <Badge className={cn('text-[9px] shrink-0', Math.abs(s.diff) > 5 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20')}>
                      {s.diff > 0 ? '+' : ''}{s.diff}%
                    </Badge>
                  </div>
                );
              })}
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    بازتخصیص پرتفوی مستلزم خرید و فروش دارایی‌هاست. کارمزد معاملات را در نظر بگیرید.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Asset Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">افزودن دارایی جدید</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">نوع دارایی</label>
              <div className="grid grid-cols-3 gap-2">
                {ASSET_PRESETS.map(preset => (
                  <button
                    key={preset.assetName}
                    onClick={() => setSelectedPreset(preset)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] transition-all',
                      selectedPreset.assetName === preset.assetName
                        ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]'
                        : 'border-border hover:border-[#D4AF37]/30'
                    )}
                  >
                    <span className="text-base">{preset.icon}</span>
                    <span className="truncate w-full text-center">{preset.assetName}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">مقدار</label>
              <Input
                type="number"
                value={newQuantity}
                onChange={e => setNewQuantity(e.target.value)}
                placeholder="مثلاً: 5"
                dir="ltr"
                className="text-sm tabular-nums"
              />
            </div>
            {newQuantity && Number(newQuantity) > 0 && (
              <div className="p-3 rounded-xl bg-muted/30">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">ارزش تقریبی</span>
                  <span className="font-bold tabular-nums">{formatToman(Number(newQuantity) * selectedPreset.defaultPrice)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="text-xs">انصراف</Button>
            <Button onClick={handleAddAsset} className="text-xs bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]">افزودن</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Share2 className="size-4 text-[#D4AF37]" /> اشتراک‌گذاری پرتفوی
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">لینک اشتراک پرتفوی شما:</p>
            <div className="flex items-center gap-2">
              <Input readOnly value={shareLink} className="text-xs font-mono" dir="ltr" />
              <Button size="sm" variant="outline" onClick={handleCopyLink} className="shrink-0">
                {copied ? <CheckCircle className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Target, TrendingUp, Trophy, History, Crown, Medal, CheckCircle, XCircle, Loader2,
  BarChart3, Crosshair, Clock, Flame, Zap, Star, Gift, Award, ArrowUpRight, ArrowDownRight,
  Sparkles, Lock, Unlock, Timer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/lib/store';
import { formatToman, formatNumber, formatDate, cn } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Prediction {
  id: string;
  predictedPrice: number;
  targetDate: string;
  createdAt: string;
  status: 'pending' | 'correct' | 'incorrect';
  actualPrice?: number;
  accuracy?: number;
  xpEarned?: number;
}

interface LeaderboardEntry {
  rank: number;
  fullName: string;
  score: number;
  correctPredictions: number;
  level: number;
  isCurrentUser?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requiredCount: number;
  currentCount: number;
  isUnlocked: boolean;
  xpReward: number;
}

interface PredictionStats {
  totalPredictions: number;
  correctCount: number;
  accuracy: number;
  streak: number;
  bestStreak: number;
  totalXP: number;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Data                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MOCK_PREDICTIONS: Prediction[] = [
  { id: 'p1', predictedPrice: 34200000, targetDate: '2025-06-15', createdAt: '2025-06-14', status: 'correct', actualPrice: 34150000, accuracy: 98.5, xpEarned: 50 },
  { id: 'p2', predictedPrice: 33800000, targetDate: '2025-06-14', createdAt: '2025-06-13', status: 'incorrect', actualPrice: 34500000, accuracy: 97.1, xpEarned: 5 },
  { id: 'p3', predictedPrice: 34000000, targetDate: '2025-06-13', createdAt: '2025-06-12', status: 'correct', actualPrice: 34050000, accuracy: 99.9, xpEarned: 50 },
  { id: 'p4', predictedPrice: 33950000, targetDate: '2025-06-12', createdAt: '2025-06-11', status: 'correct', actualPrice: 33980000, accuracy: 99.1, xpEarned: 50 },
  { id: 'p5', predictedPrice: 33600000, targetDate: '2025-06-11', createdAt: '2025-06-10', status: 'incorrect', actualPrice: 33400000, accuracy: 94.0, xpEarned: 5 },
  { id: 'p6', predictedPrice: 33500000, targetDate: '2025-06-18', createdAt: '2025-06-17', status: 'pending' },
];

const MOCK_STATS: PredictionStats = {
  totalPredictions: 15,
  correctCount: 9,
  accuracy: 60,
  streak: 2,
  bestStreak: 4,
  totalXP: 450,
};

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, fullName: 'سارا احمدی', score: 95, correctPredictions: 19, level: 10 },
  { rank: 2, fullName: 'محمد رضایی', score: 88, correctPredictions: 17, level: 9 },
  { rank: 3, fullName: 'علی محمدی', score: 82, correctPredictions: 16, level: 8 },
  { rank: 4, fullName: 'مریم حسینی', score: 75, correctPredictions: 15, level: 8 },
  { rank: 5, fullName: 'رضا کریمی', score: 70, correctPredictions: 14, level: 7 },
  { rank: 6, fullName: 'فاطمه نوری', score: 65, correctPredictions: 13, level: 7 },
  { rank: 7, fullName: 'امیر صادقی', score: 60, correctPredictions: 12, level: 6 },
  { rank: 8, fullName: 'زهرا میرزایی', score: 55, correctPredictions: 11, level: 6 },
  { rank: 12, fullName: 'شما', score: 45, correctPredictions: 9, level: 5, isCurrentUser: true },
];

const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', title: 'اولین حدس', description: 'اولین پیش‌بینی را ثبت کنید', icon: '🎯', requiredCount: 1, currentCount: 1, isUnlocked: true, xpReward: 20 },
  { id: 'a2', title: 'فرد دقیق', description: '۵ پیش‌بینی صحیح ثبت کنید', icon: '🏆', requiredCount: 5, currentCount: 5, isUnlocked: true, xpReward: 100 },
  { id: 'a3', title: 'استاد حدس', description: '۱۰ پیش‌بینی صحیح ثبت کنید', icon: '👑', requiredCount: 10, currentCount: 9, isUnlocked: false, xpReward: 250 },
  { id: 'a4', title: '۳ رشته متوالی', description: '۳ پیش‌بینی متوالی صحیح داشته باشید', icon: '🔥', requiredCount: 3, currentCount: 3, isUnlocked: true, xpReward: 150 },
  { id: 'a5', title: '۵ رشته متوالی', description: '۵ پیش‌بینی متوالی صحیح داشته باشید', icon: '💎', requiredCount: 5, currentCount: 2, isUnlocked: false, xpReward: 500 },
  { id: 'a6', title: 'دقت ۹۰٪', description: 'یک پیش‌بینی با دقت بالای ۹۰٪ ثبت کنید', icon: '⭐', requiredCount: 1, currentCount: 1, isUnlocked: true, xpReward: 75 },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getTomorrow(): string {
  const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0];
}

function getTimeRemaining(): string {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const diff = endOfDay.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${formatNumber(hours)} ساعت و ${formatNumber(minutes)} دقیقه`;
}

function hasPendingPrediction(predictions: Prediction[]): boolean {
  const tomorrow = getTomorrow();
  return predictions.some((p) => p.targetDate === tomorrow && p.status === 'pending');
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Streak Flame SVG                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StreakFlame({ streak, best }: { streak: number; best: number }) {
  const height = 60;
  const width = 60;
  const color = streak >= 3 ? '#F97316' : '#94A3B8';
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className="transform">
      <circle cx="30" cy="30" r="26" fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
      <circle cx="30" cy="30" r="26" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(streak / Math.max(best, 5)) * 163} 163`} className="transition-all duration-1000" transform="rotate(-90 30 30)" />
      <text x="30" y="27" textAnchor="middle" className="fill-foreground" style={{ fontSize: '14px', fontWeight: 900 }}>{formatNumber(streak)}</text>
      <text x="30" y="38" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '7px' }}>رشته</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function PricePredictionGamePage() {
  const { user, addToast, goldPrice } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<PredictionStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [predictedPrice, setPredictedPrice] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('predict');
  const [hasPending, setHasPending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining());
  const [revealResult, setRevealResult] = useState<{ predicted: number; actual: number; isCorrect: boolean } | null>(null);
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const price = goldPrice?.marketPrice || 34200000;
      setPredictions(MOCK_PREDICTIONS);
      setStats(MOCK_STATS);
      setLeaderboard(MOCK_LEADERBOARD);
      setCurrentPrice(price);
      setPredictedPrice(price);
      setHasPending(hasPendingPrediction(MOCK_PREDICTIONS));
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [goldPrice?.marketPrice]);

  // Fetch real gold price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/gold/prices');
        const data = await res.json();
        if (data.success && data.prices?.[0]) {
          const price = data.prices[0].buyPrice || data.prices[0].price;
          setCurrentPrice(price);
          setPredictedPrice(price);
        }
      } catch { /* fallback */ }
    };
    fetchPrice();
  }, []);

  // Fetch leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/predictions/leaderboard');
        const data = await res.json();
        if (data.success && data.leaderboard) setLeaderboard(data.leaderboard);
      } catch { /* mock */ }
    };
    fetchLeaderboard();
  }, []);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => { setTimeLeft(getTimeRemaining()); }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    if (!user?.id || hasPending) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, predictedPrice, targetDate: getTomorrow() }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('پیش‌بینی قیمت با موفقیت ثبت شد! 🎯', 'success');
        setPredictions((prev) => [{ id: data.prediction?.id || 'new', predictedPrice, targetDate: getTomorrow(), createdAt: new Date().toISOString(), status: 'pending' }, ...prev]);
        setHasPending(true);
      } else {
        addToast(data.message || 'خطا در ثبت پیش‌بینی', 'error');
      }
    } catch { addToast('خطا در ارتباط با سرور', 'error'); }
    finally { setSubmitting(false); }
  };

  const minPrice = Math.round(currentPrice * 0.92);
  const maxPrice = Math.round(currentPrice * 1.08);
  const priceDiff = predictedPrice - currentPrice;
  const priceDiffPercent = currentPrice > 0 ? ((priceDiff / currentPrice) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3"><Skeleton className="size-10 rounded-xl" /><div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-60" /></div></div>
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/5">
          <Crosshair className="size-5 text-rose-500" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">بازی پیش‌بینی قیمت</h1>
          <p className="text-xs text-muted-foreground">قیمت فردا را حدس بزنید و امتیاز کسب کنید!</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1.5">
          <Zap className="size-3.5 text-rose-500" />
          <span className="text-xs font-bold tabular-nums text-rose-500">{formatNumber(stats?.totalXP || 0)}</span>
          <span className="text-[10px] text-muted-foreground">XP</span>
        </div>
      </div>

      {/* Current Price + Timer */}
      <Card className="overflow-hidden border-rose-300/30">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">قیمت فعلی هر گرم طلا</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{formatToman(currentPrice)}</p>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                {priceDiff >= 0 ? <ArrowUpRight className="size-4 text-emerald-500" /> : <ArrowDownRight className="size-4 text-red-500" />}
                <span className={cn('text-sm font-bold tabular-nums', priceDiff >= 0 ? 'text-emerald-500' : 'text-red-500')}>{priceDiff >= 0 ? '+' : ''}{priceDiffPercent}٪</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                <Timer className="size-3" />
                <span>مهلت: {timeLeft}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: <Target className="size-3.5 text-rose-500" />, label: 'دقت', value: `${formatNumber(stats?.accuracy || 0)}٪` },
          { icon: <Flame className="size-3.5 text-orange-500" />, label: 'رشته فعلی', value: formatNumber(stats?.streak || 0) },
          { icon: <Trophy className="size-3.5 text-amber-500" />, label: 'صحیح', value: formatNumber(stats?.correctCount || 0) },
          { icon: <BarChart3 className="size-3.5 text-emerald-500" />, label: 'کل', value: formatNumber(stats?.totalPredictions || 0) },
        ].map((s, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="flex items-center gap-2 p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10">{s.icon}</div>
              <div>
                <p className="text-[9px] text-muted-foreground">{s.label}</p>
                <p className="text-sm font-bold tabular-nums">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="predict" className="gap-1 text-[10px]"><Target className="size-3" /> پیش‌بینی</TabsTrigger>
          <TabsTrigger value="history" className="gap-1 text-[10px]"><History className="size-3" /> تاریخچه</TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-1 text-[10px]"><Crown className="size-3" /> رده‌بندی</TabsTrigger>
          <TabsTrigger value="achievements" className="gap-1 text-[10px]"><Award className="size-3" /> نشان‌ها</TabsTrigger>
        </TabsList>

        {/* ═══ PREDICT TAB ═══ */}
        <TabsContent value="predict" className="space-y-3">
          {hasPending ? (
            <Card className="overflow-hidden border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="flex flex-col items-center py-8 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle className="size-8 text-emerald-500" />
                </div>
                <h3 className="mt-4 text-base font-bold text-emerald-600">پیش‌بینی امروز ثبت شد!</h3>
                <p className="mt-1 text-sm text-muted-foreground">صبر کنید تا نتیجه فردا مشخص شود</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  <span>مهلت باقی‌مانده: {timeLeft}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden border-rose-300/30">
              <CardContent className="p-5 space-y-5">
                {/* Streak display */}
                {stats && (
                  <div className="flex items-center justify-center gap-4">
                    <StreakFlame streak={stats.streak} best={stats.bestStreak} />
                    <div>
                      <p className="text-xs font-bold text-foreground">رشته فعلی: {formatNumber(stats.streak)}</p>
                      <p className="text-[10px] text-muted-foreground">بهترین رشته: {formatNumber(stats.bestStreak)}</p>
                    </div>
                  </div>
                )}

                {/* Slider */}
                <div className="space-y-4 rounded-xl border border-rose-200/50 bg-rose-50/50 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">قیمت پیش‌بینی شده</span>
                    <span className="text-lg font-bold tabular-nums text-rose-500">{formatToman(predictedPrice)}</span>
                  </div>
                  <Slider value={[predictedPrice]} onValueChange={(v) => setPredictedPrice(v[0])} min={minPrice} max={maxPrice} step={50000} className="py-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatToman(minPrice)}</span>
                    <span className="text-[10px]">↕ کشیده برای تنظیم</span>
                    <span>{formatToman(maxPrice)}</span>
                  </div>
                  {/* Price input for precision */}
                  <div className="flex items-center gap-2">
                    <Input type="number" value={predictedPrice} onChange={(e) => setPredictedPrice(Number(e.target.value))} className="h-9 border-border text-center font-mono text-sm tabular-nums" dir="ltr" />
                    <span className="text-xs text-muted-foreground shrink-0">تومان</span>
                  </div>
                </div>

                {/* Target date + submit */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  <span>هدف: فردا ({formatDate(getTomorrow())})</span>
                </div>

                {/* Accuracy info */}
                <div className="rounded-lg border border-rose-200/30 bg-rose-50/30 p-3">
                  <p className="text-[11px] text-muted-foreground">💡 اگر پیش‌بینی شما در محدوده ±۲٪ قیمت واقعی باشد، <span className="font-bold text-rose-500">۵۰ XP</span> دریافت می‌کنید. مشارکت = ۵ XP.</p>
                </div>

                <Button className="w-full gap-1.5 bg-gradient-to-l from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600" onClick={handleSubmit} disabled={submitting || !user?.id}>
                  {submitting ? <><Loader2 className="size-4 me-2 animate-spin" /> در حال ثبت...</> : <><Target className="size-4 me-2" /> ثبت پیش‌بینی</>}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Animated Reveal Result */}
          {showReveal && revealResult && (
            <Card className={cn('overflow-hidden border-2', revealResult.isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5')}>
              <CardContent className="flex flex-col items-center py-6 text-center">
                <div className={cn('flex size-16 items-center justify-center rounded-full', revealResult.isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20')}>
                  {revealResult.isCorrect ? <Trophy className="size-8 text-emerald-500" /> : <XCircle className="size-8 text-red-500" />}
                </div>
                <h3 className={cn('mt-3 text-base font-bold', revealResult.isCorrect ? 'text-emerald-600' : 'text-red-600')}>
                  {revealResult.isCorrect ? 'تبریک! حدس درست بود! 🎉' : 'متأسفانه اشتباه بود 😞'}
                </h3>
                <div className="mt-3 flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">پیش‌بینی شما</p>
                    <p className="text-sm font-bold tabular-nums">{formatToman(revealResult.predicted)}</p>
                  </div>
                  <span className="text-muted-foreground">vs</span>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">قیمت واقعی</p>
                    <p className="text-sm font-bold tabular-nums">{formatToman(revealResult.actual)}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setShowReveal(false)} className="mt-4 text-xs">بستن</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ HISTORY TAB ═══ */}
        <TabsContent value="history" className="space-y-3">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {predictions.map((pred, idx) => (
              <Card key={pred.id} className="overflow-hidden border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', pred.status === 'correct' ? 'bg-emerald-500/10' : pred.status === 'incorrect' ? 'bg-red-500/10' : 'bg-amber-500/10')}>
                      {pred.status === 'correct' ? <CheckCircle className="size-5 text-emerald-500" /> : pred.status === 'incorrect' ? <XCircle className="size-5 text-red-500" /> : <Clock className="size-5 text-amber-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold tabular-nums">{formatToman(pred.predictedPrice)}</p>
                        <Badge variant="outline" className={cn('text-[10px]', pred.status === 'correct' ? 'border-emerald-300 text-emerald-600' : pred.status === 'incorrect' ? 'border-red-300 text-red-600' : 'border-amber-300 text-amber-600')}>
                          {pred.status === 'correct' ? '✅ درست' : pred.status === 'incorrect' ? '❌ نادرست' : '⏳ در انتظار'}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">هدف: {formatDate(pred.targetDate)}</p>
                    </div>
                    {pred.actualPrice && (
                      <div className="text-left">
                        <p className="text-[10px] text-muted-foreground">واقعی</p>
                        <p className="text-xs font-bold tabular-nums">{formatToman(pred.actualPrice)}</p>
                        {pred.accuracy !== undefined && <p className={cn('text-[10px] font-bold tabular-nums', pred.accuracy >= 98 ? 'text-emerald-500' : 'text-red-400')}>{formatNumber(pred.accuracy)}٪ دقت</p>}
                      </div>
                    )}
                    {pred.xpEarned && pred.xpEarned > 5 && (
                      <Badge className="bg-amber-500/10 text-amber-500 text-[10px] shrink-0">+{pred.xpEarned} XP</Badge>
                    )}
                  </div>
                  {pred.status === 'correct' || pred.status === 'incorrect' ? (
                    <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', pred.status === 'correct' ? 'bg-emerald-500' : 'bg-red-400')} style={{ width: `${pred.accuracy || 0}%` }} />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══ LEADERBOARD TAB ═══ */}
        <TabsContent value="leaderboard" className="space-y-3">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Crown className="size-4 text-amber-500" />
              <CardTitle className="text-sm font-bold">جدول رتبه‌بندی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {leaderboard.map((entry) => (
                <div key={entry.rank} className={cn('flex items-center gap-3 rounded-xl p-3 transition-all', entry.isCurrentUser ? 'border-2 border-rose-300 bg-rose-50/50' : 'border border-border/50 hover:bg-muted/50')}>
                  <div className="flex size-8 shrink-0 items-center justify-center">
                    {entry.rank <= 3 ? (entry.rank === 1 ? <Crown className="size-5 text-yellow-400" /> : <Medal className={cn('size-5', entry.rank === 2 ? 'text-gray-400' : 'text-amber-700')} />) : <span className="text-xs font-bold text-muted-foreground">{formatNumber(entry.rank)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-bold truncate', entry.isCurrentUser ? 'text-rose-500' : '')}>{entry.fullName}</p>
                    <p className="text-[10px] text-muted-foreground">{formatNumber(entry.correctPredictions)} پیش‌بینی درست</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold tabular-nums text-rose-500">{formatNumber(entry.score)}</p>
                    <p className="text-[10px] text-muted-foreground">امتیاز</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ ACHIEVEMENTS TAB ═══ */}
        <TabsContent value="achievements" className="space-y-3">
          {/* Streak Banner */}
          {stats && (
            <Card className="overflow-hidden border-[#D4AF37]/20 bg-gradient-to-l from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <span className="text-3xl">{stats.streak >= 3 ? '🔥' : '💫'}</span>
                    <p className="text-lg font-black tabular-nums text-[#D4AF37]">{formatNumber(stats.streak)}</p>
                    <p className="text-[10px] text-muted-foreground">رشته فعلی</p>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div className="text-center">
                    <span className="text-3xl">🏆</span>
                    <p className="text-lg font-black tabular-nums text-amber-500">{formatNumber(stats.bestStreak)}</p>
                    <p className="text-[10px] text-muted-foreground">بهترین رشته</p>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div className="text-center">
                    <span className="text-3xl">💎</span>
                    <p className="text-lg font-black tabular-nums text-rose-500">{formatNumber(stats.totalXP)}</p>
                    <p className="text-[10px] text-muted-foreground">XP کل</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {MOCK_ACHIEVEMENTS.map((ach) => (
              <Card key={ach.id} className={cn('overflow-hidden transition-all', ach.isUnlocked ? 'border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent' : 'border-border opacity-70')}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl text-2xl', ach.isUnlocked ? 'bg-amber-500/20' : 'bg-muted')}>
                      {ach.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={cn('text-xs font-bold', ach.isUnlocked ? 'text-foreground' : 'text-muted-foreground')}>{ach.title}</p>
                        {ach.isUnlocked && <CheckCircle className="size-3.5 text-emerald-500 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{ach.description}</p>
                      {/* Progress */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-0.5">
                          <span>{formatNumber(ach.currentCount)} / {formatNumber(ach.requiredCount)}</span>
                          <span className="flex items-center gap-0.5"><Zap className="size-2 text-amber-500" />+{ach.xpReward} XP</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all', ach.isUnlocked ? 'bg-amber-500' : 'bg-muted-foreground/30')} style={{ width: `${Math.min((ach.currentCount / ach.requiredCount) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

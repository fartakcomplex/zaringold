
import {useState, useEffect, useCallback} from 'react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {Target, TrendingUp, Trophy, History, Crown, Medal, CheckCircle, XCircle, Loader2, BarChart3, Crosshair, Clock, Flame} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Slider} from '@/components/ui/slider';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Skeleton} from '@/components/ui/skeleton';
import {Separator} from '@/components/ui/separator';
import {useAppStore} from '@/lib/store';
import {formatToman, formatNumber, formatDate, cn} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                        */
/* ═══════════════════════════════════════════════════════════════ */

interface GoldPriceInfo {
  buyPrice: number;
  sellPrice: number;
  marketPrice: number;
  updatedAt: string;
}

interface Prediction {
  id: string;
  predictedPrice: number;
  targetDate: string;
  createdAt: string;
  status: 'pending' | 'correct' | 'incorrect';
  actualPrice?: number;
}

interface LeaderboardEntry {
  rank: number;
  fullName: string;
  score: number;
  correctPredictions: number;
  level: number;
  isCurrentUser?: boolean;
}

interface PredictionStats {
  totalPredictions: number;
  correctCount: number;
  accuracy: number;
  avgError: number;
  bestPrediction: { predictedPrice: number; actualPrice: number; error: number } | null;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Animation Variants                                           */
/* ═══════════════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ═══════════════════════════════════════════════════════════════ */
/*  Mock Data                                                    */
/* ═══════════════════════════════════════════════════════════════ */

const MOCK_PREDICTIONS: Prediction[] = [
  { id: 'p1', predictedPrice: 34200000, targetDate: '2025-01-15', createdAt: '2025-01-10', status: 'correct', actualPrice: 34150000 },
  { id: 'p2', predictedPrice: 33800000, targetDate: '2025-01-14', createdAt: '2025-01-09', status: 'incorrect', actualPrice: 34500000 },
  { id: 'p3', predictedPrice: 34000000, targetDate: '2025-01-13', createdAt: '2025-01-08', status: 'correct', actualPrice: 34050000 },
  { id: 'p4', predictedPrice: 33900000, targetDate: '2025-01-20', createdAt: '2025-01-12', status: 'pending' },
];

const MOCK_STATS: PredictionStats = {
  totalPredictions: 15,
  correctCount: 9,
  accuracy: 60,
  avgError: 1.8,
  bestPrediction: { predictedPrice: 33500000, actualPrice: 33520000, error: 0.06 },
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
  { rank: 12, fullName: 'شما', score: 45, correctPredictions: 9, level: 6, isCurrentUser: true },
];

/* ═══════════════════════════════════════════════════════════════ */
/*  Helper                                                      */
/* ═══════════════════════════════════════════════════════════════ */

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function hasPredictionToday(predictions: Prediction[]): boolean {
  const today = new Date().toISOString().split('T')[0];
  return predictions.some((p) => p.targetDate === today && p.status === 'pending');
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                             */
/* ═══════════════════════════════════════════════════════════════ */

function PredictionSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      <div className="flex flex-col items-center gap-3 py-6">
        <Skeleton className="size-16 rounded-2xl" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-40 rounded-xl" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Component                                                    */
/* ═══════════════════════════════════════════════════════════════ */

export default function PricePredictionGame() {
  const { user, addToast, goldPrice } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<PredictionStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [predictedPrice, setPredictedPrice] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('predict');
  const [hasTodayPrediction, setHasTodayPrediction] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPredictions(MOCK_PREDICTIONS);
      setStats(MOCK_STATS);
      setLeaderboard(MOCK_LEADERBOARD);
      setCurrentPrice(goldPrice?.marketPrice || 34200000);
      setPredictedPrice(goldPrice?.marketPrice || 34200000);
      setHasTodayPrediction(hasPredictionToday(MOCK_PREDICTIONS));
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [goldPrice?.marketPrice]);

  /* ── Fetch real gold prices ── */
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
      } catch {
        // use fallback
      }
    };
    fetchPrice();
  }, []);

  const handleSubmitPrediction = async () => {
    if (!user?.id || hasTodayPrediction) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          predictedPrice,
          targetDate: getTomorrow(),
        }),
      });
      const data = await res.json();

      if (data.success) {
        addToast('پیش‌بینی قیمت با موفقیت ثبت شد! 🎯', 'success');
        setPredictions((prev) => [
          {
            id: data.prediction?.id || 'new',
            predictedPrice,
            targetDate: getTomorrow(),
            createdAt: new Date().toISOString(),
            status: 'pending',
          },
          ...prev,
        ]);
        setHasTodayPrediction(true);
      } else {
        addToast(data.message || 'خطا در ثبت پیش‌بینی', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Fetch leaderboard ── */
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/predictions/leaderboard');
        const data = await res.json();
        if (data.success && data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
      } catch {
        // use mock
      }
    };
    fetchLeaderboard();
  }, []);

  const minPrice = Math.round(currentPrice * 0.9);
  const maxPrice = Math.round(currentPrice * 1.1);
  const priceDiff = predictedPrice - currentPrice;
  const priceDiffPercent = currentPrice > 0 ? ((priceDiff / currentPrice) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PredictionSkeleton />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="mx-auto max-w-4xl space-y-6 pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col items-center gap-3 py-6 text-center">
        <motion.div
          className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/5 border-2 border-rose-500/30"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Crosshair className="size-10 text-rose-500" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-extrabold text-rose-500">پیش‌بینی قیمت طلا</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            قیمت فردا را حدس بزنید و امتیاز کسب کنید
          </p>
        </div>
      </motion.div>

      {/* ── Current Price ── */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-rose-300/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">قیمت فعلی هر گرم طلا</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {formatToman(currentPrice)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className={cn('size-5', priceDiff >= 0 ? 'text-emerald-500' : 'text-red-500')} />
                <span className={cn('text-sm font-bold', priceDiff >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                  {priceDiff >= 0 ? '+' : ''}{priceDiffPercent}٪
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Stats Row ── */}
      {stats && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: <Target className="size-4 text-rose-500" />, label: 'دقت', value: `${formatNumber(stats.accuracy)}٪` },
            { icon: <BarChart3 className="size-4 text-amber-500" />, label: 'میانگین خطا', value: `${formatNumber(stats.avgError)}٪` },
            { icon: <Flame className="size-4 text-orange-500" />, label: 'کل پیش‌بینی', value: formatNumber(stats.totalPredictions) },
            { icon: <Trophy className="size-4 text-amber-500" />, label: 'پیش‌بینی درست', value: formatNumber(stats.correctCount) },
          ].map((s, i) => (
            <Card key={i} className="hover-lift-sm">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10">{s.icon}</div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  <p className="text-sm font-bold tabular-nums">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* ── Main Tabs ── */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-0">
              <TabsList className="w-full sm:w-fit">
                <TabsTrigger value="predict" className="flex-1 gap-1.5 text-xs sm:flex-none">
                  <Target className="size-3.5" />
                  پیش‌بینی جدید
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1 gap-1.5 text-xs sm:flex-none">
                  <History className="size-3.5" />
                  تاریخچه
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="flex-1 gap-1.5 text-xs sm:flex-none">
                  <Crown className="size-3.5" />
                  رده‌بندی
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* ── Predict Tab ── */}
            <TabsContent value="predict">
              <CardContent className="space-y-5 pt-4">
                {hasTodayPrediction ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <CheckCircle className="size-8 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">پیش‌بینی امروز ثبت شد!</h3>
                    <p className="text-sm text-muted-foreground">صبر کنید تا نتیجه فردا مشخص شود</p>
                  </div>
                ) : (
                  <>
                    {/* Slider */}
                    <div className="space-y-4 rounded-xl border border-rose-200/50 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/10 p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">قیمت پیش‌بینی شده</span>
                        <span className="text-lg font-bold tabular-nums text-rose-500">
                          {formatToman(predictedPrice)}
                        </span>
                      </div>
                      <Slider
                        value={[predictedPrice]}
                        onValueChange={(v) => setPredictedPrice(v[0])}
                        min={minPrice}
                        max={maxPrice}
                        step={50000}
                        className="py-2"
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatToman(minPrice)}</span>
                        <span>{formatToman(maxPrice)}</span>
                      </div>
                    </div>

                    {/* Target date info */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="size-4" />
                      <span>هدف: فردا ({formatDate(getTomorrow())})</span>
                    </div>

                    {/* Submit */}
                    <Button
                      className="w-full bg-gradient-to-l from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600"
                      onClick={handleSubmitPrediction}
                      disabled={submitting || !user?.id}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="size-4 me-2 animate-spin" />
                          در حال ثبت...
                        </>
                      ) : (
                        <>
                          <Target className="size-4 me-2" />
                          ثبت پیش‌بینی
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </TabsContent>

            {/* ── History Tab ── */}
            <TabsContent value="history">
              <CardContent className="pt-4">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {predictions.map((pred, idx) => (
                      <motion.div
                        key={pred.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 rounded-xl border border-border/50 p-3 hover:bg-muted/30"
                      >
                        <div className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-lg',
                          pred.status === 'correct' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                          pred.status === 'incorrect' ? 'bg-red-100 dark:bg-red-900/30' :
                          'bg-amber-100 dark:bg-amber-900/30'
                        )}>
                          {pred.status === 'correct' ? (
                            <CheckCircle className="size-4 text-emerald-500" />
                          ) : pred.status === 'incorrect' ? (
                            <XCircle className="size-4 text-red-500" />
                          ) : (
                            <Clock className="size-4 text-amber-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold tabular-nums">{formatToman(pred.predictedPrice)}</p>
                            <Badge variant="outline" className={cn(
                              'text-[10px]',
                              pred.status === 'correct' ? 'border-emerald-300 text-emerald-600' :
                              pred.status === 'incorrect' ? 'border-red-300 text-red-600' :
                              'border-amber-300 text-amber-600'
                            )}>
                              {pred.status === 'correct' ? 'درست' : pred.status === 'incorrect' ? 'نادرست' : 'در انتظار'}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            هدف: {formatDate(pred.targetDate)}
                          </p>
                        </div>
                        {pred.actualPrice && (
                          <div className="text-left">
                            <p className="text-xs text-muted-foreground">واقعی</p>
                            <p className="text-sm font-bold tabular-nums">{formatToman(pred.actualPrice)}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </TabsContent>

            {/* ── Leaderboard Tab ── */}
            <TabsContent value="leaderboard">
              <CardContent className="pt-4">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {leaderboard.map((entry) => (
                    <motion.div
                      key={entry.rank}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'flex items-center gap-3 rounded-xl p-3 transition-all',
                        entry.isCurrentUser
                          ? 'border-2 border-rose-300 bg-rose-50/50 dark:bg-rose-950/20'
                          : 'border border-border/50 hover:bg-muted/50'
                      )}
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center">
                        {entry.rank <= 3 ? (
                          entry.rank === 1 ? <Crown className="size-5 text-yellow-400" /> :
                          <Medal className={cn('size-5', entry.rank === 2 ? 'text-gray-400' : 'text-amber-700')} />
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">{formatNumber(entry.rank)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-bold truncate', entry.isCurrentUser ? 'text-rose-500' : '')}>
                          {entry.fullName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatNumber(entry.correctPredictions)} پیش‌بینی درست
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold tabular-nums text-rose-500">{formatNumber(entry.score)}</p>
                        <p className="text-[10px] text-muted-foreground">امتیاز</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
    </motion.div>
  );
}

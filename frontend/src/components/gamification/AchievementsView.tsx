
import {useState, useEffect} from 'react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Skeleton} from '@/components/ui/skeleton';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import {Trophy, Star, Flame, Crown, Medal, Lock, TrendingUp, CheckCircle, Users, Zap} from 'lucide-react';
import {useAppStore} from '@/lib/store';
import {formatNumber} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                        */
/* ═══════════════════════════════════════════════════════════════ */

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  category: 'trading' | 'social' | 'saving' | 'special';
  earned: boolean;
  earnedDate?: string;
  progress?: number;
  xpReward: number;
}

interface ProfileData {
  xp: number;
  level: number;
  streak: number;
  badgesEarned: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  level: number;
  isCurrentUser?: boolean;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Mock Data                                                    */
/* ═══════════════════════════════════════════════════════════════ */

const MOCK_PROFILE: ProfileData = { xp: 2450, level: 6, streak: 12, badgesEarned: 8 };

const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', icon: '🪙', title: 'اولین خرید', description: 'اولین خرید طلا را انجام دهید', category: 'trading', earned: true, earnedDate: '۱۴۰۳/۰۸/۱۵', xpReward: 50 },
  { id: 'a2', icon: '📊', title: 'معاملهگر حرفه‌ای', description: '۱۰ معامله موفق انجام دهید', category: 'trading', earned: true, earnedDate: '۱۴۰۳/۰۹/۰۱', xpReward: 200 },
  { id: 'a3', icon: '💰', title: 'سرمایه‌گذار بزرگ', description: '۱ کیلوگرم طلا بخرید', category: 'trading', earned: false, progress: 65, xpReward: 500 },
  { id: 'a4', icon: '🎯', title: 'حدس دقیق', description: '۳ پیش‌بینی قیمت درست داشته باشید', category: 'trading', earned: true, earnedDate: '۱۴۰۳/۰۹/۰۵', xpReward: 100 },
  { id: 'a5', icon: '👥', title: 'دعوت‌کننده', description: '۵ دوست را دعوت کنید', category: 'social', earned: true, earnedDate: '۱۴۰۳/۰۸/۲۰', xpReward: 150 },
  { id: 'a6', icon: '💬', title: 'فعال اجتماعی', description: '۲۰ پست در فید اجتماعی بگذارید', category: 'social', earned: false, progress: 40, xpReward: 200 },
  { id: 'a7', icon: '❤️', title: 'محبوب', description: '۱۰۰ لایک روی پست‌هایتان بگیرید', category: 'social', earned: false, progress: 72, xpReward: 250 },
  { id: 'a8', icon: '🏦', title: 'پس‌اندازگر', description: '۳ ماه متوالی پس‌انداز کنید', category: 'saving', earned: true, earnedDate: '۱۴۰۳/۱۰/۰۱', xpReward: 300 },
  { id: 'a9', icon: '🏆', title: 'ناجی طلا', description: '۱ گرم طلا پس‌انداز کنید', category: 'saving', earned: true, earnedDate: '۱۴۰۳/۰۹/۱۵', xpReward: 500 },
  { id: 'a10', icon: '⚡', title: 'چک‌این ۷ روزه', description: '۷ روز متوالی وارد شوید', category: 'special', earned: true, earnedDate: '۱۴۰۳/۰۸/۱۰', xpReward: 100 },
  { id: 'a11', icon: '👑', title: 'افسانه‌ای', description: 'به سطح ۲۰ برسید', category: 'special', earned: false, progress: 30, xpReward: 1000 },
  { id: 'a12', icon: '🌟', title: 'پیشگوی طلایی', description: '۱۰ پیش‌بینی درست داشته باشید', category: 'special', earned: false, progress: 30, xpReward: 750 },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'سارا احمدی', xp: 8420, level: 10 },
  { rank: 2, name: 'محمد رضایی', xp: 7350, level: 9 },
  { rank: 3, name: 'علی محمدی', xp: 6100, level: 8 },
  { rank: 4, name: 'مریم حسینی', xp: 5200, level: 8 },
  { rank: 5, name: 'رضا کریمی', xp: 4800, level: 7 },
  { rank: 6, name: 'فاطمه نوری', xp: 3900, level: 7 },
  { rank: 7, name: 'امیر صادقی', xp: 3200, level: 6 },
  { rank: 8, name: 'زهرا میرزایی', xp: 2800, level: 6 },
  { rank: 9, name: 'حسین قاسمی', xp: 2600, level: 6 },
  { rank: 15, name: 'شما', xp: 2450, level: 6, isCurrentUser: true },
];

/* ═══════════════════════════════════════════════════════════════ */
/*  Helpers                                                      */
/* ═══════════════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function calcLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100;
}

function getLevelTitle(level: number): string {
  if (level >= 15) return 'افسانه‌ای';
  if (level >= 10) return 'حرفه‌ای';
  if (level >= 5) return 'بامزه';
  return 'مبتدی';
}

function getCategoryLabel(cat: string): string {
  const map: Record<string, string> = { all: 'همه', trading: 'معاملات', social: 'اجتماعی', saving: 'پس‌انداز', special: 'ویژه' };
  return map[cat] || cat;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Component                                                    */
/* ═══════════════════════════════════════════════════════════════ */

export default function AchievementsView() {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [category, setCategory] = useState('all');
  const [selectedAch, setSelectedAch] = useState<Achievement | null>(null);
  const [activeTab, setActiveTab] = useState('achievements');

  useEffect(() => {
    const timer = setTimeout(() => {
      setProfile(MOCK_PROFILE);
      setAchievements(MOCK_ACHIEVEMENTS);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const filtered = category === 'all' ? achievements : achievements.filter((a) => a.category === category);
  const currentLevel = profile ? calcLevel(profile.xp) : 1;
  const nextLevelXp = xpForLevel(currentLevel + 1);
  const currentLevelXp = xpForLevel(currentLevel);
  const progressPercent = nextLevelXp > currentLevelXp ? Math.min(100, ((profile?.xp || 0) - currentLevelXp) / (nextLevelXp - currentLevelXp) * 100) : 100;

  /* ── Loading State ── */
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 pb-24">
        <div className="flex flex-col items-center gap-4 py-8">
          <Skeleton className="size-16 rounded-2xl" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="mx-auto max-w-5xl space-y-6 pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ── XP / Level Section ── */}
      <motion.div variants={itemVariants} className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/40 pulse-glow">
          <span className="text-3xl font-black gold-gradient-text">{formatNumber(currentLevel)}</span>
          <span className="absolute -bottom-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-white shadow">
            {getLevelTitle(currentLevel)}
          </span>
        </div>
        <div>
          <h2 className="gold-gradient-text text-2xl font-extrabold">دستاوردها و نشان‌ها</h2>
          <p className="mt-1 text-sm text-muted-foreground">با فعالیت در پلتفرم، XP کسب کنید و سطح خود را بالا ببرید</p>
        </div>
      </motion.div>

      {/* ── Level Progress ── */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-gold/20">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">سطح {formatNumber(currentLevel)} → {formatNumber(currentLevel + 1)}</span>
              <span className="font-bold text-gold">{formatNumber(profile?.xp || 0)} / {formatNumber(nextLevelXp)} XP</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              تا سطح بعدی <span className="font-bold text-gold">{formatNumber(nextLevelXp - (profile?.xp || 0))}</span> XP دیگر نیاز دارید
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Stats Row ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: <Star className="size-4 text-gold" />, label: 'مجموع XP', value: formatNumber(profile?.xp || 0) },
          { icon: <Trophy className="size-4 text-gold" />, label: 'سطح فعلی', value: formatNumber(currentLevel) },
          { icon: <Medal className="size-4 text-gold" />, label: 'نشان‌ها', value: `${formatNumber(profile?.badgesEarned)}/${formatNumber(achievements.length)}` },
          { icon: <Flame className="size-4 text-orange-500" />, label: 'استریک فعلی', value: `${formatNumber(profile?.streak)} روز` },
        ].map((s, i) => (
          <Card key={i} className="border-gold/15 hover-lift-sm">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold/10">{s.icon}</div>
              <div>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="text-sm font-bold tabular-nums">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* ── Main Tabs: Achievements / Leaderboard ── */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-0">
              <TabsList className="w-full sm:w-fit">
                <TabsTrigger value="achievements" className="flex-1 gap-1.5 text-xs sm:flex-none">
                  <Trophy className="size-3.5" />
                  دستاوردها
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="flex-1 gap-1.5 text-xs sm:flex-none">
                  <Crown className="size-3.5" />
                  جدول رتبه‌بندی
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* ── Achievements Tab ── */}
            <TabsContent value="achievements">
              <CardContent className="space-y-4 pt-4">
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  {['all', 'trading', 'social', 'saving', 'special'].map((cat) => (
                    <Button
                      key={cat}
                      size="sm"
                      variant={category === cat ? 'default' : 'outline'}
                      className={category === cat
                        ? 'bg-gold text-white hover:bg-gold/90 text-xs'
                        : 'text-xs border-gold/20 text-muted-foreground hover:text-gold hover:border-gold/40'
                      }
                      onClick={() => setCategory(cat)}
                    >
                      {getCategoryLabel(cat)}
                    </Button>
                  ))}
                </div>

                {/* Achievement Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((ach, idx) => (
                      <motion.div
                        key={ach.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3, delay: idx * 0.04 }}
                        onClick={() => setSelectedAch(ach)}
                        className={`group relative cursor-pointer rounded-xl border-2 p-4 transition-all hover-lift-sm ${
                          ach.earned
                            ? 'border-gold/40 bg-gold/5 shadow-md shadow-gold/10'
                            : 'border-border/50 bg-muted/30 opacity-70 hover:opacity-100'
                        }`}
                      >
                        {ach.earned && (
                          <div className="absolute -top-1.5 -left-1.5 rounded-full bg-gold p-0.5 shadow">
                            <CheckCircle className="size-3 text-white" />
                          </div>
                        )}
                        <div className="flex flex-col items-center gap-2 text-center">
                          <span className={`text-3xl transition-transform ${ach.earned ? 'group-hover:scale-110' : 'grayscale'}`}>
                            {ach.icon}
                          </span>
                          <p className="text-xs font-bold leading-tight">{ach.title}</p>
                          <Badge variant="secondary" className="text-[9px] bg-gold/10 text-gold">
                            +{formatNumber(ach.xpReward)} XP
                          </Badge>
                        </div>
                        {!ach.earned && ach.progress !== undefined && (
                          <div className="mt-2">
                            <div className="mb-1 flex justify-between text-[9px] text-muted-foreground">
                              <span>پیشرفت</span>
                              <span className="font-bold text-gold">{ach.progress}%</span>
                            </div>
                            <Progress value={ach.progress} className="h-1.5" />
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
                  {MOCK_LEADERBOARD.map((entry) => (
                    <motion.div
                      key={entry.rank}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
                        entry.isCurrentUser
                          ? 'border-2 border-gold/40 bg-gold/5'
                          : 'border border-border/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center">
                        {entry.rank <= 3 ? (
                          entry.rank === 1 ? <Crown className="size-5 text-yellow-400" /> :
                          <Medal className={`size-5 ${entry.rank === 2 ? 'text-gray-400' : 'text-amber-700'}`} />
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">{formatNumber(entry.rank)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${entry.isCurrentUser ? 'text-gold' : ''}`}>
                          {entry.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">سطح {formatNumber(entry.level)}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold tabular-nums text-gold">{formatNumber(entry.xp)}</p>
                        <p className="text-[10px] text-muted-foreground">XP</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>

      {/* ── Achievement Detail Dialog ── */}
      <Dialog open={!!selectedAch} onOpenChange={() => setSelectedAch(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedAch && (
            <>
              <DialogHeader className="text-center">
                <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-gold/10 border border-gold/20 mb-3">
                  <span className={`text-5xl ${selectedAch.earned ? '' : 'grayscale'}`}>{selectedAch.icon}</span>
                </div>
                <DialogTitle className="text-lg">{selectedAch.title}</DialogTitle>
                <DialogDescription>{selectedAch.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between rounded-lg bg-gold/5 border border-gold/10 p-3">
                  <div className="flex items-center gap-2">
                    <Star className="size-4 text-gold" />
                    <span className="text-sm font-medium">پاداش XP</span>
                  </div>
                  <Badge className="bg-gold text-white">+{formatNumber(selectedAch.xpReward)}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <span className="text-sm text-muted-foreground">دسته‌بندی</span>
                  <Badge variant="secondary">{getCategoryLabel(selectedAch.category)}</Badge>
                </div>
                {selectedAch.earned ? (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                    <CheckCircle className="size-4 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">کسب شده!</p>
                      <p className="text-[10px] text-muted-foreground">{selectedAch.earnedDate}</p>
                    </div>
                  </div>
                ) : selectedAch.progress !== undefined ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">پیشرفت</span>
                      <span className="font-bold text-gold">{selectedAch.progress}%</span>
                    </div>
                    <Progress value={selectedAch.progress} className="h-2.5" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                    <Lock className="size-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">هنوز قفل شده است</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

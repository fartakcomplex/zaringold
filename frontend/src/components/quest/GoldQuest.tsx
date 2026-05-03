
/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Gold Quest — Premium Gamified Mission System                                 */
/*  A comprehensive, gamified quest component with 7 tabs                        */
/*  Persian RTL text with English comments                                       */
/* ═══════════════════════════════════════════════════════════════════════════════ */

import {useState, useEffect, useMemo, useCallback} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Skeleton} from '@/components/ui/skeleton';
import {Separator} from '@/components/ui/separator';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {BookOpen, Compass, Search, Calculator, Flame, Share2, UserCheck, GraduationCap, Trophy, Medal, Crown, Star, Lock, Gift, Zap, TrendingUp, Target, Calendar, Clock, Coins, Award, ChevronLeft, ChevronRight, CheckCircle, CircleDot, Sparkles, Gem, Shield, ArrowRight, Play, Eye, Filter, RefreshCw, BarChart3, Heart, ArrowUpRight, Users, XCircle, AlertCircle, FlameKindling} from 'lucide-react';
import {useAppStore} from '@/lib/store';
import {useTranslation} from '@/lib/i18n';
import {useQuickAction} from '@/hooks/useQuickAction';
import {formatNumber} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Types & Interfaces                                                         */
/* ═══════════════════════════════════════════════════════════════════════════════ */

/* Mission status types */
type MissionStatus = 'available' | 'in_progress' | 'completed' | 'claimed';

/* Mission type for icon mapping */
type MissionType = 'content' | 'explore' | 'search' | 'tool' | 'daily_return' | 'social_share' | 'profile' | 'learning';

/* Daily mission interface */
interface DailyMission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  rewardXP: number;
  rewardGold: number;
  steps: number;
  stepsCompleted: number;
  status: MissionStatus;
}

/* Weekly mission extends daily with extra fields */
interface WeeklyMission extends DailyMission {
  dayOfWeek: number;
  bonusReward: number;
  isBonus: boolean;
}

/* Learning lesson interface */
interface Lesson {
  id: string;
  number: number;
  title: string;
  description: string;
  duration: string;
  rewardXP: number;
  rewardGold: number;
  isCompleted: boolean;
  isUnlocked: boolean;
}

/* Badge interface */
interface QuestBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  isUnlocked: boolean;
  earnedDate?: string;
  requirement: string;
}

/* Leaderboard entry */
interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  level: number;
  xpFromQuests: number;
  missionsCompleted: number;
  goldEarned: number;
  isCurrentUser: boolean;
}

/* Streak data */
interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastCheckIn: string;
  checkedInToday: boolean;
  calendar: boolean[];
}

/* Streak milestone */
interface StreakMilestone {
  day: number;
  multiplier: number;
  reward: string;
  color: string;
  glow: string;
}

/* Reward history entry */
interface RewardEntry {
  id: string;
  date: string;
  source: string;
  sourceType: string;
  gold: number;
  xp: number;
  multiplier: number;
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Mission Type Icon Map                                                       */
/* ═══════════════════════════════════════════════════════════════════════════════ */

/* Map mission types to their respective lucide icons */
const MISSION_TYPE_ICONS: Record<MissionType, typeof BookOpen> = {
  content: BookOpen,
  explore: Compass,
  search: Search,
  tool: Calculator,
  daily_return: Flame,
  social_share: Share2,
  profile: UserCheck,
  learning: GraduationCap,
};

/* Mission type background colors */
const MISSION_TYPE_COLORS: Record<MissionType, { bg: string; text: string }> = {
  content: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  explore: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  search: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400' },
  tool: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  daily_return: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
  social_share: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400' },
  profile: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400' },
  learning: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
};

/* Status badge config */
const STATUS_CONFIG: Record<MissionStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  available: { label: 'آماده', color: 'text-sky-600', bg: 'bg-sky-100 dark:bg-sky-900/30', icon: CircleDot },
  in_progress: { label: 'در حال انجام', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: Clock },
  completed: { label: 'تکمیل شده', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle },
  claimed: { label: 'دریافت شده', color: 'text-[#D4AF37]', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: Award },
};

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Animation Variants                                                          */
/* ═══════════════════════════════════════════════════════════════════════════════ */

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

const slideInRight: any = {
  hidden: { opacity: 0, x: 30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Gold theme constant                                                         */
/* ═══════════════════════════════════════════════════════════════════════════════ */

const GOLD = '#D4AF37';
const GOLD_LIGHT = '#FFD700';
const GOLD_DARK = '#B8960C';

/* Streak milestones */
const STREAK_MILESTONES: StreakMilestone[] = [
  { day: 3, multiplier: 1.5, reward: '۱.۵ برابری پاداش', color: 'text-green-500', glow: '' },
  { day: 7, multiplier: 2, reward: '۲ برابری پاداش + جعبه شانس', color: 'text-blue-500', glow: '' },
  { day: 14, multiplier: 3, reward: '۳ برابری + نشان ویژه', color: 'text-purple-500', glow: 'shadow-purple-400/30' },
  { day: 30, multiplier: 5, reward: '۵ برابری + پاداش پریمیوم', color: 'text-[#D4AF37]', glow: 'shadow-[#D4AF37]/40' },
];

/* Persian day names for weekly calendar */
const WEEK_DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Mock Data — Comprehensive fallback when API is unavailable                  */
/* ═══════════════════════════════════════════════════════════════════════════════ */

const MOCK_DAILY_MISSIONS: DailyMission[] = [
  { id: 'dm1', type: 'content', title: 'خواندن مقاله طلا', description: 'یک مقاله آموزشی درباره طلا بخوانید', rewardXP: 50, rewardGold: 2, steps: 1, stepsCompleted: 1, status: 'completed' },
  { id: 'dm2', type: 'explore', title: 'کاوش در بخش بازار', description: 'بخش تحلیل بازار را مرور کنید', rewardXP: 30, rewardGold: 1.5, steps: 3, stepsCompleted: 2, status: 'in_progress' },
  { id: 'dm3', type: 'search', title: 'جستجوی قیمت طلا', description: 'قیمت لحظه‌ای طلا را جستجو کنید', rewardXP: 20, rewardGold: 1, steps: 1, stepsCompleted: 0, status: 'available' },
  { id: 'dm4', type: 'tool', title: 'استفاده از محاسبهگر', description: 'محاسبهگر قیمت طلا را استفاده کنید', rewardXP: 40, rewardGold: 2.5, steps: 2, stepsCompleted: 0, status: 'available' },
  { id: 'dm5', type: 'daily_return', title: 'ورود روزانه', description: 'امروز وارد اپلیکیشن شوید', rewardXP: 10, rewardGold: 0.5, steps: 1, stepsCompleted: 1, status: 'claimed' },
  { id: 'dm6', type: 'social_share', title: 'اشتراک‌گذاری در شبکه اجتماعی', description: 'زرین گلد را در شبکه اجتماعی به اشتراک بگذارید', rewardXP: 60, rewardGold: 3, steps: 1, stepsCompleted: 0, status: 'available' },
  { id: 'dm7', type: 'profile', title: 'تکمیل پروفایل', description: 'اطلاعات پروفایل خود را تکمیل کنید', rewardXP: 80, rewardGold: 5, steps: 4, stepsCompleted: 3, status: 'in_progress' },
  { id: 'dm8', type: 'learning', title: 'تمرین آموزشی', description: 'درس اول دوره آموزشی را ببینید', rewardXP: 100, rewardGold: 8, steps: 1, stepsCompleted: 1, status: 'completed' },
];

const MOCK_WEEKLY_MISSIONS: WeeklyMission[] = [
  { id: 'wm1', type: 'content', title: 'خواندن ۳ مقاله', description: 'در طول هفته ۳ مقاله بخوانید', rewardXP: 200, rewardGold: 15, steps: 3, stepsCompleted: 3, status: 'completed', dayOfWeek: 0, bonusReward: 5, isBonus: false },
  { id: 'wm2', type: 'tool', title: '۵ محاسبه قیمت', description: 'محاسبهگر را ۵ بار استفاده کنید', rewardXP: 150, rewardGold: 10, steps: 5, stepsCompleted: 4, status: 'in_progress', dayOfWeek: 1, bonusReward: 3, isBonus: false },
  { id: 'wm3', type: 'explore', title: 'کاوش در ۵ بخش', description: '۵ بخش مختلف اپلیکیشن را کاوش کنید', rewardXP: 180, rewardGold: 12, steps: 5, stepsCompleted: 2, status: 'in_progress', dayOfWeek: 2, bonusReward: 4, isBonus: false },
  { id: 'wm4', type: 'social_share', title: '۳ اشتراک‌گذاری', description: 'محتوا را ۳ بار به اشتراک بگذارید', rewardXP: 250, rewardGold: 20, steps: 3, stepsCompleted: 0, status: 'available', dayOfWeek: 3, bonusReward: 8, isBonus: true },
  { id: 'wm5', type: 'learning', title: 'تکمیل ۲ درس', description: 'دو درس از دوره آموزشی را ببینید', rewardXP: 300, rewardGold: 25, steps: 2, stepsCompleted: 0, status: 'available', dayOfWeek: 4, bonusReward: 10, isBonus: true },
  { id: 'wm6', type: 'profile', title: 'دعوت از دوست', description: 'یک دوست را به زرین گلد دعوت کنید', rewardXP: 400, rewardGold: 30, steps: 1, stepsCompleted: 0, status: 'available', dayOfWeek: 5, bonusReward: 15, isBonus: true },
  { id: 'wm7', type: 'search', title: '۱۰ جستجو', description: '۱۰ جستجوی مختلف انجام دهید', rewardXP: 100, rewardGold: 8, steps: 10, stepsCompleted: 7, status: 'in_progress', dayOfWeek: 6, bonusReward: 2, isBonus: false },
];

const MOCK_LESSONS: Lesson[] = [
  { id: 'l1', number: 1, title: 'طلا چیست و چرا سرمایه‌گذاری کنیم؟', description: 'آشنایی با ماهیت طلا، تاریخچه سرمایه‌گذاری در طلا و دلایل اهمیت آن در سبد سرمایه‌گذاری.', duration: '۱۵ دقیقه', rewardXP: 150, rewardGold: 10, isCompleted: true, isUnlocked: true },
  { id: 'l2', number: 2, title: 'تورم چگونه سرمایه شما را می‌خورد؟', description: 'بررسی تأثیر تورم بر ارزش پول، مقایسه بازدهی طلا با سایر دارایی‌ها و استراتژی مقابله با تورم.', duration: '۲۰ دقیقه', rewardXP: 200, rewardGold: 15, isCompleted: true, isUnlocked: true },
  { id: 'l3', number: 3, title: 'چگونه ماهانه پس‌انداز کنیم؟', description: 'تکنیک‌های پس‌انداز ماهانه، خرید خودکار طلا و ساخت برنامه مالی شخصی.', duration: '۲۵ دقیقه', rewardXP: 250, rewardGold: 20, isCompleted: false, isUnlocked: true },
  { id: 'l4', number: 4, title: 'راهنمای خرید امن طلا', description: 'نکات امنیتی خرید آنلاین طلا، تشخیص قیمت واقعی و جلوگیری از کلاهبرداری.', duration: '۳۰ دقیقه', rewardXP: 300, rewardGold: 25, isCompleted: false, isUnlocked: false },
];

const MOCK_BADGES: QuestBadge[] = [
  { id: 'b1', name: 'اولین مأموریت', icon: '🏆', description: 'اولین مأموریت خود را کامل کنید', isUnlocked: true, earnedDate: '۱۴۰۳/۰۸/۱۵', requirement: 'تکمیل ۱ مأموریت' },
  { id: 'b2', name: 'خواننده برنزی', icon: '📖', description: '۳ مقاله آموزشی بخوانید', isUnlocked: true, earnedDate: '۱۴۰۳/۰۸/۲۰', requirement: 'خواندن ۳ مقاله' },
  { id: 'b3', name: 'خواننده نقره‌ای', icon: '📚', description: '۱۰ مقاله آموزشی بخوانید', isUnlocked: false, requirement: 'خواندن ۱۰ مقاله' },
  { id: 'b4', name: 'استاد جستجو', icon: '🔍', description: '۲۰ جستجو در اپلیکیشن انجام دهید', isUnlocked: true, earnedDate: '۱۴۰۳/۰۹/۰۵', requirement: '۲۰ جستجو' },
  { id: 'b5', name: 'کاربر وفادار', icon: '❤️', description: '۷ روز متوالی وارد شوید', isUnlocked: true, earnedDate: '۱۴۰۳/۰۹/۱۰', requirement: '۷ روز متوالی' },
  { id: 'b6', name: 'دانشمند طلایی', icon: '🎓', description: 'همه ۴ درس آموزشی را ببینید', isUnlocked: false, requirement: 'تکمیل ۴ درس' },
  { id: 'b7', name: 'افسانه کاوشگر SEO', icon: '🦅', description: '۵۰ جستجو انجام دهید', isUnlocked: false, requirement: '۵۰ جستجو' },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'محمد رضایی', avatar: '', level: 12, xpFromQuests: 18500, missionsCompleted: 156, goldEarned: 580, isCurrentUser: false },
  { rank: 2, name: 'سارا احمدی', avatar: '', level: 10, xpFromQuests: 15200, missionsCompleted: 134, goldEarned: 420, isCurrentUser: true },
  { rank: 3, name: 'علی محمدی', avatar: '', level: 9, xpFromQuests: 12800, missionsCompleted: 112, goldEarned: 340, isCurrentUser: false },
  { rank: 4, name: 'مریم حسینی', avatar: '', level: 8, xpFromQuests: 10500, missionsCompleted: 98, goldEarned: 285, isCurrentUser: false },
  { rank: 5, name: 'رضا کریمی', avatar: '', level: 7, xpFromQuests: 8900, missionsCompleted: 85, goldEarned: 230, isCurrentUser: false },
  { rank: 6, name: 'فاطمه نوری', avatar: '', level: 7, xpFromQuests: 8200, missionsCompleted: 78, goldEarned: 210, isCurrentUser: false },
  { rank: 7, name: 'امیر صادقی', avatar: '', level: 6, xpFromQuests: 7100, missionsCompleted: 65, goldEarned: 185, isCurrentUser: false },
  { rank: 8, name: 'زهرا میرزایی', avatar: '', level: 6, xpFromQuests: 6500, missionsCompleted: 58, goldEarned: 160, isCurrentUser: false },
  { rank: 9, name: 'حسین قاسمی', avatar: '', level: 5, xpFromQuests: 5800, missionsCompleted: 50, goldEarned: 135, isCurrentUser: false },
  { rank: 10, name: 'نرگس عابدی', avatar: '', level: 5, xpFromQuests: 5200, missionsCompleted: 45, goldEarned: 120, isCurrentUser: false },
  { rank: 11, name: 'مهدی تقوی', avatar: '', level: 4, xpFromQuests: 4600, missionsCompleted: 40, goldEarned: 105, isCurrentUser: false },
  { rank: 12, name: 'لیلا صالحی', avatar: '', level: 4, xpFromQuests: 4000, missionsCompleted: 35, goldEarned: 90, isCurrentUser: false },
  { rank: 13, name: 'پویا شریفی', avatar: '', level: 3, xpFromQuests: 3500, missionsCompleted: 30, goldEarned: 78, isCurrentUser: false },
  { rank: 14, name: 'سمیرا کاظمی', avatar: '', level: 3, xpFromQuests: 3000, missionsCompleted: 26, goldEarned: 65, isCurrentUser: false },
  { rank: 15, name: 'بهنام طاهری', avatar: '', level: 3, xpFromQuests: 2600, missionsCompleted: 22, goldEarned: 55, isCurrentUser: false },
  { rank: 16, name: 'مهسا رحیمی', avatar: '', level: 2, xpFromQuests: 2200, missionsCompleted: 18, goldEarned: 45, isCurrentUser: false },
  { rank: 17, name: 'احسان نوری', avatar: '', level: 2, xpFromQuests: 1800, missionsCompleted: 15, goldEarned: 38, isCurrentUser: false },
  { rank: 18, name: 'ندا جعفری', avatar: '', level: 2, xpFromQuests: 1400, missionsCompleted: 12, goldEarned: 30, isCurrentUser: false },
  { rank: 19, name: 'کیانا مختاری', avatar: '', level: 1, xpFromQuests: 1000, missionsCompleted: 8, goldEarned: 22, isCurrentUser: false },
  { rank: 20, name: 'آرش حسینی', avatar: '', level: 1, xpFromQuests: 600, missionsCompleted: 5, goldEarned: 15, isCurrentUser: false },
];

/* Generate 30-day streak calendar (last 30 days) */
function generateStreakCalendar(): boolean[] {
  const calendar: boolean[] = [];
  /* Last 30 days: mark some as checked in, some not */
  const pattern = [true, true, true, false, true, true, true, true, true, false,
    true, true, true, true, false, false, true, true, true, true,
    true, true, false, true, true, true, true, true, false, true];
  return pattern;
}

const MOCK_STREAK: StreakData = {
  currentStreak: 12,
  bestStreak: 28,
  lastCheckIn: '۱۴۰۳/۱۰/۱۲',
  checkedInToday: false,
  calendar: generateStreakCalendar(),
};

const MOCK_REWARD_HISTORY: RewardEntry[] = [
  { id: 'rh1', date: '۱۴۰۳/۱۰/۱۲', source: 'خواندن مقاله طلا', sourceType: 'content', gold: 2, xp: 50, multiplier: 1.5 },
  { id: 'rh2', date: '۱۴۰۳/۱۰/۱۲', source: 'ورود روزانه', sourceType: 'daily_return', gold: 0.5, xp: 10, multiplier: 1.5 },
  { id: 'rh3', date: '۱۴۰۳/۱۰/۱۱', source: 'کاوش در بخش بازار', sourceType: 'explore', gold: 1.5, xp: 30, multiplier: 1 },
  { id: 'rh4', date: '۱۴۰۳/۱۰/۱۱', source: 'استفاده از محاسبهگر', sourceType: 'tool', gold: 2.5, xp: 40, multiplier: 1 },
  { id: 'rh5', date: '۱۴۰۳/۱۰/۱۰', source: 'درس اول آموزشی', sourceType: 'learning', gold: 10, xp: 150, multiplier: 2 },
  { id: 'rh6', date: '۱۴۰۳/۱۰/۱۰', source: 'اشتراک‌گذاری', sourceType: 'social_share', gold: 3, xp: 60, multiplier: 2 },
  { id: 'rh7', date: '۱۴۰۳/۱۰/۰۹', source: 'خواندن مقاله تورم', sourceType: 'content', gold: 2, xp: 50, multiplier: 1 },
  { id: 'rh8', date: '۱۴۰۳/۱۰/۰۹', source: 'جستجوی قیمت', sourceType: 'search', gold: 1, xp: 20, multiplier: 1 },
  { id: 'rh9', date: '۱۴۰۳/۱۰/۰۸', source: 'تکمیل پروفایل', sourceType: 'profile', gold: 5, xp: 80, multiplier: 1 },
  { id: 'rh10', date: '۱۴۰۳/۱۰/۰۸', source: 'درس دوم آموزشی', sourceType: 'learning', gold: 15, xp: 200, multiplier: 1 },
  { id: 'rh11', date: '۱۴۰۳/۱۰/۰۷', source: 'ورود روزانه', sourceType: 'daily_return', gold: 0.5, xp: 10, multiplier: 3 },
  { id: 'rh12', date: '۱۴۰۳/۱۰/۰۶', source: 'خواندن ۳ مقاله (هفتگی)', sourceType: 'content', gold: 15, xp: 200, multiplier: 1 },
];

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Helper Functions                                                           */
/* ═══════════════════════════════════════════════════════════════════════════════ */

/** Get the current multiplier based on streak */
function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 5;
  if (streak >= 14) return 3;
  if (streak >= 7) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

/** Get multiplier color class */
function getMultiplierColor(multiplier: number): string {
  if (multiplier >= 5) return 'text-[#D4AF37]';
  if (multiplier >= 3) return 'text-purple-500';
  if (multiplier >= 2) return 'text-blue-500';
  if (multiplier >= 1.5) return 'text-green-500';
  return 'text-gray-400';
}

/** Get multiplier glow class */
function getMultiplierGlow(multiplier: number): string {
  if (multiplier >= 5) return 'shadow-[0_0_20px_rgba(212,175,55,0.5)]';
  return '';
}

/** Get rank medal display for leaderboard */
function getRankDisplay(rank: number) {
  if (rank === 1) return <Crown className="size-6 text-yellow-400 drop-shadow-lg" />;
  if (rank === 2) return <Medal className="size-5 text-gray-400" />;
  if (rank === 3) return <Medal className="size-5 text-amber-700" />;
  return <span className="text-sm font-bold text-muted-foreground w-6 text-center">{formatNumber(rank)}</span>;
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  CSS Keyframe Styles (injected via style tag)                                */
/* ═══════════════════════════════════════════════════════════════════════════════ */

/* Confetti animation for claiming rewards */
const CONFETTI_STYLE = `
@keyframes quest-confetti {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(-80px) rotate(720deg); opacity: 0; }
}
@keyframes quest-flame-pulse {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.15); filter: brightness(1.3); }
}
@keyframes quest-glow-ring {
  0%, 100% { box-shadow: 0 0 5px rgba(212,175,55,0.3); }
  50% { box-shadow: 0 0 20px rgba(212,175,55,0.6), 0 0 40px rgba(212,175,55,0.2); }
}
@keyframes quest-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes quest-shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes quest-progress-fill {
  from { width: 0%; }
}
@keyframes quest-streak-dot-pop {
  0% { transform: scale(0); }
  60% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
.quest-confetti-piece {
  animation: quest-confetti 1s ease-out forwards;
  position: absolute;
  width: 8px;
  height: 8px;
  background: ${GOLD};
  border-radius: 1px;
}
.quest-flame-pulse {
  animation: quest-flame-pulse 2s ease-in-out infinite;
}
.quest-glow-ring {
  animation: quest-glow-ring 2s ease-in-out infinite;
}
.quest-float {
  animation: quest-float 3s ease-in-out infinite;
}
.quest-shimmer {
  background: linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent);
  background-size: 200% 100%;
  animation: quest-shimmer 3s linear infinite;
}
.quest-streak-dot-pop {
  animation: quest-streak-dot-pop 0.4s ease-out;
}
`;

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeleton Component                                                 */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function GoldQuestSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24 px-4">
      {/* Header skeleton */}
      <div className="flex flex-col items-center gap-4 py-6">
        <Skeleton className="size-16 rounded-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      {/* Tabs skeleton */}
      <Skeleton className="h-12 w-full rounded-xl" />
      {/* Content skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Progress Ring Component (SVG-based)                                         */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  color = GOLD,
  children,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
          opacity={0.2}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Confetti Effect Component                                                   */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function ConfettiEffect({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl z-10">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="quest-confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${40 + Math.random() * 40}%`,
            animationDelay: `${Math.random() * 0.3}s`,
            background: i % 3 === 0 ? GOLD : i % 3 === 1 ? GOLD_LIGHT : '#FFF8DC',
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 1: Today's Missions                                                    */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function TodaysMissionsTab({ missions }: { missions: DailyMission[] }) {
  const addToast = useAppStore((s) => s.addToast);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [confettiId, setConfettiId] = useState<string | null>(null);

  /* Calculate daily progress */
  const completedCount = missions.filter((m) => m.status === 'completed' || m.status === 'claimed').length;
  const totalCount = missions.length;
  const totalGold = missions.reduce((s, m) => s + m.rewardGold, 0);
  const totalXP = missions.reduce((s, m) => s + m.rewardXP, 0);
  const progressPercent = (completedCount / totalCount) * 100;

  /* Handle mission action */
  const handleMissionAction = (mission: DailyMission) => {
    if (mission.status === 'available') {
      addToast(`مأموریت "${mission.title}" شروع شد!`, 'info');
    } else if (mission.status === 'completed') {
      /* Claim reward with confetti */
      setClaimingId(mission.id);
      setConfettiId(mission.id);
      setTimeout(() => setConfettiId(null), 1200);
      setTimeout(() => {
        setClaimingId(null);
        addToast(`پاداش ${mission.rewardGold} mg طلا و ${mission.rewardXP} XP دریافت شد!`, 'success');
      }, 800);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Daily Progress Summary */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/5 to-transparent overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Progress Ring */}
              <ProgressRing progress={progressPercent} size={100} strokeWidth={8} color={GOLD}>
                <div className="text-center">
                  <span className="text-2xl font-black text-[#D4AF37]">{formatNumber(completedCount)}</span>
                  <span className="text-sm text-muted-foreground">/{formatNumber(totalCount)}</span>
                </div>
              </ProgressRing>

              {/* Summary Info */}
              <div className="flex-1 text-center sm:text-right">
                <h3 className="text-lg font-bold mb-1">پیشرفت روزانه</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {completedCount === totalCount
                    ? '🎉 همه مأموریت‌های امروز تکمیل شده‌اند!'
                    : `${formatNumber(totalCount - completedCount)} مأموریت دیگر باقی‌مانده`}
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                  <div className="flex items-center gap-1.5">
                    <Coins className="size-4 text-[#D4AF37]" />
                    <span className="text-sm font-bold text-[#D4AF37]">{formatNumber(totalGold)} mg</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="size-4 text-amber-500" />
                    <span className="text-sm font-bold text-amber-500">{formatNumber(totalXP)} XP</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Missions Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {missions.map((mission, idx) => {
          const IconComponent = MISSION_TYPE_ICONS[mission.type];
          const typeColor = MISSION_TYPE_COLORS[mission.type];
          const statusCfg = STATUS_CONFIG[mission.status];
          const progress = mission.steps > 0 ? (mission.stepsCompleted / mission.steps) * 100 : 0;

          return (
            <motion.div
              key={mission.id}
              variants={itemVariants}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`relative overflow-hidden h-full transition-all hover:shadow-lg ${
                mission.status === 'completed' ? 'border-2 border-emerald-400/50 quest-glow-ring' :
                mission.status === 'claimed' ? 'border-2 border-[#D4AF37]/30 opacity-75' :
                'border border-border/60 hover:border-[#D4AF37]/30'
              }`}>
                {/* Confetti effect on claim */}
                <ConfettiEffect show={confettiId === mission.id} />

                <CardContent className="p-4 space-y-3">
                  {/* Header: Icon + Title + Status Badge */}
                  <div className="flex items-start gap-3">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${typeColor.bg}`}>
                      <IconComponent className={`size-5 ${typeColor.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold leading-tight truncate">{mission.title}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{mission.description}</p>
                    </div>
                  </div>

                  {/* Progress Bar (multi-step missions) */}
                  {mission.steps > 1 && (
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                        <span>مرحله {formatNumber(mission.stepsCompleted)} از {formatNumber(mission.steps)}</span>
                        <span>{Math.round(progress)}٪</span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-[#D4AF37] to-[#FFD700]"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Reward + Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-[11px] text-[#D4AF37] font-bold">
                              <Coins className="size-3" />
                              {formatNumber(mission.rewardGold)} mg
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>پاداش طلا</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                              <Star className="size-3" />
                              {formatNumber(mission.rewardXP)} XP
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>پاداش تجربه</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Badge className={`${statusCfg.bg} ${statusCfg.color} text-[10px] border-0 gap-1`}>
                      {statusCfg.label}
                    </Badge>
                  </div>

                  {/* Action Button */}
                  {(mission.status === 'available' || mission.status === 'completed') && (
                    <Button
                      size="sm"
                      className={`w-full text-xs font-bold ${
                        mission.status === 'completed'
                          ? 'bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white hover:from-[#D4AF37]/90 hover:to-[#FFD700]/90 shadow-md shadow-[#D4AF37]/20'
                          : 'border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10'
                      }`}
                      onClick={() => handleMissionAction(mission)}
                      disabled={claimingId === mission.id}
                    >
                      {claimingId === mission.id ? (
                        <span className="flex items-center gap-1.5">
                          <RefreshCw className="size-3 animate-spin" />
                          در حال دریافت...
                        </span>
                      ) : mission.status === 'completed' ? (
                        <span className="flex items-center gap-1.5">
                          <Gift className="size-3" />
                          دریافت پاداش
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <ArrowRight className="size-3" />
                          شروع مأموریت
                        </span>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 2: Weekly Missions                                                     */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function WeeklyMissionsTab({ missions }: { missions: WeeklyMission[] }) {
  /* Weekly calendar: mark which days have completed missions */
  const dayCompleted = WEEK_DAYS.map((_, idx) =>
    missions.some((m) => m.dayOfWeek === idx && (m.status === 'completed' || m.status === 'claimed'))
  );

  const completedWeekly = missions.filter((m) => m.status === 'completed' || m.status === 'claimed').length;
  const totalWeekly = missions.length;
  const weeklyProgress = (completedWeekly / totalWeekly) * 100;

  /* Check if all weekly missions done for bonus */
  const allCompleted = completedWeekly === totalWeekly;
  const totalBonusGold = missions.reduce((s, m) => s + m.bonusReward, 0);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Weekly Progress Card */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 border-[#D4AF37]/30 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ProgressRing progress={weeklyProgress} size={100} strokeWidth={8} color={GOLD}>
                <div className="text-center">
                  <span className="text-xl font-black text-[#D4AF37]">{formatNumber(completedWeekly)}</span>
                  <span className="text-sm text-muted-foreground">/{formatNumber(totalWeekly)}</span>
                </div>
              </ProgressRing>
              <div className="flex-1 text-center sm:text-right">
                <h3 className="text-lg font-bold mb-1">پیشرفت هفتگی</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {allCompleted
                    ? '🎉 همه مأموریت‌های هفتگی تکمیل شد! پاداش ویژه فعال است.'
                    : `${formatNumber(totalWeekly - completedWeekly)} مأموریت هفتگی باقی‌مانده`}
                </p>
                {allCompleted && (
                  <Badge className="bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white border-0 text-xs gap-1.5">
                    <Gift className="size-3" />
                    پاداش ویژه: {formatNumber(totalBonusGold)} mg طلا
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Calendar Strip */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-bold mb-3">تقویم هفتگی</h4>
            <div className="grid grid-cols-7 gap-2">
              {WEEK_DAYS.map((day, idx) => (
                <div key={day} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-medium">{day}</span>
                  <div
                    className={`flex size-10 items-center justify-center rounded-full transition-all ${
                      dayCompleted[idx]
                        ? 'bg-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/30'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {dayCompleted[idx] ? (
                      <CheckCircle className="size-5" />
                    ) : (
                      <CircleDot className="size-5 opacity-40" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Missions List */}
      <div className="space-y-3">
        {missions.map((mission, idx) => {
          const IconComponent = MISSION_TYPE_ICONS[mission.type];
          const typeColor = MISSION_TYPE_COLORS[mission.type];
          const statusCfg = STATUS_CONFIG[mission.status];
          const progress = mission.steps > 0 ? (mission.stepsCompleted / mission.steps) * 100 : 0;

          return (
            <motion.div key={mission.id} variants={slideInRight} transition={{ delay: idx * 0.05 }}>
              <Card className={`overflow-hidden transition-all hover:shadow-md ${
                mission.isBonus ? 'border-2 border-[#D4AF37]/40' : 'border border-border/60'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${typeColor.bg}`}>
                      <IconComponent className={`size-6 ${typeColor.text}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold truncate">{mission.title}</h4>
                        {mission.isBonus && (
                          <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] text-[9px] border-0 gap-1 shrink-0">
                            <Sparkles className="size-3" />
                            ویژه
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-2">{mission.description}</p>

                      {/* Progress bar */}
                      {mission.steps > 1 && (
                        <div className="relative h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                          <motion.div
                            className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-[#D4AF37] to-[#FFD700]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Rewards + Status */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[11px] text-[#D4AF37] font-bold">
                          <Coins className="size-3" />
                          {formatNumber(mission.rewardGold)} mg
                        </div>
                        {mission.bonusReward > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-bold">
                            +{formatNumber(mission.bonusReward)}
                          </div>
                        )}
                      </div>
                      <Badge className={`${statusCfg.bg} ${statusCfg.color} text-[10px] border-0`}>
                        {statusCfg.label}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* All Completed Bonus Section */}
      {allCompleted && (
        <motion.div variants={scaleIn} initial="hidden" animate="show">
          <Card className="border-2 border-[#D4AF37] bg-gradient-to-br from-[#D4AF37]/10 to-[#FFD700]/5 overflow-hidden">
            <CardContent className="p-6 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Trophy className="mx-auto size-12 text-[#D4AF37] mb-3" />
              </motion.div>
              <h3 className="text-lg font-black text-[#D4AF37] mb-1">تبریک!</h3>
              <p className="text-sm text-muted-foreground mb-4">تمام مأموریت‌های هفتگی تکمیل شد.</p>
              <Button className="bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white font-bold shadow-lg shadow-[#D4AF37]/30">
                <Gift className="size-4 ml-2" />
                دریافت پاداش ویژه هفتگی
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 3: Learning Path                                                       */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function LearningPathTab({ lessons }: { lessons: Lesson[] }) {
  const addToast = useAppStore((s) => s.addToast);
  const completedCount = lessons.filter((l) => l.isCompleted).length;
  const allCompleted = completedCount === lessons.length;
  const totalReward = lessons.reduce((s, l) => s + l.rewardGold, 0);
  const totalXP = lessons.reduce((s, l) => s + l.rewardXP, 0);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Learning Path Header */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 border-[#D4AF37]/30 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-white shadow-lg shadow-[#D4AF37]/20">
                <GraduationCap className="size-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">دوره آموزشی سرمایه‌گذاری در طلا</h3>
                <p className="text-sm text-muted-foreground">
                  {formatNumber(completedCount)} از {formatNumber(lessons.length)} درس تکمیل شده
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1 text-[#D4AF37] font-bold">
                    <Coins className="size-3" /> {formatNumber(totalReward)} mg کل پاداش
                  </span>
                  <span className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="size-3" /> {formatNumber(totalXP)} XP کل
                  </span>
                </div>
              </div>
              {allCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="quest-float"
                >
                  <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-white shadow-lg">
                    <Award className="size-7" />
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Lessons Timeline */}
      <div className="relative">
        {/* Vertical progress line */}
        <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-border/40" />
        <motion.div
          className="absolute right-6 top-0 w-0.5 bg-gradient-to-b from-[#D4AF37] to-[#FFD700]"
          initial={{ height: 0 }}
          animate={{ height: `${(completedCount / lessons.length) * 100}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        <div className="space-y-4">
          {lessons.map((lesson, idx) => {
            const isLast = idx === lessons.length - 1;
            return (
              <motion.div
                key={lesson.id}
                variants={itemVariants}
                transition={{ delay: idx * 0.1 }}
                className="relative pr-16"
              >
                {/* Timeline dot */}
                <div className={`absolute right-4 top-4 flex size-5 items-center justify-center rounded-full border-2 z-10 ${
                  lesson.isCompleted
                    ? 'bg-[#D4AF37] border-[#D4AF37]'
                    : lesson.isUnlocked
                    ? 'bg-background border-[#D4AF37] quest-glow-ring'
                    : 'bg-muted border-muted-foreground/30'
                }`}>
                  {lesson.isCompleted ? (
                    <CheckCircle className="size-3 text-white" />
                  ) : lesson.isUnlocked ? (
                    <div className="size-2 rounded-full bg-[#D4AF37]" />
                  ) : (
                    <Lock className="size-3 text-muted-foreground/40" />
                  )}
                </div>

                {/* Lesson Card */}
                <Card className={`overflow-hidden transition-all ${
                  lesson.isCompleted
                    ? 'border border-emerald-400/40 bg-emerald-50/30 dark:bg-emerald-900/10'
                    : lesson.isUnlocked
                    ? 'border-2 border-[#D4AF37]/30 hover:shadow-lg hover:shadow-[#D4AF37]/10 cursor-pointer'
                    : 'border border-border/40 opacity-60'
                }`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Lesson Number */}
                      <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-black ${
                        lesson.isCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                          : lesson.isUnlocked
                          ? 'bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/10 text-[#D4AF37]'
                          : 'bg-muted text-muted-foreground/40'
                      }`}>
                        {lesson.isCompleted ? '✓' : lesson.number}
                      </div>

                      {/* Lesson Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-bold mb-1 ${lesson.isUnlocked ? '' : 'text-muted-foreground'}`}>
                          {lesson.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                          {lesson.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="size-3" /> {lesson.duration}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-[#D4AF37] font-bold">
                            <Coins className="size-3" /> {formatNumber(lesson.rewardGold)} mg
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                            <Star className="size-3" /> {formatNumber(lesson.rewardXP)} XP
                          </span>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="shrink-0">
                        {lesson.isCompleted ? (
                          <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-[10px] border-0 gap-1">
                            <CheckCircle className="size-3" />
                            تکمیل شده
                          </Badge>
                        ) : lesson.isUnlocked ? (
                          <Button
                            size="sm"
                            className="bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white text-xs font-bold shadow-md shadow-[#D4AF37]/20"
                            onClick={() => addToast(`درس ${lesson.number} شروع شد!`, 'info')}
                          >
                            <Play className="size-3 ml-1" />
                            شروع
                          </Button>
                        ) : (
                          <div className="flex size-8 items-center justify-center">
                            <Lock className="size-4 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Certificate Section (all completed) */}
      {allCompleted && (
        <motion.div variants={scaleIn} initial="hidden" animate="show">
          <Card className="border-2 border-[#D4AF37] bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-[#FFD700]/5 overflow-hidden relative">
            <div className="quest-shimmer absolute inset-0 pointer-events-none" />
            <CardContent className="p-8 text-center relative">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Award className="mx-auto size-16 text-[#D4AF37] mb-4 drop-shadow-lg" />
              </motion.div>
              <h3 className="text-xl font-black text-[#D4AF37] mb-2">مبارک! گواهینامه شما صادر شد</h3>
              <p className="text-sm text-muted-foreground mb-4">
                شما تمام ۴ درس دوره آموزشی سرمایه‌گذاری در طلا را با موفقیت تکمیل کردید.
              </p>
              <Button className="bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white font-bold shadow-lg shadow-[#D4AF37]/30">
                <Download className="size-4 ml-2" />
                دانلود گواهینامه
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

/* Small download icon substitute since lucide-react has Download */
function Download(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 4: Badges                                                              */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function BadgesTab({ badges }: { badges: QuestBadge[] }) {
  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Badges Header */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 border-[#D4AF37]/30 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-white shadow-lg shadow-[#D4AF37]/20">
                <Shield className="size-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">نشان‌های کاوشگر طلایی</h3>
                <p className="text-sm text-muted-foreground">
                  {formatNumber(unlockedCount)} از {formatNumber(badges.length)} نشان باز شده
                </p>
              </div>
              <ProgressRing progress={(unlockedCount / badges.length) * 100} size={60} strokeWidth={5}>
                <span className="text-sm font-black text-[#D4AF37]">{formatNumber(unlockedCount)}</span>
              </ProgressRing>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {badges.map((badge, idx) => (
          <motion.div
            key={badge.id}
            variants={scaleIn}
            transition={{ delay: idx * 0.06 }}
          >
            <Card className={`relative overflow-hidden transition-all h-full ${
              badge.isUnlocked
                ? 'border-2 border-[#D4AF37]/40 hover:shadow-lg hover:shadow-[#D4AF37]/10'
                : 'border border-border/40 opacity-60'
            }`}>
              <CardContent className="p-4 text-center space-y-3">
                {/* Badge Icon */}
                <div className={`relative mx-auto flex size-16 items-center justify-center rounded-2xl ${
                  badge.isUnlocked
                    ? 'bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/10'
                    : 'bg-muted'
                }`}>
                  <span className="text-3xl">{badge.icon}</span>
                  {!badge.isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/60">
                      <Lock className="size-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Badge Info */}
                <div>
                  <h4 className="text-sm font-bold">{badge.name}</h4>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{badge.description}</p>
                </div>

                {/* Status */}
                {badge.isUnlocked ? (
                  <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] text-[9px] border-0 gap-1">
                    <CheckCircle className="size-3" />
                    {badge.earnedDate}
                  </Badge>
                ) : (
                  <Badge className="bg-muted text-muted-foreground text-[9px] border-0">
                    <Lock className="size-3" />
                    {badge.requirement}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State (all locked) */}
      {unlockedCount === 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-dashed border-2 border-border/40">
            <CardContent className="p-12 text-center">
              <span className="text-5xl block mb-4">🏅</span>
              <h3 className="text-lg font-bold mb-2">هنوز نشانی کسب نکرده‌اید</h3>
              <p className="text-sm text-muted-foreground">با انجام مأموریت‌ها، اولین نشان خود را دریافت کنید!</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 5: Leaderboard                                                         */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function LeaderboardTab({ entries }: { entries: LeaderboardEntry[] }) {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

  /* Top 3 podium */
  const podiumOrder = [entries[1], entries[0], entries[2]]; /* 2nd, 1st, 3rd for visual */
  const podiumHeights = ['h-20', 'h-28', 'h-16'];
  const podiumColors = ['from-gray-300 to-gray-400', 'from-[#D4AF37] to-[#FFD700]', 'from-amber-700 to-amber-800'];
  const podiumLabels = ['۲', '۱', '۳'];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Period Toggle */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h3 className="text-lg font-bold">جدول رتبه‌بندی</h3>
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <Button
            size="sm"
            variant={period === 'weekly' ? 'default' : 'ghost'}
            className={`text-xs font-bold h-7 px-3 ${period === 'weekly' ? 'bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white' : ''}`}
            onClick={() => setPeriod('weekly')}
          >
            هفتگی
          </Button>
          <Button
            size="sm"
            variant={period === 'monthly' ? 'default' : 'ghost'}
            className={`text-xs font-bold h-7 px-3 ${period === 'monthly' ? 'bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white' : ''}`}
            onClick={() => setPeriod('monthly')}
          >
            ماهانه
          </Button>
        </div>
      </motion.div>

      {/* Animated Podium (Top 3) */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 border-[#D4AF37]/20 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-end justify-center gap-4 pt-4">
              {podiumOrder.map((entry, idx) => (
                <motion.div
                  key={entry.rank}
                  className="flex flex-col items-center"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.2, duration: 0.5 }}
                >
                  {/* Avatar */}
                  <div className={`flex size-12 items-center justify-center rounded-full bg-gradient-to-br ${podiumColors[idx]} text-white font-bold text-lg mb-2 shadow-lg ${
                    entry.isCurrentUser ? 'ring-2 ring-[#D4AF37] ring-offset-2' : ''
                  }`}>
                    {entry.name.charAt(0)}
                  </div>
                  <span className="text-xs font-bold mb-2 max-w-[80px] truncate">{entry.name}</span>
                  {/* Podium Block */}
                  <div className={`w-20 ${podiumHeights[idx]} bg-gradient-to-t ${podiumColors[idx]} rounded-t-xl flex items-start justify-center pt-2`}>
                    <span className="text-2xl font-black text-white/80">{podiumLabels[idx]}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 text-center">
                    <div>{formatNumber(entry.goldEarned)} mg</div>
                    <div>{formatNumber(entry.missionsCompleted)} مأموریت</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Full Leaderboard List (Rank 4-20) */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <div className="divide-y divide-border/40">
              {entries.slice(3).map((entry, idx) => (
                <motion.div
                  key={entry.rank}
                  variants={slideInRight}
                  transition={{ delay: idx * 0.03 }}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 ${
                    entry.isCurrentUser ? 'bg-[#D4AF37]/5 border-r-2 border-r-[#D4AF37]' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="w-6 flex justify-center">{getRankDisplay(entry.rank)}</div>

                  {/* Avatar */}
                  <div className={`flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold ${
                    entry.isCurrentUser ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : ''
                  }`}>
                    {entry.name.charAt(0)}
                  </div>

                  {/* Name + Level */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold truncate">{entry.name}</span>
                      {entry.isCurrentUser && (
                        <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] text-[8px] border-0 px-1.5">شما</Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">سطح {formatNumber(entry.level)}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 shrink-0 text-[11px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="flex items-center gap-1 text-amber-500 font-bold">
                            <Star className="size-3" /> {formatNumber(entry.xpFromQuests)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent><p>XP از مأموریت‌ها</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="flex items-center gap-1 text-[#D4AF37] font-bold">
                            <Coins className="size-3" /> {formatNumber(entry.goldEarned)} mg
                          </span>
                        </TooltipTrigger>
                        <TooltipContent><p>طلا از مأموریت‌ها</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Target className="size-3" /> {formatNumber(entry.missionsCompleted)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent><p>مأموریت‌های تکمیل شده</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 6: Daily Streak                                                        */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function DailyStreakTab({ streakData }: { streakData: StreakData }) {
  const addToast = useAppStore((s) => s.addToast);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const multiplier = getStreakMultiplier(streakData.currentStreak);
  const multColor = getMultiplierColor(multiplier);
  const multGlow = getMultiplierGlow(multiplier);

  /* Next milestone */
  const nextMilestone = STREAK_MILESTONES.find((m) => m.day > streakData.currentStreak) || STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
  const progressToNext = streakData.currentStreak < nextMilestone.day
    ? (streakData.currentStreak / nextMilestone.day) * 100
    : 100;

  const handleCheckIn = () => {
    if (streakData.checkedInToday || isCheckingIn) return;
    setIsCheckingIn(true);
    setTimeout(() => {
      setIsCheckingIn(false);
      addToast('چک‌این امروز با موفقیت ثبت شد! 🔥', 'success');
    }, 1200);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Main Streak Display */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/5 via-transparent to-orange-500/5 overflow-hidden">
          <CardContent className="p-8 text-center space-y-6">
            {/* Flame emoji with pulse animation */}
            <motion.div
              className="quest-flame-pulse inline-block"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-7xl drop-shadow-lg" role="img" aria-label="flame">🔥</span>
            </motion.div>

            {/* Current Streak Number */}
            <div>
              <div className="flex items-center justify-center gap-2">
                <span className={`text-6xl font-black ${multColor} ${multGlow} drop-shadow-lg`}>
                  {formatNumber(streakData.currentStreak)}
                </span>
                <span className="text-2xl text-muted-foreground font-bold">روز</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                رکورد فعلی
              </p>
            </div>

            {/* Multiplier Badge */}
            <Badge className={`text-sm font-bold px-4 py-1.5 border-0 ${multColor} ${
              multiplier >= 3 ? `bg-gradient-to-r from-purple-500/10 to-purple-500/5` :
              multiplier >= 2 ? 'bg-blue-500/10' :
              multiplier >= 1.5 ? 'bg-green-500/10' :
              'bg-muted'
            }`}>
              <Zap className="size-4 ml-1" />
              ضرایب پاداش: {multiplier}x
            </Badge>

            {/* Best Streak */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Trophy className="size-4 text-[#D4AF37]" />
              <span>بهترین رکورد: <strong className="text-foreground">{formatNumber(streakData.bestStreak)}</strong> روز</span>
            </div>

            {/* Check In Button */}
            <Button
              size="lg"
              className={`w-full max-w-xs mx-auto text-base font-bold ${
                streakData.checkedInToday
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white hover:from-[#D4AF37]/90 hover:to-[#FFD700]/90 shadow-lg shadow-[#D4AF37]/30'
              }`}
              onClick={handleCheckIn}
              disabled={streakData.checkedInToday || isCheckingIn}
            >
              {isCheckingIn ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="size-5 animate-spin" />
                  در حال ثبت...
                </span>
              ) : streakData.checkedInToday ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="size-5" />
                  امروز چک‌این شد!
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FlameKindling className="size-5" />
                  چک‌این امروز
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* 30-Day Streak Calendar */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar className="size-4 text-[#D4AF37]" />
              تقویم ۳۰ روزه
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-2">
              {streakData.calendar.map((checked, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.02, type: 'spring', stiffness: 200 }}
                  className={`aspect-square rounded-lg flex items-center justify-center text-[10px] ${
                    checked
                      ? 'bg-[#D4AF37] text-white shadow-sm shadow-[#D4AF37]/30'
                      : 'bg-muted/50 text-muted-foreground/40'
                  }`}
                  title={checked ? 'چک‌این شده' : 'چک‌این نشده'}
                >
                  {checked ? '✓' : '○'}
                </motion.div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
              <span>۳۰ روز پیش</span>
              <span>امروز</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Streak Milestones */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Target className="size-4 text-[#D4AF37]" />
              نقاط عطف رکورد
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Progress to next milestone */}
            {streakData.currentStreak < 30 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                  <span>روز {formatNumber(streakData.currentStreak)}</span>
                  <span>هدف بعدی: روز {formatNumber(nextMilestone.day)}</span>
                </div>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-[#D4AF37] to-[#FFD700]"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, progressToNext)}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {STREAK_MILESTONES.map((milestone, idx) => {
                const isReached = streakData.currentStreak >= milestone.day;
                const isNext = !isReached && (
                  idx === 0 || streakData.currentStreak >= STREAK_MILESTONES[idx - 1].day
                );

                return (
                  <motion.div
                    key={milestone.day}
                    variants={scaleIn}
                    transition={{ delay: idx * 0.08 }}
                  >
                    <div className={`relative rounded-xl p-4 text-center transition-all ${
                      isReached
                        ? 'bg-gradient-to-br from-[#D4AF37]/10 to-[#FFD700]/5 border border-[#D4AF37]/30'
                        : isNext
                        ? 'border-2 border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/5'
                        : 'bg-muted/30 border border-border/40 opacity-60'
                    } ${isReached && milestone.glow ? `shadow-lg ${milestone.glow}` : ''}`}>
                      <div className="flex items-center justify-center mb-2">
                        <span className={`text-3xl font-black ${isReached ? milestone.color : 'text-muted-foreground/40'}`}>
                          {formatNumber(milestone.day)}
                        </span>
                        <span className="text-xs text-muted-foreground mr-1">روز</span>
                      </div>
                      <div className="text-xs font-bold mb-1">
                        <span className={isReached ? milestone.color : 'text-muted-foreground'}>
                          {milestone.multiplier}x
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{milestone.reward}</p>
                      {isReached && (
                        <CheckCircle className="absolute top-2 left-2 size-4 text-emerald-500" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 7: Reward History                                                      */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function RewardHistoryTab({ entries }: { entries: RewardEntry[] }) {
  const [filterType, setFilterType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  /* Filter entries */
  const filteredEntries = filterType === 'all'
    ? entries
    : entries.filter((e) => e.sourceType === filterType);

  /* Pagination */
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / itemsPerPage));
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* Summary stats */
  const totalGold = entries.reduce((s, e) => s + e.gold, 0);
  const totalXP = entries.reduce((s, e) => s + e.xp, 0);
  const avgMultiplier = entries.length > 0
    ? entries.reduce((s, e) => s + e.multiplier, 0) / entries.length
    : 1;

  /* Source type options */
  const sourceTypes = [
    { value: 'all', label: 'همه' },
    { value: 'content', label: 'محتوا' },
    { value: 'explore', label: 'کاوش' },
    { value: 'search', label: 'جستجو' },
    { value: 'tool', label: 'ابزار' },
    { value: 'daily_return', label: 'ورود روزانه' },
    { value: 'social_share', label: 'اشتراک‌گذاری' },
    { value: 'profile', label: 'پروفایل' },
    { value: 'learning', label: 'آموزش' },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Summary Stats */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-2 border-[#D4AF37]/30">
            <CardContent className="p-4 text-center">
              <Coins className="mx-auto size-5 text-[#D4AF37] mb-1" />
              <p className="text-lg font-black text-[#D4AF37]">{formatNumber(Math.round(totalGold * 1000))}</p>
              <p className="text-[10px] text-muted-foreground">میلی‌گرم طلا</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="mx-auto size-5 text-amber-500 mb-1" />
              <p className="text-lg font-black text-amber-500">{formatNumber(totalXP)}</p>
              <p className="text-[10px] text-muted-foreground">کل XP</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="mx-auto size-5 text-purple-500 mb-1" />
              <p className="text-lg font-black text-purple-500">{avgMultiplier.toFixed(1)}x</p>
              <p className="text-[10px] text-muted-foreground">میانگین ضریب</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Filter */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="size-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-1.5">
            {sourceTypes.map((type) => (
              <Button
                key={type.value}
                size="sm"
                variant={filterType === type.value ? 'default' : 'outline'}
                className={`text-[10px] h-7 px-2.5 ${
                  filterType === type.value
                    ? 'bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white border-0'
                    : 'border-border/60'
                }`}
                onClick={() => { setFilterType(type.value); setCurrentPage(1); }}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Reward Entries Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[500px]">
              {/* Table Header */}
              <div className="sticky top-0 bg-background z-10 grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/40 text-[10px] font-bold text-muted-foreground">
                <div className="col-span-3">تاریخ</div>
                <div className="col-span-3">منبع</div>
                <div className="col-span-2 text-center">طلا (mg)</div>
                <div className="col-span-2 text-center">XP</div>
                <div className="col-span-2 text-center">ضریب</div>
              </div>

              {/* Table Rows */}
              {paginatedEntries.length > 0 ? (
                <div className="divide-y divide-border/30">
                  {paginatedEntries.map((entry, idx) => {
                    const multColor = getMultiplierColor(entry.multiplier);
                    return (
                      <motion.div
                        key={entry.id}
                        variants={slideInRight}
                        transition={{ delay: idx * 0.03 }}
                        className="grid grid-cols-12 gap-2 px-4 py-3 text-xs hover:bg-muted/30 transition-colors"
                      >
                        <div className="col-span-3 text-muted-foreground">{entry.date}</div>
                        <div className="col-span-3 font-medium truncate">{entry.source}</div>
                        <div className="col-span-2 text-center font-bold text-[#D4AF37]">+{formatNumber(Math.round(entry.gold * 1000))}</div>
                        <div className="col-span-2 text-center font-bold text-amber-500">+{formatNumber(entry.xp)}</div>
                        <div className="col-span-2 text-center">
                          <Badge className={`${multColor} text-[10px] border-0 bg-transparent`}>
                            {entry.multiplier}x
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <span className="text-4xl block mb-3">📋</span>
                  <p className="text-sm text-muted-foreground">موردی یافت نشد</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div variants={itemVariants} className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <Button
              key={i}
              size="sm"
              variant={currentPage === i + 1 ? 'default' : 'outline'}
              className={`w-8 h-8 p-0 text-xs ${
                currentPage === i + 1
                  ? 'bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white border-0'
                  : ''
              }`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {formatNumber(i + 1)}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Main GoldQuest Component                                                   */
/* ═══════════════════════════════════════════════════════════════════════════════ */

export default function GoldQuest() {
  const { t } = useTranslation();
  const addToast = useAppStore((s) => s.addToast);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');

  /* Quick-access tab switch handlers */
  const goToDaily = useCallback(() => setActiveTab('daily'), []);
  const goToWeekly = useCallback(() => setActiveTab('weekly'), []);
  const goToLeaderboard = useCallback(() => setActiveTab('leaderboard'), []);
  const goToStreak = useCallback(() => setActiveTab('streak'), []);
  useQuickAction('tab:quest-today', goToDaily);
  useQuickAction('tab:quest-weekly', goToWeekly);
  useQuickAction('tab:quest-leaderboard', goToLeaderboard);
  useQuickAction('tab:quest-streak', goToStreak);

  /* Simulate loading state */
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  /* Use mock data (API integration ready) */
  const dailyMissions = useMemo(() => MOCK_DAILY_MISSIONS, []);
  const weeklyMissions = useMemo(() => MOCK_WEEKLY_MISSIONS, []);
  const lessons = useMemo(() => MOCK_LESSONS, []);
  const badges = useMemo(() => MOCK_BADGES, []);
  const leaderboard = useMemo(() => MOCK_LEADERBOARD, []);
  const streakData = useMemo(() => MOCK_STREAK, []);
  const rewardHistory = useMemo(() => MOCK_REWARD_HISTORY, []);

  /* Loading skeleton */
  if (isLoading) {
    return <GoldQuestSkeleton />;
  }

  /* Tab configuration */
  const tabs = [
    { value: 'daily', label: 'مأموریت‌های امروز', icon: <Flame className="size-4" /> },
    { value: 'weekly', label: 'مأموریت‌های هفتگی', icon: <Calendar className="size-4" /> },
    { value: 'learning', label: 'مسیر آموزشی', icon: <GraduationCap className="size-4" /> },
    { value: 'badges', label: 'نشان‌ها', icon: <Shield className="size-4" /> },
    { value: 'leaderboard', label: 'جدول رتبه‌بندی', icon: <Trophy className="size-4" /> },
    { value: 'streak', label: 'رکورد روزانه', icon: <FlameKindling className="size-4" /> },
    { value: 'history', label: 'تاریخچه پاداش‌ها', icon: <BarChart3 className="size-4" /> },
  ];

  return (
    <div className="mx-auto max-w-6xl pb-24 px-4">
      {/* Inject CSS animations */}
      <style dangerouslySetInnerHTML={{ __html: CONFETTI_STYLE }} />

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center pt-6 pb-6"
      >
        {/* Gold Quest Logo */}
        <motion.div
          className="mx-auto mb-4 flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-white shadow-xl shadow-[#D4AF37]/30"
          animate={{ rotate: [0, 2, -2, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Gem className="size-10" />
        </motion.div>
        <h1 className="text-2xl sm:text-3xl font-black mb-2">
          <span className="bg-gradient-to-l from-[#D4AF37] via-[#FFD700] to-[#D4AF37] bg-clip-text text-transparent">
            طلای کاوشگر
          </span>
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          مأموریت‌ها را انجام دهید، نشان بگیرید و پاداش طلایی کسب کنید!
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Scrollable Tab List */}
        <div className="mb-6 -mx-4 px-4 overflow-x-auto">
          <TabsList className="inline-flex w-max gap-1 bg-muted/50 p-1.5 rounded-xl h-auto">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg whitespace-nowrap data-[state=active]:bg-gradient-to-l data-[state=active]:from-[#D4AF37] data-[state=active]:to-[#FFD700] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-[#D4AF37]/20 transition-all"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Content with Animated Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <TabsContent value="daily" className="mt-0" id="quest-today">
              <TodaysMissionsTab missions={dailyMissions} />
            </TabsContent>

            <TabsContent value="weekly" className="mt-0" id="quest-weekly">
              <WeeklyMissionsTab missions={weeklyMissions} />
            </TabsContent>

            <TabsContent value="learning" className="mt-0">
              <LearningPathTab lessons={lessons} />
            </TabsContent>

            <TabsContent value="badges" className="mt-0">
              <BadgesTab badges={badges} />
            </TabsContent>

            <TabsContent value="leaderboard" className="mt-0" id="quest-leaderboard">
              <LeaderboardTab entries={leaderboard} />
            </TabsContent>

            <TabsContent value="streak" className="mt-0" id="quest-streak">
              <DailyStreakTab streakData={streakData} />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <RewardHistoryTab entries={rewardHistory} />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}

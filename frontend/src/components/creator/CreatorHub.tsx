
/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Gold Creator Club — Premium Creator Hub                                    */
/*  A comprehensive, gamified creator platform component with 7 tabs            */
/*  Persian RTL with English comments                                          */
/* ═══════════════════════════════════════════════════════════════════════════════ */

import {useState, useEffect, useCallback} from 'react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Skeleton} from '@/components/ui/skeleton';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Checkbox} from '@/components/ui/checkbox';
import {Separator} from '@/components/ui/separator';
import {Switch} from '@/components/ui/switch';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '@/components/ui/collapsible';
import {Crown, Trophy, Medal, Star, Flame, TrendingUp, Eye, Clock, Upload, Link, Copy, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronLeft, Send, Gift, Users, Zap, Shield, Camera, Youtube, MessageCircle, MessageSquare, Play, Award, BarChart3, Target, BookOpen, FileText, Hash, Sparkles, Gem, Diamond, ArrowUpRight, Heart, Share2, Clipboard, Lightbulb, Megaphone, Video, Mic, ArrowRight, ExternalLink, Wallet, Coins, User, Settings, CrownIcon, MapPin, Calendar, RefreshCw, Filter} from 'lucide-react';
import {useAppStore} from '@/lib/store';
import {useTranslation} from '@/lib/i18n';
import {formatNumber} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Types & Interfaces                                                        */
/* ═══════════════════════════════════════════════════════════════════════════════ */

/* Creator level tiers */
type CreatorTier = 'beginner' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'elite';

interface CreatorLevel {
  tier: CreatorTier;
  level: number;
  title: string;
  xp: number;
  xpToNext: number;
  xpTotal: number;
}

/* Submission status */
type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'ai_review';

interface Submission {
  id: string;
  platform: string;
  url: string;
  campaign: string;
  status: SubmissionStatus;
  aiScore: number;
  reward: number;
  date: string;
  adminNote?: string;
  views: number;
}

/* Campaign data */
type CampaignTier = 'bronze' | 'silver' | 'gold' | 'diamond';

interface Campaign {
  id: string;
  title: string;
  description: string;
  tier: CampaignTier;
  reward: number;
  platforms: string[];
  minViews: number;
  rules: string[];
  isActive: boolean;
  endDate: string;
  participants: number;
}

/* Leaderboard entry */
interface LeaderEntry {
  rank: number;
  name: string;
  avatar: string;
  level: CreatorLevel;
  goldEarned: number;
  score: number;
  posts: number;
}

/* Template types */
interface VideoIdea {
  id: string;
  title: string;
  description: string;
  platform: string;
  duration: string;
}

interface CaptionTemplate {
  id: string;
  text: string;
  category: string;
  platform: string;
}

interface HashtagPack {
  id: string;
  name: string;
  tags: string[];
  category: string;
}

interface ScriptSuggestion {
  id: string;
  title: string;
  script: string;
  platform: string;
  tips: string[];
}

/* Platform icon mapping */
interface PlatformInfo {
  name: string;
  icon: string;
  color: string;
}

/* Profile data */
interface CreatorProfile {
  name: string;
  avatar: string;
  bio: string;
  level: CreatorLevel;
  socialLinks: { platform: string; url: string }[];
  referralCode: string;
  referralClicks: number;
  referralSignups: number;
  referralPurchases: number;
  totalGoldEarned: number;
  totalPosts: number;
  totalViews: number;
  joinDate: string;
}

/* Reward history */
interface RewardEntry {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  campaign: string;
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Constants & Theme Configuration                                           */
/* ═══════════════════════════════════════════════════════════════════════════════ */

/* Tier color scheme */
const TIER_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string; badge: string }> = {
  beginner: { bg: 'bg-gray-100 dark:bg-gray-900', text: 'text-gray-500', border: 'border-gray-300', gradient: 'from-gray-400 to-gray-600', badge: 'bg-gray-400 text-white' },
  bronze: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-400', gradient: 'from-amber-600 to-amber-800', badge: 'bg-[#CD7F32] text-white' },
  silver: { bg: 'bg-slate-50 dark:bg-slate-900/30', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-400', gradient: 'from-slate-400 to-slate-600', badge: 'bg-[#C0C0C0] text-white' },
  gold: { bg: 'bg-yellow-50 dark:bg-yellow-950/20', text: 'text-[#D4AF37]', border: 'border-[#D4AF37]', gradient: 'from-[#D4AF37] to-[#FFD700]', badge: 'bg-[#D4AF37] text-white' },
  diamond: { bg: 'bg-cyan-50 dark:bg-cyan-950/20', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-400', gradient: 'from-cyan-400 to-cyan-600', badge: 'bg-[#00BCD4] text-white' },
  elite: { bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-400', gradient: 'from-purple-500 to-purple-700', badge: 'bg-[#9C27B0] text-white' },
};

/* Campaign tier colors */
const CAMPAIGN_TIER_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  bronze: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700', border: 'border-amber-300', glow: 'shadow-amber-200/50' },
  silver: { bg: 'bg-slate-50 dark:bg-slate-900/30', text: 'text-slate-600', border: 'border-slate-300', glow: 'shadow-slate-200/50' },
  gold: { bg: 'bg-yellow-50 dark:bg-yellow-950/20', text: 'text-[#D4AF37]', border: 'border-yellow-400', glow: 'shadow-yellow-200/50' },
  diamond: { bg: 'bg-cyan-50 dark:bg-cyan-950/20', text: 'text-cyan-600', border: 'border-cyan-300', glow: 'shadow-cyan-200/50' },
};

/* Platform configurations */
const PLATFORMS: Record<string, PlatformInfo> = {
  instagram: { name: 'اینستاگرام', icon: '📸', color: '#E4405F' },
  tiktok: { name: 'تیک‌تاک', icon: '🎵', color: '#000000' },
  youtube_shorts: { name: 'یوتیوب شورتس', icon: '▶️', color: '#FF0000' },
  telegram: { name: 'تلگرام', icon: '✈️', color: '#0088CC' },
  twitter: { name: 'ایکس/توییتر', icon: '🐦', color: '#1DA1F2' },
  aparat: { name: 'آپارات', icon: '🎬', color: '#ED145B' },
};

/* Tier title translations (Persian) */
const TIER_TITLES: Record<CreatorTier, string> = {
  beginner: 'مبتدی',
  bronze: 'برنزی',
  silver: 'نقره‌ای',
  gold: 'طلایی',
  diamond: 'الماسی',
  elite: 'الیتی',
};

/* Status configurations */
const STATUS_CONFIG: Record<SubmissionStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  pending: { label: 'در انتظار بررسی', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: Clock },
  approved: { label: 'تأیید شده', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle },
  rejected: { label: 'رد شده', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
  ai_review: { label: 'بررسی AI', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: AlertCircle },
};

/* Animation variants */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Mock / Demo Data (fallback when API is unavailable)                        */
/* ═══════════════════════════════════════════════════════════════════════════════ */

const MOCK_PROFILE: CreatorProfile = {
  name: 'سارا احمدی',
  avatar: '',
  bio: 'خالق محتوای مالی و سرمایه‌گذاری | عاشق طلا و فین‌تک 💛',
  level: { tier: 'silver', level: 4, title: 'نقره‌ای', xp: 3200, xpToNext: 1800, xpTotal: 5000 },
  socialLinks: [
    { platform: 'instagram', url: 'https://instagram.com/sara.gold' },
    { platform: 'telegram', url: 'https://t.me/sara_gold' },
  ],
  referralCode: 'SARA-GOLD-24',
  referralClicks: 342,
  referralSignups: 28,
  referralPurchases: 12,
  totalGoldEarned: 156.5,
  totalPosts: 47,
  totalViews: 125000,
  joinDate: '۱۴۰۳/۰۶/۱۵',
};

const MOCK_SUBMISSIONS: Submission[] = [
  { id: 's1', platform: 'instagram', url: 'https://instagram.com/p/abc123', campaign: 'معرفی زرین گلد', status: 'approved', aiScore: 92, reward: 15.5, date: '۱۴۰۳/۱۰/۰۵', views: 12500 },
  { id: 's2', platform: 'tiktok', url: 'https://tiktok.com/@user/vid456', campaign: 'نکات طلایی سرمایه‌گذاری', status: 'pending', aiScore: 0, reward: 0, date: '۱۴۰۳/۱۰/۰۸', views: 0 },
  { id: 's3', platform: 'youtube_shorts', url: 'https://youtube.com/shorts/xyz', campaign: 'چالش طلایی', status: 'rejected', aiScore: 45, reward: 0, date: '۱۴۰۳/۱۰/۰۱', adminNote: 'محتوا با قوانین کمپین همخوانی ندارد. لطفاً لینک زرین گلد را اضافه کنید.', views: 890 },
  { id: 's4', platform: 'telegram', url: 'https://t.me/channel/789', campaign: 'معرفی زرین گلد', status: 'ai_review', aiScore: 78, reward: 0, date: '۱۴۰۳/۱۰/۱۰', views: 2300 },
  { id: 's5', platform: 'instagram', url: 'https://instagram.com/p/def789', campaign: 'چالش طلایی', status: 'approved', aiScore: 95, reward: 25, date: '۱۴۰۳/۰۹/۲۵', views: 45000 },
  { id: 's6', platform: 'aparat', url: 'https://aparat.com/v/abc', campaign: 'آموزش خرید طلا', status: 'approved', aiScore: 88, reward: 20, date: '۱۴۰۳/۰۹/۲۰', views: 18000 },
];

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'c1', title: 'معرفی زرین گلد', description: 'یک ویدیوی معرفی جذاب از اپلیکیشن زرین گلد بسازید و ویژگی‌های اصلی آن را پوشش دهید.',
    tier: 'gold', reward: 25, platforms: ['instagram', 'tiktok', 'youtube_shorts'], minViews: 5000,
    rules: ['حداقل ۳۰ ثانیه ویدیو', 'لینک زرین گلد در بایو الزامی است', 'حداقل ۵۰۰۰ بازدید', 'محتوا باید حرفه‌ای باشد', 'هشتگ #زرین_گلد الزامی'],
    isActive: true, endDate: '۱۴۰۳/۱۲/۲۹', participants: 156,
  },
  {
    id: 'c2', title: 'نکات طلایی سرمایه‌گذاری', description: 'نکات کلیدی سرمایه‌گذاری در طلا را به اشتراک بگذارید.',
    tier: 'silver', reward: 12, platforms: ['instagram', 'telegram', 'aparat'], minViews: 2000,
    rules: ['حداقل ۱ دقیقه ویدیو یا ۳ اسلاید', 'اطلاعات باید دقیق باشد', 'منبع ذکر شود'],
    isActive: true, endDate: '۱۴۰۳/۱۱/۳۰', participants: 89,
  },
  {
    id: 'c3', title: 'چالش طلایی', description: 'چالش خرید اولین طلای خود را ثبت کنید!',
    tier: 'bronze', reward: 5, platforms: ['instagram', 'tiktok', 'twitter'], minViews: 500,
    rules: ['ویدیوی کوتاه ۱۵ تا ۳۰ ثانیه', 'هشتگ #چالش_طلایی_زرین'],
    isActive: true, endDate: '۱۴۰۳/۱۲/۱۵', participants: 234,
  },
  {
    id: 'c4', title: 'آموزش جامع خرید طلا', description: 'یک آموزش کامل مراحل خرید طلا در زرین گلد بسازید.',
    tier: 'diamond', reward: 50, platforms: ['youtube_shorts', 'aparat', 'instagram'], minViews: 20000,
    rules: ['حداقل ۲ دقیقه ویدیو', 'کیفیت HD', 'اسکرین‌ریکورد از اپلیکیشن', 'زیرنویس فارسی'],
    isActive: false, endDate: '۱۴۰۳/۰۹/۳۰', participants: 45,
  },
  {
    id: 'c5', title: 'مقایسه زرین گلد با رقبا', description: 'مزایای زرین گلد نسبت به سایر پلتفرم‌ها را بررسی کنید.',
    tier: 'gold', reward: 30, platforms: ['instagram', 'youtube_shorts', 'telegram'], minViews: 10000,
    rules: ['ویدیو حرفه‌ای', 'نکات مقایسه‌ای دقیق', 'صدای واضح و باکیفیت'],
    isActive: true, endDate: '۱۴۰۳/۱۱/۱۵', participants: 67,
  },
  {
    id: 'c6', title: 'مربی طلایی یک‌روزه', description: 'یک روز کامل خرید و فروش طلا را با زرین گلد تجربه کنید.',
    tier: 'silver', reward: 15, platforms: ['instagram', 'tiktok'], minViews: 3000,
    rules: ['استوری یا ویدیو ۱ دقیقه‌ای', 'حداقل ۵ استوری', 'انتشار حس‌و‌حال کاربری'],
    isActive: true, endDate: '۱۴۰۳/۱۲/۰۱', participants: 112,
  },
];

const MOCK_LEADERBOARD: LeaderEntry[] = [
  { rank: 1, name: 'محمد رضایی', avatar: '', level: { tier: 'elite', level: 8, title: 'الیتی', xp: 12000, xpToNext: 0, xpTotal: 12000 }, goldEarned: 580, score: 9500, posts: 156 },
  { rank: 2, name: 'سارا احمدی', avatar: '', level: { tier: 'diamond', level: 6, title: 'الماسی', xp: 8500, xpToNext: 1500, xpTotal: 10000 }, goldEarned: 420, score: 8200, posts: 134 },
  { rank: 3, name: 'علی محمدی', avatar: '', level: { tier: 'gold', level: 5, title: 'طلایی', xp: 6000, xpToNext: 1000, xpTotal: 7000 }, goldEarned: 310, score: 7100, posts: 98 },
  { rank: 4, name: 'مریم حسینی', avatar: '', level: { tier: 'gold', level: 5, title: 'طلایی', xp: 5800, xpToNext: 1200, xpTotal: 7000 }, goldEarned: 285, score: 6800, posts: 87 },
  { rank: 5, name: 'رضا کریمی', avatar: '', level: { tier: 'silver', level: 4, title: 'نقره‌ای', xp: 4200, xpToNext: 800, xpTotal: 5000 }, goldEarned: 220, score: 5900, posts: 76 },
  { rank: 6, name: 'فاطمه نوری', avatar: '', level: { tier: 'silver', level: 4, title: 'نقره‌ای', xp: 3900, xpToNext: 1100, xpTotal: 5000 }, goldEarned: 198, score: 5500, posts: 65 },
  { rank: 7, name: 'امیر صادقی', avatar: '', level: { tier: 'silver', level: 3, title: 'نقره‌ای', xp: 3500, xpToNext: 1500, xpTotal: 5000 }, goldEarned: 175, score: 5100, posts: 58 },
  { rank: 8, name: 'زهرا میرزایی', avatar: '', level: { tier: 'bronze', level: 3, title: 'برنزی', xp: 2800, xpToNext: 700, xpTotal: 3500 }, goldEarned: 145, score: 4600, posts: 52 },
  { rank: 9, name: 'حسین قاسمی', avatar: '', level: { tier: 'bronze', level: 3, title: 'برنزی', xp: 2500, xpToNext: 1000, xpTotal: 3500 }, goldEarned: 130, score: 4200, posts: 45 },
  { rank: 10, name: 'نرگس عابدی', avatar: '', level: { tier: 'bronze', level: 2, title: 'برنزی', xp: 2200, xpToNext: 1300, xpTotal: 3500 }, goldEarned: 112, score: 3800, posts: 41 },
  { rank: 11, name: 'مهدی تقوی', avatar: '', level: { tier: 'bronze', level: 2, title: 'برنزی', xp: 1900, xpToNext: 600, xpTotal: 2500 }, goldEarned: 95, score: 3400, posts: 38 },
  { rank: 12, name: 'لیلا صالحی', avatar: '', level: { tier: 'beginner', level: 2, title: 'مبتدی', xp: 1500, xpToNext: 500, xpTotal: 2000 }, goldEarned: 78, score: 2900, posts: 32 },
];

const MOCK_VIDEO_IDEAS: VideoIdea[] = [
  { id: 'v1', title: 'چطور اولین طلا رو بخرم؟', description: 'آموزش قدم‌به‌قدم ثبت‌نام و خرید طلای اول در زرین گلد. از نصب اپ تا دریافت طلا.', platform: 'instagram', duration: '۶۰ ثانیه' },
  { id: 'v2', title: 'مقایسه قیمت طلا تو زرین گلد', description: 'قیمت لحظه‌ای طلا در زرین گلد رو با بازار آزاد مقایسه کنید.', platform: 'tiktok', duration: '۳۰ ثانیه' },
  { id: 'v3', title: 'پس‌انداز طلایی با ۵۰ هزار واحد طلایی', description: 'نمایش چطور میشه با مبالغ کم، طلا پس‌انداز کرد.', platform: 'youtube_shorts', duration: '۴۵ ثانیه' },
  { id: 'v4', title: '۵ دلیل سرمایه‌گذاری در طلا', description: 'آموزش کوتاه درباره مزایای سرمایه‌گذاری در طلای دیجیتال.', platform: 'instagram', duration: '۹۰ ثانیه' },
  { id: 'v5', title: 'فروش اضطراری طلا تو ۱ دقیقه', description: 'نمایش قابلیت فروش سریع طلای دیجیتال در مواقع لزوم.', platform: 'tiktok', duration: '۳۰ ثانیه' },
  { id: 'v6', title: 'وام طلایی چطور کار میکنه؟', description: 'توضیح ساده مکانیزم وام با وثیقه طلای دیجیتال.', platform: 'youtube_shorts', duration: '۶۰ ثانیه' },
];

const MOCK_CAPTIONS: CaptionTemplate[] = [
  { id: 'cap1', text: '🔥 طلا دیجیتال بخر، خیالت راحت باشه!\n\nبا زرین گلد، سرمایه‌گذاری در طلا همونقدر ساده‌ست که یه پیام فرستادن 📱\n\nلینک تو بایو 👆\n#زرین_گلد #طلای_دیجیتال #سرمایه‌گذاری', category: 'تبلیغاتی', platform: 'instagram' },
  { id: 'cap2', text: '✨ امروز اولین طلای دیجیتالم رو خریدم!\n\nبا زرین گلد، حتی با ۵۰ هزار واحد طلایی هم میشه طلا خرید 💛\n\nشما چقدر طلا دارید؟ 👇\n#چالش_طلایی #زرین_گلد', category: 'تعاملی', platform: 'instagram' },
  { id: 'cap3', text: '💰 سود ۲۵٪ در ۳ ماه با طلای دیجیتال!\n\nچطور با زرین گلد سرمایه‌م رو چند برابر کردم 📈\n\nجزییات تو لینک زیر:\nhttps://zarringold.ir/ref/SARA-GOLD-24\n#سرمایه‌گذاری #طلا #فین‌تک', category: 'آموزشی', platform: 'telegram' },
  { id: 'cap4', text: 'بدون ضامن، بدون چک... فقط با طلا وام بگیر! 🏦\n\nوام طلایی زرین گلد یه شاهکاره ✨\n\n#وام_طلایی #زرین_گلد #فین‌تک', category: 'معرفی ویژگی', platform: 'twitter' },
];

const MOCK_HASHTAGS: HashtagPack[] = [
  { id: 'h1', name: 'هشتگ‌های اصلی', tags: ['#زرین_گلد', '#طلای_دیجیتال', '#سرمایه‌گذاری_در_طلا', '#فین‌تک_ایران', '#خرید_طلا_آنلاین', '#پس‌انداز_طلایی'], category: 'عمومی' },
  { id: 'h2', name: 'هشتگ‌های تعاملی', tags: ['#چالش_طلایی', '#اولین_طلا', '#میلیونر_طلایی', '#طلای_من', '#زرین‌گلد_چالش', '#گولد_کلاب'], category: 'چالش' },
  { id: 'h3', name: 'هشتگ‌های آموزشی', tags: ['#آموزش_سرمایه‌گذاری', '#نکات_طلایی', '#اقتصاد_بخوانیم', '#طلا_بخریم', '#مالی_شخصی', '#آزادی_مالی'], category: 'آموزشی' },
  { id: 'h4', name: 'هشتگ‌های ترند', tags: ['#استوری_طلایی', '#رئال_بادی', '#گولد_ریچ', '#ترند_فین‌تک', '#اپلیکیشن_برتر', '#دیجیتال_گلد'], category: 'ترند' },
];

const MOCK_SCRIPTS: ScriptSuggestion[] = [
  {
    id: 'sc1', title: 'اسکریپت معرفی زرین گلد (اینستاگرام ریلز)', platform: 'instagram',
    script: '[开场 - 3 seconds]\n"آیا می‌دونستید میشه با گوشیت طلا خرید؟" 🤯\n\n[Body - 20 seconds]\n"من تازه اپ زرین گلد رو نصب کردم و با ۵۰ هزار واحد طلایی اولین طلای دیجیتالم رو خریدم! 📱💰\n\n✅ بدون واسطه\n✅ قیمت لحظه‌ای\n✅ امن و مطمئن\n\n[CTA - 7 seconds]\n"لینک تو بایو، ثبت‌نامت ۱ دقیقه‌ست! 👆"',
    tips: ['از موسیقی ترند استفاده کنید', 'سریع و پرانرژی صحبت کنید', 'متن روی ویدیو اضافه کنید'],
  },
  {
    id: 'sc2', title: 'اسکریپت آموزش خرید طلا (تیک‌تاک)', platform: 'tiktok',
    script: '[Hook - 2 seconds]\n"خرید طلا در ۳ قدم! 🪙"\n\n[Step 1 - 5 seconds]\n"قدم اول: نصب اپ زرین گلد"\n[Show app icon]\n\n[Step 2 - 5 seconds]\n"قدم دوم: ثبت‌نام با شماره موبایل"\n[Show registration screen]\n\n[Step 3 - 5 seconds]\n"قدم سوم: انتخاب مقدار و خرید!"\n[Show successful purchase]\n\n[CTA - 3 seconds]\n"همین الان امتحان کن! 🔗"',
    tips: ['متحرک و سریع', 'زیرنویس فارسی', 'حذف مکث‌ها'],
  },
  {
    id: 'sc3', title: 'اسکریپت مقایسه (یوتیوب شورتس)', platform: 'youtube_shorts',
    script: '[Intro - 3 seconds]\n"زرین گلد vs خرید فیزیکی طلا... کدوم بهتره؟ 🤔"\n\n[Comparison Points - 25 seconds]\n"خرید فیزیکی: ⚠️ خطر سرقت، 💰 کارمزد بالا، 📍 نیاز به مراجعه حضوری\n\nزرین گلد: ✅ امن ۱۰۰٪، 📉 کارمزد کم، 📱 هرجا هر وقت"\n\n[Outro - 2 seconds]\n"بقیشو تو کامنت‌ها بگم... ✍️"',
    tips: ['قابل قفل کردن (Loop-friendly)', 'متن روی تصویر', 'Call to Action قوی'],
  },
];

const MOCK_REWARDS: RewardEntry[] = [
  { id: 'r1', type: 'campaign', amount: 25, date: '۱۴۰۳/۱۰/۰۵', description: 'پاداش کمپین معرفی زرین گلد', campaign: 'معرفی زرین گلد' },
  { id: 'r2', type: 'campaign', amount: 20, date: '۱۴۰۳/۰۹/۲۰', description: 'پاداش کمپین آموزش خرید طلا', campaign: 'آموزش خرید طلا' },
  { id: 'r3', type: 'campaign', amount: 15, date: '۱۴۰۳/۰۹/۲۵', description: 'پاداش کمپین چالش طلایی', campaign: 'چالش طلایی' },
  { id: 'r4', type: 'referral', amount: 5, date: '۱۴۰۳/۰۹/۱۵', description: 'پاداش دعوت از دوست', campaign: '-' },
  { id: 'r5', type: 'bonus', amount: 10, date: '۱۴۰۳/۰۸/۲۰', description: 'پاداش ویژه روز خالق محتوا', campaign: '-' },
  { id: 'r6', type: 'campaign', amount: 30, date: '۱۴۰۳/۰۸/۱۰', description: 'پاداش ویژه کمپین تابستانه', campaign: 'کمپین تابستانه' },
];

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Helper Functions                                                          */
/* ═══════════════════════════════════════════════════════════════════════════════ */

/** Copy text to clipboard */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Get tier medal component for leaderboard */
function getRankDisplay(rank: number) {
  if (rank === 1) return <Crown className="size-5 text-yellow-400 drop-shadow" />;
  if (rank === 2) return <Medal className="size-5 text-gray-400" />;
  if (rank === 3) return <Medal className="size-5 text-amber-700" />;
  return <span className="text-sm font-bold text-muted-foreground">{formatNumber(rank)}</span>;
}

/** Get platform display info */
function getPlatformDisplay(platformKey: string): PlatformInfo {
  return PLATFORMS[platformKey] || { name: platformKey, icon: '📱', color: '#666' };
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeleton Component                                                */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function CreatorHubSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      {/* Header skeleton */}
      <div className="flex flex-col items-center gap-4 py-8">
        <Skeleton className="size-20 rounded-full" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 1: Creator Dashboard                                                  */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function DashboardTab({
  profile,
  submissions,
  rewards,
  onNavigate,
}: {
  profile: CreatorProfile;
  submissions: Submission[];
  rewards: RewardEntry[];
  onNavigate: (tab: string) => void;
}) {
  const tierConfig = TIER_COLORS[profile.level.tier];
  const levelProgress = profile.level.xpToNext > 0
    ? ((profile.level.xpTotal - profile.level.xpToNext) / profile.level.xpTotal) * 100
    : 100;

  /* Stats cards data */
  const stats = [
    { icon: <Coins className="size-5" />, label: 'مجموع طلای کسب‌شده', value: `${formatNumber(profile.totalGoldEarned)} mg`, color: 'text-[#D4AF37]' },
    { icon: <FileText className="size-5" />, label: 'کل پست‌ها', value: formatNumber(profile.totalPosts), color: 'text-blue-500' },
    { icon: <CheckCircle className="size-5" />, label: 'تأیید شده', value: formatNumber(submissions.filter(s => s.status === 'approved').length), color: 'text-emerald-500' },
    { icon: <Clock className="size-5" />, label: 'در انتظار', value: formatNumber(submissions.filter(s => s.status === 'pending').length), color: 'text-amber-500' },
    { icon: <Eye className="size-5" />, label: 'کل بازدیدها', value: formatNumber(profile.totalViews), color: 'text-purple-500' },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Level Badge & Progress */}
      <motion.div variants={itemVariants}>
        <Card className={`overflow-hidden border-2 ${tierConfig.border}`}>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              {/* Level badge with glow */}
              <div className={`relative flex size-28 items-center justify-center rounded-full bg-gradient-to-br ${tierConfig.gradient} shadow-lg shadow-gold/30 shadow-xl`}>
                <div className="absolute inset-1 rounded-full bg-background/90 dark:bg-background/80 flex items-center justify-center">
                  <div className="text-center">
                    <Crown className={`mx-auto size-6 ${tierConfig.text} mb-1`} />
                    <span className={`text-2xl font-black ${tierConfig.text}`}>{formatNumber(profile.level.level)}</span>
                    <p className={`text-[10px] font-bold ${tierConfig.text}`}>{TIER_TITLES[profile.level.tier]}</p>
                  </div>
                </div>
                {/* Animated ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-dashed"
                  style={{ borderColor: tierConfig.border.replace('border-', '').replace('/30', '') }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              <div>
                <h3 className={`text-xl font-extrabold ${tierConfig.text}`}>{profile.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
              </div>

              {/* Level progress bar */}
              <div className="w-full max-w-sm">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground">سطح {formatNumber(profile.level.level)}</span>
                  <span className={`font-bold ${tierConfig.text}`}>
                    {formatNumber(profile.level.xp)} / {formatNumber(profile.level.xp + profile.level.xpToNext)} XP
                  </span>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={`absolute inset-y-0 right-0 rounded-full bg-gradient-to-l ${tierConfig.gradient}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, levelProgress)}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </div>
                <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                  تا سطح بعدی <span className={`font-bold ${tierConfig.text}`}>{formatNumber(profile.level.xpToNext)}</span> XP دیگر نیاز دارید
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((stat, i) => (
          <Card key={i} className="border-border/50 hover:border-[#D4AF37]/30 transition-all hover:shadow-md hover:shadow-[#D4AF37]/5">
            <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
              <div className={`flex size-10 items-center justify-center rounded-lg bg-muted ${stat.color}`}>
                {stat.icon}
              </div>
              <p className="text-lg font-bold tabular-nums">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Quick Action Buttons */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Button
          onClick={() => onNavigate('submit')}
          className="bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white hover:from-[#D4AF37]/90 hover:to-[#FFD700]/90 shadow-lg shadow-[#D4AF37]/20 font-bold"
        >
          <Send className="size-4 ml-2" />
          ارسال محتوا
        </Button>
        <Button
          onClick={() => onNavigate('campaigns')}
          variant="outline"
          className="border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold"
        >
          <Target className="size-4 ml-2" />
          مشاهده مأموریت‌ها
        </Button>
        <Button
          onClick={() => onNavigate('leaderboard')}
          variant="outline"
          className="border-border/50 hover:border-[#D4AF37]/30 font-bold"
        >
          <Trophy className="size-4 ml-2" />
          رتبه‌بندی
        </Button>
        <Button
          onClick={() => onNavigate('templates')}
          variant="outline"
          className="border-border/50 hover:border-[#D4AF37]/30 font-bold"
        >
          <BookOpen className="size-4 ml-2" />
          کتابخانه قالب
        </Button>
      </motion.div>

      {/* Recent Submissions & Rewards - two columns on desktop */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Submissions */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="size-4 text-[#D4AF37]" />
                آخرین ارسال‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {submissions.slice(0, 5).map((sub) => {
                  const statusCfg = STATUS_CONFIG[sub.status];
                  const StatusIcon = statusCfg.icon;
                  return (
                    <div key={sub.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                      <span className="text-xl">{getPlatformDisplay(sub.platform).icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{sub.campaign}</p>
                        <p className="text-[10px] text-muted-foreground">{sub.date}</p>
                      </div>
                      <Badge className={`${statusCfg.bg} ${statusCfg.color} text-[10px] border-0 gap-1`}>
                        <StatusIcon className="size-3" />
                        {statusCfg.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Rewards */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Gift className="size-4 text-[#D4AF37]" />
                آخرین پاداش‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {rewards.slice(0, 5).map((rw) => (
                  <div key={rw.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                      <Coins className="size-4 text-[#D4AF37]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{rw.description}</p>
                      <p className="text-[10px] text-muted-foreground">{rw.date}</p>
                    </div>
                    <span className="text-sm font-bold text-[#D4AF37]">+{formatNumber(rw.amount)} mg</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 2: Campaigns / Missions                                               */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function CampaignsTab({ campaigns, onSubmitContent }: { campaigns: Campaign[]; onSubmitContent: (campaignId: string) => void }) {
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  const filteredCampaigns = showActiveOnly ? campaigns.filter(c => c.isActive) : campaigns;

  const toggleRules = (id: string) => {
    setExpandedRules(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Active/Inactive toggle */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h3 className="text-lg font-bold">مأموریت‌های فعال</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">فقط فعال‌ها</span>
          <Switch checked={showActiveOnly} onCheckedChange={setShowActiveOnly} />
        </div>
      </motion.div>

      {/* Campaigns Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredCampaigns.map((campaign, idx) => {
            const tierCfg = CAMPAIGN_TIER_COLORS[campaign.tier];
            const isExpanded = expandedRules.has(campaign.id);
            return (
              <motion.div
                key={campaign.id}
                variants={scaleIn}
                layout
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Card className={`overflow-hidden border-2 ${tierCfg.border} hover:shadow-lg transition-all h-full flex flex-col`}>
                  {/* Campaign Header with tier gradient */}
                  <div className={`bg-gradient-to-l ${TIER_COLORS[campaign.tier].gradient} p-4 text-white`}>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-white/20 text-white text-[10px] backdrop-blur-sm border-0">
                        {TIER_TITLES[campaign.tier]}
                      </Badge>
                      {!campaign.isActive && (
                        <Badge className="bg-red-500/80 text-white text-[10px] border-0">غیرفعال</Badge>
                      )}
                    </div>
                    <h4 className="font-bold text-sm">{campaign.title}</h4>
                  </div>

                  <CardContent className="p-4 flex-1 flex flex-col gap-3">
                    {/* Description */}
                    <p className="text-xs text-muted-foreground leading-relaxed">{campaign.description}</p>

                    {/* Reward & Views */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Coins className="size-4 text-[#D4AF37]" />
                        <span className="text-sm font-bold text-[#D4AF37]">{formatNumber(campaign.reward)} mg</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Eye className="size-3.5" />
                        <span>حداقل {formatNumber(campaign.minViews)} بازدید</span>
                      </div>
                    </div>

                    {/* Platforms */}
                    <div className="flex flex-wrap gap-1.5">
                      {campaign.platforms.map(p => (
                        <TooltipProvider key={p}>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="secondary" className="text-[10px] gap-1 px-2">
                                <span>{getPlatformDisplay(p).icon}</span>
                                {getPlatformDisplay(p).name}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{getPlatformDisplay(p).name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>

                    {/* Participants & End Date */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="size-3" />
                        {formatNumber(campaign.participants)} شرکت‌کننده
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {campaign.endDate}
                      </span>
                    </div>

                    {/* Collapsible Rules */}
                    <Collapsible open={isExpanded} onOpenChange={() => toggleRules(campaign.id)}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/30 transition-colors">
                        <span>📋 قوانین کمپین</span>
                        <ChevronDown className={`size-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ul className="mt-2 space-y-1 pr-4">
                          {campaign.rules.map((rule, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                              <span className="text-[#D4AF37] mt-0.5">•</span>
                              {rule}
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Submit Button */}
                    <Button
                      onClick={() => onSubmitContent(campaign.id)}
                      disabled={!campaign.isActive}
                      className={`w-full font-bold mt-auto ${
                        campaign.isActive
                          ? 'bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white hover:from-[#D4AF37]/90 hover:to-[#FFD700]/90 shadow-md shadow-[#D4AF37]/20'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                    >
                      <Send className="size-4 ml-2" />
                      ارسال محتوا
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filteredCampaigns.length === 0 && (
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-4">🎯</span>
          <p className="text-lg font-bold text-muted-foreground">مأموریت فعالی یافت نشد</p>
          <p className="text-sm text-muted-foreground mt-1">به‌زودی مأموریت‌های جدید اضافه خواهند شد</p>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 3: Submit Content                                                     */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function SubmitContentTab({ campaigns, preselectedCampaign }: {
  campaigns: Campaign[];
  preselectedCampaign?: string;
}) {
  const { addToast } = useAppStore();
  const [platform, setPlatform] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [campaignId, setCampaignId] = useState(preselectedCampaign || '');
  const [screenshotFile, setScreenshotFile] = useState<string | null>(null);
  const [analyticsFile, setAnalyticsFile] = useState<string | null>(null);
  const [ruleChecks, setRuleChecks] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlError, setUrlError] = useState('');

  /* Validate URL */
  const validateUrl = (url: string): boolean => {
    if (!url) { setUrlError(''); return true; }
    const urlPattern = /^https?:\/\/.+\..+/;
    const valid = urlPattern.test(url);
    setUrlError(valid ? '' : 'لطفاً یک URL معتبر وارد کنید');
    return valid;
  };

  /* Handle submit */
  const handleSubmit = async () => {
    if (!platform) { addToast('لطفاً پلتفرم را انتخاب کنید', 'error'); return; }
    if (!validateUrl(postUrl) || !postUrl) { addToast('لطفاً URL پست را وارد کنید', 'error'); return; }
    if (!campaignId) { addToast('لطفاً کمپین را انتخاب کنید', 'error'); return; }
    const allRulesChecked = Object.values(ruleChecks).every(Boolean);
    if (!allRulesChecked) { addToast('لطفاً تمام قوانین را تأیید کنید', 'error'); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/creator/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, postUrl, campaignId, screenshotFile, analyticsFile }),
      });
      if (res.ok) {
        addToast('محتوا با موفقیت ارسال شد! ✅', 'success');
        setPlatform(''); setPostUrl(''); setCampaignId('');
        setScreenshotFile(null); setAnalyticsFile(null);
        setRuleChecks({});
      } else {
        addToast('خطا در ارسال محتوا. لطفاً دوباره تلاش کنید.', 'error');
      }
    } catch {
      /* Fallback: show success with mock data */
      addToast('محتوا با موفقیت ارسال شد! (دمو) ✅', 'success');
      setPlatform(''); setPostUrl(''); setCampaignId('');
      setScreenshotFile(null); setAnalyticsFile(null);
      setRuleChecks({});
    }
    setIsSubmitting(false);
  };

  const activeCampaigns = campaigns.filter(c => c.isActive);

  /* Simulated file upload handler */
  const handleFileSelect = (type: 'screenshot' | 'analytics') => {
    const mockFileName = type === 'screenshot' ? 'screenshot_1403_10_10.png' : 'analytics_1403_10_10.png';
    if (type === 'screenshot') setScreenshotFile(mockFileName);
    else setAnalyticsFile(mockFileName);
    addToast(`${type === 'screenshot' ? 'اسکرین‌شات' : 'اسکرین‌شات آمار'} آپلود شد ✅`, 'success');
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <Card className="border-[#D4AF37]/20">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Send className="size-5 text-[#D4AF37]" />
              ارسال محتوای جدید
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Platform Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">پلتفرم محتوا</Label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {Object.entries(PLATFORMS).map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => setPlatform(key)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all hover:shadow-md ${
                      platform === key
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-md shadow-[#D4AF37]/20'
                        : 'border-border/50 hover:border-[#D4AF37]/30'
                    }`}
                  >
                    <span className="text-2xl">{info.icon}</span>
                    <span className={`text-[10px] font-medium ${platform === key ? 'text-[#D4AF37]' : 'text-muted-foreground'}`}>
                      {info.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Post URL */}
            <div className="space-y-2">
              <Label htmlFor="post-url" className="text-sm font-bold">لینک پست</Label>
              <div className="relative">
                <Link className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="post-url"
                  placeholder="https://instagram.com/p/..."
                  value={postUrl}
                  onChange={(e) => { setPostUrl(e.target.value); validateUrl(e.target.value); }}
                  className={`pr-10 text-left dir-ltr ${urlError ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                  dir="ltr"
                />
              </div>
              {urlError && <p className="text-xs text-red-500">{urlError}</p>}
            </div>

            {/* Campaign Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">کمپین</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب کمپین..." />
                </SelectTrigger>
                <SelectContent>
                  {activeCampaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <Badge className={`${TIER_COLORS[c.tier]?.badge || 'bg-muted text-muted-foreground'} text-[9px] border-0`}>
                          {TIER_TITLES[c.tier as keyof typeof TIER_TITLES] || c.tier}
                        </Badge>
                        <span>{c.title}</span>
                        <span className="text-[#D4AF37] text-xs">+{formatNumber(c.reward)} mg</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Screenshot Upload Areas */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-bold">اسکرین‌شات پست</Label>
                <button
                  onClick={() => handleFileSelect('screenshot')}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-all hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 ${
                    screenshotFile ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' : 'border-border/50'
                  }`}
                >
                  {screenshotFile ? (
                    <>
                      <CheckCircle className="size-6 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600">{screenshotFile}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="size-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">کلیک کنید یا فایل بکشید</span>
                      <span className="text-[10px] text-muted-foreground">PNG, JPG (حداکثر ۵ مگابایت)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">اسکرین‌شات آمار بازدید</Label>
                <button
                  onClick={() => handleFileSelect('analytics')}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-all hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 ${
                    analyticsFile ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' : 'border-border/50'
                  }`}
                >
                  {analyticsFile ? (
                    <>
                      <CheckCircle className="size-6 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600">{analyticsFile}</span>
                    </>
                  ) : (
                    <>
                      <BarChart3 className="size-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">کلیک کنید یا فایل بکشید</span>
                      <span className="text-[10px] text-muted-foreground">PNG, JPG (حداکثر ۵ مگابایت)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Rules Checklist */}
            <div className="space-y-3">
              <Label className="text-sm font-bold">قوانین و شرایط</Label>
              <div className="rounded-xl border border-border/50 p-4 space-y-3">
                {[
                  { id: 'r1', text: 'محتوا مطابق با قوانین کمپین است' },
                  { id: 'r2', text: 'اطلاعات و آمار ارائه‌شده واقعی هستند' },
                  { id: 'r3', text: 'محتوا توسط من شخصاً تولید شده است' },
                  { id: 'r4', text: 'لینک زرین گلد در محتوا یا بایو قرار دارد' },
                ].map(rule => (
                  <div key={rule.id} className="flex items-start gap-3">
                    <Checkbox
                      id={rule.id}
                      checked={ruleChecks[rule.id] || false}
                      onCheckedChange={(checked) => setRuleChecks(prev => ({ ...prev, [rule.id]: !!checked }))}
                    />
                    <Label htmlFor={rule.id} className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      {rule.text}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white hover:from-[#D4AF37]/90 hover:to-[#FFD700]/90 shadow-lg shadow-[#D4AF37]/20 font-bold py-6 text-base"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="size-4 ml-2 animate-spin" />
                  در حال ارسال...
                </>
              ) : (
                <>
                  <Send className="size-4 ml-2" />
                  ارسال محتوا
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 4: My Submissions                                                     */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function SubmissionsTab({ submissions }: { submissions: Submission[] }) {
  const [filter, setFilter] = useState<'all' | SubmissionStatus>('all');

  const filterTabs: Array<{ key: 'all' | SubmissionStatus; label: string }> = [
    { key: 'all', label: 'همه' },
    { key: 'pending', label: 'در انتظار' },
    { key: 'approved', label: 'تأیید شده' },
    { key: 'rejected', label: 'رد شده' },
    { key: 'ai_review', label: 'بررسی AI' },
  ];

  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.status === filter);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Filter tabs */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {filterTabs.map(ft => (
          <Button
            key={ft.key}
            size="sm"
            variant={filter === ft.key ? 'default' : 'outline'}
            className={
              filter === ft.key
                ? 'bg-[#D4AF37] text-white hover:bg-[#D4AF37]/90 text-xs'
                : 'text-xs border-border/50 text-muted-foreground hover:text-[#D4AF37] hover:border-[#D4AF37]/40'
            }
            onClick={() => setFilter(ft.key)}
          >
            {ft.label}
            {ft.key !== 'all' && (
              <Badge variant="secondary" className="mr-1.5 text-[9px] bg-black/10 text-white">
                {formatNumber(submissions.filter(s => s.status === ft.key).length)}
              </Badge>
            )}
          </Button>
        ))}
      </motion.div>

      {/* Submissions List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((sub, idx) => {
            const statusCfg = STATUS_CONFIG[sub.status];
            const StatusIcon = statusCfg.icon;
            const platformInfo = getPlatformDisplay(sub.platform);

            return (
              <motion.div
                key={sub.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
              >
                <Card className="overflow-hidden hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      {/* Platform icon */}
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-xl">
                        {platformInfo.icon}
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold">{sub.campaign}</span>
                          <Badge className={`${statusCfg.bg} ${statusCfg.color} text-[10px] border-0 gap-1`}>
                            <StatusIcon className="size-3" />
                            {statusCfg.label}
                          </Badge>
                        </div>

                        {/* URL (clickable) */}
                        <a
                          href={sub.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 truncate max-w-xs"
                        >
                          <ExternalLink className="size-3 shrink-0" />
                          <span className="truncate" dir="ltr">{sub.url}</span>
                        </a>

                        {/* AI Score bar */}
                        {sub.aiScore > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">امتیاز AI:</span>
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                              <motion.div
                                className={`h-full rounded-full ${
                                  sub.aiScore >= 80 ? 'bg-emerald-500' : sub.aiScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${sub.aiScore}%` }}
                                transition={{ duration: 0.8 }}
                              />
                            </div>
                            <span className={`text-[10px] font-bold ${
                              sub.aiScore >= 80 ? 'text-emerald-500' : sub.aiScore >= 60 ? 'text-amber-500' : 'text-red-500'
                            }`}>{sub.aiScore}%</span>
                          </div>
                        )}

                        {/* Views */}
                        {sub.views > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Eye className="size-3" />
                            {formatNumber(sub.views)} بازدید
                          </div>
                        )}

                        {/* Admin note for rejected */}
                        {sub.status === 'rejected' && sub.adminNote && (
                          <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 p-3 mt-1">
                            <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-red-600 dark:text-red-400 leading-relaxed">{sub.adminNote}</p>
                          </div>
                        )}
                      </div>

                      {/* Right side info */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1 shrink-0">
                        {sub.reward > 0 && (
                          <div className="flex items-center gap-1">
                            <Coins className="size-3.5 text-[#D4AF37]" />
                            <span className="text-sm font-bold text-[#D4AF37]">+{formatNumber(sub.reward)} mg</span>
                          </div>
                        )}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="size-3" />
                          {sub.date}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-4">📝</span>
          <p className="text-lg font-bold text-muted-foreground">ارسالی یافت نشد</p>
          <p className="text-sm text-muted-foreground mt-1">هنوز محتوایی ارسال نکرده‌اید</p>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 5: Leaderboard                                                        */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function LeaderboardTab({ entries }: { entries: LeaderEntry[] }) {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly');

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Period toggle */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Trophy className="size-5 text-[#D4AF37]" />
          جدول رتبه‌بندی
        </h3>
        <div className="flex items-center rounded-lg border border-border/50 p-1">
          <Button
            size="sm"
            variant={period === 'weekly' ? 'default' : 'ghost'}
            className={`text-xs ${period === 'weekly' ? 'bg-[#D4AF37] text-white' : ''}`}
            onClick={() => setPeriod('weekly')}
          >
            هفتگی
          </Button>
          <Button
            size="sm"
            variant={period === 'monthly' ? 'default' : 'ghost'}
            className={`text-xs ${period === 'monthly' ? 'bg-[#D4AF37] text-white' : ''}`}
            onClick={() => setPeriod('monthly')}
          >
            ماهانه
          </Button>
        </div>
      </motion.div>

      {/* Top 3 podium */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-3 gap-3 items-end mb-6">
          {/* 2nd place */}
          {entries[1] && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-2">
                <div className="size-14 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center border-3 border-gray-300 shadow-lg">
                  <span className="text-lg font-bold text-white">۲</span>
                </div>
                <Medal className="absolute -top-1 -right-1 size-5 text-gray-400" />
              </div>
              <p className="text-xs font-bold truncate max-w-full">{entries[1].name}</p>
              <p className="text-[10px] text-muted-foreground">{formatNumber(entries[1].goldEarned)} mg</p>
              <div className="mt-2 w-full h-16 rounded-t-lg bg-gradient-to-t from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
            </motion.div>
          )}

          {/* 1st place */}
          {entries[0] && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-2">
                <div className="size-18 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border-3 border-yellow-300 shadow-xl shadow-yellow-400/30">
                  <Crown className="size-5 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 text-xl">👑</div>
              </div>
              <p className="text-sm font-extrabold truncate max-w-full text-[#D4AF37]">{entries[0].name}</p>
              <p className="text-xs font-bold text-[#D4AF37]">{formatNumber(entries[0].goldEarned)} mg</p>
              <div className="mt-2 w-full h-24 rounded-t-lg bg-gradient-to-t from-yellow-300 to-yellow-500 dark:from-yellow-700 dark:to-yellow-500" />
            </motion.div>
          )}

          {/* 3rd place */}
          {entries[2] && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-2">
                <div className="size-14 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center border-3 border-amber-600 shadow-lg">
                  <span className="text-lg font-bold text-white">۳</span>
                </div>
                <Medal className="absolute -top-1 -right-1 size-5 text-amber-700" />
              </div>
              <p className="text-xs font-bold truncate max-w-full">{entries[2].name}</p>
              <p className="text-[10px] text-muted-foreground">{formatNumber(entries[2].goldEarned)} mg</p>
              <div className="mt-2 w-full h-12 rounded-t-lg bg-gradient-to-t from-amber-200 to-amber-400 dark:from-amber-800 dark:to-amber-700" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Full leaderboard list */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-2">
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-1">
                {entries.map((entry, idx) => {
                  const tierCfg = TIER_COLORS[entry.level.tier];
                  const isCurrentUser = entry.name === 'سارا احمدی';
                  return (
                    <motion.div
                      key={entry.rank}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
                        isCurrentUser
                          ? 'border-2 border-[#D4AF37]/40 bg-[#D4AF37]/5 shadow-md shadow-[#D4AF37]/10'
                          : 'hover:bg-muted/30'
                      }`}
                    >
                      {/* Rank */}
                      <div className="flex size-8 shrink-0 items-center justify-center">
                        {getRankDisplay(entry.rank)}
                      </div>

                      {/* Name & level */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-sm font-bold truncate ${isCurrentUser ? 'text-[#D4AF37]' : ''}`}>
                            {entry.name}
                            {isCurrentUser && <span className="text-[10px] text-[#D4AF37]">(شما)</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge className={`${tierCfg.badge} text-[8px] border-0 px-1.5 py-0`}>
                            {TIER_TITLES[entry.level.tier]}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{formatNumber(entry.posts)} پست</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 shrink-0 text-right">
                        <div className="hidden sm:block">
                          <p className="text-[10px] text-muted-foreground">امتیاز</p>
                          <p className="text-xs font-bold tabular-nums">{formatNumber(entry.score)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">طلای کسب‌شده</p>
                          <p className="text-xs font-bold tabular-nums text-[#D4AF37]">{formatNumber(entry.goldEarned)} mg</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 6: Template Library                                                   */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function TemplatesTab() {
  const { addToast } = useAppStore();
  const [activeSection, setActiveSection] = useState<'ideas' | 'captions' | 'hashtags' | 'scripts' | 'tips'>('ideas');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      addToast('کپی شد! ✅', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const sections = [
    { key: 'ideas' as const, label: 'ایده‌های ویدیویی', icon: <Lightbulb className="size-3.5" /> },
    { key: 'captions' as const, label: 'کپشن آماده', icon: <FileText className="size-3.5" /> },
    { key: 'hashtags' as const, label: 'پک هشتگ', icon: <Hash className="size-3.5" /> },
    { key: 'scripts' as const, label: 'اسکریپت', icon: <Mic className="size-3.5" /> },
    { key: 'tips' as const, label: 'نکات پلتفرم', icon: <Sparkles className="size-3.5" /> },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Section selector */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {sections.map(sec => (
          <Button
            key={sec.key}
            size="sm"
            variant={activeSection === sec.key ? 'default' : 'outline'}
            className={
              activeSection === sec.key
                ? 'bg-[#D4AF37] text-white hover:bg-[#D4AF37]/90 text-xs'
                : 'text-xs border-border/50 text-muted-foreground hover:text-[#D4AF37]'
            }
            onClick={() => setActiveSection(sec.key)}
          >
            {sec.icon}
            <span className="ml-1">{sec.label}</span>
          </Button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Video Ideas */}
        {activeSection === 'ideas' && (
          <motion.div key="ideas" variants={itemVariants} initial="hidden" animate="show" exit="hidden" className="space-y-3">
            {MOCK_VIDEO_IDEAS.map(idea => {
              const platInfo = getPlatformDisplay(idea.platform);
              return (
                <Card key={idea.id} className="hover:shadow-md hover:border-[#D4AF37]/20 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10 text-xl">
                        <Video className="size-5 text-[#D4AF37]" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold">{idea.title}</h4>
                          <Badge variant="secondary" className="text-[9px] gap-1">
                            <span>{platInfo.icon}</span>
                            {platInfo.name}
                          </Badge>
                          <Badge variant="secondary" className="text-[9px]">
                            <Clock className="size-3 ml-1" />
                            {idea.duration}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{idea.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}

        {/* Caption Templates */}
        {activeSection === 'captions' && (
          <motion.div key="captions" variants={itemVariants} initial="hidden" animate="show" exit="hidden" className="space-y-3">
            {MOCK_CAPTIONS.map(cap => {
              const platInfo = getPlatformDisplay(cap.platform);
              return (
                <Card key={cap.id} className="hover:shadow-md hover:border-[#D4AF37]/20 transition-all">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[9px] gap-1">
                          <span>{platInfo.icon}</span>
                          {platInfo.name}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] border-[#D4AF37]/30 text-[#D4AF37]">{cap.category}</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(cap.text, cap.id)}
                        className="text-xs text-[#D4AF37] hover:text-[#D4AF37]/80 hover:bg-[#D4AF37]/10"
                      >
                        {copiedId === cap.id ? <CheckCircle className="size-3.5 ml-1" /> : <Copy className="size-3.5 ml-1" />}
                        {copiedId === cap.id ? 'کپی شد' : 'کپی'}
                      </Button>
                    </div>
                    <pre className="whitespace-pre-wrap text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3 font-sans" dir="rtl">
                      {cap.text}
                    </pre>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}

        {/* Hashtag Packs */}
        {activeSection === 'hashtags' && (
          <motion.div key="hashtags" variants={itemVariants} initial="hidden" animate="show" exit="hidden" className="space-y-3">
            {MOCK_HASHTAGS.map(pack => (
              <Card key={pack.id} className="hover:shadow-md hover:border-[#D4AF37]/20 transition-all">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold">{pack.name}</h4>
                      <Badge variant="outline" className="text-[9px] border-[#D4AF37]/30 text-[#D4AF37] mt-1">{pack.category}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(pack.tags.join(' '), pack.id)}
                      className="text-xs text-[#D4AF37] hover:text-[#D4AF37]/80 hover:bg-[#D4AF37]/10"
                    >
                      {copiedId === pack.id ? <CheckCircle className="size-3.5 ml-1" /> : <Copy className="size-3.5 ml-1" />}
                      {copiedId === pack.id ? 'کپی شد' : 'کپی همه'}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pack.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] bg-[#D4AF37]/5 text-[#D4AF37]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Script Suggestions */}
        {activeSection === 'scripts' && (
          <motion.div key="scripts" variants={itemVariants} initial="hidden" animate="show" exit="hidden" className="space-y-4">
            {MOCK_SCRIPTS.map(script => {
              const platInfo = getPlatformDisplay(script.platform);
              return (
                <Card key={script.id} className="overflow-hidden hover:shadow-md hover:border-[#D4AF37]/20 transition-all">
                  <div className="bg-gradient-to-l from-[#D4AF37]/10 to-transparent p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic className="size-4 text-[#D4AF37]" />
                      <h4 className="text-sm font-bold">{script.title}</h4>
                    </div>
                    <Badge variant="secondary" className="text-[9px] gap-1">
                      <span>{platInfo.icon}</span>
                      {platInfo.name}
                    </Badge>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <pre className="whitespace-pre-wrap text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-4 font-sans" dir="rtl">
                      {script.script}
                    </pre>
                    <div className="space-y-2">
                      <p className="text-xs font-bold flex items-center gap-1">
                        <Lightbulb className="size-3.5 text-[#D4AF37]" />
                        نکات تولید:
                      </p>
                      <ul className="space-y-1 pr-4">
                        {script.tips.map((tip, i) => (
                          <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                            <span className="text-[#D4AF37]">✦</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(script.script, script.id)}
                      className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-xs"
                    >
                      {copiedId === script.id ? <CheckCircle className="size-3.5 ml-1" /> : <Copy className="size-3.5 ml-1" />}
                      {copiedId === script.id ? 'کپی شد' : 'کپی اسکریپت'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}

        {/* Platform-specific Tips */}
        {activeSection === 'tips' && (
          <motion.div key="tips" variants={itemVariants} initial="hidden" animate="show" exit="hidden" className="space-y-3">
            {[
              { platform: 'instagram', tips: ['از هشتگ‌های ریلز استفاده کنید', 'کاور ویدیو جذاب بسازید', 'Call to Action در ۳ ثانیه اول', 'موزیک ترند و بدون کپی‌رایت', 'زیرنویس فارسی الزامی'] },
              { platform: 'tiktok', tips: ['ویدیو‌های ۱۵-۶۰ ثانیه بهترین عملکرد را دارند', 'هوک قوی در ۲ ثانیه اول', 'از ترندهای فعلی استفاده کنید', 'متن روی ویدیو اضافه کنید', 'صدای واضح و باکیفیت'] },
              { platform: 'youtube_shorts', tips: ['قابل قفل بودن (Loop) مهم است', 'عنوان جذاب و کوتاه', 'تامنیل (Thumbnail) حرفه‌ای', 'زیرنویس فارسی', 'متحرک و پرانرژی باشید'] },
              { platform: 'telegram', tips: ['متن خوانا و ساختاریافته', 'تصاویر باکیفیت و مرتبط', 'لینک دعوت در انتها', 'استفاده از ایموجی مناسب', 'طول متن متعادل'] },
              { platform: 'twitter', tips: ['تویت کوتاه و تأثیرگذار', 'هشتگ مرتبط (۱-۲ عدد)', 'متن Thread برای موضوعات طولانی', 'تصویر یا ویدیو ضمیمه کنید', 'زمان ارسال بهینه: صبح و عصر'] },
              { platform: 'aparat', tips: ['عنوان SEO-friendly', 'توضیحات کامل و مرتبط', 'کیفیت ویدیو حداقل HD', 'تصاویر بندانگشتی جذاب', 'دسته‌بندی صحیح'] },
            ].map(item => {
              const platInfo = getPlatformDisplay(item.platform);
              return (
                <Card key={item.platform} className="hover:shadow-md hover:border-[#D4AF37]/20 transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <span className="text-xl">{platInfo.icon}</span>
                      {platInfo.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {item.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="size-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 7: Creator Profile                                                    */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function ProfileTab({ profile, rewards }: { profile: CreatorProfile; rewards: RewardEntry[] }) {
  const { addToast } = useAppStore();
  const [copiedReferral, setCopiedReferral] = useState(false);
  const tierCfg = TIER_COLORS[profile.level.tier];

  /* Copy referral link */
  const copyReferralLink = async () => {
    const link = `https://zarringold.ir/ref/${profile.referralCode}`;
    const ok = await copyToClipboard(link);
    if (ok) {
      setCopiedReferral(true);
      addToast('لینک دعوت کپی شد! ✅', 'success');
      setTimeout(() => setCopiedReferral(false), 2000);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Profile Card */}
      <motion.div variants={itemVariants}>
        <Card className={`overflow-hidden border-2 ${tierCfg.border}`}>
          {/* Header with gradient */}
          <div className={`bg-gradient-to-l ${tierCfg.gradient} p-8 text-white text-center relative overflow-hidden`}>
            {/* Decorative circles */}
            <div className="absolute -top-10 -left-10 size-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-5 -right-5 size-24 rounded-full bg-white/5" />

            <div className="relative">
              {/* Avatar */}
              <div className="mx-auto mb-3 size-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40">
                <User className="size-8 text-white/90" />
              </div>
              <h3 className="text-xl font-extrabold">{profile.name}</h3>
              <p className="text-sm text-white/80 mt-1">{profile.bio}</p>
              <Badge className="mt-2 bg-white/20 text-white border-0 text-xs backdrop-blur-sm gap-1">
                <Crown className="size-3" />
                سطح {formatNumber(profile.level.level)} — {TIER_TITLES[profile.level.tier]}
              </Badge>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Social Links */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">لینک‌های اجتماعی</Label>
              <div className="flex flex-wrap gap-2">
                {profile.socialLinks.map((link, i) => {
                  const platInfo = getPlatformDisplay(link.platform);
                  return (
                    <Badge key={i} variant="outline" className="text-xs gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-muted/50">
                      <span>{platInfo.icon}</span>
                      <span className="max-w-[150px] truncate" dir="ltr">{link.url}</span>
                      <ExternalLink className="size-3 text-muted-foreground" />
                    </Badge>
                  );
                })}
                <Button variant="outline" size="sm" className="text-xs gap-1 h-7">
                  <Settings className="size-3" />
                  ویرایش
                </Button>
              </div>
            </div>

            {/* Creator Stats Overview */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: <Coins className="size-4" />, label: 'طلای کسب‌شده', value: `${formatNumber(profile.totalGoldEarned)} mg`, color: 'text-[#D4AF37]' },
                { icon: <FileText className="size-4" />, label: 'کل پست‌ها', value: formatNumber(profile.totalPosts), color: 'text-blue-500' },
                { icon: <Eye className="size-4" />, label: 'کل بازدیدها', value: formatNumber(profile.totalViews), color: 'text-purple-500' },
                { icon: <Calendar className="size-4" />, label: 'تاریخ عضویت', value: profile.joinDate, color: 'text-emerald-500' },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 rounded-lg bg-muted/50 p-3 text-center">
                  <div className={stat.color}>{stat.icon}</div>
                  <p className="text-sm font-bold tabular-nums">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Level Progress Visualization */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">پیشرفت سطح</Label>
              <div className="flex items-center gap-3">
                {/* Level dots */}
                <div className="flex items-center gap-1 flex-1">
                  {(Object.keys(TIER_TITLES) as CreatorTier[]).map((tier, i) => {
                    const tierIdx = Object.keys(TIER_TITLES).indexOf(profile.level.tier);
                    const isActive = i <= tierIdx;
                    const isCurrent = tier === profile.level.tier;
                    return (
                      <TooltipProvider key={tier}>
                        <Tooltip>
                          <TooltipTrigger>
                            <motion.div
                              className={`size-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                isCurrent
                                  ? 'border-[#D4AF37] bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/30 scale-110'
                                  : isActive
                                  ? 'border-[#D4AF37]/60 bg-[#D4AF37]/20'
                                  : 'border-border/30 bg-muted/30'
                              }`}
                              animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                              transition={{ repeat: Infinity, duration: 2 }}
                            >
                              <Crown className={`size-3.5 ${isCurrent || isActive ? 'text-[#D4AF37]' : 'text-muted-foreground'}`} />
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{TIER_TITLES[tier]}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
              <p className="text-center text-[10px] text-muted-foreground">
                سطح فعلی: <span className={`font-bold ${tierCfg.text}`}>{TIER_TITLES[profile.level.tier]}</span>
                — مرحله بعد: <span className="font-bold">{TIER_TITLES[(Object.keys(TIER_TITLES) as CreatorTier[])[Math.min(Object.keys(TIER_TITLES).indexOf(profile.level.tier) + 1, 5)]]}</span>
              </p>
            </div>

            <Separator />

            {/* Referral Link Generator */}
            <div className="space-y-3">
              <Label className="text-sm font-bold flex items-center gap-2">
                <Share2 className="size-4 text-[#D4AF37]" />
                لینک دعوت
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-border/50 bg-muted/30 px-4 py-2.5 text-xs truncate" dir="ltr">
                  https://zarringold.ir/ref/{profile.referralCode}
                </div>
                <Button
                  onClick={copyReferralLink}
                  variant="outline"
                  className="shrink-0 border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                >
                  {copiedReferral ? <CheckCircle className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>

              {/* Referral Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'کلیک‌ها', value: formatNumber(profile.referralClicks), icon: <Eye className="size-3.5 text-blue-500" /> },
                  { label: 'ثبت‌نام‌ها', value: formatNumber(profile.referralSignups), icon: <Users className="size-3.5 text-emerald-500" /> },
                  { label: 'خریدها', value: formatNumber(profile.referralPurchases), icon: <CheckCircle className="size-3.5 text-[#D4AF37]" /> },
                ].map((rs, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 rounded-lg border border-border/50 p-3 text-center">
                    {rs.icon}
                    <p className="text-sm font-bold tabular-nums">{rs.value}</p>
                    <p className="text-[10px] text-muted-foreground">{rs.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Rewards History Table */}
            <div className="space-y-3">
              <Label className="text-sm font-bold flex items-center gap-2">
                <Wallet className="size-4 text-[#D4AF37]" />
                تاریخچه پاداش‌ها
              </Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {rewards.map((rw) => (
                  <div key={rw.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                      <Coins className="size-4 text-[#D4AF37]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{rw.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{rw.date}</span>
                        <Badge variant="outline" className="text-[8px] border-border/30">{rw.type}</Badge>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#D4AF37]">+{formatNumber(rw.amount)} mg</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Main Component: CreatorHub                                                */
/* ═══════════════════════════════════════════════════════════════════════════════ */

export default function CreatorHub() {
  const { user } = useAppStore();
  const { t } = useTranslation();
  const { addToast } = useAppStore();

  /* ── State ── */
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [preselectedCampaign, setPreselectedCampaign] = useState<string | undefined>();

  /* Data state (fallback to mock) */
  const [profile, setProfile] = useState<CreatorProfile>(MOCK_PROFILE);
  const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS);
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>(MOCK_LEADERBOARD);
  const [rewards, setRewards] = useState<RewardEntry[]>(MOCK_REWARDS);

  /* ── Fetch data on mount ── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, submissionsRes, campaignsRes, leaderboardRes, rewardsRes] = await Promise.all([
          fetch('/api/creator/profile'),
          fetch('/api/creator/submissions'),
          fetch('/api/creator/campaigns'),
          fetch('/api/creator/leaderboard'),
          fetch('/api/creator/rewards'),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          if (data.profile) setProfile(data.profile);
        }
        if (submissionsRes.ok) {
          const data = await submissionsRes.json();
          if (data.submissions) setSubmissions(data.submissions);
        }
        if (campaignsRes.ok) {
          const data = await campaignsRes.json();
          if (data.campaigns) setCampaigns(data.campaigns);
        }
        if (leaderboardRes.ok) {
          const data = await leaderboardRes.json();
          if (data.leaders) setLeaderboard(data.leaders);
        }
        if (rewardsRes.ok) {
          const data = await rewardsRes.json();
          if (data.rewards) setRewards(data.rewards);
        }
      } catch {
        /* Silently use mock data as fallback */
        console.warn('[CreatorHub] API unavailable, using mock data');
      }
      setLoading(false);
    };

    /* Simulate loading delay for skeleton animation */
    const timer = setTimeout(fetchData, 600);
    return () => clearTimeout(timer);
  }, []);

  /* ── Navigate to specific tab ── */
  const navigateToTab = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  /* ── Handle campaign submit redirect ── */
  const handleSubmitContent = useCallback((campaignId: string) => {
    setPreselectedCampaign(campaignId);
    setActiveTab('submit');
  }, []);

  /* ── Tab configuration ── */
  const tabs = [
    { key: 'dashboard', label: 'داشبورد خالق', icon: <BarChart3 className="size-3.5" /> },
    { key: 'campaigns', label: 'مأموریت‌ها', icon: <Target className="size-3.5" /> },
    { key: 'submit', label: 'ارسال محتوا', icon: <Send className="size-3.5" /> },
    { key: 'submissions', label: 'محتوای من', icon: <FileText className="size-3.5" /> },
    { key: 'leaderboard', label: 'رتبه‌بندی', icon: <Trophy className="size-3.5" /> },
    { key: 'templates', label: 'کتابخانه قالب', icon: <BookOpen className="size-3.5" /> },
    { key: 'profile', label: 'پروفایل خالق', icon: <User className="size-3.5" /> },
  ];

  /* ── Loading state with skeleton ── */
  if (loading) {
    return <CreatorHubSkeleton />;
  }

  return (
    <motion.div
      className="mx-auto max-w-6xl pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── Page Header ── */}
      <motion.div
        className="flex flex-col items-center gap-2 py-6 text-center mb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <Crown className="size-7 text-[#D4AF37]" />
          <h1 className="text-2xl font-extrabold">
            <span className="bg-gradient-to-l from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent">
              باشگاه خالقان طلایی
            </span>
          </h1>
          <Sparkles className="size-5 text-[#D4AF37]" />
        </div>
        <p className="text-sm text-muted-foreground max-w-md">
          محتوا بسازید، طلای واقعی کسب کنید! 🪙
        </p>
      </motion.div>

      {/* ── Main Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tab navigation - scrollable on mobile */}
        <div className="mb-6 overflow-x-auto -mx-4 px-4">
          <TabsList className="inline-flex w-max min-w-full sm:min-w-0 h-auto gap-1 p-1.5 bg-muted/50 rounded-xl">
            {tabs.map(tab => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-[#D4AF37]/20 ${
                  activeTab === tab.key ? '' : 'text-muted-foreground hover:text-[#D4AF37] hover:bg-[#D4AF37]/5'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── Tab 1: Creator Dashboard ── */}
        <TabsContent value="dashboard">
          <DashboardTab
            profile={profile}
            submissions={submissions}
            rewards={rewards}
            onNavigate={navigateToTab}
          />
        </TabsContent>

        {/* ── Tab 2: Campaigns / Missions ── */}
        <TabsContent value="campaigns">
          <CampaignsTab
            campaigns={campaigns}
            onSubmitContent={handleSubmitContent}
          />
        </TabsContent>

        {/* ── Tab 3: Submit Content ── */}
        <TabsContent value="submit">
          <SubmitContentTab
            campaigns={campaigns}
            preselectedCampaign={preselectedCampaign}
          />
        </TabsContent>

        {/* ── Tab 4: My Submissions ── */}
        <TabsContent value="submissions">
          <SubmissionsTab submissions={submissions} />
        </TabsContent>

        {/* ── Tab 5: Leaderboard ── */}
        <TabsContent value="leaderboard">
          <LeaderboardTab entries={leaderboard} />
        </TabsContent>

        {/* ── Tab 6: Template Library ── */}
        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>

        {/* ── Tab 7: Creator Profile ── */}
        <TabsContent value="profile">
          <ProfileTab profile={profile} rewards={rewards} />
        </TabsContent>
      </Tabs>

      {/* ── Confetti animation (CSS-only) for celebrations ── */}
      <style jsx global>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .confetti-particle {
          position: fixed;
          top: -10px;
          z-index: 9999;
          pointer-events: none;
          animation: confetti-fall 3s ease-out forwards;
        }
      `}</style>
    </motion.div>
  );
}

'use client';

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Education Center — In-App Gold Academy                                        */
/*  A comprehensive education platform for gold trading knowledge                  */
/*  Persian RTL text with English comments                                        */
/* ═══════════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Play,
  FileText,
  Heart,
  Clock,
  Eye,
  Search,
  GraduationCap,
  TrendingUp,
  Landmark,
  ShoppingCart,
  ShieldAlert,
  Star,
  Trophy,
  Flame,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  X,
  BookOpen,
  BarChart3,
  Zap,
  Award,
  Filter,
  Sparkles,
  Crown,
  Target,
  Calendar,
  Bookmark,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useQuickAction } from '@/hooks/useQuickAction';
import { formatNumber } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Types & Interfaces                                                           */
/* ═══════════════════════════════════════════════════════════════════════════════ */

type LessonType = 'video' | 'article';
type LessonCategory = 'technical_analysis' | 'economy' | 'buying_tips' | 'risk_management';
type FilterCategory = 'all' | LessonCategory;
type FilterType = 'all' | LessonType;

interface Lesson {
  id: string;
  title: string;
  titleFa: string;
  description: string;
  type: LessonType;
  category: LessonCategory;
  duration: number; // seconds
  views: number;
  isFavorite: boolean;
  progress: number; // 0-100
  isCompleted: boolean;
  isPremium: boolean;
  thumbnail: string | null;
  content?: string; // article body (mock HTML-like text)
  date: string;
  instructor: string;
}

interface LearningStats {
  lessonsCompleted: number;
  totalLessons: number;
  totalTimeSpent: number; // minutes
  streakDays: number;
  lastActiveDate: string;
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Constants & Configurations                                                    */
/* ═══════════════════════════════════════════════════════════════════════════════ */

const GOLD = '#D4AF37';
const GOLD_LIGHT = '#FFD700';

/* Category display configuration */
const CATEGORY_CONFIG: Record<LessonCategory, { label: string; icon: typeof TrendingUp; color: string; bg: string }> = {
  technical_analysis: {
    label: 'تحلیل تکنیکال',
    icon: BarChart3,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  economy: {
    label: 'اقتصاد',
    icon: Landmark,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
  },
  buying_tips: {
    label: 'نکات خرید',
    icon: ShoppingCart,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  risk_management: {
    label: 'مدیریت ریسک',
    icon: ShieldAlert,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
};

/* Type display configuration */
const TYPE_CONFIG: Record<LessonType, { label: string; icon: typeof Play }> = {
  video: { label: 'ویدیو', icon: Play },
  article: { label: 'مقاله', icon: FileText },
};

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Animation Variants                                                           */
/* ═══════════════════════════════════════════════════════════════════════════════ */

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const fadeInScale: any = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
};

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  CSS Keyframe Animations                                                      */
/* ═══════════════════════════════════════════════════════════════════════════════ */

const EDUCATION_ANIMATIONS = `
@keyframes edu-heart-pop {
  0% { transform: scale(1); }
  30% { transform: scale(1.35); }
  60% { transform: scale(0.95); }
  100% { transform: scale(1); }
}
@keyframes edu-progress-shine {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes edu-float-badge {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
@keyframes edu-pulse-gold {
  0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.4); }
  50% { box-shadow: 0 0 0 8px rgba(212,175,55,0); }
}
.edu-heart-pop {
  animation: edu-heart-pop 0.4s ease-out;
}
.edu-progress-shine {
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: edu-progress-shine 2s linear infinite;
}
.edu-float-badge {
  animation: edu-float-badge 3s ease-in-out infinite;
}
.edu-pulse-gold {
  animation: edu-pulse-gold 2s ease-in-out infinite;
}
`;

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Mock Data — 14 Comprehensive Lessons in Persian                              */
/* ═══════════════════════════════════════════════════════════════════════════════ */

const MOCK_LESSONS: Lesson[] = [
  /* ── Technical Analysis (4 lessons) ── */
  {
    id: '1',
    title: 'Candlestick Chart Patterns',
    titleFa: 'آشنایی با نمودار شمعی (کندل‌استیک)',
    description: 'یادگیری انواع کندل‌ها و نحوه خواندن نمودار شمعی برای تحلیل رفتار قیمت طلا در بازار',
    type: 'video',
    category: 'technical_analysis',
    duration: 180,
    views: 1250,
    isFavorite: false,
    progress: 75,
    isCompleted: false,
    isPremium: false,
    thumbnail: null,
    content: '',
    date: '1403/10/01',
    instructor: 'دکتر محمد رضایی',
  },
  {
    id: '2',
    title: 'Support and Resistance Levels',
    titleFa: 'خطوط حمایت و مقاومت در طلا',
    description: 'شناسایی سطوح کلیدی حمایت و مقاومت و استفاده از آنها در تصمیمات معاملاتی طلا',
    type: 'article',
    category: 'technical_analysis',
    duration: 420,
    views: 890,
    isFavorite: true,
    progress: 100,
    isCompleted: true,
    isPremium: false,
    thumbnail: null,
    content: `خطوط حمایت و مقاومت از مفاهیم پایه در تحلیل تکنیکال هستند. سطح حمایت قیمتی است که تقاضا برای خرید طلا به اندازه‌ای زیاد می‌شود که از کاهش بیشتر قیمت جلوگیری می‌کند.\n\n\nروش‌های شناسایی سطوح کلیدی:\n\n۱. استفاده از نقاط عطف قبلی قیمت\n۲. خطوط ترند صعودی و نزولی\n۳. سطوح فیبوناچی\n۴. میانگین‌های متحرک\n\n\nنکات مهم معاملاتی:\n\nوقتی قیمت به سطح حمایت یا مقاومت نزدیک می‌شود، حجم معاملات معمولاً افزایش می‌یابد. شکست معتبر یک سطح زمانی اتفاق می‌افتد که قیمت با حجم بالا و بدنه کندل قوی از آن عبور کند.\n\n\nدر بازار طلا، سطوح رound اعداد مانند ۲۰۰۰، ۲۱۰۰ دلار برای اونس اهمیت روانی بالایی دارند.`,
    date: '1403/10/03',
    instructor: 'مهندس سارا احمدی',
  },
  {
    id: '3',
    title: 'Trend Lines and Channels',
    titleFa: 'خطوط ترند و کانال‌های قیمتی',
    description: 'رسم و تفسیر خطوط ترند و کانال‌های قیمتی برای پیش‌بینی جهت حرکت قیمت طلا',
    type: 'video',
    category: 'technical_analysis',
    duration: 300,
    views: 760,
    isFavorite: false,
    progress: 30,
    isCompleted: false,
    isPremium: true,
    thumbnail: null,
    content: '',
    date: '1403/10/05',
    instructor: 'دکتر محمد رضایی',
  },
  {
    id: '4',
    title: 'Volume Analysis in Gold Trading',
    titleFa: 'تحلیل حجم معاملات در بازار طلا',
    description: 'آشنایی با اهمیت حجم معاملات و نحوه استفاده از آن برای تأیید سیگنال‌های خرید و فروش',
    type: 'article',
    category: 'technical_analysis',
    duration: 360,
    views: 620,
    isFavorite: false,
    progress: 0,
    isCompleted: false,
    isPremium: false,
    thumbnail: null,
    content: `حجم معاملات یکی از مهم‌ترین شاخص‌ها در تحلیل بازار طلاست. حجم نشان‌دهنده تعداد معاملات انجام شده در یک دوره زمانی مشخص است.\n\n\nقواعد کلیدی تحلیل حجم:\n\n۱. افزایش حجم در جهت ترند فعلی، تأیید ادامه آن ترند است\n۲. کاهش حجم هشدار ضعیف شدن ترند را می‌دهد\n۳. حجم بالای ناگهانی نشان‌دهنده تغییر احتمالی جهت بازار است\n۴. حجم پایین در بازار رنج نشان‌دهنده عدم قطعیت است\n\n\nدر بازار طلای ایران، حجم معاملات در ساعات باز شدن بازار جهانی (ساعت ۱۵:۳۰ به وقت تهران) به طور قابل توجهی افزایش می‌یابد.`,
    date: '1403/10/07',
    instructor: 'مهندس علی محمدی',
  },

  /* ── Economy (3 lessons) ── */
  {
    id: '5',
    title: 'Impact of Inflation on Gold Prices',
    titleFa: 'تأثیر تورم بر قیمت طلا',
    description: 'بررسی رابطه بین تورم و قیمت طلا و چرا طلا در برابر تورم یک دارایی حفاظتی است',
    type: 'video',
    category: 'economy',
    duration: 240,
    views: 1580,
    isFavorite: true,
    progress: 100,
    isCompleted: true,
    isPremium: false,
    thumbnail: null,
    content: '',
    date: '1403/10/02',
    instructor: 'دکتر فاطمه نوری',
  },
  {
    id: '6',
    title: 'Interest Rates and Gold Correlation',
    titleFa: 'نرخ بهره و ارتباط آن با بازار طلا',
    description: 'تحلیل تأثیر سیاست‌های پولی فدرال رزرو و نرخ بهره بر قیمت جهانی طلا',
    type: 'article',
    category: 'economy',
    duration: 480,
    views: 940,
    isFavorite: false,
    progress: 50,
    isCompleted: false,
    isPremium: true,
    thumbnail: null,
    content: `ارتباط بین نرخ بهره و قیمت طلا یکی از مهم‌ترین روابط در اقتصاد کلان است.\n\n\nمکانیسم اثر:\n\nوقتی فدرال رزرو نرخ بهره را افزایش می‌دهد، بازده اوراق قرضه دولتی آمریکا بالا می‌رود. از آنجا که طلا بازده بدون بهره دارد، سرمایه‌گذاران به سمت اوراق قرضه جذب می‌شوند و تقاضا برای طلا کاهش می‌یابد.\n\n\n相反، وقتی نرخ بهره کاهش می‌یابد:\n\n۱. هزینه فرصت نگهداری طلا کاهش می‌یابد\n۲. دلار ضعیف می‌شود و طلا ارزان‌تر می‌شود\n۳. سرمایه‌گذاران به دنبال دارایی‌های حفاظتی می‌روند\n\n\nنکته مهم: بازار طلا معمولاً ۶ ماه قبل از تغییرات نرخ بهره واکنش نشان می‌دهد، زیرا سرمایه‌گذاران انتظارات خود را پیش از اعلام رسمی در قیمت لحاظ می‌کنند.`,
    date: '1403/10/06',
    instructor: 'دکتر فاطمه نوری',
  },
  {
    id: '7',
    title: 'Geopolitical Effects on Gold',
    titleFa: 'تأثیرات ژئوپلتیکی بر بازار طلا',
    description: 'بررسی تأثیر تنش‌های بین‌المللی، جنگ‌ها و تحریم‌ها بر نوسانات قیمت طلا',
    type: 'video',
    category: 'economy',
    duration: 210,
    views: 1120,
    isFavorite: false,
    progress: 0,
    isCompleted: false,
    isPremium: false,
    thumbnail: null,
    content: '',
    date: '1403/10/08',
    instructor: 'مهندس رضا کریمی',
  },

  /* ── Buying Tips (3 lessons) ── */
  {
    id: '8',
    title: 'Best Time to Buy Gold',
    titleFa: 'بهترین زمان خرید طلا',
    description: 'شناسایی زمان‌های مناسب خرید طلا بر اساس الگوهای فصلی و شرایط بازار',
    type: 'video',
    category: 'buying_tips',
    duration: 195,
    views: 2100,
    isFavorite: true,
    progress: 100,
    isCompleted: true,
    isPremium: false,
    thumbnail: null,
    content: '',
    date: '1403/10/04',
    instructor: 'مهندس سارا احمدی',
  },
  {
    id: '9',
    title: 'Dollar Cost Averaging Strategy',
    titleFa: 'استراتژی میانگین هزینه دلاری (DCA)',
    description: 'یادگیری روش خرید مرحله‌ای و منظم طلا برای کاهش ریسک و بهینه‌سازی قیمت خرید',
    type: 'article',
    category: 'buying_tips',
    duration: 300,
    views: 1850,
    isFavorite: false,
    progress: 60,
    isCompleted: false,
    isPremium: false,
    thumbnail: null,
    content: `میانگین هزینه دلاری (DCA) یکی از محبوب‌ترین استراتژی‌های سرمایه‌گذاری در طلاست.\n\n\nاصل ساده:\n\nبه جای خرید یکباره، طلا را به صورت دوره‌ای و با مبلغ ثابت خریداری کنید. این کار باعث می‌شود در قیمت‌های پایین بیشتر و در قیمت‌های بالا کمتر طلا بخرید.\n\n\nمثال عملی:\n\nفرض کنید ماهانه ۱۰ میلیون واحد طلایی برای خرید طلا اختصاص می‌دهید:\n\n- ماه اول: قیمت هر گرم ۸,۵۰۰,۰۰۰ واحد طلایی → خرید ۱.۱۸ گرم\n- ماه دوم: قیمت هر گرم ۸,۰۰۰,۰۰۰ واحد طلایی → خرید ۱.۲۵ گرم\n- ماه سوم: قیمت هر گرم ۹,۰۰۰,۰۰۰ واحد طلایی → خرید ۱.۱۱ گرم\n- ماه چهارم: قیمت هر گرم ۸,۲۰۰,۰۰۰ واحد طلایی → خرید ۱.۲۲ گرم\n\nمجموع خرید: ۴.۷۶ گرم با میانگین قیمت ۸,۴۰۳,۰۰۰ واحد طلایی\n\n\nمزایای DCA:\n\n۱. حذف استرس زمان‌بندی بازار\n۲. کاهش تأثیر نوسانات کوتاه‌مدت\n۳. ایجاد عادت پس‌انداز منظم\n۴. مناسب برای سرمایه‌گذاران مبتدی`,
    date: '1403/10/09',
    instructor: 'مهندس سارا احمدی',
  },
  {
    id: '10',
    title: 'Market Timing Indicators',
    titleFa: 'شاخص‌های زمان‌بندی بازار طلا',
    description: 'آشنایی با شاخص‌های کلیدی برای تشخیص فرصت‌های خرید مناسب در بازار طلا',
    type: 'video',
    category: 'buying_tips',
    duration: 270,
    views: 780,
    isFavorite: false,
    progress: 10,
    isCompleted: false,
    isPremium: true,
    thumbnail: null,
    content: '',
    date: '1403/10/10',
    instructor: 'دکتر محمد رضایی',
  },

  /* ── Risk Management (4 lessons) ── */
  {
    id: '11',
    title: 'Portfolio Diversification with Gold',
    titleFa: 'تنوع‌بخشی سبد سرمایه‌گذاری با طلا',
    description: 'نقش طلا در سبد سرمایه‌گذاری و نسبت بهینه تخصیص سرمایه به طلای فیزیکی و دیجیتال',
    type: 'video',
    category: 'risk_management',
    duration: 255,
    views: 1340,
    isFavorite: false,
    progress: 100,
    isCompleted: true,
    isPremium: false,
    thumbnail: null,
    content: '',
    date: '1403/10/05',
    instructor: 'دکتر فاطمه نوری',
  },
  {
    id: '12',
    title: 'Stop Loss Strategies for Gold',
    titleFa: 'استراتژی‌های حد ضرر در معاملات طلا',
    description: 'آشنایی با انواع حد ضرر و نحوه تعیین سطح مناسب حد ضرر در معاملات طلای آنلاین',
    type: 'article',
    category: 'risk_management',
    duration: 390,
    views: 670,
    isFavorite: true,
    progress: 40,
    isCompleted: false,
    isPremium: false,
    thumbnail: null,
    content: `حد ضرر (Stop Loss) یکی از مهم‌ترین ابزارهای مدیریت ریسک در معاملات طلاست.\n\n\nانواع حد ضرر:\n\n۱. حد ضرر ثابت: مبلغ مشخصی از مبلغ خرید کمتر تعیین می‌شود\n۲. حد ضرر درصدی: درصد مشخصی از قیمت خرید (معمولاً ۵-۱۰٪)\n۳. حد ضرر تکنیکال: بر اساس سطوح حمایت و مقاومت\n۴. حد ضرر متحرک (Trailing): با حرکت قیمت به سود، حد ضرر نیز جابجا می‌شود\n\n\nنکات طلایی:\n\n- هرگز بدون حد ضرر معامله نکنید\n- حد ضرر را خیلی تنگ (کمتر از ۳٪) یا خیلی گشاد (بیشتر از ۱۵٪) تنظیم نکنید\n- حد ضرر خود را بعد از تعیین، تغییر ندهید (به جز حالت متحرک)\n- همیشه نسبت ریسک به ریوارد حداقل ۱:۲ را رعایت کنید`,
    date: '1403/10/11',
    instructor: 'مهندس علی محمدی',
  },
  {
    id: '13',
    title: 'Position Sizing and Risk Control',
    titleFa: 'تخصیص حجم معامله و کنترل ریسک',
    description: 'محاسبه حجم مناسب معامله بر اساس سرمایه، تحمل ریسک و شرایط بازار برای حفاظت از سرمایه',
    type: 'video',
    category: 'risk_management',
    duration: 330,
    views: 520,
    isFavorite: false,
    progress: 0,
    isCompleted: false,
    isPremium: true,
    thumbnail: null,
    content: '',
    date: '1403/10/12',
    instructor: 'مهندس رضا کریمی',
  },
  {
    id: '14',
    title: 'Psychology of Gold Trading',
    titleFa: 'روانشناسی معاملات طلا',
    description: 'شناخت احساسات رایج در معاملات طلا و راهکارهای کنترل هیجانات برای تصمیم‌گیری بهتر',
    type: 'article',
    category: 'risk_management',
    duration: 450,
    views: 890,
    isFavorite: false,
    progress: 20,
    isCompleted: false,
    isPremium: false,
    thumbnail: null,
    content: `روانشناسی معاملات نقش حیاتی در موفقیت سرمایه‌گذار طلا دارد.\n\n\nاحساسات خطرناک در معاملات طلا:\n\n۱. ترس از دست دادن (FOMO): خرید در اوج قیمت به دلیل ترس از جا ماندن\n۲. طمع: نگهداری بیش از حد سود و عدم رعایت اهداف\n۳. انتقام از بازار: افزایش حجم معامله پس از ضرر برای جبران سریع\n۴. اطمینان بیش از حد: نادیده گرفتن ریسک‌ها پس از چند معامله موفق\n\n\nراهکارهای کنترل احساسات:\n\n- داشتن برنامه معاملاتی مکتوب\n- محدود کردن زمان بررسی بازار\n- استفاده حتماً از حد ضرر\n- ثبت تمام معاملات و بررسی دوره‌ای آنها\n- متنوع‌سازی سبد سرمایه‌گذاری`,
    date: '1403/10/13',
    instructor: 'دکتر فاطمه نوری',
  },
];

/* Mock learning stats */
const MOCK_STATS: LearningStats = {
  lessonsCompleted: 5,
  totalLessons: MOCK_LESSONS.length,
  totalTimeSpent: 87,
  streakDays: 7,
  lastActiveDate: '1403/10/13',
};

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Helper Functions                                                            */
/* ═══════════════════════════════════════════════════════════════════════════════ */

/** Format duration in seconds to a readable Persian string */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${formatNumber(secs)} ثانیه`;
  if (secs === 0) return `${formatNumber(mins)} دقیقه`;
  return `${formatNumber(mins)} دقیقه و ${formatNumber(secs)} ثانیه`;
}

/** Get estimated read time for articles */
function getReadTime(seconds: number): string {
  const mins = Math.ceil(seconds / 60);
  return `${formatNumber(mins)} دقیقه مطالعه`;
}

/** Get category badge color class */
function getCategoryBadgeClass(category: LessonCategory): string {
  const config = CATEGORY_CONFIG[category];
  return `${config.bg} ${config.color}`;
}

/** Generate gradient background for thumbnail placeholder */
function getThumbnailGradient(category: LessonCategory): string {
  const gradients: Record<LessonCategory, string> = {
    technical_analysis: 'from-blue-500/20 via-blue-400/10 to-cyan-500/20',
    economy: 'from-purple-500/20 via-purple-400/10 to-violet-500/20',
    buying_tips: 'from-emerald-500/20 via-emerald-400/10 to-green-500/20',
    risk_management: 'from-amber-500/20 via-amber-400/10 to-orange-500/20',
  };
  return gradients[category];
}

/** Get overall completion percentage */
function getOverallProgress(stats: LearningStats): number {
  if (stats.totalLessons === 0) return 0;
  return Math.round((stats.lessonsCompleted / stats.totalLessons) * 100);
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeleton Component                                                   */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function EducationSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24 px-4">
      {/* Header skeleton */}
      <div className="flex flex-col items-center gap-3 py-6">
        <Skeleton className="size-14 rounded-full" />
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      {/* Search + Filters skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-full rounded-xl" />
      {/* Cards grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Stats Overview Cards                                                         */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function StatsOverview({ stats, lessons }: { stats: LearningStats; lessons: Lesson[] }) {
  const overallProgress = getOverallProgress(stats);
  const favoriteCount = lessons.filter((l) => l.isFavorite).length;
  const premiumCount = lessons.filter((l) => l.isPremium).length;

  const statCards = [
    {
      icon: <GraduationCap className="size-5" />,
      label: 'درس‌های تکمیل شده',
      value: `${formatNumber(stats.lessonsCompleted)}/${formatNumber(stats.totalLessons)}`,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      icon: <Clock className="size-5" />,
      label: 'زمان صرف شده',
      value: `${formatNumber(stats.totalTimeSpent)} دقیقه`,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      icon: <Flame className="size-5" />,
      label: 'رکورد روزانه',
      value: `${formatNumber(stats.streakDays)} روز`,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      icon: <Heart className="size-5" />,
      label: 'ذخیره‌شده',
      value: `${formatNumber(favoriteCount)} درس`,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-100 dark:bg-rose-900/30',
    },
  ];

  return (
    <motion.div variants={itemVariants}>
      <Card className="border-2 border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/5 via-transparent to-transparent overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          {/* Overall progress header */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="relative flex items-center justify-center">
              <div className="size-16 sm:size-20 rounded-full border-4 border-[#D4AF37]/30 flex items-center justify-center bg-gradient-to-br from-[#D4AF37]/10 to-transparent">
                <Trophy className="size-7 sm:size-8 text-[#D4AF37]" />
              </div>
              <div className="absolute -bottom-1 -left-1 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {formatNumber(overallProgress)}٪
              </div>
            </div>
            <div className="text-center sm:text-right flex-1">
              <h3 className="text-base sm:text-lg font-bold">پیشرفت آموزشی شما</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {overallProgress === 100
                  ? '🎉 تبریک! تمام درس‌ها را تکمیل کرده‌اید'
                  : `${formatNumber(stats.totalLessons - stats.lessonsCompleted)} درس دیگر باقی‌مانده`}
              </p>
              <div className="mt-2 max-w-xs sm:max-w-sm mx-auto sm:mx-0">
                <Progress
                  value={overallProgress}
                  className="h-2.5"
                />
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className={`flex items-center gap-3 p-3 rounded-xl ${stat.bg} transition-all hover:scale-[1.02]`}
              >
                <div className={`${stat.color}`}>{stat.icon}</div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                  <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Lesson Card Component                                                        */
/* ═══════════════════════════════════════════════════════════════════════════════ */

interface LessonCardProps {
  lesson: Lesson;
  index: number;
  onOpen: (lesson: Lesson) => void;
  onToggleFavorite: (id: string) => void;
}

function LessonCard({ lesson, index, onOpen, onToggleFavorite }: LessonCardProps) {
  const [heartAnimating, setHeartAnimating] = useState(false);
  const categoryConfig = CATEGORY_CONFIG[lesson.category];
  const typeConfig = TYPE_CONFIG[lesson.type];
  const CategoryIcon = categoryConfig.icon;
  const TypeIcon = typeConfig.icon;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeartAnimating(true);
    onToggleFavorite(lesson.id);
    setTimeout(() => setHeartAnimating(false), 400);
  };

  return (
    <motion.div
      variants={itemVariants}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <Card
        className="relative overflow-hidden h-full cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-[#D4AF37]/5 hover:-translate-y-1 border border-border/60 hover:border-[#D4AF37]/30"
        onClick={() => onOpen(lesson)}
      >
        {/* Thumbnail area */}
        <div className={`relative h-36 sm:h-40 bg-gradient-to-br ${getThumbnailGradient(lesson.category)} flex items-center justify-center overflow-hidden`}>
          {/* Type icon */}
          <div className="opacity-30 group-hover:opacity-50 transition-opacity">
            {lesson.type === 'video' ? (
              <Play className="size-20 text-current" />
            ) : (
              <FileText className="size-20 text-current" />
            )}
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Duration badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-1 rounded-lg">
            {lesson.type === 'video' ? (
              <>
                <Play className="size-3" />
                {formatDuration(lesson.duration)}
              </>
            ) : (
              <>
                <BookOpen className="size-3" />
                {getReadTime(lesson.duration)}
              </>
            )}
          </div>

          {/* Premium badge */}
          {lesson.isPremium && (
            <div className="absolute top-3 right-3 edu-float-badge">
              <Badge className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-white border-0 gap-1 text-[10px] font-bold shadow-md">
                <Crown className="size-3" />
                ویژه
              </Badge>
            </div>
          )}

          {/* Category badge */}
          <div className="absolute bottom-3 right-3">
            <Badge className={`${getCategoryBadgeClass(lesson.category)} border-0 gap-1 text-[10px] font-medium backdrop-blur-sm`}>
              <CategoryIcon className="size-3" />
              {categoryConfig.label}
            </Badge>
          </div>

          {/* Favorite button */}
          <button
            className="absolute bottom-3 left-3 size-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-all hover:bg-black/60 hover:scale-110"
            onClick={handleFavoriteClick}
          >
            <Heart
              className={`size-4 transition-colors ${
                lesson.isFavorite
                  ? 'fill-rose-500 text-rose-500'
                  : 'text-white'
              } ${heartAnimating ? 'edu-heart-pop' : ''}`}
            />
          </button>

          {/* Completed overlay */}
          {lesson.isCompleted && (
            <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20">
              <div className="size-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="size-7 text-white" />
              </div>
            </div>
          )}

          {/* Play icon overlay for videos (not completed) */}
          {lesson.type === 'video' && !lesson.isCompleted && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="size-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                <Play className="size-6 text-gray-800 mr-[-2px]" />
              </div>
            </div>
          )}
        </div>

        {/* Content area */}
        <CardContent className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-bold text-sm leading-relaxed line-clamp-2 group-hover:text-[#D4AF37] transition-colors min-h-[2.5rem]">
            {lesson.titleFa}
          </h3>

          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {lesson.description}
          </p>

          {/* Progress bar for started lessons */}
          {(lesson.progress > 0 && !lesson.isCompleted) && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>پیشرفت</span>
                <span>{formatNumber(lesson.progress)}٪</span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-[#D4AF37] to-[#FFD700]"
                  initial={{ width: 0 }}
                  animate={{ width: `${lesson.progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="size-3" />
                {formatNumber(lesson.views)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {lesson.date}
              </span>
            </div>

            {/* Type badge */}
            <Badge variant="outline" className="text-[10px] gap-1 h-6">
              <TypeIcon className="size-3" />
              {typeConfig.label}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Video Player Dialog                                                          */
/* ═══════════════════════════════════════════════════════════════════════════════ */

interface VideoPlayerDialogProps {
  lesson: Lesson;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateProgress: (id: string, progress: number) => void;
  onToggleFavorite: (id: string) => void;
  onMarkComplete: (id: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
}

function VideoPlayerDialog({
  lesson,
  open,
  onOpenChange,
  onUpdateProgress,
  onToggleFavorite,
  onMarkComplete,
  onNavigate,
  canNavigatePrev,
  canNavigateNext,
}: VideoPlayerDialogProps) {
  const categoryConfig = CATEGORY_CONFIG[lesson.category];
  const CategoryIcon = categoryConfig.icon;

  /* Simulate video progress — key prop on parent remounts on lesson change */
  const [currentProgress, setCurrentProgress] = useState(lesson.progress);

  /* Auto-increment progress when dialog opens and not completed */
  useEffect(() => {
    if (!open || lesson.isCompleted || currentProgress >= 100) return;
    const interval = setInterval(() => {
      setCurrentProgress((prev) => {
        const next = Math.min(prev + 1, 100);
        if (next % 10 === 0) {
          onUpdateProgress(lesson.id, next);
        }
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [open, lesson.isCompleted, lesson.id, onUpdateProgress, currentProgress]);

  const handleMarkComplete = () => {
    onMarkComplete(lesson.id);
    setCurrentProgress(100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden p-0 gap-0">
        {/* Video placeholder area */}
        <div className={`relative w-full aspect-video bg-gradient-to-br ${getThumbnailGradient(lesson.category)} flex items-center justify-center overflow-hidden`}>
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-20">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-current"
                style={{
                  width: `${20 + i * 15}%`,
                  height: `${20 + i * 15}%`,
                  top: `${Math.random() * 60}%`,
                  left: `${Math.random() * 60}%`,
                  opacity: 0.1 + i * 0.03,
                }}
              />
            ))}
          </div>

          {/* Center play icon */}
          {currentProgress < 100 ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <div className="size-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30 cursor-pointer hover:bg-white/30 transition-colors">
                <Play className="size-10 text-white mr-[-3px]" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <div className="size-20 rounded-full bg-emerald-500/80 backdrop-blur-md flex items-center justify-center">
                <CheckCircle2 className="size-10 text-white" />
              </div>
            </motion.div>
          )}

          {/* Video progress bar at bottom of video area */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <motion.div
              className="h-full bg-gradient-to-l from-[#D4AF37] to-[#FFD700]"
              style={{ width: `${currentProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Close button */}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm text-white border-0 gap-1">
              <Play className="size-3" />
              {formatDuration(lesson.duration)}
            </Badge>
          </div>

          {/* Favorite button */}
          <button
            className="absolute top-3 right-3 size-9 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
            onClick={() => onToggleFavorite(lesson.id)}
          >
            <Heart className={`size-4 ${lesson.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
          </button>
        </div>

        {/* Content area */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[50vh]">
          <DialogHeader className="text-right">
            <div className="flex items-start justify-between gap-3">
              <Badge className={`${getCategoryBadgeClass(lesson.category)} border-0 gap-1 shrink-0`}>
                <CategoryIcon className="size-3" />
                {categoryConfig.label}
              </Badge>
              <div className="text-right flex-1">
                <DialogTitle className="text-lg font-bold leading-relaxed">
                  {lesson.titleFa}
                </DialogTitle>
                <DialogDescription className="mt-1 leading-relaxed">
                  {lesson.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              {lesson.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="size-4" />
              {formatNumber(lesson.views)} بازدید
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-4" />
              {lesson.instructor}
            </span>
          </div>

          {/* Progress section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">پیشرفت درس</span>
              <span className="font-bold text-[#D4AF37]">{formatNumber(currentProgress)}٪</span>
            </div>
            <Progress value={currentProgress} className="h-3" />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {!lesson.isCompleted && (
              <Button
                onClick={handleMarkComplete}
                className="flex-1 bg-gradient-to-l from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md"
              >
                <CheckCircle2 className="size-4 ml-2" />
                تکمیل درس
              </Button>
            )}
            {lesson.isCompleted && (
              <div className="flex-1 flex items-center justify-center gap-2 text-emerald-600 font-bold py-2">
                <CheckCircle2 className="size-5" />
                این درس تکمیل شده است
              </div>
            )}
          </div>

          {/* Navigation */}
          <Separator />
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('prev')}
              disabled={!canNavigatePrev}
              className="gap-1.5"
            >
              <ChevronRight className="size-4" />
              درس قبلی
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('next')}
              disabled={!canNavigateNext}
              className="gap-1.5"
            >
              درس بعدی
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Article Reader Dialog                                                        */
/* ═══════════════════════════════════════════════════════════════════════════════ */

interface ArticleReaderDialogProps {
  lesson: Lesson;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateProgress: (id: string, progress: number) => void;
  onToggleFavorite: (id: string) => void;
  onMarkComplete: (id: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
}

function ArticleReaderDialog({
  lesson,
  open,
  onOpenChange,
  onUpdateProgress,
  onToggleFavorite,
  onMarkComplete,
  onNavigate,
  canNavigatePrev,
  canNavigateNext,
}: ArticleReaderDialogProps) {
  const categoryConfig = CATEGORY_CONFIG[lesson.category];
  const CategoryIcon = categoryConfig.icon;
  /* key prop on parent remounts on lesson change so initial state is correct */
  const [readProgress, setReadProgress] = useState(lesson.progress);

  /* Simulate reading progress on scroll */
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const scrollPercentage =
        (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
      const clampedProgress = Math.min(Math.round(scrollPercentage), 100);
      setReadProgress(clampedProgress);
      if (clampedProgress % 10 === 0 && clampedProgress !== lesson.progress) {
        onUpdateProgress(lesson.id, clampedProgress);
      }
    },
    [lesson.id, lesson.progress, onUpdateProgress]
  );

  const handleMarkComplete = () => {
    onMarkComplete(lesson.id);
    setReadProgress(100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden p-0 gap-0">
        {/* Article header area */}
        <div className={`relative p-6 pb-4 bg-gradient-to-br ${getThumbnailGradient(lesson.category)}`}>
          <div className="flex items-start gap-3">
            <Badge className={`${getCategoryBadgeClass(lesson.category)} border-0 gap-1 shrink-0`}>
              <CategoryIcon className="size-3" />
              {categoryConfig.label}
            </Badge>
            <div className="flex-1 text-right">
              <DialogTitle className="text-lg font-bold leading-relaxed">
                {lesson.titleFa}
              </DialogTitle>
              <DialogDescription className="mt-1 leading-relaxed">
                {lesson.description}
              </DialogDescription>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 bg-white/60 dark:bg-black/20 px-2 py-1 rounded-lg">
              <Calendar className="size-3" />
              {lesson.date}
            </span>
            <span className="flex items-center gap-1 bg-white/60 dark:bg-black/20 px-2 py-1 rounded-lg">
              <Eye className="size-3" />
              {formatNumber(lesson.views)} بازدید
            </span>
            <span className="flex items-center gap-1 bg-white/60 dark:bg-black/20 px-2 py-1 rounded-lg">
              <BookOpen className="size-3" />
              {getReadTime(lesson.duration)}
            </span>
            <span className="flex items-center gap-1 bg-white/60 dark:bg-black/20 px-2 py-1 rounded-lg">
              <BookOpen className="size-3" />
              {lesson.instructor}
            </span>
          </div>
        </div>

        {/* Reading progress bar */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-gradient-to-l from-[#D4AF37] to-[#FFD700]"
            style={{ width: `${readProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Article content */}
        <ScrollArea className="max-h-[45vh]" onScrollCapture={handleScroll}>
          <div className="p-6 space-y-4">
            {/* Article body */}
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-8 text-foreground whitespace-pre-line">
              {lesson.content ? (
                lesson.content.split('\n').map((paragraph, idx) => {
                  /* Parse heading-like paragraphs (ending with :) */
                  if (paragraph.endsWith(':') && paragraph.length < 100) {
                    return (
                      <h3 key={idx} className="text-base font-bold mt-4 mb-2 text-foreground">
                        {paragraph}
                      </h3>
                    );
                  }
                  /* Parse bullet-like items (starting with - or number) */
                  if (/^[\d\u06F0-\u06F9][.،]\s/.test(paragraph) || paragraph.startsWith('-')) {
                    return (
                      <p key={idx} className="flex gap-2 mr-4 my-1">
                        <span className="text-[#D4AF37] shrink-0">●</span>
                        <span>{paragraph.replace(/^[-\d\u06F0-\u06F9.،]\s*/, '')}</span>
                      </p>
                    );
                  }
                  /* Empty line = spacer */
                  if (paragraph.trim() === '') {
                    return <div key={idx} className="h-2" />;
                  }
                  return <p key={idx}>{paragraph}</p>;
                })
              ) : (
                <p className="text-muted-foreground italic">محتوای این درس به زودی اضافه خواهد شد.</p>
              )}
            </div>

            {/* Reading progress indicator */}
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                پیشرفت مطالعه
              </span>
              <span className="text-sm font-bold text-[#D4AF37]">
                {formatNumber(readProgress)}٪
              </span>
            </div>
          </div>
        </ScrollArea>

        {/* Footer actions */}
        <div className="p-4 border-t bg-muted/30 space-y-3">
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleMarkComplete}
              disabled={lesson.isCompleted}
              className={`flex-1 shadow-md ${
                lesson.isCompleted
                  ? 'bg-emerald-500/20 text-emerald-600 cursor-default'
                  : 'bg-gradient-to-l from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white'
              }`}
            >
              <CheckCircle2 className="size-4 ml-2" />
              {lesson.isCompleted ? 'تکمیل شده ✓' : 'تکمیل درس'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onToggleFavorite(lesson.id)}
              className="gap-2"
            >
              <Heart className={`size-4 ${lesson.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              {lesson.isFavorite ? 'ذخیره شده' : 'ذخیره'}
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('prev')}
              disabled={!canNavigatePrev}
              className="gap-1"
            >
              <ChevronRight className="size-4" />
              قبلی
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('next')}
              disabled={!canNavigateNext}
              className="gap-1"
            >
              بعدی
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Empty State Component                                                        */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      variants={fadeInScale}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-base font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Main EducationCenter Component                                               */
/* ═══════════════════════════════════════════════════════════════════════════════ */

export default function EducationCenter() {
  /* ── State ── */
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lessons, setLessons] = useState<Lesson[]>(MOCK_LESSONS);
  const [stats, setStats] = useState<LearningStats>(MOCK_STATS);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  /* ── Quick Actions ── */
  useQuickAction('scroll:edu-tutorials', () => {
    setTypeFilter('video');
    setActiveTab('all');
    document.getElementById('edu-courses')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ── Store ── */
  const addToast = useAppStore((s) => s.addToast);

  /* ── Simulate loading ── */
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  /* ── Get filtered lessons list (for navigation) ── */
  const filteredLessonList = useMemo(() => {
    let result = [...lessons];

    /* Category filter */
    if (categoryFilter !== 'all') {
      result = result.filter((l) => l.category === categoryFilter);
    }

    /* Type filter */
    if (typeFilter !== 'all') {
      result = result.filter((l) => l.type === typeFilter);
    }

    /* Search filter */
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (l) =>
          l.titleFa.includes(q) ||
          l.title.toLowerCase().includes(q) ||
          l.description.includes(q)
      );
    }

    return result;
  }, [lessons, categoryFilter, typeFilter, searchQuery]);

  /* ── Display lessons based on tab ── */
  const displayLessons = useMemo(() => {
    if (activeTab === 'favorites') {
      return filteredLessonList.filter((l) => l.isFavorite);
    }
    if (activeTab === 'progress') {
      return filteredLessonList.filter((l) => l.progress > 0);
    }
    return filteredLessonList;
  }, [filteredLessonList, activeTab]);

  /* ── Category counts for tabs ── */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: lessons.length };
    for (const l of lessons) {
      counts[l.category] = (counts[l.category] || 0) + 1;
    }
    return counts;
  }, [lessons]);

  /* ── Navigation helpers ── */
  const currentFilteredList = activeTab === 'favorites'
    ? filteredLessonList.filter((l) => l.isFavorite)
    : activeTab === 'progress'
    ? filteredLessonList.filter((l) => l.progress > 0)
    : filteredLessonList;

  const currentLessonIndex = selectedLesson
    ? currentFilteredList.findIndex((l) => l.id === selectedLesson.id)
    : -1;

  const canNavigatePrev = currentLessonIndex > 0;
  const canNavigateNext = currentLessonIndex < currentFilteredList.length - 1;

  /* ── Handlers ── */
  const handleOpenLesson = useCallback((lesson: Lesson) => {
    setSelectedLesson(lesson);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setTimeout(() => setSelectedLesson(null), 300);
  }, []);

  const handleToggleFavorite = useCallback(
    (id: string) => {
      setLessons((prev) =>
        prev.map((l) => {
          if (l.id !== id) return l;
          const newState = !l.isFavorite;
          if (newState) {
            addToast('درس به علاقه‌مندی‌ها اضافه شد', 'success');
          } else {
            addToast('درس از علاقه‌مندی‌ها حذف شد', 'info');
          }
          return { ...l, isFavorite: newState };
        })
      );
      /* Also update selectedLesson if it's the same one */
      setSelectedLesson((prev) =>
        prev && prev.id === id ? { ...prev, isFavorite: !prev.isFavorite } : prev
      );
    },
    [addToast]
  );

  const handleUpdateProgress = useCallback((id: string, progress: number) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === id ? { ...l, progress } : l))
    );
  }, []);

  const handleMarkComplete = useCallback(
    (id: string) => {
      setLessons((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, isCompleted: true, progress: 100 } : l
        )
      );
      setStats((prev) => ({
        ...prev,
        lessonsCompleted: prev.lessonsCompleted + 1,
      }));
      setSelectedLesson((prev) =>
        prev && prev.id === id ? { ...prev, isCompleted: true, progress: 100 } : prev
      );
      addToast('درس با موفقیت تکمیل شد! 🎉', 'success');
    },
    [addToast]
  );

  const handleNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      if (!selectedLesson || currentLessonIndex < 0) return;
      const newIndex = direction === 'prev' ? currentLessonIndex - 1 : currentLessonIndex + 1;
      const newLesson = currentFilteredList[newIndex];
      if (newLesson) {
        setSelectedLesson(newLesson);
      }
    },
    [selectedLesson, currentLessonIndex, currentFilteredList]
  );

  /* ── Render loading skeleton ── */
  if (isLoading) {
    return <EducationSkeleton />;
  }

  return (
    <div className="mx-auto max-w-6xl pb-24 px-4">
      {/* Inject CSS animations */}
      <style>{EDUCATION_ANIMATIONS}</style>

      {/* ── Header ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="text-center py-6 sm:py-8"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-center gap-3 mb-3">
          <div className="size-12 sm:size-14 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
            <GraduationCap className="size-6 sm:size-7 text-white" />
          </div>
          <div className="text-right">
            <h1 className="text-xl sm:text-2xl font-black text-foreground">
              آکادمی طلای زرین
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              آموزش حرفه‌ای بازار طلا
            </p>
          </div>
        </motion.div>
        <motion.p variants={itemVariants} className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          با یادگیری اصول بازار طلا، تصمیمات هوشمندانه‌تری بگیرید. ویدیوها و مقالات آموزشی ما توسط متخصصان بازار تهیه شده‌اند.
        </motion.p>
      </motion.div>

      {/* ── Stats Overview ── */}
      <motion.div id="edu-progress" variants={containerVariants} initial="hidden" animate="show">
        <StatsOverview stats={stats} lessons={lessons} />
      </motion.div>

      {/* ── Main Tabs ── */}
      <motion.div variants={itemVariants} initial="hidden" animate="show" className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full h-auto flex flex-wrap gap-1 bg-muted/50 p-1.5 rounded-xl">
            <TabsTrigger
              value="all"
              className="flex-1 min-w-0 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
            >
              <BookOpen className="size-3.5 ml-1.5 hidden sm:inline" />
              همه درس‌ها
              <Badge variant="secondary" className="mr-1.5 text-[10px] h-5 px-1.5 bg-muted-foreground/10">
                {categoryCounts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className="flex-1 min-w-0 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
            >
              <Heart className="size-3.5 ml-1.5 hidden sm:inline" />
              علاقه‌مندی‌ها
              <Badge variant="secondary" className="mr-1.5 text-[10px] h-5 px-1.5 bg-muted-foreground/10">
                {lessons.filter((l) => l.isFavorite).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="flex-1 min-w-0 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
            >
              <Target className="size-3.5 ml-1.5 hidden sm:inline" />
              در حال یادگیری
              <Badge variant="secondary" className="mr-1.5 text-[10px] h-5 px-1.5 bg-muted-foreground/10">
                {lessons.filter((l) => l.progress > 0 && !l.isCompleted).length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Search + Filter controls */}
          <TabsContent value={activeTab} className="mt-4 space-y-4">
            {/* Search bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو در درس‌ها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 h-10 rounded-xl border-border/60 focus:border-[#D4AF37]/50"
                />
                {searchQuery && (
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="size-3 text-muted-foreground" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-1.5 rounded-xl shrink-0"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="size-4" />
                <span className="hidden sm:inline">فیلتر</span>
              </Button>
            </div>

            {/* Expanded filter area */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                    {/* Category filter */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-[#D4AF37]" />
                        دسته‌بندی
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={categoryFilter === 'all' ? 'default' : 'outline'}
                          className={`text-xs h-8 rounded-lg ${
                            categoryFilter === 'all' ? 'bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white' : ''
                          }`}
                          onClick={() => setCategoryFilter('all')}
                        >
                          همه ({categoryCounts.all})
                        </Button>
                        {(Object.keys(CATEGORY_CONFIG) as LessonCategory[]).map((cat) => {
                          const config = CATEGORY_CONFIG[cat];
                          const CatIcon = config.icon;
                          return (
                            <Button
                              key={cat}
                              size="sm"
                              variant={categoryFilter === cat ? 'default' : 'outline'}
                              className={`text-xs h-8 rounded-lg gap-1 ${
                                categoryFilter === cat
                                  ? `${config.bg} ${config.color} border-current`
                                  : ''
                              }`}
                              onClick={() => setCategoryFilter(cat)}
                            >
                              <CatIcon className="size-3" />
                              {config.label}
                              {categoryCounts[cat] !== undefined && (
                                <span className="opacity-60">({categoryCounts[cat]})</span>
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Type filter */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <Bookmark className="size-3.5 text-[#D4AF37]" />
                        نوع محتوا
                      </label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={typeFilter === 'all' ? 'default' : 'outline'}
                          className={`text-xs h-8 rounded-lg gap-1 ${
                            typeFilter === 'all' ? 'bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white' : ''
                          }`}
                          onClick={() => setTypeFilter('all')}
                        >
                          همه
                        </Button>
                        <Button
                          size="sm"
                          variant={typeFilter === 'video' ? 'default' : 'outline'}
                          className={`text-xs h-8 rounded-lg gap-1 ${
                            typeFilter === 'video'
                              ? 'bg-blue-500 hover:bg-blue-600 text-white'
                              : ''
                          }`}
                          onClick={() => setTypeFilter('video')}
                        >
                          <Play className="size-3" />
                          ویدیو ({lessons.filter((l) => l.type === 'video').length})
                        </Button>
                        <Button
                          size="sm"
                          variant={typeFilter === 'article' ? 'default' : 'outline'}
                          className={`text-xs h-8 rounded-lg gap-1 ${
                            typeFilter === 'article'
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                              : ''
                          }`}
                          onClick={() => setTypeFilter('article')}
                        >
                          <FileText className="size-3" />
                          مقاله ({lessons.filter((l) => l.type === 'article').length})
                        </Button>
                      </div>
                    </div>

                    {/* Clear filters */}
                    {(categoryFilter !== 'all' || typeFilter !== 'all' || searchQuery) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                        onClick={() => {
                          setCategoryFilter('all');
                          setTypeFilter('all');
                          setSearchQuery('');
                        }}
                      >
                        <X className="size-3 ml-1" />
                        پاک کردن فیلترها
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick filter chips (always visible) */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categoryFilter !== 'all' && (
                <Badge variant="outline" className="gap-1 shrink-0 py-1 px-3 text-xs">
                  {CATEGORY_CONFIG[categoryFilter as LessonCategory]?.label}
                  <button onClick={() => setCategoryFilter('all')}>
                    <X className="size-3" />
                  </button>
                </Badge>
              )}
              {typeFilter !== 'all' && (
                <Badge variant="outline" className="gap-1 shrink-0 py-1 px-3 text-xs">
                  {TYPE_CONFIG[typeFilter as LessonType]?.label}
                  <button onClick={() => setTypeFilter('all')}>
                    <X className="size-3" />
                  </button>
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="outline" className="gap-1 shrink-0 py-1 px-3 text-xs">
                  جستجو: &quot;{searchQuery}&quot;
                  <button onClick={() => setSearchQuery('')}>
                    <X className="size-3" />
                  </button>
                </Badge>
              )}
            </div>

            {/* ── Content Grid ── */}
            <div id="edu-courses">
            {displayLessons.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                key={`${activeTab}-${categoryFilter}-${typeFilter}-${searchQuery}`}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                id="edu-tutorials"
              >
                {displayLessons.map((lesson, idx) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    index={idx}
                    onOpen={handleOpenLesson}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </motion.div>
            ) : (
              <EmptyState
                icon={
                  activeTab === 'favorites' ? (
                    <Heart className="size-7" />
                  ) : activeTab === 'progress' ? (
                    <Target className="size-7" />
                  ) : (
                    <Search className="size-7" />
                  )
                }
                title={
                  activeTab === 'favorites'
                    ? 'هنوز درسی ذخیره نکرده‌اید'
                    : activeTab === 'progress'
                    ? 'هنوز درسی شروع نکرده‌اید'
                    : 'درسی یافت نشد'
                }
                description={
                  activeTab === 'favorites'
                    ? 'با زدن دکمه قلب روی هر درس، آن را به علاقه‌مندی‌ها اضافه کنید'
                    : activeTab === 'progress'
                    ? 'با مشاهده اولین ویدیو یا مقاله، یادگیری خود را شروع کنید'
                    : 'فیلتر یا عبارت جستجو را تغییر دهید تا درس‌های بیشتری پیدا کنید'
                }
              />
            )}
            {/* Results count */}
            {displayLessons.length > 0 && (
              <div className="text-center mt-6 text-xs text-muted-foreground">
                <span className="flex items-center justify-center gap-1.5">
                  <BookOpen className="size-3.5" />
                  {formatNumber(displayLessons.length)} درس
                  {searchQuery && ` برای "${searchQuery}"`}
                  {categoryFilter !== 'all' && ` در ${CATEGORY_CONFIG[categoryFilter as LessonCategory]?.label}`}
                  {typeFilter !== 'all' && ` (${TYPE_CONFIG[typeFilter as LessonType]?.label})`}
                </span>
              </div>
            )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ── Quick Tips Section ── */}
      <motion.div id="edu-tips" variants={itemVariants} initial="hidden" animate="show" className="mt-8">
        <Card className="border-2 border-dashed border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/5 to-transparent overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                <Zap className="size-5 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="font-bold text-sm">نکات طلایی یادگیری</h3>
                <p className="text-xs text-muted-foreground">برای بهترین نتیجه این نکات را رعایت کنید</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: '🎯', title: 'یادگیری منظم', desc: 'روزانه حداقل ۱۵ دقیقه آموزش ببینید' },
                { icon: '📝', title: 'یادداشت‌برداری', desc: 'نکات مهم را یادداشت کنید تا بعداً مرور کنید' },
                { icon: '🔄', desc: 'درس‌های قبلی را دوره‌ای مرور کنید', title: 'مرور مداوم' },
                { icon: '💡', title: 'تمرین عملی', desc: 'یادگیری‌ها را در معاملات واقعی به کار ببرید' },
              ].map((tip) => (
                <div key={tip.title} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-background/60">
                  <span className="text-lg shrink-0">{tip.icon}</span>
                  <div>
                    <p className="text-xs font-bold">{tip.title}</p>
                    <p className="text-[11px] text-muted-foreground">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Dialogs ── */}
      {selectedLesson && selectedLesson.type === 'video' && (
        <VideoPlayerDialog
          key={selectedLesson.id}
          lesson={selectedLesson}
          open={dialogOpen}
          onOpenChange={handleCloseDialog}
          onUpdateProgress={handleUpdateProgress}
          onToggleFavorite={handleToggleFavorite}
          onMarkComplete={handleMarkComplete}
          onNavigate={handleNavigate}
          canNavigatePrev={canNavigatePrev}
          canNavigateNext={canNavigateNext}
        />
      )}

      {selectedLesson && selectedLesson.type === 'article' && (
        <ArticleReaderDialog
          key={selectedLesson.id}
          lesson={selectedLesson}
          open={dialogOpen}
          onOpenChange={handleCloseDialog}
          onUpdateProgress={handleUpdateProgress}
          onToggleFavorite={handleToggleFavorite}
          onMarkComplete={handleMarkComplete}
          onNavigate={handleNavigate}
          canNavigatePrev={canNavigatePrev}
          canNavigateNext={canNavigateNext}
        />
      )}
    </div>
  );
}

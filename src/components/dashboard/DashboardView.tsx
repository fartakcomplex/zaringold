'use client';

import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from '@/lib/recharts-compat';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  Wallet,
  Coins,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  HandCoins,
  ArrowDownToLine,
  ArrowUpFromLine,
  Copy,
  Check,
  Gift,
  ArrowLeftRight,
  Clock,
  Receipt,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  PieChart as PieChartIcon,
  Activity,
  Trash2,
  Plus,
  Bell,
  Zap,
  Scale,
  BarChart3,
  Landmark,
  PiggyBank,
  Banknote,
  CreditCard,
  Trophy,
  CalendarCheck,
  Crown,
  LayoutGrid,
  MessageCircle,
  Wifi,
  Shield,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Gem,
  Sparkles,
  Headphones,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { useRealGoldPrice, getSourceLabel, getSourceColor } from '@/hooks/useRealGoldPrice';
import { useIsMobile } from '@/hooks/use-mobile';
import GoldGiftDialog from '@/components/gold/GoldGiftDialog';
import {
  formatToman,
  formatGrams,
  formatNumber,
  formatPrice,
  getTimeAgo,
  getTransactionTypeLabel,
  getTransactionStatusColor,
  getTransactionStatusLabel,
  cn,
} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Animation Variants                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface PricePoint {
  timestamp: string;
  price: number;
}

interface ChartDataPoint {
  time: string;
  price: number;
}

interface ReferralData {
  referralCode: string;
  totalInvited: number;
  totalRewarded: number;
}

interface PriceAlert {
  id: string;
  userId: string;
  type: 'buy' | 'sell';
  condition: 'above' | 'below';
  targetPrice: number;
  isActive: boolean;
  isTriggered: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GoldNewsItem {
  title: string;
  url: string;
  snippet: string;
  source: string;
  date: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Portfolio Performance Mock Data                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

const PORTFOLIO_DATA = [
  { name: 'طلا', value: 65, color: '#D4AF37' },
  { name: 'نقد', value: 25, color: '#94a3b8' },
  { name: 'پس‌انداز', value: 10, color: '#64748b' },
];

// COIN_PRICES now comes from useRealGoldPrice hook (real-time API data)
// Falls back to static defaults when API is unavailable

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Custom Tooltip for Chart                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-gold/20 bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-gold">{formatToman(payload[0].value)}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeletons                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-6 w-36" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-lg" />
          ))}
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function QuickActionsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-[13px] border border-[#D4AF37]/[0.12] bg-gradient-to-b from-[#D4AF37]/[0.08] via-[#D4AF37]/[0.04] to-transparent p-2.5 backdrop-blur-md dark:border-[#D4AF37]/[0.15] dark:from-[#D4AF37]/[0.10] dark:via-[#D4AF37]/[0.05]"
        >
          <Skeleton className="size-10 rounded-[11px]" />
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg p-2">
              <Skeleton className="size-9 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-14" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Transaction Type Icon Helper                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TransactionIcon({ type }: { type: string }) {
  const iconMap: Record<string, React.ElementType> = {
    deposit: ArrowDownToLine,
    withdrawal: ArrowUpFromLine,
    buy_gold: TrendingUp,
    sell_gold: TrendingDown,
    referral_reward: Gift,
    cashback: Coins,
    transfer: ArrowLeftRight,
    admin_adjustment: Wallet,
  };
  const Icon = iconMap[type] || Receipt;

  const colorMap: Record<string, string> = {
    deposit: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    withdrawal: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
    buy_gold: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    sell_gold: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    referral_reward: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    cashback: 'bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400',
    transfer: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400',
  };

  return (
    <div className={`flex size-9 items-center justify-center rounded-lg ${colorMap[type] || 'bg-muted text-muted-foreground'}`}>
      <Icon className="size-4" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mobile Services Grid Data                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MOBILE_SERVICES = [
  { icon: Coins, label: 'خرید طلا', iconColor: '#D4AF37', glowColor: 'rgba(212,175,55,0.35)', page: 'trade' },
  { icon: TrendingDown, label: 'فروش طلا', iconColor: '#F87171', glowColor: 'rgba(248,113,113,0.30)', page: 'trade' },
  { icon: Activity, label: 'نرخ لحظه‌ای', iconColor: '#34D399', glowColor: 'rgba(52,211,153,0.30)', page: 'market' },
  { icon: Wallet, label: 'کیف پول', iconColor: '#60A5FA', glowColor: 'rgba(96,165,250,0.30)', page: 'wallet' },
  { icon: PiggyBank, label: 'پس‌انداز', iconColor: '#FB923C', glowColor: 'rgba(251,146,60,0.30)', page: 'savings' },
  { icon: Banknote, label: 'وام طلایی', iconColor: '#C084FC', glowColor: 'rgba(192,132,252,0.30)', page: 'loans' },
  { icon: Gift, label: 'هدیه طلایی', iconColor: '#F472B6', glowColor: 'rgba(244,114,182,0.30)', page: 'gifts' },
  { icon: CreditCard, label: 'کارت طلایی', iconColor: '#FACC15', glowColor: 'rgba(250,204,21,0.30)', page: 'goldCard' },
  { icon: Trophy, label: 'دستاوردها', iconColor: '#FBBF24', glowColor: 'rgba(251,191,36,0.30)', page: 'achievements' },
  { icon: CalendarCheck, label: 'چک‌این', iconColor: '#2DD4BF', glowColor: 'rgba(45,212,191,0.30)', page: 'checkin' },
  { icon: Crown, label: 'VIP', iconColor: '#A78BFA', glowColor: 'rgba(167,139,250,0.30)', page: 'vip' },
  { icon: LayoutGrid, label: 'بیشتر', iconColor: '#D1D5DB', glowColor: 'rgba(209,213,219,0.20)', page: 'dashboard' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mobile Golden Art Card Component                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CARD_DESIGN_MAP: Record<string, { bg: string; text: string; sub: string }> = {
  'gold-gradient': {
    bg: 'linear-gradient(135deg, #b8860b, #daa520, #ffd700, #f0c040, #daa520, #b8860b)',
    text: 'text-[#2a1a00]',
    sub: 'text-[#3d2800]/90',
  },
  'black-premium': {
    bg: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #1a1a2e)',
    text: 'text-white',
    sub: 'text-gray-300',
  },
  'diamond': {
    bg: 'linear-gradient(135deg, #b8860b, #daa520, #ffd700, #e8c252, #daa520, #b8860b)',
    text: 'text-[#2a1a00]',
    sub: 'text-[#3d2800]/90',
  },
  'rose-gold': {
    bg: 'linear-gradient(135deg, #b76e79, #e8b4b8, #f4d6cc, #daa06d, #b76e79)',
    text: 'text-[#2a1018]',
    sub: 'text-[#3d1a25]/90',
  },
};

function toPersianDigits(str: string): string {
  const p = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/\d/g, (d) => p[parseInt(d)]);
}

function maskCardNumber(num: string): string {
  const c = num.replace(/-/g, '');
  if (c.length === 16) {
    return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8, 12)}-${c.slice(12, 16)}`;
  }
  return c;
}

function MobileGoldenCard({
  userId,
  userName,
  goldGrams,
  goldPriceVal,
  isLoading,
}: {
  userId: string;
  userName: string;
  goldGrams: number;
  goldPriceVal: number;
  isLoading: boolean;
}) {
  const [cardData, setCardData] = useState<Record<string, unknown> | null>(null);
  const [cardLoading, setCardLoading] = useState(true);

  /* Fetch card info */
  useEffect(() => {
    if (!userId) { setCardLoading(false); return; }
    let cancelled = false;
    const loadCard = async () => {
      try {
        const r = await fetch(`/api/gold-card?userId=${userId}`);
        const data = await r.json();
        if (!cancelled && data.hasCard && data.card) {
          setCardData(data.card);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setCardLoading(false);
      }
    };
    loadCard();
    return () => { cancelled = true; };
  }, [userId]);

  const design = (cardData?.design as string) || 'gold-gradient';
  const designConfig = CARD_DESIGN_MAP[design] || CARD_DESIGN_MAP['gold-gradient'];
  const cardNumber = (cardData?.fullCardNumber || cardData?.cardNumber || '') as string;
  const linkedGold = (cardData?.linkedGoldGram as number) || 0;
  const totalGold = goldGrams + linkedGold;
  const goldValue = totalGold * goldPriceVal;

  if (cardLoading || isLoading) {
    return (
      <div className="mx-auto w-full max-w-[320px] md:max-w-[420px] aspect-[1.85/1] rounded-2xl bg-[#1e1e1e] p-3">
        <div className="flex h-full flex-col justify-between">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-5 rounded-full" />
          </div>
          <Skeleton className="h-4 w-48 mx-auto" />
          <div className="flex justify-between">
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="h-2.5 w-8" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => {}}
      className="mx-auto block w-full max-w-[320px] md:max-w-[420px] text-start"
    >
      <div
        className="relative w-full aspect-[1.85/1] rounded-2xl overflow-hidden golden-card-animated select-none shadow-[0_8px_32px_rgba(212,175,55,0.25)]"
        style={{ background: designConfig.bg }}
      >
        {/* Subtle shimmer overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 4s ease-in-out infinite',
          }}
        />

        {/* Card content */}
        <div className="relative z-[5] flex flex-col justify-between h-full p-3" style={{ fontFamily: 'var(--font-vazir), IRANSans, sans-serif' }}>
          {/* Top row */}
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-[9px] font-bold tracking-wider ${designConfig.text}`}>
                ZARRIN GOLD
              </p>
              <p className={`text-sm font-extrabold tracking-wide ${designConfig.text} mt-0.5`}>
                زرین گلد
              </p>
            </div>
            <Wifi className={`size-4 ${designConfig.sub} rotate-90`} />
          </div>

          {/* Gold balance — centered, prominent */}
          <div className="flex flex-col items-center gap-0.5 py-0.5 mb-auto">
            <span className={`${designConfig.text} text-[9px] font-bold opacity-80`}>موجودی طلا</span>
            <span className={`${designConfig.text} text-lg font-black tabular-nums leading-none`}>
              {formatGrams(totalGold)}
            </span>
            {goldValue > 0 && (
              <span className={`${designConfig.sub} text-[7px]`}>
                ≈ {formatPrice(goldValue)}
              </span>
            )}
          </div>

          {/* Card number */}
          {cardNumber ? (
            <p className={`text-[25px] tracking-[0.14em] ${designConfig.text} text-center font-black`} style={{ fontFamily: 'var(--font-vazir), IRANSans, monospace' }}>
              {toPersianDigits(maskCardNumber(cardNumber))}
            </p>
          ) : (
            <p className={`text-[25px] tracking-[0.14em] ${designConfig.text} text-center opacity-60`} style={{ fontFamily: 'var(--font-vazir), IRANSans, monospace' }}>
              •••• •••• •••• ••••
            </p>
          )}

          {/* Bottom row */}
          <div className="flex items-end justify-between">
            <div>
              <p className={`text-[8px] font-semibold ${designConfig.sub}`}>نوع کارت</p>
              <p className={`text-[10px] font-bold ${designConfig.text}`}>
                {cardData ? (cardData.cardType === 'virtual' ? '🥇 مجازی' : '💳 فیزیکی') : 'درخواست نشده'}
              </p>
            </div>

            <div className="text-center">
              <p className={`text-[8px] font-semibold ${designConfig.sub}`}>وضعیت</p>
              <p className={`text-[10px] font-bold ${designConfig.text}`}>
                {cardData
                  ? (cardData.status === 'active' ? '✅ فعال' : cardData.status === 'frozen' ? '❄️ مسدود' : '🔴 بسته')
                  : '🆕 جدید'}
              </p>
            </div>

            <div className="text-left">
              <p className={`text-[8px] font-semibold ${designConfig.sub}`}>دارنده کارت</p>
              <p className={`text-[10px] font-bold ${designConfig.text} max-w-[80px] truncate`}>
                {userName || 'کاربر زرین گلد'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mobile Services Grid Component                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MobileServicesGrid({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {MOBILE_SERVICES.map((service) => {
        const Icon = service.icon;
        return (
          <button
            key={service.label}
            onClick={() => onNavigate(service.page)}
            className={cn(
              'group relative flex flex-col items-center justify-center gap-1.5 py-1.5 px-1 transition-all duration-300 active:scale-[0.92]',
            )}
          >
            {/* Icon container */}
            <div
              className={cn(
                'flex size-16 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110',
                'bg-[#1e1e1e] shadow-[0_2px_8px_rgba(0,0,0,0.2)]',
                'group-hover:bg-[#252525] group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]',
              )}
            >
              <Icon
                className="size-7"
                style={{ color: service.iconColor }}
                strokeWidth={1.8}
              />
            </div>
            {/* Label */}
            <span className={cn(
              'text-[11px] font-semibold leading-none whitespace-nowrap transition-colors duration-300',
              'text-[#D4AF37]/90 group-hover:text-[#D4AF37]',
              'dark:text-[#D4AF37]/75 dark:group-hover:text-[#D4AF37]',
            )}>
              {service.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mobile Promotional Slider Component                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

const PROMO_SLIDES = [
  {
    bg: 'from-[#4C1D95] via-[#5B21B6] to-[#6D28D9]',
    shadow: 'shadow-purple-500/10',
    icon: <Gift className="size-7 text-[#FCD34D]" />,
    title: 'طلای خود را هدیه بدهید!',
    desc: 'با ارسال طلای رایگان به دوستانتان، از پاداش ویژه بهره‌مند شوید',
    btn: 'ارسال هدیه',
    page: 'gifts',
  },
  {
    bg: 'from-[#92400E] via-[#B45309] to-[#D97706]',
    shadow: 'shadow-amber-500/10',
    icon: <Coins className="size-7 text-[#FEF3C7]" />,
    title: 'خرید طلا با کارمزد صفر',
    desc: 'همین الان طلای خود را با بهترین قیمت و بدون کارمزد بخرید',
    btn: 'خرید طلا',
    page: 'trade',
  },
  {
    bg: 'from-[#065F46] via-[#047857] to-[#059669]',
    shadow: 'shadow-emerald-500/10',
    icon: <TrendingUp className="size-7 text-[#A7F3D0]" />,
    title: 'سود روزانه طلای شما',
    desc: 'طلای شما هر روز بر اساس نرخ لحظه‌ای بازار ارزش‌گذاری می‌شود',
    btn: 'مشاهده سود',
    page: 'market',
  },
  {
    bg: 'from-[#7C2D12] via-[#9A3412] to-[#C2410C]',
    shadow: 'shadow-orange-500/10',
    icon: <CreditCard className="size-7 text-[#FED7AA]" />,
    title: 'کارت طلایی زرین گلد',
    desc: 'با کارت طلایی، طلای خود را به خرید روزمره تبدیل کنید',
    btn: 'درخواست کارت',
    page: 'goldCard',
  },
];

function MobilePromoSlider({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [current, setCurrent] = useState(0);

  /* Auto-rotate every 4 seconds */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* LTR wrapper to fix translateX direction in RTL mode */}
      <div dir="ltr">
        {/* Slides wrapper */}
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {PROMO_SLIDES.map((slide, i) => (
            <div
              key={i}
              className={`relative w-full shrink-0 bg-gradient-to-l ${slide.bg} p-4 shadow-lg ${slide.shadow}`}
            >
              {/* Decorative circles — clamped inside */}
              <div className="pointer-events-none absolute left-0 bottom-0 size-20 rounded-full bg-white/[0.06]" />
              <div className="pointer-events-none absolute right-0 top-0 size-24 rounded-full bg-white/[0.04]" />

              <div className="relative z-10 flex items-center gap-3" dir="rtl">
                {/* Icon */}
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  {slide.icon}
                </div>
                {/* Text + CTA */}
                <div className="min-w-0 flex-1">
                  <h3 className="mb-0.5 text-sm font-extrabold leading-tight text-white">
                    {slide.title}
                  </h3>
                  <p className="mb-2 text-[11px] leading-relaxed text-white/70">
                    {slide.desc}
                  </p>
                  <button
                    onClick={() => onNavigate(slide.page)}
                    className="rounded-lg bg-[#D4AF37] px-3 py-1 text-[11px] font-bold text-[#1a1a1a] transition-all hover:bg-[#E5C249] active:scale-95"
                  >
                    {slide.btn}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator */}
      <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
        {PROMO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              'size-1.5 rounded-full transition-all duration-300',
              i === current ? 'w-4 bg-[#D4AF37]' : 'bg-white/40',
            )}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main DashboardView Component                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function DashboardView() {
  const {
    user,
    fiatWallet,
    goldWallet,
    goldPrice,
    priceHistory,
    transactions,
    setPage,
    setFiatWallet,
    setGoldWallet,
    setGoldPrice,
    setPriceHistory,
    setTransactions,
    addToast,
    emitPageEvent,
  } = useAppStore();

  const { t } = useTranslation();
  const isMobile = useIsMobile();

  /* ── Real-time Gold Prices ── */
  const { coinPrices: realCoinPrices, prices: realPrices, isLive, source: priceSource, refresh: refreshPrices } = useRealGoldPrice();

  /* ── Local State ── */
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [selectedRange, setSelectedRange] = useState('24h');
  const [referralData, setReferralData] = useState<ReferralData | null>(null);

  // Deposit dialog
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositSubmitting, setDepositSubmitting] = useState(false);

  // Withdraw dialog
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  // Copy referral code
  const [copied, setCopied] = useState(false);

  // Gift dialog
  const [giftOpen, setGiftOpen] = useState(false);

  // Price alerts
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [newAlertType, setNewAlertType] = useState<'buy' | 'sell'>('buy');
  const [newAlertCondition, setNewAlertCondition] = useState<'above' | 'below'>('above');
  const [newAlertPrice, setNewAlertPrice] = useState('');
  const [alertSubmitting, setAlertSubmitting] = useState(false);

  // Quick Buy
  const [selectedQuickBuyGram, setSelectedQuickBuyGram] = useState<number | null>(null);

  // Gold News
  const [goldNews, setGoldNews] = useState<GoldNewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  // KYC status
  const [kycStatus, setKycStatus] = useState<string>('none');

  // Real-time gold price (from API with fallback)

  /* ── Computed Values ── */
  const isProfitPositive = true; // Mock positive
  const profitPercentage = 2.5;
  const profitAmount = Math.round(fiatWallet.balance * 0.025);
  const goldValueInToman = goldWallet.goldGrams * (goldPrice?.buyPrice ?? 0);

  const quickAmounts = [500000, 1000000, 5000000, 10000000];

const GOLD_NEWS = [
  { id: 1, title: 'افزایش ۲.۳ درصدی قیمت طلا در بازار جهانی', source: 'رویترز', time: '۲ ساعت پیش', category: 'جهانی', icon: '🌍' },
  { id: 2, title: 'بانک مرکزی: سکه تمام به رکورد ۳۵,۲۰۰,۰۰۰ واحد رسید', source: 'خبرگزاری ایسنا', time: '۳ ساعت پیش', category: 'داخلی', icon: '🇮🇷' },
  { id: 3, title: 'پیش‌بینی کارشناسان: روند صعودی طلا تا پایان سال', source: 'دنیای اقتصاد', time: '۵ ساعت پیش', category: 'تحلیل', icon: '📊' },
  { id: 4, title: 'اثر تعرفه‌های گمرکی جدید بر قیمت طلای آب‌شده', source: 'تحلیل‌گران', time: '۸ ساعت پیش', category: 'قوانین', icon: '📋' },
  { id: 5, title: 'افت ۰.۵ درصدی نرخ دلار، تأثیر بر بازار طلای ایران', source: 'صرافی‌ها', time: '۱۰ ساعت پیش', category: 'ارزی', icon: '💱' },
  { id: 6, title: 'رکورد جدید اونس جهانی طلا: ۲,۶۸۰ دلار', source: 'بلومبرگ', time: '۱۲ ساعت پیش', category: 'جهانی', icon: '🌍' },
];

  /* ── Data Fetching ── */
  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const [walletRes, pricesRes, txRes, referralRes] = await Promise.all([
        fetch(`/api/wallet?userId=${user.id}`),
        fetch('/api/gold/prices'),
        fetch(`/api/transactions?userId=${user.id}&limit=5`),
        fetch(`/api/referral?userId=${user.id}`),
      ]);

      if (walletRes.ok) {
        const walletData = await walletRes.json();
        if (walletData.success) {
          setFiatWallet({
            balance: walletData.fiat?.balance ?? 0,
            frozenBalance: walletData.fiat?.frozenBalance ?? 0,
          });
          setGoldWallet({
            goldGrams: walletData.gold?.grams ?? 0,
            frozenGold: walletData.gold?.frozenGold ?? 0,
          });
        }
      }

      if (pricesRes.ok) {
        const pricesData = await pricesRes.json();
        if (pricesData.success) {
          setGoldPrice({
            buyPrice: pricesData.prices?.buy ?? 0,
            sellPrice: pricesData.prices?.sell ?? 0,
            marketPrice: pricesData.prices?.market ?? 0,
            ouncePrice: pricesData.prices?.ounce ?? 0,
            spread: pricesData.prices?.spread ?? 0,
            updatedAt: pricesData.prices?.updatedAt ?? new Date().toISOString(),
          });
          if (pricesData.history?.length > 0) {
            setPriceHistory(
              pricesData.history.map((p: PricePoint) => ({
                timestamp: p.timestamp,
                price: p.price,
              }))
            );
          }
        }
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData.success) {
          setTransactions(txData.transactions);
        }
      }

      if (referralRes.ok) {
        const refData = await referralRes.json();
        if (refData.success) {
          setReferralData({
            referralCode: refData.referralCode,
            totalInvited: refData.totalInvited,
            totalRewarded: refData.totalRewarded,
          });
        }
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, setFiatWallet, setGoldWallet, setGoldPrice, setPriceHistory, setTransactions]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /* ── Fetch Gold News ── */
  useEffect(() => {
    const fetchNews = async () => {
      setNewsLoading(true);
      try {
        const res = await fetch('/api/news/gold');
        const data = await res.json();
        if (data.success && data.news?.length > 0) {
          setGoldNews(data.news);
        }
      } catch (error) {
        console.error('Failed to fetch gold news:', error);
      } finally {
        setNewsLoading(false);
      }
    };
    fetchNews();
  }, []);

  /* ── Chart Data Processing ── */
  useEffect(() => {
    if (priceHistory.length === 0) {
      // Generate mock chart data if no real data
      const now = new Date();
      const mockData: ChartDataPoint[] = Array.from({ length: 24 }).map((_, i) => {
        const d = new Date(now.getTime() - (23 - i) * 3600000);
        return {
          time: new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(d),
          price: goldPrice?.marketPrice
            ? goldPrice.marketPrice + (Math.random() - 0.5) * 500000
            : 34000000 + i * 200000 + (Math.random() - 0.5) * 300000,
        };
      });
      setChartData(mockData);
      return;
    }

    const data = priceHistory.map((p) => ({
      time: new Intl.DateTimeFormat('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(p.timestamp)),
      price: p.price,
    }));
    setChartData(data);
  }, [priceHistory, goldPrice?.marketPrice]);

  /* ── Fetch KYC Status ── */
  useEffect(() => {
    if (!user?.id) return;
    const fetchKyc = async () => {
      try {
        const res = await fetch(`/api/kyc?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.kyc?.status) setKycStatus(data.kyc.status);
        }
      } catch { /* ignore */ }
    };
    fetchKyc();
  }, [user?.id]);

  /* ── Navigate to KYC ── */
  const goToKyc = () => {
    emitPageEvent('start-kyc');
    setPage('profile');
  };

  /* ── Handlers ── */
  const handleCopyReferral = async () => {
    if (!referralData?.referralCode) return;
    try {
      await navigator.clipboard.writeText(referralData.referralCode);
      setCopied(true);
      addToast('کد دعوت کپی شد', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('خطا در کپی کد', 'error');
    }
  };

  const handleDeposit = async () => {
    if (!user?.id || !depositAmount || Number(depositAmount) <= 0) return;
    setDepositSubmitting(true);
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount: Number(depositAmount) }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message, 'success');
        setDepositOpen(false);
        setDepositAmount('');
        fetchDashboardData();
      } else {
        addToast(data.message, 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setDepositSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user?.id || !withdrawAmount || Number(withdrawAmount) <= 0) return;
    setWithdrawSubmitting(true);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount: Number(withdrawAmount) }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message, 'success');
        setWithdrawOpen(false);
        setWithdrawAmount('');
        fetchDashboardData();
      } else {
        addToast(data.message, 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  /* ── Fetch Price Alerts ── */
  const fetchPriceAlerts = useCallback(async () => {
    if (!user?.id) return;
    setAlertsLoading(true);
    try {
      const res = await fetch(`/api/alerts?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setPriceAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to fetch price alerts:', error);
    } finally {
      setAlertsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPriceAlerts();
  }, [fetchPriceAlerts]);

  /* ── Price Alert Handlers ── */
  const handleToggleAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setPriceAlerts(prev =>
          (prev || []).map(a => (a.id === id ? { ...a, isActive: data.alert?.isActive ?? a.isActive } : a)),
        );
        addToast(data.message, 'success');
      } else {
        addToast(data.message, 'error');
      }
    } catch {
      addToast('خطا در تغییر وضعیت هشدار', 'error');
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPriceAlerts(prev => prev.filter(a => a.id !== id));
        addToast(data.message, 'info');
      } else {
        addToast(data.message, 'error');
      }
    } catch {
      addToast('خطا در حذف هشدار', 'error');
    }
  };

  const handleAddAlert = async () => {
    if (!user?.id) return;
    const price = Number(newAlertPrice);
    if (!price || price <= 0) return;
    setAlertSubmitting(true);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: newAlertType,
          condition: newAlertCondition,
          targetPrice: price,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message, 'success');
        setAlertDialogOpen(false);
        setNewAlertPrice('');
        setNewAlertType('buy');
        setNewAlertCondition('above');
        fetchPriceAlerts();
      } else {
        addToast(data.message, 'error');
      }
    } catch {
      addToast('خطا در ایجاد هشدار', 'error');
    } finally {
      setAlertSubmitting(false);
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  Render — Mobile Layout                                                  */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  if (isMobile) {
    return (
      <>
        <motion.div
          className="space-y-5 pb-28 pt-2"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* ─── 1. Golden Art Card ─── */}
          <motion.div variants={itemVariants}>
            <MobileGoldenCard
              userId={user?.id || ''}
              userName={user?.fullName || ''}
              goldGrams={goldWallet.goldGrams}
              goldPriceVal={goldPrice?.buyPrice ?? 0}
              isLoading={isLoading}
            />
          </motion.div>

          {/* ─── 2. Services Grid (4×3) ─── */}
          <motion.div variants={itemVariants}>
            <MobileServicesGrid onNavigate={setPage} />
          </motion.div>

          {/* ─── 3. KYC Status Card ─── */}
          {kycStatus !== 'approved' && (
            <motion.div variants={itemVariants}>
              <button
                onClick={goToKyc}
                className={cn(
                  'w-full relative rounded-2xl overflow-hidden border transition-all duration-300 text-start active:scale-[0.98]',
                  kycStatus === 'pending'
                    ? 'border-gold/20 bg-gradient-to-l from-gold/[0.08] via-amber-500/[0.05] to-transparent'
                    : kycStatus === 'rejected'
                      ? 'border-red-500/20 bg-gradient-to-l from-red-500/[0.06] to-red-500/[0.02]'
                      : 'border-gold/25 bg-gradient-to-l from-gold/12 via-gold/6 to-gold/[0.02]',
                )}
              >
                <div className="pointer-events-none absolute -top-4 -left-4 size-20 rounded-full bg-gold/8 blur-xl" />
                <div className="relative p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'size-11 rounded-xl flex items-center justify-center shadow-lg shrink-0',
                      kycStatus === 'pending'
                        ? 'bg-gradient-to-br from-gold to-amber-600 shadow-gold/20'
                        : kycStatus === 'rejected'
                          ? 'bg-gradient-to-br from-red-400 to-red-600 shadow-red-500/20'
                          : 'bg-gradient-to-br from-gold to-gold-dark shadow-gold/25',
                    )}>
                      {kycStatus === 'pending' ? (
                        <Clock className="size-5 text-white" />
                      ) : kycStatus === 'rejected' ? (
                        <XCircle className="size-5 text-white" />
                      ) : (
                        <Shield className="size-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        'text-sm font-bold',
                        kycStatus === 'pending'
                          ? 'text-gold'
                          : kycStatus === 'rejected'
                            ? 'text-red-400'
                            : 'text-gold-gradient',
                      )}>
                        {kycStatus === 'pending' && 'مدارک در حال بررسی است'}
                        {kycStatus === 'rejected' && 'احراز هویت رد شد — تلاش مجدد کنید'}
                        {kycStatus === 'none' && 'احراز هویت خود را تکمیل کنید'}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {kycStatus === 'pending' && 'نتیجه از طریق اعلان اطلاع داده می‌شود'}
                        {kycStatus === 'rejected' && 'با تکمیل مجدد مدارک، امکانات ویژه فعال می‌شود'}
                        {kycStatus === 'none' && 'برداشت، وام طلایی و مزایای ویژه منتظر شماست'}
                      </p>
                    </div>
                    {kycStatus !== 'pending' && (
                      <div className="shrink-0 size-8 rounded-lg bg-gold/10 flex items-center justify-center">
                        <ChevronLeft className="size-4 text-gold" />
                      </div>
                    )}
                  </div>
                  {kycStatus === 'none' && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-gold/[0.06] border border-gold/10 p-2.5">
                      <Gem className="size-3.5 text-gold shrink-0" />
                      <span className="text-[11px] text-foreground/70">برداشت تا ۱ کیلوگرم</span>
                      <span className="text-foreground/20">|</span>
                      <Sparkles className="size-3.5 text-gold shrink-0" />
                      <span className="text-[11px] text-foreground/70">کارمزد ویژه</span>
                      <span className="text-foreground/20">|</span>
                      <Headphones className="size-3.5 text-gold shrink-0" />
                      <span className="text-[11px] text-foreground/70">پشتیبانی VIP</span>
                    </div>
                  )}
                </div>
              </button>
            </motion.div>
          )}

          {/* ─── 4. Promotional Banner ─── */}
          <motion.div variants={itemVariants} className="mx-auto w-full max-w-[320px]">
            <MobilePromoSlider onNavigate={setPage} />
          </motion.div>
        </motion.div>

        {/* ─── Dialogs (always rendered) ─── */}
        {/* Deposit Dialog */}
        <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowDownToLine className="size-5 text-blue-500" />
                واریز به کیف پول
              </DialogTitle>
              <DialogDescription>
                مبلغ مورد نظر را وارد کنید یا یکی از مبالغ پیشنهادی را انتخاب نمایید.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="deposit-amount">مقدار (گرم طلا)</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="مبلغ را وارد کنید"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="text-left tabular-nums"
                  min={0}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setDepositAmount(String(amount))}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all hover:border-gold/50 hover:bg-gold/5 ${
                      Number(depositAmount) === amount
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border text-foreground'
                    }`}
                  >
                    {formatPrice(amount)} گرم طلا
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => { setDepositOpen(false); setDepositAmount(''); }}>
                انصراف
              </Button>
              <Button
                onClick={handleDeposit}
                disabled={!depositAmount || Number(depositAmount) <= 0 || depositSubmitting}
                className="bg-gold text-gold-dark hover:bg-gold/90"
              >
                {depositSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    در حال پردازش...
                  </>
                ) : (
                  'واریز'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Withdraw Dialog */}
        <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowUpFromLine className="size-5 text-amber-500" />
                برداشت از کیف پول
              </DialogTitle>
              <DialogDescription>
                مبلغ مورد نظر برای برداشت را وارد کنید.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">موجودی قابل برداشت:</span>
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {formatToman(fiatWallet.balance - fiatWallet.frozenBalance)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">مقدار (گرم طلا)</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="مبلغ را وارد کنید"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="text-left tabular-nums"
                  min={0}
                  max={fiatWallet.balance - fiatWallet.frozenBalance}
                />
                {Number(withdrawAmount) > fiatWallet.balance - fiatWallet.frozenBalance && (
                  <p className="text-xs text-red-500">مبلغ وارد شده از موجودی قابل برداشت بیشتر است.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setWithdrawAmount(String(amount))}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all hover:border-gold/50 hover:bg-gold/5 ${
                      Number(withdrawAmount) === amount
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border text-foreground'
                    }`}
                  >
                    {formatPrice(amount)} گرم طلا
                  </button>
                ))}
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                  برای برداشت وجه، احراز هویت (KYC) شما باید تأیید شده باشد. حداکثر مبلغ برداشت در روز
                  ۱ کیلوگرم طلا است.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => { setWithdrawOpen(false); setWithdrawAmount(''); }}>
                انصراف
              </Button>
              <Button
                onClick={handleWithdraw}
                disabled={
                  !withdrawAmount ||
                  Number(withdrawAmount) <= 0 ||
                  Number(withdrawAmount) > fiatWallet.balance - fiatWallet.frozenBalance ||
                  withdrawSubmitting
                }
                className="bg-gold text-gold-dark hover:bg-gold/90"
              >
                {withdrawSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    در حال پردازش...
                  </>
                ) : (
                  'ثبت درخواست برداشت'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Gold Gift Dialog */}
        <GoldGiftDialog open={giftOpen} onOpenChange={setGiftOpen} triggerOnly />

        {/* Add Price Alert Dialog */}
        <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="size-5 text-[#D4AF37]" />
                افزودن هشدار قیمت
                <span className="text-gold-gradient">🔔</span>
              </DialogTitle>
              <DialogDescription>
                هشدار قیمت جدید تنظیم کنید تا از تغییرات بازار مطلع شوید.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>نوع هشدار</Label>
                <Select
                  value={newAlertType}
                  onValueChange={(val: string) => setNewAlertType(val as 'buy' | 'sell')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="size-4 text-emerald-500" />
                        خرید طلا
                      </span>
                    </SelectItem>
                    <SelectItem value="sell">
                      <span className="flex items-center gap-2">
                        <TrendingDown className="size-4 text-red-500" />
                        فروش طلا
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>شرط</Label>
                <Select
                  value={newAlertCondition}
                  onValueChange={(val: string) => setNewAlertCondition(val as 'above' | 'below')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">بالای</SelectItem>
                    <SelectItem value="below">زیر</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert-price">قیمت هدف (واحد طلا)</Label>
                <Input
                  id="alert-price"
                  type="number"
                  placeholder="مثلاً: ۴۰,۰۰۰,۰۰۰"
                  value={newAlertPrice}
                  onChange={(e) => setNewAlertPrice(e.target.value)}
                  className="text-left tabular-nums"
                  min={0}
                />
              </div>

              {newAlertPrice && Number(newAlertPrice) > 0 && (
                <div className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-3">
                  <p className="text-xs text-muted-foreground">پیش‌نمایش:</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {newAlertType === 'buy' ? 'خرید' : 'فروش'} طلا وقتی قیمت{' '}
                    {newAlertCondition === 'above' ? 'بالای' : 'زیر'}{' '}
                    <span className="font-bold tabular-nums text-[#D4AF37]">
                      {formatPrice(Number(newAlertPrice))} واحد
                    </span>
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setAlertDialogOpen(false)}>
                انصراف
              </Button>
              <Button
                onClick={handleAddAlert}
                disabled={!newAlertPrice || Number(newAlertPrice) <= 0 || alertSubmitting}
                className="btn-gold-gradient"
              >
                {alertSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    در حال ثبت...
                  </>
                ) : (
                  'ذخیره هشدار'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  Render — Desktop Layout                                                 */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <motion.div
      className="mx-auto max-w-6xl space-y-4 md:space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ──────────────────────────────────────────────────────── */}
      {/*  Row 1 — Stat Cards                                      */}
      {/* ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <StatCardsSkeleton />
      ) : (
        <motion.div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6" variants={itemVariants}>
          {/* Fiat Wallet */}
          <Card className="card-gold-border group overflow-hidden transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                  <Wallet className="size-6 text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{t('dashboard.balance')}</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                    {formatToman(fiatWallet.balance)}
                  </p>
                  {fiatWallet.frozenBalance > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t('common.frozen')}: {formatToman(fiatWallet.frozenBalance)}
                    </p>
                  )}
                </div>
                <div className="h-12 w-1 rounded-full bg-gold/60" />
              </div>
            </CardContent>
          </Card>

          {/* Gold Wallet */}
          <Card className="group overflow-hidden border border-gold/20 transition-shadow hover:shadow-md bg-gradient-to-br from-yellow-900/20 to-amber-900/10">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gold/15">
                  <Coins className="size-6 text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{t('dashboard.estimatedValue')}</p>
                  <p className="mt-1 text-xl font-bold tabular-nums gold-gradient-text">
                    {formatGrams(goldWallet.goldGrams)}
                  </p>
                  <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                    {goldValueInToman > 0 ? formatPrice(goldValueInToman) + ` ${t('common.toman')}` : t('common.noBalance')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profit/Loss */}
          <Card
            className={`card-success-glow group overflow-hidden transition-shadow hover:shadow-md ${
              isProfitPositive
                ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                : 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20'
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${
                    isProfitPositive
                      ? 'bg-emerald-100 dark:bg-emerald-900/40'
                      : 'bg-red-100 dark:bg-red-900/40'
                  }`}
                >
                  {isProfitPositive ? (
                    <TrendingUp className="size-6 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <TrendingDown className="size-6 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{t('dashboard.profitLoss')}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={cn(
                        'text-xl font-bold tabular-nums',
                        isProfitPositive ? 'text-success-gradient' : 'text-danger-gradient',
                      )}
                    >
                      {isProfitPositive ? '+' : '-'}{formatNumber(profitPercentage)}%
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                    {formatToman(profitAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}


      {/* ──────────────────────────────────────────────────────── */}
      {/*  KYC Status Card (Desktop)                                */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && kycStatus !== 'approved' && (
        <motion.div variants={itemVariants}>
          <button
            onClick={goToKyc}
            className={cn(
              'w-full relative rounded-2xl overflow-hidden border transition-all duration-300 text-start hover:shadow-lg',
              kycStatus === 'pending'
                ? 'border-gold/20 bg-gradient-to-l from-gold/[0.06] via-amber-500/[0.04] to-transparent hover:shadow-gold/5'
                : kycStatus === 'rejected'
                  ? 'border-red-500/20 bg-gradient-to-l from-red-500/[0.05] to-red-500/[0.01] hover:shadow-red-500/5'
                  : 'border-gold/25 bg-gradient-to-l from-gold/10 via-gold/5 to-gold/[0.02] hover:border-gold/40 hover:shadow-gold/10',
            )}
          >
            <div className="pointer-events-none absolute -top-6 -left-6 size-28 rounded-full bg-gold/8 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-4 -right-4 size-20 rounded-full bg-gold/6 blur-xl" />
            {kycStatus === 'none' && (
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent via-gold/[0.04] to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
            )}
            <div className="relative p-5 md:p-6">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'size-12 rounded-xl flex items-center justify-center shadow-lg shrink-0',
                  kycStatus === 'pending'
                    ? 'bg-gradient-to-br from-gold to-amber-600 shadow-gold/20'
                    : kycStatus === 'rejected'
                      ? 'bg-gradient-to-br from-red-400 to-red-600 shadow-red-500/20'
                      : 'bg-gradient-to-br from-gold to-gold-dark shadow-gold/25',
                )}>
                  {kycStatus === 'pending' ? (
                    <Clock className="size-6 text-white" />
                  ) : kycStatus === 'rejected' ? (
                    <XCircle className="size-6 text-white" />
                  ) : (
                    <Shield className="size-6 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={cn(
                      'text-base font-bold',
                      kycStatus === 'pending'
                        ? 'text-gold'
                        : kycStatus === 'rejected'
                          ? 'text-red-400'
                          : 'text-gold-gradient',
                    )}>
                      {kycStatus === 'pending' && 'مدارک احراز هویت در حال بررسی است'}
                      {kycStatus === 'rejected' && 'احراز هویت رد شد — تلاش مجدد کنید'}
                      {kycStatus === 'none' && 'احراز هویت خود را تکمیل کنید'}
                    </h3>
                    {kycStatus === 'none' && (
                      <Badge variant="outline" className="text-xs border-amber-500/30 bg-amber-500/5 text-muted-foreground">
                        <AlertTriangle className="size-3 ml-1" />
                        ضروری
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {kycStatus === 'pending' && 'کارشناسان ما مدارک شما را بررسی می‌کنند. نتیجه از طریق اعلان اعلام خواهد شد.'}
                    {kycStatus === 'rejected' && 'با ارسال مجدد مدارک، تمام امکانات ویژه زرین گلد فعال می‌شود.'}
                    {kycStatus === 'none' && 'با تکمیل احراز هویت، برداشت طلای فیزیکی، وام طلایی و مزایای VIP در اختیار شما قرار می‌گیرد.'}
                  </p>
                  {kycStatus === 'none' && (
                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      {[
                        { icon: Gem, text: 'برداشت تا ۱ کیلوگرم' },
                        { icon: Sparkles, text: 'کارمزد معاملات ویژه' },
                        { icon: Crown, text: 'وام طلایی' },
                        { icon: Headphones, text: 'پشتیبانی ۲۴/۷' },
                      ].map((b, i) => {
                        const BIcon = b.icon;
                        return (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-foreground/70">
                            <BIcon className="size-3 text-gold" />
                            <span>{b.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {kycStatus !== 'pending' && (
                  <div className="shrink-0 flex items-center gap-2">
                    <span className={cn(
                      'text-sm font-bold',
                      kycStatus === 'rejected' ? 'text-red-400' : 'text-gold',
                    )}>
                      {kycStatus === 'rejected' ? 'تلاش مجدد' : 'شروع احراز'}
                    </span>
                    <ChevronLeft className={cn(
                      'size-5',
                      kycStatus === 'rejected' ? 'text-red-400' : 'text-gold',
                    )} />
                  </div>
                )}
              </div>
            </div>
          </button>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Portfolio Performance + Live Coin Prices                   */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && (
        <motion.div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6" variants={itemVariants}>
          {/* Portfolio Performance Donut Chart */}
          <Card className="overflow-hidden border-gold/20 bg-gradient-to-br from-gold/[0.03] via-card to-gold/[0.01] md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <PieChartIcon className="size-4 text-gold" />
                {t('dashboard.portfolio')}
              </CardTitle>
              <Badge variant="outline" className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                <TrendingUp className="size-3" />
                +۲.۴٪
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                {/* Donut Chart */}
                <div className="relative size-40 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={PORTFOLIO_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={72}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {PORTFOLIO_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs text-muted-foreground">{t('dashboard.totalValue')}</span>
                    <span className="mt-0.5 text-lg font-bold tabular-nums gold-gradient-text">
                      {formatToman(fiatWallet.balance + goldValueInToman)}
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-1 flex-col gap-3">
                  {PORTFOLIO_DATA.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="size-3 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold tabular-nums text-foreground">
                          {formatNumber(item.value)}٪
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="mt-1 border-t border-border/50 pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <TrendingUp className="size-3.5 text-emerald-500" />
                      <span>{t('dashboard.dailyChange')}</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">+۲.۴٪</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Coin Prices */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Coins className="size-4 text-gold" />
                {t('dashboard.coinPrices')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {realCoinPrices.map((coin) => (
                  <div
                    key={coin.name}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-gold/10">
                        <Coins className="size-4 text-gold" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{coin.name}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold tabular-nums text-foreground">{coin.priceFormatted}</p>
                      <p
                        className={cn(
                          'text-[10px] font-semibold tabular-nums',
                          coin.direction === 'up'
                            ? 'text-emerald-500'
                            : coin.direction === 'down'
                              ? 'text-red-500'
                              : 'text-muted-foreground',
                        )}
                      >
                        {coin.direction === 'up' ? '+' : ''}{coin.change}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-[10px] text-muted-foreground/70">
                {t('common.lastUpdate')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Row 2 — Gold Price Chart                                */}
      {/* ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <ChartSkeleton />
      ) : (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base font-bold">
                <span className="flex items-center gap-2">
                  <span className="gold-gradient-text text-lg">{t('dashboard.priceChart')}</span>
                  <span className={cn(
                    'relative inline-block size-2 rounded-full',
                    'bg-emerald-500',
                  )}>
                    <span className="absolute inset-0 inline-block size-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
                  </span>
                  <span className={cn(
                    'text-xs font-normal',
                    'text-emerald-600 dark:text-emerald-400',
                  )}>
                    {t('common.live')}
                  </span>
                </span>
              </CardTitle>
              <div className="flex gap-1.5">
                {[
                  { key: '1h', label: t('chart.1h') },
                  { key: '24h', label: t('chart.24h') },
                  { key: '7d', label: t('chart.7d') },
                  { key: '30d', label: t('chart.30d') },
                ].map((range) => (
                  <Button
                    key={range.key}
                    size="sm"
                    variant={selectedRange === range.key ? 'default' : 'outline'}
                    className={
                      selectedRange === range.key
                        ? 'bg-gold text-gold-dark hover:bg-gold/90 text-xs'
                        : 'text-xs'
                    }
                    onClick={() => setSelectedRange(range.key)}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="pb-6 pt-2">
              {goldPrice && (
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t('price.buyPrice')}</span>
                    <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatToman(goldPrice.buyPrice)}
                    </span>
                  </div>
                  <Separator orientation="vertical" className="hidden h-4 sm:block" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">قیمت فروش:</span>
                    <span className="text-sm font-bold tabular-nums text-red-500 dark:text-red-400">
                      {formatToman(goldPrice.sellPrice)}
                    </span>
                  </div>
                  <Separator orientation="vertical" className="hidden h-4 sm:block" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">اسپرد:</span>
                    <span className="text-sm font-medium tabular-nums text-muted-foreground">
                      {formatToman(goldPrice.spread)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Activity className="size-3 text-gold" />
                    <span className="text-[11px] text-muted-foreground">
                      آخرین بروزرسانی: {new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}
                    </span>
                  </div>
                </div>
              )}
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.35} />
                        <stop offset="60%" stopColor="#D4AF37" stopOpacity={0.08} />
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#B8960C" />
                        <stop offset="50%" stopColor="#D4AF37" />
                        <stop offset="100%" stopColor="#F0D060" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.08 85 / 15%)" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11, fill: 'oklch(0.52 0.01 85)' }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'oklch(0.52 0.01 85)' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}M`}
                      width={45}
                      domain={['dataMin - 500000', 'dataMax + 500000']}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="url(#goldLine)"
                      strokeWidth={2.5}
                      fill="url(#goldGradient)"
                      dot={false}
                      activeDot={{
                        r: 5,
                        fill: '#D4AF37',
                        stroke: '#fff',
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Row 3 — Quick Actions + Gold News Feed                   */}
      {/* ──────────────────────────────────────────────────────── */}
      <motion.div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6" variants={itemVariants}>
        {/* Quick Actions */}
        {isLoading ? (
          <QuickActionsSkeleton />
        ) : (
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Clock className="size-4 text-gold" />
                {t('dashboard.quickActions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Buy Gold */}
                <button
                  onClick={() => setPage('trade')}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-gold/10 bg-gradient-to-br from-gold/5 to-gold/0 p-4 transition-all card-float hover:border-gold/30 hover:shadow-md hover:shadow-gold/5 active:scale-[0.97]"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 transition-colors group-hover:bg-emerald-200 dark:bg-emerald-900/40 dark:group-hover:bg-emerald-900/60">
                    <ShoppingCart className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{t('dashboard.buyGold')}</span>
                </button>

                {/* Sell Gold */}
                <button
                  onClick={() => setPage('trade')}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-gold/10 bg-gradient-to-br from-gold/5 to-gold/0 p-4 transition-all card-float hover:border-gold/30 hover:shadow-md hover:shadow-gold/5 active:scale-[0.97]"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-red-100 transition-colors group-hover:bg-red-200 dark:bg-red-900/40 dark:group-hover:bg-red-900/60">
                    <HandCoins className="size-5 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{t('dashboard.sellGold')}</span>
                </button>

                {/* Payment Gateway */}
                <button
                  onClick={() => setPage('payment-gateway')}
                  className="card-float group relative flex flex-col items-center gap-2 rounded-xl border border-gold/10 bg-gradient-to-br from-gold/5 to-gold/0 p-4 transition-all hover:border-gold/30 hover:shadow-md hover:shadow-gold/5 active:scale-[0.97]"
                >
                  <Badge className="badge-gold absolute -top-1.5 -left-1.5 text-[9px] px-1.5 py-0"> جدید</Badge>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-blue-100 transition-colors group-hover:bg-blue-200 dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60">
                    <Landmark className="size-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">درگاه پرداخت</span>
                </button>

                {/* Withdraw */}
                <button
                  onClick={() => setWithdrawOpen(true)}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-gold/10 bg-gradient-to-br from-gold/5 to-gold/0 p-4 transition-all card-float hover:border-gold/30 hover:shadow-md hover:shadow-gold/5 active:scale-[0.97]"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-amber-100 transition-colors group-hover:bg-amber-200 dark:bg-amber-900/40 dark:group-hover:bg-amber-900/60">
                    <ArrowUpFromLine className="size-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{t('dashboard.withdraw')}</span>
                </button>

                {/* Gold Gift */}
                <button
                  onClick={() => setPage('wallet')}
                  className="card-float group relative flex flex-col items-center gap-2 rounded-xl border border-gold/10 bg-gradient-to-br from-gold/5 to-gold/0 p-4 transition-all hover:border-gold/30 hover:shadow-md hover:shadow-gold/5 active:scale-[0.97]"
                >
                  <Badge className="badge-gold absolute -top-1.5 -left-1.5 text-[9px] px-1.5 py-0">{t('common.new')}</Badge>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-pink-100 transition-colors group-hover:bg-pink-200 dark:bg-pink-900/40 dark:group-hover:bg-pink-900/60">
                    <Gift className="size-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{t('dashboard.goldGift')}</span>
                </button>

                {/* Transactions */}
                <button
                  onClick={() => setPage('transactions')}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-gold/10 bg-gradient-to-br from-gold/5 to-gold/0 p-4 transition-all card-float hover:border-gold/30 hover:shadow-md hover:shadow-gold/5 active:scale-[0.97]"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-cyan-100 transition-colors group-hover:bg-cyan-200 dark:bg-cyan-900/40 dark:group-hover:bg-cyan-900/60">
                    <Receipt className="size-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{t('dashboard.transactions')}</span>
                </button>

                {/* Market Analysis */}
                <button
                  onClick={() => setPage('market')}
                  className="card-float group flex flex-col items-center gap-2 rounded-xl border border-gold/10 bg-gradient-to-br from-gold/5 to-gold/0 p-4 transition-all hover:border-gold/30 hover:shadow-md hover:shadow-gold/5 active:scale-[0.97]"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-violet-100 transition-colors group-hover:bg-violet-200 dark:bg-violet-900/40 dark:group-hover:bg-violet-900/60">
                    <BarChart3 className="size-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{t('dashboard.marketAnalysis')}</span>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gold & Coin News Feed */}
        <Card className="card-gold-border overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <BarChart3 className="size-4 text-gold" />
              {' '}{t('dashboard.goldNews')}
            </CardTitle>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setPage('market'); }}
              className="text-xs font-medium text-gold hover:text-gold/80 transition-colors"
            >
              {t('common.viewAll')}
            </a>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] md:max-h-[460px] overflow-y-auto">
              {newsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-lg border border-border/50 p-3">
                      <Skeleton className="mb-2 h-4 w-3/4" />
                      <Skeleton className="mb-1 h-3 w-1/3" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              ) : goldNews.length > 0 ? (
                <div className="space-y-2.5">
                  {goldNews.slice(0, 6).map((item, idx) => (
                    <a
                      key={idx}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover-lift-sm block rounded-lg border border-border/50 p-3 transition-colors hover:border-gold/20 hover:bg-muted/30"
                    >
                      <p className="text-sm font-semibold leading-6 text-foreground line-clamp-2">
                        {item.title}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {item.source}
                        </span>
                        {item.date && (
                          <>
                            <span className="text-border">·</span>
                            <span className="text-xs text-muted-gold">
                              {item.date}
                            </span>
                          </>
                        )}
                      </div>
                      {item.snippet && (
                        <p className="mt-1 text-xs leading-5 text-muted-foreground/80 line-clamp-2">
                          {item.snippet}
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BarChart3 className="mb-2 size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{t('dashboard.newsLoading')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Recent Transactions — Full Width                         */}
      {/* ──────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        {isLoading ? (
          <TransactionsSkeleton />
        ) : (
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Receipt className="size-4 text-gold" />
                {t('dashboard.recentTransactions')}
              </CardTitle>
              {transactions.length > 0 && (
                <button
                  onClick={() => setPage('transactions')}
                  className="flex items-center gap-1 text-xs font-medium text-gold transition-colors hover:text-gold-dark"
                >
                  {t('common.viewAll')}
                  <ChevronLeft className="size-3.5" />
                </button>
              )}
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
                    <Receipt className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{t('dashboard.noTransactions')}</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {t('dashboard.noTransactionsDesc')}
                  </p>
                </div>
              ) : (
                <div className="max-h-80 space-y-1 overflow-y-auto">
                  {transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50"
                    >
                      <TransactionIcon type={tx.type} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {getTransactionTypeLabel(tx.type)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getTimeAgo(tx.createdAt)}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                          {tx.type === 'buy_gold' || tx.type === 'withdrawal' ? '-' : '+'}
                          {tx.amountFiat > 0 ? formatPrice(tx.amountFiat) : formatGrams(tx.amountGold)}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${getTransactionStatusColor(tx.status)}`}
                        >
                          {getTransactionStatusLabel(tx.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Quick Buy + Market News (2-col on desktop)              */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && (
        <motion.div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6" variants={itemVariants}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
          <Card className="card-gold-border card-glass-premium overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Zap className="size-4 text-[#D4AF37]" />
                {t('dashboard.quickBuy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-gold/[0.04] border border-gold/15 px-3 py-2">
                <Coins className="size-4 text-[#D4AF37]" />
                <span className="text-xs text-muted-foreground">{t('dashboard.buyPricePerGram')}</span>
                <span className="text-sm font-bold tabular-nums text-[#D4AF37]">
                  {goldPrice ? formatToman(goldPrice.buyPrice) : '---'}
                </span>
              </div>

              <p className="mb-3 text-sm text-muted-foreground">{t('dashboard.selectAmount')}</p>
              <div className="mb-4 flex gap-3">
                {[0.1, 0.5, 1].map((grams) => (
                  <button
                    key={grams}
                    type="button"
                    onClick={() => setSelectedQuickBuyGram(grams)}
                    className={cn(
                      'flex-1 rounded-xl border px-4 py-3 text-center transition-all active:scale-[0.97]',
                      selectedQuickBuyGram === grams
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-md shadow-[#D4AF37]/10'
                        : 'border-border bg-background hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5'
                    )}
                  >
                    <span className={cn(
                      'text-lg font-bold tabular-nums',
                      selectedQuickBuyGram === grams ? 'text-[#D4AF37]' : 'text-foreground'
                    )}>
                      {formatNumber(grams)}
                    </span>
                    <span className="text-xs text-muted-foreground">{t('common.gram')}</span>
                  </button>
                ))}
              </div>

              {selectedQuickBuyGram !== null && goldPrice && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.03] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">مقدار:</span>
                      <span className="text-sm font-bold tabular-nums text-foreground">
                        {formatGrams(selectedQuickBuyGram)}
                      </span>
                    </div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">مبلغ کل:</span>
                      <span className="text-base font-bold tabular-nums text-[#D4AF37]">
                        {formatToman(Math.round(selectedQuickBuyGram * goldPrice.buyPrice))}
                      </span>
                    </div>
                    <Button
                      className="btn-gold-gradient w-full"
                      onClick={() => {
                        addToast('خرید شما با موفقیت انجام شد', 'success');
                        setSelectedQuickBuyGram(null);
                      }}
                    >
                      <ShoppingCart className="ml-2 size-4" />
                      تأیید خرید
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          >
          <Card className="card-gold-border card-glass-premium overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                📰 اخبار بازار طلا
              </CardTitle>
              <button
                onClick={() => setPage('market')}
                className="text-xs font-medium text-gold transition-colors hover:text-gold-light hover:underline"
              >
                مشاهده همه
              </button>
            </CardHeader>
            <CardContent>
              <div className="max-h-72 md:max-h-[420px] overflow-y-auto">
                {GOLD_NEWS.map((news, index) => (
                  <motion.div
                    key={news.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
                    className={cn(
                      'hover-lift-sm cursor-pointer rounded-lg p-3 transition-colors hover:bg-muted/40',
                      index < GOLD_NEWS.length - 1 && 'border-b border-border/40',
                    )}
                    onClick={() => setPage('market')}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-lg leading-none">{news.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold leading-relaxed text-foreground">{news.title}</p>
                        <div className="mt-1.5 flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">{news.source}</span>
                          <span className="text-border">•</span>
                          <span className="text-muted-gold">{news.time}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Gold Rate Comparison Widget                              */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
        >
          <Card className="card-gold-border card-glass-premium overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Scale className="size-4 text-[#D4AF37]" />
                ⚖️ مقایسه نرخ
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Three Key Metrics */}
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-center dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <p className="text-xs text-muted-foreground">قیمت خرید</p>
                  <p className="mt-1 text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {goldPrice ? formatPrice(goldPrice.buyPrice) : '---'}
                  </p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 text-center dark:border-red-900/50 dark:bg-red-950/20">
                  <p className="text-xs text-muted-foreground">قیمت فروش</p>
                  <p className="mt-1 text-sm font-bold tabular-nums text-red-500 dark:text-red-400">
                    {goldPrice ? formatPrice(goldPrice.sellPrice) : '---'}
                  </p>
                </div>
                <div className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">اسپرد (کارمزد)</p>
                  <p className="mt-1 text-sm font-bold tabular-nums text-[#D4AF37]">
                    {goldPrice ? ((goldPrice.spread / goldPrice.buyPrice) * 100).toFixed(2) + '٪' : '---'}
                  </p>
                </div>
              </div>

              {/* Visual Spread Bar */}
              <div className="mb-4">
                <div className="relative h-8 overflow-hidden rounded-lg bg-gradient-to-l from-emerald-100 via-[#D4AF37]/15 to-red-100 dark:from-emerald-900/30 dark:via-[#D4AF37]/10 dark:to-red-900/30">
                  <div
                    className="absolute inset-y-0 flex items-center justify-center bg-[#D4AF37]/15"
                    style={{ left: '30%', right: '30%' }}
                  >
                    <span className="whitespace-nowrap text-xs font-bold text-[#D4AF37]">اسپرد</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#D4AF37]/30" />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>خرید</span>
                  <span>فروش</span>
                </div>
              </div>

              {/* Competitor Comparison Table */}
              <div className="overflow-hidden rounded-lg border border-border/50">
                <div className="grid grid-cols-3 gap-0 bg-muted/50 px-3 py-2">
                  <span className="text-xs font-semibold text-muted-foreground">پلتفرم</span>
                  <span className="text-center text-xs font-semibold text-muted-foreground">اسپرد</span>
                  <span className="text-left text-xs font-semibold text-muted-foreground">وضعیت</span>
                </div>
                <div className="table-row-hover-gold grid grid-cols-3 gap-0 border-t border-border/40 px-3 py-2.5">
                  <span className="text-sm text-foreground">بانک ملی</span>
                  <span className="text-center text-sm font-medium tabular-nums text-red-500">۳.۲٪</span>
                  <span className="text-left text-xs text-muted-foreground">—</span>
                </div>
                <div className="table-row-hover-gold grid grid-cols-3 gap-0 border-t border-border/40 px-3 py-2.5">
                  <span className="text-sm text-foreground">صرافی‌های دیگر</span>
                  <span className="text-center text-sm font-medium tabular-nums text-amber-500">۲.۵٪</span>
                  <span className="text-left text-xs text-muted-foreground">—</span>
                </div>
                <div className="table-row-hover-gold grid grid-cols-3 gap-0 border-t border-border/40 bg-[#D4AF37]/[0.04] px-3 py-2.5">
                  <span className="text-sm font-bold text-foreground">زرین گلد</span>
                  <span className="text-center text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {goldPrice ? ((goldPrice.spread / goldPrice.buyPrice) * 100).toFixed(2) + '٪' : '---'}
                  </span>
                  <span className="text-left">
                    <Badge className="badge-success-green text-[10px]">بهترین نرخ</Badge>
                  </span>
                </div>
              </div>

              <p className="mt-3 text-center text-[11px] text-muted-foreground/80">
                ✨ کارمزد زرین گلد از پایین‌ترین در بازار
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Referral + Price Alerts (2-col on desktop)               */}
      {/* ──────────────────────────────────────────────────────── */}
      {!isLoading && (
        <motion.div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6" variants={itemVariants}>
          <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-gold/20 bg-gradient-to-l from-gold/5 via-gold/10 to-gold/5">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Text & Stats */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Gift className="size-5 text-gold" />
                    <h3 className="text-base font-bold text-foreground">
                      دعوت از دوستان و کسب جایزه
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    با دعوت دوستانتان به زرین گلد، از هر معامله آن‌ها جایزه دریافت کنید.
                  </p>

                  <div className="flex flex-wrap gap-4 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">تاکنون</span>
                      <span className="text-sm font-bold tabular-nums text-foreground">
                        {formatNumber(referralData?.totalInvited ?? 0)}
                      </span>
                      <span className="text-xs text-muted-foreground">نفر دعوت کرده‌اید</span>
                    </div>
                    <Separator orientation="vertical" className="hidden h-4 sm:block" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">مجموع جوایز:</span>
                      <span className="text-sm font-bold tabular-nums text-gold">
                        {formatToman(referralData?.totalRewarded ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Referral Code + CTA */}
                <div className="flex flex-col items-end gap-3 sm:items-end">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg border border-gold/30 bg-background/80 px-3 py-1.5">
                      <span className="text-sm font-mono font-bold tracking-wider text-gold">
                        {referralData?.referralCode || user?.referralCode || '------'}
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-9 border-gold/30 hover:bg-gold/10"
                      onClick={handleCopyReferral}
                    >
                      {copied ? (
                        <Check className="size-4 text-emerald-500" />
                      ) : (
                        <Copy className="size-4 text-gold" />
                      )}
                    </Button>
                  </div>
                  <Button
                    className="bg-gold text-gold-dark hover:bg-gold/90"
                    onClick={() => setPage('referral')}
                  >
                    اشتراک‌گذاری کد دعوت
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
          <Card className="card-gold-border overflow-hidden border-gold/15 bg-gradient-to-br from-gold/[0.02] via-card to-gold/[0.01]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Bell className="size-4 text-[#D4AF37]" />
                {t('dashboard.priceAlerts')}
                <Badge className="badge-gold mr-1 text-[10px]">
                  {priceAlerts.filter(a => a.isActive).length} فعال
                </Badge>
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="btn-gold-outline gap-1.5 text-xs"
                onClick={() => setAlertDialogOpen(true)}
              >
                <Plus className="size-3.5" />
                {t('dashboard.addAlert')}
              </Button>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                      <Skeleton className="size-9 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <Skeleton className="size-9 rounded-md" />
                      <Skeleton className="size-8 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : priceAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                    <Bell className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">هشداری ثبت نشده</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {t('dashboard.priceAlertDesc')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {priceAlerts.map((alert, idx) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06, duration: 0.3 }}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                        alert.isActive
                          ? 'border-[#D4AF37]/20 bg-[#D4AF37]/[0.03] hover:bg-[#D4AF37]/[0.06]'
                          : 'border-border/50 bg-muted/30 opacity-60',
                      )}
                    >
                      {/* Type Icon */}
                      <div className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-lg',
                        alert.type === 'buy'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40'
                          : 'bg-red-100 dark:bg-red-900/40',
                      )}>
                        {alert.type === 'buy' ? (
                          <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <TrendingDown className="size-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>

                      {/* Alert Info */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {alert.type === 'buy' ? 'خرید' : 'فروش'} طلا وقتی قیمت{' '}
                          {alert.condition === 'above' ? 'بالای' : 'زیر'}{' '}
                          <span className="text-gold-gradient font-bold tabular-nums">
                            {formatPrice(alert.targetPrice)} واحد
                          </span>
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {alert.isActive ? 'فعال' : 'غیرفعال'}
                        </p>
                      </div>

                      {/* Status Toggle */}
                      <Switch
                        checked={alert.isActive}
                        onCheckedChange={() => handleToggleAlert(alert.id)}
                        className="data-[state=checked]:bg-[#D4AF37]"
                      />

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30"
                        aria-label="حذف هشدار"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </motion.div>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Deposit Dialog                                          */}
      {/* ──────────────────────────────────────────────────────── */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownToLine className="size-5 text-blue-500" />
              واریز به کیف پول
            </DialogTitle>
            <DialogDescription>
              مبلغ مورد نظر را وارد کنید یا یکی از مبالغ پیشنهادی را انتخاب نمایید.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">مقدار (گرم طلا)</Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="مبلغ را وارد کنید"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="text-left tabular-nums"
                min={0}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setDepositAmount(String(amount))}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all hover:border-gold/50 hover:bg-gold/5 ${
                    Number(depositAmount) === amount
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-border text-foreground'
                  }`}
                >
                  {formatPrice(amount)} گرم طلا
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setDepositOpen(false); setDepositAmount(''); }}>
              انصراف
            </Button>
            <Button
              onClick={handleDeposit}
              disabled={!depositAmount || Number(depositAmount) <= 0 || depositSubmitting}
              className="bg-gold text-gold-dark hover:bg-gold/90"
            >
              {depositSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  در حال پردازش...
                </>
              ) : (
                'واریز'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Withdraw Dialog                                         */}
      {/* ──────────────────────────────────────────────────────── */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpFromLine className="size-5 text-amber-500" />
              برداشت از کیف پول
            </DialogTitle>
            <DialogDescription>
              مبلغ مورد نظر برای برداشت را وارد کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Balance Info */}
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">موجودی قابل برداشت:</span>
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {formatToman(fiatWallet.balance - fiatWallet.frozenBalance)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">مقدار (گرم طلا)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="مبلغ را وارد کنید"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="text-left tabular-nums"
                min={0}
                max={fiatWallet.balance - fiatWallet.frozenBalance}
              />
              {Number(withdrawAmount) > fiatWallet.balance - fiatWallet.frozenBalance && (
                <p className="text-xs text-red-500">مبلغ وارد شده از موجودی قابل برداشت بیشتر است.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setWithdrawAmount(String(amount))}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all hover:border-gold/50 hover:bg-gold/5 ${
                    Number(withdrawAmount) === amount
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-border text-foreground'
                  }`}
                >
                  {formatPrice(amount)} گرم طلا
                </button>
              ))}
            </div>

            {/* KYC Warning */}
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                برای برداشت وجه، احراز هویت (KYC) شما باید تأیید شده باشد. حداکثر مبلغ برداشت در روز
                ۱ کیلوگرم طلا است.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setWithdrawOpen(false); setWithdrawAmount(''); }}>
              انصراف
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={
                !withdrawAmount ||
                Number(withdrawAmount) <= 0 ||
                Number(withdrawAmount) > fiatWallet.balance - fiatWallet.frozenBalance ||
                withdrawSubmitting
              }
              className="bg-gold text-gold-dark hover:bg-gold/90"
            >
              {withdrawSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  در حال پردازش...
                </>
              ) : (
                'ثبت درخواست برداشت'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ──────────────────────────────────────────────────────── */}
      {/*  Gold Gift Dialog (triggerOnly — no button)             */}
      {/* ──────────────────────────────────────────────────────── */}
      <GoldGiftDialog open={giftOpen} onOpenChange={setGiftOpen} triggerOnly />

      {/* ──────────────────────────────────────────────────────── */}
      {/*  Add Price Alert Dialog                                  */}
      {/* ──────────────────────────────────────────────────────── */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="size-5 text-[#D4AF37]" />
              افزودن هشدار قیمت
              <span className="text-gold-gradient">🔔</span>
            </DialogTitle>
            <DialogDescription>
              هشدار قیمت جدید تنظیم کنید تا از تغییرات بازار مطلع شوید.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Alert Type */}
            <div className="space-y-2">
              <Label>نوع هشدار</Label>
              <Select
                value={newAlertType}
                onValueChange={(val: string) => setNewAlertType(val as 'buy' | 'sell')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="size-4 text-emerald-500" />
                      خرید طلا
                    </span>
                  </SelectItem>
                  <SelectItem value="sell">
                    <span className="flex items-center gap-2">
                      <TrendingDown className="size-4 text-red-500" />
                      فروش طلا
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Condition */}
            <div className="space-y-2">
              <Label>شرط</Label>
              <Select
                value={newAlertCondition}
                onValueChange={(val: string) => setNewAlertCondition(val as 'above' | 'below')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">بالای</SelectItem>
                  <SelectItem value="below">زیر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Price */}
            <div className="space-y-2">
              <Label htmlFor="alert-price">قیمت هدف (واحد طلا)</Label>
              <Input
                id="alert-price"
                type="number"
                placeholder="مثلاً: ۴۰,۰۰۰,۰۰۰"
                value={newAlertPrice}
                onChange={(e) => setNewAlertPrice(e.target.value)}
                className="text-left tabular-nums"
                min={0}
              />
            </div>

            {/* Preview */}
            {newAlertPrice && Number(newAlertPrice) > 0 && (
              <div className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-3">
                <p className="text-xs text-muted-foreground">پیش‌نمایش:</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {newAlertType === 'buy' ? 'خرید' : 'فروش'} طلا وقتی قیمت{' '}
                  {newAlertCondition === 'above' ? 'بالای' : 'زیر'}{' '}
                  <span className="font-bold tabular-nums text-[#D4AF37]">
                    {formatPrice(Number(newAlertPrice))} واحد
                  </span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAlertDialogOpen(false)}>
              انصراف
            </Button>
            <Button
              onClick={handleAddAlert}
              disabled={!newAlertPrice || Number(newAlertPrice) <= 0 || alertSubmitting}
              className="btn-gold-gradient"
            >
              {alertSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  در حال ثبت...
                </>
              ) : (
                'ذخیره هشدار'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

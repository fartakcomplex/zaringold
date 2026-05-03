
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {useAppStore} from '@/lib/store';
import {useTranslation} from '@/lib/i18n';
import {usePageEvent} from '@/hooks/use-page-event';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Progress} from '@/components/ui/progress';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {Separator} from '@/components/ui/separator';
import {Skeleton} from '@/components/ui/skeleton';
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from '@/components/ui/alert-dialog';
import {CreditCard, Snowflake, Flame, Coins, Lock, Palette, Gauge, ShoppingCart, RotateCcw, ArrowDown, Eye, EyeOff, Plus, AlertTriangle, CheckCircle, XCircle, Sparkles, ShieldCheck, Download, QrCode, Wifi, ArrowLeftRight, Send, Clock, Copy, Gift, Trophy, Gem, Crown, Award, TrendingUp, CircleDollarSign, Zap, ShieldAlert, Globe, Store, Banknote, ChevronDown, Star} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Custom CSS (card flip, holographic effects)                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */
const CardStyles = () => (
  <style>{`
    /* ── 3D Card Flip ── */
    .card-perspective {
      perspective: 1200px;
    }
    .card-flipper {
      transition: transform 0.7s cubic-bezier(0.4, 0.0, 0.2, 1);
      transform-style: preserve-3d;
      position: relative;
    }
    .card-flipper.flipped {
      transform: rotateY(180deg);
    }
    .card-face {
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      position: absolute;
      inset: 0;
    }
    .card-face-back {
      transform: rotateY(180deg);
    }
    .card-face-front {
      transform: rotateY(0deg);
    }

    /* ── Holographic rainbow shimmer ── */
    @keyframes holo-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .holo-shimmer {
      background: linear-gradient(
        105deg,
        transparent 20%,
        rgba(255, 215, 0, 0.15) 35%,
        rgba(255, 255, 255, 0.25) 42%,
        rgba(0, 210, 255, 0.15) 48%,
        rgba(255, 255, 255, 0.25) 55%,
        rgba(212, 175, 55, 0.15) 65%,
        transparent 80%
      );
      background-size: 200% 100%;
      animation: holo-shimmer 3.5s ease-in-out infinite;
    }

    /* ── Premium light sweep ── */
    @keyframes light-sweep {
      0% { transform: translateX(-100%) rotate(25deg); }
      100% { transform: translateX(200%) rotate(25deg); }
    }
    .light-sweep {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }
    .light-sweep::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 50%;
      height: 200%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255,255,255,0.12),
        rgba(255,255,255,0.04),
        transparent
      );
      animation: light-sweep 4s ease-in-out infinite;
    }

    /* ── Geometric holographic pattern ── */
    @keyframes pattern-drift {
      0% { background-position: 0 0; }
      100% { background-position: 40px 40px; }
    }
    .holo-pattern {
      background-image:
        linear-gradient(30deg, rgba(255,215,0,0.04) 12%, transparent 12.5%, transparent 87%, rgba(255,215,0,0.04) 87.5%),
        linear-gradient(150deg, rgba(255,215,0,0.04) 12%, transparent 12.5%, transparent 87%, rgba(255,215,0,0.04) 87.5%),
        linear-gradient(30deg, rgba(255,215,0,0.04) 12%, transparent 12.5%, transparent 87%, rgba(255,215,0,0.04) 87.5%),
        linear-gradient(150deg, rgba(255,215,0,0.04) 12%, transparent 12.5%, transparent 87%, rgba(255,215,0,0.04) 87.5%);
      background-size: 40px 70px;
      background-position: 0 0, 0 0, 20px 35px, 20px 35px;
      animation: pattern-drift 20s linear infinite;
    }

    /* ── EMV Chip ── */
    .emv-chip {
      width: 42px;
      height: 32px;
      border-radius: 5px;
      background: linear-gradient(135deg, #d4af37 0%, #f0d060 30%, #d4af37 50%, #b8960b 70%, #f0d060 100%);
      position: relative;
      box-shadow: inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.2);
    }
    .emv-chip::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 3px;
      right: 3px;
      height: 1px;
      background: rgba(0,0,0,0.25);
    }
    .emv-chip::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 3px;
      bottom: 3px;
      width: 1px;
      background: rgba(0,0,0,0.25);
    }
    .emv-chip-inner {
      position: absolute;
      top: 50%;
      left: 3px;
      right: 3px;
      height: 1px;
      background: rgba(0,0,0,0.15);
      transform: translateY(-6px);
    }
    .emv-chip-inner2 {
      position: absolute;
      top: 50%;
      left: 3px;
      right: 3px;
      height: 1px;
      background: rgba(0,0,0,0.15);
      transform: translateY(6px);
    }

    /* ── Contactless icon ── */
    @keyframes nfc-pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    .nfc-icon {
      animation: nfc-pulse 2.5s ease-in-out infinite;
    }

    /* ── Magnetic stripe ── */
    .magnetic-stripe {
      background: repeating-linear-gradient(
        0deg,
        #111 0px,
        #111 2px,
        #222 2px,
        #222 4px
      );
    }

    /* ── Frost overlay for frozen card ── */
    @keyframes frost-spread {
      0% { opacity: 0; backdrop-filter: blur(0px); }
      100% { opacity: 1; backdrop-filter: blur(4px); }
    }
    .frost-overlay {
      animation: frost-spread 0.6s ease-out forwards;
    }

    /* ── Gold value ticker pulse ── */
    @keyframes value-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .value-ticker {
      animation: value-pulse 2s ease-in-out infinite;
    }

    /* ── Level badge glow ── */
    @keyframes level-glow {
      0%, 100% { box-shadow: 0 0 4px rgba(212,175,55,0.3); }
      50% { box-shadow: 0 0 12px rgba(212,175,55,0.6), 0 0 24px rgba(212,175,55,0.2); }
    }
    .level-badge-glow {
      animation: level-glow 2.5s ease-in-out infinite;
    }

    /* ── Quick action button ripple ── */
    .quick-action-btn {
      position: relative;
      overflow: hidden;
      transition: all 0.25s ease;
    }
    .quick-action-btn:active {
      transform: scale(0.95);
    }
    .quick-action-btn::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at var(--rx, 50%) var(--ry, 50%),
        rgba(212,175,55,0.12) 0%, transparent 60%);
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
    }
    .quick-action-btn:hover::after {
      opacity: 1;
    }

    /* ── Stat card shimmer border ── */
    .stat-card-shimmer {
      position: relative;
    }
    .stat-card-shimmer::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1px;
      background: linear-gradient(135deg,
        transparent 0%,
        rgba(212,175,55,0.3) 50%,
        transparent 100%);
      background-size: 200% 200%;
      animation: holo-shimmer 4s ease-in-out infinite;
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }

    /* ── Card glow shadow ── */
    .premium-card-glow {
      box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.3),
        0 10px 25px -5px rgba(0, 0, 0, 0.4),
        0 0 40px -10px rgba(212, 175, 55, 0.25);
    }

    /* ── VISA logo gradient text ── */
    .visa-text {
      font-family: 'Arial', sans-serif;
      font-style: italic;
      letter-spacing: 0.05em;
    }
  `}</style>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types / Interfaces                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface GoldCardData {
  id: string;
  userId: string;
  cardNumber: string;
  cvv: string;
  pin: string;
  expiry: string;
  design: 'gold-gradient' | 'black-premium' | 'diamond' | 'rose-gold';
  type: 'VIRTUAL' | 'PHYSICAL';
  status: 'active' | 'frozen' | 'closed';
  balance: number;
  linkedGoldGrams: number;
  goldValuePerGram: number;
  dailySpent: number;
  dailyLimit: number;
  monthlySpent: number;
  monthlyLimit: number;
  createdAt: string;
}

interface CardTransaction {
  id: string;
  type: 'purchase' | 'refund' | 'charge' | 'withdrawal' | 'transfer_out';
  amount: number;
  merchant: string;
  description?: string;
  status: 'completed' | 'success' | 'pending' | 'failed';
  createdAt: string;
  goldGrams?: number;
}

interface SecuritySettings {
  onlinePurchases: boolean;
  inStorePurchases: boolean;
  internationalPurchases: boolean;
  contactlessNfc: boolean;
}

interface CardLevel {
  key: string;
  label: string;
  icon: React.ReactNode;
  minTx: number;
  maxTx: number;
  color: string;
  bgColor: string;
  borderColor: string;
  benefits: string[];
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper functions                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatToman(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(amount));
}

function toPersianDigits(str: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

function maskCardNumber(num: string): string {
  const clean = num.replace(/-/g, '');
  return `${clean.slice(0, 4)}-XXXX-XXXX-${clean.slice(-4)}`;
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'همین الان';
  if (diffMin < 60) return toPersianDigits(`${diffMin} دقیقه پیش`);
  if (diffHr < 24) return toPersianDigits(`${diffHr} ساعت پیش`);
  if (diffDay < 7) return toPersianDigits(`${diffDay} روز پیش`);
  return toPersianDigits(new Date(dateStr).toLocaleDateString('fa-IR'));
}

function getTxIcon(type: CardTransaction['type']) {
  switch (type) {
    case 'purchase': return <ShoppingCart className="size-4 text-red-400" />;
    case 'refund': return <RotateCcw className="size-4 text-green-400" />;
    case 'charge': return <Coins className="size-4 text-yellow-400" />;
    case 'withdrawal': return <ArrowDown className="size-4 text-orange-400" />;
    case 'transfer_out': return <Send className="size-4 text-blue-400" />;
    default: return <CreditCard className="size-4" />;
  }
}

function getTxTypeLabel(type: CardTransaction['type']): string {
  switch (type) {
    case 'purchase': return 'خرید';
    case 'refund': return 'برگشت وجه';
    case 'charge': return 'شارژ';
    case 'withdrawal': return 'برداشت';
    case 'transfer_out': return 'انتقال';
    default: return 'تراکنش';
  }
}

function getStatusBadge(status: CardTransaction['status']) {
  switch (status) {
    case 'success':
    case 'completed':
      return <Badge className="bg-green-500/15 text-green-400 border-green-500/20 text-[10px]"><CheckCircle className="size-3 ml-0.5" />موفق</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/20 text-[10px]"><Clock className="size-3 ml-0.5" />در انتظار</Badge>;
    case 'failed':
      return <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-[10px]"><XCircle className="size-3 ml-0.5" />ناموفق</Badge>;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Card Design Configs                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CARD_DESIGNS = {
  'gold-gradient': {
    bg: 'linear-gradient(135deg, #8B6914 0%, #B8860B 15%, #DAA520 30%, #FFD700 45%, #FFF4B0 55%, #FFD700 65%, #DAA520 80%, #B8860B 95%, #8B6914 100%)',
    text: 'text-[#1a0f00]',
    sub: 'text-[#4a3000]/85',
    accent: 'text-[#fff]',
    shimmer: 'from-amber-300/0 via-amber-200/30 to-amber-300/0',
    label: 'طلایی کلاسیک',
    border: '',
    chipBg: 'linear-gradient(135deg, #d4af37 0%, #f0d060 30%, #d4af37 50%, #b8960b 70%, #f0d060 100%)',
    networkColor: '#1a1f71',
  },
  'black-premium': {
    bg: 'linear-gradient(145deg, #0a0a1a 0%, #111128 20%, #1a1a3e 40%, #0f1f4a 60%, #0a1628 80%, #0a0a1a 100%)',
    text: 'text-white',
    sub: 'text-gray-400',
    accent: 'text-[#D4AF37]',
    shimmer: 'from-[#D4AF37]/0 via-[#D4AF37]/25 to-[#D4AF37]/0',
    label: 'مشکی پریمیوم',
    border: 'border-[#D4AF37]/30',
    chipBg: 'linear-gradient(135deg, #d4af37 0%, #f0d060 30%, #d4af37 50%, #b8960b 70%, #f0d060 100%)',
    networkColor: '#D4AF37',
  },
  'diamond': {
    bg: 'linear-gradient(135deg, #c9b037 0%, #f7e98e 20%, #fffde7 35%, #f7e98e 50%, #c9b037 70%, #96771f 85%, #c9b037 100%)',
    text: 'text-[#1a0f00]',
    sub: 'text-[#4a3000]/85',
    accent: 'text-white',
    shimmer: 'from-white/0 via-white/40 to-white/0',
    label: 'الماسی',
    border: '',
    chipBg: 'linear-gradient(135deg, #fff 0%, #e8e8e8 30%, #fff 50%, #ccc 70%, #fff 100%)',
    networkColor: '#1a1f71',
  },
  'rose-gold': {
    bg: 'linear-gradient(135deg, #8B5A5A 0%, #B76E79 20%, #E8B4B8 40%, #F4D6CC 55%, #E8B4B8 70%, #DAA06D 85%, #B76E79 100%)',
    text: 'text-[#2a1018]',
    sub: 'text-[#4a2030]/80',
    accent: 'text-white',
    shimmer: 'from-white/0 via-white/25 to-white/0',
    label: 'رزگلد',
    border: '',
    chipBg: 'linear-gradient(135deg, #d4af37 0%, #f0d060 30%, #d4af37 50%, #b8960b 70%, #f0d060 100%)',
    networkColor: '#1a1f71',
  },
} as const;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Card Level Configs                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CARD_LEVELS: CardLevel[] = [
  { key: 'bronze', label: 'برنزی', icon: <Award className="size-4" />, minTx: 0, maxTx: 10, color: 'text-[#CD7F32]', bgColor: 'bg-[#CD7F32]/10', borderColor: 'border-[#CD7F32]/30', benefits: ['سقف روزانه: ۵۰ میلیون تومان', 'کارمزد: ۱٪'] },
  { key: 'silver', label: 'نقره‌ای', icon: <Star className="size-4" />, minTx: 11, maxTx: 50, color: 'text-[#C0C0C0]', bgColor: 'bg-[#C0C0C0]/10', borderColor: 'border-[#C0C0C0]/30', benefits: ['سقف روزانه: ۱۰۰ میلیون تومان', 'کارمزد: ۰.۸٪'] },
  { key: 'gold', label: 'طلایی', icon: <Crown className="size-4" />, minTx: 51, maxTx: 200, color: 'text-[#FFD700]', bgColor: 'bg-[#FFD700]/10', borderColor: 'border-[#FFD700]/30', benefits: ['سقف روزانه: ۲۰۰ میلیون تومان', 'کارمزد: ۰.۵٪', 'درصد کش‌بک بیشتر'] },
  { key: 'platinum', label: 'پلاتینیوم', icon: <Gem className="size-4" />, minTx: 201, maxTx: 500, color: 'text-[#E5E4E2]', bgColor: 'bg-[#E5E4E2]/10', borderColor: 'border-[#E5E4E2]/30', benefits: ['سقف روزانه: ۵۰۰ میلیون تومان', 'کارمزد: ۰.۳٪', 'کش‌بک ویژه', 'پشتیبانی اختصاصی'] },
  { key: 'diamond', label: 'الماسی', icon: <Sparkles className="size-4" />, minTx: 501, maxTx: Infinity, color: 'text-[#D4AF37]', bgColor: 'bg-[#D4AF37]/10', borderColor: 'border-[#D4AF37]/30', benefits: ['سقف روزانه: نامحدود', 'کارمزد: صفر', 'کش‌بک حداکثری', 'پشتیبانی VIP', 'دسترسی زودتر به امکانات'] },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  API Helper — mapApiCard                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function mapApiCard(c: Record<string, unknown>, userId: string, goldPriceVal: number): GoldCardData {
  return {
    id: c.id as string,
    userId,
    cardNumber: (c.fullCardNumber || c.cardNumber) as string,
    cvv: (c.cvv) as string,
    pin: (c.pin) as string || '',
    expiry: `${toPersianDigits(String(c.expiryMonth))}/${toPersianDigits(String(c.expiryYear))}`,
    design: (c.design as GoldCardData['design']) || 'gold-gradient',
    type: (c.cardType === 'virtual' ? 'VIRTUAL' : 'PHYSICAL') as GoldCardData['type'],
    status: (c.status as GoldCardData['status']) || 'active',
    balance: (c.balanceFiat as number) || 0,
    linkedGoldGrams: (c.linkedGoldGram as number) || 0,
    goldValuePerGram: goldPriceVal,
    dailySpent: (c.spentToday as number) || 0,
    dailyLimit: (c.dailyLimit as number) || 50_000_000,
    monthlySpent: (c.spentThisMonth as number) || 0,
    monthlyLimit: (c.monthlyLimit as number) || 500_000_000,
    createdAt: ((c.issuedAt || c.createdAt) as string) || new Date().toISOString(),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  VirtualCard — 3D Flip Card Component                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function VirtualCard({
  card,
  userName,
  isFrozen,
  showNumber,
  showCvv,
  showPin,
  onToggleNumber,
  onToggleCvv,
  onTogglePin,
  onFlip,
}: {
  card: GoldCardData;
  userName: string;
  isFrozen: boolean;
  showNumber: boolean;
  showCvv: boolean;
  showPin: boolean;
  onToggleNumber: () => void;
  onToggleCvv: () => void;
  onTogglePin: () => void;
  onFlip: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const design = CARD_DESIGNS[card.design];
  const isDiamond = card.design === 'diamond';
  const isDark = card.design === 'black-premium';

  const handleFlip = () => {
    setFlipped(!flipped);
    onFlip();
  };

  return (
    <div className="card-perspective w-full max-w-[400px] mx-auto" onClick={handleFlip}>
      <div className={`card-flipper w-full aspect-[1.586/1] ${flipped ? 'flipped' : ''}`}>
        {/* ══════ FRONT FACE ══════ */}
        <div
          className={`card-face card-face-front w-full rounded-2xl overflow-hidden premium-card-glow ${design.border || 'border border-white/10'} select-none cursor-pointer`}
          style={{ background: design.bg }}
        >
          {/* Subtle texture pattern */}
          <div className="absolute inset-0 holo-pattern pointer-events-none opacity-60" />

          {/* Holographic shimmer */}
          <div className="absolute inset-0 holo-shimmer pointer-events-none" />

          {/* Light sweep */}
          <div className="light-sweep" />

          {/* Diamond sparkle particles */}
          {isDiamond && (
            <>
              <div className="absolute top-4 left-8 w-2 h-2 bg-white/70 rounded-full animate-[twinkle_2s_ease-in-out_infinite]" />
              <div className="absolute top-12 right-16 w-1.5 h-1.5 bg-white/50 rounded-full animate-[twinkle_2.5s_ease-in-out_infinite_0.5s]" />
              <div className="absolute bottom-16 left-20 w-1 h-1 bg-white/60 rounded-full animate-[twinkle_3s_ease-in-out_infinite_1s]" />
              <div className="absolute top-1/2 right-8 w-2 h-2 bg-white/40 rounded-full animate-[twinkle_2.8s_ease-in-out_infinite_0.3s]" />
              <div className="absolute bottom-8 right-24 w-1.5 h-1.5 bg-white/50 rounded-full animate-[twinkle_3.2s_ease-in-out_infinite_0.7s]" />
            </>
          )}

          {/* Decorative circles (top-right) */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/[0.06] pointer-events-none" />
          <div className="absolute -top-4 -right-4 w-28 h-28 rounded-full bg-white/[0.04] pointer-events-none" />

          {/* Decorative circles (bottom-left) */}
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-black/[0.06] pointer-events-none" />

          {/* Frozen overlay */}
          {isFrozen && (
            <div className="frost-overlay absolute inset-0 bg-blue-900/30 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <Snowflake className="size-12 text-blue-200 animate-pulse" />
                <span className="text-white font-bold text-lg drop-shadow-lg">کارت مسدود است</span>
              </div>
            </div>
          )}

          {/* Card front content */}
          <div className="relative z-[5] flex flex-col justify-between h-full p-5 sm:p-6">
            {/* Top row: Bank name + NFC */}
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <p className={`text-[11px] font-black tracking-[0.18em] uppercase ${design.sub}`}>ZARRIN GOLD</p>
                <p className={`text-[17px] font-black ${design.text} leading-tight`}>زرین گلد</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {/* Contactless NFC icon */}
                <svg className="nfc-icon size-5" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#D4AF37' : '#4a3000'} strokeWidth="2.5" strokeLinecap="round">
                  <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                  <path d="M5 19a9 9 0 0 1 0-14" />
                  <path d="M12 14a2 2 0 0 1 0-4" />
                </svg>
                <Badge variant="outline" className={`${design.border || 'border-white/30'} ${design.sub} text-[8px] px-1.5 py-0 font-bold tracking-wider`}>
                  {card.type === 'VIRTUAL' ? 'VIRTUAL' : 'PHYSICAL'}
                </Badge>
              </div>
            </div>

            {/* EMV Chip + Card Number row */}
            <div className="flex items-center gap-4 mt-1">
              {/* EMV Chip */}
              <div className="emv-chip flex-shrink-0">
                <div className="emv-chip-inner" />
                <div className="emv-chip-inner2" />
              </div>
              {/* Card Number */}
              <div
                className="cursor-pointer active:scale-[0.98] transition-transform flex-1 text-center"
                onClick={(e) => { e.stopPropagation(); onToggleNumber(); }}
              >
                <p className={`text-[17px] sm:text-[19px] font-mono tracking-[0.18em] ${design.text} font-black leading-none`}>
                  {showNumber ? card.cardNumber : maskCardNumber(card.cardNumber)}
                </p>
                <p className="flex items-center justify-center gap-1 mt-1">
                  {showNumber
                    ? <EyeOff className={`size-3 ${design.sub}`} />
                    : <Eye className={`size-3 ${design.sub}`} />}
                  <span className={`text-[7px] ${design.sub} opacity-60`}>برای نمایش کلیک کنید</span>
                </p>
              </div>
            </div>

            {/* Bottom row: CVV, Expiry, Holder, Network */}
            <div className="flex items-end justify-between mt-1">
              {/* CVV */}
              <div className="flex flex-col items-start">
                <p className={`text-[8px] font-bold tracking-wider uppercase ${design.sub} opacity-70`}>CVV2</p>
                <div
                  className="cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={(e) => { e.stopPropagation(); onToggleCvv(); }}
                >
                  <p className={`text-[14px] font-mono ${design.text} font-black tracking-[0.2em]`}>
                    {showCvv ? card.cvv : '•••'}
                  </p>
                </div>
              </div>

              {/* Expiry */}
              <div className="flex flex-col items-center">
                <p className={`text-[8px] font-bold tracking-wider uppercase ${design.sub} opacity-70`}>EXPIRY</p>
                <p className={`text-[14px] font-mono ${design.text} font-black tracking-[0.15em]`}>{card.expiry}</p>
              </div>

              {/* Card Holder */}
              <div className="flex flex-col items-end">
                <p className={`text-[8px] font-bold tracking-wider uppercase ${design.sub} opacity-70`}>CARD HOLDER</p>
                <p className={`text-[11px] font-black ${design.text} max-w-[110px] truncate tracking-wide`}>
                  {userName || 'ZARRIN GOLD USER'}
                </p>
              </div>

              {/* Network Logo (VISA style) */}
              <div className="flex flex-col items-end ml-1">
                <svg width="36" height="12" viewBox="0 0 36 12" className="opacity-90">
                  <text x="0" y="11" fill={design.networkColor || '#1a1f71'} fontFamily="Arial" fontStyle="italic" fontWeight="900" fontSize="14" letterSpacing="1">VISA</text>
                </svg>
              </div>
            </div>
          </div>

          {/* Flip hint */}
          <div className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 ${design.sub} opacity-30 z-[5]`}>
            <p className="text-[7px] tracking-wider">برای مشاهده پشت کارت کلیک کنید</p>
          </div>
        </div>

        {/* ══════ BACK FACE ══════ */}
        <div
          className={`card-face card-face-back w-full rounded-2xl overflow-hidden premium-card-glow select-none ${design.border || 'border border-white/10'}`}
          style={{ background: design.bg }}
        >
          {/* Subtle pattern */}
          <div className="absolute inset-0 holo-pattern pointer-events-none opacity-40" />

          {/* Magnetic stripe */}
          <div className="magnetic-stripe w-full h-12 mt-4" />

          {/* Signature strip */}
          <div className="mx-5 mt-4">
            <div className="bg-black/15 backdrop-blur-sm rounded-md p-3 flex items-center justify-between min-h-[44px]">
              <div className="flex items-center gap-2">
                {/* CVV */}
                <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleCvv(); }}>
                  <p className={`text-[18px] font-mono ${design.text} font-black tracking-[0.2em] leading-none`}>
                    {showCvv ? card.cvv : '•••'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* PIN */}
                <div className="text-right">
                  <p className={`text-[8px] ${design.sub} font-bold uppercase tracking-wider opacity-70`}>PIN</p>
                  <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onTogglePin(); }}>
                    <p className={`text-[14px] font-mono ${design.text} font-black tracking-[0.2em]`}>
                      {showPin ? card.pin : '••••'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-3 right-5 left-5 z-[5]">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-[8px] ${design.sub} font-bold uppercase tracking-wider opacity-60`}>Card Number</p>
                <p className={`text-[11px] font-mono ${design.text} font-bold tracking-[0.15em]`}>
                  {showNumber ? card.cardNumber : maskCardNumber(card.cardNumber)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <QrCode className={`size-7 ${design.sub} opacity-25`} />
                <p className={`text-[7px] ${design.sub} opacity-40`}>zarrin.gold</p>
              </div>
            </div>
          </div>

          {/* Holographic shimmer on back */}
          <div className="absolute inset-0 holo-shimmer pointer-events-none opacity-40" />
          {/* Light sweep on back */}
          <div className="light-sweep" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  QuickActions — Grid of action buttons below the card                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function QuickActions({
  isFrozen,
  actionLoading,
  onFreeze,
  onChargeOpen,
  onPinOpen,
  onDesignOpen,
  onLimitsOpen,
  onCopyNumber,
  cardNumber,
}: {
  isFrozen: boolean;
  actionLoading: boolean;
  onFreeze: () => void;
  onChargeOpen: () => void;
  onPinOpen: () => void;
  onDesignOpen: () => void;
  onLimitsOpen: () => void;
  onCopyNumber: () => void;
  cardNumber: string;
}) {
  const actions = [
    { icon: <Coins className="size-4" />, label: 'شارژ از طلا', onClick: onChargeOpen, color: 'text-yellow-500' },
    { icon: isFrozen ? <Flame className="size-4" /> : <Snowflake className="size-4" />, label: isFrozen ? 'فعال‌سازی' : 'مسدود/فعال', onClick: onFreeze, color: isFrozen ? 'text-orange-500' : 'text-blue-400' },
    { icon: <Lock className="size-4" />, label: 'تغییر رمز', onClick: onPinOpen, color: 'text-purple-400' },
    { icon: <Palette className="size-4" />, label: 'تغییر طرح', onClick: onDesignOpen, color: 'text-pink-400' },
    { icon: <Copy className="size-4" />, label: 'کپی شماره', onClick: onCopyNumber, color: 'text-green-400' },
    { icon: <Gauge className="size-4" />, label: 'سقف تراکنش', onClick: onLimitsOpen, color: 'text-cyan-400' },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={a.onClick}
          disabled={actionLoading}
          className="quick-action-btn flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card border border-border/50 hover:border-gold/30 transition-all card-hover-lift disabled:opacity-50"
        >
          <div className={`size-9 rounded-lg bg-muted flex items-center justify-center ${a.color}`}>
            {a.icon}
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">{a.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CardStats — Dashboard statistics                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CardStats({
  card,
  goldPrice,
}: {
  card: GoldCardData;
  goldPrice: number;
}) {
  const goldValue = card.linkedGoldGrams * goldPrice;
  const dailyPct = card.dailyLimit > 0 ? Math.min((card.dailySpent / card.dailyLimit) * 100, 100) : 0;
  const monthlyPct = card.monthlyLimit > 0 ? Math.min((card.monthlySpent / card.monthlyLimit) * 100, 100) : 0;
  const priceChange = goldPrice > card.goldValuePerGram
    ? ((goldPrice - card.goldValuePerGram) / card.goldValuePerGram) * 100
    : -((card.goldValuePerGram - goldPrice) / card.goldValuePerGram) * 100;
  const isUp = goldPrice >= card.goldValuePerGram;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
        <TrendingUp className="size-4 text-[#D4AF37]" />
        آمار کارت
      </h3>

      {/* Main stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Balance */}
        <Card className="stat-card-shimmer bg-card border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Banknote className="size-4 text-green-500" />
            </div>
            <span className="text-[11px] text-muted-foreground">موجودی (تومان)</span>
          </div>
          <p className="text-lg font-bold tabular-nums">{formatToman(card.balance)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            ≈ {toPersianDigits(card.linkedGoldGrams.toFixed(2))} گرم طلا
          </p>
        </Card>

        {/* Gold Value */}
        <Card className="stat-card-shimmer bg-card border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Coins className="size-4 text-yellow-500" />
            </div>
            <span className="text-[11px] text-muted-foreground">ارزش طلای متصل</span>
          </div>
          <p className="text-lg font-bold tabular-nums">{formatToman(goldValue)}</p>
          <div className={`flex items-center gap-1 mt-0.5 text-[10px] ${isUp ? 'text-green-500' : 'text-red-500'}`}>
            <TrendingUp className={`size-3 ${isUp ? '' : 'rotate-180'}`} />
            <span className="value-ticker">
              {isUp ? '+' : ''}{toPersianDigits(priceChange.toFixed(1))}٪
            </span>
          </div>
        </Card>
      </div>

      {/* Daily / Monthly limits */}
      <Card className="bg-card border-border/30 rounded-xl p-4 space-y-3">
        {/* Daily */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">خرید روزانه</span>
            <span className="text-xs font-medium">{formatToman(card.dailySpent)} / {formatToman(card.dailyLimit)}</span>
          </div>
          <Progress value={dailyPct} className="h-2" />
        </div>
        <Separator className="my-1" />
        {/* Monthly */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">خرید ماهانه</span>
            <span className="text-xs font-medium">{formatToman(card.monthlySpent)} / {formatToman(card.monthlyLimit)}</span>
          </div>
          <Progress value={monthlyPct} className="h-2" />
        </div>
      </Card>

      {/* Gold price indicator */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/30">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-green-500 gold-pulse" />
          <span className="text-xs text-muted-foreground">قیمت لحظه‌ای طلا</span>
        </div>
        <span className="text-sm font-bold tabular-nums">{formatToman(goldPrice)} <span className="text-[10px] text-muted-foreground font-normal">تومان/گرم</span></span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SecurityCenter — Security toggles & emergency lock                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SecurityCenter({
  settings,
  onToggle,
  onEmergencyLock,
  recentTx,
  actionLoading,
}: {
  settings: SecuritySettings;
  onToggle: (key: keyof SecuritySettings) => void;
  onEmergencyLock: () => void;
  recentTx: CardTransaction[];
  actionLoading: boolean;
}) {
  const toggles = [
    { key: 'onlinePurchases' as const, label: 'خرید آنلاین', desc: 'پرداخت در فروشگاه‌های اینترنتی', icon: <Globe className="size-4" /> },
    { key: 'inStorePurchases' as const, label: 'خرید حضوری', desc: 'پرداخت با کارتخوان فروشگاهی', icon: <Store className="size-4" /> },
    { key: 'internationalPurchases' as const, label: 'خرید بین‌المللی', desc: 'تراکنش‌های ارزی خارجی', icon: <CircleDollarSign className="size-4" /> },
    { key: 'contactlessNfc' as const, label: 'تماس با NFC', desc: 'پرداخت بدون تماس فیزیکی', icon: <Wifi className="size-4" /> },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
        <ShieldCheck className="size-4 text-[#D4AF37]" />
        مرکز امنیت
      </h3>

      {/* Toggles */}
      <Card className="bg-card border-border/30 rounded-xl divide-y divide-border/30">
        {toggles.map((t) => (
          <div key={t.key} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                {t.icon}
              </div>
              <div>
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-[11px] text-muted-foreground">{t.desc}</p>
              </div>
            </div>
            <Switch
              checked={settings[t.key]}
              onCheckedChange={() => onToggle(t.key)}
              disabled={actionLoading}
            />
          </div>
        ))}
      </Card>

      {/* Emergency Lock */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full rounded-xl gap-2" disabled={actionLoading}>
            <ShieldAlert className="size-4" />
            قفل اضطراری
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>قفل اضطراری کارت</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از مسدود کردن فوری کارت مطمئن هستید؟ این عمل تمام تراکنش‌های کارت را متوقف می‌کند.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={onEmergencyLock} className="bg-red-600 hover:bg-red-700">
              بله، مسدود کن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recent transactions mini list */}
      {recentTx.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">آخرین ۵ تراکنش</h4>
          <Card className="bg-card border-border/30 rounded-xl divide-y divide-border/30">
            {recentTx.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                    {getTxIcon(tx.type)}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{tx.merchant || getTxTypeLabel(tx.type)}</p>
                    <p className="text-[10px] text-muted-foreground">{getRelativeTime(tx.createdAt)}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className={`text-xs font-bold tabular-nums ${tx.type === 'refund' || tx.type === 'charge' ? 'text-green-500' : 'text-red-400'}`}>
                    {tx.type === 'refund' || tx.type === 'charge' ? '+' : '-'}{formatToman(tx.amount)}
                  </p>
                  {getStatusBadge(tx.status)}
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TransferSection — Gold-based card-to-card transfer                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TransferSection({
  goldPrice,
  userRole,
}: {
  goldPrice: number;
  userRole: string;
}) {
  const { user, addToast } = useAppStore();
  const [toCard, setToCard] = useState('');
  const [goldGrams, setGoldGrams] = useState('');
  const [desc, setDesc] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [loading, setLoading] = useState(false);

  const formatCardInput = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 16);
    return d.replace(/(.{4})/g, '$1-').slice(0, -1);
  };

  const parsedGrams = parseFloat(goldGrams) || 0;
  const feeGold = userRole === 'super_admin' ? 0 : parsedGrams * 0.001;
  const feeFiat = feeGold * goldPrice;
  const fiatEquiv = parsedGrams * goldPrice;
  const totalFiat = fiatEquiv + feeFiat;

  const handleTransfer = async () => {
    if (!toCard.replace(/-/g, '') || parsedGrams <= 0) { addToast('اطلاعات ناقص است', 'error'); return; }
    if (parsedGrams < 0.001) { addToast('حداقل ۱ میلی‌گرم طلا', 'error'); return; }
    if (!pin) { addToast('رمز کارت الزامی است', 'error'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/gold-card/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, toCardNumber: toCard, goldGrams: parsedGrams, description: desc || undefined, pin }),
      });
      const data = await res.json();
      if (!res.ok) { addToast(data.error || 'خطا در انتقال', 'error'); return; }
      setStep('success');
      addToast(data.message, 'success');
    } catch { addToast('خطای شبکه', 'error'); }
    finally { setLoading(false); }
  };

  const reset = () => { setToCard(''); setGoldGrams(''); setDesc(''); setPin(''); setStep('form'); };

  if (step === 'success') {
    return (
      <Card className="bg-card border-border/30 rounded-xl p-6 text-center space-y-4">
        <div className="size-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle className="size-8 text-green-500" />
        </div>
        <h3 className="text-lg font-bold gold-gradient-text">انتقال موفق!</h3>
        <p className="text-sm text-muted-foreground">طلای شما با موفقیت به کارت مقصد منتقل شد.</p>
        <Button onClick={reset} className="rounded-xl bg-gold hover:bg-gold-dark text-gold-dark">انتقال جدید</Button>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border/30 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-bold flex items-center gap-1.5">
        <ArrowLeftRight className="size-4 text-[#D4AF37]" />
        انتقال طلا بین کارت‌ها
      </h3>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">شماره کارت مقصد</Label>
          <Input value={toCard} onChange={(e) => setToCard(formatCardInput(e.target.value))} placeholder="XXXX-XXXX-XXXX-XXXX" className="rounded-xl text-left font-mono" dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">مقدار طلا (گرم)</Label>
          <Input type="number" step="0.001" min="0.001" value={goldGrams} onChange={(e) => setGoldGrams(e.target.value)} placeholder="مثلاً ۰.۵" className="rounded-xl" />
          {parsedGrams > 0 && (
            <p className="text-[11px] text-muted-foreground">
              معادل: <span className="font-bold text-foreground">{formatToman(fiatEquiv)}</span> تومان
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">توضیحات (اختیاری)</Label>
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="مثلاً: بابت خرید" className="rounded-xl" />
        </div>
        {step === 'confirm' && (
          <div className="space-y-1.5">
            <Label className="text-xs">رمز کارت</Label>
            <Input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" className="rounded-xl text-center tracking-widest" maxLength={8} />
          </div>
        )}
      </div>

      {/* Fee summary */}
      {parsedGrams > 0 && (
        <Card className="bg-muted/50 rounded-xl p-3 space-y-1.5 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">مقدار طلا</span><span className="font-mono">{toPersianDigits(parsedGrams.toFixed(3))} گرم</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">کارمزد ({toPersianDigits('0.1')}٪)</span><span className="font-mono">{toPersianDigits(feeGold.toFixed(4))} گرم</span></div>
          <Separator />
          <div className="flex justify-between font-bold"><span>معادل ریالی کل</span><span className="font-mono">{formatToman(totalFiat)} تومان</span></div>
        </Card>
      )}

      {step === 'form' ? (
        <Button onClick={() => setStep('confirm')} disabled={parsedGrams <= 0 || !toCard.replace(/-/g, '')} className="w-full rounded-xl bg-gold hover:bg-gold-dark text-gold-dark font-bold">
          ادامه و تأیید
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep('form')} className="flex-1 rounded-xl">بازگشت</Button>
          <Button onClick={handleTransfer} disabled={loading} className="flex-1 rounded-xl bg-gold hover:bg-gold-dark text-gold-dark font-bold">
            {loading ? 'در حال انتقال...' : 'ثبت انتقال'}
          </Button>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TransactionsList — Filtered transaction list                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TransactionsList({
  transactions,
  loading,
  filter,
  onFilterChange,
  onRefresh,
}: {
  transactions: CardTransaction[];
  loading: boolean;
  filter: string;
  onFilterChange: (f: string) => void;
  onRefresh: () => void;
}) {
  const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);
  const filters = [
    { key: 'all', label: 'همه' },
    { key: 'purchase', label: 'خرید' },
    { key: 'refund', label: 'برگشت' },
    { key: 'charge', label: 'شارژ' },
    { key: 'withdrawal', label: 'برداشت' },
    { key: 'transfer_out', label: 'انتقال' },
  ];

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 mobile-scroll">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
              filter === f.key
                ? 'bg-gold text-gold-dark'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button onClick={onRefresh} className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-muted text-muted-foreground hover:bg-muted/80 whitespace-nowrap mr-auto">
          <Clock className="size-3 inline-block ml-1" />
          بروزرسانی
        </button>
      </div>

      {/* Transaction list */}
      {filtered.length === 0 ? (
        <Card className="bg-card border-border/30 rounded-xl p-8 text-center space-y-3">
          <div className="size-12 mx-auto rounded-full bg-muted flex items-center justify-center">
            <ShoppingCart className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">تراکنشی یافت نشد</p>
        </Card>
      ) : (
        <Card className="bg-card border-border/30 rounded-xl divide-y divide-border/30 max-h-[400px] overflow-y-auto mobile-scroll">
          {filtered.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {getTxIcon(tx.type)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{tx.merchant || getTxTypeLabel(tx.type)}</p>
                  <p className="text-[10px] text-muted-foreground">{getRelativeTime(tx.createdAt)}</p>
                </div>
              </div>
              <div className="text-left shrink-0 mr-3">
                <p className={`text-xs font-bold tabular-nums ${tx.type === 'refund' || tx.type === 'charge' ? 'text-green-500' : 'text-red-400'}`}>
                  {tx.type === 'refund' || tx.type === 'charge' ? '+' : '-'}{formatToman(tx.amount)}
                </p>
                {tx.goldGrams !== undefined && tx.goldGrams > 0 && (
                  <p className="text-[9px] text-muted-foreground">{toPersianDigits(tx.goldGrams.toFixed(3))} گرم</p>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DesignPicker — 4 card designs with mini previews                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function DesignPicker({
  currentDesign,
  onSelect,
  loading,
}: {
  currentDesign: string;
  onSelect: (design: string) => void;
  loading: boolean;
}) {
  const designs: Array<{ key: keyof typeof CARD_DESIGNS }> = [
    { key: 'gold-gradient' },
    { key: 'black-premium' },
    { key: 'diamond' },
    { key: 'rose-gold' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {designs.map((d) => {
        const cfg = CARD_DESIGNS[d.key];
        const isSelected = d.key === currentDesign;
        return (
          <button
            key={d.key}
            onClick={() => onSelect(d.key)}
            disabled={loading || isSelected}
            className={`w-full aspect-[1.586/1] rounded-xl overflow-hidden relative transition-all duration-300 ${
              isSelected
                ? 'ring-2 ring-[#D4AF37] ring-offset-2 ring-offset-background scale-[1.03] shadow-lg'
                : 'ring-1 ring-border/40 opacity-70 hover:opacity-100 hover:scale-[1.01]'
            }`}
          >
            <div className={`w-full h-full ${cfg.border || ''} flex flex-col justify-between p-2.5`} style={{ background: cfg.bg }}>
              <p className={`text-[7px] tracking-wider ${cfg.sub}`}>ZARRIN GOLD</p>
              <p className={`text-[9px] font-mono tracking-wider ${cfg.text}`}>•••• •••• ••••</p>
              <div className="flex items-center justify-between">
                <p className={`text-[7px] ${cfg.sub}`}>{cfg.label}</p>
                {isSelected && <CheckCircle className="size-3 text-green-300" />}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CardLevel — Level system with progress bar                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CardLevel({ totalTx }: { totalTx: number }) {
  const currentLevel = useMemo(() => {
    return CARD_LEVELS.find((l) => totalTx >= l.minTx && totalTx <= l.maxTx) || CARD_LEVELS[0];
  }, [totalTx]);

  const nextLevel = useMemo(() => {
    const idx = CARD_LEVELS.indexOf(currentLevel);
    return idx < CARD_LEVELS.length - 1 ? CARD_LEVELS[idx + 1] : null;
  }, [currentLevel]);

  const progressPct = nextLevel
    ? ((totalTx - currentLevel.minTx) / (nextLevel.minTx - currentLevel.minTx)) * 100
    : 100;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
        <Trophy className="size-4 text-[#D4AF37]" />
        سطح کارت
      </h3>

      <Card className="bg-card border-border/30 rounded-xl p-4 space-y-3">
        {/* Current level badge */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${currentLevel.bgColor} ${currentLevel.borderColor} border level-badge-glow`}>
            <span className={currentLevel.color}>{currentLevel.icon}</span>
            <span className={`text-sm font-bold ${currentLevel.color}`}>{currentLevel.label}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {toPersianDigits(String(totalTx))} تراکنش
          </span>
        </div>

        {/* Progress to next level */}
        {nextLevel && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">{currentLevel.label}</span>
              <span className="text-muted-foreground">{nextLevel.label}</span>
            </div>
            <Progress value={progressPct} className="h-2" />
            <p className="text-[10px] text-muted-foreground text-center">
              {toPersianDigits(String(nextLevel.minTx - totalTx))} تراکنش تا سطح {nextLevel.label}
            </p>
          </div>
        )}

        {/* Benefits */}
        <Separator />
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">مزایای سطح {currentLevel.label}:</p>
          {currentLevel.benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <CheckCircle className="size-3 text-green-500 shrink-0" />
              <span>{b}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CardRewards — Points & rewards                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CardRewards({ totalSpent }: { totalSpent: number }) {
  const points = Math.floor(totalSpent / 100_000);
  const rewards = [
    { needed: 50, label: 'کاهش کارمزد یک تراکنش', icon: <Zap className="size-4" /> },
    { needed: 100, label: 'کش‌بک ۵,۰۰۰ تومانی', icon: <Gift className="size-4" /> },
    { needed: 200, label: 'افزایش سقف روزانه', icon: <TrendingUp className="size-4" /> },
    { needed: 500, label: 'ارتقای طرح الماسی', icon: <Gem className="size-4" /> },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
        <Gift className="size-4 text-[#D4AF37]" />
        امتیازات و جایزه‌ها
      </h3>

      <Card className="bg-card border-border/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-2xl font-bold gold-gradient-text">{toPersianDigits(String(points))}</p>
            <p className="text-[11px] text-muted-foreground">امتیاز فعلی</p>
          </div>
          <div className="size-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
            <Star className="size-6 text-[#D4AF37]" />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          هر ۱۰۰ هزار تومان خرید = ۱ امتیاز
        </p>
      </Card>

      <div className="space-y-2">
        {rewards.map((r, i) => {
          const unlocked = points >= r.needed;
          return (
            <Card key={i} className={`bg-card border-border/30 rounded-xl p-3 flex items-center gap-3 ${unlocked ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${unlocked ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{r.label}</p>
                <p className="text-[10px] text-muted-foreground">
                  {unlocked ? 'فعال ✅' : `نیاز به ${toPersianDigits(String(r.needed))} امتیاز`}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  WelcomeScreen — No card state                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function WelcomeScreen({ onRequest, loading }: { onRequest: () => void; loading: boolean }) {
  const benefits = [
    { icon: <ShoppingCart className="size-5" />, text: 'خرید آنلاین در تمام فروشگاه‌ها' },
    { icon: <Download className="size-5" />, text: 'برداشت وجه از ATM' },
    { icon: <ShieldCheck className="size-5" />, text: 'انتقال وجه آنی بین کارت‌ها' },
    { icon: <Sparkles className="size-5" />, text: 'کارمزد صفر روی تراکنش‌ها' },
  ];

  return (
    <div className="page-transition flex flex-col items-center gap-8 py-8 px-4">
      {/* Card illustration */}
      <div className="w-full max-w-[320px] mx-auto aspect-[1.586/1] rounded-2xl shadow-[0_8px_32px_rgba(212,175,55,0.25)] golden-card-animated relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #b8860b, #daa520, #ffd700, #f0c040, #daa520, #b8860b)' }}>
        <div className="absolute inset-0 holo-shimmer" />
        <div className="absolute inset-0 flex flex-col justify-between p-6">
          <div>
            <p className="text-[#3d2800]/70 text-xs tracking-wider">ZARRIN GOLD</p>
            <p className="text-[#2a1a00] text-xl font-bold">زرین گلد</p>
          </div>
          <div className="text-center">
            <p className="text-[#3d2800]/50 text-lg font-mono tracking-[0.2em]">•••• •••• •••• ••••</p>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-[#3d2800]/50 text-xs">VISA</p>
            <p className="text-[#3d2800]/50 text-xs">کارت طلایی</p>
          </div>
        </div>
      </div>

      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold gold-gradient-text">کارت طلایی شما آماده‌ است!</h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
          با کارت طلایی زرین گلد، طلای خود را به کارت بانکی تبدیل کنید و هر جا خرید کنید.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {benefits.map((b, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-gold/30 transition-colors">
            <div className="size-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0">{b.icon}</div>
            <span className="text-sm">{b.text}</span>
          </div>
        ))}
      </div>

      <div className="w-full max-w-sm space-y-3">
        <Button className="w-full bg-[#D4AF37] hover:bg-[#B8960C] text-[#2a1a00] hover:text-white font-bold text-base py-6 rounded-xl transition-all duration-300 btn-gold-shine" onClick={onRequest} disabled={loading}>
          <CreditCard className="size-5 ml-2" />
          {loading ? 'در حال صدور...' : 'درخواست کارت طلایی'}
        </Button>
        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
          <ShieldCheck className="size-3.5" />
          نیاز به تأیید هویت (KYC)
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component — GoldCardView (exported default)                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function GoldCardView() {
  const { user, addToast } = useAppStore();
  const { t, locale } = useTranslation();

  /* ── State ── */
  const [card, setCard] = useState<GoldCardData | null>(null);
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNumber, setShowNumber] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [txFilter, setTxFilter] = useState<string>('all');
  const [goldPrice, setGoldPrice] = useState(8_900_000);
  const [txLoading, setTxLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog states
  const [chargeOpen, setChargeOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [limitsOpen, setLimitsOpen] = useState(false);

  // Form states
  const [chargeGrams, setChargeGrams] = useState('');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [selectedDesign, setSelectedDesign] = useState<string>('gold-gradient');
  const [dailyLimit, setDailyLimit] = useState(50_000_000);
  const [monthlyLimit, setMonthlyLimit] = useState(500_000_000);

  // Security settings
  const [security, setSecurity] = useState<SecuritySettings>({
    onlinePurchases: true,
    inStorePurchases: true,
    internationalPurchases: false,
    contactlessNfc: true,
  });

  /* ── Quick Action Event Listeners ── */
  usePageEvent('transfer', () => {
    const el = document.querySelector('[data-goldcard-tab="transfer"]') as HTMLElement;
    if (el) el.click();
  });
  usePageEvent('balance', () => {
    const el = document.querySelector('[data-goldcard-tab="card"]') as HTMLElement;
    if (el) el.click();
  });
  usePageEvent('freeze', () => handleToggleFreeze());
  usePageEvent('show-number', () => setShowNumber((p) => !p));

  /* ── Fetch gold price ── */
  useEffect(() => {
    fetch('/api/gold/prices')
      .then((r) => r.json())
      .then((d) => { if (d.buyPrice) setGoldPrice(d.buyPrice); })
      .catch(() => {});
  }, []);

  /* ── Fetch Card Data ── */
  const fetchCard = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/gold-card?userId=${user.id}`);
      const data = await res.json();
      if (data.hasCard && data.card) {
        const c = data.card;
        setCard(mapApiCard(c, user.id, goldPrice));
        setTransactions((data.recentTransactions || []).map((tx: Record<string, unknown>) => ({
          id: tx.id as string,
          type: (tx.type as CardTransaction['type']) || 'purchase',
          amount: (tx.amount as number) || 0,
          merchant: (tx.merchant as string) || '',
          description: (tx.description as string) || undefined,
          status: (tx.status as CardTransaction['status']) || 'completed',
          createdAt: (tx.createdAt as string) || new Date().toISOString(),
          goldGrams: (tx.goldGrams as number) || undefined,
        })));
        setSelectedDesign((c.design as string) || 'gold-gradient');
        setDailyLimit((c.dailyLimit as number) || 50_000_000);
        setMonthlyLimit((c.monthlyLimit as number) || 500_000_000);
      } else {
        setCard(null);
      }
    } catch (err) {
      console.error('[GoldCard fetch error]', err);
      // Don't show error toast — silently set to no-card state so user can request a card
      setCard(null);
    }
    finally { setLoading(false); }
  }, [user?.id, goldPrice, addToast]);

  useEffect(() => { fetchCard(); }, [fetchCard]);

  /* ── Fetch full transactions ── */
  const fetchAllTransactions = useCallback(async () => {
    if (!user?.id) return;
    try {
      setTxLoading(true);
      const res = await fetch(`/api/gold-card/transactions?userId=${user.id}&limit=50`);
      const data = await res.json();
      setTransactions((data.transactions || []).map((tx: Record<string, unknown>) => ({
        id: tx.id as string,
        type: (tx.type as CardTransaction['type']) || 'purchase',
        amount: (tx.amount as number) || 0,
        merchant: (tx.merchant as string) || '',
        description: (tx.description as string) || undefined,
        status: (tx.status as CardTransaction['status']) || 'completed',
        createdAt: (tx.createdAt as string) || new Date().toISOString(),
        goldGrams: (tx.goldGrams as number) || undefined,
      })));
    } catch (err) {
      console.error('[GoldCard transactions fetch error]', err);
      // Silently fail — transactions are not critical
    }
    finally { setTxLoading(false); }
  }, [user?.id, addToast]);

  /* ── Actions ── */
  const handleToggleFreeze = useCallback(async () => {
    if (!card) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/gold-card/freeze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user?.id }) });
      const data = await res.json();
      if (!res.ok) { addToast(data.message || 'خطا در تغییر وضعیت', 'error'); return; }
      setCard((p) => p ? { ...p, status: p.status === 'frozen' ? 'active' : 'frozen' } : p);
      addToast(data.message, 'success');
    } catch { addToast('خطا در تغییر وضعیت', 'error'); }
    finally { setActionLoading(false); }
  }, [card, user?.id, addToast]);

  const handleCharge = useCallback(async () => {
    const grams = parseFloat(chargeGrams);
    if (!grams || grams <= 0) { addToast('مقدار طلا را وارد کنید', 'error'); return; }
    setActionLoading(true);
    try {
      const res = await fetch('/api/gold-card/charge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user?.id, goldGrams: grams }) });
      const data = await res.json();
      if (!res.ok) { addToast(data.message || 'خطا در شارژ', 'error'); return; }
      setCard((p) => p ? { ...p, balance: data.newBalance ?? p.balance, linkedGoldGrams: data.linkedGoldGram ?? p.linkedGoldGrams } : p);
      setChargeGrams('');
      setChargeOpen(false);
      addToast(data.message || 'شارژ موفق', 'success');
    } catch { addToast('خطا در شارژ کارت', 'error'); }
    finally { setActionLoading(false); }
  }, [chargeGrams, user?.id, addToast]);

  const handlePinChange = useCallback(async () => {
    if (!oldPin || !newPin || !confirmPin) { addToast('تمام فیلدها را پر کنید', 'error'); return; }
    if (newPin !== confirmPin) { addToast('رمز جدید با تکرار مطابقت ندارد', 'error'); return; }
    if (newPin.length < 4) { addToast('رمز باید حداقل ۴ رقم باشد', 'error'); return; }
    setActionLoading(true);
    try {
      const res = await fetch('/api/gold-card/pin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user?.id, oldPin, newPin }) });
      const data = await res.json();
      if (!res.ok) { addToast(data.message || 'خطا در تغییر رمز', 'error'); return; }
      setOldPin(''); setNewPin(''); setConfirmPin(''); setPinOpen(false);
      addToast(data.message || 'رمز تغییر کرد', 'success');
    } catch { addToast('خطا در تغییر رمز', 'error'); }
    finally { setActionLoading(false); }
  }, [oldPin, newPin, confirmPin, user?.id, addToast]);

  const handleDesignChange = useCallback(async (designVal?: string) => {
    const d = designVal || selectedDesign;
    if (!card || d === card.design) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/gold-card/design', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user?.id, design: d }) });
      const data = await res.json();
      if (!res.ok) { addToast(data.message || 'خطا در تغییر طرح', 'error'); return; }
      setCard((p) => p ? { ...p, design: d as GoldCardData['design'] } : p);
      setSelectedDesign(d);
      setDesignOpen(false);
      addToast(data.message || 'طرح تغییر کرد', 'success');
    } catch { addToast('خطا در تغییر طرح', 'error'); }
    finally { setActionLoading(false); }
  }, [card, selectedDesign, user?.id, addToast]);

  const handleLimitsSave = useCallback(async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/gold-card/limits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user?.id, dailyLimit, monthlyLimit }) });
      const data = await res.json();
      if (!res.ok) { addToast(data.message || 'خطا', 'error'); return; }
      setCard((p) => p ? { ...p, dailyLimit, monthlyLimit } : p);
      setLimitsOpen(false);
      addToast(data.message || 'سقف ذخیره شد', 'success');
    } catch { addToast('خطا', 'error'); }
    finally { setActionLoading(false); }
  }, [user?.id, dailyLimit, monthlyLimit, addToast]);

  const handleRequestCard = useCallback(async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/gold-card', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'request', userId: user?.id }) });
      const data = await res.json();
      if (!res.ok) { addToast(data.error || 'خطا در صدور کارت', 'error'); return; }
      addToast('کارت طلایی صادر شد! 🎉', 'success');
      await fetchCard();
    } catch { addToast('خطا در صدور کارت', 'error'); }
    finally { setActionLoading(false); }
  }, [user?.id, addToast, fetchCard]);

  const handleCloseCard = useCallback(async () => {
    if (!card) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/gold-card', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'close', userId: user?.id }) });
      const data = await res.json();
      if (!res.ok) { addToast(data.error || 'خطا', 'error'); return; }
      setCard(null); setTransactions([]);
      addToast(data.message || 'کارت بسته شد', 'info');
    } catch { addToast('خطا', 'error'); }
    finally { setActionLoading(false); }
  }, [card, user?.id, addToast]);

  const handleCopyNumber = useCallback(() => {
    if (!card) return;
    navigator.clipboard.writeText(card.cardNumber.replace(/-/g, ''))
      .then(() => addToast('شماره کارت کپی شد', 'success'))
      .catch(() => addToast('خطا در کپی', 'error'));
  }, [card, addToast]);

  const handleSecurityToggle = useCallback((key: keyof SecuritySettings) => {
    setSecurity((p) => ({ ...p, [key]: !p[key] }));
    addToast(`تنظیم امنیتی تغییر کرد`, 'success');
  }, [addToast]);

  const chargeFiat = (parseFloat(chargeGrams) || 0) * goldPrice;

  /* ── Loading state ── */
  if (loading) {
    return (
      <div dir="rtl" className="space-y-6 p-4">
        <CardStyles />
        <Skeleton className="w-full max-w-[400px] mx-auto aspect-[1.586/1] rounded-2xl" />
        <div className="grid grid-cols-3 gap-2.5 max-w-[400px] mx-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-[400px] mx-auto">
          {[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  /* ── No card state ── */
  if (!card) {
    return (
      <div dir="rtl">
        <CardStyles />
        <WelcomeScreen onRequest={handleRequestCard} loading={actionLoading} />
      </div>
    );
  }

  const isFrozen = card.status === 'frozen';
  const totalTx = transactions.length;
  const totalSpent = transactions.filter((t) => t.type === 'purchase').reduce((s, t) => s + t.amount, 0);

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                                 */
  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div dir="rtl">
      <CardStyles />
      <div className="mx-auto max-w-4xl page-transition space-y-4 pb-6 px-4 rounded-2xl" style={{ background: 'linear-gradient(180deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.03) 40%, transparent 100%)' }}>
        <Tabs defaultValue="card" dir="rtl" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-11 bg-card border border-border/50 rounded-xl p-1">
            <TabsTrigger value="card" data-goldcard-tab="card" className="rounded-lg data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#2a1a00] text-xs font-medium gap-1">
              <CreditCard className="size-3.5" />
              {locale === 'en' ? 'My Card' : 'کارت من'}
            </TabsTrigger>
            <TabsTrigger value="transactions" data-goldcard-tab="transactions" className="rounded-lg data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#2a1a00] text-xs font-medium gap-1" onClick={fetchAllTransactions}>
              <ShoppingCart className="size-3.5" />
              {locale === 'en' ? 'Transactions' : 'تراکنش‌ها'}
            </TabsTrigger>
            <TabsTrigger value="transfer" data-goldcard-tab="transfer" className="rounded-lg data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#2a1a00] text-xs font-medium gap-1">
              <ArrowLeftRight className="size-3.5" />
              {locale === 'en' ? 'Transfer' : 'انتقال'}
            </TabsTrigger>
            <TabsTrigger value="settings" data-goldcard-tab="settings" className="rounded-lg data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[2a1a00] text-xs font-medium gap-1">
              <Gauge className="size-3.5" />
              {locale === 'en' ? 'Settings' : 'تنظیمات'}
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════ */}
          {/*  TAB 1 — My Gold Card                                    */}
          {/* ═══════════════════════════════════════════════════════ */}
          <TabsContent value="card" className="space-y-5 mt-4">
            {/* 3D Flip Card */}
            <VirtualCard
              card={card}
              userName={user?.fullName || ''}
              isFrozen={isFrozen}
              showNumber={showNumber}
              showCvv={showCvv}
              showPin={showPin}
              onToggleNumber={() => setShowNumber(!showNumber)}
              onToggleCvv={() => setShowCvv(!showCvv)}
              onTogglePin={() => setShowPin(!showPin)}
              onFlip={() => {}}
            />

            {/* Quick Actions */}
            <QuickActions
              isFrozen={isFrozen}
              actionLoading={actionLoading}
              onFreeze={handleToggleFreeze}
              onChargeOpen={() => setChargeOpen(true)}
              onPinOpen={() => setPinOpen(true)}
              onDesignOpen={() => setDesignOpen(true)}
              onLimitsOpen={() => setLimitsOpen(true)}
              onCopyNumber={handleCopyNumber}
              cardNumber={card.cardNumber}
            />

            {/* Card Stats Dashboard */}
            <CardStats card={card} goldPrice={goldPrice} />

            {/* Card Level */}
            <CardLevel totalTx={totalTx} />

            {/* Card Rewards */}
            <CardRewards totalSpent={totalSpent} />
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════ */}
          {/*  TAB 2 — Transactions                                  */}
          {/* ═══════════════════════════════════════════════════════ */}
          <TabsContent value="transactions" className="mt-4">
            <TransactionsList
              transactions={transactions}
              loading={txLoading}
              filter={txFilter}
              onFilterChange={setTxFilter}
              onRefresh={fetchAllTransactions}
            />
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════ */}
          {/*  TAB 3 — Transfer                                     */}
          {/* ═══════════════════════════════════════════════════════ */}
          <TabsContent value="transfer" className="mt-4">
            <TransferSection goldPrice={goldPrice} userRole={user?.role || ''} />
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════ */}
          {/*  TAB 4 — Settings                                     */}
          {/* ═══════════════════════════════════════════════════════ */}
          <TabsContent value="settings" className="mt-4 space-y-5">
            {/* Security Center */}
            <SecurityCenter
              settings={security}
              onToggle={handleSecurityToggle}
              onEmergencyLock={handleToggleFreeze}
              recentTx={transactions}
              actionLoading={actionLoading}
            />

            {/* PIN Change Dialog */}
            <Dialog open={pinOpen} onOpenChange={setPinOpen}>
              <DialogTrigger asChild>
                <Card className="bg-card border-border/30 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-gold/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-purple-500/10 flex items-center justify-center"><Lock className="size-4 text-purple-500" /></div>
                    <div>
                      <p className="text-sm font-medium">تغییر رمز کارت</p>
                      <p className="text-[11px] text-muted-foreground">رمز عبور کارت خود را تغییر دهید</p>
                    </div>
                  </div>
                  <ChevronDown className="size-4 text-muted-foreground rotate-[-90deg]" />
                </Card>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle className="gold-gradient-text text-xl">تغییر رمز کارت</DialogTitle>
                  <DialogDescription>رمز فعلی و رمز جدید را وارد کنید</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5"><Label>رمز فعلی</Label><Input type="password" value={oldPin} onChange={(e) => setOldPin(e.target.value)} className="rounded-xl text-center tracking-widest" maxLength={8} /></div>
                  <div className="space-y-1.5"><Label>رمز جدید</Label><Input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} className="rounded-xl text-center tracking-widest" maxLength={8} /></div>
                  <div className="space-y-1.5"><Label>تکرار رمز جدید</Label><Input type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} className="rounded-xl text-center tracking-widest" maxLength={8} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPinOpen(false)} className="rounded-xl">انصراف</Button>
                  <Button onClick={handlePinChange} disabled={actionLoading} className="rounded-xl bg-[#D4AF37] hover:bg-[#B8960C] text-[#2a1a00] font-bold">
                    {actionLoading ? 'در حال تغییر...' : 'تغییر رمز'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Design Picker */}
            <div className="space-y-3">
              <Card className="bg-card border-border/30 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-gold/30 transition-colors" onClick={() => setDesignOpen(true)}>
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-pink-500/10 flex items-center justify-center"><Palette className="size-4 text-pink-500" /></div>
                  <div>
                    <p className="text-sm font-medium">تغییر طرح کارت</p>
                    <p className="text-[11px] text-muted-foreground">طرح فعلی: {CARD_DESIGNS[card.design as keyof typeof CARD_DESIGNS]?.label}</p>
                  </div>
                </div>
                <ChevronDown className="size-4 text-muted-foreground rotate-[-90deg]" />
              </Card>

              <Dialog open={designOpen} onOpenChange={setDesignOpen}>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="gold-gradient-text text-xl">انتخاب طرح کارت</DialogTitle>
                    <DialogDescription>یکی از طرح‌های زیر را انتخاب کنید</DialogDescription>
                  </DialogHeader>
                  <DesignPicker currentDesign={selectedDesign} onSelect={handleDesignChange} loading={actionLoading} />
                </DialogContent>
              </Dialog>
            </div>

            {/* Spending Limits */}
            <div className="space-y-3">
              <Card className="bg-card border-border/30 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-gold/30 transition-colors" onClick={() => setLimitsOpen(true)}>
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-cyan-500/10 flex items-center justify-center"><Gauge className="size-4 text-cyan-500" /></div>
                  <div>
                    <p className="text-sm font-medium">سقف تراکنش</p>
                    <p className="text-[11px] text-muted-foreground">سقف خرید روزانه و ماهانه</p>
                  </div>
                </div>
                <ChevronDown className="size-4 text-muted-foreground rotate-[-90deg]" />
              </Card>

              <Dialog open={limitsOpen} onOpenChange={setLimitsOpen}>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="gold-gradient-text text-xl">تنظیم سقف تراکنش</DialogTitle>
                    <DialogDescription>سقف خرید روزانه و ماهانه خود را تعیین کنید</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 py-2">
                    <div className="space-y-2">
                      <div className="flex justify-between"><Label>سقف روزانه (تومان)</Label><span className="text-xs font-mono text-muted-foreground">{formatToman(dailyLimit)}</span></div>
                      <Slider value={[dailyLimit]} min={1_000_000} max={500_000_000} step={5_000_000} onValueChange={([v]) => setDailyLimit(v)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between"><Label>سقف ماهانه (تومان)</Label><span className="text-xs font-mono text-muted-foreground">{formatToman(monthlyLimit)}</span></div>
                      <Slider value={[monthlyLimit]} min={10_000_000} max={5_000_000_000} step={50_000_000} onValueChange={([v]) => setMonthlyLimit(v)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setLimitsOpen(false)} className="rounded-xl">انصراف</Button>
                    <Button onClick={handleLimitsSave} disabled={actionLoading} className="rounded-xl bg-[#D4AF37] hover:bg-[#B8960C] text-[#2a1a00] font-bold">
                      {actionLoading ? 'ذخیره...' : 'ذخیره'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Close Card */}
            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="size-4" />
                منطقه خطر
              </h3>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-500">
                    <XCircle className="size-4 ml-2" />
                    بستن کارت
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>بستن کارت طلایی</AlertDialogTitle>
                    <AlertDialogDescription>
                      آیا مطمئن هستید؟ با بستن کارت، موجودی و طلاهای متصل به کیف پول اصلی برگردانده می‌شود. این عمل قابل بازگشت نیست.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>انصراف</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCloseCard} className="bg-red-600 hover:bg-red-700">
                      بله، کارت را ببند
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>
        </Tabs>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*  Global Dialogs (outside tabs)                       */}
        {/* ═══════════════════════════════════════════════════════ */}

        {/* Charge Dialog */}
        <Dialog open={chargeOpen} onOpenChange={setChargeOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle className="gold-gradient-text text-xl">شارژ کارت از طلا</DialogTitle>
              <DialogDescription>طلای خود را به اعتبار کارت تبدیل کنید</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-sm">مقدار طلا (گرم)</Label>
                <Input type="number" step="0.01" min="0.01" placeholder="مثلاً ۰.۵" value={chargeGrams} onChange={(e) => setChargeGrams(e.target.value)} className="rounded-xl" />
                {chargeGrams && parseFloat(chargeGrams) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    معادل: <span className="font-bold text-foreground">{formatToman(chargeFiat)}</span> تومان (قیمت هر گرم: {formatToman(goldPrice)})
                  </p>
                )}
              </div>
              {chargeGrams && parseFloat(chargeGrams) > 0 && (
                <Card className="bg-muted/50 rounded-xl p-3 space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">مقدار طلا</span><span className="font-mono">{toPersianDigits(parseFloat(chargeGrams).toFixed(2))} گرم</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">قیمت هر گرم</span><span className="font-mono">{formatToman(goldPrice)}</span></div>
                  <Separator />
                  <div className="flex justify-between font-bold text-sm"><span>مجموع</span><span className="font-mono">{formatToman(chargeFiat)} تومان</span></div>
                </Card>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setChargeOpen(false)} className="rounded-xl">انصراف</Button>
              <Button onClick={handleCharge} disabled={actionLoading || !chargeGrams || parseFloat(chargeGrams) <= 0} className="rounded-xl bg-[#D4AF37] hover:bg-[#B8960C] text-[#2a1a00] font-bold">
                {actionLoading ? 'در حال شارژ...' : 'شارژ کارت'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

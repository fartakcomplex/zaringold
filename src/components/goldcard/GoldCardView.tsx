'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { usePageEvent } from '@/hooks/use-page-event';
import { useTranslation } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  CreditCard,
  Snowflake,
  Flame,
  Coins,
  Lock,
  Palette,
  Gauge,
  ShoppingCart,
  RotateCcw,
  ArrowDown,
  Eye,
  EyeOff,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sparkles,
  ShieldCheck,
  Download,
  QrCode,
  Wifi,
  ArrowLeftRight,
  Send,
  Clock,
  BookUser,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface GoldCardData {
  id: string;
  userId: string;
  cardNumber: string;
  cvv: string;
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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
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
  return `${clean.slice(0, 4)}-XXXX-XX${clean.slice(-6, -4)}-${clean.slice(-4)}`;
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
    case 'purchase':
      return <ShoppingCart className="size-4 text-red-400" />;
    case 'refund':
      return <RotateCcw className="size-4 text-green-400" />;
    case 'charge':
      return <Coins className="size-4 text-yellow-400" />;
    case 'withdrawal':
      return <ArrowDown className="size-4 text-orange-400" />;
    case 'transfer_out':
      return <Send className="size-4 text-blue-400" />;
    default:
      return <CreditCard className="size-4" />;
  }
}

function getStatusBadge(status: CardTransaction['status']) {
  switch (status) {
    case 'success':
    case 'completed':
      return (
        <Badge className="bg-green-500/15 text-green-400 border-green-500/20 text-[10px]">
          <CheckCircle className="size-3" />
          موفق
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/20 text-[10px]">
          در انتظار
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-[10px]">
          <XCircle className="size-3" />
          ناموفق
        </Badge>
      );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Card Gradient Configs                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CARD_DESIGNS = {
  'gold-gradient': {
    bg: 'linear-gradient(135deg, #b8860b, #daa520, #ffd700, #f0c040, #daa520, #b8860b)',
    text: 'text-[#2a1a00]',
    sub: 'text-[#3d2800]/90',
    accent: 'text-[#ffd700]',
    shimmer: 'from-amber-300/0 via-amber-200/30 to-amber-300/0',
    label: 'طلایی کلاسیک',
    border: '',
  },
  'black-premium': {
    bg: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #1a1a2e)',
    text: 'text-white',
    sub: 'text-gray-300',
    accent: 'text-[#D4AF37]',
    shimmer: 'from-[#D4AF37]/0 via-[#D4AF37]/25 to-[#D4AF37]/0',
    border: 'border-[#D4AF37]/40',
    label: 'مشکی پریمیوم',
  },
  'diamond': {
    bg: 'linear-gradient(135deg, #b8860b, #daa520, #ffd700, #e8c252, #daa520, #b8860b)',
    text: 'text-[#2a1a00]',
    sub: 'text-[#3d2800]/90',
    accent: 'text-white',
    shimmer: 'from-white/0 via-white/30 to-white/0',
    label: 'الماسی',
    border: '',
  },
  'rose-gold': {
    bg: 'linear-gradient(135deg, #b76e79, #e8b4b8, #f4d6cc, #daa06d, #b76e79)',
    text: 'text-[#2a1018]',
    sub: 'text-[#3d1a25]/90',
    accent: 'text-white',
    shimmer: 'from-white/0 via-white/25 to-white/0',
    label: 'رز گلد',
    border: '',
  },
} as const;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  API helper to map server response to local GoldCardData               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function mapApiCard(c: Record<string, unknown>, userId: string, goldPriceVal: number): GoldCardData {
  return {
    id: c.id as string,
    userId,
    cardNumber: (c.fullCardNumber || c.cardNumber) as string,
    cvv: (c.cvv) as string,
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
/*  Virtual Card Component                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function VirtualCard({
  card,
  userName,
  isFrozen,
  showNumber,
  showCvv,
  onToggleNumber,
  onToggleCvv,
}: {
  card: GoldCardData;
  userName: string;
  isFrozen: boolean;
  showNumber: boolean;
  showCvv: boolean;
  onToggleNumber: () => void;
  onToggleCvv: () => void;
}) {
  const design = CARD_DESIGNS[card.design];
  const isDiamond = card.design === 'diamond';
  const isSuperAdmin = false; // We'll get from store

  return (
    <div
      className={`relative w-full max-w-[400px] mx-auto aspect-[1.586/1] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(212,175,55,0.25)] golden-card-animated ${design.border || 'border border-white/10'} select-none`}
      style={{ background: design.bg }}
    >
      {/* Shimmer overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${design.shimmer} animate-[shimmer_3s_ease-in-out_infinite] pointer-events-none`}
        style={{ backgroundSize: '200% 100%' }}
      />

      {/* Diamond sparkle particles */}
      {isDiamond && (
        <>
          <div className="absolute top-4 left-8 w-2 h-2 bg-white/70 rounded-full animate-[twinkle_2s_ease-in-out_infinite]" />
          <div className="absolute top-12 right-16 w-1.5 h-1.5 bg-white/50 rounded-full animate-[twinkle_2.5s_ease-in-out_infinite_0.5s]" />
          <div className="absolute bottom-16 left-20 w-1 h-1 bg-white/60 rounded-full animate-[twinkle_3s_ease-in-out_infinite_1s]" />
          <div className="absolute top-1/2 right-8 w-2 h-2 bg-white/40 rounded-full animate-[twinkle_2.8s_ease-in-out_infinite_0.3s]" />
        </>
      )}

      {/* Frozen overlay */}
      {isFrozen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <Snowflake className="size-12 text-blue-300 animate-pulse" />
            <span className="text-white font-bold text-lg">کارتی مسدود</span>
          </div>
        </div>
      )}

      {/* Card content */}
      <div className="relative z-[5] flex flex-col justify-between h-full p-5 sm:p-6">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-[10px] font-bold tracking-wider uppercase ${design.sub}`}>
              ZARRIN GOLD
            </p>
            <p className={`text-lg font-extrabold tracking-wide ${design.text} mt-0.5`}>
              زرین گلد
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className={`size-5 ${design.sub} rotate-90`} />
            {isSuperAdmin && (
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-[9px] px-1.5 py-0">
                الماس 💎
              </Badge>
            )}
          </div>
        </div>

        {/* Card number */}
        <div
          className="cursor-pointer active:scale-[0.98] transition-transform"
          onClick={onToggleNumber}
        >
          <p className={`text-lg sm:text-xl font-mono tracking-[0.15em] ${design.text} text-center font-bold`}>
            {showNumber ? card.cardNumber : maskCardNumber(card.cardNumber)}
          </p>
          <p className="text-center mt-0.5">
            {showNumber ? (
              <EyeOff className={`size-3.5 mx-auto ${design.sub}`} />
            ) : (
              <Eye className={`size-3.5 mx-auto ${design.sub}`} />
            )}
          </p>
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between">
          <div>
            <p className={`text-[9px] font-semibold ${design.sub}`}>CVV2</p>
            <div
              className="cursor-pointer active:scale-[0.98] transition-transform"
              onClick={onToggleCvv}
            >
              <p className={`text-sm font-mono ${design.text} font-bold`}>
                {showCvv ? card.cvv : '***'}
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className={`text-[9px] font-semibold ${design.sub}`}>اعتبار</p>
            <p className={`text-sm font-mono ${design.text} font-bold`}>{card.expiry}</p>
          </div>

          <div className="text-left">
            <p className={`text-[9px] font-semibold ${design.sub}`}>دارنده کارت</p>
            <p className={`text-xs font-bold ${design.text} max-w-[120px] truncate`}>
              {userName || 'کاربر زرین گلد'}
            </p>
          </div>
        </div>

        {/* Card type badge */}
        <div className="absolute bottom-3 right-5">
          <Badge
            variant="outline"
            className={`${design.border || 'border-white/30'} ${design.sub} text-[9px] px-1.5 py-0`}
          >
            {card.type === 'VIRTUAL' ? '🥇 مجازی' : '💳 فیزیکی'}
          </Badge>
        </div>
      </div>

      {/* NFC icon bottom-left */}
      <div className={`absolute bottom-5 left-5 z-[5]`}>
        <QrCode className={`size-6 ${design.sub} opacity-40`} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Welcome Screen (No Card)                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function WelcomeScreen({ onRequest }: { onRequest: () => void }) {
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
        <div className="absolute inset-0 bg-gradient-to-r from-amber-300/0 via-amber-200/40 to-amber-300/0 animate-[shimmer_3s_ease-in-out_infinite]" style={{ backgroundSize: '200% 100%' }} />
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

      {/* Title */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold gold-gradient-text">کارت طلایی شما آماده‌ است!</h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
          با کارت طلایی زرین گلد، طلای خود را به کارت بانکی تبدیل کنید و هر جا خرید کنید.
        </p>
      </div>

      {/* Benefits */}
      <div className="w-full max-w-sm space-y-3">
        {benefits.map((b, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-gold/30 transition-colors"
          >
            <div className="size-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold shrink-0">
              {b.icon}
            </div>
            <span className="text-sm">{b.text}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="w-full max-w-sm space-y-3">
        <Button
          className="w-full bg-gold hover:bg-gold-dark text-gold-dark hover:text-white font-bold text-base py-6 rounded-xl transition-all duration-300 btn-gold-shine"
          onClick={onRequest}
        >
          <CreditCard className="size-5 ml-2" />
          درخواست کارت طلایی
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
/*  Mini Card Preview (for design picker)                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MiniCardPreview({
  design,
  selected,
  onSelect,
}: {
  design: keyof typeof CARD_DESIGNS;
  selected: boolean;
  onSelect: () => void;
}) {
  const d = CARD_DESIGNS[design];

  return (
    <button
      onClick={onSelect}
      className={`w-full aspect-[1.586/1] rounded-xl overflow-hidden relative transition-all duration-300 ${
        selected
          ? 'ring-2 ring-gold ring-offset-2 ring-offset-background scale-[1.03] shadow-lg'
          : 'ring-1 ring-border/40 opacity-70 hover:opacity-100 hover:scale-[1.01]'
      }`}
    >
      <div className={`w-full h-full ${d.border || ''} flex flex-col justify-between p-2.5`} style={{ background: d.bg }}>
        <p className={`text-[7px] tracking-wider ${d.sub}`}>ZARRIN GOLD</p>
        <p className={`text-[9px] font-mono tracking-wider ${d.text}`}>•••• •••• ••••</p>
        <div className="flex items-center justify-between">
          <p className={`text-[7px] ${d.sub}`}>{d.label}</p>
          {selected && <CheckCircle className="size-3 text-green-300" />}
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function GoldCardView() {
  const { user, addToast } = useAppStore();

  /* ── State ── */
  const [card, setCard] = useState<GoldCardData | null>(null);
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNumber, setShowNumber] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [txFilter, setTxFilter] = useState<string>('all');
  const [goldPrice, setGoldPrice] = useState(8_900_000);

  // Transfer state (GOLD-BASED)
  const [transferToCard, setTransferToCard] = useState('');
  const [transferGoldGrams, setTransferGoldGrams] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [transferPin, setTransferPin] = useState('');
  const [transferStep, setTransferStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferResult, setTransferResult] = useState<Record<string, unknown> | null>(null);

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
  const [dailyLimit, setDailyLimit] = useState(10_000_000);
  const [monthlyLimit, setMonthlyLimit] = useState(100_000_000);
  const [actionLoading, setActionLoading] = useState(false);

  /* ── Quick Action Event Listeners ── */
  usePageEvent('transfer', () => {
    // Switch to transfer tab — we use a ref to the tab trigger
    const transferTab = document.querySelector('[data-goldcard-tab="transfer"]') as HTMLElement;
    if (transferTab) transferTab.click();
  });
  usePageEvent('balance', () => {
    const cardTab = document.querySelector('[data-goldcard-tab="card"]') as HTMLElement;
    if (cardTab) cardTab.click();
  });
  usePageEvent('freeze', () => handleToggleFreeze());
  usePageEvent('show-number', () => setShowNumber((prev) => !prev));

  /* ── Fetch gold price ── */
  useEffect(() => {
    fetch('/api/gold/prices')
      .then(r => r.json())
      .then(data => {
        if (data.buyPrice) setGoldPrice(data.buyPrice);
      })
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
    } catch {
      addToast('خطا در دریافت اطلاعات کارت', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, goldPrice, addToast]);

  useEffect(() => {
    fetchCard();
  }, [fetchCard]);

  /* ── Fetch full transactions list ── */
  const [txLoading, setTxLoading] = useState(false);

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
    } catch {
      addToast('خطا در دریافت تراکنش‌ها', 'error');
    } finally {
      setTxLoading(false);
    }
  }, [user?.id, addToast]);

  /* ── Actions ── */
  const handleToggleFreeze = useCallback(async () => {
    if (!card) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/gold-card/freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.message || 'خطا در تغییر وضعیت کارت', 'error');
        return;
      }
      setCard((prev) =>
        prev ? { ...prev, status: prev.status === 'frozen' ? 'active' : 'frozen' } : prev
      );
      addToast(data.message, 'success');
    } catch {
      addToast('خطا در تغییر وضعیت کارت', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [card, user?.id, addToast]);

  const handleCharge = useCallback(async () => {
    const grams = parseFloat(chargeGrams);
    if (!grams || grams <= 0) {
      addToast('مقدار طلا را وارد کنید', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/gold-card/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, goldGrams: grams }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.message || 'خطا در شارژ کارت', 'error');
        return;
      }
      setCard((prev) =>
        prev
          ? {
              ...prev,
              balance: data.newBalance ?? prev.balance,
              linkedGoldGrams: data.linkedGoldGram ?? prev.linkedGoldGrams,
            }
          : prev
      );
      setChargeGrams('');
      setChargeOpen(false);
      addToast(data.message || 'شارژ با موفقیت انجام شد', 'success');
    } catch {
      addToast('خطا در شارژ کارت', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [chargeGrams, user?.id, addToast]);

  const handlePinChange = useCallback(async () => {
    if (!oldPin || !newPin || !confirmPin) {
      addToast('تمام فیلدها را پر کنید', 'error');
      return;
    }
    if (newPin !== confirmPin) {
      addToast('رمز جدید با تکرار آن مطابقت ندارد', 'error');
      return;
    }
    if (newPin.length < 4) {
      addToast('رمز باید حداقل ۴ رقم باشد', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/gold-card/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, oldPin, newPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.message || 'خطا در تغییر رمز کارت', 'error');
        return;
      }
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      setPinOpen(false);
      addToast(data.message || 'رمز کارت با موفقیت تغییر کرد', 'success');
    } catch {
      addToast('خطا در تغییر رمز کارت', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [oldPin, newPin, confirmPin, user?.id, addToast]);

  const handleDesignChange = useCallback(async (designValue?: string) => {
    const design = designValue || selectedDesign;
    if (!card || design === card.design) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/gold-card/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, design }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.message || 'خطا در تغییر طراحی کارت', 'error');
        return;
      }
      setCard((prev) => (prev ? { ...prev, design: design as GoldCardData['design'] } : prev));
      setSelectedDesign(design);
      setDesignOpen(false);
      addToast(data.message || 'طراحی کارت تغییر کرد', 'success');
    } catch {
      addToast('خطا در تغییر طراحی کارت', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [card, selectedDesign, user?.id, addToast]);

  const handleLimitsSave = useCallback(async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/gold-card/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, dailyLimit, monthlyLimit }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.message || 'خطا در ذخیره سقف تراکنش', 'error');
        return;
      }
      setCard((prev) => (prev ? { ...prev, dailyLimit, monthlyLimit } : prev));
      setLimitsOpen(false);
      addToast(data.message || 'سقف تراکنش‌ها با موفقیت ذخیره شد', 'success');
    } catch {
      addToast('خطا در ذخیره سقف تراکنش', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [user?.id, dailyLimit, monthlyLimit, addToast]);

  const handleRequestCard = useCallback(async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/gold-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', userId: user?.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'خطا در صدور کارت', 'error');
        return;
      }
      addToast('کارت طلایی شما با موفقیت صادر شد! 🎉', 'success');
      await fetchCard();
    } catch {
      addToast('خطا در صدور کارت', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [user?.id, addToast, fetchCard]);

  const handleCloseCard = useCallback(async () => {
    if (!card) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/gold-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close', userId: user?.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'خطا در بستن کارت', 'error');
        return;
      }
      setCard(null);
      setTransactions([]);
      addToast(data.message || 'کارت با موفقیت بسته شد', 'info');
    } catch {
      addToast('خطا در بستن کارت', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [card, user?.id, addToast]);

  /* ── Card-to-Card Transfer (GOLD-BASED) ── */
  const formatCardInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1-').slice(0, -1);
  };

  // Gold-based fee calculation
  const parsedGoldGrams = parseFloat(transferGoldGrams) || 0;
  const transferFeeGoldMg = user?.role === 'super_admin' ? 0 : parsedGoldGrams * 0.001; // 0.1% fee in gold
  const transferFeeFiat = transferFeeGoldMg * goldPrice;
  const fiatEquivalent = parsedGoldGrams * goldPrice;
  const totalTransferFiat = fiatEquivalent + transferFeeFiat;
  const totalGoldGrams = parsedGoldGrams + transferFeeGoldMg;

  const handleTransfer = useCallback(async () => {
    if (!transferToCard.replace(/-/g, '') || !transferGoldGrams || parseFloat(transferGoldGrams) <= 0) {
      addToast('اطلاعات انتقال ناقص', 'error');
      return;
    }
    if (parseFloat(transferGoldGrams) < 0.001) {
      addToast('حداقل مقدار انتقال ۱ میلی‌گرم طلا', 'error');
      return;
    }
    if (!transferPin) {
      addToast('رمز کارت الزامی است', 'error');
      return;
    }
    setTransferLoading(true);
    try {
      const res = await fetch('/api/gold-card/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          toCardNumber: transferToCard,
          goldGrams: parseFloat(transferGoldGrams),
          description: transferDesc || undefined,
          pin: transferPin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'خطا در انتقال طلا', 'error');
        return;
      }
      setTransferResult(data);
      setTransferStep('success');
      // Update card balance
      if (card) {
        setCard({ 
          ...card, 
          balance: data.newBalance,
          linkedGoldGrams: data.newGoldBalance ?? card.linkedGoldGrams,
        });
      }
      addToast(data.message, 'success');
    } catch {
      addToast('خطای شبکه', 'error');
    } finally {
      setTransferLoading(false);
    }
  }, [transferToCard, transferGoldGrams, transferDesc, transferPin, user?.id, card, addToast]);

  const resetTransfer = useCallback(() => {
    setTransferToCard('');
    setTransferGoldGrams('');
    setTransferDesc('');
    setTransferPin('');
    setTransferStep('form');
    setTransferResult(null);
  }, []);

  /* ── Filtered transactions ── */
  const filteredTx = txFilter === 'all' ? transactions : transactions.filter((t) => t.type === txFilter);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="w-full max-w-[400px] mx-auto aspect-[1.586/1] rounded-2xl" />
        <div className="flex gap-3 justify-center">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="size-12 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ── No card state ── */
  if (!card) {
    return <WelcomeScreen onRequest={handleRequestCard} />;
  }

  const isFrozen = card.status === 'frozen';
  const chargeFiat = (parseFloat(chargeGrams) || 0) * goldPrice;
  const dailyPercent = card.dailyLimit > 0 ? (card.dailySpent / card.dailyLimit) * 100 : 0;
  const monthlyPercent = card.monthlyLimit > 0 ? (card.monthlySpent / card.monthlyLimit) * 100 : 0;

  return (
    <div className="mx-auto max-w-4xl page-transition space-y-4 pb-6 px-4 rounded-2xl" style={{ background: 'linear-gradient(180deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.03) 40%, transparent 100%)' }}>
      <Tabs defaultValue="card" dir="rtl" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-11 bg-card border border-border/50 rounded-xl p-1">
          <TabsTrigger
            value="card"
            className="rounded-lg data-[state=active]:bg-gold data-[state=active]:text-gold-dark text-xs font-medium gap-1"
          >
            <CreditCard className="size-3.5" />
            کارت طلایی من
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="rounded-lg data-[state=active]:bg-gold data-[state=active]:text-gold-dark text-xs font-medium gap-1"
            onClick={fetchAllTransactions}
          >
            <ShoppingCart className="size-3.5" />
            تراکنش‌ها
          </TabsTrigger>
          <TabsTrigger
            value="transfer"
            className="rounded-lg data-[state=active]:bg-gold data-[state=active]:text-gold-dark text-xs font-medium gap-1"
          >
            <ArrowLeftRight className="size-3.5" />
            انتقال وجه
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="rounded-lg data-[state=active]:bg-gold data-[state=active]:text-gold-dark text-xs font-medium gap-1"
          >
            <Gauge className="size-3.5" />
            تنظیمات
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*  TAB 1 — My Gold Card                                    */}
        {/* ═══════════════════════════════════════════════════════ */}
        <TabsContent value="card" className="space-y-5 mt-4">
          {/* Virtual Card */}
          <VirtualCard
            card={card}
            userName={user?.fullName || ''}
            isFrozen={isFrozen}
            showNumber={showNumber}
            showCvv={showCvv}
            onToggleNumber={() => setShowNumber(!showNumber)}
            onToggleCvv={() => setShowCvv(!showCvv)}
          />

          {/* Card Actions */}
          <div className="flex justify-center gap-2.5 flex-wrap">
            <Button
              variant={isFrozen ? 'default' : 'outline'}
              size="sm"
              className={`rounded-xl gap-1.5 text-xs ${isFrozen ? 'bg-orange-500 hover:bg-orange-600 text-white border-0' : 'border-border/50 hover:border-gold/40 hover:text-gold'}`}
              onClick={handleToggleFreeze}
              disabled={actionLoading}
            >
              {isFrozen ? <Flame className="size-3.5" /> : <Snowflake className="size-3.5" />}
              {isFrozen ? 'فعال‌سازی' : 'مسدود'}
            </Button>

            {/* Charge Dialog */}
            <Dialog open={chargeOpen} onOpenChange={setChargeOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5 text-xs border-border/50 hover:border-gold/40 hover:text-gold"
                >
                  <Coins className="size-3.5" />
                  شارژ از طلا
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="gold-gradient-text text-xl">شارژ کارت از طلا</DialogTitle>
                  <DialogDescription>
                    طلای خود را به اعتبار کارت تبدیل کنید
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label className="text-sm">مقدار طلا (گرم)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="مثلاً ۰.۵"
                        value={chargeGrams}
                        onChange={(e) => setChargeGrams(e.target.value)}
                        className="text-left font-mono pr-14"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        گرم
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 border border-border/30 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">قیمت هر گرم:</span>
                      <span className="font-mono tabular-nums">{formatToman(goldPrice)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm font-bold">
                      <span>معادل واحد طلایی:</span>
                      <span className="text-gold font-mono tabular-nums">
                        {formatToman(chargeFiat)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertTriangle className="size-3.5 text-yellow-500 shrink-0" />
                    طلای انتخاب شده از کیف طلای شما کسر و به اعتبار کارت اضافه می‌شود.
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setChargeOpen(false)}
                    className="rounded-xl"
                  >
                    انصراف
                  </Button>
                  <Button
                    className="bg-gold hover:bg-gold-dark text-gold-dark hover:text-white rounded-xl"
                    onClick={handleCharge}
                    disabled={actionLoading || !chargeGrams || parseFloat(chargeGrams) <= 0}
                  >
                    {actionLoading ? 'در حال شارژ...' : 'تأیید شارژ'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* PIN Dialog */}
            <Dialog open={pinOpen} onOpenChange={setPinOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5 text-xs border-border/50 hover:border-gold/40 hover:text-gold"
                >
                  <Lock className="size-3.5" />
                  تغییر رمز
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="gold-gradient-text text-xl">تغییر رمز کارت</DialogTitle>
                  <DialogDescription>
                    رمز عبور کارت طلایی خود را تغییر دهید
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label className="text-sm">رمز فعلی</Label>
                    <Input
                      type="password"
                      maxLength={8}
                      placeholder="••••"
                      value={oldPin}
                      onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                      className="font-mono text-center text-lg tracking-[0.3em]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">رمز جدید</Label>
                    <Input
                      type="password"
                      maxLength={8}
                      placeholder="••••"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      className="font-mono text-center text-lg tracking-[0.3em]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">تکرار رمز جدید</Label>
                    <Input
                      type="password"
                      maxLength={8}
                      placeholder="••••"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      className="font-mono text-center text-lg tracking-[0.3em]"
                    />
                  </div>
                  {newPin && confirmPin && newPin !== confirmPin && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <XCircle className="size-3" />
                      رمز جدید با تکرار آن مطابقت ندارد
                    </p>
                  )}
                  {newPin && confirmPin && newPin === confirmPin && (
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle className="size-3" />
                      رمز مطابقت دارد
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setPinOpen(false)}
                    className="rounded-xl"
                  >
                    انصراف
                  </Button>
                  <Button
                    className="bg-gold hover:bg-gold-dark text-gold-dark hover:text-white rounded-xl"
                    onClick={handlePinChange}
                    disabled={actionLoading || !oldPin || !newPin || !confirmPin}
                  >
                    {actionLoading ? 'در حال تغییر...' : 'تغییر رمز'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Design Dialog */}
            <Dialog open={designOpen} onOpenChange={setDesignOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5 text-xs border-border/50 hover:border-gold/40 hover:text-gold"
                >
                  <Palette className="size-3.5" />
                  طراحی
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="gold-gradient-text text-xl">انتخاب طراحی کارت</DialogTitle>
                  <DialogDescription>
                    طرح مورد علاقه خود را انتخاب کنید
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 py-2">
                  {(Object.keys(CARD_DESIGNS) as Array<keyof typeof CARD_DESIGNS>).map((key) => (
                    <MiniCardPreview
                      key={key}
                      design={key}
                      selected={selectedDesign === key}
                      onSelect={() => setSelectedDesign(key)}
                    />
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDesignOpen(false)} className="rounded-xl">
                    انصراف
                  </Button>
                  <Button
                    className="bg-gold hover:bg-gold-dark text-gold-dark hover:text-white rounded-xl"
                    onClick={() => handleDesignChange()}
                    disabled={actionLoading || selectedDesign === card.design}
                  >
                    {actionLoading ? 'در حال تغییر...' : 'تأیید'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Limits Dialog */}
            <Dialog open={limitsOpen} onOpenChange={setLimitsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5 text-xs border-border/50 hover:border-gold/40 hover:text-gold"
                >
                  <Gauge className="size-3.5" />
                  سقف تراکنش
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="gold-gradient-text text-xl">تنظیم سقف تراکنش</DialogTitle>
                  <DialogDescription>
                    محدودیت روزانه و ماهانه خرید خود را تعیین کنید
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-2">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">سقف روزانه</Label>
                      <span className="text-sm font-mono text-gold tabular-nums">
                        {formatToman(dailyLimit)}
                      </span>
                    </div>
                    <Slider
                      value={[dailyLimit]}
                      onValueChange={([v]) => setDailyLimit(v)}
                      min={1_000_000}
                      max={50_000_000}
                      step={500_000}
                      className="[&_[data-slot=slider-range]]:bg-gold [&_[data-slot=slider-thumb]]:border-gold"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>۱ میلیون</span>
                      <span>۵۰ میلیون</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">سقف ماهانه</Label>
                      <span className="text-sm font-mono text-gold tabular-nums">
                        {formatToman(monthlyLimit)}
                      </span>
                    </div>
                    <Slider
                      value={[monthlyLimit]}
                      onValueChange={([v]) => setMonthlyLimit(v)}
                      min={10_000_000}
                      max={500_000_000}
                      step={5_000_000}
                      className="[&_[data-slot=slider-range]]:bg-gold [&_[data-slot=slider-thumb]]:border-gold"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>۱۰ میلیون</span>
                      <span>۵۰۰ میلیون</span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setLimitsOpen(false)} className="rounded-xl">
                    انصراف
                  </Button>
                  <Button
                    className="bg-gold hover:bg-gold-dark text-gold-dark hover:text-white rounded-xl"
                    onClick={handleLimitsSave}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'در حال ذخیره...' : 'ذخیره'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Balance Section */}
          <div className="space-y-3">
            {/* Main balance */}
            <Card className="border-border/40 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">موجودی کارت</p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      isFrozen
                        ? 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                        : 'border-green-500/30 text-green-400 bg-green-500/10'
                    }`}
                  >
                    {isFrozen ? '❄️ مسدود' : '✅ فعال'}
                  </Badge>
                </div>
                <p className="text-3xl font-bold gold-gradient-text tabular-nums">
                  {formatToman(card.balance)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">واحد طلایی</p>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/20">
                    <p className="text-[10px] text-muted-foreground mb-1">طلای مرتبط</p>
                    <p className="text-base font-bold text-gold tabular-nums">
                      {card.linkedGoldGrams.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">گرم</span>
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/20">
                    <p className="text-[10px] text-muted-foreground mb-1">ارزش طلای مرتبط</p>
                    <p className="text-base font-bold tabular-nums">
                      {formatToman(card.linkedGoldGrams * goldPrice)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">واحد طلایی</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily limit */}
            <Card className="border-border/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-gold/10 flex items-center justify-center">
                      <Gauge className="size-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">خرید روزانه</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatToman(card.dailySpent)} از {formatToman(card.dailyLimit)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gold tabular-nums">
                    {toPersianDigits(`${Math.round(dailyPercent)}%`)}
                  </span>
                </div>
                <Progress
                  value={dailyPercent}
                  className="h-2 [&_[data-slot=progress-indicator]]:bg-gold"
                />
              </CardContent>
            </Card>

            {/* Monthly limit */}
            <Card className="border-border/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-gold/10 flex items-center justify-center">
                      <Gauge className="size-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">خرید ماهانه</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatToman(card.monthlySpent)} از {formatToman(card.monthlyLimit)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gold tabular-nums">
                    {toPersianDigits(`${Math.round(monthlyPercent)}%`)}
                  </span>
                </div>
                <Progress
                  value={monthlyPercent}
                  className="h-2 [&_[data-slot=progress-indicator]]:bg-gold"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*  TAB 2 — Transactions                                  */}
        {/* ═══════════════════════════════════════════════════════ */}
        <TabsContent value="transactions" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { key: 'all', label: 'همه' },
              { key: 'purchase', label: 'خرید' },
              { key: 'refund', label: 'بازگشت وجه' },
              { key: 'charge', label: 'شارژ' },
              { key: 'withdrawal', label: 'برداشت' },
              { key: 'transfer_out', label: 'انتقال وجه' },
            ].map((f) => (
              <Button
                key={f.key}
                variant={txFilter === f.key ? 'default' : 'outline'}
                size="sm"
                className={`rounded-lg text-xs shrink-0 transition-all duration-200 ${
                  txFilter === f.key
                    ? 'bg-gold hover:bg-gold-dark text-gold-dark hover:text-white'
                    : 'border-border/50 hover:border-gold/40 hover:text-gold'
                }`}
                onClick={() => setTxFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {/* Transaction list */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {txLoading ? (
              <div className="flex justify-center py-8">
                <Skeleton className="h-8 w-64" />
              </div>
            ) : filteredTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <ShoppingCart className="size-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">تراکنشی یافت نشد</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  با انجام اولین خرید، تراکنش‌های شما اینجا نمایش داده می‌شود
                </p>
              </div>
            ) : (
              filteredTx.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/40 hover:border-gold/20 transition-all duration-200 group cursor-default"
                >
                  <div className="size-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0 group-hover:bg-gold/10 transition-colors">
                    {getTxIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{tx.merchant}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        {getRelativeTime(tx.createdAt)}
                      </span>
                      {tx.goldGrams && (
                        <span className="text-[10px] text-gold">
                          {tx.goldGrams} گرم
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        tx.type === 'purchase' || tx.type === 'withdrawal' || tx.type === 'transfer_out'
                          ? 'text-red-400'
                          : 'text-green-400'
                      }`}
                    >
                      {tx.type === 'purchase' || tx.type === 'withdrawal' || tx.type === 'transfer_out' ? '-' : '+'}
                      {formatToman(tx.amount)}
                    </span>
                    {getStatusBadge(tx.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*  TAB 3 — Card-to-Card Transfer                          */}
        {/* ═══════════════════════════════════════════════════════ */}
        <TabsContent value="transfer" className="space-y-4 mt-4">
          {/* Gold Price Banner */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-l from-amber-500/10 via-gold/5 to-amber-500/10 border border-gold/20">
            <Coins className="size-4 text-gold shrink-0" />
            <div className="flex-1 flex justify-between items-center text-xs">
              <span className="text-muted-foreground">قیمت لحظه‌ای طلا:</span>
              <span className="font-mono text-gold font-bold">{formatToman(goldPrice)} واحد طلایی/گرم</span>
            </div>
          </div>

          {isFrozen ? (
            <Card className="border-orange-500/30 bg-orange-500/5">
              <CardContent className="flex flex-col items-center gap-3 py-8">
                <Snowflake className="size-12 text-orange-400 animate-pulse" />
                <p className="text-sm text-orange-300 font-medium">کارت مسدود است</p>
                <p className="text-xs text-muted-foreground">برای انتقال طلا، ابتدا کارت را فعال کنید</p>
              </CardContent>
            </Card>
          ) : transferStep === 'success' ? (
            /* Success State */
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="flex flex-col items-center gap-4 py-8">
                <div className="size-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="size-8 text-green-400" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-lg font-bold text-green-400">انتقال طلا موفق! 🥇</p>
                  <p className="text-sm">
                    <span className="text-gold font-bold text-lg">
                      {toPersianDigits((transferResult?.transaction as Record<string, unknown>)?.netGoldGrams?.toFixed(4) as string || '0')}
                    </span>
                    {' '}گرم طلا
                  </p>
                  <p className="text-xs text-muted-foreground">
                    معادل{' '}
                    <span className="font-mono text-gold">
                      {formatToman((transferResult?.transaction as Record<string, unknown>)?.fiatEquivalent as number || 0)}
                    </span>
                    {' '}به کارت {(transferResult?.transaction as Record<string, unknown>)?.toCard}
                  </p>
                  {(transferResult?.transaction as Record<string, unknown>)?.isInternalTransfer && (
                    <Badge className="bg-green-500/15 text-green-400 border-green-500/20 text-[10px] mt-1">
                      <CheckCircle className="size-3" />
                      انتقال داخلی زرین گلد
                    </Badge>
                  )}
                </div>
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-xs p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">مانده کارت (طلایی):</span>
                    <span className="font-mono text-gold">
                      {toPersianDigits((card.linkedGoldGrams || 0).toFixed(4))} گرم
                    </span>
                  </div>
                  <div className="flex justify-between text-xs p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">مانده کارت:</span>
                    <span className="font-mono text-gold">{formatToman(card.balance)}</span>
                  </div>
                  <div className="flex justify-between text-xs p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">شماره پیگیری:</span>
                    <span className="font-mono">{String((transferResult?.transaction as Record<string, unknown>)?.id || '').slice(0, 8)}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={resetTransfer}>
                    <CreditCard className="size-3.5" />
                    انتقال جدید
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : transferStep === 'confirm' ? (
            /* Confirm State */
            <Card className="border-gold/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="size-4 text-gold" />
                  تأیید انتقال طلا
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-muted/50">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <CreditCard className="size-3.5" />
                      از کارت:
                    </span>
                    <span className="text-xs font-mono">{card.cardNumber.slice(0, 10)}XXXX</span>
                  </div>
                  <div className="flex justify-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <ArrowDown className="size-5 text-gold rotate-180" />
                      <span className="text-[10px] text-gold font-bold">{toPersianDigits(parsedGoldGrams.toFixed(4))} گرم طلا</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-muted/50">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <CreditCard className="size-3.5" />
                      به کارت:
                    </span>
                    <span className="text-xs font-mono">{transferToCard}</span>
                  </div>
                </div>
                <Separator />
                {/* Gold amounts - primary display */}
                <div className="p-3 rounded-xl bg-gradient-to-l from-amber-500/10 via-gold/5 to-transparent space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">مقدار طلا:</span>
                    <span className="font-mono text-gold font-bold">{toPersianDigits(parsedGoldGrams.toFixed(4))} گرم</span>
                  </div>
                  {transferFeeGoldMg > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">کارمزد طلا (۰.۱٪):</span>
                      <span className="font-mono text-red-400">{toPersianDigits(transferFeeGoldMg.toFixed(4))} گرم</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-sm font-bold">
                    <span>مجموع طلا کسر شده:</span>
                    <span className="text-gold font-mono">{toPersianDigits(totalGoldGrams.toFixed(4))} گرم</span>
                  </div>
                </div>
                {/* Fiat equivalent - secondary display */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>معادل واحد طلایی:</span>
                    <span className="font-mono">{formatToman(fiatEquivalent)}</span>
                  </div>
                  {transferFeeGoldMg > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>کارمزد:</span>
                      <span className="font-mono">{formatToman(transferFeeFiat)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>مجموع:</span>
                    <span className="font-mono">{formatToman(totalTransferFiat)}</span>
                  </div>
                </div>
                {transferDesc && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">توضیحات:</span>
                    <span>{transferDesc}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 rounded-xl p-3">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>انتقال طلا غیرقابل بازگشت است. مطمئن باشید؟</span>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setTransferStep('form')}>
                    بازگشت
                  </Button>
                  <Button
                    className="flex-1 bg-gold hover:bg-gold-dark text-gold-dark hover:text-white rounded-xl font-bold"
                    onClick={handleTransfer}
                    disabled={transferLoading}
                  >
                    {transferLoading ? 'در حال انتقال طلا...' : 'تأیید و انتقال طلا'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Form State */
            <>
              {/* Quick gold amount buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { grams: 0.01, label: '۱۰mg' },
                  { grams: 0.1, label: '۱۰۰mg' },
                  { grams: 0.5, label: 'نیم گرم' },
                  { grams: 1, label: '۱ گرم' },
                ].map((item) => (
                  <button
                    key={item.grams}
                    onClick={() => setTransferGoldGrams(String(item.grams))}
                    className={`p-2.5 rounded-xl text-xs font-medium border transition-all ${
                      parseFloat(transferGoldGrams) === item.grams
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border/40 hover:border-gold/30 text-muted-foreground hover:text-gold'
                    }`}
                  >
                    <div className="font-bold">{item.label}</div>
                    <div className="text-[10px] opacity-70 mt-0.5 font-mono">
                      {formatToman(item.grams * goldPrice)}
                    </div>
                  </button>
                ))}
              </div>

              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ArrowLeftRight className="size-4 text-gold" />
                    انتقال طلا — کارت به کارت
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* To Card Number */}
                  <div className="space-y-2">
                    <Label className="text-sm">شماره کارت مقصد</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        value={transferToCard}
                        onChange={(e) => setTransferToCard(formatCardInput(e.target.value))}
                        className="font-mono text-left tracking-wider pr-12"
                        maxLength={19}
                        dir="ltr"
                      />
                      <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Gold Amount */}
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <Coins className="size-3.5 text-gold" />
                      مقدار طلا (گرم)
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.001"
                        min="0.001"
                        placeholder="مثلاً ۰.۵"
                        value={transferGoldGrams}
                        onChange={(e) => setTransferGoldGrams(e.target.value)}
                        className="font-mono text-left pr-20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">گرم طلا 🥇</span>
                    </div>
                    {parsedGoldGrams > 0 && (
                      <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">معادل واحد طلایی:</span>
                          <span className="font-mono text-gold font-bold">{formatToman(fiatEquivalent)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>قیمت هر گرم:</span>
                          <span className="font-mono">{formatToman(goldPrice)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description (optional) */}
                  <div className="space-y-2">
                    <Label className="text-sm">توضیحات <span className="text-muted-foreground">(اختیاری)</span></Label>
                    <Input
                      placeholder="مثلاً: قسط وام، خرید کالا..."
                      value={transferDesc}
                      onChange={(e) => setTransferDesc(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  {/* PIN */}
                  <div className="space-y-2">
                    <Label className="text-sm">رمز کارت (PIN)</Label>
                    <Input
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={transferPin}
                      onChange={(e) => setTransferPin(e.target.value.replace(/\D/g, ''))}
                      className="font-mono text-center text-lg tracking-[0.3em]"
                    />
                  </div>

                  {/* Gold Summary */}
                  {parsedGoldGrams >= 0.001 && (
                    <div className="p-3 rounded-xl bg-muted/50 border border-border/30 space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">موجودی کارت (طلایی):</span>
                        <span className="font-mono text-gold">
                          {toPersianDigits((card.linkedGoldGrams || 0).toFixed(4))} گرم
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>موجودی کارت:</span>
                        <span className="font-mono">{formatToman(card.balance)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">کارمزد طلا:</span>
                        <span className="font-mono text-green-400">
                          {user?.role === 'super_admin' ? 'رایگان 💎' : `${toPersianDigits(transferFeeGoldMg.toFixed(4))} گرم`}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm font-bold">
                        <span>مجموع کسر طلا:</span>
                        <span className="text-gold font-mono">{toPersianDigits(totalGoldGrams.toFixed(4))} گرم</span>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full bg-gold hover:bg-gold-dark text-gold-dark hover:text-white rounded-xl font-bold py-6 text-base btn-gold-shine"
                    onClick={() => setTransferStep('confirm')}
                    disabled={
                      !transferToCard.replace(/-/g, '') ||
                      !transferGoldGrams ||
                      parseFloat(transferGoldGrams) < 0.001 ||
                      !transferPin ||
                      totalTransferFiat > card.balance
                    }
                  >
                    <Send className="size-4 ml-2" />
                    ادامه انتقال طلا
                  </Button>
                </CardContent>
              </Card>

              {/* Info cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-card border border-border/30 space-y-2">
                  <Coins className="size-4 text-gold" />
                  <p className="text-xs font-medium">انتقال بر اساس طلا</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">مقدار انتقال بر حسب گرم طلای خالص محاسبه می‌شود</p>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/30 space-y-2">
                  <ShieldCheck className="size-4 text-gold" />
                  <p className="text-xs font-medium">امنیت بالا</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">رمزنگاری AES-256 برای تمام انتقال‌ها</p>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/30 space-y-2">
                  <Clock className="size-4 text-gold" />
                  <p className="text-xs font-medium">انتقال آنی</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">کارت به کارت زرین گلد در کمتر از ۱۰ ثانیه</p>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/30 space-y-2">
                  <BookUser className="size-4 text-gold" />
                  <p className="text-xs font-medium">کارمزد طلایی</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {user?.role === 'super_admin' ? 'الماس 💎 — بدون کارمزد' : 'کارمزد ۰.۱٪ طلای انتقالی'}
                  </p>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*  TAB 4 — Settings                                     */}
        {/* ═══════════════════════════════════════════════════════ */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          {/* Card Details Summary */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="size-4 text-gold" />
                اطلاعات کارت
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { label: 'شماره کارت', value: card.cardNumber },
                { label: 'نوع کارت', value: card.type === 'VIRTUAL' ? '🥇 مجازی' : '💳 فیزیکی' },
                { label: 'وضعیت', value: isFrozen ? '❄️ مسدود' : '✅ فعال' },
                { label: 'تاریخ صدور', value: toPersianDigits(new Date(card.createdAt).toLocaleDateString('fa-IR')) },
                { label: 'طراحی', value: CARD_DESIGNS[card.design].label },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-1.5">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-xs font-medium">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Design Picker inline */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Palette className="size-4 text-gold" />
                طراحی کارت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2.5">
                {(Object.keys(CARD_DESIGNS) as Array<keyof typeof CARD_DESIGNS>).map((key) => (
                  <div key={key} className="space-y-1.5">
                    <MiniCardPreview
                      design={key}
                      selected={card.design === key}
                      onSelect={() => {
                        handleDesignChange(key);
                      }}
                    />
                    <p className="text-[10px] text-center text-muted-foreground">
                      {CARD_DESIGNS[key].label}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* PIN Change Inline */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lock className="size-4 text-gold" />
                تغییر رمز کارت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full rounded-xl border-border/50 hover:border-gold/40 hover:text-gold text-sm"
                onClick={() => setPinOpen(true)}
              >
                <Lock className="size-4 ml-2" />
                تغییر رمز عبور
              </Button>
            </CardContent>
          </Card>

          {/* Limit Adjustment */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Gauge className="size-4 text-gold" />
                سقف تراکنش
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">سقف روزانه</span>
                  <span className="text-xs font-mono text-gold tabular-nums">
                    {formatToman(dailyLimit)}
                  </span>
                </div>
                <Slider
                  value={[dailyLimit]}
                  onValueChange={([v]) => setDailyLimit(v)}
                  min={1_000_000}
                  max={50_000_000}
                  step={500_000}
                  className="[&_[data-slot=slider-range]]:bg-gold [&_[data-slot=slider-thumb]]:border-gold"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">سقف ماهانه</span>
                  <span className="text-xs font-mono text-gold tabular-nums">
                    {formatToman(monthlyLimit)}
                  </span>
                </div>
                <Slider
                  value={[monthlyLimit]}
                  onValueChange={([v]) => setMonthlyLimit(v)}
                  min={10_000_000}
                  max={500_000_000}
                  step={5_000_000}
                  className="[&_[data-slot=slider-range]]:bg-gold [&_[data-slot=slider-thumb]]:border-gold"
                />
              </div>
              <Button
                className="w-full bg-gold hover:bg-gold-dark text-gold-dark hover:text-white rounded-xl text-sm"
                onClick={handleLimitsSave}
                disabled={actionLoading}
              >
                {actionLoading ? 'در حال ذخیره...' : 'ذخیره سقف‌ها'}
              </Button>
            </CardContent>
          </Card>

          {/* Card Status */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShieldCheck className="size-4 text-gold" />
                وضعیت کارت
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                <div className="flex items-center gap-2">
                  {isFrozen ? (
                    <Snowflake className="size-4 text-blue-400" />
                  ) : (
                    <CheckCircle className="size-4 text-green-400" />
                  )}
                  <span className="text-sm">
                    {isFrozen ? 'کارت مسدود است' : 'کارت فعال است'}
                  </span>
                </div>
                <Switch
                  checked={!isFrozen}
                  onCheckedChange={handleToggleFreeze}
                  disabled={actionLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Request Physical Card */}
          <Card className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-gold/10 flex items-center justify-center">
                    <CreditCard className="size-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">درخواست کارت فیزیکی</p>
                    <p className="text-[10px] text-muted-foreground">به زودی فعال می‌شود</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  به زودی
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Close Card */}
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="size-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">بستن / حذف کارت</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    با بستن کارت، موجودی به کیف طلای شما برگردانده می‌شود. این عمل قابل بازگشت نیست.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded-xl text-xs shrink-0"
                    >
                      بستن کارت
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                      <AlertDialogDescription>
                        با بستن کارت طلایی، تمام موجودی ({formatToman(card.balance)}) به کیف
                        طلای شما برگردانده می‌شود. این عمل غیرقابل بازگشت است.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCloseCard}
                        className="bg-destructive hover:bg-destructive/90 rounded-xl"
                      >
                        بله، بستن کارت
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

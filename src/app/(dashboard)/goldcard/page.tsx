'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { cn, formatToman, formatGrams } from '@/lib/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Eye,
  EyeOff,
  Plus,
  CheckCircle,
  XCircle,
  Sparkles,
  ShieldCheck,
  Download,
  QrCode,
  Send,
  Copy,
  TrendingUp,
  Zap,
  ArrowDownUp,
  MapPin,
  Truck,
  Package,
  Clock,
  CircleDollarSign,
  Banknote,
  Box,
  Gem,
  Crown,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                        */
/* ═══════════════════════════════════════════════════════════════ */

type CardDesign = 'gold-gradient' | 'black-premium' | 'diamond' | 'rose-gold';

interface GoldCardData {
  cardNumber: string;
  cvv: string;
  expiryMonth: number;
  expiryYear: number;
  pin: string;
  design: CardDesign;
  status: 'active' | 'frozen' | 'blocked';
  balanceFiat: number;
  linkedGoldGram: number;
  dailyLimit: number;
  monthlyLimit: number;
  spentToday: number;
  spentThisMonth: number;
  cardType: 'virtual' | 'physical';
}

interface CardTransaction {
  id: string;
  type: 'purchase' | 'refund' | 'charge' | 'withdrawal' | 'transfer';
  amount: number;
  goldGrams?: number;
  description: string;
  merchant: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Design Configs                                               */
/* ═══════════════════════════════════════════════════════════════ */

const DESIGNS: Record<CardDesign, { label: string; bg: string; text: string; sub: string; border: string }> = {
  'gold-gradient': { label: 'طلایی کلاسیک', bg: 'linear-gradient(135deg, #8B6914, #DAA520, #FFD700, #FFF4B0, #FFD700, #DAA520, #8B6914)', text: 'text-[#1a0f00]', sub: 'text-[#4a3000]/85', border: '' },
  'black-premium': { label: 'مشکی پریمیوم', bg: 'linear-gradient(145deg, #0a0a1a, #1a1a3e, #0a1628)', text: 'text-white', sub: 'text-gray-400', border: 'border-[#D4AF37]/30' },
  'diamond': { label: 'الماسی', bg: 'linear-gradient(135deg, #c9b037, #fffde7, #c9b037)', text: 'text-[#1a0f00]', sub: 'text-[#4a3000]/85', border: '' },
  'rose-gold': { label: 'رزگلد', bg: 'linear-gradient(135deg, #8B5A5A, #E8B4B8, #F4D6CC, #DAA06D)', text: 'text-[#2a1018]', sub: 'text-[#4a2030]/80', border: '' },
};

/* ═══════════════════════════════════════════════════════════════ */
/*  Mock Data                                                    */
/* ═══════════════════════════════════════════════════════════════ */

const MOCK_CARD: GoldCardData = {
  cardNumber: '6219-3456-7843-4332',
  cvv: '742',
  expiryMonth: 3,
  expiryYear: 2028,
  pin: '1234',
  design: 'gold-gradient',
  status: 'active',
  balanceFiat: 25_750_000,
  linkedGoldGram: 0.73,
  dailyLimit: 50_000_000,
  monthlyLimit: 500_000_000,
  spentToday: 8_250_000,
  spentThisMonth: 125_000_000,
  cardType: 'virtual',
};

const MOCK_TRANSACTIONS: CardTransaction[] = [
  { id: 'tx1', type: 'purchase', amount: 1250000, description: 'خرید از فروشگاه', merchant: 'دیجی‌کالا', status: 'completed', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'tx2', type: 'charge', amount: 15000000, goldGrams: 0.43, description: 'شارژ از کیف پول طلایی', merchant: 'زرین گلد', status: 'completed', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'tx3', type: 'purchase', amount: 3500000, description: 'خرید لباس', merchant: 'بامیلو', status: 'completed', createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'tx4', type: 'refund', amount: 890000, description: 'برگشت وجه', merchant: 'اسنپ‌فود', status: 'completed', createdAt: new Date(Date.now() - 259200000).toISOString() },
  { id: 'tx5', type: 'purchase', amount: 2100000, description: 'شارژ سیم‌کارت', merchant: 'ایرانسل', status: 'pending', createdAt: new Date(Date.now() - 432000000).toISOString() },
  { id: 'tx6', type: 'charge', amount: 5000000, goldGrams: 0.14, description: 'شارژ از طلا', merchant: 'زرین گلد', status: 'completed', createdAt: new Date(Date.now() - 604800000).toISOString() },
  { id: 'tx7', type: 'purchase', amount: 4500000, description: 'خرید کتاب', merchant: 'فیدیبو', status: 'completed', createdAt: new Date(Date.now() - 864000000).toISOString() },
  { id: 'tx8', type: 'withdrawal', amount: 2000000, description: 'برداشت به حساب', merchant: 'بانک ملت', status: 'completed', createdAt: new Date(Date.now() - 1209600000).toISOString() },
];

const SHIPPING_METHODS = [
  { key: 'express', label: 'اکسپرس (۱-۳ روز)', price: 150000, icon: <Zap className="size-4 text-amber-500" /> },
  { key: 'post', label: 'پست پیشتاز (۳-۵ روز)', price: 75000, icon: <Package className="size-4 text-blue-400" /> },
  { key: 'office', label: 'دریافت از شعبه (رایگان)', price: 0, icon: <MapPin className="size-4 text-emerald-400" /> },
];

/* ═══════════════════════════════════════════════════════════════ */
/*  VirtualCard Component                                        */
/* ═══════════════════════════════════════════════════════════════ */

function VirtualCard({ card, userName, showNumber, showCvv, onToggleNumber, onToggleCvv }: {
  card: GoldCardData; userName: string; showNumber: boolean; showCvv: boolean; onToggleNumber: () => void; onToggleCvv: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const design = DESIGNS[card.design];

  const masked = `${card.cardNumber.slice(0, 4)}-XXXX-XX${card.cardNumber.slice(-4, -2)}-${card.cardNumber.slice(-2)}`;
  const expiry = `${card.expiryMonth < 10 ? '0' : ''}${card.expiryMonth}/${String(card.expiryYear).slice(-2)}`;

  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[380px] mx-auto" onClick={() => setFlipped(!flipped)}>
      {/* Card container */}
      <div className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden cursor-pointer select-none"
        style={{ background: design.bg, boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 40px rgba(212,175,55,0.15)' }}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(30deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 12px), repeating-linear-gradient(150deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 12px)' }} />

        {/* Holographic shimmer */}
        <div className="absolute inset-0 animate-pulse opacity-20" style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.3) 45%, rgba(212,175,55,0.2) 55%, transparent 70%)', backgroundSize: '200% 100%', animation: 'pulse 3s ease-in-out infinite' }} />

        {/* Frozen overlay */}
        {card.status === 'frozen' && (
          <div className="absolute inset-0 bg-blue-900/40 flex items-center justify-center z-10 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-2">
              <Snowflake className="size-10 text-blue-200 animate-pulse" />
              <span className="text-white font-bold text-base">کارت مسدود است</span>
            </div>
          </div>
        )}

        {/* Front content */}
        <div className="relative z-[5] flex flex-col justify-between h-full p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-[10px] font-black tracking-[0.2em] uppercase ${design.sub}`}>ZARRIN GOLD</p>
              <p className={`text-base font-black ${design.text}`}>زرین گلد</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <svg className="size-5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8.5 16.5a5 5 0 0 1 0-9" /><path d="M5 19a9 9 0 0 1 0-14" /><path d="M12 14a2 2 0 0 1 0-4" /></svg>
              <Badge variant="outline" className={`text-[7px] px-1.5 py-0 font-bold ${design.border || 'border-white/30'} ${design.sub}`}>{card.cardType === 'virtual' ? 'VIRTUAL' : 'PHYSICAL'}</Badge>
            </div>
          </div>

          {/* EMV Chip + Number */}
          <div className="flex items-center gap-4 mt-1">
            <div className="w-10 h-7 rounded-md flex-shrink-0" style={{ background: 'linear-gradient(135deg, #d4af37, #f0d060, #d4af37, #b8960b)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }} />
            <div className="cursor-pointer flex-1 text-center" onClick={e => { e.stopPropagation(); onToggleNumber(); }}>
              <p className={`text-base sm:text-lg font-mono tracking-[0.15em] ${design.text} font-black`}>{showNumber ? card.cardNumber : masked}</p>
              <p className="flex items-center justify-center gap-1 mt-0.5">
                {showNumber ? <EyeOff className={`size-2.5 ${design.sub}`} /> : <Eye className={`size-2.5 ${design.sub}`} />}
                <span className={`text-[7px] ${design.sub} opacity-60`}>کلیک کنید</span>
              </p>
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex items-end justify-between">
            <div className="cursor-pointer" onClick={e => { e.stopPropagation(); onToggleCvv(); }}>
              <p className={`text-[7px] font-bold tracking-wider uppercase ${design.sub} opacity-60`}>CVV2</p>
              <p className={`text-sm font-mono ${design.text} font-black tracking-[0.2em]`}>{showCvv ? card.cvv : '•••'}</p>
            </div>
            <div className="text-center">
              <p className={`text-[7px] font-bold tracking-wider uppercase ${design.sub} opacity-60`}>EXPIRY</p>
              <p className={`text-sm font-mono ${design.text} font-black tracking-[0.15em]`}>{expiry}</p>
            </div>
            <div className="text-right">
              <p className={`text-[7px] font-bold tracking-wider uppercase ${design.sub} opacity-60`}>CARD HOLDER</p>
              <p className={`text-[10px] font-black ${design.text} max-w-[100px] truncate`}>{userName || 'ZARRIN GOLD'}</p>
            </div>
            <svg width="32" height="10" viewBox="0 0 32 10" className="opacity-80"><text x="0" y="9" fill={card.design === 'black-premium' ? '#D4AF37' : '#1a1f71'} fontFamily="Arial" fontStyle="italic" fontWeight="900" fontSize="12" letterSpacing="1">VISA</text></svg>
          </div>
        </div>
      </div>
      <p className="text-center text-[9px] text-muted-foreground/40 mt-2">برای مشاهده پشت کارت کلیک کنید</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  QR Code SVG                                                  */
/* ═══════════════════════════════════════════════════════════════ */

function QRCodeDisplay() {
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140" className="rounded-xl bg-white p-2">
        {/* Simplified QR pattern */}
        <rect x="10" y="10" width="30" height="30" rx="4" fill="#1a1a1a" />
        <rect x="14" y="14" width="22" height="22" rx="2" fill="white" />
        <rect x="18" y="18" width="14" height="14" rx="1" fill="#1a1a1a" />
        <rect x="100" y="10" width="30" height="30" rx="4" fill="#1a1a1a" />
        <rect x="104" y="14" width="22" height="22" rx="2" fill="white" />
        <rect x="108" y="18" width="14" height="14" rx="1" fill="#1a1a1a" />
        <rect x="10" y="100" width="30" height="30" rx="4" fill="#1a1a1a" />
        <rect x="14" y="104" width="22" height="22" rx="2" fill="white" />
        <rect x="18" y="108" width="14" height="14" rx="1" fill="#1a1a1a" />
        {/* Random data blocks */}
        {[48,58,48,58,48,58,66,76,86,96,48,66,76,86,48,58,66,76,86,96,86,96,106,116,48,58,66,76,86,96,106,86,96,106,116,48,58,66,76,86,96,106,116,86,96].map((x, i) => (
          <rect key={i} x={x} y={10 + Math.floor(i / 6) * 12} width="6" height="6" rx="1" fill="#1a1a1a" opacity="0.7" />
        ))}
      </svg>
      <p className="text-[10px] text-muted-foreground">اسکن برای پرداخت</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Page                                                    */
/* ═══════════════════════════════════════════════════════════════ */

export default function GoldCardPage() {
  const { user, goldPrice, addToast } = useAppStore();
  const [card, setCard] = useState<GoldCardData>(MOCK_CARD);
  const [transactions, setTransactions] = useState<CardTransaction[]>(MOCK_TRANSACTIONS);
  const [loading, setLoading] = useState(true);
  const [showNumber, setShowNumber] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [designDialog, setDesignDialog] = useState(false);
  const [physicalDialog, setPhysicalDialog] = useState(false);
  const [chargeDialog, setChargeDialog] = useState(false);
  const [chargeGrams, setChargeGrams] = useState('');
  const [limitDialog, setLimitDialog] = useState(false);
  const [newDailyLimit, setNewDailyLimit] = useState(String(card.dailyLimit));
  const [newMonthlyLimit, setNewMonthlyLimit] = useState(String(card.monthlyLimit));
  const [physicalName, setPhysicalName] = useState(user?.fullName || '');
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [physicalPostal, setPhysicalPostal] = useState('');
  const [physicalShipping, setPhysicalShipping] = useState('express');
  const [txFilter, setTxFilter] = useState<'all' | 'purchase' | 'charge' | 'refund'>('all');
  const goldPricePerGram = goldPrice?.buyPrice ?? 35_200_000;

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  const goldValue = card.linkedGoldGram * goldPricePerGram;
  const dailyPct = Math.min((card.spentToday / card.dailyLimit) * 100, 100);
  const monthlyPct = Math.min((card.spentThisMonth / card.monthlyLimit) * 100, 100);

  const handleFreeze = () => {
    const newStatus = card.status === 'frozen' ? 'active' : 'frozen';
    setCard(prev => ({ ...prev, status: newStatus }));
    addToast(newStatus === 'frozen' ? 'کارت مسدود شد ❄️' : 'کارت فعال شد ✅', 'info');
  };

  const handleChangeDesign = (design: CardDesign) => {
    setCard(prev => ({ ...prev, design }));
    setDesignDialog(false);
    addToast('طرح کارت تغییر کرد ✅', 'success');
  };

  const handleCharge = () => {
    const grams = Number(chargeGrams);
    if (!grams || grams <= 0) { addToast('مقدار طلای نامعتبر', 'error'); return; }
    const fiat = grams * goldPricePerGram;
    setCard(prev => ({ ...prev, balanceFiat: prev.balanceFiat + fiat, linkedGoldGram: prev.linkedGoldGram + grams }));
    setTransactions(prev => [{ id: `tx-${Date.now()}`, type: 'charge', amount: fiat, goldGrams: grams, description: `شارژ ${grams} گرم طلا`, merchant: 'زرین گلد', status: 'completed', createdAt: new Date().toISOString() }, ...prev]);
    setChargeDialog(false);
    setChargeGrams('');
    addToast(`${formatGrams(grams)} طلا به کارت شارژ شد ✅`, 'success');
  };

  const handleSaveLimits = () => {
    setCard(prev => ({ ...prev, dailyLimit: Number(newDailyLimit) || prev.dailyLimit, monthlyLimit: Number(newMonthlyLimit) || prev.monthlyLimit }));
    setLimitDialog(false);
    addToast('سقف تراکنش‌ها ذخیره شد ✅', 'success');
  };

  const handleRequestPhysical = () => {
    if (!physicalName || !physicalAddress) { addToast('اطلاعات ناقص', 'error'); return; }
    setPhysicalDialog(false);
    setCard(prev => ({ ...prev, cardType: 'physical' }));
    addToast('درخواست کارت فیزیکی ثبت شد 📦', 'success');
  };

  const filteredTx = txFilter === 'all' ? transactions : transactions.filter(t => t.type === txFilter);
  const getTxIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <ShoppingCart className="size-3.5 text-red-400" />;
      case 'refund': return <RotateCcw className="size-3.5 text-emerald-400" />;
      case 'charge': return <Coins className="size-3.5 text-yellow-400" />;
      case 'withdrawal': return <ArrowDownUp className="size-3.5 text-orange-400" />;
      default: return <Send className="size-3.5 text-blue-400" />;
    }
  };
  const getTxLabel = (type: string) => ({ purchase: 'خرید', refund: 'برگشت', charge: 'شارژ', withdrawal: 'برداشت', transfer: 'انتقال' }[type] || type);

  if (loading) {
    return <div className="space-y-4 p-4">{[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#D4AF37]/10">
          <CreditCard className="size-5 text-[#D4AF37]" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold">کارت طلایی فیزیکی</h1>
          <p className="text-xs text-muted-foreground">مدیریت کارت، تراکنش‌ها و تنظیمات</p>
        </div>
        <Badge className={cn('text-[10px]', card.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20')}>
          {card.status === 'active' ? <CheckCircle className="size-3 me-1" /> : <Snowflake className="size-3 me-1" />}
          {card.status === 'active' ? 'فعال' : 'مسدود'}
        </Badge>
      </div>

      {/* Card Display */}
      <VirtualCard card={card} userName={user?.fullName || ''} showNumber={showNumber} showCvv={showCvv} onToggleNumber={() => setShowNumber(!showNumber)} onToggleCvv={() => setShowCvv(!showCvv)} />

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: <Coins className="size-4 text-yellow-500" />, label: 'شارژ', action: () => setChargeDialog(true) },
          { icon: card.status === 'frozen' ? <Flame className="size-4 text-orange-500" /> : <Snowflake className="size-4 text-blue-400" />, label: card.status === 'frozen' ? 'فعال‌سازی' : 'مسدود', action: handleFreeze },
          { icon: <Palette className="size-4 text-pink-400" />, label: 'طرح', action: () => setDesignDialog(true) },
          { icon: <Gauge className="size-4 text-cyan-400" />, label: 'سقف', action: () => setLimitDialog(true) },
          { icon: <QrCode className="size-4 text-purple-400" />, label: 'QR', action: () => {} },
          { icon: <Copy className="size-4 text-emerald-400" />, label: 'کپی شماره', action: () => { navigator.clipboard?.writeText(card.cardNumber); addToast('شماره کپی شد', 'success'); } },
          { icon: <Package className="size-4 text-amber-500" />, label: 'کارت فیزیکی', action: () => setPhysicalDialog(true) },
          { icon: <Download className="size-4 text-blue-400" />, label: 'مشخصات', action: () => setShowNumber(true) },
        ].map((action, i) => (
          <button key={i} onClick={action.action} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card border border-border/50 hover:border-[#D4AF37]/30 transition-all active:scale-95">
            {action.icon}
            <span className="text-[10px] text-muted-foreground font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/15">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><Banknote className="size-4 text-emerald-500" /><span className="text-[11px] text-muted-foreground">موجودی (تومان)</span></div>
            <p className="text-lg font-black tabular-nums">{formatToman(card.balanceFiat)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/5 to-transparent border-yellow-500/15">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><Coins className="size-4 text-yellow-500" /><span className="text-[11px] text-muted-foreground">طلای متصل</span></div>
            <p className="text-lg font-black tabular-nums">{formatGrams(card.linkedGoldGram)}</p>
            <p className="text-[9px] text-muted-foreground">≈ {formatToman(goldValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Limits */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">خرید روزانه</span><span className="text-xs font-medium tabular-nums">{formatToman(card.spentToday)} / {formatToman(card.dailyLimit)}</span></div>
          <Progress value={dailyPct} className="h-2" />
          <Separator />
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">خرید ماهانه</span><span className="text-xs font-medium tabular-nums">{formatToman(card.spentThisMonth)} / {formatToman(card.monthlyLimit)}</span></div>
          <Progress value={monthlyPct} className="h-2" />
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3"><QrCode className="size-4 text-[#D4AF37]" /><span className="text-sm font-bold">پرداخت با QR</span></div>
          <QRCodeDisplay />
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card className="bg-card border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2"><Clock className="size-4 text-[#D4AF37]" />تراکنش‌ها</CardTitle>
          <div className="flex gap-1">
            {(['all', 'purchase', 'charge', 'refund'] as const).map(f => (
              <button key={f} onClick={() => setTxFilter(f)} className={cn('px-2 py-1 rounded-md text-[9px] font-medium transition-all', txFilter === f ? 'bg-[#D4AF37] text-[#1a1a1a]' : 'bg-muted text-muted-foreground')}>
                {f === 'all' ? 'همه' : f === 'purchase' ? 'خرید' : f === 'charge' ? 'شارژ' : 'برگشت'}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 max-h-80 overflow-y-auto">
          {filteredTx.map(tx => (
            <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors">
              <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">{getTxIcon(tx.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="text-xs font-bold truncate">{tx.description}</span><Badge variant="outline" className="text-[7px] shrink-0">{tx.merchant}</Badge></div>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="size-2.5" />{getTimeAgo(tx.createdAt)}</p>
              </div>
              <div className="text-left shrink-0">
                <p className={cn('text-xs font-bold tabular-nums', tx.type === 'refund' || tx.type === 'charge' ? 'text-emerald-500' : 'text-red-400')}>
                  {tx.type === 'refund' || tx.type === 'charge' ? '+' : '-'}{formatToman(tx.amount)}
                </p>
                <Badge className={cn('text-[7px]', tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : tx.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500')}>
                  {tx.status === 'completed' ? 'موفق' : tx.status === 'pending' ? 'در انتظار' : 'ناموفق'}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Charge Dialog */}
      <Dialog open={chargeDialog} onOpenChange={setChargeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">شارژ کارت از طلای کیف پول</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">مقدار طلا (گرم)</Label>
              <Input type="number" value={chargeGrams} onChange={e => setChargeGrams(e.target.value)} placeholder="مثلاً: 0.5" dir="ltr" className="mt-1.5 tabular-nums" />
              <div className="flex gap-1.5 mt-2">
                {[0.1, 0.25, 0.5, 1].map(g => (
                  <button key={g} onClick={() => setChargeGrams(String(g))} className="flex-1 rounded-md border border-border px-2 py-1 text-[10px] hover:border-[#D4AF37]/40 transition-colors tabular-nums">{g}g</button>
                ))}
              </div>
            </div>
            {chargeGrams && Number(chargeGrams) > 0 && (
              <div className="p-3 rounded-xl bg-muted/30 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">معادل تومان</span><span className="font-bold tabular-nums">{formatToman(Number(chargeGrams) * goldPricePerGram)}</span></div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChargeDialog(false)} className="text-xs">انصراف</Button>
            <Button onClick={handleCharge} className="text-xs bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]">شارژ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Design Dialog */}
      <Dialog open={designDialog} onOpenChange={setDesignDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm flex items-center gap-2"><Palette className="size-4 text-[#D4AF37]" />انتخاب طرح کارت</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(DESIGNS) as [CardDesign, typeof DESIGNS[CardDesign]][]).map(([key, d]) => (
              <button key={key} onClick={() => handleChangeDesign(key)} className={cn('rounded-xl p-4 border-2 transition-all text-center', card.design === key ? 'border-[#D4AF37]' : 'border-border hover:border-[#D4AF37]/30')}>
                <div className="w-full h-16 rounded-lg mb-2" style={{ background: d.bg }} />
                <span className="text-xs font-medium">{d.label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Limit Dialog */}
      <Dialog open={limitDialog} onOpenChange={setLimitDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm flex items-center gap-2"><Gauge className="size-4 text-[#D4AF37]" />تنظیم سقف تراکنش</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">سقف روزانه (تومان)</Label>
              <Input type="number" value={newDailyLimit} onChange={e => setNewDailyLimit(e.target.value)} dir="ltr" className="mt-1.5 tabular-nums" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">سقف ماهانه (تومان)</Label>
              <Input type="number" value={newMonthlyLimit} onChange={e => setNewMonthlyLimit(e.target.value)} dir="ltr" className="mt-1.5 tabular-nums" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLimitDialog(false)} className="text-xs">انصراف</Button>
            <Button onClick={handleSaveLimits} className="text-xs bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]">ذخیره</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Physical Card Request Dialog */}
      <Dialog open={physicalDialog} onOpenChange={setPhysicalDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm flex items-center gap-2"><Package className="size-4 text-amber-500" />درخواست کارت فیزیکی</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs text-muted-foreground">نام گیرنده</Label><Input value={physicalName} onChange={e => setPhysicalName(e.target.value)} className="mt-1.5" /></div>
            <div><Label className="text-xs text-muted-foreground">آدرس پستی</Label><Input value={physicalAddress} onChange={e => setPhysicalAddress(e.target.value)} className="mt-1.5" placeholder="خیابان، کوچه، پلاک..." /></div>
            <div><Label className="text-xs text-muted-foreground">کد پستی</Label><Input value={physicalPostal} onChange={e => setPhysicalPostal(e.target.value)} dir="ltr" className="mt-1.5 tabular-nums" maxLength={10} /></div>
            <div>
              <Label className="text-xs text-muted-foreground">روش ارسال</Label>
              <div className="space-y-2 mt-2">
                {SHIPPING_METHODS.map(m => (
                  <button key={m.key} onClick={() => setPhysicalShipping(m.key)} className={cn('flex items-center gap-3 p-3 rounded-xl border w-full text-right transition-all', physicalShipping === m.key ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5' : 'border-border hover:border-[#D4AF37]/30')}>
                    {m.icon}
                    <span className="text-xs font-medium flex-1">{m.label}</span>
                    <span className="text-xs tabular-nums">{m.price === 0 ? 'رایگان' : formatToman(m.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhysicalDialog(false)} className="text-xs">انصراف</Button>
            <Button onClick={handleRequestPhysical} className="text-xs bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]">ثبت درخواست</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return 'همین الان';
  if (min < 60) return `${min} دقیقه پیش`;
  if (hr < 24) return `${hr} ساعت پیش`;
  return `${day} روز پیش`;
}

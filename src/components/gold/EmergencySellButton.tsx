'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  AlertTriangle,
  Coins,
  Loader2,
  ShieldAlert,
  Clock,
  X,
  Check,
  PartyPopper,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { formatGrams, formatToman, formatNumber, cn } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

type SellState = 'idle' | 'confirm' | 'pin' | 'countdown' | 'processing' | 'success' | 'error';

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
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const pulseButtonVariants = {
  idle: { scale: 1 },
  pulse: {
    scale: [1, 1.03, 1],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Confetti Particle                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function Confetti() {
  const particles = Array.from({ length: 30 });
  const colors = ['#D4AF37', '#F0D060', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((_, i) => {
        const color = colors[i % colors.length];
        const startX = 50 + (Math.random() - 0.5) * 40;
        const delay = Math.random() * 0.5;
        const duration = 1.5 + Math.random();
        const rotation = Math.random() * 720 - 360;

        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${startX}%`,
              top: '-5%',
              width: 6 + Math.random() * 6,
              height: 6 + Math.random() * 6,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              backgroundColor: color,
            }}
            initial={{ y: 0, opacity: 1, rotate: 0 }}
            animate={{
              y: window.innerHeight * 0.8 + Math.random() * 200,
              opacity: [1, 1, 0],
              rotate: rotation,
              x: (Math.random() - 0.5) * 200,
            }}
            transition={{
              duration,
              delay,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Countdown Circle                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CountdownCircle({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [count, setCount] = useState(seconds);

  useEffect(() => {
    if (count <= 0) {
      onDone();
      return;
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onDone]);

  return (
    <div className="relative mx-auto flex size-24 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/20" />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#ef4444"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 45}
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: (2 * Math.PI * 45) * (1 - count / seconds) }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </svg>
      <span className="text-3xl font-bold text-red-500 tabular-nums">{count}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function EmergencySellButton() {
  const { user, goldWallet, goldPrice, addToast, setGoldWallet } = useAppStore();
  const { t } = useTranslation();

  const [state, setState] = useState<SellState>('idle');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [currentSellPrice, setCurrentSellPrice] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(true);

  /* ── Fetch current sell price ── */
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/gold/prices');
        const data = await res.json();
        if (data.success) {
          setCurrentSellPrice(data.prices.sell);
        } else if (goldPrice?.sellPrice) {
          setCurrentSellPrice(goldPrice.sellPrice);
        } else {
          setCurrentSellPrice(33800000);
        }
      } catch {
        if (goldPrice?.sellPrice) {
          setCurrentSellPrice(goldPrice.sellPrice);
        } else {
          setCurrentSellPrice(33800000);
        }
      } finally {
        setFetchingPrice(false);
      }
    };
    fetchPrice();
  }, [goldPrice?.sellPrice]);

  const availableGold = goldWallet.goldGrams - goldWallet.frozenGold;
  const estimatedValue = availableGold * currentSellPrice;

  /* ── Handlers ── */
  const handleFirstClick = () => {
    if (availableGold <= 0) {
      addToast('موجودی طلای قابل فروش ندارید', 'error');
      return;
    }
    setState('pin');
    setPin('');
    setPinError('');
  };

  const handlePinSubmit = () => {
    if (pin.length !== 4) {
      setPinError('کد امنیتی باید ۴ رقم باشد');
      return;
    }
    setState('countdown');
  };

  const handleCountdownDone = () => {
    executeSell();
  };

  const handleCancel = () => {
    setState('idle');
    setPin('');
    setPinError('');
  };

  const executeSell = useCallback(async () => {
    setState('processing');

    try {
      const res = await fetch('/api/wallet/sell-gold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          goldGrams: availableGold,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setState('success');
        setShowConfetti(true);
        addToast('فروش اضطراری طلا با موفقیت انجام شد', 'success');

        // Update local state
        if (data.newGoldBalance !== undefined) {
          setGoldWallet({
            ...goldWallet,
            goldGrams: data.newGoldBalance,
          });
        }

        setTimeout(() => {
          setShowConfetti(false);
          setState('idle');
        }, 5000);
      } else {
        setState('error');
        addToast(data.message || 'خطا در فروش طلا', 'error');
        setTimeout(() => setState('idle'), 3000);
      }
    } catch {
      setState('error');
      addToast('خطا در ارتباط با سرور', 'error');
      setTimeout(() => setState('idle'), 3000);
    }
  }, [user?.id, availableGold, goldWallet, setGoldWallet, addToast]);

  /* ── Render ── */

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && <Confetti />}
      </AnimatePresence>

      {/* ── Header Card ── */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-red-200/50 bg-gradient-to-br from-red-50/30 to-orange-50/20 dark:border-red-900/30 dark:from-red-950/10 dark:to-orange-950/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-red-500/10">
                <ShieldAlert className="size-5 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-red-600 dark:text-red-400">
                  فروش اضطراری طلا
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  فروش فوری تمام طلای آزاد با یک کلیک
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Holdings */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/50 bg-card p-3">
                <p className="text-xs text-muted-foreground">موجودی طلای آزاد</p>
                <p className="mt-1 text-lg font-bold tabular-nums gold-gradient-text">
                  {fetchingPrice ? (
                    <Skeleton className="inline-block h-6 w-24 rounded" />
                  ) : (
                    formatGrams(availableGold)
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-border/50 bg-card p-3">
                <p className="text-xs text-muted-foreground">ارزش تخمینی</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                  {fetchingPrice ? (
                    <Skeleton className="inline-block h-6 w-28 rounded" />
                  ) : (
                    formatToman(estimatedValue)
                  )}
                </p>
              </div>
            </div>

            {/* Warning Text */}
            <div className="flex items-start gap-2 rounded-lg border border-red-200/50 bg-red-50/50 p-3 dark:border-red-900/30 dark:bg-red-950/20">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
              <div className="text-xs leading-5 text-red-600 dark:text-red-400">
                <strong>توجه:</strong> فروش اضطراری با قیمت لحظه‌ای فروش انجام می‌شود.
                پس از تأیید، عملیات قابل لغو نخواهد بود. کارمزد فروش (۰.۳٪) کسر خواهد شد.
              </div>
            </div>

            {/* Main Sell Button */}
            <motion.div variants={pulseButtonVariants} animate={state === 'idle' ? 'pulse' : 'idle'}>
              <Button
                className="relative w-full overflow-hidden bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-lg shadow-red-500/20 text-base font-bold py-6"
                onClick={handleFirstClick}
                disabled={state !== 'idle' || availableGold <= 0 || fetchingPrice}
                size="lg"
              >
                {availableGold <= 0 ? (
                  <span className="flex items-center gap-2">
                    <Coins className="size-5" />
                    موجودی کافی ندارید
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="size-5" />
                    فروش اضطراری — {formatGrams(availableGold)} طلا
                  </span>
                )}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── PIN Dialog ── */}
      <Dialog open={state === 'pin'} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <ShieldAlert className="size-5" />
              تأیید فروش اضطراری
            </DialogTitle>
            <DialogDescription className="text-xs">
              برای تأیید فروش، کد امنیتی ۴ رقمی خود را وارد کنید
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-red-200/50 bg-red-50/50 p-3 dark:border-red-900/30 dark:bg-red-950/20">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">مقدار:</span>
                  <span className="ms-1 font-bold">{formatGrams(availableGold)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">قیمت فروش:</span>
                  <span className="ms-1 font-bold">{formatToman(currentSellPrice)}/گرم</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">مبلغ دریافتی تقریبی:</span>
                  <span className="ms-1 font-bold text-red-600 dark:text-red-400">{formatToman(estimatedValue)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin" className="text-sm">کد امنیتی</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPin(val);
                  setPinError('');
                }}
                className="text-center text-2xl tracking-[0.5em] font-bold tabular-nums"
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-red-500">{pinError}</p>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              انصراف
            </Button>
            <Button
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
              onClick={handlePinSubmit}
              disabled={pin.length !== 4}
            >
              تأیید و فروش
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Countdown Dialog ── */}
      <Dialog open={state === 'countdown'} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="size-5" />
              آخرین فرصت لغو!
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              عملیات فروش پس از پایان شمارش اجرا خواهد شد
            </p>
            <CountdownCircle seconds={3} onDone={handleCountdownDone} />
            <Button variant="outline" onClick={handleCancel} className="w-full">
              <X className="size-4 me-1" />
              لغو فروش
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Processing Dialog ── */}
      <Dialog open={state === 'processing'} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm">
          <div className="py-10 text-center space-y-4">
            <Loader2 className="mx-auto size-10 animate-spin text-gold" />
            <p className="text-sm font-semibold">در حال انجام فروش اضطراری...</p>
            <p className="text-xs text-muted-foreground">لطفاً صبر کنید</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Success Dialog ── */}
      <Dialog open={state === 'success'} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm">
          <div className="py-8 text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/10"
            >
              <Check className="size-8 text-emerald-500" />
            </motion.div>
            <div>
              <p className="text-lg font-bold text-emerald-500">فروش موفق!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatGrams(availableGold)} طلا با موفقیت فروخته شد
              </p>
              <p className="mt-2 text-base font-bold tabular-nums gold-gradient-text">
                {formatToman(estimatedValue)}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setState('idle');
                setShowConfetti(false);
              }}
              className="w-full"
            >
              بستن
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  Gift, Send, Phone, MessageSquare, Calendar, Sparkles,
  Heart, PartyPopper, Star, Flower2, Clock, Check,
  Package, ChevronLeft, Loader2, X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { usePageEvent } from '@/hooks/use-page-event';
import { formatToman, formatGrams, formatNumber } from '@/lib/helpers';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const OCCASIONS = [
  { value: 'birthday', label: 'تولد', emoji: '🎂', icon: Cake },
  { value: 'anniversary', label: 'سالگرد', emoji: '💝', icon: Heart },
  { value: 'love', label: 'عشق', emoji: '❤️', icon: Heart },
  { value: 'eid', label: 'عید', emoji: '🌙', icon: Star },
  { value: 'congrats', label: 'تبریک', emoji: '🎉', icon: PartyPopper },
  { value: 'custom', label: 'سفارشی', emoji: '✨', icon: Sparkles },
];

const CARD_STYLES = [
  { value: 'classic', label: 'کلاسیک', gradient: 'from-amber-400 via-yellow-300 to-amber-500', bg: 'bg-gradient-to-br from-amber-50 to-yellow-50' },
  { value: 'royal', label: 'سلطنتی', gradient: 'from-yellow-600 via-amber-500 to-yellow-700', bg: 'bg-gradient-to-br from-yellow-50 to-amber-50' },
  { value: 'rose', label: 'رز', gradient: 'from-rose-400 via-pink-300 to-rose-500', bg: 'bg-gradient-to-br from-rose-50 to-pink-50' },
  { value: 'emerald', label: 'زمردین', gradient: 'from-emerald-400 via-green-300 to-emerald-500', bg: 'bg-gradient-to-br from-emerald-50 to-green-50' },
  { value: 'ocean', label: 'اقیانوسی', gradient: 'from-sky-400 via-blue-300 to-sky-500', bg: 'bg-gradient-to-br from-sky-50 to-blue-50' },
  { value: 'midnight', label: 'شبانه', gradient: 'from-indigo-500 via-purple-400 to-indigo-600', bg: 'bg-gradient-to-br from-indigo-50 to-purple-50' },
];

const GOLD_AMOUNTS = [
  { mg: 0.01, label: '۰.۰۱ گرم' },
  { mg: 0.05, label: '۰.۰۵ گرم' },
  { mg: 0.1, label: '۰.۱ گرم' },
  { mg: 0.5, label: '۰.۵ گرم' },
  { mg: 1, label: '۱ گرم' },
];

// Placeholder icons
function Cake(props: any) { return <Gift {...props} />; }

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Gift Card Preview                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function GiftCardPreview({
  style, occasion, message, amount, isOpen,
}: {
  style: typeof CARD_STYLES[0];
  occasion: typeof OCCASIONS[0] | null;
  message: string;
  amount: number;
  isOpen: boolean;
}) {
  return (
    <motion.div
      className={cn(
        'relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl p-6 shadow-xl',
        style.bg,
        !isOpen && 'cursor-pointer',
      )}
      whileTap={!isOpen ? { scale: 0.98 } : undefined}
    >
      {/* Top gradient bar */}
      <div className={cn('absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l', style.gradient)} />

      {!isOpen ? (
        /* Closed card */
        <div className="flex flex-col items-center gap-4 py-6">
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Gift className="size-16 text-gold" />
          </motion.div>
          <p className="text-sm font-medium text-muted-foreground">کارت هدیه طلایی</p>
          <p className="text-xs text-muted-foreground/60">برای باز کردن کلیک کنید</p>
        </div>
      ) : (
        /* Opened card */
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4 text-center"
        >
          {/* Occasion emoji */}
          {occasion && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="text-4xl"
            >
              {occasion.emoji}
            </motion.div>
          )}

          {/* Occasion label */}
          {occasion && (
            <p className="text-lg font-bold text-foreground">{occasion.label}</p>
          )}

          {/* Gold amount */}
          <div className="rounded-xl bg-white/60 p-3 backdrop-blur-sm dark:bg-black/20">
            <p className="text-xs text-muted-foreground">مقدار طلا</p>
            <p className="gold-gradient-text text-2xl font-bold">{formatGrams(amount)} طلای آب‌شده</p>
          </div>

          {/* Message */}
          {message && (
            <div className="rounded-lg bg-white/40 p-3 backdrop-blur-sm dark:bg-black/10">
              <MessageSquare className="mx-auto mb-1 size-4 text-gold/60" />
              <p className="text-sm leading-6 text-foreground">{message}</p>
            </div>
          )}

          {/* Footer */}
          <p className="text-xs text-muted-foreground/50">زرین گلد | هدیه طلایی</p>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Gift History Item                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function GiftItem({ gift, direction }: { gift: any; direction: 'sent' | 'received' }) {
  const occasion = OCCASIONS.find(o => o.value === gift.occasion);
  const cardStyle = CARD_STYLES.find(s => s.value === gift.giftCardStyle) || CARD_STYLES[0];

  return (
    <motion.div
      initial={{ opacity: 0, x: direction === 'sent' ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 rounded-xl border border-border/50 p-3 transition-colors hover:bg-muted/30"
    >
      <div className={cn('flex size-10 items-center justify-center rounded-lg bg-gradient-to-br', cardStyle.gradient)}>
        <Gift className="size-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">
            {direction === 'sent' ? 'ارسال به' : 'دریافت از'} {'***'}
          </p>
          {occasion && <span className="text-sm">{occasion.emoji}</span>}
        </div>
        <p className="text-xs text-muted-foreground">
          {gift.message || occasion?.label || 'هدیه طلایی'}
        </p>
      </div>
      <div className="text-end">
        <p className="text-sm font-bold gold-gradient-text">{formatGrams(gift.goldMg)}</p>
        <p className="text-[10px] text-muted-foreground">
          {gift.createdAt ? new Intl.DateTimeFormat('fa-IR').format(new Date(gift.createdAt)) : ''}
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function GoldGiftCenter() {
  const { user, goldWallet, goldPrice, addToast } = useAppStore();

  // Form state
  const [receiverPhone, setReceiverPhone] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number>(0.01);
  const [selectedOccasion, setSelectedOccasion] = useState('birthday');
  const [selectedStyle, setSelectedStyle] = useState('classic');
  const [message, setMessage] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Preview
  const [isCardOpen, setIsCardOpen] = useState(false);

  // History
  const [gifts, setGifts] = useState<{ sent: any[]; received: any[] }>({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);

  /* ── Fetch history ── */
  const fetchGifts = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/gifts?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setGifts({ sent: data.sent || [], received: data.received || [] });
      }
    } catch (e) {
      console.error('Failed to fetch gifts:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchGifts(); }, [fetchGifts]);

  /* ── Quick Action Event Listeners ── */
  usePageEvent('send-gift', () => {
    // Ensure send tab is active (component is on 'send' tab by default)
    const sendTab = document.querySelector('[value="send"]') as HTMLElement;
    if (sendTab) sendTab.click();
  });
  usePageEvent('received', () => {
    // Switch to history tab — received section
    const historyTab = document.querySelector('[value="history"]') as HTMLElement;
    if (historyTab) historyTab.click();
  });
  usePageEvent('history', () => {
    const historyTab = document.querySelector('[value="history"]') as HTMLElement;
    if (historyTab) historyTab.click();
  });

  /* ── Send gift ── */
  const handleSendGift = async () => {
    if (!user?.id || !receiverPhone || selectedAmount <= 0) {
      addToast('لطفاً تمام فیلدها را پر کنید', 'error');
      return;
    }
    if (selectedAmount > goldWallet.goldGrams) {
      addToast('موجودی طلای شما کافی نیست', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/gifts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          receiverPhone,
          goldMg: selectedAmount,
          message,
          occasion: selectedOccasion,
          giftCardStyle: selectedStyle,
          scheduledAt: scheduleDate || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('هدیه طلایی با موفقیت ارسال شد! 🎁', 'success');
        setReceiverPhone('');
        setMessage('');
        setScheduleDate('');
        setIsCardOpen(false);
        fetchGifts();
      } else {
        addToast(data.message || 'خطا در ارسال هدیه', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const currentOccasion = OCCASIONS.find(o => o.value === selectedOccasion) || OCCASIONS[0];
  const currentStyle = CARD_STYLES.find(s => s.value === selectedStyle) || CARD_STYLES[0];
  const goldValue = selectedAmount * (goldPrice?.buyPrice ?? 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground">🎁 مرکز هدایای طلایی</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          طلای واقعی هدیه بدهید، خاطره ماندگار بسازید
        </p>
      </motion.div>

      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send">ارسال هدیه</TabsTrigger>
          <TabsTrigger value="history">
            تاریخچه
            {(gifts.sent.length + gifts.received.length) > 0 && (
              <Badge variant="secondary" className="ms-2 bg-gold/15 text-gold">
                {gifts.sent.length + gifts.received.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Send Tab ── */}
        <TabsContent value="send" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left: Form */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              {/* Recipient */}
              <Card>
                <CardContent className="space-y-4 p-4">
                  <div className="space-y-2">
                    <Label>شماره گیرنده</Label>
                    <Input
                      value={receiverPhone}
                      onChange={e => setReceiverPhone(e.target.value)}
                      placeholder="۰۹۱۲XXXXXXX"
                      className="text-left dir-ltr"
                      dir="ltr"
                    />
                  </div>

                  {/* Occasion */}
                  <div className="space-y-2">
                    <Label>مناسبت</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {OCCASIONS.map(o => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => setSelectedOccasion(o.value)}
                          className={cn(
                            'flex flex-col items-center gap-1 rounded-xl p-2.5 text-xs font-medium transition-all',
                            selectedOccasion === o.value
                              ? 'bg-gold/15 text-gold ring-1 ring-gold/30'
                              : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                          )}
                        >
                          <span className="text-lg">{o.emoji}</span>
                          <span>{o.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Style */}
                  <div className="space-y-2">
                    <Label>طرح کارت</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {CARD_STYLES.map(s => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setSelectedStyle(s.value)}
                          className={cn(
                            'flex flex-col items-center gap-1 rounded-xl p-2.5 transition-all',
                            selectedStyle === s.value
                              ? 'ring-2 ring-gold ring-offset-2'
                              : 'hover:ring-1 hover:ring-gold/30',
                          )}
                        >
                          <div className={cn('h-8 w-full rounded-lg bg-gradient-to-br', s.gradient)} />
                          <span className="text-[10px] text-muted-foreground">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label>مقدار طلا</Label>
                    <div className="flex flex-wrap gap-2">
                      {GOLD_AMOUNTS.map(a => (
                        <button
                          key={a.mg}
                          type="button"
                          onClick={() => setSelectedAmount(a.mg)}
                          className={cn(
                            'rounded-xl px-3 py-2 text-xs font-medium transition-all',
                            selectedAmount === a.mg
                              ? 'bg-gold text-gold-dark shadow-sm'
                              : 'bg-muted text-muted-foreground hover:bg-gold/10',
                          )}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ارزش تقریبی: <span className="font-semibold text-foreground">{formatToman(goldValue)}</span>
                    </p>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label>پیام (اختیاری)</Label>
                    <Input
                      value={message}
                      onChange={e => setMessage(e.target.value.slice(0, 200))}
                      placeholder="پیام خود را بنویسید..."
                      maxLength={200}
                    />
                    <p className="text-left text-[10px] text-muted-foreground" dir="ltr">
                      {message.length}/200
                    </p>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="size-3.5" />
                      ارسال در تاریخ مشخص (اختیاری)
                    </Label>
                    <Input
                      type="date"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                      dir="ltr"
                    />
                  </div>

                  {/* Available gold */}
                  <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/20">
                    <p className="text-xs text-muted-foreground">موجودی طلای شما:</p>
                    <p className="text-lg font-bold gold-gradient-text">
                      {formatGrams(goldWallet.goldGrams)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right: Preview */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">پیش‌نمایش کارت هدیه</CardTitle>
                </CardHeader>
                <CardContent>
                  <GiftCardPreview
                    style={currentStyle}
                    occasion={currentOccasion}
                    message={message}
                    amount={selectedAmount}
                    isOpen={isCardOpen}
                  />
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => setIsCardOpen(!isCardOpen)}
                  >
                    {isCardOpen ? 'بستن کارت' : 'باز کردن کارت'}
                  </Button>
                </CardContent>
              </Card>

              {/* Send Button */}
              <Button
                onClick={handleSendGift}
                disabled={submitting || !receiverPhone}
                className="w-full bg-gradient-to-l from-amber-500 via-yellow-400 to-amber-500 py-6 text-base font-bold text-gold-dark shadow-lg shadow-gold/20 hover:shadow-gold/30"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Send className="ms-2 size-5" />
                    ارسال هدیه طلایی
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history" className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : gifts.sent.length + gifts.received.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Gift className="mb-3 size-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">هنوز هیچ هدیه‌ای ارسال یا دریافت نکرده‌اید</p>
              <p className="mt-1 text-xs text-muted-foreground/60">اولین هدیه طلایی خود را بفرستید! 🎁</p>
            </div>
          ) : (
            <div className="space-y-6">
              {gifts.sent.length > 0 && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Send className="size-4 text-gold" />
                    ارسال شده ({gifts.sent.length})
                  </h3>
                  {gifts.sent.map(g => <GiftItem key={g.id} gift={g} direction="sent" />)}
                </div>
              )}
              {gifts.received.length > 0 && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Package className="size-4 text-emerald-500" />
                    دریافت شده ({gifts.received.length})
                  </h3>
                  {gifts.received.map(g => <GiftItem key={g.id} gift={g} direction="received" />)}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

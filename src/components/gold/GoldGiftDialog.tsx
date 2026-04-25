'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Gift, Send, Sparkles, Coins, CheckCircle, Clock, Star } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatToman, formatGrams } from '@/lib/helpers';

const REWARD_OPTIONS = [
  { grams: 0.01, label: '۰.۰۱ گرم', price: 350_000 },
  { grams: 0.1, label: '۰.۱ گرم', price: 3_500_000 },
  { grams: 0.5, label: '۰.۵ گرم', price: 17_500_000 },
  { grams: 1, label: '۱ گرم', price: 35_000_000 },
  { grams: 5, label: '۵ گرم', price: 175_000_000 },
];

interface GoldGiftDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerOnly?: boolean;
}

export default function GoldGiftDialog({ open: externalOpen, onOpenChange: externalOnOpenChange, triggerOnly }: GoldGiftDialogProps) {
  const { user, addToast } = useAppStore();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [selectedGift, setSelectedGift] = useState<number | null>(null);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!selectedGift || !recipientPhone.trim()) {
      addToast('لطفاً گزینه و شماره گیرنده را وارد کنید', 'error');
      return;
    }
    setSending(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    addToast(`🎁 ${formatGrams(REWARD_OPTIONS[selectedGift].grams)} طلا با موفقیت ارسال شد!`, 'success');
    setSending(false);
    setOpen(false);
    setSelectedGift(null);
    setRecipientPhone('');
    setMessage('');
  };

  if (triggerOnly) return null;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="border-gold/30 text-gold hover:bg-gold/10 gap-2"
      >
        <Gift className="size-4" />
        <span className="hidden sm:inline">هدیه طلا</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          {/* Gold gradient header */}
          <div className="bg-gradient-to-l from-gold-dark via-gold to-gold-light p-6 text-gray-950">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Gift className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-950">هدیه طلا</DialogTitle>
                <DialogDescription className="text-gray-800/70 text-sm">
                  طلا به عزیزانتان هدیه دهید
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Recipient phone */}
            <div className="space-y-2">
              <Label>شماره گیرنده</Label>
              <Input
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                dir="ltr"
                className="text-left"
              />
            </div>

            {/* Gift options */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Coins className="size-4 text-gold" />
                مقدار هدیه
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {REWARD_OPTIONS.map((opt, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setSelectedGift(i)}
                    className={`relative flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all duration-200 ${
                      selectedGift === i
                        ? 'border-gold bg-gold/10 shadow-md shadow-gold/20'
                        : 'border-border hover:border-gold/30 hover:bg-gold/5'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {selectedGift === i && (
                      <motion.div
                        layoutId="selected-gift"
                        className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-gold text-gray-950"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <CheckCircle className="size-3" />
                      </motion.div>
                    )}
                    <span className="text-lg">🪙</span>
                    <span className="text-xs font-bold text-foreground">{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {formatToman(opt.price)}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Sparkles className="size-4 text-gold" />
                پیام (اختیاری)
              </Label>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="مثلاً: تولدت مبارک! 🎂"
                maxLength={100}
              />
            </div>

            {/* Summary */}
            {selectedGift !== null && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl bg-gold/5 border border-gold/10 p-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">مبلغ:</span>
                    <span className="font-bold text-gold">{formatToman(REWARD_OPTIONS[selectedGift].price)}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                انصراف
              </Button>
              <Button
                className="flex-1 bg-gradient-to-l from-gold-dark via-gold to-gold-light text-white"
                onClick={handleSend}
                disabled={sending || selectedGift === null || !recipientPhone.trim()}
              >
                {sending ? (
                  <span className="flex items-center gap-1.5">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      🪙
                    </motion.div>
                    در حال ارسال...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Send className="size-4" />
                    ارسال هدیه
                  </span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

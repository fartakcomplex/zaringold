'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Copy,
  Check,
  Send,
  MessageCircle,
  Share2,
  QrCode,
  Gift,
  ExternalLink,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface ShareInviteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralCode?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  QR Code Placeholder SVG                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function QRCodePlaceholder({ size = 120 }: { size?: number }) {
  // Generate a deterministic-looking QR pattern
  const modules = 21;
  const cellSize = size / modules;
  const pattern: boolean[][] = [];

  // Simple deterministic pattern generation
  for (let row = 0; row < modules; row++) {
    pattern[row] = [];
    for (let col = 0; col < modules; col++) {
      // Finder patterns (3 corners)
      const isFinderTopLeft = row < 7 && col < 7;
      const isFinderTopRight = row < 7 && col >= modules - 7;
      const isFinderBottomLeft = row >= modules - 7 && col < 7;

      if (isFinderTopLeft || isFinderTopRight || isFinderBottomLeft) {
        const r = isFinderBottomLeft ? row - (modules - 7) : row;
        const c = isFinderTopRight ? col - (modules - 7) : col;
        if (r === 0 || r === 6 || c === 0 || c === 6) {
          pattern[row][col] = true;
        } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
          pattern[row][col] = true;
        } else {
          pattern[row][col] = false;
        }
      } else {
        // Pseudo-random data area
        const hash = ((row * 31 + col * 17 + row * col) % 7);
        pattern[row][col] = hash < 3;
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg">
      <rect width={size} height={size} fill="white" rx="4" />
      {pattern.map((row, ri) =>
        row.map((cell, ci) =>
          cell ? (
            <rect
              key={`${ri}-${ci}`}
              x={ci * cellSize}
              y={ri * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#1a1507"
              rx={cellSize > 3 ? 0.5 : 0}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Share/Invite Component                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ShareInvite({ open, onOpenChange, referralCode }: ShareInviteProps) {
  const { locale } = useTranslation();
  const { user } = useAppStore();
  const isRTL = locale === 'fa';

  const code = referralCode || user?.referralCode || 'ZARIN001';
  const referralLink = `https://zaringold.ir/invite/${code}`;

  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const faShareText = `با زرین‌گلد طلای دیجیتال بخر و بفروش! با کد دعوت من ثبت‌نام کن و هدیه بگیر 🪙`;
  const enShareText = `Buy and sell digital gold with ZarinGold! Sign up with my invite code and get a bonus 🪙`;

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [code]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  }, [referralLink]);

  const shareToTelegram = useCallback(() => {
    const text = isRTL ? faShareText : enShareText;
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }, [referralLink, isRTL, faShareText, enShareText]);

  const shareToWhatsApp = useCallback(() => {
    const text = isRTL ? faShareText : enShareText;
    const url = `https://wa.me/?text=${encodeURIComponent(text + '\n' + referralLink)}`;
    window.open(url, '_blank');
  }, [referralLink, isRTL, faShareText, enShareText]);

  const shareToTwitter = useCallback(() => {
    const text = isRTL ? faShareText : enShareText;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`;
    window.open(url, '_blank');
  }, [referralLink, isRTL, faShareText, enShareText]);

  const shareToClipboard = useCallback(async () => {
    const text = isRTL ? faShareText : enShareText;
    try {
      await navigator.clipboard.writeText(text + '\n' + referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [referralLink, isRTL, faShareText, enShareText]);

  const socialButtons: Array<{
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    color: string;
    hoverBg: string;
  }> = [
    {
      icon: Send,
      label: isRTL ? 'تلگرام' : 'Telegram',
      onClick: shareToTelegram,
      color: 'text-[#229ED9]',
      hoverBg: 'hover:bg-[#229ED9]/10',
    },
    {
      icon: MessageCircle,
      label: isRTL ? 'واتساپ' : 'WhatsApp',
      onClick: shareToWhatsApp,
      color: 'text-[#25D366]',
      hoverBg: 'hover:bg-[#25D366]/10',
    },
    {
      icon: Share2,
      label: isRTL ? 'توییتر' : 'Twitter/X',
      onClick: shareToTwitter,
      color: 'text-gray-300',
      hoverBg: 'hover:bg-white/10',
    },
    {
      icon: copied ? Check : Copy,
      label: isRTL ? (copied ? 'کپی شد!' : 'کپی متن') : (copied ? 'Copied!' : 'Copy Text'),
      onClick: shareToClipboard,
      color: copied ? 'text-[#D4AF37]' : 'text-gray-400',
      hoverBg: 'hover:bg-[#D4AF37]/10',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'bg-[#0f0d06] border-[#D4AF37]/30 max-w-md',
          isRTL && '[&_*]:text-right',
        )}
      >
        <DialogHeader>
          <DialogTitle
            className={cn('text-[#D4AF37] flex items-center gap-2 text-lg', isRTL && 'flex-row-reverse')}
          >
            <Gift className="size-5" />
            {isRTL ? 'دعوت از دوستان' : 'Invite Friends'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {isRTL
              ? 'کد دعوت خود را به اشتراک بگذارید و هدیه بگیرید!'
              : 'Share your invite code and earn rewards!'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Referral Code Display */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'relative rounded-2xl border-2 border-dashed border-[#D4AF37]/40',
              'bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-[#D4AF37]/5',
              'p-5 text-center',
            )}
          >
            <p className="text-xs text-[#D4AF37]/70 uppercase tracking-wider mb-2">
              {isRTL ? 'کد دعوت شما' : 'Your Invite Code'}
            </p>
            <div className={cn('flex items-center justify-center gap-3', isRTL && 'flex-row-reverse')}>
              <span
                className={cn(
                  'text-3xl font-black tracking-[0.2em]',
                  'bg-gradient-to-r from-[#F5E6A3] via-[#D4AF37] to-[#B8962E] bg-clip-text text-transparent',
                )}
              >
                {code}
              </span>
              <button
                onClick={handleCopyCode}
                className={cn(
                  'flex size-9 items-center justify-center rounded-lg transition-all',
                  copied
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                    : 'bg-white/5 text-gray-400 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]',
                )}
                aria-label={isRTL ? 'کپی کد' : 'Copy code'}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </button>
            </div>
          </motion.div>

          {/* Copy Link Button */}
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className={cn(
              'w-full border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10',
              'rounded-xl h-11 flex items-center gap-2 justify-center',
              copiedLink && 'bg-[#D4AF37]/10 border-[#D4AF37]/50',
              isRTL && 'flex-row-reverse',
            )}
          >
            {copiedLink ? (
              <>
                <Check className="size-4" />
                {isRTL ? 'لینک کپی شد!' : 'Link Copied!'}
              </>
            ) : (
              <>
                <ExternalLink className="size-4" />
                {isRTL ? 'کپی لینک دعوت' : 'Copy Invite Link'}
              </>
            )}
          </Button>

          {/* Social Sharing */}
          <div>
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">
              {isRTL ? 'اشتراک‌گذاری در' : 'Share via'}
            </p>
            <div className={cn('grid grid-cols-4 gap-2', isRTL && 'direction-rtl')}>
              {socialButtons.map((btn) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.label}
                    onClick={btn.onClick}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl',
                      'border border-white/5 bg-white/[0.02] transition-all',
                      btn.hoverBg,
                      'hover:border-[#D4AF37]/20',
                    )}
                  >
                    <Icon className={cn('size-5', btn.color)} />
                    <span className="text-[10px] text-gray-500 leading-tight">{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shared Message Preview */}
          <div
            className={cn(
              'rounded-xl border border-white/5 bg-white/[0.02] p-4',
            )}
          >
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">
              {isRTL ? 'پیش‌نمایش پیام' : 'Message Preview'}
            </p>
            <p className="text-sm text-gray-300 leading-relaxed" dir={isRTL ? 'rtl' : 'ltr'}>
              {isRTL ? faShareText : enShareText}
            </p>
            <p className="text-xs text-[#D4AF37]/70 mt-1 break-all" dir="ltr">
              {referralLink}
            </p>
          </div>

          {/* QR Code Toggle */}
          <button
            onClick={() => setShowQR(!showQR)}
            className={cn(
              'flex items-center gap-2 text-sm text-gray-400 hover:text-[#D4AF37] transition-colors w-full justify-center',
              isRTL && 'flex-row-reverse',
            )}
          >
            <QrCode className="size-4" />
            {showQR
              ? isRTL ? 'بستن QR کد' : 'Hide QR Code'
              : isRTL ? 'نمایش QR کد' : 'Show QR Code'}
          </button>

          <AnimatePresence>
            {showQR && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-3 overflow-hidden"
              >
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <QRCodePlaceholder size={140} />
                </div>
                <p className="text-xs text-gray-500">
                  {isRTL ? 'اسکن کنید و به زرین گلد بپیوندید' : 'Scan to join ZarinGold'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

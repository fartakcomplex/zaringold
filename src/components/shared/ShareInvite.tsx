'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Copy,
  Check,
  Send,
  Share2,
  MessageCircle,
  Phone,
  Twitter,
  QrCode,
  Gift,
  Sparkles,
} from 'lucide-react';

interface ShareInviteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralCode?: string;
}

const SOCIAL_SHARE = [
  {
    key: 'telegram',
    icon: Send,
    label: 'تلگرام',
    color: 'bg-[#2AABEE] hover:bg-[#229ED9]',
    getUrl: (code: string) => `https://t.me/share/url?url=https://zaringold.ir/ref/${code}&text=${encodeURIComponent('با زرین‌گلد طلای دیجیتال بخر و بفروش! با کد دعوت من ثبت‌نام کن و هدیه بگیر 🪙')}`,
  },
  {
    key: 'whatsapp',
    icon: Phone,
    label: 'واتساپ',
    color: 'bg-[#25D366] hover:bg-[#1DA851]',
    getUrl: (code: string) => `https://wa.me/?text=${encodeURIComponent('با زرین‌گلد طلای دیجیتال بخر و بفروش! با کد دعوت من ثبت‌نام کن و هدیه بگیر 🪙\nhttps://zaringold.ir/ref/' + code)}`,
  },
  {
    key: 'twitter',
    icon: Twitter,
    label: 'توییتر',
    color: 'bg-[#1DA1F2] hover:bg-[#0D95E8]',
    getUrl: (code: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent('Buy & sell digital gold with ZarinGold! 🪙 Sign up with my invite code and get a bonus!')}&url=https://zaringold.ir/ref/${code}`,
  },
];

export default function ShareInvite({ open, onOpenChange, referralCode }: ShareInviteProps) {
  const { t, dir } = useTranslation();
  const { user } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const code = referralCode || user?.referralCode || 'ZARINGOLD';
  const inviteLink = `https://zaringold.ir/ref/${code}`;
  const shareTextFA = `با زرین‌گلد طلای دیجیتال بخر و بفروش! با کد دعوت من ثبت‌نام کن و هدیه بگیر 🪙`;
  const shareTextEN = `Buy & sell digital gold with ZarinGold! Sign up with my invite code and get a bonus 🪙`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="size-5 text-gold" />
            {t('share.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Referral code display */}
          <div className="rounded-xl border border-gold/20 bg-gradient-to-r from-gold/5 to-gold/10 p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t('share.yourCode')}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black tracking-wider gold-gradient-text">{code}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="text-gold hover:bg-gold/10"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>

          {/* Invite link */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t('share.inviteLink')}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground truncate">
                {inviteLink}
              </div>
              <Button
                onClick={handleCopyLink}
                size="sm"
                className={cn(
                  'shrink-0 font-bold transition-all',
                  copied
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-gradient-to-r from-gold-dark via-gold to-gold-light text-gray-950 shadow-lg shadow-gold/20'
                )}
              >
                {copied ? <Check className="size-4 ms-1" /> : <Copy className="size-4 ms-1" />}
                {copied ? t('share.copied') : t('share.copyLink')}
              </Button>
            </div>
          </div>

          {/* Social sharing */}
          <div>
            <p className="mb-3 text-xs font-medium text-muted-foreground">{t('share.shareVia')}</p>
            <div className="flex items-center gap-3">
              {SOCIAL_SHARE.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.button
                    key={social.key}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.open(social.getUrl(code), '_blank')}
                    className={cn(
                      'flex size-12 items-center justify-center rounded-xl text-white shadow-lg transition-all',
                      social.color
                    )}
                  >
                    <Icon className="size-5" />
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Message preview */}
          <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Sparkles className="size-3 text-gold" />
              {t('share.preview')}
            </p>
            <p className="text-sm leading-relaxed text-foreground">{shareTextFA}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{shareTextEN}</p>
          </div>

          {/* QR Code toggle */}
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQR(!showQR)}
              className="w-full border-gold/20 hover:border-gold/40"
            >
              <QrCode className="size-4 ms-2 text-gold" />
              {showQR ? t('share.hideQR') : t('share.showQR')}
            </Button>

            <AnimatePresence>
              {showQR && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 flex justify-center"
                >
                  <div className="rounded-xl border border-gold/20 bg-white p-3">
                    {/* Simple QR code placeholder SVG */}
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                      {/* Finder patterns */}
                      <rect x="5" y="5" width="25" height="25" rx="3" fill="#1a1a1a" />
                      <rect x="8" y="8" width="19" height="19" rx="2" fill="white" />
                      <rect x="11" y="11" width="13" height="13" rx="1" fill="#1a1a1a" />
                      
                      <rect x="90" y="5" width="25" height="25" rx="3" fill="#1a1a1a" />
                      <rect x="93" y="8" width="19" height="19" rx="2" fill="white" />
                      <rect x="96" y="11" width="13" height="13" rx="1" fill="#1a1a1a" />
                      
                      <rect x="5" y="90" width="25" height="25" rx="3" fill="#1a1a1a" />
                      <rect x="8" y="93" width="19" height="19" rx="2" fill="white" />
                      <rect x="11" y="96" width="13" height="13" rx="1" fill="#D4AF37" />
                      
                      {/* Data modules (decorative pattern) */}
                      {[35,45,55,65,75].map((x,i) => 
                        [35,45,55,65,75].map((y,j) => (
                          <rect key={`${i}-${j}`} x={x} y={y} width="6" height="6" rx="1" 
                            fill={((i+j) % 2 === 0 || (i===2 && j===2)) ? '#D4AF37' : '#1a1a1a'} 
                            opacity={0.8} />
                        ))
                      )}
                      
                      {/* Gold accent center */}
                      <rect x="53" y="53" width="14" height="14" rx="3" fill="#D4AF37" />
                      <rect x="56" y="56" width="8" height="8" rx="2" fill="#F5E6A3" />
                    </svg>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

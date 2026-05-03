
import React, { useEffect, useState, useCallback } from 'react';
import {motion} from '@/lib/framer-compat';
import {cn} from '@/lib/utils';
import {useTranslation} from '@/lib/i18n';
import {Download, X, Sparkles, Smartphone} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'zaringold-pwa-dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function PWAInstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Check if the prompt was recently dismissed
  const isDismissed = useCallback(() => {
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (!dismissedAt) return false;
      return Date.now() - parseInt(dismissedAt, 10) < DISMISS_DURATION_MS;
    } catch {
      return false;
    }
  }, []);

  // Listen for the beforeinstallprompt event
  useEffect(() => {
    // Don't show if already installed as a PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (isDismissed()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Delay showing the prompt a bit for better UX
      setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isDismissed]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      }
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
    } finally {
      setDeferredPrompt(null);
      setIsVisible(false);
      setIsInstalling(false);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Don't render if there's no deferred prompt
  if (!deferredPrompt) return null;

  return (
    <>
      {/* Gold shimmer style */}
      <style>{`
        @keyframes pwa-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .pwa-shimmer-text {
          background: linear-gradient(
            90deg,
            #D4AF37 0%,
            #FFD700 25%,
            #D4AF37 50%,
            #FFD700 75%,
            #D4AF37 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: pwa-shimmer 3s linear infinite;
        }
        @keyframes pwa-glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.15); }
          50% { box-shadow: 0 0 30px rgba(212, 175, 55, 0.3); }
        }
        .pwa-glow {
          animation: pwa-glow-pulse 2s ease-in-out infinite;
        }
      `}</style>

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={isVisible ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[90] p-3 sm:p-4',
          'transition-all duration-500',
          !isVisible && 'pointer-events-none'
        )}
      >
        <div
          className={cn(
            'mx-auto max-w-lg rounded-2xl border border-gold/30 overflow-hidden',
            'bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 backdrop-blur-xl',
            'pwa-glow'
          )}
        >
          {/* Gold accent line at top */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold to-transparent" />

          <div className="flex items-center gap-3 p-3 sm:p-4">
            {/* Icon */}
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gold/10 border border-gold/20">
              <Smartphone className="size-6 text-gold" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold pwa-shimmer-text">
                {t('pwa.installTitle') || 'نصب اپلیکیشن زرین گلد'}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                {t('pwa.installDesc') || 'دسترسی سریع‌تر، تجربه بهتر و آفلاین بودن'}
              </p>
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-foreground/10"
              aria-label={t('common.close') || 'بستن'}
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 px-3 pb-3 sm:px-4 sm:pb-4">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5',
                'bg-gradient-to-l from-gold to-amber-500',
                'text-zinc-900 font-bold text-sm',
                'transition-all duration-200',
                'hover:from-gold hover:to-gold hover:shadow-lg hover:shadow-gold/20',
                'active:scale-[0.98]',
                'disabled:opacity-70 disabled:cursor-not-allowed'
              )}
            >
              {isInstalling ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
                  <span>در حال نصب...</span>
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  <span>{t('pwa.install') || 'نصب اپلیکیشن'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleDismiss}
              className={cn(
                'rounded-xl px-4 py-2.5',
                'bg-foreground/5 border border-foreground/10',
                'text-muted-foreground text-sm font-medium',
                'transition-all duration-200',
                'hover:bg-foreground/10 hover:text-foreground'
              )}
            >
              {t('common.cancel') || 'بعداً'}
            </button>
          </div>

          {/* Feature badges */}
          <div className="flex items-center gap-3 border-t border-gold/10 px-3 py-2 sm:px-4">
            <div className="flex items-center gap-1 text-[10px] text-gold/80">
              <Sparkles className="size-3" />
              <span>آفلاین</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gold/80">
              <Download className="size-3" />
              <span>سریع‌تر</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gold/80">
              <Smartphone className="size-3" />
              <span>بدون مرورگر</span>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

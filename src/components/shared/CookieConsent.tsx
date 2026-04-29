'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Cookie, Shield, BarChart3, Megaphone, Puzzle } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  thirdParty: boolean;
}

type ConsentStatus = 'accepted_all' | 'essential_only' | 'custom' | null;

const STORAGE_KEY = 'zaringold_cookie_consent';

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  thirdParty: false,
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Cookie Consent Banner                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function CookieConsent() {
  const { t, locale } = useTranslation();
  const isRTL = locale === 'fa';

  const [showBanner, setShowBanner] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  // Check localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        const timer = setTimeout(() => setShowBanner(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = useCallback(
    (status: ConsentStatus, prefs?: CookiePreferences) => {
      try {
        const data = {
          status,
          preferences: prefs || DEFAULT_PREFERENCES,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // Silently fail
      }
      setShowBanner(false);
      setShowCustomize(false);
    },
    [],
  );

  const handleAcceptAll = useCallback(() => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      thirdParty: true,
    };
    setPreferences(allAccepted);
    saveConsent('accepted_all', allAccepted);
  }, [saveConsent]);

  const handleEssentialOnly = useCallback(() => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      thirdParty: false,
    };
    setPreferences(essentialOnly);
    saveConsent('essential_only', essentialOnly);
  }, [saveConsent]);

  const handleCustomSave = useCallback(() => {
    saveConsent('custom', preferences);
  }, [saveConsent, preferences]);

  const togglePreference = useCallback((key: keyof Omit<CookiePreferences, 'essential'>) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const cookieCategories: Array<{
    key: keyof CookiePreferences;
    icon: React.ElementType;
    labelFa: string;
    labelEn: string;
    descFa: string;
    descEn: string;
    disabled: boolean;
  }> = [
    {
      key: 'essential',
      icon: Shield,
      labelFa: 'کوکی‌های ضروری',
      labelEn: 'Essential Cookies',
      descFa: 'برای عملکرد اولیه سایت الزامی هستند',
      descEn: 'Required for basic site functionality',
      disabled: true,
    },
    {
      key: 'analytics',
      icon: BarChart3,
      labelFa: 'کوکی‌های تحلیلی',
      labelEn: 'Analytics Cookies',
      descFa: 'برای بهبود عملکرد و تجربه کاربری',
      descEn: 'To improve performance and user experience',
      disabled: false,
    },
    {
      key: 'marketing',
      icon: Megaphone,
      labelFa: 'کوکی‌های بازاریابی',
      labelEn: 'Marketing Cookies',
      descFa: 'برای نمایش تبلیغات مرتبط',
      descEn: 'To show relevant advertisements',
      disabled: false,
    },
    {
      key: 'thirdParty',
      icon: Puzzle,
      labelFa: 'کوکی‌های شخص ثالث',
      labelEn: 'Third-party Cookies',
      descFa: 'توسط سرویس‌های جانبی تنظیم می‌شوند',
      descEn: 'Set by external services',
      disabled: false,
    },
  ];

  return (
    <>
      <AnimatePresence>
        {showBanner && !showCustomize && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-[90] p-3 sm:p-4"
          >
            <div
              className={cn(
                'mx-auto max-w-4xl rounded-2xl border border-[#D4AF37]/30',
                'bg-gradient-to-r from-[#1a1507] via-[#0f0d06] to-[#1a1507]',
                'backdrop-blur-xl shadow-2xl shadow-[#D4AF37]/10',
                'p-4 sm:p-6',
              )}
            >
              <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center', isRTL && 'sm:flex-row-reverse')}>
                {/* Icon + Text */}
                <div className={cn('flex items-start gap-3 flex-1', isRTL && 'flex-row-reverse')}>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/20">
                    <Cookie className="size-5 text-[#D4AF37]" />
                  </div>
                  <div className={cn('min-w-0', isRTL && 'text-right')}>
                    <h3 className="text-base font-bold text-[#D4AF37]">
                      {isRTL ? 'رضایت کوکی‌ها' : 'Cookie Consent'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-300 leading-relaxed">
                      {isRTL
                        ? 'ما از کوکی‌ها برای بهبود تجربه شما استفاده می‌کنیم. با ادامه استفاده، شما سیاست کوکی ما را می‌پذیرید.'
                        : 'We use cookies to improve your experience. By continuing, you accept our cookie policy.'}
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className={cn('flex flex-col gap-2 sm:flex-row sm:shrink-0', isRTL && 'sm:flex-row-reverse')}>
                  <Button
                    onClick={handleAcceptAll}
                    className={cn(
                      'bg-gradient-to-l from-[#D4AF37] to-[#B8962E] text-black font-bold',
                      'hover:from-[#E5C039] hover:to-[#C9A33A]',
                      'rounded-xl px-5 h-10 text-sm',
                    )}
                  >
                    {isRTL ? 'پذیرش همه' : 'Accept All'}
                  </Button>

                  <Button
                    onClick={handleEssentialOnly}
                    variant="outline"
                    className={cn(
                      'border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10',
                      'rounded-xl px-5 h-10 text-sm',
                    )}
                  >
                    {isRTL ? 'فقط ضروری' : 'Essential Only'}
                  </Button>

                  <Button
                    onClick={() => setShowCustomize(true)}
                    variant="ghost"
                    className={cn(
                      'text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10',
                      'rounded-xl px-5 h-10 text-sm',
                    )}
                  >
                    {isRTL ? 'سفارشی‌سازی' : 'Customize'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customize Modal */}
      <Dialog open={showCustomize} onOpenChange={setShowCustomize}>
        <DialogContent
          className={cn(
            'bg-[#0f0d06] border-[#D4AF37]/30 max-w-md',
            isRTL && '[&_*]:text-right',
          )}
        >
          <DialogHeader>
            <DialogTitle
              className={cn('text-[#D4AF37] flex items-center gap-2', isRTL && 'flex-row-reverse')}
            >
              <Cookie className="size-5" />
              {isRTL ? 'سفارشی‌سازی کوکی‌ها' : 'Customize Cookies'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {isRTL
                ? 'تنظیمات کوکی را مطابق ترجیح خود تغییر دهید'
                : 'Adjust cookie settings to your preference'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {cookieCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.key}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border border-white/5 p-3',
                    'bg-white/[0.02] transition-colors',
                    preferences[cat.key] && 'border-[#D4AF37]/20 bg-[#D4AF37]/[0.04]',
                    isRTL && 'flex-row-reverse',
                  )}
                >
                  <div
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-lg',
                      preferences[cat.key]
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                        : 'bg-white/5 text-gray-500',
                    )}
                  >
                    <Icon className="size-4" />
                  </div>

                  <div className={cn('flex-1 min-w-0', isRTL && 'text-right')}>
                    <p className={cn('text-sm font-medium text-white')}>
                      {isRTL ? cat.labelFa : cat.labelEn}
                    </p>
                    <p className={cn('text-xs text-gray-500 mt-0.5')}>
                      {isRTL ? cat.descFa : cat.descEn}
                    </p>
                  </div>

                  <Switch
                    checked={preferences[cat.key]}
                    disabled={cat.disabled}
                    onCheckedChange={
                      cat.disabled
                        ? undefined
                        : () =>
                            togglePreference(cat.key as keyof Omit<CookiePreferences, 'essential'>)
                    }
                    className={cn(
                      preferences[cat.key] ? 'data-[state=checked]:bg-[#D4AF37]' : '',
                    )}
                  />
                </div>
              );
            })}
          </div>

          <DialogFooter className={cn('gap-2 sm:gap-2', isRTL && 'flex-row-reverse')}>
            <Button
              onClick={handleEssentialOnly}
              variant="outline"
              className="border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-xl"
            >
              {isRTL ? 'فقط ضروری' : 'Essential Only'}
            </Button>
            <Button
              onClick={handleCustomSave}
              className={cn(
                'bg-gradient-to-l from-[#D4AF37] to-[#B8962E] text-black font-bold',
                'hover:from-[#E5C039] hover:to-[#C9A33A] rounded-xl',
              )}
            >
              {isRTL ? 'ذخیره تنظیمات' : 'Save Preferences'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

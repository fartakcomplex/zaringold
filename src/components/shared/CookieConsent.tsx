'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Shield, BarChart3, Megaphone, Puzzle, Cookie, X } from 'lucide-react';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  thirdParty: boolean;
  accepted: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'zaringold_cookie_consent';

const COOKIE_CATEGORIES = [
  { key: 'essential' as const, icon: Shield, labelKey: 'cookie.essential', descKey: 'cookie.essentialDesc', required: true },
  { key: 'analytics' as const, icon: BarChart3, labelKey: 'cookie.analytics', descKey: 'cookie.analyticsDesc', required: false },
  { key: 'marketing' as const, icon: Megaphone, labelKey: 'cookie.marketing', descKey: 'cookie.marketingDesc', required: false },
  { key: 'thirdParty' as const, icon: Puzzle, labelKey: 'cookie.thirdParty', descKey: 'cookie.thirdPartyDesc', required: false },
];

function getStoredPreferences(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function savePreferences(prefs: CookiePreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export default function CookieConsent() {
  const { t, dir } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    thirdParty: false,
    accepted: false,
    timestamp: '',
  });

  useEffect(() => {
    const stored = getStoredPreferences();
    if (!stored || !stored.accepted) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const newPrefs: CookiePreferences = {
      essential: true, analytics: true, marketing: true, thirdParty: true,
      accepted: true, timestamp: new Date().toISOString(),
    };
    savePreferences(newPrefs);
    setPrefs(newPrefs);
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    const newPrefs: CookiePreferences = {
      essential: true, analytics: false, marketing: false, thirdParty: false,
      accepted: true, timestamp: new Date().toISOString(),
    };
    savePreferences(newPrefs);
    setPrefs(newPrefs);
    setVisible(false);
  };

  const handleSaveCustom = () => {
    const newPrefs: CookiePreferences = {
      ...prefs, accepted: true, timestamp: new Date().toISOString(),
    };
    savePreferences(newPrefs);
    setPrefs(newPrefs);
    setCustomizeOpen(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            dir={dir}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] p-4"
          >
            <div className="mx-auto max-w-2xl rounded-2xl border border-gold/20 bg-card/95 backdrop-blur-xl shadow-2xl shadow-gold/10">
              <div className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-gold-dark via-gold to-gold-light" />
              <div className="p-5">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                    <Cookie className="size-5 text-gold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-foreground">{t('cookie.title')}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t('cookie.description')}</p>
                  </div>
                  <button onClick={handleEssentialOnly} className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={handleAcceptAll} className="bg-gradient-to-r from-gold-dark via-gold to-gold-light text-gray-950 font-bold shadow-lg shadow-gold/20" size="sm">
                    {t('cookie.acceptAll')}
                  </Button>
                  <Button onClick={handleEssentialOnly} variant="outline" size="sm" className="border-gold/20 hover:border-gold/40">
                    {t('cookie.essentialOnly')}
                  </Button>
                  <Button onClick={() => setCustomizeOpen(true)} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    {t('cookie.customize')}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent dir={dir} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="size-5 text-gold" />
              {t('cookie.customizeTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {COOKIE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.key} className="flex items-center justify-between gap-4 rounded-xl border border-border/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-gold/10">
                      <Icon className="size-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t(cat.labelKey)}</p>
                      <p className="text-xs text-muted-foreground">{t(cat.descKey)}</p>
                    </div>
                  </div>
                  <Switch
                    checked={cat.required ? true : prefs[cat.key]}
                    disabled={cat.required}
                    onCheckedChange={(checked: boolean) => setPrefs((prev) => ({ ...prev, [cat.key]: checked }))}
                  />
                </div>
              );
            })}
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button onClick={handleSaveCustom} className="flex-1 bg-gradient-to-r from-gold-dark via-gold to-gold-light text-gray-950 font-bold">
              {t('cookie.savePreferences')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import { Menu, X, LogIn, Moon, Sun, PartyPopper } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import { cn } from '@/lib/utils';

// SSR-safe mounted detection
const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

interface LandingNavProps {
  onLogin: () => void;
}

const navLinkKeys = [
  { key: 'navLinks.features', href: '#features' },
  { key: 'navLinks.howItWorks', href: '#how-it-works' },
  { key: 'navLinks.calculator', href: '#calculator' },
  { key: 'navLinks.security', href: '#security' },
  { key: 'navLinks.faq', href: '#faq' },
];

const trackedSectionIds = [
  'hero',
  'features',
  'how-it-works',
  'calculator',
  'security',
  'testimonials',
  'faq',
  'cta',
];

export default function LandingNav({ onLogin }: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [bannerVisible, setBannerVisible] = useState(true);
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = resolvedTheme === 'dark';
  const { t } = useTranslation();

  const handleToggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  /* ── Scroll listener ── */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ── IntersectionObserver: active section highlighting ── */
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    trackedSectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, []);

  /* ── Smooth scroll on nav click ── */
  const handleNavClick = useCallback((href: string) => {
    setMobileMenuOpen(false);
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <>
    {/* ── Announcement Banner ── */}
    <AnimatePresence>
      {bannerVisible && (
        <motion.div
          dir="rtl"
          className={cn(
            'fixed top-0 left-0 right-0 z-[60]',
            'bg-gradient-to-l from-gold/10 via-gold/[0.07] to-gold/5',
            'backdrop-blur-lg border-b border-gold/20',
            'shadow-[0_1px_12px_rgba(212,175,55,0.15)]',
          )}
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mx-auto flex h-10 max-w-7xl items-center justify-center gap-2.5 px-4 sm:px-6 lg:px-8">
            <PartyPopper className="size-4 shrink-0 text-gold" />
            <p className="text-center text-xs sm:text-sm font-medium text-gold">
              جشنواره تخفیف ویژه: کارمزد خرید طلا فقط ۰.۳٪ برای مدت محدود!
            </p>
            <button
              onClick={() => setBannerVisible(false)}
              className={cn(
                'mr-2 flex size-6 shrink-0 items-center justify-center rounded-md',
                'text-gold/60 transition-all duration-200',
                'hover:bg-gold/15 hover:text-gold',
              )}
              aria-label="بستن بنر"
            >
              <X className="size-3.5" />
            </button>
          </div>
          {/* Gold bottom glow line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-l from-transparent via-gold/30 to-transparent" />
        </motion.div>
      )}
    </AnimatePresence>

    <motion.header
      dir="rtl"
      style={{ top: bannerVisible ? 40 : 0 }}
      className={cn(
        'fixed left-0 right-0 z-50 transition-all duration-500 ease-out',
        scrolled
          ? 'bg-background/70 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-gold/10'
          : 'bg-transparent',
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {scrolled && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-l from-transparent via-gold/40 to-transparent" />
      )}

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Logo ── */}
        <motion.div
          className="flex items-center gap-2.5"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className={cn(
            'relative flex size-9 items-center justify-center rounded-xl transition-all duration-300',
            scrolled
              ? 'bg-gradient-to-br from-gold via-gold to-gold-dark shadow-lg shadow-gold/20'
              : 'bg-gradient-to-br from-gold-light via-gold to-gold-dark shadow-md shadow-gold/15',
          )}>
            <span className="text-base font-black text-gray-950">ز</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <span className="gold-gradient-text text-xl font-extrabold tracking-tight gold-text-shadow">
            {t('common.zarrinGold')}
          </span>
        </motion.div>

        {/* ── Desktop nav ── */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinkKeys.map((link) => {
            const isActive = activeSection === link.href.replace('#', '');
            return (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className={cn(
                  'relative rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200',
                  isActive
                    ? 'text-gold'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                {t(link.key)}
                {isActive && (
                  <motion.span
                    layoutId="activeNavUnderline"
                    className="absolute bottom-0.5 left-3 right-3 h-[2px] rounded-full bg-gradient-to-l from-gold-light via-gold to-gold-dark"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Actions ── */}
        <div className="flex items-center gap-2">
          {/* Language Switcher (desktop) */}
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={handleToggleTheme}
              className={cn(
                'flex size-9 items-center justify-center rounded-lg transition-all duration-200',
                'text-muted-foreground hover:bg-muted hover:text-foreground',
                scrolled && 'hover:bg-gold/10 hover:text-gold',
              )}
              aria-label={isDark ? t('nav.lightMode') : t('nav.darkMode')}
            >
              <AnimatePresence mode="wait">
                {isDark ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="size-[18px] text-gold" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="size-[18px]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          )}

          {/* Login button (desktop) */}
          <Button
            onClick={onLogin}
            className={cn(
              'hidden h-9 rounded-xl px-5 text-sm font-bold text-gray-950',
              'bg-gradient-to-l from-gold-dark via-gold to-gold-light',
              'shadow-md shadow-gold/20 transition-all duration-300',
              'hover:shadow-lg hover:shadow-gold/30 hover:scale-[1.03]',
              'active:scale-[0.97]',
              'btn-gold-shine sm:flex',
            )}
          >
            <LogIn className="size-4 ml-1.5" />
            {t('nav.loginRegister')}
          </Button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn(
              'flex size-9 items-center justify-center rounded-lg transition-all duration-200',
              'text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden',
              mobileMenuOpen && 'bg-gold/10 text-gold',
            )}
            aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.div
              key="mobile-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              dir="rtl"
              className="fixed top-0 right-0 bottom-0 z-50 w-72 overflow-y-auto border-l border-gold/10 lg:hidden"
              style={{
                background: 'oklch(0.08 0.005 280 / 85%)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
              }}
            >
              <div className="h-1 w-full bg-gradient-to-l from-gold-dark via-gold to-gold-light" />

              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold-light via-gold to-gold-dark">
                    <span className="text-sm font-black text-gray-950">ز</span>
                  </div>
                  <span className="gold-gradient-text text-lg font-extrabold">
                    {t('common.zarrinGold')}
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-gold/10 hover:text-gold"
                  aria-label={t('nav.closeMenu')}
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mx-5 h-px bg-gradient-to-l from-transparent via-gold/15 to-transparent" />

              {/* Theme toggle */}
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm font-medium text-muted-foreground">
                  {isDark ? t('nav.darkMode') : t('nav.lightMode')}
                </span>
                {mounted && (
                  <button
                    onClick={handleToggleTheme}
                    className="flex size-9 items-center justify-center rounded-lg bg-white/5 text-muted-foreground transition-all duration-200 hover:bg-gold/10 hover:text-gold"
                    aria-label={isDark ? t('nav.lightMode') : t('nav.darkMode')}
                  >
                    {isDark ? <Sun className="size-4 text-gold" /> : <Moon className="size-4" />}
                  </button>
                )}
              </div>

              {/* Language Switcher */}
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm font-medium text-muted-foreground">
                  {t('nav.language')}
                </span>
                <LanguageSwitcher />
              </div>

              <div className="mx-5 h-px bg-gradient-to-l from-transparent via-gold/15 to-transparent" />

              {/* Nav links */}
              <div className="space-y-1 px-4 pb-4 pt-2">
                {navLinkKeys.map((link) => {
                  const isActive = activeSection === link.href.replace('#', '');
                  return (
                    <button
                      key={link.href}
                      onClick={() => handleNavClick(link.href)}
                      className={cn(
                        'flex w-full items-center rounded-xl px-4 py-3 text-right text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-gold/10 text-gold shadow-sm shadow-gold/5'
                          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                      )}
                    >
                      {t(link.key)}
                      {isActive && (
                        <span className="mr-auto ml-2 size-1.5 rounded-full bg-gold gold-pulse" />
                      )}
                    </button>
                  );
                })}

                {/* Login CTA */}
                <div className="pt-4">
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogin();
                    }}
                    className="w-full h-11 rounded-xl text-sm font-bold text-gray-950 bg-gradient-to-l from-gold-dark via-gold to-gold-light shadow-lg shadow-gold/20"
                  >
                    <LogIn className="size-4 ml-2" />
                    {t('nav.loginRegister')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
    </>
  );
}

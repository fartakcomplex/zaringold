'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import { Menu, X, LogIn, Moon, Sun, PartyPopper, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const { t, dir } = useTranslation();

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
          dir={dir}
          className={cn(
            'fixed top-0 left-0 right-0 z-[60]',
            'bg-gradient-to-r from-gold/10 via-gold/[0.07] to-gold/5',
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
              {t('banner.text')}
            </p>
            <button
              onClick={() => setBannerVisible(false)}
              className={cn(
                'mr-2 flex size-6 shrink-0 items-center justify-center rounded-md',
                'text-gold/60 transition-all duration-200',
                'hover:bg-gold/15 hover:text-gold',
              )}
              aria-label={t('footer.closeBanner')}
            >
              <X className="size-3.5" />
            </button>
          </div>
          {/* Gold bottom glow line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </motion.div>
      )}
    </AnimatePresence>

    {/* ── Main Header ── */}
    <motion.header
      dir={dir}
      style={{ top: bannerVisible ? 40 : 0 }}
      className={cn(
        'fixed left-0 right-0 z-50 transition-all duration-500 ease-out',
        scrolled
          ? 'bg-background/60 backdrop-blur-2xl shadow-xl shadow-black/[0.04] border-b border-gold/8'
          : 'bg-transparent',
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Animated gold glow line at bottom when scrolled */}
      {scrolled && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
          {/* Static gradient base */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          {/* Animated sweeping highlight */}
          <div
            className="absolute inset-0 animate-[nav-gold-glow_2.5s_ease-in-out_infinite]"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, oklch(0.75 0.15 85 / 60%) 50%, transparent 100%)',
              transform: 'translateX(-100%)',
              animation: 'nav-gold-glow 2.5s ease-in-out infinite',
            }}
          />
        </div>
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
            'relative flex size-9 items-center justify-center rounded-xl transition-all duration-500',
            scrolled
              ? 'bg-gradient-to-br from-gold via-gold to-gold-dark shadow-lg shadow-gold/25 scale-105'
              : 'bg-gradient-to-br from-gold-light via-gold to-gold-dark shadow-md shadow-gold/15',
          )}>
            <span className="text-base font-black text-gray-950">{t('logo.letter')}</span>
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
                  'relative rounded-xl px-3.5 py-2 text-[13px] font-medium transition-all duration-300',
                  isActive
                    ? 'text-gold'
                    : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                )}
              >
                {/* Active pill background */}
                {isActive && (
                  <motion.span
                    layoutId="activeNavPill"
                    className="absolute inset-0 rounded-xl bg-gold/8 border border-gold/15"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t(link.key)}</span>
                {/* Active underline */}
                {isActive && (
                  <motion.span
                    layoutId="activeNavUnderline"
                    className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-gold-light via-gold to-gold-dark"
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
                'relative flex size-9 items-center justify-center rounded-xl transition-all duration-300',
                'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
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
                    transition={{ duration: 0.25 }}
                  >
                    <Sun className="size-[18px] text-gold" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Moon className="size-[18px]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          )}

          {/* Login button (desktop) — Enhanced gold gradient */}
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="hidden sm:flex"
          >
            <Button
              onClick={onLogin}
              className={cn(
                'relative h-9 overflow-hidden rounded-xl px-5 text-sm font-bold text-gray-950',
                'bg-gradient-to-r from-gold-dark via-gold to-gold-light',
                'shadow-lg shadow-gold/20 transition-all duration-300',
                'hover:shadow-xl hover:shadow-gold/35',
                'active:scale-[0.97]',
                'group',
              )}
            >
              {/* Shine sweep effect */}
              <span className="absolute inset-0 overflow-hidden rounded-xl">
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </span>
              <LogIn className="relative z-10 size-4 ml-1.5" />
              <span className="relative z-10">{t('nav.loginRegister')}</span>
            </Button>
          </motion.div>

          {/* Mobile hamburger — Enhanced */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn(
              'relative flex size-10 items-center justify-center rounded-xl transition-all duration-300',
              'text-muted-foreground hover:bg-muted/60 hover:text-foreground lg:hidden',
              'border border-transparent',
              mobileMenuOpen
                ? 'bg-gold/10 text-gold border-gold/15 shadow-sm shadow-gold/5'
                : scrolled && 'border-border/50',
            )}
            aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          >
            <AnimatePresence mode="wait">
              {mobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="size-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="size-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Panel */}
            <motion.div
              key="mobile-panel"
              initial={{ x: dir === 'rtl' ? '100%' : '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: dir === 'rtl' ? '100%' : '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              dir={dir}
              className={cn(
                'fixed top-0 start-0 bottom-0 z-50 w-[85vw] max-w-[360px] overflow-y-auto lg:hidden',
                'border-s border-gold/10',
              )}
              style={{
                background: 'oklch(0.955 0.01 85 / 96%)',
                backdropFilter: 'blur(32px) saturate(200%)',
                WebkitBackdropFilter: 'blur(32px) saturate(200%)',
              }}
            >
              {/* Top gold gradient bar */}
              <div className="relative h-1 w-full overflow-hidden bg-gradient-to-r from-gold-dark via-gold to-gold-light">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: 'shimmer-border-anim 3s ease-in-out infinite' }} />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-5">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-light via-gold to-gold-dark shadow-lg shadow-gold/20">
                    <span className="text-sm font-black text-gray-950">{t('logo.letter')}</span>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
                  </div>
                  <div>
                    <span className="gold-gradient-text text-lg font-extrabold">
                      {t('common.zarrinGold')}
                    </span>
                    <p className="text-[9px] font-medium tracking-wider text-gray-500 uppercase">
                      {t('footer.goldTrading')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex size-8 items-center justify-center rounded-lg border border-gold/10 text-gray-600 transition-all duration-200 hover:bg-gold/10 hover:text-gold hover:border-gold/20"
                  aria-label={t('nav.closeMenu')}
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mx-5 h-px bg-gradient-to-r from-transparent via-gold/15 to-transparent" />

              {/* Settings row */}
              <div className="flex gap-2 px-5 py-3">
                {/* Theme toggle */}
                {mounted && (
                  <button
                    onClick={handleToggleTheme}
                    className={cn(
                      'flex flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2.5',
                      'border border-border/50 bg-muted/30 text-sm text-gray-700',
                      'transition-all duration-200 hover:bg-gold/8 hover:text-gold hover:border-gold/15',
                    )}
                  >
                    {isDark ? <Sun className="size-4 text-gold" /> : <Moon className="size-4" />}
                    {isDark ? t('nav.darkMode') : t('nav.lightMode')}
                  </button>
                )}
                {/* Language Switcher */}
                <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-border/50 bg-muted/30 px-3.5 py-2">
                  <span className="text-sm text-gray-700">{t('nav.language')}</span>
                  <LanguageSwitcher />
                </div>
              </div>

              <div className="mx-5 h-px bg-gradient-to-r from-transparent via-gold/15 to-transparent" />

              {/* Nav links */}
              <div className="space-y-1 px-4 pb-4 pt-3">
                {navLinkKeys.map((link, index) => {
                  const isActive = activeSection === link.href.replace('#', '');
                  return (
                    <motion.button
                      key={link.href}
                      onClick={() => handleNavClick(link.href)}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.05 }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-xl px-4 py-3 text-right text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-gold/15 to-gold/5 text-gold shadow-sm shadow-gold/5 border border-gold/10'
                          : 'text-gray-700 hover:bg-muted/40 hover:text-gray-900 border border-transparent',
                      )}
                    >
                      <span>{t(link.key)}</span>
                      {isActive ? (
                        <span className="size-1.5 rounded-full bg-gold gold-pulse" />
                      ) : dir === 'rtl' ? (
                        <ChevronLeft className="size-3.5 opacity-30" />
                      ) : (
                        <ChevronRight className="size-3.5 opacity-30" />
                      )}
                    </motion.button>
                  );
                })}

                <div className="mx-4 my-4 h-px bg-gradient-to-r from-transparent via-gold/10 to-transparent" />

                {/* Login CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogin();
                    }}
                    className={cn(
                      'relative w-full h-12 overflow-hidden rounded-xl text-sm font-bold text-gray-950',
                      'bg-gradient-to-r from-gold-dark via-gold to-gold-light',
                      'shadow-lg shadow-gold/25',
                    )}
                  >
                    {/* Shine sweep */}
                    <span className="absolute inset-0 overflow-hidden rounded-xl">
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 hover:translate-x-full" />
                    </span>
                    <LogIn className="relative z-10 size-4 ml-2" />
                    <span className="relative z-10">{t('nav.loginRegister')}</span>
                  </Button>
                </motion.div>

                {/* Decorative bottom element */}
                <div className="mt-6 flex items-center justify-center gap-2 pb-2">
                  <div className="size-1 rounded-full bg-gold/30" />
                  <div className="h-px w-12 bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
                  <div className="size-1.5 rounded-full bg-gold/20" />
                  <div className="h-px w-12 bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
                  <div className="size-1 rounded-full bg-gold/30" />
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

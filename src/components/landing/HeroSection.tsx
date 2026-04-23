'use client';

import { motion } from '@/lib/framer-compat';
import { ArrowLeft, Shield, TrendingUp, Users, Clock, CircleDot } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HeroSection — Landing page hero for Zarrin Gold (زرین گلد)              */
/*  Dark-gold-blur theme · Mobile-first · Persian RTL                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface HeroSectionProps {
  onGetStarted: () => void;
}

/* ── Mock ticker data ── */
const TICKER_ITEMS = [
  { key: 'landing.secCoin', price: '۳۵,۲۰۰,۰۰۰', change: '+۱.۲٪', up: true },
  { key: 'landing.halfCoin', price: '۱۹,۸۵۰,۰۰۰', change: '+۰.۸٪', up: true },
  { key: 'landing.gold18', price: '۳,۲۵۰,۰۰۰', change: '-۰.۳٪', up: false },
  { key: 'landing.globalOunce', price: '$2,350', change: '+۰.۵٪', up: true },
] as const;

/* ── Stats data ── */
const STATS = [
  {
    icon: Users,
    valueKey: 'landing.statUsersValue',
    labelKey: 'landing.statUsersLabel',
  },
  {
    icon: TrendingUp,
    valueKey: 'landing.statTradeValue',
    labelKey: 'landing.statTradeLabel',
  },
  {
    icon: Clock,
    valueKey: 'landing.statUptimeValue',
    labelKey: 'landing.statUptimeLabel',
  },
] as const;

/* ── Sparkle positions (absolute within hero) ── */
const SPARKLES = [
  { top: '12%', left: '8%', delay: '0s', size: '6px' },
  { top: '25%', left: '85%', delay: '1.2s', size: '4px' },
  { top: '45%', left: '15%', delay: '2.5s', size: '5px' },
  { top: '60%', left: '78%', delay: '0.7s', size: '3px' },
  { top: '80%', left: '30%', delay: '1.8s', size: '5px' },
  { top: '15%', left: '55%', delay: '3.1s', size: '4px' },
  { top: '70%', left: '65%', delay: '0.4s', size: '6px' },
  { top: '35%', left: '92%', delay: '2.0s', size: '3px' },
] as const;

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  const { t } = useTranslation();

  return (
    <section
      id="hero"
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-background pt-32 sm:pt-40 pb-16 sm:pb-24"
    >
      {/* ══════ Background layers ══════ */}
      {/* Radial gold glow */}
      <div
        className="pointer-events-none absolute inset-0 radial-gold-fade"
        aria-hidden="true"
      />

      {/* Secondary glow offset */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 30% 20%, oklch(0.75 0.15 85 / 6%) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" aria-hidden="true" />

      {/* Gold sparkle particles */}
      {SPARKLES.map((s, i) => (
        <div
          key={i}
          className="gold-sparkle"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
          }}
          aria-hidden="true"
        />
      ))}

      {/* ══════ Main content ══════ */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        {/* ── Trust badge ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 sm:mb-8"
        >
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2',
              'border border-gold/20 bg-gold/5 backdrop-blur-md',
              'dark:border-gold/15 dark:bg-gold/8',
              'transition-all duration-300 hover:border-gold/30 hover:bg-gold/8',
            )}
          >
            <Shield className="size-4 text-gold" />
            <span className="text-xs sm:text-sm font-medium text-gold">
              {t('landing.badge')}
            </span>
          </div>
        </motion.div>

        {/* ── Main heading ── */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="gold-gradient-text gold-text-shadow text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-4 sm:mb-6"
        >
          {t('landing.heroTitle')}
        </motion.h1>

        {/* ── Subtitle ── */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed mb-8 sm:mb-10"
        >
          {t('landing.heroSubtitle')}
        </motion.p>

        {/* ── CTA Buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto mb-10 sm:mb-14"
        >
          {/* Primary CTA */}
          <button
            onClick={onGetStarted}
            className={cn(
              'btn-gold-gradient btn-gold-shine cta-pulse-ring',
              'relative w-full sm:w-auto rounded-xl px-8 py-3.5',
              'text-base font-bold text-gray-950',
              'shadow-lg shadow-gold/25 transition-all duration-300',
              'hover:shadow-xl hover:shadow-gold/35 hover:scale-[1.03]',
              'active:scale-[0.97]',
              'flex items-center justify-center gap-2',
            )}
          >
            {t('landing.getStarted')}
            <ArrowLeft className="size-4" />
          </button>

          {/* Secondary CTA */}
          <button
            className={cn(
              'btn-gold-outline relative w-full sm:w-auto rounded-xl px-8 py-3.5',
              'text-base font-semibold text-gold',
              'border border-gold/25 bg-transparent',
              'transition-all duration-300',
              'hover:border-gold/50 hover:bg-gold/5',
              'active:scale-[0.97]',
              'flex items-center justify-center gap-2',
            )}
          >
            {t('landing.learnMore')}
          </button>
        </motion.div>

        {/* ── Live Price Ticker ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="w-full mb-10 sm:mb-14"
        >
          <div
            className={cn(
              'ticker-gold-glow glass-gold rounded-2xl p-1.5 sm:p-2',
              'border border-gold/15 overflow-hidden',
            )}
          >
            {/* Ticker header */}
            <div className="flex items-center justify-between px-3 sm:px-4 mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-gold" />
                <span className="text-xs sm:text-sm font-bold text-gold gold-gradient-text">
                  {t('landing.livePrices')}
                </span>
              </div>
              {/* Live badge */}
              <div
                className={cn(
                  'gold-pulse flex items-center gap-1.5',
                  'rounded-full px-2.5 py-1',
                  'bg-emerald-500/10 border border-emerald-500/20',
                )}
              >
                <CircleDot className="size-2.5 text-emerald-400 fill-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-400">
                  {t('common.live')}
                </span>
              </div>
            </div>

            {/* Ticker items grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {TICKER_ITEMS.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.8 + i * 0.08 }}
                  className={cn(
                    'stat-glow rounded-xl p-2.5 sm:p-3 text-center',
                    'bg-background/30 backdrop-blur-sm',
                    'border border-gold/8 transition-all duration-200',
                  )}
                >
                  <div className="text-[11px] sm:text-xs text-muted-foreground font-medium mb-1 truncate">
                    {t(item.key)}
                  </div>
                  <div className="text-gold-gradient text-sm sm:text-base font-black tabular-nums leading-tight">
                    {item.price}
                  </div>
                  <div
                    className={cn(
                      'text-[10px] sm:text-xs font-bold mt-1',
                      item.up ? 'text-emerald-400' : 'text-red-400',
                    )}
                  >
                    {item.change}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Gold separator line ── */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="w-full max-w-md mb-10 sm:mb-14"
        >
          <div className="gold-separator h-px w-full" />
        </motion.div>

        {/* ── Stats bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="w-full"
        >
          <div
            className={cn(
              'glass-gold rounded-2xl p-4 sm:p-6',
              'border border-gold/10',
            )}
          >
            <div className="grid grid-cols-3 gap-3 sm:gap-6">
              {STATS.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1.1 + i * 0.1 }}
                  className="flex flex-col items-center gap-1.5 sm:gap-2"
                >
                  <stat.icon className="size-5 sm:size-6 text-gold/60" />
                  <span className="text-gold-gradient text-lg sm:text-2xl font-black tabular-nums leading-none">
                    {t(stat.valueKey)}
                  </span>
                  <span className="text-[11px] sm:text-xs text-muted-foreground font-medium text-center leading-tight">
                    {t(stat.labelKey)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ══════ Decorative gold coin (desktop only) ══════ */}
      <div className="absolute top-1/2 left-4 lg:left-8 -translate-y-1/2 hidden lg:block pointer-events-none" aria-hidden="true">
        <motion.div
          initial={{ opacity: 0, x: -60, rotate: -20 }}
          animate={{ opacity: 1, x: 0, rotate: -12 }}
          transition={{ duration: 1.0, delay: 1.2 }}
          className="relative"
        >
          {/* Outer glow */}
          <div
            className="absolute -inset-6 rounded-full opacity-30 blur-2xl"
            style={{ background: 'radial-gradient(circle, oklch(0.75 0.15 85 / 40%) 0%, transparent 70%)' }}
          />

          {/* Coin body */}
          <div className="gold-coin relative">
            <div
              className={cn(
                'flex items-center justify-center',
                'w-36 h-36 rounded-full',
                'border-2 border-gold/30',
                'bg-gradient-to-br from-gold-light via-gold to-gold-dark',
                'shadow-2xl shadow-gold/20',
              )}
            >
              {/* Inner ring */}
              <div
                className={cn(
                  'absolute inset-3 rounded-full',
                  'border border-gold-dark/30',
                  'bg-gradient-to-br from-gold-light/20 to-gold-dark/20',
                )}
              >
                {/* Coin text */}
                <div className="flex items-center justify-center w-full h-full">
                  <span className="gold-coin-inner text-3xl font-black text-gold-dark/70 select-none">
                    زرین
                  </span>
                </div>
              </div>

              {/* Shine highlight */}
              <div
                className="absolute top-3 right-4 w-10 h-6 rounded-full bg-white/30 blur-sm rotate-[-30deg]"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ══════ Bottom fade to background ══════ */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
        style={{
          background: 'linear-gradient(to top, var(--background) 0%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* ══════ Top-right decorative floating element ══════ */}
      <div className="absolute top-40 right-8 hidden xl:block pointer-events-none" aria-hidden="true">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.5 }}
          className="float-animation-slow"
        >
          <div
            className={cn(
              'w-20 h-20 rounded-2xl',
              'border border-gold/10',
              'bg-gradient-to-br from-gold/5 to-transparent',
              'backdrop-blur-sm',
              'flex items-center justify-center',
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
              <TrendingUp className="size-4 text-gold/40" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

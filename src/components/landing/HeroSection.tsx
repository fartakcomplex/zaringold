'use client';

import React from 'react';
import { motion } from '@/lib/framer-compat';
import {
  ArrowLeft,
  Shield,
  TrendingUp,
  Clock,
  CircleDot,
  Zap,
  Lock,
  Coins,
  Sparkles,
  Gem,
  Star,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HeroSection — DRAMATICALLY Redesigned Premium Landing Hero               */
/*  Stripe/Apple quality · Mobile-first · Persian RTL · Gold theme           */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface HeroSectionProps {
  onGetStarted: () => void;
}



/* ── Ticker data ── */
const TICKER_ITEMS = [
  { key: 'landing.secCoin', price: '۳۵,۲۰۰,۰۰۰', change: '+۱.۲٪', up: true },
  { key: 'landing.halfCoin', price: '۱۹,۸۵۰,۰۰۰', change: '+۰.۸٪', up: true },
  { key: 'landing.gold18', price: '۳,۲۵۰,۰۰۰', change: '-۰.۳٪', up: false },
  { key: 'landing.globalOunce', price: '$2,350', change: '+۰.۵٪', up: true },
] as const;



/* ── Feature highlights ── */
const FEATURES = [
  { icon: Shield, titleKey: 'landing.featSecure', descKey: 'landing.featSecureDesc' },
  { icon: Zap, titleKey: 'landing.featFast', descKey: 'landing.featFastDesc' },
  { icon: Coins, titleKey: 'landing.featLowFee', descKey: 'landing.featLowFeeDesc' },
  { icon: Clock, titleKey: 'landing.featSupport', descKey: 'landing.featSupportDesc' },
] as const;

/* ── 22 Sparkle positions with varied sizes ── */
const SPARKLES = [
  { top: '6%', left: '4%', delay: '0s', size: '4px' },
  { top: '10%', left: '20%', delay: '0.8s', size: '3px' },
  { top: '5%', left: '42%', delay: '1.6s', size: '6px' },
  { top: '8%', left: '65%', delay: '0.3s', size: '3px' },
  { top: '14%', left: '85%', delay: '2.1s', size: '5px' },
  { top: '20%', left: '10%', delay: '1.3s', size: '7px' },
  { top: '26%', left: '33%', delay: '0.5s', size: '3px' },
  { top: '24%', left: '76%', delay: '2.4s', size: '5px' },
  { top: '33%', left: '6%', delay: '1.8s', size: '4px' },
  { top: '38%', left: '50%', delay: '0.2s', size: '6px' },
  { top: '36%', left: '88%', delay: '1.1s', size: '4px' },
  { top: '48%', left: '16%', delay: '2.7s', size: '5px' },
  { top: '53%', left: '62%', delay: '0.6s', size: '3px' },
  { top: '46%', left: '80%', delay: '1.5s', size: '7px' },
  { top: '58%', left: '4%', delay: '0.9s', size: '4px' },
  { top: '63%', left: '40%', delay: '2.0s', size: '5px' },
  { top: '68%', left: '72%', delay: '0.4s', size: '3px' },
  { top: '70%', left: '26%', delay: '1.7s', size: '6px' },
  { top: '76%', left: '55%', delay: '2.3s', size: '4px' },
  { top: '80%', left: '13%', delay: '0.7s', size: '5px' },
  { top: '84%', left: '83%', delay: '1.4s', size: '3px' },
  { top: '92%', left: '38%', delay: '2.6s', size: '6px' },
] as const;

/* ── Large gradient orbs (purple/blue/gold/teal) ── */
const ORBS = [
  {
    top: '-15%',
    right: '-8%',
    size: 'min(600px, 70vw)',
    gradient: 'radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, rgba(139, 92, 246, 0.06) 40%, transparent 70%)',
    blur: '90px',
    animName: 'hero-orb-1',
    animDur: '20s',
  },
  {
    top: '15%',
    left: '-12%',
    size: 'min(550px, 65vw)',
    gradient: 'radial-gradient(circle, rgba(59, 130, 246, 0.14) 0%, rgba(59, 130, 246, 0.04) 40%, transparent 70%)',
    blur: '85px',
    animName: 'hero-orb-2',
    animDur: '25s',
  },
  {
    bottom: '5%',
    right: '5%',
    size: 'min(500px, 60vw)',
    gradient: 'radial-gradient(circle, rgba(212, 175, 55, 0.16) 0%, rgba(240, 208, 96, 0.06) 40%, transparent 70%)',
    blur: '80px',
    animName: 'hero-orb-3',
    animDur: '22s',
  },
  {
    top: '55%',
    left: '25%',
    size: 'min(420px, 50vw)',
    gradient: 'radial-gradient(circle, rgba(20, 184, 166, 0.10) 0%, rgba(20, 184, 166, 0.03) 40%, transparent 70%)',
    blur: '75px',
    animName: 'hero-orb-4',
    animDur: '28s',
  },
] as const;

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  const { t } = useTranslation();



  return (
    <>
      {/* ═══ Inline keyframes for all animations ═══ */}
      <style>{`
        /* ── Orb float animations ── */
        @keyframes hero-orb-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-40px, 50px) scale(1.08); }
          50% { transform: translate(30px, -25px) scale(0.94); }
          75% { transform: translate(-15px, 35px) scale(1.04); }
        }
        @keyframes hero-orb-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(50px, -40px) scale(1.06); }
          50% { transform: translate(-25px, 30px) scale(0.95); }
          75% { transform: translate(35px, -15px) scale(1.08); }
        }
        @keyframes hero-orb-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-35px, -45px) scale(1.05); }
          50% { transform: translate(20px, 30px) scale(0.94); }
          75% { transform: translate(-40px, 20px) scale(1.06); }
        }
        @keyframes hero-orb-4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, 35px) scale(1.07); }
          66% { transform: translate(-35px, -20px) scale(0.93); }
        }

        /* ── Coin animations ── */
        @keyframes coin-float-3d {
          0%, 100% { transform: translateY(0px) rotateY(-15deg) rotateX(5deg); }
          50% { transform: translateY(-18px) rotateY(-15deg) rotateX(-5deg); }
        }
        @keyframes coin-shimmer {
          0% { transform: translateX(-150%) rotate(-25deg); }
          100% { transform: translateX(250%) rotate(-25deg); }
        }
        @keyframes coin-ring-rotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes coin-pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.08); }
        }

        /* ── Badge glow ── */
        @keyframes hero-badge-glow {
          0%, 100% { box-shadow: 0 0 15px rgba(212,175,55,0.08), 0 0 30px rgba(212,175,55,0.04), inset 0 0 20px rgba(212,175,55,0.03); }
          50% { box-shadow: 0 0 25px rgba(212,175,55,0.18), 0 0 50px rgba(212,175,55,0.08), inset 0 0 30px rgba(212,175,55,0.06); }
        }

        /* ── Ticker animated border ── */
        @keyframes ticker-border-spin {
          0% { --border-angle: 0deg; }
          100% { --border-angle: 360deg; }
        }
        @keyframes ticker-shine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }



        /* ── CTA dramatic glow ── */
        @keyframes cta-dramatic-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(212,175,55,0.25), 0 0 40px rgba(212,175,55,0.1), 0 0 80px rgba(212,175,55,0.05);
          }
          50% { 
            box-shadow: 0 0 30px rgba(212,175,55,0.4), 0 0 60px rgba(212,175,55,0.15), 0 0 120px rgba(212,175,55,0.08);
          }
        }

        /* ── Floating decorative element ── */
        @keyframes float-decor-1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(5deg); }
        }
        @keyframes float-decor-2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
        }

        /* ── Mesh pattern line ── */
        @keyframes mesh-line-flow {
          0% { opacity: 0.03; }
          50% { opacity: 0.08; }
          100% { opacity: 0.03; }
        }

        /* ── Heading text shimmer ── */
        @keyframes heading-shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <section
        id="hero"
        dir="rtl"
        className="relative min-h-screen overflow-hidden bg-background pt-24 sm:pt-32 md:pt-36 pb-20 sm:pb-28"
      >
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  BACKGROUND LAYERS — Rich, multi-layered depth                         */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        {/* Base radial gold glow */}
        <div className="pointer-events-none absolute inset-0 radial-gold-fade" aria-hidden="true" />

        {/* Secondary offset warm glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 65% 15%, oklch(0.75 0.15 85 / 10%) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />

        {/* Third cool accent glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 50% 50% at 20% 80%, oklch(0.65 0.15 260 / 5%) 0%, transparent 60%)',
          }}
          aria-hidden="true"
        />

        {/* ── 4 Large animated gradient orbs (purple/blue/gold/teal) ── */}
        {ORBS.map((orb, i) => (
          <div
            key={i}
            className="pointer-events-none absolute"
            style={{
              top: orb.top,
              left: 'left' in orb ? orb.left : undefined,
              right: 'right' in orb ? orb.right : undefined,
              bottom: 'bottom' in orb ? orb.bottom : undefined,
              width: orb.size,
              height: orb.size,
              borderRadius: '50%',
              background: orb.gradient,
              filter: `blur(${orb.blur})`,
              animation: `${orb.animName} ${orb.animDur} ease-in-out infinite`,
            }}
            aria-hidden="true"
          />
        ))}

        {/* Decorative mesh/grid pattern overlay */}
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-20" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 dot-pattern opacity-15" aria-hidden="true" />

        {/* Subtle noise texture */}
        <div className="pointer-events-none absolute inset-0 noise-bg opacity-30" aria-hidden="true" />

        {/* ── 22 Gold sparkle particles spread across the section ── */}
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

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  DRAMATIC 3D GOLD COIN — Left side (visible on all screens)          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div
          className="pointer-events-none absolute top-20 sm:top-24 md:top-28 left-2 sm:left-6 lg:left-10 xl:left-16 z-10"
          aria-hidden="true"
        >
          <motion.div
            initial={{ opacity: 0, x: -60, scale: 0.6 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.8 }}
          >
            <div
              className="relative"
              style={{ animation: 'coin-float-3d 6s ease-in-out infinite' }}
            >
              {/* Coin container — 90px mobile, 140px sm, 200px lg, 240px xl */}
              <div className="relative w-[90px] h-[90px] sm:w-[140px] sm:h-[140px] lg:w-[200px] lg:h-[200px] xl:w-[240px] xl:h-[240px]">
                
                {/* Outer ambient pulse glow */}
                <div
                  className="absolute -inset-6 sm:-inset-8 lg:-inset-12 xl:-inset-16 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(212,175,55,0.35) 0%, rgba(240,208,96,0.15) 30%, rgba(139,92,246,0.05) 50%, transparent 70%)',
                    animation: 'coin-pulse-glow 4s ease-in-out infinite',
                  }}
                />

                {/* Rotating dashed outer ring (desktop only) */}
                <div
                  className="hidden lg:block absolute rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                    width: 'calc(100% + 40px)',
                    height: 'calc(100% + 40px)',
                    border: '1px dashed rgba(212,175,55,0.15)',
                    animation: 'coin-ring-rotate 30s linear infinite',
                  }}
                />

                {/* Counter-rotating dotted outer ring */}
                <div
                  className="hidden xl:block absolute rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                    width: 'calc(100% + 70px)',
                    height: 'calc(100% + 70px)',
                    border: '1px dotted rgba(212,175,55,0.08)',
                    animation: 'coin-ring-rotate 45s linear infinite reverse',
                  }}
                />

                {/* Main coin body */}
                <div
                  className={cn(
                    'relative w-full h-full rounded-full',
                    'border-[3px] sm:border-4 lg:border-[5px] border-gold/30',
                    'bg-gradient-to-br from-gold-light via-gold to-gold-dark',
                    'shadow-[0_0_60px_rgba(212,175,55,0.35),0_0_120px_rgba(212,175,55,0.1),inset_0_3px_6px_rgba(255,255,255,0.35),inset_0_-3px_6px_rgba(0,0,0,0.2)]',
                  )}
                >
                  {/* Outer decorative ring */}
                  <div
                    className={cn(
                      'absolute inset-1.5 sm:inset-2 lg:inset-3 rounded-full',
                      'border border-gold-dark/20',
                    )}
                  >
                    {/* Beaded ring (subtle dots around circumference) */}
                    <div
                      className={cn(
                        'absolute inset-1 sm:inset-1.5 lg:inset-2 rounded-full',
                        'border border-gold-light/15',
                        'bg-gradient-to-br from-gold-light/10 via-transparent to-gold-dark/10',
                      )}
                    >
                      {/* Inner accent ring */}
                      <div
                        className={cn(
                          'absolute inset-2 sm:inset-2.5 lg:inset-4 rounded-full',
                          'border border-gold/10',
                        )}
                      >
                        {/* Innermost ring */}
                        <div
                          className={cn(
                            'absolute inset-1 sm:inset-1.5 lg:inset-2 rounded-full',
                            'border border-gold-dark/8',
                          )}
                        >
                          {/* Coin face */}
                          <div className="flex flex-col items-center justify-center w-full h-full gap-0.5">
                            {/* Large decorative "Z" or "زرین" */}
                            <span
                              className={cn(
                                'gold-coin-inner font-black text-gold-dark/60 select-none',
                                'text-2xl sm:text-3xl lg:text-5xl xl:text-6xl',
                                'drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]',
                              )}
                            >
                              Z
                            </span>
                            {/* Sub-text */}
                            <span
                              className="text-gold-dark/40 font-bold text-[7px] sm:text-[9px] lg:text-xs tracking-wider"
                            >
                              ZARRIN GOLD
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Multi-layer shimmer sweep */}
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 w-1/3 h-full"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                        animation: 'coin-shimmer 3.5s ease-in-out infinite',
                      }}
                    />
                    <div
                      className="absolute top-0 left-0 w-1/4 h-full"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                        animation: 'coin-shimmer 5s ease-in-out infinite reverse',
                      }}
                    />
                  </div>

                  {/* Top specular highlight */}
                  <div
                    className="absolute top-3 right-4 w-10 h-6 sm:w-16 sm:h-9 lg:w-24 lg:h-14 xl:w-28 xl:h-16 rounded-full bg-white/25 blur-sm rotate-[-30deg]"
                  />

                  {/* Secondary highlight arc */}
                  <div
                    className="absolute top-1/4 left-1/4 w-6 h-4 sm:w-10 sm:h-7 lg:w-16 lg:h-10 rounded-full bg-white/10 blur-md rotate-[-45deg]"
                  />

                  {/* Bottom shadow */}
                  <div
                    className="absolute bottom-2 left-4 w-8 h-4 sm:w-12 sm:h-6 lg:w-20 lg:h-10 rounded-full bg-black/10 blur-sm rotate-[-30deg]"
                  />
                </div>

                {/* Orbiting particles (desktop) */}
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="hidden lg:block absolute w-2 h-2 rounded-full bg-gold/40"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      animation: `coin-ring-rotate ${12 + idx * 6}s linear infinite`,
                      transformOrigin: `${90 + idx * 25}px ${90 + idx * 25}px`,
                      boxShadow: '0 0 6px rgba(212,175,55,0.4)',
                      opacity: 0.5 + idx * 0.1,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  MAIN CONTENT                                                       */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">

          {/* ── Trust badge with animated glow border ── */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mb-6 sm:mb-8"
          >
            <div
              className={cn(
                'inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 sm:px-6 sm:py-3',
                'border border-gold/20 bg-gold/[0.06] backdrop-blur-md',
                'transition-all duration-300 hover:border-gold/40 hover:bg-gold/10',
              )}
              style={{ animation: 'hero-badge-glow 3s ease-in-out infinite' }}
            >
              <div className="relative flex items-center justify-center">
                <Shield className="size-4 sm:size-[18px] text-gold" />
                <div className="absolute inset-0 rounded-full bg-gold/20 animate-ping" style={{ animationDuration: '2s' }} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-gold tracking-wide">
                {t('landing.badge')}
              </span>
              <div className="flex items-center gap-1 ml-1 mr-1 sm:mr-2">
                {[0, 1, 2].map((i) => (
                  <Star
                    key={i}
                    className="size-3 text-gold fill-gold/70"
                    style={{ opacity: 0.5 + i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Main heading with shimmer gradient ── */}
          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className={cn(
              'gold-gradient-text gold-text-shadow',
              'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight tracking-tight',
              'mb-4 sm:mb-6 max-w-4xl',
            )}
            style={{
              backgroundSize: '200% auto',
              animation: 'heading-shimmer 6s ease-in-out infinite',
            }}
          >
            {t('landing.heroTitle')}
          </motion.h1>

          {/* ── Subtitle ── */}
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-muted-foreground text-base sm:text-lg md:text-xl lg:text-2xl max-w-2xl leading-relaxed mb-8 sm:mb-10 font-medium"
          >
            {t('landing.heroSubtitle')}
          </motion.p>

          {/* ── CTA Buttons with dramatic glow ── */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 w-full sm:w-auto mb-14 sm:mb-20"
          >
            {/* Primary CTA — multiple glow layers */}
            <div className="cta-pulse-ring w-full sm:w-auto relative">
              {/* Blurred glow backdrop */}
              <div
                className="absolute inset-0 rounded-xl blur-xl opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #F0D060 50%, #D4AF37 100%)',
                  animation: 'cta-dramatic-glow 2.5s ease-in-out infinite',
                }}
              />
              <button
                onClick={onGetStarted}
                className={cn(
                  'btn-gold-gradient btn-gold-shine',
                  'relative w-full sm:w-auto rounded-xl sm:rounded-2xl',
                  'px-8 py-4 sm:px-12 sm:py-5',
                  'text-base sm:text-lg lg:text-xl font-black text-gray-950',
                  'transition-all duration-300',
                  'hover:scale-[1.05] hover:-translate-y-0.5',
                  'active:scale-[0.97]',
                  'flex items-center justify-center gap-2.5',
                  'shadow-[0_0_40px_rgba(212,175,55,0.25),0_0_80px_rgba(212,175,55,0.08)]',
                  'hover:shadow-[0_0_50px_rgba(212,175,55,0.35),0_0_100px_rgba(212,175,55,0.12)]',
                )}
              >
                <Zap className="size-5 sm:size-6" />
                {t('landing.getStarted')}
                <ArrowLeft className="size-4 sm:size-5" />
              </button>
            </div>

            {/* Secondary CTA — glass outline */}
            <button
              className={cn(
                'btn-gold-outline relative w-full sm:w-auto rounded-xl sm:rounded-2xl',
                'px-8 py-4 sm:px-10 sm:py-5',
                'text-base sm:text-lg font-bold text-gold',
                'border border-gold/25 bg-gold/[0.03] backdrop-blur-md',
                'transition-all duration-300',
                'hover:border-gold/50 hover:bg-gold/[0.08] hover:scale-[1.04] hover:-translate-y-0.5',
                'active:scale-[0.97]',
                'flex items-center justify-center gap-2.5',
                'shadow-[0_0_20px_rgba(212,175,55,0.05)]',
                'hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]',
              )}
            >
              <Gem className="size-5 sm:size-6" />
              {t('landing.learnMore')}
            </button>
          </motion.div>

          {/* ── Feature Highlights Grid with card-spotlight ── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="w-full mb-14 sm:mb-20"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {FEATURES.map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
                  className={cn(
                    'card-spotlight group flex flex-col items-center gap-2.5 sm:gap-3',
                    'rounded-2xl p-4 sm:p-5',
                    'border border-gold/[0.08] bg-gold/[0.02] backdrop-blur-sm',
                    'transition-all duration-300',
                    'hover:border-gold/20 hover:bg-gold/[0.06] hover:scale-[1.04] hover:-translate-y-1',
                    'hover:shadow-[0_8px_30px_rgba(212,175,55,0.08)]',
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center',
                      'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl',
                      'bg-gradient-to-br from-gold/15 to-gold/[0.05]',
                      'border border-gold/12',
                      'transition-all duration-300',
                      'group-hover:border-gold/30 group-hover:shadow-lg group-hover:shadow-gold/15 group-hover:scale-110',
                    )}
                  >
                    <feat.icon className="size-5 sm:size-6 text-gold/60 transition-all duration-300 group-hover:text-gold group-hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                    {t(feat.titleKey)}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight hidden sm:block max-w-[120px]">
                    {t(feat.descKey)}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Live Price Ticker with enhanced glass card & animated border ── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.95 }}
            className="w-full mb-14 sm:mb-20"
          >
            {/* Outer animated border wrapper */}
            <div
              className="relative rounded-2xl sm:rounded-3xl p-[1px] overflow-hidden"
              style={{
                background: 'conic-gradient(from 0deg, rgba(212,175,55,0.3), rgba(139,92,246,0.15), rgba(59,130,246,0.1), rgba(212,175,55,0.3))',
                animation: 'ticker-border-spin 8s linear infinite',
              }}
            >
              {/* Inner glass card */}
              <div
                className={cn(
                  'ticker-gold-glow card-glass-premium rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6',
                  'bg-background/90 backdrop-blur-2xl',
                )}
              >
                {/* Ticker header */}
                <div className="flex items-center justify-between px-1 sm:px-2 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <TrendingUp className="size-4 sm:size-5 text-gold" />
                      <div className="absolute -inset-1 bg-gold/10 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                    </div>
                    <span className="text-xs sm:text-sm font-black gold-gradient-text tracking-wide">
                      {t('landing.livePrices')}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-1.5',
                      'rounded-full px-3 py-1',
                      'bg-emerald-500/10 border border-emerald-500/20',
                    )}
                  >
                    <CircleDot className="size-2.5 text-emerald-400 fill-emerald-400" />
                    <span className="text-[11px] sm:text-xs font-bold text-emerald-400">
                      {t('common.live')}
                    </span>
                  </div>
                </div>

                {/* Ticker items grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  {TICKER_ITEMS.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 1.1 + i * 0.1 }}
                      className={cn(
                        'stat-glow rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center',
                        'bg-background/50 backdrop-blur-sm',
                        'border border-gold/[0.08] transition-all duration-200',
                        'hover:border-gold/20 hover:bg-gold/[0.04] hover:shadow-[0_4px_20px_rgba(212,175,55,0.06)]',
                      )}
                    >
                      <div className="text-[11px] sm:text-xs text-muted-foreground font-medium mb-2 truncate">
                        {t(item.key)}
                      </div>
                      <div
                        className="text-sm sm:text-base lg:text-lg font-black tabular-nums leading-tight gold-gradient-text"
                        style={{
                          backgroundSize: '200% auto',
                          animation: 'heading-shimmer 4s ease-in-out infinite',
                        }}
                      >
                        {item.price}
                      </div>
                      <div
                        className={cn(
                          'text-[10px] sm:text-xs font-bold mt-2 flex items-center justify-center gap-1',
                          item.up ? 'text-emerald-400' : 'text-red-400',
                        )}
                      >
                        <TrendingUp
                          className={cn(
                            'size-3',
                            !item.up && 'rotate-180',
                          )}
                        />
                        {item.change}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer note */}
                <p className="mt-4 text-center text-[11px] text-muted-foreground/40 font-medium">
                  {t('landing.pricesLive')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  DECORATIVE FLOATING ELEMENTS (top-right, bottom-right, etc.)        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        {/* Top-right floating glass card */}
        <div
          className="absolute top-40 right-4 sm:right-8 lg:right-12 hidden lg:block pointer-events-none z-10"
          aria-hidden="true"
        >
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.0, delay: 1.5 }}
            style={{ animation: 'float-decor-1 7s ease-in-out infinite' }}
          >
            <div
              className={cn(
                'w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl',
                'border border-gold/10',
                'bg-gradient-to-br from-gold/[0.06] to-purple-500/[0.03]',
                'backdrop-blur-md',
                'flex items-center justify-center',
                'shadow-[0_8px_30px_rgba(0,0,0,0.05)]',
              )}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gold/20 to-purple-500/10 flex items-center justify-center">
                <TrendingUp className="size-5 sm:size-6 text-gold/50" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom-right floating element */}
        <div
          className="absolute bottom-28 right-8 sm:right-16 hidden xl:block pointer-events-none z-10"
          aria-hidden="true"
        >
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.0, delay: 1.8 }}
            style={{ animation: 'float-decor-2 8s ease-in-out infinite' }}
          >
            <div
              className={cn(
                'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl',
                'border border-gold/[0.06]',
                'bg-gradient-to-br from-gold/[0.04] to-blue-500/[0.02]',
                'backdrop-blur-sm',
                'flex items-center justify-center',
              )}
            >
              <Lock className="size-5 sm:size-6 text-gold/30" />
            </div>
          </motion.div>
        </div>

        {/* Top-center-left floating sparkles cluster */}
        <div
          className="absolute top-52 left-[20%] hidden lg:block pointer-events-none z-10"
          aria-hidden="true"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 2.0 }}
            className="float-animation-slow"
          >
            <Sparkles className="size-6 text-gold/20" />
          </motion.div>
        </div>

        {/* Bottom-center floating gem */}
        <div
          className="absolute bottom-44 left-[15%] hidden xl:block pointer-events-none z-10"
          aria-hidden="true"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 2.2 }}
            style={{ animation: 'float-decor-1 9s ease-in-out infinite', animationDelay: '2s' }}
          >
            <div className="w-14 h-14 rounded-xl border border-gold/[0.06] bg-gradient-to-br from-gold/[0.03] to-teal-500/[0.02] backdrop-blur-sm flex items-center justify-center">
              <Gem className="size-5 text-gold/25" />
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  BOTTOM FADE TO BACKGROUND                                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-48"
          style={{
            background: 'linear-gradient(to top, var(--background) 0%, transparent 100%)',
          }}
          aria-hidden="true"
        />

        {/* Top vignette for depth */}
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-32"
          style={{
            background: 'linear-gradient(to bottom, var(--background) 0%, transparent 100%)',
            opacity: 0.5,
          }}
          aria-hidden="true"
        />
      </section>
    </>
  );
}

'use client';

import React from 'react';
import { motion } from '@/lib/framer-compat';
import { useTranslation } from '@/lib/i18n';
import {
  UserPlus,
  ShieldCheck,
  Wallet,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════ */
/*  Step data                                                               */
/* ═══════════════════════════════════════════════════════════════ */

interface StepItem {
  number: number;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
}

const steps: StepItem[] = [
  {
    number: 1,
    titleKey: 'howItWorks.step1.title',
    descKey: 'howItWorks.step1.desc',
    icon: UserPlus,
  },
  {
    number: 2,
    titleKey: 'howItWorks.step2.title',
    descKey: 'howItWorks.step2.desc',
    icon: ShieldCheck,
  },
  {
    number: 3,
    titleKey: 'howItWorks.step3.title',
    descKey: 'howItWorks.step3.desc',
    icon: Wallet,
  },
  {
    number: 4,
    titleKey: 'howItWorks.step4.title',
    descKey: 'howItWorks.step4.desc',
    icon: TrendingUp,
  },
];

/* ═══════════════════════════════════════════════════════════════ */
/*  Animated Step Number Circle                                              */
/* ═══════════════════════════════════════════════════════════════ */

function StepNumberCircle({ number, size = 'lg' }: { number: number; size?: 'sm' | 'lg' }) {
  const isLarge = size === 'lg';
  return (
    <div className="relative">
      {/* Outer pulsing ring */}
      <div
        className={cn(
          'absolute inset-0 rounded-full',
          'bg-gradient-to-br from-gold-light via-gold to-gold-dark',
          'animate-pulse opacity-30',
          isLarge ? 'inset-[-4px]' : 'inset-[-2px]',
        )}
        aria-hidden="true"
      />
      {/* Main circle */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full',
          'bg-gradient-to-br from-gold-light via-gold to-gold-dark',
          'shadow-lg shadow-gold/30',
          isLarge ? 'size-16' : 'size-7',
        )}
        style={{
          boxShadow: '0 4px 20px rgba(212,175,55,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
        }}
      >
        {/* Inner highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full opacity-30"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.6), transparent)',
          }}
          aria-hidden="true"
        />
        <span
          className={cn(
            'relative font-black text-gray-950',
            isLarge ? 'text-2xl' : 'text-[10px]',
          )}
        >
          {number}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Animated Gold Connector Line                                            */
/* ═══════════════════════════════════════════════════════════════ */

function GoldConnector({ orientation = 'horizontal' }: { orientation?: 'horizontal' | 'vertical' }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden',
        orientation === 'horizontal' ? 'h-1 w-full' : 'w-1 flex-1',
      )}
      aria-hidden="true"
    >
      {/* Base track */}
      <div className="absolute inset-0 rounded-full bg-gold/15" />
      {/* Animated gradient line */}
      <div
        className={cn(
          'absolute inset-0 rounded-full',
          'bg-gradient-to-r from-gold-dark via-gold-light to-gold-dark',
          'gradient-animate',
        )}
        style={{ backgroundSize: '200% 100%' }}
      />
      {/* Traveling particle */}
      <div
        className={cn(
          'absolute rounded-full bg-gold-light shadow-lg shadow-gold/50',
          orientation === 'horizontal'
            ? 'top-1/2 -translate-y-1/2 size-2'
            : 'left-1/2 -translate-x-1/2 size-2',
        )}
        style={{
          animation: orientation === 'horizontal'
            ? 'travel-right 2.5s ease-in-out infinite'
            : 'travel-down 2.5s ease-in-out infinite',
        }}
      />
      <style jsx>{`
        @keyframes travel-right {
          0% { right: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { right: 100%; opacity: 0; }
        }
        @keyframes travel-down {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Gold Sparkle Particles                                                 */
/* ═══════════════════════════════════════════════════════════════ */

function GoldSparkles() {
  const sparkles = [
    { top: '10%', left: '15%', delay: '0s', size: '3px' },
    { top: '20%', left: '80%', delay: '1s', size: '4px' },
    { top: '60%', left: '10%', delay: '0.5s', size: '3px' },
    { top: '70%', left: '85%', delay: '1.5s', size: '5px' },
    { top: '40%', left: '50%', delay: '2s', size: '3px' },
    { top: '85%', left: '30%', delay: '0.8s', size: '4px' },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {sparkles.map((s, i) => (
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
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Desktop Step Card                                                       */
/* ═══════════════════════════════════════════════════════════════ */

function DesktopStepCard({ step, index }: { step: StepItem; index: number }) {
  const { t } = useTranslation();
  const Icon = step.icon;

  return (
    <motion.div
      className="group relative z-10 flex flex-col items-center text-center"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.15,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {/* Floating step number - outside the card to avoid overflow:hidden clipping */}
      <div className="mb-4">
        <StepNumberCircle number={step.number} size="lg" />
      </div>

      {/* Glass card with shimmer border */}
      <div
        className={cn(
          'shimmer-border glass-card-enhanced relative w-full rounded-2xl p-6',
          'border border-gold/10 transition-all duration-400 ease-out',
          'hover:border-gold/30 card-spotlight',
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            'mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl',
            'bg-gradient-to-br from-gold/10 to-gold/5',
            'border border-gold/15',
            'transition-all duration-300',
            'group-hover:scale-110 group-hover:border-gold/30 group-hover:bg-gold/15',
          )}
        >
          <Icon className="size-6 text-gold" />
        </div>

        {/* Title */}
        <h3 className="mb-2 text-sm font-extrabold text-foreground sm:text-base">
          {t(step.titleKey)}
        </h3>

        {/* Description */}
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {t(step.descKey)}
        </p>

        {/* Bottom gold accent bar */}
        <div
          className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 transition-all duration-300 group-hover:w-20 group-hover:opacity-100"
        />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Component                                                               */
/* ═══════════════════════════════════════════════════════════════ */

export default function HowItWorksSection() {
  const { t } = useTranslation();

  return (
    <section
      id="how-it-works"
      dir="rtl"
      className="relative py-16 sm:py-20 lg:py-24"
    >
      {/* ── Background elements ── */}
      <GoldSparkles />
      <div className="pointer-events-none absolute inset-0 radial-gold-fade" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 dot-pattern opacity-30" aria-hidden="true" />

      {/* ── Gold separator at top ── */}
      <div className="gold-separator mb-12 sm:mb-16" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          className="mb-12 text-center sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Badge */}
          <motion.span
            className={cn(
              'glass-gold badge-gold inline-flex items-center gap-2',
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <span className="size-1.5 rounded-full bg-gold animate-pulse" />
            {t('howItWorks.badge')}
          </motion.span>

          {/* Title */}
          <h2
            className={cn(
              'mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl',
              'gold-gradient-text gold-text-shadow',
            )}
          >
            {t('howItWorks.title')}
          </h2>

          {/* Subtitle */}
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('howItWorks.subtitle')}
          </p>
        </motion.div>

        {/* ── Steps Timeline ── */}
        <div className="relative">
          {/* ════════════════════════════════════════════════════════════════ */}
          {/*  Tablet: 2×2 grid — no connectors, clean card layout           */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <div className="hidden md:grid md:grid-cols-2 md:gap-6 lg:hidden">
            {steps.map((step, index) => (
              <DesktopStepCard key={step.number} step={step} index={index} />
            ))}
          </div>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/*  Desktop: Horizontal timeline with animated connectors         */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <div className="hidden lg:flex lg:items-start lg:gap-0">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex-1 min-w-0">
                  <DesktopStepCard step={step} index={index} />
                </div>

                {/* Animated gold connector between steps */}
                {index < steps.length - 1 && (
                  <motion.div
                    className="flex items-center justify-center w-8 xl:w-12 shrink-0 mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.15 + 0.4 }}
                  >
                    <GoldConnector orientation="horizontal" />
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/*  Mobile: Vertical timeline with animated connector              */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <div className="relative md:hidden">
            <div className="flex flex-col gap-0">
              {steps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <React.Fragment key={step.number}>
                    <motion.div
                      className="relative flex gap-5 pr-2 pb-2"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.12,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {/* ── Right column: step number + connector ── */}
                      <div className="relative flex flex-col items-center">
                        <StepNumberCircle number={step.number} size="sm" />
                        {/* Animated vertical connector */}
                        {index < steps.length - 1 && (
                          <div className="relative my-1 flex-1" style={{ minHeight: '48px' }}>
                            <GoldConnector orientation="vertical" />
                          </div>
                        )}
                      </div>

                      {/* ── Card ── */}
                      <div
                        className={cn(
                          'glass-card-enhanced shimmer-border flex-1 rounded-xl p-4',
                          'border border-gold/10 transition-all duration-300',
                        )}
                      >
                        <div className="flex items-start gap-3.5">
                          {/* Icon */}
                          <div
                            className={cn(
                              'flex size-11 shrink-0 items-center justify-center rounded-xl',
                              'bg-gradient-to-br from-gold/10 to-gold/5',
                              'border border-gold/15',
                            )}
                          >
                            <Icon className="size-5 text-gold" />
                          </div>

                          {/* Text content */}
                          <div className="min-w-0 flex-1">
                            <h3 className="mb-1 text-sm font-extrabold text-foreground">
                              {t(step.titleKey)}
                            </h3>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {t(step.descKey)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

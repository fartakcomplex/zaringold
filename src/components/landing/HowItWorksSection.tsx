'use client';

import React from 'react';
import { motion } from '@/lib/framer-compat';
import { useTranslation } from '@/lib/i18n';
import {
  UserPlus,
  ShieldCheck,
  Wallet,
  TrendingUp,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Step data                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function HowItWorksSection() {
  const { t } = useTranslation();

  return (
    <section
      id="how-it-works"
      dir="rtl"
      className="relative py-16 sm:py-20"
    >
      {/* ── Gold separator at top ── */}
      <div className="gold-separator mb-12 sm:mb-16" />

      {/* ── Subtle background radial gold glow ── */}
      <div
        className="pointer-events-none absolute inset-0 radial-gold-fade"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          className="mb-12 text-center sm:mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Badge */}
          <motion.span
            className={cn(
              'glass-gold inline-block rounded-full px-4 py-1.5 text-xs font-semibold text-gold',
              'border border-gold/15',
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {t('howItWorks.badge')}
          </motion.span>

          {/* Title */}
          <h2
            className={cn(
              'mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl',
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
          {/*  Desktop: Horizontal timeline with connector lines               */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <div className="hidden md:grid md:grid-cols-4 md:gap-0 md:items-start">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <React.Fragment key={step.number}>
                  {/* Step Card */}
                  <motion.div
                    className={cn(
                      'group relative z-10 flex flex-col items-center text-center px-2',
                      'card-hover-lift',
                    )}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    
                    transition={{
                      duration: 0.5,
                      delay: index * 0.12,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {/* Glass card */}
                    <div
                      className={cn(
                        'glass-card-enhanced w-full rounded-2xl p-5 sm:p-6',
                        'border border-gold/10',
                        'transition-all duration-300 ease-out',
                        'hover:border-gold/25',
                        'card-spotlight',
                      )}
                    >
                      {/* Step number circle */}
                      <div
                        className={cn(
                          'mx-auto mb-4 flex size-12 items-center justify-center rounded-full',
                          'bg-gradient-to-br from-gold-light via-gold to-gold-dark',
                          'shadow-lg shadow-gold/25',
                          'step-number-pop',
                        )}
                        style={{ animationDelay: `${index * 0.12}s` }}
                      >
                        <span className="text-lg font-black text-gray-950">
                          {step.number}
                        </span>
                      </div>

                      {/* Icon */}
                      <div
                        className={cn(
                          'mx-auto mb-3 flex size-10 items-center justify-center rounded-xl',
                          'bg-gold/10',
                          'transition-all duration-300',
                          'group-hover:bg-gold/15',
                        )}
                      >
                        <Icon className="size-5 text-gold icon-hover-bounce" />
                      </div>

                      {/* Title */}
                      <h3 className="mb-2 text-sm font-bold text-foreground sm:text-base">
                        {t(step.titleKey)}
                      </h3>

                      {/* Description */}
                      <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {t(step.descKey)}
                      </p>
                    </div>
                  </motion.div>

                  {/* Connector line + arrow between steps */}
                  {index < steps.length - 1 && (
                    <motion.div
                      className="relative flex items-center justify-center px-1 pt-6 sm:pt-8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      
                      transition={{ duration: 0.4, delay: index * 0.12 + 0.2 }}
                    >
                      {/* Dashed gold connector line */}
                      <div
                        className={cn(
                          'absolute top-6 sm:top-8 right-0 left-0 h-px',
                          'border-t-2 border-dashed border-gold/30',
                          'timeline-line-glow',
                        )}
                        aria-hidden="true"
                      />

                      {/* Arrow icon in the middle */}
                      <div
                        className={cn(
                          'relative z-10 flex size-7 items-center justify-center rounded-full',
                          'bg-background',
                          'dark:bg-background',
                        )}
                      >
                        <ArrowLeft className="size-3.5 text-gold" />
                      </div>
                    </motion.div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/*  Mobile: Vertical timeline with right-side connector             */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <div className="relative md:hidden">
            {/* Vertical gold dashed line (absolute, on the right side) */}
            <div
              className="absolute top-6 bottom-6 right-6 w-px border-r-2 border-dashed border-gold/25"
              aria-hidden="true"
            />

            <div className="flex flex-col gap-6">
              {steps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <motion.div
                    key={step.number}
                    className="relative pr-16"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {/* Step number dot on the vertical line */}
                    <div
                      className={cn(
                        'absolute top-5 right-4 z-10 flex size-5 items-center justify-center rounded-full',
                        'bg-gradient-to-br from-gold-light via-gold to-gold-dark',
                        'shadow-md shadow-gold/20',
                      )}
                    >
                      <span className="text-[10px] font-black text-gray-950">
                        {step.number}
                      </span>
                    </div>

                    {/* Glass card */}
                    <div
                      className={cn(
                        'glass-card-enhanced rounded-xl p-4 sm:p-5',
                        'border border-gold/10',
                        'transition-all duration-300 ease-out',
                        'active:scale-[0.98]',
                      )}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Icon */}
                        <div
                          className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-xl',
                            'bg-gold/10',
                          )}
                        >
                          <Icon className="size-5 text-gold" />
                        </div>

                        {/* Text content */}
                        <div className="min-w-0 flex-1">
                          {/* Step label */}
                          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gold/70">
                            {t('howItWorks.badge')} {step.number}
                          </span>

                          {/* Title */}
                          <h3 className="mb-1 text-sm font-bold text-foreground">
                            {t(step.titleKey)}
                          </h3>

                          {/* Description */}
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {t(step.descKey)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Vertical connecting arrow between steps */}
                    {index < steps.length - 1 && (
                      <motion.div
                        className="absolute bottom-[-12px] right-[14px] z-10 flex size-4 items-center justify-center rounded-full bg-background dark:bg-background"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        
                        transition={{ delay: index * 0.1 + 0.2 }}
                      >
                        <ArrowLeft className="size-2.5 text-gold/60 -rotate-90" />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

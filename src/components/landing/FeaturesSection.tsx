'use client';

import React from 'react';
import { motion } from '@/lib/framer-compat';
import { useTranslation } from '@/lib/i18n';
import {
  Shield,
  Wallet,
  Zap,
  Headphones,
  Layout,
  Gift,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Feature card data                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const features = [
  {
    icon: Shield,
    titleKey: 'features.security.title',
    descKey: 'features.security.desc',
  },
  {
    icon: Wallet,
    titleKey: 'features.fee.title',
    descKey: 'features.fee.desc',
  },
  {
    icon: Zap,
    titleKey: 'features.instant.title',
    descKey: 'features.instant.desc',
  },
  {
    icon: Headphones,
    titleKey: 'features.support.title',
    descKey: 'features.support.desc',
  },
  {
    icon: Layout,
    titleKey: 'features.ui.title',
    descKey: 'features.ui.desc',
  },
  {
    icon: Gift,
    titleKey: 'features.referral.title',
    descKey: 'features.referral.desc',
  },
] as const;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section
      id="features"
      dir="rtl"
      className="relative py-16 sm:py-20"
    >
      {/* ── Gold separator at top ── */}
      <div className="gold-separator mb-12 sm:mb-16" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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
            {t('features.badge')}
          </motion.span>

          {/* Title */}
          <h2
            className={cn(
              'mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl',
              'gold-gradient-text gold-text-shadow',
            )}
          >
            {t('features.title')}
          </h2>

          {/* Subtitle */}
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('features.subtitle')}
          </p>
        </motion.div>

        {/* ── Feature Cards Grid ── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.titleKey}
                className={cn(
                  'group card-glass-premium relative overflow-hidden rounded-2xl p-6',
                  'transition-all duration-300 ease-out',
                  'hover:-translate-y-1 hover:shadow-lg hover:shadow-gold/10',
                )}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {/* Gold shimmer overlay on hover */}
                <div
                  className={cn(
                    'pointer-events-none absolute inset-0 rounded-2xl opacity-0',
                    'transition-opacity duration-300',
                    'bg-gradient-to-br from-gold/5 via-transparent to-gold/5',
                    'group-hover:opacity-100',
                  )}
                  aria-hidden="true"
                />

                <div className="relative z-10 flex flex-col items-start gap-4">
                  {/* Icon circle */}
                  <div className="gold-icon-circle">
                    <Icon className="size-5 text-gold" />
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-foreground sm:text-lg">
                    {t(feature.titleKey)}
                  </h3>

                  {/* Description */}
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(feature.descKey)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

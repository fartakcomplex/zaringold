'use client';

import { motion } from '@/lib/framer-compat';
import { Lock, Building2, Smartphone, ShieldCheck, Eye, Award, FileCheck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Security Feature Data                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

const securityFeatures = [
  {
    icon: Lock,
    titleKey: 'security.encryption.title',
    descKey: 'security.encryption.desc',
  },
  {
    icon: Building2,
    titleKey: 'security.storage.title',
    descKey: 'security.storage.desc',
  },
  {
    icon: Smartphone,
    titleKey: 'security.2fa.title',
    descKey: 'security.2fa.desc',
  },
  {
    icon: ShieldCheck,
    titleKey: 'security.insurance.title',
    descKey: 'security.insurance.desc',
  },
  {
    icon: Eye,
    titleKey: 'security.monitoring.title',
    descKey: 'security.monitoring.desc',
  },
  {
    icon: FileCheck,
    titleKey: 'security.license.title',
    descKey: 'security.license.desc',
  },
];

const trustBadges = [
  { key: 'security.trust.centralBank', label: 'مورد تایید بانک مرکزی' },
  { key: 'security.trust.chamber', label: 'عضو اتاق بازرگانی' },
  { key: 'security.trust.iso', label: 'ISO 27001' },
  { key: 'security.trust.pci', label: 'گواهینامه PCI DSS' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SecuritySection() {
  const { t } = useTranslation();

  return (
    <section
      id="security"
      dir="rtl"
      className="relative py-16 sm:py-20 overflow-hidden"
    >
      {/* ── Background decorative glow ── */}
      <div className="absolute inset-0 radial-gold-fade pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          className="mx-auto mb-12 max-w-2xl text-center sm:mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          
          transition={{ duration: 0.5 }}
        >
          <span className="badge-gold mb-4 inline-block">
            {t('security.badge')}
          </span>
          <h2 className="gold-gradient-text mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl gold-text-shadow">
            {t('security.title')}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('security.subtitle')}
          </p>
        </motion.div>

        {/* ── Security Feature Cards (2×3 grid) ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.titleKey}
                className={cn(
                  'group relative rounded-2xl p-5 sm:p-6',
                  'card-glass-premium',
                  'hover-lift-md',
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <div className="flex items-start gap-4">
                  <div className="gold-icon-circle shrink-0">
                    <Icon className="size-5 text-gold" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-foreground sm:text-base">
                      {t(feature.titleKey)}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {t(feature.descKey)}
                    </p>
                  </div>
                </div>

                {/* Subtle gold glow on hover */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    boxShadow: '0 0 20px oklch(0.75 0.15 85 / 12%), inset 0 0 20px oklch(0.75 0.15 85 / 4%)',
                  }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* ── Trust Badges Strip ── */}
        <motion.div
          className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:mt-16 sm:gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {trustBadges.map((badge) => (
            <span
              key={badge.key}
              className="badge-gold whitespace-nowrap text-xs sm:text-sm"
            >
              {t(badge.key)}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

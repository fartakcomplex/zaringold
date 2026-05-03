
import React from 'react';
import {motion} from '@/lib/framer-compat';
import {Lock, Building2, Smartphone, ShieldCheck, Eye, FileCheck, Award, BadgeCheck, Shield, Fingerprint, type LucideIcon} from 'lucide-react';
import {useTranslation} from '@/lib/i18n';
import {cn} from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════ */
/*  Security Feature Data                                                    */
/* ═══════════════════════════════════════════════════════════════ */

const securityFeatures: {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  stat?: string;
}[] = [
  {
    icon: Lock,
    titleKey: 'security.encryption.title',
    descKey: 'security.encryption.desc',
    stat: 'AES-256',
  },
  {
    icon: Building2,
    titleKey: 'security.storage.title',
    descKey: 'security.storage.desc',
    stat: '24/7',
  },
  {
    icon: Smartphone,
    titleKey: 'security.2fa.title',
    descKey: 'security.2fa.desc',
    stat: 'OTP',
  },
  {
    icon: ShieldCheck,
    titleKey: 'security.insurance.title',
    descKey: 'security.insurance.desc',
    stat: '100%',
  },
  {
    icon: Eye,
    titleKey: 'security.monitoring.title',
    descKey: 'security.monitoring.desc',
    stat: '24/7',
  },
  {
    icon: FileCheck,
    titleKey: 'security.license.title',
    descKey: 'security.license.desc',
    stat: 'رسمی',
  },
];

const trustBadges = [
  { key: 'security.trust.centralBank', icon: Building2 },
  { key: 'security.trust.chamber', icon: Award },
  { key: 'security.trust.iso', icon: BadgeCheck },
  { key: 'security.trust.pci', icon: Shield },
];

/* ═══════════════════════════════════════════════════════════════ */
/*  Central Shield Visual                                                    */
/* ═══════════════════════════════════════════════════════════════ */

function CentralShield() {
  return (
    <div className="relative mx-auto flex items-center justify-center" style={{ width: 200, height: 200 }}>
      {/* Outer rotating ring */}
      <div
        className="absolute inset-0 rounded-full opacity-20"
        style={{
          border: '2px dashed rgba(212,175,55,0.3)',
          animation: 'spin-slow 20s linear infinite',
        }}
        aria-hidden="true"
      />
      {/* Second ring */}
      <div
        className="absolute rounded-full opacity-10"
        style={{
          inset: 15,
          border: '1px solid rgba(212,175,55,0.3)',
          animation: 'spin-slow 15s linear infinite reverse',
        }}
        aria-hidden="true"
      />
      {/* Pulsing glow background */}
      <div
        className="absolute rounded-full pulse-glow"
        style={{
          inset: 25,
          background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      {/* Main shield circle */}
      <div
        className="relative rounded-full"
        style={{
          inset: 35,
          background: 'linear-gradient(135deg, oklch(0.97 0.03 85 / 80%), oklch(0.94 0.04 85 / 60%))',
          boxShadow: '0 8px 32px rgba(212,175,55,0.15), inset 0 1px 0 rgba(255,255,255,0.3)',
          border: '2px solid rgba(212,175,55,0.2)',
        }}
      >
        {/* Shield icon — perfectly centered */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex size-16 items-center justify-center rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #F0D060, #D4AF37, #B8960C)',
            boxShadow: '0 4px 16px rgba(212,175,55,0.3)',
          }}
        >
          <ShieldCheck className="size-8 text-gray-950" strokeWidth={2.5} />
        </div>
        {/* Orbiting dots — positioned relative to circle center */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gold/40"
            style={{
              width: 4,
              height: 4,
              top: `${50 + 38 * Math.sin((i * 90) * Math.PI / 180)}%`,
              left: `${50 + 38 * Math.cos((i * 90) * Math.PI / 180)}%`,
              transform: 'translate(-50%, -50%)',
              animation: `pulse-glow 2s ease-in-out infinite ${i * 0.5}s`,
            }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Floating particles — deterministic positions to avoid hydration mismatch */}
      {[20, 55, 80, 35, 65, 45].map((topPos, i) => (
        <div
          key={i}
          className="gold-sparkle"
          style={{
            top: `${topPos}%`,
            left: `${(i * 13 + 25) % 80 + 10}%`,
            animationDelay: `${i * 0.6}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Security Feature Card                                                    */
/* ═══════════════════════════════════════════════════════════════ */

function SecurityCard({
  feature,
  index,
}: {
  feature: typeof securityFeatures[number];
  index: number;
}) {
  const { t } = useTranslation();
  const Icon = feature.icon;

  return (
    <motion.div
      className={cn(
        'group relative overflow-hidden rounded-2xl',
        'transition-all duration-400',
        'hover-lift-lg',
      )}
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      {/* Card background with shimmer border */}
      <div
        className={cn(
          'shimmer-border glass-card-enhanced relative h-full rounded-2xl p-5 sm:p-6',
          'border border-gold/10 hover:border-gold/30 transition-all duration-300',
        )}
      >
        {/* Spotlight overlay */}
        <div className="card-spotlight absolute inset-0 rounded-2xl" style={{ zIndex: 1 }} aria-hidden="true" />

        {/* Content */}
        <div className="relative flex flex-col gap-4" style={{ zIndex: 2 }}>
          {/* Top row: Icon + Stat badge */}
          <div className="flex items-start justify-between">
            <div
              className={cn(
                'flex size-12 shrink-0 items-center justify-center rounded-xl',
                'bg-gradient-to-br from-gold/15 to-gold/5',
                'border border-gold/15',
                'transition-all duration-300',
                'group-hover:scale-110 group-hover:border-gold/30 group-hover:shadow-lg group-hover:shadow-gold/10',
              )}
            >
              <Icon className="size-5 text-gold" />
            </div>

            {/* Stat badge */}
            {feature.stat && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg px-2.5 py-1',
                  'bg-gold/10 border border-gold/15',
                  'text-[10px] font-bold text-gold tracking-wider uppercase',
                  'opacity-0 -translate-y-1 transition-all duration-300',
                  'group-hover:opacity-100 group-hover:translate-y-0',
                )}
              >
                {feature.stat}
              </span>
            )}
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-foreground sm:text-base">
              {t(feature.titleKey)}
            </h3>
            <p className="text-xs leading-relaxed text-foreground/80 sm:text-sm">
              {t(feature.descKey)}
            </p>
          </div>

          {/* Bottom gold accent */}
          <div className="flex items-center gap-2 pt-1">
            <div className="h-px flex-1 bg-gradient-to-r from-gold/20 to-transparent" />
            <Fingerprint className="size-3 text-gold/30 transition-all duration-300 group-hover:text-gold/60" />
            <div className="h-px flex-1 bg-gradient-to-l from-gold/20 to-transparent" />
          </div>
        </div>

        {/* Dramatic hover glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-400 group-hover:opacity-100"
          style={{
            boxShadow: '0 0 30px rgba(212,175,55,0.1), 0 0 60px rgba(212,175,55,0.05), inset 0 0 30px rgba(212,175,55,0.03)',
          }}
        />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Trust Badge with Icon                                                   */
/* ═══════════════════════════════════════════════════════════════ */

function TrustBadge({
  label,
  icon: Icon,
  delay,
}: {
  label: string;
  icon: LucideIcon;
  delay: number;
}) {
  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <span className="badge-gold flex items-center gap-1.5 text-xs sm:text-sm">
        <Icon className="size-3.5 text-gold" />
        {label}
      </span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Component                                                                */
/* ═══════════════════════════════════════════════════════════════ */

export default function SecuritySection() {
  const { t, dir } = useTranslation();

  return (
    <section
      id="security"
      dir={dir}
      className="relative overflow-hidden py-20 sm:py-24 lg:py-28"
    >
      {/* ── Background decorative elements ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="radial-gold-fade absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] opacity-40" />
        <div className="dot-pattern absolute inset-0 opacity-15" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          className="mx-auto mb-14 max-w-2xl text-center sm:mb-20"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="badge-gold mb-5 inline-flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Shield className="size-3.5 text-gold" />
            {t('security.badge')}
          </motion.span>

          <h2 className="gold-gradient-text gold-text-shadow mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            {t('security.title')}
          </h2>

          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('security.subtitle')}
          </p>
        </motion.div>

        {/* ── Central Shield Visual (Desktop) ── */}
        <div className="mb-14 hidden lg:flex">
          <CentralShield />
        </div>

        {/* ── Security Feature Cards (2×3 grid) ── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6">
          {securityFeatures.map((feature, index) => (
            <SecurityCard
              key={feature.titleKey}
              feature={feature}
              index={index}
            />
          ))}
        </div>

        {/* ── Trust Badges Strip ── */}
        <motion.div
          className="mt-14 flex flex-wrap items-center justify-center gap-4 sm:mt-16 sm:gap-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {trustBadges.map((badge, idx) => (
            <TrustBadge
              key={badge.key}
              label={t(badge.key)}
              icon={badge.icon}
              delay={0.5 + idx * 0.1}
            />
          ))}
        </motion.div>

        {/* ── Bottom Security Guarantee Bar ── */}
        <motion.div
          className="mt-10 sm:mt-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div
            className={cn(
              'mx-auto max-w-2xl overflow-hidden rounded-2xl',
              'border border-gold/15',
              'bg-gradient-to-r from-gold/[0.04] via-gold/[0.08] to-gold/[0.04]',
            )}
          >
            <div className="flex items-center justify-center gap-4 px-6 py-4 sm:px-8 sm:py-5">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold/15 to-gold/5 border border-gold/15 pulse-glow"
              >
                <ShieldCheck className="size-5 text-gold" />
              </div>
              <div className="text-center sm:text-right">
                <p className="text-sm font-bold text-foreground">
                  {t('security.insurance.title')}
                </p>
                <p className="text-xs text-foreground/75 mt-0.5">
                  {t('security.insurance.desc')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

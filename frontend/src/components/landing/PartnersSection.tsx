
import {motion} from '@/lib/framer-compat';
import {Shield, Award, Building2, Lock, BadgeCheck, Landmark} from 'lucide-react';
import {useTranslation} from '@/lib/i18n';
import {cn} from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Partner Badge Data                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

const partnerBadges = [
  {
    icon: Landmark,
    titleKey: 'partners.centralBank',
    color: '#D4AF37',
  },
  {
    icon: Award,
    titleKey: 'partners.exchangeOrg',
    color: '#F59E0B',
  },
  {
    icon: Building2,
    titleKey: 'partners.registeredCompany',
    color: '#EAB308',
  },
  {
    icon: Shield,
    titleKey: 'partners.iso27001',
    color: '#D4AF37',
  },
  {
    icon: Lock,
    titleKey: 'partners.ssl',
    color: '#F59E0B',
  },
  {
    icon: BadgeCheck,
    titleKey: 'partners.pciDss',
    color: '#EAB308',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function PartnersSection() {
  const { t, dir } = useTranslation();

  return (
    <section
      id="partners"
      dir={dir}
      className="relative py-20 sm:py-24 lg:py-28 overflow-hidden"
    >
      {/* ── Background decorative glow ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 30%, oklch(0.75 0.15 85 / 8%) 0%, transparent 70%)',
        }}
      />

      {/* ── Gold separator at top ── */}
      <div className="absolute top-0 left-0 right-0 gold-separator" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          className="mx-auto mb-12 max-w-2xl text-center sm:mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="badge-gold mb-4 inline-block">
            {t('partners.badge')}
          </span>
          <h2 className="gold-gradient-text mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl gold-text-shadow">
            {t('partners.title')}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('partners.subtitle')}
          </p>
        </motion.div>

        {/* ── Partner Badge Cards Grid ── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6">
          {partnerBadges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.titleKey}
                className={cn(
                  'group relative rounded-2xl p-5 sm:p-6',
                  'card-glass-premium',
                  'hover-lift-md',
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <div className="flex items-center gap-4">
                  {/* Icon circle */}
                  <div
                    className="shrink-0 flex items-center justify-center rounded-xl size-12 sm:size-14"
                    style={{
                      background: `linear-gradient(135deg, ${badge.color}18 0%, ${badge.color}08 100%)`,
                      border: `1px solid ${badge.color}25`,
                    }}
                  >
                    <Icon className="size-6 sm:size-7" style={{ color: badge.color }} />
                  </div>

                  {/* Text */}
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-foreground sm:text-base">
                      {t(badge.titleKey)}
                    </h3>
                    <span
                      className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: `${badge.color}15`,
                        color: badge.color,
                        border: `1px solid ${badge.color}20`,
                      }}
                    >
                      {t('partners.verified')}
                    </span>
                  </div>
                </div>

                {/* Subtle gold glow on hover */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    boxShadow: `0 0 20px oklch(0.75 0.15 85 / 12%), inset 0 0 20px oklch(0.75 0.15 85 / 4%)`,
                  }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* ── Stats strip ── */}
        <motion.div
          className="mt-14 grid grid-cols-2 gap-5 sm:mt-16 sm:grid-cols-4 sm:gap-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {[
            { value: t('partners.statUsersValue'), label: t('partners.statUsersLabel') },
            { value: t('partners.statUptimeValue'), label: t('partners.statUptimeLabel') },
            { value: t('partners.statGoldValue'), label: t('partners.statGoldLabel') },
            { value: t('partners.statSecurityValue'), label: t('partners.statSecurityLabel') },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center rounded-xl p-5 card-glass-premium"
            >
              <div className="gold-gradient-text text-xl font-extrabold sm:text-2xl">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

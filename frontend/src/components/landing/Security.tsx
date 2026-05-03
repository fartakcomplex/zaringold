
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {Lock, Landmark, ShieldCheck, BadgeCheck, Activity, FileCheck, Building2, Award, type LucideIcon} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';
import {useTranslation} from '@/lib/i18n';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface SecurityFeature {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
}

const securityFeatures: SecurityFeature[] = [
  { icon: Lock, titleKey: 'security.encryption.title', descKey: 'security.encryption.desc' },
  { icon: Landmark, titleKey: 'security.storage.title', descKey: 'security.storage.desc' },
  { icon: ShieldCheck, titleKey: 'security.2fa.title', descKey: 'security.2fa.desc' },
  { icon: BadgeCheck, titleKey: 'security.insurance.title', descKey: 'security.insurance.desc' },
  { icon: Activity, titleKey: 'security.monitoring.title', descKey: 'security.monitoring.desc' },
  { icon: FileCheck, titleKey: 'security.license.title', descKey: 'security.license.desc' },
];

interface TrustBadge {
  icon: LucideIcon;
  labelKey: string;
}

const trustBadges: TrustBadge[] = [
  { icon: Landmark, labelKey: 'security.trust.centralBank' },
  { icon: Building2, labelKey: 'security.trust.chamber' },
  { icon: Award, labelKey: 'security.trust.iso' },
  { icon: ShieldCheck, labelKey: 'security.trust.pci' },
];

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Security() {
  const { t } = useTranslation();

  return (
    <section id="security" className="relative py-12 sm:py-16 bg-muted/20">
      {/* Gold radial glow background */}
      <div className="pointer-events-none absolute inset-0 bg-gold-radial" aria-hidden />

      {/* Subtle dot pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        aria-hidden
        style={{
          backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Section header ── */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <span className="badge-gold inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
            {t('security.badge')}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            <span className="gold-gradient-text">{t('security.title')}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            {t('security.subtitle')}
          </p>
        </motion.div>

        {/* ── Security feature cards grid (3×2) ── */}
        <motion.div
          className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {securityFeatures.map((feature, i) => (
            <motion.div key={i} variants={cardVariants}>
              <Card className="card-glass-premium gold-bottom-accent group relative h-full overflow-hidden">
                {/* Shimmer overlay on hover */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden
                >
                  <div className="shimmer-gold absolute inset-0" />
                </div>
                <CardContent className="relative flex flex-col items-start gap-4 p-6">
                  {/* Gold icon circle */}
                  <div className="gold-icon-circle">
                    <feature.icon className="size-6 text-gold" />
                  </div>
                  <h3 className="text-lg font-bold">{t(feature.titleKey)}</h3>
                  <p className="leading-relaxed text-muted-foreground text-sm">
                    {t(feature.descKey)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Trust badges row ── */}
        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          {trustBadges.map((badge, i) => (
            <motion.div
              key={i}
              variants={badgeVariants}
              className="glass-card-enhanced flex items-center gap-2.5 rounded-full border border-border/60 px-4 py-2.5 transition-all duration-300 hover:border-gold/30 hover:shadow-md hover:shadow-gold/5"
            >
              <badge.icon className="size-4 shrink-0 text-gold" />
              <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">
                {t(badge.labelKey)}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

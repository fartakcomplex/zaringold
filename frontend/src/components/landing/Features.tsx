
import {motion} from '@/lib/framer-compat';
import {Shield, TrendingUp, Zap, Headphones, Smartphone, Gift, type LucideIcon} from 'lucide-react';
import {useTranslation} from '@/lib/i18n';

/* ─── Feature Data ─── */
interface FeatureItem {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
}

const features: FeatureItem[] = [
  { icon: Shield, titleKey: 'features.security.title', descKey: 'features.security.desc' },
  { icon: TrendingUp, titleKey: 'features.fee.title', descKey: 'features.fee.desc' },
  { icon: Zap, titleKey: 'features.instant.title', descKey: 'features.instant.desc' },
  { icon: Headphones, titleKey: 'features.support.title', descKey: 'features.support.desc' },
  { icon: Smartphone, titleKey: 'features.ui.title', descKey: 'features.ui.desc' },
  { icon: Gift, titleKey: 'features.referral.title', descKey: 'features.referral.desc' },
];

/* ─── Animation Variants ─── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

/* ─── Component ─── */
export default function Features() {
  const { t } = useTranslation();

  return (
    <section id="features" className="relative overflow-hidden bg-muted/20 py-12 sm:py-16">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="radial-gold-fade absolute top-0 right-1/4 h-[500px] w-[500px]" />
        <div className="radial-gold-fade absolute bottom-0 left-1/4 h-[400px] w-[400px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 dot-pattern opacity-40" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ── */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <span className="badge-gold inline-block px-5 py-1.5 text-sm font-semibold">
            {t('features.badge')}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
            <span className="gold-gradient-text gold-text-shadow">
              {t('features.title')}
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t('features.subtitle')}
          </p>
        </motion.div>

        {/* ── Feature Cards Grid ── */}
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {features.map((feature, i) => (
            <motion.div key={i} variants={cardVariants}>
              <div className="group card-glass-premium relative h-full overflow-hidden rounded-2xl p-5 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-gold/5 sm:p-6">
                {/* Icon in gold gradient circle */}
                <div className="icon-hover-bounce mb-4 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 via-gold/10 to-gold/5 shadow-lg shadow-gold/5 ring-1 ring-gold/10 transition-all duration-300 group-hover:shadow-gold/15 group-hover:ring-gold/20 sm:size-14">
                  <feature.icon className="size-5 text-gold transition-all duration-300 group-hover:text-gold-light sm:size-6" />
                </div>

                {/* Content */}
                <h3 className="mb-1.5 text-base font-bold text-foreground sm:text-lg">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(feature.descKey)}
                </p>

                {/* Hover gold bottom line */}
                <div className="absolute bottom-0 right-0 h-[3px] w-0 rounded-full bg-gradient-to-l from-gold-light via-gold to-gold-dark transition-all duration-500 group-hover:w-full" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

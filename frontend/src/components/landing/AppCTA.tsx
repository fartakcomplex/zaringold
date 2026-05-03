
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {UserPlus, Percent, Headphones, Star, ArrowLeft, BookOpen, type LucideIcon} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';
import {useTranslation} from '@/lib/i18n';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface FeatureHighlight {
  icon: LucideIcon;
  titleKey: string;
}

const highlights: FeatureHighlight[] = [
  { icon: UserPlus, titleKey: 'appCta.hl1' },
  { icon: Percent, titleKey: 'appCta.hl2' },
  { icon: Headphones, titleKey: 'appCta.hl3' },
];

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const highlightVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
  },
};

/* ------------------------------------------------------------------ */
/*  Floating Gold Particle                                             */
/* ------------------------------------------------------------------ */

function FloatingDot({
  delay,
  x,
  y,
  size,
  duration,
}: {
  delay: number;
  x: string;
  y: string;
  size: number;
  duration: number;
}) {
  return (
    <motion.span
      className="pointer-events-none absolute rounded-full bg-gold-light/40"
      style={{ left: x, top: y, width: size, height: size }}
      animate={{ y: [0, -16, 0], opacity: [0.15, 0.6, 0.15] }}
      transition={{ duration, repeat: Infinity, delay, ease: 'easeInOut' }}
      aria-hidden
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Component Props                                                    */
/* ------------------------------------------------------------------ */

interface AppCTAProps {
  onGetStarted: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AppCTA({ onGetStarted }: AppCTAProps) {
  const { t } = useTranslation();

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden">
      {/* ── Dark gradient background ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" aria-hidden />

      {/* ── Floating gold particles ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <FloatingDot delay={0} x="5%" y="15%" size={5} duration={4.5} />
        <FloatingDot delay={1.2} x="18%" y="70%" size={3} duration={5} />
        <FloatingDot delay={0.6} x="82%" y="20%" size={4} duration={4} />
        <FloatingDot delay={2} x="92%" y="65%" size={3} duration={5.5} />
        <FloatingDot delay={0.4} x="35%" y="85%" size={4} duration={4.8} />
        <FloatingDot delay={1.8} x="65%" y="10%" size={5} duration={3.8} />
        <FloatingDot delay={1} x="75%" y="80%" size={3} duration={5.2} />
        <FloatingDot delay={2.5} x="48%" y="5%" size={4} duration={4.2} />

        {/* Ambient gold glow — top */}
        <motion.div
          className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-gold/5 blur-[120px]"
          animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Ambient gold glow — bottom */}
        <motion.div
          className="absolute bottom-0 right-0 h-[350px] w-[450px] rounded-full bg-gold/4 blur-[100px]"
          animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />
      </div>

      {/* ── Gold separator lines at top and bottom ── */}
      <div
        className="gold-separator pointer-events-none absolute inset-x-0 top-0"
        aria-hidden
      />
      <div
        className="gold-separator pointer-events-none absolute inset-x-0 bottom-0"
        aria-hidden
      />

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <motion.div
          className="text-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Title with gold gradient */}
          <motion.h2
            className="gold-text-animated text-3xl font-extrabold sm:text-4xl md:text-5xl"
            variants={itemVariants}
          >
            {t('appCta.title')}
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            variants={itemVariants}
          >
            {t('appCta.subtitle')}
          </motion.p>

          {/* Feature highlights row */}
          <motion.div
            className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-8"
            variants={containerVariants}
          >
            {highlights.map((item, i) => (
              <motion.div
                key={i}
                className="group flex items-center gap-3"
                variants={highlightVariants}
              >
                <div className="gold-icon-circle">
                  <item.icon className="size-5 text-gold" />
                </div>
                <span className="text-base font-semibold text-foreground sm:text-lg">
                  {t(item.titleKey)}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5"
            variants={itemVariants}
          >
            {/* Primary: Gold gradient button */}
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                onClick={onGetStarted}
                className={cn(
                  'h-12 min-w-[170px] rounded-xl px-8 text-base font-bold text-gray-950',
                  'bg-gradient-to-l from-gold-dark via-gold to-gold-light',
                  'shadow-lg shadow-gold/25',
                  'transition-all duration-300',
                  'hover:shadow-gold/40 hover:brightness-110',
                  'btn-gold-shine',
                )}
              >
                <ArrowLeft className="size-5" />
                <span>{t('appCta.startTrade')}</span>
              </Button>
            </motion.div>

            {/* Secondary: Outline button */}
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                size="lg"
                onClick={scrollToHowItWorks}
                className={cn(
                  'h-12 min-w-[170px] rounded-xl border-gold/40 bg-transparent px-8 text-base font-semibold text-gold',
                  'transition-all duration-300',
                  'hover:border-gold hover:bg-gold/10 hover:text-gold-light',
                )}
              >
                <BookOpen className="size-5 ml-1.5" />
                <span>{t('appCta.learnMore')}</span>
              </Button>
            </motion.div>
          </motion.div>

          {/* Trust line with stars */}
          <motion.div
            className="mt-14 flex flex-col items-center gap-3"
            variants={itemVariants}
          >
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="size-4 fill-gold text-gold"
                />
              ))}
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {t('appCta.trustText')}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

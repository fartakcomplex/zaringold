
import {motion} from '@/lib/framer-compat';
import {Sparkles, Users, Shield, Clock, Award, ArrowRight} from 'lucide-react';
import {useTranslation} from '@/lib/i18n';
import {cn} from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface CTASectionProps {
  onGetStarted: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sparkle Particles                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

const sparkles = [
  { top: '8%', right: '12%', delay: '0s', size: '4px' },
  { top: '15%', left: '8%', delay: '1.2s', size: '3px' },
  { top: '25%', right: '25%', delay: '0.6s', size: '5px' },
  { top: '35%', left: '18%', delay: '2s', size: '3px' },
  { top: '45%', right: '8%', delay: '1.8s', size: '4px' },
  { top: '55%', left: '30%', delay: '0.3s', size: '3px' },
  { top: '65%', right: '35%', delay: '2.5s', size: '5px' },
  { top: '72%', left: '12%', delay: '1s', size: '4px' },
  { top: '80%', right: '20%', delay: '0.8s', size: '3px' },
  { top: '88%', left: '22%', delay: '2.2s', size: '4px' },
  { top: '92%', right: '40%', delay: '1.5s', size: '3px' },
  { top: '18%', right: '45%', delay: '0.4s', size: '3px' },
  { top: '50%', right: '50%', delay: '3s', size: '2px' },
  { top: '70%', left: '45%', delay: '1.7s', size: '2px' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Trust Indicators                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

const trustItems = [
  { icon: Shield, labelKey: 'cta.trust.security.label', sublabelKey: 'cta.trust.security.sublabel' },
  { icon: Clock, labelKey: 'cta.trust.support.label', sublabelKey: 'cta.trust.support.sublabel' },
  { icon: Award, labelKey: 'cta.trust.license.label', sublabelKey: 'cta.trust.license.sublabel' },
];

const benefitKeys = ['cta.benefit1', 'cta.benefit2', 'cta.benefit3', 'cta.benefit4'];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function CTASection({ onGetStarted }: CTASectionProps) {
  const { t, dir } = useTranslation();

  return (
    <section
      id="cta"
      dir={dir}
      className="relative py-20 sm:py-24 lg:py-32 overflow-hidden"
    >
      {/* ── Gold separator at top ── */}
      <div className="absolute top-0 left-0 right-0 gold-separator" />

      {/* ── Animated gradient background ── */}
      <div
        className="absolute inset-0 pointer-events-none gradient-animate"
        style={{
          background: `
            radial-gradient(ellipse 80% 70% at 50% 40%, oklch(0.75 0.15 85 / 12%) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 25% 70%, oklch(0.85 0.1 85 / 8%) 0%, transparent 50%),
            radial-gradient(ellipse 50% 60% at 75% 60%, oklch(0.75 0.15 85 / 6%) 0%, transparent 50%),
            linear-gradient(180deg, oklch(0.75 0.15 85 / 4%) 0%, transparent 30%, transparent 70%, oklch(0.75 0.15 85 / 4%) 100%)
          `,
          backgroundSize: '200% 200%',
        }}
      />

      {/* ── Sparkle particles ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {sparkles.map((s, i) => (
          <div
            key={i}
            className="gold-sparkle absolute"
            style={{
              top: s.top,
              right: s.right,
              left: s.left,
              animationDelay: s.delay,
              width: s.size,
              height: s.size,
            }}
          />
        ))}
      </div>

      {/* ── Floating gold orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[10%] right-[5%] w-32 h-32 rounded-full float-animation-slow opacity-20"
          style={{
            background: 'radial-gradient(circle, oklch(0.75 0.15 85 / 40%) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
        <div
          className="absolute bottom-[15%] left-[8%] w-40 h-40 rounded-full float-animation opacity-15"
          style={{
            background: 'radial-gradient(circle, oklch(0.85 0.1 85 / 40%) 0%, transparent 70%)',
            filter: 'blur(25px)',
            animationDelay: '2s',
          }}
        />
        <div
          className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, oklch(0.75 0.15 85 / 30%) 0%, transparent 60%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {/* ── Top decorative element ── */}
          <motion.div
            className="mb-6 sm:mb-8"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative">
              <div className="flex items-center justify-center size-16 sm:size-20 rounded-full pulse-glow" style={{
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.05))',
                border: '1px solid rgba(212, 175, 55, 0.2)',
              }}>
                <Sparkles className="size-7 sm:size-9 text-gold" />
              </div>
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full" style={{
                border: '1px dashed oklch(0.75 0.15 85 / 15%)',
                transform: 'scale(1.5)',
                animation: 'spin-slow 20s linear infinite',
              }} />
            </div>
          </motion.div>

          {/* ── Large Heading ── */}
          <h2 className="gold-gradient-text mb-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl gold-text-shadow leading-tight">
            {t('cta.title')}
          </h2>

          {/* ── Subheading ── */}
          <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-lg leading-relaxed">
            {t('cta.subtitle')}
          </p>

          {/* ── User count badge ── */}
          <motion.div
            className="mb-8 sm:mb-10 inline-flex items-center gap-2.5 rounded-full px-5 py-2.5"
            style={{
              background: 'linear-gradient(135deg, oklch(0.95 0.012 85 / 85%), oklch(0.97 0.008 85 / 90%))',
              border: '1px solid oklch(0.75 0.15 85 / 18%)',
              backdropFilter: 'blur(16px)',
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Animated user avatars */}
            <div className="flex -space-x-2 space-x-reverse">
              {['#D4AF37', '#F0D060', '#B8960C', '#8B6914'].map((color, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center size-7 rounded-full border-2 border-white/80"
                  style={{ background: color }}
                >
                  <span className="text-[8px] font-bold text-black">
                    {t('testimonials2.1.name').charAt(0)}
                    {i === 1 && t('testimonials2.2.name').charAt(0)}
                    {i === 2 && t('testimonials2.3.name').charAt(0)}
                    {i === 3 && t('testimonials2.4.name').charAt(0)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="size-4 text-gold" />
              <span className="text-sm font-bold text-gray-900">{t('cta.userCount')}</span>
              <span className="text-xs text-gray-500">{t('cta.activeUsers')}</span>
            </div>
          </motion.div>

          {/* ── CTA Button (dramatic) ── */}
          <motion.div
            className="relative mb-8 sm:mb-10"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Multiple pulse rings */}
            <div className="absolute inset-0 -z-10 flex items-center justify-center">
              <div className="w-full h-full rounded-2xl animate-ping opacity-[0.07]" style={{
                background: 'linear-gradient(135deg, #D4AF37, #F0D060)',
                animationDuration: '3s',
              }} />
            </div>
            <div className="absolute -inset-2 -z-20 rounded-2xl" style={{
              background: 'linear-gradient(135deg, oklch(0.75 0.15 85 / 15%), oklch(0.75 0.15 85 / 5%))',
              filter: 'blur(16px)',
            }} />

            <button
              onClick={onGetStarted}
              className={cn(
                'cta-pulse-ring',
                'btn-gold-gradient btn-gold-shine',
                'relative inline-flex items-center gap-2.5',
                'rounded-2xl px-10 py-4 sm:px-12 sm:py-5',
                'text-base font-bold sm:text-lg',
                'transition-all duration-300',
                'hover:shadow-[0_0_40px_rgba(212,175,55,0.25),0_0_80px_rgba(212,175,55,0.1)]',
                'active:scale-[0.98]',
              )}
            >
              <Sparkles className="size-5 sm:size-6" />
              <span>{t('cta.freeStart')}</span>
              <ArrowRight className="size-4 sm:size-5 opacity-70" />
            </button>
          </motion.div>

          {/* ── Quick benefits pills ── */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {benefitKeys.map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1.5 rounded-full"
                style={{
                  background: 'oklch(0.75 0.15 85 / 5%)',
                  border: '1px solid oklch(0.75 0.15 85 / 8%)',
                }}
              >
                <span className="inline-block size-1.5 rounded-full bg-gold/50" />
                {t(key)}
              </span>
            ))}
          </motion.div>

          {/* ── Trust indicators ── */}
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {trustItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.labelKey}
                    className="flex items-center gap-3 rounded-2xl p-4 card-spotlight hover-lift-sm"
                    style={{
                      background: 'linear-gradient(135deg, oklch(0.95 0.015 85 / 70%), oklch(0.97 0.01 85 / 80%))',
                      border: '1px solid oklch(0.75 0.15 85 / 15%)',
                    }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                  >
                    <div
                      className="shrink-0 flex items-center justify-center rounded-xl size-10"
                      style={{
                        background: 'linear-gradient(135deg, oklch(0.75 0.15 85 / 10%), oklch(0.75 0.15 85 / 5%))',
                        border: '1px solid oklch(0.75 0.15 85 / 10%)',
                      }}
                    >
                      <Icon className="size-4.5 text-gold" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-900">{t(item.labelKey)}</div>
                      <div className="text-[10px] text-gray-500">{t(item.sublabelKey)}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ── Bottom tagline ── */}
          <motion.p
            className="mt-10 sm:mt-12 text-xs text-muted-foreground/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            {t('cta.tagline')}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

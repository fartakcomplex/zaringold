'use client';

import React, { useRef, useCallback, useState } from 'react';
import { motion } from '@/lib/framer-compat';
import { useTranslation } from '@/lib/i18n';
import {
  Shield,
  Wallet,
  Zap,
  Headphones,
  Layout,
  Gift,
  Sparkles,
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
    gradient: 'from-amber-500/20 via-yellow-500/10 to-orange-500/20',
    iconGradient: 'from-amber-500 to-yellow-400',
    glowColor: 'rgba(245, 158, 11, 0.15)',
    accentLine: 'from-amber-400 to-yellow-300',
  },
  {
    icon: Wallet,
    titleKey: 'features.fee.title',
    descKey: 'features.fee.desc',
    gradient: 'from-emerald-500/20 via-green-500/10 to-teal-500/20',
    iconGradient: 'from-emerald-500 to-green-400',
    glowColor: 'rgba(16, 185, 129, 0.15)',
    accentLine: 'from-emerald-400 to-green-300',
  },
  {
    icon: Zap,
    titleKey: 'features.instant.title',
    descKey: 'features.instant.desc',
    gradient: 'from-rose-500/20 via-pink-500/10 to-red-500/15',
    iconGradient: 'from-rose-500 to-pink-400',
    glowColor: 'rgba(244, 63, 94, 0.15)',
    accentLine: 'from-rose-400 to-pink-300',
  },
  {
    icon: Headphones,
    titleKey: 'features.support.title',
    descKey: 'features.support.desc',
    gradient: 'from-violet-500/20 via-purple-500/10 to-fuchsia-500/20',
    iconGradient: 'from-violet-500 to-purple-400',
    glowColor: 'rgba(139, 92, 246, 0.15)',
    accentLine: 'from-violet-400 to-purple-300',
  },
  {
    icon: Layout,
    titleKey: 'features.ui.title',
    descKey: 'features.ui.desc',
    gradient: 'from-sky-500/20 via-cyan-500/10 to-blue-500/20',
    iconGradient: 'from-sky-500 to-cyan-400',
    glowColor: 'rgba(14, 165, 233, 0.15)',
    accentLine: 'from-sky-400 to-cyan-300',
  },
  {
    icon: Gift,
    titleKey: 'features.referral.title',
    descKey: 'features.referral.desc',
    gradient: 'from-gold/20 via-yellow-500/10 to-amber-500/20',
    iconGradient: 'from-[#D4AF37] to-[#F0D060]',
    glowColor: 'rgba(212, 175, 55, 0.15)',
    accentLine: 'from-[#D4AF37] to-[#F0D060]',
  },
] as const;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  3D Tilt Card Component                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TiltCard({
  feature,
  index,
  title,
  desc,
}: {
  feature: (typeof features)[number];
  index: number;
  title: string;
  desc: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const tiltX = (y - 0.5) * -12; // Rotate around X axis (up to ±6°)
    const tiltY = (x - 0.5) * 12;  // Rotate around Y axis (up to ±6°)
    setTilt({ x: tiltX, y: tiltY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        className={cn(
          'relative overflow-hidden rounded-3xl p-1',
          'transition-[transform,box-shadow] duration-300 ease-out',
        )}
        style={{
          transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovered ? 1.02 : 1})`,
          willChange: 'transform',
        }}
      >
        {/* Animated shimmer border (always visible, intensifies on hover) */}
        <div
          className={cn(
            'pointer-events-none absolute inset-0 rounded-3xl',
          )}
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, ${feature.glowColor} 10%, transparent 20%)`,
            animation: isHovered ? 'feature-spin 3s linear infinite' : 'feature-spin 8s linear infinite',
          }}
          aria-hidden="true"
        />

        {/* Inner card background */}
        <div
          className={cn(
            'relative z-10 rounded-[22px] p-6 sm:p-8',
            'bg-card/90 dark:bg-zinc-900/80',
            'backdrop-blur-2xl',
            'border border-border/50 dark:border-white/5',
            'transition-shadow duration-300',
          )}
          style={{
            boxShadow: isHovered
              ? `0 25px 60px -12px ${feature.glowColor}, 0 0 30px ${feature.glowColor}, inset 0 1px 0 rgba(255,255,255,0.3)`
              : '0 4px 20px -4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)',
          }}
        >
          {/* Gradient overlay that follows tilt direction */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background: `radial-gradient(600px circle at ${(tilt.y / 12) * 50 + 50}% ${(-tilt.x / 12) * 50 + 50}%, ${feature.glowColor}, transparent 60%)`,
            }}
            aria-hidden="true"
          />

          {/* Top accent line */}
          <div
            className={cn(
              'absolute top-0 right-0 left-0 h-[2px] rounded-t-[22px]',
              'bg-gradient-to-l opacity-0 transition-opacity duration-500 group-hover:opacity-100',
              feature.accentLine,
            )}
            aria-hidden="true"
          />

          {/* Card content */}
          <div className="relative z-10 flex flex-col gap-5">
            {/* Icon section — larger, more impressive */}
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  'relative flex items-center justify-center',
                  'w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl',
                  'bg-gradient-to-br',
                  feature.gradient,
                  'border border-border/40 dark:border-white/10',
                  'transition-all duration-500 ease-out',
                  'group-hover:scale-110 group-hover:rounded-3xl',
                  'group-hover:border-white/80 dark:group-hover:border-white/20',
                  'group-hover:shadow-lg',
                )}
                style={{
                  boxShadow: isHovered ? `0 0 30px ${feature.glowColor}` : 'none',
                }}
              >
                {/* Inner glow behind icon */}
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(circle at center, ${feature.glowColor}, transparent 70%)`,
                  }}
                />
                <Icon
                  className={cn(
                    'relative z-10 h-7 w-7 sm:h-8 sm:w-8 transition-all duration-500',
                    'bg-gradient-to-br bg-clip-text',
                    feature.iconGradient,
                  )}
                  style={{
                    color: isHovered ? undefined : '#D4AF37',
                    filter: isHovered ? `drop-shadow(0 0 8px ${feature.glowColor})` : 'none',
                  }}
                  strokeWidth={1.8}
                />
              </div>

              {/* Decorative corner sparkle */}
              <Sparkles
                className={cn(
                  'h-5 w-5 text-gold/0 transition-all duration-500',
                  'group-hover:text-gold/60 group-hover:scale-125',
                  'group-hover:rotate-12',
                )}
                strokeWidth={1.5}
              />
            </div>

            {/* Text content */}
            <div className="flex flex-col gap-2.5">
              <h3
                className={cn(
                  'text-lg font-bold tracking-tight sm:text-xl',
                  'text-foreground/90 group-hover:text-foreground',
                  'transition-colors duration-300',
                )}
              >
                {title}
              </h3>

              <p
                className={cn(
                  'text-sm leading-relaxed sm:text-[15px] sm:leading-7',
                  'text-foreground/75 group-hover:text-foreground/90',
                  'transition-colors duration-300',
                )}
              >
                {desc}
              </p>
            </div>

            {/* Bottom decorative bar */}
            <div className="flex items-center gap-2 pt-1">
              <div
                className={cn(
                  'h-[3px] w-8 rounded-full bg-gradient-to-l opacity-0',
                  'transition-all duration-500 group-hover:w-12 group-hover:opacity-100',
                  feature.accentLine,
                )}
              />
              <div className="h-[2px] flex-1 rounded-full bg-foreground/[0.04] group-hover:bg-foreground/[0.06] transition-colors duration-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Conic spin animation keyframes are injected via <style> below */}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Features Section Component                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function FeaturesSection() {
  const { t, dir } = useTranslation();

  return (
    <section
      id="features"
      dir={dir}
      className="relative py-20 sm:py-24 lg:py-28 overflow-hidden"
    >
      {/* Background decorations */}
      <div className="radial-gold-fade pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="dot-pattern pointer-events-none absolute inset-0 opacity-20" aria-hidden="true" />

      {/* Gold separator at top */}
      <div className="gold-separator mb-14 sm:mb-20" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          className="relative z-10 mb-14 text-center sm:mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Decorative background orb behind title */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] rounded-full opacity-30"
            style={{
              background: 'radial-gradient(ellipse, rgba(212, 175, 55, 0.15), transparent 70%)',
              filter: 'blur(40px)',
            }}
            aria-hidden="true"
          />

          {/* Badge */}
          <motion.div
            className="relative inline-flex items-center gap-2 sm:gap-2.5"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="relative flex items-center gap-1.5 sm:gap-2 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold">
              {/* Badge background */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-l from-gold/15 via-gold/8 to-gold/15 border border-gold/20" />
              {/* Animated dot */}
              <span className="relative flex items-center gap-1.5 sm:gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
                </span>
                <span className="gold-gradient-text relative z-10">{t('features.badge')}</span>
              </span>
            </span>
          </motion.div>

          {/* Title */}
          <h2
            className={cn(
              'relative mt-7 text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl',
              'gold-gradient-text gold-text-shadow',
              'leading-tight sm:leading-tight',
            )}
          >
            {t('features.title')}
          </h2>

          {/* Subtitle */}
          <p className="relative mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground/80 sm:mt-7 sm:text-base sm:leading-8">
            {t('features.subtitle')}
          </p>
        </motion.div>

        {/* ── Feature Cards Grid ── */}
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <TiltCard
              key={feature.titleKey}
              feature={feature}
              index={index}
              title={t(feature.titleKey)}
              desc={t(feature.descKey)}
            />
          ))}
        </div>

        {/* Bottom gold separator */}
        <div className="gold-separator mt-12 sm:mt-16" />
      </div>

      {/* Inject conic gradient spin animation */}
      <style jsx>{`
        @keyframes feature-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </section>
  );
}

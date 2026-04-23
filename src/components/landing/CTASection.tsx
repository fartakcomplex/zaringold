'use client';

import { motion } from '@/lib/framer-compat';
import { Sparkles, Users } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface CTASectionProps {
  onGetStarted: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function CTASection({ onGetStarted }: CTASectionProps) {
  const { t } = useTranslation();

  return (
    <section
      id="cta"
      dir="rtl"
      className="relative py-20 sm:py-28 overflow-hidden"
    >
      {/* ── Gold separator at top ── */}
      <div className="absolute top-0 left-0 right-0 gold-separator" />

      {/* ── Dark background with prominent radial gold glow ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, oklch(0.75 0.15 85 / 14%) 0%, oklch(0.75 0.15 85 / 4%) 40%, transparent 70%)',
        }}
      />

      {/* ── Second glow layer (offset) ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 40% 50% at 30% 60%, oklch(0.85 0.1 85 / 8%) 0%, transparent 60%)',
        }}
      />

      {/* ── Decorative gold sparkles ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="gold-sparkle absolute top-[15%] right-[20%]" style={{ animationDelay: '0s' }} />
        <div className="gold-sparkle absolute top-[30%] left-[15%]" style={{ animationDelay: '1s' }} />
        <div className="gold-sparkle absolute bottom-[25%] right-[35%]" style={{ animationDelay: '2s' }} />
        <div className="gold-sparkle absolute top-[50%] left-[40%]" style={{ animationDelay: '0.5s' }} />
        <div className="gold-sparkle absolute bottom-[15%] left-[25%]" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          
          transition={{ duration: 0.6 }}
        >
          {/* ── Large Heading ── */}
          <h2 className="gold-gradient-text mb-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl gold-text-shadow">
            همین حالا شروع کنید
          </h2>

          {/* ── Subtitle ── */}
          <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground sm:mb-10 sm:text-base">
            <Users className="size-4 text-gold" />
            <span>به بیش از ۱۰۰,۰۰۰ کاربر فعال زرین گلد بپیوندید</span>
          </div>

          {/* ── CTA Button ── */}
          <motion.button
            onClick={onGetStarted}
            className={cn(
              'cta-pulse-ring',
              'btn-gold-gradient btn-gold-shine',
              'inline-flex items-center gap-2',
              'rounded-xl px-8 py-3.5 sm:px-10 sm:py-4',
              'text-base font-bold sm:text-lg',
            )}
            animate={{ opacity: 1, scale: 1 }}
            
            initial={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Sparkles className="size-5 sm:size-5" />
            شروع کنید
          </motion.button>

          {/* ── Additional text ── */}
          <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground sm:mt-8 sm:text-sm">
            <span className="inline-block size-1.5 rounded-full bg-gold/60" />
            ثبت‌نام رایگان
            <span className="mx-1 text-border">•</span>
            بدون کارمزد اولیه
          </p>
        </motion.div>
      </div>
    </section>
  );
}

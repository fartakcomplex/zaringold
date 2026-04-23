'use client';

import { motion } from '@/lib/framer-compat';
import { Star, Quote } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Testimonial Data (hardcoded Persian)                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

const testimonials = [
  {
    name: 'علی محمدی',
    rating: 5,
    role: 'کاربر عادی',
    text: 'با زرین گلد تجربه معامله طلا برام خیلی راحت شد. کارمزد کم و پشتیبانی عالی.',
    variant: 'gold' as const,
  },
  {
    name: 'سارا احمدی',
    rating: 5,
    role: 'سرمایه‌گذار',
    text: 'پس‌انداز طلایی زرین گلد بهترین راه سرمایه‌گذاریه. خیلی راضیم.',
    variant: 'dark' as const,
  },
  {
    name: 'محمد رضایی',
    rating: 5,
    role: 'معامله‌گر حرفه‌ای',
    text: 'رابط کاربری ساده و سریع. بهترین پلتفرم معاملات طلا در ایران.',
    variant: 'gold' as const,
  },
  {
    name: 'فاطمه کریمی',
    rating: 4,
    role: 'کاربر فعال',
    text: 'هشدار قیمت طلا خیلی کمکم کرد. تو زمان مناسب خریدم کرد.',
    variant: 'dark' as const,
  },
  {
    name: 'رضا حسینی',
    rating: 5,
    role: 'دارنده کارت طلایی',
    text: 'کارت طلایی زرین گلد فوق‌العاده‌ست. طلای خودم رو خرجم می‌کنم.',
    variant: 'gold' as const,
  },
  {
    name: 'مریم نوری',
    rating: 5,
    role: 'کاربر جدید',
    text: 'پشتیبانی ۲۴ ساعته عالیه. هر سوالی داشتم سریع جواب دادن.',
    variant: 'dark' as const,
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function TestimonialsSection() {
  const { t } = useTranslation();

  return (
    <section
      id="testimonials"
      dir="rtl"
      className="relative py-16 sm:py-20 overflow-hidden"
    >
      {/* ── Background decorative ── */}
      <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          className="mx-auto mb-10 max-w-2xl text-center sm:mb-14"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="badge-gold mb-4 inline-block">
            {t('testimonials.badge')}
          </span>
          <h2 className="gold-gradient-text mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl gold-text-shadow">
            {t('testimonials.title')}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('testimonials.subtitle')}
          </p>
        </motion.div>

        {/* ── Testimonial Cards — horizontal scroll on mobile, 3-col on desktop ── */}
        <div className={cn(
          'flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory',
          '-mx-4 px-4 sm:mx-0 sm:px-0',
          'lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:pb-0',
          'scrollbar-thin mobile-scroll',
        )}
          style={{ scrollbarWidth: 'thin' }}
        >
          {testimonials.map((item, index) => (
            <motion.div
              key={item.name}
              className={cn(
                'relative min-w-[280px] sm:min-w-[320px] snap-center',
                'lg:min-w-0',
                'group rounded-2xl p-5 sm:p-6',
                'flex flex-col',
                /* Variant styling — gold vs dark card */
                item.variant === 'gold'
                  ? 'card-glass-premium'
                  : 'glass-card-enhanced',
                'hover-lift-md',
                /* Gold gradient border on hover */
                'hover:shadow-[0_0_0_1px_rgba(212,175,55,0.3),0_8px_32px_rgba(212,175,55,0.08)]',
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              {/* Quote icon — gold glow on hover */}
              <Quote className="absolute top-4 left-4 size-6 text-gold/15 sm:top-5 sm:left-5 transition-all duration-300 group-hover:text-gold/30 group-hover:drop-shadow-[0_0_6px_rgba(212,175,55,0.3)]" />

              {/* Avatar + Name + Role + Stars */}
              <div className="mb-4 flex items-center gap-3">
                <div className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-full',
                  'bg-gradient-to-br from-gold-light via-gold to-gold-dark',
                  'shadow-md shadow-gold/20',
                  'ring-2 ring-gold/10',
                )}>
                  <span className="text-base font-black text-gray-950">
                    {item.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate sm:text-base">
                    {item.name}
                  </h3>
                  <span className={cn(
                    'mt-0.5 inline-block text-[11px] font-medium px-2 py-0.5 rounded-full',
                    'bg-gold/10 text-gold border border-gold/15',
                  )}>
                    {item.role}
                  </span>
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'size-3.5 sm:size-4 transition-colors',
                          i < item.rating
                            ? 'fill-gold text-gold'
                            : 'fill-transparent text-muted-foreground/30',
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Quote text */}
              <p className="flex-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                &ldquo;{item.text}&rdquo;
              </p>

              {/* Bottom gold accent */}
              <div className="gold-separator mt-4" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

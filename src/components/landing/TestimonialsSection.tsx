'use client';

import { motion } from '@/lib/framer-compat';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useRef, useState, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Testimonial Data (hardcoded Persian)                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

const testimonials = [
  {
    name: 'علی محمدی',
    rating: 5,
    role: 'کاربر عادی',
    text: 'با زرین گلد تجربه معامله طلا برام خیلی راحت شد. کارمزد کم و پشتیبانی عالی.',
    date: '۲ هفته پیش',
  },
  {
    name: 'سارا احمدی',
    rating: 5,
    role: 'سرمایه‌گذار',
    text: 'پس‌انداز طلایی زرین گلد بهترین راه سرمایه‌گذاریه. خیلی راضیم.',
    date: '۱ ماه پیش',
  },
  {
    name: 'محمد رضایی',
    rating: 5,
    role: 'معامله‌گر حرفه‌ای',
    text: 'رابط کاربری ساده و سریع. بهترین پلتفرم معاملات طلا در ایران.',
    date: '۳ هفته پیش',
  },
  {
    name: 'فاطمه کریمی',
    rating: 4,
    role: 'کاربر فعال',
    text: 'هشدار قیمت طلا خیلی کمکم کرد. تو زمان مناسب خریدم کرد.',
    date: '۲ ماه پیش',
  },
  {
    name: 'رضا حسینی',
    rating: 5,
    role: 'دارنده کارت طلایی',
    text: 'کارت طلایی زرین گلد فوق‌العاده‌ست. طلای خودم رو خرجم می‌کنم.',
    date: '۱ هفته پیش',
  },
  {
    name: 'مریم نوری',
    rating: 5,
    role: 'کاربر جدید',
    text: 'پشتیبانی ۲۴ ساعته عالیه. هر سوالی داشتم سریع جواب دادن.',
    date: '۵ روز پیش',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Star Rating Component                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const iconSize = size === 'lg' ? 'size-5' : 'size-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="relative">
          <Star
            className={cn(
              iconSize,
              'transition-all duration-300',
              i < rating
                ? 'fill-gold text-gold drop-shadow-[0_0_4px_rgba(212,175,55,0.4)]'
                : 'fill-transparent text-muted-foreground/25',
            )}
          />
          {i < rating && (
            <div className="absolute inset-0 bg-gold/20 rounded-full blur-[2px]" />
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function TestimonialsSection() {
  const { t, dir } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  }, []);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector('.testimonial-card')?.offsetWidth || 320;
    el.scrollBy({
      left: dir === 'left' ? -(cardWidth + 16) : cardWidth + 16,
      behavior: 'smooth',
    });
  }, []);

  return (
    <section
      id="testimonials"
      dir={dir}
      className="relative py-16 sm:py-20 lg:py-24 overflow-hidden"
    >
      {/* ── Background decorative ── */}
      <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />
      <div className="absolute inset-0 radial-gold-fade pointer-events-none" />

      {/* ── Gold separator at top ── */}
      <div className="absolute top-0 left-0 right-0 gold-separator" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          className="mx-auto mb-10 max-w-2xl text-center sm:mb-14"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="badge-gold mb-4 inline-block">
            {t('testimonials.badge')}
          </span>
          <h2 className="gold-gradient-text mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl gold-text-shadow">
            {t('testimonials.title')}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base max-w-xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </motion.div>

        {/* ── Stats row ── */}
        <motion.div
          className="flex items-center justify-center gap-6 sm:gap-10 mb-10 sm:mb-14"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-extrabold gold-gradient-text">۴.۸</div>
            <StarRating rating={5} size="lg" />
            <div className="text-[11px] text-muted-foreground mt-1">از ۵ ستاره</div>
          </div>
          <div className="w-px h-12 bg-border/50" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-extrabold gold-gradient-text">۱۰۰K+</div>
            <div className="text-[11px] text-muted-foreground mt-1">کاربر فعال</div>
          </div>
          <div className="w-px h-12 bg-border/50" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-extrabold gold-gradient-text">۹۸٪</div>
            <div className="text-[11px] text-muted-foreground mt-1">رضایت</div>
          </div>
        </motion.div>

        {/* ── Desktop grid ── */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.name}
              className={cn(
                'testimonial-card group relative rounded-2xl overflow-hidden',
                'flex flex-col',
                'hover-lift-md',
                'card-spotlight',
              )}
              style={{
                background: 'linear-gradient(135deg, oklch(0.95 0.012 85 / 85%), oklch(0.97 0.008 85 / 90%))',
                border: '1px solid oklch(0.75 0.15 85 / 18%)',
                backdropFilter: 'blur(24px) saturate(200%)',
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Shimmer border overlay */}
              <div className="absolute inset-0 shimmer-border rounded-2xl pointer-events-none" />

              <div className="relative p-6 flex flex-col h-full">
                {/* Large quote watermark */}
                <div className="absolute top-3 left-4 pointer-events-none select-none">
                  <Quote
                    className={cn(
                      'size-16 sm:size-20 transition-all duration-500',
                      'text-gold/[0.06] group-hover:text-gold/[0.12]',
                    )}
                    strokeWidth={1}
                  />
                </div>

                {/* Top: Avatar + Info */}
                <div className="relative flex items-center gap-3.5 mb-5">
                  {/* Avatar with gold ring */}
                  <div className="relative shrink-0">
                    <div
                      className="flex size-12 items-center justify-center rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 60%, #8B6914 100%)',
                        boxShadow: '0 4px 12px rgba(212, 175, 55, 0.25), 0 0 0 2px rgba(212, 175, 55, 0.15)',
                      }}
                    >
                      <span className="text-lg font-black text-gray-950 drop-shadow-sm">
                        {item.name.charAt(0)}
                      </span>
                    </div>
                    {/* Online-style indicator */}
                    <div className="absolute -bottom-0.5 -left-0.5 size-4 rounded-full bg-white/90 flex items-center justify-center">
                      <div className="size-2.5 rounded-full bg-green-500 shadow-sm" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      'text-sm font-bold truncate',
                      'text-gray-900',
                    )}>
                      {item.name}
                    </h3>
                    <span className={cn(
                      'mt-0.5 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full',
                      'bg-gold/10 text-gold border border-gold/15',
                    )}>
                      {item.role}
                    </span>
                    <div className="mt-1">
                      <StarRating rating={item.rating} />
                    </div>
                  </div>

                  {/* Date */}
                  <span className={cn(
                    'text-[10px] shrink-0',
                    'text-gray-500',
                  )}>
                    {item.date}
                  </span>
                </div>

                {/* Gold accent divider */}
                <div className="h-px w-full mb-4" style={{
                  background: 'linear-gradient(90deg, transparent, oklch(0.75 0.15 85 / 25%), transparent)',
                }} />

                {/* Quote text */}
                <p className={cn(
                  'flex-1 text-sm leading-[1.85] relative',
                  'text-gray-700',
                )}>
                  <Quote className="inline-block size-4 text-gold/40 align-top ml-1 -mt-0.5" strokeWidth={2.5} />
                  {item.text}
                </p>

                {/* Bottom gold accent bar */}
                <div className="mt-5 flex items-center gap-2">
                  <div className="h-0.5 flex-1 rounded-full" style={{
                    background: 'linear-gradient(90deg, oklch(0.75 0.15 85 / 30%), transparent)',
                  }} />
                  <div className="flex items-center gap-0.5">
                    <Star className="size-2.5 fill-gold text-gold" />
                    <span className="text-[10px] font-bold text-gold">{item.rating}.۰</span>
                  </div>
                  <div className="h-0.5 flex-1 rounded-full" style={{
                    background: 'linear-gradient(270deg, oklch(0.75 0.15 85 / 30%), transparent)',
                  }} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Mobile horizontal scroll ── */}
        <div className="lg:hidden relative">
          {/* Fade edges */}
          <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none" style={{
            background: 'linear-gradient(270deg, transparent, oklch(1 0 0 / 80%))',
          }} />
          <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none" style={{
            background: 'linear-gradient(90deg, transparent, oklch(1 0 0 / 80%))',
          }} />

          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className={cn(
              'flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory px-2',
              'mobile-scroll scrollbar-thin',
            )}
            style={{ scrollbarWidth: 'thin' }}
          >
            {testimonials.map((item, index) => (
              <motion.div
                key={item.name}
                className={cn(
                  'testimonial-card relative min-w-[280px] sm:min-w-[300px] snap-center',
                  'group rounded-2xl overflow-hidden',
                  'flex flex-col',
                  'hover-lift-md',
                  'card-spotlight',
                )}
                style={{
                  background: 'linear-gradient(135deg, oklch(0.95 0.012 85 / 85%), oklch(0.97 0.008 85 / 90%))',
                  border: '1px solid oklch(0.75 0.15 85 / 18%)',
                  backdropFilter: 'blur(24px) saturate(200%)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <div className="absolute inset-0 shimmer-border rounded-2xl pointer-events-none" />

                <div className="relative p-5 flex flex-col h-full">
                  {/* Quote watermark */}
                  <div className="absolute top-2 left-3 pointer-events-none select-none">
                    <Quote
                      className={cn(
                        'size-14 transition-all duration-500',
                        'text-gold/[0.06] group-hover:text-gold/[0.12]',
                      )}
                      strokeWidth={1}
                    />
                  </div>

                  {/* Avatar + Info */}
                  <div className="relative flex items-center gap-3 mb-4">
                    <div className="relative shrink-0">
                      <div
                        className="flex size-10 items-center justify-center rounded-full"
                        style={{
                          background: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 60%, #8B6914 100%)',
                          boxShadow: '0 4px 12px rgba(212, 175, 55, 0.25), 0 0 0 2px rgba(212, 175, 55, 0.15)',
                        }}
                      >
                        <span className="text-sm font-black text-gray-950">{item.name.charAt(0)}</span>
                      </div>
                      <div className="absolute -bottom-0.5 -left-0.5 size-3.5 rounded-full bg-white/90 flex items-center justify-center">
                        <div className="size-2 rounded-full bg-green-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn('text-sm font-bold truncate', 'text-gray-900')}>{item.name}</h3>
                      <span className="mt-0.5 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/15">
                        {item.role}
                      </span>
                      <div className="mt-1"><StarRating rating={item.rating} /></div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px w-full mb-3" style={{
                    background: 'linear-gradient(90deg, transparent, oklch(0.75 0.15 85 / 25%), transparent)',
                  }} />

                  {/* Text */}
                  <p className={cn('flex-1 text-sm leading-[1.8]', 'text-gray-700')}>
                    <Quote className="inline-block size-3.5 text-gold/40 align-top ml-1 -mt-0.5" strokeWidth={2.5} />
                    {item.text}
                  </p>

                  {/* Bottom accent */}
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-0.5 flex-1 rounded-full" style={{
                      background: 'linear-gradient(90deg, oklch(0.75 0.15 85 / 30%), transparent)',
                    }} />
                    <Star className="size-2.5 fill-gold text-gold" />
                    <span className="text-[10px] font-bold text-gold">{item.rating}.۰</span>
                    <div className="h-0.5 flex-1 rounded-full" style={{
                      background: 'linear-gradient(270deg, oklch(0.75 0.15 85 / 30%), transparent)',
                    }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile scroll buttons */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={cn(
                'flex items-center justify-center size-10 rounded-full',
                'glass-gold transition-all duration-200',
                'disabled:opacity-30 disabled:cursor-not-allowed',
                'hover:shadow-[0_0_12px_rgba(212,175,55,0.2)]',
              )}
            >
              <ChevronRight className="size-5 text-gold" />
            </button>
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {testimonials.map((_, i) => (
                <div key={i} className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all',
                  i === 0 ? 'bg-gold w-4' : 'bg-gold/25',
                )} />
              ))}
            </div>
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={cn(
                'flex items-center justify-center size-10 rounded-full',
                'glass-gold transition-all duration-200',
                'disabled:opacity-30 disabled:cursor-not-allowed',
                'hover:shadow-[0_0_12px_rgba(212,175,55,0.2)]',
              )}
            >
              <ChevronLeft className="size-5 text-gold" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

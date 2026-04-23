'use client';

import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  Star,
  Quote,
  ShieldCheck,
  Users,
  Heart,
  Award,
  MessageCircle,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

/* ─── Testimonials Data ─── */
const testimonials = [
  {
    name: 'علی محمدی',
    role: 'سرمایه‌گذار حرفه‌ای',
    initials: 'ع',
    review:
      'از وقتی زرین گلد رو شناختم، خرید و فروش طلا برام خیلی راحت‌تر شده. کارمزد خیلی کمه و سرعت معاملات فوق‌العاده‌ست. واقعاً تجربه متفاوتیه.',
    rating: 5,
  },
  {
    name: 'سارا احمدی',
    role: 'کارمند',
    initials: 'س',
    review:
      'من برای پس‌انداز ماهانه طلا می‌خرم. رابط کاربری خیلی ساده‌ست و حتی پدرم هم راحت استفاده می‌کنه. پشتیبانیشون هم عالیه.',
    rating: 5,
  },
  {
    name: 'رضا کریمی',
    role: 'معامله‌گر',
    initials: 'ر',
    review:
      'قیمت‌ها لحظه‌ای آپدیت میشه و امکان فروش آنی وجود داره. پاداش دعوت هم خیلی جذابه. بهترین پلتفرم معاملات طلا در ایران.',
    rating: 5,
  },
  {
    name: 'مریم حسینی',
    role: 'خانه‌دار',
    initials: 'م',
    review:
      'بهترین راه برای پس‌انداز طلا. هیچ‌وقت فکر نمی‌کردم خرید طلا انقدر راحت باشه.',
    rating: 4,
  },
  {
    name: 'امیر نوری',
    role: 'دانشجو',
    initials: 'ا',
    review:
      'با بودجه کم هم می‌تونی ماهی چند گرم طلا بخری. عالیه!',
    rating: 5,
  },
  {
    name: 'فاطمه زارعی',
    role: 'بازرگان',
    initials: 'ف',
    review:
      'پشتیبانی سریع و قیمت‌های منصفانه. برای کسب‌وکاردم هم استفاده می‌کنم.',
    rating: 5,
  },
];

/* ─── Stats Data ─── */
const stats = [
  { icon: Users, value: '۵۰,۰۰۰+', label: 'کاربر فعال' },
  { icon: Heart, value: '۹۸٪', label: 'رضایت' },
  { icon: Award, value: '۴.۸', label: 'امتیاز' },
  { icon: MessageCircle, value: '۱۰۰+', label: 'نظر' },
];

/* ─── Avatar Gradients ─── */
const avatarGradients = [
  'from-amber-400 via-yellow-500 to-orange-500',
  'from-rose-400 via-pink-500 to-fuchsia-500',
  'from-sky-400 via-blue-500 to-indigo-500',
  'from-emerald-400 via-green-500 to-teal-500',
  'from-violet-400 via-purple-500 to-indigo-500',
  'from-cyan-400 via-teal-500 to-emerald-500',
];

/* ─── Animation Variants ─── */
const statsVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, delay: i * 0.1 },
  }),
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

/* ─── Component ─── */
export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const totalCards = testimonials.length;

  /* Auto-scroll every 4 seconds */
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalCards);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, totalCards]);

  /* Scroll to active card on mobile */
  const scrollToCard = useCallback(
    (index: number) => {
      if (!scrollRef.current) return;
      const cards = scrollRef.current.children;
      if (cards[index]) {
        cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    },
    [],
  );

  useEffect(() => {
    scrollToCard(currentIndex);
  }, [currentIndex, scrollToCard]);

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section id="testimonials" className="relative overflow-hidden bg-muted/20 py-12 sm:py-16">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="radial-gold-fade absolute top-0 right-1/3 h-[400px] w-[400px]" />
        <div className="radial-gold-fade absolute bottom-0 left-1/4 h-[300px] w-[300px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 dot-pattern opacity-30" />

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
            اعتماد کاربران
          </span>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
            <span className="gold-gradient-text gold-text-shadow">نظر کاربران</span> ما
          </h2>
        </motion.div>

        {/* ── Stats Bar ── */}
        <motion.div
          className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {stats.map((s, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={statsVariants}
              className="glass-card-enhanced stat-glow flex flex-col items-center gap-1.5 rounded-xl px-3 py-4"
            >
              <s.icon className="size-5 text-gold/70" />
              <span className="gold-gradient-text text-2xl font-extrabold leading-none tabular-nums">
                {s.value}
              </span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Mobile / Tablet Carousel ── */}
        <div
          className="lg:hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {testimonials.map((t, i) => (
              <TestimonialCard
                key={i}
                testimonial={t}
                gradient={avatarGradients[i % avatarGradients.length]}
                isActive={i === currentIndex}
              />
            ))}
          </div>

          {/* Dot indicators */}
          <div className="mt-5 flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => handleDotClick(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-6 bg-gold shadow-sm shadow-gold/30'
                    : 'w-2 bg-gold/25 hover:bg-gold/40'
                }`}
                aria-label={`نظر ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* ── Desktop 3-Column Grid ── */}
        <motion.div
          className="hidden gap-5 lg:grid lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {testimonials.map((t, i) => (
            <motion.div key={i} variants={cardVariants}>
              <TestimonialCard
                testimonial={t}
                gradient={avatarGradients[i % avatarGradients.length]}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Individual Testimonial Card ─── */
function TestimonialCard({
  testimonial: t,
  gradient,
  isActive = false,
}: {
  testimonial: (typeof testimonials)[number];
  gradient: string;
  isActive?: boolean;
}) {
  return (
    <div
      className={`group card-glass-premium relative min-w-[280px] flex-1 snap-center overflow-hidden rounded-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-gold/5 sm:min-w-[300px] ${
        isActive ? 'ring-1 ring-gold/30' : ''
      }`}
    >
      {/* Gold gradient top border */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Hover glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-gold/5 to-transparent" />
      </div>

      <div className="relative z-10 flex h-full flex-col gap-3 p-5 sm:gap-4 sm:p-6">
        {/* Quote icon */}
        <Quote className="size-7 text-gold/25 transition-colors duration-300 group-hover:text-gold/40 sm:size-8" />

        {/* Review text */}
        <p className="flex-1 text-sm leading-7 text-muted-foreground">
          &ldquo;{t.review}&rdquo;
        </p>

        {/* Star rating */}
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, j) => (
            <Star
              key={j}
              className={`size-4 ${
                j < t.rating
                  ? 'fill-gold text-gold'
                  : 'text-muted-foreground/25'
              }`}
            />
          ))}
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 border-t border-border/40 pt-3 sm:pt-4">
          {/* Avatar with gradient */}
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-bl text-sm font-bold text-white shadow-lg shadow-black/10 sm:size-11 ${gradient}`}
          >
            {t.initials}
          </div>
          <div className="flex flex-1 items-center gap-1.5">
            <div>
              <p className="text-sm font-bold">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.role}</p>
            </div>
            {/* Verified badge */}
            <ShieldCheck className="size-4 shrink-0 text-gold" />
          </div>
        </div>
      </div>

      {/* Bottom gold accent line */}
      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-l from-gold-light via-gold to-gold-dark transition-all duration-500 group-hover:w-full" />
    </div>
  );
}

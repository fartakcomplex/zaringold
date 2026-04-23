'use client';

import { motion, AnimatePresence } from '@/lib/framer-compat';
import { Check, Crown, Medal, Award, Sparkles, TrendingUp, TrendingDown, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Fee Summary Data ─── */
const feeSummary = [
  { label: 'خرید طلا', value: '۰.۵٪', icon: TrendingUp },
  { label: 'فروش طلا', value: '۰.۳٪', icon: TrendingDown },
  { label: 'واریز', value: 'رایگان', icon: ArrowDownToLine },
  { label: 'برداشت', value: '۰.۰۱ گرم طلا', icon: ArrowUpFromLine },
];

/* ─── Pricing Tier Data ─── */
const plans = [
  {
    icon: Medal,
    title: 'برنزی',
    gradient: 'from-amber-700 via-amber-800 to-amber-900',
    badge: 'پایه',
    badgeColor: 'bg-amber-700/10 text-amber-600 ring-amber-700/20',
    popular: false,
    features: [
      'خرید و فروش طلا',
      'کیف پول طلایی',
      'تاریخچه معاملات',
    ],
  },
  {
    icon: Award,
    title: 'نقره‌ای',
    gradient: 'from-gray-400 via-gray-500 to-gray-600',
    badge: 'محبوب',
    badgeColor: 'bg-gold/10 text-gold ring-gold/20',
    popular: true,
    features: [
      'تمام امکانات برنزی',
      'اطلاع‌رسانی لحظه‌ای',
      'هشدار قیمت طلا',
      'گزارش‌های مالی',
    ],
  },
  {
    icon: Crown,
    title: 'طلایی',
    gradient: 'from-gold-light via-gold to-gold-dark',
    badge: 'حرفه‌ای',
    badgeColor: 'bg-gold/10 text-gold ring-gold/20',
    popular: false,
    features: [
      'تمام امکانات نقره‌ای',
      'تحلیل تکنیکال طلا',
      'پشتیبانی ویژه',
      'اولویت در معاملات',
      'مشاوره سرمایه‌گذاری',
    ],
  },
];

/* ─── Animation Variants ─── */
const feeCardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, delay: i * 0.1 },
  }),
};

const planVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.15 },
  }),
};

/* ─── Component ─── */
export default function Pricing() {
  return (
    <section id="pricing" className="relative overflow-hidden bg-background py-12 sm:py-16">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="radial-gold-fade absolute top-1/3 right-1/4 h-[500px] w-[500px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-30" />

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
            تعرفه‌ها
          </span>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
            <span className="gold-gradient-text gold-text-shadow">کارمزد شفاف</span>
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
            بدون هزینه پنهان — تمام سطوح خدمات به صورت رایگان
          </p>
        </motion.div>

        {/* ── Fee Summary Cards ── */}
        <motion.div
          className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {feeSummary.map((fee, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={feeCardVariants}
              className="glass-card-enhanced stat-glow flex flex-col items-center gap-1.5 rounded-xl px-3 py-4 text-center"
            >
              <fee.icon className="size-5 text-gold/60" />
              <p className="text-sm text-muted-foreground">{fee.label}</p>
              <p className="gold-gradient-text text-lg font-extrabold tabular-nums">
                {fee.value}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Pricing Tier Cards ── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={planVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <div
                className={cn(
                  'card-glass-premium group relative overflow-hidden rounded-2xl transition-all duration-500',
                  plan.popular
                    ? 'ring-2 ring-gold/40 shadow-xl shadow-gold/10 sm:scale-[1.03] hover:-translate-y-2'
                    : 'hover:-translate-y-1.5 hover:shadow-xl hover:shadow-gold/5',
                )}
              >
                {/* Popular gold ribbon */}
                {plan.popular && (
                  <div className="absolute left-0 top-6 z-20 flex items-center gap-1 -translate-x-1/3 rotate-45 bg-gradient-to-r from-gold-light via-gold to-gold-dark px-8 py-1 shadow-lg shadow-gold/30">
                    <Sparkles className="size-3 text-gray-950" />
                    <span className="text-xs font-bold text-gray-950">محبوب‌ترین</span>
                  </div>
                )}

                {/* Hover shimmer overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/0 via-gold/0 to-gold/0 opacity-0 transition-opacity duration-500 group-hover:from-gold/[0.03] group-hover:via-transparent group-hover:to-gold/[0.05] group-hover:opacity-100" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center px-5 pb-7 pt-9 sm:px-6 sm:pb-8 sm:pt-10">
                  {/* Icon in gradient circle */}
                  <div
                    className={cn(
                      'mb-3 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-bl shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl sm:mb-4 sm:size-16',
                      plan.gradient,
                    )}
                  >
                    <plan.icon className="size-6 text-white sm:size-7" />
                  </div>

                  {/* Title */}
                  <h3 className="mb-1.5 text-lg font-bold sm:mb-2 sm:text-xl">{plan.title}</h3>

                  {/* Badge */}
                  <span
                    className={cn(
                      'mb-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 sm:mb-4',
                      plan.badgeColor,
                    )}
                  >
                    {plan.badge}
                  </span>

                  {/* Price */}
                  <p className="gold-gradient-text text-2xl font-extrabold sm:text-3xl">رایگان</p>
                  <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">برای همیشه رایگان!</p>

                  {/* Divider */}
                  <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-gold/20 to-transparent sm:my-5" />

                  {/* Features list with gold checkmarks */}
                  <ul className="w-full space-y-2.5 sm:space-y-3">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm">
                        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gold/10">
                          <Check className="size-3 text-gold" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom gold accent line */}
                <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-gradient-to-l from-gold-light via-gold to-gold-dark transition-all duration-500 group-hover:w-full" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import { motion, AnimatePresence } from '@/lib/framer-compat';
import { BarChart3, Coins, Shield, Zap } from 'lucide-react';
import GoldCalculator from '@/components/shared/GoldCalculator';

/* ─── Props ─── */
interface GoldCalcSectionProps {
  onLogin: () => void;
}

/* ─── Data ─── */
const coinFeatures = [
  {
    icon: BarChart3,
    title: 'قیمت لحظه‌ای',
    description: 'محاسبه بر اساس قیمت واقعی بازار طلا',
  },
  {
    icon: Coins,
    title: 'انواع سکه',
    description: 'پشتیبانی از سکه پارسیان، بهار آزادی، نیم و ربع سکه',
  },
  {
    icon: Shield,
    title: 'قیمت خرید و فروش',
    description: 'مشاهده قیمت خرید، فروش و اسپرد به صورت همزمان',
  },
  {
    icon: Zap,
    title: 'تبدیل سریع',
    description: 'تبدیل لحظه‌ای بین گرم، میلی‌گرم و انواع سکه',
  },
];

/* ─── Animation Variants ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

/* ─── Component ─── */
export default function GoldCalcSection({ onLogin }: GoldCalcSectionProps) {
  return (
    <section id="calculator" className="relative overflow-hidden bg-muted/20 py-12 sm:py-16">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="radial-gold-fade absolute bottom-0 right-1/4 h-[500px] w-[500px]" />
        <div className="radial-gold-fade absolute top-0 left-1/3 h-[300px] w-[300px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 dot-pattern opacity-30" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ── */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <span className="badge-gold inline-block px-5 py-1.5 text-sm font-semibold">
            ابزارها
          </span>
          <h2 className="mt-5 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
            <span className="gold-gradient-text gold-text-shadow">ماشین حساب طلا</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            با ماشین حساب طلا، به راحتی قیمت انواع سکه و طلای خام را
            محاسبه کنید و مقدار سرمایه مورد نیاز خود را تخمین بزنید
          </p>
        </motion.div>

        {/* ── Two-Column Layout ── */}
        <motion.div
          className="grid items-start gap-10 lg:grid-cols-2"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {/* Left column: Gold coin + feature info cards */}
          <motion.div variants={itemVariants} className="order-2 lg:order-1">
            {/* Gold coin illustration */}
            <div className="mb-10 flex items-center justify-center lg:justify-start">
              <div className="gold-coin relative">
                {/* Outer decorative dashed ring */}
                <div className="absolute inset-[-12px] rounded-full border-2 border-dashed border-gold/15 animate-[spin_25s_linear_infinite]" />

                {/* Inner solid ring */}
                <div className="absolute inset-[-6px] rounded-full border border-gold/10" />

                {/* Main coin */}
                <div className="gold-coin-inner flex size-28 items-center justify-center rounded-full bg-gradient-to-br from-gold-light via-gold to-gold-dark shadow-2xl shadow-gold/30 sm:size-36">
                  <div className="text-center">
                    <span className="block text-3xl font-extrabold text-gray-950 sm:text-4xl">
                      Au
                    </span>
                    <span className="block text-[10px] font-semibold text-gray-900/60 sm:text-xs">
                      ۷۹.۹۹۹
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature info cards — 2x2 grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {coinFeatures.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="group card-gold-border rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold/15 to-gold/5 ring-1 ring-gold/10 transition-all duration-300 group-hover:from-gold/25 group-hover:to-gold/10 group-hover:ring-gold/20">
                    <feature.icon className="size-4.5 text-gold transition-colors duration-300 group-hover:text-gold-light" />
                  </div>
                  <h4 className="mb-1 text-sm font-bold">{feature.title}</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right column: GoldCalculator */}
          <motion.div variants={itemVariants} className="order-1 lg:order-2">
            <GoldCalculator variant="landing" onTrade={onLogin} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

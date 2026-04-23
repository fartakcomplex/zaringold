'use client';

import { motion } from '@/lib/framer-compat';
import { UserPlus, FileCheck, Wallet, Coins, type LucideIcon } from 'lucide-react';

/* ─── Steps Data ─── */
interface StepItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const steps: StepItem[] = [
  {
    icon: UserPlus,
    title: 'ثبت‌نام سریع',
    description: 'فقط با شماره موبایل در کمتر از ۳۰ ثانیه ثبت‌نام کنید',
  },
  {
    icon: FileCheck,
    title: 'احراز هویت',
    description: 'با ارسال مدارک هویتی، حساب خود را تأیید کنید',
  },
  {
    icon: Wallet,
    title: 'شارژ کیف پول',
    description: 'مبلغ دلخواه را به کیف پول خود واریز کنید',
  },
  {
    icon: Coins,
    title: 'خرید طلا',
    description: 'با بهترین قیمت، طلای خود را بخرید و پس‌انداز کنید',
  },
];

/* ─── Animation Variants ─── */
const stepVariants = {
  hidden: (i: number) => ({ opacity: 0, y: 30 }),
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.15, ease: 'easeOut' },
  }),
};

const numberVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      delay: i * 0.15 + 0.2,
      type: 'spring',
      stiffness: 200,
    },
  }),
};

/* ─── Component ─── */
export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-background py-12 sm:py-16">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="radial-gold-fade absolute top-1/4 left-1/3 h-[400px] w-[400px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-30" />

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
            راهنما
          </span>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
            <span className="gold-gradient-text gold-text-shadow">چطور کار می‌کنه؟</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            با چهار مرحله ساده، سرمایه‌گذاری در طلا را شروع کنید
          </p>
        </motion.div>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  Desktop: Horizontal 4-col grid with golden connecting line */}
        {/* ════════════════════════════════════════════════════════ */}
        <div className="relative hidden lg:block">
          {/* Connecting golden line */}
          <div
            className="timeline-line-glow absolute top-[2.75rem] right-[calc(12.5%+1.75rem)] left-[calc(12.5%+1.75rem)] h-[2px]"
            aria-hidden
          />

          <div className="grid grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={stepVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                className="flex flex-col items-center text-center"
              >
                {/* Step Circle */}
                <div className="relative mb-5">
                  {/* Glow backdrop */}
                  <div className="absolute inset-0 rounded-2xl bg-gold/20 blur-lg" />

                  {/* Gold gradient circle with icon */}
                  <div className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-light via-gold to-gold-dark shadow-xl shadow-gold/25 transition-all duration-300 hover:shadow-2xl hover:shadow-gold/30">
                    <step.icon className="size-6 text-gray-950" />
                  </div>

                  {/* Step number badge */}
                  <motion.span
                    custom={i}
                    variants={numberVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="absolute -top-2.5 -right-2.5 flex size-7 items-center justify-center rounded-full bg-background text-xs font-extrabold text-gold shadow-md ring-2 ring-gold/30"
                  >
                    {i + 1}
                  </motion.span>
                </div>

                {/* Title */}
                <h3 className="mb-2 text-lg font-bold">{step.title}</h3>
                {/* Description */}
                <p className="max-w-[220px] text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  Mobile / Tablet: Vertical timeline — line on right, cards on left */}
        {/* ════════════════════════════════════════════════════════ */}
        <div className="relative lg:hidden">
          {/* Vertical connecting line on right side */}
          <div
            className="timeline-line-glow absolute top-0 bottom-0 right-6 w-[2px] sm:right-8"
            aria-hidden
          />

          <div className="space-y-6 sm:space-y-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={stepVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                className="relative flex gap-4 sm:gap-6"
              >
                {/* Step circle on the right line */}
                <div className="relative z-10 shrink-0">
                  {/* Glow */}
                  <div className="absolute inset-0 rounded-2xl bg-gold/20 blur-lg" />

                  {/* Circle */}
                  <div className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-light via-gold to-gold-dark shadow-lg shadow-gold/25 sm:size-14">
                    <step.icon className="size-5 text-gray-950 sm:size-6" />
                  </div>

                  {/* Step number badge (positioned on the left of the circle for RTL) */}
                  <motion.span
                    custom={i}
                    variants={numberVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="absolute -top-2 -left-2 flex size-6 items-center justify-center rounded-full bg-background text-[11px] font-extrabold text-gold shadow-md ring-2 ring-gold/30 sm:-top-2.5 sm:-left-2.5 sm:size-7 sm:text-xs"
                  >
                    {i + 1}
                  </motion.span>
                </div>

                {/* Content card on the left */}
                <div className="glass-card-enhanced flex-1 rounded-xl p-4 transition-all duration-300 hover:border-gold/20 hover:shadow-lg hover:shadow-gold/5 sm:p-5">
                  <h3 className="mb-1 text-base font-bold sm:mb-1.5 sm:text-lg">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

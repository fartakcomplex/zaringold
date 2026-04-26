'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import { Landmark, BarChart3, Building2, ShieldCheck, Heart, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/* ------------------------------------------------------------------ */
/*  Partners Data (hardcoded Persian)                                   */
/* ------------------------------------------------------------------ */

interface Partner {
  icon: typeof Landmark;
  name: string;
  description: string;
}

const partners: Partner[] = [
  {
    icon: Landmark,
    name: 'بانک مرکزی',
    description: 'همکاری رسمی با بانک مرکزی',
  },
  {
    icon: BarChart3,
    name: 'بورس کالا',
    description: 'عضو رسمی بورس کالا',
  },
  {
    icon: Building2,
    name: 'اتاق بازرگانی',
    description: 'عضو اتاق بازرگانی',
  },
  {
    icon: ShieldCheck,
    name: 'صندوق ضمانت',
    description: 'تحت پوشش صندوق ضمانت',
  },
  {
    icon: Heart,
    name: 'شرکت بیمه',
    description: 'بیمه تمام سرمایه‌ها',
  },
  {
    icon: Users,
    name: 'نظام صنفی',
    description: 'عضو نظام صنفی طلا',
  },
];

/* ------------------------------------------------------------------ */
/*  Security Badges                                                    */
/* ------------------------------------------------------------------ */

const securityBadges = [
  { emoji: '🔒', label: 'SSL امن' },
  { emoji: '🛡️', label: 'دو فاکتور' },
  { emoji: '💎', label: 'تأیید شده' },
  { emoji: '⭐', label: 'رتبه ۴.۸' },
];

/* ------------------------------------------------------------------ */
/*  Count-up hook                                                      */
/* ------------------------------------------------------------------ */

function useCountUp(end: number, duration: number = 2000, active: boolean = false) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!active || hasAnimated.current) return;
    hasAnimated.current = true;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, active]);

  return count;
}

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

const statVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TrustPartners() {
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsInView, setStatsInView] = useState(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const satisfactionCount = useCountUp(98, 2000, statsInView);

  return (
    <section id="trust-partners" className="relative cta-gradient py-12 sm:py-16">
      {/* Subtle dot pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        aria-hidden
        style={{
          backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Section header ── */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <span className="badge-gold inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
            شرکای معتبر
          </span>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            <span className="gold-gradient-text gold-text-shadow">
              همکاری‌های معتبر و قابل اعتماد
            </span>
          </h2>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  Partners Grid (3×2)                                         */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <motion.div
          className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {partners.map((partner, i) => (
            <motion.div key={i} variants={cardVariants}>
              <Card className="card-gold-border gold-bottom-accent group relative h-full overflow-hidden">
                <CardContent className="relative flex flex-col items-center gap-3 p-5 text-center sm:p-6">
                  <div className="gold-icon-circle">
                    <partner.icon className="size-6 text-gold sm:size-7" />
                  </div>
                  <h3 className="text-base font-bold sm:text-lg">{partner.name}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {partner.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  Security Badges Row                                         */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <motion.div
          className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          {securityBadges.map((badge, i) => (
            <motion.div
              key={i}
              variants={badgeVariants}
              className="badge-gold glass-card-enhanced flex items-center gap-2.5 rounded-full px-4 py-2.5 transition-all duration-300 hover:border-gold/30 hover:shadow-md hover:shadow-gold/5"
            >
              <span className="text-lg" role="img" aria-label={badge.label}>
                {badge.emoji}
              </span>
              <span className="whitespace-nowrap text-sm font-semibold">
                {badge.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  Animated Stats Row                                           */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div ref={statsRef} className="mt-6">
          <motion.div
            className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {/* Stat 1: Successful Transactions */}
            <motion.div variants={statVariants} className="stat-glow rounded-xl border border-border/40 p-4 text-center glass-card-enhanced">
              <p className="text-3xl font-bold tabular-nums text-gold-gradient sm:text-4xl">
                ۲M
                <span className="text-xl sm:text-2xl">+</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                تراکنش موفق
              </p>
            </motion.div>

            {/* Stat 2: User Satisfaction (animated count-up) */}
            <motion.div variants={statVariants} className="stat-glow rounded-xl border border-border/40 p-4 text-center glass-card-enhanced">
              <p className="text-3xl font-bold tabular-nums text-gold-gradient sm:text-4xl">
                {statsInView ? satisfactionCount.toLocaleString('fa-IR') : '—'}
                <span className="text-xl sm:text-2xl">٪</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                رضایت
              </p>
            </motion.div>

            {/* Stat 3: 24/7 Support */}
            <motion.div variants={statVariants} className="stat-glow rounded-xl border border-border/40 p-4 text-center glass-card-enhanced">
              <p className="text-3xl font-bold tabular-nums text-gold-gradient sm:text-4xl">
                ۲۴/۷
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                پشتیبانی
              </p>
            </motion.div>

            {/* Stat 4: Years of Activity */}
            <motion.div variants={statVariants} className="stat-glow rounded-xl border border-border/40 p-4 text-center glass-card-enhanced">
              <p className="text-3xl font-bold tabular-nums text-gold-gradient sm:text-4xl">
                ۵
                <span className="text-xl sm:text-2xl"> سال</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                سابقه
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

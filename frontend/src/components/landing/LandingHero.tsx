
import {useEffect, useState, useRef} from 'react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {Shield, TrendingUp, Zap, Users, Star, CircleDot, Coins, RefreshCw} from 'lucide-react';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {useTranslation} from '@/lib/i18n';
import {useRealGoldPrice, getSourceLabel, getSourceColor} from '@/hooks/useRealGoldPrice';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Animated count-up hook (IntersectionObserver + requestAnimationFrame)      */
/* ═══════════════════════════════════════════════════════════════════════════ */

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
      // ease-out quartic for satisfying deceleration
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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Static data                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const STATS = [
  { labelKey: 'landing.statActiveUsers', value: 125000, suffix: '+', icon: Users },
  { labelKey: 'landing.statTradeVolume', value: 8500, suffix: ' میلیارد+', icon: TrendingUp },
  { labelKey: 'landing.statGoldGrams', value: 2500, suffix: '+', icon: Coins },
  { labelKey: 'landing.statSatisfaction', value: 98, suffix: '٪', icon: Star },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface LandingHeroProps {
  onGetStarted?: () => void;
}

export default function LandingHero({ onGetStarted }: LandingHeroProps) {
  const { t, dir } = useTranslation();

  /* ── Real-time gold prices ── */
  const { prices: goldPrices, coinPrices, isLoading, isLive, source, refresh } = useRealGoldPrice();

  /* ── Stats intersection observer ── */
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const countUsers = useCountUp(STATS[0].value, 2000, statsVisible);
  const countTrade = useCountUp(STATS[1].value, 2000, statsVisible);
  const countGold = useCountUp(STATS[2].value, 2000, statsVisible);
  const countSatisfaction = useCountUp(STATS[3].value, 2000, statsVisible);
  const counts = [countUsers, countTrade, countGold, countSatisfaction];

  /* ── Build live price cards ── */
  const safe = (n: number) =>
    typeof n === 'number' && !isNaN(n) && n > 0 ? n : 0;

  const livePrices = [
    { name: t('landing.secCoin'), price: safe(goldPrices.sekkehEmami), change: coinPrices[0]?.change ?? 0, isDollar: false },
    { name: t('landing.halfCoin'), price: safe(goldPrices.nimSekkeh), change: coinPrices[1]?.change ?? 0, isDollar: false },
    { name: t('landing.gold18'), price: safe(goldPrices.geram18), change: 0, isDollar: false },
    { name: t('landing.globalOunce'), price: safe(goldPrices.ounceUsd), change: 0, isDollar: true },
  ];

  /* ── Price item animation variants ── */
  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: i * 0.1, ease: 'easeOut' as const },
    }),
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <section id="hero" dir={dir} className="relative overflow-hidden">
      {/* ── Dark gradient background ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#111] to-[#0d0d0d]" />

      {/* ── Subtle gold radial glow (no particles) ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {/* Primary glow — centered top */}
        <div
          className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full opacity-60"
          style={{
            background:
              'radial-gradient(ellipse 50% 40% at 50% 20%, rgba(212,175,55,0.10) 0%, rgba(212,175,55,0.03) 40%, transparent 70%)',
          }}
        />
        {/* Secondary ambient glow — bottom-left */}
        <div
          className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full opacity-40"
          style={{
            background:
              'radial-gradient(circle, rgba(184,150,12,0.06) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  Content — centered, compact, natural height                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 pb-12 pt-28">

        {/* ── 1. Top badge ── */}
        <motion.span
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium',
            'border border-gold/25 bg-gold/[0.06] text-gold',
            'shadow-[0_0_20px_rgba(212,175,55,0.08)]',
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Shield className="size-4" />
          {t('landing.badge')}
        </motion.span>

        {/* ── 2. Headline ── */}
        <motion.h1
          className="gold-gradient-text gold-text-shadow max-w-3xl text-center text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl md:text-6xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          {t('landing.heroTitle')}
        </motion.h1>

        {/* ── 3. Subtitle ── */}
        <motion.p
          className="max-w-2xl text-center text-base leading-relaxed text-muted-foreground sm:text-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          {t('landing.heroSubtitle')}
        </motion.p>

        {/* ── 4. CTA Buttons ── */}
        <motion.div
          className="flex flex-col gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
        >
          <div className="cta-pulse-ring">
            <Button
              size="lg"
              onClick={onGetStarted}
              className={cn(
                'h-12 min-w-[160px] rounded-xl px-7 text-base font-bold text-gray-950',
                'bg-gradient-to-l from-gold-dark via-gold to-gold-light',
                'shadow-xl shadow-gold/25 transition-all duration-300',
                'hover:shadow-2xl hover:shadow-gold/40 hover:scale-[1.04]',
                'active:scale-[0.97]',
                'btn-gold-shine',
              )}
            >
              <Zap className="size-5" />
              <span>{t('landing.getStarted')}</span>
            </Button>
          </div>

          <Button
            variant="outline"
            size="lg"
            className={cn(
              'h-12 min-w-[160px] rounded-xl px-7 text-base font-semibold',
              'border-gold/30 bg-transparent text-gold',
              'transition-all duration-300',
              'hover:border-gold/60 hover:bg-gold/10 hover:text-gold-light hover:scale-[1.04]',
              'active:scale-[0.97]',
            )}
          >
            <CircleDot className="ml-1.5 size-5" />
            <span>{t('landing.learnMore')}</span>
          </Button>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  5. Live Price Ticker                                             */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          <div
            className={cn(
              'ticker-gold-glow relative overflow-hidden rounded-2xl border border-gold/15 p-4 sm:p-5',
              'bg-white/[0.03] backdrop-blur-xl',
            )}
          >
            {/* Live indicator row */}
            <div className="mb-3 flex items-center gap-2">
              <span className="pulse-ring relative flex size-2.5">
                <span className="absolute inset-0 rounded-full bg-emerald-500" />
                <span className="relative block size-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {t('landing.livePrices')}
              </span>
              {isLive && (
                <span className={cn('text-[10px] font-medium', getSourceColor(source))}>
                  {getSourceLabel(source)}
                </span>
              )}
              <button
                onClick={refresh}
                className="mr-auto rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-gold/10 hover:text-gold"
                title={t('common.refresh')}
                aria-label={t('common.refresh')}
              >
                <RefreshCw className={cn('size-3.5', isLoading && 'animate-spin')} />
              </button>
            </div>

            {/* 2×2 / 4-col price grid */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
              {livePrices.map((item, i) => (
                <motion.div
                  key={item.name}
                  custom={i}
                  variants={itemVars}
                  initial="hidden"
                  animate="show"
                  className={cn(
                    'card-spotlight flex flex-col items-center rounded-xl border p-3 text-center transition-all duration-300',
                    'border-white/[0.06] bg-white/[0.02] hover:bg-gold/[0.04] hover:border-gold/20',
                  )}
                >
                  <Coins className="mb-1.5 size-4 text-[#D4AF37]" />
                  <span className="text-[11px] font-medium leading-tight text-muted-foreground">
                    {item.name}
                  </span>
                  <span className="mt-1 text-sm font-bold tabular-nums text-foreground">
                    {item.price > 0
                      ? item.isDollar
                        ? `$${new Intl.NumberFormat('fa-IR').format(Math.round(item.price))}`
                        : `${new Intl.NumberFormat('fa-IR').format(Math.round(item.price))} ${t('common.toman')}`
                      : '...'}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 text-xs font-semibold tabular-nums',
                      item.change >= 0 ? 'text-emerald-500' : 'text-red-500',
                    )}
                  >
                    {item.change >= 0 ? '+' : ''}
                    {item.change}%
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Footer note */}
            <p className="mt-3 text-center text-[11px] text-muted-foreground/60">
              {isLive ? t('landing.pricesLive') : t('landing.pricesLoading')}
            </p>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  6. Stats counter bar                                            */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div ref={statsRef} className="w-full">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.labelKey}
                initial={{ opacity: 0, y: 25 }}
                animate={statsVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 25 }}
                transition={{ duration: 0.5, delay: i * 0.12, ease: 'easeOut' as const }}
                className={cn(
                  'stat-glow hover-lift-sm flex items-center gap-3 rounded-xl p-4 sm:flex-col sm:items-center sm:text-center',
                  'border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm',
                )}
              >
                {/* Gold icon circle */}
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/10">
                  <stat.icon className="size-5 text-gold" />
                </div>

                {/* Number + label */}
                <div className="min-w-0">
                  <p className="gold-gradient-text text-xl font-bold tabular-nums sm:text-2xl">
                    {counts[i].toLocaleString('fa-IR')}
                    {stat.suffix}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-xs">
                    {t(stat.labelKey)}
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

'use client';

import { useState, useMemo } from 'react';
import { motion } from '@/lib/framer-compat';
import { Calculator, ArrowLeftRight, Coins, Scale, Gem } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════ */

interface CalculatorSectionProps {
  onLogin: () => void;
}

type CalculatorTab = 'gramToToman' | 'tomanToGram' | 'coinToGram';

interface CoinOption {
  key: string;
  weightGrams: number;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Constants                                                                */
/* ═══════════════════════════════════════════════════════════════ */

const MOCK_PRICE_PER_GRAM = 3_250_000;

const COIN_OPTIONS: CoinOption[] = [
  { key: 'fullCoin', weightGrams: 7.336 },
  { key: 'halfCoin', weightGrams: 3.580 },
  { key: 'quarterCoin', weightGrams: 1.790 },
];

/* ═══════════════════════════════════════════════════════════════ */
/*  Helpers                                                                  */
/* ═══════════════════════════════════════════════════════════════ */

function formatNumberPersian(value: number, decimals?: number): string {
  const nf = new Intl.NumberFormat('fa-IR', {
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 0,
  });
  return nf.format(value);
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Gold Coin SVG Visual                                                     */
/* ═══════════════════════════════════════════════════════════════ */

function GoldCoinVisual({ size = 80 }: { size?: number }) {
  return (
    <div className="relative gold-coin" style={{ width: size, height: size }}>
      {/* Outer glow */}
      <div
        className="absolute inset-[-8px] rounded-full opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      {/* Coin body */}
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="relative"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F0D060" />
            <stop offset="30%" stopColor="#D4AF37" />
            <stop offset="60%" stopColor="#F0D060" />
            <stop offset="100%" stopColor="#B8960C" />
          </linearGradient>
          <linearGradient id="coinInner" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5E08C" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
        </defs>
        {/* Coin edge */}
        <circle cx="50" cy="50" r="46" fill="url(#coinGrad)" />
        {/* Inner ring */}
        <circle cx="50" cy="50" r="40" fill="none" stroke="#B8960C" strokeWidth="1" opacity="0.4" />
        <circle cx="50" cy="50" r="36" fill="url(#coinInner)" />
        {/* Z letter */}
        <text
          x="50"
          y="58"
          textAnchor="middle"
          fill="#8B7022"
          fontSize="32"
          fontWeight="900"
          fontFamily="serif"
        >
          Z
        </text>
        {/* Highlight arc */}
        <path
          d="M 25 25 A 35 35 0 0 1 75 25"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Info Card Component                                                      */
/* ═══════════════════════════════════════════════════════════════ */

function InfoCard({
  icon: Icon,
  title,
  desc,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <motion.div
      className="card-spotlight glass-card-enhanced hover-lift-lg group rounded-2xl p-5 border border-gold/10 hover:border-gold/25 transition-all duration-300"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-xl',
            'bg-gradient-to-br from-gold/15 to-gold/5',
            'border border-gold/15',
            'transition-all duration-300 group-hover:scale-110 group-hover:border-gold/30',
          )}
        >
          <Icon className="size-5 text-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-sm font-bold text-foreground">{title}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Component                                                                */
/* ═══════════════════════════════════════════════════════════════ */

export default function CalculatorSection({ onLogin }: CalculatorSectionProps) {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<CalculatorTab>('gramToToman');
  const [inputValue, setInputValue] = useState<string>('');
  const [selectedCoin, setSelectedCoin] = useState<string>(COIN_OPTIONS[0].key);

  /* ── Derived values ── */
  const tabs: { key: CalculatorTab; label: string; icon: React.ElementType }[] = [
    { key: 'gramToToman', label: t('calc.gramToToman'), icon: Scale },
    { key: 'tomanToGram', label: t('calc.tomanToGram'), icon: Coins },
    { key: 'coinToGram', label: t('calc.coinToGram'), icon: Gem },
  ];

  const coinWeight = useMemo(
    () => COIN_OPTIONS.find((c) => c.key === selectedCoin)?.weightGrams ?? COIN_OPTIONS[0].weightGrams,
    [selectedCoin],
  );

  const numericInput = parseFloat(inputValue.replace(/,/g, '')) || 0;

  const result = useMemo(() => {
    if (numericInput <= 0) return null;
    switch (activeTab) {
      case 'gramToToman':
        return { value: numericInput * MOCK_PRICE_PER_GRAM, decimals: 0, unit: t('common.toman') };
      case 'tomanToGram':
        return { value: numericInput / MOCK_PRICE_PER_GRAM, decimals: 2, unit: t('common.gram') };
      case 'coinToGram':
        return { value: numericInput * coinWeight, decimals: 2, unit: t('common.gram') };
      default:
        return null;
    }
  }, [activeTab, numericInput, coinWeight, t]);

  const placeholderText = useMemo(() => {
    switch (activeTab) {
      case 'gramToToman':
        return t('calc.gramExample');
      case 'tomanToGram':
        return t('calc.tomanExample');
      case 'coinToGram':
        return t('calc.coinExample');
      default:
        return t('calc.enterValue');
    }
  }, [activeTab, t]);

  const handleTabChange = (tab: CalculatorTab) => {
    setActiveTab(tab);
    setInputValue('');
  };

  /* ── Info items (left column on desktop) ── */
  const infoItems = [
    { icon: Scale, title: t('calc.gramToToman'), desc: `${formatNumberPersian(MOCK_PRICE_PER_GRAM)} ${t('common.toman')} / ${t('common.gram')}` },
    { icon: Coins, title: t('calc.tomanToGram'), desc: `${formatNumberPersian(MOCK_PRICE_PER_GRAM)} ${t('common.toman')} / ${t('common.gram')}` },
    { icon: Gem, title: t('calc.coinToGram'), desc: `${t('calc.fullCoin')}: ۷.۳۳۶ ${t('common.gram')}` },
  ];

  return (
    <section
      id="calculator"
      dir="rtl"
      className="relative overflow-hidden py-16 sm:py-20 lg:py-24"
    >
      {/* ── Background decorations ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="radial-gold-fade absolute -top-20 right-1/4 h-[600px] w-[600px] opacity-50" />
        <div className="radial-gold-fade absolute -bottom-20 left-1/4 h-[500px] w-[500px] opacity-40" />
        <div className="dot-pattern absolute inset-0 opacity-20" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          className="mb-14 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-5 inline-flex items-center gap-2.5"
          >
            <span className="badge-gold">
              <Calculator className="size-3.5 text-gold" />
              <span className="text-xs font-medium text-gold">{t('features.badge')}</span>
            </span>
          </motion.div>

          {/* Title */}
          <h2 className="mb-4 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
            <span className="gold-gradient-text gold-text-shadow">{t('calc.title')}</span>
          </h2>

          {/* Subtitle */}
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            {t('features.subtitle')}
          </p>
        </motion.div>

        {/* ── Two-column layout ── */}
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 items-start">
          {/* ── Left Column: Info Cards + Gold Coin (desktop only) ── */}
          <motion.div
            className="hidden flex-col justify-center gap-5 lg:flex"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Gold coin visual */}
            <div className="flex justify-center py-4">
              <GoldCoinVisual size={100} />
            </div>

            {infoItems.map((item, idx) => (
              <InfoCard
                key={idx}
                icon={item.icon}
                title={item.title}
                desc={item.desc}
                delay={0.3 + idx * 0.1}
              />
            ))}

            {/* Trust badges */}
            <motion.div
              className="mt-2 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {[
                t('security.trust.centralBank'),
                t('security.trust.iso'),
                t('security.trust.pci'),
              ].map((badge, idx) => (
                <span
                  key={idx}
                  className="badge-gold text-xs"
                >
                  {badge}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right Column: Calculator Card ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="card-spotlight shimmer-border relative overflow-hidden rounded-3xl">
              {/* Glass card background */}
              <div
                className={cn(
                  'glass-card-enhanced relative p-6 sm:p-8',
                  'rounded-3xl',
                )}
              >
                {/* Top decorative line */}
                <div className="gold-separator absolute top-0 right-0 left-0" />

                {/* ── Tab Bar ── */}
                <div className="relative mb-7 flex gap-1 rounded-2xl bg-muted/40 p-1.5 border border-gold/10">
                  {tabs.map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key)}
                        className={cn(
                          'relative flex-1 flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5',
                          'text-xs font-semibold transition-all duration-300 sm:text-sm',
                          isActive
                            ? 'bg-gradient-to-bl from-gold-light via-gold to-gold-dark text-gray-950 shadow-lg shadow-gold/25'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        <TabIcon className="size-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* ── Coin Selector (only for coin tab) ── */}
                {activeTab === 'coinToGram' && (
                  <motion.div
                    className="mb-5"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">
                      {t('calc.coinType')}
                    </label>
                    <select
                      value={selectedCoin}
                      onChange={(e) => setSelectedCoin(e.target.value)}
                      className="select-gold w-full rounded-xl py-3 text-sm"
                    >
                      {COIN_OPTIONS.map((coin) => (
                        <option key={coin.key} value={coin.key}>
                          {t(`calc.${coin.key}`)} ({formatNumberPersian(coin.weightGrams, 3)} {t('common.gram')})
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}

                {/* ── Input Field ── */}
                <div className="mb-6">
                  <label className="mb-2.5 block text-xs font-semibold text-muted-foreground">
                    {activeTab === 'gramToToman' && t('calc.gramAmount')}
                    {activeTab === 'tomanToGram' && t('calc.tomanAmount')}
                    {activeTab === 'coinToGram' && t('calc.coinCount')}
                  </label>
                  <div className="relative group/input">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={placeholderText}
                      className={cn(
                        'input-gold-focus w-full rounded-2xl border border-gold/15 bg-background/80 py-4 pe-14 ps-5 text-base font-bold tabular-nums',
                        'placeholder:text-muted-foreground/40',
                        'backdrop-blur-sm',
                        'transition-all duration-300',
                        'focus:border-gold/40 focus:bg-background',
                      )}
                    />
                    <div className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 flex items-center justify-center size-8 rounded-lg bg-gold/10 border border-gold/15 transition-all duration-300 group-focus-within/input:bg-gold/20 group-focus-within/input:border-gold/30">
                      <ArrowLeftRight className="size-4 text-gold" />
                    </div>
                  </div>
                </div>

                {/* ── Result Display ── */}
                <div className="mb-7">
                  <div
                    className={cn(
                      'relative overflow-hidden rounded-2xl p-7 text-center',
                      'border border-gold/15',
                      'bg-gradient-to-br from-gold/[0.06] via-gold/[0.03] to-transparent',
                      'transition-all duration-500',
                      result && 'border-gold/30',
                    )}
                  >
                    {/* Animated background shimmer when result exists */}
                    {result && (
                      <div
                        className="absolute inset-0 opacity-30"
                        style={{
                          background: 'linear-gradient(135deg, rgba(212,175,55,0.05), rgba(240,208,96,0.08), rgba(212,175,55,0.05))',
                          backgroundSize: '200% 200%',
                          animation: 'gradient-shift 3s ease infinite',
                        }}
                        aria-hidden="true"
                      />
                    )}

                    <div className="relative">
                      <p className="mb-3 text-xs font-medium text-muted-foreground">
                        {activeTab === 'gramToToman' && t('calc.gramAmount')}
                        {activeTab === 'tomanToGram' && t('calc.tomanAmount')}
                        {activeTab === 'coinToGram' && t('calc.coinCount')}
                      </p>

                      {result ? (
                        <motion.p
                          className="gold-gradient-text text-3xl font-extrabold tracking-tight sm:text-4xl tabular-nums"
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >
                          {formatNumberPersian(result.value, result.decimals)}
                        </motion.p>
                      ) : (
                        <p className="text-2xl font-semibold text-muted-foreground/20 sm:text-3xl tabular-nums">
                          ۰
                        </p>
                      )}

                      {result && (
                        <motion.div
                          className="mt-3 flex items-center justify-center gap-2"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                        >
                          <div className="h-px w-6 bg-gradient-to-r from-transparent to-gold/40" />
                          <span className="text-sm font-semibold text-gold">
                            {result.unit}
                          </span>
                          <div className="h-px w-6 bg-gradient-to-l from-transparent to-gold/40" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Current Rate ── */}
                <div className="mb-7 flex items-center justify-center gap-3 rounded-2xl bg-muted/30 border border-gold/10 px-5 py-3.5">
                  <span className="gold-pulse inline-block size-2.5 rounded-full bg-gold" />
                  <span className="text-xs text-muted-foreground">
                    {t('calc.currentRate')}:{' '}
                    <span className="font-bold text-foreground tabular-nums">
                      {formatNumberPersian(MOCK_PRICE_PER_GRAM)} {t('common.toman')}
                    </span>
                    {' '}{t('common.live')}
                  </span>
                </div>

                {/* ── Gold separator ── */}
                <div className="gold-separator mb-7" />

                {/* ── CTA Button ── */}
                <button
                  onClick={onLogin}
                  className={cn(
                    'btn-gold-gradient btn-gold-shine cta-pulse-ring w-full rounded-2xl py-4 text-sm font-extrabold text-gray-950',
                    'transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]',
                    'shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30',
                  )}
                >
                  <span>{t('landing.getStarted')}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

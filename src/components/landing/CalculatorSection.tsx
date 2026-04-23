'use client';

import { useState, useMemo } from 'react';
import { motion } from '@/lib/framer-compat';
import { Calculator, ArrowLeftRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface CalculatorSectionProps {
  onLogin: () => void;
}

type CalculatorTab = 'gramToToman' | 'tomanToGram' | 'coinToGram';

interface CoinOption {
  key: string;
  weightGrams: number;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MOCK_PRICE_PER_GRAM = 3_250_000; // قیمت هر گرم (واحد داخلی)

const COIN_OPTIONS: CoinOption[] = [
  { key: 'fullCoin', weightGrams: 7.336 },
  { key: 'halfCoin', weightGrams: 3.580 },
  { key: 'quarterCoin', weightGrams: 1.790 },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/** Format a number with Persian/Arabic commas using Intl.NumberFormat */
function formatNumberPersian(value: number, decimals?: number): string {
  const nf = new Intl.NumberFormat('fa-IR', {
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 0,
  });
  return nf.format(value);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function CalculatorSection({ onLogin }: CalculatorSectionProps) {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<CalculatorTab>('gramToToman');
  const [inputValue, setInputValue] = useState<string>('');
  const [selectedCoin, setSelectedCoin] = useState<string>(COIN_OPTIONS[0].key);

  /* ── Derived values ── */
  const tabs: { key: CalculatorTab; label: string }[] = [
    { key: 'gramToToman', label: t('calc.gramToToman') },
    { key: 'tomanToGram', label: t('calc.tomanToGram') },
    { key: 'coinToGram', label: t('calc.coinToGram') },
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
    { icon: '⚖️', title: t('calc.gramToToman'), desc: `${formatNumberPersian(MOCK_PRICE_PER_GRAM)} ${t('common.toman')} / ${t('common.gram')}` },
    { icon: '🔄', title: t('calc.tomanToGram'), desc: `${formatNumberPersian(MOCK_PRICE_PER_GRAM)} ${t('common.toman')} / ${t('common.gram')}` },
    { icon: '🪙', title: t('calc.coinToGram'), desc: `${t('calc.fullCoin')}: ۷.۳۳۶ ${t('common.gram')}` },
  ];

  return (
    <section
      id="calculator"
      dir="rtl"
      className="relative overflow-hidden py-16 sm:py-20"
    >
      {/* ── Background decorations ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="radial-gold-fade absolute top-0 right-1/4 h-[500px] w-[500px] opacity-60" />
        <div className="radial-gold-fade absolute bottom-0 left-1/4 h-[400px] w-[400px] opacity-40" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5"
          >
            <Calculator className="size-4 text-gold" />
            <span className="text-xs font-medium text-gold">{t('features.badge')}</span>
          </motion.div>

          {/* Title */}
          <h2 className="mb-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            <span className="gold-gradient-text">{t('calc.title')}</span>
          </h2>

          {/* Subtitle */}
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            {t('features.subtitle')}
          </p>
        </motion.div>

        {/* ── Two-column layout ── */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* ── Left Column: Info Cards (hidden on mobile) ── */}
          <motion.div
            className="hidden flex-col justify-center gap-6 lg:flex"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {infoItems.map((item, idx) => (
              <motion.div
                key={idx}
                className={cn(
                  'card-glass-premium card-hover-lift rounded-2xl p-5',
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
              >
                <div className="flex items-start gap-4">
                  <div className="gold-icon-circle shrink-0">
                    <span className="text-xl">{item.icon}</span>
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-bold text-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/15 bg-gold/5 px-3 py-1 text-[11px] font-medium text-muted-foreground"
                >
                  <span className="inline-block size-1.5 rounded-full bg-gold/60" />
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
            <div className="card-glass-premium relative overflow-hidden rounded-3xl p-5 sm:p-6 lg:p-8">
              {/* Top decorative line */}
              <div className="gold-separator absolute top-0 right-0 left-0" />

              {/* ── Tabs ── */}
              <div className="mb-6 flex gap-1 rounded-xl bg-muted/50 p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={cn(
                      'relative flex-1 rounded-lg px-2 py-2.5 text-xs font-semibold transition-all duration-300 sm:text-sm',
                      activeTab === tab.key
                        ? 'bg-gradient-to-bl from-gold-light via-gold to-gold-dark text-gray-950 shadow-md shadow-gold/20'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
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
                    className="select-gold w-full rounded-xl py-2.5 text-sm"
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
              <div className="mb-5">
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  {activeTab === 'gramToToman' && t('calc.gramAmount')}
                  {activeTab === 'tomanToGram' && t('calc.tomanAmount')}
                  {activeTab === 'coinToGram' && t('calc.coinCount')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={placeholderText}
                    className={cn(
                      'input-gold-focus w-full rounded-xl border border-border bg-background py-3.5 pe-12 ps-4 text-base font-semibold tabular-nums',
                      'placeholder:text-muted-foreground/50',
                    )}
                  />
                  <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
                    <ArrowLeftRight className="size-4 text-gold/40" />
                  </div>
                </div>
              </div>

              {/* ── Result Display ── */}
              <div className="mb-6">
                <div className={cn(
                  'rounded-2xl border border-gold/10 bg-gradient-to-br from-gold/5 via-gold/[0.02] to-transparent p-6 text-center',
                  'transition-all duration-300',
                )}>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {activeTab === 'gramToToman' && `${t('calc.gramAmount')}`}
                    {activeTab === 'tomanToGram' && `${t('calc.tomanAmount')}`}
                    {activeTab === 'coinToGram' && `${t('calc.coinCount')}`}
                  </p>
                  {result ? (
                    <p className="gold-gradient-text text-3xl font-extrabold tracking-tight sm:text-4xl tabular-nums">
                      {formatNumberPersian(result.value, result.decimals)}
                    </p>
                  ) : (
                    <p className="text-2xl font-semibold text-muted-foreground/30 sm:text-3xl tabular-nums">
                      ۰
                    </p>
                  )}
                  {result && (
                    <p className="mt-2 text-sm font-medium text-gold/70">
                      {result.unit}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Current Rate ── */}
              <div className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-muted/30 px-4 py-3">
                <span className="gold-pulse inline-block size-2 rounded-full bg-gold" />
                <span className="text-xs text-muted-foreground">
                  {t('calc.currentRate')}:{' '}
                  <span className="font-bold text-foreground">
                    {formatNumberPersian(MOCK_PRICE_PER_GRAM)} {t('common.toman')}
                  </span>
                  {' '}{t('common.live')}
                </span>
              </div>

              {/* ── Gold separator ── */}
              <div className="gold-separator mb-6" />

              {/* ── CTA Button ── */}
              <button
                onClick={onLogin}
                className={cn(
                  'btn-gold-gradient btn-gold-shine cta-pulse-ring w-full rounded-xl py-3.5 text-sm font-bold text-gray-950',
                  'transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]',
                )}
              >
                {t('landing.getStarted')}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

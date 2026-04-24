'use client';

import { motion } from '@/lib/framer-compat';
import { Check, X, Clock, Trophy } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Comparison Data (hardcoded Persian)                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

type CellValue = {
  type: 'check' | 'cross' | 'wait' | 'text';
  label: string;
};

interface ComparisonRow {
  labelKey: string;
  zarringold: CellValue;
  platformA: CellValue;
  platformB: CellValue;
}

const comparisonRows: ComparisonRow[] = [
  {
    labelKey: 'comparison.rows.feeBuy',
    zarringold: { type: 'text', label: '۰.۵٪' },
    platformA: { type: 'text', label: '۱.۲٪' },
    platformB: { type: 'text', label: '۲٪' },
  },
  {
    labelKey: 'comparison.rows.feeSell',
    zarringold: { type: 'text', label: '۰.۳٪' },
    platformA: { type: 'text', label: '۱٪' },
    platformB: { type: 'text', label: '۱.۵٪' },
  },
  {
    labelKey: 'comparison.rows.instantDeposit',
    zarringold: { type: 'check', label: '' },
    platformA: { type: 'wait', label: '۲ ساعته' },
    platformB: { type: 'cross', label: '' },
  },
  {
    labelKey: 'comparison.rows.fastWithdraw',
    zarringold: { type: 'check', label: '' },
    platformA: { type: 'wait', label: '۲۴ ساعته' },
    platformB: { type: 'wait', label: '۴۸ ساعته' },
  },
  {
    labelKey: 'comparison.rows.support247',
    zarringold: { type: 'check', label: '' },
    platformA: { type: 'cross', label: '' },
    platformB: { type: 'wait', label: 'ساعات اداری' },
  },
  {
    labelKey: 'comparison.rows.priceAlert',
    zarringold: { type: 'check', label: '' },
    platformA: { type: 'check', label: '' },
    platformB: { type: 'cross', label: '' },
  },
  {
    labelKey: 'comparison.rows.autoSave',
    zarringold: { type: 'check', label: '' },
    platformA: { type: 'cross', label: '' },
    platformB: { type: 'cross', label: '' },
  },
  {
    labelKey: 'comparison.rows.goldCard',
    zarringold: { type: 'check', label: '' },
    platformA: { type: 'cross', label: '' },
    platformB: { type: 'cross', label: '' },
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Cell Renderer                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ComparisonCell({ value, highlight }: { value: CellValue; highlight?: boolean }) {
  if (value.type === 'check') {
    return (
      <td className={cn(
        'py-3.5 px-3 sm:py-4 sm:px-4 text-center',
        highlight && 'bg-gold/[0.04]',
      )}>
        <span className={cn(
          'inline-flex items-center justify-center size-7 sm:size-8 rounded-full',
          highlight
            ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10'
            : 'bg-emerald-500/10 text-emerald-400',
        )}>
          <Check className="size-4 sm:size-4.5" strokeWidth={2.5} />
        </span>
      </td>
    );
  }

  if (value.type === 'cross') {
    return (
      <td className={cn(
        'py-3.5 px-3 sm:py-4 sm:px-4 text-center',
        highlight && 'bg-gold/[0.04]',
      )}>
        <span className="inline-flex items-center justify-center size-7 sm:size-8 rounded-full bg-red-500/10 text-red-400">
          <X className="size-4 sm:size-4.5" strokeWidth={2.5} />
        </span>
      </td>
    );
  }

  if (value.type === 'wait') {
    return (
      <td className={cn(
        'py-3.5 px-3 sm:py-4 sm:px-4 text-center',
        highlight && 'bg-gold/[0.04]',
      )}>
        <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs sm:text-sm font-medium">
          <Clock className="size-3 sm:size-3.5" />
          <span>{value.label}</span>
        </span>
      </td>
    );
  }

  /* text type */
  return (
    <td className={cn(
      'py-3.5 px-3 sm:py-4 sm:px-4 text-center font-bold text-sm sm:text-base',
      highlight
        ? 'bg-gold/[0.04] text-gold stat-glow'
        : 'text-muted-foreground',
    )}>
      {value.label}
    </td>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ComparisonSection() {
  const { t } = useTranslation();

  return (
    <section
      id="comparison"
      dir="rtl"
      className="relative py-16 sm:py-20 lg:py-24 overflow-hidden"
    >
      {/* ── Background decorative ── */}
      <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          className="mx-auto mb-10 max-w-2xl text-center sm:mb-14"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="badge-gold mb-4 inline-block">
            {t('comparison.badge')}
          </span>
          <h2 className="gold-gradient-text mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl gold-text-shadow">
            {t('comparison.title')}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('comparison.subtitle')}
          </p>
        </motion.div>

        {/* ── Table Container ── */}
        <motion.div
          className="glass-card-enhanced rounded-2xl p-4 sm:p-6 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {/* Horizontal scroll wrapper for mobile */}
          <div className="overflow-x-auto -mx-2 px-2" style={{ scrollbarWidth: 'thin' }}>
            <table className="w-full min-w-[500px] border-collapse">
              {/* ── Table Header ── */}
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="py-3 px-3 sm:py-4 sm:px-4 text-right text-xs sm:text-sm font-bold text-muted-foreground w-[130px] sm:w-[160px]">
                    {/* Feature label column — empty header */}
                  </th>
                  <th className={cn(
                    'py-3 px-3 sm:py-4 sm:px-4 text-center',
                    'bg-gold/[0.06] rounded-t-xl',
                    'border-b-2 border-gold/30',
                  )}>
                    <span className="inline-flex items-center gap-1.5 text-sm sm:text-base font-extrabold text-gold">
                      <Trophy className="size-4 sm:size-5" />
                      {t('comparison.competitors.zarringold')}
                    </span>
                  </th>
                  <th className="py-3 px-3 sm:py-4 sm:px-4 text-center text-sm sm:text-base font-bold text-muted-foreground">
                    {t('comparison.competitors.platformA')}
                  </th>
                  <th className="py-3 px-3 sm:py-4 sm:px-4 text-center text-sm sm:text-base font-bold text-muted-foreground">
                    {t('comparison.competitors.platformB')}
                  </th>
                </tr>
              </thead>

              {/* ── Table Body ── */}
              <tbody>
                {comparisonRows.map((row, index) => (
                  <motion.tr
                    key={row.labelKey}
                    className={cn(
                      'border-b border-white/[0.04] last:border-b-0',
                      index % 2 === 0 && 'bg-white/[0.01]',
                    )}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                  >
                    {/* Row label */}
                    <td className="py-3.5 px-3 sm:py-4 sm:px-4 text-right text-xs sm:text-sm font-semibold text-foreground/80 whitespace-nowrap">
                      {t(row.labelKey)}
                    </td>
                    {/* Zarrin Gold — highlighted */}
                    <ComparisonCell value={row.zarringold} highlight />
                    {/* Platform A */}
                    <ComparisonCell value={row.platformA} />
                    {/* Platform B */}
                    <ComparisonCell value={row.platformB} />
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Bottom note ── */}
          <div className="mt-5 pt-4 border-t border-white/[0.06] text-center">
            <p className="text-[11px] sm:text-xs text-muted-foreground/60">
              ✅ {t('comparison.legend.yes')}&nbsp;&nbsp;⏳ {t('comparison.legend.partial')}&nbsp;&nbsp;❌ {t('comparison.legend.no')}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

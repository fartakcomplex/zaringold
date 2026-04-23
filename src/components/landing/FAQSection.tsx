'use client';

import { useState } from 'react';
import { motion } from '@/lib/framer-compat';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  FAQ Data Keys                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

const faqItems = [
  { qKey: 'faq.q1', aKey: 'faq.a1' },
  { qKey: 'faq.q2', aKey: 'faq.a2' },
  { qKey: 'faq.q3', aKey: 'faq.a3' },
  { qKey: 'faq.q4', aKey: 'faq.a4' },
  { qKey: 'faq.q5', aKey: 'faq.a5' },
  { qKey: 'faq.q6', aKey: 'faq.a6' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function FAQSection() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section
      id="faq"
      dir="rtl"
      className="relative py-16 sm:py-20 overflow-hidden"
    >
      {/* ── Background ── */}
      <div className="absolute inset-0 grid-pattern pointer-events-none opacity-30" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          className="mx-auto mb-10 max-w-2xl text-center sm:mb-14"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          
          transition={{ duration: 0.5 }}
        >
          <span className="badge-gold mb-4 inline-block">
            {t('faq.badge')}
          </span>
          <h2 className="gold-gradient-text mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl gold-text-shadow">
            {t('faq.title')}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('faq.subtitle')}
          </p>
        </motion.div>

        {/* ── FAQ Accordion ── */}
        <motion.div
          className="space-y-3 sm:space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={item.qKey}
                className={cn(
                  'rounded-xl overflow-hidden transition-all duration-300',
                  'border border-border/50',
                  isOpen
                    ? 'bg-gold/5 border-gold/20 shadow-[0_0_16px_oklch(0.75_0.15_85/6%)]'
                    : 'bg-card/50 hover:bg-card/80',
                )}
              >
                {/* ── Trigger Button ── */}
                <button
                  onClick={() => handleToggle(index)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3',
                    'px-4 py-3.5 sm:px-5 sm:py-4',
                    'text-right transition-colors duration-200',
                    isOpen ? 'text-foreground' : 'text-foreground/80 hover:text-foreground',
                  )}
                  aria-expanded={isOpen}
                >
                  <span className={cn(
                    'text-sm font-semibold leading-relaxed sm:text-base',
                    isOpen && 'text-gold',
                  )}>
                    {t(item.qKey)}
                  </span>
                  <ChevronDown
                    className={cn(
                      'size-5 shrink-0 text-gold transition-transform duration-300',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>

                {/* ── Collapsible Answer ── */}
                <div
                  className="overflow-hidden transition-all duration-350 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    maxHeight: isOpen ? '200px' : '0px',
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className={cn(
                    'px-4 pb-3.5 sm:px-5 sm:pb-4',
                    'text-sm leading-relaxed text-muted-foreground',
                  )}>
                    {t(item.aKey)}
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

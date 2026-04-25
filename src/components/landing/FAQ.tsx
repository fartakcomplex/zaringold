'use client';

import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  FAQ Items                                                          */
/* ------------------------------------------------------------------ */

const faqKeys = [
  { qKey: 'faq.q1', aKey: 'faq.a1' },
  { qKey: 'faq.q2', aKey: 'faq.a2' },
  { qKey: 'faq.q3', aKey: 'faq.a3' },
  { qKey: 'faq.q4', aKey: 'faq.a4' },
  { qKey: 'faq.q5', aKey: 'faq.a5' },
  { qKey: 'faq.q6', aKey: 'faq.a6' },
];

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function FAQ() {
  const { t } = useTranslation();

  return (
    <section id="faq" className="relative bg-background py-12 sm:py-16">
      {/* Subtle gold radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-gold-radial" aria-hidden />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* ── Section header ── */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <span className="badge-gold inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
            {t('faq.badge')}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            <span className="gold-gradient-text">{t('faq.title')}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            {t('faq.subtitle')}
          </p>
        </motion.div>

        {/* ── FAQ Accordion ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqKeys.map((faq, i) => (
              <motion.div key={i} variants={itemVariants}>
                <AccordionItem
                  value={`item-${i}`}
                  className={cn(
                    'border-border/60 rounded-xl px-1 transition-all duration-300',
                    'hover:border-gold/20',
                    'data-[state=open]:border-gold/30 data-[state=open]:bg-gold/[0.03]',
                    'data-[state=open]:shadow-[0_0_20px_rgba(212,175,55,0.05)]',
                    'last:border-b-0 border-b',
                  )}
                >
                  <AccordionTrigger
                    className={cn(
                      'text-right text-base font-semibold',
                      'hover:no-underline hover:text-gold',
                      'transition-colors duration-300',
                      'py-4',
                      '[&>svg]:text-gold/60 [&[data-state=open]>svg]:text-gold [&[data-state=open]>svg]:rotate-180',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="size-4 shrink-0 text-gold/50" />
                      {t(faq.qKey)}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-4 pr-6">
                    {t(faq.aKey)}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

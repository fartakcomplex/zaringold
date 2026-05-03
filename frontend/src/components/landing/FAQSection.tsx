
import {useState} from 'react';
import {motion} from '@/lib/framer-compat';
import {ChevronDown, HelpCircle, Shield, CreditCard, Zap, Clock, TrendingUp, Wallet} from 'lucide-react';
import {useTranslation} from '@/lib/i18n';
import {cn} from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  FAQ Data with Icons                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const faqItems = [
  { qKey: 'faq.q1', aKey: 'faq.a1', icon: Shield },
  { qKey: 'faq.q2', aKey: 'faq.a2', icon: CreditCard },
  { qKey: 'faq.q3', aKey: 'faq.a3', icon: Zap },
  { qKey: 'faq.q4', aKey: 'faq.a4', icon: Clock },
  { qKey: 'faq.q5', aKey: 'faq.a5', icon: TrendingUp },
  { qKey: 'faq.q6', aKey: 'faq.a6', icon: Wallet },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  FAQ Item Component                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function FAQItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: typeof faqItems[number];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const Icon = item.icon;

  return (
    <motion.div
      className={cn(
        'relative rounded-2xl overflow-hidden transition-all duration-500',
        'group',
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      {/* Animated border wrapper */}
      <div
        className={cn(
          'relative rounded-2xl p-[1px] transition-all duration-500',
          isOpen
            ? 'bg-gradient-to-b from-gold/30 via-gold/10 to-transparent'
            : 'bg-gradient-to-b from-border/50 via-border/30 to-transparent',
        )}
      >
        {/* Card body */}
        <div
          className={cn(
            'rounded-2xl overflow-hidden transition-all duration-500',
            isOpen
              ? 'bg-gold/[0.04] shadow-[0_0_24px_rgba(212,175,55,0.06)]'
              : 'bg-card/60 hover:bg-card/80',
          )}
        >
          {/* ── Trigger Button ── */}
          <button
            onClick={onToggle}
            className={cn(
              'flex w-full items-center gap-4',
              'px-5 py-5 sm:px-6 sm:py-6',
              'text-right transition-all duration-300',
              isOpen ? 'text-foreground' : 'text-foreground/80 hover:text-foreground',
            )}
            aria-expanded={isOpen}
          >
            {/* Icon circle */}
            <div
              className={cn(
                'shrink-0 flex items-center justify-center rounded-xl transition-all duration-500',
                'size-10 sm:size-11',
                isOpen
                  ? 'bg-gold/15 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                  : 'bg-muted/80 group-hover:bg-gold/5',
              )}
            >
              <Icon className={cn(
                'size-4.5 sm:size-5 transition-all duration-300',
                isOpen
                  ? 'text-gold drop-shadow-[0_0_4px_rgba(212,175,55,0.3)]'
                  : 'text-muted-foreground group-hover:text-gold/70',
              )} />
            </div>

            {/* Question text */}
            <span className={cn(
              'flex-1 text-sm font-semibold leading-relaxed sm:text-[15px] transition-all duration-300',
              isOpen && 'text-gold',
            )}>
              {t(item.qKey)}
            </span>

            {/* Chevron with rotation indicator */}
            <div className={cn(
              'shrink-0 flex items-center justify-center rounded-full size-8 transition-all duration-500',
              isOpen
                ? 'bg-gold/15 rotate-180'
                : 'bg-muted/60',
            )}>
              <ChevronDown className={cn(
                'size-4 transition-all duration-300',
                isOpen ? 'text-gold' : 'text-muted-foreground',
              )} />
            </div>
          </button>

          {/* ── Collapsible Answer ── */}
          <div
            className="overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              maxHeight: isOpen ? '300px' : '0px',
              opacity: isOpen ? 1 : 0,
            }}
          >
            <div className={cn(
              'relative px-5 pb-5 sm:px-6 sm:pb-6',
              'sm:mr-[60px]',
            )}>
              {/* Gold accent line on the right */}
              <div className="absolute right-[22px] sm:right-[26px] top-0 bottom-5 w-px" style={{
                background: 'linear-gradient(180deg, oklch(0.75 0.15 85 / 30%), transparent)',
              }} />

              <p className={cn(
                'text-sm leading-[1.9] text-muted-foreground sm:text-[15px]',
                'pr-3 sm:pr-4',
                'transition-all duration-300',
                isOpen && 'text-foreground/65',
              )}>
                {t(item.aKey)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active glow effect */}
      {isOpen && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
          boxShadow: '0 0 30px rgba(212, 175, 55, 0.04), inset 0 0 30px rgba(212, 175, 55, 0.02)',
        }} />
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function FAQSection() {
  const { t, dir } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section
      id="faq"
      dir={dir}
      className="relative py-20 sm:py-24 lg:py-28 overflow-hidden"
    >
      {/* ── Background ── */}
      <div className="absolute inset-0 grid-pattern pointer-events-none opacity-20" />
      <div className="absolute inset-0 radial-gold-fade pointer-events-none" />

      {/* ── Gold separator at top ── */}
      <div className="absolute top-0 left-0 right-0 gold-separator" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          className="mx-auto mb-12 max-w-2xl text-center sm:mb-16"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="badge-gold mb-4 inline-block">
            {t('faq.badge')}
          </span>
          <h2 className="gold-gradient-text mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl gold-text-shadow">
            {t('faq.title')}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base max-w-xl mx-auto">
            {t('faq.subtitle')}
          </p>
        </motion.div>

        {/* ── FAQ Accordion ── */}
        <div className="space-y-4 sm:space-y-5">
          {faqItems.map((item, index) => (
            <FAQItem
              key={item.qKey}
              item={item}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>

        {/* ── Bottom CTA ── */}
        <motion.div
          className="mt-10 sm:mt-14 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div
            className="inline-flex items-center gap-3 rounded-2xl px-6 py-4"
            style={{
              background: 'linear-gradient(135deg, oklch(0.95 0.012 85 / 85%), oklch(0.97 0.008 85 / 90%))',
              border: '1px solid oklch(0.75 0.15 85 / 15%)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <HelpCircle className="size-5 text-gold" />
            <span className="text-sm text-gray-600">
              {t('faq.stillHaveQuestion')}
            </span>
            <button className={cn(
              'text-sm font-bold text-gold hover:text-gold-dark',
              'underline underline-offset-4 decoration-gold/30 hover:decoration-gold/60',
              'transition-all duration-200',
            )}>
              {t('faq.contactSupport')}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

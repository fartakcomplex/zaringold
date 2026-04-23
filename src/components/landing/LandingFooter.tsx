'use client';

import { Instagram, Twitter, Send, Phone, Mail, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/framer-compat';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

export type LandingSubPage = 'about' | 'terms' | 'privacy' | 'contact' | 'blog' | null;

interface LandingFooterProps {
  onNavigate?: (page: LandingSubPage) => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */

const quickLinks: { label: string; page: LandingSubPage }[] = [
  { label: 'درباره ما', page: 'about' },
  { label: 'قوانین و مقررات', page: 'terms' },
  { label: 'حریم خصوصی', page: 'privacy' },
  { label: 'تماس با ما', page: 'contact' },
  { label: 'وبلاگ', page: 'blog' },
];

const services: { label: string; authPage?: string }[] = [
  { label: 'خرید طلا', authPage: 'trade' },
  { label: 'فروش طلا', authPage: 'trade' },
  { label: 'پس‌انداز طلا', authPage: 'savings' },
  { label: 'تحلیل بازار', authPage: 'market' },
  { label: 'پاداش دعوت', authPage: 'referral' },
];

const socials = [
  { icon: Instagram, href: '#', label: 'اینستاگرام' },
  { icon: Twitter, href: '#', label: 'توییتر' },
  { icon: Send, href: '#', label: 'تلگرام' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function LandingFooter({ onNavigate }: LandingFooterProps) {
  const { isAuthenticated, setPage } = useAppStore();

  const handleServiceClick = (authPage?: string) => {
    if (isAuthenticated && authPage) {
      setPage(authPage as any);
    }
  };

  return (
    <footer className="relative bg-background">
      {/* Gold top separator line */}
      <div className="gold-separator" />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* ── Column 1: Brand + description + socials ── */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-bl from-gold-light via-gold to-gold-dark">
                <span className="text-lg font-black text-gray-950">ز</span>
              </div>
              <span className="text-xl font-extrabold gold-gradient-text">
                زرین گلد
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              پلتفرم معاملات طلای نوین ایران. خرید، فروش و پس‌انداز طلا با
              بالاترین امنیت و کمترین کارمزد.
            </p>
            <div className="flex gap-3">
              {socials.map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  aria-label={s.label}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-lg',
                    'border border-border/60 bg-card text-muted-foreground',
                    'transition-all duration-300',
                    'hover:border-gold/40 hover:text-gold hover:shadow-md hover:shadow-gold/10',
                  )}
                >
                  <s.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* ── Column 2: Quick Links ── */}
          <div>
            <h3 className="mb-4 text-sm font-bold">دسترسی سریع</h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link, i) => (
                <li key={i}>
                  <button
                    onClick={() => onNavigate?.(link.page)}
                    className={cn(
                      'text-sm text-muted-foreground transition-all duration-300',
                      'hover:text-gold hover:translate-x-[-4px]',
                    )}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: Services ── */}
          <div>
            <h3 className="mb-4 text-sm font-bold">خدمات</h3>
            <ul className="space-y-2.5">
              {services.map((s, i) => (
                <li key={i}>
                  <button
                    onClick={() => handleServiceClick(s.authPage)}
                    className={cn(
                      'text-sm text-muted-foreground transition-all duration-300',
                      'hover:text-gold hover:translate-x-[-4px]',
                    )}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 4: Contact ── */}
          <div>
            <h3 className="mb-4 text-sm font-bold">ارتباط با ما</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
                <span>تهران، خیابان ولیعصر، پلاک ۱۲۳</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Phone className="size-4 shrink-0 text-gold" />
                <a
                  href="tel:02191001234"
                  className="transition-colors duration-300 hover:text-gold"
                  dir="ltr"
                >
                  021-9100 1234
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail className="size-4 shrink-0 text-gold" />
                <a
                  href="mailto:support@zarringold.ir"
                  className="transition-colors duration-300 hover:text-gold"
                  dir="ltr"
                >
                  support@zarringold.ir
                </a>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* ── Copyright ── */}
        <div className="gold-separator my-8" />
        <div className="text-center text-xs text-muted-foreground">
          © ۱۴۰۴ زرین گلد. تمامی حقوق محفوظ است.
        </div>
      </div>
    </footer>
  );
}

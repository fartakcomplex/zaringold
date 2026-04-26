'use client';

import { useState } from 'react';
import {
  Instagram, Twitter, Send, Phone, Mail, MapPin,
  ArrowLeft, ArrowRight, Heart, Shield, Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
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
/*  Main Component                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function LandingFooter({ onNavigate }: LandingFooterProps) {
  const { isAuthenticated, setPage } = useAppStore();
  const { t, dir } = useTranslation();

  const quickLinks: { label: string; page: LandingSubPage }[] = [
    { label: t('footer.aboutUs'), page: 'about' },
    { label: t('footer.terms'), page: 'terms' },
    { label: t('footer.privacy'), page: 'privacy' },
    { label: t('footer.contactUs'), page: 'contact' },
    { label: t('footer.blog'), page: 'blog' },
  ];

  const services: { label: string; authPage?: string; icon: string }[] = [
    { label: t('footer.buyGold'), authPage: 'trade', icon: '🪙' },
    { label: t('footer.sellGold'), authPage: 'trade', icon: '💰' },
    { label: t('footer.goldSavings'), authPage: 'savings', icon: '🏦' },
    { label: t('footer.marketAnalysis'), authPage: 'market', icon: '📈' },
    { label: t('footer.referralReward'), authPage: 'referral', icon: '🎁' },
  ];

  const socials = [
    { icon: Instagram, href: 'https://instagram.com/zarringold', label: t('footer.instagram'), color: 'from-pink-500 via-rose-500 to-amber-500' },
    { icon: Twitter, href: 'https://twitter.com/zarringold', label: t('footer.twitter'), color: 'from-sky-400 via-blue-500 to-indigo-500' },
    { icon: Send, href: 'https://t.me/zarringold', label: t('footer.telegram'), color: 'from-sky-500 via-cyan-500 to-blue-500' },
  ];

  const handleServiceClick = (authPage?: string) => {
    if (isAuthenticated && authPage) {
      setPage(authPage as any);
    }
  };

  const handleSocialClick = (href: string) => {
    if (href && href !== '#') {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <footer className="relative mt-8">
      {/* ── Premium gold gradient separator at top ── */}
      <div className="relative h-px w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/20 to-transparent blur-sm" />
        {/* Center diamond */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="size-2.5 rotate-45 rounded-[2px] border border-gold/30 bg-gold/10" />
        </div>
      </div>

      {/* ── Glass-morphism background ── */}
      <div
        dir={dir}
        className={cn(
          'relative overflow-hidden',
          'bg-gradient-to-b from-background via-background to-muted/30',
          'dark:via-background/95 dark:to-muted/20',
        )}
      >
        {/* Subtle background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 top-0 size-80 rounded-full bg-gold/[0.03] blur-3xl" />
          <div className="absolute -right-40 bottom-0 size-80 rounded-full bg-gold/[0.03] blur-3xl" />
          {/* Dot pattern overlay */}
          <div className="absolute inset-0 dot-pattern opacity-30" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* ── Column 1: Brand + description + socials (5 cols) ── */}
            <div className="space-y-6 lg:col-span-5">
              {/* Brand */}
              <div className="flex items-center gap-3">
                <div className="relative flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-light via-gold to-gold-dark shadow-lg shadow-gold/25">
                  <span className="text-lg font-black text-gray-950">{t('logo.letter')}</span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 to-transparent" />
                </div>
                <div>
                  <span className="gold-gradient-text text-2xl font-extrabold gold-text-shadow">
                    {t('common.zarrinGold')}
                  </span>
                  <p className="text-[10px] font-medium tracking-wider text-muted-foreground/60 uppercase">
                    {t('footer.goldTrading')}
                  </p>
                </div>
              </div>

              <p className="max-w-sm text-sm leading-7 text-muted-foreground">
                {t('footer.description')}
              </p>

              {/* Social icons */}
              <div className="flex gap-3 pt-1">
                {socials.map((s, i) => (
                  <SocialIcon key={i} s={s} />
                ))}
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {[
                  { icon: Shield, text: t('footer.sslSecure') },
                  { icon: Sparkles, text: t('footer.officialLicense') },
                ].map((badge, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5',
                      'border border-gold/10 bg-gold/5 text-xs font-medium text-gold',
                      'dark:bg-gold/5 dark:border-gold/8',
                    )}
                  >
                    <badge.icon className="size-3" />
                    {badge.text}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Column 2: Quick Links (2 cols) ── */}
            <div className="lg:col-span-2">
              <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-foreground">
                <span className="size-1.5 rounded-full bg-gradient-to-br from-gold to-gold-dark" />
                {t('footer.quickLinks')}
              </h3>
              <ul className="space-y-3">
                {quickLinks.map((link, i) => (
                  <li key={i}>
                    <FooterLink onClick={() => onNavigate?.(link.page)}>
                      {link.label}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Column 3: Services (2 cols) ── */}
            <div className="lg:col-span-2">
              <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-foreground">
                <span className="size-1.5 rounded-full bg-gradient-to-br from-gold to-gold-dark" />
                {t('footer.services')}
              </h3>
              <ul className="space-y-3">
                {services.map((s, i) => (
                  <li key={i}>
                    <FooterLink onClick={() => handleServiceClick(s.authPage)}>
                      <span className="ml-1.5">{s.icon}</span>
                      {s.label}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Column 4: Contact + Newsletter (3 cols) ── */}
            <div className="space-y-8 lg:col-span-3">
              <div>
                <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-foreground">
                  <span className="size-1.5 rounded-full bg-gradient-to-br from-gold to-gold-dark" />
                  {t('footer.contactUs')}
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-sm text-muted-foreground">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                      <MapPin className="size-3.5" />
                    </div>
                    <span className="leading-6">{t('footer.address')}</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                      <Phone className="size-3.5" />
                    </div>
                    <a
                      href="tel:02191001234"
                      className="transition-colors duration-300 hover:text-gold"
                      dir="ltr"
                    >
                      021-9100 1234
                    </a>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                      <Mail className="size-3.5" />
                    </div>
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

              <NewsletterInput />
            </div>
          </motion.div>
        </div>

        {/* ── Bottom copyright bar ── */}
        <div className="relative">
          {/* Separator */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

          <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              {/* Copyright */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{t('footer.copyright')}</span>
                <span className="gold-gradient-text font-semibold">{t('common.zarrinGold')}</span>
                <span>{t('footer.allRightsReserved')}</span>
              </div>

              {/* Made with love */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                <span>{t('footer.madeWith')}</span>
                <Heart className="size-3 text-rose-400 fill-rose-400" />
                <span>{t('footer.inIran')}</span>
              </div>

              {/* Version badge */}
              <div className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1',
                'border border-gold/10 bg-gold/5 text-[11px] font-medium text-gold/80',
              )}>
                <Sparkles className="size-3" />
                {t('footer.version')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub-components                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

/** Social icon button with hover glow + scale animation */
function SocialIcon({ s }: { s: { icon: React.ComponentType<{ className?: string }>; href: string; label: string; color: string } }) {
  const [hovered, setHovered] = useState(false);
  const handleClick = (e: React.MouseEvent) => {
    if (s.href && s.href !== '#') {
      e.preventDefault();
      window.open(s.href, '_blank', 'noopener,noreferrer');
    }
  };
  return (
    <a
      href={s.href}
      aria-label={s.label}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'group relative flex size-10 items-center justify-center rounded-xl',
        'border border-gold/15 bg-card/60 text-muted-foreground',
        'transition-all duration-300 ease-out',
        'hover:border-gold/30 hover:text-foreground',
        'dark:bg-white/5 dark:border-gold/10',
      )}
    >
      {/* Glow ring on hover */}
      <span
        className={cn(
          'absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500',
          `bg-gradient-to-br ${s.color}`,
          hovered && 'opacity-15',
        )}
      />
      <s.icon
        className={cn(
          'relative z-10 size-[18px] transition-all duration-300',
          hovered && 'scale-110 drop-shadow-md',
        )}
      />
      {/* Tooltip */}
      <span
        className={cn(
          'absolute -top-8 left-1/2 -translate-x-1/2 rounded-lg px-2.5 py-1',
          'bg-foreground text-background text-[11px] font-medium',
          'opacity-0 -translate-y-1 transition-all duration-200 pointer-events-none',
          'whitespace-nowrap shadow-lg',
          hovered && 'opacity-100 translate-y-0',
        )}
      >
        {s.label}
      </span>
    </a>
  );
}

/** Footer link with arrow slide-in on hover */
function FooterLink({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const { dir } = useTranslation();
  const ForwardArrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex items-center gap-2 text-sm text-muted-foreground',
        'transition-all duration-300',
        'hover:text-gold',
      )}
    >
      <ForwardArrow
        className={cn(
          'size-3 transition-all duration-300 opacity-0 -translate-x-2',
          'text-gold/60',
          'group-hover:opacity-100 group-hover:translate-x-0',
        )}
      />
      <span className="transition-colors duration-300 group-hover:text-gold">{children}</span>
    </button>
  );
}

/** Newsletter input */
function NewsletterInput() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { t, dir } = useTranslation();
  const SubmitArrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
      setEmail('');
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
        <Mail className="size-4 text-gold" />
        {t('footer.newsletter')}
      </h4>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t('footer.newsletterDesc')}
      </p>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('footer.emailPlaceholder')}
          dir="ltr"
          className={cn(
            'w-full rounded-xl border border-gold/15 bg-card/60 px-4 py-2.5',
            'text-sm text-foreground placeholder:text-muted-foreground/60',
            'backdrop-blur-sm transition-all duration-300',
            'focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/10',
            'dark:bg-white/5 dark:border-gold/10 dark:text-foreground',
            'dark:focus:border-gold/30 dark:focus:ring-gold/5',
          )}
        />
        <button
          type="submit"
          className={cn(
            'absolute left-1.5 top-1/2 -translate-y-1/2',
            'flex size-7 items-center justify-center rounded-lg',
            'bg-gradient-to-bl from-gold via-gold to-gold-dark',
            'text-gray-950 shadow-md shadow-gold/20',
            'transition-all duration-300',
            'hover:shadow-lg hover:shadow-gold/30 hover:scale-105',
            'active:scale-95',
          )}
        >
          <SubmitArrow className="size-3.5" />
        </button>
      </form>
      {submitted && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 text-xs text-emerald-500"
        >
          <Sparkles className="size-3" />
          {t('footer.subscribed')}
        </motion.p>
      )}
    </div>
  );
}

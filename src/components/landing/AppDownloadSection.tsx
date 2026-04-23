'use client';

import { motion } from '@/lib/framer-compat';
import { Zap, Bell, Brain, Shield, Download, QrCode } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Feature Data                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const appFeatures = [
  {
    icon: Zap,
    titleKey: 'app.feature1',
    descKey: 'app.feature1Desc',
  },
  {
    icon: Bell,
    titleKey: 'app.feature2',
    descKey: 'app.feature2Desc',
  },
  {
    icon: Brain,
    titleKey: 'app.feature3',
    descKey: 'app.feature3Desc',
  },
  {
    icon: Shield,
    titleKey: 'app.feature4',
    descKey: 'app.feature4Desc',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CSS-Only Phone Mockup                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[200px] sm:w-[240px] lg:w-[260px]">
      {/* Phone frame */}
      <div
        className="relative rounded-[2rem] p-2.5 sm:p-3"
        style={{
          background: 'linear-gradient(145deg, #3a3a3a 0%, #1a1a1a 100%)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* Screen */}
        <div
          className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[1.75rem]"
          style={{
            background: 'linear-gradient(180deg, #0d0d0d 0%, #111111 50%, #0a0a0a 100%)',
            aspectRatio: '9/19.5',
          }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1">
            <span className="text-[8px] text-white/60">۹:۴۱</span>
            <div className="h-1.5 w-8 rounded-full bg-white/20" />
            <div className="flex items-center gap-1">
              <div className="size-1 rounded-full bg-white/40" />
              <div className="size-1 rounded-full bg-white/40" />
              <div className="size-1 rounded-full bg-white/40" />
            </div>
          </div>

          {/* App header mockup */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-white/90">زرین گلد</div>
                <div className="text-[8px] text-white/40 mt-0.5">خوش آمدید</div>
              </div>
              <div
                className="flex items-center justify-center rounded-full size-6"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)',
                }}
              >
                <span className="text-[8px] font-bold text-black">Z</span>
              </div>
            </div>
          </div>

          {/* Gold balance card mockup */}
          <div className="mx-4 mt-2 rounded-xl p-3" style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 60%, #8B6914 100%)',
          }}>
            <div className="text-[8px] text-black/60">موجودی طلا</div>
            <div className="text-lg font-extrabold text-black mt-0.5">۱۲.۵۴ گرم</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 rounded-md bg-black/15 py-1 text-center text-[8px] font-medium text-black/80">خرید</div>
              <div className="flex-1 rounded-md bg-black/15 py-1 text-center text-[8px] font-medium text-black/80">فروش</div>
            </div>
          </div>

          {/* Quick actions mockup */}
          <div className="mx-4 mt-3 grid grid-cols-4 gap-2">
            {['خرید', 'فروش', 'پس‌انداز', 'بازار'].map((label) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div
                  className="flex items-center justify-center rounded-lg size-8"
                  style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.15)' }}
                >
                  <div className="size-2.5 rounded-full" style={{ background: 'rgba(212, 175, 55, 0.5)' }} />
                </div>
                <span className="text-[7px] text-white/50">{label}</span>
              </div>
            ))}
          </div>

          {/* Price chart mockup */}
          <div className="mx-4 mt-3 rounded-lg p-2.5" style={{
            background: 'rgba(212, 175, 55, 0.05)',
            border: '1px solid rgba(212, 175, 55, 0.1)',
          }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] text-white/70">قیمت لحظه‌ای طلا</span>
              <span className="text-[8px] font-bold text-green-400">+۲.۴٪</span>
            </div>
            {/* Mini chart line (SVG) */}
            <svg viewBox="0 0 200 50" className="w-full h-8" fill="none">
              <defs>
                <linearGradient id="chartGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 40 L20 35 L40 38 L60 25 L80 28 L100 15 L120 20 L140 10 L160 12 L180 5 L200 8"
                stroke="#D4AF37"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M0 40 L20 35 L40 38 L60 25 L80 28 L100 15 L120 20 L140 10 L160 12 L180 5 L200 8 L200 50 L0 50 Z"
                fill="url(#chartGold)"
              />
            </svg>
          </div>

          {/* Home indicator */}
          <div className="mt-auto flex justify-center pb-2 pt-2">
            <div className="w-16 h-1 rounded-full bg-white/15" />
          </div>
        </div>

        {/* Side button (power) */}
        <div
          className="absolute top-14 -right-0.5 h-6 w-[3px] rounded-l-sm"
          style={{ background: 'linear-gradient(180deg, #444 0%, #222 100%)' }}
        />
        {/* Volume buttons */}
        <div
          className="absolute top-20 -left-0.5 h-4 w-[3px] rounded-r-sm"
          style={{ background: 'linear-gradient(180deg, #444 0%, #222 100%)' }}
        />
        <div
          className="absolute top-26 -left-0.5 h-4 w-[3px] rounded-r-sm"
          style={{ background: 'linear-gradient(180deg, #444 0%, #222 100%)' }}
        />
      </div>

      {/* Glow behind phone */}
      <div
        className="absolute inset-0 -z-10 rounded-[2.5rem] sm:rounded-[3rem]"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.75 0.15 85 / 20%) 0%, transparent 70%)',
          transform: 'scale(1.2)',
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Download Button Component                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

function DownloadButton({
  icon,
  label,
  sublabel,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  className?: string;
}) {
  return (
    <button
      className={cn(
        'group flex items-center gap-3 rounded-xl px-4 py-3 sm:px-5 sm:py-3.5',
        'card-glass-premium',
        'hover-lift-sm',
        'transition-all duration-200',
        'border border-white/[0.06] hover:border-[#D4AF37]/20',
        className,
      )}
    >
      <div className="shrink-0 text-[#D4AF37]">{icon}</div>
      <div className="text-right">
        <div className="text-[10px] text-muted-foreground sm:text-xs">{sublabel}</div>
        <div className="text-xs font-bold text-foreground sm:text-sm">{label}</div>
      </div>
      <Download className="mr-auto size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AppDownloadSection() {
  const { t } = useTranslation();

  return (
    <section
      id="app-download"
      dir="rtl"
      className="relative py-16 sm:py-20 lg:py-24 overflow-hidden"
    >
      {/* ── Gold separator at top ── */}
      <div className="absolute top-0 left-0 right-0 gold-separator" />

      {/* ── Background glow ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 60% at 70% 50%, oklch(0.75 0.15 85 / 10%) 0%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          className="mx-auto mb-12 max-w-2xl text-center sm:mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="badge-gold mb-4 inline-block">
            {t('app.badge')}
          </span>
          <h2 className="gold-gradient-text mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl gold-text-shadow">
            {t('app.title')}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('app.subtitle')}
          </p>
        </motion.div>

        {/* ── Two-column layout: Phone + Content ── */}
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-16 lg:items-center">
          {/* Phone mockup */}
          <motion.div
            className="order-1 lg:order-2 lg:flex-1"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <PhoneMockup />
          </motion.div>

          {/* Content side */}
          <motion.div
            className="order-2 flex flex-col gap-6 lg:order-1 lg:flex-1 lg:gap-8"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Feature highlights */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {appFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.titleKey}
                    className="flex items-start gap-3 rounded-xl p-3 card-glass-premium"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + index * 0.08 }}
                  >
                    <div className="gold-icon-circle shrink-0">
                      <Icon className="size-4 text-gold" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-bold text-foreground sm:text-sm">
                        {t(feature.titleKey)}
                      </h3>
                      <p className="text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                        {t(feature.descKey)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Download buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              {/* Google Play */}
              <DownloadButton
                label={t('app.googlePlay')}
                sublabel="Android"
                icon={
                  <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.396 12l2.302-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
                  </svg>
                }
              />
              {/* App Store */}
              <DownloadButton
                label={t('app.appStore')}
                sublabel="iOS"
                icon={
                  <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                }
              />
            </div>

            {/* Direct APK + QR */}
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {/* Direct APK link */}
              <button
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2',
                  'text-xs text-muted-foreground hover:text-gold',
                  'border border-white/[0.06] hover:border-[#D4AF37]/20',
                  'transition-all duration-200',
                )}
              >
                <Download className="size-3.5" />
                {t('app.directApk')}
              </button>

              {/* QR code placeholder */}
              <div
                className="flex items-center gap-3 rounded-xl p-3 card-glass-premium"
                style={{ border: '1px solid rgba(212, 175, 55, 0.1)' }}
              >
                <div
                  className="flex items-center justify-center rounded-lg size-14"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0.03) 100%)',
                    border: '1px solid rgba(212, 175, 55, 0.15)',
                  }}
                >
                  <QrCode className="size-7 text-gold/50" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground">
                    {t('app.scanQr')}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    با دوربین گوشی اسکن کنید
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

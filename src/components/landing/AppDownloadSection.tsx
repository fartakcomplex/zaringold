'use client';

import { motion } from '@/lib/framer-compat';
import { Zap, Bell, Brain, Shield, Download, QrCode, Star, Smartphone, ArrowRight } from 'lucide-react';
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
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  {
    icon: Bell,
    titleKey: 'app.feature2',
    descKey: 'app.feature2Desc',
    gradient: 'from-yellow-500/20 to-amber-500/20',
  },
  {
    icon: Brain,
    titleKey: 'app.feature3',
    descKey: 'app.feature3Desc',
    gradient: 'from-orange-500/20 to-red-500/20',
  },
  {
    icon: Shield,
    titleKey: 'app.feature4',
    descKey: 'app.feature4Desc',
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Floating Elements Around Phone                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function FloatingElement({ children, className, delay = '0s' }: {
  children: React.ReactNode;
  className?: string;
  delay?: string;
}) {
  return (
    <div
      className={cn('absolute pointer-events-none', className)}
      style={{ animationDelay: delay }}
    >
      <div className="float-animation-slow">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CSS-Only Phone Mockup                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[220px] sm:w-[260px] lg:w-[280px]">
      {/* Animated ring behind phone */}
      <div
        className="absolute inset-0 -z-10 rounded-[3rem] sm:rounded-[3.5rem] lg:rounded-[4rem]"
        style={{
          background: 'conic-gradient(from 0deg, oklch(0.75 0.15 85 / 20%), transparent 30%, oklch(0.75 0.15 85 / 10%) 50%, transparent 70%, oklch(0.75 0.15 85 / 20%))',
          animation: 'spin-slow 12s linear infinite',
        }}
      />

      {/* Glow behind phone */}
      <div
        className="absolute inset-0 -z-20 rounded-[3rem] sm:rounded-[3.5rem] lg:rounded-[4rem] pulse-glow"
      />

      {/* Floating gold particles */}
      <FloatingElement className="top-4 -right-6" delay="0s">
        <div className="size-3 rounded-full bg-gold/30 shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
      </FloatingElement>
      <FloatingElement className="top-1/3 -left-8" delay="1s">
        <div className="size-2 rounded-full bg-gold-light/25 shadow-[0_0_6px_rgba(240,208,96,0.3)]" />
      </FloatingElement>
      <FloatingElement className="bottom-1/4 -right-10" delay="2s">
        <div className="size-2.5 rounded-full bg-gold/20 shadow-[0_0_8px_rgba(212,175,55,0.3)]" />
      </FloatingElement>
      <FloatingElement className="bottom-8 -left-6" delay="0.5s">
        <div className="size-2 rounded-full bg-gold-light/30 shadow-[0_0_6px_rgba(240,208,96,0.4)]" />
      </FloatingElement>

      {/* Phone frame */}
      <div
        className="relative rounded-[2.2rem] sm:rounded-[2.5rem] p-2.5 sm:p-3"
        style={{
          background: 'linear-gradient(160deg, #4a4a4a 0%, #2a2a2a 30%, #1a1a1a 70%, #111 100%)',
          boxShadow: `
            0 30px 80px rgba(0,0,0,0.5),
            0 0 0 1px rgba(255,255,255,0.06),
            inset 0 1px 0 rgba(255,255,255,0.15),
            inset 0 -1px 0 rgba(0,0,0,0.3)
          `,
        }}
      >
        {/* Screen */}
        <div
          className="relative overflow-hidden rounded-[1.7rem] sm:rounded-[2rem]"
          style={{
            background: 'linear-gradient(180deg, #0d0d0d 0%, #111111 50%, #0a0a0a 100%)',
            aspectRatio: '9/19.5',
          }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1">
            <span className="text-[8px] text-white/60 font-medium">۹:۴۱</span>
            <div className="h-1.5 w-8 rounded-full bg-white/15" />
            <div className="flex items-center gap-1">
              <div className="size-1 rounded-full bg-white/40" />
              <div className="size-1 rounded-full bg-white/40" />
              <div className="size-1 rounded-full bg-white/40" />
            </div>
          </div>

          {/* App header */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-white/90">زرین گلد</div>
                <div className="text-[7px] text-white/40 mt-0.5">خوش آمدید 👋</div>
              </div>
              <div
                className="flex items-center justify-center rounded-full size-7"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #F0D060 50%, #B8960C 100%)',
                  boxShadow: '0 2px 8px rgba(212, 175, 55, 0.4)',
                }}
              >
                <span className="text-[9px] font-black text-black">Z</span>
              </div>
            </div>
          </div>

          {/* Gold balance card */}
          <div className="mx-3 mt-2 rounded-xl p-3 relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #F0D060 30%, #B8960C 70%, #8B6914 100%)',
          }}>
            {/* Card pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
              backgroundSize: '12px 12px',
            }} />
            <div className="relative">
              <div className="text-[7px] text-black/50 font-medium">موجودی طلا</div>
              <div className="text-lg font-extrabold text-black mt-0.5 drop-shadow-sm">۱۲.۵۴ <span className="text-[10px]">گرم</span></div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 rounded-lg bg-black/20 py-1.5 text-center text-[8px] font-bold text-black/80 backdrop-blur-sm">
                  خرید
                </div>
                <div className="flex-1 rounded-lg bg-black/20 py-1.5 text-center text-[8px] font-bold text-black/80 backdrop-blur-sm">
                  فروش
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mx-3 mt-3 grid grid-cols-4 gap-1.5">
            {[
              { label: 'خرید', color: '#4ade80' },
              { label: 'فروش', color: '#f87171' },
              { label: 'پس‌انداز', color: '#60a5fa' },
              { label: 'بازار', color: '#D4AF37' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1">
                <div
                  className="flex items-center justify-center rounded-lg size-8"
                  style={{
                    background: 'rgba(212, 175, 55, 0.08)',
                    border: '1px solid rgba(212, 175, 55, 0.12)',
                    boxShadow: `0 2px 6px ${item.color}10`,
                  }}
                >
                  <div className="size-2.5 rounded-full" style={{ background: item.color, opacity: 0.7 }} />
                </div>
                <span className="text-[6.5px] text-white/45 font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Price chart */}
          <div className="mx-3 mt-3 rounded-lg p-2.5" style={{
            background: 'rgba(212, 175, 55, 0.04)',
            border: '1px solid rgba(212, 175, 55, 0.08)',
          }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[7px] text-white/60 font-medium">قیمت لحظه‌ای طلا</span>
              <span className="text-[7px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full">
                +۲.۴٪
              </span>
            </div>
            <svg viewBox="0 0 200 50" className="w-full h-8" fill="none">
              <defs>
                <linearGradient id="chartGoldApp" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#chartGoldApp)"
              />
            </svg>
          </div>

          {/* Home indicator */}
          <div className="mt-auto flex justify-center pb-2 pt-2">
            <div className="w-16 h-1 rounded-full bg-white/10" />
          </div>
        </div>

        {/* Side buttons */}
        <div
          className="absolute top-14 -right-0.5 h-6 w-[3px] rounded-l-sm"
          style={{ background: 'linear-gradient(180deg, #444 0%, #222 100%)' }}
        />
        <div
          className="absolute top-20 -left-0.5 h-4 w-[3px] rounded-r-sm"
          style={{ background: 'linear-gradient(180deg, #444 0%, #222 100%)' }}
        />
        <div
          className="absolute top-26 -left-0.5 h-4 w-[3px] rounded-r-sm"
          style={{ background: 'linear-gradient(180deg, #444 0%, #222 100%)' }}
        />
      </div>
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
        'group relative flex items-center gap-3 rounded-2xl px-5 py-3.5 sm:px-6 sm:py-4',
        'overflow-hidden',
        'transition-all duration-300',
        'hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]',
        className,
      )}
      style={{
        background: 'linear-gradient(135deg, oklch(0.98 0.025 85 / 80%), oklch(0.995 0.01 85 / 90%))',
        border: '1px solid oklch(0.75 0.15 85 / 12%)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Shimmer border */}
      <div className="absolute inset-0 shimmer-border rounded-2xl pointer-events-none" />

      <div className="shrink-0 text-gold relative z-10">{icon}</div>
      <div className="text-right relative z-10">
        <div className="text-[10px] text-gray-500 sm:text-xs">{sublabel}</div>
        <div className="text-xs font-bold text-gray-900 sm:text-sm">{label}</div>
      </div>
      <Download className="mr-auto size-3.5 text-gold opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 relative z-10" />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AppDownloadSection() {
  const { t, dir } = useTranslation();

  return (
    <section
      id="app-download"
      dir={dir}
      className="relative py-16 sm:py-20 lg:py-24 overflow-hidden"
    >
      {/* ── Gold separator at top ── */}
      <div className="absolute top-0 left-0 right-0 gold-separator" />

      {/* ── Background layers ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 70% at 60% 50%, oklch(0.75 0.15 85 / 8%) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 40% 50% at 30% 60%, oklch(0.85 0.1 85 / 6%) 0%, transparent 60%)',
        }}
      />

      {/* Sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="gold-sparkle absolute top-[10%] right-[15%]" style={{ animationDelay: '0s' }} />
        <div className="gold-sparkle absolute top-[40%] left-[10%]" style={{ animationDelay: '1.5s' }} />
        <div className="gold-sparkle absolute bottom-[20%] right-[25%]" style={{ animationDelay: '2.5s' }} />
        <div className="gold-sparkle absolute top-[60%] left-[30%]" style={{ animationDelay: '0.8s' }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          className="mx-auto mb-10 max-w-2xl text-center sm:mb-14"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="badge-gold mb-4 inline-block">
            {t('app.badge')}
          </span>
          <h2 className="gold-gradient-text mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl gold-text-shadow">
            {t('app.title')}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base max-w-xl mx-auto">
            {t('app.subtitle')}
          </p>
        </motion.div>

        {/* ── Two-column layout: Phone + Content ── */}
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16 lg:items-center">
          {/* Phone mockup */}
          <motion.div
            className="order-1 lg:order-2 lg:flex-1"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <PhoneMockup />
          </motion.div>

          {/* Content side */}
          <motion.div
            className="order-2 flex flex-col gap-6 lg:order-1 lg:flex-1 lg:gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Feature highlights grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {appFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.titleKey}
                    className="group relative rounded-2xl overflow-hidden p-4 card-spotlight hover-lift-sm"
                    style={{
                      background: 'linear-gradient(135deg, oklch(0.98 0.02 85 / 70%), oklch(0.995 0.008 85 / 80%))',
                      border: '1px solid oklch(0.75 0.15 85 / 8%)',
                    }}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                  >
                    <div className="absolute inset-0 shimmer-border rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-start gap-3">
                      <div
                        className={cn(
                          'shrink-0 flex items-center justify-center rounded-xl size-10 transition-all duration-300',
                          'bg-gold/8 group-hover:bg-gold/15',
                          'shadow-[0_2px_8px_rgba(212,175,55,0.08)]',
                          'group-hover:shadow-[0_2px_12px_rgba(212,175,55,0.15)]',
                        )}
                      >
                        <Icon className="size-4.5 text-gold transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="text-xs font-bold text-gray-900 sm:text-sm">
                          {t(feature.titleKey)}
                        </h3>
                        <p className="text-[11px] leading-relaxed text-gray-500 sm:text-xs">
                          {t(feature.descKey)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Download buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <DownloadButton
                label={t('app.googlePlay')}
                sublabel="Android"
                icon={
                  <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.396 12l2.302-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
                  </svg>
                }
              />
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
              <button
                className={cn(
                  'flex items-center gap-2 rounded-xl px-4 py-2.5',
                  'text-xs text-gray-600 hover:text-gold font-medium',
                  'transition-all duration-200',
                  'hover:shadow-[0_0_12px_rgba(212,175,55,0.08)]',
                )}
                style={{
                  background: 'linear-gradient(135deg, oklch(0.98 0.02 85 / 60%), oklch(0.995 0.008 85 / 70%))',
                  border: '1px solid oklch(0.75 0.15 85 / 8%)',
                }}
              >
                <Download className="size-3.5" />
                {t('app.directApk')}
                <ArrowRight className="size-3 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </button>

              {/* QR code */}
              <div
                className="flex items-center gap-3 rounded-2xl p-3 card-spotlight hover-lift-sm"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.98 0.02 85 / 70%), oklch(0.995 0.008 85 / 80%))',
                  border: '1px solid oklch(0.75 0.15 85 / 10%)',
                }}
              >
                <div
                  className="flex items-center justify-center rounded-xl size-14"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0.03) 100%)',
                    border: '1px solid rgba(212, 175, 55, 0.12)',
                    boxShadow: '0 2px 8px rgba(212, 175, 55, 0.05)',
                  }}
                >
                  <QrCode className="size-7 text-gold/50" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-gray-900">
                    {t('app.scanQr')}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    با دوربین گوشی اسکن کنید
                  </div>
                </div>
              </div>
            </div>

            {/* Rating badge */}
            <motion.div
              className="flex items-center gap-3 rounded-2xl px-5 py-3"
              style={{
                background: 'linear-gradient(135deg, oklch(0.98 0.02 85 / 60%), oklch(0.995 0.008 85 / 70%))',
                border: '1px solid oklch(0.75 0.15 85 / 8%)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Smartphone className="size-5 text-gold/60" />
              <div className="flex-1">
                <div className="text-xs font-bold text-gray-900">بیش از ۱۰۰,۰۰۰ دانلود</div>
                <div className="flex items-center gap-1 mt-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3 fill-gold text-gold" />
                  ))}
                  <span className="text-[10px] text-gray-500 mr-1">۴.۸ از ۵</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

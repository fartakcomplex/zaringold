
import React from 'react';
import {Award, ShieldCheck, Users, TrendingUp, Gem, Clock, CheckCircle2, ArrowLeft, Sparkles, Target, Rocket, Building2, Star, Trophy, Globe} from 'lucide-react';
import {motion} from '@/lib/framer-compat';
import {cn} from '@/lib/utils';
import {useTranslation} from '@/lib/i18n';

/* ═════════════════════════════════════════════════════════════════ */
/*  About Us Page                                                          */
/* ═════════════════════════════════════════════════════════════════════════════ */

interface SubPageProps {
  onBack: () => void;
}

export default function AboutPage({ onBack }: SubPageProps) {
  const { t } = useTranslation();

  const stats = [
    { label: t('about.stats.activeUsers'), value: t('about.stats.activeUsersValue'), icon: Users, color: 'from-amber-500 to-gold' },
    { label: t('about.stats.dailyVolume'), value: t('about.stats.dailyVolumeValue'), icon: TrendingUp, color: 'from-emerald-500 to-emerald-400' },
    { label: t('about.stats.yearsExperience'), value: t('about.stats.yearsExperienceValue'), icon: Award, color: 'from-violet-500 to-violet-400' },
    { label: t('about.stats.support247'), value: t('about.stats.support247Value'), icon: ShieldCheck, color: 'from-rose-500 to-rose-400' },
  ];

  const values = [
    {
      icon: ShieldCheck,
      title: t('about.values.security.title'),
      desc: t('about.values.security.desc'),
      gradient: 'from-amber-500/20 to-gold/5',
      iconBg: 'from-amber-500 to-gold',
    },
    {
      icon: Clock,
      title: t('about.values.speed.title'),
      desc: t('about.values.speed.desc'),
      gradient: 'from-emerald-500/20 to-emerald-400/5',
      iconBg: 'from-emerald-500 to-emerald-400',
    },
    {
      icon: TrendingUp,
      title: t('about.values.transparency.title'),
      desc: t('about.values.transparency.desc'),
      gradient: 'from-sky-500/20 to-sky-400/5',
      iconBg: 'from-sky-500 to-sky-400',
    },
    {
      icon: Gem,
      title: t('about.values.storage.title'),
      desc: t('about.values.storage.desc'),
      gradient: 'from-violet-500/20 to-violet-400/5',
      iconBg: 'from-violet-500 to-violet-400',
    },
  ];

  const team = [
    {
      name: 'علی محمدی',
      role: t('about.team.ceo'),
      bio: t('about.team.ceoBio'),
      gradient: 'from-amber-400 to-gold',
      delay: 0,
    },
    {
      name: 'مریم رضایی',
      role: t('about.team.cto'),
      bio: t('about.team.ctoBio'),
      gradient: 'from-emerald-400 to-emerald-500',
      delay: 0.1,
    },
    {
      name: 'محمد حسینی',
      role: t('about.team.cfo'),
      bio: t('about.team.cfoBio'),
      gradient: 'from-violet-400 to-violet-500',
      delay: 0.2,
    },
    {
      name: 'سارا کریمی',
      role: t('about.team.cmo'),
      bio: t('about.team.cmoBio'),
      gradient: 'from-rose-400 to-rose-500',
      delay: 0.3,
    },
  ];

  const milestones = [
    { year: '۱۳۹۹', event: t('about.timeline.m1'), icon: '🚀' },
    { year: '۱۴۰۰', event: t('about.timeline.m2'), icon: '📈' },
    { year: '۱۴۰۱', event: t('about.timeline.m3'), icon: '🏆' },
    { year: '۱۴۰۲', event: t('about.timeline.m4'), icon: '💳' },
    { year: '۱۴۰۳', event: t('about.timeline.m5'), icon: '💎' },
    { year: '۱۴۰۴', event: t('about.timeline.m6'), icon: '🏦' },
  ];

  const licenses = [
    { title: t('about.trust.exchange'), desc: t('about.trust.exchangeDesc'), icon: Building2 },
    { title: t('about.trust.insurance'), desc: t('about.trust.insuranceDesc'), icon: ShieldCheck },
    { title: t('about.trust.iso'), desc: t('about.trust.isoDesc'), icon: Award },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Enhanced Header ── */}
      <div className="relative overflow-hidden border-b border-border">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.08] via-gold/[0.03] to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-gold/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-20 right-10 w-3 h-3 bg-gold rounded-full opacity-40 animate-pulse" />
        <div className="absolute top-32 left-20 w-2 h-2 bg-gold-light rounded-full opacity-30 animate-pulse delay-1000" />
        <div className="absolute top-16 left-1/3 w-1.5 h-1.5 bg-gold rounded-full opacity-25 animate-pulse delay-500" />

        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24">
          <motion.button
            onClick={onBack}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-gold group"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:translate-x-1" />
            {t('common.backToMain')}
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-bl from-gold-light via-gold to-gold-dark shadow-lg shadow-gold/20">
                <span className="text-2xl font-black text-gray-950">{t('logo.letter')}</span>
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-bl from-gold/20 to-transparent blur-sm -z-10" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-gold" />
                    </span>
                    {t('about.since')}
                  </span>
                </div>
                <h1 className="text-3xl font-black md:text-5xl gold-text-shadow">
                  {t('about.title')} <span className="gold-gradient-text">{t('common.zarrinGold')}</span>
                </h1>
              </div>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
          >
            {t('about.description')}
          </motion.p>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-4 -mt-8 md:grid-cols-4 md:gap-6">
          {stats.map((s, idx) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
              className={cn(
                'group relative overflow-hidden rounded-2xl border border-white/50 bg-white/60 p-5 text-center shadow-sm backdrop-blur-xl',
                'hover-lift-md card-spotlight',
                'dark:border-gold/10 dark:bg-gold/[0.03]'
              )}
            >
              {/* Top accent line */}
              <div className={cn('absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100', s.color)} />
              <div className={cn('flex mx-auto mb-3 size-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg', s.color)}>
                <s.icon className="size-5" />
              </div>
              <p className="text-2xl font-black text-foreground md:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Mission & Vision ── */}
      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6">
        {/* Background decoration */}
        <div className="absolute inset-0 radial-gold-fade opacity-30 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mb-8 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold">
            <Target className="size-3.5" />
            {t('about.mission.badge')}
          </span>
          <h2 className="mt-4 text-2xl font-bold md:text-3xl gold-text-shadow">{t('about.mission.title')}</h2>
        </motion.div>

        <div className="relative grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className={cn(
              'group relative overflow-hidden rounded-2xl p-6 md:p-8',
              'shimmer-border card-spotlight hover-lift-md',
              'bg-gradient-to-br from-gold/[0.08] to-gold/[0.02]',
              'dark:from-gold/[0.06] dark:to-gold/[0.01]'
            )}
          >
            {/* Decorative gradient orb */}
            <div className="absolute -top-10 -right-10 size-32 bg-gradient-to-br from-gold/15 to-transparent rounded-full blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-gold-dark text-white shadow-lg shadow-gold/20">
                  <Target className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-gold">{t('about.mission.ourMission')}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t('about.mission.missionDesc')}
              </p>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="size-3 text-gold" /> {t('about.mission.universalAccess')}</span>
                <span className="flex items-center gap-1"><ShieldCheck className="size-3 text-gold" /> {t('about.mission.absoluteSecurity')}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className={cn(
              'group relative overflow-hidden rounded-2xl p-6 md:p-8',
              'shimmer-border card-spotlight hover-lift-md',
              'bg-gradient-to-br from-violet/[0.06] to-violet/[0.01]'
            )}
          >
            <div className="absolute -bottom-10 -left-10 size-32 bg-gradient-to-br from-violet/10 to-transparent rounded-full blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/20">
                  <Rocket className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-violet-600 dark:text-violet-400">{t('about.mission.ourVision')}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t('about.mission.visionDesc')}
              </p>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><TrendingUp className="size-3 text-violet-500" /> {t('about.mission.continuousGrowth')}</span>
                <span className="flex items-center gap-1"><Globe className="size-3 text-violet-500" /> {t('about.mission.regional')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Values ── */}
      <div className="relative border-t border-border bg-muted/20 overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-20 pointer-events-none" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold">
              <Star className="size-3.5" />
              {t('about.advantages.badge')}
            </span>
            <h2 className="mt-4 text-2xl font-bold md:text-3xl gold-text-shadow">{t('about.whyUs')}</h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2">
            {values.map((v, idx) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={cn(
                  'group relative flex gap-4 rounded-2xl p-5 border transition-all hover-lift-md',
                  'bg-white/60 backdrop-blur-xl border-white/50',
                  'dark:bg-gold/[0.02] dark:border-gold/10',
                  'card-spotlight'
                )}
              >
                <div className={cn(
                  'flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform group-hover:scale-110',
                  v.iconBg
                )}>
                  <v.icon className="size-5" />
                </div>
                <div>
                  <h3 className="mb-1 font-bold">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
                </div>
                {/* Bottom accent bar */}
                <div className={cn(
                  'absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r opacity-0 transition-all group-hover:opacity-100',
                  v.gradient
                )} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 radial-gold-fade opacity-20 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mb-10 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold">
            <Clock className="size-3.5" />
            {t('about.timeline.badge')}
          </span>
          <h2 className="mt-4 text-2xl font-bold md:text-3xl gold-text-shadow">{t('about.timeline.title')}</h2>
        </motion.div>

        <div className="relative">
          {/* Gold gradient line */}
          <div className="absolute top-0 bottom-0 start-5 md:start-8 w-0.5 bg-gradient-to-b from-gold via-gold/40 to-transparent" />
          {/* Animated glow on the line */}
          <div className="absolute top-0 start-5 md:start-8 w-1 h-24 bg-gradient-to-b from-gold/60 to-transparent rounded-full blur-sm" />

          <div className="space-y-8">
            {milestones.map((m, idx) => (
              <motion.div
                key={m.year}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + idx * 0.08 }}
                className="relative flex gap-5 ps-14 md:ps-20"
              >
                {/* Timeline node */}
                <div className="absolute start-3.5 top-2 md:start-6.5 z-10">
                  <div className="flex size-4 items-center justify-center rounded-full border-2 border-gold bg-background shadow-sm shadow-gold/20">
                    <div className="size-1.5 rounded-full bg-gold" />
                  </div>
                </div>

                <div className={cn(
                  'group flex-1 rounded-2xl p-5 border transition-all hover-lift-sm',
                  'bg-white/60 backdrop-blur-xl border-white/50',
                  'dark:bg-gold/[0.02] dark:border-gold/10',
                  'card-spotlight'
                )}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{m.icon}</span>
                    <div>
                      <span className="inline-block rounded-full bg-gold/10 px-3 py-0.5 text-sm font-bold text-gold">{m.year}</span>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.event}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Team ── */}
      <div className="relative border-t border-border bg-muted/20 overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-20 pointer-events-none" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold">
              <Users className="size-3.5" />
              {t('about.team.badge')}
            </span>
            <h2 className="mt-4 text-2xl font-bold md:text-3xl gold-text-shadow">{t('about.team.title')}</h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member, idx) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={cn(
                  'group relative overflow-hidden rounded-2xl p-6 text-center transition-all hover-lift-lg',
                  'bg-white/60 backdrop-blur-xl border border-white/50',
                  'dark:bg-gold/[0.02] dark:border-gold/10',
                  'card-spotlight'
                )}
              >
                {/* Top gradient accent */}
                <div className={cn(
                  'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100',
                  member.gradient
                )} />
                {/* Glow behind avatar */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 size-24 rounded-full blur-2xl opacity-0 transition-opacity group-hover:opacity-20"
                  style={{ background: member.gradient.includes('amber') ? '#D4AF37' : member.gradient.includes('emerald') ? '#22c55e' : member.gradient.includes('violet') ? '#8b5cf6' : '#f43f5e' }}
                />
                <div className="relative mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-gradient-to-bl from-gold/20 to-gold/[0.05] ring-2 ring-gold/10 transition-all group-hover:ring-gold/30 group-hover:scale-105">
                  <span className="text-3xl font-black gold-gradient-text">{member.name.charAt(0)}</span>
                </div>
                <h3 className="font-bold text-base">{member.name}</h3>
                <p className="text-xs font-medium text-gold mt-0.5">{member.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{member.bio}</p>
                {/* Bottom decorative dots */}
                <div className="mt-4 flex items-center justify-center gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="size-1 rounded-full bg-gold/30" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Licenses & Certifications ── */}
      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold">
            <Trophy className="size-3.5" />
            {t('about.trust.badge')}
          </span>
          <h2 className="mt-4 text-2xl font-bold md:text-3xl gold-text-shadow">{t('about.trust.title')}</h2>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-3">
          {licenses.map((l, idx) => (
            <motion.div
              key={l.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={cn(
                'group flex items-center gap-3 rounded-2xl p-5 border transition-all hover-lift-sm',
                'bg-white/60 backdrop-blur-xl border-white/50',
                'dark:bg-gold/[0.02] dark:border-gold/10',
                'card-spotlight'
              )}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-110">
                <l.icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold">{l.title}</p>
                <p className="text-xs text-muted-foreground">{l.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

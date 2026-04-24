'use client';

import React from 'react';
import {
  ShieldCheck,
  Eye,
  Lock,
  Server,
  UserCheck,
  Bell,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  LockKeyhole,
  Database,
  Share2,
  Scale,
  ListChecks,
  Fingerprint,
} from 'lucide-react';
import { motion } from '@/lib/framer-compat';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Privacy Policy Page                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface SubPageProps {
  onBack: () => void;
}

interface Section {
  title: string;
  icon: React.ElementType;
  items: string[];
  gradient: string;
  iconBg: string;
}

const sections: Section[] = [
  {
    title: 'اطلاعاتی که جمع‌آوری می‌کنیم',
    icon: Eye,
    gradient: 'from-sky-500/10 to-sky-400/5',
    iconBg: 'from-sky-500 to-sky-400',
    items: [
      'اطلاعات هویتی: نام، نام خانوادگی، کد ملی، تاریخ تولد، آدرس و اطلاعات تماس — جهت احراز هویت و تطابق با قوانین بانکی.',
      'اطلاعات مالی: شماره شبا، اطلاعات حساب بانکی و سوابق تراکنش‌ها — جهت پردازش واریز و برداشت.',
      'اطلاعات فنی: آدرس IP، نوع مرورگر، مدل دستگاه و سیستم‌عامل — جهت امنیت و بهبود تجربه کاربری.',
      'اطلاعات زیستی: تصویر چهره و مدارک هویتی — فقط جهت احراز هویت و مطابق با الزامات قانونی.',
      'اطلاعات استفاده: صفحات بازدیدشده، مدت زمان استفاده و تعاملات — جهت تحلیل رفتار و بهبود خدمات.',
    ],
  },
  {
    title: 'نحوه استفاده از اطلاعات',
    icon: UserCheck,
    gradient: 'from-emerald-500/10 to-emerald-400/5',
    iconBg: 'from-emerald-500 to-emerald-400',
    items: [
      'پردازش تراکنش‌های مالی و مدیریت حساب کاربری.',
      'احراز هویت و تأیید هویت مطابق با قوانین سازمان بورس و پلیس فتا.',
      'ارسال اعلان‌ها و اطلاع‌رسانی‌های مهم درباره حساب و تراکنش‌ها.',
      'بهبود خدمات، رفع اشکالات و توسعه ویژگی‌های جدید.',
      'جلوگیری از تقلب، پولشویی و فعالیت‌های غیرمجاز.',
      'تحلیل آماری (بدون شناسایی فردی) برای بهبود تجربه کاربری.',
    ],
  },
  {
    title: 'حفاظت و امنیت داده‌ها',
    icon: LockKeyhole,
    gradient: 'from-violet-500/10 to-violet-400/5',
    iconBg: 'from-violet-500 to-violet-400',
    items: [
      'رمزنگاری TLS 1.3 برای تمام ارتباطات بین مرورگر و سرور.',
      'رمزنگاری AES-256 برای ذخیره‌سازی اطلاعات حساس در دیتابیس.',
      'کنترل دسترسی مبتنی بر نقش (RBAC) برای کارمندان — فقط افراد مجاز به اطلاعات حساس دسترسی دارند.',
      'نظارت امنیتی ۲۴/۷ با سیستم‌های تشخیص نفوذ (IDS).',
      'بکاپ‌گیری روزانه و ذخیره‌سازی در سرورهای جداگانه با رمزنگاری.',
      'آزمون‌های نفوذ دوره‌ای توسط تیم‌های امنیت مستقل.',
    ],
  },
  {
    title: 'ذخیره‌سازی اطلاعات',
    icon: Database,
    gradient: 'from-gold/10 to-gold/5',
    iconBg: 'from-gold-dark to-gold',
    items: [
      'اطلاعات هویتی: حداقل ۵ سال از آخرین فعالیت حساب (مطابق قانون ضد پولشویی).',
      'سوابق تراکنش: ۱۰ سال از تاریخ انجام تراکنش.',
      'لاگ‌های سیستمی: ۹۰ روز (بعد از این دوره به صورت ناشناس نگهداری می‌شوند).',
      'اطلاعات بازاریابی: تا زمان لغو اشتراک توسط کاربر.',
      'کاربر می‌تواند درخواست حذف حساب و اطلاعات شخصی خود را ثبت کند (مگر موارد قانونی).',
    ],
  },
  {
    title: 'اشتراک‌گذاری اطلاعات با اشخاص ثالث',
    icon: Share2,
    gradient: 'from-rose-500/10 to-rose-400/5',
    iconBg: 'from-rose-500 to-rose-400',
    items: [
      'اطلاعات شخصی بدون رضایت صریح کاربر به اشخاص ثالث فروخته یا اجاره نمی‌شود.',
      'اطلاعات ممکن است به صورت محدود به نهادهای زیر ارائه شود: بانک مرکزی، سازمان بورس، پلیس فتا و مراجع قضایی.',
      'ارائه‌دهندگان خدماتی: درگاه‌های بانکی، شرکت‌های بیمه و ارائه‌دهندگان SMS — فقط اطلاعات لازم برای ارائه خدمت.',
      'در صورت ادغام یا خرید شرکت، اطلاعات با رعایت قوانین به خریدار منتقل می‌شود.',
    ],
  },
  {
    title: 'حقوق کاربر',
    icon: Scale,
    gradient: 'from-amber-500/10 to-amber-400/5',
    iconBg: 'from-amber-500 to-amber-400',
    items: [
      'حق دسترسی به تمام اطلاعات شخصی ذخیره‌شده.',
      'حق درخواست اصلاح یا به‌روزرسانی اطلاعات نادرست.',
      'حق درخواست حذف اطلاعات (موضوع به موارد استثنای قانونی).',
      'حق PORTABIL: دریافت کپی از اطلاعات شخصی در فرمت قابل خواندن.',
      'حق اعتراض به پردازش اطلاعات برای اهداف بازاریابی.',
      'حق شکایت به دادسرای جرایم رایانه‌ای در صورت تخلف.',
    ],
  },
];

const quickBadges = [
  { title: 'رمزنگاری', desc: 'AES-256 + TLS 1.3', icon: Fingerprint, gradient: 'from-emerald-500 to-emerald-400' },
  { title: 'بدون فروش اطلاعات', desc: 'اطلاعات به اشخاص ثالث فروخته نمی‌شود', icon: ShieldCheck, gradient: 'from-gold-dark to-gold' },
  { title: 'کنترل کاربر', desc: 'دسترسی، اصلاح و حذف داده‌ها', icon: UserCheck, gradient: 'from-violet-500 to-violet-400' },
];

export default function PrivacyPage({ onBack }: SubPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Enhanced Header ── */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.08] via-gold/[0.03] to-transparent" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[200px] bg-gradient-to-b from-emerald-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-24 left-16 w-2 h-2 bg-emerald-400 rounded-full opacity-30 animate-pulse" />
        <div className="absolute top-16 right-1/3 w-1.5 h-1.5 bg-gold rounded-full opacity-25 animate-pulse delay-500" />

        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-24">
          <motion.button
            onClick={onBack}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-gold group"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:translate-x-1" />
            بازگشت به صفحه اصلی
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 ring-1 ring-emerald-500/20">
                <Lock className="size-6 text-emerald-500" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                    </span>
                    آخرین بروزرسانی: اردیبهشت ۱۴۰۴
                  </span>
                </div>
                <h1 className="text-3xl font-black md:text-5xl gold-text-shadow">
                  حریم <span className="gold-gradient-text">خصوصی</span>
                </h1>
              </div>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl text-sm leading-relaxed text-muted-foreground"
          >
            ما متعهد به حفاظت از اطلاعات شخصی شما هستیم.
            این صفحه نحوه جمع‌آوری، استفاده و محافظت از داده‌های شما را توضیح می‌دهد.
          </motion.p>
        </div>
      </div>

      {/* ── Enhanced Quick Summary Badges ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="grid gap-4 -mt-4 sm:grid-cols-3">
          {quickBadges.map((b, idx) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 + idx * 0.08 }}
              className={cn(
                'group relative flex items-center gap-3 rounded-2xl p-4 border transition-all hover-lift-sm',
                'bg-white/60 backdrop-blur-xl border-white/50',
                'dark:bg-gold/[0.02] dark:border-gold/10',
                'card-spotlight'
              )}
            >
              <div className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform group-hover:scale-110',
                b.gradient
              )}>
                <b.icon className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold">{b.title}</p>
                <p className="text-[11px] text-muted-foreground">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Table of Contents ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={cn(
            'relative overflow-hidden rounded-2xl p-5 border',
            'bg-white/60 backdrop-blur-xl border-white/50',
            'dark:bg-gold/[0.02] dark:border-gold/10'
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="size-4 text-gold" />
            <h2 className="text-sm font-bold text-gold">فهرست مطالب</h2>
          </div>
          <div className="grid gap-1 sm:grid-cols-2">
            {sections.map((s, idx) => (
              <motion.a
                key={s.title}
                href={`#${s.title.replace(/\s/g, '-')}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.45 + idx * 0.04 }}
                className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-gold/[0.06] hover:text-gold"
              >
                <div className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-lg transition-all bg-muted group-hover:bg-gradient-to-br group-hover:text-white',
                  s.iconBg
                )}>
                  <s.icon className="size-3.5 text-muted-foreground group-hover:text-white" />
                </div>
                <span className="text-xs font-medium">{s.title}</span>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Content Sections ── */}
      <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="absolute inset-0 radial-gold-fade opacity-15 pointer-events-none" />

        <div className="relative space-y-8">
          {sections.map((s, sIdx) => (
            <motion.section
              key={s.title}
              id={s.title.replace(/\s/g, '-')}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + sIdx * 0.06 }}
              className="scroll-mt-24"
            >
              <div className={cn(
                'group relative overflow-hidden rounded-2xl p-6 border transition-all hover-lift-sm',
                'bg-white/60 backdrop-blur-xl border-white/50',
                'dark:bg-gold/[0.02] dark:border-gold/10',
                'card-spotlight'
              )}>
                {/* Top accent line */}
                <div className={cn('absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-60', s.iconBg)} />
                {/* Background gradient */}
                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none', s.gradient)} />

                <div className="relative">
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className={cn(
                      'flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg',
                      s.iconBg
                    )}>
                      <s.icon className="size-4" />
                    </div>
                    <h2 className="text-lg font-bold">{s.title}</h2>
                  </div>

                  {/* Content items */}
                  <ul className="space-y-3">
                    {s.items.map((item, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 + sIdx * 0.06 + i * 0.04 }}
                        className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
                      >
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-gold/60" />
                        <span>{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  );
}

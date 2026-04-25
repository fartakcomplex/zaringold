'use client';

import React from 'react';
import {
  Scale,
  ShieldCheck,
  FileText,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ListChecks,
  Wallet,
  Ban,
  Lock,
  Info,
} from 'lucide-react';
import { motion } from '@/lib/framer-compat';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Terms & Conditions Page                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface SubPageProps {
  onBack: () => void;
}

interface Section {
  id: string;
  title: string;
  content: string[];
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
}

const sections: Section[] = [
  {
    id: 'general',
    title: 'ماده ۱ — تعاریف و مقررات کلی',
    icon: FileText,
    gradient: 'from-sky-500/10 to-sky-400/5',
    iconBg: 'from-sky-500 to-sky-400',
    content: [
      '«زرین گلد» یک پلتفرم آنلاین معاملات طلای دیجیتال است که تحت نظارت سازمان بورس و اوراق بهادار فعالیت می‌کند.',
      'کاربر با ثبت‌نام در پلتفرم، قوانین و مقررات مندرج در این صفحه را می‌پذیرد.',
      'استفاده از خدمات زرین گلد منوط به تکمیل فرآیند احراز هویت (KYC) مطابق با قوانین جمهوری اسلامی ایران است.',
      'کاربر موظف است اطلاعات خود را به‌روز و دقیق نگه دارد. هرگونه اطلاعات نادرست ممکن است منجر به مسدودی حساب شود.',
      'حداقل سن برای استفاده از خدمات ۱۸ سال تمام شمسی است.',
    ],
  },
  {
    id: 'trading',
    title: 'ماده ۲ — قوانین معاملات',
    icon: Scale,
    gradient: 'from-gold/10 to-gold/5',
    iconBg: 'from-gold-dark to-gold',
    content: [
      'تمام معاملات بر اساس نرخ لحظه‌ای بازار تهران و قیمت اونس جهانی انجام می‌شود.',
      'کارمزد معاملات خرید ۰.۳٪ و فروش ۰.۴٪ از ارزش کل معامله است.',
      'حداقل مقدار خرید طلا معادل ۰.۰۳۳ گرم طلا و حداکثر بدون محدودیت (با تأیید احراز هویت سطح ۲) است.',
      'طلای خریداری‌شده به صورت دیجیتال در کیف پول طلایی کاربر نگهداری می‌شود.',
      'قیمت‌ها ممکن است در ساعات مختلف روز تغییر کنند و زرین گلد هیچ تضمینی برای ثبات قیمت‌ها نمی‌دهد.',
      'درخواست فروش طلا پس از تأیید نهایی غیرقابل برگشت است.',
    ],
  },
  {
    id: 'security',
    title: 'ماده ۳ — امنیت و حفاظت از حساب',
    icon: ShieldCheck,
    gradient: 'from-emerald-500/10 to-emerald-400/5',
    iconBg: 'from-emerald-500 to-emerald-400',
    content: [
      'کاربر مسئول حفظ امنیت رمز عبور، کد تأیید و اطلاعات ورود حساب خود است.',
      'زرین گلد مسئولیتی در قبال زیان ناشی از نشت اطلاعات ورود توسط کاربر ندارد.',
      'فعالیت تأیید دو مرحله‌ای (2FA) الزامی است. بدون فعال‌سازی، امکان برداشت وجود ندارد.',
      'در صورت شناسایی فعالیت مشکوک، زرین گلد حق مسدودی موقت حساب را دارد.',
      'تمام ارتباطات بین کاربر و سرور با رمزنگاری TLS 1.3 محافظت می‌شود.',
    ],
  },
  {
    id: 'wallet',
    title: 'ماده ۴ — کیف پول و تراکنش‌ها',
    icon: Wallet,
    gradient: 'from-violet-500/10 to-violet-400/5',
    iconBg: 'from-violet-500 to-violet-400',
    content: [
      'موجودی کیف پول طلایی کاربر بر اساس وزن واقعی طلا محاسبه می‌شود (گرم/مثقال).',
      'واریز و برداشت طلایی از طریق درگاه‌های پرداخت معتبر انجام می‌شود.',
      'مدت زمان پردازش برداشت طلایی حداکثر ۷۲ ساعت کاری است.',
      'موجودی کیف پول طلایی تحت بیمه سپرده مرکزی تا سقف ۱ کیلوگرم طلا است.',
      'زرین گلد حق تغییر کارمزد تراکنش‌ها را با اطلاع‌رسانی ۳۰ روزه قبلی دارد.',
    ],
  },
  {
    id: 'prohibited',
    title: 'ماده ۵ — فعالیت‌های ممنوع',
    icon: Ban,
    gradient: 'from-rose-500/10 to-rose-400/5',
    iconBg: 'from-rose-500 to-rose-400',
    content: [
      'استفاده از ربات‌ها، اسکریپت‌ها و هرگونه ابزار خودکار برای معاملات ممنوع است.',
      'پولشویی، تأمین مالی غیرمجاز و هرگونه فعالیت غیرقانونی ممنوع است.',
      'انتشار اطلاعات نادرست درباره زرین گلد یا دستکاری قیمت‌ها ممنوع است.',
      'ایجاد چند حساب کاربری توسط یک نفر ممنوع است.',
      'تلاش برای نفوذ به سیستم‌های زرین گلد جرم محسوب و پیگرد قانونی دارد.',
      'هرگونه سوءاستفاده از سیستم پاداش و دعوت ممنوع و قابل پیگیری است.',
    ],
  },
  {
    id: 'privacy',
    title: 'ماده ۶ — حریم خصوصی و داده‌ها',
    icon: Lock,
    gradient: 'from-amber-500/10 to-amber-400/5',
    iconBg: 'from-amber-500 to-amber-400',
    content: [
      'اطلاعات شخصی کاربران بدون رضایت قبلی به اشخاص ثالث ارائه نمی‌شود.',
      'اطلاعات هویتی مطابق با قانون حفاظت از داده‌ها برای حداقل ۵ سال نگهداری می‌شود.',
      'کاربر حق درخواست مشاهده، ویرایش یا حذف اطلاعات شخصی خود را دارد.',
      'زرین گلد از کوکی‌ها و تکنولوژی‌های مشابه برای بهبود تجربه کاربری استفاده می‌کند.',
      'در صورت درخواست مراجع قانونی، زرین گلد موظف به ارائه اطلاعات کاربر است.',
    ],
  },
  {
    id: 'liability',
    title: 'ماده ۷ — مسئولیت و ضمانت',
    icon: Info,
    gradient: 'from-slate-500/10 to-slate-400/5',
    iconBg: 'from-slate-500 to-slate-400',
    content: [
      'زرین گلد تضمین سودآوری یا ثبات قیمت طلا را نمی‌دهد. سرمایه‌گذاری در طلا ریسک بازار دارد.',
      'در صورت قطعی سرور یا مشکلات فنی، زرین گلد مسئول زیان ناشی از معاملات انجام‌نشده نیست.',
      'حداکثر مسئولیت زرین گلد معادل کارمزد دریافتی در ۳ ماه اخیر است.',
      'زرین گلد حق تغییر هر یک از این قوانین را با اطلاع‌رسانی ۱۵ روزه از طریق ایمیل و اعلان‌های پلتفرم دارد.',
      'ادامه استفاده از خدمات پس از اعلام تغییرات به منزله پذیرش قوانین جدید است.',
    ],
  },
];

export default function TermsPage({ onBack }: SubPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Enhanced Header ── */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.08] via-gold/[0.03] to-transparent" />
        <div className="absolute top-0 left-1/3 w-[400px] h-[200px] bg-gradient-to-b from-gold/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-20 right-20 w-2 h-2 bg-gold rounded-full opacity-30 animate-pulse" />

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
              <div className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 ring-1 ring-gold/20">
                <Scale className="size-6 text-gold" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-gold" />
                    </span>
                    آخرین بروزرسانی: اردیبهشت ۱۴۰۴
                  </span>
                </div>
                <h1 className="text-3xl font-black md:text-5xl gold-text-shadow">
                  قوانین و <span className="gold-gradient-text">مقررات</span>
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
            با استفاده از خدمات زرین گلد، شما قوانین زیر را مطالعه کرده و می‌پذیرید.
            لطفاً قبل از استفاده از خدمات، این صفحه را با دقت مطالعه نمایید.
          </motion.p>
        </div>
      </div>

      {/* ── Enhanced Table of Contents ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className={cn(
            'relative -mt-4 overflow-hidden rounded-2xl p-6 border',
            'shimmer-border bg-white/60 backdrop-blur-xl border-white/50',
            'dark:bg-gold/[0.02] dark:border-gold/10'
          )}
        >
          <div className="absolute -top-8 -right-8 size-24 bg-gradient-to-br from-gold/8 to-transparent rounded-full blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="size-4 text-gold" />
              <h2 className="text-sm font-bold text-gold">فهرست مطالب</h2>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {sections.map((s, idx) => (
                <motion.a
                  key={s.id}
                  href={`#${s.id}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + idx * 0.04 }}
                  className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-gold/[0.06] hover:text-gold"
                >
                  <div className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-lg transition-all',
                    'bg-muted group-hover:bg-gradient-to-br group-hover:text-white',
                    s.iconBg
                  )}>
                    <s.icon className="size-3.5 text-muted-foreground group-hover:text-white" />
                  </div>
                  <span className="text-xs font-medium">{s.title.replace(/^(ماده \d — )/, '')}</span>
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Content Sections ── */}
      <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="absolute inset-0 radial-gold-fade opacity-15 pointer-events-none" />

        <div className="relative space-y-8">
          {sections.map((s, sIdx) => (
            <motion.section
              key={s.id}
              id={s.id}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + sIdx * 0.06 }}
              className="scroll-mt-24"
            >
              <div className={cn(
                'relative overflow-hidden rounded-2xl p-6 border transition-all hover-lift-sm',
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
                    {s.content.map((item, i) => (
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

'use client';

import React from 'react';
import {
  Award,
  ShieldCheck,
  Users,
  TrendingUp,
  Gem,
  Clock,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  About Us Page                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface SubPageProps {
  onBack: () => void;
}

const stats = [
  { label: 'کاربر فعال', value: '۱۲۰,۰۰۰+', icon: Users },
  { label: 'حجم معاملات روزانه', value: '۵۰۰ کیلو', icon: TrendingUp },
  { label: 'سال تجربه', value: '۵+', icon: Award },
  { label: 'پشتیبانی ۲۴/۷', value: 'آنلاین', icon: ShieldCheck },
];

const values = [
  {
    icon: ShieldCheck,
    title: 'امنیت بالا',
    desc: 'تأیید هویت چندمرحله‌ای، رمزگذاری پیشرفته و صندوق بیمه سپرده برای حفاظت از دارایی‌های شما.',
  },
  {
    icon: Clock,
    title: 'سرعت معاملات',
    desc: 'خرید و فروش آنی طلا در کمتر از ۳ ثانیه. بدون انتظار و بدون محدودیت زمانی.',
  },
  {
    icon: TrendingUp,
    title: 'شفافیت قیمت',
    desc: 'قیمت‌ها بر اساس نرخ لحظه‌ای بازار تهران و اونس جهانی به‌روزرسانی می‌شوند.',
  },
  {
    icon: Gem,
    title: 'ذخیره ایمن',
    desc: 'طلای شما در صندوق‌های تحت نظارت بانک مرکزی با بیمه کامل نگهداری می‌شود.',
  },
];

const team = [
  {
    name: 'علی محمدی',
    role: 'مدیرعامل و بنیان‌گذار',
    bio: 'بیش از ۱۵ سال تجربه در بازار سرمایه و فین‌تک. فارغ‌التحصیل MBA از دانشگاه تهران.',
  },
  {
    name: 'مریم رضایی',
    role: 'مدیر فنی (CTO)',
    bio: 'متخصص بلاکچین و امنیت سایبری. سابقه کار در شرکت‌های بزرگ فناوری مالی.',
  },
  {
    name: 'محمد حسینی',
    role: 'مدیر مالی (CFO)',
    bio: 'کارشناس ارشد حسابداری با تجربه ۱۰ ساله در حوزه طلا و جواهر.',
  },
  {
    name: 'سارا کریمی',
    role: 'مدیر بازاریابی',
    bio: 'متخصص بازاریابی دیجیتال و توسعه کسب‌وکار. تجربه در صنعت فین‌تک.',
  },
];

const milestones = [
  { year: '۱۳۹۹', event: 'تأسیس زرین گلد و راه‌اندازی نسخه اول پلتفرم' },
  { year: '۱۴۰۰', event: 'عبور از ۱۰,۰۰۰ کاربر فعال و راه‌اندازی پس‌انداز خودکار' },
  { year: '۱۴۰۱', event: 'دریافت مجوز رسمی از سازمان بورس و اوراق بهادار' },
  { year: '۱۴۰۲', event: 'راه‌اندازی کارت طلایی، سیستم پاداش و بخش وی‌آی‌پی' },
  { year: '۱۴۰۳', event: 'عبور از ۱۰۰,۰۰۰ کاربر و راه‌اندازی درگاه پرداخت طلایی' },
  { year: '۱۴۰۴', event: 'گسترش همکاری با بانک‌ها و راه‌اندازی صندوق سرمایه‌گذاری طلا' },
];

export default function AboutPage({ onBack }: SubPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-gold/[0.06] to-transparent">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24">
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-gold"
          >
            <ArrowLeft className="size-4" />
            بازگشت به صفحه اصلی
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-bl from-gold-light via-gold to-gold-dark">
              <span className="text-2xl font-black text-gray-950">ز</span>
            </div>
            <h1 className="text-3xl font-black md:text-4xl">
              درباره <span className="gold-gradient-text">زرین گلد</span>
            </h1>
          </div>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            زرین گلد پلتفرم معاملات طلای نوین ایران است که با هدف دسترسی آسان، امن و شفاف
            همه مردم به بازار طلا تأسیس شده. ما با بهره‌گیری از فناوری‌های روز دنیا، تجربه‌ای
            مدرن و قابل اعتماد از خرید و فروش طلا ارائه می‌دهیم.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-4 -mt-8 md:grid-cols-4 md:gap-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border/50 bg-card p-4 text-center shadow-sm md:p-6"
            >
              <s.icon className="mx-auto mb-2 size-6 text-gold" />
              <p className="text-2xl font-black text-foreground md:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mission */}
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="mb-6 text-2xl font-bold">مأموریت و چشم‌انداز</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gold/10 bg-gold/[0.03] p-6">
            <h3 className="mb-2 text-lg font-bold text-gold">🎯 مأموریت ما</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              دموکراتیزه کردن دسترسی به بازار طلا برای همه ایرانیان. ما معتقدیم هر کسی
              باید بتواند با هر مبلغی طلا بخرد، نگهداری کند و از رشد ارزش آن بهره‌مند شود.
              بدون نیاز به دانش تخصصی و بدون نگرانی از امنیت.
            </p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <h3 className="mb-2 text-lg font-bold">🚀 چشم‌انداز ما</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              تبدیل شدن به بزرگ‌ترین و معتمدترین پلتفرم معاملات طلای دیجیتال در خاورمیانه
              تا سال ۱۴۱۰. ارائه خدمات جامع مالی مبتنی بر طلا شامل پس‌انداز، وام، پرداخت
              و سرمایه‌گذاری.
            </p>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-bold">چرا زرین گلد؟</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="flex gap-4 rounded-xl bg-card p-5 border border-border/50">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                  <v.icon className="size-5 text-gold" />
                </div>
                <div>
                  <h3 className="mb-1 font-bold">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="mb-8 text-center text-2xl font-bold">تاریخچه مسیر ما</h2>
        <div className="relative space-y-6">
          <div className="absolute top-0 bottom-0 start-4 w-px bg-gradient-to-b from-gold/50 via-gold/20 to-transparent md:start-6" />
          {milestones.map((m) => (
            <div key={m.year} className="relative flex gap-6 ps-12 md:ps-16">
              <div className="absolute start-2.5 top-1 size-3 rounded-full border-2 border-gold bg-background md:start-4.5" />
              <div className="flex-1 rounded-xl border border-border/50 bg-card p-4">
                <span className="text-sm font-bold text-gold">{m.year}</span>
                <p className="mt-1 text-sm text-muted-foreground">{m.event}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-bold">تیم ما</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {team.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border/50 bg-card p-6 text-center">
                <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-gradient-to-bl from-gold/20 to-gold/[0.05]">
                  <span className="text-2xl font-black text-gold">{t.name.charAt(0)}</span>
                </div>
                <h3 className="font-bold">{t.name}</h3>
                <p className="text-xs font-medium text-gold">{t.role}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Licenses */}
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="mb-8 text-center text-2xl font-bold">مجوزها و گواهینامه‌ها</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: 'سازمان بورس', desc: 'دارای مجوز فعالیت رسمی' },
            { title: 'بیمه مرکزی', desc: 'بیمه سپرده تا سقف ۱ کیلوگرم طلا' },
            { title: 'استاندارد ISO 27001', desc: 'مدیریت امنیت اطلاعات' },
          ].map((l) => (
            <div key={l.title} className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
              <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-sm font-bold">{l.title}</p>
                <p className="text-xs text-muted-foreground">{l.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

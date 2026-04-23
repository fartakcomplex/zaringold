'use client';

import React from 'react';
import {
  Scale,
  ShieldCheck,
  FileText,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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
}

const sections: Section[] = [
  {
    id: 'general',
    title: 'ماده ۱ — تعاریف و مقررات کلی',
    icon: FileText,
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
    icon: ShieldCheck,
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
    icon: AlertTriangle,
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
    icon: ShieldCheck,
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
    icon: Scale,
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
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-gold/[0.06] to-transparent">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-24">
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-gold"
          >
            <ArrowLeft className="size-4" />
            بازگشت به صفحه اصلی
          </button>
          <h1 className="text-3xl font-black md:text-4xl">
            قوانین و <span className="gold-gradient-text">مقررات</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            آخرین بروزرسانی: اردیبهشت ۱۴۰۴ — با استفاده از خدمات زرین گلد،
            شما قوانین زیر را مطالعه کرده و می‌پذیرید.
          </p>
        </div>
      </div>

      {/* TOC */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-2xl border border-border/50 bg-card p-6 -mt-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-gold">فهرست مطالب</h2>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-gold/[0.06] hover:text-gold"
              >
                <s.icon className="size-3.5 shrink-0" />
                {s.title.replace(/^(ماده \d — )/, '')}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-10">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-gold/10">
                  <s.icon className="size-4 text-gold" />
                </div>
                <h2 className="text-lg font-bold">{s.title}</h2>
              </div>
              <ul className="space-y-3">
                {s.content.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                    <CheckCircle2 className="mt-1 size-3.5 shrink-0 text-gold/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

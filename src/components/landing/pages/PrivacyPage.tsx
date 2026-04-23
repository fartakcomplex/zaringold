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
} from 'lucide-react';

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
}

const sections: Section[] = [
  {
    title: 'اطلاعاتی که جمع‌آوری می‌کنیم',
    icon: Eye,
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
    icon: Lock,
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
    icon: Server,
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
    icon: ShieldCheck,
    items: [
      'اطلاعات شخصی بدون رضایت صریح کاربر به اشخاص ثالث فروخته یا اجاره نمی‌شود.',
      'اطلاعات ممکن است به صورت محدود به نهادهای زیر ارائه شود: بانک مرکزی، سازمان بورس، پلیس فتا و مراجع قضایی.',
      'ارائه‌دهندگان خدماتی: درگاه‌های بانکی، شرکت‌های بیمه و ارائه‌دهندگان SMS — فقط اطلاعات لازم برای ارائه خدمت.',
      'در صورت ادغام یا خرید شرکت، اطلاعات با رعایت قوانین به خریدار منتقل می‌شود.',
    ],
  },
  {
    title: 'حقوق کاربر',
    icon: Bell,
    items: [
      'حق دسترسی به تمام اطلاعات شخصی ذخیره‌شده.',
      'حق درخواست اصلاح یا به‌روزرسانی اطلاعات نادرست.',
      'حق درخواست حذف اطلاعات (موضوع به موارد استثنای قانونی).',
      'حقPORTABIL: دریافت کپی از اطلاعات شخصی در فرمت قابل خواندن.',
      'حق اعتراض به پردازش اطلاعات برای اهداف بازاریابی.',
      'حق شکایت به دادسرای جرایم رایانه‌ای در صورت تخلف.',
    ],
  },
];

export default function PrivacyPage({ onBack }: SubPageProps) {
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
            حریم <span className="gold-gradient-text">خصوصی</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            آخرین بروزرسانی: اردیبهشت ۱۴۰۴ — ما متعهد به حفاظت از اطلاعات شخصی
            شما هستیم. این صفحه نحوه جمع‌آوری، استفاده و محافظت از داده‌های شما را توضیح می‌دهد.
          </p>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="grid gap-3 -mt-4 sm:grid-cols-3">
          {[
            { title: 'رمزنگاری', desc: 'AES-256 + TLS 1.3' },
            { title: 'بدون فروش اطلاعات', desc: 'اطلاعات به اشخاص ثالث فروخته نمی‌شود' },
            { title: 'کنترل کاربر', desc: 'دسترسی، اصلاح و حذف داده‌ها' },
          ].map((b) => (
            <div key={b.title} className="flex items-center gap-2 rounded-xl border border-border/50 bg-card p-3 shadow-sm">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
              <div>
                <p className="text-xs font-bold">{b.title}</p>
                <p className="text-[11px] text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-10">
          {sections.map((s) => (
            <section key={s.title} className="rounded-2xl border border-border/50 bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-gold/10">
                  <s.icon className="size-4 text-gold" />
                </div>
                <h2 className="text-lg font-bold">{s.title}</h2>
              </div>
              <ul className="space-y-3">
                {s.items.map((item, i) => (
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

'use client';

import React from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  Instagram,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Contact Us Page                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface SubPageProps {
  onBack: () => void;
  onLogin: () => void;
}

const contactInfo = [
  {
    icon: Phone,
    title: 'تلفن تماس',
    lines: ['021-9100 1234', '021-9100 5678'],
    href: 'tel:02191001234',
    desc: 'شنبه تا پنج‌شنبه ۹ تا ۲۱',
  },
  {
    icon: Mail,
    title: 'ایمیل',
    lines: ['support@zarringold.ir', 'info@zarringold.ir'],
    href: 'mailto:support@zarringold.ir',
    desc: 'پاسخ‌گویی حداکثر ۲۴ ساعته',
  },
  {
    icon: MapPin,
    title: 'آدرس دفتر مرکزی',
    lines: ['تهران، خیابان ولیعصر', 'بالاتر از میدان ونک', 'پلاک ۱۲۳، طبقه ۵'],
    href: '#',
    desc: 'مراجعه با هماهنگی قبلی',
  },
  {
    icon: Clock,
    title: 'ساعات کاری',
    lines: ['شنبه تا پنج‌شنبه: ۹ تا ۲۱', 'جمعه: ۱۰ تا ۱۸', 'پشتیبانی آنلاین: ۲۴/۷'],
    href: '#',
    desc: 'معاملات آنلاین بدون محدودیت',
  },
];

const departments = [
  { name: 'پشتیبانی فنی', email: 'tech@zarringold.ir', response: 'کمتر از ۲ ساعت' },
  { name: 'مالی و حسابداری', email: 'finance@zarringold.ir', response: 'کمتر از ۴ ساعت' },
  { name: 'بازاریابی و همکاری', email: 'partner@zarringold.ir', response: 'کمتر از ۱ روز' },
  { name: 'امور حقوقی و مجوزها', email: 'legal@zarringold.ir', response: 'کمتر از ۲ روز' },
];

export default function ContactPage({ onBack, onLogin }: SubPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-gold/[0.06] to-transparent">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24">
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-gold"
          >
            <span className="text-lg">→</span>
            بازگشت به صفحه اصلی
          </button>
          <h1 className="text-3xl font-black md:text-4xl">
            تماس با <span className="gold-gradient-text">ما</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            تیم پشتیبانی زرین گلد همیشه آماده پاسخگویی به سؤالات شماست.
            از هر طریقی که راحت‌ترید با ما در ارتباط باشید.
          </p>
        </div>
      </div>

      {/* Contact Cards */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid gap-4 -mt-4 sm:grid-cols-2">
          {contactInfo.map((c) => (
            <div key={c.title} className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-gold/10">
                  <c.icon className="size-4 text-gold" />
                </div>
                <h3 className="font-bold">{c.title}</h3>
              </div>
              {c.lines.map((line, i) => (
                <a
                  key={i}
                  href={c.href}
                  className="block text-sm text-muted-foreground transition-colors hover:text-gold"
                  dir={i === 0 && c.title === 'تلفن تماس' ? 'ltr' : 'rtl'}
                >
                  {line}
                </a>
              ))}
              <p className="mt-2 text-[11px] text-muted-foreground/60">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2">
          {/* Form */}
          <div>
            <h2 className="mb-6 text-2xl font-bold">ارسال پیام</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">نام و نام خانوادگی</label>
                <Input placeholder="نام خود را وارد کنید" className="border-border bg-muted/30" dir="rtl" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">ایمیل</label>
                <Input type="email" placeholder="example@email.com" className="border-border bg-muted/30" dir="ltr" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">شماره تماس</label>
                <Input type="tel" placeholder="۰۹۱۲XXXXXXX" className="border-border bg-muted/30" dir="ltr" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">موضوع</label>
                <select className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" dir="rtl">
                  <option>پشتیبانی فنی</option>
                  <option>سؤال درباره معاملات</option>
                  <option>مشکلات حساب کاربری</option>
                  <option>پیشنهاد همکاری</option>
                  <option>سایر</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">متن پیام</label>
                <textarea
                  rows={5}
                  placeholder="پیام خود را بنویسید..."
                  className="w-full resize-none rounded-md border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
                  dir="rtl"
                />
              </div>
              <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90 font-semibold">
                ارسال پیام
              </Button>
            </div>
          </div>

          {/* Quick Access */}
          <div className="space-y-6">
            {/* Online Chat CTA */}
            <div className="rounded-2xl border border-gold/10 bg-gold/[0.04] p-6">
              <div className="mb-3 flex items-center gap-2">
                <MessageCircle className="size-5 text-gold" />
                <h3 className="font-bold">چت آنلاین</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                سریع‌ترین راه ارتباط با ما! تیم پشتیبانی آنلاین ما آماده پاسخگویی فوری
                به سؤالات شما درباره خرید، فروش و خدمات زرین گلد است.
              </p>
              <Button
                onClick={onLogin}
                variant="outline"
                className="gap-2 border-gold/30 text-gold hover:bg-gold/10"
              >
                <MessageCircle className="size-4" />
                ورود و شروع چت
              </Button>
            </div>

            {/* Social Media */}
            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <h3 className="mb-4 font-bold">ما را در شبکه‌های اجتماعی دنبال کنید</h3>
              <div className="space-y-3">
                {[
                  { icon: Instagram, name: 'اینستاگرام', handle: '@zarringold', color: 'text-pink-500', href: '#' },
                  { icon: Send, name: 'تلگرام', handle: '@zarringold_channel', color: 'text-blue-400', href: '#' },
                  { icon: MessageCircle, name: 'توییتر', handle: '@zarringold', color: 'text-sky-500', href: '#' },
                ].map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                      <s.icon className={`size-5 ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{s.handle}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* FAQ Link */}
            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <h3 className="mb-2 font-bold">پاسخ سؤالات متداول</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                قبل از ارسال پیام، شاید جواب سؤال شما در بخش سؤالات متداول موجود باشد.
              </p>
              <button
                onClick={onBack}
                className="text-sm font-medium text-gold hover:underline"
              >
                مشاهده سؤالات متداول ←
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Departments */}
      <div className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-bold">بخش‌های پاسخگویی</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {departments.map((d) => (
              <div key={d.name} className="flex items-center justify-between rounded-xl bg-card p-4 border border-border/50">
                <div>
                  <p className="font-bold text-sm">{d.name}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">{d.email}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-500">
                  <CheckCircle2 className="size-3" />
                  <span>{d.response}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

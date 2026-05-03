
import React from 'react';
import {Phone, Mail, MapPin, Clock, MessageCircle, Send, Camera, CheckCircle2, ArrowLeft, Sparkles, Headphones, ExternalLink, Globe, ChevronLeft} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {motion} from '@/lib/framer-compat';
import {cn} from '@/lib/utils';
import {useTranslation} from '@/lib/i18n';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Contact Us Page                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface SubPageProps {
  onBack: () => void;
  onLogin: () => void;
}

/* ── Localized contact info data ── */

const contactInfoFa = [
  {
    icon: Phone,
    title: 'تلفن تماس',
    lines: ['021-9100 1234', '021-9100 5678'],
    href: 'tel:02191001234',
    desc: 'شنبه تا پنج‌شنبه ۹ تا ۲۱',
    gradient: 'from-emerald-500 to-emerald-400',
    glowColor: 'shadow-emerald-500/20',
    isPhone: true,
  },
  {
    icon: Mail,
    title: 'ایمیل',
    lines: ['support@zarringold.ir', 'info@zarringold.ir'],
    href: 'mailto:support@zarringold.ir',
    desc: 'پاسخ‌گویی حداکثر ۲۴ ساعته',
    gradient: 'from-sky-500 to-sky-400',
    glowColor: 'shadow-sky-500/20',
    isPhone: false,
  },
  {
    icon: MapPin,
    title: 'آدرس دفتر مرکزی',
    lines: ['تهران، خیابان ولیعصر', 'بالاتر از میدان ونک', 'پلاک ۱۲۳، طبقه ۵'],
    href: '#',
    desc: 'مراجعه با هماهنگی قبلی',
    gradient: 'from-rose-500 to-rose-400',
    glowColor: 'shadow-rose-500/20',
    isPhone: false,
  },
  {
    icon: Clock,
    title: 'ساعات کاری',
    lines: ['شنبه تا پنج‌شنبه: ۹ تا ۲۱', 'جمعه: ۱۰ تا ۱۸', 'پشتیبانی آنلاین: ۲۴/۷'],
    href: '#',
    desc: 'معاملات آنلاین بدون محدودیت',
    gradient: 'from-violet-500 to-violet-400',
    glowColor: 'shadow-violet-500/20',
    isPhone: false,
  },
];

const contactInfoEn = [
  {
    icon: Phone,
    title: 'Phone',
    lines: ['021-9100 1234', '021-9100 5678'],
    href: 'tel:02191001234',
    desc: 'Sat - Wed: 9 AM - 9 PM',
    gradient: 'from-emerald-500 to-emerald-400',
    glowColor: 'shadow-emerald-500/20',
    isPhone: true,
  },
  {
    icon: Mail,
    title: 'Email',
    lines: ['support@zarringold.ir', 'info@zarringold.ir'],
    href: 'mailto:support@zarringold.ir',
    desc: 'Response within 24 hours',
    gradient: 'from-sky-500 to-sky-400',
    glowColor: 'shadow-sky-500/20',
    isPhone: false,
  },
  {
    icon: MapPin,
    title: 'Head Office Address',
    lines: ['Tehran, Valiasr St.', 'Above Vanak Square', 'No. 123, 5th Floor'],
    href: '#',
    desc: 'Visit by appointment only',
    gradient: 'from-rose-500 to-rose-400',
    glowColor: 'shadow-rose-500/20',
    isPhone: false,
  },
  {
    icon: Clock,
    title: 'Working Hours',
    lines: ['Sat - Wed: 9 AM - 9 PM', 'Thu: 10 AM - 6 PM', 'Online Support: 24/7'],
    href: '#',
    desc: 'Online trading with no limits',
    gradient: 'from-violet-500 to-violet-400',
    glowColor: 'shadow-violet-500/20',
    isPhone: false,
  },
];

/* ── Localized departments data ── */

const departmentsFa = [
  { name: 'پشتیبانی فنی', email: 'tech@zarringold.ir', response: 'کمتر از ۲ ساعت', icon: Headphones },
  { name: 'مالی و حسابداری', email: 'finance@zarringold.ir', response: 'کمتر از ۴ ساعت', icon: Globe },
  { name: 'بازاریابی و همکاری', email: 'partner@zarringold.ir', response: 'کمتر از ۱ روز', icon: Send },
  { name: 'امور حقوقی و مجوزها', email: 'legal@zarringold.ir', response: 'کمتر از ۲ روز', icon: CheckCircle2 },
];

const departmentsEn = [
  { name: 'Technical Support', email: 'tech@zarringold.ir', response: 'Under 2 hours', icon: Headphones },
  { name: 'Finance & Accounting', email: 'finance@zarringold.ir', response: 'Under 4 hours', icon: Globe },
  { name: 'Marketing & Partnerships', email: 'partner@zarringold.ir', response: 'Under 1 day', icon: Send },
  { name: 'Legal & Licensing', email: 'legal@zarringold.ir', response: 'Under 2 days', icon: CheckCircle2 },
];

/* ── Localized social links data ── */

const socialLinksFa = [
  { icon: Camera, name: 'اینستاگرام', handle: '@zarringold', color: 'from-pink-500 to-purple-500', textColor: 'text-pink-500', href: '#', followers: '۴۵K' },
  { icon: Send, name: 'تلگرام', handle: '@zarringold_channel', color: 'from-sky-400 to-blue-500', textColor: 'text-sky-400', href: '#', followers: '۸۰K' },
  { icon: Globe, name: 'توییتر', handle: '@zarringold', color: 'from-gray-700 to-gray-900', textColor: 'text-gray-800 dark:text-gray-200', href: '#', followers: '۱۲K' },
];

const socialLinksEn = [
  { icon: Camera, name: 'Camera', handle: '@zarringold', color: 'from-pink-500 to-purple-500', textColor: 'text-pink-500', href: '#', followers: '45K' },
  { icon: Send, name: 'Telegram', handle: '@zarringold_channel', color: 'from-sky-400 to-blue-500', textColor: 'text-sky-400', href: '#', followers: '80K' },
  { icon: Globe, name: 'MessageSquare/X', handle: '@zarringold', color: 'from-gray-700 to-gray-900', textColor: 'text-gray-800 dark:text-gray-200', href: '#', followers: '12K' },
];

export default function ContactPage({ onBack, onLogin }: SubPageProps) {
  const { locale, dir } = useTranslation();

  const contactInfoData = locale === 'en' ? contactInfoEn : contactInfoFa;
  const departmentsData = locale === 'en' ? departmentsEn : departmentsFa;
  const socialLinksData = locale === 'en' ? socialLinksEn : socialLinksFa;

  const isRTL = locale === 'fa';

  /* ── Localized strings ── */
  const strings = isRTL
    ? {
        backToHome: 'بازگشت به صفحه اصلی',
        titleLine1: 'تماس با ',
        titleHighlight: 'ما',
        subtitle: 'تیم پشتیبانی زرین گلد همیشه آماده پاسخگویی به سؤالات شماست.\n            از هر طریقی که راحت‌ترید با ما در ارتباط باشید.',
        formTitle: 'ارسال پیام',
        nameLabel: 'نام و نام خانوادگی',
        namePlaceholder: 'نام خود را وارد کنید',
        emailLabel: 'ایمیل',
        phoneLabel: 'شماره تماس',
        phonePlaceholder: '۰۹۱۲XXXXXXX',
        subjectLabel: 'موضوع',
        subjectOptions: ['پشتیبانی فنی', 'سؤال درباره معاملات', 'مشکلات حساب کاربری', 'پیشنهاد همکاری', 'سایر'],
        messageLabel: 'متن پیام',
        messagePlaceholder: 'پیام خود را بنویسید...',
        submitBtn: 'ارسال پیام',
        chatTitle: 'چت آنلاین',
        chatDesc: 'سریع‌ترین راه ارتباط با ما! تیم پشتیبانی آنلاین ما آماده پاسخگویی فوری\n                  به سؤالات شما درباره خرید، فروش و خدمات زرین گلد است.',
        chatBtn: 'ورود و شروع چت',
        socialTitle: 'ما را در شبکه‌های اجتماعی دنبال کنید',
        faqTitle: 'پاسخ سؤالات متداول',
        faqDesc: 'قبل از ارسال پیام، شاید جواب سؤال شما در بخش سؤالات متداول موجود باشد.',
        faqBtn: 'مشاهده سؤالات متداول',
        quickResponse: 'پاسخگویی سریع',
        departmentsTitle: 'بخش‌های پاسخگویی',
      }
    : {
        backToHome: 'Back to Home',
        titleLine1: 'Contact ',
        titleHighlight: 'Us',
        subtitle: 'The Zarrin Gold support team is always ready to answer your questions.\n            Reach out to us through whichever channel you prefer.',
        formTitle: 'Send Message',
        nameLabel: 'Full Name',
        namePlaceholder: 'Enter your name',
        emailLabel: 'Email',
        phoneLabel: 'Phone Number',
        phonePlaceholder: '0912XXXXXXX',
        subjectLabel: 'Subject',
        subjectOptions: ['Technical Support', 'Question About Trades', 'Account Issues', 'Partnership Proposal', 'Other'],
        messageLabel: 'Message',
        messagePlaceholder: 'Write your message...',
        submitBtn: 'Send Message',
        chatTitle: 'Online Chat',
        chatDesc: 'The fastest way to reach us! Our online support team is ready to respond instantly\n                  to your questions about buying, selling, and Zarrin Gold services.',
        chatBtn: 'Login & Start Chat',
        socialTitle: 'Follow Us on Social Media',
        faqTitle: 'Frequently Asked Questions',
        faqDesc: 'Before sending a message, you might find the answer to your question in our FAQ section.',
        faqBtn: 'View FAQs',
        quickResponse: 'Quick Response',
        departmentsTitle: 'Support Departments',
      };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Enhanced Header ── */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.08] via-gold/[0.03] to-transparent" />
        <div className="absolute top-0 left-1/4 w-[400px] h-[200px] bg-gradient-to-b from-emerald-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-10 right-1/4 w-[300px] h-[150px] bg-gradient-to-b from-gold/8 to-transparent rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24">
          <motion.button
            onClick={onBack}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-gold group"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:translate-x-1" />
            {strings.backToHome}
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="text-3xl font-black md:text-5xl gold-text-shadow">
              {strings.titleLine1}<span className="gold-gradient-text">{strings.titleHighlight}</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground whitespace-pre-line"
          >
            {strings.subtitle}
          </motion.p>
        </div>
      </div>

      {/* ── Contact Info Cards ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid gap-4 -mt-6 sm:grid-cols-2">
          {contactInfoData.map((c, idx) => (
            <motion.a
              key={c.title}
              href={c.href}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + idx * 0.08 }}
              className={cn(
                'group relative overflow-hidden rounded-2xl p-5 border transition-all hover-lift-md',
                'bg-white/60 backdrop-blur-xl border-white/50',
                'dark:bg-gold/[0.02] dark:border-gold/10',
                'card-spotlight'
              )}
            >
              {/* Top accent line */}
              <div className={cn('absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100', c.gradient)} />
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  'flex size-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform group-hover:scale-110',
                  c.gradient, c.glowColor
                )}>
                  <c.icon className="size-5" />
                </div>
                <h3 className="font-bold text-base">{c.title}</h3>
              </div>
              <div className="space-y-0.5">
                {c.lines.map((line, i) => (
                  <span
                    key={i}
                    className="block text-sm text-muted-foreground transition-colors group-hover:text-foreground/80"
                    dir={(c.isPhone && i === 0) ? 'ltr' : dir}
                  >
                    {line}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground/70">{c.desc}</p>
            </motion.a>
          ))}
        </div>
      </div>

      {/* ── Contact Form & Quick Access ── */}
      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="absolute inset-0 radial-gold-fade opacity-20 pointer-events-none" />

        <div className="relative grid gap-10 md:grid-cols-2">
          {/* ── Enhanced Form ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-dark text-white shadow-lg shadow-gold/20">
                <Send className="size-4" />
              </div>
              <h2 className="text-xl font-bold">{strings.formTitle}</h2>
            </div>

            <div className={cn(
              'rounded-2xl p-6 border',
              'bg-white/60 backdrop-blur-xl border-white/50',
              'dark:bg-gold/[0.02] dark:border-gold/10'
            )}>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{strings.nameLabel}</label>
                  <Input
                    placeholder={strings.namePlaceholder}
                    className="input-gold-focus border-border/50 bg-white/50 backdrop-blur-sm rounded-xl h-11"
                    dir={dir}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{strings.emailLabel}</label>
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    className="input-gold-focus border-border/50 bg-white/50 backdrop-blur-sm rounded-xl h-11"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{strings.phoneLabel}</label>
                  <Input
                    type="tel"
                    placeholder={strings.phonePlaceholder}
                    className="input-gold-focus border-border/50 bg-white/50 backdrop-blur-sm rounded-xl h-11"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{strings.subjectLabel}</label>
                  <select
                    className="input-gold-focus w-full rounded-xl border border-border/50 bg-white/50 backdrop-blur-sm px-4 py-2.5 text-sm focus:outline-none"
                    dir={dir}
                  >
                    {strings.subjectOptions.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{strings.messageLabel}</label>
                  <textarea
                    rows={5}
                    placeholder={strings.messagePlaceholder}
                    className="input-gold-focus w-full resize-none rounded-xl border border-border/50 bg-white/50 backdrop-blur-sm px-4 py-3 text-sm focus:outline-none"
                    dir={dir}
                  />
                </div>
                <Button className="w-full bg-gradient-to-l from-gold-dark to-gold text-gold-foreground hover:from-gold hover:to-gold-light font-semibold h-11 rounded-xl shadow-lg shadow-gold/20 transition-all hover:shadow-gold/30 btn-gold-shine">
                  <span>{strings.submitBtn}</span>
                  <Send className={cn('size-4', isRTL ? 'mr-2' : 'ml-2')} />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* ── Quick Access Column ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Online Chat CTA */}
            <div className={cn(
              'group relative overflow-hidden rounded-2xl p-6 border',
              'shimmer-border bg-gradient-to-br from-gold/[0.08] to-gold/[0.02]',
              'dark:from-gold/[0.06] dark:to-gold/[0.01]',
              'card-spotlight hover-lift-md'
            )}>
              <div className="absolute -top-8 -right-8 size-24 bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-2xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/20">
                    <MessageCircle className="size-5" />
                    <span className="absolute -top-1 -right-1 flex size-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
                    </span>
                  </div>
                  <h3 className="font-bold text-base">{strings.chatTitle}</h3>
                </div>
                <p className="mb-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {strings.chatDesc}
                </p>
                <Button
                  onClick={onLogin}
                  className="w-full gap-2 bg-gradient-to-l from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  <MessageCircle className="size-4" />
                  {strings.chatBtn}
                </Button>
              </div>
            </div>

            {/* Social Media */}
            <div className={cn(
              'rounded-2xl p-6 border',
              'bg-white/60 backdrop-blur-xl border-white/50',
              'dark:bg-gold/[0.02] dark:border-gold/10'
            )}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="size-4 text-gold" />
                <h3 className="font-bold">{strings.socialTitle}</h3>
              </div>
              <div className="space-y-3">
                {socialLinksData.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl p-3 border border-transparent transition-all',
                      'hover:bg-white/80 hover:border-white/60 hover:shadow-sm',
                      'dark:hover:bg-gold/[0.04] dark:hover:border-gold/10'
                    )}
                  >
                    <div className={cn(
                      'flex size-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform group-hover:scale-110',
                      s.color
                    )}>
                      <s.icon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground truncate" dir="ltr">{s.handle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{s.followers}</span>
                      <ExternalLink className="size-3 text-muted-foreground/50" />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* FAQ Link */}
            <div className={cn(
              'group rounded-2xl p-6 border transition-all hover-lift-sm',
              'bg-white/60 backdrop-blur-xl border-white/50',
              'dark:bg-gold/[0.02] dark:border-gold/10',
              'card-spotlight'
            )}>
              <h3 className="mb-2 font-bold">{strings.faqTitle}</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                {strings.faqDesc}
              </p>
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:underline group-hover:gap-2 transition-all"
              >
                {strings.faqBtn}
                <ChevronLeft className="size-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Departments ── */}
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
              <Headphones className="size-3.5" />
              {strings.quickResponse}
            </span>
            <h2 className="mt-4 text-2xl font-bold md:text-3xl gold-text-shadow">{strings.departmentsTitle}</h2>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {departmentsData.map((d, idx) => (
              <motion.div
                key={d.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className={cn(
                  'group flex items-center justify-between rounded-2xl p-5 border transition-all hover-lift-sm',
                  'bg-white/60 backdrop-blur-xl border-white/50',
                  'dark:bg-gold/[0.02] dark:border-gold/10',
                  'card-spotlight'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-gold/10 text-gold transition-transform group-hover:scale-110">
                    <d.icon className="size-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{d.name}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{d.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="size-3" />
                  <span>{d.response}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

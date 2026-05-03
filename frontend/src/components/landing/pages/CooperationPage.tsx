
import {useState} from 'react';
import {ArrowRight, Handshake, Code, Megaphone, TrendingUp, ShieldCheck, Zap, Users, Award, HeadphonesIcon, Globe, Send, Building2} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Separator} from '@/components/ui/separator';
import {useTranslation} from '@/lib/i18n';
import {useAppStore} from '@/lib/store';
import {useCMSPage} from '@/hooks/useCMSPage';
import RenderHTML from '@/components/shared/RenderHTML';

/* ------------------------------------------------------------------ */
/*  Default Data                                                       */
/* ------------------------------------------------------------------ */

const DEFAULT_INTRO_TITLE = 'همکاری با زرین گلد';
const DEFAULT_INTRO_DESC = 'زرین گلد با گشودن درهای همکاری، فرصتی ویژه برای شرکت‌ها، صرافی‌ها، توسعه‌دهندگان و بازاریابان فراهم آورده است. با ما همراه شوید و از مزایای ویژه بهره‌مند شوید.';

const DEFAULT_COOPERATION_TYPES = [
  {
    icon: Building2,
    title: 'نمایندگی فروش',
    description: 'با دریافت نمایندگی رسمی زرین گلد، خدمات خرید و فروش طلای دیجیتال را در شهر و منطقه خود ارائه دهید. از تخفیف‌های ویژه نمایندگان و پشتیبانی اختصاصی بهره‌مند شوید.',
    benefits: ['کمیسیون فروش تا ۲٪', 'پشتیبانی اختصاصی', 'آموزش رایگان تیم فروش', 'پنل مدیریت اختصاصی'],
  },
  {
    icon: Code,
    title: 'API همکاری',
    description: 'با استفاده از API زرین گلد، خدمات طلای دیجیتال را در پلتفرم یا اپلیکیشن خود ادغام کنید. مناسب برای صرافی‌ها، کیف پول‌ها و اپلیکیشن‌های مالی.',
    benefits: ['API RESTful امن', 'مستندات کامل', 'محیط تست (Sandbox)', 'پشتیبانی فنی ۲۴/۷'],
  },
  {
    icon: Megaphone,
    title: 'بازاریابی همکاری در فروش',
    description: 'با تولید محتوا و معرفی زرین گلد به مخاطبان خود، کسب درآمد کنید. سیستم بازاریابی پورسانتی با بالاترین نرخ پرداخت در صنعت.',
    benefits: ['پورسانت تا ۳۰٪', 'پرداخت ماهانه', 'داشبورد تحلیلی', 'لینک‌های اختصاصی'],
  },
  {
    icon: TrendingUp,
    title: 'سرمایه‌گذاری سازمانی',
    description: 'خدمات ویژه برای شرکت‌ها و سازمان‌ها جهت مدیریت دارایی‌های طلایی. از صندوق‌های طلایی اختصاصی تا مشاوره سرمایه‌گذاری حرفه‌ای.',
    benefits: ['نرخ کارمزد ویژه', 'مشاوره اختصاصی', 'گزارش‌دهی پیشرفته', 'مدیریت چند حساب'],
  },
];

const DEFAULT_BENEFITS = [
  { icon: ShieldCheck, title: 'پشتیبانی اختصاصی', desc: 'تیم پشتیبانی اختصاصی برای همکاران تجاری' },
  { icon: Zap, title: 'سرعت عمل بالا', desc: 'پاسخگویی و پیگیری سریع درخواست‌ها' },
  { icon: Users, title: 'شبکه گسترده', desc: 'ارتباط با بیش از ۱۰۰ هزار کاربر فعال' },
  { icon: Award, title: 'برند معتبر', desc: 'همکاری با برند شناخته‌شده و مورد اعتماد' },
  { icon: HeadphonesIcon, title: 'آموزش رایگان', desc: 'دسترسی به منابع آموزشی و وبینارها' },
  { icon: Globe, title: 'رشد مشترک', desc: 'فرصت رشد و توسعه کسب‌وکار با ما' },
];

const stats = [
  { value: '۵۰+', label: 'نماینده فعال' },
  { value: '۲۰+', label: 'همکار API' },
  { value: '۱۰۰+', label: 'بازاریاب فعال' },
  { value: '۳۰+', label: 'سرمایه‌گذار سازمانی' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CooperationPage() {
  const { content: cmsContent, loading: cmsLoading } = useCMSPage('cooperation');
  const { t } = useTranslation();
  const setLandingPage = useAppStore((s) => s.setLandingPage);
  const [formData, setFormData] = useState({ company: '', name: '', phone: '', email: '', message: '' });

  const handleBack = () => {
    setLandingPage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  if (cmsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  // Merge CMS content with defaults
  const introTitle = (cmsContent.intro_title as string) || DEFAULT_INTRO_TITLE;
  const introDesc = (cmsContent.intro_desc as string) || DEFAULT_INTRO_DESC;

  const cmsTypes = cmsContent.types as Array<{ title: string; desc: string }> | undefined;
  const cooperationTypes = cmsTypes?.length
    ? DEFAULT_COOPERATION_TYPES.map((item, i) => ({
        ...item,
        title: cmsTypes[i]?.title || item.title,
        description: cmsTypes[i]?.desc || item.description,
      }))
    : DEFAULT_COOPERATION_TYPES;

  const cmsBenefits = cmsContent.benefits as Array<{ title: string; desc: string }> | undefined;
  const benefits = cmsBenefits?.length
    ? DEFAULT_BENEFITS.map((item, i) => ({
        ...item,
        title: cmsBenefits[i]?.title || item.title,
        desc: cmsBenefits[i]?.desc || item.desc,
      }))
    : DEFAULT_BENEFITS;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/5 px-4 py-2 text-sm font-medium text-gold transition-colors duration-200 hover:bg-gold/10"
          >
            <ArrowRight className="h-4 w-4" />
            {t('common.back')}
          </button>
          <h1 className="text-lg font-bold">همکاری با ما</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        {/* Hero */}
        <section className="mb-12 text-center">
          <Badge variant="outline" className="mb-4 border-gold/30 bg-gold/10 text-gold">
            <Handshake className="ml-1.5 h-3.5 w-3.5" />
            همکاری تجاری
          </Badge>
          <h2 className="mb-4 text-3xl font-extrabold sm:text-4xl">
            <span className="gold-gradient-text">{introTitle}</span>
          </h2>
          <RenderHTML html={introDesc} className="mx-auto max-w-2xl leading-relaxed text-muted-foreground" />
        </section>

        {/* Cooperation Types */}
        <section className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {cooperationTypes.map((item, i) => (
            <Card key={i} className="glass-card group h-full border-border/60 transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5">
              <CardHeader className="pb-3">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold/15 to-gold/5 transition-all duration-300 group-hover:scale-110">
                    <item.icon className="h-6 w-6 text-gold" />
                  </div>
                  <CardTitle className="text-base font-bold">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <RenderHTML html={item.description} className="mb-4 text-sm leading-relaxed text-muted-foreground" />
                <div className="space-y-2">
                  {item.benefits.map((benefit, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm">
                      <span className="size-1.5 shrink-0 rounded-full bg-gold/60" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Separator className="my-10 bg-border/60" />

        {/* Benefits Grid */}
        <section className="mb-12">
          <h3 className="mb-6 text-center text-xl font-bold">مزایای همکاری با ما</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {benefits.map((item, i) => (
              <Card key={i} className="glass-card group border-border/60 text-center transition-all duration-300 hover:border-gold/30">
                <CardContent className="p-5">
                  <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-gold/15 to-gold/5 transition-all duration-300 group-hover:scale-110">
                    <item.icon className="h-5 w-5 text-gold" />
                  </div>
                  <h4 className="mb-1 text-sm font-bold">{item.title}</h4>
                  <RenderHTML html={item.desc} className="text-xs text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="my-10 bg-border/60" />

        {/* CTA Form */}
        <section className="mb-12">
          <Card className="glass-card border-border/60">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold">فرم درخواست همکاری</CardTitle>
              <p className="text-sm text-muted-foreground">
                فرم زیر را تکمیل کنید تا کارشناسان ما در اسرع وقت با شما تماس بگیرند.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">نام شرکت / کسب‌وکار</label>
                    <Input
                      placeholder="نام شرکت خود را وارد کنید"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="border-border/60 bg-card focus:border-gold/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">نام و نام خانوادگی مسؤول</label>
                    <Input
                      placeholder="نام مسؤول تماس"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="border-border/60 bg-card focus:border-gold/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">شماره تماس</label>
                    <Input
                      placeholder="۰۹۱۲XXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="border-border/60 bg-card focus:border-gold/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">ایمیل</label>
                    <Input
                      type="email"
                      placeholder="example@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="border-border/60 bg-card focus:border-gold/50"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">توضیحات</label>
                  <Textarea
                    placeholder="نوع همکاری مورد نظر و توضیحات تکمیلی..."
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="border-border/60 bg-card focus:border-gold/50"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gold text-black hover:bg-gold/90 sm:w-auto"
                >
                  <Send className="ml-2 h-4 w-4" />
                  ارسال درخواست
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-10 bg-border/60" />

        {/* Stats */}
        <section className="mb-8">
          <h3 className="mb-6 text-center text-xl font-bold">در یک نگاه</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat, i) => (
              <Card key={i} className="card-glass border-border/60 text-center transition-all duration-300 hover:border-gold/30">
                <CardContent className="p-5">
                  <div className="mb-1 text-2xl font-extrabold text-gold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

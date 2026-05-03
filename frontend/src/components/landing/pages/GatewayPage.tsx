
import {useState} from 'react';
import {ArrowRight, Zap, Percent, ShieldCheck, Code, Headphones, Globe, ChevronDown, Key, Check, Store, Users, Lock, Send, Download, Package} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Separator} from '@/components/ui/separator';
import {useAppStore} from '@/lib/store';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const heroStats = [
  { value: '۱٪', label: 'کارمزد فقط' },
  { value: 'آنلاین', label: 'پرداخت آنی' },
  { value: 'تضمین‌شده', label: 'امنیت بالا' },
];

const steps = [
  { icon: Users, title: 'ثبت‌نام پذیرنده', desc: 'ثبت‌نام رایگان و دریافت کلیدهای API' },
  { icon: Code, title: 'نصب درگاه', desc: 'ادغام کد درگاه در سایت شما با چند خط کد' },
  { icon: Send, title: 'پرداخت مشتری', desc: 'مشتری از کیف پول طلایی خود پرداخت می‌کند' },
  { icon: Check, title: 'دریافت طلا', desc: 'طلا فوراً به کیف پول شما واریز می‌شود' },
];

const features = [
  { icon: Zap, title: 'پرداخت آنی', desc: 'بدون انتظار، پرداخت در لحظه انجام می‌شود' },
  { icon: Percent, title: 'کارمزد پایین', desc: 'فقط ۱٪ کارمزد برای هر تراکنش' },
  { icon: Globe, title: 'وب‌هوک خودکار', desc: 'اعلان خودکار وضعیت پرداخت به سایت شما' },
  { icon: ShieldCheck, title: 'تضمین امنیت', desc: 'رمزنگاری پیشرفته و احراز هویت دو مرحله‌ای' },
  { icon: Code, title: 'API ساده', desc: 'مستندات کامل و API ساده برای ادغام' },
  { icon: Headphones, title: 'پشتیبانی ۲۴/۷', desc: 'تیم پشتیبانی فنی همیشه در دسترس' },
];

const codeExample = `<script src="https://sdk.zarringold.ir/v1.js"></script>
<script>
  ZarrinGold.createPayment({
    apiKey: "YOUR_API_KEY",
    amount: 0.15, // گرم طلا
    callbackUrl: "https://yoursite.com/callback",
    onSuccess: (ref) => console.log("پرداخت موفق:", ref),
    onError: (err) => console.log("خطا:", err)
  });
</script>`;

const faqItems = [
  {
    q: 'درگاه پرداخت طلایی چیست؟',
    a: 'درگاه پرداخت طلایی زرین گلد به فروشندگان و صاحبان کسب‌وکار اجازه می‌دهد تا مشتریانشان بتوانند با موجودی طلایی کیف پول خود پرداخت کنند. به جای دریافت پول، طلا مستقیماً به کیف پول شما واریز می‌شود.',
  },
  {
    q: 'چطور می‌توانم ثبت‌نام کنم؟',
    a: 'ثبت‌نام کاملاً رایگان است. کافیست با شماره موبایل ثبت‌نام کنید، اطلاعات کسب‌وکارتان را وارد کنید و پس از تأیید، کلیدهای API را دریافت کنید.',
  },
  {
    q: 'کارمزد چقدر است؟',
    a: 'کارمزد هر تراکنش موفق فقط ۱٪ است. هیچ هزینه ثبت‌نام، ماهانه یا پنهانی وجود ندارد. اگر پرداخت ناموفق باشد، هیچ کارمزدی کسر نمی‌شود.',
  },
  {
    q: 'آیا پرداخت ناموفق کارمزد دارد؟',
    a: 'خیر، فقط پرداخت‌های موفق شامل ۱٪ کارمزد می‌شوند. پرداخت‌های ناموفق، لغو شده یا منقضی شده هیچ کارمزدی ندارند.',
  },
  {
    q: 'آیا پلاگین وردپرس/ووکامرس وجود دارد؟',
    a: 'بله! ما یک پلاگین رسمی وردپرس برای ووکامرس ارائه می‌دهیم. فقط کافیست پلاگین را نصب کنید، کلید API خود را وارد کنید و درگاه پرداخت طلایی به‌صورت خودکار به صفحه تسویه‌حساب اضافه می‌شود. نیازی به نوشتن هیچ کدی نیست!',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function GatewayPage() {
  const setLandingPage = useAppStore((s) => s.setLandingPage);
  const setPage = useAppStore((s) => s.setPage);
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleBack = () => {
    setLandingPage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeExample).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleGetStarted = () => {
    setLandingPage(null);
    setPage('merchant-panel');
  };

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
            بازگشت
          </button>
          <h1 className="text-lg font-bold">درگاه پرداخت طلایی</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        {/* ── Hero Section ── */}
        <section className="mb-12 text-center">
          <Badge variant="outline" className="mb-4 border-gold/30 bg-gold/10 text-gold">
            <Key className="ml-1.5 h-3.5 w-3.5" />
            API Gateway
          </Badge>
          <h2 className="mb-4 text-3xl font-extrabold sm:text-4xl">
            <span className="gold-gradient-text">درگاه پرداخت طلایی زرین گلد</span>
          </h2>
          <p className="mx-auto max-w-2xl leading-relaxed text-muted-foreground">
            پرداخت با طلا به جای پول! فروشندگان و صاحبان کسب‌وکار می‌توانند درگاه پرداخت طلایی را در سایت خود نصب کنند و مشتریانشان با موجودی طلایی کیف پول زرین گلد پرداخت کنند.
          </p>

          {/* Stat boxes */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {heroStats.map((stat, i) => (
              <Card key={i} className="glass-card border-border/60 text-center transition-all duration-300 hover:border-gold/30">
                <CardContent className="p-5">
                  <div className="mb-1 text-2xl font-extrabold text-gold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="my-10 bg-border/60" />

        {/* ── How It Works Section ── */}
        <section className="mb-12">
          <h3 className="mb-8 text-center text-xl font-bold sm:text-2xl">
            <span className="gold-gradient-text">نحوه کار درگاه پرداخت</span>
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={i} className="group relative text-center">
                {/* Number circle */}
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-gold/20 to-gold/5 ring-1 ring-gold/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-gold/10">
                  <div className="flex size-12 items-center justify-center rounded-full bg-gold/10">
                    <step.icon className="h-5 w-5 text-gold" />
                  </div>
                </div>
                {/* Step number badge */}
                <div className="absolute -top-1 right-1/2 translate-x-[calc(50%+28px)] flex size-7 items-center justify-center rounded-full bg-gold text-xs font-bold text-gray-950">
                  {i + 1}
                </div>
                <h4 className="mb-2 text-base font-bold">{step.title}</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <Separator className="my-10 bg-border/60" />

        {/* ── Features Grid ── */}
        <section className="mb-12">
          <h3 className="mb-8 text-center text-xl font-bold sm:text-2xl">
            <span className="gold-gradient-text">ویژگی‌های درگاه پرداخت</span>
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, i) => (
              <Card
                key={i}
                className="glass-card group h-full border-border/60 transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5"
              >
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold/15 to-gold/5 transition-all duration-300 group-hover:scale-110">
                      <feat.icon className="h-5 w-5 text-gold" />
                    </div>
                    <h4 className="text-base font-bold">{feat.title}</h4>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feat.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="my-10 bg-border/60" />

        {/* ── Code Example Section ── */}
        <section className="mb-12">
          <h3 className="mb-8 text-center text-xl font-bold sm:text-2xl">
            <span className="gold-gradient-text">ادغام در چند خط کد</span>
          </h3>
          <Card className="glass-card border-border/60">
            <CardContent className="p-4 sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-gold" />
                  <span className="text-sm font-medium">JavaScript</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 rounded-lg bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold transition-colors duration-200 hover:bg-gold/20"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      کپی شد!
                    </>
                  ) : (
                    <>
                      <Globe className="h-3.5 w-3.5" />
                      کپی کد
                    </>
                  )}
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg bg-gray-950 p-4" dir="ltr">
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-green-400 sm:text-sm">
                  <code>{codeExample}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-10 bg-border/60" />

        {/* ── WordPress Plugin Section ── */}
        <section className="mb-12">
          <h3 className="mb-8 text-center text-xl font-bold sm:text-2xl">
            <span className="gold-gradient-text">پلاگین وردپرس / ووکامرس</span>
          </h3>
          <Card className="glass-card overflow-hidden border-border/60">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                {/* Plugin icon */}
                <div className="flex shrink-0 flex-col items-center gap-3">
                  <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#21759b] to-[#0e4f6e] shadow-lg">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="18" fill="#fff" fillOpacity="0.15" />
                      <path d="M20 8c-2.5 0-5 1-6.5 3-1.2 1.6-1.5 3.8-1 5.8.4 1.5 1.3 2.8 2.5 3.8l1.5 1.2c-.3.8-.5 1.6-.5 2.5 0 3.5 3 6.5 6.5 6.5s6.5-3 6.5-6.5c0-.9-.2-1.7-.5-2.5l1.5-1.2c1.2-1 2.1-2.3 2.5-3.8.5-2 .2-4.2-1-5.8C25 9 22.5 8 20 8z" fill="#fff" />
                    </svg>
                  </div>
                  <Badge variant="outline" className="border-[#21759b]/50 bg-[#21759b]/10 text-[#4db8d8]">
                    <Package className="ml-1.5 h-3.5 w-3.5" />
                    v1.0.0
                  </Badge>
                </div>
                {/* Description */}
                <div className="flex-1">
                  <h4 className="mb-2 text-lg font-bold">
                    پلاگین رسمی وردپرس برای ووکامرس
                  </h4>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    با نصب این پلاگین، درگاه پرداخت طلایی زرین گلد به‌صورت خودکار به صفحه تسویه‌حساب ووکامرس اضافه می‌شود.
                    بدون نیاز به دانش برنامه‌نویسی، فقط با وارد کردن کلید API پلاگین را راه‌اندازی کنید.
                  </p>
                  <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {[
                      'نصب آسان از بخش افزونه‌ها',
                      'تنظیمات کامل فارسی',
                      'پشتیبانی از وب‌هوک خودکار',
                      'تست اتصال یک‌کلیکه',
                      'گزارش تراکنش‌ها در پنل ادمین',
                      'پشتیبانی از حالت طلایی',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 shrink-0 text-gold" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = '/zarrin-gold-gateway/zarrin-gold-gateway.php';
                      link.download = 'zarrin-gold-gateway.zip';
                      link.click();
                    }}
                    className="rounded-xl bg-gradient-to-l from-[#21759b] to-[#0e4f6e] px-6 text-sm font-bold text-white shadow-lg shadow-[#21759b]/25 transition-all duration-300 hover:shadow-[#21759b]/40"
                  >
                    <Download className="ml-2 h-4 w-4" />
                    دانلود پلاگین وردپرس
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <Separator className="my-10 bg-border/60" />

        {/* ── Pricing Section ── */}
        <section className="mb-12">
          <Card className="glass-card overflow-hidden border-border/60">
            <div className="bg-gradient-to-l from-gold/10 via-gold/5 to-transparent p-6 sm:p-8">
              <div className="text-center">
                <Badge variant="outline" className="mb-3 border-gold/30 bg-gold/10 text-gold">
                  <Percent className="ml-1.5 h-3.5 w-3.5" />
                  کارمزد
                </Badge>
                <h3 className="mb-3 text-2xl font-extrabold sm:text-3xl">
                  <span className="gold-gradient-text">فقط ۱٪ کارمزد</span>
                </h3>
                <p className="mb-2 text-muted-foreground">برای هر تراکنش موفق</p>
                <div className="mx-auto my-6 max-w-md space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-gold" />
                    <span className="text-sm text-muted-foreground">بدون هزینه ثبت‌نام، بدون هزینه ماهانه</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-gold" />
                    <span className="text-sm text-muted-foreground">پرداخت ناموفق = بدون کارمزد</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-gold" />
                    <span className="text-sm text-muted-foreground">تسویه‌حساب روزانه خودکار</span>
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="h-12 min-w-[200px] rounded-xl bg-gradient-to-l from-gold-dark via-gold to-gold-light px-8 text-base font-bold text-gray-950 shadow-lg shadow-gold/25 transition-all duration-300 hover:shadow-gold/40"
                >
                  <Lock className="ml-2 h-4 w-4" />
                  شروع کنید — ثبت‌نام رایگان
                </Button>
              </div>
            </div>
          </Card>
        </section>

        <Separator className="my-10 bg-border/60" />

        {/* ── FAQ Section ── */}
        <section className="mb-12">
          <h3 className="mb-8 text-center text-xl font-bold sm:text-2xl">
            <span className="gold-gradient-text">سوالات متداول</span>
          </h3>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <Card key={i} className="glass-card border-border/60 transition-all duration-300 hover:border-gold/20">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-4 text-right"
                >
                  <span className="text-sm font-bold sm:text-base">{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="border-t border-border/40 px-4 pb-4 pt-3">
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* ── Footer CTA ── */}
        <section className="mb-8">
          <Card className="glass-card overflow-hidden border-border/60">
            <div className="bg-gradient-to-br from-gold/10 via-gold/5 to-transparent p-8 text-center sm:p-12">
              <h3 className="mb-3 text-2xl font-extrabold sm:text-3xl">
                <span className="gold-gradient-text">همین الان شروع کنید!</span>
              </h3>
              <p className="mx-auto mb-6 max-w-lg text-muted-foreground">
                ثبت‌نام رایگان و دریافت کلیدهای API در کمتر از ۵ دقیقه
              </p>
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="h-12 min-w-[200px] rounded-xl bg-gradient-to-l from-gold-dark via-gold to-gold-light px-8 text-base font-bold text-gray-950 shadow-lg shadow-gold/25 transition-all duration-300 hover:shadow-gold/40"
              >
                <Store className="ml-2 h-4 w-4" />
                ثبت‌نام رایگان
              </Button>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}

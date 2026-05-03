
import {useState, useMemo} from 'react';
import {ArrowRight, Search, User, CreditCard, Wallet, ShieldCheck, TrendingUp, Smartphone, HelpCircle, Percent, Lock, Building2} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {useTranslation} from '@/lib/i18n';
import {useAppStore} from '@/lib/store';
import {useCMSPage} from '@/hooks/useCMSPage';
import RenderHTML from '@/components/shared/RenderHTML';

/* ------------------------------------------------------------------ */
/*  Default Data                                                       */
/* ------------------------------------------------------------------ */

const faqCategories = [
  { key: 'all', label: 'همه' },
  { key: 'account', label: 'حساب کاربری' },
  { key: 'trading', label: 'معاملات' },
  { key: 'finance', label: 'مالی' },
  { key: 'security', label: 'امنیت' },
  { key: 'general', label: 'عمومی' },
];

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const DEFAULT_FAQ_ITEMS: FAQItem[] = [
  {
    id: 1,
    question: 'چطور می‌تونم در زرین گلد ثبت‌نام کنم؟',
    answer: 'ثبت‌نام در زرین گلد بسیار ساده است. کافیست وارد سایت یا اپلیکیشن شوید، شماره موبایل خود را وارد کنید و کد تأیید ارسال‌شده را وارد نمایید. پس از آن، اطلاعات هویتی خود را تکمیل و مراحل احراز هویت را طی کنید. فرآیند ثبت‌نام کمتر از ۳ دقیقه زمان می‌برد.',
    category: 'account',
  },
  {
    id: 2,
    question: 'احراز هویت (KYC) چیست و چرا لازم است؟',
    answer: 'احراز هویت فرآیندی است که طی آن، هویت شما به عنوان کاربر تأیید می‌شود. این فرآیند شامل ارائه تصویر کارت ملی و کارت بانکی است. احراز هویت بر اساس الزامات قانونی و مقررات بانک مرکزی برای مبارزه با پولشویی ضروری است و بدون تکمیل آن، امکان انجام معاملات وجود ندارد.',
    category: 'account',
  },
  {
    id: 3,
    question: 'چطور می‌تونم کیف پولم رو شارژ کنم؟',
    answer: 'واریز به کیف پول بسیار آسان است. پس از ورود به حساب کاربری، به بخش کیف پول مراجعه کنید و گزینه «واریز» را انتخاب نمایید. سپس مقدار دلخواه طلای خود را وارد کرده و از طریق درگاه پرداخت آنلاین یا انتقال مستقیم، موجودی طلایی خود را افزایش دهید.',
    category: 'finance',
  },
  {
    id: 4,
    question: 'حداقل و حداکثر مبلغ خرید طلا چقدر است؟',
    answer: 'حداقل مقدار خرید طلا ۰.۰۱۵ گرم طلا و حداقل فروش ۰.۰۱ گرم طلا می‌باشد. برای حساب‌های کاربری ساده (احراز‌شده اولیه)، حداکثر مقدار معاملات روزانه محدودیت مشخصی دارد. کاربران سطح طلایی و الماسی از سقف معاملات بالاتری برخوردارند.',
    category: 'trading',
  },
  {
    id: 5,
    question: 'کارمزد معاملات چقدر است؟',
    answer: 'کارمزد خرید طلا بسته به سطح کاربری بین ۰.۳٪ تا ۰.۵٪ متغیر است. کارمزد فروش نیز در همین بازه قرار دارد. کارمزد دقیق هر معامله پیش از تأیید نهایی به شما نمایش داده می‌شود. واریز و برداشت طلایی کاملاً رایگان است.',
    category: 'finance',
  },
  {
    id: 6,
    question: 'چطور می‌تونم موجودی طلایم رو به پول نقد تبدیل کنم؟',
    answer: 'برای فروش طلا، کافیست به بخش «فروش طلا» مراجعه کنید. مقدار طلای مورد نظر را وارد کنید تا ارزش آن محاسبه و نمایش داده شود. پس از تأیید، معادل طلایی فوراً به کیف پول طلایی شما واریز می‌شود و می‌توانید آن را برداشت نمایید.',
    category: 'trading',
  },
  {
    id: 7,
    question: 'آیا طلای من واقعی است و قابل تحویل است؟',
    answer: 'بله، معادل هر گرم طلای دیجیتال شما، طلای فیزیکی واقعی در صندوق‌های امن بانکی نگهداری می‌شود. شما می‌توانید در هر زمان درخواست تحویل فیزیکی طلای خود را ثبت کنید. برای مبالغ بالای ۵ گرم، امکان ارسال به آدرس شما وجود دارد.',
    category: 'trading',
  },
  {
    id: 8,
    question: 'امنیت حساب کاربری من چطور تضمین می‌شود؟',
    answer: 'زرین گلد از چندین لایه امنیتی استفاده می‌کند: رمزنگاری AES-256 برای داده‌ها، احراز هویت دو مرحله‌ای (2FA) برای ورود، محدودیت تلاش ورود، و مانیتورینگ ۲۴ ساعته حساب‌ها. پیشنهاد می‌کنیم حتماً 2FA را فعال کنید و رمز عبور قوی انتخاب نمایید.',
    category: 'security',
  },
  {
    id: 9,
    question: 'آیا اپلیکیشن موبایل زرین گلد وجود دارد؟',
    answer: 'بله، اپلیکیشن زرین گلد برای هر دو سیستم‌عامل اندروید و iOS در دسترس است. شما می‌توانید از طریق بخش «دانلود اپ» در سایت یا جستجو در مارکت‌ها، نسخه جدید را دانلود و نصب کنید. تمامی امکانات وب‌سایت در اپلیکیشن نیز در دسترس است.',
    category: 'general',
  },
  {
    id: 10,
    question: 'پس‌انداز طلایی چطور کار می‌کنه؟',
    answer: 'ویژگی پس‌انداز طلایی به شما اجازه می‌دهد خریدهای طلای منظم و خودکار داشته باشید. شما می‌توانید مبلغ و فاصله زمانی (هفتگی، ماهانه) را مشخص کنید و سیستم به صورت خودکار طلا خریداری می‌کند. همچنین می‌توانید اهداف پس‌انداز تعیین کنید و پیشرفت خود را مشاهده نمایید.',
    category: 'trading',
  },
  {
    id: 11,
    question: 'در صورت فراموشی رمز عبور چه کنم؟',
    answer: 'در صفحه ورود روی «فراموشی رمز عبور» کلیک کنید. شماره موبایل ثبت‌شده خود را وارد کنید تا کد بازیابی ارسال شود. پس از تأیید، می‌توانید رمز عبور جدید تنظیم نمایید. در صورت بروز مشکل، با پشتیبانی تماس بگیرید.',
    category: 'security',
  },
  {
    id: 12,
    question: 'برنامه دعوت از دوستان چطور کار می‌کنه؟',
    answer: 'از بخش «دعوت از دوستان»، لینک اختصاصی خود را به اشتراک بگذارید. هر شخصی که از طریق لینک شما ثبت‌نام و اولین خرید خود را انجام دهد، شما ۵۰۰ میلی‌گرم طلا پاداش دریافت می‌کنید. پاداش‌های بیشتر برای تعداد دعوت‌های بالاتر در نظر گرفته شده است.',
    category: 'general',
  },
  {
    id: 13,
    question: 'آیا می‌تونم بدون احراز هویت معامله کنم؟',
    answer: 'خیر، طبق قوانین بانک مرکزی و مبارزه با پولشویی، احراز هویت برای انجام معاملات الزامی است. بدون تکمیل فرآیند KYC، شما تنها می‌توانید قیمت‌ها را مشاهده کنید. احراز هویت معمولاً در کمتر از ۲۴ ساعت تأیید می‌شود.',
    category: 'account',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function FAQPage() {
  const { content: cmsContent, loading: cmsLoading } = useCMSPage('faq');
  const { t } = useTranslation();
  const setLandingPage = useAppStore((s) => s.setLandingPage);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleBack = () => {
    setLandingPage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Merge CMS content with defaults (before early return to satisfy rules-of-hooks)
  const intro = (cmsContent.intro as string) || 'پاسخ سوالات رایج درباره خدمات زرین گلد را اینجا پیدا کنید.';

  const cmsFaqs = cmsContent.faqs as Array<{ question: string; answer: string; category: string }> | undefined;
  const faqItems: FAQItem[] = cmsFaqs?.length
    ? cmsFaqs.map((f, i) => ({
        id: i + 1,
        question: f.question,
        answer: f.answer,
        category: f.category,
      }))
    : DEFAULT_FAQ_ITEMS;

  const filteredFAQs = useMemo(() => {
    return faqItems.filter((item) => {
      const matchCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchSearch =
        !searchQuery ||
        item.question.includes(searchQuery) ||
        item.answer.includes(searchQuery);
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery, faqItems]);

  if (cmsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

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
          <h1 className="text-lg font-bold">پرسش‌های متداول</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        {/* Hero */}
        <section className="mb-10 text-center">
          <Badge variant="outline" className="mb-4 border-gold/30 bg-gold/10 text-gold">
            <HelpCircle className="ml-1.5 h-3.5 w-3.5" />
            راهنما
          </Badge>
          <h2 className="mb-4 text-3xl font-extrabold sm:text-4xl">
            <span className="gold-gradient-text">سوالات متداول</span>
          </h2>
          <p className="mx-auto max-w-2xl leading-relaxed text-muted-foreground">
            {intro}
          </p>
        </section>

        {/* Search */}
        <div className="mx-auto mb-8 max-w-lg">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="جستجو در سوالات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-border/60 bg-card pr-10 focus:border-gold/50"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {faqCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeCategory === cat.key
                  ? 'bg-gold text-black shadow-md shadow-gold/20'
                  : 'border border-border/60 bg-card text-muted-foreground hover:border-gold/30 hover:text-gold'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <Card className="glass-card border-border/60">
          <CardContent className="p-4 sm:p-6">
            {filteredFAQs.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {filteredFAQs.map((item) => (
                  <AccordionItem
                    key={item.id}
                    value={`item-${item.id}`}
                    className="border-border/60"
                  >
                    <AccordionTrigger className="text-right text-sm font-semibold hover:text-gold hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      <RenderHTML html={item.answer} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="py-12 text-center">
                <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">نتیجه‌ای یافت نشد. لطفاً عبارت دیگری را جستجو کنید.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            پاسخ سوال خود را پیدا نکردید؟{' '}
            <button
              onClick={() => setLandingPage('contact')}
              className="font-medium text-gold hover:underline"
            >
              با پشتیبانی تماس بگیرید
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

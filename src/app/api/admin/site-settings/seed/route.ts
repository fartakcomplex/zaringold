import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface SettingDef {
  group: string;
  key: string;
  value: string;
  type: string;
  label: string;
  description?: string;
  sortOrder: number;
}

const SEED_SETTINGS: SettingDef[] = [
  /* ═══════════════════════════════════════════════════════════════════ */
  /*  landing_general — General Landing Settings                        */
  /* ═══════════════════════════════════════════════════════════════════ */
  {
    group: 'landing_general',
    key: 'enabled',
    value: 'true',
    type: 'boolean',
    label: 'فعال بودن لندینگ',
    description: 'آیا صفحه لندینگ نمایش داده شود؟',
    sortOrder: 0,
  },
  {
    group: 'landing_general',
    key: 'nav_cta_text',
    value: 'ورود / ثبت‌نام',
    type: 'text',
    label: 'متن دکمه ناوبری',
    description: 'متن دکمه CTA در نوار ناوبری',
    sortOrder: 1,
  },
  {
    group: 'landing_general',
    key: 'meta_title',
    value: 'زرین گلد | سرمایه‌گذاری هوشمند در طلا',
    type: 'text',
    label: 'عنوان صفحه (SEO)',
    description: 'متاتگ عنوان صفحه',
    sortOrder: 2,
  },
  {
    group: 'landing_general',
    key: 'meta_description',
    value: 'خرید، فروش و پس‌انداز طلای نوین با کمترین کارمزد و بالاترین امنیت. زرین گلد، پلتفرم هوشمند سرمایه‌گذاری طلا.',
    type: 'textarea',
    label: 'توضیحات صفحه (SEO)',
    description: 'متاتگ توضیحات صفحه',
    sortOrder: 3,
  },

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  hero — Hero Section                                               */
  /* ═══════════════════════════════════════════════════════════════════ */
  {
    group: 'hero',
    key: 'enabled',
    value: 'true',
    type: 'boolean',
    label: 'فعال بودن بخش اصلی',
    sortOrder: 0,
  },
  {
    group: 'hero',
    key: 'badge',
    value: 'امنیت و اعتماد شما اولویت ماست',
    type: 'text',
    label: 'نشان (Badge)',
    sortOrder: 1,
  },
  {
    group: 'hero',
    key: 'title',
    value: 'سرمایه‌گذاری هوشمند در طلا',
    type: 'text',
    label: 'عنوان اصلی',
    sortOrder: 2,
  },
  {
    group: 'hero',
    key: 'subtitle',
    value: 'خرید، فروش و پس‌انداز طلای نوین با کمترین کارمزد و بالاترین امنیت',
    type: 'textarea',
    label: 'زیرعنوان',
    sortOrder: 3,
  },
  {
    group: 'hero',
    key: 'cta_primary',
    value: 'شروع کنید',
    type: 'text',
    label: 'متن دکمه اصلی',
    sortOrder: 4,
  },
  {
    group: 'hero',
    key: 'cta_secondary',
    value: 'بیشتر بدانید',
    type: 'text',
    label: 'متن دکمه ثانویه',
    sortOrder: 5,
  },
  {
    group: 'hero',
    key: 'stat1_value',
    value: '۱۰۰,۰۰۰+',
    type: 'text',
    label: 'آمار ۱ — مقدار',
    sortOrder: 6,
  },
  {
    group: 'hero',
    key: 'stat1_label',
    value: 'کاربر فعال',
    type: 'text',
    label: 'آمار ۱ — برچسب',
    sortOrder: 7,
  },
  {
    group: 'hero',
    key: 'stat2_value',
    value: '۵,۰۰۰+',
    type: 'text',
    label: 'آمار ۲ — مقدار',
    sortOrder: 8,
  },
  {
    group: 'hero',
    key: 'stat2_label',
    value: 'کیلوگرم طلا معامله',
    type: 'text',
    label: 'آمار ۲ — برچسب',
    sortOrder: 9,
  },
  {
    group: 'hero',
    key: 'stat3_value',
    value: '۹۹.۹٪',
    type: 'text',
    label: 'آمار ۳ — مقدار',
    sortOrder: 10,
  },
  {
    group: 'hero',
    key: 'stat3_label',
    value: 'آپتایم',
    type: 'text',
    label: 'آمار ۳ — برچسب',
    sortOrder: 11,
  },

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  features — Features Section                                       */
  /* ═══════════════════════════════════════════════════════════════════ */
  {
    group: 'features',
    key: 'enabled',
    value: 'true',
    type: 'boolean',
    label: 'فعال بودن بخش ویژگی‌ها',
    sortOrder: 0,
  },
  {
    group: 'features',
    key: 'badge',
    value: 'ویژگی‌ها',
    type: 'text',
    label: 'نشان (Badge)',
    sortOrder: 1,
  },
  {
    group: 'features',
    key: 'title',
    value: 'چرا زرین گلد؟',
    type: 'text',
    label: 'عنوان',
    sortOrder: 2,
  },
  {
    group: 'features',
    key: 'subtitle',
    value: 'با امکانات پیشرفته و امنیتی سطح بالا، سرمایه‌گذاری در طلا را تجربه کنید.',
    type: 'textarea',
    label: 'زیرعنوان',
    sortOrder: 3,
  },
  {
    group: 'features',
    key: 'items',
    value: JSON.stringify([
      { title: 'خرید و فروش آنی', description: 'معامله طلا به صورت آنلاین و لحظه‌ای', icon: 'Zap' },
      { title: 'امنیت بالا', description: 'رمزنگاری پیشرفته و تأیید دو مرحله‌ای', icon: 'Shield' },
      { title: 'کارمزد کم', description: 'کمترین کارمزد در بازار طلای ایران', icon: 'TrendingDown' },
      { title: 'پس‌انداز خودکار', description: 'خرید تکه‌ای و اتوماتیک طلا هر هفته', icon: 'PiggyBank' },
      { title: 'پشتیبانی ۲۴/۷', description: 'تیم پشتیبانی در تمام ساعات شبانه‌روز', icon: 'Headphones' },
      { title: 'گزارش‌های دقیق', description: 'تحلیل و آمار لحظه‌ای سرمایه‌گذاری شما', icon: 'BarChart3' },
    ]),
    type: 'json',
    label: 'مورد ویژگی‌ها',
    description: 'آرایه JSON از آیتم‌های ویژگی با فیلدهای title, description, icon',
    sortOrder: 4,
  },

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  how_it_works — How It Works Section                               */
  /* ═══════════════════════════════════════════════════════════════════ */
  {
    group: 'how_it_works',
    key: 'enabled',
    value: 'true',
    type: 'boolean',
    label: 'فعال بودن بخش نحوه کار',
    sortOrder: 0,
  },
  {
    group: 'how_it_works',
    key: 'badge',
    value: 'شروع ساده',
    type: 'text',
    label: 'نشان (Badge)',
    sortOrder: 1,
  },
  {
    group: 'how_it_works',
    key: 'title',
    value: 'نحوه شروع کار',
    type: 'text',
    label: 'عنوان',
    sortOrder: 2,
  },
  {
    group: 'how_it_works',
    key: 'subtitle',
    value: 'با تنها چند قدم ساده، سرمایه‌گذاری در طلا را شروع کنید.',
    type: 'textarea',
    label: 'زیرعنوان',
    sortOrder: 3,
  },
  {
    group: 'how_it_works',
    key: 'items',
    value: JSON.stringify([
      { title: 'ثبت‌نام رایگان', description: 'با شماره موبایل در کمتر از ۳۰ ثانیه ثبت‌نام کنید' },
      { title: 'احراز هویت', description: 'بارگذاری تصویر کارت ملی و تکمیل فرآیند احراز هویت' },
      { title: 'شارژ کیف پول', description: 'از طریق درگاه پرداخت امن، کیف پول خود را شارژ کنید' },
      { title: 'خرید طلا', description: 'به مقدار دلخواه طلا بخرید و شاهد رشد سرمایه‌تان باشید' },
    ]),
    type: 'json',
    label: 'مراحل کار',
    description: 'آرایه JSON از مراحل با فیلدهای title, description',
    sortOrder: 4,
  },

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  calculator — Calculator Section                                   */
  /* ═══════════════════════════════════════════════════════════════════ */
  {
    group: 'calculator',
    key: 'enabled',
    value: 'true',
    type: 'boolean',
    label: 'فعال بودن بخش محاسبهگر',
    sortOrder: 0,
  },
  {
    group: 'calculator',
    key: 'badge',
    value: 'محاسبهگر',
    type: 'text',
    label: 'نشان (Badge)',
    sortOrder: 1,
  },
  {
    group: 'calculator',
    key: 'title',
    value: 'محاسبهگر قیمت طلا',
    type: 'text',
    label: 'عنوان',
    sortOrder: 2,
  },
  {
    group: 'calculator',
    key: 'subtitle',
    value: 'قیمت لحظه‌ای طلا را محاسبه کنید و سرمایه‌گذاری هوشمندانه داشته باشید.',
    type: 'textarea',
    label: 'زیرعنوان',
    sortOrder: 3,
  },

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  security — Security Section                                       */
  /* ═══════════════════════════════════════════════════════════════════ */
  {
    group: 'security',
    key: 'enabled',
    value: 'true',
    type: 'boolean',
    label: 'فعال بودن بخش امنیت',
    sortOrder: 0,
  },
  {
    group: 'security',
    key: 'badge',
    value: 'امنیت و اعتماد',
    type: 'text',
    label: 'نشان (Badge)',
    sortOrder: 1,
  },
  {
    group: 'security',
    key: 'title',
    value: 'سرمایه شما در امان است',
    type: 'text',
    label: 'عنوان',
    sortOrder: 2,
  },
  {
    group: 'security',
    key: 'subtitle',
    value: 'با بالاترین استانداردهای امنیتی، از سرمایه شما محافظت می‌کنیم.',
    type: 'textarea',
    label: 'زیرعنوان',
    sortOrder: 3,
  },
  {
    group: 'security',
    key: 'items',
    value: JSON.stringify([
      { title: 'رمزنگاری AES-256', description: 'تمام اطلاعات حساس با رمزنگاری AES-256 محافظت می‌شوند', icon: 'Lock' },
      { title: 'تأیید دو مرحله‌ای', description: 'لایه اضافی امنیت با تأیید پیامکی و اپلیکیشن', icon: 'ShieldCheck' },
      { title: 'بازیابی سرد', description: 'بخش عمده ذخایر طلا در صندوق‌های فیزیکی سرد', icon: 'Snowflake' },
      { title: 'ممیزی امنیتی', description: 'ممیزی‌های دوره‌ای توسط شرکت‌های معتبر امنیتی', icon: 'ScanSearch' },
      { title: 'GDPR', description: 'مطابقت کامل با قوانین حریم خصوصی اروپا', icon: 'FileCheck' },
      { title: 'پشتیبانی ۲۴/۷', description: 'تیم امنیتی ما در تمام ساعات آماده پاسخگویی است', icon: 'Headphones' },
    ]),
    type: 'json',
    label: 'مورد امنیتی',
    description: 'آرایه JSON از ویژگی‌های امنیتی با فیلدهای title, description, icon',
    sortOrder: 4,
  },

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  partners — Partners / Trust Section                               */
  /* ═══════════════════════════════════════════════════════════════════ */
  {
    group: 'partners',
    key: 'enabled',
    value: 'true',
    type: 'boolean',
    label: 'فعال بودن بخش شرکا',
    sortOrder: 0,
  },
  {
    group: 'partners',
    key: 'badge',
    value: 'شرکا و اعتماد',
    type: 'text',
    label: 'نشان (Badge)',
    sortOrder: 1,
  },
  {
    group: 'partners',
    key: 'title',
    value: 'مورد اعتماد سازمان‌های معتبر',
    type: 'text',
    label: 'عنوان',
    sortOrder: 2,
  },
  {
    group: 'partners',
    key: 'subtitle',
    value: 'زرین گلد تحت نظارت نهادهای مالی و دارای مجوزهای لازم است.',
    type: 'textarea',
    label: 'زیرعنوان',
    sortOrder: 3,
  },

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  testimonials — Testimonials Section                               */
  /* ═══════════════════════════════════════════════════════════════════ */
  {
    group: 'testimonials',
    key: 'enabled',
    value: 'true',
    type: 'boolean',
    label: 'فعال بودن بخش نظرات',
    sortOrder: 0,
  },
  {
    group: 'testimonials',
    key: 'badge',
    value: 'نظرات کاربران',
    type: 'text',
    label: 'نشان (Badge)',
    sortOrder: 1,
  },
  {
    group: 'testimonials',
    key: 'title',
    value: 'نظرات کاربران ما',
    type: 'text',
    label: 'عنوان',
    sortOrder: 2,
  },
  {
    group: 'testimonials',
    key: 'subtitle',
    value: 'ببینید کاربران زرین گلد درباره ما چه می‌گویند.',
    type: 'textarea',
    label: 'زیرعنوان',
    sortOrder: 3,
  },
  {
    group: 'testimonials',
    key: 'items',
    value: JSON.stringify([
      { name: 'علی محمدی', role: 'سرمایه‌گذار حرفه‌ای', rating: 5, text: 'بهترین پلتفرم سرمایه‌گذاری طلا. کارمزد خیلی کم و سرعت عالی.' },
      { name: 'سارا احمدی', role: 'کاربر فعال', rating: 5, text: 'رابط کاربری فوق‌العاده و پشتیبانی عالی. خیلی راضی هستم.' },
      { name: 'محمد رضایی', role: 'معامله‌گر طلا', rating: 4, text: 'قیمت‌ها همیشه به‌روز و معاملات سریع انجام می‌شود.' },
      { name: 'فاطمه کریمی', role: 'دارنده کارت طلایی', rating: 5, text: 'کارت طلایی زرین گلد واقعاً عالیه! همه جا قابل استفاده است.' },
      { name: 'رضا نوری', role: 'کاربر جدید', rating: 5, text: 'ثبت‌نام خیلی ساده بود و خیلی سریع شروع به خرید طلا کردم.' },
      { name: 'مریم حسینی', role: 'پس‌اندازکننده', rating: 4, text: 'قابلیت پس‌انداز خودکار خیلی کمکم کرده که مداوم طلا بخرم.' },
    ]),
    type: 'json',
    label: 'نظرات کاربران',
    description: 'آرایه JSON از نظرات با فیلدهای name, role, rating, text',
    sortOrder: 4,
  },

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  comparison — Comparison Table Section                             */
  /* ═══════════════════════════════════════════════════════════════════ */
  {
    group: 'comparison',
    key: 'enabled',
    value: 'true',
    type: 'boolean',
    label: 'فعال بودن بخش مقایسه',
    sortOrder: 0,
  },
  {
    group: 'comparison',
    key: 'badge',
    value: 'مقایسه پلتفرم‌ها',
    type: 'text',
    label: 'نشان (Badge)',
    sortOrder: 1,
  },
  {
    group: 'comparison',
    key: 'title',
    value: 'چرا زرین گلد؟',
    type: 'text',
    label: 'عنوان',
    sortOrder: 2,
  },
  {
    group: 'comparison',
    key: 'subtitle',
    value: 'مقایسه زرین گلد با سایر پلتفرم‌های سرمایه‌گذاری طلا',
    type: 'textarea',
    label: 'زیرعنوان',
    sortOrder: 3,
  },
  {
    group: 'comparison',
    key: 'items',
    value: JSON.stringify([
      { feature: 'کارمزد خرید', zarrinGold: '۰.۲٪', platformA: '۱.۵٪', platformB: '۲٪' },
      { feature: 'کارمزد فروش', zarrinGold: '۰.۳٪', platformA: '۲٪', platformB: '۲.۵٪' },
      { feature: 'واریز آنی', zarrinGold: true, platformA: true, platformB: false },
      { feature: 'برداشت سریع', zarrinGold: true, platformA: false, platformB: false },
      { feature: 'پشتیبانی ۲۴/۷', zarrinGold: true, platformA: true, platformB: false },
      { feature: 'هشدار قیمت', zarrinGold: true, platformA: true, platformB: false },
      { feature: 'پس‌انداز خودکار', zarrinGold: true, platformA: false, platformB: false },
      { feature: 'کارت طلایی', zarrinGold: true, platformA: false, platformB: false },
    ]),
    type: 'json',
    label: 'داده‌های جدول مقایسه',
    description: 'آرایه JSON از ردیف‌های مقایسه با فیلدهای feature, zarrinGold, platformA, platformB',
    sortOrder: 4,
  },

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  faq — FAQ Section                                                */
  /* ═══════════════════════════════════════════════════════════════════ */
  {
    group: 'faq',
    key: 'enabled',
    value: 'true',
    type: 'boolean',
    label: 'فعال بودن بخش سوالات متداول',
    sortOrder: 0,
  },
  {
    group: 'faq',
    key: 'badge',
    value: 'راهنما',
    type: 'text',
    label: 'نشان (Badge)',
    sortOrder: 1,
  },
  {
    group: 'faq',
    key: 'title',
    value: 'سوالات متداول',
    type: 'text',
    label: 'عنوان',
    sortOrder: 2,
  },
  {
    group: 'faq',
    key: 'subtitle',
    value: 'پاسخ سوالات رایج درباره زرین گلد و سرمایه‌گذاری در طلا.',
    type: 'textarea',
    label: 'زیرعنوان',
    sortOrder: 3,
  },
  {
    group: 'faq',
    key: 'items',
    value: JSON.stringify([
      { question: 'چگونه در زرین گلد ثبت‌نام کنم؟', answer: 'برای ثبت‌نام کافیست شماره موبایل خود را وارد کنید. پس از دریافت کد تأیید و تکمیل احراز هویت، حساب شما فعال می‌شود.' },
      { question: 'حداقل مبلغ خرید طلا چقدر است؟', answer: 'شما می‌توانید از ۱۰۰ هزار واحد طلایی به بالا اقدام به خرید طلا کنید.' },
      { question: 'آیا امکان فروش آنی وجود دارد؟', answer: 'بله، شما می‌توانید طلای خود را به صورت آنی و با قیمت لحظه‌ای فروش کنید.' },
      { question: 'کارمزد معاملات چقدر است؟', answer: 'کارمزد خرید ۰.۲٪ و کارمزد فروش ۰.۳٪ است که یکی از پایین‌ترین نرخ‌ها در بازار است.' },
      { question: 'امنیت سرمایه من چگونه تضمین می‌شود؟', answer: 'تمام اطلاعات با رمزنگاری AES-256 محافظت می‌شوند و بخش عمده طلای فیزیکی در صندوق‌های امن نگهداری می‌شود.' },
      { question: 'آیا امکان پس‌انداز خودکار وجود دارد؟', answer: 'بله، با فعال‌سازی پس‌انداز خودکار، هر هفته مبلغ مشخصی از کیف پول شما به صورت خودکار طلا خریداری می‌شود.' },
    ]),
    type: 'json',
    label: 'سوالات متداول',
    description: 'آرایه JSON از سوالات با فیلدهای question, answer',
    sortOrder: 4,
  },

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  app_download — App Download Section                               */
  /* ═══════════════════════════════════════════════════════════════════ */
  {
    group: 'app_download',
    key: 'enabled',
    value: 'true',
    type: 'boolean',
    label: 'فعال بودن بخش اپلیکیشن',
    sortOrder: 0,
  },
  {
    group: 'app_download',
    key: 'badge',
    value: 'اپلیکیشن موبایل',
    type: 'text',
    label: 'نشان (Badge)',
    sortOrder: 1,
  },
  {
    group: 'app_download',
    key: 'title',
    value: 'زرین گلد را همیشه همراه داشته باشید',
    type: 'text',
    label: 'عنوان',
    sortOrder: 2,
  },
  {
    group: 'app_download',
    key: 'subtitle',
    value: 'اپلیکیشن موبایل زرین گلد را دانلود کنید و در هر لحظه معامله کنید.',
    type: 'textarea',
    label: 'زیرعنوان',
    sortOrder: 3,
  },

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  cta — Call to Action Section                                      */
  /* ═══════════════════════════════════════════════════════════════════ */
  {
    group: 'cta',
    key: 'enabled',
    value: 'true',
    type: 'boolean',
    label: 'فعال بودن بخش CTA',
    sortOrder: 0,
  },
  {
    group: 'cta',
    key: 'title',
    value: 'همین حالا شروع کنید',
    type: 'text',
    label: 'عنوان',
    sortOrder: 1,
  },
  {
    group: 'cta',
    key: 'subtitle',
    value: 'به بیش از ۱۰۰,۰۰۰ کاربر فعال زرین گلد بپیوندید',
    type: 'textarea',
    label: 'زیرعنوان',
    sortOrder: 2,
  },
  {
    group: 'cta',
    key: 'cta_text',
    value: 'شروع کنید',
    type: 'text',
    label: 'متن دکمه CTA',
    sortOrder: 3,
  },
  {
    group: 'cta',
    key: 'cta_subtext',
    value: 'ثبت‌نام رایگان',
    type: 'text',
    label: 'متن زیر دکمه',
    sortOrder: 4,
  },
  {
    group: 'cta',
    key: 'cta_note',
    value: 'بدون کارمزد اولیه',
    type: 'text',
    label: 'یادداشت CTA',
    sortOrder: 5,
  },
];

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Check if settings already exist (unless force)
    if (!force) {
      const existingCount = await db.siteSetting.count({
        where: {
          group: {
            in: SEED_SETTINGS.map(s => s.group),
          },
        },
      });

      if (existingCount > 0) {
        return NextResponse.json({
          success: true,
          message: 'تنظیمات از قبل وجود دارد',
          existing: existingCount,
          skipped: true,
        });
      }
    }

    // If force, delete existing first
    if (force) {
      await db.siteSetting.deleteMany({
        where: {
          group: {
            in: SEED_SETTINGS.map(s => s.group),
          },
        },
      });
    }

    // Upsert all seed settings
    const results = await Promise.all(
      SEED_SETTINGS.map((item) =>
        db.siteSetting.upsert({
          where: {
            group_key: { group: item.group, key: item.key },
          },
          create: {
            group: item.group,
            key: item.key,
            value: item.value,
            type: item.type,
            label: item.label,
            description: item.description,
            sortOrder: item.sortOrder,
          },
          update: {},
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: 'تنظیمات پیش‌فرض با موفقیت ایجاد شد',
      created: results.length,
      skipped: false,
    });
  } catch (error) {
    console.error('[SiteSettings] Seed error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد تنظیمات پیش‌فرض' }, { status: 500 });
  }
}

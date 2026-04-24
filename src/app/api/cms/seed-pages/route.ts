import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST: Seed static CMS pages with ElementorBuilder components
export async function POST() {
  try {
    const pagesData = [
      // ─────────────────── ABOUT PAGE ───────────────────
      {
        slug: 'about',
        title: 'درباره زرین گلد',
        isPublished: true,
        seoTitle: 'درباره زرین گلد | پلتفرم معاملات طلای نوین',
        seoDesc: 'آشنایی با زرین گلد، پلتفرم معاملات آنلاین طلا با بالاترین امنیت و کمترین کارمزد',
        content: '',
        components: [
          {
            order: 0,
            type: 'heading',
            props: { text: 'درباره زرین گلد', tag: 'h1', alignment: 'center', color: '#D4AF37', fontSize: '28' },
          },
          {
            order: 1,
            type: 'text-editor',
            props: {
              content: '<p>زرین گلد پلتفرم معاملات طلای نوین ایران است که با هدف دسترسی آسان، امن و شفاف همه مردم به بازار طلا تأسیس شده.</p>',
              fontSize: '16',
              color: '#e2e8f0',
              alignment: 'center',
            },
          },
          {
            order: 2,
            type: 'stats-counter',
            props: {
              heading: 'آمار و ارقام',
              items: [
                { value: '۱۲۰,۰۰۰+', label: 'کاربر فعال', prefix: '', suffix: '+' },
                { value: '۵۰۰', label: 'کیلوگرم معامله روزانه', prefix: '', suffix: ' کیلو' },
                { value: '۵+', label: 'سال تجربه', prefix: '', suffix: '' },
                { value: 'آنلاین', label: 'پشتیبانی ۲۴/۷', prefix: '', suffix: '' },
              ],
            },
          },
          {
            order: 3,
            type: 'heading',
            props: { text: 'مأموریت و چشم‌انداز', tag: 'h2', alignment: 'center', color: '#ffffff', fontSize: '22' },
          },
          {
            order: 4,
            type: 'text-editor',
            props: {
              content: '<p><strong>🎯 مأموریت ما:</strong> دموکراتیزه کردن دسترسی به بازار طلا برای همه ایرانیان.</p><p><strong>🚀 چشم‌انداز ما:</strong> تبدیل شدن به بزرگ‌ترین و معتمدترین پلتفرم معاملات طلای دیجیتال در خاورمیانه.</p>',
              fontSize: '15',
              color: '#e2e8f0',
              alignment: 'right',
            },
          },
          {
            order: 5,
            type: 'heading',
            props: { text: 'چرا زرین گلد؟', tag: 'h2', alignment: 'center', color: '#ffffff', fontSize: '22' },
          },
          {
            order: 6,
            type: 'features-grid',
            props: {
              heading: '',
              subtitle: '',
              columns: '2',
              items: [
                { icon: 'ShieldCheck', title: 'امنیت بالا', description: 'تأیید هویت چندمرحله‌ای و رمزگذاری پیشرفته' },
                { icon: 'Clock', title: 'سرعت معاملات', description: 'خرید و فروش آنی طلا در کمتر از ۳ ثانیه' },
                { icon: 'TrendingUp', title: 'شفافیت قیمت', description: 'نرخ لحظه‌ای بازار تهران و اونس جهانی' },
                { icon: 'Gem', title: 'ذخیره ایمن', description: 'نگهداری در صندوق‌های تحت نظارت بانک مرکزی' },
              ],
            },
          },
          {
            order: 7,
            type: 'timeline',
            props: {
              heading: 'تاریخچه مسیر ما',
              items: [
                { title: 'تأسیس زرین گلد', description: 'راه‌اندازی نسخه اول پلتفرم', date: '۱۳۹۹' },
                { title: 'عبور از ۱۰,۰۰۰ کاربر', description: 'راه‌اندازی پس‌انداز خودکار', date: '۱۴۰۰' },
                { title: 'مجوز رسمی', description: 'دریافت مجوز از سازمان بورس', date: '۱۴۰۱' },
                { title: 'کارت طلایی', description: 'راه‌اندازی سیستم پاداش', date: '۱۴۰۲' },
                { title: '۱۰۰,۰۰۰ کاربر', description: 'راه‌اندازی درگاه پرداخت طلایی', date: '۱۴۰۳' },
                { title: 'گسترش بانکی', description: 'همکاری با بانک‌ها و صندوق سرمایه‌گذاری', date: '۱۴۰۴' },
              ],
            },
          },
          {
            order: 8,
            type: 'heading',
            props: { text: 'تیم ما', tag: 'h2', alignment: 'center', color: '#ffffff', fontSize: '22' },
          },
          {
            order: 9,
            type: 'card',
            props: {
              title: 'علی محمدی',
              description: 'مدیرعامل و بنیان‌گذار — بیش از ۱۵ سال تجربه در بازار سرمایه و فین‌تک',
              image: '',
              showButton: false,
            },
          },
          {
            order: 10,
            type: 'card',
            props: {
              title: 'مریم رضایی',
              description: 'مدیر فنی (CTO) — متخصص بلاکچین و امنیت سایبری',
              image: '',
              showButton: false,
            },
          },
          {
            order: 11,
            type: 'card',
            props: {
              title: 'محمد حسینی',
              description: 'مدیر مالی (CFO) — کارشناس ارشد حسابداری حوزه طلا و جواهر',
              image: '',
              showButton: false,
            },
          },
          {
            order: 12,
            type: 'card',
            props: {
              title: 'سارا کریمی',
              description: 'مدیر بازاریابی — متخصص بازاریابی دیجیتال و توسعه کسب‌وکار',
              image: '',
              showButton: false,
            },
          },
          {
            order: 13,
            type: 'spacer',
            props: { height: '40' },
          },
          {
            order: 14,
            type: 'cta-section',
            props: {
              heading: 'به زرین گلد بپیوندید',
              subtitle: 'همین الان ثبت‌نام کنید و از خدمات طلای دیجیتال بهره‌مند شوید',
              buttonText: 'شروع کنید',
              backgroundStyle: 'gradient',
            },
          },
        ],
      },

      // ─────────────────── CONTACT PAGE ───────────────────
      {
        slug: 'contact',
        title: 'تماس با ما',
        isPublished: true,
        seoTitle: 'تماس با زرین گلد | پشتیبانی',
        seoDesc: 'راه‌های ارتباطی با تیم پشتیبانی زرین گلد',
        content: '',
        components: [
          {
            order: 0,
            type: 'heading',
            props: { text: 'تماس با ما', tag: 'h1', alignment: 'center', color: '#D4AF37', fontSize: '28' },
          },
          {
            order: 1,
            type: 'text-editor',
            props: {
              content: '<p>تیم پشتیبانی زرین گلد همیشه آماده پاسخگویی به سؤالات شماست.</p>',
              fontSize: '16',
              color: '#e2e8f0',
              alignment: 'center',
            },
          },
          {
            order: 2,
            type: 'icon-list',
            props: {
              items: [
                { icon: 'Phone', text: '021-9100 1234 — شنبه تا پنج‌شنبه ۹ تا ۲۱' },
                { icon: 'Mail', text: 'support@zarringold.ir — پاسخ‌گویی حداکثر ۲۴ ساعته' },
                { icon: 'MapPin', text: 'تهران، خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۲۳' },
                { icon: 'Clock', text: 'شنبه تا پنج‌شنبه: ۹ تا ۲۱ — جمعه: ۱۰ تا ۱۸' },
              ],
              color: '#D4AF37',
              iconSize: '20',
            },
          },
          {
            order: 3,
            type: 'spacer',
            props: { height: '30' },
          },
          {
            order: 4,
            type: 'heading',
            props: { text: 'بخش‌های پاسخگویی', tag: 'h2', alignment: 'center', color: '#ffffff', fontSize: '22' },
          },
          {
            order: 5,
            type: 'table',
            props: {
              headers: 'بخش,ایمیل,زمان پاسخ',
              rows: 'پشتیبانی فنی,tech@zarringold.ir,کمتر از ۲ ساعت\nمالی و حسابداری,finance@zarringold.ir,کمتر از ۴ ساعت\nبازاریابی و همکاری,partner@zarringold.ir,کمتر از ۱ روز\nامور حقوقی,legal@zarringold.ir,کمتر از ۲ روز',
              bordered: true,
              striped: true,
            },
          },
          {
            order: 6,
            type: 'spacer',
            props: { height: '30' },
          },
          {
            order: 7,
            type: 'heading',
            props: { text: 'ما را در شبکه‌های اجتماعی دنبال کنید', tag: 'h2', alignment: 'center', color: '#ffffff', fontSize: '20' },
          },
          {
            order: 8,
            type: 'icon-list',
            props: {
              items: [
                { icon: 'Instagram', text: 'اینستاگرام: @zarringold' },
                { icon: 'Send', text: 'تلگرام: @zarringold_channel' },
                { icon: 'MessageCircle', text: 'توییتر: @zarringold' },
              ],
              color: '#D4AF37',
              iconSize: '18',
            },
          },
          {
            order: 9,
            type: 'cta-section',
            props: {
              heading: 'سوالی دارید؟',
              subtitle: 'قبل از ارسال پیام، بخش سوالات متداول را بررسی کنید',
              buttonText: 'مشاهده سوالات متداول',
              backgroundStyle: 'gradient',
            },
          },
        ],
      },

      // ─────────────────── TERMS PAGE ───────────────────
      {
        slug: 'terms',
        title: 'قوانین و مقررات',
        isPublished: true,
        seoTitle: 'قوانین و مقررات استفاده از زرین گلد',
        seoDesc: 'شرایط و قوانین استفاده از خدمات زرین گلد',
        content: '',
        components: [
          {
            order: 0,
            type: 'heading',
            props: { text: 'قوانین و مقررات', tag: 'h1', alignment: 'center', color: '#D4AF37', fontSize: '28' },
          },
          {
            order: 1,
            type: 'text-editor',
            props: {
              content: '<p>آخرین بروزرسانی: اردیبهشت ۱۴۰۴ — با استفاده از خدمات زرین گلد، شما قوانین زیر را مطالعه کرده و می‌پذیرید.</p>',
              fontSize: '16',
              color: '#e2e8f0',
              alignment: 'center',
            },
          },
          {
            order: 2,
            type: 'accordion',
            props: {
              items: [
                { title: 'ماده ۱ — تعاریف و مقررات کلی', content: '«زرین گلد» یک پلتفرم آنلاین معاملات طلای دیجیتال است. کاربر با ثبت‌نام قوانین را می‌پذیرد. استفاده از خدمات نیازمند تکمیل احراز هویت. حداقل سن ۱۸ سال.' },
                { title: 'ماده ۲ — قوانین معاملات', content: 'معاملات بر اساس نرخ لحظه‌ای بازار انجام می‌شود. کارمزد خرید ۰.۳٪ و فروش ۰.۴٪. حداقل خرید ۰.۰۳۳ گرم. درخواست فروش غیرقابل برگشت.' },
                { title: 'ماده ۳ — امنیت و حفاظت از حساب', content: 'کاربر مسئول حفظ امنیت رمز عبور است. فعال‌سازی ۲FA الزامی. زرین گلد حق مسدودی موقت حساب مشکوک را دارد.' },
                { title: 'ماده ۴ — کیف پول و تراکنش‌ها', content: 'موجودی بر اساس وزن واقعی محاسبه می‌شود. مدت پردازش برداشت ۷۲ ساعت. بیمه سپرده تا ۱ کیلوگرم.' },
                { title: 'ماده ۵ — فعالیت‌های ممنوع', content: 'استفاده از ربات ممنوع. پولشویی ممنوع. ایجاد چند حساب ممنوع. تلاش نفوذ جرم محسوب.' },
                { title: 'ماده ۶ — حریم خصوصی', content: 'اطلاعات بدون رضایت به اشخاص ثالث ارائه نمی‌شود. نگهداری حداقل ۵ سال. کاربر حق حذف اطلاعات را دارد.' },
                { title: 'ماده ۷ — مسئولیت و ضمانت', content: 'تضمین سودآوری نمی‌شود. حداکثر مسئولیت معادل کارمزد ۳ ماه اخیر. تغییر قوانین با اطلاع‌رسانی ۱۵ روزه.' },
              ],
            },
          },
        ],
      },

      // ─────────────────── PRIVACY PAGE ───────────────────
      {
        slug: 'privacy',
        title: 'حریم خصوصی',
        isPublished: true,
        seoTitle: 'سیاست حریم خصوصی زرین گلد',
        seoDesc: 'اطلاعات مربوط به نحوه جمع‌آوری و محافظت از داده‌های شخصی کاربران',
        content: '',
        components: [
          {
            order: 0,
            type: 'heading',
            props: { text: 'حریم خصوصی', tag: 'h1', alignment: 'center', color: '#D4AF37', fontSize: '28' },
          },
          {
            order: 1,
            type: 'text-editor',
            props: {
              content: '<p>ما متعهد به حفاظت از اطلاعات شخصی شما هستیم. این صفحه نحوه جمع‌آوری و محافظت از داده‌ها را توضیح می‌دهد.</p>',
              fontSize: '16',
              color: '#e2e8f0',
              alignment: 'center',
            },
          },
          {
            order: 2,
            type: 'alert',
            props: {
              alertType: 'info',
              title: 'خلاصه سیاست حریم خصوصی',
              content: 'رمزنگاری AES-256 + TLS 1.3 • بدون فروش اطلاعات • کنترل کامل کاربر بر داده‌ها',
            },
          },
          {
            order: 3,
            type: 'accordion',
            props: {
              items: [
                { title: 'اطلاعاتی که جمع‌آوری می‌کنیم', content: 'اطلاعات هویتی: نام، کد ملی، آدرس. اطلاعات مالی: شماره شبا، سوابق تراکنش. اطلاعات فنی: IP، مرورگر، دستگاه. اطلاعات زیستی: تصویر چهره. اطلاعات استفاده: صفحات بازدید شده.' },
                { title: 'نحوه استفاده از اطلاعات', content: 'پردازش تراکنش‌ها، احراز هویت، ارسال اعلان‌ها، بهبود خدمات، جلوگیری از تقلب، تحلیل آماری.' },
                { title: 'حفاظت و امنیت داده‌ها', content: 'TLS 1.3، AES-256، RBAC، نظارت ۲۴/۷، بکاپ‌گیری روزانه، آزمون نفوذ دوره‌ای.' },
                { title: 'ذخیره‌سازی اطلاعات', content: 'هویتی: ۵ سال. تراکنش‌ها: ۱۰ سال. لاگ‌ها: ۹۰ روز. بازاریابی: تا لغو اشتراک.' },
                { title: 'اشتراک‌گذاری با اشخاص ثالث', content: 'بدون رضایت به اشخاص ثالث ارائه نمی‌شود. ممکن به بانک مرکزی، بورس، پلیس فتا ارائه شود.' },
                { title: 'حقوق کاربر', content: 'دسترسی به اطلاعات، اصلاح نادرست، حذف اطلاعات، دریافت کپی، اعتراض به بازاریابی، شکایت.' },
              ],
            },
          },
        ],
      },

      // ─────────────────── FAQ PAGE ───────────────────
      {
        slug: 'faq',
        title: 'سوالات متداول',
        isPublished: true,
        seoTitle: 'سوالات متداول زرین گلد',
        seoDesc: 'پاسخ به رایج‌ترین سوالات درباره خدمات و معاملات زرین گلد',
        content: '',
        components: [
          {
            order: 0,
            type: 'heading',
            props: { text: 'سوالات متداول', tag: 'h1', alignment: 'center', color: '#D4AF37', fontSize: '28' },
          },
          {
            order: 1,
            type: 'text-editor',
            props: {
              content: '<p>پاسخ سوالات رایج درباره خدمات زرین گلد را اینجا پیدا کنید.</p>',
              fontSize: '16',
              color: '#e2e8f0',
              alignment: 'center',
            },
          },
          {
            order: 2,
            type: 'faq-section',
            props: {
              heading: 'سوالات متداول',
              items: [
                { question: 'چطور ثبت‌نام کنم؟', answer: 'شماره موبایل وارد کنید، کد تأیید بگیرید، اطلاعات هویتی تکمیل کنید. کمتر از ۳ دقیقه.' },
                { question: 'احراز هویت (KYC) چیست؟', answer: 'فرآیند تأیید هویت با ارائه تصویر کارت ملی و بانکی. الزامی بر اساس قوانین بانک مرکزی.' },
                { question: 'کیف پول چطور شارژ میشه؟', answer: 'به بخش کیف پول مراجعه کنید و گزینه واریز را انتخاب نمایید.' },
                { question: 'حداقل مبلغ خرید چقدره؟', answer: 'حداقل خرید ۰.۰۱۵ گرم و حداقل فروش ۰.۰۱ گرم طلا.' },
                { question: 'کارمزد معاملات چقدره؟', answer: 'خرید ۰.۳٪ تا ۰.۵٪ و فروش در همین بازه، بسته به سطح کاربری.' },
                { question: 'آیا طلای من قابل تحویل است؟', answer: 'بله، معادل هر گرم طلای دیجیتال، طلای فیزیکی در صندوق‌های امن نگهداری می‌شود.' },
                { question: 'امنیت حساب چطور تضمین میشه؟', answer: 'AES-256، احراز دو مرحله‌ای، محدودیت تلاش ورود، مانیتورینگ ۲۴ ساعته.' },
                { question: 'پس‌انداز طلایی چطور کار میکنه؟', answer: 'خرید خودکار طلا با فاصله هفتگی یا ماهانه و مشخص کردن مبلغ.' },
                { question: 'فراموشی رمز عبور چه کنم؟', answer: 'از فراموشی رمز عبور استفاده کنید. شماره موبایل و کد بازیابی لازم است.' },
                { question: 'برنامه دعوت چطور کار میکنه؟', answer: 'لینک اختصاصی به اشتراک بگذارید. ۵۰۰ میلی‌گرم طلا پاداش برای هر ثبت‌نام موفق.' },
              ],
            },
          },
        ],
      },

      // ─────────────────── COOPERATION PAGE ───────────────────
      {
        slug: 'cooperation',
        title: 'همکاری با ما',
        isPublished: true,
        seoTitle: 'همکاری با زرین گلد | فرصت‌های شریک تجاری',
        seoDesc: 'فرصت‌های همکاری تجاری با زرین گلد شامل نمایندگی، API و بازاریابی',
        content: '',
        components: [
          {
            order: 0,
            type: 'heading',
            props: { text: 'همکاری با زرین گلد', tag: 'h1', alignment: 'center', color: '#D4AF37', fontSize: '28' },
          },
          {
            order: 1,
            type: 'text-editor',
            props: {
              content: '<p>زرین گلد با گشودن درهای همکاری، فرصتی ویژه برای شرکت‌ها، صرافی‌ها و بازاریابان فراهم آورده است.</p>',
              fontSize: '16',
              color: '#e2e8f0',
              alignment: 'center',
            },
          },
          {
            order: 2,
            type: 'features-grid',
            props: {
              heading: 'نوع همکاری خود را انتخاب کنید',
              subtitle: '',
              columns: '2',
              items: [
                { icon: 'Building2', title: 'نمایندگی فروش', description: 'تا ۲٪ کمیسیون فروش و پشتیبانی اختصاصی' },
                { icon: 'Code', title: 'API همکاری', description: 'API RESTful امن با مستندات کامل' },
                { icon: 'Megaphone', title: 'بازاریابی همکاری در فروش', description: 'پورسانت تا ۳۰٪ با پرداخت ماهانه' },
                { icon: 'TrendingUp', title: 'سرمایه‌گذاری سازمانی', description: 'نرخ کارمزد ویژه و مشاوره اختصاصی' },
              ],
            },
          },
          {
            order: 3,
            type: 'stats-counter',
            props: {
              heading: 'در یک نگاه',
              items: [
                { value: '۵۰+', label: 'نماینده فعال', prefix: '', suffix: '' },
                { value: '۲۰+', label: 'همکار API', prefix: '', suffix: '' },
                { value: '۱۰۰+', label: 'بازاریاب فعال', prefix: '', suffix: '' },
                { value: '۳۰+', label: 'سرمایه‌گذار سازمانی', prefix: '', suffix: '' },
              ],
            },
          },
          {
            order: 4,
            type: 'cta-section',
            props: {
              heading: 'درخواست همکاری',
              subtitle: 'فرم درخواست را تکمیل کنید تا کارشناسان ما تماس بگیرند',
              buttonText: 'ارسال درخواست همکاری',
              backgroundStyle: 'gradient',
            },
          },
        ],
      },

      // ─────────────────── SITEMAP PAGE ───────────────────
      {
        slug: 'sitemap',
        title: 'نقشه سایت',
        isPublished: true,
        seoTitle: 'نقشه سایت زرین گلد',
        seoDesc: 'فهرست کامل صفحات و بخش‌های زرین گلد',
        content: '',
        components: [
          {
            order: 0,
            type: 'heading',
            props: { text: 'نقشه سایت', tag: 'h1', alignment: 'center', color: '#D4AF37', fontSize: '28' },
          },
          {
            order: 1,
            type: 'text-editor',
            props: {
              content: '<p>دسترسی سریع به تمامی بخش‌ها و صفحات زرین گلد.</p>',
              fontSize: '16',
              color: '#e2e8f0',
              alignment: 'center',
            },
          },
          {
            order: 2,
            type: 'icon-list',
            props: {
              items: [
                { icon: 'ShoppingBag', text: 'خرید و فروش طلا — بازار — نمودار — قیمت زنده' },
                { icon: 'Brain', text: 'خرید هوشمند — شبیه‌ساز سود — تحلیل پرتفوی' },
                { icon: 'PiggyBank', text: 'پس‌انداز خودکار — اهداف — وام طلایی' },
                { icon: 'Star', text: 'اشتراک VIP — کش‌بک — صندوق طلای من' },
                { icon: 'Shield', text: 'امنیت حساب — احراز هویت — تأیید دو مرحله‌ای' },
                { icon: 'BookOpen', text: 'آکادمی طلا — هدایای طلایی — فید اجتماعی' },
              ],
              color: '#D4AF37',
              iconSize: '20',
            },
          },
        ],
      },

      // ─────────────────── GATEWAY PAGE ───────────────────
      {
        slug: 'gateway',
        title: 'درگاه پرداخت طلایی',
        isPublished: true,
        seoTitle: 'درگاه پرداخت طلایی زرین گلد | پرداخت آنی با طلا',
        seoDesc: 'درگاه پرداخت طلایی زرین گلد — پذیرش پرداخت با طلای دیجیتال در وب‌سایت و اپلیکیشن شما',
        content: '',
        components: [
          {
            order: 0,
            type: 'heading',
            props: { text: 'درگاه پرداخت طلایی', tag: 'h1', alignment: 'center', color: '#D4AF37', fontSize: '28' },
          },
          {
            order: 1,
            type: 'text-editor',
            props: {
              content: '<p>درگاه پرداخت طلایی زرین گلد به کسب‌وکارها اجازه می‌دهد پرداخت‌های آنلاین خود را با طلای دیجیتال دریافت کنند. با یکپارچه‌سازی ساده و امن، مشتریان شما می‌توانند به‌راحتی با طلای دیجیتال پرداخت کنند.</p>',
              fontSize: '16',
              color: '#e2e8f0',
              alignment: 'center',
            },
          },
          {
            order: 2,
            type: 'heading',
            props: { text: 'نحوه شروع کار', tag: 'h2', alignment: 'center', color: '#ffffff', fontSize: '22' },
          },
          {
            order: 3,
            type: 'features-grid',
            props: {
              heading: '',
              subtitle: '',
              columns: '4',
              items: [
                { icon: 'UserPlus', title: 'ثبت‌نام', description: 'ثبت‌نام در پنل درگاه و تکمیل اطلاعات کسب‌وکار' },
                { icon: 'Key', title: 'دریافت API', description: 'دریافت کلید API و مستندات فنی یکپارچه‌سازی' },
                { icon: 'Link', title: 'اتصال سایت', description: 'نصب ماژول یا استفاده از API در وب‌سایت' },
                { icon: 'Coins', title: 'دریافت پرداخت', description: 'پرداخت‌های طلایی مشتریان را دریافت کنید' },
              ],
            },
          },
          {
            order: 4,
            type: 'spacer',
            props: { height: '30' },
          },
          {
            order: 5,
            type: 'heading',
            props: { text: 'ویژگی‌های درگاه طلایی', tag: 'h2', alignment: 'center', color: '#ffffff', fontSize: '22' },
          },
          {
            order: 6,
            type: 'features-grid',
            props: {
              heading: '',
              subtitle: '',
              columns: '2',
              items: [
                { icon: 'Zap', title: 'پرداخت آنی', description: 'تراکنش‌ها در کمتر از ۳ ثانیه تأیید و تسویه می‌شوند' },
                { icon: 'ShieldCheck', title: 'امنیت بالا', description: 'رمزنگاری AES-256 و تأیید هویت دو مرحله‌ای' },
                { icon: 'Percent', title: 'کارمزد پایین', description: 'کمترین کارمزد در بازار — از ۰.۵٪ شروع' },
                { icon: 'Headphones', title: 'پشتیبانی ۲۴/۷', description: 'تیم فنی همیشه آماده پاسخگویی و رفع مشکل' },
              ],
            },
          },
          {
            order: 7,
            type: 'spacer',
            props: { height: '30' },
          },
          {
            order: 8,
            type: 'heading',
            props: { text: 'نمونه کد یکپارچه‌سازی', tag: 'h2', alignment: 'center', color: '#ffffff', fontSize: '22' },
          },
          {
            order: 9,
            type: 'text-editor',
            props: {
              content: '<pre style="direction:ltr;text-align:left;background:#1a1a2e;padding:20px;border-radius:12px;overflow-x:auto;font-family:monospace;font-size:13px;line-height:1.6;color:#e2e8f0"><code>// نصب SDK\n// npm install @zarringold/payment-sdk\n\nimport { ZarinGoldPayment } from \'@zarringold/payment-sdk\';\n\nconst payment = new ZarinGoldPayment({\n  apiKey: \'YOUR_API_KEY\',\n  environment: \'production\',\n  callbackUrl: \'https://yoursite.ir/payment/callback\',\n});\n\n// ایجاد تراکنش\nconst transaction = await payment.create({\n  amount: 500000,      // مبلغ به ریال\n  currency: \'gold\',     // پرداخت با طلای دیجیتال\n  orderId: \'ORD-12345\',\n  description: \'خرید محصول\',\n  metadata: {\n    customerName: \'علی محمدی\',\n    customerEmail: \'ali@example.com\',\n  },\n});\n\n// هدایت کاربر به صفحه پرداخت\nwindow.location.href = transaction.paymentUrl;\n\n// بررسی وضعیت تراکنش\nconst status = await payment.verify(transaction.id);\nconsole.log(status.isPaid);  // true / false</code></pre>',
              fontSize: '14',
              color: '#e2e8f0',
              alignment: 'center',
            },
          },
          {
            order: 10,
            type: 'spacer',
            props: { height: '30' },
          },
          {
            order: 11,
            type: 'heading',
            props: { text: 'پلن‌های درگاه پرداخت', tag: 'h2', alignment: 'center', color: '#ffffff', fontSize: '22' },
          },
          {
            order: 12,
            type: 'features-grid',
            props: {
              heading: '',
              subtitle: '',
              columns: '3',
              items: [
                { icon: 'Rocket', title: 'پایه', description: 'کارمزد ۰.۵٪ — تا ۱۰ میلیون تراکنش ماهانه — پشتیبانی تیکت — مناسب کسب‌وکارهای کوچک' },
                { icon: 'Crown', title: 'حرفه‌ای', description: 'کارمزد ۰.۳٪ — تا ۱۰۰ میلیون تراکنش ماهانه — پشتیبانی اختصاصی — وب‌هوک و API پیشرفته' },
                { icon: 'Building2', title: 'سازمانی', description: 'کارمزد سفارشی — تراکنش نامحدود — مدیر حساب اختصاصی — SLA ۹۹.۹٪ — یکپارچه‌سازی سفارشی' },
              ],
            },
          },
          {
            order: 13,
            type: 'spacer',
            props: { height: '30' },
          },
          {
            order: 14,
            type: 'faq-section',
            props: {
              heading: 'سوالات متداول درگاه پرداخت',
              items: [
                { question: 'درگاه پرداخت طلایی چیست؟', answer: 'درگاهی که به مشتریان شما اجازه می‌دهد با طلای دیجیتال حساب زرین گلد خود پرداخت کنند. معادل ریالی بلافاصله به حساب شما واریز می‌شود.' },
                { question: 'نحوه یکپارچه‌سازی چطور است؟', answer: 'با استفاده از SDK موجود یا API RESTful می‌توانید درگاه را در هر پلتفرمی (ورپرس، جوملا، لاراول، ری‌اکت و ...) نصب کنید. مستندات کامل و نمونه کد در پنل درگاه موجود است.' },
                { question: 'کارمزد تراکنش‌ها چقدر است؟', answer: 'کارمزد بسته به پلن انتخابی از ۰.۵٪ تا سفارشی متغیر است. تسویه‌حساب روزانه و خودکار انجام می‌شود.' },
                { question: 'آیا پشتیبانی از محیط تستی وجود دارد؟', answer: 'بله، با ثبت‌نام رایگان به محیط Sandbox (تست) با کلید API آزمایشی دسترسی خواهید داشت.' },
              ],
            },
          },
          {
            order: 15,
            type: 'cta-section',
            props: {
              heading: 'همین الان شروع کنید',
              subtitle: 'ثبت‌نام رایگان و دریافت کلید API در کمتر از ۵ دقیقه',
              buttonText: 'ثبت‌نام و دریافت API',
              backgroundStyle: 'gradient',
            },
          },
        ],
      },

      // ─────────────────── BLOG PAGE ───────────────────
      {
        slug: 'blog',
        title: 'بلاگ زرین گلد',
        isPublished: true,
        seoTitle: 'بلاگ زرین گلد | اخبار، آموزش و تحلیل بازار طلا',
        seoDesc: 'آخرین اخبار بازار طلا، آموزش سرمایه‌گذاری در طلا و تحلیل‌های تخصصی',
        content: '',
        components: [
          {
            order: 0,
            type: 'heading',
            props: { text: 'بلاگ زرین گلد', tag: 'h1', alignment: 'center', color: '#D4AF37', fontSize: '28' },
          },
          {
            order: 1,
            type: 'text-editor',
            props: {
              content: '<p>به بلاگ زرین گلد خوش آمدید. اینجا می‌توانید آخرین اخبار بازار طلا، مقالات آموزشی سرمایه‌گذاری و تحلیل‌های تخصصی را مطالعه کنید.</p>',
              fontSize: '16',
              color: '#e2e8f0',
              alignment: 'center',
            },
          },
          {
            order: 2,
            type: 'text-editor',
            props: {
              content: '<p style="text-align:right">✨ <strong>به زرین گلد خوش آمدید!</strong> ما در اینجا مقالاتی درباره سرمایه‌گذاری هوشمند در طلا، بررسی روند بازار جهانی و داخلی، نکات آموزشی برای مبتدیان و حرفه‌ای‌ها و مصاحبه با متخصصان بازار سرمایه منتشر می‌کنیم. با عضویت در خبرنامه، آخرین مقالات را در ایمیل خود دریافت کنید.</p>',
              fontSize: '14',
              color: '#cbd5e1',
              alignment: 'right',
            },
          },
          {
            order: 3,
            type: 'spacer',
            props: { height: '20' },
          },
          {
            order: 4,
            type: 'heading',
            props: { text: 'دسته‌بندی مقالات', tag: 'h2', alignment: 'center', color: '#ffffff', fontSize: '22' },
          },
          {
            order: 5,
            type: 'features-grid',
            props: {
              heading: '',
              subtitle: '',
              columns: '3',
              items: [
                { icon: 'Newspaper', title: 'اخبار طلا', description: 'آخرین اخبار بازار طلای ایران و جهان، نوسانات قیمت و تحولات اقتصادی مؤثر بر بازار' },
                { icon: 'GraduationCap', title: 'آموزش', description: 'مقالات آموزشی سرمایه‌گذاری در طلا، راهنمای مبتدیان و نکات حرفه‌ای مدیریت سبد دارایی' },
                { icon: 'TrendingUp', title: 'تحلیل بازار', description: 'تحلیل‌های تکنیکال و فاندامنتال بازار طلا، پیش‌بینی قیمت و بررسی روندهای آینده' },
              ],
            },
          },
          {
            order: 6,
            type: 'spacer',
            props: { height: '30' },
          },
          {
            order: 7,
            type: 'cta-section',
            props: {
              heading: 'عضویت در خبرنامه',
              subtitle: 'آخرین مقالات و اخبار بازار طلا را در ایمیل خود دریافت کنید',
              buttonText: 'عضویت در خبرنامه',
              backgroundStyle: 'gradient',
            },
          },
        ],
      },

      // ─────────────────── PRICING PAGE ───────────────────
      {
        slug: 'pricing',
        title: 'تعرفه‌ها و کارمزد',
        isPublished: true,
        seoTitle: 'تعرفه‌ها و کارمزد زرین گلد | جدول کامل قیمت‌ها',
        seoDesc: 'تعرفه‌های معاملات طلای دیجیتال، کارمزد خرید و فروش، پلن‌های کاربری و مقایسه سطوح خدمات',
        content: '',
        components: [
          {
            order: 0,
            type: 'heading',
            props: { text: 'تعرفه‌ها و کارمزد', tag: 'h1', alignment: 'center', color: '#D4AF37', fontSize: '28' },
          },
          {
            order: 1,
            type: 'text-editor',
            props: {
              content: '<p>زرین گلد با شفافیت کامل، تعرفه‌های خدمات خود را منتشر کرده تا شما پیش از هر معامله، از هزینه‌ها مطلع شوید.</p>',
              fontSize: '16',
              color: '#e2e8f0',
              alignment: 'center',
            },
          },
          {
            order: 2,
            type: 'spacer',
            props: { height: '20' },
          },
          {
            order: 3,
            type: 'heading',
            props: { text: 'سطوح کاربری', tag: 'h2', alignment: 'center', color: '#ffffff', fontSize: '22' },
          },
          {
            order: 4,
            type: 'card',
            props: {
              title: '🥉 سطح برنز',
              description: 'کارمزد خرید ۰.۵٪ — کارمزد فروش ۰.۵٪ — حداقل خرید ۰.۰۱۵ گرم — حداکثر تراکنش روزانه ۵ میلیون تومان — پشتیبانی تیکت — مناسب شروع سرمایه‌گذاری',
              image: '',
              showButton: false,
            },
          },
          {
            order: 5,
            type: 'card',
            props: {
              title: '🥈 سطح نقره',
              description: 'کارمزد خرید ۰.۳٪ — کارمزد فروش ۰.۴٪ — حداقل خرید ۰.۰۱ گرم — حداکثر تراکنش روزانه ۵۰ میلیون تومان — پس‌انداز خودکار — هشدار قیمت — پشتیبانی تلگرام — مناسب سرمایه‌گذاران متوسط',
              image: '',
              showButton: false,
            },
          },
          {
            order: 6,
            type: 'card',
            props: {
              title: '🥇 سطح طلا',
              description: 'کارمزد خرید ۰.۱۵٪ — کارمزد فروش ۰.۲٪ — حداقل خرید بدون محدودیت — حداکثر تراکنش بدون محدودیت — API اختصاصی — درگاه پرداخت طلایی — کارت طلایی — مشاور اختصاصی — مناسب سرمایه‌گذاران حرفه‌ای و سازمانی',
              image: '',
              showButton: false,
            },
          },
          {
            order: 7,
            type: 'spacer',
            props: { height: '30' },
          },
          {
            order: 8,
            type: 'heading',
            props: { text: 'جدول مقایسه سطوح', tag: 'h2', alignment: 'center', color: '#ffffff', fontSize: '22' },
          },
          {
            order: 9,
            type: 'table',
            props: {
              headers: 'ویژگی,برنز,نقره,طلا',
              rows: 'کارمزد خرید,۰.۵٪,۰.۳٪,۰.۱۵٪\nکارمزد فروش,۰.۵٪,۰.۴٪,۰.۲٪\nحداقل خرید,۰.۰۱۵ گرم,۰.۰۱ گرم,بدون محدودیت\nحداکثر تراکنش روزانه,۵ میلیون,۵۰ میلیون,نامحدود\nپشتیبانی تیکت,✅,✅,✅\nپشتیبانی تلگرام,❌,✅,✅\nپس‌انداز خودکار,❌,✅,✅\nهشدار قیمت,❌,✅,✅\nAPI اختصاصی,❌,❌,✅\nدرگاه پرداخت طلایی,❌,❌,✅\nکارت طلایی,❌,❌,✅\nمشاور اختصاصی,❌,❌,✅',
              bordered: true,
              striped: true,
            },
          },
          {
            order: 10,
            type: 'spacer',
            props: { height: '30' },
          },
          {
            order: 11,
            type: 'faq-section',
            props: {
              heading: 'سوالات متداول تعرفه‌ها',
              items: [
                { question: 'چطور سطح کاربری‌ام ارتقا می‌یابد؟', answer: 'سطح کاربری بر اساس حجم معاملات ۳۰ روز اخیر خودکار ارتقا می‌یابد. از سطح برنز با خرید اول شروع می‌کنید.' },
                { question: 'آیا کارمزد اضافه‌ای وجود دارد؟', answer: 'خیر، فقط کارمزد خرید و فروش stated در تعرفه‌ها. واریز ریالی و برداشت ریالی رایگان است. برداشت طلای فیزیکی هزینه ارسال جداگانه دارد.' },
                { question: 'آیا تعرفه‌ها قابل تغییر هستند؟', answer: 'تعرفه‌ها ثابت هستند و تغییرات فقط با اطلاع‌رسانی حداقل ۱۵ روزه اعمال می‌شود. تاریخچه تغییرات در بخش قوانین قابل مشاهده است.' },
                { question: 'کارمزد درگاه پرداخت طلایی جداگانه است؟', answer: 'بله، کارمزد درگاه پرداخت طلایی بر اساس پلن درگاه جداگانه محاسبه می‌شود و ربطی به سطح کاربری معاملاتی ندارد.' },
              ],
            },
          },
          {
            order: 12,
            type: 'cta-section',
            props: {
              heading: 'شروع سرمایه‌گذاری',
              subtitle: 'ثبت‌نام رایگان و شروع خرید طلا با کمترین کارمزد بازار',
              buttonText: 'ثبت‌نام رایگان',
              backgroundStyle: 'gradient',
            },
          },
        ],
      },
    ];

    const results: { slug: string; title: string; componentCount: number }[] = [];

    for (const pageData of pagesData) {
      // Upsert the page
      const page = await db.cMSPage.upsert({
        where: { slug: pageData.slug },
        update: {
          title: pageData.title,
          seoTitle: pageData.seoTitle,
          seoDesc: pageData.seoDesc,
          isPublished: pageData.isPublished,
          content: pageData.content,
        },
        create: {
          slug: pageData.slug,
          title: pageData.title,
          seoTitle: pageData.seoTitle,
          seoDesc: pageData.seoDesc,
          isPublished: pageData.isPublished,
          content: pageData.content,
        },
      });

      // Delete existing components
      await db.cMSComponent.deleteMany({
        where: { pageId: page.id },
      });

      // Create new components
      for (const comp of pageData.components) {
        await db.cMSComponent.create({
          data: {
            pageId: page.id,
            type: comp.type,
            order: comp.order,
            props: JSON.stringify(comp.props),
          },
        });
      }

      results.push({
        slug: page.slug,
        title: page.title,
        componentCount: pageData.components.length,
      });
    }

    return NextResponse.json({
      success: true,
      message: `${results.length} pages seeded successfully`,
      pages: results,
    });
  } catch (error) {
    console.error('CMS seed-pages error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد صفحات و کامپوننت‌ها', error: String(error) },
      { status: 500 },
    );
  }
}

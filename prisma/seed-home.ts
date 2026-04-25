import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const content = JSON.stringify({
    /* ── 1. Hero Section ── */
    hero_badge: "امنیت و اعتماد شما اولویت ماست",
    hero_title: "سرمایه‌گذاری هوشمند در طلا",
    hero_subtitle: "خرید، فروش و پس‌انداز طلای نوین با کمترین کارمزد و بالاترین امنیت",
    hero_btn_primary: "شروع کنید",
    hero_btn_secondary: "بیشتر بدانید",
    stats: [
      { label: "کاربر فعال", value: "۱۰۰,۰۰۰+" },
      { label: "میلیارد تومان معامله", value: "۵,۰۰۰+" },
      { label: "آپتایم", value: "۹۹.۹٪" },
    ],

    /* ── 2. Features Section ── */
    features_badge: "ویژگی‌ها",
    features_title: "چرا زرین گلد؟",
    features_subtitle: "با امکانات پیشرفته و امنیتی که ارائه می‌دهیم، تجربه معاملات طلای آنلاین خود را به سطح جدیدی ببرید.",
    features: [
      { icon: "Shield", title: "امنیت بالا", desc: "دارایی‌های شما با بالاترین استانداردهای امنیتی محافظت می‌شود" },
      { icon: "TrendingUp", title: "کارمزد کم", desc: "خرید و فروش طلا با کمترین کارمزد در بازار" },
      { icon: "Zap", title: "معاملات لحظه‌ای", desc: "خرید و فروش آنی طلا با قیمت لحظه بازار" },
      { icon: "Headphones", title: "پشتیبانی ۲۴/۷", desc: "تیم پشتیبانی ما ۲۴ ساعته در خدمت شماست" },
      { icon: "Smartphone", title: "رابط کاربری ساده", desc: "طراحی ساده و کاربرپسند برای همه افراد" },
      { icon: "Gift", title: "پاداش دعوت", desc: "با دعوت دوستان خود طلا و جایزه بگیرید" },
    ],

    /* ── 3. How It Works Section ── */
    hiw_badge: "نحوه کار",
    hiw_title: "چطور کار می‌کنه؟",
    hiw_subtitle: "با چند قدم ساده، سرمایه‌گذاری در طلا رو شروع کنید",
    steps: [
      { title: "ثبت‌نام سریع", desc: "فقط با شماره موبایل در کمتر از ۳۰ ثانیه ثبت‌نام کنید" },
      { title: "احراز هویت", desc: "با ارسال مدارک هویتی، حساب خود را تأیید کنید" },
      { title: "شارژ کیف پول", desc: "مبلغ دلخواه را به کیف پول خود واریز کنید" },
      { title: "خرید طلا", desc: "با بهترین قیمت و کمترین کارمزد طلا بخرید" },
    ],

    /* ── 4. Pricing Section ── */
    pricing_badge: "کارمزدها",
    pricing_title: "تعرفه‌های خدمات",
    pricing_subtitle: "شفافیت کامل در هزینه‌ها — بدون هزینه پنهان",
    fee_buy: "۰.۵٪",
    fee_sell: "۰.۳٪",
    plans: [
      {
        name: "برنزی",
        badge: "پایه",
        price: "رایگان",
        popular: false,
        features: ["خرید و فروش طلا", "کیف پول ریالی", "تاریخچه معاملات"],
      },
      {
        name: "نقره‌ای",
        badge: "ماهانه",
        price: "رایگان",
        popular: true,
        features: ["تمام امکانات برنزی", "کارمزد کمتر", "تحلیل بازار", "هشدار قیمت"],
      },
      {
        name: "طلایی",
        badge: "ماهانه",
        price: "رایگان",
        popular: false,
        features: ["تمام امکانات", "تحلیل بازار", "امتیاز VIP", "هشدار قیمت"],
      },
    ],

    /* ── 5. Testimonials Section ── */
    testimonials_badge: "نظرات کاربران",
    testimonials_title: "کاربران زرین گلد چه می‌گویند",
    testimonials_subtitle: "تجربه واقعی کاربران ما از سرمایه‌گذاری در طلا",
    testimonials_stats: [
      { value: "۵۰,۰۰۰+", label: "کاربر فعال" },
      { value: "۹۸٪", label: "رضایت" },
      { value: "۴.۸", label: "امتیاز" },
      { value: "۱۰۰+", label: "نظر" },
    ],
    testimonials: [
      {
        name: "علی محمدی",
        role: "سرمایه‌گذار حرفه‌ای",
        text: "از وقتی زرین گلد رو شناختم، خرید و فروش طلا برام خیلی راحت‌تر شده. کارمزد خیلی کمه و سرعت معاملات فوق‌العاده‌ست.",
      },
      {
        name: "سارا احمدی",
        role: "معاملهگر فعال",
        text: "بهترین پلتفرم خرید و فروش طلا. پشتیبانی عالی و رابط کاربری ساده‌ای داره.",
      },
      {
        name: "محمد رضایی",
        role: "مدیر مالی",
        text: "برای شرکت ما ابزار مدیریت طلا بسیار کاربردی بوده. به تیم زرین گلد افتخار می‌کنم.",
      },
    ],

    /* ── 6. FAQ Section ── */
    faq_badge: "راهنما",
    faq_title: "سوالات متداول",
    faq_subtitle: "پاسخ سوالات رایج درباره زرین گلد",
    faqs: [
      { question: "چطور می‌تونم طلا بخرم؟", answer: "پس از ثبت‌نام و احراز هویت، کیف پول خود را شارژ کرده و با یک کلیک طلا بخرید." },
      { question: "آیا طلا من واقعی است؟", answer: "بله، معادل هر گرم طلا در سیستم ما ذخیره شده و قابل استرداد است." },
      { question: "کارمزد معاملات چقدر است؟", answer: "خرید طلا ۰.۵٪ و فروش طلا ۰.۳٪ کارمزد دارد." },
      { question: "چطور پولم رو برداشت کنم؟", answer: "از بخش کیف پول، مبلغ دلخواه را به حساب بانکی خود برداشت کنید." },
      { question: "آیا محدودیت معامله وجود دارد؟", answer: "حداقل خرید ۵۰,۰۰۰ تومان و حداقل فروش ۰.۰۱ گرم طلا می‌باشد." },
      { question: "پشتیبانی چطور کار می‌کنه؟", answer: "از بخش پشتیبانی تیکت ارسال کنید یا با ما تماس بگیرید." },
    ],

    /* ── 7. Security Section ── */
    security_badge: "امنیت و اعتماد",
    security_title: "سرمایه شما در امان است",
    security_subtitle: "با بالاترین استانداردهای امنیتی، سرمایه شما محافظت می‌شود",
    security_features: [
      { icon: "Lock", title: "رمزگذاری پیشرفته", desc: "تمام اطلاعات شما با رمزنگاری AES-256 محافظت می‌شود" },
      { icon: "Landmark", title: "ذخیره امن طلا", desc: "طلاهای شما در صندوق‌های امن بانکی نگهداری می‌شود" },
      { icon: "ShieldCheck", title: "احراز هویت دو مرحله‌ای", desc: "با تایید دو مرحله‌ای، امنیت حساب تضمین می‌شود" },
      { icon: "BadgeCheck", title: "بیمه سرمایه", desc: "تمام موجودی شما تحت پوشش بیمه قرار دارد" },
      { icon: "Activity", title: "مانیتورینگ ۲۴ ساعته", desc: "تیم امنیتی ما به صورت شبانه‌روزی سیستم را بررسی می‌کند" },
      { icon: "FileCheck", title: "مجوز رسمی", desc: "مجوز فعالیت از سازمان بورس و اوراق بهادار" },
    ],
    trust_badges: [
      { icon: "Landmark", label: "مورد تایید بانک مرکزی" },
      { icon: "Building2", label: "عضو اتاق بازرگانی" },
      { icon: "Award", label: "ISO 27001" },
      { icon: "ShieldCheck", label: "گواهینامه PCI DSS" },
    ],

    /* ── 8. Trust Section ── */
    trust_badge: "مورد اعتماد",
    trust_title: "مورد اعتماد نهادهای معتبر",
    trust_subtitle: "همکاری با معتبرترین نهادهای مالی کشور",
    trust_stats: [
      { value: "۱,۰۰۰,۰۰۰+", label: "تراکنش موفق" },
      { value: "۹۸٪", label: "رضایت کاربران" },
      { value: "۲۴/۷", label: "پشتیبانی" },
      { value: "۵ سال", label: "فعالیت" },
    ],
    partners: [
      { icon: "Landmark", name: "بانک مرکزی", desc: "همکاری رسمی با بانک مرکزی جمهوری اسلامی ایران" },
      { icon: "BarChart3", name: "بورس کالا", desc: "عضو رسمی بورس کالا و فرابورس ایران" },
      { icon: "Building2", name: "اتاق بازرگانی", desc: "عضویت رسمی در اتاق بازرگانی ایران" },
      { icon: "ShieldCheck", name: "شرکت بیمه", desc: "پوشش بیمه‌ای کامل دارایی‌ها" },
    ],

    /* ── 9. CTA Section ── */
    cta_badge: "شروع کنید",
    cta_title: "همین الان سرمایه‌گذاری کنید",
    cta_subtitle: "با ثبت‌نام رایگان، اولین خرید طلا خود را با کمترین کارمزد انجام دهید",
    cta_button: "همین الان شروع کنید",
    cta_highlights: [
      { icon: "UserPlus", title: "ثبت‌نام رایگان" },
      { icon: "Percent", title: "کارمزد از ۰.۳٪" },
      { icon: "Headphones", title: "پشتیبانی ۲۴/۷" },
    ],

    /* ── 10. Gateway Section ── */
    gateway_badge: "درگاه پرداخت طلایی",
    gateway_title: "درگاه پرداخت طلایی",
    gateway_desc: "پذیرندگان و فروشندگان محترم، درگاه پرداخت طلایی زرین گلد را در سایت خود نصب کنید و مشتریانتان با طلای دیجیتال پرداخت کنند.",
    gateway_button: "اطلاعات بیشتر",
    gateway_features: [
      { icon: "Percent", label: "کارمزد ۱٪" },
      { icon: "Zap", label: "پرداخت آنی" },
      { icon: "Code", label: "API ساده" },
    ],
  });

  const result = await prisma.cMSPage.upsert({
    where: { slug: 'home' },
    update: {
      title: 'صفحه اصلی',
      content,
      seoTitle: 'زرین گلد — سرمایه‌گذاری هوشمند در طلا',
      seoDesc: 'خرید، فروش و پس‌انداز طلای نوین با کمترین کارمزد و بالاترین امنیت',
      isPublished: true,
    },
    create: {
      slug: 'home',
      title: 'صفحه اصلی',
      content,
      seoTitle: 'زرین گلد — سرمایه‌گذاری هوشمند در طلا',
      seoDesc: 'خرید، فروش و پس‌انداز طلای نوین با کمترین کارمزد و بالاترین امنیت',
      isPublished: true,
    },
  });

  console.log(`✅ Home page seeded successfully (id: ${result.id}, slug: ${result.slug})`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

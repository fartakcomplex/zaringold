import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ZarinGold database...');

  // ── 1. Roles ──
  console.log('\n📋 Creating roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'super-admin' },
    update: {},
    create: {
      name: 'super-admin',
      label: 'مدیر کل',
      description: 'مدیر کل سیستم',
      isSystem: true,
      priority: 100,
    },
  });
  await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: { name: 'user', label: 'کاربر', description: 'کاربر عادی', isSystem: true },
  });

  // ── 2. Dev Super Admin User ──
  console.log('\n👤 Creating dev-super-admin...');
  const user = await prisma.user.upsert({
    where: { id: 'dev-super-admin' },
    update: {},
    create: {
      id: 'dev-super-admin',
      phone: '09120000000',
      email: 'admin@zaringold.ir',
      fullName: 'مدیر سیستم',
      password: '$2b$10$devhashedpassword00000000000000000000000000000000000000000000000',
      isActive: true,
      isVerified: true,
      role: 'super-admin',
      referralCode: 'DEVGOLD',
      roles: { create: { roleId: adminRole.id } },
      profile: {
        create: {
          nationalId: '0000000000',
          province: 'تهران',
          city: 'تهران',
        },
      },
    },
  });

  // ── 3. Wallet ──
  console.log('\n💰 Creating wallet...');
  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      balance: 10000000,
      frozenBalance: 0,
    },
  });

  // ── 4. Gold Wallet ──
  console.log('\n🥇 Creating gold wallet...');
  await prisma.goldWallet.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      goldGrams: 2.5,
      frozenGold: 0,
    },
  });

  // ── 5. Gold Card ──
  console.log('\n💳 Creating gold card...');
  const card = await prisma.goldCard.upsert({
    where: { cardNumber: '6219-865919-4973-6142' },
    update: {},
    create: {
      userId: user.id,
      cardNumber: '6219-865919-4973-6142',
      cvv: '123',
      expiryMonth: 12,
      expiryYear: 2029,
      pin: '1234',
      cardType: 'virtual',
      status: 'active',
      balanceFiat: 4475000,
      linkedGoldGram: 0.5,
      dailyLimit: 50000000,
      monthlyLimit: 500000000,
      spentToday: 0,
      spentThisMonth: 1250000,
      design: 'gold-gradient',
      expiresAt: new Date('2029-12-31'),
    },
  });

  // ── 6. Gold Card Transactions ──
  console.log('\n📊 Creating gold card transactions...');
  const txData = [
    { type: 'purchase', amount: 500000, goldGrams: 0.1, description: 'خرید طلا', daysAgo: 7 },
    { type: 'purchase', amount: 1500000, goldGrams: 0.3, description: 'خرید طلا', daysAgo: 5 },
    { type: 'refund', amount: 750000, goldGrams: 0.15, description: 'فروش طلا', daysAgo: 3 },
    { type: 'charge', amount: 2000000, goldGrams: 0.25, description: 'خرید طلا', daysAgo: 1 },
    { type: 'withdrawal', amount: 22500, goldGrams: 0, description: 'کش بک', daysAgo: 0 },
  ];
  for (const tx of txData) {
    await prisma.goldCardTransaction.create({
      data: {
        cardId: card.id,
        userId: user.id,
        type: tx.type,
        amount: tx.amount,
        goldGrams: tx.goldGrams,
        description: tx.description,
        status: 'completed',
        createdAt: new Date(Date.now() - tx.daysAgo * 86400000),
      },
    });
  }

  // ── 7. Gold Price ──
  console.log('\n📈 Setting gold prices...');
  const latestPrice = await prisma.goldPrice.create({
    data: {
      buyPrice: 8542500,
      sellPrice: 8457500,
      marketPrice: 8500000,
      ouncePrice: 26500000,
      spread: 85000,
      currency: 'IRR',
      isManual: false,
    },
  });

  // ── 8. Price History ──
  console.log('\n📊 Creating price history...');
  for (let i = 30; i >= 0; i--) {
    const price = 8300000 + Math.random() * 400000;
    await prisma.priceHistory.create({
      data: {
        price: Math.round(price),
        interval: '1h',
        openPrice: Math.round(price - 50000),
        closePrice: Math.round(price),
        highPrice: Math.round(price + 100000),
        lowPrice: Math.round(price - 150000),
        volume: Math.round(Math.random() * 1000),
        timestamp: new Date(Date.now() - i * 86400000),
      },
    });
  }

  // ── 9. Site Settings ──
  console.log('\n⚙️ Creating site settings...');
  const settings = [
    { key: 'site_name', value: 'زرین گلد', group: 'general', type: 'text', label: 'نام سایت' },
    { key: 'site_description', value: 'پلتفرم سرمایه‌گذاری هوشمند در طلا', group: 'general', type: 'textarea', label: 'توضیحات سایت' },
    { key: 'buy_fee', value: '0.5', group: 'trading', type: 'number', label: 'کارمزد خرید' },
    { key: 'sell_fee', value: '0.3', group: 'trading', type: 'number', label: 'کارمزد فروش' },
    { key: 'min_buy', value: '50000', group: 'trading', type: 'number', label: 'حداقل خرید' },
    { key: 'min_sell_gold', value: '0.01', group: 'trading', type: 'number', label: 'حداقل فروش طلا' },
    { key: 'support_phone', value: '021-91000000', group: 'support', type: 'text', label: 'تلفن پشتیبانی' },
    { key: 'support_email', value: 'support@zaringold.ir', group: 'support', type: 'text', label: 'ایمیل پشتیبانی' },
    { key: 'gold_reserve_available', value: 'true', group: 'reserve', type: 'boolean', label: 'فعال بودن ذخیره طلای فیزیکی' },
    { key: 'maintenance_mode', value: 'false', group: 'system', type: 'boolean', label: 'حالت نگهداری' },
  ];
  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { group_key: { group: s.group, key: s.key } },
      update: { value: s.value },
      create: s,
    });
  }

  // ── 10. Gamification ──
  console.log('\n🏆 Creating gamification...');
  await prisma.userGamification.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      xp: 500,
      level: 3,
      totalBadges: 5,
      currentStreak: 5,
      longestStreak: 12,
      checkInCount: 30,
      predictionScore: 0,
      referralCount: 0,
      lastCheckInAt: new Date(),
    },
  });

  // ── 11. Blog Categories ──
  console.log('\n📝 Creating blog categories...');
  const cats = [
    { name: 'تحلیل طلا', slug: 'gold-analysis', description: 'تحلیل قیمت و بازار طلا' },
    { name: 'سرمایه‌گذاری', slug: 'investment', description: 'راهنمای سرمایه‌گذاری در طلا' },
    { name: 'اخبار', slug: 'news', description: 'اخبار بازار طلا و اقتصاد' },
    { name: 'آموزش', slug: 'education', description: 'آموزش معاملات و سرمایه‌گذاری' },
  ];
  for (const cat of cats) {
    await prisma.blogCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // ── 12. Seed Home Page ──
  console.log('\n🏠 Seeding home page content...');
  const content = JSON.stringify({
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
    hiw_badge: "نحوه کار",
    hiw_title: "چطور کار می‌کنه؟",
    hiw_subtitle: "با چند قدم ساده، سرمایه‌گذاری در طلا رو شروع کنید",
    steps: [
      { title: "ثبت‌نام سریع", desc: "فقط با شماره موبایل در کمتر از ۳۰ ثانیه ثبت‌نام کنید" },
      { title: "احراز هویت", desc: "با ارسال مدارک هویتی، حساب خود را تأیید کنید" },
      { title: "شارژ کیف پول", desc: "مبلغ دلخواه را به کیف پول خود واریز کنید" },
      { title: "خرید طلا", desc: "با بهترین قیمت و کمترین کارمزد طلا بخرید" },
    ],
    pricing_badge: "کارمزدها",
    pricing_title: "تعرفه‌های خدمات",
    pricing_subtitle: "شفافیت کامل در هزینه‌ها — بدون هزینه پنهان",
    fee_buy: "۰.۵٪",
    fee_sell: "۰.۳٪",
    plans: [
      { name: "برنزی", badge: "پایه", price: "رایگان", popular: false, features: ["خرید و فروش طلا", "کیف پول ریالی", "تاریخچه معاملات"] },
      { name: "نقره‌ای", badge: "ماهانه", price: "رایگان", popular: true, features: ["تمام امکانات برنزی", "کارمزد کمتر", "تحلیل بازار", "هشدار قیمت"] },
      { name: "طلایی", badge: "ماهانه", price: "رایگان", popular: false, features: ["تمام امکانات", "تحلیل بازار", "امتیاز VIP", "هشدار قیمت"] },
    ],
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
      { name: "علی محمدی", role: "سرمایه‌گذار حرفه‌ای", text: "از وقتی زرین گلد رو شناختم، خرید و فروش طلا برام خیلی راحت‌تر شده." },
      { name: "سارا احمدی", role: "معاملهگر فعال", text: "بهترین پلتفرم خرید و فروش طلا. پشتیبانی عالی و رابط کاربری ساده‌ای داره." },
      { name: "محمد رضایی", role: "مدیر مالی", text: "برای شرکت ما ابزار مدیریت طلا بسیار کاربردی بوده." },
    ],
    faq_badge: "راهنما",
    faq_title: "سوالات متداول",
    faq_subtitle: "پاسخ سوالات رایج درباره زرین گلد",
    faqs: [
      { question: "چطور می‌تونم طلا بخرم؟", answer: "پس از ثبت‌نام و احراز هویت، کیف پول خود را شارژ کرده و با یک کلیک طلا بخرید." },
      { question: "آیا طلا من واقعی است؟", answer: "بله، معادل هر گرم طلا در سیستم ما ذخیره شده و قابل استرداد است." },
      { question: "کارمزد معاملات چقدر است؟", answer: "خرید طلا ۰.۵٪ و فروش طلا ۰.۳٪ کارمزد دارد." },
      { question: "چطور پولم رو برداشت کنم؟", answer: "از بخش کیف پول، مبلغ دلخواه را به حساب بانکی خود برداشت کنید." },
    ],
    security_badge: "امنیت و اعتماد",
    security_title: "سرمایه شما در امان است",
    security_subtitle: "با بالاترین استانداردهای امنیتی، سرمایه شما محافظت می‌شود",
    security_features: [
      { icon: "Lock", title: "رمزگذاری پیشرفته", desc: "تمام اطلاعات شما با رمزنگاری AES-256 محافظت می‌شود" },
      { icon: "Landmark", title: "ذخیره امن طلا", desc: "طلاهای شما در صندوق‌های امن بانکی نگهداری می‌شود" },
      { icon: "ShieldCheck", title: "احراز هویت دو مرحله‌ای", desc: "با تایید دو مرحله‌ای، امنیت حساب تضمین می‌شود" },
    ],
    trust_badge: "مورد اعتماد",
    trust_title: "مورد اعتماد نهادهای معتبر",
    trust_subtitle: "همکاری با معتبرترین نهادهای مالی کشور",
    trust_stats: [
      { value: "۱,۰۰۰,۰۰۰+", label: "تراکنش موفق" },
      { value: "۹۸٪", label: "رضایت کاربران" },
      { value: "۲۴/۷", label: "پشتیبانی" },
    ],
    cta_badge: "شروع کنید",
    cta_title: "همین الان سرمایه‌گذاری کنید",
    cta_subtitle: "با ثبت‌نام رایگان، اولین خرید طلا خود را با کمترین کارمزد انجام دهید",
    cta_button: "همین الان شروع کنید",
  });

  await prisma.cMSPage.upsert({
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

  console.log('\n✅ Database seeded successfully!');
  console.log(`   User: ${user.id}`);
  console.log(`   Gold Card: ${card.cardNumber}`);
  console.log(`   Gold Price: ${latestPrice.marketPrice} IRR/gram`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  ArrowLeft,
  Sparkles,
  Truck,
  Shield,
  RotateCcw,
  Headphones,
  Star,
  Send,
  MapPin,
  Phone,
  Mail,
  Instagram,
  ChevronUp,
  Heart,
  Package,
} from 'lucide-react';
import { Header } from '@/components/amanda/header';
import { CartDrawer } from '@/components/amanda/cart-drawer';
import { ProductCard } from '@/components/amanda/product-card';
import { ProductQuickView } from '@/components/amanda/product-quick-view';
import { products, categories, formatPrice } from '@/data/products';
import { Product } from '@/store/cart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true },
};

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [email, setEmail] = useState('');

  // Handle scroll for scroll-to-top button
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      setShowScrollTop(window.scrollY > 400);
    });
  }

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail('');
    // Show toast or feedback
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <CartDrawer />
      <ProductQuickView
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

      <main className="flex-1">
        {/* ============ HERO SECTION ============ */}
        <section className="relative overflow-hidden">
          <div className="relative h-[500px] sm:h-[550px] md:h-[600px] lg:h-[650px]">
            <Image
              src="/images/hero-banner.png"
              alt="آماندا کیدز"
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-white/90 via-white/70 to-white/30 dark:from-gray-900/90 dark:via-gray-900/70 dark:to-gray-900/30" />

            {/* Decorative shapes */}
            <div className="absolute top-20 left-10 w-24 h-24 bg-pink-200/30 dark:bg-pink-800/20 rounded-full blur-xl" />
            <div className="absolute bottom-20 right-20 w-32 h-32 bg-rose-200/30 dark:bg-rose-800/20 rounded-full blur-xl" />
            <div className="absolute top-40 left-1/3 w-16 h-16 bg-amber-200/30 dark:bg-amber-800/20 rounded-full blur-xl" />

            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-xl">
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Badge className="mb-4 bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300 px-4 py-1.5 rounded-full text-sm">
                      <Sparkles className="w-4 h-4 ml-1" />
                      کالکشن جدید زمستانه
                    </Badge>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-4"
                  >
                    <span className="bg-gradient-to-l from-pink-600 via-rose-500 to-pink-400 bg-clip-text text-transparent">
                      دنیای رنگارنگ
                    </span>
                    <br />
                    <span>لباس کودک</span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed max-w-md"
                  >
                    بهترین کیفیت پارچه، طراحی‌های فانتزی و قیمت مناسب برای فرشتگان کوچک شما
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-wrap gap-3"
                  >
                    <Button className="bg-gradient-to-l from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white rounded-full px-8 h-12 text-base font-semibold shadow-lg shadow-pink-500/25">
                      مشاهده محصولات
                      <ArrowLeft className="w-5 h-5 mr-2" />
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full px-8 h-12 text-base border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-950/30"
                    >
                      حراج ویژه
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ TRUST BADGES ============ */}
        <section className="bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {[
                { icon: Truck, title: 'ارسال رایگان', desc: 'سفارش بالای ۵۰۰ هزار تومان' },
                { icon: Shield, title: 'ضمانت اصالت', desc: 'تمامی محصولات اصل هستند' },
                { icon: RotateCcw, title: 'بازگشت آسان', desc: '۷ روز ضمانت بازگشت' },
                { icon: Headphones, title: 'پشتیبانی ۲۴/۷', desc: 'پاسخگویی همه روزه' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl text-center sm:text-right"
                >
                  <div className="w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-pink-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CATEGORIES ============ */}
        <section id="categories" className="py-16 md:py-20 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-800/20 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div {...fadeInUp} className="text-center mb-12">
              <Badge variant="outline" className="mb-3 text-xs">دسته‌بندی‌ها</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                خرید بر اساس{' '}
                <span className="bg-gradient-to-l from-pink-600 to-rose-500 bg-clip-text text-transparent">
                  دسته‌بندی
                </span>
              </h2>
              <p className="text-muted-foreground mt-2">بهترین محصولات را برای کودک دلبندتان انتخاب کنید</p>
            </motion.div>

            <motion.div {...staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {categories.map((cat) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`relative overflow-hidden rounded-2xl p-6 md:p-8 text-center transition-all duration-300 shadow-sm hover:shadow-xl border ${
                    activeCategory === cat.id
                      ? 'ring-2 ring-pink-400 border-pink-300 dark:border-pink-600'
                      : 'border-gray-100 dark:border-gray-800'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-10`} />
                  <div className="relative">
                    <span className="text-4xl md:text-5xl block mb-3">{cat.icon}</span>
                    <h3 className="font-bold text-base md:text-lg mb-1">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground">{cat.nameEn}</p>
                    <span className="mt-3 inline-block text-xs text-pink-500 font-medium">
                      {products.filter((p) => p.category === cat.id).length} محصول
                    </span>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ============ PRODUCTS ============ */}
        <section id="products" className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div {...fadeInUp} className="text-center mb-8">
              <Badge variant="outline" className="mb-3 text-xs">محصولات</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                محصولات{' '}
                <span className="bg-gradient-to-l from-pink-600 to-rose-500 bg-clip-text text-transparent">
                  ویژه
                </span>
              </h2>
              <p className="text-muted-foreground mt-2">جدیدترین و محبوب‌ترین محصولات ما</p>
            </motion.div>

            {/* Filter tabs */}
            <motion.div
              {...fadeInUp}
              className="flex flex-wrap items-center justify-center gap-2 mb-10"
            >
              <Button
                size="sm"
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setActiveCategory('all')}
                className={`rounded-full ${
                  activeCategory === 'all'
                    ? 'bg-gradient-to-l from-pink-600 to-rose-500 text-white'
                    : ''
                }`}
              >
                همه
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={activeCategory === cat.id ? 'default' : 'outline'}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`rounded-full ${
                    activeCategory === cat.id
                      ? 'bg-gradient-to-l from-pink-600 to-rose-500 text-white'
                      : ''
                  }`}
                >
                  {cat.icon} {cat.name}
                </Button>
              ))}
            </motion.div>

            {/* Product grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">محصولی یافت نشد</h3>
                <p className="text-muted-foreground">لطفاً دسته‌بندی دیگری را انتخاب کنید</p>
              </div>
            )}
          </div>
        </section>

        {/* ============ PROMO BANNER ============ */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-white dark:from-gray-900 via-pink-50/50 dark:via-pink-950/10 to-white dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              {...fadeInUp}
              className="relative overflow-hidden rounded-3xl shadow-2xl"
            >
              <div className="relative h-[300px] sm:h-[350px] md:h-[400px]">
                <Image
                  src="/images/promo-banner.png"
                  alt="تخفیف ویژه"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1280px) 100vw, 1280px"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-pink-600/80 to-rose-500/80" />
                <div className="absolute inset-0 flex items-center justify-center text-center text-white p-8">
                  <div>
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: 'spring', delay: 0.2 }}
                    >
                      <Badge className="bg-white/20 backdrop-blur-sm text-white mb-4 px-4 py-1.5 text-sm">
                        ⏰ پیشنهاد محدود
                      </Badge>
                    </motion.div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3">
                      تا ۴۰٪ تخفیف
                    </h2>
                    <p className="text-lg sm:text-xl opacity-90 mb-6 max-w-md mx-auto">
                      لباس‌های زمستانی با بهترین قیمت
                    </p>
                    <Button className="bg-white text-pink-600 hover:bg-gray-100 rounded-full px-8 h-12 text-base font-bold shadow-lg">
                      همین الان خرید کنید
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============ TESTIMONIALS ============ */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div {...fadeInUp} className="text-center mb-12">
              <Badge variant="outline" className="mb-3 text-xs">نظرات مشتریان</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                مشتریان{' '}
                <span className="bg-gradient-to-l from-pink-600 to-rose-500 bg-clip-text text-transparent">
                  راضی
                </span>{' '}
                ما
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: 'سارا محمدی',
                  text: 'کیفیت لباس‌ها فوق‌العاده‌ست! پارچه‌ها بسیار نرم و لطیف هستند و بچه‌ها عاشق طرح‌های فانتزی‌شان شدند.',
                  rating: 5,
                  avatar: '👩',
                },
                {
                  name: 'مریم احمدی',
                  text: 'ارسال خیلی سریع بود و بسته‌بندی عالی. لباس‌ها دقیقاً مثل عکس‌ها بودند. حتماً دوباره خرید می‌کنم.',
                  rating: 5,
                  avatar: '👩‍🦰',
                },
                {
                  name: 'زهرا کریمی',
                  text: 'قیمت‌ها نسبت به کیفیت خیلی مناسب‌تر از سایر فروشگاه‌هاست. پشتیبانی هم عالی و پاسخگو هستند.',
                  rating: 4,
                  avatar: '👩‍🦱',
                },
              ].map((review, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center text-2xl">
                      {review.avatar}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{review.name}</h4>
                      <div className="flex mt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-200 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    &ldquo;{review.text}&rdquo;
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ NEWSLETTER ============ */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-white dark:from-gray-900 to-pink-50/50 dark:to-pink-950/10">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              {...fadeInUp}
              className="bg-gradient-to-l from-pink-600 to-rose-500 rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl shadow-pink-500/20"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
                <Send className="w-8 h-8" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">عضویت در خبرنامه</h2>
              <p className="text-pink-100 mb-8 max-w-md mx-auto">
                از آخرین تخفیف‌ها و محصولات جدید باخبر شوید
              </p>
              <form
                onSubmit={handleSubscribe}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <Input
                  type="email"
                  placeholder="ایمیل خود را وارد کنید..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-pink-200 focus:border-white/60"
                  required
                  dir="ltr"
                />
                <Button
                  type="submit"
                  className="bg-white text-pink-600 hover:bg-gray-100 rounded-xl h-12 px-8 font-semibold flex-shrink-0"
                >
                  عضویت
                </Button>
              </form>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer id="contact" className="bg-gray-900 text-gray-300">
        {/* Main footer */}
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <div>
                  <h3 className="font-bold text-white">آماندا کیدز</h3>
                  <p className="text-xs text-gray-500">Amanda Kids</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                فروشگاه آنلاین لباس کودک و نوزاد با بهترین کیفیت و مناسب‌ترین قیمت. ما بهترین
                محصولات را برای فرشتگان کوچک شما ارائه می‌دهیم.
              </p>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-pink-600 flex items-center justify-center transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-pink-600 flex items-center justify-center transition-colors"
                >
                  <Send className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="font-semibold text-white mb-4">دسترسی سریع</h4>
              <ul className="space-y-2.5 text-sm">
                {['خانه', 'محصولات', 'حراج ویژه', 'وبلاگ', 'درباره ما'].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-pink-400 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-semibold text-white mb-4">دسته‌بندی‌ها</h4>
              <ul className="space-y-2.5 text-sm">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <a href="#" className="hover:text-pink-400 transition-colors">
                      {cat.icon} {cat.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-white mb-4">تماس با ما</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-pink-400 flex-shrink-0" />
                  <span>تهران، خیابان ولیعصر، پلاک ۱۲۳</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span dir="ltr">021-12345678</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span dir="ltr">info@amanda-kids.ir</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
            <p>© ۱۴۰۳ آماندا کیدز. تمامی حقوق محفوظ است.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-pink-400 transition-colors">
                قوانین و مقررات
              </a>
              <a href="#" className="hover:text-pink-400 transition-colors">
                حریم خصوصی
              </a>
              <a href="#" className="hover:text-pink-400 transition-colors">
                رویه بازگرداندن
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to top button */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 w-12 h-12 rounded-full bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/30 flex items-center justify-center z-50 transition-colors"
        >
          <ChevronUp className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  );
}

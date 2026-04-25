'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Search,
  Loader2,
  Sparkles,
  TrendingUp,
  GraduationCap,
  PiggyBank,
  Shield,
  CreditCard,
  Wrench,
  Scale,
  FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from '@/lib/framer-compat';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface SubPageProps {
  onBack: () => void;
  onViewPost?: (slug: string) => void;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  category: { name: string; slug: string; color: string } | null;
  readTime: number;
  isFeatured: boolean;
  publishedAt: string;
}

interface Category {
  name: string;
  slug: string;
  color: string;
  postCount: number;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Fallback Mock Data (used when API is unavailable)                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MOCK_FEATURED = {
  title: 'پیش‌بینی قیمت طلا در تابستان ۱۴۰۴: آیا صعود ادامه دارد؟',
  excerpt: 'تحلیل جامع بازار طلا در نیمه اول سال ۱۴۰۴. بررسی عوامل داخلی و بین‌المللی مؤثر بر قیمت طلا و پیش‌بینی روندهای آینده با استفاده از داده‌های تاریخی و مدل‌های هوش مصنوعی زرین گلد.',
  category: 'تحلیل بازار',
  date: 'خرداد ۱۴۰۴',
  readTime: '۸ دقیقه',
  image: '📊',
  slug: 'gold-price-forecast-summer-1404',
};

const MOCK_POSTS: BlogPost[] = [
  { id: '1', title: 'راهنمای کامل خرید آنلاین طلا در زرین گلد', slug: 'guide-to-buying-gold', excerpt: 'از ثبت‌نام تا اولین خرید — تمام مراحل را قدم به قدم توضیح داده‌ایم.', featuredImage: null, category: { name: 'آموزش', slug: 'education', color: '#3b82f6' }, readTime: 5, isFeatured: false, publishedAt: '2025-06-01' },
  { id: '2', title: 'مقایسه سرمایه‌گذاری طلا با ارز دیجیتال و بورس', slug: 'gold-vs-crypto-vs-stock', excerpt: 'کدام بازار در بلندمدت بازدهی بهتری دارد؟ تحلیل ریسک و بازده هر دارایی.', featuredImage: null, category: { name: 'تحلیل بازار', slug: 'market-analysis', color: '#D4AF37' }, readTime: 6, isFeatured: false, publishedAt: '2025-05-15' },
  { id: '3', title: 'پس‌انداز طلایی: چگونه با ۰.۰۱۵ گرم طلا روزانه طلا جمع کنیم؟', slug: 'daily-gold-savings', excerpt: 'استراتژی پس‌انداز خودکار زرین گلد و تأثیر آن در بلندمدت با محاسبه سود مرکب.', featuredImage: null, category: { name: 'پس‌انداز', slug: 'savings', color: '#22c55e' }, readTime: 4, isFeatured: false, publishedAt: '2025-05-10' },
  { id: '4', title: 'امنیت کیف پول طلایی: چگونه طلای دیجیتال خود را ایمن نگه داریم؟', slug: 'gold-wallet-security', excerpt: 'معرفی لایه‌های امنیتی زرین گلد و نکات مهم برای حفاظت از حساب کاربری.', featuredImage: null, category: { name: 'امنیت', slug: 'security', color: '#ef4444' }, readTime: 5, isFeatured: false, publishedAt: '2025-04-20' },
  { id: '5', title: 'تأثیر نرخ بهره آمریکا بر قیمت طلا در ایران', slug: 'us-interest-rate-gold', excerpt: 'تحلیل تأثیر تصمیمات فدرال رزرو بر بازار طلای داخلی و نحوه واکنش سرمایه‌گذاران.', featuredImage: null, category: { name: 'تحلیل بازار', slug: 'market-analysis', color: '#D4AF37' }, readTime: 7, isFeatured: false, publishedAt: '2025-04-10' },
  { id: '6', title: 'معرفی کارت طلایی زرین گلد: خرید با طلای خودتان', slug: 'gold-card-intro', excerpt: 'ویژگی‌ها، مزایا و نحوه استفاده از کارت طلایی برای خریدهای روزمره.', featuredImage: null, category: { name: 'محصول', slug: 'product', color: '#a855f7' }, readTime: 3, isFeatured: false, publishedAt: '2025-03-15' },
  { id: '7', title: 'وام طلایی: شرایط، نرخ بهره و مراحل درخواست', slug: 'gold-loan-guide', excerpt: 'راهنمای کامل دریافت وام با وثیقه طلای دیجیتال و مقایسه با وام‌های بانکی.', featuredImage: null, category: { name: 'خدمات', slug: 'services', color: '#f59e0b' }, readTime: 5, isFeatured: false, publishedAt: '2025-03-01' },
  { id: '8', title: 'نکات مهم مالیاتی در خرید و فروش طلای دیجیتال', slug: 'gold-tax-tips', excerpt: 'آیا معاملات طلای دیجیتال مشمول مالیات است؟ بررسی قوانین مالیاتی فعلی.', featuredImage: null, category: { name: 'قوانین', slug: 'regulations', color: '#64748b' }, readTime: 4, isFeatured: false, publishedAt: '2025-02-20' },
];

const MOCK_CATEGORIES: Category[] = [
  { name: 'همه', slug: '', color: '#D4AF37', postCount: 24 },
  { name: 'تحلیل بازار', slug: 'market-analysis', color: '#D4AF37', postCount: 8 },
  { name: 'آموزش', slug: 'education', color: '#3b82f6', postCount: 6 },
  { name: 'پس‌انداز', slug: 'savings', color: '#22c55e', postCount: 4 },
  { name: 'امنیت', slug: 'security', color: '#ef4444', postCount: 3 },
  { name: 'محصول', slug: 'product', color: '#a855f7', postCount: 2 },
  { name: 'خدمات', slug: 'services', color: '#f59e0b', postCount: 1 },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  '': Sparkles,
  'market-analysis': TrendingUp,
  'education': GraduationCap,
  'savings': PiggyBank,
  'security': Shield,
  'product': CreditCard,
  'services': Wrench,
  'regulations': Scale,
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatPersianDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
    }).format(date);
  } catch {
    return dateStr;
  }
}

function getCategoryBadgeStyle(color: string): string {
  return `bg-[${color}]/10 text-[${color}]`;
}

const POST_EMOJIS = ['📊', '📈', '💰', '🔒', '🌍', '💳', '🏦', '📋', '🎓', '💎', '⭐', '🔔'];

function getPostEmoji(id: string): string {
  const idx = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return POST_EMOJIS[idx % POST_EMOJIS.length];
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeletons                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function FeaturedSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="-mt-4 overflow-hidden rounded-2xl border border-border/50 bg-card p-6 md:p-8">
        <Skeleton className="mb-4 h-6 w-24" />
        <div className="flex items-start gap-4 md:gap-6">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <Skeleton className="hidden size-24 rounded-2xl sm:block" />
        </div>
      </div>
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>
    </div>
  );
}

function PostsGridSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border/50 bg-card">
            <Skeleton className="h-40 w-full" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Blog Page                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function BlogPage({ onBack, onViewPost }: SubPageProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);

  /* Fetch posts */
  const fetchPosts = useCallback(async (category?: string, search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '12', page: '1' });
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      const res = await fetch(`/api/blog/posts?${params.toString()}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const postList: BlogPost[] = data.posts || data || [];
      setPosts(postList);
      setFeaturedPost(postList.find((p: BlogPost) => p.isFeatured) || postList[0] || null);
      setApiAvailable(true);
    } catch {
      // Fallback to mock data
      setApiAvailable(false);
      const filtered = search
        ? MOCK_POSTS.filter(
            (p) =>
              p.title.includes(search) || p.excerpt.includes(search)
          )
        : category
          ? MOCK_POSTS.filter(
              (p) => p.category?.slug === category
            )
          : MOCK_POSTS;
      setPosts(filtered);
      setFeaturedPost(
        filtered.find((p) => p.isFeatured) || filtered[0] || null
      );
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  /* Fetch categories */
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/blog/categories');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setCategories([{ name: 'همه', slug: '', color: '#D4AF37', postCount: data.reduce((s: number, c: Category) => s + (c.postCount || 0), 0) }, ...data]);
      }
    } catch {
      // Use mock categories
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [fetchPosts, fetchCategories]);

  /* Handle category filter */
  const handleCategoryFilter = (slug: string) => {
    setActiveCategory(slug);
    setSearchQuery('');
    fetchPosts(slug === '' ? undefined : slug);
  };

  /* Handle search */
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        fetchPosts(activeCategory || undefined, query);
      }, 400);
      return () => clearTimeout(timer);
    } else if (query.length === 0) {
      fetchPosts(activeCategory || undefined);
    }
  };

  /* Posts to display (non-featured) */
  const displayPosts = posts.filter((p) => p.slug !== featuredPost?.slug);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Enhanced Header ── */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.08] via-gold/[0.03] to-transparent" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[250px] bg-gradient-to-b from-gold/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-16 left-10 w-2 h-2 bg-gold rounded-full opacity-30 animate-pulse" />
        <div className="absolute top-28 right-1/3 w-1.5 h-1.5 bg-gold-light rounded-full opacity-25 animate-pulse delay-700" />

        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24">
          <motion.button
            onClick={onBack}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-gold group"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:translate-x-1" />
            بازگشت به صفحه اصلی
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 ring-1 ring-gold/20">
                <BookOpen className="size-6 text-gold" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
                    <FileText className="size-3" />
                    مقالات تخصصی
                  </span>
                </div>
                <h1 className="text-3xl font-black md:text-5xl gold-text-shadow">
                  وبلاگ <span className="gold-gradient-text">زرین گلد</span>
                </h1>
              </div>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl text-base leading-relaxed text-muted-foreground"
          >
            آخرین اخبار، تحلیل‌ها و آموزش‌های بازار طلا. با مقالات تخصصی ما، تصمیمات
            سرمایه‌گذاری بهتری بگیرید.
          </motion.p>
        </div>
      </div>

      {/* ── Enhanced Search Bar ── */}
      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="relative"
        >
          <Search className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="جستجو در مقالات..."
            className="input-gold-focus w-full rounded-2xl border border-border/50 bg-white/60 backdrop-blur-xl py-3.5 pr-11 pl-4 text-sm outline-none transition-all placeholder:text-muted-foreground/60 dark:bg-gold/[0.02]"
          />
          {isSearching && (
            <Loader2 className="absolute left-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-gold" />
          )}
        </motion.div>
      </div>

      {/* ── Enhanced Featured Post ── */}
      {loading ? (
        <FeaturedSkeleton />
      ) : featuredPost ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mx-auto max-w-5xl px-4 pt-6 sm:px-6"
        >
          <article
            onClick={() => onViewPost?.(featuredPost.slug)}
            className={cn(
              'group relative cursor-pointer overflow-hidden rounded-2xl p-6 md:p-8 transition-all hover-lift-md',
              'shimmer-border card-spotlight',
              'bg-gradient-to-l from-gold/[0.08] to-gold/[0.02]',
              'dark:from-gold/[0.06] dark:to-gold/[0.01]',
              'border border-gold/20 hover:border-gold/40'
            )}
          >
            {/* Background decoration */}
            <div className="absolute -top-12 -left-12 size-40 bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-1/3 h-full bg-gradient-to-l from-gold/[0.04] to-transparent pointer-events-none" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold">
                  <Sparkles className="size-3" />
                  مقاله ویژه
                </span>
              </div>
              <div className="flex items-start gap-4 md:gap-6">
                <div className="flex-1">
                  {featuredPost.category && (
                    <Badge
                      className="mb-3 text-xs rounded-full"
                      style={{
                        backgroundColor: featuredPost.category.color + '18',
                        color: featuredPost.category.color,
                        borderColor: featuredPost.category.color + '30',
                      }}
                    >
                      {featuredPost.category.name}
                    </Badge>
                  )}
                  <h2 className="mb-2 text-xl font-bold leading-relaxed transition-colors group-hover:text-gold md:text-2xl">
                    {featuredPost.title}
                  </h2>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {apiAvailable ? formatPersianDate(featuredPost.publishedAt) : MOCK_FEATURED.date}
                    </span>
                    {featuredPost.readTime > 0 && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="size-3" />
                        {featuredPost.readTime} دقیقه مطالعه
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-gold font-medium">
                      ادامه مطلب
                      <ArrowLeft className="size-3" />
                    </span>
                  </div>
                </div>
                {featuredPost.featuredImage ? (
                  <img
                    src={featuredPost.featuredImage}
                    alt=""
                    className="hidden size-28 shrink-0 rounded-2xl object-cover ring-1 ring-white/20 shadow-lg sm:block md:size-32"
                  />
                ) : (
                  <div className="hidden size-28 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/10 to-gold/[0.02] text-5xl ring-1 ring-gold/10 shadow-lg sm:flex md:size-32">
                    {apiAvailable ? getPostEmoji(featuredPost.id) : MOCK_FEATURED.image}
                  </div>
                )}
              </div>
            </div>
          </article>
        </motion.div>
      ) : null}

      {/* ── Enhanced Category Filter Pills ── */}
      {loading ? (
        <CategoriesSkeleton />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mx-auto max-w-5xl px-4 pt-10 sm:px-6"
        >
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const IconComponent = CATEGORY_ICONS[c.slug] || Sparkles;
              const isActive = activeCategory === c.slug;
              return (
                <button
                  key={c.slug || 'all'}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all',
                    isActive
                      ? 'bg-gradient-to-l from-gold-dark to-gold text-white shadow-lg shadow-gold/20 ring-1 ring-gold/30'
                      : 'bg-white/60 backdrop-blur-sm border border-border/50 text-muted-foreground hover:bg-gold/10 hover:text-gold hover:border-gold/20 dark:bg-gold/[0.02] dark:border-gold/10'
                  )}
                  onClick={() => handleCategoryFilter(c.slug)}
                >
                  <IconComponent className="size-3" />
                  {c.name}
                  <span className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px]',
                    isActive ? 'bg-white/20' : 'bg-muted'
                  )}>
                    {c.postCount}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Enhanced Posts Grid ── */}
      {loading ? (
        <PostsGridSkeleton />
      ) : (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          {displayPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-20 text-center"
            >
              <div className="flex mx-auto mb-4 size-16 items-center justify-center rounded-2xl bg-muted/50">
                <BookOpen className="size-8 text-muted-foreground/30" />
              </div>
              <p className="text-base text-muted-foreground">
                {searchQuery ? 'نتیجه‌ای برای جستجوی شما یافت نشد.' : 'هنوز مقاله‌ای منتشر نشده است.'}
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayPosts.map((post, idx) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 + idx * 0.06 }}
                  onClick={() => onViewPost?.(post.slug)}
                  className={cn(
                    'group cursor-pointer overflow-hidden rounded-2xl border transition-all hover-lift-md',
                    'bg-white/60 backdrop-blur-xl border-white/50',
                    'dark:bg-gold/[0.02] dark:border-gold/10',
                    'card-spotlight hover:border-gold/30'
                  )}
                >
                  {/* Image / Emoji area */}
                  {post.featuredImage ? (
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={post.featuredImage}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  ) : (
                    <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-muted/40 to-muted/10 text-5xl transition-all group-hover:from-gold/[0.08] group-hover:to-gold/[0.02]">
                      {apiAvailable ? getPostEmoji(post.id) : POST_EMOJIS[MOCK_POSTS.findIndex(p => p.id === post.id) % POST_EMOJIS.length]}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-gold/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  )}

                  <div className="p-5">
                    {post.category && (
                      <Badge
                        className="mb-2.5 text-[10px] rounded-full"
                        style={{
                          backgroundColor: post.category.color + '18',
                          color: post.category.color,
                          borderColor: post.category.color + '30',
                        }}
                      >
                        {post.category.name}
                      </Badge>
                    )}
                    <h3 className="mb-2 font-bold leading-relaxed line-clamp-2 group-hover:text-gold transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="gold-separator my-3" />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {apiAvailable ? formatPersianDate(post.publishedAt) : post.publishedAt}
                      </span>
                      {post.readTime > 0 && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="size-3" />
                          {post.readTime} دقیقه
                        </span>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Search,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
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
            <Skeleton className="h-36 w-full" />
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
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-gold/[0.06] to-transparent">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24">
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-gold"
          >
            <ArrowLeft className="size-4" />
            بازگشت به صفحه اصلی
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gold/10">
              <BookOpen className="size-6 text-gold" />
            </div>
            <h1 className="text-3xl font-black md:text-4xl">
              وبلاگ <span className="gold-gradient-text">زرین گلد</span>
            </h1>
          </div>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            آخرین اخبار، تحلیل‌ها و آموزش‌های بازار طلا. با مقالات تخصصی ما، تصمیمات
            سرمایه‌گذاری بهتری بگیرید.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="جستجو در مقالات..."
            className="w-full rounded-xl border border-border bg-card py-3 pr-10 pl-4 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-gold/40 focus:ring-2 focus:ring-gold/10"
          />
          {isSearching && (
            <Loader2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-gold" />
          )}
        </div>
      </div>

      {/* Featured Post */}
      {loading ? (
        <FeaturedSkeleton />
      ) : featuredPost ? (
        <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
          <article
            onClick={() => onViewPost?.(featuredPost.slug)}
            className="group -mt-0 cursor-pointer overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-l from-gold/[0.06] to-transparent p-6 transition-all hover:border-gold/30 hover:shadow-md md:p-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="size-3.5 text-gold" />
              <span className="text-xs font-medium text-gold">مقاله ویژه</span>
            </div>
            <div className="flex items-start gap-4 md:gap-6">
              <div className="flex-1">
                {featuredPost.category && (
                  <Badge
                    className="mb-3 text-xs"
                    style={{
                      backgroundColor: featuredPost.category.color + '18',
                      color: featuredPost.category.color,
                      borderColor: featuredPost.category.color + '40',
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
                    <span>{featuredPost.readTime} دقیقه مطالعه</span>
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
                  className="hidden size-28 shrink-0 rounded-2xl object-cover sm:block md:size-32"
                />
              ) : (
                <div className="hidden size-28 shrink-0 items-center justify-center rounded-2xl bg-gold/5 text-5xl sm:flex md:size-32">
                  {apiAvailable ? getPostEmoji(featuredPost.id) : MOCK_FEATURED.image}
                </div>
              )}
            </div>
          </article>
        </div>
      ) : null}

      {/* Categories */}
      {loading ? (
        <CategoriesSkeleton />
      ) : (
        <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.slug || 'all'}
                className={cn(
                  'rounded-full px-4 py-1.5 text-xs font-medium transition-all',
                  activeCategory === c.slug
                    ? 'bg-gold text-gold-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-gold/10 hover:text-gold'
                )}
                onClick={() => handleCategoryFilter(c.slug)}
              >
                {c.name} ({c.postCount})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Posts Grid */}
      {loading ? (
        <PostsGridSkeleton />
      ) : (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          {displayPosts.length === 0 ? (
            <div className="py-20 text-center">
              <BookOpen className="mx-auto mb-4 size-12 text-muted-foreground/30" />
              <p className="text-base text-muted-foreground">
                {searchQuery ? 'نتیجه‌ای برای جستجوی شما یافت نشد.' : 'هنوز مقاله‌ای منتشر نشده است.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayPosts.map((post) => (
                <article
                  key={post.id}
                  onClick={() => onViewPost?.(post.slug)}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-border/50 bg-card transition-all hover:border-gold/20 hover:shadow-md"
                >
                  {post.featuredImage ? (
                    <div className="h-36 overflow-hidden">
                      <img
                        src={post.featuredImage}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-muted/30 text-4xl">
                      {apiAvailable ? getPostEmoji(post.id) : POST_EMOJIS[MOCK_POSTS.findIndex(p => p.id === post.id) % POST_EMOJIS.length]}
                    </div>
                  )}
                  <div className="p-5">
                    {post.category && (
                      <Badge
                        className="mb-2 text-[10px]"
                        style={{
                          backgroundColor: post.category.color + '18',
                          color: post.category.color,
                          borderColor: post.category.color + '40',
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
                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{apiAvailable ? formatPersianDate(post.publishedAt) : post.publishedAt}</span>
                      {post.readTime > 0 && <span>{post.readTime} دقیقه</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

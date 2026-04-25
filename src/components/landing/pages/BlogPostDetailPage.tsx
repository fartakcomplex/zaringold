'use client';

import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Calendar,
  ArrowLeft,
  BookOpen,
  Clock,
  Eye,
  User,
  Share2,
  Tag,
  MessageCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import RenderHTML from '@/components/shared/RenderHTML';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PostDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string | null;
  category: { name: string; slug: string; color: string } | null;
  status: string;
  viewCount: number;
  readTime: number;
  isFeatured: boolean;
  publishedAt: string;
  tags: { tag: { name: string; slug: string } }[];
  author: { id: string; fullName: string | null } | null;
  prevSlug: string | null;
  prevTitle: string | null;
  nextSlug: string | null;
  nextTitle: string | null;
  relatedPosts: RelatedPost[];
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  viewCount: number;
  readTime: number;
  publishedAt: string;
  category: { name: string; slug: string; color: string } | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string, locale: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

const GRADIENTS = [
  'from-amber-600/20 via-yellow-500/10 to-orange-500/20',
  'from-gold/20 via-yellow-600/10 to-amber-500/20',
  'from-yellow-600/20 via-gold/10 to-amber-400/20',
];

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                   */
/* ------------------------------------------------------------------ */

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-3/4" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface BlogPostDetailProps {
  onBack: () => void;
}

export default function BlogPostDetailPage({ onBack }: BlogPostDetailProps) {
  const blogPostSlug = useAppStore((s) => s.blogPostSlug);
  const setBlogPostSlug = useAppStore((s) => s.setBlogPostSlug);
  const { locale } = useTranslation();

  const ui = locale === 'en' ? {
    backToBlog: 'Back to Blog',
    articleNotFound: 'Article not found',
    errorLoadingArticle: 'Error loading article',
    minRead: 'min read',
    views: 'views',
    share: 'Share:',
    telegram: 'Telegram',
    twitter: 'Twitter/X',
    whatsapp: 'WhatsApp',
    copyLink: 'Copy Link',
    prevArticle: 'Previous Article',
    nextArticle: 'Next Article',
    relatedArticles: 'Related Articles',
  } : {
    backToBlog: 'بازگشت به وبلاگ',
    articleNotFound: 'مقاله یافت نشد',
    errorLoadingArticle: 'خطا در دریافت مقاله',
    minRead: 'دقیقه مطالعه',
    views: 'بازدید',
    share: 'اشتراک‌گذاری:',
    telegram: 'تلگرام',
    twitter: 'توییتر',
    whatsapp: 'واتساپ',
    copyLink: 'کپی لینک',
    prevArticle: 'مقاله قبلی',
    nextArticle: 'مقاله بعدی',
    relatedArticles: 'مقالات مرتبط',
  };

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = async (slug: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/blog/posts/${slug}`);
      if (!res.ok) throw new Error(ui.articleNotFound);
      const data = await res.json();
      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : ui.errorLoadingArticle);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!blogPostSlug) {
      onBack();
      return;
    }
    fetchPost(blogPostSlug);
  }, [blogPostSlug]);

  const handleBack = () => {
    setBlogPostSlug(null);
    onBack();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (slug: string) => {
    setBlogPostSlug(slug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = post?.title || '';
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      default:
        if (navigator.share) {
          navigator.share({ title: text, url });
          return;
        }
        navigator.clipboard.writeText(url);
        return;
    }
    if (shareUrl) window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/5 px-4 py-2 text-sm font-medium text-gold transition-colors duration-200 hover:bg-gold/10"
            >
              <ArrowRight className="h-4 w-4" />
              {ui.backToBlog}
            </button>
          </div>
        </header>
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/5 px-4 py-2 text-sm font-medium text-gold transition-colors duration-200 hover:bg-gold/10"
            >
              <ArrowRight className="h-4 w-4" />
              {ui.backToBlog}
            </button>
          </div>
        </header>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
          <h2 className="mb-2 text-xl font-bold text-muted-foreground">
            {error || ui.articleNotFound}
          </h2>
          <button
            onClick={handleBack}
            className="mt-4 rounded-lg border border-gold/30 bg-gold/5 px-6 py-2.5 text-sm font-medium text-gold hover:bg-gold/10 transition-colors"
          >
            {ui.backToBlog}
          </button>
        </div>
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
            {ui.backToBlog}
          </button>
          <h1 className="truncate text-sm font-medium text-muted-foreground line-clamp-1 sm:text-base">
            {post.title}
          </h1>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        {/* Post Meta */}
        <div className="mb-6">
          {post.category && (
            <Badge
              variant="outline"
              className="mb-4 text-xs"
              style={{
                borderColor: post.category.color + '60',
                backgroundColor: post.category.color + '15',
                color: post.category.color,
              }}
            >
              {post.category.name}
            </Badge>
          )}

          <h1 className="mb-4 text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
            <span className="gold-gradient-text">{post.title}</span>
          </h1>

          {/* Meta Row */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground sm:gap-5">
            {post.author?.fullName && (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {post.author.fullName}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(post.publishedAt, locale)}
            </span>
            {post.readTime > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.readTime} {ui.minRead}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {post.viewCount} {ui.views}
            </span>
          </div>
        </div>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8 overflow-hidden rounded-xl">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="h-auto w-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="blog-content mb-10">
          <RenderHTML
            html={post.content}
            className="prose prose-neutral max-w-none dark:prose-invert prose-headings:font-bold prose-h2:text-xl sm:prose-h2:text-2xl prose-h3:text-lg sm:prose-h3:text-xl prose-p:leading-relaxed prose-p:text-muted-foreground prose-a:text-gold prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:my-6 prose-blockquote:border-gold/30 prose-blockquote:bg-gold/5 prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:pr-4 prose-li:marker:text-gold prose-hr:border-border/60"
          />
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {post.tags.map((t) => (
              <Badge
                key={t.tag.slug}
                variant="secondary"
                className="bg-card/80 text-muted-foreground hover:text-gold hover:bg-gold/5 transition-colors"
              >
                {t.tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Share */}
        <div className="mb-8">
          <Separator className="mb-6" />
          <div className="flex flex-wrap items-center gap-3">
            <Share2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{ui.share}</span>
            {['telegram', 'twitter', 'whatsapp'].map((platform) => (
              <button
                key={platform}
                onClick={() => handleShare(platform)}
                className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-gold/30 hover:bg-gold/5 hover:text-gold"
              >
                {platform === 'telegram' && ui.telegram}
                {platform === 'twitter' && ui.twitter}
                {platform === 'whatsapp' && ui.whatsapp}
              </button>
            ))}
            <button
              onClick={() => handleShare('copy')}
              className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-gold/30 hover:bg-gold/5 hover:text-gold"
            >
              {ui.copyLink}
            </button>
          </div>
          <Separator className="mt-6" />
        </div>

        {/* Prev/Next Navigation */}
        {(post.prevSlug || post.nextSlug) && (
          <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {post.prevSlug && (
              <button
                onClick={() => handleNavigate(post.prevSlug!)}
                className="glass-card group flex items-start gap-3 rounded-xl border border-border/60 p-4 text-right transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5"
              >
                <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-gold" />
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">{ui.prevArticle}</p>
                  <p className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-gold transition-colors">
                    {post.prevTitle}
                  </p>
                </div>
              </button>
            )}
            {post.nextSlug && (
              <button
                onClick={() => handleNavigate(post.nextSlug!)}
                className={`glass-card group flex items-start gap-3 rounded-xl border border-border/60 p-4 text-left transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5 ${
                  !post.prevSlug ? 'sm:col-start-2' : ''
                }`}
              >
                <div className="flex-1">
                  <p className="mb-1 text-xs text-muted-foreground">{ui.nextArticle}</p>
                  <p className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-gold transition-colors">
                    {post.nextTitle}
                  </p>
                </div>
                <ArrowLeft className="mt-1 h-5 w-5 shrink-0 text-gold" />
              </button>
            )}
          </div>
        )}

        {/* Related Posts */}
        {post.relatedPosts.length > 0 && (
          <section>
            <h2 className="mb-6 text-xl font-bold">
              <span className="gold-gradient-text">{ui.relatedArticles}</span>
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {post.relatedPosts.map((related, idx) => (
                <Card
                  key={related.id}
                  className="glass-card group cursor-pointer overflow-hidden border-border/60 transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5"
                  onClick={() => handleNavigate(related.slug)}
                >
                  {related.featuredImage ? (
                    <div className="relative h-32 overflow-hidden">
                      <img
                        src={related.featuredImage}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${GRADIENTS[idx % GRADIENTS.length]}`}>
                      <BookOpen className="h-8 w-8 text-gold/30" />
                      <div
                        className="pointer-events-none absolute inset-0 opacity-[0.05]"
                        aria-hidden
                        style={{
                          backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
                          backgroundSize: '20px 20px',
                        }}
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    {related.category && (
                      <Badge
                        variant="outline"
                        className="mb-2 text-xs"
                        style={{
                          borderColor: related.category.color + '60',
                          backgroundColor: related.category.color + '15',
                          color: related.category.color,
                        }}
                      >
                        {related.category.name}
                      </Badge>
                    )}
                    <h3 className="mb-2 text-sm font-bold leading-tight line-clamp-2">
                      {related.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(related.publishedAt, locale)}
                      </span>
                      {related.readTime > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {related.readTime} {locale === 'en' ? 'min' : 'دقیقه'}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}

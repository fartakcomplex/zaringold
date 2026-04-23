'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { formatDateTime, getTimeAgo } from '@/lib/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import RichTextEditor from '@/components/shared/RichTextEditor';
import MediaPicker from '@/components/shared/MediaPicker';
import {
  FileText, Plus, Edit, Trash2, Eye, Calendar, Clock, BarChart3,
  Search, Star, StarOff, ArrowLeft, X, Save, Tag, FolderOpen,
  Newspaper, Check, Copy, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string | null;
  status: string;
  seoTitle: string | null;
  seoDesc: string | null;
  readTime: number;
  isFeatured: boolean;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  categoryId: string | null;
  category: { id: string; name: string; slug: string; color: string } | null;
  author: { id: string; fullName: string; phone: string };
  tags: { tag: { id: string; name: string; slug: string } }[];
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  _count: { posts: number };
}

interface BlogTag {
  id: string;
  name: string;
  slug: string;
  _count: { posts: number };
}

const emptyForm = {
  title: '', slug: '', content: '', excerpt: '', featuredImage: '',
  status: 'draft' as string, seoTitle: '', seoDesc: '', isFeatured: false,
  categoryId: '', tagIds: [] as string[], readTime: 1,
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getToken(): string | undefined {
  return useAppStore.getState().user?.sessionToken;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function estimateReadTime(content: string): number {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main AdminBlog Component                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AdminBlog() {
  const [tab, setTab] = useState('posts');
  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-muted/50 w-full sm:w-auto">
          <TabsTrigger value="posts" className="gap-1.5 text-xs">
            <FileText className="size-3.5" /> مقالات
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5 text-xs">
            <FolderOpen className="size-3.5" /> دسته‌بندی‌ها
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-1.5 text-xs">
            <Tag className="size-3.5" /> برچسب‌ها
          </TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-4">
          <PostsManager />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategoriesManager />
        </TabsContent>
        <TabsContent value="tags" className="mt-4">
          <TagsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Posts Manager                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PostsManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('categoryId', categoryFilter);
      const res = await fetch(`/api/admin/blog/posts?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, search, statusFilter, categoryFilter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const openEditor = (post?: BlogPost) => {
    setEditingPost(post || null);
    setView('editor');
  };

  const closeEditor = () => {
    setView('list');
    setEditingPost(null);
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا مطمئن هستید؟')) return;
    try {
      const res = await fetch(`/api/admin/blog/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        useAppStore.getState().addToast('مقاله حذف شد', 'success');
        fetchPosts();
      }
    } catch { useAppStore.getState().addToast('خطا در حذف', 'error'); }
  };

  const handleToggleFeatured = async (post: BlogPost) => {
    try {
      const res = await fetch(`/api/admin/blog/posts/${post.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !post.isFeatured }),
      });
      if (res.ok) {
        useAppStore.getState().addToast(post.isFeatured ? 'ویژگی حذف شد' : 'ویژگی اضافه شد', 'success');
        fetchPosts();
      }
    } catch { useAppStore.getState().addToast('خطا', 'error'); }
  };

  const handleToggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/admin/blog/posts/${post.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        useAppStore.getState().addToast(newStatus === 'published' ? 'مقاله منتشر شد' : 'مقاله به پیش‌نویس برگشت', 'success');
        fetchPosts();
      }
    } catch { useAppStore.getState().addToast('خطا', 'error'); }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      draft: { label: 'پیش‌نویس', cls: 'bg-gray-500/15 text-gray-400' },
      published: { label: 'منتشر شده', cls: 'bg-emerald-500/15 text-emerald-400' },
      archived: { label: 'بایگانی', cls: 'bg-amber-500/15 text-amber-400' },
    };
    const item = map[status] || map.draft;
    return <Badge className={cn('text-[10px]', item.cls)}>{item.label}</Badge>;
  };

  const filtered = posts.filter(p => {
    const q = search.toLowerCase();
    return !q || p.title.toLowerCase().includes(q) || (p.excerpt || '').toLowerCase().includes(q);
  });

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    draft: posts.filter(p => p.status === 'draft').length,
    views: posts.reduce((a, p) => a + (p.viewCount || 0), 0),
  };

  /* ── Editor View ── */
  if (view === 'editor') {
    return <PostEditor post={editingPost} onSave={closeEditor} onCancel={closeEditor} />;
  }

  /* ── List View ── */
  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'کل مقالات', value: stats.total, icon: FileText, color: 'text-gold' },
          { label: 'منتشر شده', value: stats.published, icon: Check, color: 'text-emerald-400' },
          { label: 'پیش‌نویس', value: stats.draft, icon: Clock, color: 'text-gray-400' },
          { label: 'بازدید', value: stats.views.toLocaleString('fa-IR'), icon: BarChart3, color: 'text-blue-400' },
        ].map(s => (
          <Card key={s.label} className="card-gold-border">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="size-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                <s.icon className={cn('size-4', s.color)} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="text-base font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Header + Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={() => openEditor()} className="bg-gold hover:bg-gold-dark text-white">
            <Plus className="size-4 ml-1.5" /> مقاله جدید
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="جستجو..." className="pr-9 h-9 text-sm" />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[120px] h-9 text-xs">
              <SelectValue placeholder="وضعیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              <SelectItem value="published">منتشر شده</SelectItem>
              <SelectItem value="draft">پیش‌نویس</SelectItem>
              <SelectItem value="archived">بایگانی</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Post List */}
      <ScrollArea className="max-h-[550px]">
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : filtered.length > 0 ? filtered.map(post => (
            <Card key={post.id} className="hover-lift-sm group">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="size-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                      {post.featuredImage ? (
                        <img src={post.featuredImage} alt="" className="size-10 rounded-lg object-cover" />
                      ) : (
                        <FileText className="size-5 text-gold" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {post.isFeatured && <Star className="size-3 text-amber-400 fill-amber-400 shrink-0" />}
                        <p className="text-sm font-medium truncate">{post.title}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {post.category && (
                          <Badge className="text-[9px] px-1.5 py-0" style={{ backgroundColor: post.category.color + '20', color: post.category.color }}>
                            {post.category.name}
                          </Badge>
                        )}
                        {post.tags?.map(t => (
                          <span key={t.tag.id} className="text-[9px] text-muted-foreground">#{t.tag.name}</span>
                        ))}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="size-3" />{getTimeAgo(post.createdAt)}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <BarChart3 className="size-3" />{post.viewCount} بازدید
                        </span>
                        <span className="text-[10px] text-muted-foreground">{post.readTime} دقیقه</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {getStatusBadge(post.status)}
                    <Button size="icon" variant="ghost" className="size-7" title="ویژگی"
                      onClick={() => handleToggleFeatured(post)}>
                      {post.isFeatured ? <Star className="size-3.5 text-amber-400 fill-amber-400" /> : <StarOff className="size-3.5 text-muted-foreground" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="size-7" title={post.status === 'published' ? 'بازگشت به پیش‌نویس' : 'انتشار'}
                      onClick={() => handleToggleStatus(post)}>
                      <Check className={cn('size-3.5', post.status === 'published' ? 'text-gray-400' : 'text-emerald-400')} />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-7" onClick={() => setPreviewPost(post)}><Eye className="size-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="size-7" onClick={() => openEditor(post)}><Edit className="size-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="size-7 text-red-400" onClick={() => handleDelete(post.id)}><Trash2 className="size-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-12">
              <Newspaper className="size-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">مقاله‌ای یافت نشد</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-xs">قبلی</Button>
          <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="text-xs">بعدی</Button>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewPost} onOpenChange={() => setPreviewPost(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>پیش‌نویس</DialogTitle></DialogHeader>
          {previewPost && (
            <article className="prose prose-sm dark:prose-invert max-w-none" dir="rtl">
              {previewPost.featuredImage && (
                <img src={previewPost.featuredImage} alt={previewPost.title} className="w-full rounded-lg mb-4" />
              )}
              <h1 className="text-xl font-bold gold-gradient-text">{previewPost.title}</h1>
              <div className="text-xs text-muted-foreground mb-4 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1"><Calendar className="size-3" />{formatDateTime(previewPost.createdAt)}</span>
                <span className="flex items-center gap-1"><BarChart3 className="size-3" />{previewPost.viewCount} بازدید</span>
                <span className="flex items-center gap-1"><Clock className="size-3" />{previewPost.readTime} دقیقه مطالعه</span>
                {previewPost.category && <Badge style={{ backgroundColor: previewPost.category.color + '20', color: previewPost.category.color }} className="text-[10px]">{previewPost.category.name}</Badge>}
              </div>
              {previewPost.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {previewPost.tags.map(t => (
                    <Badge key={t.tag.id} variant="secondary" className="text-[10px]">#{t.tag.name}</Badge>
                  ))}
                </div>
              )}
              <Separator className="my-3" />
              <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: previewPost.content }} />
            </article>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Post Editor (WordPress-like)                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PostEditor({
  post,
  onSave,
  onCancel,
}: {
  post: BlogPost | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [allTags, setAllTags] = useState<BlogTag[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          fetch('/api/admin/blog/categories', { headers: { Authorization: `Bearer ${getToken()}` } }),
          fetch('/api/admin/blog/tags', { headers: { Authorization: `Bearer ${getToken()}` } }),
        ]);
        if (catRes.ok) { const d = await catRes.json(); setCategories(d.categories || []); }
        if (tagRes.ok) { const d = await tagRes.json(); setAllTags(d.tags || []); }
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (post) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        title: post.title,
        slug: post.slug,
        content: post.content || '',
        excerpt: post.excerpt || '',
        featuredImage: post.featuredImage || '',
        status: post.status,
        seoTitle: post.seoTitle || '',
        seoDesc: post.seoDesc || '',
        isFeatured: post.isFeatured,
        categoryId: post.categoryId || '',
        tagIds: (post.tags || []).map(t => t.tag.id),
        readTime: post.readTime || 1,
      });
    } else {
      setForm({ ...emptyForm });
    }
  }, [post]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        ...form,
        slug: form.slug || generateSlug(form.title),
        readTime: form.readTime || estimateReadTime(form.content),
      };
      let res;
      if (post) {
        res = await fetch(`/api/admin/blog/posts/${post.id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/admin/blog/posts', {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      if (res.ok) {
        useAppStore.getState().addToast(post ? 'مقاله بروزرسانی شد' : 'مقاله ایجاد شد', 'success');
        onSave();
      } else {
        const err = await res.json();
        useAppStore.getState().addToast(err.message || 'خطا', 'error');
      }
    } catch {
      useAppStore.getState().addToast('خطا در ذخیره', 'error');
    }
    setSaving(false);
  };

  const addTag = (tagId: string) => {
    if (!form.tagIds.includes(tagId)) {
      setForm(f => ({ ...f, tagIds: [...f.tagIds, tagId] }));
    }
  };

  const removeTag = (tagId: string) => {
    setForm(f => ({ ...f, tagIds: f.tagIds.filter(id => id !== tagId) }));
  };

  const wordCount = stripHtml(form.content).split(/\s+/).filter(Boolean).length;
  const readTime = form.readTime || estimateReadTime(form.content);

  const selectedTags = allTags.filter(t => form.tagIds.includes(t.id));

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onCancel} className="gap-1.5 text-xs">
        <ArrowLeft className="size-3.5" /> بازگشت به لیست
      </Button>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{post ? 'ویرایش مقاله' : 'مقاله جدید'}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)} className="gap-1.5 text-xs">
            <Eye className="size-3.5" /> پیش‌نویس
          </Button>
          <Button onClick={handleSave} disabled={saving || !form.title.trim()} className="bg-gold hover:bg-gold-dark text-white gap-1.5 text-xs">
            <Save className="size-3.5" />
            {saving ? 'در حال ذخیره...' : post ? 'بروزرسانی' : 'انتشار'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Input
              value={form.title}
              onChange={e => {
                setForm(f => ({ ...f, title: e.target.value, slug: f.slug || generateSlug(e.target.value) }));
              }}
              placeholder="عنوان مقاله..."
              className="text-lg font-bold h-12 placeholder:text-muted-foreground/40"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">اسلاگ (slug)</Label>
            <Input
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              placeholder="article-slug"
              dir="ltr"
              className="h-9 text-sm font-mono"
            />
          </div>

          {/* Rich Text Editor */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>محتوا</Label>
              <span className="text-[10px] text-muted-foreground">{wordCount} کلمه · {readTime} دقیقه مطالعه</span>
            </div>
            <RichTextEditor
              value={form.content}
              onChange={html => setForm(f => ({ ...f, content: html }))}
              placeholder="محتوای مقاله خود را بنویسید..."
              minHeight="300px"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Publish */}
          <Card className="card-gold-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Save className="size-4 text-gold" /> انتشار
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">وضعیت</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">پیش‌نویس</SelectItem>
                    <SelectItem value="published">منتشر شده</SelectItem>
                    <SelectItem value="archived">بایگانی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">مقاله ویژه</Label>
                <Switch
                  checked={form.isFeatured}
                  onCheckedChange={v => setForm(f => ({ ...f, isFeatured: v }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card className="card-gold-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FolderOpen className="size-4 text-gold" /> دسته‌بندی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={form.categoryId || undefined} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="بدون دسته‌بندی" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="card-gold-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Tag className="size-4 text-gold" /> برچسب‌ها
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTags.map(t => (
                    <Badge key={t.id} variant="secondary" className="text-[10px] gap-1 pr-1">
                      #{t.name}
                      <button onClick={() => removeTag(t.id)} className="hover:text-red-400">
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <Select onValueChange={addTag}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="+ افزودن برچسب" />
                </SelectTrigger>
                <SelectContent>
                  {allTags.filter(t => !form.tagIds.includes(t.id)).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card className="card-gold-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BookOpen className="size-4 text-gold" /> تصویر شاخص
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MediaPicker
                value={form.featuredImage}
                onChange={url => setForm(f => ({ ...f, featuredImage: url }))}
                folder="blog"
                label="تصویر شاخص مقاله"
              />
            </CardContent>
          </Card>

          {/* Excerpt */}
          <Card className="card-gold-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">خلاصه</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.excerpt}
                onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                placeholder="خلاصه‌ای از مقاله..."
                rows={3}
                className="text-xs"
              />
            </CardContent>
          </Card>

          {/* SEO */}
          <Card className="card-gold-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Search className="size-4 text-gold" /> سئو
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-[11px] text-muted-foreground">عنوان سئو</Label>
                  <span className="text-[9px] text-muted-foreground">{(form.seoTitle || '').length}/60</span>
                </div>
                <Input
                  value={form.seoTitle}
                  onChange={e => setForm(f => ({ ...f, seoTitle: e.target.value.slice(0, 60) }))}
                  placeholder="عنوان سئو..."
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-[11px] text-muted-foreground">توضیحات سئو</Label>
                  <span className="text-[9px] text-muted-foreground">{(form.seoDesc || '').length}/160</span>
                </div>
                <Textarea
                  value={form.seoDesc}
                  onChange={e => setForm(f => ({ ...f, seoDesc: e.target.value.slice(0, 160) }))}
                  placeholder="توضیحات سئو..."
                  rows={2}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>پیش‌نویس مقاله</DialogTitle></DialogHeader>
          <article className="prose prose-sm dark:prose-invert max-w-none" dir="rtl">
            {form.featuredImage && (
              <img src={form.featuredImage} alt={form.title} className="w-full rounded-lg mb-4" />
            )}
            <h1 className="text-xl font-bold gold-gradient-text">{form.title || 'بدون عنوان'}</h1>
            <div className="text-xs text-muted-foreground mb-4 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1"><Clock className="size-3" />{readTime} دقیقه مطالعه</span>
              {form.categoryId && (
                <Badge variant="secondary" className="text-[10px]">{categories.find(c => c.id === form.categoryId)?.name}</Badge>
              )}
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {selectedTags.map(t => <Badge key={t.id} variant="secondary" className="text-[10px]">#{t.name}</Badge>)}
              </div>
            )}
            <Separator className="my-3" />
            <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: form.content || '<p class="text-muted-foreground">محتوایی وجود ندارد</p>' }} />
          </article>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Categories Manager                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CategoriesManager() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCat, setEditCat] = useState<BlogCategory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#D4AF37', icon: 'BookOpen' });
  const [saving, setSaving] = useState(false);

  const fetchCats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/blog/categories', { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) { const d = await res.json(); setCategories(d.categories || []); }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchCats(); }, [fetchCats]);

  const openCreate = () => {
    setEditCat(null);
    setForm({ name: '', description: '', color: '#D4AF37', icon: 'BookOpen' });
    setShowForm(true);
  };

  const openEdit = (cat: BlogCategory) => {
    setEditCat(cat);
    setForm({ name: cat.name, description: cat.description || '', color: cat.color, icon: cat.icon });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const body = { ...form, description: form.description || null };
      const res = editCat
        ? await fetch(`/api/admin/blog/categories/${editCat.id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/admin/blog/categories', {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
      if (res.ok) {
        useAppStore.getState().addToast(editCat ? 'دسته‌بندی بروزرسانی شد' : 'دسته‌بندی ایجاد شد', 'success');
        setShowForm(false);
        fetchCats();
      }
    } catch { useAppStore.getState().addToast('خطا', 'error'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف دسته‌بندی؟')) return;
    try {
      const res = await fetch(`/api/admin/blog/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        useAppStore.getState().addToast('دسته‌بندی حذف شد', 'success');
        fetchCats();
      }
    } catch { useAppStore.getState().addToast('خطا', 'error'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">دسته‌بندی‌ها</h2>
        <Button onClick={openCreate} size="sm" className="bg-gold hover:bg-gold-dark text-white gap-1.5 text-xs">
          <Plus className="size-3.5" /> دسته‌بندی جدید
        </Button>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editCat ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">نام</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="نام دسته‌بندی" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">توضیحات</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="توضیحات..." rows={2} className="text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">رنگ</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                  <Input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} dir="ltr" className="h-9 text-xs font-mono" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">آیکون</Label>
                <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="BookOpen" dir="ltr" className="h-9 text-xs font-mono" />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="w-full bg-gold hover:bg-gold-dark text-white text-xs">
              {saving ? 'در حال ذخیره...' : editCat ? 'بروزرسانی' : 'ایجاد'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* List */}
      <div className="space-y-2">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />) :
          categories.length > 0 ? categories.map(cat => (
            <Card key={cat.id} className="hover-lift-sm">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{cat.name}</p>
                    <p className="text-[10px] text-muted-foreground">{cat._count.posts} مقاله</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={cat.isActive ? 'default' : 'secondary'} className={cn('text-[9px]', cat.isActive ? 'bg-emerald-500/15 text-emerald-400' : '')}>
                    {cat.isActive ? 'فعال' : 'غیرفعال'}
                  </Badge>
                  <Button size="icon" variant="ghost" className="size-7" onClick={() => openEdit(cat)}><Edit className="size-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="size-7 text-red-400" onClick={() => handleDelete(cat.id)}><Trash2 className="size-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          )) : (
            <p className="text-center text-muted-foreground py-8 text-sm">دسته‌بندی‌ای یافت نشد</p>
          )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tags Manager                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TagsManager() {
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTag, setEditTag] = useState<BlogTag | null>(null);
  const [form, setForm] = useState({ name: '' });
  const [saving, setSaving] = useState(false);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/blog/tags', { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) { const d = await res.json(); setTags(d.tags || []); }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchTags(); }, [fetchTags]);

  const openCreate = () => {
    setEditTag(null);
    setForm({ name: '' });
    setShowForm(true);
  };

  const openEdit = (tag: BlogTag) => {
    setEditTag(tag);
    setForm({ name: tag.name });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = editTag
        ? await fetch(`/api/admin/blog/tags/${editTag.id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          })
        : await fetch('/api/admin/blog/tags', {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          });
      if (res.ok) {
        useAppStore.getState().addToast(editTag ? 'برچسب بروزرسانی شد' : 'برچسب ایجاد شد', 'success');
        setShowForm(false);
        fetchTags();
      }
    } catch { useAppStore.getState().addToast('خطا', 'error'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف برچسب؟')) return;
    try {
      const res = await fetch(`/api/admin/blog/tags/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        useAppStore.getState().addToast('برچسب حذف شد', 'success');
        fetchTags();
      }
    } catch { useAppStore.getState().addToast('خطا', 'error'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">برچسب‌ها</h2>
        <Button onClick={openCreate} size="sm" className="bg-gold hover:bg-gold-dark text-white gap-1.5 text-xs">
          <Plus className="size-3.5" /> برچسب جدید
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editTag ? 'ویرایش برچسب' : 'برچسب جدید'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">نام برچسب</Label>
              <Input value={form.name} onChange={e => setForm({ name: e.target.value })} placeholder="نام برچسب..." className="h-9 text-sm" />
            </div>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="w-full bg-gold hover:bg-gold-dark text-white text-xs">
              {saving ? 'در حال ذخیره...' : editTag ? 'بروزرسانی' : 'ایجاد'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap gap-2">
        {loading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />) :
          tags.length > 0 ? tags.map(tag => (
            <Badge key={tag.id} variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-muted/80 transition-colors group">
              <span className="text-xs">#{tag.name}</span>
              <span className="text-[10px] text-muted-foreground">({tag._count.posts})</span>
              <button onClick={() => openEdit(tag)} className="opacity-0 group-hover:opacity-100"><Edit className="size-2.5" /></button>
              <button onClick={() => handleDelete(tag.id)} className="opacity-0 group-hover:opacity-100 text-red-400"><Trash2 className="size-2.5" /></button>
            </Badge>
          )) : (
            <p className="text-center text-muted-foreground py-8 text-sm w-full">برچسبی یافت نشد</p>
          )}
      </div>
    </div>
  );
}

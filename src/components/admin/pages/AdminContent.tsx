'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { toPersianDigits, formatToman, getTimeAgo } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  GraduationCap,
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  EyeOff,
  Eye,
  Play,
  FileText,
  Crown,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  BookOpen,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SocialPostItem {
  id: string;
  userId: string;
  content: string;
  postType: string;
  likes: number;
  isAnonymous: boolean;
  createdAt: string;
  user?: { fullName?: string | null; phone?: string };
}

interface LessonItem {
  id: string;
  title: string;
  titleFa: string;
  description: string;
  descriptionFa: string;
  type: string;
  category: string;
  url: string;
  content: string;
  contentFa: string;
  duration: number;
  sortOrder: number;
  views: number;
  isActive: boolean;
  isPremium: boolean;
  createdAt: string;
}

interface LessonForm {
  title: string;
  titleFa: string;
  description: string;
  descriptionFa: string;
  type: string;
  category: string;
  url: string;
  content: string;
  contentFa: string;
  duration: string;
  sortOrder: string;
  isPremium: boolean;
  isActive: boolean;
}

const EMPTY_LESSON: LessonForm = {
  title: '',
  titleFa: '',
  description: '',
  descriptionFa: '',
  type: 'article',
  category: 'technical_analysis',
  url: '',
  content: '',
  contentFa: '',
  duration: '0',
  sortOrder: '0',
  isPremium: false,
  isActive: true,
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const POST_TYPE_LABELS: Record<string, string> = {
  trade: 'معامله',
  opinion: 'نظر',
  question: 'سؤال',
};

const POST_TYPE_COLORS: Record<string, string> = {
  trade: 'bg-emerald-500/15 text-emerald-600',
  opinion: 'bg-blue-500/15 text-blue-600',
  question: 'bg-amber-500/15 text-amber-600',
};

const CATEGORY_LABELS: Record<string, string> = {
  technical_analysis: 'تحلیل تکنیکال',
  economy: 'اقتصاد',
  buying_tips: 'نکات خرید',
  risk_management: 'مدیریت ریسک',
};

const CATEGORY_COLORS: Record<string, string> = {
  technical_analysis: 'bg-blue-500/15 text-blue-600',
  economy: 'bg-purple-500/15 text-purple-600',
  buying_tips: 'bg-emerald-500/15 text-emerald-600',
  risk_management: 'bg-amber-500/15 text-amber-600',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminContent() {
  const addToast = useAppStore((s) => s.addToast);

  /* ── Data ── */
  const [posts, setPosts] = useState<SocialPostItem[]>([]);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── Social Feed Filters ── */
  const [postTypeFilter, setPostTypeFilter] = useState('all');
  const [postSearch, setPostSearch] = useState('');
  const [postPage, setPostPage] = useState(1);
  const postsPerPage = 12;

  /* ── Education Filters ── */
  const [catFilter, setCatFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [lessonSearch, setLessonSearch] = useState('');
  const [lessonPage, setLessonPage] = useState(1);
  const lessonsPerPage = 12;

  /* ── Dialogs ── */
  const [deletePost, setDeletePost] = useState<SocialPostItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonForm>(EMPTY_LESSON);
  const [lessonSubmitting, setLessonSubmitting] = useState(false);

  const [deleteLesson, setDeleteLesson] = useState<LessonItem | null>(null);
  const [deleteLessonSubmitting, setDeleteLessonSubmitting] = useState(false);

  /* ── Fetch ── */
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/social-feed');
      if (res.ok) {
        const d = await res.json();
        setPosts(Array.isArray(d) ? d : d.posts || []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const fetchLessons = useCallback(async () => {
    try {
      const res = await fetch('/api/education/lessons');
      if (res.ok) {
        const d = await res.json();
        setLessons(Array.isArray(d) ? d : d.lessons || []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([fetchPosts(), fetchLessons()]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fetchPosts, fetchLessons]);

  /* ── Social Feed Filters ── */
  const filteredPosts = posts.filter((p) => {
    const matchType = postTypeFilter === 'all' || p.postType === postTypeFilter;
    const q = postSearch.toLowerCase();
    const matchSearch = !q || p.content.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const postTotalPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage));
  const paginatedPosts = filteredPosts.slice((postPage - 1) * postsPerPage, postPage * postsPerPage);

  /* ── Education Filters ── */
  const filteredLessons = lessons.filter((l) => {
    const matchCat = catFilter === 'all' || l.category === catFilter;
    const matchType = typeFilter === 'all' || l.type === typeFilter;
    const matchActive = showInactive || l.isActive;
    const q = lessonSearch.toLowerCase();
    const matchSearch = !q || (l.titleFa || l.title).toLowerCase().includes(q);
    return matchCat && matchType && matchActive && matchSearch;
  });

  const lessonTotalPages = Math.max(1, Math.ceil(filteredLessons.length / lessonsPerPage));
  const paginatedLessons = filteredLessons.slice((lessonPage - 1) * lessonsPerPage, lessonPage * lessonsPerPage);

  /* ── Handlers ── */

  /** Delete social post */
  const handleDeletePost = async () => {
    if (!deletePost) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/admin/social/${deletePost.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        addToast('پست با موفقیت حذف شد', 'success');
        setDeletePost(null);
        await fetchPosts();
      } else {
        addToast('خطا در حذف پست', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  /** Open lesson dialog for create */
  const openCreateLesson = () => {
    setEditingLesson(null);
    setLessonForm(EMPTY_LESSON);
    setLessonDialogOpen(true);
  };

  /** Open lesson dialog for edit */
  const openEditLesson = (lesson: LessonItem) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      titleFa: lesson.titleFa,
      description: lesson.description,
      descriptionFa: lesson.descriptionFa,
      type: lesson.type,
      category: lesson.category,
      url: lesson.url,
      content: lesson.content,
      contentFa: lesson.contentFa,
      duration: String(lesson.duration),
      sortOrder: String(lesson.sortOrder),
      isPremium: lesson.isPremium,
      isActive: lesson.isActive,
    });
    setLessonDialogOpen(true);
  };

  /** Save lesson (create or update) */
  const handleSaveLesson = async () => {
    if (!lessonForm.titleFa.trim()) {
      addToast('عنوان فارسی الزامی است', 'error');
      return;
    }
    setLessonSubmitting(true);
    try {
      const body = {
        title: lessonForm.title || lessonForm.titleFa,
        titleFa: lessonForm.titleFa,
        description: lessonForm.description || lessonForm.descriptionFa,
        descriptionFa: lessonForm.descriptionFa,
        type: lessonForm.type,
        category: lessonForm.category,
        url: lessonForm.url,
        content: lessonForm.content,
        contentFa: lessonForm.contentFa,
        duration: parseInt(lessonForm.duration) || 0,
        sortOrder: parseInt(lessonForm.sortOrder) || 0,
        isPremium: lessonForm.isPremium,
        isActive: lessonForm.isActive,
      };

      let res: Response;
      if (editingLesson) {
        res = await fetch(`/api/education/lessons/${editingLesson.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/education/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        addToast(editingLesson ? 'درس بروزرسانی شد' : 'درس جدید ایجاد شد', 'success');
        setLessonDialogOpen(false);
        setEditingLesson(null);
        await fetchLessons();
      } else {
        const d = await res.json().catch(() => ({}));
        addToast(d.message || 'خطا در ذخیره درس', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setLessonSubmitting(false);
    }
  };

  /** Delete lesson */
  const handleDeleteLesson = async () => {
    if (!deleteLesson) return;
    setDeleteLessonSubmitting(true);
    try {
      const res = await fetch(`/api/education/lessons/${deleteLesson.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        addToast('درس با موفقیت حذف شد', 'success');
        setDeleteLesson(null);
        await fetchLessons();
      } else {
        addToast('خطا در حذف درس', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setDeleteLessonSubmitting(false);
    }
  };

  /** Toggle lesson active/inactive */
  const handleToggleLessonActive = async (lesson: LessonItem) => {
    try {
      const res = await fetch(`/api/education/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !lesson.isActive }),
      });
      if (res.ok) {
        addToast(lesson.isActive ? 'درس غیرفعال شد' : 'درس فعال شد', 'success');
        await fetchLessons();
      } else {
        addToast('خطا در تغییر وضعیت', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
  };

  /** Format duration from seconds */
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return toPersianDigits(`${seconds} ثانیه`);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m < 60) return s > 0 ? toPersianDigits(`${m} دقیقه ${s} ثانیه`) : toPersianDigits(`${m} دقیقه`);
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return toPersianDigits(`${h} ساعت ${rm} دقیقه`);
  };

  /* ================================================================== */
  /*  Render                                                             */
  /* ================================================================== */
  return (
    <div className="space-y-4">
      <Tabs defaultValue="social" dir="rtl" className="space-y-4">
        <TabsList className="bg-muted/50 w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <TabsTrigger value="social" className="text-xs sm:text-sm gap-1.5">
            <MessageSquare className="size-4" />
            شبکه اجتماعی
          </TabsTrigger>
          <TabsTrigger value="education" className="text-xs sm:text-sm gap-1.5">
            <GraduationCap className="size-4" />
            آموزش و آکادمی
          </TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/*  TAB 1: Social Feed Moderation                               */}
        {/* ============================================================ */}
        <TabsContent value="social" className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <MessageSquare className="size-5 text-gold" />
              <h2 className="text-lg font-bold">محتوای اجتماعی</h2>
              <Badge className="bg-gold/15 text-gold text-xs">
                {toPersianDigits(String(filteredPosts.length))} پست
              </Badge>
            </div>
          </div>

          {/* Filters */}
          <Card className="glass-gold">
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={postSearch}
                    onChange={(e) => {
                      setPostSearch(e.target.value);
                      setPostPage(1);
                    }}
                    placeholder="جستجو در متن پست‌ها..."
                    className="pr-9"
                  />
                </div>
                <Select
                  value={postTypeFilter}
                  onValueChange={(v) => {
                    setPostTypeFilter(v);
                    setPostPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="نوع پست" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="trade">معامله</SelectItem>
                    <SelectItem value="opinion">نظر</SelectItem>
                    <SelectItem value="question">سؤال</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[520px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">کاربر</TableHead>
                      <TableHead className="text-xs">محتوا</TableHead>
                      <TableHead className="text-xs">نوع</TableHead>
                      <TableHead className="text-xs text-center">لایک</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">تاریخ</TableHead>
                      <TableHead className="text-xs text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading
                      ? Array.from({ length: 6 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={6}>
                              <Skeleton className="h-10 w-full" />
                            </TableCell>
                          </TableRow>
                        ))
                      : paginatedPosts.map((post) => (
                          <TableRow
                            key={post.id}
                            className="hover:bg-gold/5 transition-colors"
                          >
                            {/* User */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="size-8 shrink-0 rounded-full bg-gold/15 flex items-center justify-center text-xs font-bold text-gold">
                                  {post.isAnonymous ? (
                                    <EyeOff className="size-3.5" />
                                  ) : (
                                    (post.user?.fullName || 'ن').charAt(0)
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {post.isAnonymous
                                      ? 'ناشناس'
                                      : post.user?.fullName || 'بدون نام'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            {/* Content */}
                            <TableCell>
                              <p className="text-xs truncate max-w-[200px]">
                                {post.content.length > 80
                                  ? post.content.slice(0, 80) + '...'
                                  : post.content}
                              </p>
                            </TableCell>

                            {/* Type */}
                            <TableCell>
                              <Badge
                                className={cn(
                                  'text-[10px]',
                                  POST_TYPE_COLORS[post.postType] || 'bg-gray-500/15 text-gray-500',
                                )}
                              >
                                {POST_TYPE_LABELS[post.postType] || post.postType}
                              </Badge>
                            </TableCell>

                            {/* Likes */}
                            <TableCell className="text-center">
                              <span className="text-xs text-muted-foreground">
                                {toPersianDigits(String(post.likes))}
                              </span>
                            </TableCell>

                            {/* Date */}
                            <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                              {getTimeAgo(post.createdAt)}
                            </TableCell>

                            {/* Actions */}
                            <TableCell>
                              <div className="flex items-center justify-center">
                                {post.isAnonymous && (
                                  <Badge className="bg-gray-500/15 text-gray-500 text-[10px] ml-1">
                                    <EyeOff className="size-3 ml-1" />
                                    ناشناس
                                  </Badge>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                  onClick={() => setDeletePost(post)}
                                  title="حذف"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}

                    {!loading && paginatedPosts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10">
                          <MessageSquare className="size-10 mx-auto mb-2 opacity-20" />
                          <p className="text-muted-foreground text-sm">پستی یافت نشد</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Pagination */}
          {postTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={postPage <= 1}
                onClick={() => setPostPage((p) => p - 1)}
                className="border-gold/20 text-gold hover:bg-gold/10"
              >
                <ChevronRight className="size-4" />
                قبلی
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {toPersianDigits(String(postPage))} از{' '}
                {toPersianDigits(String(postTotalPages))}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={postPage >= postTotalPages}
                onClick={() => setPostPage((p) => p + 1)}
                className="border-gold/20 text-gold hover:bg-gold/10"
              >
                بعدی
                <ChevronLeft className="size-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/*  TAB 2: Education Lessons Management                         */}
        {/* ============================================================ */}
        <TabsContent value="education" className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <GraduationCap className="size-5 text-gold" />
              <h2 className="text-lg font-bold">مدیریت آموزش‌ها</h2>
              <Badge className="bg-gold/15 text-gold text-xs">
                {toPersianDigits(String(filteredLessons.length))} درس
              </Badge>
            </div>
            <Button
              size="sm"
              onClick={openCreateLesson}
              className="bg-gradient-to-l from-gold to-yellow-500 text-black font-bold hover:from-gold/90 hover:to-yellow-500/90 shadow-md"
            >
              <Plus className="size-4 ml-1.5" />
              افزودن درس
            </Button>
          </div>

          {/* Filters */}
          <Card className="glass-gold">
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={lessonSearch}
                    onChange={(e) => {
                      setLessonSearch(e.target.value);
                      setLessonPage(1);
                    }}
                    placeholder="جستجوی عنوان درس..."
                    className="pr-9"
                  />
                </div>
                <Select
                  value={catFilter}
                  onValueChange={(v) => {
                    setCatFilter(v);
                    setLessonPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="دسته‌بندی" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه دسته‌ها</SelectItem>
                    <SelectItem value="technical_analysis">تحلیل تکنیکال</SelectItem>
                    <SelectItem value="economy">اقتصاد</SelectItem>
                    <SelectItem value="buying_tips">نکات خرید</SelectItem>
                    <SelectItem value="risk_management">مدیریت ریسک</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={typeFilter}
                  onValueChange={(v) => {
                    setTypeFilter(v);
                    setLessonPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="نوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="video">ویدیو</SelectItem>
                    <SelectItem value="article">مقاله</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 sm:w-auto">
                  <Switch
                    checked={showInactive}
                    onCheckedChange={(v) => {
                      setShowInactive(v);
                      setLessonPage(1);
                    }}
                    className="data-[state=checked]:bg-gold"
                  />
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                    نمایش غیرفعال
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lessons Table */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[520px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">عنوان</TableHead>
                      <TableHead className="text-xs">دسته‌بندی</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">نوع</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">مدت</TableHead>
                      <TableHead className="text-xs text-center hidden sm:table-cell">بازدید</TableHead>
                      <TableHead className="text-xs text-center">وضعیت</TableHead>
                      <TableHead className="text-xs text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading
                      ? Array.from({ length: 6 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={7}>
                              <Skeleton className="h-10 w-full" />
                            </TableCell>
                          </TableRow>
                        ))
                      : paginatedLessons.map((lesson) => (
                          <TableRow
                            key={lesson.id}
                            className={cn(
                              'hover:bg-gold/5 transition-colors',
                              !lesson.isActive && 'opacity-50',
                            )}
                          >
                            {/* Title */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate max-w-[180px]">
                                  {lesson.titleFa || lesson.title}
                                </p>
                                {lesson.isPremium && (
                                  <Badge className="bg-gold/20 text-gold text-[10px] shrink-0">
                                    <Crown className="size-3 ml-0.5" />
                                  </Badge>
                                )}
                              </div>
                            </TableCell>

                            {/* Category */}
                            <TableCell>
                              <Badge
                                className={cn(
                                  'text-[10px]',
                                  CATEGORY_COLORS[lesson.category] || 'bg-gray-500/15 text-gray-500',
                                )}
                              >
                                {CATEGORY_LABELS[lesson.category] || lesson.category}
                              </Badge>
                            </TableCell>

                            {/* Type */}
                            <TableCell className="hidden md:table-cell">
                              <Badge
                                variant="outline"
                                className="text-[10px] gap-1"
                              >
                                {lesson.type === 'video' ? (
                                  <>
                                    <Play className="size-3" />
                                    ویدیو
                                  </>
                                ) : (
                                  <>
                                    <FileText className="size-3" />
                                    مقاله
                                  </>
                                )}
                              </Badge>
                            </TableCell>

                            {/* Duration */}
                            <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                              {lesson.duration > 0 ? (
                                <span className="flex items-center gap-1">
                                  <Clock className="size-3" />
                                  {formatDuration(lesson.duration)}
                                </span>
                              ) : (
                                '-'
                              )}
                            </TableCell>

                            {/* Views */}
                            <TableCell className="text-xs text-center text-muted-foreground hidden sm:table-cell">
                              {toPersianDigits(String(lesson.views))}
                            </TableCell>

                            {/* Active Status */}
                            <TableCell className="text-center">
                              <Switch
                                checked={lesson.isActive}
                                onCheckedChange={() => handleToggleLessonActive(lesson)}
                                className="data-[state=checked]:bg-emerald-500"
                              />
                            </TableCell>

                            {/* Actions */}
                            <TableCell>
                              <div className="flex items-center justify-center gap-0.5">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-7 text-muted-foreground hover:text-blue-500"
                                  onClick={() => openEditLesson(lesson)}
                                  title="ویرایش"
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                  onClick={() => setDeleteLesson(lesson)}
                                  title="حذف"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}

                    {!loading && paginatedLessons.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10">
                          <BookOpen className="size-10 mx-auto mb-2 opacity-20" />
                          <p className="text-muted-foreground text-sm">درسی یافت نشد</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Pagination */}
          {lessonTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={lessonPage <= 1}
                onClick={() => setLessonPage((p) => p - 1)}
                className="border-gold/20 text-gold hover:bg-gold/10"
              >
                <ChevronRight className="size-4" />
                قبلی
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {toPersianDigits(String(lessonPage))} از{' '}
                {toPersianDigits(String(lessonTotalPages))}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={lessonPage >= lessonTotalPages}
                onClick={() => setLessonPage((p) => p + 1)}
                className="border-gold/20 text-gold hover:bg-gold/10"
              >
                بعدی
                <ChevronLeft className="size-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ============================================================== */}
      {/*  DELETE POST DIALOG                                            */}
      {/* ============================================================== */}
      <AlertDialog open={!!deletePost} onOpenChange={(open) => !open && setDeletePost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف پست</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف این پست مطمئن هستید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deletePost && (
            <div className="rounded-lg bg-muted/50 p-3 my-2">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {deletePost.content}
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={deleteSubmitting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteSubmitting && <Loader2 className="size-4 ml-1.5 animate-spin" />}
              حذف پست
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================================== */}
      {/*  CREATE / EDIT LESSON DIALOG                                    */}
      {/* ============================================================== */}
      <Dialog open={lessonDialogOpen} onOpenChange={(open) => {
        if (!open) { setEditingLesson(null); setLessonForm(EMPTY_LESSON); }
        setLessonDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="size-5 text-gold" />
              {editingLesson ? 'ویرایش درس' : 'ایجاد درس جدید'}
            </DialogTitle>
            <DialogDescription>
              {editingLesson ? `ویرایش ${editingLesson.titleFa || editingLesson.title}` : 'اطلاعات درس جدید را وارد کنید'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Row: Title Fa + Title En */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-title-fa" className="text-sm font-medium">
                  عنوان (فارسی) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lesson-title-fa"
                  value={lessonForm.titleFa}
                  onChange={(e) => setLessonForm((f) => ({ ...f, titleFa: e.target.value }))}
                  placeholder="عنوان فارسی درس"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-title-en" className="text-sm font-medium">
                  عنوان (انگلیسی)
                </Label>
                <Input
                  id="lesson-title-en"
                  dir="ltr"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="English title"
                />
              </div>
            </div>

            {/* Row: Description Fa + Description En */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-desc-fa" className="text-sm font-medium">
                  توضیحات (فارسی)
                </Label>
                <Textarea
                  id="lesson-desc-fa"
                  value={lessonForm.descriptionFa}
                  onChange={(e) => setLessonForm((f) => ({ ...f, descriptionFa: e.target.value }))}
                  placeholder="توضیحات فارسی درس"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-desc-en" className="text-sm font-medium">
                  توضیحات (انگلیسی)
                </Label>
                <Textarea
                  id="lesson-desc-en"
                  dir="ltr"
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="English description"
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Row: Type + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">نوع محتوا</Label>
                <Select
                  value={lessonForm.type}
                  onValueChange={(v) => setLessonForm((f) => ({ ...f, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">ویدیو</SelectItem>
                    <SelectItem value="article">مقاله</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">دسته‌بندی</Label>
                <Select
                  value={lessonForm.category}
                  onValueChange={(v) => setLessonForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical_analysis">تحلیل تکنیکال</SelectItem>
                    <SelectItem value="economy">اقتصاد</SelectItem>
                    <SelectItem value="buying_tips">نکات خرید</SelectItem>
                    <SelectItem value="risk_management">مدیریت ریسک</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor="lesson-url" className="text-sm font-medium">
                لینک (URL)
              </Label>
              <Input
                id="lesson-url"
                dir="ltr"
                value={lessonForm.url}
                onChange={(e) => setLessonForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://example.com/lesson"
              />
            </div>

            {/* Content Fa */}
            <div className="space-y-2">
              <Label htmlFor="lesson-content-fa" className="text-sm font-medium">
                محتوای درس (فارسی)
              </Label>
              <Textarea
                id="lesson-content-fa"
                value={lessonForm.contentFa}
                onChange={(e) => setLessonForm((f) => ({ ...f, contentFa: e.target.value }))}
                placeholder="محتوای کامل درس به زبان فارسی..."
                rows={6}
              />
            </div>

            {/* Row: Duration + Sort Order */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-duration" className="text-sm font-medium">
                  مدت زمان (ثانیه)
                </Label>
                <Input
                  id="lesson-duration"
                  type="number"
                  dir="ltr"
                  value={lessonForm.duration}
                  onChange={(e) => setLessonForm((f) => ({ ...f, duration: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-sort" className="text-sm font-medium">
                  ترتیب نمایش
                </Label>
                <Input
                  id="lesson-sort"
                  type="number"
                  dir="ltr"
                  value={lessonForm.sortOrder}
                  onChange={(e) => setLessonForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            <Separator />

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-1.5 cursor-pointer">
                  <Crown className="size-3.5 text-gold" />
                  ویژه (Premium)
                </Label>
                <Switch
                  checked={lessonForm.isPremium}
                  onCheckedChange={(checked) =>
                    setLessonForm((f) => ({ ...f, isPremium: checked }))
                  }
                  className="data-[state=checked]:bg-gold"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-1.5 cursor-pointer">
                  <Eye className="size-3.5 text-emerald-500" />
                  فعال
                </Label>
                <Switch
                  checked={lessonForm.isActive}
                  onCheckedChange={(checked) =>
                    setLessonForm((f) => ({ ...f, isActive: checked }))
                  }
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setLessonDialogOpen(false)}
              className="border-gold/20 text-gold hover:bg-gold/10"
            >
              انصراف
            </Button>
            <Button
              onClick={handleSaveLesson}
              disabled={lessonSubmitting}
              className="bg-gradient-to-l from-gold to-yellow-500 text-black font-bold hover:from-gold/90 hover:to-yellow-500/90"
            >
              {lessonSubmitting && <Loader2 className="size-4 ml-1.5 animate-spin" />}
              {editingLesson ? 'بروزرسانی' : 'ایجاد درس'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/*  DELETE LESSON DIALOG                                          */}
      {/* ============================================================== */}
      <AlertDialog open={!!deleteLesson} onOpenChange={(open) => !open && setDeleteLesson(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف درس</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف درس &laquo;{deleteLesson?.titleFa || deleteLesson?.title}&raquo; مطمئن هستید؟
              این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLessonSubmitting}>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLesson}
              disabled={deleteLessonSubmitting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteLessonSubmitting && <Loader2 className="size-4 ml-1.5 animate-spin" />}
              حذف درس
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

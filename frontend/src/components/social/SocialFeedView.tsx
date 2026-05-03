
import {useState, useEffect, useCallback} from 'react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {MessageSquare, Heart, Send, Plus, Filter, Loader2, User, TrendingUp, BarChart3, HelpCircle, Smile, Eye, EyeOff, RefreshCw} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Skeleton} from '@/components/ui/skeleton';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import {Switch} from '@/components/ui/switch';
import {Label} from '@/components/ui/label';
import {useAppStore} from '@/lib/store';
import {formatNumber, getTimeAgo, cn} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                        */
/* ═══════════════════════════════════════════════════════════════ */

type PostType = 'all' | 'trade' | 'analysis' | 'question' | 'sentiment';

interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  content: string;
  postType: PostType;
  isAnonymous: boolean;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Constants                                                    */
/* ═══════════════════════════════════════════════════════════════ */

const POST_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  trade: { label: 'معامله', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  analysis: { label: 'تحلیل', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  question: { label: 'سوال', icon: HelpCircle, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  sentiment: { label: 'احساس بازار', icon: Smile, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
};

const ANONYMOUS_NAMES = ['کاربر طلایی', 'معاملهگر حرفه‌ای', 'عاشق طلا', 'سرمایه‌گذار هوشمند', 'طلاگرد'];

/* ═══════════════════════════════════════════════════════════════ */
/*  Mock Data                                                    */
/* ═══════════════════════════════════════════════════════════════ */

const MOCK_POSTS: SocialPost[] = [
  {
    id: '1',
    userId: 'u1',
    userName: 'سارا احمدی',
    content: 'امروز قیمت طلا روند صعودی داره. میانگین متحرک ۵ روزه بالاتر از ۲۰ روزه قرار گرفته. به نظرم فرصت خوبی برای خرید باشه.',
    postType: 'analysis',
    isAnonymous: false,
    likeCount: 24,
    isLiked: false,
    createdAt: new Date(Date.now() - 1200000).toISOString(),
  },
  {
    id: '2',
    userId: 'u2',
    userName: 'کاربر طلایی',
    content: 'فقط ۰.۵ گرم خریدم. امیدوارم درست حدس زده باشم 🤞',
    postType: 'trade',
    isAnonymous: true,
    likeCount: 8,
    isLiked: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    userId: 'u3',
    userName: 'محمد رضایی',
    content: 'به نظرتون الان وقت مناسبی برای فروش طلا هست؟ یا صبر کنیم؟',
    postType: 'question',
    isAnonymous: false,
    likeCount: 15,
    isLiked: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '4',
    userId: 'u4',
    userName: 'عاشق طلا',
    content: 'بازار الان خیلی نوسانیه. احساس می‌کنم قیمت‌ها بالاتر از حد واقعی هستن.',
    postType: 'sentiment',
    isAnonymous: true,
    likeCount: 32,
    isLiked: false,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: '5',
    userId: 'u5',
    userName: 'علی محمدی',
    content: '۳ گرم طلای جدید خریدم ✌️ پلن VIP واقعاً کارمزد صفر داره. عالیه!',
    postType: 'trade',
    isAnonymous: false,
    likeCount: 41,
    isLiked: false,
    createdAt: new Date(Date.now() - 28800000).toISOString(),
  },
  {
    id: '6',
    userId: 'u6',
    userName: 'سرمایه‌گذار هوشمند',
    content: 'اونس جهانی امروز رشد ۰.۸ درصدی داشته. احتمالاً فردا بازار داخلی هم واکنش نشون بده.',
    postType: 'analysis',
    isAnonymous: true,
    likeCount: 19,
    isLiked: true,
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
];

/* ═══════════════════════════════════════════════════════════════ */
/*  Animation Variants                                           */
/* ═══════════════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/* ═══════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                             */
/* ═══════════════════════════════════════════════════════════════ */

function FeedSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <div className="flex flex-col items-center gap-3 py-6">
        <Skeleton className="size-16 rounded-2xl" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-xl" />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Component                                                    */
/* ═══════════════════════════════════════════════════════════════ */

export default function SocialFeedView() {
  const { user, addToast } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [filter, setFilter] = useState<PostType>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<PostType>('trade');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* ── Fetch Posts ── */
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/social-feed?page=1&limit=20');
      const data = await res.json();
      if (data.success && data.posts?.length > 0) {
        setPosts(data.posts);
      } else {
        setPosts(MOCK_POSTS);
      }
    } catch {
      setPosts(MOCK_POSTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPosts(MOCK_POSTS);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  /* ── Handle Create Post ── */
  const handleCreatePost = async () => {
    if (!user?.id) return;
    if (!newContent.trim()) {
      addToast('لطفاً متن پست را وارد کنید', 'error');
      return;
    }
    if (newContent.length > 280) {
      addToast('متن پست نباید بیشتر از ۲۸۰ کاراکتر باشد', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/social-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          content: newContent.trim(),
          postType: newType,
          isAnonymous,
        }),
      });
      const data = await res.json();

      if (data.success) {
        addToast('پست با موفقیت منتشر شد! 💬', 'success');
        const newPost: SocialPost = {
          id: data.post?.id || `new-${Date.now()}`,
          userId: user.id,
          userName: isAnonymous ? ANONYMOUS_NAMES[Math.floor(Math.random() * ANONYMOUS_NAMES.length)] : (user.fullName || user.phone || 'کاربر'),
          content: newContent.trim(),
          postType: newType,
          isAnonymous,
          likeCount: 0,
          isLiked: false,
          createdAt: new Date().toISOString(),
        };
        setPosts((prev) => [newPost, ...prev]);
        setDialogOpen(false);
        setNewContent('');
        setNewType('trade');
      } else {
        addToast(data.message || 'خطا در انتشار پست', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Handle Like ── */
  const handleLike = async (postId: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/social-feed/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, isLiked: !p.isLiked, likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1 }
              : p
          )
        );
      }
    } catch {
      // Optimistic update already done
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: !p.isLiked, likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1 }
            : p
        )
      );
    }
  };

  const filteredPosts = filter === 'all' ? posts : posts.filter((p) => p.postType === filter);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <FeedSkeleton />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="mx-auto max-w-3xl space-y-6 pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col items-center gap-3 py-6 text-center">
        <motion.div
          className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-500/5 border-2 border-sky-500/30"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <MessageSquare className="size-10 text-sky-500" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-extrabold text-sky-600 dark:text-sky-400">فید اجتماعی</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            با سایر سرمایه‌گذاران تبادل نظر کنید
          </p>
        </div>
      </motion.div>

      {/* ── Filter Bar + New Post Button ── */}
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <div className="flex flex-1 gap-2 overflow-x-auto scrollbar-none pb-1">
          {[
            { type: 'all' as PostType, label: 'همه' },
            { type: 'trade' as PostType, label: 'معامله' },
            { type: 'analysis' as PostType, label: 'تحلیل' },
            { type: 'question' as PostType, label: 'سوال' },
            { type: 'sentiment' as PostType, label: 'احساس بازار' },
          ].map((f) => (
            <Button
              key={f.type}
              size="sm"
              variant={filter === f.type ? 'default' : 'outline'}
              className={filter === f.type
                ? 'bg-sky-500 hover:bg-sky-600 text-white text-xs shrink-0'
                : 'text-xs border-sky-200 dark:border-sky-800 text-muted-foreground hover:text-sky-500 shrink-0'
              }
              onClick={() => setFilter(f.type)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <Button
          size="sm"
          className="bg-sky-500 hover:bg-sky-600 text-white shrink-0"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="size-4 me-1" />
          پست جدید
        </Button>
      </motion.div>

      {/* ── Posts Feed ── */}
      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {filteredPosts.map((post, idx) => {
            const typeConfig = POST_TYPE_CONFIG[post.postType];
            const TypeIcon = typeConfig?.icon || MessageSquare;
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
              >
                <Card className="hover-lift-sm overflow-hidden">
                  <CardContent className="p-4">
                    {/* Author Row */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-full',
                        post.isAnonymous ? 'bg-gradient-to-br from-sky-400 to-blue-500' : 'bg-sky-100 dark:bg-sky-900/30'
                      )}>
                        {post.isAnonymous ? (
                          <EyeOff className="size-4 text-white" />
                        ) : (
                          <User className="size-4 text-sky-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{post.userName}</p>
                        <p className="text-[10px] text-muted-foreground">{getTimeAgo(post.createdAt)}</p>
                      </div>
                      {typeConfig && (
                        <Badge variant="outline" className={cn('text-[10px] shrink-0 gap-1', typeConfig.bg, typeConfig.color)}>
                          <TypeIcon className="size-3" />
                          {typeConfig.label}
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <p className="text-sm leading-7 whitespace-pre-wrap mb-3">{post.content}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center gap-1.5 text-xs transition-colors"
                        onClick={() => handleLike(post.id)}
                      >
                        <Heart className={cn(
                          'size-4 transition-colors',
                          post.isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-400'
                        )} />
                        <span className={cn(post.isLiked ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
                          {formatNumber(post.likeCount)}
                        </span>
                      </motion.button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>

      {filteredPosts.length === 0 && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardContent className="flex flex-col items-center gap-3 py-10">
              <MessageSquare className="size-8 text-sky-400" />
              <p className="text-sm font-semibold text-muted-foreground">پستی یافت نشد</p>
              <p className="text-xs text-muted-foreground/70">اولین نفر باشید که پست می‌گذارید!</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── New Post Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="size-5 text-sky-500" />
              پست جدید
            </DialogTitle>
            <DialogDescription>نظر خود را با جامعه سرمایه‌گذاران به اشتراک بگذارید</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Content */}
            <div className="space-y-2">
              <Label>متن پست</Label>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="نظرتان را بنویسید..."
                maxLength={280}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end">
                <span className={cn(
                  'text-xs',
                  newContent.length > 250 ? 'text-red-500' : 'text-muted-foreground'
                )}>
                  {newContent.length}/۲۸۰
                </span>
              </div>
            </div>

            {/* Post Type Selector */}
            <div className="space-y-2">
              <Label>نوع پست</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(POST_TYPE_CONFIG) as [PostType, typeof POST_TYPE_CONFIG[string]][]).map(([type, config]) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={newType === type ? 'default' : 'outline'}
                    className={newType === type
                      ? cn('text-xs', config.bg, config.color, 'border-0')
                      : 'text-xs text-muted-foreground'
                    }
                    onClick={() => setNewType(type)}
                  >
                    <config.icon className="size-3 me-1" />
                    {config.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <EyeOff className="size-4 text-muted-foreground" />
                <Label className="text-sm">ناشناس</Label>
              </div>
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                انصراف
              </Button>
              <Button
                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white"
                onClick={handleCreatePost}
                disabled={submitting || !newContent.trim()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 me-2 animate-spin" />
                    در حال ارسال...
                  </>
                ) : (
                  <>
                    <Send className="size-4 me-2" />
                    انتشار
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

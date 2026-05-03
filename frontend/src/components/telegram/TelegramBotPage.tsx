
import React, { useState, useEffect, useCallback } from 'react';
import {motion} from 'framer-motion';
import {Bot, Coins, BarChart3, Bell, Brain, Zap, FileText, CalendarDays, MessageSquare, Copy, CheckCircle2, ExternalLink, Link2, BookOpen, Send, ChevronDown, ChevronUp, Users, Radio, Loader2, AlertCircle, Sparkles, Terminal, UserCircle, Settings, ToggleLeft, ToggleRight, Clock, Shield, BellRing, Newspaper, TrendingUp, Activity, Unlink, ArrowLeftRight, Wallet, Target, Volume2, VolumeX, Moon, Sun, Globe} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {Separator} from '@/components/ui/separator';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '@/components/ui/collapsible';
import {useAppStore} from '@/lib/store';
import {useTranslation} from '@/lib/i18n';
import {useQuickAction} from '@/hooks/useQuickAction';
import {formatNumber, cn} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface BotStatusData {
  isConnected: boolean;
  botUsername: string;
  botName: string;
  version: string;
  uptime: string;
  lastPing: string;
  stats: {
    totalUsers: number;
    messagesToday: number;
    activeAlerts: number;
    dailyReports: number;
    b2bInvoices: number;
  };
}

interface BotFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface BotCommand {
  command: string;
  description: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Animation Variants                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const pulseGlowVariants: any = {
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(212, 175, 55, 0.4)',
      '0 0 0 12px rgba(212, 175, 55, 0)',
    ],
    transition: { duration: 2, repeat: Infinity, ease: 'easeOut' },
  },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Data                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const botFeatures: BotFeature[] = [
  {
    id: 'live-price',
    title: 'قیمت لحظه‌ای طلا',
    description: 'دریافت لحظه‌ای قیمت سکه، طلای ۱۸ و ۲۴ عیار و اونس جهانی',
    icon: Coins,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    id: 'chart',
    title: 'نمودار قیمت',
    description: 'مشاهده نمودار تغییرات قیمت طلا در بازه‌های زمانی مختلف',
    icon: BarChart3,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    id: 'alert',
    title: 'هشدار قیمت',
    description: 'تنظیم هشدار برای رسیدن قیمت به سطح دلخواه شما',
    icon: Bell,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    id: 'ai-analysis',
    title: 'تحلیل AI بازار',
    description: 'تحلیل هوشمند بازار بر اساس داده‌ها و الگوریتم‌های پیشرفته',
    icon: Brain,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: 'quick-trade',
    title: 'معاملات سریع',
    description: 'خرید و فروش آنی طلا مستقیماً از طریق تلگرام',
    icon: Zap,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    id: 'b2b-invoice',
    title: 'فاکتور B2B',
    description: 'ایجاد و مدیریت فاکتورهای خرید عمده طلا برای مشتریان',
    icon: FileText,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'daily-report',
    title: 'گزارش روزانه',
    description: 'دریافت گزارش روزانه بازار و تغییرات قیمت هر صبح',
    icon: CalendarDays,
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
  },
  {
    id: 'support',
    title: 'پشتیبانی',
    description: 'ارسال تیکت و دریافت پشتیبانی مستقیم از تیم زرین گلد',
    icon: MessageSquare,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
  },
];

const botCommands: BotCommand[] = [
  { command: '/start', description: 'شروع و راهنمای مقدماتی ربات' },
  { command: '/price', description: 'قیمت لحظه‌ای طلا و سکه' },
  { command: '/chart', description: 'نمودار تغییرات قیمت طلا' },
  { command: '/alert', description: 'مدیریت هشدارهای قیمت' },
  { command: '/analysis', description: 'تحلیل هوشمند بازار' },
  { command: '/buy', description: 'خرید آنی طلا' },
  { command: '/sell', description: 'فروش آنی طلا' },
  { command: '/invoice', description: 'ایجاد فاکتور B2B' },
  { command: '/profitcalc', description: 'محاسبه سود و زیان' },
  { command: '/ejratcalc', description: 'محاسبه اجرت و حقوق جمارک' },
  { command: '/daily', description: 'گزارش روزانه بازار' },
  { command: '/support', description: 'تماس با پشتیبانی' },
  { command: '/help', description: 'راهنمای کامل دستورات' },
  { command: '/link', description: 'اتصال حساب تلگرام به زرین گلد' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TelegramBotSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Feature cards skeleton */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  User Panel Types & Data                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface UserBotSettings {
  notifications: boolean;
  dailyReport: boolean;
  priceAlerts: boolean;
  tradeAlerts: boolean;
  silentMode: boolean;
  language: 'fa' | 'en';
}

interface BotActivity {
  id: string;
  action: string;
  detail: string;
  time: string;
  icon: React.ElementType;
  color: string;
}

const recentActivities: BotActivity[] = [
  { id: '1', action: 'درخواست قیمت', detail: 'سکه طلا امامی — ۳۷,۸۵۰,۰۰۰ واحد طلایی', time: '۵ دقیقه پیش', icon: Coins, color: 'text-amber-500' },
  { id: '2', action: 'تنظیم هشدار', detail: 'هشدار برای قیمت بالای ۳۸,۰۰۰,۰۰۰', time: '۲ ساعت پیش', icon: Target, color: 'text-orange-500' },
  { id: '3', action: 'دریافت گزارش', detail: 'گزارش روزانه بازار طلا', time: '۶ ساعت پیش', icon: Newspaper, color: 'text-teal-500' },
  { id: '4', action: 'خرید طلا', detail: '۰.۵ گرم طلای ۱۸ عیار', time: 'دیروز', icon: Wallet, color: 'text-emerald-500' },
  { id: '5', action: 'تحلیل AI', detail: 'تحلیل هوشمند بازار هفتگی', time: '۲ روز پیش', icon: Brain, color: 'text-purple-500' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function TelegramBotPage() {
  const { user, addToast } = useAppStore();
  const { t } = useTranslation();

  const [botData, setBotData] = useState<BotStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [botSettings, setBotSettings] = useState<UserBotSettings>({
    notifications: true,
    dailyReport: true,
    priceAlerts: true,
    tradeAlerts: false,
    silentMode: false,
    language: 'fa',
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(true);

  /* ── Fetch Bot Status ── */
  const fetchBotStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/telegram/status');
      const json = await res.json();
      if (json.success && json.data) {
        setBotData(json.data);
        setIsConnected(json.data.isConnected);
      } else {
        // Fallback mock data
        setBotData({
          isConnected: true,
          botUsername: '@ZarrinGoldBot',
          botName: 'ربات زرین گلد',
          version: '2.1.0',
          uptime: '99.8%',
          lastPing: new Date().toISOString(),
          stats: {
            totalUsers: 1247,
            messagesToday: 8432,
            activeAlerts: 312,
            dailyReports: 456,
            b2bInvoices: 89,
          },
        });
        setIsConnected(true);
      }
    } catch {
      setError(t('telegram.errorFetch'));
      // Fallback mock data
      setBotData({
        isConnected: true,
        botUsername: '@ZarrinGoldBot',
        botName: 'ربات زرین گلد',
        version: '2.1.0',
        uptime: '99.8%',
        lastPing: new Date().toISOString(),
        stats: {
          totalUsers: 1247,
          messagesToday: 8432,
          activeAlerts: 312,
          dailyReports: 456,
          b2bInvoices: 89,
        },
      });
      setIsConnected(true);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchBotStatus();
  }, [fetchBotStatus]);

  /* ── Handlers ── */

  const handleConnect = useCallback(() => {
    setConnecting(true);
    setTimeout(() => {
      setIsConnected(true);
      setConnecting(false);
      addToast(t('telegram.connected'), 'success');
    }, 2000);
  }, [addToast, t]);

  const handleCopyLink = useCallback(() => {
    const link = 'https://t.me/ZarrinGoldBot';
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      addToast(t('telegram.linkCopied'), 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(() => {
      addToast(t('telegram.copyError'), 'error');
    });
  }, [addToast, t]);

  const handleSendTest = useCallback(() => {
    setSendingTest(true);
    setTimeout(() => {
      setSendingTest(false);
      addToast(t('telegram.testSent'), 'success');
    }, 1500);
  }, [addToast, t]);

  const toggleSetting = useCallback((key: keyof UserBotSettings) => {
    setBotSettings(prev => ({ ...prev, [key]: !prev[key] }));
    addToast('تنظیمات بروزرسانی شد', 'success');
  }, [addToast]);

  /* ── Quick Action Handlers ── */
  useQuickAction('open:tg-connect', handleConnect);
  useQuickAction('click:tg-copy-link', handleCopyLink);

  /* ── Render ── */

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <TelegramBotSkeleton />
      </motion.div>
    );
  }

  if (error && !botData) {
    return (
      <Card className="border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20">
        <CardContent className="flex flex-col items-center gap-2 py-10">
          <AlertCircle className="size-8 text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button onClick={fetchBotStatus} className="text-xs text-gold hover:underline">
            {t('telegram.retry')}
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!botData) return null;

  return (
    <div className="space-y-6">
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*  Section 1: Hero Header                                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} id="tg-connect">
        <Card className="glass-gold overflow-hidden card-spotlight">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Left: Icon + Info */}
              <div className="flex items-center gap-4">
                <motion.div
                  className="relative flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-amber-500/10 border border-gold/30"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Bot className="size-7 text-gold" />
                  <motion.div
                    className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 border-2 border-background"
                    variants={pulseGlowVariants}
                    animate="animate"
                  />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold gold-gradient-text">
                      {t('telegram.botTitle')}
                    </h2>
                    {isConnected ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 text-[10px] dark:text-emerald-400">
                        <Radio className="size-3 me-1 animate-pulse" />
                        {t('telegram.connected')}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-[10px]">
                        {t('telegram.disconnected')}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {t('telegram.botDescription')}
                  </p>
                </div>
              </div>

              {/* Right: Connect Button */}
              {!isConnected ? (
                <Button
                  className="shrink-0 bg-gradient-to-r from-gold to-amber-500 text-gold-dark hover:from-gold/90 hover:to-amber-500/90 btn-gold-shine"
                  onClick={handleConnect}
                  disabled={connecting}
                >
                  {connecting ? (
                    <>
                      <Loader2 className="size-4 me-2 animate-spin" />
                      {t('telegram.connecting')}
                    </>
                  ) : (
                    <>
                      <Link2 className="size-4 me-2" />
                      {t('telegram.connectAccount')}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="shrink-0 btn-gold-outline"
                  asChild
                >
                  <a href="https://t.me/ZarrinGoldBot" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4 me-2" />
                    {t('telegram.openBot')}
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*  Section 1.5: USER PANEL                                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut', delay: 0.08 }}>
        <div className="mb-4 flex items-center gap-2">
          <UserCircle className="size-4 text-gold" />
          <h3 className="text-sm font-semibold">پنل کاربری ربات</h3>
          <Badge variant="secondary" className="bg-gold/10 text-gold text-[10px] border-gold/20">کاربر متصل</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* ── Connected Account Card ── */}
          <Card className="card-gold-border overflow-hidden lg:row-span-2">
            <div className="h-1 bg-gradient-to-l from-gold via-gold-light to-gold" />
            <CardContent className="p-5 space-y-4">
              {/* User avatar + name */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="size-14 rounded-2xl bg-gradient-to-br from-[#2AABEE]/20 to-[#2AABEE]/5 border border-[#2AABEE]/30 flex items-center justify-center">
                    <svg className="size-7" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.74 3.98-1.73 6.63-2.87 7.97-3.44 3.8-1.58 4.59-1.86 5.1-1.87.11 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .38z" fill="#2AABEE"/>
                    </svg>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                    <CheckCircle2 className="size-2.5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{user?.fullName || 'کاربر زرین گلد'}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <span>@{user?.phone?.slice(-8) || 'user'}</span>
                    <span className="text-gold">•</span>
                    <span className="text-[#2AABEE]">Telegram</span>
                  </p>
                </div>
              </div>

              <Separator />

              {/* Connection details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">وضعیت اتصال</span>
                  <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20 text-[10px]">
                    <Radio className="size-3 me-1 animate-pulse" />
                    متصل
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">تاریخ اتصال</span>
                  <span className="text-xs font-medium">۱۴۰۴/۰۲/۰۱</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">نسخه ربات</span>
                  <span className="text-xs font-medium font-mono">v2.1.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">شناسه چت</span>
                  <span className="text-xs font-medium font-mono text-muted-foreground">
                    {user?.id?.slice(0, 12) || '------'}...
                  </span>
                </div>
              </div>

              <Separator />

              {/* Quick user stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'پیام‌ها', value: '۸۴', icon: MessageSquare },
                  { label: 'هشدارها', value: '۱۲', icon: Bell },
                  { label: 'معاملات', value: '۵', icon: ArrowLeftRight },
                ].map((stat) => {
                  const SIcon = stat.icon;
                  return (
                    <div key={stat.label} className="text-center rounded-xl bg-muted/40 p-2.5 border border-border/30">
                      <SIcon className="size-3.5 text-gold mx-auto mb-1" />
                      <p className="text-sm font-bold">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Link / Unlink */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 btn-gold-outline text-xs"
                  asChild
                >
                  <a href="https://t.me/ZarrinGoldBot?start=settings" target="_blank" rel="noopener noreferrer">
                    <Settings className="size-3.5 me-1.5" />
                    مدیریت در ربات
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10 border-red-500/20"
                  onClick={() => addToast('اتصال ربات قطع شد', 'error')}
                >
                  <Unlink className="size-3.5 me-1.5" />
                  قطع اتصال
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Bot Settings Card ── */}
          <Card className="overflow-hidden lg:col-span-2">
            <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
              <CollapsibleTrigger className="w-full">
                <CardContent className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-gold/10">
                      <Settings className="size-5 text-gold" />
                    </div>
                    <div className="text-start">
                      <span className="text-sm font-semibold">تنظیمات اعلان‌ها و ربات</span>
                      <p className="text-xs text-muted-foreground">مدیریت نحوه دریافت پیام‌ها از ربات</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {botSettings.notifications ? 'فعال' : 'غیرفعال'}
                    </Badge>
                    {settingsOpen ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardContent>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <Separator />
                <CardContent className="p-4 space-y-1">
                  {[
                    { key: 'notifications' as const, label: 'اعلان‌های عمومی', desc: 'اطلاعیه‌ها، اخبار و اطلاع‌رسانی‌ها', icon: BellRing, color: 'text-sky-500', bg: 'bg-sky-500/10' },
                    { key: 'dailyReport' as const, label: 'گزارش روزانه بازار', desc: 'هر صبح گزارش قیمت طلا و سکه', icon: Newspaper, color: 'text-teal-500', bg: 'bg-teal-500/10' },
                    { key: 'priceAlerts' as const, label: 'هشدارهای قیمت', desc: 'اعلان رسیدن قیمت به حد دلخواه', icon: Target, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                    { key: 'tradeAlerts' as const, label: 'اعلان معاملات', desc: 'تأیید و اطلاع‌رسانی خرید/فروش', icon: ArrowLeftRight, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { key: 'silentMode' as const, label: 'حالت بی‌صدا', desc: 'فقط دریافت پیام بدون نوتیفیکیشن', icon: VolumeX, color: 'text-muted-foreground', bg: 'bg-muted/50' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isOn = botSettings[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleSetting(item.key)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-all duration-200 group"
                      >
                        <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', item.bg)}>
                          <Icon className={cn('size-4.5', item.color)} />
                        </div>
                        <div className="flex-1 min-w-0 text-start">
                          <p className={cn('text-sm font-medium', isOn ? 'text-foreground' : 'text-muted-foreground')}>{item.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                        <div className="shrink-0">
                          {isOn ? (
                            <ToggleRight className="size-7 text-gold group-hover:scale-110 transition-transform" />
                          ) : (
                            <ToggleLeft className="size-7 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* ── Recent Activity Card ── */}
          <Card className="overflow-hidden lg:col-span-2">
            <Collapsible open={activityOpen} onOpenChange={setActivityOpen}>
              <CollapsibleTrigger className="w-full">
                <CardContent className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10">
                      <Activity className="size-5 text-violet-500" />
                    </div>
                    <div className="text-start">
                      <span className="text-sm font-semibold">فعالیت‌های اخیر ربات</span>
                      <p className="text-xs text-muted-foreground">آخرین تعاملات شما با ربات تلگرام</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {recentActivities.length} مورد
                    </Badge>
                    {activityOpen ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardContent>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <Separator />
                <div className="max-h-72 overflow-y-auto">
                  <div className="divide-y divide-border/30">
                    {recentActivities.map((activity, index) => {
                      const AIcon = activity.icon;
                      return (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                        >
                          <div className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-xl',
                            `${activity.color.replace('text-', '')}`.includes('/') ? activity.color.replace('text-', 'bg-') + '/10' : `bg-muted/50`
                          )}>
                            <AIcon className={cn('size-4', activity.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{activity.detail}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Clock className="size-3 text-muted-foreground/50" />
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">{activity.time}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>

        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*  Section 2: Feature Cards Grid                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <motion.div id="tg-features" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut', delay: 0.16 }}>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="size-4 text-gold" />
          <h3 className="text-sm font-semibold">{t('telegram.features')}</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {botFeatures.map((feature) => {
            const FeatureIcon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="card-spotlight hover-lift-sm overflow-hidden h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', feature.bgColor)}>
                        <FeatureIcon className={cn('size-5', feature.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{feature.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*  Section 3: Commands Reference (Collapsible)                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut', delay: 0.24 }}>
        <Collapsible open={commandsOpen} onOpenChange={setCommandsOpen}>
          <Card className="overflow-hidden">
            <CollapsibleTrigger className="w-full">
              <CardContent className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10">
                    <Terminal className="size-5 text-violet-500" />
                  </div>
                  <div className="text-start">
                    <span className="text-sm font-semibold">{t('telegram.commands')}</span>
                    <p className="text-xs text-muted-foreground">{t('telegram.commandsDesc')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {botCommands.length} {t('telegram.command')}
                  </Badge>
                  {commandsOpen ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <Separator />
              <div className="max-h-96 overflow-y-auto">
                <div className="divide-y divide-border/50">
                  {botCommands.map((cmd) => (
                    <div
                      key={cmd.command}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <code className="shrink-0 rounded-lg bg-gold/10 px-2.5 py-1 text-xs font-mono font-semibold text-gold">
                        {cmd.command}
                      </code>
                      <p className="text-sm text-muted-foreground">{cmd.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*  Section 4: Quick Actions                                          */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <motion.div id="tg-guide" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut', delay: 0.32 }}>
        <div className="mb-4 flex items-center gap-2">
          <Zap className="size-4 text-gold" />
          <h3 className="text-sm font-semibold">{t('telegram.quickActions')}</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Copy Bot Link */}
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} id="tg-copy-link">
            <Card className="card-spotlight hover-lift-sm overflow-hidden h-full">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10">
                    <Copy className="size-5 text-sky-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{t('telegram.copyLink')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('telegram.copyLinkDesc')}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 btn-gold-outline w-full text-xs"
                      onClick={handleCopyLink}
                    >
                      {copiedLink ? (
                        <>
                          <CheckCircle2 className="size-3.5 me-1 text-emerald-500" />
                          {t('common.copied')}
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5 me-1" />
                          {t('common.copy')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Link Account Guide */}
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="card-spotlight hover-lift-sm overflow-hidden h-full">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                    <BookOpen className="size-5 text-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{t('telegram.linkGuide')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('telegram.linkGuideDesc')}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 btn-gold-outline w-full text-xs"
                      asChild
                    >
                      <a href="https://t.me/ZarrinGoldBot?start=link" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-3.5 me-1" />
                        {t('telegram.viewGuide')}
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Send Test Message */}
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="card-spotlight hover-lift-sm overflow-hidden h-full">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                    <Send className="size-5 text-rose-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{t('telegram.testMessage')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('telegram.testMessageDesc')}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 btn-gold-outline w-full text-xs"
                      onClick={handleSendTest}
                      disabled={sendingTest}
                    >
                      {sendingTest ? (
                        <>
                          <Loader2 className="size-3.5 me-1 animate-spin" />
                          {t('telegram.sending')}
                        </>
                      ) : (
                        <>
                          <Send className="size-3.5 me-1" />
                          {t('telegram.sendTest')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*  Section 5: Bot Stats                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut', delay: 0.4 }}>
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="size-4 text-gold" />
          <h3 className="text-sm font-semibold">{t('telegram.botStats')}</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: t('telegram.statUsers'),
              value: botData.stats.totalUsers,
              icon: Users,
              color: 'text-amber-500',
              bgColor: 'bg-amber-500/10',
            },
            {
              label: t('telegram.statMessages'),
              value: botData.stats.messagesToday,
              icon: MessageSquare,
              color: 'text-emerald-500',
              bgColor: 'bg-emerald-500/10',
            },
            {
              label: t('telegram.statAlerts'),
              value: botData.stats.activeAlerts,
              icon: Bell,
              color: 'text-orange-500',
              bgColor: 'bg-orange-500/10',
            },
          ].map((stat) => {
            const StatIcon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="overflow-hidden h-full">
                  <CardContent className="p-4 text-center">
                    <div className={cn('mx-auto mb-2 flex size-10 items-center justify-center rounded-xl', stat.bgColor)}>
                      <StatIcon className={cn('size-5', stat.color)} />
                    </div>
                    <p className="text-xl font-bold tabular-nums gold-gradient-text">
                      {formatNumber(stat.value)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*  Footer Info                                                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut', delay: 0.48 }}>
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-start">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gold/10">
                <Bot className="size-4 text-gold" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  {t('telegram.footerInfo')}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">
                v{botData.version}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

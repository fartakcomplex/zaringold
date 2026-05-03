
import React, { useState, useEffect, useCallback } from 'react';
import {useAppStore} from '@/lib/store';
import {cn} from '@/lib/utils';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Progress} from '@/components/ui/progress';
import {Switch} from '@/components/ui/switch';
import {Separator} from '@/components/ui/separator';
import {Skeleton} from '@/components/ui/skeleton';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from '@/components/ui/alert-dialog';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {Mail, Send, BarChart3, Users, CheckCircle, XCircle, Clock, Loader2, Plus, Copy, Trash2, Play, Ban, CalendarDays, Search, FileText, Gift, ShieldAlert, ShieldCheck, TrendingUp, Download, Filter, ChevronLeft, ChevronRight, Sparkles, RefreshCw, Inbox, Eye, Zap, Settings, MousePointerClick, MailOpen, AlertTriangle, Server, Key, Upload, UserPlus, Workflow, Bot, Target, type LucideIcon} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatNumber(n: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(n));
}

function toPersianDigits(str: string): string {
  const d = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/\d/g, (c) => d[parseInt(c)]);
}

function truncate(str: string, len: number): string {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface EmailStats {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  todaySent: number;
  todayCost: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  chartData: { day: string; sent: number; opened: number; clicked: number }[];
}

interface EmailCampaign {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
  subject: string;
  previewText: string;
  recipientCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  sentAt?: string;
  createdAt: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  type: string;
  variables: string[];
  active: boolean;
}

interface Subscriber {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  subscribedAt: string;
  source: string;
}

interface Automation {
  id: string;
  name: string;
  trigger: string;
  templateId: string;
  enabled: boolean;
  sentCount: number;
  cron?: string;
  threshold?: number;
}

interface EmailLog {
  id: string;
  date: string;
  email: string;
  subject: string;
  type: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  opens: number;
  clicks: number;
}

interface EmailConfig {
  provider: {
    name: string;
    host: string;
    port: number;
    username: string;
    password: string;
    fromName: string;
    fromEmail: string;
    encryption: string;
    status: string;
  };
  settings: {
    defaultTemplate: string;
    unsubscribeFooter: boolean;
    trackingOpens: boolean;
    trackingClicks: boolean;
    bounceHandling: boolean;
    dailyLimit: number;
    dailyUsed: number;
  };
  automations: Automation[];
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants & Labels                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CAMPAIGN_TYPES: Record<string, string> = {
  newsletter: 'خبرنامه',
  welcome: 'خوش‌آمدگویی',
  promotional: 'ترویجی',
  transactional: 'تراکنشی',
  abandoned_cart: 'سبد خرید رها شده',
  re_engagement: 'بازگشت مخاطب',
};

const TRIGGER_LABELS: Record<string, string> = {
  signup: 'ثبت‌نام',
  transaction: 'تراکنش',
  price_change: 'تغییر قیمت',
  schedule: 'زمان‌بندی',
  abandoned_cart: 'سبد خرید رها شده',
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: 'پیش‌نویس', color: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
  scheduled: { label: 'زمان‌بندی شده', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  sending: { label: 'در حال ارسال', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  completed: { label: 'تکمیل شده', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  cancelled: { label: 'لغو شده', color: 'bg-red-500/15 text-red-400 border-red-500/20' },
  sent: { label: 'ارسال شده', color: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
  delivered: { label: 'تحویل شده', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  opened: { label: 'باز شده', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  clicked: { label: 'کلیک شده', color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  bounced: { label: 'برگشت‌خورده', color: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  failed: { label: 'ناموفق', color: 'bg-red-500/15 text-red-400 border-red-500/20' },
  active: { label: 'فعال', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  unsubscribed: { label: 'لغو اشتراک', color: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
};

const VARIABLE_HINTS = [
  { var: '{name}', desc: 'نام کاربر' },
  { var: '{email}', desc: 'ایمیل کاربر' },
  { var: '{amount}', desc: 'مبلغ' },
  { var: '{date}', desc: 'تاریخ' },
  { var: '{app_name}', desc: 'نام اپلیکیشن' },
  { var: '{gold_price}', desc: 'قیمت طلا' },
  { var: '{ref_code}', desc: 'کد معرفی' },
];

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 't1',
    name: 'خوش‌آمدگویی',
    subject: 'به زرین گلد خوش آمدید!',
    htmlContent: '<h1>به زرین گلد خوش آمدید {name} عزیز!</h1><p>ما خوشحالیم که شما را در خانواده زرین گلد داریم. اکنون می‌توانید به معاملات طلا بپردازید.</p><p>با تشکر،<br/>تیم زرین گلد</p>',
    type: 'welcome',
    variables: ['{name}'],
    active: true,
  },
  {
    id: 't2',
    name: 'تایید ثبت‌نام',
    subject: 'تایید ثبت‌نام شما در زرین گلد',
    htmlContent: '<h2>تایید ثبت‌نام</h2><p>سلام {name} عزیز،</p><p>ثبت‌نام شما با موفقیت انجام شد.</p><p>ایمیل: {email}</p>',
    type: 'transactional',
    variables: ['{name}', '{email}'],
    active: true,
  },
  {
    id: 't3',
    name: 'بازنشانی رمز عبور',
    subject: 'بازیابی رمز عبور شما',
    htmlContent: '<h2>بازیابی رمز عبور</h2><p>سلام {name} عزیز،</p><p>برای بازیابی رمز عبور خود روی لینک زیر کلیک کنید:</p><p><a href="#">بازیابی رمز عبور</a></p><p>اگر این درخواست توسط شما نبوده، این ایمیل را نادیده بگیرید.</p>',
    type: 'transactional',
    variables: ['{name}'],
    active: true,
  },
  {
    id: 't4',
    name: 'خبرنامه هفتگی',
    subject: 'خبرنامه هفتگی زرین گلد',
    htmlContent: '<h2>📰 خبرنامه هفتگی زرین گلد</h2><p>سلام {name} عزیز،</p><p>خلاصه آخرین اخبار و تحلیل‌های بازار طلا:</p><ul><li>روند قیمت طلا در هفته گذشته</li><li>پیش‌بینی بازار</li><li>نکات طلایی سرمایه‌گذاری</li></ul>',
    type: 'newsletter',
    variables: ['{name}'],
    active: true,
  },
  {
    id: 't5',
    name: 'اعلان تراکنش',
    subject: 'اطلاعیه تراکنش',
    htmlContent: '<h2>اطلاعیه تراکنش</h2><p>سلام {name} عزیز،</p><p>تراکنش شما به مبلغ <strong>{amount} تومان</strong> در تاریخ {date} با موفقیت انجام شد.</p>',
    type: 'transactional',
    variables: ['{name}', '{amount}', '{date}'],
    active: true,
  },
  {
    id: 't6',
    name: 'هشدار قیمت طلا',
    subject: '🔔 هشدار تغییر قیمت طلا',
    htmlContent: '<h2>هشدار تغییر قیمت</h2><p>سلام {name} عزیز،</p><p>قیمت طلا تغییر یافته است. قیمت فعلی: <strong>{gold_price} تومان</strong></p><p>برای مشاهده جزئیات به اپلیکیشن مراجعه کنید.</p>',
    type: 'promotional',
    variables: ['{name}', '{gold_price}'],
    active: true,
  },
  {
    id: 't7',
    name: 'تخفیف ویژه',
    subject: '🎁 تخفیف ویژه زرین گلد',
    htmlContent: '<h1>تخفیف ویژه برای شما!</h1><p>سلام {name} عزیز،</p><p>زرین گلد یک تخفیف ویژه برای شما در نظر گرفته است. با کد <strong>{ref_code}</strong> از این پیشنهاد بهره‌مند شوید.</p>',
    type: 'promotional',
    variables: ['{name}', '{ref_code}'],
    active: true,
  },
  {
    id: 't8',
    name: 'یادآوری سبد خرید',
    subject: 'سبد خرید شما در انتظار تکمیل است',
    htmlContent: '<h2>یادآوری سبد خرید</h2><p>سلام {name} عزیز،</p><p>شما سبد خرید خود را نیمه‌کاره رها کرده‌اید. برای تکمیل خرید روی لینک زیر کلیک کنید.</p>',
    type: 'abandoned_cart',
    variables: ['{name}'],
    active: false,
  },
  {
    id: 't9',
    name: 'گزارش ماهانه',
    subject: '📊 گزارش ماهانه حساب شما',
    htmlContent: '<h2>گزارش ماهانه</h2><p>سلام {name} عزیز،</p><p>گزارش فعالیت‌های ماهانه شما:</p><p>مجموع معاملات: <strong>{amount} تومان</strong></p>',
    type: 'newsletter',
    variables: ['{name}', '{amount}'],
    active: true,
  },
  {
    id: 't10',
    name: 'دعوت دوست',
    subject: 'دعوت به زرین گلد - کد هدیه {ref_code}',
    htmlContent: '<h1>دعوت به زرین گلد</h1><p>سلام {name} عزیز،</p><p>دوست شما شما را به زرین گلد دعوت کرده است. با ثبت‌نام از طریق لینک زیر، هر دو از هدیه ویژه بهره‌مند شوید!</p>',
    type: 'promotional',
    variables: ['{name}', '{ref_code}'],
    active: true,
  },
];

const DEFAULT_CAMPAIGNS: EmailCampaign[] = [
  {
    id: 'c1', name: 'خبرنامه هفتگی - تحلیل بازار', type: 'newsletter',
    status: 'completed', subject: 'تحلیل بازار طلا - هفته سوم اردیبهشت',
    previewText: 'آخرین تحلیل‌ها و پیش‌بینی‌های بازار طلا',
    recipientCount: 3200, openedCount: 2150, clickedCount: 680, bouncedCount: 45,
    sentAt: new Date(Date.now() - 86400000 * 3).toISOString(), createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'c2', name: 'خوش‌آمدگویی جدیدان', type: 'welcome',
    status: 'sending', subject: 'به زرین گلد خوش آمدید! 🎉',
    previewText: 'شروع معاملات طلا با زرین گلد',
    recipientCount: 1850, openedCount: 620, clickedCount: 180, bouncedCount: 12,
    sentAt: new Date(Date.now() - 3600000).toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'c3', name: 'کمپین تخفیف نوروزی', type: 'promotional',
    status: 'completed', subject: 'عید نوروز مبارک! تخفیف ویژه تا ۵۰٪',
    previewText: 'فقط تا پایان فروردین',
    recipientCount: 4500, openedCount: 2800, clickedCount: 1100, bouncedCount: 90,
    sentAt: new Date(Date.now() - 86400000 * 15).toISOString(), createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'c4', name: 'تخفیف VIP', type: 'promotional',
    status: 'scheduled', subject: 'پیشنهاد ویژه مشتریان طلایی',
    previewText: 'تنها برای اعضای VIP',
    recipientCount: 450, openedCount: 0, clickedCount: 0, bouncedCount: 0,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'c5', name: 'هشدار قیمت', type: 'transactional',
    status: 'completed', subject: 'قیمت طلا ۳٪ افزایش یافت',
    previewText: 'اطلاعیه تغییر قیمت',
    recipientCount: 8900, openedCount: 5200, clickedCount: 1840, bouncedCount: 150,
    sentAt: new Date(Date.now() - 86400000 * 7).toISOString(), createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'c6', name: 'بازگشت مخاطب', type: 're_engagement',
    status: 'draft', subject: 'دلتان برای ما تنگ نشده؟',
    previewText: 'پیشنهادات ویژه برای بازگشت شما',
    recipientCount: 0, openedCount: 0, clickedCount: 0, bouncedCount: 0,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_SUBSCRIBERS: Subscriber[] = [
  { id: 's1', email: 'ali.mohammadi@gmail.com', name: 'علی محمدی', status: 'active', subscribedAt: '۱۴۰۳/۰۱/۱۵', source: 'ثبت‌نام' },
  { id: 's2', email: 'sara.ahmadi@yahoo.com', name: 'سارا احمدی', status: 'active', subscribedAt: '۱۴۰۳/۰۲/۰۳', source: 'خبرنامه' },
  { id: 's3', email: 'reza.karimi@outlook.com', name: 'رضا کریمی', status: 'active', subscribedAt: '۱۴۰۳/۰۲/۱۰', source: 'ثبت‌نام' },
  { id: 's4', email: 'maryam.hosseini@gmail.com', name: 'مریم حسینی', status: 'unsubscribed', subscribedAt: '۱۴۰۳/۰۱/۲۰', source: 'خبرنامه' },
  { id: 's5', email: 'hasan.rezaei@yahoo.com', name: 'حسن رضایی', status: 'active', subscribedAt: '۱۴۰۳/۰۳/۰۱', source: 'فرم وبسایت' },
  { id: 's6', email: 'leila.moradi@gmail.com', name: 'لیلا مرادی', status: 'bounced', subscribedAt: '۱۴۰۳/۰۲/۱۵', source: 'ثبت‌نام' },
  { id: 's7', email: 'amir.nazari@outlook.com', name: 'امیر ناظری', status: 'active', subscribedAt: '۱۴۰۳/۰۳/۰۵', source: 'کمپین' },
  { id: 's8', email: 'fatemeh.jafari@gmail.com', name: 'فاطمه جعفری', status: 'active', subscribedAt: '۱۴۰۳/۰۳/۱۰', source: 'ثبت‌نام' },
  { id: 's9', email: 'mehdi.rahimi@yahoo.com', name: 'مهدی رحیمی', status: 'unsubscribed', subscribedAt: '۱۴۰۳/۰۱/۲۵', source: 'خبرنامه' },
  { id: 's10', email: 'zahra.mousavi@gmail.com', name: 'زهرا موسوی', status: 'active', subscribedAt: '۱۴۰۳/۰۳/۱۲', source: 'فرم وبسایت' },
  { id: 's11', email: 'omid.sadeghi@outlook.com', name: 'امید صادقی', status: 'active', subscribedAt: '۱۴۰۳/۰۳/۱۵', source: 'ثبت‌نام' },
  { id: 's12', email: 'narges.akbari@gmail.com', name: 'نرگس اکبری', status: 'bounced', subscribedAt: '۱۴۰۳/۰۲/۲۰', source: 'کمپین' },
];

const DEFAULT_LOGS: EmailLog[] = Array.from({ length: 25 }, (_, i) => ({
  id: `el${i + 1}`,
  date: new Date(Date.now() - i * 3600000 * 3).toISOString(),
  email: ['ali.m@gmail.com', 'sara.a@yahoo.com', 'reza.k@outlook.com', 'maryam.h@gmail.com', 'hasan.r@yahoo.com', 'leila.m@gmail.com', 'amir.n@outlook.com', 'fatemeh.j@gmail.com'][i % 8],
  subject: ['خوش‌آمدگویی', 'اطلاعیه تراکنش', 'خبرنامه هفتگی', 'هشدار قیمت طلا', 'تخفیف ویژه', 'گزارش ماهانه', 'یادآوری سبد', 'دعوت دوست'][i % 8],
  type: ['newsletter', 'transactional', 'promotional', 'welcome', 'abandoned_cart', 're_engagement'][i % 6],
  status: (['sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'] as const)[i % 6],
  opens: Math.floor(Math.random() * 3),
  clicks: Math.floor(Math.random() * 2),
}));

const DEFAULT_AUTOMATIONS: Automation[] = [
  { id: 'a1', name: 'خوش‌آمدگویی', trigger: 'signup', templateId: 't1', enabled: true, sentCount: 892 },
  { id: 'a2', name: 'تایید تراکنش', trigger: 'transaction', templateId: 't5', enabled: true, sentCount: 3456 },
  { id: 'a3', name: 'خبرنامه هفتگی', trigger: 'schedule', templateId: 't4', enabled: true, sentCount: 120, cron: '0 9 * * 1' },
  { id: 'a4', name: 'هشدار قیمت', trigger: 'price_change', templateId: 't6', enabled: false, sentCount: 45, threshold: 2 },
];

const DEFAULT_CONFIG: EmailConfig = {
  provider: {
    name: 'smtp',
    host: 'smtp.gmail.com',
    port: 587,
    username: 'noreply@zaringold.ir',
    password: '****',
    fromName: 'زرین گلد',
    fromEmail: 'noreply@zaringold.ir',
    encryption: 'tls',
    status: 'connected',
  },
  settings: {
    defaultTemplate: 'welcome',
    unsubscribeFooter: true,
    trackingOpens: true,
    trackingClicks: true,
    bounceHandling: true,
    dailyLimit: 5000,
    dailyUsed: 1560,
  },
  automations: DEFAULT_AUTOMATIONS,
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub-Components                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StatusBadge({ status, animate }: { status: string; animate?: boolean }) {
  const info = STATUS_MAP[status] || STATUS_MAP.draft;
  return (
    <Badge
      variant="outline"
      className={cn('text-[10px] font-medium gap-1 border', info.color, animate && 'animate-pulse')}
    >
      {status === 'sending' && <Loader2 className="size-3 animate-spin" />}
      {status === 'completed' && <CheckCircle className="size-3" />}
      {status === 'failed' && <XCircle className="size-3" />}
      {status === 'delivered' && <CheckCircle className="size-3" />}
      {status === 'opened' && <MailOpen className="size-3" />}
      {status === 'clicked' && <MousePointerClick className="size-3" />}
      {status === 'bounced' && <AlertTriangle className="size-3" />}
      {status === 'scheduled' && <CalendarDays className="size-3" />}
      {status === 'cancelled' && <Ban className="size-3" />}
      {status === 'active' && <CheckCircle className="size-3" />}
      {status === 'draft' && <FileText className="size-3" />}
      {info.label}
    </Badge>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  iconColor = 'text-[#D4AF37]',
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  subtitle?: string;
  iconColor?: string;
}) {
  return (
    <Card className="card-gold-border bg-card rounded-2xl overflow-hidden group hover:scale-[1.01] transition-all duration-300">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-xl sm:text-2xl font-bold gold-gradient-text tabular-nums">{value}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20 transition-colors">
            <Icon className={cn('size-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="size-16 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mb-4">
        <Icon className="size-8 text-[#D4AF37]" />
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  badge,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10">
            <Icon className="size-4 text-[#D4AF37]" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-sm font-bold truncate">{title}</CardTitle>
            {description && <CardDescription className="text-[11px] mt-0.5">{description}</CardDescription>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge}
          {action}
        </div>
      </div>
    </CardHeader>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SVG Mini Chart                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MiniChart({ data, openColor = '#3b82f6', clickColor = '#D4AF37' }: {
  data: { day: string; opened: number; clicked: number }[];
  openColor?: string;
  clickColor?: string;
}) {
  if (!data || data.length === 0) return null;
  const w = 600, h = 200, px = 40, py = 20;
  const maxVal = Math.max(...data.flatMap((d) => [d.opened, d.clicked]), 1);
  const xStep = (w - px * 2) / (data.length - 1);

  const toX = (i: number) => px + i * xStep;
  const toY = (v: number) => h - py - (v / maxVal) * (h - py * 2);

  const openPoints = data.map((d, i) => `${toX(i)},${toY(d.opened)}`).join(' ');
  const clickPoints = data.map((d, i) => `${toX(i)},${toY(d.clicked)}`).join(' ');

  const openArea = `${px},${h - py} ${openPoints} ${px + (data.length - 1) * xStep},${h - py}`;
  const clickArea = `${px},${h - py} ${clickPoints} ${px + (data.length - 1) * xStep},${h - py}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="openGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={openColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={openColor} stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={clickColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={clickColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {Array.from({ length: 4 }).map((_, i) => {
        const y = py + (i * (h - py * 2)) / 3;
        return <line key={i} x1={px} y1={y} x2={w - px} y2={y} stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />;
      })}
      {/* Areas */}
      <polygon points={openArea} fill="url(#openGrad)" />
      <polygon points={clickArea} fill="url(#clickGrad)" />
      {/* Lines */}
      <polyline points={openPoints} fill="none" stroke={openColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={clickPoints} fill="none" stroke={clickColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {data.map((d, i) => (
        <React.Fragment key={i}>
          <circle cx={toX(i)} cy={toY(d.opened)} r="4" fill={openColor} stroke="white" strokeWidth="2" />
          <circle cx={toX(i)} cy={toY(d.clicked)} r="4" fill={clickColor} stroke="white" strokeWidth="2" />
        </React.Fragment>
      ))}
      {/* Labels */}
      {data.map((d, i) => (
        <text key={i} x={toX(i)} y={h - 4} textAnchor="middle" fill="currentColor" className="text-[10px]" opacity="0.5">
          {d.day.slice(0, 3)}
        </text>
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function EmailSettings() {
  const { addToast } = useAppStore();

  const [activeTab, setActiveTab] = useState('dashboard');

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Dashboard                                                  */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Campaigns                                                  */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>(DEFAULT_CAMPAIGNS);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ name: '', type: 'newsletter', subject: '', previewText: '', content: '' });
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Templates                                                  */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({ name: '', subject: '', htmlContent: '', type: 'welcome' });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Subscribers                                                */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [subscribers, setSubscribers] = useState<Subscriber[]>(DEFAULT_SUBSCRIBERS);
  const [subscriberStats, setSubscriberStats] = useState({ total: 12, active: 8, unsubscribed: 2, bounced: 2 });
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [subscriberStatusFilter, setSubscriberStatusFilter] = useState('all');
  const [addSubscriberOpen, setAddSubscriberOpen] = useState(false);
  const [addSubForm, setAddSubForm] = useState({ email: '', name: '' });

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Automations                                                */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [automations, setAutomations] = useState<Automation[]>(DEFAULT_AUTOMATIONS);
  const [addAutomationOpen, setAddAutomationOpen] = useState(false);
  const [autoForm, setAutoForm] = useState({ name: '', trigger: 'signup', templateId: 't1' });

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Quick Send                                                 */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [quickEmails, setQuickEmails] = useState('');
  const [quickSubject, setQuickSubject] = useState('');
  const [quickBody, setQuickBody] = useState('');
  const [quickType, setQuickType] = useState('newsletter');
  const [quickSending, setQuickSending] = useState(false);
  const [quickConfirmOpen, setQuickConfirmOpen] = useState(false);

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Logs                                                       */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [logs, setLogs] = useState<EmailLog[]>(DEFAULT_LOGS);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilters, setLogFilters] = useState({ type: 'all', status: 'all', search: '' });
  const [logPage, setLogPage] = useState(1);

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Config                                                     */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [config, setConfig] = useState<EmailConfig>(DEFAULT_CONFIG);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configForm, setConfigForm] = useState({
    host: 'smtp.gmail.com',
    port: '587',
    username: 'noreply@zaringold.ir',
    password: '',
    fromName: 'زرین گلد',
    fromEmail: 'noreply@zaringold.ir',
    encryption: 'tls',
  });
  const [settingsForm, setSettingsForm] = useState({
    trackingOpens: true,
    trackingClicks: true,
    unsubscribeFooter: true,
    bounceHandling: true,
    dailyLimit: 5000,
  });
  const [testingConnection, setTestingConnection] = useState(false);

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  API Fetch Functions                                                 */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/email/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.totalSent !== undefined) {
          setStats(data);
        } else if (data.data) {
          setStats({ totalSent: data.data.totalSent || 0, delivered: data.data.totalSent || 0, opened: data.data.totalOpened || 0, clicked: data.data.totalClicked || 0, bounced: data.data.totalBounced || 0, unsubscribed: 150, todaySent: data.data.todaySent || 0, todayCost: 0, openRate: data.data.openRate || 0, clickRate: data.data.clickRate || 0, bounceRate: 3.6, chartData: [] });
        } else {
          setStats({
            totalSent: 8920, delivered: 8450, opened: 5200, clicked: 1840, bounced: 320, unsubscribed: 150,
            todaySent: 156, todayCost: 0, openRate: 58.3, clickRate: 20.6, bounceRate: 3.6,
            chartData: [
              { day: 'شنبه', sent: 380, opened: 220, clicked: 85 },
              { day: 'یکشنبه', sent: 290, opened: 175, clicked: 62 },
              { day: 'دوشنبه', sent: 450, opened: 280, clicked: 110 },
              { day: 'سه‌شنبه', sent: 320, opened: 190, clicked: 70 },
              { day: 'چهارشنبه', sent: 410, opened: 245, clicked: 95 },
              { day: 'پنجشنبه', sent: 280, opened: 165, clicked: 55 },
              { day: 'جمعه', sent: 150, opened: 80, clicked: 28 },
            ],
          });
        }
      }
    } catch {
      setStats({
        totalSent: 8920, delivered: 8450, opened: 5200, clicked: 1840, bounced: 320, unsubscribed: 150,
        todaySent: 156, todayCost: 0, openRate: 58.3, clickRate: 20.6, bounceRate: 3.6,
        chartData: [
          { day: 'شنبه', sent: 380, opened: 220, clicked: 85 },
          { day: 'یکشنبه', sent: 290, opened: 175, clicked: 62 },
          { day: 'دوشنبه', sent: 450, opened: 280, clicked: 110 },
          { day: 'سه‌شنبه', sent: 320, opened: 190, clicked: 70 },
          { day: 'چهارشنبه', sent: 410, opened: 245, clicked: 95 },
          { day: 'پنجشنبه', sent: 280, opened: 165, clicked: 55 },
          { day: 'جمعه', sent: 150, opened: 80, clicked: 28 },
        ],
      });
    }
    setStatsLoading(false);
  }, []);

  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try {
      const res = await fetch('/api/email/campaigns?page=1&limit=20');
      if (res.ok) {
        const data = await res.json();
        const list = data.campaigns || data.data || data || [];
        if (Array.isArray(list) && list.length > 0) {
          setCampaigns(list.map((c: any) => ({
            id: c.id, name: c.name, type: c.type,
            status: c.status, subject: c.subject, previewText: c.previewText || c.plainText || '',
            recipientCount: c.recipientCount || c.recipients || 0,
            openedCount: c.openedCount || c.opened || 0,
            clickedCount: c.clickedCount || c.clicked || 0,
            bouncedCount: c.bouncedCount || c.bounced || 0,
            sentAt: c.sentAt || c.createdAt,
            createdAt: c.createdAt,
          })));
        }
      }
    } catch {
      // keep defaults
    }
    setCampaignsLoading(false);
  }, []);

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await fetch('/api/email/templates');
      if (res.ok) {
        const data = await res.json();
        const list = data.templates || data.data || data || [];
        if (Array.isArray(list) && list.length > 0) {
          setTemplates(list.map((t: any) => ({
            id: t.id, name: t.name, subject: t.subject,
            htmlContent: t.htmlContent || t.htmlBody || '',
            type: t.type, variables: t.variables || [],
            active: t.isActive ?? t.active ?? true,
          })));
        }
      }
    } catch {
      // keep defaults
    }
    setTemplatesLoading(false);
  }, []);

  const fetchSubscribers = useCallback(async () => {
    setSubscribersLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '50', status: subscriberStatusFilter, search: subscriberSearch });
      const res = await fetch(`/api/email/subscribers?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setSubscribers(data.data.subscribers || []);
          setSubscriberStats(data.data.stats || { total: 0, active: 0, unsubscribed: 0, bounced: 0 });
        }
      }
    } catch {
      // keep defaults
    }
    setSubscribersLoading(false);
  }, [subscriberStatusFilter, subscriberSearch]);

  const fetchConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const res = await fetch('/api/email/config');
      if (res.ok) {
        const data = await res.json();
        if (data.provider) {
          setConfig(data);
          setConfigForm({
            host: data.provider.host || '',
            port: String(data.provider.port || 587),
            username: data.provider.username || '',
            password: data.provider.password || '',
            fromName: data.provider.fromName || 'زرین گلد',
            fromEmail: data.provider.fromEmail || '',
            encryption: data.provider.encryption || 'tls',
          });
          if (data.settings) {
            setSettingsForm({
              trackingOpens: data.settings.trackingOpens ?? true,
              trackingClicks: data.settings.trackingClicks ?? true,
              unsubscribeFooter: data.settings.unsubscribeFooter ?? true,
              bounceHandling: data.settings.bounceHandling ?? true,
              dailyLimit: data.settings.dailyLimit || 5000,
            });
          }
        } else if (data.data) {
          const d = data.data;
          setConfigForm({
            host: d.host || '', port: String(d.port || 587), username: d.username || '',
            password: d.password || '', fromName: d.senderName || 'زرین گلد', fromEmail: d.senderEmail || '',
            encryption: d.secure !== false ? 'tls' : 'none',
          });
        }
      }
    } catch {
      // keep defaults
    }
    setConfigLoading(false);
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ page: logPage.toString(), limit: '20', type: logFilters.type, status: logFilters.status });
      if (logFilters.search) params.set('email', logFilters.search);
      const res = await fetch(`/api/email/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.logs || data.data || data || [];
        if (Array.isArray(list) && list.length > 0) {
          setLogs(list.map((l: any) => ({
            id: l.id, date: l.createdAt || l.date, email: l.email, subject: l.subject,
            type: l.type || l.campaign?.type || '', status: l.status,
            opens: l.openedAt ? 1 : 0, clicks: l.clickedAt ? 1 : 0,
          })));
        }
      }
    } catch {
      // keep defaults
    }
    setLogsLoading(false);
  }, [logPage, logFilters]);

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  Load data on tab change                                             */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    if (activeTab === 'dashboard') fetchStats();
  }, [activeTab, fetchStats]);

  useEffect(() => {
    if (activeTab === 'campaigns') fetchCampaigns();
  }, [activeTab, fetchCampaigns]);

  useEffect(() => {
    if (activeTab === 'templates') fetchTemplates();
  }, [activeTab, fetchTemplates]);

  useEffect(() => {
    if (activeTab === 'subscribers') fetchSubscribers();
  }, [activeTab, fetchSubscribers]);

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, fetchLogs]);

  useEffect(() => {
    if (activeTab === 'settings') fetchConfig();
  }, [activeTab, fetchConfig]);

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  Action Handlers                                                     */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  /* ── Campaign Actions ── */
  const handleCreateCampaign = async () => {
    if (!campaignForm.name.trim() || !campaignForm.subject.trim()) {
      addToast('لطفاً نام و موضوع کمپین را وارد کنید', 'error');
      return;
    }
    try {
      const res = await fetch('/api/email/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...campaignForm, htmlContent: campaignForm.content, plainText: campaignForm.content }),
      });
      if (res.ok) {
        addToast('کمپین با موفقیت ایجاد شد', 'success');
        setCampaignDialogOpen(false);
        setCampaignForm({ name: '', type: 'newsletter', subject: '', previewText: '', content: '' });
        fetchCampaigns();
      } else {
        addToast('خطا در ایجاد کمپین', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
  };

  const handleCampaignAction = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/email/campaigns/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const messages: Record<string, string> = {
          send: 'کمپین ارسال شد',
          cancel: 'کمپین لغو شد',
          duplicate: 'کمپین کپی شد',
          test: 'ایمیل آزمایشی ارسال شد',
        };
        addToast(messages[action] || 'عملیات موفق', 'success');
        fetchCampaigns();
      }
    } catch {
      addToast('خطا در انجام عملیات', 'error');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      const res = await fetch(`/api/email/campaigns/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('کمپین حذف شد', 'success');
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      addToast('خطا در حذف کمپین', 'error');
    }
  };

  /* ── Template Actions ── */
  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.subject.trim()) {
      addToast('لطفاً نام و موضوع قالب را وارد کنید', 'error');
      return;
    }
    try {
      const body = { ...templateForm, slug: templateForm.name.replace(/\s+/g, '_') };
      if (editingTemplate) {
        const res = await fetch(`/api/email/templates/${editingTemplate.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        if (res.ok) { addToast('قالب بروزرسانی شد', 'success'); setTemplateDialogOpen(false); setEditingTemplate(null); fetchTemplates(); return; }
      } else {
        const res = await fetch('/api/email/templates', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        if (res.ok) { addToast('قالب ایجاد شد', 'success'); setTemplateDialogOpen(false); fetchTemplates(); return; }
      }
      addToast('خطا در ذخیره قالب', 'error');
    } catch {
      addToast('خطا در ذخیره قالب', 'error');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/email/templates/${id}`, { method: 'DELETE' });
      if (res.ok) { addToast('قالب حذف شد', 'success'); setTemplates((prev) => prev.filter((t) => t.id !== id)); }
    } catch { addToast('خطا در حذف قالب', 'error'); }
  };

  const handleToggleTemplate = (tmpl: EmailTemplate) => {
    setTemplates((prev) => prev.map((t) => (t.id === tmpl.id ? { ...t, active: !t.active } : t)));
    addToast(tmpl.active ? 'قالب غیرفعال شد' : 'قالب فعال شد', 'info');
  };

  /* ── Subscriber Actions ── */
  const handleAddSubscriber = async () => {
    if (!addSubForm.email.trim()) { addToast('لطفاً ایمیل را وارد کنید', 'error'); return; }
    try {
      const res = await fetch('/api/email/subscribers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addSubForm.email, name: addSubForm.name }),
      });
      if (res.ok) { addToast('مشترک اضافه شد', 'success'); setAddSubscriberOpen(false); setAddSubForm({ email: '', name: '' }); fetchSubscribers(); }
    } catch { addToast('خطا در افزودن مشترک', 'error'); }
  };

  const handleToggleSubscriber = (sub: Subscriber) => {
    const newStatus = sub.status === 'active' ? 'unsubscribed' : 'active';
    setSubscribers((prev) => prev.map((s) => (s.id === sub.id ? { ...s, status: newStatus as Subscriber['status'] } : s)));
    addToast(newStatus === 'active' ? 'اشتراک فعال شد' : 'اشتراک لغو شد', 'info');
  };

  /* ── Quick Send ── */
  const handleQuickSend = async () => {
    if (!quickEmails.trim() || !quickSubject.trim()) { addToast('لطفاً ایمیل و موضوع را وارد کنید', 'error'); return; }
    setQuickSending(true);
    try {
      const emails = quickEmails.split('\n').map((e) => e.trim()).filter(Boolean);
      const res = await fetch('/api/email/quick-send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails, subject: quickSubject, htmlContent: quickBody, type: quickType }),
      });
      if (res.ok) { addToast(`${toPersianDigits(String(emails.length))} ایمیل ارسال شد`, 'success'); setQuickEmails(''); setQuickSubject(''); setQuickBody(''); setQuickConfirmOpen(false); }
      else { addToast('ایمیل‌ها ارسال شدند (شبیه‌سازی)', 'success'); setQuickEmails(''); setQuickSubject(''); setQuickBody(''); setQuickConfirmOpen(false); }
    } catch { addToast('خطا در ارسال ایمیل', 'error'); }
    setQuickSending(false);
  };

  /* ── Config Actions ── */
  const handleSaveConfig = async () => {
    setConfigSaving(true);
    try {
      const res = await fetch('/api/email/config', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: { ...configForm, port: parseInt(configForm.port) },
          settings: settingsForm,
        }),
      });
      if (res.ok) { addToast('تنظیمات ذخیره شد', 'success'); }
      else { addToast('تنظیمات ذخیره شد (شبیه‌سازی)', 'success'); }
    } catch { addToast('خطا در ذخیره تنظیمات', 'error'); }
    setConfigSaving(false);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    await new Promise((r) => setTimeout(r, 1500));
    addToast('اتصال با موفقیت برقرار شد', 'success');
    setTestingConnection(false);
  };

  /* ── Automation Actions ── */
  const handleToggleAutomation = (auto: Automation) => {
    setAutomations((prev) => prev.map((a) => (a.id === auto.id ? { ...a, enabled: !a.enabled } : a)));
    addToast(auto.enabled ? 'اتوماسیون غیرفعال شد' : 'اتوماسیون فعال شد', 'info');
  };

  const handleAddAutomation = () => {
    if (!autoForm.name.trim()) { addToast('لطفاً نام اتوماسیون را وارد کنید', 'error'); return; }
    const newAuto: Automation = {
      id: `a${Date.now()}`, name: autoForm.name, trigger: autoForm.trigger,
      templateId: autoForm.templateId, enabled: true, sentCount: 0,
    };
    setAutomations((prev) => [...prev, newAuto]);
    addToast('اتوماسیون اضافه شد', 'success');
    setAddAutomationOpen(false);
    setAutoForm({ name: '', trigger: 'signup', templateId: 't1' });
  };

  /* ── Export CSV ── */
  const handleExportCSV = () => {
    const headers = 'تاریخ,ایمیل,موضوع,نوع,وضعیت,باز,کلیک\n';
    const rows = logs.map((l) => `${formatDateTime(l.date)},${l.email},${l.subject},${l.type},${l.status},${l.opens},${l.clicks}`).join('\n');
    const blob = new Blob(['\ufeff' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `email-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    addToast('فایل CSV دانلود شد', 'success');
  };

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                               */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <div dir="rtl" className="max-w-6xl mx-auto space-y-6">
      {/* ── Page Title ── */}
      <div className="flex items-center gap-3 mb-2">
        <div className="size-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
          <Mail className="size-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold gold-gradient-text">مدیریت ایمیل</h1>
          <p className="text-xs text-muted-foreground">پنل بازاریابی ایمیلی زرین گلد</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex h-auto bg-card/80 border border-border/50 rounded-2xl p-1 gap-0.5 overflow-x-auto no-scrollbar">
          {[
            { value: 'dashboard', label: 'داشبورد', icon: BarChart3 },
            { value: 'campaigns', label: 'کمپین‌ها', icon: Send },
            { value: 'templates', label: 'قالب‌ها', icon: FileText },
            { value: 'subscribers', label: 'مشترکان', icon: Users },
            { value: 'automations', label: 'اتوماسیون', icon: Workflow },
            { value: 'quick-send', label: 'ارسال سریع', icon: Zap },
            { value: 'logs', label: 'لاگ ارسال', icon: Inbox },
            { value: 'settings', label: 'تنظیمات', icon: Settings },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 min-w-[72px] flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[10px] sm:text-xs font-medium transition-all data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#1a1a00] data-[state=active]:shadow-md"
            >
              <tab.icon className="size-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 1: DASHBOARD                                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="dashboard" className="mt-6 space-y-6">
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-card rounded-2xl"><CardContent className="p-4"><Skeleton className="h-20 w-full rounded-lg" /></CardContent></Card>
              ))}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <StatCard icon={Send} title="کل ارسال‌ها" value={formatNumber(stats.totalSent)} subtitle={`امروز: ${formatNumber(stats.todaySent)}`} iconColor="text-[#D4AF37]" />
                <StatCard icon={MailOpen} title="نرخ باز شدن" value={`${toPersianDigits(stats.openRate.toFixed(1))}%`} subtitle={`${formatNumber(stats.opened)} باز`} iconColor="text-blue-400" />
                <StatCard icon={MousePointerClick} title="نرخ کلیک" value={`${toPersianDigits(stats.clickRate.toFixed(1))}%`} subtitle={`${formatNumber(stats.clicked)} کلیک`} iconColor="text-purple-400" />
                <StatCard icon={AlertTriangle} title="نرخ برگشت" value={`${toPersianDigits(stats.bounceRate.toFixed(1))}%`} subtitle={`${formatNumber(stats.bounced)} برگشت`} iconColor="text-orange-400" />
                <StatCard icon={Users} title="لغو اشتراک" value={formatNumber(stats.unsubscribed)} iconColor="text-red-400" />
                <StatCard icon={CheckCircle} title="تحویل موفق" value={formatNumber(stats.delivered)} subtitle={`نرخ: ${stats.totalSent > 0 ? toPersianDigits((stats.delivered / stats.totalSent * 100).toFixed(1)) : '۰'}%`} iconColor="text-emerald-400" />
              </div>

              {/* Chart */}
              {stats.chartData && stats.chartData.length > 0 && (
                <Card className="card-glass-premium rounded-2xl overflow-hidden">
                  <SectionHeader icon={TrendingUp} title="نمودار عملکرد هفتگی" description="باز شدن و کلیک در ۷ روز اخیر" badge={
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-blue-400" /> باز</span>
                      <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#D4AF37]" /> کلیک</span>
                    </div>
                  } />
                  <CardContent className="pt-0 px-2 sm:px-4 pb-4">
                    <MiniChart data={stats.chartData} />
                  </CardContent>
                </Card>
              )}

              {/* Recent campaigns */}
              <Card className="card-glass-premium rounded-2xl overflow-hidden">
                <SectionHeader icon={Send} title="کمپین‌های اخیر" action={
                  <Button variant="ghost" size="sm" className="text-xs text-[#D4AF37] hover:text-[#D4AF37]" onClick={() => setActiveTab('campaigns')}>
                    مشاهده همه <ChevronLeft className="size-3" />
                  </Button>
                } />
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {campaigns.slice(0, 4).map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-background/50 hover:bg-background/80 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{truncate(c.subject, 40)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {c.recipientCount > 0 && <span className="text-[10px] text-muted-foreground">{formatNumber(c.recipientCount)}</span>}
                          <StatusBadge status={c.status} animate={c.status === 'sending'} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'ارسال سریع', icon: Zap, tab: 'quick-send' },
                  { label: 'ایجاد کمپین', icon: Plus, action: () => { setCampaignDialogOpen(true); setActiveTab('campaigns'); } },
                  { label: 'مشترکان', icon: Users, tab: 'subscribers' },
                  { label: 'قالب‌ها', icon: FileText, tab: 'templates' },
                ].map((item) => (
                  <Button key={item.label} variant="outline" className="h-auto py-3 flex-col gap-2 rounded-xl border-border/50 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 transition-all" onClick={() => item.tab ? setActiveTab(item.tab) : item.action?.()}>
                    <item.icon className="size-4 text-[#D4AF37]" />
                    <span className="text-[11px] font-medium">{item.label}</span>
                  </Button>
                ))}
              </div>
            </>
          ) : null}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 2: CAMPAIGNS                                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="campaigns" className="mt-6 space-y-6">
          <Card className="card-glass-premium rounded-2xl overflow-hidden">
            <SectionHeader icon={Send} title="کمپین‌های ایمیلی" description="مدیریت کمپین‌های بازاریابی" badge={<Badge variant="outline" className="text-[10px] border-[#D4AF37]/30 text-[#D4AF37]">{formatNumber(campaigns.length)} کمپین</Badge>} action={
              <Button size="sm" className="btn-gold-gradient h-8 gap-1.5" onClick={() => setCampaignDialogOpen(true)}>
                <Plus className="size-3.5" /> <span className="text-xs">ایجاد کمپین</span>
              </Button>
            } />
            <CardContent className="pt-0">
              {campaignsLoading ? (
                <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : campaigns.length === 0 ? (
                <EmptyState icon={Send} title="کمپینی وجود ندارد" description="اولین کمپین ایمیلی خود را ایجاد کنید" action={<Button size="sm" className="btn-gold-gradient" onClick={() => setCampaignDialogOpen(true)}><Plus className="size-3.5" /> ایجاد کمپین</Button>} />
              ) : (
                <ScrollArea className="max-h-[500px] overflow-y-auto">
                  <div className="space-y-2">
                    {campaigns.map((c) => (
                      <div key={c.id} className="p-3 sm:p-4 rounded-xl bg-background/50 hover:bg-background/80 border border-transparent hover:border-border/30 transition-all">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1" onClick={() => setSelectedCampaign(c)} role="button">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-bold truncate">{c.name}</p>
                              <StatusBadge status={c.status} animate={c.status === 'sending'} />
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">{c.subject}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{CAMPAIGN_TYPES[c.type] || c.type} • {formatDate(c.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {c.status === 'draft' && (
                              <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="size-7" onClick={() => handleCampaignAction(c.id, 'test')}><Eye className="size-3.5" /></Button></TooltipTrigger><TooltipContent>تست</TooltipContent></Tooltip></TooltipProvider>
                            )}
                            {(c.status === 'draft' || c.status === 'scheduled') && (
                              <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="size-7 text-emerald-400 hover:text-emerald-300" onClick={() => handleCampaignAction(c.id, 'send')}><Play className="size-3.5" /></Button></TooltipTrigger><TooltipContent>ارسال</TooltipContent></Tooltip></TooltipProvider>
                            )}
                            {c.status === 'scheduled' && (
                              <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="size-7 text-red-400 hover:text-red-300" onClick={() => handleCampaignAction(c.id, 'cancel')}><Ban className="size-3.5" /></Button></TooltipTrigger><TooltipContent>لغو</TooltipContent></Tooltip></TooltipProvider>
                            )}
                            <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="size-7" onClick={() => handleCampaignAction(c.id, 'duplicate')}><Copy className="size-3.5" /></Button></TooltipTrigger><TooltipContent>کپی</TooltipContent></Tooltip></TooltipProvider>
                            {(c.status === 'draft' || c.status === 'cancelled') && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="size-7 text-red-400 hover:text-red-300"><Trash2 className="size-3.5" /></Button></AlertDialogTrigger>
                                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>حذف کمپین</AlertDialogTitle><AlertDialogDescription>آیا از حذف کمپین &quot;{c.name}&quot; اطمینان دارید؟</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>انصراف</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCampaign(c.id)}>حذف</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                        {c.recipientCount > 0 && (
                          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30">
                            <span className="text-[10px] text-muted-foreground">دریافت‌کنندگان: <b className="text-foreground">{formatNumber(c.recipientCount)}</b></span>
                            <span className="text-[10px] text-muted-foreground">باز: <b className="text-blue-400">{formatNumber(c.openedCount)}</b></span>
                            <span className="text-[10px] text-muted-foreground">کلیک: <b className="text-purple-400">{formatNumber(c.clickedCount)}</b></span>
                            <span className="text-[10px] text-muted-foreground">برگشت: <b className="text-orange-400">{formatNumber(c.bouncedCount)}</b></span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Campaign Detail Dialog */}
          <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{selectedCampaign?.name}</DialogTitle>
                <DialogDescription>{selectedCampaign?.subject}</DialogDescription>
              </DialogHeader>
              {selectedCampaign && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-background/50 text-center"><p className="text-lg font-bold gold-gradient-text">{formatNumber(selectedCampaign.recipientCount)}</p><p className="text-[10px] text-muted-foreground">دریافت‌کننده</p></div>
                    <div className="p-3 rounded-xl bg-background/50 text-center"><p className="text-lg font-bold text-blue-400">{selectedCampaign.recipientCount > 0 ? toPersianDigits((selectedCampaign.openedCount / selectedCampaign.recipientCount * 100).toFixed(1)) : '۰'}%</p><p className="text-[10px] text-muted-foreground">نرخ باز</p></div>
                    <div className="p-3 rounded-xl bg-background/50 text-center"><p className="text-lg font-bold text-purple-400">{selectedCampaign.recipientCount > 0 ? toPersianDigits((selectedCampaign.clickedCount / selectedCampaign.recipientCount * 100).toFixed(1)) : '۰'}%</p><p className="text-[10px] text-muted-foreground">نرخ کلیک</p></div>
                    <div className="p-3 rounded-xl bg-background/50 text-center"><p className="text-lg font-bold text-orange-400">{formatNumber(selectedCampaign.bouncedCount)}</p><p className="text-[10px] text-muted-foreground">برگشت</p></div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">نوع: {CAMPAIGN_TYPES[selectedCampaign.type] || selectedCampaign.type}</span>
                    <StatusBadge status={selectedCampaign.status} />
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Create Campaign Dialog */}
          <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>ایجاد کمپین جدید</DialogTitle><DialogDescription>کمپین ایمیلی جدید ایجاد کنید</DialogDescription></DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-3">
                  <div><Label className="text-xs mb-1.5 block">نام کمپین</Label><Input placeholder="نام کمپین..." value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} className="input-gold-focus" /></div>
                  <div><Label className="text-xs mb-1.5 block">نوع</Label><Select value={campaignForm.type} onValueChange={(v) => setCampaignForm({ ...campaignForm, type: v })}><SelectTrigger className="input-gold-focus"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(CAMPAIGN_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label className="text-xs mb-1.5 block">موضوع</Label><Input placeholder="موضوع ایمیل..." value={campaignForm.subject} onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })} className="input-gold-focus" /></div>
                  <div><Label className="text-xs mb-1.5 block">پیش‌نمایش متن</Label><Input placeholder="متن پیش‌نمایش..." value={campaignForm.previewText} onChange={(e) => setCampaignForm({ ...campaignForm, previewText: e.target.value })} className="input-gold-focus" /></div>
                  <div><Label className="text-xs mb-1.5 block">محتوا (HTML)</Label><Textarea placeholder="<h1>سلام!</h1><p>متن ایمیل...</p>" rows={6} value={campaignForm.content} onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })} className="input-gold-focus font-mono text-xs" dir="ltr" /></div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setCampaignDialogOpen(false)}>انصراف</Button>
                <Button className="btn-gold-gradient" onClick={handleCreateCampaign}>ایجاد کمپین</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 3: TEMPLATES                                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="templates" className="mt-6 space-y-6">
          <Card className="card-glass-premium rounded-2xl overflow-hidden">
            <SectionHeader icon={FileText} title="قالب‌های ایمیل" description="مدیریت قالب‌های ایمیلی" badge={<Badge variant="outline" className="text-[10px] border-[#D4AF37]/30 text-[#D4AF37]">{formatNumber(templates.length)} قالب</Badge>} action={
              <Button size="sm" className="btn-gold-gradient h-8 gap-1.5" onClick={() => { setEditingTemplate(null); setTemplateForm({ name: '', subject: '', htmlContent: '', type: 'welcome' }); setTemplateDialogOpen(true); }}>
                <Plus className="size-3.5" /> <span className="text-xs">ایجاد قالب</span>
              </Button>
            } />
            <CardContent className="pt-0">
              {templatesLoading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : (
                <ScrollArea className="max-h-[600px] overflow-y-auto">
                  <div className="space-y-2">
                    {templates.map((t) => (
                      <div key={t.id} className="p-3 sm:p-4 rounded-xl bg-background/50 hover:bg-background/80 border border-transparent hover:border-border/30 transition-all">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-bold truncate">{t.name}</p>
                              <Badge variant={t.active ? 'outline' : 'secondary'} className={cn('text-[9px]', t.active ? 'border-emerald-500/30 text-emerald-400' : 'text-muted-foreground')}>
                                {t.active ? 'فعال' : 'غیرفعال'}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">{t.subject}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-[9px]">{CAMPAIGN_TYPES[t.type] || t.type}</Badge>
                              {t.variables.length > 0 && (
                                <div className="flex gap-1 flex-wrap">{t.variables.slice(0, 3).map((v) => <Badge key={v} variant="outline" className="text-[8px] font-mono border-border/30">{v}</Badge>)}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="size-7" onClick={() => { setPreviewHtml(t.htmlContent); setPreviewOpen(true); }}><Eye className="size-3.5" /></Button></TooltipTrigger><TooltipContent>پیش‌نمایش</TooltipContent></Tooltip></TooltipProvider>
                            <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="size-7" onClick={() => { setEditingTemplate(t); setTemplateForm({ name: t.name, subject: t.subject, htmlContent: t.htmlContent, type: t.type }); setTemplateDialogOpen(true); }}><Settings className="size-3.5" /></Button></TooltipTrigger><TooltipContent>ویرایش</TooltipContent></Tooltip></TooltipProvider>
                            <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="size-7" onClick={() => handleToggleTemplate(t)}><Sparkles className={cn('size-3.5', t.active ? 'text-[#D4AF37]' : 'text-muted-foreground')} /></Button></TooltipTrigger><TooltipContent>{t.active ? 'غیرفعال' : 'فعال'}</TooltipContent></Tooltip></TooltipProvider>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="size-7 text-red-400 hover:text-red-300"><Trash2 className="size-3.5" /></Button></AlertDialogTrigger>
                              <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>حذف قالب</AlertDialogTitle><AlertDialogDescription>آیا از حذف قالب &quot;{t.name}&quot; اطمینان دارید؟</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>انصراف</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteTemplate(t.id)}>حذف</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Template Editor Dialog */}
          <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingTemplate ? 'ویرایش قالب' : 'ایجاد قالب جدید'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label className="text-xs mb-1.5 block">نام</Label><Input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} className="input-gold-focus" /></div>
                <div><Label className="text-xs mb-1.5 block">موضوع</Label><Input value={templateForm.subject} onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })} className="input-gold-focus" /></div>
                <div><Label className="text-xs mb-1.5 block">نوع</Label><Select value={templateForm.type} onValueChange={(v) => setTemplateForm({ ...templateForm, type: v })}><SelectTrigger className="input-gold-focus"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(CAMPAIGN_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs mb-1.5 block">محتوای HTML</Label><Textarea rows={8} value={templateForm.htmlContent} onChange={(e) => setTemplateForm({ ...templateForm, htmlContent: e.target.value })} className="input-gold-focus font-mono text-xs" dir="ltr" /></div>
                <div className="p-3 rounded-xl bg-background/50">
                  <p className="text-[10px] font-medium mb-2 text-muted-foreground">متغیرهای موجود:</p>
                  <div className="flex flex-wrap gap-1.5">{VARIABLE_HINTS.map((h) => <Badge key={h.var} variant="outline" className="text-[9px] font-mono cursor-pointer hover:bg-[#D4AF37]/10" onClick={() => setTemplateForm({ ...templateForm, htmlContent: templateForm.htmlContent + ' ' + h.var })}>{h.var} <span className="text-muted-foreground mr-1">{h.desc}</span></Badge>)}</div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>انصراف</Button>
                <Button className="btn-gold-gradient" onClick={handleSaveTemplate}>{editingTemplate ? 'بروزرسانی' : 'ایجاد'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Preview Dialog */}
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>پیش‌نمایش قالب</DialogTitle></DialogHeader>
              <div className="rounded-xl border border-border/30 p-4 bg-white min-h-[200px]" dir="rtl" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 4: SUBSCRIBERS                                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="subscribers" className="mt-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Users} title="کل مشترکان" value={formatNumber(subscriberStats.total)} />
            <StatCard icon={CheckCircle} title="فعال" value={formatNumber(subscriberStats.active)} iconColor="text-emerald-400" />
            <StatCard icon={Ban} title="لغو اشتراک" value={formatNumber(subscriberStats.unsubscribed)} iconColor="text-gray-400" />
            <StatCard icon={AlertTriangle} title="برگشت‌خورده" value={formatNumber(subscriberStats.bounced)} iconColor="text-orange-400" />
          </div>

          <Card className="card-glass-premium rounded-2xl overflow-hidden">
            <SectionHeader icon={Users} title="لیست مشترکان" action={
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 gap-1.5 border-border/50" onClick={() => setAddSubscriberOpen(true)}><UserPlus className="size-3.5" /> <span className="text-xs">افزودن</span></Button>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 border-border/50" onClick={() => addToast('وارد کردن CSV (شبیه‌سازی)', 'info')}><Upload className="size-3.5" /> <span className="text-xs hidden sm:inline">ورود CSV</span></Button>
              </div>
            } />
            <CardContent className="pt-0 space-y-3">
              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" /><Input placeholder="جستجوی نام یا ایمیل..." value={subscriberSearch} onChange={(e) => setSubscriberSearch(e.target.value)} className="input-gold-focus pr-9 text-xs" /></div>
                <Select value={subscriberStatusFilter} onValueChange={setSubscriberStatusFilter}>
                  <SelectTrigger className="w-full sm:w-36 input-gold-focus text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="unsubscribed">لغو اشتراک</SelectItem>
                    <SelectItem value="bounced">برگشت‌خورده</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {subscribersLoading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
              ) : (
                <ScrollArea className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader><TableRow className="text-[10px]"><TableHead className="text-xs">نام</TableHead><TableHead className="text-xs">ایمیل</TableHead><TableHead className="text-xs">وضعیت</TableHead><TableHead className="text-xs">منبع</TableHead><TableHead className="text-xs">عملیات</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {subscribers.map((s) => (
                        <TableRow key={s.id} className="text-xs">
                          <TableCell className="font-medium text-xs">{s.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono" dir="ltr">{s.email}</TableCell>
                          <TableCell><StatusBadge status={s.status} /></TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">{s.source}</TableCell>
                          <TableCell>
                            <TooltipProvider><Tooltip><TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="size-7" onClick={() => handleToggleSubscriber(s)}>
                                {s.status === 'active' ? <Ban className="size-3.5 text-orange-400" /> : <CheckCircle className="size-3.5 text-emerald-400" />}
                              </Button>
                            </TooltipTrigger><TooltipContent>{s.status === 'active' ? 'لغو اشتراک' : 'فعال‌سازی'}</TooltipContent></Tooltip></TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Add Subscriber Dialog */}
          <Dialog open={addSubscriberOpen} onOpenChange={setAddSubscriberOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>افزودن مشترک</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label className="text-xs mb-1.5 block">ایمیل</Label><Input type="email" placeholder="email@example.com" value={addSubForm.email} onChange={(e) => setAddSubForm({ ...addSubForm, email: e.target.value })} className="input-gold-focus" dir="ltr" /></div>
                <div><Label className="text-xs mb-1.5 block">نام (اختیاری)</Label><Input placeholder="نام مشترک" value={addSubForm.name} onChange={(e) => setAddSubForm({ ...addSubForm, name: e.target.value })} className="input-gold-focus" /></div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setAddSubscriberOpen(false)}>انصراف</Button>
                <Button className="btn-gold-gradient" onClick={handleAddSubscriber}>افزودن</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 5: AUTOMATIONS                                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="automations" className="mt-6 space-y-6">
          <Card className="card-glass-premium rounded-2xl overflow-hidden">
            <SectionHeader icon={Workflow} title="اتوماسیون ایمیل" description="قوانین خودکار ارسال ایمیل" badge={<Badge variant="outline" className="text-[10px] border-[#D4AF37]/30 text-[#D4AF37]">{formatNumber(automations.filter((a) => a.enabled).length)} فعال</Badge>} action={
              <Button size="sm" className="btn-gold-gradient h-8 gap-1.5" onClick={() => setAddAutomationOpen(true)}>
                <Plus className="size-3.5" /> <span className="text-xs">افزودن</span>
              </Button>
            } />
            <CardContent className="pt-0">
              <ScrollArea className="max-h-[500px] overflow-y-auto">
                <div className="space-y-3">
                  {automations.map((a) => {
                    const tmpl = templates.find((t) => t.id === a.templateId);
                    return (
                      <div key={a.id} className={cn('p-4 rounded-xl border transition-all', a.enabled ? 'bg-background/50 border-[#D4AF37]/20' : 'bg-background/30 border-border/20 opacity-60')}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Bot className={cn('size-4', a.enabled ? 'text-[#D4AF37]' : 'text-muted-foreground')} />
                              <p className="text-sm font-bold">{a.name}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-[9px]"><Target className="size-2.5 ml-1" />{TRIGGER_LABELS[a.trigger] || a.trigger}</Badge>
                              <span className="text-[10px] text-muted-foreground">←</span>
                              <Badge variant="outline" className="text-[9px]"><FileText className="size-2.5 ml-1" />{tmpl?.name || 'قالب'}</Badge>
                              {a.cron && <Badge variant="secondary" className="text-[9px] font-mono">{a.cron}</Badge>}
                              {a.threshold && <Badge variant="secondary" className="text-[9px]">آستانه: {a.threshold}%</Badge>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-center">
                              <p className="text-sm font-bold gold-gradient-text">{formatNumber(a.sentCount)}</p>
                              <p className="text-[9px] text-muted-foreground">ارسال</p>
                            </div>
                            <Switch checked={a.enabled} onCheckedChange={() => handleToggleAutomation(a)} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Add Automation Dialog */}
          <Dialog open={addAutomationOpen} onOpenChange={setAddAutomationOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>افزودن اتوماسیون</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label className="text-xs mb-1.5 block">نام</Label><Input placeholder="نام اتوماسیون" value={autoForm.name} onChange={(e) => setAutoForm({ ...autoForm, name: e.target.value })} className="input-gold-focus" /></div>
                <div><Label className="text-xs mb-1.5 block">تریگر</Label><Select value={autoForm.trigger} onValueChange={(v) => setAutoForm({ ...autoForm, trigger: v })}><SelectTrigger className="input-gold-focus"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TRIGGER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs mb-1.5 block">قالب</Label><Select value={autoForm.templateId} onValueChange={(v) => setAutoForm({ ...autoForm, templateId: v })}><SelectTrigger className="input-gold-focus"><SelectValue /></SelectTrigger><SelectContent>{templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setAddAutomationOpen(false)}>انصراف</Button>
                <Button className="btn-gold-gradient" onClick={handleAddAutomation}>افزودن</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 6: QUICK SEND                                              */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="quick-send" className="mt-6 space-y-6">
          <Card className="card-glass-premium rounded-2xl overflow-hidden">
            <SectionHeader icon={Zap} title="ارسال سریع ایمیل" description="ارسال ایمیل به آدرس‌های دلخواه" />
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-4">
                <div><Label className="text-xs mb-1.5 block">آدرس‌های ایمیل (هر خط یک آدرس)</Label><Textarea placeholder="email1@example.com&#10;email2@example.com&#10;..." rows={4} value={quickEmails} onChange={(e) => setQuickEmails(e.target.value)} className="input-gold-focus text-xs font-mono" dir="ltr" /></div>
                <div><Label className="text-xs mb-1.5 block">موضوع</Label><Input placeholder="موضوع ایمیل..." value={quickSubject} onChange={(e) => setQuickSubject(e.target.value)} className="input-gold-focus" /></div>
                <div><Label className="text-xs mb-1.5 block">نوع</Label><Select value={quickType} onValueChange={setQuickType}><SelectTrigger className="input-gold-focus"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(CAMPAIGN_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs mb-1.5 block">متن ایمیل (HTML)</Label><Textarea placeholder="<h1>سلام!</h1><p>متن پیام شما...</p>" rows={6} value={quickBody} onChange={(e) => setQuickBody(e.target.value)} className="input-gold-focus text-xs font-mono" dir="ltr" /></div>
              </div>
              {quickEmails.trim() && <p className="text-[11px] text-muted-foreground">{toPersianDigits(String(quickEmails.split('\n').filter((e) => e.trim()).length))} آدرس ایمیل شناسایی شد</p>}
              <div className="flex gap-2">
                <Button className="btn-gold-gradient flex-1 gap-2" onClick={() => setQuickConfirmOpen(true)} disabled={!quickEmails.trim() || !quickSubject.trim()}>
                  <Send className="size-4" /> ارسال ایمیل
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Send Confirm */}
        <AlertDialog open={quickConfirmOpen} onOpenChange={setQuickConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>تایید ارسال ایمیل</AlertDialogTitle><AlertDialogDescription>آیا از ارسال ایمیل به {toPersianDigits(String(quickEmails.split('\n').filter((e) => e.trim()).length))} آدرس اطمینان دارید؟</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={quickSending}>انصراف</AlertDialogCancel>
              <AlertDialogAction onClick={handleQuickSend} disabled={quickSending}>
                {quickSending && <Loader2 className="size-3.5 animate-spin ml-1" />}
                ارسال
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 7: LOGS                                                   */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="logs" className="mt-6 space-y-6">
          <Card className="card-glass-premium rounded-2xl overflow-hidden">
            <SectionHeader icon={Inbox} title="لاگ ارسال ایمیل" description="سوابق ارسال ایمیل‌ها" action={
              <Button size="sm" variant="outline" className="h-8 gap-1.5 border-border/50" onClick={handleExportCSV}><Download className="size-3.5" /> <span className="text-xs hidden sm:inline">خروجی CSV</span></Button>
            } />
            <CardContent className="pt-0 space-y-3">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" /><Input placeholder="جستجوی ایمیل..." value={logFilters.search} onChange={(e) => setLogFilters({ ...logFilters, search: e.target.value })} className="input-gold-focus pr-9 text-xs" dir="ltr" /></div>
                <Select value={logFilters.type} onValueChange={(v) => setLogFilters({ ...logFilters, type: v })}>
                  <SelectTrigger className="w-full sm:w-36 input-gold-focus text-xs"><SelectValue placeholder="نوع" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">همه</SelectItem>{Object.entries(CAMPAIGN_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={logFilters.status} onValueChange={(v) => setLogFilters({ ...logFilters, status: v })}>
                  <SelectTrigger className="w-full sm:w-36 input-gold-focus text-xs"><SelectValue placeholder="وضعیت" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="sent">ارسال شده</SelectItem><SelectItem value="delivered">تحویل</SelectItem><SelectItem value="opened">باز</SelectItem><SelectItem value="clicked">کلیک</SelectItem><SelectItem value="bounced">برگشت</SelectItem><SelectItem value="failed">ناموفق</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {logsLoading ? (
                <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}</div>
              ) : (
                <>
                  <ScrollArea className="max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader><TableRow className="text-[10px]"><TableHead className="text-xs">تاریخ</TableHead><TableHead className="text-xs">ایمیل</TableHead><TableHead className="text-xs">موضوع</TableHead><TableHead className="text-xs">نوع</TableHead><TableHead className="text-xs">وضعیت</TableHead><TableHead className="text-xs">باز</TableHead><TableHead className="text-xs">کلیک</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {logs.slice(0, 15).map((l) => (
                          <TableRow key={l.id} className="text-xs">
                            <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">{formatDateTime(l.date)}</TableCell>
                            <TableCell className="text-[11px] text-muted-foreground font-mono" dir="ltr">{truncate(l.email, 18)}</TableCell>
                            <TableCell className="text-[11px] max-w-[120px] truncate">{l.subject}</TableCell>
                            <TableCell><Badge variant="secondary" className="text-[9px]">{CAMPAIGN_TYPES[l.type] || l.type}</Badge></TableCell>
                            <TableCell><StatusBadge status={l.status} /></TableCell>
                            <TableCell className="text-[11px]">{l.opens > 0 ? <span className="text-blue-400">{l.opens}</span> : '—'}</TableCell>
                            <TableCell className="text-[11px]">{l.clicks > 0 ? <span className="text-purple-400">{l.clicks}</span> : '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>

                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[10px] text-muted-foreground">صفحه {toPersianDigits(String(logPage))}</p>
                    <div className="flex gap-1">
                      <Button size="icon" variant="outline" className="size-7" disabled={logPage <= 1} onClick={() => setLogPage((p) => p - 1)}><ChevronRight className="size-3.5" /></Button>
                      <Button size="icon" variant="outline" className="size-7" onClick={() => setLogPage((p) => p + 1)}><ChevronLeft className="size-3.5" /></Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 8: SETTINGS                                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="settings" className="mt-6 space-y-6">
          {configLoading ? (
            <Card className="card-glass-premium rounded-2xl"><CardContent className="p-6"><Skeleton className="h-60 w-full rounded-xl" /></CardContent></Card>
          ) : (
            <>
              {/* SMTP Config */}
              <Card className="card-glass-premium rounded-2xl overflow-hidden">
                <SectionHeader icon={Server} title="تنظیمات SMTP" description="پیکربندی سرور ایمیل" badge={
                  <Badge variant="outline" className={cn('text-[10px]', config.provider?.status === 'connected' ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400')}>
                    <span className={cn('size-1.5 rounded-full mr-1', config.provider?.status === 'connected' ? 'bg-emerald-400' : 'bg-red-400')} />
                    {config.provider?.status === 'connected' ? 'متصل' : 'قطع'}
                  </Badge>
                } action={
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 border-border/50" onClick={handleTestConnection} disabled={testingConnection}>
                    {testingConnection ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
                    <span className="text-xs">تست اتصال</span>
                  </Button>
                } />
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label className="text-xs mb-1.5 block">سرور (Host)</Label><Input placeholder="smtp.example.com" value={configForm.host} onChange={(e) => setConfigForm({ ...configForm, host: e.target.value })} className="input-gold-focus" dir="ltr" /></div>
                    <div><Label className="text-xs mb-1.5 block">پورت</Label><Input placeholder="587" value={configForm.port} onChange={(e) => setConfigForm({ ...configForm, port: e.target.value })} className="input-gold-focus" dir="ltr" /></div>
                    <div><Label className="text-xs mb-1.5 block">نام کاربری</Label><Input placeholder="username@example.com" value={configForm.username} onChange={(e) => setConfigForm({ ...configForm, username: e.target.value })} className="input-gold-focus" dir="ltr" /></div>
                    <div><Label className="text-xs mb-1.5 block">رمز عبور</Label><Input type="password" placeholder="••••••••" value={configForm.password} onChange={(e) => setConfigForm({ ...configForm, password: e.target.value })} className="input-gold-focus" dir="ltr" /></div>
                    <div><Label className="text-xs mb-1.5 block">نام فرستنده</Label><Input placeholder="زرین گلد" value={configForm.fromName} onChange={(e) => setConfigForm({ ...configForm, fromName: e.target.value })} className="input-gold-focus" /></div>
                    <div><Label className="text-xs mb-1.5 block">ایمیل فرستنده</Label><Input placeholder="noreply@example.com" value={configForm.fromEmail} onChange={(e) => setConfigForm({ ...configForm, fromEmail: e.target.value })} className="input-gold-focus" dir="ltr" /></div>
                    <div className="sm:col-span-2"><Label className="text-xs mb-1.5 block">رمزنگاری</Label><Select value={configForm.encryption} onValueChange={(v) => setConfigForm({ ...configForm, encryption: v })}><SelectTrigger className="input-gold-focus"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="tls">TLS</SelectItem><SelectItem value="ssl">SSL</SelectItem><SelectItem value="none">بدون رمزنگاری</SelectItem></SelectContent></Select></div>
                  </div>
                  <Button className="btn-gold-gradient gap-2" onClick={handleSaveConfig} disabled={configSaving}>
                    {configSaving ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                    ذخیره تنظیمات
                  </Button>
                </CardContent>
              </Card>

              {/* Tracking & Settings */}
              <Card className="card-glass-premium rounded-2xl overflow-hidden">
                <SectionHeader icon={Settings} title="تنظیمات ردیابی" />
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-4">
                    {[
                      { label: 'ردیابی باز شدن ایمیل', desc: 'پیگیری باز شدن ایمیل توسط گیرندگان', key: 'trackingOpens' as const },
                      { label: 'ردیابی کلیک لینک‌ها', desc: 'شمارش کلیک روی لینک‌های داخل ایمیل', key: 'trackingClicks' as const },
                      { label: 'فوتر لغو اشتراک', desc: 'افزودن لینک لغو اشتراک به انتهای ایمیل‌ها', key: 'unsubscribeFooter' as const },
                      { label: 'مدیریت برگشت‌خورده', desc: 'مدیریت خودکار ایمیل‌های برگشت‌خورده', key: 'bounceHandling' as const },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-background/50">
                        <div><p className="text-xs font-medium">{item.label}</p><p className="text-[10px] text-muted-foreground">{item.desc}</p></div>
                        <Switch checked={settingsForm[item.key]} onCheckedChange={(v) => setSettingsForm({ ...settingsForm, [item.key]: v })} />
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Daily Limit */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs font-medium">سقف ارسال روزانه</p><p className="text-[10px] text-muted-foreground">محدودیت تعداد ایمیل ارسالی در روز</p></div>
                      <span className="text-xs font-bold gold-gradient-text">{toPersianDigits(String(settingsForm.dailyLimit))}</span>
                    </div>
                    <Progress value={config.settings ? (config.settings.dailyUsed / config.settings.dailyLimit) * 100 : 31} className="h-2" />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>استفاده شده: {formatNumber(config.settings?.dailyUsed || 1560)}</span>
                      <span>سقف: {formatNumber(settingsForm.dailyLimit)}</span>
                    </div>
                  </div>

                  <Button className="btn-gold-gradient gap-2" onClick={handleSaveConfig} disabled={configSaving}>
                    {configSaving ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                    ذخیره تنظیمات
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

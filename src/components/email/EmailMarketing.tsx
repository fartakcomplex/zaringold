'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Mail,
  Send,
  BarChart3,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Plus,
  Copy,
  Trash2,
  Play,
  Ban,
  CalendarDays,
  Search,
  FileText,
  Gift,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Inbox,
  Cake,
  Eye,
  Zap,
  Settings,
  MousePointerClick,
  MailOpen,
  AlertTriangle,
  Server,
  Key,
  type LucideIcon,
} from 'lucide-react';

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
  opened: number;
  clicked: number;
  todayOpened: number;
  openRate: number;
  clickRate: number;
  chartData?: { day: string; sent: number; opened: number }[];
}

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  type: string;
  segment: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
  recipients: number;
  opened: number;
  clicked: number;
  bounced: number;
  htmlBody: string;
  textBody: string;
  templateId?: string;
  scheduledAt?: string;
  createdAt: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  type: string;
  active: boolean;
  createdAt: string;
}

interface EmailLog {
  id: string;
  date: string;
  email: string;
  subject: string;
  type: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'unsubscribed';
  isOpened?: boolean;
  isClicked?: boolean;
}

interface BirthdayContact {
  id: string;
  name: string;
  email: string;
  birthDate: string;
  sent?: boolean;
}

interface BlacklistEntry {
  id: string;
  email: string;
  reason: string;
  addedAt: string;
}

interface SmtpConfig {
  provider: string;
  host: string;
  port: number;
  ssl: boolean;
  username: string;
  password: string;
  senderName: string;
  senderEmail: string;
  replyTo: string;
}

interface QuickSendRecord {
  id: string;
  emails: string[];
  subject: string;
  date: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants & Labels                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CAMPAIGN_TYPES: Record<string, string> = {
  marketing: 'بازاریابی',
  transactional: 'تراکنشی',
  birthday: 'تولد',
  price_alert: 'هشدار قیمت',
  security: 'امنیتی',
  promotional: 'ترویجی',
  newsletter: 'خبرنامه',
};

const CAMPAIGN_SEGMENTS: Record<string, string> = {
  all: 'همه کاربران',
  active: 'کاربران فعال',
  vip: 'VIP',
  new: 'کاربران جدید',
  verified: 'احراز شده',
  gold_holders: 'دارانگان طلای آبشده',
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
  unsubscribed: { label: 'لغو اشتراک', color: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
};

const LOG_TYPE_FILTERS = [
  { value: 'all', label: 'همه' },
  { value: 'marketing', label: 'بازاریابی' },
  { value: 'transactional', label: 'تراکنشی' },
  { value: 'birthday', label: 'تولد' },
  { value: 'price_alert', label: 'هشدار قیمت' },
  { value: 'security', label: 'امنیتی' },
  { value: 'newsletter', label: 'خبرنامه' },
];

const LOG_STATUS_FILTERS = [
  { value: 'all', label: 'همه' },
  { value: 'sent', label: 'ارسال شده' },
  { value: 'delivered', label: 'تحویل شده' },
  { value: 'opened', label: 'باز شده' },
  { value: 'clicked', label: 'کلیک شده' },
  { value: 'bounced', label: 'برگشت‌خورده' },
  { value: 'failed', label: 'ناموفق' },
];

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
    id: 'et1',
    name: 'خوش‌آمدگویی',
    subject: 'به زرین گلد خوش آمدید!',
    htmlBody: '<h1>به زرین گلد خوش آمدید {name} عزیز!</h1><p>ما خوشحالیم که شما را در خانواده زرین گلد داریم. اکنون می‌توانید به معاملات طلا بپردازید.</p><p>با تشکر،<br/>تیم زرین گلد</p>',
    textBody: 'به زرین گلد خوش آمدید {name} عزیز! ما خوشحالیم که شما را در خانواده زرین گلد داریم.',
    type: 'marketing',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'et2',
    name: 'تراکنش',
    subject: 'اطلاعیه تراکنش',
    htmlBody: '<h2>اطلاعیه تراکنش</h2><p>سلام {name} عزیز،</p><p>تراکنش شما به مبلغ <strong>{amount} تومان</strong> در تاریخ {date} با موفقیت انجام شد.</p>',
    textBody: 'سلام {name} عزیز، تراکنش شما به مبلغ {amount} تومان در تاریخ {date} با موفقیت انجام شد.',
    type: 'transactional',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'et3',
    name: 'هشدار قیمت',
    subject: 'هشدار تغییر قیمت طلا',
    htmlBody: '<h2>🔔 هشدار تغییر قیمت</h2><p>سلام {name} عزیز،</p><p>قیمت طلا تغییر یافته است. قیمت فعلی: <strong>{gold_price} تومان</strong></p><p>برای مشاهده جزئیات به اپلیکیشن مراجعه کنید.</p>',
    textBody: 'سلام {name} عزیز، قیمت طلا تغییر یافته است. قیمت فعلی: {gold_price} تومان',
    type: 'price_alert',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'et4',
    name: 'تولد',
    subject: 'تولدت مبارک! 🎂',
    htmlBody: '<h1>🎂 تولدت مبارک {name}!</h1><p>تیم زرین گلد تولد شما را تبریک می‌گوید!</p><p>یک هدیه ویژه برای شما در نظر گرفته‌ایم. با کد <strong>{ref_code}</strong> از تخفیف ویژه بهره‌مند شوید.</p>',
    textBody: 'تولدت مبارک {name}! تیم زرین گلد تولد شما را تبریک می‌گوید! یک هدیه ویژه با کد {ref_code} منتظر شماست.',
    type: 'birthday',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'et5',
    name: 'امنیتی',
    subject: 'هشدار امنیتی',
    htmlBody: '<h2>⚠️ هشدار امنیتی</h2><p>سلام {name} عزیز،</p><p>یک ورود جدید به حساب کاربری شما از یک دستگاه ناشناس شناسایی شده است.</p><p>اگر این ورود توسط شما نبوده، لطفاً فوراً رمز عبور خود را تغییر دهید.</p>',
    textBody: 'هشدار امنیتی: ورود جدید به حساب شما شناسایی شده. اگر شما نیستید رمز عبور را تغییر دهید.',
    type: 'security',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'et6',
    name: 'خبرنامه هفتگی',
    subject: 'خبرنامه هفتگی زرین گلد',
    htmlBody: '<h2>📰 خبرنامه هفتگی زرین گلد</h2><p>سلام {name} عزیز،</p><p>خلاصه آخرین اخبار و تحلیل‌های بازار طلا در این هفته:</p><ul><li>روند قیمت طلا در هفته گذشته</li><li>پیش‌بینی بازار</li><li>نکات طلایی سرمایه‌گذاری</li></ul>',
    textBody: 'خبرنامه هفتگی زرین گلد - آخرین اخبار و تحلیل‌های بازار طلا',
    type: 'newsletter',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'et7',
    name: 'گزارش معاملات',
    subject: 'گزارش هفتگی معاملات',
    htmlBody: '<h2>📊 گزارش هفتگی معاملات</h2><p>سلام {name} عزیز،</p><p>گزارش معاملات شما در هفته گذشته آماده است.</p><p>مجموع معاملات: <strong>{amount} تومان</strong></p>',
    textBody: 'گزارش هفتگی معاملات شما - مجموع: {amount} تومان',
    type: 'transactional',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'et8',
    name: 'پاداش هدیه',
    subject: 'هدیه ویژه از زرین گلد 🎁',
    htmlBody: '<h1>🎁 هدیه ویژه برای شما!</h1><p>سلام {name} عزیز،</p><p>زیرین گلد یک هدیه ویژه برای شما در نظر گرفته است. با کد <strong>{ref_code}</strong> از این پیشنهاد بهره‌مند شوید.</p>',
    textBody: 'هدیه ویژه از زرین گلد! با کد {ref_code} از پیشنهاد ویژه بهره‌مند شوید.',
    type: 'promotional',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'et9',
    name: 'ریستور رمز عبور',
    subject: 'بازیابی رمز عبور شما',
    htmlBody: '<h2>بازیابی رمز عبور</h2><p>سلام {name} عزیز،</p><p>برای بازیابی رمز عبور خود روی لینک زیر کلیک کنید:</p><p><a href="#">بازیابی رمز عبور</a></p><p>اگر این درخواست توسط شما نبوده، این ایمیل را نادیده بگیرید.</p>',
    textBody: 'بازیابی رمز عبور {name}. اگر این درخواست توسط شما نبوده، نادیده بگیرید.',
    type: 'transactional',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'et10',
    name: 'خروج از سبد',
    subject: 'درخواست خروج از حساب',
    htmlBody: '<h2>⚠️ درخواست خروج از حساب</h2><p>سلام {name} عزیز،</p><p>یک درخواست برای خروج (Withdrawal) از حساب شما ثبت شده است.</p><p>اگر این درخواست توسط شما نبوده، فوراً با پشتیبانی تماس بگیرید.</p>',
    textBody: 'درخواست خروج از حساب شما ثبت شده. اگر این درخواست توسط شما نبوده، با پشتیبانی تماس بگیرید.',
    type: 'security',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub-Components                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StatusBadge({ status, animate }: { status: string; animate?: boolean }) {
  const info = STATUS_MAP[status] || STATUS_MAP.draft;
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] font-medium gap-1 border',
        info.color,
        animate && 'animate-pulse'
      )}
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
    <Card className="bg-[#14141e]/80 border-border/50 rounded-2xl overflow-hidden group hover:scale-[1.01] transition-all duration-300">
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
            {description && (
              <CardDescription className="text-[11px] mt-0.5">{description}</CardDescription>
            )}
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
/*  Main Component                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function EmailMarketing() {
  const { addToast } = useAppStore();

  /* ── Active Tab ── */
  const [activeTab, setActiveTab] = useState('dashboard');

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Dashboard                                                  */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [chartData, setChartData] = useState<{ day: string; sent: number; opened: number }[]>([]);
  const [recentCampaigns, setRecentCampaigns] = useState<EmailCampaign[]>([]);

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Campaigns                                                  */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'marketing',
    segment: 'all',
    subject: '',
    htmlBody: '',
    textBody: '',
    scheduledAt: '',
    templateId: '',
  });
  const [campaignStatusFilter, setCampaignStatusFilter] = useState('draft');
  const [campaignTypeFilter, setCampaignTypeFilter] = useState('marketing');

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Quick Send                                                 */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [quickEmails, setQuickEmails] = useState('');
  const [quickSubject, setQuickSubject] = useState('');
  const [quickBody, setQuickBody] = useState('');
  const [quickType, setQuickType] = useState('marketing');
  const [quickSending, setQuickSending] = useState(false);
  const [quickConfirmOpen, setQuickConfirmOpen] = useState(false);
  const [recentQuickSends, setRecentQuickSends] = useState<QuickSendRecord[]>([]);

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Templates                                                  */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    htmlBody: '',
    textBody: '',
    type: 'marketing',
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Birthday                                                   */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [birthdays, setBirthdays] = useState<BirthdayContact[]>([]);
  const [birthdaysLoading, setBirthdaysLoading] = useState(false);
  const [birthdaySubject, setBirthdaySubject] = useState('تولدت مبارک! 🎂');
  const [birthdayBody, setBirthdayBody] = useState(
    '<h1>🎂 تولدت مبارک!</h1><p>تیم زرین گلد تولد شما را تبریک می‌گوید. یک هدیه ویژه برای شما در نظر گرفته‌ایم.</p>'
  );
  const [birthdayStats, setBirthdayStats] = useState({ sentThisMonth: 0, totalSent: 0 });
  const [birthdaySending, setBirthdaySending] = useState<string | null>(null);

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Logs                                                       */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilters, setLogFilters] = useState({
    type: 'all',
    status: 'all',
    email: '',
  });
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Blacklist                                                  */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [blacklistLoading, setBlacklistLoading] = useState(false);
  const [blacklistEmail, setBlacklistEmail] = useState('');
  const [blacklistReason, setBlacklistReason] = useState('');
  const [blacklistAdding, setBlacklistAdding] = useState(false);

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: SMTP Config                                                */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    provider: 'custom',
    host: '',
    port: 587,
    ssl: true,
    username: '',
    password: '',
    senderName: 'زرین گلد',
    senderEmail: '',
    replyTo: '',
  });
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestEmail, setSmtpTestEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'failed' | 'testing'>('idle');

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  API Fetch Functions                                                 */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/email/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setChartData(data.chartData || []);
      }
    } catch {
      setStats({
        totalSent: 45820,
        opened: 28350,
        clicked: 8940,
        todayOpened: 1245,
        openRate: 61.9,
        clickRate: 19.5,
      });
      const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
      setChartData(
        days.map((d) => ({
          day: d,
          sent: Math.floor(Math.random() * 800) + 400,
          opened: Math.floor(Math.random() * 500) + 200,
        }))
      );
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchCampaigns = useCallback(async (status?: string, type?: string) => {
    setCampaignsLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '20' });
      if (status && status !== 'all') params.set('status', status);
      if (type && type !== 'all') params.set('type', type);
      const res = await fetch(`/api/email/campaigns?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || data || []);
      }
    } catch {
      setCampaigns([
        {
          id: 'ec1',
          name: 'کمپین تخفیف نوروزی',
          subject: 'عید نوروز مبارک! تخفیف ویژه زرین گلد تا ۵۰٪',
          type: 'marketing',
          segment: 'all',
          status: 'completed',
          recipients: 3200,
          opened: 2150,
          clicked: 680,
          bounced: 45,
          htmlBody: '',
          textBody: '',
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
          id: 'ec2',
          name: 'هشدار افزایش قیمت',
          subject: '🔔 قیمت طلا ۳٪ افزایش یافت',
          type: 'price_alert',
          segment: 'active',
          status: 'sending',
          recipients: 1850,
          opened: 620,
          clicked: 180,
          bounced: 12,
          htmlBody: '',
          textBody: '',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'ec3',
          name: 'پیش‌نویس خبرنامه',
          subject: 'خبرنامه هفتگی - تحلیل بازار طلا',
          type: 'newsletter',
          segment: 'verified',
          status: 'draft',
          recipients: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          htmlBody: '',
          textBody: '',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'ec4',
          name: 'کمپین VIP',
          subject: 'پیشنهاد ویژه مشتریان طلایی',
          type: 'promotional',
          segment: 'vip',
          status: 'scheduled',
          recipients: 450,
          opened: 0,
          clicked: 0,
          bounced: 0,
          htmlBody: '',
          textBody: '',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'ec5',
          name: 'خوش‌آمدگویی جدیدان',
          subject: 'به زرین گلد خوش آمدید! 🎉',
          type: 'marketing',
          segment: 'new',
          status: 'completed',
          recipients: 890,
          opened: 720,
          clicked: 310,
          bounced: 5,
          htmlBody: '',
          textBody: '',
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        },
      ]);
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  const fetchRecentCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/email/campaigns?page=1&limit=5&status=all&type=all');
      if (res.ok) {
        const data = await res.json();
        const list = data.campaigns || data || [];
        if (list.length > 0) {
          setRecentCampaigns(list.slice(0, 5));
          return;
        }
      }
    } catch {
      // fallback below
    }
    setRecentCampaigns([
      {
        id: 'ec1',
        name: 'کمپین تخفیف نوروزی',
        subject: 'عید نوروز مبارک! تخفیف ویژه',
        type: 'marketing',
        segment: 'all',
        status: 'completed',
        recipients: 3200,
        opened: 2150,
        clicked: 680,
        bounced: 45,
        htmlBody: '',
        textBody: '',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: 'ec2',
        name: 'هشدار افزایش قیمت',
        subject: 'قیمت طلا افزایش یافت',
        type: 'price_alert',
        segment: 'active',
        status: 'sending',
        recipients: 1850,
        opened: 620,
        clicked: 180,
        bounced: 12,
        htmlBody: '',
        textBody: '',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ]);
  }, []);

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await fetch('/api/email/templates');
      if (res.ok) {
        const data = await res.json();
        if (data.templates && data.templates.length > 0) {
          setTemplates(data.templates);
        }
      }
    } catch {
      // Keep defaults
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: logPage.toString(),
        limit: '20',
        type: logFilters.type,
        status: logFilters.status,
      });
      if (logFilters.email) params.set('email', logFilters.email);
      const res = await fetch(`/api/email/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || data || []);
        setLogTotalPages(data.totalPages || 1);
      }
    } catch {
      const mockLogs: EmailLog[] = Array.from({ length: 14 }, (_, i) => ({
        id: `el${i + 1}`,
        date: new Date(Date.now() - i * 3600000 * 2).toISOString(),
        email: `user${i + 1}@example.com`,
        subject: ['خوش‌آمدگویی', 'اطلاعیه تراکنش', 'خبرنامه', 'هشدار قیمت', 'تولدت مبارک', 'امنیتی'][i % 6],
        type: ['marketing', 'transactional', 'newsletter', 'price_alert', 'birthday', 'security'][i % 6],
        status: (['sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'] as const)[i % 6],
        isOpened: i % 3 === 0,
        isClicked: i % 5 === 0,
      }));
      setLogs(mockLogs);
    } finally {
      setLogsLoading(false);
    }
  }, [logPage, logFilters]);

  const fetchBirthdays = useCallback(async () => {
    setBirthdaysLoading(true);
    try {
      const res = await fetch('/api/email/birthday');
      if (res.ok) {
        const data = await res.json();
        setBirthdays(data.contacts || []);
        setBirthdayStats(data.stats || { sentThisMonth: 0, totalSent: 0 });
      }
    } catch {
      setBirthdays([
        { id: 'eb1', name: 'علی محمدی', email: 'ali@example.com', birthDate: '۱۴۰۳/۰۶/۱۵' },
        { id: 'eb2', name: 'سارا احمدی', email: 'sara@example.com', birthDate: '۱۴۰۳/۰۶/۱۶' },
        { id: 'eb3', name: 'رضا کریمی', email: 'reza@example.com', birthDate: '۱۴۰۳/۰۶/۱۸' },
        { id: 'eb4', name: 'مریم حسینی', email: 'maryam@example.com', birthDate: '۱۴۰۳/۰۶/۲۰' },
      ]);
      setBirthdayStats({ sentThisMonth: 24, totalSent: 312 });
    } finally {
      setBirthdaysLoading(false);
    }
  }, []);

  const fetchBlacklist = useCallback(async () => {
    setBlacklistLoading(true);
    try {
      const res = await fetch('/api/email/blacklist');
      if (res.ok) {
        const data = await res.json();
        setBlacklist(data.blacklist || []);
      }
    } catch {
      setBlacklist([
        { id: 'ebl1', email: 'spam@example.com', reason: 'اسپم', addedAt: '۱۴۰۳/۰۳/۱۰' },
        { id: 'ebl2', email: 'blocked@example.com', reason: 'درخواست کاربر', addedAt: '۱۴۰۳/۰۳/۱۲' },
      ]);
    } finally {
      setBlacklistLoading(false);
    }
  }, []);

  const fetchSmtpConfig = useCallback(async () => {
    setSmtpLoading(true);
    try {
      const res = await fetch('/api/email/config');
      if (res.ok) {
        const data = await res.json();
        setSmtpConfig((prev) => ({ ...prev, ...data }));
      }
    } catch {
      // Keep defaults
    } finally {
      setSmtpLoading(false);
    }
  }, []);

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  Load data on tab change                                             */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
      fetchRecentCampaigns();
    }
  }, [activeTab, fetchStats, fetchRecentCampaigns]);

  useEffect(() => {
    if (activeTab === 'campaigns') fetchCampaigns(campaignStatusFilter, campaignTypeFilter);
  }, [activeTab, campaignStatusFilter, campaignTypeFilter, fetchCampaigns]);

  useEffect(() => {
    if (activeTab === 'templates') fetchTemplates();
  }, [activeTab, fetchTemplates]);

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, fetchLogs]);

  useEffect(() => {
    if (activeTab === 'birthday') fetchBirthdays();
  }, [activeTab, fetchBirthdays]);

  useEffect(() => {
    if (activeTab === 'blacklist') fetchBlacklist();
  }, [activeTab, fetchBlacklist]);

  useEffect(() => {
    if (activeTab === 'smtp') fetchSmtpConfig();
  }, [activeTab, fetchSmtpConfig]);

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
        body: JSON.stringify(campaignForm),
      });
      if (res.ok) {
        addToast('کمپین با موفقیت ایجاد شد', 'success');
        setCampaignDialogOpen(false);
        setCampaignForm({
          name: '',
          type: 'marketing',
          segment: 'all',
          subject: '',
          htmlBody: '',
          textBody: '',
          scheduledAt: '',
          templateId: '',
        });
        fetchCampaigns(campaignStatusFilter, campaignTypeFilter);
      } else {
        addToast('خطا در ایجاد کمپین', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
  };

  const handleCampaignAction = async (id: string, action: 'send' | 'cancel' | 'duplicate') => {
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
        };
        addToast(messages[action] || 'عملیات موفق', 'success');
        fetchCampaigns(campaignStatusFilter, campaignTypeFilter);
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
        fetchCampaigns(campaignStatusFilter, campaignTypeFilter);
      }
    } catch {
      addToast('خطا در حذف کمپین', 'error');
    }
  };

  const handleLoadTemplate = (templateId: string) => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      setCampaignForm((prev) => ({
        ...prev,
        subject: tmpl.subject,
        htmlBody: tmpl.htmlBody,
        textBody: tmpl.textBody,
        templateId: tmpl.id,
      }));
      addToast('قالب بارگذاری شد', 'info');
    }
  };

  /* ── Quick Send ── */
  const handleQuickSend = async () => {
    if (!quickEmails.trim() || !quickSubject.trim() || !quickBody.trim()) {
      addToast('لطفاً ایمیل، موضوع و متن پیام را وارد کنید', 'error');
      return;
    }
    setQuickSending(true);
    try {
      const emails = quickEmails
        .split('\n')
        .map((e) => e.trim())
        .filter(Boolean);
      const res = await fetch('/api/email/quick-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails, subject: quickSubject, body: quickBody, type: quickType }),
      });
      if (res.ok) {
        addToast(`${toPersianDigits(String(emails.length))} ایمیل ارسال شد`, 'success');
        setRecentQuickSends((prev) => [
          {
            id: Date.now().toString(),
            emails,
            subject: quickSubject,
            date: new Date().toLocaleString('fa-IR'),
          },
          ...prev.slice(0, 4),
        ]);
        setQuickEmails('');
        setQuickSubject('');
        setQuickBody('');
        setQuickConfirmOpen(false);
      } else {
        addToast('خطا در ارسال ایمیل', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setQuickSending(false);
    }
  };

  /* ── Template Actions ── */
  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.subject.trim()) {
      addToast('لطفاً نام و موضوع قالب را وارد کنید', 'error');
      return;
    }
    try {
      const url = editingTemplate ? `/api/email/templates/${editingTemplate.id}` : '/api/email/templates';
      const method = editingTemplate ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm),
      });
      if (res.ok) {
        addToast(editingTemplate ? 'قالب بروزرسانی شد' : 'قالب ایجاد شد', 'success');
        setTemplateDialogOpen(false);
        setEditingTemplate(null);
        setTemplateForm({ name: '', subject: '', htmlBody: '', textBody: '', type: 'marketing' });
        fetchTemplates();
      }
    } catch {
      addToast('خطا در ذخیره قالب', 'error');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/email/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('قالب حذف شد', 'success');
        fetchTemplates();
      }
    } catch {
      addToast('خطا در حذف قالب', 'error');
    }
  };

  const handleToggleTemplate = async (tmpl: EmailTemplate) => {
    try {
      const res = await fetch(`/api/email/templates/${tmpl.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tmpl, active: !tmpl.active }),
      });
      if (res.ok) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === tmpl.id ? { ...t, active: !t.active } : t))
        );
        addToast(tmpl.active ? 'قالب غیرفعال شد' : 'قالب فعال شد', 'info');
      }
    } catch {
      addToast('خطا در تغییر وضعیت قالب', 'error');
    }
  };

  const openEditTemplate = (tmpl: EmailTemplate) => {
    setEditingTemplate(tmpl);
    setTemplateForm({
      name: tmpl.name,
      subject: tmpl.subject,
      htmlBody: tmpl.htmlBody,
      textBody: tmpl.textBody,
      type: tmpl.type,
    });
    setTemplateDialogOpen(true);
  };

  /* ── Birthday Actions ── */
  const handleSendBirthday = async (contact: BirthdayContact) => {
    setBirthdaySending(contact.id);
    try {
      const res = await fetch('/api/email/birthday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: contact.id, subject: birthdaySubject, body: birthdayBody }),
      });
      if (res.ok) {
        addToast(`ایمیل تولد برای ${contact.name} ارسال شد`, 'success');
        setBirthdays((prev) =>
          prev.map((b) => (b.id === contact.id ? { ...b, sent: true } : b))
        );
      }
    } catch {
      addToast('خطا در ارسال ایمیل تولد', 'error');
    } finally {
      setBirthdaySending(null);
    }
  };

  const handleSendAllBirthdays = async () => {
    const unsent = birthdays.filter((b) => !b.sent);
    if (unsent.length === 0) {
      addToast('همه پیام‌ها ارسال شده‌اند', 'info');
      return;
    }
    try {
      const res = await fetch('/api/email/birthday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: birthdaySubject, body: birthdayBody, sendAll: true }),
      });
      if (res.ok) {
        addToast(`${toPersianDigits(String(unsent.length))} ایمیل تولد ارسال شد`, 'success');
        setBirthdays((prev) => prev.map((b) => ({ ...b, sent: true })));
      }
    } catch {
      addToast('خطا در ارسال ایمیل‌های تولد', 'error');
    }
  };

  /* ── Blacklist Actions ── */
  const handleAddBlacklist = async () => {
    if (!blacklistEmail.trim()) {
      addToast('آدرس ایمیل را وارد کنید', 'error');
      return;
    }
    setBlacklistAdding(true);
    try {
      const res = await fetch('/api/email/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: blacklistEmail, reason: blacklistReason || 'بدون دلیل' }),
      });
      if (res.ok) {
        addToast('ایمیل به لیست سیاه اضافه شد', 'success');
        setBlacklistEmail('');
        setBlacklistReason('');
        fetchBlacklist();
      } else {
        addToast('خطا در افزودن به لیست سیاه', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setBlacklistAdding(false);
    }
  };

  const handleRemoveBlacklist = async (email: string) => {
    try {
      const res = await fetch('/api/email/blacklist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        addToast('ایمیل از لیست سیاه حذف شد', 'success');
        fetchBlacklist();
      }
    } catch {
      addToast('خطا در حذف از لیست سیاه', 'error');
    }
  };

  /* ── SMTP Actions ── */
  const handleSaveSmtp = async () => {
    if (!smtpConfig.host.trim() || !smtpConfig.username.trim()) {
      addToast('لطفاً اطلاعات SMTP را کامل کنید', 'error');
      return;
    }
    setSmtpSaving(true);
    try {
      const res = await fetch('/api/email/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpConfig),
      });
      if (res.ok) {
        addToast('تنظیمات SMTP ذخیره شد', 'success');
        setConnectionStatus('idle');
      } else {
        addToast('خطا در ذخیره تنظیمات', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!smtpTestEmail.trim()) {
      addToast('آدرس ایمیل گیرنده را وارد کنید', 'error');
      return;
    }
    setSmtpTesting(true);
    setConnectionStatus('testing');
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: smtpTestEmail }),
      });
      if (res.ok) {
        addToast('ایمیل آزمایشی ارسال شد', 'success');
        setConnectionStatus('connected');
      } else {
        addToast('خطا در ارسال ایمیل آزمایشی', 'error');
        setConnectionStatus('failed');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
      setConnectionStatus('failed');
    } finally {
      setSmtpTesting(false);
    }
  };

  /* ── Preview ── */
  const handlePreview = (html: string) => {
    setPreviewHtml(html);
    setPreviewOpen(true);
  };

  /* ── Export Logs ── */
  const handleExportLogs = () => {
    try {
      const csvRows = [
        ['تاریخ', 'ایمیل', 'موضوع', 'نوع', 'وضعیت', 'باز شده', 'کلیک شده'],
        ...logs.map((l) => [
          formatDateTime(l.date),
          l.email,
          l.subject,
          CAMPAIGN_TYPES[l.type] || l.type,
          STATUS_MAP[l.status]?.label || l.status,
          l.isOpened ? 'بله' : 'خیر',
          l.isClicked ? 'بله' : 'خیر',
        ]),
      ];
      const csvContent = '\uFEFF' + csvRows.map((row) => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `email-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      addToast('فایل CSV دانلود شد', 'success');
    } catch {
      addToast('خطا در خروجی گرفتن', 'error');
    }
  };

  /* ── Max chart value for bar chart ── */
  const maxChartValue = chartData.length > 0
    ? Math.max(...chartData.map((d) => d.sent))
    : 100;

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                               */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <TooltipProvider>
      <div dir="rtl" className="max-w-6xl mx-auto space-y-6">
        {/* ── Page Title ── */}
        <div className="flex items-center gap-3 mb-2">
          <div className="size-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
            <Mail className="size-5 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold gold-gradient-text">مدیریت ایمیل مارکتینگ</h1>
            <p className="text-xs text-muted-foreground">پنل مدیریت ایمیل زرین گلد</p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex h-auto bg-[#14141e]/80 border border-border/50 rounded-2xl p-1 gap-0.5 overflow-x-auto no-scrollbar">
            {[
              { value: 'dashboard', label: 'داشبورد', icon: BarChart3 },
              { value: 'campaigns', label: 'کمپین‌ها', icon: Send },
              { value: 'quick-send', label: 'ارسال سریع', icon: Zap },
              { value: 'templates', label: 'قالب‌ها', icon: FileText },
              { value: 'birthday', label: 'پیامک تولد', icon: Cake },
              { value: 'logs', label: 'لاگ ارسال', icon: Inbox },
              { value: 'blacklist', label: 'لیست سیاه', icon: ShieldAlert },
              { value: 'smtp', label: 'تنظیمات SMTP', icon: Settings },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[10px] sm:text-xs font-medium transition-all data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#1a1a00] data-[state=active]:shadow-md text-muted-foreground data-[state=active]:text-[#1a1a00]"
              >
                <tab.icon className="size-3.5 shrink-0" />
                <span className="hidden sm:inline truncate">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/*  TAB 1: DASHBOARD                                               */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="dashboard" className="mt-6 space-y-6">
            {/* ── Stats Cards ── */}
            {statsLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="bg-[#14141e]/80 rounded-2xl">
                    <CardContent className="p-4">
                      <Skeleton className="h-20 w-full rounded-lg" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                  icon={Mail}
                  title="📧 کل ارسال‌ها"
                  value={formatNumber(stats.totalSent)}
                  iconColor="text-[#D4AF37]"
                />
                <StatCard
                  icon={MailOpen}
                  title="✅ باز شده"
                  value={formatNumber(stats.opened)}
                  subtitle={`نرخ باز: ${toPersianDigits(stats.openRate.toFixed(1))}%`}
                  iconColor="text-blue-400"
                />
                <StatCard
                  icon={MousePointerClick}
                  title="📊 کلیک شده"
                  value={formatNumber(stats.clicked)}
                  subtitle={`نرخ کلیک: ${toPersianDigits(stats.clickRate.toFixed(1))}%`}
                  iconColor="text-purple-400"
                />
                <StatCard
                  icon={TrendingUp}
                  title="📈 بازده امروز"
                  value={formatNumber(stats.todayOpened)}
                  iconColor="text-emerald-400"
                />
              </div>
            ) : null}

            {/* ── Quick Actions ── */}
            <Card className="bg-[#14141e]/80 border-border/50 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="size-4 text-[#D4AF37]" />
                  <span className="text-xs font-bold">عملیات سریع</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-2 border-border/50 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 text-xs"
                    onClick={() => setActiveTab('quick-send')}
                  >
                    <Zap className="size-4 text-[#D4AF37]" />
                    <span>ارسال سریع</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-2 border-border/50 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 text-xs"
                    onClick={() => {
                      setCampaignDialogOpen(true);
                      setActiveTab('campaigns');
                    }}
                  >
                    <Plus className="size-4 text-[#D4AF37]" />
                    <span>کمپین جدید</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-2 border-border/50 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 text-xs"
                    onClick={() => setActiveTab('birthday')}
                  >
                    <Cake className="size-4 text-[#D4AF37]" />
                    <span>پیام تولد</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-2 border-border/50 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 text-xs"
                    onClick={() => setActiveTab('smtp')}
                  >
                    <Settings className="size-4 text-[#D4AF37]" />
                    <span>تنظیمات SMTP</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ── Activity Chart (7 Days Bar Chart) ── */}
            <Card className="bg-[#14141e]/80 border-border/50 rounded-2xl">
              <SectionHeader icon={BarChart3} title="نمودار فعالیت ۷ روز اخیر" />
              <CardContent className="px-4 pb-4">
                {chartData.length > 0 ? (
                  <div className="flex items-end gap-1 sm:gap-2 h-48">
                    {chartData.map((d, i) => {
                      const sentPct = maxChartValue > 0 ? (d.sent / maxChartValue) * 100 : 0;
                      const openedPct = maxChartValue > 0 ? (d.opened / maxChartValue) * 100 : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex items-end justify-center gap-0.5 h-36">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="w-3 sm:w-5 rounded-t-sm bg-gradient-to-t from-[#D4AF37] to-[#f0d060] transition-all duration-500 hover:opacity-80"
                                  style={{ height: `${sentPct}%`, minHeight: '4px' }}
                                />
                              </TooltipTrigger>
                              <TooltipContent className="text-[10px]">
                                ارسال: {formatNumber(d.sent)}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="w-3 sm:w-5 rounded-t-sm bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-500 hover:opacity-80"
                                  style={{ height: `${openedPct}%`, minHeight: '2px' }}
                                />
                              </TooltipTrigger>
                              <TooltipContent className="text-[10px]">
                                باز شده: {formatNumber(d.opened)}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate w-full text-center">
                            {d.day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48">
                    <p className="text-xs text-muted-foreground">داده‌ای موجود نیست</p>
                  </div>
                )}
                {/* Chart Legend */}
                <div className="flex items-center justify-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-sm bg-gradient-to-t from-[#D4AF37] to-[#f0d060]" />
                    <span className="text-[10px] text-muted-foreground">ارسال شده</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-sm bg-gradient-to-t from-blue-600 to-blue-400" />
                    <span className="text-[10px] text-muted-foreground">باز شده</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Recent Campaigns ── */}
            <Card className="bg-[#14141e]/80 border-border/50 rounded-2xl">
              <SectionHeader
                icon={Clock}
                title="کمپین‌های اخیر"
                badge={recentCampaigns.length > 0 ? (
                  <Badge variant="outline" className="text-[10px] border-[#D4AF37]/30 text-[#D4AF37]">
                    {toPersianDigits(String(recentCampaigns.length))}
                  </Badge>
                ) : undefined}
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[11px] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                    onClick={() => setActiveTab('campaigns')}
                  >
                    مشاهده همه
                    <ChevronLeft className="size-3.5 mr-1" />
                  </Button>
                }
              />
              <CardContent className="px-4 pb-4">
                {recentCampaigns.length === 0 ? (
                  <EmptyState
                    icon={Send}
                    title="کمپینی وجود ندارد"
                    description="هنوز کمپینی ایجاد نشده است"
                    action={
                      <Button
                        size="sm"
                        className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#1a1a00] font-bold text-xs"
                        onClick={() => setCampaignDialogOpen(true)}
                      >
                        <Plus className="size-3.5 ml-1" />
                        ایجاد کمپین
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-2">
                    {recentCampaigns.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/80 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold truncate">{c.name}</span>
                            <StatusBadge status={c.status} animate={c.status === 'sending'} />
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{truncate(c.subject, 50)}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-[10px] text-muted-foreground">
                          <span>📧 {formatNumber(c.recipients)}</span>
                          <span>👁️ {formatNumber(c.opened)}</span>
                          <span className="hidden sm:inline">{formatDate(c.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/*  TAB 2: CAMPAIGNS                                               */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="campaigns" className="mt-6 space-y-4">
            {/* ── Filters & Actions ── */}
            <Card className="bg-[#14141e]/80 border-border/50 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={campaignStatusFilter} onValueChange={setCampaignStatusFilter}>
                    <SelectTrigger className="w-[140px] h-9 text-xs bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                      <SelectItem value="draft">پیش‌نویس</SelectItem>
                      <SelectItem value="scheduled">زمان‌بندی</SelectItem>
                      <SelectItem value="sending">در حال ارسال</SelectItem>
                      <SelectItem value="completed">تکمیل شده</SelectItem>
                      <SelectItem value="cancelled">لغو شده</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={campaignTypeFilter} onValueChange={setCampaignTypeFilter}>
                    <SelectTrigger className="w-[130px] h-9 text-xs bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه انواع</SelectItem>
                      <SelectItem value="marketing">بازاریابی</SelectItem>
                      <SelectItem value="transactional">تراکنشی</SelectItem>
                      <SelectItem value="newsletter">خبرنامه</SelectItem>
                      <SelectItem value="price_alert">هشدار قیمت</SelectItem>
                      <SelectItem value="security">امنیتی</SelectItem>
                      <SelectItem value="promotional">ترویجی</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1" />
                  <Button
                    className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#1a1a00] font-bold text-xs h-9"
                    onClick={() => {
                      setEditingTemplate(null);
                      setCampaignForm({
                        name: '', type: 'marketing', segment: 'all',
                        subject: '', htmlBody: '', textBody: '',
                        scheduledAt: '', templateId: '',
                      });
                      setCampaignDialogOpen(true);
                    }}
                  >
                    <Plus className="size-3.5 ml-1" />
                    کمپین جدید
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ── Campaigns Grid ── */}
            {campaignsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="bg-[#14141e]/80 rounded-2xl">
                    <CardContent className="p-4">
                      <Skeleton className="h-40 w-full rounded-lg" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <EmptyState
                icon={Send}
                title="کمپینی یافت نشد"
                description="با تغییر فیلتر یا ایجاد کمپین جدید شروع کنید"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.map((c) => {
                  const openRate = c.recipients > 0 ? Math.round((c.opened / c.recipients) * 100) : 0;
                  return (
                    <Card
                      key={c.id}
                      className="bg-[#14141e]/80 border-border/50 rounded-2xl overflow-hidden hover:border-[#D4AF37]/30 transition-all duration-300"
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-sm font-bold truncate">{c.name}</span>
                              <StatusBadge status={c.status} animate={c.status === 'sending'} />
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">{truncate(c.subject, 60)}</p>
                          </div>
                        </div>

                        {/* Type & Segment Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] border-blue-500/20 text-blue-400 bg-blue-500/10">
                            {CAMPAIGN_TYPES[c.type] || c.type}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] border-purple-500/20 text-purple-400 bg-purple-500/10">
                            {CAMPAIGN_SEGMENTS[c.segment] || c.segment}
                          </Badge>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div>
                            <p className="text-[10px] text-muted-foreground">گیرندگان</p>
                            <p className="text-xs font-bold gold-gradient-text">{formatNumber(c.recipients)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">باز شده</p>
                            <p className="text-xs font-bold text-blue-400">{formatNumber(c.opened)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">کلیک</p>
                            <p className="text-xs font-bold text-purple-400">{formatNumber(c.clicked)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">برگشت</p>
                            <p className="text-xs font-bold text-orange-400">{formatNumber(c.bounced)}</p>
                          </div>
                        </div>

                        {/* Open Rate Progress */}
                        {c.recipients > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground">نرخ باز</span>
                              <span className="text-[#D4AF37] font-bold">{toPersianDigits(String(openRate))}%</span>
                            </div>
                            <Progress
                              value={openRate}
                              className="h-1.5 bg-background"
                            />
                          </div>
                        )}

                        {/* Date & Actions */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(c.createdAt)}
                            {c.scheduledAt && (
                              <span className="mr-2 text-blue-400">
                                زمان‌بندی: {formatDate(c.scheduledAt)}
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-1">
                            {(c.status === 'draft' || c.status === 'scheduled') && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="size-7 p-0 text-emerald-400 hover:bg-emerald-500/10"
                                    onClick={() => handleCampaignAction(c.id, 'send')}
                                  >
                                    <Play className="size-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>ارسال</TooltipContent>
                              </Tooltip>
                            )}
                            {(c.status === 'scheduled' || c.status === 'sending') && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="size-7 p-0 text-red-400 hover:bg-red-500/10"
                                    onClick={() => handleCampaignAction(c.id, 'cancel')}
                                  >
                                    <Ban className="size-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>لغو</TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-7 p-0 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                                  onClick={() => handleCampaignAction(c.id, 'duplicate')}
                                >
                                  <Copy className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>کپی</TooltipContent>
                            </Tooltip>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="size-7 p-0 text-red-400 hover:bg-red-500/10"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>حذف</TooltipContent>
                                </Tooltip>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-[#14141e] border-border/50">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>حذف کمپین</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    آیا از حذف کمپین «{c.name}» اطمینان دارید؟ این عملیات قابل بازگشت نیست.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-border/50">انصراف</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => handleDeleteCampaign(c.id)}
                                  >
                                    حذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* ── Create Campaign Dialog ── */}
            <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
              <DialogContent className="bg-[#14141e] border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="gold-gradient-text text-base">
                    ایجاد کمپین جدید
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    کمپین ایمیل جدید ایجاد کنید. از متغیرها برای شخصی‌سازی استفاده کنید.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">نام کمپین *</Label>
                    <Input
                      value={campaignForm.name}
                      onChange={(e) => setCampaignForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="مثلاً: کمپین تخفیف نوروزی"
                      className="bg-background/50 border-border/50 text-sm h-9"
                    />
                  </div>

                  {/* Type & Segment */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">نوع کمپین</Label>
                      <Select
                        value={campaignForm.type}
                        onValueChange={(v) => setCampaignForm((p) => ({ ...p, type: v }))}
                      >
                        <SelectTrigger className="bg-background/50 border-border/50 text-xs h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CAMPAIGN_TYPES).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">بخش (Segment)</Label>
                      <Select
                        value={campaignForm.segment}
                        onValueChange={(v) => setCampaignForm((p) => ({ ...p, segment: v }))}
                      >
                        <SelectTrigger className="bg-background/50 border-border/50 text-xs h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CAMPAIGN_SEGMENTS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">موضوع ایمیل *</Label>
                      <span className="text-[10px] text-muted-foreground">
                        {toPersianDigits(String(campaignForm.subject.length))} کاراکتر
                      </span>
                    </div>
                    <Input
                      value={campaignForm.subject}
                      onChange={(e) => setCampaignForm((p) => ({ ...p, subject: e.target.value }))}
                      placeholder="موضوع ایمیل..."
                      className="bg-background/50 border-border/50 text-sm h-9"
                      maxLength={200}
                    />
                  </div>

                  {/* Template Selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">بارگذاری از قالب</Label>
                    <Select onValueChange={handleLoadTemplate}>
                      <SelectTrigger className="bg-background/50 border-border/50 text-xs h-9">
                        <SelectValue placeholder="انتخاب قالب..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.filter((t) => t.active).map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name} - {truncate(t.subject, 30)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* HTML Body */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">متن HTML ایمیل</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] text-[#D4AF37] hover:bg-[#D4AF37]/10 h-6"
                        onClick={() => handlePreview(campaignForm.htmlBody || '<p>محتوایی وجود ندارد</p>')}
                      >
                        <Eye className="size-3 ml-1" />
                        پیش‌نمایش
                      </Button>
                    </div>
                    <Textarea
                      value={campaignForm.htmlBody}
                      onChange={(e) => setCampaignForm((p) => ({ ...p, htmlBody: e.target.value }))}
                      placeholder="<h1>موضوع</h1><p>متن ایمیل...</p>"
                      className="bg-background/50 border-border/50 text-xs min-h-[150px] font-mono"
                      dir="ltr"
                    />
                  </div>

                  {/* Text Body */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">متن ساده (fallback)</Label>
                    <Textarea
                      value={campaignForm.textBody}
                      onChange={(e) => setCampaignForm((p) => ({ ...p, textBody: e.target.value }))}
                      placeholder="نسخه متنی ایمیل برای کلاینت‌هایی که HTML پشتیبانی نمی‌کنند..."
                      className="bg-background/50 border-border/50 text-xs min-h-[80px]"
                    />
                  </div>

                  {/* Schedule */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">زمان‌بندی ارسال (اختیاری)</Label>
                    <Input
                      type="datetime-local"
                      value={campaignForm.scheduledAt}
                      onChange={(e) => setCampaignForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                      className="bg-background/50 border-border/50 text-xs h-9"
                      dir="ltr"
                    />
                  </div>

                  {/* Variable Hints */}
                  <div className="p-3 rounded-xl bg-background/50 border border-border/30">
                    <p className="text-[10px] text-muted-foreground mb-2">متغیرهای قابل استفاده:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {VARIABLE_HINTS.map((h) => (
                        <Badge
                          key={h.var}
                          variant="outline"
                          className="text-[10px] border-[#D4AF37]/20 text-[#D4AF37] bg-[#D4AF37]/5 cursor-pointer hover:bg-[#D4AF37]/15 transition-colors font-mono"
                          onClick={() => {
                            setCampaignForm((p) => ({
                              ...p,
                              htmlBody: p.htmlBody + h.var,
                              textBody: p.textBody + h.var,
                            }));
                          }}
                        >
                          {h.var}
                          <span className="mr-1 font-normal text-muted-foreground">({h.desc})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="border-border/50 text-xs"
                    onClick={() => setCampaignDialogOpen(false)}
                  >
                    انصراف
                  </Button>
                  <Button
                    className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#1a1a00] font-bold text-xs"
                    onClick={handleCreateCampaign}
                  >
                    <Send className="size-3.5 ml-1" />
                    ایجاد کمپین
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/*  TAB 3: QUICK SEND                                              */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="quick-send" className="mt-6 space-y-4">
            <Card className="bg-[#14141e]/80 border-border/50 rounded-2xl">
              <SectionHeader
                icon={Zap}
                title="ارسال سریع ایمیل"
                description="بدون نیاز به کمپین، ایمیل مستقیم ارسال کنید"
              />
              <CardContent className="px-4 pb-4 space-y-4">
                {/* Email Addresses */}
                <div className="space-y-1.5">
                  <Label className="text-xs">آدرس‌های ایمیل (هر خط یک آدرس) *</Label>
                  <Textarea
                    value={quickEmails}
                    onChange={(e) => setQuickEmails(e.target.value)}
                    placeholder={"user1@example.com\nuser2@example.com\nuser3@example.com"}
                    className="bg-background/50 border-border/50 text-xs min-h-[100px] font-mono"
                    dir="ltr"
                  />
                  {quickEmails.trim() && (
                    <p className="text-[10px] text-muted-foreground">
                      {toPersianDigits(
                        String(quickEmails.split('\n').filter((e) => e.trim()).length)
                      )}{' '}
                      ایمیل شناسایی شد
                    </p>
                  )}
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <Label className="text-xs">موضوع *</Label>
                  <Input
                    value={quickSubject}
                    onChange={(e) => setQuickSubject(e.target.value)}
                    placeholder="موضوع ایمیل..."
                    className="bg-background/50 border-border/50 text-sm h-9"
                  />
                </div>

                {/* Body */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">متن ایمیل *</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] text-[#D4AF37] hover:bg-[#D4AF37]/10 h-6"
                      onClick={() => handlePreview(quickBody || '<p>محتوایی وجود ندارد</p>')}
                    >
                      <Eye className="size-3 ml-1" />
                      پیش‌نمایش
                    </Button>
                  </div>
                  <Textarea
                    value={quickBody}
                    onChange={(e) => setQuickBody(e.target.value)}
                    placeholder="متن ایمیل..."
                    className="bg-background/50 border-border/50 text-xs min-h-[150px]"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs">نوع</Label>
                  <Select value={quickType} onValueChange={setQuickType}>
                    <SelectTrigger className="bg-background/50 border-border/50 text-xs h-9 w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CAMPAIGN_TYPES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Send Button */}
                <div className="flex gap-2">
                  <Button
                    className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#1a1a00] font-bold text-xs"
                    onClick={() => setQuickConfirmOpen(true)}
                    disabled={quickSending || !quickEmails.trim() || !quickSubject.trim() || !quickBody.trim()}
                  >
                    {quickSending ? (
                      <Loader2 className="size-3.5 ml-1 animate-spin" />
                    ) : (
                      <Send className="size-3.5 ml-1" />
                    )}
                    ارسال
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ── Recent Quick Sends ── */}
            {recentQuickSends.length > 0 && (
              <Card className="bg-[#14141e]/80 border-border/50 rounded-2xl">
                <SectionHeader icon={Clock} title="ارسال‌های اخیر" />
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {recentQuickSends.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-background/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{r.subject}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {toPersianDigits(String(r.emails.length))} گیرنده
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0 mr-2">
                          {r.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Quick Send Confirmation ── */}
            <AlertDialog open={quickConfirmOpen} onOpenChange={setQuickConfirmOpen}>
              <AlertDialogContent className="bg-[#14141e] border-border/50">
                <AlertDialogHeader>
                  <AlertDialogTitle>تأیید ارسال ایمیل</AlertDialogTitle>
                  <AlertDialogDescription>
                    آیا از ارسال ایمیل به{' '}
                    <strong className="text-foreground">
                      {toPersianDigits(
                        String(quickEmails.split('\n').filter((e) => e.trim()).length)
                      )}
                    </strong>{' '}
                    گیرنده اطمینان دارید؟
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border/50">انصراف</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#1a1a00] font-bold"
                    onClick={handleQuickSend}
                  >
                    بله، ارسال شود
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/*  TAB 4: TEMPLATES                                               */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="templates" className="mt-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-[#D4AF37]/30 text-[#D4AF37]">
                  {toPersianDigits(String(templates.length))} قالب
                </Badge>
              </div>
              <Button
                className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#1a1a00] font-bold text-xs h-8"
                onClick={() => {
                  setEditingTemplate(null);
                  setTemplateForm({ name: '', subject: '', htmlBody: '', textBody: '', type: 'marketing' });
                  setTemplateDialogOpen(true);
                }}
              >
                <Plus className="size-3.5 ml-1" />
                قالب جدید
              </Button>
            </div>

            {/* Templates Grid */}
            {templatesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-[#14141e]/80 rounded-2xl">
                    <CardContent className="p-4">
                      <Skeleton className="h-32 w-full rounded-lg" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((t) => (
                  <Card
                    key={t.id}
                    className={cn(
                      'bg-[#14141e]/80 border-border/50 rounded-2xl overflow-hidden transition-all duration-300',
                      t.active ? 'border-[#D4AF37]/20' : 'opacity-60'
                    )}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold truncate">{t.name}</h3>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {truncate(t.subject, 40)}
                          </p>
                        </div>
                        <Switch
                          checked={t.active}
                          onCheckedChange={() => handleToggleTemplate(t)}
                          className="scale-75"
                        />
                      </div>

                      {/* Type Badge */}
                      <Badge variant="outline" className="text-[10px] border-blue-500/20 text-blue-400 bg-blue-500/10">
                        {CAMPAIGN_TYPES[t.type] || t.type}
                      </Badge>

                      {/* Preview Text */}
                      <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                        {truncate(t.textBody || t.htmlBody.replace(/<[^>]*>/g, ''), 100)}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-1 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[10px] text-[#D4AF37] hover:bg-[#D4AF37]/10 h-7"
                          onClick={() => handlePreview(t.htmlBody)}
                        >
                          <Eye className="size-3 ml-1" />
                          پیش‌نمایش
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[10px] text-blue-400 hover:bg-blue-500/10 h-7"
                          onClick={() => openEditTemplate(t)}
                        >
                          <FileText className="size-3 ml-1" />
                          ویرایش
                        </Button>
                        <div className="flex-1" />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[10px] text-red-400 hover:bg-red-500/10 h-7"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#14141e] border-border/50">
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف قالب</AlertDialogTitle>
                              <AlertDialogDescription>
                                آیا از حذف قالب «{t.name}» اطمینان دارید؟
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-border/50">انصراف</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleDeleteTemplate(t.id)}
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* ── Template Create/Edit Dialog ── */}
            <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
              <DialogContent className="bg-[#14141e] border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="gold-gradient-text text-base">
                    {editingTemplate ? 'ویرایش قالب' : 'ایجاد قالب جدید'}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">نام قالب *</Label>
                    <Input
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="مثلاً: خوش‌آمدگویی"
                      className="bg-background/50 border-border/50 text-sm h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">نوع</Label>
                    <Select
                      value={templateForm.type}
                      onValueChange={(v) => setTemplateForm((p) => ({ ...p, type: v }))}
                    >
                      <SelectTrigger className="bg-background/50 border-border/50 text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CAMPAIGN_TYPES).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">موضوع ایمیل *</Label>
                    <Input
                      value={templateForm.subject}
                      onChange={(e) => setTemplateForm((p) => ({ ...p, subject: e.target.value }))}
                      placeholder="موضوع..."
                      className="bg-background/50 border-border/50 text-sm h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">متن HTML</Label>
                    <Textarea
                      value={templateForm.htmlBody}
                      onChange={(e) => setTemplateForm((p) => ({ ...p, htmlBody: e.target.value }))}
                      placeholder="<h1>عنوان</h1><p>متن...</p>"
                      className="bg-background/50 border-border/50 text-xs min-h-[150px] font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">متن ساده (fallback)</Label>
                    <Textarea
                      value={templateForm.textBody}
                      onChange={(e) => setTemplateForm((p) => ({ ...p, textBody: e.target.value }))}
                      placeholder="نسخه متنی..."
                      className="bg-background/50 border-border/50 text-xs min-h-[80px]"
                    />
                  </div>

                  {/* Variable Hints */}
                  <div className="p-3 rounded-xl bg-background/50 border border-border/30">
                    <p className="text-[10px] text-muted-foreground mb-2">متغیرها:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {VARIABLE_HINTS.map((h) => (
                        <Badge
                          key={h.var}
                          variant="outline"
                          className="text-[10px] border-[#D4AF37]/20 text-[#D4AF37] bg-[#D4AF37]/5 cursor-pointer hover:bg-[#D4AF37]/15 transition-colors font-mono"
                          onClick={() => {
                            setTemplateForm((p) => ({
                              ...p,
                              htmlBody: p.htmlBody + h.var,
                              textBody: p.textBody + h.var,
                            }));
                          }}
                        >
                          {h.var}
                          <span className="mr-1 font-normal text-muted-foreground">({h.desc})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="border-border/50 text-xs"
                    onClick={() => setTemplateDialogOpen(false)}
                  >
                    انصراف
                  </Button>
                  <Button
                    className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#1a1a00] font-bold text-xs"
                    onClick={handleSaveTemplate}
                  >
                    <Save className="size-3.5 ml-1" />
                    ذخیره
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/*  TAB 5: BIRTHDAY                                                */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="birthday" className="mt-6 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-[#14141e]/80 border-border/50 rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground">ارسال شده این ماه</p>
                  <p className="text-xl font-bold gold-gradient-text">{formatNumber(birthdayStats.sentThisMonth)}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#14141e]/80 border-border/50 rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground">کل ارسال‌ها</p>
                  <p className="text-xl font-bold gold-gradient-text">{formatNumber(birthdayStats.totalSent)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Birthday Template Editor */}
            <Card className="bg-[#14141e]/80 border-border/50 rounded-2xl">
              <SectionHeader icon={FileText} title="ویرایشگر قالب تولد" />
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">موضوع ایمیل</Label>
                  <Input
                    value={birthdaySubject}
                    onChange={(e) => setBirthdaySubject(e.target.value)}
                    className="bg-background/50 border-border/50 text-sm h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">متن ایمیل</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] text-[#D4AF37] hover:bg-[#D4AF37]/10 h-6"
                      onClick={() => handlePreview(birthdayBody)}
                    >
                      <Eye className="size-3 ml-1" />
                      پیش‌نمایش
                    </Button>
                  </div>
                  <Textarea
                    value={birthdayBody}
                    onChange={(e) => setBirthdayBody(e.target.value)}
                    className="bg-background/50 border-border/50 text-xs min-h-[120px] font-mono"
                    dir="ltr"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Birthdays */}
            <Card className="bg-[#14141e]/80 border-border/50 rounded-2xl">
              <SectionHeader
                icon={Cake}
                title="تولدهای پیش‌رو (۷ روز آینده)"
                badge={
                  <Badge variant="outline" className="text-[10px] border-[#D4AF37]/30 text-[#D4AF37]">
                    {toPersianDigits(String(birthdays.length))} نفر
                  </Badge>
                }
                action={
                  birthdays.filter((b) => !b.sent).length > 0 ? (
                    <Button
                      className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#1a1a00] font-bold text-[10px] h-7"
                      onClick={handleSendAllBirthdays}
                    >
                      <Send className="size-3 ml-1" />
                      ارسال همه
                    </Button>
                  ) : undefined
                }
              />
              <CardContent className="px-4 pb-4">
                {birthdaysLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                  </div>
                ) : birthdays.length === 0 ? (
                  <EmptyState
                    icon={Cake}
                    title="تولدی در ۷ روز آینده نیست"
                    description="زمانی که تولد کاربران نزدیک شود، اینجا نمایش داده می‌شود"
                  />
                ) : (
                  <div className="space-y-2">
                    {birthdays.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="size-9 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                            <span className="text-lg">🎂</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{b.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate" dir="ltr">
                              {b.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-[10px] border-blue-500/20 text-blue-400 bg-blue-500/10">
                            {b.birthDate}
                          </Badge>
                          {b.sent ? (
                            <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle className="size-3 ml-1" />
                              ارسال شد
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[10px] h-7 border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                              disabled={birthdaySending === b.id}
                              onClick={() => handleSendBirthday(b)}
                            >
                              {birthdaySending === b.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Send className="size-3 ml-1" />
                              )}
                              ارسال
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/*  TAB 6: SEND LOGS                                               */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="logs" className="mt-6 space-y-4">
            {/* Filters */}
            <Card className="bg-[#14141e]/80 border-border/50 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={logFilters.type} onValueChange={(v) => setLogFilters((p) => ({ ...p, type: v }))}>
                    <SelectTrigger className="w-[130px] h-8 text-xs bg-background/50">
                      <SelectValue placeholder="نوع" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOG_TYPE_FILTERS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={logFilters.status} onValueChange={(v) => setLogFilters((p) => ({ ...p, status: v }))}>
                    <SelectTrigger className="w-[130px] h-8 text-xs bg-background/50">
                      <SelectValue placeholder="وضعیت" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOG_STATUS_FILTERS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      value={logFilters.email}
                      onChange={(e) => setLogFilters((p) => ({ ...p, email: e.target.value }))}
                      placeholder="جستجوی ایمیل..."
                      className="bg-background/50 border-border/50 text-xs h-8 pr-9"
                      dir="ltr"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] text-muted-foreground hover:text-foreground h-8"
                    onClick={() => setLogPage(1)}
                  >
                    <RefreshCw className="size-3 ml-1" />
                    بروزرسانی
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[10px] border-border/50 h-8"
                    onClick={handleExportLogs}
                  >
                    <Download className="size-3 ml-1" />
                    خروجی CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Logs Table */}
            <Card className="bg-[#14141e]/80 border-border/50 rounded-2xl">
              <CardContent className="p-0">
                {logsLoading ? (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : logs.length === 0 ? (
                  <EmptyState
                    icon={Inbox}
                    title="لاگی یافت نشد"
                    description="با تغییر فیلترها جستجوی خود را ویرایش کنید"
                  />
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/30 hover:bg-transparent">
                          <TableHead className="text-[10px] font-semibold text-muted-foreground h-9">تاریخ</TableHead>
                          <TableHead className="text-[10px] font-semibold text-muted-foreground h-9">ایمیل</TableHead>
                          <TableHead className="text-[10px] font-semibold text-muted-foreground h-9">موضوع</TableHead>
                          <TableHead className="text-[10px] font-semibold text-muted-foreground h-9">نوع</TableHead>
                          <TableHead className="text-[10px] font-semibold text-muted-foreground h-9">وضعیت</TableHead>
                          <TableHead className="text-[10px] font-semibold text-muted-foreground h-9 text-center">باز</TableHead>
                          <TableHead className="text-[10px] font-semibold text-muted-foreground h-9 text-center">کلیک</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id} className="border-border/20 hover:bg-background/50">
                            <TableCell className="text-[11px] py-2.5 text-muted-foreground whitespace-nowrap">
                              {formatDateTime(log.date)}
                            </TableCell>
                            <TableCell className="text-[11px] py-2.5 font-mono" dir="ltr">
                              {truncate(log.email, 25)}
                            </TableCell>
                            <TableCell className="text-[11px] py-2.5 truncate max-w-[150px]">
                              {truncate(log.subject, 25)}
                            </TableCell>
                            <TableCell className="text-[11px] py-2.5">
                              <Badge variant="outline" className="text-[9px] border-blue-500/20 text-blue-400 bg-blue-500/10">
                                {CAMPAIGN_TYPES[log.type] || log.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-[11px] py-2.5">
                              <StatusBadge status={log.status} />
                            </TableCell>
                            <TableCell className="text-[11px] py-2.5 text-center">
                              {log.isOpened ? (
                                <CheckCircle className="size-3.5 text-blue-400 inline" />
                              ) : (
                                <span className="text-muted-foreground text-[10px]">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-[11px] py-2.5 text-center">
                              {log.isClicked ? (
                                <MousePointerClick className="size-3.5 text-purple-400 inline" />
                              ) : (
                                <span className="text-muted-foreground text-[10px]">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {logTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-border/50"
                  disabled={logPage <= 1}
                  onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronRight className="size-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {toPersianDigits(String(logPage))} از {toPersianDigits(String(logTotalPages))}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-border/50"
                  disabled={logPage >= logTotalPages}
                  onClick={() => setLogPage((p) => Math.min(logTotalPages, p + 1))}
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/*  TAB 7: BLACKLIST                                               */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="blacklist" className="mt-6 space-y-4">
            {/* Add Form */}
            <Card className="bg-[#14141e]/80 border-border/50 rounded-2xl">
              <SectionHeader icon={ShieldAlert} title="افزودن به لیست سیاه" />
              <CardContent className="px-4 pb-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      value={blacklistEmail}
                      onChange={(e) => setBlacklistEmail(e.target.value)}
                      placeholder="آدرس ایمیل..."
                      className="bg-background/50 border-border/50 text-sm h-9"
                      dir="ltr"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      value={blacklistReason}
                      onChange={(e) => setBlacklistReason(e.target.value)}
                      placeholder="دلیل (اختیاری)..."
                      className="bg-background/50 border-border/50 text-sm h-9"
                    />
                  </div>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 whitespace-nowrap"
                    onClick={handleAddBlacklist}
                    disabled={blacklistAdding || !blacklistEmail.trim()}
                  >
                    {blacklistAdding ? (
                      <Loader2 className="size-3.5 ml-1 animate-spin" />
                    ) : (
                      <ShieldAlert className="size-3.5 ml-1" />
                    )}
                    افزودن
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Blacklist List */}
            <Card className="bg-[#14141e]/80 border-border/50 rounded-2xl">
              <SectionHeader
                icon={Ban}
                title="لیست سیاه"
                badge={
                  <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">
                    {toPersianDigits(String(blacklist.length))} آدرس
                  </Badge>
                }
              />
              <CardContent className="px-4 pb-4">
                {blacklistLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : blacklist.length === 0 ? (
                  <EmptyState
                    icon={ShieldCheck}
                    title="لیست سیاه خالی است"
                    description="هیچ آدرس ایمیل مسدودی وجود ندارد"
                  />
                ) : (
                  <div className="space-y-2">
                    {blacklist.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/80 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold font-mono truncate" dir="ltr">
                            {entry.email}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {entry.reason} • {entry.addedAt}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[10px] text-emerald-400 hover:bg-emerald-500/10 h-7 shrink-0"
                          onClick={() => handleRemoveBlacklist(entry.email)}
                        >
                          <ShieldCheck className="size-3 ml-1" />
                          حذف
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/*  TAB 8: SMTP CONFIG                                             */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="smtp" className="mt-6 space-y-4">
            {/* Connection Status */}
            <Card className="bg-[#14141e]/80 border-border/50 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server className="size-5 text-[#D4AF37]" />
                    <div>
                      <p className="text-xs font-bold">وضعیت اتصال SMTP</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {connectionStatus === 'connected' && (
                          <>
                            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-emerald-400">متصل</span>
                          </>
                        )}
                        {connectionStatus === 'failed' && (
                          <>
                            <div className="size-2 rounded-full bg-red-500" />
                            <span className="text-[10px] text-red-400">خطا در اتصال</span>
                          </>
                        )}
                        {connectionStatus === 'testing' && (
                          <>
                            <Loader2 className="size-2 animate-spin text-amber-400" />
                            <span className="text-[10px] text-amber-400">در حال تست...</span>
                          </>
                        )}
                        {connectionStatus === 'idle' && (
                          <>
                            <div className="size-2 rounded-full bg-gray-500" />
                            <span className="text-[10px] text-muted-foreground">آماده</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={smtpTestEmail}
                      onChange={(e) => setSmtpTestEmail(e.target.value)}
                      placeholder="ایمیل گیرنده برای تست..."
                      className="bg-background/50 border-border/50 text-xs h-8 w-[200px]"
                      dir="ltr"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[10px] border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 h-8 whitespace-nowrap"
                      onClick={handleTestSmtp}
                      disabled={smtpTesting || !smtpTestEmail.trim()}
                    >
                      {smtpTesting ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Send className="size-3 ml-1" />
                      )}
                      تست ارسال
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SMTP Settings */}
            <Card className="bg-[#14141e]/80 border-border/50 rounded-2xl">
              <SectionHeader icon={Key} title="تنظیمات SMTP" description="اطلاعات سرور ایمیل خود را وارد کنید" />
              <CardContent className="px-4 pb-4 space-y-4">
                {smtpLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Provider */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">ارائه‌دهنده</Label>
                      <Select
                        value={smtpConfig.provider}
                        onValueChange={(v) => setSmtpConfig((p) => ({ ...p, provider: v }))}
                      >
                        <SelectTrigger className="bg-background/50 border-border/50 text-xs h-9 w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">سفارشی (SMTP)</SelectItem>
                          <SelectItem value="gmail">Gmail</SelectItem>
                          <SelectItem value="outlook">Outlook / Office 365</SelectItem>
                          <SelectItem value="yahoo">Yahoo</SelectItem>
                          <SelectItem value="sendgrid">SendGrid</SelectItem>
                          <SelectItem value="mailgun">Mailgun</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Host & Port */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs">سرور (Host) *</Label>
                        <Input
                          value={smtpConfig.host}
                          onChange={(e) => setSmtpConfig((p) => ({ ...p, host: e.target.value }))}
                          placeholder="smtp.example.com"
                          className="bg-background/50 border-border/50 text-sm h-9 font-mono"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">پورت</Label>
                        <Input
                          type="number"
                          value={smtpConfig.port}
                          onChange={(e) => setSmtpConfig((p) => ({ ...p, port: parseInt(e.target.value) || 587 }))}
                          className="bg-background/50 border-border/50 text-sm h-9 font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* SSL Toggle */}
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">استفاده از SSL/TLS</Label>
                      <Switch
                        checked={smtpConfig.ssl}
                        onCheckedChange={(v) => setSmtpConfig((p) => ({ ...p, ssl: v }))}
                      />
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Credentials */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">نام کاربری *</Label>
                      <Input
                        value={smtpConfig.username}
                        onChange={(e) => setSmtpConfig((p) => ({ ...p, username: e.target.value }))}
                        placeholder="user@example.com"
                        className="bg-background/50 border-border/50 text-sm h-9 font-mono"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">رمز عبور</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={smtpConfig.password}
                          onChange={(e) => setSmtpConfig((p) => ({ ...p, password: e.target.value }))}
                          placeholder="••••••••"
                          className="bg-background/50 border-border/50 text-sm h-9 font-mono pl-10"
                          dir="ltr"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute left-1 top-1/2 -translate-y-1/2 size-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Sender Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">نام فرستنده</Label>
                        <Input
                          value={smtpConfig.senderName}
                          onChange={(e) => setSmtpConfig((p) => ({ ...p, senderName: e.target.value }))}
                          placeholder="زرین گلد"
                          className="bg-background/50 border-border/50 text-sm h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">ایمیل فرستنده *</Label>
                        <Input
                          value={smtpConfig.senderEmail}
                          onChange={(e) => setSmtpConfig((p) => ({ ...p, senderEmail: e.target.value }))}
                          placeholder="noreply@zarringold.ir"
                          className="bg-background/50 border-border/50 text-sm h-9 font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">پاسخ به (Reply-To)</Label>
                      <Input
                        value={smtpConfig.replyTo}
                        onChange={(e) => setSmtpConfig((p) => ({ ...p, replyTo: e.target.value }))}
                        placeholder="support@zarringold.ir"
                        className="bg-background/50 border-border/50 text-sm h-9 font-mono"
                        dir="ltr"
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#1a1a00] font-bold text-xs"
                        onClick={handleSaveSmtp}
                        disabled={smtpSaving}
                      >
                        {smtpSaving ? (
                          <Loader2 className="size-3.5 ml-1 animate-spin" />
                        ) : (
                          <ShieldCheck className="size-3.5 ml-1" />
                        )}
                        ذخیره تنظیمات
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  PREVIEW DIALOG                                                    */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="bg-[#14141e] border-border/50 max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="gold-gradient-text text-base">پیش‌نمایش ایمیل</DialogTitle>
              <DialogDescription className="text-xs">
                این پیش‌نمایش دقیقاً شبیه به آنچه گیرنده مشاهده می‌کند نیست
              </DialogDescription>
            </DialogHeader>
            <div
              className="mt-2 p-4 rounded-xl bg-white text-black text-xs leading-relaxed min-h-[200px] overflow-y-auto"
              dir="rtl"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
            <DialogFooter>
              <Button
                variant="outline"
                className="border-border/50 text-xs"
                onClick={() => setPreviewOpen(false)}
              >
                بستن
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

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
import { Textarea } from '@/components/ui/textarea';
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
  MessageSquare,
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
  Phone,
  Search,
  FileText,
  Gift,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Coins,
  Bell,
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
  type LucideIcon,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatToman(n: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(n));
}

function toPersianDigits(str: string): string {
  const d = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/\d/g, (c) => d[parseInt(c)]);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface DashboardStats {
  totalSent: number;
  delivered: number;
  failed: number;
  todayCost: number;
  deliveryRate: number;
  failRate: number;
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  segment: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
  recipientCount: number;
  deliveredCount: number;
  failedCount: number;
  message: string;
  scheduledAt?: string;
  createdAt: string;
}

interface SmsLog {
  id: string;
  date: string;
  phone: string;
  type: string;
  status: 'delivered' | 'failed' | 'pending' | 'sent';
  cost: number;
}

interface SmsTemplate {
  id: string;
  name: string;
  slug: string;
  content: string;
  type: string;
  variables: string[];
  active: boolean;
}

interface BirthdayContact {
  id: string;
  name: string;
  phone: string;
  birthDate: string;
  sent?: boolean;
}

interface BlacklistEntry {
  id: string;
  phone: string;
  reason: string;
  addedAt: string;
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
  draft: { label: 'پیش‌نویس', color: 'bg-gray-500/15 text-gray-500 border-gray-500/20' },
  scheduled: { label: 'زمان‌بندی شده', color: 'bg-blue-500/15 text-blue-500 border-blue-500/20' },
  sending: { label: 'در حال ارسال', color: 'bg-amber-500/15 text-amber-500 border-amber-500/20' },
  completed: { label: 'تکمیل شده', color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' },
  cancelled: { label: 'لغو شده', color: 'bg-red-500/15 text-red-500 border-red-500/20' },
  delivered: { label: 'تحویل شده', color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' },
  failed: { label: 'ناموفق', color: 'bg-red-500/15 text-red-500 border-red-500/20' },
  pending: { label: 'در انتظار', color: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/20' },
  sent: { label: 'ارسال شده', color: 'bg-sky-500/15 text-sky-500 border-sky-500/20' },
};

const LOG_TYPE_FILTERS = [
  { value: 'all', label: 'همه' },
  { value: 'otp', label: 'OTP' },
  { value: 'transactional', label: 'تراکنشی' },
  { value: 'marketing', label: 'بازاریابی' },
  { value: 'birthday', label: 'تولد' },
  { value: 'price_alert', label: 'هشدار قیمت' },
  { value: 'security', label: 'امنیتی' },
];

const LOG_STATUS_FILTERS = [
  { value: 'all', label: 'همه' },
  { value: 'sent', label: 'ارسال شده' },
  { value: 'delivered', label: 'تحویل' },
  { value: 'failed', label: 'ناموفق' },
  { value: 'pending', label: 'در انتظار' },
];

const DEFAULT_TEMPLATES: SmsTemplate[] = [
  {
    id: 't1',
    name: 'خوش‌آمدگویی',
    slug: 'welcome',
    content: 'به زرین گلد خوش آمدید {name} عزیز!',
    type: 'marketing',
    variables: ['{name}'],
    active: true,
  },
  {
    id: 't2',
    name: 'تراکنش',
    slug: 'transaction',
    content: 'تراکنش {type} به مبلغ {amount} تومان انجام شد',
    type: 'transactional',
    variables: ['{type}', '{amount}'],
    active: true,
  },
  {
    id: 't3',
    name: 'هشدار قیمت',
    slug: 'price_alert',
    content: 'قیمت طلا {direction}: خرید {buyPrice} / فروش {sellPrice}',
    type: 'price_alert',
    variables: ['{direction}', '{buyPrice}', '{sellPrice}'],
    active: true,
  },
  {
    id: 't4',
    name: 'تولد',
    slug: 'birthday',
    content: 'تولدت مبارک {name}! زرین گلد یه هدیه ویژه برات داره 🎂',
    type: 'birthday',
    variables: ['{name}'],
    active: true,
  },
  {
    id: 't5',
    name: 'امنیتی',
    slug: 'security',
    content: 'ورود جدید به حساب شما. اگر شما نیستید سریعاً اقدام کنید',
    type: 'security',
    variables: [],
    active: true,
  },
  {
    id: 't6',
    name: 'برداشت',
    slug: 'withdrawal',
    content: 'مبلغ {amount} تومان از کیف پول شما برداشت شد',
    type: 'transactional',
    variables: ['{amount}'],
    active: true,
  },
  {
    id: 't7',
    name: 'واریز',
    slug: 'deposit',
    content: 'مبلغ {amount} تومان به کیف پول شما واریز شد',
    type: 'transactional',
    variables: ['{amount}'],
    active: true,
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
      {status === 'delivered' && <CheckCircle className="size-3" />}
      {status === 'failed' && <XCircle className="size-3" />}
      {status === 'pending' && <Clock className="size-3" />}
      {status === 'scheduled' && <CalendarDays className="size-3" />}
      {status === 'completed' && <CheckCircle className="size-3" />}
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

export default function SmsSettings() {
  const { addToast } = useAppStore();

  /* ── Active Tab ── */
  const [activeTab, setActiveTab] = useState('dashboard');

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Dashboard                                                  */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [chartData, setChartData] = useState<{ day: string; count: number }[]>([]);
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Campaigns                                                  */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'marketing',
    segment: 'all',
    message: '',
    scheduledAt: '',
    templateId: '',
  });

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Quick Send                                                 */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [quickPhones, setQuickPhones] = useState('');
  const [quickMessage, setQuickMessage] = useState('');
  const [quickType, setQuickType] = useState('marketing');
  const [quickSending, setQuickSending] = useState(false);
  const [quickConfirmOpen, setQuickConfirmOpen] = useState(false);
  const [recentQuickSends, setRecentQuickSends] = useState<
    { id: string; phones: string[]; message: string; date: string }[]
  >([]);

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Templates                                                  */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [templates, setTemplates] = useState<SmsTemplate[]>(DEFAULT_TEMPLATES);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    slug: '',
    content: '',
    type: 'marketing',
    variables: '',
  });

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Birthday                                                   */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [birthdays, setBirthdays] = useState<BirthdayContact[]>([]);
  const [birthdaysLoading, setBirthdaysLoading] = useState(false);
  const [birthdayMessage, setBirthdayMessage] = useState(
    'تولدت مبارک {name}! زرین گلد یه هدیه ویژه برات داره 🎂'
  );
  const [birthdayStats, setBirthdayStats] = useState({ sentThisMonth: 0, totalSent: 0 });
  const [birthdaySending, setBirthdaySending] = useState<string | null>(null);

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Logs                                                       */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilters, setLogFilters] = useState({
    type: 'all',
    status: 'all',
    dateRange: 'all',
    phone: '',
  });
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  State: Blacklist                                                  */
  /* ═══════════════════════════════════════════════════════════════════ */
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [blacklistLoading, setBlacklistLoading] = useState(false);
  const [blacklistPhone, setBlacklistPhone] = useState('');
  const [blacklistReason, setBlacklistReason] = useState('');
  const [blacklistAdding, setBlacklistAdding] = useState(false);

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  API Fetch Functions                                                 */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/sms/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setChartData(data.chartData || []);
      }
    } catch {
      /* Fallback mock data */
      setStats({
        totalSent: 12450,
        delivered: 11820,
        failed: 630,
        todayCost: 187500,
        deliveryRate: 94.9,
        failRate: 5.1,
      });
      const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
      setChartData(
        days.map((d) => ({ day: d, count: Math.floor(Math.random() * 500) + 200 }))
      );
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try {
      const res = await fetch('/api/sms/campaigns?page=1&limit=20');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || data || []);
      }
    } catch {
      /* Fallback */
      setCampaigns([
        {
          id: 'c1',
          name: 'کمپین تخفیف نوروزی',
          type: 'marketing',
          segment: 'all',
          status: 'completed',
          recipientCount: 1200,
          deliveredCount: 1150,
          failedCount: 50,
          message: 'عید نوروز مبارک! تخفیف ویژه زرین گلد',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'c2',
          name: 'هشدار افزایش قیمت',
          type: 'price_alert',
          segment: 'active',
          status: 'sending',
          recipientCount: 800,
          deliveredCount: 340,
          failedCount: 12,
          message: 'قیمت طلا افزایش یافت',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'c3',
          name: 'پیش‌نویس ترویجی',
          type: 'promotional',
          segment: 'vip',
          status: 'draft',
          recipientCount: 0,
          deliveredCount: 0,
          failedCount: 0,
          message: 'پیشنهاد ویژه VIP',
          createdAt: new Date().toISOString(),
        },
      ]);
      setRecentCampaigns([
        {
          id: 'c1',
          name: 'کمپین تخفیف نوروزی',
          type: 'marketing',
          segment: 'all',
          status: 'completed',
          recipientCount: 1200,
          deliveredCount: 1150,
          failedCount: 50,
          message: 'عید نوروز مبارک!',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await fetch('/api/sms/templates');
      if (res.ok) {
        const data = await res.json();
        if (data.templates && data.templates.length > 0) {
          setTemplates(data.templates);
        }
      }
    } catch {
      /* Keep defaults */
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
      if (logFilters.phone) params.set('phone', logFilters.phone);
      const res = await fetch(`/api/sms/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || data || []);
        setLogTotalPages(data.totalPages || 1);
      }
    } catch {
      /* Fallback */
      const mockLogs: SmsLog[] = Array.from({ length: 12 }, (_, i) => ({
        id: `l${i + 1}`,
        date: new Date(Date.now() - i * 3600000).toISOString(),
        phone: `0912${String(Math.floor(Math.random() * 9000000 + 1000000))}`,
        type: ['otp', 'transactional', 'marketing', 'birthday', 'price_alert', 'security'][i % 6],
        status: (['delivered', 'failed', 'pending', 'sent'] as const)[i % 4],
        cost: Math.floor(Math.random() * 60 + 20),
      }));
      setLogs(mockLogs);
    } finally {
      setLogsLoading(false);
    }
  }, [logPage, logFilters]);

  const fetchBirthdays = useCallback(async () => {
    setBirthdaysLoading(true);
    try {
      const res = await fetch('/api/sms/birthday');
      if (res.ok) {
        const data = await res.json();
        setBirthdays(data.contacts || []);
        setBirthdayStats(data.stats || { sentThisMonth: 0, totalSent: 0 });
      }
    } catch {
      /* Fallback */
      setBirthdays([
        { id: 'b1', name: 'علی محمدی', phone: '09121234567', birthDate: '۱۴۰۳/۰۶/۱۵' },
        { id: 'b2', name: 'سارا احمدی', phone: '09351234567', birthDate: '۱۴۰۳/۰۶/۱۶' },
        { id: 'b3', name: 'رضا کریمی', phone: '09191234567', birthDate: '۱۴۰۳/۰۶/۱۸' },
      ]);
      setBirthdayStats({ sentThisMonth: 12, totalSent: 145 });
    } finally {
      setBirthdaysLoading(false);
    }
  }, []);

  const fetchBlacklist = useCallback(async () => {
    setBlacklistLoading(true);
    try {
      const res = await fetch('/api/sms/blacklist');
      if (res.ok) {
        const data = await res.json();
        setBlacklist(data.blacklist || []);
      }
    } catch {
      /* Fallback */
      setBlacklist([
        { id: 'bl1', phone: '09120000000', reason: 'درخواست کاربر', addedAt: '۱۴۰۳/۰۳/۱۰' },
        { id: 'bl2', phone: '09350000000', reason: 'اسپم', addedAt: '۱۴۰۳/۰۳/۱۲' },
      ]);
    } finally {
      setBlacklistLoading(false);
    }
  }, []);

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  Load data on tab change                                             */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
      fetchCampaigns();
    }
  }, [activeTab, fetchStats, fetchCampaigns]);

  useEffect(() => {
    if (activeTab === 'campaigns') fetchCampaigns();
  }, [activeTab, fetchCampaigns]);

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

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  Action Handlers                                                     */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  /* ── Campaign Actions ── */
  const handleCreateCampaign = async () => {
    if (!campaignForm.name.trim() || !campaignForm.message.trim()) {
      addToast('لطفاً نام و متن کمپین را وارد کنید', 'error');
      return;
    }
    try {
      const res = await fetch('/api/sms/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignForm),
      });
      if (res.ok) {
        addToast('کمپین با موفقیت ایجاد شد', 'success');
        setCampaignDialogOpen(false);
        setCampaignForm({ name: '', type: 'marketing', segment: 'all', message: '', scheduledAt: '', templateId: '' });
        fetchCampaigns();
      } else {
        addToast('خطا در ایجاد کمپین', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
  };

  const handleCampaignAction = async (id: string, action: 'send' | 'cancel' | 'duplicate') => {
    try {
      const res = await fetch(`/api/sms/campaigns/${id}`, {
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
        fetchCampaigns();
      }
    } catch {
      addToast('خطا در انجام عملیات', 'error');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      const res = await fetch(`/api/sms/campaigns/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('کمپین حذف شد', 'success');
        fetchCampaigns();
      }
    } catch {
      addToast('خطا در حذف کمپین', 'error');
    }
  };

  /* ── Quick Send ── */
  const handleQuickSend = async () => {
    if (!quickPhones.trim() || !quickMessage.trim()) {
      addToast('لطفاً شماره و متن پیام را وارد کنید', 'error');
      return;
    }
    setQuickSending(true);
    try {
      const phones = quickPhones
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean);
      const res = await fetch('/api/sms/quick-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phones, message: quickMessage, type: quickType }),
      });
      if (res.ok) {
        addToast(`${toPersianDigits(String(phones.length))} پیامک ارسال شد`, 'success');
        setRecentQuickSends((prev) => [
          {
            id: Date.now().toString(),
            phones,
            message: quickMessage.slice(0, 40),
            date: new Date().toLocaleString('fa-IR'),
          },
          ...prev.slice(0, 4),
        ]);
        setQuickPhones('');
        setQuickMessage('');
        setQuickConfirmOpen(false);
      } else {
        addToast('خطا در ارسال پیامک', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setQuickSending(false);
    }
  };

  /* ── Template Actions ── */
  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.content.trim()) {
      addToast('لطفاً نام و محتوای قالب را وارد کنید', 'error');
      return;
    }
    try {
      const body = {
        ...templateForm,
        variables: templateForm.variables
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
      };
      const url = editingTemplate ? `/api/sms/templates/${editingTemplate.id}` : '/api/sms/templates';
      const method = editingTemplate ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        addToast(editingTemplate ? 'قالب بروزرسانی شد' : 'قالب ایجاد شد', 'success');
        setTemplateDialogOpen(false);
        setEditingTemplate(null);
        setTemplateForm({ name: '', slug: '', content: '', type: 'marketing', variables: '' });
        fetchTemplates();
      }
    } catch {
      addToast('خطا در ذخیره قالب', 'error');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/sms/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('قالب حذف شد', 'success');
        fetchTemplates();
      }
    } catch {
      addToast('خطا در حذف قالب', 'error');
    }
  };

  const handleToggleTemplate = async (tmpl: SmsTemplate) => {
    try {
      const res = await fetch(`/api/sms/templates/${tmpl.id}`, {
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

  /* ── Birthday Actions ── */
  const handleSendBirthday = async (contact: BirthdayContact) => {
    setBirthdaySending(contact.id);
    try {
      const res = await fetch('/api/sms/birthday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: birthdayMessage }),
      });
      if (res.ok) {
        addToast(`پیام تولد برای ${contact.name} ارسال شد`, 'success');
        setBirthdays((prev) =>
          prev.map((b) => (b.id === contact.id ? { ...b, sent: true } : b))
        );
      }
    } catch {
      addToast('خطا در ارسال پیام تولد', 'error');
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
      const res = await fetch('/api/sms/birthday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: birthdayMessage }),
      });
      if (res.ok) {
        addToast(`${toPersianDigits(String(unsent.length))} پیام تولد ارسال شد`, 'success');
        setBirthdays((prev) => prev.map((b) => ({ ...b, sent: true })));
      }
    } catch {
      addToast('خطا در ارسال پیام‌های تولد', 'error');
    }
  };

  /* ── Blacklist Actions ── */
  const handleAddBlacklist = async () => {
    if (!blacklistPhone.trim()) {
      addToast('شماره تلفن را وارد کنید', 'error');
      return;
    }
    setBlacklistAdding(true);
    try {
      const res = await fetch('/api/sms/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: blacklistPhone, reason: blacklistReason || 'بدون دلیل' }),
      });
      if (res.ok) {
        addToast('شماره به لیست سیاه اضافه شد', 'success');
        setBlacklistPhone('');
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

  const handleRemoveBlacklist = async (phone: string) => {
    try {
      const res = await fetch('/api/sms/blacklist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        addToast('شماره از لیست سیاه حذف شد', 'success');
        fetchBlacklist();
      }
    } catch {
      addToast('خطا در حذف از لیست سیاه', 'error');
    }
  };

  /* ── SMS Count Helper ── */
  const smsCount = Math.ceil((quickMessage.length || 0) / 70) || 0;

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                               */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <div dir="rtl" className="max-w-6xl mx-auto space-y-6">
      {/* ── Page Title ── */}
      <div className="flex items-center gap-3 mb-2">
        <div className="size-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
          <MessageSquare className="size-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold gold-gradient-text">مدیریت پیامک</h1>
          <p className="text-xs text-muted-foreground">پنل مدیریت و ارسال پیامک زرین گلد</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex h-auto bg-card/80 border border-border/50 rounded-2xl p-1 gap-0.5 overflow-x-auto no-scrollbar">
          {[
            { value: 'dashboard', label: 'داشبورد', icon: BarChart3 },
            { value: 'campaigns', label: 'کمپین‌ها', icon: Send },
            { value: 'quick-send', label: 'ارسال سریع', icon: Zap },
            { value: 'templates', label: 'قالب‌ها', icon: FileText },
            { value: 'birthday', label: 'پیامک تولد', icon: Cake },
            { value: 'logs', label: 'لاگ ارسال', icon: Inbox },
            { value: 'blacklist', label: 'لیست سیاه', icon: ShieldAlert },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[11px] sm:text-xs font-medium transition-all data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#1a1a00] data-[state=active]:shadow-md"
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
          {/* ── Stats Cards ── */}
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="bg-card rounded-2xl">
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                icon={Send}
                title="کل ارسال‌ها"
                value={formatToman(stats.totalSent)}
                iconColor="text-[#D4AF37]"
              />
              <StatCard
                icon={CheckCircle}
                title="تحویل موفق"
                value={formatToman(stats.delivered)}
                subtitle={`نرخ تحویل: ${toPersianDigits(stats.deliveryRate.toFixed(1))}%`}
                iconColor="text-emerald-500"
              />
              <StatCard
                icon={XCircle}
                title="ناموفق"
                value={formatToman(stats.failed)}
                subtitle={`نرخ خطا: ${toPersianDigits(stats.failRate.toFixed(1))}%`}
                iconColor="text-red-500"
              />
              <StatCard
                icon={Coins}
                title="هزینه امروز"
                value={`${formatToman(stats.todayCost)} تومان`}
                iconColor="text-[#D4AF37]"
              />
            </div>
          ) : null}

          {/* ── Quick Actions ── */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              onClick={() => setActiveTab('quick-send')}
              className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#1a1a00] font-bold rounded-xl h-10"
            >
              <Zap className="size-4 ml-2" />
              ارسال سریع
            </Button>
            <Button
              onClick={() => {
                setCampaignDialogOpen(true);
                setActiveTab('campaigns');
              }}
              variant="outline"
              className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-xl h-10"
            >
              <Plus className="size-4 ml-2" />
              کمپین جدید
            </Button>
            <Button
              onClick={() => setActiveTab('birthday')}
              variant="outline"
              className="border-pink-500/30 text-pink-500 hover:bg-pink-500/10 rounded-xl h-10"
            >
              <Cake className="size-4 ml-2" />
              پیام تولد
            </Button>
            <Button
              onClick={fetchStats}
              variant="ghost"
              className="rounded-xl h-10 text-muted-foreground"
            >
              <RefreshCw className="size-4 ml-2" />
              بروزرسانی
            </Button>
          </div>

          {/* ── Activity Chart ── */}
          <Card className="card-gold-border bg-card rounded-2xl overflow-hidden">
            <SectionHeader
              icon={TrendingUp}
              title="نمودار فعالیت ۷ روز اخیر"
              description="تعداد پیامک‌های ارسالی هر روز"
            />
            <CardContent className="pt-0 pb-4">
              {statsLoading ? (
                <Skeleton className="h-48 w-full rounded-lg" />
              ) : (
                <div className="flex items-end gap-1 sm:gap-2 h-48 px-2">
                  {chartData.map((d, i) => {
                    const maxCount = Math.max(...chartData.map((c) => c.count), 1);
                    const heightPct = (d.count / maxCount) * 100;
                    return (
                      <TooltipProvider key={i}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
                              <span className="text-[10px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                                {toPersianDigits(String(d.count))}
                              </span>
                              <div
                                className="w-full rounded-t-lg bg-gradient-to-t from-[#B8960C] via-[#D4AF37] to-[#F0D060] min-h-[4px] transition-all duration-500 group-hover:shadow-[0_0_16px_oklch(0.75_0.15_85/30%)]"
                                style={{ height: `${heightPct}%` }}
                              />
                              <span className="text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap">
                                {d.day}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{toPersianDigits(String(d.count))} پیامک</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Recent Activity ── */}
          <Card className="card-gold-border bg-card rounded-2xl overflow-hidden">
            <SectionHeader
              icon={Clock}
              title="فعالیت‌های اخیر"
              description="آخرین کمپین‌های ارسال شده"
              badge={
                recentCampaigns.length > 0 ? (
                  <Badge variant="outline" className="text-[10px] border-[#D4AF37]/20 text-[#D4AF37]">
                    {toPersianDigits(String(recentCampaigns.length))} کمپین
                  </Badge>
                ) : undefined
              }
            />
            <CardContent className="pt-0">
              {campaignsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : campaigns.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="هنوز کمپینی ایجاد نشده"
                  description="اولین کمپین پیامکی خود را بسازید"
                  action={
                    <Button
                      size="sm"
                      className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#1a1a00] font-bold rounded-xl"
                      onClick={() => {
                        setCampaignDialogOpen(true);
                        setActiveTab('campaigns');
                      }}
                    >
                      <Plus className="size-3.5 ml-1.5" />
                      ایجاد کمپین
                    </Button>
                  }
                />
              ) : (
                <ScrollArea className="max-h-72">
                  <div className="space-y-2">
                    {campaigns.slice(0, 5).map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 hover:border-[#D4AF37]/20 transition-all cursor-pointer group"
                        onClick={() => setActiveTab('campaigns')}
                      >
                        <div className="size-9 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                          <Send className="size-4 text-[#D4AF37]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {CAMPAIGN_TYPES[c.type] || c.type} · {toPersianDigits(String(c.recipientCount))} گیرنده
                          </p>
                        </div>
                        <StatusBadge status={c.status} animate={c.status === 'sending'} />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 2: CAMPAIGNS                                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="campaigns" className="mt-6 space-y-4">
          {/* ── Header with Create Button ── */}
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold">کمپین‌های پیامکی</h2>
            <Button
              onClick={() => setCampaignDialogOpen(true)}
              className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#1a1a00] font-bold rounded-xl h-9 text-xs"
            >
              <Plus className="size-3.5 ml-1.5" />
              کمپین جدید
            </Button>
          </div>

          {/* ── Campaign List ── */}
          {campaignsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full rounded-2xl" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <Card className="card-gold-border bg-card rounded-2xl">
              <EmptyState
                icon={Send}
                title="کمپینی یافت نشد"
                description="با ایجاد کمپین جدید شروع کنید"
                action={
                  <Button
                    size="sm"
                    className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#1a1a00] font-bold rounded-xl"
                    onClick={() => setCampaignDialogOpen(true)}
                  >
                    <Plus className="size-3.5 ml-1.5" />
                    ایجاد کمپین
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => {
                const deliveryRate =
                  c.recipientCount > 0 ? (c.deliveredCount / c.recipientCount) * 100 : 0;
                return (
                  <Card
                    key={c.id}
                    className="card-gold-border bg-card rounded-2xl overflow-hidden hover:scale-[1.005] transition-all duration-200"
                  >
                    <CardContent className="p-4 sm:p-5">
                      {/* Top Row */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-sm font-bold truncate">{c.name}</h3>
                            <StatusBadge status={c.status} animate={c.status === 'sending'} />
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-[#D4AF37]/5 border-[#D4AF37]/15 text-[#D4AF37]"
                            >
                              {CAMPAIGN_TYPES[c.type] || c.type}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {CAMPAIGN_SEGMENTS[c.segment] || c.segment}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Users className="size-3" />
                          گیرنده: {toPersianDigits(String(c.recipientCount))}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-500">
                          <CheckCircle className="size-3" />
                          تحویل: {toPersianDigits(String(c.deliveredCount))}
                        </span>
                        <span className="flex items-center gap-1 text-red-500">
                          <XCircle className="size-3" />
                          ناموفق: {toPersianDigits(String(c.failedCount))}
                        </span>
                      </div>

                      {/* Progress */}
                      {c.recipientCount > 0 && (
                        <div className="mb-3">
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>پیشرفت ارسال</span>
                            <span>{toPersianDigits(deliveryRate.toFixed(1))}%</span>
                          </div>
                          <Progress value={deliveryRate} className="h-1.5" />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-border/30">
                        {(c.status === 'draft' || c.status === 'scheduled') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 px-2"
                            onClick={() => handleCampaignAction(c.id, 'send')}
                          >
                            <Play className="size-3 ml-1" />
                            ارسال
                          </Button>
                        )}
                        {c.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] text-red-500 hover:text-red-400 hover:bg-red-500/10 px-2"
                            onClick={() => handleCampaignAction(c.id, 'cancel')}
                          >
                            <Ban className="size-3 ml-1" />
                            لغو
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px] text-[#D4AF37] hover:bg-[#D4AF37]/10 px-2"
                          onClick={() => handleCampaignAction(c.id, 'duplicate')}
                        >
                          <Copy className="size-3 ml-1" />
                          کپی
                        </Button>
                        {(c.status === 'draft' || c.status === 'cancelled') && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-[10px] text-red-500 hover:text-red-400 hover:bg-red-500/10 px-2"
                              >
                                <Trash2 className="size-3 ml-1" />
                                حذف
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف کمپین</AlertDialogTitle>
                                <AlertDialogDescription>
                                  آیا از حذف کمپین &laquo;{c.name}&raquo; اطمینان دارید؟ این عمل قابل بازگشت نیست.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCampaign(c.id)}
                                  className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ── Create Campaign Dialog ── */}
          <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
            <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="size-4 text-[#D4AF37]" />
                  ایجاد کمپین جدید
                </DialogTitle>
                <DialogDescription>کمپین پیامکی خود را تنظیم و ارسال کنید</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">نام کمپین</Label>
                  <Input
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    placeholder="مثلاً: تخفیف نوروزی"
                    className="input-gold-focus rounded-xl"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">نوع کمپین</Label>
                  <Select
                    value={campaignForm.type}
                    onValueChange={(v) => setCampaignForm({ ...campaignForm, type: v })}
                  >
                    <SelectTrigger className="select-gold rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CAMPAIGN_TYPES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Segment */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">بخش ارسال</Label>
                  <Select
                    value={campaignForm.segment}
                    onValueChange={(v) => setCampaignForm({ ...campaignForm, segment: v })}
                  >
                    <SelectTrigger className="select-gold rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CAMPAIGN_SEGMENTS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Template Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">قالب پیام (اختیاری)</Label>
                  <Select
                    value={campaignForm.templateId}
                    onValueChange={(v) => {
                      const t = templates.find((t) => t.id === v);
                      if (t) {
                        setCampaignForm({ ...campaignForm, templateId: v, message: t.content });
                      }
                    }}
                  >
                    <SelectTrigger className="select-gold rounded-xl">
                      <SelectValue placeholder="انتخاب قالب..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates
                        .filter((t) => t.active)
                        .map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">متن پیام</Label>
                  <Textarea
                    value={campaignForm.message}
                    onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })}
                    placeholder="متن پیامک خود را بنویسید..."
                    rows={4}
                    className="input-gold-focus rounded-xl resize-none"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {['{name}', '{phone}', '{amount}', '{date}', '{app_name}'].map((v) => (
                      <Badge
                        key={v}
                        variant="outline"
                        className="text-[10px] font-mono bg-[#D4AF37]/5 border-[#D4AF37]/20 text-[#D4AF37] cursor-pointer hover:bg-[#D4AF37]/10 transition-colors"
                        onClick={() =>
                          setCampaignForm({
                            ...campaignForm,
                            message: campaignForm.message + v,
                          })
                        }
                      >
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Schedule */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">زمان‌بندی ارسال (اختیاری)</Label>
                  <Input
                    type="datetime-local"
                    value={campaignForm.scheduledAt}
                    onChange={(e) =>
                      setCampaignForm({ ...campaignForm, scheduledAt: e.target.value })
                    }
                    className="input-gold-focus rounded-xl"
                    dir="ltr"
                  />
                </div>

                {/* Preview */}
                {campaignForm.message && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">پیش‌نمایش پیام</Label>
                    <div className="p-3 rounded-xl bg-muted/50 border border-border/30 text-xs leading-relaxed">
                      {campaignForm.message || '—'}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setCampaignDialogOpen(false)}
                >
                  انصراف
                </Button>
                <Button
                  onClick={handleCreateCampaign}
                  className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#1a1a00] font-bold rounded-xl"
                >
                  <Send className="size-4 ml-2" />
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
          <Card className="card-gold-border bg-card rounded-2xl overflow-hidden">
            <SectionHeader icon={Zap} title="ارسال سریع پیامک" description="ارسال پیامک به شماره‌های دلخواه" />
            <CardContent className="pt-0 space-y-4">
              {/* Phone Numbers */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">شماره‌های گیرنده (هر خط یک شماره)</Label>
                <Textarea
                  value={quickPhones}
                  onChange={(e) => setQuickPhones(e.target.value)}
                  placeholder={'09121234567\n09351234567\n09191234567'}
                  rows={4}
                  className="input-gold-focus rounded-xl resize-none font-mono text-sm"
                  dir="ltr"
                />
                <p className="text-[10px] text-muted-foreground">
                  {quickPhones
                    ? toPersianDigits(
                        String(
                          quickPhones.split('\n').filter((p) => p.trim().length > 0).length
                        )
                      )
                    : '۰'}{' '}
                  شماره وارد شده
                </p>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">متن پیام</Label>
                <Textarea
                  value={quickMessage}
                  onChange={(e) => setQuickMessage(e.target.value)}
                  placeholder="متن پیامک خود را بنویسید..."
                  rows={4}
                  className="input-gold-focus rounded-xl resize-none"
                  maxLength={700}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>
                    {toPersianDigits(String(quickMessage.length))} / ۷۰۰ کاراکتر
                  </span>
                  <span className={smsCount > 1 ? 'text-amber-500' : ''}>
                    {toPersianDigits(String(smsCount))} پیامک
                    {smsCount > 1 && ` (${toPersianDigits(String(smsCount * 70))} کاراکتر)`}
                  </span>
                </div>
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">نوع پیام</Label>
                <Select value={quickType} onValueChange={setQuickType}>
                  <SelectTrigger className="select-gold rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CAMPAIGN_TYPES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Send Button */}
              <AlertDialog open={quickConfirmOpen} onOpenChange={setQuickConfirmOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full bg-[#D4AF37] hover:bg-[#c4a030] text-[#1a1a00] font-bold rounded-xl h-11"
                    disabled={!quickPhones.trim() || !quickMessage.trim()}
                  >
                    <Send className="size-4 ml-2" />
                    ارسال پیامک
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>تأیید ارسال</AlertDialogTitle>
                    <AlertDialogDescription>
                      آیا از ارسال{' '}
                      {toPersianDigits(
                        String(quickPhones.split('\n').filter((p) => p.trim()).length)
                      )}{' '}
                      پیامک ({toPersianDigits(String(smsCount))} SMS) اطمینان دارید؟
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleQuickSend}
                      className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#1a1a00] font-bold rounded-xl"
                    >
                      {quickSending ? (
                        <Loader2 className="size-4 animate-spin ml-2" />
                      ) : (
                        <Send className="size-4 ml-2" />
                      )}
                      تأیید و ارسال
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Recent Quick Sends */}
          {recentQuickSends.length > 0 && (
            <Card className="card-gold-border bg-card rounded-2xl overflow-hidden">
              <SectionHeader icon={Clock} title="ارسال‌های اخیر" />
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {recentQuickSends.map((qs) => (
                    <div
                      key={qs.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30"
                    >
                      <div className="size-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                        <Send className="size-3.5 text-[#D4AF37]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{qs.message}...</p>
                        <p className="text-[10px] text-muted-foreground">
                          {toPersianDigits(String(qs.phones.length))} گیرنده · {qs.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 4: TEMPLATES                                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="templates" className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold">قالب‌های پیامکی</h2>
              <Badge variant="outline" className="text-[10px] border-[#D4AF37]/20 text-[#D4AF37]">
                {toPersianDigits(String(templates.length))} قالب
              </Badge>
            </div>
            <Button
              onClick={() => {
                setEditingTemplate(null);
                setTemplateForm({ name: '', slug: '', content: '', type: 'marketing', variables: '' });
                setTemplateDialogOpen(true);
              }}
              className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#1a1a00] font-bold rounded-xl h-9 text-xs"
            >
              <Plus className="size-3.5 ml-1.5" />
              قالب جدید
            </Button>
          </div>

          {templatesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <Card className="card-gold-border bg-card rounded-2xl">
              <EmptyState
                icon={FileText}
                title="قالبی یافت نشد"
                description="قالب‌های پیش‌فرض یا قالب‌های جدید خود را بسازید"
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((t) => (
                <Card
                  key={t.id}
                  className={cn(
                    'card-gold-border bg-card rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.005]',
                    !t.active && 'opacity-60'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-bold truncate">{t.name}</h3>
                        <Badge
                          variant="outline"
                          className="text-[10px] mt-1 bg-[#D4AF37]/5 border-[#D4AF37]/15 text-[#D4AF37]"
                        >
                          {CAMPAIGN_TYPES[t.type] || t.type}
                        </Badge>
                      </div>
                      <Switch
                        checked={t.active}
                        onCheckedChange={() => handleToggleTemplate(t)}
                        className="data-[state=checked]:bg-[#D4AF37] shrink-0"
                      />
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                      {t.content}
                    </p>

                    {t.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {t.variables.map((v) => (
                          <Badge
                            key={v}
                            variant="outline"
                            className="text-[9px] font-mono bg-muted/50 border-border/50"
                          >
                            {v}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-1 pt-2 border-t border-border/30">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[10px] text-[#D4AF37] hover:bg-[#D4AF37]/10 px-2"
                        onClick={() => {
                          setEditingTemplate(t);
                          setTemplateForm({
                            name: t.name,
                            slug: t.slug,
                            content: t.content,
                            type: t.type,
                            variables: t.variables.join(', '),
                          });
                          setTemplateDialogOpen(true);
                        }}
                      >
                        <FileText className="size-3 ml-1" />
                        ویرایش
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] text-red-500 hover:text-red-400 hover:bg-red-500/10 px-2"
                          >
                            <Trash2 className="size-3 ml-1" />
                            حذف
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف قالب</AlertDialogTitle>
                            <AlertDialogDescription>
                              آیا از حذف قالب &laquo;{t.name}&raquo; اطمینان دارید؟
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTemplate(t.id)}
                              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
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

          {/* Template Dialog */}
          <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
            <DialogContent className="rounded-2xl max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="size-4 text-[#D4AF37]" />
                  {editingTemplate ? 'ویرایش قالب' : 'قالب جدید'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">نام قالب</Label>
                  <Input
                    value={templateForm.name}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, name: e.target.value, slug: e.target.value.replace(/\s+/g, '_') })
                    }
                    placeholder="نام قالب"
                    className="input-gold-focus rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">نوع قالب</Label>
                  <Select
                    value={templateForm.type}
                    onValueChange={(v) => setTemplateForm({ ...templateForm, type: v })}
                  >
                    <SelectTrigger className="select-gold rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CAMPAIGN_TYPES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">محتوای پیام</Label>
                  <Textarea
                    value={templateForm.content}
                    onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                    placeholder="متن قالب..."
                    rows={4}
                    className="input-gold-focus rounded-xl resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">متغیرها (با کاما جدا کنید)</Label>
                  <Input
                    value={templateForm.variables}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, variables: e.target.value })
                    }
                    placeholder="{name}, {amount}, {date}"
                    className="input-gold-focus rounded-xl font-mono"
                    dir="ltr"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setTemplateDialogOpen(false)}
                >
                  انصراف
                </Button>
                <Button
                  onClick={handleSaveTemplate}
                  className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#1a1a00] font-bold rounded-xl"
                >
                  <SaveTemplateIcon className="size-4 ml-2" />
                  {editingTemplate ? 'بروزرسانی' : 'ذخیره'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 5: BIRTHDAY                                                */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="birthday" className="mt-6 space-y-4">
          {/* Birthday Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="card-gold-border bg-card rounded-2xl">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Gift className="size-4 text-pink-500" />
                  <p className="text-[10px] text-muted-foreground">ارسال شده این ماه</p>
                </div>
                <p className="text-xl font-bold gold-gradient-text tabular-nums">
                  {formatToman(birthdayStats.sentThisMonth)}
                </p>
              </CardContent>
            </Card>
            <Card className="card-gold-border bg-card rounded-2xl">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Cake className="size-4 text-[#D4AF37]" />
                  <p className="text-[10px] text-muted-foreground">کل ارسال‌ها</p>
                </div>
                <p className="text-xl font-bold gold-gradient-text tabular-nums">
                  {formatToman(birthdayStats.totalSent)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Birthday Message Editor */}
          <Card className="card-gold-border bg-card rounded-2xl overflow-hidden">
            <SectionHeader icon={Gift} title="قالب پیام تولد" description="متن پیام تبریک تولد" />
            <CardContent className="pt-0 space-y-3">
              <Textarea
                value={birthdayMessage}
                onChange={(e) => setBirthdayMessage(e.target.value)}
                rows={3}
                className="input-gold-focus rounded-xl resize-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {['{name}', '{phone}', '{app_name}'].map((v) => (
                  <Badge
                    key={v}
                    variant="outline"
                    className="text-[10px] font-mono bg-[#D4AF37]/5 border-[#D4AF37]/20 text-[#D4AF37] cursor-pointer hover:bg-[#D4AF37]/10 transition-colors"
                    onClick={() => setBirthdayMessage(birthdayMessage + v)}
                  >
                    {v}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Birthdays */}
          <Card className="card-gold-border bg-card rounded-2xl overflow-hidden">
            <SectionHeader
              icon={CalendarDays}
              title="تولدهای پیش‌رو"
              description="۷ روز آینده"
              badge={
                birthdays.length > 0 ? (
                  <Badge variant="outline" className="text-[10px] border-pink-500/20 text-pink-500">
                    {toPersianDigits(String(birthdays.length))} نفر
                  </Badge>
                ) : undefined
              }
              action={
                birthdays.some((b) => !b.sent) ? (
                  <Button
                    size="sm"
                    className="bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl h-8 text-[10px]"
                    onClick={handleSendAllBirthdays}
                  >
                    <Gift className="size-3 ml-1" />
                    ارسال به همه
                  </Button>
                ) : undefined
              }
            />
            <CardContent className="pt-0">
              {birthdaysLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : birthdays.length === 0 ? (
                <EmptyState
                  icon={Cake}
                  title="تولدی در ۷ روز آینده نیست"
                  description="هنگامی که تاریخ تولد کاربران نزدیک شود اینجا نمایش داده می‌شود"
                />
              ) : (
                <div className="space-y-2">
                  {birthdays.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30"
                    >
                      <div className="size-9 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0">
                        <Cake className="size-4 text-pink-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold">{b.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">
                          {b.phone}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{b.birthDate}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={b.sent ? 'ghost' : 'default'}
                        className={cn(
                          'rounded-xl h-8 text-[10px]',
                          b.sent
                            ? 'text-emerald-500 cursor-default'
                            : 'bg-[#D4AF37] hover:bg-[#c4a030] text-[#1a1a00] font-bold'
                        )}
                        disabled={b.sent || birthdaySending === b.id}
                        onClick={() => handleSendBirthday(b)}
                      >
                        {birthdaySending === b.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : b.sent ? (
                          <CheckCircle className="size-3" />
                        ) : (
                          <Send className="size-3 ml-1" />
                        )}
                        {b.sent ? 'ارسال شده' : 'ارسال'}
                      </Button>
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
          <Card className="card-gold-border bg-card rounded-2xl overflow-hidden">
            {/* Filters */}
            <CardContent className="p-4 pb-0 space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-[#D4AF37]" />
                <span className="text-xs font-semibold">فیلترها</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Select
                  value={logFilters.type}
                  onValueChange={(v) => setLogFilters({ ...logFilters, type: v })}
                >
                  <SelectTrigger className="select-gold rounded-xl h-9 text-xs">
                    <SelectValue placeholder="نوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOG_TYPE_FILTERS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={logFilters.status}
                  onValueChange={(v) => setLogFilters({ ...logFilters, status: v })}
                >
                  <SelectTrigger className="select-gold rounded-xl h-9 text-xs">
                    <SelectValue placeholder="وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOG_STATUS_FILTERS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={logFilters.dateRange}
                  onValueChange={(v) => setLogFilters({ ...logFilters, dateRange: v })}
                >
                  <SelectTrigger className="select-gold rounded-xl h-9 text-xs">
                    <SelectValue placeholder="بازه زمانی" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="today">امروز</SelectItem>
                    <SelectItem value="week">هفته</SelectItem>
                    <SelectItem value="month">ماه</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    value={logFilters.phone}
                    onChange={(e) => setLogFilters({ ...logFilters, phone: e.target.value })}
                    placeholder="شماره تلفن..."
                    className="input-gold-focus rounded-xl h-9 text-xs pr-8 font-mono"
                    dir="ltr"
                  />
                </div>
              </div>
            </CardContent>

            <Separator className="my-3" />

            {/* Table */}
            <CardContent className="pt-0 px-0 sm:px-6">
              {logsLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="لاگی یافت نشد"
                  description="با تغییر فیلترها نتایج بیشتری پیدا کنید"
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="text-[10px] font-semibold">تاریخ</TableHead>
                        <TableHead className="text-[10px] font-semibold">شماره</TableHead>
                        <TableHead className="text-[10px] font-semibold">نوع</TableHead>
                        <TableHead className="text-[10px] font-semibold">وضعیت</TableHead>
                        <TableHead className="text-[10px] font-semibold">هزینه</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {(() => {
                              try {
                                return new Intl.DateTimeFormat('fa-IR', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }).format(new Date(log.date));
                              } catch {
                                return log.date;
                              }
                            })()}
                          </TableCell>
                          <TableCell
                            className="text-[11px] font-mono whitespace-nowrap"
                            dir="ltr"
                          >
                            {log.phone}
                          </TableCell>
                          <TableCell className="text-[11px] whitespace-nowrap">
                            {CAMPAIGN_TYPES[log.type] || log.type}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <StatusBadge status={log.status} />
                          </TableCell>
                          <TableCell className="text-[11px] tabular-nums whitespace-nowrap">
                            {log.cost > 0 ? `${formatToman(log.cost)} ریال` : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {logTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 pt-4">
                  <span className="text-[10px] text-muted-foreground">
                    صفحه {toPersianDigits(String(logPage))} از {toPersianDigits(String(logTotalPages))}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0 rounded-lg"
                      disabled={logPage <= 1}
                      onClick={() => setLogPage(logPage - 1)}
                    >
                      <ChevronRight className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0 rounded-lg"
                      disabled={logPage >= logTotalPages}
                      onClick={() => setLogPage(logPage + 1)}
                    >
                      <ChevronLeft className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-xl h-9 text-xs"
              onClick={() => addToast('خروجی فایل CSV آماده شد', 'success')}
            >
              <Download className="size-3.5 ml-1.5" />
              دانلود CSV
            </Button>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 7: BLACKLIST                                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="blacklist" className="mt-6 space-y-4">
          {/* Add to Blacklist */}
          <Card className="card-gold-border bg-card rounded-2xl overflow-hidden">
            <SectionHeader icon={ShieldAlert} title="افزودن به لیست سیاه" description="شماره‌های ناخواسته را مسدود کنید" />
            <CardContent className="pt-0 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">شماره تلفن</Label>
                  <Input
                    value={blacklistPhone}
                    onChange={(e) => setBlacklistPhone(e.target.value)}
                    placeholder="09121234567"
                    className="input-gold-focus rounded-xl font-mono"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">دلیل (اختیاری)</Label>
                  <Input
                    value={blacklistReason}
                    onChange={(e) => setBlacklistReason(e.target.value)}
                    placeholder="مثلاً: درخواست کاربر"
                    className="input-gold-focus rounded-xl"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddBlacklist}
                disabled={blacklistAdding || !blacklistPhone.trim()}
                className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl h-10 text-xs"
              >
                {blacklistAdding ? (
                  <Loader2 className="size-4 animate-spin ml-2" />
                ) : (
                  <ShieldAlert className="size-4 ml-2" />
                )}
                افزودن به لیست سیاه
              </Button>
            </CardContent>
          </Card>

          {/* Blacklist */}
          <Card className="card-gold-border bg-card rounded-2xl overflow-hidden">
            <SectionHeader
              icon={Ban}
              title="لیست سیاه"
              badge={
                <Badge variant="outline" className="text-[10px] border-red-500/20 text-red-500">
                  {toPersianDigits(String(blacklist.length))} شماره
                </Badge>
              }
            />
            <CardContent className="pt-0">
              {blacklistLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : blacklist.length === 0 ? (
                <EmptyState
                  icon={ShieldCheck}
                  title="لیست سیاه خالی است"
                  description="شماره‌هایی که بخواهید مسدود کنید اینجا اضافه می‌شوند"
                />
              ) : (
                <div className="space-y-2">
                  {blacklist.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 group"
                    >
                      <div className="size-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                        <Phone className="size-4 text-red-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono font-medium" dir="ltr">
                          {entry.phone}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{entry.reason}</p>
                        <p className="text-[10px] text-muted-foreground">{entry.addedAt}</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] text-red-500 hover:text-red-400 hover:bg-red-500/10 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="size-3 ml-1" />
                            حذف
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف از لیست سیاه</AlertDialogTitle>
                            <AlertDialogDescription>
                              آیا از حذف شماره {entry.phone} از لیست سیاه اطمینان دارید؟
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveBlacklist(entry.phone)}
                              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Small Helper Icon for Template Save ── */
function SaveTemplateIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

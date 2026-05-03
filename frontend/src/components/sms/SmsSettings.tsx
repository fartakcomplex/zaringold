
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {MessageSquare, Send, BarChart3, Users, CheckCircle, XCircle, Clock, Loader2, Plus, Copy, Trash2, Play, Ban, CalendarDays, Phone, Search, FileText, Gift, ShieldAlert, ShieldCheck, TrendingUp, Coins, Bell, Download, Filter, ChevronLeft, ChevronRight, Sparkles, RefreshCw, Inbox, Cake, Eye, Zap, Settings, UserCog, Radio, type LucideIcon} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers & Formatters                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function fmt(n: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(n));
}
function toFa(s: string): string {
  const d = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  return s.replace(/\d/g, c => d[parseInt(c)]);
}
function maskKey(k: string): string {
  if (k.length <= 8) return '••••••••';
  return k.slice(0, 4) + '••••••••' + k.slice(-4);
}
function randPhone(): string {
  const p = ['0912','0919','0935','0936','0937','0938','0930','0921','0922','0933'];
  return p[Math.floor(Math.random()*p.length)] + String(Math.floor(Math.random()*9e6+1e6));
}
function randCost(): number { return Math.floor(Math.random()*60+20); }

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface DashboardStats {
  totalSent: number; delivered: number; failed: number; todayCost: number;
  deliveryRate: number; failRate: number;
}
interface Campaign {
  id: string; name: string; type: string; segment: string;
  status: 'draft'|'scheduled'|'sending'|'completed'|'cancelled';
  recipientCount: number; deliveredCount: number; failedCount: number;
  message: string; scheduledAt?: string; createdAt: string;
}
interface SmsLog {
  id: string; date: string; phone: string; type: string;
  status: 'delivered'|'failed'|'pending'|'sent'; cost: number;
}
interface SmsTemplate {
  id: string; name: string; slug: string; content: string;
  type: string; variables: string[]; active: boolean;
}
interface BirthdayContact { id: string; name: string; phone: string; birthDate: string; sent?: boolean; }
interface BlacklistEntry { id: string; phone: string; reason: string; addedAt: string; }
interface ContactGroup {
  id: string; name: string; nameEn: string; icon: string; count: number;
  description: string; color: string;
}
interface ProviderConfig {
  provider: string; apiKey: string; senderNumber: string; connected: boolean;
  dailyLimit: number; dailyUsed: number;
}
interface TxnNotifType {
  key: string; label: string; enabled: boolean; template: string; minAmount: number;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants & Mock Data                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: 'پیش‌نویس', color: 'bg-gray-500/15 text-gray-500 border-gray-500/20' },
  scheduled: { label: 'زمان‌بندی', color: 'bg-blue-500/15 text-blue-500 border-blue-500/20' },
  sending: { label: 'در حال ارسال', color: 'bg-amber-500/15 text-amber-500 border-amber-500/20' },
  completed: { label: 'تکمیل شده', color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' },
  cancelled: { label: 'لغو شده', color: 'bg-red-500/15 text-red-500 border-red-500/20' },
  delivered: { label: 'تحویل شده', color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' },
  failed: { label: 'ناموفق', color: 'bg-red-500/15 text-red-500 border-red-500/20' },
  pending: { label: 'در انتظار', color: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/20' },
  sent: { label: 'ارسال شده', color: 'bg-sky-500/15 text-sky-500 border-sky-500/20' },
};

const C_TYPES: Record<string, string> = {
  marketing: 'بازاریابی', transactional: 'تراکنشی', birthday: 'تولد',
  price_alert: 'هشدار قیمت', security: 'امنیتی', promotional: 'ترویجی',
};
const C_SEGS: Record<string, string> = {
  all: 'همه کاربران', active: 'کاربران فعال', vip: 'VIP',
  new: 'کاربران جدید', verified: 'احراز شده', gold_holders: 'دارانگان طلای آبشده',
};

const MOCK_CHART = [
  { day: 'شنبه', count: 320 }, { day: 'یکشنبه', count: 480 }, { day: 'دوشنبه', count: 390 },
  { day: 'سه‌شنبه', count: 520 }, { day: 'چهارشنبه', count: 440 }, { day: 'پنجشنبه', count: 610 },
  { day: 'جمعه', count: 280 },
];

const MOCK_CAMPAIGNS: Campaign[] = [
  { id:'c1', name:'تخفیف نوروزی', type:'marketing', segment:'all', status:'completed', recipientCount:1200, deliveredCount:1150, failedCount:50, message:'عید نوروز مبارک! تخفیف ویژه زرین گلد', createdAt:'2024-01-15T10:00:00' },
  { id:'c2', name:'هشدار افزایش قیمت', type:'price_alert', segment:'active', status:'sending', recipientCount:800, deliveredCount:340, failedCount:12, message:'قیمت طلا افزایش یافت', createdAt:'2024-01-18T14:30:00' },
  { id:'c3', name:'ترویجی VIP', type:'promotional', segment:'vip', status:'draft', recipientCount:0, deliveredCount:0, failedCount:0, message:'پیشنهاد ویژه VIP', createdAt:'2024-01-20T09:00:00' },
  { id:'c4', name:'تولد اسفند', type:'birthday', segment:'all', status:'scheduled', recipientCount:450, deliveredCount:0, failedCount:0, message:'تولدت مبارک!', scheduledAt:'2024-02-20T08:00:00', createdAt:'2024-01-22T11:00:00' },
  { id:'c5', name:'امنتی دو مرحله‌ای', type:'security', segment:'verified', status:'completed', recipientCount:3000, deliveredCount:2950, failedCount:50, message:'فعال‌سازی تایید دو مرحله‌ای', createdAt:'2024-01-10T16:00:00' },
  { id:'c6', name:'بازاریابی خرید طلا', type:'marketing', segment:'gold_holders', status:'cancelled', recipientCount:600, deliveredCount:200, failedCount:0, message:'فرصت خرید طلا با تخفیف ویژه', createdAt:'2024-01-25T13:00:00' },
];

const MOCK_TEMPLATES: SmsTemplate[] = [
  { id:'t1', name:'خوش‌آمدگویی', slug:'welcome', content:'به زرین گلد خوش آمدید {name} عزیز!', type:'marketing', variables:['{name}'], active:true },
  { id:'t2', name:'تراکنش عمومی', slug:'transaction', content:'تراکنش {type} به مبلغ {amount} تومان انجام شد', type:'transactional', variables:['{type}','{amount}'], active:true },
  { id:'t3', name:'هشدار قیمت', slug:'price_alert', content:'قیمت طلا {direction}: خرید {buyPrice} / فروش {sellPrice}', type:'price_alert', variables:['{direction}','{buyPrice}','{sellPrice}'], active:true },
  { id:'t4', name:'تولد', slug:'birthday', content:'تولدت مبارک {name}! زرین گلد یه هدیه ویژه برات داره 🎂', type:'birthday', variables:['{name}'], active:true },
  { id:'t5', name:'امنیتی - ورود', slug:'security_login', content:'ورود جدید به حساب شما از {ip}. اگر شما نیستید سریعاً اقدام کنید.', type:'security', variables:['{ip}'], active:true },
  { id:'t6', name:'برداشت', slug:'withdrawal', content:'مبلغ {amount} تومان از کیف پول شما برداشت شد. موجودی: {balance}', type:'transactional', variables:['{amount}','{balance}'], active:true },
  { id:'t7', name:'واریز', slug:'deposit', content:'مبلغ {amount} تومان به کیف پول شما واریز شد. موجودی: {balance}', type:'transactional', variables:['{amount}','{balance}'], active:true },
  { id:'t8', name:'OTP', slug:'otp', content:'کد تایید شما: {code} - زرین گلد', type:'transactional', variables:['{code}'], active:true },
  { id:'t9', name:'خرید طلا', slug:'buy_gold', content:'خرید {grams} گرم طلا با قیمت {price} تومان انجام شد ✅', type:'transactional', variables:['{grams}','{price}'], active:false },
  { id:'t10', name:'فروش طلا', slug:'sell_gold', content:'فروش {grams} گرم طلا با قیمت {price} تومان انجام شد ✅', type:'transactional', variables:['{grams}','{price}'], active:false },
];

const MOCK_BIRTHDAYS: BirthdayContact[] = [
  { id:'b1', name:'علی محمدی', phone:'09121234567', birthDate:'۱۴۰۳/۰۶/۱۵', sent:false },
  { id:'b2', name:'سارا احمدی', phone:'09351234567', birthDate:'۱۴۰۳/۰۶/۱۶', sent:true },
  { id:'b3', name:'رضا کریمی', phone:'09191234567', birthDate:'۱۴۰۳/۰۶/۱۸', sent:false },
  { id:'b4', name:'مریم حسینی', phone:'09361234567', birthDate:'۱۴۰۳/۰۶/۱۹', sent:false },
  { id:'b5', name:'حسین رضایی', phone:'09211234567', birthDate:'۱۴۰۳/۰۶/۲۰', sent:false },
  { id:'b6', name:'زهرا موسوی', phone:'09381234567', birthDate:'۱۴۰۳/۰۶/۲۱', sent:true },
  { id:'b7', name:'امیر نوری', phone:'09301234567', birthDate:'۱۴۰۳/۰۶/۲۲', sent:false },
  { id:'b8', name:'فاطمه عباسی', phone:'09331234567', birthDate:'۱۴۰۳/۰۶/۲۳', sent:false },
];

const MOCK_GROUPS: ContactGroup[] = [
  { id:'g1', name:'VIP', nameEn:'VIP', icon:'Crown', count:128, description:'کاربران ویژه با تراکنش بالای ۱۰۰ میلیون', color:'text-amber-500' },
  { id:'g2', name:'کاربران جدید', nameEn:'New Users', icon:'UserPlus', count:342, description:'ثبت‌نام کمتر از ۳۰ روز پیش', color:'text-emerald-500' },
  { id:'g3', name:'معامله‌گران فعال', nameEn:'Active Traders', icon:'TrendingUp', count:567, description:'حداقل ۵ تراکنش در ماه گذشته', color:'text-sky-500' },
  { id:'g4', name:'احراز شده', nameEn:'KYC Verified', icon:'ShieldCheck', count:890, description:'احراز هویت تکمیل شده', color:'text-purple-500' },
  { id:'g5', name:'دارانگان طلا', nameEn:'Gold Holders', icon:'Coins', count:234, description:'دارایی طلای آبشده بیش از صفر', color:'text-yellow-500' },
];

const MOCK_LOGS: SmsLog[] = Array.from({ length: 30 }, (_, i) => ({
  id: `l${i+1}`,
  date: new Date(Date.now() - i * 1800000).toISOString(),
  phone: randPhone(),
  type: ['otp','transactional','marketing','birthday','price_alert','security'][i%6],
  status: (['delivered','failed','pending','sent'] as const)[i%4],
  cost: randCost(),
}));

const MOCK_BLACKLIST: BlacklistEntry[] = [
  { id:'bl1', phone:'09120000000', reason:'درخواست کاربر', addedAt:'۱۴۰۳/۰۳/۱۰' },
  { id:'bl2', phone:'09350000000', reason:'اسپم و آزار', addedAt:'۱۴۰۳/۰۳/۱۲' },
  { id:'bl3', phone:'09190000000', reason:'شماره تقلبی', addedAt:'۱۴۰۳/۰۴/۰۱' },
];

const MOCK_PROVIDER: ProviderConfig = {
  provider: 'kavenegar', apiKey: '6B7A8C9D4E5F1A2B3C4D5E6F7A8B9C0D',
  senderNumber: '3000505', connected: true, dailyLimit: 5000, dailyUsed: 1247,
};

const MOCK_TXN_TYPES: TxnNotifType[] = [
  { key:'deposit', label:'واریز', enabled:true, template:'مبلغ {amount} تومان به کیف پول شما واریز شد ✅', minAmount:0 },
  { key:'withdrawal', label:'برداشت', enabled:true, template:'مبلغ {amount} تومان از کیف پول شما برداشت شد', minAmount:50000 },
  { key:'buy_gold', label:'خرید طلا', enabled:true, template:'خرید {grams} گرم طلا به مبلغ {amount} تومان ✅', minAmount:100000 },
  { key:'sell_gold', label:'فروش طلا', enabled:true, template:'فروش {grams} گرم طلا به مبلغ {amount} تومان ✅', minAmount:100000 },
  { key:'loan', label:'وام', enabled:false, template:'وام {amount} تومان به حساب شما واریز شد', minAmount:1000000 },
  { key:'repayment', label:'بازپرداخت وام', enabled:false, template:'قسط {amount} تومان از حساب شما کسر شد', minAmount:0 },
];

const TABS = [
  { value:'dashboard', label:'داشبورد', icon:BarChart3 },
  { value:'campaigns', label:'کمپین‌ها', icon:Send },
  { value:'quick-send', label:'ارسال سریع', icon:Zap },
  { value:'templates', label:'قالب‌ها', icon:FileText },
  { value:'birthday', label:'تولد', icon:Cake },
  { value:'txn-notif', label:'اعلان تراکنش', icon:Radio },
  { value:'groups', label:'گروه‌ها', icon:Users },
  { value:'provider', label:'ارسال‌کننده', icon:Settings },
  { value:'logs', label:'لاگ ارسال', icon:Inbox },
  { value:'blacklist', label:'لیست سیاه', icon:ShieldAlert },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub-Components                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StatusBadge({ status, animate }: { status: string; animate?: boolean }) {
  const info = STATUS_MAP[status] || STATUS_MAP.draft;
  return (
    <Badge variant="outline" className={cn('text-[10px] font-medium gap-1 border', info.color, animate && 'animate-pulse')}>
      {status === 'sending' && <Loader2 className="size-3 animate-spin" />}
      {status === 'delivered' && <CheckCircle className="size-3" />}
      {status === 'failed' && <XCircle className="size-3" />}
      {status === 'pending' && <Clock className="size-3" />}
      {status === 'completed' && <CheckCircle className="size-3" />}
      {status === 'scheduled' && <CalendarDays className="size-3" />}
      {info.label}
    </Badge>
  );
}

function StatCard({ icon: Icon, title, value, subtitle, iconColor = 'text-[#D4AF37]' }: {
  icon: LucideIcon; title: string; value: string; subtitle?: string; iconColor?: string;
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

function EmptyState({ icon: Icon, title, description, action }: {
  icon: LucideIcon; title: string; description: string; action?: React.ReactNode;
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

function SectionHeader({ icon: Icon, title, description, badge, action }: {
  icon: LucideIcon; title: string; description?: string; badge?: React.ReactNode; action?: React.ReactNode;
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
        <div className="flex items-center gap-2 shrink-0">{badge}{action}</div>
      </div>
    </CardHeader>
  );
}

function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="bg-card rounded-2xl"><CardContent className="p-4"><Skeleton className="h-20 w-full rounded-lg" /></CardContent></Card>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SmsSettings() {
  const { addToast } = useAppStore();
  const [activeTab, setActiveTab] = useState('dashboard');

  /* ── Dashboard ── */
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [chartData, setChartData] = useState(MOCK_CHART);

  /* ── Campaigns ── */
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ name:'', type:'marketing', segment:'all', message:'', scheduledAt:'' });

  /* ── Quick Send ── */
  const [quickPhones, setQuickPhones] = useState('');
  const [quickMessage, setQuickMessage] = useState('');
  const [quickType, setQuickType] = useState('marketing');
  const [quickSending, setQuickSending] = useState(false);
  const [quickConfirmOpen, setQuickConfirmOpen] = useState(false);

  /* ── Templates ── */
  const [templates, setTemplates] = useState<SmsTemplate[]>(MOCK_TEMPLATES);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({ name:'', slug:'', content:'', type:'marketing', variables:'' });

  /* ── Birthday ── */
  const [birthdays, setBirthdays] = useState<BirthdayContact[]>(MOCK_BIRTHDAYS);
  const [birthdaysLoading, setBirthdaysLoading] = useState(false);
  const [birthdayAutoSend, setBirthdayAutoSend] = useState(true);
  const [birthdayMessage, setBirthdayMessage] = useState('تولدت مبارک {name}! زرین گلد یه هدیه ویژه با کد {gift_code} برات داره 🎂');
  const [birthdayStats, setBirthdayStats] = useState({ sentThisMonth: 12, totalSent: 145 });
  const [birthdaySending, setBirthdaySending] = useState<string | null>(null);

  /* ── Transaction Notifications ── */
  const [txnTypes, setTxnTypes] = useState<TxnNotifType[]>(MOCK_TXN_TYPES);
  const [txnPreviewIdx, setTxnPreviewIdx] = useState(0);

  /* ── Contact Groups ── */
  const [groups] = useState<ContactGroup[]>(MOCK_GROUPS);
  const [groupSendDialog, setGroupSendDialog] = useState<string | null>(null);
  const [groupMessage, setGroupMessage] = useState('');

  /* ── Provider ── */
  const [provider, setProvider] = useState<ProviderConfig>(MOCK_PROVIDER);
  const [providerSaving, setProviderSaving] = useState(false);
  const [testConnLoading, setTestConnLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  /* ── Logs ── */
  const [logs, setLogs] = useState<SmsLog[]>(MOCK_LOGS);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilters, setLogFilters] = useState({ type:'all', status:'all', phone:'' });
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages] = useState(2);

  /* ── Blacklist ── */
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>(MOCK_BLACKLIST);
  const [blacklistLoading, setBlacklistLoading] = useState(false);
  const [blPhone, setBlPhone] = useState('');
  const [blReason, setBlReason] = useState('');
  const [blAdding, setBlAdding] = useState(false);
  const [blSearch, setBlSearch] = useState('');

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  Fetch Functions                                                   */
  /* ═══════════════════════════════════════════════════════════════════ */

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const r = await fetch('/api/sms/stats');
      if (r.ok) { const d = await r.json(); setStats(d); setChartData(d.chartData || MOCK_CHART); return; }
    } catch { /* fallback */ }
    setStats({ totalSent: 12450, delivered: 11820, failed: 630, todayCost: 187500, deliveryRate: 94.9, failRate: 5.1 });
    setChartData(MOCK_CHART);
    setStatsLoading(false);
  }, []);

  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try { const r = await fetch('/api/sms/campaigns'); if (r.ok) { const d = await r.json(); setCampaigns(d.campaigns || d || []); return; } } catch {}
    setCampaigns(MOCK_CAMPAIGNS);
    setCampaignsLoading(false);
  }, []);

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try { const r = await fetch('/api/sms/templates'); if (r.ok) { const d = await r.json(); if (d.templates?.length) setTemplates(d.templates); return; } } catch {}
    setTemplates(MOCK_TEMPLATES);
    setTemplatesLoading(false);
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const p = new URLSearchParams({ page: String(logPage), limit:'15', type: logFilters.type, status: logFilters.status });
      if (logFilters.phone) p.set('phone', logFilters.phone);
      const r = await fetch(`/api/sms/logs?${p}`);
      if (r.ok) { const d = await r.json(); setLogs(d.logs || d || []); return; }
    } catch {}
    setLogs(MOCK_LOGS.slice(0, 15));
    setLogsLoading(false);
  }, [logPage, logFilters]);

  const fetchBirthdays = useCallback(async () => {
    setBirthdaysLoading(true);
    try { const r = await fetch('/api/sms/birthday'); if (r.ok) { const d = await r.json(); setBirthdays(d.contacts || []); setBirthdayStats(d.stats || birthdayStats); return; } } catch {}
    setBirthdays(MOCK_BIRTHDAYS);
    setBirthdaysLoading(false);
  }, [birthdayStats]);

  const fetchBlacklist = useCallback(async () => {
    setBlacklistLoading(true);
    try { const r = await fetch('/api/sms/blacklist'); if (r.ok) { const d = await r.json(); setBlacklist(d.blacklist || []); return; } } catch {}
    setBlacklist(MOCK_BLACKLIST);
    setBlacklistLoading(false);
  }, []);

  const fetchConfig = useCallback(async () => {
    try { const r = await fetch('/api/sms/config'); if (r.ok) { const d = await r.json(); setProvider(d.provider || MOCK_PROVIDER); if (d.txnTypes) setTxnTypes(d.txnTypes); } } catch {}
  }, []);

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  Effects: Load data on tab change                                  */
  /* ═══════════════════════════════════════════════════════════════════ */

  useEffect(() => { if (activeTab === 'dashboard') { fetchStats(); fetchCampaigns(); } }, [activeTab, fetchStats, fetchCampaigns]);
  useEffect(() => { if (activeTab === 'campaigns') fetchCampaigns(); }, [activeTab, fetchCampaigns]);
  useEffect(() => { if (activeTab === 'templates') fetchTemplates(); }, [activeTab, fetchTemplates]);
  useEffect(() => { if (activeTab === 'logs') fetchLogs(); }, [activeTab, fetchLogs]);
  useEffect(() => { if (activeTab === 'birthday') fetchBirthdays(); }, [activeTab, fetchBirthdays]);
  useEffect(() => { if (activeTab === 'blacklist') fetchBlacklist(); }, [activeTab, fetchBlacklist]);
  useEffect(() => { if (activeTab === 'provider') fetchConfig(); }, [activeTab, fetchConfig]);

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  Actions                                                           */
  /* ═══════════════════════════════════════════════════════════════════ */

  const handleCreateCampaign = async () => {
    if (!campaignForm.name.trim() || !campaignForm.message.trim()) { addToast('لطفاً نام و متن کمپین را وارد کنید', 'error'); return; }
    try {
      const r = await fetch('/api/sms/campaigns', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(campaignForm) });
      if (r.ok) { addToast('کمپین ایجاد شد', 'success'); setCampaignDialogOpen(false); setCampaignForm({ name:'', type:'marketing', segment:'all', message:'', scheduledAt:'' }); fetchCampaigns(); }
    } catch { addToast('خطا در ارتباط با سرور', 'error'); }
  };

  const handleCampaignAction = async (id: string, action: 'send'|'cancel'|'duplicate') => {
    const msgs: Record<string, string> = { send:'کمپین ارسال شد', cancel:'کمپین لغو شد', duplicate:'کمپین کپی شد' };
    try {
      const r = await fetch(`/api/sms/campaigns/${id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action }) });
      if (r.ok) { addToast(msgs[action] || 'عملیات موفق', 'success'); fetchCampaigns(); }
    } catch { addToast('خطا در انجام عملیات', 'error'); }
  };

  const handleDeleteCampaign = async (id: string) => {
    try { const r = await fetch(`/api/sms/campaigns/${id}`, { method:'DELETE' }); if (r.ok) { addToast('کمپین حذف شد', 'success'); fetchCampaigns(); } } catch { addToast('خطا', 'error'); }
  };

  const handleQuickSend = async () => {
    if (!quickPhones.trim() || !quickMessage.trim()) { addToast('شماره و متن پیام الزامی است', 'error'); return; }
    setQuickSending(true);
    try {
      const phones = quickPhones.split('\n').map(p => p.trim()).filter(Boolean);
      const r = await fetch('/api/sms/quick-send', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phones, message: quickMessage, type: quickType }) });
      if (r.ok) { addToast(`${toFa(String(phones.length))} پیامک ارسال شد`, 'success'); setQuickPhones(''); setQuickMessage(''); setQuickConfirmOpen(false); }
    } catch { addToast('خطا در ارسال', 'error'); }
    finally { setQuickSending(false); }
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.content.trim()) { addToast('نام و محتوا الزامی است', 'error'); return; }
    const body = { ...templateForm, variables: templateForm.variables.split(',').map(v => v.trim()).filter(Boolean) };
    const url = editingTemplate ? `/api/sms/templates/${editingTemplate.id}` : '/api/sms/templates';
    try {
      const r = await fetch(url, { method: editingTemplate ? 'PUT' : 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (r.ok) { addToast(editingTemplate ? 'قالب بروزرسانی شد' : 'قالب ایجاد شد', 'success'); setTemplateDialogOpen(false); setEditingTemplate(null); setTemplateForm({ name:'', slug:'', content:'', type:'marketing', variables:'' }); fetchTemplates(); }
    } catch { addToast('خطا', 'error'); }
  };

  const handleDeleteTemplate = async (id: string) => {
    try { const r = await fetch(`/api/sms/templates/${id}`, { method:'DELETE' }); if (r.ok) { addToast('قالب حذف شد', 'success'); fetchTemplates(); } } catch {}
  };

  const handleToggleTemplate = (tmpl: SmsTemplate) => {
    setTemplates(prev => prev.map(t => t.id === tmpl.id ? { ...t, active: !t.active } : t));
    addToast(tmpl.active ? 'قالب غیرفعال شد' : 'قالب فعال شد', 'info');
  };

  const handleSendBirthday = async (c: BirthdayContact) => {
    setBirthdaySending(c.id);
    const msg = birthdayMessage.replace('{name}', c.name).replace('{gift_code}', 'BDAY' + Math.floor(Math.random()*9000+1000));
    try {
      const r = await fetch('/api/sms/birthday', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone: c.phone, message: msg }) });
      if (r.ok) { addToast(`پیام تولد برای ${c.name} ارسال شد`, 'success'); setBirthdays(prev => prev.map(b => b.id === c.id ? { ...b, sent: true } : b)); }
    } catch { addToast('خطا در ارسال', 'error'); }
    finally { setBirthdaySending(null); }
  };

  const handleSendAllBirthdays = async () => {
    const unsent = birthdays.filter(b => !b.sent);
    if (!unsent.length) { addToast('همه ارسال شده‌اند', 'info'); return; }
    try {
      const r = await fetch('/api/sms/birthday', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: birthdayMessage, bulk: true }) });
      if (r.ok) { addToast(`${toFa(String(unsent.length))} پیام تولد ارسال شد`, 'success'); setBirthdays(prev => prev.map(b => ({ ...b, sent: true }))); }
    } catch { addToast('خطا', 'error'); }
  };

  const handleToggleTxnType = (idx: number) => {
    setTxnTypes(prev => prev.map((t, i) => i === idx ? { ...t, enabled: !t.enabled } : t));
  };

  const handleUpdateTxnTemplate = (idx: number, template: string) => {
    setTxnTypes(prev => prev.map((t, i) => i === idx ? { ...t, template } : t));
  };

  const handleUpdateTxnMinAmount = (idx: number, minAmount: number) => {
    setTxnTypes(prev => prev.map((t, i) => i === idx ? { ...t, minAmount } : t));
  };

  const handleSendGroupMessage = async (groupId: string) => {
    if (!groupMessage.trim()) { addToast('متن پیام الزامی است', 'error'); return; }
    const g = groups.find(g => g.id === groupId);
    try {
      const r = await fetch('/api/sms/quick-send', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ groupId, message: groupMessage }) });
      if (r.ok) { addToast(`پیام برای گروه ${g?.name} ارسال شد`, 'success'); setGroupSendDialog(null); setGroupMessage(''); }
    } catch { addToast('خطا در ارسال', 'error'); }
  };

  const handleSaveProvider = async () => {
    setProviderSaving(true);
    try {
      const r = await fetch('/api/sms/config', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ provider }) });
      if (r.ok) addToast('تنظیمات ذخیره شد', 'success');
    } catch { addToast('خطا در ذخیره', 'error'); }
    finally { setProviderSaving(false); }
  };

  const handleTestConnection = async () => {
    setTestConnLoading(true);
    try {
      const r = await fetch('/api/sms/config', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'test', provider }) });
      if (r.ok) { setProvider(p => ({ ...p, connected: true })); addToast('اتصال موفق!', 'success'); }
      else { setProvider(p => ({ ...p, connected: false })); addToast('اتصال ناموفق', 'error'); }
    } catch { addToast('خطا در اتصال', 'error'); }
    finally { setTestConnLoading(false); }
  };

  const handleRetryLog = async (id: string) => {
    try { const r = await fetch(`/api/sms/logs/${id}`, { method:'POST', body: JSON.stringify({ action:'retry' }) }); if (r.ok) addToast('در حال تلاش مجدد...', 'info'); } catch {}
  };

  const handleExportLogs = () => {
    const headers = 'شناسه,تاریخ,شماره,نوع,وضعیت,هزینه\n';
    const rows = logs.map(l => `${l.id},${l.date},${l.phone},${l.type},${l.status},${l.cost}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sms-logs.csv'; a.click(); URL.revokeObjectURL(url);
    addToast('فایل CSV دانلود شد', 'success');
  };

  const handleAddBlacklist = async () => {
    if (!blPhone.trim()) { addToast('شماره الزامی است', 'error'); return; }
    setBlAdding(true);
    try {
      const r = await fetch('/api/sms/blacklist', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone: blPhone, reason: blReason || 'بدون دلیل' }) });
      if (r.ok) { addToast('اضافه شد', 'success'); setBlPhone(''); setBlReason(''); fetchBlacklist(); }
    } catch { addToast('خطا', 'error'); }
    finally { setBlAdding(false); }
  };

  const handleRemoveBlacklist = async (id: string) => {
    try {
      const r = await fetch('/api/sms/blacklist', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
      if (r.ok) { addToast('حذف شد', 'success'); fetchBlacklist(); }
    } catch {}
  };

  const smsCount = useMemo(() => Math.ceil((quickMessage.length || 0) / 70) || 0, [quickMessage]);

  const filteredBlacklist = useMemo(() => {
    if (!blSearch) return blacklist;
    return blacklist.filter(e => e.phone.includes(blSearch) || e.reason.includes(blSearch));
  }, [blacklist, blSearch]);

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  SVG Charts                                                        */
  /* ═══════════════════════════════════════════════════════════════════ */

  const barChart = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.count), 1);
    const W = 500, H = 160, barW = 36, gap = (W - chartData.length * barW) / (chartData.length + 1);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40" dir="ltr">
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = H - 24 - (H - 36) * pct;
          return <g key={i}><line x1="30" y1={y} x2={W} y2={y} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="3,3" /><text x="24" y={y + 3} textAnchor="end" fontSize="8" fill="#9ca3af">{toFa(String(Math.round(max * pct)))}</text></g>;
        })}
        {chartData.map((d, i) => {
          const x = gap + i * (barW + gap);
          const h = (d.count / max) * (H - 36);
          const y = H - 24 - h;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={h} rx="4" fill="url(#goldGrad)" opacity="0.85" />
              <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="9" fill="#6b7280">{d.day.slice(0, 2)}</text>
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#D4AF37">{toFa(String(d.count))}</text>
            </g>
          );
        })}
        <defs><linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D4AF37" /><stop offset="100%" stopColor="#B8960F" /></linearGradient></defs>
      </svg>
    );
  }, [chartData]);

  const deliveryRing = useMemo(() => {
    if (!stats) return null;
    const rate = stats.deliveryRate;
    const R = 52, C = 2 * Math.PI * R;
    const offset = C - (rate / 100) * C;
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
          <circle cx="65" cy="65" r={R} fill="none" stroke="#f3f4f6" strokeWidth="10" />
          <circle cx="65" cy="65" r={R} fill="none" stroke="url(#ringGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease' }} />
          <defs><linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#D4AF37" /><stop offset="100%" stopColor="#F5D76E" /></linearGradient></defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold gold-gradient-text">{toFa(rate.toFixed(1))}%</span>
          <span className="text-[10px] text-muted-foreground">تحویل موفق</span>
        </div>
      </div>
    );
  }, [stats]);

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                            */
  /* ═══════════════════════════════════════════════════════════════════ */

  return (
    <TooltipProvider>
    <div dir="rtl" className="max-w-6xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex items-center gap-3 mb-2">
        <div className="size-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
          <MessageSquare className="size-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold gold-gradient-text">مدیریت پیامک</h1>
          <p className="text-xs text-muted-foreground">پنل مدیریت و ارسال پیامک زرین گلد</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex h-auto bg-card/80 border border-border/50 rounded-2xl p-1 gap-0.5 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}
              className="flex-1 min-w-[70px] flex items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl text-[10px] sm:text-xs font-medium transition-all data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#1a1a00] data-[state=active]:shadow-md">
              <tab.icon className="size-3.5 shrink-0" />
              <span className="hidden sm:inline truncate max-w-[70px]">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 1: DASHBOARD                                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="dashboard" className="mt-6 space-y-6">
          {statsLoading ? <SkeletonGrid /> : stats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard icon={Send} title="کل ارسال‌ها" value={fmt(stats.totalSent)} />
              <StatCard icon={CheckCircle} title="تحویل موفق" value={fmt(stats.delivered)} subtitle={`نرخ: ${toFa(stats.deliveryRate.toFixed(1))}%`} iconColor="text-emerald-500" />
              <StatCard icon={XCircle} title="ناموفق" value={fmt(stats.failed)} subtitle={`نرخ خطا: ${toFa(stats.failRate.toFixed(1))}%`} iconColor="text-red-500" />
              <StatCard icon={Coins} title="هزینه امروز" value={`${fmt(stats.todayCost)} ت`} iconColor="text-amber-500" />
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="card-gold-border lg:col-span-2">
              <SectionHeader icon={BarChart3} title="آمار ۷ روز اخیر" />
              <CardContent className="pt-0">{barChart}</CardContent>
            </Card>
            <Card className="card-gold-border">
              <SectionHeader icon={TrendingUp} title="نرخ تحویل" />
              <CardContent className="pt-0 flex items-center justify-center py-4">
                {deliveryRing || <Skeleton className="size-[130px] rounded-full" />}
              </CardContent>
            </Card>
          </div>

          <Card className="card-gold-border">
            <SectionHeader icon={Send} title="کمپین‌های اخیر" badge={<Badge variant="outline" className="text-[10px]">{toFa(String(campaigns.length))} کمپین</Badge>}
              action={<Button size="sm" variant="ghost" className="text-xs" onClick={() => setActiveTab('campaigns')}>مشاهده همه</Button>} />
            <CardContent className="pt-0">
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {campaigns.slice(0, 4).map(c => (
                    <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground">{C_TYPES[c.type]} • {C_SEGS[c.segment]}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={c.status} animate={c.status === 'sending'} />
                        <span className="text-[10px] text-muted-foreground tabular-nums">{fmt(c.recipientCount)} گیرنده</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button variant="outline" className="card-gold-border h-auto py-3 flex-col gap-2 rounded-xl" onClick={() => setActiveTab('quick-send')}>
              <Zap className="size-5 text-[#D4AF37]" /><span className="text-xs font-medium">ارسال سریع</span>
            </Button>
            <Button variant="outline" className="card-gold-border h-auto py-3 flex-col gap-2 rounded-xl" onClick={() => setActiveTab('campaigns')}>
              <Send className="size-5 text-[#D4AF37]" /><span className="text-xs font-medium">ایجاد کمپین</span>
            </Button>
            <Button variant="outline" className="card-gold-border h-auto py-3 flex-col gap-2 rounded-xl" onClick={() => setActiveTab('templates')}>
              <FileText className="size-5 text-[#D4AF37]" /><span className="text-xs font-medium">مدیریت قالب‌ها</span>
            </Button>
            <Button variant="outline" className="card-gold-border h-auto py-3 flex-col gap-2 rounded-xl" onClick={() => setActiveTab('logs')}>
              <Inbox className="size-5 text-[#D4AF37]" /><span className="text-xs font-medium">مشاهده لاگ‌ها</span>
            </Button>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 2: CAMPAIGNS                                              */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="campaigns" className="mt-6 space-y-4">
          <Card className="card-gold-border">
            <SectionHeader icon={Send} title="کمپین‌ها" badge={<Badge variant="outline">{toFa(String(campaigns.length))}</Badge>}
              action={<Button size="sm" className="btn-gold-gradient text-xs" onClick={() => setCampaignDialogOpen(true)}><Plus className="size-3.5 ml-1" />کمپین جدید</Button>} />
            <CardContent className="pt-0">
              {campaignsLoading ? <SkeletonGrid count={3} /> : campaigns.length === 0 ? (
                <EmptyState icon={Send} title="کمپینی یافت نشد" description="اولین کمپین خود را ایجاد کنید"
                  action={<Button size="sm" className="btn-gold-gradient" onClick={() => setCampaignDialogOpen(true)}><Plus className="size-3.5 ml-1" />ایجاد کمپین</Button>} />
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-2">
                    {campaigns.map(c => (
                      <div key={c.id} className="p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold truncate">{c.name}</p>
                              <StatusBadge status={c.status} animate={c.status === 'sending'} />
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{c.message}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span>{C_TYPES[c.type]}</span><span>•</span><span>{C_SEGS[c.segment]}</span>
                            <span>•</span><span>{fmt(c.recipientCount)} گیرنده</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {(c.status === 'draft' || c.status === 'scheduled') && (
                              <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="size-7" onClick={() => handleCampaignAction(c.id, 'send')}><Play className="size-3.5 text-emerald-500" /></Button></TooltipTrigger><TooltipContent>ارسال</TooltipContent></Tooltip>
                            )}
                            {c.status === 'scheduled' && (
                              <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="size-7" onClick={() => handleCampaignAction(c.id, 'cancel')}><Ban className="size-3.5 text-red-500" /></Button></TooltipTrigger><TooltipContent>لغو</TooltipContent></Tooltip>
                            )}
                            <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="size-7" onClick={() => handleCampaignAction(c.id, 'duplicate')}><Copy className="size-3.5" /></Button></TooltipTrigger><TooltipContent>کپی</TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="size-7" onClick={() => handleDeleteCampaign(c.id)}><Trash2 className="size-3.5 text-red-500" /></Button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
                          </div>
                        </div>
                        {c.status === 'sending' || c.status === 'completed' ? (
                          <div className="mt-2">
                            <Progress value={c.recipientCount ? (c.deliveredCount / c.recipientCount) * 100 : 0} className="h-1.5" />
                            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                              <span>تحویل: {fmt(c.deliveredCount)}</span><span>ناموفق: {fmt(c.failedCount)}</span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Create Campaign Dialog */}
          <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader><DialogTitle>ایجاد کمپین جدید</DialogTitle><DialogDescription>اطلاعات کمپین را وارد کنید</DialogDescription></DialogHeader>
              <div className="space-y-4">
                <div><Label className="text-xs">نام کمپین</Label><Input className="input-gold-focus mt-1" value={campaignForm.name} onChange={e => setCampaignForm(p => ({ ...p, name: e.target.value }))} placeholder="مثلاً: تخفیف نوروزی" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">نوع</Label><Select value={campaignForm.type} onValueChange={v => setCampaignForm(p => ({ ...p, type: v }))}><SelectTrigger className="input-gold-focus mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(C_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label className="text-xs">بخش</Label><Select value={campaignForm.segment} onValueChange={v => setCampaignForm(p => ({ ...p, segment: v }))}><SelectTrigger className="input-gold-focus mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(C_SEGS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div><Label className="text-xs">متن پیام</Label><Textarea className="input-gold-focus mt-1" rows={4} value={campaignForm.message} onChange={e => setCampaignForm(p => ({ ...p, message: e.target.value }))} placeholder="متن پیامک..." /></div>
                <div><Label className="text-xs">زمان ارسال (اختیاری)</Label><Input type="datetime-local" className="input-gold-focus mt-1" value={campaignForm.scheduledAt} onChange={e => setCampaignForm(p => ({ ...p, scheduledAt: e.target.value }))} /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setCampaignDialogOpen(false)}>انصراف</Button><Button className="btn-gold-gradient" onClick={handleCreateCampaign}>ایجاد کمپین</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 3: QUICK SEND                                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="quick-send" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="card-gold-border">
              <SectionHeader icon={Zap} title="ارسال سریع پیامک" description="شماره‌ها را هر خط یکی وارد کنید" />
              <CardContent className="pt-0 space-y-4">
                <div><Label className="text-xs">شماره‌ها (هر خط یک شماره)</Label><Textarea className="input-gold-focus mt-1 font-mono text-sm" rows={5} value={quickPhones} onChange={e => setQuickPhones(e.target.value)} placeholder="09121234567&#10;09351234567&#10;..." /></div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>تعداد: {toFa(String(quickPhones.split('\n').filter(p => p.trim()).length))} شماره</span>
                </div>
                <div><Label className="text-xs">نوع پیام</Label><Select value={quickType} onValueChange={setQuickType}><SelectTrigger className="input-gold-focus mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(C_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                <div>
                  <Label className="text-xs">متن پیام</Label>
                  <Textarea className="input-gold-focus mt-1" rows={4} value={quickMessage} onChange={e => setQuickMessage(e.target.value)} placeholder="متن پیامک..." maxLength={1000} />
                  <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
                    <span>{toFa(String(quickMessage.length))} کاراکتر</span>
                    <span>{toFa(String(smsCount))} پیامک ({toFa(String(quickMessage.length * 1.5))} تومان)</span>
                  </div>
                </div>
                <Button className="w-full btn-gold-gradient" disabled={!quickPhones.trim() || !quickMessage.trim()} onClick={() => setQuickConfirmOpen(true)}>
                  {quickSending ? <Loader2 className="size-4 animate-spin ml-2" /> : <Send className="size-4 ml-2" />}
                  ارسال پیامک
                </Button>
              </CardContent>
            </Card>
            <Card className="card-gold-border h-fit">
              <SectionHeader icon={Eye} title="پیش‌نمایش" />
              <CardContent className="pt-0">
                <div className="rounded-xl bg-muted/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Phone className="size-3.5" /><span>پیش‌نمایش پیامک</span>
                  </div>
                  {quickPhones.trim() ? (
                    <div className="text-[10px] text-muted-foreground">{quickPhones.split('\n').filter(p => p.trim()).slice(0, 3).map(p => <div key={p} className="py-0.5">{p}</div>)}...</div>
                  ) : <p className="text-xs text-muted-foreground italic">شماره‌ای وارد نشده</p>}
                  <Separator />
                  <div className="bg-white rounded-lg p-3 border border-border/50 shadow-sm max-w-[280px]">
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{quickMessage || 'متن پیام...'}</p>
                    <p className="text-[9px] text-muted-foreground mt-2 text-left" dir="ltr">Zarrin Gold</p>
                  </div>
                  {smsCount > 1 && <p className="text-[10px] text-amber-500">⚠️ پیام بیش از {toFa(String(smsCount))} قسمت</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Confirm Dialog */}
          <AlertDialog open={quickConfirmOpen} onOpenChange={setQuickConfirmOpen}>
            <AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>تایید ارسال پیامک</AlertDialogTitle><AlertDialogDescription>{toFa(String(quickPhones.split('\n').filter(p => p.trim()).length))} پیامک ارسال خواهد شد. آیا مطمئن هستید؟</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>انصراف</AlertDialogCancel><AlertDialogAction onClick={handleQuickSend} disabled={quickSending}>{quickSending && <Loader2 className="size-3.5 animate-spin ml-1" />}ارسال</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 4: TEMPLATES                                              */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="templates" className="mt-6 space-y-4">
          <Card className="card-gold-border">
            <SectionHeader icon={FileText} title="قالب‌های پیامک" badge={<Badge variant="outline">{toFa(String(templates.length))} قالب</Badge>}
              action={<Button size="sm" className="btn-gold-gradient text-xs" onClick={() => { setEditingTemplate(null); setTemplateForm({ name:'', slug:'', content:'', type:'marketing', variables:'' }); setTemplateDialogOpen(true); }}><Plus className="size-3.5 ml-1" />قالب جدید</Button>} />
            <CardContent className="pt-0">
              {templatesLoading ? <div className="space-y-2">{Array.from({length:5}).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div> : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-2">
                    {templates.map(t => (
                      <div key={t.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold truncate">{t.name}</p>
                            <Badge variant="outline" className="text-[9px]">{C_TYPES[t.type] || t.type}</Badge>
                            <Badge variant={t.active ? 'default' : 'secondary'} className={cn('text-[9px]', t.active && 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20')}>
                              {t.active ? 'فعال' : 'غیرفعال'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{t.content}</p>
                          {t.variables.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              {t.variables.map(v => <Badge key={v} variant="outline" className="text-[9px] text-[#D4AF37] border-[#D4AF37]/20">{v}</Badge>)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="size-7" onClick={() => { setEditingTemplate(t); setTemplateForm({ name: t.name, slug: t.slug, content: t.content, type: t.type, variables: t.variables.join(', ') }); setTemplateDialogOpen(true); }}><FileText className="size-3.5" /></Button></TooltipTrigger><TooltipContent>ویرایش</TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="size-7" onClick={() => { navigator.clipboard.writeText(t.content); addToast('کپی شد', 'success'); }}><Copy className="size-3.5" /></Button></TooltipTrigger><TooltipContent>کپی</TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="size-7" onClick={() => handleToggleTemplate(t)}><span className={cn('size-3.5 rounded-full', t.active ? 'bg-emerald-500' : 'bg-gray-300')} /></Button></TooltipTrigger><TooltipContent>{t.active ? 'غیرفعال' : 'فعال'}</TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="size-7" onClick={() => handleDeleteTemplate(t.id)}><Trash2 className="size-3.5 text-red-500" /></Button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader><DialogTitle>{editingTemplate ? 'ویرایش قالب' : 'ایجاد قالب جدید'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label className="text-xs">نام قالب</Label><Input className="input-gold-focus mt-1" value={templateForm.name} onChange={e => setTemplateForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label className="text-xs">شناسه (slug)</Label><Input className="input-gold-focus mt-1 font-mono text-sm" dir="ltr" value={templateForm.slug} onChange={e => setTemplateForm(p => ({ ...p, slug: e.target.value }))} /></div>
                <div><Label className="text-xs">نوع</Label><Select value={templateForm.type} onValueChange={v => setTemplateForm(p => ({ ...p, type: v }))}><SelectTrigger className="input-gold-focus mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(C_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs">محتوا</Label><Textarea className="input-gold-focus mt-1" rows={4} value={templateForm.content} onChange={e => setTemplateForm(p => ({ ...p, content: e.target.value }))} /><p className="text-[10px] text-muted-foreground mt-1">متغیرها با {`{name}`} مشخص شوند</p></div>
                <div><Label className="text-xs">متغیرها (با کاما جدا)</Label><Input className="input-gold-focus mt-1 font-mono text-sm" dir="ltr" value={templateForm.variables} onChange={e => setTemplateForm(p => ({ ...p, variables: e.target.value }))} placeholder="{name}, {amount}" /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>انصراف</Button><Button className="btn-gold-gradient" onClick={handleSaveTemplate}>ذخیره</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 5: BIRTHDAY                                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="birthday" className="mt-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon={Cake} title="تولدهای این ماه" value={toFa(String(birthdays.length))} />
            <StatCard icon={Send} title="ارسال شده" value={toFa(String(birthdayStats.sentThisMonth))} iconColor="text-emerald-500" />
            <StatCard icon={TrendingUp} title="کل ارسال‌ها" value={toFa(String(birthdayStats.totalSent))} iconColor="text-amber-500" />
          </div>

          <Card className="card-gold-border">
            <SectionHeader icon={Sparkles} title="تنظیم پیام تولد" description="پیکربندی خودکار پیامک تولد"
              action={<div className="flex items-center gap-2"><Label className="text-xs">ارسال خودکار</Label><Switch checked={birthdayAutoSend} onCheckedChange={setBirthdayAutoSend} /></div>} />
            <CardContent className="pt-0 space-y-3">
              <div>
                <Label className="text-xs">متن پیام (متغیر: {`{name}`}, {`{gift_code}`})</Label>
                <Textarea className="input-gold-focus mt-1" rows={3} value={birthdayMessage} onChange={e => setBirthdayMessage(e.target.value)} />
                <div className="flex gap-1 mt-2 flex-wrap">
                  <Badge variant="outline" className="text-[9px] cursor-pointer hover:bg-muted" onClick={() => setBirthdayMessage(p => p + '{name}')}>{`{name}`}</Badge>
                  <Badge variant="outline" className="text-[9px] cursor-pointer hover:bg-muted" onClick={() => setBirthdayMessage(p => p + '{gift_code}')}>{`{gift_code}`}</Badge>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[11px] text-muted-foreground mb-1">پیش‌نمایش:</p>
                <p className="text-sm">{birthdayMessage.replace('{name}', 'علی').replace('{gift_code}', 'BDAY1234')}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gold-border">
            <SectionHeader icon={Cake} title="تولدهای پیش‌رو" badge={<Badge variant="outline">{toFa(String(birthdays.filter(b => !b.sent).length))} ارسال نشده</Badge>}
              action={<Button size="sm" className="btn-gold-gradient text-xs" onClick={handleSendAllBirthdays} disabled={!birthdays.some(b => !b.sent)}>
                <Send className="size-3.5 ml-1" />ارسال همه
              </Button>} />
            <CardContent className="pt-0">
              {birthdaysLoading ? <div className="space-y-2">{Array.from({length:3}).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div> : (
                <ScrollArea className="max-h-80">
                  <div className="space-y-2">
                    {birthdays.map(b => (
                      <div key={b.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                            <Cake className="size-4 text-[#D4AF37]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{b.name}</p>
                            <p className="text-[11px] text-muted-foreground">{b.phone} • {b.birthDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {b.sent && <Badge variant="outline" className="text-[9px] bg-emerald-500/15 text-emerald-600 border-emerald-500/20"><CheckCircle className="size-2.5 ml-0.5" />ارسال شده</Badge>}
                          <Button size="sm" variant={b.sent ? 'ghost' : 'default'} className={cn('text-[11px]', !b.sent && 'btn-gold-gradient')} disabled={b.sent || birthdaySending === b.id} onClick={() => handleSendBirthday(b)}>
                            {birthdaySending === b.id ? <Loader2 className="size-3 animate-spin" /> : b.sent ? 'ارسال شده' : 'ارسال'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 6: TRANSACTION NOTIFICATIONS                              */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="txn-notif" className="mt-6 space-y-4">
          <Card className="card-gold-border">
            <SectionHeader icon={Radio} title="اعلان تراکنش‌ها" description="تنظیم ارسال خودکار پیامک برای انواع تراکنش" />
            <CardContent className="pt-0">
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-4">
                  {txnTypes.map((t, idx) => (
                    <div key={t.key} className="p-4 rounded-xl border border-border/50 bg-card space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn('size-8 rounded-lg flex items-center justify-center', t.enabled ? 'bg-emerald-500/10' : 'bg-gray-500/10')}>
                            <Bell className={cn('size-4', t.enabled ? 'text-emerald-500' : 'text-gray-400')} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{t.label}</p>
                            <p className="text-[11px] text-muted-foreground">{t.enabled ? 'فعال' : 'غیرفعال'}</p>
                          </div>
                        </div>
                        <Switch checked={t.enabled} onCheckedChange={() => handleToggleTxnType(idx)} />
                      </div>
                      {t.enabled && (
                        <>
                          <div>
                            <Label className="text-xs">قالب پیام</Label>
                            <Textarea className="input-gold-focus mt-1 text-sm" rows={2} value={t.template} onChange={e => handleUpdateTxnTemplate(idx, e.target.value)} />
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <Label className="text-xs">حداقل مبلغ (تومان)</Label>
                              <Input type="number" className="input-gold-focus mt-1" dir="ltr" value={t.minAmount || ''} onChange={e => handleUpdateTxnMinAmount(idx, Number(e.target.value))} placeholder="0" />
                            </div>
                            <div className="flex-1">
                              <Label className="text-xs">پیش‌نمایش</Label>
                              <div className="mt-1 p-2 rounded-lg bg-muted/50 text-xs">{t.template.replace('{amount}', '۵۰۰,۰۰۰').replace('{grams}', '۱.۵').replace('{balance}', '۲,۵۰۰,۰۰۰')}</div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="card-gold-border">
            <SectionHeader icon={Eye} title="پیش‌نمایش کامل" />
            <CardContent className="pt-0">
              <div><Label className="text-xs">نوع تراکنش</Label><Select value={String(txnPreviewIdx)} onValueChange={v => setTxnPreviewIdx(Number(v))}><SelectTrigger className="input-gold-focus mt-1"><SelectValue /></SelectTrigger><SelectContent>{txnTypes.map((t, i) => <SelectItem key={t.key} value={String(i)}>{t.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="mt-3 rounded-lg bg-white p-4 border border-border/50 max-w-[320px]">
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{txnTypes[txnPreviewIdx]?.template.replace('{amount}', '۱,۰۰۰,۰۰۰').replace('{grams}', '۲').replace('{balance}', '۵,۰۰۰,۰۰۰')}</p>
                <p className="text-[9px] text-muted-foreground mt-2 text-left" dir="ltr">Zarrin Gold</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 7: CONTACT GROUPS                                         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="groups" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(g => (
              <Card key={g.id} className="card-gold-border hover:scale-[1.02] transition-all cursor-pointer group" onClick={() => setGroupSendDialog(g.id)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn('size-10 rounded-xl flex items-center justify-center bg-muted/50')}>
                      {g.icon === 'Crown' && <Sparkles className={cn('size-5', g.color)} />}
                      {g.icon === 'UserPlus' && <Users className={cn('size-5', g.color)} />}
                      {g.icon === 'TrendingUp' && <TrendingUp className={cn('size-5', g.color)} />}
                      {g.icon === 'ShieldCheck' && <ShieldCheck className={cn('size-5', g.color)} />}
                      {g.icon === 'Coins' && <Coins className={cn('size-5', g.color)} />}
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold tabular-nums">{fmt(g.count)}</Badge>
                  </div>
                  <h3 className="text-sm font-bold mb-1 group-hover:text-[#D4AF37] transition-colors">{g.name}</h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{g.description}</p>
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <Button size="sm" variant="ghost" className="w-full text-[11px] text-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10">
                      <Send className="size-3 ml-1" />ارسال پیام به گروه
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="card-gold-border">
            <SectionHeader icon={Users} title="خلاصه گروه‌ها" />
            <CardContent className="pt-0">
              <Table>
                <TableHeader><TableRow><TableHead className="text-xs">گروه</TableHead><TableHead className="text-xs text-left" dir="ltr">تعداد</TableHead><TableHead className="text-xs text-left">درصد از کل</TableHead></TableRow></TableHeader>
                <TableBody>
                  {groups.map(g => {
                    const total = groups.reduce((s, x) => s + x.count, 0);
                    return (
                      <TableRow key={g.id}>
                        <TableCell className="text-sm font-medium">{g.name}</TableCell>
                        <TableCell className="tabular-nums text-sm" dir="ltr">{fmt(g.count)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={(g.count / total) * 100} className="h-2 flex-1" />
                            <span className="text-[10px] tabular-nums">{toFa(((g.count / total) * 100).toFixed(0))}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={!!groupSendDialog} onOpenChange={() => { setGroupSendDialog(null); setGroupMessage(''); }}>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader><DialogTitle>ارسال پیام به {groups.find(g => g.id === groupSendDialog)?.name}</DialogTitle><DialogDescription>{fmt(groups.find(g => g.id === groupSendDialog)?.count || 0)} گیرنده</DialogDescription></DialogHeader>
              <div><Label className="text-xs">متن پیام</Label><Textarea className="input-gold-focus mt-1" rows={4} value={groupMessage} onChange={e => setGroupMessage(e.target.value)} placeholder="متن پیامک..." /></div>
              <DialogFooter><Button variant="outline" onClick={() => setGroupSendDialog(null)}>انصراف</Button><Button className="btn-gold-gradient" onClick={() => groupSendDialog && handleSendGroupMessage(groupSendDialog)} disabled={!groupMessage.trim()}>ارسال</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 8: PROVIDER SETTINGS                                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="provider" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="card-gold-border">
              <SectionHeader icon={Settings} title="تنظیمات ارسال‌کننده" description="پیکربندی سرویس پیامک" />
              <CardContent className="pt-0 space-y-4">
                <div>
                  <Label className="text-xs">سرویس‌دهنده</Label>
                  <Select value={provider.provider} onValueChange={v => setProvider(p => ({ ...p, provider: v }))}>
                    <SelectTrigger className="input-gold-focus mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kavenegar">کاوه‌نگار</SelectItem>
                      <SelectItem value="melipayamak">ملی پیامک</SelectItem>
                      <SelectItem value="smsir">پیامک.ir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">کلید API</Label>
                  <div className="flex gap-2 mt-1">
                    <Input className="input-gold-focus font-mono text-sm flex-1" dir="ltr" type={showApiKey ? 'text' : 'password'} value={provider.apiKey} onChange={e => setProvider(p => ({ ...p, apiKey: e.target.value }))} />
                    <Button size="icon" variant="outline" className="shrink-0" onClick={() => setShowApiKey(s => !s)}><Eye className="size-4" /></Button>
                  </div>
                  {!showApiKey && <p className="text-[10px] text-muted-foreground mt-1 font-mono">{maskKey(provider.apiKey)}</p>}
                </div>
                <div>
                  <Label className="text-xs">شماره ارسال‌کننده</Label>
                  <Input className="input-gold-focus mt-1 font-mono text-sm" dir="ltr" value={provider.senderNumber} onChange={e => setProvider(p => ({ ...p, senderNumber: e.target.value }))} placeholder="3000505" />
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <div className={cn('size-2.5 rounded-full', provider.connected ? 'bg-emerald-500' : 'bg-red-500')} />
                  <span className="text-xs">{provider.connected ? 'متصل' : 'قطع ارتباط'}</span>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 btn-gold-gradient text-xs" onClick={handleTestConnection} disabled={testConnLoading}>
                    {testConnLoading ? <Loader2 className="size-3.5 animate-spin ml-1" /> : <Zap className="size-3.5 ml-1" />}تست اتصال
                  </Button>
                  <Button className="flex-1 text-xs" onClick={handleSaveProvider} disabled={providerSaving}>
                    {providerSaving ? <Loader2 className="size-3.5 animate-spin ml-1" /> : null}ذخیره تنظیمات
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="card-gold-border">
              <SectionHeader icon={BarChart3} title="سهمیه روزانه" />
              <CardContent className="pt-0 space-y-4">
                <div className="text-center py-4">
                  <div className="relative inline-flex items-center justify-center">
                    <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
                      <circle cx="70" cy="70" r="58" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                      <circle cx="70" cy="70" r="58" fill="none" stroke="url(#quotaGrad)" strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 58} strokeDashoffset={2 * Math.PI * 58 * (1 - provider.dailyUsed / provider.dailyLimit)}
                        style={{ transition: 'stroke-dashoffset 1s ease' }} />
                      <defs><linearGradient id="quotaGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#D4AF37" /><stop offset="100%" stopColor="#F5D76E" /></linearGradient></defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold gold-gradient-text tabular-nums">{fmt(provider.dailyUsed)}</span>
                      <span className="text-[10px] text-muted-foreground">از {fmt(provider.dailyLimit)}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold tabular-nums">{fmt(provider.dailyUsed)}</p>
                    <p className="text-[10px] text-muted-foreground">استفاده شده</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold tabular-nums">{fmt(provider.dailyLimit - provider.dailyUsed)}</p>
                    <p className="text-[10px] text-muted-foreground">باقی‌مانده</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold tabular-nums">{fmt(provider.dailyLimit)}</p>
                    <p className="text-[10px] text-muted-foreground">کل سهمیه</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-semibold">اطلاعات سرویس‌دهنده</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <span className="text-muted-foreground">سرویس:</span>
                    <span className="font-medium">{provider.provider === 'kavenegar' ? 'کاوه‌نگار' : provider.provider === 'melipayamak' ? 'ملی پیامک' : 'پیامک.ir'}</span>
                    <span className="text-muted-foreground">شماره فرستنده:</span>
                    <span className="font-mono" dir="ltr">{provider.senderNumber}</span>
                    <span className="text-muted-foreground">وضعیت:</span>
                    <span className={cn('font-medium', provider.connected ? 'text-emerald-500' : 'text-red-500')}>{provider.connected ? 'متصل ✓' : 'قطع ✗'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 9: SEND LOGS                                              */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="logs" className="mt-6 space-y-4">
          <Card className="card-gold-border">
            <SectionHeader icon={Inbox} title="لاگ ارسال پیامک" badge={<Badge variant="outline">{toFa(String(logs.length))} رکورد</Badge>}
              action={<Button size="sm" variant="outline" className="text-xs" onClick={handleExportLogs}><Download className="size-3.5 ml-1" />خروجی CSV</Button>} />
            <CardContent className="pt-0 space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[140px]">
                  <Input className="input-gold-focus text-xs" placeholder="جستجوی شماره..." value={logFilters.phone} onChange={e => { setLogFilters(p => ({ ...p, phone: e.target.value })); setLogPage(1); }} dir="ltr" />
                </div>
                <Select value={logFilters.type} onValueChange={v => { setLogFilters(p => ({ ...p, type: v })); setLogPage(1); }}>
                  <SelectTrigger className="w-[120px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[{v:'all',l:'همه انواع'},{v:'otp',l:'OTP'},{v:'transactional',l:'تراکنشی'},{v:'marketing',l:'بازاریابی'},{v:'birthday',l:'تولد'},{v:'price_alert',l:'هشدار'},{v:'security',l:'امنیتی'}].map(x => <SelectItem key={x.v} value={x.v}>{x.l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={logFilters.status} onValueChange={v => { setLogFilters(p => ({ ...p, status: v })); setLogPage(1); }}>
                  <SelectTrigger className="w-[120px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[{v:'all',l:'همه وضعیت'},{v:'sent',l:'ارسال شده'},{v:'delivered',l:'تحویل'},{v:'failed',l:'ناموفق'},{v:'pending',l:'در انتظار'}].map(x => <SelectItem key={x.v} value={x.v}>{x.l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="outline" onClick={fetchLogs}><RefreshCw className="size-3.5" /></Button>
              </div>

              {logsLoading ? (
                <div className="space-y-2">{Array.from({length:8}).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
              ) : logs.length === 0 ? (
                <EmptyState icon={Inbox} title="لاگی یافت نشد" description="هنوز پیامکی ارسال نشده است" />
              ) : (
                <>
                  <div className="overflow-x-auto -mx-1">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead className="text-[11px]">تاریخ</TableHead>
                        <TableHead className="text-[11px]" dir="ltr">شماره</TableHead>
                        <TableHead className="text-[11px]">نوع</TableHead>
                        <TableHead className="text-[11px]">وضعیت</TableHead>
                        <TableHead className="text-[11px] text-left">هزینه</TableHead>
                        <TableHead className="text-[11px] text-left">عملیات</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {logs.slice(0, 15).map(l => (
                          <TableRow key={l.id}>
                            <TableCell className="text-[11px] tabular-nums">{new Date(l.date).toLocaleString('fa-IR', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</TableCell>
                            <TableCell className="text-[11px] font-mono" dir="ltr">{l.phone}</TableCell>
                            <TableCell className="text-[11px]">{C_TYPES[l.type] || l.type}</TableCell>
                            <TableCell><StatusBadge status={l.status} /></TableCell>
                            <TableCell className="text-[11px] tabular-nums" dir="ltr">{fmt(l.cost)} ت</TableCell>
                            <TableCell>
                              {l.status === 'failed' && (
                                <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="size-6" onClick={() => handleRetryLog(l.id)}><RefreshCw className="size-3" /></Button></TooltipTrigger><TooltipContent>تلاش مجدد</TooltipContent></Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Pagination */}
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">صفحه {toFa(String(logPage))} از {toFa(String(logTotalPages))}</p>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="size-7" disabled={logPage <= 1} onClick={() => setLogPage(p => p - 1)}><ChevronRight className="size-3.5" /></Button>
                      <Button size="icon" variant="outline" className="size-7" disabled={logPage >= logTotalPages} onClick={() => setLogPage(p => p + 1)}><ChevronLeft className="size-3.5" /></Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TAB 10: BLACKLIST                                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="blacklist" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="card-gold-border">
              <SectionHeader icon={Ban} title="افزودن به لیست سیاه" description="شماره‌های مسدود شده پیامک دریافت نمی‌کنند" />
              <CardContent className="pt-0 space-y-3">
                <div><Label className="text-xs">شماره تلفن</Label><Input className="input-gold-focus mt-1 font-mono text-sm" dir="ltr" value={blPhone} onChange={e => setBlPhone(e.target.value)} placeholder="09121234567" /></div>
                <div><Label className="text-xs">دلیل (اختیاری)</Label><Input className="input-gold-focus mt-1" value={blReason} onChange={e => setBlReason(e.target.value)} placeholder="دلیل مسدودسازی" /></div>
                <Button className="w-full btn-gold-gradient text-xs" onClick={handleAddBlacklist} disabled={blAdding || !blPhone.trim()}>
                  {blAdding ? <Loader2 className="size-3.5 animate-spin ml-1" /> : <Plus className="size-3.5 ml-1" />}افزودن
                </Button>
              </CardContent>
            </Card>

            <Card className="card-gold-border lg:col-span-2">
              <SectionHeader icon={ShieldAlert} title="لیست سیاه" badge={<Badge variant="outline">{toFa(String(filteredBlacklist.length))} شماره</Badge>} />
              <CardContent className="pt-0 space-y-3">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input className="input-gold-focus pr-9 text-xs" placeholder="جستجو در لیست..." value={blSearch} onChange={e => setBlSearch(e.target.value)} />
                </div>
                {blacklistLoading ? (
                  <div className="space-y-2">{Array.from({length:3}).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
                ) : filteredBlacklist.length === 0 ? (
                  <EmptyState icon={ShieldCheck} title="لیست سیاه خالی" description="شماره مسدودی وجود ندارد" />
                ) : (
                  <ScrollArea className="max-h-72">
                    <div className="space-y-2">
                      {filteredBlacklist.map(e => (
                        <div key={e.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                              <Ban className="size-4 text-red-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-mono font-semibold" dir="ltr">{e.phone}</p>
                              <p className="text-[11px] text-muted-foreground">{e.reason} • {e.addedAt}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="text-[11px] text-red-500 hover:text-red-600 hover:bg-red-500/10 shrink-0" onClick={() => handleRemoveBlacklist(e.id)}>
                            <Trash2 className="size-3 ml-1" />حذف
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="card-gold-border">
            <SectionHeader icon={BarChart3} title="آمار لیست سیاه" />
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xl font-bold gold-gradient-text tabular-nums">{toFa(String(blacklist.length))}</p>
                  <p className="text-[11px] text-muted-foreground">کل مسدودها</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xl font-bold text-red-500 tabular-nums">{toFa(String(Math.floor(blacklist.length * 0.4)))}</p>
                  <p className="text-[11px] text-muted-foreground">درخواست کاربر</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xl font-bold text-amber-500 tabular-nums">{toFa(String(Math.ceil(blacklist.length * 0.6)))}</p>
                  <p className="text-[11px] text-muted-foreground">اسپم و آزار</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
    </TooltipProvider>
  );
}

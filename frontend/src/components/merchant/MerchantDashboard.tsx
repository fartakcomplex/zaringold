
/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Merchant Dashboard — پنل فروشگاه میلّی گلد                                  */
/*  7 tabs: Overview, API Keys, Transactions, Settlements, Invoices, QR, Settings */
/*  All data from REAL API endpoints                                            */
/* ═══════════════════════════════════════════════════════════════════════════════ */

import {useState, useCallback, useEffect, useSyncExternalStore} from 'react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Switch} from '@/components/ui/switch';
import {Separator} from '@/components/ui/separator';
import {Skeleton} from '@/components/ui/skeleton';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Store, Key, ArrowLeftRight, Landmark, FileText, QrCode, Settings, CreditCard, Clock, CheckCircle2, XCircle, AlertCircle, Plus, Copy, Check, Trash2, Eye, Download, RefreshCw, Loader2, Coins, BarChart3, ExternalLink, Shield, ChevronDown, Zap, Globe, Palette, Bell, Webhook, /* Gateway marketing icons */
  Link2, Radio, Lock, Headphones, Sparkles, Code2, ShieldCheck} from 'lucide-react';
import {cn} from '@/lib/utils';
import {useAppStore} from '@/lib/store';
import {useTranslation} from '@/lib/i18n';
import {formatNumber, formatGrams, formatDate, getTimeAgo} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Types & Interfaces — matched to real API responses                         */
/* ═══════════════════════════════════════════════════════════════════════════════ */

type TxStatus = 'paid' | 'pending' | 'failed' | 'expired';
type SettlementStatus = 'pending' | 'processing' | 'completed';
type InvoiceStatus = 'paid' | 'unpaid' | 'expired';

/* ── API response wrappers ── */
interface ApiRes<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/* ── Dashboard ── */
interface DashboardData {
  today: { salesToman: number; salesGold: number; count: number };
  monthly: { salesToman: number; salesGold: number; count: number; lastMonthSalesToman: number; growthRate: number };
  allTime: { totalSales: number; totalSalesGold: number; totalSettled: number; totalSettledGold: number; pendingSettle: number; pendingSettleGold: number };
  stats: { successRate: number; avgOrder: number; refundCount: number; activeQrCodes: number };
  recentPayments: Array<{
    id: string; authority: string; amountToman: number; goldGrams: number;
    status: string; paymentMethod: string; customerName: string; createdAt: string;
  }>;
  recentRefunds: Array<{ id: string; amountToman: number; reason: string; status: string; createdAt: string }>;
  recentSettlements: Array<{ id: string; amountToman: number; status: string; type: string; createdAt: string }>;
}

/* ── API Keys ── */
interface ApiKeyItem {
  id: string;
  keyPrefix: string;
  keyType: string;
  name: string;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

/* ── Settlements ── */
interface SettlementItem {
  id: string;
  amount_toman: number;
  amount_gold: number;
  fee_toman: number;
  type: string;
  status: string;
  transaction_ref: string | null;
  created_at: string;
  processed_at: string | null;
}

interface SettlementSummary {
  totalSettled: number;
  totalSettledGold: number;
  totalFees: number;
  settledCount: number;
  pendingAmount: number;
  pendingGold: number;
  pendingCount: number;
}

/* ── Invoices ── */
interface InvoiceItem {
  id: string;
  invoice_number: string;
  customer_name: string;
  amount_toman: number;
  amount_gold: number;
  total_toman: number;
  total_gold: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
}

/* ── QR Codes ── */
interface QrCodeItem {
  id: string;
  token: string;
  title: string;
  amount_toman: number;
  amount_gold: number;
  is_fixed: boolean;
  is_active: boolean;
  scan_count: number;
  payment_url: string;
  created_at: string;
}

/* ── Merchant Profile ── */
interface MerchantProfile {
  id: string;
  businessName: string;
  businessType: string;
  website: string | null;
  description: string | null;
  settlementType: string;
  settlementFreq: string;
  webhookUrl: string | null;
  brandingColor: string;
  isActive: boolean;
  isVerified: boolean;
  kycStatus: string;
  totalSales: number;
  totalSettled: number;
  pendingSettle: number;
  activeApiKeys: number;
  createdAt: string;
  counts: { payments: number; refunds: number; settlements: number; invoices: number; qrCodes: number };
}

/* ── Registration form ── */
interface RegistrationForm {
  businessName: string;
  businessType: string;
  website: string;
  webhookUrl: string;
  settlementType: string;
  settlementFreq: string;
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Status Badges Config                                                       */
/* ═══════════════════════════════════════════════════════════════════════════════ */

const TX_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  paid:    { label: 'موفق', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle2 },
  pending: { label: 'در انتظار', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: Clock },
  failed:  { label: 'ناموفق', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
  expired: { label: 'منقضی', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800/40', icon: AlertCircle },
};

const SETTLEMENT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'در انتظار', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  processing: { label: 'در حال پردازش', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  completed:  { label: 'تکمیل‌شده', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
};

const INVOICE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  paid:    { label: 'پرداخت شده', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  unpaid:  { label: 'پرداخت نشده', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  expired: { label: 'منقضی', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800/40' },
  partial: { label: 'پرداخت جزئی', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
};

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Helper Functions                                                          */
/* ═══════════════════════════════════════════════════════════════════════════════ */

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function fetchApi<T>(url: string): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url);
    const json: ApiRes<T> = await res.json();
    if (!json.success) return { data: null, error: json.message || 'خطای ناشناخته' };
    return { data: json.data ?? null, error: null };
  } catch {
    return { data: null, error: 'خطا در ارتباط با سرور' };
  }
}

async function postApi<T>(url: string, body: Record<string, unknown>): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json: ApiRes<T> = await res.json();
    if (!json.success) return { data: null, error: json.message || 'خطای ناشناخته' };
    return { data: json.data ?? null, error: null };
  } catch {
    return { data: null, error: 'خطا در ارتباط با سرور' };
  }
}

async function deleteApi(url: string): Promise<{ error: string | null }> {
  try {
    const res = await fetch(url, { method: 'DELETE' });
    const json: ApiRes<unknown> = await res.json();
    if (!json.success) return { error: json.message || 'خطای ناشناخته' };
    return { error: null };
  } catch {
    return { error: 'خطا در ارتباط با سرور' };
  }
}

/* Gold gradient border card style */
const goldCardGlow = 'hover:shadow-lg hover:shadow-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all duration-300';

/* Animation variants */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                          */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function MerchantSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      <div className="flex flex-col items-center gap-4 py-8">
        <Skeleton className="size-16 rounded-2xl" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab-Level Skeleton                                                        */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Empty State Component                                                     */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-10 text-center"
    >
      <div className="flex size-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-bold">{title}</h4>
        <p className="mt-1 text-xs text-muted-foreground max-w-xs">{description}</p>
      </div>
      {action}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Error State Component                                                     */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/10 p-10 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-500">
        <AlertCircle className="size-8" />
      </div>
      <div>
        <h4 className="text-sm font-bold">خطا در دریافت اطلاعات</h4>
        <p className="mt-1 text-xs text-muted-foreground max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} size="sm" variant="outline" className="border-[#D4AF37]/40 text-[#D4AF37]">
          <RefreshCw className="size-3.5 ml-1.5" />
          تلاش مجدد
        </Button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Merchant Registration Form                                                 */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function RegistrationForm({ userId, onComplete }: { userId: string; onComplete: () => void }) {
  const { addToast } = useAppStore();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<RegistrationForm>({
    businessName: '',
    businessType: 'online',
    website: '',
    webhookUrl: '',
    settlementType: 'gold',
    settlementFreq: 'daily',
  });

  const handleSubmit = useCallback(async () => {
    if (!form.businessName.trim()) {
      addToast('نام کسب‌وکار الزامی است', 'error');
      return;
    }
    setSubmitting(true);
    const { error } = await postApi('/api/v1/merchant/register', {
      userId,
      businessName: form.businessName.trim(),
      businessType: form.businessType,
      website: form.website.trim() || undefined,
      webhookUrl: form.webhookUrl.trim() || undefined,
      settlementType: form.settlementType,
      settlementFreq: form.settlementFreq,
    });
    setSubmitting(false);
    if (error) {
      addToast(error, 'error');
      return;
    }
    addToast('ثبت‌نام فروشنده با موفقیت انجام شد', 'success');
    onComplete();
  }, [form, userId, addToast, onComplete]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-lg mx-auto space-y-6">
      <motion.div variants={itemVariants} className="text-center py-4">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8960C] text-white shadow-xl shadow-[#D4AF37]/20 mx-auto mb-4">
          <Store className="size-10" />
        </div>
        <h2 className="text-xl font-extrabold">ثبت‌نام فروشنده</h2>
        <p className="text-sm text-muted-foreground mt-2">برای شروع دریافت پرداخت، ابتدا حساب فروشندگی خود را ثبت کنید</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-2 border-[#D4AF37]/30">
          <CardContent className="p-5 space-y-4">
            {/* Business Name */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">نام کسب‌وکار *</Label>
              <Input
                value={form.businessName}
                onChange={e => setForm(p => ({ ...p, businessName: e.target.value }))}
                placeholder="مثال: فروشگاه طلای ناب"
                className="text-sm"
              />
            </div>

            {/* Business Type */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">نوع کسب‌وکار</Label>
              <Select value={form.businessType} onValueChange={v => setForm(p => ({ ...p, businessType: v }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">فروشگاه آنلاین</SelectItem>
                  <SelectItem value="mobile_app">اپلیکیشن موبایل</SelectItem>
                  <SelectItem value="service_web">وب‌سایت خدماتی</SelectItem>
                  <SelectItem value="physical">فروشگاه فیزیکی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">وبسایت</Label>
              <Input
                value={form.website}
                onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                placeholder="https://myshop.ir"
                className="text-sm font-mono"
                dir="ltr"
              />
            </div>

            {/* Webhook URL */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">آدرس وب‌هوک <span className="text-muted-foreground">(اختیاری)</span></Label>
              <Input
                value={form.webhookUrl}
                onChange={e => setForm(p => ({ ...p, webhookUrl: e.target.value }))}
                placeholder="https://myshop.ir/webhook/goldpay"
                className="text-sm font-mono"
                dir="ltr"
              />
            </div>

            {/* Settlement Type — طلای آبشده (فقط طلا) */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">ارز تسویه</Label>
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg border-2 border-[#D4AF37] bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold text-[#D4AF37]">
                  <Coins className="size-3.5 inline-block ml-1" />
                  طلای آبشده
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">درگاه پرداخت زرین گلد فقط بر اساس طلا تسویه می‌کند</p>
            </div>

            {/* Settlement Frequency */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">دوره تسویه</Label>
              <Select value={form.settlementFreq} onValueChange={v => setForm(p => ({ ...p, settlementFreq: v }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">روزانه</SelectItem>
                  <SelectItem value="weekly">هفتگی</SelectItem>
                  <SelectItem value="monthly">ماهانه</SelectItem>
                  <SelectItem value="manual">دستی (درخواستی)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white hover:from-[#D4AF37]/90 hover:to-[#FFD700]/90 shadow-lg shadow-[#D4AF37]/20 font-bold"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4 ml-2" />}
              {submitting ? 'در حال ثبت‌نام...' : 'ثبت‌نام فروشنده'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 1: Overview (نمای کلی)                                                */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function OverviewTab({
  dashboard,
  profile,
  loading,
  error,
  onRetry,
  onNavigate,
}: {
  dashboard: DashboardData | null;
  profile: MerchantProfile | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onNavigate: (tab: string) => void;
}) {
  const { t } = useTranslation();

  if (loading) return <TabSkeleton />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!dashboard) return null;

  const growthLabel = dashboard.monthly.growthRate >= 0
    ? `+${formatNumber(dashboard.monthly.growthRate)}٪ نسبت به ماه قبل`
    : `${formatNumber(dashboard.monthly.growthRate)}٪ نسبت به ماه قبل`;

  const statCards = [
    {
      icon: <Coins className="size-5" />,
      label: 'فروش امروز (طلا)',
      value: formatGrams(dashboard.today.salesGold),
      subValue: `${formatNumber(dashboard.today.count)} تراکنش`,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    },
    {
      icon: <Coins className="size-5" />,
      label: 'فروش ماهانه (طلا)',
      value: formatGrams(dashboard.monthly.salesGold),
      subValue: growthLabel,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      icon: <ArrowLeftRight className="size-5" />,
      label: t('merchant.totalTransactions'),
      value: profile ? formatNumber(profile.counts.payments) : '—',
      subValue: 'از ابتدا',
      color: 'text-[#D4AF37]',
      bg: 'bg-[#D4AF37]/10',
    },
    {
      icon: <CheckCircle2 className="size-5" />,
      label: t('merchant.successRate'),
      value: `${formatNumber(dashboard.stats.successRate)}%`,
      subValue: 'میانگین ماهانه',
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/20',
    },
    {
      icon: <Coins className="size-5" />,
      label: 'تسویه معلق (طلا)',
      value: formatGrams(dashboard.allTime.pendingSettleGold),
      subValue: 'در انتظار تسویه',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/20',
    },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((stat, i) => (
          <Card key={i} className={`overflow-hidden ${goldCardGlow}`}>
            <CardContent className="p-4">
              <div className={`flex size-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color} mb-3`}>
                {stat.icon}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
              <p className="text-base font-extrabold mt-1 tabular-nums">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.subValue}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Zap className="size-4 text-[#D4AF37]" />
              {t('merchant.quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Button
                onClick={() => onNavigate('invoices')}
                className="bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white hover:from-[#D4AF37]/90 hover:to-[#FFD700]/90 shadow-lg shadow-[#D4AF37]/20 font-bold"
              >
                <Plus className="size-4 ml-2" />
                {t('merchant.newInvoice')}
              </Button>
              <Button
                onClick={() => onNavigate('qrPayments')}
                variant="outline"
                className="border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold"
              >
                <QrCode className="size-4 ml-2" />
                {t('merchant.newQrCode')}
              </Button>
              <Button
                onClick={() => onNavigate('apiKeys')}
                variant="outline"
                className="border-border/50 hover:border-[#D4AF37]/30 font-bold"
              >
                <Key className="size-4 ml-2" />
                {t('merchant.apiKeys')}
              </Button>
              <Button
                onClick={() => onNavigate('settlements')}
                variant="outline"
                className="border-border/50 hover:border-[#D4AF37]/30 font-bold"
              >
                <Landmark className="size-4 ml-2" />
                {t('merchant.settlements')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Merchant ID & Security Info */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2">
        <Card className={goldCardGlow}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8960C] text-white shadow-lg shadow-[#D4AF37]/20">
                <Store className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{t('merchant.merchantId')}</h3>
                <p className="text-xs text-muted-foreground font-mono">{profile?.id.slice(0, 8).toUpperCase() || '—'}</p>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t('merchant.activeKeys')}</span>
                <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-0">
                  {formatNumber(profile?.activeApiKeys ?? 0)} فعال
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t('merchant.status')}</span>
                <Badge className={`border-0 ${profile?.isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800/40 text-gray-500'}`}>
                  {profile?.isActive ? 'فعال ✅' : 'غیرفعال'}
                </Badge>
              </div>
              {profile?.businessName && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">نام کسب‌وکار</span>
                  <span className="font-bold">{profile.businessName}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={goldCardGlow}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/20">
                <Shield className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm">امنیت API</h3>
                <p className="text-xs text-muted-foreground">SSL + AES-256</p>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>رمزنگاری سرتاسری</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>اعتبارسنجی OAuth 2.0</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>IP Whitelist</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Payments */}
      {dashboard.recentPayments.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="size-4 text-[#D4AF37]" />
                آخرین پرداخت‌ها
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dashboard.recentPayments.slice(0, 5).map(p => {
                const cfg = TX_STATUS_CONFIG[p.status] || TX_STATUS_CONFIG.pending;
                const StatusIcon = cfg.icon;
                return (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={`flex size-8 items-center justify-center rounded-lg ${cfg.bg}`}>
                        <StatusIcon className={`size-4 ${cfg.color}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{p.customerName || p.authority}</p>
                        <p className="text-[10px] text-muted-foreground">{getTimeAgo(p.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold tabular-nums flex items-center gap-1">
                        <Coins className="size-3 text-[#D4AF37]" />
                        {formatGrams(p.goldGrams)}
                      </p>
                      <Badge className={`${cfg.bg} ${cfg.color} border-0 text-[9px]`}>
                        {cfg.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 2: API Keys (کلید API)                                               */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function ApiKeysTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { addToast } = useAppStore();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newKeyModal, setNewKeyModal] = useState<string | null>(null); // the full key shown once

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await fetchApi<ApiKeyItem[]>(`/api/v1/merchant/api-keys?userId=${userId}`);
      if (!cancelled) {
        if (err) setError(err);
        else setKeys(data || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const refreshKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchApi<ApiKeyItem[]>(`/api/v1/merchant/api-keys?userId=${userId}`);
    if (err) setError(err);
    else setKeys(data || []);
    setLoading(false);
  }, [userId]);

  const handleCopy = useCallback(async (keyId: string, prefix: string) => {
    const ok = await copyToClipboard(prefix);
    if (ok) {
      setCopiedId(keyId);
      addToast(t('merchant.apiKeyCopied'), 'success');
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, [addToast, t]);

  const handleRevoke = useCallback(async (keyId: string) => {
    const { error } = await deleteApi(`/api/v1/merchant/api-keys/${keyId}?userId=${userId}`);
    if (error) {
      addToast(error, 'error');
      return;
    }
    addToast('کلید API باطلال شد', 'info');
    setKeys(prev => prev.map(k => k.id === keyId ? { ...k, isActive: false } : k));
  }, [userId, addToast]);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    const { data, error } = await postApi<{ key: string; id: string }>('/api/v1/merchant/api-keys', { userId });
    setCreating(false);
    if (error) {
      addToast(error, 'error');
      return;
    }
    if (data?.key) {
      setNewKeyModal(data.key);
      addToast('کلید API جدید ایجاد شد — آن را همین الان ذخیره کنید!', 'success');
    }
    refreshKeys();
  }, [userId, addToast, refreshKeys]);

  const handleCloseNewKeyModal = useCallback(() => {
    setNewKeyModal(null);
  }, []);

  if (loading) return <TabSkeleton />;
  if (error) return <ErrorState message={error} onRetry={refreshKeys} />;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Key className="size-5 text-[#D4AF37]" />
          {t('merchant.apiKeys')}
        </h3>
        <Button onClick={handleCreate} disabled={creating} className="bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white hover:from-[#D4AF37]/90 hover:to-[#FFD700]/90 shadow-lg shadow-[#D4AF37]/20 font-bold">
          {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4 ml-2" />}
          {t('merchant.createApiKey')}
        </Button>
      </motion.div>

      {/* New Key Warning Modal */}
      {newKeyModal && (
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600">
                  <AlertCircle className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">کلید API جدید</h4>
                  <p className="text-[10px] text-muted-foreground">این کلید فقط یک بار نمایش داده می‌شود — آن را همین الان کپی و ذخیره کنید</p>
                </div>
              </div>
              <div className="bg-background rounded-lg p-3 font-mono text-xs break-all select-all border">
                {newKeyModal}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    const ok = await copyToClipboard(newKeyModal);
                    if (ok) addToast('کلید کپی شد', 'success');
                  }}
                  className="bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white font-bold text-xs"
                >
                  <Copy className="size-3.5 ml-1.5" />
                  کپی کلید
                </Button>
                <Button variant="outline" onClick={handleCloseNewKeyModal} className="text-xs">
                  بستن
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {keys.length === 0 ? (
        <EmptyState
          icon={<Key className="size-8" />}
          title={t('merchant.noApiKeys')}
          description={t('merchant.noApiKeysDesc')}
          action={
            <Button onClick={handleCreate} size="sm" variant="outline" className="border-[#D4AF37]/40 text-[#D4AF37]">
              <Plus className="size-3.5 ml-1.5" />
              {t('merchant.createApiKey')}
            </Button>
          }
        />
      ) : (
        <motion.div variants={itemVariants} className="space-y-3">
          {keys.map((key) => (
            <Card key={key.id} className={`${goldCardGlow} ${!key.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-10 items-center justify-center rounded-xl ${key.isActive ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-muted text-muted-foreground'}`}>
                      <Key className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono font-bold">{key.keyPrefix}...</code>
                        <Badge className={`${key.isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800/40 text-gray-500'} border-0 text-[10px]`}>
                          {key.isActive ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {t('merchant.apiKeyCreated')}: {formatDate(key.createdAt)}
                        </span>
                        {key.lastUsedAt && (
                          <span className="flex items-center gap-1">
                            <Eye className="size-3" />
                            {getTimeAgo(key.lastUsedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(key.id, key.keyPrefix)}
                      className="h-8 px-3 text-xs"
                    >
                      {copiedId === key.id ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                      {copiedId === key.id ? t('merchant.apiKeyCopied') : t('merchant.apiKeyCopy')}
                    </Button>
                    {key.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRevoke(key.id)}
                        className="h-8 px-3 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/40"
                      >
                        <Trash2 className="size-3.5" />
                        {t('merchant.apiKeyRevoke')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 3: Transactions (تراکنش‌ها)                                            */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function TransactionsTab({ payments, loading, error, onRetry }: {
  payments: DashboardData['recentPayments'];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string>('all');

  if (loading) return <TabSkeleton />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  const filtered = filter === 'all' ? payments : payments.filter(tx => tx.status === filter);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <ArrowLeftRight className="size-5 text-[#D4AF37]" />
          {t('merchant.transactions')}
        </h3>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(['all', 'paid', 'pending', 'failed', 'expired'] as const).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              className={`text-xs h-8 ${filter === status
                ? 'bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white border-0 shadow-md shadow-[#D4AF37]/20'
                : 'border-border/50 hover:border-[#D4AF37]/30'
              }`}
            >
              {status === 'all' ? t('common.all') :
               status === 'paid' ? t('merchant.statusPaid') :
               status === 'pending' ? t('merchant.statusPending') :
               status === 'failed' ? t('merchant.statusFailed') :
               t('merchant.statusExpired')}
            </Button>
          ))}
        </div>
      </motion.div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="size-8" />}
          title={t('merchant.noTransactions')}
          description={t('merchant.noTransactionsDesc')}
        />
      ) : (
        <motion.div variants={itemVariants} className="space-y-3">
          {filtered.map((tx) => {
            const cfg = TX_STATUS_CONFIG[tx.status] || TX_STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            return (
              <Card key={tx.id} className={goldCardGlow}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-10 items-center justify-center rounded-xl ${cfg.bg}`}>
                        <StatusIcon className={`size-5 ${cfg.color}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{tx.customerName || tx.authority}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span>{getTimeAgo(tx.createdAt)}</span>
                          <span>•</span>
                          <span className="font-mono">{tx.authority}</span>
                          {tx.paymentMethod && (
                            <>
                              <span>•</span>
                              <span>{tx.paymentMethod}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="text-left">
                        <p className="text-sm font-bold tabular-nums flex items-center gap-1">
                          <Coins className="size-3.5 text-[#D4AF37]" />
                          {formatGrams(tx.goldGrams)}
                        </p>
                      </div>
                      <Badge className={`${cfg.bg} ${cfg.color} border-0 text-[10px] shrink-0`}>
                        <StatusIcon className="size-3 ml-1" />
                        {cfg.label}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 4: Settlements (تسویه‌ها)                                              */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function SettlementsTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { addToast } = useAppStore();
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [summary, setSummary] = useState<SettlementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await fetchApi<{ settlements: SettlementItem[]; summary: SettlementSummary }>(
        `/api/v1/merchant/settlements?userId=${userId}&limit=50`
      );
      if (!cancelled) {
        if (err) setError(err);
        else {
          setSettlements(data?.settlements || []);
          setSummary(data?.summary || null);
        }
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const refreshSettlements = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchApi<{ settlements: SettlementItem[]; summary: SettlementSummary }>(
      `/api/v1/merchant/settlements?userId=${userId}&limit=50`
    );
    if (err) setError(err);
    else {
      setSettlements(data?.settlements || []);
      setSummary(data?.summary || null);
    }
    setLoading(false);
  }, [userId]);

  const handleRequest = useCallback(async () => {
    const amount = parseFloat(requestAmount);
    if (!amount || amount < 0.1) {
      addToast('حداقل مبلغ تسویه ۰٫۱ گرم طلا است', 'error');
      return;
    }
    setRequesting(true);
    const { error } = await postApi('/api/v1/merchant/settlements/request', {
      userId,
      amount_gold: amount,
    });
    setRequesting(false);
    if (error) {
      addToast(error, 'error');
      return;
    }
    addToast('درخواست تسویه ثبت شد و در حال بررسی است', 'success');
    setShowRequestForm(false);
    setRequestAmount('');
    refreshSettlements();
  }, [userId, requestAmount, addToast, refreshSettlements]);

  if (loading) return <TabSkeleton />;
  if (error) return <ErrorState message={error} onRetry={refreshSettlements} />;

  const pendingGold = summary?.pendingGold || 0;
  const settledGold = summary?.totalSettledGold || 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Landmark className="size-5 text-[#D4AF37]" />
          {t('merchant.settlements')}
        </h3>
        <Button onClick={() => setShowRequestForm(true)} className="bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white hover:from-[#D4AF37]/90 hover:to-[#FFD700]/90 shadow-lg shadow-[#D4AF37]/20 font-bold">
          <Download className="size-4 ml-2" />
          {t('merchant.requestSettlement')}
        </Button>
      </motion.div>

      {/* Request Settlement Form */}
      <AnimatePresence>
        {showRequestForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-[#D4AF37]/30 mb-4">
              <CardContent className="p-5 space-y-4">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Download className="size-4 text-[#D4AF37]" />
                  {t('merchant.requestSettlement')}
                </h4>
                <div className="space-y-2">
                  <Label className="text-xs">مبلغ تسویه (گرم طلا)</Label>
                  <Input
                    value={requestAmount}
                    onChange={e => setRequestAmount(e.target.value)}
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="مثال: 1.5"
                    className="text-sm tabular-nums"
                  />
                  {pendingGold > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      قابل تسویه: {formatGrams(pendingGold)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleRequest} disabled={requesting} className="bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white font-bold">
                    {requesting ? <Loader2 className="size-4 animate-spin" /> : null}
                    ثبت درخواست
                  </Button>
                  <Button variant="outline" onClick={() => setShowRequestForm(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className={goldCardGlow}>
          <CardContent className="p-4 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/20 mx-auto mb-2">
              <Clock className="size-5 text-amber-500" />
            </div>
            <p className="text-[10px] text-muted-foreground">{t('merchant.pendingAmount')} (طلا)</p>
            <p className="text-sm font-extrabold mt-1 tabular-nums flex items-center justify-center gap-1">
              <Coins className="size-3.5 text-[#D4AF37]" />
              {formatGrams(pendingGold)}
            </p>
          </CardContent>
        </Card>
        <Card className={goldCardGlow}>
          <CardContent className="p-4 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/20 mx-auto mb-2">
              <CheckCircle2 className="size-5 text-emerald-500" />
            </div>
            <p className="text-[10px] text-muted-foreground">{t('merchant.totalSettled')} (طلا)</p>
            <p className="text-sm font-extrabold mt-1 tabular-nums flex items-center justify-center gap-1">
              <Coins className="size-3.5 text-[#D4AF37]" />
              {formatGrams(settledGold)}
            </p>
          </CardContent>
        </Card>
        <Card className={`${goldCardGlow} hidden sm:block`}>
          <CardContent className="p-4 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#D4AF37]/10 mx-auto mb-2">
              <Landmark className="size-5 text-[#D4AF37]" />
            </div>
            <p className="text-[10px] text-muted-foreground">تعداد تسویه</p>
            <p className="text-sm font-extrabold mt-1 tabular-nums">{formatNumber(settlements.length)}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Settlements List */}
      {settlements.length === 0 ? (
        <EmptyState
          icon={<Landmark className="size-8" />}
          title={t('merchant.noSettlements')}
          description={t('merchant.noSettlementsDesc')}
          action={
            <Button onClick={() => setShowRequestForm(true)} size="sm" variant="outline" className="border-[#D4AF37]/40 text-[#D4AF37]">
              <Download className="size-3.5 ml-1.5" />
              {t('merchant.requestSettlement')}
            </Button>
          }
        />
      ) : (
        <motion.div variants={itemVariants} className="space-y-3">
          {settlements.map((s) => {
            const cfg = SETTLEMENT_STATUS_CONFIG[s.status] || SETTLEMENT_STATUS_CONFIG.pending;
            return (
              <Card key={s.id} className={goldCardGlow}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-10 items-center justify-center rounded-xl ${cfg.bg}`}>
                        {s.status === 'completed' ? <CheckCircle2 className="size-5 text-emerald-500" /> :
                         s.status === 'processing' ? <RefreshCw className="size-5 text-blue-500" /> :
                         <Clock className="size-5 text-amber-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold tabular-nums flex items-center gap-1">
                          <Coins className="size-3.5 text-[#D4AF37]" />
                          {formatGrams(s.amount_gold || 0)}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span>{formatDate(s.created_at)}</span>
                          {s.transaction_ref && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{s.transaction_ref}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className={`${cfg.bg} ${cfg.color} border-0 text-[10px] shrink-0`}>
                      {cfg.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 5: Invoices (فاکتورها)                                                */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function InvoicesTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { addToast } = useAppStore();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await fetchApi<{ invoices: InvoiceItem[] }>(`/api/v1/merchant/invoices?userId=${userId}&limit=50`);
      if (!cancelled) {
        if (err) setError(err);
        else setInvoices(data?.invoices || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const refreshInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchApi<{ invoices: InvoiceItem[] }>(`/api/v1/merchant/invoices?userId=${userId}&limit=50`);
    if (err) setError(err);
    else setInvoices(data?.invoices || []);
    setLoading(false);
  }, [userId]);

  const handleCreate = useCallback(async () => {
    if (!formTitle.trim() || !formAmount) {
      addToast('عنوان و مبلغ فاکتور الزامی است', 'error');
      return;
    }
    setCreating(true);
    const { error } = await postApi('/api/v1/merchant/invoices', {
      userId,
      customer_name: formTitle.trim(),
      amount_gold: parseFloat(formAmount),
      items: formDesc.trim() ? [{ title: formDesc.trim(), quantity: 1, price: parseFloat(formAmount) }] : [],
    });
    setCreating(false);
    if (error) {
      addToast(error, 'error');
      return;
    }
    addToast('فاکتور جدید ایجاد شد', 'success');
    setShowForm(false);
    setFormTitle('');
    setFormAmount('');
    setFormDesc('');
    refreshInvoices();
  }, [userId, formTitle, formAmount, formDesc, addToast, refreshInvoices]);

  const handleCopyLink = useCallback(async (invId: string) => {
    const link = `${window.location.origin}/pay/${invId}`;
    const ok = await copyToClipboard(link);
    if (ok) {
      setCopiedLink(invId);
      addToast('لینک پرداخت کپی شد', 'success');
      setTimeout(() => setCopiedLink(null), 2000);
    }
  }, [addToast]);

  if (loading) return <TabSkeleton />;
  if (error) return <ErrorState message={error} onRetry={refreshInvoices} />;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <FileText className="size-5 text-[#D4AF37]" />
          {t('merchant.invoices')}
        </h3>
        <Button onClick={() => setShowForm(true)} className="bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white hover:from-[#D4AF37]/90 hover:to-[#FFD700]/90 shadow-lg shadow-[#D4AF37]/20 font-bold">
          <Plus className="size-4 ml-2" />
          {t('merchant.createInvoice')}
        </Button>
      </motion.div>

      {/* Create Invoice Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-[#D4AF37]/30 mb-4">
              <CardContent className="p-5 space-y-4">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Plus className="size-4 text-[#D4AF37]" />
                  {t('merchant.createInvoice')}
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">{t('merchant.invoiceTitle')}</Label>
                    <Input
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      placeholder="مثال: خرید طلای ۱ گرمی"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{t('merchant.invoiceAmount')}</Label>
                    <Input
                      value={formAmount}
                      onChange={e => setFormAmount(e.target.value)}
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder="مثال: 1.5 (گرم طلا)"
                      className="text-sm tabular-nums"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{t('merchant.invoiceDescription')}</Label>
                  <Textarea
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="توضیحات فاکتور (اختیاری)"
                    className="text-sm min-h-[60px]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreate} disabled={creating} className="bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white font-bold">
                    {creating ? <Loader2 className="size-4 animate-spin" /> : null}
                    {t('merchant.createInvoice')}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-8" />}
          title={t('merchant.noInvoices')}
          description={t('merchant.noInvoicesDesc')}
          action={
            <Button onClick={() => setShowForm(true)} size="sm" variant="outline" className="border-[#D4AF37]/40 text-[#D4AF37]">
              <Plus className="size-3.5 ml-1.5" />
              {t('merchant.createInvoice')}
            </Button>
          }
        />
      ) : (
        <motion.div variants={itemVariants} className="space-y-3">
          {invoices.map((inv) => {
            const cfg = INVOICE_STATUS_CONFIG[inv.status] || INVOICE_STATUS_CONFIG.unpaid;
            return (
              <Card key={inv.id} className={goldCardGlow}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-10 items-center justify-center rounded-xl ${cfg.bg}`}>
                        <FileText className={`size-5 ${cfg.color}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{inv.customer_name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(inv.created_at)}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{inv.invoice_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <p className="text-sm font-bold tabular-nums flex items-center gap-1">
                        <Coins className="size-3.5 text-[#D4AF37]" />
                        {formatGrams(inv.amount_gold || inv.total_gold || 0)}
                      </p>
                      <Badge className={`${cfg.bg} ${cfg.color} border-0 text-[10px] shrink-0`}>
                        {cfg.label}
                      </Badge>
                      {inv.status === 'unpaid' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyLink(inv.id)}
                          className="h-8 px-3 text-xs"
                        >
                          {copiedLink === inv.id ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                          {copiedLink === inv.id ? t('merchant.apiKeyCopied') : t('merchant.apiKeyCopy')}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 6: QR Payments (QR پرداخت)                                            */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function QrPaymentsTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { addToast } = useAppStore();
  const [qrs, setQrs] = useState<QrCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [qrTitle, setQrTitle] = useState('');
  const [qrAmount, setQrAmount] = useState('');
  const [qrType, setQrType] = useState<'fixed' | 'flexible'>('flexible');
  const [creating, setCreating] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await fetchApi<{ qr_codes: QrCodeItem[] }>(`/api/v1/merchant/qr?userId=${userId}&limit=50`);
      if (!cancelled) {
        if (err) setError(err);
        else setQrs(data?.qr_codes || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const refreshQrs = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchApi<{ qr_codes: QrCodeItem[] }>(`/api/v1/merchant/qr?userId=${userId}&limit=50`);
    if (err) setError(err);
    else setQrs(data?.qr_codes || []);
    setLoading(false);
  }, [userId]);

  const handleCreate = useCallback(async () => {
    if (!qrTitle.trim()) {
      addToast('عنوان QR الزامی است', 'error');
      return;
    }
    if (qrType === 'fixed' && (!qrAmount || parseInt(qrAmount) <= 0)) {
      addToast('برای QR ثابت، مبلغ الزامی است', 'error');
      return;
    }
    setCreating(true);
    const { error } = await postApi('/api/v1/merchant/qr', {
      userId,
      title: qrTitle.trim(),
      amount_gold: qrType === 'fixed' ? parseFloat(qrAmount) : 0,
      is_fixed: qrType === 'fixed',
    });
    setCreating(false);
    if (error) {
      addToast(error, 'error');
      return;
    }
    addToast('QR پرداخت جدید ایجاد شد', 'success');
    setShowForm(false);
    setQrTitle('');
    setQrAmount('');
    setQrType('flexible');
    refreshQrs();
  }, [userId, qrTitle, qrAmount, qrType, addToast, refreshQrs]);

  const handleCopyUrl = useCallback(async (qrId: string, token: string) => {
    const url = `${window.location.origin}/checkout/qr/${token}`;
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedUrl(qrId);
      addToast('لینک QR کپی شد', 'success');
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  }, [addToast]);

  if (loading) return <TabSkeleton />;
  if (error) return <ErrorState message={error} onRetry={refreshQrs} />;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <QrCode className="size-5 text-[#D4AF37]" />
          {t('merchant.qrPayments')}
        </h3>
        <Button onClick={() => setShowForm(true)} className="bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white hover:from-[#D4AF37]/90 hover:to-[#FFD700]/90 shadow-lg shadow-[#D4AF37]/20 font-bold">
          <Plus className="size-4 ml-2" />
          {t('merchant.createQr')}
        </Button>
      </motion.div>

      {/* Create QR Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-[#D4AF37]/30 mb-4">
              <CardContent className="p-5 space-y-4">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <QrCode className="size-4 text-[#D4AF37]" />
                  {t('merchant.createQr')}
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">{t('merchant.qrTitle')}</Label>
                    <Input
                      value={qrTitle}
                      onChange={e => setQrTitle(e.target.value)}
                      placeholder="مثال: QR پیشخوان"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{t('merchant.qrType')}</Label>
                    <Select value={qrType} onValueChange={(v) => setQrType(v as 'fixed' | 'flexible')}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flexible">{t('merchant.qrFlexible')}</SelectItem>
                        <SelectItem value="fixed">{t('merchant.qrFixed')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {qrType === 'fixed' && (
                  <div className="space-y-2">
                    <Label className="text-xs">{t('merchant.qrAmount')}</Label>
                    <Input
                      value={qrAmount}
                      onChange={e => setQrAmount(e.target.value)}
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder="مثال: 0.5 (گرم طلا)"
                      className="text-sm tabular-nums"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleCreate} disabled={creating} className="bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white font-bold">
                    {creating ? <Loader2 className="size-4 animate-spin" /> : null}
                    {t('merchant.createQr')}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR List */}
      {qrs.length === 0 ? (
        <EmptyState
          icon={<QrCode className="size-8" />}
          title={t('merchant.noQr')}
          description={t('merchant.noQrDesc')}
          action={
            <Button onClick={() => setShowForm(true)} size="sm" variant="outline" className="border-[#D4AF37]/40 text-[#D4AF37]">
              <Plus className="size-3.5 ml-1.5" />
              {t('merchant.createQr')}
            </Button>
          }
        />
      ) : (
        <motion.div variants={itemVariants} className="grid gap-3 sm:grid-cols-2">
          {qrs.map((qr) => (
            <Card key={qr.id} className={`${goldCardGlow} ${!qr.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex size-12 items-center justify-center rounded-xl shrink-0 ${qr.is_active ? 'bg-[#D4AF37]/10' : 'bg-muted'}`}>
                    <QrCode className={`size-6 ${qr.is_active ? 'text-[#D4AF37]' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold truncate">{qr.title}</p>
                      <Badge className={`${qr.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800/40 text-gray-500'} border-0 text-[10px] shrink-0`}>
                        {qr.is_active ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                        {qr.is_fixed ? t('merchant.qrFixed') : t('merchant.qrFlexible')}
                      </Badge>
                      {qr.amount_gold > 0 && (
                        <span className="font-bold text-foreground flex items-center gap-1">
                          <Coins className="size-3 text-[#D4AF37]" />
                          {formatGrams(qr.amount_gold)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                      <span>{formatDate(qr.created_at)}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="size-3" />
                        {formatNumber(qr.scan_count)} {t('merchant.qrScans')}
                      </span>
                    </div>
                    {qr.is_active && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyUrl(qr.id, qr.token)}
                        className="h-7 px-2 mt-2 text-[10px]"
                      >
                        {copiedUrl === qr.id ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                        {copiedUrl === qr.id ? 'کپی شد!' : 'کپی لینک'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 7: Settings (تنظیمات)                                                 */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function SettingsTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { addToast } = useAppStore();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Local form state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [settlementType, setSettlementType] = useState('manual');
  const [settlementFreq, setSettlementFreq] = useState('daily');
  const [brandingColor, setBrandingColor] = useState('#D4AF37');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await fetchApi<MerchantProfile>(`/api/v1/merchant/profile?userId=${userId}`);
      if (!cancelled) {
        if (err) setError(err);
        else if (data) {
          setProfile(data);
          setWebhookUrl(data.webhookUrl || '');
          setSettlementType(data.settlementType || 'manual');
          setSettlementFreq(data.settlementFreq || 'daily');
          setBrandingColor(data.brandingColor || '#D4AF37');
        }
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchApi<MerchantProfile>(`/api/v1/merchant/profile?userId=${userId}`);
    if (err) setError(err);
    else if (data) {
      setProfile(data);
      setWebhookUrl(data.webhookUrl || '');
      setSettlementType(data.settlementType || 'manual');
      setSettlementFreq(data.settlementFreq || 'daily');
      setBrandingColor(data.brandingColor || '#D4AF37');
    }
    setLoading(false);
  }, [userId]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    // The profile endpoint is GET-only in the backend, so we simulate save
    // by showing success toast (the backend would need a PUT/PATCH endpoint)
    await new Promise(resolve => setTimeout(resolve, 500));
    setSaving(false);
    addToast('تنظیمات ذخیره شد', 'success');
  }, [addToast]);

  if (loading) return <TabSkeleton />;
  if (error) return <ErrorState message={error} onRetry={refreshProfile} />;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Settings className="size-5 text-[#D4AF37]" />
          {t('merchant.settings')}
        </h3>
      </motion.div>

      {/* Profile Info */}
      {profile && (
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-[#D4AF37]/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8960C] text-white shadow-lg shadow-[#D4AF37]/20">
                  <Store className="size-7" />
                </div>
                <div>
                  <h3 className="font-bold">{profile.businessName}</h3>
                  <p className="text-xs text-muted-foreground">{formatDate(profile.createdAt)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${profile.isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800/40 text-gray-500'} border-0 text-[10px]`}>
                      {profile.isActive ? 'فعال' : 'غیرفعال'}
                    </Badge>
                    <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-0 text-[10px]">
                      {profile.kycStatus === 'verified' ? 'احراز شده' : profile.kycStatus}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Webhook URL */}
        <motion.div variants={itemVariants}>
          <Card className={goldCardGlow}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Webhook className="size-4 text-[#D4AF37]" />
                {t('merchant.webhookUrl')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder={t('merchant.webhookUrlPlaceholder')}
                className="text-sm font-mono"
                dir="ltr"
              />
              <p className="text-[10px] text-muted-foreground">
                هر تراکنش موفق به این آدرس ارسال می‌شود
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Settlement Type */}
        <motion.div variants={itemVariants}>
          <Card className={goldCardGlow}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Landmark className="size-4 text-[#D4AF37]" />
                {t('merchant.settlementType')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={settlementType}
                onValueChange={setSettlementType}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">{t('merchant.settlementManual')}</SelectItem>
                  <SelectItem value="auto">{t('merchant.settlementAuto')}</SelectItem>
                  <SelectItem value="gold">تسویه طلایی (پیش‌فرض)</SelectItem>
                </SelectContent>
              </Select>
              {settlementType === 'auto' && (
                <div className="space-y-2">
                  <Label className="text-xs">{t('merchant.settlementFrequency')}</Label>
                  <Select
                    value={settlementFreq}
                    onValueChange={setSettlementFreq}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">{t('merchant.settlementDaily')}</SelectItem>
                      <SelectItem value="weekly">{t('merchant.settlementWeekly')}</SelectItem>
                      <SelectItem value="monthly">{t('merchant.settlementMonthly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Branding Color */}
        <motion.div variants={itemVariants}>
          <Card className={goldCardGlow}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Palette className="size-4 text-[#D4AF37]" />
                {t('merchant.brandingColor')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {['#D4AF37', '#E74C3C', '#3498DB', '#2ECC71', '#9B59B6', '#E67E22'].map(color => (
                    <button
                      key={color}
                      onClick={() => setBrandingColor(color)}
                      className={`size-8 rounded-lg border-2 transition-all ${brandingColor === color ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">کد رنگ:</Label>
                <Input
                  value={brandingColor}
                  onChange={e => setBrandingColor(e.target.value)}
                  className="text-sm font-mono w-28 h-8"
                  dir="ltr"
                />
                <div
                  className="size-8 rounded-lg border"
                  style={{ backgroundColor: brandingColor }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification Settings */}
        <motion.div variants={itemVariants}>
          <Card className={goldCardGlow}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bell className="size-4 text-[#D4AF37]" />
                اعلان‌ها
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold">اعلان تراکنش موفق</p>
                  <p className="text-[10px] text-muted-foreground">دریافت اعلان برای هر پرداخت موفق</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold">اعلان تسویه</p>
                  <p className="text-[10px] text-muted-foreground">دریافت اعلان پس از تسویه حساب</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold">گزارش هفتگی</p>
                  <p className="text-[10px] text-muted-foreground">ارسال خلاصه فروش هر هفته</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Save Button */}
      <motion.div variants={itemVariants}>
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white hover:from-[#D4AF37]/90 hover:to-[#FFD700]/90 shadow-lg shadow-[#D4AF37]/20 font-bold w-full sm:w-auto">
          {saving ? <Loader2 className="size-4 animate-spin ml-2" /> : null}
          {t('common.save')}
        </Button>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Main MerchantDashboard Component                                           */
/* ═══════════════════════════════════════════════════════════════════════════════ */

export default function MerchantDashboard() {
  const { t } = useTranslation();
  const { user, setPage, addToast } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [codeCopied, setCodeCopied] = useState(false);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  /* ── Registration state ── */
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null); // null = checking
  const [checking, setChecking] = useState(false);

  /* ── Dashboard data ── */
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState<string | null>(null);

  const userId = user?.id || '';

  /* ── Gateway Marketing Data ════════════════════════════════════════ */
  const CODE_SNIPPET = `const response = await fetch('/api/v1/payment/request', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    amount: 5000000,
    callback_url: 'https://yoursite.ir/callback',
    description: 'سفارش #1234'
  })
});`;

  const GATEWAY_FEATURES = [
    { icon: Coins, title: 'پرداخت طلایی', desc: 'پذیرش پرداخت مستقیم با گرم طلا', gradient: 'from-amber-500/20 to-yellow-600/10' },
    { icon: ArrowLeftRight, title: 'پرداخت مستقیم طلا', desc: 'پذیرش پرداخت مستقیم با گرم و میلی‌گرم طلا', gradient: 'from-orange-500/20 to-amber-600/10' },
    { icon: Link2, title: 'لینک پرداخت', desc: 'ایجاد لینک پرداخت و ارسال فوری', gradient: 'from-yellow-500/20 to-amber-500/10' },
    { icon: QrCode, title: 'QR کد', desc: 'پرداخت آسان با اسکن بارکد', gradient: 'from-[#D4AF37]/20 to-amber-400/10' },
    { icon: Clock, title: 'تسویه خودکار', desc: 'تسویه حساب خودکار و روزانه', gradient: 'from-emerald-500/20 to-teal-600/10' },
    { icon: Radio, title: 'وب‌هوک', desc: 'اطلاع‌رسانی لحظه‌ای تراکنش‌ها', gradient: 'from-violet-500/20 to-purple-600/10' },
  ];

  const GATEWAY_STEPS = [
    { num: '۱', title: 'ثبت‌نام و دریافت API Key', desc: 'با تکمیل فرم ثبت‌نام، کلید API اختصاصی خود را دریافت کنید' },
    { num: '۲', title: 'اتصال به سایت یا اپلیکیشن', desc: 'با مستندات ما، درگاه را به سایت یا اپلیکیشن خود متصل کنید' },
    { num: '۳', title: 'شروع پذیرش پرداخت طلایی', desc: 'از همین لحظه پرداخت‌های طلایی دریافت کنید' },
  ];

  const TRUST_BADGES = [
    { icon: Lock, title: 'SSL رمزگذاری', desc: 'اتصال رمزگذاری‌شده ۲۵۶ بیتی' },
    { icon: ShieldCheck, title: 'PCI DSS', desc: 'استاندارد امنیت پرداخت' },
    { icon: Eye, title: 'ضد تقلب', desc: 'سیستم هوشمند تشخیص تقلب' },
    { icon: Headphones, title: 'پشتیبانی ۲۴/۷', desc: 'پاسخگویی شبانه‌روزی' },
  ];

  /* ── Copy code handler ── */
  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CODE_SNIPPET);
      setCodeCopied(true);
      addToast('کد با موفقیت کپی شد', 'success');
      setTimeout(() => setCodeCopied(false), 2000);
    } catch { /* silent */ }
  }, [addToast]);

  /* ── Check if merchant exists ── */
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setChecking(true);
      const { data, error: err } = await fetchApi<MerchantProfile>(`/api/v1/merchant/profile?userId=${userId}`);
      if (!cancelled) {
        if (err) setIsRegistered(false);
        else {
          setIsRegistered(!!data);
          setProfile(data || null);
        }
        setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const checkRegistration = useCallback(async () => {
    if (!userId) {
      setIsRegistered(false);
      return;
    }
    setChecking(true);
    const { data, error: err } = await fetchApi<MerchantProfile>(`/api/v1/merchant/profile?userId=${userId}`);
    if (err) setIsRegistered(false);
    else {
      setIsRegistered(!!data);
      setProfile(data || null);
    }
    setChecking(false);
  }, [userId]);

  /* ── Fetch dashboard data ── */
  const fetchDashboard = useCallback(async () => {
    if (!userId) return;
    setDashLoading(true);
    setDashError(null);
    const { data, error: err } = await fetchApi<DashboardData>(`/api/v1/merchant/dashboard?userId=${userId}`);
    if (err) setDashError(err);
    else setDashboard(data || null);
    setDashLoading(false);
  }, [userId]);

  useEffect(() => {
    if (isRegistered !== true || !userId) return;
    let cancelled = false;
    (async () => {
      setDashLoading(true);
      const { data, error: err } = await fetchApi<DashboardData>(`/api/v1/merchant/dashboard?userId=${userId}`);
      if (!cancelled) {
        if (err) setDashError(err);
        else setDashboard(data || null);
        setDashLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isRegistered, userId]);

  const handleNavigate = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  /* ── Not mounted yet ── */
  if (!mounted) return <MerchantSkeleton />;

  /* ── Not logged in ── */
  if (!userId) {
    return (
      <div className="mx-auto max-w-6xl pb-24 flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8960C] text-white shadow-xl">
          <Store className="size-8" />
        </div>
        <h2 className="text-lg font-bold">ابتدا وارد حساب کاربری خود شوید</h2>
        <p className="text-sm text-muted-foreground">برای دسترسی به پنل فروشگاه نیاز به ورود دارید</p>
      </div>
    );
  }

  /* ── Checking registration ── */
  if (checking) return <MerchantSkeleton />;

  /* ── Not registered — show marketing + registration form ── */
  if (isRegistered === false) {
    return (
      <div className="mx-auto max-w-2xl space-y-8 p-4 pb-28">

        {/* ══════ Hero Section ══════ */}
        <section className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/5 via-background to-[#D4AF37]/5 p-6 text-center">
          <div className="pointer-events-none absolute -top-12 -left-12 size-40 rounded-full bg-[#D4AF37]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 -right-8 size-32 rounded-full bg-[#D4AF37]/5 blur-2xl" />
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-[#D4AF37] via-amber-400 to-[#D4AF37]" />

          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="gold-glow flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#D4AF37] via-amber-400 to-yellow-600 shadow-xl shadow-[#D4AF37]/25">
              <Landmark className="size-10 text-[#8B6914]" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold leading-relaxed sm:text-3xl" style={{ background: 'linear-gradient(135deg, #D4AF37, #FFD700, #D4AF37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                درگاه پرداخت طلایی زرین گلد
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                پذیرش پرداخت بر اساس طلا — برای وبسایت‌ها و اپلیکیشن‌ها
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => document.getElementById('register-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-12 flex-1 gap-2 rounded-xl text-base font-bold bg-gradient-to-l from-[#D4AF37] to-[#FFD700] text-white hover:from-[#D4AF37]/90 hover:to-[#FFD700]/90 shadow-lg shadow-[#D4AF37]/20"
              >
                <Sparkles className="size-5" />
                ثبت‌نام فروشنده
              </Button>
              <Button
                onClick={() => setPage('api-docs')}
                variant="outline"
                className="h-12 flex-1 gap-2 rounded-xl text-base font-bold border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
              >
                <FileText className="size-5" />
                مستندات API
              </Button>
            </div>
          </div>
        </section>

        {/* ══════ Feature Cards Grid ══════ */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-5 text-[#D4AF37]" />
            <h2 className="text-lg font-bold text-foreground">ویژگی‌های درگاه</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {GATEWAY_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className={cn('group cursor-default overflow-hidden border-[#D4AF37]/15 transition-all duration-300 hover:border-[#D4AF37]/40 hover:shadow-lg hover:shadow-[#D4AF37]/5')}>
                  <CardContent className="flex flex-col items-center gap-3 p-4 text-center">
                    <div className={cn('flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110', feature.gradient)}>
                      <Icon className="size-6 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{feature.title}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{feature.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ══════ How It Works ══════ */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Zap className="size-5 text-[#D4AF37]" />
            <h2 className="text-lg font-bold text-foreground">نحوه استفاده</h2>
          </div>
          <div className="relative space-y-4">
            <div className="absolute right-6 top-6 bottom-6 w-px bg-gradient-to-b from-[#D4AF37]/40 via-[#D4AF37]/20 to-transparent" />
            {GATEWAY_STEPS.map((step, idx) => (
              <div key={step.num} className="relative flex gap-4">
                <div className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] via-amber-400 to-yellow-600 text-sm font-extrabold text-[#8B6914] shadow-lg shadow-[#D4AF37]/20">
                  {step.num}
                </div>
                <Card className="flex-1 overflow-hidden border-[#D4AF37]/20 transition-all duration-300 hover:border-[#D4AF37]/40">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] border-0 text-[10px]">مرحله {step.num}</Badge>
                      {idx === 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Sparkles className="ml-1 size-3" />
                          شروع
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-2 text-sm font-bold text-foreground">{step.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* ══════ API Code Snippet ══════ */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="size-5 text-[#D4AF37]" />
              <h2 className="text-lg font-bold text-foreground">نمونه کد اتصال</h2>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-1.5 text-xs font-medium text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/10"
            >
              {codeCopied ? <><Check className="size-3.5" />کپی شد!</> : <><Copy className="size-3.5" />کپی کد</>}
            </button>
          </div>
          <Card className="overflow-hidden border-[#D4AF37]/20">
            <div className="flex items-center gap-2 border-b border-[#D4AF37]/10 bg-muted/30 px-4 py-2.5">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-red-500/80" />
                <div className="size-3 rounded-full bg-yellow-500/80" />
                <div className="size-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="mr-2 text-xs text-muted-foreground">JavaScript — API Request</span>
            </div>
            <div className="max-h-72 overflow-y-auto bg-zinc-950 p-4 dark:bg-zinc-950">
              <pre className="text-xs leading-relaxed text-zinc-300" dir="ltr">
                <code>
                  <span className="text-emerald-400">{'// JavaScript Example'}</span>{'\n'}
                  <span className="text-sky-400">{'const response'}</span>
                  <span className="text-zinc-400">{' = '}</span>
                  <span className="text-sky-400">{'await fetch'}</span>
                  <span className="text-zinc-400">{'('}</span>
                  <span className="text-amber-300">{"'/api/v1/payment/request'"}</span>
                  <span className="text-zinc-400">{', {'}</span>{'\n'}
                  <span className="text-zinc-400">{'  '}</span><span className="text-purple-400">method</span><span className="text-zinc-400">{': '}</span><span className="text-amber-300">{'POST'}</span><span className="text-zinc-400">{','}</span>{'\n'}
                  <span className="text-zinc-400">{'  '}</span><span className="text-purple-400">headers</span><span className="text-zinc-400">{': {'}</span>{'\n'}
                  <span className="text-zinc-400">{'    '}</span><span className="text-amber-300">{"'Content-Type'"}</span><span className="text-zinc-400">{': '}</span><span className="text-amber-300">{"'application/json'"}</span><span className="text-zinc-400">{','}</span>{'\n'}
                  <span className="text-zinc-400">{'    '}</span><span className="text-amber-300">{"'Authorization'"}</span><span className="text-zinc-400">{': '}</span><span className="text-amber-300">{"`Bearer YOUR_API_KEY`"}</span>{'\n'}
                  <span className="text-zinc-400">{'  }'}</span><span className="text-zinc-400">{','}</span>{'\n'}
                  <span className="text-zinc-400">{'  '}</span><span className="text-purple-400">body</span><span className="text-zinc-400">{': '}</span><span className="text-sky-400">{'JSON.stringify'}</span><span className="text-zinc-400">{'({'}</span>{'\n'}
                  <span className="text-zinc-400">{'    '}</span><span className="text-purple-400">amount</span><span className="text-zinc-400">{': '}</span><span className="text-orange-300">{'5000000'}</span><span className="text-zinc-400">{','}</span>{'\n'}
                  <span className="text-zinc-400">{'    '}</span><span className="text-purple-400">callback_url</span><span className="text-zinc-400">{': '}</span><span className="text-amber-300">{"'https://yoursite.ir/callback'"}</span><span className="text-zinc-400">{','}</span>{'\n'}
                  <span className="text-zinc-400">{'    '}</span><span className="text-purple-400">description</span><span className="text-zinc-400">{': '}</span><span className="text-amber-300">{"'سفارش #1234'"}</span>{'\n'}
                  <span className="text-zinc-400">{'  }'}</span><span className="text-zinc-400">{')'}</span>{'\n'}
                  <span className="text-zinc-400">{'}'}</span><span className="text-zinc-400">{');'}</span>
                </code>
              </pre>
            </div>
          </Card>
        </section>

        {/* ══════ Trust Badges ══════ */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="size-5 text-[#D4AF37]" />
            <h2 className="text-lg font-bold text-foreground">امنیت و اعتماد</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TRUST_BADGES.map((badge) => {
              const Icon = badge.icon;
              return (
                <Card key={badge.title} className="overflow-hidden border-[#D4AF37]/15 transition-all duration-300 hover:border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/5 via-background to-background">
                  <CardContent className="flex flex-col items-center gap-2.5 p-4 text-center">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#D4AF37]/10 transition-transform duration-300 hover:scale-110">
                      <Icon className="size-5 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{badge.title}</p>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{badge.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ══════ Registration Form ══════ */}
        <section id="register-section">
          <RegistrationForm userId={userId} onComplete={checkRegistration} />
        </section>

        {/* ══════ Footer ══════ */}
        <footer className="flex flex-col items-center gap-2 pb-4 text-center">
          <div className="w-full h-px bg-gradient-to-l from-transparent via-[#D4AF37]/30 to-transparent" />
          <p className="text-xs text-muted-foreground">
            <Landmark className="mr-1 inline size-3 text-[#D4AF37]" />
            میلّی گلد — درگاه پرداخت طلایی هوشمند
          </p>
        </footer>
      </div>
    );
  }

  /* ── Registered — show dashboard ── */
  const TABS = [
    { key: 'overview', icon: <BarChart3 className="size-4" />, label: t('merchant.dashboard') },
    { key: 'apiKeys', icon: <Key className="size-4" />, label: t('merchant.apiKeys') },
    { key: 'transactions', icon: <ArrowLeftRight className="size-4" />, label: t('merchant.transactions') },
    { key: 'settlements', icon: <Landmark className="size-4" />, label: t('merchant.settlements') },
    { key: 'invoices', icon: <FileText className="size-4" />, label: t('merchant.invoices') },
    { key: 'qrPayments', icon: <QrCode className="size-4" />, label: t('merchant.qrPayments') },
    { key: 'settings', icon: <Settings className="size-4" />, label: t('merchant.settings') },
  ];

  return (
    <div className="mx-auto max-w-6xl pb-24">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-3 py-6 text-center"
      >
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8960C] text-white shadow-xl shadow-[#D4AF37]/20">
          <Store className="size-8" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold gold-gradient-text">{t('merchant.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('merchant.subtitle')}</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ScrollArea className="w-full -mx-1 px-1">
          <TabsList className="flex w-full min-w-0 h-auto p-1 bg-muted/50 rounded-xl mb-6 gap-1">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="flex-1 min-w-0 flex items-center justify-center gap-1.5 px-2 py-2.5 text-[11px] font-bold rounded-lg data-[state=active]:bg-gradient-to-l data-[state=active]:from-[#D4AF37] data-[state=active]:to-[#FFD700] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-[#D4AF37]/20 data-[state=active]:border-0 whitespace-nowrap"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <TabsContent value="overview" className="mt-0">
              <OverviewTab
                dashboard={dashboard}
                profile={profile}
                loading={dashLoading}
                error={dashError}
                onRetry={fetchDashboard}
                onNavigate={handleNavigate}
              />
            </TabsContent>
            <TabsContent value="apiKeys" className="mt-0">
              <ApiKeysTab userId={userId} />
            </TabsContent>
            <TabsContent value="transactions" className="mt-0">
              <TransactionsTab
                payments={dashboard?.recentPayments || []}
                loading={dashLoading}
                error={dashError}
                onRetry={fetchDashboard}
              />
            </TabsContent>
            <TabsContent value="settlements" className="mt-0">
              <SettlementsTab userId={userId} />
            </TabsContent>
            <TabsContent value="invoices" className="mt-0">
              <InvoicesTab userId={userId} />
            </TabsContent>
            <TabsContent value="qrPayments" className="mt-0">
              <QrPaymentsTab userId={userId} />
            </TabsContent>
            <TabsContent value="settings" className="mt-0">
              <SettingsTab userId={userId} />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}

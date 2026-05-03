
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {LayoutDashboard, Key, BookOpen, Puzzle, Wrench, FileText, Eye, EyeOff, Copy, Check, Link2, AlertCircle, CheckCircle2, Clock, Loader2, MessageCircle, Store, Globe, ChevronDown, ChevronUp, Shield, Send, Download, ExternalLink, Terminal, Hash, Receipt, FileBarChart, Filter, Search, ArrowUpDown, Calendar, RefreshCw, XCircle, ChevronLeft, ChevronRight, Info, DollarSign, TrendingUp, Users, Crown, Zap} from 'lucide-react';
import {useAppStore} from '@/lib/store';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {ScrollArea} from '@/components/ui/scroll-area';
import {cn} from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MerchantData {
  id: string;
  businessName: string;
  website?: string;
  callbackUrl: string;
  apiKey: string;
  apiSecret: string;
  feePercent: number;
  isActive: boolean;
  totalPayments: number;
  totalVolume: number;
  description?: string;
  createdAt: string;
}

interface PaymentItem {
  id: string;
  amountGrams: number;
  amountFiat: number;
  feeGrams: number;
  goldPrice: number;
  description: string;
  merchantOrderId: string;
  status: string;
  callbackStatus: string | null;
  callbackAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

interface PaymentStats {
  totalPaid: number;
  totalPaidAmount: number;
  totalPending: number;
  totalFailed: number;
  todayPayments: number;
  todayVolume: number;
  totalFees: number;
}

interface AdminOverview {
  isAdmin: boolean;
  stats: {
    totalMerchants: number;
    activeMerchants: number;
    totalPayments: number;
    totalVolume: number;
    totalFees: number;
    todayPayments: number;
    todayVolume: number;
  };
  merchants: Array<{
    id: string;
    businessName: string;
    website?: string;
    isActive: boolean;
    totalPayments: number;
    totalVolume: number;
    feePercent: number;
    createdAt: string;
    paymentsCount: number;
  }>;
  recentPayments: Array<PaymentItem & { merchantName?: string; merchantId?: string }>;
  recentSettlements: Array<Record<string, unknown>>;
}

type TabId = 'dashboard' | 'transactions' | 'financial' | 'api-keys' | 'api-docs' | 'integration' | 'tools' | 'application';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const TABS: TabDef[] = [
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { id: 'transactions', label: 'تراکنش‌ها', icon: Receipt },
  { id: 'financial', label: 'اسناد مالی', icon: FileBarChart },
  { id: 'api-keys', label: 'کلیدهای API', icon: Key },
  { id: 'api-docs', label: 'مستندات API', icon: BookOpen },
  { id: 'integration', label: 'راهنمای ادغام', icon: Puzzle },
  { id: 'tools', label: 'ابزارها و SDK', icon: Wrench },
  { id: 'application', label: 'درخواست پذیرندگی', icon: FileText },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatNumber(n: number): string {
  return n.toLocaleString('fa-IR');
}

function maskedKey(key: string): string {
  if (!key || key.length < 12) return key;
  return key.slice(0, 8) + '••••••••' + key.slice(-4);
}

/* helper: format date to Persian locale */
function formatPersianDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/* helper: shorten id */
function shortId(id: string): string {
  if (!id || id.length <= 12) return id;
  return id.slice(0, 8) + '…';
}

/* ------------------------------------------------------------------ */
/*  Code Snippets                                                      */
/* ------------------------------------------------------------------ */

const PHP_CREATE = `<?php
$ch = curl_init('https://zarringold.com/api/gateway/pay/create');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    'X-API-Key: YOUR_API_KEY',
    'Content-Type: application/json',
  ],
  CURLOPT_POSTFIELDS => json_encode([
    'apiSecret' => 'YOUR_API_SECRET',
    'amountFiat' => 500000, // مبلغ به واحد طلایی
    'goldPrice' => 35000000, // قیمت طلا
    'merchantOrderId' => 'ORDER-123',
    'callbackUrl' => 'https://yoursite.com/callback',
    'description' => 'خرید محصول',
  ]),
]);
$response = json_decode(curl_exec($ch), true);
if ($response['success']) {
  header('Location: ' . $response['payment']['paymentUrl']);
}`;

const NODE_CREATE = `const response = await fetch('https://zarringold.com/api/gateway/pay/create', {
  method: 'POST',
  headers: {
    'X-API-Key': 'YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    apiSecret: 'YOUR_API_SECRET',
    amountFiat: 500000,
    goldPrice: 35000000,
    merchantOrderId: 'ORDER-123',
    callbackUrl: 'https://yoursite.com/callback',
    description: 'خرید محصول',
  }),
});
const data = await response.json();
// Redirect: res.redirect(data.payment.paymentUrl);`;

const PYTHON_CREATE = `import requests

response = requests.post(
    'https://zarringold.com/api/gateway/pay/create',
    headers={
        'X-API-Key': 'YOUR_API_KEY',
        'Content-Type': 'application/json',
    },
    json={
        'apiSecret': 'YOUR_API_SECRET',
        'amountFiat': 500000,
        'goldPrice': 35000000,
        'merchantOrderId': 'ORDER-123',
        'callbackUrl': 'https://yoursite.com/callback',
    },
)
data = response.json()
# Redirect: return redirect(data['payment']['paymentUrl'])`;

const CURL_CREATE = `curl -X POST https://zarringold.com/api/gateway/pay/create \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiSecret": "YOUR_API_SECRET",
    "amountFiat": 500000,
    "goldPrice": 35000000,
    "merchantOrderId": "ORDER-123",
    "callbackUrl": "https://yoursite.com/callback"
  }'`;

const PHP_WEBHOOK = `<?php
$payload = json_decode(file_get_contents('php://input'), true);
if ($payload['status'] === 'paid') {
  $paymentId = $payload['paymentId'];
  $orderId = $payload['merchantOrderId'];
  
  // Verify payment via API
  $ch = curl_init("https://zarringold.com/api/gateway/pay/{$paymentId}/status?apiSecret=YOUR_API_SECRET");
  curl_setopt($ch, CURLOPT_HTTPHEADER, ['X-API-Key: YOUR_API_KEY']);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  $verify = json_decode(curl_exec($ch), true);
  
  if ($verify['success'] && $verify['payment']['status'] === 'paid') {
    // Mark order as paid
    markOrderPaid($orderId, $paymentId);
  }
}
http_response_code(200);
echo json_encode(['success' => true]);`;

const NODE_WEBHOOK = `app.post('/callback', async (req, res) => {
  const { paymentId, merchantOrderId, status, amountGrams } = req.body;
  
  if (status === 'paid') {
    // Verify payment via API
    const verify = await fetch(
      \`https://zarringold.com/api/gateway/pay/\${paymentId}/status?apiSecret=YOUR_API_SECRET\`,
      { headers: { 'X-API-Key': 'YOUR_API_KEY' } }
    );
    const result = await verify.json();
    
    if (result.success && result.payment.status === 'paid') {
      await markOrderPaid(merchantOrderId, paymentId);
    }
  }
  
  res.status(200).json({ success: true });
});`;

const NODE_VERIFY = `const verify = await fetch(
  \`https://zarringold.com/api/gateway/pay/\${paymentId}/status?apiSecret=YOUR_API_SECRET\`,
  { headers: { 'X-API-Key': 'YOUR_API_KEY' } }
);
const result = await verify.json();

if (result.success && result.payment.status === 'paid') {
  // پرداخت تأیید شده — سفارش را تکمیل کنید
  await fulfillOrder(result.payment);
} else {
  // پرداخت ناموفق یا نامعتبر
  await cancelOrder(result.payment);
}`;

/* ------------------------------------------------------------------ */
/*  API Documentation                                                  */
/* ------------------------------------------------------------------ */

interface ApiEndpoint {
  title: string;
  method: 'POST' | 'GET';
  path: string;
  description: string;
  headers?: { key: string; value: string }[];
  body?: string;
  response?: string;
}

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    title: 'ایجاد پرداخت',
    method: 'POST',
    path: '/api/gateway/pay/create',
    description: 'یک پرداخت جدید ایجاد کرده و آدرس صفحه پرداخت را دریافت کنید. پس از ایجاد، کاربر باید به paymentUrl هدایت شود.',
    headers: [
      { key: 'X-API-Key', value: 'YOUR_API_KEY' },
      { key: 'Content-Type', value: 'application/json' },
    ],
    body: JSON.stringify(
      {
        apiSecret: 'YOUR_API_SECRET',
        amountGrams: 0.5,
        amountFiat: 500000,
        goldPrice: 35000000,
        merchantOrderId: 'ORDER-123',
        callbackUrl: 'https://yoursite.com/callback',
        description: 'خرید محصول',
      },
      null,
      2
    ),
    response: JSON.stringify(
      {
        success: true,
        payment: {
          id: 'pay_abc123',
          paymentUrl: 'https://zarringold.com/pay/pay_abc123',
          amountGrams: 0.5,
          status: 'pending',
          expiresAt: '2024-12-15T15:00:00Z',
        },
      },
      null,
      2
    ),
  },
  {
    title: 'بررسی وضعیت',
    method: 'GET',
    path: '/api/gateway/pay/:id/status?apiSecret=xxx',
    description: 'وضعیت فعلی پرداخت را بررسی کنید. برای تأیید پرداخت پس از دریافت وب‌هوک استفاده می‌شود.',
    headers: [{ key: 'X-API-Key', value: 'YOUR_API_KEY' }],
    response: JSON.stringify(
      {
        success: true,
        payment: {
          id: 'pay_abc123',
          status: 'paid',
          amountGrams: 0.5,
          amountFiat: 500000,
          paidAt: '2024-12-15T14:30:00Z',
        },
      },
      null,
      2
    ),
  },
  {
    title: 'انجام پرداخت',
    method: 'POST',
    path: '/api/gateway/pay/:id/execute',
    description: 'کاربر با این درخواست پرداخت را از کیف پول طلایی خود انجام می‌دهد.',
    body: JSON.stringify({ userId: 'user_xyz' }, null, 2),
    response: JSON.stringify(
      {
        success: true,
        payment: { id: 'pay_abc123', status: 'paid', referenceId: 'ref_789' },
      },
      null,
      2
    ),
  },
  {
    title: 'لغو پرداخت',
    method: 'POST',
    path: '/api/gateway/pay/:id/cancel',
    description: 'پرداخت در حال انتظار را لغو کنید. فقط پرداخت‌هایی با وضعیت pending قابل لغو هستند.',
    body: JSON.stringify({ userId: 'user_xyz' }, null, 2),
    response: JSON.stringify({ success: true, message: 'پرداخت لغو شد' }, null, 2),
  },
  {
    title: 'جزئیات پرداخت',
    method: 'GET',
    path: '/api/gateway/pay/:id/detail',
    description: 'جزئیات کامل پرداخت شامل اطلاعات فروشنده، مبلغ و وضعیت را دریافت کنید.',
    headers: [{ key: 'Authorization', value: 'Bearer YOUR_TOKEN' }],
    response: JSON.stringify(
      {
        success: true,
        payment: {
          id: 'pay_abc123',
          status: 'paid',
          amountGrams: 0.5,
          amountFiat: 500000,
          goldPrice: 35000000,
          feeGrams: 0.005,
          merchantOrderId: 'ORDER-123',
          merchant: { businessName: 'فروشگاه طلای نوین', website: 'https://example.com' },
          createdAt: '2024-12-15T14:00:00Z',
          paidAt: '2024-12-15T14:30:00Z',
          expiresAt: '2024-12-15T15:00:00Z',
        },
      },
      null,
      2
    ),
  },
];

const WEBHOOK_DOC = {
  body: JSON.stringify(
    {
      paymentId: 'pay_abc123',
      merchantOrderId: 'ORDER-123',
      status: 'paid',
      amountGrams: 0.5,
      amountFiat: 500000,
      paidAt: '2024-12-15T14:30:00Z',
    },
    null,
    2
  ),
  expectedResponse: JSON.stringify({ success: true }, null, 2),
};

/* ------------------------------------------------------------------ */
/*  Reusable: Copy Button                                              */
/* ------------------------------------------------------------------ */

function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800',
        className
      )}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      <span>{copied ? 'کپی شد!' : 'کپی'}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable: Code Block                                               */
/* ------------------------------------------------------------------ */

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <div className="relative rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/60 border-b border-zinc-800">
        <Badge variant="outline" className="text-[10px] font-mono border-zinc-700 text-zinc-400 bg-zinc-800 hover:bg-zinc-800">
          {language}
        </Badge>
        <CopyBtn text={code} />
      </div>
      <pre className="p-4 overflow-x-auto max-h-72">
        <code className="text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre" dir="ltr">
          {code}
        </code>
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Registration Form                                                  */
/* ------------------------------------------------------------------ */

function RegistrationForm({ onSuccess }: { onSuccess: () => void }) {
  const { token, addToast } = useAppStore();
  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!businessName.trim()) e.businessName = 'نام کسب‌وکار الزامی است';
    if (!callbackUrl.trim()) e.callbackUrl = 'آدرس Callback الزامی است';
    if (callbackUrl && !callbackUrl.startsWith('https://')) {
      e.callbackUrl = 'آدرس Callback باید با https:// شروع شود';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/gateway/merchant/register', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, website, callbackUrl, description }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('ثبت‌نام با موفقیت انجام شد', 'success');
        onSuccess();
      } else {
        addToast(data.error || 'خطا در ثبت‌نام فروشنده', 'error');
      }
    } catch {
      addToast('خطا در ثبت‌نام فروشنده', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-foreground mb-1">ثبت‌نام فروشنده</h3>
        <p className="text-sm text-muted-foreground mb-6">
          با ثبت‌نام به عنوان فروشنده، درگاه پرداخت طلایی دریافت کنید و مشتریان شما بتوانند با طلای دیجیتال پرداخت کنند.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Business name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              نام کسب‌وکار <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all placeholder:text-muted-foreground/40"
              placeholder="مثلاً فروشگاه طلای نوین"
              dir="ltr"
            />
            {errors.businessName && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="size-3" /> {errors.businessName}
              </p>
            )}
          </div>

          {/* Website */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">وبسایت (اختیاری)</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all placeholder:text-muted-foreground/40"
              placeholder="https://example.com"
              dir="ltr"
            />
          </div>

          {/* Callback URL */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              آدرس Callback (Webhook) <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={callbackUrl}
              onChange={(e) => setCallbackUrl(e.target.value)}
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all placeholder:text-muted-foreground/40"
              placeholder="https://example.com/callback"
              dir="ltr"
            />
            {errors.callbackUrl && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="size-3" /> {errors.callbackUrl}
              </p>
            )}
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <AlertCircle className="size-3 mt-0.5 shrink-0" />
              پس از انجام پرداخت، نتیجه تراکنش به این آدرس ارسال می‌شود. باید با HTTPS شروع شود.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">توضیحات</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all resize-none placeholder:text-muted-foreground/40"
              placeholder="توضیحات مختصر درباره کسب‌وکار شما..."
            />
          </div>

          <Button
            type="submit"
            className="w-full gap-2 bg-gradient-to-l from-gold to-amber-500 text-black font-bold py-5 hover:opacity-90 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                در حال ثبت‌نام...
              </>
            ) : (
              <>
                <Store className="size-4" />
                ثبت‌نام و دریافت درگاه پرداخت
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable: Status Badge                                             */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    paid: { label: 'موفق', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
    pending: { label: 'در انتظار', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
    failed: { label: 'ناموفق', cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
    expired: { label: 'منقضی', cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' },
    cancelled: { label: 'لغو‌شده', cls: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  };
  const c = config[status] || { label: status, cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' };
  return (
    <Badge className={cn('text-[11px] border', c.cls, status === 'pending' && 'animate-pulse')}>
      {c.label}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Dashboard                                                     */
/* ------------------------------------------------------------------ */

function DashboardTab({ data, onTabChange }: { data: MerchantData; onTabChange: (t: TabId) => void }) {
  const { token } = useAppStore();
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<PaymentItem[]>([]);
  const [dashLoading, setDashLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setDashLoading(true);
      try {
        const res = await fetch('/api/gateway/merchant/payments?limit=5', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          setStats(json.stats);
          setRecentPayments(json.payments.slice(0, 5));
        }
      } catch { /* silent */ } finally {
        setDashLoading(false);
      }
    })();
  }, [token]);

  const totalFees = stats?.totalFees ?? +(data.totalVolume * (data.feePercent / 100)).toFixed(4);
  const netIncome = +((stats?.totalPaidAmount ?? data.totalVolume) - totalFees).toFixed(4);

  return (
    <div className="space-y-6" id="mp-dashboard">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-gold/20 bg-gradient-to-l from-gold/10 to-gold/5 p-5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gold/15">
            <Store className="size-6 text-gold" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              سلام، <span className="gold-gradient-text">{data.businessName}</span>
            </h2>
            <p className="text-sm text-muted-foreground">به پنل پذیرندگان زرین گلد خوش آمدید</p>
          </div>
        </div>
        <Badge className="w-fit bg-emerald-500/15 text-emerald-400 border-emerald-500/20 gap-1.5">
          <CheckCircle2 className="size-3.5" />
          حساب پذیرنده فعال
        </Badge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="size-4 text-emerald-400" />
            </div>
            <span className="text-xs text-muted-foreground">پرداخت موفق</span>
          </div>
          {dashLoading ? <div className="h-8 w-20 animate-pulse rounded bg-muted" /> : (
            <p className="text-2xl font-bold text-foreground">{formatNumber(stats?.totalPaid ?? 0)}</p>
          )}
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gold/10">
              <Store className="size-4 text-gold" />
            </div>
            <span className="text-xs text-muted-foreground">حجم تراکنش (گرم)</span>
          </div>
          {dashLoading ? <div className="h-8 w-20 animate-pulse rounded bg-muted" /> : (
            <p className="text-2xl font-bold gold-gradient-text">
              {formatNumber(+(stats?.totalPaidAmount ?? 0).toFixed(3))}
            </p>
          )}
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-orange-500/10">
              <AlertCircle className="size-4 text-orange-400" />
            </div>
            <span className="text-xs text-muted-foreground">کارمزد پرداختی</span>
          </div>
          {dashLoading ? <div className="h-8 w-20 animate-pulse rounded bg-muted" /> : (
            <p className="text-2xl font-bold text-orange-400">
              {formatNumber(+totalFees.toFixed(3))} <span className="text-xs font-normal text-muted-foreground">گرم</span>
            </p>
          )}
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="size-4 text-emerald-400" />
            </div>
            <span className="text-xs text-muted-foreground">درآمد خالص</span>
          </div>
          {dashLoading ? <div className="h-8 w-20 animate-pulse rounded bg-muted" /> : (
            <p className="text-2xl font-bold text-emerald-400">
              {formatNumber(+netIncome.toFixed(3))} <span className="text-xs font-normal text-muted-foreground">گرم</span>
            </p>
          )}
        </div>
      </div>

      {/* Recent payments table */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Clock className="size-4 text-gold" />
          آخرین پرداخت‌ها
        </h3>
        {dashLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">تاریخ</th>
                  <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">مبلغ (گرم)</th>
                  <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">وضعیت</th>
                  <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">شماره سفارش</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-xs text-muted-foreground">تراکنشی یافت نشد</td></tr>
                ) : (
                  recentPayments.map((p) => (
                    <tr key={p.id} className="border-b border-border/30 last:border-0">
                      <td className="py-3 px-2 text-xs text-muted-foreground">{formatPersianDate(p.createdAt)}</td>
                      <td className="py-3 px-2 text-xs font-mono font-medium text-foreground" dir="ltr">{p.amountGrams}</td>
                      <td className="py-3 px-2"><StatusBadge status={p.status} /></td>
                      <td className="py-3 px-2 text-xs font-mono text-muted-foreground" dir="ltr">{p.merchantOrderId || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => onTabChange('transactions')}
            className="text-xs text-gold hover:text-amber-400 transition-colors flex items-center gap-1"
          >
            مشاهده همه تراکنش‌ها
            <ChevronLeft className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: API Keys                                                      */
/* ------------------------------------------------------------------ */

function ApiKeysTab({ data }: { data: MerchantData }) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  const webhookUrl = `${data.callbackUrl}?source=zarringold`;

  return (
    <div className="space-y-6" id="mp-keys">
      {/* Business info card */}
      <div className="glass-card rounded-2xl border border-gold/20 p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/25 to-amber-500/20">
            <Store className="size-7 text-gold" />
          </div>
          <div>
            <h2 className="text-lg font-bold gold-gradient-text">{data.businessName}</h2>
            {data.website && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1" dir="ltr">
                <Globe className="size-3.5" />
                {data.website}
              </p>
            )}
          </div>
          <Badge className="ms-auto bg-emerald-500/15 text-emerald-400 border-emerald-500/20 gap-1.5">
            <CheckCircle2 className="size-3.5" />
            فعال
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg bg-background/50 border border-border/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">درصد کارمزد</p>
            <p className="text-lg font-bold text-gold">{data.feePercent}%</p>
          </div>
          <div className="rounded-lg bg-background/50 border border-border/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">تاریخ عضویت</p>
            <p className="text-sm font-medium text-foreground" dir="ltr">{data.createdAt}</p>
          </div>
          <div className="rounded-lg bg-background/50 border border-border/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">شناسه فروشنده</p>
            <p className="text-sm font-mono font-medium text-foreground" dir="ltr">{data.id}</p>
          </div>
        </div>
      </div>

      {/* API Keys section */}
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Key className="size-5 text-gold" />
          کلیدهای API
        </h3>

        {/* API Key */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">API Key</label>
          <div className="flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2.5">
            <code className="flex-1 text-sm font-mono text-zinc-300 truncate" dir="ltr">
              {showApiKey ? data.apiKey : maskedKey(data.apiKey)}
            </code>
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
            >
              {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
            <CopyBtn text={data.apiKey} />
          </div>
        </div>

        {/* API Secret */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">API Secret</label>
          <div className="flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2.5">
            <code className="flex-1 text-sm font-mono text-zinc-300 truncate" dir="ltr">
              {showApiSecret ? data.apiSecret : maskedKey(data.apiSecret)}
            </code>
            <button
              type="button"
              onClick={() => setShowApiSecret(!showApiSecret)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
            >
              {showApiSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
            <CopyBtn text={data.apiSecret} />
          </div>
        </div>

        {/* Callback URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Link2 className="size-3.5" />
            Callback URL
          </label>
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2.5">
            <code className="text-sm font-mono text-zinc-300 break-all" dir="ltr">{data.callbackUrl}</code>
          </div>
        </div>

        {/* Fee Percentage */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">درصد کارمزد</label>
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2.5">
            <span className="text-lg font-bold text-gold">{data.feePercent}%</span>
          </div>
        </div>

        {/* Webhook URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Send className="size-3.5" />
            Webhook URL
          </label>
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2.5">
            <code className="text-sm font-mono text-zinc-300 break-all" dir="ltr">{webhookUrl}</code>
          </div>
          <p className="text-xs text-muted-foreground">
            وب‌هوک‌ها به این آدرس ارسال می‌شوند. مطمئن شوید سرور شما قادر به دریافت POST requests است.
          </p>
        </div>

        {/* Security Warning */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 mt-0.5">
              <Shield className="size-4 text-amber-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-400 mb-1">هشدار امنیتی</h4>
              <p className="text-xs text-amber-200/70 leading-relaxed">
                کلید API Secret را هرگز در سمت کلاینت (مرورگر) ذخیره نکنید. فقط در سرور خود استفاده کنید.
                این کلید برای تأیید هویت درخواست‌های شما کاربرد دارد و در صورت نشت، امنیت حساب شما به خطر می‌افتد.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: API Docs (Expandable)                                         */
/* ------------------------------------------------------------------ */

function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-start hover:bg-white/[0.02] transition-colors"
      >
        <span
          className={cn(
            'text-[11px] font-mono font-bold px-2.5 py-1 rounded-md shrink-0',
            endpoint.method === 'POST'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
          )}
        >
          {endpoint.method}
        </span>
        <code className="text-sm font-mono text-zinc-300 flex-1 truncate" dir="ltr">
          {endpoint.path}
        </code>
        {expanded ? (
          <ChevronUp className="size-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        )}
      </button>

      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: expanded ? '2000px' : '0' }}
      >
        <div className="border-t border-border/30 p-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{endpoint.description}</p>

          {/* Headers */}
          {endpoint.headers && endpoint.headers.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-foreground mb-2">Headers</h4>
              <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
                {endpoint.headers.map((h) => (
                  <div key={h.key} className="flex items-center gap-2 text-xs font-mono" dir="ltr">
                    <span className="text-amber-400">{h.key}:</span>
                    <span className="text-zinc-400">{h.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request Body */}
          {endpoint.body && (
            <div>
              <h4 className="text-xs font-bold text-foreground mb-2">Request Body</h4>
              <CodeBlock code={endpoint.body} language="JSON" />
            </div>
          )}

          {/* Response */}
          {endpoint.response && (
            <div>
              <h4 className="text-xs font-bold text-foreground mb-2">Response</h4>
              <CodeBlock code={endpoint.response} language="JSON" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ApiDocsTab() {
  return (
    <div className="space-y-6" id="mp-docs">
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-lg font-bold gold-gradient-text mb-2">مستندات API درگاه زرین گلد</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          با استفاده از این API ها می‌توانید پرداخت طلایی را در وبسایت یا اپلیکیشن خود پیاده‌سازی کنید.
          همه درخواست‌ها باید دارای هدر X-API-Key باشند.
        </p>
      </div>

      {/* Base URL */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-gold" />
          <span className="text-xs text-muted-foreground">Base URL:</span>
          <code className="text-sm font-mono text-gold" dir="ltr">https://zarringold.com</code>
        </div>
      </div>

      {/* Endpoints */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">اندپوینت‌ها</h3>
        {API_ENDPOINTS.map((ep) => (
          <EndpointCard key={ep.path} endpoint={ep} />
        ))}
      </div>

      {/* Webhook Documentation */}
      <Separator className="bg-border/30" />
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Send className="size-5 text-gold" />
          وب‌هوک (Webhook)
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          پس از انجام هر پرداخت، نتیجه تراکنش به آدرس Callback URL شما ارسال می‌شود.
          سرور شما باید پاسخ <code className="text-xs font-mono text-gold bg-gold/10 px-1 rounded">{"{ \"success\": true }"}</code> با کد HTTP 200 برگرداند.
        </p>

        <div>
          <h4 className="text-xs font-bold text-foreground mb-2">Body ارسالی به Callback URL</h4>
          <CodeBlock code={WEBHOOK_DOC.body} language="JSON" />
        </div>

        <div>
          <h4 className="text-xs font-bold text-foreground mb-2">پاسخ مورد انتظار</h4>
          <CodeBlock code={WEBHOOK_DOC.expectedResponse} language="JSON" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Integration Guide                                             */
/* ------------------------------------------------------------------ */

function IntegrationTab() {
  return (
    <div className="space-y-8">
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-lg font-bold gold-gradient-text mb-2">راهنمای قدم‌به‌قدم ادغام</h2>
        <p className="text-sm text-muted-foreground">
          با دنبال کردن این مراحل، درگاه پرداخت طلایی زرین گلد را در وبسایت خود فعال کنید.
        </p>
      </div>

      {/* Step 1 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-sm font-bold text-gold">
            ۱
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">دریافت کلیدها</h3>
            <p className="text-sm text-muted-foreground">
              پس از تأیید درخواست پذیرندگی، از تب «کلیدهای API» در این پنل، API Key و API Secret خود را دریافت کنید.
            </p>
          </div>
        </div>
        <div className="me-11 rounded-xl border border-border/50 bg-card/30 p-4">
          <div className="flex items-center gap-3">
            <Key className="size-5 text-gold shrink-0" />
            <div>
              <p className="text-sm text-foreground">مسیر: پنل پذیرندگان → کلیدهای API</p>
              <p className="text-xs text-muted-foreground mt-1">
                دو کلید API Key (عمومی) و API Secret (محرمانه) در دسترس شما خواهد بود.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-sm font-bold text-gold">
            ۲
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">ایجاد پرداخت</h3>
            <p className="text-sm text-muted-foreground">
              با ارسال درخواست POST به اندپوینت ایجاد پرداخت، یک تراکنش جدید بسازید. نمونه کدها در زبان‌های مختلف:
            </p>
          </div>
        </div>
        <div className="me-11 space-y-3">
          <CodeBlock code={PHP_CREATE} language="PHP" />
          <CodeBlock code={NODE_CREATE} language="Node.js" />
          <CodeBlock code={PYTHON_CREATE} language="Python" />
          <CodeBlock code={CURL_CREATE} language="cURL" />
        </div>
      </div>

      {/* Step 3 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-sm font-bold text-gold">
            ۳
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">هدایت کاربر به صفحه پرداخت</h3>
            <p className="text-sm text-muted-foreground">
              پس از دریافت paymentUrl در پاسخ API، کاربر را به این آدرس هدایت کنید.
            </p>
          </div>
        </div>
        <div className="me-11 space-y-3">
          <CodeBlock
            code={`// PHP
header('Location: ' . $response['payment']['paymentUrl']);

// Node.js (Express)
res.redirect(data.payment.paymentUrl);

// Python (Flask)
return redirect(data['payment']['paymentUrl'])`}
            language="Redirect"
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            کاربر پس از هدایت، صفحه پرداخت زرین گلد را مشاهده می‌کند و می‌تواند از کیف پول طلایی خود پرداخت را انجام دهد.
          </p>
        </div>
      </div>

      {/* Step 4 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-sm font-bold text-gold">
            ۴
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">دریافت وب‌هوک</h3>
            <p className="text-sm text-muted-foreground">
              پس از انجام پرداخت، نتیجه به Callback URL شما ارسال می‌شود. حتماً پرداخت را از طریق API تأیید کنید.
            </p>
          </div>
        </div>
        <div className="me-11 space-y-3">
          <CodeBlock code={PHP_WEBHOOK} language="PHP (Webhook)" />
          <CodeBlock code={NODE_WEBHOOK} language="Node.js (Webhook)" />
        </div>
      </div>

      {/* Step 5 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-sm font-bold text-gold">
            ۵
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">تأیید پرداخت</h3>
            <p className="text-sm text-muted-foreground">
              پیش از تکمیل سفارش، همیشه پرداخت را از طریق API تأیید کنید. هرگز فقط به وب‌هوک اعتماد نکنید.
            </p>
          </div>
        </div>
        <div className="me-11 space-y-3">
          <CodeBlock code={NODE_VERIFY} language="Node.js (Verify)" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Tools & SDK                                                   */
/* ------------------------------------------------------------------ */

function ToolsTab() {
  const [testUrl, setTestUrl] = useState('');
  const [testSent, setTestSent] = useState(false);
  const [expandedSdk, setExpandedSdk] = useState<string | null>(null);

  const webhookPayload = JSON.stringify(
    {
      paymentId: 'pay_test_' + Math.random().toString(36).slice(2, 8),
      merchantOrderId: 'TEST-ORDER-' + Math.floor(Math.random() * 1000),
      status: 'paid',
      amountGrams: 0.5,
      amountFiat: 500000,
      paidAt: new Date().toISOString(),
    },
    null,
    2
  );

  const handleTestWebhook = () => {
    if (!testUrl.trim()) return;
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  /* ── SDK code examples ── */
  const PHP_EXAMPLE = `<?php
require_once 'ZarrinGold.php';

$gold = new ZarrinGold('zg_live_xxxx', 'zg_secret_xxxx');

// ایجاد پرداخت
$payment = $gold->createPayment([
    'amountFiat'      => 500000,       // مبلغ به واحد طلایی
    'goldPrice'       => 35000000,     // قیمت هر گرم طلا
    'merchantOrderId' => 'ORDER-123',
    'callbackUrl'     => 'https://yoursite.com/callback',
    'description'     => 'خرید محصول',
]);

if ($payment['success']) {
    header('Location: ' . $payment['payment']['paymentUrl']);
}

// تأیید پرداخت (وب‌هوک)
$payload = json_decode(file_get_contents('php://input'), true);
$webhook = $gold->verifyWebhook($payload);
if ($webhook['status'] === 'paid') {
    markOrderPaid($webhook['merchantOrderId']);
}
$gold->respondToWebhook();`;

  const NODE_EXAMPLE = `import {ZarrinGold, ZarrinGoldWebhook} from 'zarrin-gold-sdk';

const gold = new ZarrinGold({
  apiKey: 'zg_live_xxxx',
  apiSecret: 'zg_secret_xxxx',
});

// ایجاد پرداخت
const payment = await gold.createPayment({
  amountFiat: 500000,
  goldPrice: 35000000,
  merchantOrderId: 'ORDER-123',
  callbackUrl: 'https://yoursite.com/callback',
  description: 'خرید محصول',
});
console.log(payment.paymentUrl); // redirect user here

// وب‌هوک Express.js
app.post('/callback', (req, res) => {
  const wh = new ZarrinGoldWebhook();
  const payload = wh.parseWebhook(req.body);
  if (wh.isPaidStatus(payload.status)) {
    fulfillOrder(payload.merchantOrderId);
  }
  res.json(wh.createSuccessResponse());
});`;

  const PYTHON_EXAMPLE = `from zarringold import ZarrinGold, WebhookHandler

gold = ZarrinGold(
    api_key='zg_live_xxxx',
    api_secret='zg_secret_xxxx',
)

# ایجاد پرداخت
payment = gold.create_payment(
    amount_fiat=500000,
    gold_price=35000000,
    merchant_order_id='ORDER-123',
    callback_url='https://yoursite.com/callback',
    description='خرید محصول',
)
# redirect(payment['payment']['payment_url'])

# وب‌هوک Flask
@app.route('/callback', methods=['POST'])
def callback():
    wh = WebhookHandler()
    payload = wh.parse_webhook(request.json)
    if wh.is_paid(payload.status):
        fulfill_order(payload.merchant_order_id)
    return jsonify(wh.create_success_response())`;

  /* ── SDK Card component ── */
  interface SdkCardProps {
    title: string;
    version: string;
    badgeColor: string;
    iconBg: string;
    iconContent: React.ReactNode;
    description: string;
    features: string[];
    installCmd: string;
    downloadUrl: string;
    codeExample: string;
    codeLang: string;
    sdkId: string;
    requirements: string;
  }

  function SdkCard({ title, version, badgeColor, iconBg, iconContent, description, features, installCmd, downloadUrl, codeExample, codeLang, sdkId, requirements }: SdkCardProps) {
    const isExpanded = expandedSdk === sdkId;
    return (
      <div className="glass-card rounded-2xl overflow-hidden border border-border/50">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={cn('flex size-14 shrink-0 items-center justify-center rounded-2xl border', iconBg)}>
              {iconContent}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-base font-bold text-foreground">{title}</h3>
                <Badge className={cn('text-[10px]', badgeColor)}>{version}</Badge>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px]">رایگان</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{description}</p>
              <p className="text-[11px] text-muted-foreground/60 mb-3">{requirements}</p>

              {/* Install command */}
              <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 mb-3 flex items-center gap-2">
                <code className="text-xs font-mono text-amber-400 flex-1 truncate" dir="ltr">{installCmd}</code>
                <CopyBtn text={installCmd} />
              </div>

              <ul className="space-y-1.5 mb-4">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="gap-2 bg-gradient-to-l from-gold to-amber-500 text-black font-semibold hover:opacity-90">
                  <Download className="size-4" />
                  <a href={downloadUrl} className="text-inherit no-underline">دانلود SDK</a>
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-gold/30 text-gold hover:bg-gold/10"
                  onClick={() => setExpandedSdk(isExpanded ? null : sdkId)}
                >
                  {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  {isExpanded ? 'بستن مثال‌ها' : 'مشاهده مثال کد'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable code example */}
        <div
          className="overflow-hidden transition-[max-height] duration-300 ease-in-out border-t border-border/30"
          style={{ maxHeight: isExpanded ? '1500px' : '0' }}
        >
          <div className="p-6 space-y-4">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Terminal className="size-4 text-gold" />
              نمونه کد سریع
            </h4>
            <CodeBlock code={codeExample} language={codeLang} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-lg font-bold gold-gradient-text mb-2">ابزارها و SDK</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          با استفاده از SDK ها و ابزارهای رسمی زرین گلد، ادغام درگاه پرداخت در پروژه شما سریع‌تر و ساده‌تر می‌شود.
        </p>
      </div>

      {/* WordPress Plugin */}
      <div className="glass-card rounded-2xl border border-blue-500/20 p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <svg className="size-8 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" />
              <path d="M3.513 12.776l3.31-1.045 2.277 2.277L8.06 17.318a8.048 8.048 0 01-4.547-4.542zm6.726 4.173l1.045-3.31 2.277-2.277 2.277 2.277-1.045 3.31a8.048 8.048 0 01-4.554 0zm6.008-2.75l2.277-2.277 3.31 1.045a8.048 8.048 0 01-4.547 4.542l-1.04-3.31z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-base font-bold text-foreground">افزونه وردپرس / ووکامرس</h3>
              <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/20 text-[10px]">v1.0.0</Badge>
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px]">رایگان</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              پلاگین رسمی وردپرس برای ووکامرس — بدون نیاز به کدنویسی
            </p>
            <p className="text-[11px] text-muted-foreground/60 mb-3">WooCommerce 5.0+ · PHP 7.4+</p>
            <ul className="space-y-1.5 mb-4">
              {[
                'نصب آسان در چند کلیک',
                'هماهنگ با درگاه ووکامرس',
                'تنظیمات کارمزد و قیمت طلا',
                'پشتیبانی از وب‌هوک',
                'تست اتصال خودکار',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button className="gap-2 bg-gradient-to-l from-gold to-amber-500 text-black font-semibold hover:opacity-90">
              <Download className="size-4" />
              <a href="/zarrin-gold-gateway/zarrin-gold-gateway.php" className="text-inherit no-underline">
                دانلود افزونه
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* PHP SDK */}
      <SdkCard
        sdkId="php"
        title="PHP SDK"
        version="v1.0.0"
        badgeColor="bg-purple-500/15 text-purple-400 border-purple-500/20"
        iconBg="bg-purple-500/10 border border-purple-500/20"
        iconContent={
          <svg className="size-8 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        }
        description="کتابخانه رسمی PHP برای ارتباط آسان با API زرین گلد"
        requirements="PHP 7.4+ · بدون وابستگی خارجی (فقط cURL)"
        features={[
          'نصب از طریق Composer یا require_once',
          'پیاده‌سازی تمام اندپوینت‌ها',
          'تأیید وب‌هوک با HMAC-SHA256',
          'مدیریت خودکار خطاها',
          'لاگ داخلی درخواست‌ها',
          'مستندات PHPDoc کامل',
        ]}
        installCmd="composer require zarrin-gold/sdk"
        downloadUrl="/sdk/zarrin-gold-php-sdk/ZarrinGold.php"
        codeExample={PHP_EXAMPLE}
        codeLang="PHP"
      />

      {/* Node.js SDK */}
      <SdkCard
        sdkId="node"
        title="Node.js SDK"
        version="v1.0.0"
        badgeColor="bg-green-500/15 text-green-400 border-green-500/20"
        iconBg="bg-green-500/10 border border-green-500/20"
        iconContent={
          <svg className="size-8 text-green-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
        description="کتابخانه رسمی Node.js/TypeScript برای ارتباط با API زرین گلد"
        requirements="Node.js 14+ · بدون وابستگی (native fetch)"
        features={[
          'نصب از طریق npm/yarn',
          'TypeScript support با تایپ‌های کامل',
          'Promise-based API',
          'کلاس WebhookHandler اختصاصی',
          'Custom error class',
          'Express middleware آماده',
        ]}
        installCmd="npm install zarrin-gold-sdk"
        downloadUrl="/sdk/zarrin-gold-node-sdk/src/index.ts"
        codeExample={NODE_EXAMPLE}
        codeLang="TypeScript"
      />

      {/* Python SDK */}
      <SdkCard
        sdkId="python"
        title="Python SDK"
        version="v1.0.0"
        badgeColor="bg-sky-500/15 text-sky-400 border-sky-500/20"
        iconBg="bg-sky-500/10 border border-sky-500/20"
        iconContent={
          <svg className="size-8 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 4v3.5a2 2 0 004 0V4M7 9h6" strokeLinecap="round" />
          </svg>
        }
        description="کتابخانه رسمی Python برای ارتباط آسان با API زرین گلد"
        requirements="Python 3.8+ · requests>=2.25.0"
        features={[
          'نصب از طریق pip',
          'Dataclasses برای type safety',
          'Context Manager (with statement)',
          'WebhookHandler با parse و validate',
          'Connection pooling خودکار',
          'مثال Flask/Django/FastAPI',
        ]}
        installCmd="pip install zarrin-gold-sdk"
        downloadUrl="/sdk/zarrin-gold-python-sdk/zarringold/client.py"
        codeExample={PYTHON_EXAMPLE}
        codeLang="Python"
      />

      {/* Test Webhook */}
      <Separator className="bg-border/30" />
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Terminal className="size-5 text-gold" />
          تست وب‌هوک
        </h3>
        <p className="text-sm text-muted-foreground">
          یک وب‌هوک تستی به آدرس Callback URL خود ارسال کنید تا مطمئن شوید سرور شما درخواست‌ها را به درستی دریافت می‌کند.
        </p>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">آدرس Callback URL</label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://yoursite.com/callback"
              dir="ltr"
              className="flex-1 rounded-lg border border-border bg-zinc-900 px-3 py-2.5 text-sm font-mono text-zinc-300 outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all placeholder:text-zinc-600"
            />
            <Button
              onClick={handleTestWebhook}
              disabled={!testUrl.trim() || testSent}
              className="gap-2 bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25"
            >
              <Send className="size-4" />
              ارسال وب‌هوک تستی
            </Button>
          </div>
        </div>

        {testSent && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-emerald-400">وب‌هوک تستی با موفقیت ارسال شد</span>
          </div>
        )}

        {/* Payload preview */}
        <div>
          <h4 className="text-xs font-bold text-foreground mb-2">پayload نمونه:</h4>
          <CodeBlock code={webhookPayload} language="JSON" />
        </div>

        <div>
          <h4 className="text-xs font-bold text-foreground mb-2">پاسخ مورد انتظار از سرور شما:</h4>
          <CodeBlock code={'{ "success": true }'} language="JSON" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Merchant Application                                          */
/* ------------------------------------------------------------------ */

function ApplicationTab({ merchant, onRefresh }: { merchant: MerchantData | null; onRefresh: () => void }) {
  const { user, token, addToast } = useAppStore();
  const [isRegistering, setIsRegistering] = useState(false);

  // Approved state
  if (merchant?.isActive) {
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-2xl bg-emerald-500/15">
            <CheckCircle2 className="size-10 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">حساب شما تأیید شده</h2>
          <p className="text-sm text-muted-foreground mb-4">
            درخواست پذیرندگی شما با موفقیت تأیید شده و درگاه پرداخت طلایی فعال است.
          </p>
          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 mb-6">
            <CheckCircle2 className="size-4 text-emerald-400" />
            <span className="text-xs text-emerald-400">تاریخ تأیید: {merchant.createdAt}</span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-3">همین الان شروع کنید:</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="gap-2 bg-gradient-to-l from-gold to-amber-500 text-black font-semibold hover:opacity-90">
                <Key className="size-4" />
                مشاهده کلیدهای API
              </Button>
              <Button variant="outline" className="gap-2 border-gold/30 text-gold hover:bg-gold/10">
                <BookOpen className="size-4" />
                مطالعه مستندات
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pending state
  if (merchant && !merchant.isActive) {
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-2xl border border-gold/20 bg-gradient-to-b from-gold/10 to-gold/5 p-8 text-center">
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/25 to-amber-500/20 relative">
            <Clock className="size-10 text-gold animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">در انتظار تأیید</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            درخواست شما ثبت شد و در انتظار تأیید مدیر سایت می‌باشد.
          </p>
          <div className="inline-flex items-center gap-2 rounded-xl bg-gold/10 border border-gold/15 px-4 py-2 mb-6">
            <Clock className="size-4 text-gold/70" />
            <span className="text-xs text-gold/80">معمولاً ظرف ۲۴ ساعت آینده بررسی می‌شود</span>
          </div>

          {/* Merchant preview */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-4 text-start">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gold/15">
                <Store className="size-5 text-gold" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{merchant.businessName}</p>
                {merchant.website && (
                  <p className="text-xs text-muted-foreground" dir="ltr">{merchant.website}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat support */}
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">سوال دارید؟</p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-chat-support'))}
            className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-amber-400 transition-colors"
          >
            <MessageCircle className="size-4" />
            گفتگو با پشتیبانی
          </button>
        </div>
      </div>
    );
  }

  // Registration form
  return <RegistrationForm onSuccess={onRefresh} />;
}

/* ------------------------------------------------------------------ */
/*  Tab: Transactions                                                  */
/* ------------------------------------------------------------------ */

function TransactionDetailModal({ payment, onClose }: { payment: PaymentItem; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/invoice/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: payment.id,
          type: 'gateway_payment',
          amountGold: payment.amountGrams + payment.feeGrams,
          amountFiat: payment.amountFiat,
          fee: 0,
          goldPrice: payment.goldPrice,
          status: payment.status,
          referenceId: payment.id,
          description: payment.description,
          createdAt: payment.createdAt,
        }),
      });
      if (!res.ok) throw new Error('خطا');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ZG-${payment.id.slice(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('خطا در تولید فاکتور');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto glass-card rounded-2xl border border-border/50 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Info className="size-4 text-gold" />
            جزئیات تراکنش
          </h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-200 transition-colors p-1">
            <XCircle className="size-5" />
          </button>
        </div>

        <div className="flex items-center justify-center py-3">
          <StatusBadge status={payment.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <DetailRow label="شناسه پرداخت" value={payment.id} mono />
          <DetailRow label="شماره سفارش فروشنده" value={payment.merchantOrderId || '—'} mono />
          <DetailRow label="مبلغ (گرم)" value={`${payment.amountGrams} گرم`} />
          <DetailRow label="مبلغ (واحد طلایی)" value={`${formatNumber(payment.amountFiat)} واحد طلایی`} />
          <DetailRow label="کارمزد (گرم)" value={`${payment.feeGrams} گرم`} />
          <DetailRow label="قیمت طلا" value={`${formatNumber(payment.goldPrice)} واحد طلایی/گرم`} />
          <DetailRow label="تاریخ ایجاد" value={formatPersianDate(payment.createdAt)} />
          <DetailRow label="تاریخ پرداخت" value={formatPersianDate(payment.paidAt)} />
          <DetailRow label="توضیحات" value={payment.description || '—'} />
          <DetailRow label="آدرس IP" value={payment.ipAddress || '—'} mono />
          <DetailRow label="User Agent" value={payment.userAgent ? (payment.userAgent.length > 40 ? payment.userAgent.slice(0, 40) + '…' : payment.userAgent) : '—'} mono />
        </div>

        <div className="rounded-xl border border-border/50 bg-background/50 p-4 space-y-2">
          <h4 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <Send className="size-3" />
            وضعیت وب‌هوک
          </h4>
          <div className="flex items-center gap-2">
            <span className={cn(
              'flex size-5 items-center justify-center rounded-full',
              payment.callbackAt ? 'bg-emerald-500/15' : 'bg-red-500/15'
            )}>
              {payment.callbackAt ? <Check className="size-3 text-emerald-400" /> : <XCircle className="size-3 text-red-400" />}
            </span>
            <span className="text-xs text-muted-foreground">
              {payment.callbackAt ? `ارسال‌شده — ${formatPersianDate(payment.callbackAt)}` : 'ارسال نشده'}
            </span>
          </div>
        </div>

        {/* Invoice button */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
            onClick={handleDownloadPDF}
          >
            <FileText className="size-4" />
            دانلود فاکتور PDF
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-gold/20 text-gold hover:bg-gold/10"
            onClick={onClose}
          >
            بستن
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn('text-xs font-medium text-foreground break-all', mono && 'font-mono')} dir={mono ? 'ltr' : undefined}>{value}</p>
    </div>
  );
}

function TransactionsTab() {
  const { token } = useAppStore();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);

  const fetchPayments = useCallback(async (p: number) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '15' });
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/gateway/merchant/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setPayments(json.payments);
        setStats(json.stats);
        setTotalPages(json.totalPages);
        setTotal(json.total);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [token, search, statusFilter, dateFrom, dateTo]);

  useEffect(() => { fetchPayments(page); }, [fetchPayments, page]);

  const applyFilters = () => { setPage(1); fetchPayments(1); };
  const clearFilters = () => {
    setSearch(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); setPage(1);
    setTimeout(() => fetchPayments(1), 0);
  };
  const refresh = () => fetchPayments(page);

  const statusOptions = [
    { value: '', label: 'همه وضعیت‌ها' },
    { value: 'paid', label: 'موفق' },
    { value: 'pending', label: 'در انتظار' },
    { value: 'failed', label: 'ناموفق' },
    { value: 'expired', label: 'منقضی' },
    { value: 'cancelled', label: 'لغو‌شده' },
  ];

  const statCards = [
    { label: 'پرداخت‌های موفق', value: stats?.totalPaid ?? 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
    { label: 'پرداخت‌های در انتظار', value: stats?.totalPending ?? 0, color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Clock },
    { label: 'پرداخت‌های ناموفق', value: stats?.totalFailed ?? 0, color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
    { label: 'حجم امروز (گرم)', value: stats?.todayVolume ?? 0, color: 'text-blue-400', bg: 'bg-blue-500/10', icon: TrendingUp },
    { label: 'درآمد امروز (واحد طلایی)', value: stats?.todayVolume ?? 0, color: 'text-gold', bg: 'bg-gold/10', icon: DollarSign, isFiat: true },
    { label: 'کارمزد کسرشده', value: stats?.totalFees ?? 0, color: 'text-orange-400', bg: 'bg-orange-500/10', icon: AlertCircle },
  ];

  return (
    <div className="space-y-5" id="mp-payments">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('flex size-8 items-center justify-center rounded-lg', s.bg)}>
                <s.icon className={cn('size-4', s.color)} />
              </div>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className={cn('text-xl font-bold', s.color)}>
              {formatNumber(+(s.value).toFixed(3))}
              {s.isFiat && <span className="text-[10px] font-normal text-muted-foreground"> واحد طلایی</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="glass-card rounded-2xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی شماره سفارش..."
              className="w-full rounded-lg border border-border bg-zinc-900 px-3 py-2 pe-9 text-sm font-mono text-zinc-300 outline-none focus:border-gold/50"
              dir="ltr"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-gold/50"
          >
            {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-border bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-gold/50"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-border bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-gold/50"
          />
          <div className="flex gap-2">
            <button onClick={applyFilters} className="flex-1 rounded-lg bg-gradient-to-l from-gold to-amber-500 text-black font-bold text-xs py-2 hover:opacity-90">
              اعمال فیلتر
            </button>
            <button onClick={clearFilters} className="rounded-lg border border-border text-muted-foreground text-xs px-3 py-2 hover:text-foreground hover:bg-muted/50">
              پاک کردن
            </button>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={refresh} className="text-zinc-400 hover:text-zinc-200 transition-colors p-1.5 rounded-lg hover:bg-muted/50">
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Payments table */}
      <div className="glass-card rounded-2xl p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">ردیف</th>
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">شناسه</th>
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">شماره سفارش</th>
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">مبلغ (گرم)</th>
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">مبلغ (واحد طلایی)</th>
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">کارمزد</th>
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">وضعیت</th>
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">تاریخ</th>
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">وب‌هوک</th>
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/30"><td colSpan={10} className="py-3 px-2"><div className="h-8 animate-pulse rounded bg-muted" /></td></tr>
                ))
              ) : payments.length === 0 ? (
                <tr><td colSpan={10} className="py-12 text-center">
                  <Receipt className="size-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">تراکنشی یافت نشد</p>
                </td></tr>
              ) : payments.map((p, idx) => (
                <tr
                  key={p.id}
                  className="border-b border-border/30 last:border-0 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setSelectedPayment(p)}
                >
                  <td className="py-3 px-2 text-xs text-muted-foreground">{formatNumber((page - 1) * 15 + idx + 1)}</td>
                  <td className="py-3 px-2 text-xs font-mono text-zinc-400" dir="ltr" title={p.id}>{shortId(p.id)}</td>
                  <td className="py-3 px-2 text-xs font-mono text-muted-foreground" dir="ltr">{p.merchantOrderId || '—'}</td>
                  <td className="py-3 px-2 text-xs font-mono font-medium text-foreground" dir="ltr">{p.amountGrams}</td>
                  <td className="py-3 px-2 text-xs font-mono text-muted-foreground" dir="ltr">{formatNumber(p.amountFiat)}</td>
                  <td className="py-3 px-2 text-xs font-mono text-orange-400" dir="ltr">{p.feeGrams}</td>
                  <td className="py-3 px-2"><StatusBadge status={p.status} /></td>
                  <td className="py-3 px-2 text-xs text-muted-foreground">{formatPersianDate(p.createdAt)}</td>
                  <td className="py-3 px-2">
                    {p.callbackAt ? (
                      <Check className="size-4 text-emerald-400" />
                    ) : (
                      <XCircle className="size-4 text-red-400/50" />
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedPayment(p); }}
                      className="text-xs text-gold hover:text-amber-400 transition-colors flex items-center gap-1"
                    >
                      <Info className="size-3" />
                      جزئیات
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              نمایش {formatNumber((page - 1) * 15 + 1)} تا {formatNumber(Math.min(page * 15, total))} از {formatNumber(total)} تراکنش
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="size-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="size-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const pn = start + i;
                if (pn > totalPages) return null;
                return (
                  <button
                    key={pn}
                    type="button"
                    onClick={() => setPage(pn)}
                    className={cn(
                      'size-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors',
                      page === pn
                        ? 'bg-gold/15 text-gold border border-gold/25'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                    )}
                  >
                    {formatNumber(pn)}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="size-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedPayment && (
        <TransactionDetailModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Financial                                                     */
/* ------------------------------------------------------------------ */

interface SettlementItem {
  id: string;
  amountGrams: number;
  amountFiat: number;
  feeGrams: number;
  netGrams: number;
  status: string;
  paymentCount: number;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

function FinancialTab() {
  const { token, addToast } = useAppStore();
  const [period, setPeriod] = useState('daily');
  const [reports, setReports] = useState<Array<{
    periodKey: string;
    date: string;
    count: number;
    totalGrams: number;
    totalFiat: number;
    totalFees: number;
    paidCount: number;
  }>>([]);
  const [summary, setSummary] = useState<{ totalSettled: number; totalFees: number; totalRefunded: number } | null>(null);
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [settling, SetSettling] = useState(false);
  const [eligibility, setEligibility] = useState<{
    canRequestInstant: boolean;
    canRequestDaily: boolean;
    canRequestManual: boolean;
    pendingSettlements: number;
    availablePayments: number;
    availableGrams: number;
    availableFiat: number;
  } | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [reportsRes, settlementsRes] = await Promise.all([
        fetch(`/api/gateway/merchant/reports?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/gateway/merchant/settlement', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const [rj, sj] = await Promise.all([reportsRes.json(), settlementsRes.json()]);
      if (rj.success) {
        setReports(rj.reports);
        setSummary(rj.summary);
      }
      if (sj.success) {
        setSettlements(sj.settlements);
        if (sj.eligibility) setEligibility(sj.eligibility);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [token, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSettlement = async (settlementType: string = 'manual') => {
    SetSettling(true);
    try {
      const res = await fetch('/api/gateway/merchant/settlement', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ settlementType }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message, 'success');
        fetchData();
      } else {
        addToast(data.message || 'خطا در ثبت درخواست', 'error');
      }
    } catch {
      addToast('خطا در ثبت درخواست تسویه', 'error');
    } finally {
      SetSettling(false);
    }
  };

  const handleExport = (ext: string) => {
    const link = document.createElement('a');
    link.href = `/api/gateway/merchant/reports?export=csv`;
    link.download = `report.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const settlementBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      pending: { label: 'در انتظار', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
      processing: { label: 'در حال پردازش', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
      completed: { label: 'تکمیل‌شده', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
      rejected: { label: 'رد‌شده', cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
    };
    const c = map[status] || { label: status, cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' };
    return <Badge className={cn('text-[11px] border', c.cls)}>{c.label}</Badge>;
  };

  const typeBadge = (type: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      instant: { label: 'آنی', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
      daily: { label: 'روزانه', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
      manual: { label: 'دستی', cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' },
    };
    const safeType = type || 'manual';
    const c = map[safeType] || { label: safeType, cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' };
    return <Badge className={cn('text-[10px] border', c.cls)}>{c.label}</Badge>;
  };

  const sumGrams = reports.reduce((s, r) => s + r.totalGrams, 0);
  const sumFiat = reports.reduce((s, r) => s + r.totalFiat, 0);
  const sumFees = reports.reduce((s, r) => s + r.totalFees, 0);

  return (
    <div className="space-y-5">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gold/10">
              <DollarSign className="size-4 text-gold" />
            </div>
            <span className="text-xs text-muted-foreground">کل مبلغ موفق (واحد طلایی)</span>
          </div>
          {loading ? <div className="h-8 w-20 animate-pulse rounded bg-muted" /> : (
            <p className="text-xl font-bold gold-gradient-text">{formatNumber(+sumFiat.toFixed(0))}</p>
          )}
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="size-4 text-emerald-400" />
            </div>
            <span className="text-xs text-muted-foreground">طلای دریافتی خالص (گرم)</span>
          </div>
          {loading ? <div className="h-8 w-20 animate-pulse rounded bg-muted" /> : (
            <p className="text-xl font-bold text-emerald-400">{formatNumber(+(sumGrams - sumFees).toFixed(3))}</p>
          )}
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-orange-500/10">
              <AlertCircle className="size-4 text-orange-400" />
            </div>
            <span className="text-xs text-muted-foreground">کارمزد کسرشده (گرم)</span>
          </div>
          {loading ? <div className="h-8 w-20 animate-pulse rounded bg-muted" /> : (
            <p className="text-xl font-bold text-orange-400">{formatNumber(+sumFees.toFixed(3))}</p>
          )}
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
              <CheckCircle2 className="size-4 text-blue-400" />
            </div>
            <span className="text-xs text-muted-foreground">تعداد تراکنش موفق</span>
          </div>
          {loading ? <div className="h-8 w-20 animate-pulse rounded bg-muted" /> : (
            <p className="text-xl font-bold text-foreground">{formatNumber(reports.reduce((s, r) => s + r.paidCount, 0))}</p>
          )}
        </div>
      </div>

      {/* Period selector + Export */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-gold" />
            <span className="text-sm font-medium text-foreground">دوره گزارش:</span>
            <div className="flex gap-1">
              {[
                { value: 'daily', label: 'روزانه' },
                { value: 'weekly', label: 'هفتگی' },
                { value: 'monthly', label: 'ماهانه' },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPeriod(p.value)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    period === p.value
                      ? 'bg-gold/15 text-gold border border-gold/25'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Download className="size-3" />
              خروجی CSV
            </button>
            <button
              type="button"
              onClick={() => handleExport('xls')}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Download className="size-3" />
              خروجی Excel
            </button>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <FileBarChart className="size-4 text-gold" />
          گزارش مالی
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">تاریخ</th>
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">تعداد تراکنش</th>
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">حجم (گرم)</th>
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">مبلغ (واحد طلایی)</th>
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">کارمزد (گرم)</th>
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">پرداخت موفق</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/30"><td colSpan={6} className="py-3 px-2"><div className="h-8 animate-pulse rounded bg-muted" /></td></tr>
                ))
              ) : reports.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center">
                  <FileBarChart className="size-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">داده‌ای یافت نشد</p>
                </td></tr>
              ) : (
                <>
                  {reports.map((r) => (
                    <tr key={r.periodKey} className="border-b border-border/30 last:border-0">
                      <td className="py-3 px-2 text-xs text-foreground">{r.date}</td>
                      <td className="py-3 px-2 text-xs font-mono text-muted-foreground">{formatNumber(r.count)}</td>
                      <td className="py-3 px-2 text-xs font-mono text-foreground" dir="ltr">{r.totalGrams.toFixed(3)}</td>
                      <td className="py-3 px-2 text-xs font-mono text-muted-foreground" dir="ltr">{formatNumber(+r.totalFiat.toFixed(0))}</td>
                      <td className="py-3 px-2 text-xs font-mono text-orange-400" dir="ltr">{r.totalFees.toFixed(3)}</td>
                      <td className="py-3 px-2 text-xs font-mono text-emerald-400">{formatNumber(r.paidCount)}</td>
                    </tr>
                  ))}
                  {/* Sum row */}
                  <tr className="border-t-2 border-gold/20 bg-gold/5">
                    <td className="py-3 px-2 text-xs font-bold text-gold">جمع کل</td>
                    <td className="py-3 px-2 text-xs font-mono font-bold text-foreground">{formatNumber(reports.reduce((s, r) => s + r.count, 0))}</td>
                    <td className="py-3 px-2 text-xs font-mono font-bold text-foreground" dir="ltr">{sumGrams.toFixed(3)}</td>
                    <td className="py-3 px-2 text-xs font-mono font-bold text-foreground" dir="ltr">{formatNumber(+sumFiat.toFixed(0))}</td>
                    <td className="py-3 px-2 text-xs font-mono font-bold text-orange-400" dir="ltr">{sumFees.toFixed(3)}</td>
                    <td className="py-3 px-2 text-xs font-mono font-bold text-emerald-400">{formatNumber(reports.reduce((s, r) => s + r.paidCount, 0))}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settlement Section */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <DollarSign className="size-4 text-gold" />
            تسویه‌حساب
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Instant Settlement */}
            <button
              type="button"
              onClick={() => handleSettlement('instant')}
              disabled={settling || !eligibility?.canRequestInstant}
              title="تسویه آنی — پرداخت‌های اخیر بلافاصله تسویه"
              className="gap-1.5 bg-gradient-to-l from-emerald-500 to-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center transition-opacity"
            >
              {settling ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
              تسویه آنی
            </button>
            {/* Daily Settlement */}
            <button
              type="button"
              onClick={() => handleSettlement('daily')}
              disabled={settling || !eligibility?.canRequestDaily}
              title="تسویه روزانه — پرداخت‌های ۲۴ ساعت گذشته"
              className="gap-1.5 bg-gradient-to-l from-blue-500 to-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center transition-opacity"
            >
              {settling ? <Loader2 className="size-3.5 animate-spin" /> : <Calendar className="size-3.5" />}
              تسویه روزانه
            </button>
            {/* Manual Settlement */}
            <button
              type="button"
              onClick={() => handleSettlement('manual')}
              disabled={settling || !eligibility?.canRequestManual}
              title="تسویه دستی — تمام پرداخت‌های تسویه‌نشده"
              className="gap-1.5 bg-gradient-to-l from-gold to-amber-500 text-black font-bold text-xs px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center transition-opacity"
            >
              {settling ? <Loader2 className="size-3.5 animate-spin" /> : <DollarSign className="size-3.5" />}
              تسویه دستی
            </button>
          </div>
        </div>

        {/* Eligibility Info */}
        {eligibility && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-lg bg-muted/30 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">پرداخت‌های قابل تسویه</p>
              <p className="text-sm font-bold text-foreground" dir="ltr">{formatNumber(eligibility.availablePayments)}</p>
            </div>
            <div className="rounded-lg bg-muted/30 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">طلای قابل تسویه (گرم)</p>
              <p className="text-sm font-bold text-gold" dir="ltr">{eligibility.availableGrams.toFixed(3)}</p>
            </div>
            <div className="rounded-lg bg-muted/30 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">معادل واحد طلاییی</p>
              <p className="text-sm font-bold text-foreground" dir="ltr">{formatNumber(+eligibility.availableFiat.toFixed(0))}</p>
            </div>
            <div className="rounded-lg bg-muted/30 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">درخواست‌های در حال بررسی</p>
              <p className="text-sm font-bold text-amber-400">{formatNumber(eligibility.pendingSettlements)}</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">شناسه</th>
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">نوع</th>
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">مبلغ خالص (گرم)</th>
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">تعداد</th>
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">وضعیت</th>
                <th className="text-start py-3 px-2 text-xs text-muted-foreground font-medium">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/30"><td colSpan={6} className="py-3 px-2"><div className="h-8 animate-pulse rounded bg-muted" /></td></tr>
                ))
              ) : settlements.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">تسویه‌ای ثبت نشده است</td></tr>
              ) : settlements.map((s) => (
                <tr key={s.id} className="border-b border-border/30 last:border-0">
                  <td className="py-3 px-2 text-xs font-mono text-zinc-400" dir="ltr">{shortId(s.id)}</td>
                  <td className="py-3 px-2">{typeBadge((s as unknown as Record<string, unknown>).settlementType as string || 'manual')}</td>
                  <td className="py-3 px-2 text-xs font-mono font-medium text-foreground" dir="ltr">{s.netGrams.toFixed(3)}</td>
                  <td className="py-3 px-2 text-xs font-mono text-muted-foreground">{formatNumber(s.paymentCount)}</td>
                  <td className="py-3 px-2">{settlementBadge(s.status)}</td>
                  <td className="py-3 px-2 text-xs text-muted-foreground">{formatPersianDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab Bar                                                            */
/* ------------------------------------------------------------------ */

function TabBar({
  activeTab,
  onTabChange,
  hasMerchant,
  isAdmin,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  hasMerchant: boolean;
  isAdmin?: boolean;
}) {
  // dashboard & api-keys require approved active merchant (or admin)
  // api-docs, integration, tools visible to all users
  // application visible when user is NOT an approved merchant AND NOT admin
  const visibleTabs = TABS.filter((t) => {
    if (t.id === 'dashboard' || t.id === 'transactions' || t.id === 'financial') return hasMerchant || !!isAdmin;
    if (t.id === 'api-keys') return hasMerchant; // API keys only for own merchant
    if (t.id === 'application') return !hasMerchant && !isAdmin;
    return true;
  });

  return (
    <div className="overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-1 min-w-max sm:min-w-0 sm:flex-wrap">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap',
                isActive
                  ? 'bg-gold/15 text-gold border border-gold/25 shadow-sm shadow-gold/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function DeveloperPortal() {
  const { user, token } = useAppStore();
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const initialTabSet = useRef(false);

  const fetchMerchant = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch('/api/gateway/merchant/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMerchant(data.merchant);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user?.id, token]);

  useEffect(() => {
    fetchMerchant();
  }, [fetchMerchant, refreshKey]);

  // Only set default tab once after initial load — do NOT re-run on tab changes
  useEffect(() => {
    if (!loading && !initialTabSet.current) {
      initialTabSet.current = true;
      if (!merchant) {
        setActiveTab('api-docs');
      } else if (!merchant.isActive) {
        setActiveTab('api-docs');
      } else if (activeTab === 'application') {
        setActiveTab('dashboard');
      }
    }
  }, [loading, merchant, activeTab]);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="space-y-5 pb-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Store className="size-6 text-gold" />
            پنل پذیرندگان زرین گلد
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مدیریت درگاه پرداخت طلایی — تراکنش‌ها، اسناد مالی و تنظیمات API
          </p>
        </div>
        {merchant?.isActive && (
          <Badge className="w-fit bg-emerald-500/15 text-emerald-400 border-emerald-500/20 gap-1.5">
            <CheckCircle2 className="size-3.5" />
            حساب فعال
          </Badge>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 rounded-xl bg-muted" />
          <div className="h-40 rounded-2xl bg-muted" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 rounded-xl bg-muted" />
            <div className="h-24 rounded-xl bg-muted" />
          </div>
          <div className="h-48 rounded-2xl bg-muted" />
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {/* Tab bar */}
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} hasMerchant={!!merchant?.isActive} />

          {/* Tab content */}
          <div className="min-h-[400px]">
            {activeTab === 'dashboard' && merchant?.isActive && <DashboardTab data={merchant} onTabChange={setActiveTab} />}
            {activeTab === 'transactions' && merchant?.isActive && <TransactionsTab />}
            {activeTab === 'financial' && merchant?.isActive && <FinancialTab />}
            {activeTab === 'api-keys' && merchant?.isActive && <ApiKeysTab data={merchant} />}
            {activeTab === 'api-docs' && <ApiDocsTab />}
            {activeTab === 'integration' && <IntegrationTab />}
            {activeTab === 'tools' && <ToolsTab />}
            {activeTab === 'application' && <ApplicationTab merchant={merchant} onRefresh={handleRefresh} />}
          </div>
        </>
      )}
    </div>
  );
}

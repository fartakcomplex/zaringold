
import React, { useState, useEffect, useCallback } from 'react';
import {useAppStore} from '@/lib/store';
import {formatNumber, formatToman, formatGrams, formatDateTime, getTimeAgo, toPersianDigits} from '@/lib/helpers';
import {cn} from '@/lib/utils';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {Label} from '@/components/ui/label';
import {Switch} from '@/components/ui/switch';
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {CreditCard, Search, Eye, Copy, RefreshCw, Globe, Phone, Key, Coins, TrendingUp, CheckCircle, XCircle, Clock, AlertCircle, ArrowUpDown, Building2, ChevronLeft, ChevronRight, Loader2, Shield, ExternalLink, Text} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Merchant {
  id: string;
  userId: string;
  businessName: string;
  website: string | null;
  callbackUrl: string;
  apiKey: string;
  apiSecret: string;
  feePercent: number;
  isActive: boolean;
  totalPayments: number;
  totalVolume: number;
  description: string | null;
  createdAt: string;
  user: { fullName: string | null; phone: string };
}

interface GatewayPayment {
  id: string;
  merchantId: string;
  merchantName: string;
  userId: string;
  userPhone: string;
  amountGrams: number;
  amountFiat: number;
  goldPrice: number;
  status: string;
  callbackStatus: string | null;
  callbackAttempts: number;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */

function isRecentCreated(createdAt: string): boolean {
  return new Date(createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000;
}

type MerchantStatus = 'active' | 'pending' | 'rejected';

function getMerchantStatus(m: Merchant): MerchantStatus {
  if (m.isActive) return 'active';
  return isRecentCreated(m.createdAt) ? 'pending' : 'rejected';
}

const MERCHANT_STATUS_CONFIG: Record<MerchantStatus, { label: string; color: string; pulse?: boolean }> = {
  active: { label: 'فعال', color: 'bg-emerald-500/15 text-emerald-500' },
  pending: { label: 'در انتظار تأیید', color: 'bg-amber-500/15 text-amber-500', pulse: true },
  rejected: { label: 'رد شده / غیرفعال', color: 'bg-red-500/15 text-red-500' },
};

function getMerchantStatusBadge(status: MerchantStatus) {
  const cfg = MERCHANT_STATUS_CONFIG[status];
  return (
    <Badge className={cn('text-[10px]', cfg.color, cfg.pulse && 'animate-pulse')}>
      {status === 'pending' && <Clock className="size-3 ml-1" />}
      {cfg.label}
    </Badge>
  );
}

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'در انتظار', color: 'text-amber-500 bg-amber-500/15' },
  paid: { label: 'پرداخت شده', color: 'text-emerald-500 bg-emerald-500/15' },
  failed: { label: 'ناموفق', color: 'text-red-500 bg-red-500/15' },
  expired: { label: 'منقضی شده', color: 'text-gray-500 bg-gray-500/15' },
  cancelled: { label: 'لغو شده', color: 'text-gray-400 bg-gray-400/15' },
};

function getPaymentStatusBadge(status: string) {
  const s = PAYMENT_STATUS_MAP[status] || { label: status, color: 'text-gray-500 bg-gray-500/15' };
  return (
    <Badge className={cn('text-[10px]', s.color)}>
      {s.label}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminMerchants() {
  const addToast = useAppStore((s) => s.addToast);
  const token = useAppStore((s) => s.token);

  /* ---- Data ---- */
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [payments, setPayments] = useState<GatewayPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('merchants');

  /* ---- Filters ---- */
  const [search, setSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [merchantFilter, setMerchantFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 15;

  /* ---- Dialogs ---- */
  const [detailMerchant, setDetailMerchant] = useState<Merchant | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [regenerateMerchant, setRegenerateMerchant] = useState<Merchant | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  /* ---- Fetch merchants ---- */
  const fetchMerchants = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/gateway/merchant/list', { headers });
      if (res.ok) {
        const d = await res.json();
        setMerchants(Array.isArray(d) ? d : d.merchants || []);
      }
    } catch {
      /* ignore */
    }
  }, [token]);

  /* ---- Fetch payments ---- */
  const fetchPayments = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/admin/gateway-payments', { headers });
      if (res.ok) {
        const d = await res.json();
        setPayments(Array.isArray(d) ? d : d.payments || []);
      }
    } catch {
      /* ignore */
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([fetchMerchants(), fetchPayments()]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchMerchants, fetchPayments]);

  /* ---- Fee editor for detail dialog ---- */
  const [detailFee, setDetailFee] = useState<number | null>(null);

  /* ---- Computed ---- */
  const activeMerchants = merchants.filter((m) => m.isActive);
  const pendingMerchants = merchants.filter((m) => !m.isActive && isRecentCreated(m.createdAt));
  const totalVolumeGrams = merchants.reduce((s, m) => s + (m.totalVolume || 0), 0);

  /* ---- Filter merchants ---- */
  const filteredMerchants = merchants.filter((m) => {
    const q = search.toLowerCase();
    return (
      !q ||
      m.businessName.toLowerCase().includes(q) ||
      (m.website || '').toLowerCase().includes(q) ||
      (m.user?.fullName || '').toLowerCase().includes(q) ||
      (m.user?.phone || '').includes(q)
    );
  });

  const totalMerchantPages = Math.max(1, Math.ceil(filteredMerchants.length / perPage));
  const paginatedMerchants = filteredMerchants.slice(
    (page - 1) * perPage,
    page * perPage,
  );

  /* ---- Filter payments ---- */
  const filteredPayments = payments.filter((p) => {
    const matchStatus = paymentStatusFilter === 'all' || p.status === paymentStatusFilter;
    const matchMerchant = merchantFilter === 'all' || p.merchantId === merchantFilter;
    return matchStatus && matchMerchant;
  });

  const totalPaymentPages = Math.max(1, Math.ceil(filteredPayments.length / perPage));
  const [paymentPage, setPaymentPage] = useState(1);
  const paginatedPayments = filteredPayments.slice(
    (paymentPage - 1) * perPage,
    paymentPage * perPage,
  );

  /* ---- Handlers ---- */

  const maskKey = (key: string) => {
    if (!key || key.length < 8) return '****';
    return key.slice(0, 6) + '••••••••' + key.slice(-4);
  };

  const handleCopyKey = (key: string, label: string) => {
    navigator.clipboard.writeText(key).then(() => {
      addToast(`${label} کپی شد`, 'success');
    }).catch(() => {
      addToast('خطا در کپی کردن', 'error');
    });
  };

  const handleToggleActive = async (merchant: Merchant) => {
    setTogglingId(merchant.id);
    try {
      const res = await fetch(`/api/gateway/merchant/${merchant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !merchant.isActive }),
      });
      if (res.ok) {
        addToast(
          merchant.isActive ? 'پذیرنده غیرفعال شد' : 'پذیرنده فعال شد',
          'success',
        );
        await fetchMerchants();
      } else {
        const d = await res.json().catch(() => ({}));
        addToast(d.message || 'خطا در تغییر وضعیت', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleApproveMerchant = async (merchant: Merchant, customFee?: number) => {
    setTogglingId(merchant.id);
    try {
      const body: Record<string, unknown> = { isActive: true };
      if (customFee !== undefined && customFee !== null) {
        body.feePercent = customFee;
      }
      const res = await fetch(`/api/gateway/merchant/${merchant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        addToast('پذیرنده تأیید شد', 'success');
        setDetailOpen(false);
        setDetailMerchant(null);
        await fetchMerchants();
      } else {
        const d = await res.json().catch(() => ({}));
        addToast(d.message || 'خطا در تأیید پذیرنده', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleRejectMerchant = async (merchant: Merchant) => {
    setTogglingId(merchant.id);
    try {
      const res = await fetch(`/api/gateway/merchant/${merchant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false, rejectedAt: new Date().toISOString() }),
      });
      if (res.ok) {
        addToast('درخواست پذیرنده رد شد', 'success');
        setDetailOpen(false);
        setDetailMerchant(null);
        await fetchMerchants();
      } else {
        const d = await res.json().catch(() => ({}));
        addToast(d.message || 'خطا در رد درخواست', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleRegenerateKeys = async () => {
    if (!regenerateMerchant) return;
    setRegenerating(true);
    try {
      const res = await fetch(`/api/gateway/merchant/${regenerateMerchant.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate_keys' }),
      });
      if (res.ok) {
        addToast('کلیدهای API بازتولید شدند', 'success');
        setRegenerateMerchant(null);
        await fetchMerchants();
      } else {
        const d = await res.json().catch(() => ({}));
        addToast(d.message || 'خطا در بازتولید کلیدها', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setRegenerating(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CreditCard className="size-5 text-gold" />
          <h2 className="text-lg font-bold">درگاه پرداخت</h2>
          <Badge className="bg-gold/15 text-gold text-xs">API Gateway</Badge>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'کل درخواست‌ها',
            value: toPersianDigits(String(merchants.length)),
            icon: Building2,
            color: 'text-gold',
            bg: 'bg-gold/15',
          },
          {
            label: 'در انتظار تأیید',
            value: toPersianDigits(String(pendingMerchants.length)),
            icon: Clock,
            color: 'text-amber-500',
            bg: 'bg-amber-500/15',
          },
          {
            label: 'فعال',
            value: toPersianDigits(String(activeMerchants.length)),
            icon: CheckCircle,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/15',
          },
          {
            label: 'حجم کل (گرم)',
            value: formatGrams(totalVolumeGrams),
            icon: Coins,
            color: 'text-amber-500',
            bg: 'bg-amber-500/15',
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="card-glass-premium">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-bold gold-gradient-text">{s.value}</p>
                  </div>
                  <div
                    className={cn(
                      'size-9 rounded-lg flex items-center justify-center',
                      s.bg,
                    )}
                  >
                    <Icon className={cn('size-4', s.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Tabs ── */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          setPage(1);
          setPaymentPage(1);
        }}
      >
        <TabsList className="bg-muted/50">
          <TabsTrigger value="merchants" className="text-xs">
            پذیرندگان
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs">
            پرداخت‌ها
          </TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/*  MERCHANTS TAB                                               */}
        {/* ============================================================ */}
        <TabsContent value="merchants" className="mt-4 space-y-4">
          {/* Search */}
          <Card className="glass-gold">
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="جستجوی نام کسب‌وکار، وب‌سایت..."
                    className="pr-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="card-gold-border">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[520px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">کسب‌وکار</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">وب‌سایت</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">کلید API</TableHead>
                      <TableHead className="text-xs">وضعیت</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">پرداخت‌ها</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">حجم</TableHead>
                      <TableHead className="text-xs hidden xl:table-cell">کارمزد</TableHead>
                      <TableHead className="text-xs text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={8}>
                              <Skeleton className="h-10 w-full" />
                            </TableCell>
                          </TableRow>
                        ))
                      : paginatedMerchants.map((m) => (
                          <TableRow
                            key={m.id}
                            className={cn(
                              'hover:bg-gold/5 transition-colors',
                              !m.isActive && 'opacity-60',
                            )}
                          >
                            {/* Business */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="size-8 shrink-0 rounded-lg bg-gold/15 flex items-center justify-center">
                                  <Building2 className="size-4 text-gold" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {m.businessName}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {m.user?.fullName || m.user?.phone}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            {/* Website */}
                            <TableCell className="hidden md:table-cell">
                              {m.website ? (
                                <span
                                  className="text-xs text-muted-foreground truncate block max-w-[140px]"
                                  dir="ltr"
                                >
                                  {m.website}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground/50">
                                  —
                                </span>
                              )}
                            </TableCell>

                            {/* API Key */}
                            <TableCell className="hidden lg:table-cell">
                              <div className="flex items-center gap-1.5">
                                <code
                                  className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded font-mono"
                                  dir="ltr"
                                >
                                  {maskKey(m.apiKey)}
                                </code>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-6 shrink-0"
                                  onClick={() =>
                                    handleCopyKey(m.apiKey, 'API Key')
                                  }
                                  title="کپی کلید API"
                                >
                                  <Copy className="size-3" />
                                </Button>
                              </div>
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              {(() => {
                                const status = getMerchantStatus(m);
                                return getMerchantStatusBadge(status);
                              })()}
                            </TableCell>

                            {/* Total Payments */}
                            <TableCell className="text-xs hidden sm:table-cell">
                              {toPersianDigits(String(m.totalPayments || 0))}
                            </TableCell>

                            {/* Total Volume */}
                            <TableCell className="text-xs hidden lg:table-cell">
                              {m.totalVolume > 0
                                ? formatGrams(m.totalVolume)
                                : '—'}
                            </TableCell>

                            {/* Fee */}
                            <TableCell className="text-xs hidden xl:table-cell">
                              <Badge
                                variant="outline"
                                className="text-[10px] border-gold/30 text-gold"
                              >
                                {toPersianDigits(String(m.feePercent))}٪
                              </Badge>
                            </TableCell>

                            {/* Actions */}
                            <TableCell>
                              <div className="flex items-center justify-center gap-0.5">
                                {/* View Details */}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-7 text-muted-foreground hover:text-gold"
                                  onClick={() => {
                                    setDetailMerchant(m);
                                    setDetailFee(m.isActive ? null : m.feePercent);
                                    setDetailOpen(true);
                                  }}
                                  title="مشاهده جزئیات"
                                >
                                  <Eye className="size-3.5" />
                                </Button>

                                {(() => {
                                  const status = getMerchantStatus(m);
                                  if (status === 'pending') {
                                    return (
                                      <>
                                        {/* Approve */}
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="size-7 text-emerald-500 hover:bg-emerald-500/10"
                                          disabled={togglingId === m.id}
                                          onClick={() => handleApproveMerchant(m)}
                                          title="تأیید"
                                        >
                                          {togglingId === m.id ? (
                                            <Loader2 className="size-3.5 animate-spin" />
                                          ) : (
                                            <CheckCircle className="size-3.5" />
                                          )}
                                        </Button>
                                        {/* Reject */}
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="size-7 text-red-500 hover:bg-red-500/10"
                                          onClick={() => handleRejectMerchant(m)}
                                          title="رد"
                                        >
                                          <XCircle className="size-3.5" />
                                        </Button>
                                      </>
                                    );
                                  }
                                  if (status === 'active') {
                                    return (
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="size-7 text-amber-500 hover:bg-amber-500/10"
                                        disabled={togglingId === m.id}
                                        onClick={() => handleToggleActive(m)}
                                        title="غیرفعال‌سازی"
                                      >
                                        {togglingId === m.id ? (
                                          <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                          <XCircle className="size-3.5" />
                                        )}
                                      </Button>
                                    );
                                  }
                                  return null;
                                })()}

                                {/* Regenerate Keys — only for active merchants */}
                                {m.isActive && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-7 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                                    onClick={() => setRegenerateMerchant(m)}
                                    title="بازتولید کلیدها"
                                  >
                                    <RefreshCw className="size-3.5" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}

                    {!loading && paginatedMerchants.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-10 text-muted-foreground text-sm"
                        >
                          <CreditCard className="size-10 mx-auto mb-2 opacity-20" />
                          پذیرنده‌ای یافت نشد
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalMerchantPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="border-gold/20 text-gold hover:bg-gold/10"
              >
                <ChevronRight className="size-4" />
                قبلی
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {toPersianDigits(String(page))} از{' '}
                {toPersianDigits(String(totalMerchantPages))}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalMerchantPages}
                onClick={() => setPage((p) => p + 1)}
                className="border-gold/20 text-gold hover:bg-gold/10"
              >
                بعدی
                <ChevronLeft className="size-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/*  PAYMENTS TAB                                                */}
        {/* ============================================================ */}
        <TabsContent value="payments" className="mt-4 space-y-4">
          {/* Filters */}
          <Card className="glass-gold">
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  value={paymentStatusFilter}
                  onValueChange={(v) => {
                    setPaymentStatusFilter(v);
                    setPaymentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                    <SelectItem value="pending">در انتظار</SelectItem>
                    <SelectItem value="paid">پرداخت شده</SelectItem>
                    <SelectItem value="failed">ناموفق</SelectItem>
                    <SelectItem value="expired">منقضی شده</SelectItem>
                    <SelectItem value="cancelled">لغو شده</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={merchantFilter}
                  onValueChange={(v) => {
                    setMerchantFilter(v);
                    setPaymentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="پذیرنده" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه پذیرندگان</SelectItem>
                    {merchants.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.businessName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="card-gold-border">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[520px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">شناسه</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">پذیرنده</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">کاربر</TableHead>
                      <TableHead className="text-xs">مقدار</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">قیمت طلا</TableHead>
                      <TableHead className="text-xs">وضعیت</TableHead>
                      <TableHead className="text-xs hidden xl:table-cell">کال‌بک</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">تاریخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={8}>
                              <Skeleton className="h-10 w-full" />
                            </TableCell>
                          </TableRow>
                        ))
                      : paginatedPayments.length > 0
                        ? paginatedPayments.map((p) => (
                            <TableRow
                              key={p.id}
                              className="hover:bg-gold/5 transition-colors"
                            >
                              {/* ID */}
                              <TableCell>
                                <code
                                  className="text-[10px] font-mono text-muted-foreground"
                                  dir="ltr"
                                >
                                  {p.id.slice(0, 8)}
                                </code>
                              </TableCell>

                              {/* Merchant */}
                              <TableCell className="hidden md:table-cell text-xs">
                                {p.merchantName || '—'}
                              </TableCell>

                              {/* User Phone */}
                              <TableCell className="hidden sm:table-cell text-xs" dir="ltr">
                                {p.userPhone}
                              </TableCell>

                              {/* Amount */}
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium">
                                    {p.amountGrams > 0
                                      ? formatGrams(p.amountGrams)
                                      : '—'}
                                  </span>
                                  {p.amountFiat > 0 && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {formatToman(p.amountFiat)}
                                    </span>
                                  )}
                                </div>
                              </TableCell>

                              {/* Gold Price */}
                              <TableCell className="hidden lg:table-cell text-xs">
                                {p.goldPrice > 0
                                  ? formatToman(p.goldPrice) + '/گرم'
                                  : '—'}
                              </TableCell>

                              {/* Status */}
                              <TableCell>
                                {getPaymentStatusBadge(p.status)}
                              </TableCell>

                              {/* Callback Status */}
                              <TableCell className="hidden xl:table-cell">
                                {p.callbackStatus === 'success' ? (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="size-3 text-emerald-500" />
                                    <span className="text-[10px] text-emerald-500">
                                      موفق
                                    </span>
                                  </div>
                                ) : p.callbackStatus === 'failed' ? (
                                  <div className="flex items-center gap-1">
                                    <XCircle className="size-3 text-red-500" />
                                    <span className="text-[10px] text-red-500">
                                      ناموفق
                                      {p.callbackAttempts > 0 &&
                                        ` (${toPersianDigits(String(p.callbackAttempts))})`}
                                    </span>
                                  </div>
                                ) : p.callbackAttempts > 0 ? (
                                  <div className="flex items-center gap-1">
                                    <AlertCircle className="size-3 text-amber-500" />
                                    <span className="text-[10px] text-amber-500">
                                      تلاش مجدد
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground/50">
                                    —
                                  </span>
                                )}
                              </TableCell>

                              {/* Date */}
                              <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                                {getTimeAgo(p.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))
                        : !loading && (
                            <TableRow>
                              <TableCell
                                colSpan={8}
                                className="text-center py-10 text-muted-foreground text-sm"
                              >
                                <ArrowUpDown className="size-10 mx-auto mb-2 opacity-20" />
                                {payments.length === 0
                                  ? 'هنوز پرداختی ثبت نشده است'
                                  : 'تراکنشی یافت نشد'}
                              </TableCell>
                            </TableRow>
                          )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Payment Pagination */}
          {totalPaymentPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={paymentPage <= 1}
                onClick={() => setPaymentPage((p) => p - 1)}
                className="border-gold/20 text-gold hover:bg-gold/10"
              >
                <ChevronRight className="size-4" />
                قبلی
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {toPersianDigits(String(paymentPage))} از{' '}
                {toPersianDigits(String(totalPaymentPages))}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={paymentPage >= totalPaymentPages}
                onClick={() => setPaymentPage((p) => p + 1)}
                className="border-gold/20 text-gold hover:bg-gold/10"
              >
                بعدی
                <ChevronLeft className="size-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ============================================================ */}
      {/*  MERCHANT DETAIL DIALOG                                       */}
      {/* ============================================================ */}
      <Dialog open={detailOpen} onOpenChange={(open) => {
        if (!open) { setDetailMerchant(null); setDetailFee(null); }
        setDetailOpen(open);
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-gold" />
              جزئیات پذیرنده
            </DialogTitle>
            <DialogDescription>
              {detailMerchant?.businessName}
            </DialogDescription>
          </DialogHeader>

          {detailMerchant && (() => {
            const mStatus = getMerchantStatus(detailMerchant);
            const isPending = mStatus === 'pending';

            return (
              <div className="space-y-4 pt-2">
                {/* Status badge at top */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">وضعیت:</span>
                  {getMerchantStatusBadge(mStatus)}
                </div>

                {/* Business Info */}
                <div className="rounded-xl bg-muted/30 p-4 space-y-3">
                  <h4 className="text-sm font-bold text-gold flex items-center gap-1.5">
                    <Globe className="size-3.5" />
                    اطلاعات کسب‌وکار
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">
                        نام کسب‌وکار
                      </span>
                      <span className="font-medium">
                        {detailMerchant.businessName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">
                        وب‌سایت
                      </span>
                      {detailMerchant.website ? (
                        <span
                          className="font-medium text-xs text-blue-400"
                          dir="ltr"
                        >
                          {detailMerchant.website}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">
                        مالک
                      </span>
                      <span className="font-medium">
                        {detailMerchant.user?.fullName || 'بدون نام'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">
                        تلفن مالک
                      </span>
                      <span className="font-medium text-xs" dir="ltr">
                        {detailMerchant.user?.phone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Callback URL */}
                <div className="rounded-xl bg-muted/30 p-4 space-y-2">
                  <h4 className="text-sm font-bold text-gold flex items-center gap-1.5">
                    <ExternalLink className="size-3.5" />
                    آدرس کال‌بک
                  </h4>
                  <code
                    className="block text-[11px] bg-background border border-border rounded-md px-2.5 py-1.5 font-mono break-all"
                    dir="ltr"
                  >
                    {detailMerchant.callbackUrl}
                  </code>
                </div>

                {/* Pending: Fee editor + Approve/Reject */}
                {isPending && (
                  <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 space-y-4">
                    <h4 className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      بررسی و تأیید درخواست
                    </h4>

                    {/* Fee percent editor */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        درصد کارمزد (پیش‌فرض: {detailMerchant.feePercent}٪)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          step={0.1}
                          value={detailFee ?? detailMerchant.feePercent}
                          onChange={(e) => setDetailFee(parseFloat(e.target.value) || 0)}
                          className="w-24 text-center"
                          dir="ltr"
                        />
                        <span className="text-sm text-muted-foreground">٪</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        onClick={() => handleApproveMerchant(detailMerchant, detailFee ?? undefined)}
                        disabled={togglingId === detailMerchant.id}
                        className="flex-1 gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        {togglingId === detailMerchant.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <CheckCircle className="size-4" />
                        )}
                        تأیید درخواست
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRejectMerchant(detailMerchant)}
                        disabled={togglingId === detailMerchant.id}
                        className="flex-1 gap-1.5 border-red-500/30 text-red-500 hover:bg-red-500/10"
                      >
                        <XCircle className="size-4" />
                        رد درخواست
                      </Button>
                    </div>
                  </div>
                )}

                {/* API Keys (only show for active merchants) */}
                {detailMerchant.isActive && (
                  <div className="rounded-xl bg-muted/30 p-4 space-y-3">
                    <h4 className="text-sm font-bold text-gold flex items-center gap-1.5">
                      <Key className="size-3.5" />
                      کلیدهای API
                    </h4>

                    {/* API Key */}
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        API Key
                      </Label>
                      <div className="flex items-center gap-2">
                        <code
                          className="flex-1 text-[11px] bg-background border border-border rounded-md px-2.5 py-1.5 font-mono"
                          dir="ltr"
                        >
                          {detailMerchant.apiKey}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 border-gold/20 text-gold hover:bg-gold/10"
                          onClick={() =>
                            handleCopyKey(detailMerchant.apiKey, 'API Key')
                          }
                        >
                          <Copy className="size-3.5 ml-1" />
                          کپی
                        </Button>
                      </div>
                    </div>

                    {/* API Secret */}
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        API Secret
                      </Label>
                      <div className="flex items-center gap-2">
                        <code
                          className="flex-1 text-[11px] bg-background border border-border rounded-md px-2.5 py-1.5 font-mono"
                          dir="ltr"
                        >
                          {detailMerchant.apiSecret}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 border-gold/20 text-gold hover:bg-gold/10"
                          onClick={() =>
                            handleCopyKey(
                              detailMerchant.apiSecret,
                              'API Secret',
                            )
                          }
                        >
                          <Copy className="size-3.5 ml-1" />
                          کپی
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="rounded-xl bg-muted/30 p-4 space-y-3">
                  <h4 className="text-sm font-bold text-gold flex items-center gap-1.5">
                    <TrendingUp className="size-3.5" />
                    آمار
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-bold gold-gradient-text">
                        {toPersianDigits(
                          String(detailMerchant.totalPayments || 0),
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        پرداخت
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-bold gold-gradient-text">
                        {detailMerchant.totalVolume > 0
                          ? formatGrams(detailMerchant.totalVolume)
                          : '۰'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        حجم (گرم)
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-bold gold-gradient-text">
                        {toPersianDigits(
                          String(detailMerchant.feePercent),
                        )}
                        ٪
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        کارمزد
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      تاریخ عضویت
                    </span>
                    <span className="text-xs">
                      {formatDateTime(detailMerchant.createdAt)}
                    </span>
                  </div>
                </div>

                {detailMerchant.description && (
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      توضیحات
                    </span>
                    <p className="text-xs mt-1">{detailMerchant.description}</p>
                  </div>
                )}

                <Separator />

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => { setDetailOpen(false); setDetailMerchant(null); setDetailFee(null); }}
                    className="border-gold/20 text-gold hover:bg-gold/10"
                  >
                    بستن
                  </Button>
                  {mStatus === 'active' && (
                    <Button
                      onClick={() => handleToggleActive(detailMerchant)}
                      disabled={togglingId === detailMerchant.id}
                      className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                      variant="outline"
                    >
                      {togglingId === detailMerchant.id ? (
                        <Loader2 className="size-4 ml-1.5 animate-spin" />
                      ) : (
                        <XCircle className="size-4 ml-1.5" />
                      )}
                      غیرفعال‌سازی
                    </Button>
                  )}
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/*  REGENERATE KEYS CONFIRMATION DIALOG                          */}
      {/* ============================================================ */}
      <AlertDialog
        open={!!regenerateMerchant}
        onOpenChange={(open) => {
          if (!open) setRegenerateMerchant(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="size-5 text-amber-500" />
              بازتولید کلیدهای API
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              آیا از بازتولید کلیدهای API برای پذیرنده{' '}
              <span className="font-bold text-foreground">
                {regenerateMerchant?.businessName}
              </span>{' '}
              اطمینان دارید؟
            </AlertDialogDescription>
            <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-xs text-red-400 leading-relaxed">
                ⚠️ با بازتولید کلیدها، کلیدهای قبلی بی‌اعتبار خواهند شد و
                پذیرنده باید کلیدهای جدید را در سیستم خود بروزرسانی کند.
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-2">
            <AlertDialogCancel className="border-gold/20 text-gold hover:bg-gold/10">
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRegenerateKeys}
              disabled={regenerating}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {regenerating && (
                <Loader2 className="size-4 ml-1.5 animate-spin" />
              )}
              بله، بازتولید شود
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

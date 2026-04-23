'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { formatNumber, formatToman, formatGrams, formatDateTime, getTimeAgo } from '@/lib/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Store, Users, ShieldCheck, Clock, ArrowUpDown, Coins, TrendingUp,
  CheckCircle, XCircle, Settings, CreditCard, Wallet, Percent,
  AlertTriangle, Eye, RefreshCw, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PlatformStats {
  totalMerchants: number;
  activeMerchants: number;
  pendingKyc: number;
  todayTxCount: number;
  todayVolumeToman: number;
  todayVolumeGold: number;
  todayFeeRevenue: number;
  feeSettings: {
    defaultFeeRate: number;
    minFee: number;
    maxFee: number;
  };
  recentPayments: RecentPayment[];
}

interface MerchantItem {
  id: string;
  businessName: string;
  businessType: string;
  kycStatus: string;
  isVerified: boolean;
  totalSales: number;
  createdAt: string;
  user: {
    id: string;
    phone: string;
    fullName: string | null;
    email: string | null;
  };
}

interface RecentPayment {
  id: string;
  authority: string;
  amountToman: number;
  amountGold: number;
  goldGrams: number;
  feeToman: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  merchant: { id: string; businessName: string } | null;
}

interface SettlementItem {
  id: string;
  amountToman: number;
  amountGold: number;
  feeToman: number;
  type: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  processedAt: string | null;
  createdAt: string;
  merchant: { id: string; businessName: string; iban: string | null } | null;
}

/* ------------------------------------------------------------------ */
/*  Status badge helper                                                */
/* ------------------------------------------------------------------ */

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'در انتظار', cls: 'bg-amber-500/15 text-amber-500 border-amber-500/20' },
    approved: { label: 'تأیید شده', cls: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' },
    rejected: { label: 'رد شده', cls: 'bg-red-500/15 text-red-500 border-red-500/20' },
    processing: { label: 'در حال پردازش', cls: 'bg-blue-500/15 text-blue-500 border-blue-500/20' },
    completed: { label: 'تکمیل شده', cls: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
    paid: { label: 'پرداخت شده', cls: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' },
    failed: { label: 'ناموفق', cls: 'bg-red-500/15 text-red-500 border-red-500/20' },
    expired: { label: 'منقضی', cls: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
    refunded: { label: 'بازپرداخت', cls: 'bg-purple-500/15 text-purple-500 border-purple-500/20' },
  };
  const item = map[status] || map.pending;
  return <Badge variant="outline" className={cn('text-[10px]', item.cls)}>{item.label}</Badge>;
}

function getMethodLabel(method: string) {
  const map: Record<string, string> = {
    toman: 'واحد طلایی',
    gold: 'طلایی',
    mixed: 'ترکیبی',
  };
  return map[method] || method;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function GatewayAdminView() {
  const addToast = useAppStore((s) => s.addToast);

  // ── State ──
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [merchants, setMerchants] = useState<MerchantItem[]>([]);
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [settlementCounts, setSettlementCounts] = useState({ pending: 0, processing: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // KYC state
  const [kycFilter, setKycFilter] = useState('pending');
  const [kycDialog, setKycDialog] = useState<MerchantItem | null>(null);
  const [kycAction, setKycAction] = useState<'approve' | 'reject'>('approve');
  const [rejectReason, setRejectReason] = useState('');
  const [kycLoading, setKycLoading] = useState(false);

  // Payments filter state
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [paymentMerchantFilter, setPaymentMerchantFilter] = useState('all');

  // Settlement filter
  const [settlementStatusFilter, setSettlementStatusFilter] = useState('all');
  const [settlementActionLoading, setSettlementActionLoading] = useState<string | null>(null);

  // Fee settings form
  const [feeForm, setFeeForm] = useState({
    defaultFeeRate: '',
    minFee: '',
    maxFee: '',
  });
  const [feeSaving, setFeeSaving] = useState(false);

  // ── Fetch platform stats ──
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/gateway?XTransformPort=3000');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        if (data.feeSettings) {
          setFeeForm({
            defaultFeeRate: String(data.feeSettings.defaultFeeRate),
            minFee: String(data.feeSettings.minFee),
            maxFee: String(data.feeSettings.maxFee),
          });
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // ── Fetch merchants by KYC status ──
  const fetchMerchants = useCallback(async (kyc?: string) => {
    try {
      const params = new URLSearchParams();
      params.set('kyc', kyc || kycFilter);
      params.set('limit', '50');
      const res = await fetch(`/api/v1/admin/gateway/merchants?${params.toString()}&XTransformPort=3000`);
      if (res.ok) {
        const data = await res.json();
        setMerchants(data.merchants || []);
      }
    } catch {
      /* ignore */
    }
  }, [kycFilter]);

  // ── Fetch settlements ──
  const fetchSettlements = useCallback(async (status?: string) => {
    try {
      const params = new URLSearchParams();
      params.set('status', status || settlementStatusFilter);
      params.set('limit', '50');
      const res = await fetch(`/api/v1/admin/gateway/settlements?${params.toString()}&XTransformPort=3000`);
      if (res.ok) {
        const data = await res.json();
        setSettlements(data.settlements || []);
        setSettlementCounts(data.counts || { pending: 0, processing: 0, completed: 0 });
      }
    } catch {
      /* ignore */
    }
  }, [settlementStatusFilter]);

  // ── Initial load ──
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchMerchants(), fetchSettlements()]);
      setLoading(false);
    };
    init();
  }, []);

  // ── Tab change handler ──
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'kyc') fetchMerchants(kycFilter);
    if (tab === 'payments') fetchStats(); // payments come from stats
    if (tab === 'fees') fetchStats();
    if (tab === 'settlements') fetchSettlements(settlementStatusFilter);
  };

  // ── KYC action ──
  const handleKycAction = async () => {
    if (!kycDialog) return;
    setKycLoading(true);
    try {
      const body: { merchantId: string; action: 'approve' | 'reject'; reason?: string } = {
        merchantId: kycDialog.id,
        action: kycAction,
      };
      if (kycAction === 'reject' && rejectReason) body.reason = rejectReason;

      const res = await fetch('/api/v1/admin/gateway/merchants?XTransformPort=3000', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        addToast(
          kycAction === 'approve' ? 'احراز هویت تأیید شد' : 'احراز هویت رد شد',
          'success'
        );
        setKycDialog(null);
        setRejectReason('');
        fetchMerchants(kycFilter);
        fetchStats(); // refresh pending count
      } else {
        const data = await res.json();
        addToast(data.message || 'خطا در عملیات', 'error');
      }
    } catch {
      addToast('خطای شبکه', 'error');
    }
    setKycLoading(false);
  };

  // ── Settlement action ──
  const handleSettlementAction = async (settlementId: string, action: 'approve' | 'process') => {
    setSettlementActionLoading(settlementId);
    try {
      const res = await fetch('/api/v1/admin/gateway/settlements?XTransformPort=3000', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settlementId, action }),
      });

      if (res.ok) {
        const data = await res.json();
        addToast(data.message || 'عملیات موفق', 'success');
        fetchSettlements(settlementStatusFilter);
        fetchStats();
      } else {
        const data = await res.json();
        addToast(data.message || 'خطا در عملیات', 'error');
      }
    } catch {
      addToast('خطای شبکه', 'error');
    }
    setSettlementActionLoading(null);
  };

  // ── Save fee settings ──
  const handleSaveFees = async () => {
    setFeeSaving(true);
    try {
      const body = {
        defaultFeeRate: parseFloat(feeForm.defaultFeeRate) || 1,
        minFee: parseFloat(feeForm.minFee) || 0,
        maxFee: parseFloat(feeForm.maxFee) || 500000,
      };
      const res = await fetch('/api/v1/admin/gateway?XTransformPort=3000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        addToast('تنظیمات کارمزد ذخیره شد', 'success');
      } else {
        addToast('خطا در ذخیره تنظیمات', 'error');
      }
    } catch {
      addToast('خطای شبکه', 'error');
    }
    setFeeSaving(false);
  };

  // ── Filtered payments ──
  const filteredPayments = (stats?.recentPayments || []).filter((p) => {
    if (paymentStatusFilter !== 'all' && p.status !== paymentStatusFilter) return false;
    if (paymentMethodFilter !== 'all' && p.paymentMethod !== paymentMethodFilter) return false;
    if (paymentMerchantFilter !== 'all' && p.merchant?.id !== paymentMerchantFilter) return false;
    return true;
  });

  // ── Unique merchants for filter dropdown ──
  const uniqueMerchants = (stats?.recentPayments || []).reduce<
    Array<{ id: string; name: string }>
  >((acc, p) => {
    if (p.merchant && !acc.find((m) => m.id === p.merchant.id)) {
      acc.push({ id: p.merchant.id, name: p.merchant.businessName });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-4">
      {/* ── Page Header ── */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gold/15">
          <Store className="size-5 text-gold" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">مدیریت درگاه پرداخت</h1>
          <p className="text-xs text-muted-foreground">
            مدیریت پذیرندگان، تراکنش‌ها، کارمزدها و تسویه‌ها
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1 p-1 bg-muted/50">
          <TabsTrigger value="overview" className="gap-1.5 text-xs">
            <TrendingUp className="size-3.5" />
            نمای کلی
          </TabsTrigger>
          <TabsTrigger value="kyc" className="gap-1.5 text-xs">
            <ShieldCheck className="size-3.5" />
            احراز هویت
            {stats?.pendingKyc ? (
              <Badge className="bg-amber-500/20 text-[9px] text-amber-500 border-amber-500/30">
                {stats.pendingKyc}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5 text-xs">
            <CreditCard className="size-3.5" />
            پرداخت‌ها
          </TabsTrigger>
          <TabsTrigger value="fees" className="gap-1.5 text-xs">
            <Percent className="size-3.5" />
            کارمزدها
          </TabsTrigger>
          <TabsTrigger value="settlements" className="gap-1.5 text-xs">
            <Wallet className="size-3.5" />
            تسویه‌ها
            {settlementCounts.pending > 0 ? (
              <Badge className="bg-amber-500/20 text-[9px] text-amber-500 border-amber-500/30">
                {settlementCounts.pending}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/*  TAB 1: Platform Overview                                        */}
        {/* ================================================================ */}
        <TabsContent value="overview">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : stats ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'کل پذیرندگان', value: formatNumber(stats.totalMerchants), icon: Store, color: 'text-gold', bg: 'bg-gold/15' },
                  { label: 'پذیرندگان فعال', value: formatNumber(stats.activeMerchants), icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/15' },
                  { label: 'KYC در انتظار', value: formatNumber(stats.pendingKyc), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/15' },
                  { label: 'تراکنش امروز', value: formatNumber(stats.todayTxCount), icon: ArrowUpDown, color: 'text-blue-500', bg: 'bg-blue-500/15' },
                  { label: 'حجم امروز (واحد طلایی)', value: formatToman(stats.todayVolumeToman), icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-500/15' },
                  { label: 'حجم امروز (طلا)', value: formatGrams(stats.todayVolumeGold), icon: Coins, color: 'text-gold', bg: 'bg-gold/15' },
                  { label: 'درآمد کارمزد امروز', value: formatToman(stats.todayFeeRevenue), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/15' },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <Card key={s.label} className="card-spotlight">
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-muted-foreground truncate">{s.label}</p>
                            <p className="text-sm font-bold gold-gradient-text mt-0.5">{s.value}</p>
                          </div>
                          <div className={cn('size-9 shrink-0 rounded-lg flex items-center justify-center', s.bg)}>
                            <Icon className={cn('size-4', s.color)} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Recent Payments */}
              <Card className="glass-gold">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="size-4 text-gold" />
                    آخرین پرداخت‌ها
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ScrollArea className="max-h-72">
                    {stats.recentPayments.length > 0 ? (
                      <div className="space-y-2">
                        {stats.recentPayments.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="size-8 shrink-0 rounded-full bg-gold/10 flex items-center justify-center">
                                <CreditCard className="size-3.5 text-gold" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {p.merchant?.businessName || 'نامشخص'}
                                </p>
                                <p className="text-[10px] text-muted-foreground" dir="ltr">
                                  {p.authority.slice(0, 12)}...
                                </p>
                              </div>
                            </div>
                            <div className="text-end shrink-0">
                              <p className="text-xs font-bold">
                                {formatToman(p.amountToman)}
                              </p>
                              {p.amountGold > 0 && (
                                <p className="text-[10px] text-gold">
                                  {formatGrams(p.amountGold)}
                                </p>
                              )}
                              <div className="flex items-center gap-1.5 justify-end mt-0.5">
                                {getStatusBadge(p.status)}
                                <span className="text-[10px] text-muted-foreground">
                                  {getTimeAgo(p.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        پرداختی یافت نشد
                      </p>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* ================================================================ */}
        {/*  TAB 2: KYC Approvals                                            */}
        {/* ================================================================ */}
        <TabsContent value="kyc">
          {/* KYC Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'pending', label: 'در انتظار بررسی' },
              { key: 'approved', label: 'تأیید شده' },
              { key: 'rejected', label: 'رد شده' },
              { key: 'all', label: 'همه' },
            ].map((f) => (
              <Button
                key={f.key}
                size="sm"
                variant={kycFilter === f.key ? 'default' : 'outline'}
                onClick={() => {
                  setKycFilter(f.key);
                  fetchMerchants(f.key);
                }}
                className={cn(
                  'text-xs',
                  kycFilter === f.key
                    ? 'bg-gold text-white'
                    : 'border-gold/20 text-gold hover:bg-gold/10'
                )}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {/* Merchants Table */}
          <Card className="glass-gold">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[480px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gold/10">
                      <TableHead className="text-xs">نام کسب‌وکار</TableHead>
                      <TableHead className="text-xs">مالک</TableHead>
                      <TableHead className="text-xs">تلفن</TableHead>
                      <TableHead className="text-xs">تاریخ ثبت‌نام</TableHead>
                      <TableHead className="text-xs text-center">وضعیت KYC</TableHead>
                      <TableHead className="text-xs text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {merchants.length > 0 ? (
                      merchants.map((m) => (
                        <TableRow key={m.id} className="border-gold/5">
                          <TableCell className="text-xs font-medium">{m.businessName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {m.user?.fullName || '-'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground" dir="ltr">
                            {m.user?.phone || '-'}
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">
                            {formatDateTime(m.createdAt)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(m.kycStatus)}
                          </TableCell>
                          <TableCell className="text-center">
                            {m.kycStatus === 'pending' && (
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-[10px] text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                  onClick={() => {
                                    setKycDialog(m);
                                    setKycAction('approve');
                                    setRejectReason('');
                                  }}
                                >
                                  <CheckCircle className="size-3 ml-1" />
                                  تأیید
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-[10px] text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                  onClick={() => {
                                    setKycDialog(m);
                                    setKycAction('reject');
                                    setRejectReason('');
                                  }}
                                >
                                  <XCircle className="size-3 ml-1" />
                                  رد
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                          پذیرنده‌ای یافت نشد
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* KYC Action Dialog */}
          <Dialog open={!!kycDialog} onOpenChange={() => setKycDialog(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {kycAction === 'approve' ? 'تأیید احراز هویت' : 'رد احراز هویت'}
                </DialogTitle>
                <DialogDescription>
                  {kycAction === 'approve'
                    ? 'آیا از تأیید احراز هویت این پذیرنده اطمینان دارید؟'
                    : 'لطفاً دلیل رد احراز هویت را وارد کنید.'}
                </DialogDescription>
              </DialogHeader>

              {kycDialog && (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">نام کسب‌وکار:</span>
                      <span className="font-medium">{kycDialog.businessName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">مالک:</span>
                      <span className="font-medium">{kycDialog.user?.fullName || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تلفن:</span>
                      <span className="font-medium" dir="ltr">{kycDialog.user?.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">نوع:</span>
                      <span className="font-medium">{kycDialog.businessType}</span>
                    </div>
                  </div>

                  {kycAction === 'reject' && (
                    <div className="space-y-2">
                      <Label className="text-xs">دلیل رد</Label>
                      <Textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="توضیح دلیل رد احراز هویت..."
                        rows={3}
                      />
                    </div>
                  )}

                  <DialogFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setKycDialog(null)}
                      className="flex-1 border-gold/20 text-gold hover:bg-gold/10"
                    >
                      انصراف
                    </Button>
                    <Button
                      onClick={handleKycAction}
                      disabled={kycLoading || (kycAction === 'reject' && !rejectReason.trim())}
                      className={cn(
                        'flex-1 text-white',
                        kycAction === 'approve'
                          ? 'bg-emerald-500 hover:bg-emerald-600'
                          : 'bg-red-500 hover:bg-red-600'
                      )}
                    >
                      {kycLoading && <Loader2 className="size-4 ml-1.5 animate-spin" />}
                      {kycAction === 'approve' ? 'تأیید احراز هویت' : 'رد احراز هویت'}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ================================================================ */}
        {/*  TAB 3: All Payments                                             */}
        {/* ================================================================ */}
        <TabsContent value="payments">
          {/* Payment Filters */}
          <Card className="glass-gold mb-4">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1.5 min-w-[140px]">
                  <Label className="text-[11px] text-muted-foreground">وضعیت</Label>
                  <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="pending">در انتظار</SelectItem>
                      <SelectItem value="paid">پرداخت شده</SelectItem>
                      <SelectItem value="failed">ناموفق</SelectItem>
                      <SelectItem value="expired">منقضی</SelectItem>
                      <SelectItem value="refunded">بازپرداخت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 min-w-[140px]">
                  <Label className="text-[11px] text-muted-foreground">روش پرداخت</Label>
                  <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="toman">واحد طلایی</SelectItem>
                      <SelectItem value="gold">طلایی</SelectItem>
                      <SelectItem value="mixed">ترکیبی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 min-w-[140px]">
                  <Label className="text-[11px] text-muted-foreground">پذیرنده</Label>
                  <Select value={paymentMerchantFilter} onValueChange={setPaymentMerchantFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه پذیرندگان</SelectItem>
                      {uniqueMerchants.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPaymentStatusFilter('all');
                    setPaymentMethodFilter('all');
                    setPaymentMerchantFilter('all');
                  }}
                  className="h-8 text-xs border-gold/20 text-gold hover:bg-gold/10"
                >
                  <RefreshCw className="size-3 ml-1" />
                  پاک کردن فیلتر
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card className="glass-gold">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[480px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gold/10">
                      <TableHead className="text-xs">شناسه</TableHead>
                      <TableHead className="text-xs">پذیرنده</TableHead>
                      <TableHead className="text-xs">مبلغ (واحد طلایی)</TableHead>
                      <TableHead className="text-xs">مبلغ (طلا)</TableHead>
                      <TableHead className="text-xs">روش</TableHead>
                      <TableHead className="text-xs text-center">وضعیت</TableHead>
                      <TableHead className="text-xs">تاریخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length > 0 ? (
                      filteredPayments.map((p) => (
                        <TableRow key={p.id} className="border-gold/5">
                          <TableCell className="text-[11px] font-mono" dir="ltr">
                            {p.authority.slice(0, 10)}...
                          </TableCell>
                          <TableCell className="text-xs">
                            {p.merchant?.businessName || '-'}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {formatToman(p.amountToman)}
                          </TableCell>
                          <TableCell className="text-xs text-gold">
                            {p.amountGold > 0 ? formatGrams(p.amountGold) : '-'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {getMethodLabel(p.paymentMethod)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(p.status)}
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">
                            {getTimeAgo(p.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                          پرداختی یافت نشد
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/*  TAB 4: Fee Settings                                             */}
        {/* ================================================================ */}
        <TabsContent value="fees">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Current Settings */}
            <Card className="glass-gold">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="size-4 text-gold" />
                  تنظیمات کارمزد فعلی
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {stats?.feeSettings ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[11px] text-muted-foreground mb-1">نرخ کارمزد پیش‌فرض</p>
                      <p className="text-lg font-bold gold-gradient-text">
                        {stats.feeSettings.defaultFeeRate}%
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[11px] text-muted-foreground mb-1">حداقل کارمزد</p>
                        <p className="text-sm font-bold">{formatToman(stats.feeSettings.minFee)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[11px] text-muted-foreground mb-1">حداکثر کارمزد</p>
                        <p className="text-sm font-bold">{formatToman(stats.feeSettings.maxFee)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Skeleton className="h-32 rounded-lg" />
                )}
              </CardContent>
            </Card>

            {/* Edit Settings */}
            <Card className="glass-gold">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Percent className="size-4 text-gold" />
                  ویرایش تنظیمات
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">نرخ کارمزد پیش‌فرض (درصد)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={feeForm.defaultFeeRate}
                    onChange={(e) => setFeeForm({ ...feeForm, defaultFeeRate: e.target.value })}
                    dir="ltr"
                    placeholder="1"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">حداقل کارمزد (واحد طلایی)</Label>
                    <Input
                      type="number"
                      value={feeForm.minFee}
                      onChange={(e) => setFeeForm({ ...feeForm, minFee: e.target.value })}
                      dir="ltr"
                      placeholder="0"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">حداکثر کارمزد (واحد طلایی)</Label>
                    <Input
                      type="number"
                      value={feeForm.maxFee}
                      onChange={(e) => setFeeForm({ ...feeForm, maxFee: e.target.value })}
                      dir="ltr"
                      placeholder="500000"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSaveFees}
                  disabled={feeSaving}
                  className="w-full bg-gold hover:bg-gold-dark text-white"
                >
                  {feeSaving && <Loader2 className="size-4 ml-1.5 animate-spin" />}
                  ذخیره تنظیمات
                </Button>
              </CardContent>
            </Card>

            {/* Fee Tiers Info */}
            <Card className="glass-gold md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="size-4 text-gold" />
                  سطوح کارمزد پذیرندگان
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      name: 'پایه',
                      rate: '۱.۵٪',
                      description: 'حجم فروش ماهانه تا ۵۰ میلیون واحد طلایی',
                      color: 'border-gold/20',
                      icon: '🥉',
                    },
                    {
                      name: 'حرفه‌ای',
                      rate: '۱٪',
                      description: 'حجم فروش ماهانه ۵۰ تا ۵۰۰ میلیون واحد طلایی',
                      color: 'border-gold/30',
                      icon: '🥈',
                    },
                    {
                      name: 'الماسی',
                      rate: '۰.۷٪',
                      description: 'حجم فروش ماهانه بیش از ۵۰۰ میلیون واحد طلایی',
                      color: 'border-gold/40',
                      icon: '🥇',
                    },
                  ].map((tier) => (
                    <div
                      key={tier.name}
                      className={cn(
                        'p-4 rounded-xl border bg-muted/30 transition-colors hover:bg-muted/50',
                        tier.color
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold flex items-center gap-2">
                          <span>{tier.icon}</span>
                          {tier.name}
                        </span>
                        <span className="text-lg font-bold gold-gradient-text">{tier.rate}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{tier.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ================================================================ */}
        {/*  TAB 5: Settlement Management                                    */}
        {/* ================================================================ */}
        <TabsContent value="settlements">
          {/* Settlement Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'در انتظار', value: settlementCounts.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/15' },
              { label: 'در حال پردازش', value: settlementCounts.processing, icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/15' },
              { label: 'تکمیل شده', value: settlementCounts.completed, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/15' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.label} className="card-spotlight">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                        <p className="text-lg font-bold gold-gradient-text">{s.value}</p>
                      </div>
                      <div className={cn('size-8 rounded-lg flex items-center justify-center', s.bg)}>
                        <Icon className={cn('size-4', s.color)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Settlement Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'all', label: 'همه' },
              { key: 'pending', label: 'در انتظار' },
              { key: 'processing', label: 'در حال پردازش' },
              { key: 'completed', label: 'تکمیل شده' },
            ].map((f) => (
              <Button
                key={f.key}
                size="sm"
                variant={settlementStatusFilter === f.key ? 'default' : 'outline'}
                onClick={() => {
                  setSettlementStatusFilter(f.key);
                  fetchSettlements(f.key);
                }}
                className={cn(
                  'text-xs',
                  settlementStatusFilter === f.key
                    ? 'bg-gold text-white'
                    : 'border-gold/20 text-gold hover:bg-gold/10'
                )}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {/* Settlements Table */}
          <Card className="glass-gold">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[480px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gold/10">
                      <TableHead className="text-xs">پذیرنده</TableHead>
                      <TableHead className="text-xs">مبلغ (واحد طلایی)</TableHead>
                      <TableHead className="text-xs">مبلغ (طلا)</TableHead>
                      <TableHead className="text-xs">کارمزد</TableHead>
                      <TableHead className="text-xs">دوره</TableHead>
                      <TableHead className="text-xs text-center">وضعیت</TableHead>
                      <TableHead className="text-xs text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlements.length > 0 ? (
                      settlements.map((s) => (
                        <TableRow key={s.id} className="border-gold/5">
                          <TableCell className="text-xs font-medium">
                            {s.merchant?.businessName || '-'}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {formatToman(s.amountToman)}
                          </TableCell>
                          <TableCell className="text-xs text-gold">
                            {s.amountGold > 0 ? formatGrams(s.amountGold) : '-'}
                          </TableCell>
                          <TableCell className="text-xs text-red-400">
                            {formatToman(s.feeToman)}
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">
                            {formatDateTime(s.periodStart)}
                            {' '}
                            تا
                            {' '}
                            {formatDateTime(s.periodEnd)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(s.status)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {s.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-[10px] text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                  onClick={() => handleSettlementAction(s.id, 'approve')}
                                  disabled={settlementActionLoading === s.id}
                                >
                                  {settlementActionLoading === s.id ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="size-3 ml-1" />
                                  )}
                                  تأیید
                                </Button>
                              )}
                              {s.status === 'processing' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-[10px] text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                                  onClick={() => handleSettlementAction(s.id, 'process')}
                                  disabled={settlementActionLoading === s.id}
                                >
                                  {settlementActionLoading === s.id ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    <Wallet className="size-3 ml-1" />
                                  )}
                                  تسویه نهایی
                                </Button>
                              )}
                              {s.status === 'completed' && (
                                <span className="text-[10px] text-muted-foreground">
                                  {s.processedAt ? formatDateTime(s.processedAt) : '-'}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                          تسویه‌ای یافت نشد
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

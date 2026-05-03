
import React, { useState, useEffect, useCallback } from 'react';
import {useAppStore} from '@/lib/store';
import {formatNumber, formatToman, formatGrams, formatDateTime, getTimeAgo, toPersianDigits} from '@/lib/helpers';
import {cn} from '@/lib/utils';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {Textarea} from '@/components/ui/textarea';
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Wallet, Eye, RefreshCw, CheckCircle, XCircle, Clock, Loader2, ChevronLeft, ChevronRight, Coins, FileText} from 'lucide-react';
import TransactionReceipt from '@/components/shared/TransactionReceipt';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Settlement {
  id: string;
  merchantId: string;
  merchantName: string;
  amountGrams: number;
  amountFiat: number;
  feeGrams: number;
  netGrams: number;
  status: string;
  settlementType: string;
  paymentCount: number;
  periodStart: string;
  periodEnd: string;
  description: string | null;
  adminNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  processedAt: string | null;
  createdAt: string;
}

interface MerchantOption {
  id: string;
  businessName: string;
}

/* ------------------------------------------------------------------ */
/*  Status / Type badge helpers                                        */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<string, { label: string; color: string; pulse?: boolean }> = {
  pending: { label: 'در انتظار', color: 'bg-amber-500/15 text-amber-500', pulse: true },
  processing: { label: 'در حال پردازش', color: 'bg-blue-500/15 text-blue-500' },
  completed: { label: 'تکمیل‌شده', color: 'bg-emerald-500/15 text-emerald-500' },
  rejected: { label: 'رد شده', color: 'bg-red-500/15 text-red-500' },
};

function getStatusBadge(status: string) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'text-gray-500 bg-gray-500/15' };
  return (
    <Badge className={cn('text-[10px]', cfg.color, cfg.pulse && 'animate-pulse')}>
      {status === 'pending' && <Clock className="size-3 ml-1" />}
      {status === 'processing' && <Loader2 className="size-3 ml-1 animate-spin" />}
      {status === 'completed' && <CheckCircle className="size-3 ml-1" />}
      {status === 'rejected' && <XCircle className="size-3 ml-1" />}
      {cfg.label}
    </Badge>
  );
}

const TYPE_CONFIG: Record<string, { label: string; short: string; color: string; pulse?: boolean }> = {
  instant: { label: 'تسویه آنی', short: 'آی', color: 'bg-emerald-500/15 text-emerald-500', pulse: true },
  daily: { label: 'تسویه روزانه', short: 'رو', color: 'bg-blue-500/15 text-blue-500' },
  manual: { label: 'تسویه دستی', short: 'دس', color: 'bg-gray-500/15 text-gray-500' },
};

function getTypeBadge(settlementType: string) {
  const safeType = settlementType || 'manual';
  const cfg = TYPE_CONFIG[safeType] || { label: safeType, short: safeType.slice(0, 2), color: 'text-gray-500 bg-gray-500/15' };
  return (
    <Badge
      className={cn('text-[10px]', cfg.color, cfg.pulse && 'animate-pulse')}
      title={cfg.label}
    >
      {cfg.short}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminSettlements() {
  const addToast = useAppStore((s) => s.addToast);
  const token = useAppStore((s) => s.token);

  /* ---- Data ---- */
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [merchants, setMerchants] = useState<MerchantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  /* ---- Filters ---- */
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [merchantFilter, setMerchantFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 20;

  /* ---- Dialogs ---- */
  const [detailSettlement, setDetailSettlement] = useState<Settlement | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [approveSettlement, setApproveSettlement] = useState<Settlement | null>(null);
  const [rejectSettlement, setRejectSettlement] = useState<Settlement | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [completeSettlement, setCompleteSettlement] = useState<Settlement | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* ---- Fetch merchants for dropdown ---- */
  const fetchMerchants = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/gateway/merchant/list', { headers });
      if (res.ok) {
        const d = await res.json();
        const list = Array.isArray(d) ? d : d.merchants || [];
        setMerchants(list.map((m: { id: string; businessName: string }) => ({ id: m.id, businessName: m.businessName })));
      }
    } catch {
      /* ignore */
    }
  }, [token]);

  /* ---- Fetch settlements ---- */
  const fetchSettlements = useCallback(async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('settlementType', typeFilter);
      if (merchantFilter !== 'all') params.set('merchantId', merchantFilter);
      params.set('page', String(page));
      params.set('limit', String(perPage));

      const res = await fetch(`/api/admin/settlements?${params.toString()}`, { headers });
      if (res.ok) {
        const d = await res.json();
        const list = Array.isArray(d) ? d : d.settlements || d.data || [];
        const total = typeof d.total === 'number' ? d.total : list.length;
        setSettlements(list);
        setTotalItems(total);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, typeFilter, merchantFilter, page]);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  /* ---- Computed stats ---- */
  const totalRequests = totalItems || settlements.length;
  const pendingCount = settlements.filter((s) => s.status === 'pending').length;
  const processingCount = settlements.filter((s) => s.status === 'processing').length;
  const completedCount = settlements.filter((s) => s.status === 'completed').length;

  /* ---- Pagination ---- */
  const totalPages = Math.max(1, Math.ceil(totalRequests / perPage));

  /* ---- Reset page on filter change ---- */
  const handleStatusChange = (v: string) => { setStatusFilter(v); setPage(1); };
  const handleTypeChange = (v: string) => { setTypeFilter(v); setPage(1); };
  const handleMerchantChange = (v: string) => { setMerchantFilter(v); setPage(1); };

  /* ---- Action handler ---- */
  const handleSettlementAction = async (settlement: Settlement, action: 'approve' | 'reject' | 'complete', adminNote?: string) => {
    setActionLoading(settlement.id);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const body: Record<string, unknown> = { action };
      if (adminNote) body.adminNote = adminNote;

      const res = await fetch(`/api/admin/settlements/${settlement.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const messages: Record<string, string> = {
          approve: 'تسویه‌حساب انجام شد — مبلغ به کیف پول پذیرنده واریز شد',
          reject: 'درخواست تسویه رد شد',
          complete: 'تسویه‌حساب تکمیل شد',
        };
        addToast(messages[action], 'success');
        setApproveSettlement(null);
        setRejectSettlement(null);
        setRejectNote('');
        setCompleteSettlement(null);
        await fetchSettlements();
      } else {
        const d = await res.json().catch(() => ({}));
        addToast(d.message || 'خطا در انجام عملیات', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  /* ---- Refresh ---- */
  const handleRefresh = () => {
    fetchSettlements();
    addToast('لیست تسویه‌ها بروزرسانی شد', 'info');
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Wallet className="size-5 text-gold" />
          <h2 className="text-lg font-bold">تسویه‌حساب پذیرندگان</h2>
          <Badge className="bg-gold/15 text-gold text-xs">تسویه‌ها</Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
          className="border-gold/20 text-gold hover:bg-gold/10 gap-1.5"
        >
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
          بروزرسانی
        </Button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'کل درخواست‌ها',
            value: toPersianDigits(String(totalRequests)),
            icon: Wallet,
            color: 'text-gold',
            bg: 'bg-gold/15',
          },
          {
            label: 'در انتظار بررسی',
            value: toPersianDigits(String(pendingCount)),
            icon: Clock,
            color: 'text-amber-500',
            bg: 'bg-amber-500/15',
            pulse: pendingCount > 0,
          },
          {
            label: 'در حال پردازش',
            value: toPersianDigits(String(processingCount)),
            icon: Loader2,
            color: 'text-blue-500',
            bg: 'bg-blue-500/15',
          },
          {
            label: 'تکمیل‌شده',
            value: toPersianDigits(String(completedCount)),
            icon: CheckCircle,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/15',
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
                      s.pulse && 'animate-pulse',
                    )}
                  >
                    <Icon className={cn('size-4', s.color, s.pulse && 'animate-pulse')} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <Card className="glass-gold">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="pending">در انتظار</SelectItem>
                <SelectItem value="processing">در حال پردازش</SelectItem>
                <SelectItem value="completed">تکمیل‌شده</SelectItem>
                <SelectItem value="rejected">رد شده</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="نوع تسویه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه انواع</SelectItem>
                <SelectItem value="instant">آنی</SelectItem>
                <SelectItem value="daily">روزانه</SelectItem>
                <SelectItem value="manual">دستی</SelectItem>
              </SelectContent>
            </Select>

            <Select value={merchantFilter} onValueChange={handleMerchantChange}>
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

            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="border-gold/20 text-gold hover:bg-gold/10 gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
              بروزرسانی
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Table ── */}
      <Card className="card-gold-border">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[520px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs">شناسه</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">پذیرنده</TableHead>
                  <TableHead className="text-xs">نوع</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">طلای ناخالص</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">کارمزد</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">خالص</TableHead>
                  <TableHead className="text-xs hidden xl:table-cell">تعداد تراکنش</TableHead>
                  <TableHead className="text-xs">وضعیت</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">تاریخ</TableHead>
                  <TableHead className="text-xs text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={10}>
                          <Skeleton className="h-10 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : settlements.length > 0
                    ? settlements.map((s) => (
                        <TableRow
                          key={s.id}
                          className={cn(
                            'hover:bg-gold/5 transition-colors',
                            s.status === 'rejected' && 'opacity-60',
                          )}
                        >
                          {/* ID */}
                          <TableCell>
                            <code
                              className="text-[10px] font-mono text-muted-foreground"
                              dir="ltr"
                            >
                              {s.id.slice(0, 8)}
                            </code>
                          </TableCell>

                          {/* Merchant */}
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="size-7 shrink-0 rounded-lg bg-gold/15 flex items-center justify-center">
                                <Wallet className="size-3 text-gold" />
                              </div>
                              <span className="text-xs font-medium truncate max-w-[120px]">
                                {s.merchantName}
                              </span>
                            </div>
                          </TableCell>

                          {/* Type */}
                          <TableCell>
                            {getTypeBadge(s.settlementType)}
                          </TableCell>

                          {/* Gross Gold */}
                          <TableCell className="hidden lg:table-cell text-xs">
                            {formatGrams(s.amountGrams)}
                          </TableCell>

                          {/* Fee */}
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                            {s.feeGrams > 0 ? formatGrams(s.feeGrams) : '—'}
                          </TableCell>

                          {/* Net Gold */}
                          <TableCell className="text-xs font-medium text-gold">
                            {formatGrams(s.netGrams)}
                          </TableCell>

                          {/* Payment Count */}
                          <TableCell className="hidden xl:table-cell text-xs">
                            <Badge variant="outline" className="text-[10px] border-gold/30 text-gold">
                              {toPersianDigits(String(s.paymentCount))}
                            </Badge>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            {getStatusBadge(s.status)}
                          </TableCell>

                          {/* Date */}
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                            {getTimeAgo(s.createdAt)}
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
                                  setDetailSettlement(s);
                                  setDetailOpen(true);
                                }}
                                title="مشاهده جزئیات"
                              >
                                <Eye className="size-3.5" />
                              </Button>

                              {/* Settle & Deposit — for pending and processing */}
                              {(s.status === 'pending' || s.status === 'processing') && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-7 text-emerald-500 hover:bg-emerald-500/10"
                                  disabled={actionLoading === s.id}
                                  onClick={() => setApproveSettlement(s)}
                                  title="تسویه و واریز"
                                >
                                  {actionLoading === s.id ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <Wallet className="size-3.5" />
                                  )}
                                </Button>
                              )}

                              {/* Reject — for pending and processing */}
                              {(s.status === 'pending' || s.status === 'processing') && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-7 text-red-500 hover:bg-red-500/10"
                                  onClick={() => {
                                    setRejectSettlement(s);
                                    setRejectNote('');
                                  }}
                                  title="رد"
                                >
                                  <XCircle className="size-3.5" />
                                </Button>
                              )}


                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    : !loading && (
                        <TableRow>
                          <TableCell
                            colSpan={10}
                            className="text-center py-10 text-muted-foreground text-sm"
                          >
                            <Wallet className="size-10 mx-auto mb-2 opacity-20" />
                            تسویه‌ای یافت نشد
                          </TableCell>
                        </TableRow>
                      )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
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
            {toPersianDigits(String(totalPages))}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="border-gold/20 text-gold hover:bg-gold/10"
          >
            بعدی
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      )}

      {/* ============================================================ */}
      {/*  DETAIL DIALOG                                                */}
      {/* ============================================================ */}
      <Dialog open={detailOpen} onOpenChange={(open) => {
        if (!open) setDetailSettlement(null);
        setDetailOpen(open);
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="size-5 text-gold" />
              جزئیات تسویه‌حساب
            </DialogTitle>
            <DialogDescription>
              {detailSettlement?.merchantName}
            </DialogDescription>
          </DialogHeader>

          {detailSettlement && (
            <div className="space-y-4 pt-2">
              {/* Status & Type */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">وضعیت:</span>
                {getStatusBadge(detailSettlement.status)}
                <Separator orientation="vertical" className="h-4 mx-1" />
                <span className="text-xs text-muted-foreground">نوع:</span>
                {getTypeBadge(detailSettlement.settlementType)}
              </div>

              {/* Settlement ID */}
              <div className="rounded-xl bg-muted/30 p-4 space-y-3">
                <h4 className="text-sm font-bold text-gold flex items-center gap-1.5">
                  <Wallet className="size-3.5" />
                  اطلاعات تسویه
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">شناسه</span>
                    <code className="text-[11px] font-mono" dir="ltr">{detailSettlement.id}</code>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">پذیرنده</span>
                    <span className="font-medium">{detailSettlement.merchantName}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">دوره شروع</span>
                    <span className="text-xs">{formatDateTime(detailSettlement.periodStart)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">دوره پایان</span>
                    <span className="text-xs">{formatDateTime(detailSettlement.periodEnd)}</span>
                  </div>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="rounded-xl bg-muted/30 p-4 space-y-3">
                <h4 className="text-sm font-bold text-gold flex items-center gap-1.5">
                  <Coins className="size-3.5" />
                  جزئیات مبلغ
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-sm font-medium">{formatGrams(detailSettlement.amountGrams)}</p>
                    <p className="text-[10px] text-muted-foreground">طلای ناخالص</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-400">{detailSettlement.feeGrams > 0 ? formatGrams(detailSettlement.feeGrams) : '—'}</p>
                    <p className="text-[10px] text-muted-foreground">کارمزد</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold gold-gradient-text">{formatGrams(detailSettlement.netGrams)}</p>
                    <p className="text-[10px] text-muted-foreground">مبلغ خالص</p>
                  </div>
                </div>
                <Separator className="my-1" />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">تعداد تراکنش</span>
                    <span className="font-medium">{toPersianDigits(String(detailSettlement.paymentCount))}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">معادل واحد طلایی</span>
                    <span className="font-medium">{detailSettlement.amountFiat > 0 ? formatToman(detailSettlement.amountFiat) : '—'}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {detailSettlement.description && (
                <div>
                  <span className="text-[11px] text-muted-foreground block">توضیحات</span>
                  <p className="text-xs mt-1">{detailSettlement.description}</p>
                </div>
              )}

              {/* Admin Note */}
              {detailSettlement.adminNote && (
                <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3">
                  <span className="text-[11px] text-amber-500 block">یادداشت ادمین</span>
                  <p className="text-xs mt-1">{detailSettlement.adminNote}</p>
                </div>
              )}

              {/* Review Info */}
              {(detailSettlement.reviewedBy || detailSettlement.reviewedAt) && (
                <div className="rounded-xl bg-muted/30 p-4 space-y-3">
                  <h4 className="text-sm font-bold text-gold flex items-center gap-1.5">
                    <CheckCircle className="size-3.5" />
                    اطلاعات بررسی
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {detailSettlement.reviewedBy && (
                      <div>
                        <span className="text-[11px] text-muted-foreground block">بررسی‌کننده</span>
                        <span className="text-xs">{detailSettlement.reviewedBy}</span>
                      </div>
                    )}
                    {detailSettlement.reviewedAt && (
                      <div>
                        <span className="text-[11px] text-muted-foreground block">تاریخ بررسی</span>
                        <span className="text-xs">{formatDateTime(detailSettlement.reviewedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Processing Info */}
              {detailSettlement.processedAt && (
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">تاریخ پردازش</span>
                    <span className="text-xs">{formatDateTime(detailSettlement.processedAt)}</span>
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <span className="text-[11px] text-muted-foreground block">تاریخ ایجاد</span>
                  <span className="text-xs">{formatDateTime(detailSettlement.createdAt)}</span>
                </div>
              </div>

              <Separator />

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  className="gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                  onClick={() => setShowReceipt(true)}
                >
                  <FileText className="size-4" />
                  دانلود فاکتور PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setDetailOpen(false); setDetailSettlement(null); }}
                  className="border-gold/20 text-gold hover:bg-gold/10"
                >
                  بستن
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settlement Receipt */}
      {showReceipt && detailSettlement && (
        <TransactionReceipt
          data={{
            id: detailSettlement.id,
            type: 'settlement_deposit',
            amountGold: detailSettlement.netGrams,
            amountFiat: detailSettlement.amountFiat,
            fee: 0,
            goldPrice: 0,
            status: detailSettlement.status,
            referenceId: detailSettlement.id,
            description: detailSettlement.description,
            createdAt: detailSettlement.createdAt,
            merchantName: detailSettlement.merchantName,
            settlementType: detailSettlement.settlementType,
            paymentCount: detailSettlement.paymentCount,
            netGrams: detailSettlement.netGrams,
            feeGrams: detailSettlement.feeGrams,
          }}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* ============================================================ */}
      {/*  APPROVE CONFIRMATION DIALOG                                  */}
      {/* ============================================================ */}
      <AlertDialog
        open={!!approveSettlement}
        onOpenChange={(open) => {
          if (!open) setApproveSettlement(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Wallet className="size-5 text-emerald-500" />
              تسویه و واریز به کیف پول
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p>با تأیید، مبلغ طلای خالص و معادل واحد طلایی آن مستقیماً به کیف پول پذیرنده واریز می‌شود.</p>
                {approveSettlement && (
                  <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">پذیرنده:</span>
                      <span className="text-sm font-medium">{approveSettlement.merchantName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">مبلغ خالص:</span>
                      <span className="text-sm font-bold text-emerald-500">{formatGrams(approveSettlement.netGrams)}</span>
                    </div>
                    {approveSettlement.amountFiat > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">معادل واحد طلایی:</span>
                        <span className="text-sm">{formatToman(approveSettlement.amountFiat)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-gold/20 text-gold hover:bg-gold/10">
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (approveSettlement) {
                  handleSettlementAction(approveSettlement, 'approve');
                }
              }}
              disabled={!!actionLoading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {actionLoading ? (
                <Loader2 className="size-4 ml-1.5 animate-spin" />
              ) : (
                <Wallet className="size-4 ml-1.5" />
              )}
              تسویه و واریز
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================================ */}
      {/*  REJECT DIALOG (with textarea)                                */}
      {/* ============================================================ */}
      <Dialog
        open={!!rejectSettlement}
        onOpenChange={(open) => {
          if (!open) { setRejectSettlement(null); setRejectNote(''); }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="size-5 text-red-500" />
              رد تسویه‌حساب
            </DialogTitle>
            <DialogDescription>
              دلیل رد تسویه‌حساب را وارد کنید:
            </DialogDescription>
          </DialogHeader>

          {rejectSettlement && (
            <div className="space-y-4 pt-2">
              <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">پذیرنده:</span>
                  <span className="text-sm font-medium">{rejectSettlement.merchantName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">مبلغ خالص:</span>
                  <span className="text-sm font-bold">{formatGrams(rejectSettlement.netGrams)}</span>
                </div>
              </div>

              <Textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="دلیل رد تسویه‌حساب..."
                className="min-h-24"
                dir="rtl"
              />

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => { setRejectSettlement(null); setRejectNote(''); }}
                  className="border-gold/20 text-gold hover:bg-gold/10"
                >
                  انصراف
                </Button>
                <Button
                  onClick={() => {
                    if (rejectSettlement && rejectNote.trim()) {
                      handleSettlementAction(rejectSettlement, 'reject', rejectNote.trim());
                    } else {
                      addToast('لطفاً دلیل رد تسویه را وارد کنید', 'error');
                    }
                  }}
                  disabled={!!actionLoading || !rejectNote.trim()}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  {actionLoading ? (
                    <Loader2 className="size-4 ml-1.5 animate-spin" />
                  ) : (
                    <XCircle className="size-4 ml-1.5" />
                  )}
                  رد درخواست
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/*  COMPLETE CONFIRMATION DIALOG                                 */}
      {/* ============================================================ */}
      <AlertDialog
        open={!!completeSettlement}
        onOpenChange={(open) => {
          if (!open) setCompleteSettlement(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="size-5 text-emerald-500" />
              تکمیل تسویه‌حساب
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p>آیا تسویه‌حساب انجام شده و مبلغ واریز شده است؟</p>
                {completeSettlement && (
                  <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">پذیرنده:</span>
                      <span className="text-sm font-medium">{completeSettlement.merchantName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">مبلغ خالص:</span>
                      <span className="text-sm font-bold text-emerald-500">{formatGrams(completeSettlement.netGrams)}</span>
                    </div>
                    {completeSettlement.amountFiat > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">معادل واحد طلایی:</span>
                        <span className="text-sm">{formatToman(completeSettlement.amountFiat)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-gold/20 text-gold hover:bg-gold/10">
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (completeSettlement) {
                  handleSettlementAction(completeSettlement, 'complete');
                }
              }}
              disabled={!!actionLoading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {actionLoading ? (
                <Loader2 className="size-4 ml-1.5 animate-spin" />
              ) : (
                <CheckCircle className="size-4 ml-1.5" />
              )}
              تأیید تکمیل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

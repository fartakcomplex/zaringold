'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Eye,
  Check,
  X,
  Loader2,
  TrendingUp,
  Banknote,
  Users,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  Phone,
  Mail,
  Hash,
  Calendar,
  CreditCard,
  MessageSquare,
  ArrowUpDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface InsuranceOrder {
  id: string;
  userId: string;
  user?: { id: string; fullName: string; phone: string; role: string } | null;
  planName: string;
  providerName: string;
  categoryName: string;
  status: string;
  amountPaid: number;
  commissionEarned: number;
  policyNumber: string | null;
  holderName: string | null;
  holderPhone: string | null;
  holderNationalId: string | null;
  holderEmail: string | null;
  adminNote: string | null;
  startDate: string | null;
  endDate: string | null;
  issuedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  plan: {
    id: string;
    name: string;
    basePrice: number;
    sellingPrice: number;
    durationLabel: string | null;
    durationDays: number | null;
    coverages: Array<{ title: string; amount?: number; description: string }>;
    provider: { id: string; name: string; color: string } | null;
    category: { id: string; name: string; slug: string } | null;
  } | null;
}

interface Stats {
  total: number;
  pending: number;
  active: number;
  expired: number;
  cancelled: number;
  revenue: number;
  commission: number;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Status Config                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

const STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  badgeClass: string;
  dotClass: string;
}> = {
  pending: {
    label: 'در انتظار بررسی',
    icon: Clock,
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    dotClass: 'bg-amber-500',
  },
  active: {
    label: 'فعال',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    dotClass: 'bg-emerald-500',
  },
  expired: {
    label: 'منقضی',
    icon: AlertTriangle,
    badgeClass: 'bg-red-500/10 text-red-600 border-red-500/20',
    dotClass: 'bg-red-500',
  },
  cancelled: {
    label: 'لغو شده',
    icon: XCircle,
    badgeClass: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    dotClass: 'bg-gray-500',
  },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(price));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'همین الان';
  if (diffMin < 60) return `${diffMin} دقیقه پیش`;
  if (diffHour < 24) return `${diffHour} ساعت پیش`;
  if (diffDay < 30) return `${diffDay} روز پیش`;
  return formatDate(dateStr);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Stat Card                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  colorClass,
  isNewAlert,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  colorClass: string;
  isNewAlert?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden border-border/50">
      {isNewAlert && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-l from-amber-500 to-amber-400" />
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
            <p className={`text-xl font-bold ${colorClass}`}>{value}</p>
            {sub && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
            )}
          </div>
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorClass.replace('text-', 'bg-').replace('text-amber-600', 'bg-amber-500/10').replace('text-emerald-600', 'bg-emerald-500/10').replace('text-gold', 'bg-gold/10').replace('text-blue-600', 'bg-blue-500/10').replace('text-red-600', 'bg-red-500/10')}`}>
            <Icon className={`h-4 w-4 ${colorClass.replace(/text-amber-600|text-emerald-600|text-gold/, 'text-amber-600 text-emerald-600 text-gold').split(' ')[0]} ${colorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Order Detail Dialog                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function OrderDetailDialog({
  order,
  open,
  onClose,
  onStatusChange,
}: {
  order: InsuranceOrder | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: string, note: string) => void;
}) {
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setNewStatus(order.status === 'pending' ? 'active' : order.status);
      setNote(order.adminNote || '');
    }
  }, [order]);

  if (!order) return null;

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;
  const personalInfo = order.holderName || order.plan?.name || '—';
  const providerColor = order.plan?.provider?.color || '#D4AF37';

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === order.status) return;
    setLoading(true);
    try {
      await onStatusChange(order.id, newStatus, note);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-gold" />
            جزئیات سفارش بیمه
          </DialogTitle>
        </DialogHeader>

        {/* Status badge */}
        <div className="flex items-center justify-between">
          <Badge className={`${statusCfg.badgeClass} text-xs gap-1.5 px-3 py-1`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {statusCfg.label}
          </Badge>
          <span className="text-[11px] text-muted-foreground">
            {timeAgo(order.createdAt)}
          </span>
        </div>

        {/* Policy Info */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-gold" />
              اطلاعات بیمه‌نامه
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            <InfoRow icon={Hash} label="شماره بیمه‌نامه" value={order.policyNumber || `#${order.id.slice(0, 8)}`} mono />
            <InfoRow icon={Shield} label="شرکت بیمه" value={order.providerName} />
            <InfoRow icon={FileText} label="طرح بیمه" value={order.planName} />
            <InfoRow icon={CreditCard} label="دسته‌بندی" value={order.categoryName} />
            <Separator />
            <InfoRow icon={Banknote} label="مبلغ پرداختی" value={`${formatPrice(order.amountPaid)} تومان`} mono valueClass="text-gold font-bold" />
            <InfoRow icon={TrendingUp} label="کارمزد کسب‌شده" value={`${formatPrice(order.commissionEarned)} تومان`} mono valueClass="text-emerald-600" />
            <InfoRow icon={Calendar} label="تاریخ شروع" value={formatDate(order.startDate)} />
            <InfoRow icon={Calendar} label="تاریخ پایان" value={formatDate(order.endDate)} />
            {order.plan?.durationLabel && (
              <InfoRow icon={Clock} label="مدت پوشش" value={order.plan.durationLabel} />
            )}
          </CardContent>
        </Card>

        {/* Holder Info */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-gold" />
              اطلاعات گیرنده
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            <InfoRow icon={Users} label="نام" value={order.holderName || '—'} />
            <InfoRow icon={Phone} label="موبایل" value={order.holderPhone || '—'} mono />
            <InfoRow icon={Hash} label="کد ملی" value={order.holderNationalId || '—'} mono />
            {order.holderEmail && (
              <InfoRow icon={Mail} label="ایمیل" value={order.holderEmail} mono />
            )}
            {order.user && (
              <>
                <Separator />
                <InfoRow icon={Users} label="کاربر سیستم" value={`${order.user.fullName || '—'} (${order.user.phone})`} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Coverages */}
        {order.plan?.coverages && order.plan.coverages.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-gold" />
                پوشش‌ها ({order.plan.coverages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-2">
              {order.plan.coverages.map((cov, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-muted/30 p-2">
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                    <Check className="h-2.5 w-2.5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-medium">{cov.title}</span>
                      {cov.amount && cov.amount > 0 && (
                        <span className="text-[10px] text-gold font-medium">
                          {formatPrice(cov.amount)} تومان
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{cov.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Admin Actions */}
        <Card className="border-gold/20 bg-gold/5">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-gold" />
              مدیریت سفارش
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {order.adminNote && (
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-[10px] text-muted-foreground mb-0.5">یادداشت قبلی:</p>
                <p className="text-xs">{order.adminNote}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground">تغییر وضعیت</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">در انتظار بررسی</SelectItem>
                  <SelectItem value="active">فعال (صدور بیمه‌نامه)</SelectItem>
                  <SelectItem value="expired">منقضی</SelectItem>
                  <SelectItem value="cancelled">لغو شده</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground">یادداشت مدیر</label>
              <Textarea
                placeholder="توضیحات یا یادداشت درباره این سفارش..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="text-xs min-h-[60px]"
              />
            </div>

            <Button
              onClick={handleStatusUpdate}
              disabled={loading || newStatus === order.status}
              className="w-full bg-gold text-black hover:bg-gold/90 font-bold text-xs gap-2"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {newStatus === 'active' ? 'صدور بیمه‌نامه' : newStatus === 'cancelled' ? 'لغو سفارش' : 'بروزرسانی وضعیت'}
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Info Row                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
  valueClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <span className={`text-[11px] font-medium text-foreground truncate ${mono ? 'font-mono' : ''} ${valueClass || ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AdminInsurance() {
  const [orders, setOrders] = useState<InsuranceOrder[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<InsuranceOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const addToast = useAppStore((s) => s.addToast);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (activeTab !== 'all') params.set('status', activeTab);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/insurance?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setStats(data.stats || null);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (orderId: string, status: string, note: string) => {
    try {
      const res = await fetch('/api/admin/insurance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status, adminNote: note, reviewedBy: 'admin' }),
      });

      if (res.ok) {
        addToast('وضعیت سفارش بروزرسانی شد', 'success');
        setDetailOpen(false);
        setSelectedOrder(null);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.message || 'خطا در بروزرسانی', 'error');
      }
    } catch {
      addToast('خطا در برقراری ارتباط', 'error');
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('آیا از حذف این سفارش مطمئن هستید؟')) return;
    try {
      const res = await fetch(`/api/admin/insurance?id=${orderId}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('سفارش حذف شد', 'success');
        fetchData();
      }
    } catch {
      addToast('خطا در حذف', 'error');
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    if (sortField === 'amount') return (b.amountPaid || 0) - (a.amountPaid || 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const tabs = [
    { value: 'all', label: 'همه', count: stats?.total || 0 },
    { value: 'pending', label: 'در انتظار', count: stats?.pending || 0 },
    { value: 'active', label: 'فعال', count: stats?.active || 0 },
    { value: 'expired', label: 'منقضی', count: stats?.expired || 0 },
    { value: 'cancelled', label: 'لغو شده', count: stats?.cancelled || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-gold" />
            مدیریت بیمه
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            مشاهده و مدیریت سفارشات بیمه کاربران
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          بروزرسانی
        </Button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard
            icon={FileText}
            label="کل سفارشات"
            value={stats.total}
            colorClass="text-blue-600"
          />
          <StatCard
            icon={Clock}
            label="در انتظار بررسی"
            value={stats.pending}
            colorClass="text-amber-600"
            sub="نیاز به اقدام"
            isNewAlert={stats.pending > 0}
          />
          <StatCard
            icon={Banknote}
            label="درآمد کل"
            value={`${formatPrice(stats.revenue)}`}
            colorClass="text-gold"
            sub="تومان"
          />
          <StatCard
            icon={TrendingUp}
            label="کارمزد کل"
            value={`${formatPrice(stats.commission)}`}
            colorClass="text-emerald-600"
            sub="تومان"
          />
        </div>
      )}

      {/* Filters Bar */}
      <Card className="border-border/50">
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="جستجو: نام، شماره بیمه‌نامه، موبایل..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="h-9 text-xs pr-8"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <button
                onClick={() => setSortField(sortField === 'date' ? 'amount' : 'date')}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {sortField === 'date' ? 'مرتب‌سازی: تاریخ' : 'مرتب‌سازی: مبلغ'}
              </button>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setActiveTab(tab.value); setPage(1); }}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all ${
                  activeTab === tab.value
                    ? 'bg-gold/10 text-gold border border-gold/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                }`}
              >
                {tab.label}
                <span className="mr-1 opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded bg-muted" />
                  <div className="h-2 w-48 rounded bg-muted" />
                </div>
                <div className="h-5 w-20 rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedOrders.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Shield className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">سفارشی یافت نشد</h3>
          <p className="text-xs text-muted-foreground">
            {searchQuery ? 'نتیجه‌ای برای جستجوی شما یافت نشد' : 'هنوز سفارش بیمه‌ای ثبت نشده است'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedOrders.map((order) => {
            const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusCfg.icon;
            const providerInitial = (order.providerName || '؟').charAt(0);
            const isNew = order.status === 'pending';

            return (
              <Card
                key={order.id}
                className={`border-border/50 transition-all hover:border-gold/20 hover:shadow-md ${
                  isNew ? 'ring-1 ring-amber-500/20' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Provider Avatar */}
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: order.plan?.provider?.color || '#D4AF37' }}
                    >
                      {providerInitial}
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground truncate">
                              {order.planName}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] border-border/50 shrink-0"
                            >
                              {order.categoryName}
                            </Badge>
                            {isNew && (
                              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] px-1.5 py-0 gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                جدید
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {order.providerName} · {order.holderName || '—'}
                          </p>
                        </div>
                        <Badge className={`${statusCfg.badgeClass} text-[10px] gap-1 shrink-0`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </Badge>
                      </div>

                      {/* Details Row */}
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {order.policyNumber || `#${order.id.slice(0, 8)}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Banknote className="h-3 w-3" />
                          <span className="text-gold font-medium">
                            {formatPrice(order.amountPaid)}
                          </span>
                          تومان
                        </span>
                        {order.commissionEarned > 0 && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <TrendingUp className="h-3 w-3" />
                            +{formatPrice(order.commissionEarned)} کارمزد
                          </span>
                        )}
                      </div>

                      {/* Bottom: time + user + actions */}
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{timeAgo(order.createdAt)}</span>
                          {order.user && (
                            <span>
                              کاربر: {order.user.fullName || order.user.phone}
                            </span>
                          )}
                          {order.holderPhone && (
                            <span className="flex items-center gap-0.5">
                              <Phone className="h-2.5 w-2.5" />
                              {order.holderPhone}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-gold"
                            onClick={() => { setSelectedOrder(order); setDetailOpen(true); }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {order.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[10px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 gap-1"
                              onClick={() => handleStatusChange(order.id, 'active', '')}
                            >
                              <Check className="h-3 w-3" />
                              صدور
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                            onClick={() => handleDelete(order.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground">
            صفحه {page} از {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <OrderDetailDialog
        order={selectedOrder}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedOrder(null); }}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

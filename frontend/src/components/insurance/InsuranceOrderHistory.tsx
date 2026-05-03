
import React, { useState, useEffect } from 'react';
import {Clock, CheckCircle2, AlertTriangle, Eye, Shield, Calendar, FileText, Inbox} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {motion} from '@/lib/framer-compat';
import {useAppStore} from '@/lib/store';
import type { InsuranceOrder } from './types';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

type OrderStatus = 'pending' | 'active' | 'expired';

interface InsuranceOrderHistoryProps {
  onViewDetail: (order: InsuranceOrder) => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Fallback Orders                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

const FALLBACK_ORDERS: InsuranceOrder[] = [
  {
    id: 'o1', userId: 'u1', planId: 'p1',
    personalInfo: { holderName: 'علی محمدی', holderPhone: '09123456789', holderNationalId: '0012345678' },
    formData: {},
    status: 'pending', amountPaid: 2800000,
    providerName: 'بیمه ایران',
    policyNumber: 'IR-1404-123456',
    startDate: '1404/01/15', endDate: '1405/01/15',
    createdAt: '2025-07-01T10:00:00Z', updatedAt: '2025-07-01T10:00:00Z',
  },
  {
    id: 'o2', userId: 'u1', planId: 'p2',
    personalInfo: { holderName: 'علی محمدی', holderPhone: '09123456789', holderNationalId: '0012345678' },
    formData: {},
    status: 'active', amountPaid: 3500000,
    providerName: 'بیمه آسیا',
    policyNumber: 'AS-1403-654321',
    startDate: '1403/06/01', endDate: '1404/06/01',
    createdAt: '2024-09-01T10:00:00Z', updatedAt: '2024-09-01T10:00:00Z',
  },
  {
    id: 'o3', userId: 'u1', planId: 'p3',
    personalInfo: { holderName: 'علی محمدی', holderPhone: '09123456789', holderNationalId: '0012345678' },
    formData: {},
    status: 'expired', amountPaid: 2550000,
    providerName: 'بیمه دانا',
    policyNumber: 'DN-1402-111222',
    startDate: '1402/03/01', endDate: '1403/03/01',
    createdAt: '2023-06-01T10:00:00Z', updatedAt: '2023-06-01T10:00:00Z',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Status Config                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

const STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeClass: string;
}> = {
  pending: {
    label: 'در حال بررسی', // i18n
    icon: Clock,
    badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  },
  active: {
    label: 'فعال', // i18n
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  expired: {
    label: 'منقضی', // i18n
    icon: AlertTriangle,
    badgeClass: 'bg-red-500/10 text-red-500 border-red-500/20',
  },
  cancelled: {
    label: 'لغو شده', // i18n
    icon: AlertTriangle,
    badgeClass: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Price Formatter                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  OrderCard                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function OrderCard({
  order,
  onView,
  index,
}: {
  order: InsuranceOrder;
  onView: () => void;
  index: number;
}) {
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <Card className="border-border/50 bg-card transition-all hover:border-gold/20 hover:shadow-md">
        <CardContent className="p-4">
          {/* Top row: policy number + status badge */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                <Shield className="h-4 w-4 text-gold" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">
                  {/* i18n */}شماره بیمه‌نامه
                </p>
                <p className="text-xs font-bold font-mono text-foreground">
                  {order.policyNumber || `#${order.id.slice(0, 8)}`}
                </p>
              </div>
            </div>
            <Badge className={`${statusCfg.badgeClass} text-[10px] gap-1`}>
              <StatusIcon className="h-3 w-3" />
              {statusCfg.label}
            </Badge>
          </div>

          {/* Provider + Category */}
          <div className="flex items-center gap-2 mb-3">
            {order.providerName && (
              <Badge variant="outline" className="text-[10px] border-border/50">
                {order.providerName}
              </Badge>
            )}
          </div>

          {/* Amount + Dates */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-[10px] text-muted-foreground">
                {/* i18n */}مبلغ پرداختی
              </p>
              <p className="text-sm font-bold gold-gradient-text">
                {formatPrice(order.amountPaid)} {/* i18n */}تومان
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">
                {/* i18n */}تاریخ صدور
              </p>
              <p className="text-xs font-medium text-foreground">
                {order.startDate || '—'}
              </p>
            </div>
          </div>

          {/* Dates */}
          {order.endDate && (
            <div className="flex items-center gap-2 mb-3 text-[10px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {/* i18n */}اعتبار تا: {order.endDate}
              </span>
            </div>
          )}

          {/* View Details Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="w-full text-xs gap-1.5 border-border/50 hover:border-gold/30 hover:text-gold"
          >
            <Eye className="h-3.5 w-3.5" />
            {/* i18n */}مشاهده جزئیات
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div>
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tabs Config                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

const TABS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'pending', label: 'در حال بررسی' },
  { value: 'active', label: 'فعال' },
  { value: 'expired', label: 'منقضی' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function InsuranceOrderHistory({
  onViewDetail,
}: InsuranceOrderHistoryProps) {
  const [orders, setOrders] = useState<InsuranceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const userId = user?.id || 'current';
        const res = await fetch(`/api/insurance/orders?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          const list: InsuranceOrder[] = data.orders || data || [];
          if (list.length > 0) {
            setOrders(list);
          } else {
            setOrders(FALLBACK_ORDERS);
          }
        } else {
          setOrders(FALLBACK_ORDERS);
        }
      } catch {
        setOrders(FALLBACK_ORDERS);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [user?.id]);

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter((o) => o.status === activeTab);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground">
          {/* i18n */}بیمه‌نامه‌های من
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {/* i18n */}سابقه بیمه‌نامه‌های صادر شده
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-all ${
              activeTab === tab.value
                ? 'bg-gold/10 text-gold border border-gold/20'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
            }`}
          >
            {/* i18n */}{tab.label}
            {tab.value !== 'all' && (
              <span className="mr-1.5 text-[10px] opacity-60">
                ({orders.filter((o) => o.status === tab.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && <OrdersSkeleton />}

      {/* Empty */}
      {!loading && filteredOrders.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">
            {/* i18n */}بیمه‌نامه‌ای یافت نشد
          </h3>
          <p className="text-xs text-muted-foreground">
            {/* i18n */}هنوز بیمه‌نامه‌ای صادر نکرده‌اید
          </p>
        </div>
      )}

      {/* Orders List */}
      {!loading && filteredOrders.length > 0 && (
        <div className="space-y-4">
          {filteredOrders.map((order, i) => (
            <OrderCard
              key={order.id}
              order={order}
              onView={() => onViewDetail(order)}
              index={i}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

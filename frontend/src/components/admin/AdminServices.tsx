
import React, { useState, useEffect, useCallback } from 'react';
import {Smartphone, Wifi, Receipt, Car, Umbrella, RefreshCw, Search, TrendingUp, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronDown, ChevronUp, Banknote, Zap, Building, Phone, Settings, Loader2, Save} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {useAppStore} from '@/lib/store';
import {useTranslation} from '@/lib/i18n';
import {cn} from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface UtilityStats {
  total: number;
  today: number;
  success: number;
  failed: number;
  pending: number;
  totalRevenue: number;
  topupCount: number;
  topupRevenue: number;
  internetCount: number;
  internetRevenue: number;
  billCount: number;
  billRevenue: number;
}

interface CarStats {
  total: number;
  today: number;
  success: number;
  pending: number;
  cancelled: number;
  totalRevenue: number;
  byCategory: Record<string, { name: string; count: number; revenue: number }>;
}

interface InsStats {
  total: number;
  today: number;
  active: number;
  pending: number;
  cancelled: number;
  expired: number;
  revenue: number;
  commission: number;
  byProvider: Record<string, { count: number; revenue: number }>;
}

interface UtilityOrder {
  id: string;
  type: string;
  operator: string;
  phoneNumber: string;
  amount: number;
  fee: number;
  totalPrice: number;
  status: string;
  referenceCode: string;
  billType: string;
  packageTitle: string;
  createdAt: string;
  user?: { id: string; fullName: string; phone: string } | null;
}

interface CarOrder {
  id: string;
  status: string;
  urgency: string;
  estimatedPrice: number;
  finalPrice: number;
  createdAt: string;
  user?: { id: string; fullName: string; phone: string } | null;
  car?: { id: string; brand: string; model: string; plate: string } | null;
  category?: { id: string; name: string; slug: string } | null;
}

interface InsOrder {
  id: string;
  planName: string;
  providerName: string;
  amountPaid: number;
  commissionEarned: number;
  status: string;
  policyNumber: string | null;
  holderName: string | null;
  holderPhone: string | null;
  createdAt: string;
  user?: { id: string; fullName: string; phone: string } | null;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(price));
}

function formatDate(dateStr: string): string {
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

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  success: { label: 'موفق', cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  active: { label: 'فعال', cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  completed: { label: 'تکمیل', cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  pending: { label: 'در انتظار', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  failed: { label: 'ناموفق', cls: 'bg-red-500/10 text-red-500 border-red-500/20' },
  cancelled: { label: 'لغو شده', cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  expired: { label: 'منقضی', cls: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  refunded: { label: 'بازگشتی', cls: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
};

const TYPE_MAP: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  topup: { label: 'شارژ', icon: Smartphone, cls: 'bg-violet-500/10 text-violet-500' },
  internet: { label: 'اینترنت', icon: Wifi, cls: 'bg-sky-500/10 text-sky-500' },
  bill: { label: 'قبض', icon: Receipt, cls: 'bg-amber-500/10 text-amber-500' },
};

const OPERATOR_MAP: Record<string, string> = {
  mci: 'همراه اول',
  irancell: 'ایرانسل',
  rightel: 'رایتل',
  taliya: 'تالیا',
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Stat Card                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  gradient,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  gradient: string;
}) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden relative">
      <div className={cn('absolute top-0 left-0 right-0 h-0.5', gradient)} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
            <p className="text-xl font-bold text-foreground">{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', gradient.replace('from-', 'bg-').split(' ')[0] || 'bg-muted')}>
            <Icon className="h-4 w-4 text-foreground/70" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Status Badge                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <Badge variant="outline" className={cn('text-[10px] px-2 py-0.5', cfg.cls)}>
      {cfg.label}
    </Badge>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Provider Settings Panel                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ProviderSettingsPanel({ serviceType }: { serviceType: 'utility' | 'car' | 'insurance' }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/service-settings/${serviceType}`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || {});
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [serviceType]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/service-settings/${serviceType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        setMessage(t('admin.settingsSaved'));
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSetting = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: prev[key] === 'true' ? 'false' : 'true' }));
  };

  return (
    <Card className="border-gold/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-right hover:bg-gold/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10">
            <Settings className="h-4 w-4 text-gold" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{t('admin.providerSettings')}</p>
            <p className="text-[10px] text-muted-foreground">
              {serviceType === 'utility' ? 'تنظیمات API اپراتورها و کارمزد' : serviceType === 'car' ? 'تنظیمات تعمیرگاه‌ها و دسته‌بندی‌ها' : 'تنظیمات شرکت‌های بیمه'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {message && (
            <span className="text-[11px] font-medium text-emerald-500">{message}</span>
          )}
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-gold/10">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
            </div>
          ) : (
            <CardContent className="p-4 space-y-4">
              {/* Utility Settings */}
              {serviceType === 'utility' && (
                <div className="space-y-4">
                  {/* Operator API Sections */}
                  {[
                    { prefix: 'mci', label: 'همراه اول', icon: Smartphone },
                    { prefix: 'irancell', label: 'ایرانسل', icon: Wifi },
                    { prefix: 'rightel', label: 'رایتل', icon: Phone },
                  ].map((op) => (
                    <div key={op.prefix} className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <op.icon className="h-3.5 w-3.5 text-gold" />
                        <span className="text-xs font-bold text-foreground">{op.label}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">{t('admin.apiUrl')}</label>
                          <Input
                            value={settings[`utility_${op.prefix}_api_url`] || ''}
                            onChange={(e) => updateSetting(`utility_${op.prefix}_api_url`, e.target.value)}
                            className="h-8 text-xs"
                            dir="ltr"
                            placeholder="https://api.example.com"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">{t('admin.apiKey')}</label>
                          <Input
                            value={settings[`utility_${op.prefix}_api_key`] || ''}
                            onChange={(e) => updateSetting(`utility_${op.prefix}_api_key`, e.target.value)}
                            className="h-8 text-xs"
                            dir="ltr"
                            type="password"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Commission */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'utility_topup_commission', label: 'کارمزد شارژ (%)' },
                      { key: 'utility_internet_commission', label: 'کارمزد اینترنت (%)' },
                      { key: 'utility_bill_commission', label: 'کارمزد قبوض (%)' },
                    ].map((item) => (
                      <div key={item.key} className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">{item.label}</label>
                        <Input
                          value={settings[item.key] || ''}
                          onChange={(e) => updateSetting(item.key, e.target.value)}
                          className="h-8 text-xs"
                          dir="ltr"
                          type="number"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Min/Max Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">{t('admin.minAmount')} (تومان)</label>
                      <Input
                        value={settings['utility_min_amount'] || ''}
                        onChange={(e) => updateSetting('utility_min_amount', e.target.value)}
                        className="h-8 text-xs"
                        dir="ltr"
                        type="number"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">{t('admin.maxAmount')} (تومان)</label>
                      <Input
                        value={settings['utility_max_amount'] || ''}
                        onChange={(e) => updateSetting('utility_max_amount', e.target.value)}
                        className="h-8 text-xs"
                        dir="ltr"
                        type="number"
                      />
                    </div>
                  </div>

                  {/* Enable/Disable Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'utility_topup_enabled', label: 'شارژ موبایل' },
                      { key: 'utility_internet_enabled', label: 'بسته اینترنت' },
                      { key: 'utility_bill_enabled', label: 'قبوض' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleSetting(item.key)}
                        className={cn(
                          'flex items-center justify-between rounded-lg border p-2.5 transition-all',
                          settings[item.key] === 'true'
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-border/50 bg-muted/20'
                        )}
                      >
                        <span className="text-xs text-foreground">{item.label}</span>
                        <span
                          className={cn(
                            'text-[10px] font-medium px-2 py-0.5 rounded-full',
                            settings[item.key] === 'true'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-gray-500/10 text-gray-500'
                          )}
                        >
                          {settings[item.key] === 'true' ? t('admin.enabled') : t('admin.disabled')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Car Settings */}
              {serviceType === 'car' && (
                <div className="space-y-4">
                  {/* Category Commission */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { key: 'car_body_commission', label: 'بدنه' },
                      { key: 'car_mechanical_commission', label: 'مکانیکی' },
                      { key: 'car_electrical_commission', label: 'برق' },
                      { key: 'car_wash_commission', label: 'شستشو' },
                      { key: 'car_tow_commission', label: 'یدک‌کش' },
                    ].map((item) => (
                      <div key={item.key} className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">{item.label} (%)</label>
                        <Input
                          value={settings[item.key] || ''}
                          onChange={(e) => updateSetting(item.key, e.target.value)}
                          className="h-8 text-xs"
                          dir="ltr"
                          type="number"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Enable/Disable Toggles */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { key: 'car_body_enabled', label: 'بدنه' },
                      { key: 'car_mechanical_enabled', label: 'مکانیکی' },
                      { key: 'car_electrical_enabled', label: 'برق' },
                      { key: 'car_wash_enabled', label: 'شستشو' },
                      { key: 'car_tow_enabled', label: 'یدک‌کش' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleSetting(item.key)}
                        className={cn(
                          'flex items-center justify-between rounded-lg border p-2.5 transition-all',
                          settings[item.key] === 'true'
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-border/50 bg-muted/20'
                        )}
                      >
                        <span className="text-xs text-foreground">{item.label}</span>
                        <span
                          className={cn(
                            'text-[10px] font-medium px-2 py-0.5 rounded-full',
                            settings[item.key] === 'true'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-gray-500/10 text-gray-500'
                          )}
                        >
                          {settings[item.key] === 'true' ? t('admin.enabled') : t('admin.disabled')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Insurance Settings */}
              {serviceType === 'insurance' && (
                <div className="space-y-4">
                  {[
                    { prefix: 'asia', label: 'بیمه آسیا' },
                    { prefix: 'dana', label: 'بیمه دانا' },
                    { prefix: 'alborz', label: 'بیمه البرز' },
                    { prefix: 'iran', label: 'بیمه ایران' },
                  ].map((prov) => (
                    <div key={prov.prefix} className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building className="h-3.5 w-3.5 text-gold" />
                          <span className="text-xs font-bold text-foreground">{prov.label}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSetting(`insurance_${prov.prefix}_enabled`)}
                          className={cn(
                            'text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all',
                            settings[`insurance_${prov.prefix}_enabled`] === 'true'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                              : 'border-border/50 bg-muted/30 text-gray-500'
                          )}
                        >
                          {settings[`insurance_${prov.prefix}_enabled`] === 'true' ? t('admin.enabled') : t('admin.disabled')}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">{t('admin.apiUrl')}</label>
                          <Input
                            value={settings[`insurance_${prov.prefix}_api_url`] || ''}
                            onChange={(e) => updateSetting(`insurance_${prov.prefix}_api_url`, e.target.value)}
                            className="h-8 text-xs"
                            dir="ltr"
                            placeholder="https://api.example.com"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">{t('admin.commission')} (%)</label>
                          <Input
                            value={settings[`insurance_${prov.prefix}_commission`] || ''}
                            onChange={(e) => updateSetting(`insurance_${prov.prefix}_commission`, e.target.value)}
                            className="h-8 text-xs"
                            dir="ltr"
                            type="number"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">پوشش پیش‌فرض (تومان)</label>
                          <Input
                            value={settings[`insurance_${prov.prefix}_default_coverage`] || ''}
                            onChange={(e) => updateSetting(`insurance_${prov.prefix}_default_coverage`, e.target.value)}
                            className="h-8 text-xs"
                            dir="ltr"
                            type="number"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-2 border-t border-gold/10">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gold/10 text-gold hover:bg-gold/20 border border-gold/20 h-9 text-xs"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span className="mr-2">{t('admin.saveSettings')}</span>
                </Button>
              </div>
            </CardContent>
          )}
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tab: Utility Services                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function UtilityTab() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<UtilityStats | null>(null);
  const [orders, setOrders] = useState<UtilityOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/utility-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await fetch(`/api/admin/utility-orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, page]);

  useEffect(() => {
    fetchStats();
    fetchOrders();
  }, [fetchStats, fetchOrders]);

  const filtered = search
    ? orders.filter(
        (o) =>
          o.phoneNumber?.includes(search) ||
          o.referenceCode?.includes(search) ||
          o.user?.phone?.includes(search) ||
          o.user?.fullName?.includes(search)
      )
    : orders;

  return (
    <div className="space-y-6">
      {/* Provider Settings */}
      <ProviderSettingsPanel serviceType="utility" />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={Receipt} label={t('admin.totalOrders')} value={stats.total} gradient="from-blue-500 to-blue-600" />
          <StatCard icon={Clock} label={t('admin.todayOrders')} value={stats.today} gradient="from-amber-500 to-amber-600" />
          <StatCard icon={Banknote} label={t('admin.totalRevenue')} value={`${formatPrice(stats.totalRevenue)}`} sub="تومان" gradient="from-emerald-500 to-emerald-600" />
          <StatCard icon={Smartphone} label="شارژ" value={stats.topupCount} sub={`${formatPrice(stats.topupRevenue)} ت`} gradient="from-violet-500 to-violet-600" />
          <StatCard icon={Wifi} label="بسته اینترنت" value={stats.internetCount} sub={`${formatPrice(stats.internetRevenue)} ت`} gradient="from-sky-500 to-sky-600" />
        </div>
      )}

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="جستجو: شماره تلفن، کد پیگیری..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-9 text-xs pr-8"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="h-9 text-xs w-[130px]">
                  <SelectValue placeholder={t('admin.orderType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.all')}</SelectItem>
                  <SelectItem value="topup">{t('admin.topup')}</SelectItem>
                  <SelectItem value="internet">{t('admin.internet')}</SelectItem>
                  <SelectItem value="bill">{t('admin.bill')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="h-9 text-xs w-[120px]">
                  <SelectValue placeholder={t('admin.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.all')}</SelectItem>
                  <SelectItem value="success">{t('admin.success')}</SelectItem>
                  <SelectItem value="pending">{t('admin.pending')}</SelectItem>
                  <SelectItem value="failed">{t('admin.failed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 p-4 animate-pulse">
              <div className="h-3 w-48 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Smartphone className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">سفارشی یافت نشد</h3>
          <p className="text-xs text-muted-foreground">هنوز سفارش خدمات کاربردی ثبت نشده است</p>
        </div>
      ) : (
        <Card className="border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground">شناسه</th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground">نوع</th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground">اپراتور</th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground">تلفن</th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground">مبلغ</th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground">وضعیت</th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const typeCfg = TYPE_MAP[order.type] || TYPE_MAP.topup;
                  const TypeIcon = typeCfg.icon;
                  return (
                    <tr key={order.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-muted-foreground">{order.id.slice(0, 8)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn('text-[10px] gap-1', typeCfg.cls)}>
                          <TypeIcon className="h-3 w-3" />
                          {typeCfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-foreground">{OPERATOR_MAP[order.operator] || order.operator || '—'}</td>
                      <td className="px-4 py-3 font-mono text-foreground">{order.phoneNumber || '—'}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{formatPrice(order.totalPrice)} <span className="text-muted-foreground">ت</span></td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground">صفحه {page}</span>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={orders.length < 20} onClick={() => setPage((p) => p + 1)}>
            <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tab: Car Services                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CarTab() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<CarStats | null>(null);
  const [orders, setOrders] = useState<CarOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/car-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await fetch(`/api/admin/car-orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchStats();
    fetchOrders();
  }, [fetchStats, fetchOrders]);

  const filtered = search
    ? orders.filter(
        (o) =>
          o.car?.plate?.includes(search) ||
          o.car?.brand?.includes(search) ||
          o.car?.model?.includes(search) ||
          o.user?.phone?.includes(search) ||
          o.user?.fullName?.includes(search)
      )
    : orders;

  const categoryEntries = stats?.byCategory ? Object.entries(stats.byCategory).filter(([, v]) => v.count > 0) : [];

  return (
    <div className="space-y-6">
      {/* Provider Settings */}
      <ProviderSettingsPanel serviceType="car" />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard icon={Car} label={t('admin.totalOrders')} value={stats.total} gradient="from-blue-500 to-blue-600" />
          <StatCard icon={Clock} label={t('admin.todayOrders')} value={stats.today} gradient="from-amber-500 to-amber-600" />
          <StatCard icon={Banknote} label={t('admin.totalRevenue')} value={`${formatPrice(stats.totalRevenue)}`} sub="تومان" gradient="from-emerald-500 to-emerald-600" />
          <StatCard icon={TrendingUp} label="تکمیل شده" value={stats.success} gradient="from-teal-500 to-teal-600" />
        </div>
      )}

      {/* Category breakdown */}
      {categoryEntries.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categoryEntries.slice(0, 4).map(([id, cat]) => (
            <Card key={id} className="border-border/50 bg-card/50">
              <CardContent className="p-3">
                <p className="text-[11px] text-muted-foreground mb-1">{cat.name}</p>
                <p className="text-lg font-bold text-foreground">{cat.count} <span className="text-xs font-normal text-muted-foreground">سفارش</span></p>
                {cat.revenue > 0 && <p className="text-[10px] text-emerald-500">{formatPrice(cat.revenue)} تومان</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="جستجو: پلاک، برند، مدل..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-9 text-xs pr-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="h-9 text-xs w-[130px]">
                <SelectValue placeholder={t('admin.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.all')}</SelectItem>
                <SelectItem value="completed">تکمیل</SelectItem>
                <SelectItem value="pending">{t('admin.pending')}</SelectItem>
                <SelectItem value="cancelled">{t('admin.failed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 p-4 animate-pulse">
              <div className="h-3 w-48 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Car className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">سفارشی یافت نشد</h3>
          <p className="text-xs text-muted-foreground">هنوز سفارش خدمات خودرو ثبت نشده است</p>
        </div>
      ) : (
        <Card className="border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground">شناسه</th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground">دسته‌بندی</th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground">{t('admin.car')}</th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground">{t('admin.amount')}</th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground">{t('admin.status')}</th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground">{t('admin.date')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-muted-foreground">{order.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-foreground">{order.category?.name || '—'}</td>
                    <td className="px-4 py-3 text-foreground">
                      {order.car ? `${order.car.brand} ${order.car.model}` : '—'}
                      {order.car?.plate && <span className="text-muted-foreground mr-2">({order.car.plate})</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{formatPrice(order.finalPrice || order.estimatedPrice)} <span className="text-muted-foreground">ت</span></td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground">صفحه {page}</span>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={orders.length < 20} onClick={() => setPage((p) => p + 1)}>
            <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tab: Insurance                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function InsuranceTab() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<InsStats | null>(null);
  const [orders, setOrders] = useState<InsOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/insurance-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await fetch(`/api/admin/insurance-orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchStats();
    fetchOrders();
  }, [fetchStats, fetchOrders]);

  const filtered = search
    ? orders.filter(
        (o) =>
          o.planName?.includes(search) ||
          o.providerName?.includes(search) ||
          o.holderName?.includes(search) ||
          o.holderPhone?.includes(search) ||
          o.policyNumber?.includes(search) ||
          o.user?.phone?.includes(search) ||
          o.user?.fullName?.includes(search)
      )
    : orders;

  const providerEntries = stats?.byProvider ? Object.entries(stats.byProvider).filter(([, v]) => v.count > 0) : [];

  return (
    <div className="space-y-6">
      {/* Provider Settings */}
      <ProviderSettingsPanel serviceType="insurance" />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={Umbrella} label={t('admin.totalOrders')} value={stats.total} gradient="from-blue-500 to-blue-600" />
          <StatCard icon={Clock} label={t('admin.todayOrders')} value={stats.today} gradient="from-amber-500 to-amber-600" />
          <StatCard icon={Banknote} label={t('admin.totalRevenue')} value={`${formatPrice(stats.revenue)}`} sub="تومان" gradient="from-emerald-500 to-emerald-600" />
          <StatCard icon={TrendingUp} label="کارمزد" value={`${formatPrice(stats.commission)}`} sub="تومان" gradient="from-violet-500 to-violet-600" />
          <StatCard icon={CheckCircle2} label="بیمه فعال" value={stats.active} gradient="from-teal-500 to-teal-600" />
        </div>
      )}

      {/* Provider breakdown */}
      {providerEntries.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {providerEntries.slice(0, 4).map(([name, prov]) => (
            <Card key={name} className="border-border/50 bg-card/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Building className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground truncate">{name}</p>
                </div>
                <p className="text-lg font-bold text-foreground">{prov.count} <span className="text-xs font-normal text-muted-foreground">سفارش</span></p>
                {prov.revenue > 0 && <p className="text-[10px] text-emerald-500">{formatPrice(prov.revenue)} تومان</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="جستجو: طرح، بیمه، شماره بیمه‌نامه..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-9 text-xs pr-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="h-9 text-xs w-[140px]">
                <SelectValue placeholder={t('admin.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.all')}</SelectItem>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="pending">{t('admin.pending')}</SelectItem>
                <SelectItem value="cancelled">لغو شده</SelectItem>
                <SelectItem value="expired">منقضی</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 p-4 animate-pulse">
              <div className="h-3 w-48 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Umbrella className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">سفارشی یافت نشد</h3>
          <p className="text-xs text-muted-foreground">هنوز سفارش بیمه‌ای ثبت نشده است</p>
        </div>
      ) : (
        <Card className="border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground">شناسه</th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground">طرح</th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground">{t('admin.provider')}</th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground">{t('admin.amount')}</th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground">{t('admin.status')}</th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground">{t('admin.date')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-muted-foreground">{order.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-foreground max-w-[200px] truncate">{order.planName || '—'}</td>
                    <td className="px-4 py-3 text-foreground">{order.providerName || '—'}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{formatPrice(order.amountPaid)} <span className="text-muted-foreground">ت</span></td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground">صفحه {page}</span>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={orders.length < 20} onClick={() => setPage((p) => p + 1)}>
            <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

const TABS = [
  { key: 'utility', label: 'admin.utilityOrders', icon: Smartphone },
  { key: 'car', label: 'admin.carOrders', icon: Car },
  { key: 'insurance', label: 'admin.insuranceOrders', icon: Umbrella },
] as const;

export default function AdminServices({ defaultTab }: { defaultTab?: string }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>(defaultTab || 'utility');

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-gold" />
            {t('admin.services')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            مشاهده و مدیریت سفارشات خدمات کاربران
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-gold/10 text-gold border border-gold/20 shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
              )}
            >
              <Icon className="h-4 w-4" />
              {t(tab.label)}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'utility' && <UtilityTab />}
      {activeTab === 'car' && <CarTab />}
      {activeTab === 'insurance' && <InsuranceTab />}
    </div>
  );
}

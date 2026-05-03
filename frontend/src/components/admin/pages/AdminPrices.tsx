
import React, { useState, useEffect } from 'react';
import {useAppStore} from '@/lib/store';
import {formatToman, getTimeAgo} from '@/lib/helpers';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Separator} from '@/components/ui/separator';
import {Skeleton} from '@/components/ui/skeleton';
import {Switch} from '@/components/ui/switch';
import {TrendingUp, TrendingDown, RefreshCw, Settings, Zap, Clock, DollarSign, AlertCircle, CheckCircle, BarChart3, Wifi, WifiOff} from 'lucide-react';
import {cn} from '@/lib/utils';

interface GoldPrice {
  buyPrice: number; sellPrice: number; marketPrice: number;
  ouncePrice: number; spread: number; updatedAt: string; isManual: boolean;
}

export default function AdminPrices() {
  const [prices, setPrices] = useState<GoldPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualMode, setManualMode] = useState(false);
  const [form, setForm] = useState({ buyPrice: '', sellPrice: '', marketPrice: '' });
  const [saving, setSaving] = useState(false);
  const [spreadPercent, setSpreadPercent] = useState('0.5');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/gold/prices');
        if (res.ok) {
          const d = await res.json();
          setPrices(d.prices || d);
          setManualMode(d.prices?.isManual || d.isManual || false);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const formatPrice = (p: number) => new Intl.NumberFormat('fa-IR').format(Math.round(p));

  const handleRefresh = async () => {
    try {
      const res = await fetch('/api/gold/seed-prices', { method: 'POST' });
      if (res.ok) {
        useAppStore.getState().addToast('قیمت‌ها بروزرسانی شدند', 'success');
        const d = await fetch('/api/gold/prices').then(r => r.json());
        setPrices(d.prices || d);
      }
    } catch { useAppStore.getState().addToast('خطا', 'error'); }
  };

  const handleSave = async () => {
    if (!form.buyPrice || !form.sellPrice || !form.marketPrice) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyPrice: parseFloat(form.buyPrice),
          sellPrice: parseFloat(form.sellPrice),
          marketPrice: parseFloat(form.marketPrice),
        }),
      });
      if (res.ok) {
        useAppStore.getState().addToast('قیمت‌ها ذخیره شدند', 'success');
        const d = await fetch('/api/gold/prices').then(r => r.json());
        setPrices(d.prices || d);
      }
    } catch { useAppStore.getState().addToast('خطا', 'error'); }
    setSaving(false);
  };

  const currentSpread = prices ? (((prices.buyPrice - prices.sellPrice) / prices.sellPrice) * 100) : 0;

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      {/* Current Prices */}
      <Card className="glass-gold">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="size-4 text-gold" />
              قیمت‌های فعلی طلا
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={cn('text-[10px]', prices?.isManual ? 'bg-amber-500/15 text-amber-500' : 'bg-emerald-500/15 text-emerald-500')}>
                {prices?.isManual ? <><WifiOff className="size-3 ml-1" />دستی</> : <><Wifi className="size-3 ml-1" />خودکار</>}
              </Badge>
              {prices?.updatedAt && (
                <span className="text-[10px] text-muted-foreground">{getTimeAgo(prices.updatedAt)}</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground mb-1">قیمت خرید (واحد طلایی/گرم)</p>
              <p className="text-lg font-bold text-emerald-500">{prices ? formatPrice(prices.buyPrice) : '-'}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground mb-1">قیمت فروش (واحد طلایی/گرم)</p>
              <p className="text-lg font-bold text-red-500">{prices ? formatPrice(prices.sellPrice) : '-'}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground mb-1">قیمت بازار (واحد طلایی/گرم)</p>
              <p className="text-lg font-bold gold-gradient-text">{prices ? formatPrice(prices.marketPrice) : '-'}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground mb-1">اسپرد</p>
              <p className="text-lg font-bold text-amber-500">{currentSpread.toFixed(2)}٪</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mode Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Settings className="size-4 text-gold" />
                حالت قیمت‌گذاری
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {manualMode ? 'قیمت‌ها به صورت دستی تنظیم می‌شوند' : 'قیمت‌ها به صورت خودکار از منابع خارجی دریافت می‌شوند'}
              </p>
            </div>
            <Switch checked={manualMode} onCheckedChange={setManualMode} />
          </div>
        </CardContent>
      </Card>

      {/* Manual Price Form */}
      {manualMode && (
        <Card className="glass-gold">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="size-4 text-gold" />
              تنظیم دستی قیمت‌ها
            </CardTitle>
            <CardDescription className="text-[11px]">قیمت‌ها به واحد طلایی برای هر گرم طلا</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">قیمت خرید</Label>
                <Input type="number" value={form.buyPrice} onChange={e => setForm(f => ({ ...f, buyPrice: e.target.value }))}
                  placeholder={prices ? String(prices.buyPrice) : '35,000,000'} dir="ltr" className="text-left" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">قیمت فروش</Label>
                <Input type="number" value={form.sellPrice} onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))}
                  placeholder={prices ? String(prices.sellPrice) : '34,800,000'} dir="ltr" className="text-left" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">قیمت بازار</Label>
                <Input type="number" value={form.marketPrice} onChange={e => setForm(f => ({ ...f, marketPrice: e.target.value }))}
                  placeholder={prices ? String(prices.marketPrice) : '34,900,000'} dir="ltr" className="text-left" />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-gold hover:bg-gold-dark text-white">
              <CheckCircle className="size-4 ml-2" /> ذخیره قیمت‌ها
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleRefresh} className="border-gold/20 text-gold hover:bg-gold/10">
          <RefreshCw className="size-4 ml-2" /> بروزرسانی از منبع
        </Button>
      </div>

      {/* Info */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
            <AlertCircle className="size-4 text-amber-500" />
            نکات مهم
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li className="flex items-start gap-1.5"><CheckCircle className="size-3 text-emerald-500 mt-0.5 shrink-0" /> قیمت‌ها در حالت خودکار هر ۶۰ ثانیه بروزرسانی می‌شوند</li>
            <li className="flex items-start gap-1.5"><CheckCircle className="size-3 text-emerald-500 mt-0.5 shrink-0" /> اسپرد پیشنهادی بین خرید و فروش: ۰.۵٪ تا ۱٪</li>
            <li className="flex items-start gap-1.5"><CheckCircle className="size-3 text-emerald-500 mt-0.5 shrink-0" /> تنظیم دستی تا بروزرسانی بعدی اعمال خواهد شد</li>
            <li className="flex items-start gap-1.5"><CheckCircle className="size-3 text-emerald-500 mt-0.5 shrink-0" /> قیمت انس جهانی نیز به صورت خودکار دریافت می‌شود</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import {useAppStore} from '@/lib/store';
import {formatToman, formatDateTime, getTimeAgo, getTransactionTypeLabel, getTransactionStatusLabel, formatGrams} from '@/lib/helpers';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Skeleton} from '@/components/ui/skeleton';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {ArrowUpDown, CreditCard, Download, CheckCircle, XCircle, Clock, Filter, Eye, DollarSign, Coins, TrendingUp, TrendingDown, Wallet, AlertTriangle} from 'lucide-react';
import {cn} from '@/lib/utils';

interface AdminTx {
  id: string; type: string; amountFiat: number; amountGold: number;
  status: string; createdAt: string; referenceId: string;
  user: { phone: string; fullName: string | null };
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<AdminTx[]>([]);
  const [withdrawals, setWithdrawals] = useState<AdminTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [detail, setDetail] = useState<AdminTx | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => {
    (async () => {
      try {
        const [txRes, wRes] = await Promise.all([
          fetch('/api/admin/transactions'),
          fetch('/api/admin/withdrawals'),
        ]);
        if (txRes.ok) { const d = await txRes.json(); setTransactions(Array.isArray(d) ? d : d.transactions || []); }
        if (wRes.ok) { const d = await wRes.json(); setWithdrawals(Array.isArray(d) ? d : d.withdrawals || []); }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

  const displayTx = activeTab === 'withdrawals' ? pendingWithdrawals : transactions;
  const filtered = displayTx.filter(tx => {
    const matchType = typeFilter === 'all' || tx.type === typeFilter;
    const matchStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchType && matchStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const totalVolume = transactions.reduce((s, t) => s + (t.amountFiat || 0), 0);
  const totalGold = transactions.reduce((s, t) => s + (t.amountGold || 0), 0);

  const handleWithdrawalAction = async (txId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: txId, status }),
      });
      if (res.ok) {
        useAppStore.getState().addToast(status === 'success' ? 'برداشت تأیید شد' : 'برداشت رد شد', status === 'success' ? 'success' : 'info');
        setWithdrawals(prev => prev.map(w => w.id === txId ? { ...w, status } : w));
      }
    } catch { useAppStore.getState().addToast('خطا', 'error'); }
  };

  const handleExport = () => {
    const BOM = '\uFEFF';
    const headers = ['نوع', 'کاربر', 'مبلغ واحد طلایی', 'مقدار طلا', 'وضعیت', 'تاریخ'];
    const rows = filtered.map(t => [
      getTransactionTypeLabel(t.type), t.user?.fullName || t.user?.phone,
      String(t.amountFiat), String(t.amountGold), getTransactionStatusLabel(t.status), t.createdAt,
    ]);
    const csv = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    useAppStore.getState().addToast('فایل دانلود شد', 'success');
  };

  const getTxIcon = (type: string) => {
    switch (type) {
      case 'buy_gold': return <TrendingUp className="size-3.5 text-emerald-500" />;
      case 'sell_gold': return <TrendingDown className="size-3.5 text-red-500" />;
      case 'withdrawal': return <CreditCard className="size-3.5 text-red-500" />;
      case 'deposit': return <Wallet className="size-3.5 text-blue-500" />;
      default: return <DollarSign className="size-3.5 text-gold" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'حجم کل (واحد طلایی)', value: formatToman(totalVolume), icon: DollarSign, color: 'text-gold', bg: 'bg-gold/15' },
          { label: 'طلا معامله شده', value: formatGrams(totalGold), icon: Coins, color: 'text-amber-500', bg: 'bg-amber-500/15' },
          { label: 'تعداد تراکنش‌ها', value: transactions.length.toLocaleString('fa-IR'), icon: ArrowUpDown, color: 'text-emerald-500', bg: 'bg-emerald-500/15' },
          { label: 'برداشت معلق', value: pendingWithdrawals.length.toLocaleString('fa-IR'), icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/15' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="card-spotlight">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-bold gold-gradient-text">{s.value}</p>
                  </div>
                  <div className={cn('size-9 rounded-lg flex items-center justify-center', s.bg)}>
                    <Icon className={cn('size-4', s.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setPage(1); }}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all" className="text-xs">همه تراکنش‌ها</TabsTrigger>
            <TabsTrigger value="withdrawals" className="text-xs">برداشت‌های معلق ({pendingWithdrawals.length})</TabsTrigger>
          </TabsList>
        </Tabs>
        {activeTab === 'all' && (
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue placeholder="نوع" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="deposit">واریز</SelectItem>
                <SelectItem value="withdrawal">برداشت</SelectItem>
                <SelectItem value="buy_gold">خرید طلا</SelectItem>
                <SelectItem value="sell_gold">فروش طلا</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue placeholder="وضعیت" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="success">موفق</SelectItem>
                <SelectItem value="pending">در انتظار</SelectItem>
                <SelectItem value="failed">ناموفق</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={handleExport} className="sm:mr-auto border-gold/20 text-gold hover:bg-gold/10">
          <Download className="size-4 ml-1" /> CSV
        </Button>
      </div>

      {/* Withdrawal Cards */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-2">
          {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />) :
            pendingWithdrawals.length > 0 ? pendingWithdrawals.map(w => (
              <Card key={w.id} className="glass-gold">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-red-500/15 flex items-center justify-center">
                        <CreditCard className="size-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{w.user?.fullName || 'بدون نام'}</p>
                        <p className="text-[11px] text-muted-foreground" dir="ltr">{w.user?.phone}</p>
                        <p className="text-lg font-bold gold-gradient-text mt-0.5">{formatToman(w.amountFiat)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs"
                        onClick={() => handleWithdrawalAction(w.id, 'success')}>
                        <CheckCircle className="size-3.5 ml-1" /> تأیید
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs"
                        onClick={() => handleWithdrawalAction(w.id, 'failed')}>
                        <XCircle className="size-3.5 ml-1" /> رد
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : <p className="text-center text-muted-foreground py-12 text-sm">برداشت معلقی وجود ندارد</p>}
        </div>
      )}

      {/* Transaction Table */}
      {activeTab === 'all' && (
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">نوع</TableHead>
                    <TableHead className="text-xs">کاربر</TableHead>
                    <TableHead className="text-xs">مبلغ (واحد طلایی)</TableHead>
                    <TableHead className="text-xs">طلا (گرم)</TableHead>
                    <TableHead className="text-xs">وضعیت</TableHead>
                    <TableHead className="text-xs">تاریخ</TableHead>
                    <TableHead className="text-xs"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8" /></TableCell></TableRow>
                  )) : paginated.map(tx => (
                    <TableRow key={tx.id} className="hover:bg-gold/5 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTxIcon(tx.type)}
                          <span className="text-xs">{getTransactionTypeLabel(tx.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{tx.user?.fullName || tx.user?.phone || '---'}</TableCell>
                      <TableCell className="text-xs font-medium">{tx.amountFiat > 0 ? formatToman(tx.amountFiat) : '-'}</TableCell>
                      <TableCell className="text-xs">{tx.amountGold > 0 ? tx.amountGold.toFixed(4) : '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[10px]',
                          tx.status === 'success' ? 'text-emerald-500' : tx.status === 'pending' ? 'text-amber-500' : 'text-red-500'
                        )}>{getTransactionStatusLabel(tx.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{getTimeAgo(tx.createdAt)}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" className="size-7" onClick={() => { setDetail(tx); setDetailOpen(true); }}>
                          <Eye className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>جزئیات تراکنش</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground text-xs">نوع:</span><br />{getTransactionTypeLabel(detail.type)}</div>
                <div><span className="text-muted-foreground text-xs">وضعیت:</span><br />{getTransactionStatusLabel(detail.status)}</div>
                <div><span className="text-muted-foreground text-xs">کاربر:</span><br />{detail.user?.fullName || detail.user?.phone}</div>
                <div><span className="text-muted-foreground text-xs">تاریخ:</span><br />{formatDateTime(detail.createdAt)}</div>
                <div><span className="text-muted-foreground text-xs">مبلغ (واحد طلایی):</span><br />{detail.amountFiat > 0 ? formatToman(detail.amountFiat) : '-'}</div>
                <div><span className="text-muted-foreground text-xs">طلا (گرم):</span><br />{detail.amountGold > 0 ? detail.amountGold.toFixed(4) : '-'}</div>
                <div className="col-span-2"><span className="text-muted-foreground text-xs">شناسه:</span><br /><span dir="ltr" className="text-[11px]">{detail.id}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

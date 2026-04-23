'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { formatGrams, formatDateTime, getTimeAgo } from '@/lib/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Banknote, CheckCircle, XCircle, Clock, Settings, AlertTriangle,
  Coins, TrendingUp, CalendarDays, Shield, Eye, Percent,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLoan {
  id: string; userId: string; status: string; amountGold: number;
  collateralGold: number; interestRate: number; ltvRatio: number;
  dueDate: string; createdAt: string; approvedAt: string | null;
  adminNote: string | null;
  user: { phone: string; fullName: string | null };
  repayments?: any[];
}

interface LoanSettings {
  ltvRatio: number; interestRate: number; minGold: number;
  maxDuration: number; maxLoanAmount: number;
}

export default function AdminLoans() {
  const [loans, setLoans] = useState<AdminLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [settings, setSettings] = useState<LoanSettings>({
    ltvRatio: 0.7, interestRate: 5, minGold: 1, maxDuration: 365, maxLoanAmount: 500,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ ltvRatio: '', interestRate: '', minGold: '', maxDuration: '', maxLoanAmount: '' });
  const [loanDialog, setLoanDialog] = useState<AdminLoan | null>(null);
  const [loanNote, setLoanNote] = useState('');
  const [approvedAmt, setApprovedAmt] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [lRes, sRes] = await Promise.all([
          fetch('/api/admin/loans'),
          fetch('/api/loans/settings'),
        ]);
        if (lRes.ok) { const d = await lRes.json(); setLoans(Array.isArray(d) ? d : d.loans || []); }
        if (sRes.ok) { const d = await sRes.json(); if (d.settings) setSettings(d.settings); }
      } catch { /* ignore */ }
      setLoading(false);
    };
    init();
  }, []);

  const filtered = statusFilter === 'all' ? loans : loans.filter(l => l.status === statusFilter);
  const pendingLoans = loans.filter(l => l.status === 'pending');
  const activeLoans = loans.filter(l => l.status === 'active');
  const totalDisbursed = loans.filter(l => l.status === 'active' || l.status === 'completed').reduce((s, l) => s + (l.amountGold || 0), 0);

  const handleLoanAction = async (loanId: string, action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      const body: any = { action, adminNote: loanNote || undefined };
      if (action === 'approve' && approvedAmt) body.approvedAmount = parseFloat(approvedAmt);
      const res = await fetch(`/api/admin/loans/${loanId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        useAppStore.getState().addToast(action === 'approve' ? 'وام تأیید شد' : 'وام رد شد', 'success');
        setLoanDialog(null); setLoanNote(''); setApprovedAmt('');
        const d = await fetch('/api/admin/loans').then(r => r.ok ? r.json() : []);
        setLoans(Array.isArray(d) ? d : d.loans || []);
      } else {
        const d = await res.json();
        useAppStore.getState().addToast(d.message || 'خطا', 'error');
      }
    } catch { useAppStore.getState().addToast('خطا', 'error'); }
    setActionLoading(false);
  };

  const handleSaveSettings = async () => {
    try {
      const body: any = {};
      if (settingsForm.ltvRatio) body.ltvRatio = parseFloat(settingsForm.ltvRatio);
      if (settingsForm.interestRate) body.interestRate = parseFloat(settingsForm.interestRate);
      if (settingsForm.minGold) body.minGold = parseFloat(settingsForm.minGold);
      if (settingsForm.maxDuration) body.maxDuration = parseInt(settingsForm.maxDuration);
      if (settingsForm.maxLoanAmount) body.maxLoanAmount = parseFloat(settingsForm.maxLoanAmount);
      const res = await fetch('/api/admin/loans/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        useAppStore.getState().addToast('تنظیمات ذخیره شد', 'success');
        setSettingsOpen(false);
        const d = await fetch('/api/loans/settings').then(r => r.json());
        if (d.settings) setSettings(d.settings);
      }
    } catch { /* ignore */ }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      pending: { label: 'در انتظار', cls: 'bg-amber-500/15 text-amber-500' },
      approved: { label: 'تأیید شده', cls: 'bg-blue-500/15 text-blue-500' },
      active: { label: 'فعال', cls: 'bg-emerald-500/15 text-emerald-500' },
      completed: { label: 'تکمیل شده', cls: 'bg-gray-500/15 text-gray-500' },
      rejected: { label: 'رد شده', cls: 'bg-red-500/15 text-red-500' },
    };
    const item = map[status] || map.pending;
    return <Badge className={cn('text-[10px]', item.cls)}>{item.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'در انتظار بررسی', value: pendingLoans.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/15' },
          { label: 'وام‌های فعال', value: activeLoans.length, icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-500/15' },
          { label: 'کل پرداخت (گرم طلا)', value: formatGrams(totalDisbursed), icon: Coins, color: 'text-gold', bg: 'bg-gold/15' },
          { label: 'کل وام‌ها', value: loans.length, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/15' },
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

      {/* Loan Settings */}
      <Card className="glass-gold">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold flex items-center gap-2"><Settings className="size-4 text-gold" /> تنظیمات وام</h3>
            <Button size="sm" variant="outline" onClick={() => {
              setSettingsForm({
                ltvRatio: String(settings.ltvRatio), interestRate: String(settings.interestRate),
                minGold: String(settings.minGold), maxDuration: String(settings.maxDuration),
                maxLoanAmount: String(settings.maxLoanAmount),
              });
              setSettingsOpen(true);
            }} className="border-gold/20 text-gold hover:bg-gold/10 text-xs">
              <Settings className="size-3 ml-1" /> ویرایش
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'نسبت LTV', value: `${(settings.ltvRatio * 100).toFixed(0)}%` },
              { label: 'نرخ بهره', value: `${settings.interestRate}%` },
              { label: 'حداقل طلا', value: `${settings.minGold} گرم` },
              { label: 'حداکثر مدت', value: `${settings.maxDuration} روز` },
              { label: 'سقف وام', value: `${settings.maxLoanAmount} گرم` },
            ].map(s => (
              <div key={s.label} className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="text-sm font-bold gold-gradient-text">{s.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'pending', 'active', 'completed', 'rejected'].map(s => (
          <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'}
            onClick={() => setStatusFilter(s)}
            className={statusFilter === s ? 'bg-gold text-white' : 'border-gold/20 text-gold hover:bg-gold/10'}>
            {{ all: 'همه', pending: 'در انتظار', active: 'فعال', completed: 'تکمیل', rejected: 'رد شده' }[s]}
          </Button>
        ))}
      </div>

      {/* Loan List */}
      <ScrollArea className="max-h-[450px]">
        <div className="space-y-2">
          {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />) :
            filtered.length > 0 ? filtered.map(loan => (
              <Card key={loan.id} className="hover-lift-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-gold/15 flex items-center justify-center">
                        <Banknote className="size-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{loan.user?.fullName || 'بدون نام'}</p>
                        <p className="text-[11px] text-muted-foreground" dir="ltr">{loan.user?.phone}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Coins className="size-3" /> مبلغ: {loan.amountGold.toFixed(3)} گرم
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Shield className="size-3" /> وثیقه: {loan.collateralGold.toFixed(3)} گرم
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Percent className="size-3" /> بهره: {loan.interestRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(loan.status)}
                      {loan.status === 'pending' && (
                        <Button size="sm" className="bg-gold text-white text-xs" onClick={() => { setLoanDialog(loan); setLoanNote(''); setApprovedAmt(''); }}>
                          <Eye className="size-3.5 ml-1" /> بررسی
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : <p className="text-center text-muted-foreground py-12 text-sm">وامی یافت نشد</p>}
        </div>
      </ScrollArea>

      {/* Loan Action Dialog */}
      <Dialog open={!!loanDialog} onOpenChange={() => setLoanDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>بررسی درخواست وام</DialogTitle></DialogHeader>
          {loanDialog && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">درخواست‌کننده:</span><span className="font-medium">{loanDialog.user?.fullName || loanDialog.user?.phone}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">مبلغ درخواستی:</span><span className="font-medium">{loanDialog.amountGold.toFixed(3)} گرم طلا</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">وثیقه:</span><span className="font-medium">{loanDialog.collateralGold.toFixed(3)} گرم طلا</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">نرخ بهره:</span><span className="font-medium">{loanDialog.interestRate}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">تاریخ سررسید:</span><span className="font-medium">{loanDialog.dueDate ? formatDateTime(loanDialog.dueDate) : '-'}</span></div>
              </div>
              <div className="space-y-2">
                <Label>مبلغ تأیید شده (گرم طلا) - اختیاری</Label>
                <Input type="number" value={approvedAmt} onChange={e => setApprovedAmt(e.target.value)} placeholder={String(loanDialog.amountGold)} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>یادداشت ادمین</Label>
                <Textarea value={loanNote} onChange={e => setLoanNote(e.target.value)} placeholder="توضیحات..." rows={2} />
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleLoanAction(loanDialog.id, 'approve')} disabled={actionLoading}>
                  <CheckCircle className="size-4 ml-1.5" /> تأیید
                </Button>
                <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={() => handleLoanAction(loanDialog.id, 'reject')} disabled={actionLoading}>
                  <XCircle className="size-4 ml-1.5" /> رد
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>تنظیمات وام</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {[
              { label: 'نسبت LTV (مثلاً 0.7 = ۷۰٪)', key: 'ltvRatio', placeholder: '0.7' },
              { label: 'نرخ بهره (٪)', key: 'interestRate', placeholder: '5' },
              { label: 'حداقل طلا (گرم)', key: 'minGold', placeholder: '1' },
              { label: 'حداکثر مدت (روز)', key: 'maxDuration', placeholder: '365' },
              { label: 'سقف وام (گرم طلا)', key: 'maxLoanAmount', placeholder: '500' },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs">{f.label}</Label>
                <Input value={(settingsForm as any)[f.key]} onChange={e => setSettingsForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} dir="ltr" />
              </div>
            ))}
            <Button className="w-full bg-gold hover:bg-gold-dark text-white" onClick={handleSaveSettings}>ذخیره تنظیمات</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

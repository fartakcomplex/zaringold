
import React, { useState, useEffect } from 'react';
import {useAppStore} from '@/lib/store';
import {formatDateTime, getTimeAgo} from '@/lib/helpers';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Textarea} from '@/components/ui/textarea';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Skeleton} from '@/components/ui/skeleton';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {Shield, ShieldCheck, UserCheck, UserX, Clock, CheckCircle, XCircle, Eye, FileText, Camera, CreditCard, AlertTriangle, Filter, Search, Calendar, Phone} from 'lucide-react';
import {cn} from '@/lib/utils';

interface AdminKYC {
  id: string; userId: string; status: string; adminNote: string | null;
  createdAt: string; user: { phone: string; fullName: string | null };
}

export default function AdminKYC() {
  const [kycs, setKycs] = useState<AdminKYC[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [detail, setDetail] = useState<AdminKYC | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/kyc');
        if (res.ok) {
          const d = await res.json();
          setKycs(Array.isArray(d) ? d : d.requests || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const filtered = kycs.filter(k => {
    const matchFilter = filter === 'all' || k.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || (k.user?.phone || '').includes(q) || (k.user?.fullName || '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const pending = kycs.filter(k => k.status === 'pending').length;
  const approved = kycs.filter(k => k.status === 'approved').length;
  const rejected = kycs.filter(k => k.status === 'rejected').length;

  const stats = [
    { label: 'کل درخواست‌ها', value: kycs.length, icon: Shield, color: 'text-gold', bg: 'bg-gold/15' },
    { label: 'در انتظار', value: pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/15' },
    { label: 'تأیید شده', value: approved, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/15' },
    { label: 'رد شده', value: rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/15' },
  ];

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (!detail) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycId: detail.id, status, note }),
      });
      if (res.ok) {
        useAppStore.getState().addToast(status === 'approved' ? 'احراز هویت تأیید شد' : 'احراز هویت رد شد', status === 'approved' ? 'success' : 'info');
        setDetailOpen(false); setNote('');
        setKycs(prev => prev.map(k => k.id === detail.id ? { ...k, status, adminNote: note } : k));
      } else {
        useAppStore.getState().addToast('خطا در انجام عملیات', 'error');
      }
    } catch { useAppStore.getState().addToast('خطا در ارتباط با سرور', 'error'); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="card-spotlight">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-bold gold-gradient-text">{s.value.toLocaleString('fa-IR')}</p>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی نام یا شماره..." className="pr-9" />
        </div>
      </div>

      {/* Tabs & List */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all" className="text-xs">همه ({kycs.length})</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs">در انتظار ({pending})</TabsTrigger>
          <TabsTrigger value="approved" className="text-xs">تأیید شده ({approved})</TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs">رد شده ({rejected})</TabsTrigger>
        </TabsList>

        {['all', 'pending', 'approved', 'rejected'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2 mt-2">
                {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />) :
                  filtered.length > 0 ? filtered.map(kyc => (
                    <Card key={kyc.id} className="hover-lift-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-gold/15 flex items-center justify-center">
                              <ShieldCheck className="size-5 text-gold" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{kyc.user?.fullName || 'بدون نام'}</p>
                              <p className="text-[11px] text-muted-foreground" dir="ltr">{kyc.user?.phone}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="size-3 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">{getTimeAgo(kyc.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={cn(
                              'text-[10px]',
                              kyc.status === 'pending' && 'bg-amber-500/15 text-amber-500',
                              kyc.status === 'approved' && 'bg-emerald-500/15 text-emerald-500',
                              kyc.status === 'rejected' && 'bg-red-500/15 text-red-500',
                            )}>
                              {kyc.status === 'pending' ? 'در انتظار' : kyc.status === 'approved' ? 'تأیید شده' : 'رد شده'}
                            </Badge>
                            {kyc.status === 'pending' && (
                              <Button size="sm" className="bg-gold text-white text-xs" onClick={() => { setDetail(kyc); setNote(kyc.adminNote || ''); setDetailOpen(true); }}>
                                <Eye className="size-3.5 ml-1" /> بررسی
                              </Button>
                            )}
                            {kyc.status !== 'pending' && kyc.adminNote && (
                              <span className="text-[10px] text-muted-foreground max-w-[120px] truncate">{kyc.adminNote}</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )) : <p className="text-center text-muted-foreground py-12 text-sm">درخواستی یافت نشد</p>}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>

      {/* KYC Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>بررسی درخواست احراز هویت</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="size-10 rounded-full bg-gold/15 flex items-center justify-center text-sm font-bold text-gold">
                  {(detail.user?.fullName || detail.user?.phone || '?').charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{detail.user?.fullName || 'بدون نام'}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1" dir="ltr">
                    <Phone className="size-3" />{detail.user?.phone}
                  </p>
                </div>
              </div>

              {/* Document placeholders */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'کارت ملی', icon: FileText },
                  { label: 'سلفی', icon: Camera },
                  { label: 'کارت بانکی', icon: CreditCard },
                ].map(doc => (
                  <div key={doc.label} className="border rounded-lg p-4 text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                    <doc.icon className="size-6 mx-auto mb-1.5 text-gold" />
                    <p className="text-[10px] text-muted-foreground">{doc.label}</p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>یادداشت ادمین</Label>
                <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="توضیحات خود را وارد کنید..." rows={3} />
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleAction('approved')} disabled={submitting}>
                  <CheckCircle className="size-4 ml-1.5" /> تأیید
                </Button>
                <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={() => handleAction('rejected')} disabled={submitting}>
                  <XCircle className="size-4 ml-1.5" /> رد
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

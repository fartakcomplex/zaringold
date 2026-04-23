'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { formatToman, formatDateTime, getTimeAgo, getTransactionTypeLabel, getTransactionStatusLabel } from '@/lib/helpers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Users, Shield, TrendingUp, Wallet, ArrowUpDown,
  CheckCircle, XCircle, Clock, Eye, Search, Filter,
  DollarSign, Coins, BarChart3, FileText, AlertTriangle,
  Settings, Ban, Unlock, UserCheck, UserX, Activity, CreditCard, Download, Zap,
  LayoutGrid, ExternalLink, Banknote, Percent, CalendarDays, AlertCircle
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AdminUser {
  id: string;
  phone: string;
  email: string | null;
  fullName: string | null;
  isVerified: boolean;
  isActive: boolean;
  isFrozen: boolean;
  role: string;
  createdAt: string;
}

interface AdminKYC {
  id: string;
  userId: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  user: { phone: string; fullName: string | null };
}

interface AdminTransaction {
  id: string;
  type: string;
  amountFiat: number;
  amountGold: number;
  status: string;
  createdAt: string;
  user: { phone: string; fullName: string | null };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminView() {
  const { user, setPage } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [kycRequests, setKycRequests] = useState<AdminKYC[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [kycDetail, setKycDetail] = useState<AdminKYC | null>(null);
  const [kycNote, setKycNote] = useState('');
  const [kycDialogOpen, setKycDialogOpen] = useState(false);
  const [priceForm, setPriceForm] = useState({ buyPrice: '', sellPrice: '', marketPrice: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [txFilter, setTxFilter] = useState('all');
  const [loans, setLoans] = useState<any[]>([]);
  const [loanStatusFilter, setLoanStatusFilter] = useState('all');
  const [loanSettings, setLoanSettings] = useState({ ltvRatio: 0.7, interestRate: 5, minGold: 1, maxDuration: 365, maxLoanAmount: 500 });
  const [loanDialogOpen, setLoanDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [loanNote, setLoanNote] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [loanSettingsOpen, setLoanSettingsOpen] = useState(false);
  const [loanSettingsForm, setLoanSettingsForm] = useState({ ltvRatio: '', interestRate: '', minGold: '', maxDuration: '', maxLoanAmount: '' });

  const fetchOverview = async () => {
    try {
      const [usersRes, kycRes, txRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/kyc'),
        fetch('/api/admin/transactions'),
      ]);
      if (usersRes.ok) { const d = await usersRes.json(); setUsers(Array.isArray(d) ? d : d.users || []); }
      if (kycRes.ok) { const d = await kycRes.json(); setKycRequests(Array.isArray(d) ? d : d.requests || []); }
      if (txRes.ok) { const d = await txRes.json(); setTransactions(Array.isArray(d) ? d : d.transactions || []); }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('/api/admin/withdrawals');
      if (res.ok) { const d = await res.json(); setPendingWithdrawals(Array.isArray(d) ? d : d.withdrawals || []); }
    } catch { /* ignore */ }
  };

  const fetchLoans = async (status?: string) => {
    try {
      const url = status && status !== 'all' ? `/api/admin/loans?status=${status}` : '/api/admin/loans';
      const res = await fetch(url);
      if (res.ok) { const d = await res.json(); setLoans(Array.isArray(d) ? d : d.loans || []); }
    } catch { /* ignore */ }
  };

  const fetchLoanSettings = async () => {
    try {
      const res = await fetch('/api/loans/settings');
      if (res.ok) {
        const d = await res.json();
        if (d.settings) setLoanSettings(d.settings);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    const init = async () => { await fetchOverview(); };
    init();
  }, []);

  useEffect(() => {
    if (activeTab === 'withdrawals') {
      const load = async () => { await fetchWithdrawals(); };
      load();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'loans') {
      fetchLoans(loanStatusFilter);
      fetchLoanSettings();
    }
  }, [activeTab, loanStatusFilter]);

  const handleKYCAction = async (kycId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycId, status, note: kycNote }),
      });
      if (res.ok) {
        setKycDialogOpen(false);
        setKycNote('');
        fetchOverview();
      }
    } catch { /* ignore */ }
  };

  const handleWithdrawalAction = async (txId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: txId, status }),
      });
      if (res.ok) fetchWithdrawals();
    } catch { /* ignore */ }
  };

  const handlePriceUpdate = async () => {
    try {
      const res = await fetch('/api/admin/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyPrice: parseFloat(priceForm.buyPrice),
          sellPrice: parseFloat(priceForm.sellPrice),
          marketPrice: parseFloat(priceForm.marketPrice),
        }),
      });
      if (res.ok) {
        useAppStore.getState().addToast('قیمت‌ها با موفقیت بروزرسانی شد', 'success');
      }
    } catch { /* ignore */ }
  };

  const handleLoanAction = async (loanId: string, action: 'approve' | 'reject') => {
    try {
      const body: any = { action, adminNote: loanNote || undefined };
      if (action === 'approve') {
        body.approvedAmount = approvedAmount ? parseFloat(approvedAmount) : undefined;
      }
      const res = await fetch(`/api/admin/loans/${loanId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        useAppStore.getState().addToast(data.message || 'عملیات با موفقیت انجام شد', 'success');
        setLoanDialogOpen(false);
        setSelectedLoan(null);
        setLoanNote('');
        setApprovedAmount('');
        fetchLoans(loanStatusFilter);
      } else {
        const data = await res.json();
        useAppStore.getState().addToast(data.message || 'خطا در انجام عملیات', 'error');
      }
    } catch {
      useAppStore.getState().addToast('خطا در ارتباط با سرور', 'error');
    }
  };

  const handleLoanSettingsSave = async () => {
    try {
      const body: any = {};
      if (loanSettingsForm.ltvRatio) body.ltvRatio = parseFloat(loanSettingsForm.ltvRatio);
      if (loanSettingsForm.interestRate) body.interestRate = parseFloat(loanSettingsForm.interestRate);
      if (loanSettingsForm.minGold) body.minGold = parseFloat(loanSettingsForm.minGold);
      if (loanSettingsForm.maxDuration) body.maxDuration = parseInt(loanSettingsForm.maxDuration);
      if (loanSettingsForm.maxLoanAmount) body.maxLoanAmount = parseFloat(loanSettingsForm.maxLoanAmount);
      const res = await fetch('/api/admin/loans/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        useAppStore.getState().addToast('تنظیمات وام بروزرسانی شد', 'success');
        setLoanSettingsOpen(false);
        fetchLoanSettings();
      }
    } catch { /* ignore */ }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.phone.toLowerCase().includes(q) ||
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  // Mock transaction count per user
  const userTxCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    users.forEach((u) => {
      map[u.id] = Math.floor(Math.random() * 51);
    });
    return map;
  }, [users]);

  const handleExportCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['ID', 'نام', 'تلفن', 'ایمیل', 'نقش', 'وضعیت', 'تاریخ عضویت'];
    const rows = filteredUsers.map((u) => [
      u.id,
      u.fullName || 'بدون نام',
      u.phone,
      u.email || '-',
      u.role,
      u.isActive ? (u.isFrozen ? 'مسدود' : 'فعال') : 'غیرفعال',
      u.createdAt,
    ]);
    const csv = BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    useAppStore.getState().addToast('فایل CSV با موفقیت دانلود شد', 'success');
  };

  const filteredTx = txFilter === 'all' ? transactions : transactions.filter((t) => t.type === txFilter);

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <div className="text-center py-20">
        <Shield className="size-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold text-muted-foreground">دسترسی محدود</h2>
        <p className="text-sm text-muted-foreground mt-2">فقط مدیران به این بخش دسترسی دارند</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">پنل مدیریت</h1>
          <p className="text-sm text-muted-foreground">مدیریت کاربران، معاملات و تنظیمات سیستم</p>
        </div>
        <Badge className="bg-gold/20 text-gold text-sm">
          <Shield className="size-3 ml-1" /> ادمین
        </Badge>
      </div>

      {/* Quick Analysis Card */}
      <Card className="card-glass-premium border-gold/20">
        <CardContent className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold">
            <Zap className="size-4 text-gold" />
            تحلیل سریع
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">رشد کاربران</p>
              <p className="text-xl font-bold text-success-gradient">+۱۲.۵٪</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">تراکنشات امروز</p>
              <p className="text-xl font-bold text-gold-gradient">۱,۲۳۴</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">درخواست‌های KYC</p>
              <Badge className="badge-warning-amber text-lg font-bold px-3 py-1">۸</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-gold-border">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">کل کاربران</p>
                <p className="text-2xl font-bold text-gold-gradient">{users.length}</p>
              </div>
              <div className="size-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users className="size-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-gold-border">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">درخواست KYC</p>
                <p className="text-2xl font-bold text-gold-gradient">{kycRequests.filter(k => k.status === 'pending').length}</p>
              </div>
              <div className="size-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Shield className="size-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-gold-border">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">کل تراکنش‌ها</p>
                <p className="text-2xl font-bold text-gold-gradient">{transactions.length}</p>
              </div>
              <div className="size-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <ArrowUpDown className="size-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-gold-border">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">برداشت‌های معلق</p>
                <p className="text-2xl font-bold text-gold-gradient">{pendingWithdrawals.length}</p>
              </div>
              <div className="size-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <CreditCard className="size-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 w-full sm:w-auto grid grid-cols-4 sm:inline-flex overflow-x-auto">
          <TabsTrigger value="overview" className={cn("text-xs sm:text-sm", activeTab === "overview" && "tab-active-gold")}>نمای کلی</TabsTrigger>
          <TabsTrigger value="users" className={cn("text-xs sm:text-sm", activeTab === "users" && "tab-active-gold")}>کاربران</TabsTrigger>
          <TabsTrigger value="kyc" className={cn("text-xs sm:text-sm", activeTab === "kyc" && "tab-active-gold")}>KYC</TabsTrigger>
          <TabsTrigger value="transactions" className={cn("text-xs sm:text-sm", activeTab === "transactions" && "tab-active-gold")}>تراکنش‌ها</TabsTrigger>
          <TabsTrigger value="withdrawals" className={cn("text-xs sm:text-sm", activeTab === "withdrawals" && "tab-active-gold")}>برداشت‌ها</TabsTrigger>
          <TabsTrigger value="prices" className={cn("text-xs sm:text-sm", activeTab === "prices" && "tab-active-gold")}>قیمت‌ها</TabsTrigger>
          <TabsTrigger value="loans" className={cn("text-xs sm:text-sm", activeTab === "loans" && "tab-active-gold")}>وام‌ها</TabsTrigger>
          <TabsTrigger value="pagebuilder" className={cn("text-xs sm:text-sm", activeTab === "pagebuilder" && "tab-active-gold")}>سازنده صفحه</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="card-gold-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="size-4 text-gold" />
                  آخرین کاربران
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-64">
                  <div className="space-y-3">
                    {users.slice(0, 10).map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-gold/20 flex items-center justify-center text-xs font-bold text-gold">
                            {(u.fullName || u.phone).charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{u.fullName || 'بدون نام'}</p>
                            <p className="text-xs text-muted-foreground" dir="ltr">{u.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{u.role}</Badge>
                          {u.isVerified ? <CheckCircle className="size-3 text-emerald-500" /> : <Clock className="size-3 text-amber-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="card-gold-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="size-4 text-gold" />
                  آخرین تراکنش‌ها
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-64">
                  <div className="space-y-3">
                    {transactions.slice(0, 10).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{getTransactionTypeLabel(tx.type)}</p>
                          <p className="text-xs text-muted-foreground">{tx.user?.phone || '---'}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium">{formatToman(tx.amountFiat)}</p>
                          <p className="text-[10px] text-muted-foreground">{getTimeAgo(tx.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="card-gold-border">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-base">مدیریت کاربران</CardTitle>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="جستجوی کاربر..."
                      className="pr-9 input-gold-focus"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="border-gold/30 text-gold hover:bg-gold/10 shrink-0"
                  >
                    <Download className="size-4 ml-1" />
                    <span className="hidden sm:inline">خروجی CSV</span>
                    <span className="sm:hidden">CSV</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">
                نمایش {filteredUsers.length} از {users.length} کاربر
              </p>
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">کاربر</TableHead>
                      <TableHead className="text-xs">موبایل</TableHead>
                      <TableHead className="text-xs">نقش</TableHead>
                      <TableHead className="text-xs">وضعیت</TableHead>
                      <TableHead className="text-xs">تراکنش</TableHead>
                      <TableHead className="text-xs">تاریخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id} className="table-row-hover-gold">
                        <TableCell className="text-sm font-medium">{u.fullName || 'بدون نام'}</TableCell>
                        <TableCell className="text-xs" dir="ltr">{u.phone}</TableCell>
                        <TableCell><Badge variant="outline" className={cn("text-xs", u.role === 'admin' && "badge-gold")}>{u.role}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {u.isVerified ? <CheckCircle className="size-3 text-emerald-500" /> : <XCircle className="size-3 text-red-500" />}
                            {u.isFrozen ? <Badge className="badge-danger-red text-[10px]">مسدود</Badge> : <Badge className="badge-success-green text-[10px]">فعال</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-center tabular-nums">
                          <Badge variant="outline" className="text-gold border-gold/30">{userTxCounts[u.id] ?? 0}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{getTimeAgo(u.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KYC Tab */}
        <TabsContent value="kyc">
          <Card className="card-gold-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="size-4 text-gold" />
                درخواست‌های احراز هویت
                {kycRequests.filter(k => k.status === 'pending').length > 0 && (
                  <Badge className="bg-amber-500/20 text-amber-500">
                    {kycRequests.filter(k => k.status === 'pending').length} در انتظار
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3">
                  {kycRequests.length > 0 ? kycRequests.map((kyc) => (
                    <div key={kyc.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-gold/30 transition-colors card-glass-premium hover-lift-sm">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-gold/20 flex items-center justify-center">
                          <UserCheck className="size-5 text-gold" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{kyc.user?.fullName || 'بدون نام'}</p>
                          <p className="text-xs text-muted-foreground" dir="ltr">{kyc.user?.phone}</p>
                          <p className="text-[10px] text-muted-foreground">{getTimeAgo(kyc.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={kyc.status === 'pending' ? 'badge-warning-amber' : kyc.status === 'approved' ? 'badge-success-green' : 'badge-danger-red'}>
                          {kyc.status === 'pending' ? 'در انتظار' : kyc.status === 'approved' ? 'تأیید' : 'رد'}
                        </Badge>
                        {kyc.status === 'pending' && (
                          <Button size="sm" onClick={() => { setKycDetail(kyc); setKycDialogOpen(true); }} className="bg-gold text-white text-xs">
                            بررسی
                          </Button>
                        )}
                      </div>
                    </div>
                  )) : (
                    <p className="text-center text-muted-foreground py-8">درخواست KYC وجود ندارد</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* KYC Review Dialog */}
          <Dialog open={kycDialogOpen} onOpenChange={setKycDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>بررسی احراز هویت</DialogTitle>
              </DialogHeader>
              {kycDetail && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm"><strong>کاربر:</strong> {kycDetail.user?.fullName || 'بدون نام'}</p>
                    <p className="text-sm" dir="ltr"><strong>موبایل:</strong> {kycDetail.user?.phone}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="border rounded-lg p-3 text-center bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">کارت ملی</p>
                      <FileText className="size-6 mx-auto mt-1 text-gold" />
                    </div>
                    <div className="border rounded-lg p-3 text-center bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">سلفی</p>
                      <FileText className="size-6 mx-auto mt-1 text-gold" />
                    </div>
                    <div className="border rounded-lg p-3 text-center bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">کارت بانکی</p>
                      <FileText className="size-6 mx-auto mt-1 text-gold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>یادداشت ادمین</Label>
                    <Textarea value={kycNote} onChange={(e) => setKycNote(e.target.value)} placeholder="توضیحات..." rows={3} className="input-gold-focus" />
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1 btn-success" onClick={() => handleKYCAction(kycDetail.id, 'approved')}>
                      <CheckCircle className="size-4 ml-1" /> تأیید
                    </Button>
                    <Button className="flex-1 btn-danger-outline" onClick={() => handleKYCAction(kycDetail.id, 'rejected')}>
                      <XCircle className="size-4 ml-1" /> رد
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card className="card-gold-border">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-base">تراکنش‌های سیستم</CardTitle>
                <Select value={txFilter} onValueChange={setTxFilter}>
                  <SelectTrigger className="w-40 select-gold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="deposit">واریز</SelectItem>
                    <SelectItem value="withdrawal">برداشت</SelectItem>
                    <SelectItem value="buy_gold">خرید طلا</SelectItem>
                    <SelectItem value="sell_gold">فروش طلا</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">نوع</TableHead>
                      <TableHead className="text-xs">کاربر</TableHead>
                      <TableHead className="text-xs">مبلغ (واحد طلایی)</TableHead>
                      <TableHead className="text-xs">طلا (گرم)</TableHead>
                      <TableHead className="text-xs">وضعیت</TableHead>
                      <TableHead className="text-xs">تاریخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTx.map((tx) => (
                      <TableRow key={tx.id} className="table-row-hover-gold">
                        <TableCell className="text-xs">{getTransactionTypeLabel(tx.type)}</TableCell>
                        <TableCell className="text-xs">{tx.user?.fullName || tx.user?.phone || '---'}</TableCell>
                        <TableCell className="text-xs font-medium">{tx.amountFiat > 0 ? formatToman(tx.amountFiat) : '-'}</TableCell>
                        <TableCell className="text-xs">{tx.amountGold > 0 ? tx.amountGold.toFixed(4) : '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${
                            tx.status === 'success' ? 'text-emerald-500' :
                            tx.status === 'pending' ? 'text-amber-500' : 'text-red-500'
                          }`}>
                            {getTransactionStatusLabel(tx.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{getTimeAgo(tx.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals">
          <Card className="card-gold-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="size-4 text-gold" />
                درخواست‌های برداشت معلق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3">
                  {pendingWithdrawals.length > 0 ? pendingWithdrawals.map((w) => (
                    <div key={w.id} className="flex items-center justify-between p-3 rounded-lg border border-border card-glass-premium">
                      <div>
                        <p className="text-sm font-medium">{w.user?.fullName || 'بدون نام'}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">{w.user?.phone}</p>
                        <p className="text-lg font-bold text-gold-gradient mt-1">{formatToman(w.amountFiat)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="btn-success text-xs" onClick={() => handleWithdrawalAction(w.id, 'success')}>
                          <CheckCircle className="size-3 ml-1" /> تأیید
                        </Button>
                        <Button size="sm" className="btn-danger-outline text-xs" onClick={() => handleWithdrawalAction(w.id, 'failed')}>
                          <XCircle className="size-3 ml-1" /> رد
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center text-muted-foreground py-8">برداشت معلقی وجود ندارد</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prices Tab */}
        <TabsContent value="prices">
          <Card className="card-gold-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="size-4 text-gold" />
                مدیریت قیمت‌ها
              </CardTitle>
              <CardDescription>قیمت‌های خرید و فروش طلا را manually تنظیم کنید</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>قیمت خرید (واحد طلایی/گرم)</Label>
                  <Input
                    type="number"
                    value={priceForm.buyPrice}
                    onChange={(e) => setPriceForm({ ...priceForm, buyPrice: e.target.value })}
                    placeholder="35,000,000"
                    dir="ltr"
                    className="text-left input-gold-focus"
                  />
                </div>
                <div className="space-y-2">
                  <Label>قیمت فروش (واحد طلایی/گرم)</Label>
                  <Input
                    type="number"
                    value={priceForm.sellPrice}
                    onChange={(e) => setPriceForm({ ...priceForm, sellPrice: e.target.value })}
                    placeholder="34,800,000"
                    dir="ltr"
                    className="text-left input-gold-focus"
                  />
                </div>
                <div className="space-y-2">
                  <Label>قیمت بازار (واحد طلایی/گرم)</Label>
                  <Input
                    type="number"
                    value={priceForm.marketPrice}
                    onChange={(e) => setPriceForm({ ...priceForm, marketPrice: e.target.value })}
                    placeholder="34,900,000"
                    dir="ltr"
                    className="text-left input-gold-focus"
                  />
                </div>
              </div>
              <Button onClick={handlePriceUpdate} className="btn-gold-gradient">
                <Settings className="size-4 ml-2" />
                بروزرسانی قیمت‌ها
              </Button>

              <Separator />

              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium text-sm mb-2">نکات:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• قیمت‌ها به صورت خودکار هر ۶۰ ثانیه از منابع خارجی بروزرسانی می‌شوند</li>
                  <li>• تنظیم دستی تا بروزرسانی بعدی اعمال خواهد شد</li>
                  <li>• اسپرد پیشنهادی: ۰.۵٪ تا ۱٪ بین قیمت خرید و فروش</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Loans Tab */}
        <TabsContent value="loans">
          {/* Loan Settings Card */}
          <Card className="card-glass-premium border-gold/20 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <Settings className="size-4 text-gold" />
                  تنظیمات وام
                </h3>
                <Button size="sm" variant="outline" onClick={() => {
                  setLoanSettingsForm({
                    ltvRatio: String(loanSettings.ltvRatio),
                    interestRate: String(loanSettings.interestRate),
                    minGold: String(loanSettings.minGold),
                    maxDuration: String(loanSettings.maxDuration),
                    maxLoanAmount: String(loanSettings.maxLoanAmount),
                  });
                  setLoanSettingsOpen(true);
                }} className="border-gold/30 text-gold hover:bg-gold/10 text-xs">
                  <Settings className="size-3 ml-1" />
                  ویرایش
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground">نسبت LTV</p>
                  <p className="text-sm font-bold text-gold-gradient">{(loanSettings.ltvRatio * 100).toFixed(0)}٪</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground">نرخ بهره</p>
                  <p className="text-sm font-bold text-gold-gradient">{loanSettings.interestRate}٪</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground">حداقل طلا (گرم)</p>
                  <p className="text-sm font-bold text-gold-gradient">{loanSettings.minGold}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground">حداکثر مدت (روز)</p>
                  <p className="text-sm font-bold text-gold-gradient">{loanSettings.maxDuration}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50 col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-muted-foreground">سقف وام (گرم طلا)</p>
                  <p className="text-sm font-bold text-gold-gradient">{loanSettings.maxLoanAmount} گرم</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loan List */}
          <Card className="card-gold-border">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Banknote className="size-4 text-gold" />
                  مدیریت وام‌ها
                  {loans.filter(l => l.status === 'pending').length > 0 && (
                    <Badge className="bg-amber-500/20 text-amber-500">
                      {loans.filter(l => l.status === 'pending').length} در انتظار
                    </Badge>
                  )}
                </CardTitle>
                <Select value={loanStatusFilter} onValueChange={setLoanStatusFilter}>
                  <SelectTrigger className="w-40 select-gold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="pending">در انتظار</SelectItem>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="repaid">تسویه شده</SelectItem>
                    <SelectItem value="rejected">رد شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3">
                  {loans.length > 0 ? loans.map((loan: any) => (
                    <div key={loan.id} className="p-4 rounded-lg border border-border hover:border-gold/30 transition-colors card-glass-premium hover-lift-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-gold/20 flex items-center justify-center">
                            <Banknote className="size-5 text-gold" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{loan.user?.fullName || 'بدون نام'}</p>
                            <p className="text-xs text-muted-foreground" dir="ltr">{loan.user?.phone}</p>
                          </div>
                        </div>
                        <Badge className={
                          loan.status === 'active' ? 'badge-success-green' :
                          loan.status === 'pending' ? 'badge-warning-amber' :
                          loan.status === 'repaid' ? 'badge-gold' : 'badge-danger-red'
                        }>
                          {loan.status === 'pending' ? 'در انتظار' :
                           loan.status === 'active' ? 'فعال' :
                           loan.status === 'repaid' ? 'تسویه شده' : 'رد شده'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground">مبلغ درخواستی</p>
                          <p className="text-sm font-bold text-gold-gradient">{loan.amountRequested?.toFixed(4)} گرم طلا</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">مبلغ تأیید شده</p>
                          <p className="text-sm font-medium">{loan.amountApproved ? `${loan.amountApproved.toFixed(4)} گرم` : '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">وثیقه طلا (گرم)</p>
                          <p className="text-sm font-medium">{loan.goldCollateral?.toFixed(4)} گرم</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">نرخ بهره</p>
                          <p className="text-sm font-medium">{loan.interestRate}٪</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            <span>{getTimeAgo(loan.createdAt)}</span>
                          </div>
                          {loan.durationDays && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarDays className="size-3" />
                              <span>{loan.durationDays} روز</span>
                            </div>
                          )}
                        </div>
                        {loan.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" className="btn-success text-xs" onClick={() => {
                              setSelectedLoan(loan);
                              setApprovedAmount(String(loan.amountRequested));
                              setLoanNote('');
                              setLoanDialogOpen(true);
                            }}>
                              <CheckCircle className="size-3 ml-1" /> تأیید
                            </Button>
                            <Button size="sm" className="btn-danger-outline text-xs" onClick={() => {
                              setSelectedLoan(loan);
                              setLoanNote('');
                              setApprovedAmount('');
                              setLoanDialogOpen(true);
                            }}>
                              <XCircle className="size-3 ml-1" /> رد
                            </Button>
                          </div>
                        )}
                      </div>
                      {loan.status === 'active' && loan.repaidAmount !== undefined && loan.amountApproved > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">پرداخت شده</span>
                            <span className="font-medium text-gold">{loan.repaidAmount?.toFixed(4)} از {loan.amountApproved?.toFixed(4)} گرم</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-gradient-to-l from-gold to-amber-500 h-2 rounded-full progress-gold transition-all"
                              style={{ width: `${Math.min(100, (loan.repaidAmount / loan.amountApproved) * 100)}%` }}
                            />
                          </div>
                          {loan.dueDate && (
                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                              <CalendarDays className="size-3" />
                              سررسید: {formatDateTime(loan.dueDate)}
                            </p>
                          )}
                        </div>
                      )}
                      {loan.adminNote && (
                        <div className="mt-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground flex items-start gap-1">
                          <AlertCircle className="size-3 mt-0.5 shrink-0" />
                          <span>{loan.adminNote}</span>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <Banknote className="size-12 mx-auto text-muted-foreground/20 mb-3" />
                      <p className="text-muted-foreground">وامی یافت نشد</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Loan Review Dialog */}
          <Dialog open={loanDialogOpen} onOpenChange={setLoanDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Banknote className="size-5 text-gold" />
                  بررسی درخواست وام
                </DialogTitle>
              </DialogHeader>
              {selectedLoan && (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <p className="text-sm"><strong>کاربر:</strong> {selectedLoan.user?.fullName || 'بدون نام'}</p>
                    <p className="text-sm" dir="ltr"><strong>موبایل:</strong> {selectedLoan.user?.phone}</p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <p className="text-[10px] text-muted-foreground">مبلغ درخواستی</p>
                        <p className="text-sm font-bold text-gold-gradient">{selectedLoan.amountRequested?.toFixed(4)} گرم طلا</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">وثیقه طلا</p>
                        <p className="text-sm font-bold">{selectedLoan.goldCollateral} گرم</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">نرخ بهره</p>
                        <p className="text-sm font-bold">{selectedLoan.interestRate}٪</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">مدت</p>
                        <p className="text-sm font-bold">{selectedLoan.durationDays} روز</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>یادداشت ادمین</Label>
                    <Textarea value={loanNote} onChange={(e) => setLoanNote(e.target.value)} placeholder="توضیحات..." rows={3} className="input-gold-focus" />
                  </div>
                  <div className="space-y-2">
                    <Label>مبلغ تأیید شده (واحد طلایی)</Label>
                    <Input
                      type="number"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      placeholder={String(selectedLoan.amountRequested)}
                      dir="ltr"
                      className="text-left input-gold-focus"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1 btn-success" onClick={() => handleLoanAction(selectedLoan.id, 'approve')}>
                      <CheckCircle className="size-4 ml-1" /> تأیید وام
                    </Button>
                    <Button className="flex-1 btn-danger-outline" onClick={() => handleLoanAction(selectedLoan.id, 'reject')}>
                      <XCircle className="size-4 ml-1" /> رد درخواست
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Loan Settings Dialog */}
          <Dialog open={loanSettingsOpen} onOpenChange={setLoanSettingsOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="size-5 text-gold" />
                  تنظیمات وام
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-xs">
                      <Percent className="size-3" /> نسبت LTV
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={loanSettingsForm.ltvRatio}
                      onChange={(e) => setLoanSettingsForm({ ...loanSettingsForm, ltvRatio: e.target.value })}
                      placeholder="0.7"
                      dir="ltr"
                      className="text-left input-gold-focus"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-xs">
                      <Percent className="size-3" /> نرخ بهره (٪)
                    </Label>
                    <Input
                      type="number"
                      value={loanSettingsForm.interestRate}
                      onChange={(e) => setLoanSettingsForm({ ...loanSettingsForm, interestRate: e.target.value })}
                      placeholder="5"
                      dir="ltr"
                      className="text-left input-gold-focus"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-xs">
                      <Coins className="size-3" /> حداقل طلا (گرم)
                    </Label>
                    <Input
                      type="number"
                      value={loanSettingsForm.minGold}
                      onChange={(e) => setLoanSettingsForm({ ...loanSettingsForm, minGold: e.target.value })}
                      placeholder="1"
                      dir="ltr"
                      className="text-left input-gold-focus"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-xs">
                      <CalendarDays className="size-3" /> حداکثر مدت (روز)
                    </Label>
                    <Input
                      type="number"
                      value={loanSettingsForm.maxDuration}
                      onChange={(e) => setLoanSettingsForm({ ...loanSettingsForm, maxDuration: e.target.value })}
                      placeholder="365"
                      dir="ltr"
                      className="text-left input-gold-focus"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs">
                    <Coins className="size-3" /> سقف وام (گرم طلا)
                  </Label>
                  <Input
                    type="number"
                    value={loanSettingsForm.maxLoanAmount}
                    onChange={(e) => setLoanSettingsForm({ ...loanSettingsForm, maxLoanAmount: e.target.value })}
                    placeholder="500,000,000"
                    dir="ltr"
                    className="text-left input-gold-focus"
                  />
                </div>
                <Button onClick={handleLoanSettingsSave} className="w-full btn-gold-gradient">
                  <Settings className="size-4 ml-2" />
                  ذخیره تنظیمات
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Page Builder Tab */}
        <TabsContent value="pagebuilder">
          <Card className="card-gold-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <LayoutGrid className="size-4 text-gold" />
                سازنده صفحه (CMS)
              </CardTitle>
              <CardDescription>ساخت و مدیریت صفحات محتوایی سایت</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="size-16 rounded-full bg-gold/10 flex items-center justify-center">
                  <LayoutGrid className="size-8 text-gold" />
                </div>
                <h3 className="text-lg font-bold">سازنده صفحه</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  برای دسترسی به ابزار کامل ساخت صفحه، از منوی سمت چپ «سازنده صفحه» را انتخاب کنید یا روی دکمه زیر کلیک کنید.
                </p>
                <Button className="btn-gold-gradient" onClick={() => setPage('pagebuilder')}>
                  <ExternalLink className="size-4 ml-2" />
                  باز کردن سازنده صفحه
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

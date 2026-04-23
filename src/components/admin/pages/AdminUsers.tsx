'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { formatDateTime, getTimeAgo, toPersianDigits } from '@/lib/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Users, Search, Download, Filter, Eye, Lock, Unlock, Shield,
  UserCheck, UserX, Ban, CheckCircle, XCircle, Clock, Mail,
  Phone, Calendar, MoreVertical, ChevronLeft, ChevronRight,
  Wallet, Coins
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminUser {
  id: string; phone: string; email: string | null; fullName: string | null;
  isVerified: boolean; isActive: boolean; isFrozen: boolean; role: string; createdAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [actionRole, setActionRole] = useState('');
  const perPage = 15;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/users');
        if (res.ok && !cancelled) {
          const d = await res.json();
          setUsers(Array.isArray(d) ? d : d.users || []);
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.phone.includes(q) || (u.fullName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'frozen' && u.isFrozen) ||
      (statusFilter === 'active' && !u.isFrozen && u.isActive) ||
      (statusFilter === 'verified' && u.isVerified);
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleAction = async (userId: string, action: string) => {
    try {
      const body: any = { action };
      if (action === 'change_role') body.role = actionRole;
      const res = await fetch(`/api/admin/users/${userId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        useAppStore.getState().addToast('عملیات با موفقیت انجام شد', 'success');
        setActionOpen(null);
        // Re-fetch users
        (async () => {
          try {
            const res = await fetch('/api/admin/users');
            if (res.ok) { const d = await res.json(); setUsers(Array.isArray(d) ? d : d.users || []); }
          } catch { /* ignore */ }
        })();
      } else {
        const d = await res.json();
        useAppStore.getState().addToast(d.message || 'خطا در انجام عملیات', 'error');
      }
    } catch {
      useAppStore.getState().addToast('خطا در ارتباط با سرور', 'error');
    }
  };

  const handleExportCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['نام', 'تلفن', 'ایمیل', 'نقش', 'احراز هویت', 'وضعیت', 'تاریخ عضویت'];
    const rows = filtered.map(u => [
      u.fullName || 'بدون نام', u.phone, u.email || '-', u.role,
      u.isVerified ? 'تأیید شده' : 'تأیید نشده',
      u.isFrozen ? 'مسدود' : 'فعال', u.createdAt,
    ]);
    const csv = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    useAppStore.getState().addToast('فایل CSV دانلود شد', 'success');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">مدیریت کاربران</h2>
          <Badge className="bg-gold/15 text-gold text-xs">{filtered.length} کاربر</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="border-gold/20 text-gold hover:bg-gold/10">
          <Download className="size-4 ml-1.5" /> خروجی CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-gold">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="جستجوی نام، تلفن یا ایمیل..." className="pr-9" />
            </div>
            <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="نقش" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه نقش‌ها</SelectItem>
                <SelectItem value="user">کاربر عادی</SelectItem>
                <SelectItem value="admin">مدیر</SelectItem>
                <SelectItem value="super_admin">مدیر ارشد</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="وضعیت" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="frozen">مسدود</SelectItem>
                <SelectItem value="verified">احراز شده</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[520px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">کاربر</TableHead>
                  <TableHead className="text-xs">تلفن</TableHead>
                  <TableHead className="text-xs">نقش</TableHead>
                  <TableHead className="text-xs">وضعیت</TableHead>
                  <TableHead className="text-xs">تاریخ</TableHead>
                  <TableHead className="text-xs text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-10" /></TableCell></TableRow>
                )) : paginated.map(u => (
                  <TableRow key={u.id} className="hover:bg-gold/5 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-gold/15 flex items-center justify-center text-xs font-bold text-gold">
                          {(u.fullName || u.phone).charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{u.fullName || 'بدون نام'}</p>
                          <p className="text-[10px] text-muted-foreground">{u.email || '-'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs" dir="ltr">{u.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px]', u.role !== 'user' && 'border-gold/30 text-gold')}>
                        {u.role === 'super_admin' ? 'مدیر ارشد' : u.role === 'admin' ? 'مدیر' : 'کاربر'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {u.isVerified ? <CheckCircle className="size-3 text-emerald-500" /> : <XCircle className="size-3 text-muted-foreground" />}
                        {u.isFrozen
                          ? <Badge className="bg-red-500/15 text-red-500 text-[10px]">مسدود</Badge>
                          : <Badge className="bg-emerald-500/15 text-emerald-500 text-[10px]">فعال</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{getTimeAgo(u.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="ghost" className="size-7" onClick={() => { setDetailUser(u); setDetailOpen(true); }} title="مشاهده">
                          <Eye className="size-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className={cn('size-7', u.isFrozen ? 'text-emerald-500' : 'text-amber-500')}
                          onClick={() => handleAction(u.id, u.isFrozen ? 'unfreeze' : 'freeze')}
                          title={u.isFrozen ? 'باز کردن' : 'مسدود کردن'}>
                          {u.isFrozen ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && paginated.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">کاربری یافت نشد</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronRight className="size-4" /> قبلی
          </Button>
          <span className="text-sm text-muted-foreground">
            {toPersianDigits(String(page))} از {toPersianDigits(String(totalPages))}
          </span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            بعدی <ChevronLeft className="size-4" />
          </Button>
        </div>
      )}

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>اطلاعات کاربر</DialogTitle>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="size-12 rounded-full bg-gold/15 flex items-center justify-center text-lg font-bold text-gold">
                  {(detailUser.fullName || detailUser.phone).charAt(0)}
                </div>
                <div>
                  <p className="font-bold">{detailUser.fullName || 'بدون نام'}</p>
                  <p className="text-sm text-muted-foreground" dir="ltr">{detailUser.phone}</p>
                </div>
                <Badge variant="outline" className="mr-auto border-gold/30 text-gold text-xs">
                  {detailUser.role === 'super_admin' ? 'مدیر ارشد' : detailUser.role === 'admin' ? 'مدیر' : 'کاربر'}
                </Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" /><span>{detailUser.email || 'بدون ایمیل'}</span></div>
                <div className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /><span dir="ltr">{detailUser.phone}</span></div>
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-muted-foreground" />
                  <span>{detailUser.isVerified ? 'احراز شده' : 'احراز نشده'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {detailUser.isFrozen ? <Lock className="size-4 text-red-500" /> : <Unlock className="size-4 text-emerald-500" />}
                  <span>{detailUser.isFrozen ? 'مسدود' : 'فعال'}</span>
                </div>
                <div className="flex items-center gap-2 col-span-2"><Calendar className="size-4 text-muted-foreground" /><span>{formatDateTime(detailUser.createdAt)}</span></div>
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setDetailOpen(false); setActionOpen(detailUser.id); }}
                  className={detailUser.isFrozen ? 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10' : 'border-amber-500/30 text-amber-500 hover:bg-amber-500/10'}>
                  {detailUser.isFrozen ? <Unlock className="size-4 ml-1" /> : <Lock className="size-4 ml-1" />}
                  {detailUser.isFrozen ? 'باز کردن حساب' : 'مسدود کردن'}
                </Button>
                <Select value={actionRole || detailUser.role} onValueChange={v => setActionRole(v)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">کاربر عادی</SelectItem>
                    <SelectItem value="admin">مدیر</SelectItem>
                    <SelectItem value="super_admin">مدیر ارشد</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" disabled={actionRole === detailUser.role || !actionRole}
                  onClick={() => handleAction(detailUser.id, 'change_role')} className="bg-gold text-white">
                  تغییر نقش
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

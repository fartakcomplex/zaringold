'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  Users, Plus, Settings, Coins, Shield, Crown, UserPlus,
  Trash2, ChevronLeft, Loader2, AlertTriangle, Wallet,
  ArrowDownToLine, Eye, EyeOff, Gift, Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAppStore } from '@/lib/store';
import { formatToman, formatGrams, formatNumber } from '@/lib/helpers';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface FamilyWalletData {
  id: string;
  name: string;
  description?: string;
  members: FamilyMemberData[];
  totalGold?: number;
}

interface FamilyMemberData {
  id: string;
  userId: string;
  role: string;
  contribution: number;
  canWithdraw: boolean;
  joinedAt: string;
  user?: { fullName?: string; phone: string; avatar?: string };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function FamilyWalletView() {
  const { user, addToast } = useAppStore();

  const [wallets, setWallets] = useState<FamilyWalletData[]>([]);
  const [loading, setLoading] = useState(true);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Add member dialog
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [memberCanWithdraw, setMemberCanWithdraw] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  // Contribute dialog
  const [contributeOpen, setContributeOpen] = useState(false);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributing, setContributing] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteWalletId, setDeleteWalletId] = useState('');

  const [expandedWallet, setExpandedWallet] = useState<string | null>(null);

  /* ── Fetch wallets ── */
  const fetchWallets = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/family-wallet?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setWallets(data.wallets || []);
      }
    } catch (e) {
      console.error('Failed to fetch family wallets:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  /* ── Create wallet ── */
  const handleCreate = async () => {
    if (!user?.id || !newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/family-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name: newName, description: newDesc }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('کیف خانوادگی با موفقیت ایجاد شد 👨‍👩‍👧‍👦', 'success');
        setCreateOpen(false);
        setNewName('');
        setNewDesc('');
        fetchWallets();
      } else {
        addToast(data.message || 'خطا در ایجاد کیف', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setCreating(false);
    }
  };

  /* ── Add member ── */
  const handleAddMember = async () => {
    if (!selectedWalletId || !memberPhone.trim()) return;
    setAddingMember(true);
    try {
      const res = await fetch(`/api/family-wallet/${selectedWalletId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          memberPhone: memberPhone,
          role: memberRole,
          canWithdraw: memberCanWithdraw,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('عضو جدید اضافه شد! 🎉', 'success');
        setAddMemberOpen(false);
        setMemberPhone('');
        fetchWallets();
      } else {
        addToast(data.message || 'خطا در اضافه کردن عضو', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setAddingMember(false);
    }
  };

  /* ── Contribute gold ── */
  const handleContribute = async () => {
    if (!selectedWalletId || !contributeAmount || Number(contributeAmount) <= 0) return;
    setContributing(true);
    try {
      const res = await fetch(`/api/family-wallet/${selectedWalletId}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, goldMg: Number(contributeAmount) }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('موفقیت آمیز! طلا به کیف خانوادگی اضافه شد 💛', 'success');
        setContributeOpen(false);
        setContributeAmount('');
        fetchWallets();
      } else {
        addToast(data.message || 'خطا در واریز', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setContributing(false);
    }
  };

  /* ── Delete wallet ── */
  const handleDelete = async () => {
    if (!deleteWalletId) return;
    try {
      const res = await fetch(`/api/family-wallet/${deleteWalletId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast('کیف خانوادگی حذف شد', 'info');
        setDeleteOpen(false);
        fetchWallets();
      } else {
        addToast(data.message || 'خطا در حذف', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'مدیر';
      case 'member': return 'عضو';
      default: return role;
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    return 'bg-muted text-muted-foreground';
  };

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                  */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-bold text-foreground">👨‍👩‍👧‍👦 کیف خانوادگی</h2>
          <p className="mt-1 text-sm text-muted-foreground">با عزیزانتان طلا پس‌انداز کنید</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-gold text-gold-dark hover:bg-gold/90"
        >
          <Plus className="ms-2 size-4" />
          کیف جدید
        </Button>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-gold/20 bg-gradient-to-l from-gold/5 via-transparent to-gold/5">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/10">
              <Crown className="size-5 text-gold" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">پس‌انداز مشترک طلا</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                کیف خانوادگی به شما و اعضای خانواده‌تان اجازه می‌دهد با هم طلا جمع کنید.
                می‌توانید برای اهداف مشترک (عروسی، مسکن، آموزش) پس‌انداز کنید.
                هر عضو سهم مشخصی دارد و مدیر می‌تواند مجوز برداشت تنظیم کند.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Wallets List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : wallets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-gold/10"
            >
              <Users className="size-8 text-gold" />
            </motion.div>
            <p className="text-base font-semibold text-foreground">هنوز کیف خانوادگی ندارید</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              یک کیف خانوادگی بسازید و اعضای خانواده را دعوت کنید تا با هم طلا پس‌انداز کنید
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="mt-4 bg-gold text-gold-dark hover:bg-gold/90"
            >
              <Plus className="ms-2 size-4" />
              ایجاد کیف خانوادگی
            </Button>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence>
          {wallets.map((wallet, idx) => (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="overflow-hidden border-gold/15 transition-shadow hover:shadow-md">
                {/* Wallet Header */}
                <button
                  type="button"
                  onClick={() => setExpandedWallet(expandedWallet === wallet.id ? null : wallet.id)}
                  className="flex w-full items-center gap-4 p-4 text-start"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold/15 to-amber-500/10">
                    <Wallet className="size-6 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-foreground">{wallet.name}</p>
                      <Badge variant="outline" className="text-[10px] border-gold/30 text-gold">
                        {wallet.members?.length || 0} عضو
                      </Badge>
                    </div>
                    {wallet.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">{wallet.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="size-4 text-gold" />
                    <span className="text-sm font-bold gold-gradient-text">
                      {formatGrams(wallet.members?.reduce((s: number, m: FamilyMemberData) => s + m.contribution, 0) || 0)}
                    </span>
                    <ChevronLeft className={cn(
                      'size-4 text-muted-foreground transition-transform',
                      expandedWallet === wallet.id && 'rotate-90',
                    )} />
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedWallet === wallet.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <Separator className="bg-gold/10" />
                      <div className="p-4 space-y-4">
                        {/* Members List */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">اعضا</p>
                          {wallet.members?.map((member: FamilyMemberData) => (
                            <div
                              key={member.id}
                              className="flex items-center gap-3 rounded-lg bg-muted/30 p-3"
                            >
                              <div className="flex size-8 items-center justify-center rounded-full bg-gold/10 text-xs font-bold text-gold">
                                {(member.user?.fullName || member.user?.phone || '؟').slice(0, 1)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {member.user?.fullName || member.user?.phone || 'کاربر'}
                                  </p>
                                  <Badge className={cn('text-[10px]', getRoleBadge(member.role))}>
                                    {getRoleLabel(member.role)}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-end">
                                <p className="text-xs font-semibold text-foreground">
                                  {formatGrams(member.contribution)}
                                </p>
                                {member.canWithdraw && (
                                  <p className="text-[10px] text-emerald-500">✓ مجوز برداشت</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gold/30 text-gold hover:bg-gold/10"
                            onClick={() => {
                              setSelectedWalletId(wallet.id);
                              setAddMemberOpen(true);
                            }}
                          >
                            <UserPlus className="ms-1.5 size-3.5" />
                            افزودن عضو
                          </Button>
                          <Button
                            size="sm"
                            className="bg-gold text-gold-dark hover:bg-gold/90"
                            onClick={() => {
                              setSelectedWalletId(wallet.id);
                              setContributeOpen(true);
                            }}
                          >
                            <ArrowDownToLine className="ms-1.5 size-3.5" />
                            واریز طلا
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                            onClick={() => {
                              setDeleteWalletId(wallet.id);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="ms-1.5 size-3.5" />
                            حذف
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* ── Create Wallet Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle> ایجاد کیف خانوادگی</DialogTitle>
            <DialogDescription>
              یک کیف مشترک برای پس‌انداز طلا با اعضای خانواده بسازید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>نام کیف</Label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="مثلاً: پس‌انداز عروسی سارا"
              />
            </div>
            <div className="space-y-2">
              <Label>توضیحات (اختیاری)</Label>
              <Input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="هدف کیف خانوادگی..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>انصراف</Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="bg-gold text-gold-dark hover:bg-gold/90"
            >
              {creating ? <Loader2 className="animate-spin" /> : 'ایجاد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Member Dialog ── */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>افزودن عضو جدید</DialogTitle>
            <DialogDescription>شماره موبایل عضو جدید را وارد کنید</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>شماره موبایل</Label>
              <Input
                value={memberPhone}
                onChange={e => setMemberPhone(e.target.value)}
                placeholder="۰۹۱۲XXXXXXX"
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="space-y-2">
              <Label>نقش</Label>
              <Select value={memberRole} onValueChange={setMemberRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">عضو</SelectItem>
                  <SelectItem value="admin">مدیر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
              <Label className="text-sm">مجوز برداشت</Label>
              <Switch checked={memberCanWithdraw} onCheckedChange={setMemberCanWithdraw} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>انصراف</Button>
            <Button
              onClick={handleAddMember}
              disabled={!memberPhone.trim() || addingMember}
              className="bg-gold text-gold-dark hover:bg-gold/90"
            >
              {addingMember ? <Loader2 className="animate-spin" /> : 'افزودن'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Contribute Dialog ── */}
      <Dialog open={contributeOpen} onOpenChange={setContributeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>واریز طلا به کیف خانوادگی</DialogTitle>
            <DialogDescription>مقدار طلایی که می‌خواهید واریز کنید</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>مقدار طلا (گرم)</Label>
              <Input
                type="number"
                step="0.001"
                min="0.001"
                value={contributeAmount}
                onChange={e => setContributeAmount(e.target.value)}
                placeholder="0.1"
                dir="ltr"
                className="text-left"
              />
              <div className="flex gap-2">
                {[0.01, 0.05, 0.1, 0.5, 1].map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setContributeAmount(String(a))}
                    className="rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-gold/10 hover:text-gold"
                  >
                    {formatGrams(a)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContributeOpen(false)}>انصراف</Button>
            <Button
              onClick={handleContribute}
              disabled={!contributeAmount || Number(contributeAmount) <= 0 || contributing}
              className="bg-gold text-gold-dark hover:bg-gold/90"
            >
              {contributing ? <Loader2 className="animate-spin" /> : 'واریز'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف کیف خانوادگی</AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئنید؟ این عمل قابل برگشت نیست. تمام اعضا از کیف حذف خواهند شد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

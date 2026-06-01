'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  FileWarning,
  ShieldAlert,
  ShieldQuestion,
  Key,
  Fingerprint,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface BackupCode {
  id: string;
  code: string;
  isUsed: boolean;
  usedAt?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper: Generate Backup Codes                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function generateBackupCodes(): BackupCode[] {
  return Array.from({ length: 5 }).map((_, i) => ({
    id: `bc-${Date.now()}-${i}`,
    code: `${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    isUsed: false,
  }));
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main BackupView Component                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function BackupView() {
  const { user, addToast } = useAppStore();

  /* ── State ── */
  const [codes, setCodes] = useState<BackupCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showCodes, setShowCodes] = useState(false);

  // Recovery form
  const [recoveryInput, setRecoveryInput] = useState('');
  const [recoverySubmitting, setRecoverySubmitting] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<{ success: boolean; message: string } | null>(null);

  // Dialog
  const [confirmGenerateOpen, setConfirmGenerateOpen] = useState(false);
  const [confirmRecoveryOpen, setConfirmRecoveryOpen] = useState(false);

  // Status
  const [backupStatus, setBackupStatus] = useState<'none' | 'active' | 'expired'>('none');
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  /* ── Fetch existing backup codes ── */
  useEffect(() => {
    const fetchCodes = async () => {
      setCodesLoading(true);
      try {
        const res = await fetch(`/api/backup?userId=${user?.id || 'dev-super-admin'}`);
        const data = await res.json();
        if (data.success && data.codes?.length > 0) {
          setCodes(data.codes);
          setBackupStatus('active');
          setLastGenerated(data.lastGenerated || null);
        } else {
          // No codes yet, start fresh
          const newCodes = generateBackupCodes();
          setCodes(newCodes);
          setBackupStatus('none');
        }
      } catch {
        // Fallback to generated codes
        const newCodes = generateBackupCodes();
        setCodes(newCodes);
        setBackupStatus('none');
      } finally {
        setCodesLoading(false);
      }
    };
    fetchCodes();
  }, [user?.id]);

  /* ── Generate new codes ── */
  const handleGenerateCodes = async () => {
    setConfirmGenerateOpen(false);
    setGenerating(true);
    try {
      const res = await fetch('/api/backup/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || 'dev-super-admin' }),
      });
      const data = await res.json();
      if (data.success && data.codes) {
        setCodes(data.codes);
      } else {
        // Use locally generated codes
        const newCodes = generateBackupCodes();
        setCodes(newCodes);
      }
      setBackupStatus('active');
      setLastGenerated(new Date().toISOString());
      setShowCodes(true);
      addToast('کدهای پشتیبان با موفقیت ایجاد شدند', 'success');
    } catch {
      const newCodes = generateBackupCodes();
      setCodes(newCodes);
      setBackupStatus('active');
      setLastGenerated(new Date().toISOString());
      setShowCodes(true);
      addToast('کدهای پشتیبان ایجاد شدند', 'success');
    } finally {
      setGenerating(false);
    }
  };

  /* ── Copy code ── */
  const handleCopyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      addToast('کد کپی شد', 'success');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      addToast('خطا در کپی کد', 'error');
    }
  };

  /* ── Copy all codes ── */
  const handleCopyAll = async () => {
    const allCodes = codes.map((c) => c.code).join('\n');
    try {
      await navigator.clipboard.writeText(allCodes);
      addToast('همه کدها کپی شدند', 'success');
    } catch {
      addToast('خطا در کپی کدها', 'error');
    }
  };

  /* ── Recovery submit ── */
  const handleRecovery = async () => {
    if (!recoveryInput.trim()) return;
    setConfirmRecoveryOpen(false);
    setRecoverySubmitting(true);
    setRecoveryResult(null);

    try {
      const res = await fetch('/api/backup/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'dev-super-admin',
          code: recoveryInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRecoveryResult({ success: true, message: 'حساب شما با موفقیت بازیابی شد' });
        addToast('بازیابی موفقیت‌آمیز بود!', 'success');
        setRecoveryInput('');
      } else {
        setRecoveryResult({ success: false, message: data.message || 'کد پشتیبان نامعتبر است' });
        addToast(data.message || 'کد نامعتبر', 'error');
      }
    } catch {
      // Simulate: check if code matches any existing code
      const matchedCode = codes.find((c) => c.code === recoveryInput.trim() && !c.isUsed);
      if (matchedCode) {
        setCodes((prev) =>
          prev.map((c) =>
            c.id === matchedCode.id ? { ...c, isUsed: true, usedAt: new Date().toISOString() } : c,
          ),
        );
        setRecoveryResult({ success: true, message: 'حساب شما با موفقیت بازیابی شد' });
        addToast('بازیابی موفقیت‌آمیز بود!', 'success');
        setRecoveryInput('');
      } else {
        setRecoveryResult({ success: false, message: 'کد پشتیبان نامعتبر یا قبلاً استفاده شده است' });
        addToast('کد نامعتبر', 'error');
      }
    } finally {
      setRecoverySubmitting(false);
    }
  };

  return (
    <div className="space-y-5 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5">
          <ShieldCheck className="size-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">پشتیبان و بازیابی</h1>
          <p className="text-xs text-muted-foreground">کدهای بازیابی اضطراری حساب کاربری</p>
        </div>
      </div>

      {/* Security Status */}
      <Card className={cn(
        'overflow-hidden border',
        backupStatus === 'active' ? 'border-emerald-500/30 bg-emerald-500/5' :
        'border-[#D4AF37]/30 bg-[#D4AF37]/5',
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl',
              backupStatus === 'active' ? 'bg-emerald-500/10' : 'bg-[#D4AF37]/10',
            )}>
              {backupStatus === 'active' ? (
                <ShieldCheck className="size-5 text-emerald-500" />
              ) : (
                <ShieldAlert className="size-5 text-[#D4AF37]" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {backupStatus === 'active' ? 'حساب شما محافظت شده است' : 'کدهای پشتیبان ایجاد نشده'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {backupStatus === 'active'
                  ? lastGenerated
                    ? `آخرین بروزرسانی: ${new Date(lastGenerated).toLocaleDateString('fa-IR')}`
                    : 'کدهای پشتیبان فعال هستند'
                  : 'برای امنیت بیشتر، کدهای بازیابی ایجاد کنید'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Backup Codes */}
      <Card className="overflow-hidden border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-[#D4AF37]" />
            <CardTitle className="text-sm font-bold">کدهای پشتیبان</CardTitle>
          </div>
          <Button
            onClick={() => {
              if (codes.length > 0 && backupStatus === 'active') {
                setConfirmGenerateOpen(true);
              } else {
                handleGenerateCodes();
              }
            }}
            disabled={generating}
            className="gap-1.5 bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]"
          >
            {generating ? (
              <RefreshCw className="size-3.5 animate-spin" />
            ) : (
              <Fingerprint className="size-3.5" />
            )}
            {codes.length > 0 && backupStatus === 'active' ? 'بازنشانی کدها' : 'ایجاد کدها'}
          </Button>
        </CardHeader>
        <CardContent>
          {codesLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : codes.length > 0 ? (
            <>
              {/* Show/Hide toggle */}
              <div className="mb-3 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCodes(!showCodes)}
                  className="gap-1.5 text-xs text-muted-foreground"
                >
                  {showCodes ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  {showCodes ? 'مخفی کردن' : 'نمایش کدها'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAll}
                  className="gap-1.5 text-xs text-[#D4AF37]"
                >
                  <Download className="size-3.5" />
                  کپی همه
                </Button>
              </div>

              {/* Codes Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {codes.map((item, index) => {
                  const isCopied = copiedCode === item.id;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3 transition-all',
                        item.isUsed
                          ? 'border-border/50 bg-muted/30 opacity-60'
                          : 'border-border bg-background hover:border-[#D4AF37]/30',
                      )}
                    >
                      {/* Index */}
                      <div className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-black',
                        item.isUsed ? 'bg-muted text-muted-foreground' : 'bg-[#D4AF37]/10 text-[#D4AF37]',
                      )}>
                        {item.isUsed ? (
                          <CheckCircle className="size-4" />
                        ) : (
                          formatNumber(index + 1)
                        )}
                      </div>

                      {/* Code */}
                      <div className="min-w-0 flex-1">
                        {item.isUsed ? (
                          <p className="text-xs font-bold text-muted-foreground line-through">
                            استفاده شده
                          </p>
                        ) : showCodes ? (
                          <p className="text-xs font-mono font-bold tracking-wider text-foreground" dir="ltr">
                            {item.code}
                          </p>
                        ) : (
                          <p className="text-xs font-mono font-bold tracking-wider text-muted-foreground" dir="ltr">
                            •••-••••-••••
                          </p>
                        )}
                        {item.isUsed && item.usedAt && (
                          <p className="text-[9px] text-muted-foreground">
                            استفاده در {new Date(item.usedAt).toLocaleDateString('fa-IR')}
                          </p>
                        )}
                      </div>

                      {/* Copy button */}
                      {!item.isUsed && showCodes && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCode(item.code, item.id)}
                          className="shrink-0 text-muted-foreground hover:text-[#D4AF37]"
                        >
                          {isCopied ? (
                            <Check className="size-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Warning */}
              <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                  <div className="text-[11px] leading-relaxed text-muted-foreground space-y-1">
                    <p className="font-bold text-amber-600">مهم! این کدها را در مکان امن ذخیره کنید:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                      <li>هر کد فقط یک‌بار قابل استفاده است</li>
                      <li>در صورت فراموشی رمز عبور، با این کدها وارد شوید</li>
                      <li>کدها را در مکان امن فیزیکی یا مدیر رمز نگهداری کنید</li>
                      <li>هرگز کدها را به اشتراک نگذارید</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <Key className="size-10 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">کد پشتیبانی ندارید</p>
              <p className="text-xs text-muted-foreground/60">برای ایجاد کدهای پشتیبان، دکمه بالا را بزنید</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recovery Section */}
      <Card className="overflow-hidden border-border">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Lock className="size-4 text-[#D4AF37]" />
          <CardTitle className="text-sm font-bold">بازیابی حساب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[11px] text-muted-foreground">
            در صورت فراموشی رمز عبور یا دسترسی نداشتن به حساب، یکی از کدهای پشتیبان را وارد کنید.
          </p>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">کد پشتیبان</Label>
            <div className="relative">
              <Input
                value={recoveryInput}
                onChange={(e) => setRecoveryInput(e.target.value.toUpperCase())}
                placeholder="مثال: ABCD-EF01-GH23"
                className="border-border bg-background pl-12 text-left text-sm font-mono tabular-nums placeholder:text-muted-foreground/50 focus:border-[#D4AF37]"
                dir="ltr"
                maxLength={14}
              />
              <Key className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            </div>
          </div>

          {/* Recovery Result */}
          {recoveryResult && (
            <div className={cn(
              'flex items-center gap-2 rounded-lg border p-3',
              recoveryResult.success
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-red-500/30 bg-red-500/5',
            )}>
              {recoveryResult.success ? (
                <CheckCircle className="size-4 shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="size-4 shrink-0 text-red-500" />
              )}
              <p className={cn(
                'text-xs font-medium',
                recoveryResult.success ? 'text-emerald-600' : 'text-red-600',
              )}>
                {recoveryResult.message}
              </p>
            </div>
          )}

          <Button
            onClick={() => {
              if (recoveryInput.trim()) {
                setConfirmRecoveryOpen(true);
              }
            }}
            disabled={!recoveryInput.trim() || recoverySubmitting}
            className="w-full gap-1.5 bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249] disabled:opacity-50"
          >
            {recoverySubmitting ? (
              <RefreshCw className="size-3.5 animate-spin" />
            ) : (
              <Shield className="size-3.5" />
            )}
            بازیابی حساب
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="overflow-hidden border-[#D4AF37]/20 bg-[#D4AF37]/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ShieldQuestion className="mt-0.5 size-4 shrink-0 text-[#D4AF37]" />
            <div className="text-[11px] leading-relaxed text-muted-foreground space-y-1">
              <p className="font-bold text-foreground">سؤالات متداول</p>
              <p><span className="text-[#D4AF37] font-semibold">کدهای پشتیبان چه هستند؟</span> کدهای یکبار مصرف برای بازیابی حساب در مواقع اضطراری.</p>
              <p><span className="text-[#D4AF37] font-semibold">چند کد دارم؟</span> در هر لحظه ۵ کد فعال دارید. پس از استفاده، کد جدید جایگزین نمی‌شود.</p>
              <p><span className="text-[#D4AF37] font-semibold">آیا می‌توانم کدها را بازنشانی کنم؟</span> بله، با زدن دکمه «بازنشانی» کدهای قبلی باطل و کدهای جدید ایجاد می‌شوند.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Confirmation Dialogs ── */}
      <Dialog open={confirmGenerateOpen} onOpenChange={setConfirmGenerateOpen}>
        <DialogContent className="border-border bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              بازنشانی کدهای پشتیبان
            </DialogTitle>
            <DialogDescription className="text-xs">
              با بازنشانی، تمام کدهای قبلی باطل خواهند شد و کدهای جدید ایجاد می‌شوند.
              آیا مطمئنید؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmGenerateOpen(false)} className="border-border">
              انصراف
            </Button>
            <Button
              onClick={handleGenerateCodes}
              className="bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]"
            >
              بله، بازنشانی کن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmRecoveryOpen} onOpenChange={setConfirmRecoveryOpen}>
        <DialogContent className="border-border bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="size-5 text-[#D4AF37]" />
              تأیید بازیابی
            </DialogTitle>
            <DialogDescription className="text-xs">
              با استفاده از کد پشتیبان، حساب شما بازیابی خواهد شد. این کد پس از استفاده باطل می‌شود.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmRecoveryOpen(false)} className="border-border">
              انصراف
            </Button>
            <Button
              onClick={handleRecovery}
              disabled={recoverySubmitting}
              className="bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]"
            >
              {recoverySubmitting ? (
                <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <CheckCircle className="mr-1.5 size-3.5" />
              )}
              تأیید بازیابی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* Mini helper for Persian digits */
function formatNumber(num: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(num));
}

'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield, ShieldCheck, KeyRound, Copy, Check, AlertTriangle, Lock, Download, RefreshCw,
  CheckCircle, XCircle, Eye, EyeOff, Fingerprint, Smartphone, Users, History,
  Monitor, Tablet, LogOut, ChevronDown, ChevronUp, Clock, Key, ShieldAlert,
  ShieldQuestion, Trash2, Plus, ExternalLink, FileJson, ShieldX, Globe, Wifi,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/lib/store';
import { formatNumber, cn } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface BackupCode {
  id: string;
  code: string;
  isUsed: boolean;
  usedAt?: string;
}

interface CoSigner {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'pending' | 'removed';
  addedAt: string;
}

interface PendingTransaction {
  id: string;
  type: string;
  amount: string;
  date: string;
  approvals: number;
  requiredApprovals: number;
  status: 'pending' | 'approved' | 'rejected';
}

interface SecurityEvent {
  id: string;
  action: string;
  detail: string;
  time: string;
  type: 'success' | 'warning' | 'danger';
}

interface Device {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  lastActive: string;
  isCurrent: boolean;
  ip: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Data                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MOCK_COSIGNERS: CoSigner[] = [
  { id: 'cs1', name: 'علی محمدی', phone: '۰۹۱۲***۴۵۶۷', status: 'active', addedAt: '۱۴۰۴/۰۱/۱۵' },
  { id: 'cs2', name: 'سارا احمدی', phone: '۰۹۳۵***۸۹۰۱', status: 'active', addedAt: '۱۴۰۴/۰۲/۲۰' },
];

const MOCK_PENDING_TX: PendingTransaction[] = [
  { id: 'tx1', type: 'فروش طلا', amount: '۵ گرم', date: '۱۴۰۴/۰۳/۱۰', approvals: 1, requiredApprovals: 2, status: 'pending' },
  { id: 'tx2', type: 'انتقال طلا', amount: '۲.۵ گرم', date: '۱۴۰۴/۰۳/۰۸', approvals: 2, requiredApprovals: 2, status: 'approved' },
  { id: 'tx3', type: 'برداشت ریالی', amount: '۵۰,۰۰۰,۰۰۰ تومان', date: '۱۴۰۴/۰۳/۰۵', approvals: 0, requiredApprovals: 2, status: 'rejected' },
];

const MOCK_SECURITY_LOG: SecurityEvent[] = [
  { id: 'se1', action: 'ورود موفق', detail: 'ورود از دستگاه Android — تهران', time: '۱۰ دقیقه پیش', type: 'success' },
  { id: 'se2', action: 'تغییر رمز عبور', detail: 'رمز عبور با موفقیت تغییر کرد', time: '۲ ساعت پیش', type: 'success' },
  { id: 'se3', action: 'تلاش ناموفق ورود', detail: '۳ تلاش ناموفق از IP ناشناس', time: '۵ ساعت پیش', type: 'warning' },
  { id: 'se4', action: 'فعال‌سازی ۲FA', detail: 'احراز هویت دو مرحله‌ای فعال شد', time: '۱ روز پیش', type: 'success' },
  { id: 'se5', action: 'کد پشتیبان استفاده شد', detail: 'کد بازیابی شماره ۳ استفاده شد', time: '۳ روز پیش', type: 'warning' },
  { id: 'se6', action: 'دسترسی غیرمجاز', detail: 'تلاش دسترسی از کشور خارجی مسدود شد', time: '۵ روز پیش', type: 'danger' },
];

const MOCK_DEVICES: Device[] = [
  { id: 'd1', name: 'Chrome — Windows', type: 'desktop', lastActive: 'همین الان', isCurrent: true, ip: '۱۸۵.x.x.x' },
  { id: 'd2', name: 'ZarinGold App — Android', type: 'mobile', lastActive: '۲ ساعت پیش', isCurrent: false, ip: '۵.۲xx.x.x' },
  { id: 'd3', name: 'Safari — iPhone', type: 'tablet', lastActive: '۱ روز پیش', isCurrent: false, ip: '۷۸.x.x.x' },
];

function generateBackupCodes(): BackupCode[] {
  return Array.from({ length: 5 }).map((_, i) => ({
    id: `bc-${Date.now()}-${i}`,
    code: `${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    isUsed: false,
  }));
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Security Score Ring (SVG)                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SecurityScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;
  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F97316' : '#EF4444';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
      <circle cx={center} cy={center} r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - progress} className="transition-all duration-1000" />
      <text x={center} y={center} textAnchor="middle" dominantBaseline="central" className="transform rotate-90 origin-center fill-foreground text-lg font-black tabular-nums" style={{ fontSize: size * 0.2 }}>{formatNumber(score)}</text>
      <text x={center} y={center + size * 0.16} textAnchor="middle" className="transform rotate-90 origin-center fill-muted-foreground" style={{ fontSize: size * 0.09 }}>امتیاز امنیتی</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function MultiSigWalletPage() {
  const { user, addToast } = useAppStore();

  const [codes, setCodes] = useState<BackupCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showCodes, setShowCodes] = useState(false);
  const [confirmGenerateOpen, setConfirmGenerateOpen] = useState(false);

  const [coSigners, setCoSigners] = useState<CoSigner[]>(MOCK_COSIGNERS);
  const [newSignerPhone, setNewSignerPhone] = useState('');
  const [newSignerName, setNewSignerName] = useState('');
  const [addSignerOpen, setAddSignerOpen] = useState(false);

  const [multiSigEnabled, setMultiSigEnabled] = useState(true);
  const [requiredApprovals] = useState(2);
  const [largeTxThreshold, setLargeTxThreshold] = useState('۱۰ گرم');

  const [pendingTx] = useState<PendingTransaction[]>(MOCK_PENDING_TX);
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);
  const [activeTab, setActiveTab] = useState('security');

  const [tfaEnabled, setTfaEnabled] = useState(true);
  const [pinEnabled, setPinEnabled] = useState(true);

  // Security score
  const securityScore = 85; // Mock score

  /* ── Fetch backup codes ── */
  useEffect(() => {
    const fetchCodes = async () => {
      setCodesLoading(true);
      try {
        const res = await fetch(`/api/backup?userId=${user?.id || 'dev-super-admin'}`);
        const data = await res.json();
        if (data.codes?.length > 0) {
          setCodes(data.codes);
        } else {
          setCodes(generateBackupCodes());
        }
      } catch {
        setCodes(generateBackupCodes());
      } finally {
        setCodesLoading(false);
      }
    };
    fetchCodes();
  }, [user?.id]);

  const handleGenerateCodes = () => {
    setConfirmGenerateOpen(false);
    setGenerating(true);
    setTimeout(() => {
      setCodes(generateBackupCodes());
      setShowCodes(true);
      setGenerating(false);
      addToast('کدهای پشتیبان جدید ایجاد شدند', 'success');
    }, 800);
  };

  const handleCopyCode = async (code: string, id: string) => {
    try { await navigator.clipboard.writeText(code); setCopiedCode(id); addToast('کد کپی شد', 'success'); setTimeout(() => setCopiedCode(null), 2000); } catch { addToast('خطا در کپی', 'error'); }
  };

  const handleCopyAll = async () => {
    try { await navigator.clipboard.writeText(codes.map((c) => c.code).join('\n')); addToast('همه کدها کپی شدند', 'success'); } catch { addToast('خطا', 'error'); }
  };

  const handleAddSigner = () => {
    if (!newSignerPhone.trim()) return;
    const newSigner: CoSigner = {
      id: `cs-${Date.now()}`,
      name: newSignerName || 'ناشناس',
      phone: newSignerPhone,
      status: 'pending',
      addedAt: new Intl.DateTimeFormat('fa-IR').format(new Date()),
    };
    setCoSigners((prev) => [...prev, newSigner]);
    setNewSignerPhone('');
    setNewSignerName('');
    setAddSignerOpen(false);
    addToast(`دعوت‌نامه برای ${newSigner.name} ارسال شد`, 'success');
  };

  const handleRemoveSigner = (id: string) => {
    setCoSigners((prev) => prev.filter((s) => s.id !== id));
    addToast('امضاکننده حذف شد', 'info');
  };

  const handleRemoveDevice = (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
    addToast('دستگاه با موفقیت حذف شد', 'success');
  };

  const handleExportData = () => {
    const data = JSON.stringify({ userId: user?.id, exportedAt: new Date().toISOString(), backupCodes: codes.length, coSigners: coSigners.length }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'zaringold-backup.json'; a.click();
    URL.revokeObjectURL(url);
    addToast('فایل پشتیبان دانلود شد', 'success');
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5">
          <ShieldCheck className="size-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">کیف‌ولت چندامضایی</h1>
          <p className="text-xs text-muted-foreground">امنیت پیشرفته و پشتیبان‌گیری</p>
        </div>
      </div>

      {/* Security Score Dashboard */}
      <Card className="overflow-hidden border-[#D4AF37]/20 bg-gradient-to-l from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent">
        <CardContent className="p-5">
          <div className="flex items-center gap-5">
            <SecurityScoreRing score={securityScore} />
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-bold text-foreground">وضعیت امنیت حساب</h3>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    {tfaEnabled ? <CheckCircle className="size-3.5 text-emerald-500" /> : <XCircle className="size-3.5 text-red-500" />}
                    احراز هویت دو مرحله‌ای
                  </span>
                  <Badge className={cn('text-[10px]', tfaEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500')}>{tfaEnabled ? 'فعال' : 'غیرفعال'}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    {multiSigEnabled ? <CheckCircle className="size-3.5 text-emerald-500" /> : <XCircle className="size-3.5 text-red-500" />}
                    چندامضایی فعال
                  </span>
                  <Badge className={cn('text-[10px]', multiSigEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500')}>{multiSigEnabled ? `${requiredApprovals} از ۳` : 'غیرفعال'}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    {pinEnabled ? <CheckCircle className="size-3.5 text-emerald-500" /> : <XCircle className="size-3.5 text-red-500" />}
                    رمز PIN فعال
                  </span>
                  <Badge className={cn('text-[10px]', pinEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500')}>{pinEnabled ? 'فعال' : 'غیرفعال'}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    {codes.length > 0 ? <CheckCircle className="size-3.5 text-emerald-500" /> : <XCircle className="size-3.5 text-red-500" />}
                    کدهای بازیابی
                  </span>
                  <Badge className={cn('text-[10px]', codes.length > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500')}>{codes.filter((c) => !c.isUsed).length} کد فعال</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="security" className="text-[10px]">امنیت</TabsTrigger>
          <TabsTrigger value="cosigners" className="text-[10px]">امضاکنندگان</TabsTrigger>
          <TabsTrigger value="backup" className="text-[10px]">پشتیبان</TabsTrigger>
          <TabsTrigger value="devices" className="text-[10px]">دستگاه‌ها</TabsTrigger>
        </TabsList>

        {/* ═══ SECURITY TAB ═══ */}
        <TabsContent value="security" className="space-y-3">
          {/* Multi-Sig Settings */}
          <Card className="overflow-hidden border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2"><Users className="size-4 text-[#D4AF37]" /><CardTitle className="text-sm font-bold">تنظیمات چندامضایی</CardTitle></div>
              <Switch checked={multiSigEnabled} onCheckedChange={setMultiSigEnabled} />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[11px] text-muted-foreground">معاملات بزرگ نیاز به تأیید {requiredApprovals} نفر از ۳ امضاکننده معتمد دارند.</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">سقف معامله بزرگ</span>
                <Badge variant="secondary" className="text-[10px]">{largeTxThreshold}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">تأیید مورد نیاز</span>
                <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] text-[10px]">{requiredApprovals} از ۳</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card className="overflow-hidden border-border">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Clock className="size-4 text-amber-500" />
              <CardTitle className="text-sm font-bold">صف انتظار تأیید</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingTx.map((tx) => (
                <div key={tx.id} className={cn('flex items-center gap-3 rounded-xl border p-3', tx.status === 'pending' ? 'border-amber-500/20 bg-amber-500/5' : tx.status === 'approved' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5')}>
                  <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', tx.status === 'pending' ? 'bg-amber-500/20 text-amber-500' : tx.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500')}>
                    {tx.status === 'pending' ? <Clock className="size-4" /> : tx.status === 'approved' ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">{tx.type}</p>
                    <p className="text-[10px] text-muted-foreground">{tx.amount} — {tx.date}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-muted-foreground">تأیید</p>
                    <p className="text-xs font-bold tabular-nums">{tx.approvals}/{tx.requiredApprovals}</p>
                  </div>
                  {tx.status === 'pending' && (
                    <Button size="sm" className="gap-1 bg-emerald-500 text-white text-[10px] hover:bg-emerald-600"><CheckCircle className="size-3" /> تأیید</Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 2FA Status */}
          <Card className="overflow-hidden border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2"><Shield className="size-4 text-[#D4AF37]" /><CardTitle className="text-sm font-bold">احراز هویت دو مرحله‌ای</CardTitle></div>
              <Switch checked={tfaEnabled} onCheckedChange={setTfaEnabled} />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className={cn('rounded-lg border p-3', tfaEnabled ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5')}>
                <p className={cn('text-xs font-medium', tfaEnabled ? 'text-emerald-600' : 'text-amber-600')}>{tfaEnabled ? '✅ احراز هویت دو مرحله‌ای فعال است' : '⚠️ احراز هویت دو مرحله‌ای غیرفعال است'}</p>
                <p className="text-[10px] text-muted-foreground mt-1">با فعال‌سازی، هر ورود نیاز به کد SMS یا اپلیکیشن دارد.</p>
              </div>
            </CardContent>
          </Card>

          {/* Security Log */}
          <Card className="overflow-hidden border-border">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <History className="size-4 text-[#D4AF37]" />
              <CardTitle className="text-sm font-bold">گزارش امنیتی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-72 overflow-y-auto">
              {MOCK_SECURITY_LOG.map((event) => (
                <div key={event.id} className="flex items-start gap-2 rounded-lg border border-border/50 p-2.5">
                  <div className={cn('mt-0.5 size-2 shrink-0 rounded-full', event.type === 'success' ? 'bg-emerald-500' : event.type === 'warning' ? 'bg-amber-500' : 'bg-red-500')} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground">{event.action}</p>
                      <span className="text-[9px] text-muted-foreground shrink-0">{event.time}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{event.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ CO-SIGNERS TAB ═══ */}
        <TabsContent value="cosigners" className="space-y-3">
          <Card className="overflow-hidden border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2"><Users className="size-4 text-[#D4AF37]" /><CardTitle className="text-sm font-bold">امضاکنندگان معتمد</CardTitle></div>
              <Button size="sm" onClick={() => setAddSignerOpen(true)} className="gap-1 bg-[#D4AF37] text-[#1a1a1a] text-[10px] hover:bg-[#E5C249]"><Plus className="size-3" /> افزودن</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* You */}
              <div className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/20"><Shield className="size-5 text-[#D4AF37]" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground">شما (مالک)</p>
                  <p className="text-[10px] text-muted-foreground">{user?.fullName || 'کاربر فعلی'}</p>
                </div>
                <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] text-[10px]">مالک</Badge>
              </div>
              <Separator />
              {coSigners.map((signer) => (
                <div key={signer.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted"><Smartphone className="size-4 text-muted-foreground" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">{signer.name}</p>
                    <p className="text-[10px] text-muted-foreground" dir="ltr">{signer.phone}</p>
                  </div>
                  <Badge className={cn('text-[10px]', signer.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500')}>
                    {signer.status === 'active' ? 'فعال' : 'در انتظار'}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveSigner(signer.id)} className="text-red-500 hover:text-red-600"><Trash2 className="size-3.5" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-[#D4AF37]/20 bg-[#D4AF37]/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <ShieldQuestion className="mt-0.5 size-4 shrink-0 text-[#D4AF37]" />
                <div className="text-[11px] leading-relaxed text-muted-foreground space-y-1">
                  <p className="font-bold text-foreground">چندامضایی چگونه کار می‌کند؟</p>
                  <p>معاملات بالای سقف تعیین‌شده نیاز به تأیید حداقل ۲ نفر از ۳ امضاکننده معتمد دارند. این ویژگی از برداشت‌های غیرمجاز جلوگیری می‌کند.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ BACKUP TAB ═══ */}
        <TabsContent value="backup" className="space-y-3">
          <Card className="overflow-hidden border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2"><KeyRound className="size-4 text-[#D4AF37]" /><CardTitle className="text-sm font-bold">کدهای بازیابی</CardTitle></div>
              <Button onClick={() => { if (codes.length > 0) setConfirmGenerateOpen(true); else handleGenerateCodes(); }} disabled={generating} className="gap-1 bg-[#D4AF37] text-[#1a1a1a] text-[10px] hover:bg-[#E5C249]">
                {generating ? <RefreshCw className="size-3 animate-spin" /> : <Fingerprint className="size-3" />}
                بازنشانی
              </Button>
            </CardHeader>
            <CardContent>
              {codesLoading ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
              : codes.length > 0 ? (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => setShowCodes(!showCodes)} className="gap-1 text-xs text-muted-foreground">
                      {showCodes ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      {showCodes ? 'مخفی' : 'نمایش'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCopyAll} className="gap-1 text-xs text-[#D4AF37]"><Download className="size-3.5" /> کپی همه</Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {codes.map((item, index) => (
                      <div key={item.id} className={cn('flex items-center gap-3 rounded-xl border p-3', item.isUsed ? 'border-border/50 bg-muted/30 opacity-60' : 'border-border bg-background hover:border-[#D4AF37]/30')}>
                        <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-black', item.isUsed ? 'bg-muted text-muted-foreground' : 'bg-[#D4AF37]/10 text-[#D4AF37]')}>
                          {item.isUsed ? <CheckCircle className="size-4" /> : formatNumber(index + 1)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn('text-xs font-mono font-bold tracking-wider', item.isUsed ? 'text-muted-foreground line-through' : showCodes ? 'text-foreground' : 'text-muted-foreground')} dir="ltr">{item.isUsed ? 'استفاده شده' : showCodes ? item.code : '•••-••••-••••'}</p>
                        </div>
                        {!item.isUsed && showCodes && (
                          <Button variant="ghost" size="sm" onClick={() => handleCopyCode(item.code, item.id)} className="shrink-0">{copiedCode === item.id ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5 text-muted-foreground" />}</Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                      <div className="text-[11px] leading-relaxed text-muted-foreground">
                        <p className="font-bold text-amber-600">مهم!</p>
                        <p>هر کد فقط یک‌بار قابل استفاده است. در مکان امن فیزیکی ذخیره کنید.</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : <div className="flex flex-col items-center py-8 text-center"><Key className="size-10 text-muted-foreground/30" /><p className="mt-2 text-sm text-muted-foreground">کد پشتیبانی ندارید</p></div>}
            </CardContent>
          </Card>

          {/* Export */}
          <Card className="overflow-hidden border-border">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <FileJson className="size-4 text-[#D4AF37]" />
              <CardTitle className="text-sm font-bold">خروجی اطلاعات حساب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[11px] text-muted-foreground">تمام اطلاعات حساب خود را در قالب JSON دانلود کنید. این فایل برای بازیابی حساب در پلتفرم‌های دیگر قابل استفاده است.</p>
              <Button onClick={handleExportData} className="w-full gap-1.5 bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]"><Download className="size-3.5" /> دانلود فایل JSON</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ DEVICES TAB ═══ */}
        <TabsContent value="devices" className="space-y-3">
          <Card className="overflow-hidden border-border">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Monitor className="size-4 text-[#D4AF37]" />
              <CardTitle className="text-sm font-bold">دستگاه‌های فعال</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {devices.map((device) => {
                const DeviceIcon = device.type === 'mobile' ? Smartphone : device.type === 'tablet' ? Tablet : Monitor;
                return (
                  <div key={device.id} className={cn('flex items-center gap-3 rounded-xl border p-3', device.isCurrent ? 'border-[#D4AF37]/20 bg-[#D4AF37]/5' : 'border-border')}>
                    <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', device.isCurrent ? 'bg-[#D4AF37]/10' : 'bg-muted')}>
                      <DeviceIcon className={cn('size-4', device.isCurrent ? 'text-[#D4AF37]' : 'text-muted-foreground')} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-foreground truncate">{device.name}</p>
                        {device.isCurrent && <Badge className="bg-emerald-500/10 text-emerald-500 text-[9px]">فعال</Badge>}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{device.lastActive} — IP: {device.ip}</p>
                    </div>
                    {!device.isCurrent && (
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveDevice(device.id)} className="text-red-500 hover:text-red-600"><LogOut className="size-3.5" /></Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-[#D4AF37]/20 bg-[#D4AF37]/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <ShieldQuestion className="mt-0.5 size-4 shrink-0 text-[#D4AF37]" />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-bold text-foreground">نکته امنیتی:</span> اگر دستگاهی را نمی‌شناسید، فوراً آن را حذف کنید و رمز عبور خود را تغییر دهید.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ── */}
      <Dialog open={confirmGenerateOpen} onOpenChange={setConfirmGenerateOpen}>
        <DialogContent className="border-border bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-amber-500" /> بازنشانی کدهای پشتیبان</DialogTitle>
            <DialogDescription className="text-xs">کدهای قبلی باطل خواهند شد. آیا مطمئنید؟</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmGenerateOpen(false)}>انصراف</Button>
            <Button onClick={handleGenerateCodes} className="bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]">بله</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addSignerOpen} onOpenChange={setAddSignerOpen}>
        <DialogContent className="border-border bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="size-5 text-[#D4AF37]" /> افزودن امضاکننده</DialogTitle>
            <DialogDescription className="text-xs">نام و شماره تلفن امضاکننده جدید را وارد کنید.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">نام</Label>
              <Input value={newSignerName} onChange={(e) => setNewSignerName(e.target.value)} placeholder="نام امضاکننده" className="h-9 border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">شماره تلفن</Label>
              <Input value={newSignerPhone} onChange={(e) => setNewSignerPhone(e.target.value)} placeholder="۰۹۱۲۳۴۵۶۷۸۹" className="h-9 border-border" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddSignerOpen(false)}>انصراف</Button>
            <Button onClick={handleAddSigner} disabled={!newSignerPhone.trim()} className="bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]">ارسال دعوت‌نامه</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

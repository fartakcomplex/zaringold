
/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  QR Payment View — صفحه پرداخت QR                                           */
/*  Three sections: Create QR, Pay QR (customer view), My QR Codes List          */
/*  Persian RTL with English comments                                           */
/* ═══════════════════════════════════════════════════════════════════════════════ */

import {useState, useCallback, useEffect} from 'react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Separator} from '@/components/ui/separator';
import {Skeleton} from '@/components/ui/skeleton';
import {Switch} from '@/components/ui/switch';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog';
import {QrCode, Plus, Copy, Check, Trash2, Eye, EyeOff, CreditCard, Coins, ShieldCheck, Loader2, CheckCircle, XCircle, Clock, Link2, Wallet, ScanLine, ArrowLeft, RefreshCw, Store} from 'lucide-react';
import {useAppStore} from '@/lib/store';
import {formatNumber, formatToman} from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Types & Interfaces                                                        */
/* ═══════════════════════════════════════════════════════════════════════════════ */

type QrType = 'fixed' | 'flexible';

interface QrCodeItem {
  id: string;
  token: string;
  title: string;
  amount_toman: number;
  amount_gold: number;
  is_fixed: boolean;
  is_active: boolean;
  scan_count: number;
  payment_url: string;
  created_at: string;
}

interface QrPayData {
  id: string;
  token: string;
  title: string;
  amount_toman: number;
  is_fixed: boolean;
  merchant_name: string;
  merchant_logo?: string;
  is_active: boolean;
  scan_count: number;
}

/* Animation variants */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  SVG-based QR Code Pattern Generator                                        */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function generateQrPattern(token: string): string[][] {
  // Generate a deterministic pattern from the token string
  const size = 21;
  const grid: string[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => '0')
  );

  // Add finder patterns (3 corners)
  const addFinder = (r: number, c: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
          grid[r + i][c + j] = '1';
        }
      }
    }
  };
  addFinder(0, 0);
  addFinder(0, 14);
  addFinder(14, 0);

  // Timing patterns
  for (let i = 8; i < 13; i++) {
    grid[6][i] = i % 2 === 0 ? '1' : '0';
    grid[i][6] = i % 2 === 0 ? '1' : '0';
  }

  // Data modules from token hash
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = ((hash << 5) - hash + token.charCodeAt(i)) | 0;
  }

  const dataPositions: [number, number][] = [];
  for (let r = 8; r < size; r++) {
    for (let c = 8; c < size; c++) {
      if (r === 6 || c === 6) continue;
      if (r >= 8 && r <= 8 && c >= 8) continue;
      dataPositions.push([r, c]);
    }
  }

  let seed = Math.abs(hash);
  for (const [r, c] of dataPositions) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    grid[r][c] = seed % 3 === 0 ? '1' : '0';
  }

  return grid;
}

function QrCodeDisplay({ token, size = 200 }: { token: string; size?: number }) {
  const grid = generateQrPattern(token);
  const cellSize = size / grid.length;

  return (
    <div
      className="mx-auto rounded-xl bg-white p-3 dark:bg-gray-900"
      style={{ width: size + 24, height: size + 24 }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${grid.length} ${grid.length}`}
        className="mx-auto block"
      >
        {grid.map((row, r) =>
          row.map((cell, c) =>
            cell === '1' ? (
              <rect
                key={`${r}-${c}`}
                x={c}
                y={r}
                width={1}
                height={1}
                fill="#1a1a2e"
                rx={0.1}
                className="dark:fill-[#D4AF37]"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Section 1: Create QR Code Form                                             */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function CreateQrSection({
  onCreated,
}: {
  onCreated: (data: { token: string; payment_url: string; title: string }) => void;
}) {
  const { user, addToast } = useAppStore();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [qrType, setQrType] = useState<QrType>('fixed');
  const [isCreating, setIsCreating] = useState(false);
  const [createdQr, setCreatedQr] = useState<{
    token: string;
    payment_url: string;
    title: string;
    amount_toman: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!title.trim()) {
      addToast('عنوان QR کد الزامی است', 'error');
      return;
    }
    if (qrType === 'fixed' && (!amount || Number(amount) <= 0)) {
      addToast('برای QR ثابت، مبلغ الزامی است', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/v1/merchant/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          title: title.trim(),
          amount_toman: qrType === 'fixed' ? Number(amount) : 0,
          is_fixed: qrType === 'fixed',
        }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        const qr = json.data;
        setCreatedQr({
          token: qr.token,
          payment_url: qr.payment_url,
          title: qr.title,
          amount_toman: qr.amount_toman,
        });
        onCreated(qr);
        addToast('QR کد با موفقیت ایجاد شد', 'success');
      } else {
        addToast(json.message || 'خطا در ایجاد QR کد', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setIsCreating(false);
    }
  }, [title, amount, qrType, user, addToast, onCreated]);

  const handleCopy = useCallback(async () => {
    if (!createdQr) return;
    try {
      await navigator.clipboard.writeText(createdQr.payment_url);
      setCopied(true);
      addToast('لینک کپی شد', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('خطا در کپی', 'error');
    }
  }, [createdQr, addToast]);

  const handleReset = useCallback(() => {
    setCreatedQr(null);
    setTitle('');
    setAmount('');
  }, []);

  // Show generated QR code
  if (createdQr) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-5"
      >
        {/* QR code display */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-gold/20 via-transparent to-gold/20 blur-xl" />
          <div className="relative rounded-2xl border border-gold/20 bg-card p-6">
            <QrCodeDisplay token={createdQr.token} size={220} />
          </div>
        </div>

        {/* QR details */}
        <div className="w-full text-center">
          <h3 className="text-lg font-bold">{createdQr.title}</h3>
          {createdQr.amount_toman > 0 && (
            <p className="mt-1 gold-gradient-text text-2xl font-extrabold tabular-nums">
              {formatToman(createdQr.amount_toman)}
            </p>
          )}
        </div>

        {/* Token display */}
        <div className="w-full rounded-xl border border-gold/20 bg-gold/5 p-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">توکن QR</p>
          <code className="block text-xs font-mono font-bold text-gold">
            {createdQr.token}
          </code>
        </div>

        {/* Actions */}
        <div className="flex w-full gap-3">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex-1 border-gold/30 text-gold hover:bg-gold/10"
          >
            {copied ? <Check className="size-4 ml-2" /> : <Copy className="size-4 ml-2" />}
            {copied ? 'کپی شد!' : 'کپی لینک'}
          </Button>
          <Button onClick={handleReset} variant="outline" className="flex-1">
            <RefreshCw className="size-4 ml-2" />
            QR جدید
          </Button>
        </div>
      </motion.div>
    );
  }

  // Creation form
  return (
    <motion.div variants={itemVariants} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">عنوان QR کد</Label>
        <Input
          placeholder="مثلاً: پیشخوان فروشگاه"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-gold/20 focus:border-gold/40"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">نوع QR</Label>
        <Select value={qrType} onValueChange={(v) => setQrType(v as QrType)}>
          <SelectTrigger className="border-gold/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">
              <div className="flex items-center gap-2">
                <CreditCard className="size-3.5 text-gold" />
                مبلغ ثابت
              </div>
            </SelectItem>
            <SelectItem value="flexible">
              <div className="flex items-center gap-2">
                <Coins className="size-3.5 text-gold" />
                مبلغ متغیر (مشتری وارد می‌کند)
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AnimatePresence>
        {qrType === 'fixed' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <Label className="text-sm font-semibold">مبلغ (واحد طلایی)</Label>
            <Input
              type="number"
              placeholder="مثلاً: 500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border-gold/20 focus:border-gold/40 tabular-nums"
            />
            {amount && Number(amount) > 0 && (
              <p className="text-xs text-muted-foreground tabular-nums">
                معادل: {formatToman(Number(amount))}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={handleCreate}
        disabled={isCreating || !title.trim()}
        className="btn-gold-shine w-full bg-gradient-to-l from-gold-dark via-gold to-gold-light text-foreground font-bold shadow-lg shadow-gold/20 hover:brightness-110 disabled:opacity-50"
      >
        {isCreating ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <>
            <QrCode className="size-5 ml-2" />
            ایجاد QR کد پرداخت
          </>
        )}
      </Button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Section 2: Pay QR (Customer View)                                          */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function PayQrSection({ token }: { token: string }) {
  const { addToast } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState<QrPayData | null>(null);
  const [customerAmount, setCustomerAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'toman' | 'gold'>('toman');
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  // Fetch QR data on mount
  useEffect(() => {
    const fetchQr = async () => {
      try {
        const res = await fetch(`/api/v1/merchant/qr/${encodeURIComponent(token)}`);
        const json = await res.json();
        if (json.success && json.data) {
          setQrData(json.data);
        } else {
          addToast(json.message || 'QR کد یافت نشد', 'error');
        }
      } catch {
        addToast('خطا در دریافت اطلاعات', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchQr();
  }, [token, addToast]);

  const handlePay = useCallback(async () => {
    if (!qrData) return;
    const finalAmount = qrData.is_fixed ? qrData.amount_toman : Number(customerAmount);
    if (!finalAmount || finalAmount <= 0) {
      addToast('مبلغ را وارد کنید', 'error');
      return;
    }

    setIsPaying(true);
    // Simulate payment (demo)
    await new Promise((r) => setTimeout(r, 1500));
    setPaySuccess(true);
    setIsPaying(false);
    addToast('پرداخت با موفقیت انجام شد!', 'success');
  }, [qrData, customerAmount, addToast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Skeleton className="size-16 rounded-2xl" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  if (!qrData) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <XCircle className="size-16 text-destructive" />
        <h3 className="text-lg font-bold">QR کد یافت نشد</h3>
        <p className="text-sm text-muted-foreground">لینک نامعتبر یا QR کد حذف شده</p>
      </div>
    );
  }

  // Success state
  if (paySuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-5 py-8"
      >
        <div className="relative">
          <div className="flex size-24 items-center justify-center rounded-full bg-emerald-500/15 shadow-[0_0_40px_oklch(0.7_0.15_145/0.15)]">
            <CheckCircle className="size-14 text-emerald-500" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold">پرداخت موفق!</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            پرداخت به {qrData.merchant_name} انجام شد
          </p>
        </div>
        <div className="w-full rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
          <p className="text-xs text-muted-foreground">مبلغ پرداختی</p>
          <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatToman(qrData.is_fixed ? qrData.amount_toman : Number(customerAmount))}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      {/* Merchant info header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
          <Store className="size-6 text-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold">{qrData.merchant_name}</h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{qrData.title}</p>
        </div>
        <Badge className={`${qrData.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600'} border-0`}>
          {qrData.is_active ? 'فعال' : 'غیرفعال'}
        </Badge>
      </motion.div>

      <Separator className="bg-gold/10" />

      {/* Amount display */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 via-transparent to-gold/5 p-5">
          <div className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-gold/8 blur-3xl" />
          <div className="relative flex flex-col items-center gap-2 text-center">
            <span className="text-xs font-medium text-muted-foreground">مبلغ پرداخت</span>
            {qrData.is_fixed ? (
              <>
                <span className="gold-gradient-text text-3xl font-extrabold tabular-nums">
                  {formatToman(qrData.amount_toman)}
                </span>
                <span className="text-sm text-muted-foreground">واحد طلایی (مبلغ ثابت)</span>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-foreground/40 tabular-nums">مبلغ متغیر</span>
                <Input
                  type="number"
                  placeholder="مبلغ را وارد کنید (واحد طلایی)"
                  value={customerAmount}
                  onChange={(e) => setCustomerAmount(e.target.value)}
                  className="mt-2 max-w-xs border-gold/20 text-center tabular-nums focus:border-gold/40"
                />
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Payment method selector */}
      <motion.div variants={itemVariants} className="space-y-2">
        <span className="text-sm font-semibold">روش پرداخت</span>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPayMethod('toman')}
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200 ${
              payMethod === 'toman'
                ? 'border-gold/40 bg-gold/10 shadow-[0_0_16px_oklch(0.75_0.15_85/0.1)]'
                : 'border-border bg-card hover:border-gold/20'
            }`}
          >
            <div className={`flex size-10 items-center justify-center rounded-lg ${payMethod === 'toman' ? 'bg-gold/15 text-gold' : 'bg-muted text-muted-foreground'}`}>
              <CreditCard className="size-5" />
            </div>
            <span className={`text-xs font-semibold ${payMethod === 'toman' ? 'text-gold' : 'text-foreground'}`}>
              کیف پول واحد طلایی
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPayMethod('gold')}
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200 ${
              payMethod === 'gold'
                ? 'border-gold/40 bg-gold/10 shadow-[0_0_16px_oklch(0.75_0.15_85/0.1)]'
                : 'border-border bg-card hover:border-gold/20'
            }`}
          >
            <div className={`flex size-10 items-center justify-center rounded-lg ${payMethod === 'gold' ? 'bg-gold/15 text-gold' : 'bg-muted text-muted-foreground'}`}>
              <Coins className="size-5" />
            </div>
            <span className={`text-xs font-semibold ${payMethod === 'gold' ? 'text-gold' : 'text-foreground'}`}>
              کیف پول طلا
            </span>
          </button>
        </div>
      </motion.div>

      {/* Pay button */}
      <motion.div variants={itemVariants}>
        <Button
          size="lg"
          disabled={isPaying || !qrData.is_active}
          onClick={handlePay}
          className="btn-gold-shine w-full bg-gradient-to-l from-gold-dark via-gold to-gold-light text-foreground font-bold shadow-lg shadow-gold/20 hover:brightness-110 disabled:opacity-50"
        >
          {isPaying ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <ShieldCheck className="size-5 ml-2" />
              {qrData.is_fixed
                ? `پرداخت ${formatToman(qrData.amount_toman)}`
                : 'پرداخت'}
            </>
          )}
        </Button>
      </motion.div>

      {/* Trust info */}
      <motion.div variants={itemVariants} className="flex items-center justify-center gap-4 text-muted-foreground">
        <div className="flex items-center gap-1 text-xs">
          <ShieldCheck className="size-3.5" />
          پرداخت امن
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Clock className="size-3.5" />
          <span className="tabular-nums">{formatNumber(qrData.scan_count)} اسکن</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Section 3: My QR Codes List                                               */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function QrCodesList() {
  const { user, addToast } = useAppStore();
  const [qrCodes, setQrCodes] = useState<QrCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QrCodeItem | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchQrCodes = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/merchant/qr?userId=${user.id}`);
      const json = await res.json();
      if (json.success && json.data?.qr_codes) {
        setQrCodes(json.data.qr_codes);
      }
    } catch {
      addToast('خطا در دریافت لیست QR کدها', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, addToast]);

  useEffect(() => {
    fetchQrCodes();
  }, [fetchQrCodes]);

  const handleCopyLink = useCallback(async (qr: QrCodeItem) => {
    try {
      await navigator.clipboard.writeText(qr.payment_url);
      setCopiedId(qr.id);
      addToast('لینک کپی شد', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      addToast('خطا در کپی', 'error');
    }
  }, [addToast]);

  const handleToggle = useCallback(async (qr: QrCodeItem) => {
    setTogglingId(qr.id);
    try {
      const res = await fetch(`/api/v1/merchant/qr/${qr.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, action: 'toggle_active' }),
      });
      const json = await res.json();
      if (json.success) {
        setQrCodes((prev) =>
          prev.map((q) =>
            q.id === qr.id ? { ...q, is_active: !q.is_active } : q
          )
        );
        addToast(json.message, 'success');
      } else {
        addToast(json.message || 'خطا', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setTogglingId(null);
    }
  }, [user?.id, addToast]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget || !user?.id) return;
    try {
      const res = await fetch(`/api/v1/merchant/qr/${deleteTarget.id}?userId=${user.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setQrCodes((prev) => prev.filter((q) => q.id !== deleteTarget.id));
        addToast('QR کد حذف شد', 'success');
      } else {
        addToast(json.message || 'خطا در حذف', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, user?.id, addToast]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (qrCodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gold/10 text-gold">
          <QrCode className="size-8" />
        </div>
        <div>
          <h4 className="text-sm font-bold">QR پرداختی وجود ندارد</h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            QR کد پرداخت جدیدی ایجاد کنید تا لینک پرداخت دریافت کنید
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3 max-h-[28rem] overflow-y-auto">
        {qrCodes.map((qr) => (
          <motion.div key={qr.id} variants={itemVariants}>
            <Card className="overflow-hidden border-border/50 hover:border-gold/20 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  {/* Top row: icon + info */}
                  <div className="flex items-center gap-3">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${qr.is_active ? 'bg-gold/10 text-gold' : 'bg-muted text-muted-foreground'}`}>
                      <QrCode className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate text-sm font-bold">{qr.title}</h4>
                        <Badge className={`${qr.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800/40 text-gray-500'} border-0 text-[10px] shrink-0`}>
                          {qr.is_active ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CreditCard className="size-3" />
                          {qr.is_fixed ? formatToman(qr.amount_toman) : 'متغیر'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <ScanLine className="size-3" />
                          {formatNumber(qr.scan_count)} اسکن
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom row: actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyLink(qr)}
                      className="h-8 flex-1 text-xs border-border/50 hover:border-gold/30"
                    >
                      {copiedId === qr.id ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Link2 className="size-3.5" />
                      )}
                      {copiedId === qr.id ? 'کپی شد!' : 'کپی لینک'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggle(qr)}
                      disabled={togglingId === qr.id}
                      className={`h-8 text-xs border-border/50 ${qr.is_active ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'}`}
                    >
                      {togglingId === qr.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : qr.is_active ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                      {qr.is_active ? 'غیرفعال' : 'فعال'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteTarget(qr)}
                      className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-border/50"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl" className="border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="size-5 text-destructive" />
              حذف QR کد
            </AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف QR کد «{deleteTarget?.title}» مطمئنید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50">انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Main QrPaymentView Component                                              */
/* ═══════════════════════════════════════════════════════════════════════════════ */

export default function QrPaymentView() {
  // Check if a QR token is in the URL hash (simulating /checkout/qr/{token})
  const [hashToken] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.startsWith('#qr=')) {
        return hash.replace('#qr=', '');
      }
    }
    return '';
  });
  const [activeTab, setActiveTab] = useState<'create' | 'pay' | 'list'>(() => (hashToken ? 'pay' : 'create'));
  const [payToken, setPayToken] = useState(hashToken);

  const handleQrCreated = useCallback((data: { token: string; payment_url: string }) => {
    setPayToken(data.token);
    setActiveTab('pay');
  }, []);

  const tabs = [
    { key: 'create' as const, label: 'ایجاد QR', icon: <Plus className="size-4" /> },
    { key: 'list' as const, label: 'QR‌های من', icon: <QrCode className="size-4" /> },
    { key: 'pay' as const, label: 'پرداخت QR', icon: <Wallet className="size-4" /> },
  ];

  return (
    <div className="page-transition mx-auto max-w-3xl space-y-5 pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-gold-dark shadow-lg shadow-gold/20">
          <QrCode className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold">پرداخت QR</h1>
          <p className="text-xs text-muted-foreground">ایجاد، مدیریت و پرداخت QR کدها</p>
        </div>
      </motion.div>

      {/* Tab Switcher */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex rounded-xl border border-border/50 bg-muted/30 p-1"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-bold transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-card text-gold shadow-sm border border-gold/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Plus className="size-4 text-gold" />
                  ایجاد QR کد جدید
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CreateQrSection onCreated={handleQrCreated} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="size-4 text-gold" />
                    QR کدهای من
                  </div>
                  <Badge variant="outline" className="border-gold/30 text-gold text-[10px]">
                    لیست
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QrCodesList />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'pay' && (
          <motion.div
            key="pay"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/50 overflow-hidden">
              {/* Gold accent bar */}
              <div className="h-1 bg-gradient-to-l from-gold-dark via-gold to-gold-light" />
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Wallet className="size-4 text-gold" />
                  پرداخت QR
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payToken ? (
                  <PayQrSection token={payToken} />
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center gap-3 py-6">
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-gold/10 text-gold">
                        <ScanLine className="size-8" />
                      </div>
                      <div className="text-center">
                        <h4 className="text-sm font-bold">توکن QR را وارد کنید</h4>
                        <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                          توکن یا لینک QR کد پرداخت را وارد کنید یا از لیست QR‌های خود انتخاب کنید
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">توکن QR</Label>
                      <Input
                        placeholder="QR-abc123def456..."
                        value={payToken}
                        onChange={(e) => setPayToken(e.target.value)}
                        className="border-gold/20 text-left font-mono text-xs focus:border-gold/40"
                      />
                    </div>
                    <Button
                      onClick={() => payToken && setActiveTab('pay')}
                      disabled={!payToken}
                      className="btn-gold-shine w-full bg-gradient-to-l from-gold-dark via-gold to-gold-light text-foreground font-bold disabled:opacity-50"
                    >
                      <Eye className="size-4 ml-2" />
                      مشاهده QR
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { icon: <QrCode className="size-4" />, label: 'QR فعال', value: '—', color: 'text-gold' },
          { icon: <ScanLine className="size-4" />, label: 'کل اسکن', value: '—', color: 'text-emerald-600 dark:text-emerald-400' },
          { icon: <CreditCard className="size-4" />, label: 'پرداخت موفق', value: '—', color: 'text-amber-600 dark:text-amber-400' },
        ].map((stat, i) => (
          <Card key={i} className="border-border/30">
            <CardContent className="p-3 text-center">
              <div className={`flex justify-center text-muted-foreground mb-1 ${stat.color}`}>
                {stat.icon}
              </div>
              <p className="text-xs font-bold tabular-nums">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  );
}

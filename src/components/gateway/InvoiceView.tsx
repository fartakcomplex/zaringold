'use client';

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  InvoiceView — Invoice Management for Gold Payment Gateway                   */
/*  Three tabs: Create Invoice, Invoice List, Invoice Preview                   */
/*  Persian RTL with English comments                                           */
/* ═══════════════════════════════════════════════════════════════════════════════ */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  Copy,
  Printer,
  Check,
  Loader2,
  Coins,
  Calendar,
  User,
  Phone,
  Mail,
  Filter,
  ArrowLeft,
  Link2,
  Clock,
  Hash,
  Package,
  Search,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useRealGoldPrice } from '@/hooks/useRealGoldPrice';
import { formatNumber, formatToman, formatGrams, formatDate, formatDateTime, getTimeAgo } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Types & Interfaces                                                        */
/* ═══════════════════════════════════════════════════════════════════════════════ */

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  items: InvoiceItem[];
  amount_toman: number;
  amount_gold: number;
  tax_toman: number;
  discount_toman: number;
  total_toman: number;
  total_gold: number;
  status: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
}

/* Status display config */
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: {
    label: 'در انتظار پرداخت',
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  },
  paid: {
    label: 'پرداخت شده',
    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  },
  expired: {
    label: 'منقضی شده',
    color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  },
};

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
/*  Tab 1: Create Invoice Form                                                */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function CreateInvoiceTab({ onCreated }: { onCreated: () => void }) {
  const { user, addToast } = useAppStore();
  const { prices } = useRealGoldPrice();

  /* Customer info */
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [dueDate, setDueDate] = useState('');

  /* Items list */
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);

  /* Tax & discount */
  const [taxPercent, setTaxPercent] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('');

  /* Submit state */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── Items management ── */
  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  const updateItem = useCallback((index: number, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }, []);

  /* ── Calculations ── */
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxToman = subtotal * (Number(taxPercent) || 0) / 100;
  const discountToman = Number(discountAmount) || 0;
  const totalToman = subtotal + taxToman - discountToman;
  const goldPerGram = prices?.geram24 || 32_670_000;
  const totalGold = goldPerGram > 0 ? totalToman / goldPerGram : 0;

  /* ── Submit handler ── */
  const handleSubmit = useCallback(async () => {
    if (!customerName.trim()) {
      addToast('نام مشتری الزامی است', 'error');
      return;
    }

    const validItems = items.filter((item) => item.description.trim() && item.unitPrice > 0);
    if (validItems.length === 0) {
      addToast('حداقل یک قلم کالا با قیمت معتبر وارد کنید', 'error');
      return;
    }

    if (totalToman < 0) {
      addToast('مبلغ نهایی نمی‌تواند منفی باشد', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/merchant/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim() || undefined,
          customer_email: customerEmail.trim() || undefined,
          items: validItems,
          amount_toman: subtotal,
          amount_gold: goldPerGram > 0 ? subtotal / goldPerGram : 0,
          tax_toman: taxToman,
          discount_toman: discountToman,
          due_date: dueDate || undefined,
        }),
      });
      const json = await res.json();

      if (json.success) {
        addToast('فاکتور با موفقیت ایجاد شد', 'success');
        // Reset form
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setDueDate('');
        setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
        setTaxPercent('0');
        setDiscountAmount('');
        onCreated();
      } else {
        addToast(json.message || 'خطا در ایجاد فاکتور', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [customerName, customerPhone, customerEmail, dueDate, items, taxPercent, discountAmount, subtotal, taxToman, totalToman, goldPerGram, user, addToast, onCreated]);

  return (
    <motion.div variants={itemVariants} className="space-y-5">
      {/* Customer Information */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-2">
          <User className="size-3.5 text-gold" />
          اطلاعات مشتری
        </h3>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">نام مشتری *</Label>
          <Input
            placeholder="نام و نام خانوادگی مشتری"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="border-gold/20 focus:border-gold/40"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <Phone className="size-3" />
              شماره تماس
            </Label>
            <Input
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="border-gold/20 focus:border-gold/40"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <Mail className="size-3" />
              ایمیل
            </Label>
            <Input
              type="email"
              placeholder="email@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="border-gold/20 focus:border-gold/40"
              dir="ltr"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold flex items-center gap-1.5">
            <Calendar className="size-3" />
            تاریخ سررسید
          </Label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="border-gold/20 focus:border-gold/40"
            dir="ltr"
          />
        </div>
      </div>

      <Separator className="bg-gold/10" />

      {/* Items List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-2">
            <Package className="size-3.5 text-gold" />
            اقلام فاکتور
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className="h-7 text-xs border-gold/20 text-gold hover:bg-gold/10"
          >
            <Plus className="size-3 ml-1" />
            افزودن قلم
          </Button>
        </div>

        {/* Column headers (desktop) */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-[10px] font-bold text-muted-foreground px-1">
          <div className="col-span-5">توضیحات</div>
          <div className="col-span-2 text-center">تعداد</div>
          <div className="col-span-3 text-center">قیمت واحد (واحد طلایی)</div>
          <div className="col-span-1 text-center">جمع</div>
          <div className="col-span-1" />
        </div>

        {/* Items rows */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className="rounded-xl border border-border/50 bg-muted/20 p-3"
            >
              {/* Mobile layout */}
              <div className="sm:hidden space-y-2">
                <div className="flex items-start gap-2">
                  <Input
                    placeholder="توضیحات کالا یا خدمت"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="border-gold/20 focus:border-gold/40 text-sm flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                    className="h-9 w-9 shrink-0 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-0"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">تعداد</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value) || 0)}
                      className="border-gold/20 focus:border-gold/40 text-sm h-9 tabular-nums"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">قیمت واحد</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="۰"
                      value={item.unitPrice || ''}
                      onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value) || 0)}
                      className="border-gold/20 focus:border-gold/40 text-sm h-9 tabular-nums"
                    />
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-muted-foreground">جمع: </span>
                  <span className="text-xs font-bold text-gold tabular-nums">
                    {formatToman(item.quantity * item.unitPrice)}
                  </span>
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <Input
                    placeholder="توضیحات کالا یا خدمت"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="border-gold/20 focus:border-gold/40 text-sm h-9"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity || ''}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value) || 0)}
                    className="border-gold/20 focus:border-gold/40 text-sm h-9 text-center tabular-nums"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min="0"
                    placeholder="۰"
                    value={item.unitPrice || ''}
                    onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value) || 0)}
                    className="border-gold/20 focus:border-gold/40 text-sm h-9 text-center tabular-nums"
                  />
                </div>
                <div className="col-span-1 text-center">
                  <span className="text-xs font-bold text-gold tabular-nums">
                    {formatNumber(item.quantity * item.unitPrice)}
                  </span>
                </div>
                <div className="col-span-1 flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                    className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-0"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Separator className="bg-gold/10" />

      {/* Tax & Discount */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-2">
          <Coins className="size-3.5 text-gold" />
          مالیات و تخفیف
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">درصد مالیات (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
              className="border-gold/20 focus:border-gold/40 tabular-nums"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">مبلغ تخفیف (واحد طلایی)</Label>
            <Input
              type="number"
              min="0"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className="border-gold/20 focus:border-gold/40 tabular-nums"
            />
          </div>
        </div>
      </div>

      <Separator className="bg-gold/10" />

      {/* Totals Summary */}
      <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">جمع اقلام</span>
          <span className="font-bold tabular-nums">{formatToman(subtotal)}</span>
        </div>
        {taxToman > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">مالیات ({taxPercent}%)</span>
            <span className="font-bold tabular-nums text-amber-600">+{formatToman(taxToman)}</span>
          </div>
        )}
        {discountToman > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">تخفیف</span>
            <span className="font-bold tabular-nums text-emerald-600">-{formatToman(discountToman)}</span>
          </div>
        )}
        <Separator className="bg-gold/20" />
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold">مبلغ کل</span>
          <span className="text-lg font-extrabold gold-gradient-text tabular-nums">
            {formatToman(totalToman)}
          </span>
        </div>
        {totalGold > 0 && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Coins className="size-3 text-gold" />
              معادل طلای آبشده
            </span>
            <span className="font-bold text-gold tabular-nums">
              {formatGrams(totalGold)}
            </span>
          </div>
        )}
      </div>

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !customerName.trim()}
        className="btn-gold-shine w-full bg-gradient-to-l from-gold-dark via-gold to-gold-light text-foreground font-bold shadow-lg shadow-gold/20 hover:brightness-110 disabled:opacity-50"
      >
        {isSubmitting ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <>
            <FileText className="size-5 ml-2" />
            ایجاد فاکتور
          </>
        )}
      </Button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 2: Invoice List                                                       */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function InvoiceListTab({ onSelectInvoice }: { onSelectInvoice: (invoice: Invoice) => void }) {
  const { user, addToast } = useAppStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch invoices ── */
  const fetchInvoices = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ userId: user.id, limit: '50' });
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/v1/merchant/invoices?${params}`);
      const json = await res.json();
      if (json.success && json.data?.invoices) {
        setInvoices(json.data.invoices);
      }
    } catch {
      addToast('خطا در دریافت لیست فاکتورها', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, statusFilter, addToast]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  /* ── Delete invoice ── */
  const handleDelete = useCallback(async () => {
    if (!deleteTarget || !user?.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/merchant/invoices/${deleteTarget.id}?userId=${user.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setInvoices((prev) => prev.filter((inv) => inv.id !== deleteTarget.id));
        addToast('فاکتور حذف شد', 'success');
      } else {
        addToast(json.message || 'خطا در حذف فاکتور', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, user?.id, addToast]);

  /* ── Status filter tabs ── */
  const filterTabs = [
    { key: 'all', label: 'همه' },
    { key: 'pending', label: 'در انتظار' },
    { key: 'paid', label: 'پرداخت شده' },
    { key: 'expired', label: 'منقضی' },
  ];

  return (
    <motion.div variants={itemVariants} className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all duration-200 ${
              statusFilter === tab.key
                ? 'bg-gold/10 text-gold border border-gold/20'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Invoice cards */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-10 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gold/10 text-gold">
            <FileText className="size-8" />
          </div>
          <div>
            <h4 className="text-sm font-bold">فاکتوری یافت نشد</h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs">
              هنوز فاکتوری ایجاد نشده است یا فیلتر فعلی نتیجه‌ای ندارد
            </p>
          </div>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3 max-h-[36rem] overflow-y-auto">
          {invoices.map((invoice) => {
            const statusCfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.pending;

            return (
              <motion.div key={invoice.id} variants={itemVariants}>
                <Card
                  className="overflow-hidden border-border/50 hover:border-gold/20 transition-all duration-300 cursor-pointer card-hover-lift"
                  onClick={() => onSelectInvoice(invoice)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      {/* Top row: number + status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Hash className="size-3.5 text-gold" />
                          <span className="text-xs font-bold tabular-nums" dir="ltr">
                            {invoice.invoice_number}
                          </span>
                        </div>
                        <Badge className={`${statusCfg.color} border-0 text-[10px]`}>
                          {statusCfg.label}
                        </Badge>
                      </div>

                      {/* Customer info */}
                      <div className="flex items-center gap-2">
                        <User className="size-3.5 text-muted-foreground" />
                        <span className="text-sm font-semibold">{invoice.customer_name}</span>
                      </div>

                      {/* Amounts */}
                      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-3">
                        <div className="flex-1 text-center">
                          <p className="text-[10px] text-muted-foreground">مبلغ کل</p>
                          <p className="mt-0.5 text-sm font-bold text-gold tabular-nums">
                            {formatToman(invoice.total_toman)}
                          </p>
                        </div>
                        {invoice.total_gold > 0 && (
                          <div className="flex-1 text-center">
                            <p className="text-[10px] text-muted-foreground">معادل طلا</p>
                            <p className="mt-0.5 text-sm font-bold tabular-nums">
                              {formatGrams(invoice.total_gold)}
                            </p>
                          </div>
                        )}
                        <div className="flex-1 text-center">
                          <p className="text-[10px] text-muted-foreground">سررسید</p>
                          <p className="mt-0.5 text-xs font-semibold tabular-nums">
                            {invoice.due_date ? formatDate(invoice.due_date) : '—'}
                          </p>
                        </div>
                      </div>

                      {/* Actions row */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 flex-1 text-xs border-border/50 hover:border-gold/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectInvoice(invoice);
                          }}
                        >
                          <Eye className="size-3.5 ml-1" />
                          مشاهده
                        </Button>
                        {invoice.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-border/50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(invoice);
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>

                      {/* Timestamp */}
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" />
                        {getTimeAgo(invoice.created_at)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف فاکتور</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف فاکتور شماره {deleteTarget?.invoice_number} مطمئن هستید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Tab 3: Invoice Preview                                                    */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function InvoicePreviewTab({
  invoice,
  onBack,
}: {
  invoice: Invoice;
  onBack: () => void;
}) {
  const { user, addToast } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const statusCfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.pending;
  const goldPerGram = 32_670_000; // Fallback gold price
  const goldEquivalent = goldPerGram > 0 && invoice.total_toman > 0
    ? invoice.total_toman / goldPerGram
    : invoice.total_gold || 0;

  /* ── Print handler ── */
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  /* ── Copy payment link ── */
  const handleCopyLink = useCallback(async () => {
    const link = `${window.location.origin}/invoice/${invoice.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      addToast('لینک پرداخت کپی شد', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('خطا در کپی لینک', 'error');
    }
  }, [invoice.id, addToast]);

  /* ── Mark as paid ── */
  const handleMarkPaid = useCallback(async () => {
    if (!user?.id) return;
    setMarkingPaid(true);
    try {
      const res = await fetch(`/api/v1/merchant/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, status: 'paid' }),
      });
      const json = await res.json();
      if (json.success) {
        addToast('فاکتور به‌عنوان پرداخت شده علامت‌گذاری شد', 'success');
        onBack(); // Go back to refresh
      } else {
        addToast(json.message || 'خطا در به‌روزرسانی فاکتور', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setMarkingPaid(false);
    }
  }, [user?.id, invoice.id, addToast, onBack]);

  return (
    <motion.div variants={itemVariants} className="space-y-4">
      {/* Back button + actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="h-8 border-border/50 hover:border-gold/30"
        >
          <ArrowLeft className="size-3.5 ml-1" />
          بازگشت
        </Button>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="h-8 border-border/50 hover:border-gold/30"
        >
          <Printer className="size-3.5 ml-1" />
          چاپ
        </Button>
        {invoice.status === 'pending' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 border-gold/30 text-gold hover:bg-gold/10"
            >
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Link2 className="size-3.5" />}
              {copied ? 'کپی شد!' : 'لینک پرداخت'}
            </Button>
            <Button
              size="sm"
              onClick={handleMarkPaid}
              disabled={markingPaid}
              className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white text-xs"
            >
              {markingPaid ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <>
                  <Check className="size-3.5 ml-1" />
                  تأیید پرداخت
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Invoice document */}
      <div ref={printRef} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-l from-gold-dark via-gold to-gold-light p-5 print:bg-gradient-to-l">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-white print:text-black">فاکتور فروش</h2>
              <p className="text-xs text-white/80 print:text-gray-600 mt-0.5">
                درگاه پرداخت طلایی زرین گلد
              </p>
            </div>
            <div className="text-left">
              <p className="text-xs text-white/70 print:text-gray-500">شماره فاکتور</p>
              <p className="text-sm font-bold text-white print:text-black tabular-nums" dir="ltr">
                {invoice.invoice_number}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <Badge className={`${statusCfg.color} border-0 text-xs`}>
              {statusCfg.label}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              تاریخ صدور: {formatDateTime(invoice.created_at)}
            </span>
          </div>

          <Separator />

          {/* Bill To */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground mb-2">فاکتور به:</h3>
            <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <User className="size-3.5 text-gold shrink-0" />
                <span className="text-sm font-semibold">{invoice.customer_name}</span>
              </div>
              {invoice.customer_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-3 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground" dir="ltr">{invoice.customer_phone}</span>
                </div>
              )}
              {invoice.customer_email && (
                <div className="flex items-center gap-2">
                  <Mail className="size-3 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground" dir="ltr">{invoice.customer_email}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Items table */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground mb-3">اقلام فاکتور</h3>
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground">
                    <th className="text-right py-2.5 px-3 font-semibold">#</th>
                    <th className="text-right py-2.5 px-3 font-semibold">توضیحات</th>
                    <th className="text-center py-2.5 px-3 font-semibold">تعداد</th>
                    <th className="text-center py-2.5 px-3 font-semibold">قیمت واحد</th>
                    <th className="text-left py-2.5 px-3 font-semibold">جمع</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="border-t border-border/30">
                      <td className="py-2.5 px-3 tabular-nums">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium">{item.description || '—'}</td>
                      <td className="py-2.5 px-3 text-center tabular-nums">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-center tabular-nums">{formatNumber(item.unitPrice)}</td>
                      <td className="py-2.5 px-3 text-left tabular-nums font-bold">
                        {formatNumber(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">جمع اقلام</span>
              <span className="font-bold tabular-nums">{formatToman(invoice.amount_toman)}</span>
            </div>
            {invoice.tax_toman > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">مالیات</span>
                <span className="font-bold tabular-nums text-amber-600">+{formatToman(invoice.tax_toman)}</span>
              </div>
            )}
            {invoice.discount_toman > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">تخفیف</span>
                <span className="font-bold tabular-nums text-emerald-600">-{formatToman(invoice.discount_toman)}</span>
              </div>
            )}
            <Separator className="bg-gold/20" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold">مبلغ نهایی</span>
              <span className="text-lg font-extrabold gold-gradient-text tabular-nums">
                {formatToman(invoice.total_toman)}
              </span>
            </div>
            {goldEquivalent > 0 && (
              <div className="rounded-lg bg-gold/5 border border-gold/10 p-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Coins className="size-3.5 text-gold" />
                    معادل طلای آبشده
                  </span>
                  <span className="font-bold text-gold tabular-nums">
                    {formatGrams(goldEquivalent)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Due date */}
          {invoice.due_date && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
              <Calendar className="size-4 shrink-0" />
              <span>
                تاریخ سررسید: <span className="font-semibold text-foreground">{formatDate(invoice.due_date)}</span>
              </span>
            </div>
          )}

          {/* Paid date */}
          {invoice.paid_at && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3 text-xs text-emerald-700 dark:text-emerald-400">
              <Check className="size-4 shrink-0" />
              <span>
                تاریخ پرداخت: <span className="font-semibold">{formatDateTime(invoice.paid_at)}</span>
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/50 bg-muted/20 px-5 py-3">
          <p className="text-[10px] text-muted-foreground text-center">
            این فاکتور از طریق درگاه پرداخت طلایی زرین گلد صادر شده است
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Main InvoiceView Component                                                */
/* ═══════════════════════════════════════════════════════════════════════════════ */

export default function InvoiceView() {
  const { user } = useAppStore();
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'preview'>('create');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  /* ── Fetch invoices for stats ── */
  const fetchInvoices = useCallback(async () => {
    if (!user?.id) return;
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/v1/merchant/invoices?userId=${user.id}&limit=100`);
      const json = await res.json();
      if (json.success && json.data?.invoices) {
        setInvoices(json.data.invoices);
      }
    } catch {
      // Silently fail for stats
    } finally {
      setStatsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  /* ── Stats ── */
  const totalInvoices = invoices.length;
  const pendingInvoices = invoices.filter((i) => i.status === 'pending').length;
  const paidInvoices = invoices.filter((i) => i.status === 'paid').length;
  const totalRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.total_toman, 0);

  /* ── Select invoice → switch to preview ── */
  const handleSelectInvoice = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setActiveTab('preview');
  }, []);

  /* ── Handle back from preview → go to list ── */
  const handleBackFromPreview = useCallback(() => {
    setSelectedInvoice(null);
    setActiveTab('list');
    fetchInvoices(); // Refresh list
  }, [fetchInvoices]);

  /* ── Tab config ── */
  const tabs = [
    { key: 'create' as const, label: 'ایجاد فاکتور', icon: <Plus className="size-4" /> },
    { key: 'list' as const, label: 'فاکتورها', icon: <FileText className="size-4" /> },
    { key: 'preview' as const, label: 'پیش‌نمایش', icon: <Eye className="size-4" /> },
  ];

  /* Don't show preview tab in nav if no invoice is selected */
  const visibleTabs = selectedInvoice ? tabs : tabs.filter((t) => t.key !== 'preview');

  return (
    <div className="page-transition mx-auto max-w-3xl space-y-5 pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-gold-dark shadow-lg shadow-gold/20">
          <FileText className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold">مدیریت فاکتورها</h1>
          <p className="text-xs text-muted-foreground">ایجاد و پیگیری فاکتورهای فروش</p>
        </div>
      </motion.div>

      {/* Stats summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-4 gap-2"
      >
        <div className="rounded-xl border border-gold/15 bg-gold/5 p-3 text-center">
          <p className="text-[9px] text-muted-foreground">کل</p>
          <p className="mt-0.5 text-base font-extrabold text-gold tabular-nums">
            {statsLoading ? '—' : formatNumber(totalInvoices)}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
          <p className="text-[9px] text-muted-foreground">در انتظار</p>
          <p className="mt-0.5 text-base font-extrabold text-amber-600 tabular-nums">
            {statsLoading ? '—' : formatNumber(pendingInvoices)}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
          <p className="text-[9px] text-muted-foreground">پرداخت شده</p>
          <p className="mt-0.5 text-base font-extrabold text-emerald-600 tabular-nums">
            {statsLoading ? '—' : formatNumber(paidInvoices)}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
          <p className="text-[9px] text-muted-foreground">درآمد</p>
          <p className="mt-0.5 text-base font-extrabold tabular-nums">
            {statsLoading ? '—' : totalRevenue > 0 ? formatPrice(totalRevenue) : '۰'}
          </p>
        </div>
      </motion.div>

      {/* Tab Switcher */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex rounded-xl border border-border/50 bg-muted/30 p-1"
      >
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[11px] font-bold transition-all duration-200 ${
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
        {/* ── Create Invoice ── */}
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
                  ایجاد فاکتور جدید
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CreateInvoiceTab onCreated={fetchInvoices} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Invoice List ── */}
        {activeTab === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <InvoiceListTab onSelectInvoice={handleSelectInvoice} />
          </motion.div>
        )}

        {/* ── Invoice Preview ── */}
        {activeTab === 'preview' && selectedInvoice && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <InvoicePreviewTab invoice={selectedInvoice} onBack={handleBackFromPreview} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  Local helpers                                                             */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function formatPrice(price: number): string {
  if (price >= 1_000_000_000) {
    return `${formatNumber(Math.round(price / 1_000_000_000))}میلیارد`;
  }
  if (price >= 1_000_000) {
    return `${formatNumber(Math.round(price / 1_000_000))}M`;
  }
  if (price >= 1_000) {
    return `${formatNumber(Math.round(price / 1_000))}K`;
  }
  return formatNumber(price);
}

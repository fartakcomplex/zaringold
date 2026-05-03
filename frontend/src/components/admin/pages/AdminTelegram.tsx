
import React, { useState, useEffect, useCallback } from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription} from '@/components/ui/dialog';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Textarea} from '@/components/ui/textarea';
import {Separator} from '@/components/ui/separator';
import {Label} from '@/components/ui/label';
import {Switch} from '@/components/ui/switch';
import {Bot, Send, Bell, FileText, Users, Settings, MessageSquare, AlertTriangle, TrendingUp, RefreshCw, Search, Plus, Trash2, Edit, Eye, CheckCircle, XCircle, ExternalLink, Copy, Link2, Unlink, Radio, ShieldCheck, BarChart3, Zap, Clock} from 'lucide-react';
import {useAppStore} from '@/lib/store';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface LinkedUser {
  id: string;
  fullName: string;
  phone: string;
  telegramUsername: string;
  telegramId: number;
  chatId: number;
  isB2B: boolean;
  createdAt: string;
}

interface PriceAlert {
  id: string;
  userName: string;
  userId: string;
  assetType: string;
  condition: string;
  targetPrice: number;
  isActive: boolean;
  isTriggered: boolean;
  createdAt: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  weight: number;
  pricePerGram: number;
  ejrat: number;
  tax: number;
  finalPrice: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  createdAt: string;
}

interface B2BCustomer {
  id: string;
  name: string;
  phone: string;
  totalInvoices: number;
  totalSpent: number;
  notes: string;
  createdAt: string;
}

interface MessageLog {
  id: string;
  userName: string;
  direction: 'in' | 'out';
  message: string;
  timestamp: string;
}

interface ActivityLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  detail: string;
}

interface BotSettings {
  botToken: string;
  webhookUrl: string;
  autoRefreshInterval: number;
  dailyReportTime: string;
  isBotActive: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock Data                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const mockLinkedUsers: LinkedUser[] = [
  { id: '1', fullName: 'علی محمدی', phone: '09938360723', telegramUsername: '@ali_m', telegramId: 123456789, chatId: 987654321, isB2B: true, createdAt: '1404/01/15' },
  { id: '2', fullName: 'سارا احمدی', phone: '09121234567', telegramUsername: '@sara_a', telegramId: 234567890, chatId: 876543210, isB2B: false, createdAt: '1404/01/20' },
  { id: '3', fullName: 'محمد رضایی', phone: '09351234567', telegramUsername: '@moh_r', telegramId: 345678901, chatId: 765432109, isB2B: true, createdAt: '1404/02/01' },
  { id: '4', fullName: 'فاطمه حسینی', phone: '09191234567', telegramUsername: '@fatemeh_h', telegramId: 456789012, chatId: 654321098, isB2B: false, createdAt: '1404/02/05' },
  { id: '5', fullName: 'حسین کریمی', phone: '09361234567', telegramUsername: '@hos_k', telegramId: 567890123, chatId: 543210987, isB2B: true, createdAt: '1404/02/10' },
  { id: '6', fullName: 'مریم نوری', phone: '09161234567', telegramUsername: null as unknown as string, telegramId: 678901234, chatId: 432109876, isB2B: false, createdAt: '1404/02/15' },
  { id: '7', fullName: 'رضا عباسی', phone: '09331234567', telegramUsername: '@reza_ab', telegramId: 789012345, chatId: 321098765, isB2B: true, createdAt: '1404/02/20' },
  { id: '8', fullName: 'زهرا موسوی', phone: '09131234567', telegramUsername: '@zah_m', telegramId: 890123456, chatId: 210987654, isB2B: false, createdAt: '1404/03/01' },
  { id: '9', fullName: 'امیر طاهری', phone: '09381234567', telegramUsername: '@amir_t', telegramId: 901234567, chatId: 109876543, isB2B: false, createdAt: '1404/03/05' },
  { id: '10', fullName: 'نازنین حسنی', phone: '09151234567', telegramUsername: '@naz_h', telegramId: 112345678, chatId: 198765432, isB2B: true, createdAt: '1404/03/10' },
];

const mockAlerts: PriceAlert[] = [
  { id: '1', userName: 'علی محمدی', userId: '1', assetType: 'gold18', condition: 'above', targetPrice: 4500000, isActive: true, isTriggered: false, createdAt: '1404/02/10' },
  { id: '2', userName: 'سارا احمدی', userId: '2', assetType: 'gold24', condition: 'below', targetPrice: 3800000, isActive: true, isTriggered: false, createdAt: '1404/02/12' },
  { id: '3', userName: 'محمد رضایی', userId: '3', assetType: 'ounce', condition: 'above', targetPrice: 2400, isActive: true, isTriggered: false, createdAt: '1404/02/15' },
  { id: '4', userName: 'فاطمه حسینی', userId: '4', assetType: 'gold18', condition: 'above', targetPrice: 4200000, isActive: false, isTriggered: true, createdAt: '1404/01/20' },
  { id: '5', userName: 'حسین کریمی', userId: '5', assetType: 'mesghal', condition: 'below', targetPrice: 25000000, isActive: true, isTriggered: false, createdAt: '1404/02/20' },
  { id: '6', userName: 'مریم نوری', userId: '6', assetType: 'gold18', condition: 'above', targetPrice: 4600000, isActive: false, isTriggered: true, createdAt: '1404/01/25' },
  { id: '7', userName: 'رضا عباسی', userId: '7', assetType: 'gold24', condition: 'below', targetPrice: 3700000, isActive: true, isTriggered: false, createdAt: '1404/02/25' },
  { id: '8', userName: 'زهرا موسوی', userId: '8', assetType: 'ounce', condition: 'above', targetPrice: 2350, isActive: true, isTriggered: false, createdAt: '1404/03/01' },
];

const mockInvoices: Invoice[] = [
  { id: '1', invoiceNumber: 'INV-1404-001', customerName: 'علی محمدی', weight: 50, pricePerGram: 4200000, ejrat: 1050000, tax: 525000, finalPrice: 225750000, status: 'paid', createdAt: '1404/02/10' },
  { id: '2', invoiceNumber: 'INV-1404-002', customerName: 'محمد رضایی', weight: 100, pricePerGram: 4150000, ejrat: 2075000, tax: 1037500, finalPrice: 446125000, status: 'paid', createdAt: '1404/02/15' },
  { id: '3', invoiceNumber: 'INV-1404-003', customerName: 'حسین کریمی', weight: 30, pricePerGram: 4250000, ejrat: 637500, tax: 318750, finalPrice: 137062500, status: 'sent', createdAt: '1404/02/20' },
  { id: '4', invoiceNumber: 'INV-1404-004', customerName: 'رضا عباسی', weight: 75, pricePerGram: 4300000, ejrat: 1612500, tax: 806250, finalPrice: 342687500, status: 'draft', createdAt: '1404/02/25' },
  { id: '5', invoiceNumber: 'INV-1404-005', customerName: 'نازنین حسنی', weight: 20, pricePerGram: 4180000, ejrat: 418000, tax: 209000, finalPrice: 89870000, status: 'cancelled', createdAt: '1404/03/01' },
  { id: '6', invoiceNumber: 'INV-1404-006', customerName: 'علی محمدی', weight: 40, pricePerGram: 4220000, ejrat: 844000, tax: 422000, finalPrice: 181460000, status: 'paid', createdAt: '1404/03/05' },
  { id: '7', invoiceNumber: 'INV-1404-007', customerName: 'محمد رضایی', weight: 60, pricePerGram: 4190000, ejrat: 1257000, tax: 628500, finalPrice: 264555000, status: 'sent', createdAt: '1404/03/08' },
];

const mockCustomers: B2BCustomer[] = [
  { id: '1', name: 'علی محمدی', phone: '09938360723', totalInvoices: 2, totalSpent: 407210000, notes: 'مشتری ویژه - تخفیف ویژه', createdAt: '1404/01/15' },
  { id: '2', name: 'محمد رضایی', phone: '09351234567', totalInvoices: 2, totalSpent: 710680000, notes: 'خرید عمده - تماس قبل از ارسال', createdAt: '1404/02/01' },
  { id: '3', name: 'حسین کریمی', phone: '09361234567', totalInvoices: 1, totalSpent: 137062500, notes: '', createdAt: '1404/02/10' },
  { id: '4', name: 'رضا عباسی', phone: '09331234567', totalInvoices: 1, totalSpent: 342687500, notes: 'آدرس جدید - بررسی شود', createdAt: '1404/02/20' },
  { id: '5', name: 'نازنین حسنی', phone: '09151234567', totalInvoices: 1, totalSpent: 0, notes: 'فاکتور لغو شده', createdAt: '1404/03/10' },
];

const mockMessages: MessageLog[] = [
  { id: '1', userName: 'علی محمدی', direction: 'in', message: 'سلام، قیمت طلای ۱۸ عیار الان چنده؟', timestamp: '1404/03/10 - 14:30' },
  { id: '2', userName: 'علی محمدی', direction: 'out', message: 'سلام! قیمت طلای ۱۸ عیار الان ۴,۲۵۰,۰۰۰ واحد طلایی است.', timestamp: '1404/03/10 - 14:30' },
  { id: '3', userName: 'سارا احمدی', direction: 'in', message: '/start', timestamp: '1404/03/10 - 15:00' },
  { id: '4', userName: 'سارا احمدی', direction: 'out', message: 'به ربات زرین گلد خوش آمدید! 🏅\n\nلطفاً شماره موبایل خود را وارد کنید تا حساب شما متصل شود.', timestamp: '1404/03/10 - 15:00' },
  { id: '5', userName: 'محمد رضایی', direction: 'in', message: 'گزارش امروز رو بفرست', timestamp: '1404/03/10 - 16:15' },
  { id: '6', userName: 'محمد رضایی', direction: 'out', message: '📊 گزارش بازار - ۱۴۰۴/۰۳/۱۰\n\n🥇 طلای ۱۸: ۴,۲۵۰,۰۰۰ واحد طلایی\n🥈 سکه امامی: ۵۲,۰۰۰,۰۰۰ واحد طلایی\n📊 اونس جهانی: ۲,۳۸۵ دلار\n\n📈 تغییرات: +۱.۲٪', timestamp: '1404/03/10 - 16:15' },
  { id: '7', userName: 'فاطمه حسینی', direction: 'in', message: 'هشدار قیمت تنظیم کن: طلای ۱۸ بالای ۴,۴۰۰,۰۰۰', timestamp: '1404/03/10 - 17:30' },
  { id: '8', userName: 'فاطمه حسینی', direction: 'out', message: '✅ هشدار قیمت ثبت شد!\n\nآلیات: طلای ۱۸ عیار\nشرط: بالاتر از ۴,۴۰۰,۰۰۰ واحد طلایی\n\nبه محض رسیدن قیمت، بهت اطلاع میدیم! 🔔', timestamp: '1404/03/10 - 17:30' },
  { id: '9', userName: 'حسین کریمی', direction: 'in', message: 'فاکتور B2B جدید ایجاد کن', timestamp: '1404/03/10 - 18:00' },
  { id: '10', userName: 'حسین کریمی', direction: 'out', message: '📝 ایجاد فاکتور B2B\n\nلطفاً اطلاعات زیر را وارد کنید:\n1. نام مشتری\n2. وزن طلا (گرم)\n3. نوع طلا', timestamp: '1404/03/10 - 18:00' },
  { id: '11', userName: 'علی محمدی', direction: 'in', message: 'موجودی حساب من چقدره؟', timestamp: '1404/03/11 - 09:00' },
  { id: '12', userName: 'علی محمدی', direction: 'out', message: '💰 موجودی شما:\n\n🥇 طلای ۱۸: ۱۲.۵ گرم\n💵 واحد طلایی: ۵,۲۰۰,۰۰۰\n📊 ارزش تقریبی: ۵۸,۱۲۵,۰۰۰ واحد طلایی', timestamp: '1404/03/11 - 09:00' },
  { id: '13', userName: 'زهرا موسوی', direction: 'in', message: '/alerts', timestamp: '1404/03/11 - 10:30' },
  { id: '14', userName: 'زهرا موسوی', direction: 'out', message: '🔔 هشدارهای فعال شما:\n\n1. اونس جهانی بالاتر از ۲,۳۵۰ دلار\n\nتنظیم هشدار جدید: /newalert', timestamp: '1404/03/11 - 10:30' },
  { id: '15', userName: 'نازنین حسنی', direction: 'in', message: 'سلام، میخوام خرید عمده انجام بدم', timestamp: '1404/03/11 - 11:00' },
];

const mockActivityLog: ActivityLog[] = [
  { id: '1', action: 'اتصال کاربر', user: 'علی محمدی', timestamp: '1404/03/11 - 09:15', detail: 'حساب تلگرام با شماره 09938360723 متصل شد' },
  { id: '2', action: 'ارسال پیام', user: 'سیستم', timestamp: '1404/03/11 - 08:00', detail: 'گزارش روزانه برای ۵ کاربر فعال ارسال شد' },
  { id: '3', action: 'هشدار فعال', user: 'فاطمه حسینی', timestamp: '1404/03/10 - 22:30', detail: 'هشدار طلای ۱۸ بالای ۴,۲۰۰,۰۰۰ فعال شد' },
  { id: '4', action: 'فاکتور پرداخت', user: 'محمد رضایی', timestamp: '1404/03/10 - 16:45', detail: 'فاکتور INV-1404-002 پرداخت شد' },
  { id: '5', action: 'عضویت B2B', user: 'نازنین حسنی', timestamp: '1404/03/10 - 14:00', detail: 'کاربر جدید در بخش B2B ثبت شد' },
  { id: '6', action: 'لغو فاکتور', user: 'نازنین حسنی', timestamp: '1404/03/10 - 15:30', detail: 'فاکتور INV-1404-005 لغو شد' },
  { id: '7', action: 'اتصال کاربر', user: 'زهرا موسوی', timestamp: '1404/03/09 - 18:20', detail: 'حساب تلگرام با شماره 09131234567 متصل شد' },
  { id: '8', action: 'ارسال پیام', user: 'ادمین', timestamp: '1404/03/09 - 12:00', detail: 'پیام همگانی برای ۸ کاربر ارسال شد' },
  { id: '9', action: 'هشدار فعال', user: 'مریم نوری', timestamp: '1404/03/08 - 20:15', detail: 'هشدار طلای ۱۸ بالای ۴,۶۰۰,۰۰۰ فعال شد' },
  { id: '10', action: 'تنظیمات ربات', user: 'مدیر سیستم', timestamp: '1404/03/08 - 09:00', detail: 'فاصله بروزرسانی خودکار به ۵ دقیقه تغییر کرد' },
];

const mockSettings: BotSettings = {
  botToken: '7234567890:AAH8kZz5tF3xYbN2mQpLrS7uVwX1yZ4aBc',
  webhookUrl: 'https://api.zarringold.ir/api/telegram/webhook',
  autoRefreshInterval: 5,
  dailyReportTime: '08:00',
  isBotActive: true,
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper Functions                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price);
}

function getAssetLabel(type: string): string {
  switch (type) {
    case 'gold18': return 'طلای ۱۸ عیار';
    case 'gold24': return 'طلای ۲۴ عیار';
    case 'mesghal': return 'مثقال طلا';
    case 'ounce': return 'اونس جهانی';
    default: return type;
  }
}

function getConditionLabel(condition: string): string {
  switch (condition) {
    case 'above': return 'بالاتر از';
    case 'below': return 'پایین‌تر از';
    case 'crosses': return 'عبور از';
    default: return condition;
  }
}

function getInvoiceStatusLabel(status: string): { label: string; color: string } {
  switch (status) {
    case 'draft': return { label: 'پیش‌نویس', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
    case 'sent': return { label: 'ارسال شده', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' };
    case 'paid': return { label: 'پرداخت شده', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
    case 'cancelled': return { label: 'لغو شده', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' };
    default: return { label: status, color: 'bg-gray-100 text-gray-700' };
  }
}

function maskToken(token: string): string {
  if (!token) return '';
  const parts = token.split(':');
  if (parts.length >= 2) {
    const botPart = parts[1];
    return `${parts[0].substring(0, 4)}****:${botPart.substring(0, 4)}****`;
  }
  return token.substring(0, 6) + '****';
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Animation Variants                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

const cardVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

const tableRowVariants: any = {
  hidden: { opacity: 0, x: 10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.3 },
  }),
};

const fadeInUp: any = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Animated Counter                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 800;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <span className="tabular-nums">
      {new Intl.NumberFormat('fa-IR').format(display)}{suffix}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AdminTelegram() {
  const { addToast } = useAppStore();

  // Tab state
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dashboard
  const [stats, setStats] = useState({
    totalUsers: mockLinkedUsers.length,
    activeAlerts: mockAlerts.filter(a => a.isActive && !a.isTriggered).length,
    totalInvoices: mockInvoices.length,
    b2bCustomers: mockCustomers.length,
    activeSubs: 6,
  });

  // Linked Users
  const [userSearch, setUserSearch] = useState('');
  const [sendMessageDialog, setSendMessageDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LinkedUser | null>(null);
  const [messageText, setMessageText] = useState('');
  const [unlinkDialog, setUnlinkDialog] = useState(false);

  // Alerts
  const [alertFilterType, setAlertFilterType] = useState('all');
  const [alertFilterCondition, setAlertFilterCondition] = useState('all');
  const [alertFilterStatus, setAlertFilterStatus] = useState('all');

  // Invoices
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState('all');
  const [invoiceDetailDialog, setInvoiceDetailDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Customers
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDialog, setCustomerDialog] = useState(false);
  const [editCustomerDialog, setEditCustomerDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<B2BCustomer | null>(null);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', notes: '' });
  const [deleteCustomerDialog, setDeleteCustomerDialog] = useState(false);

  // Bot Settings
  const [botSettings, setBotSettings] = useState<BotSettings>(mockSettings);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [showToken, setShowToken] = useState(false);

  // Message Log
  const [msgFilterUser, setMsgFilterUser] = useState('all');
  const [msgFilterDir, setMsgFilterDir] = useState('all');

  // Data states
  const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>(mockLinkedUsers);
  const [alerts, setAlerts] = useState<PriceAlert[]>(mockAlerts);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [customers, setCustomers] = useState<B2BCustomer[]>(mockCustomers);
  const [messages] = useState<MessageLog[]>(mockMessages);

  // Fetch dashboard stats
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/admin/telegram');
        if (res.ok && !cancelled) {
          const json = await res.json();
          if (json.success && json.data) {
            setStats(json.data);
          }
        }
      } catch {
        // keep initial mock values
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/telegram');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setStats(json.data);
        }
      }
    } catch {
      // keep current values
    }
  }, []);

  /* ─── Handlers ─── */

  const handleSendMessage = () => {
    if (!selectedUser || !messageText.trim()) return;
    addToast(`پیام به ${selectedUser.fullName} ارسال شد`, 'success');
    setMessageText('');
    setSendMessageDialog(false);
    setSelectedUser(null);
  };

  const handleUnlinkUser = () => {
    if (!selectedUser) return;
    setLinkedUsers(prev => prev.filter(u => u.id !== selectedUser.id));
    addToast(`حساب ${selectedUser.fullName} قطع شد`, 'success');
    setUnlinkDialog(false);
    setSelectedUser(null);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    addToast('هشدار حذف شد', 'success');
  };

  const handleUpdateInvoiceStatus = (id: string, status: Invoice['status']) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
    addToast(`وضعیت فاکتور به "${getInvoiceStatusLabel(status).label}" تغییر کرد`, 'success');
  };

  const handleAddCustomer = () => {
    if (!customerForm.name.trim()) return;
    const newCustomer: B2BCustomer = {
      id: String(Date.now()),
      name: customerForm.name,
      phone: customerForm.phone,
      totalInvoices: 0,
      totalSpent: 0,
      notes: customerForm.notes,
      createdAt: '1404/03/11',
    };
    setCustomers(prev => [newCustomer, ...prev]);
    addToast(`مشتری "${newCustomer.name}" اضافه شد`, 'success');
    setCustomerDialog(false);
    setCustomerForm({ name: '', phone: '', notes: '' });
  };

  const handleEditCustomer = () => {
    if (!selectedCustomer) return;
    setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? {
      ...c, name: customerForm.name, phone: customerForm.phone, notes: customerForm.notes
    } : c));
    addToast('مشتری بروزرسانی شد', 'success');
    setEditCustomerDialog(false);
    setSelectedCustomer(null);
    setCustomerForm({ name: '', phone: '', notes: '' });
  };

  const handleDeleteCustomer = () => {
    if (!selectedCustomer) return;
    setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));
    addToast('مشتری حذف شد', 'success');
    setDeleteCustomerDialog(false);
    setSelectedCustomer(null);
  };

  const handleBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    addToast(`پیام همگانی برای ${stats.totalUsers} کاربر ارسال شد`, 'success');
    setBroadcastMessage('');
  };

  const handleTestNotification = () => {
    addToast('اعلان تست به ادمین ارسال شد', 'success');
  };

  const handleSaveSettings = () => {
    addToast('تنظیمات ذخیره شد', 'success');
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(botSettings.botToken);
    addToast('توکن کپی شد', 'success');
  };

  /* ─── Filtered data ─── */

  const filteredUsers = linkedUsers.filter(u =>
    !userSearch ||
    u.fullName.includes(userSearch) ||
    u.phone.includes(userSearch) ||
    (u.telegramUsername || '').includes(userSearch)
  );

  const filteredAlerts = alerts.filter(a => {
    if (alertFilterType !== 'all' && a.assetType !== alertFilterType) return false;
    if (alertFilterCondition !== 'all' && a.condition !== alertFilterCondition) return false;
    if (alertFilterStatus === 'active' && (!a.isActive || a.isTriggered)) return false;
    if (alertFilterStatus === 'triggered' && !a.isTriggered) return false;
    return true;
  });

  const filteredInvoices = invoices.filter(inv =>
    invoiceFilterStatus === 'all' || inv.status === invoiceFilterStatus
  );

  const filteredCustomers = customers.filter(c =>
    !customerSearch ||
    c.name.includes(customerSearch) ||
    c.phone.includes(customerSearch)
  );

  const filteredMessages = messages.filter(m => {
    if (msgFilterUser !== 'all' && m.userName !== msgFilterUser) return false;
    if (msgFilterDir !== 'all' && m.direction !== msgFilterDir) return false;
    return true;
  });

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
          <Bot className="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">مدیریت ربات تلگرام</h1>
          <p className="text-sm text-muted-foreground">مانیتورینگ و مدیریت ربات تلگرام زرین گلد</p>
        </div>
        <div className="mr-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStats}
            className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20"
          >
            <RefreshCw className="size-4" />
            بروزرسانی
          </Button>
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <Radio className="ml-1 size-3 animate-pulse" />
            فعال
          </Badge>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full flex-wrap gap-1 bg-muted/50 p-1 h-auto">
          {[
            { value: 'dashboard', label: 'داشبورد', icon: BarChart3 },
            { value: 'users', label: 'کاربران متصل', icon: Users },
            { value: 'trading', label: 'معاملات ربات', icon: TrendingUp },
            { value: 'alerts', label: 'هشدارهای قیمت', icon: Bell },
            { value: 'invoices', label: 'فاکتورهای B2B', icon: FileText },
            { value: 'customers', label: 'مشتریان B2B', icon: TrendingUp },
            { value: 'settings', label: 'تنظیمات ربات', icon: Settings },
            { value: 'logs', label: 'لاگ پیام‌ها', icon: MessageSquare },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-amber-600 data-[state=active]:shadow-sm"
            >
              <tab.icon className="size-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  Tab 1: Dashboard                                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="dashboard" className="mt-6 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key="dashboard"
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { label: 'کاربران متصل', value: stats.totalUsers, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                  { label: 'هشدارهای فعال', value: stats.activeAlerts, icon: Bell, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                  { label: 'فاکتورها', value: stats.totalInvoices, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { label: 'مشتریان B2B', value: stats.b2bCustomers, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: 'اشتراک فعال', value: stats.activeSubs, icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                ].map((stat, i) => (
                  <motion.div key={stat.label} custom={i} variants={cardVariants} initial="hidden" animate="visible">
                    <Card className="group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-amber-100 dark:border-amber-900/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`flex size-9 items-center justify-center rounded-lg ${stat.bg}`}>
                            <stat.icon className={`size-4.5 ${stat.color}`} />
                          </div>
                          <TrendingUp className="size-4 text-muted-foreground/40" />
                        </div>
                        <p className={`text-2xl font-bold ${stat.color}`}>
                          <AnimatedCounter value={stat.value} />
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions + Activity Log */}
              <div className="grid gap-4 lg:grid-cols-3">
                {/* Quick Actions */}
                <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible">
                  <Card className="border-amber-100 dark:border-amber-900/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Zap className="size-4 text-amber-600" />
                        عملیات سریع
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/20"
                        onClick={() => setActiveTab('settings')}
                      >
                        <Send className="size-4 text-amber-600" />
                        ارسال پیام همگانی
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/20"
                        onClick={() => setActiveTab('users')}
                      >
                        <Users className="size-4 text-blue-600" />
                        ارسال به کاربر خاص
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/20"
                        onClick={() => setActiveTab('alerts')}
                      >
                        <Bell className="size-4 text-orange-600" />
                        مدیریت هشدارها
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/20"
                        onClick={() => setActiveTab('settings')}
                      >
                        <Settings className="size-4 text-purple-600" />
                        تنظیمات ربات
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Recent Activity */}
                <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible" className="lg:col-span-2">
                  <Card className="border-amber-100 dark:border-amber-900/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="size-4 text-amber-600" />
                        فعالیت‌های اخیر
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {mockActivityLog.map((log, i) => (
                          <motion.div
                            key={log.id}
                            custom={i}
                            variants={tableRowVariants}
                            initial="hidden"
                            animate="visible"
                            className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50"
                          >
                            <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              log.action.includes('اتصال') ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' :
                              log.action.includes('هشدار') ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400' :
                              log.action.includes('فاکتور') ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' :
                              log.action.includes('لغو') ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' :
                              'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                            }`}>
                              {log.action.includes('اتصال') ? '🔗' : log.action.includes('هشدار') ? '🔔' : log.action.includes('فاکتور') ? '📄' : log.action.includes('لغو') ? '❌' : '⚙️'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{log.action} — {log.user}</p>
                              <p className="text-xs text-muted-foreground truncate">{log.detail}</p>
                            </div>
                            <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap">{log.timestamp}</span>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  Tab 2: Linked Users                                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="users" className="mt-6 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div key="users" initial="hidden" animate="visible" exit="exit" variants={fadeInUp} className="space-y-4">
              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="جستجو بر اساس نام، شماره یا یوزرنیم..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pr-10 border-amber-200 focus:border-amber-400 dark:border-amber-800"
                />
              </div>

              {/* Table */}
              <Card className="border-amber-100 dark:border-amber-900/30">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-amber-100 dark:border-amber-900/30">
                          <TableHead>نام</TableHead>
                          <TableHead>تلفن</TableHead>
                          <TableHead>یوزرنیم تلگرام</TableHead>
                          <TableHead className="hidden md:table-cell">Telegram ID</TableHead>
                          <TableHead className="hidden lg:table-cell">Chat ID</TableHead>
                          <TableHead>B2B</TableHead>
                          <TableHead className="hidden sm:table-cell">تاریخ اتصال</TableHead>
                          <TableHead>عملیات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user, i) => (
                          <motion.tr
                            key={user.id}
                            custom={i}
                            variants={tableRowVariants}
                            initial="hidden"
                            animate="visible"
                            className="border-b last:border-0 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors"
                          >
                            <TableCell className="font-medium">{user.fullName}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{user.phone}</TableCell>
                            <TableCell>
                              <span className="text-sm text-blue-600 dark:text-blue-400">
                                {user.telegramUsername || '—'}
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">{user.telegramId}</TableCell>
                            <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">{user.chatId}</TableCell>
                            <TableCell>
                              {user.isB2B ? (
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-[10px]">B2B</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">عادی</Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{user.createdAt}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  onClick={() => { setSelectedUser(user); setSendMessageDialog(true); }}
                                >
                                  <Send className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => { setSelectedUser(user); setUnlinkDialog(true); }}
                                >
                                  <Unlink className="size-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {filteredUsers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Users className="size-10 mb-3 opacity-30" />
                      <p className="text-sm">کاربری یافت نشد</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <p className="text-xs text-muted-foreground text-center">
                نمایش {filteredUsers.length} از {linkedUsers.length} کاربر
              </p>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  Tab 3: Bot Trading Dashboard                                    */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="trading" className="mt-6 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div key="trading" initial="hidden" animate="visible" exit="exit" variants={fadeInUp} className="space-y-4">
              {/* Trading Stats */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'خریدهای ربات', value: 47, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', change: '+۱۲' },
                  { label: 'فروش‌های ربات', value: 23, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', change: '+۸٪' },
                  { label: 'حجم طلای معامله شده', value: '۱۸۵.۵ گرم', icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                  { label: 'درآمد کارمزد (۲۴ساعت)', value: '۲,۳۵۰,۰۰۰ ت', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                ].map((stat, i) => (
                  <motion.div key={stat.label} custom={i} variants={cardVariants} initial="hidden" animate="visible">
                    <Card className="border-amber-100 dark:border-amber-900/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className={`flex size-8 items-center justify-center rounded-lg ${stat.bg}`}>
                            <stat.icon className={`size-4 ${stat.color}`} />
                          </div>
                        </div>
                        <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                        {stat.change && <p className="text-[10px] text-emerald-600 mt-0.5">{stat.change} نسبت به هفته قبل</p>}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Bot Features Card */}
              <Card className="border-amber-100 dark:border-amber-900/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="size-4 text-amber-600" />
                    قابلیت‌های معاملاتی ربات تلگرام
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                          <TrendingUp className="size-4 text-emerald-600" />
                        </div>
                        <span className="text-sm font-semibold">🟢 خرید طلا</span>
                      </div>
                      <p className="text-xs text-muted-foreground">دستور <code className="bg-muted px-1 rounded">/buy</code></p>
                      <p className="text-xs text-muted-foreground mt-1">انتخاب نوع طلا، وارد کردن مقدار به گرم، تأیید قیمت و خرید فوری از کیف پول تومانی</p>
                    </div>
                    <div className="rounded-xl border border-red-200 dark:border-red-800/50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                          <TrendingUp className="size-4 text-red-600" />
                        </div>
                        <span className="text-sm font-semibold">🔴 فروش طلا</span>
                      </div>
                      <p className="text-xs text-muted-foreground">دستور <code className="bg-muted px-1 rounded">/sell</code></p>
                      <p className="text-xs text-muted-foreground mt-1">وارد کردن مقدار طلا برای فروش، نمایش محاسبه با کارمزد و واریز فوری به کیف پول</p>
                    </div>
                    <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <BarChart3 className="size-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-semibold">💰 موجودی حساب</span>
                      </div>
                      <p className="text-xs text-muted-foreground">دستور <code className="bg-muted px-1 rounded">/balance</code></p>
                      <p className="text-xs text-muted-foreground mt-1">نمایش کامل موجودی تومانی و طلایی، وضعیت کارت طلایی، آخرین تراکنش‌ها</p>
                    </div>
                    <div className="rounded-xl border border-purple-200 dark:border-purple-800/50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <FileText className="size-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-semibold">💳 کارت طلایی</span>
                      </div>
                      <p className="text-xs text-muted-foreground">دستور <code className="bg-muted px-1 rounded">/goldcard</code></p>
                      <p className="text-xs text-muted-foreground mt-1">بررسی وضعیت کارت، موجودی، سقف تراکنش روزانه/ماهانه، تراکنش‌های اخیر</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  Tab 4: Price Alerts                                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="alerts" className="mt-6 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div key="alerts" initial="hidden" animate="visible" exit="exit" variants={fadeInUp} className="space-y-4">
              {/* Alert Stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="border-amber-100 dark:border-amber-900/30">
                  <CardContent className="p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{alerts.length}</p>
                    <p className="text-[11px] text-muted-foreground">کل هشدارها</p>
                  </CardContent>
                </Card>
                <Card className="border-emerald-100 dark:border-emerald-900/30">
                  <CardContent className="p-3 text-center">
                    <p className="text-lg font-bold text-emerald-600">{alerts.filter(a => a.isActive && !a.isTriggered).length}</p>
                    <p className="text-[11px] text-muted-foreground">فعال</p>
                  </CardContent>
                </Card>
                <Card className="border-orange-100 dark:border-orange-900/30">
                  <CardContent className="p-3 text-center">
                    <p className="text-lg font-bold text-orange-600">{alerts.filter(a => a.isTriggered).length}</p>
                    <p className="text-[11px] text-muted-foreground">فعال شده</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Select value={alertFilterType} onValueChange={setAlertFilterType}>
                  <SelectTrigger className="w-[140px] h-9 text-xs border-amber-200 dark:border-amber-800">
                    <SelectValue placeholder="نوع دارایی" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه دارایی‌ها</SelectItem>
                    <SelectItem value="gold18">طلای ۱۸</SelectItem>
                    <SelectItem value="gold24">طلای ۲۴</SelectItem>
                    <SelectItem value="mesghal">مثقال</SelectItem>
                    <SelectItem value="ounce">اونس</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={alertFilterCondition} onValueChange={setAlertFilterCondition}>
                  <SelectTrigger className="w-[140px] h-9 text-xs border-amber-200 dark:border-amber-800">
                    <SelectValue placeholder="شرط" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه شرط‌ها</SelectItem>
                    <SelectItem value="above">بالاتر از</SelectItem>
                    <SelectItem value="below">پایین‌تر از</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={alertFilterStatus} onValueChange={setAlertFilterStatus}>
                  <SelectTrigger className="w-[130px] h-9 text-xs border-amber-200 dark:border-amber-800">
                    <SelectValue placeholder="وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="triggered">فعال شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <Card className="border-amber-100 dark:border-amber-900/30">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-amber-100 dark:border-amber-900/30">
                          <TableHead>کاربر</TableHead>
                          <TableHead>نوع دارایی</TableHead>
                          <TableHead>شرط</TableHead>
                          <TableHead>قیمت هدف</TableHead>
                          <TableHead>وضعیت</TableHead>
                          <TableHead className="hidden sm:table-cell">تاریخ</TableHead>
                          <TableHead>عملیات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAlerts.map((alert, i) => (
                          <motion.tr
                            key={alert.id}
                            custom={i}
                            variants={tableRowVariants}
                            initial="hidden"
                            animate="visible"
                            className="border-b last:border-0 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors"
                          >
                            <TableCell className="font-medium text-sm">{alert.userName}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px]">{getAssetLabel(alert.assetType)}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{getConditionLabel(alert.condition)}</TableCell>
                            <TableCell className="text-sm font-mono text-amber-600 dark:text-amber-400">
                              {alert.assetType === 'ounce' ? `$${formatPrice(alert.targetPrice)}` : `${formatPrice(alert.targetPrice)} ت`}
                            </TableCell>
                            <TableCell>
                              {alert.isTriggered ? (
                                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px]">
                                  <CheckCircle className="ml-1 size-3" />
                                  فعال شده
                                </Badge>
                              ) : alert.isActive ? (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px]">
                                  <Radio className="ml-1 size-3 animate-pulse" />
                                  فعال
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">
                                  <XCircle className="ml-1 size-3" />
                                  غیرفعال
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{alert.createdAt}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => handleDeleteAlert(alert.id)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {filteredAlerts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Bell className="size-10 mb-3 opacity-30" />
                      <p className="text-sm">هشداری یافت نشد</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  Tab 4: B2B Invoices                                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="invoices" className="mt-6 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div key="invoices" initial="hidden" animate="visible" exit="exit" variants={fadeInUp} className="space-y-4">
              {/* Status Filter */}
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'همه', count: invoices.length },
                  { value: 'draft', label: 'پیش‌نویس', count: invoices.filter(v => v.status === 'draft').length },
                  { value: 'sent', label: 'ارسال شده', count: invoices.filter(v => v.status === 'sent').length },
                  { value: 'paid', label: 'پرداخت شده', count: invoices.filter(v => v.status === 'paid').length },
                  { value: 'cancelled', label: 'لغو شده', count: invoices.filter(v => v.status === 'cancelled').length },
                ].map(filter => (
                  <Button
                    key={filter.value}
                    variant={invoiceFilterStatus === filter.value ? 'default' : 'outline'}
                    size="sm"
                    className={`text-xs ${invoiceFilterStatus === filter.value ? 'bg-amber-600 hover:bg-amber-700' : 'border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/20'}`}
                    onClick={() => setInvoiceFilterStatus(filter.value)}
                  >
                    {filter.label} ({filter.count})
                  </Button>
                ))}
              </div>

              {/* Table */}
              <Card className="border-amber-100 dark:border-amber-900/30">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-amber-100 dark:border-amber-900/30">
                          <TableHead>شماره فاکتور</TableHead>
                          <TableHead>مشتری</TableHead>
                          <TableHead className="hidden sm:table-cell">وزن (گرم)</TableHead>
                          <TableHead className="hidden md:table-cell">قیمت مبنای گرم</TableHead>
                          <TableHead className="hidden lg:table-cell">اجرت</TableHead>
                          <TableHead className="hidden lg:table-cell">مالیات</TableHead>
                          <TableHead>قیمت نهایی</TableHead>
                          <TableHead>وضعیت</TableHead>
                          <TableHead>عملیات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInvoices.map((inv, i) => {
                          const statusInfo = getInvoiceStatusLabel(inv.status);
                          return (
                            <motion.tr
                              key={inv.id}
                              custom={i}
                              variants={tableRowVariants}
                              initial="hidden"
                              animate="visible"
                              className="border-b last:border-0 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors"
                            >
                              <TableCell className="font-mono text-xs font-medium">{inv.invoiceNumber}</TableCell>
                              <TableCell className="text-sm font-medium">{inv.customerName}</TableCell>
                              <TableCell className="hidden sm:table-cell text-sm">{formatPrice(inv.weight)}</TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{formatPrice(inv.pricePerGram)}</TableCell>
                              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{formatPrice(inv.ejrat)}</TableCell>
                              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{formatPrice(inv.tax)}</TableCell>
                              <TableCell className="text-sm font-semibold text-amber-600 dark:text-amber-400">{formatPrice(inv.finalPrice)}</TableCell>
                              <TableCell>
                                <Badge className={`${statusInfo.color} text-[10px]`}>{statusInfo.label}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    onClick={() => { setSelectedInvoice(inv); setInvoiceDetailDialog(true); }}
                                  >
                                    <Eye className="size-3.5" />
                                  </Button>
                                  {inv.status === 'draft' && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                      title="ارسال"
                                      onClick={() => handleUpdateInvoiceStatus(inv.id, 'sent')}
                                    >
                                      <Send className="size-3.5" />
                                    </Button>
                                  )}
                                  {inv.status === 'sent' && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                      title="پرداخت"
                                      onClick={() => handleUpdateInvoiceStatus(inv.id, 'paid')}
                                    >
                                      <CheckCircle className="size-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {filteredInvoices.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <FileText className="size-10 mb-3 opacity-30" />
                      <p className="text-sm">فاکتوری یافت نشد</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  Tab 5: B2B Customers                                           */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="customers" className="mt-6 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div key="customers" initial="hidden" animate="visible" exit="exit" variants={fadeInUp} className="space-y-4">
              {/* Search + Add */}
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="جستجو نام یا شماره..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pr-10 border-amber-200 focus:border-amber-400 dark:border-amber-800"
                  />
                </div>
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                  onClick={() => { setCustomerForm({ name: '', phone: '', notes: '' }); setCustomerDialog(true); }}
                >
                  <Plus className="size-4" />
                  افزودن مشتری
                </Button>
              </div>

              {/* Table */}
              <Card className="border-amber-100 dark:border-amber-900/30">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-amber-100 dark:border-amber-900/30">
                          <TableHead>نام</TableHead>
                          <TableHead>تلفن</TableHead>
                          <TableHead>تعداد فاکتور</TableHead>
                          <TableHead>مجموع خرید</TableHead>
                          <TableHead className="hidden sm:table-cell">یادداشت</TableHead>
                          <TableHead>عملیات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCustomers.map((customer, i) => (
                          <motion.tr
                            key={customer.id}
                            custom={i}
                            variants={tableRowVariants}
                            initial="hidden"
                            animate="visible"
                            className="border-b last:border-0 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors"
                          >
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{customer.phone || '—'}</TableCell>
                            <TableCell className="text-sm">{customer.totalInvoices}</TableCell>
                            <TableCell className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                              {customer.totalSpent > 0 ? `${formatPrice(customer.totalSpent)} ت` : '—'}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                              {customer.notes || '—'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  onClick={() => {
                                    setSelectedCustomer(customer);
                                    setCustomerForm({ name: customer.name, phone: customer.phone || '', notes: customer.notes || '' });
                                    setEditCustomerDialog(true);
                                  }}
                                >
                                  <Edit className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => { setSelectedCustomer(customer); setDeleteCustomerDialog(true); }}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {filteredCustomers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <TrendingUp className="size-10 mb-3 opacity-30" />
                      <p className="text-sm">مشتری B2B یافت نشد</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  Tab 6: Bot Settings                                           */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="settings" className="mt-6 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div key="settings" initial="hidden" animate="visible" exit="exit" variants={fadeInUp} className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Bot Configuration */}
                <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
                  <Card className="border-amber-100 dark:border-amber-900/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <ShieldCheck className="size-4 text-amber-600" />
                        تنظیمات ربات
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Bot Active */}
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">وضعیت ربات</Label>
                        <Switch
                          checked={botSettings.isBotActive}
                          onCheckedChange={(checked) => setBotSettings(prev => ({ ...prev, isBotActive: checked }))}
                        />
                      </div>

                      {/* Bot Token */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">توکن ربات</Label>
                        <div className="flex gap-2">
                          <Input
                            type={showToken ? 'text' : 'password'}
                            value={showToken ? botSettings.botToken : maskToken(botSettings.botToken)}
                            readOnly
                            className="font-mono text-xs border-amber-200 dark:border-amber-800"
                          />
                          <Button variant="outline" size="icon" className="shrink-0 border-amber-200" onClick={() => setShowToken(!showToken)}>
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="shrink-0 border-amber-200" onClick={handleCopyToken}>
                            <Copy className="size-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Webhook URL */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">آدرس Webhook</Label>
                        <div className="flex gap-2">
                          <Input
                            value={botSettings.webhookUrl}
                            onChange={(e) => setBotSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                            className="font-mono text-xs border-amber-200 dark:border-amber-800"
                          />
                          <Button variant="outline" size="icon" className="shrink-0 border-amber-200">
                            <ExternalLink className="size-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Auto Refresh */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">فاصله بروزرسانی خودکار (دقیقه)</Label>
                        <Select
                          value={String(botSettings.autoRefreshInterval)}
                          onValueChange={(v) => setBotSettings(prev => ({ ...prev, autoRefreshInterval: Number(v) }))}
                        >
                          <SelectTrigger className="border-amber-200 dark:border-amber-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">۱ دقیقه</SelectItem>
                            <SelectItem value="3">۳ دقیقه</SelectItem>
                            <SelectItem value="5">۵ دقیقه</SelectItem>
                            <SelectItem value="10">۱۰ دقیقه</SelectItem>
                            <SelectItem value="15">۱۵ دقیقه</SelectItem>
                            <SelectItem value="30">۳۰ دقیقه</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Daily Report Time */}
                      <div className="space-y-1.5">
                        <Label className="text-sm">ساعت ارسال گزارش روزانه</Label>
                        <Input
                          type="time"
                          value={botSettings.dailyReportTime}
                          onChange={(e) => setBotSettings(prev => ({ ...prev, dailyReportTime: e.target.value }))}
                          className="border-amber-200 dark:border-amber-800 max-w-[180px]"
                        />
                      </div>

                      <Separator />

                      <div className="flex gap-2">
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2" onClick={handleSaveSettings}>
                          <Settings className="size-4" />
                          ذخیره تنظیمات
                        </Button>
                        <Button variant="outline" className="border-amber-200 gap-2" onClick={handleTestNotification}>
                          <Bell className="size-4 text-amber-600" />
                          ارسال اعلان تست
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Broadcast */}
                <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
                  <Card className="border-amber-100 dark:border-amber-900/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Send className="size-4 text-amber-600" />
                        ارسال پیام همگانی
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="inline size-3.5 ml-1" />
                        این پیام برای تمام {stats.totalUsers} کاربر متصل ارسال خواهد شد.
                        لطفاً قبل از ارسال، محتوای پیام را بررسی کنید.
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-sm">متن پیام</Label>
                        <Textarea
                          placeholder="متن پیام همگانی را بنویسید..."
                          value={broadcastMessage}
                          onChange={(e) => setBroadcastMessage(e.target.value)}
                          className="min-h-[160px] border-amber-200 dark:border-amber-800 resize-none"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          {broadcastMessage.length} کاراکتر
                        </p>
                      </div>

                      <Separator />

                      {/* Quick Templates */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">قالب‌های آماده</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: 'گزارش بازار', msg: '📊 گزارش بازار\n\n🥇 طلای ۱۸: ۴,۲۵۰,۰۰۰ واحد طلایی\n🥈 سکه امامی: ۵۲,۰۰۰,۰۰۰ واحد طلایی\n📊 اونس جهانی: ۲,۳۸۵ دلار' },
                            { label: 'تخفیف ویژه', msg: '🎉 تخفیف ویژه!\n\nفقط امروز کارمزد خرید طلا ۰٪! 🏅\n\nفرصت محدود — سریع اقدام کنید.' },
                            { label: 'هشدار نوسان', msg: '⚠️ هشدار نوسان بازار\n\nبازار طلا امروز با نوسانات شدید مواجه است. لطفاً با احتیاط معامله کنید.' },
                          ].map(template => (
                            <Button
                              key={template.label}
                              variant="outline"
                              size="sm"
                              className="text-[11px] border-amber-200 hover:bg-amber-50 dark:border-amber-800"
                              onClick={() => setBroadcastMessage(template.msg)}
                            >
                              {template.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Button
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2"
                        disabled={!broadcastMessage.trim()}
                        onClick={handleBroadcast}
                      >
                        <Send className="size-4" />
                        ارسال به {stats.totalUsers} کاربر
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  Tab 7: Message Logs                                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="logs" className="mt-6 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div key="logs" initial="hidden" animate="visible" exit="exit" variants={fadeInUp} className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Select value={msgFilterUser} onValueChange={setMsgFilterUser}>
                  <SelectTrigger className="w-[160px] h-9 text-xs border-amber-200 dark:border-amber-800">
                    <SelectValue placeholder="کاربر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه کاربران</SelectItem>
                    {[...new Set(messages.map(m => m.userName))].map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={msgFilterDir} onValueChange={setMsgFilterDir}>
                  <SelectTrigger className="w-[130px] h-9 text-xs border-amber-200 dark:border-amber-800">
                    <SelectValue placeholder="جهت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="in">دریافتی</SelectItem>
                    <SelectItem value="out">ارسالی</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Messages */}
              <Card className="border-amber-100 dark:border-amber-900/30">
                <CardContent className="p-0">
                  <div className="divide-y">
                    {filteredMessages.map((msg, i) => (
                      <motion.div
                        key={msg.id}
                        custom={i}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        className={`flex gap-3 p-4 transition-colors hover:bg-muted/50 ${
                          msg.direction === 'in' ? '' : 'bg-blue-50/30 dark:bg-blue-900/10'
                        }`}
                      >
                        <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          msg.direction === 'in'
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                            : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                        }`}>
                          {msg.direction === 'in' ? '↓' : '↑'}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{msg.userName}</span>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${
                                msg.direction === 'in'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                              }`}
                            >
                              {msg.direction === 'in' ? 'دریافتی' : 'ارسالی'}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">{msg.timestamp}</span>
                          </div>
                          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                            {msg.message}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {filteredMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <MessageSquare className="size-10 mb-3 opacity-30" />
                      <p className="text-sm">پیامی یافت نشد</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <p className="text-xs text-muted-foreground text-center">
                نمایش {filteredMessages.length} از {messages.length} پیام
              </p>
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  Dialogs                                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {/* Send Message Dialog */}
      <Dialog open={sendMessageDialog} onOpenChange={setSendMessageDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="size-4 text-amber-600" />
              ارسال پیام به {selectedUser?.fullName}
            </DialogTitle>
            <DialogDescription>
              پیام مستقیم از طریق ربات تلگرام ارسال می‌شود
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {selectedUser && (
              <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
                <p><span className="text-muted-foreground">تلفن:</span> {selectedUser.phone}</p>
                <p><span className="text-muted-foreground">یوزرنیم:</span> {selectedUser.telegramUsername || 'ندارد'}</p>
                <p><span className="text-muted-foreground">Chat ID:</span> <span className="font-mono">{selectedUser.chatId}</span></p>
              </div>
            )}
            <Textarea
              placeholder="متن پیام خود را بنویسید..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="min-h-[120px] border-amber-200 dark:border-amber-800"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setSendMessageDialog(false); setMessageText(''); }}>
              انصراف
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
              disabled={!messageText.trim()}
              onClick={handleSendMessage}
            >
              <Send className="size-4" />
              ارسال پیام
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlink Confirmation Dialog */}
      <Dialog open={unlinkDialog} onOpenChange={setUnlinkDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Unlink className="size-4" />
              قطع اتصال حساب
            </DialogTitle>
            <DialogDescription>
              آیا از قطع اتصال حساب تلگرام {selectedUser?.fullName} اطمینان دارید؟
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-xs text-red-700 dark:text-red-300">
            <AlertTriangle className="inline size-3.5 ml-1" />
            این عملیات قابل بازگشت نیست. کاربر باید دوباره حساب خود را متصل کند.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setUnlinkDialog(false)}>انصراف</Button>
            <Button variant="destructive" className="gap-2" onClick={handleUnlinkUser}>
              <Unlink className="size-4" />
              قطع اتصال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Dialog */}
      <Dialog open={invoiceDetailDialog} onOpenChange={setInvoiceDetailDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-4 text-amber-600" />
              جزئیات فاکتور
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-3">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">شماره فاکتور</span>
                  <span className="font-mono text-sm font-bold">{selectedInvoice.invoiceNumber}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">مشتری</span>
                  <span className="text-sm font-medium">{selectedInvoice.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">وزن (گرم)</span>
                  <span className="text-sm">{formatPrice(selectedInvoice.weight)} گرم</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">قیمت مبنای گرم</span>
                  <span className="text-sm">{formatPrice(selectedInvoice.pricePerGram)} واحد طلایی</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">اجرت</span>
                  <span className="text-sm">{formatPrice(selectedInvoice.ejrat)} واحد طلایی</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">مالیات (۵٪)</span>
                  <span className="text-sm">{formatPrice(selectedInvoice.tax)} واحد طلایی</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">قیمت نهایی</span>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatPrice(selectedInvoice.finalPrice)} واحد طلایی</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">وضعیت</span>
                  <Badge className={`${getInvoiceStatusLabel(selectedInvoice.status).color}`}>
                    {getInvoiceStatusLabel(selectedInvoice.status).label}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">تاریخ</span>
                  <span className="text-sm">{selectedInvoice.createdAt}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                {selectedInvoice.status === 'draft' && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                    onClick={() => { handleUpdateInvoiceStatus(selectedInvoice.id, 'sent'); setInvoiceDetailDialog(false); }}
                  >
                    <Send className="size-4" />
                    ارسال فاکتور
                  </Button>
                )}
                {selectedInvoice.status === 'sent' && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                    onClick={() => { handleUpdateInvoiceStatus(selectedInvoice.id, 'paid'); setInvoiceDetailDialog(false); }}
                  >
                    <CheckCircle className="size-4" />
                    تایید پرداخت
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={customerDialog} onOpenChange={setCustomerDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-4 text-amber-600" />
              افزودن مشتری B2B
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">نام مشتری *</Label>
              <Input
                value={customerForm.name}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="نام و نام خانوادگی"
                className="border-amber-200 dark:border-amber-800"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">شماره تلفن</Label>
              <Input
                value={customerForm.phone}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="09xxxxxxxxx"
                className="border-amber-200 dark:border-amber-800"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">یادداشت</Label>
              <Textarea
                value={customerForm.notes}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="توضیحات اختیاری..."
                className="min-h-[80px] border-amber-200 dark:border-amber-800"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCustomerDialog(false)}>انصراف</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
              disabled={!customerForm.name.trim()}
              onClick={handleAddCustomer}
            >
              <Plus className="size-4" />
              افزودن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editCustomerDialog} onOpenChange={setEditCustomerDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="size-4 text-amber-600" />
              ویرایش مشتری
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">نام مشتری *</Label>
              <Input
                value={customerForm.name}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                className="border-amber-200 dark:border-amber-800"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">شماره تلفن</Label>
              <Input
                value={customerForm.phone}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                className="border-amber-200 dark:border-amber-800"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">یادداشت</Label>
              <Textarea
                value={customerForm.notes}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, notes: e.target.value }))}
                className="min-h-[80px] border-amber-200 dark:border-amber-800"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditCustomerDialog(false)}>انصراف</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
              disabled={!customerForm.name.trim()}
              onClick={handleEditCustomer}
            >
              <CheckCircle className="size-4" />
              ذخیره تغییرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Confirmation */}
      <Dialog open={deleteCustomerDialog} onOpenChange={setDeleteCustomerDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="size-4" />
              حذف مشتری
            </DialogTitle>
            <DialogDescription>
              آیا از حذف مشتری {selectedCustomer?.name} اطمینان دارید؟
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-xs text-red-700 dark:text-red-300">
            <AlertTriangle className="inline size-3.5 ml-1" />
            این عملیات قابل بازگشت نیست و تمام اطلاعات مشتری حذف خواهد شد.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteCustomerDialog(false)}>انصراف</Button>
            <Button variant="destructive" className="gap-2" onClick={handleDeleteCustomer}>
              <Trash2 className="size-4" />
              حذف مشتری
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

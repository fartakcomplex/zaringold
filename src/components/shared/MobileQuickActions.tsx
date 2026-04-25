'use client';

import React, { useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Wallet, Coins, TrendingUp, TrendingDown, ArrowLeftRight,
  ArrowDownToLine, ArrowUpFromLine, Gift, Send, CreditCard,
  Bell, Settings, User, Lock, Receipt, BarChart3, Target,
  Trophy, Crown, CalendarCheck, Shield, Vault, Flame,
  Eye, Filter, Download, QrCode, FileText, Store, RefreshCw,
  MessageCircle, AlertTriangle, Percent, BookOpen, Search,
  Plus, History, ChevronUp, Phone, CheckCircle, Star,
  Heart, KeyRound, Code2, Trash2,
  Shield, Flame, Car, Wrench, ShieldAlert,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

type ActionType = 'navigate' | 'event';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  color: string;
  /** What happens when this button is pressed */
  actionType: ActionType;
  /** For 'navigate': the page id to go to. For 'event': the event name to emit. */
  actionValue: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Page → Quick Actions Map                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const PAGE_ACTIONS: Record<string, QuickAction[]> = {
  /* ── Wallet ── */
  wallet: [
    { icon: ArrowDownToLine, label: 'واریز', color: '#34D399', actionType: 'event', actionValue: 'deposit' },
    { icon: ArrowUpFromLine, label: 'برداشت', color: '#F87171', actionType: 'event', actionValue: 'withdraw' },
    { icon: Send, label: 'انتقال', color: '#60A5FA', actionType: 'navigate', actionValue: 'gold-card' },
    { icon: Gift, label: 'هدیه طلا', color: '#F472B6', actionType: 'navigate', actionValue: 'gifts' },
  ],

  /* ── Trade ── */
  trade: [
    { icon: TrendingUp, label: 'خرید طلا', color: '#34D399', actionType: 'event', actionValue: 'buy-gold' },
    { icon: TrendingDown, label: 'فروش طلا', color: '#F87171', actionType: 'event', actionValue: 'sell-gold' },
    { icon: Bell, label: 'هشدار قیمت', color: '#FBBF24', actionType: 'event', actionValue: 'price-alert' },
    { icon: BarChart3, label: 'نمودار', color: '#60A5FA', actionType: 'navigate', actionValue: 'analytics' },
  ],

  /* ── Market ── */
  market: [
    { icon: BarChart3, label: 'نمودار', color: '#60A5FA', actionType: 'navigate', actionValue: 'analytics' },
    { icon: TrendingUp, label: 'تحلیل', color: '#34D399', actionType: 'navigate', actionValue: 'smart-buy' },
    { icon: RefreshCw, label: 'به‌روزرسانی', color: '#FBBF24', actionType: 'event', actionValue: 'refresh' },
    { icon: AlertTriangle, label: 'اخطار', color: '#F87171', actionType: 'navigate', actionValue: 'fraud-alerts' },
  ],

  /* ── Profile ── */
  profile: [
    { icon: User, label: 'ویرایش', color: '#60A5FA', actionType: 'navigate', actionValue: 'settings' },
    { icon: Shield, label: 'احراز هویت', color: '#34D399', actionType: 'navigate', actionValue: 'support' },
    { icon: Lock, label: 'امنیت', color: '#FBBF24', actionType: 'navigate', actionValue: 'settings' },
    { icon: Trophy, label: 'دستاوردها', color: '#A78BFA', actionType: 'navigate', actionValue: 'achievements' },
  ],

  /* ── Transactions ── */
  transactions: [
    { icon: Filter, label: 'فیلتر', color: '#60A5FA', actionType: 'event', actionValue: 'filter' },
    { icon: Search, label: 'جستجو', color: '#34D399', actionType: 'event', actionValue: 'search' },
    { icon: Download, label: 'خروجی', color: '#FBBF24', actionType: 'event', actionValue: 'export' },
    { icon: History, label: 'تمام تراکنش‌ها', color: '#A78BFA', actionType: 'navigate', actionValue: 'wallet' },
  ],

  /* ── Gold Card ── */
  'gold-card': [
    { icon: Send, label: 'انتقال وجه', color: '#34D399', actionType: 'event', actionValue: 'transfer' },
    { icon: Wallet, label: 'موجودی', color: '#FBBF24', actionType: 'event', actionValue: 'balance' },
    { icon: Lock, label: 'مسدودی', color: '#F87171', actionType: 'event', actionValue: 'freeze' },
    { icon: Eye, label: 'مشاهده', color: '#60A5FA', actionType: 'event', actionValue: 'show-number' },
  ],

  /* ── Savings ── */
  savings: [
    { icon: Plus, label: 'واریز', color: '#34D399', actionType: 'event', actionValue: 'deposit' },
    { icon: ArrowUpFromLine, label: 'برداشت', color: '#F87171', actionType: 'event', actionValue: 'withdraw' },
    { icon: TrendingUp, label: 'سود', color: '#FBBF24', actionType: 'event', actionValue: 'profit' },
    { icon: History, label: 'تاریخچه', color: '#60A5FA', actionType: 'event', actionValue: 'history' },
  ],

  /* ── Loans ── */
  loans: [
    { icon: Plus, label: 'درخواست وام', color: '#34D399', actionType: 'event', actionValue: 'new-loan' },
    { icon: Wallet, label: 'بازپرداخت', color: '#FBBF24', actionType: 'event', actionValue: 'repay' },
    { icon: BarChart3, label: 'وضعیت', color: '#60A5FA', actionType: 'event', actionValue: 'status' },
    { icon: Percent, label: 'سود', color: '#A78BFA', actionType: 'event', actionValue: 'interest' },
  ],

  /* ── Achievements ── */
  achievements: [
    { icon: Trophy, label: 'دستاوردها', color: '#FBBF24', actionType: 'navigate', actionValue: 'achievements' },
    { icon: Star, label: 'رتبه‌بندی', color: '#A78BFA', actionType: 'navigate', actionValue: 'earn' },
    { icon: CalendarCheck, label: 'چک‌این', color: '#2DD4BF', actionType: 'navigate', actionValue: 'checkin' },
    { icon: Crown, label: 'VIP', color: '#F472B6', actionType: 'navigate', actionValue: 'vip' },
  ],

  /* ── Gifts ── */
  gifts: [
    { icon: Gift, label: 'ارسال هدیه', color: '#F472B6', actionType: 'event', actionValue: 'send-gift' },
    { icon: ArrowDownToLine, label: 'دریافت', color: '#34D399', actionType: 'event', actionValue: 'received' },
    { icon: History, label: 'تاریخچه', color: '#60A5FA', actionType: 'event', actionValue: 'history' },
    { icon: Plus, label: 'جدید', color: '#FBBF24', actionType: 'event', actionValue: 'send-gift' },
  ],

  /* ── VIP ── */
  vip: [
    { icon: Crown, label: 'عضویت', color: '#FBBF24', actionType: 'navigate', actionValue: 'vip' },
    { icon: Gift, label: 'مزایا', color: '#A78BFA', actionType: 'navigate', actionValue: 'cashback' },
    { icon: Star, label: 'سطوح', color: '#F472B6', actionType: 'navigate', actionValue: 'earn' },
    { icon: Flame, label: 'امتیاز', color: '#FB923C', actionType: 'navigate', actionValue: 'earn' },
  ],

  /* ── Referral ── */
  referral: [
    { icon: Send, label: 'دعوت دوست', color: '#34D399', actionType: 'event', actionValue: 'invite' },
    { icon: Gift, label: 'جایزه', color: '#FBBF24', actionType: 'navigate', actionValue: 'gifts' },
    { icon: BarChart3, label: 'آمار', color: '#60A5FA', actionType: 'event', actionValue: 'stats' },
    { icon: History, label: 'تاریخچه', color: '#A78BFA', actionType: 'event', actionValue: 'history' },
  ],

  /* ── Support ── */
  support: [
    { icon: Plus, label: 'تیکت جدید', color: '#34D399', actionType: 'event', actionValue: 'new-ticket' },
    { icon: MessageCircle, label: 'چت آنلاین', color: '#60A5FA', actionType: 'navigate', actionValue: 'chat' },
    { icon: BookOpen, label: 'سوالات متداول', color: '#FBBF24', actionType: 'event', actionValue: 'faq' },
    { icon: Phone, label: 'تماس', color: '#A78BFA', actionType: 'event', actionValue: 'call' },
  ],

  /* ── Notifications ── */
  notifications: [
    { icon: CheckCircle, label: 'خواندن همه', color: '#34D399', actionType: 'event', actionValue: 'read-all' },
    { icon: Filter, label: 'فیلتر', color: '#60A5FA', actionType: 'event', actionValue: 'filter' },
    { icon: Settings, label: 'تنظیمات', color: '#FBBF24', actionType: 'navigate', actionValue: 'settings' },
    { icon: Trash2, label: 'حذف', color: '#F87171', actionType: 'event', actionValue: 'delete-all' },
  ],

  /* ── Chat ── */
  chat: [
    { icon: Plus, label: 'گفتگوی جدید', color: '#34D399', actionType: 'event', actionValue: 'new-chat' },
    { icon: History, label: 'تاریخچه', color: '#60A5FA', actionType: 'event', actionValue: 'history' },
    { icon: Settings, label: 'تنظیمات', color: '#FBBF24', actionType: 'navigate', actionValue: 'settings' },
    { icon: User, label: 'پشتیبان', color: '#A78BFA', actionType: 'event', actionValue: 'support-agent' },
  ],

  /* ── Vault ── */
  vault: [
    { icon: ArrowDownToLine, label: 'واریز طلا', color: '#34D399', actionType: 'event', actionValue: 'deposit' },
    { icon: ArrowUpFromLine, label: 'برداشت', color: '#F87171', actionType: 'event', actionValue: 'withdraw' },
    { icon: Send, label: 'انتقال', color: '#60A5FA', actionType: 'event', actionValue: 'transfer' },
    { icon: Shield, label: 'امنیت', color: '#FBBF24', actionType: 'navigate', actionValue: 'settings' },
  ],

  /* ── Analytics ── */
  analytics: [
    { icon: BarChart3, label: 'پرتفوی', color: '#60A5FA', actionType: 'navigate', actionValue: 'wallet' },
    { icon: TrendingUp, label: 'نمودار', color: '#34D399', actionType: 'event', actionValue: 'chart' },
    { icon: Download, label: 'گزارش', color: '#FBBF24', actionType: 'event', actionValue: 'report' },
    { icon: RefreshCw, label: 'به‌روزرسانی', color: '#A78BFA', actionType: 'event', actionValue: 'refresh' },
  ],

  /* ── Smart Buy ── */
  'smart-buy': [
    { icon: Coins, label: 'خرید هوشمند', color: '#34D399', actionType: 'navigate', actionValue: 'trade' },
    { icon: Target, label: 'هدف‌گذاری', color: '#60A5FA', actionType: 'navigate', actionValue: 'goals' },
    { icon: TrendingUp, label: 'تحلیل', color: '#FBBF24', actionType: 'navigate', actionValue: 'analytics' },
    { icon: Bell, label: 'هشدار', color: '#A78BFA', actionType: 'navigate', actionValue: 'market' },
  ],

  /* ── AI Coach ── */
  'ai-coach': [
    { icon: MessageCircle, label: 'مشاوره', color: '#34D399', actionType: 'event', actionValue: 'consult' },
    { icon: TrendingUp, label: 'پیشنهاد', color: '#60A5FA', actionType: 'event', actionValue: 'suggestion' },
    { icon: Target, label: 'هدف', color: '#FBBF24', actionType: 'navigate', actionValue: 'goals' },
    { icon: BarChart3, label: 'تحلیل', color: '#A78BFA', actionType: 'navigate', actionValue: 'analytics' },
  ],

  /* ── Auto Save ── */
  autosave: [
    { icon: Plus, label: 'شروع', color: '#34D399', actionType: 'event', actionValue: 'start' },
    { icon: Settings, label: 'تنظیمات', color: '#60A5FA', actionType: 'event', actionValue: 'settings' },
    { icon: TrendingUp, label: 'آمار', color: '#FBBF24', actionType: 'event', actionValue: 'stats' },
    { icon: History, label: 'تاریخچه', color: '#A78BFA', actionType: 'event', actionValue: 'history' },
  ],

  /* ── Goals ── */
  goals: [
    { icon: Plus, label: 'هدف جدید', color: '#34D399', actionType: 'event', actionValue: 'new-goal' },
    { icon: ArrowDownToLine, label: 'واریز', color: '#60A5FA', actionType: 'navigate', actionValue: 'wallet' },
    { icon: Target, label: 'پیشرفت', color: '#FBBF24', actionType: 'navigate', actionValue: 'analytics' },
    { icon: History, label: 'تاریخچه', color: '#A78BFA', actionType: 'event', actionValue: 'history' },
  ],

  /* ── Cashback ── */
  cashback: [
    { icon: Gift, label: 'ادعای کش‌بک', color: '#34D399', actionType: 'event', actionValue: 'claim' },
    { icon: History, label: 'تاریخچه', color: '#60A5FA', actionType: 'event', actionValue: 'history' },
    { icon: TrendingUp, label: 'آمار', color: '#FBBF24', actionType: 'event', actionValue: 'stats' },
    { icon: Star, label: 'رتبه', color: '#A78BFA', actionType: 'navigate', actionValue: 'earn' },
  ],

  /* ── Earn ── */
  earn: [
    { icon: Flame, label: 'تسک‌ها', color: '#FB923C', actionType: 'event', actionValue: 'tasks' },
    { icon: Gift, label: 'پاداش', color: '#FBBF24', actionType: 'navigate', actionValue: 'gifts' },
    { icon: Trophy, label: 'مسابقات', color: '#A78BFA', actionType: 'navigate', actionValue: 'prediction' },
    { icon: TrendingUp, label: 'سطح', color: '#34D399', actionType: 'navigate', actionValue: 'vip' },
  ],

  /* ── Check-in ── */
  checkin: [
    { icon: CalendarCheck, label: 'چک‌این', color: '#34D399', actionType: 'event', actionValue: 'checkin' },
    { icon: Gift, label: 'جایزه', color: '#FBBF24', actionType: 'event', actionValue: 'reward' },
    { icon: Flame, label: 'وضعیت', color: '#FB923C', actionType: 'event', actionValue: 'streak' },
    { icon: History, label: 'تاریخچه', color: '#60A5FA', actionType: 'event', actionValue: 'history' },
  ],

  /* ── Prediction ── */
  prediction: [
    { icon: Target, label: 'پیش‌بینی', color: '#34D399', actionType: 'event', actionValue: 'predict' },
    { icon: Trophy, label: 'جدول رده‌بندی', color: '#FBBF24', actionType: 'event', actionValue: 'leaderboard' },
    { icon: History, label: 'تاریخچه', color: '#60A5FA', actionType: 'event', actionValue: 'history' },
    { icon: Star, label: 'امتیاز من', color: '#A78BFA', actionType: 'event', actionValue: 'my-score' },
  ],

  /* ── Family Wallet ── */
  'family-wallet': [
    { icon: Plus, label: 'عضو جدید', color: '#34D399', actionType: 'event', actionValue: 'add-member' },
    { icon: ArrowDownToLine, label: 'واریز', color: '#60A5FA', actionType: 'navigate', actionValue: 'wallet' },
    { icon: History, label: 'تاریخچه', color: '#FBBF24', actionType: 'event', actionValue: 'history' },
    { icon: Settings, label: 'تنظیمات', color: '#A78BFA', actionType: 'event', actionValue: 'settings' },
  ],

  /* ── Social Feed ── */
  'social-feed': [
    { icon: Plus, label: 'پست جدید', color: '#34D399', actionType: 'event', actionValue: 'new-post' },
    { icon: TrendingUp, label: 'پربازدید', color: '#FBBF24', actionType: 'event', actionValue: 'trending' },
    { icon: Filter, label: 'فیلتر', color: '#60A5FA', actionType: 'event', actionValue: 'filter' },
    { icon: Heart, label: 'لایک‌ها', color: '#F472B6', actionType: 'event', actionValue: 'likes' },
  ],

  /* ── Creator Club ── */
  'creator-club': [
    { icon: Plus, label: 'عضویت', color: '#34D399', actionType: 'event', actionValue: 'join' },
    { icon: Gift, label: 'پاداش', color: '#FBBF24', actionType: 'navigate', actionValue: 'earn' },
    { icon: TrendingUp, label: 'وضعیت', color: '#60A5FA', actionType: 'event', actionValue: 'status' },
    { icon: BarChart3, label: 'آمار', color: '#A78BFA', actionType: 'event', actionValue: 'stats' },
  ],

  /* ── Emergency Sell ── */
  'emergency-sell': [
    { icon: TrendingDown, label: 'فروش فوری', color: '#F87171', actionType: 'event', actionValue: 'sell' },
    { icon: Coins, label: 'موجودی', color: '#FBBF24', actionType: 'navigate', actionValue: 'wallet' },
    { icon: History, label: 'تاریخچه', color: '#60A5FA', actionType: 'navigate', actionValue: 'transactions' },
    { icon: AlertTriangle, label: 'قوانین', color: '#FB923C', actionType: 'event', actionValue: 'rules' },
  ],

  /* ── Merchant ── */
  merchant: [
    { icon: BarChart3, label: 'داشبورد', color: '#60A5FA', actionType: 'event', actionValue: 'dashboard' },
    { icon: FileText, label: 'فاکتورها', color: '#34D399', actionType: 'navigate', actionValue: 'invoices' },
    { icon: QrCode, label: 'QR پرداخت', color: '#FBBF24', actionType: 'navigate', actionValue: 'qr-payment' },
    { icon: Settings, label: 'تنظیمات', color: '#A78BFA', actionType: 'navigate', actionValue: 'api-docs' },
  ],

  /* ── QR Payment ── */
  'qr-payment': [
    { icon: QrCode, label: 'اسکن QR', color: '#34D399', actionType: 'event', actionValue: 'scan' },
    { icon: History, label: 'تاریخچه', color: '#60A5FA', actionType: 'navigate', actionValue: 'transactions' },
    { icon: Store, label: 'فروشگاه‌ها', color: '#FBBF24', actionType: 'event', actionValue: 'stores' },
    { icon: Plus, label: 'ایجاد QR', color: '#A78BFA', actionType: 'event', actionValue: 'create-qr' },
  ],

  /* ── Invoices ── */
  invoices: [
    { icon: Plus, label: 'فاکتور جدید', color: '#34D399', actionType: 'event', actionValue: 'new-invoice' },
    { icon: History, label: 'تاریخچه', color: '#60A5FA', actionType: 'event', actionValue: 'history' },
    { icon: Download, label: 'خروجی', color: '#FBBF24', actionType: 'event', actionValue: 'export' },
    { icon: Filter, label: 'فیلتر', color: '#A78BFA', actionType: 'event', actionValue: 'filter' },
  ],

  /* ── Fraud Alerts ── */
  'fraud-alerts': [
    { icon: AlertTriangle, label: 'هشدارها', color: '#F87171', actionType: 'event', actionValue: 'alerts' },
    { icon: Shield, label: 'امنیت', color: '#34D399', actionType: 'navigate', actionValue: 'settings' },
    { icon: History, label: 'تاریخچه', color: '#60A5FA', actionType: 'event', actionValue: 'history' },
    { icon: Settings, label: 'تنظیمات', color: '#FBBF24', actionType: 'navigate', actionValue: 'settings' },
  ],

  /* ── Loyalty ── */
  loyalty: [
    { icon: Percent, label: 'کارمزد', color: '#34D399', actionType: 'event', actionValue: 'commission' },
    { icon: TrendingUp, label: 'درآمد', color: '#FBBF24', actionType: 'event', actionValue: 'income' },
    { icon: History, label: 'تاریخچه', color: '#60A5FA', actionType: 'event', actionValue: 'history' },
    { icon: Settings, label: 'تنظیمات', color: '#A78BFA', actionType: 'navigate', actionValue: 'api-docs' },
  ],

  /* ── API Docs ── */
  'api-docs': [
    { icon: BookOpen, label: 'مستندات', color: '#34D399', actionType: 'event', actionValue: 'docs' },
    { icon: KeyRound, label: 'API Key', color: '#FBBF24', actionType: 'event', actionValue: 'api-key' },
    { icon: Code2, label: 'نمونه کد', color: '#60A5FA', actionType: 'event', actionValue: 'samples' },
    { icon: MessageCircle, label: 'پشتیبانی', color: '#A78BFA', actionType: 'navigate', actionValue: 'support' },
  ],

  /* ── Insurance ── */
  insurance: [
    { icon: Shield, label: 'شخص ثالث', color: '#34D399', actionType: 'event', actionValue: 'cat-third-party' },
    { icon: Flame, label: 'آتش‌سوزی', color: '#F87171', actionType: 'event', actionValue: 'cat-fire' },
    { icon: Car, label: 'بدنه', color: '#60A5FA', actionType: 'event', actionValue: 'cat-body' },
    { icon: History, label: 'بیمه‌نامه‌ها', color: '#FBBF24', actionType: 'event', actionValue: 'my-policies' },
  ],

  /* ── Utility Services ── */
  utility: [
    { icon: Smartphone, label: 'شارژ', color: '#FBBF24', actionType: 'event', actionValue: 'topup' },
    { icon: Wifi, label: 'اینترنت', color: '#A78BFA', actionType: 'event', actionValue: 'internet' },
    { icon: Receipt, label: 'قبوض', color: '#2DD4BF', actionType: 'event', actionValue: 'bills' },
    { icon: History, label: 'تاریخچه', color: '#60A5FA', actionType: 'event', actionValue: 'history' },
  ],

  /* ── Car Services ── */
  'car-services': [
    { icon: Wrench, label: 'تعویض روغنی', color: '#FBBF24', actionType: 'event', actionValue: 'service-oil' },
    { icon: ShieldAlert, label: 'بیمه خودرو', color: '#34D399', actionType: 'event', actionValue: 'service-insurance' },
    { icon: Plus, label: 'ثبت خودرو', color: '#60A5FA', actionType: 'event', actionValue: 'add-car' },
    { icon: ClipboardList, label: 'سفارش‌ها', color: '#A78BFA', actionType: 'event', actionValue: 'my-orders' },
  ],

  /* ── Settings ── */
  settings: [
    { icon: User, label: 'حساب کاربری', color: '#60A5FA', actionType: 'navigate', actionValue: 'profile' },
    { icon: Lock, label: 'امنیت', color: '#34D399', actionType: 'event', actionValue: 'security' },
    { icon: Bell, label: 'اعلان‌ها', color: '#FBBF24', actionType: 'navigate', actionValue: 'notifications' },
    { icon: Shield, label: 'حریم خصوصی', color: '#A78BFA', actionType: 'event', actionValue: 'privacy' },
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function MobileQuickActions() {
  const { currentPage, setPage, emitPageEvent } = useAppStore();
  const isMobile = useIsMobile();

  const handleAction = useCallback(
    (action: QuickAction) => {
      if (action.actionType === 'navigate') {
        setPage(action.actionValue);
      } else {
        emitPageEvent(action.actionValue);
      }
    },
    [setPage, emitPageEvent],
  );

  if (!isMobile) return null;

  /* Dashboard already has its own easy access grid */
  if (currentPage === 'dashboard') return null;

  const actions = PAGE_ACTIONS[currentPage];
  if (!actions || actions.length === 0) return null;

  return (
    <div className="grid grid-cols-4 gap-2 pb-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={() => handleAction(action)}
            className="group flex flex-col items-center justify-center gap-1.5 py-1.5 px-1 transition-all duration-200 active:scale-[0.92]"
          >
            <div
              className="flex size-12 items-center justify-center rounded-xl bg-[#1e1e1e] shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all duration-200 group-hover:scale-105"
            >
              <Icon
                className="size-6"
                style={{ color: action.color }}
                strokeWidth={1.8}
              />
            </div>
            <span className="text-[10px] font-medium leading-none truncate max-w-full text-[#D4AF37]/90">
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}


import React, { useEffect } from 'react';
import {/* Trading */
  TrendingUp, TrendingDown, ArrowUpDown, Bell, BellRing, Receipt, Clock, BarChart3, History, /* Wallet */
  ArrowDownToLine, ArrowUpFromLine, Gift, PieChart, Activity, /* Smart Tools */
  Bot, Sparkles, Timer, Star, Eye, /* Saving */
  PiggyBank, Target, Plus, Coins, Banknote, /* Social */
  Users, MessageCircle, Video, GraduationCap, /* Gamification */
  Trophy, Crown, HandCoins, CalendarCheck, Gamepad2, Flame, MapPin, Zap, /* Advanced */
  CandlestickChart, Radio, Calculator, Wallet, UsersRound, /* Other */
  Settings, User, HelpCircle, Send, Filter, Download, Heart, Shield, Search, /* New imports */
  CreditCard, Camera, Image as ImageIcon, RefreshCw} from 'lucide-react';
import {useAppStore} from '@/lib/store';
import {useTranslation} from '@/lib/i18n';
import {cn} from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Intra-page Quick Action Definition                                       */
/* ------------------------------------------------------------------ */

interface QAAction {
  labelKey: string;
  action: string;       // dispatched via custom event
  icon: React.ElementType;
  color: string;
}

/* ------------------------------------------------------------------ */
/*  Page → Intra-page Quick Actions Mapping                             */
/*  Each action maps to something the page itself handles              */
/* ------------------------------------------------------------------ */

const pageActions: Record<string, QAAction[]> = {
  /* ── Dashboard ── */
  dashboard: [
    { labelKey: 'qa.buyGold', action: 'navigate:trade', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10' },
    { labelKey: 'qa.sellGold', action: 'navigate:trade', icon: TrendingDown, color: 'text-red-400 bg-red-400/10' },
    { labelKey: 'qa.wallet', action: 'navigate:wallet', icon: Wallet, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.market', action: 'navigate:market', icon: Activity, color: 'text-gold bg-gold/10' },
  ],

  /* ── Trade: scroll to buy/sell, open alert dialog, scroll to orders ── */
  trade: [
    { labelKey: 'qa.buy', action: 'scroll:trade-buy', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10' },
    { labelKey: 'qa.sell', action: 'scroll:trade-sell', icon: TrendingDown, color: 'text-red-400 bg-red-400/10' },
    { labelKey: 'qa.alerts', action: 'open:trade-alerts', icon: BellRing, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.orders', action: 'scroll:trade-orders', icon: History, color: 'text-blue-400 bg-blue-400/10' },
  ],

  /* ── Wallet: open deposit/withdraw dialogs, switch tab ── */
  wallet: [
    { labelKey: 'qa.deposit', action: 'open:wallet-deposit', icon: ArrowDownToLine, color: 'text-emerald-500 bg-emerald-500/10' },
    { labelKey: 'qa.withdraw', action: 'open:wallet-withdraw', icon: ArrowUpFromLine, color: 'text-red-400 bg-red-400/10' },
    { labelKey: 'qa.gift', action: 'open:wallet-gift', icon: Gift, color: 'text-pink-400 bg-pink-400/10' },
    { labelKey: 'qa.history', action: 'scroll:wallet-history', icon: Receipt, color: 'text-purple-400 bg-purple-400/10' },
  ],

  /* ── Market ── */
  market: [
    { labelKey: 'qa.chart', action: 'scroll:market-chart', icon: CandlestickChart, color: 'text-violet-400 bg-violet-400/10' },
    { labelKey: 'qa.analysis', action: 'scroll:market-analysis', icon: BarChart3, color: 'text-cyan-400 bg-cyan-400/10' },
    { labelKey: 'qa.depth', action: 'scroll:market-depth', icon: ArrowUpDown, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.news', action: 'scroll:market-news', icon: Eye, color: 'text-blue-400 bg-blue-400/10' },
  ],

  /* ── Transactions ── */
  transactions: [
    { labelKey: 'qa.all', action: 'filter:tx-all', icon: Receipt, color: 'text-slate-400 bg-slate-400/10' },
    { labelKey: 'qa.deposits', action: 'filter:tx-deposit', icon: ArrowDownToLine, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.gold', action: 'filter:tx-gold', icon: Coins, color: 'text-gold bg-gold/10' },
    { labelKey: 'qa.withdrawals', action: 'filter:tx-withdraw', icon: ArrowUpFromLine, color: 'text-red-400 bg-red-400/10' },
  ],

  /* ── Smart Buy ── */
  'smart-buy': [
    { labelKey: 'qa.analyze', action: 'scroll:sb-analysis', icon: Bot, color: 'text-cyan-400 bg-cyan-400/10' },
    { labelKey: 'qa.bestTime', action: 'scroll:sb-best-time', icon: Clock, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.portfolio', action: 'scroll:sb-portfolio', icon: PieChart, color: 'text-violet-400 bg-violet-400/10' },
    { labelKey: 'qa.history', action: 'scroll:sb-history', icon: History, color: 'text-blue-400 bg-blue-400/10' },
  ],

  /* ── Profit Simulator ── */
  'profit-simulator': [
    { labelKey: 'qa.simulator', action: 'scroll:ps-simulator', icon: Timer, color: 'text-teal-400 bg-teal-400/10' },
    { labelKey: 'qa.compare', action: 'scroll:ps-compare', icon: BarChart3, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.result', action: 'scroll:ps-result', icon: TrendingUp, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.share', action: 'click:ps-share', icon: Send, color: 'text-pink-400 bg-pink-400/10' },
  ],

  /* ── Analytics ── */
  analytics: [
    { labelKey: 'qa.overview', action: 'scroll:pa-overview', icon: PieChart, color: 'text-gold bg-gold/10' },
    { labelKey: 'qa.perf', action: 'scroll:pa-performance', icon: TrendingUp, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.allocation', action: 'scroll:pa-allocation', icon: Target, color: 'text-violet-400 bg-violet-400/10' },
    { labelKey: 'qa.risk', action: 'scroll:pa-risk', icon: Shield, color: 'text-rose-400 bg-rose-400/10' },
  ],

  /* ── AI Coach ── */
  'ai-coach': [
    { labelKey: 'qa.ask', action: 'scroll:coach-ask', icon: Sparkles, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.advice', action: 'scroll:coach-advice', icon: Bot, color: 'text-cyan-400 bg-cyan-400/10' },
    { labelKey: 'qa.goals', action: 'scroll:coach-goals', icon: Target, color: 'text-orange-400 bg-orange-400/10' },
    { labelKey: 'qa.tips', action: 'scroll:coach-tips', icon: GraduationCap, color: 'text-violet-400 bg-violet-400/10' },
  ],

  /* ── Auto Save ── */
  autosave: [
    { labelKey: 'qa.create', action: 'open:as-create', icon: Plus, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.plans', action: 'scroll:as-plans', icon: PiggyBank, color: 'text-teal-400 bg-teal-400/10' },
    { labelKey: 'qa.history', action: 'scroll:as-history', icon: History, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.settings', action: 'scroll:as-settings', icon: Settings, color: 'text-slate-400 bg-slate-400/10' },
  ],

  /* ── Goals ── */
  goals: [
    { labelKey: 'qa.newGoal', action: 'open:goals-create', icon: Plus, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.myGoals', action: 'scroll:goals-list', icon: Target, color: 'text-gold bg-gold/10' },
    { labelKey: 'qa.progress', action: 'scroll:goals-progress', icon: Activity, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.tips', action: 'scroll:goals-tips', icon: Sparkles, color: 'text-amber-400 bg-amber-400/10' },
  ],

  /* ── Savings ── */
  savings: [
    { labelKey: 'qa.overview', action: 'scroll:savings-overview', icon: PiggyBank, color: 'text-teal-400 bg-teal-400/10' },
    { labelKey: 'qa.calculator', action: 'scroll:savings-calc', icon: Calculator, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.autoSave', action: 'scroll:savings-autosave', icon: Zap, color: 'text-violet-400 bg-violet-400/10' },
    { labelKey: 'qa.tips', action: 'scroll:savings-tips', icon: GraduationCap, color: 'text-blue-400 bg-blue-400/10' },
  ],

  /* ── Loans ── */
  loans: [
    { labelKey: 'qa.newLoan', action: 'open:loans-create', icon: Plus, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.myLoans', action: 'scroll:loans-list', icon: Banknote, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.calculator', action: 'scroll:loans-calc', icon: Calculator, color: 'text-violet-400 bg-violet-400/10' },
    { labelKey: 'qa.loansTips', action: 'scroll:loans-tips', icon: GraduationCap, color: 'text-blue-400 bg-blue-400/10' },
  ],

  /* ── Creator Club ── */
  'creator-club': [
    { labelKey: 'qa.dashboard', action: 'scroll:cc-dashboard', icon: Video, color: 'text-rose-400 bg-rose-400/10' },
    { labelKey: 'qa.missions', action: 'scroll:cc-missions', icon: Target, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.templates', action: 'scroll:cc-templates', icon: Sparkles, color: 'text-cyan-400 bg-cyan-400/10' },
    { labelKey: 'qa.leaderboard', action: 'scroll:cc-leaderboard', icon: Trophy, color: 'text-gold bg-gold/10' },
  ],

  /* ── Referral ── */
  referral: [
    { labelKey: 'qa.share', action: 'click:ref-share', icon: Send, color: 'text-pink-400 bg-pink-400/10' },
    { labelKey: 'qa.invited', action: 'scroll:ref-invited', icon: Users, color: 'text-violet-400 bg-violet-400/10' },
    { labelKey: 'qa.rewards', action: 'scroll:ref-rewards', icon: Gift, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.tips', action: 'scroll:ref-tips', icon: GraduationCap, color: 'text-blue-400 bg-blue-400/10' },
  ],

  /* ── Gifts ── */
  gifts: [
    { labelKey: 'qa.sendGift', action: 'open:gifts-send', icon: Gift, color: 'text-pink-400 bg-pink-400/10' },
    { labelKey: 'qa.received', action: 'scroll:gifts-received', icon: Heart, color: 'text-rose-400 bg-rose-400/10' },
    { labelKey: 'qa.history', action: 'scroll:gifts-history', icon: History, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.tips', action: 'scroll:gifts-tips', icon: Sparkles, color: 'text-amber-400 bg-amber-400/10' },
  ],

  /* ── Family Wallet ── */
  'family-wallet': [
    { labelKey: 'qa.invite', action: 'open:fw-invite', icon: Users, color: 'text-pink-400 bg-pink-400/10' },
    { labelKey: 'qa.members', action: 'scroll:fw-members', icon: UsersRound, color: 'text-violet-400 bg-violet-400/10' },
    { labelKey: 'qa.goals', action: 'scroll:fw-goals', icon: Target, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.history', action: 'scroll:fw-history', icon: History, color: 'text-blue-400 bg-blue-400/10' },
  ],

  /* ── Social Feed ── */
  'social-feed': [
    { labelKey: 'qa.trending', action: 'scroll:sf-trending', icon: TrendingUp, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.latest', action: 'scroll:sf-latest', icon: Clock, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.myPosts', action: 'scroll:sf-myposts', icon: MessageCircle, color: 'text-violet-400 bg-violet-400/10' },
    { labelKey: 'qa.create', action: 'open:sf-create', icon: Plus, color: 'text-pink-400 bg-pink-400/10' },
  ],

  /* ── Gold Quest ── */
  'gold-quest': [
    { labelKey: 'qa.today', action: 'tab:quest-today', icon: CalendarCheck, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.weekly', action: 'tab:quest-weekly', icon: Flame, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.leaderboard', action: 'tab:quest-leaderboard', icon: Trophy, color: 'text-gold bg-gold/10' },
    { labelKey: 'qa.streak', action: 'tab:quest-streak', icon: Flame, color: 'text-rose-400 bg-rose-400/10' },
  ],

  /* ── Achievements ── */
  achievements: [
    { labelKey: 'qa.all', action: 'tab:ach-all', icon: Trophy, color: 'text-gold bg-gold/10' },
    { labelKey: 'qa.locked', action: 'tab:ach-locked', icon: Crown, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.progress', action: 'tab:ach-progress', icon: Activity, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.quests', action: 'scroll:ach-quests', icon: MapPin, color: 'text-emerald-400 bg-emerald-400/10' },
  ],

  /* ── Check In ── */
  checkin: [
    { labelKey: 'qa.checkin', action: 'click:ci-checkin', icon: CalendarCheck, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.streak', action: 'scroll:ci-streak', icon: Flame, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.calendar', action: 'scroll:ci-calendar', icon: CalendarCheck, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.rewards', action: 'scroll:ci-rewards', icon: Gift, color: 'text-pink-400 bg-pink-400/10' },
  ],

  /* ── Prediction ── */
  prediction: [
    { labelKey: 'qa.predict', action: 'scroll:pg-predict', icon: Gamepad2, color: 'text-violet-400 bg-violet-400/10' },
    { labelKey: 'qa.leaderboard', action: 'scroll:pg-leaderboard', icon: Trophy, color: 'text-gold bg-gold/10' },
    { labelKey: 'qa.stats', action: 'scroll:pg-stats', icon: BarChart3, color: 'text-cyan-400 bg-cyan-400/10' },
    { labelKey: 'qa.rules', action: 'scroll:pg-rules', icon: GraduationCap, color: 'text-blue-400 bg-blue-400/10' },
  ],

  /* ── VIP ── */
  vip: [
    { labelKey: 'qa.plans', action: 'scroll:vip-plans', icon: Crown, color: 'text-gold bg-gold/10' },
    { labelKey: 'qa.benefits', action: 'scroll:vip-benefits', icon: Star, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.subscribe', action: 'open:vip-subscribe', icon: Zap, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.faq', action: 'scroll:vip-faq', icon: HelpCircle, color: 'text-blue-400 bg-blue-400/10' },
  ],

  /* ── Cashback ── */
  cashback: [
    { labelKey: 'qa.claim', action: 'scroll:cb-available', icon: HandCoins, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.total', action: 'scroll:cb-total', icon: Trophy, color: 'text-gold bg-gold/10' },
    { labelKey: 'qa.history', action: 'open:cb-history', icon: History, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.tips', action: 'scroll:cb-tips', icon: Sparkles, color: 'text-amber-400 bg-amber-400/10' },
  ],

  /* ── Earn ── */
  earn: [
    { labelKey: 'qa.quests', action: 'scroll:earn-quests', icon: MapPin, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.checkin', action: 'scroll:earn-checkin', icon: CalendarCheck, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.referral', action: 'scroll:earn-referral', icon: Users, color: 'text-violet-400 bg-violet-400/10' },
    { labelKey: 'qa.leaderboard', action: 'scroll:earn-leaderboard', icon: Trophy, color: 'text-gold bg-gold/10' },
  ],

  /* ── Vault ── */
  vault: [
    { labelKey: 'qa.overview', action: 'scroll:vault-overview', icon: Shield, color: 'text-gold bg-gold/10' },
    { labelKey: 'qa.audit', action: 'scroll:vault-audit', icon: Eye, color: 'text-cyan-400 bg-cyan-400/10' },
    { labelKey: 'qa.coverage', action: 'scroll:vault-coverage', icon: BarChart3, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.stats', action: 'scroll:vault-stats', icon: Activity, color: 'text-violet-400 bg-violet-400/10' },
  ],

  /* ── Emergency Sell ── */
  'emergency-sell': [
    { labelKey: 'qa.quickSell', action: 'click:es-sell', icon: TrendingDown, color: 'text-red-400 bg-red-400/10' },
    { labelKey: 'qa.balance', action: 'scroll:es-balance', icon: Wallet, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.fee', action: 'scroll:es-fee', icon: Receipt, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.confirm', action: 'scroll:es-confirm', icon: Shield, color: 'text-emerald-400 bg-emerald-400/10' },
  ],

  /* ── Advanced Chart ── */
  'advanced-chart': [
    { labelKey: 'qa.chart', action: 'scroll:ac-chart', icon: CandlestickChart, color: 'text-violet-400 bg-violet-400/10' },
    { labelKey: 'qa.indicators', action: 'scroll:ac-indicators', icon: Activity, color: 'text-cyan-400 bg-cyan-400/10' },
    { labelKey: 'qa.timeframe', action: 'open:ac-timeframe', icon: Clock, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.compare', action: 'open:ac-compare', icon: BarChart3, color: 'text-blue-400 bg-blue-400/10' },
  ],

  /* ── Live Price ── */
  'live-price': [
    { labelKey: 'qa.chart', action: 'scroll:lp-chart', icon: CandlestickChart, color: 'text-violet-400 bg-violet-400/10' },
    { labelKey: 'qa.buy', action: 'scroll:lp-buy', icon: TrendingUp, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.sell', action: 'scroll:lp-sell', icon: TrendingDown, color: 'text-red-400 bg-red-400/10' },
    { labelKey: 'qa.alerts', action: 'scroll:lp-alerts', icon: Bell, color: 'text-amber-400 bg-amber-400/10' },
  ],

  /* ── Auto Trading ── */
  'auto-trade': [
    { labelKey: 'qa.create', action: 'open:at-create', icon: Plus, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.active', action: 'scroll:at-active', icon: Zap, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.history', action: 'scroll:at-history', icon: History, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.settings', action: 'scroll:at-settings', icon: Settings, color: 'text-slate-400 bg-slate-400/10' },
  ],

  /* ── Education ── */
  education: [
    { labelKey: 'qa.courses', action: 'scroll:edu-courses', icon: GraduationCap, color: 'text-violet-400 bg-violet-400/10' },
    { labelKey: 'qa.tutorials', action: 'scroll:edu-tutorials', icon: Video, color: 'text-rose-400 bg-rose-400/10' },
    { labelKey: 'qa.tips', action: 'scroll:edu-tips', icon: Sparkles, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.myProgress', action: 'scroll:edu-progress', icon: Activity, color: 'text-blue-400 bg-blue-400/10' },
  ],

  /* ── Telegram ── */
  telegram: [
    { labelKey: 'qa.connect', action: 'open:tg-connect', icon: Send, color: 'text-cyan-400 bg-cyan-400/10' },
    { labelKey: 'qa.features', action: 'scroll:tg-features', icon: Zap, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.guide', action: 'scroll:tg-guide', icon: GraduationCap, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.copyLink', action: 'click:tg-copy-link', icon: Send, color: 'text-pink-400 bg-pink-400/10' },
  ],

  /* ── Notifications ── */
  notifications: [
    { labelKey: 'qa.markRead', action: 'click:notif-readall', icon: Bell, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.all', action: 'scroll:notif-all', icon: Receipt, color: 'text-slate-400 bg-slate-400/10' },
    { labelKey: 'qa.settings', action: 'open:notif-settings', icon: Settings, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.filter', action: 'scroll:notif-filter', icon: Filter, color: 'text-violet-400 bg-violet-400/10' },
  ],

  /* ── Chat ── */
  chat: [
    { labelKey: 'qa.newChat', action: 'open:chat-new', icon: MessageCircle, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.quick', action: 'scroll:chat-quick', icon: Zap, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.history', action: 'scroll:chat-history', icon: History, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.info', action: 'scroll:chat-info', icon: HelpCircle, color: 'text-slate-400 bg-slate-400/10' },
  ],

  /* ── Support ── */
  support: [
    { labelKey: 'qa.newTicket', action: 'open:supp-new', icon: Plus, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.myTickets', action: 'scroll:supp-tickets', icon: Receipt, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.supportFaq', action: 'scroll:supp-faq', icon: HelpCircle, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.contact', action: 'scroll:supp-contact', icon: MessageCircle, color: 'text-violet-400 bg-violet-400/10' },
  ],

  /* ── Profile ── */
  profile: [
    { labelKey: 'qa.editInfo', action: 'scroll:prof-info', icon: User, color: 'text-violet-400 bg-violet-400/10' },
    { labelKey: 'qa.security', action: 'scroll:prof-security', icon: Shield, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.stats', action: 'scroll:prof-stats', icon: Activity, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.badges', action: 'scroll:prof-badges', icon: Trophy, color: 'text-gold bg-gold/10' },
  ],

  /* ── Settings ── */
  settings: [
    { labelKey: 'qa.general', action: 'scroll:set-general', icon: Settings, color: 'text-slate-400 bg-slate-400/10' },
    { labelKey: 'qa.notifs', action: 'scroll:set-notifs', icon: Bell, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.security', action: 'scroll:set-security', icon: Shield, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.telegram', action: 'scroll:set-telegram', icon: Send, color: 'text-cyan-400 bg-cyan-400/10' },
  ],

  /* ── Gold Transfer ── */
  'gold-transfer': [
    { labelKey: 'qa.newTransfer', action: 'open:gt-new', icon: Send, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.recent', action: 'scroll:gt-recent', icon: History, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.fee', action: 'scroll:gt-fee', icon: Receipt, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.guide', action: 'scroll:gt-guide', icon: GraduationCap, color: 'text-violet-400 bg-violet-400/10' },
  ],

  /* ── Gold Card ── */
  'gold-card': [
    { labelKey: 'qa.cardInfo', action: 'scroll:gc-info', icon: CreditCard, color: 'text-gold bg-gold/10' },
    { labelKey: 'qa.transactions', action: 'scroll:gc-transactions', icon: Receipt, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.settings', action: 'scroll:gc-settings', icon: Settings, color: 'text-slate-400 bg-slate-400/10' },
    { labelKey: 'qa.share', action: 'click:gc-share', icon: Send, color: 'text-pink-400 bg-pink-400/10' },
  ],

  /* ── Merchant Panel ── */
  'merchant-panel': [
    { labelKey: 'qa.dashboard', action: 'tab:mp-dashboard', icon: BarChart3, color: 'text-gold bg-gold/10' },
    { labelKey: 'qa.apiKeys', action: 'tab:mp-keys', icon: Shield, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.docs', action: 'tab:mp-docs', icon: GraduationCap, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.payments', action: 'tab:mp-payments', icon: Receipt, color: 'text-violet-400 bg-violet-400/10' },
  ],

  /* ── Gold Horoscope ── */
  'gold-horoscope': [
    { labelKey: 'qa.today', action: 'scroll:gh-today', icon: Sparkles, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.history', action: 'scroll:gh-history', icon: History, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.share', action: 'click:gh-share', icon: Send, color: 'text-pink-400 bg-pink-400/10' },
    { labelKey: 'qa.refresh', action: 'click:gh-refresh', icon: RefreshCw, color: 'text-emerald-400 bg-emerald-400/10' },
  ],

  /* ── Health Check ── */
  'health-check': [
    { labelKey: 'qa.startCheck', action: 'click:hc-start', icon: Shield, color: 'text-emerald-400 bg-emerald-400/10' },
    { labelKey: 'qa.score', action: 'scroll:hc-score', icon: Activity, color: 'text-gold bg-gold/10' },
    { labelKey: 'qa.advice', action: 'scroll:hc-advice', icon: Bot, color: 'text-cyan-400 bg-cyan-400/10' },
    { labelKey: 'qa.history', action: 'scroll:hc-history', icon: History, color: 'text-blue-400 bg-blue-400/10' },
  ],

  /* ── Gold Scanner ── */
  'gold-scanner': [
    { labelKey: 'qa.scan', action: 'open:gs-scan', icon: Camera, color: 'text-violet-400 bg-violet-400/10' },
    { labelKey: 'qa.gallery', action: 'open:gs-gallery', icon: ImageIcon, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.history', action: 'scroll:gs-history', icon: History, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.guide', action: 'scroll:gs-guide', icon: GraduationCap, color: 'text-emerald-400 bg-emerald-400/10' },
  ],

  /* ── Price Missile ── */
  'price-missile': [
    { labelKey: 'qa.newAlert', action: 'open:pm-new', icon: Target, color: 'text-red-400 bg-red-400/10' },
    { labelKey: 'qa.active', action: 'scroll:pm-active', icon: Zap, color: 'text-amber-400 bg-amber-400/10' },
    { labelKey: 'qa.history', action: 'scroll:pm-history', icon: History, color: 'text-blue-400 bg-blue-400/10' },
    { labelKey: 'qa.stats', action: 'scroll:pm-stats', icon: BarChart3, color: 'text-gold bg-gold/10' },
  ],
};

/* ------------------------------------------------------------------ */
//  Action Dispatcher — scrolls to section or opens dialog
/* ------------------------------------------------------------------ */

function dispatchAction(action: string) {
  const [type, ...rest] = action.split(':');
  const target = rest.join(':');

  if (type === 'navigate') {
    const store = useAppStore.getState();
    store.setPage(target);
    return;
  }

  if (type === 'scroll') {
    const el = document.getElementById(target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Brief highlight pulse on the target
      el.style.outline = '2px solid rgba(212,175,55,0.6)';
      el.style.outlineOffset = '4px';
      el.style.borderRadius = '12px';
      setTimeout(() => {
        el.style.outline = 'none';
        el.style.outlineOffset = '0';
      }, 1200);
    } else {
      // Fallback: scroll to top of main content area
      const main = document.querySelector('main') || document.documentElement;
      main.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return;
  }

  // 'open:' and 'click:' and 'filter:' and 'tab:' are handled by pages via event listeners
  if (type === 'open' || type === 'click' || type === 'filter' || type === 'tab') {
    window.dispatchEvent(new CustomEvent('zarrin-quick-action', { detail: { action } }));
  }
}

/* ------------------------------------------------------------------ */
//  QAButton — Individual action button
/* ------------------------------------------------------------------ */

function QAButton({ item, label }: { item: QAAction; label: string }) {
  const Icon = item.icon;

  // Extract text color from color string (e.g. "text-emerald-500 bg-emerald-500/10" → "text-emerald-400")
  const textColor = item.color.split(' ')[0].replace(/-\d+/, '-400');

  return (
    <button
      type="button"
      onClick={() => dispatchAction(item.action)}
      className="group relative flex flex-col items-center gap-1.5 py-1.5 focus:outline-none"
      style={{ transition: 'transform 0.15s ease' }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.88)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.88)'; }}
      onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <div
        className={cn(
          'relative flex size-[50px] items-center justify-center rounded-[16px] transition-all duration-300',
        )}
        style={{ transition: 'transform 0.25s ease' }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
      >
        {/* Background */}
        <div
          className="absolute inset-0 rounded-[16px]"
          style={{
            background: 'linear-gradient(145deg, rgba(30,30,32,0.95) 0%, rgba(22,22,24,0.92) 50%, rgba(35,30,25,0.88) 100%)',
          }}
        />
        {/* Inner gold border gradient */}
        <div
          className="absolute inset-[0.5px] rounded-[15px]"
          style={{
            background: 'linear-gradient(145deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.04) 50%, rgba(212,175,55,0.12) 100%)',
          }}
        />
        {/* Top highlight */}
        <div
          className="absolute inset-x-2 top-[0.5px] h-[1px] rounded-full opacity-60"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.3) 50%, transparent 100%)',
          }}
        />
        {/* Bottom line */}
        <div
          className="absolute inset-x-3 bottom-[0.5px] h-[1px] rounded-full opacity-30"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
          }}
        />

        {/* Icon */}
        <Icon
          className={cn(
            'relative z-10 size-[21px] transition-all duration-300',
            textColor,
            'group-hover:brightness-125',
          )}
          strokeWidth={1.8}
        />

        {/* Hover glow */}
        <div
          className="absolute inset-0 rounded-[16px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle at center, rgba(212,175,55,0.08) 0%, transparent 70%)',
            boxShadow: 'inset 0 0 20px rgba(212,175,55,0.05)',
          }}
        />
      </div>
      <span className={cn(
        'text-[10px] font-medium leading-tight text-center max-w-[62px] truncate transition-colors duration-200',
        'text-muted-foreground/70 group-hover:text-foreground/90 group-active:text-foreground',
      )}>
        {label}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
//  PageQuickAccess — Page-specific INTRA-page action buttons
/* ------------------------------------------------------------------ */

export default function PageQuickAccess() {
  const { currentPage } = useAppStore();
  const { t } = useTranslation();

  const items = pageActions[currentPage];
  if (!items) return null;

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes popIn { from { opacity: 0; transform: scale(0.85) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-pop-in { animation: popIn 0.3s ease-out forwards; }
      `}</style>
      <div className="md:hidden animate-fade-in">
        <div
          className="relative rounded-[20px] p-3.5"
          style={{
            background: 'linear-gradient(145deg, rgba(20,20,22,0.88) 0%, rgba(16,16,18,0.92) 50%, rgba(22,20,18,0.85) 100%)',
            backdropFilter: 'blur(24px) saturate(200%)',
            WebkitBackdropFilter: 'blur(24px) saturate(200%)',
            boxShadow: [
              '0 8px 40px rgba(0,0,0,0.25)',
              '0 0 0 0.5px rgba(212,175,55,0.1)',
              '0 1px 0 rgba(255,255,255,0.04) inset',
              '0 -1px 0 rgba(0,0,0,0.3) inset',
            ].join(', '),
          }}
        >
          {/* Top shimmer line */}
          <div
            className="pointer-events-none absolute inset-x-4 top-0 h-[1px] overflow-hidden rounded-full"
          >
            <div
              className="h-full w-full"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.2) 20%, rgba(212,175,55,0.5) 50%, rgba(212,175,55,0.2) 80%, transparent 100%)',
                animation: 'goldShimmer 4s ease-in-out infinite',
              }}
            />
          </div>
          <div className="grid grid-cols-4 justify-items-center gap-y-2 gap-x-1">
            {items.map((item, index) => (
              <div
                key={item.action}
                className="animate-pop-in"
                style={{ animationDelay: `${index * 40 + 50}ms` }}
              >
                <QAButton item={item} label={t(item.labelKey)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

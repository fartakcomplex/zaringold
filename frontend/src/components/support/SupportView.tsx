
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {useAppStore} from '@/lib/store';
import {usePageEvent} from '@/hooks/use-page-event';
import {useTranslation} from '@/lib/i18n';
import {cn} from '@/lib/utils';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Textarea} from '@/components/ui/textarea';
import {Skeleton} from '@/components/ui/skeleton';
import {Separator} from '@/components/ui/separator';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Plus, MessageSquare, Send, ChevronLeft, ChevronRight, TicketCheck, Headphones, Clock, CheckCircle2, Inbox, Star, X, Shield, AlertTriangle, Loader2, CircleDot, MessageCircle, LiveChat} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Config Constants                                                    */
/* ------------------------------------------------------------------ */

const CATEGORIES: Record<string, { label: string; emoji: string; color: string }> = {
  payment: { label: 'پرداخت', emoji: '💰', color: '#10B981' },
  kyc: { label: 'احراز هویت', emoji: '🔒', color: '#8B5CF6' },
  bug: { label: 'باگ', emoji: '🐛', color: '#EF4444' },
  account: { label: 'حساب کاربری', emoji: '👤', color: '#3B82F6' },
  trading: { label: 'معاملات', emoji: '📊', color: '#F59E0B' },
  'gold-card': { label: 'کارت طلایی', emoji: '💳', color: '#D4AF37' },
  'gold-transfer': { label: 'انتقال طلا', emoji: '💎', color: '#EC4899' },
  market: { label: 'بازار', emoji: '📈', color: '#06B6D4' },
  other: { label: 'سایر', emoji: '❓', color: '#6B7280' },
};

const STATUSES: Record<string, { label: string; color: string }> = {
  open: { label: 'باز', color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  in_progress: { label: 'در حال بررسی', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  answered: { label: 'پاسخ داده شده', color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  closed: { label: 'بسته شده', color: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' },
};

const PRIORITIES: Record<string, { label: string; color: string; dot: string }> = {
  urgent: { label: 'فوری', color: 'bg-red-500/20 text-red-400 border border-red-500/30', dot: 'bg-red-500' },
  high: { label: 'بالا', color: 'bg-orange-500/20 text-orange-400 border border-orange-500/30', dot: 'bg-orange-500' },
  normal: { label: 'عادی', color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', dot: 'bg-yellow-500' },
  low: { label: 'پایین', color: 'bg-gray-500/20 text-gray-400 border border-gray-500/30', dot: 'bg-gray-400' },
};

const FILTER_TABS = [
  { value: 'all', label: 'همه' },
  { value: 'open', label: 'باز' },
  { value: 'answered', label: 'پاسخ داده شده' },
  { value: 'closed', label: 'بسته شده' },
];

/* ------------------------------------------------------------------ */
/*  Helper Functions                                                    */
/* ------------------------------------------------------------------ */

function timeAgo(date: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'همین الان';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} دقیقه پیش`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ساعت پیش`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} روز پیش`;
  return new Intl.DateTimeFormat('fa-IR').format(new Date(date));
}

function getInitial(name: string | undefined | null): string {
  if (!name) return 'ک';
  return name.charAt(0);
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; fullName: string; phone: string; avatar?: string };
  messages?: TicketMessage[];
  _count?: { messages: number };
  rating?: number | null;
}

interface TicketMessage {
  id: string;
  senderId: string;
  content: string;
  isAdmin: boolean;
  createdAt: string;
  isInternal?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SupportView() {
  const { user, addToast } = useAppStore();
  const { t, locale } = useTranslation();

  /* ── State ── */
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, open: 0, answered: 0, closed: 0 });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'other',
    priority: 'normal',
    message: '',
  });

  const [activeTab, setActiveTab] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [closingTicket, setClosingTicket] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ── Page Event Listeners ── */
  usePageEvent('new-ticket', () => {
    setCreateDialogOpen(true);
  });

  /* ── Set active page ── */
  useEffect(() => {
    useAppStore.getState().setPage('support');
  }, []);

  /* ── Load Tickets ── */
  const loadTickets = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tickets');
      if (res.ok) {
        const data = await res.json();
        const ticketList = data.data?.tickets || data.tickets || Array.isArray(data) ? data : [];
        setTickets(Array.isArray(ticketList) ? ticketList : []);
        if (data.data?.stats) {
          setStats(data.data.stats);
        } else {
          const list = Array.isArray(ticketList) ? ticketList : [];
          setStats({
            total: list.length,
            open: list.filter((t: Ticket) => t.status === 'open' || t.status === 'in_progress').length,
            answered: list.filter((t: Ticket) => t.status === 'answered').length,
            closed: list.filter((t: Ticket) => t.status === 'closed').length,
          });
        }
      }
    } catch {
      /* silent */
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const fetchTickets = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch('/api/tickets', { signal: controller.signal });
        if (res.ok && !cancelled) {
          const data = await res.json();
          const ticketList = data.data?.tickets || data.tickets || Array.isArray(data) ? data : [];
          setTickets(Array.isArray(ticketList) ? ticketList : []);
          if (data.data?.stats) {
            setStats(data.data.stats);
          } else {
            const list = Array.isArray(ticketList) ? ticketList : [];
            setStats({
              total: list.length,
              open: list.filter((t: Ticket) => t.status === 'open' || t.status === 'in_progress').length,
              answered: list.filter((t: Ticket) => t.status === 'answered').length,
              closed: list.filter((t: Ticket) => t.status === 'closed').length,
            });
          }
        }
      } catch {
        /* silent */
      }
      if (!cancelled) setLoading(false);
    };

    fetchTickets();
    return () => { cancelled = true; controller.abort(); };
  }, [user?.id]);

  /* ── Scroll to bottom of messages ── */
  useEffect(() => {
    if (selectedTicket?.messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages?.length, detailLoading]);

  /* ── Create Ticket ── */
  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      addToast('لطفاً موضوع و پیام را وارد کنید', 'error');
      return;
    }
    if (newTicket.subject.trim().length < 5) {
      addToast('موضوع باید حداقل ۵ کاراکتر باشد', 'error');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newTicket.subject.trim(),
          category: newTicket.category,
          priority: newTicket.priority,
          message: newTicket.message.trim(),
        }),
      });
      if (res.ok) {
        addToast('تیکت با موفقیت ایجاد شد', 'success');
        setCreateDialogOpen(false);
        setNewTicket({ subject: '', category: 'other', priority: 'normal', message: '' });
        window.dispatchEvent(new CustomEvent('page-event', { detail: 'ticket-created' }));
        loadTickets();
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.message || 'خطا در ایجاد تیکت', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
    setCreating(false);
  };

  /* ── Select Ticket (Load Detail) ── */
  const handleSelectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDetailLoading(true);
    setReplyText('');
    setUserRating(ticket.rating || 0);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`);
      if (res.ok) {
        const data = await res.json();
        const detail = data.data || data;
        setSelectedTicket((prev) => (prev ? { ...prev, ...detail } : detail));
        setUserRating(detail.rating || 0);
      }
    } catch {
      /* use existing data */
    }
    setDetailLoading(false);
  };

  /* ── Send Reply ── */
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim() }),
      });
      if (res.ok) {
        addToast('پاسخ ارسال شد', 'success');
        setReplyText('');
        await handleSelectTicket(selectedTicket);
        loadTickets();
      } else {
        addToast('خطا در ارسال پاسخ', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
    setSendingReply(false);
  };

  /* ── Close Ticket ── */
  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    setClosingTicket(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });
      if (res.ok) {
        addToast('تیکت بسته شد', 'success');
        await handleSelectTicket(selectedTicket);
        loadTickets();
      } else {
        addToast('خطا در بستن تیکت', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
    setClosingTicket(false);
  };

  /* ── Submit Rating ── */
  const handleSubmitRating = async (rating: number) => {
    if (!selectedTicket || rating < 1) return;
    setSubmittingRating(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      if (res.ok) {
        setUserRating(rating);
        addToast('امتیاز شما ثبت شد. سپاسگزاریم!', 'success');
        setSelectedTicket((prev) => (prev ? { ...prev, rating } : prev));
      } else {
        addToast('خطا در ثبت امتیاز', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
    setSubmittingRating(false);
  };

  /* ── Go to Chat ── */
  const goToChat = () => {
    useAppStore.getState().setPage('chat');
  };

  /* ── Filtered Tickets ── */
  const filteredTickets = activeTab === 'all'
    ? tickets
    : tickets.filter((t) => t.status === activeTab);

  /* ── Loading Skeleton ── */
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 page-transition">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={`t-${i}`} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  RENDER                                                           */
  /* ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="mx-auto max-w-4xl space-y-5 page-transition">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gold gold-text-shadow">پشتیبانی</h1>
          <p className="text-sm text-muted-gold mt-1">
            تیکت‌ها و درخواست‌های پشتیبانی شما
          </p>
        </div>
        <Button
          className="btn-gold-gradient gap-2"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">تیکت جدید</span>
          <span className="sm:hidden">ثبت</span>
        </Button>
      </div>

      {/* ── Stats Cards (3 in a row) ── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {/* Open Tickets */}
        <Card className="card-gold-border hover-lift-sm">
          <CardContent className="pt-4 pb-4 px-3 sm:px-4">
            <div className="flex items-center justify-between mb-2">
              <div className="size-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <CircleDot className="size-4 text-emerald-400" />
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5">
                فعال
              </Badge>
            </div>
            <p className="text-2xl font-bold text-emerald-400 tabular-nums">{stats.open}</p>
            <p className="text-xs text-muted-foreground mt-0.5">تیکت باز</p>
          </CardContent>
        </Card>

        {/* Total Tickets */}
        <Card className="card-gold-border hover-lift-sm">
          <CardContent className="pt-4 pb-4 px-3 sm:px-4">
            <div className="flex items-center justify-between mb-2">
              <div className="size-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Inbox className="size-4 text-blue-400" />
              </div>
              <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] px-1.5">
                کل
              </Badge>
            </div>
            <p className="text-2xl font-bold text-blue-400 tabular-nums">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">کل تیکت‌ها</p>
          </CardContent>
        </Card>

        {/* Closed Tickets */}
        <Card className="card-gold-border hover-lift-sm">
          <CardContent className="pt-4 pb-4 px-3 sm:px-4">
            <div className="flex items-center justify-between mb-2">
              <div className="size-9 rounded-lg bg-gray-500/15 flex items-center justify-center">
                <CheckCircle2 className="size-4 text-gray-400" />
              </div>
              <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/30 text-[10px] px-1.5">
                پایان
              </Badge>
            </div>
            <p className="text-2xl font-bold text-gray-400 tabular-nums">{stats.closed}</p>
            <p className="text-xs text-muted-foreground mt-0.5">بسته شده</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Filter Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 w-full justify-start overflow-x-auto no-scrollbar">
          {FILTER_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'text-sm data-[state=active]:bg-gold data-[state=active]:text-white',
                'data-[state=active]:shadow-sm',
                activeTab === tab.value && 'text-gold'
              )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* ── Content Area ── */}
      <div className="min-h-[400px]">
        {selectedTicket ? (
          /* ── Ticket Detail View ── */
          <Card className="card-gold-border overflow-hidden">
            {/* Detail Header */}
            <CardHeader className="border-b border-gold/10 px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-start gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 shrink-0 text-muted-foreground hover:text-gold"
                  onClick={() => setSelectedTicket(null)}
                >
                  <ChevronRight className="size-5" />
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg sm:text-xl">
                      {CATEGORIES[selectedTicket.category]?.emoji || '📋'}
                    </span>
                    <h2 className="font-bold text-base sm:text-lg truncate">
                      {selectedTicket.subject}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {/* Status Badge */}
                    <Badge className={cn('text-[11px]', STATUSES[selectedTicket.status]?.color)}>
                      {STATUSES[selectedTicket.status]?.label || selectedTicket.status}
                    </Badge>
                    {/* Priority Badge */}
                    {selectedTicket.priority && (
                      <Badge className={cn('text-[11px]', PRIORITIES[selectedTicket.priority]?.color)}>
                        <span className={cn('size-1.5 rounded-full ml-1', PRIORITIES[selectedTicket.priority]?.dot)} />
                        {PRIORITIES[selectedTicket.priority]?.label}
                      </Badge>
                    )}
                    {/* Category Badge */}
                    <Badge variant="outline" className="text-[11px] border-gold/20 text-gold/80">
                      {CATEGORIES[selectedTicket.category]?.label || selectedTicket.category}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" />
                      {timeAgo(selectedTicket.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 flex flex-col" style={{ minHeight: '360px' }}>
              {/* ── Messages Thread ── */}
              <div className="flex-1 max-h-[420px] overflow-y-auto p-4 sm:p-6 space-y-4 mobile-scroll">
                {detailLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-3/4 rounded-xl" />
                    ))}
                  </div>
                ) : selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages
                    .filter((msg) => !msg.isInternal)
                    .map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex gap-3',
                          msg.isAdmin ? 'justify-start' : 'justify-end'
                        )}
                      >
                        {/* Avatar */}
                        <div className="flex gap-3 max-w-[85%] sm:max-w-[75%]">
                          {msg.isAdmin && (
                            <div className="size-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0 mt-1 border border-gold/30">
                              <Shield className="size-4 text-gold" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            {/* Sender Info */}
                            <div className={cn(
                              'flex items-center gap-2 mb-1.5',
                              msg.isAdmin ? '' : 'justify-end'
                            )}>
                              <span className="text-xs font-medium">
                                {msg.isAdmin ? 'پشتیبانی' : user?.fullName || 'شما'}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px] px-1.5 py-0',
                                  msg.isAdmin
                                    ? 'border-gold/30 text-gold/80'
                                    : 'border-muted text-muted-foreground'
                                )}
                              >
                                {msg.isAdmin ? 'ادمین' : 'کاربر'}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {timeAgo(msg.createdAt)}
                              </span>
                            </div>

                            {/* Message Bubble */}
                            <div
                              className={cn(
                                'rounded-xl px-4 py-3',
                                msg.isAdmin
                                  ? 'bg-gold/10 border border-gold/20 rounded-tr-sm'
                                  : 'bg-muted/60 border border-border rounded-tl-sm'
                              )}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {msg.content}
                              </p>
                            </div>
                          </div>

                          {/* User Avatar */}
                          {!msg.isAdmin && (
                            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1 border border-primary/30">
                              <span className="text-xs font-bold text-primary">
                                {getInitial(user?.fullName)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <MessageSquare className="size-14 mb-3 opacity-25" />
                    <p className="text-sm">هنوز پیامی ارسال نشده</p>
                    <p className="text-xs mt-1 opacity-70">اولین پیام را ارسال کنید</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <Separator className="bg-gold/10" />

              {/* ── Rating Section (if answered or closed) ── */}
              {(selectedTicket.status === 'answered' || selectedTicket.status === 'closed') && (
                <div className="px-4 sm:px-6 py-3 border-b border-gold/10">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-muted-foreground">رضایت شما:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          disabled={submittingRating || !!userRating}
                          className={cn(
                            'p-0.5 transition-transform hover:scale-110',
                            (userRating || hoverRating) >= star ? 'text-gold' : 'text-muted-foreground/40',
                            userRating ? 'cursor-default' : 'cursor-pointer'
                          )}
                          onMouseEnter={() => !userRating && setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => !userRating && handleSubmitRating(star)}
                        >
                          <Star
                            className="size-5"
                            fill={(userRating || hoverRating) >= star ? 'currentColor' : 'none'}
                          />
                        </button>
                      ))}
                    </div>
                    {userRating > 0 && (
                      <span className="text-xs text-gold">
                        {userRating} از ۵ — از بازخورد شما سپاسگزاریم
                      </span>
                    )}
                    {submittingRating && (
                      <Loader2 className="size-3.5 animate-spin text-gold" />
                    )}
                  </div>
                </div>
              )}

              {/* ── Close Ticket Button (if answered) ── */}
              {selectedTicket.status === 'answered' && (
                <div className="px-4 sm:px-6 py-2.5 border-b border-gold/10">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gold/20 text-gold hover:bg-gold/10 gap-2 w-full sm:w-auto"
                    onClick={handleCloseTicket}
                    disabled={closingTicket}
                  >
                    {closingTicket ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    بستن تیکت
                  </Button>
                </div>
              )}

              {/* ── Reply Input ── */}
              {selectedTicket.status !== 'closed' && (
                <div className="p-4 sm:p-6">
                  <div className="flex gap-2 items-end">
                    <Textarea
                      className="input-gold-focus min-h-[44px] max-h-28 resize-none"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="پاسخ خود را بنویسید..."
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                    />
                    <Button
                      className="btn-gold-gradient shrink-0 size-11 p-0"
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyText.trim()}
                    >
                      {sendingReply ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <Send className="size-5 rotate-180" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Enter برای ارسال · Shift+Enter برای خط جدید
                  </p>
                </div>
              )}

              {/* ── Closed Ticket Notice ── */}
              {selectedTicket.status === 'closed' && (
                <div className="p-4 sm:p-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <CheckCircle2 className="size-4" />
                    <span>این تیکت بسته شده است</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    در صورت نیاز می‌توانید تیکت جدیدی ثبت کنید
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* ── Ticket List ── */
          <>
            {filteredTickets.length > 0 ? (
              <div className="space-y-3">
                {filteredTickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="card-gold-border table-row-hover-gold cursor-pointer card-press"
                    onClick={() => handleSelectTicket(ticket)}
                  >
                    <CardContent className="py-4 px-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Category Icon */}
                          <div className="size-10 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 border border-border">
                            <span className="text-xl">
                              {CATEGORIES[ticket.category]?.emoji || '📋'}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm truncate">{ticket.subject}</h3>
                              {ticket._count?.messages ? (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                                  {ticket._count.messages}
                                </Badge>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="text-xs text-muted-gold flex items-center gap-1">
                                <Clock className="size-3" />
                                {timeAgo(ticket.createdAt)}
                              </span>
                              {CATEGORIES[ticket.category] && (
                                <span className="text-[11px] text-muted-foreground">
                                  {CATEGORIES[ticket.category].label}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 shrink-0 flex-col sm:flex-row">
                          {ticket.priority && (
                            <Badge className={cn('text-[10px]', PRIORITIES[ticket.priority]?.color)}>
                              <span className={cn('size-1.5 rounded-full ml-1', PRIORITIES[ticket.priority]?.dot)} />
                              {PRIORITIES[ticket.priority]?.label}
                            </Badge>
                          )}
                          <Badge className={cn('text-[10px]', STATUSES[ticket.status]?.color)}>
                            {STATUSES[ticket.status]?.label || ticket.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* ── Empty State ── */
              <Card className="card-gold-border">
                <CardContent className="py-16 px-6 text-center">
                  <div className="size-20 mx-auto mb-5 rounded-full bg-gold/10 flex items-center justify-center border border-gold/20">
                    <Headphones className="size-10 text-gold/60" />
                  </div>
                  <h3 className="text-lg font-bold text-muted-foreground">
                    {activeTab === 'all'
                      ? 'هنوز تیکتی ثبت نکرده‌اید'
                      : `تیکت ${FILTER_TABS.find((t) => t.value === activeTab)?.label || ''}یافت نشد`}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
                    {activeTab === 'all'
                      ? 'برای دریافت پشتیبانی، یک تیکت جدید ایجاد کنید. تیم ما آماده کمک به شماست.'
                      : 'در حال حاضر تیکتی با این وضعیت وجود ندارد.'}
                  </p>
                  {activeTab === 'all' && (
                    <Button
                      variant="outline"
                      className="mt-5 btn-gold-outline gap-2"
                      onClick={() => setCreateDialogOpen(true)}
                    >
                      <Plus className="size-4" />
                      ایجاد تیکت جدید
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* ── Quick Help Section ── */}
      <Card className="card-glass-premium border-gold/20 overflow-hidden">
        <div className="bg-gradient-to-l from-gold/5 via-transparent to-transparent p-5">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-full bg-gold/15 flex items-center justify-center shrink-0 border border-gold/25 icon-breathe">
              <TicketCheck className="size-6 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gold">
                نیاز به کمک فوری دارید؟
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                پشتیبانی آنلاین ۲۴/۷ — در کمترین زمان پاسخگوی شما هستیم
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-gold/30 text-gold hover:bg-gold/10 gap-2 shrink-0"
              onClick={goToChat}
            >
              <MessageCircle className="size-4" />
              <span className="hidden sm:inline">چت آنلاین</span>
              <span className="sm:hidden">چت</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  Create Ticket Dialog                                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gold">
              <MessageSquare className="size-5" />
              ایجاد تیکت جدید
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              فرم زیر را پر کنید تا تیم پشتیبانی در اسرع وقت پاسخگوی شما باشد.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                موضوع <span className="text-red-400">*</span>
              </label>
              <Input
                className="input-gold-focus"
                value={newTicket.subject}
                onChange={(e) =>
                  setNewTicket({ ...newTicket, subject: e.target.value })
                }
                placeholder="موضوع تیکت خود را وارد کنید"
                maxLength={120}
              />
              <p className="text-[11px] text-muted-foreground text-left" dir="ltr">
                {newTicket.subject.length}/120
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">دسته‌بندی</label>
              <Select
                value={newTicket.category}
                onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}
              >
                <SelectTrigger className="select-gold">
                  <SelectValue placeholder="انتخاب دسته‌بندی" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium">اولویت</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(PRIORITIES).map(([key, pri]) => (
                  <button
                    key={key}
                    type="button"
                    className={cn(
                      'rounded-lg px-3 py-2.5 text-xs font-medium transition-all border',
                      'flex items-center gap-2 justify-center',
                      newTicket.priority === key
                        ? pri.color + ' ring-1 ring-current'
                        : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
                    )}
                    onClick={() => setNewTicket({ ...newTicket, priority: key })}
                  >
                    <span className={cn('size-2 rounded-full', pri.dot)} />
                    {pri.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                پیام <span className="text-red-400">*</span>
              </label>
              <Textarea
                className="input-gold-focus min-h-[120px]"
                value={newTicket.message}
                onChange={(e) =>
                  setNewTicket({ ...newTicket, message: e.target.value })
                }
                placeholder="توضیحات کامل مشکل یا درخواست خود را بنویسید..."
                maxLength={2000}
              />
              <p className="text-[11px] text-muted-foreground text-left" dir="ltr">
                {newTicket.message.length}/2000
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCreateDialogOpen(false)}
              disabled={creating}
            >
              انصراف
            </Button>
            <Button
              className="flex-1 btn-gold-gradient gap-2"
              onClick={handleCreateTicket}
              disabled={
                creating ||
                !newTicket.subject.trim() ||
                !newTicket.message.trim()
              }
            >
              {creating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  در حال ارسال...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  ارسال تیکت
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

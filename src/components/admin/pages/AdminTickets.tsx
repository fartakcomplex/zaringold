'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Ticket,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Send,
  User,
  Filter,
  Shield,
  Star,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Lock,
  Phone,
  Mail,
  StickyNote,
  FileText,
  X,
  AlarmClock,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Configuration                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

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

const DEPARTMENTS = [
  { value: 'support', label: 'پشتیبانی', emoji: '🎧' },
  { value: 'technical', label: 'فنی', emoji: '🔧' },
  { value: 'financial', label: 'مالی', emoji: '💰' },
  { value: 'kyc', label: 'احراز هویت', emoji: '🔒' },
  { value: 'trading', label: 'معاملات', emoji: '📊' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function timeAgo(date: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'همین الان';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} دقیقه پیش`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ساعت پیش`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} روز پیش`;
  return new Intl.DateTimeFormat('fa-IR').format(new Date(date));
}

function toPersianNum(n: number): string {
  return n.toLocaleString('fa-IR');
}

function getDeptLabel(val: string): string {
  return DEPARTMENTS.find((d) => d.value === val)?.label || val;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface TicketRow {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  department: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: { phone: string; fullName: string | null; email?: string | null };
  slaBreached?: boolean;
  rating?: number | null;
}

interface TicketMessage {
  id: string;
  content: string;
  isAdmin: boolean;
  isInternal?: boolean;
  createdAt: string;
  user?: { fullName: string | null };
}

interface CannedResponse {
  id: string;
  title: string;
  content: string;
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  answered: number;
  closed: number;
  urgentOrSLA: number;
  avgRating: number;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AdminTickets() {
  const { user } = useAppStore();
  const adminId = user?.id || '';

  /* ── List state ──────────────────────────────────────────────────────── */
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  /* ── Filters ─────────────────────────────────────────────────────────── */
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  /* ── Selection ───────────────────────────────────────────────────────── */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /* ── Detail dialog ───────────────────────────────────────────────────── */
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<TicketRow | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyInternal, setReplyInternal] = useState(false);
  const [replySending, setReplySending] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editDepartment, setEditDepartment] = useState('');

  /* ── Canned responses ────────────────────────────────────────────────── */
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);

  /* ── Delete confirm ──────────────────────────────────────────────────── */
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* ── Bulk closing ────────────────────────────────────────────────────── */
  const [bulkClosing, setBulkClosing] = useState(false);

  /* ────────────────────────────────────────────────────────────────────── */
  /*  Fetch helpers                                                        */
  /* ────────────────────────────────────────────────────────────────────── */

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusTab !== 'all') params.set('status', statusTab);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (departmentFilter !== 'all') params.set('department', departmentFilter);
      if (searchQuery) params.set('search', searchQuery);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const res = await fetch(`/api/tickets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(Array.isArray(data.tickets) ? data.tickets : Array.isArray(data) ? data : []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch {
      /* silent */
    }
    setLoading(false);
  }, [statusTab, categoryFilter, priorityFilter, departmentFilter, searchQuery, page]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/tickets/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      /* silent */
    }
  }, []);

  const fetchCanned = useCallback(async () => {
    try {
      const res = await fetch('/api/tickets/canned');
      if (res.ok) {
        const data = await res.json();
        setCannedResponses(Array.isArray(data) ? data : data.responses || []);
      }
    } catch {
      /* silent */
    }
  }, []);

  /* ── Initial load & refetch on filter change ─────────────────────────── */
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchStats(); fetchCanned(); }, [fetchStats, fetchCanned]);

  /* ────────────────────────────────────────────────────────────────────── */
  /*  Actions                                                              */
  /* ────────────────────────────────────────────────────────────────────── */

  const openDetail = async (ticket: TicketRow) => {
    setActiveTicket(ticket);
    setEditStatus(ticket.status);
    setEditPriority(ticket.priority || 'normal');
    setEditDepartment(ticket.department || 'support');
    setReplyContent('');
    setReplyInternal(false);
    setDetailOpen(true);
    setMsgLoading(true);
    setMessages([]);

    try {
      const res = await fetch(`/api/tickets/${ticket.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      }
    } catch {
      /* silent */
    }
    setMsgLoading(false);
  };

  const handleReply = async () => {
    if (!activeTicket || !replyContent.trim()) return;
    setReplySending(true);
    try {
      const res = await fetch(`/api/tickets/${activeTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          isAdmin: true,
          isInternal: replyInternal,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
        setReplyContent('');
        setReplyInternal(false);
        useAppStore.getState().addToast('پاسخ ارسال شد', 'success');
        fetchTickets();
      }
    } catch {
      useAppStore.getState().addToast('خطا در ارسال پاسخ', 'error');
    }
    setReplySending(false);
  };

  const handleUpdateTicket = async (field: string, value: string) => {
    if (!activeTicket) return;
    try {
      const res = await fetch(`/api/tickets/${activeTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        setActiveTicket((prev) => (prev ? { ...prev, [field]: value } : prev));
        useAppStore.getState().addToast('تیکت بروزرسانی شد', 'success');
        fetchTickets();
        fetchStats();
      }
    } catch {
      useAppStore.getState().addToast('خطا در بروزرسانی', 'error');
    }
  };

  const handleDeleteTicket = async () => {
    if (!activeTicket) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tickets/${activeTicket.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        useAppStore.getState().addToast('تیکت حذف شد', 'success');
        setDetailOpen(false);
        setActiveTicket(null);
        fetchTickets();
        fetchStats();
      }
    } catch {
      useAppStore.getState().addToast('خطا در حذف تیکت', 'error');
    }
    setDeleting(false);
    setDeleteConfirm(false);
  };

  const handleBulkClose = async () => {
    if (selectedIds.size === 0) return;
    setBulkClosing(true);
    try {
      const res = await fetch('/api/tickets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close',
          ticketIds: Array.from(selectedIds),
        }),
      });
      if (res.ok) {
        useAppStore.getState().addToast(`${toPersianNum(selectedIds.size)} تیکت بسته شد`, 'success');
        setSelectedIds(new Set());
        fetchTickets();
        fetchStats();
      }
    } catch {
      useAppStore.getState().addToast('خطا در بستن تیکت‌ها', 'error');
    }
    setBulkClosing(false);
  };

  /* ── Selection helpers ───────────────────────────────────────────────── */
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === tickets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tickets.map((t) => t.id)));
    }
  };

  /* ────────────────────────────────────────────────────────────────────── */
  /*  Render                                                               */
  /* ────────────────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-5">
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*  Stats Dashboard                                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total */}
        <Card className="card-spotlight">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground">کل تیکت‌ها</p>
                <p className="text-xl font-bold gold-gradient-text">
                  {toPersianNum(stats?.total ?? tickets.length)}
                </p>
              </div>
              <div className="size-9 rounded-lg flex items-center justify-center bg-white/10">
                <Ticket className="size-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Open */}
        <Card className="card-spotlight">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground">باز</p>
                <p className="text-xl font-bold text-emerald-400">
                  {toPersianNum(stats?.open ?? 0)}
                </p>
              </div>
              <div className="size-9 rounded-lg flex items-center justify-center bg-emerald-500/15">
                <AlertTriangle className="size-4 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card className="card-spotlight">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground">در حال بررسی</p>
                <p className="text-xl font-bold text-blue-400">
                  {toPersianNum(stats?.inProgress ?? 0)}
                </p>
              </div>
              <div className="size-9 rounded-lg flex items-center justify-center bg-blue-500/15">
                <Clock className="size-4 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Urgent / SLA Breach */}
        <Card className="card-spotlight">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground">فوری / تخلف SLA</p>
                <p className="text-xl font-bold text-red-400">
                  {toPersianNum(stats?.urgentOrSLA ?? 0)}
                </p>
              </div>
              <div className="size-9 rounded-lg flex items-center justify-center bg-red-500/15">
                <AlarmClock className="size-4 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Rating */}
        <Card className="card-spotlight">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground">میانگین امتیاز</p>
                <div className="flex items-center gap-1">
                  <p className="text-xl font-bold text-gold">
                    {stats?.avgRating != null ? stats.avgRating.toFixed(1) : '-'}
                  </p>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'size-3',
                        (stats?.avgRating ?? 0) >= i + 1
                          ? 'text-gold fill-gold'
                          : (stats?.avgRating ?? 0) >= i + 0.5
                            ? 'text-gold fill-gold/50'
                            : 'text-muted-foreground/30'
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="size-9 rounded-lg flex items-center justify-center bg-gold/15">
                <Star className="size-4 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*  Search & Filters                                                 */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Card className="card-spotlight">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Search row */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="جستجو بر اساس موضوع، نام کاربر یا شماره تلفن..."
                  className="pr-9 h-9 text-sm"
                />
              </div>
              {selectedIds.size > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-9 gap-2 shrink-0"
                  onClick={handleBulkClose}
                  disabled={bulkClosing}
                >
                  <CheckCircle className="size-4" />
                  {bulkClosing ? 'در حال بستن...' : `بستن ${toPersianNum(selectedIds.size)} تیکت`}
                </Button>
              )}
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="size-4 text-muted-foreground shrink-0" />

              <Select
                value={categoryFilter}
                onValueChange={(v) => {
                  setCategoryFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-auto min-w-[140px] h-8 text-xs">
                  <SelectValue placeholder="دسته‌بندی" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه دسته‌ها</SelectItem>
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <SelectItem key={key} value={key}>
                      {cat.emoji} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={priorityFilter}
                onValueChange={(v) => {
                  setPriorityFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-auto min-w-[130px] h-8 text-xs">
                  <SelectValue placeholder="اولویت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه اولویت‌ها</SelectItem>
                  {Object.entries(PRIORITIES).map(([key, pri]) => (
                    <SelectItem key={key} value={key}>
                      {pri.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={departmentFilter}
                onValueChange={(v) => {
                  setDepartmentFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-auto min-w-[130px] h-8 text-xs">
                  <SelectValue placeholder="واحد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه واحدها</SelectItem>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.emoji} {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*  Status Tabs                                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Tabs
        value={statusTab}
        onValueChange={(v) => {
          setStatusTab(v);
          setPage(1);
        }}
      >
        <TabsList className="bg-muted/50 w-full h-auto flex-wrap">
          {[
            { value: 'all', label: 'همه' },
            { value: 'open', label: 'باز' },
            { value: 'in_progress', label: 'در حال بررسی' },
            { value: 'answered', label: 'پاسخ داده شده' },
            { value: 'closed', label: 'بسته شده' },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'text-xs px-3 py-1.5 data-[state=active]:bg-gold/15 data-[state=active]:text-gold data-[state=active]:border data-[state=active]:border-gold/30 rounded-lg'
              )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*  Ticket List                                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Card className="card-spotlight overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            /* ── Empty State ─────────────────────────────────────────────── */
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Ticket className="size-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                تیکتی یافت نشد
              </p>
              <p className="text-xs text-muted-foreground/60">
                با تغییر فیلترها یا عبارت جستجو، مجدداً تلاش کنید
              </p>
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-[520px]">
                <div className="divide-y divide-border/50">
                  {tickets.map((ticket) => {
                    const cat = CATEGORIES[ticket.category] || CATEGORIES.other;
                    const status = STATUSES[ticket.status] || STATUSES.open;
                    const priority = PRIORITIES[ticket.priority] || PRIORITIES.normal;
                    const dept = DEPARTMENTS.find((d) => d.value === ticket.department);
                    const isSelected = selectedIds.has(ticket.id);

                    return (
                      <div
                        key={ticket.id}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/30',
                          isSelected && 'bg-gold/5'
                        )}
                        onClick={() => openDetail(ticket)}
                      >
                        {/* Checkbox */}
                        <div
                          className="shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(ticket.id)}
                          />
                        </div>

                        {/* Category Emoji */}
                        <div
                          className="size-9 rounded-lg flex items-center justify-center text-base shrink-0"
                          style={{ backgroundColor: cat.color + '20' }}
                        >
                          {cat.emoji}
                        </div>

                        {/* Main content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold truncate">
                              {ticket.subject || 'بدون موضوع'}
                            </span>
                            {ticket.slaBreached && (
                              <AlarmClock className="size-3.5 text-red-400 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="truncate">
                              {ticket.user?.fullName || ticket.user?.phone || 'ناشناس'}
                            </span>
                            {ticket.user?.phone && (
                              <>
                                <span className="text-border">|</span>
                                <span className="truncate" dir="ltr">
                                  {ticket.user.phone}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Badges (desktop) */}
                        <div className="hidden md:flex items-center gap-2 shrink-0">
                          {/* Priority */}
                          <Badge
                            className={cn(
                              'text-[10px] px-2 py-0 flex items-center gap-1',
                              priority.color
                            )}
                          >
                            <span className={cn('size-1.5 rounded-full', priority.dot)} />
                            {priority.label}
                          </Badge>

                          {/* Status */}
                          <Badge className={cn('text-[10px] px-2 py-0', status.color)}>
                            {status.label}
                          </Badge>

                          {/* Department */}
                          {dept && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0 border-muted-foreground/20 text-muted-foreground"
                            >
                              {dept.emoji} {dept.label}
                            </Badge>
                          )}

                          {/* Time */}
                          <span className="text-[10px] text-muted-foreground min-w-[70px] text-left">
                            {timeAgo(ticket.updatedAt || ticket.createdAt)}
                          </span>
                        </div>

                        {/* Chevron */}
                        <ChevronLeft className="size-4 text-muted-foreground shrink-0 md:hidden" />
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* ── Pagination ──────────────────────────────────────────── */}
              <Separator />
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  نمایش{' '}
                  <span className="font-medium text-foreground">
                    {toPersianNum(tickets.length)}
                  </span>{' '}
                  از{' '}
                  <span className="font-medium text-foreground">
                    {toPersianNum(totalCount)}
                  </span>{' '}
                  تیکت
                </p>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronRight className="size-3.5" />
                    قبلی
                  </Button>

                  <span className="text-xs text-muted-foreground px-2">
                    {toPersianNum(page)} / {toPersianNum(totalPages)}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    بعدی
                    <ChevronLeft className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* ── Select All ─────────────────────────────────────────── */}
              <div className="px-4 pb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={toggleSelectAll}
                >
                  <Checkbox
                    checked={
                      tickets.length > 0 && selectedIds.size === tickets.length
                    }
                    className="size-3.5 ml-2"
                  />
                  {selectedIds.size === tickets.length
                    ? 'لغو انتخاب همه'
                    : 'انتخاب همه'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*  Ticket Detail Dialog                                             */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Dialog open={detailOpen} onOpenChange={(open) => {
        if (!open) {
          setDetailOpen(false);
          setActiveTicket(null);
          setDeleteConfirm(false);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          {activeTicket && (
            <>
              {/* ── Header ────────────────────────────────────────────────── */}
              <div className="p-5 pb-4 space-y-4 border-b border-border/50 shrink-0">
                <DialogHeader className="space-y-2 text-right">
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-base font-bold flex items-center gap-2">
                      {CATEGORIES[activeTicket.category]?.emoji || '🎫'}{' '}
                      {activeTicket.subject || 'بدون موضوع'}
                    </DialogTitle>
                    <Badge className={cn('text-[10px]', STATUSES[activeTicket.status]?.color || '')}>
                      {STATUSES[activeTicket.status]?.label || activeTicket.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <span className="font-mono" dir="ltr">
                      #{activeTicket.id.slice(-8).toUpperCase()}
                    </span>
                    <span>•</span>
                    <span>{timeAgo(activeTicket.createdAt)}</span>
                  </p>
                </DialogHeader>

                {/* User info card */}
                <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
                  <div className="size-10 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
                    <User className="size-5 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium truncate">
                      {activeTicket.user?.fullName || 'ناشناس'}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      {activeTicket.user?.phone && (
                        <span className="flex items-center gap-1" dir="ltr">
                          <Phone className="size-3" />
                          {activeTicket.user.phone}
                        </span>
                      )}
                      {activeTicket.user?.email && (
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="size-3" />
                          {activeTicket.user.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status / Priority / Department controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">وضعیت</Label>
                    <Select
                      value={editStatus}
                      onValueChange={(v) => {
                        setEditStatus(v);
                        handleUpdateTicket('status', v);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUSES).map(([key, st]) => (
                          <SelectItem key={key} value={key}>
                            {st.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">اولویت</Label>
                    <Select
                      value={editPriority}
                      onValueChange={(v) => {
                        setEditPriority(v);
                        handleUpdateTicket('priority', v);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITIES).map(([key, pr]) => (
                          <SelectItem key={key} value={key}>
                            {pr.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">واحد</Label>
                    <Select
                      value={editDepartment}
                      onValueChange={(v) => {
                        setEditDepartment(v);
                        handleUpdateTicket('department', v);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept.value} value={dept.value}>
                            {dept.emoji} {dept.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* ── Message Thread ────────────────────────────────────────── */}
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-5 space-y-4">
                  {msgLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-lg" />
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <MessageCircle className="size-8 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        پیامی وجود ندارد
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isAdmin = msg.isAdmin;
                      const isInternal = msg.isInternal;

                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex',
                            isInternal ? 'justify-start' : isAdmin ? 'justify-start' : 'justify-end'
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[85%] rounded-xl p-3.5 text-sm space-y-1.5',
                              isInternal
                                ? 'bg-purple-500/10 border border-purple-500/25'
                                : isAdmin
                                  ? 'bg-gold/8 border border-gold/20'
                                  : 'bg-muted/60 border border-border/40'
                            )}
                          >
                            {/* Sender */}
                            <div className="flex items-center gap-2">
                              {isInternal ? (
                                <>
                                  <div className="size-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <StickyNote className="size-3 text-purple-400" />
                                  </div>
                                  <Badge className="text-[9px] px-1.5 py-0 bg-purple-500/20 text-purple-400 border border-purple-500/30 h-4">
                                    یادداشت داخلی
                                  </Badge>
                                </>
                              ) : isAdmin ? (
                                <>
                                  <div className="size-5 rounded-full bg-gold/20 flex items-center justify-center">
                                    <Shield className="size-3 text-gold" />
                                  </div>
                                  <Badge className="text-[9px] px-1.5 py-0 bg-gold/15 text-gold border border-gold/30 h-4">
                                    پشتیبان
                                  </Badge>
                                </>
                              ) : (
                                <span className="text-[11px] font-medium text-muted-foreground">
                                  {msg.user?.fullName || 'کاربر'}
                                </span>
                              )}
                            </div>

                            {/* Content */}
                            <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>

                            {/* Time */}
                            <p className="text-[10px] text-muted-foreground/60">
                              {timeAgo(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              {/* ── Reply Area ────────────────────────────────────────────── */}
              <div className="border-t border-border/50 p-4 space-y-3 shrink-0">
                {/* Internal note toggle */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={replyInternal}
                      onCheckedChange={(checked) => setReplyInternal(!!checked)}
                    />
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Lock className="size-3" />
                      یادداشت داخلی (فقط برای ادمین‌ها)
                    </span>
                  </label>

                  {cannedResponses.length > 0 && (
                    <Select
                      onValueChange={(val) => {
                        const canned = cannedResponses.find((c) => c.id === val);
                        if (canned) setReplyContent(canned.content);
                      }}
                    >
                      <SelectTrigger className="w-auto min-w-[160px] h-7 text-[11px]">
                        <FileText className="size-3 ml-1 shrink-0" />
                        <SelectValue placeholder="پاسخ آماده..." />
                      </SelectTrigger>
                      <SelectContent>
                        {cannedResponses.map((canned) => (
                          <SelectItem key={canned.id} value={canned.id}>
                            {canned.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Textarea + Send */}
                <div className="flex gap-2">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={
                      replyInternal
                        ? 'یادداشت داخلی خود را بنویسید...'
                        : 'پاسخ خود را بنویسید...'
                    }
                    rows={3}
                    className="flex-1 text-sm resize-none"
                  />
                  <Button
                    onClick={handleReply}
                    disabled={replySending || !replyContent.trim()}
                    className="bg-gold hover:bg-gold/80 text-black self-end shrink-0 h-9 px-3"
                  >
                    {replySending ? (
                      <div className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                  </Button>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1.5 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400"
                      disabled={activeTicket.status === 'closed'}
                      onClick={() => {
                        handleUpdateTicket('status', 'closed');
                        setEditStatus('closed');
                      }}
                    >
                      <CheckCircle className="size-3" />
                      بستن تیکت
                    </Button>
                  </div>

                  {!deleteConfirm ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1.5 text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => setDeleteConfirm(true)}
                    >
                      <Trash2 className="size-3" />
                      حذف تیکت
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-red-400">آیا مطمئنید؟</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={handleDeleteTicket}
                        disabled={deleting}
                      >
                        {deleting ? 'در حال حذف...' : 'بله، حذف شود'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => setDeleteConfirm(false)}
                      >
                        انصراف
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

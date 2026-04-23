'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { usePageEvent } from '@/hooks/use-page-event';
import { formatDateTime, getTimeAgo } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, MessageSquare, Clock, CheckCircle, XCircle, HelpCircle,
  Send, ChevronLeft, Paperclip, Search, Filter, Inbox, TicketCheck,
  Headphones, AlertCircle
} from 'lucide-react';

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
  messages?: TicketMessage[];
}

interface TicketMessage {
  id: string;
  senderId: string;
  content: string;
  isAdmin: boolean;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  payment: 'پرداخت',
  kyc: 'احراز هویت',
  bug: 'مشکلات فنی',
  account: 'حساب کاربری',
  trading: 'معاملات',
  other: 'سایر',
  general: 'عمومی',
};

const statusLabels: Record<string, string> = {
  open: 'باز',
  closed: 'بسته شده',
  pending: 'پاسخ داده شده',
};

const statusColors: Record<string, string> = {
  open: 'badge-gold',
  pending: 'badge-success-green',
  closed: 'bg-muted/30 text-muted-foreground',
};

const priorityLabels: Record<string, string> = {
  low: 'کم',
  normal: 'عادی',
  high: 'زیاد',
};

const getPriorityBadgeClass = (priority: string) => {
  switch (priority) {
    case 'high': return 'badge-danger-red';
    case 'normal': return 'badge-warning-amber';
    case 'low': return 'badge-success-green';
    default: return '';
  }
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SupportView() {
  const { user, addToast } = useAppStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'general', message: '' });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  /* ── Quick Action Event Listeners ── */
  usePageEvent('new-ticket', () => { setCreateDialogOpen(true); });
  usePageEvent('faq', () => { addToast('به زودی فعال می‌شود', 'info'); });

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/tickets?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setTickets(Array.isArray(data) ? data : data.tickets || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      addToast('لطفاً عنوان و پیام را وارد کنید', 'error');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`/api/tickets?userId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newTicket.subject,
          category: newTicket.category,
          message: newTicket.message,
        }),
      });
      if (res.ok) {
        addToast('تیکت با موفقیت ایجاد شد', 'success');
        setCreateDialogOpen(false);
        setNewTicket({ subject: '', category: 'general', message: '' });
        // Refresh tickets list
        try {
          const listRes = await fetch(`/api/tickets?userId=${user.id}`);
          if (listRes.ok) {
            const listData = await listRes.json();
            setTickets(Array.isArray(listData) ? listData : listData.tickets || []);
          }
        } catch { /* ignore */ }
      } else {
        addToast('خطا در ایجاد تیکت', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
    setCreating(false);
  };

  const handleSelectTicket = async (ticket: Ticket) => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data.messages ? { ...ticket, ...data } : ticket);
      } else {
        setSelectedTicket(ticket);
      }
    } catch {
      setSelectedTicket(ticket);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}?userId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText }),
      });
      if (res.ok) {
        addToast('پاسخ ارسال شد', 'success');
        setReplyText('');
        handleSelectTicket(selectedTicket);
      } else {
        addToast('خطا در ارسال پاسخ', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
    setSendingReply(false);
  };

  const filteredTickets = filterStatus === 'all'
    ? tickets
    : tickets.filter((t) => t.status === filterStatus);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'payment': return '💳';
      case 'kyc': return '🛡️';
      case 'bug': return '🐛';
      case 'account': return '👤';
      case 'trading': return '📈';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">پشتیبانی</h1>
          <p className="text-sm text-muted-foreground">تیکت‌ها و درخواست‌های پشتیبانی شما</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gold-gradient">
              <Plus className="size-4 ml-2" />
              تیکت جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="size-5 text-gold" />
                ایجاد تیکت جدید
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>موضوع</Label>
                <Input
                  className="input-gold-focus"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="موضوع تیکت خود را وارد کنید"
                />
              </div>
              <div className="space-y-2">
                <Label>دسته‌بندی</Label>
                <Select value={newTicket.category} onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}>
                  <SelectTrigger className="select-gold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment">پرداخت</SelectItem>
                    <SelectItem value="kyc">احراز هویت</SelectItem>
                    <SelectItem value="bug">مشکلات فنی</SelectItem>
                    <SelectItem value="account">حساب کاربری</SelectItem>
                    <SelectItem value="trading">معاملات</SelectItem>
                    <SelectItem value="other">سایر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>پیام</Label>
                <Textarea
                  className="input-gold-focus"
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  placeholder="توضیحات خود را بنویسید..."
                  rows={5}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Paperclip className="size-4" />
                <span className="cursor-pointer hover:text-foreground">پیوست فایل</span>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setCreateDialogOpen(false)}>انصراف</Button>
                <Button className="flex-1 btn-gold-gradient" onClick={handleCreateTicket} disabled={creating}>
                  {creating ? 'در حال ارسال...' : 'ارسال تیکت'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="card-gold-border border-gold/10">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-gold">{tickets.filter(t => t.status === 'open').length}</p>
            <p className="text-xs text-muted-foreground">تیکت باز</p>
          </CardContent>
        </Card>
        <Card className="border-gold/10">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{tickets.length}</p>
            <p className="text-xs text-muted-foreground">کل تیکت‌ها</p>
          </CardContent>
        </Card>
        <Card className="border-gold/10">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'closed').length}</p>
            <p className="text-xs text-muted-foreground">تیکت بسته شده</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {['all', 'open', 'closed'].map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(status)}
            className={filterStatus === status ? 'bg-gold text-white' : ''}
          >
            {status === 'all' ? 'همه' : statusLabels[status] || status}
          </Button>
        ))}
      </div>

      {/* Ticket List / Detail */}
      {selectedTicket ? (
        <Card className="card-gold-border border-gold/10">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
                  <ChevronLeft className="size-4 ml-1" />
                  بازگشت
                </Button>
                <div>
                  <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-muted-gold">{getTimeAgo(selectedTicket.createdAt)}</span>
                    <Badge className={statusColors[selectedTicket.status] || ''}>
                      {statusLabels[selectedTicket.status] || selectedTicket.status}
                    </Badge>
                    {selectedTicket.priority && (
                      <Badge className={getPriorityBadgeClass(selectedTicket.priority)}>
                        {priorityLabels[selectedTicket.priority] || selectedTicket.priority}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {categoryLabels[selectedTicket.category] || selectedTicket.category}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="card-glass-premium max-h-96 overflow-y-auto p-4 space-y-4">
              {/* Messages */}
              {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                selectedTicket.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-xl p-3 ${
                      msg.isAdmin
                        ? 'bg-muted/80'
                        : 'card-gold-border bg-gold/10'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">{msg.isAdmin ? 'پشتیبانی' : 'شما'}</span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {msg.isAdmin ? 'ادمین' : 'کاربر'}
                        </Badge>
                        <span className="text-[10px] text-muted-gold">{getTimeAgo(msg.createdAt)}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="size-12 mx-auto mb-3 opacity-30" />
                  <p>هنوز پیامی ارسال نشده</p>
                </div>
              )}
            </div>

            {/* Reply Input */}
            {selectedTicket.status !== 'closed' && (
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    className="input-gold-focus"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="پاسخ خود را بنویسید..."
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                  />
                  <Button onClick={handleSendReply} disabled={sendingReply || !replyText.trim()} className="btn-gold-gradient shrink-0">
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {filteredTickets.length > 0 ? (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <Card key={ticket.id} className="table-row-hover-gold border-gold/10 cursor-pointer" onClick={() => handleSelectTicket(ticket)}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl mt-1">{getCategoryIcon(ticket.category)}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm">{ticket.subject}</h3>
                          <p className="text-xs text-muted-gold mt-1">{getTimeAgo(ticket.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {ticket.priority && (
                          <Badge className={getPriorityBadgeClass(ticket.priority)}>
                            {priorityLabels[ticket.priority] || ticket.priority}
                          </Badge>
                        )}
                        <Badge className={statusColors[ticket.status] || ''}>
                          {statusLabels[ticket.status] || ticket.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-gold/10">
              <CardContent className="py-12 text-center">
                <Headphones className="size-16 mx-auto text-gold-gradient mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">هنوز تیکتی ثبت نکرده‌اید</h3>
                <p className="text-sm text-muted-foreground mt-1">برای دریافت پشتیبانی، یک تیکت جدید ایجاد کنید</p>
                <Button variant="outline" className="mt-4 btn-gold-outline" onClick={() => setCreateDialogOpen(true)}>
                  ایجاد تیکت جدید
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Quick Help */}
      <Card className="card-glass-premium border-gold/10 bg-gradient-to-l from-gold/5 to-transparent">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
              <TicketCheck className="size-5 text-gold" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">نیاز به کمک فوری دارید؟</p>
              <p className="text-xs text-muted-foreground">پشتیبانی آنلاین ما ۲۴ ساعته در خدمت شماست</p>
            </div>
            <Button variant="outline" size="sm" className="border-gold/30 text-gold">
              چت آنلاین
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

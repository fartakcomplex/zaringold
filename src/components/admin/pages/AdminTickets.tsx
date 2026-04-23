'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { formatDateTime, getTimeAgo } from '@/lib/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Ticket, MessageCircle, Clock, CheckCircle, XCircle, AlertTriangle,
  Search, Eye, Send, User, Filter, Calendar, Reply
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Ticket {
  id: string; subject: string; status: string; priority: string;
  createdAt: string; updatedAt: string; userId: string;
  user?: { phone: string; fullName: string | null };
}

interface TicketMessage {
  id: string; content: string; isAdmin: boolean; createdAt: string;
  user?: { fullName: string | null };
}

export default function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/tickets');
        if (res.ok) {
          const d = await res.json();
          setTickets(Array.isArray(d) ? d : d.tickets || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const filtered = tickets.filter(t => {
    const matchFilter = filter === 'all' || t.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || (t.subject || '').toLowerCase().includes(q) || (t.user?.fullName || '').toLowerCase().includes(q) || (t.user?.phone || '').includes(q);
    return matchFilter && matchSearch;
  });

  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;

  const openTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`);
      if (res.ok) {
        const d = await res.json();
        setMessages(Array.isArray(d.messages) ? d.messages : []);
      }
    } catch { /* ignore */ }
    setMessagesLoading(false);
  };

  const handleReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply }),
      });
      if (res.ok) {
        setReply('');
        const d = await res.json();
        if (d.message) setMessages(prev => [...prev, d.message]);
        useAppStore.getState().addToast('پاسخ ارسال شد', 'success');
      }
    } catch { useAppStore.getState().addToast('خطا', 'error'); }
    setSending(false);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      open: { label: 'باز', cls: 'bg-amber-500/15 text-amber-500' },
      in_progress: { label: 'در حال بررسی', cls: 'bg-blue-500/15 text-blue-500' },
      resolved: { label: 'حل شده', cls: 'bg-emerald-500/15 text-emerald-500' },
      closed: { label: 'بسته شده', cls: 'bg-gray-500/15 text-gray-500' },
    };
    const item = map[status] || map.open;
    return <Badge className={cn('text-[10px]', item.cls)}>{item.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      high: { label: 'بالا', cls: 'bg-red-500/15 text-red-500' },
      medium: { label: 'متوسط', cls: 'bg-amber-500/15 text-amber-500' },
      low: { label: 'پایین', cls: 'bg-emerald-500/15 text-emerald-500' },
    };
    const item = map[priority] || map.medium;
    return <Badge className={cn('text-[10px]', item.cls)}>{item.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'کل تیکت‌ها', value: tickets.length, icon: Ticket, color: 'text-gold', bg: 'bg-gold/15' },
          { label: 'باز', value: openCount, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/15' },
          { label: 'در حال بررسی', value: inProgressCount, icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-500/15' },
          { label: 'پاسخ داده شده', value: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/15' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="card-spotlight">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-bold gold-gradient-text">{s.value.toLocaleString('fa-IR')}</p>
                  </div>
                  <div className={cn('size-9 rounded-lg flex items-center justify-center', s.bg)}>
                    <Icon className={cn('size-4', s.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی تیکت..." className="pr-9" />
      </div>

      {/* Tabs & List */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all" className="text-xs">همه</TabsTrigger>
          <TabsTrigger value="open" className="text-xs">باز</TabsTrigger>
          <TabsTrigger value="in_progress" className="text-xs">در حال بررسی</TabsTrigger>
          <TabsTrigger value="resolved" className="text-xs">حل شده</TabsTrigger>
          <TabsTrigger value="closed" className="text-xs">بسته شده</TabsTrigger>
        </TabsList>

        {['all', 'open', 'in_progress', 'resolved', 'closed'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <ScrollArea className="max-h-[480px]">
              <div className="space-y-2 mt-2">
                {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />) :
                  filtered.length > 0 ? filtered.map(t => (
                    <Card key={t.id} className="hover-lift-sm cursor-pointer" onClick={() => openTicket(t)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-gold/15 flex items-center justify-center">
                              <Ticket className="size-5 text-gold" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{t.subject || 'بدون موضوع'}</p>
                              <p className="text-[11px] text-muted-foreground">{t.user?.fullName || t.user?.phone || 'ناشناس'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {t.priority && getPriorityBadge(t.priority)}
                            {getStatusBadge(t.status)}
                            <span className="text-[10px] text-muted-foreground hidden sm:block">{getTimeAgo(t.updatedAt || t.createdAt)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )) : <p className="text-center text-muted-foreground py-12 text-sm">تیکتی یافت نشد</p>}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTicket?.subject || 'تیکت'}
              {selectedTicket && getStatusBadge(selectedTicket.status)}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Status change */}
              <div className="flex items-center gap-2 mb-3">
                <Label className="text-xs">وضعیت:</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">باز</SelectItem>
                    <SelectItem value="in_progress">در حال بررسی</SelectItem>
                    <SelectItem value="resolved">حل شده</SelectItem>
                    <SelectItem value="closed">بسته شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 max-h-[300px] min-h-[200px] border rounded-lg p-3 mb-3">
                <div className="space-y-3">
                  {messagesLoading ? <Skeleton className="h-12" /> :
                    messages.length > 0 ? messages.map(msg => (
                      <div key={msg.id} className={cn(
                        'flex flex-col',
                        msg.isAdmin ? 'items-start' : 'items-end'
                      )}>
                        <div className={cn(
                          'max-w-[80%] rounded-lg p-3 text-sm',
                          msg.isAdmin
                            ? 'bg-gold/10 border border-gold/20'
                            : 'bg-muted'
                        )}>
                          <p className="text-[10px] font-semibold mb-1">
                            {msg.isAdmin ? 'پشتیبانی' : (msg.user?.fullName || 'کاربر')}
                          </p>
                          <p>{msg.content}</p>
                          <p className="text-[9px] text-muted-foreground mt-1">{getTimeAgo(msg.createdAt)}</p>
                        </div>
                      </div>
                    )) : <p className="text-center text-muted-foreground text-sm py-8">پیامی وجود ندارد</p>}
                </div>
              </ScrollArea>

              {/* Reply */}
              <div className="flex gap-2">
                <Textarea value={reply} onChange={e => setReply(e.target.value)}
                  placeholder="پاسخ خود را بنویسید..." rows={2} className="flex-1" />
                <Button onClick={handleReply} disabled={sending || !reply.trim()}
                  className="bg-gold hover:bg-gold-dark text-white self-end shrink-0">
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

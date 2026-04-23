'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { getTimeAgo } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MessageCircle, Send, User, Search, Clock, Circle, Phone,
  X, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatSession {
  id: string; userId: string; userPhone: string; userName: string | null;
  lastMessage: string; lastMessageAt: string; isOnline: boolean;
}

interface ChatMessage {
  id: string; content: string; isAdmin: boolean; createdAt: string;
  user?: { fullName: string | null };
}

export default function AdminChats() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/chat');
        if (res.ok) {
          const d = await res.json();
          const msgs = Array.isArray(d) ? d : d.messages || [];
          // Group by user session
          const sessionMap: Record<string, ChatSession> = {};
          msgs.forEach((m: any) => {
            const uid = m.userId || 'unknown';
            if (!sessionMap[uid]) {
              sessionMap[uid] = {
                id: uid, userId: uid, userPhone: m.user?.phone || 'ناشناس',
                userName: m.user?.fullName, lastMessage: m.content,
                lastMessageAt: m.createdAt, isOnline: Math.random() > 0.5,
              };
            } else {
              if (m.createdAt > sessionMap[uid].lastMessageAt) {
                sessionMap[uid].lastMessage = m.content;
                sessionMap[uid].lastMessageAt = m.createdAt;
              }
            }
          });
          setSessions(Object.values(sessionMap));
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const filteredSessions = sessions.filter(s => {
    const q = search.toLowerCase();
    return !q || s.userName?.toLowerCase().includes(q) || s.userPhone.includes(q) || s.lastMessage.toLowerCase().includes(q);
  });

  const selectSession = (session: ChatSession) => {
    setSelectedSession(session);
    // Load messages for this user
    setMessages([]);
    try {
      fetch('/api/chat').then(r => r.json()).then(d => {
        const msgs = Array.isArray(d) ? d : d.messages || [];
        setMessages(msgs.filter((m: any) => (m.userId || 'unknown') === session.id));
      });
    } catch { /* ignore */ }
  };

  const handleSend = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply }),
      });
      if (res.ok) {
        const newMsg: ChatMessage = {
          id: Date.now().toString(), content: reply, isAdmin: true,
          createdAt: new Date().toISOString(), user: { fullName: 'پشتیبانی' },
        };
        setMessages(prev => [...prev, newMsg]);
        setReply('');
      }
    } catch { useAppStore.getState().addToast('خطا در ارسال', 'error'); }
    setSending(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold">چت‌های زنده</h2>
        <Badge className="bg-gold/15 text-gold text-xs">{sessions.length} مکالمه</Badge>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex h-[560px]">
            {/* Sessions List */}
            <div className={cn(
              'w-full sm:w-80 border-e flex flex-col shrink-0',
              selectedSession ? 'hidden sm:flex' : 'flex'
            )}>
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="pr-9 h-9 text-sm" />
                </div>
              </div>
              <ScrollArea className="flex-1">
                {loading ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-3 border-b"><Skeleton className="h-12 rounded-lg" /></div>
                )) : filteredSessions.length > 0 ? filteredSessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => selectSession(s)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 border-b hover:bg-muted/50 transition-colors text-start',
                      selectedSession?.id === s.id && 'bg-gold/5'
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className="size-10 rounded-full bg-gold/15 flex items-center justify-center text-sm font-bold text-gold">
                        {(s.userName || s.userPhone).charAt(0)}
                      </div>
                      <Circle className={cn(
                        'absolute -bottom-0.5 -end-0.5 size-3 fill-current',
                        s.isOnline ? 'text-emerald-500' : 'text-gray-400'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{s.userName || 'بدون نام'}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">{getTimeAgo(s.lastMessageAt)}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{s.lastMessage}</p>
                    </div>
                  </button>
                )) : <p className="text-center text-muted-foreground py-12 text-sm">مکالمه‌ای یافت نشد</p>}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={cn(
              'flex-1 flex flex-col min-w-0',
              !selectedSession && 'hidden sm:flex'
            )}>
              {selectedSession ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 p-3 border-b">
                    <Button size="icon" variant="ghost" className="sm:hidden size-8" onClick={() => setSelectedSession(null)}>
                      <ArrowRight className="size-4" />
                    </Button>
                    <div className="size-8 rounded-full bg-gold/15 flex items-center justify-center text-sm font-bold text-gold">
                      {(selectedSession.userName || selectedSession.userPhone).charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedSession.userName || 'بدون نام'}</p>
                      <div className="flex items-center gap-1.5">
                        <Circle className={cn('size-2 fill-current', selectedSession.isOnline ? 'text-emerald-500' : 'text-gray-400')} />
                        <span className="text-[10px] text-muted-foreground">
                          {selectedSession.isOnline ? 'آنلاین' : 'آفلاین'}
                        </span>
                        <span className="text-[10px] text-muted-foreground" dir="ltr">{selectedSession.userPhone}</span>
                      </div>
                    </div>
                    <Badge className="mr-auto bg-gold/15 text-gold text-[10px]">چت زنده</Badge>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-3">
                    <div className="space-y-3">
                      {messages.length > 0 ? messages.map(msg => (
                        <div key={msg.id} className={cn('flex', msg.isAdmin ? 'justify-start' : 'justify-end')}>
                          <div className={cn(
                            'max-w-[75%] rounded-lg p-3 text-sm',
                            msg.isAdmin ? 'bg-gold/10 border border-gold/20' : 'bg-muted'
                          )}>
                            <p>{msg.content}</p>
                            <p className="text-[9px] text-muted-foreground mt-1">{getTimeAgo(msg.createdAt)}</p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-center text-muted-foreground py-12 text-sm">پیامی وجود ندارد</p>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Reply Input */}
                  <div className="p-3 border-t">
                    <div className="flex gap-2">
                      <Textarea value={reply} onChange={e => setReply(e.target.value)}
                        placeholder="پیام خود را بنویسید..." rows={1}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        className="flex-1 min-h-[36px]" />
                      <Button onClick={handleSend} disabled={sending || !reply.trim()}
                        className="bg-gold hover:bg-gold-dark text-white shrink-0 self-end" size="icon">
                        <Send className="size-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="size-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">یک مکالمه را انتخاب کنید</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

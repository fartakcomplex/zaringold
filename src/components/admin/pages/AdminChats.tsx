'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { useOperatorChat, type SupportMessage, type SupportQueueItem } from '@/hooks/use-chat';
import { getTimeAgo } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  MessageCircle, Send, User, Search, Circle, Phone, X, ArrowRight,
  Bot, Plus, Trash2, Edit, Settings, Sparkles, HelpCircle,
  Wifi, WifiOff, ShieldCheck, Check, Users, MessageSquare, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string;
  sortOrder: number;
  isActive: boolean;
  views: number;
  helpfulYes: number;
  helpfulNo: number;
}

interface Operator {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  department: string;
  maxChats: number;
  isOnline: boolean;
  isAvailable: boolean;
  status: string;
  totalChats: number;
  avgRating: number;
}

interface AIConfig {
  id: string;
  isEnabled: boolean;
  systemPrompt: string;
  fallbackMessage: string;
  maxHistory: number;
  responseDelay: number;
  greetingMessage: string;
  offlineMessage: string;
}

const FAQ_CATEGORIES = [
  { value: 'general', label: 'عمومی' },
  { value: 'account', label: 'حساب کاربری' },
  { value: 'trading', label: 'معاملات' },
  { value: 'gold_card', label: 'کارت طلایی' },
  { value: 'wallet', label: 'کیف پول' },
  { value: 'security', label: 'امنیت' },
  { value: 'payments', label: 'پرداخت' },
  { value: 'referral', label: 'دعوت از دوستان' },
];

const ROLE_LABELS: Record<string, string> = {
  operator: 'اپراتور',
  supervisor: 'سرپرست',
  admin: 'مدیر',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'فعال',
  inactive: 'غیرفعال',
  suspended: 'معلق',
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper: format time                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AdminChats() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#D4AF37]/15">
          <MessageCircle className="size-5 text-[#D4AF37]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">چت هوشمند</h2>
          <p className="text-xs text-muted-foreground">مدیریت چت آنلاین، هوش مصنوعی و اپراتورها</p>
        </div>
      </div>

      <Tabs defaultValue="live-chat" dir="rtl" className="space-y-4">
        <TabsList className="w-full flex h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="live-chat" className="flex-1 gap-1.5 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white">
            <MessageCircle className="size-3.5" />
            <span className="hidden sm:inline">چت زنده</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex-1 gap-1.5 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white">
            <HelpCircle className="size-3.5" />
            <span className="hidden sm:inline">سوالات متداول</span>
          </TabsTrigger>
          <TabsTrigger value="operators" className="flex-1 gap-1.5 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white">
            <Users className="size-3.5" />
            <span className="hidden sm:inline">اپراتورها</span>
          </TabsTrigger>
          <TabsTrigger value="ai-settings" className="flex-1 gap-1.5 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white">
            <Sparkles className="size-3.5" />
            <span className="hidden sm:inline">هوش مصنوعی</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live-chat">
          <LiveChatTab />
        </TabsContent>
        <TabsContent value="faq">
          <FAQTab />
        </TabsContent>
        <TabsContent value="operators">
          <OperatorsTab />
        </TabsContent>
        <TabsContent value="ai-settings">
          <AISettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tab 1: Live Chat                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function LiveChatTab() {
  const { addToast } = useAppStore();
  const [opName, setOpName] = useState('');
  const [opId] = useState(() => `admin-op-${Date.now()}`);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [reply, setReply] = useState('');
  const [search, setSearch] = useState('');

  const {
    isConnected,
    assignedUsers,
    waitingUsers,
    currentChatUserId,
    currentMessages,
    isUserTyping,
    sendMessage,
    switchUser,
    assignUser,
    emitTyping,
    emitStopTyping,
  } = useOperatorChat(isLoggedIn ? opId : '', isLoggedIn ? opName : '');

  const handleLogin = () => {
    if (!opName.trim()) return;
    setIsLoggedIn(true);
    addToast(`به عنوان "${opName}" وارد شدید`, 'success');
  };

  const allUsers = [
    ...assignedUsers.map(u => ({ ...u, type: 'assigned' as const })),
    ...waitingUsers.map(u => ({ ...u, type: 'waiting' as const })),
  ];

  const filteredUsers = allUsers.filter(u => {
    const q = search.toLowerCase();
    return !q || u.userName.toLowerCase().includes(q) || u.lastMessage.toLowerCase().includes(q);
  });

  const handleSend = () => {
    if (!reply.trim() || !currentChatUserId) return;
    sendMessage(currentChatUserId, reply);
    emitStopTyping(currentChatUserId);
    setReply('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReply(e.target.value);
    if (currentChatUserId) emitTyping(currentChatUserId);
  };

  /* ── Not logged in state ── */
  if (!isLoggedIn) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-6 py-16">
          <div className="flex size-20 items-center justify-center rounded-full bg-[#D4AF37]/10">
            <ShieldCheck className="size-10 text-[#D4AF37]/50" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-foreground">ورود به عنوان اپراتور</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              نام خود را وارد کنید تا به عنوان اپراتور پشتیبانی وارد شوید
            </p>
          </div>
          <div className="flex gap-2 w-full max-w-xs">
            <Input
              value={opName}
              onChange={e => setOpName(e.target.value)}
              placeholder="نام شما..."
              className="flex-1"
              dir="rtl"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            <Button onClick={handleLogin} disabled={!opName.trim()} className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white">
              ورود
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentUser = allUsers.find(u => u.userId === currentChatUserId);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex h-[560px]">
          {/* Users list */}
          <div className={cn(
            'w-full sm:w-72 border-e flex flex-col shrink-0',
            currentChatUserId ? 'hidden sm:flex' : 'flex'
          )}>
            <div className="p-3 border-b">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={cn('text-[10px]', isConnected ? 'bg-green-500/15 text-green-600' : 'bg-red-500/15 text-red-500')}>
                  {isConnected ? <Wifi className="size-3 ml-1" /> : <WifiOff className="size-3 ml-1" />}
                  {isConnected ? 'متصل' : 'قطع'}
                </Badge>
                <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] text-[10px]">
                  {allUsers.length} کاربر
                </Badge>
              </div>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="pr-9 h-8 text-sm" />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-xs">کاربری در انتظار نیست</p>
              ) : filteredUsers.map(u => (
                <button
                  key={u.userId}
                  onClick={() => switchUser(u.userId)}
                  className={cn(
                    'w-full flex items-center gap-2.5 p-2.5 border-b hover:bg-muted/50 transition-colors text-start',
                    currentChatUserId === u.userId && 'bg-[#D4AF37]/5'
                  )}
                >
                  <div className="relative shrink-0">
                    <div className="size-9 rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-xs font-bold text-[#D4AF37]">
                      {u.userName.charAt(0)}
                    </div>
                    <Circle className={cn('absolute -bottom-0.5 -end-0.5 size-2.5 fill-current', 'text-green-500')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium truncate">{u.userName}</p>
                      <span className="text-[9px] text-muted-foreground">{getTimeAgo(u.lastMessageAt)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{u.lastMessage}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {u.type === 'assigned' && <Badge className="text-[8px] px-1 py-0 bg-green-500/15 text-green-600">جاری</Badge>}
                      {u.type === 'waiting' && <Badge className="text-[8px] px-1 py-0 bg-amber-500/15 text-amber-600">انتظار</Badge>}
                      {u.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[8px] rounded-full px-1.5 py-0 leading-none">{u.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </ScrollArea>
          </div>

          {/* Chat area */}
          <div className={cn('flex-1 flex flex-col min-w-0', !currentChatUserId && 'hidden sm:flex')}>
            {currentUser ? (
              <>
                <div className="flex items-center gap-3 p-3 border-b">
                  <Button size="icon" variant="ghost" className="sm:hidden size-8" onClick={() => switchUser('')}>
                    <ArrowRight className="size-4" />
                  </Button>
                  <div className="size-8 rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-sm font-bold text-[#D4AF37]">
                    {currentUser.userName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{currentUser.userName}</p>
                    <div className="flex items-center gap-1.5">
                      {isUserTyping ? (
                        <span className="text-[10px] text-violet-500">در حال نوشتن...</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">آنلاین</span>
                      )}
                    </div>
                  </div>
                  {!currentUser.assignedOperator && (
                    <Button size="sm" variant="outline" className="text-xs h-7 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10" onClick={() => assignUser(currentUser.userId)}>
                      پاسخگو شوم
                    </Button>
                  )}
                </div>

                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-2.5">
                    {currentMessages.map(msg => (
                      <div key={msg.id} className={cn('flex', msg.senderType === 'user' ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                          'max-w-[80%] rounded-xl px-3 py-2 text-sm',
                          msg.senderType === 'user' ? 'bg-[#D4AF37] text-white rounded-es-sm' :
                          msg.senderType === 'ai' ? 'bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-es-sm' :
                          'bg-muted border border-border rounded-es-sm'
                        )}>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={cn('text-[10px] font-semibold', msg.senderType === 'user' ? 'text-white/80' : msg.senderType === 'ai' ? 'text-violet-600' : 'text-amber-600')}>
                              {msg.senderName}
                            </span>
                            {msg.senderType === 'ai' && (
                              <Badge className="bg-violet-500 text-white text-[7px] px-1 py-0 hover:bg-violet-500 leading-none">AI</Badge>
                            )}
                            {msg.senderType === 'operator' && (
                              <Badge className="bg-amber-500 text-white text-[7px] px-1 py-0 hover:bg-amber-500 leading-none">پشتیبان</Badge>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.message}</p>
                          <p className={cn('text-[9px] mt-0.5', msg.senderType === 'user' ? 'text-white/60' : 'text-muted-foreground/60')}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="p-3 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={reply}
                      onChange={handleInputChange}
                      placeholder="پیام خود را بنویسید..."
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      className="flex-1 min-h-[36px] text-sm"
                      dir="rtl"
                    />
                    <Button onClick={handleSend} disabled={!reply.trim()} className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white shrink-0 self-end" size="icon">
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
                  <p className="text-xs text-muted-foreground/60 mt-1">{allUsers.length} مکالمه فعال</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tab 2: FAQ Management                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function FAQTab() {
  const { addToast } = useAppStore();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', category: 'general', keywords: '', sortOrder: 0 });

  const fetchFAQs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat/faq' + (categoryFilter !== 'all' ? `?category=${categoryFilter}` : ''));
      if (res.ok) {
        const d = await res.json();
        setFaqs(Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [categoryFilter]);

  useEffect(() => { fetchFAQs(); // eslint-disable-line react-hooks/set-state-in-effect }, [fetchFAQs]);

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    try {
      if (editId) {
        const res = await fetch(`/api/chat/faq/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (res.ok) addToast('سوال بروزرسانی شد', 'success');
      } else {
        const res = await fetch('/api/chat/faq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (res.ok) addToast('سوال جدید اضافه شد', 'success');
      }
      setDialogOpen(false);
      setEditId(null);
      setForm({ question: '', answer: '', category: 'general', keywords: '', sortOrder: 0 });
      fetchFAQs();
    } catch {
      addToast('خطا در ذخیره', 'error');
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditId(faq.id);
    setForm({ question: faq.question, answer: faq.answer, category: faq.category, keywords: faq.keywords, sortOrder: faq.sortOrder });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/chat/faq/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('سوال حذف شد', 'success');
        fetchFAQs();
      }
    } catch {
      addToast('خطا در حذف', 'error');
    }
  };

  const handleToggle = async (faq: FAQ) => {
    try {
      await fetch(`/api/chat/faq/${faq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !faq.isActive }),
      });
      fetchFAQs();
    } catch { /* ignore */ }
  };

  const filteredFaqs = faqs.filter(f => {
    const q = search.toLowerCase();
    return !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
  });

  const getCategoryLabel = (cat: string) => FAQ_CATEGORIES.find(c => c.value === cat)?.label || cat;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] text-xs">{faqs.length} سوال</Badge>
          </div>
          <Button onClick={() => { setEditId(null); setForm({ question: '', answer: '', category: 'general', keywords: '', sortOrder: 0 }); setDialogOpen(true); }} className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white text-sm" size="sm">
            <Plus className="size-3.5 ml-1" /> افزودن سوال
          </Button>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setCategoryFilter('all')} className={cn('px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors', categoryFilter === 'all' ? 'bg-[#D4AF37] text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
            همه
          </button>
          {FAQ_CATEGORIES.map(cat => (
            <button key={cat.value} onClick={() => setCategoryFilter(cat.value)} className={cn('px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors', categoryFilter === cat.value ? 'bg-[#D4AF37] text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو در سوالات..." className="pr-9 h-9 text-sm" />
        </div>

        {/* FAQ list */}
        <ScrollArea className="max-h-[400px]">
          {loading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 border-b"><Skeleton className="h-16 rounded-lg" /></div>
          )) : filteredFaqs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">سوالی یافت نشد</p>
          ) : filteredFaqs.map(faq => (
            <div key={faq.id} className={cn('p-3 border-b hover:bg-muted/30 transition-colors', !faq.isActive && 'opacity-50')}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium truncate">{faq.question}</p>
                    <Badge className="text-[9px] px-1.5 py-0 bg-muted text-muted-foreground shrink-0">{getCategoryLabel(faq.category)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{faq.answer}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-muted-foreground">{faq.views} بازدید</span>
                    <span className="text-[10px] text-green-500">{faq.helpfulYes} مفید</span>
                    <span className="text-[10px] text-red-400">{faq.helpfulNo} غیرمفید</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="size-7" onClick={() => handleToggle(faq)}>
                    {faq.isActive ? <Check className="size-3.5 text-green-500" /> : <X className="size-3.5 text-muted-foreground" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="size-7" onClick={() => handleEdit(faq)}>
                    <Edit className="size-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="size-7 text-red-400 hover:text-red-500 hover:bg-red-50">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف سوال</AlertDialogTitle>
                        <AlertDialogDescription>آیا از حذف این سوال مطمئن هستید؟ این عمل قابل بازگشت نیست.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>انصراف</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(faq.id)} className="bg-red-500 hover:bg-red-600">حذف</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'ویرایش سوال' : 'افزودن سوال جدید'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>سوال</Label>
              <Input value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} placeholder="سوال را وارد کنید..." className="mt-1" dir="rtl" />
            </div>
            <div>
              <Label>پاسخ</Label>
              <Textarea value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} placeholder="پاسخ را وارد کنید..." rows={3} className="mt-1" dir="rtl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>دسته‌بندی</Label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {FAQ_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <Label>ترتیب نمایش</Label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>کلمات کلیدی (با کاما جدا کنید)</Label>
              <Input value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} placeholder="طلا، قیمت، خرید..." className="mt-1" dir="rtl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button onClick={handleSave} disabled={!form.question.trim() || !form.answer.trim()} className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white">
              {editId ? 'بروزرسانی' : 'ذخیره'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tab 3: Operators Management                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function OperatorsTab() {
  const { addToast } = useAppStore();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', role: 'operator', department: 'support', maxChats: 5 });

  const fetchOperators = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat/operators');
      if (res.ok) {
        const d = await res.json();
        setOperators(Array.isArray(d.data) ? d.data : []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOperators(); // eslint-disable-line react-hooks/set-state-in-effect }, [fetchOperators]);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    try {
      const res = await fetch('/api/chat/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        addToast('اپراتور اضافه شد', 'success');
        setDialogOpen(false);
        setForm({ name: '', phone: '', email: '', role: 'operator', department: 'support', maxChats: 5 });
        fetchOperators();
      } else {
        const d = await res.json();
        addToast(d.message || 'خطا', 'error');
      }
    } catch {
      addToast('خطا در ذخیره', 'error');
    }
  };

  const handleToggleOnline = async (op: Operator) => {
    try {
      await fetch(`/api/chat/operators/${op.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: !op.isOnline }),
      });
      fetchOperators();
    } catch { /* ignore */ }
  };

  const handleToggleAvailable = async (op: Operator) => {
    try {
      await fetch(`/api/chat/operators/${op.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !op.isAvailable }),
      });
      fetchOperators();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/chat/operators/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('اپراتور حذف شد', 'success');
        fetchOperators();
      }
    } catch {
      addToast('خطا در حذف', 'error');
    }
  };

  const onlineCount = operators.filter(o => o.isOnline).length;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] text-xs">{operators.length} اپراتور</Badge>
            <Badge className="bg-green-500/15 text-green-600 text-xs">{onlineCount} آنلاین</Badge>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white text-sm" size="sm">
            <Plus className="size-3.5 ml-1" /> افزودن اپراتور
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
        ) : operators.length === 0 ? (
          <div className="text-center py-12">
            <Users className="size-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">هیچ اپراتوری ثبت نشده</p>
            <p className="text-xs text-muted-foreground/60 mt-1">با دکمه بالا اپراتور جدید اضافه کنید</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {operators.map(op => (
              <div key={op.id} className="border rounded-xl p-3 space-y-2 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      'size-10 rounded-full flex items-center justify-center text-sm font-bold',
                      op.isOnline ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-muted text-muted-foreground'
                    )}>
                      {op.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{op.name}</span>
                        {op.isOnline && <Circle className="size-2 fill-current text-green-500" />}
                      </div>
                      <span className="text-[11px] text-muted-foreground" dir="ltr">{op.phone}</span>
                    </div>
                  </div>
                  <Badge className={cn(
                    'text-[9px]',
                    op.role === 'admin' ? 'bg-red-500/15 text-red-500' :
                    op.role === 'supervisor' ? 'bg-blue-500/15 text-blue-500' :
                    'bg-[#D4AF37]/15 text-[#D4AF37]'
                  )}>
                    {ROLE_LABELS[op.role] || op.role}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[9px]">{op.department}</Badge>
                  <Badge variant="outline" className={cn('text-[9px]', op.status === 'active' ? 'border-green-300 text-green-600' : 'border-red-300 text-red-500')}>
                    {STATUS_LABELS[op.status] || op.status}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">حداکثر {op.maxChats} چت</span>
                </div>

                <div className="flex items-center gap-1.5 pt-1 border-t">
                  <Button size="sm" variant="outline" className="text-[11px] h-7 flex-1" onClick={() => handleToggleOnline(op)}>
                    {op.isOnline ? 'آفلاین' : 'آنلاین'}
                  </Button>
                  <Button size="sm" variant="outline" className="text-[11px] h-7 flex-1" onClick={() => handleToggleAvailable(op)}>
                    {op.isAvailable ? 'غیرفعال' : 'فعال'}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="size-7 text-red-400 hover:text-red-500 hover:bg-red-50 shrink-0">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف اپراتور</AlertDialogTitle>
                        <AlertDialogDescription>آیا از حذف &quot;{op.name}&quot; مطمئن هستید؟</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>انصراف</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(op.id)} className="bg-red-500 hover:bg-red-600">حذف</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>افزودن اپراتور جدید</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>نام</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="نام اپراتور..." className="mt-1" dir="rtl" />
            </div>
            <div>
              <Label>شماره تلفن</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="09xxxxxxxxx" className="mt-1" dir="ltr" />
            </div>
            <div>
              <Label>ایمیل (اختیاری)</Label>
              <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" className="mt-1" dir="ltr" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>نقش</Label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="operator">اپراتور</option>
                  <option value="supervisor">سرپرست</option>
                  <option value="admin">مدیر</option>
                </select>
              </div>
              <div>
                <Label>حداکثر چت همزمان</Label>
                <Input type="number" value={form.maxChats} onChange={e => setForm({ ...form, maxChats: parseInt(e.target.value) || 5 })} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button onClick={handleAdd} disabled={!form.name.trim() || !form.phone.trim()} className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white">
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tab 4: AI Settings                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function AISettingsTab() {
  const { addToast } = useAppStore();
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat/config');
      if (res.ok) {
        const d = await res.json();
        setConfig(d);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchConfig(); // eslint-disable-line react-hooks/set-state-in-effect }, [fetchConfig]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch('/api/chat/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) addToast('تنظیمات ذخیره شد', 'success');
      else addToast('خطا در ذخیره', 'error');
    } catch {
      addToast('خطا در ذخیره', 'error');
    }
    setSaving(false);
  };

  if (loading || !config) {
    return <Card><CardContent className="p-6 space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</CardContent></Card>;
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-6">
        {/* AI Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
              <Bot className="size-5 text-violet-600 dark:text-violet-300" />
            </div>
            <div>
              <p className="text-sm font-bold">دستیار هوشمند</p>
              <p className="text-[11px] text-muted-foreground">پاسخگویی خودکار با هوش مصنوعی</p>
            </div>
          </div>
          <Switch
            checked={config.isEnabled}
            onCheckedChange={checked => setConfig({ ...config, isEnabled: checked })}
          />
        </div>

        {!config.isEnabled && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">دستیار هوشمند غیرفعال است. برای فعال‌سازی سوئیچ بالا را روشن کنید.</p>
          </div>
        )}

        <div className={cn('space-y-4', !config.isEnabled && 'opacity-50 pointer-events-none')}>
          {/* System Prompt */}
          <div>
            <Label className="text-sm font-medium">پرامپت سیستم</Label>
            <p className="text-[11px] text-muted-foreground mb-1.5">دستوراتی که هوش مصنوعی برای پاسخگویی استفاده می‌کند</p>
            <Textarea
              value={config.systemPrompt}
              onChange={e => setConfig({ ...config, systemPrompt: e.target.value })}
              rows={4}
              className="text-sm"
              dir="rtl"
            />
          </div>

          {/* Greeting */}
          <div>
            <Label className="text-sm font-medium">پیام خوش‌آمدگویی</Label>
            <p className="text-[11px] text-muted-foreground mb-1.5">پیامی که هنگام ورود کاربر ارسال می‌شود</p>
            <Input
              value={config.greetingMessage}
              onChange={e => setConfig({ ...config, greetingMessage: e.target.value })}
              className="text-sm"
              dir="rtl"
            />
          </div>

          {/* Fallback */}
          <div>
            <Label className="text-sm font-medium">پیام جایگزین</Label>
            <p className="text-[11px] text-muted-foreground mb-1.5">وقتی هوش مصنوعی نتواند پاسخ دهد</p>
            <Input
              value={config.fallbackMessage}
              onChange={e => setConfig({ ...config, fallbackMessage: e.target.value })}
              className="text-sm"
              dir="rtl"
            />
          </div>

          {/* Offline */}
          <div>
            <Label className="text-sm font-medium">پیام آفلاین</Label>
            <p className="text-[11px] text-muted-foreground mb-1.5">وقتی اپراتوری آنلاین نباشد</p>
            <Input
              value={config.offlineMessage}
              onChange={e => setConfig({ ...config, offlineMessage: e.target.value })}
              className="text-sm"
              dir="rtl"
            />
          </div>

          <Separator />

          {/* Sliders */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">تاخیر پاسخ (میلی‌ثانیه)</Label>
              <p className="text-[11px] text-muted-foreground">{config.responseDelay}ms</p>
              <input
                type="range"
                min={500}
                max={10000}
                step={500}
                value={config.responseDelay}
                onChange={e => setConfig({ ...config, responseDelay: parseInt(e.target.value) })}
                className="w-full mt-2 accent-violet-500"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">حداکثر تاریخچه مکالمه</Label>
              <p className="text-[11px] text-muted-foreground">{config.maxHistory} پیام</p>
              <input
                type="range"
                min={2}
                max={30}
                step={1}
                value={config.maxHistory}
                onChange={e => setConfig({ ...config, maxHistory: parseInt(e.target.value) })}
                className="w-full mt-2 accent-violet-500"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white">
          {saving ? <Loader2 className="size-4 animate-spin ml-2" /> : null}
          ذخیره تنظیمات
        </Button>
      </CardContent>
    </Card>
  );
}

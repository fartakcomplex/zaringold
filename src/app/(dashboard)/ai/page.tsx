'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  TrendingUp,
  Loader2,
  Coins,
  Shield,
  MessageCircle,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Wallet,
  BarChart3,
  Calculator,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLiked?: boolean;
  isDisliked?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Quick Action Buttons                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const QUICK_ACTIONS = [
  { id: 'my-gold', icon: Wallet, label: 'وضعیت طلای من', query: 'وضعیت طلای من چگونه است؟' },
  { id: 'buy', icon: TrendingUp, label: 'پیشنهاد خرید', query: 'بهترین زمان خرید طلا الان است؟' },
  { id: 'market', icon: BarChart3, label: 'تحلیل بازار', query: 'تحلیل بازار طلا را بگو' },
  { id: 'profit', icon: Calculator, label: 'محاسبه سود', query: 'چطور سود طلای خود را محاسبه کنم؟' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Suggested Questions                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

const SUGGESTED_QUESTIONS = [
  { icon: TrendingUp, text: 'بهترین زمان خرید طلا الان است؟' },
  { icon: Coins, text: 'سپرده طلای زرین‌گلد چطور کار می‌کنه؟' },
  { icon: Shield, text: 'ریسک سرمایه‌گذاری طلا چقدره؟' },
  { icon: Sparkles, text: 'چطور سبد طلای بهینه بسازم؟' },
  { icon: TrendingUp, text: 'پیش‌بینی قیمت طلا تا پایان سال' },
  { icon: MessageCircle, text: 'تفاوت طلای آب‌شده و سکه چیست؟' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Typing Indicator Component                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 max-w-[88%] me-auto">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10">
        <Bot className="size-4 text-[#D4AF37]" />
      </div>
      <div className="bg-muted/50 border border-border/50 rounded-2xl rounded-tr-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:0ms]" />
          <div className="size-2 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:150ms]" />
          <div className="size-2 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:300ms]" />
          <span className="ms-2 text-[10px] text-muted-foreground">در حال تحلیل...</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Message Bubble Component                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MessageBubble({ msg, onToggleFeedback }: {
  msg: Message;
  onToggleFeedback: (msgId: string, type: 'liked' | 'disliked') => void;
}) {
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const boldParts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className={cn('leading-relaxed', i === 0 ? '' : 'mt-1')}>
          {boldParts.map((part, j) =>
            j % 2 === 1 ? (
              <strong key={j} className="font-bold text-foreground">{part}</strong>
            ) : (
              <span key={j} className="text-muted-foreground">{part}</span>
            ),
          )}
        </p>
      );
    });
  };

  return (
    <div
      className={cn(
        'flex gap-2.5 max-w-[88%]',
        msg.role === 'user' ? 'ms-auto flex-row-reverse' : 'me-auto',
      )}
    >
      {/* Avatar */}
      <div className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg',
        msg.role === 'user' ? 'bg-[#D4AF37]/10' : 'bg-[#D4AF37]/10',
      )}>
        {msg.role === 'user' ? (
          <User className="size-4 text-[#D4AF37]" />
        ) : (
          <Bot className="size-4 text-[#D4AF37]" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn(
        'rounded-2xl px-4 py-3 max-w-full',
        msg.role === 'user'
          ? 'bg-[#D4AF37] text-[#1a1a1a] rounded-tl-sm'
          : 'bg-card border border-border/50 rounded-tr-sm',
      )}>
        <div className={cn(
          'text-sm leading-relaxed whitespace-pre-wrap break-words',
          msg.role === 'user' ? 'text-[#1a1a1a] font-medium' : 'text-foreground',
        )}>
          {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
        </div>

        {/* Timestamp */}
        <p className={cn(
          'text-[9px] mt-1.5',
          msg.role === 'user' ? 'text-[#1a1a1a]/50 text-start' : 'text-muted-foreground/50',
        )}>
          {new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(msg.timestamp)}
        </p>

        {/* Feedback buttons for AI messages */}
        {msg.role === 'assistant' && msg.id !== 'welcome' && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/30">
            <button
              onClick={() => onToggleFeedback(msg.id, 'liked')}
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] transition-colors',
                msg.isLiked
                  ? 'text-emerald-500 bg-emerald-500/10'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <ThumbsUp className="size-3" />
              مفید
            </button>
            <button
              onClick={() => onToggleFeedback(msg.id, 'disliked')}
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] transition-colors',
                msg.isDisliked
                  ? 'text-red-500 bg-red-500/10'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <ThumbsDown className="size-3" />
              غیرمفید
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AIAdvisorPage() {
  const { user } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 سلام! من **مشاور مالی هوشمند زرین‌گلد** هستم.\n\nمی‌توانم در زمینه سرمایه‌گذاری طلا، تحلیل بازار، و مدیریت سبد شما کمک کنم.\n\n👇 از دکمه‌های سریع زیر استفاده کنید یا سؤال خود را بپرسید!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const userId = user?.id || 'dev-super-admin';

  /* Auto-scroll to bottom */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  /* ── Send Message to API ── */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setActiveQuickAction(null);

    try {
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: text.trim() }),
      });
      const data = await res.json();

      if (data.success && data.reply) {
        const aiMsg: Message = {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const errorMsg: Message = {
          id: `msg-${Date.now()}-error`,
          role: 'assistant',
          content: '⚠️ متأسفانه در دریافت پاسخ خطایی رخ داد. لطفاً دوباره تلاش کنید.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch {
      const fallbackMsg: Message = {
        id: `msg-${Date.now()}-fallback`,
        role: 'assistant',
        content: '🤖 **مشاور هوشمند زرین‌گلد:**\n\nمتشکرم از سؤال شما! من یک دستیار هوشمند سرمایه‌گذاری طلا هستم.\n\nمی‌توانم در این زمینه‌ها به شما کمک کنم:\n\n• 📈 تحلیل و پیش‌بینی قیمت طلا\n• 💰 استراتژی سرمایه‌گذاری\n• 🏦 سپرده طلایی و سوددهی\n• 📊 مدیریت سبد سرمایه‌گذاری\n\nلطفاً سؤال دقیق‌تری بپرسید تا بهتر کمک کنم!',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [userId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    setActiveQuickAction(action.id);
    sendMessage(action.query);
  };

  const handleSuggestionClick = (text: string) => {
    sendMessage(text);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: '👋 سلام! من **مشاور مالی هوشمند زرین‌گلد** هستم.\n\nمی‌توانم در زمینه سرمایه‌گذاری طلا، تحلیل بازار، و مدیریت سبد شما کمک کنم.\n\n👇 از دکمه‌های سریع زیر استفاده کنید یا سؤال خود را بپرسید!',
        timestamp: new Date(),
      },
    ]);
  };

  const handleToggleFeedback = (msgId: string, type: 'liked' | 'disliked') => {
    setMessages(prev =>
      prev.map(m =>
        m.id === msgId
          ? {
              ...m,
              isLiked: type === 'liked' ? !m.isLiked : false,
              isDisliked: type === 'disliked' ? !m.isDisliked : false,
            }
          : m,
      ),
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#D4AF37]/10">
            <Sparkles className="size-5 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">مشاور مالی هوشمند</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              آنلاین — آماده پاسخگویی
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={handleClearChat}
          title="پاک کردن گفتگو"
        >
          <RotateCcw className="size-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Quick Action Buttons */}
      <div className="px-4 pb-2">
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                disabled={isTyping}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all active:scale-95',
                  activeQuickAction === action.id
                    ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]'
                    : 'border-border bg-card hover:border-[#D4AF37]/20 hover:bg-[#D4AF37]/5 text-muted-foreground hover:text-foreground',
                  isTyping && 'opacity-50 cursor-not-allowed',
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="text-[10px] font-medium leading-tight text-center">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-2"
        style={{ maxHeight: 'calc(100vh - 380px)' }}
      >
        <div className="space-y-4 py-2">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} onToggleFeedback={handleToggleFeedback} />
          ))}

          {/* Typing indicator */}
          {isTyping && <TypingIndicator />}
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="px-4 py-2">
        <ScrollArea className="w-full" dir="rtl">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {SUGGESTED_QUESTIONS.map((q, i) => {
              const Icon = q.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(q.text)}
                  disabled={isTyping}
                  className="flex items-center gap-1.5 shrink-0 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-2 text-xs font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{q.text}</span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4 pt-2">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-1.5 focus-within:border-[#D4AF37]/40 transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="سؤال خود را بپرسید..."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            disabled={isTyping}
            dir="rtl"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isTyping}
            className="size-9 rounded-lg bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249] disabled:opacity-40 shrink-0"
          >
            {isTyping ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          مشاور مالی هوشمند — پاسخ‌ها جنبه مشاوره‌ای دارند و جایگزین تحلیل حرفه‌ای نیستند
        </p>
      </form>
    </div>
  );
}

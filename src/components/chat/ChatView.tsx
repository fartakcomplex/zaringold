'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  Send,
  ShieldCheck,
  Headphones,
  Wifi,
  WifiOff,
  Check,
  CheckCheck,
  Bot,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { usePageEvent } from '@/hooks/use-page-event';
import { useSupportChat, type SupportMessage } from '@/hooks/use-chat';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  AI Message Bubble (Left side)                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function AIBubble({ msg }: { msg: SupportMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-2.5 max-w-[85%] sm:max-w-[75%]"
    >
      {/* AI avatar */}
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
        <Bot className="size-4.5" />
      </div>

      <div className="flex flex-col gap-0.5">
        {/* Name + badge */}
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-xs font-semibold text-violet-700 dark:text-violet-400">
            {msg.senderName}
          </span>
          <Badge className="bg-violet-500 text-white text-[8px] px-1 py-0 hover:bg-violet-500 leading-none">
            AI
          </Badge>
        </div>

        {/* Message */}
        <div className="rounded-2xl rounded-ee-sm border border-violet-200 bg-violet-50 px-3.5 py-2.5 dark:border-violet-800 dark:bg-violet-950/30">
          <p className="text-sm leading-relaxed text-foreground break-words whitespace-pre-wrap">
            {msg.message}
          </p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] text-muted-foreground/60">
              {formatTime(msg.timestamp)}
            </span>
            {msg.read && (
              <CheckCheck className="size-3 text-violet-500" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Operator Message Bubble (Left side)                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function OperatorBubble({ msg }: { msg: SupportMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-2.5 max-w-[85%] sm:max-w-[75%]"
    >
      {/* Operator avatar */}
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        <ShieldCheck className="size-4.5" />
      </div>

      <div className="flex flex-col gap-0.5">
        {/* Name + badge */}
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            {msg.senderName}
          </span>
          <Badge className="bg-amber-500 text-white text-[8px] px-1 py-0 hover:bg-amber-500 leading-none">
            پشتیبان
          </Badge>
        </div>

        {/* Message */}
        <div className="rounded-2xl rounded-ee-sm bg-muted px-3.5 py-2.5">
          <p className="text-sm leading-relaxed text-foreground break-words whitespace-pre-wrap">
            {msg.message}
          </p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] text-muted-foreground/60">
              {formatTime(msg.timestamp)}
            </span>
            {msg.read && (
              <CheckCheck className="size-3 text-[#D4AF37]" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  User Message Bubble (Right side)                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function UserBubble({ msg }: { msg: SupportMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-2.5 max-w-[85%] sm:max-w-[75%] ms-auto flex-row-reverse"
    >
      {/* User avatar (first letter) */}
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-bold">
        {msg.senderName.charAt(0)}
      </div>

      <div className="flex flex-col gap-0.5 items-end">
        {/* Message */}
        <div className="rounded-2xl rounded-es-sm bg-[#D4AF37] px-3.5 py-2.5">
          <p className="text-sm leading-relaxed text-white break-words whitespace-pre-wrap">
            {msg.message}
          </p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] text-white/70">
              {formatTime(msg.timestamp)}
            </span>
            {msg.read ? (
              <CheckCheck className="size-3 text-white/90" />
            ) : (
              <Check className="size-3 text-white/60" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Typing Indicator                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TypingIndicator({ name, isAI }: { name: string | null; isAI: boolean }) {
  if (!name && !isAI) return null;

  const displayName = name || 'دستیار هوشمند';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2"
    >
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          isAI
            ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
        )}
      >
        {isAI ? <Bot className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
      </div>
      <div
        className={cn(
          'rounded-2xl rounded-ee-sm px-4 py-3',
          isAI
            ? 'border border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30'
            : 'bg-muted'
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{displayName} در حال نوشتن</span>
          <span className="flex gap-0.5">
            <span
              className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  FAQ Quick Buttons                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function FAQQuickButtons({
  faqs,
  onSelect,
}: {
  faqs: FAQItem[];
  onSelect: (question: string) => void;
}) {
  if (faqs.length === 0) return null;

  return (
    <div className="w-full mt-4 max-w-md mx-auto">
      <div className="flex items-center gap-1.5 mb-2.5 justify-center">
        <HelpCircle className="size-4 text-violet-500" />
        <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
          سوالات متداول
        </span>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {faqs.map((faq) => (
          <motion.button
            key={faq.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(faq.question)}
            className={cn(
              'text-xs leading-relaxed px-3 py-2 rounded-full border transition-colors',
              'border-violet-200 bg-violet-50/80 text-violet-700',
              'dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
              'hover:bg-violet-100 dark:hover:bg-violet-950/60 cursor-pointer text-start'
            )}
          >
            {faq.question}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Empty State                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function EmptyState({
  isAIMode,
  faqs,
  onFAQSelect,
}: {
  isAIMode: boolean;
  faqs: FAQItem[];
  onFAQSelect: (question: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
      <div
        className={cn(
          'flex size-20 items-center justify-center rounded-full',
          isAIMode
            ? 'bg-violet-100 dark:bg-violet-900/30'
            : 'bg-[#D4AF37]/10'
        )}
      >
        {isAIMode ? (
          <Sparkles className="size-10 text-violet-500" />
        ) : (
          <Bot className="size-10 text-[#D4AF37]/50" />
        )}
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-base font-bold text-foreground">
          به پشتیبانی زرین گلد خوش آمدید
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          دستیار هوشمند ما آماده پاسخگویی است
        </p>
      </div>
      <FAQQuickButtons faqs={faqs} onSelect={onFAQSelect} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  AI Status Indicator in Header                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function HeaderStatusRow({
  operatorName,
  isConnected,
}: {
  operatorName: string | null;
  isConnected: boolean;
}) {
  const isAIMode = isConnected && !operatorName;

  if (!isConnected) {
    return (
      <div className="flex items-center gap-1.5 mt-0.5">
        <WifiOff className="size-3 text-red-500" />
        <span className="text-[11px] text-red-500">قطع ارتباط</span>
      </div>
    );
  }

  if (operatorName) {
    return (
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="relative flex size-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-green-500" />
        </span>
        <span className="text-[11px] text-muted-foreground">آنلاین</span>
      </div>
    );
  }

  /* AI mode */
  return (
    <div className="flex items-center gap-1.5 mt-0.5">
      <Sparkles className="size-3 text-violet-500" />
      <span className="text-[11px] text-violet-600 dark:text-violet-400">هوش مصنوعی</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ChatView — Main Component                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ChatView() {
  const { user, addToast } = useAppStore();
  const [inputValue, setInputValue] = useState('');
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Quick Action Event Listeners ── */
  usePageEvent('new-chat', () => { inputRef.current?.focus(); addToast('چت جدید', 'info'); });
  usePageEvent('support-agent', () => { addToast('به زودی فعال می‌شود', 'info'); });

  const {
    messages,
    isConnected,
    operatorName,
    isOperatorTyping,
    sendUserMessage,
    emitTyping,
    emitStopTyping,
  } = useSupportChat();

  /* Fetch FAQs on mount */
  useEffect(() => {
    async function loadFAQs() {
      try {
        const res = await fetch('/api/chat/faq?category=general&active=true');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setFaqs(json.data.slice(0, 6) as FAQItem[]);
          }
        }
      } catch {
        // Silently fail — FAQs are optional
      }
    }
    loadFAQs();
  }, []);

  /* Auto-scroll on new messages or typing */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOperatorTyping]);

  /* Focus input on mount */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* Send message handler */
  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    sendUserMessage(inputValue);
    emitStopTyping();
    setInputValue('');
    inputRef.current?.focus();
  }, [inputValue, sendUserMessage, emitStopTyping]);

  /* FAQ selection handler */
  const handleFAQSelect = useCallback(
    (question: string) => {
      sendUserMessage(question);
    },
    [sendUserMessage]
  );

  /* Enter key handler */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  /* Input change handler */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      emitTyping();
    },
    [emitTyping]
  );

  /* Determine if currently in AI mode */
  const isAIMode = isConnected && !operatorName;

  return (
    <div className="mx-auto max-w-4xl flex flex-col h-[calc(100vh-8rem)]">
      <Card className="card-gold-border flex flex-1 flex-col overflow-hidden">
        {/* ── Chat Header ── */}
        <CardHeader className="border-b border-border py-3.5 px-5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-full',
                  isAIMode
                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                )}
              >
                {isAIMode ? <Bot className="size-5" /> : <ShieldCheck className="size-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground">
                    {isAIMode ? 'دستیار هوشمند' : operatorName || 'پشتیبانی آنلاین'}
                  </h2>
                  {operatorName && (
                    <Badge className="bg-amber-500 text-white text-[8px] px-1.5 py-0 hover:bg-amber-500 leading-none">
                      پشتیبان
                    </Badge>
                  )}
                  {isAIMode && (
                    <Badge className="bg-violet-500 text-white text-[8px] px-1.5 py-0 hover:bg-violet-500 leading-none">
                      AI
                    </Badge>
                  )}
                </div>
                <HeaderStatusRow operatorName={operatorName} isConnected={isConnected} />
              </div>
            </div>

            {/* Connection status badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50">
              {isConnected ? (
                <Wifi className="size-3.5 text-green-500" />
              ) : (
                <WifiOff className="size-3.5 text-red-500" />
              )}
              <span className={cn(
                'text-[10px] font-medium',
                isConnected ? 'text-green-600' : 'text-red-500'
              )}>
                {isConnected ? 'متصل' : 'قطع'}
              </span>
            </div>
          </div>
        </CardHeader>

        {/* ── Messages Area ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-muted/20 px-4 py-3 space-y-3"
        >
          {/* Empty state */}
          {messages.length === 0 && !isOperatorTyping && (
            <EmptyState isAIMode={isAIMode} faqs={faqs} onFAQSelect={handleFAQSelect} />
          )}

          {/* Messages */}
          {messages.map((msg) => {
            if (msg.senderType === 'ai') {
              return <AIBubble key={msg.id} msg={msg} />;
            }
            if (msg.senderType === 'operator') {
              return <OperatorBubble key={msg.id} msg={msg} />;
            }
            return <UserBubble key={msg.id} msg={msg} />;
          })}

          {/* Typing indicator */}
          {isOperatorTyping && (
            <TypingIndicator name={operatorName} isAI={isAIMode} />
          )}
        </div>

        {/* ── Input Area ── */}
        <div className="border-t border-border bg-card p-4 shrink-0">
          <div className="flex items-center gap-3">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? 'پیام خود را بنویسید...' : 'در حال اتصال...'}
              disabled={!isConnected}
              className="input-gold-focus flex-1 bg-muted/50 border-border text-sm"
              dir="rtl"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!isConnected || !inputValue.trim()}
              className="size-10 shrink-0 bg-[#D4AF37] text-white hover:bg-[#D4AF37]/90 rounded-xl disabled:opacity-50"
              aria-label="ارسال پیام"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

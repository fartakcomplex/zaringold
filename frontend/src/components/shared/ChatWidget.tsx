
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {Send, X, ShieldCheck, Headphones, Bot, Sparkles, HelpCircle} from 'lucide-react';
import {cn} from '@/lib/utils';
import {useAppStore} from '@/lib/store';
import {useSupportChat, type SupportMessage} from '@/hooks/use-chat';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';

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
/*  Helper: format timestamp in Persian locale                               */
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
/*  Single Message Bubble                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MessageBubble({
  msg,
  isOwn,
}: {
  msg: SupportMessage;
  isOwn: boolean;
}) {
  const isAI = msg.senderType === 'ai';
  const isOperator = msg.senderType === 'operator';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex gap-2 px-3 py-1',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
          isAI
            ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
            : isOperator
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
              : isOwn
                ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                : 'bg-muted text-muted-foreground'
        )}
      >
        {isAI ? (
          <Bot className="size-4" />
        ) : isOperator ? (
          <ShieldCheck className="size-4" />
        ) : (
          msg.senderName.charAt(0)
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-3 py-2',
          isOwn
            ? 'rounded-tr-sm bg-[#D4AF37] text-white'
            : isAI
              ? 'rounded-tl-sm border border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30'
              : isOperator
                ? 'rounded-tl-sm border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40'
                : 'rounded-tl-sm bg-card shadow-sm border border-border'
        )}
      >
        {/* Name */}
        <div
          className={cn(
            'mb-0.5 flex items-center gap-1.5 text-xs font-semibold',
            isOwn
              ? 'text-white/80'
              : isAI
                ? 'text-violet-600 dark:text-violet-400'
                : isOperator
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-muted-foreground'
          )}
        >
          {msg.senderName}
          {isAI && (
            <Badge className="bg-violet-500 text-white text-[9px] px-1.5 py-0 hover:bg-violet-500">
              AI
            </Badge>
          )}
          {isOperator && !isAI && (
            <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0 hover:bg-amber-500">
              پشتیبان
            </Badge>
          )}
        </div>

        {/* Content */}
        <p className={cn('text-sm leading-relaxed break-words whitespace-pre-wrap', isOwn ? 'text-white' : 'text-foreground')}>
          {msg.message}
        </p>

        {/* Timestamp */}
        <p
          className={cn(
            'mt-0.5 text-[10px]',
            isOwn ? 'text-white/60' : 'text-muted-foreground/60'
          )}
        >
          {formatTime(msg.timestamp)}
        </p>
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
    <div className="w-full mt-3">
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <HelpCircle className="size-3.5 text-violet-500" />
        <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
          سوالات متداول
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {faqs.map((faq) => (
          <motion.button
            key={faq.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(faq.question)}
            className={cn(
              'text-[11px] leading-relaxed px-2.5 py-1.5 rounded-full border transition-colors',
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
/*  AI Status Indicator in Header                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function HeaderStatus({
  operatorName,
  isConnected,
}: {
  operatorName: string | null;
  isConnected: boolean;
}) {
  if (!isConnected) {
    return (
      <span className="text-[11px] text-muted-foreground">
        <span className="inline-block size-1.5 rounded-full bg-red-500" />
        {' '}قطع ارتباط
      </span>
    );
  }

  if (operatorName) {
    return (
      <span className="text-[11px] text-muted-foreground">
        <span className="inline-block size-1.5 rounded-full bg-green-500" />
        {' '}آنلاین
      </span>
    );
  }

  /* Connected but no operator → AI mode */
  return (
    <span className="text-[11px] text-violet-600 dark:text-violet-400">
      <Sparkles className="inline size-3 me-0.5 -mt-0.5" />
      هوش مصنوعی
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Chat Widget                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ChatWidget() {
  const { user } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  /* Auto-scroll to bottom on new messages */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOperatorTyping]);

  /* Focus input when opening */
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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

  /* Typing handler */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      emitTyping();
    },
    [emitTyping]
  );

  /* Determine if currently in AI mode */
  const isAIMode = isConnected && !operatorName;

  /* Don't show if user is not authenticated */
  if (!user) return null;

  return (
    <>
      {/* ── Floating Button ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="fixed z-50 flex size-14 items-center justify-center rounded-full bg-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/30 md:bottom-6 md:left-6"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 10rem)', left: '1.25rem' }}
            aria-label="باز کردن چت پشتیبانی"
          >
            <Headphones className="size-6" />
            {/* Online indicator */}
            {isConnected && (
              <span className="absolute end-0.5 top-0.5 size-3 rounded-full border-2 border-background bg-green-500" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 flex h-[500px] w-[calc(100vw-2.5rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl md:bottom-6 md:left-6"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)', left: '1.25rem' }}
          >
            {/* ── Header ── */}
            <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
              <div
                className={cn(
                  'flex size-9 items-center justify-center rounded-full',
                  isAIMode
                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                )}
              >
                {isAIMode ? <Bot className="size-5" /> : <ShieldCheck className="size-5" />}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    {isAIMode ? 'دستیار هوشمند' : operatorName || 'پشتیبانی آنلاین'}
                  </span>
                  {operatorName && (
                    <Badge className="bg-amber-500 text-white text-[8px] px-1 py-0 hover:bg-amber-500 leading-none">
                      پشتیبان
                    </Badge>
                  )}
                  {isAIMode && (
                    <Badge className="bg-violet-500 text-white text-[8px] px-1 py-0 hover:bg-violet-500 leading-none">
                      AI
                    </Badge>
                  )}
                </div>
                <HeaderStatus operatorName={operatorName} isConnected={isConnected} />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="size-8 text-muted-foreground hover:text-foreground"
                aria-label="بستن چت"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* ── Messages Area ── */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-3"
            >
              {/* Empty state */}
              {messages.length === 0 && !isOperatorTyping && (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <div className="flex size-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                    {isAIMode ? (
                      <Sparkles className="size-8 text-violet-500" />
                    ) : (
                      <Bot className="size-8 text-[#D4AF37]/50" />
                    )}
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    به پشتیبانی زرین گلد خوش آمدید
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    دستیار هوشمند ما آماده پاسخگویی است
                  </p>
                  <FAQQuickButtons faqs={faqs} onSelect={handleFAQSelect} />
                </div>
              )}

              {/* Messages */}
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isOwn={msg.senderType === 'user'}
                />
              ))}

              {/* Typing indicator */}
              {isOperatorTyping && (
                <div className="flex items-center gap-2 px-3 py-1">
                  <span className="text-xs text-muted-foreground">
                    {operatorName || 'دستیار هوشمند'} در حال نوشتن...
                  </span>
                  <span className="flex gap-0.5">
                    <span className="size-1 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="size-1 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="size-1 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              )}
            </div>

            {/* ── Input Area ── */}
            <div className="border-t border-border bg-card p-3">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={isConnected ? 'پیام خود را بنویسید...' : 'در حال اتصال...'}
                  disabled={!isConnected}
                  className="flex-1 border-border bg-muted/50 text-sm focus-visible:ring-[#D4AF37]/30"
                  dir="rtl"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!isConnected || !inputValue.trim()}
                  className="size-9 shrink-0 bg-[#D4AF37] text-white hover:bg-[#D4AF37]/90"
                  aria-label="ارسال پیام"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

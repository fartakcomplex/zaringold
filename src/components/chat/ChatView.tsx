'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  MessageCircle,
  Send,
  ShieldCheck,
  Headphones,
  Wifi,
  WifiOff,
  Check,
  CheckCheck,
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

function TypingIndicator({ name }: { name: string | null }) {
  if (!name) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        <ShieldCheck className="size-3.5" />
      </div>
      <div className="rounded-2xl rounded-ee-sm bg-muted px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{name} در حال نوشتن</span>
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
/*  Empty State                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
      <div className="flex size-20 items-center justify-center rounded-full bg-[#D4AF37]/10">
        <Headphones className="size-10 text-[#D4AF37]/50" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-base font-bold text-foreground">
          پشتیبانی آنلاین
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          به زودی یک اپراتور به شما پاسخ خواهد داد
        </p>
        <p className="text-xs text-muted-foreground/60">
          اولین پیام خود را ارسال کنید
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ChatView — Main Component                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ChatView() {
  const { user, addToast } = useAppStore();
  const [inputValue, setInputValue] = useState('');
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

  return (
    <div className="mx-auto max-w-4xl flex flex-col h-[calc(100vh-8rem)]">
      <Card className="card-gold-border flex flex-1 flex-col overflow-hidden">
        {/* ── Chat Header ── */}
        <CardHeader className="border-b border-border py-3.5 px-5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground">
                    {operatorName || 'پشتیبانی آنلاین'}
                  </h2>
                  {operatorName && (
                    <Badge className="bg-amber-500 text-white text-[8px] px-1.5 py-0 hover:bg-amber-500 leading-none">
                      پشتیبان
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isConnected ? (
                    <>
                      <span className="relative flex size-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {operatorName ? 'آنلاین' : 'در انتظار اپراتور'}
                      </span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="size-3 text-red-500" />
                      <span className="text-[11px] text-red-500">
                        قطع ارتباط
                      </span>
                    </>
                  )}
                </div>
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
            <EmptyState />
          )}

          {/* Messages */}
          {messages.map((msg) => {
            if (msg.senderType === 'operator') {
              return <OperatorBubble key={msg.id} msg={msg} />;
            }
            return <UserBubble key={msg.id} msg={msg} />;
          })}

          {/* Typing indicator */}
          {isOperatorTyping && (
            <TypingIndicator name={operatorName} />
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

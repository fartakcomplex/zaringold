'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Lightbulb,
  TrendingUp,
  Loader2,
  Coins,
  Shield,
  MessageCircle,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
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
/*  Suggested Questions                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

const SUGGESTED_QUESTIONS = [
  { icon: TrendingUp, text: 'بهترین زمان خرید طلا الان است؟', category: 'معامله' },
  { icon: Coins, text: 'سپرده طلای زرین‌گلد چطور کار می‌کنه؟', category: 'سپرده' },
  { icon: Shield, text: 'ریسک سرمایه‌گذاری طلا چقدره؟', category: 'ریسک' },
  { icon: Sparkles, text: 'چطور سبد طلای بهینه بسازم؟', category: 'سبد' },
  { icon: Lightbulb, text: 'تفاوت طلای آب‌شده و سکه چیست؟', category: 'آموزش' },
  { icon: TrendingUp, text: 'پیش‌بینی قیمت طلا تا پایان سال', category: 'پیش‌بینی' },
  { icon: Coins, text: 'مزایای کارت طلای زرین‌گلد', category: 'کارت' },
  { icon: Shield, text: 'امنیت سرمایه‌گذاری در زرین‌گلد', category: 'امنیت' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mock AI Responses                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

const AI_RESPONSES: Record<string, string> = {
  'خرید': '🪙 **تحلیل خرید طلا:**\n\nبر اساس تحلیل‌های فعلی بازار:\n\n• قیمت اونس جهانی طلا در محدوده صعودی قرار دارد\n• نرخ ارز در بازار داخلی روند نسبتاً ثابتی دارد\n• تقاضا برای طلای آب‌شده افزایش یافته\n\n**پیشنهاد:** اگر قصد سرمایه‌گذاری بلندمدت دارید، خرید تدریجی (DCA) استراتژی مناسبی است. پیشنهاد می‌کنم ماهانه ۱۰ تا ۲۰ درصد پس‌انداز خود را به طلا اختصاص دهید.\n\n⚡ *سپرده طلای زرین‌گلد با سود سالانه تا ۱۸٪ یک گزینه عالی است!*',
  'سپرده': '🏦 **سپرده طلای زرین‌گلد:**\n\nسپرده طلای زرین‌گلد به شما اجازه می‌دهد طلاهای خود را با سود متمرکز سپرده‌گذاری کنید:\n\n• **۳ ماهه:** سود سالانه ۱۲٪\n• **۶ ماهه:** سود سالانه ۱۵٪\n• **۱۲ ماهه:** سود سالانه ۱۸٪\n\n**مزایا:**\n✅ سود به صورت طلا پرداخت می‌شود\n✅ امکان برداشت زودهنگام (با کاهش سود)\n✅ بدون حداقل سپرده\n✅ تمدید خودکار در صورت تمایل\n\n💡 *برای شروع، حداقل ۰.۰۱ گرم طلا کافی است!*',
  'ریسک': '⚠️ **مدیریت ریسک سرمایه‌گذاری طلا:**\n\nمثل هر سرمایه‌گذاری دیگری، طلا هم ریسک‌هایی دارد:\n\n**ریسک‌ها:**\n• نوسانات کوتاه‌مدت قیمت\n• تأثیر نرخ ارز بر قیمت داخلی\n• تغییرات سیاست‌های بانک مرکزی\n\n**راه‌های کاهش ریسک:**\n✅ تنوع‌بخشی سبد سرمایه‌گذاری\n✅ خرید تدریجی و مستمر\n✅ عدم سرمایه‌گذاری تمام پس‌انداز در یک دارایی\n✅ تعیین افق زمانی مشخص\n\n🛡️ *زرین‌گلد با بیمه سپرده‌ها، امنیت سرمایه شما را تضمین می‌کند.*',
  'سبد': '📊 **ساخت سبد طلای بهینه:**\n\nیک سبد طلای متعادل شامل این عناصر است:\n\n**توزیع پیشنهادی:**\n🪙 طلای آب‌شده: ۶۰-۷۰٪\n💰 موجودی ریالی: ۲۰-۳۰٪\n🏦 سپرده طلا: ۱۰-۱۵٪\n\n**نکات کلیدی:**\n• ماهانه خریدهای کوچک انجام دهید\n• در زمان افت قیمت خرید بیشتری کنید\n• از سپرده طلایی برای سود مرکب استفاده کنید\n\n📈 *با استفاده از ویژگی گرد‌کردن خرد (MicroGold) می‌توانید خودکار طلا ذخیره کنید!*',
  'تفاوت': '📖 **مقایسه طلای آب‌شده و سکه:**\n\n| ویژگی | طلای آب‌شده | سکه |\n|---|---|---|\n| قیمت پایه | اونس جهانی × نرخ ارز | علاوه بر طلای هسته، اجرت دارد |\n| نقدشوندگی | ⭐⭐⭐⭐⭐ بسیار بالا | ⭐⭐⭐⭐ بالا |\n| حباب | بدون حباب | دارای حباب |\n| اجرت | ندارد | ۸-۱۲٪ |\n| خرد شدن | به راحتی | دشوار |\n\n**نتیجه:** طلای آب‌شده برای سرمایه‌گذاری بهینه‌تر است. سکه بیشتر برای پس‌انداز سنتی مناسب است.\n\n💡 *در زرین‌گلد، طلا را به صورت گرم خرید و فروش می‌کنید — بدون حباب!*',
  'پیش‌بینی': '🔮 **پیش‌بینی بازار طلا:**\n\nتحلیلگران و نهادهای بین‌المللی پیش‌بینی‌های زیر را ارائه داده‌اند:\n\n**خوش‌بینانه:**\n• اونس طلا تا ۲۸۰۰-۳۰۰۰ دلار تا پایان سال\n• دلار داخلی در محدوده ۶۰,۰۰۰-۶۵,۰۰۰ تومان\n\n**محتاطانه:**\n• اونس در محدوده ۲۵۰۰-۲۷۰۰ دلار\n• تثبیت در محدوده فعلی\n\n**عوامل تأثیرگذار:**\n🌐 سیاست‌های فدرال رزرو آمریکا\n🏦 نرخ بهره بانک مرکزی\n⚖️ تنش‌های ژئوپلیتیکی\n📊 تقاضای جهانی طلا\n\n⚠️ *توجه: پیش‌بینی‌ها تضمینی نیستند. همیشه diversified سرمایه‌گذاری کنید.*',
  'کارت': '💳 **کارت طلای زرین‌گلد:**\n\nکارت طلای زرین‌گلد یک کارت پیش‌پرداخت متصل به سپرده طلای شماست:\n\n**ویژگی‌ها:**\n✅ خرید با طلا در تمام پایانه‌های فروش\n✅ طراحی اختصاصی و طلایی\n✅ بدون کارمزد سالانه (سال اول)\n✅ مدیریت از طریق اپلیکیشن\n\n**نحوه عملکرد:**\nموجودی کارت بر اساس ارزش طلای سپرده‌شده محاسبه می‌شود و می‌توانید مستقیماً از طلا خرید کنید!\n\n🎉 *در حال حاضر ۳ طراحی مختلف (طلایی، مشکی الماسی، رزگلد) موجود است!*',
  'امنیت': '🔒 **امنیت سرمایه‌گذاری در زرین‌گلد:**\n\nزرین‌گلد بالاترین سطح امنیت را برای سرمایه شما فراهم می‌کند:\n\n**لایه‌های امنیتی:**\n🔐 رمزنگاری AES-256 برای داده‌ها\n🕵️ احراز هویت دو عاملی (2FA)\n🏦 سپرده‌ها بیمه شده\n🔄 مانیتورینگ ۲۴ ساعته\n⚠️ سیستم ضد تقلب هوشمند\n\n**استانداردها:**\n✅ مطابق با الزامات بانک مرکزی\n✅ ممیزی امنیتی دوره‌ای\n✅ رعایت قوانین پولشویی\n\n🛡️ *سرمایه شما با سپرده‌نامه رسمی و بیمه‌نامه تضمین شده است.*',
};

const DEFAULT_RESPONSE = '🤖 **مشاور هوشمند زرین‌گلد:**\n\nمتشکرم از سؤال شما! من یک دستیار هوشمند سرمایه‌گذاری طلا هستم.\n\nمی‌توانم در این زمینه‌ها به شما کمک کنم:\n\n• 📈 تحلیل و پیش‌بینی قیمت طلا\n• 💰 استراتژی سرمایه‌گذاری\n• 🏦 سپرده طلایی و سوددهی\n• 📊 مدیریت سبد سرمایه‌گذاری\n• ⚠️ تحلیل ریسک\n• 💳 خدمات کارت طلایی\n• 🔒 امنیت سرمایه‌گذاری\n\nلطفاً سؤال دقیق‌تری بپرسید تا بهتر کمک کنم!';

function getAIResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  if (msg.includes('خرید') || msg.includes('زمان')) return AI_RESPONSES['خرید'] || DEFAULT_RESPONSE;
  if (msg.includes('سپرده') || msg.includes('سود')) return AI_RESPONSES['سپرده'] || DEFAULT_RESPONSE;
  if (msg.includes('ریسک') || msg.includes('خطر')) return AI_RESPONSES['ریسک'] || DEFAULT_RESPONSE;
  if (msg.includes('سبد') || msg.includes('بهینه')) return AI_RESPONSES['سبد'] || DEFAULT_RESPONSE;
  if (msg.includes('تفاوت') || msg.includes('آب‌شده') || msg.includes('سکه')) return AI_RESPONSES['تفاوت'] || DEFAULT_RESPONSE;
  if (msg.includes('پیش‌بینی') || msg.includes('قیمت')) return AI_RESPONSES['پیش‌بینی'] || DEFAULT_RESPONSE;
  if (msg.includes('کارت')) return AI_RESPONSES['کارت'] || DEFAULT_RESPONSE;
  if (msg.includes('امنیت') || msg.includes('امن')) return AI_RESPONSES['امنیت'] || DEFAULT_RESPONSE;
  return DEFAULT_RESPONSE;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AIAdvisorView() {
  const { user } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 سلام! من **مشاور هوشمند زرین‌گلد** هستم.\n\nمی‌توانم در زمینه سرمایه‌گذاری طلا، تحلیل بازار، و مدیریت سبد شما کمک کنم.\n\n👇 سؤالات پیشنهادی زیر را انتخاب کنید یا سؤال خود را بپرسید!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userId = user?.id || 'dev-super-admin';

  /* Auto-scroll to bottom */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  /* ── Send Message ── */
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

    // Simulate AI thinking delay
    setTimeout(() => {
      const aiContent = getAIResponse(text);
      const aiMsg: Message = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (text: string) => {
    sendMessage(text);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: '👋 سلام! من **مشاور هوشمند زرین‌گلد** هستم.\n\nمی‌توانم در زمینه سرمایه‌گذاری طلا، تحلیل بازار، و مدیریت سبد شما کمک کنم.\n\n👇 سؤالات پیشنهادی زیر را انتخاب کنید یا سؤال خود را بپرسید!',
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

  /* ── Render Message Content (simple markdown-like) ── */
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Bold
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#D4AF37]/10">
            <Sparkles className="size-5 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">مشاور هوشمند</h1>
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

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-2"
        style={{ maxHeight: 'calc(100vh - 340px)' }}
      >
        <div className="space-y-4 py-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-2.5 max-w-[88%]',
                msg.role === 'user' ? 'ms-auto flex-row-reverse' : 'me-auto',
              )}
            >
              {/* Avatar */}
              <div className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-lg',
                msg.role === 'user'
                  ? 'bg-[#D4AF37]/10'
                  : 'bg-[#1e1e1e] dark:bg-[#2a2a2a]',
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
                  : 'bg-[#1e1e1e] dark:bg-[#2a2a2a] border border-border/50 rounded-tr-sm',
              )}>
                <div className={cn(
                  'text-sm leading-relaxed whitespace-pre-wrap break-words',
                  msg.role === 'user' ? 'text-[#1a1a1a]' : 'text-foreground',
                )}>
                  {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                </div>

                {/* Feedback buttons for AI messages */}
                {msg.role === 'assistant' && msg.id !== 'welcome' && (
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/30">
                    <button
                      onClick={() => handleToggleFeedback(msg.id, 'liked')}
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
                      onClick={() => handleToggleFeedback(msg.id, 'disliked')}
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
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-2.5 max-w-[88%] me-auto">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1e1e1e] dark:bg-[#2a2a2a]">
                <Bot className="size-4 text-[#D4AF37]" />
              </div>
              <div className="bg-[#1e1e1e] dark:bg-[#2a2a2a] border border-border/50 rounded-2xl rounded-tr-sm px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="size-2 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="size-2 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="size-2 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
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
                  className="flex items-center gap-1.5 shrink-0 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-2 text-xs font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all active:scale-95"
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
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="سؤال خود را بپرسید..."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            disabled={isTyping}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isTyping}
            className="size-9 rounded-lg bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249] disabled:opacity-40 shrink-0"
          >
            <Send className="size-4" />
          </Button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          مشاور هوشمند زرین‌گلد — پاسخ‌ها جنبه مشاوره‌ای دارند و جایگزین تحلیل حرفه‌ای نیستند
        </p>
      </form>
    </div>
  );
}

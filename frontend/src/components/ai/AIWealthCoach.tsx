
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {motion, AnimatePresence} from '@/lib/framer-compat';
import {Bot, Send, Sparkles, TrendingUp, Shield, Target, Lightbulb, ChevronDown, RefreshCw, Wallet, Coins, PiggyBank} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Skeleton} from '@/components/ui/skeleton';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {useAppStore} from '@/lib/store';
import {formatToman, formatGrams, formatNumber} from '@/lib/helpers';
import {cn} from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface CoachMessage {
  id: string;
  role: 'coach' | 'user';
  content: string;
  timestamp: Date;
  type?: 'text' | 'assessment' | 'suggestion' | 'action';
  actions?: CoachAction[];
}

interface CoachAction {
  label: string;
  value: string;
  icon?: React.ElementType;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Generate assessment based on user data                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function generateAssessment(fiatBalance: number, goldGrams: number, goldPrice: number): { content: string; actions: CoachAction[] } {
  const totalWealth = fiatBalance + (goldGrams * goldPrice);
  const goldRatio = totalWealth > 0 ? (goldGrams * goldPrice) / totalWealth : 0;

  let riskLevel = 'متوسط';
  let riskColor = 'text-amber-500';
  if (goldRatio > 0.7) { riskLevel = 'کم'; riskColor = 'text-emerald-500'; }
  else if (goldRatio < 0.2) { riskLevel = 'بالا'; riskColor = 'text-red-500'; }

  const monthlyTarget = totalWealth * 0.1;
  const dailySavings = monthlyTarget / 30;

  let content = `📊 **ارزیابی وضعیت مالی شما:**\n\n`;
  content += `💰 موجودی نقد: ${formatToman(fiatBalance)}\n`;
  content += `🥇 موجودی طلا: ${formatGrams(goldGrams)}\n`;
  content += `📈 ارزش کل پرتفوی: ${formatToman(totalWealth)}\n`;
  content += `⚖️ سهم طلا: ${formatNumber(Math.round(goldRatio * 100))}٪\n`;
  content += `🛡️ سطح ریسک: ${riskLevel}\n\n`;

  if (fiatBalance > goldGrams * goldPrice * 2) {
    content += `💡 پیشنهاد: شما نقدینگی زیادی دارید. پیشنهاد می‌کنم حداقل ${formatToman(monthlyTarget)} ماهانه به طلا تبدیل کنید تا در برابر تورم محافظت شوید.`;
  } else if (goldRatio < 0.3) {
    content += `💡 پیشنهاد: سهم طلا در پرتفوی شما کم است. حداقل ۳۰٪ سرمایه‌تان را به طلا اختصاص دهید.`;
  } else if (goldRatio > 0.7) {
    content += `💡 پیشنهاد: پرتفوی شما به خوبی متنوع شده. وضعیت مناسبی دارید.`;
  } else {
    content += `💡 پیشنهاد: ترکیب پرتفوی شما متعادل است. به خرید منظم ادامه دهید.`;
  }

  const actions: CoachAction[] = [
    { label: 'چگونه بیشتر پس‌انداز کنم؟', value: 'savings_tips', icon: PiggyBank },
    { label: 'ارزیابی ریسک من', value: 'risk_assessment', icon: Shield },
    { label: 'برنامه مالی ماهانه', value: 'monthly_plan', icon: Target },
    { label: 'نکته طلایی امروز', value: 'daily_tip', icon: Lightbulb },
  ];

  return { content, actions };
}

function generateResponse(query: string, fiatBalance: number, goldGrams: number, goldPrice: number): { content: string; actions: CoachAction[] } {
  const actions: CoachAction[] = [
    { label: 'چگونه بیشتر پس‌انداز کنم؟', value: 'savings_tips', icon: PiggyBank },
    { label: 'ارزیابی ریسک من', value: 'risk_assessment', icon: Shield },
    { label: 'برنامه مالی ماهانه', value: 'monthly_plan', icon: Target },
  ];

  if (query.includes('پس‌انداز') || query.includes('ذخیره') || query.includes('savings')) {
    const totalWealth = fiatBalance + (goldGrams * goldPrice);
    const monthlyTarget = Math.max(500000, totalWealth * 0.05);
    return {
      content: `💡 **راهکارهای پس‌انداز هوشمند:**\n\n1️⃣ **خرید خودکار طلا:** ماهانه ${formatToman(monthlyTarget)} خرید خودکار تنظیم کنید. با این روش نیازی به تصمیم‌گیری روزانه ندارید.\n\n2️⃣ **گردکردن خریدها:** فعال‌سازی سیستم گردکرد - هر خرید به نزدیک‌ترین ۵۰ هزار واحد طلایی گرد می‌شود و مابه‌التفاوت تبدیل به طلا می‌شود.\n\n3️⃣ **اهداف پس‌انداز:** اهداف مشخص تعیین کنید (مثلاً خرید گوشی، مسافرت). این انگیزه را بالا می‌برد.\n\n4️⃣ **قانون ۵۰/۳۰/۲۰:** ۵۰٪ درآمد برای ضروریات، ۳۰٪ برای خواسته‌ها، ۲۰٪ برای پس‌انداز و سرمایه‌گذاری.`,
      actions,
    };
  }

  if (query.includes('ریسک') || query.includes('risk') || query.includes('خطر')) {
    return {
      content: `🛡️ **تحلیل ریسک پرتفوی شما:**\n\n🎯 **ریسک نقدینگی:** ${fiatBalance > 1000000 ? 'کم ✅' : 'بالا ⚠️'}\n   حتماً حداقل ${formatToman(1000000)} نقد برای شرایط اضطراری نگه دارید.\n\n📊 **ریسک تمرکز:** ${goldGrams > 0 ? 'متوسط ⚖️' : 'بالا ⚠️'}\n   تنوع بخشی به سبد سرمایه‌گذاری مهم است.\n\n⏰ **ریسک زمانی:** طلا سرمایه‌گذاری بلندمدت است. حداقل ۶ ماه صبر کنید.\n\n💡 **توصیه:** خرید منظم (DCA) بهترین روش کاهش ریسک است.`,
      actions,
    };
  }

  if (query.includes('برنامه') || query.includes('month') || query.includes('monthly')) {
    const monthlyTarget = Math.max(500000, (fiatBalance + goldGrams * goldPrice) * 0.08);
    return {
      content: `📋 **برنامه مالی ماهانه پیشنهادی:**\n\n💰 هدف پس‌انداز ماهانه: ${formatToman(monthlyTarget)}\n\n📅 **برنامه هفتگی:**\n هفته ۱: ${formatToman(monthlyTarget * 0.25)}\n هفته ۲: ${formatToman(monthlyTarget * 0.25)}\n هفته ۳: ${formatToman(monthlyTarget * 0.25)}\n هفته ۴: ${formatToman(monthlyTarget * 0.25)}\n\n🥇 **تخصیص پیشنهادی:**\n • ۶۰٪ خرید طلای آب‌شده\n • ۲۰٪ پس‌انداز نقد\n • ۲۰٪ صندوق اوراق\n\n⚙️ خرید خودکار را در تنظیمات فعال کنید تا این برنامه خودکار اجرا شود!`,
      actions,
    };
  }

  // Default response
  return {
    content: `🤔 متوجه شدم! برای کمک بهتر، یکی از موضوعات زیر را انتخاب کنید یا سؤال خاصی بپرسید.\n\nمن می‌توانم در زمینه‌های زیر کمک کنم:\n• 📊 تحلیل پرتفوی\n• 💡 راهکارهای پس‌انداز\n• 🛡️ مدیریت ریسک\n• 📋 برنامه‌ریزی مالی`,
    actions,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AIWealthCoach() {
  const { user, fiatWallet, goldWallet, goldPrice, setPage } = useAppStore();
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Initialize with assessment ── */
  useEffect(() => {
    if (!user?.id) return;
    const timer = setTimeout(() => {
      const { content, actions } = generateAssessment(
        fiatWallet.balance,
        goldWallet.goldGrams,
        goldPrice?.buyPrice ?? 0,
      );
      setMessages([{
        id: 'init',
        role: 'coach',
        content,
        timestamp: new Date(),
        type: 'assessment',
        actions,
      }]);
      setInitialLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [user?.id]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  /* ── Send message ── */
  const handleSend = useCallback((text?: string) => {
    const query = text || inputValue.trim();
    if (!query) return;
    setInputValue('');

    // Add user message
    const userMsg: CoachMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
      type: 'text',
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Generate response after delay
    setTimeout(() => {
      const { content, actions } = generateResponse(
        query,
        fiatWallet.balance,
        goldWallet.goldGrams,
        goldPrice?.buyPrice ?? 0,
      );
      const coachMsg: CoachMessage = {
        id: `coach-${Date.now()}`,
        role: 'coach',
        content,
        timestamp: new Date(),
        type: 'suggestion',
        actions,
      };
      setMessages(prev => [...prev, coachMsg]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  }, [inputValue, fiatWallet, goldWallet, goldPrice]);

  /* ── Quick action ── */
  const handleQuickAction = useCallback((value: string, label: string) => {
    handleSend(label);
  }, [handleSend]);

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                  */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
          <Bot className="size-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">مشاور هوشمند مالی</h2>
          <p className="text-sm text-muted-foreground">تحلیل شخصی بر اساس داده‌های شما</p>
        </div>
        <Badge variant="outline" className="ms-auto gap-1 border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
          <Sparkles className="size-3" />
          AI
        </Badge>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        <Card className="border-emerald-200/50 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <CardContent className="p-3 text-center">
            <Wallet className="mx-auto mb-1 size-4 text-emerald-500" />
            <p className="text-xs text-muted-foreground">نقدی</p>
            <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatToman(fiatWallet.balance)}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200/50 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardContent className="p-3 text-center">
            <Coins className="mx-auto mb-1 size-4 text-amber-500" />
            <p className="text-xs text-muted-foreground">طلای شما</p>
            <p className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">{formatGrams(goldWallet.goldGrams)}</p>
          </CardContent>
        </Card>
        <Card className="border-sky-200/50 bg-sky-50/50 dark:border-sky-900/50 dark:bg-sky-950/20">
          <CardContent className="p-3 text-center">
            <TrendingUp className="mx-auto mb-1 size-4 text-sky-500" />
            <p className="text-xs text-muted-foreground">قیمت طلا</p>
            <p className="text-sm font-bold tabular-nums text-sky-600 dark:text-sky-400">{goldPrice ? formatToman(goldPrice.buyPrice) : '---'}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Chat Area */}
      <Card className="overflow-hidden">
        <ScrollArea className="h-[480px]" ref={scrollRef}>
          <div className="space-y-4 p-4">
            {initialLoading ? (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      'flex gap-3',
                      msg.role === 'user' ? 'flex-row-reverse' : '',
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full',
                      msg.role === 'coach'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        : 'bg-gold/20',
                    )}>
                      {msg.role === 'coach'
                        ? <Bot className="size-4 text-white" />
                        : <span className="text-xs font-bold text-gold">شما</span>
                      }
                    </div>

                    {/* Message bubble */}
                    <div className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-7',
                      msg.role === 'coach'
                        ? 'bg-muted/60 text-foreground'
                        : 'bg-emerald-600 text-white dark:bg-emerald-700',
                    )}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Quick action buttons */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {msg.actions.map((action) => {
                            const Icon = action.icon || Lightbulb;
                            return (
                              <button
                                key={action.value}
                                onClick={() => handleQuickAction(action.value, action.label)}
                                className={cn(
                                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                                  msg.role === 'coach'
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60'
                                    : 'bg-white/20 text-white hover:bg-white/30',
                                )}
                              >
                                <Icon className="size-3" />
                                {action.label}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Timestamp */}
                      <p className={cn(
                        'mt-1 text-[10px]',
                        msg.role === 'coach' ? 'text-muted-foreground/60' : 'text-white/60',
                      )}>
                        {new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(msg.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">
                      <Bot className="size-4 text-white" />
                    </div>
                    <div className="rounded-2xl bg-muted/60 px-4 py-3">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="size-2 rounded-full bg-emerald-500"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-3">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="سؤال خود را بپرسید..."
              className="flex-1 rounded-xl border-emerald-200/50 bg-emerald-50/30 focus-visible:ring-emerald-500/30 dark:border-emerald-900/50 dark:bg-emerald-950/20"
              disabled={isTyping}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isTyping}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              size="icon"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

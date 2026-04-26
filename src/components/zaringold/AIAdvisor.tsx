"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Send, Sparkles, TrendingUp, MessageCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";

const aiMessages = [
  {
    role: "assistant",
    text: "سلام! 👋 من دستیار هوشمند زرین گلد هستم. چطور میتونم کمکتون کنم؟",
    time: "۱۰:۰۰",
  },
  {
    role: "user",
    text: "قیمت طلا الان چقدره؟ آیا وقت خوبی برای خریده؟",
    time: "۱۰:۰۱",
  },
  {
    role: "assistant",
    text: "طلای ۱۸ عیار الان ۴,۲۵۰,۰۰۰ تومانه. 📊 تحلیل فنی ما نشون میده که در محدوده حمایت قرار داریم. پیشنهاد من خرید تدریجی ۱۰ تا ۲۰ درصد از سرمایه‌تونه.",
    time: "۱۰:۰۱",
  },
  {
    role: "assistant",
    text: "📈 روند ۳ ماه اخیر صعودیه و میانگین متحرک ۵۰ روزه بالای ۲۰۰ روزه قرار گرفته که سیگنال مثبته.",
    time: "۱۰:۰۲",
  },
];

const aiFeatures = [
  {
    icon: TrendingUp,
    title: "تحلیل بازار",
    description: "تحلیل فنی و بنیادی بازار طلا به صورت لحظهای",
  },
  {
    icon: Sparkles,
    title: "پیشبینی قیمت",
    description: "پیشبینی هوشمند قیمت طلا با الگوریتمهای AI",
  },
  {
    icon: Brain,
    title: "مشاوره سرمایهگذاری",
    description: "توصیه شخصیسازی شده بر اساس ریسک و سوددهی",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function AIAdvisor() {
  const [messages, setMessages] = useState(aiMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessages = [
      ...messages,
      {
        role: "user" as const,
        text: input,
        time: new Date().toLocaleTimeString("fa-IR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const responses = [
        "بر اساس تحلیل من، الان فرصت خوبی برای سرمایهگذاری در طلاست. 🪙",
        "پیشنهاد میکنم سبدتون رو تنوع‌بخشی کنید: ۶۰٪ طلای ۱۸ عیار، ۳۰٪ سکه و ۱۰٪ طلای ۲۴ عیار.",
        "📊 شاخص ترس و طمع بازار طلا الان در محدوده «طمع» قرار داره. احتیاط پیشنهاد میشه.",
      ];
      setMessages([
        ...newMessages,
        {
          role: "assistant" as const,
          text: responses[Math.floor(Math.random() * responses.length)],
          time: new Date().toLocaleTimeString("fa-IR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold gold-gradient-text mb-4">
            مشاور هوشمند
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            با هوش مصنوعی زرین گلد، بهترین تصمیمات سرمایهگذاری را بگیرید
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-5 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {/* Chat Interface */}
          <motion.div className="lg:col-span-3" variants={itemVariants}>
            <Card className="gold-card-glow border-border/50 bg-card/80 h-[500px] flex flex-col">
              <CardContent className="p-4 flex flex-col h-full">
                {/* Chat Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                    <Brain className="w-5 h-5 text-background" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">دستیار هوشمند زرین گلد</h3>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-positive" />
                      <span className="text-xs text-positive">آنلاین</span>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="mr-auto text-xs bg-gold/10 text-gold"
                  >
                    نسخه {toPersianNumber("2.9.4")}
                  </Badge>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        msg.role === "user" ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-secondary text-secondary-foreground rounded-br-none"
                            : "bg-gradient-to-l from-gold/15 to-gold/5 border border-gold/20 text-foreground rounded-bl-none"
                        }`}
                      >
                        <p>{msg.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.role === "user"
                              ? "text-muted-foreground"
                              : "text-gold/60"
                          }`}
                        >
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-end">
                      <div className="bg-gold/10 border border-gold/20 p-3 rounded-2xl rounded-bl-none">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-gold/50 animate-bounce" />
                          <div
                            className="w-2 h-2 rounded-full bg-gold/50 animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          />
                          <div
                            className="w-2 h-2 rounded-full bg-gold/50 animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="pt-4 border-t border-border/50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="سوالتون رو بپرسید..."
                      className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gold/50 transition-colors placeholder:text-muted-foreground"
                    />
                    <Button
                      onClick={handleSend}
                      size="icon"
                      className="rounded-xl bg-gradient-to-l from-gold-dark to-gold text-background hover:from-gold hover:to-gold-light shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Features */}
          <motion.div className="lg:col-span-2 space-y-4" variants={itemVariants}>
            {aiFeatures.map((feature) => (
              <Card
                key={feature.title}
                className="gold-card-glow border-border/50 bg-card/80"
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="border-gold/20 bg-gradient-to-br from-gold/5 to-gold/10">
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-10 h-10 text-gold mx-auto mb-3" />
                <h4 className="font-bold mb-2">مشاوره رایگان</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  اولین مشاوره سرمایهگذاری رایگان است
                </p>
                <Button className="bg-gradient-to-l from-gold-dark to-gold text-background font-bold hover:from-gold hover:to-gold-light">
                  شروع گفتگو
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function toPersianNumber(num: string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

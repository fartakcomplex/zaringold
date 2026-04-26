"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Shield, Zap, Star } from "lucide-react";

function toPersianNumber(num: string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

const stats = [
  { label: "کاربر فعال", value: "۱۲۰,۰۰۰+", icon: Star },
  { label: "حجم معاملات (میلیارد تومان)", value: "۵۰۰+", icon: Zap },
  { label: "آپتایم", value: "۹۹.۹٪", icon: Shield },
];

function FloatingParticle({ delay, left }: { delay: number; left: string }) {
  return (
    <div
      className="particle"
      style={{
        left,
        bottom: "10%",
        animationDelay: `${delay}s`,
        animationDuration: `${4 + Math.random() * 4}s`,
      }}
    />
  );
}

export function HeroSection() {
  const [currentGoldPrice, setCurrentGoldPrice] = useState("۴,۲۵۰,۰۰۰");

  useEffect(() => {
    const interval = setInterval(() => {
      const base = 4250000;
      const fluctuation = Math.round((Math.random() - 0.5) * 10000);
      const price = base + fluctuation;
      setCurrentGoldPrice(toPersianNumber(price.toLocaleString()));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center hero-gradient overflow-hidden">
      {/* Floating Particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <FloatingParticle
          key={i}
          delay={i * 0.4}
          left={`${5 + Math.random() * 90}%`}
        />
      ))}

      {/* Decorative Gold Circles */}
      <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-gold/5 blur-3xl animate-pulse-gold" />
      <div className="absolute bottom-20 left-20 w-48 h-48 rounded-full bg-gold/3 blur-3xl" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Version Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge
            variant="outline"
            className="mb-6 px-4 py-1.5 border-gold/30 bg-gold/5 text-gold text-sm"
          >
            <Sparkles className="w-3.5 h-3.5 ml-1" />
            نسخه {toPersianNumber("2.9.4")} — بهبود UI موبایل و لوگوی اپراتورها
          </Badge>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <span className="gold-gradient-text">پلتفرم جامع</span>
          <br />
          <span className="text-foreground">معاملات طلای هوشمند</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          خرید، فروش و سرمایهگذاری طلای دیجیتال با هوش مصنوعی
        </motion.p>

        {/* Live Price Display */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-card/60 backdrop-blur-sm border border-gold/20">
            <span className="text-2xl">🪙</span>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">طلای ۱۸ عیار</p>
              <p className="text-xl font-bold gold-gradient-text ltr" dir="ltr">
                {currentGoldPrice}
              </p>
            </div>
            <div className="text-xs text-muted-foreground border-r border-border/50 pr-3">
              <p>تومان</p>
              <p className="text-positive">لحظهای</p>
            </div>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <Button
            size="lg"
            className="px-8 py-6 text-base bg-gradient-to-l from-gold-dark to-gold text-background font-bold hover:from-gold hover:to-gold-light shadow-lg shadow-gold/20 transition-all hover:shadow-gold/30 hover:scale-105"
          >
            شروع کنید
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="px-8 py-6 text-base border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/50"
          >
            بیشتر بدانید
          </Button>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          className="grid grid-cols-3 gap-4 max-w-lg mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="w-4 h-4 text-gold mx-auto mb-1" />
              <p className="text-lg md:text-xl font-bold text-foreground">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

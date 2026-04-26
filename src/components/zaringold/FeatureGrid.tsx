"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Wallet,
  Brain,
  CreditCard,
  LayoutGrid,
  Trophy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: BarChart3,
    title: "معاملات لحظهای طلا",
    description: "خرید و فروش طلا با قیمت لحظهای و اتصال مستقیم به بازار جهانی از طریق WebSocket",
    gradient: "from-amber-500/20 to-yellow-600/20",
    iconColor: "text-amber-400",
  },
  {
    icon: Wallet,
    title: "کیف پول دوگانه",
    description: "مدیریت یکپارچه داراییهای ریالی و طلایی با امکان تبدیل آنی بین دو کیف پول",
    gradient: "from-emerald-500/20 to-green-600/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: Brain,
    title: "هوش مصنوعی",
    description: "مشاوره سرمایهگذاری، تحلیل بازار و پیشبینی قیمت با استفاده از هوش مصنوعی پیشرفته",
    gradient: "from-purple-500/20 to-violet-600/20",
    iconColor: "text-purple-400",
  },
  {
    icon: CreditCard,
    title: "درگاه پرداخت طلایی",
    description: "پذیرش پرداخت با طلای دیجیتال برای کسبوکارها با QR Code و API یکپارچه",
    gradient: "from-rose-500/20 to-pink-600/20",
    iconColor: "text-rose-400",
  },
  {
    icon: LayoutGrid,
    title: "خدمات جامع",
    description: "بیمه، قبوض، خدمات خودرو، کارت طلایی و بیش از ۵۰ خدمت مالی در یک پلتفرم",
    gradient: "from-cyan-500/20 to-teal-600/20",
    iconColor: "text-cyan-400",
  },
  {
    icon: Trophy,
    title: "گیمیفیکیشن",
    description: "آموزش مالی تعاملی، چالشهای سرمایهگذاری و پاداش برای فعالیت کاربران",
    gradient: "from-orange-500/20 to-amber-600/20",
    iconColor: "text-orange-400",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function FeatureGrid() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold gold-gradient-text mb-4">
            ویژگیهای کلیدی
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            زرین گلد با ترکیب فناوریهای نوین و خدمات جامع مالی، تجربه
            متفاوتی از معاملات طلای دیجیتال ارائه میدهد
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card className="gold-card-glow border-border/50 bg-card/80 backdrop-blur-sm h-full group">
                <CardContent className="p-6 h-full flex flex-col">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

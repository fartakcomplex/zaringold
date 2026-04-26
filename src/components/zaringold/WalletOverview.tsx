"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Gem,
  Banknote,
} from "lucide-react";

function toPersianNumber(num: number | string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

const mockTransactions = [
  {
    id: "1",
    type: "buy",
    title: "خرید طلای ۱۸ عیار",
    amount: -50000000,
    goldAmount: 11.76,
    time: "۱۰:۳۰",
    date: "امروز",
  },
  {
    id: "2",
    type: "sell",
    title: "فروش طلای ۲۴ عیار",
    amount: 28250000,
    goldAmount: -5,
    time: "۰۹:۱۵",
    date: "امروز",
  },
  {
    id: "3",
    type: "deposit",
    title: "واریز ریالی",
    amount: 100000000,
    goldAmount: 0,
    time: "۲۳:۴۵",
    date: "دیروز",
  },
  {
    id: "4",
    type: "convert",
    title: "تبدیل ریال به طلا",
    amount: -200000000,
    goldAmount: 47.06,
    time: "۱۸:۰۰",
    date: "دیروز",
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

export function WalletOverview() {
  return (
    <section id="wallet" className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold gold-gradient-text mb-4">
            کیف پول هوشمند
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            مدیریت یکپارچه داراییهای ریالی و طلایی با امکان تبدیل آنی
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {/* Fiat Wallet */}
          <motion.div variants={itemVariants}>
            <Card className="gold-card-glow border-border/50 bg-gradient-to-br from-card to-card/80 h-full overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold">کیف پول ریالی</h3>
                      <p className="text-xs text-muted-foreground">Fiat Wallet</p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-400"
                  >
                    فعال
                  </Badge>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-1">موجودی</p>
                  <p className="text-2xl font-bold ltr" dir="ltr">
                    {toPersianNumber("850,000,000")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">تومان</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gold/30 text-gold hover:bg-gold/10"
                  >
                    <ArrowDownLeft className="w-4 h-4 ml-1" />
                    واریز
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                  >
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                    برداشت
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Gold Wallet */}
          <motion.div variants={itemVariants}>
            <Card className="gold-card-glow border-gold/20 bg-gradient-to-br from-card to-gold/5 h-full overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center">
                      <Gem className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-bold">کیف پول طلایی</h3>
                      <p className="text-xs text-muted-foreground">Gold Wallet</p>
                    </div>
                  </div>
                  <Badge className="bg-gold text-background">VIP</Badge>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-1">موجودی طلا</p>
                  <p className="text-3xl font-bold gold-gradient-text ltr" dir="ltr">
                    {toPersianNumber("47.06")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">گرم طلای ۱۸ عیار</p>
                </div>

                <div className="mb-6 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">ارزش ریالی</p>
                  <p className="text-lg font-semibold ltr" dir="ltr">
                    {toPersianNumber("200,000,000")} تومان
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-positive" />
                    <span className="text-xs text-positive">
                      +{toPersianNumber("2.3")}٪ امروز
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-l from-gold-dark to-gold text-background font-bold hover:from-gold hover:to-gold-light"
                  >
                    <ArrowRightLeft className="w-4 h-4 ml-1" />
                    تبدیل
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div variants={itemVariants}>
            <Card className="gold-card-glow border-border/50 bg-card/80 h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-gold" />
                    تراکنشهای اخیر
                  </h3>
                  <Badge variant="secondary" className="text-xs bg-muted">
                    {toPersianNumber("۴")} مورد
                  </Badge>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {mockTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          tx.type === "buy"
                            ? "bg-negative/10"
                            : tx.type === "sell"
                            ? "bg-positive/10"
                            : tx.type === "deposit"
                            ? "bg-emerald-500/10"
                            : "bg-gold/10"
                        }`}
                      >
                        {tx.type === "buy" ? (
                          <ArrowDownLeft className="w-4 h-4 text-negative" />
                        ) : tx.type === "sell" ? (
                          <ArrowUpRight className="w-4 h-4 text-positive" />
                        ) : tx.type === "deposit" ? (
                          <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <ArrowRightLeft className="w-4 h-4 text-gold" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {tx.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.date} - {tx.time}
                        </p>
                      </div>
                      <p
                        className={`text-sm font-semibold whitespace-nowrap ${
                          tx.amount > 0 ? "text-positive" : "text-foreground"
                        }`}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {toPersianNumber(Math.abs(tx.amount).toLocaleString())}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

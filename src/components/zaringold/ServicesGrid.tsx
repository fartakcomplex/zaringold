"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Receipt,
  Car,
  Gift,
  Zap,
  Phone,
  Droplets,
  Flame,
  Wifi,
  FileCheck,
  AlertTriangle,
  CreditCard as CreditCardIcon,
} from "lucide-react";

const serviceCategories = [
  {
    title: "بیمه",
    titleEn: "Insurance",
    icon: Shield,
    color: "text-emerald-400",
    bg: "from-emerald-500/20 to-green-600/20",
    services: [
      { name: "بیمه عمر", icon: Shield, desc: "بیمه عمر و سرمایهگذاری" },
      { name: "بیمه خودرو", icon: Car, desc: "بیمه شخص ثالث و بدنه" },
      { name: "بیمه مسافرتی", icon: Plane, desc: "بیمه سفر داخلی و خارجی" },
      { name: "بیمه آتشسوزی", icon: Flame, desc: "بیمه منزل و محل کار" },
    ],
  },
  {
    title: "قبوض",
    titleEn: "Utility Bills",
    icon: Receipt,
    color: "text-cyan-400",
    bg: "from-cyan-500/20 to-teal-600/20",
    services: [
      { name: "برق", icon: Zap, desc: "پرداخت قبض برق" },
      { name: "گاز", icon: Flame, desc: "پرداخت قبض گاز" },
      { name: "آب", icon: Droplets, desc: "پرداخت قبض آب" },
      { name: "تلفن", icon: Phone, desc: "پرداخت قبض تلفن ثابت" },
    ],
  },
  {
    title: "خدمات خودرو",
    titleEn: "Vehicle Services",
    icon: Car,
    color: "text-orange-400",
    bg: "from-orange-500/20 to-amber-600/20",
    services: [
      { name: "عوارضی", icon: Car, desc: "پرداخت عوارض جادهای" },
      { name: "تخفیف uninsured", icon: FileCheck, desc: "استعلام تخفیف بیمه" },
      { name: "خلافی", icon: AlertTriangle, desc: "استعلام خلافی خودرو" },
      { name: "مالیات", icon: Receipt, desc: "پرداخت مالیات خودرو" },
    ],
  },
  {
    title: "کارت طلایی",
    titleEn: "Gold Card",
    icon: Gift,
    color: "text-yellow-400",
    bg: "from-yellow-500/20 to-amber-600/20",
    services: [
      { name: "کارت هدیه", icon: Gift, desc: "خرید کارت هدیه طلایی" },
      { name: "شارژ اعتبار", icon: CreditCardIcon, desc: "شارژ کارت طلایی" },
      { name: "موجودی", icon: Wifi, desc: "استعلام موجودی کارت" },
      { name: "تراکنشها", icon: Receipt, desc: "مشاهده تراکنشهای کارت" },
    ],
  },
];

function Plane(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function ServicesGrid() {
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold gold-gradient-text mb-4">
            خدمات جامع مالی
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            بیش از ۵۰ خدمت مالی و غیرمالی در یک پلتفرم واحد
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {serviceCategories.map((category) => (
            <motion.div key={category.title} variants={itemVariants}>
              <Card className="gold-card-glow border-border/50 bg-card/80 h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${category.bg} flex items-center justify-center`}
                    >
                      <category.icon
                        className={`w-5 h-5 ${category.color}`}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{category.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {category.titleEn}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="mr-auto text-xs bg-muted"
                    >
                      {toPersianNumber(category.services.length.toString())}{" "}
                      خدمت
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {category.services.map((service) => (
                      <button
                        key={service.name}
                        className="flex items-center gap-2 p-3 rounded-lg border border-border/30 hover:border-gold/30 hover:bg-gold/5 transition-all text-right cursor-pointer"
                      >
                        <service.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {service.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {service.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function toPersianNumber(num: string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

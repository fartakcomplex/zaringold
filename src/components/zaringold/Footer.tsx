"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function toPersianNumber(num: string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

const quickLinks = {
  بازار: [
    { label: "قیمت لحظهای طلا", href: "#gold-market" },
    { label: "نمودار طلا", href: "#gold-market" },
    { label: "خبرنامه بازار", href: "#" },
    { label: "تحلیل کارشناسان", href: "#" },
  ],
  خدمات: [
    { label: "خرید شارژ", href: "#services" },
    { label: "پرداخت قبوض", href: "#" },
    { label: "بیمه", href: "#" },
    { label: "خدمات خودرو", href: "#" },
  ],
  پشتیبانی: [
    { label: "مرکز راهنما", href: "#" },
    { label: "تماس با ما", href: "#" },
    { label: "سوالات متداول", href: "#" },
    { label: "شرایط استفاده", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer id="about" className="border-t border-border/50 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🪙</span>
              <span className="text-xl font-extrabold gold-gradient-text">
                زرین گلد
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              پلتفرم جامع معاملات طلای هوشمند. خرید، فروش و سرمایهگذاری
              طلای دیجیتال با هوش مصنوعی پیشرفته.
            </p>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground hover:bg-gold/10 hover:text-gold cursor-pointer transition-colors">
                𝕏
              </div>
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground hover:bg-gold/10 hover:text-gold cursor-pointer transition-colors">
                in
              </div>
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground hover:bg-gold/10 hover:text-gold cursor-pointer transition-colors">
                t
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(quickLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-bold mb-4 text-sm">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-gold transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="bg-border/30 mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {toPersianNumber("1404")} زرین گلد — تمامی حقوق محفوظ است.</p>
          <p>نسخه {toPersianNumber("2.9.4")} | ساخته شده با ❤️ توسط فارتک کامپلکس</p>
        </div>
      </div>
    </footer>
  );
}

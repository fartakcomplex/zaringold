"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/zaringold/ThemeToggle";
import { Menu, X, Sparkles } from "lucide-react";

function toPersianNumber(num: string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

const navLinks = [
  { label: "خانه", href: "#" },
  { label: "بازار طلا", href: "#gold-market" },
  { label: "ویژگیها", href: "#features" },
  { label: "خدمات", href: "#services" },
  { label: "کیف پول", href: "#wallet" },
  { label: "درباره ما", href: "#about" },
];

const tickerItems = [
  { name: "طلای ۱۸", price: "۴,۲۵۰,۰۰۰", change: "+0.8%", positive: true },
  { name: "سکه بهار", price: "۳۲,۵۰۰,۰۰۰", change: "+1.2%", positive: true },
  { name: "نیم سکه", price: "۱۸,۵۰۰,۰۰۰", change: "-0.3%", positive: false },
  { name: "طلای ۲۴", price: "۵,۶۵۰,۰۰۰", change: "+0.5%", positive: true },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerItems.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentTicker = tickerItems[tickerIndex];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glassmorphism shadow-lg shadow-black/10"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <span className="text-2xl">🪙</span>
            <span className="text-xl font-extrabold gold-gradient-text">
              زرین گلد
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-gold/5 rounded-lg transition-all"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Button
              size="sm"
              className="hidden sm:flex bg-gradient-to-l from-gold-dark to-gold text-background font-bold hover:from-gold hover:to-gold-light"
            >
              ورود / ثبتنام
            </Button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-card border-border">
                <div className="flex flex-col gap-6 mt-8">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🪙</span>
                    <span className="text-lg font-extrabold gold-gradient-text">
                      زرین گلد
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {navLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        className="px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-gold/5 rounded-lg transition-all"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                  <Button className="bg-gradient-to-l from-gold-dark to-gold text-background font-bold">
                    ورود / ثبتنام
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Price Ticker */}
      <div className="border-t border-border/30 bg-card/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-center gap-4 text-xs">
          <AnimatePresence mode="wait">
            <motion.div
              key={tickerIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <span className="font-medium text-foreground">
                {currentTicker.name}
              </span>
              <span className="text-muted-foreground ltr" dir="ltr">
                {currentTicker.price}
              </span>
              <span
                className={`font-medium ${
                  currentTicker.positive ? "text-positive" : "text-negative"
                }`}
              >
                {currentTicker.change}
              </span>
            </motion.div>
          </AnimatePresence>
          <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
            <Sparkles className="w-3 h-3 text-gold" />
            <span>بروزرسانی لحظهای</span>
          </div>
        </div>
      </div>
    </header>
  );
}

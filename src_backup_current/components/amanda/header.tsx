'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, Heart, Menu, X, Moon, Sun, Phone } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCartStore } from '@/store/cart-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const { theme, setTheme } = useTheme();
  const getTotalItems = useCartStore((s) => s.getTotalItems);
  const wishlist = useCartStore((s) => s.wishlist);
  const totalItems = getTotalItems();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const navItems = [
    { label: 'خانه', href: '#' },
    { label: 'محصولات', href: '#products' },
    { label: 'دسته‌بندی‌ها', href: '#categories' },
    { label: 'درباره ما', href: '#about' },
    { label: 'تماس', href: '#contact' },
  ];

  return (
    <>
      {/* Top bar */}
      <div className="bg-gradient-to-l from-pink-600 to-rose-500 text-white py-2 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-3 h-3" />
            <span className="hidden sm:inline">۰۲۱-۱۲۳۴۵۶۷۸</span>
            <span className="sm:hidden">تماس با ما</span>
          </div>
          <div className="flex items-center gap-2">
            <span>ارسال رایگان برای خریدهای بالای ۵۰۰,۰۰۰ تومان</span>
            <span className="hidden sm:inline mx-2">|</span>
            <span className="hidden sm:inline">🎁 تخفیف ویژه زمستانه</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg'
            : 'bg-white dark:bg-gray-900'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <span className="text-white font-bold text-lg md:text-xl">A</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold bg-gradient-to-l from-pink-600 to-rose-500 bg-clip-text text-transparent">
                  آماندا کیدز
                </h1>
                <p className="text-[10px] text-muted-foreground -mt-1">لباس کودک و نوزاد</p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-pink-50 dark:hover:bg-pink-950/30 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(!searchOpen)}
                className="rounded-full hover:bg-pink-50 dark:hover:bg-pink-950/30"
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* Theme toggle */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-full hover:bg-pink-50 dark:hover:bg-pink-950/30"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </Button>
              )}

              {/* Wishlist */}
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full hover:bg-pink-50 dark:hover:bg-pink-950/30"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <Badge className="absolute -top-1 -left-1 w-5 h-5 flex items-center justify-center p-0 bg-pink-500 text-white text-[10px]">
                    {wishlist.length}
                  </Badge>
                )}
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => useCartStore.getState().setIsOpen(true)}
                className="relative rounded-full hover:bg-pink-50 dark:hover:bg-pink-950/30"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -left-1 w-5 h-5 flex items-center justify-center p-0 bg-rose-500 text-white text-[10px] animate-bounce">
                    {totalItems}
                  </Badge>
                )}
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-full"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Search bar */}
          {searchOpen && (
            <div className="pb-4 animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="جستجو در محصولات..."
                  className="pr-10 pl-4 h-12 rounded-full border-pink-200 focus:border-pink-400 dark:border-pink-800 dark:focus:border-pink-500 bg-pink-50/50 dark:bg-pink-950/20"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-white dark:bg-gray-900 animate-in slide-in-from-top-2 fade-in duration-200">
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm font-medium rounded-lg hover:bg-pink-50 dark:hover:bg-pink-950/30 hover:text-pink-600 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

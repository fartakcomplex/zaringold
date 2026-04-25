'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCartStore, CartItem } from '@/store/cart-store';
import { formatPrice } from '@/data/products';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, clearCart, getTotalPrice } =
    useCartStore();
  const totalPrice = getTotalPrice();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-pink-500" />
                <h2 className="text-lg font-bold">سبد خرید</h2>
                {items.length > 0 && (
                  <Badge variant="secondary" className="bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300">
                    {items.length} کالا
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="rounded-full hover:bg-pink-50 dark:hover:bg-pink-950/30"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Items */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 rounded-full bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-10 h-10 text-pink-300" />
                </div>
                <h3 className="text-lg font-semibold mb-2">سبد خرید خالی است</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  محصولات مورد علاقه خود را اضافه کنید
                </p>
                <Button
                  onClick={() => setIsOpen(false)}
                  className="bg-gradient-to-l from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white rounded-full px-8"
                >
                  مشاهده محصولات
                </Button>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 p-4 md:p-6">
                  <div className="space-y-4">
                    {items.map((item) => (
                      <CartItemCard
                        key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                        item={item}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeItem}
                      />
                    ))}
                  </div>
                </ScrollArea>

                {/* Footer */}
                <div className="border-t p-4 md:p-6 space-y-4 bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>جمع کل</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                    {totalPrice >= 500000 && (
                      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <span>✓</span>
                        <span>ارسال رایگان</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>مبلغ قابل پرداخت</span>
                      <span className="text-pink-600 dark:text-pink-400">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-l from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white h-12 rounded-xl text-base font-semibold">
                    ادامه فرآیند خرید
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-destructive"
                    onClick={clearCart}
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    پاک کردن سبد خرید
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (id: string, size: string, color: string, qty: number) => void;
  onRemove: (id: string, size: string, color: string) => void;
}) {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:shadow-sm transition-shadow">
      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
        <Image
          src={item.product.image}
          alt={item.product.name}
          fill
          className="object-cover"
          sizes="80px"
        />
        {item.product.badge && (
          <Badge className="absolute top-1 right-1 text-[10px] px-1.5 py-0 bg-pink-500 text-white">
            {item.product.badge}
          </Badge>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{item.selectedSize}</span>
          <span>•</span>
          <span>{item.selectedColor}</span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 bg-white dark:bg-gray-700 rounded-lg border">
            <button
              onClick={() =>
                onUpdateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity - 1)
              }
              className="w-7 h-7 flex items-center justify-center hover:bg-pink-50 dark:hover:bg-pink-950/30 rounded-r-lg transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
            <button
              onClick={() =>
                onUpdateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity + 1)
              }
              className="w-7 h-7 flex items-center justify-center hover:bg-pink-50 dark:hover:bg-pink-950/30 rounded-l-lg transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="text-left">
            <span className="font-bold text-sm text-pink-600 dark:text-pink-400">
              {formatPrice(item.product.price * item.quantity)}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onRemove(item.product.id, item.selectedSize, item.selectedColor)}
        className="self-start p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors text-muted-foreground hover:text-red-500"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

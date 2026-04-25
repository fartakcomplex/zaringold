'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Star, Heart, ShoppingCart, Minus, Plus, Check, Truck, Shield, RotateCcw } from 'lucide-react';
import { Product, useCartStore } from '@/store/cart-store';
import { formatPrice } from '@/data/products';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductQuickView({ product, isOpen, onClose }: ProductQuickViewProps) {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const wishlist = useCartStore((s) => s.wishlist);
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);

  if (!product) return null;

  const isWishlisted = wishlist.includes(product.id);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  if (!selectedSize && product.sizes.length > 0) setSelectedSize(product.sizes[0]);
  if (!selectedColor && product.colors.length > 0) setSelectedColor(product.colors[0]);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedSize, selectedColor);
    }
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
      onClose();
    }, 1500);
  };

  const handleClose = () => {
    setAddedToCart(false);
    setQuantity(1);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[80] backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-10 lg:inset-20 bg-white dark:bg-gray-900 z-[90] rounded-2xl shadow-2xl overflow-hidden"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-md"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 h-full max-h-[calc(100vh-5rem)]">
              {/* Image */}
              <div className="relative bg-gray-50 dark:bg-gray-800 overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {product.badge && (
                    <Badge className="bg-pink-500 text-white text-sm px-3 py-1 rounded-full">
                      {product.badge}
                    </Badge>
                  )}
                  {discount > 0 && (
                    <Badge className="bg-red-500 text-white text-sm px-3 py-1 rounded-full">
                      {discount}٪ تخفیف
                    </Badge>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="p-6 md:p-8 overflow-y-auto">
                <div className="space-y-6">
                  {/* Category & Rating */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {product.category === 'girls'
                        ? 'دخترانه'
                        : product.category === 'boys'
                        ? 'پسرانه'
                        : product.category === 'baby'
                        ? 'نوزادی'
                        : 'اکسسوری'}
                    </Badge>
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isWishlisted
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-red-50 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Title */}
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{product.name}</h2>
                    <p className="text-sm text-muted-foreground">{product.nameEn}</p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-200 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {product.rating} ({product.reviews} نظر)
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>

                  <Separator />

                  {/* Size selection */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3">سایز</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                            selectedSize === size
                              ? 'border-pink-400 bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 shadow-sm'
                              : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color selection */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3">رنگ</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-4 py-2 rounded-xl border text-sm transition-all ${
                            selectedColor === color
                              ? 'border-pink-400 bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 shadow-sm'
                              : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3">تعداد</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-xl overflow-hidden">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-10 h-10 flex items-center justify-center hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-medium">{quantity}</span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-10 h-10 flex items-center justify-center hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Add to cart */}
                  <Button
                    onClick={handleAddToCart}
                    className={`w-full h-12 rounded-xl text-base font-semibold transition-all ${
                      addedToCart
                        ? 'bg-green-500 hover:bg-green-500 text-white'
                        : 'bg-gradient-to-l from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white'
                    }`}
                  >
                    {addedToCart ? (
                      <>
                        <Check className="w-5 h-5 ml-2" />
                        با موفقیت اضافه شد!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 ml-2" />
                        افزودن به سبد خرید
                      </>
                    )}
                  </Button>

                  {/* Features */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center gap-1 text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <Truck className="w-5 h-5 text-pink-500" />
                      <span className="text-[10px] text-muted-foreground">ارسال سریع</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <Shield className="w-5 h-5 text-pink-500" />
                      <span className="text-[10px] text-muted-foreground">ضمانت اصالت</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <RotateCcw className="w-5 h-5 text-pink-500" />
                      <span className="text-[10px] text-muted-foreground">بازگشت کالا</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

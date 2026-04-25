'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Heart, Star, ShoppingCart, Eye, Plus, Check } from 'lucide-react';
import { Product, useCartStore } from '@/store/cart-store';
import { formatPrice } from '@/data/products';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [addedToCart, setAddedToCart] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const wishlist = useCartStore((s) => s.wishlist);
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);
  const isWishlisted = wishlist.includes(product.id);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    addItem(product, selectedSize, selectedColor);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-800">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Overlay on hover */}
        <motion.div
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 bg-black/10 flex items-end justify-center pb-4 pointer-events-none"
        />

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {product.badge && (
            <Badge className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full shadow-md">
              {product.badge}
            </Badge>
          )}
          {discount > 0 && (
            <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full shadow-md">
              {discount}٪-
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        <motion.div
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
          className="absolute top-3 left-3 flex flex-col gap-2"
        >
          <button
            onClick={() => toggleWishlist(product.id)}
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all ${
              isWishlisted
                ? 'bg-red-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
          {onQuickView && (
            <button
              onClick={() => onQuickView(product)}
              className="w-9 h-9 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-pink-50 hover:text-pink-500 shadow-md flex items-center justify-center transition-all"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </motion.div>

        {/* Quick add button */}
        <motion.div
          initial={false}
          animate={{ y: isHovered ? 0 : 60, opacity: isHovered ? 1 : 0 }}
          className="absolute bottom-3 left-3 right-3"
        >
          <Button
            onClick={handleAddToCart}
            className={`w-full rounded-xl h-10 text-sm font-medium shadow-lg transition-all ${
              addedToCart
                ? 'bg-green-500 hover:bg-green-500 text-white'
                : 'bg-white/95 dark:bg-gray-800/95 text-gray-800 dark:text-white hover:bg-pink-500 hover:text-white backdrop-blur-sm'
            }`}
          >
            {addedToCart ? (
              <>
                <Check className="w-4 h-4 ml-1" />
                اضافه شد!
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 ml-1" />
                افزودن به سبد
              </>
            )}
          </Button>
        </motion.div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-1 mb-1.5">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(product.rating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-200 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>

        <h3 className="font-semibold text-sm mb-1 line-clamp-1 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
          {product.name}
        </h3>

        {/* Size options */}
        <div className="flex gap-1 mb-3 flex-wrap">
          {product.sizes.slice(0, 3).map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                selectedSize === size
                  ? 'border-pink-400 bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400'
                  : 'border-gray-200 dark:border-gray-700 text-muted-foreground hover:border-pink-300'
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-pink-600 dark:text-pink-400">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {product.colors.slice(0, 3).map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                  selectedColor === color
                    ? 'border-pink-400 text-pink-600 dark:text-pink-400'
                    : 'border-gray-200 dark:border-gray-700 text-muted-foreground'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

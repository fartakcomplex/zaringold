'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface GoldPriceItem {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: number[];
}

interface GoldPriceCardProps {
  item: GoldPriceItem;
  index: number;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price);
}

export default function GoldPriceCard({ item, index }: GoldPriceCardProps) {
  const isPositive = item.change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="glassmorphism gold-card-glow border-border/50 overflow-hidden">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm text-foreground">{item.name}</h3>
              <p className="text-xs text-muted-foreground ltr">{item.nameEn}</p>
            </div>
            <Badge
              variant="secondary"
              className={`text-xs font-bold ${
                isPositive
                  ? 'bg-positive/10 text-positive border-positive/20'
                  : 'bg-negative/10 text-negative border-negative/20'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3 ml-1" />
              ) : (
                <TrendingDown className="w-3 h-3 ml-1" />
              )}
              {isPositive ? '+' : ''}
              {item.changePercent.toLocaleString('fa-IR')}٪
            </Badge>
          </div>

          {/* Price */}
          <div className="mb-3">
            <span className="text-xl font-black gold-gradient-text">
              {formatPrice(item.price)}
            </span>
            <span className="text-xs text-muted-foreground mr-1">تومان</span>
          </div>

          {/* Sparkline */}
          <div className="flex items-center justify-between">
            <svg
              viewBox="0 0 80 32"
              className="w-20 h-8 sparkline-container"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id={`gradient-${item.id}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={isPositive ? '#10B981' : '#EF4444'}
                    stopOpacity="0.3"
                  />
                  <stop
                    offset="100%"
                    stopColor={isPositive ? '#10B981' : '#EF4444'}
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>
              <path
                d={(() => {
                  const data = item.sparkline;
                  const min = Math.min(...data);
                  const max = Math.max(...data);
                  const range = max - min || 1;
                  const step = 80 / (data.length - 1);

                  const points = data.map((val, i) => ({
                    x: i * step,
                    y: 32 - ((val - min) / range) * 28 - 2,
                  }));

                  let path = `M ${points[0].x} ${points[0].y}`;
                  for (let i = 1; i < points.length; i++) {
                    const prev = points[i - 1];
                    const curr = points[i];
                    const cpx1 = prev.x + step * 0.4;
                    const cpx2 = curr.x - step * 0.4;
                    path += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
                  }
                  return path;
                })()}
                fill="none"
                stroke={isPositive ? '#10B981' : '#EF4444'}
                strokeWidth="1.5"
              />
              <path
                d={(() => {
                  const data = item.sparkline;
                  const min = Math.min(...data);
                  const max = Math.max(...data);
                  const range = max - min || 1;
                  const step = 80 / (data.length - 1);

                  const points = data.map((val, i) => ({
                    x: i * step,
                    y: 32 - ((val - min) / range) * 28 - 2,
                  }));

                  let path = `M ${points[0].x} ${points[0].y}`;
                  for (let i = 1; i < points.length; i++) {
                    const prev = points[i - 1];
                    const curr = points[i];
                    const cpx1 = prev.x + step * 0.4;
                    const cpx2 = curr.x - step * 0.4;
                    path += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
                  }
                  path += ` L ${points[points.length - 1].x} 32 L ${points[0].x} 32 Z`;
                  return path;
                })()}
                fill={`url(#gradient-${item.id})`}
              />
            </svg>
            <span
              className={`text-xs font-medium ${
                isPositive ? 'text-positive' : 'text-negative'
              }`}
            >
              {isPositive ? '+' : ''}
              {formatPrice(Math.abs(item.change))}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

'use client';

import { Area, AreaChart, ResponsiveContainer, YAxis } from '@/lib/recharts-compat';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import { Badge } from '@/components/ui/badge';
import { formatToman } from '@/lib/helpers';
// Mock sparkline data — 12 points of price variation around ~35.2M
const mockSparklineData = [
  { v: 35100000 },
  { v: 35150000 },
  { v: 35080000 },
  { v: 35220000 },
  { v: 35180000 },
  { v: 35300000 },
  { v: 35250000 },
  { v: 35350000 },
  { v: 35280000 },
  { v: 35400000 },
  { v: 35320000 },
  { v: 35420000 },
];

interface PriceData {
  buy: number;
  sell: number;
  market: number;
}

export default function LivePriceTicker() {
  const [price, setPrice] = useState<PriceData | null>(null);
  const [prevPrice, setPrevPrice] = useState<number>(0);
  const [isUp, setIsUp] = useState(true);
  const [pulse, setPulse] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('۱۰:۳۰:۴۵');

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/gold/prices');
        if (res.ok) {
          const data = await res.json();
          const newPrice = data.prices.market;
          if (prevPrice && newPrice !== prevPrice) {
            setIsUp(newPrice > prevPrice);
            setPulse(true);
            setTimeout(() => setPulse(false), 1000);
          }
          setPrevPrice(newPrice);
          setPrice(data.prices);
          const now = new Date();
          setLastUpdate(
            new Intl.DateTimeFormat('fa-IR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }).format(now)
          );
        }
      } catch { /* ignore */ }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [prevPrice]);

  if (!price) return null;

  return (
    <div className="relative rounded-xl bg-card/80 border border-gold/20 px-4 py-3 backdrop-blur-sm overflow-hidden ticker-gold-glow">
      {/* ── Header row ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Gold coin icon */}
          <div
            className={`flex size-8 items-center justify-center rounded-lg bg-gold/10 transition-all duration-300 ${
              pulse ? 'scale-110 bg-gold/20' : ''
            }`}
          >
            <span className="text-sm">🪙</span>
          </div>

          {/* Title + Live pulsing badge */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">قیمت طلا</span>

            {/* Live badge — green pulsing dot */}
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-[9px] px-1.5 py-0 hover:bg-emerald-500/15"
            >
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-full rounded-full bg-emerald-500" />
              </span>
              زنده
            </Badge>
          </div>
        </div>

        {/* Price change badge */}
        <Badge
          variant="outline"
          className="gap-0.5 border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold hover:bg-emerald-500/15"
        >
          <TrendingUp className="size-3" />
          +۱.۲٪
        </Badge>
      </div>

      {/* ── Price + Sparkline row ── */}
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          {/* Price with framer-motion subtle scale bounce every 5s */}
          <motion.span
            className="text-sm font-bold text-foreground tabular-nums leading-tight"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{
              duration: 0.5,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 5,
            }}
          >
            {formatToman(price.market)}
          </motion.span>

          {/* Buy price + direction indicator */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              خرید: {formatToman(price.buy)}
            </span>
            <div
              className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-all duration-500 ${
                isUp
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : 'bg-red-500/15 text-red-500'
              }`}
            >
              {isUp ? (
                <TrendingUp className="size-2.5" />
              ) : (
                <TrendingDown className="size-2.5" />
              )}
              {isUp ? '↑' : '↓'}
            </div>
          </div>
        </div>

        {/* ── Mini sparkline chart (150×50) ── */}
        <div className="w-[150px] h-[50px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockSparklineData}>
              <defs>
                <linearGradient id="goldSparkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              {/* Hidden YAxis for proper domain calculation */}
              <YAxis domain={['dataMin - 100000', 'dataMax + 100000']} hide />
              <Area
                type="monotone"
                dataKey="v"
                stroke="#D4AF37"
                strokeWidth={1.5}
                fill="url(#goldSparkGradient)"
                isAnimationActive={false}
                dot={false}
                activeDot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Last update time ── */}
      <p className="mt-1.5 text-[9px] text-muted-foreground/60">
        آخرین بروزرسانی: {lastUpdate}
      </p>
    </div>
  );
}

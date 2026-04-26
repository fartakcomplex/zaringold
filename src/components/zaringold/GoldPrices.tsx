"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkline } from "@/components/zaringold/Sparkline";

interface GoldPrice {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  change: number;
  changePercent: number;
  icon: string;
  sparkline: number[];
}

function toPersianNumber(num: number | string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num
    .toString()
    .replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

function formatPrice(price: number): string {
  return toPersianNumber(price.toLocaleString());
}

export function GoldPriceCard({ data }: { data: GoldPrice }) {
  const isPositive = data.change >= 0;

  return (
    <Card className="gold-card-glow border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden group">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{data.icon}</span>
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                {data.name}
              </h3>
              <p className="text-xs text-muted-foreground">{data.nameEn}</p>
            </div>
          </div>
          <Badge
            variant={isPositive ? "default" : "destructive"}
            className={`text-xs font-medium ${isPositive ? "bg-positive/15 text-positive border-positive/30" : "bg-negative/15 text-negative border-negative/30"}`}
          >
            {isPositive ? "▲" : "▼"}{" "}
            {toPersianNumber(Math.abs(data.changePercent).toFixed(2))}٪
          </Badge>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-lg font-bold text-foreground ltr" dir="ltr">
              {formatPrice(data.price)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              تومان
            </p>
            <p
              className={`text-xs mt-1 ${isPositive ? "text-positive" : "text-negative"}`}
            >
              {isPositive ? "+" : ""}
              {formatPrice(data.change)} تومان
            </p>
          </div>
          <div className="sparkline-container">
            <Sparkline
              data={data.sparkline}
              color={isPositive ? "#10B981" : "#EF4444"}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function GoldPricesSection() {
  const [prices, setPrices] = useState<GoldPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/gold-prices");
      const json = await res.json();
      if (json.success) {
        setPrices(json.data);
        setLastUpdate(new Date(json.timestamp).toLocaleTimeString("fa-IR"));
      }
    } catch {
      // fallback mock
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-border/50 bg-card/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <section id="gold-market" className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold gold-gradient-text mb-4">
            بازار لحظهای طلا
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            قیمت لحظهای انواع طلا و سکه با نمودار تغییرات. بروزرسانی خودکار
            هر ۱۰ ثانیه.
          </p>
          {lastUpdate && (
            <p className="text-xs text-muted-foreground mt-3">
              آخرین بروزرسانی: {lastUpdate}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {prices.map((item) => (
            <GoldPriceCard key={item.id} data={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

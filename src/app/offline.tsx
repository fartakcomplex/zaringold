'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto size-20 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center">
          <WifiOff className="size-10 text-[#D4AF37]" />
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-foreground mb-2">آفلاین هستید</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            اتصال اینترنت شما برقرار نیست. لطفاً اتصال خود را بررسی کرده و دوباره تلاش کنید.
          </p>
        </div>

        {/* Info Box */}
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed text-right">
              داده‌های اخیر شما به صورت محلی ذخیره شده‌اند. پس از اتصال مجدد، اطلاعات به‌روزرسانی خواهد شد.
            </p>
          </div>
        </div>

        {/* Retry Button */}
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] text-[#1a1a1a] px-8 py-3 text-sm font-bold hover:bg-[#E5C249] transition-all active:scale-95"
        >
          <RefreshCw className="size-4" />
          تلاش مجدد
        </button>

        {/* Footer */}
        <p className="text-[10px] text-muted-foreground/60">
          زرین گلد — پلتفرم معاملات طلای نوین
        </p>
      </div>
    </div>
  );
}

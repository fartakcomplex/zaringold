
import React from 'react';

/* ------------------------------------------------------------------ */
/*  MiniPriceTicker — Gold price marquee bar above bottom nav         */
/*  Mobile only (hidden on md+ breakpoints)                           */
/* ------------------------------------------------------------------ */

const TICKER_TEXT =
  '🥇 خرید: ۳۵,۶۲۰,۰۰۰  |  فروش: ۳۵,۴۸۰,۰۰۰  |  تغییر: +۱.۲٪  ◆  🥇 خرید: ۳۵,۶۲۰,۰۰۰  |  فروش: ۳۵,۴۸۰,۰۰۰  |  تغییر: +۱.۲٪';

export default function MiniPriceTicker() {
  return (
    <div className="fixed inset-x-0 bottom-[76px] z-40 md:hidden">
      <div className="ticker-gradient h-8 w-full overflow-hidden">
        <div className="ticker-marquee flex h-full items-center whitespace-nowrap">
          <span className="inline-flex items-center gap-6 px-4 text-xs font-medium tracking-wide">
            {/* Duplicate for seamless loop */}
            <span className="inline-flex items-center gap-1.5">
              <span className="text-gold-light">خرید:</span>
              <span className="text-white">۳۵,۶۲۰,۰۰۰</span>
            </span>
            <span className="text-gold/40">|</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-gold-light">فروش:</span>
              <span className="text-white">۳۵,۴۸۰,۰۰۰</span>
            </span>
            <span className="text-gold/40">|</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-gold-light">تغییر:</span>
              <span className="text-emerald-400 font-bold">+۱.۲٪</span>
              <svg
                className="size-3 text-emerald-400 rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
            <span className="text-gold/40">◆</span>

            {/* Second copy for seamless marquee */}
            <span className="inline-flex items-center gap-1.5">
              <span className="text-gold-light">خرید:</span>
              <span className="text-white">۳۵,۶۲۰,۰۰۰</span>
            </span>
            <span className="text-gold/40">|</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-gold-light">فروش:</span>
              <span className="text-white">۳۵,۴۸۰,۰۰۰</span>
            </span>
            <span className="text-gold/40">|</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-gold-light">تغییر:</span>
              <span className="text-emerald-400 font-bold">+۱.۲٪</span>
              <svg
                className="size-3 text-emerald-400 rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
            <span className="text-gold/40">◆</span>
          </span>
        </div>
      </div>
    </div>
  );
}

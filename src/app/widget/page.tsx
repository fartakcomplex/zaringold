'use client';

import React, { useState, useEffect } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Lightweight Embeddable Gold Price Widget                                   */
/*  This is a STANDALONE page — no dashboard layout                          */
/*  Supports: ?theme=dark|light & responsive (300px min)                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface WidgetData {
  price: number;
  buy: number;
  sell: number;
  change24h: number;
  currency: string;
  history: Array<{ price: number; time: string }>;
  updatedAt: string;
}

function formatTomanWidget(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
}

function formatNumberWidget(num: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(num));
}

/* ── SVG Sparkline (7-day trend) ── */
function SparklineChart({ data, isDark }: { data: number[]; isDark: boolean }) {
  if (data.length < 2) return null;
  const width = 200;
  const height = 48;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  const fillPoints = `0,${height} ${points} ${width},${height}`;
  const color = data[data.length - 1] >= data[0] ? '#10B981' : '#EF4444';
  const gradientId = 'sparkGradWidget';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: '48px' }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#${gradientId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={(data.length - 1) * step}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 8) - 4}
        r="3"
        fill={color}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Widget Component                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function WidgetPage() {
  const [data, setData] = useState<WidgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChart] = useState(true);

  // Theme from URL param or default dark
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('theme');
    if (t === 'light' || t === 'dark') setTheme(t);
  }, []);

  useEffect(() => {
    const fetchWidgetData = async () => {
      try {
        const res = await fetch('/api/widget');
        const json = await res.json();
        if (json.price) {
          setData(json);
        }
      } catch {
        // Fallback
        setData({
          price: 8_900_000,
          buy: 8_900_000,
          sell: 8_875_000,
          change24h: 0.35,
          currency: 'IRR',
          history: Array.from({ length: 7 }, () => ({
            price: 8_800_000 + Math.random() * 200_000,
            time: new Date().toISOString(),
          })),
          updatedAt: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchWidgetData();
    // Refresh every 60s
    const interval = setInterval(fetchWidgetData, 60000);
    return () => clearInterval(interval);
  }, []);

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const textColor = isDark ? '#e5e5e5' : '#1a1a1a';
  const mutedColor = isDark ? '#888888' : '#666666';
  const borderColor = isDark ? '#2a2a2a' : '#e5e7eb';
  const goldColor = '#D4AF37';
  const cardBg = isDark ? '#1a1a1a' : '#f9fafb';

  const isPositive = (data?.change24h ?? 0) >= 0;

  return (
    <div
      dir="rtl"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: 'var(--font-vazir), IRANSans, Vazir, system-ui, sans-serif',
        minWidth: '300px',
        maxWidth: '420px',
        margin: '0 auto',
        padding: '16px',
        borderRadius: '12px',
        border: `1px solid ${borderColor}`,
        boxSizing: 'border-box',
        direction: 'rtl',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '18px' }}>✦</span>
          <span style={{ color: goldColor, fontSize: '13px', fontWeight: 800 }}>زرین گلد</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
          <span style={{ fontSize: '10px', color: mutedColor }}>زنده</span>
        </div>
      </div>

      {/* Price Display */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '2px' }}>قیمت لحظه‌ای طلا</div>
        {isLoading || !data ? (
          <div style={{ height: '36px', width: '200px', backgroundColor: borderColor, borderRadius: '6px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ) : (
          <div style={{ fontSize: '28px', fontWeight: 900, color: goldColor, letterSpacing: '-0.5px', direction: 'rtl' }}>
            {formatTomanWidget(data.price)}
          </div>
        )}
      </div>

      {/* Change Percentage */}
      {data && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '4px 10px', borderRadius: '20px', marginBottom: '12px',
          backgroundColor: isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          color: isPositive ? '#10B981' : '#EF4444',
          fontSize: '12px', fontWeight: 700,
        }}>
          <span>{isPositive ? '▲' : '▼'}</span>
          <span>{isPositive ? '+' : ''}{formatNumberWidget(data.change24h)}%</span>
          <span style={{ fontSize: '10px', color: mutedColor, marginRight: '2px' }}>۲۴ ساعت</span>
        </div>
      )}

      {/* Sparkline Chart */}
      {showChart && data && data.history.length > 0 && (
        <div style={{
          backgroundColor: cardBg,
          borderRadius: '10px',
          padding: '10px',
          marginBottom: '12px',
          border: `1px solid ${borderColor}`,
        }}>
          <div style={{ fontSize: '10px', color: mutedColor, marginBottom: '6px' }}>روند ۷ روز اخیر</div>
          <SparklineChart
            data={data.history.map(h => h.price)}
            isDark={isDark}
          />
        </div>
      )}

      {/* Buy/Sell Prices */}
      {data && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', gap: '8px',
        }}>
          <div style={{
            flex: 1, backgroundColor: cardBg, borderRadius: '8px', padding: '10px',
            border: `1px solid ${borderColor}`, textAlign: 'center',
          }}>
            <div style={{ fontSize: '10px', color: mutedColor, marginBottom: '2px' }}>قیمت خرید</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: textColor, direction: 'rtl' }}>
              {formatTomanWidget(data.buy)}
            </div>
          </div>
          <div style={{
            flex: 1, backgroundColor: cardBg, borderRadius: '8px', padding: '10px',
            border: `1px solid ${borderColor}`, textAlign: 'center',
          }}>
            <div style={{ fontSize: '10px', color: mutedColor, marginBottom: '2px' }}>قیمت فروش</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: textColor, direction: 'rtl' }}>
              {formatTomanWidget(data.sell)}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        marginTop: '10px', paddingTop: '8px',
        borderTop: `1px solid ${borderColor}`,
      }}>
        <span style={{ fontSize: '9px', color: mutedColor }}>
          بروزرسانی: {data?.updatedAt ? new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date(data.updatedAt)) : '---'}
        </span>
      </div>
    </div>
  );
}

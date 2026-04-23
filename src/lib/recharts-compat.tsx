'use client';

import React from 'react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Recharts Compatibility Layer — Pure SVG/CSS replacements                 */
/*  This module provides drop-in replacements for recharts components.       */
/*  Charts are rendered as simple SVG visualizations.                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ResponsiveContainer — passes through children, fills parent */
export function ResponsiveContainer({ children, width, height, className }: {
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{ width: width || '100%', height: height || '100%', position: 'relative' }}
    >
      {children}
    </div>
  );
}

/* Tooltip — hidden (data shown in cards instead) */
export function Tooltip() { return null; }

/* XAxis, YAxis, CartesianGrid, Legend, ReferenceLine — no-ops */
export function XAxis() { return null; }
export function YAxis() { return null; }
export function CartesianGrid() { return null; }
export function Legend() { return null; }
export function ReferenceLine() { return null; }
export function LabelList() { return null; }

/* Cell — no-op (used inside Pie) */
export function Cell() { return null; }

/* ═══════════════════════════════════════════════════════════════ */
/*  AreaChart — SVG area chart                                         */
/* ═══════════════════════════════════════════════════════════════ */
export function AreaChart({ data, margin, children }: {
  data?: Array<Record<string, any>>;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  children?: React.ReactNode;
}) {
  if (!data || data.length === 0) return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">داده‌ای موجود نیست</div>;

  const m = { top: margin?.top || 5, right: margin?.right || 5, bottom: margin?.bottom || 5, left: margin?.left || 5 };
  
  // Extract Area children props
  const areaElements = React.Children.toArray(children).filter(
    (child: any) => child?.type?.name === 'AreaCompat' || child?.props?.dataKey
  );

  if (areaElements.length === 0) {
    // Fallback: try to find dataKey from children
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">نمودار</div>;
  }

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full">
      {areaElements.map((child: any, idx: number) => {
        const { dataKey, stroke, fill, strokeWidth } = child?.props || {};
        if (!dataKey) return null;
        
        const values = data.map((d: any) => typeof d[dataKey] === 'number' ? d[dataKey] : 0);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const range = maxVal - minVal || 1;
        
        const points = values.map((v: number, i: number) => {
          const x = (i / (values.length - 1)) * 100;
          const y = 40 - ((v - minVal) / range) * 35 - 2;
          return `${x},${y}`;
        });
        
        const linePath = `M${points.join(' L')}`;
        const areaPath = `${linePath} L100,40 L0,40 Z`;
        
        return (
          <g key={idx}>
            <path d={areaPath} fill={fill || 'rgba(212,175,55,0.1)'} />
            <path d={linePath} fill="none" stroke={stroke || '#D4AF37'} strokeWidth={strokeWidth || 0.5} />
          </g>
        );
      })}
    </svg>
  );
}

/* Area — collects props for AreaChart parent */
export function Area({ dataKey, stroke, fill, strokeWidth }: {
  dataKey?: string;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}) {
  // This component's props are read by AreaChart parent
  // It renders nothing itself
  return null;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  PieChart — CSS conic-gradient donut                                */
/* ═══════════════════════════════════════════════════════════════ */
export function PieChart({ children }: { children?: React.ReactNode }) {
  const pieElements = React.Children.toArray(children).filter(
    (child: any) => child?.props?.dataKey
  );

  // Get data from Pie child
  const pieChild = pieElements[0] as any;
  const data = pieChild?.props?.data || [];
  if (!data || data.length === 0) return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">بدون داده</div>;

  const total = data.reduce((s: number, d: any) => s + (d.value || 0), 0);
  let cumulative = 0;
  const stops: string[] = [];
  for (const d of data) {
    const start = cumulative;
    cumulative += ((d.value || 0) / total) * 100;
    stops.push(`${start}% ${cumulative}%`);
  }
  const conicStops = stops;

  const colors = data.map((d: any) => d.color || d.fill || '#D4AF37');

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="rounded-full"
        style={{
          background: `conic-gradient(${colors.map((c: string, i: number) => `${c} ${conicStops[i]}`).join(', ')})`,
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        <div className="absolute inset-[25%] rounded-full bg-card" />
      </div>
    </div>
  );
}

/* Pie — collects props for PieChart parent */
export function Pie({ data }: { data?: Array<Record<string, any>> }) {
  return null;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  BarChart — Simple CSS bar chart                                   */
/* ═══════════════════════════════════════════════════════════════ */
export function BarChart({ data, children }: {
  data?: Array<Record<string, any>>;
  children?: React.ReactNode;
}) {
  if (!data || data.length === 0) return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">بدون داده</div>;

  const barElements = React.Children.toArray(children).filter(
    (child: any) => child?.props?.dataKey
  );
  const barChild = barElements[0] as any;
  const dataKey = barChild?.props?.dataKey || 'value';
  const fill = barChild?.props?.fill || '#D4AF37';

  const values = data.map((d: any) => d[dataKey] || 0);
  const maxVal = Math.max(...values, 1);

  return (
    <div className="flex h-full w-full items-end gap-1 px-2">
      {values.map((v: number, i: number) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm transition-all"
          style={{
            height: `${(v / maxVal) * 100}%`,
            backgroundColor: fill,
            minHeight: '2px',
          }}
        />
      ))}
    </div>
  );
}

/* Bar — collects props for BarChart parent */
export function Bar({ dataKey, fill }: { dataKey?: string; fill?: string }) {
  return null;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  LineChart — SVG line chart                                        */
/* ═══════════════════════════════════════════════════════════════ */
export function LineChart({ data, children }: {
  data?: Array<Record<string, any>>;
  children?: React.ReactNode;
}) {
  if (!data || data.length === 0) return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">بدون داده</div>;

  const lineElements = React.Children.toArray(children).filter(
    (child: any) => child?.props?.dataKey
  );
  const lineChild = lineElements[0] as any;
  const dataKey = lineChild?.props?.dataKey || 'value';
  const stroke = lineChild?.props?.stroke || '#D4AF37';

  const values = data.map((d: any) => typeof d[dataKey] === 'number' ? d[dataKey] : 0);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const points = values.map((v: number, i: number) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 40 - ((v - minVal) / range) * 35 - 2;
    return `${x},${y}`;
  });

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full">
      <path d={"M" + points.join(" L")} fill="none" stroke={stroke} strokeWidth={0.5} />
    </svg>
  );
}

/* Line — collects props for LineChart parent */
export function Line({ dataKey, stroke }: { dataKey?: string; stroke?: string }) {
  return null;
}

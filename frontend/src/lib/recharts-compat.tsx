
import React, { useState, useRef, useCallback, useMemo } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Chart Constants                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

const GRID_COLOR = 'oklch(0.7 0.01 260 / 8%)';
const GRID_DASH = '3 6';
const AXIS_LABEL_COLOR = 'oklch(0.55 0.01 260)';
const AXIS_LABEL_SIZE = 10;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Utility: Smooth Catmull-Rom → Cubic Bezier interpolation                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getSmoothedPath(points: Array<{ x: number; y: number }>, tension = 0.35): string {
  if (points.length < 2) return '';
  if (points.length === 2) return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;

  let d = `M${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }

  return d;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Utility: SVG arc path for pie / donut slices                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, innerR: number, outerR: number, startAngle: number, endAngle: number) {
  if (endAngle - startAngle < 0.5) return '';

  const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  if (innerR <= 0) {
    return `M${cx},${cy} L${outerStart.x.toFixed(2)},${outerStart.y.toFixed(2)} A${outerR},${outerR} 0 ${largeArc},0 ${outerEnd.x.toFixed(2)},${outerEnd.y.toFixed(2)} Z`;
  }

  return [
    `M${outerStart.x.toFixed(2)},${outerStart.y.toFixed(2)}`,
    `A${outerR},${outerR} 0 ${largeArc},0 ${outerEnd.x.toFixed(2)},${outerEnd.y.toFixed(2)}`,
    `L${innerEnd.x.toFixed(2)},${innerEnd.y.toFixed(2)}`,
    `A${innerR},${innerR} 0 ${largeArc},1 ${innerStart.x.toFixed(2)},${innerStart.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Child extraction helpers                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function childrenByDN(children: React.ReactNode, dn: string): any[] {
  return React.Children.toArray(children).filter(
    (c: any) => c?.type?.displayName === dn || c?.type?.name === dn,
  );
}

function childByDN(children: React.ReactNode, dn: string): any {
  return childrenByDN(children, dn)[0] as any;
}

function isSvgEl(child: any, tag: string): boolean {
  return typeof child?.type === 'string' && child.type === tag;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ResponsiveContainer                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function ResponsiveContainer({ children, width, height, className }: {
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  className?: string;
}) {
  return (
    <div className={className} style={{ width: width || '100%', height: height || '100%', position: 'relative' }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Collector components — return null; parent reads their props               */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function XAxis(_props: any) { return null; }
export function YAxis(_props: any) { return null; }
export function CartesianGrid(_props: any) { return null; }
export function Legend() { return null; }
export function ReferenceLine() { return null; }
export function LabelList() { return null; }
export function Cell(_props: any) { return null; }
export function Area(_props: any) { return null; }
export function Bar(_props: any) { return null; }
export function Line(_props: any) { return null; }
export function Pie(_props: any) { return null; }
export function RadialBar(_props: any) { return null; }
export function Scatter(_props: any) { return null; }
export function Tooltip(_props: any) { return null; }

XAxis.displayName = 'XAxisCompat';
YAxis.displayName = 'YAxisCompat';
CartesianGrid.displayName = 'CartesianGridCompat';
Cell.displayName = 'CellCompat';
Area.displayName = 'AreaCompat';
Bar.displayName = 'BarCompat';
Line.displayName = 'LineCompat';
Pie.displayName = 'PieCompat';
RadialBar.displayName = 'RadialBarCompat';
Scatter.displayName = 'ScatterCompat';
Tooltip.displayName = 'TooltipCompat';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  AreaChart — Professional SVG Area Chart                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function AreaChart({ data, margin, children }: {
  data?: Array<Record<string, any>>;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  children?: React.ReactNode;
}) {
  /* ── All hooks MUST be called before any conditional returns ── */
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const safeData = data ?? [];

  const onMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || safeData.length < 2) { setHoverIdx(null); return; }
    const rect = svgRef.current.getBoundingClientRect();
    const W = 600;
    const mg = { l: margin?.left ?? 48, r: margin?.right ?? 12 };
    const pX = mg.l;
    const pW = W - mg.l - mg.r;
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < safeData.length; i++) {
      const sx = pX + (safeData.length === 1 ? pW / 2 : (i / (safeData.length - 1)) * pW);
      const d = Math.abs(sx - mx);
      if (d < bestD) { bestD = d; best = i; }
    }
    setHoverIdx(best);
  }, [safeData.length, margin?.left, margin?.right]);

  const onLeave = useCallback(() => setHoverIdx(null), []);

  /* ── Early return AFTER hooks ── */
  if (!data || data.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">داده‌ای موجود نیست</div>;
  }

  /* ── Extract children props ── */
  const xAxis = childByDN(children, 'XAxisCompat')?.props ?? {};
  const yAxis = childByDN(children, 'YAxisCompat')?.props ?? {};
  const grid = childByDN(children, 'CartesianGridCompat')?.props ?? {};
  const tooltipDef = childByDN(children, 'TooltipCompat')?.props ?? {};
  const areas = childrenByDN(children, 'AreaCompat').map((c: any) => c.props);
  const defsNodes = React.Children.toArray(children).filter((c: any) => isSvgEl(c, 'defs'));

  const xDataKey = xAxis.dataKey;
  const primaryDataKey = areas[0]?.dataKey || 'value';
  const yTickFmt = yAxis.tickFormatter;
  const xLabelStep = xAxis.interval === 'preserveStartEnd'
    ? Math.max(1, Math.ceil(data.length / 7))
    : typeof xAxis.interval === 'number'
      ? xAxis.interval
      : Math.max(1, Math.ceil(data.length / 7));

  /* ── Viewbox & plot area ── */
  const W = 600;
  const H = 260;
  const mg = { t: margin?.top ?? 8, r: margin?.right ?? 12, b: margin?.bottom ?? 28, l: margin?.left ?? 48 };
  const pX = mg.l;
  const pY = mg.t;
  const pW = W - mg.l - mg.r;
  const pH = H - mg.t - mg.b;

  /* ── Data range ── */
  const allValues: number[] = [];
  areas.forEach((a: any) => {
    data.forEach((d) => { const v = typeof d[a.dataKey] === 'number' ? d[a.dataKey] : 0; allValues.push(v); });
  });
  let minV = Math.min(...allValues);
  let maxV = Math.max(...allValues);
  const range = maxV - minV || 1;
  const pad = range * 0.08;
  minV -= pad;
  maxV += pad;

  const toSvgX = (i: number) => pX + (data.length === 1 ? pW / 2 : (i / (data.length - 1)) * pW);
  const toSvgY = (v: number) => pY + pH - ((v - minV) / (maxV - minV)) * pH;
  const fmtY = (v: number) => yTickFmt ? yTickFmt(v) : v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v);

  const gridN = 5;
  const showHGrid = grid.vertical === false || grid.horizontal !== false;

  /* ── Tooltip ── */
  const tooltipContent = tooltipDef.content;
  let tooltipEl: React.ReactNode = null;
  if (hoverIdx !== null && tooltipContent && React.isValidElement(tooltipContent)) {
    const px = toSvgX(hoverIdx);
    const py = toSvgY(data[hoverIdx][primaryDataKey]);
    const payload = areas.map((a: any) => ({ value: data[hoverIdx][a.dataKey], dataKey: a.dataKey }));
    const cloned = React.cloneElement(tooltipContent as React.ReactElement<any>, {
      active: true,
      payload,
      label: data[hoverIdx][xDataKey || 'label' as keyof typeof data[0]] || '',
    });
    tooltipEl = (
      <div
        className="pointer-events-none absolute z-50 transition-all duration-100"
        style={{ left: `${(px / W) * 100}%`, top: `${(py / H) * 100}%`, transform: 'translate(-50%, -110%)' }}
      >
        {cloned}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        {defsNodes}

        {showHGrid && Array.from({ length: gridN }).map((_, i) => {
          const y = pY + (i / (gridN - 1)) * pH;
          return (
            <line key={`g${i}`} x1={pX} y1={y} x2={pX + pW} y2={y}
              stroke={grid.stroke || GRID_COLOR} strokeDasharray={grid.strokeDasharray || GRID_DASH} strokeWidth={0.5} />
          );
        })}

        {Array.from({ length: gridN }).map((_, i) => {
          const y = pY + (i / (gridN - 1)) * pH;
          const val = maxV - (i / (gridN - 1)) * (maxV - minV);
          return (
            <text key={`yl${i}`} x={pX - 6} y={y + 3.5} textAnchor="end"
              fill={yAxis.tick?.fill || AXIS_LABEL_COLOR}
              fontSize={yAxis.tick?.fontSize || AXIS_LABEL_SIZE}
              fontFamily="var(--font-vazir), IRANSans, system-ui, sans-serif">
              {fmtY(val)}
            </text>
          );
        })}

        {data.map((d, i) => {
          if (i % xLabelStep !== 0 && i !== data.length - 1) return null;
          return (
            <text key={`xl${i}`} x={toSvgX(i)} y={pY + pH + 18} textAnchor="middle"
              fill={xAxis.tick?.fill || AXIS_LABEL_COLOR}
              fontSize={xAxis.tick?.fontSize || AXIS_LABEL_SIZE}
              fontFamily="var(--font-vazir), IRANSans, system-ui, sans-serif">
              {String(d[xDataKey || 'label' as keyof typeof d] || '')}
            </text>
          );
        })}

        {hoverIdx !== null && (
          <line x1={toSvgX(hoverIdx)} y1={pY} x2={toSvgX(hoverIdx)} y2={pY + pH}
            stroke={areas[0]?.stroke || '#D4AF37'} strokeWidth={0.6} strokeDasharray="3 3" opacity={0.35} />
        )}

        {areas.map((a: any, si: number) => {
          const dk = a.dataKey || 'value';
          const stroke = a.stroke || '#D4AF37';
          const sw = a.strokeWidth || 2.5;
          const fill = a.fill || 'rgba(212,175,55,0.12)';
          const showDot = a.dot !== false;

          const pts = data.map((d, i) => ({ x: toSvgX(i), y: toSvgY(d[dk]) }));
          const linePath = getSmoothedPath(pts);
          const areaPath = `${linePath} L${pts[pts.length - 1].x},${pY + pH} L${pts[0].x},${pY + pH} Z`;

          return (
            <g key={si}>
              <path d={areaPath} fill={fill} className="transition-opacity duration-300" />
              <path d={linePath} fill="none" stroke={stroke} strokeWidth={sw}
                strokeLinecap="round" strokeLinejoin="round" className="transition-opacity duration-300" />
              {showDot && pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y}
                  r={hoverIdx === i ? 4.5 : 2}
                  fill={hoverIdx === i ? stroke : 'var(--card, #fff)'}
                  stroke={stroke} strokeWidth={hoverIdx === i ? 2 : 1.5}
                  opacity={hoverIdx === i ? 1 : 0.6}
                  className="transition-all duration-150" />
              ))}
              {hoverIdx !== null && (
                <circle cx={pts[hoverIdx]?.x} cy={pts[hoverIdx]?.y} r={8}
                  fill={stroke} opacity={0.12} className="transition-opacity duration-150" />
              )}
            </g>
          );
        })}
      </svg>

      {tooltipEl}
    </div>
  );
}
AreaChart.displayName = 'AreaChartCompat';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PieChart — Professional SVG Donut Chart                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function PieChart({ children }: { children?: React.ReactNode }) {
  /* ── All hooks FIRST ── */
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const pieChild = childByDN(children, 'PieCompat');
  const tooltipDef = childByDN(children, 'TooltipCompat')?.props ?? {};
  const cells = childrenByDN(children, 'CellCompat');
  const pieData = pieChild?.props?.data;
  const hasData = Array.isArray(pieData) && pieData.length > 0;

  const onLeave = useCallback(() => setActiveIdx(null), []);

  const onMove = useCallback((_e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !hasData) return;
    const pd = pieChild?.props;
    const dk = pd?.dataKey || 'value';
    const irPct = pd?.innerRadius ?? 0;
    const orPct = pd?.outerRadius ?? 100;
    const pa = pd?.paddingAngle ?? 0;
    const d = pd?.data;
    if (!Array.isArray(d) || d.length === 0) return;

    const W = 200;
    const H = 200;
    const cx = W / 2;
    const cy = H / 2;
    const maxR = Math.min(W, H) / 2 - 4;
    const outerR = Math.max(10, maxR * (orPct / 100));
    const innerR = Math.max(0, maxR * (irPct / 100));

    const total = d.reduce((s: number, item: any) => s + (item[dk] || 0), 0);
    if (total <= 0) return;

    const rect = svgRef.current.getBoundingClientRect();
    const sx = W / rect.width;
    const sy = H / rect.height;
    const mx = (_e.clientX - rect.left) * sx;
    const my = (_e.clientY - rect.top) * sy;
    const dx = mx - cx;
    const dy = my - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < innerR || dist > outerR) { setActiveIdx(null); return; }

    let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;

    let startAngle = -90;
    let found = -1;
    for (let i = 0; i < d.length; i++) {
      const span = ((d[i][dk] || 0) / total) * 360;
      const s = startAngle + pa / 2;
      const en = startAngle + span - pa / 2;
      startAngle += span;
      const a = angle >= 270 ? angle - 360 : angle;
      if (a >= s && a <= en) { found = i; break; }
    }
    setActiveIdx(found >= 0 ? found : null);
  }, [hasData, pieChild?.props]);

  /* ── Early return AFTER hooks ── */
  if (!hasData) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">بدون داده</div>;
  }

  const { data, dataKey = 'value', innerRadius: irPct = 0, outerRadius: orPct = 100, paddingAngle = 0, stroke = 'var(--card, #fff)', strokeWidth: sw = 2 } = pieChild.props;

  const total = data.reduce((s: number, d: any) => s + (d[dataKey] || 0), 0);
  if (total <= 0) return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">بدون داده</div>;

  const W = 200;
  const H = 200;
  const cx = W / 2;
  const cy = H / 2;
  const maxR = Math.min(W, H) / 2 - 4;
  const outerR = Math.max(10, maxR * (orPct / 100));
  const innerR = Math.max(0, maxR * (irPct / 100));

  /* Build slices with reduce to avoid mutation */
  const slices = data.reduce<Array<{ path: string; color: string; val: number; name: string; mid: number }>>((acc, d: any, i: number) => {
    const val = d[dataKey] || 0;
    const span = (val / total) * 360;
    const prevEnd = acc.length > 0 ? acc[acc.length - 1].mid + span / 2 : -90 - paddingAngle / 2;
    const start = prevEnd + paddingAngle;
    const end = prevEnd + span;
    const color = cells[i]?.props?.fill || d.color || d.fill || '#D4AF37';
    acc.push({ path: describeArc(cx, cy, innerR, outerR, start, end), color, val, name: d.name || '', mid: start + (end - start) / 2 });
    return acc;
  }, []);

  /* Tooltip */
  const tooltipContent = tooltipDef.content;
  let tooltipEl: React.ReactNode = null;
  if (activeIdx !== null && tooltipContent && React.isValidElement(tooltipContent)) {
    const d = data[activeIdx];
    const cloned = React.cloneElement(tooltipContent as React.ReactElement<any>, {
      active: true,
      payload: [{ name: d.name, value: d[dataKey] }],
    });
    tooltipEl = (
      <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
        <div className="translate-y-[-110%]">{cloned}</div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
        className="h-full w-full" onMouseMove={onMove} onMouseLeave={onLeave}>
        {slices.map((s, i) => {
          if (!s.path) return null;
          const isActive = activeIdx === i;
          const midRad = ((s.mid - 90) * Math.PI) / 180;
          const tx = isActive ? Math.cos(midRad) * 4 : 0;
          const ty = isActive ? Math.sin(midRad) * 4 : 0;
          return (
            <g key={i} style={{ transform: `translate(${tx}px, ${ty}px)`, transition: 'transform 0.2s ease-out' }}>
              <path d={s.path} fill={s.color} stroke={stroke} strokeWidth={sw}
                className="transition-all duration-200"
                style={{ filter: isActive ? 'brightness(1.12) drop-shadow(0 2px 8px rgba(0,0,0,0.15))' : 'none' }} />
            </g>
          );
        })}
      </svg>
      {tooltipEl}
    </div>
  );
}
PieChart.displayName = 'PieChartCompat';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  BarChart — Professional CSS Bar Chart                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function BarChart({ data, layout, children }: {
  data?: Array<Record<string, any>>;
  layout?: string;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  children?: React.ReactNode;
}) {
  if (!data || data.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">بدون داده</div>;
  }

  const bars = childrenByDN(children, 'BarCompat').map((c: any) => c.props);
  const xAxis = childByDN(children, 'XAxisCompat')?.props ?? {};
  const yAxis = childByDN(children, 'YAxisCompat')?.props ?? {};
  const allCellArrays = childrenByDN(children, 'CellCompat');

  const isHorizontal = layout === 'vertical';
  const primaryDK = bars[0]?.dataKey || 'value';
  const catKey = isHorizontal ? (yAxis.dataKey || 'type') : (xAxis.dataKey || 'name');

  const allValues: number[] = [];
  bars.forEach((b: any) => data.forEach((d: any) => allValues.push(d[b.dataKey] || 0)));
  const maxVal = Math.max(...allValues, 1);

  const fmtVal = (v: number): string => {
    if (xAxis.tickFormatter) return xAxis.tickFormatter(v);
    if (yAxis.tickFormatter) return yAxis.tickFormatter(v);
    if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
    return String(v);
  };

  const getBarColor = (barIdx: number, dataIdx: number): string => {
    const cellIdx = dataIdx * bars.length + barIdx;
    const cell = allCellArrays[cellIdx];
    if (cell?.props?.fill) return cell.props.fill;
    return data[dataIdx]?.color || bars[barIdx]?.fill || '#D4AF37';
  };

  const radiusArr = (barIdx: number): [number, number, number, number] => {
    const r = bars[barIdx]?.radius;
    if (Array.isArray(r)) return r as [number, number, number, number];
    if (typeof r === 'number') return [r, r, r, r];
    return isHorizontal ? [0, 6, 6, 0] : [6, 6, 0, 0];
  };

  if (isHorizontal) {
    return (
      <div className="flex h-full w-full flex-col justify-center gap-2.5 px-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="w-[70px] shrink-0 text-right text-[11px] font-medium tabular-nums"
              style={{ color: yAxis.tick?.fill || AXIS_LABEL_COLOR, fontSize: yAxis.tick?.fontSize || 11 }}>
              {String(d[catKey] || '')}
            </span>
            <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-muted/30">
              {bars.map((b: any, bi: number) => {
                const val = d[b.dataKey] || 0;
                const wPct = (val / maxVal) * 100;
                const r = radiusArr(bi);
                const color = getBarColor(bi, i);
                return (
                  <div key={bi} className="absolute inset-y-0 right-0 flex items-center" style={{ width: `${wPct}%` }}>
                    <div className="h-full w-full rounded-lg transition-all duration-700 ease-out"
                      style={{
                        background: `linear-gradient(90deg, ${color}cc, ${color})`,
                        borderRadius: `${r[0]}px ${r[1]}px ${r[2]}px ${r[3]}px`,
                        boxShadow: `0 0 16px ${color}18`,
                      }} />
                  </div>
                );
              })}
              <span className="absolute inset-y-0 right-2 flex items-center text-[10px] font-bold tabular-nums text-foreground/60">
                {fmtVal(d[primaryDK])}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* Vertical */
  return (
    <div className="flex h-full w-full items-end gap-1 px-1 pb-6 pt-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex w-full items-end" style={{ gap: '2px' }}>
            {bars.map((b: any, bi: number) => {
              const val = d[b.dataKey] || 0;
              const hPct = (val / maxVal) * 100;
              const r = radiusArr(bi);
              const color = getBarColor(bi, i);
              return (
                <div key={bi} className="flex-1 transition-all duration-700 ease-out hover:brightness-110"
                  style={{
                    height: `${hPct}%`,
                    background: `linear-gradient(180deg, ${color}ee, ${color}88)`,
                    borderRadius: `${r[0]}px ${r[1]}px ${r[2]}px ${r[3]}px`,
                    minHeight: '3px',
                    boxShadow: `0 0 10px ${color}12`,
                  }} />
              );
            })}
          </div>
          {(i % Math.max(1, Math.ceil(data.length / 8)) === 0 || i === data.length - 1) && (
            <span className="text-[9px] whitespace-nowrap"
              style={{ color: xAxis.tick?.fill || AXIS_LABEL_COLOR, fontSize: xAxis.tick?.fontSize || 9 }}>
              {String(d[catKey] || '')}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
BarChart.displayName = 'BarChartCompat';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  LineChart — Professional SVG Line Chart                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function LineChart({ data, children }: {
  data?: Array<Record<string, any>>;
  children?: React.ReactNode;
}) {
  if (!data || data.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">بدون داده</div>;
  }

  const lines = childrenByDN(children, 'LineCompat').map((c: any) => c.props);
  if (lines.length === 0) return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">بدون داده</div>;

  const W = 500;
  const H = 220;
  const mg = { t: 10, r: 12, b: 28, l: 48 };
  const pW = W - mg.l - mg.r;
  const pH = H - mg.t - mg.b;

  const allVals: number[] = [];
  lines.forEach((l: any) => data.forEach((d: any) => allVals.push(typeof d[l.dataKey] === 'number' ? d[l.dataKey] : 0)));
  let minV = Math.min(...allVals);
  let maxV = Math.max(...allVals);
  const rng = maxV - minV || 1;
  minV -= rng * 0.08;
  maxV += rng * 0.08;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full">
      {Array.from({ length: 5 }).map((_, i) => {
        const y = mg.t + (i / 4) * pH;
        return <line key={i} x1={mg.l} y1={y} x2={mg.l + pW} y2={y} stroke={GRID_COLOR} strokeDasharray={GRID_DASH} strokeWidth={0.5} />;
      })}
      {Array.from({ length: 5 }).map((_, i) => {
        const y = mg.t + (i / 4) * pH;
        const v = maxV - (i / 4) * (maxV - minV);
        return (
          <text key={i} x={mg.l - 6} y={y + 3.5} textAnchor="end" fill={AXIS_LABEL_COLOR} fontSize={AXIS_LABEL_SIZE}>
            {v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v)}
          </text>
        );
      })}
      {lines.map((l: any, li: number) => {
        const pts = data.map((d: any, i: number) => ({
          x: mg.l + (data.length === 1 ? pW / 2 : (i / (data.length - 1)) * pW),
          y: mg.t + pH - (((d[l.dataKey] || 0) - minV) / (maxV - minV)) * pH,
        }));
        return (
          <g key={li}>
            <path d={getSmoothedPath(pts)} fill="none" stroke={l.stroke || '#D4AF37'}
              strokeWidth={l.strokeWidth || 2.5} strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={l.stroke || '#D4AF37'} opacity={0.7} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
LineChart.displayName = 'LineChartCompat';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  No-op charts                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function RadialBarChart(_props: { children?: React.ReactNode }) {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">راداری</div>;
}
RadialBarChart.displayName = 'RadialBarChartCompat';

export function ScatterChart(_props: { children?: React.ReactNode }) {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">پراکندگی</div>;
}
ScatterChart.displayName = 'ScatterChartCompat';

export function ComposedChart(_props: { children?: React.ReactNode }) {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">ترکیبی</div>;
}
ComposedChart.displayName = 'ComposedChartCompat';

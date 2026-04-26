/* ═══════════════════════════════════════════════════════════════════════════
 *  metrics.ts — Prometheus-Compatible Metrics Collector
 *  Counter · Histogram · Gauge · Custom labels
 *  Lightweight — zero dependencies — Prometheus text format output
 * ═══════════════════════════════════════════════════════════════════════════ */

// ─── Types ─────────────────────────────────────────────────────────────────

export type LabelValues = Record<string, string>;

export interface MetricBase {
  name: string;
  help: string;
  labelNames: string[];
}

export interface CounterMetric extends MetricBase {
  type: 'counter';
  valueByLabels: Map<string, number>;
}

export interface HistogramMetric extends MetricBase {
  type: 'histogram';
  /** Configured bucket boundaries (ms for timing, bytes for size, etc.) */
  buckets: number[];
  /** Map of "labelKey|bucket" → count */
  counts: Map<string, number>;
  /** Map of "labelKey|_sum" → sum; "labelKey|_count" → count */
  sums: Map<string, number>;
  countsByLabel: Map<string, number>;
}

export interface GaugeMetric extends MetricBase {
  type: 'gauge';
  valueByLabels: Map<string, number>;
}

export type Metric = CounterMetric | HistogramMetric | GaugeMetric;

// ─── Default Histogram Buckets (ms) ────────────────────────────────────────

const DEFAULT_LATENCY_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
const DEFAULT_SIZE_BUCKETS = [100, 500, 1000, 5000, 10000, 50000, 100000];

// ─── Counter ───────────────────────────────────────────────────────────────

export class Counter {
  readonly name: string;
  readonly help: string;
  readonly labelNames: string[];
  private values = new Map<string, number>();

  constructor(name: string, help: string, labelNames: string[] = []) {
    this.name = name;
    this.help = help;
    this.labelNames = labelNames;
  }

  private labelKey(labels: LabelValues = {}): string {
    return this.labelNames
      .map(n => `${n}="${labels[n] ?? ''}"`)
      .join(',');
  }

  inc(labels: LabelValues = {}, value: number = 1): void {
    const key = this.labelKey(labels);
    this.values.set(key, (this.values.get(key) ?? 0) + value);
  }

  get(labels: LabelValues = {}): number {
    return this.values.get(this.labelKey(labels)) ?? 0;
  }

  reset(): void {
    this.values.clear();
  }

  /** Serialize to Prometheus format */
  serialize(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.name} ${this.help}`);
    lines.push(`# TYPE ${this.name} counter`);
    for (const [key, value] of this.values.entries()) {
      const suffix = key ? `{${key}}` : '';
      lines.push(`${this.name}${suffix} ${value}`);
    }
    return lines.join('\n');
  }
}

// ─── Histogram ─────────────────────────────────────────────────────────────

export class Histogram {
  readonly name: string;
  readonly help: string;
  readonly labelNames: string[];
  readonly buckets: number[];
  private bucketsCounts = new Map<string, number[]>();
  private sums = new Map<string, number>();
  private counts = new Map<string, number>();

  constructor(
    name: string,
    help: string,
    buckets: number[] = DEFAULT_LATENCY_BUCKETS,
    labelNames: string[] = []
  ) {
    this.name = name;
    this.help = help;
    this.buckets = buckets;
    this.labelNames = labelNames;
  }

  private labelKey(labels: LabelValues = {}): string {
    return this.labelNames
      .map(n => `${n}="${labels[n] ?? ''}"`)
      .join(',');
  }

  observe(value: number, labels: LabelValues = {}): void {
    const key = this.labelKey(labels);
    const arr = this.bucketsCounts.get(key) ?? new Array(this.buckets.length).fill(0);
    for (let i = 0; i < this.buckets.length; i++) {
      if (value <= this.buckets[i]) arr[i]++;
    }
    this.bucketsCounts.set(key, arr);
    this.sums.set(key, (this.sums.get(key) ?? 0) + value);
    this.counts.set(key, (this.counts.get(key) ?? 0) + 1);
  }

  /** Start a timer, returns a function that records elapsed ms */
  startTimer(labels: LabelValues = {}): () => void {
    const start = performance.now();
    return () => {
      const elapsed = Math.round(performance.now() - start);
      this.observe(elapsed, labels);
    };
  }

  getPercentile(labels: LabelValues = {}, percentile: number): number {
    // Approximate percentile from buckets
    const key = this.labelKey(labels);
    const count = this.counts.get(key) ?? 0;
    if (count === 0) return 0;
    const target = Math.ceil(count * percentile / 100);
    let cumulative = 0;
    const arr = this.bucketsCounts.get(key);
    if (!arr) return 0;
    for (let i = 0; i < this.buckets.length; i++) {
      cumulative += arr[i];
      if (cumulative >= target) return this.buckets[i];
    }
    return this.buckets[this.buckets.length - 1];
  }

  reset(): void {
    this.bucketsCounts.clear();
    this.sums.clear();
    this.counts.clear();
  }

  serialize(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.name} ${this.help}`);
    lines.push(`# TYPE ${this.name} histogram`);

    // Collect all label keys
    const keys = new Set<string>();
    for (const [k] of this.bucketsCounts.entries()) keys.add(k);
    for (const [k] of this.sums.entries()) keys.add(k);
    for (const [k] of this.counts.entries()) keys.add(k);

    for (const key of keys) {
      const suffix = key ? `{${key},` : '{';
      const closingSuffix = key ? '}' : '}';

      const arr = this.bucketsCounts.get(key) ?? [];
      let cumulative = 0;
      for (let i = 0; i < this.buckets.length; i++) {
        cumulative += arr[i] ?? 0;
        const le = this.buckets[i];
        lines.push(`${this.name}_bucket${suffix}le="${le}"${closingSuffix} ${cumulative}`);
      }
      // +Inf bucket
      const total = this.counts.get(key) ?? 0;
      lines.push(`${this.name}_bucket${suffix}le="+Inf"${closingSuffix} ${total}`);
      lines.push(`${this.name}_sum${suffix}${closingSuffix} ${this.sums.get(key) ?? 0}`);
      lines.push(`${this.name}_count${suffix}${closingSuffix} ${total}`);
    }

    return lines.join('\n');
  }
}

// ─── Gauge ─────────────────────────────────────────────────────────────────

export class Gauge {
  readonly name: string;
  readonly help: string;
  readonly labelNames: string[];
  private values = new Map<string, number>();

  constructor(name: string, help: string, labelNames: string[] = []) {
    this.name = name;
    this.help = help;
    this.labelNames = labelNames;
  }

  private labelKey(labels: LabelValues = {}): string {
    return this.labelNames
      .map(n => `${n}="${labels[n] ?? ''}"`)
      .join(',');
  }

  set(value: number, labels: LabelValues = {}): void {
    this.values.set(this.labelKey(labels), value);
  }

  inc(labels: LabelValues = {}, value: number = 1): void {
    const key = this.labelKey(labels);
    this.values.set(key, (this.values.get(key) ?? 0) + value);
  }

  dec(labels: LabelValues = {}, value: number = 1): void {
    const key = this.labelKey(labels);
    this.values.set(key, (this.values.get(key) ?? 0) - value);
  }

  get(labels: LabelValues = {}): number {
    return this.values.get(this.labelKey(labels)) ?? 0;
  }

  reset(): void {
    this.values.clear();
  }

  serialize(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.name} ${this.help}`);
    lines.push(`# TYPE ${this.name} gauge`);
    for (const [key, value] of this.values.entries()) {
      const suffix = key ? `{${key}}` : '';
      lines.push(`${this.name}${suffix} ${value}`);
    }
    return lines.join('\n');
  }
}

// ─── Metrics Registry ──────────────────────────────────────────────────────

class MetricsRegistry {
  private counters = new Map<string, Counter>();
  private histograms = new Map<string, Histogram>();
  private gauges = new Map<string, Gauge>();
  private processStartTime = Date.now();

  // ─── Registration ────────────────────────────────────────────────

  registerCounter(name: string, help: string, labelNames: string[] = []): Counter {
    let counter = this.counters.get(name);
    if (!counter) {
      counter = new Counter(name, help, labelNames);
      this.counters.set(name, counter);
    }
    return counter;
  }

  registerHistogram(
    name: string,
    help: string,
    buckets?: number[],
    labelNames: string[] = []
  ): Histogram {
    let histogram = this.histograms.get(name);
    if (!histogram) {
      histogram = new Histogram(name, help, buckets, labelNames);
      this.histograms.set(name, histogram);
    }
    return histogram;
  }

  registerGauge(name: string, help: string, labelNames: string[] = []): Gauge {
    let gauge = this.gauges.get(name);
    if (!gauge) {
      gauge = new Gauge(name, help, labelNames);
      this.gauges.set(name, gauge);
    }
    return gauge;
  }

  // ─── Getters ────────────────────────────────────────────────────

  getCounter(name: string): Counter | undefined {
    return this.counters.get(name);
  }

  getHistogram(name: string): Histogram | undefined {
    return this.histograms.get(name);
  }

  getGauge(name: string): Gauge | undefined {
    return this.gauges.get(name);
  }

  // ─── Prometheus Output ──────────────────────────────────────────

  serialize(): string {
    const sections: string[] = [];

    for (const counter of this.counters.values()) {
      sections.push(counter.serialize());
    }
    for (const histogram of this.histograms.values()) {
      sections.push(histogram.serialize());
    }
    for (const gauge of this.gauges.values()) {
      sections.push(gauge.serialize());
    }

    // Process metrics
    const uptime = Math.floor((Date.now() - this.processStartTime) / 1000);
    const memUsage = process.memoryUsage();

    sections.push(
      '# HELP process_uptime_seconds Process uptime in seconds',
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${uptime}`,
      '',
      '# HELP process_memory_usage_bytes Process memory usage',
      '# TYPE process_memory_usage_bytes gauge',
      `process_memory_usage_bytes{type="rss"} ${memUsage.rss}`,
      `process_memory_usage_bytes{type="heap_used"} ${memUsage.heapUsed}`,
      `process_memory_usage_bytes{type="heap_total"} ${memUsage.heapTotal}`,
      `process_memory_usage_bytes{type="external"} ${memUsage.external}`,
    );

    return sections.filter(Boolean).join('\n\n');
  }

  /** Reset all metrics */
  resetAll(): void {
    for (const c of this.counters.values()) c.reset();
    for (const h of this.histograms.values()) h.reset();
    for (const g of this.gauges.values()) g.reset();
  }
}

// ─── Singleton Registry ────────────────────────────────────────────────────

export const metrics = new MetricsRegistry();

// ─── Pre-registered Application Metrics ────────────────────────────────────

/** HTTP request counter: method, route, status */
export const httpRequestTotal = metrics.registerCounter(
  'http_requests_total',
  'Total HTTP requests',
  ['method', 'route', 'status']
);

/** HTTP request duration histogram: method, route */
export const httpRequestDurationMs = metrics.registerHistogram(
  'http_request_duration_ms',
  'HTTP request duration in milliseconds',
  DEFAULT_LATENCY_BUCKETS,
  ['method', 'route']
);

/** HTTP requests currently being processed */
export const httpRequestsInProgress = metrics.registerGauge(
  'http_requests_in_progress',
  'HTTP requests currently being processed',
  ['method', 'route']
);

/** Active connections gauge */
export const activeConnectionsGauge = metrics.registerGauge(
  'active_connections',
  'Number of active connections',
  ['service']
);

/** Cache hit/miss counter */
export const cacheOperationsTotal = metrics.registerCounter(
  'cache_operations_total',
  'Cache operations',
  ['operation', 'cache']
);

/** Error counter: service, error_type */
export const errorTotal = metrics.registerCounter(
  'errors_total',
  'Total errors',
  ['service', 'error_type']
);

/** Circuit breaker state: service, state */
export const circuitBreakerState = metrics.registerGauge(
  'circuit_breaker_state',
  'Circuit breaker state (0=CLOSED, 1=HALF_OPEN, 2=OPEN)',
  ['service']
);

/** Business event counter: event_type */
export const businessEventsTotal = metrics.registerCounter(
  'business_events_total',
  'Business events',
  ['event_type', 'status']
);

/** Gold trading metrics */
export const goldTradesTotal = metrics.registerCounter(
  'gold_trades_total',
  'Gold trades',
  ['type', 'status']
);

/** Gold trade amount histogram */
export const goldTradeAmount = metrics.registerHistogram(
  'gold_trade_amount_grams',
  'Gold trade amount in grams',
  [0.001, 0.01, 0.1, 0.5, 1, 5, 10, 50, 100],
  ['type']
);

/** Queue length gauge */
export const queueLengthGauge = metrics.registerGauge(
  'queue_length',
  'Current queue length',
  ['queue']
);

/** Rate limit counter */
export const rateLimitTotal = metrics.registerCounter(
  'rate_limit_total',
  'Rate limit events',
  ['path', 'action']
);

/** Wallet operations counter */
export const walletOperationsTotal = metrics.registerCounter(
  'wallet_operations_total',
  'Wallet operations',
  ['type', 'status']
);

/* ═══════════════════════════════════════════════════════════════════════════
 *  tracer.ts — Distributed Tracing (Lightweight, no heavy deps)
 *  Request tracing with correlation IDs · Span creation · Context propagation
 *  OpenTelemetry-compatible concepts without the dependency overhead
 * ═══════════════════════════════════════════════════════════════════════════ */

// ─── Types ─────────────────────────────────────────────────────────────────

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  traceFlags: number; // 0x01 = sampled
  traceState?: string;
}

export interface SpanData {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: 'INTERNAL' | 'CLIENT' | 'SERVER' | 'PRODUCER' | 'CONSUMER';
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status: 'ok' | 'error' | 'unset';
  attributes: Record<string, string | number | boolean>;
  events: SpanEvent[];
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, string | number | boolean>;
}

export type SpanKind = SpanData['kind'];

export interface TracerConfig {
  /** Service name for traces */
  serviceName: string;
  /** Max number of completed traces to keep in memory */
  maxTracesInMemory: number;
  /** Whether tracing is enabled */
  enabled: boolean;
  /** Default sampling rate (0.0 - 1.0) */
  sampleRate: number;
}

// ─── ID Generation ─────────────────────────────────────────────────────────

function generateTraceId(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSpanId(): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Span Class ────────────────────────────────────────────────────────────

export class Span {
  readonly data: SpanData;
  private ended = false;

  constructor(
    readonly name: string,
    private tracer: Tracer,
    private parentSpan?: Span,
    kind: SpanKind = 'INTERNAL',
    private initialAttributes: Record<string, string | number | boolean> = {}
  ) {
    this.data = {
      traceId: parentSpan?.data.traceId ?? generateTraceId(),
      spanId: generateSpanId(),
      parentSpanId: parentSpan?.data.spanId,
      name,
      kind,
      startTime: Date.now(),
      status: 'unset',
      attributes: { ...initialAttributes },
      events: [],
    };
  }

  /** Set a span attribute */
  setAttribute(key: string, value: string | number | boolean): Span {
    if (!this.ended) {
      this.data.attributes[key] = value;
    }
    return this;
  }

  /** Set multiple attributes */
  setAttributes(attrs: Record<string, string | number | boolean>): Span {
    if (!this.ended) {
      Object.assign(this.data.attributes, attrs);
    }
    return this;
  }

  /** Add an event to the span */
  addEvent(name: string, attributes?: Record<string, string | number | boolean>): Span {
    if (!this.ended) {
      this.data.events.push({
        name,
        timestamp: Date.now(),
        attributes,
      });
    }
    return this;
  }

  /** Set span status */
  setStatus(status: 'ok' | 'error', message?: string): Span {
    this.data.status = status;
    if (message) {
      this.data.attributes['status.message'] = message;
    }
    return this;
  }

  /** Record an error on this span */
  recordError(error: Error): Span {
    this.setStatus('error');
    this.addEvent('exception', {
      'exception.type': error.name,
      'exception.message': error.message,
      'exception.stacktrace': error.stack ?? '',
    });
    return this;
  }

  /** Create a child span */
  startChild(name: string, kind?: SpanKind, attributes?: Record<string, string | number | boolean>): Span {
    return this.tracer.startSpan(name, this, kind, attributes);
  }

  /** Get trace context for propagation */
  getTraceContext(): TraceContext {
    return {
      traceId: this.data.traceId,
      spanId: this.data.spanId,
      parentSpanId: this.data.parentSpanId,
      traceFlags: 0x01,
    };
  }

  /** End the span */
  end(): void {
    if (this.ended) return;
    this.ended = true;
    this.data.endTime = Date.now();
    this.data.durationMs = this.data.endTime - this.data.startTime;
    this.tracer.recordSpan(this.data);
  }

  /** Check if span is ended */
  isEnded(): boolean {
    return this.ended;
  }

  /** Execute a function within this span's context */
  async within<T>(fn: (span: Span) => Promise<T>): Promise<T> {
    try {
      const result = await fn(this);
      if (this.data.status === 'unset') this.setStatus('ok');
      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.recordError(error);
      } else {
        this.setStatus('error', String(error));
      }
      throw error;
    } finally {
      this.end();
    }
  }
}

// ─── Tracer Class ──────────────────────────────────────────────────────────

export class Tracer {
  private config: TracerConfig;
  private completedTraces = new Map<string, SpanData[]>();
  private activeSpans = new Map<string, SpanData>();

  constructor(config?: Partial<TracerConfig>) {
    this.config = {
      serviceName: config?.serviceName ?? 'zaringold',
      maxTracesInMemory: config?.maxTracesInMemory ?? 1000,
      enabled: config?.enabled ?? (process.env.NODE_ENV !== 'test'),
      sampleRate: config?.sampleRate ?? (process.env.NODE_ENV === 'production' ? 0.1 : 1.0),
    };
  }

  /** Whether tracing is enabled and should sample */
  shouldTrace(): boolean {
    return this.config.enabled && Math.random() < this.config.sampleRate;
  }

  /** Start a new root span */
  startSpan(
    name: string,
    parentSpan?: Span,
    kind: SpanKind = 'INTERNAL',
    attributes?: Record<string, string | number | boolean>
  ): Span {
    if (!this.shouldTrace()) {
      // Return a no-op span
      return this.createNoOpSpan(name, parentSpan, kind, attributes);
    }
    const span = new Span(name, this, parentSpan, kind, attributes);
    this.activeSpans.set(span.data.spanId, span.data);
    return span;
  }

  /** Start a root span for an HTTP request */
  startRequestSpan(options: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    attributes?: Record<string, string | number | boolean>;
  }): Span {
    // Check for propagated trace context
    const propagatedCtx = options.headers
      ? this.extractTraceContext(options.headers)
      : null;

    if (propagatedCtx) {
      // Continue existing trace
      const span = new Span(
        `${options.method} ${options.url}`,
        this,
        undefined,
        'SERVER',
        {
          'http.method': options.method,
          'http.url': options.url,
          ...options.attributes,
        }
      );
      // Override trace IDs from propagated context
      span.data.traceId = propagatedCtx.traceId;
      span.data.parentSpanId = propagatedCtx.spanId;
      this.activeSpans.set(span.data.spanId, span.data);
      return span;
    }

    // New trace
    return this.startSpan(
      `${options.method} ${options.url}`,
      undefined,
      'SERVER',
      {
        'http.method': options.method,
        'http.url': options.url,
        'service.name': this.config.serviceName,
        ...options.attributes,
      }
    );
  }

  /** Extract trace context from incoming headers */
  extractTraceContext(headers: Record<string, string>): TraceContext | null {
    // Support W3C traceparent format
    const traceparent = headers['traceparent'] ?? headers['trace-parent'];
    if (traceparent) {
      return this.parseTraceparent(traceparent);
    }

    // Support B3 format
    const b3TraceId = headers['x-b3-traceid'];
    const b3SpanId = headers['x-b3-spanid'];
    const b3ParentSpanId = headers['x-b3-parentspanid'];
    if (b3TraceId && b3SpanId) {
      return {
        traceId: b3TraceId,
        spanId: b3SpanId,
        parentSpanId: b3ParentSpanId,
        traceFlags: 0x01,
      };
    }

    // Support custom headers (X-Trace-Id, X-Span-Id)
    const traceId = headers['x-trace-id'];
    const spanId = headers['x-span-id'];
    if (traceId && spanId) {
      return {
        traceId,
        spanId,
        parentSpanId: headers['x-parent-span-id'],
        traceFlags: 0x01,
      };
    }

    return null;
  }

  /** Inject trace context into outgoing headers */
  injectTraceContext(span: Span, headers: Record<string, string>): void {
    const ctx = span.getTraceContext();
    // W3C traceparent format: version-traceid-spanid-flags
    headers['traceparent'] = `00-${ctx.traceId}-${ctx.spanId}-01`;
    headers['x-trace-id'] = ctx.traceId;
    headers['x-span-id'] = ctx.spanId;
  }

  /** Record a completed span */
  recordSpan(data: SpanData): void {
    this.activeSpans.delete(data.spanId);
    if (!data.endTime || !data.durationMs) return;

    const existing = this.completedTraces.get(data.traceId) ?? [];
    existing.push(data);

    // Keep only recent traces
    if (this.completedTraces.size > this.config.maxTracesInMemory) {
      const oldest = this.completedTraces.keys().next().value;
      if (oldest) this.completedTraces.delete(oldest);
    }

    this.completedTraces.set(data.traceId, existing);
  }

  /** Get all spans for a trace */
  getTrace(traceId: string): SpanData[] {
    return this.completedTraces.get(traceId) ?? [];
  }

  /** Get recent traces */
  getRecentTraces(limit: number = 20): SpanData[][] {
    const traces: SpanData[][] = [];
    for (const [, spans] of this.completedTraces) {
      traces.push(spans);
      if (traces.length >= limit) break;
    }
    return traces;
  }

  /** Get active spans count */
  getActiveSpanCount(): number {
    return this.activeSpans.size;
  }

  /** Clear all stored traces */
  clearTraces(): void {
    this.completedTraces.clear();
    this.activeSpans.clear();
  }

  /** Parse W3C traceparent header */
  private parseTraceparent(traceparent: string): TraceContext | null {
    try {
      const parts = traceparent.split('-');
      if (parts.length !== 4 || parts[0] !== '00') return null;
      return {
        traceId: parts[1],
        spanId: parts[2],
        traceFlags: parseInt(parts[3], 16),
      };
    } catch {
      return null;
    }
  }

  /** Create a no-op span that does nothing */
  private createNoOpSpan(
    name: string,
    parentSpan?: Span,
    kind: SpanKind = 'INTERNAL',
    attributes?: Record<string, string | number | boolean>
  ): Span {
    const span = new Span(name, this, parentSpan, kind, attributes);
    // Immediately end and mark as no-op by clearing its data
    span.data.startTime = 0;
    span.data.endTime = 0;
    span.data.durationMs = 0;
    return span;
  }
}

// ─── Singleton Tracer ──────────────────────────────────────────────────────

export const tracer = new Tracer({
  serviceName: 'zaringold',
  enabled: process.env.OTEL_TRACES_ENABLED === 'true' || process.env.NODE_ENV === 'development',
  sampleRate: parseFloat(process.env.TRACE_SAMPLE_RATE ?? '0.1'),
});

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Extract trace context from Next.js Request headers
 */
export function extractTraceFromRequest(request: Request): TraceContext | null {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });
  return tracer.extractTraceContext(headers);
}

/**
 * Create trace propagation headers for outgoing requests
 */
export function createTraceHeaders(span: Span): Record<string, string> {
  const headers: Record<string, string> = {};
  tracer.injectTraceContext(span, headers);
  return headers;
}

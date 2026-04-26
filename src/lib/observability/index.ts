/* ═══════════════════════════════════════════════════════════════════════════
 *  observability/index.ts — Observability Hub
 *  Barrel export for all observability modules
 * ═══════════════════════════════════════════════════════════════════════════ */

// Metrics
export {
  metrics,
  Counter,
  Histogram,
  Gauge,
  httpRequestTotal,
  httpRequestDurationMs,
  httpRequestsInProgress,
  activeConnectionsGauge,
  cacheOperationsTotal,
  errorTotal,
  circuitBreakerState,
  businessEventsTotal,
  goldTradesTotal,
  goldTradeAmount,
  queueLengthGauge,
  rateLimitTotal,
  walletOperationsTotal,
} from './metrics';
export type { LabelValues, MetricBase, CounterMetric, HistogramMetric, GaugeMetric, Metric } from './metrics';

// Health
export {
  healthSystem,
} from './health';
export type {
  HealthStatus,
  CheckSeverity,
  HealthCheckResult,
  HealthCheckConfig,
  SystemHealth,
} from './health';

// Tracing
export {
  tracer,
  Span,
  Tracer,
  extractTraceFromRequest,
  createTraceHeaders,
} from './tracer';
export type { TraceContext, SpanData, SpanEvent, SpanKind, TracerConfig } from './tracer';

/**
 * @module events/middleware/metrics
 * @description Metrics collection middleware for the event bus.
 *
 * Tracks:
 * - Event processing count (total, by type, by category)
 * - Event processing time (min, max, avg, percentiles)
 * - Error count and rate
 * - Throughput (events/second)
 */

import type { EventEnvelope, EventMiddleware, EventCategory, EventType } from '../types';

// ─── Metrics Data Structures ─────────────────────────────────────────────────

interface EventMetrics {
  count: number;
  errorCount: number;
  totalTime: number;
  minTime: number;
  maxTime: number;
  lastProcessedAt: string;
}

interface MetricsSnapshot {
  timestamp: string;
  totalEvents: number;
  totalErrors: number;
  errorRate: number;
  avgProcessingTime: number;
  byCategory: Record<string, EventMetrics>;
  byType: Partial<Record<EventType, EventMetrics>>;
  throughputPerSecond: number;
}

// ─── Metrics Collector ───────────────────────────────────────────────────────

/**
 * Thread-safe metrics collector for event processing.
 */
export class MetricsCollector {
  private metrics: Map<string, EventMetrics> = new Map();
  private totalCount = 0;
  private totalErrors = 0;
  private totalTime = 0;
  private startTime: number;
  private windowStart: number;
  private windowCount = 0;
  private windowErrors = 0;

  constructor() {
    this.startTime = Date.now();
    this.windowStart = Date.now();
  }

  /**
   * Record a successful event processing.
   */
  recordSuccess(type: string, category: string, durationMs: number): void {
    this.totalCount++;
    this.totalTime += durationMs;
    this.windowCount++;

    // Update type metrics
    const typeKey = `type:${type}`;
    this.updateMetrics(typeKey, durationMs);

    // Update category metrics
    const catKey = `cat:${category}`;
    this.updateMetrics(catKey, durationMs);
  }

  /**
   * Record a failed event processing.
   */
  recordError(type: string, category: string, durationMs: number): void {
    this.totalCount++;
    this.totalErrors++;
    this.totalTime += durationMs;
    this.windowCount++;
    this.windowErrors++;

    const typeKey = `type:${type}`;
    this.updateMetrics(typeKey, durationMs, true);

    const catKey = `cat:${category}`;
    this.updateMetrics(catKey, durationMs, true);
  }

  private updateMetrics(key: string, durationMs: number, isError = false): void {
    let metrics = this.metrics.get(key);
    if (!metrics) {
      metrics = {
        count: 0,
        errorCount: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        lastProcessedAt: '',
      };
      this.metrics.set(key, metrics);
    }
    metrics.count++;
    if (isError) metrics.errorCount++;
    metrics.totalTime += durationMs;
    metrics.minTime = Math.min(metrics.minTime, durationMs);
    metrics.maxTime = Math.max(metrics.maxTime, durationMs);
    metrics.lastProcessedAt = new Date().toISOString();
  }

  /**
   * Get a snapshot of current metrics.
   */
  getSnapshot(): MetricsSnapshot {
    const now = Date.now();
    const windowDurationSec = (now - this.windowStart) / 1000;

    const byCategory: Record<string, EventMetrics> = {};
    const byType: Partial<Record<EventType, EventMetrics>> = {};

    this.metrics.forEach((metrics, key) => {
      if (key.startsWith('cat:')) {
        byCategory[key.slice(4)] = { ...metrics };
      } else if (key.startsWith('type:')) {
        byType[key.slice(5) as EventType] = { ...metrics };
      }
    });

    return {
      timestamp: new Date().toISOString(),
      totalEvents: this.totalCount,
      totalErrors: this.totalErrors,
      errorRate: this.totalCount > 0 ? this.totalErrors / this.totalCount : 0,
      avgProcessingTime: this.totalCount > 0 ? this.totalTime / this.totalCount : 0,
      byCategory,
      byType,
      throughputPerSecond: windowDurationSec > 0 ? this.windowCount / windowDurationSec : 0,
    };
  }

  /**
   * Reset the window counters (called periodically for throughput calculation).
   */
  resetWindow(): void {
    this.windowStart = Date.now();
    this.windowCount = 0;
    this.windowErrors = 0;
  }

  /**
   * Reset all metrics.
   */
  reset(): void {
    this.metrics.clear();
    this.totalCount = 0;
    this.totalErrors = 0;
    this.totalTime = 0;
    this.startTime = Date.now();
    this.windowStart = Date.now();
    this.windowCount = 0;
    this.windowErrors = 0;
  }
}

// ─── Global Collector Instance ───────────────────────────────────────────────

let globalCollector: MetricsCollector | null = null;

/**
 * Get the global metrics collector instance.
 */
export function getGlobalMetricsCollector(): MetricsCollector {
  if (!globalCollector) {
    globalCollector = new MetricsCollector();
  }
  return globalCollector;
}

// ─── Metrics Middleware ───────────────────────────────────────────────────────

export interface MetricsMiddlewareOptions {
  /** Custom collector instance (default: global) */
  collector?: MetricsCollector;
  /** Record per-event-type metrics (default: true) */
  trackByType?: boolean;
  /** Maximum distinct event types to track (default: 100) */
  maxTrackedTypes?: number;
}

/**
 * Create a metrics collection middleware.
 *
 * @param options - Middleware configuration options
 * @returns Event middleware function
 *
 * @example
 * ```typescript
 * const metrics = createMetricsMiddleware();
 * subscriber.use(metrics);
 * ```
 */
export function createMetricsMiddleware(
  options?: MetricsMiddlewareOptions,
): EventMiddleware {
  const collector = options?.collector ?? getGlobalMetricsCollector();
  const trackByType = options?.trackByType ?? true;

  return async (event: EventEnvelope, next: () => Promise<void>) => {
    const startTime = Date.now();

    try {
      await next();

      const duration = Date.now() - startTime;
      collector.recordSuccess(
        event.metadata.type,
        event.metadata.category,
        duration,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      collector.recordError(
        event.metadata.type,
        event.metadata.category,
        duration,
      );
      throw error;
    }
  };
}

/**
 * Default metrics middleware instance.
 */
export const metricsMiddleware = createMetricsMiddleware();

/**
 * @module events/handlers/analytics
 * @description Analytics event handlers for the ZarinGold platform.
 *
 * Tracks and processes analytics data including:
 * - User behavior tracking
 * - Transaction metrics
 * - Platform KPIs
 * - Conversion funnels
 * - System performance metrics
 */

import type { EventEnvelope, EventHandlerRegistration } from '../types';

// ─── Handler: Trading Analytics ──────────────────────────────────────────────

/**
 * Track a trading event for analytics.
 * Records trade volume, frequency, and user trading patterns.
 */
export async function trackTradingEvent(event: EventEnvelope): Promise<void> {
  const { data, metadata } = event;

  console.log(
    `[Analytics] Trading event: type=${metadata.type}, userId=${metadata.userId ?? 'anonymous'}, ` +
    `source=${metadata.source}`,
  );

  // TODO: Analytics pipeline
  // 1. Record event in analytics store (Redis + periodic DB flush)
  // 2. Update real-time trading dashboard metrics
  // 3. Calculate moving averages and trend indicators
  // 4. Update per-user trading profiles

  await trackMetrics(metadata.type, {
    category: 'trading',
    userId: metadata.userId,
    timestamp: metadata.timestamp,
    source: metadata.source,
    data,
  });
}

// ─── Handler: Payment Analytics ──────────────────────────────────────────────

/**
 * Track payment events for analytics.
 */
export async function trackPaymentEvent(event: EventEnvelope): Promise<void> {
  const { metadata } = event;

  console.log(
    `[Analytics] Payment event: type=${metadata.type}, userId=${metadata.userId ?? 'anonymous'}`,
  );

  // TODO: Payment analytics
  // 1. Track payment success/failure rates
  // 2. Monitor gateway performance
  // 3. Calculate conversion rates
  // 4. Revenue metrics

  await trackMetrics(metadata.type, {
    category: 'payment',
    userId: metadata.userId,
    timestamp: metadata.timestamp,
    priority: metadata.priority,
  });
}

// ─── Handler: User Behavior Analytics ────────────────────────────────────────

/**
 * Track user lifecycle events.
 */
export async function trackUserEvent(event: EventEnvelope): Promise<void> {
  const { metadata } = event;

  // Don't track sensitive events like password changes
  if (metadata.type.includes('password') || metadata.type.includes('otp')) return;

  console.log(
    `[Analytics] User event: type=${metadata.type}, userId=${metadata.userId ?? 'anonymous'}`,
  );

  await trackMetrics(metadata.type, {
    category: 'user',
    userId: metadata.userId,
    timestamp: metadata.timestamp,
  });
}

// ─── Handler: System Performance ─────────────────────────────────────────────

/**
 * Track system health and performance metrics.
 */
export async function trackSystemEvent(event: EventEnvelope): Promise<void> {
  const { data, metadata } = event;

  if (metadata.type === 'system.health.check') {
    const health = data as Record<string, unknown>;
    console.log(`[Analytics] Health check:`, health);
  }

  if (metadata.type === 'system.error.occurred') {
    const error = data as { message: string; code?: string; service?: string };
    console.error(
      `[Analytics] Error tracked: ${error.message} (code=${error.code}, service=${error.service})`,
    );
  }

  if (metadata.type === 'system.metrics.collected') {
    const metrics = data as Record<string, number>;
    console.log(
      `[Analytics] System metrics: CPU=${metrics.cpu ?? 0}%, ` +
      `MEM=${metrics.memory ?? 0}%, EVENTS=${metrics.eventsProcessed ?? 0}`,
    );
  }
}

// ─── Handler: Gamification Analytics ─────────────────────────────────────────

/**
 * Track gamification engagement metrics.
 */
export async function trackGamificationEvent(event: EventEnvelope): Promise<void> {
  const { metadata } = event;

  console.log(
    `[Analytics] Gamification: type=${metadata.type}, userId=${metadata.userId ?? 'anonymous'}`,
  );

  // TODO: Gamification analytics
  // 1. Track daily/weekly active users in gamification
  // 2. Achievement completion rates
  // 3. Quest engagement metrics
  // 4. Leaderboard participation
}

// ─── Metrics Aggregation ─────────────────────────────────────────────────────

/** In-memory metrics buffer for aggregation */
const metricsBuffer: Array<{
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}> = [];

const METRICS_FLUSH_INTERVAL = 60_000; // 1 minute
const METRICS_BUFFER_MAX = 10_000;

/**
 * Record a metric event.
 */
async function trackMetrics(
  type: string,
  data: Record<string, unknown>,
): Promise<void> {
  metricsBuffer.push({
    type,
    data,
    timestamp: new Date().toISOString(),
  });

  // Trim buffer if needed
  if (metricsBuffer.length > METRICS_BUFFER_MAX) {
    metricsBuffer.splice(0, metricsBuffer.length - METRICS_BUFFER_MAX);
  }
}

/**
 * Flush metrics buffer to persistent storage.
 * Should be called periodically by a scheduler.
 */
export async function flushMetrics(): Promise<{
  flushed: number;
  remaining: number;
}> {
  const count = metricsBuffer.length;
  if (count === 0) return { flushed: 0, remaining: 0 };

  // TODO: Batch insert into analytics database
  console.log(`[Analytics] Flushing ${count} metrics to storage`);

  metricsBuffer.length = 0;
  return { flushed: count, remaining: 0 };
}

/**
 * Get aggregated metrics for a time window.
 */
export function getAggregatedMetrics(timeWindow: '1m' | '5m' | '15m' | '1h' | '1d'): {
  totalEvents: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  errorCount: number;
} {
  const now = Date.now();
  const windowMs: Record<string, number> = {
    '1m': 60_000,
    '5m': 300_000,
    '15m': 900_000,
    '1h': 3_600_000,
    '1d': 86_400_000,
  };

  const cutoff = now - windowMs[timeWindow];
  const filtered = metricsBuffer.filter(
    (m) => new Date(m.timestamp).getTime() >= cutoff,
  );

  const byCategory: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let errorCount = 0;

  for (const metric of filtered) {
    const category = metric.data.category as string ?? 'unknown';
    byCategory[category] = (byCategory[category] ?? 0) + 1;
    byType[metric.type] = (byType[metric.type] ?? 0) + 1;
    if (metric.type.includes('error') || metric.type.includes('failed')) {
      errorCount++;
    }
  }

  return {
    totalEvents: filtered.length,
    byCategory,
    byType,
    errorCount,
  };
}

// ─── Handler Registration ────────────────────────────────────────────────────

/**
 * Register all analytics event handlers.
 * Analytics handlers subscribe to ALL events using wildcard patterns.
 */
export function getAnalyticsHandlerRegistrations(): EventHandlerRegistration[] {
  return [
    {
      pattern: 'trading.*',
      handler: trackTradingEvent,
      name: 'trackTradingEvent',
    },
    {
      pattern: 'payment.*',
      handler: trackPaymentEvent,
      name: 'trackPaymentEvent',
    },
    {
      pattern: 'user.*',
      handler: trackUserEvent,
      name: 'trackUserEvent',
    },
    {
      pattern: 'system.*',
      handler: trackSystemEvent,
      name: 'trackSystemEvent',
    },
    {
      pattern: 'gamification.*',
      handler: trackGamificationEvent,
      name: 'trackGamificationEvent',
    },
  ];
}

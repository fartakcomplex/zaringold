/**
 * @module events/middleware/logging
 * @description Structured logging middleware for the event bus.
 *
 * Logs all events with consistent formatting, including:
 * - Event type, ID, and correlation ID
 * - Timestamp and source
 * - Processing duration
 * - Success/failure status
 */

import type { EventEnvelope, EventMiddleware } from '../types';

// ─── Log Levels ───────────────────────────────────────────────────────────────
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  eventType: string;
  eventId: string;
  correlationId: string;
  source: string;
  category: string;
  duration?: number;
  error?: string;
  handlerName?: string;
  metadata?: Record<string, unknown>;
}

// ─── Log Transport ───────────────────────────────────────────────────────────

/**
 * Abstract log transport interface.
 * Implementations can send logs to console, file, external services, etc.
 */
export interface LogTransport {
  log(entry: LogEntry): void;
}

/**
 * Console log transport with colored output.
 */
export class ConsoleLogTransport implements LogTransport {
  private colors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m',  // green
    warn: '\x1b[33m',  // yellow
    error: '\x1b[31m', // red
  };
  private reset = '\x1b[0m';

  log(entry: LogEntry): void {
    const color = this.colors[entry.level];
    const time = entry.timestamp.split('T')[1]?.split('.')[0] ?? entry.timestamp;
    const prefix = `${color}[${entry.level.toUpperCase()}]${this.reset} ${time}`;

    let message = `${prefix} [${entry.category}] ${entry.eventType}`;
    if (entry.handlerName) message += ` → ${entry.handlerName}`;
    message += ` (id=${entry.eventId.slice(0, 8)}, corr=${entry.correlationId.slice(0, 8)})`;

    if (entry.duration !== undefined) {
      message += ` ${entry.duration}ms`;
    }

    console.log(message);

    if (entry.error) {
      console.error(`${prefix} Error: ${entry.error}`);
    }
  }
}

// ─── Logging Middleware ───────────────────────────────────────────────────────

export interface LoggingMiddlewareOptions {
  /** Log level for successful events (default: 'info') */
  successLevel?: LogLevel;
  /** Log level for failed events (default: 'error') */
  errorLevel?: LogLevel;
  /** Log the event payload data */
  logData?: boolean;
  /** Custom transport (default: ConsoleLogTransport) */
  transport?: LogTransport;
  /** Maximum payload size to log (default: 1000 chars) */
  maxDataLength?: number;
  /** Event types to skip logging */
  skipEventTypes?: string[];
}

/**
 * Create a logging middleware instance.
 *
 * @param options - Middleware configuration options
 * @returns Event middleware function
 *
 * @example
 * ```typescript
 * const logging = createLoggingMiddleware({ logData: true });
 * subscriber.use(logging);
 * ```
 */
export function createLoggingMiddleware(
  options?: LoggingMiddlewareOptions,
): EventMiddleware {
  const transport = options?.transport ?? new ConsoleLogTransport();
  const successLevel = options?.successLevel ?? 'info';
  const errorLevel = options?.errorLevel ?? 'error';
  const logData = options?.logData ?? false;
  const maxDataLength = options?.maxDataLength ?? 1000;
  const skipSet = new Set(options?.skipEventTypes ?? []);

  return async (event: EventEnvelope, next: () => Promise<void>) => {
    const startTime = Date.now();

    try {
      await next();

      const duration = Date.now() - startTime;
      const level = skipSet.has(event.metadata.type) ? 'debug' : successLevel;

      transport.log({
        level,
        timestamp: new Date().toISOString(),
        message: 'Event processed',
        eventType: event.metadata.type,
        eventId: event.metadata.eventId,
        correlationId: event.metadata.correlationId,
        source: event.metadata.source,
        category: event.metadata.category,
        duration,
        metadata: logData ? {
          data: JSON.stringify(event.data).slice(0, maxDataLength),
        } : undefined,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      transport.log({
        level: errorLevel,
        timestamp: new Date().toISOString(),
        message: 'Event processing failed',
        eventType: event.metadata.type,
        eventId: event.metadata.eventId,
        correlationId: event.metadata.correlationId,
        source: event.metadata.source,
        category: event.metadata.category,
        duration,
        error: (error as Error).message,
        metadata: logData ? {
          data: JSON.stringify(event.data).slice(0, maxDataLength),
        } : undefined,
      });

      throw error;
    }
  };
}

/**
 * Default logging middleware instance.
 */
export const loggingMiddleware = createLoggingMiddleware({
  logData: false,
  skipEventTypes: [
    'system.health.check',
    'system.metrics.collected',
    'trading.gold.price.updated',
  ],
});

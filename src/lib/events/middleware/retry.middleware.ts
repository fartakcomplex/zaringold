/**
 * @module events/middleware/retry
 * @description Automatic retry middleware with exponential backoff.
 *
 * Provides configurable retry behavior for event handlers:
 * - Exponential backoff with jitter
 * - Maximum retry attempts
 * - Custom retry conditions
 * - Retry event metadata tracking
 */

import type { EventEnvelope, EventMiddleware } from '../types';

// ─── Retry Configuration ─────────────────────────────────────────────────────

export interface RetryMiddlewareOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds (default: 1000) */
  baseDelay?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Add jitter to prevent thundering herd (default: true) */
  jitter?: boolean;
  /** Only retry on these error types */
  retryableErrors?: string[];
  /** Custom function to determine if an error is retryable */
  isRetryable?: (error: Error, event: EventEnvelope, attempt: number) => boolean;
  /** Callback on each retry attempt */
  onRetry?: (event: EventEnvelope, attempt: number, error: Error, delay: number) => void;
  /** Callback when all retries exhausted */
  onExhausted?: (event: EventEnvelope, lastError: Error, totalAttempts: number) => void;
}

// ─── Retry Helpers ───────────────────────────────────────────────────────────

/**
 * Calculate delay with exponential backoff and optional jitter.
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  multiplier: number,
  jitter: boolean,
): number {
  const delay = baseDelay * Math.pow(multiplier, attempt - 1);

  // Apply jitter: randomize between 50% and 100% of calculated delay
  const jitterDelay = jitter
    ? delay * (0.5 + Math.random() * 0.5)
    : delay;

  return Math.min(jitterDelay, maxDelay);
}

/**
 * Default retryable error check.
 * Retries on network errors, timeouts, and temporary failures.
 */
function defaultIsRetryable(error: Error, _event: EventEnvelope, attempt: number): boolean {
  const retryablePatterns = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'ESOCKETTIMEDOUT',
    'ENOTFOUND',
    'EPIPE',
    '429',
    '502',
    '503',
    '504',
    'timeout',
    'Temporary',
  ];

  if (attempt >= 5) return false; // Safety limit

  const message = error.message;
  return retryablePatterns.some((p) => message.includes(p));
}

// ─── Retry Middleware ────────────────────────────────────────────────────────

/**
 * Create a retry middleware with configurable backoff.
 *
 * @param options - Retry configuration options
 * @returns Event middleware function
 *
 * @example
 * ```typescript
 * const retry = createRetryMiddleware({
 *   maxRetries: 5,
 *   baseDelay: 500,
 *   maxDelay: 60000,
 * });
 * subscriber.use(retry);
 * ```
 */
export function createRetryMiddleware(
  options?: RetryMiddlewareOptions,
): EventMiddleware {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelay = options?.baseDelay ?? 1000;
  const maxDelay = options?.maxDelay ?? 30_000;
  const multiplier = options?.backoffMultiplier ?? 2;
  const jitter = options?.jitter ?? true;
  const isRetryable = options?.isRetryable ?? defaultIsRetryable;

  return async (event: EventEnvelope, next: () => Promise<void>) => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        await next();
        return; // Success - exit the retry loop
      } catch (error) {
        lastError = error as Error;

        // Check if this error is retryable
        if (attempt > maxRetries || !isRetryable(lastError, event, attempt)) {
          if (attempt <= maxRetries) {
            console.warn(
              `[Retry] Non-retryable error for ${event.metadata.type}: ${lastError.message}`,
            );
          }
          break;
        }

        // Calculate delay
        const delay = calculateDelay(attempt, baseDelay, maxDelay, multiplier, jitter);

        console.warn(
          `[Retry] Attempt ${attempt}/${maxRetries} for ${event.metadata.type}, ` +
          `retrying in ${Math.round(delay)}ms: ${lastError.message}`,
        );

        // Notify callback
        options?.onRetry?.(event, attempt, lastError, delay);

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // All retries exhausted
    if (lastError) {
      options?.onExhausted?.(event, lastError, maxRetries + 1);
      throw lastError;
    }
  };
}

/**
 * Default retry middleware instance.
 */
export const retryMiddleware = createRetryMiddleware({
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
});

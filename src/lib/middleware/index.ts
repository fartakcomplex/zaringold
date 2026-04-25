/* ═══════════════════════════════════════════════════════════════════════════
 *  middleware/index.ts — Middleware Hub
 *  Barrel export for all middleware modules
 * ═══════════════════════════════════════════════════════════════════════════ */

// Rate Limiter
export {
  DistributedRateLimiter,
  rateLimiter,
  buildRateLimitIdentifier,
  DEFAULT_RATE_LIMITS,
} from './rate-limiter';
export type {
  RateLimitStrategy,
  RateLimitRule,
  RateLimitResult,
  RateLimitHeaders,
  RouteRateConfig,
} from './rate-limiter';

// Request Logger
export {
  RequestLogger,
  logger,
  parseUserAgent,
  generateRequestId,
  extractClientIp,
} from './request-logger';
export type {
  LogLevel,
  LogEntry,
  ParsedUserAgent,
  LoggerConfig,
  GeoInfo,
} from './request-logger';

// Circuit Breaker
export {
  CircuitBreaker,
  circuitRegistry,
  paymentBreaker,
  smsBreaker,
  emailBreaker,
  goldPriceBreaker,
} from './circuit-breaker';
export type {
  CircuitState,
  CircuitBreakerConfig,
  CircuitBreakerMetric,
  CircuitBreakerResult,
} from './circuit-breaker';

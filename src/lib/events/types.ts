/**
 * @module events/types
 * @description Comprehensive event type definitions for the ZarinGold platform.
 * Covers all event categories: trading, wallet, payment, user, notification,
 * gamification, insurance, and system events.
 *
 * Events follow a versioned schema with metadata for tracing and replay.
 */

// ─── Event Category Prefixes ─────────────────────────────────────────────────
export const EVENT_CATEGORIES = {
  trading: 'trading',
  wallet: 'wallet',
  payment: 'payment',
  user: 'user',
  notification: 'notification',
  gamification: 'gamification',
  insurance: 'insurance',
  system: 'system',
} as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[keyof typeof EVENT_CATEGORIES];

// ─── Event Types per Category ────────────────────────────────────────────────
export const TRADING_EVENTS = {
  GOLD_BUY_CREATED: 'trading.gold.buy.created',
  GOLD_BUY_COMPLETED: 'trading.gold.buy.completed',
  GOLD_BUY_FAILED: 'trading.gold.buy.failed',
  GOLD_SELL_CREATED: 'trading.gold.sell.created',
  GOLD_SELL_COMPLETED: 'trading.gold.sell.completed',
  GOLD_SELL_FAILED: 'trading.gold.sell.failed',
  GOLD_GIFT_SENT: 'trading.gold.gift.sent',
  GOLD_GIFT_RECEIVED: 'trading.gold.gift.received',
  GOLD_TRANSFER_CREATED: 'trading.gold.transfer.created',
  GOLD_TRANSFER_COMPLETED: 'trading.gold.transfer.completed',
  GOLD_PRICE_UPDATED: 'trading.gold.price.updated',
  GOLD_PRICE_ALERT_TRIGGERED: 'trading.gold.price.alert.triggered',
  AUTO_TRADE_ORDER_CREATED: 'trading.auto_trade.order.created',
  AUTO_TRADE_ORDER_EXECUTED: 'trading.auto_trade.order.executed',
  AUTO_TRADE_ORDER_ACTIVATED: 'trading.auto_trade.order.activated',
  PORTFOLIO_UPDATED: 'trading.portfolio.updated',
  RESERVATION_CREATED: 'trading.reservation.created',
  RESERVATION_COMPLETED: 'trading.reservation.completed',
  RESERVATION_CANCELLED: 'trading.reservation.cancelled',
} as const;

export const WALLET_EVENTS = {
  DEPOSIT_CREATED: 'wallet.deposit.created',
  DEPOSIT_VERIFIED: 'wallet.deposit.verified',
  DEPOSIT_FAILED: 'wallet.deposit.failed',
  WITHDRAWAL_CREATED: 'wallet.withdrawal.created',
  WITHDRAWAL_COMPLETED: 'wallet.withdrawal.completed',
  WITHDRAWAL_FAILED: 'wallet.withdrawal.failed',
  WITHDRAWAL_APPROVED: 'wallet.withdrawal.approved',
  WITHDRAWAL_REJECTED: 'wallet.withdrawal.rejected',
  TRANSFER_CREATED: 'wallet.transfer.created',
  TRANSFER_COMPLETED: 'wallet.transfer.completed',
  TRANSFER_FAILED: 'wallet.transfer.failed',
  TOPUP_CREATED: 'wallet.topup.created',
  TOPUP_COMPLETED: 'wallet.topup.completed',
  BALANCE_UPDATED: 'wallet.balance.updated',
  FAMILY_WALLET_CONTRIBUTION: 'wallet.family.contribution',
  LOAN_CREATED: 'wallet.loan.created',
  LOAN_REPAID: 'wallet.loan.repaid',
  LOAN_DEFAULTED: 'wallet.loan.defaulted',
} as const;

export const PAYMENT_EVENTS = {
  PAYMENT_CREATED: 'payment.created',
  PAYMENT_VERIFIED: 'payment.verified',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',
  PAYMENT_EXPIRED: 'payment.expired',
  PAYMENT_CANCELLED: 'payment.cancelled',
  GATEWAY_SETTLEMENT_CREATED: 'payment.gateway.settlement.created',
  GATEWAY_SETTLEMENT_COMPLETED: 'payment.gateway.settlement.completed',
  MERCHANT_PAYMENT_RECEIVED: 'payment.merchant.received',
  MERCHANT_SETTLEMENT_REQUESTED: 'payment.merchant.settlement.requested',
  CASHBACK_EARNED: 'payment.cashback.earned',
  CASHBACK_CLAIMED: 'payment.cashback.claimed',
} as const;

export const USER_EVENTS = {
  REGISTRATION_INITIATED: 'user.registration.initiated',
  REGISTRATION_COMPLETED: 'user.registration.completed',
  LOGIN_SUCCESSFUL: 'user.login.successful',
  LOGIN_FAILED: 'user.login.failed',
  LOGOUT: 'user.logout',
  PASSWORD_CHANGED: 'user.password.changed',
  PASSWORD_RESET_REQUESTED: 'user.password.reset.requested',
  PASSWORD_RESET_COMPLETED: 'user.password.reset.completed',
  OTP_SENT: 'user.otp.sent',
  OTP_VERIFIED: 'user.otp.verified',
  KYC_SUBMITTED: 'user.kyc.submitted',
  KYC_APPROVED: 'user.kyc.approved',
  KYC_REJECTED: 'user.kyc.rejected',
  PROFILE_UPDATED: 'user.profile.updated',
  SESSION_CREATED: 'user.session.created',
  SESSION_EXPIRED: 'user.session.expired',
  ACCOUNT_SUSPENDED: 'user.account.suspended',
  ACCOUNT_REACTIVATED: 'user.account.reactivated',
  VIP_SUBSCRIBED: 'user.vip.subscribed',
  VIP_EXPIRED: 'user.vip.expired',
} as const;

export const NOTIFICATION_EVENTS = {
  EMAIL_SENT: 'notification.email.sent',
  EMAIL_FAILED: 'notification.email.failed',
  EMAIL_BOUNCED: 'notification.email.bounced',
  SMS_SENT: 'notification.sms.sent',
  SMS_FAILED: 'notification.sms.failed',
  PUSH_SENT: 'notification.push.sent',
  PUSH_FAILED: 'notification.push.failed',
  IN_APP_CREATED: 'notification.in_app.created',
  IN_APP_READ: 'notification.in_app.read',
  NOTIFICATION_PREFERENCES_UPDATED: 'notification.preferences.updated',
} as const;

export const GAMIFICATION_EVENTS = {
  CHECKIN_PERFORMED: 'gamification.checkin.performed',
  CHECKIN_STREAK_UPDATED: 'gamification.checkin.streak.updated',
  XP_EARNED: 'gamification.xp.earned',
  XP_SPENT: 'gamification.xp.spent',
  LEVEL_UP: 'gamification.level.up',
  LEVEL_DOWN: 'gamification.level.down',
  ACHIEVEMENT_UNLOCKED: 'gamification.achievement.unlocked',
  QUEST_STARTED: 'gamification.quest.started',
  QUEST_COMPLETED: 'gamification.quest.completed',
  QUEST_CLAIMED: 'gamification.quest.claimed',
  LEADERBOARD_UPDATED: 'gamification.leaderboard.updated',
  BADGE_EARNED: 'gamification.badge.earned',
  PREDIATION_SUBMITTED: 'gamification.prediction.submitted',
  PREDICTION_RESOLVED: 'gamification.prediction.resolved',
} as const;

export const INSURANCE_EVENTS = {
  ORDER_CREATED: 'insurance.order.created',
  ORDER_PROCESSED: 'insurance.order.processed',
  ORDER_COMPLETED: 'insurance.order.completed',
  ORDER_CANCELLED: 'insurance.order.cancelled',
  ORDER_FAILED: 'insurance.order.failed',
  CLAIM_SUBMITTED: 'insurance.claim.submitted',
  CLAIM_APPROVED: 'insurance.claim.approved',
  CLAIM_REJECTED: 'insurance.claim.rejected',
} as const;

export const SYSTEM_EVENTS = {
  HEALTH_CHECK: 'system.health.check',
  HEALTH_CHECK_FAILED: 'system.health.check.failed',
  METRICS_COLLECTED: 'system.metrics.collected',
  ERROR_OCCURRED: 'system.error.occurred',
  ERROR_CRITICAL: 'system.error.critical',
  SERVICE_STARTED: 'system.service.started',
  SERVICE_STOPPED: 'system.service.stopped',
  DEPLOYMENT_STARTED: 'system.deployment.started',
  DEPLOYMENT_COMPLETED: 'system.deployment.completed',
  CONFIG_UPDATED: 'system.config.updated',
  BACKUP_CREATED: 'system.backup.created',
  BACKUP_RESTORED: 'system.backup.restored',
  RATE_LIMIT_EXCEEDED: 'system.rate_limit.exceeded',
  FRAUD_DETECTED: 'system.fraud.detected',
} as const;

// ─── All Events Union ────────────────────────────────────────────────────────
export const ALL_EVENTS = {
  ...TRADING_EVENTS,
  ...WALLET_EVENTS,
  ...PAYMENT_EVENTS,
  ...USER_EVENTS,
  ...NOTIFICATION_EVENTS,
  ...GAMIFICATION_EVENTS,
  ...INSURANCE_EVENTS,
  ...SYSTEM_EVENTS,
} as const;

export type EventType = (typeof ALL_EVENTS)[keyof typeof ALL_EVENTS];

// ─── Event Metadata ──────────────────────────────────────────────────────────
export interface EventMetadata {
  /** Unique event ID (UUID v4) */
  eventId: string;
  /** Correlation ID for tracing across services */
  correlationId: string;
  /** Causation ID - the event that caused this event */
  causationId?: string;
  /** Event type string */
  type: EventType;
  /** Event category */
  category: EventCategory;
  /** ISO 8601 timestamp when event was created */
  timestamp: string;
  /** Source service/module that produced the event */
  source: string;
  /** Schema version for event payload evolution */
  version: number;
  /** ID of the user who triggered the event */
  userId?: string;
  /** IP address of the request */
  ip?: string;
  /** User agent string */
  userAgent?: string;
  /** Request ID for HTTP tracing */
  requestId?: string;
  /** Event priority: critical, high, normal, low */
  priority: EventPriority;
  /** Time-to-live in seconds (0 = no expiry) */
  ttl?: number;
}

// ─── Event Envelope ──────────────────────────────────────────────────────────
export interface EventEnvelope<T = unknown> {
  /** Event metadata */
  metadata: EventMetadata;
  /** Event payload data */
  data: T;
  /** Optional schema identifier for validation */
  schema?: string;
}

// ─── Event Priority ──────────────────────────────────────────────────────────
export type EventPriority = 'critical' | 'high' | 'normal' | 'low';

export const EVENT_PRIORITY: Record<EventPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
} as const;

// ─── Event Handler ───────────────────────────────────────────────────────────
export type EventHandler<T = unknown> = (event: EventEnvelope<T>) => Promise<void> | void;

export interface EventHandlerRegistration {
  /** Event type pattern (supports wildcards, e.g. "trading.*") */
  pattern: string;
  /** Handler function */
  handler: EventHandler;
  /** Handler name for logging */
  name: string;
  /** Optional middleware chain */
  middlewares?: EventMiddleware[];
}

// ─── Event Middleware ────────────────────────────────────────────────────────
export type EventMiddleware = (
  event: EventEnvelope,
  next: () => Promise<void>,
) => Promise<void>;

export interface MiddlewareContext {
  /** Middleware name */
  name: string;
  /** Handler being processed */
  handlerName: string;
  /** Start time for duration tracking */
  startTime: number;
  /** Number of retries so far */
  retryCount: number;
}

// ─── Event Subscription Options ──────────────────────────────────────────────
export interface SubscriptionOptions {
  /** Maximum concurrent handler executions (default: 10) */
  concurrency?: number;
  /** Enable error isolation - one handler failure won't block others */
  errorIsolation?: boolean;
  /** Maximum retry attempts for failed handlers (default: 3) */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  retryBaseDelay?: number;
  /** Maximum backoff delay in ms (default: 30000) */
  retryMaxDelay?: number;
  /** Start processing from a specific event ID (for replay) */
  startFromEventId?: string;
  /** Handler timeout in ms (default: 30000) */
  timeout?: number;
}

// ─── Publishing Options ──────────────────────────────────────────────────────
export interface PublishOptions {
  /** Delay publishing by N milliseconds */
  delay?: number;
  /** Override source service name */
  source?: string;
  /** Override event version */
  version?: number;
  /** Override correlation ID */
  correlationId?: string;
  /** Override priority */
  priority?: EventPriority;
  /** Time-to-live in seconds */
  ttl?: number;
  /** Skip validation before publishing */
  skipValidation?: boolean;
}

// ─── Event Replay ────────────────────────────────────────────────────────────
export interface EventReplayOptions {
  /** Start time (ISO 8601) to replay from */
  from?: string;
  /** End time (ISO 8601) to replay to */
  to?: string;
  /** Filter by event type pattern */
  pattern?: string;
  /** Filter by category */
  category?: EventCategory;
  /** Maximum number of events to replay */
  limit?: number;
  /** Target subscriber to replay to (default: all) */
  targetHandler?: string;
}

// ─── Dead Letter Event ───────────────────────────────────────────────────────
export interface DeadLetterEvent {
  /** Original event envelope */
  event: EventEnvelope;
  /** Error message */
  error: string;
  /** Stack trace */
  stack?: string;
  /** Handler that failed */
  handlerName: string;
  /** Number of retry attempts */
  retryCount: number;
  /** When the event was moved to DLQ */
  deadAt: string;
  /** Event type */
  eventType: EventType;
}

// ─── Event Bus Configuration ─────────────────────────────────────────────────
export interface EventBusConfig {
  /** Redis URL for pub/sub mode */
  redisUrl?: string;
  /** Key prefix for Redis channels */
  prefix?: string;
  /** Enable in-memory fallback when Redis is unavailable */
  fallbackToMemory?: boolean;
  /** Enable event persistence for replay */
  persistEvents?: boolean;
  /** Maximum events to keep in memory buffer */
  memoryBufferMaxSize?: number;
  /** Dead letter queue key */
  dlqKey?: string;
  /** Enable event versioning validation */
  enableVersioning?: boolean;
  /** Default subscription options */
  defaultSubscriptionOptions?: SubscriptionOptions;
}

// ─── Job Queue Types ─────────────────────────────────────────────────────────
export type JobPriority = 'critical' | 'high' | 'normal' | 'low';

export type JobStatus =
  | 'waiting'
  | 'active'
  | 'completed'
  | 'failed'
  | 'delayed'
  | 'paused'
  | 'cancelled';

export interface Job<T = unknown> {
  /** Unique job ID */
  id: string;
  /** Job name/type */
  name: string;
  /** Queue name */
  queue: string;
  /** Job payload data */
  data: T;
  /** Job priority */
  priority: JobPriority;
  /** Current status */
  status: JobStatus;
  /** Number of attempts */
  attempts: number;
  /** Maximum allowed attempts */
  maxAttempts: number;
  /** Timestamp when job was created */
  createdAt: string;
  /** Timestamp when job should be processed */
  processAt?: string;
  /** Timestamp when job started processing */
  startedAt?: string;
  /** Timestamp when job completed */
  completedAt?: string;
  /** Timestamp when job failed */
  failedAt?: string;
  /** Error message from last failure */
  error?: string;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Result data from job execution */
  result?: unknown;
  /** Correlation ID for tracing */
  correlationId?: string;
  /** Backoff strategy */
  backoff?: {
    type: 'exponential' | 'fixed' | 'linear';
    delay: number;
  };
}

export interface JobDefinition<T = unknown> {
  /** Job name */
  name: string;
  /** Queue name */
  queue: string;
  /** Handler function */
  handler: (job: Job<T>, progress?: (pct: number) => void) => Promise<unknown>;
  /** Default priority */
  priority?: JobPriority;
  /** Maximum attempts */
  maxAttempts?: number;
  /** Backoff configuration */
  backoff?: Job<T>['backoff'];
  /** Job timeout in ms */
  timeout?: number;
  /** Concurrency limit for this job type */
  concurrency?: number;
}

export interface JobSchedule {
  /** Schedule ID */
  id: string;
  /** Job name */
  jobName: string;
  /** Cron expression or interval in ms */
  pattern: string | number;
  /** Job data */
  data?: unknown;
  /** Whether the schedule is active */
  active: boolean;
  /** Last run timestamp */
  lastRun?: string;
  /** Next run timestamp */
  nextRun?: string;
}

// ─── Event Store (for persistence & replay) ──────────────────────────────────
export interface StoredEvent {
  /** Event ID */
  id: string;
  /** Serialized event envelope */
  event: string; // JSON stringified EventEnvelope
  /** Event type for indexing */
  eventType: EventType;
  /** Event category */
  category: EventCategory;
  /** Timestamp */
  timestamp: string;
  /** Serialized with position for ordering */
  position: number;
}

// ─── Health Status ───────────────────────────────────────────────────────────
export interface EventBusHealth {
  /** Whether the event bus is connected */
  connected: boolean;
  /** Connection mode */
  mode: 'redis' | 'memory';
  /** Number of active subscribers */
  subscribers: number;
  /** Number of active subscriptions */
  subscriptions: number;
  /** Events processed in the current window */
  eventsProcessed: number;
  /** Events failed in the current window */
  eventsFailed: number;
  /** Dead letter queue size */
  dlqSize: number;
  /** Average processing time in ms */
  avgProcessingTime: number;
  /** Memory usage estimate in bytes */
  memoryUsage: number;
  /** Uptime in seconds */
  uptime: number;
  /** Last error timestamp */
  lastError?: string;
}

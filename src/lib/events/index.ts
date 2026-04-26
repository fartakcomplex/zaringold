/**
 * @module events
 * @description Event-driven architecture barrel export for the ZarinGold platform.
 *
 * This module provides the complete event system including:
 * - EventBus: Core pub/sub bus (Redis + in-memory fallback)
 * - EventPublisher: Typed event publishing with retry
 * - EventBusSubscriber: Pattern-based subscriptions with middleware
 * - JobQueue: Redis-based job queue system
 * - Event handlers for all domain modules
 * - Middleware for logging, metrics, retry, and validation
 *
 * @example
 * ```typescript
 * import { createEventSystem } from '@/lib/events';
 *
 * // Initialize the event system
 * const { publisher, subscriber, bus, queue } = await createEventSystem();
 *
 * // Publish an event
 * await publisher.publish('trading.gold.buy.completed', { orderId: '...', userId: '...' });
 *
 * // Subscribe to events
 * await subscriber.subscribe('trading.*', async (event) => {
 *   console.log('Trading event:', event.metadata.type);
 * });
 * ```
 */

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  EventCategory,
  EventEnvelope,
  EventBusConfig,
  EventBusHealth,
  EventHandler,
  EventHandlerRegistration,
  EventMetadata,
  EventMiddleware,
  EventPriority,
  EventType,
  Job,
  JobDefinition,
  JobPriority,
  JobSchedule,
  JobStatus,
  PublishOptions,
  SubscriptionOptions,
  DeadLetterEvent,
  StoredEvent,
  EventReplayOptions,
} from './types';

export {
  EVENT_CATEGORIES,
  TRADING_EVENTS,
  WALLET_EVENTS,
  PAYMENT_EVENTS,
  USER_EVENTS,
  NOTIFICATION_EVENTS,
  GAMIFICATION_EVENTS,
  INSURANCE_EVENTS,
  SYSTEM_EVENTS,
  ALL_EVENTS,
  EVENT_PRIORITY,
} from './types';

// ─── Core ────────────────────────────────────────────────────────────────────
export { EventBus } from './event-bus';
export { EventPublisher } from './publisher';
export { EventBusSubscriber } from './subscriber';
export { JobQueue } from './queue';
export type { JobQueueConfig } from './queue';

// ─── Handlers ────────────────────────────────────────────────────────────────
export {
  getTradingHandlerRegistrations,
  handleGoldBuyCompleted,
  handleGoldSellCompleted,
  handleGoldPriceUpdated,
} from './handlers/trading.handlers';

export {
  getWalletHandlerRegistrations,
  handleDepositVerified,
  handleWithdrawalCreated,
  handleBalanceUpdated,
} from './handlers/wallet.handlers';

export {
  getPaymentHandlerRegistrations,
  handlePaymentCreated,
  handlePaymentVerified,
  handlePaymentFailed,
  handlePaymentRefunded,
} from './handlers/payment.handlers';

export {
  getNotificationHandlerRegistrations,
  handleEmailSent,
  handleSmsSent,
  handlePushSent,
  handleInAppCreated,
} from './handlers/notification.handlers';

export {
  getGamificationHandlerRegistrations,
  handleCheckinPerformed,
  handleXPEarned,
  handleLevelUp,
  handleAchievementUnlocked,
} from './handlers/gamification.handlers';

export {
  getAnalyticsHandlerRegistrations,
  flushMetrics,
  getAggregatedMetrics,
} from './handlers/analytics.handlers';

// ─── Middleware ───────────────────────────────────────────────────────────────
export {
  createLoggingMiddleware,
  loggingMiddleware,
  type LogTransport,
  type LoggingMiddlewareOptions,
} from './middleware/logging.middleware';
export type { ConsoleLogTransport } from './middleware/logging.middleware';

export {
  createMetricsMiddleware,
  metricsMiddleware,
  MetricsCollector,
  getGlobalMetricsCollector,
  type MetricsMiddlewareOptions,
} from './middleware/metrics.middleware';

export {
  createRetryMiddleware,
  retryMiddleware,
  type RetryMiddlewareOptions,
} from './middleware/retry.middleware';

export {
  createValidationMiddleware,
  validationMiddleware,
  registerSchema,
  unregisterSchema,
  getSchema,
  type ValidationSchema,
  type ValidationMiddlewareOptions,
} from './middleware/validation.middleware';

// ─── Factory Function ────────────────────────────────────────────────────────

import { EventBus } from './event-bus';
import { EventPublisher } from './publisher';
import { EventBusSubscriber } from './subscriber';
import { JobQueue } from './queue';
import { loggingMiddleware } from './middleware/logging.middleware';
import { metricsMiddleware } from './middleware/metrics.middleware';
import { retryMiddleware } from './middleware/retry.middleware';
import { validationMiddleware } from './middleware/validation.middleware';
import { getTradingHandlerRegistrations } from './handlers/trading.handlers';
import { getWalletHandlerRegistrations } from './handlers/wallet.handlers';
import { getPaymentHandlerRegistrations } from './handlers/payment.handlers';
import { getNotificationHandlerRegistrations } from './handlers/notification.handlers';
import { getGamificationHandlerRegistrations } from './handlers/gamification.handlers';
import { getAnalyticsHandlerRegistrations } from './handlers/analytics.handlers';
import type { EventBusConfig } from './types';
import type { JobQueueConfig } from './queue';

/**
 * Event system initialization result.
 */
export interface EventSystem {
  /** The core event bus */
  bus: EventBus;
  /** Typed event publisher */
  publisher: EventPublisher;
  /** Pattern-based event subscriber */
  subscriber: EventBusSubscriber;
  /** Job queue system */
  queue: JobQueue;
}

/**
 * Create and initialize the complete event system.
 *
 * Sets up the event bus, publisher, subscriber, job queue,
 * and registers all domain handlers with default middleware.
 *
 * @param eventBusConfig - Configuration for the event bus
 * @param jobQueueConfig - Configuration for the job queue
 * @returns Fully initialized event system
 */
export async function createEventSystem(
  eventBusConfig?: EventBusConfig,
  jobQueueConfig?: JobQueueConfig,
): Promise<EventSystem> {
  // 1. Create and initialize event bus
  const bus = EventBus.getInstance(eventBusConfig);
  await bus.initialize();
  bus.registerSubscriber('main');

  // 2. Create publisher
  const publisher = new EventPublisher(bus, {
    source: 'api-server',
    retryAttempts: 3,
  });

  // 3. Create subscriber with global middleware
  const subscriber = new EventBusSubscriber(bus);
  subscriber.use(loggingMiddleware);
  subscriber.use(metricsMiddleware);
  subscriber.use(retryMiddleware);
  subscriber.use(validationMiddleware);

  // 4. Register all domain handlers
  const allHandlers = [
    ...getTradingHandlerRegistrations(),
    ...getWalletHandlerRegistrations(),
    ...getPaymentHandlerRegistrations(),
    ...getNotificationHandlerRegistrations(),
    ...getGamificationHandlerRegistrations(),
    ...getAnalyticsHandlerRegistrations(),
  ];

  for (const handler of allHandlers) {
    await subscriber.subscribe(handler.pattern, handler.handler, {
      errorIsolation: true,
    });
  }

  console.log(
    `[Events] Initialized with ${allHandlers.length} handlers ` +
    `(${bus.getMode()} mode)`,
  );

  // 5. Create and initialize job queue
  const queue = JobQueue.getInstance(jobQueueConfig);
  await queue.initialize();

  return { bus, publisher, subscriber, queue };
}

/**
 * Gracefully shut down the entire event system.
 */
export async function shutdownEventSystem(system: EventSystem): Promise<void> {
  console.log('[Events] Shutting down event system...');
  await system.subscriber.shutdown(30000);
  await system.queue.stop(30000);
  await system.bus.destroy();
  console.log('[Events] Event system shut down complete');
}

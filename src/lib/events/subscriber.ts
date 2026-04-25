/**
 * @module events/subscriber
 * @description Pattern-based event subscriber for the ZarinGold platform.
 *
 * Features:
 * - Wildcard pattern subscriptions (e.g., "trading.*", "*.created")
 * - Middleware chain for event processing (logging, metrics, retry, validation)
 * - Concurrent handler execution with configurable limits
 * - Error isolation per handler (one failure doesn't block others)
 * - Graceful shutdown with in-flight event draining
 */

import type {
  EventEnvelope,
  EventHandler,
  EventHandlerRegistration,
  EventMiddleware,
  EventType,
  SubscriptionOptions,
  MiddlewareContext,
  DeadLetterEvent,
} from './types';
import { EventBus } from './event-bus';

// ─── Active Subscription Tracker ─────────────────────────────────────────────
interface ActiveSubscription {
  pattern: string;
  name: string;
  handler: EventHandler;
  middlewares: EventMiddleware[];
  options: Required<SubscriptionOptions>;
  activeCount: number;
  totalProcessed: number;
  totalFailed: number;
}

// ─── EventBusSubscriber Class ────────────────────────────────────────────────

export class EventBusSubscriber {
  private bus: EventBus;
  private subscriptions: Map<string, ActiveSubscription> = new Map();
  private activeHandlers: Set<Promise<void>> = new Set();
  private _shuttingDown = false;
  private globalMiddlewares: EventMiddleware[] = [];

  /**
   * Create a new EventBusSubscriber.
   * @param bus - The EventBus instance to subscribe to
   */
  constructor(bus: EventBus) {
    this.bus = bus;
  }

  /**
   * Register a global middleware that runs for all subscriptions.
   * Global middlewares run before subscription-specific middlewares.
   */
  use(middleware: EventMiddleware): void {
    this.globalMiddlewares.push(middleware);
  }

  /**
   * Subscribe to events matching a pattern.
   *
   * @param pattern - Event pattern with wildcard support (e.g., "trading.*", "*.created")
   * @param handler - The event handler function
   * @param options - Subscription options
   * @returns Subscription ID for later unsubscribing
   *
   * @example
   * ```typescript
   * // Subscribe to all trading events
   * const subId = subscriber.subscribe('trading.*', async (event) => {
   *   console.log('Trading event:', event.metadata.type);
   * });
   *
   * // Subscribe with middlewares
   * const subId = subscriber.subscribe(
   *   'payment.created',
   *   handlePaymentCreated,
   *   { middlewares: [loggingMiddleware, retryMiddleware] }
   * );
   * ```
   */
  async subscribe(
    pattern: string,
    handler: EventHandler,
    options?: SubscriptionOptions & { middlewares?: EventMiddleware[] },
  ): Promise<string> {
    const subId = `${pattern}:${handler.name || 'anonymous'}:${Date.now()}`;
    const mergedOptions: Required<SubscriptionOptions> = {
      concurrency: options?.concurrency ?? 10,
      errorIsolation: options?.errorIsolation ?? true,
      maxRetries: options?.maxRetries ?? 3,
      retryBaseDelay: options?.retryBaseDelay ?? 1000,
      retryMaxDelay: options?.retryMaxDelay ?? 30000,
      startFromEventId: options?.startFromEventId,
      timeout: options?.timeout ?? 30000,
    };

    const middlewares = [
      ...this.globalMiddlewares,
      ...(options?.middlewares ?? []),
    ];

    // Create the wrapped handler that applies middleware chain
    const wrappedHandler = this.createWrappedHandler(
      handler,
      middlewares,
      mergedOptions,
      pattern,
    );

    const subscription: ActiveSubscription = {
      pattern,
      name: handler.name || 'anonymous',
      handler,
      middlewares,
      options: mergedOptions,
      activeCount: 0,
      totalProcessed: 0,
      totalFailed: 0,
    };

    this.subscriptions.set(subId, subscription);

    // Register with the event bus
    await this.bus.addHandler({
      pattern,
      handler: wrappedHandler,
      name: subId,
      middlewares,
    });

    return subId;
  }

  /**
   * Unsubscribe from events.
   * @param subscriptionId - The subscription ID returned from subscribe()
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      await this.bus.removeHandler(subscription.pattern, subscriptionId);
      this.subscriptions.delete(subscriptionId);
    }
  }

  /**
   * Create a wrapped handler that applies the middleware chain,
   * concurrency limiting, error isolation, and retry logic.
   */
  private createWrappedHandler(
    handler: EventHandler,
    middlewares: EventMiddleware[],
    options: Required<SubscriptionOptions>,
    pattern: string,
  ): EventHandler {
    return async (event: EventEnvelope) => {
      if (this._shuttingDown) return;

      // Check concurrency limit
      const sub = this.findSubscription(pattern);
      if (sub && sub.activeCount >= options.concurrency) {
        console.warn(
          `[Subscriber] Concurrency limit reached for ${pattern}, ` +
          `dropping event ${event.metadata.eventId}`,
        );
        return;
      }

      const handlerPromise = this.executeWithMiddleware(
        event,
        handler,
        middlewares,
        options,
        pattern,
      );

      this.activeHandlers.add(handlerPromise);
      handlerPromise.finally(() => {
        this.activeHandlers.delete(handlerPromise);
      });
    };
  }

  /**
   * Execute handler with middleware chain.
   */
  private async executeWithMiddleware(
    event: EventEnvelope,
    handler: EventHandler,
    middlewares: EventMiddleware[],
    options: Required<SubscriptionOptions>,
    pattern: string,
  ): Promise<void> {
    const sub = this.findSubscription(pattern);
    if (sub) sub.activeCount++;

    try {
      // Build middleware chain
      const chain = this.buildMiddlewareChain(
        middlewares,
        handler,
        options,
        pattern,
      );

      // Execute with timeout
      await Promise.race([
        chain(event, async () => {}),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Handler timeout after ${options.timeout}ms`)),
            options.timeout,
          ),
        ),
      ]);

      if (sub) {
        sub.totalProcessed++;
        sub.activeCount--;
      }
    } catch (error) {
      if (sub) {
        sub.totalFailed++;
        sub.activeCount--;
      }

      // Retry with exponential backoff
      if (options.errorIsolation) {
        await this.handleHandlerError(event, error as Error, handler, options, pattern);
      } else {
        // Re-throw to let other handlers know
        throw error;
      }
    }
  }

  /**
   * Build the middleware chain.
   * Each middleware receives the event and a `next` function.
   */
  private buildMiddlewareChain(
    middlewares: EventMiddleware[],
    finalHandler: EventHandler,
    options: Required<SubscriptionOptions>,
    pattern: string,
  ): EventMiddleware {
    // Build chain from right to left
    let chain: EventMiddleware = async (_event, _next) => {
      await finalHandler(_event);
    };

    // Wrap with middlewares in reverse order
    for (let i = middlewares.length - 1; i >= 0; i--) {
      const middleware = middlewares[i];
      const prevChain = chain;
      chain = async (event, next) => {
        await middleware(event, prevChain.bind(null, event));
      };
    }

    return chain;
  }

  /**
   * Handle a handler error with retry logic.
   */
  private async handleHandlerError(
    event: EventEnvelope,
    error: Error,
    handler: EventHandler,
    options: Required<SubscriptionOptions>,
    pattern: string,
  ): Promise<void> {
    let retryCount = 0;

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      const delay = Math.min(
        options.retryBaseDelay * Math.pow(2, attempt - 1),
        options.retryMaxDelay,
      );

      console.warn(
        `[Subscriber] Handler for ${pattern} failed (attempt ${attempt}/${options.maxRetries}), ` +
        `retrying in ${delay}ms: ${error.message}`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));

      try {
        await handler(event);
        // Success on retry - clear failure
        const sub = this.findSubscription(pattern);
        if (sub) {
          sub.totalFailed--;
          sub.totalProcessed++;
        }
        return;
      } catch (retryError) {
        retryCount++;
        if (attempt === options.maxRetries) {
          // All retries exhausted, move to DLQ
          console.error(
            `[Subscriber] Handler for ${pattern} failed after ${options.maxRetries} retries. ` +
            `Moving to DLQ: ${event.metadata.eventId}`,
          );

          await this.bus.addToDLQ({
            event,
            error: (retryError as Error).message,
            stack: (retryError as Error).stack,
            handlerName: handler.name || 'anonymous',
            retryCount,
            deadAt: new Date().toISOString(),
            eventType: event.metadata.type,
          });
        }
      }
    }
  }

  /**
   * Find a subscription by pattern.
   */
  private findSubscription(pattern: string): ActiveSubscription | undefined {
    let found: ActiveSubscription | undefined;
    this.subscriptions.forEach((sub) => {
      if (sub.pattern === pattern && !found) found = sub;
    });
    return found;
  }

  /**
   * Get statistics for all subscriptions.
   */
  getSubscriptionStats(): Array<{
    pattern: string;
    name: string;
    activeCount: number;
    totalProcessed: number;
    totalFailed: number;
  }> {
    return Array.from(this.subscriptions.values()).map((sub) => ({
      pattern: sub.pattern,
      name: sub.name,
      activeCount: sub.activeCount,
      totalProcessed: sub.totalProcessed,
      totalFailed: sub.totalFailed,
    }));
  }

  /**
   * Get the number of active in-flight handlers.
   */
  getActiveHandlerCount(): number {
    return this.activeHandlers.size;
  }

  /**
   * Get the number of active subscriptions.
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Gracefully shut down the subscriber.
   * Waits for all in-flight handlers to complete before resolving.
   * @param timeout - Maximum time to wait in ms (default: 30000)
   */
  async shutdown(timeout = 30000): Promise<void> {
    this._shuttingDown = true;
    console.log(
      `[Subscriber] Shutting down, waiting for ${this.activeHandlers.size} active handlers...`,
    );

    const start = Date.now();
    while (this.activeHandlers.size > 0 && Date.now() - start < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (this.activeHandlers.size > 0) {
      console.warn(
        `[Subscriber] Timeout after ${timeout}ms, ` +
        `${this.activeHandlers.size} handlers still active`,
      );
    }

    // Unsubscribe all
    const subIds = Array.from(this.subscriptions.keys());
    for (const id of subIds) {
      try {
        await this.unsubscribe(id);
      } catch {
        // Ignore unsubscribe errors during shutdown
      }
    }

    this.subscriptions.clear();
    this.activeHandlers.clear();
    console.log('[Subscriber] Shutdown complete');
  }

  /**
   * Remove all subscriptions and reset state.
   */
  async reset(): Promise<void> {
    const resetIds = Array.from(this.subscriptions.keys());
    for (const id of resetIds) {
      try {
        await this.unsubscribe(id);
      } catch {
        // Ignore
      }
    }
    this.subscriptions.clear();
    this._shuttingDown = false;
  }
}

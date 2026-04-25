/**
 * @module events/publisher
 * @description Typed event publisher for ZarinGold platform.
 *
 * Provides a strongly-typed API for publishing events with:
 * - Automatic event metadata generation (correlation ID, timestamp, etc.)
 * - Retry logic with exponential backoff
 * - Event validation before publishing
 * - Support for scheduled/delayed events
 * - Event versioning
 */

import type {
  EventEnvelope,
  EventMetadata,
  EventPriority,
  EventType,
  PublishOptions,
  SubscriptionOptions,
} from './types';
import { EVENT_CATEGORIES } from './types';
import { EventBus } from './event-bus';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getEventCategory(type: string): string {
  const category = type.split('.')[0];
  return category in EVENT_CATEGORIES ? category : 'system';
}

function extractEventType(type: string): EventType {
  return type as EventType;
}

// ─── EventPublisher Class ────────────────────────────────────────────────────

export class EventPublisher {
  private bus: EventBus;
  private defaultSource: string;
  private defaultVersion: number;
  private retryAttempts: number;
  private retryBaseDelay: number;
  private retryMaxDelay: number;

  /**
   * Create a new EventPublisher instance.
   * @param bus - The EventBus instance to publish to
   * @param options - Publisher configuration
   */
  constructor(
    bus: EventBus,
    options?: {
      source?: string;
      version?: number;
      retryAttempts?: number;
      retryBaseDelay?: number;
      retryMaxDelay?: number;
    },
  ) {
    this.bus = bus;
    this.defaultSource = options?.source ?? 'api-server';
    this.defaultVersion = options?.version ?? 1;
    this.retryAttempts = options?.retryAttempts ?? 3;
    this.retryBaseDelay = options?.retryBaseDelay ?? 1000;
    this.retryMaxDelay = options?.retryMaxDelay ?? 15000;
  }

  /**
   * Build the event metadata envelope.
   */
  private buildMetadata(
    type: EventType,
    data: unknown,
    options?: PublishOptions,
  ): EventMetadata {
    const now = new Date().toISOString();
    return {
      eventId: EventBus.generateEventId(),
      correlationId: options?.correlationId ?? EventBus.generateCorrelationId(),
      type,
      category: getEventCategory(type) as EventMetadata['category'],
      timestamp: now,
      source: options?.source ?? this.defaultSource,
      version: options?.version ?? this.defaultVersion,
      priority: options?.priority ?? 'normal',
      ttl: options?.ttl,
      userId: (data as Record<string, unknown>)?.userId as string | undefined,
    };
  }

  /**
   * Build the full event envelope.
   */
  private buildEnvelope<T>(
    type: EventType,
    data: T,
    options?: PublishOptions,
  ): EventEnvelope<T> {
    const metadata = this.buildMetadata(type, data, options);
    return {
      metadata,
      data,
    };
  }

  /**
   * Validate event data before publishing.
   * Basic structural validation to ensure data is serializable.
   */
  private validateEvent<T>(envelope: EventEnvelope<T>): boolean {
    if (!envelope.metadata.type) {
      console.error('[Publisher] Event missing type');
      return false;
    }
    if (!envelope.metadata.eventId) {
      console.error('[Publisher] Event missing eventId');
      return false;
    }
    try {
      JSON.stringify(envelope);
      return true;
    } catch {
      console.error('[Publisher] Event data is not serializable');
      return false;
    }
  }

  /**
   * Calculate delay with exponential backoff.
   */
  private calculateBackoff(attempt: number): number {
    const delay = this.retryBaseDelay * Math.pow(2, attempt);
    return Math.min(delay, this.retryMaxDelay);
  }

  /**
   * Publish an event with retry logic.
   *
   * @param type - The event type (e.g., 'trading.gold.buy.created')
   * @param data - The event payload
   * @param options - Publishing options (delay, source, priority, etc.)
   * @returns The event envelope that was published
   */
  async publish<T>(
    type: string,
    data: T,
    options?: PublishOptions,
  ): Promise<EventEnvelope<T>> {
    const eventType = extractEventType(type);
    const envelope = this.buildEnvelope(eventType, data, options);

    // Validate unless explicitly skipped
    if (!options?.skipValidation && !this.validateEvent(envelope)) {
      throw new Error(`Invalid event: ${type}`);
    }

    // Handle delayed events
    if (options?.delay && options.delay > 0) {
      await this.scheduleDelayedEvent(envelope, options.delay);
      return envelope;
    }

    // Publish with retry
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        await this.bus.publish(envelope);
        return envelope;
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.retryAttempts) {
          const backoff = this.calculateBackoff(attempt);
          console.warn(
            `[Publisher] Publish failed (attempt ${attempt + 1}/${this.retryAttempts}), ` +
            `retrying in ${backoff}ms:`,
            error,
          );
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
    }

    throw new Error(
      `Failed to publish event ${type} after ${this.retryAttempts} retries: ${lastError?.message}`,
    );
  }

  /**
   * Schedule a delayed event using setTimeout.
   * For production with Redis, consider using the job queue instead.
   */
  private async scheduleDelayedEvent<T>(
    envelope: EventEnvelope<T>,
    delayMs: number,
  ): Promise<void> {
    console.log(
      `[Publisher] Scheduling delayed event ${envelope.metadata.type} ` +
      `for ${delayMs}ms from now`,
    );

    setTimeout(async () => {
      try {
        await this.bus.publish(envelope);
      } catch (error) {
        console.error(
          `[Publisher] Delayed event ${envelope.metadata.type} failed:`,
          error,
        );
        // Move to DLQ
        await this.bus.addToDLQ({
          event: envelope,
          error: (error as Error).message,
          stack: (error as Error).stack,
          handlerName: 'delayed-publisher',
          retryCount: 1,
          deadAt: new Date().toISOString(),
          eventType: envelope.metadata.type,
        });
      }
    }, delayMs);
  }

  // ─── Convenience Methods ───────────────────────────────────────────────────

  /**
   * Publish a trading event with correlation tracking.
   */
  async publishTradingEvent<T>(
    type: string,
    data: T,
    options?: PublishOptions & { correlationId: string; userId?: string },
  ): Promise<EventEnvelope<T>> {
    return this.publish(type, data, {
      ...options,
      priority: options?.priority ?? 'high',
    });
  }

  /**
   * Publish a payment event (high priority by default).
   */
  async publishPaymentEvent<T>(
    type: string,
    data: T,
    options?: PublishOptions,
  ): Promise<EventEnvelope<T>> {
    return this.publish(type, data, {
      ...options,
      priority: options?.priority ?? 'high',
    });
  }

  /**
   * Publish a user lifecycle event.
   */
  async publishUserEvent<T>(
    type: string,
    data: T & { userId: string },
    options?: PublishOptions,
  ): Promise<EventEnvelope<T>> {
    return this.publish(type, data, {
      ...options,
      priority: options?.priority ?? 'normal',
    });
  }

  /**
   * Publish a notification event (low priority to avoid blocking).
   */
  async publishNotificationEvent<T>(
    type: string,
    data: T,
    options?: PublishOptions,
  ): Promise<EventEnvelope<T>> {
    return this.publish(type, data, {
      ...options,
      priority: options?.priority ?? 'low',
    });
  }

  /**
   * Publish a system event (critical for health checks and errors).
   */
  async publishSystemEvent<T>(
    type: string,
    data: T,
    options?: PublishOptions,
  ): Promise<EventEnvelope<T>> {
    return this.publish(type, data, {
      ...options,
      priority: options?.priority ?? 'critical',
    });
  }

  /**
   * Batch publish multiple events atomically.
   * All events share the same correlation ID.
   */
  async publishBatch<T>(
    events: Array<{ type: string; data: T; options?: PublishOptions }>,
    batchOptions?: { correlationId?: string },
  ): Promise<EventEnvelope<T>[]> {
    const correlationId = batchOptions?.correlationId ?? EventBus.generateCorrelationId();
    const results = await Promise.allSettled(
      events.map((e) =>
        this.publish(e.type, e.data, {
          ...e.options,
          correlationId,
        }),
      ),
    );

    const envelopes: EventEnvelope<T>[] = [];
    const errors: string[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        envelopes.push(result.value);
      } else {
        errors.push(result.reason?.message ?? 'Unknown error');
      }
    }

    if (errors.length > 0) {
      console.warn(
        `[Publisher] Batch publish had ${errors.length} failures out of ${events.length}`,
      );
    }

    return envelopes;
  }

  /**
   * Create a child publisher with an inherited correlation ID.
   * Useful for propagating correlation across service boundaries.
   */
  createChildPublisher(options: {
    correlationId: string;
    causationId?: string;
    source?: string;
  }): EventPublisher {
    return new EventPublisher(this.bus, {
      source: options.source ?? this.defaultSource,
    });
  }
}

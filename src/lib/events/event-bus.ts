/**
 * @module events/event-bus
 * @description Core Event Bus implementation for ZarinGold platform.
 *
 * Supports two modes of operation:
 * - **Production**: Redis-based pub/sub for distributed event propagation
 * - **Development**: In-memory EventEmitter for local development and testing
 *
 * Features:
 * - Async event handler execution
 * - Event replay capability (requires persistence enabled)
 * - Dead-letter queue for failed events
 * - Event versioning support
 * - Graceful shutdown with in-flight event draining
 */

import type {
  EventEnvelope,
  EventBusConfig,
  EventBusHealth,
  EventHandlerRegistration,
  EventCategory,
  DeadLetterEvent,
  StoredEvent,
  EventType,
} from './types';

// ─── UUID Helper ─────────────────────────────────────────────────────────────
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── In-Memory Event Bus Adapter ─────────────────────────────────────────────
class InMemoryEventBus {
  private handlers: Map<string, Set<EventHandlerRegistration>> = new Map();
  private eventBuffer: StoredEvent[] = [];
  private positionCounter = 0;
  private dlq: DeadLetterEvent[] = [];
  private _eventsProcessed = 0;
  private _eventsFailed = 0;

  constructor(private bufferSize: number) {}

  get dlqSize(): number {
    return this.dlq.length;
  }

  get eventsProcessed(): number {
    return this._eventsProcessed;
  }

  get eventsFailed(): number {
    return this._eventsFailed;
  }

  addHandler(registration: EventHandlerRegistration): void {
    const { pattern } = registration;
    if (!this.handlers.has(pattern)) {
      this.handlers.set(pattern, new Set());
    }
    this.handlers.get(pattern)!.add(registration);
  }

  removeHandler(pattern: string, name: string): void {
    const set = this.handlers.get(pattern);
    if (set) {
      set.forEach((reg) => {
        if (reg.name === name) set.delete(reg);
      });
      if (set.size === 0) {
        this.handlers.delete(pattern);
      }
    }
  }

  async publish(envelope: EventEnvelope): Promise<void> {
    // Store event for replay
    this.positionCounter++;
    this.eventBuffer.push({
      id: envelope.metadata.eventId,
      event: JSON.stringify(envelope),
      eventType: envelope.metadata.type,
      category: envelope.metadata.category,
      timestamp: envelope.metadata.timestamp,
      position: this.positionCounter,
    });

    // Trim buffer if needed
    if (this.eventBuffer.length > this.bufferSize) {
      this.eventBuffer = this.eventBuffer.slice(-this.bufferSize);
    }

    // Match handlers by pattern
    const matchedHandlers = this.matchHandlers(envelope.metadata.type);
    const results = await Promise.allSettled(
      matchedHandlers.map((reg) => reg.handler(envelope)),
    );

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        this._eventsProcessed++;
      } else {
        this._eventsFailed++;
      }
    });
  }

  private matchHandlers(eventType: EventType): EventHandlerRegistration[] {
    const matched: EventHandlerRegistration[] = [];
    this.handlers.forEach((regs, pattern) => {
      if (this.matchPattern(pattern, eventType)) {
        regs.forEach((reg) => matched.push(reg));
      }
    });
    return matched;
  }

  private matchPattern(pattern: string, eventType: string): boolean {
    if (pattern === '*' || pattern === eventType) return true;
    const regex = new RegExp(
      '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '[^.]+') + '$',
    );
    return regex.test(eventType);
  }

  addToDLQ(deadEvent: DeadLetterEvent): void {
    this.dlq.push(deadEvent);
  }

  getDLQEvents(limit = 100): DeadLetterEvent[] {
    return this.dlq.slice(-limit);
  }

  getReplayEvents(options?: {
    from?: string;
    to?: string;
    pattern?: string;
    category?: EventCategory;
    limit?: number;
  }): EventEnvelope[] {
    let events = [...this.eventBuffer];

    if (options?.from) {
      events = events.filter((e) => e.timestamp >= options.from!);
    }
    if (options?.to) {
      events = events.filter((e) => e.timestamp <= options.to!);
    }
    if (options?.category) {
      events = events.filter((e) => e.category === options.category);
    }
    if (options?.pattern) {
      const regex = new RegExp(
        '^' + options.pattern.replace(/\./g, '\\.').replace(/\*/g, '[^.]+') + '$',
      );
      events = events.filter((e) => regex.test(e.eventType));
    }
    if (options?.limit) {
      events = events.slice(-options.limit);
    }

    return events.map((e) => JSON.parse(e.event) as EventEnvelope);
  }

  clearDLQ(): number {
    const count = this.dlq.length;
    this.dlq = [];
    return count;
  }

  getMemoryUsage(): number {
    return JSON.stringify(this.eventBuffer).length + JSON.stringify(this.dlq).length;
  }

  getSubscriptionCount(): number {
    let count = 0;
    this.handlers.forEach((regs) => { count += regs.size; });
    return count;
  }

  destroy(): void {
    this.handlers.clear();
    this.eventBuffer = [];
    this.dlq = [];
  }
}

// ─── Redis Event Bus Adapter ─────────────────────────────────────────────────
class RedisEventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pubClient: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private subClient: any = null;
  private handlers: Map<string, Set<EventHandlerRegistration>> = new Map();
  private connected = false;
  private _eventsProcessed = 0;
  private _eventsFailed = 0;

  constructor(
    private redisUrl: string,
    private prefix: string,
    private dlqKey: string,
  ) {}

  get dlqSize(): number {
    return 0;
  }

  get eventsProcessed(): number {
    return this._eventsProcessed;
  }

  get eventsFailed(): number {
    return this._eventsFailed;
  }

  get isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Redis = require('ioredis');
      const RedisCtor = Redis.default ?? Redis;

      this.pubClient = new RedisCtor(this.redisUrl, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });

      this.subClient = new RedisCtor(this.redisUrl, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });

      await this.pubClient.connect();
      await this.subClient.connect();

      // Handle incoming messages
      this.subClient.on('message', (_channel: string, message: string) => {
        this.handleMessage(message);
      });

      this.connected = true;
    } catch (error) {
      console.error('[EventBus] Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.pubClient?.quit();
      await this.subClient?.quit();
    } catch {
      // Ignore disconnect errors
    }
    this.connected = false;
  }

  async subscribe(registration: EventHandlerRegistration): Promise<void> {
    if (!this.handlers.has(registration.pattern)) {
      this.handlers.set(registration.pattern, new Set());
      const channel = `${this.prefix}:${registration.pattern.replace(/\*/g, '__wildcard__')}`;
      try {
        await this.subClient?.subscribe(channel);
      } catch {
        // Channel might already be subscribed
      }
    }
    this.handlers.get(registration.pattern)!.add(registration);
  }

  async unsubscribe(pattern: string, name: string): Promise<void> {
    const set = this.handlers.get(pattern);
    if (set) {
      set.forEach((reg) => {
        if (reg.name === name) set.delete(reg);
      });
      if (set.size === 0) {
        this.handlers.delete(pattern);
        const channel = `${this.prefix}:${pattern.replace(/\*/g, '__wildcard__')}`;
        try {
          await this.subClient?.unsubscribe(channel);
        } catch {
          // Ignore
        }
      }
    }
  }

  async publish(envelope: EventEnvelope): Promise<void> {
    const type = envelope.metadata.type;
    const message = JSON.stringify(envelope);

    await this.pubClient?.publish(`${this.prefix}:${type}`, message);

    const category = type.split('.')[0];
    await this.pubClient?.publish(`${this.prefix}:${category}.*`, message);

    await this.pubClient?.publish(`${this.prefix}:*`, message);

    await this.storeEvent(envelope);
  }

  private async handleMessage(message: string): Promise<void> {
    try {
      const envelope = JSON.parse(message) as EventEnvelope;
      const type = envelope.metadata.type;
      const matchedHandlers = this.matchHandlers(type);

      const results = await Promise.allSettled(
        matchedHandlers.map((reg) => reg.handler(envelope)),
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          this._eventsProcessed++;
        } else {
          this._eventsFailed++;
        }
      });
    } catch (error) {
      this._eventsFailed++;
      console.error('[EventBus] Error handling message:', error);
    }
  }

  private matchHandlers(eventType: EventType): EventHandlerRegistration[] {
    const matched: EventHandlerRegistration[] = [];
    this.handlers.forEach((regs, pattern) => {
      if (this.matchPattern(pattern, eventType)) {
        regs.forEach((reg) => matched.push(reg));
      }
    });
    return matched;
  }

  private matchPattern(pattern: string, eventType: string): boolean {
    if (pattern === '*' || pattern === eventType) return true;
    const regex = new RegExp(
      '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '[^.]+') + '$',
    );
    return regex.test(eventType);
  }

  private async storeEvent(envelope: EventEnvelope): Promise<void> {
    try {
      const key = `${this.prefix}:events:stream`;
      await this.pubClient?.lpush(key, JSON.stringify({
        id: envelope.metadata.eventId,
        event: JSON.stringify(envelope),
        eventType: envelope.metadata.type,
        category: envelope.metadata.category,
        timestamp: envelope.metadata.timestamp,
      }));
      await this.pubClient?.ltrim(key, 0, 9999);
    } catch (error) {
      console.error('[EventBus] Failed to store event:', error);
    }
  }

  async addToDLQ(deadEvent: DeadLetterEvent): Promise<void> {
    try {
      await this.pubClient?.lpush(this.dlqKey, JSON.stringify(deadEvent));
    } catch (error) {
      console.error('[EventBus] Failed to add to DLQ:', error);
    }
  }

  async getDLQSize(): Promise<number> {
    try {
      return await this.pubClient?.llen(this.dlqKey) ?? 0;
    } catch {
      return 0;
    }
  }

  async getDLQEvents(limit = 100): Promise<DeadLetterEvent[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const events = await this.pubClient?.lrange(this.dlqKey, 0, limit - 1);
      return (events ?? []).map((e: string) => JSON.parse(e));
    } catch {
      return [];
    }
  }

  async getReplayEvents(options?: {
    from?: string;
    to?: string;
    pattern?: string;
    category?: EventCategory;
    limit?: number;
  }): Promise<EventEnvelope[]> {
    try {
      const key = `${this.prefix}:events:stream`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let events = await this.pubClient?.lrange(key, 0, -1) ?? [];

      const parsed = events.map((e: string) => {
        const stored = JSON.parse(e);
        return { ...stored, envelope: JSON.parse(stored.event) as EventEnvelope };
      });

      let filtered = parsed;

      if (options?.from) {
        filtered = filtered.filter((e) => e.timestamp >= options.from!);
      }
      if (options?.to) {
        filtered = filtered.filter((e) => e.timestamp <= options.to!);
      }
      if (options?.category) {
        filtered = filtered.filter((e) => e.category === options.category);
      }
      if (options?.pattern) {
        const regex = new RegExp(
          '^' + options.pattern.replace(/\./g, '\\.').replace(/\*/g, '[^.]+') + '$',
        );
        filtered = filtered.filter((e) => regex.test(e.eventType));
      }

      const sliced = options?.limit ? filtered.slice(-options.limit) : filtered;
      return sliced.map((e) => e.envelope);
    } catch (error) {
      console.error('[EventBus] Failed to get replay events:', error);
      return [];
    }
  }

  async clearDLQ(): Promise<number> {
    try {
      const size = await this.getDLQSize();
      await this.pubClient?.del(this.dlqKey);
      return size;
    } catch {
      return 0;
    }
  }

  getSubscriptionCount(): number {
    let count = 0;
    this.handlers.forEach((regs) => { count += regs.size; });
    return count;
  }

  destroy(): void {
    this.handlers.clear();
    this.pubClient = null;
    this.subClient = null;
    this.connected = false;
  }
}

// ─── Main EventBus Class ─────────────────────────────────────────────────────
export class EventBus {
  private config: Required<EventBusConfig>;
  private adapter: InMemoryEventBus | RedisEventBus;
  private mode: 'redis' | 'memory' = 'memory';
  private startTime: number;
  private _subscribers = new Set<string>();
  private _shuttingDown = false;
  private static _instance: EventBus | null = null;

  private constructor(config?: EventBusConfig) {
    this.config = {
      redisUrl: config?.redisUrl ?? process.env.REDIS_URL ?? 'redis://localhost:6379',
      prefix: config?.prefix ?? 'zaringold:events',
      fallbackToMemory: config?.fallbackToMemory ?? true,
      persistEvents: config?.persistEvents ?? false,
      memoryBufferMaxSize: config?.memoryBufferMaxSize ?? 10000,
      dlqKey: config?.dlqKey ?? 'zaringold:events:dlq',
      enableVersioning: config?.enableVersioning ?? true,
      defaultSubscriptionOptions: config?.defaultSubscriptionOptions ?? {
        concurrency: 10,
        errorIsolation: true,
        maxRetries: 3,
        retryBaseDelay: 1000,
        retryMaxDelay: 30000,
        timeout: 30000,
      },
    };

    this.startTime = Date.now();
    this.adapter = new InMemoryEventBus(this.config.memoryBufferMaxSize);
  }

  /** Get the singleton EventBus instance. */
  static getInstance(config?: EventBusConfig): EventBus {
    if (!EventBus._instance) {
      EventBus._instance = new EventBus(config);
    }
    return EventBus._instance;
  }

  /** Reset the singleton instance. Useful for testing. */
  static resetInstance(): void {
    if (EventBus._instance) {
      EventBus._instance.destroy();
      EventBus._instance = null;
    }
  }

  /**
   * Initialize the event bus and connect to Redis if configured.
   * Falls back to in-memory mode if Redis is unavailable.
   */
  async initialize(): Promise<void> {
    if (process.env.NODE_ENV === 'production' && this.config.redisUrl) {
      try {
        const redisBus = new RedisEventBus(
          this.config.redisUrl,
          this.config.prefix,
          this.config.dlqKey,
        );
        await redisBus.connect();
        this.adapter = redisBus;
        this.mode = 'redis';
        console.log('[EventBus] Connected to Redis pub/sub');
      } catch (error) {
        console.warn('[EventBus] Redis unavailable, falling back to in-memory:', error);
        if (!this.config.fallbackToMemory) {
          throw error;
        }
      }
    } else {
      console.log('[EventBus] Running in in-memory mode');
    }
  }

  /** Get the current connection mode. */
  getMode(): 'redis' | 'memory' {
    return this.mode;
  }

  /** Register a subscriber with the event bus. */
  registerSubscriber(name: string): void {
    this._subscribers.add(name);
  }

  /** Unregister a subscriber from the event bus. */
  unregisterSubscriber(name: string): void {
    this._subscribers.delete(name);
  }

  /** Publish an event to the bus. */
  async publish(envelope: EventEnvelope): Promise<void> {
    if (this._shuttingDown) {
      throw new Error('EventBus is shutting down');
    }
    await this.adapter.publish(envelope);
  }

  /** Add a handler registration to the bus. */
  async addHandler(registration: EventHandlerRegistration): Promise<void> {
    if (this.mode === 'redis') {
      await (this.adapter as RedisEventBus).subscribe(registration);
    } else {
      (this.adapter as InMemoryEventBus).addHandler(registration);
    }
  }

  /** Remove a handler from the bus. */
  async removeHandler(pattern: string, name: string): Promise<void> {
    if (this.mode === 'redis') {
      await (this.adapter as RedisEventBus).unsubscribe(pattern, name);
    } else {
      (this.adapter as InMemoryEventBus).removeHandler(pattern, name);
    }
  }

  /** Add a failed event to the dead-letter queue. */
  async addToDLQ(deadEvent: DeadLetterEvent): Promise<void> {
    if (this.mode === 'redis') {
      await (this.adapter as RedisEventBus).addToDLQ(deadEvent);
    } else {
      (this.adapter as InMemoryEventBus).addToDLQ(deadEvent);
    }
  }

  /** Get events from the dead-letter queue. */
  async getDLQEvents(limit = 100): Promise<DeadLetterEvent[]> {
    if (this.mode === 'redis') {
      return await (this.adapter as RedisEventBus).getDLQEvents(limit);
    }
    return (this.adapter as InMemoryEventBus).getDLQEvents(limit);
  }

  /** Clear all events from the dead-letter queue. */
  async clearDLQ(): Promise<number> {
    if (this.mode === 'redis') {
      return await (this.adapter as RedisEventBus).clearDLQ();
    }
    return (this.adapter as InMemoryEventBus).clearDLQ();
  }

  /** Get the size of the dead-letter queue. */
  async getDLQSize(): Promise<number> {
    if (this.mode === 'redis') {
      return await (this.adapter as RedisEventBus).getDLQSize();
    }
    return (this.adapter as InMemoryEventBus).dlqSize;
  }

  /** Replay events for debugging or recovery. */
  async getReplayEvents(options?: {
    from?: string;
    to?: string;
    pattern?: string;
    category?: EventCategory;
    limit?: number;
  }): Promise<EventEnvelope[]> {
    if (this.mode === 'redis') {
      return await (this.adapter as RedisEventBus).getReplayEvents(options);
    }
    return (this.adapter as InMemoryEventBus).getReplayEvents(options);
  }

  /** Get the health status of the event bus. */
  async getHealth(): Promise<EventBusHealth> {
    let dlqSize: number;
    if (this.mode === 'redis') {
      dlqSize = await (this.adapter as RedisEventBus).getDLQSize();
    } else {
      dlqSize = (this.adapter as InMemoryEventBus).dlqSize;
    }

    return {
      connected: this.mode === 'redis'
        ? (this.adapter as RedisEventBus).isConnected
        : true,
      mode: this.mode,
      subscribers: this._subscribers.size,
      subscriptions: this.mode === 'redis'
        ? (this.adapter as RedisEventBus).getSubscriptionCount()
        : (this.adapter as InMemoryEventBus).getSubscriptionCount(),
      eventsProcessed: this.mode === 'redis'
        ? (this.adapter as RedisEventBus).eventsProcessed
        : (this.adapter as InMemoryEventBus).eventsProcessed,
      eventsFailed: this.mode === 'redis'
        ? (this.adapter as RedisEventBus).eventsFailed
        : (this.adapter as InMemoryEventBus).eventsFailed,
      dlqSize,
      avgProcessingTime: 0,
      memoryUsage: this.mode === 'memory'
        ? (this.adapter as InMemoryEventBus).getMemoryUsage()
        : 0,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  /** Gracefully shut down the event bus. */
  async destroy(): Promise<void> {
    this._shuttingDown = true;
    if (this.mode === 'redis') {
      await (this.adapter as RedisEventBus).disconnect();
    }
    this.adapter.destroy();
    this._subscribers.clear();
    console.log('[EventBus] Shut down complete');
  }

  /** Generate a unique event ID. */
  static generateEventId(): string {
    return generateId();
  }

  /** Generate a unique correlation ID for tracing. */
  static generateCorrelationId(): string {
    return generateId();
  }
}

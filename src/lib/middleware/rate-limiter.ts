/* ═══════════════════════════════════════════════════════════════════════════
 *  rate-limiter.ts — Distributed Rate Limiter
 *  Redis-based with in-memory fallback · Sliding window, fixed window,
 *  token bucket strategies · Per-user & per-IP limiting
 * ═══════════════════════════════════════════════════════════════════════════ */

// ─── Types ─────────────────────────────────────────────────────────────────

export type RateLimitStrategy = 'fixed-window' | 'sliding-window' | 'token-bucket';

export interface RateLimitRule {
  strategy: RateLimitStrategy;
  maxRequests: number;
  windowMs: number;
  /** Token bucket only: refill rate (tokens per second) */
  refillRatePerSec?: number;
  /** Token bucket only: max burst capacity */
  burstCapacity?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  retryAfterMs?: number;
  strategy: RateLimitStrategy;
}

export interface RateLimitHeaders {
  'X-RateLimit-Limit': number;
  'X-RateLimit-Remaining': number;
  'X-RateLimit-Reset': number;
  'Retry-After'?: number;
}

export interface RouteRateConfig {
  pattern: RegExp;
  rule: RateLimitRule;
  description: string;
}

// ─── Default Route Configurations ──────────────────────────────────────────

export const DEFAULT_RATE_LIMITS: RouteRateConfig[] = [
  {
    pattern: /^\/api\/auth\//,
    rule: { strategy: 'sliding-window', maxRequests: 5, windowMs: 60_000 },
    description: 'Auth endpoints: 5 req/min (strict)',
  },
  {
    pattern: /^\/api\/payment\//,
    rule: { strategy: 'sliding-window', maxRequests: 10, windowMs: 60_000 },
    description: 'Payment endpoints: 10 req/min',
  },
  {
    pattern: /^\/api\/gold\//,
    rule: { strategy: 'sliding-window', maxRequests: 30, windowMs: 60_000 },
    description: 'Gold endpoints: 30 req/min',
  },
  {
    pattern: /^\/api\/chat\//,
    rule: { strategy: 'token-bucket', maxRequests: 60, windowMs: 60_000, refillRatePerSec: 1, burstCapacity: 20 },
    description: 'Chat endpoints: 60 req/min (token bucket)',
  },
  {
    pattern: /^\/api\//,
    rule: { strategy: 'sliding-window', maxRequests: 100, windowMs: 60_000 },
    description: 'Default API: 100 req/min',
  },
  {
    pattern: /^.*/,  // page routes
    rule: { strategy: 'fixed-window', maxRequests: 200, windowMs: 60_000 },
    description: 'Page routes: 200 req/min',
  },
];

// ─── In-Memory Store (fallback when Redis unavailable) ─────────────────────

interface MemoryEntry {
  /** Timestamps of requests (for sliding/fixed window) */
  timestamps: number[];
  /** Current token count (for token bucket) */
  tokens?: number;
  /** Last refill time (for token bucket) */
  lastRefill?: number;
}

class InMemoryStore {
  private store = new Map<string, MemoryEntry>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startCleanup();
  }

  private startCleanup() {
    if (this.cleanupInterval) return;
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        const lastTs = entry.timestamps.length > 0
          ? entry.timestamps[entry.timestamps.length - 1]
          : entry.lastRefill ?? 0;
        // Remove entries stale for > 2 hours
        if (lastTs > 0 && now - lastTs > 7_200_000) {
          this.store.delete(key);
        }
      }
    }, 300_000); // every 5 min
  }

  /** Increment fixed window counter */
  fixedWindowCheck(key: string, windowMs: number, max: number): RateLimitResult {
    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / windowMs)}`;
    let entry = this.store.get(windowKey);

    if (!entry) {
      entry = { timestamps: [] };
      this.store.set(windowKey, entry);
    }

    const resetMs = windowMs - (now % windowMs);
    const remaining = Math.max(0, max - entry.timestamps.length);

    if (entry.timestamps.length >= max) {
      return {
        allowed: false,
        limit: max,
        remaining: 0,
        resetMs,
        retryAfterMs: resetMs,
        strategy: 'fixed-window',
      };
    }

    entry.timestamps.push(now);
    return {
      allowed: true,
      limit: max,
      remaining: remaining - 1,
      resetMs,
      strategy: 'fixed-window',
    };
  }

  /** Sliding window log */
  slidingWindowCheck(key: string, windowMs: number, max: number): RateLimitResult {
    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry) {
      entry = { timestamps: [] };
      this.store.set(key, entry);
    }

    // Prune old timestamps outside the window
    entry.timestamps = entry.timestamps.filter(t => t > now - windowMs);

    const oldestInWindow = entry.timestamps.length > 0
      ? entry.timestamps[0]
      : now;
    const resetMs = Math.min(windowMs, oldestInWindow + windowMs - now);

    if (entry.timestamps.length >= max) {
      return {
        allowed: false,
        limit: max,
        remaining: 0,
        resetMs,
        retryAfterMs: resetMs,
        strategy: 'sliding-window',
      };
    }

    entry.timestamps.push(now);
    const remaining = Math.max(0, max - entry.timestamps.length);

    return {
      allowed: true,
      limit: max,
      remaining,
      resetMs,
      strategy: 'sliding-window',
    };
  }

  /** Token bucket algorithm */
  tokenBucketCheck(
    key: string,
    maxTokens: number,
    refillRatePerSec: number,
    burstCapacity?: number
  ): RateLimitResult {
    const now = Date.now();
    const capacity = burstCapacity ?? maxTokens;
    let entry = this.store.get(key);

    if (!entry) {
      entry = { timestamps: [], tokens: capacity, lastRefill: now };
      this.store.set(key, entry);
    }

    // Refill tokens based on elapsed time
    const elapsed = (now - (entry.lastRefill ?? now)) / 1000;
    entry.tokens = Math.min(
      capacity,
      (entry.tokens ?? 0) + elapsed * refillRatePerSec
    );
    entry.lastRefill = now;

    if (entry.tokens < 1) {
      const retryAfterMs = Math.ceil(1000 / refillRatePerSec);
      return {
        allowed: false,
        limit: maxTokens,
        remaining: 0,
        resetMs: retryAfterMs,
        retryAfterMs,
        strategy: 'token-bucket',
      };
    }

    entry.tokens -= 1;
    return {
      allowed: true,
      limit: maxTokens,
      remaining: Math.floor(entry.tokens),
      resetMs: Math.ceil(1000 / refillRatePerSec),
      strategy: 'token-bucket',
    };
  }

  reset(key: string): void {
    // Delete all keys matching prefix
    for (const k of this.store.keys()) {
      if (k === key || k.startsWith(`${key}:`)) {
        this.store.delete(k);
      }
    }
  }

  size(): number {
    return this.store.size;
  }
}

// ─── Redis Store (distributed) ─────────────────────────────────────────────

interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, px?: number): Promise<void>;
  eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown>;
  del(key: string): Promise<void>;
  ping(): Promise<string>;
  keys(pattern: string): Promise<string[]>;
}

class RedisStore {
  private client: RedisClient | null = null;
  private healthy = false;
  private prefix = 'rl:';

  setClient(client: RedisClient): void {
    this.client = client;
    this.healthCheck();
  }

  async healthCheck(): Promise<boolean> {
    if (!this.client) { this.healthy = false; return false; }
    try {
      await this.client.ping();
      this.healthy = true;
      return true;
    } catch {
      this.healthy = false;
      return false;
    }
  }

  isHealthy(): boolean {
    return this.healthy;
  }

  async fixedWindowCheck(key: string, windowMs: number, max: number): Promise<RateLimitResult> {
    if (!this.client || !this.healthy) throw new Error('Redis unavailable');

    const now = Date.now();
    const windowKey = `${this.prefix}fw:${key}:${Math.floor(now / windowMs)}`;
    const ttl = windowMs;

    const luaScript = `
      local current = tonumber(redis.call('GET', KEYS[1]) or '0')
      if current >= tonumber(ARGV[1]) then
        local ttl = redis.call('PTTL', KEYS[1])
        return {0, 0, math.max(0, ttl)}
      end
      redis.call('INCR', KEYS[1])
      if current == 0 then
        redis.call('PEXPIRE', KEYS[1], tonumber(ARGV[2]))
      end
      local remaining = tonumber(ARGV[1]) - current - 1
      return {1, remaining, ttl}
    `;

    const result = await this.client.eval(
      luaScript,
      [windowKey],
      [max, ttl]
    ) as [number, number, number];

    const resetMs = result[2];
    return {
      allowed: result[0] === 1,
      limit: max,
      remaining: Math.max(0, result[1]),
      resetMs,
      retryAfterMs: result[0] === 0 ? resetMs : undefined,
      strategy: 'fixed-window',
    };
  }

  async slidingWindowCheck(key: string, windowMs: number, max: number): Promise<RateLimitResult> {
    if (!this.client || !this.healthy) throw new Error('Redis unavailable');

    const now = Date.now();
    const zsetKey = `${this.prefix}sw:${key}`;

    const luaScript = `
      local zset = KEYS[1]
      local now = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])
      local limit = tonumber(ARGV[3])

      redis.call('ZREMRANGEBYSCORE', zset, 0, now - window)
      local count = redis.call('ZCARD', zset)

      if count >= limit then
        local oldest = redis.call('ZRANGE', zset, 0, 0, 'WITHSCORES')
        local reset = 0
        if #oldest > 0 then
          reset = window - (now - tonumber(oldest[2]))
          if reset < 0 then reset = 0 end
        end
        return {0, 0, math.ceil(reset)}
      end

      redis.call('ZADD', zset, now, now .. ':' .. math.random(1000000))
      redis.call('PEXPIRE', zset, math.ceil(window / 1000) + 1000)
      local remaining = limit - count - 1
      return {1, remaining, window}
    `;

    const result = await this.client.eval(
      luaScript,
      [zsetKey],
      [now, windowMs, max]
    ) as [number, number, number];

    return {
      allowed: result[0] === 1,
      limit: max,
      remaining: Math.max(0, result[1]),
      resetMs: result[2],
      retryAfterMs: result[0] === 0 ? result[2] : undefined,
      strategy: 'sliding-window',
    };
  }

  async tokenBucketCheck(
    key: string,
    maxTokens: number,
    refillRatePerSec: number,
    burstCapacity?: number
  ): Promise<RateLimitResult> {
    if (!this.client || !this.healthy) throw new Error('Redis unavailable');

    const now = Date.now();
    const capacity = burstCapacity ?? maxTokens;
    const bucketKey = `${this.prefix}tb:${key}`;

    const luaScript = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local capacity = tonumber(ARGV[2])
      local rate = tonumber(ARGV[3])

      local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local tokens = tonumber(data[1]) or capacity
      local lastRefill = tonumber(data[2]) or now

      local elapsed = (now - lastRefill) / 1000
      tokens = math.min(capacity, tokens + (elapsed * rate))

      if tokens < 1 then
        redis.call('HSET', key, 'tokens', tokens, 'lastRefill', now)
        redis.call('PEXPIRE', key, 120000)
        local retryMs = math.ceil(1000 / rate)
        return {0, 0, retryMs}
      end

      tokens = tokens - 1
      redis.call('HSET', key, 'tokens', tokens, 'lastRefill', now)
      redis.call('PEXPIRE', key, 120000)
      return {1, math.floor(tokens), math.ceil(1000 / rate)}
    `;

    const result = await this.client.eval(
      luaScript,
      [bucketKey],
      [now, capacity, refillRatePerSec]
    ) as [number, number, number];

    return {
      allowed: result[0] === 1,
      limit: maxTokens,
      remaining: Math.max(0, result[1]),
      resetMs: result[2],
      retryAfterMs: result[0] === 0 ? result[2] : undefined,
      strategy: 'token-bucket',
    };
  }

  async reset(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(`${this.prefix}fw:${key}`);
      await this.client.del(`${this.prefix}sw:${key}`);
      await this.client.del(`${this.prefix}tb:${key}`);
    } catch { /* ignore */ }
  }
}

// ─── Main Rate Limiter ─────────────────────────────────────────────────────

export class DistributedRateLimiter {
  private memoryStore: InMemoryStore;
  private redisStore: RedisStore;
  private routeConfigs: RouteRateConfig[];
  private fallbackLimitFactor = 0.5; // in-memory uses 50% of limits

  constructor(routeConfigs: RouteRateConfig[] = DEFAULT_RATE_LIMITS) {
    this.memoryStore = new InMemoryStore();
    this.redisStore = new RedisStore();
    this.routeConfigs = routeConfigs;
  }

  /** Inject a Redis client (ioredis-compatible) */
  setRedisClient(client: RedisClient): void {
    this.redisStore.setClient(client);
  }

  /** Check Redis health */
  async isRedisHealthy(): Promise<boolean> {
    return this.redisStore.healthCheck();
  }

  /** Find matching rate limit config for a path */
  getRuleForPath(path: string): RouteRateConfig {
    return this.routeConfigs.find(r => r.pattern.test(path))
      ?? {
          pattern: /^.*/,
          rule: { strategy: 'sliding-window', maxRequests: 100, windowMs: 60_000 },
          description: 'Default fallback: 100 req/min',
        };
  }

  /** Apply rate limit check for a request */
  async check(
    path: string,
    identifier: string
  ): Promise<RateLimitResult> {
    const config = this.getRuleForPath(path);
    const { strategy } = config.rule;

    // Try Redis first
    const redisOk = this.redisStore.isHealthy();
    if (redisOk) {
      try {
        switch (strategy) {
          case 'fixed-window':
            return await this.redisStore.fixedWindowCheck(
              identifier, config.rule.windowMs, config.rule.maxRequests
            );
          case 'sliding-window':
            return await this.redisStore.slidingWindowCheck(
              identifier, config.rule.windowMs, config.rule.maxRequests
            );
          case 'token-bucket':
            return await this.redisStore.tokenBucketCheck(
              identifier,
              config.rule.maxRequests,
              config.rule.refillRatePerSec ?? 1,
              config.rule.burstCapacity
            );
        }
      } catch {
        // Fall through to in-memory
      }
    }

    // In-memory fallback with reduced limits
    const max = Math.max(
      1,
      Math.floor(config.rule.maxRequests * this.fallbackLimitFactor)
    );

    switch (strategy) {
      case 'fixed-window':
        return this.memoryStore.fixedWindowCheck(identifier, config.rule.windowMs, max);
      case 'sliding-window':
        return this.memoryStore.slidingWindowCheck(identifier, config.rule.windowMs, max);
      case 'token-bucket':
        return this.memoryStore.tokenBucketCheck(
          identifier,
          max,
          config.rule.refillRatePerSec ?? 1,
          config.rule.burstCapacity
            ? Math.floor((config.rule.burstCapacity ?? max) * this.fallbackLimitFactor)
            : undefined
        );
    }
  }

  /** Build rate limit headers from result */
  buildHeaders(result: RateLimitResult): RateLimitHeaders {
    const headers: RateLimitHeaders = {
      'X-RateLimit-Limit': result.limit,
      'X-RateLimit-Remaining': result.remaining,
      'X-RateLimit-Reset': Math.ceil(result.resetMs / 1000),
    };
    if (!result.allowed && result.retryAfterMs) {
      headers['Retry-After'] = Math.ceil(result.retryAfterMs / 1000);
    }
    return headers;
  }

  /** Reset rate limit for a specific identifier */
  async reset(identifier: string): Promise<void> {
    this.memoryStore.reset(identifier);
    await this.redisStore.reset(identifier);
  }

  /** Get store size (for monitoring) */
  getStoreSize(): number {
    return this.memoryStore.size();
  }

  /** Get stats (for monitoring) */
  getStats() {
    return {
      redisHealthy: this.redisStore.isHealthy(),
      memoryStoreSize: this.memoryStore.size(),
      routeConfigs: this.routeConfigs.map(r => ({
        pattern: r.pattern.source,
        strategy: r.rule.strategy,
        maxRequests: r.rule.maxRequests,
        windowMs: r.rule.windowMs,
        description: r.description,
      })),
    };
  }
}

// ─── Singleton Instance ────────────────────────────────────────────────────

export const rateLimiter = new DistributedRateLimiter();

// ─── Helper: Build identifier from request ─────────────────────────────────

export function buildRateLimitIdentifier(
  userId: string | null | undefined,
  ip: string,
  path: string
): string {
  const prefix = userId ? `user:${userId}` : `ip:${ip}`;
  return `${prefix}:${path}`;
}

// ─── Next.js Middleware Integration ─────────────────────────────────────────

/**
 * Can be used in Next.js middleware.ts or individual route handlers:
 *
 *   import { rateLimiter, buildRateLimitIdentifier } from '@/lib/middleware';
 *
 *   const result = await rateLimiter.check(path, identifier);
 *   if (!result.allowed) { ... return 429 ... }
 */

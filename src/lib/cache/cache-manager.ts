/* ═══════════════════════════════════════════════════════════════════════════
 *  cache-manager.ts — Multi-Layer Cache Manager
 *  L1: In-memory LRU cache (very fast, 100ms default TTL)
 *  L2: Redis/shared cache (configurable TTL)
 *  Features: cache stampede prevention (singleflight), tag invalidation,
 *  cache warming, configurable TTL per prefix, statistics tracking.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { getRedisClient, MemoryCacheAdapter, type ICacheAdapter } from './redis-client';

/* ── Types ── */

/** Cache get/set options */
export interface CacheOptions {
  /** TTL in milliseconds for L1 (in-memory). Default: 100ms */
  l1Ttl?: number;
  /** TTL in milliseconds for L2 (Redis). Default: configurable per prefix */
  l2Ttl?: number;
  /** Tags for group invalidation */
  tags?: string[];
  /** Skip L1 cache (go straight to L2) */
  skipL1?: boolean;
  /** Skip L2 cache (L1 only) */
  skipL2?: boolean;
  /** Force refresh (ignore cache, recompute) */
  forceRefresh?: boolean;
  /** Namespace/prefix override */
  namespace?: string;
}

/** Cache statistics */
export interface CacheStats {
  /** Total L1 hits */
  l1Hits: number;
  /** Total L1 misses */
  l1Misses: number;
  /** Total L2 hits */
  l2Hits: number;
  /** Total L2 misses */
  l2Misses: number;
  /** Total sets */
  sets: number;
  /** Total deletions */
  deletions: number;
  /** L1 hit rate (percentage) */
  l1HitRate: number;
  /** L2 hit rate (percentage) */
  l2HitRate: number;
  /** Overall hit rate (percentage) */
  overallHitRate: number;
  /** L1 cache size (approximate) */
  l1Size: number;
  /** Active stampede locks */
  activeLocks: number;
  /** Redis health */
  redisHealthy: boolean;
  /** Redis latency ms */
  redisLatencyMs: number;
}

/** Cache warmup entry */
export interface WarmupEntry {
  key: string;
  fn: () => Promise<unknown>;
  ttl?: number;
  tags?: string[];
}

/** Per-prefix TTL configuration */
export type PrefixTtlConfig = Record<string, number>;

/** Default TTL configuration for known key prefixes (in ms) */
const DEFAULT_PREFIX_TTLS: PrefixTtlConfig = {
  'gold:prices': 5_000,           // 5s — live gold prices (real-time)
  'gold:prices:api': 60_000,      // 60s — API gold prices
  'session:': 1_800_000,          // 30min — user sessions
  'user:profile': 300_000,        // 5min — user profiles
  'site:settings': 600_000,       // 10min — site settings
  'market:data': 900_000,         // 15min — market analysis
  'leaderboard:': 60_000,         // 1min — gamification leaderboards
  'api:gold:': 10_000,            // 10s — gold API responses
  'cms:page:': 300_000,           // 5min — CMS pages
  'blog:': 600_000,               // 10min — blog posts
  'wallet:': 5_000,               // 5s — wallet data (near real-time)
  'notification:': 15_000,        // 15s — notifications
};

/* ── LRU In-Memory Cache ── */

interface LRUEntry<T = unknown> {
  value: T;
  expiresAt: number;
  tags?: string[];
}

class LRUCache {
  private cache = new Map<string, LRUEntry>();
  private maxSize: number;

  constructor(maxSize = 5000) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number, tags?: string[]): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // Evict least recently used (first entry)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.delete(key); // Remove if exists (will be re-added at end)
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      tags,
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  deleteByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags?.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  deleteByPattern(pattern: string): number {
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
    let count = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  cleanup(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }
}

/* ── Singleflight (cache stampede prevention) ── */

class Singleflight {
  private inflight = new Map<string, Promise<unknown>>();

  async do<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = fn().finally(() => {
      this.inflight.delete(key);
    });

    this.inflight.set(key, promise);
    return promise;
  }

  get activeCount(): number {
    return this.inflight.size;
  }

  keys(): string[] {
    return Array.from(this.inflight.keys());
  }
}

/* ── Cache Manager ── */

/**
 * Multi-layer cache manager with L1 (in-memory) and L2 (Redis) support.
 * Implements singleflight for cache stampede prevention.
 *
 * @example
 * ```ts
 * const cache = CacheManager.getInstance();
 *
 * // Simple get/set
 * await cache.set('user:profile:123', { name: 'Ali' }, { l2Ttl: 300_000 });
 * const profile = await cache.get('user:profile:123');
 *
 * // Get or compute with stampede protection
 * const prices = await cache.getOrSet('gold:prices:live', () => fetchPrices(), {
 *   l1Ttl: 100,
 *   l2Ttl: 5_000,
 *   tags: ['gold-prices'],
 * });
 *
 * // Tag-based invalidation
 * await cache.invalidateTag('gold-prices');
 * ```
 */
export class CacheManager {
  private static instance: CacheManager | null = null;
  private l1: LRUCache;
  private l2: ICacheAdapter;
  private singleflight: Singleflight;
  private stats = {
    l1Hits: 0,
    l1Misses: 0,
    l2Hits: 0,
    l2Misses: 0,
    sets: 0,
    deletions: 0,
  };
  private prefixTtls: PrefixTtlConfig;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private _initialized = false;

  private constructor() {
    this.l1 = new LRUCache(
      parseInt(process.env.CACHE_L1_MAX_SIZE || '5000', 10)
    );
    this.l2 = getRedisClient();
    this.singleflight = new Singleflight();
    this.prefixTtls = { ...DEFAULT_PREFIX_TTLS };

    // Periodic L1 cleanup every 30s
    this.cleanupInterval = setInterval(() => {
      this.l1.cleanup();
    }, 30_000);
  }

  /**
   * Get the singleton CacheManager instance.
   */
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Initialize the cache manager (connect to Redis, etc.)
   */
  async init(): Promise<void> {
    if (this._initialized) return;

    try {
      // Warm up Redis connection
      const health = await this.l2.healthCheck();
      if (health.healthy) {
        this._initialized = true;
      } else {
        // L1 still works as fallback
        this._initialized = true;
        console.warn('[CacheManager] Redis not available, using L1-only mode');
      }
    } catch {
      this._initialized = true;
      console.warn('[CacheManager] Redis init failed, using L1-only mode');
    }
  }

  /**
   * Get a cached value from L1 -> L2 cascade.
   *
   * @param key - Cache key (follows naming convention: {domain}:{entity}:{id})
   * @param options - Cache options
   * @returns Cached value or null
   */
  async get<T = unknown>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const { skipL1 = false, skipL2 = false } = options;

    // Try L1 first (in-memory, very fast)
    if (!skipL1) {
      const l1Value = this.l1.get<T>(key);
      if (l1Value !== null) {
        this.stats.l1Hits++;
        return l1Value;
      }
      this.stats.l1Misses++;
    }

    // Try L2 (Redis)
    if (!skipL2) {
      const l2Value = await this.l2.get<T>(key);
      if (l2Value !== null) {
        this.stats.l2Hits++;
        // Backfill L1
        const l1Ttl = options.l1Ttl ?? this.getL1Ttl(key);
        this.l1.set(key, l2Value, l1Ttl);
        return l2Value;
      }
      this.stats.l2Misses++;
    }

    return null;
  }

  /**
   * Set a value in both L1 and L2 caches.
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param options - Cache options (TTL, tags, etc.)
   */
  async set<T = unknown>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const {
      l1Ttl = this.getL1Ttl(key),
      l2Ttl = this.getL2Ttl(key),
      skipL1 = false,
      skipL2 = false,
      tags,
    } = options;

    // Set L1
    if (!skipL1) {
      this.l1.set(key, value, l1Ttl, tags);
    }

    // Set L2
    if (!skipL2) {
      await this.l2.set(key, value, l2Ttl);
    }

    this.stats.sets++;
  }

  /**
   * Delete a key from both L1 and L2.
   *
   * @param key - Cache key to delete
   */
  async del(key: string): Promise<void> {
    this.l1.delete(key);
    await this.l2.del(key);
    this.stats.deletions++;
  }

  /**
   * Delete all keys matching a pattern from both layers.
   *
   * @param pattern - Glob-style pattern (e.g., "gold:prices:*")
   */
  async delPattern(pattern: string): Promise<number> {
    const l1Count = this.l1.deleteByPattern(pattern);
    const l2Count = await this.l2.delPattern(pattern);
    this.stats.deletions += l1Count + l2Count;
    return l1Count + l2Count;
  }

  /**
   * Invalidate all keys with a specific tag.
   *
   * @param tag - Tag to invalidate
   */
  async invalidateTag(tag: string): Promise<number> {
    // L1 tag invalidation
    const l1Count = this.l1.deleteByTag(tag);

    // L2 tag invalidation (find and delete tagged keys)
    // Since Redis doesn't natively support tags, we maintain a tag index
    const tagKey = `_tag:${tag}`;
    const taggedKeys = await this.l2.get<string[]>(tagKey);

    let l2Count = 0;
    if (taggedKeys && taggedKeys.length > 0) {
      for (const key of taggedKeys) {
        await this.l2.del(key);
        this.l1.delete(key);
        l2Count++;
      }
      await this.l2.del(tagKey);
    }

    this.stats.deletions += l1Count + l2Count;
    return l1Count + l2Count;
  }

  /**
   * Get from cache or compute and cache the result.
   * Implements singleflight to prevent cache stampede.
   *
   * @param key - Cache key
   * @param fn - Function to compute the value if not cached
   * @param options - Cache options
   * @returns Cached or computed value
   */
  async getOrSet<T = unknown>(
    key: string,
    fn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { forceRefresh = false } = options;

    // Check cache first (unless forced refresh)
    if (!forceRefresh) {
      const cached = await this.get<T>(key, options);
      if (cached !== null) return cached;
    }

    // Use singleflight to prevent stampede
    return this.singleflight.do(key, async () => {
      // Double-check after acquiring the lock
      if (!forceRefresh) {
        const cached = await this.get<T>(key, { ...options, skipL1: false });
        if (cached !== null) return cached;
      }

      // Compute value
      const value = await fn();

      // Cache the result
      await this.set(key, value, options);

      // Update tag index if tags provided
      if (options.tags && options.tags.length > 0) {
        await this.updateTagIndex(key, options.tags);
      }

      return value;
    });
  }

  /**
   * Pre-warm the cache with given entries.
   *
   * @param entries - Array of warmup entries with key, compute function, and options
   * @returns Results map of key -> success/failure
   */
  async warmup(entries: WarmupEntry[]): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    // Execute in parallel with concurrency limit of 10
    const batchSize = 10;
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (entry) => {
          try {
            const value = await entry.fn();
            await this.set(entry.key, value, {
              l2Ttl: entry.ttl,
              tags: entry.tags,
            });
            if (entry.tags) {
              await this.updateTagIndex(entry.key, entry.tags);
            }
            results[entry.key] = true;
          } catch {
            results[entry.key] = false;
          }
        })
      );
    }

    return results;
  }

  /**
   * Get cache statistics.
   */
  stats(): CacheStats {
    const totalL1 = this.stats.l1Hits + this.stats.l1Misses;
    const totalL2 = this.stats.l2Hits + this.stats.l2Misses;
    const totalHits = this.stats.l1Hits + this.stats.l2Hits;
    const totalLookups = totalL1 + totalL2;

    return {
      l1Hits: this.stats.l1Hits,
      l1Misses: this.stats.l1Misses,
      l2Hits: this.stats.l2Hits,
      l2Misses: this.stats.l2Misses,
      sets: this.stats.sets,
      deletions: this.stats.deletions,
      l1HitRate: totalL1 > 0 ? Math.round((this.stats.l1Hits / totalL1) * 100) : 0,
      l2HitRate: totalL2 > 0 ? Math.round((this.stats.l2Hits / totalL2) * 100) : 0,
      overallHitRate: totalLookups > 0 ? Math.round((totalHits / totalLookups) * 100) : 0,
      l1Size: this.l1.size,
      activeLocks: this.singleflight.activeCount,
      redisHealthy: this._initialized,
      redisLatencyMs: -1, // Populated async
    };
  }

  /**
   * Get cache statistics with Redis health check.
   */
  async statsWithHealth(): Promise<CacheStats> {
    const base = this.stats();
    try {
      const health = await this.l2.healthCheck();
      base.redisHealthy = health.healthy;
      base.redisLatencyMs = health.latencyMs;
    } catch {
      base.redisHealthy = false;
    }
    return base;
  }

  /**
   * Flush all cache entries from both layers.
   */
  async flush(): Promise<void> {
    this.l1.clear();
    await this.l2.flush();
    this.stats = { l1Hits: 0, l1Misses: 0, l2Hits: 0, l2Misses: 0, sets: 0, deletions: 0 };
  }

  /**
   * Register or override TTL for a key prefix.
   *
   * @param prefix - Key prefix (e.g., "gold:prices")
   * @param ttlMs - TTL in milliseconds
   */
  registerTtl(prefix: string, ttlMs: number): void {
    this.prefixTtls[prefix] = ttlMs;
  }

  /**
   * Get TTL for L1 based on key prefix.
   */
  private getL1Ttl(key: string): number {
    for (const [prefix, ttl] of Object.entries(this.prefixTtls)) {
      if (key.startsWith(prefix)) {
        return Math.min(ttl, 100); // L1 is always short-lived (max 100ms)
      }
    }
    return 100; // Default L1 TTL
  }

  /**
   * Get TTL for L2 based on key prefix.
   */
  private getL2Ttl(key: string): number {
    for (const [prefix, ttl] of Object.entries(this.prefixTtls)) {
      if (key.startsWith(prefix)) {
        return ttl;
      }
    }
    return 300_000; // Default 5min
  }

  /**
   * Update the tag index in L2 for tag-based invalidation.
   */
  private async updateTagIndex(key: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `_tag:${tag}`;
      const existing = await this.l2.get<string[]>(tagKey);
      const keys = new Set(existing || []);
      keys.add(key);
      await this.l2.set(tagKey, Array.from(keys), 86_400_000); // 24h
    }
  }

  /**
   * Cleanup and close the cache manager.
   */
  async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if ('close' in this.l2 && typeof this.l2.close === 'function') {
      await this.l2.close();
    }
    this.l1.clear();
    CacheManager.instance = null;
  }
}

/* ── Convenience Exports ── */

/** Get the singleton CacheManager */
export const cache = CacheManager.getInstance();

/** Reset the CacheManager (useful for testing) */
export function resetCacheManager(): void {
  if (CacheManager.instance) {
    CacheManager.instance.destroy().catch(() => {});
  }
  // Force new instance
  CacheManager.instance = null;
}

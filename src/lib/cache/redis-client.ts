/* ═══════════════════════════════════════════════════════════════════════════
 *  redis-client.ts — Redis Client Configuration
 *  Singleton Redis client using ioredis with cluster support,
 *  connection pooling, automatic reconnection, and health checks.
 *  Graceful degradation to in-memory in development.
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Redis configuration interface */
export interface RedisConfig {
  /** Redis host (default: 127.0.0.1) */
  host: string;
  /** Redis port (default: 6379) */
  port: number;
  /** Redis password for authentication */
  password?: string;
  /** Database index (0-15) */
  db?: number;
  /** Connection URL (overrides host/port/password) */
  url?: string;
  /** Enable TLS */
  tls?: boolean;
  /** Key prefix for all keys */
  keyPrefix?: string;
  /** Max retry attempts */
  maxRetriesPerRequest?: number;
  /** Enable offline queue */
  enableOfflineQueue?: boolean;
  /** Connection timeout in ms */
  connectTimeout?: number;
  /** Command timeout in ms */
  commandTimeout?: number;
  /** Keepalive interval in ms */
  keepAlive?: number;
}

/** Redis cluster configuration */
export interface RedisClusterConfig {
  /** Array of cluster nodes */
  nodes: Array<{ host: string; port: number }>;
  /** Redis password */
  password?: string;
  /** Key prefix */
  keyPrefix?: string;
  /** Max retry attempts */
  maxRetriesPerRequest?: number;
  /** Scale reads across nodes */
  scaleReads?: boolean;
  /** Read-only mode */
  readOnly?: boolean;
  /** Enable offline queue */
  enableOfflineQueue?: boolean;
  /** Slot refresh timeout */
  slotRefreshTimeout?: number;
}

/** Health check result */
export interface RedisHealthCheck {
  /** Whether Redis is connected and healthy */
  healthy: boolean;
  /** Response latency in ms */
  latencyMs: number;
  /** Connection status */
  status: 'connected' | 'disconnected' | 'connecting' | 'reconnecting' | 'error';
  /** Redis version (if connected) */
  version?: string;
  /** Used memory in bytes (if connected) */
  usedMemoryBytes?: number;
  /** Connected clients count */
  connectedClients?: number;
  /** Error message if unhealthy */
  error?: string;
  /** Whether using in-memory fallback */
  isMemoryFallback: boolean;
}

/** Cache value wrapper with metadata */
export interface CacheValueWrapper<T = unknown> {
  /** The cached value */
  value: T;
  /** ISO timestamp when the value was cached */
  cachedAt: string;
  /** TTL in seconds when the value was set */
  ttl: number;
  /** Optional tags for cache invalidation */
  tags?: string[];
  /** Version for cache busting */
  version?: number;
}

/** Cache layer interface (L1, L2, or Redis) */
export interface ICacheAdapter {
  /** Get a value by key */
  get<T = unknown>(key: string): Promise<T | null>;
  /** Set a value with optional TTL */
  set<T = unknown>(key: string, value: T, ttlMs?: number): Promise<void>;
  /** Delete a key */
  del(key: string): Promise<void>;
  /** Delete keys matching a pattern */
  delPattern(pattern: string): Promise<number>;
  /** Check if key exists */
  exists(key: string): Promise<boolean>;
  /** Get TTL remaining for a key (ms) */
  ttl(key: string): Promise<number>;
  /** Get all keys matching a pattern */
  keys(pattern: string): Promise<string[]>;
  /** Clear all entries */
  flush(): Promise<void>;
  /** Close the connection */
  close?(): Promise<void>;
  /** Health check */
  healthCheck(): Promise<RedisHealthCheck>;
}

/**
 * In-memory cache adapter for development and Redis fallback.
 * Uses a simple Map with TTL tracking and LRU eviction.
 */
export class MemoryCacheAdapter implements ICacheAdapter {
  private store = new Map<string, { value: unknown; expiresAt: number }>();
  private maxEntries: number;

  constructor(maxEntries = 10000) {
    this.maxEntries = maxEntries;
    // Periodic cleanup every 60s
    setInterval(() => this.cleanup(), 60_000);
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T = unknown>(key: string, value: T, ttlMs?: number): Promise<void> {
    // LRU eviction when at capacity
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
    this.store.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : Date.now() + 300_000,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delPattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
    let count = 0;
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2;
    return Math.max(0, entry.expiresAt - Date.now());
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  async flush(): Promise<void> {
    this.store.clear();
  }

  async healthCheck(): Promise<RedisHealthCheck> {
    return {
      healthy: true,
      latencyMs: 0,
      status: 'connected',
      isMemoryFallback: true,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Redis cache adapter using ioredis.
 * Supports both standalone and cluster mode.
 */
export class RedisCacheAdapter implements ICacheAdapter {
  private client: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  private isCluster = false;
  private config: RedisConfig | RedisClusterConfig;
  private connectionPromise: Promise<void> | null = null;
  private connected = false;
  private keyPrefix: string;

  constructor(config: RedisConfig | RedisClusterConfig) {
    this.config = config;
    this.keyPrefix = 'keyPrefix' in config && config.keyPrefix
      ? config.keyPrefix
      : 'zg:';
  }

  /** Connect to Redis (lazy initialization) */
  private async connect(): Promise<void> {
    if (this.connected && this.client) return;
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = (async () => {
      try {
        // Dynamic import to avoid bundling ioredis in environments without it
        let Redis: any; // eslint-disable-line @typescript-eslint/no-explicit-any

        try {
          const ioredis = await import('ioredis');
          Redis = ioredis.default || ioredis;
        } catch {
          throw new Error('ioredis is not installed. Run: bun add ioredis');
        }

        if ('nodes' in this.config) {
          // Cluster mode
          this.isCluster = true;
          const clusterConfig = this.config as RedisClusterConfig;
          this.client = new Redis.Cluster(clusterConfig.nodes, {
            redisOptions: {
              password: clusterConfig.password,
              keyPrefix: this.keyPrefix,
              maxRetriesPerRequest: clusterConfig.maxRetriesPerRequest ?? 3,
              enableOfflineQueue: clusterConfig.enableOfflineQueue ?? true,
            },
            scaleReads: clusterConfig.scaleReads ? 'slave' : undefined,
            readOnly: clusterConfig.readOnly,
            slotRefreshTimeout: clusterConfig.slotRefreshTimeout ?? 2000,
          });
        } else {
          // Standalone mode
          const standaloneConfig = this.config as RedisConfig;
          const connectionOptions: Record<string, unknown> = {
            host: standaloneConfig.host || '127.0.0.1',
            port: standaloneConfig.port || 6379,
            password: standaloneConfig.password || undefined,
            db: standaloneConfig.db || 0,
            keyPrefix: this.keyPrefix,
            maxRetriesPerRequest: standaloneConfig.maxRetriesPerRequest ?? 3,
            enableOfflineQueue: standaloneConfig.enableOfflineQueue ?? true,
            connectTimeout: standaloneConfig.connectTimeout ?? 10000,
            commandTimeout: standaloneConfig.commandTimeout ?? 5000,
            keepAlive: standaloneConfig.keepAlive ?? 30000,
            retryStrategy(times: number) {
              if (times > 10) return null; // Stop retrying after 10 attempts
              return Math.min(times * 200, 5000); // Exponential backoff
            },
            lazyConnect: true,
          };

          if (standaloneConfig.url) {
            this.client = new Redis(standaloneConfig.url, connectionOptions);
          } else {
            if (standaloneConfig.tls) {
              connectionOptions.tls = {};
            }
            this.client = new Redis(connectionOptions as any); // eslint-disable-line @typescript-eslint/no-explicit-any
          }
        }

        // Set up event handlers
        this.client.on('connect', () => {
          this.connected = true;
        });

        this.client.on('error', (err: Error) => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Redis] Connection error:', err.message);
          }
          this.connected = false;
        });

        this.client.on('close', () => {
          this.connected = false;
        });

        this.client.on('reconnecting', () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Redis] Reconnecting...');
          }
        });

        // Connect
        await this.client.connect();
        this.connected = true;
      } catch (err) {
        this.connected = false;
        this.connectionPromise = null;
        throw err;
      }
    })();

    return this.connectionPromise;
  }

  /** Ensure client is connected before operations */
  private async ensureConnected(): Promise<boolean> {
    try {
      await this.connect();
      return this.connected;
    } catch {
      return false;
    }
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const connected = await this.ensureConnected();
    if (!connected) return null;

    try {
      const raw = await this.client.get(this.keyPrefix + key);
      if (!raw) return null;
      const wrapper: CacheValueWrapper<T> = JSON.parse(raw);
      return wrapper.value;
    } catch {
      return null;
    }
  }

  async set<T = unknown>(key: string, value: T, ttlMs?: number): Promise<void> {
    const connected = await this.ensureConnected();
    if (!connected) return;

    try {
      const wrapper: CacheValueWrapper<T> = {
        value,
        cachedAt: new Date().toISOString(),
        ttl: ttlMs ? Math.round(ttlMs / 1000) : 300,
      };
      const serialized = JSON.stringify(wrapper);
      const ttlSeconds = ttlMs ? Math.round(ttlMs / 1000) : 300;

      if (ttlSeconds > 0) {
        await this.client.setex(this.keyPrefix + key, ttlSeconds, serialized);
      } else {
        await this.client.set(this.keyPrefix + key, serialized);
      }
    } catch {
      // Silent fail - graceful degradation
    }
  }

  async del(key: string): Promise<void> {
    const connected = await this.ensureConnected();
    if (!connected) return;
    try {
      await this.client.del(this.keyPrefix + key);
    } catch {
      // Silent fail
    }
  }

  async delPattern(pattern: string): Promise<number> {
    const connected = await this.ensureConnected();
    if (!connected) return 0;

    try {
      // Use SCAN for safety in production (avoid KEYS command)
      let cursor = '0';
      const keysToDelete: string[] = [];
      const fullPattern = this.keyPrefix + pattern;

      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          fullPattern,
          'COUNT',
          100
        );
        cursor = nextCursor;
        keysToDelete.push(...keys);
      } while (cursor !== '0');

      if (keysToDelete.length > 0) {
        await this.client.del(...keysToDelete);
      }
      return keysToDelete.length;
    } catch {
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    const connected = await this.ensureConnected();
    if (!connected) return false;
    try {
      const result = await this.client.exists(this.keyPrefix + key);
      return result === 1;
    } catch {
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    const connected = await this.ensureConnected();
    if (!connected) return -2;
    try {
      return await this.client.ttl(this.keyPrefix + key);
    } catch {
      return -2;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    const connected = await this.ensureConnected();
    if (!connected) return [];

    try {
      let cursor = '0';
      const matchedKeys: string[] = [];
      const fullPattern = this.keyPrefix + pattern;
      const prefixLen = this.keyPrefix.length;

      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          fullPattern,
          'COUNT',
          100
        );
        cursor = nextCursor;
        matchedKeys.push(...keys.map(k => k.slice(prefixLen)));
      } while (cursor !== '0');

      return matchedKeys;
    } catch {
      return [];
    }
  }

  async flush(): Promise<void> {
    const connected = await this.ensureConnected();
    if (!connected) return;
    try {
      await this.client.flushdb();
    } catch {
      // Silent fail
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        // Force close
        try { this.client.disconnect(); } catch { /* ignore */ }
      }
      this.connected = false;
    }
  }

  async healthCheck(): Promise<RedisHealthCheck> {
    const connected = await this.ensureConnected();

    if (!connected) {
      return {
        healthy: false,
        latencyMs: -1,
        status: this.client ? 'reconnecting' : 'disconnected',
        error: 'Redis connection failed',
        isMemoryFallback: false,
      };
    }

    try {
      const start = Date.now();
      const pong = await this.client.ping();
      const latency = Date.now() - start;

      if (pong !== 'PONG') {
        return {
          healthy: false,
          latencyMs: latency,
          status: 'error',
          error: 'Ping failed',
          isMemoryFallback: false,
        };
      }

      // Try to get server info
      let version: string | undefined;
      let usedMemoryBytes: number | undefined;
      let connectedClients: number | undefined;

      try {
        const info = await this.client.info('server');
        const versionMatch = info?.match(/redis_version:(.+)/);
        version = versionMatch?.[1]?.trim();
      } catch { /* ignore */ }

      try {
        const info = await this.client.info('memory');
        const memMatch = info?.match(/used_memory:(\d+)/);
        usedMemoryBytes = memMatch ? parseInt(memMatch[1], 10) : undefined;
      } catch { /* ignore */ }

      try {
        const info = await this.client.info('clients');
        const clientsMatch = info?.match(/connected_clients:(\d+)/);
        connectedClients = clientsMatch ? parseInt(clientsMatch[1], 10) : undefined;
      } catch { /* ignore */ }

      return {
        healthy: true,
        latencyMs: latency,
        status: 'connected',
        version,
        usedMemoryBytes,
        connectedClients,
        isMemoryFallback: false,
      };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: -1,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
        isMemoryFallback: false,
      };
    }
  }
}

/**
 * Create a Redis client based on environment configuration.
 * In development (NODE_ENV !== 'production'), returns in-memory adapter.
 * In production, attempts Redis connection with fallback to in-memory.
 */
export function createRedisClient(): ICacheAdapter {
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Development: always use in-memory
  if (nodeEnv === 'development') {
    console.log('[Cache] Using in-memory cache (development mode)');
    return new MemoryCacheAdapter(5000);
  }

  // Production: try Redis
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl && !process.env.REDIS_HOST) {
    console.warn('[Cache] No Redis configuration found, falling back to in-memory cache');
    return new MemoryCacheAdapter(50000);
  }

  // Check for cluster mode
  const clusterNodes = process.env.REDIS_CLUSTER_NODES;

  if (clusterNodes) {
    const nodes = clusterNodes.split(',').map(node => {
      const [host, port] = node.trim().split(':');
      return { host: host || '127.0.0.1', port: parseInt(port || '6379', 10) };
    });

    const clusterConfig: RedisClusterConfig = {
      nodes,
      password: process.env.REDIS_PASSWORD,
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'zg:',
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true,
      scaleReads: true,
      readOnly: false,
    };

    console.log(`[Cache] Using Redis cluster mode with ${nodes.length} nodes`);
    return new RedisCacheAdapter(clusterConfig);
  }

  // Standalone Redis
  const config: RedisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    url: redisUrl || undefined,
    tls: process.env.REDIS_TLS === 'true',
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'zg:',
    maxRetriesPerRequest: 3,
    enableOfflineQueue: true,
    connectTimeout: 10000,
    commandTimeout: 5000,
    keepAlive: 30000,
  };

  console.log(`[Cache] Using Redis standalone at ${config.host}:${config.port}`);
  return new RedisCacheAdapter(config);
}

/** Singleton Redis client instance */
let _redisClient: ICacheAdapter | null = null;

/**
 * Get the singleton Redis client instance.
 * Lazily creates the client on first call.
 */
export function getRedisClient(): ICacheAdapter {
  if (!_redisClient) {
    _redisClient = createRedisClient();
  }
  return _redisClient;
}

/**
 * Reset the Redis client (useful for testing).
 */
export function resetRedisClient(): void {
  if (_redisClient && 'close' in _redisClient && typeof _redisClient.close === 'function') {
    _redisClient.close().catch(() => {});
  }
  _redisClient = null;
}

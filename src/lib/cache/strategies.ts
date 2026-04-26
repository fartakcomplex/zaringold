/* ═══════════════════════════════════════════════════════════════════════════
 *  strategies.ts — Predefined Caching Strategies
 *  Domain-specific cache configurations for ZarinGold platform.
 *  Each strategy defines key patterns, TTLs, tags, and warmup functions.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { cache, type CacheOptions, type WarmupEntry } from './cache-manager';

/* ── Types ── */

/** A caching strategy definition */
export interface CacheStrategy {
  /** Strategy name (used for logging and management) */
  name: string;
  /** Description of what this strategy caches */
  description: string;
  /** Key prefix for this strategy */
  prefix: string;
  /** Default TTL options for this strategy */
  options: CacheOptions;
  /** Whether this strategy is enabled */
  enabled: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Gold Prices Strategy
 *  Cache live gold prices — critical for trading accuracy.
 *  Real-time view: 5s TTL, API response: 60s TTL.
 * ═══════════════════════════════════════════════════════════════════════════ */

export const goldPricesStrategy: CacheStrategy = {
  name: 'gold-prices',
  description: 'Cache live gold prices for real-time and API consumption',
  prefix: 'gold:prices',
  options: {
    l1Ttl: 50,         // 50ms — extremely fast L1
    l2Ttl: 5_000,      // 5s — near real-time for live
    tags: ['gold-prices', 'live-data'],
  },
  enabled: true,
};

/**
 * Get cached gold prices or fetch and cache them.
 * @param fetchFn - Function to fetch gold prices from source
 * @param isApi - Whether this is for API consumption (longer TTL)
 */
export async function getCachedGoldPrices<T>(
  fetchFn: () => Promise<T>,
  isApi = false
): Promise<T> {
  return cache.getOrSet(
    `gold:prices:${isApi ? 'api' : 'live'}`,
    fetchFn,
    {
      ...goldPricesStrategy.options,
      l2Ttl: isApi ? 60_000 : 5_000,
    }
  );
}

/**
 * Invalidate all gold price caches.
 */
export async function invalidateGoldPrices(): Promise<number> {
  return cache.invalidateTag('gold-prices');
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Session Strategy
 *  Session caching with 30min TTL, invalidated on logout.
 * ═══════════════════════════════════════════════════════════════════════════ */

export const sessionStrategy: CacheStrategy = {
  name: 'session',
  description: 'User session caching with logout invalidation',
  prefix: 'session:',
  options: {
    l1Ttl: 100,
    l2Ttl: 1_800_000,    // 30min
    tags: ['sessions'],
  },
  enabled: true,
};

/**
 * Get cached session data.
 * @param sessionId - User session ID
 * @param fetchFn - Function to fetch session from DB
 */
export async function getCachedSession<T>(
  sessionId: string,
  fetchFn: () => Promise<T>
): Promise<T | null> {
  return cache.getOrSet(`session:${sessionId}`, fetchFn, sessionStrategy.options);
}

/**
 * Invalidate a specific user session (e.g., on logout).
 * @param sessionId - Session ID to invalidate
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  await cache.del(`session:${sessionId}`);
}

/**
 * Invalidate all sessions for a user.
 * @param userId - User ID whose sessions should be invalidated
 */
export async function invalidateUserSessions(userId: string): Promise<number> {
  return cache.delPattern(`session:${userId}:*`);
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  User Profile Strategy
 *  User profile cache with 5min TTL, invalidated on profile update.
 * ═══════════════════════════════════════════════════════════════════════════ */

export const userProfileStrategy: CacheStrategy = {
  name: 'user-profile',
  description: 'User profile data caching',
  prefix: 'user:profile:',
  options: {
    l1Ttl: 100,
    l2Ttl: 300_000,     // 5min
    tags: ['user-profiles'],
  },
  enabled: true,
};

/**
 * Get cached user profile.
 * @param userId - User ID
 * @param fetchFn - Function to fetch user profile from DB
 */
export async function getCachedUserProfile<T>(
  userId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  return cache.getOrSet(`user:profile:${userId}`, fetchFn, userProfileStrategy.options);
}

/**
 * Invalidate a specific user profile cache.
 * @param userId - User ID whose profile should be invalidated
 */
export async function invalidateUserProfile(userId: string): Promise<void> {
  await cache.del(`user:profile:${userId}`);
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Site Settings Strategy
 *  Site settings cached globally with 10min TTL.
 * ═══════════════════════════════════════════════════════════════════════════ */

export const siteSettingsStrategy: CacheStrategy = {
  name: 'site-settings',
  description: 'Global site settings and configuration',
  prefix: 'site:settings:',
  options: {
    l1Ttl: 100,
    l2Ttl: 600_000,     // 10min
    tags: ['site-settings'],
  },
  enabled: true,
};

/**
 * Get cached site settings.
 * @param fetchFn - Function to fetch site settings from DB
 * @param settingKey - Optional specific setting key
 */
export async function getCachedSiteSettings<T>(
  fetchFn: () => Promise<T>,
  settingKey?: string
): Promise<T> {
  const key = settingKey
    ? `site:settings:${settingKey}`
    : 'site:settings:all';
  return cache.getOrSet(key, fetchFn, siteSettingsStrategy.options);
}

/**
 * Invalidate all site settings caches.
 * Call this after any admin settings update.
 */
export async function invalidateSiteSettings(): Promise<number> {
  return cache.invalidateTag('site-settings');
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Market Data Strategy
 *  Market analysis data with 15min TTL.
 * ═══════════════════════════════════════════════════════════════════════════ */

export const marketDataStrategy: CacheStrategy = {
  name: 'market-data',
  description: 'Market analysis and chart data',
  prefix: 'market:data:',
  options: {
    l1Ttl: 100,
    l2Ttl: 900_000,     // 15min
    tags: ['market-data'],
  },
  enabled: true,
};

/**
 * Get cached market data.
 * @param dataKey - Specific market data key (e.g., "analysis", "chart:1d")
 * @param fetchFn - Function to fetch market data
 */
export async function getCachedMarketData<T>(
  dataKey: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  return cache.getOrSet(`market:data:${dataKey}`, fetchFn, marketDataStrategy.options);
}

/**
 * Invalidate all market data caches.
 */
export async function invalidateMarketData(): Promise<number> {
  return cache.invalidateTag('market-data');
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Leaderboards Strategy
 *  Gamification leaderboards with 1min TTL.
 * ═══════════════════════════════════════════════════════════════════════════ */

export const leaderboardsStrategy: CacheStrategy = {
  name: 'leaderboards',
  description: 'Gamification and quest leaderboards',
  prefix: 'leaderboard:',
  options: {
    l1Ttl: 100,
    l2Ttl: 60_000,      // 1min
    tags: ['leaderboards'],
  },
  enabled: true,
};

/**
 * Get cached leaderboard data.
 * @param leaderboardType - Type of leaderboard (e.g., "xp", "quest", "prediction")
 * @param fetchFn - Function to fetch leaderboard data
 */
export async function getCachedLeaderboard<T>(
  leaderboardType: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  return cache.getOrSet(
    `leaderboard:${leaderboardType}`,
    fetchFn,
    leaderboardsStrategy.options
  );
}

/**
 * Invalidate all leaderboard caches.
 */
export async function invalidateLeaderboards(): Promise<number> {
  return cache.invalidateTag('leaderboards');
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Additional Domain Strategies
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Wallet data strategy — near real-time */
export const walletStrategy: CacheStrategy = {
  name: 'wallet',
  description: 'Wallet balance and transaction data',
  prefix: 'wallet:',
  options: {
    l1Ttl: 50,
    l2Ttl: 5_000,       // 5s — wallet needs near real-time
    tags: ['wallets'],
  },
  enabled: true,
};

/** CMS page strategy */
export const cmsPageStrategy: CacheStrategy = {
  name: 'cms-page',
  description: 'CMS pages and content',
  prefix: 'cms:page:',
  options: {
    l1Ttl: 100,
    l2Ttl: 300_000,     // 5min
    tags: ['cms-pages'],
  },
  enabled: true,
};

/** Blog strategy */
export const blogStrategy: CacheStrategy = {
  name: 'blog',
  description: 'Blog posts and categories',
  prefix: 'blog:',
  options: {
    l1Ttl: 100,
    l2Ttl: 600_000,     // 10min
    tags: ['blog-posts'],
  },
  enabled: true,
};

/** Notifications strategy */
export const notificationsStrategy: CacheStrategy = {
  name: 'notifications',
  description: 'User notifications',
  prefix: 'notification:',
  options: {
    l1Ttl: 50,
    l2Ttl: 15_000,      // 15s
    tags: ['notifications'],
  },
  enabled: true,
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  Strategy Registry & Warmup
 * ═══════════════════════════════════════════════════════════════════════════ */

/** All registered strategies */
const strategyRegistry = new Map<string, CacheStrategy>();

/** Register all default strategies */
function registerDefaults(): void {
  const strategies: CacheStrategy[] = [
    goldPricesStrategy,
    sessionStrategy,
    userProfileStrategy,
    siteSettingsStrategy,
    marketDataStrategy,
    leaderboardsStrategy,
    walletStrategy,
    cmsPageStrategy,
    blogStrategy,
    notificationsStrategy,
  ];

  for (const strategy of strategies) {
    strategyRegistry.set(strategy.name, strategy);
  }
}

registerDefaults();

/**
 * Get all registered strategies.
 */
export function getAllStrategies(): CacheStrategy[] {
  return Array.from(strategyRegistry.values());
}

/**
 * Get a specific strategy by name.
 */
export function getStrategy(name: string): CacheStrategy | undefined {
  return strategyRegistry.get(name);
}

/**
 * Register a custom strategy.
 */
export function registerStrategy(strategy: CacheStrategy): void {
  strategyRegistry.set(strategy.name, strategy);
}

/**
 * Generate warmup entries for a strategy.
 * @param strategy - Cache strategy
 * @param warmupKeys - Map of key suffixes to their fetch functions
 */
export function createWarmupEntries(
  strategy: CacheStrategy,
  warmupKeys: Map<string, () => Promise<unknown>>
): WarmupEntry[] {
  const entries: WarmupEntry[] = [];
  for (const [suffix, fn] of warmupKeys.entries()) {
    entries.push({
      key: `${strategy.prefix}${suffix}`,
      fn,
      ttl: strategy.options.l2Ttl,
      tags: strategy.options.tags,
    });
  }
  return entries;
}

/**
 * Execute warmup for all strategies with provided warmup entries.
 */
export async function warmupAllStrategies(
  warmupMap: Map<string, WarmupEntry[]>
): Promise<Record<string, boolean>> {
  const allEntries: WarmupEntry[] = [];
  for (const entries of warmupMap.values()) {
    allEntries.push(...entries);
  }
  return cache.warmup(allEntries);
}

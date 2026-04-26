/* ═══════════════════════════════════════════════════════════════════════════
 *  cache/index.ts — Cache Module Barrel Export
 *  Central export point for all cache & CDN functionality.
 * ═══════════════════════════════════════════════════════════════════════════ */

// Redis Client
export {
  MemoryCacheAdapter,
  RedisCacheAdapter,
  createRedisClient,
  getRedisClient,
  resetRedisClient,
} from './redis-client';
export type {
  RedisConfig,
  RedisClusterConfig,
  RedisHealthCheck,
  CacheValueWrapper,
  ICacheAdapter,
} from './redis-client';

// Cache Manager
export {
  CacheManager,
  cache,
  resetCacheManager,
} from './cache-manager';
export type {
  CacheOptions,
  CacheStats,
  WarmupEntry,
  PrefixTtlConfig,
} from './cache-manager';

// Caching Strategies
export {
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
  getCachedGoldPrices,
  invalidateGoldPrices,
  getCachedSession,
  invalidateSession,
  invalidateUserSessions,
  getCachedUserProfile,
  invalidateUserProfile,
  getCachedSiteSettings,
  invalidateSiteSettings,
  getCachedMarketData,
  invalidateMarketData,
  getCachedLeaderboard,
  invalidateLeaderboards,
  getAllStrategies,
  getStrategy,
  registerStrategy,
  createWarmupEntries,
  warmupAllStrategies,
} from './strategies';
export type { CacheStrategy } from './strategies';

// CDN Configuration
export {
  getCDNConfig,
  getCdnUrl,
  getNextImageUrl,
  getAssetUrl,
  getFontUrl,
  getUploadUrl,
  purgeCDNCache,
  getEdgeConfig,
} from './cdn-config';
export type {
  CDNProvider,
  CDNRegion,
  PurgeResult,
  PurgeRequest,
  CDNConfiguration,
} from './cdn-config';

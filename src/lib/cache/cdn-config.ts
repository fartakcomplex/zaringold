/* ═══════════════════════════════════════════════════════════════════════════
 *  cdn-config.ts — CDN Configuration & Helpers
 *  CDN URL builder, cache purge API client, asset URL helpers,
 *  edge function configuration, and multi-region support.
 * ═══════════════════════════════════════════════════════════════════════════ */

/* ── Types ── */

/** CDN provider type */
export type CDNProvider = 'cloudflare' | 'vercel' | 'fastly' | 'custom' | 'none';

/** CDN region configuration */
export interface CDNRegion {
  /** Region identifier (e.g., "me-south", "eu-west") */
  id: string;
  /** Human-readable region name */
  name: string;
  /** Region endpoint URL */
  endpoint: string;
  /** Whether this region is active */
  active: boolean;
}

/** CDN purge result */
export interface PurgeResult {
  /** Whether the purge was successful */
  success: boolean;
  /** Number of files/URLs purged */
  purgedCount: number;
  /** Time taken in ms */
  durationMs: number;
  /** Purge ID for tracking */
  purgeId?: string;
  /** Error message if failed */
  error?: string;
}

/** Cache purge request */
export interface PurgeRequest {
  /** Specific URLs to purge */
  urls?: string[];
  /** Tags/surrogate keys to purge */
  tags?: string[];
  /** Purge everything */
  purgeAll?: boolean;
  /** Wildcard pattern to match */
  pattern?: string;
}

/** CDN configuration */
export interface CDNConfiguration {
  /** CDN provider */
  provider: CDNProvider;
  /** Base CDN URL */
  baseUrl: string;
  /** API endpoint for cache purging */
  purgeApiUrl?: string;
  /** API key for purge operations */
  purgeApiKey?: string;
  /** API token for purge operations */
  purgeApiToken?: string;
  /** Zone ID (Cloudflare) */
  zoneId?: string;
  /** Enabled regions */
  regions: CDNRegion[];
  /** Default cache TTL in seconds */
  defaultTtl: number;
  /** Stale-while-revalidate TTL in seconds */
  staleWhileRevalidate: number;
  /** Stale-if-error TTL in seconds */
  staleIfError: number;
}

/* ── Default Configuration ── */

/** Default CDN regions for ZarinGold */
const DEFAULT_REGIONS: CDNRegion[] = [
  {
    id: 'ir-central',
    name: 'Iran Central (Tehran)',
    endpoint: '',
    active: true,
  },
  {
    id: 'eu-west',
    name: 'Europe West (Frankfurt)',
    endpoint: '',
    active: false,
  },
  {
    id: 'me-south',
    name: 'Middle East South (Bahrain)',
    endpoint: '',
    active: false,
  },
];

/**
 * Get CDN configuration from environment variables.
 */
export function getCDNConfig(): CDNConfiguration {
  const provider = (process.env.CDN_PROVIDER as CDNProvider) || 'none';
  const baseUrl = process.env.NEXT_PUBLIC_CDN_URL || process.env.CDN_BASE_URL || '';

  return {
    provider,
    baseUrl,
    purgeApiUrl: process.env.CDN_PURGE_API_URL,
    purgeApiKey: process.env.CDN_PURGE_API_KEY,
    purgeApiToken: process.env.CDN_PURGE_API_TOKEN,
    zoneId: process.env.CDN_ZONE_ID,
    regions: DEFAULT_REGIONS,
    defaultTtl: parseInt(process.env.CDN_DEFAULT_TTL || '3600', 10),
    staleWhileRevalidate: parseInt(process.env.CDN_STALE_WHILE_REVALIDATE || '300', 10),
    staleIfError: parseInt(process.env.CDN_STALE_IF_ERROR || '86400', 10),
  };
}

/* ── CDN URL Builder ── */

/**
 * Build a full CDN URL for a given asset path.
 * If no CDN is configured, returns the original path.
 *
 * @param path - Asset path (e.g., "/images/logo.png")
 * @param options - Optional transformations (width, height, format, quality)
 * @returns Full CDN URL or original path
 *
 * @example
 * ```ts
 * getCdnUrl('/images/banner.jpg')
 * // => 'https://cdn.zaringold.com/images/banner.jpg'
 *
 * getCdnUrl('/images/avatar.jpg', { width: 200, height: 200, format: 'webp' })
 * // => 'https://cdn.zaringold.com/images/avatar.jpg?w=200&h=200&f=webp'
 * ```
 */
export function getCdnUrl(
  path: string,
  options?: {
    width?: number;
    height?: number;
    format?: 'webp' | 'avif' | 'png' | 'jpg';
    quality?: number;
  }
): string {
  const config = getCDNConfig();

  // No CDN configured — return path
  if (!config.baseUrl || config.provider === 'none') {
    return path;
  }

  let url = `${config.baseUrl.replace(/\/$/, '')}${path}`;

  // Append transformation parameters
  if (options) {
    const params: string[] = [];
    if (options.width) params.push(`w=${options.width}`);
    if (options.height) params.push(`h=${options.height}`);
    if (options.format) params.push(`f=${options.format}`);
    if (options.quality) params.push(`q=${options.quality}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
  }

  return url;
}

/**
 * Get the CDN URL for a Next.js optimized image.
 */
export function getNextImageUrl(path: string): string {
  const config = getCDNConfig();
  if (!config.baseUrl || config.provider === 'none') {
    return path;
  }
  return `${config.baseUrl.replace(/\/$/, '')}/_next/image?url=${encodeURIComponent(path)}`;
}

/**
 * Get the CDN URL for a static asset (from /public).
 */
export function getAssetUrl(path: string): string {
  const config = getCDNConfig();
  if (!config.baseUrl || config.provider === 'none') {
    return path.startsWith('/') ? path : `/${path}`;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${config.baseUrl.replace(/\/$/, '')}${normalizedPath}`;
}

/**
 * Get the CDN URL for fonts.
 */
export function getFontUrl(fontPath: string): string {
  return getAssetUrl(`/fonts/${fontPath}`);
}

/**
 * Get the CDN URL for uploaded files.
 */
export function getUploadUrl(filePath: string): string {
  return getAssetUrl(`/uploads/${filePath}`);
}

/* ── Cache Purge Client ── */

/**
 * Purge CDN cache entries.
 * Supports Cloudflare, Vercel, Fastly, and custom CDN providers.
 *
 * @param request - Purge request (URLs, tags, or wildcard pattern)
 * @returns Purge result with status and details
 */
export async function purgeCDNCache(request: PurgeRequest): Promise<PurgeResult> {
  const config = getCDNConfig();
  const startTime = Date.now();

  // No CDN configured
  if (config.provider === 'none' || !config.purgeApiUrl) {
    return {
      success: false,
      purgedCount: 0,
      durationMs: Date.now() - startTime,
      error: 'CDN not configured or purge API URL missing',
    };
  }

  try {
    switch (config.provider) {
      case 'cloudflare':
        return await purgeCloudflare(request, config);
      case 'vercel':
        return await purgeVercel(request, config);
      case 'fastly':
        return await purgeFastly(request, config);
      case 'custom':
        return await purgeCustom(request, config);
      default:
        return {
          success: false,
          purgedCount: 0,
          durationMs: Date.now() - startTime,
          error: `Unsupported CDN provider: ${config.provider}`,
        };
    }
  } catch (err) {
    return {
      success: false,
      purgedCount: 0,
      durationMs: Date.now() - startTime,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Purge Cloudflare cache.
 */
async function purgeCloudflare(
  request: PurgeRequest,
  config: CDNConfiguration
): Promise<PurgeResult> {
  if (!config.zoneId || !config.purgeApiToken) {
    return {
      success: false,
      purgedCount: 0,
      durationMs: 0,
      error: 'Cloudflare zone ID or API token not configured',
    };
  }

  const startTime = Date.now();

  // Purge by files
  if (request.urls && request.urls.length > 0) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.purgeApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: request.urls }),
      }
    );

    const result = await response.json();
    return {
      success: result.success,
      purgedCount: request.urls.length,
      durationMs: Date.now() - startTime,
      purgeId: result.id,
    };
  }

  // Purge by tags
  if (request.tags && request.tags.length > 0) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.purgeApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags: request.tags }),
      }
    );

    const result = await response.json();
    return {
      success: result.success,
      purgedCount: request.tags.length,
      durationMs: Date.now() - startTime,
      purgeId: result.id,
    };
  }

  // Purge everything
  if (request.purgeAll) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.purgeApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ purge_everything: true }),
      }
    );

    const result = await response.json();
    return {
      success: result.success,
      purgedCount: -1, // Unknown for full purge
      durationMs: Date.now() - startTime,
      purgeId: result.id,
    };
  }

  return {
    success: false,
    purgedCount: 0,
    durationMs: Date.now() - startTime,
    error: 'No purge targets specified',
  };
}

/**
 * Purge Vercel Edge cache.
 */
async function purgeVercel(
  request: PurgeRequest,
  config: CDNConfiguration
): Promise<PurgeResult> {
  const startTime = Date.now();

  if (request.tags && request.tags.length > 0) {
    // Vercel supports surrogate key purging via API
    const tagPurges = await Promise.allSettled(
      request.tags.map(async (tag) => {
        const res = await fetch(`${config.purgeApiUrl!}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.purgeApiToken || config.purgeApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keys: [tag],
          }),
        });
        return res.ok;
      })
    );

    const successCount = tagPurges.filter(r => r.status === 'fulfilled' && r.value).length;

    return {
      success: successCount === request.tags!.length,
      purgedCount: successCount,
      durationMs: Date.now() - startTime,
    };
  }

  // URL-based purge for Vercel
  if (request.urls && request.urls.length > 0) {
    const urlPurges = await Promise.allSettled(
      request.urls.map(async (url) => {
        const res = await fetch(url, {
          method: 'PURGE',
          headers: {
            'Authorization': `Bearer ${config.purgeApiToken || config.purgeApiKey}`,
          },
        });
        return res.ok;
      })
    );

    const successCount = urlPurges.filter(r => r.status === 'fulfilled' && r.value).length;

    return {
      success: successCount === request.urls!.length,
      purgedCount: successCount,
      durationMs: Date.now() - startTime,
    };
  }

  return {
    success: false,
    purgedCount: 0,
    durationMs: Date.now() - startTime,
    error: 'Vercel purge requires tags or URLs',
  };
}

/**
 * Purge Fastly cache.
 */
async function purgeFastly(
  request: PurgeRequest,
  config: CDNConfiguration
): Promise<PurgeResult> {
  const startTime = Date.now();

  // Fastly supports surrogate key purging
  if (request.tags && request.tags.length > 0) {
    const response = await fetch(config.purgeApiUrl!, {
      method: 'POST',
      headers: {
        'Fastly-Key': config.purgeApiKey || '',
        'Surrogate-Key': request.tags.join(' '),
        'Fastly-Soft-Purge': '1',
      },
    });

    return {
      success: response.ok,
      purgedCount: request.tags.length,
      durationMs: Date.now() - startTime,
    };
  }

  return {
    success: false,
    purgedCount: 0,
    durationMs: Date.now() - startTime,
    error: 'Fastly purge requires tags',
  };
}

/**
 * Purge custom CDN via generic API.
 */
async function purgeCustom(
  request: PurgeRequest,
  config: CDNConfiguration
): Promise<PurgeResult> {
  const startTime = Date.now();

  try {
    const response = await fetch(config.purgeApiUrl!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.purgeApiToken || config.purgeApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();
    return {
      success: response.ok,
      purgedCount: result.purgedCount || request.urls?.length || request.tags?.length || 0,
      durationMs: Date.now() - startTime,
      purgeId: result.purgeId,
    };
  } catch (err) {
    return {
      success: false,
      purgedCount: 0,
      durationMs: Date.now() - startTime,
      error: err instanceof Error ? err.message : 'Custom CDN purge failed',
    };
  }
}

/* ── Edge Function Configuration Helpers ── */

/**
 * Get edge function configuration for CDN.
 * Returns headers and settings that should be applied at the CDN edge.
 */
export function getEdgeConfig(): {
  securityHeaders: Record<string, string>;
  cacheRules: Array<{
    pattern: string;
    cacheControl: string;
    surrogateKey?: string;
  }>;
  botProtection: {
    enabled: boolean;
    challengePage: string;
    allowedBots: string[];
  };
} {
  return {
    securityHeaders: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(self), geolocation=(self)',
    },
    cacheRules: [
      {
        pattern: '/_next/static/*',
        cacheControl: 'public, max-age=31536000, immutable',
      },
      {
        pattern: '/fonts/*',
        cacheControl: 'public, max-age=31536000, immutable',
      },
      {
        pattern: '/images/*',
        cacheControl: 'public, max-age=86400, stale-while-revalidate=43200',
      },
      {
        pattern: '/uploads/*',
        cacheControl: 'public, max-age=86400, stale-while-revalidate=43200',
      },
      {
        pattern: '/api/gold/prices*',
        cacheControl: 'public, s-maxage=5, stale-while-revalidate=60',
        surrogateKey: 'gold-prices',
      },
      {
        pattern: '/api/site-settings*',
        cacheControl: 'public, s-maxage=600, stale-while-revalidate=300',
        surrogateKey: 'site-settings',
      },
      {
        pattern: '/api/blog/*',
        cacheControl: 'public, s-maxage=60, stale-while-revalidate=300',
        surrogateKey: 'blog-posts',
      },
    ],
    botProtection: {
      enabled: true,
      challengePage: '/api/bot-challenge',
      allowedBots: [
        'Googlebot',
        'bingbot',
        'Baiduspider',
        'YandexBot',
        'DuckDuckBot',
        'facebookexternalhit',
        'Twitterbot',
        'telegrambot',
      ],
    },
  };
}

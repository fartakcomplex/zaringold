/* ═══════════════════════════════════════════════════════════════════════════
 *  middleware.ts — Next.js Edge Middleware
 *  Rate limiting, CDN cache headers, security headers, geo-blocking,
 *  bot detection, and response compression hints for ZarinGold.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';

/* ── Configuration ── */

/** Rate limit configuration per route pattern */
interface RateLimitRule {
  /** Requests allowed in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

/** Rate limit rules keyed by route pattern prefix */
const RATE_LIMIT_RULES: Record<string, RateLimitRule> = {
  '/api/auth/': { maxRequests: 10, windowSeconds: 60 },         // Auth: 10/min
  '/api/auth/send-otp': { maxRequests: 5, windowSeconds: 60 },  // OTP: 5/min
  '/api/gold/': { maxRequests: 60, windowSeconds: 60 },         // Gold: 60/min
  '/api/wallet/': { maxRequests: 30, windowSeconds: 60 },       // Wallet: 30/min
  '/api/payment/': { maxRequests: 20, windowSeconds: 60 },      // Payment: 20/min
  '/api/admin/': { maxRequests: 60, windowSeconds: 60 },        // Admin: 60/min
  '/api/': { maxRequests: 120, windowSeconds: 60 },             // API default: 120/min
};

/** IP-based rate limit store (in-memory for edge) */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/** Known good bot User-Agents (search engines, social previews) */
const ALLOWED_BOTS = [
  /Googlebot/i,
  /bingbot/i,
  /Baiduspider/i,
  /YandexBot/i,
  /DuckDuckBot/i,
  /facebookexternalhit/i,
  /Twitterbot/i,
  /telegrambot/i,
  /Slackbot/i,
  /LinkedInBot/i,
  /AhrefsBot/i,
  /MJ12bot/i,
];

/** Malicious bot patterns */
const MALICIOUS_BOTS = [
  /sqlmap/i,
  /nikto/i,
  /nmap/i,
  /metasploit/i,
  /masscan/i,
  /dirbuster/i,
  /gobuster/i,
  /wfuzz/i,
  /hydra/i,
];

/** Geo allowed countries (ISO 3166-1 alpha-2). Empty = allow all. */
const GEO_ALLOWED_COUNTRIES: string[] = process.env.GEO_ALLOWED_COUNTRIES
  ? process.env.GEO_ALLOWED_COUNTRIES.split(',').map(c => c.trim())
  : []; // Allow all by default

/** Blocked IP ranges (CIDR notation check simplified) */
const BLOCKED_IPS = new Set<string>(
  process.env.BLOCKED_IPS ? process.env.BLOCKED_IPS.split(',') : []
);

/** Paths that bypass all checks */
const BYPASS_PATHS = [
  '/api/health',
  '/api/health-check',
  '/_next/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

/** Paths that are never cached */
const NO_CACHE_PATHS = [
  '/api/auth/',
  '/api/wallet/',
  '/api/payment/',
  '/api/gold/buy',
  '/api/gold/sell',
  '/api/checkout/',
];

/* ── Helper Functions ── */

/**
 * Extract client IP from request headers.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  return 'unknown';
}

/**
 * Check if a path matches any of the given patterns.
 */
function matchesPattern(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => pathname.startsWith(pattern));
}

/**
 * Check if a User-Agent is an allowed search engine bot.
 */
function isAllowedBot(userAgent: string): boolean {
  return ALLOWED_BOTS.some(pattern => pattern.test(userAgent));
}

/**
 * Check if a User-Agent is a malicious bot.
 */
function isMaliciousBot(userAgent: string): boolean {
  return MALICIOUS_BOTS.some(pattern => pattern.test(userAgent));
}

/**
 * Sliding window rate limiter (in-memory, works in edge runtime).
 * Returns true if the request should be allowed.
 */
function checkRateLimit(ip: string, pathname: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  // Find the most specific matching rule
  let matchedRule: RateLimitRule | null = null;
  let matchedPrefix = '';

  for (const [prefix, rule] of Object.entries(RATE_LIMIT_RULES)) {
    if (pathname.startsWith(prefix) && prefix.length > matchedPrefix.length) {
      matchedRule = rule;
      matchedPrefix = prefix;
    }
  }

  // No rate limit rule found — allow
  if (!matchedRule) {
    return { allowed: true, remaining: Infinity, resetAt: 0 };
  }

  const now = Math.floor(Date.now() / 1000);
  const key = `${ip}:${matchedPrefix}`;
  const entry = rateLimitStore.get(key);

  if (!entry || now >= entry.resetAt) {
    // New window
    const resetAt = now + matchedRule.windowSeconds;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: matchedRule.maxRequests - 1,
      resetAt,
    };
  }

  if (entry.count >= matchedRule.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: matchedRule.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Clean up expired rate limit entries periodically.
 */
function cleanupRateLimits(): void {
  const now = Math.floor(Date.now() / 1000);
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 300_000);
}

/**
 * Get appropriate Cache-Control header value for the given path.
 */
function getCacheControl(pathname: string): string | null {
  // Static assets: immutable, 1 year
  if (pathname.startsWith('/_next/static/')) {
    return 'public, max-age=31536000, immutable';
  }

  // Fonts
  if (pathname.startsWith('/fonts/')) {
    return 'public, max-age=31536000, immutable';
  }

  // Images and uploads
  if (
    pathname.startsWith('/images/') ||
    pathname.startsWith('/uploads/') ||
    pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2|woff|ttf|eot)$/i)
  ) {
    return 'public, max-age=86400, stale-while-revalidate=43200';
  }

  // API endpoints: no-store unless explicitly cached
  if (pathname.startsWith('/api/')) {
    // Some API endpoints can be cached
    if (
      pathname.startsWith('/api/gold/prices') ||
      pathname.startsWith('/api/site-settings') ||
      pathname.startsWith('/api/blog/') ||
      pathname.startsWith('/api/cms/')
    ) {
      return 'public, s-maxage=60, stale-while-revalidate=300';
    }
    return 'no-store, must-revalidate';
  }

  // Pages: cache at CDN edge, revalidate in background
  if (
    pathname === '/' ||
    pathname.startsWith('/landing') ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/faq') ||
    pathname.startsWith('/features') ||
    pathname.startsWith('/pricing')
  ) {
    return 'public, s-maxage=60, stale-while-revalidate=300';
  }

  // Default: no cache
  return 'no-store';
}

/**
 * Build security headers for the response.
 */
function getSecurityHeaders(pathname: string): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(self), geolocation=(self), payment=()',
    'X-Powered-By': 'none',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-Download-Options': 'noopen',
  };

  // HSTS only in production
  if (process.env.NODE_ENV === 'production') {
    headers['Strict-Transport-Security'] =
      'max-age=31536000; includeSubDomains; preload';
  }

  // CSP — stricter for pages, more relaxed for API
  if (pathname.startsWith('/api/')) {
    headers['Content-Security-Policy'] =
      "default-src 'none'; frame-ancestors 'none'";
  } else {
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https: wss: http:",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
  }

  return headers;
}

/* ── Main Middleware ── */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ── 1. Bypass paths (health checks, static internals) ──
  if (matchesPattern(pathname, BYPASS_PATHS)) {
    // Still add security headers
    const securityHeaders = getSecurityHeaders(pathname);
    for (const [key, value] of Object.entries(securityHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  }

  // ── 2. Blocked IPs ──
  const clientIp = getClientIp(request);
  if (BLOCKED_IPS.has(clientIp)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // ── 3. Bot detection ──
  const userAgent = request.headers.get('user-agent') || '';

  // Check for malicious bots
  if (isMaliciousBot(userAgent)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Allow known good bots (search engines, social previews)
  const isBot = isAllowedBot(userAgent);

  if (!isBot) {
    // Check for missing or suspicious User-Agent on API routes
    if (pathname.startsWith('/api/') && userAgent.length < 20) {
      return new NextResponse('Bad Request', { status: 400 });
    }
  }

  // ── 4. Geo-blocking (if configured) ──
  if (GEO_ALLOWED_COUNTRIES.length > 0) {
    // Vercel/Cloudflare set this header
    const country = request.headers.get('x-vercel-ip-country') ||
                    request.headers.get('cf-ipcountry') || '';

    if (country && !GEO_ALLOWED_COUNTRIES.includes(country)) {
      // Return a geo-blocked page
      return new NextResponse(
        JSON.stringify({ error: 'Service not available in your region', code: 'GEO_BLOCKED' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // ── 5. Rate limiting ──
  if (pathname.startsWith('/api/')) {
    const rateLimit = checkRateLimit(clientIp, pathname);

    if (!rateLimit.allowed) {
      const retryAfter = Math.max(0, rateLimit.resetAt - Math.floor(Date.now() / 1000));
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          code: 'RATE_LIMITED',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          },
        }
      );
    }

    // Add rate limit headers
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimit.resetAt));
  }

  // ── 6. Security headers ──
  const securityHeaders = getSecurityHeaders(pathname);
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // ── 7. CDN Cache-Control headers ──
  const cacheControl = getCacheControl(pathname);
  if (cacheControl) {
    response.headers.set('Cache-Control', cacheControl);
  }

  // ── 8. CDN-specific headers ──
  // Tell Cloudflare/Vercel edge to cache
  if (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/images/')
  ) {
    response.headers.set('CDN-Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Surrogate keys for targeted cache purging at CDN level
  if (pathname.startsWith('/api/gold/prices')) {
    response.headers.set('Surrogate-Key', 'gold-prices api-data');
  } else if (pathname.startsWith('/api/site-settings')) {
    response.headers.set('Surrogate-Key', 'site-settings api-data');
  } else if (pathname.startsWith('/api/blog/')) {
    response.headers.set('Surrogate-Key', 'blog-posts api-data');
  } else if (pathname.startsWith('/api/gamification/leaderboard')) {
    response.headers.set('Surrogate-Key', 'leaderboards api-data');
  }

  // ── 9. Compression hints ──
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  if (acceptEncoding.includes('br')) {
    response.headers.set('Vary', 'Accept-Encoding');
  }

  // ── 10. Correlation ID for tracing ──
  const requestId = request.headers.get('x-request-id') ||
                    crypto.randomUUID?.() ||
                    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  response.headers.set('X-Request-ID', requestId);

  return response;
}

/**
 * Middleware matcher — define which routes the middleware runs on.
 */
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (handled by Next.js)
     * - _next/image (handled by Next.js)
     * - favicon.ico (handled by Next.js)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
};

import { NextRequest, NextResponse } from 'next/server';

/* ═══════════════════════════════════════════════════════════════════════════
 *  middleware.ts — Security Shield — دروازه اصلی امنیت
 *  هدرهای امنیتی، مسدودسازی ربات، محدودیت نرخ، IP بلاک
 *
 *  ⚡ سوپر ادمین از تمام سپرها معاف است (لحن سفید / whitelist)
 * ═══════════════════════════════════════════════════════════════════════════ */

/* ── Super Admin Bypass ── */
const SUPER_ADMIN_BYPASS_COOKIE = 'shield_bypass';
const SUPER_ADMIN_BYPASS_VALUE = 'super_admin_immune';

/* ── Loopback IPs (sandbox / dev) ── */
const LOOPBACK_IPS = new Set(['::1', '127.0.0.1', 'localhost', '::ffff:127.0.0.1']);

/* ── Security Headers ── */
const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'SAMEORIGIN',
  'Content-Security-Policy': "frame-ancestors 'self' https://*.space.z.ai https://*.z.ai",

  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=(self), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Powered-By': 'none',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
};

/* ── Bot Detection Patterns ── */
const BOT_PATTERNS = [
  /bot\b/i, /crawler\b/i, /spider\b/i, /scraper\b/i,
  /curl\b/i, /wget\b/i, /python-requests/i, /python-urllib/i,
  /httpclient/i, /go-http/i, /node-fetch/i, /axios\b/i,
  /postman/i, /insomnia/i, /swagger/i,
  /metasploit/i, /nmap/i, /nikto/i, /sqlmap/i, /burp\b/i,
  /HeadlessChrome/i, /PhantomJS/i, /selenium/i, /puppeteer/i, /playwright/i,
  /webdriver/i, /chrome-lighthouse/i,
];

/* ── In-Memory Rate Limit (Edge) ── */
const rateStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/auth/send-otp': { max: 5, windowMs: 60000 },
  '/api/auth/verify-otp': { max: 10, windowMs: 60000 },
  '/api/auth/password-login': { max: 5, windowMs: 60000 },
  '/api/auth/admin-login': { max: 5, windowMs: 60000 },
  '/api/auth/set-password': { max: 3, windowMs: 3600000 },
  '/api/auth/forgot-password': { max: 3, windowMs: 3600000 },
};

/* ── Blocked IPs (in-memory, persistent in DB in production) ── */
const blockedIPs = new Set<string>();

/* ── Cleanup ── */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateStore.entries()) {
    if (entry.resetAt < now) rateStore.delete(key);
  }
}, 60000);

/* ── Helpers ── */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

function isBotUA(ua: string): boolean {
  return BOT_PATTERNS.some(p => p.test(ua));
}

/**
 * بررسی لحن سفید — سوپر ادمین از تمام سپرها معاف است
 */
function isSuperAdminBypass(request: NextRequest, ip: string): boolean {
  // ۱. بررسی کوکی shield_bypass
  const cookies = request.cookies;
  if (cookies.get(SUPER_ADMIN_BYPASS_COOKIE)?.value === SUPER_ADMIN_BYPASS_VALUE) {
    return true;
  }

  // ۲. بررسی IP لوکال‌هاست (توسعه / sandbox)
  if (LOOPBACK_IPS.has(ip)) {
    return true;
  }

  return false;
}

function checkRateLimit(ip: string, path: string): { allowed: boolean; remaining: number } {
  // Find matching rate limit config
  let matched = false;
  let config = { max: 60, windowMs: 60000 }; // default: 60/min

  for (const [route, limitConfig] of Object.entries(RATE_LIMITS)) {
    if (path.startsWith(route)) {
      config = limitConfig;
      matched = true;
      break;
    }
  }

  // For non-auth API routes, use a general limit
  if (!matched && path.startsWith('/api/')) {
    config = { max: 120, windowMs: 60000 };
  }

  const key = `${ip}:${path}`;
  const now = Date.now();
  let entry = rateStore.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + config.windowMs };
    rateStore.set(key, entry);
  }

  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: config.max - entry.count };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);
  const ua = request.headers.get('user-agent') || '';

  // ── ⚡ بررسی لحن سفید سوپر ادمین — رد شدن از تمام سپرها ──
  const isWhitelisted = isSuperAdminBypass(request, ip);

  // Skip Next.js internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/__nextjs') ||
    pathname === '/favicon.ico' ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.startsWith('/uploads/')
  ) {
    return NextResponse.next();
  }

  // ۱. Blocked IP check (skip for super admin)
  if (!isWhitelisted && blockedIPs.has(ip)) {
    return new NextResponse('Forbidden — Access Denied', {
      status: 403,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // ۲. Bot detection — فقط برای API routes (skip for super admin)
  if (!isWhitelisted && pathname.startsWith('/api/') && isBotUA(ua)) {
    console.warn(`[Security] Bot blocked: IP=${ip} UA=${ua.substring(0, 60)}`);
    return new NextResponse('Forbidden', { status: 403, headers: { 'Content-Type': 'text/plain' } });
  }

  // ۳. Rate limiting for API routes (skip for super admin)
  if (!isWhitelisted && pathname.startsWith('/api/')) {
    const rateResult = checkRateLimit(ip, pathname);
    if (!rateResult.allowed) {
      console.warn(`[Security] Rate limited: IP=${ip} Path=${pathname}`);
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Content-Type': 'text/plain',
          'Retry-After': '60',
        },
      });
    }
  }

  // ۴. Apply security headers to all responses
  const response = NextResponse.next();

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // Add request ID
  const requestId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
  response.headers.set('X-Request-ID', requestId.substring(0, 8));

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

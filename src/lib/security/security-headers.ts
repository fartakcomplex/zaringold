

/* ═══════════════════════════════════════════════════════════════════════════
 *  security-headers.ts — هدرهای امنیتی HTTP
 *  برای Next.js middleware و API routes
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * دریافت هدرهای امنیتی برای تمام پاسخ‌ها
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    // جلوگیری از iframe clickjacking (SAMEORIGIN — اجازه embed از دامنه خود)
    'X-Frame-Options': 'SAMEORIGIN',

    // جلوگیری از MIME sniffing
    'X-Content-Type-Options': 'nosniff',

    // جلوگیری از XSS (مرورگرهای قدیمی)
    'X-XSS-Protection': '1; mode=block',

    // محدود کردن اطلاعات Referrer
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // کنترل دسترسی ویژگی‌های مرورگر
    'Permissions-Policy': 'camera=(), microphone=(self), geolocation=(self), payment=()',

    // HSTS — فقط HTTPS
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

    // حذف X-Powered-By
    'X-Powered-By': 'none',

    // Content-Security-Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' 'https://fonts.googleapis.com'",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https: wss: http:",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),

    // جلوگیری از Sniffing
    'X-Permitted-Cross-Domain-Policies': 'none',

    // SSL
    'X-Download-Options': 'noopen',
  };
}

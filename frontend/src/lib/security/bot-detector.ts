

/* ═══════════════════════════════════════════════════════════════════════════
 *  bot-detector.ts — تشخیص ربات‌ها
 *  Honeypot، رفتار موس، سرعت، تشخیص Headless Browser
 * ═══════════════════════════════════════════════════════════════════════════ */

import {NextRequest} from 'next/server';

/**
 * نام فیلد honeypot — باید hidden باشد، کاربر واقعی آن را پر نمی‌کند
 */
export const HONEYPOT_FIELD_NAME = '_hp_confirm_email';

/**
 * الگوهای User-Agent ربات‌ها
 */
export const BOT_USER_AGENTS: RegExp[] = [
  /bot\b/i,
  /crawler\b/i,
  /spider\b/i,
  /scraper\b/i,
  /curl\b/i,
  /wget\b/i,
  /python-requests/i,
  /python-urllib/i,
  /httpclient/i,
  /java\b.*\bclient/i,
  /go-http/i,
  /node-fetch/i,
  /axios/i,
  /postman/i,
  /insomnia/i,
  /swagger/i,
  /metasploit/i,
  /nmap/i,
  /nikto/i,
  /sqlmap/i,
  /burp\b/i,
];

/**
 * الگوهای مرورگر بدون سر (Headless)
 */
export const HEADLESS_PATTERNS: RegExp[] = [
  /HeadlessChrome/i,
  /PhantomJS/i,
  /SlimerJS/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  /webdriver/i,
  /chrome-lighthouse/i,
  /Googlebot/i,
  /bingbot/i,
  /YandexBot/i,
  /Baiduspider/i,
  /DuckDuckBot/i,
  /facebookexternalhit/i,
  /Twitterbot/i,
  /discord/i,
  /telegrambot/i,
];

/**
 * تشخیص ربات از درخواست HTTP
 */
export function isLikelyBot(request: NextRequest): {
  isBot: boolean;
  reason: string;
  score: number; // 0-100 — بالاتر = بیشتر شبیه ربات
} {
  const ua = request.headers.get('user-agent') || '';
  const ip = getClientIp(request);
  let score = 0;
  const reasons: string[] = [];

  // بدون User-Agent = قطعاً ربات
  if (!ua || ua.length < 10) {
    return { isBot: true, reason: 'بدون User-Agent', score: 100 };
  }

  // بررسی الگوهای ربات
  for (const pattern of BOT_USER_AGENTS) {
    if (pattern.test(ua)) {
      score += 30;
      reasons.push(`UA ربات: ${ua.substring(0, 50)}`);
      break;
    }
  }

  // بررسی Headless Browser
  for (const pattern of HEADLESS_PATTERNS) {
    if (pattern.test(ua)) {
      score += 40;
      reasons.push(`Headless Browser: ${ua.substring(0, 50)}`);
      break;
    }
  }

  // بدون Accept header
  const accept = request.headers.get('accept');
  if (!accept) {
    score += 15;
    reasons.push('بدون Accept header');
  }

  // بدون Accept-Language
  const acceptLang = request.headers.get('accept-language');
  if (!acceptLang) {
    score += 10;
    reasons.push('بدون Accept-Language');
  }

  // بدون Referer و مستقیم به API
  const referer = request.headers.get('referer');
  const isApiCall = request.nextUrl.pathname.startsWith('/api/');
  if (!referer && isApiCall) {
    score += 5;
  }

  // بررسی IP خصوصی / آدرس‌های مشکوک
  if (ip === '127.0.0.1' || ip === '::1') {
    score += 5; // فقط کمی مشکوک
  }

  const isBot = score >= 40;

  return {
    isBot,
    reason: reasons.length > 0 ? reasons.join(' | ') : 'واضح نیست',
    score: Math.min(100, score),
  };
}

/**
 * بررسی فیلد Honeypot — اگر پر شده = ربات
 */
export function validateHoneypot(formData: Record<string, unknown>): boolean {
  const value = formData[HONEYPOT_FIELD_NAME];
  return !!value; // اگر فیلد honeypot مقدار داشته = ربات
}

/**
 * تحلیل سرعت درخواست — خیلی سریع = مشکوک
 */
export function analyzeRequestTiming(startTime: number): {
  tooFast: boolean;
  durationMs: number;
} {
  const duration = Date.now() - startTime;
  return {
    tooFast: duration < 100, // کمتر از ۱۰۰ میلی‌ثانیه = مشکوک
    durationMs: duration,
  };
}

/**
 * استخراج IP از درخواست
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

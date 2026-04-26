

/* ═══════════════════════════════════════════════════════════════════════════
 *  rate-limiter.ts — موتور محدودیت نرخ درخواست (در حافظه)
 *  بدون وابستگی خارجی — Map با پاکسازی خودکار
 * ═══════════════════════════════════════════════════════════════════════════ */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitEntry {
  timestamps: number[];
  blockedUntil?: number;
}

interface RateLimiterResult {
  success: boolean;
  remaining: number;
  retryAfterMs?: number;
  blocked: boolean;
}

/* ── In-Memory Store ── */
const store = new Map<string, RateLimitEntry>();

// پاکسازی خودکار هر ۵ دقیقه
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      // حذف ورودی‌های قدیمی (بیشتر از ۱ ساعت)
      if (entry.timestamps.length > 0 && entry.timestamps[entry.timestamps.length - 1] < now - 3600000) {
        if (!entry.blockedUntil || entry.blockedUntil < now) {
          store.delete(key);
        }
      }
    }
  }, 300000); // ۵ دقیقه
}

startCleanup();

/**
 * ایجاد محدودکننده نرخ سفارشی
 */
export function createRateLimiter(config: RateLimitConfig) {
  return {
    check(identifier: string): RateLimiterResult {
      const now = Date.now();
      const key = identifier;
      let entry = store.get(key);

      if (!entry) {
        entry = { timestamps: [] };
        store.set(key, entry);
      }

      // بررسی مسدود بودن
      if (entry.blockedUntil && entry.blockedUntil > now) {
        return {
          success: false,
          remaining: 0,
          retryAfterMs: entry.blockedUntil - now,
          blocked: true,
        };
      }

      // حذف تایم‌استمپ‌های خارج از پنجره
      const windowStart = now - config.windowMs;
      entry.timestamps = entry.timestamps.filter(t => t > windowStart);

      // بررسی محدودیت
      if (entry.timestamps.length >= config.maxRequests) {
        const blockUntil = config.blockDurationMs ? now + config.blockDurationMs : now + 60000;
        entry.blockedUntil = blockUntil;
        return {
          success: false,
          remaining: 0,
          retryAfterMs: config.blockDurationMs || 60000,
          blocked: true,
        };
      }

      // ثبت درخواست
      entry.timestamps.push(now);
      const remaining = config.maxRequests - entry.timestamps.length;

      return {
        success: true,
        remaining,
        blocked: false,
      };
    },

    getRemaining(identifier: string): number {
      const entry = store.get(identifier);
      if (!entry) return 0;
      const now = Date.now();
      const windowStart = now - config.windowMs;
      const recent = entry.timestamps.filter(t => t > windowStart);
      return Math.max(0, config.maxRequests - recent.length);
    },

    reset(identifier: string): void {
      store.delete(identifier);
    },
  };
}

/* ── محدودکننده‌های از پیش تعریف شده ── */

// ورود: ۵ درخواست در دقیقه، ۱۵ در ساعت، مسدود ۱۵ دقیقه
export const loginLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60000,
  blockDurationMs: 900000,
});

// ثبت‌نام: ۳ درخواست در ساعت
export const registerLimiter = createRateLimiter({
  maxRequests: 3,
  windowMs: 3600000,
  blockDurationMs: 1800000,
});

// ارسال OTP: ۵ در دقیقه، ۱۰ در ساعت
export const otpLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60000,
  blockDurationMs: 900000,
});

// API عمومی: ۶۰ درخواست در دقیقه
export const apiLimiter = createRateLimiter({
  maxRequests: 60,
  windowMs: 60000,
  blockDurationMs: 30000,
});

// پنل ادمین: ۳۰ درخواست در دقیقه
export const adminLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60000,
  blockDurationMs: 60000,
});

// فراموشی رمز: ۳ درخواست در ساعت
export const passwordLimiter = createRateLimiter({
  maxRequests: 3,
  windowMs: 3600000,
  blockDurationMs: 1800000,
});

/**
 * دریافت آمار محدودکننده‌ها (برای داشبورد)
 */
export function getRateLimitStats(): { totalEntries: number; blockedCount: number } {
  let blockedCount = 0;
  const now = Date.now();
  for (const entry of store.values()) {
    if (entry.blockedUntil && entry.blockedUntil > now) {
      blockedCount++;
    }
  }
  return { totalEntries: store.size, blockedCount };
}

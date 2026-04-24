

/* ═══════════════════════════════════════════════════════════════════════════
 *  suspicious-behavior.ts — تشخیص رفتار مشکوک
 *  تلاش‌های ناموفق متعدد، لاگین از کشورهای مختلف، درخواست زیاد
 * ═══════════════════════════════════════════════════════════════════════════ */

import { db } from '@/lib/db';

export const CHALLENGE_THRESHOLD = 10; // ۱۰ تلاش ناموفق → چالش (کپچا)
export const FREEZE_THRESHOLD = 20; // ۲۰ تلاش ناموفق → مسدود شدن

interface FailedAttemptEntry {
  count: number;
  lastAttempt: number;
  ips: Set<string>;
}

// ذخیره موقت تلاش‌های ناموفق (phone → entry)
const failedAttempts = new Map<string, FailedAttemptEntry>();

// پاکسازی هر ۱۰ دقیقه
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of failedAttempts.entries()) {
    // حذف ورودی‌های قدیمی‌تر از ۱ ساعت
    if (entry.lastAttempt < now - 3600000) {
      failedAttempts.delete(key);
    }
  }
}, 600000);

interface CheckResult {
  shouldFreeze: boolean;
  shouldChallenge: boolean;
  reason: string;
  failedCount: number;
}

/**
 * بررسی تلاش‌های ورود ناموفق
 */
export function checkLoginAttempts(phone: string, ip: string): CheckResult {
  const key = phone;
  const entry = failedAttempts.get(key);

  if (!entry) {
    return { shouldFreeze: false, shouldChallenge: false, reason: '', failedCount: 0 };
  }

  return {
    shouldFreeze: entry.count >= FREEZE_THRESHOLD,
    shouldChallenge: entry.count >= CHALLENGE_THRESHOLD && entry.count < FREEZE_THRESHOLD,
    reason: entry.count >= FREEZE_THRESHOLD
      ? `حساب مسدود شد (${entry.count} تلاش ناموفق)`
      : entry.count >= CHALLENGE_THRESHOLD
        ? `نیاز به تأیید (${entry.count} تلاش ناموفق)`
        : '',
    failedCount: entry.count,
  };
}

/**
 * ثبت تلاش ناموفق
 */
export async function recordFailedAttempt(phone: string, ip: string): Promise<void> {
  const key = phone;
  let entry = failedAttempts.get(key);

  if (!entry) {
    entry = { count: 0, lastAttempt: 0, ips: new Set() };
    failedAttempts.set(key, entry);
  }

  entry.count++;
  entry.lastAttempt = Date.now();
  entry.ips.add(ip);

  // اگر به حد مسدود شدن رسید، کاربر را منجمد کن
  if (entry.count === FREEZE_THRESHOLD) {
    try {
      const user = await db.user.findUnique({ where: { phone } });
      if (user) {
        await db.user.update({
          where: { phone },
          data: { isFrozen: true },
        });

        // ثبت رویداد امنیتی
        await db.securityEvent.create({
          data: {
            type: 'account_frozen',
            severity: 'critical',
            userId: user.id,
            phone,
            ip,
            details: JSON.stringify({
              reason: 'تلاش‌های ناموفق بیش از حد مجاز',
              failedCount: entry.count,
              ips: Array.from(entry.ips),
            }),
            riskScore: 95,
          },
        });
      }
    } catch {
      // خطا نباید باعث شکست شود
    }
  }

  // ثبت رویداد برای آستانه چالش
  if (entry.count === CHALLENGE_THRESHOLD) {
    try {
      await db.securityEvent.create({
        data: {
          type: 'suspicious_activity',
          severity: 'warning',
          phone,
          ip,
          details: JSON.stringify({ reason: 'نیاز به تأیید انسانی', failedCount: entry.count }),
          riskScore: 60,
        },
      });
    } catch { /* ignore */ }
  }
}

/**
 * ثبت ورود موفق — ریست شمارنده تلاش‌ها
 */
export async function recordSuccessfulLogin(phone: string, ip: string, userId: string): Promise<void> {
  failedAttempts.delete(phone);

  try {
    await db.securityEvent.create({
      data: {
        type: 'auth_success',
        severity: 'info',
        userId,
        phone,
        ip,
        riskScore: 0,
      },
    });
  } catch { /* ignore */ }
}

/**
 * بررسی آیا حساب باید مسدود شود
 */
export async function shouldFreezeAccount(phone: string): Promise<{
  shouldFreeze: boolean;
  reason: string;
  failedCount: number;
}> {
  // بررسی حافظه
  const entry = failedAttempts.get(phone);
  if (entry && entry.count >= FREEZE_THRESHOLD) {
    return {
      shouldFreeze: true,
      reason: `${entry.count} تلاش ناموفق متوالی`,
      failedCount: entry.count,
    };
  }

  // بررسی دیتابیس
  const user = await db.user.findUnique({ where: { phone } });
  if (user?.isFrozen) {
    return {
      shouldFreeze: true,
      reason: 'حساب قبلاً مسدود شده',
      failedCount: entry?.count || 0,
    };
  }

  return { shouldFreeze: false, reason: '', failedCount: entry?.count || 0 };
}

/**
 * بررسی ورود از کشورهای مختلف (ساده‌شده)
 * در محیط تولید باید از GeoIP database استفاده شود
 */
export async function checkMultiCountryLogin(userId: string, currentIp: string): Promise<{
  suspicious: boolean;
  countries: string[];
}> {
  // پیاده‌سازی ساده — فقط IP‌های اخیر را بررسی می‌کند
  // در پروداکشن با MaxMind GeoIP جایگزین شود
  try {
    const recentSessions = await db.userSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { ip: true },
    });

    const ips = recentSessions
      .map(s => s.ip)
      .filter((ip): ip is string => !!ip && ip !== currentIp);

    // اگر بیش از ۳ IP متفاوت داشته باشد → مشکوک
    const uniqueIps = new Set(ips);

    if (uniqueIps.size >= 3) {
      return {
        suspicious: true,
        countries: Array.from(uniqueIps), // در واقع IP‌ها، نه کشورها
      };
    }

    return { suspicious: false, countries: [] };
  } catch {
    return { suspicious: false, countries: [] };
  }
}

/**
 * بررسی درخواست‌های سریع
 */
export function checkRapidRequests(ip: string, windowMs: number = 60000): {
  suspicious: boolean;
  count: number;
} {
  // این در rate-limiter.ts پیاده‌سازی شده
  // این تابع برای بررسی‌های اضافی استفاده می‌شود
  return { suspicious: false, count: 0 };
}

/**
 * دریافت آمار تلاش‌های ناموفق
 */
export function getFailedAttemptsStats(): { totalEntries: number; totalAttempts: number } {
  let totalAttempts = 0;
  for (const entry of failedAttempts.values()) {
    totalAttempts += entry.count;
  }
  return { totalEntries: failedAttempts.size, totalAttempts };
}

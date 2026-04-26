

/* ═══════════════════════════════════════════════════════════════════════════
 *  sanitizer.ts — ضد تزریق و پاک‌سازی ورودی (WAF)
 *  محافظت در برابر: SQL Injection, XSS, Path Traversal
 * ═══════════════════════════════════════════════════════════════════════════ */

import crypto from 'crypto';

/* ── SQL Injection Detection ── */
const SQL_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE|TRUNCATE)\b.*\b(FROM|INTO|WHERE|SET|TABLE|DATABASE)\b)/gi,
  /(--|;|--\s|\/\*|\*\/|xp_|sp_|0x[0-9a-fA-F])/gi,
  /('(\s)*(OR|AND)(\s)*')/gi,
  /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/gi,
  /(\b(OR|AND)\b\s+['"].*['"]\s*=\s*['"])/gi,
  /WAITFOR\s+DELAY/gi,
  /BENCHMARK\s*\(/gi,
  /SLEEP\s*\(/gi,
  /CONCAT\s*\(/gi,
  /CHAR\s*\(/gi,
  /GROUP\s+BY\s+.*HAVING/gi,
  /ORDER\s+BY\s+\d+\s*(--|$)/gi,
];

/* ── XSS Detection ── */
const XSS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<script[\s\S]*?>/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /on\w+\s*=\s*['"]?[^'"]*['"]?\s*(?:>|$)/gi, // onclick, onload, etc.
  /<\s*img[^>]+on\w+\s*=/gi,
  /<\s*iframe[\s\S]*?>/gi,
  /<\s*object[\s\S]*?>/gi,
  /<\s*embed[\s\S]*?>/gi,
  /<\s*form[\s\S]*?>/gi,
  /<\s*input[^>]+type\s*=\s*['"]?image/i,
  /eval\s*\(/gi,
  /expression\s*\(/gi,
  /url\s*\(\s*['"]?\s*javascript/gi,
  /data\s*:\s*text\/html/gi,
  /<\s*svg[\s\S]*?>/gi,
  /<\s*math[\s\S]*?>/gi,
  /document\.(cookie|domain|write|location)/gi,
  /window\.(location|open|alert|confirm|prompt)/gi,
];

/* ── Path Traversal Detection ── */
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.\\/g,
  /\.\./g,
  /[\/\\]+\.\./g,
  /%2e%2e/gi,
  /%252e/gi,
  /\.\%5c/gi,
  /\.\%2f/gi,
  /\0/g, // null byte
];

/**
 * پاک‌سازی ورودی متن — حذف تگ‌ها، بایت‌های خالی، کاراکترهای کنترلی
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '') // حذف HTML tags
    .replace(/\0/g, '') // حذف null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // حذف control chars
    .trim();
}

/**
 * تشخیص SQL Injection — اگر خروجی true باشد، ورودی مخرب است
 */
export function sanitizeSql(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return SQL_PATTERNS.some(p => p.test(input));
}

/**
 * تشخیص XSS — اگر خروجی true باشد، ورودی مخرب است
 */
export function sanitizeXss(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return XSS_PATTERNS.some(p => p.test(input));
}

/**
 * تشخیص Path Traversal — اگر خروجی true باشد، ورودی مخرب است
 */
export function sanitizePath(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return PATH_TRAVERSAL_PATTERNS.some(p => p.test(input));
}

/**
 * اعتبارسنجی ایمیل — RFC سازگار
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return re.test(email.trim());
}

/**
 * اعتبارسنجی شماره موبایل ایرانی
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  return /^09\d{9}$/.test(phone.trim());
}

interface PasswordStrength {
  score: number;
  level: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  requirements: { label: string; met: boolean }[];
}

/**
 * اعتبارسنجی رمز عبور — امتیاز (0-100) و بررسی الزامات
 */
export function validatePassword(password: string): PasswordStrength {
  if (!password || typeof password !== 'string') {
    return { score: 0, level: 'weak', requirements: [] };
  }

  const checks = [
    { label: 'حداقل ۸ کاراکتر', met: password.length >= 8 },
    { label: 'حرف بزرگ انگلیسی', met: /[A-Z]/.test(password) },
    { label: 'حرف کوچک انگلیسی', met: /[a-z]/.test(password) },
    { label: 'عدد', met: /\d/.test(password) },
    { label: 'کاراکتر خاص (!@#$...)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
    { label: 'بدون فاصله', met: !/\s/.test(password) },
  ];

  const met = checks.filter(c => c.met).length;
  const lengthBonus = Math.min(password.length - 8, 8) * 3;
  const score = Math.min(100, (met / 6) * 70 + lengthBonus);

  let level: PasswordStrength['level'];
  if (score < 20) level = 'weak';
  else if (score < 40) level = 'fair';
  else if (score < 60) level = 'good';
  else if (score < 80) level = 'strong';
  else level = 'very-strong';

  return { score: Math.round(score), level, requirements: checks };
}

/**
 * تولید امضای HMAC-SHA256
 */
export function generateHmacSignature(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * تأیید امضای HMAC (Timing-Safe)
 */
export function verifyHmacSignature(data: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(data).digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(signature, 'hex');

  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

/**
 * پاک‌سازی بازگشتی تمام مقادیر رشته‌ای یک شیء
 */
export function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v => typeof v === 'string' ? sanitizeInput(v) : v);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

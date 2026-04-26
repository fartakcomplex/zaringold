

/* ═══════════════════════════════════════════════════════════════════════════
 *  encryption.ts — رمزنگاری و مدیریت کلیدها
 *  AES-256-GCM برای رمزنگاری فیلدهای حساس دیتابیس
 * ═══════════════════════════════════════════════════════════════════════════ */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * دریافت کلید رمزنگاری از متغیر محیطی
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || (process.env.NODE_ENV === 'development' ? 'dev-only-not-for-production-key' : undefined);
  if (!secret) throw new Error('ENCRYPTION_SECRET environment variable is required');
  // Hash to get exactly 32 bytes for AES-256
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * رمزنگاری فیلد با AES-256-GCM
 * خروجی: base64 حاوی salt(32) + iv(16) + authTag(16) + ciphertext
 */
export function encryptField(plaintext: string, secretKey?: string): string {
  if (!plaintext) return '';
  try {
    const key = secretKey ? crypto.createHash('sha256').update(secretKey).digest() : getEncryptionKey();
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Format: salt + iv + authTag + ciphertext
    const result = Buffer.concat([salt, iv, authTag, encrypted]);
    return result.toString('base64');
  } catch {
    return plaintext; // fallback به متن خام
  }
}

/**
 * رمزگشایی فیلد AES-256-GCM
 */
export function decryptField(ciphertext: string, secretKey?: string): string {
  if (!ciphertext) return '';
  try {
    const key = secretKey ? crypto.createHash('sha256').update(secretKey).digest() : getEncryptionKey();
    const data = Buffer.from(ciphertext, 'base64');

    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return ciphertext; // fallback به متن رمزنگاری‌شده
  }
}

/**
 * هش SHA-256
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * تولید توکن امنیتی تصادفی
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * تولید اثر انگشت دستگاه از UA + IP
 */
export function generateDeviceFingerprint(userAgent: string, ip: string, screen?: string): string {
  const raw = `${userAgent || ''}|${ip || ''}|${screen || ''}`;
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 32);
}

/**
 * مخفی کردن داده حساس
 * maskSensitiveData('1234-5678-9012-3456') → '****-****-****-3456'
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (!data || data.length <= visibleChars) return data;
  const masked = '*'.repeat(Math.max(0, data.length - visibleChars));
  return masked + data.slice(-visibleChars);
}

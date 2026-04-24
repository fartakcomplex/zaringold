

/* ═══════════════════════════════════════════════════════════════════════════
 *  file-security.ts — امنیت آپلود فایل
 *  بررسی MIME، اندازه، محتوا، نام فایل امن
 * ═══════════════════════════════════════════════════════════════════════════ */

import crypto from 'crypto';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // ۱۰ مگابایت

export const ALLOWED_MIME_TYPES: string[] = [
  // تصاویر
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  // ویدیو
  'video/mp4',
  'video/webm',
  // اسناد
  'application/pdf',
];

// ⚠️ SVG حذف شده — حاوی کد JavaScript می‌تواند باشد

export const ALLOWED_EXTENSIONS: string[] = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
  '.mp4', '.webm',
  '.pdf',
];

interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * اعتبارسنجی فایل آپلودی
 */
export function validateFileUpload(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'فایلی ارسال نشده' };
  }

  // بررسی اندازه
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `حجم فایل بیش از ${MAX_FILE_SIZE / (1024 * 1024)} مگابایت` };
  }

  if (file.size === 0) {
    return { valid: false, error: 'فایل خالی است' };
  }

  // بررسی MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `فرمت ${file.type} پشتیبانی نمی‌شود` };
  }

  // بررسی extension
  const ext = getExtension(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `پسوند ${ext} مجاز نیست` };
  }

  // بررسی تطابق MIME و extension
  const mimeExtMap: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/bmp': ['.bmp'],
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'application/pdf': ['.pdf'],
  };

  const expectedExts = mimeExtMap[file.type];
  if (expectedExts && !expectedExts.includes(ext)) {
    return { valid: false, error: 'تطابق MIME و پسوند فایل صحیح نیست' };
  }

  return { valid: true };
}

/**
 * تولید نام فایل امن — UUID بدون کاراکتر خاص
 */
export function generateSafeFilename(originalName: string): string {
  const ext = getExtension(originalName) || '.bin';
  const uuid = crypto.randomUUID();
  return `${uuid}${ext}`;
}

/**
 * دریافت extension از نام فایل
 */
function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.substring(lastDot).toLowerCase();
}

/**
 * بررسی Magic Bytes فایل (سرورساید MIME validation)
 * از طریق buffer فایل
 */
export async function getMimeType(buffer: Buffer, filename: string): Promise<string> {
  const ext = getExtension(filename);

  // بررسی Magic Bytes
  if (buffer.length >= 4) {
    const header = buffer.slice(0, 8).toString('hex');

    // JPEG: FF D8 FF
    if (header.startsWith('ffd8ff')) return 'image/jpeg';
    // PNG: 89 50 4E 47
    if (header.startsWith('89504e47')) return 'image/png';
    // GIF: 47 49 46 38
    if (header.startsWith('47494638')) return 'image/gif';
    // PDF: 25 50 44 46 (%PDF)
    if (header.startsWith('25504446')) return 'application/pdf';
    // WebP: 52 49 46 46 ... 57 45 42 50
    if (header.startsWith('52494646') && buffer.length >= 12) {
      const webpOffset = buffer.slice(8, 12).toString('ascii');
      if (webpOffset === 'WEBP') return 'image/webp';
    }
    // BMP: 42 4D
    if (header.startsWith('424d')) return 'image/bmp';
    // MP4: various
    if (buffer.length >= 12) {
      const ftyp = buffer.slice(4, 8).toString('ascii');
      if (ftyp === 'ftyp') return 'video/mp4';
    }
    // WebM: 1A 45 DF A3
    if (header.startsWith('1a45dfa3')) return 'video/webm';
  }

  // Fallback به extension
  const extMimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.pdf': 'application/pdf',
  };

  return extMimeMap[ext] || 'application/octet-stream';
}

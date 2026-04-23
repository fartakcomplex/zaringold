import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

/* ═══════════════════════════════════════════════════════════════════════════
 *  POST /api/admin/media/upload — Upload file(s)
 *  SECURITY: Token validated against DB, SVG removed, magic byte checks
 * ═══════════════════════════════════════════════════════════════════════════ */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'video/mp4',
  'video/webm',
  'application/pdf',
];

// Magic byte signatures for file type validation
const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
  'image/bmp': [0x42, 0x4d],
  'video/mp4': [
    [0x66, 0x74, 0x79, 0x70], // ftyp
    [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // longer ftyp
    [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70],
    [0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70],
  ],
  'video/webm': [0x1a, 0x45, 0xdf, 0xa3],
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
};

/**
 * Validate file buffer against expected magic bytes
 */
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return true; // No signature check defined — allow

  // Handle array of signatures (e.g., MP4 has multiple valid headers)
  if (Array.isArray(signatures[0])) {
    return (signatures as number[][]).some((sig) => {
      if (buffer.length < sig.length) return false;
      for (let i = 0; i < sig.length; i++) {
        if (buffer[i] !== sig[i]) return false;
      }
      return true;
    });
  }

  const sig = signatures as number[];
  if (buffer.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (buffer[i] !== sig[i]) return false;
  }
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check — validate token against database
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Look up the session in the database — don't just trust the header format
    const session = await db.userSession.findUnique({
      where: { token },
      include: {
        user: {
          select: { id: true, role: true, isActive: true, isFrozen: true },
        },
      },
    });

    if (
      !session ||
      !session.user ||
      !session.user.isActive ||
      session.user.isFrozen
    ) {
      return NextResponse.json({ message: 'جلسه نامعتبر یا منقضی' }, { status: 401 });
    }

    if (session.expiresAt && new Date() > session.expiresAt) {
      return NextResponse.json({ message: 'جلسه منقضی شده' }, { status: 401 });
    }

    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json(
        { message: 'فقط مدیران سیستم دسترسی دارند' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const folder = (formData.get('folder') as string) || 'general';

    // Sanitize folder name — prevent path traversal
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (!files || files.length === 0) {
      return NextResponse.json({ message: 'فایلی انتخاب نشده' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', sanitizedFolder);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const results = [];

    for (const file of files) {
      // Check MIME type (SVG is explicitly removed — XSS vector)
      if (!ALLOWED_TYPES.includes(file.type)) {
        results.push({
          success: false,
          name: file.name,
          error: `فرمت ${file.type} پشتیبانی نمی‌شود`,
        });
        continue;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        results.push({
          success: false,
          name: file.name,
          error: 'حجم فایل بیش از ۱۰ مگابایت',
        });
        continue;
      }

      // Check minimum file size (1 byte to prevent empty uploads)
      if (file.size < 1) {
        results.push({
          success: false,
          name: file.name,
          error: 'فایل خالی است',
        });
        continue;
      }

      // Read file buffer for magic byte validation
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Validate magic bytes match declared MIME type
      if (!validateMagicBytes(buffer, file.type)) {
        results.push({
          success: false,
          name: file.name,
          error: 'محتوای فایل با فرمت اعلام شده مطابقت ندارد',
        });
        continue;
      }

      const ext = path.extname(file.name) || '.bin';
      // For SVG, never allow .svg extension even if somehow bypassed
      const safeExt = ext.toLowerCase() === '.svg' ? '.txt' : ext;
      const uniqueName = `${randomUUID()}${safeExt}`;
      const filePath = path.join(uploadDir, uniqueName);

      await writeFile(filePath, buffer);

      const url = `/uploads/${sanitizedFolder}/${uniqueName}`;

      // Save to database
      const media = await db.media.create({
        data: {
          filename: uniqueName,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          url,
          folder: sanitizedFolder,
          uploadedBy: session.userId,
          width: null,
          height: null,
        },
      });

      results.push({
        success: true,
        id: media.id,
        url: media.url,
        name: file.name,
        mimeType: file.type,
        size: file.size,
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[Media Upload] Error:', error);
    return NextResponse.json({ message: 'خطا در آپلود فایل' }, { status: 500 });
  }
}

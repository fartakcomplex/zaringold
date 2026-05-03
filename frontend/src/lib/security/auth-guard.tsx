/* ═══════════════════════════════════════════════════════════════════════════
 *  auth-guard.ts — محافظ احراز هویت
 *  تأیید نشست، ایجاد، چرخش، ابطال
 *  (library file for API routes — NOT a server action)
 * ═══════════════════════════════════════════════════════════════════════════ */

import {NextRequest} from 'next/server';
import {db} from '@/lib/db';

interface SessionResult {
  user: { id: string; phone: string; fullName: string | null; role: string; isActive: boolean; isFrozen: boolean; avatar: string | null };
  session: { id: string; token: string; expiresAt: Date; ip: string | null; device: string | null };
}

/**
 * استخراج توکن از درخواست (Header یا Cookie)
 */
export function extractTokenFromRequest(request: NextRequest): string | null {
  // ۱. Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  // ۲. Cookie: session_token=<token>
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/session_token=([^;]+)/);
  if (match) return match[1].trim();

  // ۳. Query param (فقط برای WebSocket)
  const urlToken = request.nextUrl.searchParams.get('token');
  if (urlToken) return urlToken.trim();

  return null;
}

/**
 * استخراج IP و اطلاعات دستگاه
 */
function getRequestInfo(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  const device = parseDeviceFromUA(userAgent);
  return { ip, userAgent, device };
}

function parseDeviceFromUA(ua: string): string {
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return 'Android';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown';
}

/**
 * احراز هویت — دریافت کاربر + نشست معتبر
 */
export async function requireAuth(request: NextRequest): Promise<SessionResult | null> {
  const token = extractTokenFromRequest(request);
  if (!token) return null;

  try {
    const session = await db.userSession.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true, phone: true, fullName: true, role: true,
            isActive: true, isFrozen: true, avatar: true,
          },
        },
      },
    });

    if (!session) return null;
    if (!session.user) return null;
    if (session.expiresAt < new Date()) return null;
    if (!session.user.isActive) return null;
    if (session.user.isFrozen) return null;

    // بروزرسانی آخرین فعالیت (فقط هر ۵ دقیقه)
    const now = new Date();
    const lastUpdateThreshold = new Date(now.getTime() - 300000); // ۵ دقیقه پیش
    if (session.updatedAt < lastUpdateThreshold) {
      await db.userSession.update({
        where: { token },
        data: { updatedAt: now },
      }).catch(() => { /* ignore */ });
    }

    return {
      user: session.user,
      session: {
        id: session.id,
        token: session.token,
        expiresAt: session.expiresAt,
        ip: session.ip,
        device: session.device,
      },
    };
  } catch {
    return null;
  }
}

/**
 * احراز هویت ادمین — فقط نقش admin یا super_admin
 */
export async function requireAdmin(request: NextRequest): Promise<SessionResult | null> {
  const result = await requireAuth(request);
  if (!result) return null;
  if (result.user.role !== 'admin' && result.user.role !== 'super_admin') return null;
  return result;
}

/**
 * ایجاد نشست جدید
 */
export async function createSession(
  userId: string,
  request: NextRequest,
  expiresInDays: number = 7
): Promise<string | null> {
  try {
    const { ip, userAgent, device } = getRequestInfo(request);
    const crypto = await import('crypto');
    const token = crypto.randomUUID();

    // ابطال نشست‌های قدیمی کاربر (بیش از ۵ نشست همزمان)
    const existingSessions = await db.userSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (existingSessions.length >= 5) {
      const toDelete = existingSessions.slice(5);
      await db.userSession.deleteMany({
        where: { id: { in: toDelete.map(s => s.id) } },
      });
    }

    await db.userSession.create({
      data: {
        userId,
        token,
        ip,
        device,
        userAgent,
        expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
      },
    });

    return token;
  } catch {
    return null;
  }
}

/**
 * چرخش توکن — توکن قدیمی حذف، جدید ساخته می‌شود
 */
export async function rotateSession(oldToken: string, request: NextRequest): Promise<string | null> {
  try {
    const session = await db.userSession.findUnique({ where: { token: oldToken } });
    if (!session) return null;

    await db.userSession.delete({ where: { token: oldToken } });
    return createSession(session.userId, request);
  } catch {
    return null;
  }
}

/**
 * ابطال یک نشست
 */
export async function revokeSession(token: string): Promise<boolean> {
  try {
    await db.userSession.delete({ where: { token } });
    return true;
  } catch {
    return false;
  }
}

/**
 * ابطال تمام نشست‌های یک کاربر
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
  try {
    const result = await db.userSession.deleteMany({ where: { userId } });
    return result.count;
  } catch {
    return 0;
  }
}

/**
 * بررسی اعتبار نشست
 */
export function isSessionValid(session: { expiresAt: Date } | null): boolean {
  if (!session) return false;
  return session.expiresAt > new Date();
}

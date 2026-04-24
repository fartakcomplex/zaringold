

/* ═══════════════════════════════════════════════════════════════════════════
 *  audit-logger.ts — ثبت رویدادهای امنیتی
 *  تمام فعالیت‌های مشکوک و مهم ثبت می‌شوند
 * ═══════════════════════════════════════════════════════════════════════════ */

import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export type SecurityEventType =
  | 'auth_success'
  | 'auth_failure'
  | 'account_frozen'
  | 'account_unfrozen'
  | 'suspicious_activity'
  | 'admin_login'
  | 'api_abuse'
  | 'session_revoked'
  | 'session_rotated'
  | 'rate_limit_exceeded'
  | 'bot_detected'
  | 'file_upload'
  | 'file_upload_blocked'
  | 'data_access'
  | 'permission_denied'
  | 'config_change'
  | 'ip_blocked'
  | 'ip_unblocked'
  | 'security_scan'
  | 'password_change'
  | 'mfa_enabled'
  | 'mfa_disabled';

interface SecurityEventInput {
  type: SecurityEventType;
  severity?: 'info' | 'warning' | 'critical';
  userId?: string | null;
  phone?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  url?: string | null;
  method?: string | null;
  details?: Record<string, unknown> | null;
  riskScore?: number;
}

/**
 * ثبت رویداد امنیتی
 */
export async function logSecurityEvent(input: SecurityEventInput): Promise<void> {
  try {
    await db.securityEvent.create({
      data: {
        type: input.type,
        severity: input.severity || getDefaultSeverity(input.type),
        userId: input.userId || null,
        phone: input.phone || null,
        ip: input.ip || null,
        userAgent: input.userAgent || null,
        url: input.url || null,
        method: input.method || null,
        details: input.details ? JSON.stringify(input.details) : null,
        riskScore: input.riskScore ?? getRiskScore(input.type),
        resolved: false,
      },
    });
  } catch {
    // ثبت خطا نباید باعث شکست عملیات شود
    console.warn('[Audit] Failed to log security event:', input.type);
  }
}

/**
 * دریافت رویدادهای امنیتی
 */
export async function getSecurityEvents(filters?: {
  type?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;

  const where: Record<string, unknown> = {};
  if (filters?.type) where.type = filters.type;
  if (filters?.severity) where.severity = filters.severity;
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) (where.createdAt as Record<string, unknown>).gte = filters.startDate;
    if (filters.endDate) (where.createdAt as Record<string, unknown>).lte = filters.endDate;
  }
  if (filters?.search) {
    where.OR = [
      { ip: { contains: filters.search } },
      { phone: { contains: filters.search } },
      { details: { contains: filters.search } },
      { url: { contains: filters.search } },
    ];
  }

  const [events, total] = await Promise.all([
    db.securityEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.securityEvent.count({ where }),
  ]);

  return {
    events: events.map(e => ({
      ...e,
      details: e.details ? JSON.parse(e.details) : null,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * آمار امنیتی برای داشبورد
 */
export async function getSecurityStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    todayCount,
    weekCount,
    monthCount,
    criticalCount,
    authFailures,
    botDetections,
    blockedIPs,
    activeSessions,
    frozenUsers,
    recentEvents,
    eventsByType,
  ] = await Promise.all([
    db.securityEvent.count({ where: { createdAt: { gte: today } } }),
    db.securityEvent.count({ where: { createdAt: { gte: weekAgo } } }),
    db.securityEvent.count({ where: { createdAt: { gte: monthAgo } } }),
    db.securityEvent.count({ where: { severity: 'critical', createdAt: { gte: weekAgo } } }),
    db.securityEvent.count({ where: { type: 'auth_failure', createdAt: { gte: today } } }),
    db.securityEvent.count({ where: { type: 'bot_detected', createdAt: { gte: weekAgo } } }),
    db.blockedIP.count({ where: { isActive: true } }),
    db.userSession.count({ where: { expiresAt: { gt: now } } }),
    db.user.count({ where: { isFrozen: true } }),
    db.securityEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    // رویدادها بر اساس نوع
    db.securityEvent.groupBy({
      by: ['type'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
      where: { createdAt: { gte: weekAgo } },
    }),
  ]);

  return {
    today: todayCount,
    week: weekCount,
    month: monthCount,
    critical: criticalCount,
    authFailures,
    botDetections,
    blockedIPs,
    activeSessions,
    frozenUsers,
    recentEvents: recentEvents.map(e => ({
      ...e,
      details: e.details ? JSON.parse(e.details) : null,
    })),
    eventsByType: eventsByType.map(e => ({
      type: e.type,
      count: e._count.id,
    })),
  };
}

/* ── Helper Functions ── */

function getDefaultSeverity(type: SecurityEventType): 'info' | 'warning' | 'critical' {
  const critical: SecurityEventType[] = ['account_frozen', 'api_abuse', 'ip_blocked', 'suspicious_activity'];
  const warning: SecurityEventType[] = ['auth_failure', 'rate_limit_exceeded', 'bot_detected', 'permission_denied', 'file_upload_blocked'];
  if (critical.includes(type)) return 'critical';
  if (warning.includes(type)) return 'warning';
  return 'info';
}

function getRiskScore(type: SecurityEventType): number {
  const scores: Partial<Record<SecurityEventType, number>> = {
    auth_failure: 30,
    account_frozen: 80,
    suspicious_activity: 90,
    api_abuse: 70,
    rate_limit_exceeded: 50,
    bot_detected: 60,
    permission_denied: 40,
    ip_blocked: 85,
    file_upload_blocked: 55,
  };
  return scores[type] || 10;
}

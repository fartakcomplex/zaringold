/**
 * Fraud Detection Engine — Anti-Fraud Middleware Logic
 * Provides risk scoring, velocity checks, and duplicate card detection
 * for the Gold Payment Gateway Platform.
 */

import { db } from '@/lib/db';

// ── Event type labels (English → Persian) ──

export const EVENT_TYPES = {
  rapid_payment: 'پرداخت سریع',
  duplicate_card: 'کارت تکراری',
  high_value: 'مبلغ بالا',
  bot_checkout: 'ربات',
  velocity_exceeded: 'سرعت تراکنش',
  fake_merchant: 'فروشگاه مشکوک',
} as const;

export type EventType = keyof typeof EVENT_TYPES;

// ── Risk level thresholds ──

export const RISK_THRESHOLDS = {
  high: 70,
  medium: 40,
} as const;

export type RiskLevel = 'high' | 'medium' | 'low';

/**
 * Determine risk level from score
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.high) return 'high';
  if (score >= RISK_THRESHOLDS.medium) return 'medium';
  return 'low';
}

/**
 * Calculate comprehensive risk score for a payment (0-100).
 * Aggregates multiple fraud signals into a single score.
 */
export async function calculatePaymentRisk(params: {
  userId: string;
  amount: number;
  cardPan?: string;
  merchantId: string;
  customerPhone?: string;
}): Promise<{ score: number; flags: string[]; shouldBlock: boolean }> {
  const { userId, amount, cardPan, merchantId, customerPhone } = params;
  const flags: string[] = [];
  let score = 0;

  // ── 1. Velocity check ──
  const velocity = await checkVelocity(userId);
  if (velocity.isExceeded) {
    flags.push('velocity_exceeded');
    score += 30;
  }
  // Increase score proportional to recent payment frequency
  if (velocity.paymentsLastHour > 5) {
    flags.push('rapid_payment');
    score += 15;
  } else if (velocity.paymentsLastHour > 3) {
    flags.push('rapid_payment');
    score += 8;
  }

  // ── 2. High value check ──
  // Payment above 50M Toman is suspicious
  const HIGH_VALUE_THRESHOLD = 50_000_000;
  if (amount > HIGH_VALUE_THRESHOLD) {
    flags.push('high_value');
    score += 25;
  } else if (amount > HIGH_VALUE_THRESHOLD * 0.5) {
    flags.push('high_value');
    score += 10;
  }

  // ── 3. Duplicate card check ──
  if (cardPan) {
    const dupCard = await checkDuplicateCard(cardPan);
    if (dupCard.isSuspicious) {
      flags.push('duplicate_card');
      score += 20;
    } else if (dupCard.count > 3) {
      flags.push('duplicate_card');
      score += 10;
    }
  }

  // ── 4. Bot / rapid checkout detection ──
  // Multiple payments to same merchant in very short time
  if (velocity.paymentsLastHour > 10) {
    flags.push('bot_checkout');
    score += 25;
  }

  // ── 5. Fake merchant suspicion ──
  // Check merchant risk score
  const merchant = await db.merchant.findUnique({
    where: { id: merchantId },
    select: { riskScore: true, isVerified: true },
  });
  if (merchant) {
    if (!merchant.isVerified) {
      flags.push('fake_merchant');
      score += 15;
    }
    if (merchant.riskScore > 50) {
      flags.push('fake_merchant');
      score += Math.min(20, Math.floor(merchant.riskScore / 5));
    }
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  // Block if score is very high (>= 85)
  const shouldBlock = score >= 85;

  return { score, flags, shouldBlock };
}

/**
 * Check velocity — payments per minute/hour/day for a user.
 * Returns whether velocity limits are exceeded.
 */
export async function checkVelocity(
  userId: string
): Promise<{ paymentsLastHour: number; paymentsLastDay: number; isExceeded: boolean }> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Count gateway payments in the last hour
  const paymentsLastHour = await db.gatewayPayment.count({
    where: {
      userId,
      createdAt: { gte: oneHourAgo },
      status: { in: ['paid', 'pending'] },
    },
  });

  // Count gateway payments in the last day
  const paymentsLastDay = await db.gatewayPayment.count({
    where: {
      userId,
      createdAt: { gte: oneDayAgo },
      status: { in: ['paid', 'pending'] },
    },
  });

  // Velocity limits
  const HOUR_LIMIT = 10;
  const DAY_LIMIT = 30;
  const isExceeded = paymentsLastHour > HOUR_LIMIT || paymentsLastDay > DAY_LIMIT;

  return { paymentsLastHour, paymentsLastDay, isExceeded };
}

/**
 * Check for duplicate card usage across merchants.
 * A card used across many merchants is suspicious.
 */
export async function checkDuplicateCard(
  cardPan: string
): Promise<{ count: number; merchants: string[]; isSuspicious: boolean }> {
  // Mask the card PAN for privacy (last 4 digits only)
  const maskedPan = cardPan.length >= 4 ? `****${cardPan.slice(-4)}` : cardPan;

  // Find all payments with this card PAN
  const payments = await db.gatewayPayment.findMany({
    where: {
      cardPan,
      status: 'paid',
    },
    select: {
      merchantId: true,
    },
    distinct: ['merchantId'],
  });

  // Get merchant names
  const merchantIds = payments.map((p) => p.merchantId);
  const merchants = await db.merchant.findMany({
    where: { id: { in: merchantIds } },
    select: { businessName: true },
  });

  const merchantNames = merchants.map((m) => m.businessName);
  const count = merchantIds.length;

  // Suspicious if used across 5+ merchants
  const isSuspicious = count >= 5;

  return { count, merchants: merchantNames, isSuspicious };
}

/**
 * Create a risk event in the database.
 * Used by API routes and payment processing.
 */
export async function createRiskEvent(params: {
  paymentId?: string;
  userId?: string;
  merchantId?: string;
  eventType: string;
  riskScore: number;
  details?: string;
}) {
  return db.riskEvent.create({
    data: {
      paymentId: params.paymentId,
      userId: params.userId,
      merchantId: params.merchantId,
      eventType: params.eventType,
      riskScore: params.riskScore,
      details: params.details,
    },
  });
}

/**
 * Resolve a risk event (mark as resolved with optional note).
 */
export async function resolveRiskEvent(id: string, note?: string) {
  return db.riskEvent.update({
    where: { id },
    data: {
      isResolved: true,
      resolveNote: note || null,
      resolvedAt: new Date(),
    },
  });
}

/**
 * Auto-resolve low-risk events older than 24 hours.
 * Call this periodically (e.g., via cron or on page load).
 */
export async function autoResolveOldLowRiskEvents(): Promise<number> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await db.riskEvent.updateMany({
    where: {
      isResolved: false,
      riskScore: { lt: RISK_THRESHOLDS.medium }, // score < 40
      createdAt: { lte: twentyFourHoursAgo },
    },
    data: {
      isResolved: true,
      resolveNote: 'بررسی خودکار — ریسک پایین',
      resolvedAt: new Date(),
    },
  });

  return result.count;
}

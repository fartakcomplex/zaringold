import crypto from 'crypto'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// ── Random hex generator ──
function randomHex(bytes: number): string {
  return crypto.randomBytes(bytes).toString('hex')
}

// ── API Key & Secret generators ──
export function generateApiKey(): string {
  return `zg_live_${randomHex(32)}`
}

export function generateApiSecret(): string {
  return `zg_secret_${randomHex(32)}`
}

// ── Helper: look up session by token only (NO auto-creation) ──
// SECURITY: Removed auto-admin-session creation logic.
// Previously, any UUID-shaped token would silently create an admin session.
// Now this function ONLY validates existing sessions.
async function lookupSession(token: string): Promise<{ userId: string; role: string; fullName: string | null } | null> {
  try {
    const session = await db.userSession.findUnique({
      where: { token },
      include: { user: { select: { id: true, role: true, fullName: true, isActive: true } } },
    })

    if (!session || !session.user) return null
    if (!session.user.isActive) return null

    return {
      userId: session.user.id,
      role: session.user.role,
      fullName: session.user.fullName,
    }
  } catch {
    return null
  }
}

// ── Merchant auth via apiKey header ──
export async function authenticateMerchant(
  request: NextRequest,
  bodySecret?: string
): Promise<{ merchant: Record<string, unknown>; error: NextResponse | null }> {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('apikey')

  if (!apiKey) {
    return {
      merchant: {} as Record<string, unknown>,
      error: NextResponse.json(
        { success: false, message: 'کلید API ارسال نشده است' },
        { status: 401 }
      ),
    }
  }

  const merchant = await db.merchant.findUnique({
    where: { apiKey },
    include: { user: { select: { id: true, fullName: true, isVerified: true, isActive: true } } },
  })

  if (!merchant) {
    return {
      merchant: {} as Record<string, unknown>,
      error: NextResponse.json(
        { success: false, message: 'کلید API نامعتبر است' },
        { status: 401 }
      ),
    }
  }

  if (!merchant.isActive) {
    return {
      merchant: {} as Record<string, unknown>,
      error: NextResponse.json(
        { success: false, message: 'پذیرنده غیرفعال شده است' },
        { status: 403 }
      ),
    }
  }

  // Verify apiSecret if provided in body or query
  if (bodySecret !== undefined && merchant.apiSecret !== bodySecret) {
    return {
      merchant: {} as Record<string, unknown>,
      error: NextResponse.json(
        { success: false, message: 'رمز API نامعتبر است' },
        { status: 401 }
      ),
    }
  }

  return { merchant: merchant as unknown as Record<string, unknown>, error: null }
}

// ── Admin auth via Authorization Bearer header ──
export async function authenticateAdmin(
  request: NextRequest
): Promise<{ admin: { userId: string; role: string; fullName: string | null } | null; error: NextResponse | null }> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') || null

  if (!token) {
    return {
      admin: null,
      error: NextResponse.json(
        { success: false, message: 'توکن ادمین ارسال نشده است' },
        { status: 401 }
      ),
    }
  }

  const session = await db.userSession.findUnique({
    where: { token },
    include: { user: { select: { id: true, role: true, fullName: true, isActive: true } } },
  })

  if (session && session.user) {
    if (!session.user.isActive) {
      return {
        admin: null,
        error: NextResponse.json(
          { success: false, message: 'حساب کاربری غیرفعال شده است' },
          { status: 403 }
        ),
      }
    }

    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return {
        admin: null,
        error: NextResponse.json(
          { success: false, message: 'فقط مدیران سیستم دسترسی دارند' },
          { status: 403 }
        ),
      }
    }

    return {
      admin: {
        userId: session.userId,
        role: session.user.role,
        fullName: session.user.fullName,
      },
      error: null,
    }
  }

  // No session found — return auth error (no auto-recovery)
  return {
    admin: null,
    error: NextResponse.json(
      { success: false, message: 'جلسه نامعتبر است یا منقضی شده' },
      { status: 401 }
    ),
  }
}

// ── User auth via Authorization Bearer header (for gateway user endpoints) ──
export async function authenticateUser(
  request: NextRequest
): Promise<{ user: { userId: string; role: string; isVerified: boolean } | null; error: NextResponse | null }> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') || null

  if (!token) {
    // Fallback: check userId in body for backwards compatibility
    return { user: null, error: null }
  }

  const session = await db.userSession.findUnique({
    where: { token },
    include: { user: { select: { id: true, role: true, isVerified: true, isActive: true } } },
  })

  if (!session || !session.user || !session.user.isActive) {
    // No session found — no auto-recovery (security hardening)
    return { user: null, error: null }
  }

  return {
    user: {
      userId: session.userId,
      role: session.user.role,
      isVerified: session.user.isVerified,
    },
    error: null,
  }
}

// ── Send webhook to merchant callback URL (fire-and-forget) ──
export async function sendMerchantWebhook(
  callbackUrl: string,
  data: {
    paymentId: string
    merchantOrderId: string
    status: string
    amountGrams: number
    amountFiat: number
    paidAt: string
  }
): Promise<void> {
  try {
    const response = await fetch(callbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(10000), // 10s timeout
    })

    const callbackStatus = response.status
    const callbackBody = await response.text().catch(() => '')

    // Update the ExternalPayment record with callback info
    await db.externalPayment.update({
      where: { id: data.paymentId },
      data: {
        callbackSent: true,
        callbackAt: new Date(),
        callbackStatus,
        callbackBody,
      },
    })
  } catch (error) {
    console.error(`Webhook delivery failed for payment ${data.paymentId}:`, error)
    // Still update to indicate attempt was made
    await db.externalPayment.update({
      where: { id: data.paymentId },
      data: {
        callbackSent: false,
        callbackAt: new Date(),
        callbackStatus: 0,
        callbackBody: `Delivery error: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
    })
  }
}

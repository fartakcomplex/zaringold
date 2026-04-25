import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'

/**
 * Helper: Hash API key with SHA-256
 */
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

/**
 * Helper: Generate new API key
 */
function generateApiKey(): string {
  return `gp_live_${crypto.randomBytes(16).toString('hex')}`
}

/**
 * Helper: Validate merchant by userId
 */
async function getMerchantByUserId(userId: string) {
  return db.merchant.findUnique({ where: { userId } })
}

/**
 * POST /api/v1/merchant/api-keys
 * Create a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, keyType } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const merchant = await getMerchantByUserId(userId)
    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'پذیرنده یافت نشد' },
        { status: 404 }
      )
    }

    if (!merchant.isActive) {
      return NextResponse.json(
        { success: false, message: 'حساب پذیرنده غیرفعال است' },
        { status: 403 }
      )
    }

    /* ── Generate API key ── */
    const rawKey = generateApiKey()
    const keyHash = hashApiKey(rawKey)
    const keyPrefix = rawKey.slice(0, 12) // gp_live_XX

    const apiKey = await db.apiKey.create({
      data: {
        merchantId: merchant.id,
        keyHash,
        keyPrefix,
        keyType: keyType || 'live',
        name: name || 'کلید پیش‌فرض',
      },
    })

    /* ── Return full key ONLY on creation ── */
    return NextResponse.json({
      success: true,
      message: 'کلید API با موفقیت ایجاد شد',
      data: {
        id: apiKey.id,
        key: rawKey, // Full key — shown ONLY once
        keyPrefix: apiKey.keyPrefix,
        name: apiKey.name,
        keyType: apiKey.keyType,
        createdAt: apiKey.createdAt,
        warning: 'لطفاً این کلید را در مکان امن ذخیره کنید. دیگر قابل مشاهده نخواهد بود.',
      },
    })
  } catch (error) {
    console.error('API key create error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد کلید API' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/merchant/api-keys
 * List API keys (prefix only, NOT full key)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const merchant = await getMerchantByUserId(userId)
    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'پذیرنده یافت نشد' },
        { status: 404 }
      )
    }

    const apiKeys = await db.apiKey.findMany({
      where: { merchantId: merchant.id },
      select: {
        id: true,
        keyPrefix: true,
        keyType: true,
        name: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: apiKeys,
    })
  } catch (error) {
    console.error('API key list error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست کلیدهای API' },
      { status: 500 }
    )
  }
}

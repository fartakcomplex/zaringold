import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateApiKey, generateApiSecret } from '@/lib/gateway-helpers'

/**
 * POST /api/gateway/merchant/register
 * Register as a merchant (authenticated user)
 * Required: businessName, callbackUrl
 * Optional: website, description
 * Only verified users can register
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, businessName, callbackUrl, website, description } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    // Find user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, isVerified: true, isActive: true, isFrozen: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    if (!user.isActive || user.isFrozen) {
      return NextResponse.json(
        { success: false, message: 'حساب کاربری غیرفعال یا مسدود شده است' },
        { status: 403 }
      )
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { success: false, message: 'فقط کاربران تأییدشده می‌توانند ثبت‌نام پذیرنده کنند. ابتدا احراز هویت شوید.' },
        { status: 403 }
      )
    }

    if (!businessName || !businessName.trim()) {
      return NextResponse.json(
        { success: false, message: 'نام کسب‌وکار الزامی است' },
        { status: 400 }
      )
    }

    if (!callbackUrl || !callbackUrl.trim()) {
      return NextResponse.json(
        { success: false, message: 'آدرس بازگشت (callback) الزامی است' },
        { status: 400 }
      )
    }

    // Validate callbackUrl format
    try {
      new URL(callbackUrl)
    } catch {
      return NextResponse.json(
        { success: false, message: 'آدرس بازگشت (callback) نامعتبر است' },
        { status: 400 }
      )
    }

    // Check if user already has a merchant account
    const existingMerchant = await db.merchant.findUnique({
      where: { userId },
    })

    if (existingMerchant) {
      return NextResponse.json(
        { success: false, message: 'این کاربر قبلاً ثبت‌نام پذیرنده کرده است' },
        { status: 409 }
      )
    }

    // Generate API credentials
    const apiKey = generateApiKey()
    const apiSecret = generateApiSecret()

    // Create merchant (starts as inactive — admin must approve)
    const merchant = await db.merchant.create({
      data: {
        userId,
        businessName: businessName.trim(),
        callbackUrl: callbackUrl.trim(),
        website: website?.trim() || null,
        description: description?.trim() || null,
        apiKey,
        apiSecret,
        isActive: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'ثبت‌نام پذیرنده با موفقیت انجام شد. منتظر تأیید مدیر باشید.',
      merchant: {
        id: merchant.id,
        businessName: merchant.businessName,
        website: merchant.website,
        callbackUrl: merchant.callbackUrl,
        apiKey: merchant.apiKey,
        apiSecret: merchant.apiSecret,
        isActive: merchant.isActive,
        createdAt: merchant.createdAt,
      },
    })
  } catch (error) {
    console.error('Merchant register error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت‌نام پذیرنده' },
      { status: 500 }
    )
  }
}

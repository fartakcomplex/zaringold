import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/gateway/merchant/my
 *
 * Returns the merchant record for the currently authenticated user.
 * Uses the Authorization Bearer token to identify the user,
 * then looks up the merchant by userId.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت ارسال نشده است' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);

    // Look up the session by token
    const session = await db.userSession.findUnique({
      where: { token },
      select: { userId: true, expiresAt: true },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'نشست نامعتبر است' },
        { status: 401 }
      );
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: 'نشست منقضی شده است' },
        { status: 401 }
      );
    }

    // Look up merchant by userId
    const merchant = await db.merchant.findUnique({
      where: { userId: session.userId },
    });

    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'پذیرنده‌ای یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      merchant: {
        id: merchant.id,
        userId: merchant.userId,
        businessName: merchant.businessName,
        website: merchant.website,
        callbackUrl: merchant.callbackUrl,
        apiKey: merchant.apiKey,
        apiSecret: merchant.apiSecret,
        feePercent: merchant.feePercent,
        isActive: merchant.isActive,
        totalPayments: merchant.totalPayments,
        totalVolume: merchant.totalVolume,
        description: merchant.description,
        createdAt: merchant.createdAt,
      },
    });
  } catch (error) {
    console.error('Merchant my error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات پذیرنده' },
      { status: 500 }
    );
  }
}

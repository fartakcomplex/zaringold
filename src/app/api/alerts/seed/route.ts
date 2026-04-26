import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ── GET: Seed sample price alerts for testing ──
export async function GET() {
  try {
    // Check if user "1" exists, if not create a minimal one
    let userId = '1';
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      await db.user.create({
        data: {
          id: userId,
          phone: '09123456789',
          fullName: 'کاربر آزمایشی',
          referralCode: 'TEST01',
          isVerified: true,
          isActive: true,
        },
      });
    }

    // Delete existing alerts for this user to avoid duplicates
    await db.priceAlert.deleteMany({ where: { userId } });

    // Create sample alerts
    const alerts = await db.priceAlert.createMany({
      data: [
        {
          userId,
          type: 'sell',
          condition: 'above',
          targetPrice: 41000000,
          isActive: true,
          isTriggered: false,
        },
        {
          userId,
          type: 'buy',
          condition: 'below',
          targetPrice: 39000000,
          isActive: true,
          isTriggered: false,
        },
        {
          userId,
          type: 'sell',
          condition: 'above',
          targetPrice: 45000000,
          isActive: false,
          isTriggered: false,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: `${alerts.count} هشدار نمونه ایجاد شد`,
    });
  } catch (error) {
    console.error('Error seeding price alerts:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد هشدارهای نمونه' },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/security/auth-guard';

/**
 * GET /api/admin/security/settings — دریافت تنظیمات امنیتی
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    // Find or create default security config
    let config = await db.securityConfig.findFirst();

    if (!config) {
      config = await db.securityConfig.create({
        data: {
          key: 'main',
          value: JSON.stringify({
            maxLoginAttempts: 5,
            sessionDurationDays: 7,
            mfaEnabled: true,
            autoBlockIP: true,
            botScanEnabled: true,
            rateLimitEnabled: true,
            passwordMinLength: 8,
            passwordExpiryDays: 90,
            firewallRules: {
              blockTor: true,
              blockVPN: false,
              rateLimiting: true,
              geoBlocking: false,
              ddosProtection: true,
              sqliProtection: true,
              xssProtection: true,
              csrfTokens: true,
            },
          }),
        },
      });
    }

    const settings = config.value ? JSON.parse(config.value) : {};

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('[Security Settings] Error:', error);
    return NextResponse.json({ message: 'خطا' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/security/settings — ذخیره تنظیمات امنیتی
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ message: 'تنظیمات نامعتبر' }, { status: 400 });
    }

    // Upsert the config
    const config = await db.securityConfig.upsert({
      where: { key: 'main' },
      update: { value: JSON.stringify(settings) },
      create: { key: 'main', value: JSON.stringify(settings) },
    });

    return NextResponse.json({
      success: true,
      message: 'تنظیمات امنیتی ذخیره شد',
      config: config.value ? JSON.parse(config.value) : {},
    });
  } catch (error) {
    console.error('[Security Settings] Error:', error);
    return NextResponse.json({ message: 'خطا در ذخیره تنظیمات' }, { status: 500 });
  }
}

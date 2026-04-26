import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/security/auth-guard';

const GROUP = 'service_insurance';

const DEFAULTS: Record<string, { key: string; value: string; label: string }> = {
  asia_api_url: { key: 'insurance_asia_api_url', value: '', label: 'آدرس API آسیا' },
  asia_commission: { key: 'insurance_asia_commission', value: '5', label: 'کارمزد آسیا (%)' },
  asia_default_coverage: { key: 'insurance_asia_default_coverage', value: '100000000', label: 'پوشش پیش‌فرض آسیا' },
  asia_enabled: { key: 'insurance_asia_enabled', value: 'true', label: 'آسیا فعال' },
  dana_api_url: { key: 'insurance_dana_api_url', value: '', label: 'آدرس API دانا' },
  dana_commission: { key: 'insurance_dana_commission', value: '5', label: 'کارمزد دانا (%)' },
  dana_default_coverage: { key: 'insurance_dana_default_coverage', value: '100000000', label: 'پوشش پیش‌فرض دانا' },
  dana_enabled: { key: 'insurance_dana_enabled', value: 'true', label: 'دانا فعال' },
  alborz_api_url: { key: 'insurance_alborz_api_url', value: '', label: 'آدرس API البرز' },
  alborz_commission: { key: 'insurance_alborz_commission', value: '5', label: 'کارمزد البرز (%)' },
  alborz_default_coverage: { key: 'insurance_alborz_default_coverage', value: '100000000', label: 'پوشش پیش‌فرض البرز' },
  alborz_enabled: { key: 'insurance_alborz_enabled', value: 'true', label: 'البرز فعال' },
  iran_api_url: { key: 'insurance_iran_api_url', value: '', label: 'آدرس API ایران' },
  iran_commission: { key: 'insurance_iran_commission', value: '5', label: 'کارمزد ایران (%)' },
  iran_default_coverage: { key: 'insurance_iran_default_coverage', value: '100000000', label: 'پوشش پیش‌فرض ایران' },
  iran_enabled: { key: 'insurance_iran_enabled', value: 'true', label: 'ایران فعال' },
};

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const settings = await db.systemSetting.findMany({ where: { group: GROUP } });
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    const result: Record<string, string> = {};
    for (const [, def] of Object.entries(DEFAULTS)) {
      result[def.key] = map[def.key] ?? def.value;
    }
    return NextResponse.json({ success: true, settings: result });
  } catch (error) {
    console.error('GET insurance settings error:', error);
    return NextResponse.json({ success: false, message: 'خطا در دریافت تنظیمات' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const body = await req.json();
    const data: Record<string, string> = body.settings ?? body;

    for (const [key, value] of Object.entries(data)) {
      if (!DEFAULTS[key as keyof typeof DEFAULTS]) continue;
      const def = DEFAULTS[key as keyof typeof DEFAULTS];
      await db.systemSetting.upsert({
        where: { key: def.key },
        update: { value: String(value), group: GROUP, label: def.label },
        create: { key: def.key, value: String(value), group: GROUP, label: def.label },
      });
    }

    return NextResponse.json({ success: true, message: 'تنظیمات ذخیره شد' });
  } catch (error) {
    console.error('PUT insurance settings error:', error);
    return NextResponse.json({ success: false, message: 'خطا در ذخیره تنظیمات' }, { status: 500 });
  }
}

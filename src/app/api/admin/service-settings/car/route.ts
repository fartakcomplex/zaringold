import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const GROUP = 'service_car';

const DEFAULTS: Record<string, { key: string; value: string; label: string }> = {
  workshop_list: { key: 'car_workshop_list', value: '[]', label: 'لیست تعمیرگاه‌ها (JSON)' },
  body_commission: { key: 'car_body_commission', value: '5', label: 'کارمزد بدنه (%)' },
  mechanical_commission: { key: 'car_mechanical_commission', value: '5', label: 'کارمزد مکانیکی (%)' },
  electrical_commission: { key: 'car_electrical_commission', value: '5', label: 'کارمزد برق (%)' },
  wash_commission: { key: 'car_wash_commission', value: '10', label: 'کارمزد شستشو (%)' },
  tow_commission: { key: 'car_tow_commission', value: '8', label: 'کارمزد یدک‌کش (%)' },
  body_enabled: { key: 'car_body_enabled', value: 'true', label: 'بدنه فعال' },
  mechanical_enabled: { key: 'car_mechanical_enabled', value: 'true', label: 'مکانیکی فعال' },
  electrical_enabled: { key: 'car_electrical_enabled', value: 'true', label: 'برق فعال' },
  wash_enabled: { key: 'car_wash_enabled', value: 'true', label: 'شستشو فعال' },
  tow_enabled: { key: 'car_tow_enabled', value: 'true', label: 'یدک‌کش فعال' },
};

export async function GET() {
  try {
    const settings = await db.systemSetting.findMany({ where: { group: GROUP } });
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    const result: Record<string, string> = {};
    for (const [, def] of Object.entries(DEFAULTS)) {
      result[def.key] = map[def.key] ?? def.value;
    }
    return NextResponse.json({ success: true, settings: result });
  } catch (error) {
    console.error('GET car settings error:', error);
    return NextResponse.json({ success: false, message: 'خطا در دریافت تنظیمات' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
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
    console.error('PUT car settings error:', error);
    return NextResponse.json({ success: false, message: 'خطا در ذخیره تنظیمات' }, { status: 500 });
  }
}

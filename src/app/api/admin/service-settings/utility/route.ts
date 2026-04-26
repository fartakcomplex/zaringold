import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const GROUP = 'service_utility';

const DEFAULTS: Record<string, { key: string; value: string; label: string }> = {
  mci_api_url: { key: 'utility_mci_api_url', value: '', label: 'آدرس API همراه اول' },
  mci_api_key: { key: 'utility_mci_api_key', value: '', label: 'کلید API همراه اول' },
  irancell_api_url: { key: 'utility_irancell_api_url', value: '', label: 'آدرس API ایرانسل' },
  irancell_api_key: { key: 'utility_irancell_api_key', value: '', label: 'کلید API ایرانسل' },
  rightel_api_url: { key: 'utility_rightel_api_url', value: '', label: 'آدرس API رایتل' },
  rightel_api_key: { key: 'utility_rightel_api_key', value: '', label: 'کلید API رایتل' },
  topup_commission: { key: 'utility_topup_commission', value: '2', label: 'کارمزد شارژ (%)' },
  internet_commission: { key: 'utility_internet_commission', value: '2', label: 'کارمزد اینترنت (%)' },
  bill_commission: { key: 'utility_bill_commission', value: '1', label: 'کارمزد قبوض (%)' },
  min_amount: { key: 'utility_min_amount', value: '5000', label: 'حداقل مبلغ (تومان)' },
  max_amount: { key: 'utility_max_amount', value: '500000', label: 'حداکثر مبلغ (تومان)' },
  topup_enabled: { key: 'utility_topup_enabled', value: 'true', label: 'شارژ فعال' },
  internet_enabled: { key: 'utility_internet_enabled', value: 'true', label: 'اینترنت فعال' },
  bill_enabled: { key: 'utility_bill_enabled', value: 'true', label: 'قبوض فعال' },
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
    console.error('GET utility settings error:', error);
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
    console.error('PUT utility settings error:', error);
    return NextResponse.json({ success: false, message: 'خطا در ذخیره تنظیمات' }, { status: 500 });
  }
}

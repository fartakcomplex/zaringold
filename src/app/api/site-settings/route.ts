import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group');

    const where = group ? { group } : {};

    const settings = await db.siteSetting.findMany({
      where,
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }, { key: 'asc' }],
    });

    const groupsMap = new Map<string, typeof settings>();
    for (const setting of settings) {
      const existing = groupsMap.get(setting.group) || [];
      existing.push(setting);
      groupsMap.set(setting.group, existing);
    }

    const groups = Array.from(groupsMap.entries()).map(([groupName, items]) => ({
      group: groupName,
      settings: items.map(s => ({
        key: s.key,
        value: s.value,
        type: s.type,
        label: s.label,
      })),
    }));

    return NextResponse.json({ groups, total: settings.length });
  } catch (error) {
    console.error('[PublicSiteSettings] GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت تنظیمات' }, { status: 500 });
  }
}

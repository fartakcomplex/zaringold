import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/security/auth-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group');

    const where = group ? { group } : {};

    const settings = await db.siteSetting.findMany({
      where,
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }, { key: 'asc' }],
    });

    // Group settings by their group
    const groupsMap = new Map<string, typeof settings>();
    for (const setting of settings) {
      const existing = groupsMap.get(setting.group) || [];
      existing.push(setting);
      groupsMap.set(setting.group, existing);
    }

    const groups = Array.from(groupsMap.entries()).map(([group, items]) => ({
      group,
      settings: items.map(s => ({
        group: s.group,
        key: s.key,
        value: s.value,
        type: s.type,
        label: s.label,
        description: s.description,
        sortOrder: s.sortOrder,
      })),
    }));

    return NextResponse.json({ groups, total: settings.length });
  } catch (error) {
    console.error('[SiteSettings] GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت تنظیمات' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings: incoming } = body as {
      setexport async function PUT(!Array.isArray(incoming) || incoming.length === 0: NextRequest) {
    const auth = await requireAdmin(!Array.isArray(incoming) || incoming.length === 0);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

      return NextResponse.json({ error: 'آرایه تنظیمات خالی است' }, { status: 400 });
    }

    // Upsert all settings
    const results = await Promise.all(
      incoming.map((item) =>
        db.siteSetting.upsert({
          where: {
            group_key: { group: item.group, key: item.key },
          },
          create: {
            group: item.group,
            key: item.key,
            value: item.value,
            type: item.type || 'text',
            label: item.label || item.key,
            description: item.description,
            sortOrder: item.sortOrder || 0,
          },
          update: {
            value: item.value,
            ...(item.type ? { type: item.type } : {}),
            ...(item.label ? { label: item.label } : {}),
            ...(item.description !== undefined ? { description: item.description } : {}),
            ...(item.sortOrder !== undefined ? { sortOrder: item.sortOrder } : {}),
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      updated: results.length,
    });
  } catch (error) {
    console.error('[SiteSettings] PUT error:', error);
    return NextResponse.json({ error: 'خطا در ذخیره تنظیمات' }, { status: 500 });
  }
}

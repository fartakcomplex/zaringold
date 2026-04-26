import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/roles — List all roles with permission count & user count
export async function GET() {
  try {
    const roles = await db.role.findMany({
      orderBy: { priority: 'desc' },
      include: {
        _count: { select: { users: true, rolePermissions: true } },
      },
    });
    return NextResponse.json({ success: true, data: roles });
  } catch {
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست نقش‌ها' },
      { status: 500 }
    );
  }
}

// POST /api/admin/roles — Create new role
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, label, description, color, priority } = body;

    if (!name || !label) {
      return NextResponse.json(
        { success: false, message: 'نام و عنوان نقش الزامی است' },
        { status: 400 }
      );
    }

    // Check if role name already exists
    const existing = await db.role.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'نقشی با این نام از قبل وجود دارد' },
        { status: 400 }
      );
    }

    const role = await db.role.create({
      data: {
        name,
        label,
        description: description || null,
        color: color || '#6B7280',
        priority: priority || 0,
        isSystem: false,
      },
    });

    return NextResponse.json({ success: true, data: role, message: 'نقش با موفقیت ایجاد شد' });
  } catch {
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد نقش' },
      { status: 500 }
    );
  }
}

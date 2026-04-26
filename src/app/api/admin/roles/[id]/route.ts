import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/security/auth-guard';

// GET /api/admin/roles/[id] — Get single role with permissions
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(_req);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { id } = await params;
    const role = await db.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        _count: { select: { users: true } },
      },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, message: 'نقش یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: role });
  } catch {
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت نقش' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/roles/[id] — Update role
export async function PUT(
  req: NextRequest
) {
  try {
    const auth = await requireAdmin(req);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, label, description, color, priority } = body;

    const existing = await db.role.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'نقش یافت نشد' },
        { status: 404 }
      );
    }

    if (existing.isSystem && name && name !== existing.name) {
      return NextResponse.json(
        { success: false, message: 'نام نقش‌های سیستمی قابل تغییر نیست' },
        { status: 400 }
      );
    }

    const role = await db.role.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(label && { label }),
        ...(description !== undefined && { description }),
        ...(color && { color }),
        ...(priority !== undefined && { priority }),
      },
    });

    return NextResponse.json({ success: true, data: role, message: 'نقش با موفقیت بروزرسانی شد' });
  } catch {
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی نقش' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/roles/[id] — Delete role
export async function DELETE(
  _req: NextRequest
) {
  try {
    const auth = await requireAdmin(req);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.role.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'نقش یافت نشد' },
        { status: 404 }
      );
    }

    if (existing.isSystem) {
      return NextResponse.json(
        { success: false, message: 'نقش‌های سیستمی قابل حذف نیستند' },
        { status: 400 }
      );
    }

    await db.role.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'نقش با موفقیت حذف شد' });
  } catch {
    return NextResponse.json(
      { success: false, message: 'خطا در حذف نقش' },
      { status: 500 }
    );
  }
}

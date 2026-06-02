import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/admin/roles/[id]/permissions — Set permissions for a role (replace all)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { permissionIds } = body as { permissionIds?: string[] };

    const existing = await db.role.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'نقش یافت نشد' },
        { status: 404 }
      );
    }

    if (existing.isSystem) {
      return NextResponse.json(
        { success: false, message: 'دسترسی نقش‌های سیستمی قابل تغییر نیست' },
        { status: 400 }
      );
    }

    // Delete all existing permissions for this role
    await db.rolePermission.deleteMany({ where: { roleId: id } });

    // Add new permissions
    if (permissionIds && permissionIds.length > 0) {
      await db.rolePermission.createMany({
        data: permissionIds.map((permissionId: string) => ({
          roleId: id,
          permissionId,
        })),
      });
    }

    const updated = await db.role.findUnique({
      where: { id },
      include: { rolePermissions: { include: { permission: true } } },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'دسترسی‌ها با موفقیت بروزرسانی شد',
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی دسترسی‌ها' },
      { status: 500 }
    );
  }
}

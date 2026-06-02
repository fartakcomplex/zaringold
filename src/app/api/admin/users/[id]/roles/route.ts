import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/users/[id]/roles — Get user's roles
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userRoles = await db.userRole.findMany({
      where: { userId: id },
      include: {
        role: {
          include: {
            _count: { select: { rolePermissions: true } },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: userRoles.map((ur) => ({
        id: ur.id,
        roleId: ur.roleId,
        roleName: ur.role.name,
        roleLabel: ur.role.label,
        roleColor: ur.role.color,
        rolePriority: ur.role.priority,
        isSystem: ur.role.isSystem,
        permissionCount: ur.role._count.rolePermissions,
        assignedBy: ur.assignedBy,
        assignedAt: ur.assignedAt,
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت نقش‌های کاربر' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users/[id]/roles — Assign roles to user (replace all)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { roleIds, assignedBy } = body as { roleIds?: string[]; assignedBy?: string };

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Delete existing user roles
    await db.userRole.deleteMany({ where: { userId: id } });

    // Add new roles
    if (roleIds && roleIds.length > 0) {
      // Validate all role IDs exist
      const validRoles = await db.role.findMany({
        where: { id: { in: roleIds } },
        select: { id: true },
      });

      const validRoleIds = validRoles.map((r) => r.id);

      await db.userRole.createMany({
        data: validRoleIds.map((roleId) => ({
          userId: id,
          roleId,
          assignedBy: assignedBy || null,
        })),
      });
    }

    // Update the user's primary role string (backward compat)
    if (roleIds && roleIds.length > 0) {
      const primaryRole = await db.role.findUnique({ where: { id: roleIds[0] } });
      if (primaryRole) {
        await db.user.update({
          where: { id },
          data: { role: primaryRole.name },
        });
      }
    } else {
      await db.user.update({
        where: { id },
        data: { role: 'user' },
      });
    }

    const updated = await db.userRole.findMany({
      where: { userId: id },
      include: { role: true },
      orderBy: { assignedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'نقش‌های کاربر با موفقیت بروزرسانی شد',
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی نقش‌های کاربر' },
      { status: 500 }
    );
  }
}

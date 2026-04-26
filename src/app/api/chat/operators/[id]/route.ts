import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Operator [id] API — PUT (update status) / DELETE (remove operator)       */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * PUT /api/chat/operators/[id]
 * Update operator status, online state, etc.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, role, department, maxChats, isOnline, isAvailable, status, avatar, socketId, lastSeenAt, totalChats, avgRating } = body;

    const existing = await db.chatOperator.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'اپراتور یافت نشد' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email || null;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (maxChats !== undefined) updateData.maxChats = maxChats;
    if (isOnline !== undefined) updateData.isOnline = isOnline;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (status !== undefined) updateData.status = status;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (socketId !== undefined) updateData.socketId = socketId;
    if (lastSeenAt !== undefined) updateData.lastSeenAt = lastSeenAt ? new Date(lastSeenAt) : null;
    if (totalChats !== undefined) updateData.totalChats = totalChats;
    if (avgRating !== undefined) updateData.avgRating = avgRating;

    const operator = await db.chatOperator.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: operator });
  } catch (error) {
    console.error('[Chat Operator PUT]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی اپراتور' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/operators/[id]
 * Remove an operator
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.chatOperator.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'اپراتور یافت نشد' },
        { status: 404 }
      );
    }

    await db.chatOperator.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'اپراتور با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('[Chat Operator DELETE]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در حذف اپراتور' },
      { status: 500 }
    );
  }
}

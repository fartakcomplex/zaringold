import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Operators API — GET (list operators) / POST (add operator)               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * GET /api/chat/operators?department=support&status=active&online=true
 * List chat operators with optional filters
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const onlineOnly = searchParams.get('online');
    const role = searchParams.get('role');

    const where: Record<string, unknown> = {};

    if (department && department !== 'all') {
      where.department = department;
    }

    if (status) {
      where.status = status;
    }

    if (onlineOnly === 'true') {
      where.isOnline = true;
      where.isAvailable = true;
    }

    if (role) {
      where.role = role;
    }

    const operators = await db.chatOperator.findMany({
      where,
      orderBy: [{ isOnline: 'desc' }, { createdAt: 'desc' }],
    });

    const total = await db.chatOperator.count({ where });
    const onlineCount = await db.chatOperator.count({
      where: { isOnline: true, isAvailable: true },
    });

    return NextResponse.json({
      success: true,
      data: operators,
      meta: { total, onlineCount, filtered: operators.length },
    });
  } catch (error) {
    console.error('[Chat Operators GET]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست اپراتورها' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/operators
 * Add a new operator
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, role, department, maxChats, avatar } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: 'نام و شماره تماس اپراتور الزامی هستند' },
        { status: 400 }
      );
    }

    // Check for duplicate phone
    const existing = await db.chatOperator.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'این شماره تماس قبلاً ثبت شده است' },
        { status: 409 }
      );
    }

    const operator = await db.chatOperator.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email || null,
        role: role || 'operator',
        department: department || 'support',
        maxChats: maxChats || 5,
        avatar: avatar || null,
        isOnline: false,
        isAvailable: true,
        status: 'active',
      },
    });

    return NextResponse.json({ success: true, data: operator }, { status: 201 });
  } catch (error) {
    console.error('[Chat Operators POST]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در افزودن اپراتور' },
      { status: 500 }
    );
  }
}

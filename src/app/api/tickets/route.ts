import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Helper: get user from session
async function getUser(req: NextRequest) {
  try {
    const sessionRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/me`, {
      headers: { cookie: req.headers.get('cookie') || '' }
    });
    if (!sessionRes.ok) return null;
    const data = await sessionRes.json();
    return data.user || data;
  } catch { return null; }
}

// GET /api/tickets — List tickets (user sees own, admin sees all)
export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const department = searchParams.get('department');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (!isAdmin && user) where.userId = user.id;
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (department) where.department = department;
    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { user: { fullName: { contains: search } } },
        { user: { phone: { contains: search } } },
      ];
    }

    const [tickets, total] = await Promise.all([
      db.supportTicket.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, phone: true, avatar: true } },
          messages: { take: 1, orderBy: { createdAt: 'asc' } },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.supportTicket.count({ where }),
    ]);

    // Stats
    const stats = isAdmin ? {
      total: await db.supportTicket.count(),
      open: await db.supportTicket.count({ where: { status: 'open' } }),
      inProgress: await db.supportTicket.count({ where: { status: 'in_progress' } }),
      answered: await db.supportTicket.count({ where: { status: 'answered' } }),
      closed: await db.supportTicket.count({ where: { status: 'closed' } }),
    } : null;

    return NextResponse.json({
      success: true,
      data: { tickets, total, page, limit, stats },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/tickets — Create ticket
export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ success: false, message: 'لطفاً وارد شوید' }, { status: 401 });

    const body = await req.json();
    const { subject, category, priority, message, department } = body;

    if (!subject || !message) {
      return NextResponse.json({ success: false, message: 'موضوع و پیام الزامی است' }, { status: 400 });
    }

    // SLA based on priority
    const slaHours: Record<string, number> = { urgent: 2, high: 8, normal: 24, low: 48 };
    const slaDeadline = new Date(Date.now() + (slaHours[priority || 'normal'] || 24) * 3600000);

    const ticket = await db.supportTicket.create({
      data: {
        userId: user.id,
        subject: subject.trim(),
        category: category || 'general',
        priority: priority || 'normal',
        department: department || 'support',
        slaDeadline,
        messages: message ? {
          create: {
            senderId: user.id,
            content: message.trim(),
            isAdmin: false,
          }
        } : undefined,
      },
      include: {
        user: { select: { id: true, fullName: true, phone: true, avatar: true } },
        messages: true,
      },
    });

    return NextResponse.json({ success: true, data: ticket });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

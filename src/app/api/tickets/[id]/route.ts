import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

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

// GET /api/tickets/[id] — Ticket detail with messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(req);
    if (!user) return NextResponse.json({ success: false, message: 'لطفاً وارد شوید' }, { status: 401 });

    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    
    const ticket = await db.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, phone: true, avatar: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { messages: true } },
      },
    });

    if (!ticket) return NextResponse.json({ success: false, message: 'تیکت یافت نشد' }, { status: 404 });
    if (!isAdmin && ticket.userId !== user.id) {
      return NextResponse.json({ success: false, message: 'دسترسی غیرمجاز' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/tickets/[id] — Reply to ticket
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(req);
    if (!user) return NextResponse.json({ success: false, message: 'لطفاً وارد شوید' }, { status: 401 });

    const body = await req.json();
    const { content, isAdmin: isFromAdmin, isInternal, attachments } = body;
    const isSenderAdmin = user.role === 'admin' || user.role === 'super_admin' || isFromAdmin;

    if (!content?.trim()) {
      return NextResponse.json({ success: false, message: 'محتوای پیام الزامی است' }, { status: 400 });
    }

    // Verify ticket exists
    const ticket = await db.supportTicket.findUnique({ where: { id } });
    if (!ticket) return NextResponse.json({ success: false, message: 'تیکت یافت نشد' }, { status: 404 });

    // Create message
    const message = await db.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: user.id,
        content: content.trim(),
        isAdmin: isSenderAdmin,
        isInternal: isInternal || false,
        attachments: attachments || '[]',
      },
    });

    // Update ticket status
    let newStatus = ticket.status;
    if (isSenderAdmin && isInternal) {
      // Internal note doesn't change status
    } else if (isSenderAdmin) {
      newStatus = 'answered';
      // Set first reply time if not set
      if (!ticket.firstReplyAt) {
        await db.supportTicket.update({
          where: { id },
          data: { firstReplyAt: new Date() },
        });
      }
    } else {
      newStatus = 'open';
    }

    await db.supportTicket.update({
      where: { id },
      data: { status: newStatus },
    });

    return NextResponse.json({ success: true, data: message, status: newStatus });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT /api/tickets/[id] — Update ticket (status, priority, department, assignedTo)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(req);
    if (!user) return NextResponse.json({ success: false, message: 'لطفاً وارد شوید' }, { status: 401 });
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!isAdmin) return NextResponse.json({ success: false, message: 'فقط ادمین' }, { status: 403 });

    const body = await req.json();
    const { status, priority, department, assignedTo, rating, feedback } = body;

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'closed') updateData.closedAt = new Date();
    }
    if (priority) updateData.priority = priority;
    if (department) updateData.department = department;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (rating !== undefined) updateData.rating = rating;
    if (feedback !== undefined) updateData.feedback = feedback;

    const ticket = await db.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, fullName: true, phone: true } },
        messages: { take: 1, orderBy: { createdAt: 'asc' } },
      },
    });

    // Create rating record if user rated
    if (rating && !isAdmin) {
      await db.ticketRating.create({
        data: { ticketId: id, score: rating, comment: feedback || null },
      });
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/tickets/[id] — Delete ticket (admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(req);
    if (!user) return NextResponse.json({ success: false, message: 'لطفاً وارد شوید' }, { status: 401 });
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!isAdmin) return NextResponse.json({ success: false, message: 'فقط ادمین' }, { status: 403 });

    await db.supportTicket.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'تیکت حذف شد' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

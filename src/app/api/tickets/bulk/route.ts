import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/tickets/bulk — Bulk actions (close, change status, assign)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ticketIds, ...data } = body;
    
    if (!action || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json({ success: false, message: 'شناسه تیکت‌ها و عملیات الزامی است' }, { status: 400 });
    }

    let count = 0;
    for (const id of ticketIds) {
      try {
        const updateData: any = {};
        switch (action) {
          case 'close':
            updateData.status = 'closed';
            updateData.closedAt = new Date();
            break;
          case 'assign':
            updateData.assignedTo = data.assignedTo;
            updateData.status = 'in_progress';
            break;
          case 'change_status':
            updateData.status = data.status;
            if (data.status === 'closed') updateData.closedAt = new Date();
            break;
          case 'change_priority':
            updateData.priority = data.priority;
            break;
          case 'change_department':
            updateData.department = data.department;
            break;
        }
        await db.supportTicket.update({ where: { id }, data: updateData });
        count++;
      } catch { /* skip invalid tickets */ }
    }

    return NextResponse.json({ success: true, message: `${count} تیکت بروزرسانی شد`, data: { count } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

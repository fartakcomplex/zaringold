import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/tickets/canned/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const response = await db.cannedResponse.update({
      where: { id },
      data: { title: body.title, content: body.content, category: body.category },
    });
    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/tickets/canned/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.cannedResponse.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'حذف شد' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

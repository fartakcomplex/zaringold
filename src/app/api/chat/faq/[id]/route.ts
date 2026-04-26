import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  FAQ [id] API — PUT (update FAQ) / DELETE (delete FAQ)                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * PUT /api/chat/faq/[id]
 * Update an existing FAQ
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { question, answer, category, keywords, sortOrder, isActive, views, helpfulYes, helpfulNo } = body;

    const existing = await db.chatFAQ.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'سوال متداول یافت نشد' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (question !== undefined) updateData.question = question.trim();
    if (answer !== undefined) updateData.answer = answer.trim();
    if (category !== undefined) updateData.category = category;
    if (keywords !== undefined) updateData.keywords = keywords;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (views !== undefined) updateData.views = views;
    if (helpfulYes !== undefined) updateData.helpfulYes = helpfulYes;
    if (helpfulNo !== undefined) updateData.helpfulNo = helpfulNo;

    const faq = await db.chatFAQ.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: faq });
  } catch (error) {
    console.error('[Chat FAQ PUT]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی سوال متداول' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/faq/[id]
 * Delete a FAQ
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.chatFAQ.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'سوال متداول یافت نشد' },
        { status: 404 }
      );
    }

    await db.chatFAQ.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'سوال متداول با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('[Chat FAQ DELETE]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در حذف سوال متداول' },
      { status: 500 }
    );
  }
}

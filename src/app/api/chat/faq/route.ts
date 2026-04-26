import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  FAQ API — GET (list FAQs) / POST (create FAQ)                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * GET /api/chat/faq?category=general&active=true
 * List FAQs with optional category filter
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('active');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (activeOnly === 'true') {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { question: { contains: search } },
        { answer: { contains: search } },
        { keywords: { contains: search } },
      ];
    }

    const faqs = await db.chatFAQ.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    const total = await db.chatFAQ.count({ where });

    return NextResponse.json({
      success: true,
      data: faqs,
      meta: { total, filtered: faqs.length },
    });
  } catch (error) {
    console.error('[Chat FAQ GET]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت سوالات متداول' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/faq
 * Create a new FAQ
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, answer, category, keywords, sortOrder, isActive } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { success: false, message: 'سوال و پاسخ الزامی هستند' },
        { status: 400 }
      );
    }

    const faq = await db.chatFAQ.create({
      data: {
        question: question.trim(),
        answer: answer.trim(),
        category: category || 'general',
        keywords: keywords || '',
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ success: true, data: faq }, { status: 201 });
  } catch (error) {
    console.error('[Chat FAQ POST]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد سوال متداول' },
      { status: 500 }
    );
  }
}

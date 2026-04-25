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

// GET /api/tickets/canned — List canned responses
export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    if (!isAdmin) return NextResponse.json({ success: false, message: 'فقط ادمین' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const where: any = {};
    if (category) where.category = category;

    const responses = await db.cannedResponse.findMany({
      where,
      orderBy: [{ useCount: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, data: responses });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/tickets/canned — Create canned response
export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    if (!isAdmin) return NextResponse.json({ success: false, message: 'فقط ادمین' }, { status: 403 });

    const body = await req.json();
    const { title, content, category } = body;
    if (!title || !content) {
      return NextResponse.json({ success: false, message: 'عنوان و محتوا الزامی است' }, { status: 400 });
    }

    const response = await db.cannedResponse.create({
      data: { title, content, category: category || 'general' },
    });

    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all active service categories
export async function GET() {
  try {
    const categories = await db.carServiceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'خطا در دریافت دسته‌بندی‌ها' }, { status: 500 });
  }
}

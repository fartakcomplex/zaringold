import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const categories = await db.insuranceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Transform to match frontend types
    const transformedCategories = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      icon: c.icon || 'Shield',
      color: c.color || '#D4AF37',
      subtypes: c.subtypes ? JSON.parse(c.subtypes) : [],
      isActive: c.isActive,
      sortOrder: c.sortOrder,
    }));

    return NextResponse.json({ categories: transformedCategories, success: true });
  } catch (error) {
    console.error('[Insurance Categories API]', error);
    return NextResponse.json({ categories: [], success: true }, { status: 200 });
  }
}

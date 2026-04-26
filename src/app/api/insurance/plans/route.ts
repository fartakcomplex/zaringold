import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    const plans = await db.insurancePlan.findMany({
      where: {
        categoryId: categoryId || undefined,
        isActive: true,
      },
      include: {
        provider: true,
        category: true,
      },
      orderBy: { basePrice: 'asc' },
    });

    // Transform to match frontend types
    const transformedPlans = plans.map((p) => ({
      id: p.id,
      name: p.name,
      categoryId: p.categoryId,
      providerId: p.providerId,
      provider: p.provider ? {
        id: p.provider.id,
        name: p.provider.name,
        slug: '',
        color: p.provider.color || '#D4AF37',
      } : undefined,
      basePrice: p.basePrice,
      sellingPrice: p.sellingPrice,
      duration: p.durationLabel || '',
      durationDays: p.durationDays || 365,
      coverages: p.coverages ? JSON.parse(p.coverages) : [],
      status: p.isActive ? 'active' : 'inactive',
      isPopular: p.sortOrder === 0,
    }));

    return NextResponse.json({ plans: transformedPlans, success: true });
  } catch (error) {
    console.error('[Insurance Plans API]', error);
    return NextResponse.json({ plans: [], success: true }, { status: 200 });
  }
}

import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '';

    const orders = await db.insuranceOrder.findMany({
      where: {
        userId,
      },
      include: {
        plan: {
          include: {
            provider: true,
            category: true,
          },
        },
        provider: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to match frontend types
    const transformedOrders = orders.map((o) => ({
      id: o.id,
      userId: o.userId,
      planId: o.planId,
      plan: o.plan ? {
        id: o.plan.id,
        name: o.plan.name,
        categoryId: o.plan.categoryId,
        providerId: o.plan.providerId,
        provider: o.plan.provider ? {
          id: o.plan.provider.id,
          name: o.plan.provider.name,
          slug: '',
          color: o.plan.provider.color || '#D4AF37',
        } : undefined,
        basePrice: o.plan.basePrice,
        sellingPrice: o.plan.sellingPrice,
        duration: o.plan.durationLabel || '',
        durationDays: o.plan.durationDays || 365,
        coverages: o.plan.coverages ? JSON.parse(o.plan.coverages) : [],
        status: o.plan.isActive ? 'active' : 'inactive',
        isPopular: o.plan.sortOrder === 0,
      } : undefined,
      category: o.category ? {
        id: o.category.id,
        name: o.category.name,
        slug: o.category.slug,
        icon: o.category.icon,
      } : undefined,
      providerName: o.providerName,
      personalInfo: o.personalInfo ? JSON.parse(o.personalInfo) : {
        holderName: o.holderName || '',
        holderPhone: o.holderPhone || '',
        holderNationalId: o.holderNationalId || '',
        holderEmail: o.holderEmail || '',
      },
      formData: o.formData ? JSON.parse(o.formData) : {},
      status: o.status,
      amountPaid: o.amountPaid,
      policyNumber: o.policyNumber,
      startDate: o.startDate ? new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(o.startDate)) : undefined,
      endDate: o.endDate ? new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(o.endDate)) : undefined,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));

    return NextResponse.json({ orders: transformedOrders, success: true });
  } catch (error) {
    console.error('[Insurance Orders GET API]', error);
    return NextResponse.json({ orders: [], success: true }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, planId, personalInfo, formData } = body;

    if (!userId || !planId) {
      return NextResponse.json(
        { success: false, message: 'اطلاعات ناقص است' },
        { status: 400 }
      );
    }

    // Get the plan
    const plan = await db.insurancePlan.findUnique({
      where: { id: planId },
      include: { provider: true, category: true },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, message: 'طرح بیمه یافت نشد' },
        { status: 404 }
      );
    }

    // Generate policy number
    const policyPrefix = (plan.provider?.name || 'IN').charAt(0).toUpperCase();
    const policyNum = `${policyPrefix}-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Calculate dates
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + (plan.durationDays || 365));

    // Create order
    const order = await db.insuranceOrder.create({
      data: {
        userId,
        planId,
        providerId: plan.providerId,
        categoryId: plan.categoryId,
        planName: plan.name,
        providerName: plan.provider?.name || '',
        status: 'pending',
        amountPaid: plan.sellingPrice,
        commissionEarned: (plan.sellingPrice || 0) - (plan.basePrice || 0),
        policyNumber: policyNum,
        startDate: now,
        endDate,
        personalInfo: JSON.stringify(personalInfo || {}),
        formData: JSON.stringify(formData || {}),
        holderName: personalInfo?.holderName || '',
        holderPhone: personalInfo?.holderPhone || '',
        holderNationalId: personalInfo?.holderNationalId || '',
        holderEmail: personalInfo?.holderEmail || '',
      },
    });

    return NextResponse.json({ order: { id: order.id }, success: true });
  } catch (error) {
    console.error('[Insurance Orders POST API]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت سفارش' },
      { status: 500 }
    );
  }
}

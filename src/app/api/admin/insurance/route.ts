import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/security/auth-guard';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GET /api/admin/insurance — list all orders + stats                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { policyNumber: { contains: search } },
        { holderName: { contains: search } },
        { holderPhone: { contains: search } },
        { providerName: { contains: search } },
        { planName: { contains: search } },
        { userId: { contains: search } },
      ];
    }

    const [orders, total] = await Promise.all([
      db.insuranceOrder.findMany({
        where,
        include: {
          plan: {
            include: {
              provider: true,
              category: true,
            },
          },
          provider: true,
          category: true,
          user: {
            select: { id: true, fullName: true, phone: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.insuranceOrder.count({ where }),
    ]);

    /* ── Stats ── */
    const [totalCount, pendingCount, activeCount, expiredCount, cancelledCount, totalRevenue, totalCommission] =
      await Promise.all([
        db.insuranceOrder.count(),
        db.insuranceOrder.count({ where: { status: 'pending' } }),
        db.insuranceOrder.count({ where: { status: 'active' } }),
        db.insuranceOrder.count({ where: { status: 'expired' } }),
        db.insuranceOrder.count({ where: { status: 'cancelled' } }),
        db.insuranceOrder.aggregate({ _sum: { amountPaid: true } }),
        db.insuranceOrder.aggregate({ _sum: { commissionEarned: true } }),
      ]);

    const stats = {
      total: totalCount,
      pending: pendingCount,
      active: activeCount,
      expired: expiredCount,
      cancelled: cancelledCount,
      revenue: totalRevenue._sum.amountPaid || 0,
      commission: totalCommission._sum.commissionEarned || 0,
    };

    /* ── Transform ── */
    const transformed = orders.map((o) => ({
      id: o.id,
      userId: o.userId,
      user: o.user,
      planId: o.planId,
      planName: o.planName,
      providerId: o.providerId,
      providerName: o.providerName,
      categoryId: o.categoryId,
      categoryName: o.category?.name || '',
      categorySlug: o.category?.slug || '',
      status: o.status,
      amountPaid: o.amountPaid,
      commissionEarned: o.commissionEarned,
      policyNumber: o.policyNumber,
      startDate: o.startDate,
      endDate: o.endDate,
      personalInfo: o.personalInfo ? JSON.parse(o.personalInfo) : null,
      formData: o.formData ? JSON.parse(o.formData) : null,
      holderName: o.holderName,
      holderPhone: o.holderPhone,
      holderNationalId: o.holderNationalId,
      holderEmail: o.holderEmail,
      adminNote: o.adminNote,
      reviewedBy: o.reviewedBy,
      issuedAt: o.issuedAt,
      cancelledAt: o.cancelledAt,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      plan: o.plan ? {
        id: o.plan.id,
        name: o.plan.name,
        basePrice: o.plan.basePrice,
        sellingPrice: o.plan.sellingPrice,
        durationLabel: o.plan.durationLabel,
        durationDays: o.plan.durationDays,
        coverages: o.plan.coverages ? JSON.parse(o.plan.coverages) : [],
        provider: o.plan.provider ? {
          id: o.plan.provider.id,
          name: o.plan.provider.name,
          color: o.plan.provider.color,
        } : null,
        category: o.plan.category ? {
          id: o.plan.category.id,
          name: o.plan.category.name,
          slug: o.plan.category.slug,
        } : null,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      orders: transformed,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Admin Insurance GET]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PATCH /api/admin/insurance — update order status                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, status, adminNote, reviewedBy } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش و وضعیت الزامی است' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'active', 'expired', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'وضعیت نامعتبر' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      status,
      adminNote: adminNote || null,
      reviewedBy: reviewedBy || null,
      updatedAt: new Date(),
    };

    if (status === 'active') {
      updateData.issuedAt = new Date();
    }
    if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
    }

    const order = await db.insuranceOrder.update({
      where: { id: orderId },
      data: updateData,
      include: {
        user: { select: { id: true, fullName: true, phone: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'وضعیت سفارش بروزرسانی شد',
      order: {
        id: order.id,
        status: order.status,
        issuedAt: order.issuedAt,
        cancelledAt: order.cancelledAt,
      },
    });
  } catch (error) {
    console.error('[Admin Insurance PATCH]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی سفارش' },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DELETE /api/admin/insurance — delete an order                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش الزامی است' },
        { status: 400 }
      );
    }

    await db.insuranceOrder.delete({ where: { id: orderId } });

    return NextResponse.json({
      success: true,
      message: 'سفارش حذف شد',
    });
  } catch (error) {
    console.error('[Admin Insurance DELETE]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در حذف سفارش' },
      { status: 500 }
    );
  }
}

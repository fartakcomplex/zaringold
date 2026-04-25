import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const existing = await db.insuranceOrder.count();
    if (existing > 0) {
      return NextResponse.json({
        success: true,
        message: `Already have ${existing} orders`,
        seeded: false,
      });
    }

    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'No user found. Create a user first.',
      });
    }

    const plans = await db.insurancePlan.findMany({
      take: 6,
      include: { provider: true, category: true },
    });

    if (plans.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No plans found. Run /api/insurance/seed first.',
      });
    }

    const now = new Date();
    const statuses: Array<'pending' | 'active' | 'expired' | 'cancelled'> = [
      'pending', 'active', 'active', 'expired', 'cancelled', 'active',
    ];
    const holderNames = ['علی محمدی', 'زهرا احمدی', 'محمد حسینی', 'فاطمه رضایی', 'حسین کریمی', 'مریم نوری'];
    const phones = ['09123456789', '09351234567', '09121234567', '09391234567', '09161234567', '09331234567'];
    const nationalIds = ['0012345678', '0023456789', '0034567890', '0045678901', '0056789012', '0067890123'];

    const orders = await Promise.all(
      plans.map((plan, i) => {
        const daysAgo = i * 3;
        const createdAt = new Date(now);
        createdAt.setDate(createdAt.getDate() - daysAgo);

        const endDate = new Date(createdAt);
        endDate.setDate(endDate.getDate() + (plan.durationDays || 365));

        const status = statuses[i] || 'pending';
        const policyPrefix = (plan.provider?.name || 'IN').charAt(0).toUpperCase();
        const policyNum = `${policyPrefix}-${now.getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        return db.insuranceOrder.create({
          data: {
            userId: user.id,
            planId: plan.id,
            providerId: plan.providerId,
            categoryId: plan.categoryId,
            planName: plan.name,
            providerName: plan.provider?.name || '',
            status,
            amountPaid: plan.sellingPrice,
            commissionEarned: (plan.sellingPrice || 0) - (plan.basePrice || 0),
            policyNumber: policyNum,
            startDate: createdAt,
            endDate: status === 'cancelled' ? null : endDate,
            personalInfo: JSON.stringify({
              holderName: holderNames[i] || 'نامشخص',
              holderPhone: phones[i] || '09123456789',
              holderNationalId: nationalIds[i] || '0012345678',
              holderEmail: i % 2 === 0 ? `user${i + 1}@email.com` : '',
            }),
            formData: JSON.stringify({
              vehicleModel: i < 3 ? 'پژو ۲۰۶' : undefined,
              vehicleYear: i < 3 ? '1398' : undefined,
            }),
            holderName: holderNames[i] || 'نامشخص',
            holderPhone: phones[i] || '09123456789',
            holderNationalId: nationalIds[i] || '0012345678',
            holderEmail: i % 2 === 0 ? `user${i + 1}@email.com` : null,
            issuedAt: status === 'active' ? createdAt : null,
            cancelledAt: status === 'cancelled' ? createdAt : null,
            adminNote: status === 'pending'
              ? 'منتظر تأیید مدارک'
              : status === 'active'
                ? 'صادر شده - مدارک کامل'
                : null,
            createdAt,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: `${orders.length} sample orders created for user ${user.fullName || user.phone}`,
      seeded: true,
    });
  } catch (error) {
    console.error('[Insurance Seed Orders]', error);
    return NextResponse.json(
      { success: false, message: 'Error creating sample orders' },
      { status: 500 }
    );
  }
}

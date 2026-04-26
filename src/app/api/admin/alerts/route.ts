import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/security/auth-guard';

interface SystemAlert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  createdAt: string;
  page?: string;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const alerts: SystemAlert[] = [];

    // 1. Pending KYC requests
    const pendingKYC = await db.kYCRequest.count({
      where: { status: 'pending' },
    });
    if (pendingKYC > 0) {
      alerts.push({
        id: `kyc-pending-${Date.now()}`,
        type: 'warning',
        title: 'درخواست‌های KYC معلق',
        message: `${pendingKYC} درخواست احراز هویت در انتظار بررسی است`,
        createdAt: new Date().toISOString(),
        page: 'kyc',
      });
    }

    // 2. Pending withdrawals
    const pendingWithdrawals = await db.transaction.count({
      where: { type: 'withdrawal', status: 'pending' },
    });
    if (pendingWithdrawals > 0) {
      alerts.push({
        id: `withdrawals-pending-${Date.now()}`,
        type: 'warning',
        title: 'برداشت‌های معلق',
        message: `${pendingWithdrawals} درخواست برداشت در انتظار تأیید است`,
        createdAt: new Date(Date.now() - 300000).toISOString(),
        page: 'transactions',
      });
    }

    // 3. Pending loans
    const pendingLoans = await db.goldLoan.count({
      where: { status: 'pending' },
    });
    if (pendingLoans > 0) {
      alerts.push({
        id: `loans-pending-${Date.now()}`,
        type: 'info',
        title: 'درخواست‌های وام معلق',
        message: `${pendingLoans} درخواست وام در انتظار بررسی است`,
        createdAt: new Date(Date.now() - 600000).toISOString(),
        page: 'loans',
      });
    }

    // 4. Frozen users
    const frozenUsers = await db.user.count({
      where: { isFrozen: true },
    });
    if (frozenUsers > 0) {
      alerts.push({
        id: `frozen-users-${Date.now()}`,
        type: 'error',
        title: 'کاربران مسدود شده',
        message: `${frozenUsers} کاربر مسدود شده در سیستم وجود دارد`,
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        page: 'users',
      });
    }

    // 5. Recent new users (last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newUsers = await db.user.count({
      where: { createdAt: { gte: oneDayAgo } },
    });
    if (newUsers > 0) {
      alerts.push({
        id: `new-users-${Date.now()}`,
        type: 'success',
        title: 'کاربران جدید',
        message: `${newUsers} کاربر جدید در ۲۴ ساعت گذشته ثبت‌نام کرده‌اند`,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        page: 'users',
      });
    }

    // 6. Open support tickets
    const openTickets = await db.supportTicket.count({
      where: { status: 'open' },
    });
    if (openTickets > 0) {
      alerts.push({
        id: `open-tickets-${Date.now()}`,
        type: 'info',
        title: 'تیکت‌های باز',
        message: `${openTickets} تیکت پشتیبانی بدون پاسخ وجود دارد`,
        createdAt: new Date(Date.now() - 5400000).toISOString(),
        page: 'tickets',
      });
    }

    // Sort by createdAt descending and return top 10
    alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      alerts: alerts.slice(0, 10),
      unreadCount: alerts.filter(a => a.type === 'warning' || a.type === 'error').length,
    });
  } catch (error) {
    console.error('Admin get alerts error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت هشدارهای سیستم' },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/security/auth-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const pendingKycs = await db.kYCRequest.findMany({
      where: { status: 'pending' },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      kycRequests: pendingKycs,
      count: pendingKycs.length,
    })
  } catch (error) {
    console.error('Admin get KYC requests error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت درخواست‌های احراز هویت' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { kycId, status, note, adminId } = await request.json()

    if (!kycId || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'شناسه درخواست و وضعیت معتبر الزامی است' },
        { status: 400 }
      )
    }

    const kyc = await db.kYCRequest.findUnique({
      where: { id: kycId },
    })

    if (!kyc) {
      return NextResponse.json(
        { success: false, message: 'درخواست یافت نشد' },
        { status: 404 }
      )
    }

    const updatedKyc = await db.kYCRequest.update({
      where: { id: kycId },
      data: {
        status,
        adminNote: note || null,
        reviewedBy: adminId || null,
        reviewedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, phone: true, fullName: true },
        },
      },
    })

    // If approved, update user verification status
    if (status === 'approved') {
      await db.user.update({
        where: { id: kyc.userId },
        data: { isVerified: true },
      })

      // Create notification for user
      await db.notification.create({
        data: {
          userId: kyc.userId,
          title: 'احراز هویت تایید شد',
          body: 'درخواست احراز هویت شما با موفقیت تایید شد. اکنون می‌توانید از تمامی خدمات استفاده کنید.',
          type: 'kyc',
        },
      })
    } else {
      // Create notification for user
      await db.notification.create({
        data: {
          userId: kyc.userId,
          title: 'احراز هویت رد شد',
          body: note
            ? `درخواست احراز هویت شما رد شد. دلیل: ${note}`
            : 'درخواست احراز هویت شما رد شد. لطفاً مجدداً اقدام کنید.',
          type: 'kyc',
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: status === 'approved' ? 'احراز هویت تایید شد' : 'احراز هویت رد شد',
      kyc: updatedKyc,
    })
  } catch (error) {
    console.error('Admin review KYC error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بررسی احراز هویت' },
      { status: 500 }
    )
  }
}

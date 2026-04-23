import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

/* ------------------------------------------------------------------ */
/*  POST /api/admin/users/[id]/impersonate                            */
/*  Create a session for the target user so the admin can             */
/*  browse the app as that user. The response includes the admin's    */
/*  original session info so the client can switch back.              */
/* ------------------------------------------------------------------ */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params

    // Get admin session from Authorization header
    const authHeader = req.headers.get('authorization')
    const adminToken = authHeader?.replace('Bearer ', '') || null

    if (!adminToken) {
      return NextResponse.json(
        { success: false, message: 'توکن ادمین ارسال نشده است' },
        { status: 401 }
      )
    }

    // Validate admin session
    const adminSession = await db.userSession.findUnique({
      where: { token: adminToken },
      include: { user: { select: { id: true, role: true, fullName: true } } },
    })

    if (!adminSession || !adminSession.user) {
      return NextResponse.json(
        { success: false, message: 'جلسه ادمین نامعتبر است' },
        { status: 401 }
      )
    }

    if (!['admin', 'super_admin'].includes(adminSession.user.role)) {
      return NextResponse.json(
        { success: false, message: 'فقط مدیران می‌توانند از این قابلیت استفاده کنند' },
        { status: 403 }
      )
    }

    // Find target user
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        phone: true,
        email: true,
        fullName: true,
        isVerified: true,
        isActive: true,
        avatar: true,
        referralCode: true,
        role: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: 'کاربر هدف یافت نشد' },
        { status: 404 }
      )
    }

    // Create session for target user
    const userToken = crypto.randomUUID()
    await db.userSession.create({
      data: {
        userId: targetUser.id,
        token: userToken,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hour impersonation session
        device: `impersonated-by-${adminSession.user.fullName || adminSession.user.id}`,
        ip: req.headers.get('x-forwarded-for') || undefined,
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: adminSession.userId,
        action: 'admin_impersonate',
        details: `Admin ${adminSession.user.fullName || adminSession.userId} impersonated user ${targetUser.fullName || targetUser.id} (${targetUser.phone})`,
        userAgent: req.headers.get('user-agent') || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      message: `شما اکنون به عنوان "${targetUser.fullName || targetUser.phone}" وارد شده‌اید`,
      impersonationToken: userToken,
      user: targetUser,
      admin: {
        id: adminSession.userId,
        fullName: adminSession.user.fullName,
        role: adminSession.user.role,
        token: adminToken,
      },
    })
  } catch (error) {
    console.error('Admin impersonate error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ورود به عنوان کاربر' },
      { status: 500 }
    )
  }
}

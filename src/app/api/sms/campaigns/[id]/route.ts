import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: Get campaign details with stats ──────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const campaign = await db.smsCampaign.findUnique({
      where: { id },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, message: 'کمپین یافت نشد' },
        { status: 404 }
      )
    }

    const logStats = await db.smsLog.groupBy({
      by: ['status'],
      where: { campaignId: id },
      _count: { status: true },
    })

    const statsMap: Record<string, number> = {}
    logStats.forEach((s) => {
      statsMap[s.status] = s._count.status
    })

    return NextResponse.json({
      success: true,
      message: 'جزئیات کمپین',
      data: {
        ...campaign,
        stats: {
          total: campaign.logs.length,
          delivered: statsMap['delivered'] || 0,
          failed: statsMap['failed'] || 0,
          pending: statsMap['pending'] || 0,
          sent: statsMap['sent'] || 0,
          bounced: statsMap['bounced'] || 0,
        },
      },
    })
  } catch (error) {
    console.error('[SMS Campaign GET]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت جزئیات کمپین' },
      { status: 500 }
    )
  }
}

// ─── PUT: Update campaign ──────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, message, scheduledAt, status } = body

    const campaign = await db.smsCampaign.findUnique({ where: { id } })
    if (!campaign) {
      return NextResponse.json(
        { success: false, message: 'کمپین یافت نشد' },
        { status: 404 }
      )
    }

    if (campaign.status === 'completed' || campaign.status === 'sending') {
      return NextResponse.json(
        { success: false, message: 'امکان ویرایش کمپین در حال ارسال یا تکمیل‌شده وجود ندارد' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (message !== undefined) updateData.message = message
    if (scheduledAt !== undefined) {
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null
      if (campaign.status === 'draft' && scheduledAt) {
        updateData.status = 'scheduled'
      }
    }
    if (status !== undefined) updateData.status = status

    const updated = await db.smsCampaign.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'کمپین با موفقیت بروزرسانی شد',
      data: updated,
    })
  } catch (error) {
    console.error('[SMS Campaign PUT]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی کمپین' },
      { status: 500 }
    )
  }
}

// ─── DELETE: Delete draft campaign ─────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const campaign = await db.smsCampaign.findUnique({ where: { id } })
    if (!campaign) {
      return NextResponse.json(
        { success: false, message: 'کمپین یافت نشد' },
        { status: 404 }
      )
    }

    if (campaign.status === 'sending' || campaign.status === 'completed') {
      return NextResponse.json(
        { success: false, message: 'امکان حذف کمپین در حال ارسال یا تکمیل‌شده وجود ندارد' },
        { status: 400 }
      )
    }

    await db.smsCampaign.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'کمپین با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('[SMS Campaign DELETE]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف کمپین' },
      { status: 500 }
    )
  }
}

// ─── Helper: Get recipients by segment ─────────────────────────────────
async function getRecipientsBySegment(segment: string) {
  const blacklistPhones = await db.smsBlacklist.findMany({
    select: { phone: true },
  })
  const blacklistSet = new Set(blacklistPhones.map((b) => b.phone))

  const where: Record<string, unknown> = {
    isActive: true,
    isFrozen: false,
    ...(blacklistSet.size > 0 ? { phone: { notIn: Array.from(blacklistSet) } } : {}),
  }

  switch (segment) {
    case 'active':
      where.isActive = true
      break
    case 'vip':
      where.userLevel = { in: ['gold', 'platinum'] }
      break
    case 'new_users': {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      where.createdAt = { gte: thirtyDaysAgo }
      break
    }
    case 'kyc_verified':
      where.kyc = { status: 'approved' }
      break
    case 'gold_holders':
      where.goldWallet = { goldGrams: { gt: 0 } }
      break
    case 'all':
    default:
      break
  }

  return db.user.findMany({
    where: where as Parameters<typeof db.user.findMany>[0]['where'],
    select: { id: true, phone: true, fullName: true, profile: { select: { birthDate: true } } },
  })
}

// ─── POST with action: send / cancel / duplicate ──────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const action = body.action as string

    if (!action) {
      return NextResponse.json(
        { success: false, message: 'اکشن مشخص نشده است' },
        { status: 400 }
      )
    }

    // ─── ACTION: send ────────────────────────────────────────────────
    if (action === 'send') {
      const campaign = await db.smsCampaign.findUnique({ where: { id } })
      if (!campaign) {
        return NextResponse.json(
          { success: false, message: 'کمپین یافت نشد' },
          { status: 404 }
        )
      }

      if (campaign.status === 'sending' || campaign.status === 'completed') {
        return NextResponse.json(
          { success: false, message: 'این کمپین قبلاً ارسال یا در حال ارسال است' },
          { status: 400 }
        )
      }

      // Mark as sending
      await db.smsCampaign.update({
        where: { id },
        data: { status: 'sending', sentAt: new Date() },
      })

      // Get recipients
      const recipients = await getRecipientsBySegment(campaign.segment)

      // Create log entries (simulated sending - mark as delivered)
      const logEntries = recipients.map((user) => ({
        campaignId: id,
        phone: user.phone,
        message: campaign.message,
        type: campaign.type,
        status: 'delivered' as const,
        provider: campaign.senderNumber ? 'kavenegar' : 'kavenegar',
        cost: campaign.costPerSms,
        userId: user.id,
        sentAt: new Date(),
        deliveredAt: new Date(Date.now() + 1000), // simulate 1s delivery
        messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      }))

      const createResult = await db.smsLog.createMany({ data: logEntries })

      // Update campaign stats
      const deliveredCount = createResult.count
      const failedCount = 0

      await db.smsCampaign.update({
        where: { id },
        data: {
          status: 'completed',
          deliveredCount,
          failedCount,
          pendingCount: 0,
          completedAt: new Date(),
          totalCost: deliveredCount * campaign.costPerSms,
        },
      })

      return NextResponse.json({
        success: true,
        message: `کمپین با موفقیت ارسال شد — ${deliveredCount} پیام تحویل داده شد`,
        data: {
          delivered: deliveredCount,
          failed: failedCount,
          totalCost: deliveredCount * campaign.costPerSms,
        },
      })
    }

    // ─── ACTION: cancel ──────────────────────────────────────────────
    if (action === 'cancel') {
      const campaign = await db.smsCampaign.findUnique({ where: { id } })
      if (!campaign) {
        return NextResponse.json(
          { success: false, message: 'کمپین یافت نشد' },
          { status: 404 }
        )
      }

      if (campaign.status !== 'scheduled' && campaign.status !== 'draft') {
        return NextResponse.json(
          { success: false, message: 'فقط کمپین‌های پیش‌نویس یا زمان‌بندی‌شده قابل لغو هستند' },
          { status: 400 }
        )
      }

      const updated = await db.smsCampaign.update({
        where: { id },
        data: { status: 'cancelled' },
      })

      return NextResponse.json({
        success: true,
        message: 'کمپین با موفقیت لغو شد',
        data: updated,
      })
    }

    // ─── ACTION: duplicate ───────────────────────────────────────────
    if (action === 'duplicate') {
      const campaign = await db.smsCampaign.findUnique({ where: { id } })
      if (!campaign) {
        return NextResponse.json(
          { success: false, message: 'کمپین یافت نشد' },
          { status: 404 }
        )
      }

      const duplicated = await db.smsCampaign.create({
        data: {
          name: `${campaign.name} (کپی)`,
          type: campaign.type,
          message: campaign.message,
          segment: campaign.segment,
          filterJson: campaign.filterJson,
          senderNumber: campaign.senderNumber,
          costPerSms: campaign.costPerSms,
          template: campaign.template,
          status: 'draft',
          recipientCount: 0,
          totalCost: 0,
        },
      })

      // Recalculate recipient count
      const recipients = await getRecipientsBySegment(duplicated.segment)
      await db.smsCampaign.update({
        where: { id: duplicated.id },
        data: {
          recipientCount: recipients.length,
          pendingCount: recipients.length,
          totalCost: recipients.length * duplicated.costPerSms,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'کمپین با موفقیت کپی شد',
        data: duplicated,
      })
    }

    return NextResponse.json(
      { success: false, message: 'اکشن نامعتبر است' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[SMS Campaign POST action]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اجرای عملیات کمپین' },
      { status: 500 }
    )
  }
}

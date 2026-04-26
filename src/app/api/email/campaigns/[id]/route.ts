import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Helper: get segment users
async function getSegmentUsers(segment: string) {
  switch (segment) {
    case 'active':
      return db.user.findMany({
        where: { isActive: true, email: { not: null } },
        select: { id: true, email: true, fullName: true, phone: true },
      })
    case 'vip':
      return db.user.findMany({
        where: {
          isActive: true,
          email: { not: null },
          userLevel: { in: ['gold', 'platinum', 'diamond'] },
        },
        select: { id: true, email: true, fullName: true, phone: true },
      })
    case 'new_users': {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return db.user.findMany({
        where: {
          isActive: true,
          email: { not: null },
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { id: true, email: true, fullName: true, phone: true },
      })
    }
    case 'kyc_verified':
      return db.user.findMany({
        where: {
          isActive: true,
          email: { not: null },
          isVerified: true,
        },
        select: { id: true, email: true, fullName: true, phone: true },
      })
    case 'gold_holders':
      return db.user.findMany({
        where: {
          isActive: true,
          email: { not: null },
          goldWallet: { goldGrams: { gt: 0 } },
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          goldWallet: { select: { goldGrams: true } },
        },
      })
    case 'inactive_30d': {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return db.user.findMany({
        where: {
          email: { not: null },
          OR: [
            { lastLoginAt: { lt: thirtyDaysAgo } },
            { lastLoginAt: null },
          ],
        },
        select: { id: true, email: true, fullName: true, phone: true },
      })
    }
    case 'all':
    default:
      return db.user.findMany({
        where: { email: { not: null } },
        select: { id: true, email: true, fullName: true, phone: true },
      })
  }
}

// GET: Campaign details with stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const campaign = await db.emailCampaign.findUnique({
      where: { id },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: {
          select: { logs: true },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, message: 'کمپین یافت نشد' },
        { status: 404 }
      )
    }

    // Count stats by status
    const deliveredCount = campaign.logs.filter(
      (l) => l.status === 'delivered'
    ).length
    const openedCount = campaign.logs.filter((l) => l.status === 'opened')
      .length
    const clickedCount = campaign.logs.filter((l) => l.status === 'clicked')
      .length
    const bouncedCount = campaign.logs.filter((l) => l.status === 'bounced')
      .length
    const failedCount = campaign.logs.filter((l) => l.status === 'failed')
      .length
    const pendingCount = campaign.logs.filter((l) => l.status === 'pending')
      .length

    return NextResponse.json({
      success: true,
      data: {
        ...campaign,
        stats: {
          total: campaign._count.logs,
          delivered: deliveredCount,
          opened: openedCount,
          clicked: clickedCount,
          bounced: bouncedCount,
          failed: failedCount,
          pending: pendingCount,
          openRate:
            deliveredCount > 0
              ? Math.round((openedCount / deliveredCount) * 100)
              : 0,
          clickRate:
            deliveredCount > 0
              ? Math.round((clickedCount / deliveredCount) * 100)
              : 0,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت جزئیات کمپین' },
      { status: 500 }
    )
  }
}

// PUT: Update campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const campaign = await db.emailCampaign.findUnique({ where: { id } })
    if (!campaign) {
      return NextResponse.json(
        { success: false, message: 'کمپین یافت نشد' },
        { status: 404 }
      )
    }

    if (campaign.status === 'sending') {
      return NextResponse.json(
        { success: false, message: 'کمپین در حال ارسال است و قابل ویرایش نیست' },
        { status: 400 }
      )
    }

    const { name, type, subject, htmlContent, plainText, segment, scheduledAt, template } = body

    const updated = await db.emailCampaign.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(subject !== undefined && { subject }),
        ...(htmlContent !== undefined && { htmlContent }),
        ...(plainText !== undefined && { plainText }),
        ...(segment !== undefined && { segment }),
        ...(template !== undefined && { template }),
        ...(scheduledAt !== undefined && {
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          status: scheduledAt ? 'scheduled' : 'draft',
        }),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'کمپین با موفقیت بروزرسانی شد',
      data: updated,
    })
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی کمپین' },
      { status: 500 }
    )
  }
}

// DELETE: Delete draft campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const campaign = await db.emailCampaign.findUnique({ where: { id } })
    if (!campaign) {
      return NextResponse.json(
        { success: false, message: 'کمپین یافت نشد' },
        { status: 404 }
      )
    }

    if (!['draft', 'cancelled'].includes(campaign.status)) {
      return NextResponse.json(
        {
          success: false,
          message: 'فقط کمپین‌های پیش‌نویس یا لغوشده قابل حذف هستند',
        },
        { status: 400 }
      )
    }

    await db.emailCampaign.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'کمپین با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف کمپین' },
      { status: 500 }
    )
  }
}

// POST with action: send, cancel, duplicate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    const campaign = await db.emailCampaign.findUnique({ where: { id } })
    if (!campaign) {
      return NextResponse.json(
        { success: false, message: 'کمپین یافت نشد' },
        { status: 404 }
      )
    }

    // ── Action: SEND ──
    if (action === 'send') {
      if (!['draft', 'scheduled'].includes(campaign.status)) {
        return NextResponse.json(
          { success: false, message: 'فقط کمپین‌های پیش‌نویس یا زمان‌بندی شده قابل ارسال هستند' },
          { status: 400 }
        )
      }

      // Get blacklist
      const blacklistEntries = await db.emailBlacklist.findMany({
        select: { email: true },
      })
      const blacklistedEmails = new Set(
        blacklistEntries.map((b) => b.email.toLowerCase())
      )

      // Get users for segment
      const users = await getSegmentUsers(campaign.segment)
      const validUsers = users.filter(
        (u) => u.email && !blacklistedEmails.has(u.email.toLowerCase())
      )

      // Mark as sending
      await db.emailCampaign.update({
        where: { id },
        data: {
          status: 'sending',
          sentAt: new Date(),
          recipientCount: validUsers.length,
        },
      })

      // Simulate sending: create EmailLog entries
      const now = new Date()
      let openedCount = 0
      let clickedCount = 0
      let bouncedCount = 0

      for (const user of validUsers) {
        const rand = Math.random()
        let status = 'delivered'
        let openedAt: Date | null = null
        let clickedAt: Date | null = null
        let bouncedAt: Date | null = null

        // 5% bounce rate
        if (rand < 0.05) {
          status = 'bounced'
          bouncedAt = new Date(now.getTime() + Math.random() * 60000)
          bouncedCount++
        } else {
          // 30-70% open rate
          const openChance = 0.3 + Math.random() * 0.4
          if (Math.random() < openChance) {
            status = 'opened'
            openedAt = new Date(
              now.getTime() + Math.random() * 300000 + 60000
            )
            openedCount++

            // 10-30% click rate from opened
            const clickChance = 0.1 + Math.random() * 0.2
            if (Math.random() < clickChance) {
              status = 'clicked'
              clickedAt = new Date(
                openedAt.getTime() + Math.random() * 120000 + 10000
              )
              clickedCount++
            }
          }
        }

        await db.emailLog.create({
          data: {
            campaignId: id,
            email: user.email!,
            subject: campaign.subject,
            type: campaign.type,
            status,
            openedAt,
            clickedAt,
            bouncedAt,
            userId: user.id,
          },
        })
      }

      // Mark as completed
      const completed = await db.emailCampaign.update({
        where: { id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          openedCount,
          clickedCount,
          bouncedCount,
          unsubscribed: 0,
        },
      })

      return NextResponse.json({
        success: true,
        message: `کمپین با موفقیت ارسال شد. ${validUsers.length} ایمیل ارسال شد`,
        data: completed,
      })
    }

    // ── Action: CANCEL ──
    if (action === 'cancel') {
      if (campaign.status !== 'scheduled') {
        return NextResponse.json(
          { success: false, message: 'فقط کمپین‌های زمان‌بندی شده قابل لغو هستند' },
          { status: 400 }
        )
      }

      const updated = await db.emailCampaign.update({
        where: { id },
        data: { status: 'cancelled' },
      })

      return NextResponse.json({
        success: true,
        message: 'کمپین با موفقیت لغو شد',
        data: updated,
      })
    }

    // ── Action: DUPLICATE ──
    if (action === 'duplicate') {
      const duplicated = await db.emailCampaign.create({
        data: {
          name: `${campaign.name} (کپی)`,
          type: campaign.type,
          subject: campaign.subject,
          htmlContent: campaign.htmlContent,
          plainText: campaign.plainText,
          senderName: campaign.senderName,
          senderEmail: campaign.senderEmail,
          segment: campaign.segment,
          filterJson: campaign.filterJson,
          template: campaign.template,
          status: 'draft',
        },
      })

      return NextResponse.json({
        success: true,
        message: 'کمپین با موفقیت کپی شد',
        data: duplicated,
      })
    }

    return NextResponse.json(
      { success: false, message: 'عملیات نامعتبر' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in campaign action:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اجرای عملیات' },
      { status: 500 }
    )
  }
}

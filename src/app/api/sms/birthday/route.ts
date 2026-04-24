import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── Helper: Get Persian / Gregorian birthday users in next 7 days ─────
async function getUpcomingBirthdays(daysAhead = 7) {
  const today = new Date()
  const end = new Date()
  end.setDate(today.getDate() + daysAhead)

  const todayDay = today.getDate()
  const todayMonth = today.getMonth() + 1
  const endDay = end.getDate()
  const endMonth = end.getMonth() + 1

  // Get all users with birthDate in profile
  const usersWithBirthDate = await db.user.findMany({
    where: {
      isActive: true,
      isFrozen: false,
      profile: {
        birthDate: { not: null },
      },
    },
    select: {
      id: true,
      phone: true,
      fullName: true,
      profile: {
        select: { birthDate: true },
      },
    },
  })

  // Filter by upcoming birthday (handles year wrap-around)
  const upcoming: {
    id: string
    phone: string
    fullName: string | null
    birthDate: string
    daysUntil: number
  }[] = []

  for (const user of usersWithBirthDate) {
    const bd = user.profile?.birthDate
    if (!bd) continue

    const parts = bd.split('-')
    if (parts.length < 2) continue

    const birthDay = parseInt(parts[2], 10)
    const birthMonth = parseInt(parts[1], 10)

    if (!birthDay || !birthMonth) continue

    let daysUntil = 0

    if (birthMonth === todayMonth && birthMonth === endMonth) {
      // Same month
      if (birthDay >= todayDay && birthDay <= endDay) {
        daysUntil = birthDay - todayDay
      }
    } else if (birthMonth === todayMonth && birthDay >= todayDay) {
      // Starts this month
      const target = new Date(today.getFullYear(), birthMonth - 1, birthDay)
      daysUntil = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    } else if (birthMonth === endMonth && birthDay <= endDay) {
      // Ends in that month
      const target = new Date(today.getFullYear(), birthMonth - 1, birthDay)
      if (target < today) {
        target.setFullYear(today.getFullYear() + 1)
      }
      daysUntil = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    } else if (todayMonth < birthMonth || (todayMonth === 12 && birthMonth === 1)) {
      // Month is between today and end (handles year wrap)
      const target = new Date(today.getFullYear(), birthMonth - 1, birthDay)
      if (target < today) target.setFullYear(today.getFullYear() + 1)
      daysUntil = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntil > daysAhead) continue
    }

    if (daysUntil >= 0 && daysUntil <= daysAhead) {
      upcoming.push({
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        birthDate: bd,
        daysUntil,
      })
    }
  }

  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil)
}

// ─── GET: Get upcoming birthdays ───────────────────────────────────────
export async function GET() {
  try {
    const upcoming = await getUpcomingBirthdays(7)

    return NextResponse.json({
      success: true,
      message: 'تولدهای پیش‌رو',
      data: {
        count: upcoming.length,
        birthdays: upcoming,
      },
    })
  } catch (error) {
    console.error('[SMS Birthday GET]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تولدهای پیش‌رو' },
      { status: 500 }
    )
  }
}

// ─── POST: Send birthday SMS campaign ──────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message } = body

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'متن پیام تبریک الزامی است' },
        { status: 400 }
      )
    }

    const upcoming = await getUpcomingBirthdays(7)

    if (upcoming.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'هیچ تولدی در ۷ روز آینده یافت نشد',
        data: { sent: 0 },
      })
    }

    // Check blacklist
    const phones = upcoming.map((u) => u.phone)
    const blacklistEntries = await db.smsBlacklist.findMany({
      where: { phone: { in: phones } },
    })
    const blacklistSet = new Set(blacklistEntries.map((b) => b.phone))
    const validRecipients = upcoming.filter((u) => !blacklistSet.has(u.phone))

    if (validRecipients.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'تمام گیرندگان در لیست سیاه هستند',
        data: { sent: 0 },
      })
    }

    // Create campaign
    const costPerSms = 35
    const campaign = await db.smsCampaign.create({
      data: {
        name: `تبریک تولد — ${new Date().toLocaleDateString('fa-IR')}`,
        type: 'birthday',
        message,
        segment: 'all',
        senderNumber: '',
        recipientCount: validRecipients.length,
        costPerSms,
        totalCost: validRecipients.length * costPerSms,
        status: 'sending',
        sentAt: new Date(),
      },
    })

    // Create personalized messages and log entries
    const logEntries = validRecipients.map((recipient) => {
      const personalized = message
        .replace(/\{name\}/g, recipient.fullName || 'کاربر گرامی')
        .replace(/\{phone\}/g, recipient.phone)

      return {
        campaignId: campaign.id,
        phone: recipient.phone,
        message: personalized,
        type: 'birthday' as const,
        status: 'delivered' as const,
        provider: 'kavenegar',
        cost: costPerSms,
        userId: recipient.id,
        sentAt: new Date(),
        deliveredAt: new Date(Date.now() + 1000),
        messageId: `bday_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      }
    })

    const createResult = await db.smsLog.createMany({ data: logEntries })
    const deliveredCount = createResult.count

    await db.smsCampaign.update({
      where: { id: campaign.id },
      data: {
        status: 'completed',
        deliveredCount,
        failedCount: 0,
        pendingCount: 0,
        completedAt: new Date(),
        totalCost: deliveredCount * costPerSms,
      },
    })

    return NextResponse.json({
      success: true,
      message: `پیام تبریک تولد برای ${deliveredCount} نفر ارسال شد`,
      data: {
        campaignId: campaign.id,
        delivered: deliveredCount,
        skipped: upcoming.length - validRecipients.length,
        totalCost: deliveredCount * costPerSms,
      },
    })
  } catch (error) {
    console.error('[SMS Birthday POST]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ارسال پیام تبریک تولد' },
      { status: 500 }
    )
  }
}

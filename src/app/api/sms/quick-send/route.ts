import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── POST: Send single/bulk SMS immediately ────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phones, message, type = 'marketing', senderNumber = '' } = body

    if (!phones || !Array.isArray(phones) || phones.length === 0) {
      return NextResponse.json(
        { success: false, message: 'حداقل یک شماره تلفن وارد کنید' },
        { status: 400 }
      )
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'متن پیام نمی‌تواند خالی باشد' },
        { status: 400 }
      )
    }

    if (phones.length > 500) {
      return NextResponse.json(
        { success: false, message: 'حداکثر ۵۰۰ شماره در هر ارسال مجاز است' },
        { status: 400 }
      )
    }

    // Check blacklist
    const blacklistEntries = await db.smsBlacklist.findMany({
      where: { phone: { in: phones } },
    })
    const blacklistSet = new Set(blacklistEntries.map((b) => b.phone))
    const validPhones = phones.filter((p: string) => !blacklistSet.has(p))

    if (validPhones.length === 0) {
      return NextResponse.json(
        { success: false, message: 'تمام شماره‌ها در لیست سیاه هستند' },
        { status: 400 }
      )
    }

    // Find matching users for userId
    const users = await db.user.findMany({
      where: { phone: { in: validPhones } },
      select: { id: true, phone: true },
    })
    const userPhoneMap = new Map(users.map((u) => [u.phone, u.id]))

    const costPerSms = 35

    // Create campaign
    const campaign = await db.smsCampaign.create({
      data: {
        name: `ارسال سریع — ${new Date().toLocaleDateString('fa-IR')}`,
        type,
        message,
        senderNumber,
        segment: 'all',
        recipientCount: validPhones.length,
        costPerSms,
        totalCost: validPhones.length * costPerSms,
        status: 'sending',
        sentAt: new Date(),
      },
    })

    // Create log entries (simulated — marked as delivered)
    const logEntries = validPhones.map((phone: string) => ({
      campaignId: campaign.id,
      phone,
      message,
      type,
      status: 'delivered' as const,
      provider: 'kavenegar',
      cost: costPerSms,
      userId: userPhoneMap.get(phone) || null,
      sentAt: new Date(),
      deliveredAt: new Date(Date.now() + 1000),
      messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    }))

    const createResult = await db.smsLog.createMany({ data: logEntries })

    // Update campaign to completed
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

    const skippedCount = phones.length - validPhones.length

    return NextResponse.json({
      success: true,
      message: `پیامک با موفقیت ارسال شد — ${deliveredCount} پیام تحویل داده شد${skippedCount > 0 ? ` (${skippedCount} شماره در لیست سیاه رد شد)` : ''}`,
      data: {
        campaignId: campaign.id,
        delivered: deliveredCount,
        failed: 0,
        skipped: skippedCount,
        totalCost: deliveredCount * costPerSms,
      },
    })
  } catch (error) {
    console.error('[SMS Quick-Send POST]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ارسال پیامک' },
      { status: 500 }
    )
  }
}

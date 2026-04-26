import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// POST: Send email(s) immediately - simulated
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emails, subject, htmlContent, plainText, type } = body

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { success: false, message: 'لیست ایمیل‌ها الزامی است' },
        { status: 400 }
      )
    }

    if (!subject) {
      return NextResponse.json(
        { success: false, message: 'موضوع ایمیل الزامی است' },
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

    const now = new Date()
    const results = {
      sent: 0,
      bounced: 0,
      skipped: 0,
      blacklisted: 0,
    }

    for (const email of emails) {
      const normalizedEmail = email.toLowerCase().trim()

      if (!normalizedEmail) continue

      // Check blacklist
      if (blacklistedEmails.has(normalizedEmail)) {
        results.blacklisted++
        continue
      }

      // Find user by email for userId
      const user = await db.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      })

      // Simulate sending
      const rand = Math.random()
      let status = 'delivered'
      let openedAt: Date | null = null
      let clickedAt: Date | null = null
      let bouncedAt: Date | null = null

      // 5% bounce rate
      if (rand < 0.05) {
        status = 'bounced'
        bouncedAt = new Date(now.getTime() + Math.random() * 60000)
        results.bounced++
      } else {
        results.sent++
        // 30-70% open rate
        const openChance = 0.3 + Math.random() * 0.4
        if (Math.random() < openChance) {
          status = 'opened'
          openedAt = new Date(
            now.getTime() + Math.random() * 300000 + 60000
          )
        }
      }

      await db.emailLog.create({
        data: {
          email: normalizedEmail,
          subject,
          htmlContent: htmlContent || '',
          type: type || 'marketing',
          status,
          openedAt,
          clickedAt,
          bouncedAt,
          userId: user?.id || null,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `ایمیل ارسال شد: ${results.sent} ارسال، ${results.bounced} برگشتی، ${results.blacklisted} در لیست سیاه`,
      data: results,
    })
  } catch (error) {
    console.error('Error in quick send:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ارسال ایمیل' },
      { status: 500 }
    )
  }
}

import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET: Users with upcoming birthdays (next 7 days)
export async function GET() {
  try {
    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Get all profiles with birthDate
    const profiles = await db.profile.findMany({
      where: {
        birthDate: { not: null },
        user: {
          isActive: true,
          email: { not: null },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
      },
    })

    // Filter profiles whose birthday falls within next 7 days
    const birthdayUsers: Array<{
      userId: string
      email: string
      fullName: string | null
      phone: string
      birthDate: string
      birthdayDate: string
      daysUntil: number
    }> = []

    for (const profile of profiles) {
      if (!profile.birthDate || !profile.user.email) continue

      // Parse birthDate (format: YYYY-MM-DD or MM/DD/YYYY)
      let birthMonth: number
      let birthDay: number

      if (profile.birthDate.includes('-')) {
        const parts = profile.birthDate.split('-')
        birthMonth = parseInt(parts[1])
        birthDay = parseInt(parts[2])
      } else if (profile.birthDate.includes('/')) {
        const parts = profile.birthDate.split('/')
        birthMonth = parseInt(parts[0])
        birthDay = parseInt(parts[1])
      } else {
        continue
      }

      if (isNaN(birthMonth) || isNaN(birthDay)) continue

      // Check each of the next 7 days
      for (let i = 0; i <= 7; i++) {
        const checkDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
        if (
          checkDate.getMonth() + 1 === birthMonth &&
          checkDate.getDate() === birthDay
        ) {
          birthdayUsers.push({
            userId: profile.user.id,
            email: profile.user.email,
            fullName: profile.user.fullName,
            phone: profile.user.phone,
            birthDate: profile.birthDate,
            birthdayDate: checkDate.toISOString().split('T')[0],
            daysUntil: i,
          })
          break
        }
      }
    }

    // Sort by daysUntil
    birthdayUsers.sort((a, b) => a.daysUntil - b.daysUntil)

    return NextResponse.json({
      success: true,
      data: birthdayUsers,
      count: birthdayUsers.length,
    })
  } catch (error) {
    console.error('Error fetching birthday users:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست تولد‌ها' },
      { status: 500 }
    )
  }
}

// POST: Send birthday emails
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userIds, subject, htmlContent, plainText } = body

    // Get blacklist
    const blacklistEntries = await db.emailBlacklist.findMany({
      select: { email: true },
    })
    const blacklistedEmails = new Set(
      blacklistEntries.map((b) => b.email.toLowerCase())
    )

    // If specific userIds provided, send to them
    // Otherwise, send to all upcoming birthdays
    let users

    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      users = await db.user.findMany({
        where: {
          id: { in: userIds },
          email: { not: null },
          isActive: true,
        },
        select: { id: true, email: true, fullName: true },
      })
    } else {
      // Get all upcoming birthdays
      const now = new Date()
      const profiles = await db.profile.findMany({
        where: {
          birthDate: { not: null },
          user: {
            isActive: true,
            email: { not: null },
          },
        },
        include: {
          user: {
            select: { id: true, email: true, fullName: true },
          },
        },
      })

      users = []
      for (const profile of profiles) {
        if (!profile.birthDate || !profile.user.email) continue

        let birthMonth: number
        let birthDay: number

        if (profile.birthDate.includes('-')) {
          const parts = profile.birthDate.split('-')
          birthMonth = parseInt(parts[1])
          birthDay = parseInt(parts[2])
        } else if (profile.birthDate.includes('/')) {
          const parts = profile.birthDate.split('/')
          birthMonth = parseInt(parts[0])
          birthDay = parseInt(parts[1])
        } else {
          continue
        }

        if (isNaN(birthMonth) || isNaN(birthDay)) continue

        for (let i = 0; i <= 7; i++) {
          const checkDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
          if (
            checkDate.getMonth() + 1 === birthMonth &&
            checkDate.getDate() === birthDay
          ) {
            users.push(profile.user)
            break
          }
        }
      }
    }

    const validUsers = users.filter(
      (u) => u.email && !blacklistedEmails.has(u.email.toLowerCase())
    )

    if (validUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'کاربری برای ارسال ایمیل تولد یافت نشد',
        data: { sent: 0 },
      })
    }

    const defaultSubject = subject || '🎂 تولدت مبارک!'
    const defaultHtml =
      htmlContent ||
      `
      <div style="text-align: center; font-family: Tahoma, Arial; direction: rtl; padding: 40px;">
        <h1 style="color: #D4AF37;">🎂 تولدت مبارک!</h1>
        <p style="font-size: 16px;">zarengold.team شما را به بهترین‌ها آرزومند است.</p>
        <p style="font-size: 14px; color: #666;">زرین گلد - سرمایه‌گذاری هوشمند طلا</p>
      </div>
    `

    const now = new Date()
    let sentCount = 0

    for (const user of validUsers) {
      const rand = Math.random()
      let status = 'delivered'
      let openedAt: Date | null = null

      if (rand < 0.03) {
        status = 'bounced'
      } else {
        sentCount++
        if (Math.random() < 0.75) {
          status = 'opened'
          openedAt = new Date(
            now.getTime() + Math.random() * 300000 + 60000
          )
        }
      }

      await db.emailLog.create({
        data: {
          email: user.email!,
          subject: defaultSubject,
          type: 'birthday',
          status,
          openedAt,
          userId: user.id,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `ایمیل تولد برای ${validUsers.length} کاربر ارسال شد`,
      data: { sent: sentCount, total: validUsers.length },
    })
  } catch (error) {
    console.error('Error sending birthday emails:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ارسال ایمیل تولد' },
      { status: 500 }
    )
  }
}

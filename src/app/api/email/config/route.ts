import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET: Get email config (mask password)
export async function GET() {
  try {
    const config = await db.emailConfig.findFirst()

    if (!config) {
      return NextResponse.json({
        success: true,
        data: {
          provider: 'smtp',
          host: '',
          port: 587,
          secure: true,
          username: '',
          password: '',
          senderName: 'زرین گلد',
          senderEmail: 'noreply@zarringold.ir',
          replyTo: '',
          isConfigured: false,
        },
      })
    }

    const maskedPassword = config.password
      ? '•'.repeat(Math.min(config.password.length, 12))
      : ''

    return NextResponse.json({
      success: true,
      data: {
        ...config,
        password: maskedPassword,
        isConfigured: !!(config.host && config.username && config.password),
      },
    })
  } catch (error) {
    console.error('Error fetching email config:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تنظیمات ایمیل' },
      { status: 500 }
    )
  }
}

// PUT: Save email config (SMTP settings)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      provider,
      host,
      port,
      secure,
      username,
      password,
      senderName,
      senderEmail,
      replyTo,
    } = body

    const existing = await db.emailConfig.findFirst()

    let config
    if (existing) {
      // If password is masked (unchanged), keep the old one
      const finalPassword =
        password && password.includes('•') ? existing.password : password

      config = await db.emailConfig.update({
        where: { id: existing.id },
        data: {
          provider: provider || 'smtp',
          host: host || '',
          port: port || 587,
          secure: secure !== false,
          username: username || '',
          password: finalPassword || '',
          senderName: senderName || 'زرین گلد',
          senderEmail: senderEmail || 'noreply@zarringold.ir',
          replyTo: replyTo || '',
        },
      })
    } else {
      config = await db.emailConfig.create({
        data: {
          provider: provider || 'smtp',
          host: host || '',
          port: port || 587,
          secure: secure !== false,
          username: username || '',
          password: password || '',
          senderName: senderName || 'زرین گلد',
          senderEmail: senderEmail || 'noreply@zarringold.ir',
          replyTo: replyTo || '',
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'تنظیمات ایمیل با موفقیت ذخیره شد',
      data: {
        ...config,
        password: config.password
          ? '•'.repeat(Math.min(config.password.length, 12))
          : '',
      },
    })
  } catch (error) {
    console.error('Error saving email config:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ذخیره تنظیمات ایمیل' },
      { status: 500 }
    )
  }
}

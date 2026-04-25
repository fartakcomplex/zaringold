import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Parse body — may be empty if client doesn't send token
    let token: string | null = null
    try {
      const body = await request.json()
      token = body?.token || null
    } catch {
      // Empty body — that's fine, just clear client state
    }

    // If a token was provided, try to delete the session
    if (token) {
      await db.userSession.deleteMany({
        where: { token },
      })
    }

    return NextResponse.json({ success: true, message: 'با موفقیت خارج شدید' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در خروج از حساب' },
      { status: 500 }
    )
  }
}

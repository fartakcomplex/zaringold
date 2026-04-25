import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: Today's check-in status ──
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const gamification = await db.userGamification.findUnique({
      where: { userId },
    })

    if (!gamification) {
      return NextResponse.json({
        success: true,
        checkedInToday: false,
        currentStreak: 0,
        longestStreak: 0,
        totalCheckIns: 0,
        nextReward: {
          dayNumber: 1,
          type: 'fiat',
          value: 5000,
          label: '۵,۰۰۰ واحد طلایی',
        },
        dayProgress: {
          current: 0,
          nextMilestone: 7,
        },
      })
    }

    // Check if already checked in today (Tehran timezone)
    const tehranNow = new Date()
    const tehranOffset = 3.5 * 60
    const utcNow = tehranNow.getTime() + tehranNow.getTimezoneOffset() * 60000
    const tehranTime = new Date(utcNow + tehranOffset * 60000)
    const todayStr = tehranTime.toISOString().split('T')[0]

    let checkedInToday = false
    if (gamification.lastCheckInAt) {
      const lastTehran = new Date(
        gamification.lastCheckInAt.getTime() + gamification.lastCheckInAt.getTimezoneOffset() * 60000 + tehranOffset * 60000
      )
      const lastStr = lastTehran.toISOString().split('T')[0]
      checkedInToday = lastStr === todayStr
    }

    // Calculate next day number
    const nextDayNumber = gamification.checkInCount + 1

    // Determine next reward
    let nextReward: { dayNumber: number; type: string; value: number; label: string }
    if (nextDayNumber % 30 === 0) {
      nextReward = { dayNumber: nextDayNumber, type: 'vip_trial', value: 3, label: `${nextDayNumber} روز اشتراک VIP` }
    } else if (nextDayNumber % 14 === 0) {
      nextReward = { dayNumber: nextDayNumber, type: 'fiat', value: 10000, label: '۱۰,۰۰۰ واحد طلایی' }
    } else if (nextDayNumber % 7 === 0) {
      nextReward = { dayNumber: nextDayNumber, type: 'gold', value: 0.01, label: '۰.۰۱ گرم طلا' }
    } else {
      nextReward = { dayNumber: nextDayNumber, type: 'fiat', value: 5000, label: '۵,۰۰۰ واحد طلایی' }
    }

    // Calculate progress to next milestone
    let nextMilestone = 7
    if (gamification.currentStreak >= 60) nextMilestone = 90
    else if (gamification.currentStreak >= 30) nextMilestone = 60
    else if (gamification.currentStreak >= 14) nextMilestone = 30
    else if (gamification.currentStreak >= 7) nextMilestone = 14

    return NextResponse.json({
      success: true,
      checkedInToday,
      currentStreak: gamification.currentStreak,
      longestStreak: gamification.longestStreak,
      totalCheckIns: gamification.checkInCount,
      nextReward,
      dayProgress: {
        current: gamification.currentStreak,
        nextMilestone,
      },
    })
  } catch (error) {
    console.error('Check-in status error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت وضعیت ثبت‌حضور' },
      { status: 500 }
    )
  }
}

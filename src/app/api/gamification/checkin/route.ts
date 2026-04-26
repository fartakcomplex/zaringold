import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

// Day reward schedule
function getDayReward(dayNumber: number): { type: string; value: number; label: string } {
  if (dayNumber % 30 === 0) {
    return { type: 'vip_trial', value: 3, label: `${dayNumber} روز اشتراک VIP رایگان` }
  }
  if (dayNumber % 14 === 0) {
    return { type: 'fiat', value: 10000, label: '۱۰,۰۰۰ واحد طلایی' }
  }
  if (dayNumber % 7 === 0) {
    return { type: 'gold', value: 0.01, label: '۰.۰۱ گرم طلا' }
  }
  return { type: 'fiat', value: 5000, label: '۵,۰۰۰ واحد طلایی' }
}

// XP rewards per check-in
function getCheckInXp(dayNumber: number): number {
  let xp = 10 // Base XP per check-in
  if (dayNumber % 30 === 0) xp += 50
  else if (dayNumber % 14 === 0) xp += 50
  else if (dayNumber % 7 === 0) xp += 50
  return xp
}

// Achievement definitions for auto-unlock
const CHECKIN_ACHIEVEMENTS: Record<string, { slug: string; xpReward: number; goldRewardMg: number; title: string; description: string }> = {
  'first_checkin': { slug: 'first_checkin', xpReward: 20, goldRewardMg: 0.005, title: 'قدم اول', description: 'اولین ثبت‌حضور روزانه' },
  'streak_7': { slug: 'streak_7', xpReward: 100, goldRewardMg: 0.02, title: 'هفته طلایی', description: '۷ روز ثبت‌حضور متوالی' },
  'streak_14': { slug: 'streak_14', xpReward: 200, goldRewardMg: 0.05, title: 'دو هفته ثبات', description: '۱۴ روز ثبت‌حضور متوالی' },
  'streak_30': { slug: 'streak_30', xpReward: 500, goldRewardMg: 0.1, title: 'یک ماه پایدار', description: '۳۰ روز ثبت‌حضور متوالی' },
  'streak_60': { slug: 'streak_60', xpReward: 1000, goldRewardMg: 0.25, title: 'ستاره پایداری', description: '۶۰ روز ثبت‌حضور متوالی' },
  'checkins_50': { slug: 'checkins_50', xpReward: 300, goldRewardMg: 0.05, title: 'حضور پررنگ', description: '۵۰ بار ثبت‌حضور' },
  'checkins_100': { slug: 'checkins_100', xpReward: 600, goldRewardMg: 0.1, title: 'حضور همیشگی', description: '۱۰۰ بار ثبت‌حضور' },
}

async function checkAndUnlockAchievement(userId: string, slug: string, definition: typeof CHECKIN_ACHIEVEMENTS[string]) {
  const achievement = await db.achievement.findUnique({
    where: { slug },
  })

  if (!achievement) {
    // Auto-create the achievement
    const created = await db.achievement.create({
      data: {
        slug: definition.slug,
        title: definition.title,
        description: definition.description,
        icon: 'award',
        category: 'checkin',
        xpReward: definition.xpReward,
        goldRewardMg: definition.goldRewardMg,
        sortOrder: Object.values(CHECKIN_ACHIEVEMENTS).findIndex(a => a.slug === slug),
      },
    })

    await db.userAchievement.create({
      data: { userId, achievementId: created.id },
    })

    return { unlocked: true, xpReward: definition.xpReward, goldRewardMg: definition.goldRewardMg }
  }

  // Check if already earned
  const existing = await db.userAchievement.findUnique({
    where: {
      userId_achievementId: { userId, achievementId: achievement.id },
    },
  })

  if (!existing) {
    await db.userAchievement.create({
      data: { userId, achievementId: achievement.id },
    })
    return { unlocked: true, xpReward: achievement.xpReward, goldRewardMg: achievement.goldRewardMg }
  }

  return { unlocked: false }
}

// ── POST: Daily check-in ──
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    // Get or create gamification profile
    let gamification = await db.userGamification.findUnique({
      where: { userId },
    })

    if (!gamification) {
      gamification = await db.userGamification.create({
        data: { userId },
      })
    }

    // Check if already checked in today (Tehran timezone — simple date comparison)
    const tehranNow = new Date()
    const tehranOffset = 3.5 * 60 // +3:30 hours in minutes
    const utcNow = tehranNow.getTime() + tehranNow.getTimezoneOffset() * 60000
    const tehranTime = new Date(utcNow + tehranOffset * 60000)
    const todayStr = tehranTime.toISOString().split('T')[0]

    if (gamification.lastCheckInAt) {
      const lastCheckInTehran = new Date(
        gamification.lastCheckInAt.getTime() + gamification.lastCheckInAt.getTimezoneOffset() * 60000 + tehranOffset * 60000
      )
      const lastCheckInStr = lastCheckInTehran.toISOString().split('T')[0]

      if (lastCheckInStr === todayStr) {
        return NextResponse.json(
          { success: false, message: 'شما امروز قبلاً ثبت‌حضور کرده‌اید' },
          { status: 400 }
        )
      }
    }

    // Check if streak is broken (last check-in was not yesterday)
    let currentStreak = gamification.currentStreak + 1
    let longestStreak = gamification.longestStreak

    if (gamification.lastCheckInAt) {
      const lastCheckInTehran = new Date(
        gamification.lastCheckInAt.getTime() + gamification.lastCheckInAt.getTimezoneOffset() * 60000 + tehranOffset * 60000
      )
      const lastCheckInStr = lastCheckInTehran.toISOString().split('T')[0]

      const yesterday = new Date(tehranTime)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      // If last check-in was not yesterday, streak resets
      if (lastCheckInStr !== yesterdayStr) {
        currentStreak = 1
      }
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak
    }

    const dayNumber = gamification.checkInCount + 1
    const reward = getDayReward(dayNumber)
    const xpEarned = getCheckInXp(dayNumber)

    let totalXpEarned = xpEarned
    const unlockedAchievements: string[] = []
    let bonusGoldMg = 0

    // Create check-in record
    await db.checkIn.create({
      data: {
        userId,
        dayNumber,
        rewardType: reward.type,
        rewardValue: reward.value,
        xpEarned,
      },
    })

    // Apply reward
    if (reward.type === 'fiat') {
      await db.wallet.upsert({
        where: { userId },
        update: { balance: { increment: reward.value } },
        create: { userId, balance: reward.value },
      })
    } else if (reward.type === 'gold') {
      await db.goldWallet.upsert({
        where: { userId },
        update: { goldGrams: { increment: reward.value } },
        create: { userId, goldGrams: reward.value },
      })
      bonusGoldMg = reward.value
    } else if (reward.type === 'vip_trial') {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + Math.floor(reward.value))
      await db.vIPSubscription.upsert({
        where: { userId },
        update: {
          plan: 'silver',
          isActive: true,
          expiresAt,
        },
        create: {
          userId,
          plan: 'silver',
          expiresAt,
          isActive: true,
        },
      })
    }

    // Check auto-achievements
    const achievementChecks: Array<[string, boolean]> = [
      ['first_checkin', dayNumber >= 1],
      ['streak_7', currentStreak >= 7],
      ['streak_14', currentStreak >= 14],
      ['streak_30', currentStreak >= 30],
      ['streak_60', currentStreak >= 60],
      ['checkins_50', dayNumber >= 50],
      ['checkins_100', dayNumber >= 100],
    ]

    for (const [slug, condition] of achievementChecks) {
      if (condition && CHECKIN_ACHIEVEMENTS[slug]) {
        const result = await checkAndUnlockAchievement(userId, slug, CHECKIN_ACHIEVEMENTS[slug])
        if (result.unlocked) {
          totalXpEarned += result.xpReward
          bonusGoldMg += result.goldRewardMg
          unlockedAchievements.push(CHECKIN_ACHIEVEMENTS[slug].title)
        }
      }
    }

    // Update gamification profile
    const newXp = gamification.xp + totalXpEarned
    const newLevel = calculateLevel(newXp)

    await db.userGamification.update({
      where: { userId },
      data: {
        xp: newXp,
        level: newLevel,
        currentStreak,
        longestStreak,
        lastCheckInAt: new Date(),
        checkInCount: dayNumber,
      },
    })

    // Recalculate total badges
    const totalBadges = await db.userAchievement.count({ where: { userId } })
    await db.userGamification.update({
      where: { userId },
      data: { totalBadges },
    })

    return NextResponse.json({
      success: true,
      message: 'ثبت‌حضور با موفقیت انجام شد',
      checkIn: {
        dayNumber,
        currentStreak,
        longestStreak,
        reward: {
          type: reward.type,
          value: reward.value,
          label: reward.label,
        },
        xpEarned: totalXpEarned,
        newLevel,
        bonusGoldMg,
        unlockedAchievements,
      },
    })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت‌حضور' },
      { status: 500 }
    )
  }
}

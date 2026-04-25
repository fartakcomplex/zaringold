import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const DEMO_USER_ID = '1'

// ─── GET: Get creator referral info ───
export async function GET() {
  try {
    // Ensure creator profile exists
    let profile = await db.creatorProfile.findUnique({
      where: { userId: DEMO_USER_ID },
    })

    if (!profile) {
      profile = await db.creatorProfile.create({
        data: { userId: DEMO_USER_ID },
      })
    }

    // Get or create referral tracking
    let referral = await db.creatorReferralTracking.findFirst({
      where: { creatorId: profile.id },
    })

    if (!referral) {
      // Generate unique referral code
      const code = `CREATOR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      referral = await db.creatorReferralTracking.create({
        data: {
          creatorId: profile.id,
          refCode: code,
        },
      })
    }

    // Build referral link (using demo URL)
    const referralLink = `https://miligold.app/ref/${referral.refCode}`

    // Calculate potential earnings
    const conversionRate = referral.signups > 0 ? ((referral.purchases / referral.signups) * 100).toFixed(1) : '0'
    const clickToSignupRate = referral.clicks > 0 ? ((referral.signups / referral.clicks) * 100).toFixed(1) : '0'

    return NextResponse.json({
      success: true,
      data: {
        referralCode: referral.refCode,
        referralLink,
        stats: {
          clicks: referral.clicks,
          signups: referral.signups,
          purchases: referral.purchases,
          totalRewardMg: referral.totalRewardMg,
          conversionRate: parseFloat(conversionRate),
          clickToSignupRate: parseFloat(clickToSignupRate),
        },
        rewardTiers: {
          signup: 0.5, // 0.5mg per signup
          purchase: 2, // 2mg per purchase
          vipUpgrade: 5, // 5mg per VIP upgrade
        },
      },
    })
  } catch (error) {
    console.error('[Creator Referral GET]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch referral info' },
      { status: 500 }
    )
  }
}

// ─── POST: Track referral click or generate new code ───
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, refCode } = body

    // Ensure creator profile exists
    let profile = await db.creatorProfile.findUnique({
      where: { userId: DEMO_USER_ID },
    })

    if (!profile) {
      profile = await db.creatorProfile.create({
        data: { userId: DEMO_USER_ID },
      })
    }

    if (action === 'generate') {
      // Generate a new referral code
      const newCode = `CREATOR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

      // Check uniqueness
      const existing = await db.creatorReferralTracking.findUnique({
        where: { refCode: newCode },
      })

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Code collision, please try again' },
          { status: 409 }
        )
      }

      // Delete old referral tracking and create new
      await db.creatorReferralTracking.deleteMany({
        where: { creatorId: profile.id },
      })

      const referral = await db.creatorReferralTracking.create({
        data: {
          creatorId: profile.id,
          refCode: newCode,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'New referral code generated',
        data: {
          referralCode: referral.refCode,
          referralLink: `https://miligold.app/ref/${referral.refCode}`,
        },
      })
    }

    if (action === 'track-click') {
      // Track a click on the referral link
      if (!refCode) {
        return NextResponse.json(
          { success: false, error: 'refCode is required for tracking' },
          { status: 400 }
        )
      }

      // Find the referral tracking record (not necessarily the demo user's)
      const referral = await db.creatorReferralTracking.findUnique({
        where: { refCode },
      })

      if (!referral) {
        return NextResponse.json(
          { success: false, error: 'Referral code not found' },
          { status: 404 }
        )
      }

      // Increment click count
      const updated = await db.creatorReferralTracking.update({
        where: { refCode },
        data: {
          clicks: { increment: 1 },
        },
      })

      // Also update creator profile
      await db.creatorProfile.update({
        where: { id: referral.creatorId },
        data: {
          referralClicks: { increment: 1 },
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Click tracked',
        data: {
          clicks: updated.clicks,
        },
      })
    }

    if (action === 'track-signup') {
      // Track a signup from the referral link
      if (!refCode) {
        return NextResponse.json(
          { success: false, error: 'refCode is required for tracking' },
          { status: 400 }
        )
      }

      const referral = await db.creatorReferralTracking.findUnique({
        where: { refCode },
      })

      if (!referral) {
        return NextResponse.json(
          { success: false, error: 'Referral code not found' },
          { status: 404 }
        )
      }

      const rewardMg = 0.5 // 0.5mg per signup

      const updated = await db.creatorReferralTracking.update({
        where: { refCode },
        data: {
          signups: { increment: 1 },
          totalRewardMg: { increment: rewardMg },
        },
      })

      // Create reward record
      await db.creatorReward.create({
        data: {
          userId: referral.creatorId,
          goldMg: rewardMg,
          reason: `Referral signup bonus (${refCode})`,
          reasonFa: `\u062c\u0627\u06cc\u0632\u0647 \u062b\u0628\u062a\u200c\u0646\u0627\u0645 \u062f\u0639\u0648\u062a (${refCode})`,
          tier: 'bronze',
          isActive: true,
        },
      })

      // Update creator profile
      await db.creatorProfile.update({
        where: { id: referral.creatorId },
        data: {
          referralSignups: { increment: 1 },
          totalGoldEarned: { increment: rewardMg },
          score: { increment: 10 },
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Signup tracked and reward credited',
        data: {
          signups: updated.signups,
          rewardMg,
        },
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "generate", "track-click", or "track-signup".' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Creator Referral POST]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process referral action' },
      { status: 500 }
    )
  }
}

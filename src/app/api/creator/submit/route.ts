import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const DEMO_USER_ID = '1'

// Supported platforms
const VALID_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'telegram', 'x', 'aparat']

// Gold reward tiers (in mg)
const TIER_REWARDS: Record<string, { min: number; max: number }> = {
  bronze: { min: 1, max: 2 },
  silver: { min: 4, max: 5 },
  gold: { min: 10, max: 15 },
  diamond: { min: 25, max: 35 },
}

// ─── POST: Submit new content ───
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { platform, postUrl, screenshot, campaignId } = body

    // Validation
    if (!platform || !postUrl) {
      return NextResponse.json(
        { success: false, error: 'Platform and postUrl are required' },
        { status: 400 }
      )
    }

    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { success: false, error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}` },
        { status: 400 }
      )
    }

    // Ensure creator profile exists
    let profile = await db.creatorProfile.findUnique({
      where: { userId: DEMO_USER_ID },
    })

    if (!profile) {
      profile = await db.creatorProfile.create({
        data: { userId: DEMO_USER_ID },
      })
    }

    if (profile.isBanned) {
      return NextResponse.json(
        { success: false, error: 'Your creator account has been suspended', reason: profile.bannedReason },
        { status: 403 }
      )
    }

    // Check campaign constraints if campaign is specified
    let campaignRewardMg = 0
    let campaignTier = 'bronze'
    if (campaignId) {
      const campaign = await db.creatorCampaign.findUnique({
        where: { id: campaignId },
      })

      if (!campaign || !campaign.isActive) {
        return NextResponse.json(
          { success: false, error: 'Campaign not found or inactive' },
          { status: 400 }
        )
      }

      campaignRewardMg = campaign.rewardMg
      campaignTier = campaign.tier

      // Check submission limit
      const userCampaignSubmissions = await db.creatorSubmission.count({
        where: {
          userId: DEMO_USER_ID,
          campaignId,
        },
      })

      if (userCampaignSubmissions >= campaign.maxSubmissionsPerUser) {
        return NextResponse.json(
          { success: false, error: `You have reached the maximum submissions (${campaign.maxSubmissionsPerUser}) for this campaign` },
          { status: 400 }
        )
      }

      // Check if platform is allowed
      const allowedPlatforms = campaign.platforms.split(',').filter(Boolean)
      if (!allowedPlatforms.includes(platform)) {
        return NextResponse.json(
          { success: false, error: `Platform "${platform}" is not allowed for this campaign. Allowed: ${allowedPlatforms.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Simulate AI scoring (random 40-100)
    const aiScore = Math.floor(Math.random() * 61) + 40 // 40-100

    // Determine status based on AI score
    let status: string
    let isFlagged = false
    let flagReason: string | null = null

    if (aiScore >= 80) {
      status = 'approved' // Auto-approve high scores
    } else if (aiScore < 40) {
      status = 'flagged' // This doesn't exist in schema, use pending + flag
      status = 'pending'
      isFlagged = true
      flagReason = 'Low AI quality score — requires manual review'
    } else {
      status = 'ai_review'
    }

    // Simulate estimated views
    const estimatedViews = Math.floor(Math.random() * 5000) + 100

    // Calculate reward based on AI score and tier
    let rewardMg = 0
    if (aiScore >= 80 && campaignId) {
      const tierConfig = TIER_REWARDS[campaignTier] || TIER_REWARDS.bronze
      rewardMg = parseFloat((Math.random() * (tierConfig.max - tierConfig.min) + tierConfig.min).toFixed(2))
    } else if (aiScore >= 80) {
      // Default bronze reward for non-campaign submissions
      rewardMg = parseFloat((Math.random() * 1 + 1).toFixed(2)) // 1-2mg
    }

    // Create submission
    const submission = await db.creatorSubmission.create({
      data: {
        userId: DEMO_USER_ID,
        campaignId: campaignId || null,
        platform,
        postUrl,
        screenshot: screenshot || null,
        status,
        aiScore,
        rewardMg,
        estimatedViews,
        isFlagged,
        flagReason,
      },
      include: {
        campaign: {
          select: { id: true, title: true, tier: true, rewardMg: true },
        },
      },
    })

    // Create reward if auto-approved
    let reward = null
    if (status === 'approved' && rewardMg > 0) {
      reward = await db.creatorReward.create({
        data: {
          userId: DEMO_USER_ID,
          submissionId: submission.id,
          goldMg: rewardMg,
          reason: `Auto-approved content submission on ${platform}`,
          reasonFa: `\u062a\u0627\u06cc\u06cc\u062f \u062e\u0648\u062f\u06a9\u0627\u0631 \u0645\u062d\u062a\u0648\u0627 \u062f\u0631 ${platform}`,
          tier: campaignTier,
          isActive: true,
        },
      })

      // Update creator profile stats
      await db.creatorProfile.update({
        where: { userId: DEMO_USER_ID },
        data: {
          score: { increment: aiScore },
          totalGoldEarned: { increment: rewardMg },
          totalViews: { increment: estimatedViews },
          totalPosts: { increment: 1 },
          approvedPosts: { increment: 1 },
        },
      })
    } else {
      // Update profile for non-approved submissions
      await db.creatorProfile.update({
        where: { userId: DEMO_USER_ID },
        data: {
          score: { increment: Math.floor(aiScore * 0.3) }, // Partial score for pending
          totalViews: { increment: estimatedViews },
          totalPosts: { increment: 1 },
          pendingPosts: { increment: 1 },
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: aiScore >= 80
        ? 'Content submitted and auto-approved! Gold reward credited.'
        : aiScore < 40
          ? 'Content submitted but flagged for review due to low quality score.'
          : 'Content submitted and is under AI review.',
      data: {
        submission,
        reward,
        aiScore,
        autoApproved: aiScore >= 80,
        isFlagged,
        flagReason,
      },
    })
  } catch (error) {
    console.error('[Creator Submit POST]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit content' },
      { status: 500 }
    )
  }
}

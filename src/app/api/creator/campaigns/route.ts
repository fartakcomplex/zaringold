import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// ─── GET: Fetch all active campaigns ───
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tier = searchParams.get('tier') || undefined
    const platform = searchParams.get('platform') || undefined

    const where: Record<string, unknown> = { isActive: true }

    if (tier) {
      where.tier = tier
    }

    if (platform) {
      // Check if platform is in the comma-separated platforms string
      where.platforms = { contains: platform }
    }

    const campaigns = await db.creatorCampaign.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    })

    // Count user submissions per campaign for this demo user
    const userSubmissions = await db.creatorSubmission.groupBy({
      by: ['campaignId'],
      where: { userId: '1', campaignId: { not: null } },
      _count: { id: true },
    })
    const userSubmissionMap: Record<string, number> = {}
    for (const us of userSubmissions) {
      if (us.campaignId) userSubmissionMap[us.campaignId] = us._count.id
    }

    const enrichedCampaigns = campaigns.map((c) => ({
      ...c,
      submissionCount: c._count.submissions,
      userSubmissionCount: userSubmissionMap[c.id] || 0,
      remainingSubmissions: Math.max(0, c.maxSubmissionsPerUser - (userSubmissionMap[c.id] || 0)),
      isExpired: c.endDate ? new Date(c.endDate) < new Date() : false,
      isUpcoming: c.startDate ? new Date(c.startDate) > new Date() : false,
      platforms: c.platforms.split(',').filter(Boolean),
    }))

    return NextResponse.json({
      success: true,
      data: enrichedCampaigns,
    })
  } catch (error) {
    console.error('[Creator Campaigns GET]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

// ─── POST: Seed demo campaigns ───
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // Only allow seeding for demo purposes
    if (action !== 'seed') {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "seed" to create demo campaigns.' },
        { status: 400 }
      )
    }

    // Check if campaigns already exist
    const existingCount = await db.creatorCampaign.count()

    if (existingCount > 0) {
      return NextResponse.json({
        success: true,
        message: 'Campaigns already exist',
        count: existingCount,
      })
    }

    const demoCampaigns = [
      {
        title: 'Gold Savings Challenge',
        titleFa: '\u0686\u0627\u0644\u0634 \u067e\u0631\u062f\u0627\u062e\u062a \u0627\u0648\u0631',
        description: 'Create a 15-60s video about your gold saving journey with Mili Gold',
        descriptionFa: '\u06cc\u06a9 \u0648\u06cc\u062f\u06cc\u0648 15 \u062a\u0627 60 \u062b\u0627\u0646\u06cc\u0647 \u0627\u06cc \u062f\u0631\u0628\u0627\u0631\u0647 \u0633\u0641\u0631 \u067e\u0631\u062f\u0627\u062e\u062a \u0627\u0648\u0631 \u062e\u0648\u062f \u0628\u0627 \u0645\u06cc\u0644\u06cc \u06af\u0644\u062f \u0628\u0633\u0627\u0632\u06cc\u062f',
        rewardMg: 2,
        tier: 'bronze',
        rules: 'Video must be 15-60s, show Mili Gold app, include hashtag #MiliGold',
        rulesFa: '\u0648\u06cc\u062f\u06cc\u0648 \u0628\u0627\u06cc\u062f 15-60 \u062b\u0627\u0646\u06cc\u0647 \u0628\u0627\u0634\u062f\u060c \u0627\u067e\u0644\u06cc\u06a9\u06cc\u0634\u0646 \u0645\u06cc\u0644\u06cc \u06af\u0644\u062f \u0646\u0645\u0627\u06cc\u0627\u0646 \u062f\u0627\u062f\u0647 \u0634\u0648\u062f',
        platforms: 'instagram,tiktok,aparat',
        minViews: 100,
        maxSubmissionsPerUser: 5,
        sortOrder: 1,
      },
      {
        title: 'Price Prediction Review',
        titleFa: '\u0628\u0631\u0631\u0633\u06cc \u067e\u06cc\u0634\u200c\u0628\u06cc\u0646\u06cc \u0642\u06cc\u0645\u062a',
        description: 'Share your experience with Mili Gold price prediction feature',
        descriptionFa: '\u062a\u062c\u0631\u0628\u0647 \u062e\u0648\u062f \u0631\u0627 \u0627\u0632 \u0648\u06cc\u0698\u06af\u06cc \u067e\u06cc\u0634\u200c\u0628\u06cc\u0646\u06cc \u0642\u06cc\u0645\u062a \u0645\u06cc\u0644\u06cc \u06af\u0644\u062f \u0628\u0647 \u0627\u0634\u062a\u0631\u0627\u06a9 \u0628\u06af\u0630\u0627\u0631\u06cc\u062f',
        rewardMg: 5,
        tier: 'silver',
        rules: 'Must show prediction game screen, include results',
        rulesFa: '\u0628\u0627\u06cc\u062f \u0635\u0641\u062d\u0647 \u0628\u0627\u0632\u06cc \u067e\u06cc\u0634\u200c\u0628\u06cc\u0646\u06cc \u0646\u0645\u0627\u06cc\u0627\u0646 \u062f\u0627\u062f\u0647 \u0634\u0648\u062f',
        platforms: 'instagram,youtube,tiktok,x',
        minViews: 500,
        maxSubmissionsPerUser: 3,
        sortOrder: 2,
      },
      {
        title: 'VIP Unboxing Experience',
        titleFa: '\u062a\u062c\u0631\u0628\u0647 \u0627\u0646\u0628\u0627\u063a \u0648\u06cc\u0698\u0647',
        description: 'Showcase the VIP membership benefits and exclusive features',
        descriptionFa: '\u0645\u0632\u0627\u06cc\u0627\u06cc \u0639\u0636\u0648\u06cc\u062a \u0648\u06cc\u0698\u0647 \u0648 \u0648\u06cc\u0698\u06af\u06cc\u200c\u0647\u0627\u06cc \u0627\u062e\u062a\u0635\u0627\u0635\u06cc \u0631\u0627 \u0646\u0645\u0627\u06cc\u0634 \u062f\u0647\u06cc\u062f',
        rewardMg: 15,
        tier: 'gold',
        rules: 'Must be a VIP member, show at least 3 VIP features, high quality video',
        rulesFa: '\u0628\u0627\u06cc\u062f \u0639\u0636\u0648 VIP \u0628\u0627\u0634\u06cc\u062f\u060c \u062d\u062f\u0627\u0642\u0644 3 \u0648\u06cc\u0698\u06af\u06cc VIP \u0631\u0627 \u0646\u0645\u0627\u06cc\u0634 \u062f\u0647\u06cc\u062f',
        platforms: 'instagram,youtube,tiktok',
        minViews: 2000,
        maxSubmissionsPerUser: 2,
        sortOrder: 3,
      },
      {
        title: 'Mili Gold Documentary',
        titleFa: '\u0645\u0633\u062a\u0646\u062f \u0645\u06cc\u0644\u06cc \u06af\u0644\u062f',
        description: 'Create a professional documentary-style video about digital gold investment in Iran',
        descriptionFa: '\u06cc\u06a9 \u0648\u06cc\u062f\u06cc\u0648 \u0645\u0633\u062a\u0646\u062f\u06cc \u062d\u0631\u0641\u0647\u200c\u0627\u06cc \u062f\u0631\u0628\u0627\u0631\u0647 \u0633\u0631\u0645\u0627\u06cc\u0647\u200c\u06af\u0630\u0627\u0631\u06cc \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644 \u0627\u0648\u0631 \u062f\u0631 \u0627\u06cc\u0631\u0627\u0646 \u0628\u0633\u0627\u0632\u06cc\u062f',
        rewardMg: 30,
        tier: 'diamond',
        rules: 'Min 3 minutes, professional quality, interview-style or narrative, must mention Mili Gold',
        rulesFa: '\u062d\u062f\u0627\u0642\u0644 3 \u062f\u0642\u06cc\u0642\u0647\u060c \u06a9\u06cc\u0641\u06cc\u062a \u062d\u0631\u0641\u0647\u200c\u0627\u06cc',
        platforms: 'youtube,instagram,aparat',
        minViews: 10000,
        maxSubmissionsPerUser: 1,
        sortOrder: 4,
      },
      {
        title: 'Referral Sprint Challenge',
        titleFa: '\u0686\u0627\u0644\u0634 \u062f\u0627\u0646\u0644\u0648\u062f \u062f\u0639\u0648\u062a \u0627\u0632 \u062f\u0648\u0633\u062a\u0627\u0646',
        description: 'Invite the most friends in a week and win bonus gold rewards',
        descriptionFa: '\u062f\u0631 \u06cc\u06a9 \u0647\u0641\u062a\u0647 \u0628\u06cc\u0634\u062a\u0631\u06cc\u0646 \u062f\u0639\u0648\u062a \u0631\u0627 \u0627\u0632 \u062f\u0648\u0633\u062a\u0627\u0646\u062a\u0627\u0646 \u0628\u06a9\u0646\u06cc\u062f \u0648 \u062c\u0627\u06cc\u0632\u0647 \u0628\u0628\u0631\u06cc\u062f',
        rewardMg: 10,
        tier: 'gold',
        rules: 'Minimum 5 referrals to qualify, tracked via referral code',
        rulesFa: '\u062d\u062f\u0627\u0642\u0644 5 \u062f\u0639\u0648\u062a \u0628\u0631\u0627\u06cc \u0627\u0647\u0644\u06cc\u062a',
        platforms: 'telegram,instagram,x',
        minViews: 0,
        maxSubmissionsPerUser: 10,
        sortOrder: 5,
      },
      {
        title: 'Daily Check-in Streak Hero',
        titleFa: '\u0642\u0647\u0631\u0645\u0627\u0646 \u0631\u06a9\u0648\u0631\u062f \u0631\u0648\u0632\u0627\u0646\u0647',
        description: 'Maintain a 30-day check-in streak and share your achievement',
        descriptionFa: '\u06cc\u06a9 \u0631\u06a9\u0648\u0631\u062f 30 \u0631\u0648\u0632\u0647 \u062d\u0641\u0638 \u06a9\u0646\u06cc\u062f \u0648 \u062f\u0633\u062a\u0627\u0648\u0631\u062f\u062a\u0627\u0646 \u0631\u0627 \u0628\u0647 \u0627\u0634\u062a\u0631\u0627\u06a9 \u0628\u06af\u0630\u0627\u0631\u06cc\u062f',
        rewardMg: 4,
        tier: 'silver',
        rules: 'Must show 30-day streak in the app, share achievement card',
        rulesFa: '\u0628\u0627\u06cc\u062f \u0631\u06a9\u0648\u0631\u062f 30 \u0631\u0648\u0632\u0647 \u062f\u0631 \u0627\u067e\u0644\u06cc\u06a9\u06cc\u0634\u0646 \u0646\u0645\u0627\u06cc\u0627\u0646 \u062f\u0627\u062f\u0647 \u0634\u0648\u062f',
        platforms: 'instagram,tiktok,x,telegram',
        minViews: 200,
        maxSubmissionsPerUser: 1,
        sortOrder: 6,
      },
    ]

    const created = await db.creatorCampaign.createMany({
      data: demoCampaigns,
    })

    return NextResponse.json({
      success: true,
      message: 'Demo campaigns seeded successfully',
      count: created.count,
    })
  } catch (error) {
    console.error('[Creator Campaigns POST]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to seed campaigns' },
      { status: 500 }
    )
  }
}

import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Demo user ID (no real auth in this demo)
const DEMO_USER_ID = '1'

// ─── GET: Fetch creator profile (auto-create if not exists) ───
export async function GET() {
  try {
    let profile = await db.creatorProfile.findUnique({
      where: { userId: DEMO_USER_ID },
      include: {
        user: {
          select: { id: true, fullName: true, phone: true, avatar: true },
        },
      },
    })

    // Auto-create if not exists
    if (!profile) {
      profile = await db.creatorProfile.create({
        data: {
          userId: DEMO_USER_ID,
          level: 'beginner',
          score: 0,
          totalGoldEarned: 0,
          totalViews: 0,
          totalPosts: 0,
        },
        include: {
          user: {
            select: { id: true, fullName: true, phone: true, avatar: true },
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        userId: profile.userId,
        user: profile.user,
        level: profile.level,
        score: profile.score,
        totalGoldEarned: profile.totalGoldEarned,
        totalViews: profile.totalViews,
        totalPosts: profile.totalPosts,
        approvedPosts: profile.approvedPosts,
        rejectedPosts: profile.rejectedPosts,
        pendingPosts: profile.pendingPosts,
        rank: profile.rank,
        referralClicks: profile.referralClicks,
        referralSignups: profile.referralSignups,
        referralPurchases: profile.referralPurchases,
        isBanned: profile.isBanned,
        bannedReason: profile.bannedReason,
        bio: profile.bio,
        socialLinks: JSON.parse(profile.socialLinks || '{}'),
        joinedAt: profile.joinedAt,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    })
  } catch (error) {
    console.error('[Creator Profile GET]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch creator profile' },
      { status: 500 }
    )
  }
}

// ─── PUT: Update creator profile ───
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { bio, socialLinks } = body

    // Ensure profile exists
    let profile = await db.creatorProfile.findUnique({
      where: { userId: DEMO_USER_ID },
    })

    if (!profile) {
      profile = await db.creatorProfile.create({
        data: { userId: DEMO_USER_ID },
      })
    }

    // Update fields
    const updatedProfile = await db.creatorProfile.update({
      where: { userId: DEMO_USER_ID },
      data: {
        ...(bio !== undefined && { bio }),
        ...(socialLinks !== undefined && {
          socialLinks: typeof socialLinks === 'string' ? socialLinks : JSON.stringify(socialLinks),
        }),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updatedProfile,
        socialLinks: JSON.parse(updatedProfile.socialLinks || '{}'),
      },
    })
  } catch (error) {
    console.error('[Creator Profile PUT]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update creator profile' },
      { status: 500 }
    )
  }
}

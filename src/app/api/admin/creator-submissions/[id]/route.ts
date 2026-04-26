import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Gold reward tiers
const TIER_REWARDS: Record<string, { min: number; max: number }> = {
  bronze: { min: 1, max: 2 },
  silver: { min: 4, max: 5 },
  gold: { min: 10, max: 15 },
  diamond: { min: 25, max: 35 },
}

// ─── PUT: Approve or reject a submission (admin action) ───
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, adminNote, bonusMg } = body

    // Validate action
    if (!['approve', 'reject', 'request_revision', 'flag', 'unflag'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use: approve, reject, request_revision, flag, unflag' },
        { status: 400 }
      )
    }

    // Find submission
    const submission = await db.creatorSubmission.findUnique({
      where: { id },
      include: {
        campaign: {
          select: { id: true, title: true, tier: true, rewardMg: true },
        },
      },
    })

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Handle flag/unflag actions
    if (action === 'flag') {
      const updated = await db.creatorSubmission.update({
        where: { id },
        data: {
          isFlagged: true,
          flagReason: adminNote || 'Flagged by admin',
          status: 'pending',
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Submission flagged for review',
        data: updated,
      })
    }

    if (action === 'unflag') {
      const updated = await db.creatorSubmission.update({
        where: { id },
        data: {
          isFlagged: false,
          flagReason: null,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Submission unflagged',
        data: updated,
      })
    }

    // Handle approve/reject/request_revision
    let updatedSubmission

    if (action === 'approve') {
      // Calculate reward
      const campaignTier = submission.campaign?.tier || 'bronze'
      const tierConfig = TIER_REWARDS[campaignTier] || TIER_REWARDS.bronze
      const baseReward = parseFloat(
        (Math.random() * (tierConfig.max - tierConfig.min) + tierConfig.min).toFixed(2)
      )
      const adminBonus = parseFloat(bonusMg || '0')
      const totalReward = parseFloat((baseReward + adminBonus).toFixed(2))

      // Update submission
      updatedSubmission = await db.creatorSubmission.update({
        where: { id },
        data: {
          status: 'approved',
          adminNote: adminNote || 'Approved by admin',
          adminBonusMg: adminBonus,
          rewardMg: totalReward,
          reviewedBy: 'admin',
          reviewedAt: new Date(),
          isFlagged: false,
          flagReason: null,
        },
      })

      // Create reward
      await db.creatorReward.create({
        data: {
          userId: submission.userId,
          submissionId: submission.id,
          goldMg: totalReward,
          reason: adminNote || `Content approved on ${submission.platform} (campaign: ${submission.campaign?.title || 'General'})`,
          reasonFa: `محتوا تایید شد در ${submission.platform}`,
          tier: campaignTier,
          isActive: true,
        },
      })

      // Update creator profile stats
      const profile = await db.creatorProfile.findUnique({
        where: { userId: submission.userId },
      })

      if (profile) {
        const scoreIncrement = Math.floor(submission.aiScore * 0.7) // Admin approved, give 70% of AI score
        await db.creatorProfile.update({
          where: { userId: submission.userId },
          data: {
            score: { increment: scoreIncrement },
            totalGoldEarned: { increment: totalReward },
            totalViews: { increment: submission.estimatedViews },
            approvedPosts: { increment: 1 },
            pendingPosts: { decrement: 1 },
          },
        })
      }
    } else if (action === 'reject') {
      updatedSubmission = await db.creatorSubmission.update({
        where: { id },
        data: {
          status: 'rejected',
          adminNote: adminNote || 'Rejected by admin',
          reviewedBy: 'admin',
          reviewedAt: new Date(),
        },
      })

      // Update creator profile
      const profile = await db.creatorProfile.findUnique({
        where: { userId: submission.userId },
      })

      if (profile) {
        await db.creatorProfile.update({
          where: { userId: submission.userId },
          data: {
            rejectedPosts: { increment: 1 },
            pendingPosts: { decrement: 1 },
          },
        })
      }
    } else if (action === 'request_revision') {
      updatedSubmission = await db.creatorSubmission.update({
        where: { id },
        data: {
          status: 'revision',
          adminNote: adminNote || 'Revision requested by admin',
          reviewedBy: 'admin',
          reviewedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Submission ${action}d successfully`,
      data: updatedSubmission,
    })
  } catch (error) {
    console.error('[Admin Creator Submission Action PUT]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process submission action' },
      { status: 500 }
    )
  }
}

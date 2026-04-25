import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const DEMO_USER_ID = '1'

// ─── GET: Get single submission details ───
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const submission = await db.creatorSubmission.findFirst({
      where: {
        id,
        userId: DEMO_USER_ID,
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            titleFa: true,
            description: true,
            descriptionFa: true,
            tier: true,
            rewardMg: true,
            platforms: true,
            rules: true,
            rulesFa: true,
          },
        },
        rewards: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Parse platforms if campaign exists
    const enrichedSubmission = {
      ...submission,
      campaign: submission.campaign
        ? {
            ...submission.campaign,
            platforms: submission.campaign.platforms.split(',').filter(Boolean),
          }
        : null,
    }

    // Get AI feedback (simulated)
    const feedback = getAIFeedback(submission.aiScore, submission.status)

    return NextResponse.json({
      success: true,
      data: {
        ...enrichedSubmission,
        aiFeedback: feedback,
      },
    })
  } catch (error) {
    console.error('[Creator Submission Detail GET]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submission' },
      { status: 500 }
    )
  }
}

// Simulated AI feedback generator
function getAIFeedback(score: number, status: string) {
  if (status === 'approved') {
    if (score >= 95) {
      return {
        overall: 'Excellent',
        details: 'Outstanding content quality. High engagement potential detected. Perfect brand integration.',
        tips: ['Maintain this quality level', 'Consider applying for Gold tier campaigns'],
      }
    }
    return {
      overall: 'Good',
      details: 'Content meets quality standards. Good visibility and brand representation.',
      tips: ['Add more engagement hooks', 'Consider longer format for higher rewards'],
    }
  }

  if (status === 'rejected') {
    return {
      overall: 'Needs Improvement',
      details: 'Content does not meet minimum quality requirements. Please review guidelines.',
      tips: ['Ensure Mili Gold branding is visible', 'Check content guidelines', 'Improve video quality'],
    }
  }

  if (status === 'flagged' || (status === 'pending' && score < 40)) {
    return {
      overall: 'Low Quality',
      details: 'AI detected potential issues with content quality or authenticity.',
      tips: ['Improve lighting and framing', 'Ensure app UI is clearly visible', 'Add verbal mention of Mili Gold'],
    }
  }

  return {
    overall: 'Under Review',
    details: 'Your content is currently being reviewed by our AI system.',
    tips: ['Usually resolves within a few minutes', 'High-quality content is auto-approved'],
  }
}

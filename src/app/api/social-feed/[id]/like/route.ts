import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST: like a social post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const post = await db.socialPost.findUnique({ where: { id } })
    if (!post) {
      return NextResponse.json(
        { success: false, message: 'پست یافت نشد' },
        { status: 404 }
      )
    }

    const updatedPost = await db.socialPost.update({
      where: { id },
      data: {
        likes: { increment: 1 },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'لایک ثبت شد',
      likes: updatedPost.likes,
    })
  } catch (error) {
    console.error('Like post error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت لایک' },
      { status: 500 }
    )
  }
}

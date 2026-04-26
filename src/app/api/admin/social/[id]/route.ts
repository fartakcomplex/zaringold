import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ------------------------------------------------------------------ */
/*  DELETE /api/admin/social/[id] — Delete a post                     */
/* ------------------------------------------------------------------ */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.socialPost.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, phone: true } },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'پست پیدا نشد' },
        { status: 404 }
      )
    }

    await db.socialPost.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'پست با موفقیت حذف شد',
      data: {
        deletedPost: {
          id: existing.id,
          author: existing.isAnonymous ? 'ناشناس' : existing.user.fullName,
          content: existing.content.substring(0, 50) + '...',
        },
      },
    })
  } catch (error) {
    console.error('Admin delete social post error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف پست' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/security/auth-guard'

// GET: list social feed posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const postType = searchParams.get('postType')
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50)
    const cursor = searchParams.get('cursor')

    const where: Record<string, unknown> = {}
    if (postType && ['trade', 'milestone', 'tip', 'question'].includes(postType)) {
      where.postType = postType
    }

    const posts = await db.socialPost.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? {
        skip: 1,
        cursor: { id: cursor },
      } : {}),
    })

    // Anonymize users if post is anonymous
    const sanitizedPosts = posts.map((post) => ({
      ...post,
      user: post.isAnonymous
        ? { id: 'anonymous', fullName: 'ناشناس', phone: null, avatar: null }
        : post.user,
    }))

    const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null

    return NextResponse.json({
      success: true,
      posts: sanitizedPosts,
      nextCursor,
      totalPosts: sanitizedPosts.length,
    })
  } catch (error) {
    console.error('Get social feed error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت پست‌های شبکه اجتماعی' },
      { status: 500 }
    )
  }
}

// POST: create a new social post
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 })
    }

    const { content, postType, isAnonymous } = await request.json()
    const userId = auth.user.id

    if (!content) {
      return NextResponse.json(
        { success: false, message: 'محتوای پست الزامی است' },
        { status: 400 }
      )
    }

    if (content.length > 500) {
      return NextResponse.json(
        { success: false, message: 'متن پست نباید بیشتر از ۵۰۰ کاراکتر باشد' },
        { status: 400 }
      )
    }

    // Validate post type
    const validTypes = ['trade', 'milestone', 'tip', 'question']
    const selectedType = postType && validTypes.includes(postType) ? postType : 'trade'

    // Check user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    const post = await db.socialPost.create({
      data: {
        userId,
        content,
        postType: selectedType,
        isAnonymous: typeof isAnonymous === 'boolean' ? isAnonymous : true,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            avatar: true,
          },
        },
      },
    })

    // Anonymize if needed
    const sanitizedPost = {
      ...post,
      user: post.isAnonymous
        ? { id: 'anonymous', fullName: 'ناشناس', phone: null, avatar: null }
        : post.user,
    }

    return NextResponse.json({
      success: true,
      message: 'پست با موفقیت منتشر شد',
      post: sanitizedPost,
    })
  } catch (error) {
    console.error('Create social post error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در انتشار پست' },
      { status: 500 }
    )
  }
}

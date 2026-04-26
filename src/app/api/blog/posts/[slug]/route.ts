import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ------------------------------------------------------------------ */
/*  GET /api/blog/posts/[slug] — Get published post by slug (public)  */
/* ------------------------------------------------------------------ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const post = await db.blogPost.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true, color: true } },
        author: { select: { id: true, fullName: true } },
        tags: {
          include: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    })

    if (!post || post.status !== 'published') {
      return NextResponse.json(
        { success: false, message: 'مقاله یافت نشد' },
        { status: 404 }
      )
    }

    // Increment view count
    await db.blogPost.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    })

    // Find next and previous published posts
    const currentPublishedAt = post.publishedAt!

    const [nextPost, prevPost] = await Promise.all([
      db.blogPost.findFirst({
        where: {
          status: 'published',
          publishedAt: { gt: currentPublishedAt },
        },
        select: { slug: true, title: true },
        orderBy: { publishedAt: 'asc' },
      }),
      db.blogPost.findFirst({
        where: {
          status: 'published',
          publishedAt: { lt: currentPublishedAt },
        },
        select: { slug: true, title: true },
        orderBy: { publishedAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        viewCount: post.viewCount + 1,
      },
      nextPost: nextPost ? { slug: nextPost.slug, title: nextPost.title } : null,
      prevPost: prevPost ? { slug: prevPost.slug, title: prevPost.title } : null,
    })
  } catch (error) {
    console.error('Public get blog post error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت مقاله' },
      { status: 500 }
    )
  }
}

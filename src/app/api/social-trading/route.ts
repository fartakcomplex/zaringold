import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/* ═══════════════════════════════════════════════════════════════ */
/*  GET /api/social-trading — List top traders or user profile   */
/* ═══════════════════════════════════════════════════════════════ */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // If userId is provided, return user's own trader profile + followed traders
    if (userId) {
      const traderProfile = await prisma.socialTrader.findUnique({
        where: { userId },
        include: {
          user: {
            select: { id: true, fullName: true, avatar: true, phone: true },
          },
          trades: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          followers: {
            include: {
              trader: {
                include: {
                  user: {
                    select: { id: true, fullName: true, avatar: true },
                  },
                },
              },
            },
          },
        },
      });

      return NextResponse.json({
        trader: traderProfile,
      });
    }

    // Otherwise, return top traders sorted by rank and winRate
    const topTraders = await prisma.socialTrader.findMany({
      where: { isPublic: true },
      orderBy: [
        { rank: 'asc' },
        { winRate: 'desc' },
      ],
      include: {
        user: {
          select: { id: true, fullName: true, avatar: true },
        },
      },
      take: 50,
    });

    return NextResponse.json({
      traders: topTraders,
    });
  } catch (error) {
    console.error('[GET /api/social-trading] Error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات معامله‌گران اجتماعی' },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════ */
/*  POST /api/social-trading — Follow / Unfollow a trader        */
/* ═══════════════════════════════════════════════════════════════ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { followerId, traderId, isCopyTrading } = body;

    if (!followerId || !traderId) {
      return NextResponse.json(
        { error: 'followerId و traderId الزامی هستند' },
        { status: 400 }
      );
    }

    if (followerId === traderId) {
      return NextResponse.json(
        { error: 'نمی‌توانید خود را دنبال کنید' },
        { status: 400 }
      );
    }

    // Check if trader profile exists
    const trader = await prisma.socialTrader.findUnique({
      where: { id: traderId },
    });

    if (!trader) {
      return NextResponse.json(
        { error: 'معامله‌گر مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    // Check if already following
    const existing = await prisma.socialFollow.findUnique({
      where: {
        followerId_traderId: {
          followerId,
          traderId,
        },
      },
    });

    if (existing) {
      // Unfollow: delete the follow record and decrement follower count
      await prisma.socialFollow.delete({
        where: {
          followerId_traderId: {
            followerId,
            traderId,
          },
        },
      });

      await prisma.socialTrader.update({
        where: { id: traderId },
        data: {
          totalFollowers: { decrement: 1 },
        },
      });

      return NextResponse.json({
        success: true,
        action: 'unfollowed',
      });
    }

    // Follow: create the follow record and increment follower count
    await prisma.socialFollow.create({
      data: {
        followerId,
        traderId,
        isCopyTrading: isCopyTrading ?? false,
      },
    });

    await prisma.socialTrader.update({
      where: { id: traderId },
      data: {
        totalFollowers: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      action: 'followed',
    });
  } catch (error) {
    console.error('[POST /api/social-trading] Error:', error);
    return NextResponse.json(
      { error: 'خطا در دنبال/لغو دنبال کردن معامله‌گر' },
      { status: 500 }
    );
  }
}

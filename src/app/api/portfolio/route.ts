import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/* ═══════════════════════════════════════════════════════════════ */
/*  GET /api/portfolio — List user's custom portfolios             */
/* ═══════════════════════════════════════════════════════════════ */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId الزامی است' },
        { status: 400 }
      );
    }

    const portfolios = await prisma.customPortfolio.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      portfolios,
    });
  } catch (error) {
    console.error('[GET /api/portfolio] Error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست پرتفوی‌ها' },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════ */
/*  POST /api/portfolio — Create a new custom portfolio          */
/* ═══════════════════════════════════════════════════════════════ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, items } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'userId و name الزامی هستند' },
        { status: 400 }
      );
    }

    // Validate items array if provided
    if (items && !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'items باید آرایه‌ای باشد' },
        { status: 400 }
      );
    }

    // Check if user has any existing portfolios (if not, make this the default)
    const existingCount = await prisma.customPortfolio.count({
      where: { userId },
    });

    const isDefault = existingCount === 0;

    // Create portfolio with items in a transaction
    const portfolio = await prisma.customPortfolio.create({
      data: {
        userId,
        name,
        isDefault,
        description: body.description ?? '',
        items: items
          ? {
              create: items.map(
                (item: {
                  assetType: string;
                  assetName: string;
                  weight: number;
                  quantity: number;
                  buyPrice: number;
                }) => ({
                  assetType: item.assetType ?? 'gold',
                  assetName: item.assetName,
                  weight: item.weight ?? 0,
                  quantity: item.quantity ?? 0,
                  buyPrice: item.buyPrice ?? 0,
                })
              ),
            }
          : undefined,
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      portfolios: [portfolio],
    });
  } catch (error) {
    console.error('[POST /api/portfolio] Error:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد پرتفوی جدید' },
      { status: 500 }
    );
  }
}

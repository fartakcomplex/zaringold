import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/** Generate a random 8-character backup code */
function generateBackupCode(): string {
  const bytes = crypto.randomBytes(4);
  return bytes.toString('hex').toUpperCase();
}

/* ═══════════════════════════════════════════════════════════════ */
/*  GET /api/backup — Generate or retrieve backup codes for user   */
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

    // Check if user already has backup codes
    let codes = await prisma.backupCode.findMany({
      where: { userId },
      select: {
        code: true,
        usedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // If no codes exist, generate 5 new random codes
    if (codes.length === 0) {
      const newCodes: { code: string }[] = [];
      for (let i = 0; i < 5; i++) {
        newCodes.push({ code: generateBackupCode() });
      }

      await prisma.backupCode.createMany({
        data: newCodes.map((c) => ({ userId, code: c.code })),
      });

      codes = await prisma.backupCode.findMany({
        where: { userId },
        select: {
          code: true,
          usedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    // Mask used codes partially for security
    const maskedCodes = codes.map((c) => ({
      code: c.usedAt ? `${c.code.slice(0, 2)}****${c.code.slice(-2)}` : c.code,
      isUsed: c.usedAt !== null,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({
      codes: maskedCodes,
    });
  } catch (error) {
    console.error('[GET /api/backup] Error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت کدهای بازیابی' },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════ */
/*  POST /api/backup — Verify a backup code                        */
/* ═══════════════════════════════════════════════════════════════ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, code } = body;

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'userId و code الزامی هستند' },
        { status: 400 }
      );
    }

    // Find the backup code (case-insensitive)
    const backupCode = await prisma.backupCode.findFirst({
      where: {
        userId,
        code: code.toUpperCase(),
      },
    });

    if (!backupCode) {
      return NextResponse.json({
        valid: false,
        error: 'کد بازیابی نامعتبر است',
      });
    }

    if (backupCode.usedAt) {
      return NextResponse.json({
        valid: false,
        error: 'این کد قبلاً استفاده شده است',
      });
    }

    // Mark code as used
    await prisma.backupCode.update({
      where: { id: backupCode.id },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({
      valid: true,
    });
  } catch (error) {
    console.error('[POST /api/backup] Error:', error);
    return NextResponse.json(
      { error: 'خطا در تأیید کد بازیابی' },
      { status: 500 }
    );
  }
}

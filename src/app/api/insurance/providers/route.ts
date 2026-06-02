import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const providers = await db.insuranceProvider.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ providers, success: true });
  } catch (error) {
    console.error('[Insurance Providers API]', error);
    return NextResponse.json({ providers: [], success: true }, { status: 200 });
  }
}

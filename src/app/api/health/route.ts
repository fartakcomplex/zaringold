import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/health
 * Simple health check for admin panel server status indicator
 */
export async function GET() {
  try {
    // Quick DB connectivity check
    await db.user.count().catch(() => 0)

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    })
  } catch {
    return NextResponse.json(
      { status: 'error', timestamp: new Date().toISOString() },
      { status: 503 }
    )
  }
}

export async function HEAD() {
  try {
    await db.user.count().catch(() => 0)
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}

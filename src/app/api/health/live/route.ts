import { NextResponse } from 'next/server';

/**
 * GET /api/health/live — Liveness Probe
 * Returns 200 OK if the process is running.
 * Used by orchestrators (Kubernetes, Docker, etc.) to know the process is alive.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'alive',
      timestamp: new Date().toISOString(),
      pid: typeof process !== 'undefined' ? process.pid : null,
      uptime: typeof process !== 'undefined' ? process.uptime() : null,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    }
  );
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

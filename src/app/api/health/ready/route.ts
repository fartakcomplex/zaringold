import { NextResponse } from 'next/server';
import { healthSystem } from '@/lib/observability/health';

/**
 * GET /api/health/ready — Readiness Probe
 * Checks all dependencies and returns detailed health status.
 * Returns 200 when all critical checks pass, 503 when any critical check fails.
 */
export async function GET() {
  try {
    const health = await healthSystem.runAllChecks();

    const statusCode = health.status === 'error' ? 503
      : health.status === 'degraded' ? 200
      : 200;

    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        checks: [],
        summary: { total: 0, healthy: 0, degraded: 0, unhealthy: 0 },
        error: error instanceof Error ? error.message : 'Health check system failed',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

export async function HEAD() {
  try {
    const health = await healthSystem.runCriticalChecks();
    const statusCode = health.status === 'error' ? 503 : 200;
    return new NextResponse(null, { status: statusCode });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}

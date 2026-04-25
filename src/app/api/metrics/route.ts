import { NextResponse } from 'next/server';
import { metrics } from '@/lib/observability/metrics';

/**
 * GET /api/metrics — Prometheus Metrics Endpoint
 * Exposes all registered metrics in Prometheus text format.
 */
export async function GET() {
  try {
    const output = metrics.serialize();

    return new NextResponse(output, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to collect metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

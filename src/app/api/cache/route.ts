/* ═══════════════════════════════════════════════════════════════════════════
 *  /api/cache — Cache Management API
 *  GET  /api/cache/stats     — Cache statistics (hit rates, sizes, health)
 *  POST /api/cache/warmup    — Trigger cache warming
 *  POST /api/cache/invalidate — Invalidate cache by pattern or tag
 *  DELETE /api/cache/flush   — Flush all cache (admin only)
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache/cache-manager';
import { getAllStrategies } from '@/lib/cache/strategies';
import { purgeCDNCache } from '@/lib/cache/cdn-config';

/* ── Simple auth check (admin token) ── */

function isAdminRequest(request: NextRequest): boolean {
  // In production, validate proper auth token / session
  if (process.env.NODE_ENV === 'development') return true;

  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.ADMIN_CACHE_TOKEN;
  if (!adminToken) return false;
  return authHeader === `Bearer ${adminToken}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  GET /api/cache/stats — Cache Statistics
 * ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const stats = await cache.statsWithHealth();
    const strategies = getAllStrategies();

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        strategies: strategies.map(s => ({
          name: s.name,
          description: s.description,
          prefix: s.prefix,
          enabled: s.enabled,
          ttl: {
            l1: s.options.l1Ttl,
            l2: s.options.l2Ttl,
          },
          tags: s.options.tags,
        })),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to get cache stats',
      },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  POST /api/cache/warmup — Trigger Cache Warming
 * ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, patterns } = body;

    // Handle different POST actions
    switch (action) {
      case 'warmup': {
        // Cache warmup — warm common keys
        const warmupResults: Record<string, boolean> = {};

        // Warm site settings
        try {
          await cache.getOrSet('site:settings:all', async () => {
            // Import dynamically to avoid circular deps
            const { PrismaClient } = await import('@prisma/client');
            const prisma = new PrismaClient();
            const settings = await prisma.siteSetting.findMany({
              where: { isActive: true },
            });
            return settings;
          }, { l2Ttl: 600_000, tags: ['site-settings'] });
          warmupResults['site:settings:all'] = true;
        } catch {
          warmupResults['site:settings:all'] = false;
        }

        return NextResponse.json({
          success: true,
          data: {
            warmedKeys: warmupResults,
            timestamp: new Date().toISOString(),
          },
        });
      }

      case 'invalidate': {
        // Invalidate by pattern or tag
        const { pattern, tag, cdn } = body;

        let invalidatedCount = 0;

        if (tag) {
          invalidatedCount = await cache.invalidateTag(tag);
        } else if (pattern) {
          invalidatedCount = await cache.delPattern(pattern);
        }

        // Also purge CDN if requested
        let cdnPurgeResult = null;
        if (cdn && tag) {
          cdnPurgeResult = await purgeCDNCache({ tags: [tag] });
        } else if (cdn && pattern) {
          cdnPurgeResult = await purgeCDNCache({ pattern });
        }

        return NextResponse.json({
          success: true,
          data: {
            invalidatedCount,
            cdnPurge: cdnPurgeResult,
            timestamp: new Date().toISOString(),
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Cache operation failed',
      },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  DELETE /api/cache/flush — Flush All Cache (Admin Only)
 * ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { purgeCdn } = body;

    // Flush application cache
    await cache.flush();

    // Optionally purge CDN as well
    let cdnPurgeResult = null;
    if (purgeCdn) {
      cdnPurgeResult = await purgeCDNCache({ purgeAll: true });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Cache flushed successfully',
        cdnPurge: cdnPurgeResult,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to flush cache',
      },
      { status: 500 }
    );
  }
}

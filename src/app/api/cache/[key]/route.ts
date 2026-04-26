/* ═══════════════════════════════════════════════════════════════════════════
 *  /api/cache/[key] — Cache Key Management
 *  GET    /api/cache/[key]  — Get a specific cached value
 *  DELETE /api/cache/[key]  — Invalidate a specific cache key
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache/cache-manager';

/* ── Simple auth check ── */

function isAdminRequest(request: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.ADMIN_CACHE_TOKEN;
  if (!adminToken) return false;
  return authHeader === `Bearer ${adminToken}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  GET /api/cache/[key] — Get Cached Value
 * ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    // URL-decode the key (keys may contain colons, slashes, etc.)
    const decodedKey = decodeURIComponent(key);

    if (!decodedKey) {
      return NextResponse.json(
        { success: false, error: 'Cache key is required' },
        { status: 400 }
      );
    }

    // Validate key format (basic safety check)
    if (decodedKey.length > 500 || /[\x00-\x1f\x7f]/.test(decodedKey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid cache key' },
        { status: 400 }
      );
    }

    const value = await cache.get(decodedKey);

    if (value === null) {
      return NextResponse.json({
        success: true,
        data: {
          key: decodedKey,
          found: false,
          value: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        key: decodedKey,
        found: true,
        value,
        sizeBytes: JSON.stringify(value).length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to get cached value',
      },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  DELETE /api/cache/[key] — Invalidate Specific Key
 * ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { key } = await params;
    const decodedKey = decodeURIComponent(key);

    if (!decodedKey) {
      return NextResponse.json(
        { success: false, error: 'Cache key is required' },
        { status: 400 }
      );
    }

    // Validate key format
    if (decodedKey.length > 500 || /[\x00-\x1f\x7f]/.test(decodedKey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid cache key' },
        { status: 400 }
      );
    }

    // Check if key exists before deletion
    const existing = await cache.get(decodedKey);
    const existed = existing !== null;

    // Delete from both L1 and L2
    await cache.del(decodedKey);

    return NextResponse.json({
      success: true,
      data: {
        key: decodedKey,
        existed,
        invalidated: true,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to invalidate cache key',
      },
      { status: 500 }
    );
  }
}

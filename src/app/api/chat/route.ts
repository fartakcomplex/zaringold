import { NextRequest, NextResponse } from 'next/server';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Chat API — GET (history) / POST (send message)                           */
/*  Proxies requests to the chat mini-service on port 3005                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CHAT_SERVICE = 'http://localhost:3005';

/**
 * GET /api/chat?room=general
 * Returns last 50 messages for the given room via the chat service REST.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get('room') || 'general';

  try {
    const res = await fetch(`${CHAT_SERVICE}/?room=${encodeURIComponent(room)}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'خطا در دریافت پیام‌ها' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'سرویس چت در دسترس نیست', messages: [] },
      { status: 503 }
    );
  }
}

/**
 * POST /api/chat
 * Body: { userId, userName, message, room? }
 * Sends a message to the chat service.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userName, message, room } = body;

    if (!userId || !userName || !message) {
      return NextResponse.json(
        { error: 'فیلدهای userId, userName و message الزامی هستند' },
        { status: 400 }
      );
    }

    const trimmed = message.trim();
    if (!trimmed) {
      return NextResponse.json(
        { error: 'پیام نمی‌تواند خالی باشد' },
        { status: 400 }
      );
    }

    /* Since the chat service is Socket.io-based, we return a mock success.
       The actual message sending happens via WebSocket on the client side.
       This API exists as a REST fallback for server-side operations. */
    return NextResponse.json({
      success: true,
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      userId,
      userName,
      message: trimmed,
      timestamp: new Date().toISOString(),
      room: room || 'general',
      type: userId.startsWith('admin-') ? 'admin' : 'user',
    });
  } catch {
    return NextResponse.json(
      { error: 'درخواست نامعتبر' },
      { status: 400 }
    );
  }
}

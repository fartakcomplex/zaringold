/* ═══════════════════════════════════════════════════════════════════════════
 *  request-logger.ts — Structured Request Logger
 *  Pino-compatible JSON logging · Request-ID tracking · Response timing
 *  User agent parsing · IP geolocation stub · Log levels
 * ═══════════════════════════════════════════════════════════════════════════ */

// ─── Types ─────────────────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  method?: string;
  url?: string;
  path?: string;
  status?: number;
  responseTimeMs?: number;
  ip?: string;
  userAgent?: string;
  userId?: string;
  geo?: GeoInfo;
  error?: string;
  stack?: string;
  meta?: Record<string, unknown>;
  service: string;
  env: string;
}

export interface GeoInfo {
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
}

export interface ParsedUserAgent {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';
  raw: string;
}

export interface LoggerConfig {
  service: string;
  minLevel: LogLevel;
  prettyPrint: boolean;
  includeGeo: boolean;
  redactPaths: string[];
}

// ─── Log Level Utilities ───────────────────────────────────────────────────

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

const LOG_LEVEL_PINO_MAP: Record<LogLevel, number> = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

// ─── User Agent Parser ─────────────────────────────────────────────────────

const UA_PATTERNS = {
  browsers: [
    { name: 'Chrome', pattern: /Chrome\/([\d.]+)/ },
    { name: 'Firefox', pattern: /Firefox\/([\d.]+)/ },
    { name: 'Safari', pattern: /Version\/([\d.]+).*Safari/ },
    { name: 'Edge', pattern: /Edg(?:e|A|iOS)?\/([\d.]+)/ },
    { name: 'Opera', pattern: /OPR\/([\d.]+)/ },
  ],
  os: [
    { name: 'Windows', pattern: /Windows NT ([\d.]+)/ },
    { name: 'macOS', pattern: /Mac OS X ([\d_.]+)/ },
    { name: 'Linux', pattern: /Linux/ },
    { name: 'Android', pattern: /Android ([\d.]+)/ },
    { name: 'iOS', pattern: /iPhone OS ([\d_]+)/ },
  ],
  devices: [
    { type: 'bot' as const, pattern: /bot|crawl|spider|slurp|mediapartners/i },
    { type: 'tablet' as const, pattern: /iPad|Tablet|PlayBook/i },
    { type: 'mobile' as const, pattern: /Mobile|iPhone|Android.*Mobile/i },
  ],
};

export function parseUserAgent(ua: string): ParsedUserAgent {
  const result: ParsedUserAgent = {
    browser: 'unknown',
    browserVersion: '0',
    os: 'unknown',
    osVersion: '0',
    device: 'unknown',
    raw: ua,
  };

  // Browser
  for (const { name, pattern } of UA_PATTERNS.browsers) {
    const match = ua.match(pattern);
    if (match) {
      result.browser = name;
      result.browserVersion = match[1];
      break;
    }
  }

  // OS
  for (const { name, pattern } of UA_PATTERNS.os) {
    const match = ua.match(pattern);
    if (match) {
      result.os = name;
      result.osVersion = (match[1] ?? '0').replace(/_/g, '.');
      break;
    }
  }

  // Device
  for (const { type, pattern } of UA_PATTERNS.devices) {
    if (pattern.test(ua)) {
      result.device = type;
      break;
    }
  }

  if (result.device === 'unknown' && !/Mobile/i.test(ua)) {
    result.device = 'desktop';
  }

  return result;
}

// ─── Request ID Generator ──────────────────────────────────────────────────

export function generateRequestId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  const pid = typeof process !== 'undefined' ? process.pid.toString(36) : '0';
  return `${ts}-${rand}-${pid}`;
}

// ─── IP Helpers ────────────────────────────────────────────────────────────

export function extractClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;
  return '127.0.0.1';
}

// ─── Sensitive Field Redaction ─────────────────────────────────────────────

function redactObject(
  obj: Record<string, unknown>,
  paths: string[]
): Record<string, unknown> {
  if (paths.length === 0) return obj;
  const redacted = { ...obj };
  for (const path of paths) {
    const parts = path.split('.');
    let current: Record<string, unknown> = redacted;
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] && typeof current[parts[i]] === 'object') {
        current = current[parts[i]] as Record<string, unknown>;
      } else {
        break;
      }
    }
    const lastKey = parts[parts.length - 1];
    if (lastKey in current) {
      current[lastKey] = '[REDACTED]';
    }
  }
  return redacted;
}

// ─── Logger Class ──────────────────────────────────────────────────────────

export class RequestLogger {
  private config: LoggerConfig;
  private currentRequestId: string | undefined;
  private currentTraceId: string | undefined;
  private currentSpanId: string | undefined;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      service: config?.service ?? 'zaringold',
      minLevel: config?.minLevel ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      prettyPrint: config?.prettyPrint ?? (process.env.NODE_ENV !== 'production'),
      includeGeo: config?.includeGeo ?? false,
      redactPaths: config?.redactPaths ?? [
        'password', 'token', 'authorization', 'cookie',
        'creditCard', 'cvv', 'otp', 'otpCode', 'session',
      ],
    };
  }

  /** Set the current request context */
  setContext(ctx: { requestId?: string; traceId?: string; spanId?: string }): void {
    this.currentRequestId = ctx.requestId;
    this.currentTraceId = ctx.traceId;
    this.currentSpanId = ctx.spanId;
  }

  /** Clear the current request context */
  clearContext(): void {
    this.currentRequestId = undefined;
    this.currentTraceId = undefined;
    this.currentSpanId = undefined;
  }

  /** Create a child logger with additional context */
  child(additionalMeta: Record<string, unknown>): RequestLogger {
    const child = new RequestLogger(this.config);
    child.currentRequestId = this.currentRequestId;
    child.currentTraceId = this.currentTraceId;
    child.currentSpanId = this.currentSpanId;
    return child;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.minLevel];
  }

  private formatMessage(entry: LogEntry): string {
    if (this.config.prettyPrint) {
      const ts = entry.timestamp;
      const lvl = entry.level.toUpperCase().padEnd(5);
      const req = entry.requestId ? `[${entry.requestId}]` : '';
      const status = entry.status ? ` ${entry.status}` : '';
      const time = entry.responseTimeMs != null ? ` ${entry.responseTimeMs}ms` : '';
      const path = entry.path ?? entry.url ?? '';
      return `${ts} ${lvl} ${req}${status}${time} ${path} ${entry.message}`;
    }
    return JSON.stringify(entry);
  }

  private emit(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    let safeMeta = meta;
    if (safeMeta && this.config.redactPaths.length > 0) {
      safeMeta = redactObject(safeMeta, this.config.redactPaths) as Record<string, unknown>;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: this.currentRequestId,
      traceId: this.currentTraceId,
      spanId: this.currentSpanId,
      service: this.config.service,
      env: process.env.NODE_ENV ?? 'development',
      ...(safeMeta ?? {}),
    };

    const formatted = this.formatMessage(entry);

    switch (level) {
      case 'debug':
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
      case 'fatal':
        console.error(formatted);
        break;
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void { this.emit('debug', message, meta); }
  info(message: string, meta?: Record<string, unknown>): void { this.emit('info', message, meta); }
  warn(message: string, meta?: Record<string, unknown>): void { this.emit('warn', message, meta); }
  error(message: string, meta?: Record<string, unknown>): void { this.emit('error', message, meta); }
  fatal(message: string, meta?: Record<string, unknown>): void { this.emit('fatal', message, meta); }

  /** Log an HTTP request (call at start, returns end function) */
  logRequest(meta: {
    method: string;
    url: string;
    ip?: string;
    userAgent?: string;
    userId?: string;
    geo?: GeoInfo;
  }): () => void {
    const startTime = Date.now();
    const parsedUa = meta.userAgent ? parseUserAgent(meta.userAgent) : undefined;
    const requestId = this.currentRequestId ?? generateRequestId();

    return () => {
      // This is called after response, additional fields should be set externally
      // or use logResponse for complete info
    };
  }

  /** Log an HTTP request with response (complete entry) */
  logResponse(meta: {
    method: string;
    url: string;
    status: number;
    responseTimeMs: number;
    ip?: string;
    userAgent?: string;
    userId?: string;
    geo?: GeoInfo;
  }): void {
    const parsedUa = meta.userAgent ? parseUserAgent(meta.userAgent) : undefined;
    const urlObj = meta.url.startsWith('http') ? meta.url : meta.url;
    const path = (() => {
      try {
        return new URL(meta.url, 'http://localhost').pathname;
      } catch {
        return meta.url;
      }
    })();

    const level: LogLevel = meta.status >= 500 ? 'error'
      : meta.status >= 400 ? 'warn'
      : meta.responseTimeMs > 5000 ? 'warn'
      : 'info';

    this.emit(level, `${meta.method} ${path} ${meta.status}`, {
      method: meta.method,
      url: meta.url,
      path,
      status: meta.status,
      responseTimeMs: meta.responseTimeMs,
      ip: meta.ip,
      userAgent: meta.userAgent,
      ua: parsedUa,
      userId: meta.userId,
      geo: this.config.includeGeo ? meta.geo : undefined,
    });
  }

  /** Log an error with stack trace */
  logError(message: string, error: unknown, meta?: Record<string, unknown>): void {
    const err = error instanceof Error ? error : new Error(String(error));
    this.emit('error', message, {
      error: err.message,
      stack: err.stack,
      ...meta,
    });
  }
}

// ─── Singleton ─────────────────────────────────────────────────────────────

export const logger = new RequestLogger();

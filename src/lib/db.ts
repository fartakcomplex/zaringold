import { PrismaClient } from '@prisma/client'

// ─── Configuration ─────────────────────────────────────────────────────────

const DB_CONFIG = {
  /** Connection timeout in seconds */
  connectionTimeoutMs: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS ?? '10000', 10),
  /** Query timeout in seconds */
  queryTimeoutMs: parseInt(process.env.DB_QUERY_TIMEOUT_MS ?? '30000', 10),
  /** Max connection pool size (for PostgreSQL migration) */
  poolSize: parseInt(process.env.DB_POOL_SIZE ?? '10', 10),
  /** Retry attempts for failed connections */
  retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS ?? '3', 10),
  /** Retry delay in ms (base, exponential backoff applied) */
  retryBaseDelayMs: parseInt(process.env.DB_RETRY_BASE_DELAY_MS ?? '200', 10),
  /** Max retry delay in ms */
  retryMaxDelayMs: parseInt(process.env.DB_RETRY_MAX_DELAY_MS ?? '5000', 10),
} as const;

// ─── Global Singleton ──────────────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Invalidate cached client if schema changed (forces fresh PrismaClient)
if (globalForPrisma.prisma && !(globalForPrisma.prisma as Record<string, unknown>).insuranceProvider) {
  globalForPrisma.prisma = undefined
}

// ─── Prisma Client with Extended Configuration ─────────────────────────────

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL ?? 'file:/home/z/my-project/db/custom.db',
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// ─── Connection Health Monitoring ──────────────────────────────────────────

let lastHealthCheck = 0;
let dbHealthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
let lastHealthError: string | null = null;

export interface DbHealthInfo {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastChecked: string;
  lastError: string | null;
  responseTimeMs: number;
}

/**
 * Check database connectivity.
 * Returns quickly if checked recently (within 10s).
 */
export async function checkDbHealth(): Promise<DbHealthInfo> {
  const now = Date.now();
  // Cache health for 10 seconds
  if (now - lastHealthCheck < 10_000) {
    return {
      status: dbHealthStatus,
      lastChecked: new Date(now).toISOString(),
      lastError: lastHealthError,
      responseTimeMs: 0,
    };
  }

  const start = Date.now();
  try {
    await Promise.race([
      db.$queryRaw`SELECT 1 as ok`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), DB_CONFIG.connectionTimeoutMs)
      ),
    ]);
    const elapsed = Date.now() - start;
    dbHealthStatus = elapsed < 200 ? 'healthy' : elapsed < 1000 ? 'degraded' : 'unhealthy';
    lastHealthError = null;
    lastHealthCheck = Date.now();
    return {
      status: dbHealthStatus,
      lastChecked: new Date().toISOString(),
      lastError: null,
      responseTimeMs: elapsed,
    };
  } catch (error) {
    dbHealthStatus = 'unhealthy';
    lastHealthError = error instanceof Error ? error.message : String(error);
    lastHealthCheck = Date.now();
    return {
      status: 'unhealthy',
      lastChecked: new Date().toISOString(),
      lastError: lastHealthError,
      responseTimeMs: Date.now() - start,
    };
  }
}

// ─── Retry Wrapper ─────────────────────────────────────────────────────────

/**
 * Execute a Prisma operation with automatic retry and exponential backoff.
 * Use for critical queries that should survive transient failures.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    shouldRetry?: (error: Error) => boolean;
  }
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? DB_CONFIG.retryAttempts;
  const baseDelay = options?.baseDelayMs ?? DB_CONFIG.retryBaseDelayMs;
  const maxDelay = options?.maxDelayMs ?? DB_CONFIG.retryMaxDelayMs;
  const shouldRetry = options?.shouldRetry ?? defaultShouldRetry;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts || !shouldRetry(lastError)) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        maxDelay,
        baseDelay * Math.pow(2, attempt - 1) + Math.random() * baseDelay
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

function defaultShouldRetry(error: Error): boolean {
  const msg = error.message.toLowerCase();
  // Retry on connection/timeout errors, not on validation/constraint errors
  return (
    msg.includes('connection') ||
    msg.includes('timeout') ||
    msg.includes('busy') ||
    msg.includes('locked') ||
    msg.includes('sqlite_BUSY') ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset')
  );
}

// ─── Query Timeout Wrapper ─────────────────────────────────────────────────

/**
 * Execute a Prisma operation with a timeout.
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = DB_CONFIG.queryTimeoutMs
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

// ─── Configuration Export ──────────────────────────────────────────────────

export function getDbConfig() {
  return {
    ...DB_CONFIG,
    url: process.env.DATABASE_URL ? '***configured***' : 'file:/home/z/my-project/db/custom.db',
    health: dbHealthStatus,
  };
}

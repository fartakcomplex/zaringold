/**
 * @file Event Worker Service
 * @description Standalone event worker for the ZarinGold platform.
 *
 * Runs as a separate process (port 3008) and handles:
 * - Subscribing to all event channels via Redis pub/sub
 * - Processing background jobs from the queue
 * - Running scheduled/recurring jobs
 * - Reporting health status
 * - Graceful shutdown with in-flight event draining
 *
 * Architecture:
 * ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
 * │  API Server   │────▶│  Redis       │◀────│  Event       │
 * │  (port 3000)  │     │  Pub/Sub     │     │  Worker      │
 * │              │     │  + Queue     │     │  (port 3008) │
 * └──────────────┘     └──────────────┘     └──────────────┘
 *
 * Usage:
 *   bun run dev    - Development mode with hot reload
 *   bun start      - Production mode
 */

const PORT = parseInt(process.env.EVENT_WORKER_PORT ?? '3008', 10);
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const PREFIX = process.env.EVENT_PREFIX ?? 'zaringold:events';

// ─── Import path resolution ──────────────────────────────────────────────────
// In production, the worker imports from the main project's src/lib/events.
// In development, we implement lightweight inline versions.

type EventType = string;
type EventPriority = 'critical' | 'high' | 'normal' | 'low';

interface EventMetadata {
  eventId: string;
  correlationId: string;
  type: EventType;
  category: string;
  timestamp: string;
  source: string;
  version: number;
  userId?: string;
  priority: EventPriority;
}

interface EventEnvelope<T = unknown> {
  metadata: EventMetadata;
  data: T;
}

interface DeadLetterEvent {
  event: EventEnvelope;
  error: string;
  stack?: string;
  handlerName: string;
  retryCount: number;
  deadAt: string;
  eventType: EventType;
}

type EventHandler<T = unknown> = (event: EventEnvelope<T>) => Promise<void>;

interface HandlerRegistration {
  pattern: string;
  handler: EventHandler;
  name: string;
}

interface Job {
  id: string;
  name: string;
  queue: string;
  data: unknown;
  priority: EventPriority;
  status: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  processAt?: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
  progress?: number;
  result?: unknown;
  backoff?: { type: string; delay: number };
}

// ─── UUID Generator ──────────────────────────────────────────────────────────
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Pattern Matcher ─────────────────────────────────────────────────────────
function matchPattern(pattern: string, eventType: string): boolean {
  if (pattern === '*' || pattern === eventType) return true;
  const regex = new RegExp(
    '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '[^.]+') + '$',
  );
  return regex.test(eventType);
}

// ─── Worker State ────────────────────────────────────────────────────────────
let redis: any = null;
const handlers: HandlerRegistration[] = [];
let activeHandlers = 0;
let totalProcessed = 0;
let totalFailed = 0;
let startTime = Date.now();
let shuttingDown = false;

// ─── Inline Event Handlers ───────────────────────────────────────────────────
// These are lightweight versions that log events. In production,
// the worker would import from src/lib/events/handlers/.

async function handleTradingEvent(event: EventEnvelope): Promise<void> {
  const { type, data } = event;
  console.log(`[Worker:Trading] ${type}`, JSON.stringify(data).slice(0, 200));
  // TODO: Import and delegate to real handlers
}

async function handleWalletEvent(event: EventEnvelope): Promise<void> {
  const { type, data } = event;
  console.log(`[Worker:Wallet] ${type}`, JSON.stringify(data).slice(0, 200));
}

async function handlePaymentEvent(event: EventEnvelope): Promise<void> {
  const { type, data } = event;
  console.log(`[Worker:Payment] ${type}`, JSON.stringify(data).slice(0, 200));
}

async function handleNotificationEvent(event: EventEnvelope): Promise<void> {
  const { type, data } = event;
  console.log(`[Worker:Notification] ${type}`, JSON.stringify(data).slice(0, 200));

  // Simulate notification processing
  if (type === 'notification.email.sent') {
    // Would integrate with email service
  } else if (type === 'notification.sms.sent') {
    // Would integrate with SMS service
  } else if (type === 'notification.push.sent') {
    // Would integrate with FCM/APNS
  }
}

async function handleGamificationEvent(event: EventEnvelope): Promise<void> {
  const { type, data } = event;
  console.log(`[Worker:Gamification] ${type}`, JSON.stringify(data).slice(0, 200));
}

async function handleAnalyticsEvent(event: EventEnvelope): Promise<void> {
  const { type } = event;
  // Analytics events are high-volume; don't log each one
  totalProcessed++;
}

async function handleSystemEvent(event: EventEnvelope): Promise<void> {
  const { type, data } = event;
  console.log(`[Worker:System] ${type}`, JSON.stringify(data).slice(0, 200));
}

// ─── Register Handlers ──────────────────────────────────────────────────────
function registerHandlers(): void {
  const registrations: HandlerRegistration[] = [
    { pattern: 'trading.*', handler: handleTradingEvent, name: 'tradingHandler' },
    { pattern: 'wallet.*', handler: handleWalletEvent, name: 'walletHandler' },
    { pattern: 'payment.*', handler: handlePaymentEvent, name: 'paymentHandler' },
    { pattern: 'notification.*', handler: handleNotificationEvent, name: 'notificationHandler' },
    { pattern: 'gamification.*', handler: handleGamificationEvent, name: 'gamificationHandler' },
    { pattern: 'analytics.*', handler: handleAnalyticsEvent, name: 'analyticsHandler' },
    { pattern: 'system.*', handler: handleSystemEvent, name: 'systemHandler' },
    { pattern: 'insurance.*', handler: handleWalletEvent, name: 'insuranceHandler' },
    { pattern: 'user.*', handler: handleTradingEvent, name: 'userHandler' },
  ];

  handlers.push(...registrations);
  console.log(`[Worker] Registered ${registrations.length} handler groups`);
}

// ─── Redis Connection ────────────────────────────────────────────────────────
async function connectRedis(): Promise<void> {
  try {
    const ioredis = await import('ioredis');
    const Redis = ioredis.default;

    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy(times: number) {
        if (shuttingDown) return null;
        const delay = Math.min(times * 500, 5000);
        console.warn(`[Worker] Redis retry ${times}, reconnecting in ${delay}ms`);
        return delay;
      },
    });

    await redis.connect();
    console.log(`[Worker] Connected to Redis at ${REDIS_URL}`);
  } catch (error) {
    console.error('[Worker] Failed to connect to Redis:', error);
    process.exit(1);
  }
}

// ─── Subscribe to Event Channels ─────────────────────────────────────────────
async function subscribeToEvents(): Promise<void> {
  // Subscribe to category wildcard channels
  const categories = [
    'trading.*',
    'wallet.*',
    'payment.*',
    'user.*',
    'notification.*',
    'gamification.*',
    'insurance.*',
    'system.*',
  ];

  for (const category of categories) {
    const channel = `${PREFIX}:${category.replace(/\*/g, '__wildcard__')}`;
    await redis.subscribe(channel);
    console.log(`[Worker] Subscribed to ${channel}`);
  }

  // Also subscribe to global wildcard
  await redis.subscribe(`${PREFIX}:__wildcard__`);

  // Handle messages
  redis.on('message', async (channel: string, message: string) => {
    if (shuttingDown) return;

    try {
      const envelope = JSON.parse(message) as EventEnvelope;
      await dispatchEvent(envelope);
    } catch (error) {
      console.error('[Worker] Failed to process message:', error);
    }
  });

  console.log('[Worker] Event subscriptions active');
}

// ─── Event Dispatching ───────────────────────────────────────────────────────
async function dispatchEvent(event: EventEnvelope): Promise<void> {
  activeHandlers++;

  try {
    const matchedHandlers = handlers.filter((h) =>
      matchPattern(h.pattern, event.metadata.type),
    );

    if (matchedHandlers.length === 0) {
      // No handlers matched - this is fine for generic subscriptions
      return;
    }

    // Execute all matched handlers with error isolation
    const results = await Promise.allSettled(
      matchedHandlers.map((h) => h.handler(event)),
    );

    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'fulfilled') {
        totalProcessed++;
      } else {
        totalFailed++;
        const error = results[i] as PromiseRejectedResult;
        console.error(
          `[Worker] Handler "${matchedHandlers[i].name}" failed for ` +
          `${event.metadata.type}: ${error.reason}`,
        );

        // Move to dead-letter queue
        try {
          await redis.lpush(
            `${PREFIX}:dlq`,
            JSON.stringify({
              event,
              error: String(error.reason),
              handlerName: matchedHandlers[i].name,
              retryCount: 0,
              deadAt: new Date().toISOString(),
              eventType: event.metadata.type,
            } satisfies DeadLetterEvent),
          );
        } catch (dlqError) {
          console.error('[Worker] Failed to add to DLQ:', dlqError);
        }
      }
    }
  } finally {
    activeHandlers--;
  }
}

// ─── Job Queue Processing ────────────────────────────────────────────────────
let jobProcessingInterval: ReturnType<typeof setInterval> | null = null;

async function processJobs(): Promise<void> {
  if (shuttingDown) return;

  try {
    const queueKey = `${PREFIX.replace(':events', ':jobs')}:queue:default`;
    const now = Date.now();

    // Check for ready jobs
    const jobs = await redis.zrangebyscore(queueKey, '-inf', now, 'LIMIT', 0, 5);

    for (const jobData of jobs) {
      const job = JSON.parse(jobData) as Job;

      // Remove from queue
      await redis.zrem(queueKey, jobData);

      // Process the job
      job.status = 'active';
      job.startedAt = new Date().toISOString();
      job.attempts++;

      console.log(`[Worker:Job] Processing job ${job.id} (${job.name})`);

      try {
        // Simple job execution - in production, use registered job definitions
        await executeJob(job);
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        job.progress = 100;
        totalProcessed++;
      } catch (error) {
        job.error = (error as Error).message;

        if (job.attempts < (job.maxAttempts ?? 3)) {
          // Retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, job.attempts - 1), 60000);
          job.status = 'delayed';
          job.processAt = new Date(Date.now() + delay).toISOString();

          console.warn(
            `[Worker:Job] Retry ${job.attempts}/${job.maxAttempts} for ${job.id}, ` +
            `next at ${job.processAt}`,
          );

          // Re-enqueue
          const score = Date.now() + delay;
          await redis.zadd(queueKey, score, JSON.stringify(job));
        } else {
          job.status = 'failed';
          job.failedAt = new Date().toISOString();
          totalFailed++;
          console.error(`[Worker:Job] Failed: ${job.id} - ${job.error}`);
        }
      }

      // Update job in hash
      await redis.hset(
        `${PREFIX.replace(':events', ':jobs')}:jobs`,
        job.id,
        JSON.stringify(job),
      );
    }
  } catch (error) {
    // Ignore Redis errors during job processing
  }
}

async function executeJob(job: Job): Promise<void> {
  // In production, this would dispatch to registered job handlers.
  // For now, log and complete.
  console.log(`[Worker:Job] Executing ${job.name}:`, JSON.stringify(job.data).slice(0, 200));

  // Simulate processing
  await new Promise((resolve) => setTimeout(resolve, 10));

  job.result = { processed: true, timestamp: new Date().toISOString() };
}

// ─── Health Check Server ─────────────────────────────────────────────────────
async function startHealthServer(): Promise<void> {
  const server = Bun.serve({
    port: PORT,
    fetch(request): Response {
      const url = new URL(request.url);

      if (url.pathname === '/health') {
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        const health = {
          status: shuttingDown ? 'shutting_down' : 'healthy',
          service: 'zarrin-gold-event-worker',
          port: PORT,
          mode: 'redis',
          redis: redis ? 'connected' : 'disconnected',
          uptime: uptime,
          uptimeHuman: formatUptime(uptime),
          handlers: handlers.length,
          activeHandlers,
          totalProcessed,
          totalFailed,
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        };

        return Response.json(health);
      }

      if (url.pathname === '/metrics') {
        return Response.json({
          totalProcessed,
          totalFailed,
          activeHandlers,
          handlers: handlers.map((h) => ({ pattern: h.pattern, name: h.name })),
          uptime: Math.floor((Date.now() - startTime) / 1000),
        });
      }

      if (url.pathname === '/dlq') {
        try {
          const dlqKey = `${PREFIX}:dlq`;
          const dlqSize = await redis.llen(dlqKey);
          const dlqEvents = await redis.lrange(dlqKey, 0, 19);

          return Response.json({
            size: dlqSize,
            recentEvents: dlqEvents.map((e: string) => JSON.parse(e)),
          });
        } catch {
          return Response.json({ error: 'Failed to read DLQ' }, { status: 500 });
        }
      }

      if (url.pathname === '/ready') {
        return redis
          ? new Response('OK', { status: 200 })
          : new Response('Not Ready', { status: 503 });
      }

      return new Response('ZarinGold Event Worker', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    },
  });

  console.log(`[Worker] Health server running on http://localhost:${PORT}`);
  console.log(`[Worker]   GET /health  - Health status`);
  console.log(`[Worker]   GET /metrics - Event metrics`);
  console.log(`[Worker]   GET /dlq     - Dead letter queue`);
  console.log(`[Worker]   GET /ready   - Readiness check`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(' ');
}

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n[Worker] ${signal} received, initiating graceful shutdown...`);
  shuttingDown = true;

  // Stop accepting new jobs
  if (jobProcessingInterval) {
    clearInterval(jobProcessingInterval);
    jobProcessingInterval = null;
  }

  // Wait for active handlers to complete
  const shutdownTimeout = 30000;
  const shutdownStart = Date.now();

  while (activeHandlers > 0 && Date.now() - shutdownStart < shutdownTimeout) {
    console.log(
      `[Worker] Waiting for ${activeHandlers} active handlers to complete...`,
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (activeHandlers > 0) {
    console.warn(`[Worker] Timeout! ${activeHandlers} handlers still active`);
  }

  // Disconnect Redis
  try {
    await redis.quit();
    console.log('[Worker] Redis disconnected');
  } catch {
    // Ignore
  }

  console.log(`[Worker] Shutdown complete. Processed: ${totalProcessed}, Failed: ${totalFailed}`);
  process.exit(0);
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   ZarinGold Event Worker Service               ║');
  console.log('║   Event-driven background processing           ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  // 1. Register handlers
  registerHandlers();

  // 2. Connect to Redis
  await connectRedis();

  // 3. Subscribe to event channels
  await subscribeToEvents();

  // 4. Start job queue processor (poll every second)
  jobProcessingInterval = setInterval(processJobs, 1000);
  console.log('[Worker] Job queue processor started (polling every 1s)');

  // 5. Start health check server
  await startHealthServer();

  // 6. Register signal handlers
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // 7. Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('[Worker] Uncaught exception:', error);
    totalFailed++;
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[Worker] Unhandled rejection:', reason);
    totalFailed++;
  });

  console.log('');
  console.log(`[Worker] 🚀 Ready and listening for events (uptime: 0s)`);
  console.log(`[Worker]    PID: ${process.pid}`);
  console.log(`[Worker]    Node: ${process.version}`);
  console.log(`[Worker]    Bun: ${typeof Bun !== 'undefined' ? Bun.version : 'N/A'}`);
}

// Start the worker
main().catch((error) => {
  console.error('[Worker] Fatal startup error:', error);
  process.exit(1);
});

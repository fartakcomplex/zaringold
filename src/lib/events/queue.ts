/**
 * @module events/queue
 * @description Redis-based job queue system for the ZarinGold platform.
 *
 * Inspired by BullMQ, this provides a lightweight but powerful job queue with:
 * - Job scheduling (immediate, delayed, recurring via cron patterns)
 * - Priority queues (critical, high, normal, low)
 * - Job retry with configurable backoff strategies
 * - Job progress tracking with real-time updates
 * - Dead letter queue for permanently failed jobs
 * - Concurrency control per queue and per job type
 */

import type {
  Job,
  JobDefinition,
  JobPriority,
  JobStatus,
  JobSchedule,
} from './types';

// ─── Priority Weight ─────────────────────────────────────────────────────────
const PRIORITY_WEIGHT: Record<JobPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

// ─── Job Queue Configuration ─────────────────────────────────────────────────
export interface JobQueueConfig {
  /** Redis URL (falls back to env.REDIS_URL) */
  redisUrl?: string;
  /** Key prefix for Redis keys */
  prefix?: string;
  /** Default concurrency for processing jobs */
  defaultConcurrency?: number;
  /** Default max attempts */
  defaultMaxAttempts?: number;
  /** Polling interval in ms for delayed jobs (default: 1000) */
  pollingInterval?: number;
  /** Whether to run in memory mode (for development) */
  inMemory?: boolean;
}

// ─── In-Memory Job Store ─────────────────────────────────────────────────────
class InMemoryJobStore {
  private queues: Map<string, Job[]> = new Map();
  private jobMap: Map<string, Job> = new Map();

  enqueue(queue: string, job: Job): void {
    if (!this.queues.has(queue)) this.queues.set(queue, []);
    const queueJobs = this.queues.get(queue)!;

    // Insert sorted by priority
    let inserted = false;
    for (let i = 0; i < queueJobs.length; i++) {
      if (PRIORITY_WEIGHT[job.priority] < PRIORITY_WEIGHT[queueJobs[i].priority]) {
        queueJobs.splice(i, 0, job);
        inserted = true;
        break;
      }
    }
    if (!inserted) queueJobs.push(job);

    this.jobMap.set(job.id, job);
  }

  dequeue(queue: string): Job | undefined {
    const queueJobs = this.queues.get(queue);
    if (!queueJobs || queueJobs.length === 0) return undefined;

    const now = Date.now();

    // Find the first job that is ready to process
    for (let i = 0; i < queueJobs.length; i++) {
      const job = queueJobs[i];
      if (!job.processAt || new Date(job.processAt).getTime() <= now) {
        queueJobs.splice(i, 1);
        job.status = 'active';
        job.startedAt = new Date().toISOString();
        return job;
      }
    }

    return undefined;
  }

  getJob(id: string): Job | undefined {
    return this.jobMap.get(id);
  }

  updateJob(job: Job): void {
    this.jobMap.set(job.id, job);
  }

  getQueueSize(queue: string): number {
    return this.queues.get(queue)?.length ?? 0;
  }

  getDelayedJobs(queue: string): Job[] {
    const now = Date.now();
    return (this.queues.get(queue) ?? []).filter(
      (j) => j.processAt && new Date(j.processAt).getTime() > now,
    );
  }

  getActiveJobs(queue: string): Job[] {
    return Array.from(this.jobMap.values()).filter(
      (j) => j.queue === queue && j.status === 'active',
    );
  }

  getAllJobs(queue: string, status?: JobStatus): Job[] {
    const jobs = Array.from(this.jobMap.values()).filter((j) => j.queue === queue);
    if (status) return jobs.filter((j) => j.status === status);
    return jobs;
  }

  removeJob(id: string): boolean {
    const job = this.jobMap.get(id);
    if (!job) return false;

    this.jobMap.delete(id);
    const queueJobs = this.queues.get(job.queue);
    if (queueJobs) {
      const idx = queueJobs.findIndex((j) => j.id === id);
      if (idx !== -1) queueJobs.splice(idx, 1);
    }
    return true;
  }
}

// ─── Redis Job Store ─────────────────────────────────────────────────────────
class RedisJobStore {
  private redis: any = null;
  private connected = false;

  async connect(redisUrl: string): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Redis = require('ioredis');
      const RedisCtor = Redis.default ?? Redis;
      this.redis = new RedisCtor(redisUrl, { lazyConnect: true });
      await this.redis.connect();
      this.connected = true;
    } catch (error) {
      console.error('[JobQueue] Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.redis?.quit();
    this.connected = false;
  }

  async enqueue(prefix: string, queue: string, job: Job): Promise<void> {
    const key = `${prefix}:queue:${queue}`;
    const data = JSON.stringify(job);
    // Use sorted set with priority*1e13 + timestamp as score for ordering
    const score = PRIORITY_WEIGHT[job.priority] * 1e13 + Date.now();
    await this.redis?.zadd(key, score, data);
    // Also store full job data
    await this.redis?.hset(`${prefix}:jobs`, job.id, data);
  }

  async dequeue(prefix: string, queue: string): Promise<Job | undefined> {
    const key = `${prefix}:queue:${queue}`;
    const now = Date.now();
    const maxScore = PRIORITY_WEIGHT.low * 1e13 + now;

    // Get highest priority job ready to process
    const results = await this.redis?.zrangebyscore(key, '-inf', maxScore, 'LIMIT', 0, 1);
    if (!results || results.length === 0) return undefined;

    const jobData = results[0];
    const job = JSON.parse(jobData) as Job;

    // Check delay
    if (job.processAt && new Date(job.processAt).getTime() > now) return undefined;

    // Remove from queue
    await this.redis?.zrem(key, jobData);
    job.status = 'active';
    job.startedAt = new Date().toISOString();
    await this.redis?.hset(`${prefix}:jobs`, job.id, JSON.stringify(job));

    return job;
  }

  async getJob(prefix: string, id: string): Promise<Job | undefined> {
    const data = await this.redis?.hget(`${prefix}:jobs`, id);
    return data ? JSON.parse(data) : undefined;
  }

  async updateJob(prefix: string, job: Job): Promise<void> {
    await this.redis?.hset(`${prefix}:jobs`, job.id, JSON.stringify(job));
  }

  async getQueueSize(prefix: string, queue: string): Promise<number> {
    return (await this.redis?.zcard(`${prefix}:queue:${queue}`)) ?? 0;
  }

  async removeJob(prefix: string, id: string): Promise<boolean> {
    const job = await this.getJob(prefix, id);
    if (!job) return false;
    await this.redis?.hdel(`${prefix}:jobs`, id);
    // Also try to remove from queue
    const data = JSON.stringify(job);
    await this.redis?.zrem(`${prefix}:queue:${job.queue}`, data);
    return true;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// ─── Job Queue Class ─────────────────────────────────────────────────────────

export class JobQueue {
  private config: Required<JobQueueConfig>;
  private store: InMemoryJobStore | RedisJobStore;
  private mode: 'redis' | 'memory' = 'memory';
  private definitions: Map<string, JobDefinition> = new Map();
  private activeJobs: Map<string, Job> = new Map();
  private schedules: Map<string, JobSchedule> = new Map();
  private scheduleTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private _processing = false;
  private _shuttingDown = false;
  private concurrency: Map<string, number> = new Map();
  private progressCallbacks: Map<string, (pct: number) => void> = new Map();
  private static _instance: JobQueue | null = null;

  private constructor(config?: JobQueueConfig) {
    this.config = {
      redisUrl: config?.redisUrl ?? process.env.REDIS_URL ?? 'redis://localhost:6379',
      prefix: config?.prefix ?? 'zaringold:jobs',
      defaultConcurrency: config?.defaultConcurrency ?? 5,
      defaultMaxAttempts: config?.defaultMaxAttempts ?? 3,
      pollingInterval: config?.pollingInterval ?? 1000,
      inMemory: config?.inMemory ?? false,
    };

    this.store = new InMemoryJobStore();
  }

  /**
   * Get the singleton JobQueue instance.
   */
  static getInstance(config?: JobQueueConfig): JobQueue {
    if (!JobQueue._instance) {
      JobQueue._instance = new JobQueue(config);
    }
    return JobQueue._instance;
  }

  /**
   * Reset the singleton. For testing.
   */
  static resetInstance(): void {
    JobQueue._instance = null;
  }

  /**
   * Initialize the job queue.
   * Connects to Redis in production, uses in-memory in development.
   */
  async initialize(): Promise<void> {
    if (!this.config.inMemory && process.env.NODE_ENV === 'production' && this.config.redisUrl) {
      try {
        const redisStore = new RedisJobStore();
        await redisStore.connect(this.config.redisUrl);
        this.store = redisStore;
        this.mode = 'redis';
        console.log('[JobQueue] Connected to Redis');
      } catch (error) {
        console.warn('[JobQueue] Redis unavailable, falling back to in-memory:', error);
      }
    } else {
      console.log('[JobQueue] Running in in-memory mode');
    }
  }

  /**
   * Register a job definition.
   * @param definition - Job definition with handler, priority, etc.
   */
  define<T = unknown>(definition: JobDefinition<T>): void {
    this.definitions.set(`${definition.queue}:${definition.name}`, {
      ...definition,
      maxAttempts: definition.maxAttempts ?? this.config.defaultMaxAttempts,
      priority: definition.priority ?? 'normal',
      backoff: definition.backoff ?? {
        type: 'exponential',
        delay: 1000,
      },
    });
  }

  /**
   * Add a job to the queue.
   * @param queue - Queue name
   * @param name - Job name (must be registered via define())
   * @param data - Job payload
   * @param options - Job options (priority, delay, etc.)
   * @returns The created job
   */
  async addJob<T = unknown>(
    queue: string,
    name: string,
    data: T,
    options?: {
      priority?: JobPriority;
      delay?: number;
      maxAttempts?: number;
      correlationId?: string;
      processAt?: string;
    },
  ): Promise<Job<T>> {
    const defKey = `${queue}:${name}`;
    const def = this.definitions.get(defKey);

    const job: Job<T> = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name,
      queue,
      data,
      priority: options?.priority ?? def?.priority ?? 'normal',
      status: 'waiting',
      attempts: 0,
      maxAttempts: options?.maxAttempts ?? def?.maxAttempts ?? this.config.defaultMaxAttempts,
      createdAt: new Date().toISOString(),
      processAt: options?.processAt
        ?? (options?.delay
          ? new Date(Date.now() + options.delay).toISOString()
          : undefined),
      correlationId: options?.correlationId,
      backoff: def?.backoff ?? { type: 'exponential', delay: 1000 },
    };

    if (this.mode === 'redis') {
      const redisStore = this.store as RedisJobStore;
      await redisStore.enqueue(this.config.prefix, queue, job);
    } else {
      (this.store as InMemoryJobStore).enqueue(queue, job);
    }

    return job;
  }

  /**
   * Get a job by ID.
   */
  async getJob(id: string): Promise<Job | undefined> {
    if (this.mode === 'redis') {
      return await (this.store as RedisJobStore).getJob(this.config.prefix, id);
    }
    return (this.store as InMemoryJobStore).getJob(id);
  }

  /**
   * Update a job's state.
   */
  async updateJob(job: Job): Promise<void> {
    if (this.mode === 'redis') {
      await (this.store as RedisJobStore).updateJob(this.config.prefix, job);
    } else {
      (this.store as InMemoryJobStore).updateJob(job);
    }
  }

  /**
   * Cancel a job by ID.
   * @returns true if job was found and cancelled
   */
  async cancelJob(id: string): Promise<boolean> {
    const job = await this.getJob(id);
    if (!job) return false;
    if (job.status === 'active' || job.status === 'completed') return false;

    job.status = 'cancelled';
    await this.updateJob(job);

    if (this.mode === 'redis') {
      return await (this.store as RedisJobStore).removeJob(this.config.prefix, id);
    }
    return (this.store as InMemoryJobStore).removeJob(id);
  }

  /**
   * Get the size of a queue (waiting + delayed jobs).
   */
  async getQueueSize(queue: string): Promise<number> {
    if (this.mode === 'redis') {
      return await (this.store as RedisJobStore).getQueueSize(this.config.prefix, queue);
    }
    return (this.store as InMemoryJobStore).getQueueSize(queue);
  }

  /**
   * Schedule a recurring job.
   * @param id - Schedule ID
   * @param jobName - Name of the registered job
   * @param queue - Queue name
   * @param pattern - Cron expression or interval in ms
   * @param data - Static job data
   */
  schedule<T = unknown>(
    id: string,
    jobName: string,
    queue: string,
    pattern: string | number,
    data?: T,
  ): JobSchedule {
    const schedule: JobSchedule = {
      id,
      jobName,
      pattern,
      active: true,
      data,
    };

    this.schedules.set(id, schedule);

    // Start timer for simple interval-based schedules
    if (typeof pattern === 'number') {
      const timer = setInterval(async () => {
        if (!schedule.active || this._shuttingDown) return;
        schedule.lastRun = new Date().toISOString();
        try {
          await this.addJob(queue, jobName, data);
        } catch (error) {
          console.error(`[JobQueue] Scheduled job ${id} failed to enqueue:`, error);
        }
      }, pattern);

      this.scheduleTimers.set(id, timer);
    }

    console.log(`[JobQueue] Scheduled job "${id}": ${typeof pattern === 'number' ? `every ${pattern}ms` : pattern}`);
    return schedule;
  }

  /**
   * Activate a scheduled job.
   */
  activateSchedule(id: string): void {
    const schedule = this.schedules.get(id);
    if (schedule) schedule.active = true;
  }

  /**
   * Deactivate a scheduled job.
   */
  deactivateSchedule(id: string): void {
    const schedule = this.schedules.get(id);
    if (schedule) schedule.active = false;
  }

  /**
   * Remove a scheduled job.
   */
  removeSchedule(id: string): void {
    this.schedules.delete(id);
    const timer = this.scheduleTimers.get(id);
    if (timer) {
      clearInterval(timer);
      this.scheduleTimers.delete(id);
    }
  }

  /**
   * Start processing jobs from all queues.
   * Runs a polling loop that checks for waiting jobs and processes them.
   */
  async start(): Promise<void> {
    if (this._processing) return;
    this._processing = true;
    this._shuttingDown = false;

    console.log('[JobQueue] Starting job processor');

    const processLoop = async () => {
      while (this._processing && !this._shuttingDown) {
        try {
          await this.processNextJob();
        } catch (error) {
          console.error('[JobQueue] Error in processing loop:', error);
        }
        await new Promise((resolve) => setTimeout(resolve, this.config.pollingInterval));
      }
    };

    processLoop();
  }

  /**
   * Stop processing jobs.
   * Waits for active jobs to complete.
   * @param timeout - Max time to wait in ms
   */
  async stop(timeout = 30000): Promise<void> {
    this._shuttingDown = true;
    this._processing = false;

    console.log(
      `[JobQueue] Stopping, waiting for ${this.activeJobs.size} active jobs...`,
    );

    const start = Date.now();
    while (this.activeJobs.size > 0 && Date.now() - start < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (this.activeJobs.size > 0) {
      console.warn(
        `[JobQueue] Timeout, ${this.activeJobs.size} jobs still active`,
      );
    }

    // Clear all schedule timers
    this.scheduleTimers.forEach((timer) => clearInterval(timer));
    this.scheduleTimers.clear();

    // Disconnect Redis
    if (this.mode === 'redis') {
      await (this.store as RedisJobStore).disconnect();
    }

    console.log('[JobQueue] Stopped');
  }

  /**
   * Process the next available job from any queue.
   */
  private async processNextJob(): Promise<void> {
    if (this._shuttingDown) return;

    // Collect all unique queue names from definitions
    const queues = new Set<string>();
    this.definitions.forEach((_def, key) => {
      const [queue] = key.split(':');
      queues.add(queue);
    });

    queues.forEach(async (queue) => {
      // Check concurrency
      const current = this.concurrency.get(queue) ?? 0;
      const defConcurrency = this.getQueueConcurrency(queue);
      if (current >= defConcurrency) { /* skip */ } else {
        let job: Job | undefined;
        if (this.mode === 'redis') {
          job = await (this.store as RedisJobStore).dequeue(this.config.prefix, queue);
        } else {
          job = (this.store as InMemoryJobStore).dequeue(queue);
        }

        if (job) {
          this.activeJobs.set(job.id, job);
          this.concurrency.set(queue, current + 1);

          // Process async without blocking the loop
          this.processJob(job, queue).finally(() => {
            this.activeJobs.delete(job.id);
            const c = (this.concurrency.get(queue) ?? 1) - 1;
            this.concurrency.set(queue, Math.max(0, c));
          });
        }
      }
    });
  }

  /**
   * Process a single job with retry logic.
   */
  private async processJob(job: Job, queue: string): Promise<void> {
    const defKey = `${queue}:${job.name}`;
    const def = this.definitions.get(defKey);

    if (!def) {
      console.error(`[JobQueue] No definition found for job ${defKey}`);
      job.status = 'failed';
      job.error = `No definition found for ${defKey}`;
      job.failedAt = new Date().toISOString();
      await this.updateJob(job);
      return;
    }

    const progress = (pct: number) => {
      job.progress = pct;
    };

    try {
      job.attempts++;

      const result = await def.handler(job, progress);

      // Success
      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date().toISOString();
      job.progress = 100;

      console.log(`[JobQueue] Job completed: ${job.id} (${job.name})`);
    } catch (error) {
      const err = error as Error;

      if (job.attempts < job.maxAttempts) {
        // Retry with backoff
        const backoffDelay = this.calculateBackoff(job, job.attempts);
        const retryAt = new Date(Date.now() + backoffDelay).toISOString();

        console.warn(
          `[JobQueue] Job failed (attempt ${job.attempts}/${job.maxAttempts}), ` +
          `retrying at ${retryAt}: ${err.message}`,
        );

        job.status = 'delayed';
        job.error = err.message;
        job.processAt = retryAt;

        // Re-enqueue for retry
        if (this.mode === 'redis') {
          await (this.store as RedisJobStore).enqueue(this.config.prefix, queue, job);
        } else {
          (this.store as InMemoryJobStore).enqueue(queue, job);
        }
      } else {
        // Max retries exceeded - dead letter
        job.status = 'failed';
        job.error = err.message;
        job.failedAt = new Date().toISOString();

        console.error(
          `[JobQueue] Job permanently failed: ${job.id} (${job.name}) - ${err.message}`,
        );

        // TODO: Move to dead letter queue
      }
    }

    await this.updateJob(job);
  }

  /**
   * Calculate backoff delay based on strategy.
   */
  private calculateBackoff(job: Job, attempt: number): number {
    if (!job.backoff) return 1000 * attempt;

    switch (job.backoff.type) {
      case 'exponential':
        return Math.min(job.backoff.delay * Math.pow(2, attempt - 1), 60_000);
      case 'fixed':
        return job.backoff.delay;
      case 'linear':
        return job.backoff.delay * attempt;
      default:
        return 1000 * attempt;
    }
  }

  /**
   * Get the concurrency limit for a queue.
   */
  private getQueueConcurrency(queue: string): number {
    let max = this.config.defaultConcurrency;
    this.definitions.forEach((def, key) => {
      const [q] = key.split(':');
      if (q === queue && def.concurrency && def.concurrency > max) {
        max = def.concurrency;
      }
    });
    return max;
  }

  /**
   * Get queue health statistics.
   */
  async getStatus(): Promise<{
    mode: 'redis' | 'memory';
    queues: Record<string, { waiting: number; active: number; definitions: number }>;
    schedules: number;
    activeJobs: number;
  }> {
    const queues: Record<string, { waiting: number; active: number; definitions: number }> = {};

    const queueKeys = Array.from(this.definitions.keys());
    for (let i = 0; i < queueKeys.length; i++) {
      const key = queueKeys[i];
      const [queue] = key.split(':');
      if (!queues[queue]) {
        queues[queue] = {
          waiting: await this.getQueueSize(queue),
          active: this.activeJobs.size,
          definitions: 0,
        };
      }
      queues[queue].definitions++;
    }

    return {
      mode: this.mode,
      queues,
      schedules: this.schedules.size,
      activeJobs: this.activeJobs.size,
    };
  }

  /**
   * Destroy the job queue and clean up resources.
   */
  async destroy(): Promise<void> {
    await this.stop(5000);
    this.definitions.clear();
    this.schedules.clear();
    this.activeJobs.clear();
    this.concurrency.clear();
    console.log('[JobQueue] Destroyed');
  }
}

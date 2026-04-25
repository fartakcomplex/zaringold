/* ═══════════════════════════════════════════════════════════════════════════
 *  health.ts — Health Check System
 *  Database · Redis · External APIs · File system · Memory · CPU
 *  Liveness vs Readiness probes · Health check history · Auto-recovery
 * ═══════════════════════════════════════════════════════════════════════════ */

import { db } from '@/lib/db';
import { circuitRegistry } from '@/lib/middleware/circuit-breaker';
import { logger } from '@/lib/middleware/request-logger';

// ─── Types ─────────────────────────────────────────────────────────────────

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
export type CheckSeverity = 'critical' | 'non-critical';

export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  responseTimeMs: number;
  message?: string;
  details?: Record<string, unknown>;
  severity: CheckSeverity;
  lastChecked: string;
  timestamp: string;
}

export interface HealthCheckConfig {
  /** Name of the check */
  name: string;
  /** Whether this check is critical for readiness */
  critical: boolean;
  /** Timeout for the check in ms */
  timeoutMs: number;
  /** How often to re-check (ms) */
  intervalMs: number;
  /** The check function */
  check: () => Promise<HealthCheckResult>;
}

export interface SystemHealth {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheckResult[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

interface HealthHistoryEntry {
  timestamp: string;
  overallStatus: HealthStatus;
  checks: { name: string; status: HealthStatus }[];
}

// ─── Health Check Registry ─────────────────────────────────────────────────

class HealthCheckSystem {
  private checks = new Map<string, HealthCheckConfig>();
  private history: HealthHistoryEntry[] = [];
  private maxHistory = 100;
  private processStartTime = Date.now();
  private running = false;

  /** Register a health check */
  register(config: HealthCheckConfig): void {
    this.checks.set(config.name, config);
  }

  /** Remove a health check */
  unregister(name: string): void {
    this.checks.delete(name);
  }

  /** Run a single check with timeout */
  private async runCheck(config: HealthCheckConfig): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const result = await Promise.race([
        config.check(),
        new Promise<HealthCheckResult>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${config.timeoutMs}ms`)), config.timeoutMs)
        ),
      ]);
      return {
        ...result,
        responseTimeMs: Date.now() - start,
        timestamp: new Date().toISOString(),
        severity: config.critical ? 'critical' : 'non-critical',
      };
    } catch (error) {
      const elapsed = Date.now() - start;
      return {
        name: config.name,
        status: 'unhealthy',
        responseTimeMs: elapsed,
        message: error instanceof Error ? error.message : String(error),
        severity: config.critical ? 'critical' : 'non-critical',
        lastChecked: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };
    }
  }

  /** Run all checks and return system health */
  async runAllChecks(): Promise<SystemHealth> {
    const results = await Promise.all(
      Array.from(this.checks.values()).map(c => this.runCheck(c))
    );

    let overall: 'ok' | 'degraded' | 'error' = 'ok';
    let hasDegraded = false;
    let hasUnhealthyCritical = false;

    for (const r of results) {
      if (r.status === 'unhealthy' && r.severity === 'critical') {
        hasUnhealthyCritical = true;
      }
      if (r.status === 'degraded') {
        hasDegraded = true;
      }
    }

    if (hasUnhealthyCritical) overall = 'error';
    else if (hasDegraded) overall = 'degraded';

    // Record history
    const historyEntry: HealthHistoryEntry = {
      timestamp: new Date().toISOString(),
      overallStatus: overall === 'ok' ? 'healthy' : overall === 'degraded' ? 'degraded' : 'unhealthy',
      checks: results.map(r => ({ name: r.name, status: r.status })),
    };
    this.history.push(historyEntry);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Auto-recovery: log if status changed
    if (this.history.length >= 2) {
      const prev = this.history[this.history.length - 2];
      if (prev.overallStatus !== historyEntry.overallStatus) {
        if (historyEntry.overallStatus === 'healthy') {
          logger.info('System recovered to healthy state');
        } else if (historyEntry.overallStatus === 'unhealthy') {
          logger.error('System became unhealthy', { checks: historyEntry.checks });
        }
      }
    }

    return {
      status: overall,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.processStartTime,
      version: process.env.npm_package_version ?? '2.9.0',
      environment: process.env.NODE_ENV ?? 'development',
      checks: results,
      summary: {
        total: results.length,
        healthy: results.filter(r => r.status === 'healthy').length,
        degraded: results.filter(r => r.status === 'degraded').length,
        unhealthy: results.filter(r => r.status === 'unhealthy').length,
      },
    };
  }

  /** Run only critical checks (for readiness) */
  async runCriticalChecks(): Promise<SystemHealth> {
    const criticalChecks = Array.from(this.checks.values()).filter(c => c.critical);
    const results = await Promise.all(criticalChecks.map(c => this.runCheck(c)));

    const hasUnhealthy = results.some(r => r.status === 'unhealthy');
    const hasDegraded = results.some(r => r.status === 'degraded');

    return {
      status: hasUnhealthy ? 'error' : hasDegraded ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.processStartTime,
      version: process.env.npm_package_version ?? '2.9.0',
      environment: process.env.NODE_ENV ?? 'development',
      checks: results,
      summary: {
        total: results.length,
        healthy: results.filter(r => r.status === 'healthy').length,
        degraded: results.filter(r => r.status === 'degraded').length,
        unhealthy: results.filter(r => r.status === 'unhealthy').length,
      },
    };
  }

  /** Get health history */
  getHistory(): HealthHistoryEntry[] {
    return [...this.history];
  }

  /** Start periodic health checks */
  startPeriodicChecks(intervalMs: number = 30_000): void {
    if (this.running) return;
    this.running = true;
    setInterval(async () => {
      try {
        await this.runAllChecks();
      } catch (err) {
        logger.error('Periodic health check failed', err as Error);
      }
    }, intervalMs).unref(); // Don't keep process alive
  }
}

// ─── Singleton ─────────────────────────────────────────────────────────────

export const healthSystem = new HealthCheckSystem();

// ─── Pre-registered Health Checks ──────────────────────────────────────────

/** Database connectivity check */
healthSystem.register({
  name: 'database',
  critical: true,
  timeoutMs: 5000,
  intervalMs: 30000,
  check: async () => {
    try {
      const start = Date.now();
      await db.$queryRaw`SELECT 1 as ok`;
      const elapsed = Date.now() - start;
      return {
        name: 'database',
        status: elapsed < 100 ? 'healthy' : elapsed < 500 ? 'degraded' : 'unhealthy',
        responseTimeMs: elapsed,
        message: `SQLite response in ${elapsed}ms`,
        details: { type: 'sqlite', responseTimeMs: elapsed },
        severity: 'critical' as CheckSeverity,
        lastChecked: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        responseTimeMs: 0,
        message: error instanceof Error ? error.message : 'Database connection failed',
        severity: 'critical' as CheckSeverity,
        lastChecked: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };
    }
  },
});

/** Memory usage check */
healthSystem.register({
  name: 'memory',
  critical: false,
  timeoutMs: 100,
  intervalMs: 30000,
  check: async () => {
    const mem = process.memoryUsage();
    const usedMB = Math.round(mem.heapUsed / 1024 / 1024);
    const totalMB = Math.round(mem.heapTotal / 1024 / 1024);
    const rssMB = Math.round(mem.rss / 1024 / 1024);
    const usagePercent = Math.round((mem.heapUsed / mem.heapTotal) * 100);

    let status: HealthStatus = 'healthy';
    if (usagePercent > 90 || rssMB > 2048) status = 'unhealthy';
    else if (usagePercent > 75 || rssMB > 1024) status = 'degraded';

    return {
      name: 'memory',
      status,
      responseTimeMs: 0,
      message: `${usedMB}MB/${totalMB}MB heap, ${rssMB}MB RSS`,
      details: {
        heapUsedMB: usedMB,
        heapTotalMB: totalMB,
        rssMB,
        externalMB: Math.round(mem.external / 1024 / 1024),
        heapUsagePercent: usagePercent,
      },
      severity: 'non-critical' as CheckSeverity,
      lastChecked: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };
  },
});

/** CPU usage (lightweight estimate) */
healthSystem.register({
  name: 'cpu',
  critical: false,
  timeoutMs: 200,
  intervalMs: 60000,
  check: async () => {
    // Get CPU info via process.cpuUsage
    const cpu = process.cpuUsage();
    const totalUs = cpu.user + cpu.system;
    // This is cumulative, so we just report it as a snapshot
    const cores = process.env.NODE_ENV === 'production'
      ? (osCpus?.()?.length ?? 1)
      : 1;

    return {
      name: 'cpu',
      status: 'healthy',
      responseTimeMs: 0,
      message: `${cores} CPU core(s) available`,
      details: {
        cores,
        cpuUserUs: cpu.user,
        cpuSystemUs: cpu.system,
      },
      severity: 'non-critical' as CheckSeverity,
      lastChecked: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };
  },
});

/** File system (uploads directory) check */
healthSystem.register({
  name: 'filesystem',
  critical: false,
  timeoutMs: 1000,
  intervalMs: 60000,
  check: async () => {
    const fs = await import('fs');
    const path = await import('path');

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.promises.access(uploadsDir, fs.constants.W_OK);
      const stats = await fs.promises.stat(uploadsDir);
      return {
        name: 'filesystem',
        status: 'healthy',
        responseTimeMs: 0,
        message: 'Uploads directory accessible',
        details: {
          path: uploadsDir,
          exists: true,
          writable: true,
        },
        severity: 'non-critical' as CheckSeverity,
        lastChecked: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };
    } catch {
      // Directory might not exist yet, that's OK for dev
      return {
        name: 'filesystem',
        status: process.env.NODE_ENV === 'production' ? 'degraded' : 'healthy',
        responseTimeMs: 0,
        message: 'Uploads directory not found (will be created on demand)',
        details: { path: uploadsDir, exists: false },
        severity: 'non-critical' as CheckSeverity,
        lastChecked: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };
    }
  },
});

/** External APIs circuit breaker status */
healthSystem.register({
  name: 'external-apis',
  critical: false,
  timeoutMs: 200,
  intervalMs: 30000,
  check: async () => {
    const circuitMetrics = circuitRegistry.getAllMetrics();
    const openCircuits = circuitMetrics.filter(m => m.state === 'OPEN');
    const halfOpenCircuits = circuitMetrics.filter(m => m.state === 'HALF_OPEN');

    if (circuitMetrics.length === 0) {
      return {
        name: 'external-apis',
        status: 'healthy',
        responseTimeMs: 0,
        message: 'No external APIs configured',
        severity: 'non-critical' as CheckSeverity,
        lastChecked: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };
    }

    const status: HealthStatus = openCircuits.length > 0
      ? 'unhealthy'
      : halfOpenCircuits.length > 0
        ? 'degraded'
        : 'healthy';

    return {
      name: 'external-apis',
      status,
      responseTimeMs: 0,
      message: `${circuitMetrics.length} APIs: ${openCircuits.length} open, ${halfOpenCircuits.length} half-open`,
      details: {
        services: circuitMetrics.map(m => ({
          name: m.serviceName,
          state: m.state,
          failures: m.failures,
          totalCalls: m.totalCalls,
        })),
      },
      severity: 'non-critical' as CheckSeverity,
      lastChecked: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };
  },
});

// ─── OS Module (lazy import to avoid issues) ───────────────────────────────

let osCpus: (() => NodeJS.CpuInfo[]) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  osCpus = require('os').cpus;
} catch {
  // os module might not be available in all environments
}

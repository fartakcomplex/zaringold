/* ═══════════════════════════════════════════════════════════════════════════
 *  circuit-breaker.ts — Circuit Breaker Pattern
 *  For external service calls (payment gateway, SMS, email, etc.)
 *  States: CLOSED → OPEN → HALF_OPEN → CLOSED ...
 * ═══════════════════════════════════════════════════════════════════════════ */

// ─── Types ─────────────────────────────────────────────────────────────────

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  /** Service name (used as breaker ID and in logs/metrics) */
  serviceName: string;
  /** Number of failures before opening the circuit */
  failureThreshold: number;
  /** Time in ms the circuit stays open before transitioning to HALF_OPEN */
  resetTimeoutMs: number;
  /** Number of successful calls in HALF_OPEN before closing */
  successThreshold?: number;
  /** Timeout for individual calls (ms) */
  callTimeoutMs?: number;
  /** Callback when state transitions */
  onStateChange?: (from: CircuitState, to: CircuitState, serviceName: string) => void;
  /** Callback for metric reporting */
  onMetric?: (metric: CircuitBreakerMetric) => void;
}

export interface CircuitBreakerMetric {
  serviceName: string;
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure?: number;
  lastSuccess?: number;
  totalCalls: number;
  totalErrors: number;
  avgResponseTimeMs?: number;
}

export interface CircuitBreakerResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  responseTimeMs: number;
  state: CircuitState;
  circuitOpen: boolean;
}

// ─── Circuit Breaker Implementation ────────────────────────────────────────

export class CircuitBreaker {
  private config: Required<CircuitBreakerConfig>;
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private totalCalls = 0;
  private totalErrors = 0;
  private totalResponseTimeMs = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private lastStateChangeTime = Date.now();
  private halfOpenSuccesses = 0;
  private rejectedCalls = 0;

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      successThreshold: 3,
      callTimeoutMs: 10_000,
      onStateChange: () => {},
      onMetric: () => {},
      ...config,
    };
  }

  /** Get the current circuit state */
  getState(): CircuitState {
    this.checkStateTransition();
    return this.state;
  }

  /** Check if the circuit allows requests */
  isAvailable(): boolean {
    return this.getState() !== 'OPEN';
  }

  /** Execute a function through the circuit breaker */
  async execute<T>(fn: () => Promise<T>): Promise<CircuitBreakerResult<T>> {
    this.checkStateTransition();

    // Reject if open
    if (this.state === 'OPEN') {
      this.rejectedCalls++;
      return {
        success: false,
        error: new Error(`Circuit breaker OPEN for service: ${this.config.serviceName}`),
        responseTimeMs: 0,
        state: this.state,
        circuitOpen: true,
      };
    }

    const startTime = Date.now();
    this.totalCalls++;

    try {
      // Wrap with timeout
      const result = await this.withTimeout(fn(), this.config.callTimeoutMs);
      const responseTimeMs = Date.now() - startTime;

      this.onSuccess(responseTimeMs);

      return {
        success: true,
        data: result,
        responseTimeMs,
        state: this.state,
        circuitOpen: false,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      this.onFailure(responseTimeMs, err);

      return {
        success: false,
        error: err,
        responseTimeMs,
        state: this.state,
        circuitOpen: this.state === 'OPEN',
      };
    }
  }

  /** Execute a sync function through the circuit breaker */
  executeSync<T>(fn: () => T): CircuitBreakerResult<T> {
    this.checkStateTransition();

    if (this.state === 'OPEN') {
      this.rejectedCalls++;
      return {
        success: false,
        error: new Error(`Circuit breaker OPEN for service: ${this.config.serviceName}`),
        responseTimeMs: 0,
        state: this.state,
        circuitOpen: true,
      };
    }

    const startTime = Date.now();
    this.totalCalls++;

    try {
      const result = fn();
      const responseTimeMs = Date.now() - startTime;
      this.onSuccess(responseTimeMs);
      return {
        success: true,
        data: result,
        responseTimeMs,
        state: this.state,
        circuitOpen: false,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));
      this.onFailure(responseTimeMs, err);
      return {
        success: false,
        error: err,
        responseTimeMs,
        state: this.state,
        circuitOpen: this.state === 'OPEN',
      };
    }
  }

  /** Reset the circuit breaker to CLOSED state */
  reset(): void {
    const prev = this.state;
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenSuccesses = 0;
    this.lastStateChangeTime = Date.now();
    if (prev !== 'CLOSED') {
      this.config.onStateChange(prev, 'CLOSED', this.config.serviceName);
    }
  }

  /** Force the circuit into OPEN state */
  trip(): void {
    const prev = this.state;
    this.state = 'OPEN';
    this.lastFailureTime = Date.now();
    this.lastStateChangeTime = Date.now();
    if (prev !== 'OPEN') {
      this.config.onStateChange(prev, 'OPEN', this.config.serviceName);
    }
  }

  /** Get current metrics */
  getMetrics(): CircuitBreakerMetric {
    return {
      serviceName: this.config.serviceName,
      state: this.state,
      failures: this.failureCount,
      successes: this.successCount,
      lastFailure: this.lastFailureTime ?? undefined,
      lastSuccess: this.lastSuccessTime ?? undefined,
      totalCalls: this.totalCalls,
      totalErrors: this.totalErrors,
      avgResponseTimeMs: this.totalCalls > 0
        ? Math.round(this.totalResponseTimeMs / this.totalCalls)
        : undefined,
    };
  }

  // ─── Private Methods ────────────────────────────────────────────────

  private checkStateTransition(): void {
    if (this.state === 'OPEN') {
      const elapsed = Date.now() - this.lastStateChangeTime;
      if (elapsed >= this.config.resetTimeoutMs) {
        this.transitionTo('HALF_OPEN');
      }
    }
  }

  private onSuccess(responseTimeMs: number): void {
    this.lastSuccessTime = Date.now();
    this.totalResponseTimeMs += responseTimeMs;

    switch (this.state) {
      case 'CLOSED':
        this.failureCount = 0;
        this.successCount++;
        break;
      case 'HALF_OPEN':
        this.halfOpenSuccesses++;
        this.successCount++;
        if (this.halfOpenSuccesses >= this.config.successThreshold) {
          this.failureCount = 0;
          this.transitionTo('CLOSED');
        }
        break;
    }

    this.reportMetric();
  }

  private onFailure(responseTimeMs: number, error: Error): void {
    this.lastFailureTime = Date.now();
    this.totalResponseTimeMs += responseTimeMs;
    this.totalErrors++;
    this.failureCount++;

    switch (this.state) {
      case 'CLOSED':
        if (this.failureCount >= this.config.failureThreshold) {
          this.transitionTo('OPEN');
        }
        break;
      case 'HALF_OPEN':
        this.transitionTo('OPEN');
        break;
    }

    this.reportMetric();
  }

  private transitionTo(newState: CircuitState): void {
    const prev = this.state;
    this.state = newState;
    this.lastStateChangeTime = Date.now();
    if (newState === 'HALF_OPEN') {
      this.halfOpenSuccesses = 0;
    }
    this.config.onStateChange(prev, newState, this.config.serviceName);
  }

  private reportMetric(): void {
    this.config.onMetric(this.getMetrics());
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`Call timeout after ${ms}ms`)), ms);
    });
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

// ─── Circuit Breaker Registry ──────────────────────────────────────────────

class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Create or get a circuit breaker for a service
   */
  getOrCreate(config: CircuitBreakerConfig): CircuitBreaker {
    let breaker = this.breakers.get(config.serviceName);
    if (!breaker) {
      breaker = new CircuitBreaker(config);
      this.breakers.set(config.serviceName, breaker);
    }
    return breaker;
  }

  get(serviceName: string): CircuitBreaker | undefined {
    return this.breakers.get(serviceName);
  }

  getAllMetrics(): CircuitBreakerMetric[] {
    return Array.from(this.breakers.values()).map(b => b.getMetrics());
  }

  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /** Execute a call through a registered circuit breaker */
  async call<T>(serviceName: string, fn: () => Promise<T>): Promise<CircuitBreakerResult<T>> {
    const breaker = this.breakers.get(serviceName);
    if (!breaker) {
      throw new Error(`No circuit breaker registered for: ${serviceName}`);
    }
    return breaker.execute(fn);
  }
}

// ─── Singleton Registry ────────────────────────────────────────────────────

export const circuitRegistry = new CircuitBreakerRegistry();

// ─── Pre-configured Breakers ───────────────────────────────────────────────

export const paymentBreaker = circuitRegistry.getOrCreate({
  serviceName: 'payment-gateway',
  failureThreshold: 3,
  resetTimeoutMs: 30_000,
  successThreshold: 2,
  callTimeoutMs: 15_000,
});

export const smsBreaker = circuitRegistry.getOrCreate({
  serviceName: 'sms-provider',
  failureThreshold: 5,
  resetTimeoutMs: 60_000,
  successThreshold: 2,
  callTimeoutMs: 10_000,
});

export const emailBreaker = circuitRegistry.getOrCreate({
  serviceName: 'email-provider',
  failureThreshold: 5,
  resetTimeoutMs: 60_000,
  successThreshold: 2,
  callTimeoutMs: 10_000,
});

export const goldPriceBreaker = circuitRegistry.getOrCreate({
  serviceName: 'gold-price-feed',
  failureThreshold: 3,
  resetTimeoutMs: 15_000,
  successThreshold: 1,
  callTimeoutMs: 5_000,
});

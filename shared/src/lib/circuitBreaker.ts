// shared/src/lib/circuitBreaker.ts
// Robust Circuit Breaker pattern implementation for external APIs (Google Maps, SMS Gateway)

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  name: string;
  failureThreshold?: number; // Number of consecutive failures before opening circuit (default: 5)
  resetTimeoutMs?: number; // Time in ms to stay in OPEN state before testing HALF_OPEN (default: 30000)
  halfOpenSuccessThreshold?: number; // Consecutive successes needed in HALF_OPEN to close (default: 2)
  onStateChange?: (from: CircuitState, to: CircuitState, breakerName: string) => void;
}

export class CircuitBreakerError extends Error {
  constructor(public readonly breakerName: string) {
    super(`Circuit breaker '${breakerName}' is OPEN. Fast-failing request.`);
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreaker {
  public readonly name: string;
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private nextAttemptTimestamp = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly halfOpenSuccessThreshold: number;
  private readonly onStateChange?: (from: CircuitState, to: CircuitState, breakerName: string) => void;

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30000;
    this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold ?? 2;
    this.onStateChange = options.onStateChange;
  }

  public getState(): CircuitState {
    if (this.state === 'OPEN' && Date.now() >= this.nextAttemptTimestamp) {
      this.transitionTo('HALF_OPEN');
    }
    return this.state;
  }

  public getStats(): {
    name: string;
    state: CircuitState;
    failureCount: number;
    successCount: number;
  } {
    return {
      name: this.name,
      state: this.getState(),
      failureCount: this.failureCount,
      successCount: this.successCount,
    };
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    if (oldState === newState) return;

    this.state = newState;
    if (newState === 'OPEN') {
      this.nextAttemptTimestamp = Date.now() + this.resetTimeoutMs;
      this.successCount = 0;
    } else if (newState === 'CLOSED') {
      this.failureCount = 0;
      this.successCount = 0;
    } else if (newState === 'HALF_OPEN') {
      this.successCount = 0;
    }

    if (this.onStateChange) {
      this.onStateChange(oldState, newState, this.name);
    }
  }

  public async execute<T>(action: () => Promise<T>, fallback?: () => Promise<T> | T): Promise<T> {
    const currentState = this.getState();

    if (currentState === 'OPEN') {
      if (fallback) {
        return fallback();
      }
      throw new CircuitBreakerError(this.name);
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) {
        return fallback();
      }
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount += 1;
      if (this.successCount >= this.halfOpenSuccessThreshold) {
        this.transitionTo('CLOSED');
      }
    } else if (this.state === 'CLOSED') {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN');
    } else if (this.state === 'CLOSED') {
      this.failureCount += 1;
      if (this.failureCount >= this.failureThreshold) {
        this.transitionTo('OPEN');
      }
    }
  }

  public reset(): void {
    this.transitionTo('CLOSED');
  }

  public forceOpen(): void {
    this.transitionTo('OPEN');
  }
}

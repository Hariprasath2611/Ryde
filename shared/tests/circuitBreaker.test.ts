// shared/tests/circuitBreaker.test.ts
import { describe, it, expect, vi } from 'vitest';
import { CircuitBreaker, CircuitBreakerError } from '../src/lib/circuitBreaker.js';

describe('CircuitBreaker', () => {
  it('starts in CLOSED state and executes successful action', async () => {
    const breaker = new CircuitBreaker({
      name: 'test-breaker',
      failureThreshold: 3,
      resetTimeoutMs: 1000,
    });

    expect(breaker.getState()).toBe('CLOSED');

    const result = await breaker.execute(async () => 'success');
    expect(result).toBe('success');
    expect(breaker.getState()).toBe('CLOSED');
  });

  it('trips to OPEN state when failureThreshold is reached', async () => {
    const onStateChange = vi.fn();
    const breaker = new CircuitBreaker({
      name: 'test-breaker',
      failureThreshold: 3,
      resetTimeoutMs: 1000,
      onStateChange,
    });

    const failingAction = async () => {
      throw new Error('downstream error');
    };

    // 1st failure
    await expect(breaker.execute(failingAction)).rejects.toThrow('downstream error');
    expect(breaker.getState()).toBe('CLOSED');

    // 2nd failure
    await expect(breaker.execute(failingAction)).rejects.toThrow('downstream error');
    expect(breaker.getState()).toBe('CLOSED');

    // 3rd failure: trips breaker
    await expect(breaker.execute(failingAction)).rejects.toThrow('downstream error');
    expect(breaker.getState()).toBe('OPEN');
    expect(onStateChange).toHaveBeenCalledWith('CLOSED', 'OPEN', 'test-breaker');

    // 4th call: fast fails with CircuitBreakerError without executing action
    const mockAction = vi.fn();
    await expect(breaker.execute(mockAction)).rejects.toThrow(CircuitBreakerError);
    expect(mockAction).not.toHaveBeenCalled();
  });

  it('uses fallback value when provided in OPEN or failing state', async () => {
    const breaker = new CircuitBreaker({
      name: 'test-breaker',
      failureThreshold: 1,
      resetTimeoutMs: 1000,
    });

    // Failing with fallback
    const res1 = await breaker.execute(
      async () => {
        throw new Error('fail');
      },
      () => 'fallback-value',
    );
    expect(res1).toBe('fallback-value');
    expect(breaker.getState()).toBe('OPEN');

    // OPEN state fast fallback
    const res2 = await breaker.execute(
      async () => 'unreachable',
      () => 'fallback-again',
    );
    expect(res2).toBe('fallback-again');
  });

  it('transitions from OPEN to HALF_OPEN after resetTimeout, then back to CLOSED on success', async () => {
    vi.useFakeTimers();

    const breaker = new CircuitBreaker({
      name: 'test-breaker',
      failureThreshold: 1,
      resetTimeoutMs: 1000,
      halfOpenSuccessThreshold: 2,
    });

    await expect(
      breaker.execute(async () => {
        throw new Error('fail');
      }),
    ).rejects.toThrow();
    expect(breaker.getState()).toBe('OPEN');

    // Advance time past resetTimeoutMs
    vi.advanceTimersByTime(1001);
    expect(breaker.getState()).toBe('HALF_OPEN');

    // 1st success in HALF_OPEN
    await breaker.execute(async () => 'ok1');
    expect(breaker.getState()).toBe('HALF_OPEN');

    // 2nd success in HALF_OPEN -> closes circuit
    await breaker.execute(async () => 'ok2');
    expect(breaker.getState()).toBe('CLOSED');

    vi.useRealTimers();
  });
});

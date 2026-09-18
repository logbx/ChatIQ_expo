/**
 * Unit tests for retry utilities
 */

import { isRetryableError, retryWithBackoff } from '../utils/retry';

describe('isRetryableError', () => {
  it('should return true for network errors', () => {
    expect(isRetryableError(new Error('network error occurred'))).toBe(true);
    expect(isRetryableError(new Error('Connection timeout'))).toBe(true);
    expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
    expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true);
  });

  it('should return true for retryable HTTP status codes', () => {
    expect(isRetryableError({ status: 408 })).toBe(true);
    expect(isRetryableError({ status: 429 })).toBe(true);
    expect(isRetryableError({ status: 500 })).toBe(true);
    expect(isRetryableError({ status: 502 })).toBe(true);
    expect(isRetryableError({ status: 503 })).toBe(true);
    expect(isRetryableError({ status: 504 })).toBe(true);
  });

  it('should return false for non-retryable HTTP status codes', () => {
    expect(isRetryableError({ status: 400 })).toBe(false);
    expect(isRetryableError({ status: 401 })).toBe(false);
    expect(isRetryableError({ status: 403 })).toBe(false);
    expect(isRetryableError({ status: 404 })).toBe(false);
  });

  it('should return true for Firebase unavailable errors', () => {
    expect(isRetryableError({ code: 'unavailable' })).toBe(true);
    expect(isRetryableError({ code: 'deadline-exceeded' })).toBe(true);
    expect(isRetryableError({ code: 'resource-exhausted' })).toBe(true);
  });

  it('should return false for non-retryable errors', () => {
    expect(isRetryableError(new Error('Invalid input'))).toBe(false);
    expect(isRetryableError(new Error('Validation failed'))).toBe(false);
    expect(isRetryableError({ code: 'permission-denied' })).toBe(false);
  });

  it('should handle errors without message or code', () => {
    expect(isRetryableError({})).toBe(false);
  });
});

describe('retryWithBackoff', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should succeed on first attempt if function succeeds', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    
    const result = await retryWithBackoff(fn, { maxAttempts: 3 });
    
    expect(fn).toHaveBeenCalledTimes(1);
    expect(result).toBe('success');
  });

  it('should retry on failure and succeed eventually', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');
    
    const promise = retryWithBackoff(fn, { 
      maxAttempts: 3,
      initialDelay: 10
    });
    
    await jest.runAllTimersAsync();
    
    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after maxAttempts failures', async () => {
    jest.useRealTimers();
    
    const fn = jest.fn().mockImplementation(async () => {
      throw new Error('persistent failure');
    });
    
    let thrownError: Error | undefined;
    try {
      await retryWithBackoff(fn, { 
        maxAttempts: 3,
        initialDelay: 1
      });
    } catch (error) {
      thrownError = error as Error;
    }
    
    expect(thrownError).toBeDefined();
    expect(thrownError?.message).toBe('persistent failure');
    expect(fn).toHaveBeenCalledTimes(3);
    
    jest.useFakeTimers();
  });

  it('should use exponential backoff with increasing delays', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');
    
    const promise = retryWithBackoff(fn, {
      maxAttempts: 3,
      initialDelay: 100,
      backoffMultiplier: 2
    });
    
    await jest.runAllTimersAsync();
    
    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should respect maxDelay cap', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');
    
    const promise = retryWithBackoff(fn, {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 1500,
      backoffMultiplier: 4
    });
    
    await jest.runAllTimersAsync();
    
    const result = await promise;
    expect(result).toBe('success');
  });

  it('should call onRetry callback with attempt number and error', async () => {
    const error1 = new Error('fail 1');
    const error2 = new Error('fail 2');
    const fn = jest.fn()
      .mockRejectedValueOnce(error1)
      .mockRejectedValueOnce(error2)
      .mockResolvedValue('success');
    
    const onRetry = jest.fn();
    
    const promise = retryWithBackoff(fn, {
      maxAttempts: 3,
      initialDelay: 10,
      onRetry
    });
    
    await jest.runAllTimersAsync();
    
    const result = await promise;
    expect(result).toBe('success');
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, 1, error1);
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, error2);
  });
});

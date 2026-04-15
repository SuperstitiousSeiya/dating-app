/**
 * Pauses execution for `ms` milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type RetryOptions = {
  /** Maximum number of attempts (including the first). Default: 3 */
  maxAttempts?: number;
  /** Base delay in ms for exponential backoff. Default: 200 */
  baseDelayMs?: number;
  /** Maximum delay cap in ms. Default: 5000 */
  maxDelayMs?: number;
  /** Jitter factor (0–1). Adds randomness to avoid thundering herd. Default: 0.2 */
  jitter?: number;
  /** Predicate to decide whether to retry on a given error. Default: always retry. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};

/**
 * Retries an async operation with exponential backoff and optional jitter.
 *
 * @example
 * const result = await withRetry(() => fetch("/api/data"), { maxAttempts: 4 });
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 200,
    maxDelayMs = 5000,
    jitter = 0.2,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts || !shouldRetry(err, attempt)) throw err;

      const exponentialDelay = baseDelayMs * 2 ** (attempt - 1);
      const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
      const jitterMs = cappedDelay * jitter * Math.random();
      await sleep(cappedDelay + jitterMs);
    }
  }

  throw lastError;
}

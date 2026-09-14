import { isAppError } from "@/lib/http/errors";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type TmdbLimiterStats = {
  requests: number;
  retries: number;
  throttleWaitMs: number;
  notFound: number;
};

export class TmdbRequestLimiter {
  private tokens: number;
  private lastRefill: number;
  private active = 0;
  private readonly waitQueue: Array<() => void> = [];
  readonly stats: TmdbLimiterStats = {
    requests: 0,
    retries: 0,
    throttleWaitMs: 0,
    notFound: 0,
  };

  constructor(
    private readonly requestsPerSecond = 40,
    private readonly maxConcurrency = 8,
  ) {
    this.tokens = requestsPerSecond;
    this.lastRefill = Date.now();
  }

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const added = (elapsed / 1000) * this.requestsPerSecond;
    if (added <= 0) {
      return;
    }

    this.tokens = Math.min(this.requestsPerSecond, this.tokens + added);
    this.lastRefill = now;
  }

  private async acquireToken() {
    const started = Date.now();
    for (;;) {
      this.refill();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        this.stats.throttleWaitMs += Date.now() - started;
        return;
      }

      const waitMs = Math.ceil(
        ((1 - this.tokens) / this.requestsPerSecond) * 1000,
      );
      await sleep(Math.max(waitMs, 10));
    }
  }

  private async acquireSlot() {
    if (this.active < this.maxConcurrency) {
      this.active += 1;
      return;
    }

    await new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  private releaseSlot() {
    const next = this.waitQueue.shift();
    if (next) {
      next();
      return;
    }

    this.active -= 1;
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquireSlot();
    try {
      let attempt = 0;
      for (;;) {
        await this.acquireToken();
        this.stats.requests += 1;
        try {
          return await fn();
        } catch (error) {
          if (isAppError(error) && error.status === 404) {
            this.stats.notFound += 1;
            throw error;
          }

          const retryable =
            isAppError(error) && (error.status === 429 || error.status === 502);
          attempt += 1;
          if (!retryable || attempt > 5) {
            throw error;
          }

          this.stats.retries += 1;
          const details = error.details as
            | { retryAfterSeconds?: number }
            | undefined;
          const retryAfterMs =
            typeof details?.retryAfterSeconds === "number"
              ? details.retryAfterSeconds * 1000
              : Math.min(2000, 250 * 2 ** (attempt - 1));
          await sleep(retryAfterMs);
        }
      }
    } finally {
      this.releaseSlot();
    }
  }
}

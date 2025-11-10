import { describe, expect, it, vi } from "vitest";
import { RateLimiter } from "../src/request/rate-limiter";

describe("RateLimiter", () => {
  it("waits for tokens to refill before resolving", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);

    try {
      const limiter = new RateLimiter({ capacity: 2, refillPerSecond: 2 });

      await limiter.removeTokens(1);
      await limiter.removeTokens(1);

      let resolved = false;
      const thirdRequest = limiter.removeTokens(1).then(() => {
        resolved = true;
      });

      expect(resolved).toBe(false);

      await vi.advanceTimersByTimeAsync(500);
      await vi.runAllTimersAsync();
      await thirdRequest;

      expect(resolved).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

export class RateLimiter {
  private tokens: number;
  private last: number;
  private capacity: number;
  private refillRatePerMs: number;

  constructor({ capacity = 5, refillPerSecond = 1 } = {}) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.last = Date.now();
    this.refillRatePerMs = refillPerSecond / 1000;
  }

  private refill() {
    const now = Date.now();
    const dt = now - this.last;
    const add = dt * this.refillRatePerMs;
    if (add > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + add);
      this.last = now;
    }
  }

  public async removeTokens(n = 1): Promise<void> {
    while (true) {
      this.refill();
      if (this.tokens >= n) {
        this.tokens -= n;
        return;
      }
      // sleep a bit
      await new Promise((r) => setTimeout(r, 50));
    }
  }
}

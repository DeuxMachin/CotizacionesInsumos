// Simple in-memory token bucket rate limiter
// Note: For multi-instance deployments, use a shared store (Redis). This in-memory limiter
// protects a single instance and is meant as a lightweight safeguard.

type Bucket = {
  tokens: number;
  lastRefill: number; // epoch ms
};

export class RateLimiter {
  private capacity: number;
  private refillIntervalMs: number;
  private refillAmount: number;
  private buckets: Map<string, Bucket> = new Map();

  constructor(options: { capacity: number; refillIntervalMs: number; refillAmount: number }) {
    this.capacity = options.capacity;
    this.refillIntervalMs = options.refillIntervalMs;
    this.refillAmount = options.refillAmount;
  }

  allow(key: string): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    // Refill tokens discretely by intervals passed
    const intervals = Math.floor((now - bucket.lastRefill) / this.refillIntervalMs);
    if (intervals > 0) {
      bucket.tokens = Math.min(this.capacity, bucket.tokens + intervals * this.refillAmount);
      bucket.lastRefill = bucket.lastRefill + intervals * this.refillIntervalMs;
    }

    if (bucket.tokens > 0) {
      bucket.tokens -= 1;
      return true;
    }
    return false;
  }
}

// Export preconfigured limiters
// Login: 5 requests per minute por IP+email
export const loginLimiter = new RateLimiter({ capacity: 5, refillIntervalMs: 60_000, refillAmount: 5 });

// Refresh: 20 requests por minuto por IP
export const refreshLimiter = new RateLimiter({ capacity: 20, refillIntervalMs: 60_000, refillAmount: 20 });

// Forgot-password: 3 por hora por IP+email
export const forgotPasswordLimiter = new RateLimiter({ capacity: 3, refillIntervalMs: 60 * 60_000, refillAmount: 3 });

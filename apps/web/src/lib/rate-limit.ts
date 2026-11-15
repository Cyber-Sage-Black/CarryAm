import { LRUCache } from 'lru-cache';

// ====================================================================
// IN-MEMORY RATE LIMITER (per-IP / per-identifier)
// Suitable for single-instance deployments (Vercel Serverless).
// For multi-instance, use Upstash Redis rate limiting.
// ====================================================================

interface RateLimitOptions {
  /** Maximum number of requests in the window */
  readonly maxRequests: number;
  /** Window duration in milliseconds */
  readonly windowMs: number;
}

interface RateLimitEntry {
  readonly count: number;
  readonly resetTime: number;
}

/**
 * Creates a rate limiter with configurable max requests per window.
 *
 * Usage in an API route:
 * ```ts
 * const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 });
 *
 * export async function POST(req: Request) {
 *   const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
 *   const result = limiter.check(ip);
 *   if (!result.allowed) {
 *     return Response.json({ error: 'Too many requests' }, { status: 429 });
 *   }
 *   // ... handle request
 * }
 * ```
 */
export function createRateLimiter(options: RateLimitOptions) {
  const cache = new LRUCache<string, RateLimitEntry>({
    max: 500, // Track up to 500 unique identifiers
    ttl: options.windowMs,
  });

  return {
    check(identifier: string): {
      readonly allowed: boolean;
      readonly remaining: number;
      readonly resetTime: number;
    } {
      const now = Date.now();
      const existing = cache.get(identifier);

      if (!existing || now >= existing.resetTime) {
        // New window
        const entry: RateLimitEntry = {
          count: 1,
          resetTime: now + options.windowMs,
        };
        cache.set(identifier, entry);
        return {
          allowed: true,
          remaining: options.maxRequests - 1,
          resetTime: entry.resetTime,
        };
      }

      if (existing.count >= options.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: existing.resetTime,
        };
      }

      // Increment count (immutable pattern — create new entry)
      const updated: RateLimitEntry = {
        count: existing.count + 1,
        resetTime: existing.resetTime,
      };
      cache.set(identifier, updated);

      return {
        allowed: true,
        remaining: options.maxRequests - updated.count,
        resetTime: updated.resetTime,
      };
    },
  };
}

// Pre-configured limiters for common use cases
export const otpVerifyLimiter = createRateLimiter({
  maxRequests: 3,
  windowMs: 60_000, // 3 attempts per minute
});

export const apiGeneralLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60_000, // 30 requests per minute
});

export const paymentLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 300_000, // 5 payment attempts per 5 minutes
});

export const kycLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 300_000, // 5 KYC attempts per 5 minutes
});

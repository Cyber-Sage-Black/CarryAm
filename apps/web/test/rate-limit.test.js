const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { LRUCache } = require('lru-cache');

// Mirror createRateLimiter logic for direct testing
function createRateLimiter(options) {
  const cache = new LRUCache({
    max: 500,
    ttl: options.windowMs,
  });

  return {
    check(identifier) {
      const now = Date.now();
      const existing = cache.get(identifier);

      if (!existing || now >= existing.resetTime) {
        const entry = {
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

      const updated = {
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

describe('CarryAm Rate Limiting Engine', () => {
  test('allows requests within limit and decrements remaining', () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 10000 });

    const r1 = limiter.check('user_1');
    assert.equal(r1.allowed, true);
    assert.equal(r1.remaining, 2);

    const r2 = limiter.check('user_1');
    assert.equal(r2.allowed, true);
    assert.equal(r2.remaining, 1);

    const r3 = limiter.check('user_1');
    assert.equal(r3.allowed, true);
    assert.equal(r3.remaining, 0);
  });

  test('blocks requests exceeding maximum threshold', () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 10000 });

    limiter.check('user_blocked');
    limiter.check('user_blocked');

    const blocked = limiter.check('user_blocked');
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
  });

  test('isolates limits across different client identifiers', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 10000 });

    const clientA = limiter.check('client_A');
    assert.equal(clientA.allowed, true);

    // client_A is now blocked
    const clientABlocked = limiter.check('client_A');
    assert.equal(clientABlocked.allowed, false);

    // client_B is unaffected
    const clientB = limiter.check('client_B');
    assert.equal(clientB.allowed, true);
  });
});

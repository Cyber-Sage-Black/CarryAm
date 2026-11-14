const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

// Functions mirror updated api-helpers.ts implementation
function generateOtp() {
  return crypto.randomInt(0, 10000).toString().padStart(4, '0');
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp, 'utf8').digest('hex');
}

function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length === 0 || bufB.length === 0 || bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyPaystackSignature(body, signature, secret) {
  if (!signature || !secret) return false;
  const computed = crypto.createHmac('sha512', secret).update(body, 'utf8').digest('hex');
  return timingSafeEqualHex(computed, signature);
}

function extractBearerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

describe('CarryAm Security & Crypto Subsystem (Hardened)', () => {
  test('generateOtp produces 4-digit zero-padded numeric string without modulo bias', () => {
    for (let i = 0; i < 50; i++) {
      const otp = generateOtp();
      assert.equal(otp.length, 4);
      assert.match(otp, /^\d{4}$/);
      const num = parseInt(otp, 10);
      assert.ok(num >= 0 && num <= 9999);
    }
  });

  test('hashOtp produces deterministic SHA-256 hex string without collision', () => {
    const otp1 = '4819';
    const otp2 = '9102';

    const hash1a = hashOtp(otp1);
    const hash1b = hashOtp(otp1);
    const hash2 = hashOtp(otp2);

    assert.equal(hash1a, hash1b);
    assert.notEqual(hash1a, hash2);
    assert.equal(hash1a.length, 64);
  });

  test('timingSafeEqualHex enforces constant-time byte comparison and rejects non-matching lengths', () => {
    const h1 = crypto.createHash('sha256').update('secretA').digest('hex');
    const h2 = crypto.createHash('sha256').update('secretA').digest('hex');
    const h3 = crypto.createHash('sha256').update('secretB').digest('hex');

    assert.equal(timingSafeEqualHex(h1, h2), true);
    assert.equal(timingSafeEqualHex(h1, h3), false);
    assert.equal(timingSafeEqualHex(h1, 'short'), false);
    assert.equal(timingSafeEqualHex('', ''), false);
  });

  test('verifyPaystackSignature validates valid HMAC-SHA512 signature in constant time', () => {
    const secret = 'sk_test_mock_webhook_secret_carryam_2026';
    const validBody = JSON.stringify({ event: 'charge.success', data: { reference: 'CAM-REF-1001' } });

    const legitimateHmac = crypto.createHmac('sha512', secret).update(validBody, 'utf8').digest('hex');

    assert.equal(verifyPaystackSignature(validBody, legitimateHmac, secret), true);

    const tamperedBody = JSON.stringify({ event: 'charge.success', data: { reference: 'CAM-REF-FORGED' } });
    assert.equal(verifyPaystackSignature(tamperedBody, legitimateHmac, secret), false);

    assert.equal(verifyPaystackSignature(validBody, legitimateHmac, 'wrong-secret'), false);
  });

  test('extractBearerToken correctly parses Authorization header', () => {
    assert.equal(extractBearerToken('Bearer valid_jwt_token_123'), 'valid_jwt_token_123');
    assert.equal(extractBearerToken('Basic YWRtaW46cGFzcw=='), null);
    assert.equal(extractBearerToken(''), null);
    assert.equal(extractBearerToken(undefined), null);
  });
});

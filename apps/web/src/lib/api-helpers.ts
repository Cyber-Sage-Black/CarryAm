import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import type { ZodSchema } from 'zod';

// ====================================================================
// API ROUTE HELPERS
// Standard response envelope, error handling, auth extraction,
// and constant-time cryptographic verification.
// ====================================================================

/** Standard API response envelope */
export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: string | null;
  readonly meta?: {
    readonly total?: number;
    readonly page?: number;
    readonly limit?: number;
  };
}

/** Return a success response */
export function apiSuccess<T>(data: T, status = 200, meta?: ApiResponse['meta']): NextResponse {
  const body: ApiResponse<T> = { success: true, data, error: null, meta };
  return NextResponse.json(body, { status });
}

/** Return a sanitized error response (no internal DB or stack traces leaked) */
export function apiError(message: string, status = 400): NextResponse {
  const body: ApiResponse<null> = { success: false, data: null, error: message };
  return NextResponse.json(body, { status });
}

/** Parse and validate request JSON body against a Zod schema */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return { data: null, error: apiError('Invalid JSON body', 400) };
  }

  const result = schema.safeParse(rawBody);
  if (!result.success) {
    const firstError = result.error.errors[0];
    const message = firstError
      ? `${firstError.path.join('.')}: ${firstError.message}`
      : 'Validation failed';
    return { data: null, error: apiError(message, 422) };
  }

  return { data: result.data, error: null };
}

/** Extract Bearer token from Authorization header */
export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/** Extract client IP from headers */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

/**
 * Generate a cryptographically unbiased 4-digit OTP.
 * Uses crypto.randomInt to eliminate modulo bias.
 */
export function generateOtp(): string {
  return crypto.randomInt(0, 10000).toString().padStart(4, '0');
}

/**
 * Hash an OTP using SHA-256 for server-side storage.
 * Plaintext OTPs must never be persisted to the database.
 */
export async function hashOtp(otp: string): Promise<string> {
  return crypto.createHash('sha256').update(otp, 'utf8').digest('hex');
}

/**
 * Constant-time comparison of two hex-encoded strings.
 * Prevents timing side-channel attacks on HMAC digests and OTP hashes.
 */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length === 0 || bufB.length === 0 || bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verify Paystack webhook signature using constant-time comparison.
 * Protects against timing side-channel attacks on webhook validation.
 */
export function verifyPaystackSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature || !secret) {
    return false;
  }
  const computedSignature = crypto
    .createHmac('sha512', secret)
    .update(body, 'utf8')
    .digest('hex');

  return timingSafeEqualHex(computedSignature, signature);
}

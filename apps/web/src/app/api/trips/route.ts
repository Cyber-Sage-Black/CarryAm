import { apiSuccess, apiError, extractBearerToken, getClientIp } from '@/lib/api-helpers';
import { createUserScopedClient } from '@/lib/supabase';
import { apiGeneralLimiter } from '@/lib/rate-limit';
import { listTrips } from '@/lib/db';

/**
 * GET /api/trips — List available trips on the corridor.
 * Public endpoint (no auth required for browsing).
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limit = apiGeneralLimiter.check(ip);
  if (!limit.allowed) {
    return apiError('Too many requests. Please try again later.', 429);
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? 'SCHEDULED';
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '20')));

    const { trips, total } = await listTrips({
      status,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return apiSuccess(trips, 200, { total, page, limit: pageSize });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch trips';
    return apiError(message, 500);
  }
}

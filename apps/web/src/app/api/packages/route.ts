import { apiSuccess, apiError, getClientIp } from '@/lib/api-helpers';
import { apiGeneralLimiter } from '@/lib/rate-limit';
import { listPackages } from '@/lib/db';

/**
 * GET /api/packages — List packages on the corridor (consignment board).
 * Public endpoint for browsing.
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limit = apiGeneralLimiter.check(ip);
  if (!limit.allowed) {
    return apiError('Too many requests. Please try again later.', 429);
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '20')));

    const { packages, total } = await listPackages({
      status,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return apiSuccess(packages, 200, { total, page, limit: pageSize });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch packages';
    return apiError(message, 500);
  }
}

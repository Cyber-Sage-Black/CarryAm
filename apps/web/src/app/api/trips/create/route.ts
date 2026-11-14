import { apiSuccess, apiError, extractBearerToken, parseBody, getClientIp } from '@/lib/api-helpers';
import { createTripSchema } from '@/lib/validations';
import { createUserScopedClient } from '@/lib/supabase';
import { apiGeneralLimiter } from '@/lib/rate-limit';
import { createTrip } from '@/lib/db';

/**
 * POST /api/trips/create — Register a new trip on the corridor.
 * Requires authentication.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = apiGeneralLimiter.check(ip);
  if (!limit.allowed) {
    return apiError('Too many requests. Please try again later.', 429);
  }

  // Auth check
  const token = extractBearerToken(request);
  if (!token) {
    return apiError('Authentication required', 401);
  }

  const supabase = createUserScopedClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return apiError('Invalid or expired session', 401);
  }

  // Validate body
  const parsed = await parseBody(request, createTripSchema);
  if (parsed.error) {
    return parsed.error;
  }

  try {
    const trip = await createTrip(user.id, parsed.data);
    return apiSuccess(trip, 201);
  } catch {
    return apiError('Failed to create trip. Please try again.', 500);
  }
}

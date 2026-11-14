import { apiSuccess, apiError, extractBearerToken, getClientIp } from '@/lib/api-helpers';
import { createUserScopedClient } from '@/lib/supabase';
import { apiGeneralLimiter } from '@/lib/rate-limit';
import { listAgreements, getAgreement } from '@/lib/db';

/**
 * GET /api/agreements — List agreements for the authenticated user.
 * Returns agreements where user is either sender or carrier.
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limit = apiGeneralLimiter.check(ip);
  if (!limit.allowed) {
    return apiError('Too many requests.', 429);
  }

  const token = extractBearerToken(request);
  if (!token) {
    return apiError('Authentication required', 401);
  }

  const supabase = createUserScopedClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return apiError('Invalid or expired session', 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') ?? 'all';
    const agreementId = searchParams.get('id');

    // Single agreement lookup
    if (agreementId) {
      const agreement = await getAgreement(agreementId);
      // Verify user has access
      if (agreement.sender_id !== user.id && agreement.carrier_id !== user.id) {
        return apiError('Access denied', 403);
      }
      return apiSuccess(agreement);
    }

    // List by role
    const filters: { senderId?: string; carrierId?: string } = {};
    if (role === 'sender') {
      filters.senderId = user.id;
    } else if (role === 'carrier') {
      filters.carrierId = user.id;
    } else {
      // For 'all', we need to fetch both and merge
      const [senderAgreements, carrierAgreements] = await Promise.all([
        listAgreements({ senderId: user.id }),
        listAgreements({ carrierId: user.id }),
      ]);

      // Deduplicate by ID
      const seen = new Set<string>();
      const merged = [...senderAgreements, ...carrierAgreements].filter(a => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });

      return apiSuccess(merged);
    }

    const agreements = await listAgreements(filters);
    return apiSuccess(agreements);
  } catch {
    return apiError('Failed to fetch agreements. Please try again later.', 500);
  }
}

import { apiSuccess, apiError, extractBearerToken, parseBody, getClientIp } from '@/lib/api-helpers';
import { createAgreementSchema } from '@/lib/validations';
import { createUserScopedClient } from '@/lib/supabase';
import { apiGeneralLimiter } from '@/lib/rate-limit';
import { createAgreement, getTrip } from '@/lib/db';

/**
 * POST /api/agreements/create — Create a delivery agreement.
 * Sender and carrier must agree. OTPs are generated server-side
 * and sent via SMS — NEVER returned to the client.
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
  const parsed = await parseBody(request, createAgreementSchema);
  if (parsed.error) {
    return parsed.error;
  }

  try {
    // Look up the trip to get the carrier ID
    const trip = await getTrip(parsed.data.tripId);
    const carrierId = trip.carrier_id;

    // The authenticated user is the sender
    const result = await createAgreement(user.id, carrierId, parsed.data);

    // TODO: Send OTPs via SMS (Termii / WhatsApp Cloud API)
    // await sendSms(senderPhone, `Your CarryAm Handover Code: ${result.otps.handoverOtp}`);
    // await sendSms(receiverPhone, `Your CarryAm Delivery Code: ${result.otps.deliveryOtp}`);

    // Return agreement data WITHOUT plaintext OTPs
    return apiSuccess(
      {
        agreement: result.agreement,
        sealSerialNumber: result.sealSerialNumber,
        message: 'Agreement created. OTP codes have been sent via SMS.',
      },
      201,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create agreement';
    return apiError(message, 500);
  }
}

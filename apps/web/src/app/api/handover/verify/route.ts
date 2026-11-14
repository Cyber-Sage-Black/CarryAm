import { 
  apiSuccess, 
  apiError, 
  extractBearerToken, 
  getClientIp, 
  hashOtp, 
  timingSafeEqualHex 
} from '@/lib/api-helpers';
import { verifyHandoverSchema, verifyDeliverySchema } from '@/lib/validations';
import { createUserScopedClient, createServerSupabaseClient } from '@/lib/supabase';
import { otpVerifyLimiter } from '@/lib/rate-limit';
import { getHandover, getAgreement } from '@/lib/db';

/**
 * POST /api/handover/verify — Cryptographic Dual-OTP verification.
 * Verifies handover OTP at departure or delivery OTP at destination.
 * Uses constant-time hash comparison to prevent timing side-channel attacks.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = otpVerifyLimiter.check(ip);
  if (!limit.allowed) {
    return apiError('Too many OTP attempts. Please wait 60 seconds.', 429);
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

  let rawBody: Record<string, unknown>;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const isDelivery = 'type' in rawBody && rawBody.type === 'delivery';
  return isDelivery
    ? handleDeliveryVerification(rawBody, user.id)
    : handleHandoverVerification(rawBody, user.id);
}

/** Verify sender handover at departure hub */
async function handleHandoverVerification(body: Record<string, unknown>, userId: string) {
  const parsed = verifyHandoverSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return apiError(`${firstError.path.join('.')}: ${firstError.message}`, 422);
  }

  try {
    const serverDb = createServerSupabaseClient();
    const handover = await getHandover(parsed.data.agreementId);
    const agreement = await getAgreement(parsed.data.agreementId);

    if (agreement.carrier_id !== userId) {
      return apiError('Unauthorized: Only the designated carrier can verify handover', 403);
    }

    const inputHash = await hashOtp(parsed.data.otp);
    if (!timingSafeEqualHex(inputHash, handover.handover_otp_hash)) {
      return apiError('Invalid Handover OTP code', 401);
    }

    await serverDb
      .from('handover_records')
      .update({
        seal_serial_number: parsed.data.sealSerialNumber,
        handover_verified_at: new Date().toISOString(),
      })
      .eq('agreement_id', parsed.data.agreementId);

    await serverDb
      .from('packages')
      .update({ status: 'IN_TRANSIT' })
      .eq('id', agreement.package_id);

    return apiSuccess({ message: 'Handover verified. Package is now IN TRANSIT.' });
  } catch {
    return apiError('Handover verification could not be completed. Please retry.', 500);
  }
}

/** Verify recipient delivery at destination hub */
async function handleDeliveryVerification(body: Record<string, unknown>, userId: string) {
  const parsed = verifyDeliverySchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return apiError(`${firstError.path.join('.')}: ${firstError.message}`, 422);
  }

  try {
    const serverDb = createServerSupabaseClient();
    const handover = await getHandover(parsed.data.agreementId);
    const agreement = await getAgreement(parsed.data.agreementId);

    if (agreement.carrier_id !== userId) {
      return apiError('Unauthorized: Only the designated carrier can verify delivery', 403);
    }

    const inputHash = await hashOtp(parsed.data.otp);
    if (!timingSafeEqualHex(inputHash, handover.delivery_otp_hash)) {
      return apiError('Invalid Delivery OTP code', 401);
    }

    // Step 1: Mark handover completed
    await serverDb
      .from('handover_records')
      .update({ delivery_verified_at: new Date().toISOString() })
      .eq('agreement_id', parsed.data.agreementId);

    // Step 2: Mark package delivered
    await serverDb
      .from('packages')
      .update({ status: 'DELIVERED' })
      .eq('id', agreement.package_id);

    // Step 3: Credit carrier ledger
    const bountyKobo = agreement.agreed_bounty_kobo;
    await serverDb.from('ledger_entries').insert({
      account_id: agreement.carrier_id,
      direction: 'CREDIT',
      amount_kobo: bountyKobo,
      description: `Escrow Released: Delivery ${agreement.id}`,
      reference: `CAM-RELEASE-${agreement.id}`,
    });

    // Step 4: Update escrow transaction status
    await serverDb
      .from('escrow_transactions')
      .update({
        status: 'RELEASED_TO_CARRIER',
        released_at: new Date().toISOString(),
      })
      .eq('agreement_id', parsed.data.agreementId);

    return apiSuccess({
      message: 'Delivery verified. Escrow successfully released to carrier wallet.',
      releasedAmountNaira: bountyKobo / 100,
    });
  } catch {
    return apiError('Delivery verification could not be completed. Please retry.', 500);
  }
}

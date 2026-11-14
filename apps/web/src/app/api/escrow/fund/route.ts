import { apiSuccess, apiError, extractBearerToken, parseBody, getClientIp } from '@/lib/api-helpers';
import { fundEscrowSchema } from '@/lib/validations';
import { createUserScopedClient, createServerSupabaseClient } from '@/lib/supabase';
import { paymentLimiter } from '@/lib/rate-limit';
import { getAgreement } from '@/lib/db';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * POST /api/escrow/fund — Fund escrow after Paystack payment confirmation.
 * Verifies Paystack transaction server-side and establishes idempotent escrow deposit.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = paymentLimiter.check(ip);
  if (!limit.allowed) {
    return apiError('Too many payment attempts. Please wait 5 minutes.', 429);
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

  const parsed = await parseBody(request, fundEscrowSchema);
  if (parsed.error) return parsed.error;

  try {
    const agreement = await getAgreement(parsed.data.agreementId);
    if (agreement.sender_id !== user.id) {
      return apiError('Unauthorized: You are not the sender of this agreement', 403);
    }

    const paystackValid = await verifyPaystackTransaction(
      parsed.data.paystackReference,
      agreement.total_sender_charge_kobo,
    );
    if (!paystackValid.success) {
      return apiError(paystackValid.error, paystackValid.status);
    }

    const serverDb = createServerSupabaseClient();
    const escrowResult = await recordEscrowDeposit(serverDb, agreement, user.id, parsed.data.paystackReference);

    return apiSuccess(escrowResult, 201);
  } catch {
    return apiError('Failed to fund escrow deposit. Please contact support.', 500);
  }
}

type PaystackVerificationResult =
  | { readonly success: true }
  | { readonly success: false; readonly error: string; readonly status: number };

/** Verifies transaction with Paystack API */
async function verifyPaystackTransaction(
  reference: string,
  expectedAmountKobo: number,
): Promise<PaystackVerificationResult> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return { success: false, error: 'Payment gateway unconfigured', status: 500 };

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = await res.json();

  if (!data.status || data.data?.status !== 'success') {
    return { success: false, error: 'Payment not confirmed by Paystack', status: 402 };
  }
  if (data.data.amount !== expectedAmountKobo) {
    return { success: false, error: 'Payment amount mismatch', status: 422 };
  }

  return { success: true };
}

/** Inserts escrow record and updates package status idempotently */
async function recordEscrowDeposit(
  serverDb: SupabaseClient,
  agreement: Record<string, any>,
  userId: string,
  reference: string,
) {
  const { data: existing } = await serverDb
    .from('escrow_transactions')
    .select('id')
    .eq('agreement_id', agreement.id)
    .eq('status', 'HELD_IN_ESCROW')
    .maybeSingle();

  if (existing) {
    return { message: 'Escrow already funded', escrowId: existing.id };
  }

  const { data: escrow, error } = await serverDb
    .from('escrow_transactions')
    .insert({
      agreement_id: agreement.id,
      package_id: agreement.package_id,
      sender_id: userId,
      carrier_id: agreement.carrier_id,
      gross_amount_kobo: agreement.total_sender_charge_kobo,
      carrier_net_kobo: agreement.agreed_bounty_kobo,
      platform_fee_kobo: agreement.platform_fee_kobo,
      protection_fee_kobo: agreement.protection_fee_kobo,
      gateway_reference: reference,
      status: 'HELD_IN_ESCROW',
      funded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  await serverDb.from('packages').update({ status: 'ESCROW_FUNDED' }).eq('id', agreement.package_id);

  return { escrowId: escrow.id, message: 'Escrow funded successfully. Proceed to handover.' };
}

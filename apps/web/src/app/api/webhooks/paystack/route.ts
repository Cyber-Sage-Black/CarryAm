import { apiSuccess, apiError, verifyPaystackSignature } from '@/lib/api-helpers';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * POST /api/webhooks/paystack — Cryptographically verified Paystack webhook handler.
 * Verifies HMAC-SHA512 signature in constant time before dispatching to modular handlers.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  if (!signature) {
    return apiError('Missing webhook signature', 401);
  }

  const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret) {
    return apiError('Webhook secret unconfigured', 500);
  }

  const isValid = verifyPaystackSignature(rawBody, signature, secret);
  if (!isValid) {
    return apiError('Invalid webhook signature', 401);
  }

  let event: { event: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return apiError('Invalid JSON payload', 400);
  }

  const supabase = createServerSupabaseClient();

  switch (event.event) {
    case 'charge.success':
      await handleChargeSuccess(supabase, event.data);
      break;
    case 'transfer.success':
      await handleTransferSuccess(supabase, event.data);
      break;
    case 'transfer.failed':
      await handleTransferFailed(supabase, event.data);
      break;
    default:
      await logDomainEvent(supabase, 'paystack_webhook', `wh_${Date.now()}`, event.event, event.data);
  }

  return apiSuccess({ received: true });
}

/** Handles confirmed escrow deposit */
async function handleChargeSuccess(supabase: SupabaseClient, data: Record<string, unknown>) {
  const reference = String(data.reference ?? '');
  const amountKobo = Number(data.amount ?? 0);

  const { data: escrow } = await supabase
    .from('escrow_transactions')
    .select('id, status')
    .eq('gateway_reference', reference)
    .maybeSingle();

  if (escrow && escrow.status === 'PENDING_DEPOSIT') {
    await supabase
      .from('escrow_transactions')
      .update({
        status: 'HELD_IN_ESCROW',
        funded_at: new Date().toISOString(),
      })
      .eq('id', escrow.id);

    await logDomainEvent(supabase, 'escrow', escrow.id, 'ESCROW_FUNDED_VIA_WEBHOOK', { reference, amountKobo });
  }
}

/** Handles successful bank withdrawal transfer */
async function handleTransferSuccess(supabase: SupabaseClient, data: Record<string, unknown>) {
  const transferCode = String(data.transfer_code ?? '');
  await logDomainEvent(supabase, 'transfer', transferCode, 'BANK_TRANSFER_SUCCESS', data);
}

/** Handles failed transfer by reversing ledger debit */
async function handleTransferFailed(supabase: SupabaseClient, data: Record<string, unknown>) {
  const transferCode = String(data.transfer_code ?? '');
  const amountKobo = Number(data.amount ?? 0);

  const { data: debitEntry } = await supabase
    .from('ledger_entries')
    .select('id, account_id')
    .eq('reference', `CAM-WTH-${transferCode}`)
    .maybeSingle();

  if (debitEntry) {
    await supabase.from('ledger_entries').insert({
      account_id: debitEntry.account_id,
      direction: 'CREDIT',
      amount_kobo: amountKobo,
      description: `Reversal: Failed bank transfer ${transferCode}`,
      reference: `CAM-REV-${transferCode}`,
    });
  }

  await logDomainEvent(supabase, 'transfer', transferCode, 'BANK_TRANSFER_FAILED', data);
}

/** Helper to record domain events */
async function logDomainEvent(
  supabase: SupabaseClient,
  type: string,
  id: string,
  event: string,
  payload: Record<string, unknown>,
) {
  await supabase.from('domain_events').insert({
    aggregate_type: type,
    aggregate_id: id,
    event_type: event,
    payload,
  });
}

import { apiSuccess, apiError, extractBearerToken, parseBody, getClientIp } from '@/lib/api-helpers';
import { withdrawalSchema } from '@/lib/validations';
import { createUserScopedClient, createServerSupabaseClient } from '@/lib/supabase';
import { paymentLimiter } from '@/lib/rate-limit';
import { getWalletSummary } from '@/lib/db';

/**
 * GET /api/wallet — Retrieve authenticated user's wallet ledger summary.
 */
export async function GET(request: Request) {
  const token = extractBearerToken(request);
  if (!token) return apiError('Authentication required', 401);

  const supabase = createUserScopedClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return apiError('Invalid or expired session', 401);

  try {
    const wallet = await getWalletSummary(user.id);
    return apiSuccess(wallet);
  } catch {
    return apiError('Failed to fetch wallet information', 500);
  }
}

/**
 * POST /api/wallet — Atomic bank withdrawal via Paystack Transfers API.
 * Uses ledger reservation to prevent double-spending race conditions.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = paymentLimiter.check(ip);
  if (!limit.allowed) return apiError('Too many withdrawal attempts. Please wait.', 429);

  const token = extractBearerToken(request);
  if (!token) return apiError('Authentication required', 401);

  const supabase = createUserScopedClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return apiError('Invalid or expired session', 401);

  const parsed = await parseBody(request, withdrawalSchema);
  if (parsed.error) return parsed.error;

  try {
    const serverDb = createServerSupabaseClient();
    const wallet = await getWalletSummary(user.id);
    const requestedNaira = parsed.data.amountKobo / 100;

    if (requestedNaira > wallet.availableBalanceNaira) {
      return apiError('Insufficient wallet balance', 422);
    }

    // Step 1: Pre-debit reservation to prevent concurrent double-spending
    const pendingRef = `CAM-RES-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { error: reserveError } = await serverDb.from('ledger_entries').insert({
      account_id: user.id,
      direction: 'DEBIT',
      amount_kobo: parsed.data.amountKobo,
      description: `Pending Withdrawal to ${parsed.data.bankCode} (${parsed.data.accountNumber})`,
      reference: pendingRef,
    });
    if (reserveError) throw reserveError;

    // Step 2: Paystack Transfer Execution
    const transferResult = await executePaystackTransfer(
      user,
      parsed.data.accountNumber,
      parsed.data.bankCode,
      parsed.data.amountKobo,
    );

    if (!transferResult.success) {
      // Rollback reservation if transfer failed immediately
      await serverDb.from('ledger_entries').insert({
        account_id: user.id,
        direction: 'CREDIT',
        amount_kobo: parsed.data.amountKobo,
        description: `Reversal: Failed withdrawal dispatch (${pendingRef})`,
        reference: `CAM-REV-${pendingRef}`,
      });
      return apiError(transferResult.error, 502);
    }

    return apiSuccess({
      message: `₦${requestedNaira.toLocaleString()} successfully dispatched to bank.`,
      transferCode: transferResult.transferCode,
    });
  } catch {
    return apiError('Withdrawal could not be processed. Please try again.', 500);
  }
}

type PaystackTransferResult =
  | { readonly success: true; readonly transferCode: string }
  | { readonly success: false; readonly error: string };

/** Executes Paystack recipient creation and transfer initiation */
async function executePaystackTransfer(
  user: { id: string; user_metadata?: Record<string, any> },
  accountNumber: string,
  bankCode: string,
  amountKobo: number,
): Promise<PaystackTransferResult> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return { success: false, error: 'Payout rails unconfigured' };

  // Recipient creation
  const recRes = await fetch('https://api.paystack.co/transferrecipient', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'nuban',
      name: user.user_metadata?.first_name ?? 'CarryAm User',
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN',
    }),
  });
  const recData = await recRes.json();
  if (!recData.status) return { success: false, error: recData.message || 'Account validation failed' };

  // Transfer initiation
  const trRes = await fetch('https://api.paystack.co/transfer', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'balance',
      amount: amountKobo,
      recipient: recData.data.recipient_code,
      reason: `CarryAm wallet withdrawal for ${user.id}`,
    }),
  });
  const trData = await trRes.json();
  if (!trData.status) return { success: false, error: trData.message || 'Transfer failed' };

  return { success: true, transferCode: trData.data.transfer_code };
}

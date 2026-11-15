import { apiSuccess, apiError, extractBearerToken, parseBody } from '@/lib/api-helpers';
import { createUserScopedClient, createServerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
});

/**
 * GET /api/auth/profile — Retrieve profile or auto-provision on first sign-in.
 */
export async function GET(request: Request) {
  const token = extractBearerToken(request);
  if (!token) return apiError('Authentication required', 401);

  const supabase = createUserScopedClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return apiError('Invalid or expired session', 401);

  const serverDb = createServerSupabaseClient();

  // Fetch profile
  const { data: profile, error } = await serverDb
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profile) {
    return apiSuccess(profile);
  }

  // If profile doesn't exist yet, auto-create it (first-time Phone OTP login)
  const phone = user.phone ?? '+2348000000000';
  const { data: newProfile, error: insertError } = await serverDb
    .from('profiles')
    .insert({
      id: user.id,
      phone_number: phone,
      email: user.email ?? null,
      first_name: (user.user_metadata?.first_name as string) ?? 'CarryAm',
      last_name: (user.user_metadata?.last_name as string) ?? 'User',
      kyc_tier: 'TIER_0',
      trust_score: 5.00,
    })
    .select()
    .single();

  if (insertError) {
    return apiError('Failed to initialize user profile', 500);
  }

  return apiSuccess(newProfile, 201);
}

/**
 * POST /api/auth/profile — Update user profile details.
 */
export async function POST(request: Request) {
  const token = extractBearerToken(request);
  if (!token) return apiError('Authentication required', 401);

  const supabase = createUserScopedClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return apiError('Invalid or expired session', 401);

  const parsed = await parseBody(request, updateProfileSchema);
  if (parsed.error) return parsed.error;

  const serverDb = createServerSupabaseClient();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.firstName) updates.first_name = parsed.data.firstName;
  if (parsed.data.lastName) updates.last_name = parsed.data.lastName;
  if (parsed.data.email) updates.email = parsed.data.email;
  if (parsed.data.avatarUrl) updates.avatar_url = parsed.data.avatarUrl;

  const { data: updated, error } = await serverDb
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) return apiError('Failed to update profile', 500);

  return apiSuccess(updated);
}

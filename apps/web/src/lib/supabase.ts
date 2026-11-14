import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseContext, withSupabase } from '@supabase/server';

export { createSupabaseContext, withSupabase };

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://whoxdkdzovkbqemudhco.supabase.co';

const publishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_KxRxdH0k5XQitMEtZzCZVw_4BcOyZzd';

const secretKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

/**
 * Browser-side Supabase client (for Client Components).
 * Uses the publishable key — all queries are subject to RLS.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(supabaseUrl, publishableKey);
}

/**
 * Server-side Supabase client with secret key (for API routes only).
 * Bypasses RLS — use only in trusted server contexts.
 */
export function createServerSupabaseClient() {
  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Server-side Supabase client scoped to a user's JWT (for API routes).
 * Respects RLS policies using the user's access token.
 */
export function createUserScopedClient(accessToken: string) {
  return createClient(supabaseUrl, publishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

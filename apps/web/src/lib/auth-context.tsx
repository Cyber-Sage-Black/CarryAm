'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from './supabase';

// ====================================================================
// AUTH CONTEXT — Provides session state to all client components.
// Wraps Supabase Auth with phone OTP sign-in for Nigerian users.
// ====================================================================

interface AuthState {
  readonly user: User | null;
  readonly session: Session | null;
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
}

interface AuthActions {
  /** Send OTP to Nigerian phone number */
  readonly signInWithPhone: (phone: string) => Promise<{ error: string | null }>;
  /** Verify OTP code received via SMS */
  readonly verifyOtp: (phone: string, token: string) => Promise<{ error: string | null }>;
  /** Sign out and clear session */
  readonly signOut: () => Promise<void>;
  /** Refresh session from Supabase */
  readonly refreshSession: () => Promise<void>;
}

type AuthContextValue = AuthState & AuthActions;

const AuthContext = createContext<AuthContextValue | null>(null);

// Singleton browser client — created once per app lifecycle
let browserClient: ReturnType<typeof createBrowserSupabaseClient> | null = null;

function getBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserSupabaseClient();
  }
  return browserClient;
}

export function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const supabase = getBrowserClient();

  // Initialize session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setState({
          user: session?.user ?? null,
          session,
          isLoading: false,
          isAuthenticated: !!session?.user,
        });
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({
          user: session?.user ?? null,
          session,
          isLoading: false,
          isAuthenticated: !!session?.user,
        });
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithPhone = useCallback(
    async (phone: string): Promise<{ error: string | null }> => {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          phone,
          options: {
            channel: 'sms',
          },
        });

        if (error) {
          return { error: error.message };
        }
        return { error: null };
      } catch (err) {
        return { error: 'Network error. Please try again.' };
      }
    },
    [supabase],
  );

  const verifyOtp = useCallback(
    async (phone: string, token: string): Promise<{ error: string | null }> => {
      try {
        const { error } = await supabase.auth.verifyOtp({
          phone,
          token,
          type: 'sms',
        });

        if (error) {
          return { error: error.message };
        }
        return { error: null };
      } catch (err) {
        return { error: 'Verification failed. Please try again.' };
      }
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, [supabase]);

  const refreshSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.refreshSession();
    setState({
      user: session?.user ?? null,
      session,
      isLoading: false,
      isAuthenticated: !!session?.user,
    });
  }, [supabase]);

  const value: AuthContextValue = {
    ...state,
    signInWithPhone,
    verifyOtp,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state and actions.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

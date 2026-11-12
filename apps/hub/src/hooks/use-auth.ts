'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  type AuthenticatedUserSummary,
  type AuthOperationResult,
  type NormalizedAuthError,
  type SessionMetadataSummary,
  type WorkspaceAccessBoundaryStatus,
  getCurrentSession,
  normalizeSupabaseAuthError,
  signInWithEmailOtp,
  signOutCurrentUser,
  toAuthenticatedUserSummary,
  toSessionMetadataSummary,
  verifyEmailOtpCode,
} from '@/lib/supabase/auth-service';

/**
 * Public contract exposed by `useAuth()`.
 *
 * Security invariants:
 * - `user` and `session` expose only sanitized summaries (no `access_token` or `refresh_token`).
 * - `workspaceAccessStatus` explicitly distinguishes Phase 5 authentication (`auth.users`)
 *   from Phase 6 workspace membership & role verification (`public.workspace_members`).
 */
export interface UseAuthContract {
  user: AuthenticatedUserSummary | null;
  session: SessionMetadataSummary | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: NormalizedAuthError | null;
  lastAuthEvent: AuthChangeEvent | null;
  workspaceAccessStatus: WorkspaceAccessBoundaryStatus;
  signInWithEmail: (
    email: string,
    nextPath?: string
  ) => Promise<AuthOperationResult<{ email: string }>>;
  verifyOtp: (
    email: string,
    token: string
  ) => Promise<AuthOperationResult<{ user: AuthenticatedUserSummary; session: SessionMetadataSummary }>>;
  signOut: () => Promise<AuthOperationResult<void>>;
  clearError: () => void;
}

const AuthContext = createContext<UseAuthContract | null>(null);

/**
 * Shared authentication state provider for Khai Space Hub.
 *
 * Maintains a single `onAuthStateChange` subscription across the application shell,
 * safely initializes persisted browser sessions, and prevents race conditions or
 * state updates after unmount.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUserSummary | null>(null);
  const [session, setSession] = useState<SessionMetadataSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<NormalizedAuthError | null>(null);
  const [lastAuthEvent, setLastAuthEvent] = useState<AuthChangeEvent | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const subscriptionActiveRef = useRef<boolean>(false);

  const applySessionState = useCallback((nextSession: Session | null) => {
    if (!isMountedRef.current) {
      return;
    }

    const sessionSummary = toSessionMetadataSummary(nextSession);
    const userSummary = toAuthenticatedUserSummary(nextSession?.user ?? null);

    if (sessionSummary && !sessionSummary.isExpired && userSummary) {
      setSession(sessionSummary);
      setUser(userSummary);
    } else {
      setSession(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    let unsubscribe: (() => void) | null = null;

    const initializeAuth = async () => {
      try {
        const supabase = getSupabaseBrowserClient();

        // Guard against duplicate subscriptions in React StrictMode
        if (!subscriptionActiveRef.current) {
          subscriptionActiveRef.current = true;
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((event, nextSession) => {
            if (!isMountedRef.current) {
              return;
            }

            setLastAuthEvent(event);

            if (event === 'SIGNED_OUT') {
              setSession(null);
              setUser(null);
              setIsLoading(false);
              return;
            }

            if (
              event === 'INITIAL_SESSION' ||
              event === 'SIGNED_IN' ||
              event === 'TOKEN_REFRESHED' ||
              event === 'USER_UPDATED'
            ) {
              applySessionState(nextSession);
              setIsLoading(false);
            }
          });

          unsubscribe = () => {
            subscription.unsubscribe();
            subscriptionActiveRef.current = false;
          };
        }

        const initialResult = await getCurrentSession();
        if (!isMountedRef.current) {
          return;
        }

        if (!initialResult.success && initialResult.error) {
          setError(initialResult.error);
          setSession(null);
          setUser(null);
        } else {
          applySessionState(initialResult.data?.session ?? null);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(normalizeSupabaseAuthError(err));
          setSession(null);
          setUser(null);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    void initializeAuth();

    return () => {
      isMountedRef.current = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [applySessionState]);

  const signInWithEmail = useCallback(
    async (
      email: string,
      nextPath: string = '/'
    ): Promise<AuthOperationResult<{ email: string }>> => {
      setError(null);
      const result = await signInWithEmailOtp(email, nextPath);
      if (!result.success && result.error && isMountedRef.current) {
        setError(result.error);
      }
      return result;
    },
    []
  );

  const verifyOtp = useCallback(
    async (
      email: string,
      token: string
    ): Promise<
      AuthOperationResult<{
        user: AuthenticatedUserSummary;
        session: SessionMetadataSummary;
      }>
    > => {
      setError(null);
      const result = await verifyEmailOtpCode(email, token);

      if (!result.success || !result.data) {
        if (result.error && isMountedRef.current) {
          setError(result.error);
        }
        return {
          success: false,
          data: null,
          error: result.error,
        };
      }

      const userSummary = toAuthenticatedUserSummary(result.data.user);
      const sessionSummary = toSessionMetadataSummary(result.data.session);

      if (!userSummary || !sessionSummary) {
        const fallbackError: NormalizedAuthError = {
          category: 'unauthorized',
          message: 'Session was created but user profile metadata was incomplete.',
        };
        if (isMountedRef.current) {
          setError(fallbackError);
        }
        return {
          success: false,
          data: null,
          error: fallbackError,
        };
      }

      if (isMountedRef.current) {
        setUser(userSummary);
        setSession(sessionSummary);
      }

      return {
        success: true,
        data: {
          user: userSummary,
          session: sessionSummary,
        },
        error: null,
      };
    },
    []
  );

  const signOut = useCallback(async (): Promise<AuthOperationResult<void>> => {
    setError(null);
    const result = await signOutCurrentUser();

    if (isMountedRef.current) {
      if (!result.success && result.error) {
        setError(result.error);
      } else {
        setUser(null);
        setSession(null);
      }
    }

    return result;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isAuthenticated = Boolean(user && session && !session.isExpired);

  const workspaceAccessStatus: WorkspaceAccessBoundaryStatus = isAuthenticated
    ? 'authenticated_membership_unverified_phase_6'
    : 'unauthenticated';

  const contextValue = useMemo<UseAuthContract>(
    () => ({
      user,
      session,
      isLoading,
      isAuthenticated,
      error,
      lastAuthEvent,
      workspaceAccessStatus,
      signInWithEmail,
      verifyOtp,
      signOut,
      clearError,
    }),
    [
      user,
      session,
      isLoading,
      isAuthenticated,
      error,
      lastAuthEvent,
      workspaceAccessStatus,
      signInWithEmail,
      verifyOtp,
      signOut,
      clearError,
    ]
  );

  return React.createElement(AuthContext.Provider, { value: contextValue }, children);
}

/**
 * Hook for consuming Khai Space Hub authentication state and actions.
 */
export function useAuth(): UseAuthContract {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return context;
}

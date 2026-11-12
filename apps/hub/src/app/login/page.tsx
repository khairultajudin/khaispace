'use client';

import React, { useEffect, useState } from 'react';
import { LoginView } from '@/components/auth/login-view';
import { useAuth } from '@/hooks/use-auth';
import { sanitizeInternalRedirectPath } from '@/lib/supabase/auth-service';

/**
 * Static `/login` route for Khai Space Hub.
 *
 * If the user already holds a valid authenticated session, redirects safely
 * to the internal destination (`?next=...` or `/`).
 */
export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [redirectTarget] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const nextCandidate = params.get('next') ?? params.get('redirect_to');
      return sanitizeInternalRedirectPath(nextCandidate, '/');
    }
    return '/';
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated && typeof window !== 'undefined') {
      window.location.replace(redirectTarget);
    }
  }, [isLoading, isAuthenticated, redirectTarget]);

  return (
    <LoginView
      redirectTo={redirectTarget}
      onAuthenticated={(safePath) => {
        if (typeof window !== 'undefined') {
          window.location.replace(safePath);
        }
      }}
    />
  );
}

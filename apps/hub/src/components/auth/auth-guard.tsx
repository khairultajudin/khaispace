'use client';

import React, { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { LoginView } from './login-view';
import { sanitizeInternalRedirectPath } from '@/lib/supabase/auth-service';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Private Workspace Authentication Guard for Khai Space Hub.
 *
 * Behavior:
 * 1. While session state is initializing (`isLoading === true`), renders a clean,
 *    non-flashing loading skeleton matching the `#FAF8F4` light-mode aesthetic.
 * 2. When unauthenticated (`!isAuthenticated`), renders the private `LoginView`
 *    directly without flashing protected dashboard modules.
 * 3. When authenticated (`isAuthenticated`), renders the protected Hub children.
 *
 * Phase 5 Architectural Boundary:
 * `AuthGuard` verifies a valid Supabase user session (`auth.users`). Database-level
 * workspace membership (`public.workspace_members`), invitation acceptance, and
 * role-based RLS policies (`Owner` / `Admin` / `Collaborator` / `Viewer`) are
 * enforced in Phase 6 once the Phase 3 SQL schema is deployed.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading, isAuthenticated } = useAuth();
  const [requestedPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const currentTarget = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      return sanitizeInternalRedirectPath(currentTarget, '/');
    }
    return '/';
  });

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="min-h-screen bg-[#FAF8F4] text-[#0C2340] flex flex-col items-center justify-center p-6 antialiased"
      >
        <div className="w-full max-w-sm bg-white border border-[#DCD7CC] rounded-lg p-6 shadow-xs flex flex-col items-center text-center space-y-3.5">
          <div className="w-9 h-9 rounded bg-[#0C2340] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            K
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0C2340]">
            <Loader2 className="w-4 h-4 text-[#347A63] animate-spin" />
            <span>Verifying Workspace Session...</span>
          </div>
          <p className="text-[11px] text-[#536B85] leading-relaxed">
            Checking encrypted local session credentials for Khai Space Hub.
          </p>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EDF5F2] border border-[#A8CFC2] text-[#347A63] text-[10px] font-mono">
            <ShieldCheck className="w-3 h-3" />
            <span>Phase 5 Private Access Gate</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginView
        redirectTo={requestedPath}
        onAuthenticated={(safeDestination) => {
          if (typeof window !== 'undefined' && safeDestination.includes('#')) {
            const hashIndex = safeDestination.indexOf('#');
            window.location.hash = safeDestination.slice(hashIndex);
          }
        }}
      />
    );
  }

  return <>{children}</>;
}

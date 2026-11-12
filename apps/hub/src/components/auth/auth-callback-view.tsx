'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import {
  completeAuthCallbackFromUrl,
  sanitizeInternalRedirectPath,
} from '@/lib/supabase/auth-service';

type CallbackStatus = 'verifying' | 'authenticated' | 'failed';

/**
 * Client-side Authentication Callback Handler for Khai Space Hub.
 *
 * Compatible with Next.js static export (`output: "export"`).
 * Handles:
 * 1. PKCE authorization code (`?code=...`)
 * 2. Token hash verification (`?token_hash=...&type=...`)
 * 3. Implicit hash fragment (`#access_token=...`)
 * 4. Supabase error query/hash parameters (`?error=...&error_description=...`)
 *
 * Security invariants:
 * - Validates and sanitizes any `next` or `redirect_to` parameter via `sanitizeInternalRedirectPath`.
 * - Scrubs sensitive query/hash tokens from browser history synchronously BEFORE asynchronous verification begins.
 */
export function AuthCallbackView() {
  const [status, setStatus] = useState<CallbackStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState<string>('/');
  const hasProcessedRef = useRef<boolean>(false);

  useEffect(() => {
    if (hasProcessedRef.current || typeof window === 'undefined') {
      return;
    }
    hasProcessedRef.current = true;

    let redirectTimer: ReturnType<typeof setTimeout> | null = null;

    // 1. Capture callback query and hash parameters in local variables
    const currentSearch = window.location.search;
    const currentHash = window.location.hash;

    // 2. Immediately scrub sensitive callback tokens from the visible browser URL
    //    synchronously before initiating any asynchronous verification operation.
    try {
      window.history.replaceState(
        window.history.state,
        document.title,
        window.location.pathname
      );
    } catch {
      // Ignore history API restrictions in embedded contexts
    }

    const processCallback = async () => {
      // 3. Perform asynchronous callback verification using the preserved local variables
      const result = await completeAuthCallbackFromUrl(currentSearch, currentHash);

      if (!result.success || !result.data) {
        setStatus('failed');
        setErrorMessage(
          result.error?.message ??
            'The sign-in link has expired, is malformed, or has already been used.'
        );
        return;
      }

      const safeDestination = sanitizeInternalRedirectPath(
        result.data.redirectPath,
        '/'
      );
      setRedirectPath(safeDestination);
      setStatus('authenticated');

      redirectTimer = setTimeout(() => {
        window.location.replace(safeDestination);
      }, 350);
    };

    void processCallback();

    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#0C2340] flex flex-col items-center justify-center p-4 sm:p-6 antialiased">
      <div className="w-full max-w-md bg-white border border-[#DCD7CC] rounded-lg shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#DCD7CC] bg-[#FAF8F4]/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#0C2340] text-white flex items-center justify-center font-bold text-xs">
              K
            </div>
            <span className="font-semibold text-sm text-[#0C2340]">
              Khai Space Hub
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#E9E5DC] border border-[#DCD7CC] text-[#0C2340] text-[10px] font-mono">
            <ShieldCheck className="w-3 h-3 text-[#347A63]" />
            Auth Callback
          </span>
        </div>

        <div className="p-6 sm:p-7 space-y-5">
          {status === 'verifying' && (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center text-center py-4 space-y-3"
            >
              <Loader2 className="w-8 h-8 text-[#347A63] animate-spin" />
              <h1 className="text-base font-bold text-[#0C2340]">
                Verifying your sign-in link...
              </h1>
              <p className="text-xs text-[#536B85] max-w-xs leading-relaxed">
                Establishing your encrypted browser session for Khai Space Hub.
              </p>
            </div>
          )}

          {status === 'authenticated' && (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center text-center py-4 space-y-3"
            >
              <CheckCircle2 className="w-8 h-8 text-[#347A63]" />
              <h1 className="text-base font-bold text-[#0C2340]">
                Authentication Confirmed
              </h1>
              <p className="text-xs text-[#536B85] max-w-xs leading-relaxed">
                Redirecting you to your workspace ({redirectPath})...
              </p>
            </div>
          )}

          {status === 'failed' && (
            <div className="space-y-4">
              <div
                role="alert"
                aria-live="assertive"
                className="p-4 rounded-md border border-[#E5B8B8] bg-[#FDF2F2] text-[#7A2727] text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#9E2A2B]" />
                <div className="space-y-1">
                  <div className="font-semibold">
                    Sign-In Link Could Not Be Verified
                  </div>
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <a
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#347A63] hover:bg-[#2B6652] text-white text-xs font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

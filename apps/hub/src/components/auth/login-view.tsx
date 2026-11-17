'use client';

import React, { useId, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  PRIVACY_PRESERVING_RESET_CONFIRMATION,
  sanitizeInternalRedirectPath,
  validateAuthEmail,
  validatePasswordInput,
} from '@/lib/supabase/auth-service';

interface LoginViewProps {
  /**
   * Optional internal destination path after successful sign-in.
   */
  redirectTo?: string;
  /**
   * Optional callback invoked once sign-in succeeds.
   */
  onAuthenticated?: (redirectPath: string) => void;
}

type LoginMode = 'password_login' | 'forgot_password';

/**
 * Private Workspace Login Interface for Khai Space Hub.
 *
 * Primary authentication: Email + Password (`signInWithPassword`), with
 * Forgot Password recovery (`resetPasswordForEmail` -> `/auth/callback?next=/reset-password`).
 * Public self-registration remains disabled (`shouldCreateUser: false`).
 */
export function LoginView({ redirectTo = '/', onAuthenticated }: LoginViewProps) {
  const { signInWithPassword, requestPasswordReset, error: authError, clearError } = useAuth();

  const emailInputId = useId();
  const passwordInputId = useId();
  const statusRegionId = useId();

  const safeRedirectPath = sanitizeInternalRedirectPath(redirectTo, '/');

  const [mode, setMode] = useState<LoginMode>('password_login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetConfirmation, setResetConfirmation] = useState<string | null>(null);

  const activeErrorMessage = localError ?? authError?.message ?? null;

  const handlePasswordLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    clearError();

    const emailValidation = validateAuthEmail(email);
    if (!emailValidation.isValid || emailValidation.error) {
      setLocalError(emailValidation.error?.message ?? 'Please enter a valid email address.');
      return;
    }

    const passwordValidation = validatePasswordInput(password, false);
    if (!passwordValidation.isValid || passwordValidation.error) {
      setLocalError(passwordValidation.error?.message ?? 'Password is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signInWithPassword(emailValidation.normalizedEmail, password);
      if (!result.success) {
        setLocalError(
          result.error?.message ?? 'Invalid email or password. Please try again.'
        );
        return;
      }

      setPassword('');
      if (onAuthenticated) {
        onAuthenticated(safeRedirectPath);
      } else if (typeof window !== 'undefined') {
        window.location.replace(safeRedirectPath);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestPasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    setResetConfirmation(null);
    clearError();

    const emailValidation = validateAuthEmail(email);
    if (!emailValidation.isValid || emailValidation.error) {
      setLocalError(emailValidation.error?.message ?? 'Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestPasswordReset(emailValidation.normalizedEmail);
      if (!result.success) {
        setLocalError(
          result.error?.message ?? 'Unable to send password reset email. Please try again.'
        );
        return;
      }

      setEmail(emailValidation.normalizedEmail);
      setResetConfirmation(result.neutralNotice ?? PRIVACY_PRESERVING_RESET_CONFIRMATION);
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode: LoginMode) => {
    setMode(nextMode);
    setLocalError(null);
    setResetConfirmation(null);
    clearError();
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#0C2340] flex flex-col antialiased">
      {/* Top Identity Strip */}
      <header className="border-b border-[#DCD7CC] bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#0C2340] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              K
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-[#0C2340]">
                Khai Space Hub
              </div>
              <div className="text-[11px] font-mono text-[#536B85]">
                hub.khaispace.com &bull; Private Command Center
              </div>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EDF5F2] border border-[#A8CFC2] text-[#347A63] text-[11px] font-medium">
            <Lock className="w-3 h-3" />
            <span>Private Access</span>
          </span>
        </div>
      </header>

      {/* Main Auth Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-5">
          <div className="bg-white border border-[#DCD7CC] rounded-lg shadow-xs overflow-hidden">
            <div className="p-6 sm:p-7 border-b border-[#E9E5DC] bg-[#FAF8F4]/50 space-y-2">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#347A63]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {mode === 'password_login'
                    ? 'Private Workspace Authentication'
                    : 'Password Recovery'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0C2340]">
                {mode === 'password_login'
                  ? 'Sign in to Khai Space Hub'
                  : 'Reset your password'}
              </h1>
              <p className="text-xs text-[#536B85] leading-relaxed">
                {mode === 'password_login'
                  ? 'Enter your authorized workspace email and password to access your dashboard.'
                  : 'Enter your registered email address to receive a secure password reset link.'}
              </p>
            </div>

            <div className="p-6 sm:p-7 space-y-5">
              {/* Error Banner */}
              <div id={statusRegionId} aria-live="polite" className="space-y-3">
                {activeErrorMessage && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-md border border-[#E5B8B8] bg-[#FDF2F2] text-[#7A2727] text-xs flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#9E2A2B]" />
                    <span className="leading-relaxed">{activeErrorMessage}</span>
                  </div>
                )}

                {resetConfirmation && mode === 'forgot_password' && (
                  <div
                    role="status"
                    className="p-3.5 rounded-md border border-[#A8CFC2] bg-[#EDF5F2] text-[#0C2340] text-xs flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#347A63]" />
                    <div className="space-y-1">
                      <p className="font-semibold text-[#347A63]">Check Your Email</p>
                      <p className="text-[#536B85] leading-relaxed">{resetConfirmation}</p>
                    </div>
                  </div>
                )}
              </div>

              {mode === 'password_login' ? (
                <form onSubmit={handlePasswordLogin} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <label
                      htmlFor={emailInputId}
                      className="block text-xs font-semibold text-[#0C2340]"
                    >
                      Authorized Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#536B85] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id={emailInputId}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        autoFocus
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (localError) setLocalError(null);
                          if (authError) clearError();
                        }}
                        placeholder="owner@khaispace.com"
                        disabled={isSubmitting}
                        className="w-full pl-9 pr-3 py-2.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-sm text-[#0C2340] placeholder:text-[#536B85]/70 focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={passwordInputId}
                        className="block text-xs font-semibold text-[#0C2340]"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => switchMode('forgot_password')}
                        className="text-xs font-medium text-[#347A63] hover:text-[#2B6652] hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#536B85] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id={passwordInputId}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (localError) setLocalError(null);
                          if (authError) clearError();
                        }}
                        placeholder="Enter your password"
                        disabled={isSubmitting}
                        className="w-full pl-9 pr-10 py-2.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-sm text-[#0C2340] placeholder:text-[#536B85]/70 focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#536B85] hover:text-[#0C2340] cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#0C2340] hover:bg-[#133258] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Login</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRequestPasswordReset} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <label
                      htmlFor={emailInputId}
                      className="block text-xs font-semibold text-[#0C2340]"
                    >
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#536B85] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id={emailInputId}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        autoFocus
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (localError) setLocalError(null);
                          if (authError) clearError();
                        }}
                        placeholder="owner@khaispace.com"
                        disabled={isSubmitting}
                        className="w-full pl-9 pr-3 py-2.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-sm text-[#0C2340] placeholder:text-[#536B85]/70 focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#347A63] hover:bg-[#2B6652] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Reset Link...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Password Reset Link</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => switchMode('password_login')}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium text-[#536B85] hover:text-[#0C2340] pt-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                </form>
              )}

              {/* Private Workspace Boundary Disclosure */}
              <div className="pt-4 border-t border-[#E9E5DC] space-y-2 text-[11px] text-[#536B85]">
                <div className="flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#347A63] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#0C2340]">
                      Invitation-Only Accounts:
                    </span>{' '}
                    Public self-registration is disabled. Existing authorized users without a password can use{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('forgot_password')}
                      className="text-[#347A63] hover:underline font-medium cursor-pointer"
                    >
                      Forgot Password
                    </button>{' '}
                    to establish one.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#DCD7CC] bg-[#FAF8F4] py-4 px-6 text-xs text-[#536B85]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Khai Space Hub &bull; Private Workspace Access</span>
          <span className="font-mono text-[11px]">
            Email + Password Auth &bull; Supabase RLS
          </span>
        </div>
      </footer>
    </div>
  );
}

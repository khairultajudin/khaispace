'use client';

import React, { useId, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  PRIVACY_PRESERVING_OTP_CONFIRMATION,
  sanitizeInternalRedirectPath,
  validateAuthEmail,
  validateOtpToken,
} from '@/lib/supabase/auth-service';

interface LoginViewProps {
  /**
   * Optional internal destination path after successful sign-in.
   */
  redirectTo?: string;
  /**
   * Optional callback invoked once an OTP code is verified into a session.
   */
  onAuthenticated?: (redirectPath: string) => void;
}

type LoginStep = 'request_email' | 'verify_otp';

/**
 * Private Workspace Login Interface for Khai Space Hub.
 *
 * Design tokens:
 * - Warm paper background: `#FAF8F4`
 * - Deep navy primary text: `#0C2340`
 * - Soft warm neutral surfaces: `#E9E5DC`, border `#DCD7CC`
 * - Muted green accent: `#347A63`, surface `#EDF5F2`, border `#A8CFC2`
 *
 * Security invariants:
 * - Passwordless Email Magic Link & Email OTP only (`shouldCreateUser: false`).
 * - No Sign Up, Create Account, password registration, or social login buttons.
 * - Privacy-preserving confirmation notice prevents email enumeration.
 */
export function LoginView({ redirectTo = '/', onAuthenticated }: LoginViewProps) {
  const { signInWithEmail, verifyOtp, error: authError, clearError } = useAuth();

  const emailInputId = useId();
  const otpInputId = useId();
  const statusRegionId = useId();

  const safeRedirectPath = sanitizeInternalRedirectPath(redirectTo, '/');

  const [step, setStep] = useState<LoginStep>('request_email');
  const [email, setEmail] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  const activeErrorMessage = localError ?? authError?.message ?? null;

  const handleRequestEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    clearError();

    const validation = validateAuthEmail(email);
    if (!validation.isValid || validation.error) {
      setLocalError(validation.error?.message ?? 'Please enter a valid email address.');
      return;
    }

    setIsSubmittingEmail(true);
    try {
      const result = await signInWithEmail(validation.normalizedEmail, safeRedirectPath);
      if (!result.success) {
        setLocalError(
          result.error?.message ?? 'Unable to send sign-in email. Please try again.'
        );
        return;
      }

      setEmail(validation.normalizedEmail);
      setConfirmationMessage(
        result.neutralNotice ?? PRIVACY_PRESERVING_OTP_CONFIRMATION
      );
      setStep('verify_otp');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    clearError();

    const emailValidation = validateAuthEmail(email);
    if (!emailValidation.isValid || emailValidation.error) {
      setLocalError(
        emailValidation.error?.message ?? 'Please enter a valid email address.'
      );
      return;
    }

    const otpValidation = validateOtpToken(otpCode);
    if (!otpValidation.isValid || otpValidation.error) {
      setLocalError(
        otpValidation.error?.message ??
          'Please enter the 6-digit numeric verification code from your email.'
      );
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const result = await verifyOtp(
        emailValidation.normalizedEmail,
        otpValidation.normalizedToken
      );

      if (!result.success) {
        setLocalError(
          result.error?.message ??
            'Verification code could not be validated. Please check the code or request a new email.'
        );
        return;
      }

      if (onAuthenticated) {
        onAuthenticated(safeRedirectPath);
      } else if (typeof window !== 'undefined') {
        window.location.assign(safeRedirectPath);
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResetToEmailStep = () => {
    setLocalError(null);
    clearError();
    setOtpCode('');
    setConfirmationMessage(null);
    setStep('request_email');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#0C2340] flex flex-col justify-between p-4 sm:p-6 lg:p-8 antialiased">
      {/* Top Bar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#0C2340] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
            K
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight text-[#0C2340] leading-none">
              Khai Space Hub
            </div>
            <div className="text-[11px] text-[#536B85] mt-1 font-mono">
              hub.khaispace.com &bull; Private Command Center
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#A8CFC2] bg-[#EDF5F2] text-[#347A63] text-[11px] font-medium">
          <Lock className="w-3.5 h-3.5" />
          <span>Invitation-Only Access</span>
        </div>
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-white border border-[#DCD7CC] rounded-lg shadow-xs overflow-hidden">
            {/* Card Header */}
            <div className="p-6 sm:p-7 border-b border-[#DCD7CC] bg-[#FAF8F4]/60">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#E9E5DC] border border-[#DCD7CC] text-[#0C2340] text-[10px] font-mono uppercase tracking-wider mb-3">
                <ShieldCheck className="w-3 h-3 text-[#347A63]" />
                <span>Private Workspace Authentication</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0C2340]">
                Sign in to Khai Space Hub
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#536B85] leading-relaxed">
                Enter your authorized workspace email to receive a one-time Magic Link or
                6-digit verification code.
              </p>
            </div>

            {/* Card Body */}
            <div className="p-6 sm:p-7 space-y-5">
              {/* Error Alert */}
              {activeErrorMessage && (
                <div
                  id={statusRegionId}
                  role="alert"
                  aria-live="assertive"
                  className="p-3.5 rounded-md border border-[#E5B8B8] bg-[#FDF2F2] text-[#7A2727] text-xs flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#9E2A2B]" />
                  <div className="space-y-1">
                    <div className="font-semibold">Authentication Notice</div>
                    <p className="leading-relaxed">{activeErrorMessage}</p>
                  </div>
                </div>
              )}

              {/* Confirmation Notice */}
              {confirmationMessage && step === 'verify_otp' && (
                <div
                  role="status"
                  aria-live="polite"
                  className="p-3.5 rounded-md border border-[#A8CFC2] bg-[#EDF5F2] text-[#1F5240] text-xs flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#347A63]" />
                  <div className="space-y-1">
                    <div className="font-semibold text-[#0C2340]">
                      Check your email ({email})
                    </div>
                    <p className="leading-relaxed">{confirmationMessage}</p>
                  </div>
                </div>
              )}

              {step === 'request_email' ? (
                <form onSubmit={handleRequestEmail} noValidate className="space-y-4">
                  <div>
                    <label
                      htmlFor={emailInputId}
                      className="block text-xs font-semibold text-[#0C2340] mb-1.5"
                    >
                      Authorized Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#536B85] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id={emailInputId}
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        disabled={isSubmittingEmail}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (localError) setLocalError(null);
                        }}
                        placeholder="owner@khaispace.com"
                        aria-describedby={activeErrorMessage ? statusRegionId : undefined}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] placeholder:text-[#8C9BAE] focus:outline-none focus:ring-2 focus:ring-[#347A63]/30 focus:border-[#347A63] disabled:opacity-60 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingEmail}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#347A63] hover:bg-[#2B6652] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSubmittingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Magic Link &amp; OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Magic Link / Email OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setLocalError(null);
                        clearError();
                        setStep('verify_otp');
                      }}
                      className="text-xs font-medium text-[#347A63] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Already have a 6-digit OTP code?</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} noValidate className="space-y-4">
                  <div>
                    <label
                      htmlFor={emailInputId}
                      className="block text-xs font-semibold text-[#0C2340] mb-1.5"
                    >
                      Authorized Email Address
                    </label>
                    <input
                      id={emailInputId}
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      disabled={isVerifyingOtp}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (localError) setLocalError(null);
                      }}
                      placeholder="owner@khaispace.com"
                      className="w-full px-3.5 py-2 text-sm rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] placeholder:text-[#8C9BAE] focus:outline-none focus:ring-2 focus:ring-[#347A63]/30 focus:border-[#347A63] disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={otpInputId}
                      className="block text-xs font-semibold text-[#0C2340] mb-1.5"
                    >
                      6-Digit Verification Code (OTP)
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#536B85] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id={otpInputId}
                        name="otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={8}
                        required
                        disabled={isVerifyingOtp}
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value.replace(/[^\d\s]/g, ''));
                          if (localError) setLocalError(null);
                        }}
                        placeholder="123456"
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm font-mono tracking-widest rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] placeholder:text-[#8C9BAE] focus:outline-none focus:ring-2 focus:ring-[#347A63]/30 focus:border-[#347A63] disabled:opacity-60"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#536B85]">
                      You can click the Magic Link in your email or enter the 6-digit code
                      above.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingOtp}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#347A63] hover:bg-[#2B6652] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Code &amp; Enter Hub</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="pt-1 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={handleResetToEmailStep}
                      disabled={isVerifyingOtp}
                      className="text-[#536B85] hover:text-[#0C2340] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Request another link / change email</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Existing-User-Only & Phase 5 Governance Notice */}
              <div className="pt-4 border-t border-[#DCD7CC] space-y-2.5 text-[11px] text-[#536B85]">
                <div className="p-3 rounded bg-[#E9E5DC]/50 border border-[#DCD7CC] space-y-1.5">
                  <div className="font-semibold text-[#0C2340] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#347A63]" />
                    <span>Existing Authorized Accounts Only</span>
                  </div>
                  <p className="leading-relaxed">
                    Public registration is disabled (
                    <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded border border-[#DCD7CC]">
                      shouldCreateUser: false
                    </code>
                    ). The initial Owner account must be provisioned in Supabase
                    Authentication before first sign-in.
                  </p>
                </div>

                <div className="flex items-center justify-between font-mono text-[10px] text-[#536B85] pt-1">
                  <span>Phase 5: Identity Auth</span>
                  <span>Phase 6 Pending: DB Membership &amp; RLS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto py-3 border-t border-[#DCD7CC] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#536B85]">
        <span>Khai Space Hub &bull; Private Workspace Access</span>
        <span className="font-mono">Single-Page Static Export Compatible</span>
      </footer>
    </div>
  );
}

'use client';

import React, { useId, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { validatePasswordInput } from '@/lib/supabase/auth-service';

export function ResetPasswordView() {
  const { isAuthenticated, isLoading, user, updatePassword } = useAuth();
  const newPwdId = useId();
  const confirmPwdId = useId();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validatePasswordInput(newPassword, true);
    if (!validation.isValid || validation.error) {
      setError(validation.error?.message ?? 'Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter both fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updatePassword(newPassword);
      if (!result.success) {
        setError(result.error?.message ?? 'Failed to update password.');
        return;
      }
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.replace('/');
        }
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#0C2340] flex flex-col items-center justify-center p-4 sm:p-6 antialiased">
      <div className="w-full max-w-md bg-white border border-[#DCD7CC] rounded-lg shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#DCD7CC] bg-[#FAF8F4]/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#0C2340] text-white flex items-center justify-center font-bold text-xs">
              K
            </div>
            <span className="font-semibold text-sm text-[#0C2340]">Khai Space Hub</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EDF5F2] border border-[#A8CFC2] text-[#347A63] text-[10px] font-mono">
            <ShieldCheck className="w-3 h-3" />
            Password Reset
          </span>
        </div>

        <div className="p-6 sm:p-7 space-y-5">
          {isLoading ? (
            <div className="flex flex-col items-center py-6 space-y-2 text-xs text-[#536B85]">
              <Loader2 className="w-6 h-6 text-[#347A63] animate-spin" />
              <span>Verifying recovery session...</span>
            </div>
          ) : !isAuthenticated ? (
            <div className="space-y-4">
              <div className="p-4 rounded-md border border-[#E5B8B8] bg-[#FDF2F2] text-[#7A2727] text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold">Recovery Session Required</div>
                  <p>
                    Open the password reset link from your email, or return to the login page to request a new reset link.
                  </p>
                </div>
              </div>
              <a
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#0C2340] hover:bg-[#133258] text-white text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </a>
            </div>
          ) : success ? (
            <div className="p-4 rounded-md border border-[#A8CFC2] bg-[#EDF5F2] text-[#0C2340] text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#347A63]" />
              <div className="space-y-1">
                <div className="font-semibold text-[#347A63]">Password Updated</div>
                <p className="text-[#536B85]">
                  Your new password has been saved. Redirecting to your workspace...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1">
                <h1 className="text-lg font-bold text-[#0C2340]">Set New Password</h1>
                <p className="text-xs text-[#536B85]">
                  Updating password for <strong className="text-[#0C2340]">{user?.email}</strong>.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="p-3 rounded-md border border-[#E5B8B8] bg-[#FDF2F2] text-[#7A2727] text-xs flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor={newPwdId} className="block text-xs font-semibold text-[#0C2340]">
                  New Password (min 8 characters)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#536B85] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id={newPwdId}
                    type={showNew ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-10 py-2.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-sm text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((p) => !p)}
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#536B85] hover:text-[#0C2340]"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor={confirmPwdId} className="block text-xs font-semibold text-[#0C2340]">
                  Confirm New Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#536B85] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id={confirmPwdId}
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-10 py-2.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-sm text-[#0C2340] focus:outline-none focus:border-[#347A63] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((p) => !p)}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#536B85] hover:text-[#0C2340]"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#347A63] hover:bg-[#2B6652] text-white text-xs font-semibold transition-colors disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password &amp; Continue</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


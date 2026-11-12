import type {
  AuthError,
  EmailOtpType,
  Session,
  User,
} from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from './client';

/**
 * Standardized, UI-safe error category for Khai Space Hub authentication.
 */
export type AuthErrorCategory =
  | 'invalid_email'
  | 'invalid_otp'
  | 'expired_or_invalid_link'
  | 'rate_limited'
  | 'configuration_error'
  | 'network_error'
  | 'unauthorized'
  | 'unknown_error';

/**
 * Sanitized authentication error structure safe for UI display.
 * Never contains raw tokens, secrets, or internal stack traces.
 */
export interface NormalizedAuthError {
  category: AuthErrorCategory;
  message: string;
  code?: string;
}

/**
 * Result wrapper for authentication operations.
 */
export interface AuthOperationResult<T = void> {
  success: boolean;
  data: T | null;
  error: NormalizedAuthError | null;
  neutralNotice?: string;
}

/**
 * Sanitized user summary safe for UI rendering.
 */
export interface AuthenticatedUserSummary {
  id: string;
  email: string;
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
}

/**
 * Sanitized session metadata safe for UI state inspection.
 * Raw access_token and refresh_token are deliberately excluded from UI summaries.
 */
export interface SessionMetadataSummary {
  userId: string;
  email: string;
  expiresAt: number | null;
  isExpired: boolean;
}

/**
 * Callback URL parameters parsed from query string and/or hash fragment.
 */
export interface ParsedAuthCallbackParams {
  code: string | null;
  tokenHash: string | null;
  otpType: EmailOtpType | null;
  hasHashAccessToken: boolean;
  errorCode: string | null;
  errorDescription: string | null;
  redirectPath: string;
}

/**
 * Explicit workspace authorization boundary status for Phase 5.
 *
 * Phase 5 verifies Supabase user authentication (`auth.users` session),
 * while database-backed workspace membership (`public.workspace_members`)
 * and role authorization (`Owner` / `Admin` / `Collaborator` / `Viewer`)
 * are deferred to Phase 6 when the Phase 3 SQL schema is deployed.
 */
export type WorkspaceAccessBoundaryStatus =
  | 'unauthenticated'
  | 'authenticated_membership_unverified_phase_6';

/**
 * Neutral confirmation message returned when requesting a Magic Link or Email OTP.
 * Prevents account enumeration by returning the exact same message whether or not
 * the email address exists in `auth.users`.
 */
export const PRIVACY_PRESERVING_OTP_CONFIRMATION =
  'If this email address is registered for an authorized Khai Space Hub account, a sign-in link and 6-digit verification code have been sent.';

const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_EMAIL_OTP_TYPES: readonly EmailOtpType[] = [
  'magiclink',
  'email',
  'invite',
  'recovery',
  'signup',
  'email_change',
];

/**
 * Validates and normalizes an email address before submitting to Supabase Auth.
 */
export function validateAuthEmail(rawEmail: string): {
  isValid: boolean;
  normalizedEmail: string;
  error: NormalizedAuthError | null;
} {
  const normalizedEmail = rawEmail.trim().toLowerCase();

  if (!normalizedEmail) {
    return {
      isValid: false,
      normalizedEmail: '',
      error: {
        category: 'invalid_email',
        message: 'Please enter the email address associated with your Hub account.',
      },
    };
  }

  if (normalizedEmail.length > 254 || !EMAIL_FORMAT_REGEX.test(normalizedEmail)) {
    return {
      isValid: false,
      normalizedEmail,
      error: {
        category: 'invalid_email',
        message: 'Please enter a valid email address (for example, name@domain.com).',
      },
    };
  }

  return {
    isValid: true,
    normalizedEmail,
    error: null,
  };
}

/**
 * Validates a 6-digit numeric Email OTP code.
 * Enforces exactly 6 numeric digits after trimming surrounding whitespace,
 * preserving leading zeroes and rejecting internal whitespace or non-digits.
 */
export function validateOtpToken(rawToken: string): {
  isValid: boolean;
  normalizedToken: string;
  error: NormalizedAuthError | null;
} {
  const normalizedToken = rawToken.trim();

  if (!/^\d{6}$/.test(normalizedToken)) {
    return {
      isValid: false,
      normalizedToken,
      error: {
        category: 'invalid_otp',
        message: 'Please enter the 6-digit numeric verification code from your email.',
      },
    };
  }

  return {
    isValid: true,
    normalizedToken,
    error: null,
  };
}

/**
 * Validates and sanitizes an internal redirect target to prevent open-redirect vulnerabilities.
 *
 * Rejects:
 * - Empty or non-string values
 * - Protocol-relative URLs (`//evil.com`)
 * - Backslash-prefixed paths (`/\evil.com`)
 * - Absolute URLs with schemes (`https://`, `http://`, `javascript:`, `data:`, etc.)
 * - Control characters or whitespace injection
 *
 * Allows only clean internal paths starting with a single `/` (and optional `#section` hash).
 */
export function sanitizeInternalRedirectPath(
  candidate: string | null | undefined,
  fallback: string = '/'
): string {
  if (!candidate || typeof candidate !== 'string') {
    return fallback;
  }

  const trimmed = candidate.trim();
  if (!trimmed) {
    return fallback;
  }

  // Reject control characters
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) {
    return fallback;
  }

  // Must start with a single forward slash and must NOT start with // or /\
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }

  // Reject any embedded scheme pattern or backslash traversal
  if (trimmed.includes('\\') || /^[a-zA-Z][a-zA-Z\d+\-.]*:/i.test(trimmed)) {
    return fallback;
  }

  try {
    const baseOrigin = 'https://hub.khaispace.local';
    const parsed = new URL(trimmed, baseOrigin);
    if (parsed.origin !== baseOrigin) {
      return fallback;
    }

    // Prevent redirecting back into the auth callback loop
    if (parsed.pathname.startsWith('/auth/callback')) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Builds the browser callback URL for Magic Link / Email OTP redirects.
 * Compatible with static export on both `localhost` and `hub.khaispace.com`.
 */
export function buildAuthCallbackUrl(nextPath: string = '/'): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const safeNext = sanitizeInternalRedirectPath(nextPath, '/');
  const callbackUrl = new URL('/auth/callback', window.location.origin);
  if (safeNext && safeNext !== '/') {
    callbackUrl.searchParams.set('next', safeNext);
  }
  return callbackUrl.toString();
}

/**
 * Redacts any token-like or secret-like substrings from diagnostic strings
 * so raw tokens are never leaked to UI error messages.
 */
function redactSensitiveTokens(text: string): string {
  return text
    .replace(/access_token=[^&\s]+/gi, 'access_token=[REDACTED]')
    .replace(/refresh_token=[^&\s]+/gi, 'refresh_token=[REDACTED]')
    .replace(/token_hash=[^&\s]+/gi, 'token_hash=[REDACTED]')
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[REDACTED_JWT]');
}

/**
 * Checks whether a Supabase `signInWithOtp` error indicates that the email is not
 * registered or that automatic user signup is disabled (`shouldCreateUser: false`).
 *
 * When this returns `true`, the caller MUST treat the request as a privacy-preserving
 * neutral completion so attackers cannot enumerate registered workspace emails.
 */
export function isEnumerationSensitiveOtpError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const authError = error as Partial<AuthError> & { code?: string; message?: string };
  const code = (authError.code ?? '').toLowerCase();
  const message = (authError.message ?? '').toLowerCase();

  if (
    code === 'otp_disabled' ||
    code === 'user_not_found' ||
    code === 'signup_disabled'
  ) {
    return true;
  }

  if (
    message.includes('signups not allowed for otp') ||
    message.includes('signups not allowed') ||
    message.includes('user not found')
  ) {
    return true;
  }

  return false;
}

/**
 * Normalizes any Supabase AuthError or runtime exception into a safe, user-friendly
 * `NormalizedAuthError` without leaking tokens or internal stack details.
 */
export function normalizeSupabaseAuthError(error: unknown): NormalizedAuthError {
  if (!error) {
    return {
      category: 'unknown_error',
      message: 'An unexpected authentication error occurred. Please try again.',
    };
  }

  if (error instanceof Error && error.message.includes('Missing Supabase public configuration')) {
    return {
      category: 'configuration_error',
      message:
        'Supabase public environment variables are not configured. Define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in apps/hub/.env.local.',
      code: 'missing_supabase_env',
    };
  }

  const authErr = error as Partial<AuthError> & {
    code?: string;
    status?: number;
    message?: string;
  };
  const code = (authErr.code ?? '').toLowerCase();
  const rawMessage = redactSensitiveTokens(authErr.message ?? '');
  const lowerMessage = rawMessage.toLowerCase();

  if (
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit' ||
    authErr.status === 429 ||
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('for security purposes, you can only request this')
  ) {
    return {
      category: 'rate_limited',
      message:
        'Too many sign-in attempts in a short period. Please wait a minute before requesting another code.',
      code: code || 'rate_limited',
    };
  }

  if (
    code === 'otp_expired' ||
    lowerMessage.includes('token has expired or is invalid') ||
    lowerMessage.includes('invalid otp')
  ) {
    return {
      category: 'invalid_otp',
      message:
        'The verification code or sign-in link has expired or is invalid. Please request a fresh sign-in email.',
      code: code || 'otp_expired',
    };
  }

  if (
    code === 'bad_code_verifier' ||
    code === 'flow_state_not_found' ||
    code === 'flow_state_expired' ||
    lowerMessage.includes('code verifier') ||
    lowerMessage.includes('both auth code and code verifier should be non-empty')
  ) {
    return {
      category: 'expired_or_invalid_link',
      message:
        'This sign-in link was opened in a different browser or has expired. Please request a new link or enter the 6-digit verification code directly on the login screen.',
      code: code || 'pkce_verifier_mismatch',
    };
  }

  if (
    lowerMessage.includes('failed to fetch') ||
    lowerMessage.includes('networkerror') ||
    lowerMessage.includes('network request failed')
  ) {
    return {
      category: 'network_error',
      message:
        'Unable to reach the authentication service. Please check your network connection and try again.',
      code: 'network_error',
    };
  }

  if (
    code === 'invalid_credentials' ||
    code === 'unauthorized' ||
    authErr.status === 401 ||
    authErr.status === 403
  ) {
    return {
      category: 'unauthorized',
      message: 'Authentication could not be verified. Please request a new sign-in code.',
      code: code || 'unauthorized',
    };
  }

  return {
    category: 'unknown_error',
    message:
      rawMessage && rawMessage.length < 180
        ? rawMessage
        : 'Authentication request could not be completed. Please try again.',
    code: code || undefined,
  };
}

/**
 * Extracts a sanitized user summary from a Supabase `User` object.
 */
export function toAuthenticatedUserSummary(
  user: User | null | undefined
): AuthenticatedUserSummary | null {
  if (!user || !user.id || !user.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    emailConfirmedAt: user.email_confirmed_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
  };
}

/**
 * Extracts sanitized session metadata without exposing `access_token` or `refresh_token`.
 */
export function toSessionMetadataSummary(
  session: Session | null | undefined
): SessionMetadataSummary | null {
  if (!session || !session.user || !session.user.id || !session.user.email) {
    return null;
  }

  const expiresAt = session.expires_at ?? null;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const isExpired = expiresAt !== null ? expiresAt <= nowSeconds : false;

  return {
    userId: session.user.id,
    email: session.user.email,
    expiresAt,
    isExpired,
  };
}

/**
 * Parses URL search parameters and hash fragment parameters on the auth callback route.
 * Never returns raw tokens in error strings.
 */
export function parseAuthCallbackParams(
  search: string,
  hash: string
): ParsedAuthCallbackParams {
  const searchParams = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const rawHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const hashParams = new URLSearchParams(rawHash);

  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash') ?? hashParams.get('token_hash');
  const rawType = (searchParams.get('type') ?? hashParams.get('type') ?? '').toLowerCase();
  const otpType = VALID_EMAIL_OTP_TYPES.includes(rawType as EmailOtpType)
    ? (rawType as EmailOtpType)
    : null;

  const hasHashAccessToken =
    hashParams.has('access_token') || hashParams.has('refresh_token');

  const errorCode =
    searchParams.get('error_code') ??
    hashParams.get('error_code') ??
    searchParams.get('error') ??
    hashParams.get('error');

  const rawErrorDescription =
    searchParams.get('error_description') ?? hashParams.get('error_description');

  const errorDescription = rawErrorDescription
    ? redactSensitiveTokens(rawErrorDescription.replace(/\+/g, ' '))
    : null;

  const redirectCandidate =
    searchParams.get('next') ??
    searchParams.get('redirect_to') ??
    hashParams.get('next');

  return {
    code,
    tokenHash,
    otpType,
    hasHashAccessToken,
    errorCode,
    errorDescription,
    redirectPath: sanitizeInternalRedirectPath(redirectCandidate, '/'),
  };
}

/**
 * Initiates passwordless Email Magic Link / Email OTP sign-in for an existing user.
 *
 * Security invariants:
 * - Enforces `shouldCreateUser: false` so arbitrary visitors cannot self-register.
 * - Normalizes unregistered-email errors into a neutral confirmation so callers
 *   cannot enumerate whether an arbitrary email exists in `auth.users`.
 */
export async function signInWithEmailOtp(
  email: string,
  nextPath: string = '/'
): Promise<AuthOperationResult<{ email: string }>> {
  const validation = validateAuthEmail(email);
  if (!validation.isValid || validation.error) {
    return {
      success: false,
      data: null,
      error: validation.error,
    };
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const emailRedirectTo = buildAuthCallbackUrl(nextPath);

    const { error } = await supabase.auth.signInWithOtp({
      email: validation.normalizedEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo,
      },
    });

    if (error) {
      // Prevent account enumeration when `shouldCreateUser: false` rejects an unknown email
      if (isEnumerationSensitiveOtpError(error)) {
        return {
          success: true,
          data: { email: validation.normalizedEmail },
          error: null,
          neutralNotice: PRIVACY_PRESERVING_OTP_CONFIRMATION,
        };
      }

      return {
        success: false,
        data: null,
        error: normalizeSupabaseAuthError(error),
      };
    }

    return {
      success: true,
      data: { email: validation.normalizedEmail },
      error: null,
      neutralNotice: PRIVACY_PRESERVING_OTP_CONFIRMATION,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: normalizeSupabaseAuthError(err),
    };
  }
}

/**
 * Verifies a 6-digit Email OTP code entered directly on the login screen.
 */
export async function verifyEmailOtpCode(
  email: string,
  token: string
): Promise<AuthOperationResult<{ user: User; session: Session }>> {
  const emailValidation = validateAuthEmail(email);
  if (!emailValidation.isValid || emailValidation.error) {
    return {
      success: false,
      data: null,
      error: emailValidation.error,
    };
  }

  const tokenValidation = validateOtpToken(token);
  if (!tokenValidation.isValid || tokenValidation.error) {
    return {
      success: false,
      data: null,
      error: tokenValidation.error,
    };
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email: emailValidation.normalizedEmail,
      token: tokenValidation.normalizedToken,
      type: 'email',
    });

    if (error || !data.session || !data.user) {
      return {
        success: false,
        data: null,
        error: error
          ? normalizeSupabaseAuthError(error)
          : {
              category: 'invalid_otp',
              message:
                'Verification code could not be validated. Please check the code or request a new email.',
            },
      };
    }

    return {
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: normalizeSupabaseAuthError(err),
    };
  }
}

/**
 * Completes an authentication callback returned via Magic Link (`token_hash`, PKCE `code`,
 * or URL hash fragment session).
 */
export async function completeAuthCallbackFromUrl(
  search: string,
  hash: string
): Promise<
  AuthOperationResult<{
    session: Session;
    user: User;
    redirectPath: string;
  }>
> {
  const parsed = parseAuthCallbackParams(search, hash);

  if (parsed.errorCode || parsed.errorDescription) {
    return {
      success: false,
      data: null,
      error: normalizeSupabaseAuthError({
        code: parsed.errorCode ?? 'otp_expired',
        message:
          parsed.errorDescription ??
          'The sign-in link has expired or has already been used. Please request a new sign-in link.',
      }),
    };
  }

  try {
    const supabase = getSupabaseBrowserClient();

    // Case 1: PKCE Authorization Code (`?code=...`)
    if (parsed.code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(parsed.code);
      if (error || !data.session || !data.user) {
        return {
          success: false,
          data: null,
          error: normalizeSupabaseAuthError(
            error ?? new Error('Unable to exchange authorization code for a valid session.')
          ),
        };
      }

      return {
        success: true,
        data: {
          session: data.session,
          user: data.user,
          redirectPath: parsed.redirectPath,
        },
        error: null,
      };
    }

    // Case 2: Token Hash verification (`?token_hash=...&type=...`)
    if (parsed.tokenHash && parsed.otpType) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: parsed.tokenHash,
        type: parsed.otpType,
      });

      if (error || !data.session || !data.user) {
        return {
          success: false,
          data: null,
          error: normalizeSupabaseAuthError(
            error ?? new Error('The sign-in link has expired or is invalid.')
          ),
        };
      }

      return {
        success: true,
        data: {
          session: data.session,
          user: data.user,
          redirectPath: parsed.redirectPath,
        },
        error: null,
      };
    }

    // Case 3: Implicit hash fragment (`#access_token=...`) detected by Supabase client or existing session
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return {
        success: false,
        data: null,
        error: normalizeSupabaseAuthError(error),
      };
    }

    if (data.session && data.session.user) {
      return {
        success: true,
        data: {
          session: data.session,
          user: data.session.user,
          redirectPath: parsed.redirectPath,
        },
        error: null,
      };
    }

    return {
      success: false,
      data: null,
      error: {
        category: 'expired_or_invalid_link',
        message:
          'No active authentication token was found in this link, or the link has already been used. Please sign in from the login screen.',
        code: 'missing_callback_credentials',
      },
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: normalizeSupabaseAuthError(err),
    };
  }
}

/**
 * Retrieves the current browser session from Supabase Auth.
 */
export async function getCurrentSession(): Promise<
  AuthOperationResult<{ session: Session | null; user: User | null }>
> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return {
        success: false,
        data: null,
        error: normalizeSupabaseAuthError(error),
      };
    }

    return {
      success: true,
      data: {
        session: data.session,
        user: data.session?.user ?? null,
      },
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: normalizeSupabaseAuthError(err),
    };
  }
}

/**
 * Retrieves the currently authenticated user verified against the Supabase Auth server.
 */
export async function getCurrentUser(): Promise<AuthOperationResult<{ user: User | null }>> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return {
        success: false,
        data: null,
        error: normalizeSupabaseAuthError(error),
      };
    }

    return {
      success: true,
      data: {
        user: data.user ?? null,
      },
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: normalizeSupabaseAuthError(err),
    };
  }
}

/**
 * Signs out the current user and clears the `khaispace-hub-auth` local session.
 */
export async function signOutCurrentUser(): Promise<AuthOperationResult<void>> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        data: null,
        error: normalizeSupabaseAuthError(error),
      };
    }

    return {
      success: true,
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: normalizeSupabaseAuthError(err),
    };
  }
}

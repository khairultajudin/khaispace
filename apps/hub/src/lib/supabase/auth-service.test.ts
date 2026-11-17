import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import {
  type AuthCallbackClient,
  completeAuthCallbackFromUrl,
  runBrowserAuthCallback,
  sanitizeInternalRedirectPath,
  validateOtpToken,
} from './auth-service';

function createMockUser(email = 'owner@khaispace.com'): User {
  return {
    id: 'user-owner-1',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-11-15T15:25:15.000Z',
    email,
    email_confirmed_at: '2026-11-15T15:25:15.000Z',
    last_sign_in_at: '2026-11-16T00:00:00.000Z',
  } as User;
}

function createMockSession(user: User): Session {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user,
  };
}

function createMockAuthClient(
  overrides: Partial<AuthCallbackClient> = {}
): AuthCallbackClient {
  return {
    exchangeCodeForSession: async () => ({
      data: { session: null, user: null },
      error: null,
    }),
    verifyOtp: async () => ({
      data: { session: null, user: null },
      error: null,
    }),
    setSession: async () => ({
      data: { session: null, user: null },
      error: null,
    }),
    getSession: async () => ({
      data: { session: null },
      error: null,
    }),
    ...overrides,
  };
}

describe('auth-service callback and validation', () => {
  it('1. establishes a session from a valid implicit-flow hash via setSession', async () => {
    const mockUser = createMockUser();
    const mockSession = createMockSession(mockUser);
    let capturedTokens: { access_token: string; refresh_token: string } | null = null;

    const client = createMockAuthClient({
      setSession: async (tokens) => {
        capturedTokens = tokens;
        return { data: { session: mockSession, user: mockUser }, error: null };
      },
    });

    const result = await completeAuthCallbackFromUrl(
      '?next=/projects',
      '#access_token=acc-valid-123&refresh_token=ref-valid-456&type=magiclink',
      client
    );

    assert.equal(result.success, true);
    assert.deepEqual(capturedTokens, {
      access_token: 'acc-valid-123',
      refresh_token: 'ref-valid-456',
    });
    assert.equal(result.data?.user.email, 'owner@khaispace.com');
    assert.equal(result.data?.redirectPath, '/projects');
  });

  it('2. rejects missing or empty access_token safely without calling setSession', async () => {
    let setSessionCalled = false;
    const client = createMockAuthClient({
      setSession: async () => {
        setSessionCalled = true;
        return { data: { session: null, user: null }, error: null };
      },
    });

    const missingAccess = await completeAuthCallbackFromUrl(
      '',
      '#refresh_token=ref-only-456&type=magiclink',
      client
    );
    assert.equal(missingAccess.success, false);
    assert.equal(missingAccess.error?.category, 'expired_or_invalid_link');
    assert.equal(missingAccess.error?.code, 'incomplete_implicit_tokens');

    const emptyAccess = await completeAuthCallbackFromUrl(
      '',
      '#access_token=%20%20&refresh_token=ref-only-456',
      client
    );
    assert.equal(emptyAccess.success, false);
    assert.equal(emptyAccess.error?.code, 'incomplete_implicit_tokens');
    assert.equal(setSessionCalled, false);
  });

  it('3. rejects missing or empty refresh_token safely without calling setSession', async () => {
    let setSessionCalled = false;
    const client = createMockAuthClient({
      setSession: async () => {
        setSessionCalled = true;
        return { data: { session: null, user: null }, error: null };
      },
    });

    const missingRefresh = await completeAuthCallbackFromUrl(
      '',
      '#access_token=acc-only-123&type=magiclink',
      client
    );
    assert.equal(missingRefresh.success, false);
    assert.equal(missingRefresh.error?.category, 'expired_or_invalid_link');
    assert.equal(missingRefresh.error?.code, 'incomplete_implicit_tokens');

    const emptyRefresh = await completeAuthCallbackFromUrl(
      '',
      '#access_token=acc-only-123&refresh_token=',
      client
    );
    assert.equal(emptyRefresh.success, false);
    assert.equal(emptyRefresh.error?.code, 'incomplete_implicit_tokens');
    assert.equal(setSessionCalled, false);
  });

  it('4. returns a clear sanitized error when implicit tokens are invalid or expired', async () => {
    const client = createMockAuthClient({
      setSession: async () => ({
        data: { session: null, user: null },
        error: {
          name: 'AuthApiError',
          message: 'Token has expired or is invalid: access_token=secret-jwt-value',
          status: 401,
          code: 'otp_expired',
        } as unknown as AuthError,
      }),
    });

    const result = await completeAuthCallbackFromUrl(
      '',
      '#access_token=expired-acc&refresh_token=expired-ref',
      client
    );

    assert.equal(result.success, false);
    assert.equal(result.error?.category, 'invalid_otp');
    assert.equal(result.error?.code, 'otp_expired');
    assert.equal(result.error?.message.includes('secret-jwt-value'), false);
    assert.equal(result.error?.message.includes('expired-acc'), false);
  });

  it('5. preserves PKCE ?code=... callback flow', async () => {
    const mockUser = createMockUser();
    const mockSession = createMockSession(mockUser);
    let exchangedCode: string | null = null;

    const client = createMockAuthClient({
      exchangeCodeForSession: async (code) => {
        exchangedCode = code;
        return { data: { session: mockSession, user: mockUser }, error: null };
      },
    });

    const result = await completeAuthCallbackFromUrl(
      '?code=pkce-auth-code-789&next=/finance',
      '',
      client
    );

    assert.equal(result.success, true);
    assert.equal(exchangedCode, 'pkce-auth-code-789');
    assert.equal(result.data?.redirectPath, '/finance');
  });

  it('6. captures tokens before URL cleanup scrubs search and hash', async () => {
    const mockUser = createMockUser();
    const mockSession = createMockSession(mockUser);
    const events: string[] = [];

    const env = {
      search: '?next=/notes',
      hash: '#access_token=acc-before-scrub&refresh_token=ref-before-scrub',
      scrubUrl: () => {
        events.push('scrubbed');
        env.search = '';
        env.hash = '';
      },
    };

    const client = createMockAuthClient({
      setSession: async (tokens) => {
        events.push(`setSession:${tokens.access_token}:${tokens.refresh_token}`);
        return { data: { session: mockSession, user: mockUser }, error: null };
      },
    });

    const result = await runBrowserAuthCallback(env, client);

    assert.equal(result.success, true);
    assert.equal(env.search, '');
    assert.equal(env.hash, '');
    assert.deepEqual(events, [
      'scrubbed',
      'setSession:acc-before-scrub:ref-before-scrub',
    ]);
    assert.equal(result.data?.redirectPath, '/notes');
  });

  it('7. single-execution guard prevents duplicate callback processing', async () => {
    const mockUser = createMockUser();
    const mockSession = createMockSession(mockUser);
    let setSessionCount = 0;
    let hasProcessed = false;

    const client = createMockAuthClient({
      setSession: async () => {
        setSessionCount += 1;
        return { data: { session: mockSession, user: mockUser }, error: null };
      },
    });

    const invokeOnce = async () => {
      if (hasProcessed) {
        return null;
      }
      hasProcessed = true;
      return runBrowserAuthCallback(
        {
          search: '',
          hash: '#access_token=acc-once&refresh_token=ref-once',
          scrubUrl: () => {},
        },
        client
      );
    };

    const first = await invokeOnce();
    const second = await invokeOnce();

    assert.equal(first?.success, true);
    assert.equal(second, null);
    assert.equal(setSessionCount, 1);
  });

  it('8. preserves 6-digit OTP validation and internal redirect sanitization', () => {
    assert.equal(validateOtpToken(' 012345 ').isValid, true);
    assert.equal(validateOtpToken(' 012345 ').normalizedToken, '012345');
    assert.equal(validateOtpToken('12345').isValid, false);
    assert.equal(validateOtpToken('1234567').isValid, false);
    assert.equal(validateOtpToken('12a456').isValid, false);

    assert.equal(sanitizeInternalRedirectPath('/projects?view=all'), '/projects?view=all');
    assert.equal(sanitizeInternalRedirectPath('//evil.com'), '/');
    assert.equal(sanitizeInternalRedirectPath('https://evil.com'), '/');
    assert.equal(sanitizeInternalRedirectPath('/auth/callback?code=123'), '/');
  });
});

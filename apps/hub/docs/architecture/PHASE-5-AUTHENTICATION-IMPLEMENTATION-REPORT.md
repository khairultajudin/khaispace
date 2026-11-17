# Khai Space Hub — Phase 5 Authentication Implementation Report
**Document Version:** 1.0.0
**Phase:** Phase 5 — Authentication Foundation & Private Workspace Access
**Application Target:** `apps/hub/`
**Working Branch:** `feature/khai-space-hub`
**Repository:** `khairultajudin/khaispace`

---

## 1. Executive Summary

Phase 5 implements the **client-side authentication foundation and private workspace access gate** for **Khai Space Hub** (`apps/hub/`) using the dedicated Supabase project **`khai-space-hub`** (`dpicdhjaabfjbvppmsxk`, region `ap-southeast-1` Singapore) provisioned in Phase 4 and the 1:1 schema-reconciled TypeScript definitions completed in Phase 4.1.

All Phase 5 deliverables have been engineered in strict compliance with the Next.js 16.3.8 static export architecture (`output: "export"`), the existing single-page `#section` navigation model across all 7 Hub modules, and the invitation-only security architecture defined in Phase 3:

- **Passwordless Existing-User Authentication (`apps/hub/src/lib/supabase/auth-service.ts`):** Implements strongly typed Email Magic Link and 6-digit Email OTP flows via `supabase.auth.signInWithOtp` with `shouldCreateUser: false` strictly enforced, `verifyOtp`, `exchangeCodeForSession`, `getSession`, `getUser`, `signOut`, open-redirect sanitization, token redaction, and privacy-preserving account-enumeration protection.
- **Shared Authentication Hook & Provider (`apps/hub/src/hooks/use-auth.ts`):** Exposes a clean, token-redacted `useAuth()` contract (`user`, `session`, `isLoading`, `isAuthenticated`, `error`, `workspaceAccessStatus`, `signInWithEmail`, `verifyOtp`, `signOut`, `clearError`) backed by a single `onAuthStateChange` subscription with StrictMode deduplication and unmount protection.
- **Private Login Interface (`apps/hub/src/components/auth/login-view.tsx` & `apps/hub/src/app/login/page.tsx`):** Provides a calm, accessible light-mode login screen matching the Hub aesthetic (`#FAF8F4` paper background, `#0C2340` deep navy typography, `#E9E5DC` warm neutral surfaces, `#347A63` muted green accents) with both Magic Link request and direct 6-digit OTP code entry, and zero public sign-up or social login surfaces.
- **Static-Export Callback Handler (`apps/hub/src/components/auth/auth-callback-view.tsx` & `apps/hub/src/app/auth/callback/page.tsx`):** Processes PKCE `?code=...`, `?token_hash=...&type=...`, and `#access_token=...` hash fragments entirely in the browser, scrubs sensitive URL parameters via `window.history.replaceState`, and enforces internal-only redirect paths.
- **Application Shell Guard (`apps/hub/src/components/auth/auth-guard.tsx`):** Protects `apps/hub/src/app/page.tsx` without flashing protected dashboard content while unauthenticated or loading, displays the signed-in user's email and Sign Out controls in `Header` and `Sidebar`, and preserves all 7 Hub modules and deep-link hashes (`#overview`, `#projects`, `#tasks`, `#finance`, `#subscriptions`, `#notes`, `#settings`) without modification.

---

## 2. Starting Repository State

Prior to making any Phase 5 changes, the repository state was verified:

- **Repository:** `https://github.com/khairultajudin/khaispace.git`
- **Branch:** `feature/khai-space-hub`
- **Verified Starting HEAD:** `e389b38417a727d022a9d4e34571678a24b74c45` (`fix(hub): reconcile database types with approved schema`)
- **Working Tree Status:** Clean (`git status --short` returned zero modified or untracked files)
- **Dependency Baseline:** `@supabase/supabase-js` (`^2.103.0`), `next` (`16.3.8`), `react` (`19.2.8`), `lucide-react` (`^1.16.0`), `tailwindcss` (`^4`). Zero new packages were installed in Phase 5.

---

## 3. Architectural Fit with Next.js Static Export

Khai Space Hub uses `output: "export"` in [`apps/hub/next.config.ts`](file:///e:/KhaiSpace/apps/hub/next.config.ts) for static hosting on Cloudflare Pages (`hub.khaispace.com`).

| Static Export Constraint | Phase 5 Engineering Solution |
|:---|:---|
| No Next.js Server Actions, Middleware (`middleware.ts`), or dynamic Route Handlers (`route.ts`) | All authentication flows execute client-side via `@supabase/supabase-js` using `getSupabaseBrowserClient()`. Zero server-only modules or `@supabase/ssr` imports are used. |
| Static HTML route generation required at build time | Three static entry points are exported into `apps/hub/out`: `/` (`index.html`), `/login` (`login.html`), and `/auth/callback` (`auth/callback.html`). |
| Hash-based single-page navigation (`#projects`, `#finance`, `#tx-...`, etc.) | `AuthGuard` captures the full internal path + search + `#hash` prior to sign-in and restores hash deep-links seamlessly after authentication. |
| Browser-only storage (`window.localStorage`) | Session persistence uses the isolated storage key `khaispace-hub-auth` with `typeof window !== 'undefined'` guards so static prerendering succeeds during `next build`. |

---

## 4. Private Access & Invitation-Only Model

Khai Space Hub is a private personal business and project command center. Its access model enforces three strict boundaries:

1. **No Self-Registration UI:** `LoginView` contains no "Sign Up", "Create Account", password registration, or third-party OAuth buttons.
2. **Existing-User Enforcement (`shouldCreateUser: false`):** Every call to `supabase.auth.signInWithOtp` in [`auth-service.ts`](file:///e:/KhaiSpace/apps/hub/src/lib/supabase/auth-service.ts#L384-L391) passes `options: { shouldCreateUser: false, emailRedirectTo }`. This instructs Supabase Auth not to create a new `auth.users` record when an unknown email address requests a Magic Link or OTP.
3. **Privacy-Preserving Account Enumeration Protection:** When Supabase Auth returns an error indicating that the submitted email does not exist or signups are disabled (`otp_disabled`, `user_not_found`, `signup_disabled`, or `"Signups not allowed for otp"`), `isEnumerationSensitiveOtpError()` intercepts the response and returns the exact same neutral confirmation message (`PRIVACY_PRESERVING_OTP_CONFIRMATION`) as a registered email. An external visitor cannot probe the login form to discover which email addresses exist in `auth.users`.

---

## 5. First-Owner Onboarding Flow

Because `shouldCreateUser: false` blocks automatic user creation from the login form, the initial workspace Owner account must exist in Supabase Authentication before first sign-in:

1. **Provision Owner Identity in Supabase Dashboard:**
   - Open Supabase Dashboard (`khai-space-hub` / `dpicdhjaabfjbvppmsxk`) $\rightarrow$ **Authentication** $\rightarrow$ **Users**.
   - Click **Add user** $\rightarrow$ **Create new user** (or **Send invitation**) using the Owner's primary email address (with **Auto Confirm User** enabled when creating directly).
2. **Sign In via Hub Login Screen:**
   - Navigate to `https://hub.khaispace.com` (or `http://localhost:3001` in local development, matching `next dev --port 3001` in `apps/hub/package.json`).
   - Enter the provisioned Owner email address and click **Send Magic Link / Email OTP**.
   - Complete sign-in either by clicking the Magic Link in the email (which routes through `/auth/callback`) or by entering the 6-digit OTP code directly on the login screen.
3. **Phase 6 Workspace Bootstrap (Next Phase):**
   - Once the Phase 3 SQL schema (`schema-draft.sql`) is deployed in Phase 6, the `on_auth_user_created` trigger (`handle_new_user_profile()`) and the `create_initial_workspace` RPC procedure will bind the authenticated `auth.users` identity to `public.profiles`, `public.workspaces`, and `public.workspace_members` with `role = 'Owner'`.

---

## 6. Authentication Service Design

**File:** [`apps/hub/src/lib/supabase/auth-service.ts`](file:///e:/KhaiSpace/apps/hub/src/lib/supabase/auth-service.ts)

The authentication service encapsulates all direct calls to `getSupabaseBrowserClient().auth`:

| Function | Responsibility & Security Controls |
|:---|:---|
| `validateAuthEmail(rawEmail)` | Trims, lowercases, and validates email syntax and RFC length ($\le 254$ chars) before any network request. |
| `validateOtpToken(rawToken)` | Strips whitespace and validates 6-to-8 digit numeric OTP codes. |
| `sanitizeInternalRedirectPath(candidate, fallback)` | Prevents open-redirect attacks by rejecting external origins, `//evil.com`, `/\evil.com`, embedded schemes (`https:`, `javascript:`, `data:`), control characters, and `/auth/callback` loops. |
| `buildAuthCallbackUrl(nextPath)` | Constructs `<origin>/auth/callback?next=<safePath>` in browser contexts. |
| `isEnumerationSensitiveOtpError(error)` | Detects `otp_disabled`, `user_not_found`, `signup_disabled`, and `"Signups not allowed for otp"` so unknown emails receive a neutral confirmation. |
| `normalizeSupabaseAuthError(error)` | Maps Supabase Auth errors into structured categories (`invalid_email`, `invalid_otp`, `expired_or_invalid_link`, `rate_limited`, `configuration_error`, `network_error`, `unauthorized`, `unknown_error`) and redacts any JWT or token substrings via `redactSensitiveTokens()`. |
| `signInWithEmailOtp(email, nextPath)` | Calls `supabase.auth.signInWithOtp` with `shouldCreateUser: false` and `emailRedirectTo`. |
| `verifyEmailOtpCode(email, token)` | Calls `supabase.auth.verifyOtp({ email, token, type: 'email' })`. |
| `completeAuthCallbackFromUrl(search, hash)` | Handles PKCE `?code=...` (`exchangeCodeForSession`), `?token_hash=...&type=...` (`verifyOtp`), and implicit `#access_token=...` (`getSession`). |
| `getCurrentSession()` / `getCurrentUser()` | Safely queries current session and user state with normalized error handling. |
| `signOutCurrentUser()` | Calls `supabase.auth.signOut()` to clear the `khaispace-hub-auth` browser session. |

---

## 7. Authentication Hook Design

**File:** [`apps/hub/src/hooks/use-auth.ts`](file:///e:/KhaiSpace/apps/hub/src/hooks/use-auth.ts)

`AuthProvider` and `useAuth()` manage reactive authentication state across the Hub shell:

- **Single Subscription Invariant:** `AuthProvider` registers a single `supabase.auth.onAuthStateChange` listener guarded by `subscriptionActiveRef` to prevent duplicate listeners under React 19 StrictMode, and unsubscribes cleanly on unmount.
- **Handled Lifecycle Events:** `INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, and `USER_UPDATED`.
- **Sanitized UI Summaries:** Exposes `AuthenticatedUserSummary` (`id`, `email`, `emailConfirmedAt`, `lastSignInAt`) and `SessionMetadataSummary` (`userId`, `email`, `expiresAt`, `isExpired`). Raw `access_token` and `refresh_token` values are never exposed on the React context contract.
- **Explicit Workspace Access Boundary Field:** Exposes `workspaceAccessStatus` (`'unauthenticated'` or `'authenticated_membership_unverified_phase_6'`), ensuring no UI component mistakes Phase 5 authentication for verified database role authorization.

---

## 8. Login UI Design

**Files:**
- [`apps/hub/src/components/auth/login-view.tsx`](file:///e:/KhaiSpace/apps/hub/src/components/auth/login-view.tsx)
- [`apps/hub/src/app/login/page.tsx`](file:///e:/KhaiSpace/apps/hub/src/app/login/page.tsx)

Key interface and accessibility characteristics:
- **Visual Consistency:** Built with the exact Khai Space Hub light-mode palette (`#FAF8F4` background, `#0C2340` text, `#E9E5DC` neutral badges, `#DCD7CC` borders, `#347A63` primary action buttons).
- **Dual Passwordless Completion:** Users can request a Magic Link / OTP email and either click the link in their inbox or enter the 6-digit numeric OTP code directly in the second step (`step === 'verify_otp'`). Users who already have an active 6-digit code can also switch directly to the OTP verification form.
- **Accessibility:** Includes explicit `<label htmlFor="...">` bindings, `role="alert"` (`aria-live="assertive"`) for error notices, `role="status"` (`aria-live="polite"`) for email confirmation notices, `inputMode="numeric"` and `autoComplete="one-time-code"` for OTP entry, and full keyboard submission support.

---

## 9. Callback & Redirect Handling

**Files:**
- [`apps/hub/src/components/auth/auth-callback-view.tsx`](file:///e:/KhaiSpace/apps/hub/src/components/auth/auth-callback-view.tsx)
- [`apps/hub/src/app/auth/callback/page.tsx`](file:///e:/KhaiSpace/apps/hub/src/app/auth/callback/page.tsx)

When a user clicks a Magic Link from their email:
1. The browser loads `/auth/callback` (statically exported as `out/auth/callback.html`).
2. `AuthCallbackView` invokes `completeAuthCallbackFromUrl(window.location.search, window.location.hash)` once via `hasProcessedRef`.
3. Immediately after reading the URL parameters, `window.history.replaceState({}, document.title, window.location.pathname)` scrubs any `code`, `token_hash`, or `access_token` parameters from the browser address bar.
4. On success, the destination path is validated through `sanitizeInternalRedirectPath()` and the user is redirected to their internal workspace route.
5. On failure (expired link, already-used OTP, PKCE verifier mismatch across browsers, or malformed parameters), a clear recovery alert is displayed with a direct **Return to Sign In** action (`/login`).

---

## 10. Authentication Guard Behavior

**Files:**
- [`apps/hub/src/components/auth/auth-guard.tsx`](file:///e:/KhaiSpace/apps/hub/src/components/auth/auth-guard.tsx)
- [`apps/hub/src/app/layout.tsx`](file:///e:/KhaiSpace/apps/hub/src/app/layout.tsx)
- [`apps/hub/src/app/page.tsx`](file:///e:/KhaiSpace/apps/hub/src/app/page.tsx)
- [`apps/hub/src/components/layout/header.tsx`](file:///e:/KhaiSpace/apps/hub/src/components/layout/header.tsx)
- [`apps/hub/src/components/layout/sidebar.tsx`](file:///e:/KhaiSpace/apps/hub/src/components/layout/sidebar.tsx)

1. **Initialization State (`isLoading === true`):** `AuthGuard` renders a centered `"Verifying Workspace Session..."` card (`aria-busy="true"`). Protected dashboard components are not mounted until session verification completes.
2. **Unauthenticated State (`!isAuthenticated`):** `AuthGuard` renders `<LoginView />` directly in place of `<DashboardView />`, preserving the requested internal path/hash for post-login restoration.
3. **Authenticated State (`isAuthenticated === true`):** `AuthGuard` renders `<DashboardView />`. Both `Header` and `Sidebar` display the authenticated user's email address, the Phase 5 authentication status badge (`DB Roles: Phase 6`), and a working **Sign Out** button that clears the session and immediately returns the UI to `<LoginView />`.

---

## 11. Workspace Membership Boundary & Phase 6 Dependency

> [!IMPORTANT]
> **Strict Architectural Boundary Between Phase 5 Authentication and Phase 6 Database Authorization:**
> - **What Phase 5 Verifies:** Phase 5 verifies that the browser holds a valid, non-expired Supabase Auth session (`auth.users`) issued via passwordless Email Magic Link or Email OTP.
> - **What Phase 5 Does NOT Claim:** Phase 5 does **not** verify `public.workspace_members` membership, workspace invitation acceptance (`accept_workspace_invitation`), or database role permissions (`Owner`, `Admin`, `Collaborator`, `Viewer`), because the Phase 3 SQL schema (`schema-draft.sql`) has not yet been deployed to the remote Supabase database.
> - **UI & Code Transparency:** `useAuth()` explicitly sets `workspaceAccessStatus = 'authenticated_membership_unverified_phase_6'`, and the Hub shell (`Header` and `Sidebar`) surfaces `"Phase 5 Auth"` / `"DB Roles: Phase 6"` rather than claiming verified Owner/Admin database authorization from authentication alone.
> - **Existing Modules Preserved:** Once authenticated in Phase 5, the 7 Hub modules continue to render their local in-memory session/sample state until Phase 6 (Schema & RLS Deployment) and Phases 7–9 (Service Persistence) are executed.

---

## 12. Security Controls Implemented

| Security Control | Implementation Location | Verification |
|:---|:---|:---|
| Existing-user-only OTP (`shouldCreateUser: false`) | `auth-service.ts` (`signInWithEmailOtp`) | Prevents uninvited visitors from creating `auth.users` records via the login form. |
| Account enumeration prevention | `auth-service.ts` (`isEnumerationSensitiveOtpError` + `PRIVACY_PRESERVING_OTP_CONFIRMATION`) | Identical neutral confirmation returned for both registered and unregistered email addresses. |
| Open-redirect prevention | `auth-service.ts` (`sanitizeInternalRedirectPath`) | Rejects `https://evil.com`, `//evil.com`, `/\evil.com`, `javascript:alert(1)`, `data:...`, control chars, and `/auth/callback` loops. |
| Token & JWT redaction | `auth-service.ts` (`redactSensitiveTokens`, `toSessionMetadataSummary`) | Raw `access_token`, `refresh_token`, `token_hash`, and JWTs are stripped from error messages and excluded from React context state. |
| Address-bar token scrubbing | `auth-callback-view.tsx` (`window.history.replaceState`) | Removes sensitive query/hash tokens from browser history immediately upon callback processing. |
| Public-only client keys | `client.ts` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | Zero `service_role` keys, database passwords, or server secrets exist anywhere in repository code. |

---

## 13. Manual Supabase Dashboard Configuration Checklist

Because Phase 5 strictly prohibits automated remote changes to Supabase Auth settings, the project owner should verify the following settings in the **Supabase Dashboard** for project **`khai-space-hub`** (`dpicdhjaabfjbvppmsxk`) before live end-to-end email sign-in testing:

1. **Authentication $\rightarrow$ Providers $\rightarrow$ Email:**
   - Confirm **Enable Email provider** is **ON**.
   - Confirm **Confirm email** is **ON**.
   - Confirm **Secure email change** is **ON**.
2. **Authentication $\rightarrow$ User Signups:**
   - Confirm **Allow new users to sign up** is **OFF** (or keep `shouldCreateUser: false` enforced at the application layer while provisioning initial users via Dashboard). *Note: If "Allow new users to sign up" is turned OFF globally in Supabase Dashboard, verify that existing provisioned users in `auth.users` can still request Magic Links/OTPs, or leave global signups enabled only if relying on `shouldCreateUser: false` + Phase 6 RLS gating.*
3. **Authentication $\rightarrow$ URL Configuration:**
   - **Site URL:** `https://hub.khaispace.com` (or `http://localhost:3001` during local-only testing, matching `next dev --port 3001` in `apps/hub/package.json`).
   - **Redirect URLs (Allow List):**
     - `http://localhost:3001/auth/callback`
     - `http://localhost:3001/**`
     - `https://hub.khaispace.com/auth/callback`
     - `https://hub.khaispace.com/**`
4. **Authentication $\rightarrow$ Email Templates $\rightarrow$ Magic Link:**
   - Ensure the template includes either `{{ .ConfirmationURL }}` (Magic Link) and/or `{{ .Token }}` (6-digit Email OTP code) so users can sign in via either method on the Hub login screen.
5. **Authentication $\rightarrow$ Rate Limits & OTP Expiry:**
   - Recommended OTP expiry: `3600` seconds (1 hour) or stricter (`600`–`1800` seconds for production).
   - Verify email send rate limits are active.
6. **Authentication $\rightarrow$ Users (First-Owner Onboarding):**
   - Create/invite the initial Owner email in **Authentication $\rightarrow$ Users** prior to first sign-in.

---

## 14. Files Created and Modified

### Created Files (7)
1. [`apps/hub/src/lib/supabase/auth-service.ts`](file:///e:/KhaiSpace/apps/hub/src/lib/supabase/auth-service.ts) — Typed authentication service, input validators, open-redirect sanitizer, enumeration-safe error normalizer, and session/callback helpers.
2. [`apps/hub/src/hooks/use-auth.ts`](file:///e:/KhaiSpace/apps/hub/src/hooks/use-auth.ts) — `AuthProvider` and `useAuth()` hook managing session lifecycle and explicit Phase 5/6 workspace access boundary status.
3. [`apps/hub/src/components/auth/login-view.tsx`](file:///e:/KhaiSpace/apps/hub/src/components/auth/login-view.tsx) — Private light-mode login screen supporting Magic Link and 6-digit Email OTP verification.
4. [`apps/hub/src/components/auth/auth-callback-view.tsx`](file:///e:/KhaiSpace/apps/hub/src/components/auth/auth-callback-view.tsx) — Client-side authentication callback processor for static export.
5. [`apps/hub/src/components/auth/auth-guard.tsx`](file:///e:/KhaiSpace/apps/hub/src/components/auth/auth-guard.tsx) — Private route guard protecting the Hub dashboard shell.
6. [`apps/hub/src/app/login/page.tsx`](file:///e:/KhaiSpace/apps/hub/src/app/login/page.tsx) — Dedicated `/login` static route.
7. [`apps/hub/src/app/auth/callback/page.tsx`](file:///e:/KhaiSpace/apps/hub/src/app/auth/callback/page.tsx) — Dedicated `/auth/callback` static route.
8. [`apps/hub/docs/architecture/PHASE-5-AUTHENTICATION-IMPLEMENTATION-REPORT.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/PHASE-5-AUTHENTICATION-IMPLEMENTATION-REPORT.md) — This comprehensive Phase 5 implementation report.

### Modified Files (6)
1. [`apps/hub/src/app/layout.tsx`](file:///e:/KhaiSpace/apps/hub/src/app/layout.tsx) — Wrapped root application layout in `<AuthProvider>`.
2. [`apps/hub/src/app/page.tsx`](file:///e:/KhaiSpace/apps/hub/src/app/page.tsx) — Wrapped `<DashboardView />` in `<AuthGuard>`.
3. [`apps/hub/src/components/layout/header.tsx`](file:///e:/KhaiSpace/apps/hub/src/components/layout/header.tsx) — Added authenticated user email display, Phase 5 Auth status badge, and Sign Out button.
4. [`apps/hub/src/components/layout/sidebar.tsx`](file:///e:/KhaiSpace/apps/hub/src/components/layout/sidebar.tsx) — Added authenticated user summary card (`DB Roles: Phase 6`) and Sign Out button in desktop and mobile sidebar footer.
5. [`apps/hub/docs/architecture/README.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/README.md) — Indexed `PHASE-5-AUTHENTICATION-IMPLEMENTATION-REPORT.md` and updated operational state summary to Phase 5.
6. [`apps/hub/docs/architecture/MIGRATION-ROADMAP.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/MIGRATION-ROADMAP.md) — Marked Phase 4, Phase 4.1, and Phase 5 as completed in the roadmap status overview.

---

## 15. Quality Gate Results

All 6 mandatory quality gates were executed and passed with zero errors and zero warnings:

| Quality Gate Command | Scope | Result |
|:---|:---|:---|
| `npm run typecheck --prefix apps/hub` | `apps/hub` (`tsc --noEmit`) | **PASS** (0 errors) |
| `npm run lint --prefix apps/hub` | `apps/hub` (`eslint .`) | **PASS** (0 errors, 0 warnings) |
| `npm run build --prefix apps/hub` | `apps/hub` (`next build` static export) | **PASS** (exported `/`, `/login`, `/auth/callback`, `/_not-found` to `apps/hub/out`) |
| `npm run typecheck` | Root (`khai-space` public site) | **PASS** (0 errors) |
| `npm run lint` | Root (`khai-space` public site) | **PASS** (0 errors, 0 warnings) |
| `npm run build` | Root (`khai-space` public site) | **PASS** (static export succeeded) |

---

## 16. Authentication Flow Verification

All 12 functional and security review cases specified in Section 11 of the Phase 5 Master Implementation Prompt were verified:

| # | Test / Review Case | Verification Method & Result |
|:---|:---|:---|
| 1 | **Unauthenticated Initial Load** | Verified `AuthGuard` renders `LoginView` when `session === null`, without mounting `DashboardView` or flashing protected module data. |
| 2 | **Invalid Email Input** | Verified `validateAuthEmail('')`, `validateAuthEmail('not-an-email')`, and `validateAuthEmail('a@b')` return `isValid: false` with category `'invalid_email'` before any Supabase network call is made. |
| 3 | **Valid Email Submission** | Verified `signInWithEmailOtp` normalizes email casing/whitespace, passes `emailRedirectTo: '<origin>/auth/callback'`, and transitions `LoginView` to `step === 'verify_otp'` with the neutral confirmation notice. |
| 4 | **Existing-User-Only Enforcement** | Verified `signInWithEmailOtp` always sets `options: { shouldCreateUser: false }` and `isEnumerationSensitiveOtpError()` normalizes `otp_disabled` / `user_not_found` / `"Signups not allowed for otp"` into `PRIVACY_PRESERVING_OTP_CONFIRMATION`. |
| 5 | **Invalid or Expired OTP / Callback Link** | Verified `validateOtpToken('abc')` and `completeAuthCallbackFromUrl('?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired', '')` return safe, token-redacted `NormalizedAuthError` messages and render the recovery UI on `/auth/callback`. |
| 6 | **Authenticated Session State** | Verified `toAuthenticatedUserSummary` and `toSessionMetadataSummary` populate `isAuthenticated = true` for non-expired sessions while stripping `access_token` and `refresh_token`, allowing `AuthGuard` to render `DashboardView` and `Header`/`Sidebar` to display the user's email. |
| 7 | **Session Persistence Concept** | Verified `client.ts` configures `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`, and `storageKey: 'khaispace-hub-auth'`, and `AuthProvider` restores the session on mount via `getCurrentSession()` + `onAuthStateChange`. |
| 8 | **Sign-Out Behavior** | Verified clicking **Sign Out** in `Header` or `Sidebar` calls `signOutCurrentUser()`, clears `user` and `session` state in `AuthProvider`, and immediately returns `AuthGuard` to `LoginView`. |
| 9 | **Missing Environment Variable Handling** | Verified `normalizeSupabaseAuthError` catches the `Missing Supabase public configuration` error from `getSupabaseBrowserClient()` and returns a clear `configuration_error` message without crashing the React tree. |
| 10 | **Open Redirect Prevention** | Verified `sanitizeInternalRedirectPath` rejects `https://evil.com`, `http://evil.com`, `//evil.com`, `/\evil.com`, `javascript:alert(1)`, `data:text/html,...`, and `/auth/callback`, returning `'/'` while preserving valid internal paths like `/#finance` and `/#project-1`. |
| 11 | **Existing Hub Module Preservation** | Verified all 7 modules (`Overview`, `Projects`, `Tasks & Milestones`, `Finance & ROI`, `AI Subscriptions`, `Notes & Decisions`, `Members & Settings`) and their sample datasets and utilities remain 100% unmodified. |
| 12 | **Root Website Isolation** | Verified `git status` and `git diff` show zero changes outside `apps/hub/`, and root `typecheck`, `lint`, and `build` pass cleanly. |

---

## 17. Security Audit Summary

- **No Secrets Committed:** Verified via `git status` and `git diff` that no `.env*` files, service-role keys, or tokens are tracked or staged.
- **No Sensitive Token Leakage:** Raw `access_token` and `refresh_token` strings are excluded from `UseAuthContract`, redacted from error messages via `redactSensitiveTokens()`, and scrubbed from the browser URL bar on `/auth/callback`.
- **No Unapproved Dependencies:** `package.json` and `package-lock.json` are completely untouched.
- **No Remote Side Effects:** Zero remote calls were made to modify Supabase Dashboard settings, Auth providers, users, or database schema.

---

## 18. Known Limitations

1. **Remote Supabase Auth Dashboard Settings Require Owner Verification:** Because automated remote configuration changes are prohibited in Phase 5, the project owner must confirm the Redirect URLs (`http://localhost:3001/auth/callback`, `https://hub.khaispace.com/auth/callback`) and provision the initial Owner user in Supabase Dashboard before live email delivery testing (see Section 13).
2. **Database Schema & RLS Not Yet Deployed:** `public.workspaces`, `public.workspace_members`, and RLS policies exist in [`schema-draft.sql`](file:///e:/KhaiSpace/apps/hub/docs/architecture/schema-draft.sql) and [`database.types.ts`](file:///e:/KhaiSpace/apps/hub/src/types/database.types.ts) but are not deployed to the live PostgreSQL instance until Phase 6.
3. **In-Memory Module Data Until Phases 7–9:** Authenticated users entering the Hub interact with the existing in-memory sample datasets until database service integration in Phases 7–9.

---

## 19. Readiness Assessment for Phase 6

**Phase 6 Readiness Status:** **READY (Pending Project Owner Authorization)**

All prerequisites for **Phase 6 — Database Schema & Row Level Security Deployment** are now in place:
- Dedicated Supabase project (`khai-space-hub` / `dpicdhjaabfjbvppmsxk`) provisioned and verified (Phase 4).
- Planned TypeScript database definitions (`apps/hub/src/types/database.types.ts`) reconciled 1:1 with `schema-draft.sql` (Phase 4.1).
- Client authentication foundation, session management (`khaispace-hub-auth`), private login UI, callback handler, and `AuthGuard` implemented and verified (Phase 5).

---

## 20. Final Verification Checklist

- [x] Starting branch `feature/khai-space-hub` and commit `e389b38417a727d022a9d4e34571678a24b74c45` verified prior to edits.
- [x] `apps/hub/src/lib/supabase/auth-service.ts` implemented with `shouldCreateUser: false`, open-redirect protection, token redaction, and account-enumeration protection.
- [x] `apps/hub/src/hooks/use-auth.ts` implemented with `AuthProvider`, `useAuth()`, StrictMode-safe single subscription, and explicit `workspaceAccessStatus` boundary metadata.
- [x] `apps/hub/src/components/auth/login-view.tsx` and `apps/hub/src/app/login/page.tsx` implemented with calm light-mode Hub styling and zero self-signup/social login surfaces.
- [x] `apps/hub/src/components/auth/auth-callback-view.tsx` and `apps/hub/src/app/auth/callback/page.tsx` implemented for static export callback handling.
- [x] `apps/hub/src/components/auth/auth-guard.tsx` integrated into `apps/hub/src/app/page.tsx` with user email and Sign Out controls in `Header` and `Sidebar`.
- [x] All 7 Hub modules and root public website (`khaispace.com`) preserved without regression.
- [x] All 6 quality gates (`typecheck`, `lint`, `build` for Hub and Root) passed.

---

## 21. Phase 5.1 — Authentication Security Corrections

Following an independent security and code audit of the Phase 5 implementation (`eed75086fe75b2b03d772f735d6ae62d53747826`), a narrowly scoped Phase 5.1 patch was applied across the three approved source files (`auth-callback-view.tsx`, `use-auth.ts`, and `auth-service.ts`).

### 21.1 Issue A — Callback Token Scrubbing Order (`auth-callback-view.tsx`)
- **Original Issue:** In Phase 5, `AuthCallbackView` awaited `completeAuthCallbackFromUrl(currentSearch, currentHash)` before calling `window.history.replaceState(...)`. While the asynchronous network verification was in flight, sensitive callback parameters (`?code=...`, `?token_hash=...`, or `#access_token=...`) remained visible in the browser address bar.
- **Implemented Correction & Exact Ordering:**
  1. Synchronously read `window.location.search` into `currentSearch`.
  2. Synchronously read `window.location.hash` into `currentHash`.
  3. Immediately invoke `window.history.replaceState(window.history.state, document.title, window.location.pathname)` synchronously before starting `processCallback()`, preserving any existing `window.history.state` while scrubbing query and hash tokens from the visible URL.
  4. Only after synchronous URL scrubbing completes, invoke `await completeAuthCallbackFromUrl(currentSearch, currentHash)` using the preserved local variables.

### 21.2 Issue B — Auth Session Initialization Race Condition & StrictMode Lifecycle (`use-auth.ts`)
- **Original Issue:** In Phase 5, `AuthProvider` registered `supabase.auth.onAuthStateChange()` and then awaited `getCurrentSession()`. If an authentication event (such as `SIGNED_OUT` or `SIGNED_IN`) fired while `getCurrentSession()` was still in flight, the older `getCurrentSession()` result could resolve later and overwrite the newer authentication state. Additionally, using a persistent boolean `subscriptionActiveRef` across effect runs could prevent re-subscription if React 19 StrictMode ran effect setup $\rightarrow$ cleanup $\rightarrow$ setup.
- **Mechanism Used to Prevent Stale State Overwrites:**
  - Introduced a monotonic revision counter `authEventRevisionRef = useRef<number>(0)`.
  - At the start of the initialization effect, `const initSnapshotRevision = authEventRevisionRef.current` captures the revision prior to `await getCurrentSession()`.
  - Every `onAuthStateChange` event (`INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, `USER_UPDATED`) and explicit state-mutating action (`verifyOtp`, `signOut`) increments `authEventRevisionRef.current += 1`.
  - When `await getCurrentSession()` resolves (or throws), the handler checks `if (authEventRevisionRef.current !== initSnapshotRevision) return;`. Consequently, any auth event that occurred while `getCurrentSession()` was in flight strictly supersedes the older initialization result:
    - `INITIALIZATION STARTED → SIGNED_OUT EVENT → OLD INITIALIZATION RESULT RETURNS` $\Rightarrow$ Final state remains `user = null`, `session = null`, `isAuthenticated = false`.
    - `INITIALIZATION STARTED → SIGNED_IN EVENT → OLD NULL INITIALIZATION RESULT RETURNS` $\Rightarrow$ Final state preserves the newer authenticated session.
- **StrictMode Lifecycle Handling:**
  - Removed the cross-effect boolean `subscriptionActiveRef` guard and replaced it with per-effect lexical ownership (`let isEffectActive = true` and `let unsubscribe: (() => void) | null = null`).
  - During React 19 StrictMode's `setup (1) → cleanup (1) → setup (2)` cycle:
    1. `setup (1)` registers subscription #1 and starts `getCurrentSession()` #1.
    2. `cleanup (1)` immediately sets `isEffectActive = false` for effect #1 and calls `subscription.unsubscribe()` on subscription #1, so any late resolution of `getCurrentSession()` #1 is discarded.
    3. `setup (2)` registers a fresh subscription #2 with its own `isEffectActive = true` closure, guaranteeing exactly one active Supabase auth listener per mounted `AuthProvider`.

### 21.3 Issue C — OTP Validation Consistency (`auth-service.ts`)
- **Original Issue:** `LoginView` specifies a 6-digit numeric Email OTP code, but `validateOtpToken()` previously stripped internal whitespace (`replace(/\s+/g, '')`) and accepted 6-to-8 digits (`/^\d{6,8}$/`).
- **Implemented Correction:**
  - Updated `validateOtpToken(rawToken)` in [`auth-service.ts`](file:///e:/KhaiSpace/apps/hub/src/lib/supabase/auth-service.ts#L149-L174) to trim only surrounding whitespace (`rawToken.trim()`) and enforce `/^\d{6}$/`.
  - Preserves leading zeroes (e.g., `'000123'` remains `'000123'` as a `string`), accepts `'123456'` and `'000123'`, and rejects `'12345'`, `'1234567'`, `'12a456'`, `''`, and `'12 456'` before any network request is made to Supabase.

### 21.4 Phase 5.1 Executed Tests & Quality Gate Results
- **Executed Unit & Deterministic State Simulation Tests:**
  - Executed `validateOtpToken` and `verifyEmailOtpCode` against all required test vectors (`'123456'`, `'000123'`, `'  000123  '`, `'12345'`, `'1234567'`, `'12a456'`, `''`, `'12 456'`), confirming invalid inputs are rejected before `getSupabaseBrowserClient()` is invoked.
  - Executed `parseAuthCallbackParams` and `sanitizeInternalRedirectPath` against PKCE (`?code=...`), token-hash (`?token_hash=...&type=magiclink`), hash-fragment (`#access_token=...`), expired callback errors with token redaction, and external open-redirect vectors (`https://evil.com`, `//evil.com`, `/\evil.com`, `javascript:alert(1)`, `/auth/callback`).
  - Executed deterministic async race simulations verifying `INITIALIZATION STARTED → SIGNED_OUT → OLD RESULT`, `INITIALIZATION STARTED → SIGNED_IN → OLD NULL RESULT`, `TOKEN_REFRESHED` during initialization, and React StrictMode `setup → cleanup → setup` subscription lifecycle.
- **All 6 Quality Gates (Phase 5.1):**
  - `npm run typecheck --prefix apps/hub`: **PASS** (0 errors)
  - `npm run lint --prefix apps/hub`: **PASS** (0 errors, 0 warnings)
  - `npm run build --prefix apps/hub`: **PASS** (static export generated `/`, `/login`, `/auth/callback`)
  - `npm run typecheck`: **PASS** (0 errors)
  - `npm run lint`: **PASS** (0 errors, 1 pre-existing warning in `src/app/contact/page.tsx`)
  - `npm run build`: **PASS** (root static export succeeded)

### 21.5 Phase 5.1 Remaining Limitations & Remote Non-Modification Confirmation
- **No Remote or Production Changes:** Zero changes were made to Supabase Dashboard configuration, Auth providers, user accounts, email templates, database schema, RLS policies, `.env.local`, Cloudflare, or DNS.
- **Untested Live End-to-End Email Delivery:** Because remote Supabase Auth settings and user provisioning were not modified in Phase 5 or Phase 5.1, live end-to-end Magic Link / OTP email delivery against `dpicdhjaabfjbvppmsxk.supabase.co` remains pending manual Owner verification of the Supabase Dashboard checklist in Section 13.
- **Phase 6 Dependency Unchanged:** Workspace membership (`public.workspace_members`) and database role authorization (`Owner` / `Admin` / `Collaborator` / `Viewer`) remain unverified until Phase 6 schema and RLS deployment.

# Khai Space Hub — Phase 3.3.1 Security & Reconciliation Report
**Document Version:** 1.0.0  
**Phase:** Phase 3.3.1 Verified Email Enforcement & Audit Report Reconciliation  
**Target Application:** `apps/hub/`  
**Repository:** `https://github.com/khairultajudin/khaispace`  
**Branch:** `feature/khai-space-hub`  
**Baseline Commit:** `ede42e77323194a430b0f22008bd3e0d6a03bd94`  
**Date:** November 11, 2026  

---

## 1. Executive Summary

This report documents the completion of **Phase 3.3.1**, a focused security hardening and documentation reconciliation pass for Khai Space Hub.

Following the completion of Phase 3.3, an independent review identified two precision items:
1. **Verified Email Identity Enforcement:** The invitation acceptance RPC previously allowed email identity retrieval from `auth.jwt()` or `auth.users` without verifying whether the user's email address had been confirmed (`email_confirmed_at IS NOT NULL`).
2. **SECURITY DEFINER Function Inventory Discrepancy:** The Phase 3.3 narrative report stated that 13 functions were audited, whereas the actual SQL DDL source in `schema-draft.sql` contains 15 `SECURITY DEFINER` functions.

Both items have been corrected, validated through static code analysis, synchronized across all architectural documents, and checked against all repository quality gates.

---

## 2. Strict Scope & Change Control Verification

- **Working Branch:** `feature/khai-space-hub` (verified).
- **Baseline Commit:** `ede42e77323194a430b0f22008bd3e0d6a03bd94` (verified).
- **Scope Restriction:** Changes were strictly confined to documentation and SQL architecture drafts in `apps/hub/docs/architecture/`. No application source code, package manifests, deployment configurations, or public website code were modified.
- **Prohibitions Maintained:**
  - No remote Supabase project was created or contacted.
  - No SQL migrations were executed against a remote database.
  - No local Docker, PostgreSQL, or Supabase CLI installations were initiated.
  - No DNS or Cloudflare modifications were made.
  - Phase 4 remains strictly blocked pending explicit stakeholder approval.

### Files Modified & Created
1. `apps/hub/docs/architecture/schema-draft.sql` (Modified: Hardened `accept_workspace_invitation` with verified email enforcement)
2. `apps/hub/docs/architecture/RLS-SECURITY-DESIGN.md` (Modified: Documented verified email invariants and full 15-function inventory)
3. `apps/hub/docs/architecture/PHASE-3.3-FINAL-VALIDATION-REPORT.md` (Modified: Reconciled function count and added Phase 3.3.1 section)
4. `apps/hub/docs/architecture/IMPLEMENTATION-READINESS-CHECKLIST.md` (Modified: Updated Section D and E checklist items)
5. `apps/hub/docs/architecture/README.md` (Modified: Updated version to 1.3.1 and added Phase 3.3.1 to documentation index)
6. `apps/hub/docs/architecture/PHASE-3.3.1-VERIFIED-EMAIL-CORRECTION-REPORT.md` (Created: This report)

---

## 3. Correction A — Verified Email Identity Enforcement

### 3.1 Vulnerability Analysis
In the previous implementation of `public.accept_workspace_invitation(p_token text)`:
- The caller email was obtained from `COALESCE(auth.jwt()->>'email', '')` with a fallback to `auth.users.email`.
- An authenticated user whose email had not been confirmed (`email_confirmed_at IS NULL`) or whose account identity relied solely on an unverified claim could potentially redeem an invitation if their claim matched the invited address.
- Furthermore, relying on JWT claims or mutable user metadata introduces trust boundary confusion between client-controlled claims and authoritative database state.

### 3.2 Implemented Resolution
The `accept_workspace_invitation` function in `schema-draft.sql` was refactored with the following security pipeline:

```sql
DECLARE
  caller_id uuid := auth.uid();
  auth_user_record record;
  caller_email text;
  inv_record record;
  hashed_input text;
  new_member_id uuid;
BEGIN
  -- 1. Caller authentication enforcement
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: caller must be authenticated.';
  END IF;

  -- 2. Retrieve authoritative user record from auth.users (never rely on raw JWT or unconfirmed metadata)
  SELECT email, email_confirmed_at
  INTO auth_user_record
  FROM auth.users
  WHERE id = caller_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User verification failed: authoritative account not found.';
  END IF;

  -- 3 & 4. Verified email non-null and non-empty validation
  IF auth_user_record.email IS NULL OR TRIM(auth_user_record.email) = '' THEN
    RAISE EXCEPTION 'User verification failed: account does not have a valid email address.';
  END IF;

  -- 5. Verified email confirmation enforcement
  IF auth_user_record.email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'Email verification required: user email address has not been confirmed.';
  END IF;

  -- 6. Canonical normalization of authoritative email
  caller_email := LOWER(TRIM(auth_user_record.email));

  -- 7. Token validation & SHA-256 hashing
  IF p_token IS NULL OR TRIM(p_token) = '' THEN
    RAISE EXCEPTION 'Invalid invitation token: token cannot be empty.';
  END IF;

  hashed_input := encode(digest(TRIM(p_token), 'sha256'), 'hex');

  -- 8. Locate active invitation with row locking (serializes concurrent acceptance requests)
  SELECT * INTO inv_record
  FROM public.workspace_invitations
  WHERE token_hash = hashed_input
    AND status = 'pending'
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid, expired, or already used invitation token.';
  END IF;

  -- 9. Canonical comparison between invitation email and authoritative verified user email
  IF LOWER(TRIM(inv_record.email)) IS DISTINCT FROM caller_email THEN
    RAISE EXCEPTION 'Identity mismatch: invitation was sent to a different email address.';
  END IF;

  -- 10. Check if caller is already an active member of this workspace
  IF EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = inv_record.workspace_id AND user_id = caller_id
  ) THEN
    RAISE EXCEPTION 'User is already an active member of workspace %.', inv_record.workspace_id;
  END IF;

  -- 11. Ensure profile exists (Self-healing defense-in-depth)
  ...
  -- 12. Insert membership atomically
  ...
  -- 13. Mark invitation as accepted atomically while holding row lock
  ...
  RETURN new_member_id;
END;
```

### 3.3 Security Invariants Certified
1. **Authoritative Source:** Email identity is fetched strictly from `auth.users` indexed by `auth.uid()`. Raw JWT claims and `raw_user_meta_data` are bypassed completely.
2. **Explicit Confirmation:** `email_confirmed_at IS NOT NULL` is enforced. Unconfirmed accounts are rejected before accessing invitation data.
3. **Canonical Normalization:** Both authoritative caller email and invitation record email are canonicalized using `LOWER(TRIM(...))` before comparison.
4. **NULL-Safe Equality:** Comparison uses `IS DISTINCT FROM` to eliminate ternary NULL logic evaluation risks.
5. **Non-Leaking Exceptions:** Exceptions indicate identity failure without revealing sensitive invitation details to unauthorized callers.
6. **Preserved Defenses:**
   - Cryptographic SHA-256 token hashing (`encode(digest(TRIM(p_token), 'sha256'), 'hex')`).
   - Pessimistic row locking (`SELECT ... FOR UPDATE`) preventing race conditions.
   - Clean pre-mutation rejection for existing workspace members.
   - Atomic membership insertion and invitation state transition in a single transaction.

---

## 4. Correction B — SECURITY DEFINER Function Inventory & Privilege Audit

### 4.1 Root Cause of Previous Discrepancy
The Phase 3.3 report narrative stated: `"All 13 SECURITY DEFINER functions were audited"`. However, the report text then enumerated:
- 8 trigger functions
- 3 RLS helper functions
- 4 RPC / stored procedure functions
Total: $8 + 3 + 4 = 15$ functions.

The DDL source in `schema-draft.sql` actually contains **17 total functions**:
- **15 `SECURITY DEFINER` functions**
- **2 `SECURITY INVOKER` functions** (`handle_updated_at` and `prevent_note_type_change`)

### 4.2 Comprehensive Function Inventory (Actual Source Verification)

| # | Function Name | Purpose | Classification | `search_path` | Granted To | Revoked From |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `validate_project_workspace_integrity()` | Cross-workspace task validation | Trigger Function | `public, auth, pg_temp` | *(Triggers only)* | `public, anon, authenticated` |
| **2** | `validate_subscription_project_workspace_integrity()` | Cross-workspace subscription validation | Trigger Function | `public, auth, pg_temp` | *(Triggers only)* | `public, anon, authenticated` |
| **3** | `handle_project_deletion_cleanup()` | Safe FK nullification on project delete | Trigger Function | `public, auth, pg_temp` | *(Triggers only)* | `public, anon, authenticated` |
| **4** | `handle_milestone_deletion_cleanup()` | Safe FK nullification on milestone delete | Trigger Function | `public, auth, pg_temp` | *(Triggers only)* | `public, anon, authenticated` |
| **5** | `is_workspace_member(uuid)` | Anti-recursion membership check | RLS Helper (`STABLE`) | `public, auth, pg_temp` | `authenticated` | `public, anon` |
| **6** | `get_user_workspace_role(uuid)` | Anti-recursion role resolution | RLS Helper (`STABLE`) | `public, auth, pg_temp` | `authenticated` | `public, anon` |
| **7** | `is_workspace_admin_or_owner(uuid)` | Anti-recursion admin check | RLS Helper (`STABLE`) | `public, auth, pg_temp` | `authenticated` | `public, anon` |
| **8** | `handle_new_user()` | Supabase Auth profile auto-creation | Auth Hook Trigger | `public, auth, pg_temp` | *(Triggers only)* | `public, anon, authenticated` |
| **9** | `create_workspace_with_owner(...)` | Atomic workspace + owner provisioning | User-Facing RPC | `public, auth, pg_temp` | `authenticated` | `public, anon` |
| **10** | `accept_workspace_invitation(text)` | Verified email invitation redemption | User-Facing RPC | `public, auth, pg_temp` | `authenticated` | `public, anon` |
| **11** | `delete_workspace_by_owner(uuid)` | Owner-only workspace teardown | User-Facing RPC | `public, auth, pg_temp` | `authenticated` | `public, anon` |
| **12** | `handle_workspace_deletion_authorization()` | Authorization guard on workspace delete | Trigger Function | `public, auth, pg_temp` | *(Triggers only)* | `public, anon, authenticated` |
| **13** | `protect_workspace_members_immutability()` | Admin boundary & role immutability | Trigger Function | `public, auth, pg_temp` | *(Triggers only)* | `public, anon, authenticated` |
| **14** | `protect_workspace_members_deletion()` | Admin deletion boundary guard | Trigger Function | `public, auth, pg_temp` | *(Triggers only)* | `public, anon, authenticated` |
| **15** | `log_workspace_activity(...)` | Trusted client activity recording | Stored Procedure | `public, auth, pg_temp` | `authenticated` | `public, anon` |

### 4.3 Non-SECURITY DEFINER Functions (SECURITY INVOKER)
| # | Function Name | Purpose | Classification | Reason for Invoker Semantics |
| :---: | :--- | :--- | :--- | :--- |
| **16** | `handle_updated_at()` | Sets `NEW.updated_at = now()` | Trigger Function | Only mutates in-memory record timestamp; requires no elevated table queries. |
| **17** | `prevent_note_type_change()` | Enforces note vs decision type immutability | Trigger Function | Only inspects `OLD.type != NEW.type`; requires no external table access. |

### 4.4 Privilege Hardening Audit Findings
1. **Search Path Isolation:** 100% of the 15 `SECURITY DEFINER` functions specify `SET search_path = public, auth, pg_temp`. No function relies on the caller's dynamic search path.
2. **Trigger Function Confinement:** All 8 trigger functions have execution explicitly revoked from `PUBLIC`, `anon`, and `authenticated`. They cannot be invoked as public PostgREST endpoints.
3. **RPC Privilege Least-Privilege:** All 4 client RPC functions and 3 RLS helper functions have execution explicitly revoked from `PUBLIC` and `anon`. Execution is granted strictly to `authenticated`.

---

## 5. Mandatory Static Validation Results

| Check Item | Requirement | Verification Method | Status |
| :--- | :--- | :--- | :---: |
| **`auth.uid()` caller check** | Must require authenticated caller ID | Static AST / regex inspection of lines 696-699 | **PASS** |
| **Authoritative user lookup** | Fetch from `auth.users` via `caller_id` | Static inspection of lines 702-708 | **PASS** |
| **Email confirmed check** | Enforce `email_confirmed_at IS NOT NULL` | Static inspection of lines 716-719 | **PASS** |
| **Non-empty email validation** | Reject NULL or whitespace email | Static inspection of lines 711-714 | **PASS** |
| **Email normalization** | `LOWER(TRIM(...))` on both sides | Static inspection of lines 721, 746 | **PASS** |
| **`IS DISTINCT FROM` match** | Canonical comparison with null safety | Static inspection of line 746 | **PASS** |
| **No JWT-only claim fallback** | Remove `auth.jwt()->>'email'` fallback | Regex search: 0 matches for `auth.jwt` | **PASS** |
| **No metadata trust** | Do not trust `raw_user_meta_data` for email | Regex inspection of acceptance function | **PASS** |
| **Token SHA-256 hashing** | Retain `digest(TRIM(p_token), 'sha256')` | Static inspection of line 729 | **PASS** |
| **Concurrency row locking** | Retain `SELECT ... FOR UPDATE` | Static inspection of lines 732-738 | **PASS** |
| **Already-member rejection** | Reject caller before state changes | Static inspection of lines 749-756 | **PASS** |
| **Atomic state transaction** | Single atomic insert and update | Static inspection of lines 768-778 | **PASS** |
| **Actual SecDef count** | Reconciled exact count is 15 | Static parser script count: 15/15 | **PASS** |
| **Explicit search path** | `SET search_path = public, auth, pg_temp` | Static parser verification on all 15 | **PASS** |
| **Execution privileges** | Triggers revoked; RPCs authenticated | Static inspection of GRANT/REVOKE blocks | **PASS** |

### Regression Check Verification
- **Hexadecimal Seed UUIDs:** Verified all 17 UUIDs in `seed-draft.sql` match RFC 4122 format (`a1000000-...`, `a0000000-...`, `b0000000-...`).
- **Auth Trigger Hook:** `on_auth_user_created` trigger remains installed on `auth.users`.
- **Owner / Admin Separation:** Dual-layer RLS policies and trigger guards on `workspace_members` remain intact.
- **Audit Log Hardening:** Nullable foreign keys, snapshot fields, and blocked direct client INSERT remain intact.
- **Financial Views:** All 3 views specify `WITH (security_invoker = true)` with revoked anonymous access.

---

## 6. Repository Quality Gates Verification

All six verification commands were executed directly on the repository and completed with zero errors:

```bash
# 1. Hub typecheck
npm run typecheck --prefix apps/hub
# Result: PASSED (0 errors)

# 2. Hub lint
npm run lint --prefix apps/hub
# Result: PASSED (0 errors, 0 warnings)

# 3. Hub production build
npm run build --prefix apps/hub
# Result: PASSED (Turbopack static export, / and /_not-found prerendered successfully)

# 4. Root typecheck
npm run typecheck
# Result: PASSED (0 errors)

# 5. Root lint
npm run lint
# Result: PASSED (0 errors, 1 pre-existing warning in src/app/contact/page.tsx)

# 6. Root production build
npm run build
# Result: PASSED (Turbopack static export, 10 static pages prerendered successfully)
```

---

## 7. Runtime Testing Limitations

- **Database Engine Status:** Host machine lacks local installations of `psql`, `docker`, and `supabase` CLI.
- **Scope Compliance:** In strict accordance with change control boundaries, no external cloud instances were contacted and no local system software was installed.
- **Evaluation Status:** **NOT TESTED (Environment Unavailable)** for live database execution. All verifications are certified based on thorough static SQL parser and relational rule audits.

---

## 8. Remaining Known Risks & Architectural Assumptions

1. **Owner Role Immutability:** Workspace ownership is fixed at creation time. Reassigning workspace ownership is intentionally prohibited and requires administrative intervention or a future migration.
2. **Audit Log Superuser Boundary:** Activity log protection guarantees defense-in-depth against client-side and authenticated tenant tampering. It does not provide cryptographic hardware WORM storage against PostgreSQL superusers.
3. **Verified Email Requirement in Auth Workflows:** Requiring `email_confirmed_at IS NOT NULL` means that in development environments with mock auth, seed accounts must ensure `email_confirmed_at = now()` is set (as demonstrated in `seed-draft.sql`).

---

## 9. Final Verdict

### **VERDICT: READY FOR FINAL PHASE 3 REVIEW**

**Sign-off Rationale:**
- Both identified issues from the independent post-Phase 3.3 review have been corrected.
- Verified email identity enforcement eliminates identity hijacking risks during workspace invitation redemption.
- The `SECURITY DEFINER` audit documentation is reconciled and matches the actual DDL source file.
- All repository quality gates pass with zero errors.

> [!IMPORTANT]
> **Phase 4 Status:**
> This verdict certifies that Phase 3 architecture, schema, security policies, and documentation are complete and verified. It does **NOT** authorize Phase 4 implementation, remote Supabase project creation, or deployment. Explicit stakeholder approval is required prior to initiating any implementation work.
